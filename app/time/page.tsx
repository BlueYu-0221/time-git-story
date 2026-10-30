import type { Metadata } from 'next';
import SheetPage from '@/components/SheetPage';

export const metadata: Metadata = {
  title: '时间都去哪儿了 · 光阴的故事',
};

export default function TimePage() {
  return <SheetPage kind="time" title="时间都去哪儿了" sub="PLAN vs REALITY" />;
}
