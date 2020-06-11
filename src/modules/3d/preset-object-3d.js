
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
    super(...arguments)
    this.geometry = new LineAxesGeometry()
  }

  setGeometry() { }
}