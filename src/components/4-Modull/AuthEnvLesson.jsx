import React, { useState, useEffect, useRef, createContext, useContext, useCallback } from 'react';

// ============================================================
// BACKEND MODULI (4-MODUL) · 7-DARS — AUTENTIFIKATSIYA + .env — PLATFORM STANDARD v16 (AUDIOSIZ)
// Mavzu: autentifikatsiya (siz kimsiz?) · email+parol bilan login · JWT token (header.payload.signature) ·
//        tokenni har so'rovda ko'rsatish (Authorization: Bearer) · route himoyasi (tokensiz → 401) ·
//        qo'riqchi/guard (jwt.verify) · MAXFIY KALIT (JWT_SECRET) · secret'larni .env'ga ko'chirish (process.env, .gitignore).
// ANALOGIYA (user): KONSERT BILAGUZUGI — login=eshikda hujjat ko'rsatasiz → bilaguzuk (token) olasiz →
//        har zonada ko'rsatasiz; qo'riqchi (guard) imzoni tekshiradi (soxta emasmi). JWT_SECRET = maxsus muhr (faqat server).
// MISOL (user): zakaz-shop davomi — POST /api/products endi LOGIN talab qiladi (tokensiz → 401, token bilan → 201).
// QAROR (user): final = .env refactor (koddagi ochiq JWT_SECRET → .env, kodda process.env.JWT_SECRET).
// USER DIREKTIVASI: haqiqiy sintaksisni KO'RSAT (jwt.sign / jwt.verify / process.env) — har qism qaysi vazifani bajarishini tushuntir.
// KO'PRIK: bu dars autentifikatsiya (kim?) + route himoyasi. AVTORIZATSIYA (rol/ruxsat — kim NIMA qila oladi) = keyingi NestJS moduli.
//        Nest: @UseGuards(AuthGuard) / JWT strategy / role guard — hammasi tartibli, tayyor (s16 teaser).
// AUDIOSIZ. Har ekran global savol bilan ochiladi. Markaziy widgetlar: LoginForm · TokenCard (bilaguzuk) · Postman(auth) · EnvRefactor.
// PRODUCTION: <style> ichidagi @import OLIB TASHLANADI — shriftlarni LMS yuklaydi.
// ============================================================

const T = {
  bg: '#F6F4EF', ink: '#0E0E10', ink2: '#5A5A60', ink3: '#A7A6A2',
  paper: '#FFFFFF', accent: '#FF4F28', accentSoft: '#FFE8E1', accentVivid: '#FF4F28',
  success: '#1F7A4D', successSoft: '#E3F0E8', blue: '#019ACB', blueSoft: '#E2F4FA', link: '#1a56db',
  danger: '#C2410C', dangerSoft: '#FBE7DE', purple: '#7C3AED',
  shadowBase: '58, 53, 48'
};
const CODE = { bg: '#1A2436', text: '#E8E5DD', tag: '#FF7755', attr: '#FFD380', str: '#7DD181', comment: '#6B7585', punct: '#9FB4D8', kw: '#C586C0', fn: '#DCDCAA' };
const METHODS = { GET: T.success, POST: T.accent, PUT: T.blue, DELETE: '#C2410C' };
const STAT = { 200: ['200 OK', T.success], 201: ['201 Created', T.success], 401: ['401 Unauthorized', T.danger], 403: ['403 Forbidden', T.danger], 404: ['404 Not Found', T.danger] };

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

const LESSON_META = { lessonId: 'auth-env-04-07-v16', lessonTitle: { uz: 'Autentifikatsiya va .env — login, JWT, maxfiy kalitlar', ru: 'Аутентификация и .env — логин, JWT, секреты' } };
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

const Win = ({ title, children, minH, hotTitle }) => (
  <div className="bp-window"><div className="bp-bar"><span className="bb-dots"><i /><i /><i /></span><span className="bp-title" style={hotTitle ? { color: T.accent, fontWeight: 700 } : undefined}>{title}</span></div><div className="bp-body" style={{ minHeight: minH, position: 'relative' }}>{children}</div></div>
);

// ============================================================
// 4-MODUL · 7-DARS YORDAMCHILAR — Autentifikatsiya + .env
// ============================================================
// kod ranglari
const Kw = ({ children }) => <span style={{ color: CODE.kw }}>{children}</span>;
const Fn = ({ children }) => <span style={{ color: CODE.fn }}>{children}</span>;
const St = ({ children }) => <span style={{ color: CODE.str }}>{children}</span>;
const At = ({ children }) => <span style={{ color: CODE.attr }}>{children}</span>;
const Cm = ({ children }) => <span style={{ color: CODE.comment }}>{children}</span>;

const StatusBadge = ({ code }) => { const s = STAT[code] || ['', T.ink2]; return <span className="status-badge" style={{ color: s[1], background: s[1] + '1e' }}>{s[0]}</span>; };

// JSON ko'rinishi (javob)
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

// JWT token = "bilaguzuk" (3 qismdan iborat)
const TOKEN = { h: 'eyJhbG', p: 'eyJ1c2VySWQiOjF9', s: 'aB3xK9zQ' };
const TokenCard = ({ active, onPart, small }) => (
  <div className={`tokencard ${small ? 'sm' : ''}`}>
    <span className="tk-ic">🎫</span>
    <div className="tk-jwt">
      <button className={`jwt-part h ${active === 'h' ? 'on' : ''}`} onClick={onPart ? () => onPart('h') : undefined}>{TOKEN.h}</button>
      <span className="jwt-dot">.</span>
      <button className={`jwt-part p ${active === 'p' ? 'on' : ''}`} onClick={onPart ? () => onPart('p') : undefined}>{TOKEN.p}</button>
      <span className="jwt-dot">.</span>
      <button className={`jwt-part s ${active === 's' ? 'on' : ''}`} onClick={onPart ? () => onPart('s') : undefined}>{TOKEN.s}</button>
    </div>
  </div>
);

// Postman-simon so'rov (auth qatori bilan) — id33 davomi
const Postman = ({ method, url, authRow, sending, sent, status, children, onSend, sendDisabled, sendLabel = 'Send' }) => (
  <div className="postman fade-up">
    <div className="pm-bar">
      <span className="pm-method" style={{ color: METHODS[method] }}>{method}</span>
      <span className="pm-url mono">{url}</span>
      <button className="pm-send" disabled={sendDisabled || sending} onClick={onSend}>{sending ? '…' : sendLabel}</button>
    </div>
    {authRow && <div className="pm-auth">{authRow}</div>}
    <div className="pm-resp">
      <div className="pm-resp-h"><span className="pm-resp-lbl">Javob (Response)</span>{sent && status ? <StatusBadge code={status} /> : null}</div>
      {sending ? <div className="pm-loading">📨 Yuborilmoqda…</div>
        : sent ? <div className="pm-respbody fade-step">{children}</div>
        : <div className="pm-empty">▸ Send bosing — server javobi shu yerda chiqadi</div>}
    </div>
  </div>
);

// ===== SCREEN 0 — HOOK (himoyasiz sayt = xavf) =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [phase, setPhase] = useState(storedAnswer ? 'done' : 'idle'); // idle | attack | done
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const tried = phase === 'done';
  const attack = () => { if (phase !== 'idle') return; setPhase('attack'); setTimeout(() => setPhase('done'), 1100); };
  const OPTS = [
    { id: 'a', label: "Hech narsa — har kim mahsulot qo'sha va o'chira oladi" },
    { id: 'b', label: "Login qo'shamiz — faqat tokeni borlar o'zgartira oladi" },
    { id: 'c', label: "Saytni butunlay yopib qo'yamiz" }
  ];
  const correct = 'b';
  const pick = (v) => { if (picked !== null || !tried) return; setPicked(v); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: v === correct }); };
  return (
    <Stage eyebrow="Kirish" screen={screen} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 880 }}>Do'koningizga <span className="italic" style={{ color: T.accent }}>begona</span> kirib, hammasini o'chirib tashlasa-chi?</h1>
        <Mentor>O'tgan darsda <span className="mono">POST /api/products</span> bilan mahsulot qo'shdik — lekin buni <b style={{ color: T.danger }}>HAR KIM</b> qila oladi! Tugmani bosing: begona kelib mahsulotlarni o'chirib ketadi. Bunday bo'lmasligi uchun nima qilamiz?</Mentor>
        <Split>
          <Col>
            <Win title="zakaz-shop.uz — himoyasiz" minH={150} hotTitle={phase === 'done'}>
              <div className="shopmock">
                {phase === 'done'
                  ? <div className="empty-shop fade-step">🗑️ Mahsulotlar o'chirib tashlandi!</div>
                  : ['Klaviatura', 'Sichqoncha', 'Quloqchin'].map(n => <div key={n} className={`shop-card ${phase === 'attack' ? 'shaking' : ''}`}><div className="shop-name">{n}</div></div>)}
              </div>
            </Win>
            {phase === 'idle' && <button className="btn" style={{ alignSelf: 'flex-start', background: T.danger }} onClick={attack}>😈 Begona: DELETE /api/products</button>}
            {phase === 'attack' && <p className="mono small" style={{ color: T.danger, margin: 0 }}>Begona o'chiryapti…</p>}
            {phase === 'done' && <p className="mono small" style={{ color: T.danger, margin: 0 }}>✕ Hamma narsa o'chdi — chunki hech qanday himoya yo'q edi!</p>}
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Buning oldini qanday olamiz?</p>
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
            {!tried && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>Avval hujumni ko'ring ←</p>}
            {picked !== null && <p className="hook-ack fade-step">{picked === correct ? <>To'g'ri! <b>Autentifikatsiya</b> qo'shamiz: faqat login qilgan (tokeni bor) odam o'zgartira oladi.</> : <>To'g'ri yo'l — <b>login (autentifikatsiya)</b> qo'shish: faqat tokeni borlar o'zgartira oladi. Bugun shuni o'rganamiz.</>}</p>}
          </Col>
        </Split>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const STEPS = [
    { text: "Autentifikatsiya — siz kimsiz?", tag: 'login' },
    { text: "JWT token — raqamli bilaguzuk", tag: 'sign' },
    { text: "Tokenni ko'rsatish — route himoyasi", tag: 'Bearer · 401' },
    { text: "Maxfiy kalit va .env", tag: 'secret' },
    { text: "O'zingiz .env'ga ko'chirasiz", tag: 'process.env' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const PreviewBlock = (
    <Col>
      <p className="flow-label">Dars oxirida — siz login qo'shasiz va kalitni yashirasiz</p>
      <Win title="auth" minH={150}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
          <TokenCard small />
          <p className="mono small" style={{ color: T.success, margin: 0 }}>✓ login → bilaguzuk (token) → himoyalangan route</p>
        </div>
      </Win>
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
        <div className="head"><h2 className="title h-title fade-up">Saytni <span className="italic" style={{ color: T.accent }}>himoyalashni</span> o'rganamiz</h2></div>
        <Mentor>Va'da: dars oxirida siz saytga <b style={{ color: T.ink }}>login</b> qo'sha olasiz va maxfiy kalitlarni <b style={{ color: T.ink }}>.env</b>'ga yashira olasiz — GitHub'da hech kim ko'rmaydi. Asosiy g'oya: <b style={{ color: T.accent }}>bilaguzuk (token)</b>.</Mentor>
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

// ===== SCREEN 2 — AUTENTIFIKATSIYA NIMA (bilaguzuk) =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const PARTS = [
    { k: 'hujjat', label: '1. Hujjat ko\'rsatish', desc: "Konsert kirishida hujjatingizni ko'rsatasiz. Saytda — email va parol. Bu — login." },
    { k: 'bilaguzuk', label: '2. Bilaguzuk olish', desc: "Hujjat to'g'ri bo'lsa — bilaguzuk (token) berishadi. Endi har safar hujjat emas, bilaguzukni ko'rsatasiz." },
    { k: 'zona', label: '3. Zonalarga kirish', desc: "Har eshikda bilaguzukni ko'rsatasiz. Qo'riqchi tekshiradi — haqiqiymi? Haqiqiy bo'lsa — kirasiz." }
  ];
  const [seen, setSeen] = useState(storedAnswer ? new Set(['hujjat', 'bilaguzuk', 'zona']) : new Set());
  const [active, setActive] = useState(storedAnswer ? 'bilaguzuk' : null);
  const done = seen.size >= 3;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const tap = (k) => { setActive(k); setSeen(s => new Set(s).add(k)); };
  const cur = PARTS.find(p => p.k === active);
  return (
    <Stage eyebrow="Autentifikatsiya" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/3 qadamni ko'ring`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Sayt sizni <span className="italic" style={{ color: T.accent }}>qanday tanidi?</span></h2></div>
        <Mentor><b style={{ color: T.ink }}>Autentifikatsiya</b> = "siz kimsiz?" degan savolga javob. Xuddi konsertga kirish kabi: hujjat ko'rsatasiz → bilaguzuk olasiz → har joyda shuni ko'rsatasiz. (Eslatma: "kim NIMA qila oladi" — bu <b style={{ color: T.purple }}>avtorizatsiya</b>, keyingi modulda.) Qadamlarni bosib ko'ring.</Mentor>
        <div className="split">
          <Col>
            <div className="authsteps">
              {PARTS.map((p) => (
                <button key={p.k} className={`authstep ${active === p.k ? 'on' : ''} ${seen.has(p.k) ? 'seen' : ''}`} onClick={() => tap(p.k)}>{p.label} {seen.has(p.k) ? '✓' : ''}</button>
              ))}
            </div>
            {cur && <div className="sk-info fade-step" key={cur.k}><p className="body" style={{ color: T.ink, margin: 0 }}>{cur.desc}</p></div>}
          </Col>
          <Col>
            {done
              ? <div className="takeaway fade-step"><div className="ta-bulb">🎫</div><p className="ta-h">Login → bilaguzuk → har joyda ko'rsatish</p><p className="ta-sub">Autentifikatsiya = "siz kimsiz?"</p></div>
              : <div className="frame-dash" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 130 }}><p className="small" style={{ color: T.ink3, fontStyle: 'italic', textAlign: 'center', margin: 0 }}>← Qadamlarni bosib o'rganing</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — LOGIN OQIMI (jwt.sign) =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [sending, setSending] = useState(false);
  const [done2, setDone2] = useState(!!storedAnswer);
  const done = done2;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const login = () => { if (done2 || sending) return; setSending(true); setTimeout(() => { setSending(false); setDone2(true); }, 950); };
  return (
    <Stage eyebrow="Login · jwt.sign" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Kirish bosing"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Parolni <span className="italic" style={{ color: T.accent }}>har safar</span> yuborasizmi?</h2></div>
        <Mentor>Yo'q — bir marta login qilasiz, server sizga <b style={{ color: T.accent }}>token (bilaguzuk)</b> beradi. So'rov: <span className="mono">POST /api/login</span> {'{ email, parol }'}. Server tekshiradi va <span className="mono">jwt.sign</span> bilan token yasab qaytaradi. Pastdagi formani to'ldirib, Kirish bosing.</Mentor>
        <div className="split">
          <Col>
            <div className="loginform fade-up">
              <span className="lf-lbl">Email</span>
              <div className="lf-field">ali@shop.uz</div>
              <span className="lf-lbl">Parol</span>
              <div className="lf-field">••••••••</div>
              {!done2 && <button className="btn" style={{ marginTop: 4 }} onClick={login}>{sending ? '⏳ Tekshirilmoqda…' : '→ Kirish'}</button>}
              {done2 && <div className="lf-token fade-step"><span className="mono small" style={{ color: T.success }}>✓ Token berildi:</span><TokenCard small /></div>}
            </div>
          </Col>
          <Col>
            <p className="flow-label">Server kodi (login)</p>
            <pre className="code-box">{`app.`}<Fn>post</Fn>{`(`}<St>'/api/login'</St>{`, (req, res) => {`}{'\n'}{`  `}<Cm>// email + parolni tekshir</Cm>{'\n'}{`  `}<Kw>const</Kw>{` token = `}<At>jwt</At>{`.`}<Fn>sign</Fn>{`(`}{'\n'}{`    { userId: `}<At>1</At>{` },        `}<Cm>// kim</Cm>{'\n'}{`    `}<At>JWT_SECRET</At>{`           `}<Cm>// maxfiy imzo</Cm>{'\n'}{`  )`}{'\n'}{`  res.`}<Fn>json</Fn>{`({ token })`}{'\n'}{`})`}</pre>
            {done2 && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}><span className="mono">jwt.sign</span> ikki narsadan token yasaydi: <b>kim</b> (userId) + <b>maxfiy imzo</b> (SECRET). Endi parol kerak emas — token yetarli.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 =====
const Screen4 = (props) => (
  <QuestionScreen {...props} idx={4} scope="module-mikro" eyebrow="Mashq · 1-savol"
    questionText="Login muvaffaqiyatli bo'lsa, server nima qaytaradi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Email va parol to'g'ri bo'lsa, server sizga <span className="italic" style={{ color: T.accent }}>nima beradi?</span></h2></>}
    options={["Parolni qaytadan so'raydi", "Token (bilaguzuk) beradi — keyingi so'rovlar uchun", "Hech narsa bermaydi", "Butun bazani yuboradi"]} correctIdx={1}
    explainCorrect="To'g'ri! Login muvaffaqiyatli bo'lsa, server JWT token (bilaguzuk) beradi. Endi har so'rovda shu tokenni ko'rsatasiz — parol kerak emas."
    explainWrong={{
      0: "Parolni har safar so'ramaydi — bir marta login qilasiz, token olasiz.",
      2: "Aksincha — token beradi, shu bilan kim ekanligingizni isbotlaysiz.",
      3: "Yo'q — faqat token (bilaguzuk) qaytaradi.",
      default: "Login → token (bilaguzuk)."
    }} />
);

// ===== SCREEN 5 — JWT TOKEN (bilaguzuk anatomiyasi) =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const PARTS = {
    h: "HEADER — texnik ma'lumot: bu JWT token, qaysi usulda imzolangan.",
    p: "PAYLOAD — KIM: ichida userId, email yozilgan. Buni o'qish mumkin (maxfiy emas!), lekin o'zgartirib bo'lmaydi.",
    s: "SIGNATURE — IMZO: maxfiy kalit (JWT_SECRET) bilan yasaladi. Soxta token yasab bo'lmaydi — chunki SECRET faqat serverda."
  };
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(storedAnswer ? new Set(['h', 'p', 's']) : new Set());
  const done = seen.size >= 3;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const tap = (k) => { setActive(k); setSeen(s => new Set(s).add(k)); };
  return (
    <Stage eyebrow="JWT token" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/3 qismni ko'ring`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bilaguzuk (token) ichida <span className="italic" style={{ color: T.accent }}>nima bor?</span></h2></div>
        <Mentor>JWT token uchta qismdan iborat, nuqta bilan ajratilgan: <span className="mono">header.payload.signature</span>. Eng muhimi — <b style={{ color: T.success }}>imzo (signature)</b>: u maxfiy kalit bilan yasaladi, shuning uchun soxta token yasab bo'lmaydi. Qismlarni bosib ko'ring.</Mentor>
        <div className="split">
          <Col>
            <TokenCard active={active} onPart={tap} />
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              <button className={`chip ${active === 'h' ? 'chip-on' : ''}`} onClick={() => tap('h')}>header</button>
              <button className={`chip ${active === 'p' ? 'chip-on' : ''}`} onClick={() => tap('p')}>payload</button>
              <button className={`chip ${active === 's' ? 'chip-on' : ''}`} onClick={() => tap('s')}>signature</button>
            </div>
          </Col>
          <Col>
            {active
              ? <div className="sk-info fade-step" key={active}><p className="body" style={{ color: T.ink, margin: 0 }}>{PARTS[active]}</p></div>
              : <div className="frame-dash" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 130 }}><p className="small" style={{ color: T.ink3, fontStyle: 'italic', textAlign: 'center', margin: 0 }}>← Token qismlarini bosing</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Payload o'qiladi (kim), lekin imzo tufayli <b>o'zgartirib bo'lmaydi</b>. Birov "men adminman" deb yozsa — imzo buziladi, server rad etadi.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 5b — TEST 2 =====
const Screen5b = (props) => (
  <QuestionScreen {...props} idx={6} scope="module-mikro" eyebrow="Mashq · 2-savol"
    questionText="Nega birov soxta token yasab, o'zini boshqa odam qilib ko'rsata olmaydi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Tokenni o'zgartirsa, server buni <span className="italic" style={{ color: T.accent }}>qanday sezadi?</span></h2></>}
    options={["Token juda uzun bo'lgani uchun", "Imzo (signature) maxfiy kalit bilan yasaladi — kalitsiz to'g'ri imzo qilib bo'lmaydi", "Token ko'rinmaydi", "Server tokenni eslab qoladi"]} correctIdx={1}
    explainCorrect="To'g'ri! Signature maxfiy kalit (JWT_SECRET) bilan yasaladi. Kalit faqat serverda. Tokenni o'zgartirsangiz — imzo mos kelmaydi, server rad etadi (401)."
    explainWrong={{
      0: "Uzunlik emas — gap imzoda. Imzo kalitsiz to'g'ri chiqmaydi.",
      2: "Token ko'rinadi (payload o'qiladi), lekin imzo tufayli o'zgartirib bo'lmaydi.",
      3: "Server odatda tokenni eslab qolmaydi — u imzoni tekshiradi.",
      default: "Imzo (signature) + maxfiy kalit = soxta token mumkin emas."
    }} />
);

// ===== SCREEN 6 — TOKENNI ISHLATISH (himoyalangan route) =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [hasToken, setHasToken] = useState(false);
  const [sending, setSending] = useState(false);
  const [sentNo, setSentNo] = useState(false); // tokensiz yuborildi (401)
  const [sentYes, setSentYes] = useState(!!storedAnswer); // token bilan yuborildi (201)
  const done = sentYes;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const send = () => {
    if (sending) return; setSending(true);
    setTimeout(() => { setSending(false); if (hasToken) setSentYes(true); else setSentNo(true); }, 800);
  };
  const sent = hasToken ? sentYes : sentNo;
  const status = hasToken ? 201 : 401;
  return (
    <Stage eyebrow="Himoyalangan route" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Token bilan yuboring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Mahsulot qo'shish uchun <span className="italic" style={{ color: T.accent }}>bilaguzuk kerak</span></h2></div>
        <Mentor>Endi <span className="mono">POST /api/products</span> himoyalangan. Har so'rovda bilaguzukni <b style={{ color: T.ink }}>Authorization: Bearer {'<token>'}</b> sarlavhasida yuborasiz. <b style={{ color: T.danger }}>Tokensiz</b> → 401. Avval tokensiz sinab ko'ring, keyin tokenni yoqib qayta yuboring.</Mentor>
        <div className="split">
          <Col>
            <Postman method="POST" url="/api/products" sending={sending} sent={sent} status={status} onSend={send} sendLabel="Send"
              authRow={
                <label className="authtoggle">
                  <input type="checkbox" checked={hasToken} onChange={e => { setHasToken(e.target.checked); setSentNo(false); }} />
                  <span>Authorization: Bearer {hasToken ? <span className="mono" style={{ color: T.success }}>{TOKEN.h}.{TOKEN.p}…</span> : <span style={{ color: T.danger }}>(token yo'q)</span>}</span>
                </label>
              }>
              {hasToken ? <JsonBox data={{ id: 4, nom: 'Mikrofon', narx: 60000 }} /> : <JsonBox data={{ error: 'Unauthorized', message: 'Token kerak' }} />}
            </Postman>
          </Col>
          <Col>
            <div className={`guarddoor ${sent ? (hasToken ? 'open' : 'block') : ''}`}>
              <span className="gd-ic">{sent ? (hasToken ? '🔓' : '⛔') : '🚪'}</span>
              <span className="gd-lbl">{sent ? (hasToken ? 'Qo\'riqchi: bilaguzuk haqiqiy — kiring!' : 'Qo\'riqchi: bilaguzuk yo\'q — to\'xtang!') : 'Eshikda qo\'riqchi (guard) turibdi'}</span>
            </div>
            {sentNo && !hasToken && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}><b>401 Unauthorized</b> — tokensiz kira olmaysiz. Yuqoridagi katakchani belgilang (token qo'shing) va qayta yuboring.</p></div>}
            {sentYes && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}><b>201 Created</b> — bilaguzuk haqiqiy, mahsulot qo'shildi! Endi begona hech narsa qila olmaydi.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — QO'RIQCHI / GUARD (jwt.verify) =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const PARTS = {
    check: "1. Token bormi? Yo'q bo'lsa → darrov 401 (kira olmaysiz).",
    verify: "2. jwt.verify(token, SECRET) — imzoni maxfiy kalit bilan tekshiradi. Soxta bo'lsa → 401.",
    who: "3. To'g'ri bo'lsa — payload ochiladi: kim ekanligingiz (userId) ma'lum bo'ladi. Endi kodga o'tasiz."
  };
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(storedAnswer ? new Set(['check', 'verify', 'who']) : new Set());
  const done = seen.size >= 3;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const tap = (k) => { setActive(k); setSeen(s => new Set(s).add(k)); };
  return (
    <Stage eyebrow="Qo'riqchi · jwt.verify" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/3 qadamni ko'ring`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Server bilaguzukni <span className="italic" style={{ color: T.accent }}>qanday tekshiradi?</span></h2></div>
        <Mentor>Himoyalangan route oldida <b style={{ color: T.ink }}>qo'riqchi (guard)</b> turadi. U <span className="mono">jwt.verify</span> bilan imzoni maxfiy kalit orqali tekshiradi. Koddagi har qatorni bosib, vazifasini ko'ring.</Mentor>
        <div className="split">
          <Col>
            <pre className="code-box clickable">
              <span className={`cl-line ${active === 'check' ? 'on' : ''}`} onClick={() => tap('check')}>{'  '}<Kw>if</Kw>{` (!token) `}<Kw>return</Kw>{` res.`}<Fn>status</Fn>{`(`}<At>401</At>{`)`}</span>{'\n'}
              <span className={`cl-line ${active === 'verify' ? 'on' : ''}`} onClick={() => tap('verify')}>{'  '}<Kw>const</Kw>{` data = `}<At>jwt</At>{`.`}<Fn>verify</Fn>{`(token, `}<At>JWT_SECRET</At>{`)`}</span>{'\n'}
              <span className={`cl-line ${active === 'who' ? 'on' : ''}`} onClick={() => tap('who')}>{'  '}<Kw>const</Kw>{` userId = data.userId  `}<Cm>// kim</Cm></span>
            </pre>
            <p className="small" style={{ color: T.ink2, margin: 0 }}>Nest'da bu bitta qatorga aylanadi: <span className="mono" style={{ color: T.purple }}>@UseGuards(AuthGuard)</span> — keyingi modul.</p>
          </Col>
          <Col>
            {active
              ? <div className="sk-info fade-step" key={active}><p className="body" style={{ color: T.ink, margin: 0 }}>{PARTS[active]}</p></div>
              : <div className="frame-dash" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 120 }}><p className="small" style={{ color: T.ink3, fontStyle: 'italic', textAlign: 'center', margin: 0 }}>← Kod qatorlarini bosing</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Qo'riqchi: token bormi → imzo to'g'rimi → kim ekani aniq. Hammasi maxfiy kalitga (SECRET) bog'liq.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — SECRET (xavf) =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [pushed, setPushed] = useState(!!storedAnswer);
  const done = pushed;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Maxfiy kalit · xavf" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "GitHub'ga yuklab ko'ring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Maxfiy kalit kodda tursa — <span className="italic" style={{ color: T.danger }}>nima bo'ladi?</span></h2></div>
        <Mentor>Butun himoya <b style={{ color: T.ink }}>JWT_SECRET</b>ga bog'liq — u "imzo muhri". Agar SECRET kodda yozilgan bo'lsa va kodni <b style={{ color: T.danger }}>GitHub'ga</b> yuklasangiz — har kim uni ko'radi va soxta token yasay oladi! Kodni GitHub'ga "push" qilib ko'ring.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">server.js</p>
            <pre className="code-box">{`  `}<Kw>const</Kw>{` JWT_SECRET = `}<St>"super-secret-key-123"</St>{'\n'}{`  `}<Cm>// ⚠ kod ichida ochiq yozilgan!</Cm></pre>
            {!pushed && <button className="btn" style={{ alignSelf: 'flex-start', background: T.danger }} onClick={() => setPushed(true)}>⬆ GitHub'ga push qilish</button>}
          </Col>
          <Col>
            <p className="flow-label">github.com/siz/zakaz-shop</p>
            {pushed
              ? <div className="ghub danger fade-step"><div className="gh-row"><span className="gh-eye">👁️</span><span className="mono small">JWT_SECRET = "super-secret-key-123"</span></div><p className="body" style={{ margin: '8px 0 0', color: T.ink }}><b style={{ color: T.danger }}>Hamma ko'rdi!</b> Endi istalgan odam shu kalit bilan soxta "admin" token yasab, saytingizni egallashi mumkin. Kalitni yashirishimiz shart.</p></div>
              : <div className="frame-dash" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 110 }}><p className="small" style={{ color: T.ink3, fontStyle: 'italic', textAlign: 'center', margin: 0 }}>Push qiling — GitHub'da nima ko'rinishini ko'ring</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 9 — TEST 3 =====
const Screen9 = (props) => (
  <QuestionScreen {...props} idx={9} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="Himoyalangan route'ga tokensiz so'rov yuborilsa, server qaysi status qaytaradi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Bilaguzuksiz himoyalangan eshikka kelsangiz, qo'riqchi <span className="italic" style={{ color: T.accent }}>nima deydi?</span></h2></>}
    options={["200 OK — kiravering", "401 Unauthorized — token yo'q, kira olmaysiz", "201 Created — qo'shildi", "404 Not Found — manzil yo'q"]} correctIdx={1}
    explainCorrect="To'g'ri! Token bo'lmasa (yoki soxta bo'lsa) → 401 Unauthorized. Qo'riqchi sizni kiritmaydi."
    explainWrong={{
      0: "200 — hammasi joyida degani. Tokensiz kira olmaysiz.",
      2: "201 — yangi narsa yaratildi. Lekin avval kirish kerak (token).",
      3: "404 — manzil yo'q. Bu yerda manzil bor, lekin token yo'q → 401.",
      default: "Tokensiz → 401 Unauthorized."
    }} />
);

// ===== SCREEN 10 — .env QANDAY ISHLAYDI =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const PARTS = [
    { k: 'env', label: '.env fayli', desc: "Maxfiy kalitlar shu yashirin faylda saqlanadi: JWT_SECRET=... Bu fayl kompyuteringizda qoladi." },
    { k: 'code', label: 'process.env', desc: "Kod kalitni to'g'ridan-to'g'ri emas, process.env.JWT_SECRET orqali o'qiydi. Kodda secret ko'rinmaydi." },
    { k: 'git', label: '.gitignore', desc: "Bu faylga .env qo'shiladi → .env hech qachon GitHub'ga ketmaydi. Maxfiy qoladi." }
  ];
  const [seen, setSeen] = useState(storedAnswer ? new Set(['env', 'code', 'git']) : new Set());
  const [active, setActive] = useState(storedAnswer ? 'env' : null);
  const done = seen.size >= 3;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const tap = (k) => { setActive(k); setSeen(s => new Set(s).add(k)); };
  const cur = PARTS.find(p => p.k === active);
  return (
    <Stage eyebrow=".env" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/3 qismni ko'ring`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Maxfiy kalitni qayerda <span className="italic" style={{ color: T.success }}>yashiramiz?</span></h2></div>
        <Mentor>Yechim — <b style={{ color: T.ink }}>.env</b> fayli: maxfiy kalitlar uchun yashirin tortma. Kod undan <span className="mono">process.env</span> orqali o'qiydi, fayl esa <span className="mono">.gitignore</span> tufayli GitHub'ga ketmaydi. Uch qismni bosib ko'ring.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">.env (yashirin)</p>
            <pre className={`code-box envfile ${active === 'env' ? 'hi' : ''}`} onClick={() => tap('env')}><At>JWT_SECRET</At>{`=`}<St>super-secret-key-123</St></pre>
            <p className="flow-label">server.js</p>
            <pre className={`code-box ${active === 'code' ? 'hi' : ''}`} onClick={() => tap('code')}>{`  `}<Kw>const</Kw>{` JWT_SECRET = `}<At>process</At>{`.`}<At>env</At>{`.`}<At>JWT_SECRET</At></pre>
            <pre className={`code-box envfile ${active === 'git' ? 'hi' : ''}`} onClick={() => tap('git')}><Cm># .gitignore</Cm>{'\n'}.env</pre>
          </Col>
          <Col>
            {cur
              ? <div className="sk-info fade-step" key={cur.k}><span className="sk-tagbig"><span className="sk-wordbadge">{cur.label}</span></span><p className="body" style={{ color: T.ink, margin: '9px 0 0' }}>{cur.desc}</p></div>
              : <div className="frame-dash" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 130 }}><p className="small" style={{ color: T.ink3, fontStyle: 'italic', textAlign: 'center', margin: 0 }}>← Qismlarni bosing</p></div>}
            {done && <div className="ghub safe fade-step"><div className="gh-row"><span className="gh-eye">🔒</span><span className="mono small">JWT_SECRET endi GitHub'da ko'rinmaydi</span></div></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — TO'LIQ AUTH OQIMI (animatsiya) =====
const AFLOW = [
  { ic: '📝', t: 'Login', note: 'Email + parol yuborasiz: POST /api/login' },
  { ic: '🏭', t: 'Server', note: 'Server tekshiradi, jwt.sign(SECRET) → token yasaydi' },
  { ic: '🎫', t: 'Token', note: 'Siz bilaguzuk (token) olasiz' },
  { ic: '📨', t: 'So\'rov', note: 'POST /api/products + Authorization: Bearer token' },
  { ic: '🛡️', t: 'Guard', note: 'Qo\'riqchi jwt.verify(SECRET) bilan imzoni tekshiradi' },
  { ic: '✅', t: 'Ruxsat', note: 'Imzo to\'g\'ri → 201 Created. Mahsulot qo\'shildi!' }
];
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [step, setStep] = useState(storedAnswer ? AFLOW.length - 1 : -1);
  const [playing, setPlaying] = useState(false);
  const timer = useRef(null);
  const done = step >= AFLOW.length - 1;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);
  const play = () => {
    if (playing) return; setPlaying(true); setStep(0); let s = 0;
    timer.current = setInterval(() => { s += 1; if (s >= AFLOW.length) { clearInterval(timer.current); setPlaying(false); return; } setStep(s); }, 900);
  };
  const cur = step >= 0 ? AFLOW[step] : null;
  return (
    <Stage eyebrow="To'liq oqim" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Oqimni ko'ring (▶)"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(12px,2vw,18px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Login'dan himoyalangan so'rovgacha — <span className="italic" style={{ color: T.accent }}>to'liq yo'l</span></h2></div>
        <Mentor>Hammasi birlashganda shunday bo'ladi: login → token → tokenni ko'rsatish → qo'riqchi tekshiradi (maxfiy kalit bilan) → ruxsat. <b style={{ color: T.accent }}>▶ tugmasini</b> bosib, butun oqimni kuzating.</Mentor>
        <div className="aflow">
          {AFLOW.map((n, i) => (
            <div key={i} className={`afnode ${step === i ? 'on' : ''} ${step > i ? 'past' : ''}`}>
              <span className="afnode-ic">{n.ic}</span>
              <span className="afnode-lbl">{n.t}</span>
            </div>
          ))}
        </div>
        <div className="jnote">
          {cur ? <p className="body fade-step" key={step} style={{ margin: 0, color: T.ink }}><span className="mono" style={{ color: T.accent, fontWeight: 700 }}>{step + 1}/{AFLOW.length}</span> &nbsp;{cur.note}</p>
            : <p className="small" style={{ margin: 0, color: T.ink3, fontStyle: 'italic' }}>▶ tugmasini bosing — auth oqimini boshlang</p>}
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          {!playing && <button className="btn" onClick={play}>{step < 0 ? '▶ Oqimni boshlash' : '↻ Qaytadan'}</button>}
          {done && !playing && <span className="mono small" style={{ color: T.success, alignSelf: 'center' }}>✓ Ruxsat berildi — 201 Created</span>}
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — TEST 4 =====
const Screen12 = (props) => (
  <QuestionScreen {...props} idx={12} scope="module-mikro" eyebrow="Mashq · 4-savol"
    questionText="Maxfiy kalitlarni (JWT_SECRET) qayerda saqlash to'g'ri?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>JWT_SECRET kabi maxfiy kalitlarni <span className="italic" style={{ color: T.accent }}>qayerga yozamiz?</span></h2></>}
    options={["To'g'ridan-to'g'ri kod ichiga", "Saytning HTML sahifasiga", ".env fayliga — kod uni process.env orqali o'qiydi, GitHub'ga ketmaydi", "Hech qayerda saqlamaymiz"]} correctIdx={2}
    explainCorrect="To'g'ri! Maxfiy kalitlar .env faylida saqlanadi. Kod ularni process.env orqali o'qiydi, .gitignore esa .env'ni GitHub'dan saqlaydi."
    explainWrong={{
      0: "Kod ichida bo'lsa — GitHub'ga ketadi va hamma ko'radi. Xavfli!",
      1: "HTML — bu eng ochiq joy, brauzerda hamma ko'radi. Eng xavflisi.",
      3: "Kalit kerak (imzo uchun), faqat uni xavfsiz — .env'da saqlaymiz.",
      default: "Maxfiy kalitlar → .env (process.env + .gitignore)."
    }} />
);

// ===== SCREEN 13 — AMALIYOT: login → token → himoyalangan so'rov =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  // 0: tokensiz POST (401), 1: login (token), 2: token bilan POST (201)
  const [step, setStep] = useState(storedAnswer ? 3 : 0);
  const [busy, setBusy] = useState(false);
  const done = step >= 3;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const act = () => { if (busy || done) return; setBusy(true); setTimeout(() => { setBusy(false); setStep(s => s + 1); }, 850); };
  const TASKS = [
    { label: "1. Tokensiz POST yuboring", btn: 'Send (tokensiz)', hint: "Avval tokensiz urinib ko'ring — qo'riqchi sizni kiritmaydi." },
    { label: "2. Login qiling — token oling", btn: '→ Kirish', hint: "Email + parol bilan login qiling, bilaguzuk (token) oling." },
    { label: "3. Token bilan POST yuboring", btn: 'Send (token bilan)', hint: "Endi bilaguzuk bilan — qo'riqchi sizni kiritadi." }
  ];
  const view = Math.min(step, 2);
  const cur = TASKS[view];
  return (
    <Stage eyebrow="Amaliyot" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : '3 qadamni bajaring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">To'liq aylanani <span className="italic" style={{ color: T.accent }}>o'zingiz sinab ko'ring</span></h2></div>
        <Mentor>Haqiqiy himoya aylanasini bajaring: tokensiz urinib ko'ring (401), keyin login qiling (token oling), so'ng token bilan qayta yuboring (201). Mana shu — har kuni ishlatiladigan auth jarayoni.</Mentor>
        <div className="split">
          <Col>
            <div className="stepbar">
              {TASKS.map((s, i) => <span key={i} className={`stepdot ${i < step ? 'done' : ''} ${i === step && !done ? 'cur' : ''}`}>{i < step ? '✓' : i + 1}</span>)}
            </div>
            {view === 0 && <Postman method="POST" url="/api/products" sent={step > 0} status={401} onSend={act} sending={busy} sendLabel="Send" authRow={<span className="mono small" style={{ color: T.danger }}>Authorization: (token yo'q)</span>}><JsonBox data={{ error: 'Unauthorized' }} /></Postman>}
            {view === 1 && <div className="loginform"><span className="lf-lbl">Email</span><div className="lf-field">ali@shop.uz</div><span className="lf-lbl">Parol</span><div className="lf-field">••••••••</div>{step === 1 ? <button className="btn" onClick={act}>{busy ? '⏳…' : '→ Kirish'}</button> : <div className="lf-token"><span className="mono small" style={{ color: T.success }}>✓ Token olindi</span><TokenCard small /></div>}</div>}
            {view === 2 && <Postman method="POST" url="/api/products" sent={done} status={201} onSend={act} sending={busy} sendLabel="Send" sendDisabled={done} authRow={<span className="mono small" style={{ color: T.success }}>Authorization: Bearer {TOKEN.h}…</span>}><JsonBox data={{ id: 4, nom: 'Mikrofon' }} /></Postman>}
          </Col>
          <Col>
            <p className="flow-label">Vazifa: {cur.label}</p>
            {done
              ? <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>🎉 Ajoyib! Tokensiz → 401, login → token, token bilan → 201. Mana shu — saytni himoyalashning to'liq yo'li.</p></div>
              : <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>{cur.hint}</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — DEBUGGING (secret kodda qolib ketgan) =====
const Screen14 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [found, setFound] = useState(!!storedAnswer);
  const [fixed, setFixed] = useState(!!storedAnswer);
  const done = fixed;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const LINES = [
    { id: 'l1', el: <><Kw>const</Kw>{` app = `}<Fn>express</Fn>{`()`}</>, bug: false },
    { id: 'l2', el: <><Kw>const</Kw>{` JWT_SECRET = `}<St>"super-secret-key-123"</St></>, bug: true },
    { id: 'l3', el: <>{`app.`}<Fn>listen</Fn>{`(`}<At>3000</At>{`)`}</>, bug: false }
  ];
  return (
    <Stage eyebrow="Tekshiruv · maxfiylik" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : (found ? 'Tuzating' : 'Xatoni toping')} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">AI kod yozdi — lekin bitta qator <span className="italic" style={{ color: T.danger }}>xavfli</span></h2></div>
        <Mentor>AI server kodini yozdi va GitHub'ga yuklamoqchi. Lekin bir qatorda <b style={{ color: T.danger }}>maxfiy kalit ochiq</b> turibdi — bu GitHub'da hammaga ko'rinadi! Xavfli qatorni toping va tuzating.</Mentor>
        <div className="split">
          <Col>
            <div className="ai-card fade-up delay-1">
              <div className="ai-row"><span className="ai-badge">AI</span><span className="ai-bubble">server.js:</span></div>
              <div className="ai-code">
                {LINES.map(l => {
                  if (l.bug && fixed) return <div key={l.id} className="ai-line ok" style={{ cursor: 'default' }}><Kw>const</Kw>{` JWT_SECRET = `}<At>process</At>{`.`}<At>env</At>{`.`}<At>JWT_SECRET</At></div>;
                  return <div key={l.id} className={`ai-line ${found && l.bug ? 'bad' : ''}`} onClick={() => { if (!found) setFound(l.bug); }}>{l.el}</div>;
                })}
              </div>
              {!found && <p className="ai-prompt">Qaysi qator maxfiylikni buzadi? Bosing.</p>}
              {found && !fixed && <button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={() => setFixed(true)}>🔧 process.env.JWT_SECRET'ga o'zgartirish</button>}
            </div>
          </Col>
          <Col>
            {!found
              ? <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Maslahat: kalit qiymati to'g'ridan-to'g'ri kodda yozilgan qatorni qidiring.</p></div>
              : !fixed
                ? <div className="frame-warn fade-step"><p className="note-h" style={{ color: T.danger }}>✓ Topdingiz!</p><p className="body" style={{ margin: 0, color: T.ink }}>Kalit kodda ochiq — GitHub'ga ketsa hamma ko'radi. Uni .env'ga ko'chirib, <span className="mono">process.env</span> orqali o'qiymiz. Chapdagi tugmani bosing →</p></div>
                : <div className="takeaway fade-step"><div className="ta-bulb">🔒</div><p className="ta-h">Maxfiy kalit endi .env'da</p><p className="ta-sub">Kodda hech qachon ochiq secret qoldirmang</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 15 — YAKUNIY: .env refactor =====
const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [value, setValue] = useState(storedAnswer?.picked || '');
  const [passed, setPassed] = useState(!!storedAnswer?.correct);
  const v = value.replace(/[‘’ʻ]/g, "'").replace(/[“”]/g, '"');
  const hasKey = /JWT_SECRET\s*=\s*\S+/.test(v);
  const valid = hasKey;
  useEffect(() => {
    if (valid && !passed) { setPassed(true); onAnswer(screen, { stage: 'final', screenIdx: screen, question: "Maxfiy kalitni .env'ga ko'chiring", studentAnswer: value, correct: true, firstAttemptCorrect: true, solved: true, picked: value }); }
  }, [valid]);
  const navLabel = passed ? 'Davom etish' : '.env qatorini yozing';
  return (
    <Stage eyebrow="Yakuniy · amaliy" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!passed} label={navLabel} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Maxfiy kalitni <span className="italic" style={{ color: T.success }}>.env'ga ko'chiring</span></h2></div>
        <Mentor>Kodda <span className="mono">JWT_SECRET</span> ochiq turibdi (chapda). Uni xavfsiz qiling: <b style={{ color: T.ink }}>.env</b> fayliga <span className="mono">JWT_SECRET=super-secret-key-123</span> deb yozing. Yozishingiz bilan kod avtomatik <span className="mono">process.env</span> orqali o'qishga o'tadi.</Mentor>
        <div className="split">
          <Col>
            <div className="vsc fade-up delay-1">
              <div className="vsc-bar"><span className="vsc-tab on"><span style={{ color: '#E2C08D' }}>📄</span> server.js</span><span className="vsc-tab"><span style={{ color: '#8CC84B' }}>🔒</span> .env</span></div>
              <div className="vsc-body">
                <div className="vsc-line"><span className="vsc-ln">1</span><span style={{ whiteSpace: 'pre' }}><span style={{ color: '#C586C0' }}>const</span> JWT_SECRET = {valid ? <span style={{ color: '#9CDCFE' }}>process.env.JWT_SECRET</span> : <span style={{ color: '#CE9178', background: 'rgba(194,65,12,0.25)', borderRadius: 4, padding: '0 3px' }}>"super-secret-key-123"</span>}</span></div>
              </div>
            </div>
            <p className="flow-label" style={{ marginTop: 2 }}>.env fayliga yozing</p>
            <div className="envinput-wrap">
              <span className="envinput-ic">🔒</span>
              <input className={`envinput ${valid ? 'ok' : ''}`} value={value} onChange={e => setValue(e.target.value)} placeholder="JWT_SECRET=super-secret-key-123" spellCheck={false} autoCapitalize="off" autoCorrect="off" />
            </div>
          </Col>
          <Col>
            <div className="fade-up delay-2" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="tagpill" style={{ opacity: hasKey ? 1 : 0.4 }}>{hasKey ? '✓' : '1'} JWT_SECRET=...</span>
              <span className="tagpill" style={{ opacity: valid ? 1 : 0.4 }}>{valid ? '✓' : '2'} kod process.env'ga o'tdi</span>
            </div>
            <div className={`ghub ${valid ? 'safe' : 'danger'}`}>
              <div className="gh-row"><span className="gh-eye">{valid ? '🔒' : '👁️'}</span><span className="mono small">{valid ? "GitHub: secret ko'rinmaydi" : "GitHub: secret ochiq ko'rinadi!"}</span></div>
            </div>
            {passed
              ? <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>🎉 Tabriklaymiz! Kalit endi <b>.env</b>'da, kod <span className="mono">process.env</span> orqali o'qiydi. <span className="mono">.gitignore</span>'ga <b>.env</b> qo'shing — va u hech qachon GitHub'ga ketmaydi. Siz saytni himoyaladingiz!</p></div>
              : <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>.env qatorini yozing: <span className="mono">KALIT=qiymat</span> ko'rinishida. Masalan <span className="mono">JWT_SECRET=super-secret-key-123</span>.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — YAKUN =====
const Screen16 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const RECAP = [
    "Autentifikatsiya = 'siz kimsiz?' (login)",
    "Login → JWT token (bilaguzuk): header.payload.signature",
    "Har so'rovda: Authorization: Bearer <token>",
    "Tokensiz himoyalangan route → 401; guard jwt.verify bilan tekshiradi",
    "Maxfiy kalitlar .env'da (process.env), GitHub'ga ketmaydi"
  ];
  const HOMEWORK = [
    { b: "Login qo'shing", t: "— loyihangizga POST /api/login va token tekshiruvini qo'shing" },
    { b: "Secretlarni .env'ga", t: "— barcha maxfiy kalitlarni .env'ga ko'chiring" },
    { b: ".gitignore", t: "— .env'ni .gitignore'ga qo'shing, hech qachon commit qilmang" }
  ];
  const GLOSSARY = [
    { b: 'Autentifikatsiya', t: "— kim ekanligingizni isbotlash (login)" },
    { b: 'JWT token', t: "— imzolangan 'bilaguzuk'" },
    { b: 'jwt.sign', t: "— login'da token yasaydi" },
    { b: 'jwt.verify', t: "— tokenni tekshiradi (guard)" },
    { b: 'Bearer', t: "— Authorization sarlavhasida token" },
    { b: '401', t: "— Unauthorized: token yo'q/soxta" },
    { b: '.env', t: "— maxfiy kalitlar fayli" },
    { b: 'process.env', t: "— kod .env'ni shu orqali o'qiydi" },
    { b: '.gitignore', t: "— .env'ni GitHub'dan saqlaydi" }
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
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">✓</span> Dars tugadi</span><h2 className="title h-title fade-up d1">Endi saytingiz <span className="italic" style={{ color: T.accent }}>himoyalangan</span>.</h2><p className="body h-sub fade-up d2">{PASSED ? "Tabriklaymiz! Login, JWT token, route himoyasi va .env bilan maxfiy kalitlarni boshqarishni o'rgandingiz." : "Yaxshi harakat! Token va .env mavzularini mustahkamlash uchun bir-ikki ekranni qayta ko'ring."}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span className="tick" style={{ width: 16, height: 16, borderRadius: '50%', background: T.success, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck">✓</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>📝 Uyga vazifa</div><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">Modul 5 (NestJS): @UseGuards, JWT strategy, role guard — autentifikatsiya va ruxsatlar professional, tartibli yoziladi! 🚀</p></div>
        </div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">💡 Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT — ({ lang, onFinished })
export default function AuthEnvLesson({ lang: langProp, onFinished }) {
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
        @keyframes shakex { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
        .shaking { animation: shakex 0.4s ease-in-out infinite; }

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
        .frame-warn { background: ${T.dangerSoft}; border-left: 4px solid ${T.danger}; border-radius: 12px; padding: 12px 15px; }
        .frame-dash { border: 1.5px dashed ${T.ink3}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); }

        .screen { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: clamp(14px,2vw,20px); }
        .head { display: flex; flex-direction: column; gap: 6px; }
        .split { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: clamp(18px,3vw,36px); align-items: start; }
        .col { display: flex; flex-direction: column; gap: clamp(12px,2vw,16px); min-width: 0; }
        @media (max-width: 760px) { .split { grid-template-columns: 1fr !important; gap: clamp(14px,3vw,20px); } }
        .flow-label { font-family: 'Manrope'; font-weight: 700; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: ${T.ink2}; }

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
        .ai-line { font-family: 'JetBrains Mono'; font-size: 12.5px; color: ${CODE.text}; cursor: pointer; padding: 7px 9px; border-radius: 6px; transition: all 0.15s; white-space: pre-wrap; } .ai-line:hover { background: rgba(255,255,255,0.06); }
        .ai-line.bad { background: rgba(194,65,12,0.22); box-shadow: inset 0 0 0 1px ${T.danger}; } .ai-line.ok { background: rgba(31,122,77,0.16); }
        .ai-prompt { font-size: 12px; color: ${T.ink3}; margin: 0; font-style: italic; } .note-h { font-weight: 700; font-size: 13px; margin: 0 0 4px; }
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

        /* === 4-MODUL · 7-DARS: AUTH + .env === */
        .code-box { background: ${CODE.bg}; color: ${CODE.text}; font-family: 'JetBrains Mono', monospace; font-size: clamp(11.5px,1.45vw,13px); line-height: 1.7; padding: 12px 14px; border-radius: 10px; overflow-x: auto; white-space: pre; margin: 0; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.2); }
        .code-box.clickable .cl-line { display: block; cursor: pointer; border-radius: 6px; padding: 2px 5px; margin: 0 -5px; transition: background 0.15s; }
        .code-box.clickable .cl-line:hover { background: rgba(255,255,255,0.06); }
        .code-box.clickable .cl-line.on { background: rgba(255,79,40,0.18); box-shadow: inset 0 0 0 1px ${T.accent}; }
        .code-box.envfile { cursor: pointer; transition: box-shadow 0.18s; }
        .code-box.hi { box-shadow: 0 0 0 2px ${T.accent}, 0 8px 22px -6px rgba(255,79,40,0.3); }

        .json-box { background: ${CODE.bg}; color: ${CODE.text}; font-family: 'JetBrains Mono', monospace; font-size: clamp(11.5px,1.45vw,13px); line-height: 1.6; padding: 11px 13px; border-radius: 10px; margin: 0; overflow-x: auto; white-space: pre; }
        .json-box.sm { font-size: 11.5px; padding: 9px 11px; }
        .json-box .j-key { color: ${CODE.attr}; } .json-box .j-str { color: ${CODE.str}; } .json-box .j-num { color: #7FB3FF; }

        .status-badge { font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 11.5px; padding: 3px 9px; border-radius: 7px; white-space: nowrap; }

        /* token = bilaguzuk */
        .tokencard { display: flex; align-items: center; gap: 10px; background: ${CODE.bg}; border-radius: 12px; padding: 12px 14px; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.22); overflow-x: auto; }
        .tokencard.sm { padding: 9px 11px; }
        .tk-ic { font-size: 22px; flex-shrink: 0; }
        .tk-jwt { font-family: 'JetBrains Mono', monospace; font-size: 13px; display: flex; align-items: center; gap: 2px; flex-wrap: wrap; }
        .jwt-part { font-family: 'JetBrains Mono', monospace; font-size: 12.5px; font-weight: 700; border: none; border-radius: 5px; padding: 3px 6px; cursor: pointer; transition: all 0.15s; background: transparent; }
        .jwt-part.h { color: #7FB3FF; } .jwt-part.p { color: ${CODE.attr}; } .jwt-part.s { color: ${CODE.str}; }
        .jwt-part.on { box-shadow: inset 0 0 0 1.5px currentColor; }
        .jwt-part:hover { background: rgba(255,255,255,0.08); }
        .jwt-dot { color: ${CODE.punct}; font-weight: 700; }

        /* login forma */
        .loginform { background: ${T.paper}; border-radius: 13px; padding: 16px 18px; display: flex; flex-direction: column; gap: 7px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.16); }
        .lf-lbl { font-family: 'Manrope'; font-weight: 700; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: ${T.ink3}; }
        .lf-field { font-family: 'JetBrains Mono'; font-size: 13px; color: ${T.ink}; background: ${T.bg}; border-radius: 8px; padding: 9px 12px; box-shadow: inset 0 0 0 1px #EFECE5; }
        .lf-token { display: flex; flex-direction: column; gap: 6px; margin-top: 4px; }

        /* postman (id33 davomi) */
        .postman { background: #fff; border-radius: 13px; overflow: hidden; box-shadow: 0 10px 26px -6px rgba(${T.shadowBase},0.18); }
        .pm-bar { display: flex; align-items: center; gap: 8px; padding: 9px 10px; background: #FBFAF7; border-bottom: 1px solid #EFECE5; }
        .pm-method { font-family: 'JetBrains Mono'; font-weight: 800; font-size: 13px; padding: 5px 10px; border-radius: 8px; background: ${T.bg}; flex-shrink: 0; }
        .pm-url { flex: 1; min-width: 0; font-size: 12.5px; font-weight: 600; color: ${T.ink}; overflow-x: auto; white-space: nowrap; padding: 4px 8px; background: #fff; border-radius: 7px; box-shadow: inset 0 0 0 1px #EFECE5; }
        .pm-send { font-family: 'Manrope'; font-weight: 700; font-size: 12.5px; color: #fff; background: ${T.accent}; border: none; border-radius: 8px; padding: 6px 16px; cursor: pointer; flex-shrink: 0; transition: all 0.16s; }
        .pm-send:hover:not(:disabled) { box-shadow: 0 6px 14px -5px rgba(255,79,40,0.5); }
        .pm-send:disabled { opacity: 0.4; cursor: not-allowed; }
        .pm-auth { padding: 8px 11px; border-bottom: 1px solid #EFECE5; font-size: 12px; background: #FFFDFA; }
        .authtoggle { display: flex; align-items: center; gap: 8px; cursor: pointer; font-family: 'JetBrains Mono'; font-size: 11.5px; color: ${T.ink2}; }
        .authtoggle input { width: 15px; height: 15px; accent-color: ${T.success}; cursor: pointer; }
        .pm-resp { padding: 10px 12px; }
        .pm-resp-h { display: flex; align-items: center; justify-content: space-between; margin-bottom: 7px; }
        .pm-resp-lbl { font-family: 'Manrope'; font-weight: 700; font-size: 9.5px; letter-spacing: 0.12em; text-transform: uppercase; color: ${T.ink3}; }
        .pm-loading { font-family: 'JetBrains Mono'; font-size: 13px; color: ${T.accent}; padding: 14px 4px; }
        .pm-empty { font-size: 12.5px; color: ${T.ink3}; font-style: italic; padding: 12px 4px; }

        /* qo'riqchi eshik */
        .guarddoor { display: flex; flex-direction: column; align-items: center; gap: 8px; background: ${T.paper}; border-radius: 13px; padding: 18px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.16); transition: all 0.25s; }
        .guarddoor.open { background: ${T.successSoft}; box-shadow: 0 0 0 2px ${T.success}, 0 8px 20px -6px rgba(31,122,77,0.25); }
        .guarddoor.block { background: ${T.dangerSoft}; box-shadow: 0 0 0 2px ${T.danger}, 0 8px 20px -6px rgba(194,65,12,0.25); }
        .gd-ic { font-size: 38px; }
        .gd-lbl { font-family: 'Manrope'; font-weight: 600; font-size: 13px; color: ${T.ink}; text-align: center; }

        /* GitHub indikatori */
        .ghub { border-radius: 12px; padding: 13px 15px; }
        .ghub.danger { background: ${T.dangerSoft}; box-shadow: inset 0 0 0 1.5px ${T.danger}; }
        .ghub.safe { background: ${T.successSoft}; box-shadow: inset 0 0 0 1.5px ${T.success}; }
        .gh-row { display: flex; align-items: center; gap: 9px; } .gh-eye { font-size: 18px; }

        /* auth qadamlar (s2) */
        .authsteps { display: flex; flex-direction: column; gap: 8px; }
        .authstep { font-family: 'Manrope'; font-weight: 600; font-size: 13.5px; text-align: left; border: none; border-radius: 11px; padding: 13px 15px; cursor: pointer; background: ${T.paper}; color: ${T.ink}; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.16); transition: all 0.16s; }
        .authstep:hover { transform: translateX(2px); }
        .authstep.on { background: ${T.accent}; color: #fff; box-shadow: 0 8px 18px -5px rgba(255,79,40,0.4); }
        .authstep.seen:not(.on) { background: #FBFAF7; }

        /* auth oqim animatsiyasi (s11) */
        .aflow { display: flex; justify-content: space-between; gap: 5px; flex-wrap: wrap; }
        .afnode { flex: 1; min-width: 0; display: flex; flex-direction: column; align-items: center; gap: 5px; background: ${T.paper}; border-radius: 12px; padding: 12px 4px; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.14); transition: all 0.25s; opacity: 0.5; }
        .afnode.on { opacity: 1; box-shadow: 0 0 0 2px ${T.accent}, 0 8px 18px -6px rgba(255,79,40,0.3); transform: translateY(-2px); }
        .afnode.past { opacity: 1; box-shadow: 0 0 0 1.5px ${T.success}; }
        .afnode-ic { font-size: 22px; } .afnode-lbl { font-family: 'Manrope'; font-weight: 700; font-size: 10.5px; color: ${T.ink}; text-align: center; }
        .jnote { background: ${T.paper}; border-radius: 11px; padding: 12px 15px; min-height: 46px; display: flex; align-items: center; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.12); }

        /* stepbar (s13) */
        .stepbar { display: flex; gap: 8px; }
        .stepdot { width: 26px; height: 26px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-family: 'JetBrains Mono'; font-weight: 700; font-size: 12px; background: ${T.bg}; color: ${T.ink3}; box-shadow: inset 0 0 0 1.5px rgba(${T.shadowBase},0.14); }
        .stepdot.cur { background: ${T.accent}; color: #fff; box-shadow: none; }
        .stepdot.done { background: ${T.successSoft}; color: ${T.success}; box-shadow: inset 0 0 0 1.5px ${T.success}; }

        /* do'kon (hook) */
        .shopmock { display: flex; gap: 8px; flex-wrap: wrap; align-items: center; min-height: 60px; }
        .shop-card { flex: 1; min-width: 84px; background: #fff; border-radius: 11px; padding: 12px; box-shadow: 0 4px 14px -6px rgba(${T.shadowBase},0.18); }
        .shop-name { font-family: 'Source Serif 4', serif; font-weight: 600; font-size: 13.5px; color: ${T.ink}; }
        .empty-shop { width: 100%; text-align: center; font-family: 'Manrope'; font-weight: 700; color: ${T.danger}; font-size: 15px; padding: 18px; }

        /* VS Code mock + .env input (final) */
        .vsc { background: #1E1E1E; border-radius: 13px; overflow: hidden; box-shadow: 0 10px 26px -6px rgba(${T.shadowBase},0.3); }
        .vsc-bar { background: #252526; display: flex; align-items: flex-end; }
        .vsc-tab { font-family: 'JetBrains Mono', monospace; font-size: 11.5px; color: #8B949E; background: #2D2D2D; padding: 8px 13px; display: inline-flex; align-items: center; gap: 6px; }
        .vsc-tab.on { background: #1E1E1E; color: #E6EDF3; box-shadow: inset 0 2px 0 #007ACC; }
        .vsc-body { padding: 12px 14px 14px 8px; font-family: 'JetBrains Mono', monospace; font-size: clamp(11.5px,1.5vw,13px); color: #D4D4D4; line-height: 2; }
        .vsc-line { display: flex; align-items: center; }
        .vsc-ln { color: #6E7681; min-width: 22px; text-align: right; margin-right: 14px; font-size: 11px; flex-shrink: 0; user-select: none; }
        .envinput-wrap { display: flex; align-items: center; gap: 8px; background: ${CODE.bg}; border-radius: 10px; padding: 4px 6px 4px 11px; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.2); }
        .envinput-ic { font-size: 16px; }
        .envinput { flex: 1; min-width: 0; background: transparent; border: 1px dashed #4b5563; border-radius: 7px; color: ${CODE.str}; font-family: 'JetBrains Mono', monospace; font-size: clamp(12px,1.5vw,13px); padding: 8px 10px; outline: none; transition: border-color 0.2s; }
        .envinput::placeholder { color: #5A6374; }
        .envinput.ok { border: 1.5px solid ${T.success}; }

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
