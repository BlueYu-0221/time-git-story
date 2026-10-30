import type { Metadata } from 'next';
import SheetPage from '@/components/SheetPage';

export const metadata: Metadata = {
  title: '我的钱都去哪儿了 · 光阴的故事',
};

export default function MoneyPage() {
  return <SheetPage kind="money" title="我的钱都去哪儿了" sub="WHY MONEY FLOWS" />;
}
