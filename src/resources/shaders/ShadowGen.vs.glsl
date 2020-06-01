attribute vec4 vPosition;
attribute vec2 a_texcoord;

uniform mat4 u_projection;
uniform mat4 u_view;
uniform mat4 u_world;

varying vec2 v_texcoord;

void main() {
    gl_Position = u_projection * u_view * u_world * vPosition;

    // Pass the texture coord to the fragment shader.
    v_texcoord = a_texcoord;
}