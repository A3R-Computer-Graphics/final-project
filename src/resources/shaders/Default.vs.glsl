
precision mediump float;

attribute vec4 a_pos;
attribute vec3 a_norm;
attribute vec2 a_texcoord;

varying vec2 v_texcoord;

uniform mat4 u_world, u_cam, u_proj, u_normCam;

uniform vec3 lightPosition;

uniform bool isTreeLeaf;
uniform bool isGrass;
uniform float time;

varying vec3 v_camNorm, v_worldNorm, v_camPos, v_camLightPos, v_pos;

uniform mat4 u_textureMatrix;
varying vec4 v_projectedTexcoord;



// Displace the tree leaf and grass

void displaceIfLeafOrGrass(inout vec3 pos) {
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
}



void main()
{
    vec4 worldPos = u_world * vec4(a_pos.xyz, 1.0);
    v_pos = (worldPos).xyz;
    displaceIfLeafOrGrass(v_pos);

    vec4 v_camPos4 = u_cam * worldPos;

    v_camPos = v_camPos4.xyz;
    v_worldNorm = vec3(u_world * vec4(a_norm, 0.0));
    v_camNorm = vec3(u_normCam * vec4(a_norm, 0.0));
    v_camLightPos = (u_cam * vec4(lightPosition, 1.0)).xyz;

    v_texcoord = a_texcoord;
    v_projectedTexcoord = u_textureMatrix * worldPos;
    
    gl_Position = u_proj * v_camPos4;
}