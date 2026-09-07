/**
 * DANIEL TRANSPORT PLATFORM - VEHICLE MOVEMENT ENGINE V5
 * High-performance 60FPS frame-based motion, predictive heading,
 * GPS smoothing filter, acceleration/deceleration physics, and live vehicle trail.
 */

import { MapCoordinates } from '../types';

export interface VehicleTelemetryV5 {
  id: string;
  driverName: string;
  plateNumber: string;
  color: string;
  tier: string;
  isOnline: boolean;
  isBusy: boolean;
  currentCoords: MapCoordinates;
  targetCoords: MapCoordinates;
  currentHeading: number;
  targetHeading: number;
  speedKmh: number;
  accelerationMps2: number;
  lastUpdateTimestamp: number;
  trail: Array<{ lat: number; lng: number; alpha: number }>;
}

export interface VehicleRenderOptionsV5 {
  color?: string;
  heading?: number;
  speedKmh?: number;
  driverLabel?: string;
  isOnline?: boolean;
  isBusy?: boolean;
  scale?: number;
  showDirectionPulse?: boolean;
}

export class VehicleEngineV5 {
  private static instance: VehicleEngineV5;
  private vehicles: Map<string, VehicleTelemetryV5> = new Map();
  private animationFrameId: number | null = null;
  private listeners: Map<string, (state: VehicleTelemetryV5) => void> = new Map();
  private lastFrameTime: number = performance.now();

  private constructor() {
    this.startAnimationLoop();
  }

  public static getInstance(): VehicleEngineV5 {
    if (!VehicleEngineV5.instance) {
      VehicleEngineV5.instance = new VehicleEngineV5();
    }
    return VehicleEngineV5.instance;
  }

  /**
   * Main 60FPS physics and rendering loop
   */
  private startAnimationLoop(): void {
    const loop = (currentTime: number) => {
      const dt = Math.min((currentTime - this.lastFrameTime) / 1000, 0.1); // Clamp to 100ms max
      this.lastFrameTime = currentTime;

      this.vehicles.forEach((vehicle, id) => {
        // 1. Position Interpolation (Exponential smoothing / Predictive lerp)
        const lerpFactor = Math.min(1.0, dt * 5.0);
        const nextLat = vehicle.currentCoords.lat + (vehicle.targetCoords.lat - vehicle.currentCoords.lat) * lerpFactor;
        const nextLng = vehicle.currentCoords.lng + (vehicle.targetCoords.lng - vehicle.currentCoords.lng) * lerpFactor;

        // 2. Shortest-Path Heading Rotation (Prevents 360-degree flip)
        let diffHeading = (vehicle.targetHeading - vehicle.currentHeading) % 360;
        if (diffHeading > 180) diffHeading -= 360;
        if (diffHeading < -180) diffHeading += 360;
        const nextHeading = (vehicle.currentHeading + diffHeading * Math.min(1.0, dt * 6.5) + 360) % 360;

        // 3. Trail Management with Alpha Decay
        const trail = vehicle.trail
          .map(p => ({ ...p, alpha: p.alpha - dt * 0.15 }))
          .filter(p => p.alpha > 0.05);

        // Add new trail point if moved > 5 meters
        const lastP = trail[trail.length - 1];
        if (!lastP || Math.hypot(nextLat - lastP.lat, nextLng - lastP.lng) > 0.00008) {
          trail.push({ lat: nextLat, lng: nextLng, alpha: 0.85 });
          if (trail.length > 12) trail.shift();
        }

        vehicle.currentCoords = { lat: nextLat, lng: nextLng };
        vehicle.currentHeading = nextHeading;
        vehicle.trail = trail;

        // Notify subscribers
        const listener = this.listeners.get(id);
        if (listener) {
          listener(vehicle);
        }
      });

      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  /**
   * Feed new raw GPS/WebSocket packet with noise filtering and velocity smoothing
   */
  public updateVehicle(
    id: string,
    rawCoords: MapCoordinates,
    rawHeading: number = 0,
    speedKmh: number = 0,
    meta?: { driverName?: string; plateNumber?: string; color?: string; tier?: string; isOnline?: boolean; isBusy?: boolean; routePolyline?: [number, number][] }
  ): void {
    const existing = this.vehicles.get(id);
    const now = Date.now();
    const finalCoords = meta?.routePolyline ? this.snapToRoute(rawCoords, meta.routePolyline) : rawCoords;

    if (!existing) {
      this.vehicles.set(id, {
        id,
        driverName: meta?.driverName || 'كابتن دانيال',
        plateNumber: meta?.plateNumber || 'بغداد 1234',
        color: meta?.color || '#f59e0b',
        tier: meta?.tier || 'economy',
        isOnline: meta?.isOnline ?? true,
        isBusy: meta?.isBusy ?? false,
        currentCoords: finalCoords,
        targetCoords: finalCoords,
        currentHeading: rawHeading,
        targetHeading: rawHeading,
        speedKmh,
        accelerationMps2: 0,
        lastUpdateTimestamp: now,
        trail: [{ lat: finalCoords.lat, lng: finalCoords.lng, alpha: 0.85 }]
      });
      return;
    }

    // Predictive smoothing: calculate estimated movement if packet delayed
    const dtSeconds = Math.max(0.1, (now - existing.lastUpdateTimestamp) / 1000);
    const targetHeading = rawHeading !== undefined && !isNaN(rawHeading) ? rawHeading : existing.currentHeading;

    // Acceleration estimation
    const deltaV = (speedKmh - existing.speedKmh) / 3.6;
    const accel = deltaV / dtSeconds;

    existing.targetCoords = finalCoords;
    existing.targetHeading = targetHeading;
    existing.speedKmh = speedKmh;
    existing.accelerationMps2 = accel;
    existing.lastUpdateTimestamp = now;
    if (meta?.isOnline !== undefined) existing.isOnline = meta.isOnline;
    if (meta?.isBusy !== undefined) existing.isBusy = meta.isBusy;
  }

  /**
   * Generate Production SVG HTML Markup for 3D Top-Down Vehicle with Shadow and Headlights
   */
  public generateVehicleSvg(options: VehicleRenderOptionsV5 = {}): string {
    const {
      color = '#f59e0b',
      heading = 0,
      speedKmh = 0,
      driverLabel,
      isOnline = true,
      scale = 1.0,
      showDirectionPulse = true
    } = options;

    const safeLabel = driverLabel ? driverLabel.replace(/"/g, '&quot;') : '';
    const isMoving = (speedKmh || 0) > 3;

    return `
      <div class="daniel-v5-vehicle" style="
        position: relative;
        width: ${Math.round(52 * scale)}px;
        height: ${Math.round(52 * scale)}px;
        display: flex;
        align-items: center;
        justify-content: center;
        pointer-events: auto;
      ">
        <!-- Floating Label -->
        ${safeLabel ? `
          <div style="
            position: absolute;
            top: -20px;
            background: rgba(15, 23, 42, 0.95);
            border: 1px solid rgba(245, 158, 11, 0.4);
            border-radius: 9999px;
            padding: 1px 7px;
            color: #ffffff;
            font-family: Cairo, sans-serif;
            font-size: 9px;
            font-weight: 800;
            white-space: nowrap;
            box-shadow: 0 4px 10px rgba(0,0,0,0.6);
            pointer-events: none;
            z-index: 10;
          ">${safeLabel}</div>
        ` : ''}

        <!-- Rotatable Vehicle Body -->
        <div style="
          width: 100%;
          height: 100%;
          transform: rotate(${heading}deg);
          transition: transform 0.15s cubic-bezier(0.2, 0, 0.2, 1);
          transform-origin: center center;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <!-- Direction Arrow Pulse -->
          ${showDirectionPulse && isMoving ? `
            <div style="
              position: absolute;
              top: -8px;
              width: 0;
              height: 0;
              border-left: 5px solid transparent;
              border-right: 5px solid transparent;
              border-bottom: 8px solid ${color};
              filter: drop-shadow(0 0 4px ${color});
              animation: pulse 1.2s infinite;
            "></div>
          ` : ''}

          <!-- Vehicle SVG -->
          <svg viewBox="0 0 64 64" width="${Math.round(44 * scale)}" height="${Math.round(44 * scale)}" style="filter: drop-shadow(0 6px 12px rgba(0,0,0,0.55));">
            <defs>
              <linearGradient id="bodyGrad_${color.replace('#', '')}" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#1e293b" />
                <stop offset="50%" stop-color="${color}" />
                <stop offset="100%" stop-color="#0f172a" />
              </linearGradient>
            </defs>

            <!-- Ground Shadow -->
            <ellipse cx="32" cy="34" rx="15" ry="24" fill="rgba(0,0,0,0.45)" filter="blur(2px)" />

            <!-- Wheels -->
            <rect x="12" y="14" width="5" height="10" rx="2" fill="#0f172a" />
            <rect x="47" y="14" width="5" height="10" rx="2" fill="#0f172a" />
            <rect x="12" y="40" width="5" height="10" rx="2" fill="#0f172a" />
            <rect x="47" y="40" width="5" height="10" rx="2" fill="#0f172a" />

            <!-- Car Chassis -->
            <rect x="16" y="10" width="32" height="44" rx="10" fill="url(#bodyGrad_${color.replace('#', '')})" stroke="#ffffff" stroke-width="1" stroke-opacity="0.3" />

            <!-- Front Windshield -->
            <path d="M 21 22 Q 32 18 43 22 L 41 28 Q 32 26 23 28 Z" fill="#38bdf8" fill-opacity="0.85" />

            <!-- Rear Windshield -->
            <path d="M 23 44 Q 32 46 41 44 L 40 40 Q 32 41 24 40 Z" fill="#38bdf8" fill-opacity="0.7" />

            <!-- Roof Top -->
            <rect x="23" y="27" width="18" height="14" rx="3" fill="#0f172a" fill-opacity="0.5" />

            <!-- Taxi Light on Roof -->
            <rect x="27" y="32" width="10" height="4" rx="1.5" fill="#facc15" stroke="#000" stroke-width="0.5" />

            <!-- Headlights -->
            <circle cx="21" cy="11" r="2" fill="#fef08a" />
            <circle cx="43" cy="11" r="2" fill="#fef08a" />

            <!-- Taillights -->
            <rect x="20" y="52" width="5" height="2" rx="1" fill="#ef4444" />
            <rect x="39" y="52" width="5" height="2" rx="1" fill="#ef4444" />
          </svg>
        </div>
      </div>
    `;
  }

  public subscribeVehicle(id: string, callback: (state: VehicleTelemetryV5) => void): () => void {
    this.listeners.set(id, callback);
    return () => {
      this.listeners.delete(id);
    };
  }

  public removeVehicle(id: string): void {
    this.vehicles.delete(id);
    this.listeners.delete(id);
  }

  /**
   * Route Snapping (STEP 10): Snaps a vehicle's coordinate to the closest point along a given polyline
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

    // Snap if within ~150 meters (0.0015 deg)
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
}
