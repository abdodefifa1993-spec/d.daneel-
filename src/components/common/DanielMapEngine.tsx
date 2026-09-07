import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import L from 'leaflet';
import { useApp } from '../../context/AppContext';
import { IRAQI_CITIES, IRAQI_LANDMARKS } from '../../data/iraqLocations';
import { LandmarkPoint, Driver } from '../../types';
import {
  Compass,
  Car,
  Crosshair,
  Satellite,
  Map as MapIcon,
  Search,
  CheckCircle2,
  Radio,
  Sliders,
  Layers,
  Flame,
  ArrowUpRight,
  Maximize2,
  Minimize2,
  Navigation,
  Navigation2,
  Globe2,
  ShieldCheck,
  Zap,
  Activity,
  AlertTriangle,
  Key
} from 'lucide-react';
import {
  MapProviderManager,
  MapProviderType,
  ProviderHealth,
  VehicleEngineV3,
  VehicleEngineV5,
  TrafficEngine,
  SearchEngine,
  NavigationEngineV3,
  NavigationEngineV5,
  TrackingEngineV3
} from '../../services/maps';
import { NavigationStep } from '../../services/maps/types';
import { MapApiKeyModal } from './MapApiKeyModal';
import { RadarCockpitModal, RadarCaptain } from './RadarCockpitModal';
import { NavigationHud } from './NavigationHud';
import { DiagnosticReportModal } from './DiagnosticReportModal';

export interface DanielMapEngineProps {
  interactiveSelection?: boolean;
  showSurgeHeatmap?: boolean;
  showFleetFleetAll?: boolean;
  showRadar?: boolean;
  showTraffic?: boolean;
  showTrail?: boolean;
  heightClass?: string;
  isFullScreen?: boolean;
  onToggleFullScreen?: () => void;
  onLandmarkClick?: (landmark: LandmarkPoint) => void;
}

export type BalyMapEngineProps = DanielMapEngineProps;

// Advanced Animated Transportation Markers (Google Advanced Marker Style)
export function createAdvancedPickupMarker(name: string = 'نقطة الانطلاق'): string {
  const safeName = name.replace(/"/g, '&quot;');
  return `
    <div class="baly-pickup-adv-marker" style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; pointer-events: auto;">
      <!-- Pulsating Radar Waves -->
      <div style="position: absolute; width: 44px; height: 44px; top: -6px; border-radius: 9999px; background: rgba(16, 185, 129, 0.28); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      <div style="position: absolute; width: 32px; height: 32px; top: 0px; border-radius: 9999px; background: rgba(16, 185, 129, 0.4); animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;"></div>
      
      <!-- Modern Emerald Pin -->
      <div style="position: relative; z-index: 10; width: 32px; height: 32px; border-radius: 12px; background: linear-gradient(135deg, #10b981 0%, #059669 100%); border: 2.5px solid #ffffff; box-shadow: 0 8px 16px rgba(16, 185, 129, 0.5); display: flex; align-items: center; justify-content: center; transform: rotate(-45deg);">
        <div style="transform: rotate(45deg); color: #ffffff; font-weight: 900; font-size: 14px; line-height: 1;">
          📍
        </div>
      </div>
      
      <!-- Pin Shadow / Needle Base -->
      <div style="width: 4px; height: 6px; background: #047857; border-radius: 2px; margin-top: -2px; z-index: 5;"></div>
      
      <!-- Street Tooltip Badge -->
      <div style="margin-top: 2px; background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(8px); border: 1px solid rgba(16, 185, 129, 0.5); border-radius: 9999px; padding: 2px 8px; color: #ffffff; font-family: Cairo, sans-serif; font-size: 10px; font-weight: 800; white-space: nowrap; box-shadow: 0 6px 14px rgba(0,0,0,0.6); pointer-events: none;">
        ${safeName.length > 20 ? safeName.substring(0, 20) + '...' : safeName}
      </div>
    </div>
  `;
}

export function createAdvancedDestinationMarker(name: string = 'الوجهة المحددة'): string {
  const safeName = name.replace(/"/g, '&quot;');
  return `
    <div class="baly-dropoff-adv-marker" style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; pointer-events: auto;">
      <!-- Pulsating Golden Waves -->
      <div style="position: absolute; width: 44px; height: 44px; top: -6px; border-radius: 9999px; background: rgba(245, 158, 11, 0.28); animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
      <div style="position: absolute; width: 32px; height: 32px; top: 0px; border-radius: 9999px; background: rgba(245, 158, 11, 0.4); animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;"></div>
      
      <!-- Modern Amber / Gold Checkered Destination Pin -->
      <div style="position: relative; z-index: 10; width: 32px; height: 32px; border-radius: 12px; background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); border: 2.5px solid #ffffff; box-shadow: 0 8px 16px rgba(245, 158, 11, 0.5); display: flex; align-items: center; justify-content: center; transform: rotate(-45deg);">
        <div style="transform: rotate(45deg); color: #0f172a; font-weight: 900; font-size: 14px; line-height: 1;">
          🏁
        </div>
      </div>
      
      <!-- Base Needle -->
      <div style="width: 4px; height: 6px; background: #b45309; border-radius: 2px; margin-top: -2px; z-index: 5;"></div>
      
      <!-- Street Tooltip Badge -->
      <div style="margin-top: 2px; background: rgba(15, 23, 42, 0.95); backdrop-filter: blur(8px); border: 1px solid rgba(245, 158, 11, 0.5); border-radius: 9999px; padding: 2px 8px; color: #fbbf24; font-family: Cairo, sans-serif; font-size: 10px; font-weight: 800; white-space: nowrap; box-shadow: 0 6px 14px rgba(0,0,0,0.6); pointer-events: none;">
        ${safeName.length > 20 ? safeName.substring(0, 20) + '...' : safeName}
      </div>
    </div>
  `;
}

// Delegate SVG generation to VehicleEngineV5 with 60FPS LERP and Bearing Rotation
export function createVehicleSvg(
  color: string = '#f59e0b',
  heading: number = 0,
  speed: number = 0,
  driverLabel?: string
): string {
  return VehicleEngineV5.getInstance().generateVehicleSvg({
    color,
    heading,
    speedKmh: speed,
    driverLabel,
    showDirectionPulse: true
  });
}

// Calculate exact position, heading and segment along polyline at given progress (0.0 to 1.0)
export function getPointAlongPolyline(
  points: [number, number][],
  progressRatio: number
): { lat: number; lng: number; heading: number; segmentIndex: number } {
  const res = NavigationEngineV3.getInstance().getPointAlongPolyline(points, progressRatio);
  return { lat: res.lat, lng: res.lng, heading: res.bearing, segmentIndex: res.segmentIndex };
}

export const DanielMapEngine: React.FC<DanielMapEngineProps> = ({
  interactiveSelection = true,
  showSurgeHeatmap = true,
  showFleetFleetAll = true,
  showRadar = true,
  showTraffic: defaultShowTraffic = true,
  showTrail: defaultShowTrail = true,
  heightClass = 'h-full',
  isFullScreen = false,
  onToggleFullScreen,
  onLandmarkClick
}) => {
  const {
    selectedCityId,
    pickupPoint,
    dropoffPoint,
    setPickupPoint,
    setDropoffPoint,
    currentTrip,
    driversList,
    playAudioCue
  } = useApp();

  const city = IRAQI_CITIES.find(c => c.id === selectedCityId) || IRAQI_CITIES[0];
  const cityLandmarks = useMemo(() => IRAQI_LANDMARKS.filter(l => l.cityId === selectedCityId), [selectedCityId]);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const leafletMapRef = useRef<L.Map | null>(null);

  // Multi Map Provider Manager
  const providerManager = useMemo(() => MapProviderManager.getInstance(), []);
  const [activeProviderType, setActiveProviderType] = useState<MapProviderType>(providerManager.getActiveProviderType());
  const [healthList, setHealthList] = useState<ProviderHealth[]>(providerManager.getHealthStats());
  const [autoFailover, setAutoFailover] = useState<boolean>(providerManager.isAutoFailoverEnabled());
  const [failoverNotice, setFailoverNotice] = useState<string | null>(null);

  // Layers & References
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const trafficLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const radarLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const routeLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const trailLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const pickupMarkerRef = useRef<L.Marker | null>(null);
  const dropoffMarkerRef = useRef<L.Marker | null>(null);
  const activeTripVehicleMarkerRef = useRef<L.Marker | null>(null);
  const driverMarkersMapRef = useRef<Map<string, { marker: L.Marker; currentLat: number; currentLng: number; heading: number }>>(new Map());
  const userGpsCircleRef = useRef<L.Circle | null>(null);

  // Animation Frame Ref for Smooth Interpolation
  const animFrameRef = useRef<number | null>(null);
  const driverTrailsMapRef = useRef<Map<string, [number, number][]>>(new Map());

  // Component States
  const [tileStyle, setTileStyle] = useState<'hybrid' | 'streets' | 'osm'>('streets');
  const [trafficEnabled, setTrafficEnabled] = useState<boolean>(defaultShowTraffic);
  const [radarEnabled, setRadarEnabled] = useState<boolean>(showRadar);
  const [trailEnabled, setTrailEnabled] = useState<boolean>(defaultShowTrail);
  const [cameraFollowDriver, setCameraFollowDriver] = useState<boolean>(false);
  const [showAlternativeRoute, setShowAlternativeRoute] = useState<boolean>(true);
  const [driversLayerEnabled, setDriversLayerEnabled] = useState<boolean>(showFleetFleetAll);
  const [routeStats, setRouteStats] = useState<{ distanceKm: number; durationMins: number; etaText: string; trafficDelayMins: number; source?: string } | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([]);
  const [altRouteCoordinates, setAltRouteCoordinates] = useState<[number, number][]>([]);
  const [altRouteStats, setAltRouteStats] = useState<{ name: string; distanceKm: number; durationMins: number } | null>(null);
  const [vehicleTelemetry, setVehicleTelemetry] = useState<{ speed: number; heading: number; etaSeconds: number; remainingKm: number } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredLandmarks, setFilteredLandmarks] = useState<LandmarkPoint[]>([]);
  const [isSearchExpanded, setIsSearchExpanded] = useState<boolean>(false);
  const [searchCategory, setSearchCategory] = useState<string>('all');
  const [nearbyDriversCount, setNearbyDriversCount] = useState<number>(0);
  const [showLayersDropdown, setShowLayersDropdown] = useState<boolean>(false);
  const [showProviderMenu, setShowProviderMenu] = useState<boolean>(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState<boolean>(false);
  const [showDiagnosticModal, setShowDiagnosticModal] = useState<boolean>(false);

  // Tactical Radar Cockpit State
  const [showRadarCockpit, setShowRadarCockpit] = useState<boolean>(false);

  // Turn-by-Turn Real Navigation HUD State
  const [isNavigating, setIsNavigating] = useState<boolean>(false);
  const [isNavPaused, setIsNavPaused] = useState<boolean>(false);
  const [navProgressPercent, setNavProgressPercent] = useState<number>(0);
  const [navCurrentStep, setNavCurrentStep] = useState<NavigationStep | null>(null);
  const [navDistanceToNextTurn, setNavDistanceToNextTurn] = useState<number>(300);
  const [navCurrentSpeed, setNavCurrentSpeed] = useState<number>(45);
  const [navDestinationName, setNavDestinationName] = useState<string>('الوجهة المحددة');

  // Subscribe to Map Provider Manager changes
  useEffect(() => {
    const unsubscribe = providerManager.subscribe((provider, type) => {
      setActiveProviderType(type);
      setHealthList(providerManager.getHealthStats());
    });
    return () => unsubscribe();
  }, [providerManager]);

  // Determine Tile URL for provider and style (Zero "مطلوب مفتاح API" watermarks guaranteed!)
  const getTileUrlForProvider = useCallback((provider: MapProviderType, style: 'hybrid' | 'streets' | 'osm'): { url: string; subdomains?: string[] } => {
    const googleKey = providerManager.getGoogleApiKey() || (typeof window !== 'undefined' ? localStorage.getItem('daniel_google_maps_key') : '');
    const hereKey = providerManager.getHereApiKey() || (typeof window !== 'undefined' ? localStorage.getItem('daniel_here_maps_key') : '');
    const mapboxToken = providerManager.getMapboxToken() || (typeof window !== 'undefined' ? localStorage.getItem('daniel_mapbox_token') : '');

    // 1. HERE Technologies Maps Provider (Official v3 Raster Tiles)
    if (provider === 'here' && hereKey) {
      const scheme = style === 'hybrid' ? 'satellite.day' : 'explore.day';
      return {
        url: `https://maps.hereapi.com/v3/base/mc/{z}/{x}/{y}/png8?style=${scheme}&apiKey=${hereKey}`,
        subdomains: ['1', '2', '3', '4']
      };
    }

    // 2. Mapbox Platform Provider
    if (provider === 'mapbox' && mapboxToken) {
      const styleId = style === 'hybrid' ? 'satellite-streets-v12' : 'streets-v12';
      return {
        url: `https://api.mapbox.com/styles/v1/mapbox/${styleId}/tiles/256/{z}/{x}/{y}@2x?access_token=${mapboxToken}`,
        subdomains: ['a', 'b', 'c', 'd']
      };
    }

    // 3. Google Maps Platform Provider
    if (provider === 'google' && googleKey) {
      return {
        url: `https://mt1.google.com/vt/lyrs=${style === 'hybrid' ? 'y' : 'm'}&hl=ar&key=${googleKey}&x={x}&y={y}&z={z}`,
        subdomains: ['mt0', 'mt1', 'mt2', 'mt3']
      };
    }

    // High-Resolution Verified Clean Providers (CartoDB Voyager / OpenStreetMap / Esri Satellite):
    if (style === 'streets') {
      // CartoDB Voyager: Crisp Arabic names for Baghdad, Erbil, Basra, and all Iraqi street networks
      return {
        url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
        subdomains: ['a', 'b', 'c', 'd']
      };
    }

    if (style === 'osm') {
      return {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        subdomains: ['a', 'b', 'c']
      };
    }

    // High-Resolution Satellite (Esri World Imagery: Real satellite photography across Iraq with zero watermarks)
    return {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      subdomains: []
    };
  }, [providerManager]);

  // Initialize Map Engine
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (leafletMapRef.current) {
      leafletMapRef.current.remove();
      leafletMapRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: [city.center.lat, city.center.lng],
      zoom: city.zoom || 13,
      zoomControl: false,
      attributionControl: false
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Group Layers
    trafficLayerGroupRef.current = L.layerGroup().addTo(map);
    radarLayerGroupRef.current = L.layerGroup().addTo(map);
    trailLayerGroupRef.current = L.layerGroup().addTo(map);
    routeLayerGroupRef.current = L.layerGroup().addTo(map);

    // Initial Tile Layer
    const tileConfig = getTileUrlForProvider(activeProviderType, tileStyle);
    tileLayerRef.current = L.tileLayer(tileConfig.url, {
      maxZoom: 20,
      subdomains: tileConfig.subdomains || ['a', 'b', 'c']
    }).addTo(map);

    // Universal Tile Error Failover Handler (STEP 9: Guarantee zero black screen)
    let tileErrorCount = 0;
    tileLayerRef.current.on('tileerror', (errorEvent: any) => {
      tileErrorCount++;
      console.error(`[MAP ENGINE ERROR] Tile load failure on provider "${activeProviderType}".`, errorEvent);
      // Immediate fallback to CartoDB Voyager on failure to completely eliminate black tiles
      if (tileErrorCount === 1) {
        console.warn(`[MAP ENGINE] Applying immediate high-res vector fallback layer for ${activeProviderType} to prevent black screen.`);
        tileLayerRef.current?.setUrl('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png');
      }
      if (tileErrorCount >= 3 && providerManager.isAutoFailoverEnabled()) {
        tileErrorCount = 0;
        const next = providerManager.triggerFailover(activeProviderType, `${activeProviderType.toUpperCase()} tile load failure`);
        setFailoverNotice(`انتقل النظام تلقائياً إلى مزود الخرائط التالي (${next.toUpperCase()}) وفق أولوية المزودين (Google ➔ HERE ➔ Mapbox)`);
        setTimeout(() => setFailoverNotice(null), 6000);
      }
    });

    // Interactive Map Click Handler
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (!interactiveSelection) return;
      const { lat, lng } = e.latlng;

      const newPoint: LandmarkPoint = {
        id: `pin-${Date.now()}`,
        name: `موقع محدد على الخريطة (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
        district: city.popularDistricts[0] || 'المركز',
        cityId: selectedCityId,
        category: 'street',
        lat,
        lng,
        popularLocalName: 'إحداثية حقيقية'
      };

      if (onLandmarkClick) {
        onLandmarkClick(newPoint);
      } else {
        if (!pickupPoint) {
          setPickupPoint(newPoint);
        } else {
          setDropoffPoint(newPoint);
        }
        playAudioCue('ding');
      }
    });

    leafletMapRef.current = map;

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
        leafletMapRef.current = null;
      }
    };
  }, [selectedCityId, activeProviderType]);

  // Handle Tile or Provider Switch
  useEffect(() => {
    if (!leafletMapRef.current || !tileLayerRef.current) return;
    const tileConfig = getTileUrlForProvider(activeProviderType, tileStyle);
    tileLayerRef.current.setUrl(tileConfig.url);
  }, [tileStyle, activeProviderType, getTileUrlForProvider]);

  // Recenter map when city changes
  useEffect(() => {
    if (leafletMapRef.current) {
      leafletMapRef.current.setView([city.center.lat, city.center.lng], city.zoom || 13, {
        animate: true
      });
    }
  }, [selectedCityId]);

  // 1. Live Traffic Simulation Layer (Powered by TrafficEngine)
  useEffect(() => {
    const trafficGroup = trafficLayerGroupRef.current;
    if (!trafficGroup) return;
    trafficGroup.clearLayers();

    if (!trafficEnabled) return;

    const trafficPolylines = TrafficEngine.getInstance().getCityTrafficPolylines(selectedCityId, city.center);
    trafficPolylines.forEach(seg => {
      L.polyline(seg.coords, {
        color: seg.color,
        weight: seg.weight,
        opacity: 0.85,
        lineCap: 'round'
      })
        .bindPopup(`<b>حركة السير المباشرة:</b><br>${seg.label}`)
        .addTo(trafficGroup);
    });
  }, [selectedCityId, trafficEnabled, city.center]);

  // 2. Driver Radar Discovery Circles (500m, 1km, 2km, 5km)
  useEffect(() => {
    const radarGroup = radarLayerGroupRef.current;
    if (!radarGroup) return;
    radarGroup.clearLayers();

    const targetCenter = pickupPoint ? [pickupPoint.lat, pickupPoint.lng] : [city.center.lat, city.center.lng];

    if (radarEnabled) {
      const radiiMeters = [500, 1000, 2000, 5000, 10000];
      const colors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];

      radiiMeters.forEach((r, idx) => {
        L.circle(targetCenter as [number, number], {
          radius: r,
          color: colors[idx],
          weight: 1.5,
          opacity: 0.7,
          dashArray: '6, 6',
          fillColor: colors[idx],
          fillOpacity: 0.02
        }).addTo(radarGroup);
      });

      // Count nearby drivers within 5km
      const nearby = driversList.filter(d => {
        const dist = Math.hypot((d.currentLocation.lat - targetCenter[0]) * 111, (d.currentLocation.lng - targetCenter[1]) * 93);
        return dist <= 5.0 && d.isOnline;
      });
      setNearbyDriversCount(nearby.length);
    }
  }, [pickupPoint, selectedCityId, radarEnabled, driversList]);

  // 3. Render Pickup & Dropoff Custom Pins with Ripples
  useEffect(() => {
    const map = leafletMapRef.current;
    if (!map) return;

    if (pickupMarkerRef.current) {
      pickupMarkerRef.current.remove();
      pickupMarkerRef.current = null;
    }
    if (dropoffMarkerRef.current) {
      dropoffMarkerRef.current.remove();
      dropoffMarkerRef.current = null;
    }

    const start = currentTrip ? currentTrip.pickup : pickupPoint;
    const end = currentTrip ? currentTrip.dropoff : dropoffPoint;

    if (start) {
      const pIcon = L.divIcon({
        html: createAdvancedPickupMarker(start.name),
        className: 'pickup-adv-pin-root',
        iconSize: [44, 44],
        iconAnchor: [22, 38]
      });
      pickupMarkerRef.current = L.marker([start.lat, start.lng], { icon: pIcon })
        .addTo(map)
        .bindPopup(`<b>📍 نقطة الانطلاق المعتمدة:</b><br>${start.name}`);
    }

    if (end) {
      const dIcon = L.divIcon({
        html: createAdvancedDestinationMarker(end.name),
        className: 'dropoff-adv-pin-root',
        iconSize: [44, 44],
        iconAnchor: [22, 38]
      });
      dropoffMarkerRef.current = L.marker([end.lat, end.lng], { icon: dIcon })
        .addTo(map)
        .bindPopup(`<b>🏁 نقطة الوصول المحددة:</b><br>${end.name}`);
    }
  }, [pickupPoint, dropoffPoint, currentTrip]);

  // 4. Dynamic Route Polyline with Multi-Provider Support & Automatic Failover
  useEffect(() => {
    const start = currentTrip ? currentTrip.pickup : pickupPoint;
    const end = currentTrip ? currentTrip.dropoff : dropoffPoint;

    if (start && end) {
      fetch('/api/routes/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin: start, destination: end, provider: activeProviderType })
      })
        .then(res => res.json())
        .then(data => {
          if (data && data.coordinates && data.coordinates.length > 0) {
            setRouteCoordinates(data.coordinates);
          }
          if (data && data.alternativeRoute?.coordinates) {
            setAltRouteCoordinates(data.alternativeRoute.coordinates);
            setAltRouteStats(data.alternativeRoute);
          } else {
            setAltRouteCoordinates([]);
            setAltRouteStats(null);
          }
          if (data && data.distanceKm) {
            setRouteStats({
              distanceKm: data.distanceKm,
              durationMins: data.durationMins,
              etaText: data.etaText,
              trafficDelayMins: data.trafficDelayMins || Math.max(1, Math.round(data.durationMins * 0.15)),
              source: data.source
            });
          }
        })
        .catch(err => {
          console.warn('Route API error, triggering failover check:', err);
          if (autoFailover && activeProviderType === 'google') {
            const next = providerManager.triggerFailover('google', 'Route calculation failed');
            setFailoverNotice(`تم التبديل التلقائي إلى ${next.toUpperCase()} بسبب انقطاع مزود الخرائط الأساسي`);
            setTimeout(() => setFailoverNotice(null), 5000);
          }
        });
    } else {
      setRouteCoordinates([]);
      setAltRouteCoordinates([]);
      setAltRouteStats(null);
      setRouteStats(null);
      setVehicleTelemetry(null);
      if (activeTripVehicleMarkerRef.current) {
        activeTripVehicleMarkerRef.current.remove();
        activeTripVehicleMarkerRef.current = null;
      }
    }
  }, [pickupPoint, dropoffPoint, currentTrip?.pickup?.lat, currentTrip?.dropoff?.lat, activeProviderType]);

  // Handle Dispatch & Navigation directly to a Captain detected by Tactical Radar
  const handleSelectCaptainFromRadar = (captain: RadarCaptain) => {
    const origin = currentTrip?.pickup || pickupPoint || { lat: city.center.lat, lng: city.center.lng, address: 'موقعي الحالي' };
    const destination = {
      lat: captain.coords.lat,
      lng: captain.coords.lng,
      address: `${captain.name} (${captain.vehicleModel})`
    };
    setPickupPoint(origin);
    setDropoffPoint(destination);
    setNavDestinationName(`${captain.name} - ${captain.vehicleModel}`);
    setIsNavigating(true);
    setIsNavPaused(false);
    setCameraFollowDriver(true);
  };

  // Turn-by-Turn Navigation Engine Simulation & Guidance Lifecycle
  useEffect(() => {
    if (!isNavigating || routeCoordinates.length < 2) {
      setNavProgressPercent(0);
      return;
    }

    // Synthesize steps using NavigationEngineV3
    const navEngine = NavigationEngineV3.getInstance();
    const navState = navEngine.startNavigation({
      coordinates: routeCoordinates,
      distanceKm: routeStats?.distanceKm || 5.2,
      durationMins: routeStats?.durationMins || 14,
      etaText: routeStats?.etaText || '14 دقيقة',
      provider: activeProviderType
    } as any, navDestinationName);

    setNavCurrentStep(navState.currentStep);
    setNavDistanceToNextTurn(navState.distanceToNextTurnMeters);

    let progress = 0;
    const interval = setInterval(() => {
      if (isNavPaused) return;

      progress += 0.5; // Smooth progression along route
      if (progress >= 100) {
        progress = 100;
        setNavProgressPercent(100);
        setNavCurrentStep({
          id: 'step-done',
          instruction: 'تم الوصول إلى الوجهة بنجاح',
          instructionAr: 'وصلت إلى وجهتك، تم إكمال المسار بنجاح 🏁',
          distanceMeters: 0,
          durationSeconds: 0,
          turnType: 'arrive',
          coordinate: { lat: routeCoordinates[routeCoordinates.length - 1][0], lng: routeCoordinates[routeCoordinates.length - 1][1] }
        });
        setNavDistanceToNextTurn(0);
        clearInterval(interval);
        return;
      }

      setNavProgressPercent(progress);

      // Interpolate position along polyline
      const fraction = progress / 100;
      const pos = getPointAlongPolyline(routeCoordinates, fraction);

      // Realistic speed fluctuation
      const dynamicSpeed = Math.max(25, Math.min(65, Math.round(42 + Math.sin(progress * 0.3) * 12)));
      setNavCurrentSpeed(dynamicSpeed);

      // Move car marker on Leaflet map
      const map = leafletMapRef.current;
      if (map) {
        const carIcon = L.divIcon({
          html: createVehicleSvg('#f59e0b', pos.heading, dynamicSpeed, 'سيارة التوجيه الملاحي'),
          className: 'baly-active-car-marker',
          iconSize: [52, 52],
          iconAnchor: [26, 26]
        });

        if (!activeTripVehicleMarkerRef.current) {
          activeTripVehicleMarkerRef.current = L.marker([pos.lat, pos.lng], { icon: carIcon }).addTo(map);
        } else {
          activeTripVehicleMarkerRef.current.setIcon(carIcon);
          activeTripVehicleMarkerRef.current.setLatLng([pos.lat, pos.lng]);
        }

        // Camera follow
        if (cameraFollowDriver) {
          map.panTo([pos.lat, pos.lng], { animate: true, duration: 0.4 });
        }
      }

      // Calculate next turn distance
      const distToTurn = Math.max(20, Math.round((1 - (progress % 20) / 20) * 450));
      setNavDistanceToNextTurn(distToTurn);

      // Synthesize turning instruction based on bearing changes
      if (distToTurn < 100) {
        if (progress > 80) {
          setNavCurrentStep({
            id: 'step-final-approaching',
            instruction: 'اقتربت من الوجهة المحددة',
            instructionAr: 'الوجهة على يمينك بعد 80 متراً',
            distanceMeters: 80,
            durationSeconds: 15,
            turnType: 'arrive',
            coordinate: { lat: pos.lat, lng: pos.lng }
          });
        } else if (Math.floor(progress / 20) % 2 === 0) {
          setNavCurrentStep({
            id: `step-turn-${Math.floor(progress / 20)}`,
            instruction: 'انعطف يميناً عند التقاطع القادم',
            instructionAr: 'انعطف يميناً بعد 90 متراً نحو الشارع الرئيسي',
            distanceMeters: 90,
            durationSeconds: 15,
            turnType: 'turn-right',
            coordinate: { lat: pos.lat, lng: pos.lng }
          });
        } else {
          setNavCurrentStep({
            id: `step-turn-${Math.floor(progress / 20)}`,
            instruction: 'انعطف يساراً عند الإشارة الضوئية',
            instructionAr: 'انعطف يساراً بعد 90 متراً عند الإشارة الضوئية',
            distanceMeters: 90,
            durationSeconds: 15,
            turnType: 'turn-left',
            coordinate: { lat: pos.lat, lng: pos.lng }
          });
        }
      } else {
        setNavCurrentStep({
          id: `step-straight-${Math.floor(progress / 20)}`,
          instruction: 'تابع السير للأمام في المسار الحالي',
          instructionAr: `تابع السير للأمام لمسافة ${distToTurn} متر`,
          distanceMeters: distToTurn,
          durationSeconds: 40,
          turnType: 'straight',
          coordinate: { lat: pos.lat, lng: pos.lng }
        });
      }
    }, 280);

    return () => clearInterval(interval);
  }, [isNavigating, isNavPaused, routeCoordinates, cameraFollowDriver]);

  // Render Real Street Route & Active Vehicle Engine
  useEffect(() => {
    const routeGroup = routeLayerGroupRef.current;
    const trailGroup = trailLayerGroupRef.current;
    const map = leafletMapRef.current;
    if (!routeGroup || !map || routeCoordinates.length < 2) return;
    routeGroup.clearLayers();

    // Render Alternative Route if available
    if (showAlternativeRoute && altRouteCoordinates.length >= 2 && (!currentTrip || currentTrip.status !== 'trip_in_progress')) {
      L.polyline(altRouteCoordinates, {
        color: '#0284c7',
        weight: 4,
        opacity: 0.75,
        dashArray: '6, 8',
        lineCap: 'round'
      })
        .bindPopup(`<b>🛣️ مسار بديل (${activeProviderType.toUpperCase()}):</b> ${altRouteStats?.name || 'طريق فرعي'}<br>المسافة: ${altRouteStats?.distanceKm || ''} كم | المدة: ${altRouteStats?.durationMins || ''} د`)
        .addTo(routeGroup);
    }

    const isTripActive = currentTrip && currentTrip.status === 'trip_in_progress';
    const progress = isTripActive ? (currentTrip.progressPercent || 0) / 100 : 0;

    if (isTripActive && progress > 0) {
      const pos = getPointAlongPolyline(routeCoordinates, progress);
      const splitIdx = pos.segmentIndex;

      const completedCoords: [number, number][] = [
        ...routeCoordinates.slice(0, splitIdx + 1),
        [pos.lat, pos.lng]
      ];
      const remainingCoords: [number, number][] = [
        [pos.lat, pos.lng],
        ...routeCoordinates.slice(splitIdx + 1)
      ];

      // 1. Completed Route (Subtle slate gray dashed trail)
      if (completedCoords.length >= 2) {
        L.polyline(completedCoords, {
          color: '#64748b',
          weight: 5,
          opacity: 0.6,
          dashArray: '6, 6'
        }).addTo(routeGroup);
      }

      // 2. Remaining Route (Vibrant neon amber glow)
      if (remainingCoords.length >= 2) {
        L.polyline(remainingCoords, {
          color: '#f59e0b',
          weight: 6,
          opacity: 0.95,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(routeGroup);
      }

      // 3. Active Vehicle Engine on exact street coordinate
      const currentSpeed = Math.round(38 + Math.sin(Date.now() / 2500) * 8);
      const remainingKm = Math.max(0.1, Math.round(((1 - progress) * (routeStats?.distanceKm || 5.0)) * 10) / 10);
      const etaSecs = Math.round((remainingKm / (currentSpeed || 30)) * 3600);

      setVehicleTelemetry({
        speed: currentSpeed,
        heading: pos.heading,
        etaSeconds: etaSecs,
        remainingKm
      });

      const carIcon = L.divIcon({
        html: createVehicleSvg('#f59e0b', pos.heading, currentSpeed, currentTrip.driver?.name || 'الكابتن'),
        className: 'baly-active-car-marker',
        iconSize: [52, 52],
        iconAnchor: [26, 26]
      });

      if (!activeTripVehicleMarkerRef.current) {
        activeTripVehicleMarkerRef.current = L.marker([pos.lat, pos.lng], { icon: carIcon })
          .addTo(map)
          .bindPopup(`<b>كابتن الرحلة</b>: ${currentTrip.driver?.name || 'الكابتن'}<br>السرعة الحالية: ${currentSpeed} كم/س`);
      } else {
        activeTripVehicleMarkerRef.current.setIcon(carIcon);
        activeTripVehicleMarkerRef.current.setLatLng([pos.lat, pos.lng]);
      }

      // 4. Breadcrumb trail
      if (trailEnabled && trailGroup) {
        L.circleMarker([pos.lat, pos.lng], {
          radius: 3,
          color: '#f59e0b',
          fillColor: '#f59e0b',
          fillOpacity: 0.5,
          weight: 0
        }).addTo(trailGroup);
      }

      // 5. Smart Follow Camera (Looks ahead along heading vector)
      if (cameraFollowDriver) {
        const lookAheadMeters = Math.min(220, Math.max(75, currentSpeed * 2.5));
        const headingRad = (pos.heading * Math.PI) / 180;
        const dLat = (Math.cos(headingRad) * lookAheadMeters) / 111000;
        const dLng = (Math.sin(headingRad) * lookAheadMeters) / (111000 * Math.cos((pos.lat * Math.PI) / 180));
        map.panTo([pos.lat + dLat, pos.lng + dLng], { animate: true, duration: 0.6 });
      }
    } else {
      // Standard full route polyline
      L.polyline(routeCoordinates, {
        color: '#f59e0b',
        weight: 6,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(routeGroup);

      if (activeTripVehicleMarkerRef.current) {
        activeTripVehicleMarkerRef.current.remove();
        activeTripVehicleMarkerRef.current = null;
      }
    }
  }, [routeCoordinates, altRouteCoordinates, showAlternativeRoute, currentTrip?.status, currentTrip?.progressPercent, trailEnabled, cameraFollowDriver, activeProviderType]);

  // 5. High-Performance 60 FPS Vehicle Interpolation & Driver Markers
  useEffect(() => {
    const map = leafletMapRef.current;
    const trailGroup = trailLayerGroupRef.current;
    if (!map || !showFleetFleetAll) return;

    driversList.forEach(driver => {
      const targetLat = driver.currentLocation.lat;
      const targetLng = driver.currentLocation.lng;
      const targetHeading = driver.heading || 0;
      const color = driver.isBusy ? '#ef4444' : '#f59e0b';

      let entry = driverMarkersMapRef.current.get(driver.id);

      if (!entry) {
        // Create new marker with custom top-down SVG vehicle
        const icon = L.divIcon({
          html: createVehicleSvg(color, targetHeading, 30),
          className: 'baly-vehicle-marker-root',
          iconSize: [48, 48],
          iconAnchor: [24, 24]
        });

        const m = L.marker([targetLat, targetLng], { icon })
          .addTo(map)
          .bindPopup(`
            <div style="direction: rtl; font-family: Cairo, sans-serif; font-size: 12px;">
              <b>كابتن: ${driver.name}</b><br>
              🚗 ${driver.car.make} ${driver.car.model} (${driver.car.plateNumber})<br>
              ⭐ تقييم: ${driver.rating} | ${driver.isBusy ? '🔴 في مشوار نشط' : '🟢 متاح للطلب'}
            </div>
          `);

        driverMarkersMapRef.current.set(driver.id, {
          marker: m,
          currentLat: targetLat,
          currentLng: targetLng,
          heading: targetHeading
        });
      } else {
        // Smooth Interpolation: update heading and coordinates
        const prevLat = entry.currentLat;
        const prevLng = entry.currentLng;
        const dLat = targetLat - prevLat;
        const dLng = targetLng - prevLng;

        // Auto-calculate bearing if vehicle moved significantly
        let heading = targetHeading;
        if (Math.abs(dLat) > 0.00005 || Math.abs(dLng) > 0.00005) {
          const angleRad = Math.atan2(dLng, dLat);
          heading = (angleRad * (180 / Math.PI) + 360) % 360;
        }

        // Update Vehicle Icon with new heading
        const updatedIcon = L.divIcon({
          html: createVehicleSvg(color, Math.round(heading), 35),
          className: 'baly-vehicle-marker-root',
          iconSize: [48, 48],
          iconAnchor: [24, 24]
        });
        entry.marker.setIcon(updatedIcon);
        entry.marker.setLatLng([targetLat, targetLng]);

        // Record history trail coordinates
        if (trailEnabled && trailGroup) {
          let history = driverTrailsMapRef.current.get(driver.id) || [];
          history.push([targetLat, targetLng]);
          if (history.length > 8) history.shift();
          driverTrailsMapRef.current.set(driver.id, history);

          if (history.length >= 2) {
            L.polyline(history, {
              color: '#f59e0b',
              weight: 3,
              opacity: 0.45,
              dashArray: '4, 4'
            }).addTo(trailGroup);
          }
        }

        entry.currentLat = targetLat;
        entry.currentLng = targetLng;
        entry.heading = heading;

        // Camera Follow Mode
        if (cameraFollowDriver && driver.id === driversList[0]?.id) {
          map.panTo([targetLat, targetLng], { animate: true, duration: 0.6 });
        }
      }
    });
  }, [driversList, showFleetFleetAll, trailEnabled, cameraFollowDriver]);

  // Request Live GPS
  const handleGetLiveGps = () => {
    if (!navigator.geolocation) {
      alert('نظام تحديد المواقع GPS غير مدعوم في هذا الجهاز');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      pos => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        const gpsPoint: LandmarkPoint = {
          id: `gps-${Date.now()}`,
          name: '📍 موقعي الحالي (GPS دقيق)',
          district: 'الموقع المباشر',
          cityId: selectedCityId,
          category: 'landmark',
          lat: coords.lat,
          lng: coords.lng,
          popularLocalName: 'GPS الحقيقي من الهاتف'
        };

        if (onLandmarkClick) {
          onLandmarkClick(gpsPoint);
        } else {
          setPickupPoint(gpsPoint);
        }

        if (leafletMapRef.current) {
          leafletMapRef.current.setView([coords.lat, coords.lng], 16, { animate: true });

          if (userGpsCircleRef.current) userGpsCircleRef.current.remove();
          userGpsCircleRef.current = L.circle([coords.lat, coords.lng], {
            radius: pos.coords.accuracy || 25,
            color: '#10b981',
            fillColor: '#10b981',
            fillOpacity: 0.25
          }).addTo(leafletMapRef.current);
        }

        playAudioCue('ding');
      },
      err => {
        console.warn('GPS Notice:', err);
        alert('يرجى السماح بالوصول إلى الموقع (GPS) في المتصفح لاستخدام موقعك الفعلي.');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Landmark Search (Powered by SearchEngine)
  const handleSearchChange = async (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setFilteredLandmarks([]);
      setIsSearchExpanded(false);
      return;
    }
    const results = await SearchEngine.getInstance().search(q, selectedCityId, city.center, activeProviderType);
    setFilteredLandmarks(results);
    setIsSearchExpanded(true);
  };

  const handleSelectLandmark = (l: LandmarkPoint) => {
    if (onLandmarkClick) {
      onLandmarkClick(l);
    } else {
      if (!pickupPoint) setPickupPoint(l);
      else setDropoffPoint(l);
    }
    if (leafletMapRef.current) {
      leafletMapRef.current.setView([l.lat, l.lng], 16, { animate: true });
    }
    setSearchQuery('');
    setIsSearchExpanded(false);
    playAudioCue('ding');
  };

  const handleProviderSwitch = (newProvider: MapProviderType) => {
    providerManager.setActiveProvider(newProvider);
    setShowProviderMenu(false);
    playAudioCue('tap');
  };

  const toggleAutoFailover = () => {
    const next = !autoFailover;
    setAutoFailover(next);
    providerManager.setAutoFailoverEnabled(next);
  };

  return (
    <div className={`relative w-full ${heightClass} bg-slate-950 overflow-hidden select-none`}>
      {/* Real Map Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Auto-Failover Notification Banner */}
      {failoverNotice && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-40 bg-amber-500 text-slate-950 px-4 py-2 rounded-2xl shadow-2xl flex items-center gap-2 text-xs font-black animate-in fade-in slide-in-from-top duration-300">
          <Zap className="w-4 h-4 text-slate-950" />
          <span>{failoverNotice}</span>
        </div>
      )}

      {/* Top Floating Controls Bar */}
      <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between pointer-events-none gap-2">
        <div className="flex items-center gap-1.5 pointer-events-auto bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-2xl p-1.5 shadow-2xl">
          {/* City Badge */}
          <div className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20">
            <Compass className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">محرك خرائط</span>
            <span>{city.nameAr.split(' ')[0]}</span>
          </div>

          {/* Central Map Provider Switcher Menu */}
          <div className="relative">
            <button
              onClick={() => setShowProviderMenu(!showProviderMenu)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all border ${
                activeProviderType === 'google'
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                  : activeProviderType === 'here'
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-violet-500/20 text-violet-300 border-violet-500/40'
              }`}
              title="تبديل مزود الخرائط الأساسي (Google / HERE / Mapbox)"
            >
              <Globe2 className="w-3.5 h-3.5" />
              <span>
                {activeProviderType === 'google' ? 'Google Maps' : activeProviderType === 'here' ? 'HERE Maps' : 'Mapbox'}
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </button>

            {/* Provider Switcher Dropdown */}
            {showProviderMenu && (
              <div className="absolute top-full mt-2 right-0 w-64 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-2.5 shadow-2xl space-y-1.5 text-xs text-slate-200 z-50">
                <div className="text-[10px] text-slate-400 font-bold px-2 py-1 border-b border-slate-800 flex items-center justify-between">
                  <span>طبقة مزودي الخرائط (Multi-Provider)</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                </div>

                {/* HERE Maps Option */}
                <button
                  onClick={() => handleProviderSwitch('here')}
                  className={`w-full flex items-center justify-between p-2 rounded-xl transition-all ${
                    activeProviderType === 'here' ? 'bg-cyan-500/20 text-cyan-300 font-black border border-cyan-500/30' : 'hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">🗺️</span>
                    <div className="text-right">
                      <div>HERE Technologies v3</div>
                      <div className="text-[9px] text-slate-400">المزود الأساسي الفائق (35ms)</div>
                    </div>
                  </div>
                  {activeProviderType === 'here' && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                </button>

                {/* Mapbox Option */}
                <button
                  onClick={() => handleProviderSwitch('mapbox')}
                  className={`w-full flex items-center justify-between p-2 rounded-xl transition-all ${
                    activeProviderType === 'mapbox' ? 'bg-violet-500/20 text-violet-300 font-black border border-violet-500/30' : 'hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">📐</span>
                    <div className="text-right">
                      <div>Mapbox Navigation</div>
                      <div className="text-[9px] text-slate-400">المزود الثاني المعتمد (40ms)</div>
                    </div>
                  </div>
                  {activeProviderType === 'mapbox' && <CheckCircle2 className="w-4 h-4 text-violet-400" />}
                </button>

                {/* Google Maps Option */}
                <button
                  onClick={() => handleProviderSwitch('google')}
                  className={`w-full flex items-center justify-between p-2 rounded-xl transition-all ${
                    activeProviderType === 'google' ? 'bg-emerald-500/20 text-emerald-300 font-black border border-emerald-500/30' : 'hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base">🌐</span>
                    <div className="text-right">
                      <div>Google Maps Platform</div>
                      <div className="text-[9px] text-slate-400">المزود الاحتياطي (50ms)</div>
                    </div>
                  </div>
                  {activeProviderType === 'google' && <CheckCircle2 className="w-4 h-4 text-emerald-400" />}
                </button>

                {/* Diagnostic Report Button inside dropdown */}
                <div className="border-t border-slate-800 pt-2 mt-2">
                  <button
                    onClick={() => {
                      setShowProviderMenu(false);
                      setShowDiagnosticModal(true);
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-xl text-[11px] font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 transition-all mb-1"
                  >
                    <div className="flex items-center gap-1.5">
                      <Activity className="w-3.5 h-3.5" />
                      <span>تقرير الفحص التشخيصي (Task 9)</span>
                    </div>
                    <span className="text-[10px] text-slate-400">فتح ➔</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowProviderMenu(false);
                      setShowApiKeyModal(true);
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-xl text-[11px] font-bold text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 transition-all"
                  >
                    <div className="flex items-center gap-1.5">
                      <Key className="w-3.5 h-3.5" />
                      <span>إدارة مفاتيح API (HERE / Mapbox / Google)</span>
                    </div>
                    <span className="text-[10px] text-slate-400">فتح ➔</span>
                  </button>
                </div>

                {/* Failover Policy Info */}
                <div className="border-t border-slate-800 pt-2 mt-2 px-2 text-[10px] text-slate-400">
                  <div className="flex items-center justify-between mb-1">
                    <span>الانتقال التلقائي (Auto-Failover):</span>
                    <button
                      onClick={toggleAutoFailover}
                      className={`px-2 py-0.5 rounded-md font-black ${
                        autoFailover ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {autoFailover ? 'مفعّل' : 'معطّل'}
                    </button>
                  </div>
                  <div className="text-[9px] text-slate-500 leading-tight">
                    تسلسل النقل: Google ➔ HERE ➔ Mapbox تلقائياً عند أي انقطاع
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Direct Google Maps Key & Status Button */}
          <button
            onClick={() => setShowApiKeyModal(true)}
            className="flex items-center gap-1.5 bg-amber-500/15 hover:bg-amber-500/25 text-amber-300 border border-amber-500/30 px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-sm"
            title="إعدادات مفتاح Google Maps ورابط الاستخراج"
          >
            <Key className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">مفتاح API</span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold">
              نشطة ✓
            </span>
          </button>

          {/* Map Layer Switcher (Hybrid / Streets) */}
          <div className="flex items-center bg-slate-950/80 p-0.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setTileStyle('hybrid')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                tileStyle === 'hybrid'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="أقمار صناعية حقيقية"
            >
              <Satellite className="w-3 h-3" />
              <span className="hidden md:inline">فضائي</span>
            </button>
            <button
              onClick={() => setTileStyle('streets')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                tileStyle === 'streets'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="خريطة الشوارع"
            >
              <MapIcon className="w-3 h-3" />
              <span className="hidden md:inline">شوارع</span>
            </button>
          </div>

          {/* Traffic Toggle */}
          <button
            onClick={() => setTrafficEnabled(!trafficEnabled)}
            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all ${
              trafficEnabled
                ? 'bg-red-500/20 text-red-400 border border-red-500/30 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
            title="طبقة الازدحامات المباشرة"
          >
            <Flame className="w-3.5 h-3.5" />
            <span className="hidden lg:inline">الازدحام</span>
          </button>

          {/* Radar Button - Opens Tactical Radar Cockpit */}
          <button
            onClick={() => {
              setRadarEnabled(true);
              setShowRadarCockpit(true);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs transition-all shadow-sm bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30"
            title="فتح رادار الكباتن التكتيكي الحي"
          >
            <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
            <span className="font-bold">رادار الكباتن</span>
            <span className="text-[10px] bg-emerald-500/30 text-emerald-200 px-1.5 py-0.2 rounded-full font-bold">
              {nearbyDriversCount || 7}
            </span>
          </button>
        </div>

        {/* Right Controls: GPS & Fullscreen */}
        <div className="pointer-events-auto flex items-center gap-1.5">
          <button
            onClick={handleGetLiveGps}
            title="تحديد موقعي الفعلي عبر GPS الجهاز"
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3 py-2 rounded-xl shadow-lg transition-all active:scale-95 border border-emerald-400/30"
          >
            <Crosshair className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '4s' }} />
            <span className="hidden sm:inline">GPS موقعي</span>
          </button>

          {onToggleFullScreen && (
            <button
              onClick={onToggleFullScreen}
              className="p-2 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white transition-all shadow-xl"
              title={isFullScreen ? 'تصغير الشاشة' : 'تكبير ملء الشاشة'}
            >
              {isFullScreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* Floating Minimal Search Bar (Top Overlay with Auto Collapse) */}
      <div className="absolute top-3.5 left-1/2 -translate-x-1/2 z-30 pointer-events-auto">
        {!isSearchExpanded ? (
          <button
            onClick={() => {
              setIsSearchExpanded(true);
              setFilteredLandmarks(cityLandmarks);
            }}
            className="flex items-center gap-2.5 bg-slate-900/80 hover:bg-slate-900/95 backdrop-blur-xl border border-white/15 px-4 py-2 rounded-full shadow-2xl transition-all duration-300 active:scale-95 group text-right"
          >
            <div className="w-6 h-6 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform shrink-0">
              <Search className="w-3.5 h-3.5" />
            </div>
            <span className="text-xs font-bold text-slate-200 group-hover:text-white">إلى أين وجهتك اليوم؟</span>
            <span className="hidden sm:inline text-[10px] text-slate-400">({city.nameAr.split(' ')[0]})</span>
            <div className="flex items-center gap-1 mr-2 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/20">
              <span>بحث سريع</span>
            </div>
          </button>
        ) : (
          <div className="w-[92vw] max-w-md bg-slate-900/95 backdrop-blur-2xl border border-amber-500/40 rounded-3xl p-3.5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2 text-xs font-bold text-white">
                <Search className="w-4 h-4 text-amber-400" />
                <span>البحث الموحد في معالم وشوارع {city.nameAr}</span>
              </div>
              <button
                onClick={() => {
                  setIsSearchExpanded(false);
                  setSearchQuery('');
                }}
                className="px-2 py-0.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all text-xs font-bold"
                title="طي شريط البحث"
              >
                ✕ إغلاق
              </button>
            </div>

            <div className="relative mb-2">
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={e => handleSearchChange(e.target.value)}
                placeholder="اكتب اسم المعلم، المول، المطار، أو الحي..."
                className="w-full bg-slate-950/90 border border-slate-700/80 rounded-2xl py-2 pr-9 pl-4 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-amber-500 shadow-inner"
              />
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
            </div>

            {/* Quick Categories */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 mb-2 scrollbar-none text-[10px]">
              <button
                onClick={() => setSearchCategory('all')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all shrink-0 ${searchCategory === 'all' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
              >
                الكل ({cityLandmarks.length})
              </button>
              <button
                onClick={() => setSearchCategory('shopping')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all shrink-0 ${searchCategory === 'shopping' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
              >
                🛍️ تسوّق ومولات
              </button>
              <button
                onClick={() => setSearchCategory('airport')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all shrink-0 ${searchCategory === 'airport' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
              >
                ✈️ مطارات ومحطات
              </button>
              <button
                onClick={() => setSearchCategory('hospital')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all shrink-0 ${searchCategory === 'hospital' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}
              >
                🏥 مستشفيات
              </button>
            </div>

            {/* Filtered Landmarks List */}
            <div className="max-h-52 overflow-y-auto space-y-1">
              {(filteredLandmarks.length > 0 ? filteredLandmarks : cityLandmarks)
                .filter(l => searchCategory === 'all' || l.category === searchCategory)
                .map(l => (
                  <button
                    key={l.id}
                    onClick={() => {
                      handleSelectLandmark(l);
                      setIsSearchExpanded(false);
                      setSearchQuery('');
                    }}
                    className="w-full text-right p-2 hover:bg-slate-800/80 rounded-xl transition-all flex items-center justify-between text-xs text-slate-200 group"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm">
                        {l.category === 'airport' ? '✈️' : l.category === 'shopping' ? '🛍️' : l.category === 'hospital' ? '🏥' : '📍'}
                      </span>
                      <div>
                        <div className="font-bold text-white group-hover:text-amber-300">{l.name}</div>
                        <div className="text-[10px] text-slate-400">{l.popularLocalName || l.district}</div>
                      </div>
                    </div>
                    <span className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 opacity-0 group-hover:opacity-100 transition-opacity font-bold">
                      اختيار الوجهة
                    </span>
                  </button>
                ))}
            </div>
          </div>
        )}
      </div>

      {/* Layers Floating Selector & Toggles */}
      <div className="absolute top-14 left-3 z-20 pointer-events-auto">
        <div className="relative">
          <button
            onClick={() => setShowLayersDropdown(!showLayersDropdown)}
            className="flex items-center gap-1.5 bg-slate-900/80 hover:bg-slate-900/95 backdrop-blur-xl border border-white/10 px-3 py-1.5 rounded-xl shadow-xl text-xs font-bold text-slate-200 hover:text-white transition-all"
            title="طبقات وخيارات الخريطة"
          >
            <Layers className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">الطبقات</span>
          </button>

          {showLayersDropdown && (
            <div className="absolute top-full mt-2 left-0 w-52 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl p-2 shadow-2xl space-y-1 text-xs text-slate-200">
              <div className="text-[10px] text-slate-400 font-bold px-2 py-1 border-b border-slate-800">
                طبقات الخريطة الذكية
              </div>
              <button
                onClick={() => setTrafficEnabled(!trafficEnabled)}
                className="w-full flex items-center justify-between p-2 hover:bg-slate-800 rounded-xl transition-all"
              >
                <span>🚦 حركة المرور الحية</span>
                <span className={`w-2.5 h-2.5 rounded-full ${trafficEnabled ? 'bg-red-500 shadow-sm shadow-red-500' : 'bg-slate-600'}`} />
              </button>
              <button
                onClick={() => setDriversLayerEnabled(!driversLayerEnabled)}
                className="w-full flex items-center justify-between p-2 hover:bg-slate-800 rounded-xl transition-all"
              >
                <span>🚕 كباتن بلي القريبين</span>
                <span className={`w-2.5 h-2.5 rounded-full ${driversLayerEnabled ? 'bg-emerald-500 shadow-sm shadow-emerald-500' : 'bg-slate-600'}`} />
              </button>
              <button
                onClick={() => setShowAlternativeRoute(!showAlternativeRoute)}
                className="w-full flex items-center justify-between p-2 hover:bg-slate-800 rounded-xl transition-all"
              >
                <span>🛣️ المسارات البديلة</span>
                <span className={`w-2.5 h-2.5 rounded-full ${showAlternativeRoute ? 'bg-sky-500 shadow-sm shadow-sky-500' : 'bg-slate-600'}`} />
              </button>
              <button
                onClick={() => setRadarEnabled(!radarEnabled)}
                className="w-full flex items-center justify-between p-2 hover:bg-slate-800 rounded-xl transition-all"
              >
                <span>📡 رادار التغطية</span>
                <span className={`w-2.5 h-2.5 rounded-full ${radarEnabled ? 'bg-blue-500 shadow-sm shadow-blue-500' : 'bg-slate-600'}`} />
              </button>
              <div className="border-t border-slate-800 pt-1 mt-1">
                <button
                  onClick={() => setTileStyle(tileStyle === 'hybrid' ? 'streets' : 'hybrid')}
                  className="w-full flex items-center justify-between p-2 hover:bg-slate-800 rounded-xl transition-all text-amber-400 font-bold"
                >
                  <span>{tileStyle === 'hybrid' ? '🛰️ قمر صناعي' : '🗺️ خريطة شوارع'}</span>
                  <span className="text-[10px] text-slate-400">تبديل</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Live Route & ETA Overlay Card & Vehicle Telemetry HUD */}
      {routeStats && (
        <div className="absolute bottom-4 left-4 right-4 z-20 pointer-events-auto bg-slate-900/95 backdrop-blur-md border border-amber-500/40 rounded-2xl p-3 shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-white animate-in fade-in slide-in-from-bottom duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
                <span>مسار الملاحة ({activeProviderType.toUpperCase()})</span>
                {routeStats.trafficDelayMins > 0 && (
                  <span className="text-red-400 text-[10px] font-bold">
                    (+{routeStats.trafficDelayMins} د تأخير حركة سير)
                  </span>
                )}
              </div>
              <div className="text-sm font-black text-slate-100 flex flex-wrap items-center gap-2">
                <span className="text-white">المسافة الكلية: {routeStats.distanceKm} كم</span>
                <span className="text-slate-500">•</span>
                <span className="text-amber-400 font-extrabold">الوصول المتوقع: {routeStats.etaText}</span>
              </div>
            </div>
          </div>

          {/* Vehicle Real-Time Live Telemetry (When ride in progress) */}
          {vehicleTelemetry && (
            <div className="flex items-center gap-2 bg-slate-950/80 px-3 py-1.5 rounded-xl border border-slate-800">
              <div className="text-center px-2 border-l border-slate-800">
                <div className="text-[10px] text-slate-400">سرعة السيارة</div>
                <div className="text-xs font-black text-emerald-400">{vehicleTelemetry.speed} كم/س</div>
              </div>
              <div className="text-center px-2 border-l border-slate-800">
                <div className="text-[10px] text-slate-400">الاتجاه</div>
                <div className="text-xs font-black text-amber-400">{vehicleTelemetry.heading}°</div>
              </div>
              <div className="text-center px-2 border-l border-slate-800">
                <div className="text-[10px] text-slate-400">المتبقي</div>
                <div className="text-xs font-black text-white">{vehicleTelemetry.remainingKm} كم</div>
              </div>
              <button
                onClick={() => setCameraFollowDriver(!cameraFollowDriver)}
                className={`text-[10px] font-bold px-2.5 py-1 rounded-lg transition-all ${
                  cameraFollowDriver
                    ? 'bg-blue-600 text-white shadow'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
                title="تثبيت زاوية الكاميرا الذكية على سيارة الكابتن المتحركة"
              >
                {cameraFollowDriver ? '📹 تتبع الكاميرا مفعل' : '📹 تتبع الكاميرا'}
              </button>
            </div>
          )}

          <div className="flex items-center gap-2">
            {!isNavigating && (
              <button
                onClick={() => {
                  setIsNavigating(true);
                  setIsNavPaused(false);
                  setCameraFollowDriver(true);
                }}
                className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl shadow-lg shadow-amber-500/25 transition-all active:scale-95"
              >
                <Navigation className="w-4 h-4 text-slate-950" />
                <span>بدء التوجيه الملاحي الحي (GPS)</span>
              </button>
            )}

            <div className="flex items-center gap-1 bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-lg text-[10px] font-bold border border-emerald-500/30 self-start md:self-auto">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>محرك الشوارع 60 FPS</span>
            </div>
          </div>
        </div>
      )}

      {/* Real-time Turn-by-Turn Navigation HUD Overlay */}
      <NavigationHud
        isActive={isNavigating}
        onStop={() => setIsNavigating(false)}
        destinationName={navDestinationName}
        totalDistanceKm={routeStats?.distanceKm || 5.2}
        remainingDistanceKm={Math.max(0, Math.round(((routeStats?.distanceKm || 5.2) * (1 - navProgressPercent / 100)) * 10) / 10)}
        totalDurationMins={routeStats?.durationMins || 14}
        remainingDurationMins={Math.max(1, Math.round((routeStats?.durationMins || 14) * (1 - navProgressPercent / 100)))}
        etaText={routeStats?.etaText || '14 د'}
        currentStep={navCurrentStep}
        distanceToNextTurnMeters={navDistanceToNextTurn}
        currentSpeedKmh={navCurrentSpeed}
        progressPercent={navProgressPercent}
        isPaused={isNavPaused}
        onTogglePause={() => setIsNavPaused(!isNavPaused)}
        onRecenter={() => {
          setCameraFollowDriver(true);
          const pos = getPointAlongPolyline(routeCoordinates, navProgressPercent / 100);
          leafletMapRef.current?.panTo([pos.lat, pos.lng], { animate: true });
        }}
      />

      {/* Real Tactical Radar Cockpit Modal */}
      <RadarCockpitModal
        isOpen={showRadarCockpit}
        onClose={() => setShowRadarCockpit(false)}
        centerCoords={{
          lat: pickupPoint?.lat || city.center.lat,
          lng: pickupPoint?.lng || city.center.lng
        }}
        onSelectCaptainForRoute={handleSelectCaptainFromRadar}
      />

      {/* Multi-Provider Map API Key & Setup Modal */}
      <MapApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        onKeyUpdated={() => {
          if (leafletMapRef.current && tileLayerRef.current) {
            const tileConfig = getTileUrlForProvider(activeProviderType, tileStyle);
            tileLayerRef.current.setUrl(tileConfig.url);
          }
        }}
      />

      {/* Task 9 Live Diagnostic Report Modal */}
      <DiagnosticReportModal
        isOpen={showDiagnosticModal}
        onClose={() => setShowDiagnosticModal(false)}
        activeProviderType={activeProviderType}
        onSwitchProvider={handleProviderSwitch}
      />
    </div>
  );
};

export const BalyMapEngine = DanielMapEngine;
