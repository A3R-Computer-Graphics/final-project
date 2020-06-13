// precision mediump float;

attribute vec3 a_pos;
uniform mat4 u_world, u_cam, u_proj;

varying vec3 v_pos;

uniform bool isTreeLeaf;
uniform bool isGrass;
uniform float time;



// Displace the tree leaf and grass

vec3 displaceIfLeafOrGrass(vec3 pos) {
    if (isTreeLeaf) {
        vec3 smallInc = pos * 10.0 + vec3(1.0, 3.0, 4.0) + vec3(time);
        vec3 largeInc = pos * 0.4 + vec3(time) * vec3(0.8, 1.1, 0.95) * 0.1 + vec3(4.12, 9.11, -2.3);
        smallInc = sin(smallInc) * 0.01;
        largeInc = sin(largeInc) * 0.2;
        pos = smallInc + largeInc + pos;
    } else if (isGrass) {
        float ground = 0.0;
        float ceiling = 1.2;

        float height = (pos.z - ground) / (ceiling - ground);
        float factor = height * 0.3;
        vec2 disp = sin(pos.xy + vec2(1.0) * time);
        
        pos = pos + vec3(disp * factor, ground + height * 2.0);
    }
    return pos;
}



void main() {
    vec3 pos = displaceIfLeafOrGrass(a_pos);
    v_pos = (u_world * vec4(pos, 1.0)).xyz;
    displaceIfLeafOrGrass(v_pos);

    gl_Position = u_proj * u_cam * vec4(v_pos, 1.0);
}