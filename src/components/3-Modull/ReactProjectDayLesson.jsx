import React, { useState, useEffect, useRef, createContext, useContext, useCallback } from 'react';

// ============================================================
// FRONTEND REACT MODULI · PRAKTIKA 3 — LOYIHA KUNI: "AvtoIjara" (React + API + CRUD + Router) — PLATFORM STANDARD v16 (AUDIOSIZ)
// O'RNI: P2 (Router) dan KEYIN. O'quvchi BILADI: komponent, props, map, state, fetch (GET/POST/PUT/DELETE), CRUD, Router.
// MAQSAD: hammasini BITTA to'liq ilovaga birlashtirish. Yangi tushuncha YO'Q — INTEGRATSIYA + AGENTNI BOSHQARISH.
//        O'quvchi: (1) yaxshi PROMPT yozadi (Nima+Qanday+Qayerda), (2) agentni boshqaradi (buyur→reja→tasdiq→tekshir),
//        (3) xatolarni DEBUG qiladi → natijada "men istalgan saytni qura olaman" deb chiqadi.
// VIBECODING HALQASI (yangi): promptni YIG'ADI (aniqlik qo'shadi) → agent reja → tasdiq → kodni tekshir → natijani sina.
//        Iteratsiya: AI biroz xato → aniqlashtiruvchi follow-up prompt (s10).
// Loyiha: AvtoIjara — Bosh(/) katalog · Mashina(/car/:id) · Mening ijaralarim(/bookings) · Qo'shish(/add).
//        Asosiy mexanika: jami = kun × kunlik narx. s12 debugging = AI kunni unutgan (× days yo'q).
// TRANSFER (s14): "bu mashina edi, lekin xuddi shu 5 qadam bilan istalgan sayt" → P4 (o'z loyihangiz).
// AUDIOSIZ. "sehr"/"g'isht" yo'q. Rasmiy "siz".
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

const LESSON_META = { lessonId: 'react-project-day-p3-v16', lessonTitle: { uz: 'Praktika: Loyiha kuni — AvtoIjara', ru: 'Практика: Проектный день — AvtoIjara' } };
const SCREEN_META = [
  { id: 's0',  type: 'hook',        template: 'custom',   scored: false, scope: 'hook' },
  { id: 's1',  type: 'rule',        template: 'custom',   scored: false, scope: null },
  { id: 's2',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's3',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's4',  type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's5',  type: 'case',        template: 'custom',   scored: false, scope: null },
  { id: 's5b', type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's6',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's7',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's8',  type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's9',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's10', type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's11', type: 'rule',        template: 'custom',   scored: false, scope: null },
  { id: 's12', type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's13', type: 'rule',        template: 'custom',   scored: false, scope: null },
  { id: 's14', type: 'test',        template: 'custom',   scored: true,  scope: 'final' },
  { id: 's15', type: 'summary',     template: 'custom',   scored: false, scope: null }
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

const QuestionScreen = ({ screen, idx, scope, eyebrow, question, questionText, options, correctIdx, explainCorrect, explainWrong, storedAnswer, onAnswer, onNext, onPrev }) => {
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
const CARS = [
  { id: 1, name: 'Tesla Model 3', emoji: '⚡', price: 80, seats: 5, speed: 250, desc: "Tinch, tejamkor, elektr — shahar uchun ideal.", bg: 'linear-gradient(135deg,#7EA6F4,#2E4A9E)' },
  { id: 2, name: 'Lamborghini', emoji: '🏎️', price: 200, seats: 2, speed: 350, desc: "Eng tez — yo'lda hamma o'giriladi.", bg: 'linear-gradient(135deg,#F4B26A,#C9622E)' },
  { id: 3, name: 'BMW X5', emoji: '🚙', price: 120, seats: 7, speed: 240, desc: "Katta oila uchun keng va qulay.", bg: 'linear-gradient(135deg,#8FD3A8,#2E7A4E)' },
  { id: 4, name: 'Mustang', emoji: '🐎', price: 150, seats: 4, speed: 280, desc: "Klassik amerikan kuchi.", bg: 'linear-gradient(135deg,#C44569,#7A2A40)' }
];
const POOL = [
  { id: 5, name: 'Jeep Wrangler', emoji: '🚙', price: 90, seats: 5, speed: 180, desc: "Tog'u tosh — hamma joyga boradi.", bg: 'linear-gradient(135deg,#6B7280,#1F2430)' },
  { id: 6, name: 'Mini Cooper', emoji: '🚗', price: 60, seats: 4, speed: 200, desc: "Kichkina, ixcham, arzon.", bg: 'linear-gradient(135deg,#F4D06A,#C99B2E)' }
];
const carById = (id) => [...CARS, ...POOL].find(c => c.id === Number(id)) || CARS[0];

const CarCard = ({ car, onRent, onOpen, onDelete }) => (
  <div className={`rocard el-in ${onOpen ? 'tappable' : ''}`} onClick={onOpen} style={{ position: 'relative' }}>
    <div className="rothumb" style={{ background: car.bg, height: 54 }}>
      <span style={{ fontSize: 25 }}>{car.emoji}</span>
      {onDelete && <button className="cardx" onClick={(e) => { e.stopPropagation(); onDelete(); }} title="O'chirish">✕</button>}
    </div>
    <div className="robody">
      <p className="roname">{car.name}</p>
      <div className="rostats"><span style={{ color: T.accent, fontWeight: 800 }}>${car.price}/kun</span>{car.seats && <span>👤 {car.seats}</span>}</div>
      {onRent && <div className="cardacts"><button className="cardbtn" onClick={(e) => { e.stopPropagation(); onRent(); }}>🔑 Ijaraga</button></div>}
    </div>
  </div>
);
const Grid = ({ children, cols = 3 }) => <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols},1fr)`, gap: 8 }}>{children}</div>;
const CarDetail = ({ id, onRent }) => {
  const c = carById(id);
  return (
    <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      <div style={{ borderRadius: 12, height: 72, background: c.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>{c.emoji}</div>
      <div>
        <p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, fontSize: 18, color: T.ink, margin: 0 }}>{c.name}</p>
        <div style={{ display: 'flex', gap: 12, margin: '4px 0 6px', fontFamily: "'Manrope',sans-serif", fontSize: 12, color: T.ink2, fontWeight: 600 }}><span style={{ color: T.accent, fontWeight: 800 }}>${c.price}/kun</span><span>👤 {c.seats}</span><span>⚡ {c.speed} km/s</span></div>
        <p className="body" style={{ margin: '0 0 8px', color: T.ink2 }}>{c.desc}</p>
        {onRent && <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={onRent}>🔑 Ijaraga olish</button>}
      </div>
    </div>
  );
};

// ===== AGENT BUILD — vibecoding halqasi: prompt yig'ish → reja → tasdiq → kod =====
const AgentBuild = ({ base, parts, planSteps, code, onDone, storedDone }) => {
  const [sel, setSel] = useState(storedDone ? new Set(parts.map(p => p.id)) : new Set());
  const [phase, setPhase] = useState(storedDone ? 'done' : 'compose'); // compose | planned | building | done
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const ready = sel.size >= parts.length;
  const toggle = (id) => { if (phase !== 'compose') return; setSel(prev => { const s = new Set(prev); if (s.has(id)) s.delete(id); else s.add(id); return s; }); };
  const send = () => { if (ready) setPhase('planned'); };
  const approve = () => { setPhase('building'); timer.current = setTimeout(() => { setPhase('done'); if (onDone) onDone(); }, 1200); };
  const chosen = parts.filter(p => sel.has(p.id));
  return (
    <>
      <p className="flow-label">1. Promptni yig'ing — aniqlik qo'shing</p>
      <div className="ai-card">
        <div className="prompt-box">
          <span className="prompt-q">"</span>{base}{chosen.length ? <> — {chosen.map((p, i) => <span key={p.id}><span style={{ color: T.success, fontWeight: 700 }}>{p.label}</span>{i < chosen.length - 1 ? ', ' : ''}</span>)}</> : <span style={{ color: T.ink3, fontStyle: 'italic' }}> …aniqlik qo'shing</span>}<span className="prompt-q">"</span>
        </div>
        {phase === 'compose' && (
          <>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {parts.map(p => <button key={p.id} className={`chip ${sel.has(p.id) ? 'chip-on' : ''}`} style={{ padding: '7px 12px', fontSize: 12.5 }} onClick={() => toggle(p.id)}>+ {p.label}</button>)}
            </div>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={!ready} onClick={send}>{ready ? 'Agentga yuborish →' : `Yana ${parts.length - sel.size} ta aniqlik qo'shing`}</button>
          </>
        )}
        {phase !== 'compose' && (
          <>
            <div className="ai-row"><span className="ai-badge" style={{ background: T.ink }}>Agent</span><span className="ai-bubble">{phase === 'planned' ? 'Mana rejam — tasdiqlaysizmi?' : (phase === 'building' ? 'Yozyapman…' : 'Bajardim — kodni tekshiring')}</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {planSteps.map((s, i) => <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}><span style={{ color: phase === 'planned' ? T.ink3 : T.success }}>{phase === 'planned' ? '○' : '✓'}</span><span style={{ color: T.ink }}>{s}</span></div>)}
            </div>
            {phase === 'planned' && <button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={approve}>Rejani tasdiqlash</button>}
            {phase === 'building' && <p className="ai-prompt" style={{ color: T.accent }}>Kod yozilyapti…</p>}
            {phase === 'done' && <div className="ai-code fade-step"><div className="ai-line ok" style={{ cursor: 'default', whiteSpace: 'pre-wrap' }}>{code}</div></div>}
          </>
        )}
      </div>
    </>
  );
};

// ===== SCREEN 0 — HOOK (4 ta alohida kuch → bitta ilova?) =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const SKILLS = [
    { k: 'komponent', t: 'Komponent + props + map', e: '🧩' },
    { k: 'state', t: 'State (xotira)', e: '💾' },
    { k: 'api', t: 'API — server (CRUD)', e: '🌐' },
    { k: 'router', t: 'Router (sahifalar)', e: '🧭' }
  ];
  const [seen, setSeen] = useState(storedAnswer ? new Set(SKILLS.map(s => s.k)) : new Set());
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const allSeen = seen.size >= 4;
  const tap = (k) => setSeen(prev => { const s = new Set(prev); s.add(k); return s; });
  const OPTS = [
    { id: 'a', label: 'Yo\'q — har biri alohida narsa' },
    { id: 'b', label: "Ha — bitta to'liq ilovaga birlashadi" },
    { id: 'c', label: 'Faqat kattalar buni qila oladi' }
  ];
  const pick = (v) => { if (picked !== null || !allSeen) return; setPicked(v); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: true }); };
  return (
    <Stage eyebrow="Kirish · loyiha kuni" screen={screen} scrollSignal={picked !== null} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 820 }}>4 ta alohida kuchni <span className="italic" style={{ color: T.accent }}>bitta ilovaga</span> birlashtira olamizmi?</h1>
        <Mentor>Bu modulda 4 ta kuch o'rgandingiz — har biri alohida. Bugun ularni <b style={{ color: T.ink }}>bitta haqiqiy ilovaga</b> qo'shamiz: <b style={{ color: T.ink }}>AvtoIjara</b> (mashina ijara sayti). To'rttala kuchni bosib eslang.</Mentor>
        <Split>
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SKILLS.map(s => (
                <button key={s.k} className="vcard" onClick={() => tap(s.k)} style={{ boxShadow: seen.has(s.k) ? `inset 0 0 0 1.5px ${T.success}` : undefined }}>
                  <span style={{ fontSize: 20 }}>{s.e}</span>
                  <span className="vlbl">{s.t}</span>
                  <span className="vseen" style={{ color: seen.has(s.k) ? T.success : T.ink3 }}>{seen.has(s.k) ? '✓' : ''}</span>
                </button>
              ))}
            </div>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Shularni birlashtirib, to'liq sayt chiqadimi?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => {
                const on = picked === o.id;
                return (
                  <button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null || !allSeen} style={{ opacity: !allSeen ? 0.55 : 1 }} onClick={() => pick(o.id)}>
                    <span className="radio">{on && <span className="radio-dot" />}</span>
                    <span>{o.label}</span>
                  </button>
                );
              })}
            </div>
            {!allSeen && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>Avval 4 kuchni bosib eslang ←</p>}
            {picked !== null && <p className="hook-ack fade-step">Aynan! Har bir kuch — ilovaning bir qismi. Bugun siz <b>loyiha boshlig'i</b>siz: rejani tuzasiz, <b>AI'ga buyurib</b> qurasiz, kodini tekshirasiz. Bo'sh sahifadan — to'liq AvtoIjara ilovasigacha.</p>}
          </Col>
        </Split>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const STEPS = [
    { text: 'Loyihani rejalashtirish', tag: 'sahifalar + ma\'lumot' },
    { text: 'Yaxshi prompt yozish', tag: 'Nima + Qanday + Qayerda' },
    { text: 'Agent quradi — siz tekshirasiz', tag: 'buyur → reja → tasdiq' },
    { text: 'Xatolarni debug qilish', tag: 'kodni o\'qib tuzatish' },
    { text: 'To\'liq ilovani yig\'ish', tag: 'AvtoIjara tayyor' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const PreviewBlock = (
    <Col>
      <p className="flow-label">Dars oxirida — sizning to'liq ilovangiz</p>
      <Win title="AvtoIjara — localhost:5173" minH={130}>
        <div className="navmenu" style={{ marginBottom: 8 }}>
          <span className="navlink on">🏠 Bosh</span><span className="navlink">🔑 Ijaralarim</span><span className="navlink">➕ Qo'shish</span>
        </div>
        <Grid cols={3}><CarCard car={CARS[0]} /><CarCard car={CARS[1]} /><CarCard car={CARS[2]} /></Grid>
      </Win>
      <p className="mono small" style={{ color: T.accent, margin: 0 }}>→ katalog · ijara · jami narx — bitta ilovada</p>
    </Col>
  );
  const StepsBlock = (
    <Col>
      <p className="flow-label">Bugungi 5 qadam</p>
      <ol className="roadmap">
        {STEPS.map((s, i) => (<li key={i} className="step-card fade-up" style={{ animationDelay: `${0.08 + i * 0.05}s` }}><span className="step-num">{String(i + 1).padStart(2, '0')}</span><span className="step-body"><span className="step-text">{s.text}</span>{s.tag && <span className="step-tag">{s.tag}</span>}</span></li>))}
      </ol>
    </Col>
  );
  return (
    <Stage eyebrow="Reja" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Boshlaymiz →" onClick={onNext} /></>}>
      <div className="screen">
        <div className="head">
          <h2 className="title h-title fade-up">Bugun siz <span className="italic" style={{ color: T.accent }}>loyiha boshlig'i</span>siz — AI esa jamoangiz.</h2>
        </div>
        <Mentor>Sir shu: yaxshi dasturchi har qatorni o'zi yozmaydi — u <b style={{ color: T.ink }}>aniq buyuradi</b> va <b style={{ color: T.ink }}>natijani tekshiradi</b>. Bugun shuni mashq qilamiz: aniq prompt → agent quradi → siz tekshirasiz va tuzatasiz. Oxirida to'liq <b style={{ color: T.ink }}>AvtoIjara</b> ilovasi.</Mentor>
        {!isNarrow ? (
          <Split>{PreviewBlock}{StepsBlock}</Split>
        ) : !showSteps ? (
          <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>
            {PreviewBlock}
            <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>Bugungi 5 qadamni ko'rish</button>
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

// ===== SCREEN 2 — LOYIHA CHIZMASI (sahifa → vazifa) =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const PAGES = [
    { path: '/', page: 'Bosh', icon: '🏠', jobId: 'get', job: 'mashinalarni serverdan olib ko\'rsatish (GET + map)' },
    { path: '/car/:id', page: 'Mashina', icon: '🚗', jobId: 'router', job: 'bitta mashina tafsiloti (Router + :id)' },
    { path: '/bookings', page: 'Ijaralarim', icon: '🔑', jobId: 'state', job: 'tanlangan mashinalar + jami narx (state)' },
    { path: '/add', page: 'Qo\'shish', icon: '➕', jobId: 'post', job: 'yangi mashina qo\'shish (POST)' }
  ];
  const JOBS = [
    { id: 'get', label: 'Serverdan olish (GET)' },
    { id: 'router', label: 'Bitta mashina (Router)' },
    { id: 'state', label: 'Jami narx (state)' },
    { id: 'post', label: 'Yangi qo\'shish (POST)' }
  ];
  const [taskIdx, setTaskIdx] = useState(storedAnswer ? PAGES.length : 0);
  const [shakeId, setShakeId] = useState(null);
  const timer = useRef(null);
  const done = taskIdx >= PAGES.length;
  useEffect(() => () => clearTimeout(timer.current), []);
  const cur = PAGES[Math.min(taskIdx, PAGES.length - 1)];
  const tap = (jobId) => {
    if (done) return;
    if (jobId === cur.jobId) setTaskIdx(t => t + 1);
    else { clearTimeout(timer.current); setShakeId(jobId); timer.current = setTimeout(() => setShakeId(null), 450); }
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Loyiha chizmasi" screen={screen} scrollSignal={done} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Chizmani tuzing (${Math.min(taskIdx, PAGES.length)}/4)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Quruvchidan oldin — <span className="italic" style={{ color: T.accent }}>chizma</span>. Har sahifa nima qiladi?</h2></div>
        <Mentor>Loyiha boshlig'i avval ilovani <b style={{ color: T.ink }}>bo'laklaydi</b>: 4 sahifa, har biri bitta vazifa. Mana AvtoIjara sahifalari — har biriga to'g'ri vazifani biriktiring. Shu — sizning loyiha chizmangiz.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">Sahifalar</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {PAGES.map((p, i) => {
                const matched = i < taskIdx;
                const activeRow = !done && i === taskIdx;
                return (
                  <div key={p.path} className="routerow" style={{ boxShadow: activeRow ? `inset 0 0 0 1.5px ${T.accent}` : (matched ? `inset 0 0 0 1.5px ${T.success}` : `0 4px 12px -6px rgba(${T.shadowBase},0.14)`), background: matched ? T.successSoft : T.paper }}>
                    <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: 12.5, color: matched ? T.success : T.ink }}>{p.icon} {p.page}</span>
                    <span className="mono" style={{ marginLeft: 'auto', fontSize: 11, color: T.ink3 }}>{p.path}</span>
                  </div>
                );
              })}
            </div>
          </Col>
          <Col>
            {!done ? (
              <>
                <div className="sk-info" key={taskIdx}><p className="body" style={{ margin: 0, color: T.ink }}><b style={{ color: T.accent }}>{cur.icon} {cur.page}</b> ({cur.path}) sahifasi nima qiladi?</p></div>
                <p className="flow-label" style={{ margin: 0 }}>Vazifani tanlang</p>
                <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {JOBS.map(j => <button key={j.id} className={`gchip ${shakeId === j.id ? 'shake' : ''}`} onClick={() => tap(j.id)} style={{ justifyContent: 'flex-start', padding: '11px 14px' }}>{j.label}</button>)}
                </div>
              </>
            ) : (
              <>
                <p className="flow-label" style={{ margin: 0 }}>Tayyor chizma</p>
                <div className="code-box fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '13px 15px' }}>
                  {PAGES.map(p => <TLine key={p.path} out={<span><span style={{ color: CODE.attr }}>{p.path}</span> <span style={{ color: CODE.comment }}>→ {p.job}</span></span>} />)}
                </div>
                <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana loyiha chizmasi: 4 sahifa, har biri bitta vazifa — Router, API, state birga. Endi har birini AI'ga qurdiramiz.</p></div>
              </>
            )}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — PROMPT MAHORATI (zaif vs kuchli) =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [view, setView] = useState(null); // 'weak' | 'strong'
  const [seen, setSeen] = useState(storedAnswer ? new Set(['weak', 'strong']) : new Set());
  const done = seen.size >= 2;
  const show = (v) => { setView(v); setSeen(prev => { const s = new Set(prev); s.add(v); return s; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Prompt mahorati" screen={screen} scrollSignal={done} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkala promptni ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bir xil ish — <span className="italic" style={{ color: T.accent }}>ikki xil prompt</span>. Farqi katta.</h2></div>
        <Mentor>Agent siz nima desangiz — shuni qiladi. Yaxshi prompt 3 narsani aytadi: <b style={{ color: T.ink }}>Nima</b> kerak · <b style={{ color: T.ink }}>Qanday</b> ishlasin · <b style={{ color: T.ink }}>Qayerda</b> bo'lsin. Ikkala tugmani bosib, farqni ko'ring.</Mentor>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 9 }}>
              <button className={`btn-soft ${view === 'weak' ? '' : ''}`} style={view === 'weak' ? { boxShadow: `inset 0 0 0 1.5px ${T.danger}` } : undefined} onClick={() => show('weak')}>😕 Zaif prompt {seen.has('weak') ? '✓' : ''}</button>
              <button className="btn" style={view === 'strong' ? { background: T.success } : undefined} onClick={() => show('strong')}>💪 Kuchli prompt {seen.has('strong') ? '✓' : ''}</button>
            </div>
            <div className="ai-card" style={{ minHeight: 90 }}>
              {!view && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>Yuqoridan bittasini tanlang…</p>}
              {view === 'weak' && <div className="fade-step"><div className="prompt-box" style={{ boxShadow: `inset 0 0 0 1px ${T.danger}` }}><span className="prompt-q">"</span>mashina qo'sh<span className="prompt-q">"</span></div><p className="small" style={{ color: T.danger, margin: '8px 0 0' }}>Agent: qaysi mashina? qayerga? narxi-chi? — <b>taxmin qiladi</b>, ko'pincha xato.</p></div>}
              {view === 'strong' && <div className="fade-step"><div className="prompt-box" style={{ boxShadow: `inset 0 0 0 1px ${T.success}` }}><span className="prompt-q">"</span><b>Bosh sahifaga</b> "Mashina qo'shish" formasi yasa — <b>nom va kunlik narx</b> kiritilsin, "Saqlash"da <b>serverga POST</b> qilinsin<span className="prompt-q">"</span></div><p className="small" style={{ color: T.success, margin: '8px 0 0' }}>Agent: aniq biladi — to'g'ri quradi.</p></div>}
            </div>
          </Col>
          <Col>
            <p className="flow-label">Yaxshi promptning 3 qismi</p>
            <div className="fade-up delay-2" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[['Nima', 'qanday funksiya kerak', '🎯'], ['Qanday', 'qanday ishlasin / ko\'rinsin', '⚙️'], ['Qayerda', 'qaysi sahifa / joy', '📍']].map(([a, b, e]) => (
                <div key={a} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 13px', borderRadius: 11, background: T.paper, boxShadow: `0 4px 12px -6px rgba(${T.shadowBase},0.14)` }}>
                  <span style={{ fontSize: 17 }}>{e}</span><span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: 13, color: T.accent, minWidth: 64 }}>{a}</span><span style={{ fontSize: 12.5, color: T.ink2 }}>{b}</span>
                </div>
              ))}
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Qoida: <b>aniq prompt — aniq natija</b>. Bugun har buyruqni shu 3 qism bilan yig'asiz — agent adashmaydi, siz tezroq quradigan bo'lasiz.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 (prompt sifati) =====
const Screen4 = (props) => (
  <QuestionScreen {...props} idx={4} scope="module-mikro" eyebrow="Mashq · 1-savol"
    questionText="Qaysi prompt agentga aniqroq va yaxshiroq?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Qaysi prompt agentga <span className="italic" style={{ color: T.accent }}>aniqroq</span>?</h2></>}
    options={['"Bosh sahifaga mashinalar katalogini chiqar — serverdan (GET), har birini kartochka qilib, nom va narx bilan"', '"chiroyli qil"', '"mashina"', '"hammasini o\'zing bil"']} correctIdx={0}
    explainCorrect="To'g'ri! Bu promptda Nima (katalog), Qanday (GET, kartochka, nom+narx) va Qayerda (Bosh sahifa) — hammasi aniq. Agent adashmaydi."
    explainWrong={{
      1: "Juda noaniq — nimani chiroyli qil? Agent taxmin qiladi. Nima/Qanday/Qayerda kerak.",
      2: "Bitta so'z — agent hech narsa bilmaydi. Aniqlik qo'shing.",
      3: "Bu eng yomoni — siz boshliqsiz, rejani siz berasiz. Aniq ayting.",
      default: "Yaxshi prompt = Nima + Qanday + Qayerda. Aniq prompt — aniq natija."
    }} />
);

// ===== SCREEN 5 — VIBECODING: KATALOG (GET + map) =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [done, setDone] = useState(!!storedAnswer);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Qurish · Katalog" screen={screen} scrollSignal={done} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Agent bilan quring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">1-qism: <span className="italic" style={{ color: T.accent }}>Katalog</span>ni agentga qurdiring.</h2></div>
        <Mentor>Birinchi sahifa — Bosh: mashinalar katalogi. Promptga <b style={{ color: T.ink }}>aniqlik qo'shing</b> (qaysi ma'lumot, qayerdan), so'ng agentga yuboring. Reja kelganda — tasdiqlang, kodni o'qing.</Mentor>
        <div className="split">
          <Col>
            <AgentBuild
              base="Bosh sahifada mashinalar katalogini ko'rsat"
              parts={[{ id: 'get', label: 'serverdan yuklab (GET)' }, { id: 'map', label: 'har birini kartochka qilib (map)' }, { id: 'price', label: 'nom va kunlik narx bilan' }]}
              planSteps={["useEffect ichida fetch(GET) bilan mashinalarni olaman", "setCars(data) — state'ga yozaman", "cars.map bilan har biriga CarCard chizaman"]}
              code={<>{'fetch('}<St>'https://avto-api.uz/cars'</St>{')'}{'\n  .then(r => r.json())'}{'\n  .then(data => setCars(data));'}{'\n\n'}{'{cars.map(c => '}<Jx>{'<CarCard '}</Jx><At>car</At>{'={c}'}<Jx>{' />'}</Jx>{')}'}</>}
              storedDone={!!storedAnswer}
              onDone={() => setDone(true)}
            />
          </Col>
          <Col>
            <p className="flow-label">Natija — AvtoIjara</p>
            <Win title="AvtoIjara — localhost:5173" minH={130}>
              {done
                ? <div className="fade-step"><div className="navmenu" style={{ marginBottom: 8 }}><span className="navlink on">🏠 Bosh</span></div><Grid cols={3}>{CARS.map(c => <CarCard key={c.id} car={c} />)}</Grid></div>
                : <p style={{ color: T.ink3, fontStyle: 'italic', margin: 0, fontFamily: 'Georgia, serif', fontSize: 13 }}>Promptni yig'ib, agentga yuboring…</p>}
            </Win>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Katalog tayyor! Kodni tekshirdingiz: <span className="mono">fetch</span> serverdan oladi, <span className="mono">map</span> har biriga kartochka chizadi. 1-qism bajarildi.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 5b — TEST 2 =====
const Screen5b = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Tekshiruv"
    questionText="Katalogni serverdan yuklash uchun qaysi kerak?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Mustahkamlash</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Katalogni <span className="italic" style={{ color: T.accent }}>serverdan yuklash</span> uchun?</h2></>}
    options={['fetch (GET) + .json() + setCars, keyin map bilan chizish', 'Faqat map yetadi', 'Har mashinani qo\'lda yozish', 'CSS bilan']} correctIdx={0}
    explainCorrect="To'g'ri! Serverdan fetch(GET) bilan olamiz, .json() massivga aylantiradi, setCars state'ga yozadi — React map bilan chizadi."
    explainWrong={{
      1: "map faqat tayyor ro'yxatni chizadi. Ro'yxatni avval serverdan fetch bilan olish kerak.",
      2: "Yo'q — minglab mashinani qo'lda yozmaymiz. Server + fetch + map.",
      3: "CSS — bezak. Ma'lumotni olish — fetch (GET).",
      default: "fetch(GET) → .json() → setCars → map."
    }} />
);

// ===== SCREEN 6 — VIBECODING: ROUTER + MASHINA SAHIFASI =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [done, setDone] = useState(!!storedAnswer);
  const [openId, setOpenId] = useState(null);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Qurish · Router" screen={screen} scrollSignal={done} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Agent bilan quring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">2-qism: har mashinaga <span className="italic" style={{ color: T.accent }}>alohida sahifa</span>.</h2></div>
        <Mentor>Endi kartochka bosilganda mashina sahifasi (<span className="mono">/car/:id</span>) ochilsin — qayta yuklanmay. Promptga aniqlik qo'shing, agentga yuboring. Tayyor bo'lgach, natijada kartochkani bosib sinab ko'ring.</Mentor>
        <div className="split">
          <Col>
            <AgentBuild
              base="Kartochka bosilganda mashina sahifasi ochilsin"
              parts={[{ id: 'route', label: 'har mashinaga /car/:id manzili' }, { id: 'link', label: '<Link> bilan (qayta yuklanmasin)' }, { id: 'detail', label: 'narx va xususiyatlar ko\'rsatilsin' }]}
              planSteps={["<Route path='/car/:id' element={<CarPage />} /> qo'shaman", "Kartochkani <Link to={'/car/' + c.id}> ichiga olaman", "CarPage'da useParams bilan mashinani topib chizaman"]}
              code={<><Jx>{'<Route '}</Jx><At>path</At>=<St>"/car/:id"</St> <At>element</At>{'={<CarPage />}'}<Jx>{' />'}</Jx>{'\n\n'}<Jx>{'<Link '}</Jx><At>to</At>{'={'}<St>"/car/"</St>{' + c.id}'}<Jx>{'>'}</Jx>{'<CarCard car={c} />'}<Jx>{'</Link>'}</Jx></>}
              storedDone={!!storedAnswer}
              onDone={() => setDone(true)}
            />
          </Col>
          <Col>
            <p className="flow-label">Natija {done ? '— kartochkani bosing' : ''}</p>
            <Win title="AvtoIjara — localhost:5173" minH={130}>
              {done
                ? (openId
                  ? <div key={openId} className="fade-step"><div className="navmenu" style={{ marginBottom: 8 }}><button className="navlink" onClick={() => setOpenId(null)}>🏠 Bosh</button></div><CarDetail id={openId} /></div>
                  : <div className="fade-step"><div className="navmenu" style={{ marginBottom: 8 }}><span className="navlink on">🏠 Bosh</span></div><Grid cols={3}>{CARS.map(c => <CarCard key={c.id} car={c} onOpen={() => setOpenId(c.id)} />)}</Grid></div>)
                : <p style={{ color: T.ink3, fontStyle: 'italic', margin: 0, fontFamily: 'Georgia, serif', fontSize: 13 }}>Promptni yig'ib, agentga yuboring…</p>}
            </Win>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Ishladi! Kartochka → <span className="mono">/car/:id</span> sahifasi, qayta yuklanmay. <span className="mono">useParams</span> qaysi mashina ekanini biladi. 2-qism bajarildi.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — VIBECODING: IJARA + JAMI NARX (state) =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [done, setDone] = useState(!!storedAnswer);
  const [bookings, setBookings] = useState([]); // {car, days}
  const rent = (car) => setBookings(prev => (prev.some(b => b.car.id === car.id) ? prev : [...prev, { car, days: 2 }]));
  const setDays = (id, d) => setBookings(prev => prev.map(b => b.car.id === id ? { ...b, days: Math.max(1, d) } : b));
  const total = bookings.reduce((s, b) => s + b.car.price * b.days, 0);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Qurish · Ijara" screen={screen} scrollSignal={done} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Agent bilan quring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">3-qism: <span className="italic" style={{ color: T.accent }}>ijara + jami narx</span> — ilovaning yuragi.</h2></div>
        <Mentor>Eng qiziq qism: mashinani ijaraga olib, <b style={{ color: T.ink }}>necha kun</b>ga tanlash — jami narx <b style={{ color: T.ink }}>o'zi hisoblanadi</b>. Bu — state ishi. Promptni yig'ing, agentga yuboring, keyin natijada ijaraga olib sinang.</Mentor>
        <div className="split">
          <Col>
            <AgentBuild
              base="Mashinani ijaraga olish funksiyasini qo'sh"
              parts={[{ id: 'add', label: '"Mening ijaralarim" ro\'yxatiga qo\'shsin' }, { id: 'days', label: 'necha kun tanlansin' }, { id: 'total', label: 'jami = kun × kunlik narx' }]}
              planSteps={["'Ijaraga' bosilganda setBookings([...bookings, {car, days}])", "Kun sonini tanlash (+/-)", "Jami narxni hisoblash: har ijara uchun kun × narx"]}
              code={<>{'setBookings([...bookings, { car, days: 2 }]);'}{'\n\n'}<Jx>{'const'}</Jx>{' jami = bookings.reduce((s, b) =>'}{'\n  s + b.car.price '}<span style={{ background: 'rgba(31,122,77,0.18)', borderRadius: 4, padding: '0 3px' }}>{'* b.days'}</span>{', 0);'}</>}
              storedDone={!!storedAnswer}
              onDone={() => setDone(true)}
            />
          </Col>
          <Col>
            <p className="flow-label">Natija {done ? '— mashinani ijaraga oling' : ''}</p>
            <Win title="AvtoIjara — localhost:5173" minH={150}>
              {done ? (
                <div className="fade-step">
                  <Grid cols={2}>{CARS.slice(0, 2).map(c => <CarCard key={c.id} car={c} onRent={() => rent(c)} />)}</Grid>
                  <div style={{ marginTop: 10, borderTop: `1px solid ${T.bg}`, paddingTop: 9 }}>
                    <p className="flow-label" style={{ margin: '0 0 6px' }}>🔑 Mening ijaralarim</p>
                    {bookings.length === 0 ? <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>Yuqoridan "Ijaraga" ni bosing…</p> : (
                      <>
                        {bookings.map(b => (
                          <div key={b.car.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, padding: '5px 0' }}>
                            <span style={{ fontWeight: 700, color: T.ink, flex: 1 }}>{b.car.emoji} {b.car.name}</span>
                            <button className="daybtn" onClick={() => setDays(b.car.id, b.days - 1)}>−</button>
                            <span className="mono" style={{ minWidth: 44, textAlign: 'center' }}>{b.days} kun</span>
                            <button className="daybtn" onClick={() => setDays(b.car.id, b.days + 1)}>+</button>
                            <span style={{ color: T.accent, fontWeight: 800, minWidth: 50, textAlign: 'right' }}>${b.car.price * b.days}</span>
                          </div>
                        ))}
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, paddingTop: 6, borderTop: `1.5px solid ${T.ink3}40`, fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: 14 }}><span>Jami:</span><span style={{ color: T.success }}>${total}</span></div>
                      </>
                    )}
                  </div>
                </div>
              ) : <p style={{ color: T.ink3, fontStyle: 'italic', margin: 0, fontFamily: 'Georgia, serif', fontSize: 13 }}>Promptni yig'ib, agentga yuboring…</p>}
            </Win>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Yuragi tayyor! Kun o'zgarsa — jami <b>o'zi qayta hisoblanadi</b> (state). <span className="mono">kun × narx</span> — ilovaning asosiy mantiqi.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — TEST 3 =====
const Screen8 = (props) => (
  <QuestionScreen {...props} idx={8} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="3 kunlik Tesla ($80/kun) — jami qancha?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Tesla <span className="mono" style={{ color: T.accent }}>$80/kun</span>, 3 kunga — <span className="italic" style={{ color: T.accent }}>jami</span>?</h2></>}
    options={['$240 — kun × narx (3 × 80)', '$80 — kunini hisobga olmaymiz', '$83 — qo\'shamiz', '$3']} correctIdx={0}
    explainCorrect="To'g'ri! Jami = kun × kunlik narx = 3 × 80 = $240. Bu ilovaning asosiy formulasi."
    explainWrong={{
      1: "Diqqat! Bu — eng ko'p uchraydigan xato: kunni unutish. Jami = kun × narx.",
      2: "Qo'shish emas, ko'paytirish: 3 × 80 = 240.",
      3: "Yo'q — bu faqat kun soni. Narxga ko'paytiring: 3 × 80.",
      default: "Jami = kun × kunlik narx = 3 × 80 = $240."
    }} />
);

// ===== SCREEN 9 — VIBECODING: QO'SHISH + ITERATSIYA (follow-up) =====
const Screen9 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [built, setBuilt] = useState(!!storedAnswer);
  const [iterated, setIterated] = useState(!!storedAnswer);
  const [list, setList] = useState(CARS.slice(0, 3));
  const [onAdd, setOnAdd] = useState(false); // /add sahifasidami
  const done = built && iterated;
  const addCar = () => {
    setList(prev => (prev.length >= 4 ? prev : [...prev, POOL[0]]));
    if (iterated) setOnAdd(false); // tuzatilgan: Bosh'ga qaytadi
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Qurish · Qo'shish" screen={screen} scrollSignal={built || done} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : (built ? 'Agentni to\'g\'rilang' : 'Agent bilan quring')} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">4-qism: <span className="italic" style={{ color: T.accent }}>mashina qo'shish</span> — va agentni sayqallash.</h2></div>
        <Mentor>Sotuvchi yangi mashina qo'shsin (POST). Lekin diqqat: agent <b style={{ color: T.ink }}>birinchi urinishda</b> ko'pincha to'liq qilmaydi — siz natijani ko'rib, <b style={{ color: T.ink }}>aniqlashtiruvchi prompt</b> berasiz. Mana shu — haqiqiy agent boshqaruvi.</Mentor>
        <div className="split">
          <Col>
            {!built ? (
              <AgentBuild
                base="Mashina qo'shish formasini yasa"
                parts={[{ id: 'form', label: 'nom va narx kiritilsin' }, { id: 'post', label: '"Saqlash"da serverga POST' }]}
                planSteps={["Forma: nom + narx input", "Saqlash: fetch POST + body"]}
                code={<>{'fetch(url, { '}<At>method</At>{': '}<St>'POST'</St>{', '}<At>body</At>{': JSON.stringify(yangi) })'}</>}
                storedDone={false}
                onDone={() => setBuilt(true)}
              />
            ) : (
              <div className="ai-card fade-step">
                <div className="ai-row"><span className="ai-badge" style={{ background: T.ink }}>Agent</span><span className="ai-bubble">{iterated ? 'Tuzatdim — endi Bosh\'ga qaytaradi' : 'Bajardim — sinab ko\'ring'}</span></div>
                <div className="ai-code"><div className="ai-line ok" style={{ cursor: 'default', whiteSpace: 'pre-wrap' }}>{iterated ? <>{'fetch(url, { method: '}<St>'POST'</St>{', … });'}{'\n'}<span style={{ background: 'rgba(31,122,77,0.18)', borderRadius: 4, padding: '0 3px' }}>{'navigate('}<St>'/'</St>{');'}</span>{'  '}<Cm>{'// Bosh\'ga qaytaradi'}</Cm></> : <>{'fetch(url, { method: '}<St>'POST'</St>{', … });'}{'  '}<Cm>{'// qo\'shadi, lekin /add\'da qoladi'}</Cm></>}</div></div>
                {!iterated && (
                  <>
                    <div className="prompt-box" style={{ marginTop: 4 }}><span className="prompt-q">"</span>Qo'shgandan keyin avtomatik <b>Bosh sahifaga qaytar</b> (useNavigate)<span className="prompt-q">"</span></div>
                    <button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={() => { setIterated(true); setOnAdd(false); }}>↳ Aniqlashtiruvchi prompt yuborish</button>
                  </>
                )}
                {iterated && <p className="ai-prompt" style={{ color: T.success, fontStyle: 'normal', fontWeight: 600 }}>✓ Endi to'liq ishlaydi.</p>}
              </div>
            )}
          </Col>
          <Col>
            <p className="flow-label">Natija {built ? '— "+ Qo\'shish"ni sinang' : ''}</p>
            <Win title="AvtoIjara — localhost:5173" minH={140}>
              {built ? (
                <div className="fade-step">
                  <div className="navmenu" style={{ marginBottom: 8 }}><span className={`navlink ${onAdd ? '' : 'on'}`}>🏠 Bosh</span><span className={`navlink ${onAdd ? 'on' : ''}`}>➕ Qo'shish</span></div>
                  {onAdd && !iterated
                    ? <div><div style={{ background: T.bg, borderRadius: 8, padding: '8px 11px', fontSize: 12, color: T.ink3, marginBottom: 8 }}>Yangi mashina qo'shildi ✓ — lekin hali shu yerdasiz</div><p className="small" style={{ color: T.danger, fontStyle: 'italic', margin: 0 }}>Bosh sahifaga qaytmadi! Agentni to'g'rilang ←</p></div>
                    : <><div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}><button className="chip chip-on" style={{ padding: '6px 12px', fontSize: 12 }} onClick={() => { setOnAdd(true); addCar(); }}>+ Qo'shish</button></div><Grid cols={3}>{list.map(c => <CarCard key={c.id} car={c} />)}</Grid></>}
                </div>
              ) : <p style={{ color: T.ink3, fontStyle: 'italic', margin: 0, fontFamily: 'Georgia, serif', fontSize: 13 }}>Promptni yig'ib, agentga yuboring…</p>}
            </Win>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana agent boshqaruvi: birinchi natija to'liq emasdi — siz ko'rdingiz, <b>aniqlashtiruvchi prompt</b> berdingiz, AI tuzatdi. Birinchi javobni ko'r-ko'rona qabul qilmang!</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 10 — AMALIYOT: TO'LIQ ILOVANI ISHLATING =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [page, setPage] = useState('/');
  const [openId, setOpenId] = useState(1);
  const [bookings, setBookings] = useState([]);
  const [didBrowse, setDidBrowse] = useState(!!storedAnswer);
  const [didRent, setDidRent] = useState(!!storedAnswer);
  const [didTotal, setDidTotal] = useState(!!storedAnswer);
  const done = didBrowse && didRent && didTotal;
  const open = (id) => { setOpenId(id); setPage('/car/:id'); setDidBrowse(true); };
  const rent = (car) => { setBookings(prev => (prev.some(b => b.car.id === car.id) ? prev : [...prev, { car, days: 2 }])); setDidRent(true); setPage('/bookings'); };
  const setDays = (id, d) => { setBookings(prev => prev.map(b => b.car.id === id ? { ...b, days: Math.max(1, d) } : b)); setDidTotal(true); };
  const total = bookings.reduce((s, b) => s + b.car.price * b.days, 0);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const Tick = ({ ok, label }) => <span className="tagpill" style={{ color: ok ? T.success : T.ink3 }}>{ok ? '✓' : '○'} {label}</span>;
  return (
    <Stage eyebrow="Amaliyot · to'liq ilova" screen={screen} scrollSignal={done} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : '3 amalni bajaring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(8px,1.2vw,12px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Endi <span className="italic" style={{ color: T.accent }}>to'liq ilovani</span> o'zingiz ishlating.</h2></div>
        <Mentor>Mana yig'ilgan AvtoIjara! Sinab ko'ring: mashinani <b style={{ color: T.ink }}>oching</b> → <b style={{ color: T.ink }}>ijaraga oling</b> → kunni o'zgartirib <b style={{ color: T.ink }}>jami narx</b>ni kuzating. Uchalasi bajarilsa — ilova ishlaydi!</Mentor>
        <div className="split">
          <Col>
            <Win title="AvtoIjara — localhost:5173" minH={180}>
              <div className="navmenu" style={{ marginBottom: 9 }}>
                <button className={`navlink ${page === '/' ? 'on' : ''}`} onClick={() => setPage('/')}>🏠 Bosh</button>
                <button className={`navlink ${page === '/bookings' ? 'on' : ''}`} onClick={() => setPage('/bookings')}>🔑 Ijaralarim {bookings.length ? `(${bookings.length})` : ''}</button>
              </div>
              {page === '/' && <Grid cols={3}>{CARS.map(c => <CarCard key={c.id} car={c} onOpen={() => open(c.id)} />)}</Grid>}
              {page === '/car/:id' && <CarDetail id={openId} onRent={() => rent(carById(openId))} />}
              {page === '/bookings' && (
                bookings.length === 0 ? <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>Hali ijara yo'q — mashina oching va ijaraga oling.</p> : (
                  <div>
                    {bookings.map(b => (
                      <div key={b.car.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, padding: '5px 0' }}>
                        <span style={{ fontWeight: 700, color: T.ink, flex: 1 }}>{b.car.emoji} {b.car.name}</span>
                        <button className="daybtn" onClick={() => setDays(b.car.id, b.days - 1)}>−</button>
                        <span className="mono" style={{ minWidth: 44, textAlign: 'center' }}>{b.days} kun</span>
                        <button className="daybtn" onClick={() => setDays(b.car.id, b.days + 1)}>+</button>
                        <span style={{ color: T.accent, fontWeight: 800, minWidth: 50, textAlign: 'right' }}>${b.car.price * b.days}</span>
                      </div>
                    ))}
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, paddingTop: 6, borderTop: `1.5px solid ${T.ink3}40`, fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: 14 }}><span>Jami:</span><span style={{ color: T.success }}>${total}</span></div>
                  </div>
                )
              )}
            </Win>
          </Col>
          <Col>
            <p className="flow-label">Bajarilishi kerak</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              <Tick ok={didBrowse} label="Mashina ochdim" /><Tick ok={didRent} label="Ijaraga oldim" /><Tick ok={didTotal} label="Kun/jami o'zgartirdim" />
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>🎉 To'liq ishlaydi! Katalog (GET) → mashina sahifasi (Router) → ijara + jami (state) — hammasi bitta ilovada. Siz bularni <b>AI bilan birga qurdingiz</b>.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — DEBUGGING (jami narx: AI kunni unutgan) =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [picked, setPicked] = useState(storedAnswer ? 'total' : null);
  const [fixed, setFixed] = useState(!!storedAnswer);
  const found = picked === 'total';
  const done = fixed;
  const bookings = [{ car: CARS[1], days: 3 }, { car: CARS[0], days: 2 }]; // Lambo 3 kun, Tesla 2 kun
  const wrongTotal = bookings.reduce((s, b) => s + b.car.price, 0); // 200+80 = 280 (xato)
  const rightTotal = bookings.reduce((s, b) => s + b.car.price * b.days, 0); // 600+160 = 760
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Debugging" screen={screen} scrollSignal={found || fixed} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : (found ? 'Endi tuzating' : 'Xatoni toping')} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">AI yordam beradi — siz esa <span className="italic" style={{ color: T.accent }}>tekshirasiz</span>.</h2></div>
        <Mentor>Mijoz shikoyat qildi: <b style={{ color: T.ink }}>jami narx noto'g'ri</b>! Lamborghini 3 kun ($200) + Tesla 2 kun ($80) — jami $760 bo'lishi kerak, lekin $280 chiqyapti. Agent qaysidir qatorda <b style={{ color: T.ink }}>kun</b>ni unutgan. Toping.</Mentor>
        <div className="split">
          <Col>
            <div className="ai-card fade-up delay-2">
              <div className="ai-row"><span className="ai-badge">AI</span><span className="ai-bubble">Jami narx kodi:</span></div>
              <div className="ai-code">
                <div className={`ai-line ${picked === 'list' ? 'ok' : ''}`} onClick={() => { if (!found) setPicked('list'); }}><Jx>{'const'}</Jx>{' jami = bookings.reduce('}</div>
                {!fixed ? (
                  <div className={`ai-line ${found ? 'bad' : ''}`} onClick={() => { if (!found) setPicked('total'); }}>{'  (s, b) => s + b.car.price'}{'  '}<Cm>{'// kun qani?'}</Cm></div>
                ) : (
                  <div className="ai-line ok el-in">{'  (s, b) => s + b.car.price '}<span style={{ background: 'rgba(31,122,77,0.25)', borderRadius: 4, padding: '0 3px' }}>{'* b.days'}</span>{'  '}<Cm>{'// kun × narx!'}</Cm></div>
                )}
                <div className={`ai-line ${picked === 'end' ? 'ok' : ''}`} onClick={() => { if (!found) setPicked('end'); }}>{', 0);'}</div>
              </div>
              {!found && <p className="ai-prompt">Qaysi qator kunni hisobga olmayapti? Bosing.</p>}
              {found && !fixed && <button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={() => setFixed(true)}>🔧 * b.days qo'shish</button>}
              {fixed && <p className="ai-prompt" style={{ color: T.success, fontStyle: 'normal', fontWeight: 600 }}>✓ Tuzatildi — endi kun ham hisobga olinadi!</p>}
            </div>
          </Col>
          <Col>
            <p className="flow-label">🔑 Mening ijaralarim</p>
            <Win title="AvtoIjara — localhost:5173" minH={120}>
              {bookings.map(b => (
                <div key={b.car.id} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, padding: '5px 0' }}>
                  <span style={{ fontWeight: 700, color: T.ink, flex: 1 }}>{b.car.emoji} {b.car.name}</span>
                  <span className="mono" style={{ color: T.ink3 }}>{b.days} kun × ${b.car.price}</span>
                  <span style={{ color: T.accent, fontWeight: 800, minWidth: 50, textAlign: 'right' }}>${fixed ? b.car.price * b.days : b.car.price}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, paddingTop: 6, borderTop: `1.5px solid ${T.ink3}40`, fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: 15 }}><span>Jami:</span><span style={{ color: fixed ? T.success : T.danger }}>${fixed ? rightTotal : wrongTotal}{!fixed && ' ✗'}</span></div>
            </Win>
            {!found && (
              (picked === 'list' || picked === 'end')
                ? <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bu qator to'g'ri. Yana qarang: <span className="mono">b.car.price</span> bor, lekin <b>kun</b> (<span className="mono">b.days</span>) qayerda?</p></div>
                : <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Jami = <b style={{ color: T.ink }}>kun × narx</b> bo'lishi kerak edi. Kodda narx bor — lekin kunga ko'paytirilmagan qator qaysi?</p></div>
            )}
            {found && !fixed && <div className="frame-warn fade-step"><p className="note-h" style={{ color: T.accent }}>✓ Topdingiz!</p><p className="body" style={{ margin: 0, color: T.ink }}>Agent <span className="mono">s + b.car.price</span> yozgan — faqat narx, <b>kunsiz</b>. To'g'risi: <span className="mono">s + b.car.price * b.days</span>. Chapdagi tugma bilan tuzating →</p></div>}
            {fixed && <div className="takeaway fade-step"><div className="ta-bulb">🛠️</div><p className="ta-h">Topdingiz va tuzatdingiz — bu debugging!</p><p className="ta-sub">AI tez yozadi, siz tekshirib tuzatasiz — zo'r jamoa</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — TEST 4 =====
const Screen12 = (props) => (
  <QuestionScreen {...props} idx={12} scope="module-mikro" eyebrow="Mashq · 4-savol"
    questionText="Agentning birinchi kodi natijasi to'liq emas. Nima qilasiz?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Agent kodi natijasi <span className="italic" style={{ color: T.accent }}>to'liq emas</span> — nima qilasiz?</h2></>}
    options={['Natijani ko\'rib, aniqlashtiruvchi follow-up prompt beraman', 'Birinchi natijani shundayligicha qabul qilaman', 'Loyihani tashlab ketaman', 'AI yomon deb, hammasini qo\'lda yozaman']} correctIdx={0}
    explainCorrect="To'g'ri! Agentni boshqarish — bu suhbat: natijani ko'rasiz, aniq follow-up berasiz ('kunni ham hisobla'), AI tuzatadi. Birinchi javob ko'pincha boshlanish, oxiri emas."
    explainWrong={{
      1: "Yo'q — birinchi javob ko'pincha to'liq emas. Siz boshliqsiz: tekshiring va sayqallang.",
      2: "Yo'q — bir-ikki follow-up prompt bilan to'g'rilanadi. Tashlab ketish shart emas.",
      3: "AI yomon emas — uni boshqarish kerak. Aniq prompt bilan tezroq bo'lasiz.",
      default: "Natijani tekshir → aniqlashtiruvchi prompt ber → AI sayqallaydi."
    }} />
);

// ===== SCREEN 13 — TRANSFER ("istalgan saytni qura olaman") =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const IDEAS = [
    { e: '🍕', t: 'Pitsa yetkazish', d: 'menyu · savat · buyurtma' },
    { e: '🎵', t: 'Musiqa ro\'yxati', d: 'qo\'shiqlar · pleylist · like' },
    { e: '📚', t: 'Kitob do\'koni', d: 'katalog · savat · sotib olish' },
    { e: '⚽', t: 'Sport jadvali', d: 'o\'yinlar · natija · sevimli' }
  ];
  const [picked, setPicked] = useState(storedAnswer ? IDEAS[0].t : null);
  const done = !!picked;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Eng muhimi" screen={screen} scrollSignal={done} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Bitta g\'oyani tanlang'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bu mashina edi — lekin <span className="italic" style={{ color: T.accent }}>istalgan saytni</span> shu yo'l bilan.</h2></div>
        <Mentor>Eng muhim narsani anglang: siz mashina ilovasini emas, <b style={{ color: T.ink }}>5 qadamli usulni</b> o'rgandingiz — rejala → aniq prompt → agent quradi → tekshir → tuzat. Shu usul bilan <b style={{ color: T.ink }}>istalgan saytni</b> qurasiz. Quyidagi g'oyani tanlang — ko'ring: xuddi shu qadamlar.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">G'oyani tanlang</p>
            <div className="fade-up delay-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {IDEAS.map(idea => (
                <button key={idea.t} className={`chip ${picked === idea.t ? 'chip-on' : ''}`} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 3, padding: '11px 13px', height: 'auto' }} onClick={() => setPicked(idea.t)}>
                  <span style={{ fontSize: 18 }}>{idea.e} {idea.t}</span>
                  <span style={{ fontSize: 11, fontWeight: 500, opacity: 0.85 }}>{idea.d}</span>
                </button>
              ))}
            </div>
          </Col>
          <Col>
            {picked ? (
              <div className="fade-step">
                <p className="flow-label">"{picked}" — xuddi shu 5 qadam</p>
                <ol className="roadmap" style={{ gap: 6 }}>
                  {['Rejalashtir — sahifalar va ma\'lumot', 'Aniq prompt yoz (Nima + Qanday + Qayerda)', 'Agent quradi — rejani tasdiqla', 'Kodni tekshir + natijani sina', 'Xatoni debug qil → tayyor!'].map((s, i) => (
                    <li key={i} className="step-card" style={{ padding: '9px 13px' }}><span className="step-num">{i + 1}</span><span className="step-text" style={{ fontSize: 13 }}>{s}</span></li>
                  ))}
                </ol>
                <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Ko'rdingizmi? Mavzu o'zgardi — usul <b>o'sha</b>. Siz endi g'oyani aytib, agentni boshqarib, <b>istalgan saytni</b> qura olasiz.</p></div>
              </div>
            ) : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Chapdan g'oya tanlang</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — YAKUNIY (VS Code: jami narx formulasi) =====
const Screen14 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [value, setValue] = useState(storedAnswer?.picked || '');
  const [passed, setPassed] = useState(!!storedAnswer?.correct);
  const norm = value.replace(/\s+/g, ' ').trim();
  const valid = /^b\.(car\.)?price\s*\*\s*b\.days$|^b\.days\s*\*\s*b\.(car\.)?price$/.test(norm);
  const hasPrice = /b\.(car\.)?price/.test(value);
  const hasMul = /\*/.test(value);
  const hasDays = /b\.days/.test(value);
  useEffect(() => {
    if (valid && !passed) {
      setPassed(true);
      onAnswer(screen, { stage: 'final', screenIdx: screen, question: 'VS Code: jami uchun b.price * b.days', studentAnswer: value, correct: true, firstAttemptCorrect: true, solved: true, picked: value });
    }
  }, [valid]);
  const Ln = ({ n, children }) => (
    <div className="vsc-line"><span className="vsc-ln">{n}</span><span style={{ whiteSpace: 'pre' }}>{children}</span></div>
  );
  return (
    <Stage eyebrow="Yakuniy · amaliy" screen={screen} scrollSignal={passed} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!passed} label={passed ? 'Davom etish' : 'Formulani yozing'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Oxirgi qadam: ilovaning <span className="italic" style={{ color: T.accent }}>yuragini</span> o'zingiz yozing.</h2></div>
        <Mentor>VS Code'da jami narx hisobi ochiq — faqat <b style={{ color: T.ink }}>3-qator bo'sh</b>. Har ijara uchun <b style={{ color: T.ink }}>narx × kun</b> ni yozing: <span className="mono">b.price</span> <b style={{ color: T.ink }}>*</b> <span className="mono">b.days</span>. Mana shu — AvtoIjara'ning asosiy mantiqi.</Mentor>
        <div className="split">
          <Col>
            <div className="vsc fade-up delay-2">
              <div className="vsc-bar">
                <span className="vsc-tab on"><span style={{ color: '#61DAFB' }}>⚛</span> Bookings.jsx <span style={{ color: '#6E7681', marginLeft: 4 }}>×</span></span>
              </div>
              <div className="vsc-body">
                <Ln n={1}><Jx>{'const'}</Jx>{' jami = bookings.reduce('}</Ln>
                <Ln n={2}>{'  (s, b) => s +'}</Ln>
                <div className="vsc-line">
                  <span className="vsc-ln">3</span>
                  <span style={{ whiteSpace: 'pre' }}>{'    '}</span>
                  <input className={`vsc-input ${valid ? 'ok' : ''}`} value={value} onChange={e => setValue(e.target.value)} placeholder='b.price * b.days' spellCheck={false} autoCapitalize="off" autoCorrect="off" />
                </div>
                <Ln n={4}>{'  , 0);'}</Ln>
              </div>
            </div>
            <div className="fade-up delay-2" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="tagpill" style={{ opacity: hasPrice ? 1 : 0.4 }}>{hasPrice ? '✓' : '1'} b.price</span>
              <span className="tagpill" style={{ opacity: hasMul ? 1 : 0.4 }}>{hasMul ? '✓' : '2'} * (ko'paytirish)</span>
              <span className="tagpill" style={{ opacity: hasDays ? 1 : 0.4 }}>{hasDays ? '✓' : '3'} b.days</span>
            </div>
            {passed && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Mukammal! Jami = narx × kun. AvtoIjara to'liq ishlaydi — boshidan oxirigacha siz qurdingiz.</p></div>}
          </Col>
          <Col>
            <p className="flow-label">natija — Mening ijaralarim</p>
            <Win title="AvtoIjara — localhost:5173" minH={120}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, padding: '5px 0' }}><span style={{ fontWeight: 700, flex: 1 }}>🏎️ Lamborghini</span><span className="mono" style={{ color: T.ink3 }}>3 kun × $200</span><span style={{ color: T.accent, fontWeight: 800 }}>${valid ? 600 : '?'}</span></div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, padding: '5px 0' }}><span style={{ fontWeight: 700, flex: 1 }}>⚡ Tesla</span><span className="mono" style={{ color: T.ink3 }}>2 kun × $80</span><span style={{ color: T.accent, fontWeight: 800 }}>${valid ? 160 : '?'}</span></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, paddingTop: 6, borderTop: `1.5px solid ${T.ink3}40`, fontWeight: 800, fontSize: 15 }}><span>Jami:</span><span style={{ color: valid ? T.success : T.ink3 }}>${valid ? 760 : '?'}</span></div>
              {!valid && <p style={{ fontFamily: 'Georgia, serif', color: T.ink3, fontStyle: 'italic', margin: '10px 0 0', textAlign: 'center', fontSize: 12.5 }}>3-qator yozilmaguncha jami hisoblanmaydi</p>}
            </Win>
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 15 — YAKUN =====
const Screen15 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const RECAP = [
    "Loyihani bo'laklash: sahifalar + ma'lumot + amallar",
    "Yaxshi prompt = Nima + Qanday + Qayerda (aniq → aniq natija)",
    "Agentni boshqarish: buyur → reja → tasdiq → tekshir → sina",
    "Iteratsiya: natijani ko'rib, aniqlashtiruvchi follow-up prompt",
    "Debug: kodni o'qib xatoni topish (jami = kun × narx)"
  ];
  const HOMEWORK = [
    { b: 'O\'z g\'oyangiz', t: '— Antigravity bilan o\'zingiz xohlagan ilovani tanlang (mashina emas)' },
    { b: 'Rejalashtiring', t: '— sahifalar + ma\'lumotni qog\'ozga chizing' },
    { b: 'Quring', t: '— aniq promptlar bilan agentga qurdiring, tekshiring, tuzating' }
  ];
  const GLOSSARY = [
    { b: 'Loyiha chizmasi', t: '— sahifa + vazifa rejasi' },
    { b: 'Yaxshi prompt', t: '— Nima + Qanday + Qayerda' },
    { b: 'Agentni boshqarish', t: '— buyur → reja → tasdiq → tekshir' },
    { b: 'Iteratsiya', t: '— follow-up prompt bilan sayqallash' },
    { b: 'Debugging', t: '— kodni o\'qib xatoni topish va tuzatish' },
    { b: 'jami = kun × narx', t: '— AvtoIjara asosiy mantiqi' }
  ];
  const correct = SCORED_IDX.filter(i => answers[i]?.correct).length;
  const total = SCORED_IDX.length;
  const PASSED = (total ? correct / total : 0) >= 0.6;
  const [open, setOpen] = useState(false);
  const glossRef = useRef(null);
  const isNarrow = useIsMobile(768);
  const toggleGloss = () => setOpen(o => {
    const nv = !o;
    if (nv && isNarrow) setTimeout(() => { if (glossRef.current) glossRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 80);
    return nv;
  });
  return (
    <Stage eyebrow="Tayyor" screen={screen} navContent={<><NavBack onPrev={onPrev} /><button className="btn-ghost" onClick={onReset} style={{ padding: 'clamp(11px,1.6vw,13px) clamp(16px,2.2vw,22px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Qaytadan</button><button className="btn-white-accent" onClick={onFinish} style={{ marginLeft: 'auto', padding: 'clamp(11px,1.6vw,13px) clamp(22px,2.6vw,30px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Yakunlash ✓</button></>}>
      <div className="screen">
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">✓</span> Loyiha kuni tugadi</span><h2 className="title h-title fade-up d1">To'liq ilovani <span className="italic" style={{ color: T.accent }}>AI bilan qurdingiz</span>.</h2><p className="body h-sub fade-up d2">{PASSED ? "Tabriklaymiz! Endi siz g'oyani aytib, aniq prompt berib, agentni boshqarib va xatoni tuzatib — istalgan saytni qura olasiz." : "Yaxshi harakat! Prompt sifati va agent boshqaruvini mustahkamlash uchun bir-ikki ekranni qayta ko'ring."}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span className="tick" style={{ width: 16, height: 16, borderRadius: '50%', background: T.success, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck">✓</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>📝 Uyga vazifa</div><p className="body" style={{ margin: '0 0 10px', color: T.ink }}>Antigravity bilan o'z loyihangizni boshlang:</p><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">Keyingi va oxirgi qadam: o'z bitiruv loyihangizni katta bo'laklarga ajratib, noldan qurishni boshlaysiz! 🚀</p></div>
        </div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">💡 Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function ReactProjectDayLesson({ lang: langProp, onFinished }) {
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

  const screens = [Screen0, Screen1, Screen2, Screen3, Screen4, Screen5, Screen5b, Screen6, Screen7, Screen8, Screen9, Screen10, Screen11, Screen12, Screen13, Screen14, Screen15];
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

        .feedback-block { max-height: 0; opacity: 0; overflow: hidden; transition: max-height 0.4s ease-out, opacity 0.3s ease-out 0.1s, margin-top 0.4s ease-out; margin-top: 0; }
        .feedback-block.visible { max-height: 800px; opacity: 1; margin-top: clamp(14px,2vw,20px); }

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
        .btn-soft:disabled { opacity: 0.5; cursor: not-allowed; }

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
        .gchip { font-family: 'Manrope'; font-weight: 600; font-size: 12.5px; padding: 8px 13px; border-radius: 99px; border: none; background: ${T.paper}; color: ${T.ink}; cursor: pointer; transition: all 0.18s; box-shadow: 0 3px 10px -5px rgba(${T.shadowBase},0.2); display: inline-flex; align-items: center; gap: 6px; } .gchip:hover:not(:disabled) { transform: translateY(-1px); } .gchip:disabled { opacity: 0.4; cursor: not-allowed; }
        .tagpill { font-family: 'JetBrains Mono', monospace; font-size: 12.5px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 99px; background: ${T.paper}; color: ${T.ink}; box-shadow: 0 3px 10px -5px rgba(${T.shadowBase},0.18); transition: opacity 0.2s; }

        .vcard { display: flex; align-items: center; gap: 11px; width: 100%; text-align: left; background: ${T.paper}; border: none; border-radius: 12px; padding: 12px 15px; cursor: pointer; transition: all 0.18s; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.16); }
        .vcard:hover { transform: translateY(-1px); }
        .vlbl { font-family: 'Manrope', sans-serif; font-weight: 700; font-size: 13.5px; color: ${T.ink}; }
        .vseen { margin-left: auto; font-weight: 700; }

        .mentor { display: flex; gap: 12px; align-items: flex-start; }
        .mentor-ava { width: 40px; height: 40px; border-radius: 50%; overflow: hidden; flex-shrink: 0; box-shadow: 0 4px 12px -4px rgba(${T.shadowBase},0.28); }
        .mentor-ava svg { display: block; }
        .mentor-col { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5px; }
        .mentor-name { font-family: 'Manrope', sans-serif; font-weight: 700; font-size: 13px; color: ${T.accent}; letter-spacing: 0.01em; }
        .mentor-msg { background: ${T.paper}; border-radius: 4px 14px 14px 14px; padding: 13px 16px; color: ${T.ink}; box-shadow: 0 6px 18px -6px rgba(${T.shadowBase},0.16); }

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

        .frame { background: ${T.paper}; border-radius: 16px; padding: clamp(16px,3vw,24px); border: none; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.14); }
        .frame-soft { background: ${T.accentSoft}; border-left: 4px solid ${T.accent}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); box-shadow: 0 6px 16px -6px rgba(255,79,40,0.22); }
        .frame-success { background: ${T.successSoft}; border-left: 4px solid ${T.success}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); box-shadow: 0 6px 16px -6px rgba(31,122,77,0.22); }
        .frame-warn { background: ${T.accentSoft}; border-left: 4px solid ${T.accent}; border-radius: 12px; padding: 12px 15px; }
        .frame-dash { border: 1.5px dashed ${T.ink3}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); }

        .screen { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: clamp(14px,2vw,20px); }
        .head { display: flex; flex-direction: column; gap: 6px; }
        .split { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: clamp(18px,3vw,36px); align-items: start; }
        .col { display: flex; flex-direction: column; gap: clamp(12px,2vw,16px); min-width: 0; }
        @media (max-width: 760px) { .split { grid-template-columns: 1fr; gap: clamp(14px,3vw,20px); } }
        .flow-label { font-family: 'Manrope'; font-weight: 700; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: ${T.ink2}; }

        .roadmap { display: flex; flex-direction: column; gap: 8px; list-style: none; }
        .step-card { display: flex; align-items: center; gap: 14px; background: ${T.paper}; border-radius: 12px; padding: 13px 16px; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.14); }
        .step-num { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 13px; color: ${T.accent}; flex-shrink: 0; }
        .step-body { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .step-text { font-weight: 500; font-size: clamp(14px,1.7vw,16px); color: ${T.ink}; }
        .step-tag { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink2}; background: ${T.bg}; padding: 3px 8px; border-radius: 6px; }

        .sk-info { background: ${T.paper}; border-radius: 12px; padding: 15px 17px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.16); animation: fade-step 0.3s; }
        .hint { background: ${T.bg}; border: 1.5px dashed ${T.ink3}; border-radius: 12px; padding: 14px 16px; font-size: clamp(13px,1.5vw,14px); color: ${T.ink2}; }

        .ai-card { background: ${T.paper}; border-radius: 14px; padding: 15px 17px; display: flex; flex-direction: column; gap: 11px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.14); }
        .ai-row { display: flex; align-items: center; gap: 9px; } .ai-badge { font-family: 'Manrope'; font-weight: 800; font-size: 11px; color: #fff; background: ${T.blue}; padding: 3px 9px; border-radius: 6px; } .ai-bubble { font-size: 13px; color: ${T.ink2}; }
        .ai-code { background: ${CODE.bg}; border-radius: 9px; padding: 10px 12px; display: flex; flex-direction: column; gap: 3px; }
        .ai-line { font-family: 'JetBrains Mono'; font-size: 13px; color: ${CODE.text}; cursor: pointer; padding: 7px 9px; border-radius: 6px; transition: all 0.15s; white-space: pre-wrap; } .ai-line:hover { background: rgba(255,255,255,0.06); }
        .ai-line.bad { background: rgba(255,79,40,0.16); box-shadow: inset 0 0 0 1px ${T.accent}; } .ai-line.ok { background: rgba(31,122,77,0.16); }
        .ai-prompt { font-size: 12px; color: ${T.ink3}; margin: 0; font-style: italic; } .note-h { font-weight: 700; font-size: 13px; margin: 0 0 4px; }
        .prompt-box { font-family: 'Manrope', sans-serif; font-size: 13px; line-height: 1.5; color: ${T.ink}; background: ${T.bg}; border-radius: 10px; padding: 11px 13px; }
        .prompt-q { color: ${T.accent}; font-weight: 800; }
        .takeaway { background: ${T.accentSoft}; border-radius: 14px; padding: 20px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 5px; } .ta-bulb { font-size: 34px; } .ta-h { font-family: 'Source Serif 4', serif; font-weight: 600; font-size: clamp(16px,2.2vw,20px); color: ${T.ink}; margin: 0; } .ta-sub { color: ${T.accent}; font-weight: 600; font-size: 13px; margin: 0; }

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

        /* === PRAKTIKA · AVTOIJARA CSS === */
        .bp-bar { background: #f0eee8; padding: 8px 11px; display: flex; align-items: center; gap: 9px; }
        .bb-dots { display: flex; gap: 5px; }
        .bb-dots i { width: 9px; height: 9px; border-radius: 50%; }
        .bb-dots i:first-child { background: #ff5f57; } .bb-dots i:nth-child(2) { background: #febc2e; } .bb-dots i:nth-child(3) { background: #28c840; }
        .bp-title { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink3}; }
        .bp-body { padding: clamp(12px,2.2vw,18px); }
        .code-box { background: ${CODE.bg}; color: ${CODE.text}; font-family: 'JetBrains Mono', monospace; font-size: clamp(12px,1.5vw,13.5px); line-height: 1.55; padding: clamp(12px,2.2vw,16px); border-radius: 12px; overflow-x: auto; white-space: pre-wrap; word-break: break-word; margin: 0; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.2); }
        .rocard { border-radius: 12px; background: #fff; box-shadow: 0 4px 14px -4px rgba(0,0,0,0.16); overflow: hidden; border: 1px solid rgba(0,0,0,0.05); transition: transform 0.15s, box-shadow 0.15s; }
        .rocard.tappable { cursor: pointer; }
        .rocard.tappable:hover { transform: translateY(-2px); box-shadow: 0 8px 20px -5px rgba(0,0,0,0.22); }
        .rothumb { height: 54px; display: flex; align-items: center; justify-content: center; position: relative; }
        .robody { padding: 7px 9px 9px; }
        .roname { font-family: 'Manrope', sans-serif; font-weight: 800; font-size: 12px; color: ${T.ink}; margin: 0 0 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .rostats { display: flex; align-items: center; gap: 8px; font-family: 'Manrope', sans-serif; font-size: 10.5px; color: ${T.ink3}; font-weight: 600; }
        .cardx { position: absolute; top: 4px; right: 5px; width: 20px; height: 20px; border-radius: 50%; border: none; background: rgba(14,14,16,0.5); color: #fff; font-size: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; line-height: 1; transition: background 0.15s; z-index: 2; }
        .cardx:hover { background: ${T.danger}; }
        .cardacts { display: flex; gap: 5px; margin-top: 6px; }
        .cardbtn { flex: 1; border: none; background: ${T.bg}; border-radius: 7px; padding: 5px 4px; font-family: 'Manrope', sans-serif; font-size: 10.5px; font-weight: 700; color: ${T.ink2}; cursor: pointer; transition: all 0.15s; }
        .cardbtn:hover { background: #EFEBE3; color: ${T.ink}; transform: translateY(-1px); }
        .daybtn { width: 22px; height: 22px; border-radius: 6px; border: none; background: ${T.bg}; color: ${T.ink}; font-weight: 800; font-size: 13px; cursor: pointer; transition: all 0.15s; flex-shrink: 0; } .daybtn:hover { background: ${T.accent}; color: #fff; }
        .navmenu { display: flex; gap: 6px; flex-wrap: wrap; }
        .navlink { font-family: 'Manrope', sans-serif; font-weight: 700; font-size: 11.5px; padding: 5px 11px; border-radius: 99px; border: none; background: ${T.bg}; color: ${T.ink}; cursor: pointer; transition: all 0.15s; }
        .navlink.on { background: ${T.ink}; color: #fff; }
        .navlink:hover:not(.on) { background: #EFEBE3; }
        .routerow { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 11px; transition: all 0.3s; }
        @keyframes shake { 0%,100% { transform: none; } 25% { transform: translateX(-4px); } 50% { transform: translateX(4px); } 75% { transform: translateX(-3px); } }
        .shake { animation: shake 0.4s ease; }
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
