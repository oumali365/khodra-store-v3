import React, { useEffect, useRef } from 'react';
import { 
  ZoomIn, 
  ZoomOut, 
  RotateCcw,
  Move,
  Lock
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ─── إحداثيات مركز التجهيز والتوزيع لمتجر خُضرة بمدينة فاس ───
const STORE_COORDINATES: [number, number] = [34.0185, -4.9995]; // طريق إيموزار / قرب مدارة الأطلس - فاس

// ─── أهم الشوارع والأحياء المغطاة لعرضها مباشرة على الخريطة ───
const FEZ_LOCATIONS = [
  { name: 'طريق إيموزار', coords: [34.0165, -4.9940] as [number, number] },
  { name: 'حي الأطلس', coords: [34.0220, -5.0010] as [number, number] },
  { name: 'حي النرجس', coords: [34.0080, -4.9850] as [number, number] },
  { name: 'طريق عين الشقف', coords: [34.0040, -5.0150] as [number, number] },
  { name: 'حي السعادة', coords: [34.0190, -4.9810] as [number, number] },
  { name: 'شارع الحسن الثاني', coords: [34.0320, -4.9980] as [number, number] },
  { name: 'المدينة الجديدة (VN)', coords: [34.0350, -5.0020] as [number, number] },
  { name: 'طريق صفرو', coords: [34.0090, -4.9720] as [number, number] },
  { name: 'شارع الجيش الملكي', coords: [34.0390, -5.0110] as [number, number] },
  { name: 'حي زواغة', coords: [34.0260, -5.0450] as [number, number] },
];

export const StoreCoverageMap: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  // حالة استشعار شاشات اللمس / الهواتف الذكية لمنع إعاقة تمرير الصفحة
  const [isTouchDevice, setIsTouchDevice] = React.useState(false);
  const [isMobileDraggingActive, setIsMobileDraggingActive] = React.useState(false);

  // تهيئة الخريطة التفاعلية
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const touch = typeof window !== 'undefined' && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    setIsTouchDevice(touch);

    const map = L.map(mapContainerRef.current, {
      center: STORE_COORDINATES,
      zoom: 13,
      zoomSnap: 0.5,
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: false, // لا يعيق تمرير عجلة الماوس
      dragging: !touch, // على أجهزة الجوال: معطل مبدئياً لضمان تمرير الصفحة بسلاسة دون تعليق
    });

    // إضافة طبقة خريطة OpenStreetMap الواضحة وعالية الدقة وبدون أي علامات مائية
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      subdomains: ['a', 'b', 'c'],
    }).addTo(map);

    // دائرة نطاق التوصيل السريع (4.5 كم)
    L.circle(STORE_COORDINATES, {
      color: '#1E4327',
      fillColor: '#1E4327',
      fillOpacity: 0.08,
      weight: 2,
      dashArray: '5, 6',
      radius: 4500,
    }).addTo(map);

    // دائرة نطاق التغطية الشاملة (8.5 كم)
    L.circle(STORE_COORDINATES, {
      color: '#C25E12',
      fillColor: '#C25E12',
      fillOpacity: 0.03,
      weight: 1.5,
      dashArray: '3, 5',
      radius: 8500,
    }).addTo(map);

    // أيقونة مركز المتجر الرئيسية
    const storeIcon = L.divIcon({
      html: `
        <div class="relative flex items-center justify-center cursor-pointer select-none">
          <span class="absolute -inset-2.5 rounded-full bg-[#1E4327]/25 animate-ping"></span>
          <div class="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#1E4327] to-[#2B5D36] border-2 border-white shadow-lg flex items-center justify-center text-white text-lg font-black transform hover:scale-110 transition-transform">
            🌿
          </div>
        </div>
      `,
      className: 'custom-store-pin',
      iconSize: [40, 40],
      iconAnchor: [20, 20],
      popupAnchor: [0, -22],
    });

    const storeMarker = L.marker(STORE_COORDINATES, { icon: storeIcon }).addTo(map);

    const storePopupContent = `
      <div style="direction: rtl; text-align: right; padding: 4px; font-family: inherit;">
        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
          <span style="background: #1E4327; color: white; border-radius: 6px; padding: 2px 6px; font-size: 10px; font-weight: 800;">المركز الرئيسي</span>
          <strong style="color: #112616; font-size: 13px;">متجر خُضرة - فاس</strong>
        </div>
        <p style="margin: 0 0 6px 0; font-size: 11px; color: #524B3E; line-height: 1.4;">
          📍 قرب مدارة الأطلس / طريق إيموزار، فاس.<br>
          🚚 مركز التجهيز والتوزيع اليومي للخضر والفواكه.
        </p>
      </div>
    `;

    storeMarker.bindPopup(storePopupContent, { maxWidth: 260 });

    // وضع نقاط أسماء الشوارع والأحياء باللون البرتقالي المصغر
    FEZ_LOCATIONS.forEach((loc) => {
      const locIcon = L.divIcon({
        html: `
          <div class="flex items-center gap-1 cursor-pointer select-none -translate-x-1/2 -translate-y-1/2 group">
            <span class="w-2.5 h-2.5 rounded-full bg-[#C25E12] border-1.5 border-white shadow-xs shrink-0 group-hover:scale-125 transition-transform"></span>
            <span class="map-location-label bg-white/95 text-stone-800 group-hover:text-[#C25E12] px-1.5 py-0.5 rounded-md border border-[#DFD1AC] shadow-2xs text-[9.5px] sm:text-[10px] font-bold whitespace-nowrap transition-all group-hover:scale-105">
              ${loc.name}
            </span>
          </div>
        `,
        className: 'custom-location-point',
        iconSize: [0, 0],
      });

      const marker = L.marker(loc.coords, { icon: locIcon }).addTo(map);

      // تلميح يظهر عند التمرير بالماوس أو في وضع التصغير
      marker.bindTooltip(`
        <div style="direction: rtl; text-align: right; font-family: inherit; font-size: 11px; font-weight: bold; color: #112616;">
          📍 ${loc.name}
        </div>
      `, {
        direction: 'top',
        offset: [0, -6],
        opacity: 0.95
      });

      marker.bindPopup(`
        <div style="direction: rtl; text-align: right; font-family: inherit; padding: 3px;">
          <strong style="color: #C25E12; font-size: 12px;">📍 ${loc.name}</strong>
          <p style="margin: 4px 0 0 0; font-size: 11px; color: #1E4327; font-weight: bold;">
            ✓ مشمول بنطاق التوصيل اليومي
          </p>
        </div>
      `, { maxWidth: 180 });
    });

    // التحكم في إخفاء وإظهار أسماء الأحياء حسب مستوى التكبير/التصغير
    const handleZoomChange = () => {
      if (!mapContainerRef.current) return;
      if (map.getZoom() < 13) {
        mapContainerRef.current.classList.add('hide-map-labels');
      } else {
        mapContainerRef.current.classList.remove('hide-map-labels');
      }
    };

    map.on('zoomend', handleZoomChange);
    handleZoomChange();

    mapInstanceRef.current = map;

    // معالجة الأبعاد التلقائية
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timer);
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  const handleResetCenter = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(STORE_COORDINATES, 13, { duration: 0.8 });
    }
  };

  // تفعيل أو تعطيل تحريك الخريطة على شاشات اللمس
  const handleToggleMobileDrag = () => {
    if (!mapInstanceRef.current) return;
    if (isMobileDraggingActive) {
      mapInstanceRef.current.dragging.disable();
      setIsMobileDraggingActive(false);
    } else {
      mapInstanceRef.current.dragging.enable();
      setIsMobileDraggingActive(true);
    }
  };

  return (
    <section 
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 my-8 sm:my-12 relative isolate z-10"
      id="store-coverage-map-section"
    >
      <div className="bg-[#FAF8F4] border border-[#D4C8B5] rounded-3xl p-4 sm:p-7 shadow-xs text-center relative overflow-hidden">
        {/* ─── 1. رأس الحاوية المتناسق تماماً مع باقي أقسام المتجر ─── */}
        <div className="max-w-2xl mx-auto mb-4 sm:mb-6 text-center">
          <h2 className="text-xl sm:text-2xl font-black text-[#112616] mb-1.5 font-['Almarai']">
            موقع المتجر ونطاق التوصيل بفاس
          </h2>

          <p className="text-xs sm:text-sm text-[#524B3E] font-medium max-w-lg mx-auto leading-relaxed">
            انطلاق مباشر من مركزنا اللوجستي بطريق إيموزار لجميع أحياء فاس بجودة وطراوة مضمونة
          </p>
        </div>

        {/* ─── 2. عرض الخريطة التفاعلية بأبعاد متناسقة ومدروسة (زيادة 10% في الطول) ─── */}
        <div className="relative w-full h-[310px] sm:h-[400px] md:h-[460px] rounded-2xl overflow-hidden border border-[#D4C8B5] shadow-inner bg-stone-100 isolate">
          <div 
            ref={mapContainerRef} 
            className="w-full h-full z-0" 
            style={{ touchAction: (!isMobileDraggingActive && isTouchDevice) ? 'pan-y' : 'auto' }}
          />

          {/* أزرار التحكم في الخريطة – z-10 محصورة داخل isolate */}
          <div className="absolute top-2.5 left-2.5 z-10 flex flex-col gap-1 bg-white/95 backdrop-blur-xs p-1 rounded-xl border border-stone-200 shadow-md">
            <button
              type="button"
              onClick={() => mapInstanceRef.current?.zoomIn()}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white hover:bg-emerald-50 text-stone-700 hover:text-[#1E4327] flex items-center justify-center transition-colors cursor-pointer border border-stone-200"
              title="تكبير الخريطة"
              aria-label="تكبير"
            >
              <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button
              type="button"
              onClick={() => mapInstanceRef.current?.zoomOut()}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white hover:bg-emerald-50 text-stone-700 hover:text-[#1E4327] flex items-center justify-center transition-colors cursor-pointer border border-stone-200"
              title="تصغير الخريطة"
              aria-label="تصغير"
            >
              <ZoomOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button
              type="button"
              onClick={handleResetCenter}
              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white hover:bg-emerald-50 text-stone-700 hover:text-[#1E4327] flex items-center justify-center transition-colors cursor-pointer border border-stone-200"
              title="إعادة التمركز على مقر المتجر"
              aria-label="إعادة التمركز"
            >
              <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>

          {/* زر التبديل للهواتف الذكية لضمان عدم إعاقة تمرير الصفحة بالسحب */}
          {isTouchDevice && (
            <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 z-10 w-[90%] max-w-[270px]">
              <button
                type="button"
                onClick={handleToggleMobileDrag}
                className={`w-full py-2 px-3 rounded-full text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer border select-none ${
                  isMobileDraggingActive
                    ? 'bg-[#1E4327] text-white border-emerald-600 ring-2 ring-emerald-400/30'
                    : 'bg-white/95 backdrop-blur-xs text-[#2B2317] border-[#DFD1AC] hover:bg-stone-50'
                }`}
              >
                {isMobileDraggingActive ? (
                  <>
                    <Lock className="w-3.5 h-3.5 text-emerald-300" />
                    <span>التحريك مفعّل • انقر لقفل التمرير</span>
                  </>
                ) : (
                  <>
                    <Move className="w-3.5 h-3.5 text-[#C25E12]" />
                    <span>انقر لتحريك واستكشاف الخريطة</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default StoreCoverageMap;


