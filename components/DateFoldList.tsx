'use client';

import { Fragment, useEffect, useMemo, useState, type ReactNode } from 'react';
import { addDays, cnDate, todayISO, weekStart } from '@/lib/moneyData';

type WeekGroup<T> = { key: string; label: string; count: number; items: T[] };
type MonthGroup<T> = {
  key: string;
  label: string;
  count: number;
  weeks: WeekGroup<T>[];
};

type Props<T> = {
  items: T[];
  getDate: (item: T) => string;
  renderItem: (item: T, index: number) => ReactNode;
  empty?: ReactNode;
  unit?: string;
};

function monthLabelOf(key: string): string {
  const [y, m] = key.split('-');
  const nowY = todayISO().slice(0, 4);
  return y === nowY ? `${Number(m)}月` : `${y}年${Number(m)}月`;
}

function weekLabelOf(start: string): string {
  return `${cnDate(start)} - ${cnDate(addDays(start, 6))}`;
}

function groupByMonthWeek<T>(items: T[], getDate: (item: T) => string): MonthGroup<T>[] {
  const sorted = items
    .map((item, i) => ({ item, i }))
    .sort((a, b) => {
      const da = getDate(a.item);
      const db = getDate(b.item);
      if (da !== db) return da < db ? 1 : -1;
      return b.i - a.i;
    })
    .map((x) => x.item);

  const months: MonthGroup<T>[] = [];
  let month: MonthGroup<T> | null = null;
  let week: WeekGroup<T> | null = null;
  let lastMonth = '';
  let lastWeek = '';

  sorted.forEach((item) => {
    const date = getDate(item);
    const mk = date.slice(0, 7);
    const wk = weekStart(date);
    if (mk !== lastMonth) {
      month = { key: mk, label: monthLabelOf(mk), count: 0, weeks: [] };
      months.push(month);
      lastMonth = mk;
      lastWeek = '';
    }
    if (wk !== lastWeek) {
      week = { key: wk, label: weekLabelOf(wk), count: 0, items: [] };
      month!.weeks.push(week);
      lastWeek = wk;
    }
    week!.items.push(item);
    week!.count += 1;
    month!.count += 1;
  });

  return months;
}

export default function DateFoldList<T>({
  items,
  getDate,
  renderItem,
  empty,
  unit = '条',
}: Props<T>) {
  const groups = useMemo(() => groupByMonthWeek(items, getDate), [items, getDate]);
  const [openMonths, setOpenMonths] = useState<Set<string>>(() =>
    groups[0] ? new Set([groups[0].key]) : new Set<string>()
  );
  const [openWeeks, setOpenWeeks] = useState<Set<string>>(() =>
    groups[0]?.weeks[0] ? new Set([groups[0].weeks[0].key]) : new Set<string>()
  );
  const latest = groups[0]
    ? `${groups[0].key}|${groups[0].weeks[0]?.key || ''}`
    : '';

  useEffect(() => {
    if (!latest) return;
    const [mk, wk] = latest.split('|');
    setOpenMonths((prev) => (prev.has(mk) ? prev : new Set(prev).add(mk)));
    if (wk) setOpenWeeks((prev) => (prev.has(wk) ? prev : new Set(prev).add(wk)));
  }, [latest]);

  const toggleMonth = (key: string) => {
    setOpenMonths((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const toggleWeek = (key: string) => {
    setOpenWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  if (!groups.length) return <>{empty}</>;

  return (
    <div className="foldlist">
      {groups.map((g) => {
        const monthOpen = openMonths.has(g.key);
        return (
          <div className="foldmonth" key={g.key}>
            <button
              type="button"
              className={`foldh month${monthOpen ? ' on' : ''}`}
              onClick={() => toggleMonth(g.key)}
            >
              <span className="foldh-t">{g.label}</span>
              <span className="foldh-n">
                {g.count} {unit}
              </span>
              <span className="foldh-a">{monthOpen ? '▾' : '▸'}</span>
            </button>
            {monthOpen && (
              <div className="foldbody">
                {g.weeks.map((w) => {
                  const weekOpen = openWeeks.has(w.key);
                  return (
                    <div className="foldweek" key={w.key}>
                      <button
                        type="button"
                        className={`foldh week${weekOpen ? ' on' : ''}`}
                        onClick={() => toggleWeek(w.key)}
                      >
                        <span className="foldh-t">{w.label}</span>
                        <span className="foldh-n">
                          {w.count} {unit}
                        </span>
                        <span className="foldh-a">{weekOpen ? '▾' : '▸'}</span>
                      </button>
                      {weekOpen && (
                        <div className="folditems">
                          {w.items.map((item, idx) => (
                            <Fragment key={`${w.key}-${idx}`}>
                              {renderItem(item, idx)}
                            </Fragment>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
