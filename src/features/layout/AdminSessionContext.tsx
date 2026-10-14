import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

interface AdminSessionContextType {
  extendSession: () => void;
}

const AdminSessionContext = createContext<AdminSessionContextType | undefined>(undefined);

export const AdminSessionProvider: React.FC<{ children: React.ReactNode; isAdmin: boolean; onLogout: () => void }> = ({ children, isAdmin, onLogout }) => {
  const [showInactivityWarning, setShowInactivityWarning] = useState(false);
  const lastActivityRef = useRef<number>(Date.now());

  const extendSession = useCallback(() => {
    lastActivityRef.current = Date.now();
    setShowInactivityWarning(false);
  }, []);

  useEffect(() => {
    if (!isAdmin) return;

    const INACTIVITY_LIMIT_MS = 30 * 60 * 1000; // 30 دقيقة
    const WARNING_THRESHOLD_MS = 28 * 60 * 1000; // 28 دقيقة

    const updateActivity = () => {
      lastActivityRef.current = Date.now();
      if (showInactivityWarning) setShowInactivityWarning(false);
    };

    const events = ['mousemove', 'mousedown', 'keypress', 'touchstart', 'scroll'];
    events.forEach((ev) => window.addEventListener(ev, updateActivity, { passive: true }));

    const interval = setInterval(() => {
      const inactiveDuration = Date.now() - lastActivityRef.current;
      if (inactiveDuration >= INACTIVITY_LIMIT_MS) {
        onLogout();
      } else if (inactiveDuration >= WARNING_THRESHOLD_MS && !showInactivityWarning) {
        setShowInactivityWarning(true);
      }
    }, 10000);

    return () => {
      events.forEach((ev) => window.removeEventListener(ev, updateActivity));
      clearInterval(interval);
    };
  }, [isAdmin, onLogout, showInactivityWarning]);

  return (
    <AdminSessionContext.Provider value={{ extendSession }}>
      {children}
      {showInactivityWarning && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl border-2 border-amber-500 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto text-2xl font-black">
              ⏰
            </div>
            <div>
              <h3 className="text-base font-black text-stone-900">تنبيه خمول الجلسة</h3>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                ستنتهي جلسة الإدارة قريباً لعدم وجود نشاط. هل تريد تمديد الجلسة؟
              </p>
            </div>
            <button
              type="button"
              onClick={extendSession}
              className="w-full py-3 rounded-xl bg-[#163920] hover:bg-[#0E2615] text-white font-black text-xs cursor-pointer shadow-md transition-all"
            >
              تمديد الجلسة
            </button>
          </div>
        </div>
      )}
    </AdminSessionContext.Provider>
  );
};

export const useAdminSession = () => {
  const context = useContext(AdminSessionContext);
  if (context === undefined) {
    throw new Error('useAdminSession must be used within an AdminSessionProvider');
  }
  return context;
};
