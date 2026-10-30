'use client';

import { useEffect, useRef, useState } from 'react';
import { aiCall } from '@/lib/ai';
import { listen } from '@/lib/speech';
import { readStory, writeStory } from '@/lib/storyStore';
import { cnDate, todayISO } from '@/lib/moneyData';
import {
  DEF_MOODS,
  addMood,
  addMoodCat,
  deleteMood,
  deleteMoodCat,
  moodCatList,
  moodColor,
  moodDays,
  moodEcho,
  moodRange,
  renameMoodCat,
  saveEcho,
  uid,
  type MoodEntry,
} from '@/lib/moodData';
import DateFoldList from './DateFoldList';

const ECHO_SYS =
  '你是一个温柔的树洞，会对用户的倾诉给出一句 30 字以内、真诚不鸡汤的回应。';

type EchoModal =
  | { loading: true }
  | { loading: false; text: string; mock: boolean }
  | null;

export default function MoodPageBody({ onReport }: { onReport: () => void }) {
  const [db, setDb] = useState<any>(null);
  const [moodPick, setMoodPick] = useState('');
  const [text, setText] = useState('');
  const [photo, setPhoto] = useState('');
  const [newCat, setNewCat] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [echoModal, setEchoModal] = useState<EchoModal>(null);
  const [listening, setListening] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    setDb(readStory());
  }, []);

  const toast = (msg: string) => {
    setToastMsg(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToastMsg(''), 2100);
  };

  const reload = () => setDb(readStory());

  const setRangeKind = (kind: string) => {
    const d: any = readStory();
    if (!d) return;
    d.moodRangeSel = d.moodRangeSel || { kind: 'month' };
    d.moodRangeSel.kind = kind;
    if (kind === 'custom') {
      d.moodRangeSel.from = d.moodRangeSel.from || todayISO();
      d.moodRangeSel.to = d.moodRangeSel.to || todayISO();
    }
    writeStory(d);
    reload();
  };

  const setRangeDate = (which: 'from' | 'to', value: string) => {
    const d: any = readStory();
    if (!d) return;
    d.moodRangeSel = d.moodRangeSel || { kind: 'custom' };
    d.moodRangeSel[which] = value || todayISO();
    writeStory(d);
    reload();
  };

  if (!db) return null;

  const list: MoodEntry[] = (db.mood || [])
    .slice()
    .sort((a: MoodEntry, b: MoodEntry) => (a.date < b.date ? 1 : -1));
  const cats = moodCatList(db);
  const R = moodRange(db);
  const pickPhoto = (file?: File) => {
    if (!file) return;
    const fr = new FileReader();
    fr.onload = () => {
      const im = new Image();
      im.onload = () => {
        const w = Math.min(680, im.width);
        const h = (im.height * w) / im.width;
        const cv = document.createElement('canvas');
        cv.width = w;
        cv.height = h;
        cv.getContext('2d')!.drawImage(im, 0, 0, w, h);
        setPhoto(cv.toDataURL('image/jpeg', 0.66));
      };
      im.src = String(fr.result);
    };
    fr.readAsDataURL(file);
  };

  const speak = async () => {
    setListening(true);
    try {
      const tx = await listen('mood');
      if (tx) setText(tx);
    } catch {
      /* 识别失败时不写入内容 */
    } finally {
      setListening(false);
    }
  };

  const runEcho = async (
    id: string,
    content: string,
    mood: string,
    autoClose: boolean
  ) => {
    setEchoModal({ loading: true });
    const r = await aiCall(ECHO_SYS, '我说的是：' + content, () =>
      moodEcho({ seed: id, mood })
    );
    saveEcho(id, r.text);
    reload();
    if (autoClose) setEchoModal(null);
    else setEchoModal({ loading: false, text: r.text, mock: r.mock });
  };

  const save = () => {
    const v = text.trim();
    if (!v && !photo) {
      toast('写一句，或者拍张照');
      return;
    }
    const id = uid();
    addMood({
      id,
      date: todayISO(),
      text: v || '(只有一张照片)',
      mood: moodPick,
      photo: photo || '',
    });
    setText('');
    setPhoto('');
    reload();
    toast('存进树洞了');
    runEcho(id, v, moodPick, false);
  };

  return (
    <>
      {/* 快速记录 */}
      <div className="mood-quick">
        {list.length === 0 ? (
          <>
            <div className="mood-quick-hint">树洞还空空的</div>
            <div className="mood-quick-hint" style={{ marginTop: 2, marginBottom: 4 }}>
              好的坏的都丢进来，树洞替你收好每一次
            </div>
          </>
        ) : (
          <div className="mood-quick-hint">好的坏的都丢进来，树洞替你收好每一次</div>
        )}
        <textarea
          className="inp qt-box"
          placeholder="想到什么写什么，不必斟酌字句"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <div className="chips" style={{ marginTop: 12 }}>
          {cats.map((m) => (
            <button
              key={m.k}
              className={`chip${moodPick === m.k ? ' on' : ''}`}
              onClick={() => setMoodPick(m.k)}
            >
              {m.k}
            </button>
          ))}
          <button
            className={`chip${moodPick === '' ? ' on' : ''}`}
            onClick={() => setMoodPick('')}
          >
            不分类
          </button>
        </div>
        <div className="row" style={{ marginTop: 14, width: '100%', maxWidth: 380 }}>
          <button className="btn" onClick={speak}>
            <svg viewBox="0 0 24 24">
              <path d="M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3z" />
              <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0" />
            </svg>
            {listening ? '聆听中…' : '说出来'}
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            <svg viewBox="0 0 24 24">
              <path d="M3 8.5A1.5 1.5 0 0 1 4.5 7h2.2l1.1-2h8.4l1.1 2h2.2A1.5 1.5 0 0 1 21 8.5v9A1.5 1.5 0 0 1 19.5 19h-15A1.5 1.5 0 0 1 3 17.5z" />
              <circle cx="12" cy="13" r="3.2" />
            </svg>
            拍张照
          </button>
          <button className="btn pri" onClick={save}>
            存进树洞
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          style={{ display: 'none' }}
          onChange={(e) => pickPhoto(e.target.files?.[0])}
        />
        {photo && (
          <div style={{ marginTop: 10 }}>
            <img
              src={photo}
              alt=""
              style={{
                width: 70,
                height: 70,
                objectFit: 'cover',
                borderRadius: 9,
                border: '1px solid var(--line2)',
              }}
            />
          </div>
        )}
      </div>

      {/* 心情标签 */}
      <div className="sec">
        <div className="sec-t">
          心情标签 · 自创自改<span className="r">喜怒哀乐不够 · 便自己造</span>
        </div>
        <div className="box">
          {cats.map((m, i) => (
            <div className="item" key={m.k}>
              <span className="dot" style={{ color: m.c, background: m.c }}></span>
              <div className="c">
                {i < DEF_MOODS.length ? (
                  <div className="t">{m.k}</div>
                ) : (
                  <input
                    className="inp"
                    defaultValue={m.k}
                    style={{
                      padding: '6px 9px',
                      fontSize: 12,
                      background: 'transparent',
                      border: 'none',
                    }}
                    onBlur={(e) => {
                      const nv = e.target.value.trim() || m.k;
                      if (nv === m.k) return;
                      if (cats.some((c) => c.k === nv)) {
                        toast('已经有这个心情了');
                        e.target.value = m.k;
                        return;
                      }
                      renameMoodCat(m.k, nv);
                      reload();
                      toast('已改名，旧记录同步更新');
                    }}
                  />
                )}
              </div>
              {i >= DEF_MOODS.length && (
                <button
                  className="x"
                  onClick={() => {
                    deleteMoodCat(m.k);
                    reload();
                  }}
                >
                  ×
                </button>
              )}
            </div>
          ))}
          <div className="row" style={{ marginTop: 10 }}>
            <input
              className="inp"
              placeholder="造一种心情，如：上头 / 麻了 / 平静"
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              style={{ flex: 1 }}
            />
            <button
              className="btn sm"
              onClick={() => {
                const v = newCat.trim();
                if (!v) {
                  toast('写个心情名');
                  return;
                }
                if (cats.some((c) => c.k === v)) {
                  toast('已经有这个心情了');
                  return;
                }
                addMoodCat(v);
                setNewCat('');
                reload();
                toast('新心情已上架');
              }}
            >
              加
            </button>
          </div>
          <div className="mini" style={{ marginTop: 8 }}>
            自带心情不可删；自定义的，可改名删去，
            <br />
            旧日记录亦随之而改。
          </div>
        </div>
      </div>

      {/* 近三十日 */}
      <div className="sec">
        <div className="sec-t">近三十日 · 心情树洞</div>
        <div className="box">
          <div className="dots">
            {moodDays(db, 30).map((o) => {
              const c = o.e.length ? moodColor(db, o.e[0].mood || '') : '';
              return (
                <i
                  key={o.date}
                  title={`${o.date}${o.e.length ? ' ' + o.e[0].text.slice(0, 10) : ''}`}
                  style={
                    o.e.length
                      ? { background: c, boxShadow: `0 0 9px ${c}`, borderColor: c }
                      : undefined
                  }
                />
              );
            })}
          </div>
          <div className="mini" style={{ marginTop: 10, textAlign: 'center' }}>
            {cats.map((m) => (
              <span key={m.k} style={{ marginRight: 6 }}>
                <span style={{ color: m.c }}>■</span>
                {m.k}
              </span>
            ))}
            <span>
              <span style={{ color: '#BFA3E8' }}>■</span>未分类
            </span>
          </div>
        </div>
      </div>

      {/* 心情年报 */}
      <div className="sec">
        <div className="sec-t">
          心情年报<span className="r">网易云/飞书风</span>
        </div>
        <div className="box">
          <div className="chips" style={{ marginBottom: 10 }}>
            {(
              [
                ['day', '今天'],
                ['week', '本周'],
                ['month', '本月'],
                ['quarter', '季度'],
                ['custom', '自选'],
              ] as [string, string][]
            ).map(([k, label]) => (
              <button
                key={k}
                className={`chip${R.kind === k ? ' on' : ''}`}
                onClick={() => setRangeKind(k)}
              >
                {label}
              </button>
            ))}
          </div>

          {R.kind === 'custom' && (
            <div className="row" style={{ gap: 8, marginBottom: 10 }}>
              <input
                className="inp"
                type="date"
                value={(db.moodRangeSel && db.moodRangeSel.from) || R.from}
                onChange={(e) => setRangeDate('from', e.target.value)}
                style={{ flex: 1 }}
              />
              <input
                className="inp"
                type="date"
                value={(db.moodRangeSel && db.moodRangeSel.to) || R.to}
                onChange={(e) => setRangeDate('to', e.target.value)}
                style={{ flex: 1 }}
              />
            </div>
          )}

          <div className="mini" style={{ marginBottom: 10, color: 'var(--dim2)' }}>
            当前范围：{R.label} · {R.list.length} 条心情
          </div>
          <button className="btn pri" style={{ width: '100%' }} onClick={onReport}>
            生成{R.label}心情报告
          </button>
        </div>
      </div>

      {/* 树洞回声 */}
      <div className="sec">
        <div className="sec-t">
          树洞回声<span className="r">共 {list.length} 条</span>
        </div>
        <DateFoldList
          items={list}
          getDate={(e) => e.date}
          unit="条"
          empty={
            <div className="box">
              <div className="empty">
                树洞空空
                <br />
                它不催你，只等你
              </div>
            </div>
          }
          renderItem={(e) => {
            const c = moodColor(db, e.mood || '');
            const echo = db.echo ? db.echo[e.id] : '';
            return (
              <div className="box" key={e.id} style={{ marginBottom: 11 }}>
                <div className="item">
                  <span className="dot" style={{ color: c, background: c }}></span>
                  <div className="c">
                    <div className="t">{e.text}</div>
                    <div className="m">
                      {cnDate(e.date)}
                      {e.mood ? ` · ${e.mood}` : ''}
                    </div>
                  </div>
                  <button
                    className="x"
                    onClick={() => {
                      deleteMood(e.id);
                      reload();
                    }}
                  >
                    ×
                  </button>
                </div>
                {e.photo && (
                  <div className="photos">
                    <img src={e.photo} alt="" />
                  </div>
                )}
                {echo ? (
                  <div className="quote" style={{ margin: '10px 0 0' }}>
                    树洞回声：{echo}
                  </div>
                ) : (
                  <button
                    className="btn sm"
                    style={{ marginTop: 10 }}
                    onClick={() => runEcho(e.id, e.text, e.mood || '', true)}
                  >
                    让 AI 回应一句
                  </button>
                )}
              </div>
            );
          }}
        />
      </div>

      <div className={`toastx${toastMsg ? ' on' : ''}`}>{toastMsg}</div>

      {echoModal && (
        <div className="modal center open">
          <div className="mask" onClick={() => setEchoModal(null)}></div>
          <div className="panel center">
            {echoModal.loading ? (
              <div className="loader">
                <div className="lp"></div>
                <div className="lt">树洞正在回应你…</div>
              </div>
            ) : (
              <>
                <button className="closex" onClick={() => setEchoModal(null)}>
                  ×
                </button>
                <div className="ph">树洞回声</div>
                <div className="quote" style={{ margin: '14px 0 18px' }}>
                  {echoModal.text}
                </div>
                <div className="mini" style={{ textAlign: 'center' }}>
                  {echoModal.mock ? '（模拟文案）' : '（DeepSeek 生成）'}
                </div>
                <button
                  className="btn pri"
                  style={{ width: '100%', marginTop: 16 }}
                  onClick={() => setEchoModal(null)}
                >
                  收下
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
