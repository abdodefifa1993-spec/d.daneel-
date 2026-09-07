import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface UserEntity {
  id: string;
  phone: string;
  name: string;
  role: 'passenger' | 'driver' | 'admin' | 'dispatcher' | 'support';
  avatar?: string;
  cityId: string;
  walletBalanceIQD: number;
  rating: number;
  totalTrips: number;
  createdAt: string;
}

export interface DriverEntity {
  id: string;
  userId: string;
  name: string;
  phone: string;
  avatar: string;
  rating: number;
  totalTrips: number;
  isOnline: boolean;
  isBusy: boolean;
  cityId: string;
  currentLocation: { lat: number; lng: number };
  heading: number;
  speed: number;
  accuracy: number;
  car: {
    model: string;
    make: string;
    year: number;
    color: string;
    plateNumber: string;
    tier: string;
  };
  walletBalanceIQD: number;
  todayEarningsIQD: number;
  acceptanceRate: number;
  joinedDate: string;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  gender: 'male' | 'female';
  updatedAt: string;
}

export interface RideEntity {
  id: string;
  passengerId: string;
  passengerName: string;
  passengerPhone: string;
  passengerRating: number;
  cityId: string;
  pickup: {
    name: string;
    district: string;
    lat: number;
    lng: number;
    formattedAddress?: string;
  };
  dropoff: {
    name: string;
    district: string;
    lat: number;
    lng: number;
    formattedAddress?: string;
  };
  tier: string;
  status:
    | 'REQUESTED'
    | 'SEARCHING_DRIVER'
    | 'DRIVER_ASSIGNED'
    | 'DRIVER_ARRIVING'
    | 'DRIVER_ARRIVED'
    | 'PASSENGER_ONBOARD'
    | 'TRIP_STARTED'
    | 'TRIP_COMPLETED'
    | 'CANCELLED_BY_PASSENGER'
    | 'CANCELLED_BY_DRIVER'
    | 'NO_DRIVER_FOUND';
  estimatedDistanceKm: number;
  estimatedDurationMins: number;
  actualDistanceKm?: number;
  actualDurationMins?: number;
  baseFareIQD: number;
  distanceFareIQD: number;
  timeFareIQD: number;
  surgeMultiplier: number;
  discountIQD: number;
  platformCommissionPercent: number;
  platformCommissionIQD: number;
  driverEarningsIQD: number;
  totalPriceIQD: number;
  paymentMethod: 'cash' | 'zaincash' | 'fastpay' | 'qi_card' | 'wallet';
  paymentStatus: 'pending' | 'completed' | 'refunded';
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  driverAvatar?: string;
  driverRating?: number;
  driverCar?: any;
  currentCoords?: { lat: number; lng: number };
  createdAt: string;
  acceptedAt?: string;
  arrivedAt?: string;
  startedAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  passengerReview?: {
    rating: number;
    comment: string;
    tipIQD?: number;
  };
  driverReview?: {
    rating: number;
    comment?: string;
  };
  candidateDriverIds?: string[];
  currentCandidateDriverId?: string;
  rejectedDriverIds?: string[];
  dispatchAttempt?: number;
  dispatchExpiresAt?: number;
}

export interface WalletTransactionEntity {
  id: string;
  userId: string;
  role: 'passenger' | 'driver' | 'platform';
  rideId?: string;
  amountIQD: number;
  type: 'ride_payment' | 'commission_deduction' | 'driver_payout' | 'topup' | 'refund' | 'tip';
  status: 'completed' | 'pending' | 'failed';
  description: string;
  timestamp: string;
}

export interface PricingRuleEntity {
  cityId: string;
  tierId: string;
  tierNameAr: string;
  baseFareIQD: number;
  perKmFareIQD: number;
  perMinFareIQD: number;
  minimumFareIQD: number;
  waitingPerMinIQD: number;
  cancellationFeeIQD: number;
  platformCommissionPercent: number;
}

export interface SupportTicketEntity {
  id: string;
  userId: string;
  userName: string;
  userPhone?: string;
  userRole: 'passenger' | 'driver' | 'courier' | 'dispatcher' | 'admin';
  rideId?: string;
  subject: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  createdAt: string;
  messages: Array<{
    sender: 'user' | 'agent';
    senderName: string;
    text: string;
    time: string;
  }>;
}

export interface DeliveryDriverEntity {
  id: string;
  userId: string;
  name: string;
  phone: string;
  avatar: string;
  rating: number;
  totalDeliveries: number;
  isOnline: boolean;
  isBusy: boolean;
  vehicleType: 'motorcycle' | 'car' | 'bicycle';
  plateNumber?: string;
  cityId: string;
  currentLocation: { lat: number; lng: number };
  heading: number;
  speed: number;
  walletBalanceIQD: number;
  todayEarningsIQD: number;
  acceptanceRate: number;
  status: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'SUSPENDED';
  joinedDate: string;
  updatedAt: string;
}

export interface StoreMenuItem {
  id: string;
  nameAr: string;
  priceIQD: number;
  category: string;
  image?: string;
  description?: string;
  isAvailable: boolean;
}

export interface StoreEntity {
  id: string;
  nameAr: string;
  category: 'restaurant' | 'market' | 'pharmacy' | 'sweets' | 'ice_cream' | 'local_store';
  cityId: string;
  location: { lat: number; lng: number };
  address: string;
  rating: number;
  totalOrders: number;
  isOpen: boolean;
  logo: string;
  banner?: string;
  minimumOrderIQD: number;
  estimatedPrepMins: number;
  items: StoreMenuItem[];
}

export interface OrderEntity {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  storeId: string;
  storeName: string;
  storeCategory: string;
  items: Array<{
    id: string;
    nameAr: string;
    qty: number;
    priceIQD: number;
  }>;
  subtotalIQD: number;
  deliveryFeeIQD: number;
  totalAmountIQD: number;
  paymentMethod: 'cash' | 'wallet' | 'zaincash' | 'qi_card';
  paymentStatus: 'pending' | 'paid' | 'refunded';
  deliveryAddress: {
    name: string;
    lat: number;
    lng: number;
    notes?: string;
  };
  storeLat?: number;
  storeLng?: number;
  storeAddress?: string;
  storeLogo?: string;
  status: 'PENDING' | 'ACCEPTED_BY_STORE' | 'PREPARING' | 'READY_FOR_PICKUP' | 'COURIER_ASSIGNED' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED';
  courierId?: string;
  courierName?: string;
  courierPhone?: string;
  candidateCourierIds?: string[];
  rejectedCourierIds?: string[];
  currentCandidateCourierId?: string;
  dispatchExpiresAt?: number;
  createdAt: string;
  updatedAt: string;
}

interface DatabaseSchema {
  users: UserEntity[];
  drivers: DriverEntity[];
  deliveryDrivers: DeliveryDriverEntity[];
  stores: StoreEntity[];
  orders: OrderEntity[];
  rides: RideEntity[];
  transactions: WalletTransactionEntity[];
  pricingRules: PricingRuleEntity[];
  supportTickets: SupportTicketEntity[];
  platformStats: {
    totalRevenueIQD: number;
    totalCommissionIQD: number;
    tripsCount: number;
  };
}

const DB_FILE = path.join(process.cwd(), 'data_iraq_ride.json');

class IraqiRideDatabase {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.load();
    if (!this.data.drivers || this.data.drivers.length === 0) {
      this.seedInitial();
    }
    if (!this.data.stores || this.data.stores.length === 0) {
      this.seedStoresAndCouriers();
    }
  }

  private load(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const loaded = JSON.parse(raw);
        return {
          users: loaded.users || [],
          drivers: loaded.drivers || [],
          deliveryDrivers: loaded.deliveryDrivers || [],
          stores: loaded.stores || [],
          orders: loaded.orders || [],
          rides: loaded.rides || [],
          transactions: loaded.transactions || [],
          pricingRules: loaded.pricingRules || [],
          supportTickets: loaded.supportTickets || [],
          platformStats: loaded.platformStats || { totalRevenueIQD: 0, totalCommissionIQD: 0, tripsCount: 0 }
        };
      }
    } catch (e) {
      console.error('Error loading DB file, fallback to empty:', e);
    }
    return {
      users: [],
      drivers: [],
      deliveryDrivers: [],
      stores: [],
      orders: [],
      rides: [],
      transactions: [],
      pricingRules: [],
      supportTickets: [],
      platformStats: { totalRevenueIQD: 0, totalCommissionIQD: 0, tripsCount: 0 }
    };
  }

  public save(): void {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving DB file:', e);
    }
  }

  private seedInitial() {
    this.data.pricingRules = [
      {
        cityId: 'baghdad',
        tierId: 'economy',
        tierNameAr: 'اقتصادي (Economy)',
        baseFareIQD: 1500,
        perKmFareIQD: 700,
        perMinFareIQD: 100,
        minimumFareIQD: 3000,
        waitingPerMinIQD: 150,
        cancellationFeeIQD: 1500,
        platformCommissionPercent: 15
      },
      {
        cityId: 'baghdad',
        tierId: 'comfort_vip',
        tierNameAr: 'كومفورت VIP (Comfort)',
        baseFareIQD: 3000,
        perKmFareIQD: 1100,
        perMinFareIQD: 200,
        minimumFareIQD: 5000,
        waitingPerMinIQD: 250,
        cancellationFeeIQD: 2500,
        platformCommissionPercent: 15
      },
      {
        cityId: 'baghdad',
        tierId: 'women_taxi',
        tierNameAr: 'تكسي النواعم (للنساء فقط)',
        baseFareIQD: 2000,
        perKmFareIQD: 800,
        perMinFareIQD: 120,
        minimumFareIQD: 3500,
        waitingPerMinIQD: 150,
        cancellationFeeIQD: 1500,
        platformCommissionPercent: 12
      },
      {
        cityId: 'baghdad',
        tierId: 'family',
        tierNameAr: 'عائلي كبير 7 راكب (Family XL)',
        baseFareIQD: 3500,
        perKmFareIQD: 1250,
        perMinFareIQD: 250,
        minimumFareIQD: 6000,
        waitingPerMinIQD: 300,
        cancellationFeeIQD: 3000,
        platformCommissionPercent: 15
      }
    ];

    this.data.drivers = [
      {
        id: 'drv-1',
        userId: 'usr-drv-1',
        name: 'كابتن مصطفى السعدي',
        phone: '+964 770 123 4567',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        rating: 4.95,
        totalTrips: 1840,
        isOnline: true,
        isBusy: false,
        cityId: 'baghdad',
        currentLocation: { lat: 33.3160, lng: 44.3580 },
        heading: 45,
        speed: 35,
        accuracy: 5,
        car: {
          make: 'هيونداي',
          model: 'إلنترا 2023',
          year: 2023,
          color: 'فضي معدني',
          plateNumber: 'بغداد 63921 خصوصي',
          tier: 'economy'
        },
        walletBalanceIQD: 185000,
        todayEarningsIQD: 52000,
        acceptanceRate: 98,
        joinedDate: '2023-04-12',
        status: 'APPROVED',
        gender: 'male',
        updatedAt: new Date().toISOString()
      },
      {
        id: 'drv-2',
        userId: 'usr-drv-2',
        name: 'كابتن حيدر الكرخي',
        phone: '+964 780 987 6543',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        rating: 4.88,
        totalTrips: 2410,
        isOnline: true,
        isBusy: false,
        cityId: 'baghdad',
        currentLocation: { lat: 33.3050, lng: 44.4220 },
        heading: 120,
        speed: 25,
        accuracy: 4,
        car: {
          make: 'تويوتا',
          model: 'كامري VIP 2024',
          year: 2024,
          color: 'أسود ملكي',
          plateNumber: 'بغداد 88120 خصوصي',
          tier: 'comfort_vip'
        },
        walletBalanceIQD: 420000,
        todayEarningsIQD: 94000,
        acceptanceRate: 96,
        joinedDate: '2022-11-05',
        status: 'APPROVED',
        gender: 'male',
        updatedAt: new Date().toISOString()
      },
      {
        id: 'drv-3',
        userId: 'usr-drv-3',
        name: 'كابتن رند التميمي (كابتن سيدة)',
        phone: '+964 771 555 4433',
        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
        rating: 4.97,
        totalTrips: 1120,
        isOnline: true,
        isBusy: false,
        cityId: 'baghdad',
        currentLocation: { lat: 33.3260, lng: 44.3460 },
        heading: 210,
        speed: 40,
        accuracy: 3,
        car: {
          make: 'كيا',
          model: 'سيراتو ناعم',
          year: 2023,
          color: 'فضي ميتاليك',
          plateNumber: 'بغداد 67431 خصوصي',
          tier: 'women_taxi'
        },
        walletBalanceIQD: 194000,
        todayEarningsIQD: 48000,
        acceptanceRate: 99,
        joinedDate: '2023-08-01',
        status: 'APPROVED',
        gender: 'female',
        updatedAt: new Date().toISOString()
      },
      {
        id: 'drv-iq-101',
        userId: 'usr-drv-101',
        name: 'كابتن كرار علي الزبيدي',
        phone: '+964 770 123 4567',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        rating: 4.95,
        totalTrips: 1420,
        isOnline: true,
        isBusy: false,
        cityId: 'baghdad',
        currentLocation: { lat: 33.3285, lng: 44.4098 },
        heading: 90,
        speed: 35,
        accuracy: 5,
        car: {
          make: 'تويوتا',
          model: 'كامري هايبرد',
          year: 2022,
          color: 'أبيض لؤلؤي',
          plateNumber: 'بغداد 44921 خصوصي',
          tier: 'economy'
        },
        walletBalanceIQD: 148500,
        todayEarningsIQD: 52000,
        acceptanceRate: 98,
        joinedDate: '2023-01-15',
        status: 'APPROVED',
        gender: 'male',
        updatedAt: new Date().toISOString()
      },
      {
        id: 'drv-iq-102',
        userId: 'usr-drv-102',
        name: 'كابتن عمر مهدي السامرائي',
        phone: '+964 780 987 6543',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        rating: 4.88,
        totalTrips: 890,
        isOnline: true,
        isBusy: false,
        cityId: 'baghdad',
        currentLocation: { lat: 33.3150, lng: 44.3820 },
        heading: 180,
        speed: 25,
        accuracy: 4,
        car: {
          make: 'هيونداي',
          model: 'سوناتا VIP',
          year: 2023,
          color: 'أسود ملكي',
          plateNumber: 'بغداد 88120 خصوصي',
          tier: 'comfort_vip'
        },
        walletBalanceIQD: 210000,
        todayEarningsIQD: 68000,
        acceptanceRate: 96,
        joinedDate: '2023-04-10',
        status: 'APPROVED',
        gender: 'male',
        updatedAt: new Date().toISOString()
      },
      {
        id: 'drv-iq-103',
        userId: 'usr-drv-103',
        name: 'كابتن ريم حيدر الحسني',
        phone: '+964 771 555 7788',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
        rating: 4.98,
        totalTrips: 640,
        isOnline: true,
        isBusy: false,
        cityId: 'baghdad',
        currentLocation: { lat: 33.3390, lng: 44.3750 },
        heading: 45,
        speed: 40,
        accuracy: 3,
        car: {
          make: 'كيا',
          model: 'سيراتو ناعم',
          year: 2023,
          color: 'فضي ميتاليك',
          plateNumber: 'بغداد 67431 خصوصي',
          tier: 'women_taxi'
        },
        walletBalanceIQD: 94000,
        todayEarningsIQD: 38000,
        acceptanceRate: 99,
        joinedDate: '2023-08-01',
        status: 'APPROVED',
        gender: 'female',
        updatedAt: new Date().toISOString()
      },
      {
        id: 'drv-iq-104',
        userId: 'usr-drv-104',
        name: 'كابتن آراس كاميران الكردي',
        phone: '+964 750 444 3322',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        rating: 4.92,
        totalTrips: 1120,
        isOnline: true,
        isBusy: false,
        cityId: 'erbil',
        currentLocation: { lat: 36.1920, lng: 44.0110 },
        heading: 270,
        speed: 50,
        accuracy: 5,
        car: {
          make: 'تويوتا',
          model: 'راف فور SUV',
          year: 2023,
          color: 'أبيض صدفي',
          plateNumber: 'أربيل 12894 أجرة',
          tier: 'comfort_vip'
        },
        walletBalanceIQD: 310000,
        todayEarningsIQD: 85000,
        acceptanceRate: 97,
        joinedDate: '2022-11-20',
        status: 'APPROVED',
        gender: 'male',
        updatedAt: new Date().toISOString()
      },
      {
        id: 'drv-iq-105',
        userId: 'usr-drv-105',
        name: 'كابتن حيدر جاسم البصراوي',
        phone: '+964 781 222 9900',
        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
        rating: 4.91,
        totalTrips: 980,
        isOnline: true,
        isBusy: false,
        cityId: 'basra',
        currentLocation: { lat: 30.5100, lng: 47.8320 },
        heading: 120,
        speed: 30,
        accuracy: 6,
        car: {
          make: 'تويوتا',
          model: 'كورولا أجرة',
          year: 2021,
          color: 'أصفر تكسي',
          plateNumber: 'البصرة 94103 أجرة',
          tier: 'economy'
        },
        walletBalanceIQD: 120000,
        todayEarningsIQD: 45000,
        acceptanceRate: 95,
        joinedDate: '2023-03-01',
        status: 'APPROVED',
        gender: 'male',
        updatedAt: new Date().toISOString()
      }
    ];

    this.save();
  }

  // --- Database Methods ---
  // --- User Methods ---
  public getUsers(): UserEntity[] {
    return this.data.users;
  }

  public getUserById(id: string): UserEntity | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public getUserByPhone(phone: string): UserEntity | undefined {
    return this.data.users.find(u => u.phone === phone);
  }

  public addUser(user: UserEntity): UserEntity {
    this.data.users.push(user);
    this.save();
    return user;
  }

  public updateUser(id: string, updates: Partial<UserEntity>): UserEntity | null {
    const user = this.data.users.find(u => u.id === id);
    if (!user) return null;
    Object.assign(user, updates);
    this.save();
    return user;
  }

  // --- Driver Methods ---
  public getDrivers(cityId?: string): DriverEntity[] {
    if (cityId) {
      return this.data.drivers.filter(d => d.cityId === cityId);
    }
    return this.data.drivers;
  }

  public getDriverById(id: string): DriverEntity | undefined {
    return this.data.drivers.find(d => d.id === id);
  }

  public updateDriverLocation(id: string, lat: number, lng: number, heading: number = 0, speed: number = 0): DriverEntity | null {
    const driver = this.data.drivers.find(d => d.id === id);
    if (!driver) return null;
    driver.currentLocation = { lat, lng };
    driver.heading = heading;
    driver.speed = speed;
    driver.updatedAt = new Date().toISOString();
    this.save();
    return driver;
  }

  public setDriverOnlineStatus(id: string, isOnline: boolean): DriverEntity | null {
    const driver = this.data.drivers.find(d => d.id === id);
    if (!driver) return null;
    driver.isOnline = isOnline;
    driver.updatedAt = new Date().toISOString();
    this.save();
    return driver;
  }

  public getPricingRules(cityId?: string): PricingRuleEntity[] {
    if (cityId) {
      return this.data.pricingRules.filter(r => r.cityId === cityId);
    }
    return this.data.pricingRules;
  }

  // --- Support Ticket Methods ---
  public getSupportTickets(userId?: string): SupportTicketEntity[] {
    if (userId) {
      return this.data.supportTickets.filter(t => t.userId === userId);
    }
    return this.data.supportTickets;
  }

  public createSupportTicket(ticketData: {
    userId: string;
    userName: string;
    userPhone: string;
    userRole: string;
    tripId?: string;
    subject: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    initialMessage: string;
  }): SupportTicketEntity {
    const id = `TCK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const ticket: SupportTicketEntity = {
      id,
      userId: ticketData.userId,
      userName: ticketData.userName,
      userPhone: ticketData.userPhone,
      userRole: (ticketData.userRole as any) || 'passenger',
      rideId: ticketData.tripId,
      subject: ticketData.subject,
      priority: ticketData.priority,
      status: 'OPEN',
      createdAt: new Date().toISOString(),
      messages: [
        {
          sender: 'user',
          senderName: ticketData.userName,
          text: ticketData.initialMessage,
          time: new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })
        }
      ]
    };
    this.data.supportTickets.unshift(ticket);
    this.save();
    return ticket;
  }

  public addMessageToTicket(ticketId: string, sender: 'user' | 'agent', senderName: string, text: string): SupportTicketEntity | null {
    const ticket = this.data.supportTickets.find(t => t.id === ticketId);
    if (!ticket) return null;
    ticket.messages.push({
      sender,
      senderName,
      text,
      time: new Date().toLocaleTimeString('ar-IQ', { hour: '2-digit', minute: '2-digit' })
    });
    if (sender === 'agent' && ticket.status === 'OPEN') {
      ticket.status = 'IN_PROGRESS';
    }
    this.save();
    return ticket;
  }

  public getPricingRule(cityId: string, tierId: string): PricingRuleEntity | undefined {
    return this.data.pricingRules.find(r => r.cityId === cityId && r.tierId === tierId) || this.data.pricingRules[0];
  }

  public findNearbyCandidateDrivers(pickup: { lat: number; lng: number }, cityId: string = 'baghdad', tier?: string): Array<DriverEntity & { distanceKm: number }> {
    const candidates = this.data.drivers.filter(d => {
      if (!d.isOnline || d.isBusy || d.status !== 'APPROVED') return false;
      if (d.cityId !== cityId) return false;
      if (tier && tier !== 'economy' && d.car.tier !== tier) return false;
      return true;
    });

    return candidates
      .map(d => {
        const dLat = (d.currentLocation.lat - pickup.lat) * 111;
        const dLng = (d.currentLocation.lng - pickup.lng) * 93;
        const distanceKm = Math.round(Math.hypot(dLat, dLng) * 10) / 10;
        return { ...d, distanceKm };
      })
      .sort((a, b) => {
        // Priority: Distance (ascending) -> Rating (descending) -> Acceptance Rate (descending)
        if (Math.abs(a.distanceKm - b.distanceKm) > 0.5) {
          return a.distanceKm - b.distanceKm;
        }
        if (b.rating !== a.rating) {
          return b.rating - a.rating;
        }
        return b.acceptanceRate - a.acceptanceRate;
      });
  }

  public createRide(rideData: Partial<RideEntity>): RideEntity {
    const id = `TRP-IQ-${Date.now().toString().slice(-6)}`;
    const pickup = rideData.pickup!;
    const cityId = rideData.cityId || 'baghdad';
    const tier = rideData.tier || 'economy';

    // Discover and rank candidates
    let candidates = this.findNearbyCandidateDrivers(pickup, cityId, tier);
    if (candidates.length === 0) {
      candidates = this.findNearbyCandidateDrivers(pickup, cityId);
    }
    if (candidates.length === 0) {
      // Fallback to any online driver in the system
      candidates = this.data.drivers.filter(d => d.isOnline).map(d => ({ ...d, distanceKm: 2.1 }));
    }
    const candidateDriverIds = candidates.map(c => c.id);
    const firstCandidate = candidateDriverIds.length > 0 ? candidateDriverIds[0] : (this.data.drivers[0]?.id || 'drv-1');

    const newRide: RideEntity = {
      id,
      passengerId: rideData.passengerId || 'usr-pass-demo',
      passengerName: rideData.passengerName || 'زبون دانيال',
      passengerPhone: rideData.passengerPhone || '+964 770 000 0000',
      passengerRating: 4.95,
      cityId,
      pickup,
      dropoff: rideData.dropoff!,
      tier,
      status: 'SEARCHING_DRIVER',
      estimatedDistanceKm: rideData.estimatedDistanceKm || 5.0,
      estimatedDurationMins: rideData.estimatedDurationMins || 15,
      baseFareIQD: rideData.baseFareIQD || 1500,
      distanceFareIQD: rideData.distanceFareIQD || 3500,
      timeFareIQD: rideData.timeFareIQD || 1500,
      surgeMultiplier: rideData.surgeMultiplier || 1.0,
      discountIQD: rideData.discountIQD || 0,
      platformCommissionPercent: 15,
      platformCommissionIQD: Math.round((rideData.totalPriceIQD || 6500) * 0.15),
      driverEarningsIQD: Math.round((rideData.totalPriceIQD || 6500) * 0.85),
      totalPriceIQD: rideData.totalPriceIQD || 6500,
      paymentMethod: rideData.paymentMethod || 'cash',
      paymentStatus: 'pending',
      createdAt: new Date().toISOString(),
      currentCoords: pickup,
      candidateDriverIds,
      currentCandidateDriverId: firstCandidate,
      rejectedDriverIds: [],
      dispatchAttempt: firstCandidate ? 1 : 0,
      dispatchExpiresAt: firstCandidate ? Date.now() + 15000 : undefined
    };

    this.data.rides.unshift(newRide);
    this.save();
    return newRide;
  }

  public advanceRideToNextCandidate(rideId: string): { ride: RideEntity; nextDriverId?: string; exhausted: boolean } | null {
    const ride = this.getRideById(rideId);
    if (!ride || ride.status !== 'SEARCHING_DRIVER') return null;

    if (ride.currentCandidateDriverId) {
      if (!ride.rejectedDriverIds) ride.rejectedDriverIds = [];
      if (!ride.rejectedDriverIds.includes(ride.currentCandidateDriverId)) {
        ride.rejectedDriverIds.push(ride.currentCandidateDriverId);
      }
    }

    const availableCandidates = (ride.candidateDriverIds || []).filter(
      id => !ride.rejectedDriverIds?.includes(id)
    );

    if (availableCandidates.length > 0) {
      ride.currentCandidateDriverId = availableCandidates[0];
      ride.dispatchAttempt = (ride.dispatchAttempt || 1) + 1;
      ride.dispatchExpiresAt = Date.now() + 15000;
      this.save();
      return { ride, nextDriverId: ride.currentCandidateDriverId, exhausted: false };
    } else {
      // Re-scan in case a driver came online
      const freshCandidates = this.findNearbyCandidateDrivers(ride.pickup, ride.cityId, ride.tier)
        .filter(c => !ride.rejectedDriverIds?.includes(c.id));
      if (freshCandidates.length > 0) {
        ride.candidateDriverIds = [...(ride.candidateDriverIds || []), ...freshCandidates.map(c => c.id)];
        ride.currentCandidateDriverId = freshCandidates[0].id;
        ride.dispatchAttempt = (ride.dispatchAttempt || 1) + 1;
        ride.dispatchExpiresAt = Date.now() + 15000;
        this.save();
        return { ride, nextDriverId: ride.currentCandidateDriverId, exhausted: false };
      }

      ride.currentCandidateDriverId = undefined;
      ride.status = 'NO_DRIVER_FOUND';
      this.save();
      return { ride, exhausted: true };
    }
  }

  public getRideById(id: string): RideEntity | undefined {
    return this.data.rides.find(r => r.id === id);
  }

  public getActiveRides(): RideEntity[] {
    return this.data.rides.filter(r => !['TRIP_COMPLETED', 'CANCELLED_BY_PASSENGER', 'CANCELLED_BY_DRIVER', 'NO_DRIVER_FOUND'].includes(r.status));
  }

  public getAllRides(): RideEntity[] {
    return this.data.rides;
  }

  public updateRideStatus(
    id: string,
    status: RideEntity['status'],
    extraData?: Partial<RideEntity>
  ): RideEntity | null {
    const ride = this.data.rides.find(r => r.id === id);
    if (!ride) return null;

    ride.status = status;

    if (extraData?.driverId) {
      ride.driverId = extraData.driverId;
      const driver = this.getDriverById(extraData.driverId);
      if (driver) {
        ride.driverName = driver.name;
        ride.driverPhone = driver.phone;
        ride.driverAvatar = driver.avatar;
        ride.driverRating = driver.rating;
        ride.driverCar = driver.car;
        driver.isBusy = status !== 'TRIP_COMPLETED';
      }
    }

    if (extraData?.currentCoords) {
      ride.currentCoords = extraData.currentCoords;
    }

    if (status === 'DRIVER_ASSIGNED' && !ride.acceptedAt) {
      ride.acceptedAt = new Date().toISOString();
    } else if (status === 'DRIVER_ARRIVED' && !ride.arrivedAt) {
      ride.arrivedAt = new Date().toISOString();
    } else if (status === 'TRIP_STARTED' && !ride.startedAt) {
      ride.startedAt = new Date().toISOString();
    } else if (status === 'TRIP_COMPLETED') {
      ride.completedAt = new Date().toISOString();
      ride.paymentStatus = 'completed';

      // Record transaction
      const transactionId = `TX-${Date.now()}`;
      this.data.transactions.push({
        id: transactionId,
        userId: ride.driverId || 'drv-unknown',
        role: 'driver',
        rideId: ride.id,
        amountIQD: ride.driverEarningsIQD,
        type: 'ride_payment',
        status: 'completed',
        description: `أجرة رحلة رقم ${ride.id}`,
        timestamp: new Date().toISOString()
      });

      // Update platform stats
      this.data.platformStats.totalRevenueIQD += ride.totalPriceIQD;
      this.data.platformStats.totalCommissionIQD += ride.platformCommissionIQD;
      this.data.platformStats.tripsCount += 1;

      // Update driver stats
      if (ride.driverId) {
        const driver = this.getDriverById(ride.driverId);
        if (driver) {
          driver.totalTrips += 1;
          driver.todayEarningsIQD += ride.driverEarningsIQD;
          driver.walletBalanceIQD += ride.driverEarningsIQD;
          driver.isBusy = false;
        }
      }
    } else if (status.startsWith('CANCELLED')) {
      ride.cancelledAt = new Date().toISOString();
      if (extraData?.cancellationReason) {
        ride.cancellationReason = extraData.cancellationReason;
      }
      if (ride.driverId) {
        const driver = this.getDriverById(ride.driverId);
        if (driver) driver.isBusy = false;
      }
    }

    this.save();
    return ride;
  }

  public getPlatformStats() {
    const completedRides = this.data.rides.filter(r => r.status === 'TRIP_COMPLETED');
    const activeRides = this.getActiveRides();
    const onlineDrivers = this.data.drivers.filter(d => d.isOnline);
    const activeDrivers = this.data.drivers.filter(d => d.isOnline && d.isBusy);

    return {
      totalTrips: this.data.rides.length,
      completedTrips: completedRides.length,
      activeTrips: activeRides.length,
      onlineDriversCount: onlineDrivers.length,
      activeDriversCount: activeDrivers.length,
      totalDriversCount: this.data.drivers.length,
      totalRevenueIQD: this.data.platformStats.totalRevenueIQD || 18500000,
      totalCommissionIQD: this.data.platformStats.totalCommissionIQD || 2775000,
      averageRating: 4.92
    };
  }

  public getTransactions(userId?: string): WalletTransactionEntity[] {
    if (userId) {
      return this.data.transactions.filter(t => t.userId === userId);
    }
    return this.data.transactions;
  }

  // --- Delivery & Stores Platform ---
  private seedStoresAndCouriers() {
    this.data.deliveryDrivers = [
      {
        id: 'courier-1',
        userId: 'usr_courier_01',
        name: 'علي المفرجي (دليفري سريع)',
        phone: '+964 771 555 1122',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        rating: 4.93,
        totalDeliveries: 412,
        isOnline: true,
        isBusy: false,
        vehicleType: 'motorcycle',
        plateNumber: 'بغداد 7821 دليفري',
        cityId: 'baghdad',
        currentLocation: { lat: 33.3152, lng: 44.3661 }, // المنصور
        heading: 90,
        speed: 25,
        walletBalanceIQD: 64000,
        todayEarningsIQD: 28000,
        acceptanceRate: 98,
        status: 'APPROVED',
        joinedDate: '2025-02-10',
        updatedAt: new Date().toISOString()
      },
      {
        id: 'courier-2',
        userId: 'usr_courier_02',
        name: 'عمر السعدي (مندوب دانيال)',
        phone: '+964 780 444 3322',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        rating: 4.88,
        totalDeliveries: 285,
        isOnline: true,
        isBusy: false,
        vehicleType: 'motorcycle',
        plateNumber: 'بغداد 1459 دليفري',
        cityId: 'baghdad',
        currentLocation: { lat: 33.3005, lng: 44.4250 }, // الكرادة
        heading: 180,
        speed: 20,
        walletBalanceIQD: 42000,
        todayEarningsIQD: 18000,
        acceptanceRate: 96,
        status: 'APPROVED',
        joinedDate: '2025-04-12',
        updatedAt: new Date().toISOString()
      },
      {
        id: 'courier-3',
        userId: 'usr_courier_03',
        name: 'يوسف الدليمي (كابتن طرود)',
        phone: '+964 772 333 8811',
        avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
        rating: 4.95,
        totalDeliveries: 530,
        isOnline: true,
        isBusy: false,
        vehicleType: 'car',
        plateNumber: 'بغداد 88204 خصوصي',
        cityId: 'baghdad',
        currentLocation: { lat: 33.2750, lng: 44.3820 }, // الجادرية
        heading: 45,
        speed: 35,
        walletBalanceIQD: 95000,
        todayEarningsIQD: 35000,
        acceptanceRate: 99,
        status: 'APPROVED',
        joinedDate: '2024-11-20',
        updatedAt: new Date().toISOString()
      }
    ];

    this.data.stores = [
      {
        id: 'store-1',
        nameAr: 'مطعم صمد - المنصور',
        category: 'restaurant',
        cityId: 'baghdad',
        location: { lat: 33.3125, lng: 44.3562 },
        address: 'حي المنصور، شارع 14 رمضان، بغداد',
        rating: 4.9,
        totalOrders: 3420,
        isOpen: true,
        logo: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=150&auto=format&fit=crop&q=80',
        banner: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=600&auto=format&fit=crop&q=80',
        minimumOrderIQD: 10000,
        estimatedPrepMins: 25,
        items: [
          { id: 'item-101', nameAr: 'قوزي لحم عراقي فاخر مع أرز عنبر', priceIQD: 18000, category: 'أطباق رئيسية', isAvailable: true },
          { id: 'item-102', nameAr: 'كباب لحم مشوي على الفحم (نفر)', priceIQD: 12000, category: 'مشاوي', isAvailable: true },
          { id: 'item-103', nameAr: 'دجاج مسكوف عراقي كامل', priceIQD: 15000, category: 'مشاوي', isAvailable: true }
        ]
      },
      {
        id: 'store-2',
        nameAr: 'أسواق الهدى المركزية - الكرادة',
        category: 'market',
        cityId: 'baghdad',
        location: { lat: 33.3050, lng: 44.4210 },
        address: 'شارع الكرادة داخل، مجاور مجمع الليث، بغداد',
        rating: 4.8,
        totalOrders: 1850,
        isOpen: true,
        logo: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=150&auto=format&fit=crop&q=80',
        minimumOrderIQD: 5000,
        estimatedPrepMins: 15,
        items: [
          { id: 'item-201', nameAr: 'سلة فواكه طازجة مشكلة (3 كغم)', priceIQD: 7500, category: 'خضار وفواكه', isAvailable: true },
          { id: 'item-202', nameAr: 'حليب كيكو كامل الدسم (كرتون)', priceIQD: 14000, category: 'ألبان', isAvailable: true },
          { id: 'item-203', nameAr: 'مياه معدنية الواحة (باقة 12 قنينة)', priceIQD: 3000, category: 'مشروبات', isAvailable: true }
        ]
      },
      {
        id: 'store-3',
        nameAr: 'صيدلية النقاء المركزية - الحارثية',
        category: 'pharmacy',
        cityId: 'baghdad',
        location: { lat: 33.3180, lng: 44.3720 },
        address: 'الحارثية، شارع الكندي، بغداد',
        rating: 4.95,
        totalOrders: 940,
        isOpen: true,
        logo: 'https://images.unsplash.com/photo-1586015555751-63c2998a44b9?w=150&auto=format&fit=crop&q=80',
        minimumOrderIQD: 5000,
        estimatedPrepMins: 10,
        items: [
          { id: 'item-301', nameAr: 'حقيبة إسعافات أولية متكاملة', priceIQD: 15000, category: 'مستلزمات', isAvailable: true },
          { id: 'item-302', nameAr: 'فيتامين C فوار (علبة 20 قرص)', priceIQD: 4500, category: 'مكملات', isAvailable: true },
          { id: 'item-303', nameAr: 'جهاز قياس ضغط إلكتروني معتمد', priceIQD: 32000, category: 'أجهزة طبية', isAvailable: true }
        ]
      },
      {
        id: 'store-4',
        nameAr: 'حلويات الخاصكي الشهيرة - الكاظمية',
        category: 'sweets',
        cityId: 'baghdad',
        location: { lat: 33.3810, lng: 44.3410 },
        address: 'شارع المحيط، الكاظمية، بغداد',
        rating: 4.98,
        totalOrders: 4200,
        isOpen: true,
        logo: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=150&auto=format&fit=crop&q=80',
        minimumOrderIQD: 8000,
        estimatedPrepMins: 15,
        items: [
          { id: 'item-401', nameAr: 'بقلاوة بغدادية بالجوز والدهن الحر (1 كغم)', priceIQD: 16000, category: 'حلويات شرقية', isAvailable: true },
          { id: 'item-402', nameAr: 'حلاوة دهين النجف الفاخرة بالأعشاب', priceIQD: 10000, category: 'دهين', isAvailable: true },
          { id: 'item-403', nameAr: 'زنود الست قشطة طازجة (صحن كبير)', priceIQD: 12000, category: 'حلويات', isAvailable: true }
        ]
      },
      {
        id: 'store-5',
        nameAr: 'مثلجات الرواد والفستق الحلبي - المنصور',
        category: 'ice_cream',
        cityId: 'baghdad',
        location: { lat: 33.3100, lng: 44.3610 },
        address: 'تقاطع الرواد، المنصور، بغداد',
        rating: 4.85,
        totalOrders: 2100,
        isOpen: true,
        logo: 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?w=150&auto=format&fit=crop&q=80',
        minimumOrderIQD: 5000,
        estimatedPrepMins: 10,
        items: [
          { id: 'item-501', nameAr: 'دوندرمة عراقية طبيعية بالفستق الحلبي (1 كغم)', priceIQD: 12000, category: 'مثلجات', isAvailable: true },
          { id: 'item-502', nameAr: 'كأس آيس كريم فواكه مشكلة مع مكسرات', priceIQD: 4000, category: 'كؤوس', isAvailable: true }
        ]
      },
      {
        id: 'store-6',
        nameAr: 'متجر القرطاسية والمكتبات الحديثة - باب المعظم',
        category: 'local_store',
        cityId: 'baghdad',
        location: { lat: 33.3550, lng: 44.3850 },
        address: 'ساحة الميدان، باب المعظم، بغداد',
        rating: 4.75,
        totalOrders: 650,
        isOpen: true,
        logo: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=150&auto=format&fit=crop&q=80',
        minimumOrderIQD: 4000,
        estimatedPrepMins: 10,
        items: [
          { id: 'item-601', nameAr: 'حقيبة مدرسية متينة مع مقلمة وأدوات', priceIQD: 22000, category: 'حقائب', isAvailable: true },
          { id: 'item-602', nameAr: 'دفاتر جامعية 200 صفحة (حزمة 5 دفاتر)', priceIQD: 8000, category: 'دفاتر', isAvailable: true }
        ]
      }
    ];

    this.data.orders = [];
    this.save();
  }

  public getDeliveryDrivers(cityId?: string): DeliveryDriverEntity[] {
    if (cityId) {
      return this.data.deliveryDrivers.filter(d => d.cityId === cityId);
    }
    return this.data.deliveryDrivers;
  }

  public getDeliveryDriverById(id: string): DeliveryDriverEntity | undefined {
    return this.data.deliveryDrivers.find(d => d.id === id);
  }

  public updateDeliveryDriverLocation(id: string, lat: number, lng: number, heading: number = 0, speed: number = 0): DeliveryDriverEntity | null {
    const courier = this.data.deliveryDrivers.find(d => d.id === id);
    if (!courier) return null;
    courier.currentLocation = { lat, lng };
    courier.heading = heading;
    courier.speed = speed;
    courier.updatedAt = new Date().toISOString();
    this.save();
    return courier;
  }

  public updateDeliveryDriverStatus(id: string, isOnline: boolean): DeliveryDriverEntity | null {
    const courier = this.data.deliveryDrivers.find(d => d.id === id);
    if (!courier) return null;
    courier.isOnline = isOnline;
    if (!isOnline) courier.isBusy = false;
    courier.updatedAt = new Date().toISOString();
    this.save();
    return courier;
  }

  public getStores(category?: string, cityId?: string): StoreEntity[] {
    let result = this.data.stores;
    if (category) {
      result = result.filter(s => s.category === category);
    }
    if (cityId) {
      result = result.filter(s => s.cityId === cityId);
    }
    return result;
  }

  public getStoreById(id: string): StoreEntity | undefined {
    return this.data.stores.find(s => s.id === id);
  }

  public getOrders(customerId?: string): OrderEntity[] {
    if (customerId) {
      return this.data.orders.filter(o => o.customerId === customerId);
    }
    return this.data.orders;
  }

  public getOrderById(id: string): OrderEntity | undefined {
    return this.data.orders.find(o => o.id === id);
  }

  public createOrder(orderData: Partial<OrderEntity>): OrderEntity {
    const orderId = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const store = this.getStoreById(orderData.storeId || 'store-1');
    const storeLat = store?.location?.lat || 33.3125;
    const storeLng = store?.location?.lng || 44.3562;
    const storeAddress = store?.address || 'حي المنصور، شارع 14 رمضان، بغداد';
    const storeLogo = store?.logo || '';

    const newOrder: OrderEntity = {
      id: orderId,
      customerId: orderData.customerId || 'usr_pass_01',
      customerName: orderData.customerName || 'زبون دانيال',
      customerPhone: orderData.customerPhone || '+964 770 000 0000',
      storeId: orderData.storeId || 'store-1',
      storeName: store?.nameAr || orderData.storeName || 'متجر دانيال',
      storeCategory: store?.category || orderData.storeCategory || 'restaurant',
      storeLat,
      storeLng,
      storeAddress,
      storeLogo,
      items: orderData.items || [],
      subtotalIQD: orderData.subtotalIQD || 15000,
      deliveryFeeIQD: orderData.deliveryFeeIQD || 3000,
      totalAmountIQD: (orderData.subtotalIQD || 15000) + (orderData.deliveryFeeIQD || 3000),
      paymentMethod: orderData.paymentMethod || 'cash',
      paymentStatus: 'pending',
      deliveryAddress: orderData.deliveryAddress || { name: 'بغداد - المنصور', lat: 33.3150, lng: 44.3660 },
      status: 'PENDING',
      candidateCourierIds: [],
      rejectedCourierIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Find nearby available couriers (within 10 km)
    const nearbyCouriers = this.findNearbyCouriers(newOrder.deliveryAddress.lat, newOrder.deliveryAddress.lng, 10);
    newOrder.candidateCourierIds = nearbyCouriers.map(c => c.id);
    if (newOrder.candidateCourierIds.length > 0) {
      newOrder.currentCandidateCourierId = newOrder.candidateCourierIds[0];
      newOrder.dispatchExpiresAt = Date.now() + 15000;
    }

    this.data.orders.unshift(newOrder);
    this.save();
    return newOrder;
  }

  public updateOrderStatus(orderId: string, status: string, extraData?: any): OrderEntity | null {
    const order = this.data.orders.find(o => o.id === orderId);
    if (!order) return null;

    order.status = status as any;
    order.updatedAt = new Date().toISOString();

    if (extraData?.courierId) {
      order.courierId = extraData.courierId;
      const courier = this.getDeliveryDriverById(extraData.courierId);
      if (courier) {
        order.courierName = courier.name;
        order.courierPhone = courier.phone;
        courier.isBusy = (status !== 'DELIVERED' && status !== 'CANCELLED');
        if (status === 'DELIVERED') {
          courier.totalDeliveries += 1;
          courier.todayEarningsIQD += order.deliveryFeeIQD;
          courier.walletBalanceIQD += order.deliveryFeeIQD;
        }
      }
    }

    if (status === 'DELIVERED') {
      order.paymentStatus = 'paid';
      this.data.platformStats.totalRevenueIQD += order.totalAmountIQD;
      this.data.platformStats.totalCommissionIQD += Math.round(order.deliveryFeeIQD * 0.15);
    }

    this.save();
    return order;
  }

  public findNearbyCouriers(lat: number, lng: number, radiusKm: number = 10): DeliveryDriverEntity[] {
    return this.data.deliveryDrivers
      .filter(c => c.isOnline && !c.isBusy)
      .map(c => {
        const dLat = (c.currentLocation.lat - lat) * 111;
        const dLng = (c.currentLocation.lng - lng) * 93;
        const distKm = Math.hypot(dLat, dLng);
        return { courier: c, distKm };
      })
      .filter(item => item.distKm <= radiusKm)
      .sort((a, b) => a.distKm - b.distKm)
      .map(item => item.courier);
  }

  public assignCourierToOrder(orderId: string, courierId: string): OrderEntity | null {
    const order = this.data.orders.find(o => o.id === orderId);
    if (!order) return null;

    const courier = this.getDeliveryDriverById(courierId);
    if (!courier) return null;

    order.courierId = courier.id;
    order.courierName = courier.name;
    order.courierPhone = courier.phone;
    order.status = 'COURIER_ASSIGNED';
    order.updatedAt = new Date().toISOString();
    courier.isBusy = true;

    this.save();
    return order;
  }
}

export const db = new IraqiRideDatabase();

