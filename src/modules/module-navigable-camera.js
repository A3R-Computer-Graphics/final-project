const NavigableCameraUtils = {

  /**
   * Convert keyboard into directions: "LEFT", "RIGHT", "UP", and "DOWN".
   *
   * @param {Event} event
   */

  directionFromKeyboardArrow: function (event) {
    let direction = ''
    let whichToDirection = {
      37: 'LEFT',
      38: 'UP',
      39: 'RIGHT',
      40: 'DOWN',
    }
    if (event.code) {
      // Remove 'Arrow' token in the string
      direction = event.code.replace('Arrow', '')
    } else if (event.key) {
      direction = event.code.replace('Arrow', '')
    } else {
      direction = whichToDirection[event.which] || ''
    }

    if (direction.length > 0) {
      direction = direction.toUpperCase()
      if (coordinateDirectionOrder.indexOf(direction) >= 0) {
        return direction
      }
    }
  },

  alphabetFromEvent: function (event) {
    let key = undefined
    if (event.code) {
      key = (event.code.match(/Key([A-Z])/) || {})[1]
    } else if (event.key) {
      key = (event.key.match(/^([a-zA-Z])/) || {})[1]
    }
    if (key) {
      return key.toUpperCase()
    }
  }
}



class NavigableCamera {

  static MAX_FOCUS_PROGRESS_FRAME_DURATION = 15

  constructor() {
    this.scrollDetector = document.querySelector('#scroll-detector > *')
    this.scrollInitial = 0
    this.numToIgnoreScrollCall = 0

    this.isClickingForTrackball = false

    this.posXInit = 0
    this.posYInit = 0
    this.initPhi = 0
    this.initTheta = 0

    this.CLICK_FOR_TRACKBALL = 0
    this.CLICK_FOR_FACE_MOVEMENT = 1
    this.CLICK_FOR_GROUND_MOVEMENT = 2

    this.clickMode = this.CLICK_FOR_TRACKBALL

    this.cancelCurrentFocusAnimation = function () { }

    this.setup()
  }

  setup() {
    this.setupZoomUsingScroll()
    this.setupTrackball()
    this.setupNavigateUsingKeyboard()
  }

  setupZoomUsingScroll() {
    this.scrollDetector.scrollTop = this.scrollDetector.clientHeight / 2
    this.scrollInitial = this.scrollDetector.scrollTop
    this.scrollDetector.addEventListener('scroll', this._proxy(this.zoomCameraFromScrollDetector))
  }

  _proxy(func) {
    let self = this
    return function () {
      func.apply(self, arguments)
    }
  }

  setupTrackball() {
    this.scrollDetector.parentElement.addEventListener('mousedown', this._proxy(this.onMouseDown))
    document.addEventListener('mousemove', this._proxy(this.onMouseMove))
    document.addEventListener('mouseup', this._proxy(this.onMouseUp))

    this.scrollDetector.parentElement.addEventListener('touchstart', this._proxy(this.startTrackballOnDevice))
    document.addEventListener('touchmove', this._proxy(this.processTrackballOnDevice))
    document.addEventListener('touchend', this._proxy(this.stopTrackballOnDevice))
  }

  setupNavigateUsingKeyboard() {
    canvas.parentElement.addEventListener('keydown', this._proxy(this.processCanvasArrowKeydown))
    canvas.parentElement.addEventListener('keydown', this._proxy(this.processCanvasFocusKeydown))
  }

  /**
   * Process canvas keydown event. If arrow key is pressed,
   * it will later be transformed into next camera position
   * accoding to `cameraMovementCoordinates`.
   *
   * @param {Event} event
   */

  processCanvasArrowKeydown(event) {
    let direction = NavigableCameraUtils.directionFromKeyboardArrow(event)
    if (!direction) {
      return
    }

    let directionIdx = coordinateDirectionOrder.indexOf(direction)
    let newAllowedCoords = cameraMovementCoordinates[cameraPosIndex]
    let newCameraPosIdx = newAllowedCoords[directionIdx]
    if (newCameraPosIdx < 0) {
      return
    }

    cameraPosIndex = newCameraPosIdx

    let cameraPosCoords = cameraCoordinates[cameraPosIndex]
    let cameraSpherePos = cartesianToSphere(
      cameraPosCoords[0],
      -cameraPosCoords[2],
      cameraPosCoords[1]
    )
    let new_phi = cameraSpherePos[1]
    let new_theta = cameraSpherePos[2]

    phi = new_phi
    theta = new_theta
    updateCameraView()
  }

  /** Capture scroll movement and translate it into sphere radius coordinate
   * or distance from origin to camera. The radius is capped between near & far
   * values.
   */

  zoomCameraFromScrollDetector() {
    if (this.numToIgnoreScrollCall > 0) {
      this.numToIgnoreScrollCall -= 1
      return
    } else {
      this.numToIgnoreScrollCall = 0
    }
    let deltaScroll = this.scrollDetector.scrollTop - this.scrollInitial

    this.numToIgnoreScrollCall += 1
    this.scrollDetector.scrollTop = this.scrollInitial

    let newRadius = Math.pow(Math.E, Math.log(cameraRadius) + deltaScroll / 10)
    if (newRadius < camera.near) {
      return
    }
    if (newRadius > camera.far) {
      return
    }

    cameraRadius = newRadius
    updateCameraView()
  }

  /** Implement trackball using sphere coordinate.
   * Source: https://computergraphics.stackexchange.com/questions/151/how-to-implement-a-trackball-in-opengl
   * */

  startTrackball(event) {
    if (this.isClickingForTrackball) {
      return
    }

    this.posXInit = event.screenX
    this.posYInit = event.screenY

    if (event.touches) {
      this.posXInit = event.touches[0].screenX
      this.posYInit = event.touches[0].screenY
    }

    this.initPhi = phi
    this.initTheta = theta

    this.isClickingForTrackball = true
  }


  processTrackball(event) {
    if (!this.isClickingForTrackball) {
      return
    }

    let eventX = event.screenX
    let eventY = event.screenY

    if (event.touches && event.touches.length === 1) {
      eventX = event.touches[0].screenX
      eventY = event.touches[0].screenY
    }

    let deltaX = eventX
    let deltaY = eventY

    deltaX -= this.posXInit
    deltaY -= this.posYInit

    if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) {
      return
    }

    deltaX = deltaX / window.innerWidth * 2
    deltaY = -deltaY / window.innerHeight * 2

    phi = this.initPhi + -deltaX * 3
    let newTheta = this.initTheta + deltaY * 3

    // Avoid making theta == 0 and changes direction (going negative from positive and vice versa).

    let signChangesSinceInitial = Math.sign(newTheta) !== Math.sign(this.initTheta)

    let touchingNorthPole = Math.abs(newTheta) < 0.01
    let touchingSouthPole = Math.abs(newTheta) > Math.PI - 0.01

    let goingBeyondNorthPole = Math.sign(deltaY) < 0 && signChangesSinceInitial
    let goingBeyondSouthPole = Math.sign(deltaY) > 0 && signChangesSinceInitial

    if (touchingNorthPole || goingBeyondNorthPole) {
      newTheta = 0.01
      this.initTheta = newTheta
      this.posYInit = eventY
    } else if (touchingSouthPole || goingBeyondSouthPole) {
      newTheta = Math.PI - 0.01
      this.initTheta = newTheta
      this.posYInit = eventY
    }

    theta = newTheta
    updateCameraView()

    this.clearSelection()
  }

  // Clear selection
  // Taken from: https://stackoverflow.com/a/3169849/10159381

  clearSelection() {

    if (window.getSelection) {
      if (window.getSelection().empty) {
        window.getSelection().empty()
      } else if (window.getSelection().removeAllRanges) {
        window.getSelection().removeAllRanges()
      }
    } else if (document.selection) {
      document.selection.empty()
    }

  }

  stopTrackball() {
    if (!this.isClickingForTrackball) {
      return
    }
    this.isClickingForTrackball = false
  }

  startTrackballOnDevice(event) {
    event.preventDefault()
    this.startTrackball(event)
  }

  processTrackballOnDevice(event) {
    this.processTrackball(event)
  }

  stopTrackballOnDevice(event) {
    this.stopTrackball(event)
  }

  processCanvasFocusKeydown(event) {
    let key = NavigableCameraUtils.alphabetFromEvent(event)
    let selectedObject = app.selectedObject

    if (key !== 'F' || !selectedObject) {
      return
    }

    let objectMatrix = mat4(selectedObject.worldMatrix)
    let objectWorldPosition = objectMatrix[3].slice(0, 3)

    let oldPosition = at
    let newPosition = vec3(objectWorldPosition)

    let oldRadius = cameraRadius
    let newRadius = 4

    this.cancelCurrentFocusAnimation()
    let progress = 0

    let animationCancelled = false

    this.cancelCurrentFocusAnimation = function () {
      animationCancelled = true
    }

    let animationDuration = NavigableCamera.MAX_FOCUS_PROGRESS_FRAME_DURATION

    let animateFocusTransition = function () {
      if (progress > animationDuration || animationCancelled) {
        return
      }

      let x = progress / animationDuration
      let y = 1 - Math.pow(x - 1, 2)

      at = mix(oldPosition, newPosition, y)
      cameraRadius = oldRadius * (1 - y) + newRadius * y

      updateCameraView()

      progress += 1
      window.requestAnimationFrame(animateFocusTransition)
    }

    window.requestAnimationFrame(animateFocusTransition)

  }
  

  startCameraMovement(event) {

  }

  processCameraMovement(event) {

  }

  stopCameraMovement(event) {

  }

  onMouseDown(event) {
    if (event.shiftKey || event.ctrlKey) {
      this.clickMode = event.shiftKey ? this.CLICK_FOR_GROUND_MOVEMENT : this.CLICK_FOR_FACE_MOVEMENT
      this.startCameraMovement(event)
    } else {
      this.clickMode = this.CLICK_FOR_TRACKBALL
      this.startTrackball(event)
    }
  }

  onMouseUp(event) {
    if (this.clickMode === this.CLICK_FOR_TRACKBALL) {
      this.stopTrackball(event)
    } else {
      this.stopCameraMovement(event)
    }
  }

  onMouseMove(event) {
    if (this.clickMode === this.CLICK_FOR_TRACKBALL) {
      this.processTrackball(event)
    } else {
      this.processCameraMovement (event)
    }
  }
}