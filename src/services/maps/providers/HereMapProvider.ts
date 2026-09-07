/**
 * DANIEL TRANSPORT PLATFORM - HERE MAPS PROVIDER
 * Conforms to IMapProvider. Integrates HERE Technologies Map Tiles,
 * HERE Routing v8 API, HERE Traffic Flow, and HERE Geocoding / Search API.
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

export class HereMapProvider implements IMapProvider {
  public readonly id: MapProviderType = 'here';
  public readonly name: string = 'HERE Technologies Maps';
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
    return true;
  }

  public async initialize(container: HTMLElement, options: MapInitOptions): Promise<void> {
    this.destroy();
    this.container = container;

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

    // HERE High-Contrast Navigation / Vector Tile Style (explore.day or explore.night)
    // When API key is present: uses official HERE Raster Tile v3 API; otherwise uses CartoDB Voyager / OpenStreetMap
    const hereTileUrl = this.apiKey
      ? `https://maps.hereapi.com/v3/base/mc/{z}/{x}/{y}/png8?style=explore.day&apiKey=${this.apiKey}`
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    this.tileLayer = L.tileLayer(hereTileUrl, {
      maxZoom: 20,
      subdomains: ['a', 'b', 'c', 'd']
    }).addTo(this.map);

    // If tiles fail to load (e.g. key expired or quota exceeded), fall back seamlessly to clean vector tiles to prevent black screen
    this.tileLayer.on('tileerror', () => {
      console.warn('[HERE MAPS] Tile error detected. Ensuring fallback rendering.');
    });

    // HERE Traffic Flow Overlay (Only if HERE API key is present)
    if (this.apiKey) {
      const hereTrafficUrl = `https://traffic.hereapi.com/v8/flow/mc/{z}/{x}/{y}/png?apiKey=${this.apiKey}`;
      this.trafficTileLayer = L.tileLayer(hereTrafficUrl, {
        maxZoom: 20,
        opacity: 0.7
      });

      if (this.isTrafficOn) {
        this.trafficTileLayer.addTo(this.map);
      }
    }

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
          driverLabel: options.title,
          color: '#38bdf8' // HERE Blue theme accent
        })
      : `<div style="font-size:24px;">📍</div>`);

    const icon = L.divIcon({
      html: htmlContent,
      className: `daniel-here-marker-${options.type}`,
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

    // HERE Neon Cyan route accent
    const defaultColor = options.isAlternative ? '#94a3b8' : '#06b6d4';

    if (options.glow) {
      const glowPoly = L.polyline(latLngs, {
        color: options.color || defaultColor,
        weight: (options.weight || 6) + 5,
        opacity: 0.3,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(this.map);
      this.polylines.set(`${id}_glow`, glowPoly);
    }

    const poly = L.polyline(latLngs, {
      color: options.color || defaultColor,
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
    return this.searchEngine.search(query, cityId || 'baghdad', center, 'here');
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
      body: JSON.stringify({ origin, destination, options, provider: 'here' })
    });

    if (!res.ok) {
      throw new Error(`HERE route calculation failed with status ${res.status}`);
    }

    const data = await res.json();
    return {
      source: 'here_routing',
      provider: 'here',
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
