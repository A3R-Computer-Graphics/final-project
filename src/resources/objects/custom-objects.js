/**
 * Declare custom objects that reuses existing vertices/colors here.
 * Make sure to import objects-data.js or objects-data-simple.js first
 */

var [LENGTH, WIDTH, HEIGHT] = [10.0, 10.0, 10.0];

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
  vertices: "floor",
  position: [
    objects_info.floor.position[0],
    objects_info.floor.position[1],
    objects_info.floor.position[2] + objects_info.wall.scale[1] * 2,
  ],
};

objects_info["right_wall"] = {
  ...objects_info.left_wall,
  position: [
    objects_info.left_wall.position[0] + objects_info.floor.scale[0] * 2,
    objects_info.left_wall.position[1],
    objects_info.left_wall.position[2],
  ],
};

objects_info["front_wall"] = {
  ...objects_info.wall,
  position: [
      objects_info.wall.position[0],
      objects_info.wall.position[1] - WIDTH * 2,
      objects_info.wall.position[2],
  ]
};
