/**
 * VOICE CHAOS - WebGL GLSL Procedural Shaders
 * 
 * Living 3D energy waveform driven by audio amplitude, frequency, and agent state.
 */

export const vertexShader = /* glsl */ `
  uniform float uTime;
  uniform float uAudioLevel;
  uniform float uFrequency;
  uniform float uEnergy;
  uniform float uState; // 0: idle, 1: listening, 2: thinking, 3: speaking, 4: error

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vViewDir;
  varying float vDisplacement;
  varying float vAudio;

  // Simplex 3D noise
  vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
  vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}

  float snoise(vec3 v){
    const vec2 C = vec2(1.0/6.0, 1.0/3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

    vec3 i  = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);

    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);

    vec3 x1 = x0 - i1 + 1.0 * C.xxx;
    vec3 x2 = x0 - i2 + 2.0 * C.xxx;
    vec3 x3 = x0 - 1.0 + 3.0 * C.xxx;

    i = mod(i, 289.0);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));

    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;

    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);

    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);

    vec4 x = x_ *ns.x + ns.yyyy;
    vec4 y = y_ *ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);

    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);

    vec4 s0 = floor(b0)*2.0 + 1.0;
    vec4 s1 = floor(b1)*2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));

    vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;

    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);

    vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
    p0 *= norm.x;
    p1 *= norm.y;
    p2 *= norm.z;
    p3 *= norm.w;

    vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
    m = m * m;
    return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
  }

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = position;
    vAudio = uAudioLevel;

    // Organic harmonic wave calculations
    float speed = (uState == 2.0) ? 0.6 : (uState == 1.0 || uState == 3.0) ? 2.2 : 1.0;
    float time = uTime * speed;

    // Base multi-octave noise
    float noise1 = snoise(position * 1.5 + vec3(time * 0.4));
    float noise2 = snoise(position * 3.0 - vec3(time * 0.6)) * 0.5;
    float noise3 = snoise(position * 6.0 + vec3(time * 0.8)) * 0.25;
    float combinedNoise = noise1 + noise2 + noise3;

    // Dynamic audio displacement
    float audioAmp = uAudioLevel * 0.75 + uEnergy * 0.4;
    
    // State specific amplitude modulation
    float baseDisplacement = 0.08;
    if (uState == 1.0) { // LISTENING
      baseDisplacement = 0.16 + uAudioLevel * 0.65;
    } else if (uState == 2.0) { // THINKING
      baseDisplacement = 0.12 + sin(time * 3.0) * 0.08;
    } else if (uState == 3.0) { // SPEAKING
      baseDisplacement = 0.20 + uAudioLevel * 0.85;
    } else if (uState == 4.0) { // ERROR
      baseDisplacement = 0.05 + sin(time * 8.0) * 0.04;
    }

    float displacement = combinedNoise * (baseDisplacement + audioAmp);
    vDisplacement = displacement;

    vec3 newPosition = position + normal * displacement;
    vec4 mvPosition = modelViewMatrix * vec4(newPosition, 1.0);
    vViewDir = normalize(-mvPosition.xyz);

    gl_Position = projectionMatrix * mvPosition;
  }
`

export const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uAudioLevel;
  uniform float uState; // 0: idle, 1: listening, 2: thinking, 3: speaking, 4: error

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying vec3 vViewDir;
  varying float vDisplacement;
  varying float vAudio;

  void main() {
    // Elegant Fresnel grazing angle
    float fresnel = pow(1.0 - max(0.0, dot(vNormal, vViewDir)), 2.8);
    float innerGlow = pow(1.0 - max(0.0, dot(vNormal, vViewDir)), 1.4);

    // Color definitions
    vec3 colorCore = vec3(0.02, 0.01, 0.04); // Deep void black/violet core

    // Palette based on state
    vec3 rimColorA;
    vec3 rimColorB;
    vec3 specularHighlight = vec3(1.0, 1.0, 1.0);

    if (uState == 1.0) {
      // LISTENING: Glowing cyan & electric blue
      rimColorA = vec3(0.02, 0.75, 0.95); // Cyan
      rimColorB = vec3(0.06, 0.85, 0.55); // Neon Seafoam
    } else if (uState == 2.0) {
      // THINKING: Deep mystery magenta & electric purple
      rimColorA = vec3(0.65, 0.15, 0.95); // Purple
      rimColorB = vec3(0.95, 0.20, 0.60); // Magenta
    } else if (uState == 3.0) {
      // SPEAKING: Radiant ultraviolet & neon indigo & cyan flashes
      rimColorA = vec3(0.55, 0.22, 1.00); // Electric Violet
      rimColorB = vec3(0.10, 0.85, 1.00); // Cyan flare
    } else if (uState == 4.0) {
      // ERROR: Crimson warning pulse
      rimColorA = vec3(0.95, 0.10, 0.20);
      rimColorB = vec3(0.40, 0.02, 0.05);
    } else {
      // IDLE: Mysterious bioluminescent deep violet & soft cyan
      rimColorA = vec3(0.50, 0.25, 0.95);
      rimColorB = vec3(0.18, 0.55, 0.90);
    }

    // Dynamic harmonic color mixing
    float colorMix = sin(vPosition.y * 3.0 + uTime * 1.5 + vDisplacement * 4.0) * 0.5 + 0.5;
    vec3 currentRim = mix(rimColorA, rimColorB, colorMix);

    // Chromatic dispersion at edges
    vec3 dispersed = currentRim;
    dispersed.r += fresnel * 0.15 * sin(uTime * 2.0);
    dispersed.b += fresnel * 0.20 * cos(uTime * 2.5);

    // Composite final color
    vec3 finalColor = mix(colorCore, dispersed, innerGlow * 0.85);
    finalColor += dispersed * (fresnel * 1.4);
    
    // Add audio-reactive brilliant specular crests
    float audioBoost = uAudioLevel * 0.8;
    finalColor += specularHighlight * pow(fresnel, 4.0) * (0.8 + audioBoost);

    // Subtle breathing alpha
    float alpha = clamp(0.75 + fresnel * 0.5 + vAudio * 0.2, 0.0, 1.0);

    gl_FragColor = vec4(finalColor, alpha);
  }
`
