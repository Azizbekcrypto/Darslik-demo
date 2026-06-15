import React, { useState, useEffect, useRef, createContext, useContext, useCallback } from 'react';

// ============================================================
// BACKEND MODULI (4-MODUL) · 3-DARS — NODE.JS: BIRINCHI SERVER — PLATFORM STANDARD v16 (AUDIOSIZ)
// Mavzu: server nima (doim ishlaydigan dastur, so'rov→javob), Node.js (JS serverda — bir til ikki dunyo),
//        npm (tayyor asboblar do'koni — npm install express), Express (mashhur 5 qatorli server),
//        endpoint (eshik: GET /salom), NestJS (Express'ning kattaroq, tartibli, professional akasi — kodsiz),
//        lokalda yurgizish (node server.js → localhost:3000).
// Ko'prik: React darsida fetch('server') qildingiz — bugun o'sha JAVOB BERUVCHI serverni o'zingiz quryapsiz.
//          PEAN restorani: Node = oshxona, Express = ofitsiant, endpoint = xizmat oynasi.
// MUHIM: kelgusi darslar ro'yxati o'quvchiga AYTILMAYDI — faqat yakunda keyingi dars teaser.
// KOD TA'MI: Express serveri KO'RSATILADI (qismlari bosiladi); yakunda BITTA endpoint qatori YOZILADI.
//            Nest'ga urg'u beriladi (nega ancha yaxshi/tartibli), lekin Nest KODI ko'rsatilmaydi.
// AUDIOSIZ: ovoz (TTS) yo'q — platforma qarori.
// Yakuniy ekran (s15): VS Code — server.js, app.get('/salom', ...) endpoint'ini yozib, ▶ Run → brauzerda javob.
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

const LESSON_META = { lessonId: 'node-server-04-03-v16', lessonTitle: { uz: 'Node.js — birinchi serveringiz', ru: 'Node.js — первый сервер' } };
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

// ===== REACT-3 YORDAMCHILAR =====
const Jx = ({ children }) => <span style={{ color: CODE.tag }}>{children}</span>;
const At = ({ children }) => <span style={{ color: CODE.attr }}>{children}</span>;
const St = ({ children }) => <span style={{ color: CODE.str }}>{children}</span>;
const Win = ({ title, children, minH, hotTitle }) => (
  <div className="bp-window"><div className="bp-bar"><span className="bb-dots"><i /><i /><i /></span><span className="bp-title" style={hotTitle ? { color: T.accent, fontWeight: 700 } : undefined}>{title}</span></div><div className="bp-body" style={{ minHeight: minH, position: 'relative' }}>{children}</div></div>
);
// ===== 4-MODUL · 3-DARS YORDAMCHILAR (Node.js server) =====
// Server endpoint tugma-oynasi (manzil → javob)
const EpBtn = ({ method = 'GET', path, desc, active, onClick }) => (
  <button className={`epwin ${active ? 'on' : ''}`} onClick={onClick}>
    <span className="epmethod">{method}</span>
    <span className="eppath">{path}</span>
    {desc && <span className="epdesc">{desc}</span>}
  </button>
);
// Server holati nuqtasi (yoniq/o'chiq)
const ServerDot = ({ on }) => <span className="srv-dot" style={{ background: on ? T.success : T.ink3, boxShadow: on ? `0 0 8px ${T.success}` : 'none' }} />;
// Terminal/konsol qatori
const TLine = ({ cmd, out, dim }) => (
  <div className="el-in" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 'clamp(11.5px,1.4vw,13px)', lineHeight: 1.7, color: dim ? CODE.comment : CODE.text }}>
    {cmd ? <><span style={{ color: CODE.str }}>$</span> <span style={{ color: CODE.text }}>{cmd}</span></> : out}
  </div>
);

// ===== SCREEN 0 — HOOK (server yoq/yon: fetch'ga kim javob beradi?) =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [on, setOn] = useState(false);
  const [seen, setSeen] = useState(() => new Set(storedAnswer ? ['on', 'off'] : ['off']));
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const tried = seen.has('on') && seen.has('off');
  const toggle = () => setOn(v => { const nv = !v; setSeen(s => { const n = new Set(s); n.add(nv ? 'on' : 'off'); return n; }); return nv; });
  const OPTS = [
    { id: 'a', label: "Brauzerning o'zi javob beradi" },
    { id: 'b', label: "Internet o'zi avtomatik javob beradi" },
    { id: 'c', label: "Narigi tomonda turgan server dasturi — biz quradigan narsa" }
  ];
  const pick = (v) => { if (picked !== null || !tried) return; setPicked(v); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: true }); };
  return (
    <Stage eyebrow="Kirish" screen={screen} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 840 }}><span className="mono" style={{ color: T.accent }}>fetch</span> yozganingizda — narigi tomonda <span className="italic" style={{ color: T.accent }}>kim javob beradi</span>?</h1>
        <Mentor>React darsida <span className="mono">fetch('.../games')</span> yozib, serverdan ma'lumot oldingiz. Lekin so'rovga <b style={{ color: T.ink }}>kim javob berdi</b>? Bugun siz o'sha <b style={{ color: T.ink }}>javob beruvchini</b> — serverni — o'zingiz quradigan bo'lasiz. Avval tugmani bosib, server <b style={{ color: T.ink }}>yoniq</b> va <b style={{ color: T.ink }}>o'chiq</b> bo'lganda nima bo'lishini ko'ring.</Mentor>
        <Split>
          <Col>
            <button className="btn fade-up delay-1" style={{ alignSelf: 'flex-start' }} onClick={toggle}><ServerDot on={on} /> &nbsp;{on ? "Serverni o'chirish" : 'Serverni yoqish'}</button>
            <Win title="brauzer — fetch so'rovi" minH={120}>
              <pre className="code-box" style={{ marginBottom: 10 }}><Jx>{'fetch'}</Jx>{'('}<St>{"'http://localhost:3000/salom'"}</St>{')'}</pre>
              {on
                ? <div className="frame-success demo-swap" style={{ padding: '10px 13px' }}><p className="body" style={{ margin: 0, color: T.ink }}>✓ Javob: <b style={{ color: T.success }}>"Salom, dunyo!"</b></p></div>
                : <div className="frame-warn demo-swap" style={{ padding: '10px 13px' }}><p className="body" style={{ margin: 0, color: T.ink }}>❌ <span className="mono">ECONNREFUSED</span> — ulanib bo'lmadi</p></div>}
            </Win>
            <p className="mono small" style={{ margin: 0, color: on ? T.success : T.accent }}>{on ? 'server yoniq → javob bor' : 'server o\'chiq → javob yo\'q'}</p>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Sizningcha, fetch'ga kim javob beradi?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => {
                const sel = picked === o.id;
                return (
                  <button key={o.id} className={`hook-option ${sel ? 'on' : ''}`} disabled={picked !== null || !tried} style={{ opacity: !tried ? 0.55 : 1 }} onClick={() => pick(o.id)}>
                    <span className="radio">{sel && <span className="radio-dot" />}</span>
                    <span>{o.label}</span>
                  </button>
                );
              })}
            </div>
            {!tried && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>Avval serverni yoqib-o'chirib ko'ring ←</p>}
            {picked !== null && <p className="hook-ack fade-step">Aynan! fetch'ga <b>server dasturi</b> javob beradi — o'sha o'chsa, hech kim javob bermaydi (ECONNREFUSED). Bugun shu serverni Node.js bilan o'zingiz yozasiz va yoqasiz.</p>}
          </Col>
        </Split>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const STEPS = [
    { text: "Server nima — doim ishlaydigan dastur", tag: "so'rov → javob" },
    { text: "Node.js — JS serverda ishlaydi", tag: 'bir til, ikki dunyo' },
    { text: "npm — tayyor asboblar do'koni", tag: 'npm install' },
    { text: "Express — oson server", tag: 'app.get' },
    { text: "Endpoint + serverni yurgizish", tag: 'localhost:3000' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const PreviewBlock = (
    <Col>
      <p className="flow-label">Dars oxirida — sizning serveringiz</p>
      <Win title="brauzer — localhost:3000/salom" minH={96}>
        <div className="fade-up delay-1" style={{ fontFamily: 'Georgia, serif', fontSize: 20, color: T.ink, padding: '6px 2px' }}>Salom, dunyo!</div>
        <p className="mono small" style={{ margin: '4px 0 0', color: T.success }}>✓ serveringiz javob berdi</p>
      </Win>
      <p className="mono small" style={{ color: T.accent, margin: 0 }}>→ shu javobni dars oxirida o'zingiz yozasiz va ishga tushirasiz</p>
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
        <div className="head"><h2 className="title h-title fade-up">Birinchi serveringizni <span className="italic" style={{ color: T.accent }}>5 qadamda</span> quramiz</h2></div>
        <Mentor>Va'da: dars oxirida <b style={{ color: T.ink }}>haqiqiy serverni</b> o'zingiz yozib, ishga tushirasiz — va brauzerda uning javobini ko'rasiz. Eng zo'r tomoni: server ham <b style={{ color: T.ink }}>JavaScript</b>'da yoziladi — siz buni allaqachon bilasiz!</Mentor>
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

// ===== SCREEN 2 — SERVER NIMA =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [on, setOn] = useState(!!storedAnswer);
  const [req, setReq] = useState(storedAnswer ? 1 : 0);
  const done = on && req >= 1;
  const knock = () => { if (on) setReq(r => r + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Server nima" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : (!on ? 'Avval serverni yoqing' : "So'rov yuboring")} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Server <span className="italic" style={{ color: T.accent }}>aslida nima</span> — maxsus mashinami?</h2></div>
        <Mentor>Ko'pchilik "server" deganda alohida kompyuter tasavvur qiladi. Aslida server — bu <b style={{ color: T.ink }}>dastur</b>! U <b style={{ color: T.ink }}>doim ishlab turadi</b>, eshigi ochiq do'kon kabi: kimdir so'rov yuborsa — javob beradi. Serverni yoqing, keyin "so'rov" yuborib ko'ring.</Mentor>
        <div className="split">
          <Col>
            <button className="btn fade-up delay-1" style={{ alignSelf: 'flex-start' }} onClick={() => setOn(v => !v)}><ServerDot on={on} /> &nbsp;{on ? 'Server YONIQ' : 'Serverni yoqish'}</button>
            <Win title="server holati" minH={120}>
              {on
                ? <div className="demo-swap" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <p className="mono small" style={{ margin: 0, color: T.success }}>● ishlayapti — so'rov kutyapti…</p>
                    <button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={knock}>📨 So'rov yuborish</button>
                    {req > 0 && <div className="frame-success" style={{ padding: '9px 12px' }}><p className="body" style={{ margin: 0, color: T.ink }}>✓ Server javob berdi! (jami {req} ta so'rov)</p></div>}
                  </div>
                : <p style={{ color: T.ink3, fontStyle: 'italic', margin: 0, fontFamily: 'Georgia, serif', fontSize: 13 }}>Server o'chiq — hech kim javob bermaydi. Avval yoqing.</p>}
            </Win>
          </Col>
          <Col>
            <div className="sk-info">
              <span className="sk-tagbig"><span className="sk-wordbadge">Server = dastur</span></span>
              <p className="body" style={{ color: T.ink, margin: '11px 0 0' }}>Doim ishlab turadigan, <b>so'rovlarni kutadigan</b> va <b>javob qaytaradigan</b> dastur. U yopilsa — javob ham yo'qoladi.</p>
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana shu — server. So'rov kutadi, javob beradi. Endi savol: bunday dasturni qaysi tilda yozamiz? Javob — <b>JavaScript</b> (Node.js bilan)!</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — NODE.JS =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [ran, setRan] = useState(!!storedAnswer);
  const done = ran;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Node.js" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Kodni ishga tushiring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">JavaScript faqat <span className="italic" style={{ color: T.accent }}>brauzerda yashaydimi</span>?</h2></div>
        <Mentor>Ilgari JavaScript faqat brauzer ichida ishlardi. <b style={{ color: T.ink }}>Node.js</b> buni o'zgartirdi: endi JS <b style={{ color: T.ink }}>serverda ham</b> ishlaydi — bir til, ikki dunyo! Demak siz bilgan JavaScript bilan backend ham yozasiz. Tugmani bosing — bir xil kod ikki joyda ishlaydi.</Mentor>
        <div className="split">
          <Col>
            <pre className="code-box fade-up delay-1"><Jx>{'console'}</Jx>{'.'}<Jx>{'log'}</Jx>{'('}<St>{"'Salom!'"}</St>{')'}</pre>
            {!ran && <button className="btn fade-up delay-2" style={{ alignSelf: 'flex-start' }} onClick={() => setRan(true)}>▶ Kodni ishga tushirish</button>}
          </Col>
          <Col>
            <p className="flow-label">Brauzer (frontend)</p>
            <Win title="brauzer konsoli" minH={52}>{ran ? <TLine out={<span style={{ color: CODE.str }}>Salom!</span>} /> : <span style={{ color: T.ink3, fontFamily: 'Georgia, serif', fontStyle: 'italic', fontSize: 13 }}>kutilmoqda…</span>}</Win>
            <p className="flow-label" style={{ marginTop: 2 }}>Server (Node.js)</p>
            <div className="code-box" style={{ padding: '9px 13px', minHeight: 46 }}>{ran ? <TLine cmd="node app.js" /> : <span style={{ color: CODE.comment, fontFamily: "'JetBrains Mono'", fontSize: 12 }}>terminal…</span>}{ran && <TLine out={<span style={{ color: CODE.str }}>Salom!</span>} />}</div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bir xil JS kodi — brauzerda ham, Node.js bilan serverda ham ishladi! Mana shu Node'ning kuchi: <b>siz bilgan til endi backend uchun ham</b>.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 (Node.js) =====
const Screen4 = (props) => (
  <QuestionScreen {...props} idx={4} scope="module-mikro" eyebrow="Mashq · 1-savol"
    questionText="Node.js nima imkon beradi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}><span className="mono" style={{ color: T.accent }}>Node.js</span> nima imkon beradi?</h2></>}
    options={["JavaScript'ni brauzerdan tashqarida — serverda ishga tushirish", "Faqat HTML yozish", "Internetni tezlatish", "Rasmlarni tahrirlash"]} correctIdx={0}
    explainCorrect="To'g'ri! Node.js JavaScript'ni brauzerdan tashqarida — serverda/kompyuterda ishlatish imkonini beradi. Shuning uchun backend ham JS'da yoziladi."
    explainWrong={{
      1: "Yo'q — Node JS uchun. HTML alohida narsa.",
      2: "Yo'q — Node internetni tezlatmaydi; u JS'ni serverda ishlatadi.",
      3: "Yo'q — bu boshqa dasturlar ishi. Node — JS'ni serverda ishlatadi.",
      default: "Node.js — JS'ni serverda ishlatish imkoni."
    }} />
);

// ===== SCREEN 5 — npm =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [phase, setPhase] = useState(storedAnswer ? 'done' : 'idle'); // idle | installing | done
  const timer = useRef(null);
  const done = phase === 'done';
  useEffect(() => () => clearTimeout(timer.current), []);
  const install = () => { setPhase('installing'); timer.current = setTimeout(() => setPhase('done'), 1100); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="npm" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "express'ni o'rnating"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Har narsani <span className="italic" style={{ color: T.accent }}>noldan yozish</span> shartmi?</h2></div>
        <Mentor>Yo'q! <b style={{ color: T.ink }}>npm</b> — bu tayyor asboblar do'koni (millionlab paketlar). Bitta buyruq bilan kerakli vositani o'rnatasiz: <span className="mono">npm install express</span>. Buni React darsida ham ko'rgansiz (<span className="mono">npm create vite</span>)! Tugmani bosib, express'ni o'rnating.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">Terminal</p>
            <div className="code-box" style={{ minHeight: 80 }}>
              {phase === 'idle' && <TLine out={<span style={{ color: CODE.comment }}># express'ni o'rnatishga tayyor</span>} />}
              {phase !== 'idle' && <TLine cmd="npm install express" />}
              {phase === 'installing' && <TLine out={<span style={{ color: CODE.attr }}>⏳ yuklanmoqda…</span>} />}
              {phase === 'done' && <><TLine out={<span style={{ color: CODE.str }}>+ express o'rnatildi ✓</span>} /><TLine out={<span style={{ color: CODE.comment }}>added 57 packages</span>} /></>}
            </div>
            {phase === 'idle' && <button className="btn fade-up delay-1" style={{ alignSelf: 'flex-start' }} onClick={install}>⬇ npm install express</button>}
          </Col>
          <Col>
            <p className="flow-label">package.json — o'rnatilgan asboblar</p>
            <pre className="code-box">{'{'}{'\n'}{'  '}<At>"dependencies"</At>{': {'}{'\n'}{'    '}{done ? <St>"express": "^4.18.0"</St> : <span style={{ color: CODE.comment }}>// hali bo'sh</span>}{'\n'}{'  }'}{'\n'}{'}'}</pre>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>express o'rnatildi va <span className="mono">package.json</span>'ga yozildi. Endi uni kodimizda ishlatsak bo'ladi. npm — sizning <b>asboblar do'koningiz</b>.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 5b — TEST 2 (npm) =====
const Screen5b = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Tekshiruv"
    questionText="npm nima qiladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Mustahkamlash</p><h2 className="title h-sub" style={{ marginTop: 8 }}><span className="mono" style={{ color: T.accent }}>npm</span> nima qiladi?</h2></>}
    options={["Serverni o'chiradi", "Tayyor asboblarni (paketlarni) o'rnatadi — masalan express", "Kodni o'chiradi", "Internetga ulaydi"]} correctIdx={1}
    explainCorrect="To'g'ri! npm (Node Package Manager) — tayyor kutubxonalarni o'rnatadigan asboblar do'koni. npm install express bilan Express'ni o'rnatdik."
    explainWrong={{
      0: "Yo'q — npm serverni o'chirmaydi. U tayyor paketlarni o'rnatadi.",
      2: "Aksincha — npm kod qo'shadi (paket o'rnatadi), o'chirmaydi.",
      3: "Yo'q — npm paketlarni o'rnatadi (asboblar do'koni).",
      default: "npm — tayyor paketlarni o'rnatuvchi."
    }} />
);

// ===== SCREEN 6 — EXPRESS (mashhur 5 qatorli server) =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const PARTS = {
    req: { word: "require('express')", info: <>O'rnatgan Express asbobini kodga <b>chaqirib olamiz</b>. Endi undan foydalansa bo'ladi.</> },
    app: { word: 'const app = express()', info: <>Serverimizning <b>o'zini yaratamiz</b> — nomi <span className="mono">app</span>. Hamma narsa shu <span className="mono">app</span> orqali bo'ladi.</> },
    get: { word: "app.get('/salom', ...)", info: <>Bitta <b>endpoint</b> (eshik) ochamiz: kimdir <span className="mono">/salom</span> manziliga so'rov yuborsa — javob beramiz.</> },
    send: { word: 'res.send(...)', info: <>So'rovga <b>javob qaytarish</b>: <span className="mono">res.send('Salom, dunyo!')</span> — mijozga shu matn boradi.</> },
    listen: { word: 'app.listen(3000)', info: <>Serverni <b>yoqadi</b> va 3000-portda so'rov kuta boshlaydi. Busiz server ishlamaydi!</> }
  };
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(storedAnswer ? new Set(Object.keys(PARTS)) : new Set());
  const done = seen.size >= 3;
  const tap = (k) => { setActive(k); setSeen(p => { const s = new Set(p); s.add(k); return s; }); };
  const hl = (k) => ({ cursor: 'pointer', borderRadius: 5, padding: '1px 3px', background: active === k ? 'rgba(255,79,40,0.2)' : (seen.has(k) ? 'rgba(31,122,77,0.14)' : 'transparent'), transition: 'all 0.15s' });
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Express" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/3 qism o'rganildi`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Butun serverni <span className="italic" style={{ color: T.accent }}>5 qatorda</span> yozsa bo'ladimi?</h2></div>
        <Mentor>Ha! <b style={{ color: T.ink }}>Express</b> — serverni juda osonlashtiradi. Mana mashhur "Salom, dunyo" serveri — bor-yo'g'i bir necha qator. Har bir rangli qismni bosib, nima qilishini o'rganing.</Mentor>
        <div className="split">
          <Col>
            <pre className="code-box fade-up delay-1" style={{ lineHeight: 2 }}>
              <Jx>{'const'}</Jx>{' '}<At>express</At>{' = '}<span style={hl('req')} onClick={() => tap('req')}><Jx>{'require'}</Jx>{'('}<St>{"'express'"}</St>{')'}</span>{'\n'}
              <span style={hl('app')} onClick={() => tap('app')}><Jx>{'const'}</Jx>{' '}<At>app</At>{' = '}<At>express</At>{'()'}</span>{'\n\n'}
              <span style={hl('get')} onClick={() => tap('get')}><At>app</At>{'.'}<Jx>{'get'}</Jx>{'('}<St>{"'/salom'"}</St>{', ('}<At>req</At>{', '}<At>res</At>{') => {'}</span>{'\n'}
              {'  '}<span style={hl('send')} onClick={() => tap('send')}><At>res</At>{'.'}<Jx>{'send'}</Jx>{'('}<St>{"'Salom, dunyo!'"}</St>{')'}</span>{'\n'}
              {'})'}{'\n\n'}
              <span style={hl('listen')} onClick={() => tap('listen')}><At>app</At>{'.'}<Jx>{'listen'}</Jx>{'('}<St>3000</St>{')'}</span>
            </pre>
          </Col>
          <Col>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <p className="flow-label" style={{ margin: 0 }}>Qismni bosing</p>
              <span className="small mono" style={{ color: done ? T.success : T.ink3 }}>{seen.size} / 5 ko'rildi</span>
            </div>
            {active ? <div className="sk-info" key={active}><span className="sk-tagbig"><span className="sk-wordbadge mono">{PARTS[active].word}</span></span><p className="body" style={{ color: T.ink, margin: '11px 0 0' }}>{PARTS[active].info}</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Koddan bir qismni bosing</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana butun server! Asbobni chaqir → app yarat → endpoint och → javob ber → yoq. Endi <b>endpoint</b>ni chuqurroq ko'ramiz.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — ENDPOINT =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const EPS = [
    { path: '/salom', desc: 'salomlashish', reply: 'Salom, dunyo!' },
    { path: '/vaqt', desc: 'hozirgi vaqt', reply: '14:30' },
    { path: '/games', desc: "o'yinlar ro'yxati", reply: "['Adopt Me', 'Blox Fruits']" }
  ];
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(storedAnswer ? new Set(EPS.map(e => e.path)) : new Set());
  const done = seen.size >= 3;
  const tap = (p) => { setActive(p); setSeen(s => { const n = new Set(s); n.add(p); return n; }); };
  const cur = EPS.find(e => e.path === active);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Endpoint" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/3 eshik ochildi`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bitta server <span className="italic" style={{ color: T.accent }}>nechta so'rovga</span> javob bera oladi?</h2></div>
        <Mentor>Istalgancha! Har bir <b style={{ color: T.ink }}>endpoint</b> — alohida <b style={{ color: T.ink }}>eshik (manzil)</b>, har biri bitta ishni qiladi. <span className="mono">/salom</span> salom beradi, <span className="mono">/vaqt</span> vaqtni, <span className="mono">/games</span> o'yinlarni qaytaradi. Frontend aynan shu manzillarga <span className="mono">fetch</span> qiladi. Har eshikni bosib ko'ring.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">Server eshiklari — bosing</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {EPS.map(e => <EpBtn key={e.path} path={e.path} desc={e.desc} active={active === e.path} onClick={() => tap(e.path)} />)}
            </div>
          </Col>
          <Col>
            <p className="flow-label">Javob</p>
            <Win title={cur ? `brauzer — localhost:3000${cur.path}` : 'brauzer'} minH={90}>
              {cur ? <div className="demo-swap"><p className="mono small" style={{ color: T.ink3, margin: '0 0 6px' }}>GET {cur.path}</p><div style={{ fontFamily: 'Georgia, serif', fontSize: 16, color: T.ink }}>{cur.reply}</div></div>
                : <p style={{ color: T.ink3, fontStyle: 'italic', margin: 0, fontFamily: 'Georgia, serif', fontSize: 13 }}>Eshikni bosing — javobi shu yerda chiqadi</p>}
            </Win>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Har endpoint — bitta manzil, bitta javob. Kodda har biri <span className="mono">app.get('/manzil', ...)</span> bilan ochiladi. Frontend shu manzillarga so'rov yuboradi.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — NEST (urg'u: kattaroq, tartibli, professional) =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const ADV = [
    { id: 'order', t: 'Tartib (modullar)', d: "Kod papkalar va modullarga ajraladi — katta loyihada ham adashmaysiz." },
    { id: 'team', t: 'Jamoa uchun', d: "Ko'p dasturchi birga ishlaganda hamma bir xil tartibga amal qiladi." },
    { id: 'ts', t: 'TypeScript', d: "Xatolarni oldindan ushlaydi — ishonchli, professional kod." },
    { id: 'scale', t: 'Kattalashishga tayyor', d: "Loyiha o'ssa ham chidaydi — yirik kompaniyalar aynan shuni ishlatadi." }
  ];
  const [seen, setSeen] = useState(storedAnswer ? new Set(ADV.map(a => a.id)) : new Set());
  const [active, setActive] = useState(storedAnswer ? 'order' : null);
  const done = seen.size >= 2 || !!storedAnswer;
  const tap = (a) => { setActive(a.id); setSeen(p => { const s = new Set(p); s.add(a.id); return s; }); };
  const cur = ADV.find(a => a.id === active);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="NestJS" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/2 ustunlik ko'ring`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Loyiha kattalashsa — <span className="italic" style={{ color: T.accent }}>Express yetadimi</span>?</h2></div>
        <Mentor>Express oson va tez — boshlash uchun ideal. Lekin loyiha <b style={{ color: T.ink }}>kattalashganda</b> tartib kerak bo'ladi. Aynan shu yerda <b style={{ color: T.accent }}>NestJS</b> keladi: u Express ustiga qurilgan, lekin <b style={{ color: T.ink }}>ancha tartibli va kuchli</b> — yirik, professional backendlar uchun. Bugun Express bilan boshlaymiz; lekin jiddiy loyiha = Nest. Ustunliklarini ko'ring.</Mentor>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <div className="cmp-card"><p className="cmp-h">Express</p><p className="small" style={{ color: T.ink2, margin: 0 }}>Kichik, tez, oddiy. Birinchi qadam uchun zo'r.</p></div>
              <div className="cmp-card hot"><p className="cmp-h" style={{ color: T.accent }}>NestJS ★</p><p className="small" style={{ color: T.ink2, margin: 0 }}>Tartibli, kuchli, professional. Katta loyihalar uchun.</p></div>
            </div>
            <p className="flow-label" style={{ marginTop: 2 }}>Nest nega yaxshi — bosing</p>
            <div className="fade-up delay-2" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {ADV.map(a => <button key={a.id} className={`chip ${active === a.id ? 'chip-on' : ''}`} onClick={() => tap(a)}>{a.t} {seen.has(a.id) ? '✓' : ''}</button>)}
            </div>
          </Col>
          <Col>
            {cur ? <div className="sk-info" key={cur.id}><span className="sk-tagbig"><span className="sk-wordbadge">{cur.t}</span></span><p className="body" style={{ color: T.ink, margin: '10px 0 0' }}>{cur.d}</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Nest ustunligini bosing</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Yodda tuting: <b>Express = birinchi qadam</b> (oson), <b>NestJS = professional daraja</b> (tartibli, kuchli). Keyingi modulda Nest bilan jiddiy backend quramiz. Bugun esa — birinchi Express serverni!</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 9 — TEST 3 (endpoint) =====
const Screen9 = (props) => (
  <QuestionScreen {...props} idx={9} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="Endpoint nima?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}><span className="mono" style={{ color: T.accent }}>Endpoint</span> nima?</h2></>}
    options={["Serverning aniq manzili (eshigi) — bitta so'rovga javob beradi", "Serverni o'chiruvchi tugma", "Ma'lumotlar bazasi", "Brauzer turi"]} correctIdx={0}
    explainCorrect="To'g'ri! Endpoint — serverning aniq manzili (masalan /salom), u bitta so'rovga javob beradi. Frontend shu manzilga fetch qiladi."
    explainWrong={{
      1: "Yo'q — endpoint manzil (eshik), o'chirish tugmasi emas.",
      2: "Yo'q — baza alohida. Endpoint — serverga kirish manzili.",
      3: "Yo'q — brauzer turi emas. Endpoint = server manzili (/salom).",
      default: "Endpoint — serverning manzili (eshigi), bitta so'rovga javob beradi."
    }} />
);

// ===== SCREEN 10 — LOKALDA YURGIZISH =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [phase, setPhase] = useState(storedAnswer ? 'done' : 'idle'); // idle | starting | done
  const timer = useRef(null);
  const done = phase === 'done';
  useEffect(() => () => clearTimeout(timer.current), []);
  const run = () => { setPhase('starting'); timer.current = setTimeout(() => setPhase('done'), 1000); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Lokalda yurgizish" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Serverni ishga tushiring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Serveringizni qanday <span className="italic" style={{ color: T.accent }}>"yoqasiz"</span>?</h2></div>
        <Mentor>Serverni ishga tushirish uchun terminalga bitta buyruq: <span className="mono">node server.js</span>. U yonadi va <span className="mono">localhost:3000</span> manzilida so'rov kuta boshlaydi. <b style={{ color: T.ink }}>localhost</b> = sizning o'z kompyuteringiz server bo'lib turibdi! Tugmani bosib, serverni yoqing va brauzerda ochib ko'ring.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">Terminal</p>
            <div className="code-box" style={{ minHeight: 78 }}>
              {phase === 'idle' && <TLine out={<span style={{ color: CODE.comment }}># serverni ishga tushirishga tayyor</span>} />}
              {phase !== 'idle' && <TLine cmd="node server.js" />}
              {phase === 'starting' && <TLine out={<span style={{ color: CODE.attr }}>⏳ ishga tushyapti…</span>} />}
              {phase === 'done' && <TLine out={<span style={{ color: CODE.str }}>✓ Server localhost:3000 da ishlayapti</span>} />}
            </div>
            {phase === 'idle' && <button className="btn fade-up delay-1" style={{ alignSelf: 'flex-start' }} onClick={run}>▶ node server.js</button>}
          </Col>
          <Col>
            <p className="flow-label">Brauzer</p>
            <Win title="localhost:3000/salom" minH={92} hotTitle={done}>
              {done ? <div className="demo-swap" style={{ fontFamily: 'Georgia, serif', fontSize: 19, color: T.ink }}>Salom, dunyo!</div>
                : <p style={{ color: T.ink3, fontStyle: 'italic', margin: 0, fontFamily: 'Georgia, serif', fontSize: 13 }}>Server o'chiq — sahifa ochilmaydi…</p>}
            </Win>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Server yoqildi! Brauzerda <span className="mono">localhost:3000/salom</span> ochilsa — sizning serveringiz javob beryapti. <b>localhost = o'z kompyuteringiz</b>.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — VIBECODING (AI yangi endpoint qo'shadi) =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const TASKS = [
    { id: 'vaqt', label: "/vaqt endpoint qo'shib ber — hozirgi vaqtni qaytarsin", path: '/vaqt', reply: '14:30' },
    { id: 'games', label: "/games endpoint qo'shib ber — o'yinlar ro'yxatini qaytarsin", path: '/games', reply: "['Adopt Me', 'Blox Fruits']" },
    { id: 'ism', label: "/ism endpoint qo'shib ber — ismimni qaytarsin", path: '/ism', reply: 'Ali' }
  ];
  const [task, setTask] = useState(null);
  const [phase, setPhase] = useState(storedAnswer ? 'done' : 'idle');
  const timer = useRef(null);
  const done = phase === 'done';
  useEffect(() => () => clearTimeout(timer.current), []);
  const choose = (id) => { clearTimeout(timer.current); setTask(id); setPhase('planned'); };
  const approve = () => { clearTimeout(timer.current); setPhase('building'); timer.current = setTimeout(() => setPhase('done'), 1000); };
  const cur = TASKS.find(t => t.id === task) || (storedAnswer ? TASKS[0] : null);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Keyingi qadam · AI" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "AI'ga endpoint buyuring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Yangi endpoint kerakmi? <span className="italic" style={{ color: T.accent }}>AI'ga buyuring</span> — siz tekshiring.</h2></div>
        <Mentor>Endi siz Express kodini <b style={{ color: T.ink }}>o'qiy olasiz</b>! Buyruq bering, AI <span className="mono">app.get(...)</span> yozadi — siz tekshirasiz: manzil to'g'rimi, <span className="mono">res.send</span> bormi. Keyin natijani brauzerda ko'rasiz. Boshliq — siz.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">1. AI'ga buyuring</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {TASKS.map(t => <button key={t.id} className={`chip ${task === t.id ? 'chip-on' : ''}`} onClick={() => choose(t.id)} style={{ justifyContent: 'flex-start', textAlign: 'left' }}>"{t.label}"</button>)}
            </div>
            {!cur && <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Yuqoridan bitta buyruqni tanlang</p></div>}
            {cur && (
              <div className="ai-card fade-step" key={task || 'stored'}>
                <div className="ai-row"><span className="ai-badge">AI</span><span className="ai-bubble">{phase === 'planned' ? 'Mana endpoint kodi — tasdiqlaysizmi?' : (phase === 'building' ? 'Yozyapman…' : 'Qo\'shdim — tekshiring')}</span></div>
                {phase !== 'planned' || true ? <pre className="code-box" style={{ fontSize: 12 }}><At>app</At>{'.'}<Jx>{'get'}</Jx>{'('}<St>{"'" + cur.path + "'"}</St>{', ('}<At>req</At>{', '}<At>res</At>{') => {'}{'\n'}{'  '}<At>res</At>{'.'}<Jx>{'send'}</Jx>{'('}<St>{"'" + cur.reply + "'"}</St>{')'}{'\n'}{'})'}</pre> : null}
                {phase === 'planned' && <button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={approve}>Kodni qo'shish</button>}
                {phase === 'done' && <p className="ai-prompt" style={{ color: T.success, fontStyle: 'normal', fontWeight: 600 }}>✓ endpoint qo'shildi</p>}
              </div>
            )}
          </Col>
          <Col>
            <p className="flow-label">2. Natija — brauzerda sinang</p>
            <Win title={cur ? `localhost:3000${cur.path}` : 'brauzer'} minH={92}>
              {done && cur ? <div className="demo-swap"><p className="mono small" style={{ color: T.ink3, margin: '0 0 6px' }}>GET {cur.path}</p><div style={{ fontFamily: 'Georgia, serif', fontSize: 16, color: T.ink }}>{cur.reply}</div></div>
                : <p style={{ color: T.ink3, fontStyle: 'italic', margin: 0, fontFamily: 'Georgia, serif', fontSize: 13 }}>Buyruq bering va kodni tasdiqlang…</p>}
            </Win>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>AI endpoint yozdi, siz <b>kodni o'qib tekshirdingiz</b> va brauzerda sinadingiz. <span className="mono">app.get</span> + <span className="mono">res.send</span> — hammasi joyida!</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — TEST 4 (app.listen) =====
const Screen12 = (props) => (
  <QuestionScreen {...props} idx={12} scope="module-mikro" eyebrow="Mashq · 4-savol"
    questionText="app.listen(3000) nima qiladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}><span className="mono" style={{ color: T.accent }}>app.listen(3000)</span> nima qiladi?</h2></>}
    options={["Serverni o'chiradi", "Serverni yoqadi va 3000-portda so'rov kuta boshlaydi", "Yangi endpoint yaratadi", "Ma'lumot o'chiradi"]} correctIdx={1}
    explainCorrect="To'g'ri! app.listen(3000) serverni ishga tushiradi va 3000-portda so'rovlarni kuta boshlaydi. Busiz server umuman ishlamaydi."
    explainWrong={{
      0: "Aksincha — listen serverni YOQADI, o'chirmaydi.",
      2: "Yo'q — endpoint app.get bilan yaratiladi. listen — serverni yoqadi.",
      3: "Yo'q — listen ma'lumotga tegmaydi, u serverni ishga tushiradi.",
      default: "app.listen — serverni yoqadi va port kuta boshlaydi."
    }} />
);

// ===== SCREEN 13 — BUILDER (server qismlarini tartiblash) =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const ORDER = [
    { id: 'req', label: "require('express')", hint: 'asbobni chaqir' },
    { id: 'app', label: 'const app = express()', hint: 'serverni yarat' },
    { id: 'get', label: "app.get('/salom', ...)", hint: 'endpoint och' },
    { id: 'listen', label: 'app.listen(3000)', hint: 'serverni yoq' }
  ];
  const SHUFFLED = ['get', 'listen', 'req', 'app'];
  const [placed, setPlaced] = useState(storedAnswer ? ORDER.map(o => o.id) : []);
  const [shake, setShake] = useState(null);
  const done = placed.length === ORDER.length;
  const nextNeeded = ORDER[placed.length]?.id;
  const click = (id) => {
    if (placed.includes(id)) return;
    if (id === nextNeeded) setPlaced(p => [...p, id]);
    else { setShake(id); setTimeout(() => setShake(null), 400); }
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Amaliyot · tartiblash" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${placed.length}/4 joylandi`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Server qismlarini <span className="italic" style={{ color: T.accent }}>to'g'ri tartibda</span> yig'a olasizmi?</h2></div>
        <Mentor>Server kodi aniq tartibda yoziladi: avval asbobni <b style={{ color: T.ink }}>chaqir</b>, keyin serverni <b style={{ color: T.ink }}>yarat</b>, so'ng <b style={{ color: T.ink }}>endpoint</b> och, oxirida serverni <b style={{ color: T.ink }}>yoq</b>. Pastdagi bo'laklarni to'g'ri ketma-ketlikda bosing.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">Bo'laklar — to'g'ri tartibda bosing</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {SHUFFLED.map(id => {
                const o = ORDER.find(x => x.id === id);
                const used = placed.includes(id);
                return <button key={id} className={`chip mono ${used ? '' : ''} ${shake === id ? 'shake' : ''}`} disabled={used} style={used ? { opacity: 0.35 } : undefined} onClick={() => click(id)}>{o.label}</button>;
              })}
            </div>
            {!done && nextNeeded && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>Keyingi: {ORDER[placed.length].hint}</p>}
          </Col>
          <Col>
            <p className="flow-label">server.js</p>
            <pre className="code-box" style={{ minHeight: 110 }}>
              {placed.length === 0 && <span style={{ color: CODE.comment }}>// bo'laklarni tartibda joylang…</span>}
              {placed.map((id, i) => { const o = ORDER.find(x => x.id === id); return <div key={id} className="el-in"><span style={{ color: CODE.str }}>{i + 1}</span>{'  '}<span style={{ color: CODE.text }}>{o.label}</span></div>; })}
            </pre>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>To'g'ri tartib! Chaqir → yarat → endpoint → yoq. Mana to'liq serverning skeleti. Endi oxirgi qadam — o'zingiz yozasiz!</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — DEBUGGING (app.listen yetishmaydi) =====
const Screen14 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [picked, setPicked] = useState(storedAnswer ? 'listen' : null);
  const [fixed, setFixed] = useState(!!storedAnswer);
  const found = picked === 'listen';
  const done = fixed;
  const OPTS = [
    { id: 'get', label: "app.get yo'q" },
    { id: 'listen', label: 'app.listen yo\'q — server yoqilmagan' },
    { id: 'send', label: "res.send yo'q" }
  ];
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Debugging" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : (found ? 'Endi tuzating' : 'Muammoni toping')} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">AI server yozdi, lekin brauzer <span className="italic" style={{ color: T.accent }}>"ulanib bo'lmadi"</span> deyapti. Nega?</h2></div>
        <Mentor>AI kodni tez yozdi, lekin brauzerda <span className="mono">localhost:3000</span> ochilmayapti — "ulanib bo'lmadi". Demak server <b style={{ color: T.ink }}>umuman yoqilmagan</b>. Kodga qarang: qaysi muhim qator yetishmayapti?</Mentor>
        <div className="split">
          <Col>
            <div className="ai-card fade-up delay-1">
              <div className="ai-row"><span className="ai-badge">AI</span><span className="ai-bubble">Serveringiz:</span></div>
              <pre className="code-box" style={{ fontSize: 12.5, boxShadow: 'none' }}>
                <Jx>{'const'}</Jx>{' '}<At>express</At>{' = '}<Jx>{'require'}</Jx>{'('}<St>{"'express'"}</St>{')'}{'\n'}
                <Jx>{'const'}</Jx>{' '}<At>app</At>{' = '}<At>express</At>{'()'}{'\n\n'}
                <At>app</At>{'.'}<Jx>{'get'}</Jx>{'('}<St>{"'/salom'"}</St>{', ('}<At>req</At>{', '}<At>res</At>{') => {'}{'\n'}{'  '}<At>res</At>{'.'}<Jx>{'send'}</Jx>{'('}<St>{"'Salom!'"}</St>{')'}{'\n'}{'})'}
                {fixed && <div className="el-in" style={{ marginTop: 8 }}><At>app</At>{'.'}<Jx>{'listen'}</Jx>{'('}<St>3000</St>{')   '}<span style={{ color: CODE.str }}>// ✓ qo'shildi</span></div>}
              </pre>
              {found && !fixed && <button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={() => setFixed(true)}>🔧 app.listen(3000) qo'shish</button>}
              {fixed && <p className="ai-prompt" style={{ color: T.success, fontStyle: 'normal', fontWeight: 600 }}>✓ Endi server yoqildi!</p>}
            </div>
          </Col>
          <Col>
            {!found && <>
              <p className="flow-label">Nima yetishmayapti?</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {OPTS.map(o => <button key={o.id} className={`pick-row ${picked === o.id ? 'on' : ''}`} onClick={() => setPicked(o.id)}><span className="pick-box">{picked === o.id && '•'}</span><span className="body" style={{ color: T.ink }}>{o.label}</span></button>)}
              </div>
              {picked && picked !== 'listen' && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bu qator kodda bor. Yana qarang: serverni <b>yoqadigan</b> qator (app.listen) bormi?</p></div>}
            </>}
            {found && !fixed && <div className="frame-warn fade-step"><p className="note-h" style={{ color: T.accent }}>✓ Topdingiz!</p><p className="body" style={{ margin: 0, color: T.ink }}><span className="mono">app.listen(3000)</span> yo'q — shuning uchun server umuman <b>yoqilmagan</b>, brauzer ulana olmaydi. Chapdagi tugma bilan qo'shing →</p></div>}
            {fixed && <div className="takeaway fade-step"><div className="ta-bulb">🛠️</div><p className="ta-h">Topdingiz va tuzatdingiz — bu debugging!</p><p className="ta-sub">AI tez yozadi, siz tekshirib to'g'irlaysiz</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 15 — YAKUNIY: endpoint yozish + ▶ Run =====
const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [value, setValue] = useState(storedAnswer?.picked || '');
  const [passed, setPassed] = useState(!!storedAnswer?.correct);
  const [ran, setRan] = useState(false);
  const v = value.replace(/[‘’ʻ]/g, "'").replace(/[“”]/g, '"');
  const hasGet = /app\s*\.\s*get\s*\(/.test(v);
  const hasPath = /['"]\/salom['"]/.test(v);
  const hasSend = /res\s*\.\s*send\s*\(\s*['"].+['"]/.test(v);
  const valid = hasGet && hasPath && hasSend;
  const m = v.match(/res\s*\.\s*send\s*\(\s*['"](.+?)['"]/);
  const reply = m ? m[1] : 'Salom, dunyo!';
  const done = ran;
  useEffect(() => {
    if (valid && !passed) { setPassed(true); onAnswer(screen, { stage: 'final', screenIdx: screen, question: "app.get('/salom', ...) endpoint'ini yozing", studentAnswer: value, correct: true, firstAttemptCorrect: true, solved: true, picked: value }); }
  }, [valid]);
  const Ln = ({ n, children }) => <div className="vsc-line"><span className="vsc-ln">{n}</span><span style={{ whiteSpace: 'pre' }}>{children}</span></div>;
  const navLabel = ran ? 'Davom etish' : (valid ? '▶ Run bosing' : "Endpoint qatorini yozing");
  return (
    <Stage eyebrow="Yakuniy · amaliy" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={navLabel} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Birinchi serveringizni <span className="italic" style={{ color: T.accent }}>javob berdiring</span>.</h2></div>
        <Mentor>VS Code'da <span className="mono">server.js</span> ochiq — faqat <b style={{ color: T.ink }}>endpoint qatori yetishmayapti</b>! 4-qatorga yozing: <b style={{ color: T.ink }}>app.get('/salom', (req, res) =&gt; res.send('Salom, dunyo!'))</b>. Yozib bo'lgach <b style={{ color: T.ink }}>▶ Run</b> bosing — serveringiz brauzerda javob beradi!</Mentor>
        <div className="split">
          <Col>
            <div className="vsc fade-up delay-1">
              <div className="vsc-bar"><span className="vsc-tab on"><span style={{ color: '#8CC84B' }}>⬢</span> server.js <span style={{ color: '#6E7681', marginLeft: 4 }}>×</span></span></div>
              <div className="vsc-body">
                <Ln n={1}><span style={{ color: '#C586C0' }}>const</span> express = <span style={{ color: '#DCDCAA' }}>require</span>(<span style={{ color: '#CE9178' }}>'express'</span>)</Ln>
                <Ln n={2}><span style={{ color: '#C586C0' }}>const</span> app = <span style={{ color: '#DCDCAA' }}>express</span>()</Ln>
                <Ln n={3}>{' '}</Ln>
                <div className="vsc-line"><span className="vsc-ln">4</span><input className={`vsc-input ${valid ? 'ok' : ''}`} value={value} onChange={e => { setValue(e.target.value); setRan(false); }} placeholder="app.get('/salom', (req, res) => res.send('...'))" spellCheck={false} autoCapitalize="off" autoCorrect="off" /></div>
                <Ln n={5}>{' '}</Ln>
                <Ln n={6}>app.<span style={{ color: '#DCDCAA' }}>listen</span>(<span style={{ color: '#B5CEA8' }}>3000</span>)</Ln>
              </div>
            </div>
            <div className="fade-up delay-2" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="tagpill" style={{ opacity: hasGet ? 1 : 0.4 }}>{hasGet ? '✓' : '1'} app.get</span>
              <span className="tagpill" style={{ opacity: hasPath ? 1 : 0.4 }}>{hasPath ? '✓' : '2'} '/salom'</span>
              <span className="tagpill" style={{ opacity: hasSend ? 1 : 0.4 }}>{hasSend ? '✓' : '3'} res.send('...')</span>
            </div>
            {valid && !ran && <button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={() => setRan(true)}>▶ Run — node server.js</button>}
          </Col>
          <Col>
            <p className="flow-label">Terminal</p>
            <div className="code-box" style={{ minHeight: 44 }}>{ran ? <TLine out={<span style={{ color: CODE.str }}>✓ Server localhost:3000 da ishlayapti</span>} /> : <span style={{ color: CODE.comment, fontFamily: "'JetBrains Mono'", fontSize: 12 }}>Run bosilmagan…</span>}</div>
            <p className="flow-label" style={{ marginTop: 2 }}>Brauzer</p>
            <Win title="localhost:3000/salom" minH={86} hotTitle={ran}>
              {ran ? <div className="demo-swap" style={{ fontFamily: 'Georgia, serif', fontSize: 19, color: T.ink }}>{reply}</div>
                : <p style={{ fontFamily: 'Georgia, serif', color: T.ink3, fontStyle: 'italic', margin: 0, fontSize: 13 }}>{valid ? '▶ Run bosing — serveringiz javob beradi' : 'Endpoint qatorini yozing…'}</p>}
            </Win>
            {ran && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>🎉 Tabriklaymiz! Sizning birinchi serveringiz ishga tushdi va <b>"{reply}"</b> deb javob berdi. Siz endi backend yoza olasiz!</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — YAKUN =====
const Screen16 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const RECAP = [
    "Server — doim ishlaydigan dastur: so'rov → javob",
    "Node.js — JavaScript serverda ham ishlaydi",
    "npm — tayyor asboblar do'koni (npm install)",
    "Express — oson server; endpoint = app.get('/manzil')",
    "node server.js → localhost:3000 da yoqiladi"
  ];
  const HOMEWORK = [
    { b: "O'z serveringiz", t: "— Antigravity bilan Express server yarating va node server.js bilan yoqing" },
    { b: "Yangi endpoint", t: "— /ism degan endpoint qo'shing, u sizning ismingizni qaytarsin" },
    { b: "Nest'ni ko'ring", t: "— nestjs.com saytiga kiring, nega u 'professional' deyilishini o'qing" }
  ];
  const GLOSSARY = [
    { b: 'Server', t: "— so'rov kutadigan, javob beradigan dastur" },
    { b: 'Node.js', t: "— JS'ni serverda ishlatadi" },
    { b: 'npm', t: "— paket (asbob) o'rnatuvchi" },
    { b: 'Express', t: "— serverni osonlashtiruvchi framework" },
    { b: 'NestJS', t: "— Express'ning tartibli, professional akasi" },
    { b: 'Endpoint', t: "— serverning manzili (app.get)" },
    { b: 'res.send', t: "— so'rovga javob qaytaradi" },
    { b: 'app.listen', t: "— serverni yoqadi (port)" },
    { b: 'localhost:3000', t: "— o'z kompyuteringizdagi server" }
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
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">✓</span> Dars tugadi</span><h2 className="title h-title fade-up d1">Birinchi serveringiz <span className="italic" style={{ color: T.accent }}>javob berdi</span>.</h2><p className="body h-sub fade-up d2">{PASSED ? "Tabriklaymiz! Server nima, Node.js, npm, Express va endpoint — hammasini tushundingiz va o'z serveringizni ishga tushirdingiz." : "Yaxshi harakat! Server va endpoint tushunchalarini mustahkamlash uchun bir-ikki ekranni qayta ko'ring."}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span className="tick" style={{ width: 16, height: 16, borderRadius: '50%', background: T.success, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck">✓</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>📝 Uyga vazifa</div><p className="body" style={{ margin: '0 0 10px', color: T.ink }}>O'z serveringizni quring:</p><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">Keyingi darsda serverni PostgreSQL bazaga ulab, haqiqiy ma'lumot qaytaramiz! 🚀</p></div>
        </div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">💡 Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT — ({ lang, onFinished })
export default function NodeServerLesson({ lang: langProp, onFinished }) {
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

        /* === REACT-3 DARS CSS === */
        .bp-bar { background: #f0eee8; padding: 8px 11px; display: flex; align-items: center; gap: 9px; }
        .bb-dots { display: flex; gap: 5px; }
        .bb-dots i { width: 9px; height: 9px; border-radius: 50%; }
        .bb-dots i:first-child { background: #ff5f57; } .bb-dots i:nth-child(2) { background: #febc2e; } .bb-dots i:nth-child(3) { background: #28c840; }
        .bp-title { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink3}; transition: color 0.3s; }
        .bp-body { padding: clamp(12px,2.2vw,18px); }
        .code-box { background: ${CODE.bg}; color: ${CODE.text}; font-family: 'JetBrains Mono', monospace; font-size: clamp(12px,1.5vw,13.5px); line-height: 1.55; padding: clamp(12px,2.2vw,16px); border-radius: 12px; overflow-x: auto; white-space: pre-wrap; word-break: break-word; margin: 0; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.2); }
        /* Roblox uslubidagi o'yin kartochkasi */
        .rocard { border-radius: 12px; background: #fff; box-shadow: 0 4px 14px -4px rgba(0,0,0,0.16); overflow: hidden; border: 1px solid rgba(0,0,0,0.05); transition: transform 0.15s, box-shadow 0.15s; }
        .rocard:hover { transform: translateY(-2px); box-shadow: 0 8px 20px -5px rgba(0,0,0,0.22); }
        .rothumb { height: 58px; display: flex; align-items: center; justify-content: center; position: relative; }
        .rostar { position: absolute; top: 4px; right: 7px; font-size: 14px; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.35)); }
        .robody { padding: 7px 10px 9px; }
        .roname { font-family: 'Manrope', sans-serif; font-weight: 800; font-size: 12px; color: ${T.ink}; margin: 0 0 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .rostats { display: flex; align-items: center; gap: 8px; font-family: 'Manrope', sans-serif; font-size: 10.5px; color: ${T.ink3}; font-weight: 600; }
        .rolike { border: none; background: transparent; cursor: pointer; padding: 0; font-family: 'Manrope', sans-serif; font-size: 10.5px; font-weight: 600; color: ${T.ink3}; transition: color 0.15s; }
        .rolike.on { color: ${T.success}; font-weight: 800; }
        @keyframes heart-pop { 0% { transform: scale(1); } 40% { transform: scale(1.45); } 100% { transform: scale(1); } }
        .hpop { animation: heart-pop 0.4s ease; display: inline-block; }
        /* VS Code muhiti (yakuniy ekran) */
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

        /* === 4-MODUL · 3-DARS: NODE SERVER === */
        .srv-dot { display: inline-block; width: 10px; height: 10px; border-radius: 50%; transition: all 0.2s; vertical-align: middle; }
        .epwin { display: flex; align-items: center; gap: 10px; width: 100%; text-align: left; background: ${T.paper}; border: none; border-radius: 11px; padding: 12px 15px; cursor: pointer; transition: all 0.18s; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.14); }
        .epwin:hover { transform: translateY(-1px); box-shadow: 0 9px 20px -6px rgba(${T.shadowBase},0.2); }
        .epwin.on { box-shadow: 0 8px 18px -6px rgba(255,79,40,0.28), inset 0 0 0 1.5px ${T.accent}; }
        .epmethod { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 10px; color: ${T.success}; background: ${T.successSoft}; padding: 2px 7px; border-radius: 5px; flex-shrink: 0; }
        .eppath { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 13.5px; color: ${T.ink}; }
        .epdesc { font-family: 'Manrope'; font-size: 12px; color: ${T.ink3}; margin-left: auto; }
        .cmp-card { flex: 1; min-width: 140px; background: ${T.paper}; border-radius: 12px; padding: 13px 15px; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.14); }
        .cmp-card.hot { box-shadow: 0 0 0 2px ${T.accent}, 0 8px 18px -6px rgba(255,79,40,0.22); }
        .cmp-h { font-family: 'Manrope'; font-weight: 800; font-size: 14px; color: ${T.ink}; margin: 0 0 5px; }
        .pick-row { display: flex; align-items: center; gap: 11px; width: 100%; text-align: left; background: ${T.paper}; border: none; border-radius: 11px; padding: 11px 14px; cursor: pointer; transition: all 0.18s; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.14); }
        .pick-row:hover { box-shadow: 0 9px 20px -6px rgba(${T.shadowBase},0.2); }
        .pick-row.on { background: ${T.accentSoft}; box-shadow: 0 8px 18px -6px rgba(255,79,40,0.25), inset 0 0 0 1.5px ${T.accent}; }
        .pick-box { width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0; box-shadow: inset 0 0 0 2px ${T.ink3}; display: inline-flex; align-items: center; justify-content: center; font-size: 14px; color: ${T.accent}; }
        .pick-row.on .pick-box { box-shadow: inset 0 0 0 2px ${T.accent}; }
        @keyframes shakex { 0%,100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
        .shake { animation: shakex 0.4s; box-shadow: inset 0 0 0 1.5px ${T.accent} !important; }

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

