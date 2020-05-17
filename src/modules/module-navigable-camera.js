// Detecting scroll movement

let scrollDetector;
let scrollInitial;

let MAX_FOCUS_PROGRESS_FRAME_DURATION = 15;

function initNavigableCamera() {

  scrollDetector = document.querySelector('#scroll-detector > *')
  scrollDetector.scrollTop = scrollDetector.clientHeight / 2;
  scrollInitial = scrollDetector.scrollTop;
  scrollDetector.addEventListener('scroll', zoomCameraFromScrollDetector)

  scrollDetector.parentElement.addEventListener('mousedown', startTrackball)
  document.addEventListener('mousemove', trackMouseForTrackball)
  document.addEventListener('mouseup', stopTrackball)

  scrollDetector.parentElement.addEventListener('touchstart', startTrackballOnDevice)
  document.addEventListener('touchmove', trackMouseForTrackballOnDevice)
  document.addEventListener('touchend', stopTrackballOnDevice)

  canvas.parentElement.addEventListener('keydown', processCanvasArrowKeydown)
  canvas.parentElement.addEventListener('keydown', processCanvasFocusKeydown)
}

/**
 * Convert keyboard into directions: "LEFT", "RIGHT", "UP", and "DOWN".
 *
 * @param {Event} event
 */

function convertKeyboardIntoDirection(event) {
  let direction = '';
  let whichToDirection = {
    37: 'LEFT',
    38: 'UP',
    39: 'RIGHT',
    40: 'DOWN',
  };
  if (event.code) {
    // Remove 'Arrow' token in the string
    direction = event.code.replace('Arrow', '');
  } else if (event.key) {
    direction = event.code.replace('Arrow', '');
  } else {
    direction = whichToDirection[event.which] || '';
  }

  if (direction.length > 0) {
    direction = direction.toUpperCase();
    if (coordinateDirectionOrder.indexOf(direction) >= 0) {
      return direction;
    }
  }
}

/**
 * Process canvas keydown event. If arrow key is pressed,
 * it will later be transformed into next camera position
 * accoding to `cameraMovementCoordinates`.
 *
 * @param {Event} event
 */

function processCanvasArrowKeydown(event) {
  let direction = convertKeyboardIntoDirection(event);
  if (!direction) {
    return;
  }

  let directionIdx = coordinateDirectionOrder.indexOf(direction);
  let newAllowedCoords = cameraMovementCoordinates[cameraPosIndex];
  let newCameraPosIdx = newAllowedCoords[directionIdx];
  if (newCameraPosIdx < 0) {
    return;
  }

  cameraPosIndex = newCameraPosIdx;

  let cameraPosCoords = cameraCoordinates[cameraPosIndex];
  let cameraSpherePos = cartesianToSphere(
    cameraPosCoords[0],
    -cameraPosCoords[2],
    cameraPosCoords[1]
  );
  let new_phi = cameraSpherePos[1];
  let new_theta = cameraSpherePos[2];

  phi = new_phi;
  theta = new_theta;
  updateCameraView();
}

/** Capture scroll movement and translate it into sphere radius coordinate
 * or distance from origin to camera. The radius is capped between near & far
 * values.
 */

function zoomCameraFromScrollDetector() {
  let deltaScroll = scrollDetector.scrollTop - scrollInitial;
  scrollDetector.scrollTop = scrollInitial;
  let newRadius = Math.pow(Math.E, Math.log(cameraRadius) + deltaScroll / 10);
  if (newRadius < camera.near) {
    return
  }
  if (newRadius > camera.far) {
    return;
  }
  cameraRadius = newRadius;

  updateCameraView();
}

// Implement trackball using sphere coordinate.
// Source: https://computergraphics.stackexchange.com/questions/151/how-to-implement-a-trackball-in-opengl

let isClickingForTrackball = false;

let posXInit = 0;
let posYInit = 0;
let initPhi;
let initTheta;
let isCameraPositionTrackballed = false;

function startTrackball(event) {
  if (isClickingForTrackball) {
    return
  }

  posXInit = event.screenX;
  posYInit = event.screenY;

  if (event.touches) {
    posXInit = event.touches[0].screenX;
    posYInit = event.touches[0].screenY;
  }

  initPhi = phi;
  initTheta = theta;

  isClickingForTrackball = true;
}

function trackMouseForTrackball(event) {
  if (!isClickingForTrackball) {
    return
  }

  let deltaX = event.screenX;
  let deltaY = event.screenY;

  if (event.touches) {
    deltaX = event.touches[0].screenX;
    deltaY = event.touches[0].screenY;
  }

  deltaX -= posXInit;
  deltaY -= posYInit;

  if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) {
    return
  }

  deltaX = deltaX / window.innerWidth * 2;
  deltaY = -deltaY / window.innerHeight * 2;

  phi = initPhi + -deltaX * 3
  let newTheta = initTheta + deltaY * 3;

  // Avoid making theta == 0 and changes direction (going negative from positive and vice versa).

  let signChangesSinceInitial = Math.sign(newTheta) !== Math.sign(initTheta);

  let touchingNorthPole = Math.abs(newTheta) < 0.01;
  let touchingSouthPole = Math.abs(newTheta) > Math.PI - 0.01;

  let goingBeyondNorthPole = Math.sign(deltaY) < 0 && signChangesSinceInitial;
  let goingBeyondSouthPole = Math.sign(deltaY) > 0 && signChangesSinceInitial;

  if (touchingNorthPole || goingBeyondNorthPole) {
    newTheta = (Math.sign(initTheta) || 1) * 0.01;
    initTheta = newTheta;
    if (event.touches) {
      posYInit = event.touches[0].screenY;
    } else {
      posYInit = event.screenY;
    }
  } else if (touchingSouthPole || goingBeyondSouthPole) {
    newTheta = (Math.sign(initTheta) || 1) * (Math.PI - 0.01);
    initTheta = newTheta;
    if (event.touches) {
      posYInit = event.touches[0].screenY;
    } else {
      posYInit = event.screenY;
    }
  }

  theta = newTheta;

  if (!isCameraPositionTrackballed) {
    isCameraPositionTrackballed = true
  }

  updateCameraView();

  // Clear selection
  // Taken from: https://stackoverflow.com/a/3169849/10159381

  if (window.getSelection) {
    if (window.getSelection().empty) {
      window.getSelection().empty();
    } else if (window.getSelection().removeAllRanges) {
      window.getSelection().removeAllRanges();
    }
  } else if (document.selection) {
    document.selection.empty();
  }
}

function stopTrackball() {
  if (!isClickingForTrackball) {
    return
  }
  isClickingForTrackball = false;
}

function startTrackballOnDevice(event) {
  event.preventDefault()
  startTrackball(event)
}

function trackMouseForTrackballOnDevice(event) {
  trackMouseForTrackball(event)
}

function stopTrackballOnDevice(event) {
  stopTrackball(event)
}

function getPressedAlphabet(event) {
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

let cancelFocusAnimation = function () { }

function processCanvasFocusKeydown(event) {
  let key = getPressedAlphabet(event)
  if (key === 'F') {
    let selectedObject = app.selectedObject
    
    if (selectedObject) {
      let objectMatrix = mat4(selectedObject.worldMatrix)
      let objectWorldPosition = objectMatrix[3].slice(0, 3)

      let oldPosition = at
      let newPosition = vec3(objectWorldPosition)

      let oldRadius = cameraRadius;
      let newRadius = 4;

      cancelFocusAnimation()
      let progress = 0;

      // TODO: Rename to animationCancelled and cancelFocusAnimation to cancelCurrentlyRunningAnimation
      let cancelAnimation = false

      cancelFocusAnimation = function () {
        cancelAnimation = true
      }

      let animateFocus = function () {
        if (progress > MAX_FOCUS_PROGRESS_FRAME_DURATION || cancelAnimation) {
          return
        }

        let x = progress / MAX_FOCUS_PROGRESS_FRAME_DURATION;
        let y = 1 - Math.pow(x - 1, 2)

        at = mix(oldPosition, newPosition, y)
        cameraRadius = oldRadius * (1 - y) + newRadius * y
        
        updateCameraView()

        progress += 1
        window.requestAnimationFrame(animateFocus)
      }

      window.requestAnimationFrame(animateFocus)

    }
  }
}