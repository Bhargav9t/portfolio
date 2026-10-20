"use client";

import React, { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

interface PixelMoonProps {
  position: [number, number, number];
  scale?: number;
  intensity?: number;
}

export function PixelMoon({
  position,
  scale = 8.2,
  intensity = 1.0,
}: PixelMoonProps) {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshBasicMaterial>(null);
  const glowRef = useRef<THREE.Mesh>(null);

  // Load the 3 blinking state textures with NearestFilter
  const { texOpen, texHalf, texClosed } = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const open = loader.load("/celestial/moon_open.png");
    const half = loader.load("/celestial/moon_half.png");
    const closed = loader.load("/celestial/moon_closed.png");

    [open, half, closed].forEach((tex) => {
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;
      tex.generateMipmaps = false;
      tex.colorSpace = THREE.SRGBColorSpace;
    });

    return { texOpen: open, texHalf: half, texClosed: closed };
  }, []);

  // Blinking animation state
  const timeToNextBlink = useRef(2.8 + Math.random() * 2.5);
  const blinkElapsed = useRef(-1); // -1 = idle open
  const isDoubleBlink = useRef(false);
  const doubleBlinkDone = useRef(false);

  useFrame((_, delta) => {
    // 1. Keep moon billboarding facing the viewer directly
    if (groupRef.current) {
      groupRef.current.quaternion.copy(camera.quaternion);
    }

    // 2. Violet corona glow pulsing
    if (glowRef.current) {
      const pulse = 1.0 + Math.sin(Date.now() * 0.002) * 0.035;
      glowRef.current.scale.set(pulse, pulse, 1);
    }

    if (!matRef.current) return;

    // 3. Eye Blinking State Machine
    if (blinkElapsed.current < 0) {
      // Idle state: eye is open
      timeToNextBlink.current -= delta;
      if (timeToNextBlink.current <= 0) {
        // Trigger a new blink
        blinkElapsed.current = 0;
        isDoubleBlink.current = Math.random() < 0.28; // 28% chance of eerie double-blink
        doubleBlinkDone.current = false;
      }
      if (matRef.current.map !== texOpen) {
        matRef.current.map = texOpen;
        matRef.current.needsUpdate = true;
      }
    } else {
      // Currently in a blink cycle
      blinkElapsed.current += delta;
      const t = blinkElapsed.current;

      let targetTex = texOpen;
      if (t < 0.05) {
        targetTex = texHalf;
      } else if (t < 0.16) {
        targetTex = texClosed; // Eye shut
      } else if (t < 0.22) {
        targetTex = texHalf;
      } else {
        // Blink finished
        if (isDoubleBlink.current && !doubleBlinkDone.current) {
          if (t < 0.38) {
            targetTex = texOpen; // Brief pause between double-blink
          } else if (t < 0.43) {
            targetTex = texHalf;
          } else if (t < 0.54) {
            targetTex = texClosed; // Second blink shut
          } else if (t < 0.60) {
            targetTex = texHalf;
          } else {
            // Double blink fully finished
            targetTex = texOpen;
            blinkElapsed.current = -1;
            timeToNextBlink.current = 3.2 + Math.random() * 3.5;
          }
        } else {
          // Single blink finished
          targetTex = texOpen;
          blinkElapsed.current = -1;
          timeToNextBlink.current = 3.0 + Math.random() * 3.5;
        }
      }

      if (matRef.current.map !== targetTex) {
        matRef.current.map = targetTex;
        matRef.current.needsUpdate = true;
      }
    }
  });

  if (intensity <= 0.01) return null;

  return (
    <group ref={groupRef} position={position}>
      {/* 1. Ethereal Circular Violet Lunar Corona Glow */}
      <mesh ref={glowRef} position={[0, 0, -0.08]}>
        <ringGeometry args={[scale * 0.28, scale * 0.68, 48]} />
        <meshBasicMaterial
          color={0xa78bfa}
          transparent
          opacity={0.3 * intensity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* 2. Moon Body Quad with Eye Blinking Texture */}
      <mesh ref={meshRef} position={[0, 0, 0]}>
        <planeGeometry args={[scale, scale]} />
        <meshBasicMaterial
          ref={matRef}
          map={texOpen}
          transparent
          alphaTest={0.06}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

export default PixelMoon;
