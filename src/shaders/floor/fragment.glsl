uniform sampler2D tBackground;

varying vec2 vUv;

void main()
{
    vec4 backgroundColor = texture(tBackground, vUv);
    vec4 oceanBlue = vec4(0.2, 0.5, 0.9, 1.0);
    gl_FragColor = mix(backgroundColor, oceanBlue, 0.6);
}
