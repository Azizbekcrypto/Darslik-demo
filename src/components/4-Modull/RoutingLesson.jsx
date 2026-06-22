import React, { useState, useEffect, useRef, createContext, useContext, useCallback } from 'react';
import mentorImg from '../../assets/common/mentor.png';

// ============================================================
// BACKEND MODULI (4-MODUL) · 4-DARS — ROUTING: SERVER SO'ROVNI QANDAY TOPADI — PLATFORM STANDARD v16 (AUDIOSIZ)
// Mavzu: so'rov = METHOD + PATH; routing (server kelgan so'rovni mos kodga ulaydi); HTTP method'lar (GET/POST/PUT/DELETE = CRUD);
//        route param (/games/:id — bitta route ko'p qiymatga); 404 (mos kelmasa); NestJS routing — controller + dekoratorlar (@Get/@Post/@Param).
// Ko'prik: o'tgan darsda Express bilan BITTA endpoint qurdingiz; bugun KO'P so'rovli dunyo — server qaysi kodni ishga tushirishini qanday biladi.
// QAROR: bu dars NEST-yo'naltirilgan. Express ko'rsatilmaydi (keyingi modulda Nest arxitekturasi beriladi, o'quvchilar o'shandan foydalanadi).
// KOD TA'MI: Nest controller KO'RSATILADI (dekoratorlar bosiladi); yakunda o'quvchi @Post() dekoratorini O'ZI YOZADI (GET ancha qilingan — POST qiziqarliroq).
// AUDIOSIZ: ovoz (TTS) yo'q — platforma qarori.
// Yakuniy ekran (s15): VS Code — GamesController ichida create() metodiga @Post() dekoratorini yozib, ▶ Run → POST /games → javob.
// Toza dizayn — ortiqcha emoji yo'q; ma'no so'z va tipografiya bilan beriladi.
// PRODUCTION: <style> ichidagi @import OLIB TASHLANADI — shriftlarni LMS yuklaydi.
// ============================================================

const T = {
  bg: '#F6F4EF', ink: '#0E0E10', ink2: '#5A5A60', ink3: '#A7A6A2',
  paper: '#FFFFFF', accent: '#FF4F28', accentSoft: '#FFE8E1', accentVivid: '#FF4F28',
  success: '#1F7A4D', successSoft: '#E3F0E8', blue: '#019ACB', blueSoft: '#E2F4FA', link: '#1a56db',
  shadowBase: '58, 53, 48'
};
const CODE = { bg: '#1A2436', text: '#E8E5DD', tag: '#FF7755', attr: '#FFD380', str: '#7DD181', comment: '#6B7585', punct: '#9FB4D8', deco: '#C9A6F5' };
// HTTP method ranglari (niyat → rang)
const METHODS = { GET: T.success, POST: T.accent, PUT: T.blue, DELETE: '#C2410C' };

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

const LESSON_META = { lessonId: 'nest-routing-04-04-v16', lessonTitle: { uz: 'Routing: server so\'rovni qanday topadi', ru: 'Роутинг: как сервер находит запрос' } };
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
        <img src={mentorImg} alt="" />
      </div>
      <div className="mentor-col">
        <span className="mentor-name">Mentor{collapsed && <span className="mentor-cue"> · ko'rsatmani ochish ▾</span>}</span>
        <div className="mentor-msg body">{children}</div>
      </div>
    </div>
  );
};

// ===== KOD YORDAMCHILAR =====
const Jx = ({ children }) => <span style={{ color: CODE.tag }}>{children}</span>;   // kalit so'z
const At = ({ children }) => <span style={{ color: CODE.attr }}>{children}</span>;  // nom / o'zgaruvchi
const St = ({ children }) => <span style={{ color: CODE.str }}>{children}</span>;   // matn (string)
const Dc = ({ children }) => <span style={{ color: CODE.deco }}>{children}</span>;  // dekorator (@Get, @Post)
const Win = ({ title, children, minH, hotTitle }) => (
  <div className="bp-window"><div className="bp-bar"><span className="bb-dots"><i /><i /><i /></span><span className="bp-title" style={hotTitle ? { color: T.accent, fontWeight: 700 } : undefined}>{title}</span></div><div className="bp-body" style={{ minHeight: minH, position: 'relative' }}>{children}</div></div>
);
const TLine = ({ cmd, out, dim }) => (
  <div className="el-in" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 'clamp(11.5px,1.4vw,13px)', lineHeight: 1.7, color: dim ? CODE.comment : CODE.text }}>
    {cmd ? <><span style={{ color: CODE.str }}>$</span> <span style={{ color: CODE.text }}>{cmd}</span></> : out}
  </div>
);
// ===== 4-MODUL · 4-DARS YORDAMCHILAR (routing / Nest) =====
// HTTP method belgisi (niyat → rang)
const MethodBadge = ({ method, big }) => (
  <span className="mbadge" style={{ color: METHODS[method] || T.ink2, background: (METHODS[method] || T.ink2) + '22', fontSize: big ? 12 : 10, padding: big ? '3px 9px' : '2px 7px' }}>{method}</span>
);
// Route qatori (method + path) — bosiladigan
const RouteRow = ({ method, path, note, active, matched, onClick }) => (
  <button className={`epwin ${active ? 'on' : ''}`} onClick={onClick} disabled={!onClick} style={matched ? { boxShadow: `0 8px 18px -6px rgba(31,122,77,0.3), inset 0 0 0 1.5px ${T.success}` } : (!onClick ? { cursor: 'default' } : undefined)}>
    <MethodBadge method={method} />
    <span className="eppath">{path}</span>
    {note && <span className="epdesc">{note}</span>}
  </button>
);

// ===== SCREEN 0 — HOOK (server 1 emas, ko'p so'rovga javob beradi — qaysisini?) =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const ROUTES = [
    { method: 'GET', path: '/games', label: "o'yinlar ro'yxati" },
    { method: 'GET', path: '/games/3', label: "3-o'yin" },
    { method: 'POST', path: '/games', label: "yangi o'yin" }
  ];
  const [sent, setSent] = useState(null);
  const [seen, setSeen] = useState(() => new Set(storedAnswer ? [0, 1, 2] : []));
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const tried = seen.size >= 2;
  const send = (i) => { setSent(i); setSeen(s => { const n = new Set(s); n.add(i); return n; }); };
  const OPTS = [
    { id: 'a', label: "Tasodifan birortasini tanlaydi" },
    { id: 'b', label: "Doim eng birinchi kodni ishga tushiradi" },
    { id: 'c', label: "So'rovning manzili bo'yicha — mos kodni topadi" }
  ];
  const pick = (v) => { if (picked !== null || !tried) return; setPicked(v); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: true }); };
  return (
    <Stage eyebrow="Kirish" screen={screen} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 860 }}>Serveringizda <span className="italic" style={{ color: T.accent }}>o'nlab eshik</span> bor — kimdir so'rasa, server <span className="italic" style={{ color: T.accent }}>qaysi kodni</span> ishga tushiradi?</h1>
        <Mentor>O'tgan darsda <b style={{ color: T.ink }}>bitta</b> eshik qurdingiz: <span className="mono">/salom</span>. Lekin haqiqiy ilovada ko'p eshik bor. Brauzer <span className="mono">GET /games/3</span> desa — server <b style={{ color: T.ink }}>qaysi kodni</b> ishga tushiradi? Avval bir nechta so'rov yuborib, qaysi eshik yonishini ko'ring.</Mentor>
        <Zoomable>
        <Split>
          <Col>
            <p className="flow-label">So'rov yuboring — bosing</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ROUTES.map((r, i) => <button key={i} className={`reqchip ${sent === i ? 'on' : ''}`} onClick={() => send(i)}><MethodBadge method={r.method} /><span className="mono" style={{ fontWeight: 700 }}>{r.path}</span></button>)}
            </div>
            <Win title="server — qaysi eshik javob berdi?" minH={96}>
              {sent === null
                ? <p style={{ color: T.ink3, fontStyle: 'italic', margin: 0, fontFamily: 'Georgia, serif', fontSize: 13 }}>Yuqoridan so'rov yuboring…</p>
                : <div className="demo-swap"><p className="mono small" style={{ color: T.ink3, margin: '0 0 8px' }}>{ROUTES[sent].method} {ROUTES[sent].path}</p><div className="frame-success" style={{ padding: '9px 12px' }}><p className="body" style={{ margin: 0, color: T.ink }}>→ <b style={{ color: T.success }}>{ROUTES[sent].label}</b> kodi ishga tushdi</p></div></div>}
            </Win>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Sizningcha, server qaysi kodni tanlashni qanday biladi?</p>
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
            {!tried && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>Avval kamida 2 ta so'rov yuboring ←</p>}
            {picked !== null && <p className="hook-ack fade-step">Aynan! Server so'rovning <b>manzili</b> — method va path — bo'yicha mos kodni topadi. Bu jarayon <b>routing</b> deyiladi. Bugun uni Nest'da ochamiz.</p>}
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
    { text: "So'rov ikki qismdan: method + path", tag: 'GET /games' },
    { text: "Routing — server mos kodni topadi", tag: 'mos kelmasa → 404' },
    { text: "HTTP method'lar — niyatlar", tag: 'GET / POST / PUT / DELETE' },
    { text: "Route param — bitta route, ko'p qiymat", tag: '/games/:id' },
    { text: "Nest controller — tartibli routing", tag: '@Get / @Post' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const PreviewBlock = (
    <Col>
      <p className="flow-label">Dars oxirida — sizning routingingiz</p>
      <Win title="brauzer — POST /games" minH={96}>
        <div className="fade-up delay-1" style={{ fontFamily: 'Georgia, serif', fontSize: 19, color: T.ink, padding: '6px 2px' }}>Yangi o'yin qo'shildi!</div>
        <p className="mono small" style={{ margin: '4px 0 0', color: T.success }}>✓ create() metodi javob berdi</p>
      </Win>
      <p className="mono small" style={{ color: T.accent, margin: 0 }}>→ shu POST eshigini dars oxirida o'zingiz ochasiz (@Post)</p>
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
        <div className="head"><h2 className="title h-title fade-up">Server so'rovni <span className="italic" style={{ color: T.accent }}>qanday topadi</span> — 5 qadam</h2></div>
        <Mentor>O'tgan darsda server qurdingiz; bugun u <b style={{ color: T.ink }}>ko'p so'rovni</b> qanday boshqarishini ko'ramiz. Va'da: dars oxirida <b style={{ color: T.ink }}>Nest controller</b>'ga yangi eshik (POST) ochasiz — yangi o'yin qo'shadigan.</Mentor>
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

// ===== SCREEN 2 — SO'ROV ANATOMIYASI (method + path) =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const METHS = ['GET', 'POST'];
  const PATHS = ['/games', '/games/5', '/salom'];
  const [method, setMethod] = useState(storedAnswer ? 'GET' : null);
  const [path, setPath] = useState(storedAnswer ? '/games' : null);
  const done = !!method && !!path;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="So'rov anatomiyasi" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "So'rovni yig'ing"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Har bir so'rov <span className="italic" style={{ color: T.accent }}>nimadan</span> iborat?</h2></div>
        <Mentor>Brauzer serverga so'rov yuborganda ikki narsani aytadi: <b style={{ color: T.ink }}>METHOD</b> (nima qilmoqchi — olish? qo'shish?) va <b style={{ color: T.ink }}>PATH</b> (qaysi manzilda). Mana shu ikkisi birgalikda so'rovni belgilaydi. O'zingiz bittasini yig'ing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">1. METHOD tanlang</p>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {METHS.map(m => <button key={m} className={`chip mono ${method === m ? 'chip-on' : ''}`} onClick={() => setMethod(m)}>{m}</button>)}
            </div>
            <p className="flow-label" style={{ marginTop: 4 }}>2. PATH tanlang</p>
            <div className="fade-up delay-2" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {PATHS.map(p => <button key={p} className={`chip mono ${path === p ? 'chip-on' : ''}`} onClick={() => setPath(p)}>{p}</button>)}
            </div>
          </Col>
          <Col>
            <p className="flow-label">Sizning so'rovingiz</p>
            <Win title="so'rov konverti" minH={108}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ display: 'block', fontFamily: "'JetBrains Mono'", fontWeight: 700, fontSize: 22, color: method ? (METHODS[method] || T.ink) : T.ink3 }}>{method || 'METHOD'}</span>
                  <span className="flow-label" style={{ color: T.ink3 }}>niyat</span>
                </div>
                <span style={{ fontSize: 22, color: T.ink3 }}>+</span>
                <div style={{ textAlign: 'center' }}>
                  <span style={{ display: 'block', fontFamily: "'JetBrains Mono'", fontWeight: 700, fontSize: 22, color: path ? T.ink : T.ink3 }}>{path || '/path'}</span>
                  <span className="flow-label" style={{ color: T.ink3 }}>manzil</span>
                </div>
              </div>
            </Win>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana so'rov: <span className="mono"><b>{method} {path}</b></span>. Server aynan shu ikki narsaga qarab kerakli kodni topadi. Endi ko'ramiz — qanday?</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — ROUTING = MOSLASHTIRISH =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const ROUTES = [
    { method: 'GET', path: '/games', reply: "['Adopt Me', 'Blox Fruits']" },
    { method: 'POST', path: '/games', reply: "Yangi o'yin qo'shildi!" },
    { method: 'GET', path: '/salom', reply: 'Salom, dunyo!' }
  ];
  const REQS = [
    { method: 'GET', path: '/games' },
    { method: 'POST', path: '/games' },
    { method: 'GET', path: '/yoq' }
  ];
  const [sent, setSent] = useState(null);
  const [seen, setSeen] = useState(() => new Set(storedAnswer ? [0, 1, 2] : []));
  const done = seen.size >= 2;
  const send = (i) => { setSent(i); setSeen(s => { const n = new Set(s); n.add(i); return n; }); };
  const cur = sent !== null ? REQS[sent] : null;
  const matchIdx = cur ? ROUTES.findIndex(r => r.method === cur.method && r.path === cur.path) : -1;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Routing" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/2 so'rov yuboring`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Server kelgan so'rovni <span className="italic" style={{ color: T.accent }}>qanday topadi</span>?</h2></div>
        <Mentor>Serverda <b style={{ color: T.ink }}>route'lar ro'yxati</b> bor — qabulxona xodimiga o'xshaydi. So'rov kelganda u ro'yxatdan <b style={{ color: T.ink }}>aynan mos qatorni</b> (method + path) qidiradi va o'sha kodni ishga tushiradi. Mos qator bo'lmasa — <b style={{ color: T.accent }}>404</b>. Diqqat qiling: <span className="mono">/games</span> ikki marta bor, lekin method farq qiladi!</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">So'rov yuboring</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {REQS.map((r, i) => <button key={i} className={`reqchip ${sent === i ? 'on' : ''}`} onClick={() => send(i)}><MethodBadge method={r.method} /><span className="mono" style={{ fontWeight: 700 }}>{r.path}</span></button>)}
            </div>
          </Col>
          <Col>
            <p className="flow-label">Server route'lar ro'yxati</p>
            <div className="fade-up delay-2" style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {ROUTES.map((r, i) => <RouteRow key={i} method={r.method} path={r.path} matched={matchIdx === i} />)}
            </div>
            {cur && (matchIdx >= 0
              ? <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ <span className="mono">{cur.method} {cur.path}</span> mos keldi → javob: <b>{ROUTES[matchIdx].reply}</b></p></div>
              : <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>❌ <span className="mono">{cur.method} {cur.path}</span> — mos route yo'q → <b style={{ color: T.accent }}>404 Not Found</b></p></div>)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana routing! Server method + path bo'yicha mos qatorni topadi. Endi method'larning o'zini ko'ramiz.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 (route nimadan iborat) =====
const Screen4 = (props) => (
  <QuestionScreen {...props} idx={4} scope="module-mikro" eyebrow="Mashq · 1-savol"
    questionText="Route (so'rovni topish uchun) nimadan iborat?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Server qaysi kodni ishga tushirishni nimaga qarab biladi?</h2></>}
    options={["METHOD va PATH — ikkisi birgalikda", "Faqat path (manzil)", "Faqat method", "Brauzer turi (Chrome, Firefox...)"]} correctIdx={0}
    explainCorrect="To'g'ri! Route = method + path. Server aynan shu juftlikka mos kodni topadi — masalan GET /games va POST /games bir-biridan farq qiladi."
    explainWrong={{
      1: "Yetarli emas — bir xil path'da turli method bo'lishi mumkin (GET /games va POST /games). Demak method ham kerak.",
      2: "Yetarli emas — faqat method bilan qaysi manzil ekanini bilmaymiz. Path ham kerak.",
      3: "Yo'q — brauzer turi muhim emas. Server method + path'ga qaraydi.",
      default: "Route = method + path birgalikda."
    }} />
);

// ===== SCREEN 5 — HTTP METHOD'LAR (niyatlar / CRUD) =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const M = [
    { id: 'GET', t: 'olish (o\'qish)', crud: 'Read', mc: "Sandiqqa qarash — ichidagini ko'rish", ex: 'GET /games — ro\'yxatni qaytaradi' },
    { id: 'POST', t: 'yaratish', crud: 'Create', mc: "Sandiqqa yangi predmet qo'shish", ex: 'POST /games — yangi o\'yin qo\'shadi' },
    { id: 'PUT', t: 'yangilash', crud: 'Update', mc: "Predmetni boshqasiga almashtirish", ex: 'PUT /games/3 — 3-o\'yinni yangilaydi' },
    { id: 'DELETE', t: 'o\'chirish', crud: 'Delete', mc: "Predmetni tashlab yuborish", ex: 'DELETE /games/3 — 3-o\'yinni o\'chiradi' }
  ];
  const [seen, setSeen] = useState(() => new Set(storedAnswer ? M.map(m => m.id) : []));
  const [active, setActive] = useState(storedAnswer ? 'GET' : null);
  const done = seen.size >= 3;
  const tap = (id) => { setActive(id); setSeen(s => { const n = new Set(s); n.add(id); return n; }); };
  const cur = M.find(m => m.id === active);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="HTTP method'lar" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/3 method ko'ring`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Method <span className="italic" style={{ color: T.accent }}>nimani</span> bildiradi?</h2></div>
        <Mentor>Method — so'rovning <b style={{ color: T.ink }}>maqsadi</b>. To'rttasi asosiy: <b style={{ color: T.ink }}>GET</b> olish, <b style={{ color: T.ink }}>POST</b> yaratish, <b style={{ color: T.ink }}>PUT</b> yangilash, <b style={{ color: T.ink }}>DELETE</b> o'chirish. Buni Minecraft sandig'i bilan tasavvur qiling. Har birini bosib ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Method'ni bosing</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {M.map(m => <button key={m.id} className="mtile" onClick={() => tap(m.id)} style={{ color: METHODS[m.id], background: METHODS[m.id] + (active === m.id ? '26' : '14'), boxShadow: active === m.id ? `inset 0 0 0 1.5px ${METHODS[m.id]}` : 'none' }}>{m.id} {seen.has(m.id) ? '✓' : ''}</button>)}
            </div>
            <div className="cmp-card" style={{ marginTop: 2 }}>
              <p className="cmp-h" style={{ marginBottom: 7 }}>CRUD — 4 ta amal</p>
              <p className="small" style={{ color: T.ink2, margin: 0 }}>Har ilova shu 4 ishni qiladi: <b>C</b>reate · <b>R</b>ead · <b>U</b>pdate · <b>D</b>elete. Ularning har biri bitta method.</p>
            </div>
          </Col>
          <Col>
            {cur ? <div className="sk-info" key={cur.id}>
              <span className="sk-tagbig"><span className="mbadge" style={{ color: METHODS[cur.id], background: METHODS[cur.id] + '22', fontSize: 13, padding: '4px 11px' }}>{cur.id}</span><span className="sk-wordbadge">{cur.t} · {cur.crud}</span></span>
              <p className="body" style={{ color: T.ink, margin: '11px 0 0' }}>Minecraft: <b>{cur.mc}</b></p>
              <p className="mono small" style={{ color: T.ink3, margin: '8px 0 0' }}>{cur.ex}</p>
            </div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Method'ni bosing — nima qilishini ko'rasiz</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>To'rt niyat — to'rt method. Bugun biz <b>POST</b> (yaratish) bilan ishlaymiz. Avval — bitta route ko'p qiymatga qanday xizmat qilishini ko'ramiz.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 5b — TEST 2 (POST) =====
const Screen5b = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Tekshiruv"
    questionText="Yangi o'yin qo'shish (yaratish) uchun qaysi method?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Mustahkamlash</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Serverga <span style={{ color: T.accent }}>yangi o'yin qo'shmoqchisiz</span> — qaysi method?</h2></>}
    options={["GET", "POST", "DELETE", "PUT"]} correctIdx={1}
    explainCorrect="To'g'ri! POST = yaratish (Create). Yangi ma'lumot qo'shganda har doim POST ishlatiladi."
    explainWrong={{
      0: "GET — bu olish (o'qish). Yangi narsa yaratmaydi, faqat mavjudini qaytaradi.",
      2: "DELETE — bu o'chirish. Bizga aksincha — yangi qo'shish kerak.",
      3: "PUT — bu mavjud narsani yangilash. Yangidan yaratish uchun POST.",
      default: "Yaratish (Create) = POST."
    }} />
);

// ===== SCREEN 6 — ROUTE PARAM (/games/:id) =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const GAMES = { 3: 'Adopt Me', 7: 'Blox Fruits', 42: 'Brookhaven' };
  const IDS = [3, 7, 42];
  const [picked, setPicked] = useState(null);
  const [seen, setSeen] = useState(() => new Set(storedAnswer ? IDS : []));
  const done = seen.size >= 2;
  const tap = (id) => { setPicked(id); setSeen(s => { const n = new Set(s); n.add(id); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Route param" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/2 id sinab ko'ring`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Har bir o'yin uchun <span className="italic" style={{ color: T.accent }}>alohida route</span> kerakmi?</h2></div>
        <Mentor>Yo'q — bu juda ko'p bo'lardi! Buning o'rniga <b style={{ color: T.ink }}>bitta</b> route yoziladi: <span className="mono">/games/:id</span>. Bu yerdagi <span className="mono">:id</span> — <b style={{ color: T.ink }}>o'zgaruvchi</b>. Qaysi raqam kelsa, server uni ushlab oladi. Bitta route — minglab o'yinga xizmat qiladi. Pastdan id tanlab sinang.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Route (bitta!)</p>
            <pre className="code-box fade-up delay-1" style={{ marginBottom: 4 }}><MethodBadge method="GET" /> <span style={{ color: CODE.text }}>/games/</span><span style={{ color: CODE.deco }}>:id</span></pre>
            <p className="flow-label" style={{ marginTop: 4 }}>So'rov yuboring</p>
            <div className="fade-up delay-2" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {IDS.map(id => <button key={id} className={`chip mono ${picked === id ? 'chip-on' : ''}`} onClick={() => tap(id)}>GET /games/{id}</button>)}
            </div>
          </Col>
          <Col>
            <p className="flow-label">Server ichida</p>
            <Win title={picked ? `brauzer — /games/${picked}` : 'brauzer'} minH={104}>
              {picked ? <div className="demo-swap">
                <p className="mono small" style={{ color: T.ink3, margin: '0 0 8px' }}>:id ushlandi → <span style={{ color: T.accent, fontWeight: 700 }}>id = {picked}</span></p>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: 17, color: T.ink }}>{GAMES[picked]}</div>
              </div>
                : <p style={{ color: T.ink3, fontStyle: 'italic', margin: 0, fontFamily: 'Georgia, serif', fontSize: 13 }}>id tanlang — server uni ushlab javob beradi</p>}
            </Win>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bitta route <span className="mono">/games/:id</span> — har xil id'ga xizmat qildi. <span className="mono">:id</span> o'zgaruvchi, qiymati so'rovdan keladi. Endi buni Nest qanday yozishini ko'ramiz.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — NEST CONTROLLER (dekoratorlar) =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const PARTS = {
    controller: { word: "@Controller('games')", info: <>Bu klass <b>/games</b> bilan boshlanadigan barcha so'rovlarni boshqaradi — umumiy manzil. Ichidagi metodlar shunga qo'shiladi.</> },
    get: { word: '@Get()', info: <><span className="mono">GET /games</span> so'rovi kelsa — pastdagi <span className="mono">findAll()</span> metodi ishga tushadi. Dekorator metodni so'rovga bog'laydi.</> },
    getid: { word: "@Get(':id')", info: <><span className="mono">GET /games/5</span> kelsa — <span className="mono">findOne()</span> ishlaydi. <span className="mono">:id</span> — o'zgaruvchi qism (o'tgan ekrandagidek).</> },
    param: { word: "@Param('id')", info: <>So'rovdagi <span className="mono">:id</span> qiymatini <b>ushlab oladi</b> va metodga beradi. Endi kod o'sha raqamni biladi.</> },
    post: { word: '@Post()', info: <><span className="mono">POST /games</span> kelsa — <span className="mono">create()</span> ishlaydi: yangi o'yin qo'shadi. Mana shu dekoratorni dars oxirida o'zingiz yozasiz!</> }
  };
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(() => new Set(storedAnswer ? Object.keys(PARTS) : []));
  const done = seen.size >= 3;
  const tap = (k) => { setActive(k); setSeen(p => { const s = new Set(p); s.add(k); return s; }); };
  const hl = (k) => ({ cursor: 'pointer', borderRadius: 5, padding: '1px 3px', background: active === k ? 'rgba(255,79,40,0.2)' : (seen.has(k) ? 'rgba(31,122,77,0.14)' : 'transparent'), transition: 'all 0.15s' });
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Nest controller" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/3 qism o'rganildi`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Nest routing'ni <span className="italic" style={{ color: T.accent }}>qanday yozadi</span>?</h2></div>
        <Mentor>Nest'da har route — klass ichidagi <b style={{ color: T.ink }}>metod</b>. Metod ustidagi <b style={{ color: T.accent }}>dekorator</b> (<span className="mono">@Get</span>, <span className="mono">@Post</span>) qaysi so'rovga javob berishini aytadi. Hammasi bitta <b style={{ color: T.ink }}>GamesController</b> ichida — toza va tartibli. Rangli qismlarni bosib o'rganing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <pre className="code-box fade-up delay-1" style={{ lineHeight: 1.9 }}>
              <span style={hl('controller')} onClick={() => tap('controller')}><Dc>{'@Controller'}</Dc>{'('}<St>{"'games'"}</St>{')'}</span>{'\n'}
              <Jx>{'export'}</Jx>{' '}<Jx>{'class'}</Jx>{' '}<At>GamesController</At>{' {'}{'\n\n'}
              {'  '}<span style={hl('get')} onClick={() => tap('get')}><Dc>{'@Get'}</Dc>{'()'}</span>{'\n'}
              {'  '}<At>findAll</At>{'() { '}<Jx>{'return'}</Jx>{' '}<At>games</At>{' }'}{'\n\n'}
              {'  '}<span style={hl('getid')} onClick={() => tap('getid')}><Dc>{'@Get'}</Dc>{'('}<St>{"':id'"}</St>{')'}</span>{'\n'}
              {'  '}<At>findOne</At>{'('}<span style={hl('param')} onClick={() => tap('param')}><Dc>{'@Param'}</Dc>{'('}<St>{"'id'"}</St>{')'}{' '}<At>id</At></span>{') { ... }'}{'\n\n'}
              {'  '}<span style={hl('post')} onClick={() => tap('post')}><Dc>{'@Post'}</Dc>{'()'}</span>{'\n'}
              {'  '}<At>create</At>{'() { '}<Jx>{'return'}</Jx>{' '}<St>{"'Qo\\'shildi!'"}</St>{' }'}{'\n'}
              {'}'}
            </pre>
          </Col>
          <Col>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <p className="flow-label" style={{ margin: 0 }}>Qismni bosing</p>
              <span className="small mono" style={{ color: done ? T.success : T.ink3 }}>{seen.size} / 5 ko'rildi</span>
            </div>
            {active ? <div className="sk-info" key={active}><span className="sk-tagbig"><span className="sk-wordbadge mono">{PARTS[active].word}</span></span><p className="body" style={{ color: T.ink, margin: '11px 0 0' }}>{PARTS[active].info}</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Koddan bir dekoratorni bosing</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Dekorator + metod = route. Bitta controller — bitta mavzuning hamma eshiklari. Nega bu yondashuv shunchalik tartibli — keyingi ekranda.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — NEGA NEST TARTIBLI =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const ADV = [
    { id: 'order', t: 'Tartib', d: "Har mavzu o'z controllerida: GamesController, UsersController. Katta loyihada ham adashmaysiz." },
    { id: 'deco', t: 'Dekoratorlar', d: "@Get / @Post o'zi yo'naltiradi — qaysi metod qaysi so'rovga javob berishini qo'lda tekshirmaysiz." },
    { id: 'return', t: 'return yetarli', d: "Metoddan shunchaki return qilasiz — Nest javobni mijozga o'zi yuboradi. Qo'shimcha qator shart emas." },
    { id: 'scale', t: 'Katta loyiha', d: "Yirik backendlar aynan shu tartibda quriladi — jamoa bo'lib ishlash oson." }
  ];
  const [seen, setSeen] = useState(() => new Set(storedAnswer ? ADV.map(a => a.id) : []));
  const [active, setActive] = useState(storedAnswer ? 'order' : null);
  const done = seen.size >= 2 || !!storedAnswer;
  const tap = (a) => { setActive(a.id); setSeen(p => { const s = new Set(p); s.add(a.id); return s; }); };
  const cur = ADV.find(a => a.id === active);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Nega Nest" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/2 sabab ko'ring`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Nega Nest bunchalik <span className="italic" style={{ color: T.accent }}>tartibli</span>?</h2></div>
        <Mentor>Server kodi o'sib ketganda chalkashlik boshlanadi. Nest buni hal qiladi: kod <b style={{ color: T.ink }}>controller'larga</b> bo'linadi, dekoratorlar routingni <b style={{ color: T.ink }}>o'zi</b> qiladi. Shuning uchun jiddiy loyihalar Nest'da yoziladi. Sabablarini bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Nest nega yaxshi — bosing</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {ADV.map(a => <button key={a.id} className={`chip ${active === a.id ? 'chip-on' : ''}`} onClick={() => tap(a)}>{a.t} {seen.has(a.id) ? '✓' : ''}</button>)}
            </div>
            <div className="cmp-card hot" style={{ marginTop: 4 }}>
              <p className="cmp-h" style={{ color: T.accent }}>Nest'da res.send yo'q!</p>
              <p className="small" style={{ color: T.ink2, margin: 0 }}>O'tgan darsda <span className="mono">res.send(...)</span> yozgandingiz. Nest'da shunchaki <span className="mono">return</span> qilasiz — qolganini Nest bajaradi.</p>
            </div>
          </Col>
          <Col>
            {cur ? <div className="sk-info" key={cur.id}><span className="sk-tagbig"><span className="sk-wordbadge">{cur.t}</span></span><p className="body" style={{ color: T.ink, margin: '10px 0 0' }}>{cur.d}</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Nest ustunligini bosing</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Tartib + dekoratorlar + sodda <span className="mono">return</span> = Nest. Keyingi modulda Nest arxitekturasini chuqur o'rganasiz. Endi — so'rov controllergacha qanday yetib boradi?</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 9 — TEST 3 (route param) =====
const Screen9 = (props) => (
  <QuestionScreen {...props} idx={9} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="@Get(':id') route'iga GET /games/7 kelsa, id qiymati nima?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}><span className="mono" style={{ color: T.accent }}>@Get(':id')</span> route'iga <span className="mono">GET /games/7</span> kelsa — <span className="mono">id</span> nima bo'ladi?</h2></>}
    options={["7", "':id'", "games", "/games/7"]} correctIdx={0}
    explainCorrect="To'g'ri! :id o'rniga so'rovdagi haqiqiy qiymat — 7 — keladi. @Param('id') uni ushlab oladi, endi id = 7."
    explainWrong={{
      1: "Yo'q — ':id' bu shablon (joy belgisi). Haqiqiy so'rovda uning o'rniga raqam — 7 — keladi.",
      2: "Yo'q — games bu path'ning boshqa qismi. :id o'rniga 7 keladi.",
      3: "Bu butun manzil. Bizga faqat :id qismi kerak — u 7 ga teng.",
      default: ":id o'rniga so'rovdagi qiymat — 7 — keladi."
    }} />
);

// ===== SCREEN 10 — TO'LIQ SAYOHAT (so'rov → controller → javob) =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const STEPS = [
    { t: <>So'rov keladi: <span className="mono" style={{ color: T.accent }}>POST /games</span></> },
    { t: <>Nest router dekoratorlarni tekshiradi</> },
    { t: <><span className="mono">@Post()</span> topildi → <span className="mono">create()</span> ishga tushadi</> },
    { t: <><span className="mono">return</span> → javob mijozga ketadi</> }
  ];
  const [step, setStep] = useState(storedAnswer ? STEPS.length : 0);
  const timers = useRef([]);
  const done = step >= STEPS.length;
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  const run = () => {
    timers.current.forEach(clearTimeout);
    setStep(1);
    timers.current = [600, 1200, 1800].map((ms, i) => setTimeout(() => setStep(i + 2), ms));
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="To'liq sayohat" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "So'rovni kuzating"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">So'rov controllergacha <span className="italic" style={{ color: T.accent }}>qanday yetib boradi</span>?</h2></div>
        <Mentor>Hammasini birlashtiramiz. Tugmani bosing — bitta <span className="mono">POST /games</span> so'rovi yo'lni bosqichma-bosqich bosib o'tadi: routerdan controller metodigacha, so'ng javob qaytadi.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            {step === 0 && <button className="btn fade-up delay-1" style={{ alignSelf: 'flex-start' }} onClick={run}>▶ POST /games yuborish</button>}
            {step > 0 && !done && <button className="btn-soft" style={{ alignSelf: 'flex-start' }} disabled>⏳ ketyapti…</button>}
            {done && <button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={run}>↺ Qayta yuborish</button>}
            <div className="jflow fade-up delay-2" style={{ marginTop: 4 }}>
              {STEPS.map((s, i) => <div key={i} className={`jstep ${step >= i + 1 ? 'on' : ''}`}><span className="jn">{i + 1}</span><span className="jt">{s.t}</span></div>)}
            </div>
          </Col>
          <Col>
            <p className="flow-label">Natija</p>
            <Win title="brauzer — POST /games" minH={92} hotTitle={done}>
              {done ? <div className="demo-swap" style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: T.ink }}>Yangi o'yin qo'shildi!</div>
                : <p style={{ color: T.ink3, fontStyle: 'italic', margin: 0, fontFamily: 'Georgia, serif', fontSize: 13 }}>So'rov hali yetib bormadi…</p>}
            </Win>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana to'liq yo'l: so'rov → router → dekorator → metod → <span className="mono">return</span> → javob. Routingni endi to'liq tushunasiz!</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — CASE / DEBUG (method mos kelmadi → 404) =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [picked, setPicked] = useState(storedAnswer ? 'method' : null);
  const [fixed, setFixed] = useState(!!storedAnswer);
  const found = picked === 'method';
  const done = fixed;
  const OPTS = [
    { id: 'path', label: "Path noto'g'ri yozilgan" },
    { id: 'method', label: '@Get turibdi — lekin POST kerak' },
    { id: 'class', label: "Klass nomi noto'g'ri" }
  ];
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Vaziyat · debugging" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : (found ? 'Endi tuzating' : 'Muammoni toping')} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Frontend yangi o'yin qo'shmoqchi, lekin <span className="italic" style={{ color: T.accent }}>404</span> chiqyapti. Nega?</h2></div>
        <Mentor>Frontend <span className="mono">POST /games</span> yubordi — yangi o'yin qo'shish uchun. Lekin server <b style={{ color: T.accent }}>404</b> qaytaryapti: mos route topilmadi. Controllerga qarang — <span className="mono">create()</span> ustida qaysi dekorator turibdi?</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="ai-card fade-up delay-1">
              <div className="ai-row"><span className="ai-badge">AI</span><span className="ai-bubble">Controlleringiz:</span></div>
              <pre className="code-box" style={{ fontSize: 12.5, boxShadow: 'none', lineHeight: 1.9 }}>
                <Dc>{'@Controller'}</Dc>{'('}<St>{"'games'"}</St>{')'}{'\n'}
                <Jx>{'export'}</Jx>{' '}<Jx>{'class'}</Jx>{' '}<At>GamesController</At>{' {'}{'\n\n'}
                {'  '}{fixed
                  ? <><Dc>{'@Post'}</Dc>{'()'}{'   '}<span style={{ color: CODE.str }}>{'// ✓ tuzatildi'}</span></>
                  : <span style={{ background: 'rgba(255,79,40,0.16)', boxShadow: `inset 0 0 0 1px ${T.accent}`, borderRadius: 4, padding: '0 3px' }}><Dc>{'@Get'}</Dc>{'()'}</span>}{'\n'}
                {'  '}<At>create</At>{'() { '}<Jx>{'return'}</Jx>{' '}<St>{"'Qo\\'shildi!'"}</St>{' }'}{'\n'}
                {'}'}
              </pre>
              {found && !fixed && <button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={() => setFixed(true)}>🔧 @Get → @Post ga o'zgartirish</button>}
              {fixed && <p className="ai-prompt" style={{ color: T.success, fontStyle: 'normal', fontWeight: 600 }}>✓ Endi POST /games ishlaydi!</p>}
            </div>
          </Col>
          <Col>
            {!found && <>
              <p className="flow-label">Muammo nimada?</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {OPTS.map(o => <button key={o.id} className={`pick-row ${picked === o.id ? 'on' : ''}`} onClick={() => setPicked(o.id)}><span className="pick-box">{picked === o.id && '•'}</span><span className="body" style={{ color: T.ink }}>{o.label}</span></button>)}
              </div>
              {picked && picked !== 'method' && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bu joyda xato yo'q. Yana qarang: <span className="mono">create()</span> ustidagi dekorator <span className="mono">@Get</span> — lekin frontend <b>POST</b> yubormoqda.</p></div>}
            </>}
            {found && !fixed && <div className="frame-warn fade-step"><p className="note-h" style={{ color: T.accent }}>✓ Topdingiz!</p><p className="body" style={{ margin: 0, color: T.ink }}><span className="mono">@Get()</span> turibdi, shuning uchun metod faqat GET'ga javob beradi. POST so'roviga mos route yo'q → 404. Dekoratorni <span className="mono">@Post()</span> ga o'zgartiring →</p></div>}
            {fixed && <div className="takeaway fade-step"><div className="ta-bulb">🛠️</div><p className="ta-h">Method mos kelmasa — 404!</p><p className="ta-sub">Dekorator so'rov method'iga to'g'ri kelishi shart</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — TEST 4 (404) =====
const Screen12 = (props) => (
  <QuestionScreen {...props} idx={12} scope="module-mikro" eyebrow="Mashq · 4-savol"
    questionText="So'rovga mos route topilmasa, server nima qaytaradi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>So'rovga <span style={{ color: T.accent }}>mos route topilmasa</span> — server nima qaytaradi?</h2></>}
    options={["404 — Not Found (topilmadi)", "200 — hammasi joyida", "Serverni o'chiradi", "Eng birinchi route'ni ishga tushiradi"]} correctIdx={0}
    explainCorrect="To'g'ri! Mos route bo'lmasa — 404 Not Found. Bu method yoki path mos kelmaganini bildiradi."
    explainWrong={{
      1: "200 — bu muvaffaqiyat (javob topildi). Mos route bo'lmasa esa 404 chiqadi.",
      2: "Yo'q — server o'chmaydi, ishlashda davom etadi. Faqat 404 qaytaradi.",
      3: "Yo'q — server tasodifiy route tanlamaydi. Mos kelmasa 404 beradi.",
      default: "Mos route yo'q → 404 Not Found."
    }} />
);

// ===== SCREEN 13 — MOSLASHTIRISH O'YINI (so'rov → metod) =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const PAIRS = [
    { method: 'GET', path: '/games', m: 'findAll()', desc: "hammasini qaytaradi" },
    { method: 'GET', path: '/games/5', m: 'findOne()', desc: "bittasini qaytaradi" },
    { method: 'POST', path: '/games', m: 'create()', desc: "yangi qo'shadi" }
  ];
  const RIGHT = ['create()', 'findAll()', 'findOne()']; // aralashtirilgan
  const [selReq, setSelReq] = useState(null);
  const [matched, setMatched] = useState(() => new Set(storedAnswer ? [0, 1, 2] : []));
  const [shake, setShake] = useState(null);
  const done = matched.size === 3;
  const clickReq = (i) => { if (matched.has(i)) return; setSelReq(i); };
  const clickMethod = (name) => {
    if (selReq === null) return;
    if (PAIRS[selReq].m === name) { setMatched(s => { const n = new Set(s); n.add(selReq); return n; }); setSelReq(null); }
    else { setShake(name); setTimeout(() => setShake(null), 400); }
  };
  const methodMatched = (name) => Array.from(matched).some(i => PAIRS[i].m === name);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Amaliyot · moslashtirish" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${matched.size}/3 ulandi`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Har so'rovni <span className="italic" style={{ color: T.accent }}>to'g'ri metodga</span> ulang</h2></div>
        <Mentor>Routingni o'zingiz sinab ko'ring. Chapdan so'rovni tanlang, keyin o'ngdan unga javob beradigan <b style={{ color: T.ink }}>controller metodini</b> bosing. To'g'ri juftlik yashil bo'lib qoladi.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">1. So'rov (chap)</p>
            <div className="match-col fade-up delay-1">
              {PAIRS.map((p, i) => <button key={i} className={`match-row ${matched.has(i) ? 'matched' : ''} ${selReq === i ? 'sel' : ''}`} disabled={matched.has(i)} onClick={() => clickReq(i)}><MethodBadge method={p.method} /><span className="mono">{p.path}</span>{matched.has(i) && <span style={{ marginLeft: 'auto' }}>✓</span>}</button>)}
            </div>
          </Col>
          <Col>
            <p className="flow-label">2. Controller metodi (o'ng)</p>
            <div className="match-col fade-up delay-2">
              {RIGHT.map(name => { const mm = methodMatched(name); return <button key={name} className={`match-row mono ${mm ? 'matched' : ''} ${shake === name ? 'shake' : ''}`} disabled={mm || selReq === null} onClick={() => clickMethod(name)}>{name}{mm && <span style={{ marginLeft: 'auto' }}>✓</span>}</button>; })}
            </div>
            {selReq === null && !done && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>Avval chapdan so'rovni tanlang ←</p>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Hammasi to'g'ri ulandi! Har method+path → o'z controller metodiga. Endi oxirgi qadam — yangi eshikni o'zingiz ochasiz!</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — QOIDA =====
const Screen14 = ({ screen, onNext, onPrev }) => {
  const RULES = [
    { ico: '①', h: 'So\'rov = method + path', d: <>Har so'rov niyatni (<span className="mono">GET/POST</span>) va manzilni (<span className="mono">/games</span>) olib keladi.</> },
    { ico: '②', h: 'Routing — mosini topadi', d: <>Server route'lar ichidan aynan mos qatorni topib, o'sha kodni ishga tushiradi.</> },
    { ico: '③', h: 'Nest: dekorator + metod', d: <><span className="mono">@Get</span> / <span className="mono">@Post</span> metodni so'rovga bog'laydi — controller ichida, tartibli.</> },
    { ico: '④', h: 'Mos kelmasa — 404', d: <>Method yoki path mos kelmasa, server <b>404 Not Found</b> qaytaradi.</> }
  ];
  return (
    <Stage eyebrow="Qoida" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Yozishga o'tamiz →" onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Routing — <span className="italic" style={{ color: T.accent }}>to'rt qoida</span></h2></div>
        <Mentor>Mana butun darsning yuragi. Bu to'rt qoidani esda tutsangiz — istalgan backend routingini tushunasiz. Keyingi ekranda birinchi eshigingizni o'zingiz ochasiz.</Mentor>
        <Zoomable>
        <div className="split">
          {RULES.map((r, i) => (
            <div key={i} className="rule-card fade-up" style={{ animationDelay: `${0.1 + i * 0.07}s` }}>
              <span className="rule-ico">{r.ico}</span>
              <div><p className="body" style={{ margin: '0 0 3px', fontWeight: 700, color: T.ink }}>{r.h}</p><p className="small" style={{ margin: 0, color: T.ink2 }}>{r.d}</p></div>
            </div>
          ))}
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 15 — YAKUNIY: @Post() yozish + ▶ Run =====
const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [value, setValue] = useState(storedAnswer?.picked || '');
  const [passed, setPassed] = useState(!!storedAnswer?.correct);
  const [ran, setRan] = useState(false);
  const v = value.replace(/[‘’ʻ]/g, "'").replace(/[“”]/g, '"').trim();
  const hasPost = /@\s*Post\b/i.test(v);
  const hasGet = /@\s*Get\b/i.test(v);
  const valid = hasPost && !hasGet;
  const done = ran;
  useEffect(() => {
    if (valid && !passed) { setPassed(true); onAnswer(screen, { stage: 'final', screenIdx: screen, question: "create() metodiga @Post() dekoratorini yozing", studentAnswer: value, correct: true, firstAttemptCorrect: true, solved: true, picked: value }); }
  }, [valid]);
  const Ln = ({ n, children }) => <div className="vsc-line"><span className="vsc-ln">{n}</span><span style={{ whiteSpace: 'pre' }}>{children}</span></div>;
  const navLabel = ran ? 'Davom etish' : (valid ? '▶ Run bosing' : "@Post() dekoratorini yozing");
  return (
    <Stage eyebrow="Yakuniy · amaliy" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={navLabel} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Yangi eshikni <span className="italic" style={{ color: T.accent }}>o'zingiz oching</span> — POST.</h2></div>
        <Mentor>Pastdagi <span className="mono">create()</span> metodi yangi o'yin qo'shadi — lekin Nest hali bilmaydi bu <b style={{ color: T.ink }}>qaysi so'rovga</b> javob berishini! Metod ustiga dekoratorni yozing: u <b style={{ color: T.ink }}>POST</b> so'roviga javob bersin — <b style={{ color: T.ink }}>@Post()</b>. So'ng <b style={{ color: T.ink }}>▶ Run</b> bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="vsc fade-up delay-1">
              <div className="vsc-bar"><span className="vsc-tab on"><span style={{ color: '#E0457B' }}>⬢</span> games.controller.ts <span style={{ color: '#6E7681', marginLeft: 4 }}>×</span></span></div>
              <div className="vsc-body">
                <Ln n={1}><span style={{ color: '#C586C0' }}>@Controller</span>(<span style={{ color: '#CE9178' }}>'games'</span>)</Ln>
                <Ln n={2}><span style={{ color: '#C586C0' }}>export</span> <span style={{ color: '#C586C0' }}>class</span> <span style={{ color: '#4EC9B0' }}>GamesController</span> {'{'}</Ln>
                <Ln n={3}>{' '}</Ln>
                <div className="vsc-line"><span className="vsc-ln">4</span><span style={{ whiteSpace: 'pre' }}>{'  '}</span><input className={`vsc-input ${valid ? 'ok' : ''}`} value={value} onChange={e => { setValue(e.target.value); setRan(false); }} placeholder="@Post()" spellCheck={false} autoCapitalize="off" autoCorrect="off" /></div>
                <Ln n={5}>{'  '}<span style={{ color: '#DCDCAA' }}>create</span>() {'{'}</Ln>
                <Ln n={6}>{'    '}<span style={{ color: '#C586C0' }}>return</span> <span style={{ color: '#CE9178' }}>'Yangi o'yin qo'shildi!'</span></Ln>
                <Ln n={7}>{'  }'}</Ln>
                <Ln n={8}>{'}'}</Ln>
              </div>
            </div>
            <div className="fade-up delay-2" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="tagpill" style={{ opacity: hasPost ? 1 : 0.4 }}>{hasPost ? '✓' : '1'} @Post()</span>
              <span className="tagpill" style={{ opacity: (valid) ? 1 : 0.4 }}>{valid ? '✓' : '2'} POST eshigi tayyor</span>
            </div>
            {hasGet && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bu <span className="mono">@Get()</span> — u GET uchun. Yangi o'yin <b>qo'shish</b> (yaratish) esa <span className="mono">@Post()</span> bilan bo'ladi.</p></div>}
            {valid && !ran && <button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={() => setRan(true)}>▶ Run — POST /games</button>}
          </Col>
          <Col>
            <p className="flow-label">Terminal</p>
            <div className="code-box" style={{ minHeight: 44 }}>{ran ? <TLine out={<span style={{ color: CODE.str }}>✓ POST /games → create() ishladi</span>} /> : <span style={{ color: CODE.comment, fontFamily: "'JetBrains Mono'", fontSize: 12 }}>Run bosilmagan…</span>}</div>
            <p className="flow-label" style={{ marginTop: 2 }}>Brauzer</p>
            <Win title="POST localhost:3000/games" minH={86} hotTitle={ran}>
              {ran ? <div className="demo-swap" style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: T.ink }}>Yangi o'yin qo'shildi!</div>
                : <p style={{ fontFamily: 'Georgia, serif', color: T.ink3, fontStyle: 'italic', margin: 0, fontSize: 13 }}>{valid ? '▶ Run bosing — POST eshigi javob beradi' : '@Post() yozing…'}</p>}
            </Win>
            {ran && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>🎉 Tabriklaymiz! Siz <b>@Post()</b> dekoratorini yozib, yangi route ochdingiz. Nest endi POST so'rovini <span className="mono">create()</span> metodiga yo'naltirdi!</p></div>}
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
    "So'rov = method + path (niyat + manzil)",
    "Routing — server mos kodni topadi; mos kelmasa 404",
    "GET olish · POST yaratish · PUT yangilash · DELETE o'chirish",
    "Route param /:id — bitta route, ko'p qiymat",
    "Nest: controller + dekorator (@Get/@Post) — tartibli routing"
  ];
  const HOMEWORK = [
    { b: "O'z controlleringiz", t: "— qog'ozda UsersController chizing: qaysi metod qaysi so'rovga javob beradi?" },
    { b: "Method mashqi", t: "— 5 ta amalni method bilan moslang (o'yin qo'shish, o'chirish, ko'rish...)" },
    { b: "Nest'ni o'qing", t: "— docs.nestjs.com → Controllers bo'limiga kiring, @Get/@Post'ni ko'ring" }
  ];
  const GLOSSARY = [
    { b: 'Route', t: "— method + path: server topadigan manzil" },
    { b: 'Method', t: "— so'rovning niyati (GET/POST/PUT/DELETE)" },
    { b: 'GET', t: "— ma'lumotni olish (o'qish)" },
    { b: 'POST', t: "— yangi ma'lumot yaratish" },
    { b: 'Route param', t: "— /games/:id — o'zgaruvchi qism" },
    { b: 'Controller', t: "— bir mavzu so'rovlarini boshqaruvchi klass" },
    { b: '@Get / @Post', t: "— metodni so'rovga bog'lovchi dekorator" },
    { b: '@Param', t: "— so'rovdagi :id qiymatini ushlaydi" },
    { b: '404', t: "— mos route topilmadi (Not Found)" }
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
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">✓</span> Dars tugadi</span><h2 className="title h-title fade-up d1">Routing'ni <span className="italic" style={{ color: T.accent }}>egalladingiz</span>.</h2><p className="body h-sub fade-up d2">{PASSED ? "Tabriklaymiz! So'rov anatomiyasi, routing, HTTP method'lar, route param va Nest controller — hammasini tushundingiz va yangi POST eshigini o'zingiz ochdingiz." : "Yaxshi harakat! Routing va method tushunchalarini mustahkamlash uchun bir-ikki ekranni qayta ko'ring."}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span className="tick" style={{ width: 16, height: 16, borderRadius: '50%', background: T.success, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck">✓</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>📝 Uyga vazifa</div><p className="body" style={{ margin: '0 0 10px', color: T.ink }}>Routingni mustahkamlang:</p><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">Keyingi modulda — Nest'ning to'liq arxitekturasi: controller, service, module qanday birga ishlaydi! 🚀</p></div>
        </div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">💡 Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT — ({ lang, onFinished })
export default function RoutingLesson({ lang: langProp, onFinished }) {
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
        .tagpill { font-family: 'JetBrains Mono', monospace; font-size: 12.5px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 99px; background: ${T.paper}; color: ${T.ink}; box-shadow: 0 3px 10px -5px rgba(${T.shadowBase},0.18); transition: opacity 0.2s; }

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

        /* === KOD OYNASI / VS CODE === */
        .bp-bar { background: #f0eee8; padding: 8px 11px; display: flex; align-items: center; gap: 9px; }
        .bb-dots { display: flex; gap: 5px; }
        .bb-dots i { width: 9px; height: 9px; border-radius: 50%; }
        .bb-dots i:first-child { background: #ff5f57; } .bb-dots i:nth-child(2) { background: #febc2e; } .bb-dots i:nth-child(3) { background: #28c840; }
        .bp-title { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink3}; transition: color 0.3s; }
        .bp-body { padding: clamp(12px,2.2vw,18px); }
        .code-box { background: ${CODE.bg}; color: ${CODE.text}; font-family: 'JetBrains Mono', monospace; font-size: clamp(12px,1.5vw,13.5px); line-height: 1.55; padding: clamp(12px,2.2vw,16px); border-radius: 12px; overflow-x: auto; white-space: pre-wrap; word-break: break-word; margin: 0; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.2); }
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

        /* === 4-MODUL · 4-DARS: ROUTING / NEST === */
        .mbadge { font-family: 'JetBrains Mono', monospace; font-weight: 700; border-radius: 5px; flex-shrink: 0; letter-spacing: 0.02em; }
        .reqchip { display: flex; align-items: center; gap: 10px; width: 100%; text-align: left; background: ${T.paper}; border: none; border-radius: 11px; padding: 11px 14px; cursor: pointer; transition: all 0.18s; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.14); color: ${T.ink}; font-size: clamp(13px,1.6vw,15px); }
        .reqchip:hover { transform: translateY(-1px); box-shadow: 0 9px 20px -6px rgba(${T.shadowBase},0.2); }
        .reqchip.on { box-shadow: 0 8px 18px -6px rgba(255,79,40,0.28), inset 0 0 0 1.5px ${T.accent}; }
        .epwin { display: flex; align-items: center; gap: 10px; width: 100%; text-align: left; background: ${T.paper}; border: none; border-radius: 11px; padding: 12px 15px; transition: all 0.18s; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.14); }
        .eppath { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 13.5px; color: ${T.ink}; }
        .epdesc { font-family: 'Manrope'; font-size: 12px; color: ${T.ink3}; margin-left: auto; }
        .mtile { font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: clamp(13px,1.7vw,15px); padding: 10px 16px; border-radius: 10px; border: none; cursor: pointer; transition: all 0.18s; }
        .mtile:hover { transform: translateY(-1px); }
        .cmp-card { background: ${T.paper}; border-radius: 12px; padding: 13px 15px; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.14); }
        .cmp-card.hot { box-shadow: 0 0 0 2px ${T.accent}, 0 8px 18px -6px rgba(255,79,40,0.22); }
        .cmp-h { font-family: 'Manrope'; font-weight: 800; font-size: 14px; color: ${T.ink}; margin: 0 0 5px; }
        .pick-row { display: flex; align-items: center; gap: 11px; width: 100%; text-align: left; background: ${T.paper}; border: none; border-radius: 11px; padding: 11px 14px; cursor: pointer; transition: all 0.18s; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.14); }
        .pick-row:hover { box-shadow: 0 9px 20px -6px rgba(${T.shadowBase},0.2); }
        .pick-row.on { background: ${T.accentSoft}; box-shadow: 0 8px 18px -6px rgba(255,79,40,0.25), inset 0 0 0 1.5px ${T.accent}; }
        .pick-box { width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0; box-shadow: inset 0 0 0 2px ${T.ink3}; display: inline-flex; align-items: center; justify-content: center; font-size: 14px; color: ${T.accent}; }
        .pick-row.on .pick-box { box-shadow: inset 0 0 0 2px ${T.accent}; }
        .jflow { display: flex; flex-direction: column; gap: 8px; }
        .jstep { display: flex; align-items: center; gap: 11px; background: ${T.paper}; border-radius: 11px; padding: 11px 14px; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.14); opacity: 0.4; transition: all 0.3s; }
        .jstep.on { opacity: 1; box-shadow: 0 8px 18px -6px rgba(255,79,40,0.22), inset 0 0 0 1.5px ${T.accent}; }
        .jstep .jn { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 12px; color: #fff; background: ${T.ink3}; width: 22px; height: 22px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; transition: background 0.3s; }
        .jstep.on .jn { background: ${T.accent}; }
        .jstep .jt { font-size: clamp(13px,1.6vw,14.5px); color: ${T.ink}; font-weight: 500; }
        .match-col { display: flex; flex-direction: column; gap: 8px; }
        .match-row { display: flex; align-items: center; gap: 10px; width: 100%; text-align: left; background: ${T.paper}; border: none; border-radius: 11px; padding: 11px 14px; cursor: pointer; transition: all 0.18s; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.14); font-family: 'Manrope'; font-weight: 600; color: ${T.ink}; font-size: clamp(13px,1.6vw,15px); }
        .match-row:hover:not(:disabled) { transform: translateY(-1px); }
        .match-row.sel { box-shadow: 0 8px 18px -6px rgba(255,79,40,0.28), inset 0 0 0 1.5px ${T.accent}; }
        .match-row.matched { background: ${T.successSoft}; color: ${T.success}; box-shadow: inset 0 0 0 1.5px ${T.success}; cursor: default; }
        .match-row:disabled { cursor: default; }
        .rule-card { display: flex; align-items: flex-start; gap: 13px; background: ${T.paper}; border-radius: 14px; padding: 15px 18px; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.14); }
        .rule-ico { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 16px; color: ${T.accent}; background: ${T.accentSoft}; width: 32px; height: 32px; border-radius: 9px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
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
