/**
 * Convert property name in format of string into
 * dictionary. Supported properties are location, rotation
 * and scale. If string does not match the format, this returns
 * undefined.
 * 
 * Examples:
 * `head.rotation.x` returns { modelName: "head", propertyName: "rotation", axisId: 0 }.
 * 
 * @param {String} stringPropertyName 
 */
function parsePropertyString(stringPropertyName) {
  const matches = stringPropertyName.match(/^([a-zA-Z_.]+)\.(location|rotation|scale)\.(x|y|z)$/);
  if (!matches) {
    return
  }

  return {
    modelName: matches[1],
    propertyName: matches[2],
    axisId: ['x', 'y', 'z'].indexOf(matches[3])
  }
}

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

  let speedSlider = document.querySelector('input[name="speed"]')
  speedSlider.addEventListener('input', event => {
    let textVal = event.target.parentElement.querySelector('.slider-value')
    let value = parseFloat(event.target.value);
    let multiplier = Math.log(4 / 0.05);
    value = 0.05 * Math.exp(multiplier * (value - 0.05) / (4 - 0.05));
    textVal.textContent = Math.round(value * 100) / 100;
    updateSpeed(value);
  })

  let multiplier = Math.log(4 / 0.05);
  let speedSliderValue = Math.log(speed / 0.05) / multiplier * (4 - 0.05) + 0.05;
  speedSlider.value = speedSliderValue;
  speedSliderValue = Math.round(speedSliderValue * 100) / 100;
  speedSlider.parentElement.querySelector('.slider-value').textContent = speed;

})