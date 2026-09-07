import { Driver, SupportTicket, Trip } from '../types';

export const INITIAL_DRIVERS: Driver[] = [
  {
    id: 'drv-1',
    name: 'كابتن مصطفى السعدي',
    phone: '07701234567',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    rating: 4.92,
    totalTrips: 1840,
    isOnline: true,
    isBusy: false,
    cityId: 'baghdad',
    currentLocation: { lat: 33.3160, lng: 44.3580 },
    heading: 45,
    car: {
      make: 'هيونداي',
      model: 'إلنترا 2023',
      year: 2023,
      color: 'فضي معدني',
      plateNumber: 'بغداد 63921 - خصوصي',
      tier: 'economy'
    },
    walletBalanceIQD: 185000,
    todayEarningsIQD: 52000,
    acceptanceRate: 98,
    joinedDate: '2023-04-12',
    kycVerified: true,
    gender: 'male'
  },
  {
    id: 'drv-2',
    name: 'كابتن حيدر الكرخي',
    phone: '07809876543',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    rating: 4.88,
    totalTrips: 2410,
    isOnline: true,
    isBusy: false,
    cityId: 'baghdad',
    currentLocation: { lat: 33.3050, lng: 44.4220 },
    heading: 120,
    car: {
      make: 'تويوتا',
      model: 'كامري VIP 2024',
      year: 2024,
      color: 'أسود ملكي',
      plateNumber: 'بغداد 88120 - خصوصي',
      tier: 'comfort_vip'
    },
    walletBalanceIQD: 420000,
    todayEarningsIQD: 94000,
    acceptanceRate: 96,
    joinedDate: '2022-11-05',
    kycVerified: true,
    gender: 'male'
  },
  {
    id: 'drv-3',
    name: 'كابتن رند التميمي (كابتن سيدة)',
    phone: '07715554433',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    rating: 4.97,
    totalTrips: 1120,
    isOnline: true,
    isBusy: false,
    cityId: 'baghdad',
    currentLocation: { lat: 33.3260, lng: 44.3460 },
    heading: 210,
    car: {
      make: 'تويوتا',
      model: 'كورولا كروس 2024',
      year: 2024,
      color: 'أبيض لؤلؤي',
      plateNumber: 'بغداد 19455 - خصوصي',
      tier: 'women_taxi'
    },
    walletBalanceIQD: 290000,
    todayEarningsIQD: 68000,
    acceptanceRate: 99,
    joinedDate: '2023-08-20',
    kycVerified: true,
    gender: 'female'
  },
  {
    id: 'drv-4',
    name: 'كابتن ئاراس هوليري (أربيل)',
    phone: '07501112233',
    avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    rating: 4.90,
    totalTrips: 980,
    isOnline: true,
    isBusy: false,
    cityId: 'erbil',
    currentLocation: { lat: 36.2010, lng: 43.9910 },
    heading: 90,
    car: {
      make: 'كيا',
      model: 'سيراتو 2023',
      year: 2023,
      color: 'رصاصي',
      plateNumber: 'أربيل 48211 - خصوصي',
      tier: 'economy'
    },
    walletBalanceIQD: 160000,
    todayEarningsIQD: 45000,
    acceptanceRate: 95,
    joinedDate: '2024-01-10',
    kycVerified: true,
    gender: 'male'
  },
  {
    id: 'drv-5',
    name: 'كابتن علي البصراوي',
    phone: '07812223344',
    avatar: 'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=150&auto=format&fit=crop&q=80',
    rating: 4.85,
    totalTrips: 1530,
    isOnline: true,
    isBusy: false,
    cityId: 'basra',
    currentLocation: { lat: 30.5180, lng: 47.8110 },
    heading: 180,
    car: {
      make: 'نيسان',
      model: 'صني 2022',
      year: 2022,
      color: 'أبيض',
      plateNumber: 'البصرة 91044 - خصوصي',
      tier: 'economy'
    },
    walletBalanceIQD: 215000,
    todayEarningsIQD: 38000,
    acceptanceRate: 94,
    joinedDate: '2023-02-18',
    kycVerified: true,
    gender: 'male'
  }
];

export const INITIAL_SUPPORT_TICKETS: SupportTicket[] = [
  {
    id: 'TCK-8821',
    tripId: 'TRP-1092',
    userName: 'سارة خالد المنصوري',
    userRole: 'passenger',
    subject: 'نسيان حقيبة يد صغيرة في المقعد الخلفي',
    priority: 'high',
    status: 'investigating',
    createdAt: 'منذ 15 دقيقة',
    messages: [
      {
        sender: 'user',
        text: 'مرحبا، نسيت حقيبة يدي السوداء في المقعد الخلفي للسيارة بعد نزولي في مول المنصور. الرحلة كانت مع كابتن مصطفى.',
        time: '14:20'
      },
      {
        sender: 'agent',
        text: 'أهلاً بكِ سارة. تم التواصل المباشر مع الكابتن مصطفى وتأكيد وجود الحقيبة. سيقوم الكابتن بتسليمها لكِ فوراً.',
        time: '14:25'
      }
    ]
  },
  {
    id: 'TCK-8820',
    tripId: 'TRP-1088',
    userName: 'كابتن حيدر الكرخي',
    userRole: 'driver',
    subject: 'استفسار حول تحويل رصيد المحفظة إلى زين كاش',
    priority: 'medium',
    status: 'resolved',
    createdAt: 'منذ ساعتين',
    messages: [
      {
        sender: 'user',
        text: 'طلبت سحب أرباحي بقيمة 250,000 دينار إلى محفظة زين كاش ولم يصل الإشعار بعد.',
        time: '12:10'
      },
      {
        sender: 'agent',
        text: 'تمت مراجعة عملية التحويل وتأكيدها بنجاح عبر بوابة ZainCash المباشرة، الرصيد وصل لحسابكم الآن.',
        time: '12:14'
      }
    ]
  },
  {
    id: 'TCK-8819',
    tripId: 'TRP-1075',
    userName: 'أحمد جاسم العاني',
    userRole: 'passenger',
    subject: 'طلب كود خصم بدل تأخير وصول السائق بسبب ازدحام جسر الجادرية',
    priority: 'low',
    status: 'resolved',
    createdAt: 'منذ 4 ساعات',
    messages: [
      {
        sender: 'user',
        text: 'السائق تأخر 12 دقيقة بسبب السيطرة على الجسر.',
        time: '10:05'
      },
      {
        sender: 'agent',
        text: 'نعتذر عن التأخير الناتج عن الازدحام المروري، تم إضافة رصيد بقيمة 3,000 د.ع كهدية في محفظتك لاستخدامها في مشوارك القادم.',
        time: '10:08'
      }
    ]
  }
];

export const INITIAL_PAST_TRIPS: Trip[] = [
  {
    id: 'TRP-9021',
    passengerName: 'عبدالله البغدادي',
    passengerPhone: '07705559988',
    passengerRating: 4.95,
    cityId: 'baghdad',
    pickup: {
      id: 'bg-1',
      name: 'مول المنصور - شارع الرواد',
      district: 'المنصور',
      cityId: 'baghdad',
      category: 'mall',
      lat: 33.3135,
      lng: 44.3540
    },
    dropoff: {
      id: 'bg-2',
      name: 'الكرادة داخل - تقاطع المسبح',
      district: 'الكرادة',
      cityId: 'baghdad',
      category: 'street',
      lat: 33.3021,
      lng: 44.4285
    },
    tier: 'economy',
    status: 'completed',
    estimatedDistanceKm: 8.4,
    estimatedDurationMins: 22,
    actualDistanceKm: 8.6,
    actualDurationMins: 24,
    basePriceIQD: 6500,
    surgeMultiplier: 1.2,
    totalPriceIQD: 7800,
    paymentMethod: 'zaincash',
    driverId: 'drv-1',
    createdAt: Date.now() - 3600000 * 2,
    startedAt: Date.now() - 3600000 * 2 + 300000,
    completedAt: Date.now() - 3600000 * 2 + 1800000,
    progressPercent: 100,
    passengerReview: {
      rating: 5,
      comment: 'سائق محترم والسيارة نظيفة ومكيفة، شكراً كابتن مصطفى',
      tipIQD: 1000
    }
  },
  {
    id: 'TRP-9022',
    passengerName: 'مريم الجبوري',
    passengerPhone: '07801122334',
    passengerRating: 4.89,
    cityId: 'baghdad',
    pickup: {
      id: 'bg-7',
      name: 'زيونة - شارع الربيعي',
      district: 'زيونة',
      cityId: 'baghdad',
      category: 'street',
      lat: 33.3280,
      lng: 44.4450
    },
    dropoff: {
      id: 'bg-8',
      name: 'مطار بغداد الدولي - صالة بابل',
      district: 'المطار',
      cityId: 'baghdad',
      category: 'airport',
      lat: 33.2625,
      lng: 44.2345
    },
    tier: 'comfort_vip',
    status: 'completed',
    estimatedDistanceKm: 24.2,
    estimatedDurationMins: 35,
    actualDistanceKm: 24.5,
    actualDurationMins: 38,
    basePriceIQD: 22000,
    surgeMultiplier: 1.0,
    totalPriceIQD: 22000,
    paymentMethod: 'qi_card',
    driverId: 'drv-2',
    createdAt: Date.now() - 3600000 * 5,
    startedAt: Date.now() - 3600000 * 5 + 400000,
    completedAt: Date.now() - 3600000 * 5 + 2600000,
    progressPercent: 100,
    passengerReview: {
      rating: 5,
      comment: 'خدمة راقية جداً ووصلت للمطار في الموعد تماماً',
      tipIQD: 2500
    }
  }
];
