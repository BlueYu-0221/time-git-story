'use client';

import { useEffect, useRef, useState } from 'react';
import {
  addMoney,
  catList,
  num,
  parseExpenseSentence,
  type Cat,
  type ParsedExpense,
} from '@/lib/moneyData';
import { listen } from '@/lib/speech';
import { saveRecord } from '@/lib/records';

type Props = {
  db: any;
  onClose: () => void;
  onSaved: (count: number, total: number) => void;
};

export default function MoneyQuickModal({ db, onClose, onSaved }: Props) {
  const cats: Cat[] = catList(db);
  const [text, setText] = useState('');
  const [items, setItems] = useState<ParsedExpense[]>([]);
  const [listening, setListening] = useState(false);
  const [hint, setHint] = useState('');
  const boxRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const t = setTimeout(() => boxRef.current?.focus(), 180);
    return () => clearTimeout(t);
  }, []);

  const parse = (value: string) => {
    const next = parseExpenseSentence(value);
    setItems(next);
    return next;
  };

  const onChange = (value: string) => {
    setText(value);
    setHint('');
    parse(value);
  };

  const speak = async () => {
    setListening(true);
    setHint('');
    try {
      const tx = await listen('money');
      if (tx) {
        setText(tx);
        parse(tx);
        boxRef.current?.focus();
      } else {
        setHint('没听清，再说一次；也可以直接打字');
      }
    } catch (e) {
      setHint(e instanceof Error ? e.message : '语音识别失败，请再说一次');
    } finally {
      setListening(false);
    }
  };

  const save = () => {
    const list = items.length ? items : parseExpenseSentence(text.trim());
    if (!list.length) {
      setHint('没听出金额，再说一次');
      return;
    }
    const total = addMoney(list);
    void saveRecord('money', {
      asr_text: text.trim(),
      parsed_data: {
        kind: 'money',
        items: list.map((x) => ({
          note: x.note,
          amt: x.amt,
          cat: x.cat,
          catName: cats.find((c) => c.k === x.cat)?.n || '其他',
        })),
        count: list.length,
        total,
      },
    });
    onSaved(list.length, total);
    onClose();
  };

  const total = items.reduce((s, x) => s + x.amt, 0);

  return (
    <div className="modal center open">
      <div className="mask" onClick={onClose}></div>
      <div className="panel center big">
        <button className="closex" onClick={onClose}>
          ×
        </button>
        <div className="ph">记一笔账</div>

        {listening ? (
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
            <div className="mini" style={{ marginTop: 10, letterSpacing: '1.6px' }}>
              正在聆听…
            </div>
          </div>
        ) : (
          <>
            <textarea
              ref={boxRef}
              className="inp qt-box"
              value={text}
              onChange={(e) => onChange(e.target.value)}
              placeholder="比如：早上咖啡 28，中午外卖 35，晚上和朋友吃饭 AA80"
              style={{ textAlign: 'center', minHeight: '13vh' }}
            />

            <div id="mqItems">
              {!text.trim() ? (
                <div className="money-hint">掌柜会自动拆分多笔 · 提取金额和分类</div>
              ) : items.length ? (
                <>
                  <div className="money-hint" style={{ marginBottom: 8 }}>
                    听出 <b style={{ color: 'var(--gold)' }}>{items.length}</b> 笔 · 共 ¥
                    {num(total)} · 分类不对点一下就能改
                  </div>
                  {items.map((it, i) => (
                    <div className="mq-item" key={i}>
                      <div className="mq-n">{it.note}</div>
                      <div className="mq-a">¥{num(it.amt)}</div>
                      <select
                        className="mq-c"
                        value={it.cat}
                        onChange={(e) => {
                          const cat = e.target.value;
                          setItems((prev) =>
                            prev.map((x, idx) => (idx === i ? { ...x, cat } : x))
                          );
                        }}
                      >
                        {cats.map((c) => (
                          <option key={c.k} value={c.k}>
                            {c.n}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </>
              ) : (
                <div className="money-hint">掌柜没听出金额，再说一次？</div>
              )}
            </div>

            {hint && (
              <div className="mini" style={{ color: '#F0997B', marginTop: 8 }}>
                {hint}
              </div>
            )}

            <div className="row" style={{ margin: '14px 0 0' }}>
              <button className="btn" onClick={speak}>
                <svg viewBox="0 0 24 24">
                  <path d="M12 3a3 3 0 0 1 3 3v6a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3z" />
                  <path d="M5.5 11.5a6.5 6.5 0 0 0 13 0" />
                </svg>
                语音
              </button>
              <span style={{ flex: 1 }}></span>
              <button className="btn" onClick={onClose}>
                算了
              </button>
              <button className="btn pri" onClick={save}>
                存入钱袋
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
