"use strict"

class Property3D {
  constructor([x, y, z], parent, propertyName) {
    this.property = [x, y, z]
    this.parent = parent
    this.propertyName = propertyName
  }

  get() {
    return this.property
  }

  set(newValue) {
    if (!Array.isArray(newValue)) {
      if (arguments.length < 2) {
        newValue = [newValue, newValue, newValue]
      } else {
        newValue = [arguments[0], arguments[1], arguments[2]]
      }
    }
    this.property[0] = newValue[0]
    this.property[1] = newValue[1]
    this.property[2] = newValue[2]

    this.parent.localMatrixNeedsUpdate = true
  }

  setX(val) {
    this.setOnAxisId(0, val)
  }

  setY(val) {
    this.setOnAxisId(1, val)
  }

  setZ(val) {
    this.setOnAxisId(2, val)
  }

  setOnAxisId(axisId, val) {
    this.property[axisId] = val
    this.parent.localMatrixNeedsUpdate = true
  }
}

class Object3D {
  constructor(data) {
    let { name, origin, position, rotation, scale, geometry, wireframeGeometry, material, matrixParentInverse } = data || {}
    this.name = name || ''

    origin = origin || [0, 0, 0]
    position = position || [0, 0, 0]
    rotation = rotation || [0, 0, 0]
    scale = scale || [1, 1, 1]

    this.origin = new Property3D(origin, this, 'origin')
    this.position = new Property3D(position, this, 'position')
    this.rotation = new Property3D(rotation, this, 'rotation')
    this.scale = new Property3D(scale, this, 'scale')

    this.localMatrix = m4.identity()
    this.worldMatrix = m4.identity()

    this.geometry = geometry || null
    this.wireframeGeometry = wireframeGeometry || null
    this.material = material || null

    this.parent = null
    this.children = []

    this.localMatrixNeedsUpdate = true
    if (matrixParentInverse) {
      matrixParentInverse = flatten(matrixParentInverse)
    }
    this.matrixParentInverse = matrixParentInverse

    this.visible = true
  
    const additionalData = name in objectsAdditionalData ? objectsAdditionalData[name] : {}
    Object.keys(additionalData).forEach((additionalDataKey) => {
      this[additionalDataKey] = additionalData[additionalDataKey]
    })
  }

  setParent(parentObject) {
    if (parentObject instanceof Object3D && parentObject !== this) {
      parentObject.addChild(this)
      this.parent = parentObject
    }
  }

  unsetParent() {
    let parent = this.parent
    if (parent) {
      this.parent = null
      parent.removeChild(this)
      return parent
    }
  }

  /**
   * Add an object as a children or set a mesh to this object.
   * 
   * If object is a `Geometry`, then it will do `setGeometry`.
   * If object is an `Object3D`, this will be alias for `addChild`.
   * @param {*} object 
   */

  add(object) {
    if (object instanceof Object3D) {
      this.addChild(object)
    } else if (object instanceof Geometry) {
      this.setGeometry(object)
    }
  }

  addChild(child) {
    if (child instanceof Object3D && child !== this && child.parent !== this) {
      child.parent = this
      this.children.push(child)
    }
  }

  removeChild(child) {
    let childIndex = this.children.indexOf(child)
    if (childIndex >= 0) {
      this.children.splice(childIndex, 1)
      child.parent = null
      return child
    }
  }

  hasChild(child) {
    return this.children.indexOf(child) >= 0
  }

  setGeometry(geometry) {
    this.geometry = geometry
  }

  setWireframeGeometry(geometry) {
    this.wireframeGeometry = geometry
  }

  setMaterial(material) {
    this.material = material
  }

  updateLocalMatrix() {
    if (!this.localMatrixNeedsUpdate) {
      return
    }

    // Convert rotations value from degrees to radians
    let origin = this.origin.property
    let position = this.position.property
    let rotation = this.rotation.property.map(val => degToRad(val))
    let scale = this.scale.property

    let mat = m4.translation(
      position[0] + origin[0],
      position[1] + origin[1],
      position[2] + origin[2]
    )

    mat = m4.multiply(mat,
      m4.xyzRotationScale(
        rotation[0], rotation[1], rotation[2],
        scale[0], scale[1], scale[2]))

    mat = m4.translate(mat, origin[0], origin[1], origin[2])

    this.localMatrix = mat
    this.localMatrixNeedsUpdate = false
  }

  updateShallowWorldMatrix() {
    if (this.parent) {
      this.__updateWorldMatrixFromParent()
    } else {
      this.worldMatrix = this.localMatrix
    }
  }

  __updateWorldMatrixFromParent() {
    let worldMatrix = this.localMatrix
    if (this.matrixParentInverse) {
      worldMatrix = m4.multiply(this.matrixParentInverse, worldMatrix)
    }
    this.worldMatrix = m4.multiply(this.parent.worldMatrix, worldMatrix)
  }

  updateWorldMatrix() {
    this.updateLocalMatrix()

    let parent = this.parent
    if (parent) {
      parent.updateWorldMatrix()
      this.__updateWorldMatrixFromParent()
    } else {
      this.worldMatrix = this.localMatrix
    }
    this.localMatrixNeedsUpdate = false

    // Trigger children to also update its matrices
    this.children.forEach(child => child.localMatrixNeedsUpdate = true)
  }

  updateTreeMatrices() {
    this.updateShallowWorldMatrix()
    this.children.forEach(children => {
      children.updateTreeMatrices()
    })
  }

  get parentNameList() {
    let parents = []
    let object = this
    while (object.parent) {
      object = object.parent
      parents.push(object.name)
    }
    return parents
  }

  get worldPosition() {
    let mat = this.worldMatrix
    return [mat[12], mat[13], mat[14]]
  }

  get root() {
    if (!this.parent || this.parent instanceof Scene) {
      this.rootObject = this
      return this
    }
    this.rootObject = this.parent.root
    return this.rootObject
  }
}