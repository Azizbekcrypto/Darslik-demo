import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import mentorImg from '../../assets/common/mentor.png';

// ============================================================
// PM 6-DARS — DEMO DAY: SAYTINGNI JONLI PITCH QIL — PLATFORM STANDARD v16
// G'oya: o'quvchining REAL sayti bor (HTML+CSS+JS). Endi uni 2 daqiqada jonli ko'rsatib,
//        sodda tilda tushuntirib, ishonch bilan taqdim qilishni o'rganadi. Demo Day repetitsiyasi.
// Spine: "AYTMA — KO'RSAT" (show, don't tell). Jonli demo — eng kuchli dalil.
// Texnika analogiyasi (inson tanasi): HTML = skelet, CSS = teri/ko'rinish, JS = harakat/jon.
// 4 qism: Ochilish+"ha" → Jonli demo → Sodda texnika → Yakun+ishonch.
// Bu — PM yo'nalishining FINALI: shu darsdan keyin Demo Day.
// AUDIOSIZ — ovoz yo'q, faqat matn va animatsiya.
// PRODUCTION: <style> ichidagi @import OLIB TASHLANADI — shriftlarni LMS yuklaydi.
// ============================================================

const T = {
  bg: '#F6F4EF', ink: '#0E0E10', ink2: '#5A5A60', ink3: '#A7A6A2',
  paper: '#FFFFFF', accent: '#FF4F28', accentSoft: '#FFE8E1', accentVivid: '#FF4F28',
  success: '#1F7A4D', successSoft: '#E3F0E8', blue: '#019ACB', blueSoft: '#E2F4FA', link: '#1a56db',
  honey: '#E0892B', honeySoft: '#FBEFDD', grape: '#7B3FE4', grapeSoft: '#EFE9FB',
  shadowBase: '58, 53, 48'
};
const CODE = { bg: '#1A2436', text: '#E8E5DD', tag: '#FF7755', attr: '#FFD380', str: '#7DD181', comment: '#6B7585', punct: '#9FB4D8' };
const G = "Georgia, serif";

const LangContext = createContext('uz');
const MentorCtx = createContext(null);

function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < breakpoint : false);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [breakpoint]);
  return isMobile;
}

// ===== IKONKALAR =====
const sv = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' };
const Ico = {
  check: (s = 18) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv} strokeWidth={2.3}><path d="M20 6L9 17l-5-5" /></svg>),
  x: (s = 18) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv} strokeWidth={2.2}><path d="M6 6l12 12M18 6L6 18" /></svg>),
  arrow: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv} strokeWidth={1.9}><path d="M4 12h14" /><path d="M13 6l6 6-6 6" /></svg>),
  user: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><circle cx="12" cy="8" r="3.6" /><path d="M5 20c0-3.6 3.2-5.8 7-5.8s7 2.2 7 5.8" /></svg>),
  heart: (s = 22, fill) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv} fill={fill ? 'currentColor' : 'none'}><path d="M12 20s-7-4.4-9.2-8.6C1.3 8.3 3 5 6.2 5c2 0 3 1.2 3.8 2.3C10.9 6.2 11.9 5 14 5c3.2 0 4.9 3.3 3.4 6.4C19.2 15.6 12 20 12 20z" /></svg>),
  chat: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M4 5h16v11H9l-4 4v-4H4z" /></svg>),
  problem: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><circle cx="12" cy="12" r="9" /><path d="M9.6 9.3a2.4 2.4 0 1 1 3.3 2.2c-.7.4-1 .9-1 1.7" /><path d="M12 16.7h.01" /></svg>),
  clock: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>)
};

// PM-6 belgilar: demo(play), tana qatlamlari (skelet/teri/harakat), qo'l, medal, mikrofon
const p6sv = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' };
const p6 = {
  play: (s = 18) => (<svg viewBox="0 0 24 24" width={s} height={s} {...p6sv}><circle cx="12" cy="12" r="9" /><path d="M10 8.4l5.5 3.6L10 15.6z" /></svg>),
  frame: (s = 18) => (<svg viewBox="0 0 24 24" width={s} height={s} {...p6sv}><rect x="4" y="5" width="16" height="14" rx="1.5" /><path d="M4 9h16M9 9v10" /></svg>),
  palette: (s = 18) => (<svg viewBox="0 0 24 24" width={s} height={s} {...p6sv}><path d="M12 3a9 9 0 1 0 0 18c1 0 1.5-.6 1.5-1.3 0-.4-.2-.7-.4-1-.2-.3-.4-.5-.4-.9 0-.7.6-1.3 1.3-1.3H15a6 6 0 0 0 6-6c0-4.4-4-8.5-9-7.5z" /><circle cx="8" cy="11" r="1" /><circle cx="12" cy="8" r="1" /><circle cx="16" cy="11" r="1" /></svg>),
  bolt: (s = 18) => (<svg viewBox="0 0 24 24" width={s} height={s} {...p6sv}><path d="M13 2.5L4.5 13.5H10l-1 8 9.5-12.5H13z" /></svg>),
  hand: (s = 18) => (<svg viewBox="0 0 24 24" width={s} height={s} {...p6sv}><path d="M8.5 11V6a1.5 1.5 0 0 1 3 0v4M11.5 10V5a1.5 1.5 0 0 1 3 0v5M14.5 11V7a1.5 1.5 0 0 1 3 0v6c0 3.3-2.4 6-6 6-2.3 0-3.8-1-4.9-2.7l-2-3.3a1.5 1.5 0 0 1 2.6-1.5L8.5 13" /></svg>),
  mic: (s = 18) => (<svg viewBox="0 0 24 24" width={s} height={s} {...p6sv}><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M6 11a6 6 0 0 0 12 0" /><path d="M12 17v4M9 21h6" /></svg>),
  medal: (s = 18) => (<svg viewBox="0 0 24 24" width={s} height={s} {...p6sv}><circle cx="12" cy="15" r="5.5" /><path d="M9 10L6.5 3M15 10l2.5-7M10 15l1.4 1.4L14 13.8" /></svg>),
  spark: (s = 18) => (<svg viewBox="0 0 24 24" width={s} height={s} {...p6sv}><path d="M12 3.5v3M12 17.5v3M3.5 12h3M17.5 12h3M6.2 6.2l2.1 2.1M15.7 15.7l2.1 2.1M17.8 6.2l-2.1 2.1M8.3 15.7l-2.1 2.1" /></svg>)
};

const LESSON_META = { lessonId: 'pm-demoday-pitch-06-v16', lessonTitle: { uz: 'Demo Day — jonli pitch', ru: 'Demo Day — живой питч' } };
const SCREEN_META = [
  { id: 's0',  type: 'hook',        template: 'custom',   scored: false, scope: 'hook' },
  { id: 's1',  type: 'rule',        template: 'custom',   scored: false, scope: null },
  { id: 's2',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's3',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's4',  type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's5',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's5b', type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's6',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's7',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's8',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's9',  type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's10', type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's11', type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's12', type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's13', type: 'case',        template: 'custom',   scored: false, scope: null },
  { id: 's14', type: 'rule',        template: 'custom',   scored: false, scope: null },
  { id: 's15', type: 'test',        template: 'custom',   scored: true,  scope: 'final' },
  { id: 's16', type: 'summary',     template: 'custom',   scored: false, scope: null }
];
const TOTAL_SCREENS = SCREEN_META.length;
const SCORED_IDX = SCREEN_META.map((m, i) => (m.scored ? i : null)).filter(i => i !== null);

// ===== KONSEPT LEKSIKONI =====
// Demo Day taqdimotining 4 qismi
const PARTS = [
  { key: 'ochilish', label: 'Ochilish + "ha"', color: T.honey, ic: p6.spark(18), job: 'Muammoni ayt — auditoriya "ha, menda ham bor" deb bosh qimirlatsin.', ex: 'Sevimli rasmlaringizni do\'stlarga ko\'rsatish noqulay emasmi?' },
  { key: 'demo', label: 'Jonli demo', color: T.accent, ic: p6.play(18), job: 'Saytni KO\'RSAT, bosib ber: "mana — ishlaydi!"', ex: 'Mana, like tugmasini bosaman — hisob ortdi. Jonli ishlaydi!' },
  { key: 'texnika', label: 'Sodda texnika', color: T.blue, ic: p6.frame(18), job: 'Qanday qurganing — jargonsiz, tanish analogiya bilan.', ex: 'Skelet — HTML, ko\'rinish — CSS, harakat — JS.' },
  { key: 'yakun', label: 'Yakun + ishonch', color: T.grape, ic: p6.hand(18), job: 'Yakunla va savolga tayyor tur.', ex: 'Rahmat! Savollaringiz bo\'lsa — mamnuniyat bilan javob beraman.' }
];
const PMETA = {}; PARTS.forEach(p => { PMETA[p.key] = p; });

// Texnika ↔ tana (inson tanasi analogiyasi)
const LAYERS = [
  { key: 'html', tech: 'HTML', body: 'Skelet', color: T.honey, ic: p6.frame(18), desc: 'Struktura — sarlavha, rasm, tugma qayerda turishi. Suyak kabi karkas.' },
  { key: 'css', tech: 'CSS', body: 'Teri / ko\'rinish', color: T.blue, ic: p6.palette(18), desc: 'Rang, shrift, dizayn — sayt chiroyli ko\'rinadi. Teri va kiyim kabi.' },
  { key: 'js', tech: 'JS', body: 'Harakat / jon', color: T.accent, ic: p6.bolt(18), desc: 'Tugma bosilganda nimadir bo\'ladi — like ortadi. Mushak va harakat kabi.' }
];

const Split = ({ children, refEl }) => <div className="split" ref={refEl}>{children}</div>;
const Col = ({ children, gap }) => <div className="col" style={gap ? { gap } : undefined}>{children}</div>;

const Stage = ({ children, eyebrow, screen, totalScreens = TOTAL_SCREENS, navContent, narrow, mentorStatic }) => {
  const isMobile = useIsMobile();
  const isNarrow = useIsMobile(768);
  const collapseOn = isNarrow && !mentorStatic;
  const padH = isMobile ? 12 : 100;
  const [mCollapsed, setMCollapsed] = useState(false);
  const contentRef = useRef(null);
  useEffect(() => { setMCollapsed(false); }, [screen]);
  const setCollapsed = useCallback((v) => {
    setMCollapsed(v);
    if (v === false && contentRef.current) { const el = contentRef.current; requestAnimationFrame(() => { if (el) el.scrollTo({ top: 0, behavior: 'auto' }); }); }
  }, []);
  const onContentClick = (e) => {
    if (!collapseOn || mCollapsed) return;
    if (e.target && e.target.closest && e.target.closest('.mentor')) return;
    setMCollapsed(true);
  };
  const onContentScroll = () => {
    if (!collapseOn || mCollapsed) return;
    const el = contentRef.current;
    if (el && el.scrollTop > 6) setMCollapsed(true);
  };
  return (
    <MentorCtx.Provider value={{ enabled: collapseOn, collapsed: mCollapsed, setCollapsed }}>
      <div className="stage">
        <div className="stage-header" style={{ paddingLeft: padH, paddingRight: padH }}>
          <div className="progress-track"><div className="progress-bar" style={{ width: `${((screen + 1) / totalScreens) * 100}%` }} /></div>
          <div className="chrome">
            <div className="chrome-left eyebrow"><span className="dot" /><span>{eyebrow}</span></div>
            <div className="mono small" style={{ color: T.ink3 }}>{String(screen + 1).padStart(2, '0')} / {String(totalScreens).padStart(2, '0')}</div>
          </div>
        </div>
        <div ref={contentRef} onClick={onContentClick} onScroll={onContentScroll} className={`stage-content ${narrow ? 'narrow' : ''}`} style={{ paddingLeft: padH, paddingRight: padH }}>{children}</div>
        {navContent && <div className="stage-nav" style={{ paddingLeft: padH, paddingRight: padH }}>{navContent}</div>}
      </div>
    </MentorCtx.Provider>
  );
};
const NavBack = ({ onPrev }) => <button className="btn-ghost" onClick={onPrev} style={{ padding: 'clamp(11px,1.6vw,13px) clamp(16px,2.2vw,22px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Orqaga</button>;
const NavNext = ({ disabled, label = 'Davom etish', onClick }) => <button className="btn-white-accent" disabled={disabled} onClick={onClick} style={{ padding: 'clamp(11px,1.6vw,13px) clamp(22px,2.6vw,30px)', fontSize: 'clamp(13px,1.5vw,15px)', marginLeft: 'auto' }}>{label}</button>;

const FeedbackBlock = ({ show, isCorrect, children }) => {
  const [mounted, setMounted] = useState(show);
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    if (show) { setMounted(true); requestAnimationFrame(() => requestAnimationFrame(() => { setVisible(true); setTimeout(() => { if (ref.current) ref.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 350); })); }
    else { setVisible(false); const t = setTimeout(() => setMounted(false), 400); return () => clearTimeout(t); }
  }, [show]);
  if (!mounted) return null;
  return <div ref={ref} className={`feedback-block ${visible ? 'visible' : ''}`}><div className={isCorrect ? 'frame-success' : 'frame-soft'}>{children}</div></div>;
};

const QuestionScreen = ({ screen, scope, eyebrow, question, questionText, options, correctIdx, explainCorrect, explainWrong, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [picked, setPicked] = useState(storedAnswer?.lastPicked ?? storedAnswer?.picked ?? null);
  const [solved, setSolved] = useState(storedAnswer ? (storedAnswer.solved ?? (storedAnswer.picked === correctIdx)) : false);
  const firstCorrectRef = useRef(storedAnswer ? (storedAnswer.firstAttemptCorrect ?? storedAnswer.correct ?? null) : null);
  const pick = (i) => {
    if (solved) return;
    setPicked(i);
    const isCorrect = i === correctIdx;
    if (firstCorrectRef.current === null) firstCorrectRef.current = isCorrect;
    if (isCorrect) setSolved(true);
    onAnswer(screen, { stage: scope, screenIdx: screen, question: questionText, options, correctIndex: correctIdx, correctAnswer: options[correctIdx], picked: i, studentAnswerIndex: i, studentAnswer: options[i], correct: firstCorrectRef.current, firstAttemptCorrect: firstCorrectRef.current, solved: isCorrect, lastPicked: i });
  };
  return (
    <Stage eyebrow={eyebrow} screen={screen} narrow navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!solved} label={solved ? 'Davom etish' : "To'g'ri javobni toping"} onClick={onNext} /></>}>
      <div className="screen" style={{ justifyContent: 'center', gap: 'clamp(16px,2.5vw,24px)' }}>
        <div className="fade-up">{question}</div>
        <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {options.map((opt, i) => {
            let cls = 'option';
            if (solved) { if (i === correctIdx) cls += ' option-correct'; else cls += ' option-wrong'; }
            else if (i === picked) cls += ' option-picked-wrong';
            return (
              <button key={i} className={cls} disabled={solved} onClick={() => pick(i)} style={{ padding: 'clamp(12px,1.8vw,16px) clamp(14px,2.2vw,20px)', fontSize: 'clamp(14px,1.7vw,16px)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="mono small" style={{ minWidth: 20, color: solved && i === correctIdx ? T.success : T.ink3 }}>{String.fromCharCode(65 + i)}</span>
                <span style={{ flex: 1 }}>{opt}</span>
              </button>
            );
          })}
        </div>
        <FeedbackBlock show={picked !== null} isCorrect={solved}>
          <p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: solved ? T.success : T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{solved ? "To'g'ri" : "Qaytadan urinib ko'ring"}</p>
          <p className="body" style={{ margin: 0 }}>{solved ? explainCorrect : (explainWrong[picked] ?? explainWrong.default)}</p>
        </FeedbackBlock>
      </div>
    </Stage>
  );
};

function ScoreRing({ correct, total }) {
  const PCT = total ? correct / total : 0;
  const col = PCT >= 0.6 ? T.success : T.accent;
  const R = 50, ST = 9, C = 2 * Math.PI * R;
  const [off, setOff] = useState(C);
  useEffect(() => { const t = setTimeout(() => setOff(C * (1 - PCT)), 200); return () => clearTimeout(t); }, [C, PCT]);
  return (
    <div className="ring-wrap">
      <svg width="128" height="128" viewBox="0 0 128 128">
        <circle cx="64" cy="64" r={R} fill="none" stroke={T.ink3 + '40'} strokeWidth={ST} />
        <circle cx="64" cy="64" r={R} fill="none" stroke={col} strokeWidth={ST} strokeLinecap="round" strokeDasharray={C} strokeDashoffset={off} transform="rotate(-90 64 64)" style={{ transition: 'stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)' }} />
      </svg>
      <div className="ring-center"><div className="ring-num"><span style={{ color: col }}>{correct}</span><span className="ring-den">/{total}</span></div><div className="ring-lbl">to'g'ri javob</div></div>
    </div>
  );
}

const Mentor = ({ children }) => {
  const ctx = useContext(MentorCtx) || {};
  const enabled = !!ctx.enabled;
  const collapsed = enabled && ctx.collapsed;
  const expand = (e) => { e.stopPropagation(); if (ctx.setCollapsed) ctx.setCollapsed(false); };
  return (
    <div className={`mentor fade-up ${enabled ? 'mentor-mob' : ''} ${collapsed ? 'is-collapsed' : ''}`} onClick={collapsed ? expand : undefined} role={collapsed ? 'button' : undefined}>
      <div className="mentor-ava" aria-hidden="true">
        <img src={mentorImg} alt="" />
      </div>
      <div className="mentor-col">
        <span className="mentor-name">Mentor{collapsed && <span className="mentor-cue"> · ko'rsatmani ochish ▾</span>}</span>
        <div className="mentor-msg body">{children}</div>
      </div>
    </div>
  );
};

const Q = ({ children, max = 760 }) => <h2 className="title h-title fade-up" style={{ maxWidth: max }}>{children}</h2>;
const IcoChip = ({ color = T.accent, soft = T.accentSoft, children, size = 46 }) => (
  <span style={{ width: size, height: size, borderRadius: 13, background: soft, color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{children}</span>
);

const MentorCollapseScroll = ({ targetRef }) => {
  const ctx = useContext(MentorCtx) || {};
  const prev = useRef(false);
  useEffect(() => {
    if (ctx.enabled && ctx.collapsed && !prev.current && targetRef && targetRef.current) {
      const el = targetRef.current;
      setTimeout(() => { if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 420);
    }
    prev.current = !!ctx.collapsed;
  }, [ctx.collapsed, ctx.enabled, targetRef]);
  return null;
};

// Qora "pitch script" kartasi
const SpecCard = ({ items, minH = 200, title = '2 daqiqalik pitch', icon }) => (
  <div className="spec-card" style={{ minHeight: minH }}>
    <div className="spec-head"><span style={{ display: 'inline-flex', color: '#9FB4D8' }}>{icon || p6.mic(15)}</span><span className="spec-title">{title}</span></div>
    {items.map((it, i) => (
      <div key={i} className={it.text ? 'feat-pop' : ''}>
        {it.label && <span className="spec-lbl" style={{ color: it.color || '#9FB4D8' }}>{it.label}</span>}
        <p className="spec-text" style={{ color: it.text ? '#E8E5DD' : '#6B7585', fontStyle: it.text ? 'normal' : 'italic' }}>{it.text || it.ph}</p>
      </div>
    ))}
  </div>
);

// ===== SIGNATURE: jonli mini-sayt (like tugmasi ishlaydi — "show, don't tell") =====
const LiveSite = ({ live = true, styled = true, onLike }) => {
  const [likes, setLikes] = useState(12);
  const [liked, setLiked] = useState(false);
  const [pop, setPop] = useState(false);
  const tap = () => {
    if (!live) return;
    setLiked(v => { const nv = !v; setLikes(n => (nv ? n + 1 : n - 1)); return nv; });
    setPop(true); setTimeout(() => setPop(false), 320);
    if (onLike) onLike();
  };
  return (
    <div className={`mini-site ${styled ? '' : 'skel'}`}>
      <div className="ms-top"><span className="ms-dots"><i /><i /><i /></span><span className="ms-url">mening-saytim.uz</span></div>
      <div className="ms-body">
        <div className="ms-head"><span className="ms-ava" /><span className="ms-name">{styled ? 'Aziz' : ''}</span></div>
        <div className="ms-img">{styled && <span className="ms-imgico">🏞️</span>}</div>
        <div className="ms-row">
          <button className={`ms-like ${liked ? 'on' : ''} ${pop ? 'pop' : ''}`} onClick={tap} disabled={!live} aria-label="like">
            {Ico.heart(18, liked)}<span className="ms-count">{styled ? likes : ''}</span>
          </button>
          {styled && <span className="ms-cap">{live ? 'bosib ko\'ring →' : 'JS yo\'q — tugma jim'}</span>}
        </div>
      </div>
    </div>
  );
};

// Texnika qatlami ko'rsatkichi (HTML→CSS→JS)
const LayerSite = ({ layer }) => {
  // layer: 'html' | 'css' | 'js'
  const styled = layer === 'css' || layer === 'js';
  const live = layer === 'js';
  return <LiveSite styled={styled} live={live} />;
};

// 2 daqiqa repetitsiya taymeri
const RehearseTimer = () => {
  const [sec, setSec] = useState(120);
  const [running, setRunning] = useState(false);
  const ref = useRef(null);
  useEffect(() => () => clearInterval(ref.current), []);
  const start = () => { if (running) return; setRunning(true); clearInterval(ref.current); ref.current = setInterval(() => setSec(s => { if (s <= 1) { clearInterval(ref.current); setRunning(false); return 0; } return s - 1; }), 1000); };
  const reset = () => { clearInterval(ref.current); setRunning(false); setSec(120); };
  const mm = Math.floor(sec / 60); const ss = String(sec % 60).padStart(2, '0');
  const over = sec === 0;
  return (
    <div className="frame fade-step" style={{ display: 'flex', alignItems: 'center', gap: 13, padding: '13px 16px', flexWrap: 'wrap' }}>
      <span style={{ fontFamily: "'Fraunces',serif", fontSize: 30, lineHeight: 1, color: over ? T.accent : (running ? T.success : T.ink), minWidth: 64 }}>{mm}:{ss}</span>
      <div style={{ flex: 1, minWidth: 150 }}>
        <p style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 13, color: T.ink, margin: 0 }}>{over ? 'Vaqt tugadi — qanday chiqdi?' : (running ? 'Ovoz chiqarib ayting — sayt oldida!' : 'Pitchingizni 2 daqiqada ovoz chiqarib mashq qiling')}</p>
      </div>
      {!running && !over && <button className="btn" onClick={start}>▶ Repetitsiya</button>}
      {(running || over) && <button className="btn-soft" onClick={reset}>↺ Qaytadan</button>}
    </div>
  );
};

// Auditoriya — to'g'ri ochilishda bosh qimirlatadi ("ha")
const Audience = ({ nodding }) => (
  <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
    {[0, 1, 2].map(i => (
      <span key={i} className={nodding ? 'nodder' : ''} style={{ animationDelay: `${i * 0.15}s`, color: nodding ? T.success : T.ink3, display: 'inline-flex' }}>{Ico.user(30)}</span>
    ))}
  </div>
);

const Zoomable = ({ children }) => {
  const [big, setBig] = useState(false);
  useEffect(() => {
    if (!big) return;
    const onKey = (e) => { if (e.key === 'Escape') setBig(false); };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => { document.body.style.overflow = ''; window.removeEventListener('keydown', onKey); };
  }, [big]);
  return (
    <>
      {big && <div className="zoom-backdrop" onClick={() => setBig(false)} />}
      <div className={`zoomable ${big ? 'zoom-on' : ''}`}>
        <button type="button" className="zoom-btn" onClick={() => setBig(b => !b)} aria-label={big ? 'Kichraytirish' : 'Kattalashtirish'} title={big ? 'Kichraytirish' : 'Kattalashtirish'}>{big ? '✕' : '⛶'}</button>
        {children}
      </div>
    </>
  );
};

// ===== SCREEN 0 — HOOK =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [mode, setMode] = useState('tell');
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const OPTS = [
    { id: 'a', label: 'Ko\'proq gapirgani uchun' },
    { id: 'b', label: 'Saytni jonli ko\'rsatib, ishlashini isbotlagani uchun' },
    { id: 'c', label: 'Farqi yo\'q, ikkalasi bir xil' }
  ];
  const pick = (id) => { if (picked !== null) return; setPicked(id); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: id, correct: true }); };
  return (
    <Stage eyebrow="Kirish" screen={screen} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 840 }}>Bir sayt, ikki taqdimot — qaysi biri sizni <span className="italic" style={{ color: T.accent }}>"voy"</span> deydi?</h1>
        <Mentor>Ikki o'quvchi bir xil saytni taqdim qilmoqda. Birini bosing — biri faqat <b style={{ color: T.ink }}>gapiradi</b>, biri <b style={{ color: T.ink }}>jonli ko'rsatadi</b>.</Mentor>
        <Zoomable>
        <Split>
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${mode === 'tell' ? 'chip-on' : ''}`} onClick={() => setMode('tell')}>Faqat gapiradi</button>
              <button className={`chip ${mode === 'show' ? 'chip-on' : ''}`} onClick={() => setMode('show')}>Jonli ko'rsatadi</button>
            </div>
            {mode === 'tell' ? (
              <div key="t" className="demo-swap" style={{ background: T.paper, borderRadius: 14, padding: '18px 17px', boxShadow: `0 8px 20px -7px rgba(${T.shadowBase},0.16)`, borderLeft: `4px solid ${T.ink3}` }}>
                <span style={{ color: T.ink3, display: 'inline-flex' }}>{p6.mic(18)}</span>
                <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', lineHeight: 1.55, color: T.ink, margin: '9px 0 0' }}>"Men sayt qildim. Unda HTML, CSS va JavaScript bor. Juda ko'p kod yozdim, qiyin bo'ldi. Ishonsangiz, ishlaydi."</p>
                <p className="small" style={{ margin: '8px 0 0', color: T.ink3, fontStyle: 'italic' }}>Auditoriya zerikdi — hech narsa ko'rmadi.</p>
              </div>
            ) : (
              <div key="s" className="demo-swap" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <LiveSite />
                <p className="small" style={{ margin: 0, color: T.success, fontWeight: 600, textAlign: 'center' }}>Yuragni bosing — jonli ishlaydi! ❤️</p>
              </div>
            )}
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Qaysi taqdimot kuchliroq?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => { const on = picked === o.id; return (<button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null} onClick={() => pick(o.id)}><span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span></button>); })}
            </div>
            {picked !== null && <p className="hook-ack fade-step">"Men qildim" deb 100 marta aytishdan ko'ra, bir marta <b>bosib ko'rsatish</b> kuchliroq. Demo Day siri: <b>aytma — ko'rsat</b>.</p>}
          </Col>
        </Split>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const STEPS = [
    { text: 'Ochilish — muammoni ayt, "ha" oldir', tag: '' },
    { text: 'Jonli demo — saytni ko\'rsat (eng kuchli)', tag: '' },
    { text: 'Texnikani sodda til bilan tushuntir', tag: '' },
    { text: 'Yakunla va savolga tayyor tur', tag: '2 daqiqa' },
    { text: 'O\'z pitchingni yozib, ovoz chiqarib mashq qilasan', tag: 'amaliyot' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const Idea = ({ ic, h, t, c }) => (<div className="frame" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px' }}><IcoChip color={c} soft={c + '1c'}>{ic}</IcoChip><div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, color: T.ink, margin: 0, fontSize: 'clamp(16px,2.2vw,19px)' }}>{h}</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>{t}</p></div></div>);
  const IdeaBlock = (
    <Col>
      <p className="flow-label">Bugungi asosiy g'oya</p>
      <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Idea ic={p6.play(22)} c={T.accent} h="AYTMA — KO'RSAT" t="Jonli demo — eng kuchli dalil" />
        <Idea ic={p6.frame(22)} c={T.blue} h="SODDA TIL" t="Skelet (HTML) · teri (CSS) · harakat (JS)" />
      </div>
      <p className="mono small" style={{ color: T.accent, margin: 0 }}>→ Shu darsdan keyin: Demo Day! Real saytingni taqdim qilasan</p>
    </Col>
  );
  const StepsBlock = (<Col><p className="flow-label">5 qadam</p><ol className="roadmap">{STEPS.map((s, i) => (<li key={i} className="step-card fade-up" style={{ animationDelay: `${0.08 + i * 0.05}s` }}><span className="step-num">{String(i + 1).padStart(2, '0')}</span><span className="step-body"><span className="step-text">{s.text}</span>{s.tag && <span className="step-tag">{s.tag}</span>}</span></li>))}</ol></Col>);
  return (
    <Stage eyebrow="Reja" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Boshlaymiz →" onClick={onNext} /></>}>
      <div className="screen">
        <div className="head"><h2 className="title h-title fade-up"><span className="italic" style={{ color: T.accent }}>Real saytingni Demo Day'da qanday jonli pitch qilasan?</span></h2></div>
        <Mentor>Modul 1'da <b style={{ color: T.ink }}>g'oyani</b> pitch qilding — mahsulot hali yo'q edi. Endi qo'lingda <b style={{ color: T.ink }}>haqiqiy sayt</b> bor (HTML+CSS+JS). Demo Day'da uni jonli ko'rsatasan!</Mentor>
        {!isNarrow ? (<Zoomable><Split>{IdeaBlock}{StepsBlock}</Split></Zoomable>) : !showSteps ? (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>{IdeaBlock}<button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>5 qadamni ko'rish</button></div>) : (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}><button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ G'oyani ko'rish</button>{StepsBlock}</div>)}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — 4 QISM (tap → vazifa) =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(storedAnswer ? new Set(PARTS.map(p => p.key)) : new Set());
  const isNarrow = useIsMobile(768);
  const done = seen.size >= PARTS.length;
  const tap = (k) => { setActive(k); setSeen(prev => { const n = new Set(prev); n.add(k); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Taqdimot tuzilishi" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/4 qismni oching`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Demo Day taqdimoti qaysi <span className="italic" style={{ color: T.accent }}>4 qism</span>dan iborat?</h2></div>
        <Mentor>Yaxshi taqdimot 4 qism: <b style={{ color: T.ink }}>ochilish, jonli demo, sodda texnika, yakun</b>. Har birini bosib, vazifasini ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {PARTS.map(s => (<button key={s.key} onClick={() => tap(s.key)} style={{ display: 'flex', alignItems: 'center', gap: 11, textAlign: 'left', cursor: 'pointer', border: 'none', borderRadius: 12, padding: '12px 14px', background: T.paper, boxShadow: active === s.key ? `inset 0 0 0 2px ${s.color}, 0 8px 20px -8px ${s.color}44` : `0 6px 16px -8px rgba(${T.shadowBase},0.16)`, transition: 'all 0.18s' }}><span style={{ color: s.color, display: 'inline-flex' }}>{s.ic}</span><span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 14, color: T.ink }}>{s.label}</span>{seen.has(s.key) && <span style={{ marginLeft: 'auto', color: T.success, display: 'inline-flex' }}>{Ico.check(14)}</span>}</button>))}
            </div>
          </Col>
          <Col>
            {active ? (<div className="sk-info fade-step" key={active}><span className="sk-tagbig"><span style={{ color: PMETA[active].color, display: 'inline-flex' }}>{PMETA[active].ic}</span><span className="sk-wordbadge" style={{ color: PMETA[active].color, background: PMETA[active].color + '1c' }}>{PMETA[active].label}</span></span><p className="body" style={{ color: T.ink, margin: '12px 0 0' }}>{PMETA[active].job}</p><p style={{ fontFamily: G, fontStyle: 'italic', color: T.ink2, margin: '9px 0 0', fontSize: 13.5, lineHeight: 1.5 }}>"{PMETA[active].ex}"</p></div>) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Bir qismni bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>To'rt qism birga — tayyor Demo Day taqdimoti. Markazida — <b>jonli demo</b>.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — AYTISH vs KO'RSATISH (toggle + auditoriya) =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('tell');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['tell', 'show']) : new Set(['tell']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Aytish vs Ko'rsatish" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Auditoriya qachon <span className="italic" style={{ color: T.accent }}>jonlanadi</span>?</h2></div>
        <Mentor>Bir xil sayt — ikki yo'l: <b style={{ color: T.ink }}>aytish</b> yoki <b style={{ color: T.ink }}>ko'rsatish</b>. Ikkalasini bosib, auditoriyaga qarang.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${v === 'tell' ? 'chip-on' : ''}`} onClick={() => set('tell')}>Aytaman</button>
              <button className={`chip ${v === 'show' ? 'chip-on' : ''}`} onClick={() => set('show')}>Ko'rsataman</button>
            </div>
            {v === 'tell'
              ? <div key="t" className="demo-swap frame" style={{ padding: '18px' }}><p style={{ fontFamily: G, fontStyle: 'italic', fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: 0 }}>"...va menda like tugmasi ham bor, u ishlaydi, ishoning..."</p></div>
              : <div key="s" className="demo-swap"><LiveSite /></div>}
          </Col>
          <Col>
            <div className="frame" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center' }}>
              <p className="mono small" style={{ color: T.ink2, margin: 0 }}>AUDITORIYA</p>
              <Audience nodding={v === 'show'} />
              <p className="small" style={{ margin: 0, textAlign: 'center', color: v === 'show' ? T.success : T.ink3, fontWeight: 600 }}>{v === 'show' ? '"Voy, jonli ishlaydi!" — bosh qimirlatishyapti' : 'Zerikkan — hech narsa ko\'rmayapti'}</p>
            </div>
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Ko'rsatganda auditoriya ishonadi. <b>Demo — eng kuchli dalil.</b></p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 =====
const Screen4 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 1-savol"
    questionText="Demo Day taqdimotida eng kuchli qism qaysi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Demo Day'da eng <span className="italic" style={{ color: T.accent }}>kuchli</span> qism qaysi?</h2></>}
    options={['Qancha kod yozganini aytish', 'Saytni jonli ko\'rsatish (demo)', 'Qaysi dasturlarda qilganini sanash', 'Uzoq salomlashuv']} correctIdx={1}
    explainCorrect="To'g'ri! Jonli demo — eng kuchli dalil. Aytma, ko'rsat: bosib, ishlashini isbotla. Auditoriya shunda ishonadi."
    explainWrong={{ 0: 'Qancha kod — auditoriyaga qiziq emas. Natijani (saytni) ko\'rsating.', 2: 'Dastur nomlari zeriktiradi. Jonli demo kuchliroq.', 3: 'Uzoq salomlashuv vaqtni yeydi. Tezroq demoga o\'ting.', default: 'Eng kuchli qism — jonli demo (ko\'rsatish).' }} />
);

// ===== SCREEN 5 — SKELET → TERI → HARAKAT (3 qatlam) — signature =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [idx, setIdx] = useState(0);
  const [seen, setSeen] = useState(storedAnswer ? new Set([0, 1, 2]) : new Set([0]));
  const done = seen.size >= LAYERS.length;
  const go = (i) => { if (i < 0 || i >= LAYERS.length) return; setIdx(i); setSeen(prev => { const n = new Set(prev); n.add(i); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const L = LAYERS[idx];
  return (
    <Stage eyebrow="Skelet → teri → harakat" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/3 qatlamni ko'ring`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Sayting <span className="italic" style={{ color: T.accent }}>3 qatlam</span>dan iborat — xuddi inson tanasidek</h2></div>
        <Mentor>HTML — <b style={{ color: T.honey }}>skelet</b>, CSS — <b style={{ color: T.blue }}>teri</b>, JS — <b style={{ color: T.accent }}>harakat</b>. Har qatlamni bosib, saytingiz qanday jonlanishini ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div key={L.key} className="veh-pop" style={{ width: '100%' }}><LayerSite layer={L.key} /></div>
              <div style={{ display: 'flex', gap: 7 }}>
                {LAYERS.map((s, i) => (<button key={s.key} onClick={() => go(i)} style={{ padding: '7px 13px', borderRadius: 99, border: 'none', cursor: 'pointer', fontFamily: "'Manrope'", fontWeight: 700, fontSize: 12.5, display: 'inline-flex', alignItems: 'center', gap: 6, background: i === idx ? s.color : (seen.has(i) ? s.color + '20' : T.bg), color: i === idx ? '#fff' : s.color, transition: 'all 0.18s' }}>{s.tech}{seen.has(i) && i !== idx && Ico.check(12)}</button>))}
              </div>
            </div>
          </Col>
          <Col>
            <div className="sk-info fade-step" key={L.key}>
              <span className="sk-tagbig"><span style={{ color: L.color, display: 'inline-flex' }}>{L.ic}</span><span className="sk-wordbadge" style={{ color: L.color, background: L.color + '1c' }}>{L.tech} = {L.body}</span></span>
              <p className="body" style={{ color: T.ink, margin: '12px 0 0' }}>{L.desc}</p>
            </div>
            {idx < LAYERS.length - 1
              ? <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => go(idx + 1)}>Keyingi qatlam →</button>
              : <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Skelet + teri + harakat = jonli sayt. Demo Day'da xuddi shu sodda tilda tushuntirasiz.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 5b — TEST 2 =====
const Screen5b = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Tekshiruv"
    questionText="JavaScript (JS) saytda nima qiladi — sodda til bilan?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Mustahkamlash</p><h2 className="title h-sub" style={{ marginTop: 8 }}>JS saytda <span className="italic" style={{ color: T.accent }}>nima</span> qiladi (sodda til)?</h2></>}
    options={['Sayt rangini belgilaydi', 'Saytga harakat/jon beradi — tugma bosilganda javob qaytaradi', 'Sayt strukturasini (skelet) yasaydi', 'Saytni internetga joylaydi']} correctIdx={1}
    explainCorrect="To'g'ri! JS — harakat/jon. Like tugmasi bosilganda hisob ortishi — bu JS. Tugmaga 'jon' kiritadi."
    explainWrong={{ 0: 'Rang — CSS (teri) ishi. JS esa harakat beradi.', 2: 'Struktura (skelet) — HTML ishi. JS esa harakatga keltiradi.', 3: 'Internetga joylash — deploy. JS saytni harakatlantiradi.', default: 'JS saytga harakat beradi — tugma bosilganda javob.' }} />
);

// ===== SCREEN 6 — TAQDIMOT STEPPERI (2 daqiqada quriladi) =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [step, setStep] = useState(storedAnswer ? PARTS.length : 0);
  const [running, setRunning] = useState(false);
  const timer = useRef(null);
  const isMobile = useIsMobile();
  const done = step >= PARTS.length;
  useEffect(() => () => clearTimeout(timer.current), []);
  const run = () => { clearTimeout(timer.current); setStep(0); setRunning(true); const tick = (i) => { setStep(i); if (i < PARTS.length) timer.current = setTimeout(() => tick(i + 1), 820); else setRunning(false); }; timer.current = setTimeout(() => tick(1), 350); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="2 daqiqalik taqdimot" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Avval kuzating'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(8px,1.4vw,13px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Demo Day taqdimoti <span className="italic" style={{ color: T.accent }}>qurilsa</span> — qanday bo'ladi?</h2></div>
        <Mentor>Ochilish → jonli demo → sodda texnika → yakun. Hammasi <b style={{ color: T.ink }}>2 daqiqada</b>. Tugmani bosib kuzating.</Mentor>
        <Zoomable>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {PARTS.map((s, i) => { const on = step > i; return (<React.Fragment key={s.key}><div style={{ display: 'flex', alignItems: 'center', gap: 11, background: T.paper, borderRadius: 11, padding: '9px 13px', opacity: on ? 1 : 0.4, boxShadow: on ? `0 7px 18px -10px rgba(${T.shadowBase},0.18)` : 'none', transition: 'all 0.45s' }}><IcoChip color={on ? s.color : T.ink3} soft={on ? s.color + '1c' : '#ECEAE5'} size={31}>{s.ic}</IcoChip><div style={{ minWidth: 0, flex: 1 }}><p style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: 13, color: on ? s.color : T.ink3, margin: 0 }}>{s.label}</p>{on && <p style={{ fontFamily: G, fontStyle: 'italic', fontSize: 12.5, color: T.ink2, margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: isMobile ? 'normal' : 'nowrap' }}>"{s.ex}"</p>}</div>{on && <span style={{ color: T.success }}>{Ico.check(15)}</span>}</div>{i < PARTS.length - 1 && <div style={{ display: 'flex', justifyContent: 'center', color: step > i + 1 ? T.success : T.ink3, transform: 'rotate(90deg)', lineHeight: 1, transition: 'color 0.3s' }}>{Ico.arrow(12)}</div>}</React.Fragment>); })}
        </div>
        <button className="btn" onClick={run} disabled={running} style={{ alignSelf: 'flex-start' }}>{running ? 'Qurilmoqda…' : (done ? '↻ Yana ko\'rish' : 'Taqdimotni qurish')}</button>
        {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana to'liq taqdimot: <b>ochilish → demo → texnika → yakun</b>. 2 daqiqada tayyor.</p></div>}
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — JARGON vs ANALOGIYA (compare) =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('simple');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['simple', 'jargon']) : new Set(['simple']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  const SIMPLE = LAYERS.map(l => ({ label: `${l.tech} = ${l.body}`, color: CODE.str, text: l.desc.split('.')[0] + '.' }));
  const JARGON = [{ label: 'JARGON', color: '#FFCB6B', text: 'Semantik HTML5 markup va DOM daraxti.' }, { label: 'JARGON', color: '#FFCB6B', text: 'Flexbox, media-query va CSS-selektorlar.' }, { label: 'JARGON', color: '#FFCB6B', text: 'Event-listener, callback va DOM-manipulyatsiya.' }];
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Jargon vs Analogiya" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Texnikani qaysi til bilan tushuntirsangiz <span className="italic" style={{ color: T.accent }}>tushunadilar</span>?</h2></div>
        <Mentor>Auditoriyada texnik bo'lmagan odamlar bor. Ikki xil tushuntirish — qaysini tanlaysiz?</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${v === 'simple' ? 'chip-on' : ''}`} onClick={() => set('simple')}>Sodda analogiya</button>
              <button className={`chip ${v === 'jargon' ? 'chip-on' : ''}`} onClick={() => set('jargon')}>Texnik jargon</button>
            </div>
            <div key={v}><SpecCard items={v === 'simple' ? SIMPLE : JARGON} minH={196} title={v === 'simple' ? 'Tana analogiyasi' : 'Texnik jargon'} icon={v === 'simple' ? p6.frame(15) : p6.bolt(15)} /></div>
          </Col>
          <Col>
            {v === 'simple'
              ? <div className="frame-success fade-step" key="s"><p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: T.success, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Hamma tushunadi</p><p className="body" style={{ margin: 0, color: T.ink }}>Skelet, teri, harakat — tanish so'zlar. Texnik bo'lmagan odam ham darrov tushunadi.</p></div>
              : <div className="frame-warn fade-step" key="j"><p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Hech kim tushunmaydi</p><p className="body" style={{ margin: 0, color: T.ink }}>DOM, flexbox, callback... auditoriya adashadi va qiziqishni yo'qotadi.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Aqlli ko'rinish uchun jargon ishlatmang — <b>tanish analogiya</b> bilan tushuntiring.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — MOSLASH: texnologiya ↔ tana qismi =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const NEEDS = [
    { id: 'js', text: 'Harakat — tugma bosilganda javob beradi' },
    { id: 'html', text: 'Skelet — sarlavha, tugma qayerda turishi' },
    { id: 'css', text: 'Teri — rang, shrift, chiroyli ko\'rinish' }
  ];
  const [sel, setSel] = useState(null);
  const [matched, setMatched] = useState(storedAnswer ? Object.fromEntries(LAYERS.map(l => [l.key, true])) : {});
  const [wrong, setWrong] = useState(null);
  const done = Object.keys(matched).length >= LAYERS.length;
  const pickT = (id) => { if (matched[id]) return; setSel(id); setWrong(null); };
  const pickN = (id) => { if (!sel) return; if (id === sel) { setMatched(prev => ({ ...prev, [sel]: true })); setSel(null); setWrong(null); } else setWrong(id); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cardBtn = (extra) => ({ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', border: 'none', borderRadius: 12, padding: '12px 14px', fontFamily: "'Manrope',sans-serif", fontWeight: 500, fontSize: 'clamp(13px,1.5vw,14.5px)', color: T.ink, transition: 'all 0.18s', ...extra });
  return (
    <Stage eyebrow="Moslash" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${Object.keys(matched).length}/${LAYERS.length} moslang`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(12px,2vw,18px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Har <span className="italic" style={{ color: T.accent }}>texnologiyani</span> tana qismi bilan ulang</h2></div>
        <Mentor>Avval <b style={{ color: T.ink }}>texnologiyani</b>, keyin uning <b style={{ color: T.ink }}>tana analogiyasini</b> bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Texnologiya</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {LAYERS.map(l => { const m = matched[l.key]; const on = sel === l.key; return (<button key={l.key} onClick={() => pickT(l.key)} disabled={m} style={cardBtn({ cursor: m ? 'default' : 'pointer', opacity: m ? 0.5 : 1, background: m ? T.successSoft : T.paper, boxShadow: on ? `inset 0 0 0 2px ${T.accent}, 0 8px 20px -7px rgba(255,79,40,0.22)` : `0 6px 16px -8px rgba(${T.shadowBase},0.16)` })}><span style={{ color: m ? T.success : l.color, display: 'inline-flex' }}>{m ? Ico.check(18) : l.ic}</span><span style={{ flex: 1, fontWeight: 700 }}>{l.tech}</span></button>); })}
            </div>
          </Col>
          <Col>
            <p className="flow-label">Tana / vazifa</p>
            <div className="fade-up delay-2" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {NEEDS.map(n => { const m = matched[n.id]; const isWrong = wrong === n.id; return (<button key={n.id} onClick={() => pickN(n.id)} disabled={m || !sel} className={isWrong ? 'shake-x' : ''} style={cardBtn({ cursor: (m || !sel) ? 'default' : 'pointer', opacity: m ? 0.5 : (!sel ? 0.65 : 1), background: m ? T.successSoft : (isWrong ? T.accentSoft : T.paper), boxShadow: `0 6px 16px -8px rgba(${T.shadowBase},0.16)` })}><span style={{ flex: 1 }}>{n.text}</span>{m && <span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(16)}</span>}</button>); })}
            </div>
            {wrong && !done && <p className="small" style={{ color: T.accent, margin: 0 }}>Bu boshqa texnologiya. Qaytadan urinib ko'ring.</p>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Zo'r! Endi saytingizni hech qanday jargon ishlatmasdan tushuntira olasiz.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 9 — TEST 3 =====
const Screen9 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 2-savol"
    questionText="Texnik bo'lmagan odamga saytingizni qanday tushuntirasiz?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Texnik bo'lmagan odamga saytingizni <span className="italic" style={{ color: T.accent }}>qanday</span> tushuntirasiz?</h2></>}
    options={['DOM, flexbox va event-listener atamalari bilan', 'Tanish analogiya bilan: skelet, teri, harakat', 'Imkon qadar ko\'p texnik atama ishlatib', 'Kodni qator-qator o\'qib berib']} correctIdx={1}
    explainCorrect="To'g'ri! Tanish analogiya (skelet/teri/harakat) — hamma tushunadi. Jargon esa auditoriyani adashtiradi."
    explainWrong={{ 0: 'DOM, flexbox — texnik jargon, hech kim tushunmaydi. Analogiya ishlating.', 2: 'Ko\'p atama — ko\'p chalkashlik. Sodda til kuchliroq.', 3: 'Kodni o\'qish zeriktiradi. Natijani analogiya bilan tushuntiring.', default: 'Tanish analogiya bilan tushuntiring — skelet, teri, harakat.' }} />
);

// ===== SCREEN 10 — ZAIF OCHILISHNI TUZATISH (debug + auditoriya) =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [found, setFound] = useState(!!storedAnswer);
  const [fixed, setFixed] = useState(!!storedAnswer);
  const done = fixed;
  const WEAK = 'Assalomu alaykum. Men bu saytni HTML, CSS va JavaScript ishlatib qildim.';
  const GOOD = PMETA.ochilish.ex;
  const lines = [
    { key: 'ochilish', label: 'Ochilish', color: T.honey },
    { key: 'demo', label: 'Jonli demo', color: T.accent },
    { key: 'texnika', label: 'Sodda texnika', color: T.blue },
    { key: 'yakun', label: 'Yakun', color: T.grape }
  ];
  const clickLine = (k) => { if (found || fixed) return; if (k === 'ochilish') setFound(true); };
  const fix = () => setFixed(true);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Tuzatish" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : (found ? 'Endi tuzating' : 'Zaif qatorni toping')} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bu pitchda <span className="italic" style={{ color: T.accent }}>ochilish</span> zaif — toping va tuzating</h2></div>
        <Mentor>Pitch yozilgan, lekin <b style={{ color: T.ink }}>ochilishi zaif</b> — texnik tafsilotdan boshlangan, "ha" oldirmaydi. Qaysi qator? O'sha qatorni bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="ai-card fade-up delay-1">
              <div className="ai-row"><span className="ai-badge">PITCH</span><span className="ai-bubble">Tekshiring:</span></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {lines.map(l => { const bad = found && !fixed && l.key === 'ochilish'; const isFix = fixed && l.key === 'ochilish'; const txt = l.key === 'ochilish' ? (fixed ? GOOD : WEAK) : PMETA[l.key].ex; return (<div key={l.key} onClick={() => clickLine(l.key)} style={{ cursor: (found || fixed) ? 'default' : 'pointer', display: 'flex', flexDirection: 'column', gap: 2, background: bad ? T.accentSoft : (isFix ? T.successSoft : T.bg), borderRadius: 10, padding: '9px 12px', boxShadow: bad ? `inset 0 0 0 1.5px ${T.accent}` : 'none', transition: 'all 0.18s' }}><span className="mono" style={{ fontSize: 9.5, fontWeight: 700, color: l.color, textTransform: 'uppercase' }}>{l.label}</span><span style={{ fontFamily: G, fontSize: 13, color: T.ink }}>"{txt}"</span></div>); })}
              </div>
              {found && !fixed && <button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={fix}>"Ha" oldiradigan ochilish bilan almashtirish</button>}
            </div>
          </Col>
          <Col>
            {!found && <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Eslang: ochilish <b>muammoni</b> aytib, "ha, menda ham bor" dedirishi kerak. Qaysi qator texnik faktdan boshlanyapti?</p></div>}
            {found && !fixed && <div className="frame-warn fade-step"><p className="note-h" style={{ color: T.accent }}>Topdingiz!</p><p className="body" style={{ margin: 0, color: T.ink }}>Ochilish "HTML, CSS, JavaScript ishlatdim" deb boshlanyapti — bu hech kimni qiziqtirmaydi. Muammoli savol bilan almashtiring.</p></div>}
            {fixed && <div className="frame" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: 11, alignItems: 'center' }}><p className="mono small" style={{ color: T.ink2, margin: 0 }}>AUDITORIYA</p><Audience nodding /><p className="small" style={{ margin: 0, textAlign: 'center', color: T.success, fontWeight: 600 }}>"Ha!" — endi bosh qimirlatishyapti 🎯</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — PITCH YIG'ISH (build) =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const POOL = {
    ochilish: { color: T.honey, a: 'Salom, men bir sayt qildim.', b: 'Sevimli rasmlaringizni do\'stlarga ko\'rsatish noqulay emasmi?' },
    demo: { color: T.accent, a: 'Saytimda like tugmasi bor.', b: 'Mana — like tugmasini bosaman, hisob ortdi. Jonli!' },
    texnika: { color: T.blue, a: 'DOM va event-listener ishlatdim.', b: 'Skelet — HTML, ko\'rinish — CSS, harakat — JS.' },
    yakun: { color: T.grape, a: 'Mana, xolos.', b: 'Rahmat! Savollaringiz bo\'lsa, javob beraman.' }
  };
  const KEYS = ['ochilish', 'demo', 'texnika', 'yakun'];
  const [pick, setPick] = useState(storedAnswer?.pick || {});
  const allGood = KEYS.every(k => pick[k] === 'b');
  const allPicked = KEYS.every(k => pick[k]);
  const workRef = useRef(null);
  const set = (k, v) => { if (allGood) return; setPick(prev => ({ ...prev, [k]: v })); };
  useEffect(() => {
    if (!allGood) return;
    if (storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true, pick });
    if (typeof window !== 'undefined' && window.innerWidth < 768 && workRef.current) { const el = workRef.current; setTimeout(() => { if (el) el.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 360); }
  }, [allGood]);
  const items = KEYS.map(k => ({ label: PMETA[k].label, color: POOL[k].color, text: pick[k] ? POOL[k][pick[k]] : '', ph: 'tanlanmagan…' }));
  return (
    <Stage eyebrow="Pitch yig'ish" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!allGood} label={allGood ? 'Davom etish' : (allPicked ? 'Eng kuchli gaplarni tanlang' : 'Har qismdan tanlang')} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Har qism uchun <span className="italic" style={{ color: T.accent }}>kuchliroq</span> gapni tanlang</h2></div>
        <Mentor>Har qism uchun ikkita variant — <b style={{ color: T.ink }}>jonli, sodda</b> gapni tanlang. O'ngda pitch-kartangiz to'ladi.</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable>
        <div className="split" ref={workRef}>
          <Col>
            {KEYS.map(k => (<div key={k}><p className="flow-label" style={{ margin: '0 0 6px', color: POOL[k].color }}>{PMETA[k].label}</p><div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>{['a', 'b'].map(v => { const on = pick[k] === v; return (<button key={v} onClick={() => set(k, v)} style={{ textAlign: 'left', border: 'none', cursor: 'pointer', borderRadius: 10, padding: '10px 13px', fontFamily: G, fontSize: 13, color: on ? '#fff' : T.ink, background: on ? POOL[k].color : T.paper, boxShadow: on ? `0 6px 14px -6px ${POOL[k].color}` : `0 5px 14px -8px rgba(${T.shadowBase},0.16)`, transition: 'all 0.16s' }}>"{POOL[k][v]}"</button>); })}</div></div>))}
          </Col>
          <Col>
            <p className="flow-label">Pitch-kartangiz</p>
            <SpecCard items={items} minH={200} title="Demo Day pitch" />
            {allGood && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana — kuchli Demo Day pitch! Jonli, sodda va ishonchli.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — TEST 4 =====
const Screen12 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="2 daqiqalik Demo Day pitchda eng ko'p vaqtni nimaga ajratasiz?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>2 daqiqada eng ko'p vaqt <span className="italic" style={{ color: T.accent }}>nimaga</span>?</h2></>}
    options={['Loyiha tarixini va qiyinchiliklarni aytishga', 'Muammoni aytish va saytni jonli ko\'rsatishga (demo)', 'Qaysi texnologiyalarni o\'rganganini sanashga', 'Uzoq tanishtirish va salomlashuvga']} correctIdx={1}
    explainCorrect="To'g'ri! Vaqtning katta qismi — muammo va jonli demoga. Auditoriya 'nega kerak' va 'ishlaydimi'ni ko'rishi shart."
    explainWrong={{ 0: 'Loyiha tarixi — auditoriyaga qiziq emas. Muammo va demoga vaqt bering.', 2: 'Texnologiyalar ro\'yxati zeriktiradi. Jonli demo kuchliroq.', 3: 'Uzoq salomlashuv vaqtni yeydi. Tezroq muammo va demoga o\'ting.', default: 'Eng ko\'p vaqt — muammo va jonli demoga.' }} />
);

// ===== SCREEN 13 — NAMUNA: to'liq Demo Day pitchi =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(PARTS.map(p => p.key)) : new Set());
  const isNarrow = useIsMobile(768);
  const [active, setActive] = useState(null);
  const done = seen.size >= PARTS.length;
  const tap = (k) => { setActive(k); setSeen(prev => { const n = new Set(prev); n.add(k); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Namuna" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Endi navbat sizga →' : `${seen.size}/4 qatorni oching`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Tayyor Demo Day pitchi: har qator <span className="italic" style={{ color: T.accent }}>nega</span> shunday?</h2></div>
        <Mentor>Mana to'liq Demo Day pitchi. Har qatorni bosib, nega aynan shunday ekanini ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {PARTS.map(s => { const open = seen.has(s.key); return (<button key={s.key} onClick={() => tap(s.key)} style={{ textAlign: 'left', cursor: 'pointer', border: 'none', borderRadius: 12, padding: '11px 14px', background: T.paper, display: 'flex', flexDirection: 'column', gap: 3, boxShadow: active === s.key ? `inset 0 0 0 2px ${s.color}, 0 8px 20px -8px ${s.color}44` : (open ? `inset 0 0 0 1px ${T.success}55` : `0 6px 16px -8px rgba(${T.shadowBase},0.16)`), transition: 'all 0.18s' }}><span style={{ display: 'flex', alignItems: 'center', gap: 9 }}><span style={{ color: s.color, display: 'inline-flex' }}>{s.ic}</span><span className="mono" style={{ fontSize: 10, fontWeight: 700, color: s.color, textTransform: 'uppercase' }}>{s.label}</span>{open && <span style={{ marginLeft: 'auto', color: T.success, display: 'inline-flex' }}>{Ico.check(13)}</span>}</span><span style={{ fontFamily: G, fontSize: 13, color: T.ink, fontStyle: 'italic' }}>"{s.ex}"</span></button>); })}
            </div>
          </Col>
          <Col>
            {active ? (<div className="sk-info fade-step" key={active}><span className="sk-tagbig"><span style={{ color: PMETA[active].color, display: 'inline-flex' }}>{PMETA[active].ic}</span><span className="sk-wordbadge" style={{ color: PMETA[active].color, background: PMETA[active].color + '1c' }}>{PMETA[active].label}</span></span><p className="body" style={{ color: T.ink, margin: '12px 0 0' }}>{PMETA[active].job}</p></div>) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Bir qatorni bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Har qator o'z vazifasini bajaradi. Endi o'zingizning Demo Day pitchingizni yozasiz.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — QOIDA =====
const Screen14 = ({ screen, onNext, onPrev }) => (
  <Stage eyebrow="Qoida" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Yakuniy ishga →" onClick={onNext} /></>}>
    <div className="screen">
      <div className="head"><h2 className="title h-title fade-up">Aytma — <span className="italic" style={{ color: T.accent }}>ko'rsat</span></h2></div>
      <Mentor>Jonli demo va sodda til <b style={{ color: T.ink }}>ishonch</b> beradi. "Men qildim" demang — <b style={{ color: T.ink }}>bosib ko'rsating</b>. Texnikani tanish analogiya bilan tushuntiring.</Mentor>
      <Zoomable>
      <div className="split">
        <Col>
          <div className="frame fade-up" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 'clamp(18px,2.6vw,26px)' }}>
            <IcoChip size={54} color={T.accent} soft={T.accentSoft}>{p6.play(28)}</IcoChip>
            <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, margin: 0, color: T.ink, fontSize: 'clamp(18px,2.4vw,22px)' }}>Demo = isbot</p><p className="body" style={{ margin: '3px 0 0', color: T.ink2 }}>Bir marta ko'rsatish — 100 marta aytishdan kuchli.</p></div>
          </div>
        </Col>
        <Col>
          <p className="flow-label">Demo Day taqdimoti — har doim</p>
          <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {PARTS.map((s, i) => (<React.Fragment key={s.key}><div style={{ display: 'flex', alignItems: 'center', gap: 11, background: T.paper, borderRadius: 11, padding: '10px 13px', boxShadow: `0 5px 14px -8px rgba(${T.shadowBase},0.16)` }}><span style={{ color: s.color, display: 'inline-flex' }}>{s.ic}</span><span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, color: T.ink, fontSize: 13.5 }}>{s.label}</span></div>{i < PARTS.length - 1 && <span style={{ color: T.ink3, textAlign: 'center', fontSize: 11 }}>↓</span>}</React.Fragment>))}
          </div>
        </Col>
      </div>
      </Zoomable>
    </div>
  </Stage>
);

// ===== SCREEN 15 — YAKUNIY: o'z Demo Day pitching + repetitsiya =====
const emptyPitch = () => ({ ochilish: '', demo: '', texnika: '', yakun: '' });
const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [pit, setPit] = useState(() => storedAnswer?.pitch || emptyPitch());
  const filled = PARTS.filter(p => pit[p.key] && pit[p.key].trim().length >= 3).length;
  const passed = filled >= 4;
  const prevPassed = useRef(false);
  const workRef = useRef(null);
  useEffect(() => {
    if (passed && !prevPassed.current) {
      prevPassed.current = true;
      onAnswer(screen, { correct: true, pitch: pit, stage: 'final', screenIdx: screen });
      if (typeof window !== 'undefined' && window.innerWidth < 768 && workRef.current) { const el = workRef.current; setTimeout(() => { if (el) el.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 360); }
    }
  }, [passed]);
  const upd = (k, v) => setPit(prev => ({ ...prev, [k]: v }));
  const items = PARTS.map(p => ({ label: p.label, color: p.color, text: pit[p.key], ph: p.ex }));
  return (
    <Stage eyebrow="Yakuniy ish" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!passed} label={passed ? 'Davom etish' : `To'ldiring (${filled}/4)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">O'z sayting uchun <span className="italic" style={{ color: T.accent }}>Demo Day pitchini</span> yoz</h2></div>
        <Mentor>To'rt qismni yozing: <b style={{ color: T.ink }}>ochilish, jonli demo, sodda texnika, yakun</b>. Keyin taymerni bosib, <b style={{ color: T.ink }}>ovoz chiqarib</b> mashq qiling.</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable>
        <div className="split" ref={workRef}>
          <Col>
            {PARTS.map(p => { const ok = pit[p.key] && pit[p.key].trim().length >= 3; return (<div key={p.key} style={{ background: T.paper, borderRadius: 12, padding: '11px 13px', boxShadow: ok ? `inset 0 0 0 1.5px ${T.success}, 0 6px 16px -9px rgba(31,122,77,0.16)` : `0 6px 16px -9px rgba(${T.shadowBase},0.16)`, transition: 'box-shadow 0.2s' }}><div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 6 }}><span style={{ color: ok ? T.success : p.color, display: 'inline-flex' }}>{ok ? Ico.check(15) : p.ic}</span><span className="mono" style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.05em', color: T.ink, textTransform: 'uppercase' }}>{p.label}</span></div><textarea value={pit[p.key]} onChange={e => upd(p.key, e.target.value)} placeholder={p.ex} rows={2} style={{ width: '100%', fontFamily: G, fontSize: 13.5, color: T.ink, background: T.bg, border: 'none', borderRadius: 9, padding: '8px 11px', resize: 'vertical', minHeight: 38, outline: 'none', lineHeight: 1.45, boxSizing: 'border-box' }} /></div>); })}
          </Col>
          <Col>
            <p className="flow-label">Pitch-kartangiz</p>
            <SpecCard items={items} minH={170} title="Demo Day pitch" />
            {passed && <RehearseTimer />}
            {passed && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Tayyor! Endi Demo Day'da shu pitch bilan saytingizni jonli taqdim qilasiz. 🎬</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — FINALE + DEMO DAY =====
const Screen16 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const RECAP = ['Aytma — ko\'rsat: jonli demo eng kuchli dalil', 'Texnikani sodda til bilan: skelet · teri · harakat', '4 qism: ochilish → demo → texnika → yakun', 'Auditoriyaga "ha" oldiradigan ochilish'];
  const HOMEWORK = [{ b: 'Saytingizni ochib qo\'ying', t: '— demo paytida tayyor tursin' }, { b: 'Pitchni 3 marta mashq qiling', t: '— oyna oldida, ovoz chiqarib, 2 daqiqada' }, { b: 'Demo Day\'da jonli ko\'rsating', t: '— bosing, ishlashini isbotlang!' }];
  const GLOSSARY = [{ b: 'Demo', t: '— mahsulotni jonli ko\'rsatish' }, { b: 'Show, don\'t tell', t: '— aytma, ko\'rsat' }, { b: 'Analogiya', t: '— tanish narsa bilan tushuntirish (skelet/teri/harakat)' }, { b: 'Auditoriya', t: '— oldida gapirayotgan odamlaringiz' }, { b: 'Demo Day', t: '— o\'z saytingizni taqdim qilish kuni' }];
  const correct = SCORED_IDX.filter(i => answers[i]?.correct).length;
  const total = SCORED_IDX.length;
  const PASSED = (total ? correct / total : 0) >= 0.6;
  const [open, setOpen] = useState(false);
  const glossRef = useRef(null);
  const isNarrow = useIsMobile(768);
  const toggleGloss = () => setOpen(o => { const nv = !o; if (nv && isNarrow) setTimeout(() => { if (glossRef.current) glossRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 80); return nv; });
  return (
    <Stage eyebrow="Demo Day'ga tayyor" screen={screen} navContent={<><NavBack onPrev={onPrev} /><button className="btn-ghost" onClick={onReset} style={{ padding: 'clamp(11px,1.6vw,13px) clamp(16px,2.2vw,22px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Qaytadan</button><button className="btn-white-accent" onClick={onFinish} style={{ marginLeft: 'auto', padding: 'clamp(11px,1.6vw,13px) clamp(22px,2.6vw,30px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Yakunlash</button></>}>
      <div className="screen">
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick" style={{ color: T.honey }}>{p6.medal(13)}</span> PM yo'nalishi tugadi!</span><h2 className="title h-title fade-up d1">Endi siz <span className="italic" style={{ color: T.accent }}>Demo Day</span>'ga to'liq tayyorsiz.</h2><p className="body h-sub fade-up d2">{PASSED ? 'Tabriklaymiz! 🎉 Saytingiz tayyor, pitchingiz tayyor. Jonli ko\'rsating, sodda tushuntiring va ishonch bilan chiqing. Omad!' : 'Yaxshi harakat! Bir-ikki joyni mustahkamlash uchun darsni qayta ko\'ring — keyin Demo Day!'}</p></div><ScoreRing correct={correct} total={total} /></div>
        <Zoomable>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(15)}</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck" style={{ display: 'inline-flex' }}>{Ico.check(15)}</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>Demo Day — oxirgi tayyorgarlik</div><p className="body" style={{ margin: '0 0 10px', color: T.ink }}>Chiqishdan oldin:</p><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">Saytingizni qurdingiz, fikrlashni o'rgandingiz — endi dunyoga ko'rsating! 🎬🚀</p></div>
        </div>
        </Zoomable>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function PmLesson6({ lang: langProp, onFinished }) {
  const lang = langProp || 'uz';
  const [screen, setScreen] = useState(0);
  const [answers, setAnswers] = useState({});
  const startTimeRef = useRef(Date.now());
  const next = () => setScreen(s => Math.min(s + 1, TOTAL_SCREENS - 1));
  const prev = () => setScreen(s => Math.max(s - 1, 0));
  const recordAnswer = (idx, data) => setAnswers(a => ({ ...a, [idx]: data }));
  const reset = () => { setAnswers({}); setScreen(0); startTimeRef.current = Date.now(); };

  const finishLesson = () => {
    const scoredMeta = SCREEN_META.filter(s => s.scored);
    const finalMeta = scoredMeta.filter(s => s.scope === 'final');
    const scoredAnswers = SCREEN_META.map((s, i) => (s.scored ? answers[i] : null)).filter(Boolean);
    const correctAnswers = scoredAnswers.filter(a => a.correct).length;
    const finalCorrect = SCREEN_META.map((s, i) => (s.scored && s.scope === 'final' ? answers[i] : null)).filter(Boolean).filter(a => a.correct).length;
    const payload = {
      lessonId: LESSON_META.lessonId, lessonTitle: LESSON_META.lessonTitle,
      durationSec: Math.floor((Date.now() - startTimeRef.current) / 1000),
      totalQuestions: scoredMeta.length, correctAnswers,
      scorePercent: scoredMeta.length ? Math.round((correctAnswers / scoredMeta.length) * 100) : 0,
      finalScore: finalCorrect, finalTotal: finalMeta.length,
      passed: finalMeta.length ? finalCorrect / finalMeta.length >= 0.6 : (scoredMeta.length ? correctAnswers / scoredMeta.length >= 0.6 : false),
      answers: SCREEN_META.map((_s, i) => answers[i]).filter(Boolean)
    };
    if (typeof onFinished === 'function') onFinished(payload);
  };

  const screens = [Screen0, Screen1, Screen2, Screen3, Screen4, Screen5, Screen5b, Screen6, Screen7, Screen8, Screen9, Screen10, Screen11, Screen12, Screen13, Screen14, Screen15, Screen16];
  const Current = screens[screen];
  return (
    <LangContext.Provider value={lang}>
      <style>{`
        /* PRODUCTION: shu @import OLIB TASHLANADI — shriftlarni LMS yuklaydi (platform_contract). */
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,500;0,8..60,600;1,8..60,500&family=Manrope:wght@300;400;500;600;700;800&family=Fraunces:opsz,wght@9..144,400&family=JetBrains+Mono:wght@400;500;700&display=swap');
        html, body { margin: 0; padding: 0; }
        .lesson-root, .lesson-root * { box-sizing: border-box; }
        .lesson-root { font-family: 'Manrope', system-ui, sans-serif; color: ${T.ink}; background: ${T.bg}; height: 100dvh; overflow: hidden; -webkit-font-smoothing: antialiased; font-feature-settings: "ss01","cv11"; }
        .lesson-root h1,.lesson-root h2,.lesson-root h3,.lesson-root h4,.lesson-root h5,.lesson-root h6,.lesson-root p,.lesson-root ul,.lesson-root ol { margin: 0; padding: 0; }

        .title { font-family: 'Source Serif 4', serif; font-weight: 600; line-height: 1.1; letter-spacing: -0.005em; }
        .italic { font-family: 'Source Serif 4', serif; font-style: italic; font-weight: 500; }
        .mono { font-family: 'JetBrains Mono', monospace; }

        @keyframes fade-in-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fade-in-up 0.45s cubic-bezier(.2,.7,.2,1) forwards; opacity: 0; }
        .delay-1 { animation-delay: 0.12s; } .delay-2 { animation-delay: 0.24s; } .delay-3 { animation-delay: 0.36s; } .delay-4 { animation-delay: 0.48s; }
        @keyframes fade-step { from { opacity: 0; transform: translateY(7px); } to { opacity: 1; transform: translateY(0); } }
        .fade-step { animation: fade-step 0.34s cubic-bezier(.2,.7,.2,1); }
        .zoomable { position: relative; }
        .zoom-btn { position: absolute; top: 6px; right: 6px; z-index: 5; width: 30px; height: 30px; border-radius: 8px; border: none; background: rgba(255,255,255,0.82); color: ${T.ink2}; font-size: 14px; line-height: 1; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px -4px rgba(${T.shadowBase},0.22); transition: all 0.2s; }
        .zoom-btn:hover { background: ${T.paper}; color: ${T.accent}; transform: scale(1.08); }
        .zoom-backdrop { position: fixed; inset: 0; background: rgba(14,14,16,0.55); z-index: 1000; animation: fade-step 0.25s ease; }
        .zoom-on { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%); width: min(880px,94vw); max-height: 90vh; overflow: auto; z-index: 1001; background: ${T.paper}; border-radius: 18px; padding: clamp(20px,4vw,42px); box-shadow: 0 30px 80px -20px rgba(${T.shadowBase},0.5); animation: zoom-pop 0.3s cubic-bezier(.34,1.3,.4,1); }
        @keyframes zoom-pop { from { opacity: 0; transform: translate(-50%,-50%) scale(0.93); } to { opacity: 1; transform: translate(-50%,-50%) scale(1); } }
        .d1 { animation-delay: 0.12s; } .d2 { animation-delay: 0.24s; } .d3 { animation-delay: 0.36s; } .d4 { animation-delay: 0.48s; }

        /* PM6 — jonli mini-sayt / auditoriya / qatlam */
        .mini-site { background: #fff; border-radius: 13px; overflow: hidden; box-shadow: 0 12px 30px -8px rgba(${T.shadowBase},0.2); }
        .ms-top { background: #f0eee8; padding: 8px 11px; display: flex; align-items: center; gap: 9px; }
        .ms-dots { display: flex; gap: 5px; } .ms-dots i { width: 9px; height: 9px; border-radius: 50%; }
        .ms-dots i:nth-child(1) { background: #ff5f57; } .ms-dots i:nth-child(2) { background: #febc2e; } .ms-dots i:nth-child(3) { background: #28c840; }
        .ms-url { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink2}; }
        .ms-body { padding: 14px; display: flex; flex-direction: column; gap: 10px; }
        .ms-head { display: flex; align-items: center; gap: 8px; }
        .ms-ava { width: 30px; height: 30px; border-radius: 50%; background: linear-gradient(135deg, ${T.accent}, ${T.honey}); flex-shrink: 0; }
        .ms-name { font-family: 'Manrope'; font-weight: 700; font-size: 13px; color: ${T.ink}; }
        .ms-img { height: 92px; border-radius: 10px; background: linear-gradient(135deg, ${T.blueSoft}, ${T.accentSoft}); display: flex; align-items: center; justify-content: center; font-size: 30px; }
        .ms-row { display: flex; align-items: center; gap: 10px; }
        .ms-like { display: inline-flex; align-items: center; gap: 7px; border: none; cursor: pointer; background: ${T.bg}; color: ${T.ink2}; padding: 8px 15px; border-radius: 99px; font-family: 'Manrope'; font-weight: 700; transition: all 0.18s; }
        .ms-like:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 14px -6px rgba(${T.shadowBase},0.3); }
        .ms-like:disabled { cursor: default; }
        .ms-like.on { color: ${T.accent}; background: ${T.accentSoft}; }
        .ms-like.pop { animation: like-pop 0.34s cubic-bezier(.2,.7,.2,1); }
        @keyframes like-pop { 0% { transform: scale(1); } 40% { transform: scale(1.28); } 100% { transform: scale(1); } }
        .ms-count { font-size: 13px; min-width: 10px; }
        .ms-cap { font-size: 12px; color: ${T.ink3}; font-style: italic; }
        .mini-site.skel .ms-ava { background: #E2E0DB; }
        .mini-site.skel .ms-img { background: #E2E0DB; }
        .mini-site.skel .ms-name { width: 64px; height: 11px; border-radius: 4px; background: #E2E0DB; }
        .mini-site.skel .ms-like { background: #E2E0DB; color: #C9C7C1; box-shadow: none; }
        @keyframes nod { 0%,100% { transform: translateY(0) rotate(0); } 50% { transform: translateY(4px) rotate(4deg); } }
        .nodder { animation: nod 0.9s ease-in-out infinite; }
        @keyframes veh-pop { 0% { transform: scale(.86) translateY(5px); opacity: 0; } 60% { transform: scale(1.03); } 100% { transform: scale(1); opacity: 1; } }
        .veh-pop { animation: veh-pop .4s cubic-bezier(.2,.7,.2,1); }
        @keyframes feat-pop { 0% { transform: scale(.82); opacity: 0; } 60% { transform: scale(1.05); } 100% { transform: scale(1); opacity: 1; } }
        .feat-pop { animation: feat-pop .34s cubic-bezier(.2,.7,.2,1); }
        @keyframes shake { 0%,100% { transform: none; } 20% { transform: translateX(-4px); } 40% { transform: translateX(4px); } 60% { transform: translateX(-3px); } 80% { transform: translateX(3px); } }
        .shake-x { animation: shake 0.42s; }

        .feedback-block { max-height: 0; opacity: 0; overflow: hidden; transition: max-height 0.4s ease-out, opacity 0.3s ease-out 0.1s, margin-top 0.4s ease-out; margin-top: 0; }
        .feedback-block.visible { max-height: 800px; opacity: 1; margin-top: clamp(14px,2vw,20px); }

        /* === KNOPKALAR === */
        .btn { font-family: 'Manrope', sans-serif; font-weight: 600; cursor: pointer; transition: all 0.2s; background: ${T.ink}; color: ${T.bg}; border: none; border-radius: 12px; letter-spacing: 0.01em; box-shadow: 0 6px 18px -4px rgba(${T.shadowBase},0.32); padding: clamp(11px,1.6vw,13px) clamp(20px,2.5vw,26px); font-size: clamp(13px,1.6vw,15px); }
        .btn:hover:not(:disabled) { background: ${T.accent}; box-shadow: 0 10px 24px -4px rgba(255,79,40,0.45); }
        .btn:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: none; }
        .btn-white-accent { font-family: 'Manrope', sans-serif; font-weight: 600; cursor: pointer; transition: all 0.2s; background: ${T.paper}; color: ${T.accent}; border: none; border-radius: 12px; letter-spacing: 0.01em; box-shadow: 0 8px 22px -4px rgba(255,79,40,0.35), 0 0 0 1px rgba(255,79,40,0.12); }
        .btn-white-accent:hover:not(:disabled) { background: ${T.accent}; color: #fff; box-shadow: 0 12px 28px -6px rgba(255,79,40,0.55); }
        .btn-white-accent:disabled { opacity: 0.45; cursor: not-allowed; box-shadow: 0 4px 12px -4px rgba(${T.shadowBase},0.14); }
        .btn-ghost { font-family: 'Manrope', sans-serif; font-weight: 600; cursor: pointer; transition: all 0.2s; background: transparent; color: ${T.ink}; border: none; border-radius: 12px; box-shadow: none; }
        .btn-ghost:hover:not(:disabled) { background: ${T.paper}; box-shadow: 0 6px 18px -6px rgba(${T.shadowBase},0.18); }
        .btn-ghost:disabled { opacity: 0.4; cursor: not-allowed; }
        .btn-soft { font-family: 'Manrope'; font-weight: 600; cursor: pointer; transition: all 0.2s; background: ${T.bg}; color: ${T.ink}; border: none; border-radius: 10px; padding: 9px 15px; font-size: 13px; }
        .btn-soft:hover:not(:disabled) { box-shadow: 0 6px 14px -5px rgba(${T.shadowBase},0.2); }

        /* === OPSIYALAR === */
        .option { background: ${T.paper}; cursor: pointer; transition: all 0.2s; font-family: 'Manrope', sans-serif; font-weight: 500; text-align: left; border-radius: 12px; width: 100%; border: none; color: ${T.ink}; box-shadow: 0 6px 16px -7px rgba(${T.shadowBase},0.16); }
        .option:hover:not(:disabled) { background: #FDFBF7; transform: translateY(-1px); box-shadow: 0 12px 24px -8px rgba(${T.shadowBase},0.22); }
        .option:disabled { cursor: default; }
        .option-correct { background: ${T.successSoft} !important; color: ${T.success} !important; box-shadow: 0 8px 22px -8px rgba(31,122,77,0.32) !important; }
        .option-wrong { background: ${T.paper} !important; color: ${T.ink3} !important; opacity: 0.5 !important; box-shadow: none !important; }
        .option-picked-wrong { background: ${T.accentSoft} !important; color: ${T.accent} !important; box-shadow: 0 8px 22px -8px rgba(255,79,40,0.34) !important; }

        .chip { font-family: 'Manrope', sans-serif; font-weight: 600; font-size: clamp(13px,1.6vw,15px); display: inline-flex; align-items: center; gap: 7px; padding: 9px 16px; border-radius: 99px; border: none; background: ${T.paper}; color: ${T.ink}; cursor: pointer; transition: all 0.18s; box-shadow: 0 4px 12px -6px rgba(${T.shadowBase},0.2); }
        .chip:hover:not(:disabled) { transform: translateY(-1px); }
        .chip-on { background: ${T.accent}; color: #fff; box-shadow: 0 6px 16px -5px rgba(255,79,40,0.4); }

        /* === MENTOR === */
        .mentor { display: flex; gap: 12px; align-items: flex-start; }
        .mentor-ava { width: 40px; height: 40px; border-radius: 50%; overflow: hidden; flex-shrink: 0; background: ${T.accentSoft}; box-shadow: 0 4px 12px -4px rgba(${T.shadowBase},0.28); }
        .mentor-ava img { display: block; width: 100%; height: 100%; object-fit: contain; transform: scale(1.12); }
        .mentor-col { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5px; }
        .mentor-name { font-family: 'Manrope', sans-serif; font-weight: 700; font-size: 13px; color: ${T.accent}; letter-spacing: 0.01em; }
        .mentor-msg { background: ${T.paper}; border-radius: 4px 14px 14px 14px; padding: 13px 16px; color: ${T.ink}; box-shadow: 0 6px 18px -7px rgba(${T.shadowBase},0.16); }

        /* === HOOK OPSIYALARI === */
        .hook-option { display: flex; align-items: center; gap: 13px; width: 100%; text-align: left; background: ${T.paper}; border: none; border-radius: 12px; padding: clamp(13px,1.9vw,16px) clamp(15px,2.2vw,18px); font-family: 'Manrope', sans-serif; font-weight: 500; font-size: clamp(14px,1.7vw,16px); color: ${T.ink}; cursor: pointer; transition: all 0.18s; box-shadow: 0 6px 16px -7px rgba(${T.shadowBase},0.16); }
        .hook-option:hover:not(:disabled):not(.on) { transform: translateY(-1px); box-shadow: 0 12px 24px -8px rgba(${T.shadowBase},0.22); }
        .hook-option.on { background: ${T.accentSoft}; color: ${T.accent}; box-shadow: 0 8px 22px -8px rgba(255,79,40,0.3), inset 0 0 0 1.5px ${T.accent}; }
        .hook-option:disabled { cursor: default; }
        .hook-option .radio { width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0; box-shadow: inset 0 0 0 2px ${T.ink3}; display: inline-flex; align-items: center; justify-content: center; transition: all 0.18s; }
        .hook-option.on .radio { box-shadow: inset 0 0 0 2px ${T.accent}; }
        .radio-dot { width: 10px; height: 10px; border-radius: 50%; background: ${T.accent}; }
        .hook-ack { margin: 2px 0 0; font-family: 'Manrope', sans-serif; font-weight: 500; font-size: clamp(13px,1.5vw,14.5px); color: ${T.ink2}; }

        .h-title { font-size: clamp(22px,4vw,38px); }
        .h-sub { font-size: clamp(17px,2.5vw,22px); }
        .body { font-size: clamp(14px,1.6vw,16px); line-height: 1.5; }
        .eyebrow { font-size: clamp(11px,1.3vw,12px); letter-spacing: 0.18em; text-transform: uppercase; font-weight: 600; }
        .small { font-size: clamp(12.5px,1.4vw,13.5px); }
        .flow-label { font-family: 'Manrope'; font-weight: 700; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: ${T.ink2}; }
        .demo-swap { animation: fade-step 0.34s cubic-bezier(.2,.7,.2,1); }

        /* === STAGE === */
        .stage { max-width: 936px; margin: 0 auto; height: 100dvh; display: flex; flex-direction: column; }
        .stage-header { flex-shrink: 0; background: ${T.bg}; padding-top: clamp(12px,2vw,18px); padding-bottom: clamp(8px,1.5vw,12px); }
        .stage-content { flex: 1; min-height: 0; padding-top: clamp(10px,1.7vw,16px); padding-bottom: clamp(17px,3.4vw,34px); display: flex; flex-direction: column; overflow-y: auto; overflow-x: hidden; -webkit-overflow-scrolling: touch; scroll-behavior: smooth; }
        .stage-content.narrow { max-width: 680px; width: 100%; margin: 0 auto; }
        .stage-nav { flex-shrink: 0; background: ${T.bg}; border-top: 1px solid rgba(167,166,162,0.25); padding-top: clamp(12px,2vw,15px); padding-bottom: clamp(12px,2vw,15px); display: flex; gap: 12px; align-items: center; }
        .chrome { display: flex; align-items: center; justify-content: space-between; }
        .chrome-left { display: flex; align-items: center; gap: 10px; color: ${T.ink2}; }
        .dot { width: 7px; height: 7px; border-radius: 50%; background: ${T.accent}; box-shadow: 0 0 8px rgba(255,79,40,0.55); }
        .progress-track { height: 3px; background: rgba(167,166,162,0.25); width: 100%; margin-bottom: 12px; border-radius: 99px; }
        .progress-bar { height: 100%; background: ${T.accent}; transition: width 0.5s cubic-bezier(.4,0,.2,1); border-radius: 99px; box-shadow: 0 0 10px rgba(255,79,40,0.55), 0 0 3px rgba(255,79,40,0.4); }

        /* === FRAME === */
        .frame { background: ${T.paper}; border-radius: 16px; padding: clamp(16px,3vw,24px); border: none; box-shadow: 0 8px 22px -7px rgba(${T.shadowBase},0.14); }
        .frame-soft { background: ${T.accentSoft}; border-left: 4px solid ${T.accent}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); box-shadow: 0 6px 16px -8px rgba(255,79,40,0.22); }
        .frame-success { background: ${T.successSoft}; border-left: 4px solid ${T.success}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); box-shadow: 0 6px 16px -8px rgba(31,122,77,0.22); }
        .frame-warn { background: ${T.accentSoft}; border-left: 4px solid ${T.accent}; border-radius: 12px; padding: 12px 15px; }
        .frame-dash { border: 1.5px dashed ${T.ink3}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); }

        /* === SPEC CARD (qora) === */
        .spec-card { background: ${CODE.bg}; border-radius: 14px; padding: 16px 17px; box-shadow: 0 12px 30px -10px rgba(${T.shadowBase},0.3); display: flex; flex-direction: column; gap: 12px; }
        .spec-head { display: flex; align-items: center; gap: 8px; padding-bottom: 9px; border-bottom: 1px solid #ffffff18; }
        .spec-title { font-family: 'JetBrains Mono'; font-size: 10.5px; letter-spacing: 0.12em; text-transform: uppercase; color: #9FB4D8; }
        .spec-lbl { font-family: 'JetBrains Mono'; font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; }
        .spec-text { font-family: 'Georgia, serif'; font-size: clamp(13px,1.7vw,15px); line-height: 1.5; margin: 3px 0 0; }

        /* === LAYOUT === */
        .screen { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: clamp(14px,2vw,20px); }
        .head { display: flex; flex-direction: column; gap: 6px; }
        .split { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: clamp(18px,3vw,36px); align-items: start; }
        .col { display: flex; flex-direction: column; gap: clamp(12px,2vw,16px); min-width: 0; }
        @media (max-width: 760px) { .split { grid-template-columns: 1fr; gap: clamp(14px,3vw,20px); } }

        /* === ROADMAP === */
        .roadmap { display: flex; flex-direction: column; gap: 8px; list-style: none; }
        .step-card { display: flex; align-items: center; gap: 14px; background: ${T.paper}; border-radius: 12px; padding: 13px 16px; box-shadow: 0 5px 14px -7px rgba(${T.shadowBase},0.16); }
        .step-num { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 13px; color: ${T.accent}; flex-shrink: 0; }
        .step-body { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .step-text { font-weight: 500; font-size: clamp(14px,1.7vw,16px); color: ${T.ink}; }
        .step-tag { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink2}; background: ${T.bg}; padding: 3px 8px; border-radius: 6px; }

        /* === SK-INFO === */
        .sk-info { background: ${T.paper}; border-radius: 12px; padding: 16px 18px; box-shadow: 0 8px 20px -8px rgba(${T.shadowBase},0.16); animation: fade-step 0.34s; }
        .sk-tagbig { display: flex; align-items: center; gap: 9px; flex-wrap: wrap; }
        .sk-wordbadge { font-family: 'Manrope'; font-weight: 700; font-size: 13px; color: ${T.accent}; background: ${T.accentSoft}; padding: 4px 10px; border-radius: 6px; }
        .hint { background: ${T.bg}; border: 1.5px dashed ${T.ink3}; border-radius: 12px; padding: 14px 16px; font-size: clamp(13px,1.5vw,14px); color: ${T.ink2}; }

        /* === AI CARD === */
        .ai-card { background: ${T.paper}; border-radius: 14px; padding: 15px 17px; display: flex; flex-direction: column; gap: 11px; box-shadow: 0 8px 20px -8px rgba(${T.shadowBase},0.14); }
        .ai-row { display: flex; align-items: center; gap: 9px; } .ai-badge { font-family: 'Manrope'; font-weight: 800; font-size: 11px; color: #fff; background: ${T.blue}; padding: 3px 9px; border-radius: 6px; } .ai-bubble { font-size: 13px; color: ${T.ink2}; }
        .note-h { font-weight: 700; font-size: 13px; margin: 0 0 4px; }

        /* === YAKUN === */
        .hero { display: flex; align-items: center; justify-content: space-between; gap: 24px; flex-wrap: wrap; }
        .hero-l { flex: 1; min-width: 240px; display: flex; flex-direction: column; gap: 8px; }
        .done-chip { display: inline-flex; align-items: center; gap: 7px; align-self: flex-start; font-family: 'Manrope'; font-weight: 700; font-size: 12px; color: ${T.success}; background: ${T.successSoft}; padding: 5px 12px; border-radius: 99px; } .done-chip .tick { display: inline-flex; }
        .ring-wrap { position: relative; width: 128px; height: 128px; flex-shrink: 0; }
        .ring-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .ring-num { font-family: 'Fraunces', serif; font-size: 30px; font-weight: 400; line-height: 1; } .ring-den { color: ${T.ink3}; font-size: 20px; } .ring-lbl { font-size: 10px; color: ${T.ink2}; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 3px; }
        .card { background: ${T.paper}; border-radius: 16px; padding: 18px 20px; box-shadow: 0 8px 22px -7px rgba(${T.shadowBase},0.14); }
        .card-lbl { display: flex; align-items: center; gap: 8px; font-family: 'Manrope'; font-weight: 700; font-size: 13px; margin-bottom: 11px; }
        .recap { display: flex; flex-direction: column; gap: 8px; list-style: none; } .recap li { display: flex; align-items: flex-start; gap: 10px; font-size: clamp(13px,1.6vw,15px); color: ${T.ink}; animation: fade-in-up 0.4s ease-out forwards; opacity: 0; } .recap .ck { color: ${T.success}; flex-shrink: 0; margin-top: 1px; }
        .hw ul { display: flex; flex-direction: column; gap: 6px; list-style: none; } .hw li { font-size: clamp(13px,1.6vw,15px); color: ${T.ink}; } .hw li b { color: ${T.accent}; } .hw .t { color: ${T.ink2}; } .hw-note { margin: 11px 0 0; font-size: 12px; color: ${T.accent}; font-weight: 600; }
        .gloss { background: ${T.paper}; border-radius: 12px; box-shadow: 0 6px 16px -7px rgba(${T.shadowBase},0.12); overflow: hidden; }
        .gloss-head { display: flex; align-items: center; justify-content: space-between; padding: 13px 17px; cursor: pointer; } .gloss-head .lbl { font-family: 'Manrope'; font-weight: 700; font-size: 13px; color: ${T.ink}; } .gloss-toggle { font-size: 18px; color: ${T.ink2}; }
        .gloss-body { padding: 0 17px 15px; font-size: clamp(12.5px,1.5vw,14px); color: ${T.ink2}; line-height: 1.7; animation: fade-step 0.3s; } .gloss-body b { color: ${T.ink}; }

        /* MOBIL: yig'iladigan Mentor */
        .mentor-mob .mentor-msg { overflow: hidden; max-height: 360px; transition: max-height 0.38s cubic-bezier(.4,0,.2,1), opacity 0.25s ease, padding 0.38s ease, box-shadow 0.3s ease; }
        .mentor-mob.is-collapsed { align-items: center; cursor: pointer; }
        .mentor-mob.is-collapsed .mentor-col { gap: 0; }
        .mentor-mob.is-collapsed .mentor-msg { max-height: 0; opacity: 0; padding-top: 0; padding-bottom: 0; box-shadow: none; }
        .mentor-cue { font-family: 'Manrope'; font-weight: 600; font-size: 11px; color: ${T.accent}; letter-spacing: 0.01em; }
      `}</style>
      <div className="lesson-root">
        <Current screen={screen} storedAnswer={answers[screen]} answers={answers} onAnswer={recordAnswer} onNext={next} onPrev={prev} onReset={reset} onFinish={finishLesson} />
      </div>
    </LangContext.Provider>
  );
}
