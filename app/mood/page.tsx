import type { Metadata } from 'next';
import SheetPage from '@/components/SheetPage';

export const metadata: Metadata = {
  title: '心情树洞 · 光阴的故事',
};

export default function MoodPage() {
  return <SheetPage kind="mood" title="心情树洞" sub="树洞带你看见心情的颜色" />;
}
