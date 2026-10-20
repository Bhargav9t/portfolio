"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { BlackHole } from "./BlackHole";
import { PixelSun } from "./PixelSun";
import { PixelMoon } from "./PixelMoon";
import { PixelLighthouse } from "./PixelLighthouse";
import { DayBirds } from "./DayBirds";
import { FloatingAstronaut } from "./FloatingAstronaut";
import { EnclosingSky } from "./EnclosingSky";
import { DistantBlackHole } from "./DistantBlackHole";
import { getBlackHoleState } from "@/utils/blackHoleCoords";

export interface CosmicSkyProps {
  timeOfDay?: number; // 0 to 2*PI (0 = Dawn, PI/2 = Noon, PI = Dusk, 3*PI/2 = Midnight)
  accentColor?: number;
  isLowEndMode?: boolean;
  isBlackHoleEasterEgg?: boolean;
  blackHoleScale?: number;
  onToggleBlackHoleEasterEgg?: () => void;
}

const starVertexShader = `
  attribute float aSize;
  attribute float aPhase;
  attribute float aSpeed;
  varying float vTwinkle;
  varying vec3 vColor;
  uniform float uTime;

  void main() {
    float t = uTime * aSpeed + aPhase;
    // Independent rhythmic twinkling per star with diamond peaks
    float pulse = sin(t);
    float twinkle = pow(pulse * 0.5 + 0.5, 2.2);
    vTwinkle = 0.42 + 0.58 * twinkle;

    // Subtle cosmic color temperature variations
    float colSeed = fract(aPhase * 0.159154);
    if (colSeed < 0.68) {
      vColor = vec3(1.0, 1.0, 1.0); // Pure diamond white
    } else if (colSeed < 0.90) {
      vColor = vec3(0.72, 0.90, 1.0); // Crisp cosmic ice blue
    } else {
      vColor = vec3(1.0, 0.94, 0.84); // Stellar warm white
    }

    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    // Point size clamped to at least 1.6px so small stars stay clearly visible
    float pSize = (aSize * (0.85 + 0.35 * twinkle)) * (240.0 / -mvPosition.z);
    gl_PointSize = max(1.6, pSize);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

const starFragmentShader = `
  uniform float uStarOpacity;
  varying float vTwinkle;
  varying vec3 vColor;

  void main() {
    vec2 coord = gl_PointCoord - vec2(0.5);
    float dist = length(coord);
    if (dist > 0.5) discard;

    // Smooth circular diamond glow modulated by star opacity
    float alpha = smoothstep(0.5, 0.06, dist) * vTwinkle * uStarOpacity;
    if (alpha <= 0.005) discard;
    gl_FragColor = vec4(vColor, alpha);
  }
`;

// Retro Stepped Pixel Gradient Sky Dome Shader
const skyVertexShader = `
  varying vec3 vWorldPos;
  void main() {
    vec4 wp = modelMatrix * vec4(position, 1.0);
    vWorldPos = wp.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const skyFragmentShader = `
  uniform float uTimeOfDay;
  uniform float uBlackHoleFactor;
  varying vec3 vWorldPos;

  void main() {
    vec3 dir = normalize(vWorldPos);
    // Vertical height: 0 at horizon, 1 at zenith
    float h = clamp(dir.y, 0.0, 1.0);
    
    // Retro stepped pixel gradient (matching 24-step pixel art palette)
    float stepH = floor(h * 24.0) / 24.0;

    float sinT = sin(uTimeOfDay);
    
    // 1. Daytime Sky (Sunny Azure Blue to pale sunny cyan horizon)
    vec3 dayZenith   = vec3(0.08, 0.42, 0.92); // Cerulean Blue (#146beb)
    vec3 dayMid      = vec3(0.24, 0.68, 0.98); // Bright Cyan Azure (#3daefb)
    vec3 dayHorizon  = vec3(0.68, 0.90, 1.00); // Pale Sunny Sky (#ade6ff)
    vec3 daySky = mix(dayHorizon, mix(dayMid, dayZenith, stepH), pow(stepH, 0.75));

    // 2. Sunset / Dusk (Deep Indigo to fiery magenta to golden amber horizon)
    vec3 sunsetZenith  = vec3(0.10, 0.08, 0.28); // Deep Indigo (#1a1447)
    vec3 sunsetMid     = vec3(0.72, 0.16, 0.48); // Fiery Magenta (#b8297a)
    vec3 sunsetHorizon = vec3(0.98, 0.58, 0.18); // Golden Amber (#fa942e)
    vec3 sunsetSky = mix(sunsetHorizon, mix(sunsetMid, sunsetZenith, stepH), pow(stepH, 0.85));

    // 3. Nighttime Sky (Pure deep space black to dark midnight indigo horizon)
    vec3 nightZenith  = vec3(0.0, 0.0, 0.0);
    vec3 nightHorizon = vec3(0.03, 0.05, 0.12);
    vec3 nightSky = mix(nightHorizon, nightZenith, stepH);

    // Diurnal blending based on Sun elevation
    float dayFactor = clamp((sinT + 0.12) / 0.80, 0.0, 1.0);
    float sunsetFactor = clamp(1.0 - abs(sinT) * 2.2, 0.0, 1.0);

    vec3 sky = nightSky;
    if (dayFactor > 0.001) {
      vec3 blendDay = mix(sunsetSky, daySky, dayFactor);
      sky = mix(nightSky, blendDay, dayFactor);
    } else if (sunsetFactor > 0.001) {
      sky = mix(nightSky, sunsetSky, sunsetFactor);
    }

    // Black Hole easter egg forces pure pitch black cosmic void
    sky = mix(sky, vec3(0.0, 0.0, 0.0), uBlackHoleFactor);

    gl_FragColor = vec4(sky, 1.0);
  }
`;

export function CosmicSky({
  timeOfDay = Math.PI * 0.5,
  accentColor = 0xd5b893,
  isLowEndMode = false,
  isBlackHoleEasterEgg = false,
  blackHoleScale,
  onToggleBlackHoleEasterEgg,
}: CosmicSkyProps) {
  const starMatRef = useRef<THREE.ShaderMaterial>(null);
  const skyMatRef = useRef<THREE.ShaderMaterial>(null);
  const sunLightRef = useRef<THREE.DirectionalLight>(null);
  const moonLightRef = useRef<THREE.DirectionalLight>(null);
  const bhLightRef = useRef<THREE.DirectionalLight>(null);
  const bhGroupRef = useRef<THREE.Group>(null);
  const easterEggTimerRef = useRef(isBlackHoleEasterEgg ? 10 : 0);
  const prevEasterEggRef = useRef(isBlackHoleEasterEgg);

  // Dense, fine starfield with thousands of small, crisp, visible twinkling diamond stars
  const { positions, sizes, phases, speeds } = useMemo(() => {
    const count = isLowEndMode ? 950 : 3200;
    const pos = new Float32Array(count * 3);
    const sz = new Float32Array(count);
    const ph = new Float32Array(count);
    const sp = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      // Wide hemisphere dome distribution above ocean horizon
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 0.88 + 0.02);
      const r = 48.0 + (Math.random() - 0.5) * 12.0;

      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = Math.max(0.2, r * Math.cos(phi));
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta);

      // Majority small, sharp pinpoint stars with occasional brighter stellar beacons
      const isTiny = Math.random() < 0.82;
      sz[i] = isTiny ? 0.07 + Math.random() * 0.12 : 0.22 + Math.random() * 0.18;
      ph[i] = Math.random() * Math.PI * 2;
      sp[i] = 1.2 + Math.random() * 3.4; // Independent rhythmic twinkling
    }

    return { positions: pos, sizes: sz, phases: ph, speeds: sp };
  }, [isLowEndMode]);

  const starUniforms = useMemo(() => {
    return {
      uTime: { value: 0 },
      uStarOpacity: { value: 1.0 },
    };
  }, []);

  const skyUniforms = useMemo(() => {
    return {
      uTimeOfDay: { value: timeOfDay },
      uBlackHoleFactor: { value: isBlackHoleEasterEgg ? 1.0 : 0.0 },
    };
  }, []);

  // 1. Black Hole Coordinates (Active during Easter Egg mode)
  const bh = getBlackHoleState(timeOfDay);
  const bhX = bh.x;
  const bhY = bh.y;
  const bhZ = bh.z;

  // 2. Normal Day/Night Orbital Coordinates
  // Sun: arches across daytime sky, positioned comfortably high in the sky far above the ocean waterline
  const sinT = Math.sin(timeOfDay);
  const sunAngle = timeOfDay;
  const sunElev = sinT;
  const sunX = -Math.cos(sunAngle) * 16.5;
  const sunY = sunElev > -0.22 ? sunElev * 6.5 + 0.6 : -10.0;
  const sunZ = -23.0;
  const isSunVisible = !isBlackHoleEasterEgg && sunY > -2.5;
  const sunIntensity = Math.max(0, Math.min(1.0, (sunY + 1.5) / 5.0));

  // Moon: exactly 180 degrees opposite Sun, arches across night sky
  const moonAngle = timeOfDay + Math.PI;
  const moonElev = Math.sin(moonAngle);
  const moonX = -Math.cos(moonAngle) * 16.5;
  const moonY = moonElev > -0.22 ? moonElev * 6.5 + 0.6 : -10.0;
  const moonZ = -23.0;
  const isMoonVisible = !isBlackHoleEasterEgg && moonY > -2.5;
  const moonIntensity = Math.max(0, Math.min(1.0, (moonY + 1.5) / 5.0));

  useFrame(({ clock }, delta) => {
    const time = clock.getElapsedTime();
    const dt = Math.min(delta, 0.05);
    const sinT = Math.sin(timeOfDay);

    if (isBlackHoleEasterEgg && !prevEasterEggRef.current) {
      easterEggTimerRef.current = 0.0;
    }
    prevEasterEggRef.current = isBlackHoleEasterEgg;

    let bhScaleFactor = 0.0;
    if (isBlackHoleEasterEgg) {
      easterEggTimerRef.current += dt;
      const t = easterEggTimerRef.current;
      // Surge phase (t < 1.8s): Black hole is completely hidden while ocean rushes into center!
      if (t < 1.8) {
        bhScaleFactor = 0.0001;
      } else {
        // At t = 1.8s: Black hole bursts into existence and scales up smoothly!
        const growT = Math.min(1.0, (t - 1.8) / 0.85);
        bhScaleFactor = 1.0 - Math.pow(1.0 - growT, 3);
      }
    }

    if (bhGroupRef.current) {
      bhGroupRef.current.scale.setScalar(Math.max(0.0001, bhScaleFactor));
      bhGroupRef.current.visible = isBlackHoleEasterEgg && bhScaleFactor > 0.01;
    }

    if (starMatRef.current) {
      starMatRef.current.uniforms.uTime.value = time;
      // Stars fade out completely during bright sunny day (sinT > 0.15)
      // Stars shine brightly at night and during the black hole void
      const starOpacity = isBlackHoleEasterEgg
        ? 1.0
        : Math.max(0.0, Math.min(1.0, (-sinT + 0.12) / 0.50));
      starMatRef.current.uniforms.uStarOpacity.value = starOpacity;
    }

    if (skyMatRef.current) {
      skyMatRef.current.uniforms.uTimeOfDay.value = timeOfDay;
      const targetBh = isBlackHoleEasterEgg ? 1.0 : 0.0;
      skyMatRef.current.uniforms.uBlackHoleFactor.value = THREE.MathUtils.lerp(
        skyMatRef.current.uniforms.uBlackHoleFactor.value,
        targetBh,
        0.08
      );
    }

    // Update dynamic celestial directional lighting
    if (isBlackHoleEasterEgg) {
      if (bhLightRef.current) {
        bhLightRef.current.position.set(bhX, Math.max(2, bhY + 4), bhZ);
        bhLightRef.current.intensity = Math.max(0.05, bhScaleFactor * 1.8);
      }
    } else {
      if (sunLightRef.current && isSunVisible) {
        sunLightRef.current.position.set(sunX, Math.max(3, sunY + 6), sunZ);
        sunLightRef.current.intensity = Math.max(0.1, sunIntensity * 1.85);
      }
      if (moonLightRef.current && isMoonVisible) {
        moonLightRef.current.position.set(moonX, Math.max(3, moonY + 6), moonZ);
        moonLightRef.current.intensity = Math.max(0.1, moonIntensity * 1.15);
      }
    }
  });

  return (
    <>
      {/* 1. Dynamic Directional Lights */}
      {isBlackHoleEasterEgg ? (
        <directionalLight
          ref={bhLightRef}
          args={[0xd8f0ff, 1.6]}
          castShadow={!isLowEndMode}
          shadow-mapSize={[1024, 1024]}
        />
      ) : (
        <>
          <directionalLight
            ref={sunLightRef}
            args={[0xfff5dd, 1.8]}
            castShadow={!isLowEndMode}
            shadow-mapSize={[1024, 1024]}
          />
          <directionalLight
            ref={moonLightRef}
            args={[0xcad7f8, 1.1]}
          />
        </>
      )}

      {/* 2. ENCLOSING 360-DEGREE ENVIRONMENT SKY COVERING ENTIRETY OF CUBE */}
      <EnclosingSky
        timeOfDay={timeOfDay}
        isBlackHoleEasterEgg={isBlackHoleEasterEgg}
      />

      {/* 3. LIGHTWEIGHT INDEPENDENT TWINKLING STARFIELD (Fades in day, sparkles at night & void) */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
          />
          <bufferAttribute
            attach="attributes-aSize"
            args={[sizes, 1]}
          />
          <bufferAttribute
            attach="attributes-aPhase"
            args={[phases, 1]}
          />
          <bufferAttribute
            attach="attributes-aSpeed"
            args={[speeds, 1]}
          />
        </bufferGeometry>
        <shaderMaterial
          ref={starMatRef}
          vertexShader={starVertexShader}
          fragmentShader={starFragmentShader}
          uniforms={starUniforms}
          transparent
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* 4. CELESTIAL BODIES: EASTER EGG (GARGANTUA) vs NORMAL DAY & NIGHT (SUN & MOON & FIXED BLACK HOLE) */}
      {isBlackHoleEasterEgg ? (
        // GARGANTUA BLACK HOLE EASTER EGG (Scales up smoothly upon breaching at t >= 1.8s)
        <group ref={bhGroupRef}>
          <BlackHole position={[bhX, bhY, bhZ]} scale={1.85} flicker={true} flickerIntensity={1.2} />
        </group>
      ) : (
        // NORMAL DAY AND NIGHT CYCLE
        <>
          {/* Day: Pixel-Art Sun with Sunglasses & Perpetually Rotating Rays (Far from ocean) */}
          {isSunVisible && (
            <PixelSun
              position={[sunX, sunY, sunZ]}
              scale={8.6}
              intensity={sunIntensity}
            />
          )}

          {/* Night: Creepy Pixel Moon with Blinking Eye */}
          {isMoonVisible && (
            <PixelMoon
              position={[moonX, moonY, moonZ]}
              scale={8.2}
              intensity={moonIntensity}
            />
          )}

          {/* Day & Dawn: Exactly 3 Tiny Flying Birds soaring in open sky */}
          {sunIntensity > 0.05 && (
            <DayBirds
              sunPosition={[sunX, sunY, sunZ]}
              intensity={sunIntensity}
            />
          )}

          {/* Night: Floating Astronaut */}
          {isMoonVisible && (
            <FloatingAstronaut intensity={moonIntensity} />
          )}

          {/* Night: Black Hole in fixed position that continuously flickers (User requirement) */}
          {sinT < -0.05 && (
            <DistantBlackHole
              timeOfDay={timeOfDay}
              isBlackHoleEasterEgg={isBlackHoleEasterEgg}
              onActivateEasterEgg={onToggleBlackHoleEasterEgg}
            />
          )}
        </>
      )}

      {/* 5. PIXEL LIGHTHOUSE IN BACKGROUND OCEAN WATERLINE */}
      <PixelLighthouse timeOfDay={timeOfDay} />
    </>
  );
}

export default CosmicSky;
