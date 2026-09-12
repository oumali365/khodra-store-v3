// ============================================================
// AdminNotificationToast.tsx – تنبيه صوتي ومرئي للطلبات الجديدة
// ============================================================
import React, { useEffect, useRef, useState } from 'react';
import { Bell, ShoppingBag, X, Volume2, VolumeX } from 'lucide-react';

interface AdminNotificationToastProps {
  newCount: number;               // عدد الطلبات الجديدة
  onOpenOrders: () => void;       // فتح لوحة الطلبات
  onDismiss: () => void;          // إغلاق التنبيه
  soundEnabled: boolean;          // هل الصوت مفعّل؟
  onToggleSound: () => void;      // تبديل حالة الصوت
}

export const AdminNotificationToast: React.FC<AdminNotificationToastProps> = ({
  newCount,
  onOpenOrders,
  onDismiss,
  soundEnabled,
  onToggleSound,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const audioContextRef = useRef<AudioContext | null>(null);

  // ─── تشغيل صوت "دينغ" مُولَّد برمجياً ───
  const playNotificationSound = () => {
    if (!soundEnabled) return;

    try {
      // إنشاء AudioContext (يدعم كل المتصفحات الحديثة)
      if (!audioContextRef.current) {
        const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (!AudioContextClass) return;
        audioContextRef.current = new AudioContextClass();
      }

      const ctx = audioContextRef.current;
      if (!ctx) return;

      // استئناف السياق إذا كان معلّقاً (سياسة المتصفحات)
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // ─── نغمة "دينغ" ثلاثية (C5 → E5 → G5) ───
      const notes = [
        { freq: 523.25, start: 0.00, duration: 0.15 }, // C5
        { freq: 659.25, start: 0.12, duration: 0.15 }, // E5
        { freq: 783.99, start: 0.24, duration: 0.25 }, // G5
      ];

      const now = ctx.currentTime;

      notes.forEach(({ freq, start, duration }) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.type = 'sine';
        oscillator.frequency.value = freq;

        // مظروف الصوت (attack + release) لصوت ناعم
        gainNode.gain.setValueAtTime(0, now + start);
        gainNode.gain.linearRampToValueAtTime(0.3, now + start + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.001, now + start + duration);

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.start(now + start);
        oscillator.stop(now + start + duration);
      });

      // ─── نغمة ثانية للتأكيد (بعد 0.5s) ───
      setTimeout(() => {
        try {
          if (!ctx) return;
          const now2 = ctx.currentTime;

          const oscillator2 = ctx.createOscillator();
          const gain2 = ctx.createGain();

          oscillator2.type = 'sine';
          oscillator2.frequency.value = 1046.50; // C6 (أعلى)

          gain2.gain.setValueAtTime(0, now2);
          gain2.gain.linearRampToValueAtTime(0.25, now2 + 0.02);
          gain2.gain.exponentialRampToValueAtTime(0.001, now2 + 0.4);

          oscillator2.connect(gain2);
          gain2.connect(ctx.destination);

          oscillator2.start(now2);
          oscillator2.stop(now2 + 0.4);
        } catch { /* ignore */ }
      }, 500);
    } catch (err) {
      console.warn('تعذّر تشغيل التنبيه الصوتي:', err);
    }
  };

  // ─── عند تغيّر newCount: تشغيل الصوت وإظهار التنبيه ───
  useEffect(() => {
    if (newCount > 0) {
      setIsVisible(true);
      playNotificationSound();
    } else {
      setIsVisible(false);
    }
  }, [newCount]);

  // ─── إخفاء تلقائي بعد 25 ثانية ───
  useEffect(() => {
    if (!isVisible) return;
    const timer = setTimeout(() => setIsVisible(false), 25000);
    return () => clearTimeout(timer);
  }, [isVisible]);

  if (!isVisible || newCount === 0) return null;

  return (
    <div
      className="fixed top-4 right-4 left-4 sm:left-auto sm:right-6 sm:max-w-md z-[100] animate-in slide-in-from-top-4 fade-in duration-300"
      role="alert"
      aria-live="assertive"
    >
      <div className="bg-gradient-to-l from-[#1E4327] to-[#2E5336] text-white rounded-2xl shadow-2xl border-2 border-[#F5D76E]/40 overflow-hidden">
        {/* شريط ذهبي متحرك */}
        <div className="h-1 bg-gradient-to-l from-[#F5D76E] via-[#C25E12] to-[#F5D76E] animate-pulse" />

        <div className="p-4 flex items-start gap-3">
          {/* أيقونة الجرس */}
          <div className="w-11 h-11 rounded-xl bg-[#F5D76E] flex items-center justify-center shrink-0 shadow-lg animate-bounce">
            <Bell className="w-6 h-6 text-[#1E4327] stroke-[2.5]" />
          </div>

          {/* المحتوى */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className="font-black text-sm sm:text-base">
                {newCount === 1 ? '🔔 طلب جديد وصل!' : `🔔 ${newCount} طلبات جديدة!`}
              </h4>
            </div>
            <p className="text-xs sm:text-sm text-emerald-100/90 font-medium leading-relaxed">
              {newCount === 1
                ? 'لديك طلب جديد في انتظار المراجعة.'
                : `لديك ${newCount} طلبات جديدة في انتظار المراجعة.`}
            </p>

            {/* أزرار الإجراء */}
            <div className="flex items-center gap-2 mt-3">
              <button
                type="button"
                onClick={() => {
                  onOpenOrders();
                  setIsVisible(false);
                }}
                className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-[#F5D76E] hover:bg-[#E5C455] text-[#1E4327] font-black text-xs transition-colors cursor-pointer active:scale-95"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>عرض الطلبات الآن</span>
              </button>

              {/* زر كتم/تفعيل الصوت */}
              <button
                type="button"
                onClick={onToggleSound}
                title={soundEnabled ? 'كتم التنبيهات' : 'تفعيل التنبيهات'}
                className={`w-9 h-9 rounded-lg flex items-center justify-center transition-colors cursor-pointer active:scale-95 ${
                  soundEnabled
                    ? 'bg-white/20 hover:bg-white/30 text-[#F5D76E]'
                    : 'bg-white/10 hover:bg-white/20 text-white/60'
                }`}
              >
                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              {/* زر إغلاق */}
              <button
                type="button"
                onClick={() => setIsVisible(false)}
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors cursor-pointer active:scale-95"
                aria-label="إغلاق"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};