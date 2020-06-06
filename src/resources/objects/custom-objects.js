/**
 * Declare custom objects that reuses existing vertices/colors here.
 * Make sure to import objects-data.js or objects-data-simple.js first
 */

var [LENGTH, WIDTH, HEIGHT] = [20.0, 20.0, 10.0];

objects_info = {
    ...objects_info,
    "tanah": {
      ...objects_info.tanah,
      scale: [
        3.0,
        3.0,
        3.0,
      ],
      position: [
        0.0,
        0.0,
        -1.0,
      ]
    },
    "rumput": {
      ...objects_info.rumput,
      scale: [
        0.25,
        0.35,
        0.2,
      ],
    },
    "Batang.2": {
      vertices: "Batang",
      material_name: "Kayu.001",
      "position": [
        -5.0,
        5.0,
        0.0,
      ]
    },
    "Daun.2": {
      "vertices": "Daun",
      "material_name": "Leaf.001",
        "parent": "Batang.2",
        "position": [
            -1.87,
            -2.99,
            7.829
        ],
        "rotation": [
            0.0,
            0.0,
            0.0
        ],
        "scale": [
            1.3953020572662354,
            1.3953020572662354,
            1.3953020572662354
        ]
    },
    "Batang.3": {
      vertices: "Batang",
      material_name: "Kayu.001",
      "position": [
        -8.0,
        -6.0,
        -1.0,
      ],
      "scale": [
        1.0,
        1.0,
        1.5,
      ]
    },
    "Daun.3": {
      "vertices": "Daun",
      "material_name": "Leaf.001",
        "parent": "Batang.3",
        "position": [
            -1.87,
            -2.99,
            7.829
        ],
        "rotation": [
            0.0,
            0.0,
            0.0
        ],
        "scale": [
            1.3953020572662354,
            1.3953020572662354,
            1.3953020572662354
        ]
    },
    // "floor": {
    //     "position": [
    //         0.0,
    //         -3.0,
    //         -1.0
    //     ],
    //     "material_name": "floor",
    //     "rotation": [
    //         0.0,
    //         0.0,
    //         0.0
    //     ],
    //     "scale": [
    //         10,
    //         10,
    //         10
    //     ]
    // },
    // "wall": {
    //     "position": [
    //         0.0,
    //         7.743,
    //         -1.0
    //     ],
    //     "material_name": "floor",
    //     "rotation": [
    //         90,
    //         -0.0,
    //         0.0
    //     ],
    //     "scale": [
    //         10,
    //         10,
    //         10
    //     ]
    // }
}

// objects_info.floor = {
//   ...objects_info.floor,
//   position: [0.0, 0.0, -1.0],
//   scale: [LENGTH, WIDTH, 1],
// };

// objects_info.wall = {
//   ...objects_info.wall,
//   vertices: "wall",
//   position: [
//     objects_info.floor.position[0],
//     objects_info.floor.position[1] + WIDTH,
//     objects_info.floor.position[2] + HEIGHT,
//   ],
//   scale: [LENGTH, HEIGHT, WIDTH],
// };

// objects_info["left_wall"] = {
//   ...objects_info.wall,
//   vertices: "wall",
//   rotation: [90.0, 0, 90.0],
//   position: [
//     objects_info.floor.position[0] - objects_info.wall.scale[0],
//     objects_info.floor.position[1],
//     objects_info.floor.position[2] + objects_info.wall.scale[1],
//   ],
//   scale: [WIDTH, HEIGHT, LENGTH],
//   parent: "wall",
// };

// objects_info["ceiling"] = {
//   ...objects_info.floor,
//   rotation: [180.0, 0, 0.0],
//   vertices: "floor",
//   position: [
//     objects_info.floor.position[0],
//     objects_info.floor.position[1],
//     objects_info.floor.position[2] + objects_info.wall.scale[1] * 2,
//   ],
// };

// objects_info["right_wall"] = {
//   ...objects_info.left_wall,
//   rotation: [-90.0, 0, 90.0],
//   position: [
//     objects_info.left_wall.position[0] + objects_info.floor.scale[0] * 2,
//     objects_info.left_wall.position[1],
//     objects_info.left_wall.position[2],
//   ],
//   parent: "wall",
// };

// objects_info["front_wall"] = {
//   ...objects_info.wall,
//   rotation: [-90.0, 0, 0.0],
//   position: [
//       objects_info.wall.position[0],
//       objects_info.wall.position[1] - WIDTH * 2,
//       objects_info.wall.position[2],
//   ],
//   parent: "wall",
// };
