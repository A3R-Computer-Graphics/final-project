/**
 * Replace Javascript's native number where mod over
 * negative number yields negative number
 */
function mod(number, divisor) {
  return ((number % divisor) + divisor) % divisor;
}

/**
 * Normalize current frame number so that it stays within keyframe loop time range
 * while maintaining congruency.
 * Specifically, it returns s + (c - e) % t where s is start range, e is end range,
 * c is current range, and t is range span.
 */

function normalizeFrameNumber(current, start, span) {
  return start + mod(current - start, span);
}

/**
 * Find index of nearest frame number with value closest
 * but not greater than current frame.
 * @param {Array<Number>} frameNumbers 
 * @param {Number} currentFrame 
 */
function nearestFrameIndex(frameNumbers, currentFrame) {
  let nearestId = 0;
  for (let i = 0; i < frameNumbers.length; i++) {
    if (frameNumbers[i] < currentFrame) {
      nearestId = i;
    } else {
      break;
    }
  }
  return nearestId
}

/** Find value interpolated linearly (linerp) from current frame,
 * given keyframes and its corresponding keyframe value.
 * 
 * Examples:
 * - `getLinerpValue([9, 13, 17], [0, 0.2, 0.8], 9)` returns 0
 * - `getLinerpValue([9, 13, 17], [0, 0.2, 0.8], 11)` returns 0.1
 * - `getLinerpValue([9, 13, 17], [0, 0.2, 0.8], 15)` returns 0.5
 * 
 * @param {Array<Number>} frameNumbers 
 * @param {Array<Number>} values 
 * @param {Number} currFrame 
 */
function getLinerpValue(frameNumbers, values, currFrame) {
  let start = frameNumbers[0];
  let end = frameNumbers[frameNumbers.length - 1];
  let span = end - start;

  // normalize frame number
  currFrame = normalizeFrameNumber(currFrame, start, span);
  let nearestId = nearestFrameIndex(frameNumbers, currFrame)

  // compute linear interpolation
  let prevFrame = frameNumbers[nearestId]
  let nextFrame = frameNumbers[nearestId + 1]
  let prevVal = values[nearestId]
  let nextVal = values[nearestId + 1]
  let factor = (currFrame - prevFrame) / (nextFrame - prevFrame);
  return prevVal * (1 - factor) + nextVal * factor;
}

class AnimationManager extends EventDispatcher {
  constructor({ sceneGraph, speed, maxFrameNumber }) {
    super()
    this.sceneGraph = sceneGraph
    /** List of animation keyframe values
     */
    this.animationValues = {}
    this.frameNow = 0
    this._speed = speed
    this.speed = this._speed
    this.maxFrameNumber = maxFrameNumber
    this.isAnimating = false
  }

  startAnimation() {
    this.isAnimating = true
    this.dispatchEvent('start')
    this.animate()
  }

  stopAnimation() {
    this.isAnimating = false
    this.dispatchEvent('stop')
  }

  initFromConfig(animationConfig) {
    Object.keys(animationConfig).forEach(key => {
      let arr = animationConfig[key].split(" ")

      let frames = []
      let values = []
      for (let i = 0; i < arr.length; i += 2) {
        frames.push(parseInt(arr[i].slice(0, -1)))
        values.push(parseFloat(arr[[i + 1]]))
      }

      let interpolatedValues = []

      // Generate n + 2 interpolation points at every integer frame number
      for (let i = 0; i < this.maxFrameNumber + 2; i++) {
        interpolatedValues.push(getLinerpValue(frames, values, i))
      }

      this.animationValues[key] = interpolatedValues
    })
  }

  animate() {
    let nodes = this.sceneGraph.nodes
    let frameNow = this.frameNow
    let speed = this.speed
    let actualFrame = frameNow * speed
    let frameId = parseInt(actualFrame)
    let factor = actualFrame - frameId
    let animationValues = this.animationValues

    Object.keys(this.animationValues).forEach(sliderName => {
      const data = parsePropertyString(sliderName)
      if (!data) { return }

      const { modelName, propertyName, axisId } = data
      let values = animationValues[sliderName]

      // Interpolate linearly from two consecutive frames
      let value = values[frameId + 1] * factor + values[frameId] * (1 - factor)

      // Update model transformation properties
      nodes[modelName].model[propertyName][axisId] = value
    })

    // Update transformation matrices, starting from root nodes
    this.sceneGraph.updateModelsTransformations()
    this.dispatchEvent('animationupdate', { currentFrame: frameNow })

    // Update frame number
    if (this.frameNow > this.maxFrameNumber / speed - 1) {
      this.frameNow = 0
    }
    else {
      this.frameNow++
    }

    let self = this
    if (this.isAnimating) {
      window.requestAnimationFrame(() => {self.animate()})
    }
  }
  
  get speed() {
    return this._speed
  }

  set speed (newSpeed) {
    if (newSpeed < 0.001) {
      return
    }
    this.frameNow = this.frameNow / newSpeed * this._speed
    this._speed = newSpeed
  }
}