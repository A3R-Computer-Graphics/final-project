var objectsAdditionalData = Object.assign({}, ...Object.keys(objects_info).map((key) => ({
    [key]: {
        perspective: false,
        isEye: true,
    }
})))

objectsAdditionalData.eye.isEye = true
