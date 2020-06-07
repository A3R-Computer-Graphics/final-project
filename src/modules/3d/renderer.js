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

    this.programInfos = {
      main: null,
      shadowGen: null,
      objectPick: null,
    }
    this.bufferInfo = null

    this.SHADER_DIR = '/resources/shaders/'
    this.shaders = [
      'Default.fs.glsl', 'Default.vs.glsl',
      'ShadowGen.fs.glsl', 'ShadowGen.vs.glsl',
      'ObjectPicking.fs.glsl', 'ObjectPicking.vs.glsl']
    this.shadersCodes = {}

    this.shadowMapTextureSize = 512

    this.shadowClipNear = 0.05
    this.shadowClipFar = 40.0

    this.shadowMapCameras = new Array(6)

    this.init()
    this.time = 0

    this.lastCanvasWidth = canvas.width
    this.lastCanvasHeight = canvas.height

  }


  updateLastCanvasSize() {
    this.lastCanvasHeight = canvas.height
    this.lastCanvasWidth = canvas.width
  }


  async init() {
    await this.initCanvasAndGL()
    this.initBuffers()
    this.setupBuffersForPickingProgram()

    let gl = this.gl

    gl.enable(gl.BLEND)

    twgl.setUniforms(this.programInfos.main, twgl.createTextures(gl, {
      u_texture: { src: null, target: gl.TEXTURE_2D, width: 1, height: 1 },
      pointLightShadowMap: { src: null, target: gl.TEXTURE_CUBE_MAP, width: 1, height: 1 },
      u_projectedTexture_dir: { src: null, target: gl.TEXTURE_2D, width: 1, height: 1 },
      u_projectedTexture_spot: { src: null, target: gl.TEXTURE_2D, width: 1, height: 1 }
    }))

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
    progInfos.objectPick = twgl.createProgramInfo(gl, [shaders['ObjectPicking.vs.glsl'], shaders['ObjectPicking.fs.glsl']])

    gl.useProgram(this.programInfos.main.program)
  }


  initBuffers() {
    let gl = this.gl

    let arrays = {
      a_pos: { numComponents: 3 },
      a_texcoord: { numComponents: 2 },
      a_norm: { numComponents: 3 },
    }

    this.bufferInfo = twgl.createBufferInfoFromArrays(gl, arrays)
  }

  setFramebufferAttachmentSizes(width, height) {
    let gl = this.gl

    gl.bindTexture(gl.TEXTURE_2D, this.targetTexture)
    
    const level = 0
    const internalFormat = gl.RGBA
    const border = 0
    const format = gl.RGBA
    const type = gl.UNSIGNED_BYTE
    const data = null
    gl.texImage2D(gl.TEXTURE_2D, level, internalFormat,
                  width, height, border,
                  format, type, data)

    gl.bindRenderbuffer(gl.RENDERBUFFER, this.depthBuffer)
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height)
  }


  // Source: https://webglfundamentals.org/webgl/lessons/webgl-picking.html

  setupBuffersForPickingProgram() {
    let gl = this.gl

    // Create a texture to render to
    const targetTexture = gl.createTexture()
    gl.bindTexture(gl.TEXTURE_2D, targetTexture)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

    // create a depth renderbuffer
    const depthBuffer = gl.createRenderbuffer()
    gl.bindRenderbuffer(gl.RENDERBUFFER, depthBuffer)

    // Create and bind the framebuffer
    const fb = gl.createFramebuffer()
    gl.bindFramebuffer(gl.FRAMEBUFFER, fb)

    // attach the texture as the first color attachment
    const attachmentPoint = gl.COLOR_ATTACHMENT0
    const level = 0
    gl.framebufferTexture2D(gl.FRAMEBUFFER, attachmentPoint, gl.TEXTURE_2D, targetTexture, level)

    // make a depth buffer and the same size as the targetTexture
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, depthBuffer)

    gl.bindFramebuffer(gl.FRAMEBUFFER, null)

    this.fb = fb
    this.depthBuffer = depthBuffer
    this.targetTexture = targetTexture
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

    let programInfo = this.programInfos.shadowGen
    let program = programInfo.program
    gl.useProgram(program)
    gl.enable(gl.CULL_FACE)
    twgl.setBuffersAndAttributes(gl, programInfo, this.bufferInfo)

    let setUniform = programInfo.uniformSetters
    setUniform.time(this.time)

    let lights = Light.lightList

    for (const light of lights) {
      if (!light.visible) continue

      if (!light.shadowMapTextureInitialized) {
        light.initTexture(gl, programInfo)
      }

      setUniform.isPointLight(light instanceof PointLight)

      if (light instanceof PointLight) {
        this.generatePointLightShadowMap(light, app)
      } else {
        this.generateDirectionalLightShadowMap(light, app)
      }
    }

    programInfo = this.programInfos.main
    program = programInfo.program

    gl.useProgram(program)
    gl.viewport(0, 0, this.canvas.width, this.canvas.height)
    gl.clearColor(0, 0, 0, 0)

    for (const light of lights) {

      if (light instanceof PointLight) {

        twgl.setUniforms(programInfo, {
          lightPosition: this.usedLightPosition,
          pointLightIntensity: light.intensity * light.visible || 0.0,
          pointLightShadowMap: light.shadowMapTexture
        })

      } else if (light instanceof MatrixBasedLight) {

        let textureMatrix = m4.translation(0.5, 0.5, 0.5)
        textureMatrix = m4.scale(textureMatrix, 0.5, 0.5, 0.5)
        textureMatrix = m4.multiply(textureMatrix, light.lightProjectionMatrix)
        textureMatrix = m4.multiply(textureMatrix, light.lightWorldMatrix)

        if (light instanceof DirectionalLight) {

          twgl.setUniforms(programInfo, {
            u_reverseLightDirection: light.lightDirection,
            u_textureMatrix_dir: textureMatrix,
            directionalLightIntensity: light.intensity * light.visible || 0.0,
            u_projectedTexture_dir: light.shadowMapTexture,
            u_directionalLightColor: light.color,
          })

        } else {

          twgl.setUniforms(programInfo, {
            u_textureMatrix_spot: textureMatrix,
            lightPosition_spot: light.worldPosition,

            u_innerLimit: Math.cos(degToRad(light._fov / 2 - 10)),
            u_outerLimit: Math.cos(degToRad(light._fov / 2)),
            u_lightDirection: scale(-1, light.lightDirection),

            spotlightIntensity: light.intensity * light.visible || 0.0,

            u_projectedTexture_spot: light.shadowMapTexture,
            u_spotLightColor: light.color,
          })

        }
      }
    }

    twgl.setUniforms(programInfo, {
      // Set near & far

      shadowClipNear: this.shadowClipNear,
      shadowClipFar: this.shadowClipFar,

      time: this.time
    })


    camera.updateCameraToRenderer(this.programInfos.main)
    this.renderObjectTree(scene, camera, app)

    this.time += 0.04
  }


  renderPicking(scene, camera, mouseX, mouseY) {
    if (this.lastCanvasHeight !== this.canvas.height || this.lastCanvasWidth !== this.canvas.width) {
      console.log('a')
      this.setFramebufferAttachmentSizes(canvas.width, canvas.height)
      this.updateLastCanvasSize()
    }

    let objectNames = []

    let gl = this.gl
    let programInfo = this.programInfos.objectPick
    gl.useProgram(programInfo.program)

    gl.clearColor(1.0, 1.0, 1.0, 1.0)

    // ------ Draw the objects to the texture --------

    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fb)
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

    gl.enable(gl.CULL_FACE)

    twgl.setUniforms(programInfo, {
      u_matrix: m4.multiply(camera.projectionMatrix, camera.viewMatrix),
    })

    // Clear the canvas AND the depth buffer.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    this.renderPickingTree(scene, objectNames)

    const pixelX = mouseX * gl.canvas.width / gl.canvas.clientWidth;
    const pixelY = gl.canvas.height - mouseY * gl.canvas.height / gl.canvas.clientHeight - 1;

    const data = new Uint8Array(4)
    gl.readPixels(
        pixelX,            // x
        pixelY,            // y
        1,                 // width
        1,                 // height
        gl.RGBA,           // format
        gl.UNSIGNED_BYTE,  // type
        data);             // typed array to hold result
    const id = data[0] + (data[1] << 8) + (data[2] << 16) + (data[3] << 24)
    return objectNames[id]
  }


  renderPickingObject(object, id) {

    // Update object matrix
    if (object.localMatrixNeedsUpdate) {
      object.updateLocalMatrix()
      object.updateShallowWorldMatrix()
      object.children.forEach(child => child.localMatrixNeedsUpdate = true)
    }
    if (!object.visible) return

    // Ignore if the object has no geometry
    if (!object.geometry || object.geometry.vertexStartIndex < 0) {
      return
    }

    let gl = this.gl
    let programInfo = this.programInfos.objectPick

    const colorId = 
    [((id >>  0) & 0xFF) / 0xFF,
    ((id >>  8) & 0xFF) / 0xFF,
    ((id >> 16) & 0xFF) / 0xFF,
    ((id >> 24) & 0xFF) / 0xFF]

    twgl.setUniforms(programInfo, {
      isTreeLeaf: object.name === 'Daun',
      isGrass: object.name === 'rumput',
      u_world: object.worldMatrix,
      u_id: colorId,
    })

    let geometry = object.geometry
    geometry.bindBufferRendererToThis(gl, this, programInfo)
    gl.drawArrays(gl.TRIANGLES, 0, geometry.triangleVerticesCount)
    return id++
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


  renderPickingTree(object, objectNames) {
    const self = this
    let id = objectNames.length
    self.renderPickingObject(object, id)
    objectNames.push(object.name)

    object.children.forEach(child => {
      self.renderPickingTree(child, objectNames)
    })
  }


  generateDirectionalLightShadowMap(light, app) {

    let gl = this.gl
    let programInfo = this.programInfos.shadowGen
    let texSize = light.shadowMapTextureSize

    gl.bindFramebuffer(gl.FRAMEBUFFER, light.framebuffer)
    gl.viewport(0, 0, texSize, texSize)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

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
    if (!object.visible) return

    // Ignore if geometry is none

    if (!object.geometry || object.geometry.vertexStartIndex < 0) {
      return
    }

    let gl = this.gl
    let programInfo = this.programInfos.main

    // Set up vertex position and inverse world matrix for normal calculation

    let worldViewMatrix = m4.multiply(camera.viewMatrix, object.worldMatrix)
    let normalMatrix = m4.transpose(m4.inverse(worldViewMatrix))

    // Set up shader

    let selected = app.selectedObjectName === object.name
    let material = object.material

    let textureMix = 0

    if (!selected) {
      if (material instanceof PhongMaterial) {
        let { ambient, diffuse, specular, shininess } = material

        let light = Light.lightList[0]
        if (light) {
          ambient = flatten(mult(light.ambient, ambient))
          diffuse = flatten(mult(light.diffuse, diffuse))
          specular = flatten(mult(light.specular, specular))
        }

        twgl.setUniforms(programInfo, {
          ambientProduct: ambient,
          diffuseProduct: diffuse,
          specularProduct: specular,
          shininess: shininess
        })
      }

      if (material instanceof ImageTextureMaterial) {
        textureMix = 1
        twgl.setUniforms(programInfo, {
          u_texture: material.texture
        })
      }
    }

    let geometry = object.geometry

    if (object instanceof Light) {
      textureMix = 0.0
      geometry = object.wireframeGeometry
    }

    twgl.setUniforms(programInfo, {

      u_world: object.worldMatrix,
      u_normCam: normalMatrix,

      isSelected: selected,
      isRenderingWireframe: geometry.wireframeMode,
      textureMix: textureMix,

      isTreeLeaf: object.name === 'Daun',
      isGrass: object.name === 'rumput'
    })
    
    geometry.bindBufferRendererToThis(gl, this, programInfo)
    if (geometry.wireframeMode) {
      gl.drawArrays(gl.LINES, 0, geometry.triangleVerticesCount)
    } else {
      gl.drawArrays(gl.TRIANGLES, 0, geometry.triangleVerticesCount)
    }

    if (object instanceof MatrixBasedLight) {
      let light = object
      let geometry = light.directionHelper

      twgl.setUniforms(programInfo, {
        isRenderingWireframe: geometry.wireframeMode
      })

      geometry.bindBufferRendererToThis(gl, this, programInfo)
      gl.drawArrays(gl.LINES, 0, geometry.triangleVerticesCount)

      if (selected) {
        let mat = m4.multiply(m4.inverse(light.lightWorldMatrix), m4.inverse(light.lightProjectionMatrix))
        mat = m4.scale(mat, 2, 2, 2)
        twgl.setUniforms(programInfo, {
          u_world: mat
        })

        geometry = light.areaHelper
        geometry.bindBufferRendererToThis(gl, this, programInfo)
        gl.drawArrays(gl.LINES, 0, geometry.triangleVerticesCount)
      }

    }

  }


  /** Render shadow 3D Object */

  renderShadowObject(object) {
    if (!object.visible) return
    
    // Update object matrix

    if (object.localMatrixNeedsUpdate) {
      object.updateLocalMatrix()
      object.updateShallowWorldMatrix()

      // Trigger children to also update its matrices
      object.children.forEach(child => child.localMatrixNeedsUpdate = true)
    }
    if (!object.visible) return

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

    twgl.setUniforms(programInfo, {
      isTreeLeaf: object.name === 'Daun',
      isGrass: object.name === 'rumput',
      u_world: flatten(object.worldMatrix)
    })

    let geometry = object.geometry
    geometry.bindShadowBufferRendererToThis(gl, this, programInfo)
    gl.drawArrays(gl.TRIANGLES, 0, geometry.triangleVerticesCount)
  }
}