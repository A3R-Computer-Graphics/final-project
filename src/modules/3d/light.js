"use strict"

class Light extends Object3D {
  static lightList = []

  // This is done to avoid using different geometery and materials
  // since light doesn't need that.

  static lightCubeGeometry = new PrimitiveCube()
  static lightCubeMaterial = new EmissionMaterial()
  static lastShadowMapIndex = 1 // Added 1 because the 0 is used for material texture

  static TEXTURE_SIZE = 512

  constructor(textureSize) {
    super({
      geometry: Light.lightCubeGeometry,
      material: Light.lightCubeMaterial
    })

    this.ambient = vec4(0.2, 0.2, 0.2, 1.0)
    this.diffuse = vec4(1.0, 1.0, 1.0, 1.0)
    this.specular = vec4(1.0, 1.0, 1.0, 1.0)

    this.shadowMapIndex = Light.lastShadowMapIndex++
    this.shadowMapTexture = null
    this.shadowMapTextureSize = textureSize || Light.TEXTURE_SIZE

    this.framebuffer = null
    this.renderbuffer = null

    Light.lightList.push(this)
  }

  get shadowMapTextureInitialized() {
    return this.shadowMapTexture !== null
  }


  updateLightToRenderer(renderer) {
    let gl = renderer.gl
    let lightPositionLoc = renderer.program.uniforms.lightPosition

    // TODO: Right now it uses original light position
    // but the light can be parented to any object so
    // matrix transformation should be taken into account

    // this.updateWorldMatrix()
    gl.uniform3fv(lightPositionLoc, this.worldPosition)
  }
}


class PointLight extends Light {

  initTexture(gl) {
    this.shadowMapTexture = gl.createTexture()

    gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.shadowMapTexture)
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT)
    gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT)

    /** Sorry if this seems too verbose, I am just making sure
     * the parameter of these WebGL functions is obvious. */

    let CUBE_SIDE = 6
    let width = this.shadowMapTextureSize
    let height = width
    let format = gl.RGBA
    let dataType = gl.UNSIGNED_BYTE
    let level = 0
    let border = 0
    let pixelSourceBuffer = null

    for (let i = 0; i < CUBE_SIDE; i++) {
      let target = gl.TEXTURE_CUBE_MAP_POSITIVE_X + i
      gl.texImage2D(target, level, format, width, height, border, format, dataType, pixelSourceBuffer)
    }
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null)

    this.initFrameAndRenderbuffer(gl)
    this.finishInitFrameAndRenderbuffer(gl)
  }

  initFrameAndRenderbuffer(gl) {
    let width = this.shadowMapTextureSize
    let height = width

    // Finish setup

    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null)
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.bindRenderbuffer(gl.RENDERBUFFER, null)

    this.framebuffer = gl.createFramebuffer()
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer)

    this.renderbuffer = gl.createRenderbuffer()
    gl.bindRenderbuffer(gl.RENDERBUFFER, this.renderbuffer)
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height)
  }

  finishInitFrameAndRenderbuffer(gl) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, null)
    gl.bindRenderbuffer(gl.RENDERBUFFER, null)
  }

  bindGlToThisTexture(gl) {
    gl.bindTexture(gl.TEXTURE_CUBE_MAP, this.shadowMapTexture)
  }
}


class DirectionalLight extends Light {
  constructor(textureSize) {
    super(textureSize)

    this.shadowMapIndex = 2

    let LINE_LENGTH = 40

    this.areaHelper = new PrimitiveCube()
    this.directionHelper = new PrimitiveLine(LINE_LENGTH, PrimitiveLine.NEGATIVE_Z)

    this.unusedTexture = null

    this.lightWorldMatrix = m4.identity()
    this.lightProjectionMatrix = m4.identity()

    this.changed = false
    this._projHeight = 30.0
    this._projWidth = 30.0

    this._fov = 90.0
    this._near = 0.5
    this._far = 40.0
  }


  get near() {
    return this._near
  }

  get far() {
    return this._far
  }

  get fov() {
    return this._fov
  }

  get projWidth() {
    return this._projWidth
  }

  get projHeight() {
    return this._projHeight
  }



  set fov(val) {
    if (val !== this._fov) {
      this.changed = true
    }
    this._fov = val
  }

  set near(val) {
    if (val !== this._near) {
      this.changed = true
    }
    this._near = val
  }

  set far(val) {
    if (val !== this._far) {
      this.changed = true
    }
    this._far = val
  }

  set projWidth(val) {
    if (val !== this._projWidth) {
      this.changed = true
    }
    this._projWidth = val
  }

  set projHeight(val) {
    if (val !== this._projHeight) {
      this.changed = true
    }
    this._projHeight = val
  }

  // taken from: https://webglfundamentals.org/webgl/lessons/webgl-shadows.html

  initTexture(gl) {
    this.shadowMapTexture = gl.createTexture()
    let texSize = this.shadowMapTextureSize

    gl.bindTexture(gl.TEXTURE_2D, this.shadowMapTexture)
    gl.texImage2D(
      gl.TEXTURE_2D,      // target
      0,                  // mip level
      gl.DEPTH_COMPONENT, // internal format
      texSize,            // width
      texSize,            // height
      0,                  // border
      gl.DEPTH_COMPONENT, // format
      gl.UNSIGNED_INT,    // type
      null);              // data

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

    this.framebuffer = gl.createFramebuffer()
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffer)

    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,         // target
      gl.DEPTH_ATTACHMENT,    // attachment point
      gl.TEXTURE_2D,          // texture target
      this.shadowMapTexture,  // texture
      0)                      // mip level

    // create a color texture of the same size as the depth texture
    this.unusedTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.unusedTexture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      texSize,
      texSize,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      null,
    )
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)

    // attach it to the framebuffer
    gl.framebufferTexture2D(
      gl.FRAMEBUFFER,        // target
      gl.COLOR_ATTACHMENT0,  // attachment point
      gl.TEXTURE_2D,         // texture target
      this.unusedTexture,    // texture
      0)                     // mip level

    gl.bindFramebuffer(gl.FRAMEBUFFER, null)

  }

  bindGlToThisTexture(gl) {
    return
  }


  recomputeMapMatrix() {
    this.updateWorldMatrix()

    // Join target and source coordinates and apply transformation to them
    let localSrcPos = [0.0, 0.0, 0.0, 1.0]
    let localTargetPos = [...localSrcPos]
    localTargetPos[2] -= 10.0 // light is looking at Z negative

    let localCoords = [localSrcPos, localSrcPos, localTargetPos, localTargetPos]
    localCoords = flatten(localCoords)

    let worldCoords = m4.multiply(this.worldMatrix, localCoords)
    let c = worldCoords

    let srcPos = [c[0], c[1], c[2]]
    let targetPos = [c[8], c[9], c[10]]

    let changed = false || this.changed

    if (!this.lastCoord) {
      this.lastCoord = srcPos
      this.lastTarget = targetPos
      changed = true
    } else {

      // uncomment this if you care only about  the direction
      let focusToDirectionOnly = true

      if (focusToDirectionOnly) {
        let diff = normalize(subtract(srcPos, targetPos))
        targetPos = scale(-1, diff)
        srcPos = scale(1, diff)
      }

      if (length(subtract(this.lastCoord, srcPos)) > 0.001) {
        this.lastCoord = srcPos
        changed = true
      }
      if (length(subtract(this.lastTarget, targetPos)) > 0.001) {
        this.lastTarget = targetPos
        changed = true
      }

      if (changed) {
        // console.log(srcPos, targetPos)
      }
    }

    if (changed) {

      let multiplier = this.multiplier || 10

      let up = [0, 0, 1]
      let pointDirection = subtract(srcPos, targetPos)
      let angleBetween = radToDeg(Math.acos(dot(up, pointDirection) / length(pointDirection) / length(up)))
      
      if (angleBetween > 179 || angleBetween < -179 || angleBetween < 1 && angleBetween > -1) {
        up = [0, 1, 0]
      }

      this.lightWorldMatrix = flatten(lookAt(srcPos, targetPos, up))

      let width = this._projWidth / 2
      let height = this._projHeight / 2
      let [left, right, bottom, top] = [-width, width, -height, height]

      // uncomment this if you want the near and far to be scaled symettrically
      let scaleSymettrically = true
      
      let [near, far] = [this._near, this._far]

      if (scaleSymettrically) {
        let dist = Math.abs(far - near) / 2
        near = -dist
        far = dist
      }

      let isPerspective = false

      if (isPerspective) {
        let aspect = width / height
        this.lightProjectionMatrix = flatten(perspective(this._fov, aspect, near, far))
      } else {
      this.lightProjectionMatrix = flatten(ortho(left, right, bottom, top, near, far))
      }

      this.changed = false
    }

  }
}