"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export interface SkyCloudsProps {
  timeOfDay: number; // 0 to 2*PI
  isBlackHoleEasterEgg?: boolean;
}

const cloudVertexShader = `
  varying vec2 vUv;
  varying vec3 vWorldPos;

  void main() {
    vUv = uv;
    vec3 pos = position;
    // Gentle parabolic curve into the deep distance so sides curve away from viewer
    pos.z -= (pos.x * pos.x) * 0.0028;
    vec4 wp = modelMatrix * vec4(pos, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * viewMatrix * wp;
  }
`;

const cloudFragmentShader = `
  varying vec2 vUv;
  varying vec3 vWorldPos;

  uniform sampler2D uTexture;
  uniform float uTime;
  uniform float uOpacity;
  uniform float uDriftSpeed;
  uniform float uTileScale;
  uniform vec2 uPixelGrid;

  void main() {
    if (uOpacity <= 0.005) discard;

    // 1. Chunky retro pixel art quantization
    vec2 pUv = floor(vUv * uPixelGrid) / uPixelGrid;

    // 2. Slow horizontal drift with seamless tiling
    float drift = uTime * uDriftSpeed;
    float u = fract(pUv.x * uTileScale + drift);
    vec2 sampleUv = vec2(u, pUv.y);

    vec4 col = texture2D(uTexture, sampleUv);

    // Alpha cutoff for crisp retro pixel art contour
    if (col.a < 0.15) discard;

    gl_FragColor = vec4(col.rgb, col.a * uOpacity);
  }
`;

export function SkyClouds({
  timeOfDay,
  isBlackHoleEasterEgg = false,
}: SkyCloudsProps) {
  const dayMatRef = useRef<THREE.ShaderMaterial>(null);
  const nightMatRef = useRef<THREE.ShaderMaterial>(null);

  // Load day and night cloud textures with NearestFilter
  const { dayTexture, nightTexture } = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const day = loader.load("/celestial/clouds_day.png");
    const night = loader.load("/celestial/clouds_night.png");

    [day, night].forEach((tex) => {
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;
      tex.generateMipmaps = false;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
    });

    return { dayTexture: day, nightTexture: night };
  }, []);

  const dayUniforms = useMemo(() => {
    return {
      uTexture: { value: dayTexture },
      uTime: { value: 0 },
      uOpacity: { value: 0.95 },
      uPixelGrid: { value: new THREE.Vector2(200.0, 72.0) }, // Chunky pixel art blocks
      uTileScale: { value: 1.0 },
      uDriftSpeed: { value: 0.0035 },
    };
  }, [dayTexture]);

  const nightUniforms = useMemo(() => {
    return {
      uTexture: { value: nightTexture },
      uTime: { value: 0 },
      uOpacity: { value: 0.0 },
      uPixelGrid: { value: new THREE.Vector2(220.0, 76.0) }, // Chunky pixel art blocks
      uTileScale: { value: 1.0 },
      uDriftSpeed: { value: 0.0028 },
    };
  }, [nightTexture]);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    const sinT = Math.sin(timeOfDay);

    // Day factor: > 0 is Day, peak at noon
    const rawDay = (sinT + 0.12) / 0.75;
    const dayFactor = Math.max(0, Math.min(1.0, rawDay));

    // Night factor: peak at midnight
    const rawNight = (-sinT + 0.12) / 0.75;
    const nightFactor = Math.max(0, Math.min(1.0, rawNight));

    if (dayMatRef.current) {
      dayMatRef.current.uniforms.uTime.value = time;
      const targetOpacity = isBlackHoleEasterEgg ? 0.0 : dayFactor * 0.96;
      dayMatRef.current.uniforms.uOpacity.value = THREE.MathUtils.lerp(
        dayMatRef.current.uniforms.uOpacity.value,
        targetOpacity,
        0.08
      );
    }

    if (nightMatRef.current) {
      nightMatRef.current.uniforms.uTime.value = time;
      const targetOpacity = isBlackHoleEasterEgg ? 0.0 : nightFactor * 0.94;
      nightMatRef.current.uniforms.uOpacity.value = THREE.MathUtils.lerp(
        nightMatRef.current.uniforms.uOpacity.value,
        targetOpacity,
        0.08
      );
    }
  });

  return (
    // Wide panoramic curved backdrop positioned safely in deep background at Z = -35.0
    // Width = 110 units (spans whole screen horizontally on all displays, no edge cutoffs)
    // Height = 17.5 units, centered at Y = 6.8 (bottom rests under waterline at Y = -1.9)
    <group position={[0, 6.8, -35.0]} raycast={() => null}>
      {/* 1. DAY PIXEL CLOUDS: Puffy cumulus framing horizon (Reference Image 2) */}
      <mesh renderOrder={-1} raycast={() => null}>
        <planeGeometry args={[110.0, 17.5, 48, 1]} />
        <shaderMaterial
          ref={dayMatRef}
          vertexShader={cloudVertexShader}
          fragmentShader={cloudFragmentShader}
          uniforms={dayUniforms}
          side={THREE.DoubleSide}
          transparent
          depthWrite={false}
        />
      </mesh>

      {/* 2. NIGHT PIXEL CLOUDS: Billowing purple/indigo layered clouds (Reference Image 4) */}
      <mesh position={[0, -0.4, 0.05]} renderOrder={-1} raycast={() => null}>
        <planeGeometry args={[110.0, 17.0, 48, 1]} />
        <shaderMaterial
          ref={nightMatRef}
          vertexShader={cloudVertexShader}
          fragmentShader={cloudFragmentShader}
          uniforms={nightUniforms}
          side={THREE.DoubleSide}
          transparent
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

export default SkyClouds;
