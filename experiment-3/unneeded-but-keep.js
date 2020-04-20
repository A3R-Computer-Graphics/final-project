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
