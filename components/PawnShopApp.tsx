'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { initPawnShop } from '@/lib/pawnshop';
import { listen, type VoiceKind } from '@/lib/speech';

export default function PawnShopApp() {
  const router = useRouter();

  useEffect(() => {
    initPawnShop({
      mode: 'home',
      onGo: (kind: string) => router.push('/' + kind),
      voice: (kind: VoiceKind) => listen(kind),
    });
  }, [router]);

  return (
    <>
      <canvas id="stars"></canvas>

      <div id="gate">
        <div>
          <div className="gate-kicker">第 ∞ 号当铺 · 今 夜 开 张</div>
          <h1 className="gate-title">光阴的故事</h1>
          <p className="gate-sub">
            存进来的是光阴，
            <br />
            换走的是对自己的洞见。
          </p>
          <button className="btn big" id="gateGo">
            推门而入
          </button>
          <div className="gate-foot">光阴的故事 Demo V1.0</div>
        </div>
      </div>
      <div className="nebula n1"></div>
      <div className="nebula n2"></div>
      <div className="nebula n3"></div>

      {/* ============ 开业指引 coach marks ============ */}
      <div id="coach" className="hidden">
        <div className="coach-card">
          <div className="coach-kicker">
            <span>第∞号当铺 · 开业指引</span>
            <span id="coachSkip">跳过</span>
          </div>
          <h3 id="coachTitle"></h3>
          <p id="coachBody"></p>
          <div className="coach-foot">
            <button className="btn sm" id="coachPrev">
              上一步
            </button>
            <div className="coach-dots" id="coachDots"></div>
            <button className="btn gold sm" id="coachNext">
              下一步
            </button>
          </div>
        </div>
      </div>

      <div id="app">
        <div id="topbar">
          <div className="brand">
            光阴的故事<small>PAWN SHOP No.∞</small>
          </div>
          <div className="hd-r">
            <button className="icb" id="btnBox" title="月光宝盒">
              <svg viewBox="0 0 24 24">
                <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z" />
                <path d="M15.5 6.2l.6 1.5 1.5.6-1.5.6-.6 1.5-.6-1.5-1.5-.6 1.5-.6.6-1.5z" />
              </svg>
            </button>
            <button className="icb" id="btnSet" title="当铺后台">
              <svg viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="3.2" />
                <path d="M12 2.8v2.6M12 18.6v2.6M2.8 12h2.6M18.6 12h2.6M5.5 5.5l1.8 1.8M16.7 16.7l1.8 1.8M18.5 5.5l-1.8 1.8M7.3 16.7l-1.8 1.8" />
              </svg>
            </button>
          </div>
        </div>

        <div id="deck">
          {/* 首页 */}
          <section className="pane" id="pHome">
            <div className="hero">
              <div className="dateline" id="heroDate"></div>
              <div className="sign">
                <svg className="hw l" viewBox="0 0 12 34">
                  <path d="M1 1h10v10H1z" />
                  <path d="M4 4v4h4V4" />
                  <path d="M1 13h10v10H1z" />
                  <path d="M4 16v4h4v-4" />
                  <path d="M1 25h10v8H1z" />
                  <path d="M4 28v3h4v-3" />
                </svg>
                <div className="sign-b">
                  <div className="sign-cn">第∞号当铺</div>
                  <div className="sign-en">PAWN SHOP No.∞</div>
                </div>
                <svg className="hw r" viewBox="0 0 12 34">
                  <path d="M1 1h10v10H1z" />
                  <path d="M4 4v4h4V4" />
                  <path d="M1 13h10v10H1z" />
                  <path d="M4 16v4h4v-4" />
                  <path d="M1 25h10v8H1z" />
                  <path d="M4 28v3h4v-3" />
                </svg>
              </div>
              <div className="sign-open">今 夜 营 业</div>
              <div className="counter" id="heroCount"></div>
            </div>

            <div className="grid">
              <div
                className="card"
                data-go="time"
                style={
                  {
                    '--gl': 'rgba(240,200,130,.22)',
                    '--gc': 'rgba(240,211,148,.4)',
                    '--gc2': '#F0D394',
                  } as React.CSSProperties
                }
              >
                <div className="no">No.01</div>
                <div className="knob"></div>
                <div className="emblem">
                  <svg viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="8.6" />
                    <path d="M12 7.2V12l3 2.2" />
                  </svg>
                </div>
                <h3>时间都去哪儿了</h3>
                <p>
                  说出计划，再说出实际
                  <br />
                  AI 替你看看它们差在哪
                </p>
                <div className="stat" id="stTime"></div>
              </div>

              <div
                className="card"
                data-go="money"
                style={
                  {
                    '--gl': 'rgba(143,216,196,.18)',
                    '--gc': 'rgba(143,216,196,.36)',
                    '--gc2': '#8FD8C4',
                  } as React.CSSProperties
                }
              >
                <div className="no">No.02</div>
                <div className="knob"></div>
                <div className="emblem">
                  <svg viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="8.4" />
                    <path d="M12 7.4v9.2M9.4 9.8h4.2a2 2 0 0 1 0 4.4H9.4" />
                  </svg>
                </div>
                <h3>我的钱都去哪儿了</h3>
                <p>
                  一句话记一笔，自动归类
                  <br />
                  和上周比一比多还是少
                </p>
                <div className="stat" id="stMoney"></div>
              </div>

              <div
                className="card"
                data-go="mood"
                style={
                  {
                    '--gl': 'rgba(191,163,232,.18)',
                    '--gc': 'rgba(191,163,232,.36)',
                    '--gc2': '#BFA3E8',
                  } as React.CSSProperties
                }
              >
                <div className="no">No.03</div>
                <div className="knob"></div>
                <div className="emblem">
                  <svg viewBox="0 0 24 24">
                    <path d="M12 21c0-5.5 3.4-9.6 8-10.6-.6 5.6-3.8 9.4-8 10.6z" />
                    <path d="M12 21c0-5.5-3.4-9.6-8-10.6.6 5.6 3.8 9.4 8 10.6z" />
                    <path d="M12 21v-6" />
                  </svg>
                </div>
                <h3>心情树洞</h3>
                <p>
                  在这里分享你的喜怒哀乐，
                  <br />
                  甚至可以自己定义心情标签。
                  <br />
                  树会长出你的心情年轮。
                </p>
                <div className="stat" id="stMood"></div>
              </div>

              <div
                className="card"
                data-go="dream"
                style={
                  {
                    '--gl': 'rgba(242,169,188,.16)',
                    '--gc': 'rgba(242,169,188,.34)',
                    '--gc2': '#F2A9BC',
                  } as React.CSSProperties
                }
              >
                <div className="no">No.04</div>
                <div className="knob"></div>
                <div className="emblem">
                  <svg viewBox="0 0 24 24">
                    <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z" />
                    <path d="M15.5 6.2l.7 1.7 1.7.7-1.7.7-.7 1.7-.7-1.7-1.7-.7 1.7-.7.7-1.7z" />
                  </svg>
                </div>
                <h3>白日梦想家</h3>
                <p>
                  记录你的奇思妙想、未来想成为
                  <br />
                  什么样的人、立 flag，
                  <br />
                  或者写封信给未来的自己。
                </p>
                <div className="stat" id="stDream"></div>
              </div>
            </div>

            <button className="boxbtn" id="btnBoxHome">
              <svg viewBox="0 0 24 24">
                <path d="M20.5 14.5A8.5 8.5 0 0 1 9.5 3.5a8.5 8.5 0 1 0 11 11z" />
                <path d="M15.5 6.2l.6 1.5 1.5.6-1.5.6-.6 1.5-.6-1.5-1.5-.6 1.5-.6.6-1.5z" />
              </svg>
              月光宝盒
            </button>

            <button className="mem-link" id="memEntry">
              点击这里，走进你们的纪念册
            </button>

            <div className="quotes" id="homeQuote"></div>
            <div className="privacy">
              🔒 所有记录只保存在这台设备的浏览器里 · 不上传任何服务器
            </div>
          </section>

          {/* 纪念册 */}
          <section className="pane" id="pMem"></section>
        </div>
      </div>

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
    </>
  );
}
