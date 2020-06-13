// These Javascript functions are made special for handling selecting objects from node tree.

class SelectObjectFromTree {

  constructor() {
    this.isMatchingSelectedPropertyToSlider = false

    this.displayTree()
    this.connectSelectedObjectSlider()

    this.updateSliderOnObjectSelected = () => {}
    this.updateSelectedProperty = () => {}

    const self = this

    if (typeof animationManager !== 'undefined') {
      animationManager.addListener('animationupdate', () => {self.updateSliderOnObjectSelected()})
    }

    app.addListener('update-selection', (newSelection, oldSelection) => {
      self.replaceSelectionWithoutUpdatingToApp(newSelection, oldSelection)
    })

    this.initThrottleUpdateSlider()
    this.initThrottleUpdateSelectedProperty()
  }


  initThrottleUpdateSelectedProperty() {
    this.updateSelectedProperty = throttle(
      function (propertyName, axisId, value) {
        if (this.isMatchingSelectedPropertyToSlider) {
          return
        }

        let selectedObject = app.selectedObject
        if (!selectedObject) {
          return
        }

        selectedObject[propertyName].setOnAxisId(axisId, value)
      }, 25)
  }


  initThrottleUpdateSlider() {
    this.updateSliderOnObjectSelected = throttle(function () {
      let selectedObject = app.selectedObject

      if (!selectedObject) {
        return
      }

      this.isMatchingSelectedPropertyToSlider = true

      let axis = ['x', 'y', 'z']
      let properties = ['position', 'rotation', 'scale']

      properties.forEach(propertyName => {
        let propertyData = selectedObject[propertyName].get()

        axis.forEach((axisName, index) => {
          let axisId = index
          let sliderName = `selected-object-${propertyName}-${axisName}`
          let value = propertyData[axisId]
          value = Math.round(value * 100) / 100

          updateSliderValueAndDisplay(sliderName, value)
        })
      })

      this.isMatchingSelectedPropertyToSlider = false
    }, 100)
  }


  select(modelName) {
    let newSelectedElement = document.querySelector(`li[data-model-name="${modelName}"]`)
    if (newSelectedElement) {
      newSelectedElement.classList.add('selected')
      app.selectedObjectName = modelName
      this.updateSliderOnObjectSelected()
    }
  }

  deselect(modelName) {
    let selectedElement = document.querySelector(`li[data-model-name="${modelName}"]`)

    if (selectedElement) {
      selectedElement.classList.remove('selected')
    }
  }


  replaceSelection(newSelection) {
    let currentSelection = app.selectedObjectName

    if (newSelection === currentSelection) {
      this.deselect(currentSelection)
      app.selectedObjectName = ''

    } else {
      this.select(newSelection)
    }
    this.updateSelectionView()
  }


  replaceSelectionWithoutUpdatingToApp(newSelection, oldSelection) {
    this.deselect(oldSelection)
    
    let newSelectedElement = document.querySelector(`li[data-model-name="${newSelection}"]`)
    if (newSelectedElement) {
      this.deselect(oldSelection)
      newSelectedElement.classList.add('selected')
      this.updateSliderOnObjectSelected()
    }

    this.updateSelectionView()
  }

  updateSelectionView() {
    let selectedContainer = document.querySelector('#selected-section')
    let object = app.selectedObject
    if (!object) {
      selectedContainer.classList.add('no-selection')
    } else {
      selectedContainer.classList.remove('no-selection')
    }
    this.displaySelectionHierarchyText()
  }

  displaySelectionHierarchyText() {

    let hierarchyElem = document.querySelector('#selobj-hierarchy')
    let child = hierarchyElem.lastElementChild

    while (child) {
      hierarchyElem.removeChild(child)
      child = hierarchyElem.lastElementChild
    }

    let selectedObject = app.selectedObject
    if (!selectedObject) {
      return
    }

    let parentNameList = selectedObject.parentNameList

    // Reverse parent name list
    let count = parentNameList.length
    parentNameList = parentNameList.map((_, i) => parentNameList[count - i - 1])
    let hierarchyList = [...parentNameList, app.selectedObjectName]

    hierarchyList.forEach(objectName => {
      let childElem = document.createElement('span')
      childElem.innerHTML = objectName
      hierarchyElem.appendChild(childElem)
    })
  }

  displayTree() {

    // Delete all existing root children
    // WARNING: THIS HAS NOT BEEN CHECKED FOR MEMORY LEAK

    let rootListHTMLNode = document.querySelector('#tree > ul')
    let childCount = rootListHTMLNode.childElementCount

    for (let i = 0; i < childCount; i++) {
      rootListHTMLNode.removeChild(rootListHTMLNode.children[0])
    }

    const self = this

    function createHTMLNodeFromObject(object) {
      let nodeElement = document.createElement('li')
      let name = object.name
      nodeElement.dataset['modelName'] = name

      let collapsedCheckElement = document.createElement('input')
      collapsedCheckElement.type = 'checkbox'
      collapsedCheckElement.checked = false
      nodeElement.appendChild(collapsedCheckElement)

      let displayElement = document.createElement('div')
      displayElement.classList.add('obj-name')

      let spanElement = document.createElement('span')
      spanElement.innerText = name

      const actionButtonsElement = document.createElement('div')
      actionButtonsElement.className = 'obj-action-buttons'

      const toggleVisibilityElement = document.createElement('img')
      toggleVisibilityElement.src = 'resources/images/visibility-show.svg'
      toggleVisibilityElement.onclick = function () {
        object.visible = !object.visible
        if (object.visible) {
          toggleVisibilityElement.src = 'resources/images/visibility-show.svg'
        } else {
          toggleVisibilityElement.src = 'resources/images/visibility-hide.svg'
        }
      }

      actionButtonsElement.appendChild(toggleVisibilityElement)
      displayElement.appendChild(spanElement)
      displayElement.appendChild(actionButtonsElement)

      nodeElement.appendChild(displayElement);

      [collapsedCheckElement, displayElement].forEach(element => {
        element.addEventListener('contextmenu', event => {
          event.preventDefault()
          self.replaceSelection(name)
        })
      })

      if (object.children && object.children.length > 0) {
        let childListElement = document.createElement('ul')
        childListElement.classList.add('collapsed')
        nodeElement.appendChild(childListElement)

        let collapseSignElement = document.createElement('div')
        collapseSignElement.classList.add('collapsed-sign')
        childListElement.appendChild(collapseSignElement)

        object.children.forEach(children => {
          let childrenNode = createHTMLNodeFromObject(children)
          childListElement.appendChild(childrenNode)
        })

      }
      return nodeElement
    }

    scene.children.forEach(child => {
      let HTMLNode = createHTMLNodeFromObject(child)
      rootListHTMLNode.appendChild(HTMLNode)
    })
  }

  connectSelectedObjectSlider() {
    const self = this

    let axis = ['x', 'y', 'z']
    let properties = ['position', 'rotation', 'scale']

    properties.forEach(propertyName => {
      axis.forEach((axisName, index) => {

        let axisId = index
        let sliderName = `selected-object-${propertyName}-${axisName}`

        let elem = document.querySelector(`input[name="${sliderName}"]`)
        let slider = RSlider.get(elem)
        if (!slider) {
          slider = new RSlider(elem, {})
        }

        slider.on('change',
          () => {
            if (app.selectedObject) {
              let value = parseFloat(slider.value)
              self.updateSelectedProperty(propertyName, axisId, value)
            }
          })

      })
    })

  }
}