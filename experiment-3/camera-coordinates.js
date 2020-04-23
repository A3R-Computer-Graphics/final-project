// These coordinates uses Y+ axis as world's up
// which is inconsistent with Blender, so it will be swapped later.

var cameraCoordinates = [
  [-1, +1, -1],
  [+0, +1, -1],
  [+1, +1, -1],

  [-1, 0, -1],
  [+0, 0, -1],
  [+1, 0, -1],

  [-1, -1, -1],
  [+0, -1, -1],
  [+1, -1, -1],


  [-1, +1, 0],
  [+0, +1, 0],
  [+1, +1, 0],

  [-1, 0, 0],
  [+1, 0, 0],

  [-1, -1, 0],
  [+0, -1, 0],
  [+1, -1, 0],


  [-1, 1, 1],
  [+0, 1, 1],
  [+1, 1, 1],

  [-1, 0, 1],
  [+0, 0, 1],
  [+1, 0, 1],

  [-1, -1, 1],
  [+0, -1, 1],
  [+1, -1, 1],
]

/* Direction: UP, LEFT, DOWN, RIGHT */

var cameraMovementCoordinates = {
  0: [-1, 1, 3, 9],
  1: [10, 2, 4, 0],
  2: [-1, 11, 5, 1],
  3: [0, 4, 6, 12],
  4: [1, 5, 7, 3],
  5: [2, 13, 8, 4],
  6: [3, 7, -1, 14],
  7: [4, 8, 15, 6],
  8: [5, 16, -1, 7],
  9: [10, 0, 12, 17],
  10: [11, 1, 18, 9],
  11: [10, 19, 13, 2],
  12: [9, 3, 14, 20],
  13: [11, 22, 16, 5],
  14: [12, 6, 15, 23],
  15: [7, 16, 24, 14],
  16: [13, 25, 15, 8],
  17: [-1, 9, 20, 18],
  18: [10, 17, 21, 19],
  19: [-1, 18, 22, 11],
  20: [17, 12, 23, 21],
  21: [18, 20, 24, 22],
  22: [19, 21, 25, 13],
  23: [20, 14, -1, 24],
  24: [21, 23, 15, 25],
  25: [22, 24, -1, 16]
}

var teapotCoordinates = [
  [0, 0, 0],  // center
  [0, 0, 1],  // going Z+ axis
  [0, 0, -1], // going Z- axis
  [1, 0, 0],  // going X+ axis
  [-1, 0, 0], // going X- axis
  [0, 1, 0],  // going Y+ axis
  [0, -1, 0]  // going Y- axis
]

var teapotCoordAnimSequence = [0, 1, 0, 2, 0, 3, 0, 4, 0, 5, 0, 6];

var teapotCoordinateNames = [
  "sisi belakang - kiri atas",
  "sisi belakang - atas",
  "sisi belakang - kanan atas",

  "sisi belakang - kiri tengah",
  "sisi belakang - pusat",
  "sisi belakang - kanan tengah",

  "sisi belakang - kiri bawah",
  "sisi belakang - bawah",
  "sisi belakang - kanan bawah",

  "sisi atas - kiri tengah",
  "sisi atas - pusat",
  "sisi atas - kanan tengah",

  "sisi kiri - pusat",
  "sisi kanan - pusat",

  "sisi bawah - kiri tengah",
  "sisi bawah - pusat",
  "sisi bawah - kanan pusat",

  "sisi depan - kiri atas",
  "sisi depan - atas",
  "sisi depan - kanan atas",

  "sisi depan - kiri tengah",
  "sisi depan - pusat",
  "sisi depan - kanan tengah",

  "sisi depan - kiri bawah",
  "sisi depan - bawah",
  "sisi depan - kanan bawah"
]