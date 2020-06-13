
class Scene extends Object3D {
  constructor() {
    super()
    this.ambientColor = [0.25, 0.04, 0.3]
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