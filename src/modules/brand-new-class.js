"use strict"

let Tri = {}
let PrimitivesDefinition = {}

PrimitivesDefinition.getCube = function (size = 1) {
  size /= 2
  return {
    vertices: [
      [size, -size, size],
      [size, -size, -size],
      [-size, -size, size],
      [-size, -size, -size],
      [size, size, size],
      [size, size, -size],
      [-size, size, size],
      [-size, size, -size]
    ],

    indices: [
      [0, 4, 6, 2],
      [3, 2, 6, 7],
      [7, 6, 4, 5],
      [5, 1, 3, 7],
      [1, 0, 2, 3],
      [5, 4, 0, 1]
    ],

    uvCoordinates: [
      [1, 1], [0, 1], [0, 0], [1, 0],
      [1, 1], [0, 1], [0, 0], [1, 0],
      [1, 1], [0, 1], [0, 0], [1, 0],
      [1, 1], [0, 1], [0, 0], [1, 0],
      [1, 1], [0, 1], [0, 0], [1, 0],
      [1, 1], [0, 1], [0, 0], [1, 0],
    ]
  }
}



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
    let attributes = renderer.attribs

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



class PrimitiveCube extends Geometry {
  constructor() {
    super({}, false)
    let definition = PrimitivesDefinition.getCube()
    this.vertices = definition.vertices
    this.indices = definition.indices
    this.uvCoordinates = definition.uvCoordinates
    this.moveToBufferData()
  }
}



class Property3D {
  constructor([x, y, z], parent, propertyName) {
    this.property = [x, y, z]
    this.parent = parent
    this.propertyName = propertyName
  }

  get() {
    return this.property
  }

  set(newValue) {
    if (!Array.isArray(newValue)) {
      newValue = [arguments[0], arguments[1], arguments[2]]
    }
    this.property[0] = newValue[0]
    this.property[1] = newValue[1]
    this.property[2] = newValue[2]

    this.parent.localMatrixNeedsUpdate = true
  }

  setX(val) {
    this.setOnAxisId(0, val)
  }

  setY(val) {
    this.setOnAxisId(1, val)
  }

  setZ(val) {
    this.setOnAxisId(2, val)
  }

  setOnAxisId(axisId, val) {
    this.property[axisId] = val
    this.parent.localMatrixNeedsUpdate = true
  }
}




class Object3D {
  constructor(data) {
    let { name, origin, position, rotation, scale, geometry, material } = data || {}
    this.name = name || ''

    origin = origin || [0, 0, 0]
    position = position || [0, 0, 0]
    rotation = rotation || [0, 0, 0]
    scale = scale || [1, 1, 1]

    this.origin = new Property3D(origin, this, 'origin')
    this.position = new Property3D(position, this, 'position')
    this.rotation = new Property3D(rotation, this, 'rotation')
    this.scale = new Property3D(scale, this, 'scale')

    this.localMatrix = m4.identity()
    this.worldMatrix = m4.identity()

    this.geometry = geometry || null
    this.material = material || null

    this.parent = null
    this.children = []

    this.localMatrixNeedsUpdate = true

    this.visible = true
  }

  setParent(parentObject) {
    if (parentObject instanceof Object3D && parentObject !== this) {
      parentObject.addChild(this)
      this.parent = parentObject
    }
  }

  unsetParent() {
    let parent = this.parent
    if (parent) {
      this.parent = null
      parent.removeChild(this)
      return parent
    }
  }

  /**
   * Add an object as a children or set a mesh to this object.
   * 
   * If object is a `Geometry`, then it will do `setGeometry`.
   * If object is an `Object3D`, this will be alias for `addChild`.
   * @param {*} object 
   */

  add(object) {
    if (object instanceof Object3D) {
      this.addChild(object)
    } else if (object instanceof Geometry) {
      this.setGeometry(object)
    }
  }

  addChild(child) {
    if (child instanceof Object3D && child !== this && child.parent !== this) {
      child.parent = this
      this.children.push(child)
    }
  }

  removeChild(child) {
    let childIndex = this.children.indexOf(child)
    if (childIndex >= 0) {
      this.children.splice(childIndex, 1)
      child.parent = null
      return child
    }
  }

  hasChild(child) {
    return this.children.indexOf(child) >= 0
  }

  setGeometry(geometry) {
    this.geometry = geometry
  }

  setMaterial(material) {
    this.material = material
  }

  updateLocalMatrix() {
    if (!this.localMatrixNeedsUpdate) {
      return
    }

    // Convert rotations value from degrees to radians
    let origin = this.origin.property
    let position = this.position.property
    let rotation = this.rotation.property.map(val => degToRad(val))
    let scale = this.scale.property

    let mat = m4.translation(
      position[0] + origin[0],
      position[1] + origin[1],
      position[2] + origin[2]
    )

    mat = m4.multiply(mat,
      m4.xyzRotationScale(
        rotation[0], rotation[1], rotation[2],
        scale[0], scale[1], scale[2]))

    mat = m4.translate(mat, origin[0], origin[1], origin[2])

    this.localMatrix = mat

    this.localMatrixNeedsUpdate = false
  }

  updateWorldMatrix() {
    if (this.parent) {
      let parentMatrix = this.parent.worldMatrix
      this.worldMatrix = m4.multiply(parentMatrix, this.localMatrix)
    } else {
      this.worldMatrix = this.localMatrix
    }
  }

  updateTreeMatrices() {
    this.updateWorldMatrix()
    this.children.forEach(children => {
      children.updateTreeMatrices()
    })
  }

  get parentNameList() {
    let parents = []
    let object = this
    while (object.parent) {
      object = object.parent
      parents.push(object.name)
    }
    return parents
  }
}




class Scene extends Object3D {
  constructor() {
    super()
  }

  setParent() { }
  unsetParent() { }
  setGeometry() { }
}

class Empty extends Object3D {
  constructor() {
    super.call(arguments)
  }

  setGeometry() { }
}




class CameraPrototype extends Object3D {
  constructor(name) {
    super({ name })
    this.up = [0, 0, 1] // UP AT Z-AXIS (IMPORTANT)
    this.viewMatrix = m4.identity()
    this.projectionMatrix = m4.identity()

    this.cameraMatrixNeedsUpdate = false
  }

  lookAt(at) {
    let eye = [...this.position.get()]
    let up = this.up
    this.viewMatrix = flatten(lookAt(eye, at, up))
    this.cameraMatrixNeedsUpdate = true
  }

  updateProjectionMatrix() {
    this.projectionMatrix = m4.identity()
  }

  updateCameraToRenderer(renderer) {
    if (!this.cameraMatrixNeedsUpdate) {
      return
    }

    this.updateProjectionMatrix()

    let gl = renderer.gl

    let projectionLoc = renderer.uniforms.projectionMatrix

    gl.uniformMatrix4fv(projectionLoc, false, flatten(this.projectionMatrix))

    let viewLoc = renderer.uniforms.viewMatrix
    gl.uniformMatrix4fv(viewLoc, false, flatten(this.viewMatrix))

    this.cameraMatrixNeedsUpdate = false
  }
}

class PerspectiveCamera extends CameraPrototype {
  constructor({ near, far, fovy, aspect }, name) {
    super({ name })
    this.__localVar = { near, far, fovy, aspect }
    this.near = near || 0.05
    this.far = far || 80.0
    this.fovy = fovy || 55.0
    this.aspect = aspect || 1.0
  }

  updateProjectionMatrix() {
    this.projectionMatrix = perspective(this.fovy, this.aspect, this.near, this.far)
  }

  // Getter and setter for near

  get near() {
    return this.__localVar.near
  }

  set near(val) {
    this.__localVar.near = val
    this.cameraMatrixNeedsUpdate = true
  }

  // Getter and setter for far

  get far() {
    return this.__localVar.far
  }

  set far(val) {
    this.__localVar.far = val
    this.cameraMatrixNeedsUpdate = true
  }

  // Getter and setter for fovy

  get fovy() {
    return this.__localVar.fovy
  }

  set fovy(val) {
    this.__localVar.fovy = val
    this.cameraMatrixNeedsUpdate = true
  }

  // Getter and setter for aspect

  get aspect() {
    return this.__localVar.aspect
  }

  set aspect(val) {
    this.__localVar.aspect = val
    this.cameraMatrixNeedsUpdate = true
  }
}



// Materials utility function

function getBasenameAndDuplicateCounterFromName(name) {
  let match = name.match(/(.+)\.([\d]+)$/)
  let baseName = name
  let counter = -1

  if (match) {
    baseName = match[1]
    counter = parseInt(match[2])
  }

  return {
    baseName, counter
  }
}

function getRandomName() {
  let NAME_COUNT = 10
  let strings = new Array(NAME_COUNT)

  for (let i = 0; i < NAME_COUNT; i++) {
    // Generate unique string from a (64) to z (64 + 25)
    let charCode = 97 + Math.floor(26 * Math.random())
    strings[i] = String.fromCharCode(charCode)
  }

  // Add hypens to ease spelling
  strings[3] += '-'
  strings[7] += '-'
  return strings.join('')
}




class Material {
  static list = {}

  constructor(name) {
    if (typeof name === 'undefined') {
      name = getRandomName()
    }

    this.name = getNextUniqueNameFromDict(name.trim(), Material.list)
    Material.list[this.name] = this
  }

  delete() {
    delete Material.list[name]
  }
}

class EmissionMaterial extends Material {
  constructor(name, color) {
    super(name)
    this.color = color
  }
}

class PhongMaterial extends Material {
  constructor(name, { ambient, diffuse, specular, shininess }) {
    super(name)
    this.ambient = ambient || vec4(1.0, 0.0, 1.0, 1.0)
    this.diffuse = diffuse || vec4(1.0, 0.8, 0.0, 1.0)
    this.specular = specular || vec4(1.0, 0.8, 0.0, 1.0)
    this.shininess = shininess !== undefined ? shininess : 60.0
  }
}

class ImageTextureMaterial extends PhongMaterial {
  static textureMaterialList = []
  static lastInitializedIndex = -1

  constructor(name, data, imageSource) {
    super(name, data)

    this.materialId = null
    this.textureNeedsInitialization = true

    this.imageSource = imageSource || null
    this.imageLoaded = false

    this.texture = null

    let list = ImageTextureMaterial.textureMaterialList
    this.materialId = list
    list.push(this)
  }

  static initMaterialsToRenderer(renderer) {
    let gl = renderer.gl
    let list = ImageTextureMaterial.textureMaterialList
    let startInit = this.lastInitializedIndex + 1

    for (let i = startInit; i < list.length; i++) {
      let material = list[i]
      if (material !== null) {
        material.initTexture(gl)
      }

      this.lastInitializedIndex = i
    }
  }

  /**
   * Initialize texture. If no image is found, the texture will be pink.
   * @param {*} gl 
   */

  initTexture(gl) {
    if (!this.textureNeedsInitialization) {
      return
    }

    let texture = gl.createTexture()
    this.texture = texture

    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
      new Uint8Array([255, 0, 255, 255]))

    this.textureNeedsInitialization = false

    if (!this.imageSource) {
      return
    }

    let textureImage = new Image()
    textureImage.src = 'resources/objects/material_resources/' + this.imageSource

    const self = this
    textureImage.addEventListener('load', function () {
      self.imageLoaded = true
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureImage)
      gl.generateMipmap(gl.TEXTURE_2D)
    })
  }

  delete() {
    ImageTextureMaterial[this.materialId] = null
    super.delete()
  }
}



let lightCubeGeometry = new PrimitiveCube()
let lightCubeMaterial = new EmissionMaterial()

class Light extends Object3D {
  static lightList = []
  static initialized = false

  constructor() {
    super({
      geometry: lightCubeGeometry,
      material: lightCubeMaterial
    })

    this.ambient = vec4(0.2, 0.2, 0.2, 1.0)
    this.diffuse = vec4(1.0, 1.0, 1.0, 1.0)
    this.specular = vec4(1.0, 1.0, 1.0, 1.0)

    Light.lightList.push(this)
  }



  static updateLightsToRenderer(renderer) {
    let gl = renderer.gl
    let lightPositionLoc = renderer.uniforms.lightPosition

    // TODO: Make renderer able to use multiple light setup.
    // Right now it can only use the LAST light in the list
    // Unfortunately you also need to LEARN the shader (GLSL) as well

    // TODO: Right now it uses original light position
    // but the light can be parented to any object so
    // matrix transformation should be taken into account

    Light.lightList.forEach(light => {
      if (light.localMatrixNeedsUpdate || !Light.initialized) {
        light.updateWorldMatrix()
        gl.uniform3fv(lightPositionLoc, flatten(light.position.get()))
      }
    })

    Light.initialized = true

  }


}



class Renderer extends EventDispatcher {


  constructor(canvas) {
    super()
    
    this.canvas = canvas
    this.gl = null
    this.program = null
    this.textureProgram = null

    this.uniforms = {}
    this.uniformList = [
      "ambientProduct",
      "diffuseProduct",
      "specularProduct",
      "shininess",
      "lightPosition",
      "modelMatrix",
      "viewMatrix",
      "projectionMatrix",
      "normalMatrix",
      "isSelected",
      "u_texture",
      "textureMix"
    ]

    this.attribs = {}
    this.attributeList = [
      "a_texcoord",
      "vPosition",
      "vNormal"
    ]

    this.SHADER_DIR = '/resources/shaders/'
    this.shaders = [
      'Default.fs.glsl', 'Default.vs.glsl',
      'ShadowGen.fs.glsl', 'ShadowGen.vs.glsl']
    this.shadersCodes = {}

    this.verticesBuffer = null
    this.normalsBuffer = null
    this.texcoordsBuffer = null

    this.init()
  }


  async init() {
    await this.initCanvasAndGL()
    this.initUniforms()
    this.initAttributes()
    this.initBuffers()

    this.dispatchEvent('initialized')
  }

  
  fetchShadersCodes() {
    const self = this
    return Promise.all(this.shaders.map(shaderName => {
      const shaderPath = self.SHADER_DIR + shaderName
      return fetch(shaderPath).then(res => res.text()).then(data => {
        self.shadersCodes[shaderName] = data
      })
    }))
  }


  async initCanvasAndGL() {

    let canvas = this.canvas
    let gl = WebGLUtils.setupWebGL(canvas)
    this.gl = gl

    if (!gl) {
      alert("WebGL isn't available")
    }

    gl.viewport(0, 0, canvas.width, canvas.height)
    gl.clearColor(0.2, 0.2, 0.2, 1.0)

    gl.enable(gl.DEPTH_TEST)
    gl.enable(gl.CULL_FACE)

    await this.fetchShadersCodes()
    let shaders = this.shadersCodes

    this.textureProgram = initShadersFromCode(gl,
      shaders['ShadowGen.vs.glsl'],
      shaders['ShadowGen.fs.glsl'])
    this.program = initShadersFromCode(gl,
      shaders['Default.vs.glsl'],
      shaders['Default.fs.glsl'])
    
    gl.useProgram(this.program)
  }


  initBuffers() {
    let gl = this.gl

    this.verticesBuffer = gl.createBuffer()
    this.normalsBuffer = gl.createBuffer()
    this.texcoordsBuffer = gl.createBuffer()
  }


  initUniforms() {
    let uniforms = this.uniforms
    let gl = this.gl
    let program = this.program

    this.uniformList.forEach(uniformName => {
      uniforms[uniformName] = gl.getUniformLocation(program, uniformName)
    })
  }


  initAttributes() {
    let attribs = this.attribs
    let gl = this.gl
    let program = this.program

    this.attributeList.forEach(attribName => {
      attribs[attribName] = gl.getAttribLocation(program, attribName)
    })
  }


  /**
   * Render scene. If app is present, it will be used as additional features.
   * For example: selecting object.
   * @param {*} scene 
   * @param {*} camera 
   * @param {*} app 
   */

  render(scene, camera, app = {}) {

    ImageTextureMaterial.initMaterialsToRenderer(this)
    Light.updateLightsToRenderer(this)
    Geometry.updateBuffersToRenderer(this)
    camera.updateCameraToRenderer(this)

    const self = this

    scene.children.forEach(object => {
      self.renderObjectTree(object, camera, app)
    })

  }


  /**
   * Render this object and all of its children recursively
   * while performing operations.
   * 
   * @param {*} object 
   * @param {*} camera 
   * @param {*} app 
   */

  renderObjectTree(object, camera, app) {
    let gl = this.gl

    const self = this
    self.renderObject(object, camera, app)
    object.children.forEach(child => {
      self.renderObjectTree(child, camera, app)
    })
  }


  /**
   * Render 3D object.
   */

  renderObject(object, camera, app) {
    let gl = this.gl

    // Update object matrix

    if (object.localMatrixNeedsUpdate) {
      object.updateLocalMatrix()
      object.updateWorldMatrix()

      // Trigger children to also update its matrices
      object.children.forEach(child => child.localMatrixNeedsUpdate = true)
    }

    // Ignore if geometry is none

    if (!object.geometry || object.geometry.bufferStartIndex < 0) {
      return
    }

    // Set up vertex position and inverse world matrix for normal calculation

    let worldViewMatrix = m4.multiply(camera.viewMatrix, object.worldMatrix)
    let normalMatrix = m4.transpose(m4.inverse(worldViewMatrix))

    gl.uniformMatrix4fv(this.uniforms.modelMatrix, false, flatten(object.worldMatrix))
    gl.uniformMatrix4fv(this.uniforms.normalMatrix, false, normalMatrix)

    // Set up shader

    let selected = app.selectedObjectName === object.name
    let material = object.material

    gl.uniform1f(this.uniforms.isSelected, selected)

    let textureMix = 0

    if (!selected) {
      if (material instanceof PhongMaterial) {
        let { ambient, diffuse, specular, shininess } = material

        // TODO: Right now it only uses FIRST LIGHT
        // Make sure it is able to use multiple light

        let light = Light.lightList[0]
        if (light) {
          ambient = flatten(mult(light.ambient, ambient))
          diffuse = flatten(mult(light.diffuse, diffuse))
          specular = flatten(mult(light.specular, specular))
        }

        gl.uniform4fv(this.uniforms.ambientProduct, ambient)
        gl.uniform4fv(this.uniforms.diffuseProduct, diffuse)
        gl.uniform4fv(this.uniforms.specularProduct, specular)
        gl.uniform1f(this.uniforms.shininess, shininess)
      }

      if (material instanceof ImageTextureMaterial) {
        textureMix = 1
        gl.bindTexture(gl.TEXTURE_2D, material.texture)

        // I don't know what this codes do
        // Seems like webglfundamentals sets up vertexAttribPointer every time
        // it's being rendered (?) dunno. It seems unnecessary.

        // gl.enableVertexAttribArray(texcoordLocation)
        // gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer)

        // var size = 2          // 2 components per iteration
        // var type = gl.FLOAT   // the data is 32bit floats
        // var normalize = false // don't normalize the data
        // var stride = 0        // 0 = move forward size * sizeof(type) each iteration to get the next position
        // var offset = 0        // start at the beginning of the buffer

        // gl.vertexAttribPointer(texcoordLocation, size, type, normalize, stride, offset)

        // // Tell the shader to use texture unit 0 for u_texture
        // gl.uniform1i(textureLocation, 0)
      }
    }

    gl.uniform1f(this.uniforms.textureMix, textureMix)

    let geometry = object.geometry
    let start = geometry.bufferStartIndex
    let count = geometry.triangleVerticesCount
    gl.drawArrays(gl.TRIANGLES, start, count)
  }


}




Tri = {
  Object3D,
  Scene,

  CameraPrototype,
  PerspectiveCamera,

  Material,
  EmissionMaterial,
  PhongMaterial,
  ImageTextureMaterial,

  Geometry,
  PrimitiveCube,

  Light,

  Renderer
}