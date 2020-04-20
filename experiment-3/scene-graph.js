class SceneGraph {
  constructor({ gl, camera }) {
    this.gl = gl
    this.glLocations = {}
    this.program = program

    this.camera = camera

    this.nodes = {}
    this.rootNodes = []

    this.numVertices = 0
    this.pointsArray = []
    this.normalsArray = []

    this.selectedNodeName = ''

    /**
     * List of materials in dictionary-style.
     * Every material object has Phong parameters
     * (ambient, specular, diffuse), name, and computed product
     * of light and intrinsic material params.
     */
    
    this.materials = {}

    this.lightPosition = vec4(0, -10, 10, 0.0)
    this.lightParams = {
      ambient: vec4(0.2, 0.2, 0.2, 1.0),
      diffuse: vec4(1.0, 1.0, 1.0, 1.0),
      specular: vec4(1.0, 1.0, 1.0, 1.0)
    }

    this.nBuffer = []
    this.vBuffer = []
  }

  initMaterialsFromConfig(materialsData) {
    materialsData.forEach(material => {
      this.materials[material.name] = material
    });
    this.updateMaterialsLighting()
  }

  /**
   * Initialize scene and model data from external configuration.
   * @param {*} modelData model data comprising of vertices and info data
   */

  initModelsFromConfig({ modelsVerticesData, modelsInfoData }) {

    // Compute how many triangles will be needed to draw a convex polygon.
    // For a face with n vertices, it will take n - 2 triangles.

    let triangleCount = Object.keys(modelsVerticesData)
      .map(key => modelsVerticesData[key].indices
        .reduce((p, c) => p + c.length - 2, 0))
      .reduce((p, c) => p + c)

    // Create matrix with the size of points count

    this.pointsArray = new Array(triangleCount * 3)
    this.normalsArray = new Array(triangleCount * 3)

    // Iterate over the modelsVerticesData and modelsInfoData
    // to initiate node data.

    let self = this

    Object.keys(modelsVerticesData).forEach(modelName => {
      let numVertsBefore = self.numVertices
      let objVertsData = modelsVerticesData[modelName]
      let modelInfo = modelsInfoData[modelName]

      let newData = populatePointsAndNormalsArrayFromObject({
        vertices: objVertsData.vertices,
        polygonIndices: objVertsData.indices
      }, self.numVertices, self.pointsArray, self.normalsArray)

      self.numVertices = newData.newStartIndex;
      let vertexCount = self.numVertices - numVertsBefore;

      // Init 3d model info and its nodes.

      let model = new Model({
        name: modelName,
        origin: [0, 0, 0],
        location: modelInfo.location,
        rotation: modelInfo.rotation,
        scale: modelInfo.scale,
        parentName: modelInfo.parent,
        bufferStartIndex: numVertsBefore,
        vertexCount: vertexCount,
        material: self.materials[modelInfo.material_name] || self.materials["Default"],
      })

      let parentExists = !!modelInfo.parent
      let modelNode = self.getOrCreateNode(modelName)
      let parentNode = parentExists ? self.getOrCreateNode(modelInfo.parent) : undefined
      modelNode.updateWith({ model, parent: parentNode })

      if (!model.node.hasParent) {
        self.rootNodes.push(model.node)
      }
    })
  }

  /**
   * Update model matrix transformations for all model in the scene
   * by traversing from the root node and going recursively deep
   * to each of its children.
   */

  updateModelsTransformations() {
    this.rootNodes.forEach(rootNode => rootNode.updateTransformations())
  }

  updateLightSetup({ ambient, diffuse, specular, position }) {
    let isChangingParameters = false
    if (ambient) {
      this.lightParams.ambient = ambient
      isChangingParameters = true
    }
    if (diffuse) {
      this.lightParams.diffuse = diffuse
      isChangingParameters = true
    }
    if (specular) {
      this.lightParams.specular = specular
      isChangingParameters = true
    }
    if (position) {
      this.lightPosition = [position[0], position[1], position[2], 0.0]
      this.updateLightPosition()
    }
    if (isChangingParameters) {
      this.updateMaterialsLighting()
    }
  }

  updateLightPosition() {
    this.gl.uniform4fv(this.glLocations.lightPosition, flatten(this.lightPosition))
  }

  /**
   * Recompute product values of material's own ambient, diffuse,
   * and specular, with the one from lighting.
   */

  updateMaterialsLighting() {
    let lightAmbient = this.lightParams.ambient
    let lightDiffuse = this.lightParams.diffuse
    let lightSpecular = this.lightParams.specular
    let materials = this.materials

    Object.keys(materials).forEach(materialName => {
      let material = materials[materialName]
      material.ambientProduct = flatten(mult(lightAmbient, material.ambient))
      material.diffuseProduct = flatten(mult(lightDiffuse, material.diffuse))
      material.specularProduct = flatten(mult(lightSpecular, material.specular))
    })
  }

  initWebGLVariables() {
    let gl = this.gl
    let locations = this.glLocations

    locations.ambient = gl.getUniformLocation(program, "ambientProduct")
    locations.diffuse = gl.getUniformLocation(program, "diffuseProduct")
    locations.specular = gl.getUniformLocation(program, "specularProduct")
    locations.shininess = gl.getUniformLocation(program, "shininess")
    locations.lightPosition = gl.getUniformLocation(program, "lightPosition")

    locations.modelMatrix = gl.getUniformLocation(program, "modelMatrix")
    locations.viewMatrix = gl.getUniformLocation(program, "viewMatrix")
    locations.projectionMatrix = gl.getUniformLocation(program, "projectionMatrix")
    locations.selectingFactor = gl.getUniformLocation(program, "selectingFactor")
    gl.uniform1f(locations.selectingFactor, 0.0)

    gl.locations = locations

    this.nBuffer = gl.createBuffer()
    this.vBuffer = gl.createBuffer()
  }

  /**
   * Move points and normals array data into GL array buffer.
   */

  movePointsToBufferData() {
    let gl = this.gl
    let program = this.program

    gl.bindBuffer(gl.ARRAY_BUFFER, this.nBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, flatten(this.normalsArray), gl.STATIC_DRAW)

    let vNormal = gl.getAttribLocation(program, "vNormal")
    gl.vertexAttribPointer(vNormal, 4, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(vNormal)

    gl.bindBuffer(gl.ARRAY_BUFFER, this.vBuffer)
    gl.bufferData(gl.ARRAY_BUFFER, flatten(this.pointsArray), gl.STATIC_DRAW)

    let vPosition = gl.getAttribLocation(program, "vPosition")
    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0)
    gl.enableVertexAttribArray(vPosition)
  }

  getOrCreateNode(key) {
    if (!this.nodes.hasOwnProperty(key))
      this.nodes[key] = new ObjectNode({ key: key });
    return this.nodes[key];
  }
}