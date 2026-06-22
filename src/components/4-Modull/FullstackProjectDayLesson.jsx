import React, { useState, useEffect, useRef, createContext, useContext, useCallback, useMemo } from 'react';
import mentorImg from '../../assets/common/mentor.png';

// ============================================================
// MA'LUMOT VA BACKEND MODULI · PRAKTIKA 3 — LOYIHA KUNI: AVTOSTOYANKA (React + Node + PostgreSQL) — PLATFORM STANDARD v16 (AUDIOSIZ)
// O'RNI: 4-Modul, "Auth va .env" darsidan KEYIN. Fullstack loyiha kuni — hammasini birlashtiramiz.
//        O'quvchi biladi: Express+pg CRUD (P1), fetch/loading/error/CORS (P2), API/Postman, React.
// Mavzu: AvtoStoyanka — QOROVUL (admin) uchun panel. Joylar to'ri 🟩 bo'sh / 🟥 band. Mashina kiradi/chiqadi, tolov 10 000.
// YANGI: ikki jadval BOG'LANISHI (joylar ◄ joy_id sessiyalar, FK + JOIN) — 32-dars amalda. + PM/UX: foydalanuvchi = qorovul.
// HALQA: ME'MOR (sxema+bog'lanish chizadi) → REJISSYOR (AI'ga endpoint) → NAZORATCHI (panelda sinaydi).
// PEDAGOGIKA: PM tomondan o'ylash (qorovul nimani ko'rishi kerak), vizual his qilish. "sehr" yo'q. AUDIOSIZ. Sarlavhalar = qiziqarli savol.
// SIFAT: javoblar aralashgan (placeCorrect — to'g'ri javob 1-o'rinda emas), har amalda mobil avtoscroll, mentor mobil yig'iladi.
// Yakuniy ekran (s16): mock VS Code — JOIN ON shartini yozish (sessiyalar.joy_id = joylar.id).
// PRODUCTION: <style> ichidagi @import OLIB TASHLANADI — shriftlarni LMS yuklaydi.
// ============================================================

const T = {
  bg: '#F6F4EF', ink: '#0E0E10', ink2: '#5A5A60', ink3: '#A7A6A2',
  paper: '#FFFFFF', accent: '#FF4F28', accentSoft: '#FFE8E1', accentVivid: '#FF4F28',
  success: '#1F7A4D', successSoft: '#E3F0E8', blue: '#019ACB', blueSoft: '#E2F4FA', link: '#1a56db',
  danger: '#C2362B', dangerSoft: '#FAE3E0',
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

const LESSON_META = { lessonId: 'fullstack-projectday-p3-v16', lessonTitle: { uz: 'Praktika: Loyiha kuni — AvtoStoyanka', ru: 'Практика: Проектный день — AvtoStoyanka' } };
const SCREEN_META = [
  { id: 's0',  type: 'hook',        template: 'custom',   scored: false, scope: 'hook' },
  { id: 's1',  type: 'rule',        template: 'custom',   scored: false, scope: null },
  { id: 's2',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's3',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's4',  type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's5',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's6',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's7',  type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's8',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's9',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's9b', type: 'exploration', template: 'custom',   scored: false, scope: null },
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
    const isControl = tgt && tgt.closest && tgt.closest('button, input, a, .vcard, .option, .hook-option, .spot');
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

// javoblarni aralashtirish — barqaror (screen bo'yicha); to'g'ri javob HECH QACHON 1-o'rinda emas, har ekranda har xil joyda
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
const At = ({ children }) => <span style={{ color: CODE.attr }}>{children}</span>;
const St = ({ children }) => <span style={{ color: CODE.str }}>{children}</span>;
const Cm = ({ children }) => <span style={{ color: CODE.comment, fontStyle: 'italic' }}>{children}</span>;
const Win = ({ title, children, minH }) => (
  <div className="bp-window"><div className="bp-bar"><span className="bb-dots"><i /><i /><i /></span><span className="bp-title">{title}</span></div><div className="bp-body" style={{ minHeight: minH, position: 'relative' }}>{children}</div></div>
);

// ===== AVTOSTOYANKA MA'LUMOTLARI =====
const sp = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const FEE = 10000;
const mkSpots = (busy = { 2: '01A123BC', 5: '01B456DE' }) => ([
  { id: 1, raqam: 'A1' }, { id: 2, raqam: 'A2' }, { id: 3, raqam: 'A3' }, { id: 4, raqam: 'A4' },
  { id: 5, raqam: 'B1' }, { id: 6, raqam: 'B2' }, { id: 7, raqam: 'B3' }, { id: 8, raqam: 'B4' }
].map(s => busy[s.id] ? { ...s, bandmi: true, mashina: busy[s.id] } : { ...s, bandmi: false, mashina: null }));

// joylar jadval ustunlari (ME'MOR)
const JOY_COLS = [
  { key: 'id', sql: 'id SERIAL PRIMARY KEY', type: 'raqam', desc: "Har joyning takrorlanmas raqami — avtomatik o'sadi" },
  { key: 'raqam', sql: 'raqam TEXT', type: 'matn', desc: "Joy belgisi — A1, A2, B1... (qorovul o'qiydi)" },
  { key: 'bandmi', sql: 'bandmi BOOLEAN', type: "ha/yo'q", desc: "Joy bandmi? bo'sh = false (🟩), band = true (🟥)" }
];
// sessiyalar jadval ustunlari (kirish-chiqish tarixi)
const SES_COLS = [
  { key: 'id', sql: 'id SERIAL PRIMARY KEY', type: 'raqam', desc: "Har kirish-chiqishning raqami" },
  { key: 'joy_id', sql: 'joy_id INTEGER REFERENCES joylar(id)', type: "bog'lovchi", fk: true, desc: "Qaysi joy? joylar.id ga bog'lanadi — foreign key. SQL'da: joy_id INTEGER REFERENCES joylar(id)" },
  { key: 'mashina', sql: 'mashina TEXT', type: 'matn', desc: "Mashina davlat raqami — 01A123BC" },
  { key: 'kirgan', sql: 'kirgan TIMESTAMP', type: 'vaqt', desc: "Mashina kirgan vaqti" },
  { key: 'chiqqan', sql: 'chiqqan TIMESTAMP', type: 'vaqt', desc: "Chiqqan vaqti (bo'sh = hali turibdi)" },
  { key: 'tolov', sql: 'tolov INTEGER', type: 'son', desc: "To'lov — 10 000 so'm" }
];
// sessiyalar namuna ma'lumoti (bog'lanish va JOIN uchun)
const SES_DATA = [
  { id: 1, joy_id: 2, mashina: '01A123BC', tolov: FEE },
  { id: 2, joy_id: 2, mashina: '30K500AA', tolov: FEE },
  { id: 3, joy_id: 5, mashina: '01B456DE', tolov: FEE },
  { id: 4, joy_id: 1, mashina: '75C300BB', tolov: FEE }
];

// ===== QOROVUL PANELI (vizual yulduz) =====
const Spot = ({ spot, onClick, flash, selected, dim }) => (
  <button className={`spot ${spot.bandmi ? 'busy' : 'free'} ${flash ? 'spot-flash' : ''} ${selected ? 'spot-sel' : ''}`} onClick={onClick} disabled={!onClick} style={{ opacity: dim ? 0.45 : 1, cursor: onClick ? 'pointer' : 'default' }}>
    <span className="spot-tag" style={{ background: spot.bandmi ? T.danger : T.success }}>{spot.bandmi ? 'BAND' : "BO'SH"}</span>
    <span className="spot-ico">{spot.bandmi ? '🚗' : '⬚'}</span>
    <span className="spot-num">{spot.raqam}</span>
    {spot.bandmi && spot.mashina && <span className="spot-plate">{spot.mashina}</span>}
  </button>
);
const GuardPanel = ({ spots, onSpotClick, tushum, selectedId, flashId, children }) => {
  const band = spots.filter(s => s.bandmi).length;
  const bosh = spots.length - band;
  return (
    <div className="guard">
      <div className="guard-top">
        <span className="guard-title">🅿️ AvtoStoyanka <small>· qorovul paneli</small></span>
        <span className="guard-stats"><span className="gst free">🟩 {bosh}</span><span className="gst busy">🟥 {band}</span></span>
      </div>
      <div className="guard-body">
        <div className="pgrid">{spots.map(s => <Spot key={s.id} spot={s} onClick={onSpotClick ? () => onSpotClick(s) : undefined} flash={flashId === s.id} selected={selectedId === s.id} />)}</div>
      </div>
      {(tushum != null || children) && <div className="guard-foot">{tushum != null && <span>Bugungi tushum: <b>{sp(tushum)} so'm</b></span>}{children}</div>}
    </div>
  );
};

// jadval (sxema / bog'lanish / JOIN uchun)
const Table = ({ cap, cols, rows, hi, hiCol }) => (
  <div className="db">
    <div className="db-cap">🗄️ <b>{cap}</b> <span>· {rows.length} qator</span></div>
    <div className="db-row db-head" style={{ gridTemplateColumns: `repeat(${cols.length},1fr)` }}>{cols.map(c => <span key={c} style={{ color: c === hiCol ? T.accent : undefined }}>{c}</span>)}</div>
    {rows.map((r, ri) => (
      <div key={ri} className={`db-row el-in ${hi && hi(r) ? 'flash' : ''}`} style={{ gridTemplateColumns: `repeat(${cols.length},1fr)` }}>
        {cols.map(c => <span key={c} style={{ color: c === hiCol ? T.accent : undefined, fontWeight: c === hiCol ? 700 : undefined }}>{r[c]}</span>)}
      </div>
    ))}
  </div>
);

// ===== SCREEN 0 — HOOK (qog'oz bilan kuzatish — chalkash) =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [tried, setTried] = useState(!!storedAnswer);
  const [shaking, setShaking] = useState(false);
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const [sc, setSc] = useState(0);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const poke = () => { setTried(true); setSc(n => n + 1); clearTimeout(timer.current); setShaking(true); timer.current = setTimeout(() => setShaking(false), 450); };
  const OPTS = [
    { id: 'a', label: "Ko'proq qog'oz va ruchka" },
    { id: 'b', label: "Bo'sh/band joyni bir qarashda ko'rsatadigan ilova" },
    { id: 'c', label: "Stoyankani yopish" }
  ];
  const pick = (v) => { if (picked !== null || !tried) return; setPicked(v); setSc(n => n + 1); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: true }); };
  return (
    <Stage eyebrow="Loyiha kuni · kirish" screen={screen} scrollSignal={sc} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 880 }}>Qorovul qaysi joy bo'shligini <span className="italic" style={{ color: T.accent }}>qog'ozda</span> kuzatib bo'ladimi?</h1>
        <Mentor>Tasavvur qiling: siz <b style={{ color: T.ink }}>qorovulsiz</b>. Mashinalar kirib-chiqyapti, siz hammasini qog'ozga yozyapsiz. Ikki mashina bitta joyga, to'lov eslab qolinmaydi... Qog'ozni bosib ko'ring — yordam beradimi?</Mentor>
        <Zoomable>
        <Split>
          <Col>
            <p className="flow-label fade-up delay-1">Qorovulning daftari</p>
            <div className={`fade-up delay-1 ${shaking ? 'shake' : ''}`}>
              <div className="paper" onClick={poke}>
                <p className="paper-line">A2 — 01A123BC — to'ladi? ...</p>
                <p className="paper-line">B1 — 01B456DE — ✎ o'chirilgan</p>
                <p className="paper-line">?? — 30K500AA — qaysi joy?</p>
                <p className="paper-line" style={{ color: T.danger }}>A2 — yana?! ikki marta?</p>
                <p className="paper-scribble">— qaysi joy bo'sh??? —</p>
              </div>
            </div>
            {tried && <p className="small fade-step" style={{ color: T.accent, fontStyle: 'italic', margin: 0 }}>Qog'oz chalkash — qaysi joy bo'sh, kim to'ladi, bilib bo'lmaydi!</p>}
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Qorovulga eng ko'p nima yordam beradi?</p>
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
            {!tried && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>Avval daftarni bosib ko'ring ←</p>}
            {picked !== null && <p className="hook-ack fade-step">Aynan! Bugun <b>qorovul uchun</b> stoyanka ilovasini quramiz: bo'sh/band joylar rangda ko'rinadi, mashina kirsa bir bosishda band bo'ladi, chiqsa to'lov yoziladi. To'liq fullstack — front, server va baza birga.</p>}
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
    { text: 'Sxema — 2 jadval, bog\'lanish', tag: 'ME\'MOR' },
    { text: 'Backend — kirish / chiqish', tag: 'REJISSYOR · AI' },
    { text: 'Front — joylar to\'ri', tag: 'qorovul paneli' },
    { text: 'Test + tarix (JOIN)', tag: 'NAZORATCHI' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const PreviewBlock = (
    <Col>
      <p className="flow-label">Dars oxirida — sizning qorovul paneli</p>
      <GuardPanel spots={mkSpots()} tushum={20000} />
      <p className="mono small" style={{ color: T.accent, margin: 0 }}>→ bo'sh 🟩 / band 🟥 · bir bosishda kirish-chiqish · tushum hisoblanadi</p>
    </Col>
  );
  const StepsBlock = (
    <Col>
      <p className="flow-label">Bugungi 4 qadam</p>
      <ol className="roadmap">
        {STEPS.map((s, i) => (<li key={i} className="step-card fade-up" style={{ animationDelay: `${0.08 + i * 0.05}s` }}><span className="step-num">{String(i + 1).padStart(2, '0')}</span><span className="step-body"><span className="step-text">{s.text}</span>{s.tag && <span className="step-tag">{s.tag}</span>}</span></li>))}
      </ol>
    </Col>
  );
  return (
    <Stage eyebrow="Reja" screen={screen} mentorStatic scrollSignal={showSteps} navContent={<><NavBack onPrev={onPrev} /><NavNext label="Boshlaymiz →" onClick={onNext} /></>}>
      <div className="screen">
        <div className="head"><h2 className="title h-title fade-up">Qorovul uchun stoyanka ilovasini <span className="italic" style={{ color: T.accent }}>qanday</span> quramiz?</h2></div>
        <Mentor>Bu — <b style={{ color: T.ink }}>loyiha kuni</b>: AvtoIjara'da o'rgangan ko'nikmalarni (CRUD, fetch, baza) endi yangi loyiha — <b style={{ color: T.ink }}>AvtoStoyanka</b>'da qo'llaymiz va to'liq stackni o'zingiz yig'asiz. Yana o'sha uch rol — <b style={{ color: T.ink }}>ME'MOR</b> (sxema), <b style={{ color: T.ink }}>REJISSYOR</b> (AI'ga buyruq), <b style={{ color: T.ink }}>NAZORATCHI</b> (sinov).</Mentor>
        {!isNarrow ? (
          <Zoomable><Split>{PreviewBlock}{StepsBlock}</Split></Zoomable>
        ) : !showSteps ? (
          <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>
            {PreviewBlock}
            <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>Bugungi 4 qadamni ko'rish</button>
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

// ===== SCREEN 2 — PM/UX: QOROVUL UCHUN KO'RINISH =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const PRINC = [
    { id: 'rang', t: 'Rang bilan holat', d: "Yashil = bo'sh, qizil = band. Qorovul o'qimasdan, bir qarashda tushunadi." },
    { id: 'katta', t: 'Katta, bosiladigan joy', d: "Joylar katta tugma — telefon yoki shoshib turib ham oson bosiladi." },
    { id: 'kam', t: 'Kam matn, tez harakat', d: "Ortiqcha yozuv yo'q. Bir bosishda kirish, bir bosishda chiqish." }
  ];
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(storedAnswer ? new Set(PRINC.map(p => p.id)) : new Set());
  const [sc, setSc] = useState(0);
  const done = seen.size >= PRINC.length;
  const tap = (id) => { setActive(id); setSc(n => n + 1); setSeen(prev => { const s = new Set(prev); s.add(id); return s; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = PRINC.find(p => p.id === active);
  return (
    <Stage eyebrow="PM · foydalanuvchi" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Tamoyillarni ko'ring (${seen.size}/3)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bu ilovani <span className="italic" style={{ color: T.accent }}>kim</span> ishlatadi — unga qanday ko'rinish kerak?</h2></div>
        <Mentor>PM darslarini eslang: avval <b style={{ color: T.ink }}>foydalanuvchi</b>ni o'ylaymiz. Bu yerda u — <b style={{ color: T.ink }}>qorovul</b>: kompyuter bilimi kam, shoshib turadi. Demak ekran <b style={{ color: T.ink }}>oddiy va tushunarli</b> bo'lishi shart. Uch tamoyilni bosib ko'ring — o'ngda natijasi.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Qorovul uchun UX tamoyillari</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {PRINC.map(p => (
                <button key={p.id} className="vcard" onClick={() => tap(p.id)} style={{ boxShadow: active === p.id ? `inset 0 0 0 1.5px ${T.accent}, 0 8px 20px -6px rgba(${T.shadowBase},0.2)` : undefined }}>
                  <span className="vlbl">{p.t}</span>
                  <span className="vseen" style={{ color: seen.has(p.id) ? T.success : T.ink3 }}>{seen.has(p.id) ? '✓' : ''}</span>
                </button>
              ))}
            </div>
            {cur && <div className="sk-info" key={active}><p className="body" style={{ margin: 0, color: T.ink }}><b style={{ color: T.accent }}>{cur.t}</b> — {cur.d}</p></div>}
          </Col>
          <Col>
            <p className="flow-label">Shu tamoyillar bilan — qorovul paneli</p>
            <GuardPanel spots={mkSpots()} />
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana qorovulga mos panel: rang bilan holat, katta joylar, kam matn. Endi shu ko'rinish ortidagi ma'lumotni — bazani loyihalashtiramiz.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — ME'MOR: 1-JADVAL (joylar) =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(storedAnswer ? new Set(JOY_COLS.map(c => c.key)) : new Set());
  const [sc, setSc] = useState(0);
  const done = seen.size >= JOY_COLS.length;
  const tap = (k) => { setActive(k); setSc(n => n + 1); setSeen(prev => { const s = new Set(prev); s.add(k); return s; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = JOY_COLS.find(c => c.key === active);
  return (
    <Stage eyebrow="1-qadam · ME'MOR" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Ustunlarni ko'ring (${seen.size}/${JOY_COLS.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Birinchi jadval — <span className="italic" style={{ color: T.accent }}>joylar</span> haqida nimani saqlaymiz?</h2></div>
        <Mentor>Panel ortida ma'lumot turishi kerak. Birinchi jadval — <span className="mono">joylar</span>: har bir parking joyi bitta qator. Ustunlarni bosib, nima saqlashini ko'ring — pastda <span className="mono">CREATE TABLE</span> yig'iladi.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">joylar — ustunlar</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {JOY_COLS.map(c => (
                <button key={c.key} className="vcard" onClick={() => tap(c.key)} style={{ boxShadow: active === c.key ? `inset 0 0 0 1.5px ${T.accent}, 0 8px 20px -6px rgba(${T.shadowBase},0.2)` : undefined }}>
                  <span className="vbadge" style={{ background: c.key === 'id' ? T.accent : T.ink }}>{c.type}</span>
                  <span className="vlbl mono">{c.key}</span>
                  <span className="vseen" style={{ color: seen.has(c.key) ? T.success : T.ink3 }}>{seen.has(c.key) ? '✓' : ''}</span>
                </button>
              ))}
            </div>
            {cur && <div className="sk-info" key={active}><p className="body" style={{ margin: 0, color: T.ink }}><b className="mono" style={{ color: T.accent }}>{cur.key}</b> — {cur.desc}</p></div>}
          </Col>
          <Col>
            <p className="flow-label">Tayyor sxema — SQL</p>
            <pre className="code-box fade-up delay-1" style={{ lineHeight: 1.9 }}>
              <Jx>{'CREATE TABLE'}</Jx>{' joylar ('}{'\n'}
              {JOY_COLS.map(c => (
                <React.Fragment key={c.key}>
                  {'  '}<span style={{ opacity: seen.has(c.key) ? 1 : 0.3, background: active === c.key ? 'rgba(255,79,40,0.16)' : 'transparent', borderRadius: 4, padding: '1px 3px' }}><At>{c.key}</At>{' ' + c.sql.split(' ').slice(1).join(' ')}</span>{c.key !== 'bandmi' ? ',' : ''}{'\n'}
                </React.Fragment>
              ))}
              {');'}
            </pre>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}><span className="mono">bandmi BOOLEAN</span> — aynan shu ustun panel rangini boshqaradi: false 🟩, true 🟥. Endi kunlik tarix uchun 2-jadval quramiz.</p></div>}
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
    questionText="Joy bo'sh yoki bandligini saqlash uchun qaysi ustun?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Joy <span className="italic" style={{ color: T.accent }}>bo'sh/band</span>ligini qaysi ustun saqlaydi?</h2></>}
    options={['bandmi BOOLEAN', 'raqam TEXT', 'id SERIAL PRIMARY KEY', 'tolov INTEGER']} correctIdx={0}
    explainCorrect="To'g'ri! BOOLEAN — bu ha/yo'q (true/false). bandmi = true bo'lsa joy band (🟥), false bo'lsa bo'sh (🟩). Panel rangi shunga qarab o'zgaradi."
    explainWrong={{
      1: "raqam — bu joy belgisi (A1, B2), holat emas. Bo'sh/band uchun bandmi BOOLEAN.",
      2: "id — takrorlanmas raqam. Bo'sh/band holati uchun bandmi BOOLEAN.",
      3: "tolov — pul miqdori. Joy holati uchun bandmi BOOLEAN.",
      default: "Bo'sh/band = bandmi BOOLEAN (true/false)."
    }} />
);

// ===== SCREEN 5 — ME'MOR: 2-JADVAL (sessiyalar) + BOG'LANISH =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(storedAnswer ? new Set(SES_COLS.map(c => c.key)) : new Set());
  const [sc, setSc] = useState(0);
  const done = seen.size >= SES_COLS.length;
  const tap = (k) => { setActive(k); setSc(n => n + 1); setSeen(prev => { const s = new Set(prev); s.add(k); return s; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = SES_COLS.find(c => c.key === active);
  return (
    <Stage eyebrow="1-qadam · ME'MOR" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Ustunlarni ko'ring (${seen.size}/${SES_COLS.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bugungi kirish-chiqishlarni — <span className="italic" style={{ color: T.accent }}>kunlik tarix</span> uchun — qayerga yozamiz?</h2></div>
        <Mentor>Qorovulga <b style={{ color: T.ink }}>kunlik tarix</b> kerak: bugun qaysi joyda kim turdi va jami qancha pul yig'ildi. Buning uchun har bir kirish-chiqishni alohida yozadigan 2-jadval — <span className="mono">sessiyalar</span> — quramiz. Eng muhim ustun <b style={{ color: T.ink }}>joy_id</b>: u har yozuvni qaysi joyga tegishli ekanini <b style={{ color: T.ink }}>bog'laydi</b> (joylar.id ga). Bu — <b style={{ color: T.ink }}>foreign key</b>.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">sessiyalar — ustunlar</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {SES_COLS.map(c => (
                <button key={c.key} className="vcard" onClick={() => tap(c.key)} style={{ boxShadow: active === c.key ? `inset 0 0 0 1.5px ${T.accent}, 0 8px 20px -6px rgba(${T.shadowBase},0.2)` : (c.fk ? `inset 0 0 0 1.5px ${T.blue}55` : undefined) }}>
                  <span className="vbadge" style={{ background: c.fk ? T.blue : (c.key === 'id' ? T.accent : T.ink) }}>{c.type}</span>
                  <span className="vlbl mono">{c.key}</span>
                  <span className="vseen" style={{ color: seen.has(c.key) ? T.success : T.ink3 }}>{seen.has(c.key) ? '✓' : ''}</span>
                </button>
              ))}
            </div>
            {cur && <div className="sk-info" key={active}><p className="body" style={{ margin: 0, color: T.ink }}><b className="mono" style={{ color: cur.fk ? T.blue : T.accent }}>{cur.key}</b> — {cur.desc}</p></div>}
          </Col>
          <Col>
            <p className="flow-label">Ikki jadval — bog'lanish</p>
            <div className="rel fade-up delay-1">
              <div className="rel-box"><b>joylar</b><span className="mono">id</span><span className="mono">raqam</span><span className="mono">bandmi</span></div>
              <div className="rel-link"><span className="rel-key" style={{ color: T.blue }}>joy_id</span><span className="rel-arr">►</span><span className="rel-to mono">joylar.id</span></div>
              <div className="rel-box" style={{ boxShadow: `inset 0 0 0 1.5px ${T.blue}55` }}><b>sessiyalar</b><span className="mono" style={{ color: T.blue }}>joy_id ↗</span><span className="mono">mashina</span><span className="mono">tolov</span></div>
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}><span className="mono" style={{ color: T.blue }}>joy_id</span> — ko'prik: har yozuvni joyga ulaydi. Endi kunlik tarix saqlanadi: qaysi joy, qaysi mashina, qancha to'lov.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 6 — BOG'LANISH VIZUAL (one-to-many) =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const SP = mkSpots();
  const [sel, setSel] = useState(storedAnswer ? 2 : null);
  const [seen, setSeen] = useState(storedAnswer ? new Set([2, 5]) : new Set());
  const [sc, setSc] = useState(0);
  const done = seen.size >= 2;
  const pick = (s) => { setSel(s.id); setSc(n => n + 1); setSeen(prev => { const n2 = new Set(prev); n2.add(s.id); return n2; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const selSpot = SP.find(s => s.id === sel);
  const linked = SES_DATA.filter(r => r.joy_id === sel);
  return (
    <Stage eyebrow="Bog'lanish" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `2 ta joyni tekshiring (${seen.size}/2)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bitta joyda ko'p marta mashina turadi — ularni <span className="italic" style={{ color: T.accent }}>qanday bog'laymiz</span>?</h2></div>
        <Mentor>Kunlik tarixda bitta joy ko'p marta band qilinadi — turli mashinalar, turli vaqtda. Bu — <b style={{ color: T.ink }}>"bitta → ko'p"</b> bog'lanish. Joyni tanlang: o'sha joyga tegishli barcha sessiyalar (<span className="mono" style={{ color: T.blue }}>joy_id</span> bir xil) yonib chiqadi.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Joyni tanlang</p>
            <div className="fade-up delay-1"><div className="pgrid" style={{ gridTemplateColumns: 'repeat(4,1fr)' }}>{SP.map(s => <Spot key={s.id} spot={s} onClick={() => pick(s)} selected={sel === s.id} />)}</div></div>
            {selSpot && <div className="sk-info" key={sel}><p className="body" style={{ margin: 0, color: T.ink }}><b className="mono" style={{ color: T.accent }}>{selSpot.raqam}</b> (id={sel}) joyiga <b>{linked.length}</b> ta sessiya bog'langan.</p></div>}
          </Col>
          <Col>
            <p className="flow-label">sessiyalar — joy_id = {sel ?? '?'}</p>
            <Table cap="sessiyalar" cols={['id', 'joy_id', 'mashina', 'tolov']} rows={SES_DATA.map(r => ({ ...r, tolov: sp(r.tolov) }))} hi={r => r.joy_id === sel} hiCol="joy_id" />
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Ko'rdingizmi? Bir joyga (mas. A2) bir nechta sessiya <span className="mono" style={{ color: T.blue }}>joy_id</span> orqali bog'langan. Mana shu — ikki jadval bog'lanishi.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — TEST 2 =====
const Screen7 = (props) => (
  <QuestionScreen {...props} idx={7} scope="module-mikro" eyebrow="Mashq · 2-savol"
    questionText="Sessiyani qaysi joyga tegishli ekanini qaysi ustun bog'laydi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Sessiyani <span className="italic" style={{ color: T.accent }}>joyga</span> qaysi ustun bog'laydi?</h2></>}
    options={['joy_id INTEGER', 'mashina TEXT', 'tolov INTEGER', 'kirgan TIMESTAMP']} correctIdx={0}
    explainCorrect="To'g'ri! joy_id — foreign key: u joylar jadvalidagi id ga ishora qiladi. Shu orqali har sessiya qaysi joyga tegishli ekani aniqlanadi."
    explainWrong={{
      1: "mashina — bu davlat raqami, joyga bog'lamaydi. Bog'lovchi — joy_id (foreign key).",
      2: "tolov — pul miqdori. Joyga bog'lovchi ustun — joy_id.",
      3: "kirgan — vaqt. Bog'lanish joy_id orqali bo'ladi.",
      default: "Bog'lovchi = joy_id (foreign key)."
    }} />
);

// ===== SCREEN 8 — REJISSYOR: MASHINA KIRDI (POST) =====
const BACK_PROMPT = `Express + pg bilan AvtoStoyanka backend quramiz:
• mashina kirsa — qo'shilsin va joy band bo'lsin
• mashina chiqsa — bo'shatilsin va to'lov yozilsin
• barcha joylar va kunlik tarix ko'rinsin`;
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [done, setDone] = useState(!!storedAnswer);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="2-qadam · REJISSYOR (backend)" screen={screen} scrollSignal={done} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Promptni AI'ga bering"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Backendni AI'ga <span className="italic" style={{ color: T.accent }}>qanday</span> yozdiramiz?</h2></div>
        <Mentor>Sir — <b style={{ color: T.ink }}>aniq va qisqa prompt</b>da. Nima, qaysi yo'l (path), nima qilsin — shuni yozsangiz, AI'ga berib qo'ysangiz, u shu ko'rsatma asosida kodni yozadi. Mana backend uchun tayyor prompt.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Agentga prompt — backend</p>
            <pre className="prompt-box fade-up delay-1">{BACK_PROMPT}</pre>
            {!done
              ? <button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={() => setDone(true)}>📤 Promptni AI'ga yuborish</button>
              : <div className="ai-card fade-step"><div className="ai-row"><span className="ai-badge">AI</span><span className="ai-bubble">Endpointlar yozildi:</span></div><div className="ai-code"><div className="ai-line ok" style={{ cursor: 'default', whiteSpace: 'pre-wrap' }}>{"app.post('/api/sessiyalar', async (req,res)=>{\n  await pool.query(...);  // sessiyaga INSERT\n  await pool.query(...);  // joylar bandmi=true\n  res.json({status:'kirdi'});\n});\n\napp.put('/api/sessiyalar/:id', async (req,res)=>{\n  await pool.query(...);  // chiqqan + tolov=10000\n  await pool.query(...);  // joylar bandmi=false\n  res.json({status:'chiqdi'});\n});"}</div></div></div>}
          </Col>
          <Col>
            <p className="flow-label">Bu backend nima qiladi</p>
            <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}><b style={{ color: T.accent }}>Kirish (POST)</b> — sessiya yoziladi + joy band (🟥). <span className="mono">NOW()</span> vaqtni avtomatik qo'yadi.</p></div>
            <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}><b style={{ color: T.accent }}>Chiqish (PUT)</b> — chiqqan vaqt + 10 000 yoziladi, joy bo'sh (🟩).</p></div>
            <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}><b style={{ color: T.accent }}>GET</b> — joylar va tarix (JOIN bilan o'qiladi).</p></div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Prompt aniq bo'lgani uchun AI to'g'ri yozdi. Endi shu API'ni ishlatadigan <b>frontni</b> yozdiramiz.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 9 — REJISSYOR: BACKEND TUSHUNTIRISH (ikki amal chuqurroq) =====
const Screen9 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [step, setStep] = useState(storedAnswer ? 2 : 0); // 0 boshlang'ich, 1 kirish, 2 chiqish
  const done = step >= 2;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const SP = mkSpots({ 2: '01A123BC' });
  const after = step >= 1 ? mkSpots({ 2: '01A123BC', 4: '30A555AA' }) : SP;
  const shown = step >= 2 ? mkSpots({ 4: '30A555AA' }) : after;
  return (
    <Stage eyebrow="2-qadam · REJISSYOR (backend)" screen={screen} scrollSignal={step} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Kirish va chiqishni ko'ring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Endpointlar joyni <span className="italic" style={{ color: T.accent }}>qanday</span> o'zgartiradi?</h2></div>
        <Mentor>Backend yozildi — endi tekshiramiz: har endpoint <span className="mono">joylar</span> jadvalini va panel rangini qanday o'zgartiradi. Tugmani bosib, kirish va chiqishni kuzating.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="code-box fade-up delay-1" style={{ minHeight: 70 }}>
              {step === 0 && <span style={{ color: CODE.comment }}>— tugmani bosing —</span>}
              {step === 1 && <span style={{ color: CODE.str }}>POST /api/sessiyalar → A4 band 🟥 (30A555AA kirdi)</span>}
              {step >= 2 && <><div style={{ color: CODE.str }}>POST /api/sessiyalar → A4 band 🟥</div><div style={{ color: CODE.str }}>PUT /api/sessiyalar/1 → A2 bo'sh 🟩 (tolov 10 000)</div></>}
            </div>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={done} onClick={() => setStep(s => Math.min(s + 1, 2))}>{step === 0 ? '▶ Mashina kirgizish (POST)' : (step === 1 ? '▶ Mashina chiqarish (PUT)' : '✓ Ko\'rdingiz')}</button>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Ko'rdingiz: POST joyni band qildi, PUT bo'shatdi va to'lovni yozdi. Backend ishlayapti.</p></div>}
          </Col>
          <Col>
            <p className="flow-label">joylar — panelda natija</p>
            <GuardPanel spots={shown} tushum={step >= 2 ? FEE : 0} flashId={step === 1 ? 4 : (step >= 2 ? 2 : null)} />
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 9b — REJISSYOR: FRONTEND (qorovul paneli) =====
const FRONT_PROMPT = `React'da qorovul paneli quramiz:
• barcha joylar to'r bo'lib ko'rinsin (bo'sh yashil, band qizil)
• bo'sh joyga mashina raqamini yozib kirgizish
• band joydan chiqarish (to'lov bilan)
• yuqorida bo'sh/band soni va kunlik tushum`;
const Screen9b = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [done, setDone] = useState(!!storedAnswer);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="2-qadam · REJISSYOR (front)" screen={screen} scrollSignal={done} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Promptni AI'ga bering"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Endi qorovul <span className="italic" style={{ color: T.accent }}>panelini</span> (front) yozdiramiz.</h2></div>
        <Mentor>Backend tayyor, lekin qorovul kod ko'rmaydi — unga <b style={{ color: T.ink }}>panel</b> kerak. Frontga ham aniq prompt beramiz: nimani ko'rsatsin, qaysi API'ni chaqirsin. Shu prompt AI'ga berilsa — panelni o'zi quradi.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Agentga prompt — frontend</p>
            <pre className="prompt-box fade-up delay-1">{FRONT_PROMPT}</pre>
            {!done
              ? <button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={() => setDone(true)}>📤 Promptni AI'ga yuborish</button>
              : <div className="ai-card fade-step"><div className="ai-row"><span className="ai-badge">AI</span><span className="ai-bubble">Panel komponenti yozildi:</span></div><div className="ai-code"><div className="ai-line ok" style={{ cursor: 'default', whiteSpace: 'pre-wrap' }}>{"function Panel(){\n  const [joylar,setJoylar]=useState([]);\n  const yukla=()=>fetch('/api/joylar')...;  // joylarni olish\n  useEffect(()=>{ yukla(); },[]);\n  const kirgiz=(joy_id,mashina)=>fetch(...);  // POST → yukla\n  const chiqar=(id,joy_id)=>fetch(...);  // PUT → yukla\n  return <Grid joylar={joylar} .../>;\n}"}</div></div></div>}
          </Col>
          <Col>
            <p className="flow-label">{done ? 'Natija — qorovul paneli' : 'Front nimani quradi'}</p>
            {done
              ? <GuardPanel spots={mkSpots()} tushum={0} />
              : <><div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}><b style={{ color: T.accent }}>fetch GET</b> — joylarni serverdan oladi.</p></div><div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}><b style={{ color: T.accent }}>To'r</b> — bo'sh 🟩 / band 🟥 ko'rsatadi.</p></div><div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}><b style={{ color: T.accent }}>POST / PUT</b> — kirish / chiqish, so'ng qayta yuklash.</p></div></>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana panel! Front + backend tayyor. Endi NAZORATCHI sifatida o'zimiz sinab ko'ramiz.</p></div>}
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
    questionText="Mashina kirganda (yangi sessiya) qaysi amal ishlaydi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Mashina <span className="italic" style={{ color: T.accent }}>kirganda</span> qaysi amal?</h2></>}
    options={['POST — yangi sessiya yaratish', 'GET — ro\'yxatni o\'qish', 'DELETE — o\'chirish', 'CSS — bezash']} correctIdx={0}
    explainCorrect="To'g'ri! Kirish = yangi yozuv = POST (INSERT). Va o'sha joy band qilinadi (UPDATE bandmi=true)."
    explainWrong={{
      1: "GET — bu o'qish, yangi narsa qo'shmaydi. Kirish uchun POST (yangi sessiya).",
      2: "DELETE — o'chirish. Kirish esa yangi sessiya yaratish = POST.",
      3: "CSS bezak. Yangi sessiya yaratish = POST.",
      default: "Mashina kirdi = POST (yangi sessiya)."
    }} />
);

// ===== SCREEN 11 — CASE: NAZORATCHI (panelni jonli sinash) =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [spots, setSpots] = useState(mkSpots());
  const [sel, setSel] = useState(null);
  const [tushum, setTushum] = useState(0);
  const [didIn, setDidIn] = useState(!!storedAnswer);
  const [didOut, setDidOut] = useState(!!storedAnswer);
  const [plate, setPlate] = useState('');
  const [sc, setSc] = useState(0);
  const done = didIn && didOut;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const selSpot = spots.find(s => s.id === sel);
  const pickSpot = (s) => { setSel(s.id); setPlate(''); };
  const enter = () => { const p = plate.trim(); if (!p) return; setSpots(prev => prev.map(s => s.id === sel ? { ...s, bandmi: true, mashina: p } : s)); setDidIn(true); setSel(null); setPlate(''); setSc(n => n + 1); };
  const exit = () => { setSpots(prev => prev.map(s => s.id === sel ? { ...s, bandmi: false, mashina: null } : s)); setTushum(t => t + FEE); setDidOut(true); setSel(null); setSc(n => n + 1); };
  return (
    <Stage eyebrow="3-qadam · NAZORATCHI" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Bir kirish + bir chiqishni sinang"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Endi sinaymiz — panel <span className="italic" style={{ color: T.accent }}>jonlanadimi</span>?</h2></div>
        <Mentor>Mana qorovul paneli, ma'lumot serverdan. <b style={{ color: T.ink }}>Bo'sh joyni</b> bosing → mashina kirgizing (POST) → 🟥. <b style={{ color: T.ink }}>Band joyni</b> bosing → chiqaring (PUT) → 🟩 va 10 000 yoziladi. Ikkalasini ham sinang.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Amal paneli</p>
            {!selSpot && <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>O'ngdan joyni tanlang →</p></div>}
            {selSpot && !selSpot.bandmi && (
              <div className="frame fade-step" style={{ padding: 14 }}>
                <p className="note-h" style={{ color: T.success }}>🟩 {selSpot.raqam} — kiruvchi mashina</p>
                <p className="small" style={{ color: T.ink2, margin: '0 0 9px' }}>Mashina davlat raqamini yozing:</p>
                <input className="plate-input" value={plate} onChange={e => setPlate(e.target.value.toUpperCase())} onKeyDown={e => { if (e.key === 'Enter') enter(); }} placeholder="01 A 123 BC" spellCheck={false} autoCapitalize="characters" autoCorrect="off" />
                <button className="btn" disabled={!plate.trim()} onClick={enter} style={{ marginTop: 10 }}>🚗 Kirgizish (POST)</button>
              </div>
            )}
            {selSpot && selSpot.bandmi && (
              <div className="frame fade-step" style={{ padding: 14, boxShadow: `inset 0 0 0 1.5px ${T.danger}55` }}>
                <p className="note-h" style={{ color: T.danger }}>🟥 {selSpot.raqam} — band ({selSpot.mashina})</p>
                <p className="small" style={{ color: T.ink2, margin: '0 0 9px' }}>Mashina chiqyapti — to'lov olinadi:</p>
                <button className="btn" onClick={exit} style={{ background: T.success }}>Chiqarish · {sp(FEE)} so'm (PUT)</button>
              </div>
            )}
            <div className="fade-up delay-2" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              <span className="tagpill" style={{ color: didIn ? T.success : T.ink3 }}>{didIn ? '✓' : '○'} Kirish (POST)</span>
              <span className="tagpill" style={{ color: didOut ? T.success : T.ink3 }}>{didOut ? '✓' : '○'} Chiqish (PUT)</span>
            </div>
          </Col>
          <Col>
            <p className="flow-label">Qorovul paneli</p>
            <GuardPanel spots={spots} onSpotClick={pickSpot} tushum={tushum} selectedId={sel} />
            {done && <div className="takeaway fade-step"><div className="ta-bulb">🎉</div><p className="ta-h">Panel ishlayapti!</p><p className="ta-sub">Kirish 🟥, chiqish 🟩 + tushum. Front, server, baza — birga.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — JOIN (tarix o'qiladigan bo'ladi) =====
const Screen12 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [joined, setJoined] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = joined;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const doJoin = () => { setJoined(true); setSc(n => n + 1); };
  const RAQAM = { 1: 'A1', 2: 'A2', 5: 'B1' };
  return (
    <Stage eyebrow="JOIN · tarix" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "JOIN bilan birlashtiring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Qorovul <span className="italic" style={{ color: T.accent }}>kunlik tarix</span>ni ochdi — lekin joy "2" deb chiqyapti, A2 qayerda?</h2></div>
        <Mentor>Qorovul kunlik tarixni ko'rmoqchi: kim, qaysi joy, qancha. Lekin sessiyalarda faqat <span className="mono" style={{ color: T.blue }}>joy_id</span> bor (mas. 2) — joy belgisi (<b style={{ color: T.ink }}>A2</b>) esa <span className="mono">joylar</span> jadvalida. <b style={{ color: T.ink }}>JOIN</b> ikki jadvalni <span className="mono">joy_id = id</span> bo'yicha birlashtiradi — shunda tarix o'qiladigan bo'ladi.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">{joined ? 'JOIN natijasi — o\'qiladi' : 'sessiyalar — joy_id raqam'}</p>
            {!joined
              ? <Table cap="sessiyalar" cols={['joy_id', 'mashina', 'tolov']} rows={SES_DATA.map(r => ({ joy_id: r.joy_id, mashina: r.mashina, tolov: sp(r.tolov) }))} hiCol="joy_id" />
              : <Table cap="sessiyalar JOIN joylar" cols={['raqam', 'mashina', 'tolov']} rows={SES_DATA.map(r => ({ raqam: RAQAM[r.joy_id] || ('id' + r.joy_id), mashina: r.mashina, tolov: sp(r.tolov) }))} hiCol="raqam" />}
            {!joined && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>"joy_id: 2" — qaysi joy? Qorovul tushunmaydi.</p>}
          </Col>
          <Col>
            <pre className="code-box fade-up delay-1" style={{ lineHeight: 1.85 }}>
              <Jx>{'SELECT'}</Jx>{' raqam, mashina, tolov'}{'\n'}
              <Jx>{'FROM'}</Jx>{' sessiyalar'}{'\n'}
              <Jx>{'JOIN'}</Jx>{' joylar'}{'\n'}
              {'  '}<At>{'ON sessiyalar.joy_id = joylar.id'}</At>{';'}
            </pre>
            {!joined && <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={doJoin}>▶ JOIN bilan birlashtirish</button>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Endi <b>A2</b> ko'rinadi! JOIN <span className="mono" style={{ color: T.blue }}>joy_id</span> va <span className="mono">id</span> ni moslab, ikki jadvaldan birga ma'lumot oldi. Bog'lanish shuning uchun kerak edi.</p></div>}
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
    questionText="Sessiya yoniga joy belgisini (A2) qo'shib ko'rsatish uchun nima kerak?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Sessiya yoniga <span className="italic" style={{ color: T.accent }}>joy belgisini</span> qo'shish uchun?</h2></>}
    options={['JOIN — ikki jadvalni joy_id = id bo\'yicha birlashtirish', 'DELETE — qatorni o\'chirish', 'Yangi ustun qo\'shish', 'CSS rang berish']} correctIdx={0}
    explainCorrect="To'g'ri! JOIN ikki jadvalni bog'lovchi ustun (joy_id = id) bo'yicha birlashtiradi — natijada sessiya bilan joy raqami birga ko'rinadi."
    explainWrong={{
      1: "DELETE o'chiradi — bu yerda ma'lumotni birlashtirish kerak: JOIN.",
      2: "Ustun qo'shish shart emas — joy belgisi allaqachon joylar jadvalida bor. Uni JOIN bilan olamiz.",
      3: "CSS bezak, ma'lumotni birlashtirmaydi. Kerakli — JOIN.",
      default: "Ikki jadvalni birlashtirish = JOIN."
    }} />
);

// ===== SCREEN 14 — TO'LIQ PANEL (amaliyot) =====
const Screen14 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [spots, setSpots] = useState(mkSpots({ 2: '01A123BC' }));
  const [sel, setSel] = useState(null);
  const [tushum, setTushum] = useState(0);
  const [tarix, setTarix] = useState([]);
  const [acts, setActs] = useState(storedAnswer ? 3 : 0);
  const [plate, setPlate] = useState('');
  const [sc, setSc] = useState(0);
  const done = acts >= 3;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const selSpot = spots.find(s => s.id === sel);
  const pickSpot = (s) => { setSel(s.id); setPlate(''); };
  const enter = () => { const p = plate.trim(); if (!p) return; setSpots(prev => prev.map(s => s.id === sel ? { ...s, bandmi: true, mashina: p } : s)); setSel(null); setPlate(''); setActs(a => a + 1); setSc(n => n + 1); };
  const exit = () => { const spt = selSpot; setSpots(prev => prev.map(s => s.id === sel ? { ...s, bandmi: false, mashina: null } : s)); setTushum(t => t + FEE); setTarix(prev => [{ raqam: spt.raqam, mashina: spt.mashina, tolov: FEE }, ...prev]); setSel(null); setActs(a => a + 1); setSc(n => n + 1); };
  return (
    <Stage eyebrow="Amaliyot · to'liq panel" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Kamida 3 amal qiling (${Math.min(acts, 3)}/3)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Stoyanka boshqaruv paneli — <span className="italic" style={{ color: T.accent }}>hammasi joyidami</span>?</h2></div>
        <Mentor>Endi to'liq panel sizniki. Bir nechta mashinani <b style={{ color: T.ink }}>kirgizing</b> va <b style={{ color: T.ink }}>chiqaring</b> — bo'sh/band soni, tushum va tarix jonli yangilanishini kuzating. Qorovul aynan shunday ishlatadi.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Amal</p>
            {!selSpot && <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Joyni tanlang →</p></div>}
            {selSpot && !selSpot.bandmi && (
              <div className="frame fade-step" style={{ padding: 13 }}>
                <p className="note-h" style={{ color: T.success }}>🟩 {selSpot.raqam} — kiruvchi mashina</p>
                <input className="plate-input" value={plate} onChange={e => setPlate(e.target.value.toUpperCase())} onKeyDown={e => { if (e.key === 'Enter') enter(); }} placeholder="01 A 123 BC" spellCheck={false} autoCapitalize="characters" autoCorrect="off" />
                <button className="btn" disabled={!plate.trim()} onClick={enter} style={{ marginTop: 9 }}>🚗 Kirgizish (POST)</button>
              </div>
            )}
            {selSpot && selSpot.bandmi && (
              <div className="frame fade-step" style={{ padding: 13, boxShadow: `inset 0 0 0 1.5px ${T.danger}55` }}>
                <p className="note-h" style={{ color: T.danger }}>🟥 {selSpot.raqam} — {selSpot.mashina}</p>
                <button className="btn" onClick={exit} style={{ background: T.success }}>Chiqarish · {sp(FEE)} so'm</button>
              </div>
            )}
            <p className="flow-label" style={{ margin: '4px 0 0' }}>Tarix (JOIN bilan)</p>
            {tarix.length ? <div className="tarix">{tarix.map((t, i) => <div key={i} className="tarix-row el-in"><span className="mono" style={{ color: T.accent }}>{t.raqam}</span><span className="mono">{t.mashina}</span><span style={{ marginLeft: 'auto', fontWeight: 700 }}>{sp(t.tolov)}</span></div>)}</div>
              : <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>Chiqishlar shu yerda yoziladi…</p>}
          </Col>
          <Col>
            <p className="flow-label">Qorovul paneli</p>
            <GuardPanel spots={spots} onSpotClick={pickSpot} tushum={tushum} selectedId={sel} />
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>🎉 To'liq ishlaydigan panel! Bo'sh/band, tushum, tarix — hammasi jonli. Mana — sizning fullstack loyihangiz.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 15 — QOIDA: XULOSA =====
const Screen15 = ({ screen, onNext, onPrev }) => (
  <Stage eyebrow="Qoida · xulosa" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Oxirgi qadam →" onClick={onNext} /></>}>
    <div className="screen" style={{ gap: 'clamp(12px,2vw,18px)' }}>
      <div className="head"><h2 className="title h-title fade-up">Fullstack loyiha — <span className="italic" style={{ color: T.accent }}>bir qarashda</span> nima?</h2></div>
      <Mentor>Siz bugun to'liq stackni yig'dingiz: front (panel) + server (kirish/chiqish) + baza (2 jadval). Eng muhim yangilik — <b style={{ color: T.ink }}>ikki jadval bog'lanishi</b> (joy_id ↔ id, JOIN).</Mentor>
      <Zoomable>
      <Split>
        <Col>
          <p className="flow-label">Loyiha qismlari</p>
          <div className="roadmap">
            <div className="step-card"><span className="step-num">01</span><span className="step-body"><span className="step-text">Baza — 2 jadval</span><span className="step-tag">joylar ◄ joy_id sessiyalar</span></span></div>
            <div className="step-card"><span className="step-num">02</span><span className="step-body"><span className="step-text">Server — kirish/chiqish</span><span className="step-tag">POST · PUT</span></span></div>
            <div className="step-card"><span className="step-num">03</span><span className="step-body"><span className="step-text">Front — qorovul paneli</span><span className="step-tag">🟩 / 🟥</span></span></div>
            <div className="step-card"><span className="step-num">04</span><span className="step-body"><span className="step-text">Tarix — JOIN</span><span className="step-tag">joy_id = id</span></span></div>
          </div>
        </Col>
        <Col>
          <p className="flow-label">Yodda tuting</p>
          <div className="frame-success"><p className="body" style={{ margin: 0, color: T.ink }}><b>Bog'lanish</b>: joy_id foreign key joylar.id ga ishora qiladi; <b>JOIN</b> ularni birga ko'rsatadi.</p></div>
          <div className="frame" style={{ padding: 14 }}><p className="body" style={{ margin: 0, color: T.ink2 }}>PM darsidan: avval <b style={{ color: T.ink }}>foydalanuvchi</b>ni (qorovul) o'ylang. Rollar: <b style={{ color: T.ink }}>ME'MOR</b> (loyihachi), <b style={{ color: T.ink }}>REJISSYOR</b> (buyruq beruvchi), <b style={{ color: T.ink }}>NAZORATCHI</b> (sinovchi).</p></div>
        </Col>
      </Split>
      </Zoomable>
    </div>
  </Stage>
);

// ===== SCREEN 16 — YAKUNIY (VS Code: JOIN ON) =====
const Screen16 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [value, setValue] = useState(storedAnswer?.picked || '');
  const [passed, setPassed] = useState(!!storedAnswer?.correct);
  const norm = value.replace(/\s+/g, ' ').trim();
  const valid = /^(sessiyalar|s)\s*\.\s*joy_id\s*=\s*(joylar|j)\s*\.\s*id$/i.test(norm) || /^(joylar|j)\s*\.\s*id\s*=\s*(sessiyalar|s)\s*\.\s*joy_id$/i.test(norm);
  const hasJoyId = /joy_id/i.test(value);
  const hasId = /joylar\s*\.\s*id|\bj\s*\.\s*id/i.test(value);
  useEffect(() => {
    if (valid && !passed) {
      setPassed(true);
      onAnswer(screen, { stage: 'final', screenIdx: screen, question: 'VS Code: JOIN ON shartini yozing', studentAnswer: value, correct: true, firstAttemptCorrect: true, solved: true, picked: value });
    }
  }, [valid]);
  const Ln = ({ n, children }) => (<div className="vsc-line"><span className="vsc-ln">{n}</span><span style={{ whiteSpace: 'pre' }}>{children}</span></div>);
  return (
    <Stage eyebrow="Yakuniy · amaliy" screen={screen} scrollSignal={passed} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!passed} label={passed ? 'Davom etish' : "Bog'lanish shartini yozing"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Oxirgi qadam: <span className="italic" style={{ color: T.accent }}>bog'lanish</span> shartini o'zingiz yozing.</h2></div>
        <Mentor>Tarixni o'qiladigan qilish uchun JOIN kerak — ikki jadval <b style={{ color: T.ink }}>qaysi ustunlar bo'yicha</b> bog'lanadi? <span className="mono">ON</span> dan keyin yozing: <span className="mono">sessiyalar.joy_id = joylar.id</span>.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="vsc fade-up delay-2">
              <div className="vsc-bar"><span className="vsc-tab on"><span style={{ color: '#8FD3A8' }}>🟢</span> tarix.sql <span style={{ color: '#6E7681', marginLeft: 4 }}>×</span></span></div>
              <div className="vsc-body">
                <Ln n={1}><Jx>{'SELECT'}</Jx>{' raqam, mashina, tolov'}</Ln>
                <Ln n={2}><Jx>{'FROM'}</Jx>{' sessiyalar'}</Ln>
                <Ln n={3}><Jx>{'JOIN'}</Jx>{' joylar'}</Ln>
                <div className="vsc-line">
                  <span className="vsc-ln">4</span>
                  <span style={{ whiteSpace: 'pre' }}>{'  '}<span style={{ color: '#FFD380' }}>ON</span>{' '}</span>
                  <input className={`vsc-input ${valid ? 'ok' : ''}`} value={value} onChange={e => setValue(e.target.value)} placeholder="sessiyalar.joy_id = joylar.id" spellCheck={false} autoCapitalize="off" autoCorrect="off" />
                </div>
              </div>
            </div>
            <div className="fade-up delay-2" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="tagpill" style={{ opacity: hasJoyId ? 1 : 0.4 }}>{hasJoyId ? '✓' : '1'} sessiyalar.joy_id</span>
              <span className="tagpill" style={{ opacity: hasId ? 1 : 0.4 }}>{hasId ? '✓' : '2'} joylar.id</span>
            </div>
            {passed && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Mukammal! Ikki jadval bog'landi — tarix endi joy belgisi bilan o'qiladi. Loyihangiz to'liq tayyor!</p></div>}
          </Col>
          <Col>
            <p className="flow-label">natija — tarix</p>
            {valid
              ? <Table cap="sessiyalar JOIN joylar" cols={['raqam', 'mashina', 'tolov']} rows={[{ raqam: 'A2', mashina: '01A123BC', tolov: sp(FEE) }, { raqam: 'B1', mashina: '01B456DE', tolov: sp(FEE) }]} hiCol="raqam" />
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0, textAlign: 'center' }}>ON sharti yozilmaguncha jadvallar bog'lanmaydi…</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 17 — YAKUN =====
const Screen17 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const RECAP = [
    "PM: avval foydalanuvchini (qorovul) o'ylab, sodda panel qurdik",
    "2 jadval: joylar ◄ joy_id sessiyalar (foreign key bog'lanishi)",
    "Backend: kirish (POST) joyni band, chiqish (PUT) bo'sh + tolov",
    "Front: 🟩/🟥 panel, serverdan jonli",
    "JOIN: ikki jadvalni joy_id = id bo'yicha birlashtirib, tarix o'qiladi"
  ];
  const HOMEWORK = [
    { b: "Joy qo'shing", t: "— stoyankaga yangi joylar (C1, C2...) qo'shib ko'ring" },
    { b: 'Vaqtga qarab tolov', t: "— 1 soat = 5 000 qilib, tolovni vaqtdan hisoblang" },
    { b: 'Tushum hisoboti', t: "— kunlik jami tushumni JOIN/SUM bilan chiqaring" }
  ];
  const GLOSSARY = [
    { b: 'foreign key (joy_id)', t: "— sessiyani joyga bog'lovchi ustun" },
    { b: 'one-to-many', t: '— bitta joy → ko\'p sessiya' },
    { b: 'JOIN', t: '— ikki jadvalni bog\'lovchi ustun bo\'yicha birlashtirish' },
    { b: 'BOOLEAN', t: '— ha/yo\'q (bandmi: true/false)' },
    { b: 'POST / PUT', t: '— kirish (yangi) / chiqish (yangilash)' },
    { b: 'NOW()', t: '— hozirgi vaqtni avtomatik yozish' },
    { b: 'UX (qorovul uchun)', t: '— rang bilan holat, katta tugma, kam matn' }
  ];
  const correct = SCORED_IDX.filter(i => answers[i]?.correct).length;
  const total = SCORED_IDX.length;
  const PASSED = (total ? correct / total : 0) >= 0.6;
  const [open, setOpen] = useState(false);
  const glossRef = useRef(null);
  const isNarrow = useIsMobile(768);
  const toggleGloss = () => setOpen(o => { const nv = !o; if (nv && isNarrow) setTimeout(() => { if (glossRef.current) glossRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 80); return nv; });
  return (
    <Stage eyebrow="Tayyor" screen={screen} navContent={<><NavBack onPrev={onPrev} /><button className="btn-ghost" onClick={onReset} style={{ padding: 'clamp(11px,1.6vw,13px) clamp(16px,2.2vw,22px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Qaytadan</button><button className="btn-white-accent" onClick={onFinish} style={{ marginLeft: 'auto', padding: 'clamp(11px,1.6vw,13px) clamp(22px,2.6vw,30px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Yakunlash ✓</button></>}>
      <div className="screen">
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">✓</span> Fullstack loyiha kuni tugadi</span><h2 className="title h-title fade-up d1">AvtoStoyanka panelini <span className="italic" style={{ color: T.accent }}>o'zingiz qurdingiz</span>.</h2><p className="body h-sub fade-up d2">{PASSED ? "Tabriklaymiz! Qorovul ishlata oladigan to'liq ilova: baza, server, panel — hammasi bir butun." : "Yaxshi harakat! Bog'lanish (joy_id) va JOIN'ni mustahkamlash uchun bir-ikki ekranni qayta ko'ring."}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span className="tick" style={{ width: 16, height: 16, borderRadius: '50%', background: T.success, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck">✓</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>📝 Uyga vazifa</div><p className="body" style={{ margin: '0 0 10px', color: T.ink }}>Antigravity bilan panelni kengaytiring:</p><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">🚀 Loyihangiz tayyor! Keyingi praktikada — uni sinfdoshlaringizga ko'rsatamiz, fikr (feedback) yig'amiz va yaxshilaymiz.</p></div>
        </div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">💡 Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function FullstackProjectDayLesson({ lang: langProp, onFinished }) {
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

  const screens = [Screen0, Screen1, Screen2, Screen3, Screen4, Screen5, Screen6, Screen7, Screen8, Screen9, Screen9b, Screen10, Screen11, Screen12, Screen13, Screen14, Screen15, Screen16, Screen17];
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
        .delay-1 { animation-delay: 0.12s; } .delay-2 { animation-delay: 0.24s; } .delay-3 { animation-delay: 0.36s; } .delay-4 { animation-delay: 0.48s; }
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
        .btn-ghost:disabled { opacity: 0.4; cursor: not-allowed; }
        .btn-soft { font-family: 'Manrope'; font-weight: 600; cursor: pointer; transition: all 0.2s; background: ${T.bg}; color: ${T.ink}; border: none; border-radius: 10px; padding: 9px 15px; font-size: 13px; }
        .btn-soft:hover:not(:disabled) { box-shadow: 0 6px 14px -5px rgba(${T.shadowBase},0.2); }
        .btn-soft:disabled { opacity: 0.6; cursor: not-allowed; }

        /* === OPSIYALAR === */
        .option { background: ${T.paper}; cursor: pointer; transition: all 0.2s; font-family: 'Manrope', sans-serif; font-weight: 500; text-align: left; border-radius: 12px; width: 100%; border: none; color: ${T.ink}; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.14); }
        .option:hover:not(:disabled) { background: #FDFBF7; box-shadow: 0 10px 22px -6px rgba(${T.shadowBase},0.22); }
        .option:disabled { cursor: default; }
        .option-correct { background: ${T.successSoft} !important; color: ${T.success} !important; box-shadow: 0 8px 22px -6px rgba(31,122,77,0.32) !important; }
        .option-wrong { background: ${T.paper} !important; color: ${T.ink3} !important; opacity: 0.55 !important; box-shadow: 0 4px 12px -6px rgba(${T.shadowBase},0.08) !important; }
        .option-picked-wrong { background: ${T.accentSoft} !important; color: ${T.accent} !important; box-shadow: 0 8px 22px -6px rgba(255,79,40,0.38) !important; }

        .gchip { font-family: 'Manrope'; font-weight: 600; font-size: 12.5px; padding: 8px 13px; border-radius: 99px; border: none; background: ${T.paper}; color: ${T.ink}; cursor: pointer; transition: all 0.18s; box-shadow: 0 3px 10px -5px rgba(${T.shadowBase},0.2); display: inline-flex; align-items: center; gap: 6px; } .gchip:hover:not(:disabled) { transform: translateY(-1px); }
        .chip { font-family: 'Manrope', sans-serif; font-weight: 600; font-size: clamp(13px,1.6vw,15px); display: inline-flex; align-items: center; gap: 8px; padding: 9px 15px; border-radius: 99px; border: none; background: ${T.paper}; color: ${T.ink}; cursor: pointer; transition: all 0.18s; box-shadow: 0 4px 12px -5px rgba(${T.shadowBase},0.18); }
        .chip:hover:not(:disabled) { transform: translateY(-1px); }
        .tagpill { font-family: 'JetBrains Mono', monospace; font-size: 12.5px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 99px; background: ${T.paper}; color: ${T.ink}; box-shadow: 0 3px 10px -5px rgba(${T.shadowBase},0.18); transition: opacity 0.2s; }

        /* === VCARD === */
        .vcard { display: flex; align-items: center; gap: 11px; width: 100%; text-align: left; background: ${T.paper}; border: none; border-radius: 12px; padding: 12px 15px; cursor: pointer; transition: all 0.18s; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.16); }
        .vcard:hover { transform: translateY(-1px); }
        .vbadge { font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 11px; color: #fff; padding: 4px 9px; border-radius: 6px; letter-spacing: 0.02em; }
        .vlbl { font-family: 'Manrope', sans-serif; font-weight: 700; font-size: 13.5px; color: ${T.ink}; }
        .vseen { margin-left: auto; font-weight: 700; }

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

        .bp-window { border-radius: 13px; overflow: hidden; background: #fff; box-shadow: 0 10px 26px -6px rgba(${T.shadowBase},0.16); }
        .bp-bar { background: #f0eee8; padding: 8px 11px; display: flex; align-items: center; gap: 9px; }
        .bb-dots { display: flex; gap: 5px; } .bb-dots i { width: 9px; height: 9px; border-radius: 50%; }
        .bb-dots i:first-child { background: #ff5f57; } .bb-dots i:nth-child(2) { background: #febc2e; } .bb-dots i:nth-child(3) { background: #28c840; }
        .bp-title { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink3}; }
        .bp-body { padding: clamp(10px,1.8vw,14px); background: #FBFAF7; }

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

        /* === AI CARD === */
        .ai-card { background: ${T.paper}; border-radius: 14px; padding: 15px 17px; display: flex; flex-direction: column; gap: 11px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.14); }
        .ai-row { display: flex; align-items: center; gap: 9px; } .ai-badge { font-family: 'Manrope'; font-weight: 800; font-size: 11px; color: #fff; background: ${T.blue}; padding: 3px 9px; border-radius: 6px; } .ai-bubble { font-size: 13px; color: ${T.ink2}; }
        .ai-code { background: ${CODE.bg}; border-radius: 9px; padding: 10px 12px; display: flex; flex-direction: column; gap: 3px; }
        .ai-line { font-family: 'JetBrains Mono'; font-size: 12px; color: ${CODE.text}; padding: 7px 9px; border-radius: 6px; white-space: pre-wrap; line-height: 1.6; }
        .ai-line.ok { background: rgba(31,122,77,0.16); }
        .note-h { font-weight: 700; font-size: 13px; margin: 0 0 4px; }
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

        .code-box { background: ${CODE.bg}; color: ${CODE.text}; font-family: 'JetBrains Mono', monospace; font-size: clamp(12px,1.5vw,13.5px); line-height: 1.55; padding: clamp(12px,2.2vw,16px); border-radius: 12px; overflow-x: auto; white-space: pre-wrap; word-break: break-word; margin: 0; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.2); }
        .prompt-box { background: #FFF8F3; border-left: 4px solid ${T.accent}; border-radius: 12px; padding: 13px 15px; margin: 0; font-family: 'JetBrains Mono', monospace; font-size: clamp(11.5px,1.4vw,13px); line-height: 1.7; color: ${T.ink}; white-space: pre-wrap; word-break: break-word; box-shadow: 0 6px 16px -8px rgba(${T.shadowBase},0.18); }
        .plate-input { width: 100%; font-family: 'JetBrains Mono', monospace; font-size: 16px; font-weight: 700; letter-spacing: 0.06em; text-align: center; padding: 11px 12px; border-radius: 10px; border: 1.5px dashed ${T.ink3}; background: ${T.bg}; color: ${T.ink}; outline: none; transition: border-color 0.2s, background 0.2s; }
        .plate-input:focus { border-color: ${T.accent}; background: #fff; }
        .plate-input::placeholder { color: ${T.ink3}; font-weight: 500; letter-spacing: 0.02em; }

        /* === QOROVUL PANELI === */
        .guard { border-radius: 14px; overflow: hidden; background: #fff; box-shadow: 0 10px 26px -6px rgba(${T.shadowBase},0.2); }
        .guard-top { background: ${CODE.bg}; color: #fff; padding: 10px 14px; display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .guard-title { font-family: 'Manrope'; font-weight: 800; font-size: 13.5px; } .guard-title small { font-weight: 500; color: ${CODE.punct}; }
        .guard-stats { display: flex; gap: 8px; } .gst { font-family: 'Manrope'; font-weight: 800; font-size: 12px; padding: 3px 9px; border-radius: 99px; } .gst.free { background: rgba(31,122,77,0.25); } .gst.busy { background: rgba(194,54,43,0.3); }
        .guard-body { padding: 12px; }
        .guard-foot { padding: 9px 14px; background: ${T.bg}; font-family: 'Manrope'; font-weight: 600; font-size: 12.5px; color: ${T.ink2}; display: flex; align-items: center; justify-content: space-between; gap: 8px; } .guard-foot b { color: ${T.ink}; }
        .pgrid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; }
        .spot { border: none; border-radius: 12px; padding: 10px 6px; display: flex; flex-direction: column; align-items: center; gap: 3px; min-height: 80px; justify-content: center; position: relative; transition: all 0.2s; }
        .spot.free { background: ${T.successSoft}; box-shadow: inset 0 0 0 1.5px rgba(31,122,77,0.28); }
        .spot.busy { background: ${T.dangerSoft}; box-shadow: inset 0 0 0 1.5px rgba(194,54,43,0.35); }
        .spot:not(:disabled):hover { transform: translateY(-2px); box-shadow: 0 8px 18px -6px rgba(${T.shadowBase},0.28); }
        .spot.spot-sel { box-shadow: inset 0 0 0 2px ${T.accent}, 0 8px 18px -6px rgba(255,79,40,0.4); }
        .spot-tag { font-family: 'Manrope'; font-weight: 800; font-size: 8px; color: #fff; padding: 1px 7px; border-radius: 99px; letter-spacing: 0.04em; }
        .spot-ico { font-size: 21px; line-height: 1; }
        .spot.free .spot-ico { color: ${T.ink3}; opacity: 0.5; }
        .spot-num { font-family: 'JetBrains Mono'; font-weight: 800; font-size: 14px; }
        .spot.free .spot-num { color: ${T.success}; } .spot.busy .spot-num { color: ${T.danger}; }
        .spot-plate { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 8.5px; color: ${T.danger}; }

        /* === DB JADVAL === */
        .db { border-radius: 12px; overflow: hidden; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.18); background: #fff; }
        .db-cap { background: #e9e5dc; padding: 8px 12px; font-family: 'Manrope', sans-serif; font-size: 12px; font-weight: 600; color: ${T.ink2}; } .db-cap b { color: ${T.ink}; } .db-cap span { color: ${T.ink3}; }
        .db-row { display: grid; gap: 8px; padding: 8px 12px; align-items: center; font-family: 'JetBrains Mono', monospace; font-size: 12px; color: ${T.ink}; border-top: 1px solid #eee; }
        .db-head { background: ${CODE.bg}; color: ${CODE.punct}; font-weight: 700; border-top: none; }
        .db-row.flash { background: ${T.successSoft}; }

        /* === BOG'LANISH (rel) === */
        .rel { display: flex; flex-direction: column; gap: 8px; align-items: center; }
        .rel-box { width: 100%; background: #fff; border-radius: 11px; padding: 10px 13px; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.18); display: flex; flex-wrap: wrap; align-items: center; gap: 8px; } .rel-box b { font-family: 'Manrope'; font-weight: 800; font-size: 12.5px; color: ${T.ink}; margin-right: 4px; } .rel-box .mono { font-size: 11px; color: ${T.ink3}; background: ${T.bg}; padding: 2px 7px; border-radius: 6px; }
        .rel-link { display: flex; align-items: center; gap: 8px; font-family: 'JetBrains Mono'; font-size: 11.5px; } .rel-key { font-weight: 700; } .rel-arr { color: ${T.blue}; font-weight: 700; } .rel-to { color: ${T.ink2}; }

        /* === TARIX === */
        .tarix { display: flex; flex-direction: column; gap: 5px; }
        .tarix-row { display: flex; align-items: center; gap: 10px; background: #fff; border-radius: 9px; padding: 8px 11px; font-family: 'JetBrains Mono'; font-size: 11.5px; box-shadow: 0 3px 10px -6px rgba(${T.shadowBase},0.16); }

        /* === HOOK QOG'OZ === */
        .paper { background: #FCFBF5; border-radius: 10px; padding: 14px 16px; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.2); cursor: pointer; background-image: repeating-linear-gradient(transparent, transparent 25px, #ece4d0 25px, #ece4d0 26px); }
        .paper-line { font-family: 'Caveat', 'Comic Sans MS', cursive; font-size: 14.5px; color: ${T.ink2}; line-height: 26px; margin: 0; }
        .paper-scribble { font-family: 'Caveat', cursive; font-size: 15px; color: ${T.danger}; line-height: 26px; margin: 4px 0 0; transform: rotate(-2deg); font-weight: 700; }

        /* === SILKINISH === */
        @keyframes shake { 0%,100% { transform: none; } 25% { transform: translateX(-4px); } 50% { transform: translateX(4px); } 75% { transform: translateX(-3px); } }
        .shake { animation: shake 0.4s ease; }

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
