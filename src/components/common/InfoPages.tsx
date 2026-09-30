// ============================================================
// الملف: InfoPages.tsx – الإصدار 2.0
// صفحات المعلومات – تصميم متناسق مع المتجر
// ============================================================
import React from 'react';
import {
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Leaf,
  Heart,
  Truck,
  Lock,
  CheckCircle2,
  Award,
  Users,
  Sparkles,
  Smartphone,
  Scale,
  MapPin,
  CreditCard,
  PackageCheck,
} from 'lucide-react';
import { STORE_CONFIG } from '../../data/config';

interface InfoPagesProps {
  page: 'about' | 'policy' | 'privacy';
  onBackToShop: () => void;
}

export const InfoPages: React.FC<InfoPagesProps> = ({ page, onBackToShop }) => {
  return (
    <div className="max-w-3xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-12">

      {/* ════════ زر العودة ════════ */}
      <button
        type="button"
        onClick={onBackToShop}
        className="inline-flex items-center gap-2 text-xs sm:text-sm font-black text-[#163920] hover:text-white bg-white hover:bg-[#163920] mb-5 cursor-pointer px-4 py-2.5 rounded-xl border-2 border-[#163920] shadow-sm hover:shadow-md active:scale-95 transition-all group touch-manipulation select-none"
      >
        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        <span>العودة للمتجر</span>
      </button>

      {/* ════════ صفحة "من نحن" ════════ */}
      {page === 'about' && (
        <article className="bg-white border border-[#E8E1D3] rounded-[24px] p-5 sm:p-8 shadow-sm text-right space-y-5 overflow-hidden relative">

          {/* زخرفة خلفية */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[#F5D76E]/10 to-transparent rounded-full blur-2xl pointer-events-none" />

          <div className="relative">
            {/* الرأس */}
            <div className="flex items-center gap-3 pb-4 border-b border-[#F0E9DA]">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#163920] to-[#0E2615] flex items-center justify-center shadow-md shrink-0">
                <Leaf className="w-6 h-6 text-[#F5D76E]" />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-black text-[#112616] leading-tight">
                  من نحن — قصة متجر خُضرة
                </h1>
                <span className="text-[11px] sm:text-xs text-[#787163] font-bold block mt-1">
                  مشروع مغربي 100% يربط الحقل ببيتك بأحدث تجربة تسوق رقمية
                </span>
              </div>
            </div>

            {/* القصة */}
            <p className="text-sm sm:text-base text-[#443F35] leading-relaxed mt-5">
              <strong className="text-[#112616]">خُضرة</strong> هو مشروع مغربي أصيل بمدينة فاس نشأ من فكرة بسيطة: كيف نمكّن العائلة المغربية من الحصول على خضر وفواكه طازجة ومنتجات بقالة يومية تماماً كما لو كانت قُطفت صبيحة اليوم، دون الحاجة لتحمّل عناء الازدحام، حرارة السوق، والبحث الشاق عن الجودة، مع توفير تجربة تسوق إلكترونية سريعة وسلسة للغاية.
            </p>

            {/* ما يجعلنا مختلفين */}
            <div className="bg-gradient-to-br from-[#F7F4EC] to-white p-5 rounded-2xl border border-[#E8E1D3] space-y-3 shadow-sm mt-5">
              <h3 className="font-black text-base text-[#112616] flex items-center gap-2">
                <Award className="w-4 h-4 text-[#C25E12]" />
                <span>ما الذي يجعلنا مختلفين في الجودة والخدمة؟</span>
              </h3>

              <ul className="space-y-3 text-xs sm:text-sm text-[#524B3E]">
                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-md bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 stroke-[2.5]" />
                  </span>
                  <span>
                    <strong className="text-[#112616]">علاقة مباشرة بالفلاحين:</strong> ننتقي المنتجات يومياً من أفضل المزارع والتعاونيات الفلاحية في سوس، دكالة، الغرب، سايس، وبركان.
                  </span>
                </li>

                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-md bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 stroke-[2.5]" />
                  </span>
                  <span>
                    <strong className="text-[#112616]">معايير الفرز والتعبئة الصحية:</strong> لا نضع في صندوقك سوى الثمار السليمة والناضجة والمختارة بعناية، وتصل إليك في صناديق حفظ مخصصة تحافظ على برودتها وطراوتها.
                  </span>
                </li>

                <li className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-md bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700 stroke-[2.5]" />
                  </span>
                  <span>
                    <strong className="text-[#112616]">احترام وقت الزبون:</strong> نلتزم بالمواعيد المحددة عبر مسارات توصيل تغطي كافة أحياء فاس ونوفر إمكانية المعاينة والدفع عند الباب.
                  </span>
                </li>
              </ul>
            </div>

            {/* ─── قسم جديد: مزايا تجربة المستخدم وسهولة اقتناء المنتجات ─── */}
            <div className="bg-gradient-to-br from-white via-[#FEFEFC] to-[#FAF8F3] p-5 rounded-2xl border-2 border-[#2D6A3F]/15 space-y-3.5 shadow-sm mt-5">
              <h3 className="font-black text-base text-[#1A3D24] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#EAB308] fill-[#EAB308]" />
                <span>مزايا جديدة لتجربة تسوق أسهل وأسرع</span>
              </h3>
              <p className="text-xs sm:text-sm text-[#5A6B5F] font-semibold leading-relaxed">
                طوّرنا متجر خُضرة بأحدث التقنيات الرقمية لنمنحك تجربة اقتناء مريحة وواضحة من أول نقرة حتى استلام طلبك:
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div className="p-3.5 rounded-xl bg-[#FAF8F3] border border-[#2D6A3F]/12 flex items-start gap-3">
                  <span className="w-8 h-8 rounded-lg bg-[#2D6A3F]/10 text-[#2D6A3F] flex items-center justify-center shrink-0 mt-0.5">
                    <Smartphone className="w-4 h-4 stroke-[2.5]" />
                  </span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-[#1A3D24]">تثبيت التطبيق الفوري الخفيف</h4>
                    <p className="text-[11px] sm:text-xs text-[#5A6B5F] leading-relaxed mt-0.5">
                      ثبّت تطبيق خُضرة الفوري على شاشتك الرئيسية بضغطة واحدة وبدون استهلاك ذاكرة الهاتف، لتصفح فائق السرعة في أي وقت.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FAF8F3] border border-[#2D6A3F]/12 flex items-start gap-3">
                  <span className="w-8 h-8 rounded-lg bg-[#EA580C]/10 text-[#EA580C] flex items-center justify-center shrink-0 mt-0.5">
                    <Scale className="w-4 h-4 stroke-[2.5]" />
                  </span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-[#1A3D24]">عداد أوزان ذكي وواضح (kg)</h4>
                    <p className="text-[11px] sm:text-xs text-[#5A6B5F] leading-relaxed mt-0.5">
                      اختر وعدّل الوزن بالكيلوغرام أو بالوحدة مباشرة داخل السلة بكل دقة وشفافية مع حساب لحظي للسعر الإجمالي دون أي التباس.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FAF8F3] border border-[#2D6A3F]/12 flex items-start gap-3">
                  <span className="w-8 h-8 rounded-lg bg-[#2D6A3F]/10 text-[#2D6A3F] flex items-center justify-center shrink-0 mt-0.5">
                    <PackageCheck className="w-4 h-4 stroke-[2.5]" />
                  </span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-[#1A3D24]">صناديق العائلة وفلاتر ذكية</h4>
                    <p className="text-[11px] sm:text-xs text-[#5A6B5F] leading-relaxed mt-0.5">
                      تصفح الفئات المصورة والبحث الفوري والفرز حسب السعر، أو اطلب صناديق العائلة الأسبوعية الجاهزة بتوفير مضمون.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FAF8F3] border border-[#2D6A3F]/12 flex items-start gap-3">
                  <span className="w-8 h-8 rounded-lg bg-[#EA580C]/10 text-[#EA580C] flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-4 h-4 stroke-[2.5]" />
                  </span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-[#1A3D24]">تحديد الموقع عبر الـ GPS</h4>
                    <p className="text-[11px] sm:text-xs text-[#5A6B5F] leading-relaxed mt-0.5">
                      إدراج موقع التوصيل بدقة بضغطة زر عبر الـ GPS مع شريط تفاعلي يحسب لك التوصيل المجاني تلقائياً.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#FAF8F3] border border-[#2D6A3F]/12 flex items-start gap-3 sm:col-span-2">
                  <span className="w-8 h-8 rounded-lg bg-[#2D6A3F]/10 text-[#2D6A3F] flex items-center justify-center shrink-0 mt-0.5">
                    <CreditCard className="w-4 h-4 stroke-[2.5]" />
                  </span>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-[#1A3D24]">إتمام طلب آمن وخيارات دفع مرنة</h4>
                    <p className="text-[11px] sm:text-xs text-[#5A6B5F] leading-relaxed mt-0.5">
                      اختر بين الدفع نقداً عند الاستلام أو التحويل البنكي السريع لمختلف البنوك المغربية مع إرفاق الوصل وتأكيد فوري عبر واتساب.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* الخاتمة */}
            <p className="text-xs sm:text-sm text-[#524B3E] leading-relaxed mt-5 p-4 bg-amber-50/50 border border-amber-200 rounded-xl">
              هدفنا أن نكون سلتك الغذائية الموثوقة التي لا تخذلك أبداً، بأسعار عادلة ومعاملة ملؤها التقدير والاحترام. 🌿
            </p>

            {/* شارات الثقة */}
            <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-[#F0E9DA]">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-[#163920] bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                <Truck className="w-3.5 h-3.5" />
                توصيل سريع
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-[#163920] bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5" />
                ضمان الجودة
              </span>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-black text-[#163920] bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                <Users className="w-3.5 h-3.5" />
                +500 عميل سعيد
              </span>
            </div>
          </div>
        </article>
      )}

      {/* ════════ صفحة "سياسة الاسترجاع" ════════ */}
      {page === 'policy' && (
        <article className="bg-white border border-[#E8E1D3] rounded-[24px] p-5 sm:p-8 shadow-sm text-right space-y-5 overflow-hidden relative">

          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-amber-100/30 to-transparent rounded-full blur-2xl pointer-events-none" />

          <div className="relative">
            {/* الرأس */}
            <div className="flex items-center gap-3 pb-4 border-b border-[#F0E9DA]">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#C25E12] to-[#9C4505] flex items-center justify-center shadow-md shrink-0">
                <RefreshCw className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-black text-[#112616] leading-tight">
                  سياسة الاستبدال والاسترجاع
                </h1>
                <span className="text-[11px] sm:text-xs text-[#787163] font-bold block mt-1">
                  ضمان كامل ورضا تام دون أي تعقيد
                </span>
              </div>
            </div>

            <p className="text-sm sm:text-base text-[#443F35] leading-relaxed mt-5">
              في متجر خُضرة، ثقتك وراحة بالك هما الأساس. إذا لم تكن راضياً بنسبة 100% عن أي صنف من أصناف طلبك، فنحن هنا لنصلح الأمر فوراً:
            </p>

            {/* الخطوات الثلاث */}
            <div className="space-y-3 mt-5">
              <PolicyStep
                number={1}
                title="المعاينة عند الاستلام"
                description="يحق لك دائماً تفقد طلبك عند وصول السائق. إذا لاحظت أي منتج لا يطابق توقعاتك، يمكنك إرجاعه مباشرة مع السائق دون أي مصاريف إضافية."
              />
              <PolicyStep
                number={2}
                title="الإبلاغ في نفس اليوم"
                description="إذا لاحظت أي عيب بعد انصراف السائق، يكفي أن ترسل لنا رسالة وصورة سريعة عبر واتساب في غضون 24 ساعة، وسنقوم فوراً باستبدال المنتج أو خصم قيمته من طلبك القادم."
              />
              <PolicyStep
                number={3}
                title="استرداد الأموال"
                description="في حالة الدفع المسبق بالتحويل البنكي، نقوم بإعادة المبلغ لحسابك البنكي خلال ساعات معدودة في حالة إلغاء أي صنف غير متوفر أو غير مطابق."
              />
            </div>

            {/* ملاحظة */}
            <div className="mt-5 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm text-emerald-900 font-medium leading-relaxed">
                <strong className="font-black">ضماننا لك:</strong> رضاك هو رأس مالنا. لن نتردد في تعويضك عن أي منتج لم ينل إعجابك.
              </p>
            </div>
          </div>
        </article>
      )}

      {/* ════════ صفحة "سياسة الخصوصية" ════════ */}
      {page === 'privacy' && (
        <article className="bg-white border border-[#E8E1D3] rounded-[24px] p-5 sm:p-8 shadow-sm text-right space-y-5 overflow-hidden relative">

          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-100/30 to-transparent rounded-full blur-2xl pointer-events-none" />

          <div className="relative">
            {/* الرأس */}
            <div className="flex items-center gap-3 pb-4 border-b border-[#F0E9DA]">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#163920] to-[#0E2615] flex items-center justify-center shadow-md shrink-0">
                <Lock className="w-6 h-6 text-[#F5D76E]" />
              </div>
              <div>
                <h1 className="text-lg sm:text-2xl font-black text-[#112616] leading-tight">
                  سياسة الخصوصية وأمان البيانات
                </h1>
                <span className="text-[11px] sm:text-xs text-[#787163] font-bold block mt-1">
                  نحمي معلوماتك الشخصية بكل حرص وأمانة
                </span>
              </div>
            </div>

            <p className="text-sm sm:text-base text-[#443F35] leading-relaxed mt-5">
              نحن نلتزم بحماية خصوصية جميع زبنائنا الكرام. توضح هذه الوثيقة كيف نتعامل مع معلوماتك:
            </p>

            <div className="space-y-3 mt-5">
              <PrivacyCard
                title="المعلومات التي نحتاجها منك"
                description="نطلب منك فقط المعلومات الضرورية لإيصال الطلب: الاسم الكامل، رقم الهاتف للتواصل، وعنوان الإقامة المحدد."
              />
              <PrivacyCard
                title="كيف نستخدم معلوماتك"
                description="تستخدم معلوماتك حصرياً لتجهيز الطلب، والتنسيق مع سائق التوصيل، والتواصل معك عبر واتساب بخصوص تفاصيل طلبك فقط."
              />
              <PrivacyCard
                title="عدم مشاركة البيانات"
                description="نحن لا نبيع، ولا نؤجر، ولا نشارك أي معلومة من معلوماتك مع أي أطراف ثالثة أو شركات إعلانية تحت أي ظرف كان."
              />
            </div>

            {/* ملاحظة */}
            <div className="mt-5 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5">
              <Heart className="w-5 h-5 text-[#C25E12] shrink-0 mt-0.5" />
              <p className="text-xs sm:text-sm text-amber-900 font-medium leading-relaxed">
                <strong className="font-black">التزامنا:</strong> نستخدم بياناتك فقط لخدمتك بشكل أفضل. بياناتك أمانة في أعناقنا.
              </p>
            </div>
          </div>
        </article>
      )}

    </div>
  );
};

// ════════ مكون فرعي: خطوة سياسة ════════
interface PolicyStepProps {
  number: number;
  title: string;
  description: string;
}

const PolicyStep: React.FC<PolicyStepProps> = ({ number, title, description }) => (
  <div className="p-4 bg-[#F7F4EC] rounded-xl border border-[#E8E1D3] hover:border-[#C25E12]/40 hover:shadow-sm transition-all">
    <div className="flex items-start gap-3">
      <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#C25E12] to-[#9C4505] text-white flex items-center justify-center font-black text-sm shadow-sm shrink-0">
        {number}
      </span>
      <div className="flex-1">
        <h4 className="font-black text-[#112616] text-sm mb-1">{title}</h4>
        <p className="text-xs sm:text-sm text-[#524B3E] leading-relaxed">{description}</p>
      </div>
    </div>
  </div>
);

// ════════ مكون فرعي: بطاقة خصوصية ════════
interface PrivacyCardProps {
  title: string;
  description: string;
}

const PrivacyCard: React.FC<PrivacyCardProps> = ({ title, description }) => (
  <div className="p-4 bg-[#F7F4EC] rounded-xl border border-[#E8E1D3] hover:border-[#163920]/40 hover:shadow-sm transition-all">
    <div className="flex items-start gap-3">
      <span className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0 mt-0.5">
        <ShieldCheck className="w-4 h-4 text-emerald-700 stroke-[2.5]" />
      </span>
      <div className="flex-1">
        <h4 className="font-black text-[#112616] text-sm mb-1">{title}</h4>
        <p className="text-xs sm:text-sm text-[#524B3E] leading-relaxed">{description}</p>
      </div>
    </div>
  </div>
);