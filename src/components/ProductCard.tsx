// ═══════ زر الإضافة (المُحدَّث) ═══════
<RippleButton
  disabled={isSoldOut}
  onClick={handleAdd}
  ariaLabel={isSoldOut ? 'غير متوفر' : 'أضف للسلة'}
  rippleColor="rgba(255,255,255,0.30)"
  className={`w-full h-[48px] sm:h-[52px] min-h-[48px] sm:min-h-[52px] px-4 sm:px-5 rounded-xl font-black text-[14px] sm:text-[15px] flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer touch-manipulation select-none active:scale-95 ${
    isSoldOut
      ? 'bg-stone-200 text-stone-500 border border-stone-300 cursor-not-allowed'
      : isJustAdded
      ? 'bg-gradient-to-l from-emerald-600 to-emerald-700 text-white shadow-[0_4px_14px_rgba(5,150,105,0.30)] scale-[1.02]'
      : inCartQty > 0
      ? 'bg-gradient-to-l from-[#EA580C] to-[#C25E12] hover:from-[#F97316] hover:to-[#EA580C] text-white shadow-[0_4px_14px_rgba(234,88,12,0.30)] hover:shadow-[0_6px_22px_rgba(234,88,12,0.42)] border border-[#EAB308]/25'
      : 'bg-gradient-to-l from-[#2D6A3F] to-[#1A3D24] hover:from-[#3A8152] hover:to-[#2D6A3F] text-white shadow-[0_4px_14px_rgba(45,106,63,0.30)] hover:shadow-[0_6px_22px_rgba(45,106,63,0.42)] border border-[#EAB308]/25'
  }`}
>
  {isSoldOut ? (
    <span className="relative z-10">غير متوفر</span>
  ) : isJustAdded ? (
    <>
      <Check className="w-5 h-5 text-white animate-in zoom-in stroke-[2.5] relative z-10" />
      <span className="relative z-10">تمت الإضافة</span>
    </>
  ) : inCartQty > 0 ? (
    <>
      <ShoppingBag className="w-5 h-5 text-white relative z-10" strokeWidth={2.5} />
      <span className="relative z-10 whitespace-nowrap">أضف المزيد</span>
      <span className="px-2 py-0.5 rounded-md bg-white/20 text-white text-[12px] font-black tabular-nums relative z-10">
        {inCartQty}
      </span>
    </>
  ) : (
    <>
      <ShoppingBag className="w-5 h-5 text-[#EAB308] relative z-10" strokeWidth={2.5} />
      <span className="relative z-10 whitespace-nowrap">أضف للسلة</span>
    </>
  )}
</RippleButton>