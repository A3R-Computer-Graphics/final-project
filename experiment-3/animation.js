// Animation Variables

let speed = 0.5;

/**
 * List of animation keyframe values
 */
let animationValues = {}
let frameNow = 0
let maxFrameNumber = 120

let sliderList = []

/**
 * Function to update animation slider that has been throttled
 * so that it's not executed too often.
 */
let throttledUpdateAnimationSlider = function () { }

function startAnimation() {
  isAnimated = true;
  animate();
}

function stopAnimation() {
  isAnimated = false;
}

function initAnimationValues() {
  for (let key in animations_definition) {
    let arr = animations_definition[key].split(" ")
    let frames = []
    let values = []
    for (let i = 0; i < arr.length; i += 2) {
      frames.push(parseInt(arr[i].slice(0, -1)))
      values.push(parseFloat(arr[[i + 1]]))
    }
    let interpolatedValues = []
    for (let i = 0; i < maxFrameNumber + 2; i++) {
      interpolatedValues.push(getLinerpValue(frames, values, i))
    }
    animationValues[key] = interpolatedValues;
  }
  // Throttle update animation slider so that it gets called
  // at most 25 fps.
  sliderList = listCustomSliders();
  throttledUpdateAnimationSlider = throttle(updateSliderToMatchAnimation, 50)
}

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

function animate() {
  for (let sliderName in animationValues) {

    const data = parsePropertyString(sliderName);
    if (!data) {
      return
    }

    const { modelName, propertyName, axisId } = data;

    let actualFrame = frameNow * speed;
    let frameId = parseInt(actualFrame);

    let values = animationValues[sliderName];
    let factor = actualFrame - frameId;
    value = values[frameId + 1] * factor + values[frameId] * (1 - factor);

    ObjectNode.cache[modelName].model[propertyName][axisId] = value
  }

  // Update all transformations
  rootNodes.forEach(node => node.updateTransformations())
  throttledUpdateAnimationSlider();

  // Update frame number
  if (frameNow > maxFrameNumber / speed - 1) {
    frameNow = 0
  }
  else {
    frameNow++
  }

  if (isAnimated) {
    window.requestAnimationFrame(animate)
  }
}

function updateSpeed(newSpeed) {
  if (newSpeed < 0.001) {
    return;
  }
  frameNow = frameNow / newSpeed * speed;
  speed = newSpeed;
}

/**
 * List all sliders in the document and for each slider,
 * see if the slider is in the animation dictionary and is actually
 * defined in the ObjectNode cache.
 */

function listCustomSliders() {
  let listName = [];

  document.querySelectorAll('input[type="range"]')
    .forEach(elem => {
      const sliderName = elem.getAttribute('name')
      const data = parsePropertyString(sliderName);
      
      if (!data) {
        return
      }

      const { modelName, propertyName, axisId } = data;
      if (!ObjectNode.cache.hasOwnProperty(modelName)) {
        return
      }

      listName.push({
        sliderName,
        modelName,
        propertyName,
        axisId
      });
    })

  return listName;
}

function updateSliderToMatchAnimation() {
  sliderList.forEach(({ sliderName, modelName, propertyName, axisId }) => {
    let animationValue = ObjectNode.cache[modelName].model[propertyName][axisId];
    let sliderElement = document.querySelector(`input[name="${sliderName}"]`);
    let displayElement = sliderElement.parentElement.querySelector('.slider-value');
    sliderElement.value = animationValue;
    displayElement.innerHTML = Math.round(animationValue * 100) / 100;
  })
}