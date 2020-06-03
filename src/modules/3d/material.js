"use strict"

class Material {
  static list = {}

  constructor(name) {
    if (typeof name === 'undefined') {
      name = ModuleUtil.getRandomName()
    }

    this.name = ModuleUtil.getNextUniqueNameFromDict(name.trim(), Material.list)
    Material.list[this.name] = this
  }

  delete() {
    delete Material.list[name]
  }
}

class EmissionMaterial extends Material {
  constructor(name, color) {
    super(name)
    this.color = color
  }
}

class PhongMaterial extends Material {
  constructor(name, { ambient, diffuse, specular, shininess }) {
    super(name)
    this.ambient = ambient || vec4(1.0, 0.0, 1.0, 1.0)
    this.diffuse = diffuse || vec4(1.0, 0.8, 0.0, 1.0)
    this.specular = specular || vec4(1.0, 0.8, 0.0, 1.0)
    this.shininess = shininess !== undefined ? shininess : 60.0
  }
}

class ImageTextureMaterial extends PhongMaterial {
  static textureMaterialList = []
  static lastInitializedIndex = -1

  constructor(name, data, imageSource) {
    super(name, data)

    this.materialId = null
    this.textureNeedsInitialization = true

    this.imageSource = imageSource || null
    this.imageLoaded = false

    this.texture = null

    let list = ImageTextureMaterial.textureMaterialList
    this.materialId = list
    list.push(this)
  }

  static initMaterialsToRenderer(renderer) {
    let gl = renderer.gl
    let mainProgram = renderer.program

    let list = ImageTextureMaterial.textureMaterialList
    let startInit = this.lastInitializedIndex + 1

    for (let i = startInit; i < list.length; i++) {
      let material = list[i]
      if (material !== null) {
        material.initTexture(gl, mainProgram)
      }

      this.lastInitializedIndex = i
    }
  }

  /**
   * Initialize texture. If no image is found, the texture will be pink.
   * @param {*} gl 
   */

  initTexture(gl, mainProgram) {
    if (!this.textureNeedsInitialization) {
      return
    }

    let texture = gl.createTexture()
    this.texture = texture

    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
      new Uint8Array([255, 0, 255, 255]))
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT)

    this.textureNeedsInitialization = false

    if (!this.imageSource) {
      return
    }

    let textureImage = new Image()
    textureImage.src = 'resources/objects/material_resources/' + this.imageSource

    const self = this
    textureImage.addEventListener('load', function () {
      self.imageLoaded = true
      
      gl.activeTexture(gl.TEXTURE0);      
      gl.bindTexture(gl.TEXTURE_2D, texture)
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textureImage)
      gl.generateMipmap(gl.TEXTURE_2D)
    })
  }

  delete() {
    ImageTextureMaterial[this.materialId] = null
    super.delete()
  }
}