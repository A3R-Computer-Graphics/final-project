"use strict"

class PrimitiveCube extends Geometry {
  constructor(isWireframeMode) {
    super({isWireframeMode}, false)
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
    super({isWireframeMode}, false)

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