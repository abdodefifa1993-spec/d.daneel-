import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { api } from '../../services/api';
import { DeliveryLiveTrackerOverlay } from './DeliveryLiveTrackerOverlay';
import {
  ShoppingBag,
  Store,
  Bike,
  Clock,
  Star,
  MapPin,
  Plus,
  Minus,
  CheckCircle2,
  AlertCircle,
  Truck,
  Phone,
  ArrowRight,
  Sparkles,
  RefreshCw,
  Wallet,
  DollarSign,
  PackageCheck,
  Search,
  Navigation,
  Zap
} from 'lucide-react';

interface CartItem {
  id: string;
  nameAr: string;
  priceIQD: number;
  qty: number;
}

export const DeliveryApp: React.FC = () => {
  const { playAudioCue, selectedCityId, passengerWalletIQD, deductPassengerWallet } = useApp();

  const [activeTab, setActiveTab] = useState<'customer' | 'courier'>('customer');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [stores, setStores] = useState<any[]>([]);
  const [couriers, setCouriers] = useState<any[]>([]);
  const [selectedStore, setSelectedStore] = useState<any | null>(null);
  const [cart, setCart] = useState<{ [storeId: string]: CartItem[] }>({});
  const [activeOrders, setActiveOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [trackingOrder, setTrackingOrder] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [deliveryNotes, setDeliveryNotes] = useState('');
  const [deliveryLocation, setDeliveryLocation] = useState('بغداد - حي المنصور، شارع 14 رمضان');

  // Load stores and couriers
  const fetchStoresAndOrders = async () => {
    setLoading(true);
    try {
      const [fetchedStores, fetchedCouriers, fetchedOrders] = await Promise.all([
        api.getStores(),
        api.getCouriers(),
        api.getOrders()
      ]);
      setStores(fetchedStores || []);
      setCouriers(fetchedCouriers || []);
      setActiveOrders(fetchedOrders || []);
      if (!selectedStore && fetchedStores && fetchedStores.length > 0) {
        setSelectedStore(fetchedStores[0]);
      }
      if (fetchedOrders && fetchedOrders.length > 0 && !selectedOrder) {
        setSelectedOrder(fetchedOrders[0]);
      }
    } catch (err) {
      console.error('Error fetching delivery data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStoresAndOrders();
  }, [selectedCityId]);

  // Handle Cart Operations
  const addToCart = (store: any, item: any) => {
    setCart(prev => {
      const storeCart = prev[store.id] ? [...prev[store.id]] : [];
      const existing = storeCart.find(i => i.id === item.id);
      if (existing) {
        existing.qty += 1;
      } else {
        storeCart.push({ id: item.id, nameAr: item.nameAr, priceIQD: item.priceIQD, qty: 1 });
      }
      playAudioCue('beep');
      return { ...prev, [store.id]: storeCart };
    });
  };

  const removeFromCart = (storeId: string, itemId: string) => {
    setCart(prev => {
      const storeCart = prev[storeId] ? [...prev[storeId]] : [];
      const index = storeCart.findIndex(i => i.id === itemId);
      if (index !== -1) {
        if (storeCart[index].qty > 1) {
          storeCart[index].qty -= 1;
        } else {
          storeCart.splice(index, 1);
        }
      }
      playAudioCue('beep');
      return { ...prev, [storeId]: storeCart };
    });
  };

  const currentStoreCart = selectedStore ? cart[selectedStore.id] || [] : [];
  const subtotalIQD = currentStoreCart.reduce((sum, item) => sum + item.priceIQD * item.qty, 0);
  const deliveryFeeIQD = 3000;
  const totalAmountIQD = subtotalIQD + (subtotalIQD > 0 ? deliveryFeeIQD : 0);

  // Submit Order
  const handleCheckout = async () => {
    if (!selectedStore || currentStoreCart.length === 0) return;

    setLoading(true);
    try {
      const orderPayload = {
        storeId: selectedStore.id,
        storeName: selectedStore.nameAr,
        storeCategory: selectedStore.category,
        items: currentStoreCart,
        subtotalIQD,
        deliveryFeeIQD,
        customerName: 'علي الكرخي',
        customerPhone: '+964 770 123 4567',
        paymentMethod: 'cash',
        deliveryAddress: {
          name: deliveryLocation,
          lat: 33.3150,
          lng: 44.3660,
          notes: deliveryNotes
        }
      };

      const newOrder = await api.createOrder(orderPayload);
      if (newOrder) {
        playAudioCue('success');
        setCart(prev => ({ ...prev, [selectedStore.id]: [] }));
        setSelectedOrder(newOrder);
        setTrackingOrder(newOrder);
        setActiveOrders(prev => [newOrder, ...prev]);
      }
    } catch (e) {
      console.error('Order creation error:', e);
    } finally {
      setLoading(false);
    }
  };

  // Courier Actions
  const handleCourierAccept = async (orderId: string) => {
    setLoading(true);
    try {
      const courier = couriers[0] || { id: 'courier-1' };
      const res = await api.acceptOrder(orderId, courier.id);
      if (res?.success) {
        playAudioCue('success');
        fetchStoresAndOrders();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAdvanceOrderStatus = async (orderId: string, nextStatus: string) => {
    setLoading(true);
    try {
      const res = await api.updateOrderStatus(orderId, nextStatus);
      if (res?.success) {
        playAudioCue('ding');
        fetchStoresAndOrders();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  // Quick Demo Order for instant Live Radar test
  const handleQuickDemoOrder = async () => {
    setLoading(true);
    try {
      const demoStore = stores[0] || {
        id: 'store-1',
        nameAr: 'مطعم صمد - المنصور',
        location: { lat: 33.3125, lng: 44.3562 },
        address: 'حي المنصور، شارع 14 رمضان، بغداد'
      };

      const orderPayload = {
        storeId: demoStore.id,
        storeName: demoStore.nameAr,
        storeCategory: 'restaurant',
        items: [
          { id: 'item-demo-1', nameAr: 'قوزي لحم عراقي فاخر مع أرز عنبر', qty: 1, priceIQD: 18000 },
          { id: 'item-demo-2', nameAr: 'كباب لحم مشوي على الفحم', qty: 1, priceIQD: 12000 }
        ],
        subtotalIQD: 30000,
        deliveryFeeIQD: 3000,
        customerName: 'علي الكرخي',
        customerPhone: '+964 770 123 4567',
        paymentMethod: 'cash',
        deliveryAddress: {
          name: 'بغداد - الكرادة داخل، قرب ساحة كهرمانة',
          lat: 33.3050,
          lng: 44.4220,
          notes: 'الطابق الثاني'
        }
      };

      const newOrder = await api.createOrder(orderPayload);
      if (newOrder) {
        playAudioCue('success');
        setSelectedOrder(newOrder);
        setTrackingOrder(newOrder);
        setActiveOrders(prev => [newOrder, ...prev]);
      }
    } catch (e) {
      console.error('Demo order error:', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredStores = stores.filter(s => {
    const matchesCat = selectedCategory === 'all' || s.category === selectedCategory;
    const matchesSearch = !searchQuery || s.nameAr.includes(searchQuery);
    return matchesCat && matchesSearch;
  });

  const categories = [
    { id: 'all', nameAr: 'الكل' },
    { id: 'restaurant', nameAr: 'مطاعم عراقية' },
    { id: 'market', nameAr: 'سوبرماركت وغذائية' },
    { id: 'pharmacy', nameAr: 'صيدليات ومستلزمات' },
    { id: 'sweets', nameAr: 'حلويات ومعجنات' },
    { id: 'ice_cream', nameAr: 'مثلجات وعصائر' },
    { id: 'local_store', nameAr: 'قرطاسية ومتاجر' }
  ];

  return (
    <div id="delivery-platform-container" className="max-w-7xl mx-auto px-3 sm:px-6 py-4">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-amber-500/15 via-slate-900 to-slate-900 border border-amber-500/30 rounded-2xl p-4 sm:p-6 mb-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-100">
                منصة دانيال للتوصيل الذكي والمتاجر (Daniel Delivery)
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              خدمة توصيل فورية من أشهر مطاعم ومتاجر وصيدليات بغداد والمحافظات بأسعار محلية دقيقة وتتبع حي للكابتن.
            </p>
          </div>

          {/* Mode Switcher & Quick Demo */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              id="quick-demo-order-btn"
              onClick={handleQuickDemoOrder}
              disabled={loading}
              className="px-3.5 py-2 rounded-xl text-xs font-black bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 transition-all flex items-center gap-1.5 shadow-lg shadow-amber-500/20 whitespace-nowrap"
            >
              <Zap className="w-4 h-4 fill-slate-950" />
              <span>طلب تجريبي فوري + رادار حي</span>
            </button>

            <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700/80">
              <button
                id="mode-customer-btn"
                onClick={() => setActiveTab('customer')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'customer'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Store className="w-4 h-4" />
                <span>طلب من متجر</span>
              </button>
              <button
                id="mode-courier-btn"
                onClick={() => setActiveTab('courier')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeTab === 'courier'
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Bike className="w-4 h-4" />
                <span>كابتن التوصيل (Courier)</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {activeTab === 'customer' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Stores & Catalog (Left 2 cols) */}
          <div className="lg:col-span-2 space-y-5">
            {/* Category Pills & Search */}
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-slate-500 absolute right-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="ابحث عن متجر أو وجبة..."
                  className="w-full bg-slate-900 border border-slate-800 text-slate-200 pr-9 pl-3 py-2 rounded-xl text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto w-full pb-1 no-scrollbar">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                      selectedCategory === cat.id
                        ? 'bg-amber-500/20 border border-amber-500/50 text-amber-300'
                        : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {cat.nameAr}
                  </button>
                ))}
              </div>
            </div>

            {/* Stores Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredStores.map(st => {
                const isSelected = selectedStore?.id === st.id;
                return (
                  <div
                    key={st.id}
                    id={`store-card-${st.id}`}
                    onClick={() => setSelectedStore(st)}
                    className={`cursor-pointer rounded-2xl p-4 border transition-all ${
                      isSelected
                        ? 'bg-slate-900/90 border-amber-500/60 shadow-lg shadow-amber-500/10'
                        : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={st.logo}
                        alt={st.nameAr}
                        className="w-14 h-14 rounded-xl object-cover border border-slate-800 shrink-0"
                        referrerPolicy="no-referrer"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-bold text-sm text-slate-100 truncate">{st.nameAr}</h3>
                          <div className="flex items-center gap-1 text-amber-400 text-xs font-bold shrink-0">
                            <Star className="w-3.5 h-3.5 fill-amber-400" />
                            <span>{st.rating}</span>
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                          <span>{st.address}</span>
                        </p>
                        <div className="flex items-center gap-2 mt-2 text-[10px] text-slate-400">
                          <span className="bg-slate-800 px-2 py-0.5 rounded-md flex items-center gap-1">
                            <Clock className="w-3 h-3 text-amber-400" />
                            {st.estimatedPrepMins} دقيقة تجهيز
                          </span>
                          <span className="bg-slate-800 px-2 py-0.5 rounded-md text-emerald-400 font-semibold">
                            3,000 د.ع توصيل
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Store Menu Items */}
                    <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                      <div className="text-[11px] font-bold text-slate-400">قائمة الأصناف المتاحة:</div>
                      {st.items.map((it: any) => {
                        const inCartQty = (cart[st.id] || []).find(c => c.id === it.id)?.qty || 0;
                        return (
                          <div
                            key={it.id}
                            className="flex items-center justify-between bg-slate-950/60 p-2 rounded-xl border border-slate-800/60 text-xs"
                          >
                            <div>
                              <div className="font-semibold text-slate-200">{it.nameAr}</div>
                              <div className="text-[11px] text-amber-400 font-bold">
                                {it.priceIQD.toLocaleString()} د.ع
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              {inCartQty > 0 && (
                                <>
                                  <button
                                    onClick={e => {
                                      e.stopPropagation();
                                      removeFromCart(st.id, it.id);
                                    }}
                                    className="p-1 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700"
                                  >
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="font-bold text-amber-400 min-w-4 text-center">{inCartQty}</span>
                                </>
                              )}
                              <button
                                onClick={e => {
                                  e.stopPropagation();
                                  addToCart(st, it);
                                }}
                                className="p-1.5 rounded-lg bg-amber-500 text-slate-950 hover:bg-amber-400 transition-colors font-bold"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cart & Checkout Sidebar (Right col) */}
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 font-bold text-slate-200 text-sm">
                  <ShoppingBag className="w-4 h-4 text-amber-400" />
                  <span>سلة الطلب ({selectedStore?.nameAr || 'اختر متجر'})</span>
                </div>
                {currentStoreCart.length > 0 && (
                  <button
                    onClick={() => setCart(prev => ({ ...prev, [selectedStore.id]: [] }))}
                    className="text-[11px] text-rose-400 hover:underline"
                  >
                    تفريغ السلة
                  </button>
                )}
              </div>

              {currentStoreCart.length === 0 ? (
                <div className="py-8 text-center text-slate-500 text-xs">
                  <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <span>السلة فارغة. اختر أي صنف من القائمة لإضافته للطلب.</span>
                </div>
              ) : (
                <div className="space-y-3 py-3">
                  {currentStoreCart.map(it => (
                    <div key={it.id} className="flex items-center justify-between text-xs">
                      <div>
                        <div className="font-semibold text-slate-200">{it.nameAr}</div>
                        <div className="text-[11px] text-slate-400">
                          {it.qty} × {it.priceIQD.toLocaleString()} د.ع
                        </div>
                      </div>
                      <div className="font-bold text-amber-300">
                        {(it.priceIQD * it.qty).toLocaleString()} د.ع
                      </div>
                    </div>
                  ))}

                  {/* Delivery Location Input */}
                  <div className="pt-3 border-t border-slate-800 space-y-2">
                    <label className="text-[11px] font-bold text-slate-400 block">عنوان التوصيل:</label>
                    <input
                      type="text"
                      value={deliveryLocation}
                      onChange={e => setDeliveryLocation(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs p-2 rounded-xl focus:border-amber-500 focus:outline-none"
                    />

                    <label className="text-[11px] font-bold text-slate-400 block">ملاحظات للكابتن أو المحل:</label>
                    <input
                      type="text"
                      placeholder="رقم الشقة، علامة فارقة، الخ..."
                      value={deliveryNotes}
                      onChange={e => setDeliveryNotes(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 text-slate-200 text-xs p-2 rounded-xl focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  {/* Total Calculations */}
                  <div className="pt-3 border-t border-slate-800 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>مجموع الأصناف:</span>
                      <span>{subtotalIQD.toLocaleString()} د.ع</span>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>أجرة التوصيل (كابتن دانيال):</span>
                      <span className="text-emerald-400 font-semibold">{deliveryFeeIQD.toLocaleString()} د.ع</span>
                    </div>
                    <div className="flex justify-between font-bold text-slate-100 text-sm pt-2 border-t border-slate-800">
                      <span>الإجمالي الكلي:</span>
                      <span className="text-amber-400">{totalAmountIQD.toLocaleString()} د.ع</span>
                    </div>
                  </div>

                  <button
                    id="checkout-order-btn"
                    onClick={handleCheckout}
                    disabled={loading}
                    className="w-full mt-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-xl transition-all shadow-lg shadow-amber-500/20 text-xs flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>تأكيد طلب التوصيل (دفع نقد عند الاستلام)</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Active Orders Widget */}
            {activeOrders.length > 0 && (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
                <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                  <div className="flex items-center gap-2 font-bold text-slate-200 text-sm">
                    <PackageCheck className="w-4 h-4 text-emerald-400" />
                    <span>الطلبات النشطة ({activeOrders.length})</span>
                  </div>
                  <button onClick={fetchStoresAndOrders} className="text-slate-400 hover:text-slate-200">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="space-y-3 pt-3">
                  {activeOrders.slice(0, 3).map(ord => (
                    <div
                      key={ord.id}
                      onClick={() => setSelectedOrder(ord)}
                      className={`cursor-pointer p-3 rounded-xl border text-xs transition-all ${
                        selectedOrder?.id === ord.id
                          ? 'bg-slate-800/90 border-amber-500/50'
                          : 'bg-slate-950/60 border-slate-800'
                      }`}
                    >
                      <div className="flex justify-between items-start mb-1.5">
                        <span className="font-bold text-slate-200">{ord.storeName}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ord.status === 'DELIVERED'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : ord.status === 'OUT_FOR_DELIVERY'
                              ? 'bg-amber-500/20 text-amber-300 animate-pulse'
                              : 'bg-blue-500/20 text-blue-300'
                          }`}
                        >
                          {ord.status === 'PENDING' && 'بانتظار قبول الكابتن'}
                          {ord.status === 'COURIER_ASSIGNED' && 'تم إسناد الكابتن'}
                          {ord.status === 'PREPARING' && 'قيد التجهيز'}
                          {ord.status === 'OUT_FOR_DELIVERY' && 'الكابتن بالطريق إليك'}
                          {ord.status === 'DELIVERED' && 'تم التوصيل بنجاح'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400">
                        المجموع: <span className="font-bold text-amber-400">{ord.totalAmountIQD.toLocaleString()} د.ع</span>
                      </div>
                      {ord.courierName && (
                        <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                          <Bike className="w-3 h-3 text-amber-400" />
                          <span>كابتن التوصيل: {ord.courierName}</span>
                        </div>
                      )}

                      <button
                        id={`track-order-${ord.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          setTrackingOrder(ord);
                        }}
                        className="w-full mt-2 py-1.5 px-2.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 font-bold text-[11px] flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Navigation className="w-3.5 h-3.5" />
                        <span>تتبع مسار الكابتن الحي (Live Radar)</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Courier Partner Dashboard View */
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-400">
                <Bike className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-100">بوابة كابتن التوصيل والطرود (Courier Cockpit)</h2>
                <p className="text-xs text-slate-400">
                  الكابتن النشط: علي المفرجي (دليفري سريع) | دراجة نارية - بغداد 7821
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
                <span className="text-slate-400 ml-1.5">أرباح اليوم:</span>
                <span className="font-black text-emerald-400">28,000 د.ع</span>
              </div>
              <div className="bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-700 text-xs">
                <span className="text-slate-400 ml-1.5">نسبة القبول:</span>
                <span className="font-bold text-amber-400">98%</span>
              </div>
            </div>
          </div>

          {/* Orders available for pickup */}
          <div>
            <h3 className="font-bold text-sm text-slate-200 mb-3 flex items-center gap-2">
              <Truck className="w-4 h-4 text-amber-400" />
              <span>طلبات التوصيل المتاحة في بغداد:</span>
            </h3>

            {activeOrders.length === 0 ? (
              <div className="text-center py-10 text-slate-500 text-xs bg-slate-950/60 rounded-xl border border-slate-800">
                لا توجد طلبات جديدة حالياً في منطقتك.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeOrders.map(order => (
                  <div
                    key={order.id}
                    className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-slate-100">{order.storeName}</span>
                      <span className="text-emerald-400 font-black text-xs">
                        +{order.deliveryFeeIQD.toLocaleString()} د.ع أجورك
                      </span>
                    </div>

                    <div className="text-xs text-slate-400 space-y-1">
                      <p className="flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>الزبون: {order.customerName} ({order.deliveryAddress?.name})</span>
                      </p>
                      <p className="flex items-center gap-1.5">
                        <ShoppingBag className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                        <span>الأصناف: {order.items.map((i: any) => `${i.nameAr} (×${i.qty})`).join('، ')}</span>
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                      <span className="text-[11px] text-slate-400 font-mono">
                        الحالة: <b className="text-amber-400">{order.status}</b>
                      </span>

                      {order.status === 'PENDING' && (
                        <button
                          onClick={() => handleCourierAccept(order.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>قبول وتوصيل الطلب</span>
                        </button>
                      )}

                      {order.status === 'COURIER_ASSIGNED' && (
                        <button
                          onClick={() => handleAdvanceOrderStatus(order.id, 'OUT_FOR_DELIVERY')}
                          className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1"
                        >
                          <Bike className="w-3.5 h-3.5" />
                          <span>استلمت من المتجر (بالطريق)</span>
                        </button>
                      )}

                      {order.status === 'OUT_FOR_DELIVERY' && (
                        <button
                          onClick={() => handleAdvanceOrderStatus(order.id, 'DELIVERED')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1"
                        >
                          <PackageCheck className="w-3.5 h-3.5" />
                          <span>تم تسليم الطلب واستلام المبلغ</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Visual Live Tracker Overlay */}
      {trackingOrder && (
        <DeliveryLiveTrackerOverlay
          order={trackingOrder}
          onClose={() => setTrackingOrder(null)}
        />
      )}
    </div>
  );
};
