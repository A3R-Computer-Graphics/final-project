"use strict"

class Geometry {
  static verticesBufferData = []
  static normalsBufferData = []
  static uvBufferData = []

  static bufferDataNeedsUpdate = true

  constructor({ vertices, normals, indices, uvCoordinates }, moveToDataImmediately = true) {
    this.bufferStartIndex = -1
    this.triangleVerticesCount = 0

    this.vertices = vertices
    this.normals = normals
    this.indices = indices
    this.uvCoordinates = uvCoordinates

    if (moveToDataImmediately) {
      this.moveToBufferData()
    }
  }

  static updateBuffersToRenderer(renderer) {
    if (!Geometry.bufferDataNeedsUpdate) {
      return
    }

    console.log('update buffers')

    let gl = renderer.gl
    let attributes = renderer.program.attribs

    // Update position buffer

    gl.bindBuffer(gl.ARRAY_BUFFER, renderer.verticesBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, flatten(this.verticesBufferData), gl.STATIC_DRAW)

    gl.vertexAttribPointer(attributes.vPosition, 4, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(attributes.vPosition)

    // Update UV coordinate buffer

    gl.bindBuffer(gl.ARRAY_BUFFER, renderer.texcoordsBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, flatten(this.uvBufferData), gl.STATIC_DRAW)

    gl.vertexAttribPointer(attributes.a_texcoord, 2, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(attributes.a_texcoord)

    // Update normals buffer

    gl.bindBuffer(gl.ARRAY_BUFFER, renderer.normalsBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, flatten(this.normalsBufferData), gl.STATIC_DRAW)

    gl.vertexAttribPointer(attributes.vNormal, 4, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(attributes.vNormal)

    Geometry.bufferDataNeedsUpdate = false
  }

  /**
   * Move vertices definition of this object to the static class bufferDataList
   * @param {*} autoComputeNormals 
   * @param {*} autoComputeUvCoordinate 
   */

  moveToBufferData(autoComputeNormals, autoComputeUvCoordinate) {
    let vertices = this.vertices,
      normals = this.normals,
      indices = this.indices,
      uvCoordinates = this.uvCoordinates

    let startIndex = Geometry.verticesBufferData.length
    this.bufferStartIndex = startIndex

    Geometry.populateMeshData({ vertices, normals, indices, uvCoordinates },
      startIndex, autoComputeNormals, autoComputeUvCoordinate)

    let endIndex = Geometry.verticesBufferData.length
    this.triangleVerticesCount = endIndex - startIndex

    this.vertices = undefined
    this.normals = undefined
    this.indices = undefined
    this.uvCoordinates = undefined

    Geometry.bufferDataNeedsUpdate = true
  }

  get movedToBufferData() {
    return this.bufferStartIndex >= 0
  }

  /**
   * Populate mesh data, which is made of vertices, indices, normals, and UV coordinates.
   * Vertieces and indices are required, but normals and UV coordinates can be computed
   * even though not perfect.
   * 
   * The autocompute variables are useful for objects that has no surface and meant
   * for representational only. For example, displaying Empty.
   * 
   * @param {*} meshData 
   * @param {*} autoComputeNormals if no vertex normals data is found, choose whether to
   * compute normals or use uniform dummy value instead.
   * @param {*} autoComputeUvCoordinate if no uv coordinates data is found, choose whether to
   * compute UV coordinates or use uniform dummy value instead.
   */

  static populateMeshData(meshData, startIndex, autoComputeNormals, autoComputeUvCoordinate) {
    if (startIndex === undefined) {
      startIndex = Geometry.verticesBufferData.length
    }

    if (autoComputeNormals === undefined) {
      autoComputeNormals = true
    }
    if (autoComputeUvCoordinate === undefined) {
      autoComputeUvCoordinate = true
    }

    const { vertices, indices, normals, uvCoordinates } = meshData

    let facesCount = indices.length
    let trianglesCount = indices.reduce((p, c) => p + c.length, 0) - facesCount * 2

    let geomVerts = this.verticesBufferData
    let geomNorms = this.normalsBufferData
    let geomUvs = this.uvBufferData

    let finalDataCount = startIndex + trianglesCount

    // Allocate empty space

    geomVerts.length = finalDataCount
    geomNorms.length = finalDataCount
    geomUvs.length = finalDataCount

    this.populateVerticesData(vertices, indices, startIndex)

    let normalsAvailable = !!normals
    let uvCoordinatesAvailable = !!uvCoordinates

    if (normalsAvailable) {
      this.populateNormalsData(normals, indices, startIndex)
    } else if (autoComputeNormals) {
      this.computeAndPopulateNormalsData(vertices, indices, startIndex)
    } else {
      this.populateNormalsDataWithDummy(indices, startIndex)
    }

    if (uvCoordinatesAvailable) {
      this.populateUvsData(uvCoordinates, indices, startIndex)
    } else if (autoComputeUvCoordinate) {
      this.computeAndPopulateUvsData(indices, startIndex)
    } else {
      this.populateUvsDataWithDummy(indices, startIndex)
    }
  }

  /**
   * Populate vertex position data for each face. If face is not a triangle
   * (contains > 3 vertices), it will be triangulated using triangle-fan style.
   * 
   * @param {*} vertices 
   * @param {*} indices 
   * @param {*} startIndex 
   */

  static populateVerticesData(vertices, indices, startIndex) {
    let geomVerts = this.verticesBufferData

    indices.forEach(indice => {

      let vertexCount = indice.length

      // Add fourth component

      let initVertices = new Array(vertexCount)

      indice.forEach((vertexIndex, i) => {
        let vertex = vertices[vertexIndex]
        initVertices[i] = [vertex[0], vertex[1], vertex[2], 1.0]
      })

      // Populate vertices location data in triangle fan style

      for (let i = 1; i < vertexCount - 1; i++) {
        geomVerts[startIndex++] = initVertices[0]
        geomVerts[startIndex++] = initVertices[i]
        geomVerts[startIndex++] = initVertices[i + 1]
      }
    })
  }

  /**
   * 
   * Populate vertex normals data for each face. If face is not a triangle
   * (contains > 3 vertices), it will be triangulated using triangle-fan style.
   * 
   * @param {*} normals 
   * @param {*} indices 
   * @param {*} startIndex 
   */

  static populateNormalsData(normals, indices, startIndex) {

    let geomNorms = this.normalsBufferData
    indices.forEach(indice => {
      let vertexCount = indice.length
      for (let i = 1; i < vertexCount - 1; i++) {
        geomNorms[startIndex++] = normals[0]
        geomNorms[startIndex++] = normals[i]
        geomNorms[startIndex++] = normals[i + 1]
      }
    })
  }

  /**
   * Compute normals for each faces. Normals are determined from first 3 vertex
   * and is flat shaded.
   * 
   * @param {*} normals 
   * @param {*} vertices 
   * @param {*} indices 
   * @param {*} startIndex 
   */

  static computeAndPopulateNormalsData(vertices, indices, startIndex) {

    let geomNorms = this.normalsBufferData

    indices.forEach(indice => {
      let a = vertices[indice[0]]
      let b = vertices[indice[1]]
      let c = vertices[indice[2]]

      let t1 = subtract(b, a)
      let t2 = subtract(c, b)
      let faceNormal = vec4(cross(t1, t2))

      let vertexCount = indice.length
      for (let i = 1; i < vertexCount - 1; i++) {
        geomNorms[startIndex++] = faceNormal
        geomNorms[startIndex++] = faceNormal
        geomNorms[startIndex++] = faceNormal
      }
    })

  }

  /**
   * Populate normals data (just to fill up the normals buffer) using uniform values
   * 
   * @param {*} indices 
   * @param {*} startIndex 
   * @param {*} dummyValue 
   */

  static populateNormalsDataWithDummy(indices, startIndex, dummyValue = [0, 1, 0]) {

    let geomNorms = this.normalsBufferData

    indices.forEach(indice => {
      let vertexCount = indice.length
      for (let i = 1; i < vertexCount - 1; i++) {
        geomNorms[startIndex++] = dummyValue
        geomNorms[startIndex++] = dummyValue
        geomNorms[startIndex++] = dummyValue
      }
    })

  }

  /**
   * Populate UV coordinates data in a triangle-fan style.
   * 
   * @param {*} uvCoordinates 
   * @param {*} indices 
   * @param {*} startIndex 
   */

  static populateUvsData(uvCoordinates, indices, startIndex) {

    // Flip UV data from Blender
    uvCoordinates = uvCoordinates.map(el => [el[0], 1 - el[1]])

    let geomUvs = this.uvBufferData
    let uvCoordIndex = 0

    indices.forEach(indice => {
      let vertexCount = indice.length

      for (let i = 1; i < vertexCount - 1; i++) {
        let cId = uvCoordIndex + i
        geomUvs[startIndex++] = uvCoordinates[uvCoordIndex]
        geomUvs[startIndex++] = uvCoordinates[cId]
        geomUvs[startIndex++] = uvCoordinates[cId + 1]
      }

      uvCoordIndex += vertexCount
    })
  }

  /**
   * Compute UV coordinates data using grid-like system.
   * Two adjacent triangles will be packed in single tile.
   * The tile number will fit square numbers.
   * 
   * Example: if a geometry contains 72 triangles, those 
   * 72 triangles will be packed inside 36 squares which
   * will be mapped in 1/6 * 1/6 resolution.
   * 
   * @param {*} indices 
   * @param {*} startIndex 
   */

  static computeAndPopulateUvsData(indices, startIndex) {
    let facesCount = indices.length
    let triangleCount = indices.reduce((p, c) => p + c.length, 0) - 2 * facesCount

    let squareCount = Math.ceil(triangleCount / 2)
    let texResolution = Math.ceil(Math.sqrt(squareCount))

    let scale = 1 / texResolution

    let a = [0, 0]
    let b = [1, 0]
    let c = [1, 1]

    let geomUvs = this.uvBufferData
    let tileIndex = 0

    indices.forEach(indices => {

      let vertexCount = indices.length

      for (let i = 1; i < vertexCount - 1; i++) {
        a = [0, 0]
        if (tileIndex % 2 === 0) {
          b = [1, 0]
          c = [1, 1]
        } else {
          b = [1, 1]
          c = [0, 1]
        }

        let squareIndex = parseInt(tileIndex / 2)
        let posX = squareIndex % texResolution
        let posY = parseInt(squareIndex / texResolution)

        let coordinates = [a, b, c]
        coordinates.forEach(coordinate => coordinate[1] = 1 - coordinate[1]) // Flip Y axis

        let [d, e, f] = translateThenScaleTileCoordinates(coordinates, posX, posY, scale)

        geomUvs[startIndex++] = d
        geomUvs[startIndex++] = e
        geomUvs[startIndex++] = f

        tileIndex++
      }
    })

  }

  /**
   * Populate UV data (just to fill up the normals buffer) using uniform values
   * @param {*} indices 
   * @param {*} startIndex 
   */

  static populateUvsDataWithDummy(indices, startIndex, dummyValue = [0, 1]) {

    let geomUvs = this.uvBufferData

    indices.forEach(indice => {
      let vertexCount = indice.length
      for (let i = 1; i < vertexCount - 1; i++) {
        geomUvs[startIndex++] = dummyValue
        geomUvs[startIndex++] = dummyValue
        geomUvs[startIndex++] = dummyValue
      }
    })

  }
}