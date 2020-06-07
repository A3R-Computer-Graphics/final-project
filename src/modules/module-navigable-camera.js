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
  },

  multiplyUsingReduce: function (a, b) {
    let rowA = a.length
    let colB = b[0].length

    let m = new Array(rowA)
    for (let r = 0; r < rowA; r++) {
      m[r] = new Array(colB)
      for (let c = 0; c < colB; c++) {
        m[r][c] = a[r].reduce((sum, curr, i) => sum + curr * b[i][c])
      }
    }
    return m;
  },

  multiply: function (a, b) {
    var aNumRows = a.length, aNumCols = a[0].length,
      bNumRows = b.length, bNumCols = b[0].length,
      m = new Array(aNumRows);  // initialize array of rows

    for (var r = 0; r < aNumRows; ++r) {
      m[r] = new Array(bNumCols); // initialize the current row
      for (var c = 0; c < bNumCols; ++c) {
        m[r][c] = 0;             // initialize the current cell
        for (var i = 0; i < aNumCols; ++i) {
          m[r][c] += a[r][i] * b[i][c];
        }
      }
    }
    return m;
  },

  to2dMatrix: function (mat, rowNumber) {
    let newMat = new Array(rowNumber)
    let colNumber = Math.round(mat.length / rowNumber)

    let i = 0
    for (let r = 0; r < rowNumber; r++) {
      let col = new Array(colNumber)
      for (let c = 0; c < colNumber; c++) {
        col[c] = mat[i]
        i++
      }
      newMat[r] = col
    }

    return newMat
  },

  mat4As2D: function (mat) {
    return this.to2dMatrix(mat, 4)
  }
}



class NavigableCamera {

  static MAX_FOCUS_PROGRESS_FRAME_DURATION = 15

  constructor() {
    this.scrollDetector = document.querySelector('#scroll-detector > *')
    this.scrollInitial = 0
    this.numToIgnoreScrollCall = 0

    this.posXInit = 0
    this.posYInit = 0
    this.initPhi = 0
    this.initTheta = 0

    this.CLICK_FOR_TRACKBALL = 0
    this.CLICK_FOR_FACE_MOVEMENT = 1
    this.CLICK_FOR_GROUND_MOVEMENT = 2
    this.clickMode = this.CLICK_FOR_TRACKBALL
    this.isClicking = false

    this.axisCoordinates = [[0, 0, 0, 1], [0, 1, 0, 1], [1, 0, 0, 1], [0, 0, 1, 1]]
    this.AXIS_BASE_ID = 0
    this.AXIS_UP_ID = 1
    this.AXIS_RIGHT_ID = 2
    this.AXIS_BACK_ID = 3

    this.lastFrame = 0
    this.pressedKeys = {
      forward: false,
      backward: false,
      leftward: false,
      rightward: false,
      upward: false,
      downward: false,
    }

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
    // window.addEventListener('keydown', this._proxy(this.processCanvasArrowKeydown))
    window.addEventListener('keydown', this._proxy(this.processCanvasFocusKeydown))
    window.addEventListener('keydown', this._proxy(this.processCanvasPerspectiveKeyDown))
    window.addEventListener('keydown', this._proxy(this.processCameraMovementKeyDown))
    window.addEventListener('keyup', this._proxy(this.processCameraMovementKeyUp))
  }

  processCanvasPerspectiveKeyDown(event) {
    const key = NavigableCameraUtils.alphabetFromEvent(event)
    const { selectedObject } = app

    if (key !== 'P' || !selectedObject) {
      console.log('Trying to switch perspective without selecting an object...')
      return
    }

    if (camera.shouldSwitchBackToThirdPersonView) {
      camera.switchToThirdPersonView()
      return
    }

    camera.switchToFirstPersonView()
  }

  eventToDirection(event) {
    let key = NavigableCameraUtils.alphabetFromEvent(event)
    if (!key) {
      key = NavigableCameraUtils.directionFromKeyboardArrow(event)
    }
    switch (key) {
      case "W":
        return "forward"
      case "A":
        return "leftward"
      case "S":
        return "backward"
      case "D":
        return "rightward"
      case "UP":
        return "upward"
      case "DOWN":
        return "downward"
      case "RIGHT":
        return "rotateRight"
      case "LEFT":
        return "rotateLeft"
      default:
        return undefined
    }
  }

  get isMovementKeyPressed() {
    for (var key in this.pressedKeys) if (!!key && this.pressedKeys[key]) return true;
    return false;
  }

  processCameraMovementKeyDown(event) {
    const direction = this.eventToDirection(event)
    if (!direction) return
    this.pressedKeys[direction] = true
  }

  processCameraMovementKeyUp(event) {
    const direction = this.eventToDirection(event)
    if (!direction) return
    this.pressedKeys[direction] = false
  }

  updateFirstPersonViewCamera() {
    if (!camera.isFirstPersonView) return
    const { currentFirstPersonViewObject } = camera;
    camera.computeFirstPersonViewCamera(currentFirstPersonViewObject)
  }

  controlSelectedObject() {
    const selected = camera.currentFirstPersonViewObject.root
    window.selected = selected
    const util = NavigableCameraUtils

    let viewMatrix = camera.viewMatrix
    viewMatrix = m4.inverse(viewMatrix)
    viewMatrix = util.mat4As2D(viewMatrix)

    let axis = util.multiplyUsingReduce(this.axisCoordinates, viewMatrix)

    let base = axis[this.AXIS_BASE_ID]
    let up = axis[this.AXIS_UP_ID]
    let back = axis[this.AXIS_BACK_ID]
    
    up = subtract(up, base).splice(0, 3)
    up = normalize(up)
    
    back = subtract(back, base).splice(0, 3)
    back = normalize(back)

    let right = cross(up, back)
    right = normalize(right)

    let deltaX = 0;
    if (this.pressedKeys.rightward && !this.pressedKeys.leftward) deltaX = 0.1;
    else if (this.pressedKeys.leftward && !this.pressedKeys.rightward) deltaX = -0.1;

    let deltaY = 0;
    if (this.pressedKeys.forward && !this.pressedKeys.backward) deltaY = -0.1;
    else if (this.pressedKeys.backward && !this.pressedKeys.forward) deltaY = 0.1;

    let deltaMovement = scale(deltaX, right)
    let deltaBack = scale(deltaY, back)
    deltaMovement = add(deltaMovement, deltaBack)

    let deltaXRotation = 0;
    if (this.pressedKeys.upward && !this.pressedKeys.downward) deltaXRotation = -1;
    else if (this.pressedKeys.downward && !this.pressedKeys.upward) deltaXRotation = 1;

    let deltaZRotation = 0;
    if (this.pressedKeys.rotateLeft && !this.pressedKeys.rotateRight) deltaZRotation = 1;
    else if (this.pressedKeys.rotateRight && !this.pressedKeys.rotateLeft) deltaZRotation = -1;

    selected.position.set(add(selected.position.property, deltaMovement))
    selected.rotation.setX((selected.rotation.property[0] + deltaXRotation) % 360)
    selected.rotation.setZ((selected.rotation.property[2] + deltaZRotation) % 360)
    selected.localMatrixNeedUpdate = true
  }

  updateCameraMovement() {
    if (!this.isMovementKeyPressed) return
    if (camera.isFirstPersonView) {
      this.controlSelectedObject()
      return
    }
    const util = NavigableCameraUtils

    let viewMatrix = camera.viewMatrix
    viewMatrix = m4.inverse(viewMatrix)
    viewMatrix = util.mat4As2D(viewMatrix)

    let axis = util.multiplyUsingReduce(this.axisCoordinates, viewMatrix)

    let base = axis[this.AXIS_BASE_ID]
    let up = axis[this.AXIS_UP_ID]
    let back = axis[this.AXIS_BACK_ID]
    
    up = subtract(up, base).splice(0, 3)
    up = normalize(up)
    
    back = subtract(back, base).splice(0, 3)
    back = normalize(back)

    let right = cross(up, back)
    right = normalize(right)

    let deltaX = 0;
    if (this.pressedKeys.rightward && !this.pressedKeys.leftward) deltaX = 0.1;
    else if (this.pressedKeys.leftward && !this.pressedKeys.rightward) deltaX = -0.1;

    let deltaY = 0;
    if (this.pressedKeys.forward && !this.pressedKeys.backward) deltaY = -0.1;
    else if (this.pressedKeys.backward && !this.pressedKeys.forward) deltaY = 0.1;

    let deltaZ = 0;
    if (this.pressedKeys.upward && !this.pressedKeys.downward) deltaZ = 0.1;
    else if (this.pressedKeys.downward && !this.pressedKeys.upward) deltaZ = -0.1;

    let deltaMovement = scale(deltaX, right)
    let deltaBack = scale(deltaY, back)
    let deltaUp = scale(deltaZ, up)
    deltaMovement = add(deltaMovement, deltaBack)
    deltaMovement = add(deltaMovement, deltaUp)

    at = add(at, deltaMovement)
    camera.position.set(add(camera.position.get(), deltaMovement))
    updateCameraView()
  }

  update(currentFrame) {
    this.updateFirstPersonViewCamera()
    this.updateCameraMovement()
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
    if (this.isClicking) {
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
    this.isClicking = true
  }


  processTrackball(event) {
    if (!this.isClicking) {
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
    if (!this.isClicking) {
      return
    }
    this.isClicking = false
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
    if (this.isClicking) {
      return
    }

    const util = NavigableCameraUtils

    let viewMatrix = camera.viewMatrix
    viewMatrix = m4.inverse(viewMatrix)
    viewMatrix = util.mat4As2D(viewMatrix)

    let axis = util.multiplyUsingReduce(this.axisCoordinates, viewMatrix)

    let base = axis[this.AXIS_BASE_ID]
    let up = axis[this.AXIS_UP_ID]
    let back = axis[this.AXIS_BACK_ID]
    
    up = subtract(up, base).splice(0, 3)
    up = normalize(up)
    this.movementUp = up
    
    back = subtract(back, base).splice(0, 3)
    back = normalize(back)
    this.movementBack = back

    let right = cross(up, back)
    right = normalize(right)
    this.movementRight = right

    this.startEye = [...camera.position.get()]
    this.startAt = [...at]

    this.posXInit = event.screenX
    this.posYInit = event.screenY

    this.isClicking = true
  }

  processCameraMovement(event) {
    if (!this.isClicking) {
      return
    }

    let eventX = event.screenX
    let eventY = event.screenY

    let deltaX = this.posXInit - eventX
    let deltaY = this.posYInit - eventY

    deltaX /= canvas.width / 3
    deltaY /= canvas.height / 3
    deltaY *= -1

    let deltaMovement = scale(deltaX, this.movementRight)
    if (this.clickMode === this.CLICK_FOR_FACE_MOVEMENT) {
      let deltaUp = scale(deltaY, this.movementUp)
      deltaMovement = add(deltaMovement, deltaUp)
    } else if (this.clickMode === this.CLICK_FOR_GROUND_MOVEMENT) {
      let deltaBack = scale(deltaY, this.movementBack)
      deltaMovement = add(deltaMovement, deltaBack)
    }

    let newEye = add(this.startEye, deltaMovement)
    let newAt = add(this.startAt, deltaMovement)

    at = newAt
    camera.position.set(newEye)
    updateCameraView()
  }

  stopCameraMovement(event) {
    if (!this.isClicking) {
      return
    }
    this.isClicking = false
  }

  onMouseDown(event) {
    if (event.shiftKey || event.altKey) {
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
    if (!this.isClicking) {
      return
    }

    if (this.clickMode === this.CLICK_FOR_TRACKBALL) {
      this.processTrackball(event)
    } else {
      this.processCameraMovement(event)
    }

    this.clearSelection()
  }
}