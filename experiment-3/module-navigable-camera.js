function initNavigableCamera() {
  canvas.addEventListener('keydown', processCanvasArrowKeydown)
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
    cameraPosCoords[1],
    cameraPosCoords[2]
  );
  let new_phi = cameraSpherePos[1];
  let new_theta = cameraSpherePos[2];

  phi = new_phi;
  theta = new_theta;
  updateViewMatrix();
}