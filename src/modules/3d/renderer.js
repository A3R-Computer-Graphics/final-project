"use strict"

class Renderer extends EventDispatcher {

  constructor(canvas) {
    super()

    this.canvas = canvas
    this.gl = null
    this.program = null
    this.textureProgram = null

    this.programUniformList = [
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

    this.programAttribList = [
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
    let gl = this.gl
    let program = this.program
    let uniforms = program.uniforms = {}

    this.programUniformList.forEach(uniformName => {
      uniforms[uniformName] = gl.getUniformLocation(program, uniformName)
    })
  }


  initAttributes() {
    let gl = this.gl
    let program = this.program
    let attribs = program.attribs = {}

    this.programAttribList.forEach(attribName => {
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

    gl.uniform1f(uniforms.textureMix, textureMix)

    let geometry = object.geometry
    let start = geometry.bufferStartIndex
    let count = geometry.triangleVerticesCount
    gl.drawArrays(gl.TRIANGLES, start, count)
  }
}