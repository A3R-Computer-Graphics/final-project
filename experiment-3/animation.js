// Animation Var
var animationDict = {};
let frameNow = 0
let maxFrameNumber = 120;
let speed = 0.5;
var sliderList = [];
var throttledUpdateAnimation = () => {};

function startAnimation() {
  isAnimated = true;
  animate();
}

function stopAnimation() {
  isAnimated = false;
}

function initAnimationDict() {
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
      interpolatedValues.push(getInterpolatedValue(frames, values, i))
    }
    animationDict[key] = interpolatedValues;
  }
  throttledUpdateAnimation = throttle(updateSliderToMatchAnimation, 50);
}

/**
 * Replace Javascript's native number where mod over
 * negative number yields negative number
 */
function mod(number, divisor) {
  return ((number % divisor) + divisor) % divisor;
}

function normalizeFrameNumber(currentFrame, beginFrameNum, loopTime) {
  let frameNum = beginFrameNum + mod(currentFrame - beginFrameNum, loopTime);
  return frameNum;
}

/**
 * 
 * @param {array} frameNumbers 
 * @param {int} currentFrame 
 */
function getNearestFrameNumber(frameNumbers, currentFrame) {
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

/**
 * contoh output:
 * getInterpolatedValue([9, 13, 17], [0, 0.2, 0.8], 9) // hasilnya 0
 * getInterpolatedValue([9, 13, 17], [0, 0.2, 0.8], 10) // hasilnya 0.05
 */
function getInterpolatedValue(frameNumbers, values, currFrame) {
  let beginFrameNum = frameNumbers[0];
  let endFrameNum = frameNumbers[frameNumbers.length - 1];
  let loopTime = endFrameNum - beginFrameNum;

  // normalize frame number
  currFrame = normalizeFrameNumber(currFrame, beginFrameNum, loopTime);
  let nearestId = getNearestFrameNumber(frameNumbers, currFrame)

  // compute linear interpolation
  let prevFrame = frameNumbers[nearestId]
  let nextFrame = frameNumbers[nearestId + 1]
  let prevVal = values[nearestId]
  let nextVal = values[nearestId + 1]
  let factor = (currFrame - prevFrame) / (nextFrame - prevFrame);
  return prevVal * (1 - factor) + nextVal * factor;
}

function animate() {
  for (let sliderName in animationDict) {
    
    const matches = sliderName.match(/^([a-zA-Z_.]+)\.(location|rotation|scale)\.(x|y|z)$/);
    if (!matches) {
        return
    }

    const objectName = matches[1];
    const propertyName = matches[2];
    const axisId = ['x', 'y', 'z'].indexOf(matches[3]);

    let actualFrame = frameNow * speed;
    let frameId = parseInt(actualFrame);
    let values = animationDict[sliderName];
    let factor = actualFrame - frameId;
    value = values[frameId + 1] * factor + values[frameId] * (1 - factor);
    
    ObjectNode.cache[objectName].model[propertyName][axisId] = value
  }

  // Update all transformations
  rootNodes.forEach(node => node.updateTransformations())
  sliderList = listCustomSliders();
  throttledUpdateAnimation();

  // Update Frame Number
  if (frameNow > maxFrameNumber / speed - 1) frameNow = 0;
  else frameNow++;

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

function listCustomSliders() {
  let listName = [];

  document.querySelectorAll('input[type="range"]')
    .forEach(elem => {
      const sliderName = elem.getAttribute('name')
      const matches = sliderName.match(/^([a-zA-Z_.]+)\.(location|rotation|scale)\.(x|y|z)$/);
      if (!matches) {
        return
      }
      const objectName = matches[1];
      if (!ObjectNode.cache[objectName]) {
        return
      }

      const propertyName = matches[2];
      const axisId = ['x', 'y', 'z'].indexOf(matches[3]);

      listName.push({
        sliderName,
        objectName,
        propertyName,
        axisId
      });
    })
  return listName;
}

function updateSliderToMatchAnimation() {
  sliderList.forEach(({sliderName, objectName, propertyName, axisId}) => {
    let objectPropertyValue = ObjectNode.cache[objectName].model[propertyName][axisId];
    let sliderElement = document.querySelector(`input[name="${sliderName}"]`);
    sliderElement.value = objectPropertyValue;
    sliderElement.parentElement.querySelector('.slider-value').textContent = Math.round(objectPropertyValue * 100) / 100;
  })
}