var objectsDirections = {
    "link.body": [0.0, -2.0, 0.0, 1.0],
    "chicken.body": [0.0, -2.0, 0.0, 1.0],
    "mushroom-light": [0.0, -1.0, -1.0, 1.0],
    "grasses": [0.0, 0.0, 1.0, 1.0],
}

var objectsDisplayNames = {
    "link.body": "Link",
    "chicken.body": "Chicken",
}

var objectsAdditionalData = Object.assign({}, ...Object.keys(objects_info).map((key) => ({
    [key]: {
        direction: key in objectsDirections ? objectsDirections[key] : null,
        displayName: key in objectsDisplayNames ? objectsDisplayNames[key] : null,
    }
})))
