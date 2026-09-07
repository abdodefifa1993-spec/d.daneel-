/**
 * DANIEL TRANSPORT PLATFORM - TRAFFIC ENGINE
 * Independent Traffic Analysis & Layer Engine for Iraqi Urban Cities.
 * Operates with any map provider (Google, HERE, Mapbox).
 */

import { MapCoordinates, TrafficSegment } from '../types';

export interface TrafficZone {
  id: string;
  name: string;
  cityId: string;
  center: MapCoordinates;
  radiusMeters: number;
  baseCongestion: 'low' | 'moderate' | 'heavy' | 'jam';
  delayFactor: number; // e.g. 1.35 = 35% time increase
}

export const IRAQI_TRAFFIC_ZONES: TrafficZone[] = [
  // Baghdad Key Congestion Hubs
  { id: 'bg-karrada', name: 'الكرادة داخل ومسبح', cityId: 'baghdad', center: { lat: 33.3055, lng: 44.4280 }, radiusMeters: 1400, baseCongestion: 'heavy', delayFactor: 1.45 },
  { id: 'bg-jadriya', name: 'تقاطع الجادرية وجامعة بغداد', cityId: 'baghdad', center: { lat: 33.2780, lng: 44.3820 }, radiusMeters: 1200, baseCongestion: 'moderate', delayFactor: 1.30 },
  { id: 'bg-mansour', name: 'المنصور وشارع 14 رمضان', cityId: 'baghdad', center: { lat: 33.3120, lng: 44.3510 }, radiusMeters: 1600, baseCongestion: 'heavy', delayFactor: 1.40 },
  { id: 'bg-bab-sharqi', name: 'الباب الشرقي وساحة التحرير', cityId: 'baghdad', center: { lat: 33.3325, lng: 44.4120 }, radiusMeters: 1100, baseCongestion: 'heavy', delayFactor: 1.50 },
  { id: 'bg-bab-muazzam', name: 'باب المعظم ومجمع الكليات', cityId: 'baghdad', center: { lat: 33.3560, lng: 44.3860 }, radiusMeters: 1300, baseCongestion: 'jam', delayFactor: 1.60 },
  { id: 'bg-sinak', name: 'جسر السنك وشارع الرشيد', cityId: 'baghdad', center: { lat: 33.3380, lng: 44.4050 }, radiusMeters: 900, baseCongestion: 'moderate', delayFactor: 1.25 },
  { id: 'bg-saydiya', name: 'السيدية وتقاطع الدورة السريع', cityId: 'baghdad', center: { lat: 33.2540, lng: 44.3480 }, radiusMeters: 1500, baseCongestion: 'moderate', delayFactor: 1.28 },
  
  // Basra Hubs
  { id: 'bs-ashar', name: 'العشار وشارع الوطني', cityId: 'basra', center: { lat: 30.5180, lng: 47.8340 }, radiusMeters: 1300, baseCongestion: 'heavy', delayFactor: 1.38 },
  { id: 'bs-corniche', name: 'كورنيش شط العرب والجبيلة', cityId: 'basra', center: { lat: 30.5310, lng: 47.8420 }, radiusMeters: 1400, baseCongestion: 'moderate', delayFactor: 1.25 },

  // Erbil Hubs
  { id: 'er-60m', name: 'شارع 60 متري وقلعة أربيل', cityId: 'erbil', center: { lat: 36.1912, lng: 44.0090 }, radiusMeters: 1500, baseCongestion: 'heavy', delayFactor: 1.35 },
  { id: 'er-100m', name: 'تقاطع شارع 100 متري وطريق المطار', cityId: 'erbil', center: { lat: 36.2150, lng: 43.9920 }, radiusMeters: 1800, baseCongestion: 'moderate', delayFactor: 1.22 },

  // Najaf & Karbala
  { id: 'nj-old-city', name: 'المدينة القديمة والروضة الحيدرية', cityId: 'najaf', center: { lat: 31.9960, lng: 44.3140 }, radiusMeters: 1200, baseCongestion: 'jam', delayFactor: 1.65 },
  { id: 'kb-bayn-haramayn', name: 'منطقة ما بين الحرمين والشهداء', cityId: 'karbala', center: { lat: 32.6160, lng: 44.0325 }, radiusMeters: 1100, baseCongestion: 'jam', delayFactor: 1.70 }
];

export class TrafficEngine {
  private static instance: TrafficEngine;
  private enabled: boolean = true;

  private constructor() {}

  public static getInstance(): TrafficEngine {
    if (!TrafficEngine.instance) {
      TrafficEngine.instance = new TrafficEngine();
    }
    return TrafficEngine.instance;
  }

  public setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  public isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Determine current peak-hour congestion multiplier in Iraq
   * (Peak 1: 07:30 - 09:30, Peak 2: 16:30 - 20:30)
   */
  public getTemporalRushMultiplier(): number {
    const now = new Date();
    const hours = now.getHours() + now.getMinutes() / 60;
    const day = now.getDay(); // 5 = Friday in JS (Weekend in Iraq)

    if (day === 5) {
      // Friday: quiet morning, evening family rush
      if (hours >= 17 && hours <= 22) return 1.30;
      return 1.0;
    }

    if (hours >= 7.5 && hours <= 9.5) {
      return 1.45; // Morning school/work commute
    } else if (hours >= 16.5 && hours <= 20.5) {
      return 1.50; // Evening market/shopping rush
    } else if (hours >= 13.5 && hours <= 15.5) {
      return 1.25; // Afternoon departure
    }
    return 1.05;
  }

  /**
   * Evaluates polyline coordinates against congestion zones and returns colored traffic segments
   */
  public analyzeRouteTraffic(coordinates: [number, number][]): TrafficSegment[] {
    if (!coordinates || coordinates.length < 2) return [];

    const segments: TrafficSegment[] = [];
    const rushMultiplier = this.getTemporalRushMultiplier();

    for (let i = 0; i < coordinates.length - 1; i++) {
      const lat = coordinates[i][0];
      const lng = coordinates[i][1];
      const pt: MapCoordinates = { lat, lng };

      // Check proximity to any high congestion zone
      let highestCongestionLevel: 'normal' | 'moderate' | 'heavy' | 'jam' = 'normal';
      let segmentColor = '#10b981'; // green

      for (const zone of IRAQI_TRAFFIC_ZONES) {
        const dist = Math.hypot(pt.lat - zone.center.lat, pt.lng - zone.center.lng) * 111320; // approx meters
        if (dist <= zone.radiusMeters) {
          if (zone.baseCongestion === 'jam' || rushMultiplier > 1.4) {
            highestCongestionLevel = 'jam';
            segmentColor = '#ef4444'; // red/jam
            break;
          } else if (zone.baseCongestion === 'heavy' || rushMultiplier > 1.2) {
            highestCongestionLevel = 'heavy';
            segmentColor = '#f97316'; // orange
          } else if (highestCongestionLevel === 'normal') {
            highestCongestionLevel = 'moderate';
            segmentColor = '#f59e0b'; // amber
          }
        }
      }

      // Group adjacent coordinates into contiguous segments
      const lastSegment = segments[segments.length - 1];
      if (lastSegment && lastSegment.level === highestCongestionLevel) {
        lastSegment.endIndex = i + 1;
      } else {
        segments.push({
          startIndex: i,
          endIndex: i + 1,
          level: highestCongestionLevel,
          color: segmentColor
        });
      }
    }

    return segments;
  }

  /**
   * Calculates overall traffic delay in minutes and speed factor for a trip
   */
  public calculateTripTrafficImpact(
    origin: MapCoordinates,
    destination: MapCoordinates,
    nominalDurationMins: number
  ): { trafficDelayMins: number; congestionScore: number; surgeMultiplier: number } {
    const rush = this.getTemporalRushMultiplier();
    
    // Check if origin or destination touches a critical zone
    let zoneDelay = 1.0;
    for (const zone of IRAQI_TRAFFIC_ZONES) {
      const distOrig = Math.hypot(origin.lat - zone.center.lat, origin.lng - zone.center.lng) * 111320;
      const distDest = Math.hypot(destination.lat - zone.center.lat, destination.lng - zone.center.lng) * 111320;
      if (distOrig <= zone.radiusMeters || distDest <= zone.radiusMeters) {
        zoneDelay = Math.max(zoneDelay, zone.delayFactor);
      }
    }

    const totalMultiplier = rush * zoneDelay;
    const trafficDelayMins = Math.max(0, Math.round(nominalDurationMins * (totalMultiplier - 1.0)));
    const congestionScore = Math.min(100, Math.round((totalMultiplier - 1.0) * 120));
    const surgeMultiplier = totalMultiplier > 1.35 ? Math.round(1.0 + (totalMultiplier - 1.35) * 0.8 * 10) / 10 : 1.0;

    return {
      trafficDelayMins,
      congestionScore,
      surgeMultiplier: Math.min(2.2, Math.max(1.0, surgeMultiplier))
    };
  }

  /**
   * Returns visual traffic polylines for map rendering in the specified city
   */
  public getCityTrafficPolylines(
    cityId: string,
    center: { lat: number; lng: number }
  ): Array<{ coords: [number, number][]; color: string; weight: number; label: string }> {
    const cLat = center.lat;
    const cLng = center.lng;

    return [
      {
        coords: [
          [cLat - 0.02, cLng - 0.03],
          [cLat - 0.005, cLng - 0.01],
          [cLat + 0.015, cLng + 0.02]
        ],
        color: '#ef4444',
        weight: 5,
        label: 'طريق سريع - حركة بطيئة (ازدحام)'
      },
      {
        coords: [
          [cLat + 0.02, cLng - 0.02],
          [cLat + 0.005, cLng + 0.005],
          [cLat - 0.01, cLng + 0.03]
        ],
        color: '#f59e0b',
        weight: 5,
        label: 'شارع رئيسي - حركة متوسطة'
      },
      {
        coords: [
          [cLat - 0.03, cLng + 0.01],
          [cLat - 0.01, cLng + 0.02],
          [cLat + 0.03, cLng + 0.03]
        ],
        color: '#10b981',
        weight: 4,
        label: 'طريق حر - سالك بالكامل'
      }
    ];
  }
}
