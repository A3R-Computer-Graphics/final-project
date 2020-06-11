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
  constructor(name, { color, ambient, diffuse, specular, shininess, emissive }) {
    super(name)
    this.color = color
    this.ambient = ambient
    this.diffuse = diffuse
    this.specular = specular
    this.shininess = shininess !== undefined ? shininess : 60.0
    this.emissive = emissive !== undefined ? emissive : false
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

    let list = ImageTextureMaterial.textureMaterialList
    let startInit = this.lastInitializedIndex + 1

    for (let i = startInit; i < list.length; i++) {
      let material = list[i]
      if (material !== null) {
        material.initTexture(gl, renderer.programInfos.main)
      }

      this.lastInitializedIndex = i
    }
  }

  /**
   * Initialize texture. If no image is found, the texture will be pink.
   * @param {*} gl 
   */

  initTexture(gl, programInfo) {
    if (!this.textureNeedsInitialization) {
      return
    }

    let texture = twgl.createTexture(gl, {
      target: gl.TEXTURE_2D,
      color: [1.0, 0, 1.0, 1.0],
      level: 0,
      format: gl.RGBA, // default value
      internalFormat: gl.RGBA, // default value
      width: 1,
      height: 1,
      type: gl.UNSIGNED_BYTE,
      src: 'resources/objects/material_resources/' + this.imageSource,

      minMag: gl.LINEAR,
      wrap: gl.MIRRORED_REPEAT
    },
    
    function() {
      twgl.setUniforms(programInfo, {
        u_texture: texture
      })
    })

    this.texture = texture
    this.textureNeedsInitialization = false
  }

  delete(gl) {
    if (this.texture) {
      gl.deleteTexture(this.texture)
    }
    ImageTextureMaterial[this.materialId] = null
    super.delete()
  }
}