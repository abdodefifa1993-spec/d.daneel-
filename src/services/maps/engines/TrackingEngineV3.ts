/**
 * DANIEL TRANSPORT PLATFORM - DRIVER TRACKING ENGINE V3
 * Independent Driver Fleet & Single Driver Realtime Tracking Engine.
 * Decoupled from any map provider.
 * Connects directly with WebSocket feed, computes live driver ETAs, and triggers 60FPS vehicle animations.
 */

import { MapCoordinates } from '../types';
import { VehicleEngineV3 } from './VehicleEngineV3';
import { Driver } from '../../../types';

export interface DriverTrackingUpdate {
  driverId: string;
  driverName: string;
  vehicleModel: string;
  plateNumber: string;
  color: string;
  tier: string;
  lat: number;
  lng: number;
  heading: number;
  speedKmh: number;
  isOnline: boolean;
  status: 'idle' | 'en_route_pickup' | 'arrived_pickup' | 'on_trip';
  etaToPickupMins?: number;
  distanceToPickupKm?: number;
  timestamp: number;
}

export class TrackingEngineV3 {
  private static instance: TrackingEngineV3;
  private activeDrivers: Map<string, DriverTrackingUpdate> = new Map();
  private vehicleEngine = VehicleEngineV3.getInstance();
  private subscribers: Array<(drivers: DriverTrackingUpdate[]) => void> = [];
  private singleDriverSubscribers: Map<string, Array<(update: DriverTrackingUpdate) => void>> = new Map();

  private constructor() {}

  public static getInstance(): TrackingEngineV3 {
    if (!TrackingEngineV3.instance) {
      TrackingEngineV3.instance = new TrackingEngineV3();
    }
    return TrackingEngineV3.instance;
  }

  /**
   * Initializes or updates drivers from full driver list
   */
  public syncDrivers(drivers: Driver[], pickupCoords?: MapCoordinates | null): void {
    drivers.forEach(d => {
      const existing = this.activeDrivers.get(d.id);
      let etaMins: number | undefined;
      let distKm: number | undefined;

      if (pickupCoords) {
        distKm = Math.round(
          Math.hypot(d.currentLocation.lat - pickupCoords.lat, d.currentLocation.lng - pickupCoords.lng) * 111.32 * 10
        ) / 10;
        etaMins = Math.max(1, Math.round((distKm / 30) * 60));
      }

      const update: DriverTrackingUpdate = {
        driverId: d.id,
        driverName: d.name,
        vehicleModel: d.car?.model || 'سيارة أجرة',
        plateNumber: d.car?.plateNumber || '',
        color: d.car?.tier === 'comfort_vip' ? '#10b981' : d.car?.tier === 'women_taxi' ? '#ec4899' : '#f59e0b',
        tier: d.car?.tier || 'economy',
        lat: d.currentLocation.lat,
        lng: d.currentLocation.lng,
        heading: existing?.heading || 0,
        speedKmh: d.isOnline ? Math.floor(20 + Math.random() * 35) : 0,
        isOnline: d.isOnline,
        status: d.isOnline ? 'idle' : 'idle',
        etaToPickupMins: etaMins,
        distanceToPickupKm: distKm,
        timestamp: Date.now()
      };

      this.activeDrivers.set(d.id, update);

      // Inform Vehicle Engine V3 for 60FPS animation
      this.vehicleEngine.updateVehicle(
        d.id,
        { lat: update.lat, lng: update.lng },
        update.heading,
        update.speedKmh,
        { driverName: d.name, color: update.color, tier: d.car?.tier || 'economy' }
      );
    });

    this.notifyAll();
  }

  /**
   * Handles real-time single driver position packet (from WebSocket or GPS)
   */
  public handleLocationUpdate(
    driverId: string,
    coords: MapCoordinates,
    heading: number = 0,
    speedKmh: number = 0,
    pickupCoords?: MapCoordinates
  ): void {
    const existing = this.activeDrivers.get(driverId);
    let etaMins = existing?.etaToPickupMins;
    let distKm = existing?.distanceToPickupKm;

    if (pickupCoords) {
      distKm = Math.round(
        Math.hypot(coords.lat - pickupCoords.lat, coords.lng - pickupCoords.lng) * 111.32 * 10
      ) / 10;
      etaMins = Math.max(1, Math.round((distKm / Math.max(20, speedKmh)) * 60));
    }

    const update: DriverTrackingUpdate = {
      driverId,
      driverName: existing?.driverName || 'كابتن دانيال',
      vehicleModel: existing?.vehicleModel || 'تويوتا كامري',
      plateNumber: existing?.plateNumber || 'بغداد 19840 ب',
      color: existing?.color || '#f59e0b',
      tier: existing?.tier || 'economy',
      lat: coords.lat,
      lng: coords.lng,
      heading,
      speedKmh,
      isOnline: true,
      status: existing?.status || 'idle',
      etaToPickupMins: etaMins,
      distanceToPickupKm: distKm,
      timestamp: Date.now()
    };

    this.activeDrivers.set(driverId, update);

    // Notify Vehicle Engine
    this.vehicleEngine.updateVehicle(
      driverId,
      coords,
      heading,
      speedKmh,
      { driverName: update.driverName, color: update.color, tier: update.tier }
    );

    // Single driver notify
    const singleSubs = this.singleDriverSubscribers.get(driverId);
    if (singleSubs) {
      singleSubs.forEach(cb => cb(update));
    }

    this.notifyAll();
  }

  public getDriver(driverId: string): DriverTrackingUpdate | undefined {
    return this.activeDrivers.get(driverId);
  }

  public getAllDrivers(): DriverTrackingUpdate[] {
    return Array.from(this.activeDrivers.values());
  }

  public subscribeAll(callback: (drivers: DriverTrackingUpdate[]) => void): () => void {
    this.subscribers.push(callback);
    callback(this.getAllDrivers());
    return () => {
      this.subscribers = this.subscribers.filter(s => s !== callback);
    };
  }

  public subscribeDriver(driverId: string, callback: (update: DriverTrackingUpdate) => void): () => void {
    let list = this.singleDriverSubscribers.get(driverId);
    if (!list) {
      list = [];
      this.singleDriverSubscribers.set(driverId, list);
    }
    list.push(callback);
    const existing = this.activeDrivers.get(driverId);
    if (existing) callback(existing);

    return () => {
      const currList = this.singleDriverSubscribers.get(driverId);
      if (currList) {
        this.singleDriverSubscribers.set(
          driverId,
          currList.filter(cb => cb !== callback)
        );
      }
    };
  }

  private notifyAll(): void {
    const list = this.getAllDrivers();
    this.subscribers.forEach(cb => cb(list));
  }
}
