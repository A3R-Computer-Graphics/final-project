precision mediump float;

uniform vec3 lightPosition;
uniform float shadowClipNear;
uniform float shadowClipFar;

varying vec3 fPos;

uniform bool isPointLight;

void main() {
    if (!isPointLight) {
        gl_FragColor = vec4(gl_FragCoord.z);
    } else {
        vec3 fromLightToFragment = (fPos - lightPosition);
        float lightFragDist = (length(fromLightToFragment) - shadowClipNear)
        / (shadowClipFar - shadowClipNear);

        gl_FragColor = vec4(lightFragDist, lightFragDist, lightFragDist, 1.0);
    }
}