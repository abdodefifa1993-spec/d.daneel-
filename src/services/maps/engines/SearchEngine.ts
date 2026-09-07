/**
 * DANIEL TRANSPORT PLATFORM - SEARCH ENGINE
 * Unified Location Search Engine supporting Google Places, HERE Search, Mapbox,
 * and high-precision Iraqi curated landmark and street database.
 * Includes Arabic text normalization, fuzzy matching, and local persistence.
 */

import { LocationSearchResult, MapCoordinates, MapProviderType } from '../types';
import { IRAQI_LANDMARKS, IRAQI_CITIES } from '../../../data/iraqLocations';

export interface SavedPlace {
  id: string;
  type: 'home' | 'work' | 'favorite' | 'recent';
  label: string;
  landmark: LocationSearchResult;
  timestamp: number;
}

export class SearchEngine {
  private static instance: SearchEngine;
  private recentSearches: LocationSearchResult[] = [];
  private savedPlaces: Map<string, SavedPlace> = new Map();

  private constructor() {
    this.loadFromStorage();
  }

  public static getInstance(): SearchEngine {
    if (!SearchEngine.instance) {
      SearchEngine.instance = new SearchEngine();
    }
    return SearchEngine.instance;
  }

  /**
   * Search locations using active provider with instant local Iraqi fallback
   */
  public async search(
    query: string,
    cityId: string = 'baghdad',
    center?: MapCoordinates,
    provider: MapProviderType = 'google'
  ): Promise<LocationSearchResult[]> {
    const trimmed = query.trim();
    if (!trimmed) {
      return this.getSuggestionsForCity(cityId);
    }

    const normalizedQuery = this.normalizeArabic(trimmed);
    const results: LocationSearchResult[] = [];

    // 1. First, search high-precision curated Iraqi landmark repository
    const localMatches = this.searchLocalIraqiDb(normalizedQuery, cityId, center);
    results.push(...localMatches);

    // 2. Query Remote Provider API if query is 3+ characters and results are small
    if (results.length < 8 && trimmed.length >= 3) {
      try {
        const remoteResults = await this.queryProviderSearch(trimmed, cityId, center, provider);
        for (const item of remoteResults) {
          if (!results.some(r => Math.hypot(r.lat - item.lat, r.lng - item.lng) < 0.002)) {
            results.push(item);
          }
        }
      } catch (e) {
        console.warn('Remote map provider search notice:', e);
      }
    }

    return results.slice(0, 10);
  }

  /**
   * Search curated Iraqi landmarks with Arabic fuzzy match & distance weighting
   */
  private searchLocalIraqiDb(
    normalizedQuery: string,
    cityId: string,
    center?: MapCoordinates
  ): LocationSearchResult[] {
    const city = IRAQI_CITIES.find(c => c.id === cityId);
    const cityCenter = center || (city ? city.center : { lat: 33.3152, lng: 44.3661 });

    const filtered = IRAQI_LANDMARKS.filter(lm => {
      // Prioritize same city, but allow cross-city landmark search if query matches
      const nameNorm = this.normalizeArabic(lm.name);
      const districtNorm = this.normalizeArabic(lm.district || '');
      const popNameNorm = this.normalizeArabic(lm.popularLocalName || '');

      return (
        nameNorm.includes(normalizedQuery) ||
        districtNorm.includes(normalizedQuery) ||
        popNameNorm.includes(normalizedQuery) ||
        normalizedQuery.includes(nameNorm)
      );
    });

    // Rank results: exact match first, same city second, distance third
    filtered.sort((a, b) => {
      const aName = this.normalizeArabic(a.name);
      const bName = this.normalizeArabic(b.name);

      const aExact = aName === normalizedQuery ? -100 : aName.startsWith(normalizedQuery) ? -50 : 0;
      const bExact = bName === normalizedQuery ? -100 : bName.startsWith(normalizedQuery) ? -50 : 0;

      const aCity = a.cityId === cityId ? -20 : 0;
      const bCity = b.cityId === cityId ? -20 : 0;

      const aDist = Math.hypot(a.lat - cityCenter.lat, a.lng - cityCenter.lng);
      const bDist = Math.hypot(b.lat - cityCenter.lat, b.lng - cityCenter.lng);

      return aExact + aCity + aDist - (bExact + bCity + bDist);
    });

    return filtered.map(lm => ({
      id: lm.id,
      name: lm.name,
      district: lm.district,
      cityId: lm.cityId,
      lat: lm.lat,
      lng: lm.lng,
      category: lm.category,
      popularLocalName: lm.popularLocalName,
      provider: 'local_db',
      formattedAddress: `${lm.district ? lm.district + '، ' : ''}${city?.nameAr || 'العراق'}`
    }));
  }

  /**
   * Remote Provider Search (Google Places / HERE / Mapbox) via backend proxy
   */
  private async queryProviderSearch(
    query: string,
    cityId: string,
    center?: MapCoordinates,
    provider: MapProviderType = 'google'
  ): Promise<LocationSearchResult[]> {
    const city = IRAQI_CITIES.find(c => c.id === cityId);
    const coords = center || (city ? city.center : { lat: 33.3152, lng: 44.3661 });

    const res = await fetch('/api/places/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        cityId,
        provider,
        location: coords
      })
    });

    if (!res.ok) return [];
    const data = await res.json();
    return (data.results || []).map((item: any) => ({
      id: item.id || `remote-${Math.random().toString(36).substring(7)}`,
      name: item.name,
      district: item.district || city?.popularDistricts[0] || 'المركز',
      cityId,
      lat: item.lat,
      lng: item.lng,
      category: item.category || 'landmark',
      provider,
      formattedAddress: item.formattedAddress || item.name
    }));
  }

  /**
   * Default popular suggestions for a city
   */
  public getSuggestionsForCity(cityId: string): LocationSearchResult[] {
    const cityLandmarks = IRAQI_LANDMARKS.filter(lm => lm.cityId === cityId).slice(0, 6);
    return cityLandmarks.map(lm => ({
      id: lm.id,
      name: lm.name,
      district: lm.district,
      cityId: lm.cityId,
      lat: lm.lat,
      lng: lm.lng,
      category: lm.category,
      popularLocalName: lm.popularLocalName,
      provider: 'local_db',
      formattedAddress: `${lm.district}، العراق`
    }));
  }

  /**
   * Reverse Geocode (Coordinates -> Human Address)
   */
  public async reverseGeocode(coords: MapCoordinates, cityId: string = 'baghdad'): Promise<string> {
    // Check closest landmark within 300 meters
    let closestLandmark = null;
    let minDistance = Infinity;

    for (const lm of IRAQI_LANDMARKS) {
      const dist = Math.hypot(coords.lat - lm.lat, coords.lng - lm.lng) * 111320;
      if (dist < minDistance) {
        minDistance = dist;
        closestLandmark = lm;
      }
    }

    if (closestLandmark && minDistance < 400) {
      const distText = minDistance < 80 ? 'بالقرب من' : `على بعد ${Math.round(minDistance)}م من`;
      return `${distText} ${closestLandmark.name} (${closestLandmark.district})`;
    }

    const city = IRAQI_CITIES.find(c => c.id === cityId);
    return `شارع في ${city?.popularDistricts[0] || 'المنطقة'} (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`;
  }

  /**
   * Arabic Text Normalization
   */
  public normalizeArabic(text: string): string {
    return text
      .toLowerCase()
      .replace(/[إأآا]/g, 'ا')
      .replace(/ة/g, 'ه')
      .replace(/[يى]/g, 'ي')
      .replace(/[\u064B-\u065F]/g, '') // Tashkeel / Harakat
      .trim();
  }

  /**
   * Saved Places Management (Home, Work, Recent)
   */
  public savePlace(type: 'home' | 'work' | 'favorite', landmark: LocationSearchResult): void {
    const key = `saved_${type}`;
    this.savedPlaces.set(key, {
      id: key,
      type,
      label: type === 'home' ? 'المنزل' : type === 'work' ? 'العمل' : landmark.name,
      landmark,
      timestamp: Date.now()
    });
    this.persistToStorage();
  }

  public getSavedPlace(type: 'home' | 'work' | 'favorite'): SavedPlace | undefined {
    return this.savedPlaces.get(`saved_${type}`);
  }

  public getAllSavedPlaces(): SavedPlace[] {
    return Array.from(this.savedPlaces.values());
  }

  public addRecent(landmark: LocationSearchResult): void {
    this.recentSearches = [
      landmark,
      ...this.recentSearches.filter(r => r.id !== landmark.id)
    ].slice(0, 8);
    this.persistToStorage();
  }

  public getRecentSearches(): LocationSearchResult[] {
    return this.recentSearches;
  }

  private persistToStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const savedArr = Array.from(this.savedPlaces.entries());
        localStorage.setItem('daniel_saved_places', JSON.stringify(savedArr));
        localStorage.setItem('daniel_recent_searches', JSON.stringify(this.recentSearches));
      }
    } catch (e) {
      // ignore in iframe storage restrictions
    }
  }

  private loadFromStorage(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const rawSaved = localStorage.getItem('daniel_saved_places');
        if (rawSaved) {
          const parsed = JSON.parse(rawSaved);
          this.savedPlaces = new Map(parsed);
        }
        const rawRecent = localStorage.getItem('daniel_recent_searches');
        if (rawRecent) {
          this.recentSearches = JSON.parse(rawRecent);
        }
      }
    } catch (e) {
      // ignore
    }
  }
}
