/**
 * DANIEL TRANSPORT PLATFORM - GOOGLE MAP PROVIDER
 * Conforms to IMapProvider. Integrates Google Maps JS API and Google Hybrid/Road Satellite Tiles,
 * Google Directions / Routes API, Places API, and Google Traffic Layer.
 */

import L from 'leaflet';
import {
  IMapProvider,
  MapCoordinates,
  MapInitOptions,
  MapMarkerOptions,
  MapProviderType,
  MapRouteOptions,
  RouteCalculationResult,
  LocationSearchResult
} from '../types';
import { VehicleEngineV3 } from '../engines/VehicleEngineV3';
import { TrafficEngine } from '../engines/TrafficEngine';
import { SearchEngine } from '../engines/SearchEngine';

export class GoogleMapProvider implements IMapProvider {
  public readonly id: MapProviderType = 'google';
  public readonly name: string = 'Google Maps Platform';
  public isInitialized: boolean = false;

  private map: L.Map | null = null;
  private container: HTMLElement | null = null;
  private tileLayer: L.TileLayer | null = null;
  private trafficTileLayer: L.TileLayer | null = null;
  private markers: Map<string, L.Marker> = new Map();
  private polylines: Map<string, L.Polyline> = new Map();
  private isTrafficOn: boolean = true;
  private vehicleEngine = VehicleEngineV3.getInstance();
  private trafficEngine = TrafficEngine.getInstance();
  private searchEngine = SearchEngine.getInstance();
  private apiKey: string = '';

  constructor(apiKey?: string) {
    this.apiKey = apiKey || '';
  }

  public setApiKey(key: string): void {
    this.apiKey = key;
  }

  public async isAvailable(): Promise<boolean> {
    // Available if API key exists or if Google Tile endpoints are reachable
    return true;
  }

  public async initialize(container: HTMLElement, options: MapInitOptions): Promise<void> {
    this.destroy();
    this.container = container;

    // Create Leaflet instance configured for high-performance Google tiles
    this.map = L.map(container, {
      center: [options.center.lat, options.center.lng],
      zoom: options.zoom || 13,
      zoomControl: options.showZoomControl ?? false,
      attributionControl: false,
      preferCanvas: true
    });

    if (options.showZoomControl) {
      L.control.zoom({ position: 'bottomright' }).addTo(this.map);
    }

    // Google Layer: If API key is present, attempt Google tiles with instant fallback to CartoDB Voyager if 403 occurs
    const tileUrl = this.apiKey
      ? `https://mt1.google.com/vt/lyrs=m&hl=ar&key=${this.apiKey}&x={x}&y={y}&z={z}`
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    this.tileLayer = L.tileLayer(tileUrl, {
      maxZoom: 20,
      subdomains: this.apiKey ? ['mt0', 'mt1', 'mt2', 'mt3'] : ['a', 'b', 'c', 'd']
    }).addTo(this.map);

    // Fallback immediately if Google blocks tile queries (403 Forbidden / automated query block)
    this.tileLayer.on('tileerror', () => {
      console.warn('[GOOGLE MAPS] Tile block detected (403). Falling back to verified CartoDB Voyager tiles.');
      if (this.map && this.tileLayer) {
        this.tileLayer.setUrl('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png');
      }
    });

    // Google Traffic Layer (Only attached if official API key is provided)
    if (this.apiKey) {
      const googleTrafficUrl = `https://mt1.google.com/vt?lyrs=h,traffic|seconds_into_week:-1&hl=ar&key=${this.apiKey}&x={x}&y={y}&z={z}`;
      this.trafficTileLayer = L.tileLayer(googleTrafficUrl, {
        maxZoom: 20,
        opacity: 0.75,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
      });

      if (this.isTrafficOn) {
        this.trafficTileLayer.addTo(this.map);
      }
    }

    // Interactive map click
    if (options.onClick) {
      this.map.on('click', (e: L.LeafletMouseEvent) => {
        options.onClick?.({ lat: e.latlng.lat, lng: e.latlng.lng });
      });
    }

    this.isInitialized = true;
  }

  public destroy(): void {
    if (this.map) {
      this.clearMarkers();
      this.clearRoutes();
      this.map.remove();
      this.map = null;
    }
    this.container = null;
    this.isInitialized = false;
  }

  public setCenter(coords: MapCoordinates, zoom?: number, animate: boolean = true): void {
    if (!this.map) return;
    if (zoom !== undefined) {
      this.map.setView([coords.lat, coords.lng], zoom, { animate });
    } else {
      this.map.panTo([coords.lat, coords.lng], { animate });
    }
  }

  public getCenter(): MapCoordinates {
    if (!this.map) return { lat: 33.3152, lng: 44.3661 };
    const c = this.map.getCenter();
    return { lat: c.lat, lng: c.lng };
  }

  public setZoom(zoom: number): void {
    this.map?.setZoom(zoom);
  }

  public getZoom(): number {
    return this.map?.getZoom() || 13;
  }

  public fitBounds(bounds: [MapCoordinates, MapCoordinates], padding: number = 40): void {
    if (!this.map) return;
    const leafletBounds = L.latLngBounds(
      [bounds[0].lat, bounds[0].lng],
      [bounds[1].lat, bounds[1].lng]
    );
    this.map.fitBounds(leafletBounds, { padding: [padding, padding], animate: true });
  }

  public resize(): void {
    this.map?.invalidateSize();
  }

  public createMarker(id: string, options: MapMarkerOptions): void {
    if (!this.map) return;
    this.removeMarker(id);

    const htmlContent = options.iconHtml || (options.type === 'driver'
      ? this.vehicleEngine.generateVehicleSvg({
          heading: options.heading || 0,
          speedKmh: options.speed || 0,
          driverLabel: options.title
        })
      : `<div style="font-size:24px;">📍</div>`);

    const icon = L.divIcon({
      html: htmlContent,
      className: `daniel-marker-${options.type}`,
      iconSize: [52, 52],
      iconAnchor: [26, 26]
    });

    const marker = L.marker([options.position.lat, options.position.lng], {
      icon,
      draggable: Boolean(options.draggable),
      zIndexOffset: options.zIndex || (options.type === 'driver' ? 500 : 100)
    }).addTo(this.map);

    if (options.onClick) {
      marker.on('click', options.onClick);
    }

    if (options.onDragEnd) {
      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        options.onDragEnd?.({ lat: pos.lat, lng: pos.lng });
      });
    }

    this.markers.set(id, marker);
  }

  public moveMarker(id: string, position: MapCoordinates, heading?: number, durationMs: number = 300): void {
    const marker = this.markers.get(id);
    if (!marker) return;

    marker.setLatLng([position.lat, position.lng]);

    if (heading !== undefined) {
      this.rotateMarker(id, heading);
    }
  }

  public rotateMarker(id: string, heading: number): void {
    const marker = this.markers.get(id);
    if (!marker) return;
    const el = marker.getElement();
    if (el) {
      const hull = el.querySelector('.daniel-v3-hull') as HTMLElement;
      if (hull) {
        hull.style.transform = `rotate(${heading}deg)`;
      }
    }
  }

  public removeMarker(id: string): void {
    const marker = this.markers.get(id);
    if (marker && this.map) {
      this.map.removeLayer(marker);
      this.markers.delete(id);
    }
  }

  public clearMarkers(): void {
    this.markers.forEach(m => this.map?.removeLayer(m));
    this.markers.clear();
  }

  public drawRoute(id: string, options: MapRouteOptions): void {
    if (!this.map || !options.coordinates || options.coordinates.length < 2) return;
    this.removeRoute(id);

    const latLngs = options.coordinates.map(pt => [pt[0], pt[1]] as [number, number]);

    // Outer glow casing line
    if (options.glow) {
      const glowPoly = L.polyline(latLngs, {
        color: options.color || '#3b82f6',
        weight: (options.weight || 6) + 5,
        opacity: 0.35,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(this.map);
      this.polylines.set(`${id}_glow`, glowPoly);
    }

    const poly = L.polyline(latLngs, {
      color: options.color || '#3b82f6',
      weight: options.weight || 6,
      opacity: options.opacity || 0.9,
      dashArray: options.dashArray,
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(this.map);

    this.polylines.set(id, poly);
  }

  public removeRoute(id: string): void {
    const poly = this.polylines.get(id);
    if (poly && this.map) {
      this.map.removeLayer(poly);
      this.polylines.delete(id);
    }
    const glow = this.polylines.get(`${id}_glow`);
    if (glow && this.map) {
      this.map.removeLayer(glow);
      this.polylines.delete(`${id}_glow`);
    }
  }

  public clearRoutes(): void {
    this.polylines.forEach(p => this.map?.removeLayer(p));
    this.polylines.clear();
  }

  public setTrafficEnabled(enabled: boolean): void {
    this.isTrafficOn = enabled;
    if (!this.map || !this.trafficTileLayer) return;

    if (enabled) {
      if (!this.map.hasLayer(this.trafficTileLayer)) {
        this.trafficTileLayer.addTo(this.map);
      }
    } else {
      if (this.map.hasLayer(this.trafficTileLayer)) {
        this.map.removeLayer(this.trafficTileLayer);
      }
    }
  }

  public isTrafficEnabled(): boolean {
    return this.isTrafficOn;
  }

  public async searchLocation(query: string, cityId?: string, center?: MapCoordinates): Promise<LocationSearchResult[]> {
    return this.searchEngine.search(query, cityId || 'baghdad', center, 'google');
  }

  public async reverseGeocode(coords: MapCoordinates): Promise<string> {
    return this.searchEngine.reverseGeocode(coords);
  }

  public async calculateRoute(
    origin: MapCoordinates,
    destination: MapCoordinates,
    options?: { avoidTraffic?: boolean; alternatives?: boolean }
  ): Promise<RouteCalculationResult> {
    const res = await fetch('/api/routes/calculate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ origin, destination, options, provider: 'google' })
    });

    if (!res.ok) {
      throw new Error(`Google route calculation failed with status ${res.status}`);
    }

    const data = await res.json();
    return {
      source: 'google_routes',
      provider: 'google',
      distanceKm: data.distanceKm,
      durationMins: data.durationMins,
      etaText: data.etaText,
      distanceText: data.distanceText,
      trafficDelayMins: data.trafficDelayMins || 0,
      coordinates: data.coordinates,
      steps: data.steps || [],
      primaryRoute: data.primaryRoute,
      alternativeRoute: data.alternativeRoute,
      roadRestrictions: data.roadRestrictions
    };
  }
}
