"use strict";

let scene
let camera

// Modules
let navigableCamera
let objectPicking
let selectedObjectFromTree

let renderer

let app
let animationManager

let cameraRadius = 13
let theta = 0
let phi = 0
let cameraPosIndex = 22
let coordinateDirectionOrder = ['UP', 'LEFT', 'DOWN', 'RIGHT']

let at = vec3(0.6, -1.0, 2.5)

// rendering engine variables variables

let canvas
let gl
let resolution = 50

// Interaction variables

let isMenuShown = true
let sliderList = []

// Light is On to show if light is on or off
let lightIsOn = true




// Utility to update slider value

/**
 * Update slider display from parent element
 * 
 * @param {[String, HTMLInputElement]} slider 
 */

function updateSliderDisplay(slider, value) {
  if (typeof slider === 'string') {
    slider = document.querySelector(`input[name="${slider}"`)
  }
  if (typeof value == 'undefined') {
    value = parseFloat(slider.value);
  }
  if (slider) {
    slider.parentElement.querySelector('.slider-value').innerText = value;
  }
}



/**
 * Update slider value and its display
 * 
 * @param {[String, HTMLInputElement]} slider 
 * @param {Number} value 
 * @param {Number} sliderValue optional, different value for slider
 */

function updateSliderValueAndDisplay(slider, value, sliderValue) {
  if (value !== undefined) {
    if (typeof slider === 'string') {
      slider = document.querySelector(`input[name="${slider}"`)
    }
    if (typeof sliderValue === 'undefined') {
      sliderValue = value;
    }
    if (slider) {
      slider.value = sliderValue;
      slider.parentElement.querySelector('.slider-value').innerText = value;
    }
  }
}



/**
 * Function to update animation slider that has been throttled
 * so that it's not executed too often.
 */
let throttledSliderHandler = function () { }

/**
 * Initialize camera position from chosen camera position index
 */

function initCameraPosition() {
  let cameraPosCoords = cameraCoordinates[cameraPosIndex];
  // Match camera coordinate (Y+ axis pointing up) to Blender's.
  // (Z+ pointing up)
  let cameraSpherePos = cartesianToSphere(
    cameraPosCoords[0],
    -cameraPosCoords[2],
    cameraPosCoords[1]
  );
  phi = cameraSpherePos[1];
  theta = cameraSpherePos[2];
}



function toggleAnimation() {
  const animateBtn = document.getElementById('btn-animate');
  if (animationManager.isAnimating) {
    animationManager.stopAnimation()
    animateBtn.innerText = 'Mulai Animasi';
    animateBtn.classList.remove('btn-danger');
    animateBtn.classList.add('btn-primary');
    document.querySelectorAll('.range-animation')
      .forEach(elem => {
        elem.disabled = false;
      })
  } else {
    animationManager.startAnimation();
    animateBtn.innerText = 'Hentikan Animasi';
    animateBtn.classList.remove('btn-primary');
    animateBtn.classList.add('btn-danger');
    document.querySelectorAll('.range-animation')
      .forEach(elem => {
        elem.disabled = true;
      })
  }
}



function connectSlidersToModelData() {
  document.querySelectorAll('input[type="range"]').forEach(elem => {
    const sliderName = elem.getAttribute('name')
    const propertyData = parsePropertyString(sliderName);
    if (propertyData === undefined) {
      return
    }

    const { modelName, propertyName, axisId } = propertyData;
    let object = app.objects[modelName][propertyName];

    elem.addEventListener('input', () => {
      let value = parseFloat(elem.value);
      updateSliderValueAndDisplay(elem, value);
      object.setOnAxisId(axisId, value);
    })
  })
}



function connectSpeedSlider() {
  let slider = document.querySelector('input[name="speed"]');

  const SPEED_MIN = parseFloat(slider.getAttribute('min'));
  const SPEED_MAX = parseFloat(slider.getAttribute('max'));

  slider.addEventListener('input', () => {
    let value = parseFloat(slider.value);
    value = interpolateExponentially(SPEED_MIN, SPEED_MAX, value);
    updateSliderDisplay(slider, Math.round(value * 100) + '%');
    animationManager.speed = value;
  })

  // Init slider position from inverse of exponential (logarithm)
  let currentSpeed = animationManager.speed;
  let displaySpeed = Math.round(currentSpeed * 100) + '%'
  let sliderInitValue = interpolateLogarithmatically(SPEED_MIN, SPEED_MAX, currentSpeed);

  updateSliderValueAndDisplay(slider, displaySpeed, sliderInitValue);
}



function connectLightIntensitySliders() {
  document.querySelectorAll('input[name^=lightintensity-slider]').forEach(slider => {

    const name = slider.getAttribute('name');
    const lightName = name.slice(22);
    console.log(lightName)
    const lightObj = app.objects[lightName];

    let value = lightObj.intensity
    updateSliderValueAndDisplay(slider, value)

    slider.addEventListener('input', () => {
      let newValue = parseFloat(slider.value);
      lightObj.intensity = newValue
      updateSliderDisplay(slider, newValue);
    });
  });
}



function connectLightColorPicker() {
  document.querySelectorAll('input[name^=lightcolor-]').forEach(colorPicker => {

    const name = colorPicker.getAttribute('name');
    const lightName = name.slice(name.indexOf('-') + 1);
    const lightObj = app.objects[lightName];
    
    colorPicker.addEventListener('input', () => {
      const hexCol = colorPicker.value
      // Convert to rgb
      let r = 0, g = 0, b = 0;
      r = ("0x" + hexCol[1] + hexCol[2]) / 255;
      g = ("0x" + hexCol[3] + hexCol[4]) / 255;
      b = ("0x" + hexCol[5] + hexCol[6]) / 255;
      lightObj.color = [r,g,b]
    });

  });
}



/**
 * Update eye coordinate calculation from global
 * variables `radius`, `theta`, and `phi`.
 */

function updateCameraView() {
  if (camera.isFirstPersonView) return
  let r = cameraRadius;

  theta = (Math.sign(theta) || 1) * Math.max(Math.abs(theta), 0.1)

  let sin_t = Math.sin(theta);
  let sin_p = Math.sin(phi);
  let cos_t = Math.cos(theta);
  let cos_p = Math.cos(phi); 

  let x = r * sin_t * cos_p;
  let y = r * sin_t * sin_p;
  let z = r * cos_t;

  let eye = add(at, vec3(x, y, z));

  camera.position.set(eye)
  camera.lookAt(at)
}

let isSpaceKeyPressed = false

function handleKeyDown(event) {
  if (!isSpaceKeyPressed && (event.code === 'Space' || event.key === ' ' || event.keyCode === 32)) {
    toggleAnimation()
    isSpaceKeyPressed = true
  }
}

function handleKeyUp(event) {
  if (event.code === 'Space' || event.key === ' ' || event.keyCode === 32) {
    isSpaceKeyPressed = false
  }
}



let MAX_HEIGHT = 1080
let MAX_WIDTH = 1440

/**
 * Adjust viewport so the canvas stays clear even if window resolution changes.
 */

function adjustViewport() {
  let rect = canvas.parentElement.getBoundingClientRect()
  let width = rect.width * window.devicePixelRatio;
  let height = rect.height * window.devicePixelRatio;

  // Get w:h ratio of canvas size as displayed in the screen.
  let widthToHeightRatio = rect.width / rect.height;

  // Limit width and height resolution to MAX_HEIGHT and MAX_WIDTH,
  // while at the same time maintaining the w:h ratio.

  width = Math.min(MAX_WIDTH, width);
  height = Math.min(MAX_HEIGHT, width / widthToHeightRatio) * resolution / 100;
  width = Math.round(height * widthToHeightRatio);
  height = Math.round(height);

  canvas.width = width;
  canvas.height = height;

  camera.aspect = width / height;

  let gl = renderer.gl
  gl.viewport(0, 0, width, height);
}



function adjustResolution(event) {
  let slider = event.target
  resolution = Math.min(100, Math.max(1, slider.value))
  updateSliderDisplay(slider, resolution + '%')
  adjustViewport()
}



function toggleMenu() {
  let wrapperDOM = document.getElementById('menu-toggler-wrapper');
  let menuTogglerButtonText = document.querySelector('#menu-toggler-button > .button-text');
  if (!isMenuShown) {
    wrapperDOM.className = 'show-menu';
    menuTogglerButtonText.innerText = 'Tutup';
  } else {
    wrapperDOM.className = 'hide-menu';
    menuTogglerButtonText.innerText = 'Buka Menu';
  }
  isMenuShown = !isMenuShown;
}



/**
 * List all sliders in the document and for each slider,
 * see if the slider is in the animation dictionary and is actually
 * defined in the app objects.
 */

function listCustomSliders() {
  let listName = []

  document.querySelectorAll('input[type="range"]')
    .forEach(elem => {
      const sliderName = elem.getAttribute('name')
      const data = parsePropertyString(sliderName)

      if (!data) {
        return
      }

      const {
        modelName,
        propertyName,
        axisId
      } = data

      if (!app.objects.hasOwnProperty(modelName)) {
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

function attachListenerOnAnimationUpdate() {
  // Throttle update animation slider so that it gets called
  // at most 25 fps.
  sliderList = listCustomSliders()
  throttledSliderHandler = throttle(matchSlidersToAnimation, 50)
  animationManager.addListener('animationupdate', throttledSliderHandler)
}

function matchSlidersToAnimation() {
  sliderList.forEach(({
    sliderName,
    modelName,
    propertyName,
    axisId
  }) => {
    let animationValue = app.objects[modelName][propertyName].get()[axisId]
    animationValue = Math.round(animationValue * 100) / 100
    updateSliderValueAndDisplay(sliderName, animationValue)
  })
}


let light

function createCubeLight() {
  window.sun = new DirectionalLight()
  sun.name = app.getNextUniqueName('sun')
  sun.position.set(-1.4, -1.65, 1.45)
  sun.scale.set(0.6)

  sun.intensity = 0.3

  // Make it tilt
  sun.rotation.setX(50.0)
  
  scene.add(sun)
  app.addObject(sun)
  
  
  window.lamp = new PointLight()
  lamp.name = app.getNextUniqueName('lamp')
  lamp.position.set(1.0, -1.0, 2.0)
  lamp.scale.set(0.2, 0.2, 0.2)

  scene.add(lamp)
  app.addObject(lamp)
  
  window.mushroomLight = new SpotLight()
  mushroomLight.name = app.getNextUniqueName('mushroom-light')
  mushroomLight.scale.set(0.2, 0.2, 0.2)
  mushroomLight.direction = [0.0, 0.0, -1.0, 1.0]

  // If there's a cone object, attach this light to it. Otherwise, just use the scene.
  ;(app.objects['Cone'] || scene).add(mushroomLight)
  app.addObject(mushroomLight)

  light = window.sun
}



function toggleLight() {
  const lightBtn = document.getElementById('btn-toggle-light');
  if (lightIsOn) {
    lightIsOn = false;

    lamp.tempIntensity = lamp.intensity;
    mushroomLight.tempIntensity = mushroomLight.intensity;
    sun.tempIntensity = sun.intensity;

    lamp.intensity = 0;
    sun.intensity = 0;
    mushroomLight.intensity = 0;

    lightBtn.innerText = 'Hidupkan Cahaya';
    lightBtn.classList.remove('btn-danger');
    lightBtn.classList.add('btn-primary');
  } else {
    lightIsOn = true;

    console.log(lamp.tempIntensity, mushroomLight.tempIntensity, sun.tempIntensity)
    
    lamp.intensity = lamp.tempIntensity || 1.0;
    mushroomLight.intensity = mushroomLight.tempIntensity || 1.0;
    sun.intensity = sun.tempIntensity || 1.0;

    lightBtn.innerText = 'Matikan Cahaya';
    lightBtn.classList.remove('btn-primary');
    lightBtn.classList.add('btn-danger');
  }
}

function initMaterialsFromBlender() {

  // materials_definition is a variable that holds all materials data

  materials_definition.forEach(materialData => {

    let name = materialData.name
    let isImage = !!materialData.image

    let phongData = {
      ambient: materialData.ambient,
      diffuse: materialData.diffuse,
      specular: materialData.specular,
      shininess: materialData.shininess
    }

    let material

    // No need to load image explicitly
    // It will be loaded once render is triggered ;)

    if (isImage) {
      material = new ImageTextureMaterial(name, phongData, materialData.image)
    } else {
      material = new PhongMaterial(name, phongData)
    }

    app.addMaterial(material)
  })
}



function initObjectsDataFromBlender() {

  // objects_info holds object pos, rot, scale, material name, and parent object name
  // objects_vertices holds vertices, indices, and uv texture coordinates info

  let objectNames = Object.keys(objects_info)

  // Set object transform data & material first

  objectNames.forEach(objectName => {

    let data = objects_info[objectName]

    let object = new Object3D({
      name: objectName,
      origin: data.origin,
      position: data.position,
      rotation: data.rotation,
      scale: data.scale,
      matrixParentInverse: data.matrix_parent_inverse
    })

    app.addObject(object)

    let materialName = data.material_name
    let material = app.materials[materialName]
    object.setMaterial(material)

  })

  // Then, set object hierarchy.

  let scene = app.scene

  objectNames.forEach(objectName => {
    let data = objects_info[objectName]
    let object = app.objects[objectName]

    let parentName = data.parent
    let parentExists = !!parentName
    let parentObject

    if (parentExists) {
      parentObject = app.objects[parentName]
    } else {
      parentObject = scene
    }

    parentObject.add(object)
  })

  // Finally, set the object geometry. Geometry name in the `objects_vertices`
  // is the same as in `objects_info`

  objectNames.forEach(objectName => {
    const geometryName = objectName in objects_vertices ? objectName : objects_info[objectName].vertices
    const geometryDefinition = objects_vertices[geometryName]
    const vertices = geometryDefinition.vertices
    const indices = geometryDefinition.indices
    const uvCoordinates = geometryDefinition.uv_coordinates
    const normals = geometryDefinition.normals

    // Ignore init complex geometry, just so you can debug
    // the whole code using scene with simple and few objects

    // if (vertices.length > 100) {
    //   return
    // }

    const geometry = new Geometry({
      vertices, indices, uvCoordinates, normals
    }, true, false)
    const wireframeGeometry = new Geometry({
      vertices, indices, uvCoordinates, normals
    }, true, true)

    const object = app.objects[objectName]
    object.setGeometry(geometry)
    object.setWireframeGeometry(wireframeGeometry)
  })

}

function toggleWireframeAndShadingMode() {
  app.wireframeMode = !app.wireframeMode
  const dom = document.querySelector('#toggle-wireframe-button');
  dom.innerText = app.wireframeMode ? 'Ubah ke Mode Shading' : 'Ubah ke Mode Wireframe';
  dom.className = "btn btn-" + (app.wireframeMode ? 'primary' : 'danger');
}

function toggleSelectedObjectVisibility() {
  if (!app) return
  const { selectedObject } = app
  if (!selectedObject) return
  
  const dom = document.querySelector('#toggle-selected-object-visibility-button')
  selectedObject.visible = !selectedObject.visible
  const { visible } = selectedObject
  dom.innerText = visible ? 'Hide' : 'Show'
  dom.className = `btn ${visible ? 'btn-danger' : 'btn-primary'}`
}

function switchToThirdPersonViewingMode() {
  if (camera.isFirstPersonView)
    camera.switchToThirdPersonView();
}

window.addEventListener('load', async function init() {

  // Set up scene, camera, and renderer

  canvas = document.getElementById('gl-canvas')
  renderer = new Renderer(canvas)

  await new Promise(res => {
    renderer.addListener('initialized', res)
  })

  scene = new Scene()
  app = new App({ scene, renderer })

  camera = new PerspectiveCamera({
    near: 0.05,
    far: 200.0,
    fovy: 55.0,
    aspect: 1.0,
  })

  // Update camera setup

  initCameraPosition()
  updateCameraView()

  initMaterialsFromBlender()
  initObjectsDataFromBlender()

  createCubeLight()

  let USE_ANIMATION = typeof animations_definition !== 'undefined'

  if (USE_ANIMATION) {
    animationManager = new AnimationManager({
      app,
      speed: 0.5,
      maxFrameNumber: 120
    })
    animationManager.initFromConfig(animations_definition)

  }

  // Attach event listener handles

  canvas.parentElement.addEventListener('keydown', handleKeyDown)
  canvas.parentElement.addEventListener('keyup', handleKeyUp)
  window.addEventListener('resize', adjustViewport)

  document.querySelector('#menu-toggler-button').addEventListener('click', toggleMenu)
  document.querySelector('input[name="resolution"]').addEventListener('input', adjustResolution)
  document.querySelector('#btn-animate').addEventListener('click', toggleAnimation)
  document.querySelector('#btn-toggle-light').addEventListener('click', toggleLight)

  connectSlidersToModelData()
  connectLightIntensitySliders()
  connectLightColorPicker()

  if (USE_ANIMATION) {
    connectSpeedSlider()
    attachListenerOnAnimationUpdate()
  }

  if (typeof SelectObjectFromTree !== 'undefined') {
    selectedObjectFromTree = new SelectObjectFromTree()
  }

  if (typeof NavigableCameraUtils !== 'undefined') {
    navigableCamera = new NavigableCamera()
  }

  if (typeof ObjectPicking !== 'undefined') {
    objectPicking = new ObjectPicking()
  }

  // Set focus to canvas from the start
  canvas.focus()

  adjustViewport()
  render()
})

async function render(currentFrame) {
  const gl = renderer.gl
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
  
  if (app.selectedObject) {
    app.selectedObject.updateWorldMatrix()
  }

  navigableCamera.update(currentFrame)
  objectPicking.update()
  await renderer.render(scene, camera, app)
  
  // Switch between render every 1 seconds (for debugging purposes)
  // and continuously
  // setTimeout(() => window.requestAnimationFrame(render), 100)
  window.requestAnimationFrame(render)
}