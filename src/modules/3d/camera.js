"use strict"

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
