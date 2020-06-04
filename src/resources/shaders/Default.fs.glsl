
precision mediump float;

const vec4 selectedObjectColor = vec4(0.0/255.0, 123.0/255.0, 255.0/255.0, 1.0);

// Texture setup

varying vec2 v_texcoord;
uniform sampler2D u_texture;

uniform vec3 lightPosition;

varying vec3 v_camNorm;  // Surface normal
varying vec3 v_camPos;       // Vertex position
varying vec3 v_camLightPos;  // Light position, interpolated
varying vec3 v_pos;

uniform vec4 ambientProduct, diffuseProduct, specularProduct;
uniform float shininess;

// Flag to indicate if object is selected or not
uniform bool isSelected;

// Small patch to mix value between texture and calculated phong
// This is handy to make sure the material that doesn't have image texture
// will not use any Texture2D
uniform float textureMix;
uniform bool isRenderingWireframe;


// Light setup
uniform bool isPointLight;

// Point light shadow map setup
uniform samplerCube pointLightShadowMap;
uniform float shadowClipNear;
uniform float shadowClipFar;

// non-point light shadow map setup
varying vec4 v_projectedTexcoord;
uniform sampler2D u_projectedTexture;

vec4 calculatePhong() {
    vec3 N = normalize(v_camNorm);

    vec3 L = normalize(v_camLightPos - v_camPos);
    vec3 E = normalize(-v_camPos);
    vec3 H = normalize(L + E); // Half vector

    // Compute diffuse reflection term using Lambert cosine law (see p. 286 Angel 7th ed)
    float lambertian = max(dot(N, L), 0.0);

    float specular = 0.0;
    if (lambertian > 0.0) {
        // Compute specular reflection term (see p. 287 Angel 7th ed)
        float specAngle = max(dot(N, H), 0.0);
        specular = pow(specAngle, shininess);
    }

    vec3 fromLightToFragment = (v_pos - lightPosition);
    float lightFragDist = (length(fromLightToFragment) - shadowClipNear)
    / (shadowClipFar - shadowClipNear);

    vec3 toLightNormal = normalize(-fromLightToFragment);
    float shadowMapValue = textureCube(pointLightShadowMap, -toLightNormal).r;
    bool isLit = (shadowMapValue + 0.003) >= lightFragDist;

    vec4 texColor = mix(vec4(1.0), texture2D(u_texture, v_texcoord), textureMix);

    vec4 color = ambientProduct *  texColor;

    if (isLit) {
        // Make it look less like plastic
        float plastic = 0.1;
        float intensity = 0.4;
        vec4 pointLightColor = mix(texColor, vec4(1.0), plastic) * vec4(lambertian * diffuseProduct + specular * specularProduct);
        color += pointLightColor * intensity;
    }
    
    vec3 projectedTexcoord = v_projectedTexcoord.xyz / v_projectedTexcoord.w;
    float bias = -0.003; // shadow bias
    float currentDepth = projectedTexcoord.z + bias;

    bool inRange =
        projectedTexcoord.x >= 0.0 &&
        projectedTexcoord.x <= 1.0 &&
        projectedTexcoord.y >= 0.0 &&
        projectedTexcoord.y <= 1.0;

    float projectedDepth = texture2D(u_projectedTexture, projectedTexcoord.xy).r;
    float projectedAmount = inRange ? 1.0 : 0.0;
    float shadowLight = (inRange && projectedDepth <= currentDepth) ? 0.0 : 1.0; 

    color += vec4(color.rgb * shadowLight * 0.5, 0.0);


    return color;
}

void main()
{
    vec4 fColor;

    if (isRenderingWireframe) {
        fColor = vec4(selectedObjectColor.rgb * 0.1, 0.3);
    } else if (!isSelected) {
        fColor = calculatePhong();
        fColor.a = 1.0;
    } else {
        fColor = selectedObjectColor;
        fColor.a = 1.0;
    }

    gl_FragColor = fColor;
}