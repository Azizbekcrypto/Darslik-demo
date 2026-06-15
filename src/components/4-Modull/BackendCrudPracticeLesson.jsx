import React, { useState, useEffect, useRef, createContext, useContext, useCallback, useMemo } from 'react';

// ============================================================
// MA'LUMOT VA BACKEND MODULI · PRAKTIKA 1 — BACKEND CRUD: AVTOIJARA (Express + PostgreSQL) — PLATFORM STANDARD v16 (AUDIOSIZ)
// O'RNI: 4-Modul oxiri, "Auth va .env" darsidan KEYIN. Birinchi fullstack praktika.
//        O'quvchi biladi: JSON/jadval/sxema, SQL vs NoSQL, Express server, routing (METHOD+PATH), SQL CRUD, API/Postman.
//        Hali bilmaydi: Express'ni PostgreSQL'ga ULASH (pool.query) — bu praktika shu bo'shliqni yopadi.
// Mavzu: AvtoIjara backend — cars jadvali + Express orqali CRUD. Front (Modul 3) keyingi praktikada ulanadi.
// HALQA: ME'MOR (sxemani qo'lda loyihalash) → REJISSYOR (AI-prompt bilan endpoint) → NAZORATCHI (Postman bilan test).
// KO'PRIK: yakunda — "ma'lumot kodda emas, bazada yashaydi; server o'chsa ham saqlanadi" → Praktika 2 (React frontni ulash) ga intro.
// PEDAGOGIKA: rejani siz tuzasiz → AI quradi → siz Postman bilan tekshirasiz. "sehr"/"g'isht" ishlatilmaydi. AUDIOSIZ.
// Yakuniy ekran (s14): mock VS Code — POST /api/cars ichidagi INSERT so'rovini qo'lda yozish.
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
const MentorCtx = createContext(null); // mobil: yig'iladigan Mentor

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

const LESSON_META = { lessonId: 'backend-crud-practice-p1-v16', lessonTitle: { uz: 'Praktika: Backend CRUD — AvtoIjara', ru: 'Практика: Backend CRUD — AvtoIjara' } };
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
  { id: 's8',  type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's9',  type: 'case',        template: 'custom',   scored: false, scope: null },
  { id: 's10', type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's11', type: 'exploration', template: 'custom',   scored: false, scope: null },
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
    // mentor yig'ilganda — kontentni silliq yuqoriga surib, ochilgan joyni ko'rsatamiz
    const el = contentRef.current;
    if (el) setTimeout(() => { if (el) el.scrollTo({ top: 0, behavior: 'smooth' }); }, 80);
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
  { id: 1, nom: 'Cobalt',  narx: 280000, yil: 2022, emoji: '🚗', bg: 'linear-gradient(135deg,#7EA6F4,#2E4A9E)' },
  { id: 2, nom: 'Malibu',  narx: 520000, yil: 2023, emoji: '🚙', bg: 'linear-gradient(135deg,#8FD3A8,#2E7A4E)' },
  { id: 3, nom: 'Kia K5',  narx: 610000, yil: 2023, emoji: '🚘', bg: 'linear-gradient(135deg,#F4B26A,#C9622E)' }
];
const POOL_CARS = [
  { id: 4, nom: 'Spark',   narx: 190000, yil: 2021, emoji: '🚐', bg: 'linear-gradient(135deg,#F4A6C0,#B5446E)' },
  { id: 5, nom: 'Tracker', narx: 450000, yil: 2024, emoji: '🚓', bg: 'linear-gradient(135deg,#B9A8F4,#6A4AC9)' },
  { id: 6, nom: 'Onix',    narx: 340000, yil: 2023, emoji: '🚕', bg: 'linear-gradient(135deg,#F4D06A,#C99B2E)' }
];

// jadval ustunlari (ME'MOR — sxema loyihalash)
const COLUMNS = [
  { key: 'id',     sql: 'id SERIAL PRIMARY KEY', type: 'raqam',  desc: "Har mashinaning takrorlanmas raqami — avtomatik o'sib boradi" },
  { key: 'nom',    sql: 'nom TEXT',              type: 'matn',   desc: "Mashina nomi — masalan 'Cobalt' (matn)" },
  { key: 'narx',   sql: 'narx INTEGER',          type: 'son',    desc: 'Kunlik ijara narxi — butun son' },
  { key: 'yil',    sql: 'yil INTEGER',           type: 'son',    desc: 'Ishlab chiqarilgan yili — butun son' },
  { key: 'bandmi', sql: 'bandmi BOOLEAN',        type: 'ha/yo\'q', desc: "Hozir ijaradami? — ha yoki yo'q (true/false)" }
];

// CRUD ↔ HTTP ↔ SQL
const OPS = [
  { key: 'C', en: 'Create', amal: "Qo'shish",   method: 'POST',   sql: 'INSERT', color: T.success, code: 'INSERT INTO cars ... VALUES ($1, $2, $3)' },
  { key: 'R', en: 'Read',   amal: "Ko'rish",     method: 'GET',    sql: 'SELECT', color: T.blue,    code: 'SELECT * FROM cars' },
  { key: 'U', en: 'Update', amal: 'Tahrirlash',  method: 'PUT',    sql: 'UPDATE', color: '#B45309', code: 'UPDATE cars SET narx = $1 WHERE id = $2' },
  { key: 'D', en: 'Delete', amal: "O'chirish",   method: 'DELETE', sql: 'DELETE', color: T.danger,  code: 'DELETE FROM cars WHERE id = $1' }
];
const M_COLOR = { GET: T.blue, POST: T.success, PUT: '#B45309', DELETE: T.danger };
const MBadge = ({ m }) => <span className="pm-method" style={{ background: M_COLOR[m] }}>{m}</span>;

// AvtoIjara mashina kartochkasi (front preview)
const CarCard = ({ car, onDelete, flash }) => (
  <div className="rocard el-in" style={{ position: 'relative', boxShadow: flash ? `0 0 0 2px ${T.success}, 0 6px 16px -5px rgba(0,0,0,0.2)` : undefined, transition: 'all 0.3s' }}>
    <div className="rothumb" style={{ background: car.bg }}>
      <span style={{ fontSize: 24 }}>{car.emoji}</span>
      {onDelete && <button className="cardx" onClick={onDelete} title="O'chirish">✕</button>}
    </div>
    <div className="robody">
      <p className="roname">{car.nom}</p>
      <div className="rostats"><span>{sp(car.narx)} so'm/kun</span><span style={{ marginLeft: 'auto', color: T.ink3 }}>{car.yil}</span></div>
    </div>
  </div>
);
const CardGrid = ({ children, cols = 3 }) => (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols},1fr)`, gap: 8 }}>{children}</div>
);

// PostgreSQL jadval (cars) ko'rinishi
const DbTable = ({ rows, flashId, dimId }) => (
  <div className="db">
    <div className="db-cap">🗄️ <b>cars</b> <span>· {rows.length} qator</span></div>
    <div className="db-row db-head"><span>id</span><span>nom</span><span>narx</span><span>yil</span></div>
    {rows.length ? rows.map(r => (
      <div key={r.id} className={`db-row el-in ${flashId === r.id ? 'flash' : ''}`} style={{ opacity: dimId === r.id ? 0.35 : 1, textDecoration: dimId === r.id ? 'line-through' : 'none' }}>
        <span>{r.id}</span><span>{r.nom}</span><span>{sp(r.narx)}</span><span>{r.yil}</span>
      </div>
    )) : <div className="db-empty">— bo'sh (0 qator) —</div>}
  </div>
);

// Postman javob qutisi
const Resp = ({ status, text, json }) => (
  <div className="pm-resp el-in">
    <div className="pm-status" style={{ color: status < 300 ? T.success : T.danger }}>● {status} {text}</div>
    {json && <pre className="json">{json}</pre>}
  </div>
);

// ===== SCREEN 0 — HOOK (front bor, lekin ma'lumot qattiq yozilgan) =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [tried, setTried] = useState(!!storedAnswer);
  const [shakeId, setShakeId] = useState(null);
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const poke = (id) => { setTried(true); clearTimeout(timer.current); setShakeId(id); timer.current = setTimeout(() => setShakeId(null), 450); };
  const OPTS = [
    { id: 'a', label: "Hech narsa — ko'rsatgani yetadi" },
    { id: 'b', label: "Ma'lumot doimiy saqlanadigan joy — server va baza" },
    { id: 'c', label: "Ko'proq rang va animatsiya" }
  ];
  const pick = (v) => { if (picked !== null || !tried) return; setPicked(v); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: true }); };
  return (
    <Stage eyebrow="Kirish" screen={screen} scrollSignal={picked !== null} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 860 }}>Saytdagi mashinalar ro'yxatini nega <span className="italic" style={{ color: T.accent }}>o'zgartirib bo'lmaydi</span>?</h1>
        <Mentor>Mana Modul 3'da qurgan <b style={{ color: T.ink }}>AvtoIjara</b> saytingiz. Lekin mashinalar ro'yxati <span className="mono">App.jsx</span> faylining <b style={{ color: T.ink }}>ichiga to'g'ridan-to'g'ri yozib qo'yilgan</b> — hech qayerda saqlanmagan. Yangi mashina <b style={{ color: T.ink }}>qo'shmoqchi</b> bo'lib ko'ring yoki bittasini <b style={{ color: T.ink }}>o'chiring</b> — nima sezasiz?</Mentor>
        <Split>
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p className="flow-label" style={{ margin: 0 }}>AvtoIjara — bizning mashinalar</p>
              <button className={`chip ${shakeId === 'add' ? 'shake' : ''}`} onClick={() => poke('add')} style={{ padding: '7px 13px', fontSize: 13 }}>+ Mashina qo'shish</button>
            </div>
            <div className="fade-up delay-2"><CardGrid cols={3}>
              {CARS.map(c => (<div key={c.id} className={shakeId === c.id ? 'shake' : ''}><CarCard car={c} onDelete={() => poke(c.id)} /></div>))}
            </CardGrid></div>
            <pre className="code-box fade-up delay-2" style={{ padding: '10px 14px', lineHeight: 1.85 }}>
              <Jx>{'const'}</Jx>{' cars = [ { nom: '}<St>"Cobalt"</St>{', ... }, ... ];'}{'\n'}
              <Cm>{"// ↑ ro'yxat kod ichida — bazada saqlanmagan"}</Cm>
            </pre>
            {tried && <p className="small fade-step" style={{ color: T.accent, fontStyle: 'italic', margin: 0 }}>Tugma bor — lekin hech narsa o'zgarmadi. Ro'yxat kod ichida qotib qolgan, orqada server yo'q!</p>}
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Haqiqiy AvtoIjara ilovasiga, ko'rsatishdan tashqari, yana nima kerak?</p>
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
            {!tried && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>Avval tugmalarni bosib ko'ring ←</p>}
            {picked !== null && <p className="hook-ack fade-step">Aniq! Mashinalar qo'lda yozilgan — yangisini qo'shish uchun har safar kodni ochish kerak, sahifani yangilasangiz o'zgarish yo'qoladi. Bugun ma'lumotni <b>doimiy bazada</b> saqlaydigan va <b>boshqariladigan</b> backend quramiz.</p>}
          </Col>
        </Split>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA (ME'MOR → REJISSYOR → NAZORATCHI) =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const STEPS = [
    { text: 'Sxemani siz chizasiz', tag: 'ME\'MOR — loyihachi' },
    { text: 'Express\'ni bazaga ulaysiz', tag: 'pool.query — ko\'prik' },
    { text: 'AI\'ga buyruq berib kod yozdirasiz', tag: 'REJISSYOR — buyruq beruvchi' },
    { text: 'Postman bilan tekshirasiz', tag: 'NAZORATCHI — sinovchi' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const PreviewBlock = (
    <Col>
      <p className="flow-label">Dars oxirida — sizning backend'ingiz</p>
      <div className="pm">
        <div className="pm-bar"><MBadge m="GET" /><span className="pm-url">localhost:3000/api/cars</span><span className="pm-send-static">Send</span></div>
        <div className="pm-body"><Resp status={200} text="OK" json={'[\n  { "id": 1, "nom": "Cobalt", "narx": 280000 },\n  { "id": 2, "nom": "Malibu", "narx": 520000 }\n]'} /></div>
      </div>
      <p className="mono small" style={{ color: T.accent, margin: 0 }}>→ mashinalar endi bazadan keladi — qo'shish · o'qish · o'zgartirish · o'chirish</p>
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
    <Stage eyebrow="Reja" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Boshlaymiz →" onClick={onNext} /></>}>
      <div className="screen">
        <div className="head">
          <h2 className="title h-title fade-up">AvtoIjara'ni <span className="italic" style={{ color: T.accent }}>haqiqiy ilovaga</span> qanday aylantiramiz?</h2>
        </div>
        <Mentor>Bu yo'lda siz <b style={{ color: T.ink }}>uchta rolni</b> o'ynaysiz. <b style={{ color: T.ink }}>ME'MOR</b> — me'mor binoni chizganidek, siz ma'lumot sxemasini chizasiz. <b style={{ color: T.ink }}>REJISSYOR</b> — rejissyor aktyorga ko'rsatma berganidek, siz AI'ga aniq buyruq berasiz. <b style={{ color: T.ink }}>NAZORATCHI</b> — natijani Postman bilan o'zingiz sinab tekshirasiz. Avval har qadamni tushunasiz, keyin loyihani bitirasiz.</Mentor>
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

// ===== SCREEN 2 — ME'MOR: SXEMANI QO'LDA LOYIHALASH =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(storedAnswer ? new Set(COLUMNS.map(c => c.key)) : new Set());
  const done = seen.size >= COLUMNS.length;
  const tap = (k) => { setActive(k); setSeen(prev => { const s = new Set(prev); s.add(k); return s; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = COLUMNS.find(c => c.key === active);
  return (
    <Stage eyebrow="1-qadam · ME'MOR" screen={screen} scrollSignal={done} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Ustunlarni ko'ring (${seen.size}/${COLUMNS.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(8px,1.2vw,12px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Mashinalar haqida bazada <span className="italic" style={{ color: T.accent }}>qaysi ma'lumotni</span> saqlaymiz?</h2></div>
        <Mentor>AI kod yozishidan oldin <b style={{ color: T.ink }}>siz</b> qaror qilasiz: <span className="mono">cars</span> jadvalida qaysi ustunlar bo'ladi? Har ustun bitta narsani saqlaydi. Ustunlarni bosib, nima saqlashini ko'ring — pastda <span className="mono">CREATE TABLE</span> yig'iladi.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">cars jadvali — ustunlar</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {COLUMNS.map(c => {
                const on = active === c.key;
                return (
                  <button key={c.key} className="vcard" onClick={() => tap(c.key)} style={{ boxShadow: on ? `inset 0 0 0 1.5px ${T.accent}, 0 8px 20px -6px rgba(${T.shadowBase},0.2)` : undefined }}>
                    <span className="vbadge" style={{ background: c.key === 'id' ? T.accent : T.ink }}>{c.type}</span>
                    <span className="vlbl mono">{c.key}</span>
                    <span className="vseen" style={{ color: seen.has(c.key) ? T.success : T.ink3 }}>{seen.has(c.key) ? '✓' : ''}</span>
                  </button>
                );
              })}
            </div>
            {cur && <div className="sk-info" key={active}><p className="body" style={{ margin: 0, color: T.ink }}><b className="mono" style={{ color: T.accent }}>{cur.key}</b> — {cur.desc}</p></div>}
          </Col>
          <Col>
            <p className="flow-label">Tayyor sxema — SQL tilida</p>
            <pre className="code-box fade-up delay-1" style={{ lineHeight: 1.9 }}>
              <Jx>{'CREATE TABLE'}</Jx>{' cars ('}{'\n'}
              {COLUMNS.map(c => (
                <React.Fragment key={c.key}>
                  {'  '}<span style={{ opacity: seen.has(c.key) ? 1 : 0.3, background: active === c.key ? 'rgba(255,79,40,0.16)' : 'transparent', borderRadius: 4, padding: '1px 3px' }}><At>{c.key}</At>{' ' + c.sql.split(' ').slice(1).join(' ')}</span>{c.key !== 'bandmi' ? ',' : ''}{'\n'}
                </React.Fragment>
              ))}
              {');'}
            </pre>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Sxema tayyor! Har ustun aniq bitta narsani saqlaydi. <span className="mono">id SERIAL PRIMARY KEY</span> — har mashinaga takrorlanmas raqam beradi. Endi shu jadvalga Express'ni ulaymiz.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — pg KO'PRIK (Express ↔ PostgreSQL) =====
const CHAIN = ['Front', 'Express', 'pool.query', 'PostgreSQL', 'javob'];
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [step, setStep] = useState(storedAnswer ? CHAIN.length : -1);
  const done = step >= CHAIN.length - 1;
  const advance = () => setStep(s => Math.min(s + 1, CHAIN.length - 1));
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="2-qadam · ko'prik" screen={screen} scrollSignal={done} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "So'rovni oxirigacha kuzating"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Express baza bilan <span className="italic" style={{ color: T.accent }}>qanday</span> gaplashadi?</h2></div>
        <Mentor>SQL darsida so'rovlarni yozdingiz — lekin ularni kim yuboradi? <b style={{ color: T.ink }}>Express</b> server, <span className="mono">pg</span> kutubxonasi orqali. <span className="mono">pool</span> — server bilan baza orasidagi <b style={{ color: T.ink }}>ko'prik</b>: <span className="mono">pool.query('...')</span> SQL'ni bazaga olib boradi va javobni qaytaradi. So'rovni qadam-qadam kuzating.</Mentor>
        <div className="split">
          <Col>
            <pre className="code-box fade-up delay-1" style={{ lineHeight: 1.9 }}>
              <Jx>{'const'}</Jx>{' { Pool } = '}<At>require</At>{'('}<St>'pg'</St>{');'}{'\n'}
              <Jx>{'const'}</Jx>{' pool = '}<Jx>new</Jx>{' Pool({ database: '}<St>'avtoijara'</St>{' });'}{'\n\n'}
              <Cm>{'// so\'rov — ko\'prik orqali bazaga:'}</Cm>{'\n'}
              <Jx>{'const'}</Jx>{' result = '}<At>await</At>{' '}<span style={{ background: 'rgba(255,79,40,0.16)', borderRadius: 5, padding: '1px 5px' }}>pool.query(<St>'SELECT * FROM cars'</St>)</span>{';'}
            </pre>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={done} onClick={advance}>{step < 0 ? "▶ So'rovni yuborish" : (done ? '✓ Yetib bordi' : 'Keyingi qadam →')}</button>
          </Col>
          <Col>
            <p className="flow-label">So'rovning yo'li</p>
            <div className="chain fade-up delay-1">
              {CHAIN.map((c, i) => {
                const lit = step >= i;
                return (
                  <React.Fragment key={c}>
                    <div className="chain-node" style={{ background: lit ? T.accent : T.paper, color: lit ? '#fff' : T.ink3, boxShadow: lit ? `0 6px 16px -5px rgba(255,79,40,0.45)` : `0 4px 12px -6px rgba(${T.shadowBase},0.16)` }}>{c}</div>
                    {i < CHAIN.length - 1 && <span className="chain-arr" style={{ color: step > i ? T.accent : T.ink3 }}>→</span>}
                  </React.Fragment>
                );
              })}
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana ko'prik! Front so'raydi → Express qabul qiladi → <span className="mono">pool.query</span> SQL'ni PostgreSQL'ga olib boradi → javob qaytadi. <span className="mono">pool.query</span> bo'lmasa, server baza bilan gaplasha olmaydi.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 (sxema / PRIMARY KEY) =====
const Screen4 = (props) => (
  <QuestionScreen {...props} idx={4} scope="module-mikro" eyebrow="Mashq · 1-savol"
    questionText="Har mashinaning takrorlanmas raqami uchun qaysi ustun to'g'ri?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Har mashinaning <span className="italic" style={{ color: T.accent }}>takrorlanmas raqami</span> uchun qaysi ustun?</h2></>}
    options={['id SERIAL PRIMARY KEY', 'nom TEXT', 'narx INTEGER', 'bandmi BOOLEAN']} correctIdx={0}
    explainCorrect="To'g'ri! PRIMARY KEY har qatorni yagona qiladi, SERIAL esa raqamni avtomatik o'stiradi (1, 2, 3…). Shuning uchun har mashinaning o'z id'si bo'ladi."
    explainWrong={{
      1: "nom — bu mashina nomi (matn), takrorlanishi mumkin. Yagona raqam uchun id SERIAL PRIMARY KEY.",
      2: "narx — ijara narxi (son), bir xil bo'lishi mumkin. Takrorlanmas raqam — id SERIAL PRIMARY KEY.",
      3: "bandmi — ha/yo'q qiymati. Takrorlanmas raqam emas. To'g'risi — id SERIAL PRIMARY KEY.",
      default: "Takrorlanmas raqam = id SERIAL PRIMARY KEY."
    }} />
);

// ===== SCREEN 5 — REJISSYOR: READ (GET endpoint AI bilan) =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [phase, setPhase] = useState(storedAnswer ? 'done' : 'idle'); // idle → done
  const done = phase === 'done';
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="3-qadam · REJISSYOR" screen={screen} scrollSignal={done} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "AI'ga buyruq bering"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bazadagi mashinalarni frontga <span className="italic" style={{ color: T.accent }}>qanday chiqaramiz</span>?</h2></div>
        <Mentor>AI'ga buyruq berganda <b style={{ color: T.ink }}>aniq</b> bo'ling: method, path va nima qilishini ayting. Bu yerda: <i>"GET /api/cars — pool.query bilan barcha mashinalarni SELECT qilib JSON qaytar"</i>. Aniq buyruq — to'g'ri kod.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">Aniq buyruq (prompt)</p>
            <div className="ai-card fade-up delay-1">
              <div className="ai-row"><span className="ai-badge" style={{ background: T.ink }}>Siz</span><span className="ai-bubble">"GET /api/cars yarat — pool.query bilan SELECT * FROM cars qilib, natijani JSON qaytar."</span></div>
              {phase === 'idle'
                ? <button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={() => setPhase('done')}>AI'ga yuborish →</button>
                : (
                  <>
                    <div className="ai-row"><span className="ai-badge">AI</span><span className="ai-bubble">Mana endpoint:</span></div>
                    <div className="ai-code fade-step"><div className="ai-line ok" style={{ cursor: 'default', whiteSpace: 'pre-wrap' }}>{"app.get('/api/cars', async (req, res) => {\n  const result = await pool.query('SELECT * FROM cars');\n  res.json(result.rows);\n});"}</div></div>
                  </>
                )}
            </div>
          </Col>
          <Col>
            <p className="flow-label">Natija — Postman bilan sinab ko'ring</p>
            <div className="pm">
              <div className="pm-bar"><MBadge m="GET" /><span className="pm-url">localhost:3000/api/cars</span><span className="pm-send-static">Send</span></div>
              <div className="pm-body">
                {done
                  ? <Resp status={200} text="OK" json={'[\n  { "id": 1, "nom": "Cobalt", "narx": 280000, "yil": 2022 },\n  { "id": 2, "nom": "Malibu", "narx": 520000, "yil": 2023 },\n  { "id": 3, "nom": "Kia K5", "narx": 610000, "yil": 2023 }\n]'} />
                  : <p style={{ color: T.ink3, fontStyle: 'italic', margin: 0, fontFamily: 'Georgia, serif', fontSize: 13 }}>Endpoint yozilgach, GET javobi shu yerda ko'rinadi…</p>}
              </div>
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>GET ishladi! <span className="mono">SELECT * FROM cars</span> bazadagi barcha qatorni oldi, <span className="mono">res.json</span> uni frontga JSON qilib qaytardi.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 5b — TEST 2 (READ mapping) =====
const Screen5b = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Tekshiruv"
    questionText="Barcha mashinalarni frontga qaytaradigan to'g'ri juftlik qaysi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Mustahkamlash</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Barcha mashinalarni <span className="italic" style={{ color: T.accent }}>qaytarish</span> uchun qaysi juftlik?</h2></>}
    options={['GET /api/cars → SELECT * FROM cars', 'POST /api/cars → INSERT INTO cars', 'DELETE /api/cars → SELECT * FROM cars', 'GET /api/cars → DELETE FROM cars']} correctIdx={0}
    explainCorrect="To'g'ri! GET = o'qish, SELECT = bazadan olish. Ikkalasi 'ma'lumot olish' degani — shuning uchun juftlik mos."
    explainWrong={{
      1: "POST/INSERT — bu yangi qo'shish, o'qish emas. O'qish uchun GET → SELECT.",
      2: "DELETE method o'chirish uchun. O'qish uchun GET → SELECT * FROM cars.",
      3: "GET o'qish uchun, lekin DELETE o'chiradi — mos emas. To'g'risi GET → SELECT.",
      default: "O'qish = GET → SELECT * FROM cars."
    }} />
);

// ===== SCREEN 6 — CREATE (POST → INSERT, $1 $2 $3) =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [rows, setRows] = useState(storedAnswer ? [...CARS, POOL_CARS[0]] : CARS);
  const [last, setLast] = useState(null);
  const added = rows.length - CARS.length;
  const done = added >= 1;
  const remaining = POOL_CARS.filter(p => !rows.some(r => r.id === p.id));
  const addOne = (c) => { setRows(prev => prev.some(x => x.id === c.id) ? prev : [...prev, c]); setLast(c.id); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const newCar = remaining[0];
  return (
    <Stage eyebrow="Create · qo'shish" screen={screen} scrollSignal={done} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Bitta mashina POST qiling"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Yangi mashina bazaga <span className="italic" style={{ color: T.accent }}>qanday</span> qo'shiladi?</h2></div>
        <Mentor><b style={{ color: T.ink }}>POST</b> so'rovi <span className="mono">body</span>'da ma'lumot yuboradi, server uni <span className="mono">INSERT</span> bilan bazaga yozadi. Qiymatlarni to'g'ridan-to'g'ri SQL'ga yopishtirmaymiz — o'rniga <span className="mono">$1, $2, $3</span> qo'yamiz va massivda beramiz. Bu — <b style={{ color: T.ink }}>xavfsiz</b> usul. POST yuborib ko'ring.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">Postman — POST so'rovi</p>
            <div className="pm">
              <div className="pm-bar"><MBadge m="POST" /><span className="pm-url">localhost:3000/api/cars</span>
                {newCar && <button className="pm-send btn-soft" onClick={() => addOne(newCar)} disabled={!newCar}>Send</button>}
              </div>
              <div className="pm-body">
                <p className="flow-label" style={{ margin: '0 0 6px' }}>Body (JSON)</p>
                <pre className="json">{newCar ? `{ "nom": "${newCar.nom}", "narx": ${newCar.narx}, "yil": ${newCar.yil} }` : '{ ... }'}</pre>
                {last && <Resp status={201} text="Created" json={`{ "status": "qo'shildi", "id": ${last} }`} />}
              </div>
            </div>
            <pre className="code-box fade-up delay-1" style={{ lineHeight: 1.85, padding: '10px 14px' }}>
              {'pool.query(\n  '}
              <St>{"'INSERT INTO cars (nom, narx, yil)\n   VALUES ("}</St>
              <At>{'$1, $2, $3'}</At>
              <St>{")'"}</St>
              {',\n  [nom, narx, yil]\n);'}
            </pre>
          </Col>
          <Col>
            <p className="flow-label">PostgreSQL — cars jadvali</p>
            <DbTable rows={rows} flashId={last} />
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Yangi qator paydo bo'ldi! Server <span className="mono">201 Created</span> qaytardi. <span className="mono">$1, $2, $3</span> body'dagi qiymatlar bilan to'ldirildi va bazaga yozildi.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — UPDATE + DELETE (:id route param) =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [rows, setRows] = useState(CARS);
  const [didUpd, setDidUpd] = useState(!!storedAnswer);
  const [didDel, setDidDel] = useState(!!storedAnswer);
  const [flash, setFlash] = useState(null);
  const [dim, setDim] = useState(null);
  const done = didUpd && didDel;
  const lower = (id) => { setRows(prev => prev.map(r => r.id === id ? { ...r, narx: Math.max(100000, r.narx - 50000) } : r)); setDidUpd(true); setFlash(id); setTimeout(() => setFlash(null), 600); };
  const del = (id) => { setDim(id); setTimeout(() => { setRows(prev => prev.filter(r => r.id !== id)); setDidDel(true); setDim(null); }, 350); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Update · Delete" screen={screen} scrollSignal={done} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Bittasini tahrirlang, bittasini o'chiring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bitta mashinani o'zgartirish — <span className="italic" style={{ color: T.accent }}>qaysi birini</span> server qayerdan biladi?</h2></div>
        <Mentor>Manzildagi <span className="mono">:id</span> — bu o'zgaruvchi (routing darsidan tanish). <span className="mono">PUT /api/cars/<b style={{ color: T.ink }}>2</b></span> — "2-raqamli mashinani o'zgartir" degani. SQL'da <span className="mono">WHERE id = $1</span> aynan o'shani topadi. Bitta mashina narxini tushiring, bittasini o'chiring.</Mentor>
        <div className="split">
          <Col>
            <pre className="code-box fade-up delay-1" style={{ lineHeight: 1.85, padding: '11px 14px' }}>
              <Cm>{'// PUT — narxni yangilash'}</Cm>{'\n'}
              {'app.put('}<St>'/api/cars/:id'</St>{', ...);'}{'\n'}
              {'  UPDATE cars SET narx=$1 '}<At>WHERE id=$2</At>{'\n\n'}
              <Cm>{'// DELETE — o\'chirish'}</Cm>{'\n'}
              {'app.delete('}<St>'/api/cars/:id'</St>{', ...);'}{'\n'}
              {'  DELETE FROM cars '}<At>WHERE id=$1</At>
            </pre>
            <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}><span className="mono" style={{ color: T.ink }}>:id</span> manzilda keladi (<span className="mono">req.params.id</span>), <span className="mono">WHERE id = $1</span> bazada aynan o'sha qatorni topadi.</p></div>
          </Col>
          <Col>
            <p className="flow-label">PostgreSQL — cars jadvali</p>
            <div className="db">
              <div className="db-cap">🗄️ <b>cars</b> <span>· {rows.length} qator</span></div>
              <div className="db-row db-head"><span>id</span><span>nom</span><span>narx</span><span>amal</span></div>
              {rows.map(r => (
                <div key={r.id} className={`db-row el-in ${flash === r.id ? 'flash' : ''}`} style={{ opacity: dim === r.id ? 0.3 : 1 }}>
                  <span>{r.id}</span><span>{r.nom}</span><span>{sp(r.narx)}</span>
                  <span style={{ display: 'flex', gap: 5 }}>
                    <button className="db-btn" style={{ color: '#B45309' }} onClick={() => lower(r.id)} title="PUT — narxni tushir">PUT</button>
                    <button className="db-btn" style={{ color: T.danger }} onClick={() => del(r.id)} title="DELETE — o'chir">DEL</button>
                  </span>
                </div>
              ))}
            </div>
            <div className="fade-up delay-2" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              <span className="tagpill" style={{ color: didUpd ? T.success : T.ink3 }}>{didUpd ? '✓' : '○'} PUT — yangiladim</span>
              <span className="tagpill" style={{ color: didDel ? T.success : T.ink3 }}>{didDel ? '✓' : '○'} DELETE — o'chirdim</span>
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana to'liq CRUD! <span className="mono">:id</span> + <span className="mono">WHERE id=$1</span> aniq bitta qatorni topib o'zgartiradi yoki o'chiradi — qolganlariga tegmaydi.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — TEST 3 (CRUD ↔ method ↔ SQL) =====
const Screen8 = (props) => (
  <QuestionScreen {...props} idx={8} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="Bazaga yangi mashina qo'shish uchun qaysi method va SQL?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Bazaga <span className="italic" style={{ color: T.accent }}>yangi mashina qo'shish</span> uchun?</h2></>}
    options={['POST → INSERT', 'GET → SELECT', 'PUT → UPDATE', 'DELETE → DELETE']} correctIdx={0}
    explainCorrect="To'g'ri! POST = yaratish, INSERT = bazaga yangi qator yozish. Yangi mashina qo'shish — aynan shu."
    explainWrong={{
      1: "GET → SELECT — bu o'qish (mavjudini ko'rsatish), yangi qo'shish emas. Qo'shish: POST → INSERT.",
      2: "PUT → UPDATE — bu mavjud mashinani o'zgartirish, yangi qo'shish emas. To'g'risi: POST → INSERT.",
      3: "DELETE — o'chirish. Qo'shish uchun POST → INSERT.",
      default: "Yangi qo'shish = POST → INSERT."
    }} />
);

// ===== SCREEN 9 — NAZORATCHI: POSTMAN TEST + DOIMIYLIK =====
const Screen9 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  // phase: 0 boshlang'ich · 1 POST yuborildi · 2 restart bosildi · 3 GET tasdiqlandi
  const [phase, setPhase] = useState(storedAnswer ? 3 : 0);
  const rows = phase >= 1 ? [...CARS, POOL_CARS[0]] : CARS;
  const done = phase >= 3;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const label = phase === 0 ? "1) POST yuborish" : phase === 1 ? "2) Serverni o'chirib-yoqish" : phase === 2 ? "3) GET — tekshirish" : "✓ Tasdiqlandi";
  return (
    <Stage eyebrow="4-qadam · NAZORATCHI" screen={screen} scrollSignal={phase > 0} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Uch qadamni bajaring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Server o'chsa — ma'lumot <span className="italic" style={{ color: T.accent }}>saqlanib qoladimi</span>?</h2></div>
        <Mentor>Eslang: Modul 3'da qo'shgan narsangiz sahifani yangilaganda yo'qolardi (faqat xotirada edi). Endi tekshiramiz: mashina <b style={{ color: T.ink }}>POST</b> qilamiz, keyin serverni <b style={{ color: T.ink }}>o'chirib-yoqamiz</b>, so'ng <b style={{ color: T.ink }}>GET</b> qilamiz — Spark hali ham bormi?</Mentor>
        <div className="split">
          <Col>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={done} onClick={() => setPhase(p => Math.min(p + 1, 3))}>{label}</button>
            <div className="code-box" style={{ minHeight: 92, padding: '10px 13px' }}>
              <TLine cmd="node server.js" />
              {phase >= 1 && <TLine out={<span style={{ color: CODE.str }}>✓ POST /api/cars → 201 (Spark qo'shildi)</span>} />}
              {phase >= 2 && <><TLine out={<span style={{ color: CODE.comment }}>^C  server to'xtadi…</span>} /><TLine cmd="node server.js" /><TLine out={<span style={{ color: CODE.comment }}>server qayta yondi :3000</span>} /></>}
              {phase >= 3 && <TLine out={<span style={{ color: CODE.str }}>✓ GET /api/cars → 200 (4 qator — Spark joyida!)</span>} />}
            </div>
          </Col>
          <Col>
            <p className="flow-label">PostgreSQL — cars jadvali</p>
            <DbTable rows={rows} flashId={phase === 1 ? POOL_CARS[0].id : null} />
            {phase >= 1 && phase < 3 && <p className="small fade-step" style={{ color: T.ink2, fontStyle: 'italic', margin: 0 }}>Ma'lumot serverning xotirasida emas — <b>PostgreSQL</b>'da diskda yotibdi.</p>}
            {done && <div className="takeaway fade-step"><div className="ta-bulb">💾</div><p className="ta-h">Ma'lumot saqlanib qoldi!</p><p className="ta-sub">Server o'chsa ham — baza yodida. S0'dagi muammo hal bo'ldi.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 10 — AI DEBUGGING (column "price" does not exist) =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [picked, setPicked] = useState(storedAnswer ? 'bad' : null);
  const [fixed, setFixed] = useState(!!storedAnswer);
  const found = picked === 'bad';
  const done = fixed;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Debugging" screen={screen} scrollSignal={found || fixed} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : (found ? 'Endi tuzating' : 'Xatoni toping')} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Server xato qaytardi — bu bizga <span className="italic" style={{ color: T.accent }}>nimani aytmoqchi</span>?</h2></div>
        <Mentor>POST yuborganda server <span className="mono" style={{ color: T.danger }}>500</span> qaytardi: <i>column "price" does not exist</i>. Bunday xatolar — kod yozishning <b style={{ color: T.ink }}>tabiiy qismi</b>; hatto AI ham adashishi mumkin, shuning uchun biz doim tekshiramiz. Eng yaxshisi: xato matni nima noto'g'ri ekanini <b style={{ color: T.ink }}>o'zi aytib beradi</b> — baza "price degan ustun yo'q" deyapti. Sxemamizda ustun nomi <span className="mono">narx</span> edi. Qaysi qatorda shu nom xato? Bosing.</Mentor>
        <div className="split">
          <Col>
            <div className="ai-card fade-up delay-1">
              <div className="ai-row"><span className="ai-badge">AI</span><span className="ai-bubble">Qo'shish kodini yozdim:</span></div>
              <div className="ai-code">
                <div className={`ai-line ${picked === 'a' ? 'ok' : ''}`} onClick={() => { if (!found) setPicked('a'); }}><Jx>{'const'}</Jx>{' { nom, narx, yil } = req.body;'}</div>
                {!fixed ? (
                  <div className={`ai-line ${found ? 'bad' : ''}`} onClick={() => { if (!found) setPicked('bad'); }}>{"pool.query('INSERT INTO cars (nom, "}<At>price</At>{", yil)...');"}{'  '}<Cm>{'// price?'}</Cm></div>
                ) : (
                  <div className="ai-line ok el-in">{"pool.query('INSERT INTO cars (nom, "}<At>narx</At>{", yil)...');"}{'  '}<Cm>{'// ✓ narx'}</Cm></div>
                )}
                <div className={`ai-line ${picked === 'c' ? 'ok' : ''}`} onClick={() => { if (!found) setPicked('c'); }}>{"res.json({ status: 'qo'shildi' });"}</div>
              </div>
              {!found && <p className="ai-prompt">Qaysi qator bazadagi ustun nomiga mos emas? Bosing.</p>}
              {found && !fixed && <button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={() => setFixed(true)}>🔧 price → narx ga tuzatish</button>}
              {fixed && <p className="ai-prompt" style={{ color: T.success, fontStyle: 'normal', fontWeight: 600 }}>✓ Tuzatildi — ustun nomi sxemaga mos: narx</p>}
            </div>
          </Col>
          <Col>
            <p className="flow-label">Server javobi</p>
            <div className="pm">
              <div className="pm-bar"><MBadge m="POST" /><span className="pm-url">localhost:3000/api/cars</span></div>
              <div className="pm-body">
                {fixed
                  ? <Resp status={201} text="Created" json={`{ "status": "qo'shildi" }`} />
                  : <Resp status={500} text="Server Error" json={'{\n  "error": "column \\"price\\" does not exist"\n}'} />}
              </div>
            </div>
            {!found && (picked === 'a' || picked === 'c')
              ? <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bu qator to'g'ri. Yana qarang: xato <i>"price" does not exist"</i> deyapti — kodda qayerda <span className="mono">price</span> yozilgan?</p></div>
              : null}
            {found && !fixed && <div className="frame-warn fade-step"><p className="note-h" style={{ color: T.accent }}>✓ Topdingiz!</p><p className="body" style={{ margin: 0, color: T.ink }}>Kodda ustun <span className="mono">price</span> deb yozilgan, biroq sxemada u <span className="mono">narx</span> — shuning uchun baza topa olmadi. Bitta so'zni to'g'rilaymiz. Chapdagi tugma bilan tuzating →</p></div>}
            {fixed && <div className="takeaway fade-step"><div className="ta-bulb">🛠️</div><p className="ta-h">Xatoni o'qib, tuzatdingiz — bu debugging!</p><p className="ta-sub">Xato matni — muammoni aytib beradi. AI yozadi, siz tekshirasiz.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — TO'LIQ ZANJIR: 4 AMALNI O'ZINGIZ BOSHQARING =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [rows, setRows] = useState(storedAnswer ? [...CARS, POOL_CARS[1]] : CARS);
  const [didC, setDidC] = useState(!!storedAnswer);
  const [didR, setDidR] = useState(!!storedAnswer);
  const [didU, setDidU] = useState(!!storedAnswer);
  const [didD, setDidD] = useState(!!storedAnswer);
  const [active, setActive] = useState(storedAnswer ? 'R' : null);
  const [flash, setFlash] = useState(null);
  const done = didC && didR && didU && didD;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const run = (k) => {
    setActive(k);
    if (k === 'C') { const n = POOL_CARS.find(p => !rows.some(r => r.id === p.id)); if (n) { setRows(prev => [...prev, n]); setFlash(n.id); } setDidC(true); }
    if (k === 'R') { setDidR(true); }
    if (k === 'U') { setRows(prev => prev.map((r, i) => i === 0 ? { ...r, narx: Math.max(100000, r.narx - 40000) } : r)); setFlash(rows[0]?.id); setDidU(true); }
    if (k === 'D') { setRows(prev => prev.slice(0, -1)); setDidD(true); }
    setTimeout(() => setFlash(null), 600);
  };
  const cur = OPS.find(o => o.key === active);
  return (
    <Stage eyebrow="Amaliyot · to'liq zanjir" screen={screen} scrollSignal={done} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "To'rt amalni ham bajaring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(8px,1.2vw,12px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Endi o'zingiz — <span className="italic" style={{ color: T.accent }}>to'rt amalni</span> ham yuboring.</h2></div>
        <Mentor>Har bosishda so'rov to'liq zanjirdan o'tadi: <b style={{ color: T.ink }}>Front → Express → pool.query → PostgreSQL → javob</b>. To'rttasini ham yuboring: <b style={{ color: T.ink }}>POST</b> (qo'shish), <b style={{ color: T.ink }}>GET</b> (o'qish), <b style={{ color: T.ink }}>PUT</b> (yangilash), <b style={{ color: T.ink }}>DELETE</b> (o'chirish).</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">So'rov yuborish</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {OPS.map(o => {
                const did = { C: didC, R: didR, U: didU, D: didD }[o.key];
                return (
                  <button key={o.key} className="vcard" onClick={() => run(o.key)} style={{ boxShadow: active === o.key ? `inset 0 0 0 1.5px ${T.accent}, 0 8px 20px -6px rgba(${T.shadowBase},0.2)` : undefined }}>
                    <span className="vbadge" style={{ background: o.color }}>{o.method}</span>
                    <span className="vlbl">{o.amal}</span>
                    <span className="vseen" style={{ color: did ? T.success : T.ink3 }}>{did ? '✓' : ''}</span>
                  </button>
                );
              })}
            </div>
            {cur && <div className="sk-info" key={active}><p className="body mono" style={{ margin: 0, color: T.ink, fontSize: 12.5 }}>{cur.method} → {cur.code}</p></div>}
          </Col>
          <Col>
            <p className="flow-label">So'rovning yo'li</p>
            <div className="chain fade-up delay-1">
              {CHAIN.map((c, i) => (
                <React.Fragment key={c}>
                  <div className="chain-node" style={{ background: active ? T.accent : T.paper, color: active ? '#fff' : T.ink3 }}>{c}</div>
                  {i < CHAIN.length - 1 && <span className="chain-arr" style={{ color: active ? T.accent : T.ink3 }}>→</span>}
                </React.Fragment>
              ))}
            </div>
            <DbTable rows={rows} flashId={flash} />
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>🎉 To'liq CRUD backend tayyor! Har so'rov front'dan bazaga borib-keldi. Keyingi praktikada Modul 3'dagi React frontni aynan shu serverga ulaymiz.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — TEST 4 (pg ko'prik) =====
const Screen12 = (props) => (
  <QuestionScreen {...props} idx={12} scope="module-mikro" eyebrow="Mashq · 4-savol"
    questionText="Express ichida PostgreSQL'ga SQL yuborish uchun nima ishlatiladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Express ichida bazaga <span className="italic" style={{ color: T.accent }}>SQL yuborish</span> uchun?</h2></>}
    options={["pool.query('...') ", 'res.send(...)', 'app.listen(3000)', 'console.log(...)']} correctIdx={0}
    explainCorrect="To'g'ri! pool.query('...') — server bilan baza orasidagi ko'prik. SQL'ni PostgreSQL'ga olib boradi va natijani qaytaradi."
    explainWrong={{
      1: "res.send — frontga javob qaytaradi, bazaga emas. Bazaga SQL: pool.query('...').",
      2: "app.listen — serverni yoqadi (portni tinglaydi). Bazaga so'rov: pool.query('...').",
      3: "console.log — terminalga yozadi. Bazaga SQL yuborish: pool.query('...').",
      default: "Bazaga SQL = pool.query('...')."
    }} />
);

// ===== SCREEN 13 — QOIDA: MA'LUMOT BAZADA YASHAYDI =====
const Screen13 = ({ screen, onNext, onPrev }) => {
  return (
    <Stage eyebrow="Qoida · xulosa" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Oxirgi qadam →" onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(12px,2vw,18px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Mashinalar endi <span className="italic" style={{ color: T.accent }}>qayerda yashaydi</span> — kodda yoki bazada?</h2></div>
        <Mentor>Eng muhim o'zgarish shu: endi mashinalar <span className="mono">App.jsx</span>'da emas, <b style={{ color: T.ink }}>PostgreSQL</b>'da. Kod faqat so'rov yuboradi, ma'lumotni baza saqlaydi. Quyida butun ish bir qarashda.</Mentor>
        <Split>
          <Col>
            <p className="flow-label">CRUD ↔ HTTP ↔ SQL</p>
            <div className="db">
              <div className="db-row db-head" style={{ gridTemplateColumns: '1fr 1fr 1.4fr' }}><span>amal</span><span>method</span><span>SQL</span></div>
              {OPS.map(o => (
                <div key={o.key} className="db-row" style={{ gridTemplateColumns: '1fr 1fr 1.4fr' }}>
                  <span>{o.amal}</span><span style={{ color: o.color, fontWeight: 700 }}>{o.method}</span><span>{o.sql}</span>
                </div>
              ))}
            </div>
          </Col>
          <Col>
            <p className="flow-label">Uch rol — har safar shunday</p>
            <div className="roadmap">
              <div className="step-card"><span className="step-num">01</span><span className="step-body"><span className="step-text">ME'MOR</span><span className="step-tag">sxemani siz loyihalaysiz</span></span></div>
              <div className="step-card"><span className="step-num">02</span><span className="step-body"><span className="step-text">REJISSYOR</span><span className="step-tag">AI'ga aniq prompt</span></span></div>
              <div className="step-card"><span className="step-num">03</span><span className="step-body"><span className="step-text">NAZORATCHI</span><span className="step-tag">Postman bilan test</span></span></div>
            </div>
            <div className="frame-success"><p className="body" style={{ margin: 0, color: T.ink }}>Ko'prik — <span className="mono">pool.query</span>. Aniq raqam — <span className="mono">:id</span> + <span className="mono">WHERE id=$1</span>. Xavfsizlik — <span className="mono">$1, $2</span> parametrlar.</p></div>
          </Col>
        </Split>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — YAKUNIY (VS Code: INSERT so'rovini yozish) =====
const Screen14 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [value, setValue] = useState(storedAnswer?.picked || '');
  const [passed, setPassed] = useState(!!storedAnswer?.correct);
  const norm = value.replace(/\s+/g, ' ').trim();
  const valid = /^['"]?\s*insert\s+into\s+cars\s*\(\s*nom\s*,\s*narx\s*,\s*yil\s*\)\s*values\s*\(\s*\$1\s*,\s*\$2\s*,\s*\$3\s*\)\s*['"]?$/i.test(norm);
  const hasInsert = /insert\s+into\s+cars/i.test(value);
  const hasCols = /\(\s*nom\s*,\s*narx\s*,\s*yil\s*\)/i.test(value);
  const hasVals = /values\s*\(\s*\$1\s*,\s*\$2\s*,\s*\$3\s*\)/i.test(value);
  const rawValues = /values\s*\(\s*nom\s*,/i.test(value);
  useEffect(() => {
    if (valid && !passed) {
      setPassed(true);
      onAnswer(screen, { stage: 'final', screenIdx: screen, question: 'VS Code: POST /api/cars ichidagi INSERT so\'rovini yozing', studentAnswer: value, correct: true, firstAttemptCorrect: true, solved: true, picked: value });
    }
  }, [valid]);
  const Ln = ({ n, children }) => (<div className="vsc-line"><span className="vsc-ln">{n}</span><span style={{ whiteSpace: 'pre' }}>{children}</span></div>);
  return (
    <Stage eyebrow="Yakuniy · amaliy" screen={screen} scrollSignal={passed} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!passed} label={passed ? 'Davom etish' : "INSERT so'rovini yozing"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Oxirgi qadam: <span className="italic" style={{ color: T.accent }}>qo'shish</span> so'rovini o'zingiz yozing.</h2></div>
        <Mentor>VS Code'da <span className="mono">server.js</span> ochiq: POST endpoint tayyor, body'dan <span className="mono">nom, narx, yil</span> olingan — faqat <b style={{ color: T.ink }}>INSERT so'rovi bo'sh</b>. To'ldiring: <span className="mono">INSERT INTO cars</span> + <span className="mono">(nom, narx, yil)</span> + <span className="mono">VALUES ($1, $2, $3)</span>.</Mentor>
        <div className="split">
          <Col>
            <div className="vsc fade-up delay-2">
              <div className="vsc-bar">
                <span className="vsc-tab on"><span style={{ color: '#8FD3A8' }}>🟢</span> server.js <span style={{ color: '#6E7681', marginLeft: 4 }}>×</span></span>
                <span className="vsc-tab">db.js</span>
              </div>
              <div className="vsc-body">
                <Ln n={1}>{'app.post('}<St>'/api/cars'</St>{', async (req, res) => {'}</Ln>
                <Ln n={2}>{'  '}<Jx>{'const'}</Jx>{' { nom, narx, yil } = req.body;'}</Ln>
                <Ln n={3}>{'  '}<At>await</At>{' pool.query('}</Ln>
                <div className="vsc-line">
                  <span className="vsc-ln">4</span>
                  <span style={{ whiteSpace: 'pre' }}>{'    '}</span>
                  <input className={`vsc-input ${valid ? 'ok' : ''}`} value={value} onChange={e => setValue(e.target.value)} placeholder="INSERT INTO cars (nom, narx, yil) VALUES ($1, $2, $3)" spellCheck={false} autoCapitalize="off" autoCorrect="off" />
                </div>
                <Ln n={5}>{'    , [nom, narx, yil]'}</Ln>
                <Ln n={6}>{'  );'}</Ln>
                <Ln n={7}>{'  res.json({ status: '}<St>"qo'shildi"</St>{' });'}</Ln>
                <Ln n={8}>{'});'}</Ln>
              </div>
            </div>
            <div className="fade-up delay-2" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="tagpill" style={{ opacity: hasInsert ? 1 : 0.4 }}>{hasInsert ? '✓' : '1'} INSERT INTO cars</span>
              <span className="tagpill" style={{ opacity: hasCols ? 1 : 0.4 }}>{hasCols ? '✓' : '2'} (nom, narx, yil)</span>
              <span className="tagpill" style={{ opacity: hasVals ? 1 : 0.4 }}>{hasVals ? '✓' : '3'} VALUES ($1, $2, $3)</span>
            </div>
            {rawValues && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Qiymatlarni to'g'ridan-to'g'ri yozmang — <span className="mono">VALUES (nom, ...)</span> emas. Xavfsiz usul: <span className="mono">VALUES ($1, $2, $3)</span>, qiymatlar massivda beriladi.</p></div>}
            {passed && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Mukammal! INSERT to'liq — endi POST har yangi mashinani bazaga yozadi. Backend'ingiz tayyor.</p></div>}
          </Col>
          <Col>
            <p className="flow-label">natija — Postman</p>
            <div className="pm">
              <div className="pm-bar"><MBadge m="POST" /><span className="pm-url">localhost:3000/api/cars</span></div>
              <div className="pm-body">
                {valid
                  ? <Resp status={201} text="Created" json={`{ "status": "qo'shildi", "id": 4 }`} />
                  : <p style={{ fontFamily: 'Georgia, serif', color: T.ink3, fontStyle: 'italic', margin: 0, textAlign: 'center', lineHeight: 1.5 }}>INSERT so'rovi yozilmaguncha POST ishlamaydi.</p>}
              </div>
            </div>
            {valid && <div className="fade-step" style={{ marginTop: 4 }}><p className="flow-label">cars jadvali</p><DbTable rows={[...CARS, POOL_CARS[0]]} flashId={POOL_CARS[0].id} /></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 15 — YAKUN =====
const Screen15 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const RECAP = [
    "Sxemani siz loyihalaysiz: CREATE TABLE cars (id SERIAL PRIMARY KEY, ...)",
    "Express bazaga pool.query orqali ulanadi — ko'prik",
    "CRUD ↔ HTTP ↔ SQL: GET/SELECT · POST/INSERT · PUT/UPDATE · DELETE/DELETE",
    "Aniq qator: :id manzilda + WHERE id = $1 bazada",
    "Xavfsizlik: qiymatlar $1, $2 parametrlarda — SQL'ga yopishtirilmaydi"
  ];
  const HOMEWORK = [
    { b: "O'z jadvalingiz", t: "— AvtoIjara'ga 'rang' yoki 'transmissiya' ustunini qo'shing (ALTER TABLE)" },
    { b: 'To\'liq CRUD', t: "— AI bilan 4 endpoint (GET/POST/PUT/DELETE) yozing" },
    { b: 'Postman test', t: "— har endpointni o'zingiz sinang: status kod to'g'rimi (200/201)?" }
  ];
  const GLOSSARY = [
    { b: 'pool.query', t: "— Express'dan PostgreSQL'ga SQL yuboruvchi ko'prik" },
    { b: 'SERIAL PRIMARY KEY', t: '— avtomatik o\'suvchi takrorlanmas id' },
    { b: 'INSERT', t: '— bazaga yangi qator qo\'shish (POST)' },
    { b: 'SELECT', t: '— bazadan o\'qish (GET)' },
    { b: 'UPDATE', t: '— mavjud qatorni o\'zgartirish (PUT)' },
    { b: 'DELETE', t: '— qatorni o\'chirish (DELETE)' },
    { b: ':id', t: '— manzildagi o\'zgaruvchi (req.params.id)' },
    { b: '$1, $2', t: '— xavfsiz parametrlar; qiymatlar massivda beriladi' }
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
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">✓</span> Birinchi backend'ingiz tayyor</span><h2 className="title h-title fade-up d1">AvtoIjara backend'ini <span className="italic" style={{ color: T.accent }}>o'zingiz qurdingiz</span>.</h2><p className="body h-sub fade-up d2">{PASSED ? "Tabriklaymiz! Endi mashinalar bazada yashaydi — qo'shish, o'qish, o'zgartirish, o'chirish hammasi serverda." : "Yaxshi harakat! pool.query va CRUD↔SQL mosligini mustahkamlash uchun bir-ikki ekranni qayta ko'ring."}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span className="tick" style={{ width: 16, height: 16, borderRadius: '50%', background: T.success, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck">✓</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>📝 Uyga vazifa</div><p className="body" style={{ margin: '0 0 10px', color: T.ink }}>Antigravity bilan o'z backend'ingizda sinang:</p><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">🚀 Backend tayyor, lekin u hozircha yolg'iz. Keyingi praktikada Modul 3'dagi React frontni aynan shu serverga ulaymiz — to'liq fullstack!</p></div>
        </div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">💡 Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function BackendCrudPracticeLesson({ lang: langProp, onFinished }) {
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
        .btn-soft:disabled { opacity: 0.5; cursor: not-allowed; }

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
        .gchip { font-family: 'Manrope'; font-weight: 600; font-size: 12.5px; padding: 8px 13px; border-radius: 99px; border: none; background: ${T.paper}; color: ${T.ink}; cursor: pointer; transition: all 0.18s; box-shadow: 0 3px 10px -5px rgba(${T.shadowBase},0.2); display: inline-flex; align-items: center; gap: 6px; } .gchip:hover:not(:disabled) { transform: translateY(-1px); } .gchip:disabled { opacity: 0.4; cursor: not-allowed; }
        .tagpill { font-family: 'JetBrains Mono', monospace; font-size: 12.5px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 99px; background: ${T.paper}; color: ${T.ink}; box-shadow: 0 3px 10px -5px rgba(${T.shadowBase},0.18); transition: opacity 0.2s; }

        /* === VCARD (amal tugmasi) === */
        .vcard { display: flex; align-items: center; gap: 11px; width: 100%; text-align: left; background: ${T.paper}; border: none; border-radius: 12px; padding: 12px 15px; cursor: pointer; transition: all 0.18s; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.16); }
        .vcard:hover { transform: translateY(-1px); }
        .vbadge { font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 11px; color: #fff; padding: 4px 9px; border-radius: 6px; letter-spacing: 0.02em; }
        .vlbl { font-family: 'Manrope', sans-serif; font-weight: 700; font-size: 13.5px; color: ${T.ink}; }
        .vseen { margin-left: auto; font-weight: 700; }

        /* === MENTOR === */
        .mentor { display: flex; gap: 12px; align-items: flex-start; }
        .mentor-ava { width: 40px; height: 40px; border-radius: 50%; overflow: hidden; flex-shrink: 0; box-shadow: 0 4px 12px -4px rgba(${T.shadowBase},0.28); }
        .mentor-ava svg { display: block; }
        .mentor-col { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5px; }
        .mentor-name { font-family: 'Manrope', sans-serif; font-weight: 700; font-size: 13px; color: ${T.accent}; letter-spacing: 0.01em; }
        .mentor-msg { background: ${T.paper}; border-radius: 4px 14px 14px 14px; padding: 13px 16px; color: ${T.ink}; box-shadow: 0 6px 18px -6px rgba(${T.shadowBase},0.16); }

        /* === HOOK OPSIYALARI (radio) === */
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
        .sk-info { background: ${T.paper}; border-radius: 12px; padding: 15px 17px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.16); animation: fade-step 0.3s; }
        .hint { background: ${T.bg}; border: 1.5px dashed ${T.ink3}; border-radius: 12px; padding: 14px 16px; font-size: clamp(13px,1.5vw,14px); color: ${T.ink2}; }

        /* === AI CARD === */
        .ai-card { background: ${T.paper}; border-radius: 14px; padding: 15px 17px; display: flex; flex-direction: column; gap: 11px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.14); }
        .ai-row { display: flex; align-items: center; gap: 9px; } .ai-badge { font-family: 'Manrope'; font-weight: 800; font-size: 11px; color: #fff; background: ${T.blue}; padding: 3px 9px; border-radius: 6px; } .ai-bubble { font-size: 13px; color: ${T.ink2}; }
        .ai-code { background: ${CODE.bg}; border-radius: 9px; padding: 10px 12px; display: flex; flex-direction: column; gap: 3px; }
        .ai-line { font-family: 'JetBrains Mono'; font-size: 13px; color: ${CODE.text}; cursor: pointer; padding: 7px 9px; border-radius: 6px; transition: all 0.15s; white-space: pre-wrap; } .ai-line:hover { background: rgba(255,255,255,0.06); }
        .ai-line.bad { background: rgba(255,79,40,0.16); box-shadow: inset 0 0 0 1px ${T.accent}; } .ai-line.ok { background: rgba(31,122,77,0.16); }
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

        /* === BROWSER / PREVIEW === */
        .bp-bar { background: #f0eee8; padding: 8px 11px; display: flex; align-items: center; gap: 9px; }
        .bb-dots { display: flex; gap: 5px; }
        .bb-dots i { width: 9px; height: 9px; border-radius: 50%; }
        .bb-dots i:first-child { background: #ff5f57; } .bb-dots i:nth-child(2) { background: #febc2e; } .bb-dots i:nth-child(3) { background: #28c840; }
        .bp-title { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink3}; }
        .bp-body { padding: clamp(12px,2.2vw,18px); }
        .code-box { background: ${CODE.bg}; color: ${CODE.text}; font-family: 'JetBrains Mono', monospace; font-size: clamp(12px,1.5vw,13.5px); line-height: 1.55; padding: clamp(12px,2.2vw,16px); border-radius: 12px; overflow-x: auto; white-space: pre-wrap; word-break: break-word; margin: 0; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.2); }

        /* === AVTOIJARA KARTOCHKA === */
        .rocard { border-radius: 12px; background: #fff; box-shadow: 0 4px 14px -4px rgba(0,0,0,0.16); overflow: hidden; border: 1px solid rgba(0,0,0,0.05); transition: transform 0.15s, box-shadow 0.15s; }
        .rothumb { height: 54px; display: flex; align-items: center; justify-content: center; position: relative; }
        .robody { padding: 7px 9px 9px; }
        .roname { font-family: 'Manrope', sans-serif; font-weight: 800; font-size: 12px; color: ${T.ink}; margin: 0 0 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .rostats { display: flex; align-items: center; gap: 8px; font-family: 'Manrope', sans-serif; font-size: 10.5px; color: ${T.ink2}; font-weight: 700; }
        .cardx { position: absolute; top: 4px; right: 5px; width: 20px; height: 20px; border-radius: 50%; border: none; background: rgba(14,14,16,0.5); color: #fff; font-size: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; line-height: 1; transition: background 0.15s; z-index: 2; }
        .cardx:hover { background: ${T.danger}; }

        /* === DB JADVAL (PostgreSQL) === */
        .db { border-radius: 12px; overflow: hidden; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.18); background: #fff; }
        .db-cap { background: #e9e5dc; padding: 8px 12px; font-family: 'Manrope', sans-serif; font-size: 12px; font-weight: 600; color: ${T.ink2}; } .db-cap b { color: ${T.ink}; } .db-cap span { color: ${T.ink3}; }
        .db-row { display: grid; grid-template-columns: 36px 1.3fr 1fr 0.8fr; gap: 8px; padding: 8px 12px; align-items: center; font-family: 'JetBrains Mono', monospace; font-size: 12px; color: ${T.ink}; border-top: 1px solid #eee; }
        .db-head { background: ${CODE.bg}; color: ${CODE.punct}; font-weight: 700; border-top: none; }
        .db-row.flash { background: ${T.successSoft}; }
        .db-empty { padding: 18px 12px; text-align: center; font-family: 'Georgia', serif; font-style: italic; color: ${T.ink3}; font-size: 13px; }
        .db-btn { border: none; background: ${T.bg}; border-radius: 7px; padding: 4px 8px; font-family: 'JetBrains Mono', monospace; font-size: 10.5px; font-weight: 700; cursor: pointer; transition: all 0.15s; }
        .db-btn:hover { background: #EFEBE3; transform: translateY(-1px); }

        /* === POSTMAN === */
        .pm { border-radius: 12px; overflow: hidden; background: #fff; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.18); }
        .pm-bar { display: flex; align-items: center; gap: 9px; padding: 9px 11px; background: #f0eee8; }
        .pm-method { font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 11px; color: #fff; padding: 4px 9px; border-radius: 6px; letter-spacing: 0.02em; }
        .pm-url { font-family: 'JetBrains Mono', monospace; font-size: 12px; color: ${T.ink}; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
        .pm-send { margin-left: auto; flex-shrink: 0; padding: 5px 13px; }
        .pm-send-static { margin-left: auto; flex-shrink: 0; font-family: 'Manrope', sans-serif; font-weight: 700; font-size: 12px; color: ${T.ink3}; background: ${T.bg}; padding: 5px 13px; border-radius: 8px; }
        .pm-body { padding: 11px 12px; }
        .pm-resp { margin-top: 9px; }
        .pm-status { font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 12px; margin-bottom: 7px; }
        .json { background: ${CODE.bg}; color: ${CODE.text}; border-radius: 9px; padding: 10px 12px; font-family: 'JetBrains Mono', monospace; font-size: 11.5px; white-space: pre-wrap; word-break: break-word; line-height: 1.6; margin: 0; }

        /* === ZANJIR (chain) === */
        .chain { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .chain-node { font-family: 'JetBrains Mono', monospace; font-size: 11.5px; font-weight: 700; padding: 7px 11px; border-radius: 9px; transition: all 0.3s; }
        .chain-arr { font-size: 13px; transition: color 0.3s; }

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
