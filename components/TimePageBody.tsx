'use client';

import { useEffect, useRef, useState } from 'react';
import { STYLES, addDays, cnDate, todayISO } from '@/lib/moneyData';
import { readStory, writeStory } from '@/lib/storyStore';
import {
  dayCompare,
  hourBuckets,
  newTimeCat,
  timeCatList,
  timeCatOf,
  timeRange,
  timeStats,
  zoneBuckets,
  zoneName,
  type TimeEntry,
  type TimeItem,
} from '@/lib/timeData';
import { guessTimeCat } from '@/lib/timeTasks';
import QuickTimeModal, { type QuickTimePayload } from './QuickTimeModal';
import DateFoldList from './DateFoldList';

const QT_POEM: Record<'plan' | 'actual', [string, string]> = {
  plan: ['「凡事豫则立，不豫则废。」', '念头刚冒出来的时候最亮，<br>趁它还没凉，说给掌柜听。'],
  actual: ['「不积跬步，无以至千里。」', '今天真正走过的路，<br>一步也不必美化，如实入账就好。'],
};

const RANGES: [string, string][] = [
  ['day', '今天'],
  ['week', '本周'],
  ['month', '本月'],
  ['quarter', '季度'],
  ['custom', '自选'],
];

function Timeline({ entry, db }: { entry: TimeEntry; db: any }) {
  const P = hourBuckets(entry.plan || []);
  const A = hourBuckets(entry.actual || []);
  const pm: Record<number, (typeof P)[number]> = {};
  const am: Record<number, (typeof A)[number]> = {};
  const hs: Record<number, number> = {};
  P.forEach((o) => {
    pm[o.h] = o;
    hs[o.h] = 1;
  });
  A.forEach((o) => {
    am[o.h] = o;
    hs[o.h] = 1;
  });
  const hours = Object.keys(hs)
    .map(Number)
    .sort((a, b) => a - b);
  if (!hours.length) return null;

  const col = (b?: { items: { p: TimeItem; min: number }[] }) => {
    if (!b || !b.items.length) return <div className="vt-none">·</div>;
    return b.items.map((o, i) => {
      const c = timeCatOf(db, o.p.cat || guessTimeCat(o.p.t));
      return (
        <div className="vt-it" key={i}>
          <b>{o.p.t}</b>
          <span>
            <i style={{ background: c.c }}></i>
            {c.n} · {o.min}分
          </span>
        </div>
      );
    });
  };

  let lastZone = '';
  return (
    <>
      <div className="vtl-head">
        <span className="vlp">计划</span>
        <span className="lm">时刻</span>
        <span className="vla">实际</span>
      </div>
      {hours.map((h) => {
        const z = zoneName(h);
        const showZone = z !== lastZone;
        lastZone = z;
        return (
          <div key={h}>
            {showZone && (
              <div className="vt-zone">
                <i></i>
                <span>{z}</span>
                <i></i>
              </div>
            )}
            <div className="vt-row">
              <div className="vt-col plan">{col(pm[h])}</div>
              <div className="vt-axis">
                <span style={{ letterSpacing: 0 }}>
                  {('0' + Math.floor(h / 60)).slice(-2)}:00
                </span>
                <i></i>
              </div>
              <div className="vt-col act">{col(am[h])}</div>
            </div>
          </div>
        );
      })}
    </>
  );
}

function DaySummary({ entry }: { entry: TimeEntry }) {
  const P = zoneBuckets(entry.plan || []);
  const A = zoneBuckets(entry.actual || []);
  const pt = P.reduce((s, z) => s + z.min, 0);
  const at = A.reduce((s, z) => s + z.min, 0);
  if (!pt && !at) return null;

  const mx = Math.max(1, ...P.map((z, i) => Math.max(z.min, A[i].min)));
  const rate = pt ? Math.round((Math.min(at, pt * 2) / pt) * 100) : 100;
  const diff = at - pt;

  return (
    <div
      style={{
        marginTop: 14,
        paddingTop: 12,
        borderTop: '1px dashed var(--line2)',
      }}
    >
      <div className="mini" style={{ marginBottom: 2 }}>
        今日光阴小账 · 随记随更，不用点生成
      </div>
      <div className="mini" style={{ marginBottom: 6, color: 'var(--dim)' }}>
        计划 <b style={{ color: '#9BA8F0' }}>{pt}</b> 分 · 实际{' '}
        <b style={{ color: '#F0D394' }}>{at}</b> 分 · 兑付{' '}
        <b style={{ color: '#F0D394' }}>{pt ? `${rate}%` : '—'}</b>
        {at > pt
          ? ` · 比计划多花 ${diff} 分`
          : at < pt && at > 0
            ? ` · 还有 ${-diff} 分没兑现`
            : ''}
      </div>
      {P.map((z, i) => (
        <div className="bb-row" key={z.n}>
          <span className="bb-n">{z.n}</span>
          <div className="bb-bars">
            <div className="bb-bar">
              <i
                className="w"
                style={{ width: `${((z.min / mx) * 100).toFixed(1)}%` }}
              ></i>
              <u>{z.min ? `${z.min}分` : '—'}</u>
            </div>
            <div className="bb-bar">
              <i
                className="g"
                style={{ width: `${((A[i].min / mx) * 100).toFixed(1)}%` }}
              ></i>
              <u>{A[i].min ? `${A[i].min}分` : '—'}</u>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function TimePageBody({
  onStatement,
}: {
  onStatement: (style: string) => void;
}) {
  const [db, setDb] = useState<any>(null);
  const [viewDate, setViewDate] = useState(todayISO());
  const [axisOpen, setAxisOpen] = useState(false);
  const [style, setStyle] = useState('default');
  const [expandedCat, setExpandedCat] = useState(false);
  const [newCat, setNewCat] = useState('');
  const [detailOpen, setDetailOpen] = useState(false);
  const [quick, setQuick] = useState<QuickTimePayload | null>(null);
  const [toastMsg, setToastMsg] = useState('');
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

  const mutate = (fn: (d: any) => void) => {
    const d: any = readStory();
    if (!d) return;
    fn(d);
    writeStory(d);
    reload();
  };

  const chime = () => {
    const c = document.getElementById('chime');
    if (!c) return;
    c.classList.remove('on');
    void c.offsetWidth;
    c.classList.add('on');
    setTimeout(() => c.classList.remove('on'), 1500);
  };

  if (!db) return null;

  const today = todayISO();
  const selE: TimeEntry | undefined = (db.time || []).find(
    (e: TimeEntry) => e.date === viewDate
  );
  const st = timeStats(db, 'week');
  const TR = timeRange(db);
  const rangeKind = (db.timeRange && db.timeRange.kind) || 'week';
  const cats = timeCatList(db);
  const shownCats = cats.slice(0, expandedCat ? 1e9 : 3);

  const cmp = [0, 1, 2].map((off) => {
    const d = addDays(today, -off);
    const c = dayCompare(db, d);
    return {
      d,
      off,
      ...c,
    };
  });

  const openQuick = (kind: 'plan' | 'actual') => {
    setQuick({
      kind,
      isPlan: kind === 'plan',
      poem: QT_POEM[kind],
      date: viewDate,
      refresh: (dv, msg) => {
        setViewDate(dv);
        setDb(readStory());
        chime();
        toast(msg);
      },
    });
  };

  const setRange = (kind: string) => {
    mutate((d) => {
      d.timeRange = d.timeRange || { kind: 'week' };
      d.timeRange.kind = kind;
      if (kind === 'custom') {
        d.timeRange.from = d.timeRange.from || todayISO();
        d.timeRange.to = d.timeRange.to || todayISO();
      }
    });
  };

  const allSorted = ((db.time || []) as TimeEntry[])
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  return (
    <>
      {/* 光阴 · 一笔一记 */}
      <div className="sec">
        <div
          className="sec-t"
          style={{ cursor: 'pointer' }}
          onClick={() => setAxisOpen((v) => !v)}
        >
          光阴 · 一笔一记
          <span className="r" style={{ color: '#F4C2C2' }}>
            点击展开时间轴 <span>{axisOpen ? '▾' : '▸'}</span>
          </span>
        </div>
        <div className="row" style={{ marginBottom: 10 }}>
          <button className="btn pri" onClick={() => openQuick('plan')}>
            <svg viewBox="0 0 24 24">
              <path d="M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3z" />
              <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0" />
            </svg>
            记录计划
          </button>
          <button className="btn pri" onClick={() => openQuick('actual')}>
            <svg viewBox="0 0 24 24">
              <path d="M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3z" />
              <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0" />
            </svg>
            记录实际
          </button>
        </div>
        <div className="dt-nav">
          <button className="btn sm" onClick={() => setViewDate(addDays(viewDate, -1))}>
            ◀
          </button>
          <div
            className="dt-cur"
            onClick={() => {
              if (viewDate !== today) setViewDate(today);
            }}
          >
            {cnDate(viewDate)}
            {viewDate === today ? ' · 今天' : ' · 点我回今天'}
          </div>
          <button
            className="btn sm"
            onClick={() => {
              const nx = addDays(viewDate, 1);
              if (nx <= today) setViewDate(nx);
              else toast('还没到的日子，先好好过今天');
            }}
          >
            ▶
          </button>
        </div>

        {axisOpen &&
          (selE && (selE.plan || []).length + (selE.actual || []).length > 0 ? (
            <div className="box" style={{ marginTop: 12 }}>
              <div className="mini" style={{ marginBottom: 8 }}>
                {cnDate(viewDate)} 时间线 · 左计划 右实际
                <span className="r" style={{ float: 'right', color: 'var(--dim2)' }}>
                  时辰为刻度
                </span>
              </div>
              <Timeline entry={selE} db={db} />
              <DaySummary entry={selE} />
            </div>
          ) : (
            <div className="empty" style={{ marginTop: 12 }}>
              这一天还没有记录，点上面按钮记一笔
            </div>
          ))}
      </div>

      {/* 最近三天 */}
      <div className="sec">
        <div className="sec-t">
          最近三天 · 计划对实际<span className="r">点一天看时间轴</span>
        </div>
        <div className="tc3-row">
          {cmp.map((c) => (
            <div
              key={c.d}
              className={`tc3${c.d === viewDate ? ' on' : ''}`}
              onClick={() => setViewDate(c.d)}
            >
              <div className="tc3-d">
                {c.off === 0 ? '今天' : c.off === 1 ? '昨天' : '前天'}
              </div>
              <div className="tc3-date">{c.d.slice(5).replace('-', '/')}</div>
              {c.entry ? (
                <>
                  <div className="tc3-h">
                    计划 {(c.ph / 60).toFixed(1)}h
                    <br />
                    实际 {(c.ah / 60).toFixed(1)}h
                  </div>
                  <div className="tc3-bar">
                    <i style={{ width: `${Math.min(100, c.rate)}%` }}></i>
                  </div>
                  <div className="tc3-r">完成 {c.rate}%</div>
                </>
              ) : (
                <div className="tc3-h" style={{ color: 'var(--dim2)' }}>
                  这天还空着
                </div>
              )}
            </div>
          ))}
        </div>
        <button
          className="btn"
          style={{ width: '100%', marginTop: 10 }}
          onClick={() => setDetailOpen(true)}
        >
          更多日期 · 详情
        </button>
      </div>

      {/* 光阴对账单 */}
      <div className="sec">
        <div className="sec-t">
          光阴对账单<span className="r">时间的合理支出</span>
        </div>
        <div className="box">
          <div className="chips" style={{ marginBottom: 10 }}>
            {RANGES.map(([k, label]) => (
              <button
                key={k}
                className={`chip${rangeKind === k ? ' on' : ''}`}
                onClick={() => setRange(k)}
              >
                {label}
              </button>
            ))}
          </div>

          {rangeKind === 'custom' && (
            <div className="row" style={{ gap: 8, marginBottom: 10 }}>
              <input
                className="inp"
                type="date"
                value={(db.timeRange && db.timeRange.from) || todayISO()}
                onChange={(e) => {
                  const v = e.target.value || todayISO();
                  mutate((d) => {
                    d.timeRange = d.timeRange || { kind: 'custom' };
                    d.timeRange.from = v;
                  });
                }}
                style={{ flex: 1 }}
              />
              <input
                className="inp"
                type="date"
                value={(db.timeRange && db.timeRange.to) || todayISO()}
                onChange={(e) => {
                  const v = e.target.value || todayISO();
                  mutate((d) => {
                    d.timeRange = d.timeRange || { kind: 'custom' };
                    d.timeRange.to = v;
                  });
                }}
                style={{ flex: 1 }}
              />
            </div>
          )}

          <div className="mini" style={{ marginBottom: 8, color: 'var(--dim2)' }}>
            当前范围：{TR.label} · {TR.days} 天
          </div>

          <div className="mini" style={{ marginBottom: 6 }}>
            选文案风格
          </div>
          <div className="chips" style={{ marginBottom: 10 }}>
            {Object.keys(STYLES).map((k) => (
              <button
                key={k}
                className={`chip${style === k ? ' on' : ''}`}
                onClick={() => setStyle(k)}
              >
                {STYLES[k]}
              </button>
            ))}
          </div>

          <div className="mini" style={{ marginBottom: 10 }}>
            像对钱一样对时间：必要支出 · 投资自己 · 时间地漏，一笔一笔算清楚。
          </div>

          <button
            className="btn pri"
            style={{ width: '100%' }}
            onClick={() => onStatement(style)}
          >
            生成{TR.label}光阴对账单
          </button>
        </div>
      </div>

      {/* 本期光阴 · 落于何类 */}
      <div className="sec">
        <div className="sec-t">
          本期光阴 · 落于何类<span className="r">自识门类 · 可改</span>
        </div>
        <div className="box">
          {st.cats.length ? (
            st.cats.slice(0, 3).map((c) => (
              <div className="lg" key={c.k}>
                <i style={{ background: c.c }}></i>
                <span>{c.n}</span>
                <span>{c.h.toFixed(1)}h</span>
              </div>
            ))
          ) : (
            <div className="mini">本期还没有分类数据</div>
          )}
        </div>
      </div>

      {/* 光阴门类 */}
      <div className="sec">
        <div className="sec-t">
          光阴门类 · 可改名/新增<span className="r">可改名 · 可新增</span>
        </div>
        <div className="box">
          {shownCats.map((c) => (
            <div className="item" key={c.k}>
              <span className="dot" style={{ color: c.c, background: c.c }}></span>
              <div className="c">
                <input
                  className="inp"
                  key={c.k + '-' + c.n}
                  defaultValue={c.n}
                  style={{
                    padding: '6px 9px',
                    fontSize: 12,
                    background: 'transparent',
                    border: 'none',
                  }}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    mutate((d) => {
                      d.catTime = d.catTime || { names: {} };
                      d.catTime.names[c.k] = v || c.n;
                    });
                    toast('分类已改名');
                  }}
                />
              </div>
            </div>
          ))}
          {cats.length > 3 && (
            <button
              className="btn"
              style={{ width: '100%', marginTop: 10 }}
              onClick={() => setExpandedCat((v) => !v)}
            >
              {expandedCat ? '收起分类' : '展开更多分类'}
            </button>
          )}
          <div className="row" style={{ marginTop: 10 }}>
            <input
              className="inp"
              placeholder="新增一个时间分类，如：带娃"
              style={{ flex: 1 }}
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
            />
            <button
              className="btn sm"
              onClick={() => {
                const v = newCat.trim();
                if (!v) {
                  toast('写个名字');
                  return;
                }
                mutate((d) => {
                  d.catTimeExtra = d.catTimeExtra || [];
                  d.catTimeExtra.push(newTimeCat(v, d.catTimeExtra.length));
                });
                setNewCat('');
                toast('已新增时间分类');
              }}
            >
              加
            </button>
          </div>
        </div>
      </div>

      {/* 旧日卷宗 */}
      {detailOpen && (
        <div className="modal open">
          <div className="mask" onClick={() => setDetailOpen(false)}></div>
          <div className="panel">
            <button className="closex" onClick={() => setDetailOpen(false)}>
              ×
            </button>
            <div className="ph">旧日卷宗 · 全部日期</div>
            <div
              className="mini"
              style={{ marginBottom: 12, letterSpacing: 1 }}
            >
              共 {allSorted.length} 天 · 点「看这天」切到那日时间轴
            </div>
            <DateFoldList
              items={allSorted}
              getDate={(e) => e.date}
              unit="天"
              empty={<div className="empty">还没有记录</div>}
              renderItem={(e) => {
                const c = dayCompare(db, e.date);
                return (
                  <div className="item" key={e.id}>
                    <span
                      className="dot"
                      style={{ color: '#F0D394', background: '#F0D394' }}
                    ></span>
                    <div className="c">
                      <div className="t">
                        {cnDate(e.date)} <span className="tagx">完成 {c.rate}%</span>
                      </div>
                      <div className="m">
                        计划 {(e.plan || []).length} 件 · 实际 {(e.actual || []).length} 件
                      </div>
                    </div>
                    <button
                      className="btn sm"
                      onClick={() => {
                        setViewDate(e.date);
                        setDetailOpen(false);
                      }}
                    >
                      看这天
                    </button>
                    <button
                      className="x"
                      onClick={() => {
                        mutate((d) => {
                          d.time = (d.time || []).filter((x: TimeEntry) => x.id !== e.id);
                        });
                      }}
                    >
                      ×
                    </button>
                  </div>
                );
              }}
            />
          </div>
        </div>
      )}

      <div className={`toastx${toastMsg ? ' on' : ''}`}>{toastMsg}</div>

      {quick && <QuickTimeModal payload={quick} onClose={() => setQuick(null)} />}
    </>
  );
}
