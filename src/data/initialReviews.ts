export interface CustomerReview {
  id: string;
  author: string;
  neighborhood: string;
  rating: number;
  date: string;
  comment: string;
  verified: boolean;
}

export const INITIAL_THREE_REVIEWS: CustomerReview[] = [
  {
    id: 'rev-1',
    author: 'فاطمة الزهراء ب.',
    neighborhood: 'طريق إيموزار، فاس',
    rating: 5,
    date: 'منذ يومين',
    comment: 'تبارك الله السلعة نقية وطازجة بحال إلا مشيتي للسوق نقيتيها بيدك، والتوصيل ديما فالموعد.',
    verified: true,
  },
  {
    id: 'rev-2',
    author: 'أمين التازي',
    neighborhood: 'طريق عين الشقف، فاس',
    rating: 5,
    date: 'منذ 3 أيام',
    comment: 'خدمة في المستوى وكتوفر بزاف ديال الوقت، الخضرة كتوصل مقادة ومغسولة بعناية. برافو عليكم.',
    verified: true,
  },
  {
    id: 'rev-3',
    author: 'نادية بنجلون',
    neighborhood: 'حي الأطلس، فاس',
    rating: 5,
    date: 'منذ 5 أيام',
    comment: 'تعامل راقي وثقة كبيرة، الفواكه حلوة والخضر طرية بزاف. أول تجربة وأكيد ماشي الأخيرة.',
    verified: true,
  },
];
