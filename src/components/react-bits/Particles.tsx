import { Camera, Geometry, Mesh, Program, Renderer } from 'ogl';
import React, { useEffect, useRef, type CSSProperties } from 'react';

import './Particles.css';

export interface ParticlesProps {
  particleCount?: number;
  particleSpread?: number;
  speed?: number;
  particleColors?: string[];
  moveParticlesOnHover?: boolean;
  particleHoverFactor?: number;
  alphaParticles?: boolean;
  particleBaseSize?: number;
  sizeRandomness?: number;
  cameraDistance?: number;
  disableRotation?: boolean;
  pixelRatio?: number;
  className?: string;
  style?: CSSProperties;
}

const defaultColors = ['#ffffff', '#ffffff', '#ffffff'];

const hexToRgb = (hex: string): [number, number, number] => {
  let cleanHex = hex.replace(/^#/, '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex
      .split('')
      .map((c) => c + c)
      .join('');
  }
  const intVal = parseInt(cleanHex.slice(0, 6), 16);
  const r = ((intVal >> 16) & 255) / 255;
  const g = ((intVal >> 8) & 255) / 255;
  const b = (intVal & 255) / 255;
  return [r, g, b];
};

const vertexShader = /* glsl */ `
  attribute vec3 position;
  attribute vec4 random;
  attribute vec3 color;
  
  uniform mat4 modelMatrix;
  uniform mat4 viewMatrix;
  uniform mat4 projectionMatrix;
  uniform float uTime;
  uniform float uSpread;
  uniform float uBaseSize;
  uniform float uSizeRandomness;
  
  varying vec4 vRandom;
  varying vec3 vColor;
  
  void main() {
    vRandom = random;
    vColor = color;
    
    vec3 pos = position * uSpread;
    pos.z *= 10.0;
    
    vec4 mPos = modelMatrix * vec4(pos, 1.0);
    float t = uTime;
    mPos.x += sin(t * random.z + 6.28 * random.w) * mix(0.1, 1.5, random.x);
    mPos.y += sin(t * random.y + 6.28 * random.x) * mix(0.1, 1.5, random.w);
    mPos.z += sin(t * random.w + 6.28 * random.y) * mix(0.1, 1.5, random.z);
    
    vec4 mvPos = viewMatrix * mPos;

    if (uSizeRandomness == 0.0) {
      gl_PointSize = uBaseSize;
    } else {
      gl_PointSize = (uBaseSize * (1.0 + uSizeRandomness * (random.x - 0.5))) / max(length(mvPos.xyz), 0.001);
    }

    gl_Position = projectionMatrix * mvPos;
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  
  uniform float uTime;
  uniform float uAlphaParticles;
  varying vec4 vRandom;
  varying vec3 vColor;
  
  void main() {
    vec2 uv = gl_PointCoord.xy;
    float d = length(uv - vec2(0.5));
    
    if (uAlphaParticles < 0.5) {
      if (d > 0.5) {
        discard;
      }
      gl_FragColor = vec4(vColor + 0.2 * sin(uv.yxx + uTime + vRandom.y * 6.28), 1.0);
    } else {
      float circle = smoothstep(0.5, 0.35, d) * 0.85;
      if (circle < 0.01) discard;
      gl_FragColor = vec4(vColor + 0.15 * sin(uv.yxx + uTime + vRandom.y * 6.28), circle);
    }
  }
`;

export const Particles: React.FC<ParticlesProps> = ({
  particleCount = 160,
  particleSpread = 10,
  speed = 0.1,
  particleColors,
  moveParticlesOnHover = false,
  particleHoverFactor = 1,
  alphaParticles = false,
  particleBaseSize = 100,
  sizeRandomness = 1,
  cameraDistance = 20,
  disableRotation = false,
  pixelRatio = 1,
  className = '',
  style,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const mouseRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Store all dynamic properties in a ref so changes NEVER recreate the WebGL context
  const propsRef = useRef({
    particleSpread,
    speed,
    particleColors,
    moveParticlesOnHover,
    particleHoverFactor,
    alphaParticles,
    particleBaseSize,
    sizeRandomness,
    cameraDistance,
    disableRotation,
  });

  useEffect(() => {
    propsRef.current = {
      particleSpread,
      speed,
      particleColors,
      moveParticlesOnHover,
      particleHoverFactor,
      alphaParticles,
      particleBaseSize,
      sizeRandomness,
      cameraDistance,
      disableRotation,
    };
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: Renderer | null = null;
    let gl: any = null;

    try {
      const dpr = pixelRatio || (typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1);
      renderer = new Renderer({
        dpr,
        depth: false,
        alpha: true,
        premultipliedAlpha: false,
        powerPreference: 'high-performance',
      });
      gl = renderer.gl;
      gl.clearColor(0, 0, 0, 0);
      container.appendChild(gl.canvas);

      const handleContextLost = (e: Event) => {
        e.preventDefault();
      };
      gl.canvas.addEventListener('webglcontextlost', handleContextLost, false);
    } catch (e) {
      console.warn('Failed to initialize WebGL for Particles:', e);
      return;
    }

    const camera = new Camera(gl, { fov: 15 });
    camera.position.set(0, 0, propsRef.current.cameraDistance);

    const resize = () => {
      if (!container || !renderer) return;
      const width = container.clientWidth || 300;
      const height = container.clientHeight || 150;
      if (width === 0 || height === 0) return;
      renderer.setSize(width, height);
      camera.perspective({ aspect: gl.canvas.width / gl.canvas.height });
    };

    window.addEventListener('resize', resize, false);
    resize();

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      ro = new ResizeObserver(() => {
        resize();
      });
      ro.observe(container);
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!propsRef.current.moveParticlesOnHover) return;
      const rect = container.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;
      const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      mouseRef.current = { x, y };
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });

    // Initialize point cloud attributes
    const count = particleCount;
    const positions = new Float32Array(count * 3);
    const randoms = new Float32Array(count * 4);
    const colors = new Float32Array(count * 3);
    const initialPalette =
      propsRef.current.particleColors && propsRef.current.particleColors.length > 0
        ? propsRef.current.particleColors
        : defaultColors;

    for (let i = 0; i < count; i++) {
      let x: number, y: number, z: number, lenSq: number;
      do {
        x = Math.random() * 2 - 1;
        y = Math.random() * 2 - 1;
        z = Math.random() * 2 - 1;
        lenSq = x * x + y * y + z * z;
      } while (lenSq > 1 || lenSq === 0);

      const r = Math.cbrt(Math.random());
      positions.set([x * r, y * r, z * r], i * 3);
      randoms.set([Math.random(), Math.random(), Math.random(), Math.random()], i * 4);

      const col = hexToRgb(initialPalette[Math.floor(Math.random() * initialPalette.length)]);
      colors.set(col, i * 3);
    }

    const geometry = new Geometry(gl, {
      position: { size: 3, data: positions },
      random: { size: 4, data: randoms },
      color: { size: 3, data: colors },
    });

    const dpr = pixelRatio || (typeof window !== 'undefined' ? Math.min(window.devicePixelRatio || 1, 2) : 1);
    const program = new Program(gl, {
      vertex: vertexShader,
      fragment: fragmentShader,
      uniforms: {
        uTime: { value: 0 },
        uSpread: { value: propsRef.current.particleSpread },
        uBaseSize: { value: propsRef.current.particleBaseSize * dpr },
        uSizeRandomness: { value: propsRef.current.sizeRandomness },
        uAlphaParticles: { value: propsRef.current.alphaParticles ? 1.0 : 0.0 },
      },
      transparent: true,
      depthTest: false,
    });

    const mesh = new Mesh(gl, {
      mode: gl.POINTS,
      geometry,
      program,
    });

    let rafId: number;
    let lastTime = performance.now();
    let elapsed = 0;
    let lastPaletteKey = (initialPalette || []).join(',');

    const update = (now: number) => {
      rafId = requestAnimationFrame(update);
      const props = propsRef.current;
      const delta = now - lastTime;
      lastTime = now;

      elapsed += delta * props.speed;
      program.uniforms.uTime.value = elapsed * 0.001;
      program.uniforms.uSpread.value = props.particleSpread;
      program.uniforms.uBaseSize.value = props.particleBaseSize * dpr;
      program.uniforms.uSizeRandomness.value = props.sizeRandomness;
      program.uniforms.uAlphaParticles.value = props.alphaParticles ? 1.0 : 0.0;
      camera.position.z = props.cameraDistance;

      // Smooth color morph if palette changed
      const currentPalette = props.particleColors && props.particleColors.length > 0 ? props.particleColors : defaultColors;
      const currentKey = currentPalette.join(',');
      if (currentKey !== lastPaletteKey) {
        lastPaletteKey = currentKey;
        const colAttr = geometry.attributes.color;
        if (colAttr && colAttr.data) {
          const data = colAttr.data as Float32Array;
          for (let i = 0; i < count; i++) {
            const c = hexToRgb(currentPalette[Math.floor(Math.random() * currentPalette.length)]);
            data.set(c, i * 3);
          }
          colAttr.needsUpdate = true;
        }
      }

      if (props.moveParticlesOnHover) {
        mesh.position.x = -mouseRef.current.x * props.particleHoverFactor;
        mesh.position.y = -mouseRef.current.y * props.particleHoverFactor;
      } else {
        mesh.position.x = 0;
        mesh.position.y = 0;
      }

      if (!props.disableRotation) {
        mesh.rotation.x = Math.sin(elapsed * 0.0002) * 0.1;
        mesh.rotation.y = Math.cos(elapsed * 0.0005) * 0.15;
        mesh.rotation.z += 0.008 * props.speed;
      }

      renderer.render({ scene: mesh, camera });
    };

    rafId = requestAnimationFrame(update);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      if (ro) ro.disconnect();

      if (gl && gl.canvas && container.contains(gl.canvas)) {
        container.removeChild(gl.canvas);
      }

      // CRITICAL: Explicitly release WebGL context so browser never runs out of contexts
      if (gl) {
        try {
          const loseExt = gl.getExtension('WEBGL_lose_context');
          if (loseExt) {
            loseExt.loseContext();
          }
        } catch (_) {}
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [particleCount]);

  return (
    <div
      ref={containerRef}
      className={`particles-container ${className}`.trim()}
      style={style}
      aria-hidden="true"
    />
  );
};

export default Particles;
