'use client';

import { useEffect, useRef, useState } from 'react';
import { listen } from '@/lib/speech';
import { aiCall } from '@/lib/ai';
import { readStory } from '@/lib/storyStore';
import { addDays, cnDate, daysBetween, todayISO } from '@/lib/moneyData';
import {
  DREAM_TYPES,
  addFlag,
  addIdea,
  addLetter,
  delFlag,
  delIdea,
  delLetter,
  mockFlag,
  toggleFlag,
  type Flag,
  type Idea,
  type Letter,
} from '@/lib/dreamData';

const FLAG_SYS =
  '你是「光阴的故事」里的梦想守护者，会温柔而坚定地提醒用户曾经立下的 flag。';

type Tab = 'idea' | 'flag' | 'letter';
type Nudge = null | { loading: true } | { loading: false; text: string; mock: boolean };

export default function DreamPageBody() {
  const [db, setDb] = useState<any>(null);
  const [tab, setTab] = useState<Tab>('idea');
  const [dreamType, setDreamType] = useState(DREAM_TYPES[0]);
  const [ideaText, setIdeaText] = useState('');
  const [flagText, setFlagText] = useState('');
  const [flagDate, setFlagDate] = useState(addDays(todayISO(), 180));
  const [letterText, setLetterText] = useState('');
  const [letterDate, setLetterDate] = useState(addDays(todayISO(), 365));
  const [toastMsg, setToastMsg] = useState('');
  const [nudge, setNudge] = useState<Nudge>(null);
  const [listening, setListening] = useState(false);
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

  if (!db) return null;

  const dream = db.dream || { ideas: [], flags: [], letters: [] };
  const ideas: Idea[] = (dream.ideas || [])
    .slice()
    .sort((a: Idea, b: Idea) => (a.date < b.date ? 1 : -1));
  const flags: Flag[] = (dream.flags || [])
    .slice()
    .sort(
      (a: Flag, b: Flag) =>
        (a.done ? 1 : 0) - (b.done ? 1 : 0) || (a.target < b.target ? -1 : 1)
    );
  const letters: Letter[] = (dream.letters || [])
    .slice()
    .sort((a: Letter, b: Letter) => (a.openAt < b.openAt ? -1 : 1));

  const speak = async () => {
    setListening(true);
    try {
      const tx = await listen('dream');
      if (tx) setIdeaText(tx);
    } catch {
      /* 识别失败时不写入内容 */
    } finally {
      setListening(false);
    }
  };

  const nudgeFlag = async (f: Flag) => {
    setNudge({ loading: true });
    const left = daysBetween(todayISO(), f.target);
    const r = await aiCall(
      FLAG_SYS,
      'flag：' +
        f.text +
        '，立下于 ' +
        f.created +
        '，目标日 ' +
        f.target +
        '，还剩 ' +
        left +
        ' 天。请写一段 80 字以内的提醒。',
      () => mockFlag({ text: f.text, created: f.created, left })
    );
    setNudge({ loading: false, text: r.text, mock: r.mock });
  };

  return (
    <>
      <div className="tabs">
        {(
          [
            ['idea', '奇思妙想'],
            ['flag', '立 flag'],
            ['letter', '给未来的信'],
          ] as [Tab, string][]
        ).map(([k, label]) => (
          <button
            key={k}
            className={`chip${tab === k ? ' on' : ''}`}
            onClick={() => setTab(k)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'idea' && (
        <>
          <div className="sec">
            <div className="sec-t">
              此刻一念<span className="r">念起便写</span>
            </div>
            <div className="box">
              <div className="chips" style={{ marginBottom: 10 }}>
                {DREAM_TYPES.map((t) => (
                  <button
                    key={t}
                    className={`chip${dreamType === t ? ' on' : ''}`}
                    onClick={() => setDreamType(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <textarea
                className="inp"
                rows={3}
                placeholder={
                  dreamType === '做过的梦' ? '昨夜，我梦见…' : '落笔，便成真'
                }
                value={ideaText}
                onChange={(e) => setIdeaText(e.target.value)}
              />
              <div className="row" style={{ marginTop: 10 }}>
                <button className="btn" onClick={speak}>
                  <svg viewBox="0 0 24 24">
                    <path d="M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3z" />
                    <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0" />
                  </svg>
                  {listening ? '聆听中…' : '说出来'}
                </button>
                <button
                  className="btn pri"
                  onClick={() => {
                    const v = ideaText.trim();
                    if (!v) {
                      toast('还什么都没写');
                      return;
                    }
                    addIdea(dreamType, v);
                    setIdeaText('');
                    reload();
                    toast('收进梦里了');
                  }}
                >
                  收进梦里
                </button>
              </div>
            </div>
          </div>

          <div className="sec">
            <div className="sec-t">
              梦境储藏<span className="r">{ideas.length} 条</span>
            </div>
            <div className="box">
              {ideas.length ? (
                ideas.map((e) => (
                  <div className="item" key={e.id}>
                    <span
                      className="dot"
                      style={{ color: '#BFA3E8', background: '#BFA3E8' }}
                    ></span>
                    <div className="c">
                      <div className="t">{e.text}</div>
                      <div className="m">
                        <span className="tagx">{e.type}</span>
                        {cnDate(e.date)}
                      </div>
                    </div>
                    <button
                      className="x"
                      onClick={() => {
                        delIdea(e.id);
                        reload();
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))
              ) : (
                <div className="empty">储藏室还空着</div>
              )}
            </div>
          </div>
        </>
      )}

      {tab === 'flag' && (
        <>
          <div className="sec">
            <div className="sec-t">
              立一面旗<span className="r">日子自择</span>
            </div>
            <div className="box">
              <div className="row" style={{ marginBottom: 10 }}>
                <input
                  className="inp"
                  placeholder="譬如：一年后，考过 PMP"
                  value={flagText}
                  onChange={(e) => setFlagText(e.target.value)}
                  style={{ flex: 1 }}
                />
              </div>
              <div className="row">
                <input
                  className="inp"
                  type="date"
                  value={flagDate}
                  onChange={(e) => setFlagDate(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button
                  className="btn sm pri"
                  onClick={() => {
                    const v = flagText.trim();
                    if (!v) {
                      toast('写下你的 flag');
                      return;
                    }
                    addFlag(v, flagDate || addDays(todayISO(), 180));
                    setFlagText('');
                    reload();
                    toast('flag 已立，AI 会记得提醒你');
                  }}
                >
                  立
                </button>
              </div>
              <div className="mini" style={{ marginTop: 8 }}>
                日子由你定——一月、一年、十载皆可。掌柜自会提醒。
              </div>
            </div>
          </div>

          <div className="sec">
            <div className="sec-t">
              我曾立的旗
              <span className="r">
                {flags.filter((f) => !f.done).length} 个在路上
              </span>
            </div>
            <div className="box">
              {flags.length ? (
                flags.map((f) => {
                  const left = daysBetween(todayISO(), f.target);
                  const color = f.done ? '#8FD8C4' : '#F2A9BC';
                  return (
                    <div
                      key={f.id}
                      style={{
                        padding: '11px 0',
                        borderBottom: '1px dashed var(--line2)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                        <span
                          className="dot"
                          style={{ color, background: color, marginTop: 6 }}
                        ></span>
                        <div style={{ flex: 1 }}>
                          <div
                            className="t"
                            style={{
                              fontSize: 13,
                              ...(f.done
                                ? { opacity: 0.5, textDecoration: 'line-through' }
                                : {}),
                            }}
                          >
                            {f.text}
                          </div>
                          <div className="m">
                            {f.done
                              ? '已完成'
                              : `目标 ${cnDate(f.target)} · ${
                                  left >= 0 ? `还有 ${left} 天` : `已过去 ${-left} 天`
                                }`}
                          </div>
                        </div>
                        <button
                          className="x"
                          onClick={() => {
                            delFlag(f.id);
                            reload();
                          }}
                        >
                          ×
                        </button>
                      </div>
                      <div className="row" style={{ marginTop: 8 }}>
                        <button className="btn sm" onClick={() => nudgeFlag(f)}>
                          AI 提醒我
                        </button>
                        <button
                          className="btn sm"
                          onClick={() => {
                            toggleFlag(f.id);
                            reload();
                          }}
                        >
                          {f.done ? '重新出发' : '做到了'}
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="empty">
                  尚未立旗
                  <br />
                  人总得给自己留个念想
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {tab === 'letter' && (
        <>
          <div className="sec">
            <div className="sec-t">
              寄给未来的信<span className="r">开启之日自择</span>
            </div>
            <div className="box">
              <textarea
                className="inp"
                rows={4}
                placeholder="寄给未来的自己…"
                value={letterText}
                onChange={(e) => setLetterText(e.target.value)}
              />
              <div className="row" style={{ marginTop: 10 }}>
                <input
                  className="inp"
                  type="date"
                  value={letterDate}
                  onChange={(e) => setLetterDate(e.target.value)}
                  style={{ flex: 1 }}
                />
                <button
                  className="btn sm pri"
                  onClick={() => {
                    const v = letterText.trim();
                    if (!v) {
                      toast('还没写信');
                      return;
                    }
                    const d = letterDate || addDays(todayISO(), 365);
                    addLetter(v, d);
                    setLetterText('');
                    reload();
                    toast('已封存 · 火漆盖印 · ' + cnDate(d) + '开启');
                  }}
                >
                  封存
                </button>
              </div>
              <div className="row" style={{ marginTop: 8 }}>
                {(
                  [
                    ['30', '一个月后'],
                    ['365', '一年后'],
                    ['730', '两年后'],
                  ] as [string, string][]
                ).map(([days, label]) => (
                  <button
                    key={days}
                    className="chip"
                    onClick={() => setLetterDate(addDays(todayISO(), parseInt(days, 10)))}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="sec">
            <div className="sec-t">
              信箱<span className="r">{letters.length} 封</span>
            </div>
            {letters.length ? (
              letters.map((l) => {
                const left = daysBetween(todayISO(), l.openAt);
                const open = left <= 0;
                return (
                  <div
                    className={open ? 'letter' : 'letter sealed'}
                    key={l.id}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        marginBottom: 8,
                      }}
                    >
                      <div className="wax">印</div>
                      <div>
                        <div
                          style={{
                            fontFamily: 'var(--serif)',
                            fontSize: 13,
                            letterSpacing: '1px',
                            color: 'var(--gold)',
                          }}
                        >
                          {open
                            ? '已开启 · 来自 ' + cnDate(l.created)
                            : '封存中 · ' + cnDate(l.created) + ' 寄出'}
                        </div>
                        <div className="mini">
                          {open ? '' : `距离开启还有 ${left} 天 · ${l.openAt}`}
                        </div>
                      </div>
                      <button
                        className="x"
                        style={{ marginLeft: 'auto' }}
                        onClick={() => {
                          delLetter(l.id);
                          reload();
                        }}
                      >
                        ×
                      </button>
                    </div>
                    <div
                      className="bd"
                      style={{
                        fontSize: 12.5,
                        lineHeight: 1.95,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {l.text}
                    </div>
                    {!open && (
                      <div
                        className="mini"
                        style={{
                          textAlign: 'center',
                          marginTop: 10,
                          letterSpacing: '1.4px',
                        }}
                      >
                        火漆未启
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="box">
                <div className="empty">尚无寄出之信</div>
              </div>
            )}
          </div>
        </>
      )}

      <div className={`toastx${toastMsg ? ' on' : ''}`}>{toastMsg}</div>

      {nudge && (
        <div className="modal center open">
          <div className="mask" onClick={() => setNudge(null)}></div>
          <div className="panel center">
            {nudge.loading ? (
              <div className="loader">
                <div className="lp"></div>
                <div className="lt">AI 正在回想你说过的话…</div>
              </div>
            ) : (
              <>
                <button className="closex" onClick={() => setNudge(null)}>
                  ×
                </button>
                <div className="ph">还记得吗</div>
                <div
                  className="quote"
                  style={{ margin: '14px 0 8px', whiteSpace: 'pre-wrap' }}
                >
                  {nudge.text}
                </div>
                <div className="mini" style={{ textAlign: 'center' }}>
                  {nudge.mock ? '（模拟文案）' : '（DeepSeek 生成）'}
                </div>
                <button
                  className="btn pri"
                  style={{ width: '100%', marginTop: 16 }}
                  onClick={() => setNudge(null)}
                >
                  我记得
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
