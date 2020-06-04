// precision mediump float;

attribute vec4 a_pos;
uniform mat4 u_world, u_cam, u_proj;

varying vec3 v_pos;

uniform bool isTreeLeaf;
uniform bool isGrass;
uniform float time;

void main() {
    v_pos = (u_world * vec4(a_pos.xyz, 1.0)).xyz;

    // Displace the grass and tree leaf

    if (isTreeLeaf) {
        vec3 smallInc = v_pos * 10.0 + vec3(1.0, 3.0, 4.0) + vec3(time);
        vec3 largeInc = v_pos * 0.4 + vec3(time) * vec3(0.8, 1.1, 0.95) * 0.1 + vec3(4.12, 9.11, -2.3);
        smallInc = sin(smallInc) * 0.01;
        largeInc = sin(largeInc) * 0.2;
        v_pos = smallInc + largeInc + v_pos;
    } else if (isGrass) {
        float ground = 0.0;
        float ceiling = 1.2;

        float height = (v_pos.z - ground) / (ceiling - ground);
        float factor = height * 0.3;
        vec2 disp = sin(v_pos.xy + vec2(1.0) * time);
        v_pos = v_pos + vec3(disp * factor, ground + height * 2.0);
    }

    gl_Position = u_proj * u_cam * vec4(v_pos, 1.0);
}