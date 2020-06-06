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
}