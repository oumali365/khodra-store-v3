// ============================================================
// الملف: StoreCoverageMap.tsx – الإصدار 2.0
// خريطة نطاق التوصيل – تصميم متناسق مع المتجر
// ============================================================
import React, { useEffect, useRef } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Move,
  Lock,
  MapPin,
  Sparkles,
  Truck,
  CheckCircle2,
  Navigation,
} from 'lucide-react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// ─── إحداثيات مركز التجهيز ───
const STORE_COORDINATES: [number, number] = [34.0185, -4.9995];

// ─── الأحياء المغطاة ───
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

  const [isTouchDevice, setIsTouchDevice] = React.useState(false);
  const [isMobileDraggingActive, setIsMobileDraggingActive] = React.useState(false);

  // ─── تهيئة الخريطة ───
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const touch =
      typeof window !== 'undefined' &&
      ('ontouchstart' in window || navigator.maxTouchPoints > 0);
    setIsTouchDevice(touch);

    const map = L.map(mapContainerRef.current, {
      center: STORE_COORDINATES,
      zoom: 13,
      zoomSnap: 0.5,
      zoomControl: false,
      attributionControl: false,
      scrollWheelZoom: false,
      dragging: !touch,
    });

    // ─── طبقة الخريطة ───
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      subdomains: ['a', 'b', 'c'],
    }).addTo(map);

    // ─── دائرة التوصيل السريع (4.5 كم) ───
    L.circle(STORE_COORDINATES, {
      color: '#163920',
      fillColor: '#163920',
      fillOpacity: 0.08,
      weight: 2,
      dashArray: '5, 6',
      radius: 4500,
    }).addTo(map);

    // ─── دائرة التغطية الشاملة (8.5 كم) ───
    L.circle(STORE_COORDINATES, {
      color: '#C25E12',
      fillColor: '#C25E12',
      fillOpacity: 0.03,
      weight: 1.5,
      dashArray: '3, 5',
      radius: 8500,
    }).addTo(map);

    // ─── أيقونة مركز المتجر ───
    const storeIcon = L.divIcon({
      html: `
        <div class="relative flex items-center justify-center cursor-pointer select-none">
          <span class="absolute -inset-2.5 rounded-full bg-[#163920]/30 animate-ping"></span>
          <div class="w-11 h-11 rounded-2xl bg-gradient-to-br from-[#163920] to-[#0E2615] border-2 border-white shadow-xl flex items-center justify-center text-white text-xl font-black">
            🌿
          </div>
        </div>
      `,
      className: 'custom-store-pin',
      iconSize: [44, 44],
      iconAnchor: [22, 22],
      popupAnchor: [0, -24],
    });

    const storeMarker = L.marker(STORE_COORDINATES, { icon: storeIcon }).addTo(map);

    const storePopupContent = `
      <div style="direction: rtl; text-align: right; padding: 6px; font-family: inherit;">
        <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
          <span style="background: #163920; color: white; border-radius: 6px; padding: 3px 8px; font-size: 10px; font-weight: 800;">المركز الرئيسي</span>
          <strong style="color: #112616; font-size: 13px;">متجر خُضرة - فاس</strong>
        </div>
        <p style="margin: 0 0 8px 0; font-size: 11px; color: #524B3E; line-height: 1.5;">
          📍 قرب مدارة الأطلس / طريق إيموزار، فاس.<br>
          🚚 مركز التجهيز والتوزيع اليومي.
        </p>
        <a href="https://www.google.com/maps/search/?api=1&query=34.0185,-4.9995" target="_blank" rel="noopener noreferrer" style="display: inline-flex; align-items: center; gap: 4px; background: #C25E12; color: white; padding: 6px 12px; border-radius: 8px; font-size: 11px; font-weight: 800; text-decoration: none;">
          افتح في Google Maps ↗
        </a>
      </div>
    `;

    storeMarker.bindPopup(storePopupContent, { maxWidth: 280 });

    // ─── نقاط الأحياء ───
    FEZ_LOCATIONS.forEach((loc) => {
      const locIcon = L.divIcon({
        html: `
          <div class="flex items-center gap-1 cursor-pointer select-none -translate-x-1/2 -translate-y-1/2 group">
            <span class="w-2.5 h-2.5 rounded-full bg-[#C25E12] border-2 border-white shadow-sm shrink-0 group-hover:scale-125 transition-transform"></span>
            <span class="map-location-label bg-white/95 text-stone-800 px-1.5 py-0.5 rounded-md border border-[#DFD1AC] shadow-sm text-[9.5px] sm:text-[10px] font-bold whitespace-nowrap transition-all group-hover:scale-105 group-hover:text-[#C25E12]">
              ${loc.name}
            </span>
          </div>
        `,
        className: 'custom-location-point',
        iconSize: [0, 0],
      });

      const marker = L.marker(loc.coords, { icon: locIcon }).addTo(map);

      marker.bindTooltip(
        `
        <div style="direction: rtl; text-align: right; font-family: inherit; font-size: 11px; font-weight: bold; color: #112616;">
          📍 ${loc.name}
        </div>
      `,
        {
          direction: 'top',
          offset: [0, -6],
          opacity: 0.95,
        }
      );

      marker.bindPopup(
        `
        <div style="direction: rtl; text-align: right; font-family: inherit; padding: 4px;">
          <strong style="color: #C25E12; font-size: 12px;">📍 ${loc.name}</strong>
          <p style="margin: 6px 0 0 0; font-size: 11px; color: #163920; font-weight: 800; display: flex; align-items: center; gap: 4px;">
            ✓ مشمول بنطاق التوصيل اليومي
          </p>
        </div>
      `,
        { maxWidth: 180 }
      );
    });

    // ─── إخفاء/إظهار أسماء الأحياء حسب التكبير ───
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
      className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 my-8 sm:my-14 relative isolate z-10"
      id="store-coverage-map-section"
    >
      <div className="relative bg-white border border-[#E8E1D3] rounded-[24px] p-4 sm:p-8 shadow-sm text-center overflow-hidden">

        {/* ─── زخارف خلفية ─── */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-[#F5D76E]/10 to-transparent rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-[#163920]/5 to-transparent rounded-full blur-3xl pointer-events-none" />

        <div className="relative">

          {/* ════════ الرأس ════════ */}
          <div className="text-center mb-6 sm:mb-8 max-w-2xl mx-auto">

            {/* شارة علوية */}
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#163920]/8 border border-[#163920]/20 text-[#163920] text-[11px] sm:text-xs font-black mb-3">
              <Sparkles className="w-3.5 h-3.5 text-[#C25E12]" />
              <span>نطاق التغطية</span>
              <MapPin className="w-3.5 h-3.5 text-[#163920]" />
            </div>

            {/* العنوان */}
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-[#112616] mb-2 leading-tight font-['Almarai']">
              موقع المتجر ونطاق التوصيل بفاس
            </h2>

            {/* الوصف */}
            <p className="text-xs sm:text-sm text-[#524B3E] font-medium max-w-lg mx-auto leading-relaxed">
              انطلاقاً مباشراً من مركزنا اللوجستي بطريق إيموزار، نوصل لجميع أحياء فاس بجودة وطراوة مضمونة.
            </p>

            {/* شارات النطاق */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-[#163920] bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                <span className="w-2.5 h-2.5 rounded-full bg-[#163920] border-2 border-white shadow-sm"></span>
                <span>توصيل سريع (4.5 كم)</span>
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-[#C25E12] bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
                <span className="w-2.5 h-2.5 rounded-full bg-[#C25E12] border-2 border-white shadow-sm"></span>
                <span>تغطية شاملة (8.5 كم)</span>
              </span>
            </div>
          </div>

          {/* ════════ الخريطة ════════ */}
          <div className="relative w-full h-[310px] sm:h-[400px] md:h-[460px] rounded-2xl overflow-hidden border-2 border-[#E8E1D3] shadow-inner bg-stone-100 isolate">
            <div
              ref={mapContainerRef}
              className="w-full h-full z-0"
              style={{
                touchAction: !isMobileDraggingActive && isTouchDevice ? 'pan-y' : 'auto',
              }}
            />

            {/* ─── أزرار التحكم ─── */}
            <div className="absolute top-3 left-3 z-10 flex flex-col gap-1.5 bg-white/95 backdrop-blur-sm p-1.5 rounded-xl border border-[#E8E1D3] shadow-lg">
              <button
                type="button"
                onClick={() => mapInstanceRef.current?.zoomIn()}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-white hover:bg-emerald-50 text-[#524B3E] hover:text-[#163920] flex items-center justify-center transition-colors cursor-pointer border border-[#E8E1D3]"
                title="تكبير"
                aria-label="تكبير"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => mapInstanceRef.current?.zoomOut()}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-white hover:bg-emerald-50 text-[#524B3E] hover:text-[#163920] flex items-center justify-center transition-colors cursor-pointer border border-[#E8E1D3]"
                title="تصغير"
                aria-label="تصغير"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleResetCenter}
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-white hover:bg-emerald-50 text-[#524B3E] hover:text-[#163920] flex items-center justify-center transition-colors cursor-pointer border border-[#E8E1D3]"
                title="إعادة التمركز"
                aria-label="إعادة التمركز"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>

            {/* ─── شارة "المركز الرئيسي" ─── */}
            <div className="absolute top-3 right-3 z-10 hidden sm:flex items-center gap-2 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full border border-[#E8E1D3] shadow-md">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#163920] to-[#0E2615] flex items-center justify-center">
                <span className="text-white text-xs">🌿</｜｜DSML｜｜ parameter>
              </div>
              <span className="text-[11px] font-black text-[#112616]">
                متجر خُضرة - فاس
              </span>
            </div>

            {/* ─── زر التبديل للهاتف ─── */}
            {isTouchDevice && (
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 w-[90%] max-w-[280px]">
                <button
                  type="button"
                  onClick={handleToggleMobileDrag}
                  className={`w-full py-2.5 px-4 rounded-full text-xs font-black transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer border-2 ${
                    isMobileDraggingActive
                      ? 'bg-gradient-to-l from-[#163920] to-[#0E2615] text-white border-[#F5D76E]'
                      : 'bg-white/95 backdrop-blur-sm text-[#112616] border-[#E8E1D3] hover:bg-white'
                  }`}
                >
                  {isMobileDraggingActive ? (
                    <>
                      <Lock className="w-4 h-4 text-[#F5D76E]" />
                      <span>التحريك مفعّل • انقر للقفل</span>
                    </>
                  ) : (
                    <>
                      <Navigation className="w-4 h-4 text-[#C25E12]" />
                      <span>انقر لتحريك الخريطة</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* ════════ شارات سفلية ════════ */}
          <div className="mt-5 pt-4 border-t border-[#F0E9DA] flex flex-wrap items-center justify-center gap-2 sm:gap-3">
            <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-black text-[#163920] bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 shadow-xs">
              <Truck className="w-3.5 h-3.5 text-emerald-700" />
              <span>توصيل يومي</span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-black text-[#163920] bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200 shadow-xs">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" />
              <span>10+ أحياء مغطاة</span>
            </span>
            <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-black text-[#C25E12] bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200 shadow-xs">
              <MapPin className="w-3.5 h-3.5 text-[#C25E12]" />
              <span>منطقة فاس الكبرى</span>
            </span>
          </div>

        </div>
      </div>
    </section>
  );
};

export default StoreCoverageMap;