"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export interface BlackHoleProps {
  position?: [number, number, number];
  scale?: number;
  pixelGrid?: number;
  flicker?: boolean;
  flickerIntensity?: number;
}

// 1. Accretion Disk & Gravitational Lensing Shader with 3D Object-Space Pixel Quantization
const diskVertexShader = `
  varying vec2 vLocalPos;
  varying vec3 vWorldPos;

  void main() {
    vLocalPos = position.xy;
    vWorldPos = (modelMatrix * vec4(position, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const diskFragmentShader = `
  uniform float uTime;
  uniform float uInnerRadius;
  uniform float uOuterRadius;
  uniform float uIsLensing; // 1.0 for vertical lensing arch, 0.0 for horizontal disk
  uniform float uPixelGrid;
  uniform float uFlicker;

  varying vec2 vLocalPos;
  varying vec3 vWorldPos;

  float hash21(vec2 p) {
    p = fract(p * vec2(233.34, 851.73));
    p += dot(p, p + 23.45);
    return fract(p.x * p.y);
  }

  void main() {
    // 1. CHUNKY 3D PIXEL QUANTIZATION IN OBJECT SPACE
    // Quantizing in the tilted 3D plane creates authentic retro 3D pixel art that tilts and foreshortens with camera
    vec2 p = floor(vLocalPos * uPixelGrid) / uPixelGrid;
    float r = length(p);
    float angle = atan(p.y, p.x);

    // Hard pixelated boundary discard: creates crisp stairstepped pixel-art edges
    if (r < uInnerRadius || r > uOuterRadius) {
      discard;
    }

    float normR = clamp((r - uInnerRadius) / (uOuterRadius - uInnerRadius), 0.0, 1.0);

    // 2. Relativistic plasma striations evaluated at discrete pixel centers
    float rotTime = uTime * 1.5;
    float ring1 = sin(normR * 52.0 - rotTime + angle * 2.0);
    float ring2 = cos(normR * 92.0 + rotTime * 1.2 - angle * 3.0);
    float ring3 = sin(normR * 26.0 - rotTime * 0.7 + angle);
    float plasma = ring1 * 0.42 + ring2 * 0.28 + ring3 * 0.3;

    // 3. Stepped 7-tone retro pixel-art color palette matching Reference Image 2:
    // Pure White -> Ice Blue -> Electric Cyan -> Royal Azure -> Amber Gold -> Copper Rust -> Deep Void
    vec3 colWhite     = vec3(1.0, 1.0, 1.0);
    vec3 colIce       = vec3(0.78, 0.90, 1.0);
    vec3 colCyan      = vec3(0.36, 0.75, 0.98);
    vec3 colAzure     = vec3(0.11, 0.52, 0.96);
    vec3 colAmberGold = vec3(1.0, 0.68, 0.24);
    vec3 colCopper    = vec3(0.85, 0.38, 0.12);
    vec3 colDarkRust  = vec3(0.42, 0.15, 0.04);

    // Stepped radial color bands modulated by plasma swirls
    float colorBand = clamp(normR + plasma * 0.09, 0.0, 1.0);

    vec3 baseCol;
    if (colorBand < 0.10) {
      baseCol = colWhite;
    } else if (colorBand < 0.24) {
      baseCol = colIce;
    } else if (colorBand < 0.42) {
      baseCol = colCyan;
    } else if (colorBand < 0.60) {
      baseCol = colAzure;
    } else if (colorBand < 0.78) {
      baseCol = colAmberGold;
    } else if (colorBand < 0.92) {
      baseCol = colCopper;
    } else {
      baseCol = colDarkRust;
    }

    // 4. Relativistic Doppler beaming:
    // Matter orbiting towards observer is stepped brighter; receding side is dimmer
    float dopplerRaw = 1.0 - 0.36 * sin(angle);
    if (uIsLensing > 0.5) {
      dopplerRaw = 1.0 + 0.30 * abs(sin(angle));
    }
    // Quantize Doppler into discrete stepped brightness levels
    float doppler = floor(dopplerRaw * 4.0) / 4.0;

    // Extra photon ring intensity at the innermost pixel ring
    if (normR < 0.07) {
      baseCol = colWhite;
      doppler = max(doppler, 1.25);
    }

    vec3 finalCol = baseCol * doppler * uFlicker;
    gl_FragColor = vec4(finalCol, 0.98);
  }
`;

// 2. Pixelated 3D Event Horizon Singularity Shadow Shader
const horizonVertexShader = `
  varying vec3 vLocalPos;
  void main() {
    vLocalPos = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const horizonFragmentShader = `
  uniform float uPixelGrid;
  uniform float uRadius;
  varying vec3 vLocalPos;

  void main() {
    vec2 p = floor(vLocalPos.xy * uPixelGrid) / uPixelGrid;
    if (length(p) > uRadius) {
      discard;
    }
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
  }
`;

// 3. Pixelated Photon Ring Halo Shader
const photonVertexShader = `
  varying vec2 vLocalPos;
  void main() {
    vLocalPos = position.xy;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const photonFragmentShader = `
  uniform float uPixelGrid;
  uniform float uInner;
  uniform float uOuter;
  uniform float uFlicker;
  varying vec2 vLocalPos;

  void main() {
    vec2 p = floor(vLocalPos * uPixelGrid) / uPixelGrid;
    float r = length(p);
    if (r < uInner || r > uOuter) {
      discard;
    }
    gl_FragColor = vec4(1.0, 1.0, 1.0, 0.98 * uFlicker);
  }
`;

export function BlackHole({
  position = [0, 4.4, -20.5],
  scale = 1.85,
  pixelGrid = 9.0, // Matches water caustic pixel density (~8.5 - 9.0)
  flicker = true,
  flickerIntensity = 1.0,
}: BlackHoleProps) {
  const groupRef = useRef<THREE.Group>(null);
  const diskMatRef = useRef<THREE.ShaderMaterial>(null);
  const lensingMatRef = useRef<THREE.ShaderMaterial>(null);
  const photonMatRef = useRef<THREE.ShaderMaterial>(null);
  const diskMeshRef = useRef<THREE.Mesh>(null);
  const photonRingRef = useRef<THREE.Mesh>(null);

  const diskUniforms = useMemo(() => {
    return {
      uTime: { value: 0 },
      uInnerRadius: { value: 2.26 },
      uOuterRadius: { value: 13.5 }, // Significantly larger outer accretion disk rings!
      uIsLensing: { value: 0.0 },
      uPixelGrid: { value: pixelGrid },
      uFlicker: { value: 1.0 },
    };
  }, [pixelGrid]);

  const lensingUniforms = useMemo(() => {
    return {
      uTime: { value: 0 },
      uInnerRadius: { value: 2.22 },
      uOuterRadius: { value: 7.2 }, // Expanded vertical gravitational lensing arch!
      uIsLensing: { value: 1.0 },
      uPixelGrid: { value: pixelGrid },
      uFlicker: { value: 1.0 },
    };
  }, [pixelGrid]);

  const horizonUniforms = useMemo(() => {
    return {
      uPixelGrid: { value: pixelGrid },
      uRadius: { value: 2.21 },
    };
  }, [pixelGrid]);

  const photonUniforms = useMemo(() => {
    return {
      uPixelGrid: { value: pixelGrid },
      uInner: { value: 2.21 },
      uOuter: { value: 2.36 },
      uFlicker: { value: 1.0 },
    };
  }, [pixelGrid]);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();

    // Multi-frequency turbulent plasma flicker with rapid quantum micro-bursts
    let currentFlicker = 1.0;
    if (flicker) {
      const f1 = Math.sin(time * 19.3) * 0.16;
      const f2 = Math.cos(time * 31.7) * 0.13;
      const f3 = Math.sin(time * 53.1) * 0.09;
      const micro = (Math.sin(time * 79.5) > 0.62 ? 0.22 : 0.0);
      currentFlicker = Math.max(0.40, Math.min(1.45, 0.92 + (f1 + f2 + f3 + micro) * flickerIntensity));
    }

    if (diskMatRef.current) {
      diskMatRef.current.uniforms.uTime.value = time;
      diskMatRef.current.uniforms.uFlicker.value = currentFlicker;
    }
    if (lensingMatRef.current) {
      lensingMatRef.current.uniforms.uTime.value = time;
      lensingMatRef.current.uniforms.uFlicker.value = currentFlicker;
    }
    if (photonMatRef.current) {
      photonMatRef.current.uniforms.uFlicker.value = currentFlicker;
    }

    // Gentle micro-rotation of the accretion disk around black hole
    if (diskMeshRef.current) {
      diskMeshRef.current.rotation.z = time * 0.08;
    }

    // Pulsing shimmer on photon ring
    if (photonRingRef.current) {
      const pulse = 0.96 + Math.sin(time * 3.2) * 0.04;
      photonRingRef.current.scale.set(pulse, pulse, 1);
    }
  });

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {/* Dynamic Cosmic Light Source radiating from the Black Hole */}
      <pointLight args={[0xd4edff, 2.5, 65]} position={[0, 0, 2]} />
      <directionalLight
        args={[0xd8f0ff, 1.6]}
        position={[0, 6, 8]}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />

      {/* 1. VERTICAL GRAVITATIONAL LENSING ARCH (Pixelated, loops over top & bottom) */}
      <mesh position={[0, 0, -0.06]}>
        <planeGeometry args={[15.6, 15.6]} />
        <shaderMaterial
          ref={lensingMatRef}
          vertexShader={diskVertexShader}
          fragmentShader={diskFragmentShader}
          uniforms={lensingUniforms}
          transparent
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* 2. THE EVENT HORIZON (Pixelated 3D Sphere - occludes back half of accretion disk) */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[2.22, 48, 48]} />
        <shaderMaterial
          vertexShader={horizonVertexShader}
          fragmentShader={horizonFragmentShader}
          uniforms={horizonUniforms}
        />
      </mesh>

      {/* 3. INNER PHOTON RING (Thin, intense pixelated halo hugging horizon) */}
      <mesh ref={photonRingRef} position={[0, 0, 0.02]}>
        <planeGeometry args={[5.2, 5.2]} />
        <shaderMaterial
          ref={photonMatRef}
          vertexShader={photonVertexShader}
          fragmentShader={photonFragmentShader}
          uniforms={photonUniforms}
          transparent
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* 4. EQUATORIAL ACCRETION DISK (Tilted horizontally passing across black hole) */}
      <group rotation={[Math.PI * 0.44, 0, 0]}>
        <mesh ref={diskMeshRef}>
          <planeGeometry args={[28.0, 28.0]} />
          <shaderMaterial
            ref={diskMatRef}
            vertexShader={diskVertexShader}
            fragmentShader={diskFragmentShader}
            uniforms={diskUniforms}
            transparent
            side={THREE.DoubleSide}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      </group>
    </group>
  );
}

export default BlackHole;
