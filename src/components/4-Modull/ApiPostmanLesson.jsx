import React, { useState, useEffect, useRef, createContext, useContext, useCallback } from 'react';
import mentorImg from '../../assets/common/mentor.png';

// ============================================================
// BACKEND MODULI (4-MODUL) · 6-DARS — API va POSTMAN — PLATFORM STANDARD v16 (AUDIOSIZ)
// Mavzu: API nima (ikki dastur o'zaro gaplashadigan vosita) · so'rov (request) va javob (response) ·
//        HTTP method'lar GET/POST/PUT/DELETE = front backend bilan qanday gaplashadi ·
//        Postman = "postachi" — frontend yozmasdan API'ni sinab ko'radigan asbob · o'z API'ingni Postman'da chaqirish.
// ANALOGIYA (user): POCHTA — API=pochta tizimi; so'rov=xat (konvert: manzil URL + niyat METHOD + ichi BODY);
//        javob=qaytgan xat (shtamp=status kodi 200/201/404 + ichi=JSON ma'lumot); Postman=POSTACHI (xatni eltadi, javobni keltiradi).
// KO'PRIK: id31 (routing, METHOD+PATH, Nest) + id32 (bazada CRUD: SQL) — endi o'sha 4 amalni INTERNET orqali API bilan so'raymiz:
//        GET=SELECT(o'qish) · POST=INSERT(qo'shish) · PUT=UPDATE(o'zgartirish) · DELETE=DELETE(o'chirish).
// Misol: onlayn do'kon `/api/products` (id32 dagi aynan products jadvali, endi API orqali).
// QAROR (user): final = Postman so'rov-quruvchi (method+URL tanlab → Send → to'g'ri status).
// AUDIOSIZ: ovoz (TTS) yo'q. Har ekran global savol bilan ochiladi. Markaziy widget: Postman mock + konvert-sayohat animatsiyasi.
// PRODUCTION: <style> ichidagi @import OLIB TASHLANADI — shriftlarni LMS yuklaydi.
// ============================================================

const T = {
  bg: '#F6F4EF', ink: '#0E0E10', ink2: '#5A5A60', ink3: '#A7A6A2',
  paper: '#FFFFFF', accent: '#FF4F28', accentSoft: '#FFE8E1', accentVivid: '#FF4F28',
  success: '#1F7A4D', successSoft: '#E3F0E8', blue: '#019ACB', blueSoft: '#E2F4FA', link: '#1a56db',
  shadowBase: '58, 53, 48'
};
const CODE = { bg: '#1A2436', text: '#E8E5DD', tag: '#FF7755', attr: '#FFD380', str: '#7DD181', comment: '#6B7585', punct: '#9FB4D8' };
// HTTP method ranglari (niyat → rang) — Postman uslubi
const METHODS = { GET: T.success, POST: T.accent, PUT: T.blue, DELETE: '#C2410C' };
// status kodi → [matn, rang]
const STAT = { 200: ['200 OK', T.success], 201: ['201 Created', T.success], 404: ['404 Not Found', '#C2410C'], 400: ['400 Bad Request', T.accent] };

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

const LESSON_META = { lessonId: 'api-postman-04-06-v16', lessonTitle: { uz: 'API va Postman — front backend bilan qanday gaplashadi', ru: 'API и Postman — как фронт говорит с бэком' } };
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
        <img src={mentorImg} alt="" />
      </div>
      <div className="mentor-col">
        <span className="mentor-name">Mentor{collapsed && <span className="mentor-cue"> · ko'rsatmani ochish ▾</span>}</span>
        <div className="mentor-msg body">{children}</div>
      </div>
    </div>
  );
};

const Win = ({ title, children, minH, hotTitle }) => (
  <div className="bp-window"><div className="bp-bar"><span className="bb-dots"><i /><i /><i /></span><span className="bp-title" style={hotTitle ? { color: T.accent, fontWeight: 700 } : undefined}>{title}</span></div><div className="bp-body" style={{ minHeight: minH, position: 'relative' }}>{children}</div></div>
);

// ============================================================
// 4-MODUL · 6-DARS YORDAMCHILAR — API / Postman
// ============================================================
// onlayn do'kon ma'lumoti (id32 davomi) — endi /api/products orqali
const PRODUCTS = [
  { id: 1, nom: 'Klaviatura', narx: 120000, soni: 8 },
  { id: 2, nom: 'Sichqoncha', narx: 75000,  soni: 15 },
  { id: 3, nom: 'Quloqchin',  narx: 95000,  soni: 5 }
];
const NEW_PRODUCT = { id: 4, nom: 'Mikrofon', narx: 60000, soni: 12 };
const fmtNarx = (n) => Number(n).toLocaleString('ru-RU');

const MethodBadge = ({ method, big }) => (
  <span className="mbadge" style={{ color: METHODS[method] || T.ink2, background: (METHODS[method] || T.ink2) + '22', fontSize: big ? 12 : 10.5, padding: big ? '3px 10px' : '2px 7px' }}>{method}</span>
);
const StatusBadge = ({ code }) => { const s = STAT[code] || ['', T.ink2]; return <span className="status-badge" style={{ color: s[1], background: s[1] + '1e' }}>{s[0]}</span>; };

// JSON ko'rinishi (API javobi) — kalit/qiymat ranglanadi
const JsonBox = ({ data, sm }) => {
  const txt = JSON.stringify(data, null, 2);
  return (
    <pre className={`json-box ${sm ? 'sm' : ''}`}>{txt.split('\n').map((ln, i) => {
      const m = ln.match(/^(\s*)"([^"]+)":\s?(.*)$/);
      if (m) { const v = m[3]; const isStr = v.startsWith('"'); return <div key={i}>{m[1]}<span className="j-key">"{m[2]}"</span>: <span className={isStr ? 'j-str' : 'j-num'}>{v}</span></div>; }
      return <div key={i}>{ln}</div>;
    })}</pre>
  );
};

// ===== POSTMAN MOCK — bu darsning markaziy widgeti (so'rov yuborib, javobni ko'rish) =====
const Postman = ({ method, url, body, methodPicker, onMethod, onSend, sending, sent, status, children, sendDisabled, sendLabel = 'Send' }) => (
  <div className="postman fade-up">
    <div className="pm-bar">
      {methodPicker
        ? <div className="pm-methods">{['GET', 'POST', 'PUT', 'DELETE'].map(m => (
            <button key={m} className="pm-mbtn" onClick={() => onMethod && onMethod(m)} style={method === m ? { color: '#fff', background: METHODS[m] } : { color: METHODS[m], background: METHODS[m] + '18' }}>{m}</button>
          ))}</div>
        : <span className="pm-method" style={{ color: METHODS[method] }}>{method}</span>}
      <span className="pm-url mono">{url}</span>
      <button className="pm-send" disabled={sendDisabled || sending} onClick={onSend}>{sending ? '…' : sendLabel}</button>
    </div>
    {body && <div className="pm-body"><span className="pm-bodylbl">Body (JSON)</span><JsonBox sm data={body} /></div>}
    <div className="pm-resp">
      <div className="pm-resp-h"><span className="pm-resp-lbl">Javob (Response)</span>{sent && status ? <StatusBadge code={status} /> : null}</div>
      {sending ? <div className="pm-loading">📨 Yuborilmoqda…</div>
        : sent ? <div className="pm-respbody fade-step">{children}</div>
        : <div className="pm-empty">▸ Send bosing — server javobi shu yerda chiqadi</div>}
    </div>
  </div>
);

// ===== SCREEN 0 — HOOK (sayt ma'lumotni qayerdan oladi?) =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [phase, setPhase] = useState(storedAnswer ? 'done' : 'idle'); // idle | flying | done
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const tried = phase === 'done';
  const fly = () => { if (phase !== 'idle') return; setPhase('flying'); setTimeout(() => setPhase('done'), 1100); };
  const OPTS = [
    { id: 'a', label: "Ma'lumot saytning kodi ichida yozib qo'yilgan" },
    { id: 'b', label: "Sayt serverga so'rov (API) yuboradi va javob oladi" },
    { id: 'c', label: "Sayt bazaga to'g'ridan-to'g'ri o'zi kiradi" }
  ];
  const correct = 'b';
  const pick = (v) => { if (picked !== null || !tried) return; setPicked(v); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: v === correct }); };
  return (
    <Stage eyebrow="Kirish" screen={screen} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 860 }}>Ilovani ochasiz — yangi ma'lumot <span className="italic" style={{ color: T.accent }}>qayerdan</span> keladi?</h1>
        <Mentor>O'tgan darslarda server qurdik va bazada CRUD qildik. Lekin sayt (frontend) bazani <b style={{ color: T.ink }}>ko'rmaydi</b> — u serverga <b style={{ color: T.accent }}>xat (so'rov)</b> yuboradi, server javob qaytaradi. Tugmani bosing — konvert qanday uchishini ko'ring.</Mentor>
        <Zoomable>
        <Split>
          <Col>
            <Win title="zakaz-shop.uz — ilova" minH={150}>
              <div className="shopmock">
                {(phase === 'done' ? [...PRODUCTS, NEW_PRODUCT] : PRODUCTS).map(p => (
                  <div key={p.id} className="shop-card"><div className="shop-name">{p.nom}</div><div className="shop-narx">{fmtNarx(p.narx)} so'm</div></div>
                ))}
              </div>
            </Win>
            <div className="flyrow">
              <span className="flynode">Sayt</span>
              <span className="flytrack"><span className={`flyenv ${phase}`}>{phase === 'done' ? '📩' : '📨'}</span></span>
              <span className="flynode">Server</span>
            </div>
            {phase === 'idle' && <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={fly}>📨 Serverdan ma'lumot so'rash</button>}
            {phase === 'flying' && <p className="mono small" style={{ color: T.accent, margin: 0 }}>Konvert serverga uchmoqda…</p>}
            {phase === 'done' && <p className="mono small" style={{ color: T.success, margin: 0 }}>✓ Javob keldi — yangi mahsulot "Mikrofon" qo'shildi!</p>}
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Sizningcha sayt ma'lumotni qanday oladi?</p>
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
            {!tried && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>Avval konvertni uchirib ko'ring ←</p>}
            {picked !== null && <p className="hook-ack fade-step">{picked === correct ? <>To'g'ri! Sayt serverga <b>so'rov (API)</b> yuboradi, server javob qaytaradi. Bugun shu suhbatni o'rganamiz.</> : <>Aslida sayt serverga <b>so'rov (API)</b> yuboradi va javob oladi — bazaga o'zi kira olmaydi. Mana shu suhbatni bugun o'rganamiz.</>}</p>}
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
    { text: "API nima — ikki dastur tili", tag: 'pochta' },
    { text: "So'rov va javob (konvert)", tag: 'request · response' },
    { text: "4 method — GET/POST/PUT/DELETE", tag: 'CRUD' },
    { text: "Postman — postachi asbob", tag: 'sinab ko\'rish' },
    { text: "O'z API'ingni chaqirasiz", tag: '/api/products' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const PreviewBlock = (
    <Col>
      <p className="flow-label">Dars oxirida — siz Postman'da so'rov yuborasiz</p>
      <Win title="Postman" minH={150}>
        <Postman method="GET" url="/api/products" sent status={200}><JsonBox sm data={PRODUCTS.slice(0, 2)} /></Postman>
      </Win>
      <p className="mono small" style={{ color: T.accent, margin: 0 }}>→ method tanlaysiz, Send bosasiz, javobni ko'rasiz</p>
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
        <div className="head"><h2 className="title h-title fade-up">Front backend bilan <span className="italic" style={{ color: T.accent }}>qanday gaplashadi?</span></h2></div>
        <Mentor>Va'da: dars oxirida siz <b style={{ color: T.ink }}>Postman</b> degan asbob bilan o'z serveringizga so'rov yuborib, javobini ko'ra olasiz — frontend yozmasdan. Bularning bari bitta narsa ustida quriladi: <b style={{ color: T.ink }}>API</b>.</Mentor>
        {!isNarrow ? (
          <Zoomable><Split>{PreviewBlock}{StepsBlock}</Split></Zoomable>
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

// ===== SCREEN 2 — API NIMA (pochta) =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const PARTS = [
    { k: 'sayt', label: 'Sayt (Frontend)', desc: "Foydalanuvchi ko'radigan tomon. U ma'lumotni o'zi saqlamaydi — serverdan so'raydi." },
    { k: 'api', label: 'API (Pochta)', desc: "Ikki dastur o'rtasidagi til va qoidalar. Sayt API orqali so'rov yuboradi — to'g'ridan-to'g'ri bazaga kira olmaydi. Pochta kabi: xat aniq manzil va qoida bilan boradi." },
    { k: 'server', label: 'Server + Baza', desc: "So'rovni qabul qiladi, bazada ish bajaradi (CRUD) va javob qaytaradi." }
  ];
  const [seen, setSeen] = useState(storedAnswer ? new Set(['sayt', 'api', 'server']) : new Set());
  const [active, setActive] = useState(storedAnswer ? 'api' : null);
  const done = seen.size >= 3;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const tap = (k) => { setActive(k); setSeen(s => new Set(s).add(k)); };
  const cur = PARTS.find(p => p.k === active);
  return (
    <Stage eyebrow="API nima" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/3 qismni ko'ring`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Sayt bazaga <span className="italic" style={{ color: T.accent }}>o'zi kira oladimi?</span></h2></div>
        <Mentor>Yo'q. Sayt va server — ikki alohida dastur. Ular o'rtasida <b style={{ color: T.accent }}>API</b> turadi: bu <b style={{ color: T.ink }}>til va qoidalar</b> to'plami. Xuddi pochta kabi — xatni to'g'ri manzilga, qoida bilan yetkazadi. Uchta qismni bosib ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="apiflow">
              {PARTS.map((p, i) => (
                <React.Fragment key={p.k}>
                  <button className={`apinode ${active === p.k ? 'on' : ''} ${seen.has(p.k) ? 'seen' : ''}`} onClick={() => tap(p.k)}>{p.label} {seen.has(p.k) ? '✓' : ''}</button>
                  {i < PARTS.length - 1 && <span className="apiarrow">⇄</span>}
                </React.Fragment>
              ))}
            </div>
            {cur && <div className="sk-info fade-step" key={cur.k}><span className="sk-tagbig"><span className="sk-wordbadge">{cur.label}</span></span><p className="body" style={{ color: T.ink, margin: '9px 0 0' }}>{cur.desc}</p></div>}
          </Col>
          <Col>
            {done
              ? <div className="takeaway fade-step"><div className="ta-bulb">📮</div><p className="ta-h">API = ikki dastur gaplashadigan til</p><p className="ta-sub">Sayt → API → Server. To'g'ridan-to'g'ri emas — qoida bilan.</p></div>
              : <div className="frame-dash" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 130 }}><p className="small" style={{ color: T.ink3, fontStyle: 'italic', textAlign: 'center', margin: 0 }}>← Qismlarni bosib o'rganing</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — SO'ROV va JAVOB (konvert) =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const PARTS = {
    method: "METHOD — niyat: nima qilmoqchisiz? (olish, qo'shish, o'chirish...). Konvertdagi 'xizmat turi'.",
    url: "URL — manzil: qaysi ma'lumot? Masalan /api/products. Konvertdagi 'manzil'.",
    body: "BODY — ichidagi ma'lumot (faqat qo'shish/o'zgartirishda). Konvert ichidagi 'xat matni'.",
    status: "STATUS — javob shtampi: ish o'tdimi? 200=OK, 201=yaratildi, 404=topilmadi.",
    data: "DATA — javobning ichi: server qaytargan ma'lumot (JSON)."
  };
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(storedAnswer ? new Set(Object.keys(PARTS)) : new Set());
  const done = seen.size >= 3;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const tap = (k) => { setActive(k); setSeen(s => new Set(s).add(k)); };
  return (
    <Stage eyebrow="So'rov va javob" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/3 qismni ko'ring`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Har bir suhbat — <span className="italic" style={{ color: T.accent }}>ikki konvert</span></h2></div>
        <Mentor>Siz <b style={{ color: T.accent }}>so'rov</b> (request) yuborasiz, server <b style={{ color: T.success }}>javob</b> (response) qaytaradi. So'rov = METHOD + URL (+ ba'zan BODY). Javob = STATUS + DATA. Qismlarni bosib, har birining vazifasini ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label" style={{ color: T.accent }}>So'rov konverti (siz → server)</p>
            <div className="envcard req">
              <button className={`envpart ${active === 'method' ? 'on' : ''}`} onClick={() => tap('method')}><MethodBadge method="GET" big /> <span className="ep-lbl">METHOD</span></button>
              <button className={`envpart ${active === 'url' ? 'on' : ''}`} onClick={() => tap('url')}><span className="mono">/api/products</span> <span className="ep-lbl">URL</span></button>
              <button className={`envpart ${active === 'body' ? 'on' : ''}`} onClick={() => tap('body')}><span className="mono" style={{ color: T.ink3 }}>{'{ ... }'}</span> <span className="ep-lbl">BODY</span></button>
            </div>
            <p className="flow-label" style={{ color: T.success }}>Javob konverti (server → siz)</p>
            <div className="envcard res">
              <button className={`envpart ${active === 'status' ? 'on' : ''}`} onClick={() => tap('status')}><StatusBadge code={200} /> <span className="ep-lbl">STATUS</span></button>
              <button className={`envpart ${active === 'data' ? 'on' : ''}`} onClick={() => tap('data')}><span className="mono" style={{ color: T.success }}>[ ... ]</span> <span className="ep-lbl">DATA</span></button>
            </div>
          </Col>
          <Col>
            {active
              ? <div className="sk-info fade-step" key={active}><p className="body" style={{ color: T.ink, margin: 0 }}>{PARTS[active]}</p></div>
              : <div className="frame-dash" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 130 }}><p className="small" style={{ color: T.ink3, fontStyle: 'italic', textAlign: 'center', margin: 0 }}>← Konvert qismlarini bosing</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>So'rov = nima + qayerdan. Javob = o'tdimi + natija. Endi METHOD'larni ko'ramiz.</p></div>}
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
    questionText="API nima vazifani bajaradi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Sayt va server o'rtasida turadigan <span className="italic" style={{ color: T.accent }}>API</span> nima qiladi?</h2></>}
    options={["Saytni chiroyli bezaydi", "Ikki dastur (sayt va server) o'zaro gaplashadigan til/qoidalar", "Faqat rasm saqlaydi", "Internetni tezlashtiradi"]} correctIdx={1}
    explainCorrect="To'g'ri! API — bu sayt va server bir-biri bilan gaplashadigan til va qoidalar. Sayt API orqali so'rov yuboradi, javob oladi."
    explainWrong={{
      0: "Bezash — CSS ishi. API ma'lumot almashinuvi uchun.",
      2: "API faqat rasm emas — har qanday ma'lumotni so'rov-javob orqali uzatadi.",
      3: "API tezlik vositasi emas — u sayt va server o'rtasidagi til.",
      default: "API = dasturlar gaplashadigan til/qoidalar."
    }} />
);

// ===== SCREEN 5 — POSTMAN tanishtirish + GET =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(!!storedAnswer);
  const done = sent;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const send = () => { if (sent) return; setSending(true); setTimeout(() => { setSending(false); setSent(true); }, 850); };
  return (
    <Stage eyebrow="Postman + GET" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Send bosing"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Frontend yozmasdan API'ni <span className="italic" style={{ color: T.accent }}>qanday sinaymiz?</span></h2></div>
        <Mentor><b style={{ color: T.ink }}>Postman</b> — bu "postachi" asbob: siz so'rovni yozasiz, u serverga eltadi va javobni keltiradi. Birinchi so'rov — <b style={{ color: METHODS.GET }}>GET /api/products</b>: "menga mahsulotlar ro'yxatini ber". Bu bazadagi <span className="mono">SELECT</span> bilan bir xil. Send'ni bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <Postman method="GET" url="/api/products" sending={sending} sent={sent} status={200} onSend={send} sendLabel="Send">
              <JsonBox data={PRODUCTS} />
            </Postman>
          </Col>
          <Col>
            <div className="maprow"><MethodBadge method="GET" big /><span className="maparrow">=</span><span className="mono" style={{ color: T.ink }}>SELECT (o'qish)</span></div>
            {sent
              ? <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Server <b>200 OK</b> shtampi bilan 3 ta mahsulotni JSON qilib qaytardi. GET — ma'lumotni faqat <b>o'qiydi</b>, hech narsani o'zgartirmaydi.</p></div>
              : <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>GET = "ma'lumotni so'rab ol". Eng ko'p ishlatiladigan method. Postman'da Send bosib, javobni ko'ring.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 5b — TEST 2 =====
const Screen5b = (props) => (
  <QuestionScreen {...props} idx={6} scope="module-mikro" eyebrow="Mashq · 2-savol"
    questionText="GET method nima qiladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}><span className="italic" style={{ color: METHODS.GET }}>GET</span> so'rovi serverdan nimani so'raydi?</h2></>}
    options={["Yangi ma'lumot qo'shadi", "Ma'lumotni o'qib (olib) keladi", "Ma'lumotni o'chiradi", "Serverni o'chiradi"]} correctIdx={1}
    explainCorrect="To'g'ri! GET — ma'lumotni o'qish uchun. Bazadagi SELECT bilan bir xil: faqat oladi, o'zgartirmaydi."
    explainWrong={{
      0: "Qo'shish — POST. GET faqat o'qiydi.",
      2: "O'chirish — DELETE. GET hech narsani o'chirmaydi.",
      3: "GET serverni o'chirmaydi — u shunchaki ma'lumot so'raydi.",
      default: "GET = o'qish (olish)."
    }} />
);

// ===== SCREEN 6 — POST (qo'shish) =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(!!storedAnswer);
  const done = sent;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const send = () => { if (sent) return; setSending(true); setTimeout(() => { setSending(false); setSent(true); }, 850); };
  const body = { nom: 'Mikrofon', narx: 60000, soni: 12 };
  return (
    <Stage eyebrow="POST · qo'shish" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Send bosing"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bazaga yangi mahsulot <span className="italic" style={{ color: T.accent }}>qanday qo'shamiz?</span></h2></div>
        <Mentor><b style={{ color: METHODS.POST }}>POST</b> = "mana yangi narsa, qo'shib qo'y". So'rov ichida (BODY) yangi mahsulot ma'lumoti ketadi. Server uni bazaga yozadi va <b style={{ color: T.success }}>201 Created</b> qaytaradi. Bu <span className="mono">INSERT</span> bilan bir xil.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <Postman method="POST" url="/api/products" body={body} sending={sending} sent={sent} status={201} onSend={send} sendLabel="Send">
              <JsonBox data={{ id: 4, ...body }} />
            </Postman>
          </Col>
          <Col>
            <div className="maprow"><MethodBadge method="POST" big /><span className="maparrow">=</span><span className="mono" style={{ color: T.ink }}>INSERT (qo'shish)</span></div>
            {sent
              ? <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Server <b>201 Created</b> qaytardi va yangi mahsulotni <b>id: 4</b> bilan saqladi. POST — yangi ma'lumot <b>qo'shadi</b>.</p></div>
              : <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Diqqat: POST'da <b>BODY</b> bor — qo'shiladigan ma'lumot. GET'da body yo'q edi.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — PUT (o'zgartirish) =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(!!storedAnswer);
  const done = sent;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const send = () => { if (sent) return; setSending(true); setTimeout(() => { setSending(false); setSent(true); }, 850); };
  const body = { narx: 99000 };
  return (
    <Stage eyebrow="PUT · o'zgartirish" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Send bosing"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Mahsulot narxini <span className="italic" style={{ color: T.accent }}>qanday yangilaymiz?</span></h2></div>
        <Mentor><b style={{ color: METHODS.PUT }}>PUT</b> = "buni yangilab qo'y". URL'da <b style={{ color: T.ink }}>qaysi</b> mahsulot (/api/products/<b>1</b>), BODY'da yangi qiymat. Server <b style={{ color: T.success }}>200 OK</b> qaytaradi. Bu <span className="mono">UPDATE</span> bilan bir xil.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <Postman method="PUT" url="/api/products/1" body={body} sending={sending} sent={sent} status={200} onSend={send} sendLabel="Send">
              <JsonBox data={{ id: 1, nom: 'Klaviatura', narx: 99000, soni: 8 }} />
            </Postman>
          </Col>
          <Col>
            <div className="maprow"><MethodBadge method="PUT" big /><span className="maparrow">=</span><span className="mono" style={{ color: T.ink }}>UPDATE (o'zgartirish)</span></div>
            {sent
              ? <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Klaviatura narxi 120 000 → <b>99 000</b> bo'ldi. URL'dagi <b>/1</b> serverga qaysi qatorni o'zgartirishni aytdi (bazadagi WHERE id=1 kabi).</p></div>
              : <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>URL oxiridagi <b>/1</b> — bu mahsulotning id'si. PUT'da u shart: aks holda qaysisini yangilashni server bilmaydi.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — DELETE (o'chirish) =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(!!storedAnswer);
  const done = sent;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const send = () => { if (sent) return; setSending(true); setTimeout(() => { setSending(false); setSent(true); }, 850); };
  return (
    <Stage eyebrow="DELETE · o'chirish" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Send bosing"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Mahsulot sotuvdan chiqdi — <span className="italic" style={{ color: T.accent }}>qanday o'chiramiz?</span></h2></div>
        <Mentor><b style={{ color: METHODS.DELETE }}>DELETE</b> = "buni o'chir". URL'da o'chiriladigan mahsulot id'si (/api/products/<b>3</b>). BODY kerak emas. Server <b style={{ color: T.success }}>200 OK</b> qaytaradi. Bu <span className="mono">DELETE FROM</span> bilan bir xil.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <Postman method="DELETE" url="/api/products/3" sending={sending} sent={sent} status={200} onSend={send} sendLabel="Send">
              <JsonBox data={{ ochirildi: true, id: 3 }} />
            </Postman>
          </Col>
          <Col>
            <div className="maprow"><MethodBadge method="DELETE" big /><span className="maparrow">=</span><span className="mono" style={{ color: T.ink }}>DELETE (o'chirish)</span></div>
            {sent
              ? <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>3-mahsulot (Quloqchin) o'chirildi. DELETE'da ham URL'dagi id juda muhim — aks holda noto'g'ri narsa o'chib ketishi mumkin.</p></div>
              : <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>DELETE — eng "xavfli" method. Shuning uchun id aniq bo'lishi shart.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 9 — TEST 3 =====
const Screen9 = (props) => (
  <QuestionScreen {...props} idx={9} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="Bazaga yangi mahsulot qo'shish uchun qaysi method?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Do'konga yangi mahsulot qo'shmoqchisiz. <span className="italic" style={{ color: T.accent }}>Qaysi method?</span></h2></>}
    options={["GET — ma'lumotni oladi", "POST — yangi ma'lumot qo'shadi", "DELETE — o'chiradi", "PUT — mavjudini o'zgartiradi"]} correctIdx={1}
    explainCorrect="To'g'ri! POST yangi resurs (mahsulot) yaratadi — BODY'da uning ma'lumoti ketadi. Server 201 Created qaytaradi."
    explainWrong={{
      0: "GET faqat o'qiydi — qo'shmaydi.",
      2: "DELETE o'chiradi.",
      3: "PUT mavjud mahsulotni o'zgartiradi, yangi qo'shmaydi.",
      default: "Yangi qo'shish — POST."
    }} />
);

// ===== SCREEN 10 — METHOD ↔ CRUD ↔ SQL XARITASI =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const MAP = [
    { m: 'GET',    crud: 'Read',   sql: 'SELECT * FROM products',          ex: 'GET /api/products',     desc: "Ro'yxatni o'qib oladi." },
    { m: 'POST',   crud: 'Create', sql: 'INSERT INTO products ...',        ex: 'POST /api/products',    desc: "Yangi qator qo'shadi (BODY bilan)." },
    { m: 'PUT',    crud: 'Update', sql: 'UPDATE products SET ... WHERE id', ex: 'PUT /api/products/1',   desc: "Mavjud qatorni o'zgartiradi." },
    { m: 'DELETE', crud: 'Delete', sql: 'DELETE FROM products WHERE id',    ex: 'DELETE /api/products/3', desc: "Qatorni o'chiradi." }
  ];
  const [seen, setSeen] = useState(storedAnswer ? new Set(MAP.map(x => x.m)) : new Set());
  const [active, setActive] = useState(storedAnswer ? 'GET' : null);
  const done = seen.size >= 4;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const tap = (m) => { setActive(m); setSeen(s => new Set(s).add(m)); };
  const cur = MAP.find(x => x.m === active);
  return (
    <Stage eyebrow="Method ↔ CRUD ↔ SQL" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/4 method ko'ring`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">To'rt method — <span className="italic" style={{ color: T.accent }}>o'sha CRUD, endi internetda</span></h2></div>
        <Mentor>Eng muhim ko'prik: API method'lari bevosita o'tgan darsdagi <b style={{ color: T.ink }}>CRUD</b>ga mos. Postman'da bir tugma bosasiz → server kodi ishlaydi → bazada SQL bajariladi. Har method'ni bosib, ortidagi SQL'ni ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
              {MAP.map(x => (
                <button key={x.m} className={`crud-card ${active === x.m ? 'on' : ''} ${seen.has(x.m) ? 'seen' : ''}`} onClick={() => tap(x.m)} style={active === x.m ? { boxShadow: `0 0 0 2px ${METHODS[x.m]}, 0 8px 18px -6px rgba(0,0,0,0.18)` } : undefined}>
                  <span className="crud-word" style={{ color: METHODS[x.m] }}>{x.m}</span>
                  <span className="crud-uz">{x.crud} {seen.has(x.m) && <span style={{ color: T.success }}>✓</span>}</span>
                </button>
              ))}
            </div>
          </Col>
          <Col>
            {cur
              ? <div className="sk-info fade-step" key={cur.m}>
                  <div className="maprow" style={{ marginBottom: 8 }}><MethodBadge method={cur.m} big /><span className="maparrow">→</span><span className="mono small" style={{ color: T.ink2 }}>{cur.crud}</span></div>
                  <p className="mono small" style={{ color: T.ink, margin: '0 0 6px' }}>{cur.ex}</p>
                  <p className="small" style={{ color: T.ink2, margin: '0 0 8px' }}>Server ortida: <span className="mono" style={{ color: T.accent }}>{cur.sql}</span></p>
                  <p className="body" style={{ color: T.ink, margin: 0 }}>{cur.desc}</p>
                </div>
              : <div className="frame-dash" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 130 }}><p className="small" style={{ color: T.ink3, fontStyle: 'italic', textAlign: 'center', margin: 0 }}>← Method'lardan birini bosing</p></div>}
            {done && <div className="takeaway fade-step"><div className="ta-bulb">🔗</div><p className="ta-h">API method = baza amali</p><p className="ta-sub">GET·POST·PUT·DELETE → SELECT·INSERT·UPDATE·DELETE</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — TO'LIQ SAYOHAT (konvert animatsiyasi) =====
const JNODES = [
  { k: 'sayt', label: 'Sayt' },
  { k: 'api', label: 'API' },
  { k: 'server', label: 'Nest server' },
  { k: 'baza', label: 'Baza' }
];
const JSEQ = [
  { idx: 0, dir: 'req', note: 'Sayt so\'rov yaratadi: GET /api/products' },
  { idx: 1, dir: 'req', note: 'API so\'rovni qabul qiladi (pochta)' },
  { idx: 2, dir: 'req', note: 'Nest server kerakli kodni topadi (routing)' },
  { idx: 3, dir: 'req', note: 'Baza SELECT bajaradi — ma\'lumotni topadi' },
  { idx: 2, dir: 'res', note: 'Server javobni JSON qiladi' },
  { idx: 1, dir: 'res', note: 'API javobni ortga uzatadi' },
  { idx: 0, dir: 'res', note: 'Sayt ma\'lumotni ekranda ko\'rsatadi · 200 OK' }
];
const NODEPCT = [3, 35, 65, 92];
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [step, setStep] = useState(storedAnswer ? JSEQ.length - 1 : -1);
  const [playing, setPlaying] = useState(false);
  const timer = useRef(null);
  const done = step >= JSEQ.length - 1;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);
  const play = () => {
    if (playing) return;
    setPlaying(true); setStep(0);
    let s = 0;
    timer.current = setInterval(() => {
      s += 1;
      if (s >= JSEQ.length) { clearInterval(timer.current); setPlaying(false); return; }
      setStep(s);
    }, 950);
  };
  const cur = step >= 0 ? JSEQ[step] : null;
  const envLeft = cur ? NODEPCT[cur.idx] : NODEPCT[0];
  const envColor = cur ? (cur.dir === 'req' ? T.accent : T.success) : T.ink3;
  return (
    <Stage eyebrow="To'liq sayohat" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Sayohatni ko'ring (▶)"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(12px,2vw,18px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Send bosganda konvert <span className="italic" style={{ color: T.accent }}>shu yo'lni</span> bosib o'tadi</h2></div>
        <Mentor>Postman (yoki sayt) Send bosganda so'rov konverti: Sayt → API → Nest server → Baza, keyin javob xuddi shu yo'l bilan ortga qaytadi. <b style={{ color: T.accent }}>▶ tugmasini</b> bosib, butun sayohatni kuzating.</Mentor>
        <div className="jflow">
          {JNODES.map((n, i) => (
            <div key={n.k} className={`jnode ${cur && cur.idx === i ? 'on' : ''}`} style={cur && cur.idx === i ? { boxShadow: `0 0 0 2px ${envColor}` } : undefined}>
              <span className="jnode-ic">{n.k === 'sayt' ? '🖥️' : n.k === 'api' ? '📮' : n.k === 'server' ? '🗄️' : '💾'}</span>
              <span className="jnode-lbl">{n.label}</span>
            </div>
          ))}
          <div className="jtrack"><span className="jenv" style={{ left: `${envLeft}%`, color: envColor }}>{cur && cur.dir === 'res' ? '📩' : '📨'}</span></div>
        </div>
        <div className="jnote">
          {cur ? <p className="body fade-step" key={step} style={{ margin: 0, color: T.ink }}><span className="mono" style={{ color: envColor, fontWeight: 700 }}>{cur.dir === 'req' ? 'SO\'ROV →' : '← JAVOB'}</span> &nbsp;{cur.note}</p>
            : <p className="small" style={{ margin: 0, color: T.ink3, fontStyle: 'italic' }}>▶ tugmasini bosing — konvert sayohatini boshlang</p>}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {!playing && <button className="btn" onClick={play}>{step < 0 ? '▶ Sayohatni boshlash' : '↻ Qaytadan'}</button>}
          {done && !playing && <span className="mono small" style={{ color: T.success, alignSelf: 'center' }}>✓ Javob saytga yetib keldi — 200 OK</span>}
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — TEST 4 =====
const Screen12 = (props) => (
  <QuestionScreen {...props} idx={12} scope="module-mikro" eyebrow="Mashq · 4-savol"
    questionText="Sayt ma'lumot kerak bo'lganda nima qiladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Frontend backend bilan <span className="italic" style={{ color: T.accent }}>qanday gaplashadi?</span></h2></>}
    options={["Bazaga to'g'ridan-to'g'ri o'zi kiradi", "API'ga so'rov yuboradi, server javob qaytaradi", "Hech kim bilan gaplashmaydi", "Boshqa saytdan nusxa oladi"]} correctIdx={1}
    explainCorrect="To'g'ri! Sayt API'ga so'rov (request) yuboradi → server bazada ishlaydi → javob (response) qaytaradi. Sayt bazaga o'zi kira olmaydi."
    explainWrong={{
      0: "Sayt bazaga to'g'ridan-to'g'ri kira olmaydi — bu xavfli. U API orqali so'raydi.",
      2: "Sayt aniq gaplashadi — API orqali serverga so'rov yuboradi.",
      3: "Yo'q — har sayt o'z serveriga API orqali murojaat qiladi.",
      default: "Front → API so'rov → server javob."
    }} />
);

// ===== SCREEN 13 — AMALIYOT: o'z API'ingni chaqir (GET → POST → GET) =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const STEPS = [
    { label: "1. GET — ro'yxatni ko'r", method: 'GET', url: '/api/products', status: 200, hint: "GET so'rovini yuboring — hozir 3 mahsulot bor.", data: PRODUCTS },
    { label: "2. POST — yangi qo'sh", method: 'POST', url: '/api/products', status: 201, body: NEW_PRODUCT, hint: "Endi POST bilan Mikrofonni qo'shing (201 Created).", data: { id: 4, nom: 'Mikrofon', narx: 60000, soni: 12 } },
    { label: "3. GET — qaytadan ko'r", method: 'GET', url: '/api/products', status: 200, hint: "Yana GET qiling — endi 4 mahsulot bo'ladi!", data: [...PRODUCTS, NEW_PRODUCT] }
  ];
  const [step, setStep] = useState(storedAnswer ? 2 : 0);
  const [sent, setSent] = useState(!!storedAnswer);
  const [sending, setSending] = useState(false);
  const done = step === 2 && sent;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const send = () => { if (sending || sent) return; setSending(true); setTimeout(() => { setSending(false); setSent(true); }, 800); };
  const nextStep = () => { setStep(s => s + 1); setSent(false); };
  const cur = STEPS[step];
  return (
    <Stage eyebrow="Amaliyot" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "3 so'rovni bajaring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">O'z API'ingizni Postman'da <span className="italic" style={{ color: T.accent }}>chaqiring</span></h2></div>
        <Mentor>To'liq aylanani sinab ko'ring: avval <b style={{ color: METHODS.GET }}>GET</b> bilan ro'yxatni oling, keyin <b style={{ color: METHODS.POST }}>POST</b> bilan yangi mahsulot qo'shing, so'ng yana <b style={{ color: METHODS.GET }}>GET</b> qiling — yangi mahsulot ro'yxatda paydo bo'ladi. Bu — haqiqiy backend ishi.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="stepbar">
              {STEPS.map((s, i) => { const ok = i < step || (i === step && sent); const isCur = i === step && !ok; return <span key={i} className={`stepdot ${ok ? 'done' : ''} ${isCur ? 'cur' : ''}`}>{ok ? '✓' : i + 1}</span>; })}
            </div>
            <Postman method={cur.method} url={cur.url} body={cur.body} sending={sending} sent={sent} status={cur.status} onSend={send} sendLabel="Send" sendDisabled={sent}>
              <JsonBox data={cur.data} />
            </Postman>
            {sent && step < 2 && <button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={nextStep}>Keyingi so'rov →</button>}
          </Col>
          <Col>
            <p className="flow-label">Vazifa: {cur.label}</p>
            {done
              ? <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>🎉 Ajoyib! Siz GET → POST → GET qildingiz. Oxirgi GET'da <b>4 ta</b> mahsulot — Mikrofon ro'yxatga qo'shildi. Mana shu API'ning to'liq aylanasi.</p></div>
              : sent
                ? <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ <b>{cur.status === 201 ? '201 Created' : '200 OK'}</b> — javob keldi. "Keyingi so'rov →" tugmasini bosing.</p></div>
                : <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>{cur.hint}</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — DEBUGGING (noto'g'ri so'rov → 404) =====
const Screen14 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  // AI noto'g'ri URL yozdi: /api/produts (typo) → 404. Topib tuzatamiz.
  const [found, setFound] = useState(!!storedAnswer);
  const [fixed, setFixed] = useState(!!storedAnswer);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(!!storedAnswer);
  const done = sent;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const send = () => { if (sent) return; setSending(true); setTimeout(() => { setSending(false); setSent(true); }, 800); };
  return (
    <Stage eyebrow="Tekshiruv · 404" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : (fixed ? 'Send bosing' : 'Xatoni toping')} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">So'rov ishlamadi — <span className="italic" style={{ color: T.accent }}>404? Nega?</span></h2></div>
        <Mentor>AI siz uchun GET so'rov yozdi, lekin server <b style={{ color: '#C2410C' }}>404 Not Found</b> qaytardi — "bunday manzil yo'q". Status kodi sizga muammoni darrov aytadi. URL'ga diqqat bilan qarang: bir harf tushib qolgan. Topib, tuzating.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="ai-card fade-up delay-1">
              <div className="ai-row"><span className="ai-badge">AI</span><span className="ai-bubble">Mana so'rov:</span></div>
              <div className="ai-code">
                <div className="ai-line" style={{ cursor: 'default' }}><MethodBadge method="GET" /></div>
                {fixed
                  ? <div className="ai-line ok" style={{ cursor: 'default' }}>/api/products</div>
                  : <div className={`ai-line ${found ? 'bad' : ''}`} onClick={() => setFound(true)}>/api/produts</div>}
              </div>
              {!found && <p className="ai-prompt">Manzilda xato bor — qatorni bosing.</p>}
              {found && !fixed && <button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={() => setFixed(true)}>🔧 produts → products</button>}
              {fixed && !sent && <button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={send}>▶ Qaytadan Send</button>}
            </div>
          </Col>
          <Col>
            <p className="flow-label">Javob</p>
            {!fixed
              ? <div className="pm-resp" style={{ marginTop: 0 }}><div className="pm-resp-h"><span className="pm-resp-lbl">Response</span><StatusBadge code={404} /></div><div className="pm-respbody"><JsonBox data={{ error: 'Not Found', message: 'Bunday manzil yo\'q' }} /></div></div>
              : !sent
                ? <div className="frame-dash" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 90 }}><p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>Tuzatildi — endi Send bosing</p></div>
                : <><div className="pm-resp" style={{ marginTop: 0 }}><div className="pm-resp-h"><span className="pm-resp-lbl">Response</span><StatusBadge code={200} /></div><div className="pm-respbody fade-step"><JsonBox data={PRODUCTS} /></div></div>
                  <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Topdingiz! Bitta harf (s) butun so'rovni ishlatdi. <b>Status kodi — sizning do'stingiz:</b> 404 = manzil noto'g'ri, 200 = hammasi joyida.</p></div></>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 15 — YAKUNIY: Postman so'rov-quruvchi =====
const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [method, setMethod] = useState(storedAnswer ? 'POST' : null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [passed, setPassed] = useState(!!storedAnswer?.correct);
  const isCorrect = method === 'POST';
  const status = isCorrect ? 201 : (method === 'GET' ? 200 : method === 'DELETE' ? 400 : method === 'PUT' ? 400 : null);
  const body = { nom: 'Mishka', narx: 50000, soni: 10 };
  const send = () => { if (!method || sending) return; setSending(true); setSent(false); setTimeout(() => { setSending(false); setSent(true); }, 850); };
  useEffect(() => {
    if (sent && isCorrect && !passed) { setPassed(true); onAnswer(screen, { stage: 'final', screenIdx: screen, question: "Yangi mahsulot qo'shish uchun to'g'ri so'rovni yig'ing", studentAnswer: method, correct: true, firstAttemptCorrect: true, solved: true, picked: method }); }
  }, [sent, isCorrect]);
  const pickMethod = (m) => { if (passed) return; setMethod(m); setSent(false); };
  const navLabel = passed ? 'Davom etish' : (method ? (sent ? 'Boshqa method tanlang' : '▶ Send bosing') : 'Method tanlang');
  return (
    <Stage eyebrow="Yakuniy · amaliy" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!passed} label={navLabel} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Vazifa: bazaga <span className="italic" style={{ color: T.accent }}>yangi mahsulot qo'shing</span></h2></div>
        <Mentor>Postman tayyor: URL <span className="mono">/api/products</span> va BODY (yangi mahsulot) yozilgan. Sizdan bittagina narsa kerak — <b style={{ color: T.ink }}>to'g'ri METHOD'ni tanlang</b>. "Yangi narsa qo'shish" qaysi method edi? Tanlab, <b style={{ color: T.ink }}>Send</b> bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <Postman method={method} url="/api/products" body={body} methodPicker onMethod={pickMethod}
              sending={sending} sent={sent} status={status} onSend={send} sendDisabled={!method} sendLabel="Send">
              {isCorrect
                ? <JsonBox data={{ id: 4, ...body }} />
                : <JsonBox data={method === 'GET' ? PRODUCTS : { error: 'Bu method yangi mahsulot qo\'shmaydi' }} />}
            </Postman>
          </Col>
          <Col>
            <div className="fade-up delay-2" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="tagpill" style={{ opacity: method ? 1 : 0.4 }}>{method ? '✓' : '1'} Method tanlandi</span>
              <span className="tagpill" style={{ opacity: sent ? 1 : 0.4 }}>{sent ? '✓' : '2'} Send bosildi</span>
              <span className="tagpill" style={{ opacity: passed ? 1 : 0.4 }}>{passed ? '✓' : '3'} 201 Created</span>
            </div>
            {passed
              ? <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>🎉 Tabriklaymiz! <b>POST</b> bilan yangi mahsulot qo'shildi — <b>201 Created</b>. Siz endi API bilan gaplasha olasiz!</p></div>
              : sent && !isCorrect
                ? <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>{method === 'GET' ? "GET faqat o'qiydi — ro'yxat keldi, lekin yangi narsa qo'shilmadi." : "Bu method yangi mahsulot qo'shmaydi."} Yangi narsa <b>yaratish</b> qaysi method edi? Qayta tanlang.</p></div>
                : <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Maslahat: GET=o'qish, POST=qo'shish, PUT=o'zgartirish, DELETE=o'chirish. Sizga "qo'shish" kerak.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — YAKUN =====
const Screen16 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const RECAP = [
    "API — sayt va server gaplashadigan til/qoidalar",
    "So'rov = METHOD + URL (+ BODY); javob = STATUS + DATA",
    "GET·POST·PUT·DELETE = SELECT·INSERT·UPDATE·DELETE",
    "Postman — frontend yozmasdan API'ni sinash asbobi",
    "Status: 200 OK · 201 Created · 404 Not Found"
  ];
  const HOMEWORK = [
    { b: "Postman'ni o'rnating", t: "— postman.com'dan yuklab oling (bepul)" },
    { b: "Ochiq API'ni chaqiring", t: "— GET so'rov yuboring va kelgan JSON javobni ko'ring" },
    { b: "4 method'ni eslang", t: "— har biri qaysi CRUD amaliga to'g'ri kelishini yozib chiqing" }
  ];
  const GLOSSARY = [
    { b: 'API', t: "— dasturlar gaplashadigan til/qoidalar" },
    { b: "So'rov", t: "— request: METHOD + URL (+BODY)" },
    { b: 'Javob', t: "— response: STATUS + DATA (JSON)" },
    { b: 'GET', t: "— o'qish (SELECT)" },
    { b: 'POST', t: "— qo'shish (INSERT)" },
    { b: 'PUT', t: "— o'zgartirish (UPDATE)" },
    { b: 'DELETE', t: "— o'chirish (DELETE)" },
    { b: 'Postman', t: "— API'ni sinab ko'radigan asbob" },
    { b: 'Status', t: "— 200/201/404 — natija shtampi" }
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
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">✓</span> Dars tugadi</span><h2 className="title h-title fade-up d1">Endi siz <span className="italic" style={{ color: T.accent }}>API bilan</span> gaplasha olasiz.</h2><p className="body h-sub fade-up d2">{PASSED ? "Tabriklaymiz! So'rov-javob, 4 method va Postman — front backend bilan qanday gaplashishini to'liq tushundingiz." : "Yaxshi harakat! Method'lar va so'rov-javobni mustahkamlash uchun bir-ikki ekranni qayta ko'ring."}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span className="tick" style={{ width: 16, height: 16, borderRadius: '50%', background: T.success, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck">✓</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>📝 Uyga vazifa</div><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">Keyingi: Backend praktika — o'z CRUD loyihangiz. Keyin NestJS bilan API'ni professional yozamiz! 🚀</p></div>
        </div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">💡 Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT — ({ lang, onFinished })
export default function ApiPostmanLesson({ lang: langProp, onFinished }) {
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

        .option { background: ${T.paper}; cursor: pointer; transition: all 0.2s; font-family: 'Manrope', sans-serif; font-weight: 500; text-align: left; border-radius: 12px; width: 100%; border: none; color: ${T.ink}; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.14); }
        .option:hover:not(:disabled) { background: #FDFBF7; box-shadow: 0 10px 22px -6px rgba(${T.shadowBase},0.22); }
        .option:disabled { cursor: default; }
        .option-correct { background: ${T.successSoft} !important; color: ${T.success} !important; box-shadow: 0 8px 22px -6px rgba(31,122,77,0.32) !important; }
        .option-wrong { background: ${T.paper} !important; color: ${T.ink3} !important; opacity: 0.55 !important; box-shadow: 0 4px 12px -6px rgba(${T.shadowBase},0.08) !important; }
        .option-picked-wrong { background: ${T.accentSoft} !important; color: ${T.accent} !important; box-shadow: 0 8px 22px -6px rgba(255,79,40,0.38) !important; }

        .chip { font-family: 'Manrope', sans-serif; font-weight: 600; font-size: clamp(13px,1.6vw,15px); display: inline-flex; align-items: center; gap: 8px; padding: 9px 15px; border-radius: 99px; border: none; background: ${T.paper}; color: ${T.ink}; cursor: pointer; transition: all 0.18s; box-shadow: 0 4px 12px -5px rgba(${T.shadowBase},0.18); }
        .chip:hover:not(:disabled) { transform: translateY(-1px); }
        .chip-on { background: ${T.accent}; color: #fff; box-shadow: 0 6px 16px -5px rgba(255,79,40,0.4); }
        .tagpill { font-family: 'JetBrains Mono', monospace; font-size: 12.5px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 99px; background: ${T.paper}; color: ${T.ink}; box-shadow: 0 3px 10px -5px rgba(${T.shadowBase},0.18); transition: opacity 0.2s; }

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
        .bb-dots { display: flex; gap: 5px; }
        .bb-dots i { width: 9px; height: 9px; border-radius: 50%; }
        .bb-dots i:first-child { background: #ff5f57; } .bb-dots i:nth-child(2) { background: #febc2e; } .bb-dots i:nth-child(3) { background: #28c840; }
        .bp-title { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink3}; transition: color 0.3s; }
        .bp-body { padding: clamp(12px,2.2vw,18px); }

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

        .frame-soft { background: ${T.accentSoft}; border-left: 4px solid ${T.accent}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); box-shadow: 0 6px 16px -6px rgba(255,79,40,0.22); }
        .frame-success { background: ${T.successSoft}; border-left: 4px solid ${T.success}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); box-shadow: 0 6px 16px -6px rgba(31,122,77,0.22); }
        .frame-warn { background: ${T.accentSoft}; border-left: 4px solid ${T.accent}; border-radius: 12px; padding: 12px 15px; }
        .frame-dash { border: 1.5px dashed ${T.ink3}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); }

        .screen { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: clamp(14px,2vw,20px); }
        .head { display: flex; flex-direction: column; gap: 6px; }
        .split { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: clamp(18px,3vw,36px); align-items: start; }
        .col { display: flex; flex-direction: column; gap: clamp(12px,2vw,16px); min-width: 0; }
        @media (max-width: 760px) { .split { grid-template-columns: 1fr !important; gap: clamp(14px,3vw,20px); } }
        .flow-label { font-family: 'Manrope'; font-weight: 700; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: ${T.ink2}; }
        .demo-swap { animation: fade-step 0.3s ease-out; }

        .roadmap { display: flex; flex-direction: column; gap: 8px; list-style: none; }
        .step-card { display: flex; align-items: center; gap: 14px; background: ${T.paper}; border-radius: 12px; padding: 13px 16px; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.14); }
        .step-num { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 13px; color: ${T.accent}; flex-shrink: 0; }
        .step-body { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .step-text { font-weight: 500; font-size: clamp(14px,1.7vw,16px); color: ${T.ink}; }
        .step-tag { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink2}; background: ${T.bg}; padding: 3px 8px; border-radius: 6px; }

        .sk-info { background: ${T.paper}; border-radius: 12px; padding: 15px 17px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.16); animation: fade-step 0.3s; }
        .sk-tagbig { display: flex; align-items: center; gap: 9px; flex-wrap: wrap; }
        .sk-wordbadge { font-family: 'Manrope'; font-weight: 700; font-size: 13px; color: ${T.accent}; background: ${T.accentSoft}; padding: 4px 10px; border-radius: 6px; }
        .hint { background: ${T.bg}; border: 1.5px dashed ${T.ink3}; border-radius: 12px; padding: 14px 16px; font-size: clamp(13px,1.5vw,14px); color: ${T.ink2}; }

        .ai-card { background: ${T.paper}; border-radius: 14px; padding: 15px 17px; display: flex; flex-direction: column; gap: 11px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.14); }
        .ai-row { display: flex; align-items: center; gap: 9px; } .ai-badge { font-family: 'Manrope'; font-weight: 800; font-size: 11px; color: #fff; background: ${T.blue}; padding: 3px 9px; border-radius: 6px; } .ai-bubble { font-size: 13px; color: ${T.ink2}; }
        .ai-code { background: ${CODE.bg}; border-radius: 9px; padding: 10px 12px; display: flex; flex-direction: column; gap: 3px; }
        .ai-line { font-family: 'JetBrains Mono'; font-size: 13px; color: ${CODE.text}; cursor: pointer; padding: 7px 9px; border-radius: 6px; transition: all 0.15s; white-space: pre-wrap; } .ai-line:hover { background: rgba(255,255,255,0.06); }
        .ai-line.bad { background: rgba(255,79,40,0.16); box-shadow: inset 0 0 0 1px ${T.accent}; } .ai-line.ok { background: rgba(31,122,77,0.16); }
        .ai-prompt { font-size: 12px; color: ${T.ink3}; margin: 0; font-style: italic; }
        .takeaway { background: ${T.accentSoft}; border-radius: 14px; padding: 20px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 5px; } .ta-bulb { font-size: 34px; } .ta-h { font-family: 'Source Serif 4', serif; font-weight: 600; font-size: clamp(16px,2.2vw,20px); color: ${T.ink}; margin: 0; } .ta-sub { color: ${T.accent}; font-weight: 600; font-size: 13px; margin: 0; }

        .hero { display: flex; align-items: center; justify-content: space-between; gap: 24px; flex-wrap: wrap; }
        .hero-l { flex: 1; min-width: 240px; display: flex; flex-direction: column; gap: 8px; }
        .done-chip { display: inline-flex; align-items: center; gap: 7px; align-self: flex-start; font-family: 'Manrope'; font-weight: 700; font-size: 12px; color: ${T.success}; background: ${T.successSoft}; padding: 5px 12px; border-radius: 99px; } .done-chip .tick { width: 15px; height: 15px; border-radius: 50%; background: ${T.success}; color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 9px; }
        .ring-wrap { position: relative; width: 128px; height: 128px; flex-shrink: 0; }
        .ring-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .ring-num { font-family: 'Fraunces', serif; font-size: 30px; font-weight: 400; line-height: 1; } .ring-den { color: ${T.ink3}; font-size: 20px; } .ring-lbl { font-size: 10px; color: ${T.ink2}; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 3px; }
        .card { background: ${T.paper}; border-radius: 16px; padding: 18px 20px; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.14); }
        .card-lbl { display: flex; align-items: center; gap: 8px; font-family: 'Manrope'; font-weight: 700; font-size: 13px; margin-bottom: 11px; }
        .recap { display: flex; flex-direction: column; gap: 8px; list-style: none; } .recap li { display: flex; align-items: flex-start; gap: 10px; font-size: clamp(13px,1.6vw,15px); color: ${T.ink}; animation: fade-in-up 0.4s ease-out forwards; opacity: 0; } .recap .ck { color: ${T.success}; font-weight: 700; flex-shrink: 0; }
        .hw ul { display: flex; flex-direction: column; gap: 6px; list-style: none; } .hw li { font-size: clamp(13px,1.6vw,15px); color: ${T.ink}; } .hw li b { color: ${T.accent}; } .hw .t { color: ${T.ink2}; } .hw-note { margin: 11px 0 0; font-size: 12px; color: ${T.accent}; font-weight: 600; }
        .gloss { background: ${T.paper}; border-radius: 12px; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.12); overflow: hidden; }
        .gloss-head { display: flex; align-items: center; justify-content: space-between; padding: 13px 17px; cursor: pointer; } .gloss-head .lbl { font-family: 'Manrope'; font-weight: 700; font-size: 13px; color: ${T.ink}; } .gloss-toggle { font-size: 18px; color: ${T.ink2}; }
        .gloss-body { padding: 0 17px 15px; font-size: clamp(12.5px,1.5vw,14px); color: ${T.ink2}; line-height: 1.7; animation: fade-step 0.3s; } .gloss-body b { color: ${T.ink}; }

        /* === 4-MODUL · 6-DARS: API + POSTMAN === */
        /* JSON ko'rinishi */
        .json-box { background: ${CODE.bg}; color: ${CODE.text}; font-family: 'JetBrains Mono', monospace; font-size: clamp(11.5px,1.45vw,13px); line-height: 1.6; padding: 12px 14px; border-radius: 10px; margin: 0; overflow-x: auto; white-space: pre; box-shadow: inset 0 0 0 1px rgba(255,255,255,0.04); }
        .json-box.sm { font-size: 11.5px; padding: 9px 11px; line-height: 1.5; }
        .json-box .j-key { color: ${CODE.attr}; } .json-box .j-str { color: ${CODE.str}; } .json-box .j-num { color: #7FB3FF; }

        /* method badge */
        .mbadge { font-family: 'JetBrains Mono', monospace; font-weight: 700; border-radius: 6px; letter-spacing: 0.03em; display: inline-block; }
        .maprow { display: flex; align-items: center; gap: 10px; }
        .maparrow { font-family: 'JetBrains Mono'; font-weight: 700; color: ${T.ink3}; }

        /* status badge */
        .status-badge { font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 11.5px; padding: 3px 9px; border-radius: 7px; white-space: nowrap; }

        /* POSTMAN mock */
        .postman { background: #fff; border-radius: 13px; overflow: hidden; box-shadow: 0 10px 26px -6px rgba(${T.shadowBase},0.18); }
        .pm-bar { display: flex; align-items: center; gap: 8px; padding: 9px 10px; background: #FBFAF7; border-bottom: 1px solid #EFECE5; }
        .pm-method { font-family: 'JetBrains Mono'; font-weight: 800; font-size: 13px; padding: 5px 10px; border-radius: 8px; background: ${T.bg}; flex-shrink: 0; }
        .pm-methods { display: flex; gap: 4px; flex-shrink: 0; }
        .pm-mbtn { font-family: 'JetBrains Mono'; font-weight: 800; font-size: 11px; border: none; border-radius: 7px; padding: 5px 8px; cursor: pointer; transition: all 0.15s; }
        .pm-mbtn:hover { transform: translateY(-1px); }
        .pm-url { flex: 1; min-width: 0; font-size: 12.5px; font-weight: 600; color: ${T.ink}; overflow-x: auto; white-space: nowrap; padding: 4px 8px; background: #fff; border-radius: 7px; box-shadow: inset 0 0 0 1px #EFECE5; }
        .pm-send { font-family: 'Manrope'; font-weight: 700; font-size: 12.5px; color: #fff; background: ${T.accent}; border: none; border-radius: 8px; padding: 6px 16px; cursor: pointer; flex-shrink: 0; transition: all 0.16s; }
        .pm-send:hover:not(:disabled) { box-shadow: 0 6px 14px -5px rgba(255,79,40,0.5); }
        .pm-send:disabled { opacity: 0.4; cursor: not-allowed; }
        .pm-body { padding: 9px 11px; border-bottom: 1px solid #EFECE5; }
        .pm-bodylbl { font-family: 'Manrope'; font-weight: 700; font-size: 9.5px; letter-spacing: 0.12em; text-transform: uppercase; color: ${T.ink3}; display: block; margin-bottom: 5px; }
        .pm-resp { padding: 10px 12px; }
        .pm-resp-h { display: flex; align-items: center; justify-content: space-between; margin-bottom: 7px; }
        .pm-resp-lbl { font-family: 'Manrope'; font-weight: 700; font-size: 9.5px; letter-spacing: 0.12em; text-transform: uppercase; color: ${T.ink3}; }
        .pm-loading { font-family: 'JetBrains Mono'; font-size: 13px; color: ${T.accent}; padding: 14px 4px; }
        .pm-empty { font-size: 12.5px; color: ${T.ink3}; font-style: italic; padding: 12px 4px; }
        .pm-respbody { }

        /* API oqimi (s2) */
        .apiflow { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .apinode { font-family: 'Manrope'; font-weight: 700; font-size: 12.5px; border: none; border-radius: 11px; padding: 12px 13px; cursor: pointer; background: ${T.paper}; color: ${T.ink}; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.16); transition: all 0.16s; flex: 1; min-width: 0; }
        .apinode:hover { transform: translateY(-1px); }
        .apinode.on { background: ${T.accent}; color: #fff; box-shadow: 0 8px 18px -5px rgba(255,79,40,0.4); }
        .apinode.seen:not(.on) { background: #FBFAF7; }
        .apiarrow { color: ${T.ink3}; font-weight: 700; flex-shrink: 0; }

        /* so'rov/javob konvert (s3) */
        .envcard { display: flex; flex-direction: column; gap: 7px; border-radius: 12px; padding: 11px; }
        .envcard.req { background: ${T.accentSoft}; }
        .envcard.res { background: ${T.successSoft}; }
        .envpart { display: flex; align-items: center; gap: 9px; background: #fff; border: none; border-radius: 9px; padding: 9px 12px; cursor: pointer; transition: all 0.15s; box-shadow: 0 3px 10px -5px rgba(${T.shadowBase},0.16); text-align: left; }
        .envpart:hover { transform: translateX(2px); }
        .envpart.on { box-shadow: inset 0 0 0 1.5px ${T.ink}; }
        .ep-lbl { font-family: 'Manrope'; font-weight: 800; font-size: 9.5px; letter-spacing: 0.1em; color: ${T.ink3}; margin-left: auto; }

        /* CRUD/method karta (s10) */
        .crud-card { display: flex; flex-direction: column; gap: 4px; align-items: flex-start; text-align: left; background: ${T.paper}; border: none; border-radius: 12px; padding: 13px 15px; cursor: pointer; transition: all 0.18s; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.16); }
        .crud-card:hover { transform: translateY(-1px); }
        .crud-card.seen { background: #FBFAF7; }
        .crud-word { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 15px; }
        .crud-uz { font-family: 'Manrope'; font-weight: 600; font-size: 12.5px; color: ${T.ink2}; }

        /* sayohat (s11) */
        .jflow { position: relative; display: flex; justify-content: space-between; gap: 6px; padding: 6px 0 30px; }
        .jnode { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 5px; background: ${T.paper}; border-radius: 12px; padding: 12px 6px; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.14); transition: box-shadow 0.25s; }
        .jnode-ic { font-size: 24px; } .jnode-lbl { font-family: 'Manrope'; font-weight: 700; font-size: 11px; color: ${T.ink}; text-align: center; }
        .jtrack { position: absolute; left: 0; right: 0; bottom: 4px; height: 22px; }
        .jenv { position: absolute; bottom: 0; font-size: 22px; transition: left 0.85s cubic-bezier(.45,0,.25,1); transform: translateX(-50%); }
        .jnote { background: ${T.paper}; border-radius: 11px; padding: 12px 15px; min-height: 46px; display: flex; align-items: center; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.12); }

        /* amaliyot stepbar (s13) */
        .stepbar { display: flex; gap: 8px; }
        .stepdot { width: 26px; height: 26px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-family: 'JetBrains Mono'; font-weight: 700; font-size: 12px; background: ${T.bg}; color: ${T.ink3}; box-shadow: inset 0 0 0 1.5px rgba(${T.shadowBase},0.14); }
        .stepdot.cur { background: ${T.accent}; color: #fff; box-shadow: none; }
        .stepdot.done { background: ${T.successSoft}; color: ${T.success}; box-shadow: inset 0 0 0 1.5px ${T.success}; }

        /* hook do'kon + konvert uchish */
        .shopmock { display: flex; gap: 8px; flex-wrap: wrap; }
        .shop-card { flex: 1; min-width: 84px; background: #fff; border-radius: 11px; padding: 11px; box-shadow: 0 4px 14px -6px rgba(${T.shadowBase},0.18); display: flex; flex-direction: column; gap: 5px; align-items: flex-start; }
        .shop-name { font-family: 'Source Serif 4', serif; font-weight: 600; font-size: 13.5px; color: ${T.ink}; }
        .shop-narx { font-family: 'JetBrains Mono'; font-size: 11.5px; color: ${T.accent}; font-weight: 700; }
        .flyrow { display: flex; align-items: center; gap: 10px; }
        .flynode { font-family: 'Manrope'; font-weight: 700; font-size: 12px; color: ${T.ink}; background: ${T.paper}; padding: 8px 12px; border-radius: 9px; box-shadow: 0 4px 12px -6px rgba(${T.shadowBase},0.16); }
        .flytrack { position: relative; flex: 1; height: 26px; }
        .flyenv { position: absolute; top: 0; font-size: 21px; left: 0; transition: none; }
        .flyenv.flying { animation: flyacross 1.1s cubic-bezier(.45,0,.25,1) forwards; }
        .flyenv.done { left: 0; }
        @keyframes flyacross { 0% { left: 0; } 45% { left: calc(100% - 21px); transform: scale(1); } 50% { left: calc(100% - 21px); } 55% { transform: scaleX(-1); } 100% { left: 0; transform: scaleX(-1); } }

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
