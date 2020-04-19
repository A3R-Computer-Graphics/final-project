"use strict";

/* Cara kerja:

Cara rendering dengan tree yang ada di Angel sudah baik, namun
ada hal yang bisa ditingkatkan: memisahkan logic untuk rendering
dengan logic untuk menghitung model view matrix.

Saat ini, model view matrix dihitung setiap kali rendering. Jika
jumlah 3d model tidak banyak, ini tidak masalah. Namun, jika jumlah 3d model
semakin bertambah banyak komputasinya menjadi tidak baik. Oleh karena
itu, kita bisa mengalokasikan sedikit memori untuk menyimpan matriks
model view untuk **setiap** 3d model.

*/

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

let isRenderedContinuously = true;
let isAnimated = false;

// Variables related to objects and materials

/**
 * List of materials. Every material object has Phong parameters
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

function updateMaterialsLighting() {
  Object.keys(materialDict).forEach((materialName) => {
    let material = materialDict[materialName];
    material.ambientProduct = flatten(mult(lightAmbient, material.ambient));
    material.diffuseProduct = flatten(mult(lightDiffuse, material.diffuse));
    material.specularProduct = flatten(mult(lightSpecular, material.specular));
  });
}

function updateLight(data) {
  if (data.ambient) {
    lightAmbient = data.ambient;
  }
  if (data.diffuse) {
    lightDiffuse = data.diffuse;
  }
  if (data.specular) {
    lightSpecular = data.specular;
  }
  if (data.position) {
    lightPosition = [data.position[0], data.position[1], data.position[2], 0.0];
  }
  updateLightingPosition();
  updateMaterialsLighting();
  if (!isRenderedContinuously) {
    render();
  }
}

var rootNodes = [];

function initObjects() {

  // Estimate points count by counting how many triangles needed to
  // make a face, for each face in model, for all models.
  // Formula: (vertex count - 2) * 3
  // example a square (having 4 vertex) will need 2 triangles

  let triangleCount = Object.keys(objects_vertices).map(key =>
      objects_vertices[key].indices
      .reduce((p, c) => p + c.length - 2, 0))
    .reduce((p, c) => p + c)

  // create matrix with size of points count
  pointsArray = new Array(triangleCount * 3);
  normalsArray = new Array(triangleCount * 3);

  // Iterate over the objects_vertices and objects_data
  // to initiate node data.
  Object.keys(objects_vertices).forEach(objectName => {
    var numVertsBefore = numVertices;
    var objVertsData = objects_vertices[objectName];

    /* 
    // Appending new data to points and normals array, without allocating space.
    // Inspecting performance shows scripting takes ~600ms for 20000 vertex.

    var vertices = objVertsData.vertices;
    objVertsData.indices.forEach(polygonIndices => {
      let faceData = getScaledVertexPointsAndNormals(vertices, polygonIndices)
      pointsArray = [...pointsArray, ...faceData.points];
      normalsArray = [...normalsArray, ...faceData.normals];
    });
    numVertices = pointsArray.length;
    */

    /* 
    // Appending new data to points & normals array, but this time,
    // allocating single model vertex count.
    // Scripting takes ~200ms.
    
    var facesData = getScaledModelPointsAndNormals(
      objVertsData.vertices, objVertsData.indices
    )
    pointsArray = [...pointsArray, ...facesData.points];
    normalsArray = [...normalsArray, ...facesData.normals];
    numVertices = pointsArray.length;
    */

    // Estimating vertex count for all models and assigning
    // points and normals without appending/destructuring.
    // Scripting takes ~160ms.

    var newData = populatePointsAndNormalsArray({
      vertices: objVertsData.vertices,
      polygonIndices: objVertsData.indices
    }, numVertices, pointsArray, normalsArray)
    numVertices = newData.newStartIndex;

    var vertexCount = numVertices - numVertsBefore;

    var objImportedData = objects_info[objectName];
    // Init 3d model info and its nodes.
    var model = new Model({
      name: objectName,
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

function initGraphicsLibraryVariables() {
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

function updateLightingPosition() {
  gl.uniform4fv(lightPositionLoc, flatten(lightPosition));
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
    animateBtn.innerHTML = "Start Animation";
    animateBtn.classList.remove('btn-danger');
    animateBtn.classList.add('btn-primary');
    document.querySelectorAll('.range-animation')
    .forEach(elem => {
      elem.disabled = false;
    })
  }
  else {
    startAnimation();
    animateBtn.innerHTML = "Stop Animation";
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
  initGraphicsLibraryVariables();

  initMaterials();
  initObjects();
  initAnimateBtn()
  initAnimationDict();

  initBufferFromPoints();
  updateLightingPosition();

  initializeCameraPosition();
  initializeProjectionMatrix();
  updateViewMatrix();

  canvas.addEventListener("keydown", onCanvasKeydown);
  canvas.focus();
  render();
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

  // Make recursive call if and only if the app is set to render continuously
  if (isRenderedContinuously) {
      window.requestAnimationFrame(render);
  }
}



/**
 * Convert keyboard into direction, with respect to three
 * mechanism currently implemented in browser: `event.code`,
 * `event.key`, and `event.which`.
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
 * @param {*} event
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
  if (!isRenderedContinuously) {
    render();
  }
}