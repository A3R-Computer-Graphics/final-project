"use strict"

class PrimitiveCube extends Geometry {
  constructor(isWireframeMode) {
    super({}, false, isWireframeMode)
    let definition = PrimitivesDefinition.getCube()
    this.vertices = definition.vertices
    this.indices = definition.indices
    this.uvCoordinates = definition.uvCoordinates
    this.moveToBufferData()
  }
}

class PrimitiveLine extends Geometry {

  static POSITIVE_X = 0
  static NEGATIVE_X = 1
  static POSITIVE_Y = 2
  static NEGATIVE_Y = 3
  static POSITIVE_Z = 4
  static NEGATIVE_Z = 5

  constructor(length, direction, isWireframeMode) {
    super({}, false, isWireframeMode)

    length = typeof length === 'number' ? Math.abs(length) || 1 : 1
    direction = direction || PrimitiveLine.POSITIVE_X
    if (typeof direction !== 'number' || direction < 0 || direction > 5) {
      throw "Direction not understood."
    }

    let axisIndex = Math.floor(direction / 2)
    let negative = direction % 2 === 1

    let lastCoord = [0.0, 0.0, 0.0]
    lastCoord[axisIndex] = length * (negative ? -1 : 1)

    let definition = {
      vertices: [
        [0.0, 0.0, 0.0],
        lastCoord,
        lastCoord
      ],
      indices: [[0, 1, 2]]
    }

    this.vertices = definition.vertices
    this.indices = definition.indices
    this.moveToBufferData()
  }
}

class Icosphere extends Geometry {

  constructor(isWireframeMode) {
    super({}, false, isWireframeMode)

    const MESH_DATA = {
      "vertices": [
        [0.0, 0.0, -1.0],
        [0.724, -0.526, -0.447],
        [-0.276, -0.851, -0.447],
        [-0.894, 0.0, -0.447],
        [-0.276, 0.851, -0.447],
        [0.724, 0.526, -0.447],
        [0.276, -0.851, 0.447],
        [-0.724, -0.526, 0.447],
        [-0.724, 0.526, 0.447],
        [0.276, 0.851, 0.447],
        [0.894, 0.0, 0.447],
        [0.0, 0.0, 1.0]
      ],
      "indices": [
        [0, 1, 2],
        [1, 0, 5],
        [0, 2, 3],
        [0, 3, 4],
        [0, 4, 5],
        [1, 5, 10],
        [2, 1, 6],
        [3, 2, 7],
        [4, 3, 8],
        [5, 4, 9],
        [1, 10, 6],
        [2, 6, 7],
        [3, 7, 8],
        [4, 8, 9],
        [5, 9, 10],
        [6, 10, 11],
        [7, 6, 11],
        [8, 7, 11],
        [9, 8, 11],
        [10, 9, 11]
      ],
      "uv_coordinates": [
        [0.818, 0.0],
        [0.727, 0.157],
        [0.909, 0.157],
        [0.727, 0.157],
        [0.636, 0.0],
        [0.545, 0.157],
        [0.091, 0.0],
        [0.0, 0.157],
        [0.182, 0.157],
        [0.273, 0.0],
        [0.182, 0.157],
        [0.364, 0.157],
        [0.455, 0.0],
        [0.364, 0.157],
        [0.545, 0.157],
        [0.727, 0.157],
        [0.545, 0.157],
        [0.636, 0.315],
        [0.909, 0.157],
        [0.727, 0.157],
        [0.818, 0.315],
        [0.182, 0.157],
        [0.0, 0.157],
        [0.091, 0.315],
        [0.364, 0.157],
        [0.182, 0.157],
        [0.273, 0.315],
        [0.545, 0.157],
        [0.364, 0.157],
        [0.455, 0.315],
        [0.727, 0.157],
        [0.636, 0.315],
        [0.818, 0.315],
        [0.909, 0.157],
        [0.818, 0.315],
        [1.0, 0.315],
        [0.182, 0.157],
        [0.091, 0.315],
        [0.273, 0.315],
        [0.364, 0.157],
        [0.273, 0.315],
        [0.455, 0.315],
        [0.545, 0.157],
        [0.455, 0.315],
        [0.636, 0.315],
        [0.818, 0.315],
        [0.636, 0.315],
        [0.727, 0.472],
        [1.0, 0.315],
        [0.818, 0.315],
        [0.909, 0.472],
        [0.273, 0.315],
        [0.091, 0.315],
        [0.182, 0.472],
        [0.455, 0.315],
        [0.273, 0.315],
        [0.364, 0.472],
        [0.636, 0.315],
        [0.455, 0.315],
        [0.545, 0.472]
      ]
    }

    this.vertices = MESH_DATA.vertices
    this.indices = MESH_DATA.indices
    this.uvCoordinates = MESH_DATA.uv_coordinates
    this.moveToBufferData()
  }
}