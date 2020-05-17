class App {
    constructor({ scene, renderer, animationManager }) {
        this.scene = scene
        this.renderer = renderer
        this.animationManager = animationManager

        this.objects = {}
        this.selectedObjectName = ''

        this.materials = {}
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
        return getNextUniqueNameFromDict(name, this.objects)
    }
}