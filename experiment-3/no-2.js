"use strict";

let sceneGraph
let animationManager

// Camera variables

let camera = {
  near: 0.05,
  far: 20.0,
  radius: 8,
  fovy: 55.0,
  aspect: 1.0,
  viewMatrix: m4.identity(),
  projectionMatrix: m4.identity()
}

let theta = 0
let phi = 0
let cameraPosIndex = 17
let coordinateDirectionOrder = ['UP', 'LEFT', 'DOWN', 'RIGHT']

let eye
let at = vec3(0.0, 0.0, 0.0)
let up = vec3(0.0, 1.0, 0.0)

// rendering engine variables variables

let canvas
let gl
let program
let resolution = 100

// Interaction variables

let isMenuShown = true
let sliderList = []

/**
 * Function to update animation slider that has been throttled
 * so that it's not executed too often.
 */
let throttledSliderHandler = function () { }

function initCanvasAndGL() {
  canvas = document.getElementById('gl-canvas');

  gl = WebGLUtils.setupWebGL(canvas);
  if (!gl) {
    alert("WebGL isn't available");
  }

  gl.viewport(0, 0, canvas.width, canvas.height);
  gl.clearColor(0.2, 0.2, 0.2, 1.0);

  gl.enable(gl.DEPTH_TEST);
  program = initShaders(gl, 'vertex-shader', 'fragment-shader');
  gl.useProgram(program);
}

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

function toggleAnimation() {
  const animateBtn = document.getElementById('btn-animate');
  if (animationManager.isAnimating) {
    animationManager.stopAnimation()
    animateBtn.innerHTML = 'Mulai Animasi';
    animateBtn.classList.remove('btn-danger');
    animateBtn.classList.add('btn-primary');
    document.querySelectorAll('.range-animation')
      .forEach(elem => {
        elem.disabled = false;
      })
  }
  else {
    animationManager.startAnimation();
    animateBtn.innerHTML = 'Hentikan Animasi';
    animateBtn.classList.remove('btn-primary');
    animateBtn.classList.add('btn-danger');
    document.querySelectorAll('.range-animation')
      .forEach(elem => {
        elem.disabled = true;
      })
  }
}

function connectSlidersToModelData() {
  document.querySelectorAll('input[type="range"]').forEach(elem => {
    const sliderName = elem.getAttribute('name')
    const propertyData = parsePropertyString(sliderName);
    if (propertyData === undefined) {
      return
    }

    const { modelName, propertyName, axisId } = propertyData;
    elem.addEventListener('input', function (event) {
      sceneGraph.nodes[modelName].model[propertyName][axisId] = parseFloat(event.target.value);
      sceneGraph.nodes[modelName].updateTransformations()
      let textVal = event.target.parentElement.querySelector('.slider-value')
      textVal.innerHTML = parseFloat(event.target.value);
    })
  })
}

function connectSpeedSlider() {
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
}

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

  let lookAtMatrix = flatten(lookAt(eye, at, up));

  // Blender and the camera's UP vector points has different axis.
  // Blender points Z+ axis to up while this lookAt setup points Y+ axis instead.
  // One quick fix for this is to rotate this camera 90 deg back along X axis.
  // This rotates Z+ from pointing front to pointing up, and Y+ from pointing
  // up to pointing back.

  let viewMatrix = m4.xRotate(lookAtMatrix, degToRad(-90));
  gl.uniformMatrix4fv(sceneGraph.glLocations.viewMatrix, false, flatten(viewMatrix));
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

let isSpaceKeyPressed = false

function handleSpaceKeydown(event) {
  if (isSpaceKeyPressed) {
    return
  }
  if (event.code === 'Space' || event.key === ' ' || event.keyCode === 32) {
    toggleAnimation()
    isSpaceKeyPressed = true
  }
}

function handleSpaceKeyup(event) {
  if (!isSpaceKeyPressed) {
    return
  }
  if (event.code === 'Space' || event.key === ' ' || event.keyCode === 32) {
    isSpaceKeyPressed = false
  }
}

let MAX_HEIGHT = 1080
let MAX_WIDTH = 1440

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

function adjustResolution(event) {
  resolution = Math.min(100, Math.max(1, event.target.value))
  event.target.parentElement.querySelector('.slider-value').innerText = resolution + '%'
  adjustViewport()
}

function toggleMenu() {
  let wrapperDOM = document.getElementById('menu-toggler-wrapper');
  let menuTogglerButtonText = document.querySelector('#menu-toggler-button > .button-text');
  if (!isMenuShown) {
    wrapperDOM.className = 'show-menu';
    menuTogglerButtonText.innerText = 'Tutup';
  } else {
    wrapperDOM.className = 'hide-menu';
    menuTogglerButtonText.innerText = 'Buka Menu';
  }
  isMenuShown = !isMenuShown;
}

/**
 * List all sliders in the document and for each slider,
 * see if the slider is in the animation dictionary and is actually
 * defined in the sceneGraph nodes.
 */

function listCustomSliders() {
  let listName = []

  document.querySelectorAll('input[type="range"]')
    .forEach(elem => {
      const sliderName = elem.getAttribute('name')
      const data = parsePropertyString(sliderName)

      if (!data) {
        return
      }

      const { modelName, propertyName, axisId } = data
      if (!sceneGraph.nodes.hasOwnProperty(modelName)) {
        return
      }

      listName.push({
        sliderName,
        modelName,
        propertyName,
        axisId
      });
    })

  return listName;
}

function attachListenerOnAnimationUpdate() {
  // Throttle update animation slider so that it gets called
  // at most 25 fps.
  sliderList = listCustomSliders()
  throttledSliderHandler = throttle(matchSlidersToAnimation, 50)
  animationManager.addListener('animationupdate', throttledSliderHandler)
}

function matchSlidersToAnimation() {
  sliderList.forEach(({ sliderName, modelName, propertyName, axisId }) => {
    let animationValue = sceneGraph.nodes[modelName].model[propertyName][axisId]
    let sliderElement = document.querySelector(`input[name="${sliderName}"]`)
    let displayElement = sliderElement.parentElement.querySelector('.slider-value')
    sliderElement.value = animationValue
    displayElement.innerHTML = Math.round(animationValue * 100) / 100
  })
}

function deselect(modelName) {
  let selectedElement = document.querySelector(`li[data-model-name="${modelName}"]`)
  if (selectedElement) {
    selectedElement.classList.remove('selected')
  }
}

function replaceSelection(newSelection) {
  let currentSelection = sceneGraph.selectedNodeName
  if (newSelection === currentSelection) {
    deselect(currentSelection)
    sceneGraph.selectedNodeName = ''
  } else {
    let newSelectedElement = document.querySelector(`li[data-model-name="${newSelection}"]`)
    if (newSelectedElement) {
      deselect(currentSelection)
      newSelectedElement.classList.add('selected')
      sceneGraph.selectedNodeName = newSelection
    }
  }
  displaySelectionHierarchyText()
}

function displaySelectionHierarchyText() {

  let hierarchyElem = document.querySelector('#selobj-hierarchy')
  let child = hierarchyElem.lastElementChild

  while (child) {
    hierarchyElem.removeChild(child)
    child = hierarchyElem.lastElementChild
  }

  let selectionModelName = sceneGraph.selectedNodeName
  let selectionNode = sceneGraph.nodes[selectionModelName]

  if (!selectionNode) {
    return
  }

  let parentNameList = selectionNode.parentNameList
  let hierarchyList = [...parentNameList, selectionModelName]

  hierarchyList.forEach(modelName => {
    let childElem = document.createElement('span')
    childElem.innerHTML = modelName
    hierarchyElem.appendChild(childElem)
  })
}

function displayTree() {
  function createHTMLNode(node) {
    let nodeElement = document.createElement('li')
    let modelName = node.model.name
    nodeElement.dataset['modelName'] = modelName

    let collapsedCheckElement = document.createElement('input')
    collapsedCheckElement.type = 'checkbox'
    collapsedCheckElement.checked = false
    nodeElement.appendChild(collapsedCheckElement)

    let displayElement = document.createElement('div')
    displayElement.classList.add('obj-name')
    displayElement.innerText = node.key
    nodeElement.appendChild(displayElement);

    [collapsedCheckElement, displayElement].forEach(element => {
      element.addEventListener('contextmenu', event => {
        event.preventDefault()
        replaceSelection(modelName)
      })
    })

    if (node.children && node.children.length > 0) {
      let childListElement = document.createElement('ul')
      childListElement.classList.add('collapsed')
      nodeElement.appendChild(childListElement)

      let collapseSignElement = document.createElement('div')
      collapseSignElement.classList.add('collapsed-sign')
      childListElement.appendChild(collapseSignElement)

      node.children.forEach(children => {
        let childrenNode = createHTMLNode(children)
        childListElement.appendChild(childrenNode)
      })

    }
    return nodeElement
  }

  let rootListHTMLNode = document.querySelector('#tree > ul')
  sceneGraph.rootNodes.forEach(node => {
    let HTMLNode = createHTMLNode(node)
    rootListHTMLNode.appendChild(HTMLNode)
  })
}

window.addEventListener('load', function init() {
  // Initialize canvas and GL first

  initCanvasAndGL()

  // Initialize scene graph and model data from:
  // - coordinates of vertices specified in objects-vertices.js
  // - object position, rotation, and scale info in objects-data.js
  // - materials from objects-materials.js

  sceneGraph = new SceneGraph({ gl })
  sceneGraph.initWebGLVariables()

  sceneGraph.initMaterialsFromConfig(materials_definition)
  sceneGraph.initModelsFromConfig({
    modelsVerticesData: objects_vertices, // this is a variable inside objects-vertices.js
    modelsInfoData: objects_info // this is a variable inside objects-data.js
  })
  sceneGraph.movePointsToBufferData()
  sceneGraph.updateModelsTransformations()

  sceneGraph.updateLightPosition()
  sceneGraph.updateLightSetup({
    position: vec4(0, -10, 10, 0.0)
  })

  animationManager = new AnimationManager({ sceneGraph, speed: 0.5, maxFrameNumber: 120 })
  animationManager.initFromConfig(animations_definition)

  initializeCameraPosition()
  initializeProjectionMatrix()
  updateViewMatrix()

  // Attach event listener handles

  canvas.addEventListener('keydown', processCanvasArrowKeydown)
  canvas.addEventListener('keydown', handleSpaceKeydown)
  canvas.addEventListener('keyup', handleSpaceKeyup)

  window.addEventListener('resize', adjustViewport)

  document.querySelector('#menu-toggler-button').addEventListener('click', toggleMenu)
  document.querySelector('input[name="resolution"]').addEventListener('input', adjustResolution)
  document.querySelector('#btn-animate').addEventListener('click', toggleAnimation)

  connectSlidersToModelData()
  connectSpeedSlider()
  attachListenerOnAnimationUpdate()

  // Set focus to canvas from the start
  canvas.focus()

  displayTree()
  adjustViewport()
  render()
})

function render() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  Renderer.render(sceneGraph)
  window.requestAnimationFrame(render)
}