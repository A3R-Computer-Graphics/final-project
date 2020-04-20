function radToDeg(r) {
  return r * 180 / Math.PI;
}

function degToRad(d) {
  return d * Math.PI / 180;
}

function cartesianToSphere(x, y, z) {
  let r = Math.sqrt(x * x + y * y + z * z)
  let phi = Math.atan2(y, x)
  let theta = Math.atan2(Math.sqrt(x * x + y * y), z)
  return [r, phi, theta]
}

function sphereToCartesian(r, phi, theta) {
  let sin_t = Math.sin(theta)
  let sin_p = Math.sin(phi)
  let cos_t = Math.cos(theta)
  let cos_p = Math.cos(phi)

  let x = r * sin_t * cos_p
  let y = r * sin_t * sin_p
  let z = r * cos_t
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
  let a = x < 1 / 2 ? 1 : -1
  let b = (1 - a) / 2
  return b + a * Math.pow(2 * (b + a * x), 3) / 2
}

function populatePointsAndNormalsArrayFromObject(
  { vertices, polygonIndices },
  startIndex, points, normals) {

  polygonIndices.forEach(indices => {
    let initPoints = [];

    for (let i = 0; i < indices.length; i++) {
      let v = vertices[indices[i]]
      initPoints.push([v[0], v[1], v[2], 1.0])
    }

    let a = initPoints[0]
    let b = initPoints[1]
    let c = initPoints[2]

    // Compute normal from the direction of first 3 points.

    let t1 = subtract(b, a);
    let t2 = subtract(c, b);
    let normal = cross(t1, t2);
    normal = vec4(normal);

    // Duplicate points using triangle fan style

    for (let i = 1; i < initPoints.length - 1; i++) {
      b = initPoints[i];
      c = initPoints[i + 1];

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