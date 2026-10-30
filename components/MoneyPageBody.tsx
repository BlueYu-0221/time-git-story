'use client';

import { useEffect, useRef, useState } from 'react';
import {
  STYLES,
  EXTRA_COLORS,
  catList,
  cnDate,
  moneyMonthStats,
  moneyRange,
  moneyStats,
  moneyTraj,
  num,
  rangeSum,
  todayISO,
  type MoneyEntry,
} from '@/lib/moneyData';
import { readStory, writeStory } from '@/lib/storyStore';
import TrajChart from './TrajChart';
import MoneyQuickModal from './MoneyQuickModal';
import MoneyDetailModal from './MoneyDetailModal';

const C = 2 * Math.PI * 44;
const RANGES: [string, string][] = [
  ['day', '今天'],
  ['week', '本周'],
  ['month', '本月'],
  ['quarter', '季度'],
  ['custom', '自选'],
];

export default function MoneyPageBody({
  onStatement,
}: {
  onStatement: (style: string) => void;
}) {
  const [db, setDb] = useState<any>(null);
  const [style, setStyle] = useState('default');
  const [expandedCat, setExpandedCat] = useState(false);
  const [quickOpen, setQuickOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [newCat, setNewCat] = useState('');
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

  if (!db) return null;

  const m = moneyStats(db);
  const mm = moneyMonthStats(db);
  const R0 = moneyRange(db);
  const budget = (db.budget && db.budget.week) || 800;
  const used = Math.min(1, m.cur / budget);
  const over = m.cur > budget;
  const marks = Math.max(0, Math.min(10, Math.round((m.cur / Math.max(1, budget)) * 10)));
  const cats = catList(db);
  const moneyList: MoneyEntry[] = db.money || [];
  const allSorted = moneyList.slice().sort((a, b) => (a.date < b.date ? 1 : -1));
  const tj = moneyTraj(db, 14);

  const donut = m.arr.length
    ? m.arr.map((a, i) => {
        const len = (a.v / m.total) * C;
        const off = m.arr
          .slice(0, i)
          .reduce((s, x) => s + (x.v / m.total) * C, 0);
        return (
          <circle
            key={a.k}
            cx="50"
            cy="50"
            r="44"
            fill="none"
            stroke={a.c}
            strokeWidth="13"
            strokeDasharray={`${len} ${C - len}`}
            strokeDashoffset={-off}
            strokeLinecap="butt"
          />
        );
      })
    : [
        <circle
          key="empty"
          cx="50"
          cy="50"
          r="44"
          fill="none"
          stroke="rgba(247,241,225,.1)"
          strokeWidth="13"
        />,
      ];

  const catSorted = cats
    .slice()
    .sort((a, b) => {
      const P = ['love', 'junk', 'peo', 'social', 'fun', 'heal', 'learn'];
      return (P.indexOf(a.k) >= 0 ? 0 : 1) - (P.indexOf(b.k) >= 0 ? 0 : 1);
    })
    .slice(0, expandedCat ? 1e9 : 3);

  const rangeKind = (db.moneyRange && db.moneyRange.kind) || 'month';

  const setRange = (kind: string) => {
    mutate((d) => {
      d.moneyRange = d.moneyRange || { kind: 'month' };
      d.moneyRange.kind = kind;
      if (kind === 'custom') {
        d.moneyRange.from = d.moneyRange.from || todayISO();
        d.moneyRange.to = d.moneyRange.to || todayISO();
      }
    });
  };

  return (
    <>
      {/* 本周花用 */}
      <div className="sec">
        <div className="sec-t">
          本周花用<span className="r">{cnDate(m.ws)} 起</span>
        </div>
        <div className="box" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div className="ring">
            <svg width="104" height="104" viewBox="0 0 104 104">
              <circle cx="52" cy="52" r="44" fill="none" stroke="rgba(247,241,225,.1)" strokeWidth="9" />
              <circle
                cx="52"
                cy="52"
                r="44"
                fill="none"
                stroke={over ? '#F0997B' : '#F0D394'}
                strokeWidth="9"
                strokeLinecap="round"
                strokeDasharray={`${used * C} ${C}`}
              />
            </svg>
            <div className="cv">
              <b>¥{num(m.cur)}</b>
              <u>预算 {budget}</u>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
              }}
            >
              <span className="mini">算盘 · 预算盈亏</span>
              {Array.from({ length: 10 }).map((_, i) => (
                <i key={i} className={i < marks ? (over ? 'hot' : 'on') : ''} />
              ))}
            </div>
            <div className="kv">
              <span>上周</span>
              <b>¥{num(m.prev)}</b>
            </div>
            <div className="kv">
              <span>变化</span>
              <b style={{ color: m.diff >= 0 ? '#F0997B' : '#8FD8C4' }}>
                {m.diff >= 0 ? '+' : '-'}¥{num(Math.abs(m.diff))}
              </b>
            </div>
            <div className="kv">
              <span>日均</span>
              <b>¥{num(m.cur / 7)}</b>
            </div>
            <div className="mini" style={{ marginTop: 8, color: over ? '#F0997B' : '#8FD8C4' }}>
              {over
                ? `已超出本周预算 ¥${num(m.cur - budget)} · 掌柜皱起了眉`
                : `本周预算还剩 ¥${num(budget - m.cur)} · 花得很稳`}
            </div>
          </div>
        </div>
      </div>

      {/* 本月对账 */}
      <div className="sec">
        <div className="sec-t">
          本月对账<span className="r">较上月</span>
        </div>
        <div className="box">
          <div className="big3">
            <div>
              <b>¥{num(mm.cur)}</b>
              <u>本月</u>
            </div>
            <div>
              <b>¥{num(mm.prev)}</b>
              <u>上月</u>
            </div>
            <div>
              <b style={{ color: mm.diff >= 0 ? '#F0997B' : '#8FD8C4' }}>
                {mm.diff >= 0 ? '+' : '-'}¥{num(Math.abs(mm.diff))}
              </b>
              <u>变化</u>
            </div>
          </div>
          {mm.hasPrev ? (
            <div
              className="mini"
              style={{ marginTop: 10, textAlign: 'center', color: 'var(--dim2)' }}
            >
              {mm.arr
                .slice(0, 3)
                .map((a) => {
                  const d = a.v - a.pv;
                  return `${a.n} 本月 ¥${num(a.v)}${d > 0 ? ' 多 ' : ' 少 '}¥${num(Math.abs(d))}`;
                })
                .join(' · ')}
            </div>
          ) : (
            <div
              className="mini"
              style={{ marginTop: 10, textAlign: 'center', color: 'var(--dim2)' }}
            >
              上月还没有记录
            </div>
          )}
        </div>
      </div>

      {/* 铜钱对账 */}
      <div className="sec">
        <div className="sec-t">
          铜钱对账<span className="r">体检 + 隐形浪费 · 一次看清</span>
        </div>
        <div className="box">
          <div className="mini" style={{ marginBottom: 6 }}>
            选时间范围
          </div>
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
                value={(db.moneyRange && db.moneyRange.from) || todayISO()}
                onChange={(e) => {
                  const v = e.target.value || todayISO();
                  mutate((d) => {
                    d.moneyRange = d.moneyRange || { kind: 'custom' };
                    d.moneyRange.from = v;
                  });
                }}
                style={{ flex: 1 }}
              />
              <input
                className="inp"
                type="date"
                value={(db.moneyRange && db.moneyRange.to) || todayISO()}
                onChange={(e) => {
                  const v = e.target.value || todayISO();
                  mutate((d) => {
                    d.moneyRange = d.moneyRange || { kind: 'custom' };
                    d.moneyRange.to = v;
                  });
                }}
                style={{ flex: 1 }}
              />
            </div>
          )}

          <div className="mini" style={{ marginBottom: 6, color: 'var(--dim2)' }}>
            当前范围：{R0.label} · {R0.list.length} 笔 · 共 ¥{num(rangeSum(R0.list))}
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

          <div className="mini" style={{ marginBottom: 12 }}>
            包含：个人消费体检（必要 / 可优化 / 非必要支出）+ 找出隐形浪费 + 对比上一期哪个分类花超 +
            下期能省多少钱
          </div>

          <button
            className="btn pri"
            style={{ width: '100%' }}
            onClick={() => onStatement(style)}
          >
            生成铜钱对账
          </button>
        </div>
      </div>

      {/* 近十四日花销轨迹 */}
      <div className="sec">
        <div className="sec-t">近十四日 · 花销轨迹</div>
        <div className="box">
          <TrajChart days={tj.days} max={tj.mx} color="#8FD8C4" gid="mt" />
          <div className="tlegend">
            <span>
              <i style={{ background: '#8FD8C4' }}></i>当日支出（元）
            </span>
          </div>
        </div>
      </div>

      {/* 记一笔账 */}
      <div className="sec">
        <div className="sec-t">
          记一笔账<span className="r">说一句便好</span>
        </div>
        <div className="box" style={{ textAlign: 'center' }}>
          <button
            className="btn pri big"
            style={{ width: '100%' }}
            onClick={() => setQuickOpen(true)}
          >
            说一句，记一笔
          </button>
          <div className="mini" style={{ marginTop: 10 }}>
            比如「今天吃饭花了 30 块」
            <br />
            掌柜会自动提取金额和分类
          </div>
        </div>
      </div>

      {/* 本周去处 */}
      <div className="sec">
        <div className="sec-t">
          本周去处<span className="r">较上周</span>
        </div>
        <div className="box">
          <div className="donut">
            <svg viewBox="0 0 100 100">{donut}</svg>
            <div className="legend">
              {m.arr.length ? (
                m.arr.slice(0, 6).map((a) => {
                  const d = a.v - a.pv;
                  return (
                    <div className="lg" key={a.k}>
                      <i style={{ background: a.c }}></i>
                      <span>
                        {a.n}
                        {m.hasPrev ? (
                          <u
                            style={{
                              color: d >= 0 ? '#F0997B' : '#8FD8C4',
                              textDecoration: 'none',
                            }}
                          >
                            {' '}
                            {d >= 0 ? '+' : ''}
                            {num(d)}
                          </u>
                        ) : null}
                      </span>
                      <span>¥{num(a.v)}</span>
                    </div>
                  );
                })
              ) : (
                <div className="mini">本周还没有记录</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 我的门类 */}
      <div className="sec">
        <div className="sec-t">
          我的门类 · 可改名/新增<span className="r">可改名 · 可新增</span>
        </div>
        <div className="box">
          {catSorted.map((c) => (
            <div className="item" key={c.k}>
              <span className="dot" style={{ color: c.c, background: c.c }}></span>
              <div className="c">
                <input
                  className="inp"
                  defaultValue={c.n}
                  style={{
                    padding: '6px 9px',
                    fontSize: 12,
                    background: 'transparent',
                    border: 'none',
                  }}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (!v || v === c.n) return;
                    mutate((d) => {
                      d.catName = d.catName || {};
                      d.catName[c.k] = v;
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
              placeholder="新增一个分类名"
              value={newCat}
              onChange={(e) => setNewCat(e.target.value)}
              style={{ flex: 1 }}
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
                  d.catExtra = d.catExtra || [];
                  d.catExtra.push({
                    k: 'x' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
                    n: v,
                    c: EXTRA_COLORS[d.catExtra.length % EXTRA_COLORS.length],
                  });
                });
                setNewCat('');
                toast('已新增分类');
              }}
            >
              加
            </button>
          </div>
        </div>
      </div>

      {/* 账目明细 */}
      <div className="sec">
        <div className="sec-t">
          账目明细<span className="r">共 {moneyList.length} 笔</span>
        </div>
        <div className="box" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div className="t" style={{ fontSize: 13 }}>
              账册已存 <b style={{ color: 'var(--gold)' }}>{moneyList.length}</b> 笔
            </div>
            <div className="mini" style={{ marginTop: 4 }}>
              点开看全部流水，可逐笔改分类、金额或删去
            </div>
          </div>
          <button className="btn" style={{ flex: 'none' }} onClick={() => setDetailOpen(true)}>
            详情
          </button>
        </div>
      </div>

      <div className={`toastx${toastMsg ? ' on' : ''}`}>{toastMsg}</div>

      {quickOpen && (
        <MoneyQuickModal
          db={db}
          onClose={() => setQuickOpen(false)}
          onSaved={(count, total) => {
            reload();
            toast(`记下了 ${count} 笔 · 共 ¥${num(total)}`);
          }}
        />
      )}

      {detailOpen && (
        <MoneyDetailModal
          entries={allSorted}
          db={db}
          onClose={() => setDetailOpen(false)}
          onDelete={(id) => {
            mutate((d) => {
              d.money = (d.money || []).filter((e: MoneyEntry) => e.id !== id);
            });
          }}
          onUpdate={(id, patch) => {
            mutate((d) => {
              const it = (d.money || []).find((e: MoneyEntry) => e.id === id);
              if (it) {
                it.amt = patch.amt;
                it.cat = patch.cat;
              }
            });
          }}
        />
      )}
    </>
  );
}
