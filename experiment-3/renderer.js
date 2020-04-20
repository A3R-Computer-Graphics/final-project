class Renderer {
  static render(sceneGraph) {
    sceneGraph.rootNodes.forEach(rootNode => {
      Renderer.recursivelyRenderNodes(rootNode, sceneGraph);
    });
  }

  static recursivelyRenderNodes(node, sceneGraph) {
    let gl = sceneGraph.gl;
    Renderer.renderModel(node.model, gl, sceneGraph.glLocations);
    
    // Traverse the whole tree and render every visited node
    
    node.children.forEach(childNode => {
      Renderer.recursivelyRenderNodes(childNode, sceneGraph);
    });
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

  static renderModel(model, gl, glLocations) {
    const {
      ambientProduct,
      diffuseProduct,
      specularProduct,
      shininess,
    } = model.material;

    gl.uniform4fv(glLocations.ambient, ambientProduct);
    gl.uniform4fv(glLocations.diffuse, diffuseProduct);
    gl.uniform4fv(glLocations.specular, specularProduct);
    gl.uniform1f(glLocations.shininess, shininess);

    gl.uniformMatrix4fv(
      glLocations.modelMatrix,
      false,
      flatten(model.fullTransformMatrix)
    );
    gl.drawArrays(gl.TRIANGLES, model.bufferStartIndex, model.vertexCount);
  }
}