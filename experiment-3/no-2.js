"use strict";

let sceneGraph
let animationManager

let camera = {
  near: 0.05,
  far: 20.0,
  radius: 8,
  fovy: 55.0,
  aspect: 1.0,
  viewMatrix: m4.identity(),
  projectionMatrix: m4.identity()
}

let eye;
const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);

let canvas;
let gl;
let program;

// Sphere coordinate that will be used to determine camera position.

let theta = 0
let phi = 0

let resolution = 100;

function initCanvasAndGL() {
  canvas = document.getElementById("gl-canvas");

  gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) {
    alert("WebGL isn't available");
  }

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.2, 0.2, 0.2, 1.0);

  gl.enable(gl.DEPTH_TEST);
  program = initShaders(gl, "vertex-shader", "fragment-shader");
  gl.useProgram(program);
}

var cameraPosIndex = 17;
let coordinateDirectionOrder = ["UP", "LEFT", "DOWN", "RIGHT"];

/**
 * Initialize camera position from chosen camera position index
 */

function initializeCameraPosition() {
  let cameraPosCoords = cameraCoordinates[cameraPosIndex];
  let cameraSpherePos = cartesianToSphere(
    cameraPosCoords[0],
    cameraPosCoords[1],
    cameraPosCoords[2]
  );
  phi = cameraSpherePos[1];
  theta = cameraSpherePos[2];
}

function initializeProjectionMatrix() {
  let projectionMatrix = perspective(camera.fovy, camera.aspect, camera.near, camera.far)
  let matrixGlLocation = sceneGraph.glLocations.projectionMatrix
  gl.uniformMatrix4fv(matrixGlLocation, false, flatten(projectionMatrix))
}

// Animation
function initAnimateBtn() {
  var animateBtn = document.getElementById("btn-animate");
  animateBtn.addEventListener("click", animateFunc);
}

function animateFunc() {
  const animateBtn = document.getElementById("btn-animate");
  if (animationManager.isAnimating) {
    animationManager.stopAnimation()
    animateBtn.innerHTML = "Mulai Animasi";
    animateBtn.classList.remove('btn-danger');
    animateBtn.classList.add('btn-primary');
    document.querySelectorAll('.range-animation')
      .forEach(elem => {
        elem.disabled = false;
      })
  }
  else {
    animationManager.startAnimation();
    animateBtn.innerHTML = "Hentikan Animasi";
    animateBtn.classList.remove('btn-primary');
    animateBtn.classList.add('btn-danger');
    document.querySelectorAll('.range-animation')
      .forEach(elem => {
        elem.disabled = true;
      })
  }
}

window.addEventListener("load", function init() {
  initCanvasAndGL()

  sceneGraph = new SceneGraph({gl})
  sceneGraph.initWebGLVariables()
  
  sceneGraph.updateLightPosition()
  sceneGraph.updateLightSetup({
    position: vec4(0, -10, 10, 0.0)
  })

  sceneGraph.initMaterialsFromConfig(materials_definition)
  sceneGraph.initModelsFromConfig({
    modelsVerticesData: objects_vertices,
    modelsInfoData: objects_info
  })
  sceneGraph.initBufferFromPoints()
  sceneGraph.updateRootNodesTransformations()

  animationManager = new AnimationManager({ sceneGraph })
  animationManager.speed = 0.5
  animationManager.maxFrameNumber = 120
  animationManager.initFromConfig(animations_definition)

  initAnimateBtn()
  initAnimationValues()

  initializeCameraPosition();
  initializeProjectionMatrix();
  updateViewMatrix();

  canvas.addEventListener("keydown", onCanvasKeydown);
  window.addEventListener('resize', adjustViewport);
  document.querySelector('#menu-toggler-button').addEventListener('click', toggleMenu)
  document.querySelector('input[name="resolution"]').addEventListener('input', adjustResolution)
  canvas.focus();

  this.document.querySelectorAll('input[type="range"]').forEach(elem => {
    const sliderName = elem.getAttribute('name')
    const propertyData = parsePropertyString(sliderName);
    if (propertyData === undefined) {
      return
    }

    const { modelName, propertyName, axisId } = propertyData;
    elem.addEventListener('input', function (event) {
      ObjectNode.cache[modelName].model[propertyName][axisId] = parseFloat(event.target.value);
      ObjectNode.cache[modelName].updateTransformations()
      let textVal = event.target.parentElement.querySelector('.slider-value')
      textVal.innerHTML = parseFloat(event.target.value);
    })
  })

  let SPEED_MIN = 0.05;
  let SPEED_MAX = 4;
  let speedSlider = document.querySelector('input[name="speed"]');
  let speedValueDisplay = speedSlider.parentElement.querySelector('.slider-value');

  speedSlider.addEventListener('input', event => {
    let value = parseFloat(event.target.value);
    value = interpolateExponentially(SPEED_MIN, SPEED_MAX, value);
    speedValueDisplay.innerText = Math.round(value * 100) + '%';
    animationManager.speed = value;
  })

  // Init slider position from inverse of exponential (logarithm)
  let sliderInitValue = interpolateLogarithmatically(SPEED_MIN, SPEED_MAX, animationManager.speed);
  speedSlider.value = sliderInitValue;
  speedValueDisplay.innerText = Math.round(animationManager.speed * 100) + '%';

  adjustViewport();
  render();
});

/**
 * Update eye coordinate calculation from global
 * variables `radius`, `theta`, and `phi`.
 */

function updateViewMatrix() {
  let r = camera.radius;
  let sin_t = Math.sin(theta);
  let sin_p = Math.sin(phi);
  let cos_t = Math.cos(theta);
  let cos_p = Math.cos(phi);

  let x = r * sin_t * cos_p;
  let y = r * sin_t * sin_p;
  let z = r * cos_t;

  eye = vec3(x, y, z);

  var lookAtMatrix = flatten(lookAt(eye, at, up));
  // Adjust the object axis from Blender to match this representation's axis.
  // This is based on personal observation.
  var viewMatrix = m4.xRotate(lookAtMatrix, degToRad(-90));
  gl.uniformMatrix4fv(sceneGraph.glLocations.viewMatrix, false, flatten(viewMatrix));
}

function render() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  sceneGraph.rootNodes.forEach(rootNode => rootNode.render(gl))
  window.requestAnimationFrame(render)
}

/**
 * Convert keyboard into directions: "LEFT", "RIGHT", "UP", and "DOWN".
 *
 * @param {Event} event
 */

function convertKeyboardIntoDirection(event) {
  let direction = "";
  let whichToDirection = {
    37: "LEFT",
    38: "UP",
    39: "RIGHT",
    40: "DOWN",
  };
  if (event.code) {
    // Remove 'Arrow' token in the string
    direction = event.code.replace("Arrow", "");
  } else if (event.key) {
    direction = event.code.replace("Arrow", "");
  } else {
    direction = whichToDirection[event.which] || "";
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

function onCanvasKeydown(event) {
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
let MAX_HEIGHT = 1080;
let MAX_WIDTH = 1440;

/**
 * Adjust viewport so the canvas stays clear even if window resolution changes.
 */

function adjustViewport() {
  let rect = canvas.parentElement.getBoundingClientRect()
  let width = rect.width * window.devicePixelRatio;
  let height = rect.height * window.devicePixelRatio;

  // Get w:h ratio of canvas size as displayed in the screen.
  let widthToHeightRatio = rect.width / rect.height;

  // Limit width and height resolution to MAX_HEIGHT and MAX_WIDTH,
  // while at the same time maintaining the w:h ratio.

  width = Math.min(MAX_WIDTH, width);
  height = Math.min(MAX_HEIGHT, width / widthToHeightRatio) * resolution / 100;
  width = Math.round(height * widthToHeightRatio);
  height = Math.round(height);

  canvas.width = width;
  canvas.height = height;

  camera.aspect = width / height;
  initializeProjectionMatrix()

  gl.viewport(0, 0, width, height);
}

var isMenuShown = true;
function toggleMenu() {
  let wrapperDOM = document.getElementById('menu-toggler-wrapper');
  let menuTogglerButtonText = document.querySelector('#menu-toggler-button > .button-text');
  if (!isMenuShown) {
    wrapperDOM.className = "show-menu";
    menuTogglerButtonText.innerText = 'Tutup';
  } else {
    wrapperDOM.className = "hide-menu";
    menuTogglerButtonText.innerText = 'Buka Menu';
  }
  isMenuShown = !isMenuShown;
}

function adjustResolution(event) {
  resolution = Math.min(100, Math.max(1, event.target.value));
  event.target.parentElement.querySelector('.slider-value').innerText = resolution + "%";
  adjustViewport();
}