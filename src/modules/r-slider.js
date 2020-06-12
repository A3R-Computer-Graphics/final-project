class RSlider extends EventDispatcher {

  constructor(elem, config) {
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

    this.max = config.max !== undefined ? config.max : elem.max
    this.min = config.min !== undefined ? config.min : elem.min
    this.step = config.step !== undefined ? config.step : elem.step
    this.value = config.value !== undefined ? config.value : elem.value
    this.clamp = config.clamp !== undefined ? config.clamp : false

    this.displayFunction = (val) => parseInt(val * 100) / 100

    this.containerElement = document.createElement('div')
    this.containerElement.className = 'r-slider-container'

    this.inputElement = document.createElement('input')
    this.inputElement.type = 'number'

    this.progressElement = document.createElement('div')
    this.progressElement.className = 'r-slider-progress'

    this.obstructorElement = document.createElement('div')
    this.obstructorElement.style.width = '100%'
    this.obstructorElement.style.cursor = 'w-resize'

    this.containerElement.appendChild(this.progressElement)
    this.containerElement.appendChild(this.inputElement)
    this.containerElement.appendChild(this.obstructorElement)

    elem.parentElement.replaceChild(this.containerElement, elem)

    if (value === undefined) {
      this.value = elem.value
    }

    if (this.value !== undefined) {
      // this.displayElement.innerText = this.value
      this.inputElement.value = this.value
    }

    this.clicking = false
    this.grabbing = false
    this.editingText = false

    this.name = elem.name || config.name

    if (this.name) {
      this.containerElement.setAttribute('data-name', this.name)
    }
    this.updateDisplay()
    this.initListeners()
  }

  onMouseDown(event) {
    this.clicking = true
    console.log('mousedown')
  }

  onDocumentMouseMove(event, xInit, valueInit, width) {
    if (!this.grabbing) {
      this.grabbing = true
    }

    event.preventDefault()

    // Clear selection
    // Taken from: https://stackoverflow.com/a/3169849/10159381


    if (window.getSelection) {
      if (window.getSelection().empty) {
        window.getSelection().empty()
      } else if (window.getSelection().removeAllRanges) {
        window.getSelection().removeAllRanges()
      }
    } else if (document.selection) {
      document.selection.empty()
    }

    let range = this.max || 0 - this.min || 0

    let percentage = (event.screenX - xInit) / width * range
    this.value = valueInit + percentage
    this.updateDisplay()
  }

  clearSelection() {
    if (window.getSelection) {
      if (window.getSelection().empty) {
        console.log('not empty')
        window.getSelection().empty()
      } else if (window.getSelection().removeAllRanges) {
        window.getSelection().removeAllRanges()
      } else {

        console.log('is empty')
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
    this.containerElement.classList.remove('grabbing')

    const self = this

    window.requestAnimationFrame(() => {
      self.inputElement.blur()
      self.containerElement.focus()
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

    this.containerElement.addEventListener('mousedown', function (e) {
      initState.x = e.screenX
      initState.y = e.screenY
      initState.width = self.containerElement.clientWidth
      initState.valueInit = parseFloat(self.value) || 0
      self.onMouseDown(e)
    })

    this.containerElement.addEventListener('mousemove', function (e) {
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
      self.containerElement.classList.add('grabbing')
    })

    this.containerElement.addEventListener('mouseup', function (e) {
      if (self.clicking) {
        if (!self.grabbing && !self.editingText) {
          self.editingText = true
          self.obstructorElement.hidden = true
          self.inputElement.focus()
        } else {
          console.log('yes.')
        }
      }
    })

    this.inputElement.addEventListener('blur', function (e) {
      self.clicking = false
      self.grabbing = false
      self.editingText = false
      self.obstructorElement.hidden = false
    })

    this.inputElement.addEventListener('change', function (e) {
      self.value = e.target.value
      self.updateDisplay()
    })
  }

  limitValue() {
    if (this.clamp) {
      if (isFinite(this.min) && isFinite(this.max) && isFinite(this.value)) {
        this.value = Math.min(this.max, Math.max(this.min, this.value))
      }
    }
  }

  updateDisplay() {

    this.limitValue()

    let min = this.min || 0
    let max = this.max || 1
    let val = this.value || 0

    if (this.value) {
      this.inputElement.value = this.displayFunction(this.value)
    }

    let progress = (val - min) / (max - min)
    progress = Math.max(Math.min(progress, 1), 0)
    progress *= 100

    this.progressElement.style.width = progress + '%'
  }

  on() {
    this.addListener.apply(this, arguments)
  }

  off() {
    this.removeListener.apply(this, arguments)
  }
}