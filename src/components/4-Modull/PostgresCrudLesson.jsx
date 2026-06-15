import React, { useState, useEffect, useRef, createContext, useContext, useCallback } from 'react';

// ============================================================
// BACKEND MODULI (4-MODUL) · 5-DARS — PostgreSQL SO'ROVLAR (CRUD) + AI BILAN ISHLASH — PLATFORM STANDARD v16 (AUDIOSIZ)
// Mavzu: ma'lumotlar bazasi va jadval yaratish (CREATE TABLE), bitta `products` jadvali ustida to'liq CRUD —
//        INSERT (qo'shish) · SELECT (+WHERE filtr) (ko'rish) · UPDATE (o'zgartirish) · DELETE (o'chirish);
//        va eng muhimi: AI/agent yordamida SQL yozdirish — o'quvchi oddiy tilda so'raydi, AI SQL yozadi, o'quvchi TEKSHIRADI.
// Misol: onlayn do'kon → `products` jadvali (id, nom, narx, soni). Yon misol: `users` jadvali (agent demosi).
// Ko'prik: o'tgan darslarda server (Node) va routing (Nest controller) qurdik — endi ma'lumot QAYERDA va QANDAY saqlanadi.
// QAROR (user): bitta jadval CRUD, JOIN yo'q; AI bilan ishlashga kuchli urg'u; yakunda o'quvchi INSERT'ni O'ZI yozadi.
// AI FRAMING: "AI yozadi, siz arxitektor/tekshiruvchisiz" — SQL'ni yoddan bilish shart emas, tushunish va tekshirish muhim.
// AUDIOSIZ: ovoz (TTS) yo'q — platforma qarori. Har ekran global savol bilan ochiladi.
// Yakuniy ekran (s15): VS Code mock — `INSERT INTO products ...` yoziladi → ▶ Run → yangi qator jadvalga qo'shiladi.
// Toza dizayn — ortiqcha emoji yo'q; ma'no so'z va tipografiya bilan beriladi.
// PRODUCTION: <style> ichidagi @import OLIB TASHLANADI — shriftlarni LMS yuklaydi.
// ============================================================

const T = {
  bg: '#F6F4EF', ink: '#0E0E10', ink2: '#5A5A60', ink3: '#A7A6A2',
  paper: '#FFFFFF', accent: '#FF4F28', accentSoft: '#FFE8E1', accentVivid: '#FF4F28',
  success: '#1F7A4D', successSoft: '#E3F0E8', blue: '#019ACB', blueSoft: '#E2F4FA', link: '#1a56db',
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

const LESSON_META = { lessonId: 'pg-crud-04-05-v16', lessonTitle: { uz: 'PostgreSQL so\'rovlar — CRUD + AI bilan', ru: 'Запросы PostgreSQL — CRUD + ИИ' } };
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
  { id: 's11', type: 'case',        template: 'custom',   scored: false, scope: null },
  { id: 's12', type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's13', type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's14', type: 'rule',        template: 'custom',   scored: false, scope: null },
  { id: 's15', type: 'test',        template: 'custom',   scored: true,  scope: 'final' },
  { id: 's16', type: 'summary',     template: 'custom',   scored: false, scope: null }
];
const TOTAL_SCREENS = SCREEN_META.length;
const SCORED_IDX = SCREEN_META.map((m, i) => (m.scored ? i : null)).filter(i => i !== null);

const Split = ({ children }) => <div className="split">{children}</div>;
const Col = ({ children, gap }) => <div className="col" style={gap ? { gap } : undefined}>{children}</div>;

const Stage = ({ children, eyebrow, screen, totalScreens = TOTAL_SCREENS, navContent, narrow, mentorStatic }) => {
  const isMobile = useIsMobile();
  const isNarrow = useIsMobile(768); // mobil: Mentor yig'ilish rejimi
  const collapseOn = isNarrow && !mentorStatic; // ba'zi sahifalarda Mentor yig'ilmaydi
  const padH = isMobile ? 12 : 100;
  const [mCollapsed, setMCollapsed] = useState(false);
  const contentRef = useRef(null);
  useEffect(() => { setMCollapsed(false); }, [screen]); // har ekranda Mentor ochiq holatdan boshlanadi
  const setCollapsed = useCallback((v) => {
    setMCollapsed(v);
    if (v === false && contentRef.current) { const el = contentRef.current; requestAnimationFrame(() => { if (el) el.scrollTo({ top: 0, behavior: 'auto' }); }); }
  }, []);
  const onContentClick = (e) => {
    if (!collapseOn || mCollapsed) return;
    if (e.target && e.target.closest && e.target.closest('.mentor')) return; // Mentorning o'ziga tegsa — yig'maymiz
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
    if (firstCorrectRef.current === null) firstCorrectRef.current = isCorrect; // ball: 1-urinishni qotirib qo'yamiz
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

// ===== OYNA (brauzer/baza chrome) =====
const Win = ({ title, children, minH, hotTitle }) => (
  <div className="bp-window"><div className="bp-bar"><span className="bb-dots"><i /><i /><i /></span><span className="bp-title" style={hotTitle ? { color: T.accent, fontWeight: 700 } : undefined}>{title}</span></div><div className="bp-body" style={{ minHeight: minH, position: 'relative' }}>{children}</div></div>
);

// ============================================================
// 4-MODUL · 5-DARS YORDAMCHILAR — onlayn do'kon ma'lumotlari
// ============================================================
// products jadvali — dars bo'ylab ustida ishlaydigan asosiy ma'lumot
const PRODUCTS = [
  { id: 1, nom: 'Klaviatura', narx: 120000, soni: 8 },
  { id: 2, nom: 'Sichqoncha', narx: 75000,  soni: 15 },
  { id: 3, nom: 'Quloqchin',  narx: 95000,  soni: 5 }
];
const PCOLS = ['id', 'nom', 'narx', 'soni'];
// users jadvali — agent demosi (s13) uchun yon misol
const USERS = [
  { id: 1, ism: 'Ali',    shahar: 'Toshkent' },
  { id: 2, ism: 'Malika', shahar: 'Samarqand' },
  { id: 3, ism: 'Bek',    shahar: 'Buxoro' }
];
const UCOLS = ['id', 'ism', 'shahar'];
const fmtNarx = (n) => Number(n).toLocaleString('ru-RU');

// Jadval — qator/ustun, ustun yoki qatorni ajratib ko'rsatish mumkin
const DataTable = ({ cols, rows, hiRow, hiCol, onCol, onRow }) => (
  <div className="dtable-wrap fade-up">
    <table className="dtable">
      <thead>
        <tr>{cols.map(c => (
          <th key={c} className={`${hiCol === c ? 'hi' : ''} ${onCol ? 'click' : ''}`} onClick={onCol ? () => onCol(c) : undefined}>{c}</th>
        ))}</tr>
      </thead>
      <tbody>
        {rows.length === 0
          ? <tr><td colSpan={cols.length} style={{ color: T.ink3, fontStyle: 'italic', textAlign: 'center' }}>— jadval bo'sh (0 qator) —</td></tr>
          : rows.map((r, ri) => (
            <tr key={r.id ?? ri} className={`row-in ${hiRow === ri ? 'hi' : ''} ${onRow ? 'click' : ''}`} onClick={onRow ? () => onRow(ri) : undefined}>
              {cols.map(c => <td key={c} className={hiCol === c ? 'hi' : ''}>{c === 'narx' ? fmtNarx(r[c]) : String(r[c])}</td>)}
            </tr>
          ))}
      </tbody>
    </table>
  </div>
);

// Rang bilan SQL so'rovini ko'rsatish (kalit so'zlar ajratiladi)
const SQL_KW = new Set(['CREATE TABLE', 'INSERT INTO', 'DELETE FROM', 'SELECT', 'FROM', 'WHERE', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'AND', 'OR', '*']);
const SqlCode = ({ q, mini }) => {
  const segs = q.split(/(CREATE TABLE|INSERT INTO|DELETE FROM|SELECT|FROM|WHERE|VALUES|UPDATE|SET|DELETE|AND|OR|\*)/g);
  return (
    <pre className={`sql-box ${mini ? 'mini' : ''}`}>{segs.map((s, i) => SQL_KW.has(s) ? <span key={i} className="sql-kw">{s}</span> : <span key={i}>{s}</span>)}</pre>
  );
};

// SQL KONSOLI — bu darsning markaziy widgeti. So'rovni ko'rsatadi + ▶ Run tugmasi.
// Natijani (jadval yoki status) ekran o'zi joylashtiradi (children orqali yoki yonida).
const SqlRunner = ({ query, ran, onRun, runLabel = '▶ Ishga tushirish', disabled }) => (
  <div className="srunner">
    <SqlCode q={query} />
    {!ran && <button className="btn srun-btn" disabled={disabled} onClick={onRun}>{runLabel}</button>}
    {ran && <div className="srun-done">✓ Bajarildi</div>}
  </div>
);

// Natija statusi (N qator qo'shildi/yangilandi/o'chirildi)
const SqlStatus = ({ children, ok = true }) => (
  <div className={`sql-status ${ok ? 'ok' : 'warn'} fade-step`}>{children}</div>
);

// Terminal qatori
const TLine = ({ cmd, out, dim }) => (
  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12.5, lineHeight: 1.7 }}>
    {cmd && <div style={{ color: CODE.text }}><span style={{ color: CODE.comment }}>$ </span>{cmd}</div>}
    {out && <div style={{ color: dim ? CODE.comment : CODE.str }}>{out}</div>}
  </div>
);

// ===== SCREEN 0 — HOOK (do'kon ma'lumoti qayerda yashaydi?) =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [view, setView] = useState('sayt');
  const [seen, setSeen] = useState(() => new Set(storedAnswer ? ['sayt', 'baza'] : ['sayt']));
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const tried = seen.has('sayt') && seen.has('baza');
  const swap = (v) => { setView(v); setSeen(prev => { const s = new Set(prev); s.add(v); return s; }); };
  const OPTS = [
    { id: 'a', label: "Saytning HTML kodida — har mahsulot qo'lda yozilgan" },
    { id: 'b', label: "Ma'lumotlar bazasida (PostgreSQL) — server o'qib chiqaradi" },
    { id: 'c', label: "Brauzer xotirasida — saytni yopsangiz, yo'qoladi" }
  ];
  const correct = 'b';
  const pick = (v) => { if (picked !== null || !tried) return; setPicked(v); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: v === correct }); };
  return (
    <Stage eyebrow="Kirish" screen={screen} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 860 }}>Do'kondagi <span className="italic" style={{ color: T.accent }}>minglab mahsulot</span> aslida qayerda saqlanadi?</h1>
        <Mentor>O'tgan darsda server qurdik — u so'rovga javob beradi. Lekin mahsulotlar, narxlar, buyurtmalar <b style={{ color: T.ink }}>qayerda saqlanadi</b>? Saytni ko'ring, keyin <b style={{ color: T.accent }}>ortidagi bazani</b> oching — bir xil ma'lumot, ikki tomondan.</Mentor>
        <Split>
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${view === 'sayt' ? 'chip-on' : ''}`} onClick={() => swap('sayt')}>Sayt {seen.has('sayt') ? '✓' : ''}</button>
              <button className={`chip ${view === 'baza' ? 'chip-on' : ''}`} onClick={() => swap('baza')}>Ortidagi baza {seen.has('baza') ? '✓' : ''}</button>
            </div>
            {view === 'sayt'
              ? <Win title="zakaz-shop.uz — onlayn do'kon" minH={172}>
                  <div className="demo-swap shopmock">
                    {PRODUCTS.map(p => (
                      <div key={p.id} className="shop-card"><div className="shop-name">{p.nom}</div><div className="shop-narx">{fmtNarx(p.narx)} so'm</div><button className="shop-buy">Savatga</button></div>
                    ))}
                  </div>
                </Win>
              : <Win title="PostgreSQL — products jadvali" minH={172} hotTitle>
                  <div className="demo-swap"><DataTable cols={PCOLS} rows={PRODUCTS} /></div>
                </Win>}
            <p className="mono small" style={{ margin: 0, color: view === 'sayt' ? T.ink2 : T.accent }}>{view === 'sayt' ? 'Foydalanuvchi ko\'radigan chiroyli tomon' : 'Ma\'lumot qator-ustun bo\'lib bazada yotadi'}</p>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Sizningcha mahsulotlar asosan qayerda saqlanadi?</p>
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
            {!tried && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>Avval ikkala tomonni bosib ko'ring ←</p>}
            {picked !== null && <p className="hook-ack fade-step">{picked === correct ? <>To'g'ri! Ma'lumot <b>bazada</b> (PostgreSQL) saqlanadi. Sayt va server undan o'qib chiqaradi.</> : <>Aslida ma'lumot <b>bazada</b> (PostgreSQL) yashaydi — sayt yopilsa ham yo'qolmaydi. Bugun o'sha bazani o'zimiz boshqarishni o'rganamiz.</>}</p>}
          </Col>
        </Split>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const STEPS = [
    { text: "Jadval yaratamiz", tag: 'CREATE TABLE' },
    { text: "Mahsulot qo'shamiz", tag: 'INSERT' },
    { text: "Ko'ramiz va qidiramiz", tag: 'SELECT · WHERE' },
    { text: "O'zgartiramiz va o'chiramiz", tag: 'UPDATE · DELETE' },
    { text: "AI bilan ishlaymiz", tag: 'so\'ra · tekshir' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const PreviewBlock = (
    <Col>
      <p className="flow-label">Bugun shu jadval ustida ishlaymiz</p>
      <Win title="PostgreSQL — products jadvali" minH={150}>
        <DataTable cols={PCOLS} rows={PRODUCTS} />
      </Win>
      <p className="mono small" style={{ color: T.accent, margin: 0 }}>→ qo'shamiz · ko'ramiz · o'zgartiramiz · o'chiramiz</p>
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
        <div className="head"><h2 className="title h-title fade-up">Bugun <span className="italic" style={{ color: T.accent }}>haqiqiy bazani</span> o'zimiz boshqaramiz</h2></div>
        <Mentor>Va'da: dars oxirida siz bazaga <b style={{ color: T.ink }}>o'z mahsulotingizni</b> qo'sha olasiz. SQL — bu baza bilan gaplashish tili. Yoddan bilish shart emas — <b style={{ color: T.ink }}>tushunish va tekshirish</b> muhim, qolganiga AI yordam beradi.</Mentor>
        {!isNarrow ? (
          <Split>{PreviewBlock}{StepsBlock}</Split>
        ) : !showSteps ? (
          <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>
            {PreviewBlock}
            <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>Bugungi 5 qadamni ko'rish</button>
          </div>
        ) : (
          <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>
            <button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ Jadvalni ko'rish</button>
            {StepsBlock}
          </div>
        )}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — BAZA & JADVAL (CREATE TABLE) =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [ran, setRan] = useState(!!storedAnswer);
  const [activeCol, setActiveCol] = useState(null);
  const done = ran;
  const FIELDS = [
    { k: 'id', tip: 'SERIAL PRIMARY KEY', desc: "Har mahsulotning takrorlanmas raqami. Avtomatik o'sib boradi (1, 2, 3...) — PRIMARY KEY = asosiy kalit." },
    { k: 'nom', tip: 'TEXT', desc: "Mahsulot nomi — matn (TEXT). Masalan: 'Klaviatura'." },
    { k: 'narx', tip: 'INTEGER', desc: "Narx — butun son (INTEGER). Masalan: 120000." },
    { k: 'soni', tip: 'INTEGER', desc: "Ombordagi soni — butun son (INTEGER)." }
  ];
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = FIELDS.find(f => f.k === activeCol);
  return (
    <Stage eyebrow="Jadval yaratish" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Jadvalni yarating"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Ma'lumotni saqlash uchun avval <span className="italic" style={{ color: T.accent }}>jadval</span> kerak</h2></div>
        <Mentor>Baza — bu jadvallar uyi. Jadval = <b style={{ color: T.ink }}>ustunlar</b> (xususiyatlar: nom, narx, soni) va <b style={{ color: T.ink }}>qatorlar</b> (har bir mahsulot). <span className="mono">CREATE TABLE</span> buyrug'i bo'sh jadval yasaydi. Ustunlarni bosib, har birining tipini ko'ring, keyin jadvalni yarating.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">products jadvalining "chizmasi"</p>
            <SqlCode q={"CREATE TABLE products (\n  id    SERIAL PRIMARY KEY,\n  nom   TEXT,\n  narx  INTEGER,\n  soni  INTEGER\n)"} />
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {FIELDS.map(f => <button key={f.k} className={`chip ${activeCol === f.k ? 'chip-on' : ''}`} onClick={() => setActiveCol(f.k)}>{f.k}</button>)}
            </div>
            {cur && <div className="sk-info fade-step" key={cur.k}><span className="sk-tagbig"><span className="sk-wordbadge">{cur.k}</span> <span className="mono small" style={{ color: T.blue }}>{cur.tip}</span></span><p className="body" style={{ color: T.ink, margin: '9px 0 0' }}>{cur.desc}</p></div>}
          </Col>
          <Col>
            <p className="flow-label">Natija</p>
            {!ran
              ? <><div className="frame-dash" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 110 }}><p className="small" style={{ color: T.ink3, fontStyle: 'italic', textAlign: 'center', margin: 0 }}>Hali jadval yo'q.<br />Tugmani bosing — bo'sh jadval tug'iladi.</p></div>
                <button className="btn fade-up delay-1" style={{ alignSelf: 'flex-start' }} onClick={() => setRan(true)}>▶ Jadvalni yaratish</button></>
              : <><DataTable cols={PCOLS} rows={[]} />
                <SqlStatus>Jadval tayyor! Ustunlar bor, lekin hali <b>0 qator</b>. Endi mahsulot qo'shamiz.</SqlStatus></>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — INSERT (qo'shish) =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [rows, setRows] = useState(storedAnswer ? PRODUCTS : []);
  const [lastQ, setLastQ] = useState(null);
  const added = new Set(rows.map(r => r.id));
  const done = rows.length >= 2;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const add = (p) => { if (added.has(p.id)) return; setRows(rs => [...rs, p]); setLastQ(p); };
  return (
    <Stage eyebrow="INSERT · qo'shish" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Yana ${2 - rows.length} ta qo'shing`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Jadvalga mahsulotni <span className="italic" style={{ color: T.accent }}>qanday qo'shamiz?</span></h2></div>
        <Mentor>Yangi qator qo'shish — <span className="mono">INSERT INTO</span> buyrug'i. Qaysi ustunlarga, qanday qiymat: <span className="mono">VALUES (...)</span>. Pastdagi mahsulotlarni bosing — har bosishda bitta INSERT bajariladi va jadvalga yangi qator qo'shiladi.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">Qo'shiladigan mahsulotlar</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {PRODUCTS.map(p => (
                <button key={p.id} className={`pick-row ${added.has(p.id) ? 'on' : ''}`} disabled={added.has(p.id)} onClick={() => add(p)}>
                  <span className="pick-box">{added.has(p.id) ? '✓' : '+'}</span>
                  <span><b>{p.nom}</b> <span className="mono small" style={{ color: T.ink2 }}>{fmtNarx(p.narx)} · {p.soni} dona</span></span>
                </button>
              ))}
            </div>
            {lastQ && <SqlCode mini q={`INSERT INTO products (nom, narx, soni)\nVALUES ('${lastQ.nom}', ${lastQ.narx}, ${lastQ.soni})`} />}
          </Col>
          <Col>
            <p className="flow-label">products jadvali</p>
            <DataTable cols={PCOLS} rows={rows} hiRow={rows.length - 1} />
            {done && <SqlStatus><b>{rows.length} qator</b> qo'shildi. INSERT — bu jadvalga yangi ma'lumot QO'SHADI.</SqlStatus>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 =====
const Screen4 = (props) => (
  <QuestionScreen {...props} idx={4} scope="module-mikro" eyebrow="Mashq · 1-savol"
    questionText="Jadvalga yangi ma'lumot qo'shadigan buyruq qaysi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Do'konga yangi mahsulot keldi. Jadvalga yangi qator qo'shish uchun <span className="italic" style={{ color: T.accent }}>qaysi buyruq</span>?</h2></>}
    options={["SELECT — ma'lumotni ko'rsatadi", "INSERT INTO — yangi qator qo'shadi", "DELETE — qatorni o'chiradi", "UPDATE — qatorni o'zgartiradi"]} correctIdx={1}
    explainCorrect="To'g'ri! INSERT INTO ... VALUES (...) jadvalga yangi qator (mahsulot) qo'shadi."
    explainWrong={{
      0: "SELECT faqat ko'rsatadi — yangi ma'lumot qo'shmaydi.",
      2: "DELETE o'chiradi, qo'shmaydi.",
      3: "UPDATE mavjud qatorni o'zgartiradi, yangi qo'shmaydi.",
      default: "Qo'shish — bu INSERT INTO."
    }} />
);

// ===== SCREEN 5 — SELECT (ko'rish) =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [mode, setMode] = useState(null); // null | 'all' | 'cols'
  const done = mode !== null;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const query = mode === 'cols' ? 'SELECT nom, narx FROM products' : 'SELECT * FROM products';
  const cols = mode === 'cols' ? ['nom', 'narx'] : PCOLS;
  return (
    <Stage eyebrow="SELECT · ko'rish" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "So'rovni ishga tushiring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bazadagi ma'lumotni <span className="italic" style={{ color: T.accent }}>qanday ko'ramiz?</span></h2></div>
        <Mentor>Ma'lumotni o'qib olish — <span className="mono">SELECT</span> buyrug'i. <span className="mono">SELECT * FROM products</span> = "products jadvalidagi <b>hamma ustunni</b> ko'rsat" (yulduzcha <b>*</b> = barchasi). Faqat kerakli ustunlarni ham so'rash mumkin: <span className="mono">SELECT nom, narx</span>.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">So'rovni tanlang</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className={`chip ${mode === 'all' ? 'chip-on' : ''}`} onClick={() => setMode('all')}>SELECT * (hammasi)</button>
              <button className={`chip ${mode === 'cols' ? 'chip-on' : ''}`} onClick={() => setMode('cols')}>SELECT nom, narx</button>
            </div>
            <SqlCode q={mode ? query : 'SELECT * FROM products'} />
            <p className="small" style={{ color: T.ink2, margin: 0 }}>O'qilishi: "{mode === 'cols' ? 'products jadvalidan faqat nom va narx ustunlarini' : 'products jadvalidan hamma narsani'} ko'rsat".</p>
          </Col>
          <Col>
            <p className="flow-label">Natija</p>
            {done
              ? <><DataTable key={mode} cols={cols} rows={PRODUCTS} /><SqlStatus>SELECT ma'lumotni <b>o'zgartirmaydi</b> — faqat ko'rsatadi (o'qiydi).</SqlStatus></>
              : <div className="frame-dash" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 110 }}><p className="small" style={{ color: T.ink3, fontStyle: 'italic', textAlign: 'center', margin: 0 }}>← So'rovni tanlang — natija jadval bo'lib chiqadi</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 5b — TEST 2 =====
const Screen5b = (props) => (
  <QuestionScreen {...props} idx={6} scope="module-mikro" eyebrow="Mashq · 2-savol"
    questionText="SELECT buyrug'i nima qiladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}><span className="italic" style={{ color: T.accent }}>SELECT</span> buyrug'i ma'lumot bilan nima qiladi?</h2></>}
    options={["Jadvalni o'chiradi", "Jadvaldan ma'lumotni o'qib ko'rsatadi", "Narxlarni o'zgartiradi", "Yangi jadval yaratadi"]} correctIdx={1}
    explainCorrect="To'g'ri! SELECT — bu o'qish buyrug'i: jadvaldan ma'lumotni olib ko'rsatadi, hech narsani o'zgartirmaydi."
    explainWrong={{
      0: "O'chirish — DELETE/DROP. SELECT hech narsani o'chirmaydi.",
      2: "O'zgartirish — UPDATE. SELECT faqat o'qiydi.",
      3: "Jadval yaratish — CREATE TABLE. SELECT mavjud ma'lumotni ko'rsatadi.",
      default: "SELECT = o'qish/ko'rish."
    }} />
);

// ===== SCREEN 6 — WHERE (filtr) =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const CONDS = [
    { id: 'cheap', sql: 'narx < 100000', label: 'Arzonlar: narx < 100000', test: r => r.narx < 100000 },
    { id: 'low',   sql: 'soni < 6',      label: 'Tugayotgan: soni < 6',    test: r => r.soni < 6 },
    { id: 'exp',   sql: 'narx > 100000', label: 'Qimmatlar: narx > 100000', test: r => r.narx > 100000 }
  ];
  const [sel, setSel] = useState(storedAnswer ? 'cheap' : null);
  const done = sel !== null;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cond = CONDS.find(c => c.id === sel);
  const rows = cond ? PRODUCTS.filter(cond.test) : PRODUCTS;
  return (
    <Stage eyebrow="WHERE · filtr" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Bitta filtrni sinab ko'ring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Minglab mahsulotdan <span className="italic" style={{ color: T.accent }}>faqat kerakligini</span> qanday topamiz?</h2></div>
        <Mentor>Bu yerda <span className="mono">WHERE</span> kuchga kiradi — u <b style={{ color: T.ink }}>shart</b> qo'yadi. <span className="mono">SELECT * FROM products WHERE narx &lt; 100000</span> = "faqat narxi 100 000 dan arzonlarini ko'rsat". Shartni tanlang — jadval jonli filtrlanadi.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">Shartni tanlang (WHERE)</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {CONDS.map(c => <button key={c.id} className={`chip ${sel === c.id ? 'chip-on' : ''}`} style={{ justifyContent: 'flex-start' }} onClick={() => setSel(c.id)}>{c.label}</button>)}
            </div>
            <SqlCode q={`SELECT * FROM products\nWHERE ${cond ? cond.sql : 'narx < 100000'}`} />
          </Col>
          <Col>
            <p className="flow-label">Natija {cond && <span className="mono" style={{ color: T.accent }}>({rows.length} ta topildi)</span>}</p>
            <DataTable key={sel} cols={PCOLS} rows={rows} hiCol={cond ? (cond.id === 'low' ? 'soni' : 'narx') : null} />
            {done && <SqlStatus>WHERE — bu <b>shart (filtr)</b>. U faqat mos qatorlarni qaytaradi.</SqlStatus>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — UPDATE (o'zgartirish) =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [rows, setRows] = useState(() => PRODUCTS.map(p => ({ ...p })));
  const [ran, setRan] = useState(!!storedAnswer);
  const [danger, setDanger] = useState(false);
  const done = ran;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  useEffect(() => { if (storedAnswer) setRows(PRODUCTS.map(p => p.id === 1 ? { ...p, narx: 99000 } : { ...p })); }, []);
  const run = () => { setRows(rs => rs.map(r => r.id === 1 ? { ...r, narx: 99000 } : r)); setRan(true); };
  return (
    <Stage eyebrow="UPDATE · o'zgartirish" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "So'rovni ishga tushiring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Klaviatura narxi tushdi — bazada <span className="italic" style={{ color: T.accent }}>qanday yangilaymiz?</span></h2></div>
        <Mentor>Mavjud qatorni o'zgartirish — <span className="mono">UPDATE</span>. <span className="mono">SET</span> bilan yangi qiymatni, <span className="mono">WHERE</span> bilan <b style={{ color: T.ink }}>qaysi qatorni</b> ko'rsatamiz. <b style={{ color: T.accent }}>Diqqat:</b> WHERE'ni unutsangiz — HAMMA qator o'zgaradi!</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">So'rov: Klaviatura (id=1) narxini yangilash</p>
            <SqlRunner ran={ran} onRun={run} runLabel="▶ Ishga tushirish" query={"UPDATE products\nSET narx = 99000\nWHERE id = 1"} />
            <button className={`chip ${danger ? 'chip-on' : ''}`} style={{ alignSelf: 'flex-start' }} onClick={() => setDanger(d => !d)}>{danger ? '✕ Yashirish' : '⚠ WHERE\'siz nima bo\'ladi?'}</button>
            {danger && <div className="frame-warn fade-step"><SqlCode mini q={"UPDATE products\nSET narx = 99000"} /><p className="body" style={{ margin: '8px 0 0', color: T.ink }}>WHERE yo'q → <b>BARCHA</b> mahsulot narxi 99000 bo'lib qoladi! Shuning uchun UPDATE'da WHERE deyarli doim kerak.</p></div>}
          </Col>
          <Col>
            <p className="flow-label">products jadvali</p>
            <DataTable cols={PCOLS} rows={rows} hiRow={ran ? 0 : null} hiCol={ran ? 'narx' : null} />
            {ran && <SqlStatus><b>1 qator yangilandi.</b> Klaviatura narxi 120 000 → 99 000 bo'ldi.</SqlStatus>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — DELETE (o'chirish) =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [rows, setRows] = useState(() => storedAnswer ? PRODUCTS.filter(p => p.id !== 3).map(p => ({ ...p })) : PRODUCTS.map(p => ({ ...p })));
  const [ran, setRan] = useState(!!storedAnswer);
  const [danger, setDanger] = useState(false);
  const done = ran;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const run = () => { setRows(rs => rs.filter(r => r.id !== 3)); setRan(true); };
  return (
    <Stage eyebrow="DELETE · o'chirish" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "So'rovni ishga tushiring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Mahsulot sotuvdan chiqdi — uni <span className="italic" style={{ color: T.accent }}>qanday o'chiramiz?</span></h2></div>
        <Mentor>Qatorni o'chirish — <span className="mono">DELETE FROM</span>. Yana <span className="mono">WHERE</span> bilan <b style={{ color: T.ink }}>qaysi qatorni</b> aniqlaymiz. Bu yerda Quloqchin (id=3) ni o'chiramiz. <b style={{ color: T.accent }}>WHERE'siz DELETE — butun jadvalni tozalab yuboradi!</b></Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">So'rov: Quloqchin (id=3) ni o'chirish</p>
            <SqlRunner ran={ran} onRun={run} runLabel="▶ Ishga tushirish" query={"DELETE FROM products\nWHERE id = 3"} />
            <button className={`chip ${danger ? 'chip-on' : ''}`} style={{ alignSelf: 'flex-start' }} onClick={() => setDanger(d => !d)}>{danger ? '✕ Yashirish' : '⚠ WHERE\'siz nima bo\'ladi?'}</button>
            {danger && <div className="frame-warn fade-step"><SqlCode mini q={"DELETE FROM products"} /><p className="body" style={{ margin: '8px 0 0', color: T.ink }}>WHERE yo'q → <b>HAMMA mahsulot</b> o'chib ketadi, jadval bo'shab qoladi! Shuning uchun DELETE'da WHERE juda muhim.</p></div>}
          </Col>
          <Col>
            <p className="flow-label">products jadvali</p>
            <DataTable cols={PCOLS} rows={rows} />
            {ran && <SqlStatus><b>1 qator o'chirildi.</b> Quloqchin jadvaldan olib tashlandi.</SqlStatus>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 9 — TEST 3 =====
const Screen9 = (props) => (
  <QuestionScreen {...props} idx={9} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="Mahsulot narxini o'zgartirish uchun qaysi buyruq?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Sichqoncha narxini yangilamoqchisiz. <span className="italic" style={{ color: T.accent }}>Qaysi buyruq</span> kerak?</h2></>}
    options={["INSERT — yangi qator qo'shadi", "UPDATE ... SET ... WHERE — qatorni o'zgartiradi", "SELECT — faqat ko'rsatadi", "DELETE — o'chiradi"]} correctIdx={1}
    explainCorrect="To'g'ri! UPDATE ... SET narx=... WHERE id=... mavjud qatorning qiymatini o'zgartiradi."
    explainWrong={{
      0: "INSERT yangi qator qo'shadi — eski narxni o'zgartirmaydi.",
      2: "SELECT faqat ko'rsatadi, o'zgartirmaydi.",
      3: "DELETE o'chiradi — o'zgartirish uchun UPDATE kerak.",
      default: "O'zgartirish — bu UPDATE."
    }} />
);

// ===== SCREEN 10 — CRUD XARITASI =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const OPS = [
    { id: 'c', word: 'INSERT', en: 'Create', uz: 'Qo\'shish', sql: 'INSERT INTO products ...', col: T.success, desc: "Jadvalga yangi qator (mahsulot) qo'shadi." },
    { id: 'r', word: 'SELECT', en: 'Read', uz: 'Ko\'rish', sql: 'SELECT * FROM products', col: T.blue, desc: "Jadvaldan ma'lumotni o'qib ko'rsatadi (WHERE bilan filtrlash mumkin)." },
    { id: 'u', word: 'UPDATE', en: 'Update', uz: 'O\'zgartirish', sql: 'UPDATE products SET ...', col: T.accent, desc: "Mavjud qatorning qiymatini yangilaydi (WHERE bilan)." },
    { id: 'd', word: 'DELETE', en: 'Delete', uz: 'O\'chirish', sql: 'DELETE FROM products WHERE ...', col: '#9333ea', desc: "Qatorni jadvaldan o'chiradi (WHERE bilan)." }
  ];
  const [seen, setSeen] = useState(storedAnswer ? new Set(OPS.map(o => o.id)) : new Set());
  const [active, setActive] = useState(storedAnswer ? 'c' : null);
  const done = seen.size >= 4;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const tap = (id) => { setActive(id); setSeen(s => new Set(s).add(id)); };
  const cur = OPS.find(o => o.id === active);
  return (
    <Stage eyebrow="CRUD xaritasi" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/4 buyruqni ko'ring`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">To'rt buyruq — bazaning <span className="italic" style={{ color: T.accent }}>to'rt asosiy ishi</span></h2></div>
        <Mentor>Ma'lumot bilan qilinadigan har bir ish shu to'rttaga sig'adi — ularni <b style={{ color: T.ink }}>CRUD</b> deyishadi: Create (qo'sh), Read (ko'r), Update (o'zgartir), Delete (o'chir). Har birini bosib ko'ring. <b style={{ color: T.ink }}>Modul 5'da NestJS aynan shu 4 amalni</b> avtomatik bajaradi — siz faqat so'raysiz.</Mentor>
        <div className="split">
          <Col>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
              {OPS.map(o => (
                <button key={o.id} className={`crud-card ${active === o.id ? 'on' : ''} ${seen.has(o.id) ? 'seen' : ''}`} onClick={() => tap(o.id)} style={active === o.id ? { boxShadow: `0 0 0 2px ${o.col}, 0 8px 18px -6px rgba(0,0,0,0.18)` } : undefined}>
                  <span className="crud-word" style={{ color: o.col }}>{o.word}</span>
                  <span className="crud-uz">{o.uz} {seen.has(o.id) && <span style={{ color: T.success }}>✓</span>}</span>
                </button>
              ))}
            </div>
          </Col>
          <Col>
            {cur
              ? <div className="sk-info fade-step" key={cur.id}><span className="sk-tagbig"><span className="sk-wordbadge" style={{ background: T.bg, color: cur.col }}>{cur.word}</span> <span className="mono small" style={{ color: T.ink2 }}>{cur.en} · {cur.uz}</span></span><div style={{ margin: '10px 0' }}><SqlCode mini q={cur.sql} /></div><p className="body" style={{ color: T.ink, margin: 0 }}>{cur.desc}</p></div>
              : <div className="frame-dash" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 130 }}><p className="small" style={{ color: T.ink3, fontStyle: 'italic', textAlign: 'center', margin: 0 }}>← Buyruqlardan birini bosing</p></div>}
            {done && <div className="takeaway fade-step"><div className="ta-bulb">🗄️</div><p className="ta-h">CRUD — bazaning 4 asosiy amali</p><p className="ta-sub">Create · Read · Update · Delete</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — AI BILAN #1 (vibecoding) =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const TASKS = [
    { id: 't1', talab: "100 000 so'mdan arzon mahsulotlarni ko'rsat", sql: 'SELECT * FROM products\nWHERE narx < 100000', filter: r => r.narx < 100000 },
    { id: 't2', talab: "soni 6 dan kam (tugayotgan) mahsulotlarni ko'rsat", sql: 'SELECT * FROM products\nWHERE soni < 6', filter: r => r.soni < 6 }
  ];
  const [task, setTask] = useState(null);
  const [ran, setRan] = useState(false);
  const done = ran;
  useEffect(() => { if (storedAnswer) { setTask(TASKS[0]); setRan(true); } }, []);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = TASKS.find(t => t.id === task);
  const rows = cur ? PRODUCTS.filter(cur.filter) : [];
  const choose = (t) => { setTask(t.id); setRan(false); };
  return (
    <Stage eyebrow="AI bilan · 1" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Vazifa tanlab, so'rovni bajaring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">SQL'ni yoddan bilish shartmi? <span className="italic" style={{ color: T.accent }}>Yo'q.</span></h2></div>
        <Mentor>Zamonaviy usul: siz <b style={{ color: T.ink }}>oddiy tilda</b> nima xohlashingizni aytasiz — AI SQL yozadi. Lekin muhimi: AI yozgan kodni <b style={{ color: T.accent }}>o'qib, tekshirib</b> ishlatasiz. Bir vazifani tanlang, AI'ning so'rovini ko'ring va bajaring.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">AI'ga vazifa bering (oddiy tilda)</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {TASKS.map(t => <button key={t.id} className={`pick-row ${task === t.id ? 'on' : ''}`} onClick={() => choose(t)}><span className="pick-box">{task === t.id ? '✓' : '?'}</span><span>"{t.talab}"</span></button>)}
            </div>
            {cur && <div className="ai-card fade-step" key={cur.id}>
              <div className="ai-row"><span className="ai-badge">AI</span><span className="ai-bubble">Mana shu SQL'ni taklif qilaman:</span></div>
              <div style={{ background: CODE.bg, borderRadius: 9, padding: '4px 6px' }}><SqlCode mini q={cur.sql} /></div>
              {!ran && <button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={() => setRan(true)}>✓ To'g'ri ekan — ishga tushir</button>}
            </div>}
          </Col>
          <Col>
            <p className="flow-label">Natija</p>
            {ran && cur
              ? <><DataTable key={cur.id} cols={PCOLS} rows={rows} /><SqlStatus>AI to'g'ri yozdi — <b>{rows.length} ta</b> mos mahsulot topildi. Siz tekshirdingiz va ishlatdingiz.</SqlStatus></>
              : <div className="frame-dash" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 110 }}><p className="small" style={{ color: T.ink3, fontStyle: 'italic', textAlign: 'center', margin: 0 }}>Vazifa tanlang → AI SQL yozadi → tekshirib bajaring</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — TEST 4 =====
const Screen12 = (props) => (
  <QuestionScreen {...props} idx={12} scope="module-mikro" eyebrow="Mashq · 4-savol"
    questionText="AI siz uchun SQL yozib bersa, eng to'g'ri yo'l qaysi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>AI sizga SQL so'rov yozib berdi. <span className="italic" style={{ color: T.accent }}>Endi nima qilasiz?</span></h2></>}
    options={["Ko'rmasdan darrov ishga tushiraman", "Kodni o'qib, to'g'riligini tekshirib, keyin ishlataman", "AI har doim to'g'ri yozadi — tekshirish shart emas", "O'chirib, hammasini qo'lda qaytadan yozaman"]} correctIdx={1}
    explainCorrect="To'g'ri! AI — kuchli yordamchi, lekin u ham adashadi. Siz arxitektorsiz: kodni o'qib, tekshirib, keyin ishlatasiz."
    explainWrong={{
      0: "Tekshirmasdan ishlatish xavfli — AI noto'g'ri jadval yoki WHERE yozsa, ma'lumot buziladi.",
      2: "AI ham xato qiladi (keyingi ekranda ko'rasiz). Tekshirish shart.",
      3: "Hammasini qo'lda yozish shart emas — AI vaqtni tejaydi. Faqat tekshiring.",
      default: "AI yozadi — siz tekshirasiz."
    }} />
);

// ===== SCREEN 13 — AGENT BILAN #2 (boshqa jadval) =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  // bosqichlar: idle -> sent (agent SQL yozdi) -> done (bajarildi)
  const [phase, setPhase] = useState(storedAnswer ? 'done' : 'idle');
  const done = phase === 'done';
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Agent bilan · 2" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Agentdan natijani oling"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Boshqa jadvalni ko'rmoqchimisiz? <span className="italic" style={{ color: T.accent }}>Shunchaki so'rang.</span></h2></div>
        <Mentor>Bazada faqat products emas — <span className="mono">users</span> (xaridorlar) jadvali ham bor. Uni ko'rish uchun SQL'ni eslab o'tirmaysiz: <b style={{ color: T.ink }}>agentga oddiy tilda aytasiz</b>, u SQL yozadi va bajaradi. Siz esa natijani tekshirasiz.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">Sizning so'rovingiz</p>
            <div className="ai-card">
              <div className="ai-row"><span className="ai-badge" style={{ background: T.ink }}>Siz</span><span className="ai-bubble" style={{ color: T.ink, fontWeight: 600 }}>"users jadvalidagi hamma foydalanuvchini ko'rsat"</span></div>
              {phase === 'idle' && <button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={() => setPhase('sent')}>↗ Agentga yuborish</button>}
              {phase !== 'idle' && <>
                <div className="ai-row"><span className="ai-badge">Agent</span><span className="ai-bubble">Tushundim. Mana SQL:</span></div>
                <div style={{ background: CODE.bg, borderRadius: 9, padding: '4px 6px' }}><SqlCode mini q={'SELECT * FROM users'} /></div>
                {phase === 'sent' && <button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={() => setPhase('done')}>✓ To'g'ri — bajar</button>}
              </>}
            </div>
          </Col>
          <Col>
            <p className="flow-label">Natija — users jadvali</p>
            {done
              ? <><DataTable cols={UCOLS} rows={USERS} /><SqlStatus>Agent boshqa jadvalni ham bir zumda ochib berdi. Siz nima xohlashni bildingiz — u SQL'ni yozdi.</SqlStatus></>
              : <div className="frame-dash" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 110 }}><p className="small" style={{ color: T.ink3, fontStyle: 'italic', textAlign: 'center', margin: 0 }}>So'rovni agentga yuboring → SQL → natija</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — DEBUGGING (AI xato yozdi) =====
const Screen14 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  // AI kodida xato: FROM product (to'g'risi products)
  const [found, setFound] = useState(!!storedAnswer);
  const [fixed, setFixed] = useState(!!storedAnswer);
  const [ran, setRan] = useState(!!storedAnswer);
  const done = ran;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const LINES = [
    { id: 'l1', txt: 'SELECT *', bug: false },
    { id: 'l2', txt: 'FROM product', bug: true },
    { id: 'l3', txt: 'WHERE narx < 100000', bug: false }
  ];
  return (
    <Stage eyebrow="Tekshiruv · xatoni top" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : (fixed ? "So'rovni ishga tushiring" : 'Xatoni toping va tuzating')} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">AI doim to'g'ri yozadimi? <span className="italic" style={{ color: T.accent }}>Keling, tekshiramiz.</span></h2></div>
        <Mentor>AI arzon mahsulotlarni so'radi, lekin so'rov <b style={{ color: T.accent }}>ishlamayapti</b> — baza "bunday jadval yo'q" deyapti. Jadval nomi <span className="mono">products</span> (ko'plik). Xato qatorni toping, tuzating va qaytadan ishga tushiring.</Mentor>
        <div className="split">
          <Col>
            <div className="ai-card fade-up delay-1">
              <div className="ai-row"><span className="ai-badge">AI</span><span className="ai-bubble">Mana so'rov:</span></div>
              <div className="ai-code">
                {LINES.map(l => {
                  if (l.bug && fixed) return <div key={l.id} className="ai-line ok" style={{ cursor: 'default' }}><span className="sql-kw">FROM</span> products</div>;
                  const isBugFound = found && l.bug;
                  return <div key={l.id} className={`ai-line ${isBugFound ? 'bad' : ''}`} onClick={() => { if (!found) setFound(l.bug); }}>{l.txt}</div>;
                })}
              </div>
              {!found && <p className="ai-prompt">Qaysi qatorda xato bor? Bosing.</p>}
              {found && !fixed && <button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={() => setFixed(true)}>🔧 product → products</button>}
              {fixed && !ran && <button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={() => setRan(true)}>▶ Qaytadan ishga tushir</button>}
            </div>
          </Col>
          <Col>
            <p className="flow-label">Natija</p>
            {!fixed
              ? <div className="code-box" style={{ minHeight: 80 }}><span style={{ color: T.accent }}>✕ XATO:</span> <span style={{ color: CODE.text }}>relation "product" does not exist</span></div>
              : !ran
                ? <div className="frame-dash" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 90 }}><p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>Tuzatildi — endi ishga tushiring</p></div>
                : <><DataTable cols={PCOLS} rows={PRODUCTS.filter(r => r.narx < 100000)} /><SqlStatus>Topdingiz va tuzatdingiz! Bitta harf (s) butun so'rovni ishlatdi. <b>AI yozadi — siz tekshirasiz.</b></SqlStatus></>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 15 — YAKUNIY: INSERT yozish + ▶ Run =====
const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [value, setValue] = useState(storedAnswer?.picked || '');
  const [passed, setPassed] = useState(!!storedAnswer?.correct);
  const [ran, setRan] = useState(false);
  const v = value.replace(/[‘’ʻ]/g, "'").replace(/[“”]/g, '"');
  const hasInsert = /insert\s+into\s+products/i.test(v);
  const hasValues = /values\s*\(/i.test(v);
  const m = v.match(/values\s*\(\s*'([^']+)'\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
  const hasThree = !!m;
  const valid = hasInsert && hasValues && hasThree;
  const newRow = m ? { id: 4, nom: m[1], narx: +m[2], soni: +m[3] } : null;
  const done = ran;
  useEffect(() => {
    if (valid && !passed) { setPassed(true); onAnswer(screen, { stage: 'final', screenIdx: screen, question: "products jadvaliga INSERT yozing", studentAnswer: value, correct: true, firstAttemptCorrect: true, solved: true, picked: value }); }
  }, [valid]);
  const navLabel = ran ? 'Davom etish' : (valid ? '▶ Run bosing' : 'INSERT qatorini yozing');
  return (
    <Stage eyebrow="Yakuniy · amaliy" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={navLabel} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bazaga <span className="italic" style={{ color: T.accent }}>o'z mahsulotingizni</span> qo'shing</h2></div>
        <Mentor>Mana SQL muharriri. 2-qatorga <b style={{ color: T.ink }}>INSERT</b> yozing — masalan: <span className="mono">INSERT INTO products (nom, narx, soni) VALUES ('Mishka', 50000, 10)</span>. Nomni qo'shtirnoq ichida, narx va sonini raqam bilan yozing. Yozib bo'lgach <b style={{ color: T.ink }}>▶ Run</b> bosing.</Mentor>
        <div className="split">
          <Col>
            <div className="vsc fade-up delay-1">
              <div className="vsc-bar"><span className="vsc-tab on"><span style={{ color: '#3FA0DB' }}>🐘</span> shop.sql <span style={{ color: '#6E7681', marginLeft: 4 }}>×</span></span></div>
              <div className="vsc-body">
                <div className="vsc-line"><span className="vsc-ln">1</span><span style={{ whiteSpace: 'pre', color: '#6A9955' }}>-- products jadvaliga yangi mahsulot qo'shing</span></div>
                <div className="vsc-line"><span className="vsc-ln">2</span><input className={`vsc-input ${valid ? 'ok' : ''}`} value={value} onChange={e => { setValue(e.target.value); setRan(false); }} placeholder="INSERT INTO products (nom, narx, soni) VALUES ('Mishka', 50000, 10)" spellCheck={false} autoCapitalize="off" autoCorrect="off" /></div>
              </div>
            </div>
            <div className="fade-up delay-2" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="tagpill" style={{ opacity: hasInsert ? 1 : 0.4 }}>{hasInsert ? '✓' : '1'} INSERT INTO products</span>
              <span className="tagpill" style={{ opacity: hasValues ? 1 : 0.4 }}>{hasValues ? '✓' : '2'} VALUES (...)</span>
              <span className="tagpill" style={{ opacity: hasThree ? 1 : 0.4 }}>{hasThree ? '✓' : '3'} 'nom', narx, soni</span>
            </div>
            {valid && !ran && <button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={() => setRan(true)}>▶ Run — so'rovni bajarish</button>}
          </Col>
          <Col>
            <p className="flow-label">Terminal</p>
            <div className="code-box" style={{ minHeight: 40 }}>{ran ? <TLine out={<span style={{ color: CODE.str }}>✓ INSERT 0 1 — 1 qator qo'shildi</span>} /> : <span style={{ color: CODE.comment, fontFamily: "'JetBrains Mono'", fontSize: 12 }}>Run bosilmagan…</span>}</div>
            <p className="flow-label" style={{ marginTop: 2 }}>products jadvali</p>
            {ran && newRow
              ? <DataTable cols={PCOLS} rows={[...PRODUCTS, newRow]} hiRow={PRODUCTS.length} />
              : <div className="frame-dash" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 80 }}><p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>{valid ? '▶ Run bosing — mahsulotingiz qo\'shiladi' : 'INSERT qatorini yozing…'}</p></div>}
            {ran && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>🎉 Tabriklaymiz! Siz bazaga <b>"{newRow ? newRow.nom : ''}"</b> ni qo'shdingiz. Endi siz ma'lumotlar bazasini boshqara olasiz!</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — YAKUN =====
const Screen16 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const RECAP = [
    "Ma'lumot bazada (PostgreSQL) jadvallarda saqlanadi",
    "Jadval = ustunlar (xususiyat) + qatorlar (yozuv)",
    "CRUD: INSERT · SELECT(+WHERE) · UPDATE · DELETE",
    "WHERE — shart; UPDATE/DELETE'da uni unutmang!",
    "AI/agent SQL yozadi — siz o'qib tekshirasiz"
  ];
  const HOMEWORK = [
    { b: "O'z jadvalingiz", t: "— AI bilan o'z do'koningiz uchun jadval loyihalang (qaysi ustunlar?)" },
    { b: "3 mahsulot qo'shing", t: "— INSERT bilan jadvalga 3 ta mahsulot kiriting" },
    { b: "Bitta so'rov", t: "— AI'dan 'arzon mahsulotlarni ko'rsat' degan SELECT'ni yozdiring va tekshiring" }
  ];
  const GLOSSARY = [
    { b: 'Baza', t: "— ma'lumot saqlanadigan joy (PostgreSQL)" },
    { b: 'Jadval', t: "— ustun + qator (products)" },
    { b: 'Qator', t: "— bitta yozuv (bitta mahsulot)" },
    { b: 'Ustun', t: "— xususiyat (nom, narx, soni)" },
    { b: 'INSERT', t: "— qator qo'shadi" },
    { b: 'SELECT', t: "— ma'lumotni ko'rsatadi" },
    { b: 'WHERE', t: "— shart (filtr)" },
    { b: 'UPDATE', t: "— qatorni o'zgartiradi" },
    { b: 'DELETE', t: "— qatorni o'chiradi" }
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
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">✓</span> Dars tugadi</span><h2 className="title h-title fade-up d1">Endi siz <span className="italic" style={{ color: T.accent }}>bazani boshqara</span> olasiz.</h2><p className="body h-sub fade-up d2">{PASSED ? "Tabriklaymiz! Jadval yaratish va CRUD (qo'shish, ko'rish, o'zgartirish, o'chirish) — hammasini, AI yordamida ham, eplaysiz." : "Yaxshi harakat! CRUD buyruqlarini mustahkamlash uchun bir-ikki ekranni qayta ko'ring."}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span className="tick" style={{ width: 16, height: 16, borderRadius: '50%', background: T.success, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck">✓</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>📝 Uyga vazifa</div><p className="body" style={{ margin: '0 0 10px', color: T.ink }}>AI bilan o'z bazangizni quring:</p><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">Modul 5'da: NestJS shu jadval bilan avtomatik ishlaydi — siz faqat so'raysiz! 🚀</p></div>
        </div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">💡 Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT — ({ lang, onFinished })
export default function PostgresCrudLesson({ lang: langProp, onFinished }) {
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
        .fade-up { animation: fade-in-up 0.4s ease-out forwards; opacity: 0; }
        .delay-1 { animation-delay: 0.12s; } .delay-2 { animation-delay: 0.24s; } .delay-3 { animation-delay: 0.36s; } .delay-4 { animation-delay: 0.48s; }
        @keyframes fade-step { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .fade-step { animation: fade-step 0.3s ease-out; }
        .d1 { animation-delay: 0.12s; } .d2 { animation-delay: 0.24s; } .d3 { animation-delay: 0.36s; } .d4 { animation-delay: 0.48s; }
        @keyframes el-pop { from { opacity: 0; transform: translateX(8px); } to { opacity: 1; transform: none; } }
        .el-in { animation: el-pop 0.3s ease-out; }
        @keyframes row-in { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
        .dtable .row-in { animation: row-in 0.32s ease-out; }

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
        .tagpill { font-family: 'JetBrains Mono', monospace; font-size: 12.5px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 99px; background: ${T.paper}; color: ${T.ink}; box-shadow: 0 3px 10px -5px rgba(${T.shadowBase},0.18); transition: opacity 0.2s; }

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
        @media (max-width: 760px) { .split { grid-template-columns: 1fr !important; gap: clamp(14px,3vw,20px); } }
        .flow-label { font-family: 'Manrope'; font-weight: 700; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: ${T.ink2}; }
        .demo-swap { animation: fade-step 0.3s ease-out; }

        /* === ROADMAP === */
        .roadmap { display: flex; flex-direction: column; gap: 8px; list-style: none; }
        .step-card { display: flex; align-items: center; gap: 14px; background: ${T.paper}; border-radius: 12px; padding: 13px 16px; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.14); }
        .step-num { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 13px; color: ${T.accent}; flex-shrink: 0; }
        .step-body { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .step-text { font-weight: 500; font-size: clamp(14px,1.7vw,16px); color: ${T.ink}; }
        .step-tag { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink2}; background: ${T.bg}; padding: 3px 8px; border-radius: 6px; }

        /* === SK-INFO === */
        .sk-info { background: ${T.paper}; border-radius: 12px; padding: 15px 17px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.16); animation: fade-step 0.3s; }
        .sk-tagbig { display: flex; align-items: center; gap: 9px; flex-wrap: wrap; }
        .sk-wordbadge { font-family: 'Manrope'; font-weight: 700; font-size: 13px; color: ${T.accent}; background: ${T.accentSoft}; padding: 4px 10px; border-radius: 6px; }
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

        /* === 4-MODUL: KOD/OYNA === */
        .bp-bar { background: #f0eee8; padding: 8px 11px; display: flex; align-items: center; gap: 9px; }
        .bb-dots { display: flex; gap: 5px; }
        .bb-dots i { width: 9px; height: 9px; border-radius: 50%; }
        .bb-dots i:first-child { background: #ff5f57; } .bb-dots i:nth-child(2) { background: #febc2e; } .bb-dots i:nth-child(3) { background: #28c840; }
        .bp-title { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink3}; transition: color 0.3s; }
        .bp-body { padding: clamp(12px,2.2vw,18px); }
        .code-box { background: ${CODE.bg}; color: ${CODE.text}; font-family: 'JetBrains Mono', monospace; font-size: clamp(12px,1.5vw,13.5px); line-height: 1.55; padding: clamp(12px,2.2vw,16px); border-radius: 12px; overflow-x: auto; white-space: pre-wrap; word-break: break-word; margin: 0; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.2); }

        /* === MA'LUMOT JADVALI === */
        .dtable-wrap { overflow-x: auto; border-radius: 12px; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.14); }
        .dtable { border-collapse: collapse; width: 100%; background: #fff; font-family: 'Manrope', sans-serif; font-size: clamp(11.5px,1.45vw,13px); }
        .dtable th { background: #F0EEE8; color: ${T.ink2}; font-weight: 700; text-align: left; padding: 8px 12px; font-family: 'JetBrains Mono'; font-size: 11.5px; white-space: nowrap; }
        .dtable td { padding: 8px 12px; border-top: 1px solid #EFECE5; color: ${T.ink}; white-space: nowrap; }
        .dtable th.click, .dtable tr.click { cursor: pointer; }
        .dtable th.hi, .dtable td.hi { background: ${T.accentSoft}; color: ${T.accent}; }
        .dtable tr.hi td { background: ${T.accentSoft}; color: ${T.accent}; }
        .dtable tr.click:hover td { background: #FBF6F2; }

        /* === TANLASH QATORI === */
        .pick-row { display: flex; align-items: center; gap: 11px; width: 100%; text-align: left; background: ${T.paper}; border: none; border-radius: 11px; padding: 11px 14px; cursor: pointer; transition: all 0.18s; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.14); color: ${T.ink}; }
        .pick-row:hover:not(:disabled) { box-shadow: 0 9px 20px -6px rgba(${T.shadowBase},0.2); }
        .pick-row:disabled { cursor: default; }
        .pick-row.on { background: ${T.successSoft}; box-shadow: 0 8px 18px -6px rgba(31,122,77,0.25), inset 0 0 0 1.5px ${T.success}; }
        .pick-box { width: 20px; height: 20px; border-radius: 6px; flex-shrink: 0; box-shadow: inset 0 0 0 2px ${T.ink3}; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; color: ${T.success}; font-weight: 800; }
        .pick-row.on .pick-box { box-shadow: inset 0 0 0 2px ${T.success}; background: #fff; }

        /* === 4-MODUL · 5-DARS: PostgreSQL CRUD === */
        .sql-box { background: ${CODE.bg}; color: ${CODE.text}; font-family: 'JetBrains Mono', monospace; font-size: clamp(12px,1.5vw,13.5px); line-height: 1.7; padding: 14px 16px; border-radius: 12px; margin: 0; overflow-x: auto; white-space: pre-wrap; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.2); }
        .sql-box.mini { font-size: clamp(11.5px,1.4vw,12.5px); padding: 10px 12px; box-shadow: none; }
        .sql-kw { color: ${CODE.tag}; font-weight: 700; }

        .srunner { display: flex; flex-direction: column; gap: 10px; }
        .srun-btn { align-self: flex-start; }
        .srun-done { font-family: 'JetBrains Mono'; font-size: 12px; font-weight: 700; color: ${T.success}; }
        .sql-status { background: ${T.successSoft}; border-left: 4px solid ${T.success}; border-radius: 12px; padding: 11px 14px; font-size: clamp(13px,1.5vw,14.5px); color: ${T.ink}; line-height: 1.5; }
        .sql-status.warn { background: ${T.accentSoft}; border-left-color: ${T.accent}; }
        .sql-status b { color: ${T.ink}; }

        .shopmock { display: flex; gap: 10px; flex-wrap: wrap; }
        .shop-card { flex: 1; min-width: 92px; background: #fff; border-radius: 11px; padding: 12px; box-shadow: 0 4px 14px -6px rgba(${T.shadowBase},0.18); display: flex; flex-direction: column; gap: 6px; align-items: flex-start; }
        .shop-name { font-family: 'Source Serif 4', serif; font-weight: 600; font-size: 14px; color: ${T.ink}; }
        .shop-narx { font-family: 'JetBrains Mono'; font-size: 12px; color: ${T.accent}; font-weight: 700; }
        .shop-buy { font-family: 'Manrope'; font-weight: 700; font-size: 11px; color: #fff; background: ${T.ink}; border: none; border-radius: 8px; padding: 5px 10px; cursor: default; }

        .crud-card { display: flex; flex-direction: column; gap: 4px; align-items: flex-start; text-align: left; background: ${T.paper}; border: none; border-radius: 12px; padding: 13px 15px; cursor: pointer; transition: all 0.18s; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.16); }
        .crud-card:hover { transform: translateY(-1px); }
        .crud-card.seen { background: #FBFAF7; }
        .crud-word { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 15px; }
        .crud-uz { font-family: 'Manrope'; font-weight: 600; font-size: 12.5px; color: ${T.ink2}; }

        /* === VS CODE MOCK (yakuniy) === */
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
