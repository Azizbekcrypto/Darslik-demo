import React, { useState, useEffect, useRef, createContext, useContext, useCallback, useMemo } from 'react';

// ============================================================
// MA'LUMOT VA BACKEND MODULI · PRAKTIKA 2 — FULLSTACK ULASH: AVTOIJARA (React front + Node back) — PLATFORM STANDARD v16 (AUDIOSIZ)
// O'RNI: 4-Modul, "Backend CRUD (P1)" va "API/Postman" darslaridan KEYIN.
//        O'quvchi biladi: Express+pg CRUD backend (P1), React (komponent/useState/useEffect/props/fetch GET — Modul 3), API/Postman.
// Mavzu: Modul 3'dagi AvtoIjara React frontini P1'da qurilgan backendga ULASH. Qattiq `const cars=[]` o'rniga fetch(GET /api/cars).
// YANGI: 2 dastur bir vaqtda (5173+3000), fetch↔API, loading/error holatlari, CORS (#1 fullstack bug, IJOBIY debug ramkasi).
// HALQA: ME'MOR (ma'lumot oqimini chizadi) → REJISSYOR (AI'ga fetch promptini beradi) → NAZORATCHI (brauzerda sinaydi, CORS tuzatadi).
// KO'PRIK: yakunda — to'liq aylana (forma→POST→DB→GET→UI, refresh'da saqlanadi) → Praktika 3 (loyiha kuni) ga intro.
// VIZUAL: haqiqiy ko'rinishdagi AvtoIjara sayti (navbar/hero/scard), loading skeleton, error, server'dan to'lish — o'quvchi ko'rib his qiladi.
// PEDAGOGIKA: AI tez yozadi, siz tekshirasiz; xato = tabiiy, matni yo'l ko'rsatadi. "sehr"/"g'isht" yo'q. AUDIOSIZ. Sarlavhalar = qiziqarli savol.
// Yakuniy ekran (s16): mock VS Code — useEffect ichidagi fetch(...) URL'ini qo'lda yozish.
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

const LESSON_META = { lessonId: 'fullstack-connect-practice-p2-v16', lessonTitle: { uz: 'Praktika: Fullstack ulash — AvtoIjara', ru: 'Практика: Fullstack связка — AvtoIjara' } };
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
  { id: 's9',  type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's10', type: 'case',        template: 'custom',   scored: false, scope: null },
  { id: 's11', type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's12', type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's13', type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's14', type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's15', type: 'rule',        template: 'custom',   scored: false, scope: null },
  { id: 's16', type: 'test',        template: 'custom',   scored: true,  scope: 'final' },
  { id: 's17', type: 'summary',     template: 'custom',   scored: false, scope: null }
];
const TOTAL_SCREENS = SCREEN_META.length;
const SCORED_IDX = SCREEN_META.map((m, i) => (m.scored ? i : null)).filter(i => i !== null);

const Split = ({ children }) => <div className="split">{children}</div>;
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
    // bo'sh joyga bosilganda — yuqoriga sur (toza ko'rinish). Tugma bosilsa — scrollSignal o'zi pastga suradi.
    const isControl = tgt && tgt.closest && tgt.closest('button, input, a, .vcard, .option, .hook-option');
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

// javoblarni aralashtirish — barqaror (screen bo'yicha); to'g'ri javob HECH QACHON 1-o'rinda turmaydi, har ekranda har xil joyda
function placeCorrect(n, correctIdx, screen) {
  const others = [];
  for (let i = 0; i < n; i++) if (i !== correctIdx) others.push(i);
  let seed = ((screen + 7) * 48271) % 2147483647;
  const rnd = () => { seed = (seed * 48271) % 2147483647; return seed / 2147483647; };
  for (let i = others.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = others[i]; others[i] = others[j]; others[j] = t; }
  const pos = n > 1 ? 1 + (screen % (n - 1)) : 0; // 1..n-1 — birinchi o'rin emas
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
        <svg viewBox="0 0 40 40" width="40" height="40">
          <circle cx="20" cy="20" r="20" fill={T.accentSoft} />
          <circle cx="20" cy="16" r="6" fill={T.accent} />
          <path d="M8 36 a12 9 0 0 1 24 0 Z" fill={T.accent} />
        </svg>
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
const TLine = ({ cmd, out, dim }) => (
  <div className="el-in" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 'clamp(11.5px,1.4vw,13px)', lineHeight: 1.7, color: dim ? CODE.comment : CODE.text }}>
    {cmd ? <><span style={{ color: CODE.str }}>$</span> <span style={{ color: CODE.text }}>{cmd}</span></> : out}
  </div>
);

// ===== AVTOIJARA MA'LUMOTLARI =====
const sp = n => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
const CARS = [
  { id: 1, nom: 'Chevrolet Cobalt',  narx: 280000, yil: 2022, emoji: '🚗', bandmi: false, rating: '4.8', bg: 'linear-gradient(135deg,#7EA6F4,#2E4A9E)' },
  { id: 2, nom: 'Chevrolet Malibu',  narx: 520000, yil: 2023, emoji: '🚙', bandmi: true,  rating: '4.9', bg: 'linear-gradient(135deg,#8FD3A8,#2E7A4E)' },
  { id: 3, nom: 'Kia K5',            narx: 610000, yil: 2023, emoji: '🚘', bandmi: false, rating: '4.7', bg: 'linear-gradient(135deg,#F4B26A,#C9622E)' }
];
const SPARK = { id: 4, nom: 'Chevrolet Spark', narx: 190000, yil: 2021, emoji: '🚐', bandmi: false, rating: '4.6', bg: 'linear-gradient(135deg,#F4A6C0,#B5446E)' };
const TRACKER = { id: 5, nom: 'Chevrolet Tracker', narx: 450000, yil: 2024, emoji: '🚓', bandmi: false, rating: '5.0', bg: 'linear-gradient(135deg,#B9A8F4,#6A4AC9)' };
const CARS_DB = [...CARS, SPARK]; // bazada (P1'da Spark qo'shilgan)

// ===== HAQIQIY KO'RINISHDAGI AVTOIJARA SAYTI =====
const SiteCard = ({ car, isNew }) => (
  <div className={`scard el-in ${isNew ? 'scard-new' : ''}`}>
    <div className="scard-img" style={{ background: car.bg }}>
      <span className="scard-emoji">{car.emoji}</span>
      <span className={`scard-tag ${car.bandmi ? 'busy' : 'free'}`}>{car.bandmi ? 'Band' : "Bo'sh"}</span>
      {isNew && <span className="scard-newbadge">yangi</span>}
    </div>
    <div className="scard-info">
      <div className="scard-top"><span className="scard-name">{car.nom}</span><span className="scard-year">{car.yil}</span></div>
      <div className="scard-meta">★ {car.rating} · Avtomat · Konditsioner</div>
      <div className="scard-bottom">
        <span className="scard-price">{sp(car.narx)}<small> so'm/kun</small></span>
        <span className="scard-btn">Ijaraga olish</span>
      </div>
    </div>
  </div>
);
const AvtoSite = ({ cars = [], state = 'data', newId, cols = 3 }) => (
  <div className="site">
    <div className="site-nav">
      <span className="site-logo">🚗 Avto<b>Ijara</b></span>
      <span className="site-links"><span>Bosh sahifa</span><span className="on">Mashinalar</span><span>Aloqa</span></span>
    </div>
    <div className="site-hero"><span className="site-h">Ijaraga mashinalar</span><span className="site-sub">Toshkent bo'ylab · kunlik ijara</span></div>
    <div className="site-main">
      {state === 'loading'
        ? <div className="site-grid" style={{ gridTemplateColumns: `repeat(${cols},1fr)` }}>{[0, 1, 2].slice(0, cols).map(i => <div key={i} className="scard skel"><div className="scard-img skel-box" /><div className="scard-info"><div className="skel-line" /><div className="skel-line short" /><div className="skel-line" style={{ width: '50%' }} /></div></div>)}</div>
        : state === 'error'
          ? <div className="site-msg err"><span className="site-msg-ico">⚠️</span>Ma'lumotni yuklab bo'lmadi<small>serverga ulanib bo'lmadi</small></div>
          : cars.length
            ? <div className="site-grid" style={{ gridTemplateColumns: `repeat(${cols},1fr)` }}>{cars.map(c => <SiteCard key={c.id} car={c} isNew={c.id === newId} />)}</div>
            : <div className="site-msg"><span className="site-msg-ico">🚗</span>Hozircha mashina yo'q</div>}
    </div>
  </div>
);

// PostgreSQL jadval (hook va to'liq aylana uchun)
const DbTable = ({ rows, flashId }) => (
  <div className="db">
    <div className="db-cap">🗄️ <b>cars</b> <span>· {rows.length} qator</span></div>
    <div className="db-row db-head"><span>id</span><span>nom</span><span>narx</span><span>yil</span></div>
    {rows.map(r => (
      <div key={r.id} className={`db-row el-in ${flashId === r.id ? 'flash' : ''}`}>
        <span>{r.id}</span><span>{r.nom}</span><span>{sp(r.narx)}</span><span>{r.yil}</span>
      </div>
    ))}
  </div>
);

// Brauzer konsoli (CORS xatosi uchun)
const Konsol = ({ children, error }) => (
  <div className="kons"><div className="kons-bar"><span className="kons-dot" /> Console</div><div className={`kons-body ${error ? 'err' : ''}`}>{children}</div></div>
);

// ===== SCREEN 0 — HOOK (sayt eski ro'yxat, baza yangi — ulanmagan) =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [tried, setTried] = useState(!!storedAnswer);
  const [shaking, setShaking] = useState(false);
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const [sc, setSc] = useState(0);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const refresh = () => { setTried(true); setSc(n => n + 1); clearTimeout(timer.current); setShaking(true); timer.current = setTimeout(() => setShaking(false), 450); };
  const OPTS = [
    { id: 'a', label: "Sayt buzilgan — qaytadan yozish kerak" },
    { id: 'b', label: "Sayt baza bilan ulanmagan — gaplashmaydi" },
    { id: 'c', label: "Spark mashinasi yomon — o'chirish kerak" }
  ];
  const pick = (v) => { if (picked !== null || !tried) return; setPicked(v); setSc(n => n + 1); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: true }); };
  return (
    <Stage eyebrow="Kirish" screen={screen} scrollSignal={sc} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 880 }}>Bazaga mashina qo'shdik — lekin saytda <span className="italic" style={{ color: T.accent }}>ko'rinmayapti</span>. Nega?</h1>
        <Mentor>Praktika 1'da Postman orqali bazaga <b style={{ color: T.ink }}>Chevrolet Spark</b>'ni qo'shgan edingiz — o'ngda, bazada u bor. Lekin chapdagi AvtoIjara saytida Spark <b style={{ color: T.ink }}>yo'q</b>! Saytni yangilab ko'ring (🔄) — paydo bo'ladimi?</Mentor>
        <Split>
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p className="flow-label" style={{ margin: 0 }}>Sayt — front (localhost:5173)</p>
              <button className={`chip ${shaking ? 'shake' : ''}`} onClick={refresh} style={{ padding: '7px 13px', fontSize: 13 }}>🔄 Yangilash</button>
            </div>
            <div className={`fade-up delay-1 ${shaking ? 'shake' : ''}`}><Win title="avtoijara.uz" minH={150}><AvtoSite cars={CARS} cols={2} /></Win></div>
            {tried && <p className="small fade-step" style={{ color: T.accent, fontStyle: 'italic', margin: 0 }}>Yangiladingiz — lekin baribir 3 ta mashina. Spark yo'q!</p>}
          </Col>
          <Col>
            <p className="flow-label fade-up delay-2" style={{ margin: 0 }}>Baza — back (localhost:3000)</p>
            <div className="fade-up delay-2"><DbTable rows={CARS_DB} flashId={SPARK.id} /></div>
            <p className="eyebrow fade-up delay-3" style={{ color: T.ink2, margin: '4px 0 0' }}>Sayt 3 ta, baza 4 ta. Nega ular bir xil emas?</p>
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
            {!tried && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>Avval 🔄 Yangilash'ni bosing ←</p>}
            {picked !== null && <p className="hook-ack fade-step">Aynan! Sayt mashinalarni hali ham kodga yozilgan eski ro'yxatdan oladi — <b>bazaga ulanmagan</b>. Bugun ularni ulaymiz: sayt ma'lumotni to'g'ridan-to'g'ri <b>serverdan</b> oladigan bo'ladi.</p>}
          </Col>
        </Split>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const STEPS = [
    { text: 'Ma\'lumot oqimini chizasiz', tag: 'ME\'MOR — qayerdan keladi?' },
    { text: 'AI fetch kodini yozadi', tag: 'REJISSYOR — buyruq' },
    { text: 'Brauzerda sinab, CORS\'ni tuzatasiz', tag: 'NAZORATCHI — test' },
    { text: 'Formani ulaysiz (POST)', tag: 'to\'liq aylana' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const PreviewBlock = (
    <Col>
      <p className="flow-label">Dars oxirida — sayt serverdan o'qiydi</p>
      <Win title="avtoijara.uz" minH={150}><AvtoSite cars={CARS_DB} newId={SPARK.id} cols={2} /></Win>
      <p className="mono small" style={{ color: T.accent, margin: 0 }}>→ Spark paydo bo'ldi! Sayt endi bazadagi 4 mashinani ko'rsatadi</p>
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
        <div className="head"><h2 className="title h-title fade-up">Frontni backendga <span className="italic" style={{ color: T.accent }}>qanday</span> ulaymiz?</h2></div>
        <Mentor>Sizda ikki yarim bor: Modul 3'dagi <b style={{ color: T.ink }}>sayt</b> (front) va Praktika 1'dagi <b style={{ color: T.ink }}>server</b> (back). Bugun ularni gaplashtiramiz. Yana o'sha uch rol: <b style={{ color: T.ink }}>ME'MOR</b> (ma'lumot oqimini chizasiz) → <b style={{ color: T.ink }}>REJISSYOR</b> (AI'ga buyruq berasiz) → <b style={{ color: T.ink }}>NAZORATCHI</b> (brauzerda sinaysiz).</Mentor>
        {!isNarrow ? (
          <Split>{PreviewBlock}{StepsBlock}</Split>
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

// ===== SCREEN 2 — IKKI DASTUR BIR VAQTDA =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [front, setFront] = useState(!!storedAnswer);
  const [back, setBack] = useState(!!storedAnswer);
  const done = front && back;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Asos · 2 dastur" screen={screen} scrollSignal={done} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Ikkalasini ishga tushiring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Sayt va server — <span className="italic" style={{ color: T.accent }}>bitta dasturmi</span> yoki ikkita?</h2></div>
        <Mentor>Fullstack ilovada <b style={{ color: T.ink }}>ikkita alohida dastur</b> bir vaqtda ishlaydi: <b style={{ color: T.ink }}>front</b> (sayt, :5173) va <b style={{ color: T.ink }}>back</b> (server, :3000). Front — ko'rinish, back — ma'lumot. Ular o'zaro <b style={{ color: T.ink }}>HTTP so'rov</b> orqali gaplashadi. Ikkalasini ishga tushiring.</Mentor>
        <div className="split">
          <Col>
            <div className="run-card fade-up delay-1">
              <div className="run-top"><span className="run-name">💻 Front — sayt</span><span className="run-port">:5173</span></div>
              <div className="code-box" style={{ padding: '9px 12px', minHeight: 40 }}>
                <TLine cmd="npm run dev" />
                {front && <TLine out={<span style={{ color: CODE.str }}>✓ Local: http://localhost:5173</span>} />}
              </div>
              <button className="btn-soft" disabled={front} onClick={() => setFront(true)} style={{ alignSelf: 'flex-start' }}>{front ? '✓ Ishlayapti' : '▶ Ishga tushirish'}</button>
            </div>
            <div className="run-card fade-up delay-2">
              <div className="run-top"><span className="run-name">🟢 Back — server</span><span className="run-port">:3000</span></div>
              <div className="code-box" style={{ padding: '9px 12px', minHeight: 40 }}>
                <TLine cmd="node server.js" />
                {back && <TLine out={<span style={{ color: CODE.str }}>✓ Server :3000 da ishlayapti</span>} />}
              </div>
              <button className="btn-soft" disabled={back} onClick={() => setBack(true)} style={{ alignSelf: 'flex-start' }}>{back ? '✓ Ishlayapti' : '▶ Ishga tushirish'}</button>
            </div>
          </Col>
          <Col>
            <p className="flow-label">Ular qanday gaplashadi</p>
            <div className="bridge fade-up delay-2">
              <div className="bridge-end" style={{ opacity: front ? 1 : 0.4 }}><span className="bridge-ico">💻</span><span>Front<br /><small>:5173</small></span></div>
              <div className="bridge-mid">
                <span className="bridge-arr" style={{ color: done ? T.accent : T.ink3 }}>fetch →</span>
                <span className="bridge-line" style={{ background: done ? T.accent : T.ink3 + '55' }} />
                <span className="bridge-arr" style={{ color: done ? T.success : T.ink3 }}>← JSON</span>
              </div>
              <div className="bridge-end" style={{ opacity: back ? 1 : 0.4 }}><span className="bridge-ico">🟢</span><span>Back<br /><small>:3000</small></span></div>
            </div>
            {done
              ? <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Ikkalasi ishlayapti! Front <span className="mono">fetch</span> bilan so'raydi, back <span className="mono">JSON</span> bilan javob beradi. Biri o'chsa — gaplashuv uziladi.</p></div>
              : <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Faqat bittasi ishlasa — ulanish bo'lmaydi. Ikkalasini ham yoqing.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — ME'MOR: MA'LUMOT OQIMI =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [pick, setPick] = useState(storedAnswer ? 'server' : null);
  const [wrong, setWrong] = useState(false);
  const done = pick === 'server';
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const choose = (v) => { if (done) return; if (v === 'server') setPick('server'); else { setPick('hard'); setWrong(true); } };
  return (
    <Stage eyebrow="1-qadam · ME'MOR" screen={screen} scrollSignal={done || wrong} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Ma'lumot manbasini tanlang"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Katalog mashinalarni <span className="italic" style={{ color: T.accent }}>qayerdan</span> olishi kerak?</h2></div>
        <Mentor>AI kod yozishidan oldin <b style={{ color: T.ink }}>siz</b> qaror qilasiz: sayt ma'lumotni qayerdan oladi? Hozir u kodga yozilgan eski ro'yxatdan oladi. To'g'ri manbani tanlang — ma'lumot oqimi chiziladi.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">Ma'lumot manbasi</p>
            <button className="vcard" onClick={() => choose('hard')} style={{ boxShadow: pick === 'hard' ? `inset 0 0 0 1.5px ${T.accent}` : undefined, alignItems: 'flex-start', flexDirection: 'column', gap: 4 }}>
              <span className="vlbl">Kod ichiga yozilgan ro'yxat (eski usul)</span>
              <span className="mono small" style={{ color: T.ink3 }}>const cars = [ ... ]</span>
            </button>
            <button className="vcard" onClick={() => choose('server')} style={{ boxShadow: pick === 'server' ? `inset 0 0 0 1.5px ${T.success}` : undefined, alignItems: 'flex-start', flexDirection: 'column', gap: 4 }}>
              <span className="vlbl">Serverdan, bazadan olish (fetch)</span>
              <span className="mono small" style={{ color: T.ink3 }}>fetch('/api/cars')</span>
            </button>
            {wrong && !done && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bu — eski usul: mashinalar to'g'ridan-to'g'ri kodga yozilgan. Bazaga Spark qo'shilsa ham, sayt buni ko'rmaydi — chunki u koddagi ro'yxatdan o'qiydi. Bazadagi <b>jonli</b> ma'lumot uchun — <span className="mono">fetch</span>.</p></div>}
          </Col>
          <Col>
            <p className="flow-label">Ma'lumot oqimi</p>
            <div className="chain fade-up delay-1">
              <div className="chain-node" style={{ background: T.paper, color: T.ink }}>React katalog</div>
              <span className="chain-arr" style={{ color: done ? T.accent : T.ink3 }}>fetch →</span>
              <div className="chain-node" style={{ background: done ? T.accent : T.paper, color: done ? '#fff' : T.ink3 }}>GET /api/cars</div>
              <span className="chain-arr" style={{ color: done ? T.accent : T.ink3 }}>→</span>
              <div className="chain-node" style={{ background: done ? T.accent : T.paper, color: done ? '#fff' : T.ink3 }}>PostgreSQL</div>
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>To'g'ri! Sayt <span className="mono">fetch</span> bilan serverga boradi, server bazadan oladi. Endi baza yangilansa — sayt ham yangilanadi. Bu — <b>jonli</b> ulanish.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 =====
const Screen4 = (props) => (
  <QuestionScreen {...props} idx={4} scope="module-mikro" eyebrow="Mashq · 1-savol"
    questionText="Sayt (front) va server (back) o'zaro qanday gaplashadi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Front va back o'zaro <span className="italic" style={{ color: T.accent }}>qanday</span> gaplashadi?</h2></>}
    options={["fetch — HTTP so'rov orqali", 'Bir xil fayl ichida — to\'g\'ridan-to\'g\'ri', 'Hech qanday — alohida ishlaydi', 'CSS orqali']} correctIdx={0}
    explainCorrect="To'g'ri! Front fetch bilan serverga HTTP so'rov yuboradi, server JSON bilan javob qaytaradi. Ular alohida dasturlar — faqat shu yo'l bilan gaplashadi."
    explainWrong={{
      1: "Yo'q — ular ikki alohida dastur, bir fayl emas. Bog'lanish faqat HTTP so'rov (fetch) orqali.",
      2: "Aslida ular gaplashishi kerak — fetch orqali. Aks holda sayt ma'lumot ololmaydi.",
      3: "CSS bezak uchun. Ma'lumot olish uchun fetch (HTTP so'rov).",
      default: "Front ↔ back = fetch (HTTP so'rov)."
    }} />
);

// ===== SCREEN 5 — REJISSYOR: FETCH KODINI AI YOZADI =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [done, setDone] = useState(!!storedAnswer);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="2-qadam · REJISSYOR" screen={screen} scrollSignal={done} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "AI'ga buyruq bering"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Mashinalarni serverdan <span className="italic" style={{ color: T.accent }}>qanday yuklab</span> olamiz?</h2></div>
        <Mentor>AI'ga aniq buyruq beramiz: <i>"qattiq <span className="mono">const cars</span> o'rniga, sahifa ochilganda <span className="mono">GET /api/cars</span>'dan fetch qilib, <span className="mono">useState</span>'ga saqla"</i>. Bu — Modul 3'dagi "API GET" darsi: <span className="mono">useEffect</span> + <span className="mono">fetch</span> + <span className="mono">useState</span>.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">Aniq buyruq (prompt)</p>
            <div className="ai-card fade-up delay-1">
              <div className="ai-row"><span className="ai-badge" style={{ background: T.ink }}>Siz</span><span className="ai-bubble">"Katalogda const cars o'rniga, sahifa ochilganda GET /api/cars dan fetch qilib useState'ga saqla."</span></div>
              {!done
                ? <button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={() => setDone(true)}>AI'ga yuborish →</button>
                : (
                  <>
                    <div className="ai-row"><span className="ai-badge">AI</span><span className="ai-bubble">Mana ulanish kodi:</span></div>
                    <div className="ai-code fade-step"><div className="ai-line ok" style={{ cursor: 'default', whiteSpace: 'pre-wrap' }}>{"const [cars, setCars] = useState([]);\n\nuseEffect(() => {\n  fetch('http://localhost:3000/api/cars')\n    .then(res => res.json())\n    .then(data => setCars(data));\n}, []);"}</div></div>
                  </>
                )}
            </div>
          </Col>
          <Col>
            <p className="flow-label">Har bir qator nima qiladi</p>
            <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}><span className="mono" style={{ color: T.accent }}>useState([])</span> — boshida ro'yxat bo'sh.</p></div>
            <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}><span className="mono" style={{ color: T.accent }}>useEffect(...[])</span> — sahifa ochilganda bir marta ishlaydi.</p></div>
            <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}><span className="mono" style={{ color: T.accent }}>fetch → json → setCars</span> — serverdan oladi, JSON'ga aylantiradi, ro'yxatga saqlaydi.</p></div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Kod tayyor ko'rinadi. Lekin haqiqatan ishlaydimi? Buni NAZORATCHI sifatida brauzerda sinaymiz.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 6 — FETCH ANATOMIYASI (oqim diagrammasi) =====
const FLOW = ['React: fetch', 'GET /api/cars', 'Server', 'JSON javob', 'setCars → ekran'];
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [step, setStep] = useState(storedAnswer ? FLOW.length : -1);
  const done = step >= FLOW.length - 1;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const NOTES = ['Sayt serverga so\'rov yuboradi.', 'So\'rov GET /api/cars manziliga boradi.', 'Server bazadan mashinalarni oladi.', 'Server javobni JSON ko\'rinishida qaytaradi.', 'setCars ro\'yxatni to\'ldiradi — kartochkalar chiziladi.'];
  return (
    <Stage eyebrow="Anatomiya · oqim" screen={screen} scrollSignal={done} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "So'rov yo'lini kuzating"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bitta <span className="italic" style={{ color: T.accent }}>fetch</span> bosilganda nima sodir bo'ladi?</h2></div>
        <Mentor>fetch — bu sayt va server orasidagi <b style={{ color: T.ink }}>borib-keluvchi xat</b>. So'rov ketadi, javob qaytadi. Qadam-qadam kuzating — har bosqichda nima bo'lishini ko'ring.</Mentor>
        <Col>
          <div className="flow-strip fade-up delay-1">
            {FLOW.map((f, i) => {
              const lit = step >= i;
              return (
                <React.Fragment key={f}>
                  <div className="flow-node" style={{ background: lit ? T.accent : T.paper, color: lit ? '#fff' : T.ink3, boxShadow: lit ? `0 6px 16px -5px rgba(255,79,40,0.45)` : `0 4px 12px -6px rgba(${T.shadowBase},0.16)` }}>{f}</div>
                  {i < FLOW.length - 1 && <span className="flow-arr" style={{ color: step > i ? T.accent : T.ink3 }}>→</span>}
                </React.Fragment>
              );
            })}
          </div>
          <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={done} onClick={() => setStep(s => Math.min(s + 1, FLOW.length - 1))}>{step < 0 ? '▶ So\'rovni yuborish' : (done ? '✓ Javob keldi' : 'Keyingi qadam →')}</button>
          {step >= 0 && <div className="sk-info fade-step" key={step}><p className="body" style={{ margin: 0, color: T.ink }}><b style={{ color: T.accent }}>{step < FLOW.length ? FLOW[Math.min(step, FLOW.length - 1)] : ''}</b> — {NOTES[Math.min(step, NOTES.length - 1)]}</p></div>}
          {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana to'liq aylana: so'rov chiqadi → server javob beradi → ekran yangilanadi. Endi buni haqiqatan ishga tushiramiz.</p></div>}
        </Col>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — TEST 2 =====
const Screen7 = (props) => (
  <QuestionScreen {...props} idx={7} scope="module-mikro" eyebrow="Tekshiruv"
    questionText="fetch qachon ishga tushishi kerak?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Mustahkamlash</p><h2 className="title h-sub" style={{ marginTop: 8 }}>fetch <span className="italic" style={{ color: T.accent }}>qachon</span> ishga tushsin?</h2></>}
    options={["Sahifa ochilganda bir marta — useEffect ichida", 'Har soniyada qayta-qayta', 'Foydalanuvchi tugma bosmaguncha hech qachon', 'CSS yuklanganda']} correctIdx={0}
    explainCorrect="To'g'ri! useEffect(..., []) sahifa ochilganda bir marta ishlaydi — aynan shunda mashinalarni yuklab olamiz."
    explainWrong={{
      1: "Yo'q — har soniyada so'rov yuborish serverni ortiqcha yuklaydi. Bir marta yetadi: useEffect.",
      2: "Katalog ochilishi bilan mashinalar ko'rinishi kerak, tugma kutmasdan. Shuning uchun useEffect.",
      3: "CSS bezak. Ma'lumot yuklash useEffect ichidagi fetch bilan.",
      default: "Sahifa ochilganda bir marta = useEffect(..., [])."
    }} />
);

// ===== SCREEN 8 — LOADING / ERROR HOLATLARI =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [st, setSt] = useState('data');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['loading', 'error', 'data']) : new Set(['data']));
  const [sc, setSc] = useState(0);
  const done = seen.size >= 3;
  const show = (s) => { setSt(s); setSc(n => n + 1); setSeen(prev => { const n = new Set(prev); n.add(s); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const STATES = [
    { k: 'loading', lbl: '⏳ Sekin internet', note: "Ma'lumot kelguncha — \"yuklanmoqda\" (skeleton). Foydalanuvchi bo'sh ekran ko'rmaydi." },
    { k: 'error', lbl: '⚠️ Server o\'chiq', note: "Server javob bermasa — xato xabari. Sayt qulab tushmaydi, sababni aytadi." },
    { k: 'data', lbl: '✅ Hammasi joyida', note: "Javob keldi — kartochkalar chiziladi. Asosiy holat." }
  ];
  return (
    <Stage eyebrow="Holatlar" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Uch holatni ko'ring (${seen.size}/3)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Ma'lumot kelguncha foydalanuvchi <span className="italic" style={{ color: T.accent }}>nimani ko'radi</span>?</h2></div>
        <Mentor>Serverdan ma'lumot olish <b style={{ color: T.ink }}>bir lahza vaqt</b> oladi — ba'zan server o'chiq ham bo'ladi. Shuning uchun yaxshi sayt uchta holatni hisobga oladi: <b style={{ color: T.ink }}>yuklanmoqda</b>, <b style={{ color: T.ink }}>xato</b>, <b style={{ color: T.ink }}>tayyor</b>. Uchalasini bosib ko'ring.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">Holatni sinab ko'ring</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {STATES.map(s => (
                <button key={s.k} className="vcard" onClick={() => show(s.k)} style={{ boxShadow: st === s.k ? `inset 0 0 0 1.5px ${T.accent}, 0 8px 20px -6px rgba(${T.shadowBase},0.2)` : undefined }}>
                  <span className="vlbl">{s.lbl}</span>
                  <span className="vseen" style={{ color: seen.has(s.k) ? T.success : T.ink3 }}>{seen.has(s.k) ? '✓' : ''}</span>
                </button>
              ))}
            </div>
            <div className="sk-info" key={st}><p className="body" style={{ margin: 0, color: T.ink }}>{STATES.find(s => s.k === st).note}</p></div>
          </Col>
          <Col>
            <p className="flow-label">Sayt — shu holatda</p>
            <Win title="avtoijara.uz" minH={150}><AvtoSite cars={CARS_DB} state={st} cols={2} /></Win>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Uch holat ham tayyor! <span className="mono">if (loading)</span> → skeleton, <span className="mono">if (error)</span> → xabar, aks holda → kartochkalar. Foydalanuvchi hech qachon "buzuq" sayt ko'rmaydi.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 9 — TEST 3 =====
const Screen9 = (props) => (
  <QuestionScreen {...props} idx={9} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="Sayt serverdan ma'lumot olishi uchun nima shart?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Sayt serverdan ma'lumot olishi uchun <span className="italic" style={{ color: T.accent }}>nima shart</span>?</h2></>}
    options={['Front va back — ikkalasi ham ishlab turishi kerak', 'Faqat front ishlasa yetadi', 'Faqat back ishlasa yetadi', 'Internet o\'chiq bo\'lishi kerak']} correctIdx={0}
    explainCorrect="To'g'ri! Front so'rov yuboradi, back javob beradi — ikkalasi bir vaqtda ishlashi kerak. Biri o'chsa, ulanish bo'lmaydi."
    explainWrong={{
      1: "Faqat front bo'lsa — so'rovga javob beradigan server yo'q. Back ham kerak.",
      2: "Faqat back bo'lsa — so'rov yuboradigan sayt yo'q. Front ham kerak.",
      3: "Aksincha — gaplashish uchun ulanish kerak. Ikkala dastur ham ishlab turishi shart.",
      default: "Ikkalasi (front + back) bir vaqtda ishlashi kerak."
    }} />
);

// ===== SCREEN 10 — CASE: CORS (ishga tushiramiz → xato → tuzatamiz) =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  // phase: 0 boshlang'ich · 1 ishga tushdi (loading) · 2 CORS xato · 3 tuzatildi (yuklandi)
  const [phase, setPhase] = useState(storedAnswer ? 3 : 0);
  const done = phase >= 3;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  // ishga tushir: loading ko'rsatib, keyin CORS xatosiga o'tadi
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const run = () => { setPhase(1); clearTimeout(timer.current); timer.current = setTimeout(() => setPhase(2), 900); };
  const fix = () => setPhase(3);
  const siteState = phase === 1 ? 'loading' : phase === 3 ? 'data' : 'error';
  const siteCars = phase === 3 ? CARS_DB : [];
  return (
    <Stage eyebrow="3-qadam · NAZORATCHI" screen={screen} scrollSignal={phase} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Saytni ishga tushiring va tuzating"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Saytni ochdik — konsoldagi <span className="italic" style={{ color: T.accent }}>qizil xato</span> nimani aytmoqchi?</h2></div>
        <Mentor>Brauzer xavfsizlik uchun bitta manzildan (<span className="mono">:5173</span>) boshqasiga (<span className="mono">:3000</span>) so'rovni <b style={{ color: T.ink }}>bloklaydi</b> — buni <b style={{ color: T.ink }}>CORS</b> deyiladi. Bu — har bir dasturchi ko'radigan <b style={{ color: T.ink }}>birinchi</b> xato, qo'rqinchli emas. Yechimi bitta qator: serverga <span className="mono">app.use(cors())</span> qo'shamiz — "menga :5173'dan so'rov kelishi mumkin" degani.</Mentor>
        <div className="split">
          <Col>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={phase >= 1 && phase < 3 ? false : (phase === 0 ? false : true)} onClick={phase === 0 ? run : undefined}>{phase === 0 ? '▶ Saytni ishga tushir' : (phase < 3 ? 'Yuklanmoqda / xato…' : '✓ Ishladi')}</button>
            <Konsol error={phase === 2}>
              {phase === 0 && <span style={{ color: CODE.comment }}>— konsol bo'sh —</span>}
              {phase === 1 && <span style={{ color: CODE.comment }}>GET http://localhost:3000/api/cars …</span>}
              {phase === 2 && <span>❌ Access to fetch at <b>'http://localhost:3000/api/cars'</b> from origin <b>'http://localhost:5173'</b> has been blocked by <b>CORS policy</b>.</span>}
              {phase === 3 && <span style={{ color: CODE.str }}>✓ GET /api/cars → 200 OK (4 mashina yuklandi)</span>}
            </Konsol>
            <p className="flow-label" style={{ margin: '2px 0 0' }}>server.js</p>
            <pre className="code-box" style={{ padding: '10px 13px', lineHeight: 1.85 }}>
              {phase < 3
                ? <><Cm>{'// CORS hali ruxsat berilmagan'}</Cm>{'\n'}<Jx>{'const'}</Jx>{' app = express();'}</>
                : <><Jx>{'const'}</Jx>{' app = express();'}{'\n'}<span style={{ background: 'rgba(31,122,77,0.18)', borderRadius: 5, padding: '1px 5px' }}>{'app.use('}<At>cors()</At>{');'}</span>{'  '}<Cm>{'// ✓ :5173 ga ruxsat'}</Cm></>}
            </pre>
            {phase === 2 && <button className="btn fade-step" style={{ alignSelf: 'flex-start', background: T.success }} onClick={fix}>🔧 app.use(cors()) qo'shish</button>}
          </Col>
          <Col>
            <p className="flow-label">Sayt — front (localhost:5173)</p>
            <Win title="avtoijara.uz" minH={160}><AvtoSite cars={siteCars} state={siteState} newId={SPARK.id} cols={2} /></Win>
            {phase === 2 && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Katalog bo'sh — lekin xato matni aniq aytyapti: <b>CORS policy</b> bloklagan. Chap tomondagi tugma bilan tuzating →</p></div>}
            {done && <div className="takeaway fade-step"><div className="ta-bulb">🎉</div><p className="ta-h">Sayt endi serverdan o'qiyapti!</p><p className="ta-sub">Spark ham paydo bo'ldi — S0'dagi muammo hal bo'ldi.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — FORMA (POST) → KO'RINADI + SAQLANADI =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [cars, setCars] = useState(storedAnswer ? [...CARS_DB, TRACKER] : CARS_DB);
  const [added, setAdded] = useState(!!storedAnswer);
  const [refreshed, setRefreshed] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = added && refreshed;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const post = () => { if (added) return; setCars(c => [...c, TRACKER]); setAdded(true); setSc(n => n + 1); };
  const refresh = () => { if (!added) return; setRefreshed(true); setSc(n => n + 1); };
  return (
    <Stage eyebrow="4-qadam · forma" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Qo'shing va yangilang"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Forma orqali qo'shilgan mashina <span className="italic" style={{ color: T.accent }}>darrov ko'rinadimi</span>?</h2></div>
        <Mentor>Endi yozish tomoni: forma to'ldirib <b style={{ color: T.ink }}>POST</b> yuboramiz, so'ng ro'yxatni <b style={{ color: T.ink }}>qayta fetch</b> qilamiz — yangi mashina darrov chiqadi. Eng muhimi: sahifani yangilasangiz ham u <b style={{ color: T.ink }}>saqlanib qoladi</b> (chunki bazada). Sinab ko'ring.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">Yangi mashina formasi</p>
            <div className="frame" style={{ padding: 14 }}>
              <div className="form-row"><span className="form-lbl">Nomi</span><span className="form-val">Chevrolet Tracker</span></div>
              <div className="form-row"><span className="form-lbl">Narx</span><span className="form-val">450 000 so'm/kun</span></div>
              <div className="form-row"><span className="form-lbl">Yil</span><span className="form-val">2024</span></div>
              <button className="btn" disabled={added} onClick={post} style={{ marginTop: 10, width: '100%', background: added ? T.success : T.ink }}>{added ? '✓ POST yuborildi (201)' : 'Qo\'shish — POST /api/cars'}</button>
            </div>
            <pre className="code-box" style={{ padding: '10px 13px', lineHeight: 1.8 }}>
              {'fetch('}<St>'/api/cars'</St>{', {'}{'\n'}
              {'  method: '}<St>'POST'</St>{','}{'\n'}
              {'  body: JSON.stringify(yangi)'}{'\n'}
              {'}).then(() => '}<At>yana_fetch()</At>{');'}
            </pre>
            <button className="btn-soft" disabled={!added || refreshed} onClick={refresh} style={{ alignSelf: 'flex-start' }}>{refreshed ? '✓ Yangilandi — Tracker joyida' : '🔄 Sahifani yangilash'}</button>
          </Col>
          <Col>
            <p className="flow-label">Sayt — front (localhost:5173)</p>
            <Win title="avtoijara.uz" minH={160}><AvtoSite cars={cars} newId={added ? TRACKER.id : undefined} cols={2} /></Win>
            {added && !refreshed && <p className="small fade-step" style={{ color: T.accent, fontStyle: 'italic', margin: 0 }}>Tracker chiqdi! Endi 🔄 yangilang — saqlanib qoladimi?</p>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Yangilandi — Tracker baribir joyida! Chunki u faqat ekranda emas, <b>bazada</b> saqlangan. Mana to'liq ulanish: forma → POST → baza → qayta GET → ekran.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — TO'LIQ AYLANA (diagramma) =====
const CIRCLE = ['Forma (front)', 'POST →', 'Express', 'PostgreSQL', 'GET →', 'Katalog (front)'];
const Screen12 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [step, setStep] = useState(storedAnswer ? CIRCLE.length : -1);
  const done = step >= CIRCLE.length - 1;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Ma'lumot yo'li" screen={screen} scrollSignal={done} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Yo'lni kuzating"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(12px,2vw,18px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Mashina qo'shilganda ma'lumot <span className="italic" style={{ color: T.accent }}>qaysi yo'lni</span> bosib o'tadi?</h2></div>
        <Mentor>Bitta mashina qo'shilganda ma'lumot to'liq bir yo'lni bosib o'tadi: siz formaga yozasiz → front <b style={{ color: T.ink }}>POST</b> bilan serverga yuboradi → server bazaga yozadi → front <b style={{ color: T.ink }}>GET</b> bilan qayta so'raydi → ekran yangilanadi. Shu yo'lni qadam-qadam kuzating.</Mentor>
        <Col>
          <div className="flow-strip fade-up delay-1">
            {CIRCLE.map((c, i) => {
              const lit = step >= i;
              const isArr = c.includes('→');
              return isArr
                ? <span key={i} className="flow-arr" style={{ color: step > i ? T.accent : T.ink3, fontWeight: 700 }}>{c}</span>
                : <div key={i} className="flow-node" style={{ background: lit ? T.accent : T.paper, color: lit ? '#fff' : T.ink3 }}>{c}</div>;
            })}
          </div>
          <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={done} onClick={() => setStep(s => Math.min(s + 1, CIRCLE.length - 1))}>{step < 0 ? '▶ Boshlash' : (done ? '✓ Yo\'l tugadi' : 'Keyingi qadam →')}</button>
          {done && <Split>
            <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana ma'lumotning to'liq yo'li. Har bo'lak o'z ishini qiladi: <b>front</b> ko'rsatadi, <b>server</b> boshqaradi, <b>baza</b> saqlaydi.</p></div>
            <div className="frame fade-step" style={{ padding: 14 }}><p className="body" style={{ margin: 0, color: T.ink2 }}>Ma'lumot bazada saqlanadi, shuning uchun u <b style={{ color: T.ink }}>yo'qolmaydi</b>: sahifani yangilasangiz ham, do'stingiz boshqa telefonda ochsa ham — hamma bir xil mashinalarni ko'radi.</p></div>
          </Split>}
        </Col>
      </div>
    </Stage>
  );
};

// ===== SCREEN 13 — AMALIYOT: TO'LIQ ULANGAN ILOVANI BOSHQARING =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [cars, setCars] = useState(storedAnswer ? [...CARS_DB, TRACKER] : CARS_DB);
  const [didLoad] = useState(true);
  const [didAdd, setDidAdd] = useState(!!storedAnswer);
  const [didRefresh, setDidRefresh] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = didAdd && didRefresh;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const add = () => { if (didAdd) return; setCars(c => [...c, TRACKER]); setDidAdd(true); setSc(n => n + 1); };
  const refresh = () => { if (!didAdd) return; setDidRefresh(true); setSc(n => n + 1); };
  const Tick = ({ ok, label }) => <span className="tagpill" style={{ color: ok ? T.success : T.ink3 }}>{ok ? '✓' : '○'} {label}</span>;
  return (
    <Stage eyebrow="Amaliyot · to'liq ilova" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Qo'shing va yangilang"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(8px,1.2vw,12px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Endi o'zingiz — <span className="italic" style={{ color: T.accent }}>to'liq ulangan</span> saytni boshqaring.</h2></div>
        <Mentor>Mana sizning fullstack AvtoIjarangiz: mashinalar serverdan yuklangan. Bittasini <b style={{ color: T.ink }}>qo'shing</b> (POST), keyin <b style={{ color: T.ink }}>yangilang</b> — saqlanib qolishini ko'ring. Uchala belgi yashil bo'lsa — ilovangiz to'liq tayyor!</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">Amallar</p>
            <button className="btn-soft" disabled style={{ alignSelf: 'flex-start', opacity: 1 }}>✓ Serverdan yuklandi (avtomatik)</button>
            <button className="btn" disabled={didAdd} onClick={add} style={{ alignSelf: 'flex-start', background: didAdd ? T.success : T.ink }}>{didAdd ? '✓ Qo\'shildi (POST)' : 'Mashina qo\'shish — POST'}</button>
            <button className="btn-soft" disabled={!didAdd || didRefresh} onClick={refresh} style={{ alignSelf: 'flex-start' }}>{didRefresh ? '✓ Saqlanib qoldi' : '🔄 Sahifani yangilash'}</button>
            <p className="flow-label" style={{ margin: '4px 0 0' }}>Bajarildi</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}><Tick ok={didLoad} label="Yuklandi" /><Tick ok={didAdd} label="Qo'shdim" /><Tick ok={didRefresh} label="Saqlandi" /></div>
          </Col>
          <Col>
            <p className="flow-label">Sizning saytingiz</p>
            <Win title="avtoijara.uz" minH={170}><AvtoSite cars={cars} newId={didAdd ? TRACKER.id : undefined} cols={2} /></Win>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>🎉 Fullstack ilova tayyor! Sayt serverdan o'qiydi, formaga yozsangiz bazaga yoziladi, refresh'da yo'qolmaydi. Front + back + baza — bittasi bo'lib ishlaydi.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — TEST 4 =====
const Screen14 = (props) => (
  <QuestionScreen {...props} idx={14} scope="module-mikro" eyebrow="Mashq · 4-savol"
    questionText="Ulangandan keyin katalog mashinalarni qayerdan oladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Endi katalog ma'lumotni <span className="italic" style={{ color: T.accent }}>qayerdan</span> oladi?</h2></>}
    options={['Serverdan — fetch(GET /api/cars) orqali bazadan', 'Kodga yozilgan const cars massividan', 'CSS faylidan', 'Hech qayerdan — bo\'sh']} correctIdx={0}
    explainCorrect="To'g'ri! Endi katalog har ochilganda serverdan so'raydi, server bazadan beradi. Baza yangilansa — sayt ham yangilanadi."
    explainWrong={{
      1: "Eski usul edi — endi const cars o'rniga fetch ishlatdik. Ma'lumot serverdan keladi.",
      2: "CSS faqat bezak. Ma'lumot — serverdan, fetch orqali.",
      3: "Bo'sh emas — fetch serverdan to'ldiradi. Ma'lumot bazadan keladi.",
      default: "Serverdan — fetch(GET /api/cars)."
    }} />
);

// ===== SCREEN 15 — QOIDA: FULLSTACK BIR QARASHDA =====
const Screen15 = ({ screen, onNext, onPrev }) => (
  <Stage eyebrow="Qoida · xulosa" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Oxirgi qadam →" onClick={onNext} /></>}>
    <div className="screen" style={{ gap: 'clamp(12px,2vw,18px)' }}>
      <div className="head"><h2 className="title h-title fade-up">Fullstack — <span className="italic" style={{ color: T.accent }}>bir qarashda</span> nima?</h2></div>
      <Mentor>Eng muhimi: <b style={{ color: T.ink }}>front</b> va <b style={{ color: T.ink }}>back</b> — ikki alohida dastur, ular <span className="mono">fetch ↔ API</span> orqali gaplashadi. Ma'lumot endi kodda emas, serverdan keladi.</Mentor>
      <Split>
        <Col>
          <p className="flow-label">3 ta asosiy g'oya</p>
          <div className="roadmap">
            <div className="step-card"><span className="step-num">01</span><span className="step-body"><span className="step-text">2 dastur bir vaqtda</span><span className="step-tag">front :5173 · back :3000</span></span></div>
            <div className="step-card"><span className="step-num">02</span><span className="step-body"><span className="step-text">fetch ↔ API</span><span className="step-tag">useEffect + fetch + useState</span></span></div>
            <div className="step-card"><span className="step-num">03</span><span className="step-body"><span className="step-text">loading / error doim</span><span className="step-tag">foydalanuvchini o'ylab</span></span></div>
          </div>
        </Col>
        <Col>
          <p className="flow-label">Yodda tuting</p>
          <div className="frame-success"><p className="body" style={{ margin: 0, color: T.ink }}>Boshqa portga so'rov bloklansa — <span className="mono">CORS</span>, yechimi serverda <span className="mono">app.use(cors())</span>.</p></div>
          <div className="frame" style={{ padding: 14 }}><p className="body" style={{ margin: 0, color: T.ink2 }}>Yana o'sha uch rol — hammasini <b style={{ color: T.ink }}>siz</b> bajarasiz: <b style={{ color: T.ink }}>ME'MOR</b> (loyihachi) — ma'lumot yo'lini chizasiz; <b style={{ color: T.ink }}>REJISSYOR</b> (buyruq beruvchi) — AI'ga aniq topshiriq berasiz; <b style={{ color: T.ink }}>NAZORATCHI</b> (tekshiruvchi) — natijani brauzerda sinaysiz.</p></div>
        </Col>
      </Split>
    </div>
  </Stage>
);

// ===== SCREEN 16 — YAKUNIY (VS Code: fetch URL) =====
const Screen16 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [value, setValue] = useState(storedAnswer?.picked || '');
  const [passed, setPassed] = useState(!!storedAnswer?.correct);
  const norm = value.replace(/\s+/g, '').trim();
  const valid = /^['"]?https?:\/\/localhost:3000\/api\/cars['"]?$/i.test(norm);
  const hasHost = /localhost:3000/i.test(value);
  const hasPath = /\/api\/cars/i.test(value);
  const noProto = value.length > 4 && !/https?:\/\//i.test(value);
  useEffect(() => {
    if (valid && !passed) {
      setPassed(true);
      onAnswer(screen, { stage: 'final', screenIdx: screen, question: 'VS Code: useEffect ichidagi fetch URL\'ini yozing', studentAnswer: value, correct: true, firstAttemptCorrect: true, solved: true, picked: value });
    }
  }, [valid]);
  const Ln = ({ n, children }) => (<div className="vsc-line"><span className="vsc-ln">{n}</span><span style={{ whiteSpace: 'pre' }}>{children}</span></div>);
  return (
    <Stage eyebrow="Yakuniy · amaliy" screen={screen} scrollSignal={passed} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!passed} label={passed ? 'Davom etish' : "fetch manzilini yozing"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Oxirgi qadam: <span className="italic" style={{ color: T.accent }}>fetch manzilini</span> o'zingiz yozing.</h2></div>
        <Mentor>VS Code'da <span className="mono">App.jsx</span> ochiq: <span className="mono">useEffect</span> tayyor — faqat <b style={{ color: T.ink }}>fetch manzili bo'sh</b>. Backend manzilini yozing: <span className="mono">'http://localhost:3000/api/cars'</span> (protokol + manzil + yo'l).</Mentor>
        <div className="split">
          <Col>
            <div className="vsc fade-up delay-2">
              <div className="vsc-bar"><span className="vsc-tab on"><span style={{ color: '#61DAFB' }}>⚛</span> App.jsx <span style={{ color: '#6E7681', marginLeft: 4 }}>×</span></span><span className="vsc-tab">api.js</span></div>
              <div className="vsc-body">
                <Ln n={1}><Jx>{'const'}</Jx>{' [cars, setCars] = '}<At>useState</At>{'([]);'}</Ln>
                <Ln n={2}><At>useEffect</At>{'(() => {'}</Ln>
                <div className="vsc-line">
                  <span className="vsc-ln">3</span>
                  <span style={{ whiteSpace: 'pre' }}>{'  fetch('}</span>
                  <input className={`vsc-input ${valid ? 'ok' : ''}`} value={value} onChange={e => setValue(e.target.value)} placeholder="'http://localhost:3000/api/cars'" spellCheck={false} autoCapitalize="off" autoCorrect="off" />
                  <span style={{ whiteSpace: 'pre', color: '#D4D4D4' }}>{')'}</span>
                </div>
                <Ln n={4}>{'    .then(res => res.json())'}</Ln>
                <Ln n={5}>{'    .then(data => setCars(data));'}</Ln>
                <Ln n={6}>{'}, []);'}</Ln>
              </div>
            </div>
            <div className="fade-up delay-2" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="tagpill" style={{ opacity: hasHost ? 1 : 0.4 }}>{hasHost ? '✓' : '1'} localhost:3000</span>
              <span className="tagpill" style={{ opacity: hasPath ? 1 : 0.4 }}>{hasPath ? '✓' : '2'} /api/cars</span>
            </div>
            {noProto && !valid && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Manzil boshida <span className="mono">http://</span> ham kerak: <span className="mono">'http://localhost:3000/api/cars'</span>.</p></div>}
            {passed && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Mukammal! Endi sayt serverga ulanadi va mashinalarni bazadan yuklaydi.</p></div>}
          </Col>
          <Col>
            <p className="flow-label">natija — avtoijara.uz</p>
            <Win title="avtoijara.uz" minH={160}>{valid ? <AvtoSite cars={CARS_DB} newId={SPARK.id} cols={2} /> : <AvtoSite cars={[]} state="loading" cols={2} />}</Win>
            {!valid && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>Manzil yozilmaguncha sayt yuklay olmaydi…</p>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 17 — YAKUN =====
const Screen17 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const RECAP = [
    "Front (:5173) va back (:3000) — 2 alohida dastur, bir vaqtda ishlaydi",
    "fetch ↔ API: const cars o'rniga useEffect + fetch + useState",
    "loading / error holatlari — foydalanuvchini o'ylab",
    "CORS — boshqa portga so'rov bloklansa, serverga app.use(cors())",
    "To'liq aylana: forma → POST → baza → GET → ekran (refresh'da saqlanadi)"
  ];
  const HOMEWORK = [
    { b: 'Frontni ulang', t: "— o'z saytingizdagi qattiq ro'yxatni fetch bilan almashtiring" },
    { b: 'Holatlar', t: "— loading va error ko'rinishini qo'shing" },
    { b: 'POST forma', t: "— formani serverga ulab, qo'shgach qayta fetch qiling" }
  ];
  const GLOSSARY = [
    { b: 'fetch', t: "— front'dan serverga HTTP so'rov yuborish" },
    { b: 'useEffect([])', t: '— sahifa ochilganda bir marta ishlaydi' },
    { b: 'useState', t: '— serverdan kelgan ma\'lumotni saqlaydi' },
    { b: 'loading / error', t: '— ma\'lumot kelguncha / xato bo\'lganda ko\'rinish' },
    { b: 'CORS', t: '— brauzer himoyasi; app.use(cors()) bilan ruxsat' },
    { b: 'POST + qayta GET', t: '— qo\'shgach ro\'yxatni yangilash' },
    { b: 'Fullstack', t: '— front + back + baza bitta bo\'lib ishlashi' }
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
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">✓</span> Birinchi fullstack ilovangiz</span><h2 className="title h-title fade-up d1">Front va backni <span className="italic" style={{ color: T.accent }}>o'zingiz uladingiz</span>.</h2><p className="body h-sub fade-up d2">{PASSED ? "Tabriklaymiz! Endi saytingiz serverdan o'qiydi, formaga yozsangiz bazaga yoziladi — to'liq fullstack ilova." : "Yaxshi harakat! fetch, loading/error va CORS'ni mustahkamlash uchun bir-ikki ekranni qayta ko'ring."}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span className="tick" style={{ width: 16, height: 16, borderRadius: '50%', background: T.success, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck">✓</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>📝 Uyga vazifa</div><p className="body" style={{ margin: '0 0 10px', color: T.ink }}>Antigravity bilan o'z loyihangizda sinang:</p><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">🚀 Front, back va baza endi bitta bo'lib ishlaydi! Keyingi praktikada — Loyiha kuni: shu ko'nikmalarni (CRUD, fetch, baza) yangi loyiha — <b>AvtoStoyanka</b>'da qo'llaymiz va noldan to'liq quramiz.</p></div>
        </div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">💡 Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function FullstackConnectPracticeLesson({ lang: langProp, onFinished }) {
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
        .delay-1 { animation-delay: 0.12s; } .delay-2 { animation-delay: 0.24s; } .delay-3 { animation-delay: 0.36s; } .delay-4 { animation-delay: 0.48s; }
        @keyframes fade-step { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .fade-step { animation: fade-step 0.3s ease-out; }
        .d1 { animation-delay: 0.12s; } .d2 { animation-delay: 0.24s; } .d3 { animation-delay: 0.36s; } .d4 { animation-delay: 0.48s; }
        @keyframes el-pop { from { opacity: 0; transform: translateX(8px); } to { opacity: 1; transform: none; } }
        .el-in { animation: el-pop 0.3s ease-out; }
        @keyframes skel-shimmer { 0% { background-position: -200px 0; } 100% { background-position: 200px 0; } }

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

        .chip { font-family: 'Manrope', sans-serif; font-weight: 600; font-size: clamp(13px,1.6vw,15px); display: inline-flex; align-items: center; gap: 8px; padding: 9px 15px; border-radius: 99px; border: none; background: ${T.paper}; color: ${T.ink}; cursor: pointer; transition: all 0.18s; box-shadow: 0 4px 12px -5px rgba(${T.shadowBase},0.18); }
        .chip:hover:not(:disabled) { transform: translateY(-1px); }
        .chip-on { background: ${T.accent}; color: #fff; box-shadow: 0 6px 16px -5px rgba(255,79,40,0.4); }
        .chip:disabled { opacity: 0.4; cursor: not-allowed; }
        .tagpill { font-family: 'JetBrains Mono', monospace; font-size: 12.5px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 99px; background: ${T.paper}; color: ${T.ink}; box-shadow: 0 3px 10px -5px rgba(${T.shadowBase},0.18); transition: opacity 0.2s; }

        /* === VCARD === */
        .vcard { display: flex; align-items: center; gap: 11px; width: 100%; text-align: left; background: ${T.paper}; border: none; border-radius: 12px; padding: 12px 15px; cursor: pointer; transition: all 0.18s; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.16); }
        .vcard:hover { transform: translateY(-1px); }
        .vlbl { font-family: 'Manrope', sans-serif; font-weight: 700; font-size: 13.5px; color: ${T.ink}; }
        .vseen { margin-left: auto; font-weight: 700; }

        /* === MENTOR === */
        .mentor { display: flex; gap: 12px; align-items: flex-start; }
        .mentor-ava { width: 40px; height: 40px; border-radius: 50%; overflow: hidden; flex-shrink: 0; box-shadow: 0 4px 12px -4px rgba(${T.shadowBase},0.28); }
        .mentor-ava svg { display: block; }
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
        .hint { background: ${T.bg}; border: 1.5px dashed ${T.ink3}; border-radius: 12px; padding: 14px 16px; font-size: clamp(13px,1.5vw,14px); color: ${T.ink2}; }

        /* === AI CARD === */
        .ai-card { background: ${T.paper}; border-radius: 14px; padding: 15px 17px; display: flex; flex-direction: column; gap: 11px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.14); }
        .ai-row { display: flex; align-items: center; gap: 9px; } .ai-badge { font-family: 'Manrope'; font-weight: 800; font-size: 11px; color: #fff; background: ${T.blue}; padding: 3px 9px; border-radius: 6px; } .ai-bubble { font-size: 13px; color: ${T.ink2}; }
        .ai-code { background: ${CODE.bg}; border-radius: 9px; padding: 10px 12px; display: flex; flex-direction: column; gap: 3px; }
        .ai-line { font-family: 'JetBrains Mono'; font-size: 12.5px; color: ${CODE.text}; padding: 7px 9px; border-radius: 6px; white-space: pre-wrap; line-height: 1.6; }
        .ai-line.ok { background: rgba(31,122,77,0.16); }
        .ai-prompt { font-size: 12px; color: ${T.ink3}; margin: 0; font-style: italic; } .note-h { font-weight: 700; font-size: 13px; margin: 0 0 4px; }
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

        /* === BROWSER / TERMINAL === */
        .bp-bar { background: #f0eee8; padding: 8px 11px; display: flex; align-items: center; gap: 9px; }
        .bb-dots { display: flex; gap: 5px; }
        .bb-dots i { width: 9px; height: 9px; border-radius: 50%; }
        .bb-dots i:first-child { background: #ff5f57; } .bb-dots i:nth-child(2) { background: #febc2e; } .bb-dots i:nth-child(3) { background: #28c840; }
        .bp-title { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink3}; }
        .bp-body { padding: clamp(10px,1.8vw,14px); background: #FBFAF7; }
        .code-box { background: ${CODE.bg}; color: ${CODE.text}; font-family: 'JetBrains Mono', monospace; font-size: clamp(12px,1.5vw,13.5px); line-height: 1.55; padding: clamp(12px,2.2vw,16px); border-radius: 12px; overflow-x: auto; white-space: pre-wrap; word-break: break-word; margin: 0; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.2); }

        /* === AVTOIJARA SAYTI === */
        .site { font-family: 'Manrope', sans-serif; }
        .site-nav { display: flex; align-items: center; gap: 12px; padding: 9px 12px; background: #fff; border-radius: 10px; box-shadow: 0 3px 10px -6px rgba(${T.shadowBase},0.2); margin-bottom: 9px; }
        .site-logo { font-weight: 800; font-size: 14px; color: ${T.ink}; } .site-logo b { color: ${T.accent}; }
        .site-links { display: flex; gap: 11px; margin-left: 6px; } .site-links span { font-size: 11px; font-weight: 600; color: ${T.ink3}; } .site-links .on { color: ${T.ink}; border-bottom: 2px solid ${T.accent}; padding-bottom: 1px; }
        .site-hero { display: flex; flex-direction: column; gap: 1px; margin-bottom: 9px; padding: 0 2px; }
        .site-h { font-family: 'Source Serif 4', serif; font-weight: 600; font-size: 15px; color: ${T.ink}; }
        .site-sub { font-size: 10.5px; color: ${T.ink3}; font-weight: 500; }
        .site-grid { display: grid; gap: 8px; }
        .scard { background: #fff; border-radius: 11px; overflow: hidden; box-shadow: 0 5px 16px -7px rgba(${T.shadowBase},0.28); display: flex; flex-direction: column; }
        .scard-new { box-shadow: 0 0 0 2px ${T.success}, 0 6px 16px -5px rgba(31,122,77,0.3); }
        .scard-img { position: relative; height: 56px; display: flex; align-items: center; justify-content: center; }
        .scard-emoji { font-size: 26px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.25)); }
        .scard-tag { position: absolute; top: 5px; left: 6px; font-size: 8.5px; font-weight: 800; padding: 2px 7px; border-radius: 99px; color: #fff; }
        .scard-tag.free { background: rgba(31,122,77,0.92); } .scard-tag.busy { background: rgba(194,54,43,0.92); }
        .scard-newbadge { position: absolute; top: 5px; right: 6px; font-size: 8.5px; font-weight: 800; padding: 2px 7px; border-radius: 99px; color: #fff; background: ${T.accent}; }
        .scard-info { padding: 7px 9px 9px; display: flex; flex-direction: column; gap: 3px; }
        .scard-top { display: flex; align-items: baseline; justify-content: space-between; gap: 6px; }
        .scard-name { font-weight: 800; font-size: 12px; color: ${T.ink}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .scard-year { font-size: 10px; color: ${T.ink3}; font-weight: 600; flex-shrink: 0; }
        .scard-meta { font-size: 9.5px; color: ${T.ink3}; font-weight: 600; }
        .scard-bottom { display: flex; align-items: center; justify-content: space-between; gap: 6px; row-gap: 5px; margin-top: 3px; flex-wrap: wrap; }
        .scard-price { font-weight: 800; font-size: 11.5px; color: ${T.ink}; } .scard-price small { font-weight: 600; font-size: 8.5px; color: ${T.ink3}; }
        .scard-btn { font-size: 9.5px; font-weight: 700; color: #fff; background: ${T.ink}; padding: 4px 9px; border-radius: 7px; white-space: nowrap; flex-shrink: 0; }
        .site-msg { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; padding: 28px 12px; font-family: 'Manrope'; font-weight: 700; font-size: 13px; color: ${T.ink2}; }
        .site-msg.err { color: ${T.danger}; } .site-msg small { font-weight: 500; font-size: 11px; color: ${T.ink3}; } .site-msg-ico { font-size: 26px; }
        .skel .skel-box, .skel .skel-line { background: linear-gradient(90deg,#ECE8E0 25%,#F6F3EE 50%,#ECE8E0 75%); background-size: 400px 100%; animation: skel-shimmer 1.2s infinite linear; }
        .skel .skel-line { height: 8px; border-radius: 5px; margin-top: 5px; } .skel .skel-line.short { width: 60%; }

        /* === DB JADVAL === */
        .db { border-radius: 12px; overflow: hidden; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.18); background: #fff; }
        .db-cap { background: #e9e5dc; padding: 8px 12px; font-family: 'Manrope', sans-serif; font-size: 12px; font-weight: 600; color: ${T.ink2}; } .db-cap b { color: ${T.ink}; } .db-cap span { color: ${T.ink3}; }
        .db-row { display: grid; grid-template-columns: 36px 1.5fr 1fr 0.7fr; gap: 8px; padding: 8px 12px; align-items: center; font-family: 'JetBrains Mono', monospace; font-size: 12px; color: ${T.ink}; border-top: 1px solid #eee; }
        .db-head { background: ${CODE.bg}; color: ${CODE.punct}; font-weight: 700; border-top: none; }
        .db-row.flash { background: ${T.successSoft}; }

        /* === KONSOL === */
        .kons { border-radius: 11px; overflow: hidden; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.2); }
        .kons-bar { background: #2D2D2D; color: #C9D1D9; font-family: 'JetBrains Mono'; font-size: 11px; padding: 6px 11px; display: flex; align-items: center; gap: 7px; }
        .kons-dot { width: 8px; height: 8px; border-radius: 50%; background: #28c840; }
        .kons-body { background: #1E1E1E; color: #D4D4D4; font-family: 'JetBrains Mono', monospace; font-size: 11.5px; line-height: 1.65; padding: 11px 12px; min-height: 54px; word-break: break-word; }
        .kons-body.err { color: #FF8A7A; } .kons-body b { color: #FFD380; font-weight: 700; }

        /* === RUN CARD (2 dastur) === */
        .run-card { background: ${T.paper}; border-radius: 12px; padding: 12px 14px; display: flex; flex-direction: column; gap: 9px; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.16); }
        .run-top { display: flex; align-items: center; justify-content: space-between; }
        .run-name { font-family: 'Manrope'; font-weight: 700; font-size: 13px; color: ${T.ink}; }
        .run-port { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink3}; background: ${T.bg}; padding: 2px 8px; border-radius: 6px; }

        /* === BRIDGE / FLOW / CHAIN === */
        .bridge { display: flex; align-items: center; justify-content: space-between; gap: 8px; background: ${T.paper}; border-radius: 14px; padding: 16px 14px; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.16); }
        .bridge-end { display: flex; flex-direction: column; align-items: center; gap: 4px; text-align: center; font-family: 'Manrope'; font-weight: 700; font-size: 11.5px; color: ${T.ink}; transition: opacity 0.3s; } .bridge-end small { font-family: 'JetBrains Mono'; font-weight: 400; font-size: 9.5px; color: ${T.ink3}; }
        .bridge-ico { font-size: 24px; }
        .bridge-mid { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; }
        .bridge-arr { font-family: 'JetBrains Mono'; font-size: 11px; font-weight: 700; transition: color 0.3s; }
        .bridge-line { height: 2px; width: 100%; border-radius: 99px; transition: background 0.3s; }
        .chain, .flow-strip { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .chain-node, .flow-node { font-family: 'JetBrains Mono', monospace; font-size: 11.5px; font-weight: 700; padding: 8px 12px; border-radius: 9px; transition: all 0.3s; box-shadow: 0 4px 12px -6px rgba(${T.shadowBase},0.16); }
        .chain-arr, .flow-arr { font-size: 13px; font-family: 'JetBrains Mono'; transition: color 0.3s; }

        /* === FORMA === */
        .form-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; padding: 7px 0; border-bottom: 1px solid ${T.bg}; }
        .form-lbl { font-family: 'Manrope'; font-weight: 600; font-size: 12px; color: ${T.ink3}; }
        .form-val { font-family: 'Manrope'; font-weight: 700; font-size: 13px; color: ${T.ink}; }

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
