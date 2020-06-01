"use strict"

class Light extends Object3D {
  static lightList = []
  static initialized = false

  // This is done to avoid using different geometery and materials
  // since light doesn't need that.
  
  static lightCubeGeometry = new PrimitiveCube()
  static lightCubeMaterial = new EmissionMaterial()

  constructor() {
    super({
      geometry: Light.lightCubeGeometry,
      material: Light.lightCubeMaterial
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