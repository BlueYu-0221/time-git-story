'use client';

import { useEffect, useRef, useState } from 'react';
import { cnDate, parseTasks } from '@/lib/timeTasks';
import { addTimeTasks, getVoiceMode } from '@/lib/storyStore';
import { listen } from '@/lib/speech';
import { saveRecord } from '@/lib/records';

export type QuickTimePayload = {
  kind: 'plan' | 'actual';
  isPlan: boolean;
  poem: [string, string];
  date: string;
  /** 保存成功后让页面重新读取数据并刷新 */
  refresh: (date: string, message: string) => void;
};

type Props = {
  payload: QuickTimePayload;
  onClose: () => void;
};

export default function QuickTimeModal({ payload, onClose }: Props) {
  const [date, setDate] = useState(payload.date);
  const [text, setText] = useState('');
  const [hint, setHint] = useState('');
  const [recording, setRecording] = useState(false);
  const boxRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const t = setTimeout(() => boxRef.current?.focus(), 180);
    return () => clearTimeout(t);
  }, []);

  const label = payload.isPlan ? '计划' : '实际';

  const submit = () => {
    const value = text.trim();
    if (!value) {
      setHint('先说一件事');
      return;
    }
    const tasks = parseTasks(value);
    if (!tasks.length) {
      setHint('没听懂，换个说法试试，带上时长更容易');
      return;
    }
    const ok = addTimeTasks(
      date,
      payload.kind,
      tasks.map(({ t, min, cat }) => ({ t, min, cat }))
    );
    if (!ok) {
      setHint('本地数据还没准备好，刷新页面再试');
      return;
    }
    void saveRecord('time', {
      asr_text: value,
      parsed_data: {
        kind: 'time',
        tasks,
        count: tasks.length,
        totalMin: tasks.reduce((s, t) => s + t.min, 0),
      },
    });
    const more = tasks.length > 1 ? ` 等 ${tasks.length} 条` : '';
    payload.refresh(
      date,
      `已记入 ${cnDate(date)} 的${label}：${tasks[0].t}${more} · 时间线和进度条已更新`
    );
    onClose();
  };

  const speak = async () => {
    setRecording(true);
    setHint('');
    try {
      const tx = await listen(payload.kind);
      if (tx) {
        setText(tx);
        boxRef.current?.focus();
      } else {
        setHint('没听清，再说一次；也可以直接打字');
      }
    } catch (e) {
      setHint(e instanceof Error ? e.message : '语音识别失败，请再说一次');
    } finally {
      setRecording(false);
    }
  };

  return (
    <div className="modal center open">
      <div className="mask" onClick={onClose}></div>
      <div className="panel center big">
        <button className="closex" onClick={onClose}>
          ×
        </button>
        <div className="qt-poem">
          {payload.poem[0]}
          <em dangerouslySetInnerHTML={{ __html: payload.poem[1] }} />
        </div>

        {recording ? (
          <div className="rec">
            <div className="mic">
              <svg viewBox="0 0 24 24">
                <path d="M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3z" />
                <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3" />
              </svg>
            </div>
            <div className="wave">
              {Array.from({ length: 13 }).map((_, i) => (
                <i key={i} style={{ animationDelay: `${i * 0.07}s` }} />
              ))}
            </div>
            <div
              className="mini"
              style={{ marginTop: 10, letterSpacing: '1.6px' }}
            >
              正在聆听…
            </div>
            <div className="mini" style={{ marginTop: 6 }}>
              {getVoiceMode() === 'mock'
                ? '（演示模式 · 将填入示例文案）'
                : '（腾讯云实时识别 · 说完停一下会自动结束）'}
            </div>
          </div>
        ) : (
          <>
            <div
              className="row"
              style={{ margin: '0 0 12px', alignItems: 'center', gap: 10 }}
            >
              <span
                className="mini"
                style={{ flex: 'none', letterSpacing: '1px' }}
              >
                这是哪一天的{label}？
              </span>
              <input
                className="inp"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                style={{ flex: 1 }}
              />
            </div>
            <textarea
              ref={boxRef}
              className="inp qt-box"
              placeholder={payload.isPlan ? '比如：写周报 2 小时' : '比如：跑步半小时'}
              value={text}
              onChange={(e) => {
                setText(e.target.value);
                if (hint) setHint('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  submit();
                }
              }}
            />
            {hint && (
              <div
                className="mini"
                style={{ color: '#F0997B', marginTop: 8, letterSpacing: '1px' }}
              >
                {hint}
              </div>
            )}
            <div className="row" style={{ margin: '16px 0 0' }}>
              <button className="btn sm" title="语音说一条" onClick={speak}>
                <svg viewBox="0 0 24 24">
                  <path d="M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3z" />
                  <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0" />
                  <path d="M12 18v3" />
                </svg>
                说给掌柜
              </button>
              <span style={{ flex: 1 }}></span>
              <button className="btn" onClick={onClose}>
                再想想
              </button>
              <button className="btn pri" onClick={submit}>
                记下
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
