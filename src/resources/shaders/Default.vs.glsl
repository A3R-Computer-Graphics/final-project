
precision mediump float;

attribute vec4 vPosition;
attribute vec3 vNormal;

attribute vec2 a_texcoord;
varying vec2 v_texcoord;

uniform mat4 modelMatrix, viewMatrix, projectionMatrix, normalMatrix;

uniform vec3 lightPosition;

uniform bool isTreeLeaf;
uniform bool isGrass;
uniform float time;

varying vec3 normalInterp, vertPos, lightPos, fPos;

// non-pointlight setup
uniform bool isPointLight;
uniform mat4 u_textureMatrix;
varying vec4 v_projectedTexcoord;

void main()
{
    vec4 worldPos = modelMatrix * vec4(vPosition.xyz, 1.0);
    fPos = (worldPos).xyz;

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

    vec4 vertPos4 = viewMatrix * worldPos;

    lightPos = (viewMatrix * vec4(lightPosition, 1.0)).xyz;

    vertPos = vertPos4.xyz;
    normalInterp = vec3(normalMatrix * vec4(vNormal, 0.0));
    
    gl_Position = projectionMatrix * vertPos4;

    // Pass the texcoord to the fragment shader.
    v_texcoord = a_texcoord;
    v_projectedTexcoord = u_textureMatrix * worldPos;
}