/**
 * DANIEL TRANSPORT PLATFORM - NAVIGATION ENGINE V3
 * Independent Turn-by-Turn Navigation & Route Guidance Engine.
 * Decoupled from any single map provider.
 * Supports Google Routes, HERE Routing v8, Mapbox Directions v5, and OSRM fallback.
 */

import { MapCoordinates, NavigationStep, RouteCalculationResult, MapProviderType } from '../types';
import { TrafficEngine } from './TrafficEngine';

export interface NavigationState {
  isActive: boolean;
  destination: MapCoordinates;
  destinationName: string;
  totalDistanceKm: number;
  remainingDistanceKm: number;
  totalDurationMins: number;
  remainingDurationMins: number;
  etaTimeStr: string;
  currentStepIndex: number;
  currentStep: NavigationStep | null;
  nextStep: NavigationStep | null;
  distanceToNextTurnMeters: number;
  progressPercent: number;
  offRouteCount: number;
  needsRecalculation: boolean;
  routePolyline: [number, number][];
}

export class NavigationEngineV3 {
  private static instance: NavigationEngineV3;
  private state: NavigationState | null = null;
  private subscribers: Array<(state: NavigationState | null) => void> = [];
  private trafficEngine = TrafficEngine.getInstance();

  private constructor() {}

  public static getInstance(): NavigationEngineV3 {
    if (!NavigationEngineV3.instance) {
      NavigationEngineV3.instance = new NavigationEngineV3();
    }
    return NavigationEngineV3.instance;
  }

  /**
   * Start active navigation along a calculated route
   */
  public startNavigation(
    route: RouteCalculationResult,
    destinationName: string = 'الوجهة المحددة'
  ): NavigationState {
    const steps = route.steps && route.steps.length > 0
      ? route.steps
      : this.synthesizeStepsFromPolyline(route.coordinates);

    const now = new Date();
    const etaDate = new Date(now.getTime() + route.durationMins * 60000);
    const etaTimeStr = etaDate.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' });

    const destCoords = route.coordinates[route.coordinates.length - 1];
    const destination: MapCoordinates = { lat: destCoords[0], lng: destCoords[1] };

    this.state = {
      isActive: true,
      destination,
      destinationName,
      totalDistanceKm: route.distanceKm,
      remainingDistanceKm: route.distanceKm,
      totalDurationMins: route.durationMins,
      remainingDurationMins: route.durationMins,
      etaTimeStr,
      currentStepIndex: 0,
      currentStep: steps[0] || null,
      nextStep: steps[1] || null,
      distanceToNextTurnMeters: steps[0]?.distanceMeters || 300,
      progressPercent: 0,
      offRouteCount: 0,
      needsRecalculation: false,
      routePolyline: route.coordinates
    };

    this.notify();
    return this.state;
  }

  /**
   * Update navigation progress with new vehicle position
   */
  public updatePosition(currentCoords: MapCoordinates, speedKmh: number = 40): NavigationState | null {
    if (!this.state || !this.state.isActive) return null;

    const poly = this.state.routePolyline;
    if (!poly || poly.length < 2) return this.state;

    // 1. Calculate distance to destination
    const dest = this.state.destination;
    const remainingDistKm = Math.round(
      Math.hypot(currentCoords.lat - dest.lat, currentCoords.lng - dest.lng) * 111.32 * 10
    ) / 10;

    // 2. Check if vehicle arrived
    if (remainingDistKm < 0.05) {
      this.state.remainingDistanceKm = 0;
      this.state.remainingDurationMins = 0;
      this.state.progressPercent = 100;
      this.state.currentStep = {
        id: 'step-arrive',
        instruction: 'وصلت إلى وجهتك',
        instructionAr: 'وصلت إلى وجهتك بحمد الله',
        distanceMeters: 0,
        durationSeconds: 0,
        turnType: 'arrive',
        coordinate: dest
      };
      this.notify();
      return this.state;
    }

    // 3. Find closest segment on polyline
    let minDistanceToPolyline = Infinity;
    let closestIndex = 0;

    for (let i = 0; i < poly.length; i++) {
      const dist = Math.hypot(currentCoords.lat - poly[i][0], currentCoords.lng - poly[i][1]) * 111320;
      if (dist < minDistanceToPolyline) {
        minDistanceToPolyline = dist;
        closestIndex = i;
      }
    }

    // 4. Off-route detection (Vehicle > 120m away from planned route)
    if (minDistanceToPolyline > 120) {
      this.state.offRouteCount += 1;
      if (this.state.offRouteCount >= 3) {
        this.state.needsRecalculation = true;
      }
    } else {
      this.state.offRouteCount = 0;
      this.state.needsRecalculation = false;
    }

    // 5. Update progress percentage and ETA
    const progress = Math.min(99, Math.round((closestIndex / (poly.length - 1)) * 100));
    this.state.progressPercent = progress;
    this.state.remainingDistanceKm = Math.max(0.1, remainingDistKm);

    const speed = Math.max(15, speedKmh);
    const estMins = Math.max(1, Math.round((this.state.remainingDistanceKm / speed) * 60));
    this.state.remainingDurationMins = estMins;

    const now = new Date();
    const etaDate = new Date(now.getTime() + estMins * 60000);
    this.state.etaTimeStr = etaDate.toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' });

    this.notify();
    return this.state;
  }

  /**
   * Stop active navigation
   */
  public stopNavigation(): void {
    if (this.state) {
      this.state.isActive = false;
    }
    this.state = null;
    this.notify();
  }

  public getState(): NavigationState | null {
    return this.state;
  }

  public subscribe(callback: (state: NavigationState | null) => void): () => void {
    this.subscribers.push(callback);
    callback(this.state);
    return () => {
      this.subscribers = this.subscribers.filter(s => s !== callback);
    };
  }

  private notify(): void {
    this.subscribers.forEach(cb => cb(this.state));
  }

  /**
   * Generates localized Arabic step-by-step guidance instructions from road polyline
   */
  public synthesizeStepsFromPolyline(polyline: [number, number][]): NavigationStep[] {
    if (!polyline || polyline.length < 2) return [];

    const steps: NavigationStep[] = [];
    steps.push({
      id: 'step-0',
      instruction: 'انطلق في المسار المحدد',
      instructionAr: 'انطلق للأمام نحو الشارع الرئيسي',
      distanceMeters: 250,
      durationSeconds: 30,
      turnType: 'depart',
      coordinate: { lat: polyline[0][0], lng: polyline[0][1] }
    });

    const stepInterval = Math.max(4, Math.floor(polyline.length / 5));
    let turnCount = 1;

    for (let i = stepInterval; i < polyline.length - 2; i += stepInterval) {
      const pPrev = polyline[i - 1];
      const pCurr = polyline[i];
      const pNext = polyline[i + 1];

      // Calculate bearing change
      const b1 = this.calculateBearing({ lat: pPrev[0], lng: pPrev[1] }, { lat: pCurr[0], lng: pCurr[1] });
      const b2 = this.calculateBearing({ lat: pCurr[0], lng: pCurr[1] }, { lat: pNext[0], lng: pNext[1] });
      let diff = (b2 - b1 + 360) % 360;
      if (diff > 180) diff -= 360;

      let turnType: NavigationStep['turnType'] = 'straight';
      let instructionAr = 'واصل السير للأمام لمسافة 800 متر';

      if (diff > 35 && diff < 140) {
        turnType = 'turn-right';
        instructionAr = 'انعطف يميناً بعد 200 متر عند التقاطع';
      } else if (diff < -35 && diff > -140) {
        turnType = 'turn-left';
        instructionAr = 'انعطف يساراً عند الإشارة الضوئية';
      } else if (Math.abs(diff) >= 140) {
        turnType = 'u-turn';
        instructionAr = 'استدر للخلف (U-Turn) عندما تسمح حركة المرور';
      }

      steps.push({
        id: `step-${turnCount++}`,
        instruction: instructionAr,
        instructionAr,
        distanceMeters: 450,
        durationSeconds: 60,
        turnType,
        coordinate: { lat: pCurr[0], lng: pCurr[1] }
      });
    }

    const last = polyline[polyline.length - 1];
    steps.push({
      id: 'step-final',
      instruction: 'الوصول إلى الوجهة المحددة',
      instructionAr: 'الوجهة على يمينك، تم الوصول بنجاح',
      distanceMeters: 0,
      durationSeconds: 0,
      turnType: 'arrive',
      coordinate: { lat: last[0], lng: last[1] }
    });

    return steps;
  }

  private calculateBearing(start: MapCoordinates, end: MapCoordinates): number {
    const startLat = (start.lat * Math.PI) / 180;
    const startLng = (start.lng * Math.PI) / 180;
    const endLat = (end.lat * Math.PI) / 180;
    const endLng = (end.lng * Math.PI) / 180;

    const dLng = endLng - startLng;
    const y = Math.sin(dLng) * Math.cos(endLat);
    const x = Math.cos(startLat) * Math.sin(endLat) - Math.sin(startLat) * Math.cos(endLat) * Math.cos(dLng);
    return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
  }

  /**
   * Samples a point along a polyline at a given normalized progress fraction (0 to 1)
   */
  public getPointAlongPolyline(
    polyline: [number, number][],
    fraction: number
  ): { lat: number; lng: number; bearing: number; segmentIndex: number } {
    if (!polyline || polyline.length === 0) {
      return { lat: 33.3152, lng: 44.3661, bearing: 0, segmentIndex: 0 };
    }
    if (polyline.length === 1 || fraction <= 0) {
      return { lat: polyline[0][0], lng: polyline[0][1], bearing: 0, segmentIndex: 0 };
    }
    if (fraction >= 1) {
      const last = polyline[polyline.length - 1];
      const prev = polyline[Math.max(0, polyline.length - 2)];
      const bearing = this.calculateBearing(
        { lat: prev[0], lng: prev[1] },
        { lat: last[0], lng: last[1] }
      );
      return { lat: last[0], lng: last[1], bearing, segmentIndex: Math.max(0, polyline.length - 2) };
    }

    const totalSegments = polyline.length - 1;
    const targetIdx = Math.min(totalSegments - 1, Math.floor(fraction * totalSegments));
    const segFraction = (fraction * totalSegments) - targetIdx;

    const pA = polyline[targetIdx];
    const pB = polyline[targetIdx + 1];

    const lat = pA[0] + (pB[0] - pA[0]) * segFraction;
    const lng = pA[1] + (pB[1] - pA[1]) * segFraction;
    const bearing = this.calculateBearing(
      { lat: pA[0], lng: pA[1] },
      { lat: pB[0], lng: pB[1] }
    );

    return { lat, lng, bearing, segmentIndex: targetIdx };
  }
}
