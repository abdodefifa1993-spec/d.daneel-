/**
 * DANIEL TRANSPORT PLATFORM - DRIVER MATCHING & DISPATCH ENGINE
 * High-precision algorithm for assigning incoming rides to the best captain in Iraq.
 * Multi-Factor Scoring Formula:
 *  Score = (DistanceScore * 0.40) + (RatingScore * 0.25) + (AcceptanceScore * 0.20) + (AvailabilityScore * 0.15)
 */

import { Driver, IraqiCityId, RideTierId } from '../../../types';

export interface DriverCandidateRank {
  driver: Driver;
  score: number; // 0 - 100
  distanceKm: number;
  timeToPickupMins: number;
  breakdown: {
    distanceScore: number;
    ratingScore: number;
    acceptanceScore: number;
    availabilityScore: number;
  };
}

export class DriverMatchingEngine {
  private static instance: DriverMatchingEngine;

  private constructor() {}

  public static getInstance(): DriverMatchingEngine {
    if (!DriverMatchingEngine.instance) {
      DriverMatchingEngine.instance = new DriverMatchingEngine();
    }
    return DriverMatchingEngine.instance;
  }

  /**
   * Calculate distance between two coordinates in Kilometers
   */
  public calculateDistanceKm(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }

  /**
   * Rank all available drivers for a specific pickup location and ride tier
   */
  public rankDriversForPickup(
    drivers: Driver[],
    pickup: { lat: number; lng: number; cityId?: IraqiCityId },
    requestedTier: RideTierId = 'economy',
    maxRadiusKm: number = 8.0
  ): DriverCandidateRank[] {
    const candidates: DriverCandidateRank[] = [];

    drivers.forEach((driver) => {
      // Must be online and not in an active ride
      if (!driver.isOnline || driver.isBusy) return;

      // Tier compatibility check
      const driverTier = driver.car?.tier || 'economy';
      if (requestedTier === 'comfort_vip' && driverTier !== 'comfort_vip') return;
      if (requestedTier === 'women_taxi' && driver.gender !== 'female') return;

      const distKm = this.calculateDistanceKm(
        pickup.lat,
        pickup.lng,
        driver.currentLocation.lat,
        driver.currentLocation.lng
      );

      if (distKm > maxRadiusKm) return;

      // 1. Distance Score: 100 at 0km, dropping to 20 at maxRadiusKm
      const distScore = Math.max(0, 100 - (distKm / maxRadiusKm) * 80);

      // 2. Rating Score: 5.0 = 100, 4.0 = 50, <4.0 = 20
      const ratingScore = Math.min(100, Math.max(20, (driver.rating / 5.0) * 100));

      // 3. Acceptance Rate Score
      const acceptRate = driver.acceptanceRate || 90;
      const acceptanceScore = acceptRate;

      // 4. Availability / KYC Score
      const kycScore = driver.kycVerified ? 100 : 70;

      // Multi-factor weighted score
      const totalScore = Math.round(
        distScore * 0.40 +
        ratingScore * 0.25 +
        acceptanceScore * 0.20 +
        kycScore * 0.15
      );

      const timeToPickupMins = Math.max(2, Math.round(distKm * 2.2));

      candidates.push({
        driver,
        score: totalScore,
        distanceKm: distKm,
        timeToPickupMins,
        breakdown: {
          distanceScore: Math.round(distScore),
          ratingScore: Math.round(ratingScore),
          acceptanceScore: Math.round(acceptanceScore),
          availabilityScore: Math.round(kycScore)
        }
      });
    });

    // Sort descending by highest match score
    return candidates.sort((a, b) => b.score - a.score);
  }
}

export const driverMatchingEngine = DriverMatchingEngine.getInstance();
