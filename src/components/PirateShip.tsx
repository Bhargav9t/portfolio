"use client";

import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export type ShipType = "sunny" | "merry" | "polar" | "redforce" | "maxim";

export interface ShipConfig {
  id: string;
  type: ShipType;
  name: string;
  scale?: number;
  initialPos: [number, number];
}

export interface PirateShipProps {
  type: ShipType;
  name: string;
  scale?: number;
  impactFlash?: number;
  defianceLevel?: number;
  speed?: number;
  isHovered?: boolean;
}

export function PirateShip({
  type,
  scale = 1.0,
  impactFlash = 0,
  defianceLevel = 0,
  speed = 0.5,
  isHovered = false,
}: PirateShipProps) {
  const sailRef = useRef<THREE.Group>(null);
  const wheelLeftRef = useRef<THREE.Mesh>(null);
  const wheelRightRef = useRef<THREE.Mesh>(null);
  const flagRef = useRef<THREE.Mesh>(null);
  const propRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // Subtle sail billowing in ocean breeze
    if (sailRef.current) {
      sailRef.current.rotation.y = Math.sin(t * 2.2) * 0.04;
    }

    // Side paddle wheels rotation based on sailing speed
    const wheelRot = t * (2.8 * (speed / 0.5));
    if (wheelLeftRef.current) wheelLeftRef.current.rotation.x = wheelRot;
    if (wheelRightRef.current) wheelRightRef.current.rotation.x = wheelRot;

    // Submarine propeller rotation
    if (propRef.current) propRef.current.rotation.z = t * 12.0;

    // Tiny pirate flag flutter
    if (flagRef.current) {
      flagRef.current.rotation.y = Math.sin(t * 8.5) * 0.15;
    }
  });

  // Shared stylized materials
  const materials = useMemo(() => {
    const flashCol = new THREE.Color(0xffffff);
    const flashIntensity = Math.min(1.0, impactFlash * 0.8 + (isHovered ? 0.35 : 0));

    return {
      hullWood: new THREE.MeshStandardMaterial({
        color: 0x8a5229,
        roughness: 0.65,
        emissive: flashCol,
        emissiveIntensity: flashIntensity * 0.4,
      }),
      deckCream: new THREE.MeshStandardMaterial({
        color: 0xf5ebd0,
        roughness: 0.55,
      }),
      hullRed: new THREE.MeshStandardMaterial({
        color: 0xc8232b,
        roughness: 0.5,
        emissive: flashCol,
        emissiveIntensity: flashIntensity * 0.5,
      }),
      hullWhite: new THREE.MeshStandardMaterial({
        color: 0xfbfcfe,
        roughness: 0.4,
      }),
      hullGold: new THREE.MeshStandardMaterial({
        color: 0xf1a80a,
        metalness: 0.45,
        roughness: 0.35,
      }),
      hullYellow: new THREE.MeshStandardMaterial({
        color: 0xf2cb1b,
        roughness: 0.4,
        emissive: flashCol,
        emissiveIntensity: flashIntensity * 0.5,
      }),
      sailWhite: new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.7,
        side: THREE.DoubleSide,
      }),
      sailStripedRed: new THREE.MeshStandardMaterial({
        color: 0xd62828,
        roughness: 0.6,
        side: THREE.DoubleSide,
      }),
      blackFlag: new THREE.MeshBasicMaterial({
        color: 0x111116,
        side: THREE.DoubleSide,
      }),
      mastBrown: new THREE.MeshStandardMaterial({
        color: 0x5c3818,
        roughness: 0.75,
      }),
      glassCockpit: new THREE.MeshPhysicalMaterial({
        color: 0x1c4464,
        roughness: 0.15,
        metalness: 0.85,
        clearcoat: 1.0,
      }),
      jollyRogerEmblem: new THREE.MeshBasicMaterial({
        color: 0x111111,
        transparent: true,
        opacity: 0.9,
      }),
    };
  }, [impactFlash, isHovered]);

  return (
    <group scale={scale}>
      {/* 1. THOUSAND SUNNY (Chibi Lion Head Galleon) */}
      {type === "sunny" && (
        <group>
          {/* Main Hull */}
          <mesh position={[0, 0.28, 0]} material={materials.hullRed}>
            <boxGeometry args={[0.92, 0.44, 1.48]} />
          </mesh>
          <mesh position={[0, 0.52, 0]} material={materials.hullWhite}>
            <boxGeometry args={[0.96, 0.16, 1.52]} />
          </mesh>
          <mesh position={[0, 0.61, 0]} material={materials.deckCream}>
            <boxGeometry args={[0.88, 0.04, 1.44]} />
          </mesh>
          {/* Green lawn deck center */}
          <mesh position={[0, 0.64, -0.05]}>
            <boxGeometry args={[0.68, 0.03, 0.82]} />
            <meshStandardMaterial color={0x4fa644} roughness={0.8} />
          </mesh>

          {/* Golden Gunwales / Railings */}
          <mesh position={[0, 0.67, 0]} material={materials.hullGold}>
            <boxGeometry args={[0.94, 0.06, 1.48]} />
          </mesh>

          {/* Sunny Lion Figurehead on Bow (Front: -Z) */}
          <group position={[0, 0.52, -0.82]}>
            {/* Round yellow lion face */}
            <mesh material={materials.hullYellow}>
              <sphereGeometry args={[0.24, 16, 16]} />
            </mesh>
            {/* Sunflower Mane Petals */}
            {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
              const rad = (angle * Math.PI) / 180;
              return (
                <mesh
                  key={i}
                  position={[Math.sin(rad) * 0.24, Math.cos(rad) * 0.24, 0.02]}
                  rotation={[0, 0, -rad]}
                >
                  <coneGeometry args={[0.07, 0.18, 4]} />
                  <meshStandardMaterial color={0xf28e13} roughness={0.4} />
                </mesh>
              );
            })}
            {/* Cute Lion Muzzle & Smiling Mouth */}
            <mesh position={[0, -0.04, -0.16]}>
              <sphereGeometry args={[0.09, 12, 12]} />
              <meshStandardMaterial color={0xffe599} roughness={0.5} />
            </mesh>
            {/* Cute Black Eyes */}
            <mesh position={[-0.08, 0.06, -0.21]}>
              <sphereGeometry args={[0.03, 8, 8]} />
              <meshBasicMaterial color={0x111111} />
            </mesh>
            <mesh position={[0.08, 0.06, -0.21]}>
              <sphereGeometry args={[0.03, 8, 8]} />
              <meshBasicMaterial color={0x111111} />
            </mesh>
            {/* Front Lion Paws */}
            <mesh position={[-0.22, -0.16, 0.08]} material={materials.hullYellow}>
              <sphereGeometry args={[0.09, 10, 10]} />
            </mesh>
            <mesh position={[0.22, -0.16, 0.08]} material={materials.hullYellow}>
              <sphereGeometry args={[0.09, 10, 10]} />
            </mesh>
          </group>

          {/* Main Mast & Billowing White Straw-Hat Sail */}
          <group position={[0, 0.65, -0.12]}>
            <mesh position={[0, 0.65, 0]} material={materials.mastBrown}>
              <cylinderGeometry args={[0.038, 0.045, 1.35, 12]} />
            </mesh>
            {/* Horizontal Yards / Cross-beams */}
            <mesh position={[0, 1.15, 0]} material={materials.mastBrown} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.024, 0.024, 0.98, 8]} />
            </mesh>
            <mesh position={[0, 0.58, 0]} material={materials.mastBrown} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.024, 0.024, 0.94, 8]} />
            </mesh>

            {/* Billowing Main Sail */}
            <group ref={sailRef} position={[0, 0.86, -0.05]}>
              <mesh material={materials.sailWhite}>
                <cylinderGeometry args={[0.48, 0.48, 0.64, 16, 1, true, -Math.PI * 0.36, Math.PI * 0.72]} />
              </mesh>
              {/* Straw Hat Skull Jolly Roger Emblem */}
              <mesh position={[0, 0.02, -0.49]}>
                <circleGeometry args={[0.16, 16]} />
                <meshBasicMaterial color={0x111111} transparent opacity={0.88} />
              </mesh>
              {/* Red Straw Hat band */}
              <mesh position={[0, 0.11, -0.50]}>
                <boxGeometry args={[0.24, 0.045, 0.02]} />
                <meshBasicMaterial color={0xd90429} />
              </mesh>
            </group>

            {/* Crow's Nest & Red/White Striped Roof */}
            <mesh position={[0, 1.28, 0]} material={materials.deckCream}>
              <cylinderGeometry args={[0.13, 0.11, 0.12, 12]} />
            </mesh>
            <mesh position={[0, 1.40, 0]} material={materials.hullRed}>
              <coneGeometry args={[0.16, 0.14, 12]} />
            </mesh>
          </group>

          {/* Stern Aft Cabin with Red Tiered Roof */}
          <group position={[0, 0.76, 0.48]}>
            <mesh material={materials.deckCream}>
              <boxGeometry args={[0.68, 0.32, 0.46]} />
            </mesh>
            <mesh position={[0, 0.22, 0]} material={materials.hullRed}>
              <boxGeometry args={[0.74, 0.12, 0.52]} />
            </mesh>
          </group>

          {/* Red Side Paddle Wheels (Port & Starboard) */}
          <mesh ref={wheelLeftRef} position={[-0.52, 0.34, 0.25]} rotation={[0, 0, Math.PI / 2]} material={materials.hullRed}>
            <cylinderGeometry args={[0.25, 0.25, 0.12, 8]} />
          </mesh>
          <mesh ref={wheelRightRef} position={[0.52, 0.34, 0.25]} rotation={[0, 0, Math.PI / 2]} material={materials.hullRed}>
            <cylinderGeometry args={[0.25, 0.25, 0.12, 8]} />
          </mesh>
        </group>
      )}

      {/* 2. GOING MERRY (Chibi White Sheep Ram Sloop) */}
      {type === "merry" && (
        <group>
          {/* Caramel Wood Hull */}
          <mesh position={[0, 0.32, 0]} material={materials.hullWood}>
            <boxGeometry args={[0.88, 0.48, 1.42]} />
          </mesh>
          <mesh position={[0, 0.58, 0]} material={materials.deckCream}>
            <boxGeometry args={[0.84, 0.04, 1.38]} />
          </mesh>

          {/* Going Merry White Sheep Figurehead on Bow (-Z) */}
          <group position={[0, 0.55, -0.78]}>
            <mesh material={materials.hullWhite}>
              <sphereGeometry args={[0.22, 16, 16]} />
            </mesh>
            {/* Curled Brown Ram Horns */}
            <mesh position={[-0.18, 0.12, -0.02]} rotation={[0, 0, -0.6]}>
              <torusGeometry args={[0.08, 0.03, 8, 12, Math.PI * 1.3]} />
              <meshStandardMaterial color={0x52341d} roughness={0.6} />
            </mesh>
            <mesh position={[0.18, 0.12, -0.02]} rotation={[0, 0, 0.6]}>
              <torusGeometry args={[0.08, 0.03, 8, 12, Math.PI * 1.3]} />
              <meshStandardMaterial color={0x52341d} roughness={0.6} />
            </mesh>
            {/* Cute Sheep Eyes & Mouth */}
            <mesh position={[-0.07, 0.02, -0.19]}>
              <sphereGeometry args={[0.026, 8, 8]} />
              <meshBasicMaterial color={0x111111} />
            </mesh>
            <mesh position={[0.07, 0.02, -0.19]}>
              <sphereGeometry args={[0.026, 8, 8]} />
              <meshBasicMaterial color={0x111111} />
            </mesh>
            {/* Red neck ribbon */}
            <mesh position={[0, -0.14, 0.06]}>
              <cylinderGeometry args={[0.14, 0.16, 0.08, 12]} />
              <meshStandardMaterial color={0xd90429} />
            </mesh>
          </group>

          {/* Main Mast with Large Billowing White Sail */}
          <group position={[0, 0.65, -0.1]}>
            <mesh position={[0, 0.65, 0]} material={materials.mastBrown}>
              <cylinderGeometry args={[0.035, 0.042, 1.38, 10]} />
            </mesh>
            <mesh position={[0, 1.20, 0]} material={materials.mastBrown} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.022, 0.022, 0.92, 8]} />
            </mesh>

            <group ref={sailRef} position={[0, 0.88, -0.04]}>
              <mesh material={materials.sailWhite}>
                <cylinderGeometry args={[0.46, 0.46, 0.68, 16, 1, true, -Math.PI * 0.35, Math.PI * 0.70]} />
              </mesh>
              {/* Jolly Roger Skull */}
              <mesh position={[0, 0.02, -0.47]}>
                <circleGeometry args={[0.15, 16]} />
                <meshBasicMaterial color={0x111111} transparent opacity={0.9} />
              </mesh>
            </group>

            {/* Crow's Nest */}
            <mesh position={[0, 1.30, 0]} material={materials.deckCream}>
              <cylinderGeometry args={[0.12, 0.09, 0.11, 10]} />
            </mesh>
          </group>

          {/* Triangular Bowsprit Headsail */}
          <mesh position={[0, 0.88, -0.55]} rotation={[0.4, 0, 0]}>
            <coneGeometry args={[0.22, 0.62, 3]} />
            <meshStandardMaterial color={0xffffff} roughness={0.7} />
          </mesh>

          {/* Rear Cabin & Jolly Roger Pirate Flag on Stern Pole */}
          <mesh position={[0, 0.74, 0.44]} material={materials.hullWood}>
            <boxGeometry args={[0.66, 0.28, 0.42]} />
          </mesh>
          <group position={[0.28, 0.82, 0.62]}>
            <mesh material={materials.mastBrown}>
              <cylinderGeometry args={[0.015, 0.015, 0.52, 6]} />
            </mesh>
            <mesh ref={flagRef} position={[-0.14, 0.16, 0]} material={materials.blackFlag}>
              <planeGeometry args={[0.26, 0.16]} />
            </mesh>
          </group>
        </group>
      )}

      {/* 3. POLAR TANG (Trafalgar Law's Canary Yellow Submarine) */}
      {type === "polar" && (
        <group>
          {/* Streamlined Yellow Submarine Hull */}
          <mesh position={[0, 0.38, 0]} material={materials.hullYellow}>
            <sphereGeometry args={[0.48, 24, 16]} />
          </mesh>
          <mesh position={[0, 0.38, 0]} scale={[0.9, 0.78, 1.62]} material={materials.hullYellow}>
            <sphereGeometry args={[0.48, 24, 16]} />
          </mesh>

          {/* Conning Tower & Observation Deck */}
          <mesh position={[0, 0.72, -0.05]} material={materials.hullYellow}>
            <cylinderGeometry args={[0.28, 0.32, 0.32, 16]} />
          </mesh>
          {/* Glass Observation Dome */}
          <mesh position={[0, 0.90, -0.05]} material={materials.glassCockpit}>
            <sphereGeometry args={[0.22, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
          </mesh>

          {/* Dual Yellow Periscopes / Antennae */}
          <mesh position={[-0.12, 1.15, -0.1]} material={materials.hullYellow}>
            <cylinderGeometry args={[0.022, 0.025, 0.45, 8]} />
          </mesh>
          <mesh position={[0.12, 1.15, -0.1]} material={materials.hullYellow}>
            <cylinderGeometry args={[0.022, 0.025, 0.45, 8]} />
          </mesh>

          {/* Round Portholes on Port & Starboard */}
          {[-0.32, 0.0, 0.32].map((z, i) => (
            <React.Fragment key={i}>
              <mesh position={[-0.44, 0.42, z]} rotation={[0, -Math.PI / 2, 0]} material={materials.glassCockpit}>
                <circleGeometry args={[0.065, 12]} />
              </mesh>
              <mesh position={[0.44, 0.42, z]} rotation={[0, Math.PI / 2, 0]} material={materials.glassCockpit}>
                <circleGeometry args={[0.065, 12]} />
              </mesh>
            </React.Fragment>
          ))}

          {/* Black Jolly Roger Emblem with "DEATH" style Law crest */}
          <mesh position={[0.45, 0.42, -0.12]} rotation={[0, Math.PI / 2, 0]} material={materials.blackFlag}>
            <planeGeometry args={[0.18, 0.14]} />
          </mesh>

          {/* Twin Rear Propeller / Thruster */}
          <group position={[0, 0.36, 0.82]}>
            <mesh material={materials.mastBrown}>
              <cylinderGeometry args={[0.05, 0.07, 0.12, 8]} />
            </mesh>
            <mesh ref={propRef} material={materials.hullGold}>
              <boxGeometry args={[0.34, 0.06, 0.02]} />
            </mesh>
          </group>

          {/* Stern Vertical Rudder Fin */}
          <mesh position={[0, 0.58, 0.65]} material={materials.hullYellow}>
            <boxGeometry args={[0.06, 0.28, 0.32]} />
          </mesh>
        </group>
      )}

      {/* 4. RED FORCE / BIG TOP (Chibi Crimson Circus Galleon) */}
      {type === "redforce" && (
        <group>
          {/* Crimson Red Hull with White Stripes */}
          <mesh position={[0, 0.30, 0]} material={materials.hullRed}>
            <boxGeometry args={[0.92, 0.46, 1.48]} />
          </mesh>
          <mesh position={[0, 0.55, 0]} material={materials.deckCream}>
            <boxGeometry args={[0.88, 0.05, 1.44]} />
          </mesh>
          {/* Gold Trim Trim Line */}
          <mesh position={[0, 0.46, 0]} material={materials.hullGold}>
            <boxGeometry args={[0.95, 0.05, 1.50]} />
          </mesh>

          {/* Elephant / Circus Mask Bow Figurehead */}
          <group position={[0, 0.52, -0.80]}>
            <mesh material={materials.hullRed}>
              <sphereGeometry args={[0.22, 14, 14]} />
            </mesh>
            {/* Trunk */}
            <mesh position={[0, -0.14, -0.14]} rotation={[0.6, 0, 0]} material={materials.deckCream}>
              <cylinderGeometry args={[0.05, 0.08, 0.28, 8]} />
            </mesh>
            {/* Cute clown hat */}
            <mesh position={[0, 0.22, 0]} material={materials.hullGold}>
              <coneGeometry args={[0.12, 0.22, 8]} />
            </mesh>
          </group>

          {/* Dual Masts with Red-and-White Striped Billowing Sails */}
          {[-0.24, 0.24].map((zPos, i) => (
            <group key={i} position={[0, 0.65, zPos]}>
              <mesh position={[0, 0.62, 0]} material={materials.mastBrown}>
                <cylinderGeometry args={[0.032, 0.038, 1.30, 8]} />
              </mesh>
              <mesh position={[0, 1.15, 0]} material={materials.hullGold} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.02, 0.02, 0.88, 8]} />
              </mesh>
              <group position={[0, 0.82, -0.04]}>
                <mesh material={i === 0 ? materials.sailStripedRed : materials.sailWhite}>
                  <cylinderGeometry args={[0.42, 0.42, 0.58, 14, 1, true, -Math.PI * 0.35, Math.PI * 0.70]} />
                </mesh>
              </group>
              <mesh position={[0, 1.25, 0]} material={materials.hullGold}>
                <sphereGeometry args={[0.09, 8, 8]} />
              </mesh>
            </group>
          ))}

          {/* Ornate Stern Castle */}
          <mesh position={[0, 0.76, 0.52]} material={materials.hullRed}>
            <boxGeometry args={[0.72, 0.36, 0.44]} />
          </mesh>
        </group>
      )}

      {/* 5. ARK MAXIM (Golden Ancient Floating Vessel) */}
      {type === "maxim" && (
        <group>
          {/* Golden Sand / Brass Hull */}
          <mesh position={[0, 0.32, 0]} material={materials.hullGold}>
            <boxGeometry args={[0.94, 0.48, 1.52]} />
          </mesh>
          <mesh position={[0, 0.58, 0]} material={materials.deckCream}>
            <boxGeometry args={[0.88, 0.04, 1.46]} />
          </mesh>

          {/* Golden Face Mask Figurehead on Bow */}
          <group position={[0, 0.54, -0.80]}>
            <mesh material={materials.hullGold}>
              <sphereGeometry args={[0.22, 16, 16]} />
            </mesh>
            <mesh position={[0, 0.22, 0]} material={materials.hullGold}>
              <coneGeometry args={[0.14, 0.24, 8]} />
            </mesh>
          </group>

          {/* Tall Central Pagoda / Temple Cabin */}
          <mesh position={[0, 0.78, 0.22]} material={materials.hullWood}>
            <boxGeometry args={[0.62, 0.36, 0.58]} />
          </mesh>
          <mesh position={[0, 1.02, 0.22]} material={materials.hullGold}>
            <boxGeometry args={[0.72, 0.12, 0.68]} />
          </mesh>

          {/* Main Mast with Silk Gold/Beige Sail */}
          <group position={[0, 0.65, -0.22]}>
            <mesh position={[0, 0.65, 0]} material={materials.hullGold}>
              <cylinderGeometry args={[0.035, 0.042, 1.35, 8]} />
            </mesh>
            <group ref={sailRef} position={[0, 0.88, -0.04]}>
              <mesh material={materials.deckCream}>
                <cylinderGeometry args={[0.44, 0.44, 0.64, 14, 1, true, -Math.PI * 0.35, Math.PI * 0.70]} />
              </mesh>
            </group>
          </group>

          {/* Golden Side Paddle Wheels */}
          <mesh ref={wheelLeftRef} position={[-0.54, 0.32, 0.1]} rotation={[0, 0, Math.PI / 2]} material={materials.hullGold}>
            <cylinderGeometry args={[0.28, 0.28, 0.12, 12]} />
          </mesh>
          <mesh ref={wheelRightRef} position={[0.54, 0.32, 0.1]} rotation={[0, 0, Math.PI / 2]} material={materials.hullGold}>
            <cylinderGeometry args={[0.28, 0.28, 0.12, 12]} />
          </mesh>
        </group>
      )}

      {/* Tiny Waterline Foam Ring when sailing */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.55, 0.82, 16]} />
        <meshBasicMaterial
          color={0xffffff}
          transparent
          opacity={0.35 + (defianceLevel > 0.1 ? 0.3 : 0)}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
    </group>
  );
}

export default PirateShip;
