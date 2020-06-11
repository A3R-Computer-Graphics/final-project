
precision mediump float;

// Texture setup

varying vec2 v_texcoord;
uniform sampler2D u_texture;

uniform vec3 lightPosition;

varying vec3 v_camNorm;  // Surface normal
varying vec3 v_camPos;       // Vertex position
varying vec3 v_camLightPos;  // Light position, interpolated
varying vec3 v_pos;
varying vec3 v_worldNorm;

uniform vec4 ambientColor, pointLightDiffuseColor, pointLightSpecularColor;
uniform vec4 materialDiffuseColor, materialSpecularColor;
uniform float shininess;

// Flag to indicate if object is selected or not
uniform bool isSelected;

// Small patch to mix value between texture and calculated phong
// This is handy to make sure the material that doesn't have image texture
// will not use any Texture2D
uniform float textureMix;
uniform bool isRenderingWireframe;


// Generic light setup

uniform float pointLightIntensity;
uniform float directionalLightIntensity;
uniform float spotlightIntensity;

// Directional light setup
uniform vec3 u_reverseLightDirection;

// Point light shadow map setup
uniform samplerCube pointLightShadowMap;
uniform float shadowClipNear;
uniform float shadowClipFar;

// Spotlight setup
uniform float u_innerLimit;          // in dot space
uniform float u_outerLimit;          // in dot space
uniform vec3 u_lightDirection;
varying vec3 v_surfaceToLight;
varying vec3 v_surfaceToView;

// non-point light shadow map setup
varying vec4 v_projectedTexcoord_dir;
varying vec4 v_projectedTexcoord_spot;
uniform sampler2D u_projectedTexture_dir;
uniform sampler2D u_projectedTexture_spot;

// Constants

const float pointLightShadowBias = 0.003;
const float directionalLightShadowBias = 0.003;
const float spotlightShadowBias = 0.006;
const vec4 selectedObjectColor = vec4(0.0/255.0, 123.0/255.0, 255.0/255.0, 1.0);

// Color Picker
uniform vec3 u_directionalLightColor;
uniform vec3 u_spotLightColor;

uniform bool u_softShadow;

uniform bool emissive;
uniform vec4 emissiveColor;



float textureCubeCompare(samplerCube depths, vec3 uv, float compare){
    vec3 toLightNormal = normalize(-uv);
    float depth = textureCube(depths, uv).r;
    return step(compare, depth + pointLightShadowBias);
}

float texture2DCompare(sampler2D depths, vec2 uv, float compare){
    float depth = texture2D(depths, uv).r;
    return step(compare, depth + directionalLightShadowBias);
}

float texture2DCompare(sampler2D depths, vec2 uv, float compare, float bias){
    float depth = texture2D(depths, uv).r;
    return step(compare, depth + bias);
}


float texture2DShadowLerp(sampler2D depths, vec2 size, vec2 uv, float compare){
    vec2 texelSize = vec2(1.0)/size;
    vec2 f = fract(uv*size+0.5);
    vec2 centroidUV = floor(uv*size+0.5)/size;

    float lb = texture2DCompare(depths, centroidUV+texelSize*vec2(0.0, 0.0), compare);
    float lt = texture2DCompare(depths, centroidUV+texelSize*vec2(0.0, 1.0), compare);
    float rb = texture2DCompare(depths, centroidUV+texelSize*vec2(1.0, 0.0), compare);
    float rt = texture2DCompare(depths, centroidUV+texelSize*vec2(1.0, 1.0), compare);

    float a = mix(lb, lt, f.y);
    float b = mix(rb, rt, f.y);
    float c = mix(a, b, f.x);
    
    return c;
}

float texture2DShadowLerp(sampler2D depths, vec2 size, vec2 uv, float compare, float bias){
    vec2 texelSize = vec2(1.0)/size;
    vec2 f = fract(uv*size+0.5);
    vec2 centroidUV = floor(uv*size+0.5)/size;

    float lb = texture2DCompare(depths, centroidUV+texelSize*vec2(0.0, 0.0), compare, bias);
    float lt = texture2DCompare(depths, centroidUV+texelSize*vec2(0.0, 1.0), compare, bias);
    float rb = texture2DCompare(depths, centroidUV+texelSize*vec2(1.0, 0.0), compare, bias);
    float rt = texture2DCompare(depths, centroidUV+texelSize*vec2(1.0, 1.0), compare, bias);

    float a = mix(lb, lt, f.y);
    float b = mix(rb, rt, f.y);
    float c = mix(a, b, f.x);
    
    return c;
}


float PCF(samplerCube depths, vec3 size, vec3 uv, float compare){
    float result = 0.0;
    for(int x=-1; x<=1; x++){
        for(int y=-1; y<=1; y++){
            for(int z=-1; z<=1; z++){
                vec3 off = vec3(x,y,z)/size;
                result += textureCubeCompare(depths, uv+off, compare);
            }
        }
    }
    return result/27.0;
}

float PCFAndLinerp(sampler2D depths, vec2 size, vec2 uv, float compare, float bias){
    float result = 0.0;
    for(int x=-1; x<=1; x++){
        for(int y=-1; y<=1; y++){
            vec2 off = vec2(x,y)/size;
            result += texture2DShadowLerp(depths, size, uv+off, compare, bias);
        }
    }
    return result/9.0;
}



float pointLightShadowValue() {
    vec3 fromLightToFragment = (v_pos - lightPosition);

    vec3 toLightNormal = normalize(-fromLightToFragment);

    float lightDepth2 = (length(fromLightToFragment) - shadowClipNear)
    / (shadowClipFar - shadowClipNear);

    if (u_softShadow) {
        return PCF(pointLightShadowMap, vec3(50.0), fromLightToFragment, lightDepth2);
    } else {
        // Light depth 1 => from shadow map, light depth 2 => from light pos to fragment
        float lightDepth1 = textureCube(pointLightShadowMap, -toLightNormal).r;
        return step(lightDepth2, lightDepth1 + pointLightShadowBias); 
    }
}


float directionalLightShadowValue() {    
    vec3 projectedTexcoord = v_projectedTexcoord_dir.xyz / v_projectedTexcoord_dir.w;

    bool inRange =
        projectedTexcoord.x >= 0.0 &&
        projectedTexcoord.x <= 1.0 &&
        projectedTexcoord.y >= 0.0 &&
        projectedTexcoord.y <= 1.0;
    
    if (u_softShadow) {
        return texture2DShadowLerp(u_projectedTexture_dir, vec2(500.0), projectedTexcoord.xy, projectedTexcoord.z);
    } else {

        float projectedDepth = texture2D(u_projectedTexture_dir, projectedTexcoord.xy).r;
        float projectedAmount = inRange ? 1.0 : 0.0;

        float currentDepth = projectedTexcoord.z;
        return 1.0 - float(inRange && projectedDepth + directionalLightShadowBias <= currentDepth);
    }
}


float spotLightShadowValue() {    
    vec3 projectedTexcoord = v_projectedTexcoord_spot.xyz / v_projectedTexcoord_spot.w;

    bool inRange =
        projectedTexcoord.x >= 0.0 &&
        projectedTexcoord.x <= 1.0 &&
        projectedTexcoord.y >= 0.0 &&
        projectedTexcoord.y <= 1.0;
    
    if (u_softShadow) {
        return PCFAndLinerp(u_projectedTexture_spot, vec2(200.0), projectedTexcoord.xy, projectedTexcoord.z, spotlightShadowBias);
    } else {
        float projectedDepth = texture2D(u_projectedTexture_spot, projectedTexcoord.xy).r;
        float projectedAmount = inRange ? 1.0 : 0.0;
    
        float currentDepth = projectedTexcoord.z;
        return 1.0 - float(inRange && projectedDepth + spotlightShadowBias <= currentDepth);
    }
}



vec4 defaultShader() {
    // constants
    float plastic = 0.1;

    vec3 spotlightColor = u_spotLightColor; // red + green = yellow;
    vec3 directionalLightColor = u_directionalLightColor; // a little bit violet


    vec4 baseColor = mix(materialDiffuseColor, texture2D(u_texture, v_texcoord), textureMix);

    if (emissive) {
        return baseColor;
    }

    vec4 color = vec4((ambientColor *  baseColor).rgb, 1.0);
    vec3 normal = normalize(v_worldNorm);

    // This is based on personal observation, not some empirical source
    vec4 plasticColor = mix(baseColor, emissiveColor, plastic);

    // Calculate point light
    
    vec3 N = normalize(v_camNorm);
    vec3 L = normalize(v_camLightPos - v_camPos);
    vec3 E = normalize(-v_camPos);
    vec3 H = normalize(L + E); // Half vector

    // Compute diffuse reflection
    float lambertian = max(dot(N, L), 0.0);

    float specular = 0.0;
    if (lambertian > 0.0) {
        // Compute specular reflection term
        float specAngle = max(dot(N, H), 0.0);
        specular = pow(specAngle, shininess);
    }


    // Apply point light shadow

    float shadowMix; // The larger the value, the darker it is

    float power = 1.0 / length(v_pos - lightPosition);

    shadowMix = pointLightShadowValue();

    vec4 diffuseColor = mix(materialDiffuseColor, texture2D(u_texture, v_texcoord), textureMix);
    diffuseColor *= lambertian * pointLightDiffuseColor * pointLightIntensity;

    vec4 specularColor = mix(materialSpecularColor, texture2D(u_texture, v_texcoord), textureMix);
    specularColor *= specular * pointLightSpecularColor * pointLightIntensity;

    color += (diffuseColor + specularColor) * shadowMix * power;

    float light = 0.0;

    // Compute directional light

    light = max(dot(normal, u_reverseLightDirection), 0.0) * directionalLightIntensity;

    // Apply directional light shadow

    shadowMix = directionalLightShadowValue();
    color += vec4(plasticColor.rgb * directionalLightColor * shadowMix * light, 0.0);


    // Compute spotlight

    vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
    vec3 surfaceToViewDirection = normalize(v_surfaceToView);
    vec3 halfVector = normalize(surfaceToLightDirection + surfaceToViewDirection);
    float dotFromDirection = dot(surfaceToLightDirection,
                                -u_lightDirection);
                                
    float limitRange = u_innerLimit - u_outerLimit;
    float inLight = clamp((dotFromDirection - u_outerLimit) / limitRange, 0.0, 1.0);
    light = inLight * dot(normal, surfaceToLightDirection);
    specular = inLight * pow(dot(normal, halfVector), shininess);
    light = max(light, 0.0);

    power = spotlightIntensity / length(v_surfaceToLight);

    // Apply spotlight shadow

    shadowMix = spotLightShadowValue();
    vec3 spotlight = plasticColor.rgb * spotlightColor * light + vec3(1.0) * specular;
    spotlight *= power * shadowMix;
    spotlight = max(spotlight, vec3(0.0));

    color += vec4(spotlight, 0.0);
    
    
    return color;
}

void main()
{
    vec4 fColor;

    if (isRenderingWireframe) {
        fColor = vec4(selectedObjectColor.rgb * 0.4 + float(isSelected), 0.3);
    } else if (!isSelected) {
        fColor = defaultShader();
    } else {
        fColor = selectedObjectColor;
    }

    gl_FragColor = fColor;
}