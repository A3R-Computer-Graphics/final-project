
class Scene extends Object3D {
  constructor() {
    super()
    this.ambientColor = [0.05, 0.007, 0.01, 1.0]
    this.ambientColor = this.ambientColor.map(el => el * 4)
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