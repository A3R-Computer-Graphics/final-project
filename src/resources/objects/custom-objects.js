/**
 * Declare custom objects that reuses existing vertices/colors here.
 * Make sure to import objects-data.js or objects-data-simple.js first
 */

var [LENGTH, WIDTH, HEIGHT] = [20.0, 20.0, 10.0];
if ("tanah" in objects_info && "rumput" in objects_info) {
  objects_info.tanah = {
    ...objects_info.tanah,
    scale: [3.0, 3.0, 3.0],
    position: [0.0, 0.0, -1.0],
  };
  objects_info.rumput = {
    ...objects_info.rumput,
    scale: [0.25, 0.35, 0.2],
  };
}

if ("Batang" in objects_info && "Daun" in objects_info) {
  objects_info["Batang.2"] = {
    vertices: "Batang",
    material_name: "Kayu.001",
    position: [-5.0, 5.0, 0.0],
  };
  objects_info["Daun.2"] = {
    vertices: "Daun",
    material_name: "Leaf.001",
    parent: "Batang.2",
    position: [-1.87, -2.99, 7.829],
    rotation: [0.0, 0.0, 0.0],
    scale: [1.3953020572662354, 1.3953020572662354, 1.3953020572662354],
  };
  objects_info["Batang.3"] = {
    vertices: "Batang",
    material_name: "Kayu.001",
    position: [-8.0, -6.0, -1.0],
    scale: [1.0, 1.0, 1.5],
  };
  objects_info["Daun.3"] = {
    vertices: "Daun",
    material_name: "Leaf.001",
    parent: "Batang.3",
    position: [-1.87, -2.99, 7.829],
    rotation: [0.0, 0.0, 0.0],
    scale: [1.3953020572662354, 1.3953020572662354, 1.3953020572662354],
  };
}

if ("Batang" in objects_info) {
  objects_info["Batang"].position[0] = 6.5;
  objects_info["Batang"].position[2] = -1.0;
}

// function randomOneOrMinusOne() {
//   const random = Math.random()
//   if (random <= 0.5) return -1
//   return 1
// }

// function generateRandomTrees(numOfDesiredTrees) {
//   for (var i = 0; i < numOfDesiredTrees; i++) {
//     const randomX = randomOneOrMinusOne() * Math.random() * 75;
//     const randomY = randomOneOrMinusOne() * Math.random() * 75;
//     const randomScale = Math.max(1.0, Math.random() * 2 * 1.5);

//     const batangObjectCopy = {
//       vertices: "Batang",
//       material_name: "Kayu.001",
//       position: [randomX, randomY, -1.0],
//       scale: [randomScale, randomScale, Math.random() * 6.0],
//     };
//     const batangKey = `Batang.${i + 2}`;
//     const daunObjectCopy = {
//       parent: batangKey,
//       vertices: "Daun",
//       material_name: "Leaf.001",
//       position: [-1.87, -2.99, 7.829],
//       rotation: [0.0, 0.0, 0.0],
//       scale: [1.3953020572662354, 1.3953020572662354, 1.3953020572662354],
//     };
//     const daunKey = `Daun.${i + 2}`;
//     objects_info[batangKey] = batangObjectCopy;
//     objects_info[daunKey] = daunObjectCopy;
//   }
// }

// generateRandomTrees(15)
