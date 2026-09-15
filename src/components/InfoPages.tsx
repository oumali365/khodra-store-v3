import React from 'react';
import { ArrowRight, ShieldCheck, RefreshCw, Info, Heart, Truck } from 'lucide-react';
import { STORE_CONFIG } from '../data/config';

interface InfoPagesProps {
  page: 'about' | 'policy' | 'privacy';
  onBackToShop: () => void;
}

export const InfoPages: React.FC<InfoPagesProps> = ({ page, onBackToShop }) => {
  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <button
        type="button"
        onClick={onBackToShop}
        className="inline-flex items-center gap-2 text-xs sm:text-sm font-extrabold text-[#D9762B] hover:text-[#B85E1C] mb-6 cursor-pointer bg-white px-4 py-2 rounded-xl border border-[#DFD1AC] shadow-2xs"
      >
        <ArrowRight className="w-4 h-4" />
        <span>العودة للمتجر والمنتجات</span>
      </button>

      {page === 'about' ? (
        <div className="space-y-6">
          {/* 1. حاوية قصة المتجر والقيم */}
          <article className="bg-white border-1.5 border-[#E2D5B7] rounded-3xl p-6 sm:p-10 shadow-sm text-right space-y-6">
            <div className="flex items-center gap-3 text-[#1B3A20] pb-4 border-b border-[#F3ECDD]">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#4F8A5A] flex items-center justify-center text-2xl select-none">
                🌿
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-extrabold">
                  من نحن — قصة متجر خُضرة
                </h1>
                <span className="text-xs sm:text-sm text-[#736B58]">مشروع مغربي 100% يربط الحقل ببيتك</span>
              </div>
            </div>

            <p className="text-sm sm:text-base text-[#443F35] leading-relaxed">
              <strong>خُضرة</strong> هو مشروع مغربي أصيل نشأ من فكرة بسيطة: كيف نمكّن العائلة المغربية من الحصول على خضر وفواكه طازجة تماماً كما لو كانت قطفت صبيحة اليوم، دون الحاجة لتحمل عناء الازدحام، حرارة السوق، والبحث الشاق عن الجودة.
            </p>

            <div className="bg-[#FAF6EE] p-5 rounded-2xl border border-[#DFD1AC] space-y-3">
              <h3 className="font-extrabold text-base text-[#1B3A20]">
                ما الذي يجعلنا مختلفين؟
              </h3>
              <ul className="space-y-2.5 text-xs sm:text-sm text-[#5D5545]">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold text-base">✓</span>
                  <span><strong>علاقة مباشرة بالفلاحين:</strong> نشتري المنتجات من المزارع والتعاونيات الفلاحية في سوس، دكالة، الغرب، وبركان.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold text-base">✓</span>
                  <span><strong>معايير الفرز الدقيقة:</strong> لا نضع في صندوقك سوى الثمار السليمة والناضجة والمختارة بعناية.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold text-base">✓</span>
                  <span><strong>احترام وقت الزبون:</strong> نلتزم بالمواعيد المحددة ونوفر إمكانية الدفع عند الباب بعد الفحص والمعاينة.</span>
                </li>
              </ul>
            </div>

            <p className="text-xs sm:text-sm text-[#5D5545] leading-relaxed">
              هدفنا أن نكون سلتك الغذائية الموثوقة التي لا تخذلك أبداً، بأسعار عادلة ومعاملة ملؤها التقدير والاحترام.
            </p>
          </article>
        </div>
      ) : (
        <div className="bg-white border-1.5 border-[#E2D5B7] rounded-3xl p-6 sm:p-10 shadow-sm text-right space-y-6">
          {page === 'policy' && (
            <article className="space-y-4">
              <div className="flex items-center gap-3 text-[#1B3A20] pb-4 border-b border-[#F3ECDD]">
                <div className="w-12 h-12 rounded-xl bg-amber-50 text-[#D9762B] flex items-center justify-center">
                  <RefreshCw className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-extrabold">
                    سياسة الاستبدال والاسترجاع
                  </h1>
                  <span className="text-xs sm:text-sm text-[#736B58]">ضمان كامل ورضا تام دون أي تعقيد</span>
                </div>
              </div>

              <p className="text-sm sm:text-base text-[#443F35] leading-relaxed">
                في متجر خُضرة، ثقتك وراحة بالك هما الأساس. إذا لم تكن راضياً بنسبة 100% عن أي صنف من أصناف طلبك، فنحن هنا لنصلح الأمر فوراً:
              </p>

              <div className="space-y-3 text-xs sm:text-sm text-[#5D5545]">
                <div className="p-4 bg-[#FAF6EE] rounded-xl border border-[#DFD1AC]">
                  <h4 className="font-extrabold text-[#1B3A20] text-sm sm:text-base mb-1">1. المعاينة عند الاستلام</h4>
                  <p>يحق لك دائماً تفقد طلبك عند وصول السائق. إذا لاحظت أي منتج لا يطابق توقعاتك، يمكنك إرجاعه مباشرة مع السائق دون أي مصاريف إضافية.</p>
                </div>

                <div className="p-4 bg-[#FAF6EE] rounded-xl border border-[#DFD1AC]">
                  <h4 className="font-extrabold text-[#1B3A20] text-sm sm:text-base mb-1">2. الإبلاغ في نفس اليوم</h4>
                  <p>إذا لاحظت أي عيب بعد انصراف السائق، يكفي أن ترسل لنا رسالة وصورة سريعة عبر واتساب في غضون 24 ساعة، وسنقوم فوراً باستبدال المنتج أو خصم قيمته من طلبك القادم.</p>
                </div>

                <div className="p-4 bg-[#FAF6EE] rounded-xl border border-[#DFD1AC]">
                  <h4 className="font-extrabold text-[#1B3A20] text-sm sm:text-base mb-1">3. استرداد الأموال</h4>
                  <p>في حالة الدفع المسبق بالتحويل البنكي، نقوم بإعادة المبلغ لحسابك البنكي خلال ساعات معدودة في حالة إلغاء أي صنف غير متوفر أو غير مطابق.</p>
                </div>
              </div>
            </article>
          )}

          {page === 'privacy' && (
            <article className="space-y-4">
              <div className="flex items-center gap-3 text-[#1B3A20] pb-4 border-b border-[#F3ECDD]">
                <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#2E5336] flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-extrabold">
                    سياسة الخصوصية وأمان البيانات
                  </h1>
                  <span className="text-xs sm:text-sm text-[#736B58]">نحمي معلوماتك الشخصية بكل حرص وأمانة</span>
                </div>
              </div>

              <p className="text-sm sm:text-base text-[#443F35] leading-relaxed">
                نحن نلتزم بحماية خصوصية جميع زبنائنا الكرام. توضح هذه الوثيقة كيف نتعامل مع معلوماتك:
              </p>

              <div className="space-y-3 text-xs sm:text-sm text-[#5D5545]">
                <div className="p-4 bg-[#FAF6EE] rounded-xl border border-[#DFD1AC]">
                  <h4 className="font-extrabold text-[#1B3A20] text-sm sm:text-base mb-1">المعلومات التي نحتاجها منك</h4>
                  <p>نطلب منك فقط المعلومات الضرورية لإيصال الطلب: الاسم الكامل، رقم الهاتف للتواصل، وعنوان الإقامة المحدد.</p>
                </div>

                <div className="p-4 bg-[#FAF6EE] rounded-xl border border-[#DFD1AC]">
                  <h4 className="font-extrabold text-[#1B3A20] text-sm sm:text-base mb-1">كيف نستخدم معلوماتك</h4>
                  <p>تستخدم معلوماتك حصرياً لتجهيز الطلب، والتنسيق مع سائق التوصيل، والتواصل معك عبر واتساب بخصوص تفاصيل طلبك فقط.</p>
                </div>

                <div className="p-4 bg-[#FAF6EE] rounded-xl border border-[#DFD1AC]">
                  <h4 className="font-extrabold text-[#1B3A20] text-sm sm:text-base mb-1">عدم مشاركة البيانات</h4>
                  <p>نحن لا نبيع، ولا نؤجر، ولا نشارك أي معلومة من معلوماتك مع أي أطراف ثالثة أو شركات إعلانية تحت أي ظرف كان.</p>
                </div>
              </div>
            </article>
          )}
        </div>
      )}
    </div>
  );
};
