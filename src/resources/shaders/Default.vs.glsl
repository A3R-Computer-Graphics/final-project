
precision mediump float;

attribute vec4 vPosition;
attribute vec3 vNormal;

attribute vec2 a_texcoord;
varying vec2 v_texcoord;

uniform mat4 modelMatrix, viewMatrix, projectionMatrix, normalMatrix;

uniform vec3 lightPosition;

varying vec3 normalInterp, vertPos, lightPos, fPos;

void main()
{
    fPos = (modelMatrix * vec4(vPosition.xyz, 1.0)).xyz;
    vec4 vertPos4 = viewMatrix * vec4(fPos, 1.0);

    vec3 worldPos = vertPos4.xyz;
    lightPos = (viewMatrix * vec4(lightPosition, 1.0)).xyz;

    vertPos = vertPos4.xyz;
    normalInterp = vec3(normalMatrix * vec4(vNormal, 0.0));
    
    gl_Position = projectionMatrix * vertPos4;

    // Pass the texcoord to the fragment shader.
    v_texcoord = a_texcoord;
}