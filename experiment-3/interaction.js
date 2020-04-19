window.addEventListener('load', function() {

    // Query all input sliders
    this.document.querySelectorAll('input[type="range"]').forEach(elem => {
        // Get attribute slider name
        const sliderName = elem.getAttribute('name')
        
        // find match
        const matches = sliderName.match(/^([a-zA-Z_.]+)\.(location|rotation|scale)\.(x|y|z)$/);
        if (!matches) {
            return
        }

        const objectName = matches[1];
        const propertyName = matches[2];
        const axisId = ['x', 'y', 'z'].indexOf(matches[3]);

        // Attach input event listener to this slider
        elem.addEventListener('input', function(event) {
            ObjectNode.cache[objectName].model[propertyName][axisId] = parseFloat(event.target.value);
            ObjectNode.cache[objectName].updateTransformations()
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