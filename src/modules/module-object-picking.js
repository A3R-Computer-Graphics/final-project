class ObjectPicking {

  constructor() {

    const self = this
    this.requestForObjectPicking = false
    this.mouseX = 0
    this.mouseY = 0
    
    let scrollDetector = $('#scroll-detector > *')
    scrollDetector.on('contextmenu', function(event) {
      const RIGHT_CLICK_EVENT = 3
      if (event.which === RIGHT_CLICK_EVENT) {
        // Explicitly using global variables for simplicity
        const rect = canvas.getBoundingClientRect()
        self.mouseX = event.clientX - rect.left
        self.mouseY = event.clientY - rect.top
        self.requestForObjectPicking = true
        return false
      }
    })

    this.startTime = Date.now()
    this.TIMEOUT = 100
  }

  update() {
    if (this.requestForObjectPicking && Date.now() - this.startTime > this.TIMEOUT) {
      this.startTime = Date.now()
      let clickedObjectName = renderer.renderPicking(scene, camera, this.mouseX, this.mouseY)
      
      const oldSelectedTreeElement = document.querySelector(`li[data-model-name="${app.selectedObjectName}"]`)
      if (clickedObjectName === app.selectedObjectName) {
        // deselect
        app.selectedObjectName = ''
      } else {
        app.selectedObjectName = clickedObjectName
      }
      const newSelectedTreeElement = document.querySelector(`li[data-model-name="${app.selectedObjectName}"]`)

      if (oldSelectedTreeElement) oldSelectedTreeElement.classList.remove('selected')
      if (newSelectedTreeElement) newSelectedTreeElement.classList.add('selected')

      this.requestForObjectPicking = false
    }
  }
}