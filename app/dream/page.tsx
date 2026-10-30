import type { Metadata } from 'next';
import SheetPage from '@/components/SheetPage';

export const metadata: Metadata = {
  title: '白日梦想家 · 光阴的故事',
};

export default function DreamPage() {
  return <SheetPage kind="dream" title="白日梦想家" sub="DAYDREAMER" />;
}
