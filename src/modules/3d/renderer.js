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

      "u_world",
      "u_cam",
      "u_proj",
      "u_normCam",

      "isSelected",

      "u_texture",
      "textureMix",

      "lightPosition",
      "pointLightShadowMap",

      'shadowClipNear',
      'shadowClipFar',

      // For directional light
      'u_reverseLightDirection',

      // For spotlight
      'lightPosition_spot',
      'u_viewWorldPos',
      'u_innerLimit',
      'u_outerLimit',
      'u_viewWorldPosition',
      'u_lightDirection',

      /* These are not necessary, just to make leaf and trees wave */
      'time',
      'isTreeLeaf',
      'isGrass',
      'isRenderingWireframe',

      'isPointLight',
      'u_textureMatrix_dir',
      'u_textureMatrix_spot',
      'v_projectedTexcoord_dir',
      'v_projectedTexcoord_spot',
      'u_projectedTexture_dir',
      'u_projectedTexture_spot',

      'pointLightIntensity',
      'directionalLightIntensity',
      'spotlightIntensity'
    ]

    this.programAttribList = [
      "a_texcoord",
      "a_pos",
      "a_norm"
    ]

    this.shadowGenProgram = null
    this.shadowGenProgramUniformList = [
      'u_proj',
      'u_cam',
      'u_world',
      'lightPosition',
      'shadowClipNear',
      'shadowClipFar',

      'isPointLight',

      /* These are not necessary, just to make leaf and trees wave */
      'time',
      'isTreeLeaf',
      'isGrass',
    ]
    this.shadowGenProgramAttribList = [
      'a_pos',
    ]


    this.programInfos = {
      main: null,
      shadowGen: null,
      objectPick: null,
    }
    this.bufferInfo = null

    this.SHADER_DIR = '/resources/shaders/'
    this.shaders = [
      'Default.fs.glsl', 'Default.vs.glsl',
      'ShadowGen.fs.glsl', 'ShadowGen.vs.glsl']
    this.shadersCodes = {}

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
    gl.uniform1i(this.program.uniforms.u_projectedTexture_dir, 2)
    gl.uniform1i(this.program.uniforms.u_projectedTexture_spot, 3)

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
    const gl = WebGLUtils.setupWebGL(canvas)
    const ext = gl.getExtension('WEBGL_depth_texture')

    if (!ext) {
      return alert('need WEBGL_depth_texture')  // eslint-disable-line
    }
    this.gl = gl

    if (!gl) {
      alert("WebGL isn't available")
    }

    gl.enable(gl.DEPTH_TEST)

    await this.fetchShadersCodes()
    let shaders = this.shadersCodes

    let progInfos = this.programInfos
    progInfos.main = twgl.createProgramInfo(gl, [shaders['Default.vs.glsl'], shaders['Default.fs.glsl']])
    progInfos.shadowGen = twgl.createProgramInfo(gl, [shaders['ShadowGen.vs.glsl'], shaders['ShadowGen.fs.glsl']])

    // NOTE: this.program & shadowGenProgram will be deprecated

    this.program = progInfos.main.program
    this.shadowGenProgram = progInfos.shadowGen.program
    gl.useProgram(this.program)
  }


  initBuffers() {
    let gl = this.gl

    let arrays = {
      a_pos: { numComponents: 3 },
      a_texcoord: { numComponents: 2 },
      a_norm:   { numComponents: 3 },
    }

    this.bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays)
  }


  // NOTE: Will be deprecated in favor of TWGL's
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


  // NOTE: Will be deprecated in favor of TWGL's
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

    let lights = Light.lightList

    for (const light of lights) {

      if (!light.shadowMapTextureInitialized) {
        light.initTexture(gl)
      }

      gl.uniform1f(this.shadowGenProgram.uniforms.isPointLight, light instanceof PointLight)

      if (light instanceof PointLight) {
        this.generatePointLightShadowMap(light, app)
      } else {
        this.generateDirectionalLightShadowMap(light, app)
      }
    }

    gl.useProgram(this.program)
    gl.viewport(0, 0, this.canvas.width, this.canvas.height)
    gl.clearColor(0.2, 0.2, 0.2, 1.0)

    for (const light of lights) {

      if (light instanceof PointLight) {

        gl.uniform3fv(this.program.uniforms.lightPosition, this.usedLightPosition)
        gl.uniform1f(this.program.uniforms.pointLightIntensity, light.intensity || 0.0)

        gl.activeTexture(gl.TEXTURE1)
        gl.uniform1i(this.program.uniforms.pointLightShadowMap, 1)
        gl.bindTexture(gl.TEXTURE_CUBE_MAP, light.shadowMapTexture)

      } else if (light instanceof MatrixBasedLight) {

        let textureMatrix = m4.translation(0.5, 0.5, 0.5)
        textureMatrix = m4.scale(textureMatrix, 0.5, 0.5, 0.5)
        textureMatrix = m4.multiply(textureMatrix, light.lightProjectionMatrix)
        textureMatrix = m4.multiply(textureMatrix, light.lightWorldMatrix)

        if (light instanceof DirectionalLight) {

          gl.uniform3fv(this.program.uniforms.u_reverseLightDirection, light.lightDirection)
          gl.uniformMatrix4fv(this.program.uniforms.u_textureMatrix_dir, false, textureMatrix)

          gl.activeTexture(gl.TEXTURE2);
          gl.uniform1i(this.program.uniforms.u_projectedTexture_dir, 2)
          gl.bindTexture(gl.TEXTURE_2D, light.shadowMapTexture)

          gl.uniform1f(this.program.uniforms.directionalLightIntensity, light.intensity || 0.0)

        } else {
          gl.uniformMatrix4fv(this.program.uniforms.u_textureMatrix_spot, false, textureMatrix)
          gl.uniform3fv(this.program.uniforms.lightPosition_spot, light.worldPosition)

          gl.uniform1f(this.program.uniforms.u_innerLimit, Math.cos(degToRad(light._fov / 2 - 10)))
          gl.uniform1f(this.program.uniforms.u_outerLimit, Math.cos(degToRad(light._fov / 2)))
          gl.uniform3fv(this.program.uniforms.u_lightDirection, scale(-1, light.lightDirection))

          gl.activeTexture(gl.TEXTURE3);
          gl.uniform1i(this.program.uniforms.u_projectedTexture_spot, 3)
          gl.bindTexture(gl.TEXTURE_2D, light.shadowMapTexture)

          gl.uniform1f(this.program.uniforms.spotlightIntensity, light.intensity || 0.0)
        }
      }
    }

    gl.uniform1f(this.program.uniforms.isPointLight, light instanceof PointLight)

    // Set near & far

    gl.uniform1f(this.program.uniforms.shadowClipNear, this.shadowClipNear)
    gl.uniform1f(this.program.uniforms.shadowClipFar, this.shadowClipFar)
    gl.uniform1f(this.program.uniforms.time, this.time)

    camera.updateCameraToRenderer(this.programInfos.main)
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


  renderShadowObjectTree(object, app) {
    const self = this
    self.renderShadowObject(object, app)
    for (let i = 0; i < object.children.length; i++) {
      let child = object.children[i]
      self.renderShadowObjectTree(child, app)
    }
  }


  generateDirectionalLightShadowMap(light, app) {

    let gl = this.gl
    let texSize = light.shadowMapTextureSize

    gl.bindFramebuffer(gl.FRAMEBUFFER, light.framebuffer)
    gl.viewport(0, 0, texSize, texSize)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    // TODO NOW: Move this into the outerfunction (this.renderShadowMap)
    let programInfo = this.programInfos.shadowGen
    twgl.setBuffersAndAttributes(gl, programInfo, this.bufferInfo)

    light.recomputeMapMatrix()

    twgl.setUniforms(programInfo, {
      u_proj: light.lightProjectionMatrix,
      u_cam: light.lightWorldMatrix
    })

    this.renderShadowObjectTree(scene, app)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
  }


  generatePointLightShadowMap(light, app) {

    let gl = this.gl
    let programInfo = this.programInfos.shadowGen
    twgl.setBuffersAndAttributes(gl, programInfo, this.bufferInfo)

    // Prepare rendering to framebuffer, renderbuffer and shadow cubemap texture

    gl.bindFramebuffer(gl.FRAMEBUFFER, light.framebuffer)
    gl.bindRenderbuffer(gl.RENDERBUFFER, light.renderbuffer)

    // Resize viewport
    gl.viewport(0, 0, light.shadowMapTextureSize, light.shadowMapTextureSize)

    light.updateWorldMatrix()
    this.usedLightPosition = light.worldPosition
    light.bindGlToThisTexture(gl)

    let lightPosition = this.usedLightPosition

    // The projection matrix will be the same for all the 6 cameras.
    // Use only the first one and set it at the beginning.

    let projectionMatrix = this.shadowMapCameras[0].projectionMatrix

    twgl.setUniforms(programInfo, {
      shadowClipNear: this.shadowClipNear,
      shadowClipFar: this.shadowClipFar,
      lightPosition: lightPosition,
      u_proj: flatten(projectionMatrix)
    })

    let setCameraMatrix = programInfo.uniformSetters.u_cam

    for (let i = 0; i < this.shadowMapCameras.length; i++) {

      let camera = this.shadowMapCameras[i]
      let setup = this.SHADOWMAP_CAMERA_SETUPS[i]

      let targetPosition = add(lightPosition, setup.atVector)
      camera.position.set(lightPosition)
      camera.lookAt(targetPosition)
      setCameraMatrix(flatten(camera.viewMatrix))

      let textureTarget = gl[setup.target]

      // Set framebuffer & renderbuffer destination

      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0,
        textureTarget, light.shadowMapTexture, 0)

      gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT,
        gl.RENDERBUFFER, light.renderbuffer)

      // Render the scene

      gl.clearColor(0, 0, 0, 1)
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

      this.renderShadowObjectTree(scene, app)
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

    if (object.localMatrixNeedsUpdate) {
      object.updateLocalMatrix()
      object.updateShallowWorldMatrix()

      // Trigger children to also update its matrices
      object.children.forEach(child => child.localMatrixNeedsUpdate = true)
    }

    // Ignore if geometry is none

    if (!object.geometry || object.geometry.vertexStartIndex < 0) {
      return
    }

    let gl = this.gl
    let programInfo = this.programInfos.main
    let program = programInfo.program
    let uniforms = program.uniforms

    // Set up vertex position and inverse world matrix for normal calculation

    let worldViewMatrix = m4.multiply(camera.viewMatrix, object.worldMatrix)
    let normalMatrix = m4.transpose(m4.inverse(worldViewMatrix))

    gl.uniformMatrix4fv(uniforms.u_world, false, object.worldMatrix)
    gl.uniformMatrix4fv(uniforms.u_normCam, false, normalMatrix)

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

      gl.uniform1i(this.program.u_projectedTexture, 2);  // texture unit 0

      if (material instanceof ImageTextureMaterial) {
        textureMix = 1
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, material.texture)
      }
    }

    if (object instanceof Light) {
      textureMix = 0.0;
    }

    gl.uniform1f(uniforms.textureMix, textureMix)
    gl.uniform1f(uniforms.isTreeLeaf, object.name === 'Daun')
    gl.uniform1f(uniforms.isGrass, object.name === 'rumput')

    let geometry = object.geometry
    geometry.bindBufferRendererToThis(gl, this, programInfo)
    gl.uniform1f(uniforms.isRenderingWireframe, geometry.wireframeMode)

    if (geometry.wireframeMode) {
      gl.drawArrays(gl.LINES, 0, geometry.triangleVerticesCount)
    } else {
      gl.drawArrays(gl.TRIANGLES, 0, geometry.triangleVerticesCount)
    }

    if (object instanceof MatrixBasedLight) {
      let light = object

      let geometry = light.directionHelper
      gl.uniform1f(uniforms.isRenderingWireframe, geometry.wireframeMode)
      geometry.bindBufferRendererToThis(gl, this, programInfo)
      gl.drawArrays(gl.LINES, 0, geometry.triangleVerticesCount)

      if (selected) {
        let mat = m4.multiply(m4.inverse(light.lightWorldMatrix), m4.inverse(light.lightProjectionMatrix))
        mat = m4.scale(mat, 2, 2, 2)
        gl.uniformMatrix4fv(uniforms.u_world, false, mat)
  
        geometry = light.areaHelper
        geometry.bindBufferRendererToThis(gl, this, programInfo)
        gl.drawArrays(gl.LINES, 0, geometry.triangleVerticesCount)
      }

    }

  }


  /** Render shadow 3D Object */

  renderShadowObject(object) {

    // Update object matrix

    if (object.localMatrixNeedsUpdate) {
      object.updateLocalMatrix()
      object.updateShallowWorldMatrix()

      // Trigger children to also update its matrices
      object.children.forEach(child => child.localMatrixNeedsUpdate = true)
    }

    // Ignore if the object has no geometry

    if (!object.geometry || object.geometry.vertexStartIndex < 0) {
      return
    }

    // Do not render the Light's geometry

    if (object instanceof Light) {
      return
    }

    let gl = this.gl
    let programInfo = this.programInfos.shadowGen
    let program = programInfo.program
    let uniforms = program.uniforms

    gl.uniform1f(uniforms.isTreeLeaf, object.name === 'Daun')
    gl.uniform1f(uniforms.isGrass, object.name === 'rumput')
    gl.uniformMatrix4fv(uniforms.u_world, false, flatten(object.worldMatrix))

    let geometry = object.geometry
    geometry.bindShadowBufferRendererToThis(gl, this, programInfo)
    gl.drawArrays(gl.TRIANGLES, 0, geometry.triangleVerticesCount)
  }
}