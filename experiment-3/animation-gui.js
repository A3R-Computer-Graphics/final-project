

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

/**
 * Function to update animation slider that has been throttled
 * so that it's not executed too often.
 */
let throttledUpdateAnimationSlider = function () { }

let sliderList = []
function initAnimationValues() {
  // Throttle update animation slider so that it gets called
  // at most 25 fps.
  sliderList = listCustomSliders();
  throttledUpdateAnimationSlider = throttle(updateSliderToMatchAnimation, 50)
  animationManager.addListener('animationupdate', throttledUpdateAnimationSlider)
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