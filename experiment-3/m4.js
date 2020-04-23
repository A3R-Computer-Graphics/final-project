/*
Transpose and inverse matrix function are copyright Gregg Tavares

 * Copyright 2014, Gregg Tavares.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of Gregg Tavares. nor the names of his
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */


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
  
  /**
   * Computes the inverse of a matrix.
   * @param {Matrix4} m matrix to compute inverse of
   * @param {Matrix4} [dst] optional matrix to store result
   * @return {Matrix4} dst or a new matrix if none provided
   * @memberOf module:webgl-3d-math
   */
  inverse: function(m, dst) {
    dst = dst || new Float32Array(16);
    var m00 = m[0 * 4 + 0];
    var m01 = m[0 * 4 + 1];
    var m02 = m[0 * 4 + 2];
    var m03 = m[0 * 4 + 3];
    var m10 = m[1 * 4 + 0];
    var m11 = m[1 * 4 + 1];
    var m12 = m[1 * 4 + 2];
    var m13 = m[1 * 4 + 3];
    var m20 = m[2 * 4 + 0];
    var m21 = m[2 * 4 + 1];
    var m22 = m[2 * 4 + 2];
    var m23 = m[2 * 4 + 3];
    var m30 = m[3 * 4 + 0];
    var m31 = m[3 * 4 + 1];
    var m32 = m[3 * 4 + 2];
    var m33 = m[3 * 4 + 3];
    var tmp_0  = m22 * m33;
    var tmp_1  = m32 * m23;
    var tmp_2  = m12 * m33;
    var tmp_3  = m32 * m13;
    var tmp_4  = m12 * m23;
    var tmp_5  = m22 * m13;
    var tmp_6  = m02 * m33;
    var tmp_7  = m32 * m03;
    var tmp_8  = m02 * m23;
    var tmp_9  = m22 * m03;
    var tmp_10 = m02 * m13;
    var tmp_11 = m12 * m03;
    var tmp_12 = m20 * m31;
    var tmp_13 = m30 * m21;
    var tmp_14 = m10 * m31;
    var tmp_15 = m30 * m11;
    var tmp_16 = m10 * m21;
    var tmp_17 = m20 * m11;
    var tmp_18 = m00 * m31;
    var tmp_19 = m30 * m01;
    var tmp_20 = m00 * m21;
    var tmp_21 = m20 * m01;
    var tmp_22 = m00 * m11;
    var tmp_23 = m10 * m01;

    var t0 = (tmp_0 * m11 + tmp_3 * m21 + tmp_4 * m31) -
        (tmp_1 * m11 + tmp_2 * m21 + tmp_5 * m31);
    var t1 = (tmp_1 * m01 + tmp_6 * m21 + tmp_9 * m31) -
        (tmp_0 * m01 + tmp_7 * m21 + tmp_8 * m31);
    var t2 = (tmp_2 * m01 + tmp_7 * m11 + tmp_10 * m31) -
        (tmp_3 * m01 + tmp_6 * m11 + tmp_11 * m31);
    var t3 = (tmp_5 * m01 + tmp_8 * m11 + tmp_11 * m21) -
        (tmp_4 * m01 + tmp_9 * m11 + tmp_10 * m21);

    var d = 1.0 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3);

    dst[0] = d * t0;
    dst[1] = d * t1;
    dst[2] = d * t2;
    dst[3] = d * t3;
    dst[4] = d * ((tmp_1 * m10 + tmp_2 * m20 + tmp_5 * m30) -
          (tmp_0 * m10 + tmp_3 * m20 + tmp_4 * m30));
    dst[5] = d * ((tmp_0 * m00 + tmp_7 * m20 + tmp_8 * m30) -
          (tmp_1 * m00 + tmp_6 * m20 + tmp_9 * m30));
    dst[6] = d * ((tmp_3 * m00 + tmp_6 * m10 + tmp_11 * m30) -
          (tmp_2 * m00 + tmp_7 * m10 + tmp_10 * m30));
    dst[7] = d * ((tmp_4 * m00 + tmp_9 * m10 + tmp_10 * m20) -
          (tmp_5 * m00 + tmp_8 * m10 + tmp_11 * m20));
    dst[8] = d * ((tmp_12 * m13 + tmp_15 * m23 + tmp_16 * m33) -
          (tmp_13 * m13 + tmp_14 * m23 + tmp_17 * m33));
    dst[9] = d * ((tmp_13 * m03 + tmp_18 * m23 + tmp_21 * m33) -
          (tmp_12 * m03 + tmp_19 * m23 + tmp_20 * m33));
    dst[10] = d * ((tmp_14 * m03 + tmp_19 * m13 + tmp_22 * m33) -
          (tmp_15 * m03 + tmp_18 * m13 + tmp_23 * m33));
    dst[11] = d * ((tmp_17 * m03 + tmp_20 * m13 + tmp_23 * m23) -
          (tmp_16 * m03 + tmp_21 * m13 + tmp_22 * m23));
    dst[12] = d * ((tmp_14 * m22 + tmp_17 * m32 + tmp_13 * m12) -
          (tmp_16 * m32 + tmp_12 * m12 + tmp_15 * m22));
    dst[13] = d * ((tmp_20 * m32 + tmp_12 * m02 + tmp_19 * m22) -
          (tmp_18 * m22 + tmp_21 * m32 + tmp_13 * m02));
    dst[14] = d * ((tmp_18 * m12 + tmp_23 * m32 + tmp_15 * m02) -
          (tmp_22 * m32 + tmp_14 * m02 + tmp_19 * m12));
    dst[15] = d * ((tmp_22 * m22 + tmp_16 * m02 + tmp_21 * m12) -
          (tmp_20 * m12 + tmp_23 * m22 + tmp_17 * m02));

    return dst;
  },

  /**
   * Transposes a matrix.
   * @param {Matrix4} m matrix to transpose.
   * @param {Matrix4} [dst] optional matrix to store result
   * @return {Matrix4} dst or a new matrix if none provided
   * @memberOf module:webgl-3d-math
   */
  transpose: function(m, dst) {
    dst = dst || new Float32Array(16);

    dst[ 0] = m[0];
    dst[ 1] = m[4];
    dst[ 2] = m[8];
    dst[ 3] = m[12];
    dst[ 4] = m[1];
    dst[ 5] = m[5];
    dst[ 6] = m[9];
    dst[ 7] = m[13];
    dst[ 8] = m[2];
    dst[ 9] = m[6];
    dst[10] = m[10];
    dst[11] = m[14];
    dst[12] = m[3];
    dst[13] = m[7];
    dst[14] = m[11];
    dst[15] = m[15];

    return dst;
  }
};