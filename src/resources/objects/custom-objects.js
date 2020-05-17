/** 
 * Declare custom objects that reuses existing vertices/colors here.
 * Make sure to import objects-data.js or objects-data-simple.js first
 */

objects_info = {
    ...objects_info,
    "floor": {
        ...objects_info.floor,
        "vertices": "floor",
        "position": [
            0.0,
            -3.0,
            -1.0
        ],
        "material_name": "floor",
        "rotation": [
            0.0,
            0.0,
            0.0
        ],
        "scale": [
            10,
            10,
            10
        ]
    },
    "wall": {
        ...objects_info.wall,
        "material_name": "floor",
        "rotation": [
            90,
            -0.0,
            0.0
        ],
        "position": [
            0,
            7,
            4.0,
        ],
        "scale": [
            10,
            5,
            10
        ],
    },
    "front_wall": {
        "vertices": "wall",
        "material_name": "floor",
        "rotation": [
            90,
            0.0,
            0.0
        ],
        "position": [
            0,
            -13.0,
            4.0,
        ],
        "scale": [
            10,
            5,
            10
        ],
    },
    "ceiling": {
        "vertices": "floor",
        "position": [
            0.0,
            -3.0,
            9.0
        ],
        "material_name": "floor",
        "rotation": [
            0.0,
            0.0,
            0.0
        ],
        "scale": [
            10,
            10,
            10
        ]
    },
    "left_wall": {
        "vertices": "wall",
        "position": [
            -10.0,
            -3.0,
            4.0
        ],
        "material_name": "floor",
        "rotation": [
            0,
            90,
            0.0
        ],
        "scale": [
            5,
            10,
            10
        ]
    },
    "right_wall": {
        "vertices": "wall",
        "position": [
            10.0,
            -3.0,
            4.0
        ],
        "material_name": "floor",
        "rotation": [
            0,
            90,
            0.0
        ],
        "scale": [
            5,
            10,
            10
        ]
    }
}