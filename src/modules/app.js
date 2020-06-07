class App {
    constructor({ scene, renderer, animationManager }) {
        this.scene = scene
        this.renderer = renderer
        this.animationManager = animationManager

        this.objects = {}
        this.selectedObjectName = ''
        this.hoveredObjectName = ''

        this.materials = {}

        this.requestForObjectPicking = false
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

    get hoveredObject() {
        return this.objects[this.hoveredObjectName]
    }

    getNextUniqueName(name) {
        return ModuleUtil.getNextUniqueNameFromDict(name, this.objects)
    }
}