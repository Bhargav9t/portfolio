export interface BlackHoleState {
  position: [number, number, number];
  x: number;
  y: number;
  z: number;
  suctionIntensity: number; // 0 (hidden/night) to 1 (full intensity at noon)
  isVisible: boolean;
  sinT: number;
  cosT: number;
}

export function getBlackHoleState(timeOfDay: number): BlackHoleState {
  const cosT = Math.cos(timeOfDay);
  const sinT = Math.sin(timeOfDay);

  // Position black hole prominently in celestial horizon at Z = -20.5, Y = 4.2..5.7
  // with gentle orbital drift centered in the screen view
  const x = -cosT * 4.5;
  const y = 4.2 + Math.max(0, sinT) * 1.5;
  const z = -20.5;

  const isVisible = true;
  const suctionIntensity = 1.0;

  return {
    position: [x, y, z],
    x,
    y,
    z,
    suctionIntensity,
    isVisible,
    sinT,
    cosT,
  };
}
