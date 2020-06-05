"use strict"

class Geometry {
  static verticesBufferData = []
  static normalsBufferData = []
  static uvBufferData = []

  static bufferDataNeedsUpdate = true

  constructor({ vertices, normals, indices, uvCoordinates },
    moveToDataImmediately = true, wireframeMode = false, writeNormals = true, writeUvs = true) {
    this.vertexStartIndex = -1
    this.normalStartIndex = -1
    this.uvStartIndex = -1
    this.triangleVerticesCount = 0

    this.vertices = vertices
    this.normals = normals
    this.indices = indices
    this.uvCoordinates = uvCoordinates

    this.wireframeMode = wireframeMode !== undefined && wireframeMode !== null ? wireframeMode : false
    this.writeNormals = writeNormals !== undefined
    this.writeUvs = writeUvs

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
    let program, attributes

    program = renderer.program
    attributes = program.attribs

    gl.useProgram(program)

    // Update position buffer

    gl.bindBuffer(gl.ARRAY_BUFFER, renderer.verticesBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, flatten(this.verticesBufferData), gl.STATIC_DRAW)

    gl.vertexAttribPointer(attributes.a_pos, 3, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(attributes.a_pos)

    // Update UV coordinate buffer

    gl.bindBuffer(gl.ARRAY_BUFFER, renderer.texcoordsBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, flatten(this.uvBufferData), gl.STATIC_DRAW)

    gl.vertexAttribPointer(attributes.a_texcoord, 2, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(attributes.a_texcoord)

    // Update normals buffer

    gl.bindBuffer(gl.ARRAY_BUFFER, renderer.normalsBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, flatten(this.normalsBufferData), gl.STATIC_DRAW)

    gl.vertexAttribPointer(attributes.a_norm, 3, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(attributes.a_norm)

    Geometry.bufferDataNeedsUpdate = false
  }

  /**
   * Move vertices definition of this object to the static class bufferDataList
   * @param {*} autoComputeNormals 
   * @param {*} autoComputeUvCoordinate 
   */

  moveToBufferData() {
    let vertices = this.vertices,
      normals = this.normals,
      indices = this.indices,
      uvCoordinates = this.uvCoordinates

    this.vertexStartIndex = Geometry.verticesBufferData.length
    this.normalStartIndex = Geometry.normalsBufferData.length
    this.uvStartIndex = Geometry.uvBufferData.length

    Geometry._populateMeshData({ vertices, normals, indices, uvCoordinates },
      this.wireframeMode, this.writeNormals, this.writeUvs)

    let endIndex = Geometry.verticesBufferData.length
    this.triangleVerticesCount = endIndex - this.vertexStartIndex

    this.vertices = undefined
    this.normals = undefined
    this.indices = undefined
    this.uvCoordinates = undefined

    Geometry.bufferDataNeedsUpdate = true
  }

  get movedToBufferData() {
    return this.vertexStartIndex >= 0
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

  static _populateMeshData(meshData, wireframeMode, writeNormals, writeUvs) {
    const { vertices, indices, normals, uvCoordinates } = meshData
    let normalsAvailable = !!normals
    let uvCoordinatesAvailable = !!uvCoordinates

    let facesCount = indices.length
    let numVerts = indices.reduce((p, c) => p + c.length, 0)
    let numVertexInTris = numVerts - facesCount * 2
    let numVertexInEdge = numVerts * 2

    let vertexCount = wireframeMode ? numVertexInEdge : numVertexInTris

    writeNormals &= !wireframeMode
    writeUvs &= !wireframeMode

    // Write vertex data

    let geomVerts = this.verticesBufferData
    let startIndex = geomVerts.length
    geomVerts.length += vertexCount

    if (wireframeMode) {
      this.populateVerticesDataInWireframeMode(vertices, indices, startIndex)
    } else {
      this.populateVerticesData(vertices, indices, startIndex)
    }

    if (writeNormals) {
      let geomNorms = this.normalsBufferData
      startIndex = geomNorms.length
      geomNorms.length += vertexCount

      if (normalsAvailable) {
        this.populateNormalsData(normals, indices, startIndex)
      } else {
        this.computeAndPopulateNormalsData(vertices, indices, startIndex)
      }
    }

    if (writeUvs) {
      let geomUvs = this.uvBufferData
      startIndex = geomUvs.length
      geomUvs.length += vertexCount

      if (uvCoordinatesAvailable) {
        this.populateUvsData(uvCoordinates, indices, startIndex)
      } else {
        this.computeAndPopulateUvsData(indices, startIndex)
      }
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

      // Convert indices into real vertex coordinate

      let mappedVertices = new Array(vertexCount)
      indice.forEach((vertexIndex, i) => {
        mappedVertices[i] = vertices[vertexIndex]
      })

      // Populate vertices location data in triangle fan style

      for (let i = 1; i < vertexCount - 1; i++) {
        geomVerts[startIndex++] = mappedVertices[0]
        geomVerts[startIndex++] = mappedVertices[i]
        geomVerts[startIndex++] = mappedVertices[i + 1]
      }
    })
  }


  static populateVerticesDataInWireframeMode(vertices, indices, startIndex) {
    let geomVerts = this.verticesBufferData

    indices.forEach(indice => {

      let vertexCount = indice.length

      // Convert indices into real vertex coordinate

      let mappedVertices = new Array(vertexCount)
      indice.forEach((vertexIndex, i) => {
        mappedVertices[i] = vertices[vertexIndex]
      })

      // write first edges
      for (let i = 0; i < vertexCount - 1; i++) {
        geomVerts[startIndex++] = mappedVertices[i]
        geomVerts[startIndex++] = mappedVertices[i + 1]
      }

      // write last edges
      geomVerts[startIndex++] = mappedVertices[vertexCount - 1]
      geomVerts[startIndex++] = mappedVertices[0]
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
      let faceNormal = vec3(cross(t1, t2))

      let vertexCount = indice.length
      for (let i = 1; i < vertexCount - 1; i++) {
        geomNorms[startIndex++] = faceNormal
        geomNorms[startIndex++] = faceNormal
        geomNorms[startIndex++] = faceNormal
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
    let maxUvLen = uvCoordinates.length

    indices.forEach(indice => {
      let vertexCount = indice.length

      for (let i = 1; i < vertexCount - 1; i++) {
        let cId = uvCoordIndex + i

        // Failsafe: if the UV coords cannot be defined, use default values
        if (uvCoordIndex >= maxUvLen) {
          geomUvs[startIndex++] = [0.0, 0.0]
          geomUvs[startIndex++] = [0.0, 0.1]
          geomUvs[startIndex++] = [0.1, 0.1]
        } else {
          geomUvs[startIndex++] = uvCoordinates[uvCoordIndex]
          geomUvs[startIndex++] = uvCoordinates[cId]
          geomUvs[startIndex++] = uvCoordinates[cId + 1]
        }
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


  bindBufferRendererToThis(gl, renderer, program) {

    const ATTRIB_VERTEX_SIZE = 3
    const ATTRIB_TEXCOORD_SIZE = 2
    const ATTRIB_NORMAL_SIZE = 3

    const FLOAT_BYTE_LENGTH = 4

    let startVertex = this.vertexStartIndex * FLOAT_BYTE_LENGTH * ATTRIB_VERTEX_SIZE
    let startNormal = this.normalStartIndex * FLOAT_BYTE_LENGTH * ATTRIB_NORMAL_SIZE
    let startUv = this.uvStartIndex * FLOAT_BYTE_LENGTH * ATTRIB_TEXCOORD_SIZE

    let attribs = program.attribs

    gl.bindBuffer(gl.ARRAY_BUFFER, renderer.verticesBuffer)
    gl.vertexAttribPointer(attribs.a_pos, ATTRIB_VERTEX_SIZE, gl.FLOAT, false, 0, startVertex)
    gl.enableVertexAttribArray(attribs.a_pos)

    // Update UV coordinate buffer

    gl.bindBuffer(gl.ARRAY_BUFFER, renderer.texcoordsBuffer)
    gl.vertexAttribPointer(attribs.a_texcoord, ATTRIB_TEXCOORD_SIZE, gl.FLOAT, false, 0, startUv)
    gl.enableVertexAttribArray(attribs.a_texcoord)

    // Update normals buffer

    gl.bindBuffer(gl.ARRAY_BUFFER, renderer.normalsBuffer)
    gl.vertexAttribPointer(attribs.a_norm, ATTRIB_NORMAL_SIZE, gl.FLOAT, false, 0, startNormal)
    gl.enableVertexAttribArray(attribs.a_norm)

  }

  bindShadowBufferRendererToThis(gl, renderer, program) {
    const ATTRIB_VERTEX_SIZE = 3
    const FLOAT_BYTE_LENGTH = 4

    let startVertex = this.vertexStartIndex * FLOAT_BYTE_LENGTH * ATTRIB_VERTEX_SIZE
    let attribs = program.attribs

    gl.bindBuffer(gl.ARRAY_BUFFER, renderer.verticesBuffer)
    gl.vertexAttribPointer(attribs.a_pos, ATTRIB_VERTEX_SIZE, gl.FLOAT, false, 0, startVertex)
    gl.enableVertexAttribArray(attribs.a_pos)

  }
}