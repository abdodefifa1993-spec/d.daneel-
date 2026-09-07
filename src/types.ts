export type AppRole =
  | 'passenger'
  | 'driver'
  | 'delivery'
  | 'owner'
  | 'admin'
  | 'manager'
  | 'dispatcher'
  | 'call_center'
  | 'support'
  | 'monitoring'
  | 'roadmap';

export type UserRole =
  | 'SUPER_ADMIN'
  | 'OWNER'
  | 'ADMIN'
  | 'MANAGER'
  | 'DISPATCHER'
  | 'CALL_CENTER'
  | 'SUPPORT'
  | 'MONITOR'
  | 'DRIVER'
  | 'PASSENGER';

export type IraqiCityId = 'baghdad' | 'erbil' | 'basra' | 'najaf' | 'karbala' | 'sulaymaniyah' | 'mosul' | 'ramadi' | 'fallujah' | 'hit';

export interface IraqiCity {
  id: IraqiCityId;
  nameAr: string;
  nameEn: string;
  center: { lat: number; lng: number };
  zoom: number;
  popularDistricts: string[];
}

export interface LandmarkPoint {
  id: string;
  name: string;
  district: string;
  cityId: IraqiCityId;
  category: 'mall' | 'landmark' | 'street' | 'hospital' | 'university' | 'airport' | 'square';
  lat: number;
  lng: number;
  popularLocalName?: string;
}

export type RideTierId = 'economy' | 'comfort_vip' | 'women_taxi' | 'delivery' | 'family';

export interface RideTier {
  id: RideTierId;
  nameAr: string;
  nameEn: string;
  descriptionAr: string;
  carModels: string;
  baseFareIQD: number;
  perKmFareIQD: number;
  perMinFareIQD: number;
  capacity: number;
  iconName: string;
  multiplier: number;
  estimatedArrivalMins: number;
}

export type PaymentMethodType = 'cash' | 'zaincash' | 'fastpay' | 'qi_card' | 'app_wallet';

export interface PaymentOption {
  id: PaymentMethodType;
  nameAr: string;
  nameEn: string;
  description: string;
  icon: string;
  color: string;
  feePercent: number;
}

export type TripStatus =
  | 'idle'
  | 'selecting_destination'
  | 'searching_driver'
  | 'driver_assigned'
  | 'driver_arriving'
  | 'trip_in_progress'
  | 'completed'
  | 'cancelled'
  | 'no_driver_found';

export interface DriverDispatchOffer {
  rideId: string;
  driverId: string;
  candidateName?: string;
  pickup: { name: string; district: string; lat: number; lng: number };
  dropoff: { name: string; district: string; lat: number; lng: number };
  distanceKm: number;
  durationMins: number;
  timeToPickupMins: number;
  fareIQD: number;
  totalPriceIQD: number;
  passengerName: string;
  passengerPhone?: string;
  passengerRating: number;
  tier: string;
  surgeMultiplier: number;
  countdownSeconds: number;
  timestamp: number;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  avatar: string;
  rating: number;
  totalTrips: number;
  isOnline: boolean;
  isBusy: boolean;
  cityId: IraqiCityId;
  currentLocation: { lat: number; lng: number };
  heading: number;
  car: {
    model: string;
    make: string;
    year: number;
    color: string;
    plateNumber: string;
    tier: RideTierId;
  };
  walletBalanceIQD: number;
  todayEarningsIQD: number;
  acceptanceRate: number;
  joinedDate: string;
  kycVerified: boolean;
  gender: 'male' | 'female';
}

export interface Trip {
  id: string;
  passengerName: string;
  passengerPhone: string;
  passengerRating: number;
  cityId: IraqiCityId;
  pickup: LandmarkPoint;
  dropoff: LandmarkPoint;
  tier: RideTierId;
  status: TripStatus;
  estimatedDistanceKm: number;
  estimatedDurationMins: number;
  actualDistanceKm?: number;
  actualDurationMins?: number;
  basePriceIQD: number;
  surgeMultiplier: number;
  totalPriceIQD: number;
  paymentMethod: PaymentMethodType;
  driverId?: string;
  driver?: Driver;
  createdAt: number;
  startedAt?: number;
  completedAt?: number;
  progressPercent: number;
  currentCoords?: { lat: number; lng: number };
  routePath?: [number, number][];
  currentHeading?: number;
  currentSpeed?: number;
  etaRemainingMins?: number;
  distanceRemainingKm?: number;
  isEmergency?: boolean;
  emergencyTriggeredAt?: number;
  notesForDriver?: string;
  promoCode?: string;
  discountIQD?: number;
  passengerReview?: {
    rating: number;
    comment: string;
    tipIQD?: number;
  };
}

export interface SupportTicket {
  id: string;
  tripId?: string;
  userName: string;
  userRole: 'passenger' | 'driver';
  subject: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'investigating' | 'resolved';
  createdAt: string;
  messages: Array<{
    sender: 'user' | 'agent';
    text: string;
    time: string;
  }>;
}

export interface SurgeZone {
  id: string;
  cityId: IraqiCityId;
  zoneName: string;
  lat: number;
  lng: number;
  radiusKm: number;
  multiplier: number;
  demandLevel: 'normal' | 'high' | 'surge' | 'extreme';
  activeOrdersCount: number;
  availableDriversCount: number;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'ride' | 'wallet' | 'system' | 'safety';
  read: boolean;
}

export interface DriverTelemetry {
  driverId: string;
  lat: number;
  lng: number;
  heading: number; // 0=North, 90=East, 180=South, 270=West
  speed: number;
  trail: Array<{ lat: number; lng: number; timestamp: number }>;
}

export interface RadarDiscoveryInfo {
  center: { lat: number; lng: number };
  ringsKm: number[]; // [0.5, 1.0, 2.0, 5.0]
  nearbyDrivers: Array<{
    driver: Driver;
    distanceMeters: number;
    etaMinutes: number;
  }>;
}

export interface ComplaintRecord {
  id: string;
  tripId?: string;
  complainantName: string;
  complainantPhone: string;
  complainantRole: 'passenger' | 'driver';
  category: 'fare_dispute' | 'driver_behavior' | 'late_arrival' | 'vehicle_condition' | 'route_deviation' | 'lost_item';
  description: string;
  status: 'OPEN' | 'IN_REVIEW' | 'RESOLVED' | 'ESCALATED';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  createdAt: string;
  resolutionNotes?: string;
  refundAmountIQD?: number;
}

export interface DriverDocument {
  id: string;
  driverId: string;
  type: 'national_id' | 'driver_license' | 'car_registration' | 'security_clearance';
  title: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  expiryDate: string;
  documentNumber: string;
}

export interface LiveIncident {
  id: string;
  type: 'DELAYED_RIDE' | 'SOS_ALERT' | 'ROUTE_DEVIATION' | 'UNUSUAL_STOP' | 'SURGE_SHORTAGE';
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  tripId?: string;
  driverId?: string;
  location?: { lat: number; lng: number; name: string };
  timestamp: string;
  resolved: boolean;
}

export interface SystemAuditLog {
  id: string;
  actor: string;
  role: string;
  action: string;
  target: string;
  timestamp: string;
  ip: string;
}

