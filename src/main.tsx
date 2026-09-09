import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// ─── تسجيل Service Worker ───
const registerServiceWorker = () => {
  // التحقق من دعم Service Worker في المتصفح
  if ('serviceWorker' in navigator) {
    // الانتظار حتى تحميل الصفحة بالكامل
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('✅ Service Worker مسجل بنجاح!', registration);
          
          // التحقق من وجود تحديث
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  console.log('🔄 تم تحديث Service Worker، يرجى تحديث الصفحة');
                }
              });
            }
          });
        })
        .catch((error) => {
          console.log('❌ فشل تسجيل Service Worker:', error);
        });
    });
  } else {
    console.log('⚠️ المتصفح لا يدعم Service Worker');
  }
};

// ─── تشغيل التطبيق ───
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// ─── تسجيل Service Worker بعد تحميل التطبيق ───
registerServiceWorker();

// ─── (اختياري) الاستماع لحدث التثبيت ───
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  console.log('📲 يمكن تثبيت التطبيق');
});

// ─── (اختياري) الاستماع لحدث التثبيت الناجح ───
window.addEventListener('appinstalled', () => {
  console.log('✅ تم تثبيت التطبيق بنجاح!');
});