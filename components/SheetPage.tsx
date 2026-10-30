'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { initPawnShop } from '@/lib/pawnshop';
import { listen, type VoiceKind } from '@/lib/speech';
import QuickTimeModal, { type QuickTimePayload } from './QuickTimeModal';
import TimePageBody from './TimePageBody';
import MoneyPageBody from './MoneyPageBody';
import MoodPageBody from './MoodPageBody';
import DreamPageBody from './DreamPageBody';

type SheetKind = 'time' | 'money' | 'mood' | 'dream';

const IDS: Record<SheetKind, { sheet: string; body: string }> = {
  time: { sheet: 'sTime', body: 'bTime' },
  money: { sheet: 'sMoney', body: 'bMoney' },
  mood: { sheet: 'sMood', body: 'bMood' },
  dream: { sheet: 'sDream', body: 'bDream' },
};

export default function SheetPage({
  kind,
  title,
  sub,
}: {
  kind: SheetKind;
  title: string;
  sub: string;
}) {
  const router = useRouter();
  const [quick, setQuick] = useState<QuickTimePayload | null>(null);
  const timeUi = useRef<{ statement?: (style: string) => void }>({});
  const moneyUi = useRef<{ statement?: (style: string) => void }>({});
  const moodUi = useRef<{ report?: () => void }>({});

  useEffect(() => {
    initPawnShop({
      mode: 'sheet',
      kind,
      body: 'react',
      onBack: () => router.push('/'),
      voice: (kind: VoiceKind) => listen(kind),
      ui: {
        quickTime: (payload: QuickTimePayload) => setQuick(payload),
        time: timeUi.current,
        money: moneyUi.current,
        mood: moodUi.current,
      },
    });
  }, [kind, router]);

  return (
    <>
      <section className="sheet" id={IDS[kind].sheet}>
        <div className="sheet-head">
          <button className="bk" data-back>
            <svg viewBox="0 0 24 24">
              <path d="M15 5l-7 7 7 7" />
            </svg>
          </button>
          <h2>
            {title}
            <small>{sub}</small>
          </h2>
        </div>
        <div className="sheet-body" id={IDS[kind].body}>
          {kind === 'time' && (
            <TimePageBody
              onStatement={(style) => timeUi.current.statement?.(style)}
            />
          )}
          {kind === 'money' && (
            <MoneyPageBody
              onStatement={(style) => moneyUi.current.statement?.(style)}
            />
          )}
          {kind === 'mood' && (
            <MoodPageBody onReport={() => moodUi.current.report?.()} />
          )}
          {kind === 'dream' && <DreamPageBody />}
        </div>
      </section>

      <div id="chime">
        <svg viewBox="0 0 74 118">
          <g
            stroke="#E4BC72"
            fill="none"
            strokeWidth="1.3"
            strokeLinecap="round"
          >
            <path d="M37 4v10" />
            <path d="M18 18h38" />
            <circle cx="37" cy="8" r="2.4" fill="#E4BC72" stroke="none" opacity=".85" />
            <path d="M24 18v34" opacity=".55" />
            <path d="M37 18v46" opacity=".55" />
            <path d="M50 18v28" opacity=".55" />
            <rect x="19.5" y="52" width="9" height="34" rx="4.5" fill="rgba(228,188,114,.16)" />
            <rect x="32.5" y="64" width="9" height="42" rx="4.5" fill="rgba(228,188,114,.16)" />
            <rect x="45.5" y="46" width="9" height="28" rx="4.5" fill="rgba(228,188,114,.16)" />
            <path d="M37 106v6" opacity=".5" />
            <path d="M30 114h14" opacity=".5" />
          </g>
        </svg>
      </div>

      <div id="toast"></div>
      <div className="modal" id="mMod">
        <div className="mask" data-close></div>
        <div className="panel" id="mModPanel"></div>
      </div>
      <div className="modal center" id="mAsk">
        <div className="mask" data-close></div>
        <div className="panel center" id="mAskPanel"></div>
      </div>

      {quick && (
        <QuickTimeModal payload={quick} onClose={() => setQuick(null)} />
      )}
    </>
  );
}
