import React, { useRef, useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { IRAQI_CITIES, IRAQI_LANDMARKS } from '../../data/iraqLocations';
import { LandmarkPoint } from '../../types';
import { MapPin, Navigation, Layers, Compass, ZoomIn, ZoomOut, Flame, AlertCircle } from 'lucide-react';

interface IraqiMapCanvasProps {
  interactiveSelection?: boolean;
  showSurgeHeatmap?: boolean;
  showFleetFleetAll?: boolean;
  heightClass?: string;
  onLandmarkClick?: (landmark: LandmarkPoint) => void;
}

export const IraqiMapCanvas: React.FC<IraqiMapCanvasProps> = ({
  interactiveSelection = true,
  showSurgeHeatmap = true,
  showFleetFleetAll = true,
  heightClass = 'h-full',
  onLandmarkClick
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const {
    selectedCityId,
    pickupPoint,
    dropoffPoint,
    setPickupPoint,
    setDropoffPoint,
    currentTrip,
    driversList,
    surgeZones
  } = useApp();

  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [mapStyle, setMapStyle] = useState<'night' | 'navigation' | 'satellite'>('night');
  const [trafficActive, setTrafficActive] = useState<boolean>(true);

  const city = IRAQI_CITIES.find(c => c.id === selectedCityId) || IRAQI_CITIES[0];
  const cityLandmarks = IRAQI_LANDMARKS.filter(lm => lm.cityId === selectedCityId);

  // Coordinate projector from (lat, lng) to canvas pixels
  const projectCoords = (
    lat: number,
    lng: number,
    width: number,
    height: number,
    centerLat: number,
    centerLng: number,
    zoom: number,
    pan: { x: number; y: number }
  ) => {
    // scale factor
    const scale = 5500 * zoom;
    const x = width / 2 + (lng - centerLng) * scale * 0.85 + pan.x;
    const y = height / 2 - (lat - centerLat) * scale + pan.y;
    return { x, y };
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;

      // Clear Canvas
      ctx.clearRect(0, 0, width, height);

      // Background theme
      if (mapStyle === 'night') {
        ctx.fillStyle = '#090d16'; // Deep Slate Navy
      } else if (mapStyle === 'navigation') {
        ctx.fillStyle = '#111827';
      } else {
        ctx.fillStyle = '#040d12';
      }
      ctx.fillRect(0, 0, width, height);

      const centerLat = city.center.lat;
      const centerLng = city.center.lng;

      // Draw River (Tigris / Shatt al-Arab style aesthetic)
      ctx.save();
      ctx.beginPath();
      const riverPts = [
        { lat: centerLat + 0.08, lng: centerLng - 0.05 },
        { lat: centerLat + 0.04, lng: centerLng - 0.02 },
        { lat: centerLat + 0.01, lng: centerLng + 0.01 },
        { lat: centerLat - 0.03, lng: centerLng + 0.03 },
        { lat: centerLat - 0.07, lng: centerLng + 0.06 }
      ];

      const p0 = projectCoords(riverPts[0].lat, riverPts[0].lng, width, height, centerLat, centerLng, zoomLevel, panOffset);
      ctx.moveTo(p0.x, p0.y);
      for (let i = 1; i < riverPts.length; i++) {
        const pt = projectCoords(riverPts[i].lat, riverPts[i].lng, width, height, centerLat, centerLng, zoomLevel, panOffset);
        ctx.lineTo(pt.x, pt.y);
      }
      ctx.strokeStyle = mapStyle === 'night' ? 'rgba(30, 64, 175, 0.45)' : 'rgba(14, 116, 144, 0.5)';
      ctx.lineWidth = 32 * zoomLevel;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();

      // River label (نهر دجلة الخالد / شط العرب)
      const riverMid = projectCoords(centerLat, centerLng + 0.005, width, height, centerLat, centerLng, zoomLevel, panOffset);
      ctx.fillStyle = 'rgba(147, 197, 253, 0.6)';
      ctx.font = `600 ${Math.max(10, 12 * zoomLevel)}px Cairo`;
      ctx.textAlign = 'center';
      ctx.fillText(selectedCityId === 'basra' ? '~ شط العرب ~' : selectedCityId === 'erbil' ? '~ وادي أربيل ~' : '~ نهر دجلة الخالد ~', riverMid.x + 25, riverMid.y);
      ctx.restore();

      // Draw City Road Grid & Highway Rings (شارع المطار، شارع فلسطين، 14 رمضان، طريق 100 متري)
      ctx.save();
      const roads = [
        // Ring 1
        { from: { lat: centerLat + 0.05, lng: centerLng - 0.06 }, to: { lat: centerLat + 0.05, lng: centerLng + 0.06 }, major: true, name: 'شارع 14 رمضان' },
        { from: { lat: centerLat - 0.04, lng: centerLng - 0.07 }, to: { lat: centerLat - 0.04, lng: centerLng + 0.07 }, major: true, name: 'شارع الكرادة داخل' },
        { from: { lat: centerLat - 0.07, lng: centerLng - 0.08 }, to: { lat: centerLat + 0.07, lng: centerLng - 0.08 }, major: true, name: 'طريق المطار السريع' },
        { from: { lat: centerLat - 0.07, lng: centerLng + 0.05 }, to: { lat: centerLat + 0.07, lng: centerLng + 0.05 }, major: true, name: 'شارع فلسطين السريع' },
        // Secondary Grid Lines
        { from: { lat: centerLat + 0.025, lng: centerLng - 0.09 }, to: { lat: centerLat + 0.025, lng: centerLng + 0.09 }, major: false },
        { from: { lat: centerLat - 0.015, lng: centerLng - 0.09 }, to: { lat: centerLat - 0.015, lng: centerLng + 0.09 }, major: false },
        { from: { lat: centerLat - 0.08, lng: centerLng - 0.03 }, to: { lat: centerLat + 0.08, lng: centerLng - 0.03 }, major: false },
        { from: { lat: centerLat - 0.08, lng: centerLng + 0.015 }, to: { lat: centerLat + 0.08, lng: centerLng + 0.015 }, major: false },
        // Diagonal Highways
        { from: { lat: centerLat - 0.06, lng: centerLng - 0.06 }, to: { lat: centerLat + 0.06, lng: centerLng + 0.06 }, major: true, name: 'سريع القناة' },
        { from: { lat: centerLat + 0.06, lng: centerLng - 0.06 }, to: { lat: centerLat - 0.06, lng: centerLng + 0.06 }, major: true, name: 'شارع دمشق' }
      ];

      roads.forEach(road => {
        const pA = projectCoords(road.from.lat, road.from.lng, width, height, centerLat, centerLng, zoomLevel, panOffset);
        const pB = projectCoords(road.to.lat, road.to.lng, width, height, centerLat, centerLng, zoomLevel, panOffset);

        ctx.beginPath();
        ctx.moveTo(pA.x, pA.y);
        ctx.lineTo(pB.x, pB.y);

        if (road.major) {
          ctx.strokeStyle = '#1e293b';
          ctx.lineWidth = 9 * zoomLevel;
          ctx.stroke();

          // Inner road line
          ctx.beginPath();
          ctx.moveTo(pA.x, pA.y);
          ctx.lineTo(pB.x, pB.y);
          ctx.strokeStyle = '#334155';
          ctx.lineWidth = 5 * zoomLevel;
          ctx.stroke();

          // Traffic overlay
          if (trafficActive) {
            ctx.beginPath();
            ctx.moveTo(pA.x, pA.y);
            ctx.lineTo(pB.x, pB.y);
            // subtle alternating green & moderate amber traffic
            ctx.strokeStyle = (road.from.lat > centerLat) ? 'rgba(34, 197, 94, 0.4)' : 'rgba(234, 179, 8, 0.45)';
            ctx.lineWidth = 2.5 * zoomLevel;
            ctx.stroke();
          }
        } else {
          ctx.strokeStyle = 'rgba(30, 41, 59, 0.6)';
          ctx.lineWidth = 3.5 * zoomLevel;
          ctx.stroke();
        }
      });
      ctx.restore();

      // Draw Bridges across river
      ctx.save();
      const bridges = [
        { lat: centerLat + 0.03, lng: centerLng - 0.015, name: 'جسر 14 رمضان' },
        { lat: centerLat + 0.005, lng: centerLng + 0.008, name: 'جسر الصرافية' },
        { lat: centerLat - 0.02, lng: centerLng + 0.025, name: 'جسر الجادرية' }
      ];
      bridges.forEach(b => {
        const bp = projectCoords(b.lat, b.lng, width, height, centerLat, centerLng, zoomLevel, panOffset);
        ctx.fillStyle = '#475569';
        ctx.fillRect(bp.x - 14 * zoomLevel, bp.y - 4 * zoomLevel, 28 * zoomLevel, 8 * zoomLevel);
        ctx.fillStyle = '#94a3b8';
        ctx.font = `500 ${Math.max(9, 10 * zoomLevel)}px Cairo`;
        ctx.textAlign = 'center';
        ctx.fillText(b.name, bp.x, bp.y - 8);
      });
      ctx.restore();

      // Draw Surge Heatmaps
      if (showSurgeHeatmap) {
        ctx.save();
        surgeZones
          .filter(sz => sz.cityId === selectedCityId)
          .forEach(sz => {
            const center = projectCoords(sz.lat, sz.lng, width, height, centerLat, centerLng, zoomLevel, panOffset);
            const radius = sz.radiusKm * 18 * zoomLevel;

            // Radial gradient glow
            const grad = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, radius);
            if (sz.multiplier >= 1.5) {
              grad.addColorStop(0, 'rgba(239, 68, 68, 0.45)');
              grad.addColorStop(0.7, 'rgba(249, 115, 22, 0.2)');
              grad.addColorStop(1, 'rgba(239, 68, 68, 0)');
            } else {
              grad.addColorStop(0, 'rgba(245, 158, 11, 0.35)');
              grad.addColorStop(0.7, 'rgba(234, 179, 8, 0.15)');
              grad.addColorStop(1, 'rgba(245, 158, 11, 0)');
            }

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(center.x, center.y, radius, 0, Math.PI * 2);
            ctx.fill();

            // Badge text
            ctx.fillStyle = sz.multiplier >= 1.5 ? '#fca5a5' : '#fde047';
            ctx.font = `bold ${Math.max(10, 11 * zoomLevel)}px Cairo`;
            ctx.textAlign = 'center';
            ctx.fillText(`🔥 ${sz.zoneName} (${sz.multiplier}x)`, center.x, center.y - radius * 0.4);
          });
        ctx.restore();
      }

      // Draw Trip Route Polyline if trip or pickup/dropoff active
      const activePickup = currentTrip ? currentTrip.pickup : pickupPoint;
      const activeDropoff = currentTrip ? currentTrip.dropoff : dropoffPoint;

      if (activePickup && activeDropoff) {
        ctx.save();
        const pStart = projectCoords(activePickup.lat, activePickup.lng, width, height, centerLat, centerLng, zoomLevel, panOffset);
        const pEnd = projectCoords(activeDropoff.lat, activeDropoff.lng, width, height, centerLat, centerLng, zoomLevel, panOffset);

        // Control point for smooth curved route
        const midLat = (activePickup.lat + activeDropoff.lat) / 2 + 0.005;
        const midLng = (activePickup.lng + activeDropoff.lng) / 2 - 0.005;
        const pMid = projectCoords(midLat, midLng, width, height, centerLat, centerLng, zoomLevel, panOffset);

        // Outer glow
        ctx.beginPath();
        ctx.moveTo(pStart.x, pStart.y);
        ctx.quadraticCurveTo(pMid.x, pMid.y, pEnd.x, pEnd.y);
        ctx.strokeStyle = 'rgba(245, 158, 11, 0.3)';
        ctx.lineWidth = 10 * zoomLevel;
        ctx.stroke();

        // Inner solid route line
        ctx.beginPath();
        ctx.moveTo(pStart.x, pStart.y);
        ctx.quadraticCurveTo(pMid.x, pMid.y, pEnd.x, pEnd.y);
        ctx.strokeStyle = '#f59e0b'; // Amber Gold
        ctx.lineWidth = 4 * zoomLevel;
        ctx.setLineDash([8, 6]);
        ctx.lineDashOffset = (Date.now() / 80) % 14;
        ctx.stroke();
        ctx.setLineDash([]);

        // If trip is in progress, draw current moving car position
        if (currentTrip && (currentTrip.status === 'trip_in_progress' || currentTrip.status === 'driver_arriving')) {
          const progressRatio = (currentTrip.progressPercent || 20) / 100;
          // compute quadratic curve point at t = progressRatio
          const t = progressRatio;
          const currX = (1 - t) * (1 - t) * pStart.x + 2 * (1 - t) * t * pMid.x + t * t * pEnd.x;
          const currY = (1 - t) * (1 - t) * pStart.y + 2 * (1 - t) * t * pMid.y + t * t * pEnd.y;

          // Pulse ring around active car
          ctx.beginPath();
          ctx.arc(currX, currY, (14 + Math.sin(Date.now() / 200) * 3) * zoomLevel, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(245, 158, 11, 0.35)';
          ctx.fill();

          // Active car pill
          ctx.beginPath();
          ctx.arc(currX, currY, 9 * zoomLevel, 0, Math.PI * 2);
          ctx.fillStyle = '#f59e0b';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Text label
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 11px Cairo';
          ctx.textAlign = 'center';
          ctx.fillText(`🚕 كابتن في الطريق (${currentTrip.progressPercent}%)`, currX, currY - 14);
        }

        ctx.restore();
      }

      // Draw Iraqi Landmarks on Map
      cityLandmarks.forEach(lm => {
        const pt = projectCoords(lm.lat, lm.lng, width, height, centerLat, centerLng, zoomLevel, panOffset);
        const isPickup = activePickup?.id === lm.id;
        const isDropoff = activeDropoff?.id === lm.id;

        ctx.save();
        if (isPickup) {
          // Pickup Marker (Green Glow)
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 14 * zoomLevel, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(34, 197, 94, 0.3)';
          ctx.fill();

          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 7 * zoomLevel, 0, Math.PI * 2);
          ctx.fillStyle = '#22c55e';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Label
          ctx.fillStyle = '#22c55e';
          ctx.font = 'bold 12px Cairo';
          ctx.textAlign = 'center';
          ctx.fillText(`📍 نقطة الانطلاق: ${lm.name.split(' - ')[0]}`, pt.x, pt.y - 12);
        } else if (isDropoff) {
          // Dropoff Marker (Red/Amber Glow)
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 14 * zoomLevel, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(239, 68, 68, 0.3)';
          ctx.fill();

          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 7 * zoomLevel, 0, Math.PI * 2);
          ctx.fillStyle = '#ef4444';
          ctx.fill();
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Label
          ctx.fillStyle = '#ef4444';
          ctx.font = 'bold 12px Cairo';
          ctx.textAlign = 'center';
          ctx.fillText(`🏁 الوجهة: ${lm.name.split(' - ')[0]}`, pt.x, pt.y - 12);
        } else {
          // Standard Landmark Node
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, 4 * zoomLevel, 0, Math.PI * 2);
          ctx.fillStyle = '#64748b';
          ctx.fill();

          ctx.fillStyle = 'rgba(203, 213, 225, 0.75)';
          ctx.font = `${Math.max(9, 11 * zoomLevel)}px Cairo`;
          ctx.textAlign = 'center';
          ctx.fillText(lm.name.split(' - ')[0], pt.x, pt.y - 8);
        }
        ctx.restore();
      });

      // Draw Live Drivers Fleet
      if (showFleetFleetAll) {
        driversList
          .filter(d => d.cityId === selectedCityId && d.isOnline)
          .forEach(drv => {
            const dPt = projectCoords(
              drv.currentLocation.lat,
              drv.currentLocation.lng,
              width,
              height,
              centerLat,
              centerLng,
              zoomLevel,
              panOffset
            );

            ctx.save();
            ctx.translate(dPt.x, dPt.y);
            ctx.rotate((drv.heading * Math.PI) / 180);

            // Car body shadow
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.beginPath();
            ctx.roundRect(-6 * zoomLevel, -10 * zoomLevel, 12 * zoomLevel, 20 * zoomLevel, 3);
            ctx.fill();

            // Car body
            ctx.fillStyle = drv.car.tier === 'comfort_vip' ? '#1e293b' : drv.car.tier === 'women_taxi' ? '#ec4899' : '#f59e0b';
            ctx.beginPath();
            ctx.roundRect(-5 * zoomLevel, -9 * zoomLevel, 10 * zoomLevel, 18 * zoomLevel, 3);
            ctx.fill();

            // Headlights beam
            ctx.fillStyle = 'rgba(254, 240, 138, 0.4)';
            ctx.beginPath();
            ctx.moveTo(-4 * zoomLevel, -9 * zoomLevel);
            ctx.lineTo(-8 * zoomLevel, -22 * zoomLevel);
            ctx.lineTo(8 * zoomLevel, -22 * zoomLevel);
            ctx.lineTo(4 * zoomLevel, -9 * zoomLevel);
            ctx.fill();

            // Windshield
            ctx.fillStyle = '#0f172a';
            ctx.fillRect(-3 * zoomLevel, -5 * zoomLevel, 6 * zoomLevel, 4 * zoomLevel);

            ctx.restore();
          });
      }

      animationFrameId = requestAnimationFrame(render);
    };

    // Set canvas dimensions to parent bounding rect
    const handleResize = () => {
      if (containerRef.current && canvas) {
        canvas.width = containerRef.current.clientWidth;
        canvas.height = containerRef.current.clientHeight;
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [
    selectedCityId,
    city,
    cityLandmarks,
    zoomLevel,
    panOffset,
    mapStyle,
    trafficActive,
    showSurgeHeatmap,
    showFleetFleetAll,
    pickupPoint,
    dropoffPoint,
    currentTrip,
    driversList,
    surgeZones
  ]);

  // Click on map to select nearest landmark
  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!interactiveSelection || !canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const width = canvasRef.current.width;
    const height = canvasRef.current.height;
    const centerLat = city.center.lat;
    const centerLng = city.center.lng;

    // Find closest landmark
    let closestLandmark: LandmarkPoint | null = null;
    let minDistance = 999999;

    cityLandmarks.forEach(lm => {
      const pt = projectCoords(lm.lat, lm.lng, width, height, centerLat, centerLng, zoomLevel, panOffset);
      const dist = Math.hypot(pt.x - clickX, pt.y - clickY);
      if (dist < minDistance) {
        minDistance = dist;
        closestLandmark = lm;
      }
    });

    if (closestLandmark && minDistance < 40) {
      if (onLandmarkClick) {
        onLandmarkClick(closestLandmark);
      } else {
        if (!pickupPoint) {
          setPickupPoint(closestLandmark);
        } else if (!dropoffPoint || dropoffPoint.id === pickupPoint.id) {
          setDropoffPoint(closestLandmark);
        } else {
          setDropoffPoint(closestLandmark);
        }
      }
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  return (
    <div
      ref={containerRef}
      id="iraqi-map-container"
      className={`relative w-full ${heightClass} bg-slate-950 overflow-hidden select-none`}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <canvas
        ref={canvasRef}
        id="iraqi-map-canvas"
        className="w-full h-full cursor-grab active:cursor-grabbing block"
        onClick={handleCanvasClick}
      />

      {/* Floating Map Controls & Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-2 pointer-events-auto">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-1.5 flex flex-col gap-1 shadow-xl">
          <button
            id="map-zoom-in-btn"
            title="تكبير الخريطة"
            onClick={() => setZoomLevel(prev => Math.min(2.5, prev + 0.25))}
            className="p-2 hover:bg-slate-800 text-slate-200 rounded-lg transition-colors flex items-center justify-center"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            id="map-zoom-out-btn"
            title="تصغير الخريطة"
            onClick={() => setZoomLevel(prev => Math.max(0.6, prev - 0.25))}
            className="p-2 hover:bg-slate-800 text-slate-200 rounded-lg transition-colors flex items-center justify-center"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            id="map-recenter-btn"
            title="إعادة التمركز"
            onClick={() => {
              setPanOffset({ x: 0, y: 0 });
              setZoomLevel(1);
            }}
            className="p-2 hover:bg-slate-800 text-amber-400 rounded-lg transition-colors flex items-center justify-center"
          >
            <Compass className="w-4 h-4" />
          </button>
        </div>

        {/* Layer style toggle */}
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-1.5 flex flex-col gap-1 shadow-xl">
          <button
            id="map-style-toggle-btn"
            title="نمط الخريطة"
            onClick={() =>
              setMapStyle(prev => (prev === 'night' ? 'navigation' : prev === 'navigation' ? 'satellite' : 'night'))
            }
            className="p-2 hover:bg-slate-800 text-slate-300 rounded-lg transition-colors flex items-center justify-center"
          >
            <Layers className="w-4 h-4" />
          </button>
          <button
            id="map-traffic-toggle-btn"
            title="طبقة الازدحامات والسيطرات"
            onClick={() => setTrafficActive(prev => !prev)}
            className={`p-2 rounded-lg transition-colors flex items-center justify-center ${
              trafficActive ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/60' : 'text-slate-400 hover:bg-slate-800'
            }`}
          >
            <Navigation className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* City & Live Status Pill */}
      <div className="absolute top-3 right-3 z-10 pointer-events-auto flex items-center gap-2">
        <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800/80 rounded-xl px-3.5 py-1.5 shadow-xl flex items-center gap-2.5">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-slate-200">{city.nameAr}</span>
            <span className="text-[10px] text-slate-400">
              {driversList.filter(d => d.cityId === selectedCityId && d.isOnline).length} كابتن متاح الآن
            </span>
          </div>
        </div>
      </div>

      {/* Iraqi Live Traffic Bar Indicator */}
      <div className="absolute bottom-3 left-3 right-3 z-10 pointer-events-none flex justify-between items-center">
        <div className="bg-slate-950/80 backdrop-blur-md border border-slate-800/80 rounded-xl px-3 py-1.5 text-[11px] text-slate-300 flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>طرق سالكة</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>حركة متوسطة</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            <span>ازدحام سيطرات وجسور</span>
          </div>
        </div>

        {interactiveSelection && !currentTrip && (
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-300 backdrop-blur-md rounded-xl px-3 py-1.5 text-[11px] font-medium hidden sm:flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span>انقر على أي نقطة لاختيار نقطة الانطلاق أو الوجهة</span>
          </div>
        )}
      </div>
    </div>
  );
};
