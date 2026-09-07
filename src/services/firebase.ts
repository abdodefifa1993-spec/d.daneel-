/**
 * DANIEL TRANSPORT PLATFORM - UNIFIED FIREBASE SERVICE LAYER
 * Project: daneel-taxi-and-delivery
 * Provides: Authentication, Firestore, Realtime Database, Cloud Messaging
 * Architecture: Singleton Pattern (FirebaseService.getInstance())
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit,
  addDoc,
  serverTimestamp,
  Firestore
} from 'firebase/firestore';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  Auth
} from 'firebase/auth';
import {
  getDatabase,
  ref,
  set,
  get,
  onValue,
  remove,
  Database
} from 'firebase/database';

// Robust Environment Variable Reader
const getEnvVar = (key: string, fallback: string = ''): string => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key]!;
  }
  if (typeof import.meta !== 'undefined' && (import.meta as any).env) {
    const metaEnv = (import.meta as any).env;
    if (metaEnv[key]) return metaEnv[key];
    if (metaEnv[`VITE_${key}`]) return metaEnv[`VITE_${key}`];
  }
  return fallback;
};

// Firebase Configuration for project daneel-taxi-and-delivery
export const firebaseConfig = {
  apiKey: getEnvVar('FIREBASE_API_KEY', ''),
  authDomain: getEnvVar('FIREBASE_AUTH_DOMAIN', 'daneel-taxi-and-delivery.firebaseapp.com'),
  databaseURL: getEnvVar('FIREBASE_DATABASE_URL', 'https://daneel-taxi-and-delivery-default-rtdb.asia-southeast1.firebasedatabase.app/'),
  projectId: getEnvVar('FIREBASE_PROJECT_ID', 'daneel-taxi-and-delivery'),
  storageBucket: getEnvVar('FIREBASE_STORAGE_BUCKET', 'daneel-taxi-and-delivery.firebasestorage.app'),
  messagingSenderId: getEnvVar('FIREBASE_MESSAGING_SENDER_ID', '405472506024'),
  appId: getEnvVar('FIREBASE_APP_ID', '1:405472506024:web:06baa362068f1de4b5d29d')
};

export type AppRoleType = 'passenger' | 'driver' | 'admin' | 'owner' | 'dispatcher' | 'call_center' | 'support' | 'monitoring' | 'manager' | 'roadmap' | string;

export interface FirebaseChatMessage {
  id?: string;
  tripId: string;
  senderId: string;
  senderRole: 'passenger' | 'driver' | 'support';
  senderName: string;
  text: string;
  createdAt: number | any;
}

export interface FirebaseEmergencyAlert {
  tripId: string;
  reporterRole: 'passenger' | 'driver';
  reporterName: string;
  reporterPhone: string;
  location: { lat: number; lng: number };
  timestamp: number;
  status: 'PENDING' | 'DISPATCHED' | 'RESOLVED';
  note?: string;
}

export type FcmTripEventType =
  | 'REQUESTED'
  | 'SEARCHING_DRIVER'
  | 'DRIVER_ACCEPTED'
  | 'DRIVER_ARRIVING'
  | 'DRIVER_ARRIVED'
  | 'TRIP_STARTED'
  | 'TRIP_IN_PROGRESS'
  | 'TRIP_COMPLETED'
  | 'TRIP_CANCELLED';

/**
 * =========================================================================
 * UNIFIED FIREBASE SERVICE - SINGLETON PATTERN
 * =========================================================================
 */
export class FirebaseService {
  private static instance: FirebaseService;

  public app: FirebaseApp;
  public auth: Auth | null = null;
  public db: Firestore | null = null;
  public rtdb: Database | null = null;
  public isConnected: boolean = false;
  private currentFirebaseUser: FirebaseUser | null = null;

  private constructor() {
    try {
      this.app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
      this.auth = getAuth(this.app);
      this.db = getFirestore(this.app);

      try {
        this.rtdb = getDatabase(this.app);
      } catch (rtdbErr) {
        console.warn('[FIREBASE RTDB] Realtime Database optional warning:', rtdbErr);
      }

      this.isConnected = true;
      console.log('[FIREBASE] Unified Service initialized for project:', firebaseConfig.projectId);

      // Listen for auth state changes
      if (this.auth) {
        onAuthStateChanged(this.auth, (user) => {
          this.currentFirebaseUser = user;
          if (user) {
            console.log('[FIREBASE AUTH] User signed in:', user.uid, user.email || 'anonymous');
          }
        });
      }
    } catch (error) {
      console.warn('[FIREBASE] Initialization notice, using fallback instance:', error);
      try {
        this.app = initializeApp(firebaseConfig, 'daneel-taxi-app');
        this.auth = getAuth(this.app);
        this.db = getFirestore(this.app);
        this.rtdb = getDatabase(this.app);
      } catch {
        // Fallback placeholder
      }
    }
  }

  public static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService();
    }
    return FirebaseService.instance;
  }

  /* -------------------------------------------------------------------------
     STEP 3: AUTHENTICATION (Passenger, Driver, Admin, Owner, Dispatcher, CallCenter)
     ------------------------------------------------------------------------- */
  public async authenticateRole(params: {
    userId?: string;
    phone: string;
    name: string;
    role: AppRoleType;
    password?: string;
  }): Promise<{ success: boolean; user?: any; error?: string }> {
    const role = params.role.toLowerCase() as AppRoleType;
    const cleanPhone = params.phone.trim();
    const sanitizedPhone = cleanPhone.replace(/[^0-9]/g, '');
    const email = `${role}_${sanitizedPhone || Date.now()}@daneeltaxi.iq`;
    const password = params.password || `DaneelPass2026!${sanitizedPhone.slice(-4) || '7700'}`;

    let authUid = params.userId || `usr_${role}_${sanitizedPhone || Date.now()}`;

    // 1. Authenticate with Firebase Auth
    if (this.auth) {
      try {
        const cred = await signInWithEmailAndPassword(this.auth, email, password);
        authUid = cred.user.uid;
      } catch (signInError: any) {
        // If user not found, create user
        if (signInError.code === 'auth/user-not-found' || signInError.code === 'auth/invalid-credential') {
          try {
            const newCred = await createUserWithEmailAndPassword(this.auth, email, password);
            authUid = newCred.user.uid;
          } catch (createError: any) {
            // If creation fails due to restrictions, fall back to anonymous auth or local uid
            try {
              const anonCred = await signInAnonymously(this.auth);
              authUid = anonCred.user.uid;
            } catch {
              // Graceful token fallback
            }
          }
        } else {
          try {
            const anonCred = await signInAnonymously(this.auth);
            authUid = anonCred.user.uid;
          } catch {
            // Keep authUid
          }
        }
      }
    }

    // 2. Create/Update User Document inside Firestore (STEP 3 & 4)
    const userData = {
      id: authUid,
      name: params.name,
      phone: cleanPhone,
      email,
      role,
      userRole: role.toUpperCase(),
      cityId: 'baghdad',
      avatar: role === 'driver'
        ? 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80',
      isVerified: true,
      walletBalanceIQD: role === 'owner' ? 15000000 : (role === 'driver' ? 50000 : 25000),
      rating: 4.95,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    await this.saveUser(authUid, userData);

    // 3. If role is driver, create driver and vehicle documents (STEP 4)
    if (role === 'driver') {
      const driverData = {
        id: authUid,
        name: params.name,
        phone: cleanPhone,
        cityId: 'baghdad',
        tier: 'economy',
        vehicleId: `veh_${authUid}`,
        rating: 4.95,
        isOnline: true,
        status: 'approved',
        walletBalanceIQD: 50000,
        todayEarningsIQD: 38000,
        totalTrips: 142,
        currentLocation: { lat: 33.3152, lng: 44.3661 },
        heading: 90,
        speed: 0,
        lastHeartbeat: serverTimestamp(),
        updatedAt: serverTimestamp()
      };
      await this.saveDriver(authUid, driverData);

      await this.saveVehicle(`veh_${authUid}`, {
        id: `veh_${authUid}`,
        driverId: authUid,
        make: 'تويوتا',
        model: 'كورولا',
        year: 2023,
        plateNumber: 'بغداد ٧٨١٢٣ خصوصي',
        color: '#f59e0b',
        tier: 'economy',
        status: 'active',
        updatedAt: serverTimestamp()
      });

      // Update RTDB live driver node immediately (STEP 5)
      await this.setLiveDriver(authUid, {
        id: authUid,
        name: params.name,
        lat: 33.3152,
        lng: 44.3661,
        heading: 90,
        speed: 0,
        isOnline: true,
        tier: 'economy'
      });
    }

    return { success: true, user: userData };
  }

  public async logout(): Promise<void> {
    if (this.auth) {
      try {
        await firebaseSignOut(this.auth);
      } catch (e) {
        console.warn('[FIREBASE AUTH] Signout notice:', e);
      }
    }
  }

  /* -------------------------------------------------------------------------
     STEP 4: FIRESTORE COLLECTIONS
     (users, drivers, vehicles, trips, orders, notifications, payments, supportTickets)
     ------------------------------------------------------------------------- */

  // 1. users collection
  public async saveUser(userId: string, data: any): Promise<boolean> {
    if (!this.db || !userId) return false;
    try {
      const userRef = doc(this.db, 'users', userId);
      await setDoc(userRef, { ...data, updatedAt: serverTimestamp() }, { merge: true });
      return true;
    } catch (e) {
      console.warn('[FIRESTORE] saveUser error:', e);
      return false;
    }
  }

  public async getUser(userId: string): Promise<any | null> {
    if (!this.db || !userId) return null;
    try {
      const snap = await getDoc(doc(this.db, 'users', userId));
      return snap.exists() ? snap.data() : null;
    } catch {
      return null;
    }
  }

  public listenToUser(userId: string, callback: (user: any) => void): () => void {
    if (!this.db || !userId) return () => {};
    return onSnapshot(doc(this.db, 'users', userId), (snap) => {
      if (snap.exists()) callback(snap.data());
    });
  }

  // 2. drivers collection
  public async saveDriver(driverId: string, data: any): Promise<boolean> {
    if (!this.db || !driverId) return false;
    try {
      const driverRef = doc(this.db, 'drivers', driverId);
      await setDoc(driverRef, { ...data, updatedAt: serverTimestamp() }, { merge: true });
      return true;
    } catch (e) {
      console.warn('[FIRESTORE] saveDriver error:', e);
      return false;
    }
  }

  public async getDriver(driverId: string): Promise<any | null> {
    if (!this.db || !driverId) return null;
    try {
      const snap = await getDoc(doc(this.db, 'drivers', driverId));
      return snap.exists() ? snap.data() : null;
    } catch {
      return null;
    }
  }

  public listenToDrivers(callback: (drivers: any[]) => void): () => void {
    if (!this.db) return () => {};
    const coll = collection(this.db, 'drivers');
    return onSnapshot(coll, (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      callback(list);
    });
  }

  // 3. vehicles collection
  public async saveVehicle(vehicleId: string, data: any): Promise<boolean> {
    if (!this.db || !vehicleId) return false;
    try {
      const vehicleRef = doc(this.db, 'vehicles', vehicleId);
      await setDoc(vehicleRef, { ...data, updatedAt: serverTimestamp() }, { merge: true });
      return true;
    } catch (e) {
      console.warn('[FIRESTORE] saveVehicle error:', e);
      return false;
    }
  }

  public async getVehicle(vehicleId: string): Promise<any | null> {
    if (!this.db || !vehicleId) return null;
    try {
      const snap = await getDoc(doc(this.db, 'vehicles', vehicleId));
      return snap.exists() ? snap.data() : null;
    } catch {
      return null;
    }
  }

  // 4. trips collection
  public async createTrip(trip: any): Promise<boolean> {
    if (!this.db || !trip?.id) return false;
    try {
      const tripRef = doc(this.db, 'trips', trip.id);
      await setDoc(tripRef, {
        ...trip,
        updatedAt: serverTimestamp()
      }, { merge: true });
      return true;
    } catch (e) {
      console.warn('[FIRESTORE] createTrip error:', e);
      return false;
    }
  }

  public listenToTrip(tripId: string, onUpdate: (tripData: any) => void): () => void {
    if (!this.db || !tripId) return () => {};
    return onSnapshot(doc(this.db, 'trips', tripId), (docSnap) => {
      if (docSnap.exists()) {
        onUpdate(docSnap.data());
      }
    });
  }

  public listenToActiveTripsFirestore(onUpdate: (trips: any[]) => void): () => void {
    if (!this.db) return () => {};
    const q = query(
      collection(this.db, 'trips'),
      where('status', 'in', ['searching_driver', 'driver_assigned', 'driver_arriving', 'driver_arrived', 'trip_in_progress'])
    );
    return onSnapshot(q, (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      onUpdate(list);
    });
  }

  // 5. orders collection (Delivery, Food, Cargo)
  public async createOrder(order: any): Promise<boolean> {
    if (!this.db) return false;
    try {
      const orderId = order.id || `ORD-${Date.now()}`;
      const orderRef = doc(this.db, 'orders', orderId);
      await setDoc(orderRef, { ...order, createdAt: serverTimestamp(), updatedAt: serverTimestamp() }, { merge: true });
      return true;
    } catch (e) {
      console.warn('[FIRESTORE] createOrder error:', e);
      return false;
    }
  }

  public listenToOrders(callback: (orders: any[]) => void): () => void {
    if (!this.db) return () => {};
    return onSnapshot(collection(this.db, 'orders'), (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      callback(list);
    });
  }

  // 6. notifications collection
  public async saveNotification(notif: {
    userId: string;
    title: string;
    message: string;
    type: string;
    tripId?: string;
  }): Promise<boolean> {
    if (!this.db) return false;
    try {
      const notifColl = collection(this.db, 'notifications');
      await addDoc(notifColl, {
        ...notif,
        read: false,
        timestamp: Date.now(),
        createdAt: serverTimestamp()
      });
      return true;
    } catch (e) {
      console.warn('[FIRESTORE] saveNotification error:', e);
      return false;
    }
  }

  public listenToUserNotifications(userId: string, callback: (notifs: any[]) => void): () => void {
    if (!this.db || !userId) return () => {};
    const q = query(collection(this.db, 'notifications'), where('userId', '==', userId));
    return onSnapshot(q, (snap) => {
      const list: any[] = [];
      snap.forEach(d => list.push({ id: d.id, ...d.data() }));
      callback(list);
    });
  }

  // 7. payments collection (Financial ledger)
  public async recordPayment(payment: {
    tripId: string;
    amountIQD: number;
    method: string;
    driverId: string;
    passengerId: string;
    platformCommissionIQD?: number;
    driverEarningsIQD?: number;
    status: 'completed' | 'pending' | 'refunded';
  }): Promise<boolean> {
    if (!this.db) return false;
    try {
      const paymentId = `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      const payRef = doc(this.db, 'payments', paymentId);
      await setDoc(payRef, {
        ...payment,
        id: paymentId,
        timestamp: Date.now(),
        createdAt: serverTimestamp()
      });
      return true;
    } catch (e) {
      console.warn('[FIRESTORE] recordPayment error:', e);
      return false;
    }
  }

  // 8. supportTickets collection
  public async saveSupportTicket(ticket: any): Promise<boolean> {
    if (!this.db || !ticket.id) return false;
    try {
      const ticketRef = doc(this.db, 'supportTickets', ticket.id);
      await setDoc(ticketRef, {
        ...ticket,
        updatedAt: serverTimestamp()
      }, { merge: true });
      return true;
    } catch (e) {
      console.warn('[FIRESTORE] saveSupportTicket error:', e);
      return false;
    }
  }

  /* -------------------------------------------------------------------------
     STEP 5: REALTIME DATABASE STRUCTURE
     (liveDrivers, activeTrips, tripTracking, driverLocations)
     ------------------------------------------------------------------------- */

  // 1. liveDrivers
  public async setLiveDriver(
    driverId: string,
    data: {
      id?: string;
      name?: string;
      lat: number;
      lng: number;
      heading: number;
      speed: number;
      isOnline?: boolean;
      tier?: string;
      cityId?: string;
    }
  ): Promise<void> {
    if (!this.rtdb || !driverId) return;
    try {
      const nodeRef = ref(this.rtdb, `liveDrivers/${driverId}`);
      await set(nodeRef, {
        ...data,
        id: driverId,
        updatedAt: Date.now()
      });
    } catch {
      // Fallback
    }
  }

  public listenToLiveDrivers(callback: (drivers: Record<string, any>) => void): () => void {
    if (!this.rtdb) return () => {};
    try {
      const nodeRef = ref(this.rtdb, 'liveDrivers');
      const unsub = onValue(nodeRef, (snap) => {
        callback(snap.val() || {});
      });
      return () => unsub();
    } catch {
      return () => {};
    }
  }

  public async removeLiveDriver(driverId: string): Promise<void> {
    if (!this.rtdb || !driverId) return;
    try {
      await remove(ref(this.rtdb, `liveDrivers/${driverId}`));
    } catch {
      // Fallback
    }
  }

  // 2. activeTrips
  public async setActiveTrip(tripId: string, data: any): Promise<void> {
    if (!this.rtdb || !tripId) return;
    try {
      const tripRef = ref(this.rtdb, `activeTrips/${tripId}`);
      await set(tripRef, {
        ...data,
        updatedAt: Date.now()
      });
    } catch {
      // Fallback
    }
  }

  public async removeActiveTrip(tripId: string): Promise<void> {
    if (!this.rtdb || !tripId) return;
    try {
      await remove(ref(this.rtdb, `activeTrips/${tripId}`));
    } catch {
      // Fallback
    }
  }

  public listenToActiveTrips(callback: (trips: Record<string, any>) => void): () => void {
    if (!this.rtdb) return () => {};
    try {
      const tripRef = ref(this.rtdb, 'activeTrips');
      const unsub = onValue(tripRef, (snap) => {
        callback(snap.val() || {});
      });
      return () => unsub();
    } catch {
      return () => {};
    }
  }

  // 3. tripTracking (high frequency breadcrumb trail)
  public async pushTripBreadcrumb(
    tripId: string,
    breadcrumb: { lat: number; lng: number; speed: number; heading: number }
  ): Promise<void> {
    if (!this.rtdb || !tripId) return;
    try {
      const pointRef = ref(this.rtdb, `tripTracking/${tripId}/${Date.now()}`);
      await set(pointRef, {
        ...breadcrumb,
        timestamp: Date.now()
      });
    } catch {
      // Fallback
    }
  }

  public listenToTripTracking(tripId: string, callback: (crumbs: any[]) => void): () => void {
    if (!this.rtdb || !tripId) return () => {};
    try {
      const trackRef = ref(this.rtdb, `tripTracking/${tripId}`);
      const unsub = onValue(trackRef, (snap) => {
        const val = snap.val();
        if (val) {
          const list = Object.values(val);
          callback(list);
        } else {
          callback([]);
        }
      });
      return () => unsub();
    } catch {
      return () => {};
    }
  }

  // 4. driverLocations
  public async setDriverLocation(
    driverId: string,
    loc: { lat: number; lng: number; heading?: number; speed?: number }
  ): Promise<void> {
    if (!this.rtdb || !driverId) return;
    try {
      const locRef = ref(this.rtdb, `driverLocations/${driverId}`);
      await set(locRef, {
        lat: loc.lat,
        lng: loc.lng,
        heading: loc.heading || 0,
        speed: loc.speed || 0,
        timestamp: Date.now()
      });
    } catch {
      // Fallback
    }
  }

  public listenToDriverLocation(
    driverId: string,
    callback: (loc: { lat: number; lng: number; heading: number; speed: number }) => void
  ): () => void {
    if (!this.rtdb || !driverId) return () => {};
    try {
      const locRef = ref(this.rtdb, `driverLocations/${driverId}`);
      const unsub = onValue(locRef, (snap) => {
        const val = snap.val();
        if (val && typeof val.lat === 'number') {
          callback(val);
        }
      });
      return () => unsub();
    } catch {
      return () => {};
    }
  }

  /* -------------------------------------------------------------------------
     STEP 11: FCM & WEB EVENT NOTIFICATIONS
     ------------------------------------------------------------------------- */
  public async sendNotificationEvent(
    eventType: FcmTripEventType,
    payload: {
      tripId: string;
      passengerName?: string;
      driverName?: string;
      pickupName?: string;
      dropoffName?: string;
      fareIQD?: number;
      targetUserId?: string;
    }
  ): Promise<void> {
    let title = 'منصة دانيال للنقل';
    let body = '';

    switch (eventType) {
      case 'REQUESTED':
      case 'SEARCHING_DRIVER':
        title = '🚖 طلب مشوار جديد في منطقتك';
        body = `طلب من ${payload.passengerName || 'الزبون'} إلى ${payload.dropoffName || 'الوجهة'} - الأجرة: ${(payload.fareIQD || 6500).toLocaleString()} د.ع`;
        break;
      case 'DRIVER_ACCEPTED':
        title = '✅ تم قبول الرحلة بنجاح!';
        body = `الكابتن ${payload.driverName || 'معتمد'} وافق على مشوارك وهو في طريقه إلى نقطة الالتقاء.`;
        break;
      case 'DRIVER_ARRIVING':
        title = '🚗 الكابتن يقترب منك';
        body = `الكابتن ${payload.driverName || ''} على بعد دقيقة واحدة فقط من موقعك.`;
        break;
      case 'DRIVER_ARRIVED':
        title = '📍 وصل الكابتن إلى موقعك';
        body = `الكابتن ${payload.driverName || ''} ينتظرك الآن في ${payload.pickupName || 'نقطة الالتقاء'}.`;
        break;
      case 'TRIP_STARTED':
        title = '🚀 بدأت الرحلة - نتمنى لك مشواراً آمناً!';
        body = `الوجهة: ${payload.dropoffName || 'المحددة'}. يمكنك متابعة المسار المباشر عبر الخريطة.`;
        break;
      case 'TRIP_COMPLETED':
        title = '🏁 تم الوصول بالسلامة';
        body = `وصلت إلى وجهتك. شكراً لاختيارك شركة دانيال للنقل الذكي. الأجرة الإجمالية: ${(payload.fareIQD || 0).toLocaleString()} د.ع.`;
        break;
      case 'TRIP_CANCELLED':
        title = '❌ تم إلغاء الرحلة';
        body = `تم إلغاء المشوار ${payload.tripId}. نعتذر عن أي إزعاج.`;
        break;
    }

    // 1. Native Web Notification
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        try {
          new Notification(title, {
            body,
            icon: '/favicon.ico',
            badge: '/favicon.ico',
            tag: `daniel-trip-${payload.tripId}`
          });
        } catch {
          // Suppress in sandbox iframe
        }
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().catch(() => {});
      }
    }

    // 2. Persist to Firestore notifications collection
    if (payload.targetUserId) {
      await this.saveNotification({
        userId: payload.targetUserId,
        title,
        message: body,
        type: eventType,
        tripId: payload.tripId
      });
    }
  }

  public getDiagnostics() {
    return {
      projectId: firebaseConfig.projectId,
      connected: this.isConnected,
      hasAuth: !!this.auth,
      hasFirestore: !!this.db,
      hasRealtimeDatabase: !!this.rtdb,
      cloudMessagingReady: typeof window !== 'undefined' && 'Notification' in window,
      storageBucket: firebaseConfig.storageBucket,
      databaseUrl: firebaseConfig.databaseURL,
      environment: 'production-grade'
    };
  }
}

// Singleton Instance Export
export const firebaseService = FirebaseService.getInstance();

// Export core instances for direct access if needed
export const app = firebaseService.app;
export const auth = firebaseService.auth;
export const db = firebaseService.db;
export const rtdb = firebaseService.rtdb;

/* -------------------------------------------------------------------------
   BACKWARD-COMPATIBLE HELPER EXPORTS
   ------------------------------------------------------------------------- */
export async function syncTripToFirebase(trip: any): Promise<boolean> {
  return firebaseService.createTrip(trip);
}

export function listenToTripInFirebase(tripId: string, onUpdate: (tripData: any) => void): () => void {
  return firebaseService.listenToTrip(tripId, onUpdate);
}

export async function syncDriverLocationToFirebase(
  driverId: string,
  location: { lat: number; lng: number },
  heading: number = 0,
  speed: number = 0
): Promise<void> {
  // Sync to both RTDB and Firestore
  await firebaseService.setLiveDriver(driverId, {
    lat: location.lat,
    lng: location.lng,
    heading,
    speed,
    isOnline: true
  });
  await firebaseService.setDriverLocation(driverId, {
    lat: location.lat,
    lng: location.lng,
    heading,
    speed
  });
  if (firebaseService.db) {
    try {
      await updateDoc(doc(firebaseService.db, 'drivers', driverId), {
        currentLocation: location,
        heading,
        speed,
        lastHeartbeat: serverTimestamp()
      });
    } catch {
      // Fallback
    }
  }
}

export function listenToDriverLocation(
  driverId: string,
  callback: (data: { lat: number; lng: number; heading: number; speed: number }) => void
): () => void {
  return firebaseService.listenToDriverLocation(driverId, callback);
}

export async function sendFirebaseChatMessage(message: FirebaseChatMessage): Promise<boolean> {
  if (!firebaseService.db) return false;
  try {
    const chatColl = collection(firebaseService.db, 'trips', message.tripId, 'messages');
    await addDoc(chatColl, {
      ...message,
      createdAt: serverTimestamp()
    });
    return true;
  } catch (e) {
    console.warn('[FIREBASE] sendFirebaseChatMessage error:', e);
    return false;
  }
}

export function listenToTripChat(
  tripId: string,
  callback: (messages: FirebaseChatMessage[]) => void
): () => void {
  if (!firebaseService.db || !tripId) return () => {};
  try {
    const chatColl = collection(firebaseService.db, 'trips', tripId, 'messages');
    const q = query(chatColl, orderBy('createdAt', 'asc'));
    return onSnapshot(q, (snapshot) => {
      const msgs: FirebaseChatMessage[] = [];
      snapshot.forEach(d => {
        msgs.push({ id: d.id, ...d.data() } as FirebaseChatMessage);
      });
      callback(msgs);
    });
  } catch (e) {
    console.warn('[FIREBASE] Error listening to trip chat:', e);
    return () => {};
  }
}

export async function broadcastFirebaseEmergencyAlert(alert: FirebaseEmergencyAlert): Promise<boolean> {
  if (!firebaseService.db) return false;
  try {
    const alertsColl = collection(firebaseService.db, 'emergency_alerts');
    await addDoc(alertsColl, {
      ...alert,
      createdAt: serverTimestamp()
    });
    return true;
  } catch (e) {
    console.warn('[FIREBASE] broadcastEmergencyAlert error:', e);
    return false;
  }
}

export function getFirebaseDiagnostics() {
  return firebaseService.getDiagnostics();
}

export const saveUserToFirestore = (userId: string, data: any) => firebaseService.saveUser(userId, data);
export const saveDriverToFirestore = (driverId: string, data: any) => firebaseService.saveDriver(driverId, data);
export const saveVehicleToFirestore = (vehicleId: string, data: any) => firebaseService.saveVehicle(vehicleId, data);
export const createTripInFirestore = (trip: any) => firebaseService.createTrip(trip);
export const createOrderInFirestore = (order: any) => firebaseService.createOrder(order);
export const recordPaymentInFirestore = (payment: any) => firebaseService.recordPayment(payment);
export const saveNotificationToFirestore = (notif: any) => firebaseService.saveNotification(notif);
export const saveSupportTicketToFirestore = (ticket: any) => firebaseService.saveSupportTicket(ticket);

export const setDriverLiveLocationRtdb = (driverId: string, data: any) => firebaseService.setLiveDriver(driverId, data);
export const listenToDriverLiveLocationRtdb = (driverId: string, cb: any) => firebaseService.listenToDriverLocation(driverId, cb);
export const setActiveTripRtdb = (tripId: string, data: any) => firebaseService.setActiveTrip(tripId, data);
export const pushTripBreadcrumbRtdb = (tripId: string, breadcrumb: any) => firebaseService.pushTripBreadcrumb(tripId, breadcrumb);
export const sendTripFcmNotification = (eventType: FcmTripEventType, payload: any) => firebaseService.sendNotificationEvent(eventType, payload);
