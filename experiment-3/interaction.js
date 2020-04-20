window.addEventListener('load', function () {
  this.document.querySelectorAll('input[type="range"]').forEach(elem => {
    const sliderName = elem.getAttribute('name')
    const propertyData = parsePropertyString(sliderName);
    if (propertyData === undefined) {
      return
    }

    const { modelName, propertyName, axisId } = propertyData;
    elem.addEventListener('input', function (event) {
      ObjectNode.cache[modelName].model[propertyName][axisId] = parseFloat(event.target.value);
      ObjectNode.cache[modelName].updateTransformations()
      let textVal = event.target.parentElement.querySelector('.slider-value')
      textVal.innerHTML = parseFloat(event.target.value);
    })
  })

  let SPEED_MIN = 0.05;
  let SPEED_MAX = 4;
  let speedSlider = document.querySelector('input[name="speed"]');
  let speedValueDisplay = speedSlider.parentElement.querySelector('.slider-value');

  speedSlider.addEventListener('input', event => {
    let value = parseFloat(event.target.value);
    value = interpolateExponentially(SPEED_MIN, SPEED_MAX, value);
    speedValueDisplay.innerText = Math.round(value * 100) + '%';
    updateSpeed(value);
  })

  // Init slider position from inverse of exponential (logarithm)
  let sliderInitValue = interpolateLogarithmatically(SPEED_MIN, SPEED_MAX, speed);
  speedSlider.value = sliderInitValue;
  speedValueDisplay.innerText = Math.round(speed * 100) + '%';
})