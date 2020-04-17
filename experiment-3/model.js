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
    parentName,
  }) {
    this.name = name;
    this.origin = [...origin];
    this.location = [...location];
    this.rotation = [...rotation];
    this.scale = [...scale];
    this.material = material;

    this.bufferStartIndex = bufferStartIndex;
    this.vertexCount = vertexCount;

    this.node = ObjectNode.getOrCreate(name).updateWith({
      model: this,
      parent: !!parentName
        ? ObjectNode.getOrCreate(parentName)
        : undefined,
    });

    // Transformation matrix computed from loc, rot, and scale.
    this.transformationMatrix = m4.identity();

    // Full transformation matrix, computed from this model as well as from the parent.
    this.fullTransformMatrix = m4.identity();

    this.updateMatrices();
  }

  getParentName() {
    return (((this.node || {}).parent || {}).model || {}).name;
  }

  updateTransformationMatrix() {
    var mat = m4.translation(
      this.location[0] + this.origin[0],
      this.location[1] + this.origin[1],
      this.location[2] + this.origin[2]
    );
    mat = m4.scale(mat, this.scale[0], this.scale[1], this.scale[2]);
    mat = m4.xRotate(mat, degToRad(this.rotation[0]));
    mat = m4.yRotate(mat, degToRad(this.rotation[1]));
    mat = m4.zRotate(mat, degToRad(this.rotation[2]));
    mat = m4.translate(mat, this.origin[0], this.origin[1], this.origin[2]);
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

    // If the node already has parent and the model is already initialized
    if (this.node.hasParent && !!this.node.parent.model) {
      var parentNode = this.node.parent;
      console.log('parent: ', parentNode);
      var parentMatrix = parentNode.model.fullTransformMatrix;
      this.fullTransformMatrix = m4.multiply(
        parentMatrix,
        this.transformationMatrix
      );
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

  /**
   * Generic function to render 3D object, given model matrix,
   * Phong parameters (ambient, diffuse, specular, and shininess),
   * and object's buffer ranges.
   *
   * NOTE: The Phong variables need to be flattened first!
   * Since materials change rarely, we can store its flattened product
   * to avoid calling `flatten()` every time an object is rendered.
   */
  render(gl) {
    const {
      ambientProduct,
      diffuseProduct,
      specularProduct,
      shininess,
    } = this.material;
    gl.uniform4fv(gl.ambientLoc, ambientProduct);
    gl.uniform4fv(gl.diffuseLoc, diffuseProduct);
    gl.uniform4fv(gl.specularLoc, specularProduct);
    gl.uniform1f(gl.shininessLoc, shininess);

    gl.uniformMatrix4fv(
      gl.modelMatrixLoc,
      false,
      flatten(this.fullTransformMatrix)
    );
    gl.drawArrays(gl.TRIANGLES, this.bufferStartIndex, this.vertexCount);
  }
}
