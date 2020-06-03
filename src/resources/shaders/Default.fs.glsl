
precision mediump float;

const vec4 selectedObjectColor = vec4(0.0/255.0, 123.0/255.0, 255.0/255.0, 1.0);

// Texture setup

varying vec2 v_texcoord;
uniform sampler2D u_texture;

uniform vec3 lightPosition;

varying vec3 normalInterp;  // Surface normal
varying vec3 vertPos;       // Vertex position
varying vec3 lightPos;      // Light position, interpolated
varying vec3 fPos;

uniform vec4 ambientProduct, diffuseProduct, specularProduct;
uniform float shininess;

// Flag to indicate if object is selected or not
uniform bool isSelected;

// Small patch to mix value between texture and calculated phong
// This is handy to make sure the material that doesn't have image texture
// will not use any Texture2D
uniform float textureMix;

uniform samplerCube pointLightShadowMap;
uniform float shadowClipNear;
uniform float shadowClipFar;

vec4 calculatePhong() {
    vec3 N = normalize(normalInterp);

    vec3 L = normalize(lightPos - vertPos);
    vec3 E = normalize(-vertPos);
    vec3 H = normalize(L + E); // Half vector

    // Compute diffuse reflection term using Lambert cosine law (see p. 286 Angel 7th ed)
    float lambertian = max(dot(N, L), 0.0);

    float specular = 0.0;
    if (lambertian > 0.0) {
        // Compute specular reflection term (see p. 287 Angel 7th ed)
        float specAngle = max(dot(N, H), 0.0);
        specular = pow(specAngle, shininess);
    }

    vec3 fromLightToFragment = (fPos - lightPosition);
    float lightFragDist = (length(fromLightToFragment) - shadowClipNear)
    / (shadowClipFar - shadowClipNear);

    vec3 toLightNormal = normalize(-fromLightToFragment);
    float shadowMapValue = textureCube(pointLightShadowMap, -toLightNormal).r;
    bool isLit = (shadowMapValue + 0.003) >= lightFragDist;

    vec4 color = ambientProduct;

    // If the object is shadowed, there should be an ambient lighting only.
    if (isLit) {
        color += lambertian * diffuseProduct + specular * specularProduct;
    }
    return color;
}

void main()
{
    vec4 fColor;

    if (!isSelected) {
        fColor = calculatePhong();
        fColor = mix(fColor, texture2D(u_texture, v_texcoord) * fColor, textureMix);
    } else {
        fColor = selectedObjectColor;
    }

    fColor.a = 1.0;
    gl_FragColor = fColor;
}