'use client';

import { useState } from 'react';
import { catList, catOf, cnDate, num, todayISO, type MoneyEntry } from '@/lib/moneyData';
import DateFoldList from './DateFoldList';

type Props = {
  entries: MoneyEntry[];
  db: any;
  onClose: () => void;
  onDelete: (id: string) => void;
  onUpdate: (id: string, patch: { amt: number; cat: string }) => void;
};

export default function MoneyDetailModal({
  entries,
  db,
  onClose,
  onDelete,
  onUpdate,
}: Props) {
  const [todayOpen, setTodayOpen] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmt, setEditAmt] = useState('');
  const [editCat, setEditCat] = useState('');
  const [editErr, setEditErr] = useState('');

  const today = todayISO();
  const cats = catList(db);
  const todayEntries = entries
    .map((e, i) => ({ e, i }))
    .filter((x) => x.e.date === today)
    .sort((a, b) => b.i - a.i)
    .map((x) => x.e);
  const todayTotal = todayEntries.reduce((s, e) => s + e.amt, 0);

  const beginEdit = (e: MoneyEntry) => {
    setEditingId(e.id);
    setEditAmt(String(e.amt));
    setEditCat(e.cat);
    setEditErr('');
  };

  const commit = (e: MoneyEntry) => {
    const v = parseFloat(editAmt);
    if (!Number.isFinite(v) || v <= 0) {
      setEditErr('金额需大于 0');
      return;
    }
    onUpdate(e.id, { amt: Math.round(v * 100) / 100, cat: editCat });
    setEditingId(null);
  };

  const renderRow = (e: MoneyEntry) => {
    const c = catOf(db, e.cat);
    const editing = editingId === e.id;
    return (
      <div className={`money-row${editing ? ' editing' : ''}`} key={e.id}>
        <div
          className="item"
          onClick={() => {
            if (editing) setEditingId(null);
            else beginEdit(e);
          }}
        >
          <span className="dot" style={{ color: c.c, background: c.c }}></span>
          <div className="c">
            <div className="t">{e.note}</div>
            <div className="m">
              <span className="tagx">{c.n}</span>
              {cnDate(e.date)}
            </div>
          </div>
          <div
            style={{
              fontFamily: 'var(--serif)',
              fontSize: 14,
              color: 'var(--gold)',
              flex: 'none',
            }}
          >
            ¥{num(e.amt)}
          </div>
          <button
            className="x"
            onClick={(ev) => {
              ev.stopPropagation();
              onDelete(e.id);
            }}
          >
            ×
          </button>
        </div>
        {editing && (
          <div className="edit-panel" onClick={(ev) => ev.stopPropagation()}>
            <div className="row" style={{ gap: 8, marginBottom: 8 }}>
              <select
                className="inp"
                value={editCat}
                onChange={(ev) => setEditCat(ev.target.value)}
                style={{ flex: 1, padding: '8px 10px', fontSize: 12 }}
              >
                {cats.map((c2) => (
                  <option key={c2.k} value={c2.k}>
                    {c2.n}
                  </option>
                ))}
              </select>
              <input
                className="inp"
                type="number"
                min="0.01"
                step="0.01"
                value={editAmt}
                onChange={(ev) => {
                  setEditAmt(ev.target.value);
                  setEditErr('');
                }}
                placeholder="金额"
                style={{ flex: 1, padding: '8px 10px', fontSize: 12 }}
              />
            </div>
            {editErr && (
              <div className="mini" style={{ color: '#F0997B', marginBottom: 6 }}>
                {editErr}
              </div>
            )}
            <div className="row">
              <button
                className="btn sm"
                style={{ flex: 1 }}
                onClick={() => setEditingId(null)}
              >
                取消
              </button>
              <button
                className="btn sm pri"
                style={{ flex: 1 }}
                onClick={() => commit(e)}
              >
                保存
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="modal center open">
      <div className="mask" onClick={onClose}></div>
      <div className="panel center">
        <button className="closex" onClick={onClose}>
          ×
        </button>
        <div className="ph">账目明细</div>
        <div className="mini" style={{ marginBottom: 12, letterSpacing: '1px' }}>
          共 {entries.length} 笔 · 点记录可改分类与金额 · 点 × 删去
        </div>

        <div className="today-panel">
          <button
            type="button"
            className="today-h"
            onClick={() => setTodayOpen((v) => !v)}
          >
            <span className="today-t">今日开销</span>
            <span className="today-sum">
              {todayEntries.length} 笔 · 合计 ¥{num(todayTotal)}
            </span>
            <span className="today-a">{todayOpen ? '▾' : '▸'}</span>
          </button>
          {todayOpen &&
            (todayEntries.length ? (
              <div className="today-list">{todayEntries.map(renderRow)}</div>
            ) : (
              <div className="mini" style={{ padding: '0 0 10px' }}>
                今天还没有开销
              </div>
            ))}
        </div>

        <DateFoldList
          items={entries}
          getDate={(e) => e.date}
          unit="笔"
          empty={<div className="empty">还没有账目</div>}
          renderItem={renderRow}
        />
      </div>
    </div>
  );
}
