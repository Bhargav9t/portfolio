"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export interface WaterCausticOceanProps {
  oceanSize?: number;
  oceanFragments?: number;
  waveSpeed?: number;
  waveAmplitude?: number;
  timeOfDay?: number;
  accentColor?: number;
  blackHolePos?: [number, number, number];
  suctionIntensity?: number;
  isBlackHoleEasterEgg?: boolean;
}

const oceanVertexShader = `
  uniform float uTime;
  uniform float uWaveSpeed;
  uniform float uWaveAmp;
  uniform vec3 uBlackHolePos;
  uniform float uSuctionIntensity;

  varying vec2 vUv;
  varying vec3 vWorldPos;
  varying float vWaveElevation;
  varying float vDistBH;
  varying float vFunnelDepth;
  varying float vSuctionPower;

  void main() {
    vUv = uv;
    vec3 pos = position;

    float speedRatio = uWaveSpeed / 0.05;
    float t = uTime * 0.75 * speedRatio;

    // Local plane to world XZ:
    // With group rotation [-PI/2, 0, 0]:
    // Local pos.x is world X, Local -pos.y is world Z!
    vec2 vertXZ = vec2(pos.x, -pos.y);
    vec2 toBH = uBlackHolePos.xz - vertXZ;
    float distBH = length(toBH);
    vec2 dirBH = toBH / (distBH + 0.0001);

    // 1. Ambient multi-harmonic ocean wave ripples
    float w1 = sin(pos.x * 0.32 + pos.y * 0.28 + t * 1.6) * (0.10 * (uWaveAmp / 0.2));
    float w2 = cos(pos.x * 0.24 - pos.y * 0.36 + t * 1.2) * (0.07 * (uWaveAmp / 0.2));
    float w3 = sin(length(pos.xy) * 0.28 - t * 1.8) * (0.05 * (uWaveAmp / 0.2));
    float ambientWave = w1 + w2 + w3;

    // 2. Gravitational Suction Waves (Relativistic Inward Accretion Swirl)
    // Waves accelerate and spiral inward toward the black hole
    float angleBH = atan(toBH.y, toBH.x);
    float swirlPhase = distBH * 1.15 - t * 4.2 + angleBH * 3.0;
    float suctionWave1 = sin(swirlPhase) * (0.24 * (uWaveAmp / 0.2));
    float suctionWave2 = cos(distBH * 1.8 - t * 5.6 + angleBH * 5.0) * (0.15 * (uWaveAmp / 0.2));

    // Acceleration & steepening near the vortex
    float surgeZone = clamp(1.0 - (distBH / 38.0), 0.0, 1.0);
    float vortexHarmonics = (suctionWave1 + suctionWave2) * (0.4 + 2.0 * pow(surgeZone, 1.5));

    // 3. Spacetime Gravitational Funnel (Deep waterfall / whirlpool depression)
    // Curving the ocean surface downward towards the singularity
    float funnelFalloff = 1.0 / (1.0 + pow(distBH / 5.6, 2.1));
    float funnel = - (uSuctionIntensity * 4.6) * funnelFalloff;

    // 4. Inward Mesh Spaghettification (displacing vertices horizontally toward blackhole)
    float horizPull = (uSuctionIntensity * 2.6) / (1.0 + distBH * 0.4);
    pos.x += dirBH.x * horizPull;
    pos.y -= dirBH.y * horizPull; // -pos.y pulls towards +worldZ

    // Combine total elevation
    float totalWave = ambientWave * (1.0 - surgeZone * 0.6) + vortexHarmonics * uSuctionIntensity + funnel;
    pos.z += totalWave; // displaces vertically in world space

    vWaveElevation = totalWave;
    vDistBH = distBH;
    vFunnelDepth = funnel;
    vSuctionPower = uSuctionIntensity * surgeZone;

    vWorldPos = (modelMatrix * vec4(pos, 1.0)).xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const oceanFragmentShader = `
  uniform float uTime;
  uniform float uWaveSpeed;
  uniform vec3 uColorWhite;
  uniform vec3 uColorIce;
  uniform vec3 uColorSky;
  uniform vec3 uColorVibrant;
  uniform vec3 uColorDeep;
  uniform vec3 uBlackHolePos;
  uniform float uSuctionIntensity;
  uniform float uOceanSize;

  varying vec2 vUv;
  varying vec3 vWorldPos;
  varying float vWaveElevation;
  varying float vDistBH;
  varying float vFunnelDepth;
  varying float vSuctionPower;

  // 2D Hash function for Voronoi cell seeds
  vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return fract(sin(p) * 43758.5453123);
  }

  // Smooth Voronoi returning:
  // x: distance to closest cell center (F1)
  // y: distance to second closest cell center (F2)
  // z, w: vector from closest cell center to sample point
  vec4 voronoiCaustic(vec2 x, float time) {
    vec2 n = floor(x);
    vec2 f = fract(x);

    float m1 = 8.0;
    float m2 = 8.0;
    vec2 bestR = vec2(0.0);

    for (int j = -1; j <= 1; j++) {
      for (int i = -1; i <= 1; i++) {
        vec2 g = vec2(float(i), float(j));
        vec2 o = hash2(n + g);
        vec2 offset = sin(time + 6.2831853 * o) * 0.42;
        vec2 r = g + o + offset - f;
        float d = dot(r, r);

        if (d < m1) {
          m2 = m1;
          m1 = d;
          bestR = r;
        } else if (d < m2) {
          m2 = d;
        }
      }
    }
    return vec4(sqrt(m1), sqrt(m2), bestR.x, bestR.y);
  }

  void main() {
    // 1. Crisp 2D Pixel Quantization in World Space
    float pixelGrid = 8.5;
    vec2 pPixel = floor(vWorldPos.xz * pixelGrid) / pixelGrid;

    float speedRatio = uWaveSpeed / 0.05;
    float t = uTime * 0.48 * speedRatio;

    // Vector to Black Hole on the ocean plane
    vec2 toBH = uBlackHolePos.xz - pPixel;
    float distBH = length(toBH);
    vec2 dirBH = toBH / (distBH + 0.001);
    vec2 tanBH = vec2(-dirBH.y, dirBH.x);

    // 2. Gravitational Light & Wave Suction Flow
    // Water caustics, wave cells, and light continuously stream inward toward the singularity!
    float pullZone = clamp(1.0 - (distBH / 38.0), 0.0, 1.0);
    float suctionFlowRate = (0.75 + 3.0 * pow(pullZone, 1.8)) * uSuctionIntensity;
    float flowDist = t * suctionFlowRate;

    // Sucking coordinates in towards the black hole with spiral frame-dragging
    vec2 flowOffset = dirBH * flowDist * 1.8 + tanBH * sin(distBH * 0.55 - t * 2.2) * (pullZone * 1.6);
    vec2 warpedCoord = pPixel - flowOffset;

    // 3. Domain Warping with Relativistic Whirlpool Twisting
    vec2 warp = vec2(
      sin(warpedCoord.y * 0.35 + t * 0.72) * 0.52 + cos(warpedCoord.x * 0.22 + t * 0.48) * 0.28,
      cos(warpedCoord.x * 0.35 - t * 0.65) * 0.52 + sin(warpedCoord.y * 0.22 + t * 0.48) * 0.28
    );

    // Radial stretching (spaghettification of caustics toward singularity)
    vec2 stretchOffset = dirBH * (pow(pullZone, 2.0) * 2.2);
    vec2 p = (warpedCoord - stretchOffset) * 0.34 + warp;

    vec4 v1 = voronoiCaustic(p, t * 0.62 + pullZone * 1.4);
    float edge = v1.y - v1.x; // 0.0 at cell boundary, up to ~0.8 in cell center

    // Directional shading inside each cell, pulled toward the black hole
    vec2 dir = normalize(v1.zw + vec2(0.0001));
    vec2 lightSourceDir = normalize(mix(vec2(-0.72, 0.69), dirBH, pullZone * 0.75));
    float internalLight = dot(dir, lightSourceDir);
    float shade = (1.0 - internalLight) * 0.48 + v1.x * 0.44;

    // Stepped retro pixel-art water colors
    vec3 col;

    // White caustic ribbons wrapping around cells
    if (edge <= 0.135) {
      col = uColorWhite;
    } 
    // Pale ice-blue ribbon stepped border
    else if (edge <= 0.205) {
      col = uColorIce;
    } 
    // Inside cell: stepped tropical water depth gradient
    else {
      if (shade < 0.40) {
        col = uColorSky; // Bright Light Sky Blue (#5BC0F8)
      } else if (shade < 0.68) {
        col = uColorVibrant; // Vibrant Electric Azure (#1D8CF8)
      } else {
        col = uColorDeep; // Deep Royal Blue (#0B61D6)
      }

      // Secondary fine caustic bubbles / rings inside larger cells
      if (edge > 0.34) {
        vec4 v2 = voronoiCaustic(p * 2.15 + vec2(t * 0.12, -t * 0.09) - dirBH * flowDist * 0.8, t * 0.85);
        float edge2 = v2.y - v2.x;
        if (edge2 <= 0.055) {
          col = uColorWhite;
        } else if (edge2 <= 0.092) {
          col = uColorIce;
        }
      }
    }

    // 4. PHOTON ACCRETION RAYS / SPIRALING LIGHT STREAMERS
    // Light is pulled into relativistic orbits spiraling into the black hole:
    if (distBH < 25.0 && distBH > 3.0 && uSuctionIntensity > 0.05) {
      float angle = atan(toBH.y, toBH.x);
      float lightStream = sin(angle * 5.0 + distBH * 1.3 - t * 5.2);
      float streamMask = floor(smoothstep(0.72, 0.94, lightStream) * 4.0) / 4.0;
      if (streamMask > 0.2) {
        vec3 streamCol = mix(uColorSky, uColorWhite, streamMask);
        float streamFade = smoothstep(25.0, 11.0, distBH) * (1.0 - smoothstep(2.8, 4.2, distBH));
        col = mix(col, streamCol, streamMask * 0.7 * streamFade * uSuctionIntensity);
      }
    }

    // 5. ACCRETION RIM PHOTON GLOW
    // Intense electric glow on the crest of the funnel where light is compressed:
    if (distBH < 13.0 && distBH > 3.5 && uSuctionIntensity > 0.05) {
      float rimGlow = smoothstep(13.0, 4.8, distBH) * (1.0 - smoothstep(3.2, 5.0, distBH));
      col = mix(col, uColorWhite, rimGlow * 0.5 * uSuctionIntensity);
    }

    // 6. EVENT HORIZON LIGHT ABSORPTION (PITCH BLACK SINGULARITY VOID)
    // "Just as it sucks in everything including the light"
    // Light cannot escape past the inner event horizon perimeter!
    if (uSuctionIntensity > 0.05) {
      float horizonRadius = 3.8 * uSuctionIntensity;
      if (distBH < horizonRadius) {
        float voidFactor = clamp((horizonRadius - distBH) / 1.5, 0.0, 1.0);
        float steppedVoid = floor(voidFactor * 6.0) / 6.0;
        col = mix(col, vec3(0.0, 0.0, 0.0), steppedVoid);
      }
    }

    // 7. Square Ocean Boundary (User requirement: "The main ocean is a square right")
    // Keep clean, sharp square geometry right to the perimeter
    float halfSize = uOceanSize * 0.5;
  float squareDist = max(abs(vWorldPos.x), abs(vWorldPos.z));
  float horizonFade = 1.0 - smoothstep(halfSize * 0.95, halfSize * 0.998, squareDist);

  if (horizonFade <= 0.005) {
    discard;
  }

  gl_FragColor = vec4(col, horizonFade);
}
`;

// Reference Image 1 (Day - Azure caustic ocean):
const DAY_PALETTE = {
  white: new THREE.Color(0xffffff),
  ice: new THREE.Color(0xe3f3fe),
  sky: new THREE.Color(0x5bc0f8),
  vibrant: new THREE.Color(0x1d8cf8),
  deep: new THREE.Color(0x0b61d6),
};

// Reference Image 3 (Dawn / Dusk - Golden yellow to fiery crimson gradient):
const DAWN_PALETTE = {
  white: new THREE.Color(0xfff5a0), // Radiant golden highlight
  ice: new THREE.Color(0xf2ce00),   // Bright yellow crests (#f2ce00)
  sky: new THREE.Color(0xe68c13),   // Golden amber (#e68c13)
  vibrant: new THREE.Color(0xd64621), // Vibrant vermilion (#d64621)
  deep: new THREE.Color(0xc90132),  // Deep ruby crimson (#c90132)
};

// Reference Image 4 (Night - Space reflection):
const NIGHT_PALETTE = {
  white: new THREE.Color(0x9cb3dc), // Starlight white
  ice: new THREE.Color(0x4b5578),   // Dim starlight blue
  sky: new THREE.Color(0x252448),   // Dark space blue
  vibrant: new THREE.Color(0x181329), // Deep space dark indigo (Image 4 #181329)
  deep: new THREE.Color(0x0c0a18),  // Cosmic void pitch black-indigo
};

export function WaterCausticOcean({
  oceanSize = 90,
  oceanFragments = 120,
  waveSpeed = 0.05,
  waveAmplitude = 0.12,
  timeOfDay = Math.PI * 0.5,
  blackHolePos = [0, 4.4, -20.5],
  suctionIntensity = 1.0,
  isBlackHoleEasterEgg = false,
}: WaterCausticOceanProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  const easterEggTimerRef = useRef(isBlackHoleEasterEgg ? 10 : 0);
  const prevEasterEggRef = useRef(isBlackHoleEasterEgg);

  const uniforms = useMemo(() => {
    return {
      uTime: { value: 0 },
      uWaveSpeed: { value: waveSpeed },
      uWaveAmp: { value: waveAmplitude },
      uOceanSize: { value: oceanSize },
      uBlackHolePos: { value: new THREE.Vector3(blackHolePos[0], blackHolePos[1], blackHolePos[2]) },
      uSuctionIntensity: { value: isBlackHoleEasterEgg ? suctionIntensity : 0 },
      uColorWhite: { value: new THREE.Color().copy(DAY_PALETTE.white) },
      uColorIce: { value: new THREE.Color().copy(DAY_PALETTE.ice) },
      uColorSky: { value: new THREE.Color().copy(DAY_PALETTE.sky) },
      uColorVibrant: { value: new THREE.Color().copy(DAY_PALETTE.vibrant) },
      uColorDeep: { value: new THREE.Color().copy(DAY_PALETTE.deep) },
    };
  }, [oceanSize]);

  useFrame(({ clock }, delta) => {
    if (!materialRef.current) return;

    const dt = Math.min(delta, 0.05);

    if (isBlackHoleEasterEgg && !prevEasterEggRef.current) {
      easterEggTimerRef.current = 0.0;
    }
    prevEasterEggRef.current = isBlackHoleEasterEgg;

    let effectiveSpeed = waveSpeed;
    let effectiveSuction = isBlackHoleEasterEgg ? suctionIntensity : 0.0;

    if (isBlackHoleEasterEgg) {
      easterEggTimerRef.current += dt;
      const t = easterEggTimerRef.current;
      // Surge phase (t < 1.8s):
      if (t < 1.8) {
        const surgeRatio = THREE.MathUtils.lerp(4.8, 3.2, t / 1.8);
        effectiveSpeed = waveSpeed * surgeRatio;
        effectiveSuction = Math.min(1.0, t / 0.55);
      } else {
        const settleProgress = Math.min(1.0, (t - 1.8) / 1.4);
        effectiveSpeed = waveSpeed * THREE.MathUtils.lerp(3.2, 1.5, settleProgress);
        effectiveSuction = 1.0;
      }
    }

    const time = clock.getElapsedTime();
    materialRef.current.uniforms.uTime.value = time;
    materialRef.current.uniforms.uWaveSpeed.value = effectiveSpeed;
    materialRef.current.uniforms.uWaveAmp.value = waveAmplitude;
    materialRef.current.uniforms.uOceanSize.value = oceanSize;
    materialRef.current.uniforms.uBlackHolePos.value.set(
      blackHolePos[0],
      blackHolePos[1],
      blackHolePos[2]
    );
    materialRef.current.uniforms.uSuctionIntensity.value = effectiveSuction;

    // Dynamic diurnal water coloration:
    // Blend between Day (Image 1), Dawn/Dusk (Image 3), and Night (Image 4):
    const sinT = Math.sin(timeOfDay);
    const dayFactor = Math.max(0, Math.min(1.0, (sinT - 0.06) / 0.50));
    const nightFactor = Math.max(0, Math.min(1.0, (-sinT - 0.06) / 0.50));
    const dawnFactor = Math.max(0, Math.min(1.0, 1.0 - dayFactor - nightFactor));

    const uWhite = materialRef.current.uniforms.uColorWhite.value;
    const uIce = materialRef.current.uniforms.uColorIce.value;
    const uSky = materialRef.current.uniforms.uColorSky.value;
    const uVibrant = materialRef.current.uniforms.uColorVibrant.value;
    const uDeep = materialRef.current.uniforms.uColorDeep.value;

    const blendThreeColors = (cDay: THREE.Color, cDawn: THREE.Color, cNight: THREE.Color, target: THREE.Color) => {
      target.setRGB(
        cDay.r * dayFactor + cDawn.r * dawnFactor + cNight.r * nightFactor,
        cDay.g * dayFactor + cDawn.g * dawnFactor + cNight.g * nightFactor,
        cDay.b * dayFactor + cDawn.b * dawnFactor + cNight.b * nightFactor
      );
    };

    blendThreeColors(DAY_PALETTE.white, DAWN_PALETTE.white, NIGHT_PALETTE.white, uWhite);
    blendThreeColors(DAY_PALETTE.ice, DAWN_PALETTE.ice, NIGHT_PALETTE.ice, uIce);
    blendThreeColors(DAY_PALETTE.sky, DAWN_PALETTE.sky, NIGHT_PALETTE.sky, uSky);
    blendThreeColors(DAY_PALETTE.vibrant, DAWN_PALETTE.vibrant, NIGHT_PALETTE.vibrant, uVibrant);
    blendThreeColors(DAY_PALETTE.deep, DAWN_PALETTE.deep, NIGHT_PALETTE.deep, uDeep);
  });

  return (
    <group rotation={[-Math.PI / 2, 0, 0]}>
      <mesh ref={meshRef} receiveShadow>
        <planeGeometry args={[oceanSize, oceanSize, oceanFragments, oceanFragments]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={oceanVertexShader}
          fragmentShader={oceanFragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite
        />
      </mesh>
    </group>
  );
}

export default WaterCausticOcean;
