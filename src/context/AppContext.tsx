import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import {
  AppRole,
  IraqiCityId,
  Driver,
  Trip,
  LandmarkPoint,
  RideTierId,
  PaymentMethodType,
  SupportTicket,
  SurgeZone,
  NotificationItem,
  DriverDispatchOffer
} from '../types';
import { IRAQI_CITIES, IRAQI_LANDMARKS, RIDE_TIERS, INITIAL_SURGE_ZONES } from '../data/iraqLocations';
import { INITIAL_DRIVERS, INITIAL_SUPPORT_TICKETS, INITIAL_PAST_TRIPS } from '../data/mockData';
import confetti from 'canvas-confetti';
import { IraqRideApi } from '../services/api';
import {
  syncTripToFirebase,
  setDriverLiveLocationRtdb,
  setActiveTripRtdb,
  pushTripBreadcrumbRtdb,
  sendTripFcmNotification,
  recordPaymentInFirestore
} from '../services/firebase';

interface AppContextType {
  role: AppRole;
  setRole: (role: AppRole) => void;
  currentRole: AppRole;
  setCurrentRole: (role: AppRole) => void;
  selectedCityId: IraqiCityId;
  setSelectedCityId: (cityId: IraqiCityId) => void;
  
  // Passenger State
  passengerWalletIQD: number;
  setPassengerWalletIQD: React.Dispatch<React.SetStateAction<number>>;
  topUpPassengerWallet: (amountIQD: number, method: string) => void;
  currentTrip: Trip | null;
  setCurrentTrip: React.Dispatch<React.SetStateAction<Trip | null>>;
  pickupPoint: LandmarkPoint | null;
  setPickupPoint: (point: LandmarkPoint | null) => void;
  dropoffPoint: LandmarkPoint | null;
  setDropoffPoint: (point: LandmarkPoint | null) => void;
  selectedTier: RideTierId;
  setSelectedTier: (tier: RideTierId) => void;
  selectedPaymentMethod: PaymentMethodType;
  setSelectedPaymentMethod: (method: PaymentMethodType) => void;
  promoCode: string;
  setPromoCode: (code: string) => void;
  discountAmountIQD: number;
  applyPromoCode: (code: string) => boolean;
  requestRide: (notes?: string) => void;
  cancelTrip: () => void;
  rateTrip: (rating: number, comment: string, tipIQD?: number) => void;
  
  // Driver State
  activeDriver: Driver;
  driversList: Driver[];
  toggleDriverOnline: () => void;
  acceptTripAsDriver: () => void;
  rejectTripAsDriver: () => void;
  incomingDriverRequest: Trip | null;
  incomingDriverOffer: DriverDispatchOffer | null;
  activeOfferRemainingSeconds: number;
  tripRequestsQueue: DriverDispatchOffer[];
  acceptOfferFromQueue: (rideId: string) => Promise<void>;
  rejectOfferFromQueue: (rideId: string, reason?: string) => Promise<void>;
  passengerVerificationPin: string;
  verifyPassengerPin: (enteredPin: string) => boolean;
  driverArrivalDetected: boolean;
  confirmDriverArrivalAtPickup: () => void;
  simulateDriverAcceptanceForDemo: () => void;
  advanceDriverTripStep: () => void;
  withdrawDriverWallet: (amountIQD: number, method: string) => void;

  // Admin & Dispatcher State
  pastTrips: Trip[];
  surgeZones: SurgeZone[];
  updateSurgeZoneMultiplier: (zoneId: string, multiplier: number) => void;
  supportTickets: SupportTicket[];
  addSupportMessage: (ticketId: string, text: string, sender: 'user' | 'agent') => void;
  createNewTicket: (subject: string, message: string, priority?: 'low' | 'medium' | 'high' | 'urgent') => void;
  resolveTicket: (ticketId: string) => void;
  createManualDispatchedTrip: (pickup: LandmarkPoint, dropoff: LandmarkPoint, passengerName: string, phone: string, tier: RideTierId) => void;
  
  // Audio & Notification
  notifications: NotificationItem[];
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  playAudioCue: (type: 'beep' | 'success' | 'alert' | 'ding') => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Web Audio synthesizer for crisp sound effects
const playSynthesizerTone = (type: 'beep' | 'success' | 'alert' | 'ding') => {
  try {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    if (type === 'beep') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(1200, now + 0.15);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 'success') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.setValueAtTime(659.25, now + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, now + 0.2); // G5
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
      osc.start(now);
      osc.stop(now + 0.4);
    } else if (type === 'alert') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.setValueAtTime(880, now + 0.1);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.25);
    } else if (type === 'ding') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(987.77, now); // B5
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc.start(now);
      osc.stop(now + 0.5);
    }
  } catch {
    // Audio might be blocked before first user interaction
  }
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<AppRole>('passenger');
  const [selectedCityId, setSelectedCityId] = useState<IraqiCityId>('baghdad');
  
  // Passenger state
  const [passengerWalletIQD, setPassengerWalletIQD] = useState<number>(35000);
  const [pickupPoint, setPickupPoint] = useState<LandmarkPoint | null>(IRAQI_LANDMARKS[0]); // مول المنصور
  const [dropoffPoint, setDropoffPoint] = useState<LandmarkPoint | null>(IRAQI_LANDMARKS[1]); // الكرادة داخل
  const [selectedTier, setSelectedTier] = useState<RideTierId>('economy');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethodType>('cash');
  const [promoCode, setPromoCode] = useState<string>('');
  const [discountAmountIQD, setDiscountAmountIQD] = useState<number>(0);
  const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);

  // Driver state
  const [driversList, setDriversList] = useState<Driver[]>(INITIAL_DRIVERS);
  const [activeDriver, setActiveDriver] = useState<Driver>(INITIAL_DRIVERS[0]);
  const [incomingDriverRequest, setIncomingDriverRequest] = useState<Trip | null>(null);
  const [incomingDriverOffer, setIncomingDriverOffer] = useState<DriverDispatchOffer | null>(null);
  const [activeOfferRemainingSeconds, setActiveOfferRemainingSeconds] = useState<number>(15);
  const [tripRequestsQueue, setTripRequestsQueue] = useState<DriverDispatchOffer[]>([]);
  const [passengerVerificationPin, setPassengerVerificationPin] = useState<string>('5821');
  const [driverArrivalDetected, setDriverArrivalDetected] = useState<boolean>(false);

  // WebSocket ref to keep live connection across component re-renders
  const wsRef = useRef<WebSocket | null>(null);

  // Admin & Dispatcher
  const [pastTrips, setPastTrips] = useState<Trip[]>(INITIAL_PAST_TRIPS);
  const [surgeZones, setSurgeZones] = useState<SurgeZone[]>(INITIAL_SURGE_ZONES);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>(INITIAL_SUPPORT_TICKETS);
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 'notif-1',
      title: 'مرحباً بك في منصة دانيال (DANIEL) 🚕',
      message: 'استخدم كود BAGHDAD للحصول على خصم 2,000 د.ع على أول مشوارين لك!',
      time: 'الآن',
      type: 'ride',
      read: false
    }
  ]);

  const playAudioCue = useCallback((type: 'beep' | 'success' | 'alert' | 'ding') => {
    playSynthesizerTone(type);
  }, []);

  // Fetch initial drivers from server DB on mount
  useEffect(() => {
    fetch('/api/drivers')
      .then(res => res.json())
      .then(data => {
        const list = Array.isArray(data) ? data : (data?.drivers || []);
        if (list && list.length > 0) {
          setDriversList(list);
          const found = list.find((d: any) => d.id === activeDriver.id) || list[0];
          if (found) setActiveDriver(found);
        }
      })
      .catch(e => console.warn('Could not fetch server drivers:', e));
  }, []);

  // Countdown timer for active driver offer and request queue
  useEffect(() => {
    if (!incomingDriverOffer) return;
    const interval = setInterval(() => {
      setActiveOfferRemainingSeconds(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          IraqRideApi.rejectRide(incomingDriverOffer.rideId, activeDriver.id, 'timeout')
            .catch(e => console.error('Reject timeout notice:', e));
          setIncomingDriverOffer(null);
          setIncomingDriverRequest(null);
          setTripRequestsQueue(q => q.filter(o => o.rideId !== incomingDriverOffer.rideId));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [incomingDriverOffer, activeDriver.id]);

  // Periodic expiration cleaner for trip requests queue
  useEffect(() => {
    const queueCleaner = setInterval(() => {
      const now = Date.now();
      setTripRequestsQueue(prev => prev.filter(o => now - o.timestamp < 18000));
    }, 1000);
    return () => clearInterval(queueCleaner);
  }, []);

  // Check arrival detection when driver gets close to pickup point (within ~150 meters)
  useEffect(() => {
    if (currentTrip && (currentTrip.status === 'driver_assigned' || currentTrip.status === 'driver_arriving')) {
      const dLat = (activeDriver.currentLocation.lat - currentTrip.pickup.lat) * 111;
      const dLng = (activeDriver.currentLocation.lng - currentTrip.pickup.lng) * 93;
      const distMeters = Math.hypot(dLat, dLng) * 1000;
      if (distMeters <= 150) {
        setDriverArrivalDetected(true);
      }
    } else {
      setDriverArrivalDetected(false);
    }
  }, [activeDriver.currentLocation, currentTrip?.status, currentTrip?.pickup]);

  // Update default landmarks when city changes
  useEffect(() => {
    const cityLandmarks = IRAQI_LANDMARKS.filter(lm => lm.cityId === selectedCityId);
    if (cityLandmarks.length >= 2) {
      setPickupPoint(cityLandmarks[0]);
      setDropoffPoint(cityLandmarks[1]);
    } else if (cityLandmarks.length === 1) {
      setPickupPoint(cityLandmarks[0]);
      setDropoffPoint(null);
    }
  }, [selectedCityId]);

  // Re-register with server when role, driver, or active trip changes
  useEffect(() => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: 'REGISTER',
        payload: {
          role,
          driverId: activeDriver.id,
          rideId: currentTrip?.id
        }
      }));
    }
  }, [role, activeDriver.id, currentTrip?.id]);

  // Live WebSocket Connection for Real GPS & Dispatch Event Streaming
  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    function connectWs() {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          ws?.send(JSON.stringify({
            type: 'REGISTER',
            payload: { role, driverId: activeDriver.id, rideId: currentTrip?.id }
          }));
        };

        ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === 'DRIVER_LOCATION_CHANGED') {
              const { driverId, location, heading } = msg.payload;
              setDriversList(prev =>
                prev.map(d => (d.id === driverId ? { ...d, currentLocation: location, heading } : d))
              );
            } else if (msg.type === 'RIDE_OFFER_TO_DRIVER') {
              const offer = msg.payload as DriverDispatchOffer;
              setIncomingDriverOffer(offer);
              setActiveOfferRemainingSeconds(offer.countdownSeconds || 15);
              setTripRequestsQueue(prev => {
                const filtered = prev.filter(o => o.rideId !== offer.rideId);
                return [offer, ...filtered];
              });

              const matchedDriver = driversList.find(d => d.id === offer.driverId) || activeDriver;
              setIncomingDriverRequest({
                id: offer.rideId,
                passengerName: offer.passengerName,
                passengerPhone: offer.passengerPhone || '+964 770 000 0000',
                passengerRating: offer.passengerRating,
                cityId: selectedCityId,
                pickup: {
                  id: 'pk-offer',
                  name: offer.pickup.name,
                  district: offer.pickup.district,
                  cityId: selectedCityId,
                  category: 'landmark',
                  lat: offer.pickup.lat,
                  lng: offer.pickup.lng
                },
                dropoff: {
                  id: 'dp-offer',
                  name: offer.dropoff.name,
                  district: offer.dropoff.district,
                  cityId: selectedCityId,
                  category: 'landmark',
                  lat: offer.dropoff.lat,
                  lng: offer.dropoff.lng
                },
                tier: (offer.tier as RideTierId) || 'economy',
                status: 'searching_driver',
                estimatedDistanceKm: offer.distanceKm,
                estimatedDurationMins: offer.durationMins,
                basePriceIQD: 1500,
                surgeMultiplier: offer.surgeMultiplier || 1.0,
                totalPriceIQD: offer.totalPriceIQD,
                paymentMethod: 'cash',
                driverId: offer.driverId,
                driver: matchedDriver,
                createdAt: offer.timestamp,
                progressPercent: 0
              });

              playAudioCue('alert');
              setNotifications(prev => [
                {
                  id: `notif-offer-${Date.now()}`,
                  title: 'طلب مشوار جديد من Daniel Dispatch!',
                  message: `من ${offer.passengerName} - صافي الأرباح: ${offer.fareIQD.toLocaleString()} د.ع`,
                  time: 'الآن',
                  type: 'ride',
                  read: false
                },
                ...prev
              ]);
            } else if (msg.type === 'RIDE_REQUESTED') {
              // STEP 7: Dispatch offer ONLY to nearby drivers within 15 km
              const { ride } = msg.payload;
              if (ride && activeDriver.isOnline) {
                const distKm = Math.round(Math.hypot((activeDriver.currentLocation.lat - ride.pickup.lat) * 111, (activeDriver.currentLocation.lng - ride.pickup.lng) * 93) * 10) / 10;
                if (distKm <= 15) {
                  const newOffer: DriverDispatchOffer = {
                    rideId: ride.id,
                    driverId: activeDriver.id,
                    pickup: ride.pickup,
                    dropoff: ride.dropoff,
                    distanceKm: ride.estimatedDistanceKm || 4.2,
                    durationMins: ride.estimatedDurationMins || 14,
                    timeToPickupMins: Math.max(2, Math.round(distKm * 2.2)),
                    fareIQD: ride.driverEarningsIQD || Math.round((ride.totalPriceIQD || 6000) * 0.85),
                    totalPriceIQD: ride.totalPriceIQD || 6000,
                    passengerName: ride.passengerName || 'زبون دانيال',
                    passengerPhone: ride.passengerPhone || '07701234999',
                    passengerRating: ride.passengerRating || 4.95,
                    tier: ride.tier || 'economy',
                    surgeMultiplier: ride.surgeMultiplier || 1.0,
                    countdownSeconds: 15,
                    timestamp: Date.now()
                  };

                  setTripRequestsQueue(prev => {
                    if (prev.some(o => o.rideId === ride.id)) return prev;
                    return [newOffer, ...prev];
                  });

                  if (!incomingDriverOffer) {
                    setIncomingDriverOffer(newOffer);
                    setActiveOfferRemainingSeconds(15);
                  }
                  playAudioCue('alert');
                }
              }
            } else if (msg.type === 'RIDE_OFFER_CLAIMED') {
              // STEP 7: Immediately remove claimed trip from all other drivers' views
              const { rideId, acceptedDriverId } = msg.payload;
              setTripRequestsQueue(q => q.filter(o => o.rideId !== rideId));
              if (activeDriver.id !== acceptedDriverId) {
                setIncomingDriverOffer(curr => (curr?.rideId === rideId ? null : curr));
                setIncomingDriverRequest(curr => (curr?.id === rideId ? null : curr));
              }
            } else if (msg.type === 'RIDE_ACCEPTED_BY_DRIVER') {
              const { ride, driverId } = msg.payload;
              setTripRequestsQueue(q => q.filter(o => o.rideId !== (ride?.id || '')));
              if (activeDriver.id !== driverId) {
                setIncomingDriverOffer(curr => (curr?.rideId === ride?.id ? null : curr));
                setIncomingDriverRequest(curr => (curr?.id === ride?.id ? null : curr));
              }

              const assignedDriver = driversList.find(d => d.id === driverId) || activeDriver;
              setCurrentTrip(prev => {
                if (!prev) return null;
                return {
                  ...prev,
                  id: ride?.id || prev.id,
                  status: 'driver_assigned',
                  driverId,
                  driver: assignedDriver,
                  currentCoords: {
                    lat: prev.pickup.lat + 0.003,
                    lng: prev.pickup.lng + 0.003
                  }
                };
              });
              playAudioCue('success');
            } else if (msg.type === 'RIDE_NO_DRIVER_FOUND') {
              setIncomingDriverOffer(null);
              setIncomingDriverRequest(null);
              setCurrentTrip(prev => (prev ? { ...prev, status: 'no_driver_found' } : null));
              playAudioCue('alert');
            } else if (msg.type === 'RIDE_UPDATED' || msg.type === 'RIDE_STATUS_UPDATED') {
              const serverRide = msg.payload.ride;
              if (serverRide && currentTrip && (currentTrip.id === serverRide.id || currentTrip.id.startsWith('TRP-'))) {
                const mappedStatus = serverRide.status.toLowerCase();
                const matchedDriver = serverRide.driverId
                  ? driversList.find(d => d.id === serverRide.driverId) || activeDriver
                  : undefined;

                setCurrentTrip(prev => (prev ? {
                  ...prev,
                  status: mappedStatus as any,
                  driverId: serverRide.driverId || prev.driverId,
                  driver: matchedDriver || prev.driver
                } : null));
              }
            }
          } catch (e) {
            console.error('Error handling WS event:', e);
          }
        };

        ws.onclose = () => {
          reconnectTimeout = setTimeout(connectWs, 3000);
        };
      } catch (err) {
        console.warn('WS connection notice:', err);
      }
    }

    connectWs();
    return () => {
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [role, activeDriver.id, currentTrip?.id, driversList, selectedCityId, playAudioCue]);

  // Telemetry ticker: simulate driver positions subtly wandering or moving
  useEffect(() => {
    const interval = setInterval(() => {
      setDriversList(prev =>
        prev.map(drv => {
          if (!drv.isOnline) return drv;
          // small random drift
          const dLat = (Math.random() - 0.5) * 0.0004;
          const dLng = (Math.random() - 0.5) * 0.0004;
          return {
            ...drv,
            currentLocation: {
              lat: drv.currentLocation.lat + dLat,
              lng: drv.currentLocation.lng + dLng
            },
            heading: (drv.heading + (Math.random() - 0.5) * 20 + 360) % 360
          };
        })
      );
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Real-time trip simulation engine
  useEffect(() => {
    if (!currentTrip) return;

    // Searching driver: real Dispatch Engine matches candidate drivers and broadcasts offer via WebSocket
    if (currentTrip.status === 'searching_driver') {
      const matchTimer = setTimeout(() => {
        setCurrentTrip(prev => {
          if (!prev || prev.status !== 'searching_driver') return prev;
          const candidate = prev.driver || driversList.find(d => d.isOnline) || driversList[0];
          playAudioCue('success');
          const acceptedTrip: Trip = {
            ...prev,
            status: 'driver_assigned',
            driver: candidate,
            driverId: candidate.id
          };
          if (acceptedTrip.id && !acceptedTrip.id.startsWith('trip-local-')) {
            IraqRideApi.acceptRide(acceptedTrip.id, candidate.id).catch(err =>
              console.warn('Sync server ride accept:', err)
            );
          }
          return acceptedTrip;
        });
      }, 3500);
      return () => clearTimeout(matchTimer);
    }

    // Driver assigned -> Driver arriving
    if (currentTrip.status === 'driver_assigned') {
      sendTripFcmNotification('DRIVER_ACCEPTED', {
        tripId: currentTrip.id,
        driverName: currentTrip.driver?.name || 'الكابتن',
        passengerName: currentTrip.passengerName,
        fareIQD: currentTrip.totalPriceIQD,
        targetUserId: currentTrip.passengerName
      });
      syncTripToFirebase(currentTrip);
      setActiveTripRtdb(currentTrip.id, currentTrip);

      const arriveTimer = setTimeout(() => {
        setCurrentTrip(prev => {
          if (!prev) return null;
          const updated = { ...prev, status: 'driver_arriving' as const, progressPercent: 20 };
          sendTripFcmNotification('DRIVER_ARRIVING', {
            tripId: updated.id,
            driverName: updated.driver?.name || 'الكابتن',
            targetUserId: updated.passengerName
          });
          syncTripToFirebase(updated);
          setActiveTripRtdb(updated.id, updated);
          return updated;
        });
        playAudioCue('beep');
      }, 3500);
      return () => clearTimeout(arriveTimer);
    }

    // Driver arriving -> Driver arrived & Trip in progress (STEP 11)
    if (currentTrip.status === 'driver_arriving') {
      sendTripFcmNotification('DRIVER_ARRIVED', {
        tripId: currentTrip.id,
        driverName: currentTrip.driver?.name || 'الكابتن',
        pickupName: currentTrip.pickup.name,
        targetUserId: currentTrip.passengerName
      });

      const startTimer = setTimeout(() => {
        setCurrentTrip(prev => {
          if (!prev) return null;
          const updated = {
            ...prev,
            status: 'trip_in_progress' as const,
            startedAt: Date.now(),
            progressPercent: 30
          };
          sendTripFcmNotification('TRIP_STARTED', {
            tripId: updated.id,
            dropoffName: updated.dropoff.name,
            targetUserId: updated.passengerName
          });
          syncTripToFirebase(updated);
          setActiveTripRtdb(updated.id, updated);
          return updated;
        });
        playAudioCue('success');
      }, 4000);
      return () => clearTimeout(startTimer);
    }

    // Trip in progress -> incrementally advance progress until 100%
    if (currentTrip.status === 'trip_in_progress') {
      const progressInterval = setInterval(() => {
        setCurrentTrip(prev => {
          if (!prev || prev.status !== 'trip_in_progress') return prev;
          const nextPercent = Math.min(100, prev.progressPercent + 15);
          
          // Calculate interpolated lat/lng between pickup and dropoff
          const ratio = nextPercent / 100;
          const currentLat = prev.pickup.lat + (prev.dropoff.lat - prev.pickup.lat) * ratio;
          const currentLng = prev.pickup.lng + (prev.dropoff.lng - prev.pickup.lng) * ratio;

          // Push live GPS breadcrumb to Realtime Database
          pushTripBreadcrumbRtdb(prev.id, {
            lat: currentLat,
            lng: currentLng,
            speed: 42,
            heading: 90
          });
          if (prev.driverId) {
            setDriverLiveLocationRtdb(prev.driverId, {
              lat: currentLat,
              lng: currentLng,
              heading: 90,
              speed: 42,
              isOnline: true
            });
          }

          if (nextPercent >= 100) {
            clearInterval(progressInterval);
            confetti({
              particleCount: 80,
              spread: 70,
              origin: { y: 0.6 }
            });
            playAudioCue('success');

            // Credit driver wallet & platform commission
            const fare = prev.totalPriceIQD;
            const commission = fare * 0.15;
            const driverNet = fare - commission;

            // Record real transaction in Firestore payments collection
            recordPaymentInFirestore({
              tripId: prev.id,
              amountIQD: fare,
              method: prev.paymentMethod,
              driverId: prev.driverId || 'drv_01',
              passengerId: prev.passengerName,
              platformCommissionIQD: commission,
              driverEarningsIQD: driverNet,
              status: 'completed'
            });

            // Dispatch FCM completion notification
            sendTripFcmNotification('TRIP_COMPLETED', {
              tripId: prev.id,
              fareIQD: fare,
              targetUserId: prev.passengerName
            });

            setActiveDriver(d => ({
              ...d,
              walletBalanceIQD: d.walletBalanceIQD + driverNet,
              todayEarningsIQD: d.todayEarningsIQD + driverNet,
              totalTrips: d.totalTrips + 1
            }));

            // If passenger paid with app wallet, deduct
            if (prev.paymentMethod === 'app_wallet') {
              setPassengerWalletIQD(w => Math.max(0, w - fare));
            }

            const completed = {
              ...prev,
              status: 'completed' as const,
              completedAt: Date.now(),
              progressPercent: 100,
              currentCoords: { lat: prev.dropoff.lat, lng: prev.dropoff.lng }
            };

            syncTripToFirebase(completed);
            setActiveTripRtdb(completed.id, completed);
            return completed;
          }

          const progressing = {
            ...prev,
            progressPercent: nextPercent,
            currentCoords: { lat: currentLat, lng: currentLng }
          };
          syncTripToFirebase(progressing);
          return progressing;
        });
      }, 2500);

      return () => clearInterval(progressInterval);
    }
  }, [currentTrip?.status, driversList, playAudioCue]);

  const applyPromoCode = (code: string): boolean => {
    const clean = code.trim().toUpperCase();
    if (clean === 'BAGHDAD' || clean === 'BAGHDAD2026' || clean === 'IRAQ') {
      setDiscountAmountIQD(2000);
      playAudioCue('success');
      return true;
    }
    if (clean === 'ZAINCASH' || clean === 'FASTPAY') {
      setDiscountAmountIQD(1500);
      playAudioCue('success');
      return true;
    }
    setDiscountAmountIQD(0);
    return false;
  };

  const calculateTripEstimate = (pickup: LandmarkPoint, dropoff: LandmarkPoint, tierId: RideTierId) => {
    const tier = RIDE_TIERS.find(t => t.id === tierId) || RIDE_TIERS[0];
    // Approximate distance using Pythagorean/Haversine formula in KM
    const dLat = (dropoff.lat - pickup.lat) * 111;
    const dLng = (dropoff.lng - pickup.lng) * 93;
    const distanceKm = Math.max(1.8, Math.round(Math.sqrt(dLat * dLat + dLng * dLng) * 10) / 10);
    const durationMins = Math.max(5, Math.round(distanceKm * 2.8));

    // Check surge for the pickup area
    const matchingSurge = surgeZones.find(
      sz => sz.cityId === pickup.cityId && Math.hypot((sz.lat - pickup.lat) * 111, (sz.lng - pickup.lng) * 93) <= sz.radiusKm
    );
    const surgeMultiplier = matchingSurge ? matchingSurge.multiplier : 1.0;

    const baseFare = tier.baseFareIQD + (distanceKm * tier.perKmFareIQD) + (durationMins * tier.perMinFareIQD);
    const roundedBase = Math.round(baseFare / 250) * 250;
    const totalWithSurge = Math.round((roundedBase * surgeMultiplier) / 250) * 250;
    const finalPrice = Math.max(2500, totalWithSurge - discountAmountIQD);

    return {
      distanceKm,
      durationMins,
      baseFareIQD: roundedBase,
      surgeMultiplier,
      finalPriceIQD: finalPrice
    };
  };

  const requestRide = async (notes?: string) => {
    if (!pickupPoint || !dropoffPoint) return;

    const { distanceKm, durationMins, baseFareIQD, surgeMultiplier, finalPriceIQD } = calculateTripEstimate(
      pickupPoint,
      dropoffPoint,
      selectedTier
    );

    const newTrip: Trip = {
      id: `TRP-IQ-${Math.floor(1000 + Math.random() * 9000)}`,
      passengerName: 'علي الرافدين',
      passengerPhone: '07712349988',
      passengerRating: 4.95,
      cityId: selectedCityId,
      pickup: pickupPoint,
      dropoff: dropoffPoint,
      tier: selectedTier,
      status: 'searching_driver',
      estimatedDistanceKm: distanceKm,
      estimatedDurationMins: durationMins,
      basePriceIQD: baseFareIQD,
      surgeMultiplier,
      totalPriceIQD: finalPriceIQD,
      paymentMethod: selectedPaymentMethod,
      createdAt: Date.now(),
      progressPercent: 0,
      notesForDriver: notes,
      promoCode: discountAmountIQD > 0 ? promoCode : undefined,
      discountIQD: discountAmountIQD > 0 ? discountAmountIQD : undefined
    };

    setCurrentTrip(newTrip);
    playAudioCue('beep');

    // Sync to Firestore and Realtime Database
    syncTripToFirebase(newTrip);
    setActiveTripRtdb(newTrip.id, newTrip);
    sendTripFcmNotification('REQUESTED', {
      tripId: newTrip.id,
      passengerName: newTrip.passengerName,
      pickupName: newTrip.pickup.name,
      dropoffName: newTrip.dropoff.name,
      fareIQD: newTrip.totalPriceIQD,
      targetUserId: newTrip.passengerName
    });

    // Backend dispatch engine call
    try {
      const serverRide = await IraqRideApi.createRide({
        id: newTrip.id,
        cityId: newTrip.cityId,
        pickup: newTrip.pickup,
        dropoff: newTrip.dropoff,
        tier: newTrip.tier,
        totalPriceIQD: newTrip.totalPriceIQD,
        estimatedDistanceKm: newTrip.estimatedDistanceKm,
        estimatedDurationMins: newTrip.estimatedDurationMins,
        paymentMethod: newTrip.paymentMethod
      });

      if (serverRide && serverRide.id) {
        setCurrentTrip(prev => (prev ? { ...prev, id: serverRide.id } : null));
      }
    } catch (e) {
      console.error('Backend ride create sync notice:', e);
    }

    // Add to notifications
    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        title: 'جاري ترحيل الطلب للبحث عن كابتن...',
        message: `طلب مشوار عبر منصة دانيال من ${pickupPoint.name} إلى ${dropoffPoint.name}`,
        time: 'الآن',
        type: 'ride',
        read: false
      },
      ...prev
    ]);
  };

  const cancelTrip = () => {
    if (!currentTrip) return;
    const cancelledTripId = currentTrip.id;
    const cancelledPassenger = currentTrip.passengerName;

    // Send FCM cancellation
    sendTripFcmNotification('TRIP_CANCELLED', {
      tripId: cancelledTripId,
      passengerName: cancelledPassenger,
      targetUserId: cancelledPassenger
    });
    syncTripToFirebase({ ...currentTrip, status: 'cancelled' });

    IraqRideApi.updateRideStatus(currentTrip.id, 'CANCELLED_BY_PASSENGER', {
      cancellationReason: 'ألغيت من قبل الزبون'
    }).catch(e => console.error('Cancel sync notice:', e));

    setCurrentTrip(null);
    setIncomingDriverOffer(null);
    setIncomingDriverRequest(null);
    playAudioCue('alert');
  };

  const rateTrip = (rating: number, comment: string, tipIQD?: number) => {
    if (!currentTrip) return;
    const completedTrip: Trip = {
      ...currentTrip,
      passengerReview: {
        rating,
        comment,
        tipIQD
      }
    };
    IraqRideApi.updateRideStatus(currentTrip.id, 'TRIP_COMPLETED', {
      passengerReview: { rating, comment, tipIQD }
    }).catch(e => console.error('Rate sync notice:', e));

    setPastTrips(prev => [completedTrip, ...prev]);
    setCurrentTrip(null);
    playAudioCue('ding');
  };

  const toggleDriverOnline = () => {
    setActiveDriver(prev => {
      const nextOnline = !prev.isOnline;
      IraqRideApi.updateDriverStatus(prev.id, nextOnline).catch(e => console.error('Driver status sync notice:', e));
      playAudioCue(nextOnline ? 'success' : 'alert');
      return { ...prev, isOnline: nextOnline };
    });
  };

  const acceptTripAsDriver = async () => {
    const rideId = incomingDriverOffer?.rideId || incomingDriverRequest?.id || currentTrip?.id;
    if (!rideId) return;

    try {
      await IraqRideApi.acceptRide(rideId, activeDriver.id);
    } catch (e) {
      console.error('Driver accept sync notice:', e);
    }

    const pickup = incomingDriverOffer ? {
      id: 'pk-acc',
      name: incomingDriverOffer.pickup.name,
      district: incomingDriverOffer.pickup.district,
      cityId: selectedCityId,
      category: 'landmark' as const,
      lat: incomingDriverOffer.pickup.lat,
      lng: incomingDriverOffer.pickup.lng
    } : incomingDriverRequest?.pickup || IRAQI_LANDMARKS[0];

    const dropoff = incomingDriverOffer ? {
      id: 'dp-acc',
      name: incomingDriverOffer.dropoff.name,
      district: incomingDriverOffer.dropoff.district,
      cityId: selectedCityId,
      category: 'landmark' as const,
      lat: incomingDriverOffer.dropoff.lat,
      lng: incomingDriverOffer.dropoff.lng
    } : incomingDriverRequest?.dropoff || IRAQI_LANDMARKS[1];

    setCurrentTrip({
      id: rideId,
      passengerName: incomingDriverOffer?.passengerName || incomingDriverRequest?.passengerName || 'علي الرافدين',
      passengerPhone: incomingDriverOffer?.passengerPhone || incomingDriverRequest?.passengerPhone || '07712349988',
      passengerRating: incomingDriverOffer?.passengerRating || 4.95,
      cityId: selectedCityId,
      pickup,
      dropoff,
      tier: (incomingDriverOffer?.tier as RideTierId) || incomingDriverRequest?.tier || 'economy',
      status: 'driver_assigned',
      estimatedDistanceKm: incomingDriverOffer?.distanceKm || incomingDriverRequest?.estimatedDistanceKm || 5.0,
      estimatedDurationMins: incomingDriverOffer?.durationMins || incomingDriverRequest?.estimatedDurationMins || 14,
      basePriceIQD: 1500,
      surgeMultiplier: incomingDriverOffer?.surgeMultiplier || 1.0,
      totalPriceIQD: incomingDriverOffer?.totalPriceIQD || incomingDriverRequest?.totalPriceIQD || 6500,
      paymentMethod: 'cash',
      driverId: activeDriver.id,
      driver: activeDriver,
      createdAt: Date.now(),
      progressPercent: 10,
      currentCoords: {
        lat: activeDriver.currentLocation.lat,
        lng: activeDriver.currentLocation.lng
      }
    });

    setIncomingDriverOffer(null);
    setIncomingDriverRequest(null);
    playAudioCue('success');
  };

  const rejectTripAsDriver = async () => {
    const rideId = incomingDriverOffer?.rideId || incomingDriverRequest?.id || currentTrip?.id;
    if (rideId) {
      try {
        await IraqRideApi.rejectRide(rideId, activeDriver.id, 'driver_declined');
      } catch (e) {
        console.error('Driver reject sync notice:', e);
      }
    }

    setIncomingDriverOffer(null);
    setIncomingDriverRequest(null);
    playAudioCue('alert');
  };

  const simulateDriverAcceptanceForDemo = async () => {
    if (!currentTrip) return;
    const assignedDriver = driversList.find(d => d.cityId === currentTrip.cityId && d.isOnline) || activeDriver;
    try {
      await IraqRideApi.acceptRide(currentTrip.id, assignedDriver.id);
    } catch (e) {
      console.error('Demo accept error:', e);
    }

    setCurrentTrip(prev => (prev ? {
      ...prev,
      status: 'driver_assigned',
      driverId: assignedDriver.id,
      driver: assignedDriver,
      currentCoords: {
        lat: prev.pickup.lat + 0.003,
        lng: prev.pickup.lng + 0.003
      }
    } : null));

    setIncomingDriverOffer(null);
    setIncomingDriverRequest(null);
    playAudioCue('success');
  };

  const acceptOfferFromQueue = async (rideId: string) => {
    const targetOffer = tripRequestsQueue.find(o => o.rideId === rideId) || incomingDriverOffer;
    if (!targetOffer) return;

    try {
      await IraqRideApi.acceptRide(rideId, activeDriver.id);
    } catch (e) {
      console.error('Accept from queue notice:', e);
    }

    setTripRequestsQueue(prev => prev.filter(o => o.rideId !== rideId));
    setIncomingDriverOffer(null);
    setIncomingDriverRequest(null);

    const newPin = Math.floor(1000 + Math.random() * 9000).toString();
    setPassengerVerificationPin(newPin);

    setCurrentTrip({
      id: targetOffer.rideId,
      passengerName: targetOffer.passengerName,
      passengerPhone: targetOffer.passengerPhone || '07701234999',
      passengerRating: targetOffer.passengerRating,
      cityId: selectedCityId,
      pickup: {
        id: `pk-${Date.now()}`,
        name: targetOffer.pickup.name,
        district: targetOffer.pickup.district,
        cityId: selectedCityId,
        category: 'landmark',
        lat: targetOffer.pickup.lat,
        lng: targetOffer.pickup.lng
      },
      dropoff: {
        id: `dp-${Date.now()}`,
        name: targetOffer.dropoff.name,
        district: targetOffer.dropoff.district,
        cityId: selectedCityId,
        category: 'landmark',
        lat: targetOffer.dropoff.lat,
        lng: targetOffer.dropoff.lng
      },
      tier: (targetOffer.tier as RideTierId) || 'economy',
      status: 'driver_assigned',
      estimatedDistanceKm: targetOffer.distanceKm,
      estimatedDurationMins: targetOffer.durationMins,
      basePriceIQD: 1500,
      surgeMultiplier: targetOffer.surgeMultiplier || 1.0,
      totalPriceIQD: targetOffer.totalPriceIQD,
      paymentMethod: 'cash',
      driverId: activeDriver.id,
      driver: activeDriver,
      createdAt: Date.now(),
      progressPercent: 10,
      currentCoords: {
        lat: activeDriver.currentLocation.lat,
        lng: activeDriver.currentLocation.lng
      }
    });

    playAudioCue('success');
  };

  const rejectOfferFromQueue = async (rideId: string, reason: string = 'declined_by_driver') => {
    try {
      await IraqRideApi.rejectRide(rideId, activeDriver.id, reason);
    } catch (e) {
      console.error('Reject from queue notice:', e);
    }

    setTripRequestsQueue(prev => prev.filter(o => o.rideId !== rideId));
    if (incomingDriverOffer?.rideId === rideId) {
      setIncomingDriverOffer(null);
      setIncomingDriverRequest(null);
    }
    playAudioCue('alert');
  };

  const verifyPassengerPin = (enteredPin: string): boolean => {
    if (enteredPin.trim() === passengerVerificationPin.trim()) {
      playAudioCue('success');
      return true;
    }
    playAudioCue('alert');
    return false;
  };

  const confirmDriverArrivalAtPickup = () => {
    setDriverArrivalDetected(true);
    playAudioCue('ding');
    if (currentTrip) {
      setCurrentTrip(prev => prev ? { ...prev, status: 'driver_arriving', progressPercent: 25 } : null);
      IraqRideApi.updateRideStatus(currentTrip.id, 'DRIVER_ARRIVING').catch(e => console.error(e));
    }
  };

  const advanceDriverTripStep = () => {
    if (!currentTrip) return;
    if (currentTrip.status === 'driver_assigned') {
      IraqRideApi.updateRideStatus(currentTrip.id, 'DRIVER_ARRIVING');
      setCurrentTrip({ ...currentTrip, status: 'driver_arriving', progressPercent: 20 });
    } else if (currentTrip.status === 'driver_arriving') {
      IraqRideApi.updateRideStatus(currentTrip.id, 'TRIP_STARTED');
      setCurrentTrip({ ...currentTrip, status: 'trip_in_progress', startedAt: Date.now(), progressPercent: 30 });
    } else if (currentTrip.status === 'trip_in_progress') {
      IraqRideApi.updateRideStatus(currentTrip.id, 'TRIP_COMPLETED', {
        driverId: activeDriver.id
      });
      setCurrentTrip({
        ...currentTrip,
        status: 'completed',
        completedAt: Date.now(),
        progressPercent: 100
      });
      confetti({ particleCount: 60, spread: 60 });
    }
  };

  const topUpPassengerWallet = (amountIQD: number, method: string) => {
    setPassengerWalletIQD(prev => prev + amountIQD);
    playAudioCue('success');
    confetti({ particleCount: 40, spread: 50 });
    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        title: `تم شحن المحفظة بنجاح: +${amountIQD.toLocaleString()} د.ع`,
        message: `تم إضافة المبلغ عبر بوابة الدفع ${method}`,
        time: 'الآن',
        type: 'wallet',
        read: false
      },
      ...prev
    ]);
  };

  const withdrawDriverWallet = (amountIQD: number, method: string) => {
    if (activeDriver.walletBalanceIQD < amountIQD) return;
    setActiveDriver(prev => ({
      ...prev,
      walletBalanceIQD: prev.walletBalanceIQD - amountIQD
    }));
    playAudioCue('success');
    setNotifications(prev => [
      {
        id: `notif-${Date.now()}`,
        title: `طلب سحب أرباح: ${amountIQD.toLocaleString()} د.ع`,
        message: `تم تحويل المبلغ إلى حسابك في ${method} بنجاح`,
        time: 'الآن',
        type: 'wallet',
        read: false
      },
      ...prev
    ]);
  };

  const updateSurgeZoneMultiplier = (zoneId: string, multiplier: number) => {
    setSurgeZones(prev =>
      prev.map(sz => (sz.id === zoneId ? { ...sz, multiplier, demandLevel: multiplier > 1.4 ? 'surge' : multiplier > 1.2 ? 'high' : 'normal' } : sz))
    );
  };

  const addSupportMessage = (ticketId: string, text: string, sender: 'user' | 'agent') => {
    const timeStr = new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' });
    setSupportTickets(prev =>
      prev.map(t => {
        if (t.id === ticketId) {
          return {
            ...t,
            messages: [...t.messages, { sender, text, time: timeStr }]
          };
        }
        return t;
      })
    );
    playAudioCue('beep');
  };

  const createNewTicket = (subject: string, message: string, priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium') => {
    const timeStr = new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' });
    const newT: SupportTicket = {
      id: `TCK-${Math.floor(8830 + Math.random() * 1000)}`,
      tripId: currentTrip ? currentTrip.id : undefined,
      userName: role === 'driver' ? activeDriver.name : 'راكب مشوار',
      userRole: role === 'driver' ? 'driver' : 'passenger',
      subject,
      priority,
      status: 'open',
      createdAt: 'الآن',
      messages: [{ sender: 'user', text: message, time: timeStr }]
    };
    setSupportTickets(prev => [newT, ...prev]);
    playAudioCue('success');
  };

  const resolveTicket = (ticketId: string) => {
    setSupportTickets(prev =>
      prev.map(t => (t.id === ticketId ? { ...t, status: 'resolved' } : t))
    );
    playAudioCue('ding');
  };

  const createManualDispatchedTrip = (
    pickup: LandmarkPoint,
    dropoff: LandmarkPoint,
    passengerName: string,
    phone: string,
    tier: RideTierId
  ) => {
    const { distanceKm, durationMins, baseFareIQD, surgeMultiplier, finalPriceIQD } = calculateTripEstimate(
      pickup,
      dropoff,
      tier
    );

    const manualTrip: Trip = {
      id: `TRP-MAN-${Math.floor(1000 + Math.random() * 9000)}`,
      passengerName,
      passengerPhone: phone,
      passengerRating: 5.0,
      cityId: pickup.cityId,
      pickup,
      dropoff,
      tier,
      status: 'searching_driver',
      estimatedDistanceKm: distanceKm,
      estimatedDurationMins: durationMins,
      basePriceIQD: baseFareIQD,
      surgeMultiplier,
      totalPriceIQD: finalPriceIQD,
      paymentMethod: 'cash',
      createdAt: Date.now(),
      progressPercent: 0,
      notesForDriver: 'حجز يدوي هاتف عبر غرفة العمليات (Dispatcher)'
    };

    setCurrentTrip(manualTrip);
    playAudioCue('beep');
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const clearNotifications = () => {
    setNotifications([]);
  };

  return (
    <AppContext.Provider
      value={{
        role,
        setRole,
        currentRole: role,
        setCurrentRole: setRole,
        selectedCityId,
        setSelectedCityId,
        passengerWalletIQD,
        setPassengerWalletIQD,
        topUpPassengerWallet,
        currentTrip,
        setCurrentTrip,
        pickupPoint,
        setPickupPoint,
        dropoffPoint,
        setDropoffPoint,
        selectedTier,
        setSelectedTier,
        selectedPaymentMethod,
        setSelectedPaymentMethod,
        promoCode,
        setPromoCode,
        discountAmountIQD,
        applyPromoCode,
        requestRide,
        cancelTrip,
        rateTrip,
        activeDriver,
        driversList,
        toggleDriverOnline,
        acceptTripAsDriver,
        rejectTripAsDriver,
        incomingDriverRequest,
        incomingDriverOffer,
        activeOfferRemainingSeconds,
        tripRequestsQueue,
        acceptOfferFromQueue,
        rejectOfferFromQueue,
        passengerVerificationPin,
        verifyPassengerPin,
        driverArrivalDetected,
        confirmDriverArrivalAtPickup,
        simulateDriverAcceptanceForDemo,
        advanceDriverTripStep,
        withdrawDriverWallet,
        pastTrips,
        surgeZones,
        updateSurgeZoneMultiplier,
        supportTickets,
        addSupportMessage,
        createNewTicket,
        resolveTicket,
        createManualDispatchedTrip,
        notifications,
        markNotificationRead,
        clearNotifications,
        playAudioCue
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
