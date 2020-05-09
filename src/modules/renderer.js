class Renderer {
  static render(sceneGraph) {
    sceneGraph.rootNodes.forEach(rootNode => {
      Renderer.recursivelyRenderNodes(rootNode, sceneGraph);
    });
  }

  static recursivelyRenderNodes(node, sceneGraph) {
    let gl = sceneGraph.gl;
    Renderer.renderModel(node.model, gl, sceneGraph.glLocations, sceneGraph);
    
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

  static renderModel(model, gl, glLocations, sceneGraph) {
    let selected = sceneGraph.selectedNodeName === model.name;

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

    if (model.name === 'cube-lighting') {
      gl.bindTexture(gl.TEXTURE_2D, texture2);
    } else {
      gl.bindTexture(gl.TEXTURE_2D, texture1);
    }

    // gl.enableVertexAttribArray(texcoordLocation);
    // gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
    
    // var size = 2;          // 2 components per iteration
    // var type = gl.FLOAT;   // the data is 32bit floats
    // var normalize = false; // don't normalize the data
    // var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    // var offset = 0;        // start at the beginning of the buffer

    // gl.vertexAttribPointer(texcoordLocation, size, type, normalize, stride, offset);

    // // Tell the shader to use texture unit 0 for u_texture
    // gl.uniform1i(textureLocation, 0);

    let viewMatrix = m4.multiply(sceneGraph.camera.viewMatrix, model.fullTransformMatrix)
    let normalMatrix = m4.transpose(m4.inverse(viewMatrix))

    gl.uniformMatrix4fv( glLocations.normalMatrix, false, normalMatrix);
    
    if (selected) {
      gl.uniform1f(glLocations.selectingFactor, 1.0);
    }
    gl.drawArrays(gl.TRIANGLES, model.bufferStartIndex, model.vertexCount);
    if (selected) {
      gl.uniform1f(glLocations.selectingFactor, 0.0);
    }
  }
}