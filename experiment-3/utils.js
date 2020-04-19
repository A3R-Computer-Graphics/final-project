/**
 * Resize a canvas to match the size its displayed.
 * @param {HTMLCanvasElement} canvas The canvas to resize.
 * @param {number} [multiplier] amount to multiply by.
 *    Pass in window.devicePixelRatio for native pixels.
 * @return {boolean} true if the canvas was resized.
 */
function resizeCanvasToDisplaySize(canvas, onCanvasSizeChanged) {
  // Lookup the size the browser is displaying the canvas.
  var displayWidth = canvas.clientWidth;
  var displayHeight = canvas.clientHeight;

  // Check if the canvas is not the same size.
  if (canvas.width != displayWidth || canvas.height != displayHeight) {
    // Make the canvas the same size
    canvas.width = displayWidth;
    canvas.height = displayHeight;
    onCanvasSizeChanged();
  }
}

function radToDeg(r) {
  return r * 180 / Math.PI;
}

function degToRad(d) {
  return d * Math.PI / 180;
}

function cartesianToSphere(x, y, z) {
    var r = Math.sqrt(x * x + y * y + z * z)
    var phi = Math.atan2(y,x)
    var theta = Math.atan2(Math.sqrt(x * x + y * y), z)
    return [r, phi, theta]
}

function sphereToCartesian(r, phi, theta) {
    var sin_t = Math.sin(theta)
    var sin_p = Math.sin(phi)
    var cos_t = Math.cos(theta)
    var cos_p = Math.cos(phi)
    
    var x = r * sin_t * cos_p
    var y = r * sin_t * sin_p
    var z = r * cos_t
    return [x, y, z]
}

/**
 * Compute simple ease out using cubic function
 * as outlined in this graph:
 * https://www.desmos.com/calculator/7dcarjojfl
 * 
 * @param {Number} progress value from 0 to 1 
 */

function easeOut(x) {
    return -1 * Math.pow(1 - x, 3) + 1
}

/**
 * Compute simple ease in and out using cubic function
 * as outlined in this graph:
 * https://www.desmos.com/calculator/7dcarjojfl
 * 
 * @param {Number} progress value from 0 to 1 
 */

function easeInOut(x) {
  var a = x < 1/2 ? 1 : -1
  var b = (1 - a) / 2
  return b + a * Math.pow(2 * (b + a * x), 3) / 2
}

function getScaledVertexPointsAndNormals(vertices, polygonIndices, scaleFactor) {
  if (!scaleFactor) {
    scaleFactor = 1;
  }

  let initPoints = [];
  for (let i = 0; i < polygonIndices.length; i++) {
    let v = vertices[polygonIndices[i]]
    initPoints.push([
      v[0] * scaleFactor,
      v[1] * scaleFactor,
      v[2] * scaleFactor,
      1.0])
  }

  let a = initPoints[0]
  let b = initPoints[1]
  let c = initPoints[2]

  // Compute normal from the direction of first 3 points.

  var t1 = subtract(b, a);
  var t2 = subtract(c, b);
  var normal = cross(t1, t2);
  normal = vec4(normal);

  // Duplicate points using triangle fan style
  
  let normals = [];
  let points = [];
  for (let i = 1; i < initPoints.length - 1; i++) {
    b = initPoints[i];
    c = initPoints[i+1];

    points.push(a);
    points.push(b);
    points.push(c);
    normals.push(normal);
    normals.push(normal);
    normals.push(normal);
  }

  return {
    points,
    normals
  }
}

function getScaledModelPointsAndNormals(vertices, polygonIndices, scaleFactor) {
  if (!scaleFactor) {
    scaleFactor = 1;
  }

  // Estimate array size
  let totalPoints = 0
  polygonIndices.forEach(indices => {
    totalPoints += (indices.length - 2) * 3
  })

  // Init array with size totalPoints
  let points = new Array(totalPoints);
  let normals = new Array(totalPoints);
  let pointCnt = 0;

  polygonIndices.forEach(indices => {
    let initPoints = [];

    for (let i = 0; i < indices.length; i++) {
      let v = vertices[indices[i]]
      initPoints.push([
        v[0] * scaleFactor,
        v[1] * scaleFactor,
        v[2] * scaleFactor,
        1.0])
    }
  
    let a = initPoints[0]
    let b = initPoints[1]
    let c = initPoints[2]
  
    // Compute normal from the direction of first 3 points.
  
    var t1 = subtract(b, a);
    var t2 = subtract(c, b);
    var normal = cross(t1, t2);
    normal = vec4(normal);
  
    // Duplicate points using triangle fan style

    for (let i = 1; i < initPoints.length - 1; i++) {
      b = initPoints[i];
      c = initPoints[i+1];

      points[pointCnt] = a;
      normals[pointCnt++] = normal;
      points[pointCnt] = b;
      normals[pointCnt++] = normal;
      points[pointCnt] = c;
      normals[pointCnt++] = normal;
    }
  })

  return {
    points,
    normals
  }
}

function populatePointsAndNormalsArray(
    { vertices, polygonIndices},
    startIndex, points, normals) {

  polygonIndices.forEach(indices => {
    let initPoints = [];
    for (let i = 0; i < indices.length; i++) {
      let v = vertices[indices[i]]
      initPoints.push([
        v[0],
        v[1],
        v[2],
        1.0])
    }
  
    let a = initPoints[0]
    let b = initPoints[1]
    let c = initPoints[2]
  
    // Compute normal from the direction of first 3 points.
  
    var t1 = subtract(b, a);
    var t2 = subtract(c, b);
    var normal = cross(t1, t2);
    normal = vec4(normal);
  
    // Duplicate points using triangle fan style

    for (let i = 1; i < initPoints.length - 1; i++) {
      b = initPoints[i];
      c = initPoints[i+1];

      points[startIndex] = a;
      normals[startIndex++] = normal;
      points[startIndex] = b;
      normals[startIndex++] = normal;
      points[startIndex] = c;
      normals[startIndex++] = normal;
    }
  })

  return {
    points,
    normals,
    newStartIndex: startIndex
  }
}

function cloneUsingJSON(obj) {
  return JSON.parse(JSON.stringify(obj))
}