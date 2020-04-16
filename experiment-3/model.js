class Model {
  constructor(name, origin, location, rotation, scale, material, node) {
    this.name = name;
    this.origin = [...origin];
    this.location = [...location];
    this.rotation = [...rotation];
    this.scale = [...scale];

    this.material = material;
    this.node = node;
    this.bufferStartIndex = 0;
    this.vertexCount = 0;

    /**
     * Transformation matrix computed from loc, rot, and scale.
     */
    this.transformationMatrix = m4.identity();
    /**
     * Full transformation matrix, computed from this model as well as from the parent.
     */
    this.fullTransformMatrix = m4.identity();
  }

  getParentName() {
    return (((this.node || {}).parent || {}).model || {}).name;
  }

  updateTransformationMatrix() {
    var mat = m4.translation(
      this.location[0] + this.origin[0],
      this.location[1] + this.origin[1],
      this.location[2] + this.origin[2]
    )
    mat = m4.scale(mat, this.scale[0], this.scale[1], this.scale[2])
    mat = m4.xRotate(mat, degToRad(this.rotation[0]))
    mat = m4.yRotate(mat, degToRad(this.rotation[1]))
    mat = m4.zRotate(mat, degToRad(this.rotation[2]))
    mat = m4.translate(mat, this.origin[0], this.origin[1], this.origin[2])
    this.transformationMatrix = mat;
  }

  /**
   * Update model's full transformation matrix.
   * The transformation matrix need to be updated first before performing
   * this operation.
   */

  updateFullTransformationMatrix() {
    // objectNodesList and objectNameToId is a global variable
    // I know, it looks dirty to call those variables here
    // but this is the fastest way to call it.

    var parentName = this.getParentName()
    if (parentName) {
      var parentNode = objectNodesList[objectNameToId[parentName]];
      var parentMatrix = parentNode.model.fullTransformMatrix;
      this.fullTransformMatrix = m4.multiply(parentMatrix, this.transformationMatrix);
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
      y = x[1]
      z = x[2]
      x = x[0]
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
}