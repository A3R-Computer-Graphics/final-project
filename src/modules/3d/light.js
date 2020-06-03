"use strict"

class Light extends Object3D {
  static lightList = []

  // This is done to avoid using different geometery and materials
  // since light doesn't need that.
  
  static lightCubeGeometry = new PrimitiveCube()
  static lightCubeMaterial = new EmissionMaterial()
  static lastShadowMapIndex = 1 // Added 1 because the 0 is used for material texture

  static TEXTURE_SIZE = 512

  constructor(textureSize) {
    super({
      geometry: Light.lightCubeGeometry,
      material: Light.lightCubeMaterial
    })

    this.ambient = vec4(0.2, 0.2, 0.2, 1.0)
    this.diffuse = vec4(1.0, 1.0, 1.0, 1.0)
    this.specular = vec4(1.0, 1.0, 1.0, 1.0)

    this.shadowMapIndex = Light.lastShadowMapIndex++
    this.shadowMapTexture = null
    this.shadowMapTextureSize = textureSize || Light.TEXTURE_SIZE

    Light.lightList.push(this)
  }

  get shadowMapTextureInitialized() {
    return this.shadowMapTexture !== null
  }


  updateLightToRenderer(renderer) {
    let gl = renderer.gl
    let lightPositionLoc = renderer.program.uniforms.lightPosition

    // TODO: Right now it uses original light position
    // but the light can be parented to any object so
    // matrix transformation should be taken into account

    // this.updateWorldMatrix()
    gl.uniform3fv(lightPositionLoc, this.worldPosition)
  }
}


class PointLight extends Light {

  initTexture(gl) {
    this.shadowMapTexture = gl.createTexture()

    gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.shadowMapTexture)
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT)
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT)

    /** Sorry if this seems too verbose, I am just making sure
     * the parameter of these WebGL functions is obvious. */

    let CUBE_SIDE = 6
    let width = this.shadowMapTextureSize
    let height = width
    let format = gl.RGBA
    let dataType = gl.UNSIGNED_BYTE
    let level = 0
    let border = 0
    let pixelSourceBuffer = null

    for (let i = 0; i < CUBE_SIDE; i++) {
      let target = gl.TEXTURE_CUBE_MAP_POSITIVE_X + i
      gl.texImage2D(target, level, format, width, height, border, format, dataType, pixelSourceBuffer)
    }
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null)
  }

  bindGlToThisTexture(gl) {
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.shadowMapTexture)
  }
}