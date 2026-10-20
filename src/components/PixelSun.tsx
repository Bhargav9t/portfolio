"use client";

import React, { useRef, useMemo } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

interface PixelSunProps {
  position: [number, number, number];
  scale?: number;
  intensity?: number;
}

export function PixelSun({
  position,
  scale = 8.6,
  intensity = 1.0,
}: PixelSunProps) {
  const { camera } = useThree();
  const groupRef = useRef<THREE.Group>(null);
  const raysRef = useRef<THREE.Mesh>(null);

  // Load pixel-crisp textures with NearestFilter
  const { faceTexture, raysTexture } = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const face = loader.load("/celestial/sun_face.png");
    const rays = loader.load("/celestial/sun_rays.png");

    [face, rays].forEach((tex) => {
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.NearestFilter;
      tex.generateMipmaps = false;
      tex.colorSpace = THREE.SRGBColorSpace;
    });

    return { faceTexture: face, raysTexture: rays };
  }, []);

  useFrame((_, delta) => {
    // 1. Keep sun billboarding directly facing the camera
    if (groupRef.current) {
      groupRef.current.quaternion.copy(camera.quaternion);
    }

    // 2. Perpetual rotation of the outer sun rays
    if (raysRef.current) {
      raysRef.current.rotation.z += delta * 0.45;
    }
  });

  if (intensity <= 0.01) return null;

  return (
    <group ref={groupRef} position={position}>
      {/* 1. Outer Sun Rays Quad - Perpetually Rotating */}
      <mesh ref={raysRef} position={[0, 0, -0.04]}>
        <planeGeometry args={[scale, scale]} />
        <meshBasicMaterial
          map={raysTexture}
          transparent
          alphaTest={0.08}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* 3. Center Sun Face with Cool Sunglasses & Smile - Stays Upright */}
      <mesh position={[0, 0, 0.02]}>
        <planeGeometry args={[scale, scale]} />
        <meshBasicMaterial
          map={faceTexture}
          transparent
          alphaTest={0.08}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

export default PixelSun;
