// precision mediump float;

attribute vec4 vPosition;
uniform mat4 modelMatrix, viewMatrix, projectionMatrix;

varying vec3 fPos;

void main() {
    fPos = (modelMatrix * vec4(vPosition.xyz, 1.0)).xyz;
    gl_Position = projectionMatrix * viewMatrix * vec4(fPos, 1.0);
}