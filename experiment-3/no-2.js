"use strict";

// Camera setting

let near = 0.05;
let far = 20.0;
let radius = 8;

let fovy = 55.0; // Field-of-view in Y direction angle (in degrees)
let aspect = 1.0; // Viewport aspect ratio

let eye;
const at = vec3(0.0, 0.0, 0.0);
const up = vec3(0.0, 1.0, 0.0);

let canvas;
let gl;

let numVertices = 0;

let pointsArray = [];
let normalsArray = [];

let modelMatrix;
let viewMatrix;
let projectionMatrix;

// GLSL variables and pointers

let program;

let ambientLoc;
let specularLoc;
let diffuseLoc;
let shininessLoc;

let lightPositionLoc;
let viewMatrixLoc;
let modelMatrixLoc;
let projectionMatrixLoc;

let nBuffer;
let vBuffer;

// Sphere coordinate that will be used to determine camera position.

let theta = 0;
let phi = 0;

// Light data

let lightPosition = vec4(0, -10, 10, 0.0);

let lightAmbient = vec4(0.2, 0.2, 0.2, 1.0);
let lightDiffuse = vec4(1.0, 1.0, 1.0, 1.0);
let lightSpecular = vec4(1.0, 1.0, 1.0, 1.0);

// Rendering variables

let isAnimated = false;
let resolution = 100;

/**
 * List of materials in dictionary-style.
 * Every material object has Phong parameters
 * (ambient, specular, diffuse), name, and computed product
 * of light and intrinsic material params.
 */

var materialDict = {};

function initMaterials() {
  materials_definition.forEach((material) => {
    materialDict[material.name] = material;
  });
  updateMaterialsLighting();
}

/**
 * Recompute product values of material's own ambient, diffuse,
 * and specular, with the one from lighting.
 */

function updateMaterialsLighting() {
  Object.keys(materialDict).forEach((materialName) => {
    let material = materialDict[materialName];
    material.ambientProduct = flatten(mult(lightAmbient, material.ambient));
    material.diffuseProduct = flatten(mult(lightDiffuse, material.diffuse));
    material.specularProduct = flatten(mult(lightSpecular, material.specular));
  });
}

function updateLightSetup(data) {
  let isChangingParameters = false;
  if (data.ambient) {
    lightAmbient = data.ambient;
    isChangingParameters = true;
  }
  if (data.diffuse) {
    lightDiffuse = data.diffuse;
    isChangingParameters = true;
  }
  if (data.specular) {
    lightSpecular = data.specular;
    isChangingParameters = true;
  }
  if (data.position) {
    lightPosition = [data.position[0], data.position[1], data.position[2], 0.0];
    updateLightingPosition();
  }
  if (isChangingParameters) {
    updateMaterialsLighting();
  }
}

function updateLightingPosition() {
  gl.uniform4fv(lightPositionLoc, flatten(lightPosition));
}

/**
 * List of root nodes.
 */

var rootNodes = [];

function init3DModelsFromConfig() {

  // Compute how many triangles will be needed to draw a convex polygon.
  // For a face with n vertices, it will take n - 2 triangles.

  let triangleCount = Object.keys(objects_vertices)
    .map(key => objects_vertices[key].indices
      .reduce((p, c) => p + c.length - 2, 0))
    .reduce((p, c) => p + c)

  // Create matrix with the size of points count

  pointsArray = new Array(triangleCount * 3);
  normalsArray = new Array(triangleCount * 3);

  // Iterate over the objects_vertices and objects_data
  // to initiate node data.

  Object.keys(objects_vertices).forEach(modelName => {
    let numVertsBefore = numVertices;
    let objVertsData = objects_vertices[modelName];
    let objImportedData = objects_info[modelName];

    let newData = populatePointsAndNormalsArrayFromObject({
      vertices: objVertsData.vertices,
      polygonIndices: objVertsData.indices
    }, numVertices, pointsArray, normalsArray)

    numVertices = newData.newStartIndex;
    let vertexCount = numVertices - numVertsBefore;

    // Init 3d model info and its nodes.

    let model = new Model({
      name: modelName,
      origin: [0, 0, 0],
      location: objImportedData.location,
      rotation: objImportedData.rotation,
      scale: objImportedData.scale,
      parentName: objImportedData.parent,
      bufferStartIndex: numVertsBefore,
      vertexCount: vertexCount,
      material: materialDict[objImportedData.material_name] || materialDict["Default"],
    });

    if (!model.node.hasParent) rootNodes.push(model.node);
  });

  rootNodes.forEach((rootNode) => rootNode.updateTransformations());
}

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

function initWebGLVariables() {
  ambientLoc = gl.getUniformLocation(program, "ambientProduct");
  diffuseLoc = gl.getUniformLocation(program, "diffuseProduct");
  specularLoc = gl.getUniformLocation(program, "specularProduct");
  shininessLoc = gl.getUniformLocation(program, "shininess");
  lightPositionLoc = gl.getUniformLocation(program, "lightPosition");

  modelMatrixLoc = gl.getUniformLocation(program, "modelMatrix");
  viewMatrixLoc = gl.getUniformLocation(program, "viewMatrix");
  projectionMatrixLoc = gl.getUniformLocation(program, "projectionMatrix");

  gl.ambientLoc = ambientLoc;
  gl.diffuseLoc = diffuseLoc;
  gl.specularLoc = specularLoc;
  gl.shininessLoc = shininessLoc;
  gl.modelMatrixLoc = modelMatrixLoc;

  nBuffer = gl.createBuffer();
  vBuffer = gl.createBuffer();
}

function initBufferFromPoints() {
  gl.bindBuffer(gl.ARRAY_BUFFER, nBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(normalsArray), gl.STATIC_DRAW);

  let vNormal = gl.getAttribLocation(program, "vNormal");
  gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vNormal);

  gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, flatten(pointsArray), gl.STATIC_DRAW);

  let vPosition = gl.getAttribLocation(program, "vPosition");
  gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(vPosition);
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
  projectionMatrix = perspective(fovy, aspect, near, far);
  gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));
}

// Animation
function initAnimateBtn() {
  var animateBtn = document.getElementById("btn-animate");
  animateBtn.addEventListener("click", animateFunc);
}

function animateFunc() {
  const animateBtn = document.getElementById("btn-animate");
  if (isAnimated) {
    stopAnimation();
    animateBtn.innerHTML = "Mulai Animasi";
    animateBtn.classList.remove('btn-danger');
    animateBtn.classList.add('btn-primary');
    document.querySelectorAll('.range-animation')
      .forEach(elem => {
        elem.disabled = false;
      })
  }
  else {
    startAnimation();
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
  initCanvasAndGL();
  initWebGLVariables();

  initMaterials();
  init3DModelsFromConfig();
  initBufferFromPoints();

  initAnimateBtn()
  initAnimationValues();

  initializeCameraPosition();
  initializeProjectionMatrix();
  updateViewMatrix();
  updateLightingPosition();

  adjustViewport();
  render();

  canvas.addEventListener("keydown", onCanvasKeydown);
  window.addEventListener('resize', adjustViewport);
  document.querySelector('#menu-toggler-button').addEventListener('click', toggleMenu)
  document.querySelector('input[name="resolution"]').addEventListener('input', adjustResolution)
  canvas.focus();
});

/**
 * Update eye coordinate calculation from global
 * variables `radius`, `theta`, and `phi`.
 */

function updateViewMatrix() {
  let r = radius;
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
  viewMatrix = m4.xRotate(lookAtMatrix, degToRad(-90));
  gl.uniformMatrix4fv(viewMatrixLoc, false, flatten(viewMatrix));
}

function render() {
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  rootNodes.forEach(rootNode => rootNode.render(gl));
  window.requestAnimationFrame(render);
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

  aspect = width / height;
  projectionMatrix = perspective(fovy, aspect, near, far);
  gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));

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