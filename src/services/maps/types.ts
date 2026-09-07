/**
 * DANIEL TRANSPORT PLATFORM - MULTI MAP PROVIDER ARCHITECTURE
 * Core Abstraction Layer: Unified Map Types & Provider Interface
 */

export type MapProviderType = 'google' | 'here' | 'mapbox';

export interface MapCoordinates {
  lat: number;
  lng: number;
}

export interface MapMarkerOptions {
  id: string;
  position: MapCoordinates;
  type: 'pickup' | 'dropoff' | 'driver' | 'landmark' | 'user_gps' | 'custom';
  title?: string;
  subtitle?: string;
  heading?: number;
  speed?: number;
  iconHtml?: string;
  draggable?: boolean;
  zIndex?: number;
  onClick?: () => void;
  onDragEnd?: (coords: MapCoordinates) => void;
}

export interface TrafficSegment {
  startIndex: number;
  endIndex: number;
  level: 'normal' | 'moderate' | 'heavy' | 'blocked' | 'jam';
  color: string;
}

export interface MapRouteOptions {
  id: string;
  coordinates: [number, number][]; // [lat, lng] pairs
  color?: string;
  weight?: number;
  opacity?: number;
  dashArray?: string;
  isAlternative?: boolean;
  glow?: boolean;
  trafficSegments?: TrafficSegment[];
  onClick?: () => void;
}

export interface NavigationStep {
  id: string;
  instruction: string;
  instructionAr: string;
  distanceMeters: number;
  durationSeconds: number;
  turnType: 'straight' | 'turn-left' | 'turn-right' | 'u-turn' | 'arrive' | 'depart' | 'roundabout' | 'merge';
  coordinate: MapCoordinates;
}

export interface RouteCalculationResult {
  source: 'google_routes' | 'here_routing' | 'mapbox_directions' | 'osrm_network' | 'iraq_urban_grid';
  provider: MapProviderType;
  distanceKm: number;
  durationMins: number;
  etaText: string;
  distanceText: string;
  trafficDelayMins: number;
  coordinates: [number, number][];
  steps: NavigationStep[];
  primaryRoute: {
    name: string;
    distanceKm: number;
    durationMins: number;
    coordinates: [number, number][];
  };
  alternativeRoute?: {
    name: string;
    distanceKm: number;
    durationMins: number;
    coordinates: [number, number][];
  };
  roadRestrictions?: string[];
}

export interface LocationSearchResult {
  id: string;
  name: string;
  district?: string;
  cityId: string;
  cityNameAr?: string;
  lat: number;
  lng: number;
  category: 'landmark' | 'mall' | 'hospital' | 'airport' | 'university' | 'hotel' | 'street' | 'historical' | 'square';
  popularLocalName?: string;
  provider: 'google' | 'here' | 'mapbox' | 'local_db';
  formattedAddress?: string;
}

export interface MapInitOptions {
  center: MapCoordinates;
  zoom: number;
  theme?: 'dark' | 'light' | 'hybrid';
  interactive?: boolean;
  showZoomControl?: boolean;
  onClick?: (coords: MapCoordinates) => void;
}

export interface MapProviderConfig {
  activeProvider: MapProviderType;
  fallbackOrder: MapProviderType[];
  googleApiKey?: string;
  googleMapId?: string;
  hereApiKey?: string;
  mapboxToken?: string;
  tileTheme: 'hybrid' | 'streets' | 'dark';
}

/**
 * Unified Map Provider Interface (Abstraction Layer)
 * Every provider (Google, HERE, Mapbox) adheres strictly to this contract.
 */
export interface IMapProvider {
  readonly id: MapProviderType;
  readonly name: string;
  readonly isInitialized: boolean;

  /** Check if provider credentials and network endpoints are healthy */
  isAvailable(): Promise<boolean>;

  /** Initialize the map on a container DOM node */
  initialize(container: HTMLElement, options: MapInitOptions): Promise<void>;

  /** Clean up resources, event listeners, and destroy instance */
  destroy(): void;

  /** Camera Controls */
  setCenter(coords: MapCoordinates, zoom?: number, animate?: boolean): void;
  getCenter(): MapCoordinates;
  setZoom(zoom: number): void;
  getZoom(): number;
  fitBounds(bounds: [MapCoordinates, MapCoordinates], padding?: number): void;
  resize(): void;

  /** Marker Operations */
  createMarker(id: string, options: MapMarkerOptions): void;
  moveMarker(id: string, position: MapCoordinates, heading?: number, durationMs?: number): void;
  rotateMarker(id: string, heading: number): void;
  removeMarker(id: string): void;
  clearMarkers(): void;

  /** Route Polyline Operations */
  drawRoute(id: string, options: MapRouteOptions): void;
  removeRoute(id: string): void;
  clearRoutes(): void;

  /** Traffic Layer */
  setTrafficEnabled(enabled: boolean): void;
  isTrafficEnabled(): boolean;

  /** Search & Geocoding */
  searchLocation(query: string, cityId?: string, center?: MapCoordinates): Promise<LocationSearchResult[]>;
  reverseGeocode(coords: MapCoordinates): Promise<string>;

  /** Routing & Navigation */
  calculateRoute(
    origin: MapCoordinates,
    destination: MapCoordinates,
    options?: { avoidTraffic?: boolean; alternatives?: boolean }
  ): Promise<RouteCalculationResult>;
}
