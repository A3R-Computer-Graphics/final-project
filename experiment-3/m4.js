var m4 = {
  // Setup 3x3 transformation matrix object
  identity: function () {
    return [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1,
    ];
  },

  projection: function (width, height, depth) {
    // Note: This matrix flips the Y axis so 0 is at the top.
    return [
      2 / width, 0, 0, 0,
      0, -2 / height, 0, 0,
      0, 0, 2 / depth, 0,
      -1, 1, 0, 1,
    ];
  },

  multiply: function (a, b) {
    // rewrite multiply to use direct indices from commented code below.
    return [
      b[0]  * a[0]     + b[1] *  a[4]     + b[2]  * a[8]      + b[3]  * a[12],
      b[0]  * a[1]     + b[1]  * a[5]     + b[2]  * a[9]      + b[3]  * a[13],
      b[0]  * a[2]     + b[1]  * a[6]     + b[2]  * a[10]     + b[3]  * a[14],
      b[0]  * a[3]     + b[1]  * a[7]     + b[2]  * a[11]     + b[3]  * a[15],

      b[4]  * a[0]     + b[5]  * a[4]     + b[6]  * a[8]      + b[7]  * a[12],
      b[4]  * a[1]     + b[5]  * a[5]     + b[6]  * a[9]      + b[7]  * a[13],
      b[4]  * a[2]     + b[5]  * a[6]     + b[6]  * a[10]     + b[7]  * a[14],
      b[4]  * a[3]     + b[5]  * a[7]     + b[6]  * a[11]     + b[7]  * a[15],

      b[8]  * a[0]     + b[9]  * a[4]     + b[10] * a[8]      + b[11] * a[12],
      b[8]  * a[1]     + b[9]  * a[5]     + b[10] * a[9]      + b[11] * a[13],
      b[8]  * a[2]     + b[9]  * a[6]     + b[10] * a[10]     + b[11] * a[14],
      b[8]  * a[3]     + b[9]  * a[7]     + b[10] * a[11]     + b[11] * a[15],

      b[12] * a[0]     + b[13] * a[4]     + b[14] * a[8]      + b[15] * a[12],
      b[12] * a[1]     + b[13] * a[5]     + b[14] * a[9]      + b[15] * a[13],
      b[12] * a[2]     + b[13] * a[6]     + b[14] * a[10]     + b[15] * a[14],
      b[12] * a[3]     + b[13] * a[7]     + b[14] * a[11]     + b[15] * a[15]
    ];
    // var a00 = a[0 * 4 + 0];
    // var a01 = a[0 * 4 + 1];
    // var a02 = a[0 * 4 + 2];
    // var a03 = a[0 * 4 + 3];
    // var a10 = a[1 * 4 + 0];
    // var a11 = a[1 * 4 + 1];
    // var a12 = a[1 * 4 + 2];
    // var a13 = a[1 * 4 + 3];
    // var a20 = a[2 * 4 + 0];
    // var a21 = a[2 * 4 + 1];
    // var a22 = a[2 * 4 + 2];
    // var a23 = a[2 * 4 + 3];
    // var a30 = a[3 * 4 + 0];
    // var a31 = a[3 * 4 + 1];
    // var a32 = a[3 * 4 + 2];
    // var a33 = a[3 * 4 + 3];
    // var b00 = b[0 * 4 + 0];
    // var b01 = b[0 * 4 + 1];
    // var b02 = b[0 * 4 + 2];
    // var b03 = b[0 * 4 + 3];
    // var b10 = b[1 * 4 + 0];
    // var b11 = b[1 * 4 + 1];
    // var b12 = b[1 * 4 + 2];
    // var b13 = b[1 * 4 + 3];
    // var b20 = b[2 * 4 + 0];
    // var b21 = b[2 * 4 + 1];
    // var b22 = b[2 * 4 + 2];
    // var b23 = b[2 * 4 + 3];
    // var b30 = b[3 * 4 + 0];
    // var b31 = b[3 * 4 + 1];
    // var b32 = b[3 * 4 + 2];
    // var b33 = b[3 * 4 + 3];
    // return [
    //   b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30,
    //   b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31,
    //   b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32,
    //   b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33,
    //   b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30,
    //   b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31,
    //   b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32,
    //   b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33,
    //   b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30,
    //   b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31,
    //   b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32,
    //   b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33,
    //   b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30,
    //   b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31,
    //   b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32,
    //   b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33,
    // ];
  },

  translation: function (tx, ty, tz) {
    return [
      1, 0, 0, 0,
      0, 1, 0, 0,
      0, 0, 1, 0,
      tx, ty, tz, 1,
    ];
  },

  xRotation: function (angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);

    return [
      1, 0, 0, 0,
      0, c, s, 0,
      0, -s, c, 0,
      0, 0, 0, 1,
    ];
  },

  yRotation: function (angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);

    return [
      c, 0, -s, 0,
      0, 1, 0, 0,
      s, 0, c, 0,
      0, 0, 0, 1,
    ];
  },

  zRotation: function (angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);

    return [
      c, s, 0, 0,
      -s, c, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1,
    ];
  },

  /**
   * Produce rotation matrix using XYZ rotation
   */

  xyzRotation: function (x, y, z) {
    var a = Math.cos(z);
    var b = Math.sin(z);
    var c = Math.cos(y);
    var d = Math.sin(y);
    var e = Math.cos(x);
    var f = Math.sin(x);
    var ea = e * a;
    var af = a * f;
    var eb = e * b;
    var bf = b * f;

    return [
       a*c, b*c, -d, 0,
       af*d - eb, bf*d + ea, c*f, 0,
       ea*d + bf, eb*d - af, e*c, 0, 
         0,         0,         0, 1,
    ];
  },

  /**
   * Produce rotation and scaling matrix
   * using XYZ Euler rotation order.
   * The matrix is scaled first, then rotated. 
   */

  xyzRotationScale: function(rx, ry, rz, sx, sy, sz) {

    // Join rotation and scale matrix into single matrix equation
    // instead of defining matrix for each operation and
    // multiplying them using ordinary matrix multiplication.

    var a = Math.cos(rz);
    var b = Math.sin(rz);
    var c = Math.cos(ry);
    var d = Math.sin(ry);
    var e = Math.cos(rx);
    var f = Math.sin(rx);
    var ea = e * a;
    var af = a * f;
    var eb = e * b;
    var bf = b * f;

    return [
       a*c*sx, b*c*sx, -d*sx, 0,
       (af*d - eb)*sy, (bf*d + ea)*sy, c*f*sy, 0,
       (ea*d + bf)*sz, (eb*d - af)*sz, e*c*sz, 0, 
         0,         0,         0, 1,
    ];
  },

  scaling: function (sx, sy, sz) {
    return [
      sx, 0, 0, 0,
      0, sy, 0, 0,
      0, 0, sz, 0,
      0, 0, 0, 1,
    ];
  },

  translate: function (m, tx, ty, tz) {
    return m4.multiply(m, m4.translation(tx, ty, tz));
  },

  xRotate: function (m, angleInRadians) {
    return m4.multiply(m, m4.xRotation(angleInRadians));
  },

  yRotate: function (m, angleInRadians) {
    return m4.multiply(m, m4.yRotation(angleInRadians));
  },

  zRotate: function (m, angleInRadians) {
    return m4.multiply(m, m4.zRotation(angleInRadians));
  },

  scale: function (m, sx, sy, sz) {
    return m4.multiply(m, m4.scaling(sx, sy, sz));
  },
};