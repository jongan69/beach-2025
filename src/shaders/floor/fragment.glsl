uniform sampler2D tBackground;
uniform vec2 uPalmTreeScreenPositions[30]; // Palm tree positions in screen space (UV coords 0-1)
uniform int uPalmTreeCount;
uniform float uSandCircleRadius; // Radius in screen space
uniform vec3 uSandColor;

varying vec2 vUv;

void main()
{
    vec4 backgroundColor = texture(tBackground, vUv);
    vec4 oceanBlue = vec4(0.2, 0.5, 0.9, 1.0);
    vec4 baseColor = mix(backgroundColor, oceanBlue, 0.9);
    
    // Check if we're near any palm tree (in screen space)
    float sandInfluence = 0.0;
    
    for (int i = 0; i < 30; i++) {
        if (i >= uPalmTreeCount) break;
        
        vec2 palmScreenPos = uPalmTreeScreenPositions[i];
        
        // Calculate distance in screen space
        vec2 diff = vUv - palmScreenPos;
        float dist = length(diff);
        
        // Create smooth circle with softer, more stable edges
        float circleEdge = smoothstep(uSandCircleRadius + 0.04, uSandCircleRadius - 0.02, dist);
        sandInfluence = max(sandInfluence, circleEdge);
    }
    
    // Mix sand color with base color based on proximity to palm trees
    vec4 sandColor = vec4(uSandColor, 1.0);
    gl_FragColor = mix(baseColor, sandColor, sandInfluence);
}
