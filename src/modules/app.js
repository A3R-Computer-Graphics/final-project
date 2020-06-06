class App {
    constructor({ scene, renderer, animationManager }) {
        this.scene = scene
        this.renderer = renderer
        this.animationManager = animationManager

        this.objects = {}
        this.selectedObjectName = ''

        this.materials = {}
        this.isFirstPersonView = false
        this.currentFirstPersonViewObject = null
        this.lastThirdPersonViewInformation = {
            at: null,
            position: null,
        }
    }

    addObject(object) {
        this.objects[object.name] = object
    }

    addMaterial(material) {
        this.materials[material.name] = material
    }

    get selectedObject() {
        return this.objects[this.selectedObjectName]
    }

    getNextUniqueName(name) {
        return ModuleUtil.getNextUniqueNameFromDict(name, this.objects)
    }

    switchToFirstPersonView(oldAt, oldPosition) {
        if (!this.isFirstPersonView) {
            this.lastThirdPersonViewInformation.position = oldPosition
            this.lastThirdPersonViewInformation.at = oldAt
        }

        this.isFirstPersonView = true
        this.currentFirstPersonViewObject = this.selectedObject
    }

    switchBackToThirdPersonView() {
        const { position, at: lastAt } = this.lastThirdPersonViewInformation
        camera.position.set(position)
        camera.lookAt(lastAt)

        at = lastAt
        this.isFirstPersonView = false
        this.currentFirstPersonViewObject = null
        return
    }

    get shouldSwitchBackToThirdPersonView() {
        return this.isFirstPersonView && this.selectedObject == this.currentFirstPersonViewObject
    }
}