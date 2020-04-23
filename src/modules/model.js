class Model {
  constructor({
    name,
    origin,
    location,
    rotation,
    scale,
    material,
    bufferStartIndex,
    vertexCount,
  }) {

    this.name = name;
    this.origin = [...(origin || [0, 0, 0])];
    this.location = [...(location || [0, 0, 0])];
    this.rotation = [...(rotation || [0, 0, 0])];
    this.scale = [...(scale || [1, 1, 1])];
    this.material = material;

    this.bufferStartIndex = bufferStartIndex;
    this.vertexCount = vertexCount;

    // Transformation matrix computed from loc, rot, and scale.
    this.transformationMatrix = m4.identity();

    // Full transformation matrix, computed from this model as well as from the parent.
    this.fullTransformMatrix = m4.identity();
  }

  updateTransformationMatrix() {
    // Convert rotations value from degrees to radians
    let rotation = this.rotation.map(val => degToRad(val));
    let scale = this.scale;

    let mat = m4.translation(
      this.location[0] + this.origin[0],
      this.location[1] + this.origin[1],
      this.location[2] + this.origin[2]
    );
    mat = m4.multiply(mat,
      m4.xyzRotationScale(
        rotation[0], rotation[1], rotation[2],
        scale[0], scale[1], scale[2]));
    mat = m4.translate(mat, this.origin[0], this.origin[1], this.origin[2]);
    this.transformationMatrix = mat;
  }

  /**
   * Update model's full transformation matrix.
   * The transformation matrix need to be updated first before performing
   * this operation.
   */
  updateFullTransformationMatrix() {
    // If the node already has parent and the model is already initialized
    if (this.node.hasParent && !!this.node.parent.model) {
      var parentNode = this.node.parent;
      var parentMatrix = parentNode.model.fullTransformMatrix;
      this.fullTransformMatrix = m4.multiply(
        parentMatrix,
        this.transformationMatrix
      );
      // Else use transformation matrix directly
    } else {
      this.fullTransformMatrix = this.transformationMatrix;
    }
  }

  /**
   * Update transformation and full transformation matrix.
   */

  updateMatrices() {
    this.updateTransformationMatrix();
    this.updateFullTransformationMatrix();
  }

  deltaGeneral(arr, x, y, z) {
    if (x.length === 3) {
      y = x[1];
      z = x[2];
      x = x[0];
    }
    arr[0] += x || 0;
    arr[1] += y || 0;
    arr[2] += z || 0;

    this.updateMatrices();
  }

  deltaOrigin(x, y, z) {
    this.deltaGeneral(this.origin, x, y, z);
  }

  deltaRotation(x, y, z) {
    this.deltaGeneral(this.rotation, x, y, z);
  }

  deltaScale(x, y, z) {
    this.deltaGeneral(this.scale, x, y, z);
  }

  deltaLocation(x, y, z) {
    this.deltaGeneral(this.location, x, y, z);
  }

  setMaterial(materialName, materialList) {
    if (materialList[materialName]) {
      this.material = materialList[materialName]
    } else {
      throw Error('Material name not found')
    }
  }
}
