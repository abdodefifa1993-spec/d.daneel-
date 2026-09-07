import { IraqiCity, IraqiCityId, LandmarkPoint, RideTier, PaymentOption, SurgeZone } from '../types';

export const IRAQI_CITIES: IraqiCity[] = [
  {
    id: 'baghdad',
    nameAr: 'بغداد (العاصمة)',
    nameEn: 'Baghdad',
    center: { lat: 33.3152, lng: 44.3661 },
    zoom: 13,
    popularDistricts: ['الكرادة', 'المنصور', 'زيونة', 'الجادرية', 'شارع فلسطين', 'اليرموك', 'حي الجامعة', 'الأعظمية', 'الكاظمية', 'شارع الرشيد']
  },
  {
    id: 'erbil',
    nameAr: 'أربيل (هەولێر)',
    nameEn: 'Erbil',
    center: { lat: 36.1901, lng: 44.0091 },
    zoom: 13,
    popularDistricts: ['شارع 100 متري', 'عينكاوة', 'القلعة', 'شارع 60 متري', 'طريق المطار', 'بختياري', 'دروازة']
  },
  {
    id: 'basra',
    nameAr: 'البصرة (الفايحة)',
    nameEn: 'Basra',
    center: { lat: 30.5081, lng: 47.7835 },
    zoom: 13,
    popularDistricts: ['شارع الجزائر', 'العشار', 'الجبيلة', 'الكورنيش', 'حي الأندلس', 'البراضعية', 'طريق المطار']
  },
  {
    id: 'najaf',
    nameAr: 'النجف الأشرف',
    nameEn: 'Najaf',
    center: { lat: 32.0259, lng: 44.3462 },
    zoom: 13,
    popularDistricts: ['شارع الروان', 'حي الغدير', 'شارع الكوفة', 'شارع المدينة', 'ساحة الصدرين', 'حي الأمير']
  },
  {
    id: 'karbala',
    nameAr: 'كربلاء المقدسة',
    nameEn: 'Karbala',
    center: { lat: 32.6160, lng: 44.0246 },
    zoom: 13,
    popularDistricts: ['شارع العباس', 'حي الحسين', 'شارع السناتر', 'حي المعلمين', 'طريق بغداد-كربلاء']
  },
  {
    id: 'sulaymaniyah',
    nameAr: 'السليمانية (سلێمانی)',
    nameEn: 'Sulaymaniyah',
    center: { lat: 35.5558, lng: 45.4351 },
    zoom: 13,
    popularDistricts: ['شارع سالم', 'سرجنار', 'توي ملك', 'قرداغ', 'رانيا']
  },
  {
    id: 'mosul',
    nameAr: 'الموصل (أم الربيعين)',
    nameEn: 'Mosul',
    center: { lat: 36.3400, lng: 43.1300 },
    zoom: 13,
    popularDistricts: ['حي الزهور', 'الغابات', 'المجموعة الثقافية', 'الزهراء', 'الدواسة']
  },
  {
    id: 'ramadi',
    nameAr: 'الرمادي (الأنبار)',
    nameEn: 'Ramadi',
    center: { lat: 33.4243, lng: 43.3000 },
    zoom: 13,
    popularDistricts: ['شارع 17 تموز', 'حي الضباط', 'التأميم', 'حي الأندلس', 'الورار', 'الحوز', 'الملعب']
  },
  {
    id: 'fallujah',
    nameAr: 'الفلوجة',
    nameEn: 'Fallujah',
    center: { lat: 33.3536, lng: 43.7844 },
    zoom: 13,
    popularDistricts: ['شارع 40', 'حي الشهداء', 'نزال', 'الجولان', 'حي المعلمين', 'حي الجمهورية', 'حي العسكري']
  },
  {
    id: 'hit',
    nameAr: 'هيت (مدينة النواعير)',
    nameEn: 'Hit',
    center: { lat: 33.6425, lng: 42.8272 },
    zoom: 14,
    popularDistricts: ['القلعة', 'الجريجة', 'حي المعلمين', 'البصيرة', 'حي العمال', 'الجمعية']
  }
];

export const IRAQI_LANDMARKS: LandmarkPoint[] = [
  // بغداد
  {
    id: 'bg-1',
    name: 'مول المنصور - شارع الرواد',
    popularLocalName: 'مول المنصور قرب تمثال أبو جعفر المنصور',
    district: 'المنصور',
    cityId: 'baghdad',
    category: 'mall',
    lat: 33.3135,
    lng: 44.3540
  },
  {
    id: 'bg-2',
    name: 'الكرادة داخل - تقاطع المسبح',
    popularLocalName: 'الكرادة داخل قرب مطعم صمد',
    district: 'الكرادة',
    cityId: 'baghdad',
    category: 'street',
    lat: 33.3021,
    lng: 44.4285
  },
  {
    id: 'bg-3',
    name: 'مول بغداد - الحارثية',
    popularLocalName: 'مول الحارثية مقابل مستشفى اليرموك',
    district: 'الحارثية',
    cityId: 'baghdad',
    category: 'mall',
    lat: 33.3102,
    lng: 44.3725
  },
  {
    id: 'bg-4',
    name: 'جامعة بغداد - مجمع الجادرية',
    popularLocalName: 'بوابة جامعة بغداد الجادرية قرب البرج',
    district: 'الجادرية',
    cityId: 'baghdad',
    category: 'university',
    lat: 33.2721,
    lng: 44.3820
  },
  {
    id: 'bg-5',
    name: 'مول بابلون - المنصور شارع 14 رمضان',
    popularLocalName: 'مول بابلون شارع 14 رمضان',
    district: 'المنصور',
    cityId: 'baghdad',
    category: 'mall',
    lat: 33.3210,
    lng: 44.3415
  },
  {
    id: 'bg-6',
    name: 'شارع فلسطين - تقاطع الصخرة',
    popularLocalName: 'شارع فلسطين قرب ساحة بيروت ونادي القوة الجوية',
    district: 'شارع فلسطين',
    cityId: 'baghdad',
    category: 'street',
    lat: 33.3450,
    lng: 44.4200
  },
  {
    id: 'bg-7',
    name: 'زيونة - شارع الربيعي',
    popularLocalName: 'شارع الربيعي قرب مول دريم سيتي ومطعم زرزور',
    district: 'زيونة',
    cityId: 'baghdad',
    category: 'street',
    lat: 33.3280,
    lng: 44.4450
  },
  {
    id: 'bg-8',
    name: 'مطار بغداد الدولي - صالة بابل',
    popularLocalName: 'مطار بغداد الدولي - بوابة المغادرين صالة بابل',
    district: 'المطار',
    cityId: 'baghdad',
    category: 'airport',
    lat: 33.2625,
    lng: 44.2345
  },
  {
    id: 'bg-9',
    name: 'ساحة التحرير وشارع السعدون',
    popularLocalName: 'ساحة التحرير ونصب الحرية - الباب الشرقي',
    district: 'الباب الشرقي',
    cityId: 'baghdad',
    category: 'square',
    lat: 33.3298,
    lng: 44.4089
  },
  {
    id: 'bg-10',
    name: 'الأعظمية - ساحة عنتر',
    popularLocalName: 'ساحة عنتر قرب جامع الإمام الأعظم أبو حنيفة',
    district: 'الأعظمية',
    cityId: 'baghdad',
    category: 'square',
    lat: 33.3712,
    lng: 44.3621
  },
  {
    id: 'bg-11',
    name: 'مدينة الكاظمية المقدسة',
    popularLocalName: 'ساحة عبد المحسن الكاظمي قرب العتبة الكاظمية',
    district: 'الكاظمية',
    cityId: 'baghdad',
    category: 'landmark',
    lat: 33.3805,
    lng: 44.3410
  },
  {
    id: 'bg-12',
    name: 'حي اليرموك - ساحة قحطان',
    popularLocalName: 'اليرموك الأربع شوارع قرب ساحة قحطان',
    district: 'اليرموك',
    cityId: 'baghdad',
    category: 'square',
    lat: 33.3015,
    lng: 44.3410
  },

  // أربيل
  {
    id: 'er-1',
    name: 'فاملي مول أربيل (Family Mall)',
    popularLocalName: 'فاملي مول - طريق 100 متري',
    district: 'شارع 100 متري',
    cityId: 'erbil',
    category: 'mall',
    lat: 36.2050,
    lng: 43.9850
  },
  {
    id: 'er-2',
    name: 'قلعة أربيل وسوق القيصرية',
    popularLocalName: 'مركز المدينة - أسفل القلعة قرب النافورة',
    district: 'القلعة',
    cityId: 'erbil',
    category: 'landmark',
    lat: 36.1912,
    lng: 44.0095
  },
  {
    id: 'er-3',
    name: 'عينكاوة - شارع المنتزه',
    popularLocalName: 'عينكاوة قرب مطاعم ومقاهي السريان',
    district: 'عينكاوة',
    cityId: 'erbil',
    category: 'street',
    lat: 36.2280,
    lng: 43.9920
  },
  {
    id: 'er-4',
    name: 'مطار أربيل الدولي',
    popularLocalName: 'بوابة مطار أربيل الدولي الرئيسي',
    district: 'طريق المطار',
    cityId: 'erbil',
    category: 'airport',
    lat: 36.2370,
    lng: 43.9630
  },

  // البصرة
  {
    id: 'bs-1',
    name: 'شارع الجزائر التجاري',
    popularLocalName: 'شارع الجزائر قرب مجمع التايمز سكوير',
    district: 'الجزائر',
    cityId: 'basra',
    category: 'street',
    lat: 30.5120,
    lng: 47.8150
  },
  {
    id: 'bs-2',
    name: 'كورنيش شط العرب وكازينو البصرة',
    popularLocalName: 'كورنيش شط العرب قرب تمثال السياب',
    district: 'الكورنيش',
    cityId: 'basra',
    category: 'landmark',
    lat: 30.5210,
    lng: 47.8380
  },
  {
    id: 'bs-3',
    name: 'تايمز سكوير مول البصرة',
    popularLocalName: 'مول تايمز سكوير - الجبيلة',
    district: 'الجبيلة',
    cityId: 'basra',
    category: 'mall',
    lat: 30.5280,
    lng: 47.7990
  },
  {
    id: 'bs-4',
    name: 'جامعة البصرة - مجمع كرمة علي',
    popularLocalName: 'بوابة جامعة البصرة في كرمة علي',
    district: 'كرمة علي',
    cityId: 'basra',
    category: 'university',
    lat: 30.5680,
    lng: 47.7450
  },

  // النجف
  {
    id: 'nj-1',
    name: 'شارع الروان التجاري',
    popularLocalName: 'شارع الروان قرب مطاعم ومولات النجف',
    district: 'حي الغدير',
    cityId: 'najaf',
    category: 'street',
    lat: 32.0290,
    lng: 44.3580
  },
  {
    id: 'nj-2',
    name: 'مطار النجف الأشرف الدولي',
    popularLocalName: 'مطار النجف صالة القدوم والمغادرة',
    district: 'المطار',
    cityId: 'najaf',
    category: 'airport',
    lat: 31.9890,
    lng: 44.4040
  },

  // كربلاء
  {
    id: 'kb-1',
    name: 'شارع العباس - ساحة ما بين الحرمين',
    popularLocalName: 'منطقة ما بين الحرمين الشريفين',
    district: 'المركز',
    cityId: 'karbala',
    category: 'landmark',
    lat: 32.6165,
    lng: 44.0325
  },
  {
    id: 'kb-2',
    name: 'شارع السناتر والحي التجاري',
    popularLocalName: 'شارع السناتر قرب مجدي مول',
    district: 'السناتر',
    cityId: 'karbala',
    category: 'street',
    lat: 32.6050,
    lng: 44.0210
  },

  // الرمادي
  {
    id: 'rm-1',
    name: 'جامعة الأنبار - البوابة الرئيسية',
    popularLocalName: 'بوابة جامعة الأنبار طريق 17 تموز',
    district: 'حي الضباط',
    cityId: 'ramadi',
    category: 'university',
    lat: 33.4090,
    lng: 43.2750
  },
  {
    id: 'rm-2',
    name: 'شارع 17 تموز وساحة الساعة',
    popularLocalName: 'ساحة الساعة مركز مدينة الرمادي',
    district: 'المركز',
    cityId: 'ramadi',
    category: 'square',
    lat: 33.4243,
    lng: 43.3000
  },
  {
    id: 'rm-3',
    name: 'مستشفى الرمادي التعليمي والولادة',
    popularLocalName: 'مستشفى الرمادي العام',
    district: 'التأميم',
    cityId: 'ramadi',
    category: 'hospital',
    lat: 33.4320,
    lng: 43.3150
  },
  {
    id: 'rm-4',
    name: 'مول الرمادي الكبير',
    popularLocalName: 'مول الرمادي شارع الكورنيش',
    district: 'حي الأندلس',
    cityId: 'ramadi',
    category: 'mall',
    lat: 33.4210,
    lng: 43.2920
  },

  // الفلوجة
  {
    id: 'fl-1',
    name: 'شارع 40 التجاري - الفلوجة',
    popularLocalName: 'شارع 40 الحيوي مركز التسوق والمطاعم',
    district: 'شارع 40',
    cityId: 'fallujah',
    category: 'street',
    lat: 33.3540,
    lng: 43.7850
  },
  {
    id: 'fl-2',
    name: 'مستشفى الفلوجة التعليمي',
    popularLocalName: 'مستشفى الفلوجة العام',
    district: 'حي الشهداء',
    cityId: 'fallujah',
    category: 'hospital',
    lat: 33.3610,
    lng: 43.7720
  },
  {
    id: 'fl-3',
    name: 'ساحة الاحتفالات والجسر القديم',
    popularLocalName: 'جسر الفلوجة التاريخي على نهر الفرات',
    district: 'النزال',
    cityId: 'fallujah',
    category: 'landmark',
    lat: 33.3480,
    lng: 43.7650
  },

  // هيت
  {
    id: 'ht-1',
    name: 'نواعير هيت الأثرية على نهر الفرات',
    popularLocalName: 'ناعورة هيت التاريخية وممشى الفرات',
    district: 'القلعة',
    cityId: 'hit',
    category: 'landmark',
    lat: 33.6430,
    lng: 42.8280
  },
  {
    id: 'ht-2',
    name: 'قلعة هيت القديمة والمركز',
    popularLocalName: 'قلعة هيت وسوق المدينة التاريخي',
    district: 'القلعة',
    cityId: 'hit',
    category: 'landmark',
    lat: 33.6415,
    lng: 42.8250
  },
  {
    id: 'ht-3',
    name: 'كراج هيت الموحد وطريق الرمادي',
    popularLocalName: 'كراج النقل الموحد خط بغداد-الرمادي-هيت',
    district: 'المعلمين',
    cityId: 'hit',
    category: 'street',
    lat: 33.6490,
    lng: 42.8350
  },

  // الموصل
  {
    id: 'ms-1',
    name: 'جامعة الموصل - المجموعة الثقافية',
    popularLocalName: 'بوابة المجموعة الثقافية جامعة الموصل',
    district: 'المجموعة الثقافية',
    cityId: 'mosul',
    category: 'university',
    lat: 36.3780,
    lng: 43.1420
  },
  {
    id: 'ms-2',
    name: 'غابات الموصل وكورنيش دجلة',
    popularLocalName: 'منتجع الغابات السياحي بالموصل',
    district: 'الغابات',
    cityId: 'mosul',
    category: 'landmark',
    lat: 36.3680,
    lng: 43.1250
  },
  {
    id: 'ms-3',
    name: 'حي الزهور وشارع التجارة',
    popularLocalName: 'شارع الزهور التجاري',
    district: 'حي الزهور',
    cityId: 'mosul',
    category: 'street',
    lat: 36.3550,
    lng: 43.1550
  }
];

export const RIDE_TIERS: RideTier[] = [
  {
    id: 'economy',
    nameAr: 'اقتصادي (Eco)',
    nameEn: 'Economy',
    descriptionAr: 'الأوفر والأنسب للمشاوير اليومية السريعة',
    carModels: 'كيا سيراتو، هيونداي إلنترا، نيسان صني',
    baseFareIQD: 2500,
    perKmFareIQD: 450,
    perMinFareIQD: 100,
    capacity: 4,
    iconName: 'Car',
    multiplier: 1.0,
    estimatedArrivalMins: 3
  },
  {
    id: 'comfort_vip',
    nameAr: 'مريح VIP (Comfort)',
    nameEn: 'Comfort VIP',
    descriptionAr: 'سيارات حديثة مكيفة وواسعة مع أفضل الكباتن تقييماً',
    carModels: 'تويوتا كامري 2024، هيونداي سوناتا، شيفروليه تاهو',
    baseFareIQD: 4500,
    perKmFareIQD: 750,
    perMinFareIQD: 150,
    capacity: 4,
    iconName: 'Sparkles',
    multiplier: 1.4,
    estimatedArrivalMins: 5
  },
  {
    id: 'women_taxi',
    nameAr: 'تاكسي نسائي (Pink)',
    nameEn: 'Women Taxi',
    descriptionAr: 'خدمة آمنة وخاصة بالعوائل والسيدات بقيادة كابتن سيدة',
    carModels: 'كيا فورتي، هيونداي أكسنت، تويوتا كورولا',
    baseFareIQD: 3000,
    perKmFareIQD: 550,
    perMinFareIQD: 120,
    capacity: 4,
    iconName: 'HeartHandshake',
    multiplier: 1.15,
    estimatedArrivalMins: 6
  },
  {
    id: 'family',
    nameAr: 'عائلي 7 راكب (XL)',
    nameEn: 'Family XL',
    descriptionAr: 'سيارات عائلية واسعة تسع 6-7 ركاب مع حقائب السفر',
    carModels: 'تويوتا هايلاندر، هونداي بايلوت، كيا كارنفال',
    baseFareIQD: 6000,
    perKmFareIQD: 950,
    perMinFareIQD: 200,
    capacity: 7,
    iconName: 'Users',
    multiplier: 1.8,
    estimatedArrivalMins: 8
  },
  {
    id: 'delivery',
    nameAr: 'دليفري وباقات (Express)',
    nameEn: 'Delivery Box',
    descriptionAr: 'توصيل مستندات، هدايا وباقات شخصية من الباب للباب',
    carModels: 'دراجة نارية سريعة / سيارة صغيرة مقفلة',
    baseFareIQD: 2000,
    perKmFareIQD: 350,
    perMinFareIQD: 80,
    capacity: 1,
    iconName: 'PackageCheck',
    multiplier: 0.85,
    estimatedArrivalMins: 4
  }
];

export const PAYMENT_METHODS: PaymentOption[] = [
  {
    id: 'cash',
    nameAr: 'دفع نقدي (كاش)',
    nameEn: 'Cash on Arrival',
    description: 'تسليم المبلغ بالدينار العراقي للكابتن عند نهاية الرحلة',
    icon: 'Banknote',
    color: 'emerald',
    feePercent: 0
  },
  {
    id: 'zaincash',
    nameAr: 'محفظة زين كاش (ZainCash)',
    nameEn: 'ZainCash Iraq',
    description: 'دفع فوري عبر تطبيق ومحفظة زين كاش برقم الهاتف أو QR',
    icon: 'Smartphone',
    color: 'blue',
    feePercent: 0
  },
  {
    id: 'fastpay',
    nameAr: 'فاست بي (FastPay)',
    nameEn: 'FastPay Wallet',
    description: 'شائعة جداً في إقليم كردستان والعراق - دفع رقمي آمن',
    icon: 'Zap',
    color: 'amber',
    feePercent: 0
  },
  {
    id: 'qi_card',
    nameAr: 'كي كارد / ماستر كارد (Qi Card)',
    nameEn: 'Qi Card / Mastercard',
    description: 'بطاقات الدفع الإلكتروني المصرفية وبطاقة الماستر كارد الوطنية',
    icon: 'CreditCard',
    color: 'purple',
    feePercent: 0.5
  },
  {
    id: 'app_wallet',
    nameAr: 'رصيد محفظة التطبيق',
    nameEn: 'App In-App Wallet',
    description: 'خصم مباشر من رصيدك المشحون مسبقاً مع مكافآت كاش باك',
    icon: 'Wallet',
    color: 'rose',
    feePercent: 0
  }
];

export const INITIAL_SURGE_ZONES: SurgeZone[] = [
  {
    id: 'sz-1',
    cityId: 'baghdad',
    zoneName: 'الكرادة وشارع العرصات',
    lat: 33.3021,
    lng: 44.4285,
    radiusKm: 2.5,
    multiplier: 1.4,
    demandLevel: 'high',
    activeOrdersCount: 42,
    availableDriversCount: 14
  },
  {
    id: 'sz-2',
    cityId: 'baghdad',
    zoneName: 'المنصور وشارع 14 رمضان',
    lat: 33.3135,
    lng: 44.3540,
    radiusKm: 3.0,
    multiplier: 1.6,
    demandLevel: 'surge',
    activeOrdersCount: 68,
    availableDriversCount: 19
  },
  {
    id: 'sz-3',
    cityId: 'baghdad',
    zoneName: 'مطار بغداد الدولي',
    lat: 33.2625,
    lng: 44.2345,
    radiusKm: 4.0,
    multiplier: 1.3,
    demandLevel: 'high',
    activeOrdersCount: 25,
    availableDriversCount: 12
  },
  {
    id: 'sz-4',
    cityId: 'erbil',
    zoneName: 'شارع 100 متري وفاملي مول',
    lat: 36.2050,
    lng: 43.9850,
    radiusKm: 2.8,
    multiplier: 1.3,
    demandLevel: 'high',
    activeOrdersCount: 31,
    availableDriversCount: 15
  },
  {
    id: 'sz-5',
    cityId: 'basra',
    zoneName: 'شارع الجزائر والكورنيش',
    lat: 30.5120,
    lng: 47.8150,
    radiusKm: 2.2,
    multiplier: 1.5,
    demandLevel: 'surge',
    activeOrdersCount: 38,
    availableDriversCount: 11
  }
];
