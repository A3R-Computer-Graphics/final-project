"use strict"

class Renderer extends EventDispatcher {

  static constants = {
    SHADOWMAP_CAMERA_SETUPS: [
      {
        name: '+X',
        target: 'TEXTURE_CUBE_MAP_POSITIVE_X',
        atVector: vec3(1, 0, 0),
        upVector: vec3(0, -1, 0),
      },
      {
        name: '-X',
        target: 'TEXTURE_CUBE_MAP_NEGATIVE_X',
        atVector: vec3(-1, 0, 0),
        upVector: vec3(0, -1, 0),
      },
      {
        name: '+Y',
        target: 'TEXTURE_CUBE_MAP_POSITIVE_Y',
        atVector: vec3(0, 1, 0),
        upVector: vec3(0, 0, 1),
      },
      {
        name: '-Y',
        target: 'TEXTURE_CUBE_MAP_NEGATIVE_Y',
        atVector: vec3(0, -1, 0),
        upVector: vec3(0, 0, -1),
      },
      {
        name: '+Z',
        target: 'TEXTURE_CUBE_MAP_POSITIVE_Z',
        atVector: vec3(0, 0, 1),
        upVector: vec3(0, -1, 0),
      },
      {
        name: '-Z',
        target: 'TEXTURE_CUBE_MAP_NEGATIVE_Z',
        atVector: vec3(0, 0, -1),
        upVector: vec3(0, -1, 0),
      }
    ]
  }

  constructor(canvas) {
    super()
    Object.assign(this, Renderer.constants)

    this.canvas = canvas
    this.gl = null
    this.program = null
    this.shadowGenProgram = null

    this.programUniformList = [
      "ambientProduct",
      "diffuseProduct",
      "specularProduct",
      "shininess",

      "modelMatrix",
      "viewMatrix",
      "projectionMatrix",
      "normalMatrix",

      "isSelected",

      "u_texture",
      "textureMix",

      "lightPosition",
      "pointLightShadowMap",

      'shadowClipNear',
      'shadowClipFar',

      /* These are not necessary, just to make leaf and trees wave */
      'time',
      'isTreeLeaf',
      'isGrass',
    ]

    this.programAttribList = [
      "a_texcoord",
      "vPosition",
      "vNormal"
    ]

    this.shadowGenProgram = null
    this.shadowGenProgramUniformList = [
      'projectionMatrix',
      'viewMatrix',
      'modelMatrix',
      'lightPosition',
      'shadowClipNear',
      'shadowClipFar',

      /* These are not necessary, just to make leaf and trees wave */
      'time',
      'isTreeLeaf',
      'isGrass',
    ]
    this.shadowGenProgramAttribList = [
      'vPosition',
    ]

    this.SHADER_DIR = '/resources/shaders/'
    this.shaders = [
      'Default.fs.glsl', 'Default.vs.glsl',
      'ShadowGen.fs.glsl', 'ShadowGen.vs.glsl']
    this.shadersCodes = {}

    this.verticesBuffer = null
    this.normalsBuffer = null
    this.texcoordsBuffer = null

    this.shadowMapFramebuffer = null
    this.shadowMapRenderbuffer = null
    this.shadowMapTextureSize = 512

    this.shadowClipNear = 0.05
    this.shadowClipFar = 40.0

    this.shadowMapCameras = new Array(6)

    this.init()
    this.time = 0

  }


  async init() {
    await this.initCanvasAndGL()
    this.initUniforms()
    this.initAttributes()
    this.initBuffers()

    // Init texture coords
    let gl = this.gl

    gl.enable(gl.BLEND)

    gl.uniform1i(this.program.uniforms.u_texture, 0)
    gl.uniform1i(this.program.uniforms.pointLightShadowMap, 1)

    this.initShadowMapFramebuffers()
    this.initShadowMapCameras()

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

    gl.enable(gl.DEPTH_TEST)

    await this.fetchShadersCodes()
    let shaders = this.shadersCodes

    this.shadowGenProgram = initShadersFromCode(gl,
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
    let gl = this.gl

    let programs = [this.program, this.shadowGenProgram]
    let uniformLists = [this.programUniformList, this.shadowGenProgramUniformList]

    programs.forEach((program, index) => {
      let uniforms = program.uniforms = {}
      let uniformList = uniformLists[index]

      uniformList.forEach(uniformName => {
        uniforms[uniformName] = gl.getUniformLocation(program, uniformName)
      })
    })
  }


  initAttributes() {
    let gl = this.gl

    let programs = [this.program, this.shadowGenProgram]
    let attribLists = [this.programAttribList, this.shadowGenProgramAttribList]

    programs.forEach((program, index) => {
      let attribs = program.attribs = {}
      let attribList = attribLists[index]

      attribList.forEach(attribName => {
        attribs[attribName] = gl.getAttribLocation(program, attribName)
      })
    })
  }


  initShadowMapFramebuffers() {
    let gl = this.gl

    let width = this.shadowMapTextureSize
    let height = width

    this.shadowMapFramebuffer = gl.createFramebuffer()
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.shadowMapFramebuffer)

    this.shadowMapRenderbuffer = gl.createRenderbuffer()
    gl.bindRenderbuffer(gl.RENDERBUFFER, this.shadowMapRenderbuffer)
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height)

    // Finish setup

    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.bindRenderbuffer(gl.RENDERBUFFER, null)
  }


  initShadowMapCameras() {
    let cameras = this.shadowMapCameras
    let near = this.shadowClipNear
    let far = this.shadowClipFar
    let fovy = 90.0
    let aspect = 1.0

    this.SHADOWMAP_CAMERA_SETUPS.forEach((setupData, index) => {
      let name = 'camera-sm-' + setupData.name
      let camera = new PerspectiveCamera({ near, far, fovy, aspect }, name)
      camera.position.set(0, 0, 0)
      camera.up = setupData.upVector
      camera.updateProjectionMatrix()

      cameras[index] = camera
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
    let gl = this.gl

    ImageTextureMaterial.initMaterialsToRenderer(this)
    Geometry.updateBuffersToRenderer(this)

    gl.useProgram(this.shadowGenProgram)
    gl.uniform1f(this.shadowGenProgram.uniforms.time, this.time)

    this.generateShadowMap(app)

    gl.useProgram(this.program)
    gl.viewport(0, 0, this.canvas.width, this.canvas.height)
    gl.clearColor(0.2, 0.2, 0.2, 1.0)

    let light = app.objects['cube-lighting']
    light.updateLightToRenderer(this)

    gl.activeTexture(gl.TEXTURE1)
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, light.shadowMapTexture)

    // Set near & far

    gl.uniform1f(this.program.uniforms.shadowClipNear, this.shadowClipNear)
    gl.uniform1f(this.program.uniforms.shadowClipFar, this.shadowClipFar)
    gl.uniform1f(this.program.uniforms.time, this.time)

    camera.updateCameraToRenderer(this, this.program)
    this.renderObjectTree(scene, camera, app)

    this.time += 0.04
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
    const self = this
    self.renderObject(object, camera, app)
    object.children.forEach(child => {
      self.renderObjectTree(child, camera, app)
    })
  }


  renderShadowObjectTree(object, camera, app) {
    const self = this
    self.renderShadowObject(object, camera, app)
    for (let i = 0; i < object.children.length; i++) {
      let child = object.children[i]
      self.renderShadowObjectTree(child, camera, app)
    }

  }


  generateShadowMap(app) {
    let gl = this.gl
    let shadowGenProgram = this.shadowGenProgram

    // Use current program & its attributes

    // gl.useProgram(shadowGenProgram)

    let attributes = shadowGenProgram.attribs
    gl.bindBuffer(gl.ARRAY_BUFFER, this.verticesBuffer)
    gl.vertexAttribPointer(attributes.vPosition, 4, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(attributes.vPosition)

    // Prepare rendering to framebuffer, renderbuffer and shadow cubemap texture
    
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.shadowMapFramebuffer)
    gl.bindRenderbuffer(gl.RENDERBUFFER, this.shadowMapRenderbuffer)

    // Resize viewport

    gl.viewport(0, 0, this.shadowMapTextureSize, this.shadowMapTextureSize)

    // Set per-frame uniforms
    // TODO: Renderer depends heavily on 'cube-lighting', refactor later!

    let light = app.objects['cube-lighting']
    if (!light.shadowMapTextureInitialized) {
      light.initTexture(gl)
    }

    light.bindGlToThisTexture(gl)

    let lightPosition = light.position.get()
    gl.uniform1f(shadowGenProgram.uniforms.shadowClipNear, this.shadowClipNear)
    gl.uniform1f(shadowGenProgram.uniforms.shadowClipFar, this.shadowClipFar)
    gl.uniform3fv(shadowGenProgram.uniforms.lightPosition, lightPosition)

    // The projection matrix will be the same for all the 6 cameras.
    // Use only the first one and set it at the beginning.

    let projMatLoc = shadowGenProgram.uniforms.projectionMatrix
    let viewMatLoc = shadowGenProgram.uniforms.viewMatrix
    let projectionMatrix = this.shadowMapCameras[0].projectionMatrix
    gl.uniformMatrix4fv(projMatLoc, false, flatten(projectionMatrix))

    for (let i = 0; i < this.shadowMapCameras.length; i++) {

      let camera = this.shadowMapCameras[i]
      let setup = this.SHADOWMAP_CAMERA_SETUPS[i]

      let targetPosition = add(lightPosition, setup.atVector)
      camera.position.set(lightPosition)
      camera.lookAt(targetPosition)
      gl.uniformMatrix4fv(viewMatLoc, false, flatten(camera.viewMatrix))

      let textureTarget = gl[setup.target]

      // Set framebuffer & renderbuffer destination

      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
        textureTarget, light.shadowMapTexture, 0)

      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT,
        gl.RENDERBUFFER, this.shadowMapRenderbuffer)

      // Render the scene

      gl.clearColor(0, 0, 0, 1)
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

      this.renderShadowObjectTree(scene, camera, app)
    }

    // Unsetup framebuffer & renderbuffer destination,
    // as well as the cubemap textures

    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.bindRenderbuffer(gl.RENDERBUFFER, null)
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null)
  }


  /**
   * Render 3D object.
   */

  renderObject(object, camera, app) {

    // Originally, there should be an object update at this code.
    // But since it has already been called in another renderObject function
    // (the shadowmap one), we don't need to call this twice.

    // // Update object matrix

    // if (object.localMatrixNeedsUpdate) {
    //   object.updateLocalMatrix()
    //   object.updateWorldMatrix()

    //   // Trigger children to also update its matrices
    //   object.children.forEach(child => child.localMatrixNeedsUpdate = true)
    // }

    // Ignore if geometry is none

    if (!object.geometry || object.geometry.bufferStartIndex < 0) {
      return
    }

    let gl = this.gl
    let program = this.program
    let uniforms = program.uniforms

    // Set up vertex position and inverse world matrix for normal calculation

    let worldViewMatrix = m4.multiply(camera.viewMatrix, object.worldMatrix)
    let normalMatrix = m4.transpose(m4.inverse(worldViewMatrix))

    gl.uniformMatrix4fv(uniforms.modelMatrix, false, flatten(object.worldMatrix))
    gl.uniformMatrix4fv(uniforms.normalMatrix, false, normalMatrix)

    // Set up shader

    let selected = app.selectedObjectName === object.name
    let material = object.material

    gl.uniform1f(uniforms.isSelected, selected)
    gl.uniform1f(uniforms.isTreeLeaf, object.name === 'Daun')
    gl.uniform1f(uniforms.isGrass, object.name === 'rumput')

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

        gl.uniform4fv(uniforms.ambientProduct, ambient)
        gl.uniform4fv(uniforms.diffuseProduct, diffuse)
        gl.uniform4fv(uniforms.specularProduct, specular)
        gl.uniform1f(uniforms.shininess, shininess)
      }

      if (material instanceof ImageTextureMaterial) {
        textureMix = 1
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, material.texture)
        gl.uniform1i(uniforms.u_texture, 0)
      }
    }

    gl.uniform1f(uniforms.textureMix, textureMix)

    let geometry = object.geometry
    let start = geometry.bufferStartIndex
    let count = geometry.triangleVerticesCount
    gl.drawArrays(gl.TRIANGLES, start, count)
  }


  /** Render shadow 3D Object */

  renderShadowObject(object) {

    // Update object matrix

    if (object.localMatrixNeedsUpdate) {
      object.updateLocalMatrix()
      object.updateWorldMatrix()

      // Trigger children to also update its matrices
      object.children.forEach(child => child.localMatrixNeedsUpdate = true)
    }

    // Ignore if the object has no geometry

    if (!object.geometry || object.geometry.bufferStartIndex < 0) {
      return
    }

    // Do not render the Light's geometry

    if (object instanceof Light) {
      return
    }

    let gl = this.gl
    let program = this.shadowGenProgram
    let uniforms = program.uniforms
    
    gl.uniform1f(uniforms.isTreeLeaf, object.name === 'Daun')
    gl.uniform1f(uniforms.isGrass, object.name === 'rumput')
    gl.uniformMatrix4fv(uniforms.modelMatrix, false, flatten(object.worldMatrix))

    let geometry = object.geometry
    let start = geometry.bufferStartIndex
    let count = geometry.triangleVerticesCount
    gl.drawArrays(gl.TRIANGLES, start, count)
  }
}