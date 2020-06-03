// precision mediump float;

attribute vec4 vPosition;
uniform mat4 modelMatrix, viewMatrix, projectionMatrix;

varying vec3 fPos;

uniform bool isTreeLeaf;
uniform bool isGrass;
uniform float time;

void main() {
    fPos = (modelMatrix * vec4(vPosition.xyz, 1.0)).xyz;

    if (isTreeLeaf) {
        vec3 smallInc = fPos * 10.0 + vec3(1.0, 3.0, 4.0) + vec3(time);
        vec3 largeInc = fPos * 0.4 + vec3(time) * vec3(0.8, 1.1, 0.95) * 0.1 + vec3(4.12, 9.11, -2.3);
        smallInc = sin(smallInc) * 0.01;
        largeInc = sin(largeInc) * 0.2;
        fPos = smallInc + largeInc + fPos;
    } else if (isGrass) {
        float ground = 0.0;
        float ceiling = 1.2;

        float height = (fPos.z - ground) / (ceiling - ground);
        float factor = height * 0.3;
        vec2 disp = sin(fPos.xy + vec2(1.0) * time);
        fPos = fPos + vec3(disp * factor, ground + height * 2.0);
    }

    gl_Position = projectionMatrix * viewMatrix * vec4(fPos, 1.0);
}