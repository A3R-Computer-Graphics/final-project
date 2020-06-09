class App extends EventDispatcher {
    constructor({ scene, renderer, animationManager }) {
        super()

        this.scene = scene
        this.renderer = renderer
        this.animationManager = animationManager

        this.objects = {}
        this.__selectedObjectName = ''

        this.materials = {}

        this.requestForObjectPicking = false
    }

    addObject(object) {
        this.objects[object.name] = object
    }

    addMaterial(material) {
        this.materials[material.name] = material
    }

    get selectedObjectName() {
        return this.__selectedObjectName
    }

    set selectedObjectName(val) {
        val = val || ''
        if (this.__selectedObjectName || '' !== val) {
            let oldVal = this.__selectedObjectName
            this.__selectedObjectName = val
            this.dispatchEvent('update-selection', val, oldVal)
        }
    }

    get selectedObject() {
        return this.objects[this.__selectedObjectName]
    }

    getNextUniqueName(name) {
        return ModuleUtil.getNextUniqueNameFromDict(name, this.objects)
    }
}