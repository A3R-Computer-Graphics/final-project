"use strict"

class Scene extends Object3D {
  constructor() {
    super()
  }

  setParent() { }
  unsetParent() { }
  setGeometry() { }
}

class Empty extends Object3D {
  constructor() {
    super.call(arguments)
  }

  setGeometry() { }
}