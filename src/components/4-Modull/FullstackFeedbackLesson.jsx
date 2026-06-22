import React, { useState, useEffect, useRef, createContext, useContext, useCallback, useMemo } from 'react';
import mentorImg from '../../assets/common/mentor.png';

// ============================================================
// MA'LUMOT VA BACKEND MODULI · PRAKTIKA 4 — FEEDBACK BILAN YAXSHILASH: AVTOSTOYANKA UPGRADE — PLATFORM STANDARD v16 (AUDIOSIZ)
// O'RNI: 4-Modul oxiri (P3 — Loyiha kuni'dan KEYIN). Butun modul va praktikalar zanjirining YAKUNI.
//        O'quvchi biladi: backend CRUD (P1), fullstack ulash (P2), bog'lanish+JOIN+loyiha kuni (P3), PM/UX.
// Mavzu: P3'dagi AvtoStoyanka panelini sinfdoshlarga ko'rsatib, FIKR yig'ib, tartib bilan YAXSHILASH (upgrade).
// YANGI KO'NIKMA: mahsulotni yaxshilash sikli — qur → ko'rsat → fikr ol → sarala (Impact/Effort) → upgrade → qayta test. (PM)
// UPGRADE'lar (user tanladi): (1) chiqishda tasdiq (2) dashboard bo'sh/band/tushum (3) Settings narx (UPDATE) (4) Settings joylar soni.
// PEDAGOGIKA: dasturchi o'z ishiga yaqin — foydalanuvchi fikri kamchilikni ochadi. "sehr" yo'q. AUDIOSIZ. Sarlavhalar = qiziqarli savol.
// SIFAT: javob aralashtirish (placeCorrect), har amalda mobil avtoscroll, mentor mobil yig'iladi.
// Yakuniy ekran (s16): mock VS Code — chiqishda tasdiq (confirm) yozish.
// PRODUCTION: <style> ichidagi @import OLIB TASHLANADI — shriftlarni LMS yuklaydi.
// ============================================================

const T = {
  bg: '#F6F4EF', ink: '#0E0E10', ink2: '#5A5A60', ink3: '#A7A6A2',
  paper: '#FFFFFF', accent: '#FF4F28', accentSoft: '#FFE8E1', accentVivid: '#FF4F28',
  success: '#1F7A4D', successSoft: '#E3F0E8', blue: '#019ACB', blueSoft: '#E2F4FA', link: '#1a56db',
  danger: '#C2362B', dangerSoft: '#FAE3E0', amber: '#B45309',
  shadowBase: '58, 53, 48'
};
const CODE = { bg: '#1A2436', text: '#E8E5DD', tag: '#FF7755', attr: '#FFD380', str: '#7DD181', comment: '#6B7585', punct: '#9FB4D8' };

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

const LESSON_META = { lessonId: 'fullstack-feedback-p4-v16', lessonTitle: { uz: 'Praktika: Feedback bilan yaxshilash — AvtoStoyanka', ru: 'Практика: Доработка по фидбеку — AvtoStoyanka' } };
const SCREEN_META = [
  { id: 's0',  type: 'hook',        template: 'custom',   scored: false, scope: 'hook' },
  { id: 's1',  type: 'rule',        template: 'custom',   scored: false, scope: null },
  { id: 's2',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's3',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's4',  type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's5',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's6',  type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's7',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's8',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's9',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's10', type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's11', type: 'case',        template: 'custom',   scored: false, scope: null },
  { id: 's12', type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's13', type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's14', type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's15', type: 'rule',        template: 'custom',   scored: false, scope: null },
  { id: 's16', type: 'test',        template: 'custom',   scored: true,  scope: 'final' },
  { id: 's17', type: 'summary',     template: 'custom',   scored: false, scope: null }
];
const TOTAL_SCREENS = SCREEN_META.length;
const SCORED_IDX = SCREEN_META.map((m, i) => (m.scored ? i : null)).filter(i => i !== null);

const Split = ({ children }) => <div className="split">{children}</div>;
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
const Col = ({ children, gap }) => <div className="col" style={gap ? { gap } : undefined}>{children}</div>;

const Stage = ({ children, eyebrow, screen, totalScreens = TOTAL_SCREENS, navContent, narrow, mentorStatic, scrollSignal }) => {
  const isMobile = useIsMobile();
  const isNarrow = useIsMobile(768);
  const collapseOn = isNarrow && !mentorStatic;
  const padH = isMobile ? 12 : 100;
  const [mCollapsed, setMCollapsed] = useState(false);
  const contentRef = useRef(null);
  useEffect(() => { setMCollapsed(false); }, [screen]);
  useEffect(() => {
    if (!scrollSignal || !isNarrow) return;
    const el = contentRef.current;
    if (!el) return;
    const t = setTimeout(() => { if (el) el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' }); }, 240);
    return () => clearTimeout(t);
  }, [scrollSignal, isNarrow]);
  const setCollapsed = useCallback((v) => {
    setMCollapsed(v);
    if (v === false && contentRef.current) { const el = contentRef.current; requestAnimationFrame(() => { if (el) el.scrollTo({ top: 0, behavior: 'auto' }); }); }
  }, []);
  const onContentClick = (e) => {
    if (!collapseOn || mCollapsed) return;
    const tgt = e.target;
    if (tgt && tgt.closest && tgt.closest('.mentor')) return;
    setMCollapsed(true);
    const isControl = tgt && tgt.closest && tgt.closest('button, input, a, .vcard, .option, .hook-option, .spot, .fb');
    if (!isControl) {
      const el = contentRef.current;
      if (el) setTimeout(() => { if (el) el.scrollTo({ top: 0, behavior: 'smooth' }); }, 80);
    }
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

function placeCorrect(n, correctIdx, screen) {
  const others = [];
  for (let i = 0; i < n; i++) if (i !== correctIdx) others.push(i);
  let seed = ((screen + 7) * 48271) % 2147483647;
  const rnd = () => { seed = (seed * 48271) % 2147483647; return seed / 2147483647; };
  for (let i = others.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = others[i]; others[i] = others[j]; others[j] = t; }
  const pos = n > 1 ? 1 + (screen % (n - 1)) : 0;
  const out = []; let oi = 0;
  for (let p = 0; p < n; p++) out.push(p === pos ? correctIdx : others[oi++]);
  return out;
}
const QuestionScreen = ({ screen, idx, scope, eyebrow, question, questionText, options, correctIdx, explainCorrect, explainWrong, storedAnswer, onAnswer, onNext, onPrev }) => {
  const order = useMemo(() => placeCorrect(options.length, correctIdx, screen), [options.length, correctIdx, screen]);
  const dispOptions = order.map(i => options[i]);
  const dispCorrect = order.indexOf(correctIdx);
  const [picked, setPicked] = useState(storedAnswer?.lastPicked ?? storedAnswer?.picked ?? null);
  const [solved, setSolved] = useState(storedAnswer ? (storedAnswer.solved ?? (storedAnswer.picked === dispCorrect)) : false);
  const firstCorrectRef = useRef(storedAnswer ? (storedAnswer.firstAttemptCorrect ?? storedAnswer.correct ?? null) : null);
  const pick = (i) => {
    if (solved) return;
    setPicked(i);
    const isCorrect = i === dispCorrect;
    if (firstCorrectRef.current === null) firstCorrectRef.current = isCorrect;
    if (isCorrect) setSolved(true);
    onAnswer(screen, { stage: scope, screenIdx: screen, question: questionText, options: dispOptions, correctIndex: dispCorrect, correctAnswer: dispOptions[dispCorrect], picked: i, studentAnswerIndex: i, studentAnswer: dispOptions[i], correct: firstCorrectRef.current, firstAttemptCorrect: firstCorrectRef.current, solved: isCorrect, lastPicked: i });
  };
  return (
    <Stage eyebrow={eyebrow} screen={screen} narrow navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!solved} label={solved ? 'Davom etish' : "To'g'ri javobni toping"} onClick={onNext} /></>}>
      <div className="screen" style={{ justifyContent: 'center', gap: 'clamp(16px,2.5vw,24px)' }}>
        <div className="fade-up">{question}</div>
        <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {dispOptions.map((opt, i) => {
            let cls = 'option';
            if (solved) { if (i === dispCorrect) cls += ' option-correct'; else cls += ' option-wrong'; }
            else if (i === picked) cls += ' option-picked-wrong';
            return (
              <button key={i} className={cls} disabled={solved} onClick={() => pick(i)} style={{ padding: 'clamp(12px,1.8vw,16px) clamp(14px,2.2vw,20px)', fontSize: 'clamp(14px,1.7vw,16px)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="mono small" style={{ minWidth: 20, color: solved && i === dispCorrect ? T.success : T.ink3 }}>{String.fromCharCode(65 + i)}</span>
                <span style={{ flex: 1 }}>{opt}</span>
              </button>
            );
          })}
        </div>
        <FeedbackBlock show={picked !== null} isCorrect={solved}>
          <p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: solved ? T.success : T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{solved ? "To'g'ri" : "Qaytadan urinib ko'ring"}</p>
          <p className="body" style={{ margin: 0 }}>{solved ? explainCorrect : (explainWrong[order[picked]] ?? explainWrong.default)}</p>
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

// ===== MENTOR =====
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

// ===== KOD RANGLARI =====
const Jx = ({ children }) => <span style={{ color: CODE.tag }}>{children}</span>;
const Cm = ({ children }) => <span style={{ color: CODE.comment, fontStyle: 'italic' }}>{children}</span>;

// ===== AVTOSTOYANKA =====
const sp = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const mkSpots = (busy = { 2: '01A123BC', 5: '01B456DE' }, count = 8) => {
  const labels = [];
  for (let i = 0; i < count; i++) { const row = String.fromCharCode(65 + Math.floor(i / 4)); labels.push(row + (i % 4 + 1)); }
  return labels.map((raqam, i) => { const id = i + 1; return busy[id] ? { id, raqam, bandmi: true, mashina: busy[id] } : { id, raqam, bandmi: false, mashina: null }; });
};

// Qorovul paneli — yangilanadigan (tushum, statlar) bilan
const Spot = ({ spot, onClick, flash, dim, small }) => (
  <button className={`spot ${spot.bandmi ? 'busy' : 'free'} ${flash ? 'spot-flash' : ''} ${small ? 'spot-sm' : ''}`} onClick={onClick} disabled={!onClick} style={{ opacity: dim ? 0.45 : 1, cursor: onClick ? 'pointer' : 'default' }}>
    <span className="spot-tag" style={{ background: spot.bandmi ? T.danger : T.success }}>{spot.bandmi ? 'BAND' : "BO'SH"}</span>
    <span className="spot-ico">{spot.bandmi ? '🚗' : '⬚'}</span>
    <span className="spot-num">{spot.raqam}</span>
    {!small && spot.bandmi && spot.mashina && <span className="spot-plate">{spot.mashina}</span>}
  </button>
);
const GuardPanel = ({ spots, onSpotClick, tushum, dash, cols = 4, flashId, onSettings }) => {
  const band = spots.filter(s => s.bandmi).length;
  const bosh = spots.length - band;
  const small = spots.length > 12;
  return (
    <div className="guard">
      <div className="guard-top">
        <span className="guard-title">🅿️ AvtoStoyanka <small>· qorovul paneli</small></span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {!dash && <span className="guard-stats"><span className="gst free">🟩 {bosh}</span><span className="gst busy">🟥 {band}</span></span>}
          {onSettings && <button className="gear" onClick={onSettings} title="Sozlamalar">⚙︎</button>}
        </span>
      </div>
      {dash && (
        <div className="dash">
          <div className="dash-card"><span className="dash-num" style={{ color: T.success }}>{bosh}</span><span className="dash-lbl">🟩 Bo'sh</span></div>
          <div className="dash-card"><span className="dash-num" style={{ color: T.danger }}>{band}</span><span className="dash-lbl">🟥 Band</span></div>
          <div className="dash-card"><span className="dash-num" style={{ color: T.ink }}>{sp(tushum || 0)}</span><span className="dash-lbl">💰 Tushum</span></div>
        </div>
      )}
      <div className="guard-body">
        <div className="pgrid" style={{ gridTemplateColumns: `repeat(${cols},1fr)` }}>{spots.map(s => <Spot key={s.id} spot={s} onClick={onSpotClick ? () => onSpotClick(s) : undefined} flash={flashId === s.id} small={small} />)}</div>
      </div>
      {!dash && tushum != null && <div className="guard-foot"><span>Bugungi tushum: <b>{sp(tushum)} so'm</b></span></div>}
    </div>
  );
};

// rangli harf-avatar (zamonaviy ko'rinish)
const Ava = ({ name, color, sm }) => (
  <span className={`ava ${sm ? 'ava-sm' : ''}`} style={{ background: color }}>{name.charAt(0)}</span>
);
// feedback kartasi
const FbCard = ({ fb, onClick, on, seen }) => (
  <button className={`fb ${on ? 'fb-on' : ''}`} onClick={onClick} disabled={!onClick}>
    <Ava name={fb.who} color={fb.color} />
    <span className="fb-col"><span className="fb-who">{fb.who}</span><span className="fb-text">"{fb.text}"</span></span>
    {seen !== undefined && <span className="fb-seen" style={{ color: seen ? T.success : T.ink3 }}>{seen ? '✓' : ''}</span>}
  </button>
);

// sinfdosh fikrlari (4 ta)
const FEEDBACK = [
  { id: 'f1', who: 'Aziz', color: '#E05A2B', short: 'Tasdiq', text: "Band joyni bosgan zahoti chiqib ketdi — 'rostdanmi?' deb so'ramadi", quad: 'Q1' },
  { id: 'f2', who: 'Laylo', color: '#019ACB', short: 'Dashboard', text: "Nechta joy bo'sh, nechtasi band — darrov ko'rinmadi", quad: 'Q1' },
  { id: 'f3', who: 'Bek', color: '#B45309', short: 'Narx', text: "Narx 10 000 da qotib qolgan — o'zgartirib bo'lmaydi", quad: 'Q2' },
  { id: 'f4', who: 'Diana', color: '#1F7A4D', short: 'Joylar', text: "Stoyanka kattalashdi — 8 joy yetmaydi", quad: 'Q3' }
];

// yondan ochiladigan Sozlamalar paneli (drawer)
const SettingsDrawer = ({ open, narx, setNarx, count, setCount, onSave, onClose, dirty }) => {
  if (!open) return null;
  return (
    <>
      <div className="drawer-bd" onClick={onClose} />
      <div className="drawer">
        <div className="drawer-top"><span className="drawer-title">⚙︎ Sozlamalar</span><button className="drawer-x" onClick={onClose}>✕</button></div>
        <p className="set-lbl">Soatlik narx (so'm)</p>
        <input className="set-input" value={narx} onChange={e => setNarx(e.target.value.replace(/[^0-9]/g, ''))} inputMode="numeric" />
        <p className="set-lbl" style={{ marginTop: 13 }}>Joylar soni</p>
        <div style={{ display: 'flex', gap: 7, marginTop: 8 }}>
          {[8, 12, 20].map(n => <button key={n} className="btn-soft" onClick={() => setCount(n)} style={count === n ? { boxShadow: `inset 0 0 0 1.5px ${T.accent}`, color: T.accent, background: T.accentSoft } : undefined}>{n}</button>)}
        </div>
        <button className="btn" disabled={!dirty} onClick={onSave} style={{ marginTop: 15, width: '100%' }}>💾 Saqlash</button>
      </div>
    </>
  );
};
const QUAD = {
  Q1: { lbl: '⭐ Avval shu', sub: 'ko\'p foyda · kam mehnat', color: T.success },
  Q2: { lbl: 'Rejaga ol', sub: 'ko\'p foyda · ko\'p mehnat', color: T.amber },
  Q3: { lbl: 'Oson, keyin', sub: 'kam foyda · kam mehnat', color: T.blue },
  Q4: { lbl: 'Shart emas', sub: 'kam foyda · ko\'p mehnat', color: T.ink3 }
};

// ===== SCREEN 0 — HOOK (Demo Day: tasdiqsiz chiqarish) =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [spots, setSpots] = useState(mkSpots());
  const [tried, setTried] = useState(!!storedAnswer);
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const [sc, setSc] = useState(0);
  const oops = (s) => { if (!s.bandmi) return; setSpots(prev => prev.map(x => x.id === s.id ? { ...x, bandmi: false, mashina: null } : x)); setTried(true); setSc(n => n + 1); };
  const OPTS = [
    { id: 'a', label: "Hech narsa — panel zo'r" },
    { id: 'b', label: "Foydalanuvchidan fikr olib, yaxshilash kerak" },
    { id: 'c', label: "Panelni o'chirib tashlash" }
  ];
  const pick = (v) => { if (picked !== null || !tried) return; setPicked(v); setSc(n => n + 1); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: true }); };
  return (
    <Stage eyebrow="Demo Day · kirish" screen={screen} scrollSignal={sc} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 880 }}>Siz qurdingiz — lekin u boshqaga <span className="italic" style={{ color: T.accent }}>qulaymi</span>?</h1>
        <Mentor>Demo Day: sinfdoshingiz <b style={{ color: T.ink }}>Aziz</b> panelni sinab ko'ryapti. Band joyni bossa nima bo'larkin? Bitta <b style={{ color: T.ink }}>band (🟥)</b> joyni bosib ko'ring — Azizning o'rnida.</Mentor>
        <Zoomable>
        <Split>
          <Col>
            <p className="flow-label fade-up delay-1">Aziz panelni sinayapti</p>
            <div className="fade-up delay-1"><GuardPanel spots={spots} onSpotClick={oops} /></div>
            {tried && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>😳 Aziz: <i>"Voy! Shoshib bosdim — joy darrov bo'shab ketdi, 'rostdanmi?' ham demadi. To'lovni ham yozmadim shekilli..."</i></p></div>}
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Panel tayyor edi — endi nima qilamiz?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => {
                const on = picked === o.id;
                return (
                  <button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null || !tried} style={{ opacity: !tried ? 0.55 : 1 }} onClick={() => pick(o.id)}>
                    <span className="radio">{on && <span className="radio-dot" />}</span>
                    <span>{o.label}</span>
                  </button>
                );
              })}
            </div>
            {!tried && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>Avval band joyni bosib ko'ring ←</p>}
            {picked !== null && <p className="hook-ack fade-step">To'g'ri! Biz o'z ishimizga juda yaqinmiz — kamchilikni ko'rmaymiz. Aziz bir bosishda topdi. Bugun <b>sinfdoshlardan fikr yig'ib</b>, panelni tartib bilan <b>yaxshilaymiz</b> (upgrade).</p>}
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
    { text: 'Ko\'rsatamiz — Demo Day', tag: 'PM' },
    { text: 'Fikr yig\'amiz — aniq', tag: 'feedback' },
    { text: 'Saralaymiz — qaysi avval', tag: 'Foyda / Mehnat' },
    { text: 'Upgrade qilamiz + qayta test', tag: 'AI bilan' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const PreviewBlock = (
    <Col>
      <p className="flow-label">Dars oxirida — yangilangan panel</p>
      <GuardPanel spots={mkSpots()} tushum={20000} dash />
      <p className="mono small" style={{ color: T.accent, margin: 0 }}>→ tasdiq · dashboard · sozlamalar (narx, joylar soni)</p>
    </Col>
  );
  const StepsBlock = (
    <Col>
      <p className="flow-label">Yaxshilash sikli</p>
      <ol className="roadmap">
        {STEPS.map((s, i) => (<li key={i} className="step-card fade-up" style={{ animationDelay: `${0.08 + i * 0.05}s` }}><span className="step-num">{String(i + 1).padStart(2, '0')}</span><span className="step-body"><span className="step-text">{s.text}</span>{s.tag && <span className="step-tag">{s.tag}</span>}</span></li>))}
      </ol>
    </Col>
  );
  return (
    <Stage eyebrow="Reja" screen={screen} mentorStatic scrollSignal={showSteps} navContent={<><NavBack onPrev={onPrev} /><NavNext label="Boshlaymiz →" onClick={onNext} /></>}>
      <div className="screen">
        <div className="head"><h2 className="title h-title fade-up">Tayyor ilovani <span className="italic" style={{ color: T.accent }}>qanday</span> yaxshilaymiz?</h2></div>
        <Mentor>Yaxshi dasturchi shunchaki qurmaydi — <b style={{ color: T.ink }}>ko'rsatadi, fikr oladi va yaxshilaydi</b>. Bugun aynan shu siklni o'tamiz: panelni Demo qilamiz, sinfdosh fikrlarini yig'amiz, eng muhimini tanlaymiz va AI bilan upgrade qilamiz.</Mentor>
        {!isNarrow ? (
          <Zoomable><Split>{PreviewBlock}{StepsBlock}</Split></Zoomable>
        ) : !showSteps ? (
          <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>
            {PreviewBlock}
            <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>Siklning 4 qadamini ko'rish</button>
          </div>
        ) : (
          <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>
            <button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ Natijani ko'rish</button>
            {StepsBlock}
          </div>
        )}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — YAXSHI vs UMUMIY FIKR =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const SAMPLES = [
    { id: 'a', text: 'Zo\'r ekan, menga yoqdi! 👍', good: false, why: "Umumiy maqtov — nimani yaxshilashni aytmaydi." },
    { id: 'b', text: 'Band joyni bosganda tasdiq so\'ramadi', good: true, why: "Aniq muammo — to'g'ridan-to'g'ri tuzatsa bo'ladi." },
    { id: 'c', text: 'Hmm, bilmadim, normalga o\'xshaydi', good: false, why: "Noaniq — hech qanday yo'nalish bermaydi." },
    { id: 'd', text: 'Nechta joy bo\'shligi darrov ko\'rinmaydi', good: true, why: "Aniq — qanday yaxshilashni ko'rsatadi." }
  ];
  const [ans, setAns] = useState(storedAnswer ? Object.fromEntries(SAMPLES.map(s => [s.id, s.good])) : {});
  const [sc, setSc] = useState(0);
  const done = Object.keys(ans).length >= SAMPLES.length;
  const mark = (s, val) => { if (ans[s.id] !== undefined) return; setAns(prev => ({ ...prev, [s.id]: val })); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="PM · fikr" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Har fikrni baholang"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Qanday fikr foydali — <span className="italic" style={{ color: T.accent }}>"zo'r"</span>mi yoki aniqmi?</h2></div>
        <Mentor>"Zo'r ekan!" — yoqimli, lekin <b style={{ color: T.ink }}>nima qilishni</b> aytmaydi. Foydali fikr — <b style={{ color: T.ink }}>aniq</b> va <b style={{ color: T.ink }}>amalga oshsa bo'ladigan</b>. Har fikrni baholang: foydalimi yoki umumiy?</Mentor>
        <Zoomable>
        <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {SAMPLES.map(s => {
            const a = ans[s.id];
            return (
              <div key={s.id} className="frame" style={{ padding: '12px 14px', boxShadow: a === undefined ? undefined : `inset 0 0 0 1.5px ${a === s.good ? T.success : T.accent}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span className="body" style={{ flex: 1, minWidth: 180, color: T.ink }}>"{s.text}"</span>
                  {a === undefined
                    ? <span style={{ display: 'flex', gap: 6 }}><button className="btn-soft" onClick={() => mark(s, true)}>👍 Foydali</button><button className="btn-soft" onClick={() => mark(s, false)}>👎 Umumiy</button></span>
                    : <span className="tagpill" style={{ color: s.good ? T.success : T.ink3 }}>{s.good ? '👍 Foydali' : '👎 Umumiy'}</span>}
                </div>
                {a !== undefined && <p className="small fade-step" style={{ margin: '8px 0 0', color: a === s.good ? T.success : T.accent }}>{a === s.good ? '✓ ' : '✗ '}{s.why}</p>}
              </div>
            );
          })}
        </div>
        {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Endi bilasiz: foydali fikr — aniq muammoni ko'rsatadi. Shunday fikrlarni yig'amiz.</p></div>}
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — 4 FIKRNI YIG'ISH =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(FEEDBACK.map(f => f.id)) : new Set());
  const [active, setActive] = useState(null);
  const [sc, setSc] = useState(0);
  const done = seen.size >= FEEDBACK.length;
  const tap = (f) => { setActive(f.id); setSc(n => n + 1); setSeen(prev => { const s = new Set(prev); s.add(f.id); return s; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = FEEDBACK.find(f => f.id === active);
  return (
    <Stage eyebrow="Fikr yig'ish" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Fikrlarni o'qing (${seen.size}/4)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Sinfdoshlar <span className="italic" style={{ color: T.accent }}>nima dedi</span>?</h2></div>
        <Mentor>Demo Day'da to'rt kishi panelni sinadi va aniq fikr berdi. Har birini bosib o'qing — bular bizning <b style={{ color: T.ink }}>yaxshilash ro'yxatimiz</b>.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {FEEDBACK.map(f => <FbCard key={f.id} fb={f} onClick={() => tap(f)} on={active === f.id} seen={seen.has(f.id)} />)}
            </div>
          </Col>
          <Col>
            <p className="flow-label">Tanlangan fikr</p>
            {cur
              ? <div className="frame fade-step" key={active}><div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}><Ava name={cur.who} color={cur.color} /><span className="fb-who">{cur.who}</span></div><p className="body" style={{ margin: 0, color: T.ink }}>"{cur.text}"</p><p className="small mono" style={{ margin: '9px 0 0', color: T.accent }}>→ yechim: {cur.short}</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Fikrni bosib o'qing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>4 ta aniq fikr yig'ildi. Lekin hammasini birdan qilib bo'lmaydi — qaysi birini avval qilamiz? Saralaymiz.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 =====
const Screen4 = (props) => (
  <QuestionScreen {...props} idx={4} scope="module-mikro" eyebrow="Mashq · 1-savol"
    questionText="Qaysi fikr eng foydali?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Qaysi fikr <span className="italic" style={{ color: T.accent }}>eng foydali</span>?</h2></>}
    options={['"Chiqishda tasdiq yo\'q" — aniq muammo', '"Umuman zo\'r!" — maqtov', '"Bilmadim, normal" — noaniq', '"Rangi chiroyli ekan" — bezak haqida']} correctIdx={0}
    explainCorrect="To'g'ri! Aniq, amalga oshsa bo'ladigan fikr — eng foydalisi. U to'g'ridan-to'g'ri nimani tuzatishni ko'rsatadi."
    explainWrong={{
      1: "Maqtov yoqimli, lekin nimani yaxshilashni aytmaydi. Foydali fikr — aniq.",
      2: "Noaniq fikr yo'nalish bermaydi. Foydali fikr — aniq muammoni ko'rsatadi.",
      3: "Bezak haqidagi fikr ham bor, lekin eng foydalisi — aniq ishlash muammosini ko'rsatgani.",
      default: "Eng foydali fikr — aniq va amalga oshsa bo'ladigan."
    }} />
);

// ===== SCREEN 5 — IMPACT / EFFORT MATRITSA =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [placed, setPlaced] = useState(storedAnswer ? new Set(FEEDBACK.map(f => f.id)) : new Set());
  const [sc, setSc] = useState(0);
  const done = placed.size >= FEEDBACK.length;
  const place = (f) => { if (placed.has(f.id)) return; setPlaced(prev => { const s = new Set(prev); s.add(f.id); return s; }); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const unplaced = FEEDBACK.filter(f => !placed.has(f.id));
  return (
    <Stage eyebrow="Saralash" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Fikrlarni joylang (${placed.size}/4)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Avval <span className="italic" style={{ color: T.accent }}>qaysi birini</span> qilamiz?</h2></div>
        <Mentor>Hammasini birdan qilib bo'lmaydi. PM hiylasi — <b style={{ color: T.ink }}>Foyda / Mehnat</b> jadvali: ko'p foyda beradigan, kam mehnat talab qiladiganini <b style={{ color: T.ink }}>avval</b> qilamiz. Har fikrni bosing — o'z katagiga joylashadi.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Joylanmagan fikrlar</p>
            {unplaced.length
              ? <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>{unplaced.map(f => <button key={f.id} className="vcard" onClick={() => place(f)}><Ava name={f.who} color={f.color} sm /><span className="vlbl">{f.short}</span><span className="small" style={{ color: T.ink3, marginLeft: 'auto' }}>joylash →</span></button>)}</div>
              : <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Hammasi joylandi! <b style={{ color: T.success }}>⭐ Avval shu</b> katagidagilar — <b>Tasdiq</b> va <b>Dashboard</b> — ko'p foyda, kam mehnat. Shulardan boshlaymiz.</p></div>}
          </Col>
          <Col>
            <p className="flow-label">Foyda / Mehnat jadvali</p>
            <div className="mx-head"><span /><span className="mx-cap">Kam mehnat</span><span className="mx-cap">Ko'p mehnat</span></div>
            <div className="mx-grid">
              <span className="mx-rowcap">Ko'p<br />foyda</span>
              {['Q1', 'Q2'].map(q => (
                <div key={q} className="quad" style={{ boxShadow: `inset 0 0 0 1.5px ${QUAD[q].color}44` }}>
                  <span className="quad-lbl" style={{ color: QUAD[q].color }}>{QUAD[q].lbl}</span>
                  <div className="quad-items">{FEEDBACK.filter(f => f.quad === q && placed.has(f.id)).map(f => <span key={f.id} className="quad-chip el-in" style={{ background: QUAD[q].color }}>{f.short}</span>)}</div>
                </div>
              ))}
              <span className="mx-rowcap">Kam<br />foyda</span>
              {['Q3', 'Q4'].map(q => (
                <div key={q} className="quad" style={{ boxShadow: `inset 0 0 0 1.5px ${QUAD[q].color}44` }}>
                  <span className="quad-lbl" style={{ color: QUAD[q].color }}>{QUAD[q].lbl}</span>
                  <div className="quad-items">{FEEDBACK.filter(f => f.quad === q && placed.has(f.id)).map(f => <span key={f.id} className="quad-chip el-in" style={{ background: QUAD[q].color }}>{f.short}</span>)}</div>
                </div>
              ))}
            </div>
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 6 — TEST 2 =====
const Screen6 = (props) => (
  <QuestionScreen {...props} idx={6} scope="module-mikro" eyebrow="Mashq · 2-savol"
    questionText="Avval qaysi tuzatishni qilish kerak?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Avval <span className="italic" style={{ color: T.accent }}>qaysi</span> tuzatishni qilamiz?</h2></>}
    options={['Ko\'p foyda + kam mehnat beradiganini', 'Eng qiyinini — qiziqroq', 'Kam foyda beradiganini', 'Tasodifan tanlaganini']} correctIdx={0}
    explainCorrect="To'g'ri! Ko'p foyda + kam mehnat = eng aqlli boshlanish. Tez natija, katta yaxshilanish (bizda — tasdiq va dashboard)."
    explainWrong={{
      1: "Qiyin ish ko'p vaqt oladi, natija kech ko'rinadi. Avval — ko'p foyda + kam mehnat.",
      2: "Kam foyda beradiganidan boshlash — vaqtni behuda sarflash. Avval foydalisini.",
      3: "Tasodif emas — tartib bilan: ko'p foyda + kam mehnat avval.",
      default: "Avval — ko'p foyda + kam mehnat."
    }} />
);

// ===== SCREEN 7 — UPGRADE 1: CHIQISHDA TASDIQ =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [spots, setSpots] = useState(mkSpots());
  const [asking, setAsking] = useState(null);
  const [built, setBuilt] = useState(!!storedAnswer);
  const [didConfirm, setDidConfirm] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = built && didConfirm;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const clickSpot = (s) => { if (!built || !s.bandmi) return; setAsking(s); setSc(n => n + 1); };
  const confirmExit = () => { setSpots(prev => prev.map(x => x.id === asking.id ? { ...x, bandmi: false, mashina: null } : x)); setAsking(null); setDidConfirm(true); setSc(n => n + 1); };
  return (
    <Stage eyebrow="Upgrade 1 · tasdiq" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : (built ? "Band joyni chiqarib ko'ring" : "Tasdiqni qo'shing")} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Tasodifiy chiqarishni qanday <span className="italic" style={{ color: T.accent }}>to'xtatamiz</span>?</h2></div>
        <Mentor>Birinchi upgrade — <b style={{ color: T.ink }}>chiqishda tasdiq</b>. Endi chiqarishdan oldin "Rostdan chiqarilsinmi?" deb so'raydi. AI'ga buyruq beramiz, keyin o'zingiz sinaysiz.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Agentga prompt</p>
            <pre className="prompt-box fade-up delay-1">{`Chiqarishdan oldin tasdiq so'rasin:
"Rostdan chiqarilsinmi?" → Ha bo'lsa chiqarsin,
Bekor bo'lsa hech narsa o'zgarmasin.`}</pre>
            {!built
              ? <button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={() => { setBuilt(true); setSc(n => n + 1); }}>📤 AI'ga yuborish</button>
              : <div className="ai-card fade-step"><div className="ai-row"><span className="ai-badge">AI</span><span className="ai-bubble">Tasdiq qo'shildi:</span></div><div className="ai-code"><div className="ai-line ok" style={{ cursor: 'default', whiteSpace: 'pre-wrap' }}>{"function chiqar(id){\n  if(confirm('Rostdan chiqarilsinmi?')){\n    // PUT /api/sessiyalar/:id\n  }\n}"}</div></div></div>}
            {built && !didConfirm && <p className="small" style={{ color: T.accent, fontStyle: 'italic', margin: 0 }}>Endi o'ngdagi band joyni bosing — tasdiq chiqadi.</p>}
          </Col>
          <Col>
            <p className="flow-label">Yangilangan panel</p>
            <GuardPanel spots={spots} onSpotClick={built ? clickSpot : undefined} />
            {asking && (
              <div className="frame fade-step" style={{ boxShadow: `inset 0 0 0 1.5px ${T.danger}, 0 8px 22px -6px rgba(${T.shadowBase},0.2)` }}>
                <p className="note-h" style={{ color: T.danger }}>Rostdan chiqarilsinmi?</p>
                <p className="body" style={{ margin: '0 0 11px', color: T.ink }}>{asking.raqam} ({asking.mashina}) chiqariladi va to'lov yoziladi.</p>
                <div style={{ display: 'flex', gap: 9 }}>
                  <button className="btn-soft" onClick={() => { setAsking(null); setSc(n => n + 1); }}>Bekor</button>
                  <button className="btn" style={{ background: T.success }} onClick={confirmExit}>Ha, chiqarilsin</button>
                </div>
              </div>
            )}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Endi tasodifiy chiqarish yo'q — panel avval so'raydi. Aziz topgan muammo hal bo'ldi!</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — UPGRADE 2: DASHBOARD =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [on, setOn] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = on;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Upgrade 2 · dashboard" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Dashboardni yoqing"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Qorovul holatni <span className="italic" style={{ color: T.accent }}>bir qarashda</span> ko'rsinmi?</h2></div>
        <Mentor>Laylo: "nechta bo'sh, nechta band — darrov ko'rinmadi". Yechim — <b style={{ color: T.ink }}>dashboard</b>: yuqorida yirik raqamlar bilan bo'sh, band va kunlik tushum. Tugmani bosib, eski va yangi ko'rinishni solishtiring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">{on ? 'Yangi — dashboard bilan' : 'Eski — kichik sanagich'}</p>
            <GuardPanel spots={mkSpots()} tushum={30000} dash={on} />
          </Col>
          <Col>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={on} onClick={() => { setOn(true); setSc(n => n + 1); }}>{on ? '✓ Dashboard yoqildi' : '▶ Dashboardni yoqish'}</button>
            <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>🟩 bo'sh va 🟥 band soni — yirik, ranglar bilan.</p></div>
            <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>💰 kunlik tushum ham darrov ko'rinadi.</p></div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Endi qorovul boshini ko'tarib, bir soniyada hammasini ko'radi. Laylo ham mamnun!</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 9 — UPGRADE 3: REJISSYOR — SOZLAMALAR PANELINI AI QO'SHADI =====
const SET_PROMPT = `Panelga ⚙ "Sozlamalar" tugmasi qo'sh.
Bosilsa — yondan panel ochilsin:
• narxni o'zgartirish
• joylar sonini tanlash (8 / 12 / 20)
"Saqlash"da panel darrov yangilansin.`;
const Screen9 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [built, setBuilt] = useState(!!storedAnswer);
  const [opened, setOpened] = useState(!!storedAnswer);
  const [drawer, setDrawer] = useState(false);
  const [narx, setNarx] = useState('10000');
  const [count, setCount] = useState(8);
  const [sc, setSc] = useState(0);
  const done = built && opened;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const open = () => { setDrawer(true); setOpened(true); setSc(n => n + 1); };
  return (
    <Stage eyebrow="Upgrade 3 · REJISSYOR" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : (built ? "⚙ ni bosib oching" : "Promptni AI'ga bering")} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Qorovul nimani istasa <span className="italic" style={{ color: T.accent }}>o'zi sozlasin</span> — qanday qilamiz?</h2></div>
        <Mentor>Bek va Diana: narx va joylar soni qotib qolgan. Yechim — <b style={{ color: T.ink }}>yonda ochiladigan Sozlamalar paneli</b>: qorovul narx va joylar sonini o'zi o'zgartiradi. Buni AI'ga aniq prompt berib qo'shamiz — keyin o'zingiz ochib ko'rasiz.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Agentga prompt</p>
            <pre className="prompt-box fade-up delay-1">{SET_PROMPT}</pre>
            {!built
              ? <button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={() => { setBuilt(true); setSc(n => n + 1); }}>📤 Promptni AI'ga yuborish</button>
              : <div className="ai-card fade-step"><div className="ai-row"><span className="ai-badge">AI</span><span className="ai-bubble">⚙ Sozlamalar paneli qo'shildi:</span></div><div className="ai-code"><div className="ai-line ok" style={{ cursor: 'default', whiteSpace: 'pre-wrap' }}>{"const [show,setShow]=useState(false);\n<button onClick={()=>setShow(true)}>⚙ Sozlamalar</button>\n{show && <Drawer narx={narx} joylar={count} onSave={saqla}/>}\n// saqla: UPDATE sozlamalar + joylar"}</div></div></div>}
          </Col>
          <Col>
            <p className="flow-label">{built ? 'Natija — ⚙ ni bosib ko\'ring' : 'Natija'}</p>
            <div style={{ position: 'relative' }}>
              <GuardPanel spots={mkSpots()} tushum={20000} dash onSettings={built ? open : undefined} />
              <SettingsDrawer open={drawer} narx={narx} setNarx={setNarx} count={count} setCount={setCount} dirty onSave={() => setDrawer(false)} onClose={() => setDrawer(false)} />
            </div>
            {!built && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>Prompt yuborilgach, panelda ⚙ paydo bo'ladi.</p>}
            {built && !opened && <p className="small" style={{ color: T.accent, fontStyle: 'italic', margin: 0 }}>Yuqori o'ngdagi ⚙ ni bosing — panel yondan ochiladi.</p>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana yonda ochiladigan Sozlamalar! Endi narx va joylar sonini shu panelda boshqarasiz — keyingi qadamda sinab ko'ramiz.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 10 — TEST 3 =====
const Screen10 = (props) => (
  <QuestionScreen {...props} idx={10} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="Mavjud narxni o'zgartirish uchun qaysi SQL amali?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Mavjud narxni <span className="italic" style={{ color: T.accent }}>o'zgartirish</span> uchun?</h2></>}
    options={['UPDATE — mavjud qatorni o\'zgartirish', 'INSERT — yangi qator qo\'shish', 'DELETE — o\'chirish', 'SELECT — o\'qish']} correctIdx={0}
    explainCorrect="To'g'ri! Narx allaqachon bor — uni o'zgartiramiz, yangi qator qo'shmaymiz. Mavjudni o'zgartirish = UPDATE."
    explainWrong={{
      1: "INSERT yangi qator qo'shadi — bizda narx bor, uni o'zgartiramiz: UPDATE.",
      2: "DELETE o'chiradi. Narxni o'zgartirish — UPDATE.",
      3: "SELECT faqat o'qiydi. O'zgartirish uchun UPDATE.",
      default: "Mavjudni o'zgartirish = UPDATE."
    }} />
);

// ===== SCREEN 11 — CASE · SOZLAMALARNI O'ZINGIZ ISHLATING (drawer) =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [drawer, setDrawer] = useState(false);
  const [narx, setNarx] = useState('10000');
  const [savedNarx, setSavedNarx] = useState(storedAnswer ? 15000 : 10000);
  const [count, setCount] = useState(storedAnswer ? 12 : 8);
  const [applied, setApplied] = useState(storedAnswer ? 12 : 8);
  const [changed, setChanged] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = changed;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const dirty = (parseInt(narx, 10) || 0) !== savedNarx || count !== applied;
  const save = () => { const v = parseInt(narx, 10) || savedNarx; setSavedNarx(v); setApplied(count); setDrawer(false); setChanged(true); setSc(n => n + 1); };
  const spots = mkSpots({ 2: '01A123BC', 5: '01B456DE' }, applied);
  const cols = applied > 12 ? 5 : 4;
  return (
    <Stage eyebrow="Sozlamalar · amaliyot" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "⚙ ni ochib, sozlab saqlang"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Endi o'zingiz — narx va joylarni <span className="italic" style={{ color: T.accent }}>sozlang</span>.</h2></div>
        <Mentor>Paneldagi <b style={{ color: T.ink }}>⚙</b> ni bosing — yondan Sozlamalar ochiladi. <b style={{ color: T.ink }}>Narxni</b> o'zgartiring (mas. 15 000), <b style={{ color: T.ink }}>joylar sonini</b> ko'paytiring (12), so'ng <b style={{ color: T.ink }}>Saqlash</b>. Panel darrov yangilanadi — bu bazada <span className="mono">UPDATE</span>.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Joriy sozlamalar</p>
            <div className="frame" style={{ padding: 15 }}>
              <div className="set-row" style={{ borderBottom: `1px solid ${T.bg}`, paddingBottom: 9 }}><span className="set-lbl">Soatlik narx</span><span className="set-val">{sp(savedNarx)} so'm</span></div>
              <div className="set-row" style={{ paddingTop: 9 }}><span className="set-lbl">Joylar soni</span><span className="set-val">{applied} ta</span></div>
            </div>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              <span className="tagpill" style={{ color: savedNarx !== 10000 ? T.success : T.ink3 }}>{savedNarx !== 10000 ? '✓' : '○'} Narx o'zgardi</span>
              <span className="tagpill" style={{ color: applied !== 8 ? T.success : T.ink3 }}>{applied !== 8 ? '✓' : '○'} Joylar ko'paydi</span>
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Sozlamalar saqlandi! Kod o'zgarmadi — qorovul panelni o'zi boshqardi. Ilova endi <b>sozlanadigan</b> va <b>o'sib boradigan</b>.</p></div>}
          </Col>
          <Col>
            <p className="flow-label">Panel — {applied} joy · {sp(savedNarx)} so'm</p>
            <div style={{ position: 'relative' }}>
              <GuardPanel spots={spots} tushum={30000} dash cols={cols} onSettings={() => setDrawer(true)} />
              <SettingsDrawer open={drawer} narx={narx} setNarx={setNarx} count={count} setCount={setCount} dirty={dirty} onSave={save} onClose={() => setDrawer(false)} />
            </div>
            {!drawer && !done && <p className="small" style={{ color: T.accent, fontStyle: 'italic', margin: 0 }}>Yuqori o'ngdagi ⚙ ni bosing →</p>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — TO'LIQ YANGILANGAN PANEL (sinash) =====
const Screen12 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [spots, setSpots] = useState(mkSpots({ 2: '01A123BC', 5: '01B456DE' }, 12));
  const [asking, setAsking] = useState(null);
  const [tushum, setTushum] = useState(0);
  const [acts, setActs] = useState(storedAnswer ? 2 : 0);
  const [sc, setSc] = useState(0);
  const done = acts >= 2;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const click = (s) => { if (s.bandmi) { setAsking(s); setSc(n => n + 1); } };
  const confirmExit = () => { setSpots(prev => prev.map(x => x.id === asking.id ? { ...x, bandmi: false, mashina: null } : x)); setTushum(t => t + 15000); setAsking(null); setActs(a => a + 1); setSc(n => n + 1); };
  return (
    <Stage eyebrow="Qayta test" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Bandlarni tasdiq bilan chiqaring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Yangilangan panel — endi <span className="italic" style={{ color: T.accent }}>qanday ishlaydi</span>?</h2></div>
        <Mentor>Hamma upgrade bir joyda: <b style={{ color: T.ink }}>dashboard</b>, <b style={{ color: T.ink }}>12 joy</b>, narx <b style={{ color: T.ink }}>15 000</b>, va <b style={{ color: T.ink }}>tasdiq</b>. Band joylarni chiqarib ko'ring — endi avval so'raydi, tushum yangi narxda o'sadi.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Yangilangan qorovul paneli</p>
            <GuardPanel spots={spots} onSpotClick={click} tushum={tushum} dash cols={4} />
          </Col>
          <Col>
            {asking
              ? <div className="frame fade-step" style={{ boxShadow: `inset 0 0 0 1.5px ${T.danger}` }}>
                <p className="note-h" style={{ color: T.danger }}>Rostdan chiqarilsinmi?</p>
                <p className="body" style={{ margin: '0 0 11px', color: T.ink }}>{asking.raqam} ({asking.mashina}) — to'lov {sp(15000)} so'm.</p>
                <div style={{ display: 'flex', gap: 9 }}><button className="btn-soft" onClick={() => { setAsking(null); setSc(n => n + 1); }}>Bekor</button><button className="btn" style={{ background: T.success }} onClick={confirmExit}>Ha, chiqarilsin</button></div>
              </div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Band (🟥) joyni bosing — tasdiq chiqadi</p></div>}
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              <span className="tagpill" style={{ color: T.success }}>✓ Tasdiq</span>
              <span className="tagpill" style={{ color: T.success }}>✓ Dashboard</span>
              <span className="tagpill" style={{ color: T.success }}>✓ Narx 15 000</span>
              <span className="tagpill" style={{ color: T.success }}>✓ 12 joy</span>
            </div>
            {done && <div className="takeaway fade-step"><div className="ta-bulb">🎉</div><p className="ta-h">Panel yaxshilandi!</p><p className="ta-sub">4 fikr → 4 upgrade. Foydalanuvchi mamnun.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 13 — TEST 4 =====
const Screen13 = (props) => (
  <QuestionScreen {...props} idx={13} scope="module-mikro" eyebrow="Mashq · 4-savol"
    questionText="Mahsulotni yaxshilash sikli qanday?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Mahsulotni <span className="italic" style={{ color: T.accent }}>yaxshilash sikli</span> qanday?</h2></>}
    options={['Qur → ko\'rsat → fikr ol → sarala → upgrade', 'Qur → unutib yubor', 'Faqat o\'zing hal qil, fikr so\'rama', 'Hammasini birdan qil']} correctIdx={0}
    explainCorrect="To'g'ri! Yaxshi mahsulot — qurib, foydalanuvchiga ko'rsatib, fikr olib, eng muhimini saralab, yaxshilanadi. Bu — to'xtovsiz sikl."
    explainWrong={{
      1: "Qurib unutish — mahsulot o'smaydi. Foydalanuvchi fikri bilan yaxshilanadi.",
      2: "O'zingiz hammasini ko'ra olmaysiz — foydalanuvchi fikri kamchilikni ochadi.",
      3: "Hammasini birdan qilib bo'lmaydi — saralab, eng muhimidan boshlaymiz.",
      default: "Sikl: qur → ko'rsat → fikr → sarala → upgrade."
    }} />
);

// ===== SCREEN 14 — MODUL SAYOHATI (P1→P4) =====
const Screen14 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const JOURNEY = [
    { n: 'Praktika 1', t: 'Backend CRUD', d: 'Express + PostgreSQL, sxema, pool.query', emoji: '🗄️' },
    { n: 'Praktika 2', t: 'Fullstack ulash', d: 'fetch ↔ API, loading/error, CORS', emoji: '🔗' },
    { n: 'Praktika 3', t: 'Loyiha kuni', d: '2 jadval bog\'lanishi (JOIN), qorovul paneli', emoji: '🅿️' },
    { n: 'Praktika 4', t: 'Feedback bilan yaxshilash', d: 'Demo → fikr → sarala → upgrade', emoji: '💬' }
  ];
  const [seen, setSeen] = useState(storedAnswer ? new Set([0, 1, 2, 3]) : new Set());
  const [sc, setSc] = useState(0);
  const done = seen.size >= JOURNEY.length;
  const tap = (i) => { setSeen(prev => { const s = new Set(prev); s.add(i); return s; }); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Sayohat" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Bosqichlarni ko'ring (${seen.size}/4)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">4-modulda <span className="italic" style={{ color: T.accent }}>nimalarni</span> qurdingiz?</h2></div>
        <Mentor>Bitta yo'l — to'rt qadam. Noldan boshlab, to'liq fullstack ilova qurdingiz va uni yaxshiladingiz. Har bosqichni bosib eslang.</Mentor>
        <div className="journey fade-up delay-1">
          {JOURNEY.map((j, i) => (
            <button key={i} className={`jrow ${seen.has(i) ? 'jrow-on' : ''}`} onClick={() => tap(i)}>
              <span className="jemoji">{j.emoji}</span>
              <span className="jn">{j.n}</span>
              <span className="jcol"><span className="jt">{j.t}</span>{seen.has(i) && <span className="jd fade-step">{j.d}</span>}</span>
              <span style={{ marginLeft: 'auto', color: seen.has(i) ? T.success : T.ink3, fontWeight: 700 }}>{seen.has(i) ? '✓' : '○'}</span>
            </button>
          ))}
        </div>
        {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana butun yo'l: baza → server → ulanish → loyiha → yaxshilash. Endi siz <b>fullstack quruvchisiz</b>.</p></div>}
      </div>
    </Stage>
  );
};

// ===== SCREEN 15 — QOIDA: YAXSHI DASTURCHI =====
const Screen15 = ({ screen, onNext, onPrev }) => (
  <Stage eyebrow="Qoida · xulosa" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Oxirgi qadam →" onClick={onNext} /></>}>
    <div className="screen" style={{ gap: 'clamp(12px,2vw,18px)' }}>
      <div className="head"><h2 className="title h-title fade-up">Yaxshi dasturchi nimasi bilan <span className="italic" style={{ color: T.accent }}>ajralib turadi</span>?</h2></div>
      <Mentor>Kod yozish — yarmi. Yaxshi dasturchi mahsulotni <b style={{ color: T.ink }}>foydalanuvchi uchun</b> doimo yaxshilab boradi. Bu — to'xtovsiz sikl.</Mentor>
      <Split>
        <Col>
          <p className="flow-label">Yaxshilash sikli</p>
          <div className="roadmap">
            <div className="step-card"><span className="step-num">01</span><span className="step-body"><span className="step-text">Qur</span><span className="step-tag">ishlaydigan mahsulot</span></span></div>
            <div className="step-card"><span className="step-num">02</span><span className="step-body"><span className="step-text">Ko'rsat va fikr ol</span><span className="step-tag">aniq feedback</span></span></div>
            <div className="step-card"><span className="step-num">03</span><span className="step-body"><span className="step-text">Sarala</span><span className="step-tag">foyda / mehnat</span></span></div>
            <div className="step-card"><span className="step-num">04</span><span className="step-body"><span className="step-text">Upgrade qil</span><span className="step-tag">→ yana ko'rsat</span></span></div>
          </div>
        </Col>
        <Col>
          <p className="flow-label">Yodda tuting</p>
          <div className="frame-success"><p className="body" style={{ margin: 0, color: T.ink }}>O'z ishingizga juda yaqinsiz — <b>foydalanuvchi fikri</b> kamchilikni ochadi.</p></div>
          <div className="frame" style={{ padding: 14 }}><p className="body" style={{ margin: 0, color: T.ink2 }}>Foydali fikr — <b style={{ color: T.ink }}>aniq</b>. Saralash — <b style={{ color: T.ink }}>ko'p foyda + kam mehnat</b> avval. Sozlama — kodda emas, <b style={{ color: T.ink }}>bazada</b> (UPDATE).</p></div>
        </Col>
      </Split>
    </div>
  </Stage>
);

// ===== SCREEN 16 — YAKUNIY (VS Code: chiqishda tasdiq — confirm) =====
const Screen16 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [value, setValue] = useState(storedAnswer?.picked || '');
  const [passed, setPassed] = useState(!!storedAnswer?.correct);
  const norm = value.replace(/\s+/g, '').trim();
  const valid = /^confirm$/i.test(norm);
  useEffect(() => {
    if (valid && !passed) {
      setPassed(true);
      onAnswer(screen, { stage: 'final', screenIdx: screen, question: 'VS Code: chiqishda tasdiq — confirm yozing', studentAnswer: value, correct: true, firstAttemptCorrect: true, solved: true, picked: value });
    }
  }, [valid]);
  const Ln = ({ n, children }) => (<div className="vsc-line"><span className="vsc-ln">{n}</span><span style={{ whiteSpace: 'pre' }}>{children}</span></div>);
  return (
    <Stage eyebrow="Yakuniy · amaliy" screen={screen} scrollSignal={passed} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!passed} label={passed ? 'Davom etish' : "Tasdiqni o'zingiz yozing"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Oxirgi qadam: chiqishda <span className="italic" style={{ color: T.accent }}>tasdiqni</span> o'zingiz yozing.</h2></div>
        <Mentor>Birinchi upgrade — chiqishda "Rostdan chiqarilsinmi?". Buni <span className="mono">confirm(...)</span> qiladi: foydalanuvchidan <b style={{ color: T.ink }}>Ha / Yo'q</b> so'raydi. Ha bo'lsa chiqaradi. Bo'sh joyga shu so'zni yozing.</Mentor>
        <div className="split">
          <Col>
            <div className="vsc fade-up delay-2">
              <div className="vsc-bar"><span className="vsc-tab on"><span style={{ color: '#61DAFB' }}>⚛</span> Panel.jsx <span style={{ color: '#6E7681', marginLeft: 4 }}>×</span></span></div>
              <div className="vsc-body">
                <Ln n={1}><Jx>{'function'}</Jx><span style={{ color: '#DCDCAA' }}> chiqar</span>{'(id) {'}</Ln>
                <div className="vsc-line">
                  <span className="vsc-ln">2</span>
                  <span style={{ whiteSpace: 'pre' }}>{'  '}<Jx>if</Jx>{' ( '}</span>
                  <input className={`vsc-input ${valid ? 'ok' : ''}`} value={value} onChange={e => setValue(e.target.value)} placeholder="confirm" spellCheck={false} autoCapitalize="off" autoCorrect="off" style={{ maxWidth: 130 }} />
                  <span style={{ whiteSpace: 'pre', color: '#D4D4D4' }}>{"('Rostdan chiqarilsinmi?') ) {"}</span>
                </div>
                <Ln n={3}>{'    '}<Cm>{'// PUT /api/sessiyalar/:id'}</Cm></Ln>
                <Ln n={4}>{'  }'}</Ln>
                <Ln n={5}>{'}'}</Ln>
              </div>
            </div>
            <div className="fade-up delay-2" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="tagpill" style={{ opacity: valid ? 1 : 0.4 }}>{valid ? '✓' : '1'} confirm(...)</span>
            </div>
            {passed && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Mukammal! Endi chiqarishdan oldin panel so'raydi — tasodifiy o'chirish yo'q. Aziz topgan muammo hal!</p></div>}
          </Col>
          <Col>
            <p className="flow-label">natija — panelda</p>
            {valid
              ? <div className="frame fade-step" style={{ boxShadow: `inset 0 0 0 1.5px ${T.danger}` }}><p className="note-h" style={{ color: T.danger }}>Rostdan chiqarilsinmi?</p><p className="body" style={{ margin: '0 0 10px', color: T.ink }}>A2 (01A123BC) chiqariladi.</p><div style={{ display: 'flex', gap: 9 }}><span className="btn-soft">Bekor</span><span className="btn" style={{ background: T.success }}>Ha, chiqarilsin</span></div></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0, textAlign: 'center' }}>confirm yozilmaguncha tasdiq chiqmaydi…</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 17 — YAKUN (MODUL FINALI) =====
const Screen17 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const RECAP = [
    "Mahsulotni qurib, foydalanuvchiga ko'rsatib, fikr olish",
    "Aniq feedback — umumiy maqtov emas",
    "Saralash: ko'p foyda + kam mehnat avval (Impact/Effort)",
    "Upgrade: tasdiq, dashboard, sozlamalar (narx UPDATE, joylar soni)",
    "4-MODUL: baza → server → ulanish → loyiha → yaxshilash"
  ];
  const HOMEWORK = [
    { b: 'Fikr yig\'ing', t: "— o'z loyihangizni 2-3 kishiga ko'rsatib, aniq fikr so'rang" },
    { b: 'Saralang', t: "— fikrlarni foyda/mehnat bo'yicha tartiblang" },
    { b: 'Bitta upgrade', t: "— eng yuqorisini AI bilan tuzating va qayta ko'rsating" }
  ];
  const GLOSSARY = [
    { b: 'Feedback', t: "— foydalanuvchi fikri (aniq bo'lsa foydali)" },
    { b: 'Impact / Effort', t: '— foyda / mehnat bo\'yicha saralash' },
    { b: 'Sikl (iteration)', t: '— qur → ko\'rsat → yaxshila sikli' },
    { b: 'Tasdiq (confirm)', t: '— muhim amaldan oldin so\'rash' },
    { b: 'Dashboard', t: '— holatni bir qarashda ko\'rsatuvchi panel' },
    { b: 'Settings + UPDATE', t: '— sozlamani bazada o\'zgartirish' }
  ];
  const correct = SCORED_IDX.filter(i => answers[i]?.correct).length;
  const total = SCORED_IDX.length;
  const PASSED = (total ? correct / total : 0) >= 0.6;
  const [open, setOpen] = useState(false);
  const glossRef = useRef(null);
  const isNarrow = useIsMobile(768);
  const toggleGloss = () => setOpen(o => { const nv = !o; if (nv && isNarrow) setTimeout(() => { if (glossRef.current) glossRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 80); return nv; });
  return (
    <Stage eyebrow="Tayyor · modul finali" screen={screen} navContent={<><NavBack onPrev={onPrev} /><button className="btn-ghost" onClick={onReset} style={{ padding: 'clamp(11px,1.6vw,13px) clamp(16px,2.2vw,22px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Qaytadan</button><button className="btn-white-accent" onClick={onFinish} style={{ marginLeft: 'auto', padding: 'clamp(11px,1.6vw,13px) clamp(22px,2.6vw,30px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Yakunlash ✓</button></>}>
      <div className="screen">
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">✓</span> 4-modul yakunlandi 🎓</span><h2 className="title h-title fade-up d1">Siz endi <span className="italic" style={{ color: T.accent }}>fullstack quruvchisiz</span>.</h2><p className="body h-sub fade-up d2">{PASSED ? "Tabriklaymiz! Ilova qurasiz, ulagasiz, foydalanuvchi fikri bilan yaxshilaysiz — haqiqiy dasturchi yo'li." : "Yaxshi harakat! Feedback sikli va sozlamalar (UPDATE) qismini qayta ko'rib chiqing."}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span className="tick" style={{ width: 16, height: 16, borderRadius: '50%', background: T.success, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck">✓</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>📝 Uyga vazifa</div><p className="body" style={{ margin: '0 0 10px', color: T.ink }}>O'z loyihangizda siklni o'tang:</p><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">🎉 Backend modulini tamomladingiz: baza, server, fullstack ulanish va mahsulotni yaxshilash — hammasi sizning qo'lingizda!</p></div>
        </div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">💡 Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function FullstackFeedbackLesson({ lang: langProp, onFinished }) {
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
    const finalAnswers = SCREEN_META.map((s, i) => (s.scored && s.scope === 'final' ? answers[i] : null)).filter(Boolean);
    const finalCorrect = finalAnswers.filter(a => a.correct).length;
    const payload = {
      lessonId: LESSON_META.lessonId, lessonTitle: LESSON_META.lessonTitle,
      durationSec: Math.floor((Date.now() - startTimeRef.current) / 1000),
      totalQuestions: scoredMeta.length, correctAnswers,
      scorePercent: scoredMeta.length ? Math.round((correctAnswers / scoredMeta.length) * 100) : 0,
      finalScore: finalCorrect, finalTotal: finalMeta.length,
      passed: finalMeta.length ? finalCorrect / finalMeta.length >= 0.6 : (scoredMeta.length ? correctAnswers / scoredMeta.length >= 0.6 : false),
      answers: SCREEN_META.map((s, i) => answers[i]).filter(Boolean)
    };
    if (typeof onFinished === 'function') onFinished(payload);
  };

  const screens = [Screen0, Screen1, Screen2, Screen3, Screen4, Screen5, Screen6, Screen7, Screen8, Screen9, Screen10, Screen11, Screen12, Screen13, Screen14, Screen15, Screen16, Screen17];
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
        .fade-up { animation: fade-in-up 0.4s ease-out forwards; opacity: 0; }
        .delay-1 { animation-delay: 0.12s; } .delay-2 { animation-delay: 0.24s; } .delay-3 { animation-delay: 0.36s; }
        @keyframes fade-step { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .fade-step { animation: fade-step 0.3s ease-out; }
        .d1 { animation-delay: 0.12s; } .d2 { animation-delay: 0.24s; } .d3 { animation-delay: 0.36s; } .d4 { animation-delay: 0.48s; }
        @keyframes el-pop { from { opacity: 0; transform: translateX(8px); } to { opacity: 1; transform: none; } }
        .el-in { animation: el-pop 0.3s ease-out; }
        @keyframes spot-pop { 0% { transform: scale(1); } 45% { transform: scale(1.09); } 100% { transform: scale(1); } }
        .spot-flash { animation: spot-pop 0.45s ease; }

        .feedback-block { max-height: 0; opacity: 0; overflow: hidden; transition: max-height 0.4s ease-out, opacity 0.3s ease-out 0.1s, margin-top 0.4s ease-out; margin-top: 0; }
        .feedback-block.visible { max-height: 800px; opacity: 1; margin-top: clamp(14px,2vw,20px); }

        /* === KNOPKALAR === */
        .btn { font-family: 'Manrope', sans-serif; font-weight: 600; cursor: pointer; transition: all 0.2s; background: ${T.ink}; color: ${T.bg}; border: none; border-radius: 12px; letter-spacing: 0.01em; box-shadow: 0 6px 18px -4px rgba(${T.shadowBase},0.32); padding: clamp(11px,1.6vw,13px) clamp(20px,2.5vw,26px); font-size: clamp(13px,1.6vw,15px); }
        .btn:hover:not(:disabled) { background: ${T.accent}; box-shadow: 0 10px 24px -4px rgba(255,79,40,0.45); }
        .btn:disabled { opacity: 0.55; cursor: not-allowed; box-shadow: none; }
        .btn-white-accent { font-family: 'Manrope', sans-serif; font-weight: 600; cursor: pointer; transition: all 0.2s; background: ${T.paper}; color: ${T.accent}; border: none; border-radius: 12px; letter-spacing: 0.01em; box-shadow: 0 8px 22px -4px rgba(255,79,40,0.35), 0 0 0 1px rgba(255,79,40,0.12); }
        .btn-white-accent:hover:not(:disabled) { background: ${T.accent}; color: #fff; box-shadow: 0 12px 28px -6px rgba(255,79,40,0.55); }
        .btn-white-accent:disabled { opacity: 0.45; cursor: not-allowed; box-shadow: 0 4px 12px -4px rgba(${T.shadowBase},0.14); }
        .btn-ghost { font-family: 'Manrope', sans-serif; font-weight: 600; cursor: pointer; transition: all 0.2s; background: transparent; color: ${T.ink}; border: none; border-radius: 12px; box-shadow: none; }
        .btn-ghost:hover:not(:disabled) { background: ${T.paper}; box-shadow: 0 6px 18px -6px rgba(${T.shadowBase},0.18); }
        .btn-soft { font-family: 'Manrope'; font-weight: 600; cursor: pointer; transition: all 0.2s; background: ${T.bg}; color: ${T.ink}; border: none; border-radius: 10px; padding: 9px 15px; font-size: 13px; }
        .btn-soft:hover:not(:disabled) { box-shadow: 0 6px 14px -5px rgba(${T.shadowBase},0.2); }
        .btn-soft:disabled { opacity: 0.6; cursor: not-allowed; }
        .pick-on { background: ${T.accentSoft} !important; }

        /* === OPSIYALAR === */
        .option { background: ${T.paper}; cursor: pointer; transition: all 0.2s; font-family: 'Manrope', sans-serif; font-weight: 500; text-align: left; border-radius: 12px; width: 100%; border: none; color: ${T.ink}; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.14); }
        .option:hover:not(:disabled) { background: #FDFBF7; box-shadow: 0 10px 22px -6px rgba(${T.shadowBase},0.22); }
        .option:disabled { cursor: default; }
        .option-correct { background: ${T.successSoft} !important; color: ${T.success} !important; box-shadow: 0 8px 22px -6px rgba(31,122,77,0.32) !important; }
        .option-wrong { background: ${T.paper} !important; color: ${T.ink3} !important; opacity: 0.55 !important; box-shadow: 0 4px 12px -6px rgba(${T.shadowBase},0.08) !important; }
        .option-picked-wrong { background: ${T.accentSoft} !important; color: ${T.accent} !important; box-shadow: 0 8px 22px -6px rgba(255,79,40,0.38) !important; }

        .tagpill { font-family: 'JetBrains Mono', monospace; font-size: 12.5px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 99px; background: ${T.paper}; color: ${T.ink}; box-shadow: 0 3px 10px -5px rgba(${T.shadowBase},0.18); transition: opacity 0.2s; }

        /* === VCARD === */
        .vcard { display: flex; align-items: center; gap: 11px; width: 100%; text-align: left; background: ${T.paper}; border: none; border-radius: 12px; padding: 12px 15px; cursor: pointer; transition: all 0.18s; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.16); }
        .vcard:hover { transform: translateY(-1px); }
        .vlbl { font-family: 'Manrope', sans-serif; font-weight: 700; font-size: 13.5px; color: ${T.ink}; }

        /* === MENTOR === */
        .mentor { display: flex; gap: 12px; align-items: flex-start; }
        .zoomable { position: relative; }
        .zoom-btn { position: absolute; top: 6px; right: 6px; z-index: 5; width: 30px; height: 30px; border-radius: 8px; border: none; background: rgba(255,255,255,0.82); color: ${T.ink2}; font-size: 14px; line-height: 1; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px -4px rgba(${T.shadowBase},0.22); transition: all 0.2s; }
        .zoom-btn:hover { background: ${T.paper}; color: ${T.accent}; transform: scale(1.08); }
        .zoom-backdrop { position: fixed; inset: 0; background: rgba(14,14,16,0.55); z-index: 1000; animation: fade-step 0.25s ease; }
        .zoom-on { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%); width: min(880px,94vw); max-height: 90vh; overflow: auto; z-index: 1001; background: ${T.paper}; border-radius: 18px; padding: clamp(20px,4vw,42px); box-shadow: 0 30px 80px -20px rgba(${T.shadowBase},0.5); animation: zoom-pop 0.3s cubic-bezier(.34,1.3,.4,1); }
        @keyframes zoom-pop { from { opacity: 0; transform: translate(-50%,-50%) scale(0.93); } to { opacity: 1; transform: translate(-50%,-50%) scale(1); } }
        .mentor-ava { width: 40px; height: 40px; border-radius: 50%; overflow: hidden; flex-shrink: 0; background: ${T.accentSoft}; box-shadow: 0 4px 12px -4px rgba(${T.shadowBase},0.28); }
        .mentor-ava img { display: block; width: 100%; height: 100%; object-fit: contain; transform: scale(1.12); }
        .mentor-col { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5px; }
        .mentor-name { font-family: 'Manrope', sans-serif; font-weight: 700; font-size: 13px; color: ${T.accent}; letter-spacing: 0.01em; }
        .mentor-msg { background: ${T.paper}; border-radius: 4px 14px 14px 14px; padding: 13px 16px; color: ${T.ink}; box-shadow: 0 6px 18px -6px rgba(${T.shadowBase},0.16); }

        /* === HOOK OPSIYALARI === */
        .hook-option { display: flex; align-items: center; gap: 13px; width: 100%; text-align: left; background: ${T.paper}; border: none; border-radius: 12px; padding: clamp(13px,1.9vw,16px) clamp(15px,2.2vw,18px); font-family: 'Manrope', sans-serif; font-weight: 500; font-size: clamp(14px,1.7vw,16px); color: ${T.ink}; cursor: pointer; transition: all 0.18s; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.14); }
        .hook-option:hover:not(:disabled):not(.on) { box-shadow: 0 10px 22px -6px rgba(${T.shadowBase},0.22); }
        .hook-option.on { background: ${T.accentSoft}; color: ${T.accent}; box-shadow: 0 8px 22px -6px rgba(255,79,40,0.3), inset 0 0 0 1.5px ${T.accent}; }
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
        .frame { background: ${T.paper}; border-radius: 16px; padding: clamp(16px,3vw,24px); border: none; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.14); }
        .frame-soft { background: ${T.accentSoft}; border-left: 4px solid ${T.accent}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); box-shadow: 0 6px 16px -6px rgba(255,79,40,0.22); }
        .frame-success { background: ${T.successSoft}; border-left: 4px solid ${T.success}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); box-shadow: 0 6px 16px -6px rgba(31,122,77,0.22); }
        .frame-warn { background: ${T.accentSoft}; border-left: 4px solid ${T.accent}; border-radius: 12px; padding: 12px 15px; }
        .frame-dash { border: 1.5px dashed ${T.ink3}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); }

        /* === LAYOUT === */
        .screen { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: clamp(14px,2vw,20px); }
        .head { display: flex; flex-direction: column; gap: 6px; }
        .split { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: clamp(18px,3vw,36px); align-items: start; }
        .col { display: flex; flex-direction: column; gap: clamp(12px,2vw,16px); min-width: 0; }
        @media (max-width: 760px) { .split { grid-template-columns: 1fr; gap: clamp(14px,3vw,20px); } }
        .flow-label { font-family: 'Manrope'; font-weight: 700; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: ${T.ink2}; }

        /* === ROADMAP === */
        .roadmap { display: flex; flex-direction: column; gap: 8px; list-style: none; }
        .step-card { display: flex; align-items: center; gap: 14px; background: ${T.paper}; border-radius: 12px; padding: 13px 16px; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.14); }
        .step-num { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 13px; color: ${T.accent}; flex-shrink: 0; }
        .step-body { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .step-text { font-weight: 500; font-size: clamp(14px,1.7vw,16px); color: ${T.ink}; }
        .step-tag { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink2}; background: ${T.bg}; padding: 3px 8px; border-radius: 6px; }

        /* === SK-INFO === */
        .sk-info { background: ${T.paper}; border-radius: 12px; padding: 13px 16px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.16); animation: fade-step 0.3s; }

        /* === AI CARD / PROMPT === */
        .ai-card { background: ${T.paper}; border-radius: 14px; padding: 15px 17px; display: flex; flex-direction: column; gap: 11px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.14); }
        .ai-row { display: flex; align-items: center; gap: 9px; } .ai-badge { font-family: 'Manrope'; font-weight: 800; font-size: 11px; color: #fff; background: ${T.blue}; padding: 3px 9px; border-radius: 6px; } .ai-bubble { font-size: 13px; color: ${T.ink2}; }
        .ai-code { background: ${CODE.bg}; border-radius: 9px; padding: 10px 12px; display: flex; flex-direction: column; gap: 3px; }
        .ai-line { font-family: 'JetBrains Mono'; font-size: 12.5px; color: ${CODE.text}; padding: 7px 9px; border-radius: 6px; white-space: pre-wrap; line-height: 1.6; }
        .ai-line.ok { background: rgba(31,122,77,0.16); }
        .note-h { font-weight: 700; font-size: 13px; margin: 0 0 4px; }
        .prompt-box { background: #FFF8F3; border-left: 4px solid ${T.accent}; border-radius: 12px; padding: 13px 15px; margin: 0; font-family: 'JetBrains Mono', monospace; font-size: clamp(11.5px,1.4vw,13px); line-height: 1.7; color: ${T.ink}; white-space: pre-wrap; word-break: break-word; box-shadow: 0 6px 16px -8px rgba(${T.shadowBase},0.18); }
        .code-box { background: ${CODE.bg}; color: ${CODE.text}; font-family: 'JetBrains Mono', monospace; font-size: clamp(12px,1.5vw,13.5px); line-height: 1.55; padding: clamp(12px,2.2vw,16px); border-radius: 12px; overflow-x: auto; white-space: pre-wrap; word-break: break-word; margin: 0; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.2); }
        .takeaway { background: ${T.accentSoft}; border-radius: 14px; padding: 20px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 5px; } .ta-bulb { font-size: 34px; } .ta-h { font-family: 'Source Serif 4', serif; font-weight: 600; font-size: clamp(16px,2.2vw,20px); color: ${T.ink}; margin: 0; } .ta-sub { color: ${T.accent}; font-weight: 600; font-size: 13px; margin: 0; }

        /* === YAKUN === */
        .hero { display: flex; align-items: center; justify-content: space-between; gap: 24px; flex-wrap: wrap; }
        .hero-l { flex: 1; min-width: 240px; display: flex; flex-direction: column; gap: 8px; }
        .done-chip { display: inline-flex; align-items: center; gap: 7px; align-self: flex-start; font-family: 'Manrope'; font-weight: 700; font-size: 12px; color: ${T.success}; background: ${T.successSoft}; padding: 5px 12px; border-radius: 99px; } .done-chip .tick { width: 15px; height: 15px; border-radius: 50%; background: ${T.success}; color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 9px; }
        .ring-wrap { position: relative; width: 128px; height: 128px; flex-shrink: 0; }
        .ring-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .ring-num { font-family: 'Fraunces', serif; font-size: 30px; font-weight: 400; line-height: 1; } .ring-den { color: ${T.ink3}; font-size: 20px; } .ring-lbl { font-size: 10px; color: ${T.ink2}; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 3px; }
        .card { background: ${T.paper}; border-radius: 16px; padding: 18px 20px; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.14); }
        .card-lbl { display: flex; align-items: center; gap: 8px; font-family: 'Manrope'; font-weight: 700; font-size: 13px; margin-bottom: 11px; }
        .recap { display: flex; flex-direction: column; gap: 8px; list-style: none; } .recap li { display: flex; align-items: flex-start; gap: 10px; font-size: clamp(13px,1.6vw,15px); color: ${T.ink}; animation: fade-in-up 0.4s ease-out forwards; opacity: 0; } .recap .ck { color: ${T.success}; font-weight: 700; flex-shrink: 0; background: none; padding: 0; }
        .hw ul { display: flex; flex-direction: column; gap: 6px; list-style: none; } .hw li { font-size: clamp(13px,1.6vw,15px); color: ${T.ink}; } .hw li b { color: ${T.accent}; } .hw .t { color: ${T.ink2}; } .hw-note { margin: 11px 0 0; font-size: 12px; color: ${T.accent}; font-weight: 600; }
        .gloss { background: ${T.paper}; border-radius: 12px; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.12); overflow: hidden; }
        .gloss-head { display: flex; align-items: center; justify-content: space-between; padding: 13px 17px; cursor: pointer; } .gloss-head .lbl { font-family: 'Manrope'; font-weight: 700; font-size: 13px; color: ${T.ink}; } .gloss-toggle { font-size: 18px; color: ${T.ink2}; }
        .gloss-body { padding: 0 17px 15px; font-size: clamp(12.5px,1.5vw,14px); color: ${T.ink2}; line-height: 1.7; animation: fade-step 0.3s; } .gloss-body b { color: ${T.ink}; }

        /* === QOROVUL PANELI === */
        .guard { border-radius: 14px; overflow: hidden; background: #fff; box-shadow: 0 10px 26px -6px rgba(${T.shadowBase},0.2); }
        .guard-top { background: ${CODE.bg}; color: #fff; padding: 10px 14px; display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .guard-title { font-family: 'Manrope'; font-weight: 800; font-size: 13.5px; } .guard-title small { font-weight: 500; color: ${CODE.punct}; }
        .guard-stats { display: flex; gap: 8px; } .gst { font-family: 'Manrope'; font-weight: 800; font-size: 12px; padding: 3px 9px; border-radius: 99px; } .gst.free { background: rgba(31,122,77,0.25); } .gst.busy { background: rgba(194,54,43,0.3); }
        .guard-body { padding: 12px; }
        .guard-foot { padding: 9px 14px; background: ${T.bg}; font-family: 'Manrope'; font-weight: 600; font-size: 12.5px; color: ${T.ink2}; } .guard-foot b { color: ${T.ink}; }
        .gear { border: none; background: rgba(255,255,255,0.15); color: #fff; width: 28px; height: 28px; border-radius: 8px; font-size: 15px; cursor: pointer; transition: all 0.18s; display: inline-flex; align-items: center; justify-content: center; }
        .gear:hover { background: ${T.accent}; transform: rotate(45deg); }
        /* yondan ochiladigan Sozlamalar paneli */
        .drawer-bd { position: absolute; inset: 0; background: rgba(14,14,16,0.25); border-radius: 14px; z-index: 4; animation: fade-step 0.2s ease; }
        .drawer { position: absolute; top: 0; right: 0; height: 100%; width: min(82%,250px); background: #fff; box-shadow: -10px 0 28px -10px rgba(${T.shadowBase},0.4); border-radius: 0 14px 14px 0; padding: 15px; z-index: 5; overflow-y: auto; animation: drawer-in 0.28s cubic-bezier(.2,.7,.2,1); }
        @keyframes drawer-in { from { transform: translateX(100%); opacity: 0.5; } to { transform: none; opacity: 1; } }
        .drawer-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; }
        .drawer-title { font-family: 'Manrope'; font-weight: 800; font-size: 14px; color: ${T.ink}; }
        .drawer-x { border: none; background: ${T.bg}; width: 26px; height: 26px; border-radius: 7px; cursor: pointer; font-size: 12px; color: ${T.ink2}; }
        .drawer-x:hover { background: ${T.dangerSoft}; color: ${T.danger}; }
        .set-val { font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 13px; color: ${T.ink}; }
        .dash { display: grid; grid-template-columns: repeat(3,1fr); gap: 8px; padding: 11px 12px; background: ${T.bg}; }
        .dash-card { background: #fff; border-radius: 11px; padding: 9px 6px; display: flex; flex-direction: column; align-items: center; gap: 2px; box-shadow: 0 4px 12px -7px rgba(${T.shadowBase},0.2); }
        .dash-num { font-family: 'Fraunces', serif; font-size: clamp(18px,3vw,24px); line-height: 1; }
        .dash-lbl { font-family: 'Manrope'; font-weight: 700; font-size: 9.5px; color: ${T.ink2}; }
        .pgrid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
        .spot { border: none; border-radius: 12px; padding: 10px 6px; display: flex; flex-direction: column; align-items: center; gap: 3px; min-height: 80px; justify-content: center; position: relative; transition: all 0.2s; }
        .spot.spot-sm { min-height: 58px; padding: 6px 3px; gap: 1px; }
        .spot.free { background: ${T.successSoft}; box-shadow: inset 0 0 0 1.5px rgba(31,122,77,0.28); }
        .spot.busy { background: ${T.dangerSoft}; box-shadow: inset 0 0 0 1.5px rgba(194,54,43,0.35); }
        .spot:not(:disabled):hover { transform: translateY(-2px); box-shadow: 0 8px 18px -6px rgba(${T.shadowBase},0.28); }
        .spot-tag { font-family: 'Manrope'; font-weight: 800; font-size: 8px; color: #fff; padding: 1px 7px; border-radius: 99px; letter-spacing: 0.04em; }
        .spot-sm .spot-tag { font-size: 7px; padding: 1px 5px; }
        .spot-ico { font-size: 21px; line-height: 1; } .spot-sm .spot-ico { font-size: 15px; }
        .spot.free .spot-ico { color: ${T.ink3}; opacity: 0.5; }
        .spot-num { font-family: 'JetBrains Mono'; font-weight: 800; font-size: 14px; } .spot-sm .spot-num { font-size: 11px; }
        .spot.free .spot-num { color: ${T.success}; } .spot.busy .spot-num { color: ${T.danger}; }
        .spot-plate { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 8.5px; color: ${T.danger}; }

        /* === FEEDBACK KARTASI === */
        .fb { display: flex; align-items: center; gap: 11px; width: 100%; text-align: left; background: #fff; border: none; border-radius: 12px; padding: 11px 14px; cursor: pointer; transition: all 0.18s; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.16); }
        .fb:hover:not(:disabled) { transform: translateY(-1px); }
        .fb-on { box-shadow: inset 0 0 0 1.5px ${T.accent}, 0 8px 20px -6px rgba(255,79,40,0.22); }
        .ava { width: 34px; height: 34px; border-radius: 50%; flex-shrink: 0; display: inline-flex; align-items: center; justify-content: center; font-family: 'Manrope', sans-serif; font-weight: 800; font-size: 15px; color: #fff; box-shadow: 0 4px 10px -4px rgba(${T.shadowBase},0.35); }
        .ava-sm { width: 26px; height: 26px; font-size: 12px; }
        .fb-col { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
        .fb-who { font-family: 'Manrope'; font-weight: 800; font-size: 12px; color: ${T.accent}; }
        .fb-text { font-family: 'Manrope'; font-weight: 500; font-size: 12.5px; color: ${T.ink}; line-height: 1.4; }
        .fb-seen { margin-left: auto; font-weight: 700; flex-shrink: 0; }

        /* === MATRITSA === */
        .mx-head { display: grid; grid-template-columns: 42px 1fr 1fr; gap: 6px; margin-bottom: 4px; }
        .mx-cap { font-family: 'Manrope'; font-weight: 700; font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: ${T.ink2}; text-align: center; }
        .mx-grid { display: grid; grid-template-columns: 42px 1fr 1fr; gap: 6px; align-items: stretch; }
        .mx-rowcap { font-family: 'Manrope'; font-weight: 700; font-size: 10px; text-transform: uppercase; letter-spacing: 0.04em; color: ${T.ink2}; display: flex; align-items: center; justify-content: center; text-align: center; }
        .quad { background: #fff; border-radius: 11px; padding: 9px; min-height: 70px; display: flex; flex-direction: column; gap: 6px; }
        .quad-lbl { font-family: 'Manrope'; font-weight: 800; font-size: 11px; }
        .quad-items { display: flex; flex-wrap: wrap; gap: 5px; }
        .quad-chip { font-family: 'Manrope'; font-weight: 700; font-size: 10.5px; color: #fff; padding: 3px 9px; border-radius: 99px; }

        /* === SETTINGS === */
        .set-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
        .set-lbl { font-family: 'Manrope'; font-weight: 600; font-size: 13px; color: ${T.ink2}; }
        .set-input { width: 100%; margin-top: 9px; font-family: 'JetBrains Mono', monospace; font-size: 18px; font-weight: 700; text-align: center; padding: 11px 12px; border-radius: 10px; border: 1.5px dashed ${T.ink3}; background: ${T.bg}; color: ${T.ink}; outline: none; transition: border-color 0.2s, background 0.2s; }
        .set-input:focus { border-color: ${T.accent}; background: #fff; }

        /* === MODUL SAYOHATI === */
        .journey { display: flex; flex-direction: column; gap: 8px; }
        .jrow { display: flex; align-items: center; gap: 12px; width: 100%; text-align: left; background: #fff; border: none; border-radius: 12px; padding: 12px 15px; cursor: pointer; transition: all 0.18s; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.16); }
        .jrow:hover { transform: translateY(-1px); }
        .jrow-on { box-shadow: inset 0 0 0 1.5px ${T.success}44, 0 5px 14px -6px rgba(${T.shadowBase},0.16); }
        .jemoji { font-size: 22px; } .jn { font-family: 'JetBrains Mono'; font-weight: 800; font-size: 12px; color: ${T.accent}; flex-shrink: 0; white-space: nowrap; }
        .jcol { display: flex; flex-direction: column; gap: 2px; } .jt { font-family: 'Manrope'; font-weight: 700; font-size: 13.5px; color: ${T.ink}; } .jd { font-family: 'Manrope'; font-size: 11.5px; color: ${T.ink2}; }

        /* === VS CODE === */
        .vsc { background: #1E1E1E; border-radius: 13px; overflow: hidden; box-shadow: 0 10px 26px -6px rgba(${T.shadowBase},0.3); }
        .vsc-bar { background: #252526; display: flex; align-items: flex-end; }
        .vsc-tab { font-family: 'JetBrains Mono', monospace; font-size: 11.5px; color: #8B949E; background: #2D2D2D; padding: 8px 14px; display: inline-flex; align-items: center; gap: 6px; }
        .vsc-tab.on { background: #1E1E1E; color: #E6EDF3; box-shadow: inset 0 2px 0 #007ACC; }
        .vsc-body { padding: 12px 14px 14px 8px; font-family: 'JetBrains Mono', monospace; font-size: clamp(12px,1.5vw,13px); color: #D4D4D4; line-height: 2; }
        .vsc-line { display: flex; align-items: center; }
        .vsc-ln { color: #6E7681; min-width: 22px; text-align: right; margin-right: 14px; font-size: 11px; flex-shrink: 0; user-select: none; }
        .vsc-input { background: rgba(0,122,204,0.08); border: 1px dashed #007ACC; border-radius: 6px; color: #E6EDF3; font-family: 'JetBrains Mono', monospace; font-size: clamp(12px,1.5vw,13px); padding: 4px 9px; outline: none; flex: 1; min-width: 0; transition: border-color 0.2s, background 0.2s; }
        .vsc-input::placeholder { color: #5A6374; }
        .vsc-input.ok { border: 1.5px solid ${T.success}; background: rgba(31,122,77,0.14); }

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
