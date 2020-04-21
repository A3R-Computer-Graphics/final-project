// These Javascript functions are made special for handling selecting objects from node tree.

function initObjectSelectionMechanism() {
  displayTree()
  connectSelectedObjectSlider()
  updateSliderOnObjectSelected()
  
  animationManager.addListener('animationupdate', updateSliderOnObjectSelected)
}

let isMatchingSelectedPropertyToSlider = false

function deselect(modelName) {
  let selectedElement = document.querySelector(`li[data-model-name="${modelName}"]`)
  if (selectedElement) {
    selectedElement.classList.remove('selected')
  }
}

function replaceSelection(newSelection) {
  let currentSelection = sceneGraph.selectedNodeName
  if (newSelection === currentSelection) {
    deselect(currentSelection)
    sceneGraph.selectedNodeName = ''
  } else {
    let newSelectedElement = document.querySelector(`li[data-model-name="${newSelection}"]`)
    if (newSelectedElement) {
      deselect(currentSelection)
      newSelectedElement.classList.add('selected')
      sceneGraph.selectedNodeName = newSelection
      updateSliderOnObjectSelected()
    }
  }
  displaySelectionHierarchyText()
}

function displaySelectionHierarchyText() {

  let hierarchyElem = document.querySelector('#selobj-hierarchy')
  let child = hierarchyElem.lastElementChild

  while (child) {
    hierarchyElem.removeChild(child)
    child = hierarchyElem.lastElementChild
  }

  let selectionModelName = sceneGraph.selectedNodeName
  let selectionNode = sceneGraph.nodes[selectionModelName]

  if (!selectionNode) {
    return
  }

  let parentNameList = selectionNode.parentNameList
  let hierarchyList = [...parentNameList, selectionModelName]

  hierarchyList.forEach(modelName => {
    let childElem = document.createElement('span')
    childElem.innerHTML = modelName
    hierarchyElem.appendChild(childElem)
  })
}

function displayTree() {
  function createHTMLNode(node) {
    let nodeElement = document.createElement('li')
    let modelName = node.model.name
    nodeElement.dataset['modelName'] = modelName

    let collapsedCheckElement = document.createElement('input')
    collapsedCheckElement.type = 'checkbox'
    collapsedCheckElement.checked = false
    nodeElement.appendChild(collapsedCheckElement)

    let displayElement = document.createElement('div')
    displayElement.classList.add('obj-name')
    displayElement.innerText = node.key
    nodeElement.appendChild(displayElement);

    [collapsedCheckElement, displayElement].forEach(element => {
      element.addEventListener('contextmenu', event => {
        event.preventDefault()
        replaceSelection(modelName)
      })
    })

    if (node.children && node.children.length > 0) {
      let childListElement = document.createElement('ul')
      childListElement.classList.add('collapsed')
      nodeElement.appendChild(childListElement)

      let collapseSignElement = document.createElement('div')
      collapseSignElement.classList.add('collapsed-sign')
      childListElement.appendChild(collapseSignElement)

      node.children.forEach(children => {
        let childrenNode = createHTMLNode(children)
        childListElement.appendChild(childrenNode)
      })

    }
    return nodeElement
  }

  let rootListHTMLNode = document.querySelector('#tree > ul')
  sceneGraph.rootNodes.forEach(node => {
    let HTMLNode = createHTMLNode(node)
    rootListHTMLNode.appendChild(HTMLNode)
  })
}

let updateSelectedProperty = throttle(
  function (propertyName, axisId, value) {
    if (isMatchingSelectedPropertyToSlider) {
      return
    }
    let node = sceneGraph.nodes[sceneGraph.selectedNodeName]
    if (!node) {
      return
    }
    node.model[propertyName][axisId] = value
    node.updateTransformations()
  }, 50)

function connectSelectedObjectSlider() {
  let axis = ['x', 'y', 'z']
  let properties = ['location', 'rotation', 'scale']

  properties.forEach(propertyName => {
    axis.forEach((axisName, index) => {

      let axisId = index
      let sliderName = `selected-object-${propertyName}-${axisName}`

      let sliderElement = document.querySelector(`input[name="${sliderName}"]`)
      let displayElement = sliderElement.parentElement.querySelector('.slider-value')

      sliderElement.addEventListener('input',
        event => {
          if (sceneGraph.selectedNodeName) {
            let value = event.target.value
            updateSelectedProperty(propertyName, axisId, parseFloat(value))
            displayElement.innerText = Math.round(value * 100) / 100
          }
        })

    })
  })

}

let updateSliderOnObjectSelected = throttle(function () {
  let selectedNode = sceneGraph.nodes[sceneGraph.selectedNodeName]

  if (!selectedNode) {
    return
  }

  isMatchingSelectedPropertyToSlider = true

  let axis = ['x', 'y', 'z']
  let properties = ['location', 'rotation', 'scale']

  let selectedModel = selectedNode.model

  properties.forEach(propertyName => {
    axis.forEach((axisName, index) => {
      let axisId = index
      let sliderName = `selected-object-${propertyName}-${axisName}`
      let slider = document.querySelector(`input[name="${sliderName}"]`)
      if (slider) {
        let value = Math.round(selectedModel[propertyName][axisId] * 100) / 100
        slider.value = value
        slider.parentElement.querySelector('.slider-value').innerText = value
      }
    })
  })

  isMatchingSelectedPropertyToSlider = false
}, 100)