"use strict"

let PrimitivesDefinition = {}

PrimitivesDefinition.getCube = function (size = 1) {
  size /= 2
  return {
    vertices: [
      [size, -size, size],
      [size, -size, -size],
      [-size, -size, size],
      [-size, -size, -size],
      [size, size, size],
      [size, size, -size],
      [-size, size, size],
      [-size, size, -size]
    ],

    indices: [
      [0, 4, 6, 2],
      [3, 2, 6, 7],
      [7, 6, 4, 5],
      [5, 1, 3, 7],
      [1, 0, 2, 3],
      [5, 4, 0, 1]
    ],

    uvCoordinates: [
      [1, 1], [0, 1], [0, 0], [1, 0],
      [1, 1], [0, 1], [0, 0], [1, 0],
      [1, 1], [0, 1], [0, 0], [1, 0],
      [1, 1], [0, 1], [0, 0], [1, 0],
      [1, 1], [0, 1], [0, 0], [1, 0],
      [1, 1], [0, 1], [0, 0], [1, 0],
    ]
  }
}