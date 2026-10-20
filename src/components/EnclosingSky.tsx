"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export interface EnclosingSkyProps {
  timeOfDay: number; // 0 to 2*PI (0 = Dawn, PI/2 = Noon, PI = Dusk, 3*PI/2 = Midnight)
  isBlackHoleEasterEgg?: boolean;
}

const enclosingSkyVertexShader = `
  varying vec3 vWorldPos;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const enclosingSkyFragmentShader = `
  uniform sampler2D uDayTexture;
  uniform sampler2D uDawnTexture;
  uniform sampler2D uNightTexture;
  uniform float uTime;
  uniform float uDayFactor;
  uniform float uDawnFactor;
  uniform float uNightFactor;
  uniform float uBlackHoleFactor;

  varying vec3 vWorldPos;
  varying vec2 vUv;

  void main() {
    // 1. Seamless 360-degree cylindrical projection around the square ocean
    // angle = 0 faces forward (-Z), wrapping smoothly 360 degrees
    float angle = atan(vWorldPos.x, -vWorldPos.z);
    float u = fract((angle / 6.283185307) + 0.5);

    // Subtle natural horizontal cloud drift
    float drift = uTime * 0.0016;
    float uDrift = fract(u + drift);

    // Vertical mapping calibrated to ocean perspective:
    // Ocean horizon meets cylinder at Y ≈ -11.0 to -12.0
    // Clouds frame horizon from Y = -12.0 to Y = 14.0
    // Gradient sky extends above clouds to zenith
    float v = clamp((vWorldPos.y + 12.0) / 48.0, 0.0, 1.0);

    // Check if on the top ceiling cap (Zenith)
    bool isTopCap = vWorldPos.y > 34.0;
    float zenithBlend = clamp((vWorldPos.y - 20.0) / 14.0, 0.0, 1.0);

    // 2. Day Sky Color (Image 1 reference)
    // Top sky zenith: #68b4f0 -> #74baf5
    vec3 dayZenithCol = vec3(0.408, 0.706, 0.941);
    vec4 dayTex = texture2D(uDayTexture, vec2(uDrift, v));
    vec3 daySky = mix(dayTex.rgb, dayZenithCol, zenithBlend);

    // 3. Dawn/Dusk Sky Color (Image 2 reference)
    // Top sunset zenith: #f89397 -> warm coral pink
    vec3 dawnZenithCol = vec3(0.973, 0.576, 0.592);
    vec4 dawnTex = texture2D(uDawnTexture, vec2(uDrift, v));
    vec3 dawnSky = mix(dawnTex.rgb, dawnZenithCol, zenithBlend);

    // 4. Night Space Color (Image 4 reference)
    // Tiling deep space indigo (#181329) with scattered pixel stars across walls and ceiling
    vec2 nightWallUv = vec2(fract(u * 2.5 + uTime * 0.0006), fract((vWorldPos.y + 12.0) / 28.0));
    vec2 nightCeilUv = fract(vWorldPos.xz * 0.024 + vec2(uTime * 0.0004, 0.0));
    vec2 nightUv = isTopCap ? nightCeilUv : nightWallUv;
    vec4 nightTex = texture2D(uNightTexture, nightUv);
    vec3 nightSky = nightTex.rgb;

    // 5. Diurnal blending:
    // Day -> Dawn/Sunset -> Night Space
    vec3 blendedSky = vec3(0.0);

    // At night: "Remove the sky and add the night space like the fourth image"
    if (uNightFactor > 0.001) {
      blendedSky += nightSky * uNightFactor;
    }
    if (uDayFactor > 0.001) {
      blendedSky += daySky * uDayFactor;
    }
    if (uDawnFactor > 0.001) {
      blendedSky += dawnSky * uDawnFactor;
    }

    // Black Hole easter egg forces pure pitch black cosmic void
    blendedSky = mix(blendedSky, vec3(0.0, 0.0, 0.0), uBlackHoleFactor);

    gl_FragColor = vec4(blendedSky, 1.0);
  }
`;

export function EnclosingSky({
  timeOfDay,
  isBlackHoleEasterEgg = false,
}: EnclosingSkyProps) {
  const matRef = useRef<THREE.ShaderMaterial>(null);

  // Load the 3 reference textures with NearestFilter for authentic crisp pixel art
  const { dayTex, dawnTex, nightTex } = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const day = loader.load("/celestial/sky_day.png");
    const dawn = loader.load("/celestial/sky_dawn.png");
    const night = loader.load("/celestial/space_night.png");

    [day, dawn, night].forEach((tex) => {
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;
      tex.generateMipmaps = false;
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.RepeatWrapping;
    });

    return { dayTex: day, dawnTex: dawn, nightTex: night };
  }, []);

  const uniforms = useMemo(() => {
    return {
      uDayTexture: { value: dayTex },
      uDawnTexture: { value: dawnTex },
      uNightTexture: { value: nightTex },
      uTime: { value: 0 },
      uDayFactor: { value: 1.0 },
      uDawnFactor: { value: 0.0 },
      uNightFactor: { value: 0.0 },
      uBlackHoleFactor: { value: isBlackHoleEasterEgg ? 1.0 : 0.0 },
    };
  }, [dayTex, dawnTex, nightTex]);

  useFrame(({ clock }) => {
    if (!matRef.current) return;
    const time = clock.getElapsedTime();

    // Diurnal factor calculations:
    const sinT = Math.sin(timeOfDay);
    const dayFactor = Math.max(0, Math.min(1.0, (sinT - 0.06) / 0.50));
    const nightFactor = Math.max(0, Math.min(1.0, (-sinT - 0.06) / 0.50));
    const dawnFactor = Math.max(0, Math.min(1.0, 1.0 - dayFactor - nightFactor));

    matRef.current.uniforms.uTime.value = time;
    matRef.current.uniforms.uDayFactor.value = dayFactor;
    matRef.current.uniforms.uDawnFactor.value = dawnFactor;
    matRef.current.uniforms.uNightFactor.value = nightFactor;

    const targetBh = isBlackHoleEasterEgg ? 1.0 : 0.0;
    matRef.current.uniforms.uBlackHoleFactor.value = THREE.MathUtils.lerp(
      matRef.current.uniforms.uBlackHoleFactor.value,
      targetBh,
      0.08
    );
  });

  return (
    // Enclosing 360-degree environment cylinder surrounding the entire square ocean
    // Radius = 82 (ocean corners at sqrt(45^2+45^2)=63.6, comfortably enclosed)
    // Height = 76, centered at Y = 22.0 (bottom at -16.0, top zenith at +60.0)
    <mesh position={[0, 22.0, 0]} renderOrder={-100} raycast={() => null}>
      <cylinderGeometry args={[82, 82, 76, 64, 1, false]} />
      <shaderMaterial
        ref={matRef}
        vertexShader={enclosingSkyVertexShader}
        fragmentShader={enclosingSkyFragmentShader}
        uniforms={uniforms}
        side={THREE.BackSide}
        depthWrite={false}
        depthTest={true}
        fog={false}
      />
    </mesh>
  );
}

export default EnclosingSky;
