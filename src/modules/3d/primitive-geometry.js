"use strict"

class PrimitiveCube extends Geometry {
  constructor() {
    super({}, false)
    let definition = PrimitivesDefinition.getCube()
    this.vertices = definition.vertices
    this.indices = definition.indices
    this.uvCoordinates = definition.uvCoordinates
    this.moveToBufferData()
  }
}