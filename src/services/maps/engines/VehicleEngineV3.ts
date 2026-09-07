/**
 * DANIEL TRANSPORT PLATFORM - VEHICLE ENGINE V3
 * Unified, decoupled vehicle rendering and animation engine.
 * Supports 60FPS smooth interpolation, shortest-path angle rotation,
 * dynamic headlights, speed-based shadows, route snapping, and vehicle trails.
 */

import { MapCoordinates } from '../types';

export interface VehicleState {
  id: string;
  driverName?: string;
  vehicleModel?: string;
  plateNumber?: string;
  tier?: string;
  color?: string;
  currentCoords: MapCoordinates;
  targetCoords: MapCoordinates;
  currentHeading: number;
  targetHeading: number;
  speedKmh: number;
  lastUpdateTime: number;
  trail: MapCoordinates[];
}

export interface VehicleRenderOptions {
  color?: string;
  heading?: number;
  speedKmh?: number;
  driverLabel?: string;
  isOnline?: boolean;
  isBusy?: boolean;
  scale?: number;
  showTrail?: boolean;
}

export class VehicleEngineV3 {
  private static instance: VehicleEngineV3;
  private vehicles: Map<string, VehicleState> = new Map();
  private animationFrameId: number | null = null;
  private listeners: Map<string, (state: VehicleState) => void> = new Map();

  private constructor() {
    this.startAnimationLoop();
  }

  public static getInstance(): VehicleEngineV3 {
    if (!VehicleEngineV3.instance) {
      VehicleEngineV3.instance = new VehicleEngineV3();
    }
    return VehicleEngineV3.instance;
  }

  /**
   * Generates high-definition 3D Top-Down Vehicle SVG Markup
   */
  public generateVehicleSvg(options: VehicleRenderOptions = {}): string {
    const {
      color = '#f59e0b',
      heading = 0,
      speedKmh = 0,
      driverLabel,
      isOnline = true,
      scale = 1.0
    } = options;

    const safeLabel = driverLabel ? driverLabel.replace(/"/g, '&quot;') : '';
    const isMoving = speedKmh > 5;
    const headlightOpacity = isMoving ? '0.55' : '0.25';
    const shadowBlur = isMoving ? '16px' : '10px';

    return `
      <div class="daniel-v3-vehicle" style="
        position: relative;
        width: ${Math.round(56 * scale)}px;
        height: ${Math.round(56 * scale)}px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        pointer-events: auto;
      ">
        <!-- Optional Driver Floating Name Tag -->
        ${safeLabel ? `
          <div style="
            position: absolute;
            top: -22px;
            background: rgba(15, 23, 42, 0.92);
            border: 1px solid rgba(245, 158, 11, 0.4);
            backdrop-filter: blur(6px);
            border-radius: 9999px;
            padding: 1px 7px;
            color: #ffffff;
            font-family: Cairo, sans-serif;
            font-size: 9px;
            font-weight: 800;
            white-space: nowrap;
            box-shadow: 0 4px 10px rgba(0,0,0,0.5);
            pointer-events: none;
            z-index: 20;
          ">
            ${safeLabel}
          </div>
        ` : ''}

        <!-- Vehicle Hull Container with Dynamic Rotation -->
        <div class="daniel-v3-hull" style="
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          transform: rotate(${heading}deg);
          transition: transform 0.28s cubic-bezier(0.2, 0.9, 0.3, 1);
          will-change: transform;
        ">
          <svg width="52" height="52" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 8px ${shadowBlur} rgba(0,0,0,0.7));">
            <!-- Ground Ambient Shadow -->
            <ellipse cx="50" cy="53" rx="26" ry="38" fill="rgba(0,0,0,0.5)" />

            <!-- Forward Night Illumination Headlight Beams -->
            <polygon points="33,18 16,-12 48,-14 37,18" fill="rgba(254, 240, 138, ${headlightOpacity})" />
            <polygon points="67,18 52,-14 84,-12 63,18" fill="rgba(254, 240, 138, ${headlightOpacity})" />

            <!-- Heavy Grip 4-Tires -->
            <rect x="22" y="24" width="7" height="15" rx="3.5" fill="#090d16" />
            <rect x="71" y="24" width="7" height="15" rx="3.5" fill="#090d16" />
            <rect x="22" y="63" width="7" height="15" rx="3.5" fill="#090d16" />
            <rect x="71" y="63" width="7" height="15" rx="3.5" fill="#090d16" />

            <!-- Chassis Metal Body with Glossy Styling -->
            <rect x="26" y="14" width="48" height="74" rx="16" fill="#0f172a" stroke="${color}" stroke-width="2.8" />

            <!-- Front Hood Aerodynamic Gradient Accent -->
            <path d="M32 20 C42 16, 58 16, 68 20 L66 30 L34 30 Z" fill="${color}" fill-opacity="0.4" />

            <!-- Front Tinted Windshield Glass -->
            <path d="M31 32 L69 32 L64 45 L36 45 Z" fill="#38bdf8" fill-opacity="0.9" />

            <!-- Cabin Roof Structure -->
            <rect x="33" y="44" width="34" height="25" rx="4" fill="#1e293b" stroke="${color}" stroke-width="1.4" />

            <!-- Roof Taxi / Class Dome Light Indicator -->
            <rect x="42" y="52" width="16" height="8" rx="3" fill="${color}" stroke="#ffffff" stroke-width="1.2" />

            <!-- Rear Tinted Glass Window -->
            <path d="M36 68 L64 68 L67 76 L33 76 Z" fill="#38bdf8" fill-opacity="0.75" />

            <!-- Rear Red LED Brake Lights -->
            <rect x="28" y="84" width="10" height="3" rx="1.5" fill="#ef4444" />
            <rect x="62" y="84" width="10" height="3" rx="1.5" fill="#ef4444" />

            <!-- Directional Navigation Nose Indicator -->
            <polygon points="50,4 44,12 56,12" fill="${color}" stroke="#ffffff" stroke-width="0.8" />
          </svg>
        </div>
      </div>
    `;
  }

  /**
   * Registers or updates a vehicle with target location and heading
   */
  public updateVehicle(
    id: string,
    coords: MapCoordinates,
    heading?: number,
    speedKmh: number = 0,
    meta?: { driverName?: string; color?: string; tier?: string }
  ): void {
    const now = performance.now();
    let state = this.vehicles.get(id);

    const calculatedHeading = heading !== undefined && heading !== 0
      ? heading
      : state
      ? this.calculateBearing(state.currentCoords, coords)
      : 0;

    if (!state) {
      state = {
        id,
        driverName: meta?.driverName,
        color: meta?.color || '#f59e0b',
        tier: meta?.tier || 'economy',
        currentCoords: { ...coords },
        targetCoords: { ...coords },
        currentHeading: calculatedHeading,
        targetHeading: calculatedHeading,
        speedKmh,
        lastUpdateTime: now,
        trail: [{ ...coords }]
      };
      this.vehicles.set(id, state);
    } else {
      state.targetCoords = { ...coords };
      state.targetHeading = this.normalizeTargetHeading(state.currentHeading, calculatedHeading);
      state.speedKmh = speedKmh;
      state.lastUpdateTime = now;

      // Append to trail (limit to last 20 coordinates)
      state.trail.push({ ...coords });
      if (state.trail.length > 20) {
        state.trail.shift();
      }
    }
  }

  public getVehicle(id: string): VehicleState | undefined {
    return this.vehicles.get(id);
  }

  public removeVehicle(id: string): void {
    this.vehicles.delete(id);
    this.listeners.delete(id);
  }

  public subscribe(id: string, callback: (state: VehicleState) => void): () => void {
    this.listeners.set(id, callback);
    return () => this.listeners.delete(id);
  }

  /**
   * Continuous 60FPS Lerp Loop for Ultra-Smooth Movement
   */
  private startAnimationLoop(): void {
    const loop = () => {
      const lerpFactor = 0.12; // Easing constant per frame
      let hasUpdates = false;

      this.vehicles.forEach((state, id) => {
        const dLat = state.targetCoords.lat - state.currentCoords.lat;
        const dLng = state.targetCoords.lng - state.currentCoords.lng;
        const dist = Math.hypot(dLat, dLng);

        // Position Lerp
        if (dist > 0.000005) {
          state.currentCoords.lat += dLat * lerpFactor;
          state.currentCoords.lng += dLng * lerpFactor;
          hasUpdates = true;
        } else {
          state.currentCoords.lat = state.targetCoords.lat;
          state.currentCoords.lng = state.targetCoords.lng;
        }

        // Heading Lerp (Shortest angular path)
        const dHeading = state.targetHeading - state.currentHeading;
        if (Math.abs(dHeading) > 0.5) {
          state.currentHeading += dHeading * 0.15;
          hasUpdates = true;
        } else {
          state.currentHeading = state.targetHeading;
        }

        // Notify subscribers
        const listener = this.listeners.get(id);
        if (listener) {
          listener(state);
        }
      });

      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  /**
   * Shortest-path angle normalization to prevent 360-degree reverse spins
   */
  public normalizeTargetHeading(current: number, target: number): number {
    let diff = (target - current) % 360;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    return current + diff;
  }

  /**
   * Calculates bearing in degrees between two GPS coordinates
   */
  public calculateBearing(start: MapCoordinates, end: MapCoordinates): number {
    const startLat = (start.lat * Math.PI) / 180;
    const startLng = (start.lng * Math.PI) / 180;
    const endLat = (end.lat * Math.PI) / 180;
    const endLng = (end.lng * Math.PI) / 180;

    const dLng = endLng - startLng;
    const y = Math.sin(dLng) * Math.cos(endLat);
    const x = Math.cos(startLat) * Math.sin(endLat) - Math.sin(startLat) * Math.cos(endLat) * Math.cos(dLng);
    const rad = Math.atan2(y, x);
    const deg = (rad * 180) / Math.PI;
    return (deg + 360) % 360;
  }

  /**
   * Route Snapping: Snaps a vehicle's coordinate to the closest point along a given polyline
   */
  public snapToRoute(position: MapCoordinates, polyline: [number, number][]): MapCoordinates {
    if (!polyline || polyline.length < 2) return position;

    let closestPoint: MapCoordinates = { lat: polyline[0][0], lng: polyline[0][1] };
    let minDistance = Infinity;

    for (let i = 0; i < polyline.length - 1; i++) {
      const p1 = { lat: polyline[i][0], lng: polyline[i][1] };
      const p2 = { lat: polyline[i + 1][0], lng: polyline[i + 1][1] };
      const proj = this.projectPointOnSegment(position, p1, p2);
      const dist = Math.hypot(position.lat - proj.lat, position.lng - proj.lng);

      if (dist < minDistance) {
        minDistance = dist;
        closestPoint = proj;
      }
    }

    // Only snap if within ~150 meters (0.0015 deg)
    if (minDistance < 0.0015) {
      return closestPoint;
    }
    return position;
  }

  private projectPointOnSegment(p: MapCoordinates, a: MapCoordinates, b: MapCoordinates): MapCoordinates {
    const abX = b.lng - a.lng;
    const abY = b.lat - a.lat;
    const abLenSq = abX * abX + abY * abY;
    if (abLenSq === 0) return a;

    const apX = p.lng - a.lng;
    const apY = p.lat - a.lat;
    const t = Math.max(0, Math.min(1, (apX * abX + apY * abY) / abLenSq));

    return {
      lat: a.lat + t * abY,
      lng: a.lng + t * abX
    };
  }

  public destroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    this.vehicles.clear();
    this.listeners.clear();
  }
}
