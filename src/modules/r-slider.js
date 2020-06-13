const RSliderUtil = {
  getNonNull() {
    for (let i = 0; i < arguments.length; i++) {
      if (arguments[i] !== undefined && arguments[i] !== null) {
        return arguments[i]
      }
    }
    return undefined
  },
  getFiniteOrOriginal(numVal) {
    if (isFinite(parseFloat(numVal))) {
      return parseFloat(numVal)
    }
    return numVal
  }
}

class RSlider extends EventDispatcher {

  static instances = []

  /** Get RSlider instance from its id or query string. */

  static get(id) {
    if (typeof id === 'number') {
      id = parseInt(id)
      if (isFinite(id)) {
        return this.instances[id]
      }
      return
    }

    if (typeof id === 'string') {
      let selector = id
      let elem = document.querySelector(selector)
      if (!elem) return
      id = parseInt(elem.getAttribute('data-r-slider-id'))
      if (isFinite(id)) {
        return this.instances[id]
      }
      return
    }

    let object = id
    if (object instanceof HTMLDivElement) {
      id = parseInt(object.getAttribute('data-r-slider-id'))
      if (isFinite(id)) {
        return this.instances[id]
      }
      return
    }

    let elem = this.instances.indexOf(object)
    if (elem >= 0) {
      return elem
    }
  }

  constructor(elem, config, displayFunction) {
    let value = undefined, min = undefined, max = undefined, step = undefined
    config = config || {}
    
    if (elem === undefined || elem === null) {
      throw "No element supplied"
    } else if (typeof elem === 'string') {
      elem = document.querySelector(elem)
      if (!elem) {
        throw "No element found"
      }
    } else if (elem instanceof HTMLInputElement) {
      let ALLOWED_TYPES = ['range', 'number']
      if (ALLOWED_TYPES.indexOf(elem.type) < 0) {
        throw "Input must be a range or number"
      }
    } else {
      throw "Element must be a string or HTMLInputElement"
    }

    super()

    let instances = this.constructor.instances
    instances.push(this)
    this.id = instances.length - 1

    const getNormalizedValue = function() {
      let val = RSliderUtil.getNonNull.apply(RSliderUtil, arguments)
      return RSliderUtil.getFiniteOrOriginal(val)
    }

    this.max = getNormalizedValue(config.max, elem.max)
    this.min = getNormalizedValue(config.min, elem.min)
    this.step = getNormalizedValue(config.step, elem.step)
    this.value = getNormalizedValue(config.value, elem.value)
    this.clamp = RSliderUtil.getNonNull(config.clamp, elem.getAttribute('data-clamp'), false)
    
    if (typeof displayFunction !== 'undefined') {
      this.displayFunction = displayFunction
    } else {
      this.displayFunction = (val) => parseInt(val * 100) / 100
    }

    this.elements = {}

    let html = `
    <div class="r-slider-progress"></div>
    <input type="text">
    <div class="r-slider-obstructor"></div>
    <button class="r-slider-prev"><i class="fas fa-angle-left"></i></button>
    <button class="r-slider-next"><i class="fas fa-angle-right"></i></button>`

    let container = document.createElement('div')
    container.innerHTML = html
    container.className = 'r-slider-container'
    container.setAttribute('data-r-slider-id', this.id)

    let input = container.querySelector('input')
    let progress = container.querySelector('.r-slider-progress')
    let obstructor = container.querySelector('.r-slider-obstructor')

    let next = container.querySelector('.r-slider-next')
    let prev = container.querySelector('.r-slider-prev')

    elem.parentElement.replaceChild(container, elem)

    this.elements = {
      container: container,
      input: input,
      progress: progress,
      obstructor: obstructor,
      next: next,
      prev: prev
    }

    if (value === undefined) {
      this.value = elem.value
    }

    if (this.value !== undefined) {
      this.elements.input.value = this.value
    }

    this.clicking = false
    this.grabbing = false
    this.editingText = false

    this.name = elem.name || config.name

    if (this.name) {
      this.elements.container.setAttribute('data-name', this.name)
    }


    let disabled = elem.getAttribute('disabled')
    if (disabled !== null && disabled !== undefined) {
      this.disable()
    }

    this.updateDisplay()
    this.initListeners()
  }

  onMouseDown(event) {
    this.clicking = true
  }

  onDocumentMouseMove(event, xInit, valueInit, width) {
    if (!this.grabbing) {
      this.grabbing = true
    }

    event.preventDefault()
    this.clearSelection()

    let shiftPressed = event.shiftKey
    let ctrlPressed = event.ctrlKey

    let range = (this.max || 0) - (this.min || 0)

    let percentage = (event.screenX - xInit) / width * range
    if (ctrlPressed) {
      percentage *= 10
    } else if (shiftPressed) {
      percentage /= 10
    }
    this.value = valueInit + percentage
    this.updateDisplay()
  }

  // Clear selection
  // Taken from: https://stackoverflow.com/a/3169849/10159381

  clearSelection() {
    if (window.getSelection) {
      if (window.getSelection().empty) {
        window.getSelection().empty()
      } else if (window.getSelection().removeAllRanges) {
        window.getSelection().removeAllRanges()
      }
    } else if (document.selection) {
      document.selection.empty()
    }
  }

  onDocumentMouseUp(event) {
    if (!this.clicking) {
      return
    }

    event.preventDefault()
    this.clicking = false
    this.grabbing = false
    this.elements.container.classList.remove('grabbing')
    document.body.style.removeProperty('cursor')

    const self = this

    window.requestAnimationFrame(() => {
      self.elements.input.blur()
      self.elements.container.focus()
      self.clearSelection()
    })
  }

  initListeners() {
    const self = this

    const handlers = {}
    const initState = {
      x: 0,
      y: 0,
      valueInit: this.value,
      width: 0,
    }

    handlers.documentMouseMove = e => self.onDocumentMouseMove(e, initState.x, initState.valueInit, initState.width)
    handlers.documentMouseUp = e => {
      self.onDocumentMouseUp(e)
      document.removeEventListener('mousemove', handlers.documentMouseMove)
      document.removeEventListener('mouseup', handlers.documentMouseUp)
    }

    let {obstructor, container, input, prev, next} = this.elements

    obstructor.addEventListener('mousedown', function (e) {

      if (self.disabled) {
        return
      }
      
      initState.x = e.screenX
      initState.y = e.screenY
      initState.width = container.clientWidth
      initState.valueInit = parseFloat(self.value) || 0
      self.onMouseDown(e)
    })

    container.addEventListener('mousemove', function (e) {
      if (!self.clicking || self.grabbing || self.editingText) {
        return
      }
      const movingX = Math.abs(initState.x - e.screenX) > 10
      const movingY = Math.abs(initState.y - e.screenY) > 10

      if (!movingX && !movingY) {
        return
      }

      document.addEventListener('mousemove', handlers.documentMouseMove)
      document.addEventListener('mouseup', handlers.documentMouseUp)
      self.grabbing = true
      self.elements.container.classList.add('grabbing')
      document.body.style.setProperty('cursor', 'w-resize', 'important')
    })

    container.addEventListener('mouseup', function (e) {
      if (self.clicking) {
        if (!self.grabbing && !self.editingText) {
          self.editingText = true
          self.elements.obstructor.hidden = true
          self.elements.input.focus()
        }
      }
    })

    input.addEventListener('blur', function (e) {
      self.clicking = false
      self.grabbing = false
      self.editingText = false
      self.elements.obstructor.hidden = false
    })

    input.addEventListener('change', function (e) {
      self.value = e.target.value
      self.updateDisplay()
    })

    prev.addEventListener('click', function() {
      self.value -= (self.step || 0.1)
      self.updateDisplay()
    })

    next.addEventListener('click', function() {
      self.value += (self.step || 0.1)
      self.updateDisplay()
    })
  }

  limitValue() {
    if (this.clamp) {
      let minExists = isFinite(this.min)
      let maxExists = isFinite(this.max)

      if (minExists) {
        this.value = Math.max(this.min, this.value)
      }
      if (maxExists) {
        this.value = Math.min(this.max, this.value)
      }
    }
  }

  updateDisplay() {

    this.limitValue()

    let min = this.min || 0
    let max = this.max || 1
    let val = this.value || 0

    if (isFinite(this.value)) {
      this.elements.input.value = this.displayFunction(this.value)
    }

    this.dispatchEvent('change', this.value)

    let progress = (val - min) / (max - min)
    progress = Math.max(Math.min(progress, 1), 0)
    progress *= 100

    this.elements.progress.style.width = progress + '%'
  }

  on() {
    this.addListener.apply(this, arguments)
  }

  off() {
    this.removeListener.apply(this, arguments)
  }

  /* Set value without triggering change event */

  setValue(val) {
    
    this.value = val
    this.limitValue()

    let min = this.min || 0
    let max = this.max || 1
    val = this.value || 0

    if (this.value) {
      this.elements.input.value = this.displayFunction(this.value)
    }

    let progress = (val - min) / (max - min)
    progress = Math.max(Math.min(progress, 1), 0)
    progress *= 100

    this.elements.progress.style.width = progress + '%'

  }

  disable() {
    const {input, container} = this.elements
    container.setAttribute('data-disabled', '')
    input.setAttribute('disabled', '')
  }

  enable() {
    const {input, container} = this.elements
    container.removeAttribute('data-disabled')
    input.removeAttribute('disabled')
  }

  get disabled() {
    return this.elements.input.getAttribute('disabled') !== null
  }
}