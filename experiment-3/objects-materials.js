var materials_defintion = [
    {
      name: "Default",
      ambient: vec4(1.0, 0.0, 1.0, 1.0),
      diffuse: vec4(1.0, 0.8, 0.0, 1.0),
      specular:  vec4(1.0, 0.8, 0.0, 1.0),
      shininess: 20,
    },
    {
      name: "arm.top", // take from Ruby
      ambient: vec4(0.25, 0.20725, 0.20725, 0.922),
      diffuse: vec4(1.0, 0.829, 0.829, 0.922),
      specular: vec4(0.296648, 0.296648, 0.296648, 0.922),
      shininess: 11.264
    },
    {
      name: "arm.bot", // taken from yellow rubber
      ambient: vec4(0.1745, 0.01175, 0.01175, 0.55),
      diffuse: vec4(0.61424, 0.04136, 0.04136, 0.55),
      specular: vec4(0.727811, 0.626959, 0.626959, 0.55),
      shininess: 76.8
    },
    {
      name: "arm.floor", // taken from yellow rubber
      ambient: vec4(0.05, 0.05, 0.0, 1.0),
      diffuse: vec4(0.5, 0.5, 0.4, 1.0),
      specular: vec4(0.7, 0.7, 0.04, 1.0),
      shininess: 10.0
    },
  ]