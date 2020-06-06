/**
 * Declare custom objects that reuses existing vertices/colors here.
 * Make sure to import objects-data.js or objects-data-simple.js first
 */

var [LENGTH, WIDTH, HEIGHT] = [20.0, 20.0, 10.0];

objects_info = {
    ...objects_info,
    "floor": {
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
        "position": [
            0.0,
            7.743,
            -1.0
        ],
        "material_name": "floor",
        "rotation": [
            90,
            -0.0,
            0.0
        ],
        "scale": [
            10,
            10,
            10
        ]
    }
}

objects_info.floor = {
  ...objects_info.floor,
  position: [0.0, 0.0, -1.0],
  scale: [LENGTH, WIDTH, 1],
};

objects_info.wall = {
  ...objects_info.wall,
  vertices: "wall",
  position: [
    objects_info.floor.position[0],
    objects_info.floor.position[1] + WIDTH,
    objects_info.floor.position[2] + HEIGHT,
  ],
  scale: [LENGTH, HEIGHT, WIDTH],
};

objects_info["left_wall"] = {
  ...objects_info.wall,
  vertices: "wall",
  rotation: [90.0, 0, 90.0],
  position: [
    objects_info.floor.position[0] - objects_info.wall.scale[0],
    objects_info.floor.position[1],
    objects_info.floor.position[2] + objects_info.wall.scale[1],
  ],
  scale: [WIDTH, HEIGHT, LENGTH],
};

objects_info["ceiling"] = {
  ...objects_info.floor,
  rotation: [180.0, 0, 0.0],
  vertices: "floor",
  position: [
    objects_info.floor.position[0],
    objects_info.floor.position[1],
    objects_info.floor.position[2] + objects_info.wall.scale[1] * 2,
  ],
};

objects_info["right_wall"] = {
  ...objects_info.left_wall,
  rotation: [-90.0, 0, 90.0],
  position: [
    objects_info.left_wall.position[0] + objects_info.floor.scale[0] * 2,
    objects_info.left_wall.position[1],
    objects_info.left_wall.position[2],
  ],
};

objects_info["front_wall"] = {
  ...objects_info.wall,
  rotation: [-90.0, 0, 0.0],
  position: [
      objects_info.wall.position[0],
      objects_info.wall.position[1] - WIDTH * 2,
      objects_info.wall.position[2],
  ]
};
