"use strict"

class CameraPrototype extends Object3D {
  constructor(name) {
    super({ name })
    this.up = [0, 0, 1] // UP AT Z-AXIS (IMPORTANT)
    this.viewMatrix = m4.identity()
    this.projectionMatrix = m4.identity()

    this.cameraMatrixNeedsUpdate = false
    
    // Perspective Changer Attributes
    this.isFirstPersonView = false
    this.currentFirstPersonViewObject = null
    this.lastThirdPersonViewInformation = {
        at: [0, -1, 0],
        position: [0, 0, 0],
    }
    this.animationStillRunning = false
    this.cancelSwitchCameraAnimation = function() {}
    this.pendingFunctions = []
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

  updateCameraToRenderer(programInfo) {
    if (!this.cameraMatrixNeedsUpdate) {
      return
    }

    this.updateProjectionMatrix()
    
    let uniforms = {
      u_proj: this.projectionMatrix,
      u_cam: this.viewMatrix,
      u_viewWorldPosition: m4.inverse(this.viewMatrix).slice(12, 15)
    }

    twgl.setUniforms(programInfo, uniforms)

    this.cameraMatrixNeedsUpdate = false
  }

  switchToThirdPersonView() {
      document.querySelector('#third-person-camera-button').hidden = true
      this.isFirstPersonView = false
      this.currentFirstPersonViewObject = null

      const { position: newPosition, at: newAt } = this.lastThirdPersonViewInformation

      const resetPositionAndAt = () => {
        this.position.set(newPosition)
        at = newAt
      }

      this.cancelSwitchCameraAnimation()
    
      let progress = 0
      let animationCancelled = false
      this.cancelSwitchCameraAnimation = () => {
        animationCancelled = true
        // resetPositionAndAt()
      }
      let animationDuration = NavigableCamera.MAX_FOCUS_PROGRESS_FRAME_DURATION * 2

      const [oldPosition, oldAt] = [[...this.position.property], [...at]];
      let animateFocusTransition = () => {
        if (progress > animationDuration || animationCancelled) {
          this.animationStillRunning = false
          this.pendingFunctions = []
          return
        }
        this.animationStillRunning = true

        let x = progress / animationDuration
        let y = 1 - Math.pow(x - 1, 2)

        const interpolatePos = mix(oldPosition, newPosition, y)
        const interpolateAt = mix(oldAt, newAt, y)

        this.position.set(interpolatePos)
        this.lookAt(interpolateAt)
        
        progress += 1
        window.requestAnimationFrame(animateFocusTransition)
      }

      window.requestAnimationFrame(animateFocusTransition)      
      resetPositionAndAt()

      return
  }

  get shouldSwitchBackToThirdPersonView() {
      return this.isFirstPersonView && app.selectedObject == this.currentFirstPersonViewObject
  }

  cacheThirdPersonViewCamera(oldAt, oldPosition) {
    this.lastThirdPersonViewInformation.position = oldPosition
    this.lastThirdPersonViewInformation.at = oldAt
  }

  computeFirstPersonViewCamera(selectedObject, animate = false) {
    const root = selectedObject.root

    const direction = !root.direction ? [0.0, -2.0, 0.0, 1.0] : root.direction
    const objectMatrix = selectedObject.worldMatrix
    
    const matrix = [[0.0, -1.0, 0.0, 1.0], direction, direction, direction]

    const resultingMatrix = m4.multiply(objectMatrix, flatten(matrix))
    const newAt = resultingMatrix.slice(4, 7)    
    const newPosition = resultingMatrix.slice(0, 3)

    if (this.position === newPosition && at === newAt) return
    
    if (animate) {
      this.cancelSwitchCameraAnimation()
    
      let progress = 0
      let animationCancelled = false
      this.cancelSwitchCameraAnimation = () => {
        this.position.set(newPosition)
        at = newPosition
        animationCancelled = true
      }

      let animationDuration = NavigableCamera.MAX_FOCUS_PROGRESS_FRAME_DURATION * 2

      const [oldPosition, oldAt] = [[...camera.position.property], [...at]];
      let animateFocusTransition = () => {
        if (progress > animationDuration || animationCancelled) {
          this.animationStillRunning = false
          for (var pendingFunction of this.pendingFunctions) pendingFunction()
          this.pendingFunctions = []
          return
        }
        this.animationStillRunning = true

        let x = progress / animationDuration
        let y = 1 - Math.pow(x - 1, 2)

        const interpolatePos = mix(oldPosition, newPosition, y)
        const interpolateAt = mix(oldAt, newAt, y)

        this.position.set(interpolatePos)
        this.lookAt(interpolateAt)
        
        progress += 1
        window.requestAnimationFrame(animateFocusTransition)
      }

      window.requestAnimationFrame(animateFocusTransition)
    }
    
    const setNewPositionAndAt = () => {
      this.position.set(newPosition)
      this.lookAt(newAt)
      at = newAt
    }
    if (this.animationStillRunning) {
      this.pendingFunctions.push(setNewPositionAndAt)
    } else {
      setNewPositionAndAt()
    }
  }

  switchToFirstPersonView() {
    document.querySelector('#third-person-camera-button').hidden = false
    const [oldAt, oldPosition] = [[...at], [...camera.position.property]]
    const { selectedObject } = app
    if (!this.isFirstPersonView) this.cacheThirdPersonViewCamera(oldAt, oldPosition)
    this.computeFirstPersonViewCamera(selectedObject, true)
    this.isFirstPersonView = true
    this.currentFirstPersonViewObject = selectedObject
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
    this.projectionMatrix = flatten(perspective(this.fovy, this.aspect, this.near, this.far))
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
