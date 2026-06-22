import React, { useState, useEffect, useRef, createContext, useContext, useCallback } from 'react';
import mentorImg from '../../assets/common/mentor.png';

// ============================================================
// FRONTEND REACT MODULI · PRAKTIKA 2 — REACT ROUTER: KO'P SAHIFALI ILOVA — PLATFORM STANDARD v16 (AUDIOSIZ)
// O'RNI: "API — POST/PUT/DELETE" darsidan KEYIN. O'quvchi allaqachon biladi:
//        komponent, props, state, map, fetch (GET), CRUD (POST/PUT/DELETE).
// Mavzu: bir sahifali vs ko'p sahifali ilova; route = manzil → komponent; <Routes>/<Route>;
//        <Link> vs <a> (Link sahifani QAYTA YUKLAMAydi — SPA navigatsiya); URL parametr /game/:id;
//        useNavigate (kod orqali sahifa almashtirish — POST'dan keyin Bosh'ga qaytish).
// PEDAGOGIKA (praktika): ME'MOR (route xaritasini qo'lda chizish) → REJISSYOR (AI'ga buyruq) →
//        NAZORATCHI (kodni tekshirish + debugging). Router vibecoding ichida "yetarlicha" beriladi.
// Misol ilova: robo-games (davom) — ko'p sahifali: Bosh (/) · O'yin (/game/:id) · Qo'shish (/add).
// MUHIM: kelgusi darslar ro'yxati AYTILMAYDI — faqat yakunda teaser. AUDIOSIZ: ovoz yo'q.
// Yakuniy ekran (s14): VS Code — <Route path="/add" element={<AddPage />} /> ni qo'lda yozish.
// Toza dizayn — ortiqcha emoji yo'q. "sehr"/"g'isht" ishlatilmaydi.
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

const LESSON_META = { lessonId: 'react-router-practice-p2-v16', lessonTitle: { uz: "Praktika: React Router — ko'p sahifali ilova", ru: 'Практика: React Router — многостраничное приложение' } };
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
  const isNarrow = useIsMobile(768); // mobil: Mentor yig'ilish rejimi
  const collapseOn = isNarrow && !mentorStatic;
  const padH = isMobile ? 12 : 100;
  const [mCollapsed, setMCollapsed] = useState(false);
  const contentRef = useRef(null);
  useEffect(() => { setMCollapsed(false); }, [screen]);
  // MOBIL AVTOSCROLL: natija paydo bo'lganda (scrollSignal o'zgarsa) kontentni pastga suramiz — uzun sahifalarda natija ko'rinib qoladi
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
const TLine = ({ cmd, out, dim }) => (
  <div className="el-in" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 'clamp(11.5px,1.4vw,13px)', lineHeight: 1.7, color: dim ? CODE.comment : CODE.text }}>
    {cmd ? <><span style={{ color: CODE.str }}>$</span> <span style={{ color: CODE.text }}>{cmd}</span></> : out}
  </div>
);

// ===== ROBO-GAMES MA'LUMOTLARI (oldingi darslardan tanish) =====
const GAMES = [
  { id: 1, name: 'Adopt Me!', emoji: '🐾', likes: 92, players: '402K', bg: 'linear-gradient(135deg,#FF9DBF,#C44569)', desc: "Uy hayvonlarini asrang, boqing va do'st orttiring." },
  { id: 2, name: 'Blox Fruits', emoji: '🍇', likes: 95, players: '750K', bg: 'linear-gradient(135deg,#7EA6F4,#2E4A9E)', desc: "Mevalar kuchini oching va dengizni zabt eting." },
  { id: 3, name: 'Brookhaven', emoji: '🏠', likes: 89, players: '510K', bg: 'linear-gradient(135deg,#8FD3A8,#2E7A4E)', desc: "O'z shahringizda yashang, mashina haydang, do'st toping." },
  { id: 4, name: 'Doors', emoji: '🚪', likes: 91, players: '310K', bg: 'linear-gradient(135deg,#6B7280,#1F2430)', desc: "Eshiklarni oching, sirlardan qoching, omon qoling." }
];
const gameById = (id) => GAMES.find(g => g.id === Number(id)) || GAMES[0];
const gameByName = (nm) => GAMES.find(g => g.name.toLowerCase() === String(nm).toLowerCase());

// O'yin kartochkasi: name + players props; onClick (kartani bosish → o'sha sahifa)
const RoCard = ({ name, players, top, onClick }) => {
  const g = gameByName(name);
  const bg = g ? g.bg : 'linear-gradient(135deg,#8E9BB5,#4A5670)';
  const em = g ? g.emoji : '🎮';
  return (
    <div className={`rocard el-in ${onClick ? 'tappable' : ''}`} onClick={onClick} style={{ position: 'relative' }}>
      <div className="rothumb" style={{ background: bg }}>
        <span style={{ fontSize: 26 }}>{em}</span>
        {top && <span className="topbadge el-in">🔥 TOP</span>}
      </div>
      <div className="robody">
        <p className="roname">{name}</p>
        <div className="rostats">
          <span>👍 {g ? g.likes : 88}%</span>
          {players && <span>👥 {players}</span>}
        </div>
      </div>
    </div>
  );
};

// ===== ROUTE XARITASI (3 sahifa) =====
const ROUTES = [
  { path: '/', page: 'Bosh', comp: 'Home', icon: '🏠', desc: "barcha o'yinlar katalogi" },
  { path: '/game/:id', page: "O'yin", comp: 'GamePage', icon: '🎮', desc: "bitta o'yin tafsiloti" },
  { path: '/add', page: "Qo'shish", comp: 'AddPage', icon: '➕', desc: "yangi o'yin formasi" }
];

// ===== ILOVANING SIMULYATSIYASI (brauzer ichidagi sahifalar) =====
const UrlBar = ({ path }) => (
  <div className="url-bar"><span style={{ fontSize: 10 }}>🔒</span><span style={{ color: T.ink3 }}>robo-games.uz</span><span className="u-path">{path}</span></div>
);
const NavMenu = ({ active, onGo }) => (
  <div className="navmenu">
    {ROUTES.map(r => (
      <button key={r.path} className={`navlink ${active === r.path ? 'on' : ''}`} onClick={onGo ? () => onGo(r.path) : undefined}>{r.icon} {r.page}</button>
    ))}
  </div>
);
const HomeView = ({ onOpen }) => (
  <div className="fade-step" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
    {GAMES.map(g => <RoCard key={g.id} name={g.name} players={g.players} onClick={onOpen ? () => onOpen(g.id) : undefined} />)}
  </div>
);
const GameView = ({ id }) => {
  const g = gameById(id);
  return (
    <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      <div style={{ borderRadius: 12, height: 76, background: g.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38 }}>{g.emoji}</div>
      <div>
        <p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, fontSize: 18, color: T.ink, margin: 0 }}>{g.name}</p>
        <div style={{ display: 'flex', gap: 12, margin: '4px 0 6px', fontFamily: "'Manrope',sans-serif", fontSize: 12, color: T.ink2, fontWeight: 600 }}><span>👍 {g.likes}%</span><span>👥 {g.players}</span></div>
        <p className="body" style={{ margin: 0, color: T.ink2 }}>{g.desc}</p>
      </div>
    </div>
  );
};
const AddView = () => (
  <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
    <p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, fontSize: 17, color: T.ink, margin: 0 }}>Yangi o'yin qo'shish</p>
    <div style={{ background: T.bg, borderRadius: 9, padding: '9px 12px', fontFamily: "'Manrope',sans-serif", fontSize: 12.5, color: T.ink3 }}>O'yin nomi…</div>
    <div style={{ display: 'flex', gap: 6 }}>{['🤖', '🏎️', '🐉', '👾'].map(e => <span key={e} style={{ width: 30, height: 30, borderRadius: 8, background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>{e}</span>)}</div>
    <span style={{ alignSelf: 'flex-start', fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: 12, background: T.ink, color: '#fff', borderRadius: 8, padding: '7px 14px' }}>+ Qo'shish</span>
  </div>
);
const PageView = ({ path, gameId, onOpen }) => {
  if (path === '/') return <HomeView onOpen={onOpen} />;
  if (path === '/add') return <AddView />;
  if (String(path).startsWith('/game')) return <GameView id={gameId} />;
  return null;
};

// ===== SCREEN 0 — HOOK (bir sahifa vs ko'p sahifa: nega qayta yuklanmaydi?) =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [path, setPath] = useState('/');
  const [reloading, setReloading] = useState(false);
  const [tried, setTried] = useState(!!storedAnswer);
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const go = (p) => {
    if (reloading) return;
    setReloading(true); setTried(true);
    timer.current = setTimeout(() => { setPath(p); setReloading(false); }, 1050);
  };
  const OPTS = [
    { id: 'a', label: "Har sahifa alohida HTML fayl — qayta yuklanaveradi" },
    { id: 'b', label: 'React Router — sahifani qayta yuklamay, faqat kerakli qismni almashtiradi' },
    { id: 'c', label: 'Internet juda tez bo\'lgani uchun' }
  ];
  const pick = (v) => { if (picked !== null || !tried) return; setPicked(v); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: true }); };
  return (
    <Stage eyebrow="Kirish" screen={screen} scrollSignal={picked !== null} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 820 }}>Sahifalar orasida o'tganda nega ekran <span className="italic" style={{ color: T.accent }}>oqarib ketdi</span>?</h1>
        <Mentor>Robo-games hozir <b style={{ color: T.ink }}>bitta sahifa</b>. Lekin haqiqiy ilovada "Bosh", "O'yin", "Qo'shish" sahifalari bor. Menyudagi havolani <b style={{ color: T.ink }}>bosib ko'ring</b> — diqqat qiling: sahifa qanday ochiladi?</Mentor>
        <Zoomable>
        <Split>
          <Col>
            <p className="flow-label" style={{ margin: 0 }}>Eski usul — har bosishda qayta yuklanadi</p>
            <Win title="robo-games.uz" minH={150}>
              <div style={{ marginBottom: 9 }}><NavMenu active={path} onGo={go} /></div>
              <div style={{ position: 'relative', minHeight: 96 }}>
                {reloading && <div className="page-flash"><div className="spinner" /></div>}
                <UrlBar path={path} />
                <div style={{ marginTop: 9 }}><PageView path={path} gameId={1} /></div>
              </div>
            </Win>
            {tried && !reloading && <p className="small fade-step" style={{ color: T.accent, fontStyle: 'italic', margin: 0 }}>Sezdingizmi? Butun ekran oq bo'lib, qaytadan yuklandi — sekin va silliq emas.</p>}
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Instagram va Roblox sahifalar orasida bir zumda o'tadi. Nega?</p>
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
            {!tried && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>Avval menyudan bir sahifani oching ←</p>}
            {picked !== null && <p className="hook-ack fade-step">Aynan! <b>React Router</b> sahifani butunlay qayta yuklamaydi — u faqat <b>ekranning kerakli qismini</b> almashtiradi. Shuning uchun o'tish bir zumda. Bugun robo-games'ni shunday <b>ko'p sahifali ilovaga</b> aylantiramiz.</p>}
          </Col>
        </Split>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA (va'da + bugungi 5 qadam) =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const STEPS = [
    { text: 'Manzillar ro\'yxati — o\'zingiz tuzasiz', tag: 'manzil → sahifa' },
    { text: 'Routes va Route', tag: '<Route path element />' },
    { text: 'Link — qayta yuklamaydigan havola', tag: '<Link> vs <a>' },
    { text: 'URL parametr', tag: '/game/:id' },
    { text: 'AI bilan qurish va tekshirish', tag: 'vibecoding' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const PreviewBlock = (
    <Col>
      <p className="flow-label">Dars oxirida — sizning ko'p sahifali ilovangiz</p>
      <Win title="robo-games.uz" minH={120}>
        <div style={{ marginBottom: 8 }}><NavMenu active="/" /></div>
        <UrlBar path="/" />
        <div style={{ marginTop: 8 }}><HomeView /></div>
      </Win>
      <pre className="code-box" style={{ padding: '10px 14px' }}>{'<Routes>'}{'\n  '}<Jx>{'<Route '}</Jx><At>path</At>=<St>"/"</St> <At>element</At>{'={<Home />}'}<Jx>{' />'}</Jx>{'\n  …'}{'\n'}{'</Routes>'}</pre>
      <p className="mono small" style={{ color: T.accent, margin: 0 }}>→ bir nechta sahifa — bitta ilovada</p>
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
          <h2 className="title h-title fade-up">Bugun <span className="italic" style={{ color: T.accent }}>rejani siz tuzasiz</span> — AI esa yozadi.</h2>
        </div>
        <Mentor>Tartib oddiy: avval <b style={{ color: T.ink }}>siz</b> belgilaysiz — qaysi manzil qaysi sahifani ochadi. Keyin <b style={{ color: T.ink }}>AI</b> kodni yozadi, so'ng <b style={{ color: T.ink }}>siz</b> uni tekshirasiz. Router'ni shu — qurish jarayonida — o'rganasiz.</Mentor>
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

// ===== SCREEN 2 — ME'MOR: ROUTE XARITASI (qo'lda chizish) =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [taskIdx, setTaskIdx] = useState(storedAnswer ? ROUTES.length : 0);
  const [shakeComp, setShakeComp] = useState(null);
  const matchTimer = useRef(null);
  const done = taskIdx >= ROUTES.length;
  useEffect(() => () => clearTimeout(matchTimer.current), []);
  const cur = ROUTES[Math.min(taskIdx, ROUTES.length - 1)];
  const PAGES = ['Bosh', "O'yin", "Qo'shish"];
  const pageOf = (nm) => ROUTES.find(r => r.page === nm);
  const tap = (nm) => {
    if (done) return;
    if (pageOf(nm).path === cur.path) { setTaskIdx(t => t + 1); }
    else { clearTimeout(matchTimer.current); setShakeComp(nm); matchTimer.current = setTimeout(() => setShakeComp(null), 450); }
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="1-qadam · manzillar ro'yxati" screen={screen} scrollSignal={done} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Ro'yxatni tuzing (${Math.min(taskIdx, ROUTES.length)}/3)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Qaysi <span className="italic" style={{ color: T.accent }}>manzil</span> qaysi <span className="italic" style={{ color: T.accent }}>sahifaga</span> olib boradi?</h2></div>
        <Mentor>Ilovani qurishdan oldin bitta <b style={{ color: T.ink }}>ro'yxat</b> kerak: qaysi manzil (URL) qaysi sahifani ochadi. Har bir manzil uchun to'g'ri sahifani tanlang — ro'yxatni o'zingiz yig'asiz.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Manzillar</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ROUTES.map((r, i) => {
                const matched = i < taskIdx;
                const active = !done && i === taskIdx;
                return (
                  <div key={r.path} className="routerow" style={{ boxShadow: active ? `inset 0 0 0 1.5px ${T.accent}` : (matched ? `inset 0 0 0 1.5px ${T.success}` : `0 4px 12px -6px rgba(${T.shadowBase},0.14)`), background: matched ? T.successSoft : T.paper }}>
                    <span className="mono" style={{ fontSize: 12.5, fontWeight: 700, color: matched ? T.success : T.ink }}>{r.path}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 12, color: T.ink3 }}>→</span>
                    <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12, fontWeight: 700, color: matched ? T.success : T.ink3 }}>{matched ? `${r.icon} ${r.page}` : (active ? '?' : '…')}</span>
                  </div>
                );
              })}
            </div>
          </Col>
          <Col>
            {!done ? (
              <>
                <div className="sk-info" key={taskIdx}><p className="body" style={{ margin: 0, color: T.ink }}>Manzil <span className="mono" style={{ color: T.accent }}>{cur.path}</span> — <b>{cur.desc}</b>. Qaysi sahifa?</p></div>
                <p className="flow-label" style={{ margin: 0 }}>Sahifani tanlang</p>
                <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {PAGES.map(nm => (
                    <button key={nm} className={`gchip ${shakeComp === nm ? 'shake' : ''}`} onClick={() => tap(nm)}>{pageOf(nm).icon} {nm}</button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p className="flow-label" style={{ margin: 0 }}>Tayyor ro'yxat — kod tilida</p>
                <pre className="code-box fade-step" style={{ lineHeight: 1.9 }}>
                  {ROUTES.map(r => (
                    <React.Fragment key={r.path}><Cm>{`// ${r.path}`}</Cm>{`  → ${r.comp}\n`}</React.Fragment>
                  ))}
                </pre>
                <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana sizning <b>ro'yxatingiz</b>: 3 ta manzil, 3 ta sahifa. Endi buni React kodiga aylantiramiz.</p></div>
              </>
            )}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — ROUTES / ROUTE (3 bo'lakni bosib o'rganish) =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const PARTS = {
    routes: { lbl: '<Routes>', t: 'yo\'l tanlovchi', desc: "Barcha route'larni o'rab turadi. URL'ga qarab qaysi birini ko'rsatishni hal qiladi." },
    path: { lbl: 'path="/"', t: 'manzil', desc: "Qaysi URL'da ishlashi. Brauzer manzili shunga teng bo'lsa — shu route tanlanadi." },
    element: { lbl: 'element={<Home />}', t: 'qaysi sahifa', desc: "Shu manzilda ko'rsatiladigan komponent. Manzil → komponent." }
  };
  const KEYS = ['routes', 'path', 'element'];
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(storedAnswer ? new Set(KEYS) : new Set());
  const done = seen.size >= 3;
  const tap = (k) => { setActive(k); setSeen(prev => { const s = new Set(prev); s.add(k); return s; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Routes va Route" screen={screen} scrollSignal={done} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/3 bo'lakni ko'ring`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bu ro'yxatni React <span className="italic" style={{ color: T.accent }}>qaysi so'zlar</span> bilan yozadi?</h2></div>
        <Mentor>Atigi ikki teg yetadi: <span className="mono">{'<Routes>'}</span> va <span className="mono">{'<Route>'}</span>. Har <span className="mono">{'<Route>'}</span> — bitta qator: <b style={{ color: T.ink }}>path</b> (manzil) va <b style={{ color: T.ink }}>element</b> (qaysi sahifa). Kodning <b style={{ color: T.ink }}>uchta bo'lagini</b> bosib ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <pre className="code-box fade-up delay-1" style={{ lineHeight: 2 }}>
              <span onClick={() => tap('routes')} style={{ cursor: 'pointer', borderRadius: 6, padding: '1px 5px', background: active === 'routes' ? 'rgba(255,79,40,0.18)' : (seen.has('routes') ? 'rgba(31,122,77,0.13)' : 'transparent') }}><Jx>{'<Routes>'}</Jx></span>{'\n'}
              {'  '}<Jx>{'<Route '}</Jx>
              <span onClick={() => tap('path')} style={{ cursor: 'pointer', borderRadius: 6, padding: '1px 4px', background: active === 'path' ? 'rgba(255,79,40,0.18)' : (seen.has('path') ? 'rgba(31,122,77,0.13)' : 'transparent') }}><At>path</At>=<St>"/"</St></span>{' '}
              <span onClick={() => tap('element')} style={{ cursor: 'pointer', borderRadius: 6, padding: '1px 4px', background: active === 'element' ? 'rgba(255,79,40,0.18)' : (seen.has('element') ? 'rgba(31,122,77,0.13)' : 'transparent') }}><At>element</At>{'={<Home />}'}</span>
              <Jx>{' />'}</Jx>{'\n'}
              {'  '}<Jx>{'<Route '}</Jx><At>path</At>=<St>"/add"</St> <At>element</At>{'={<AddPage />}'}<Jx>{' />'}</Jx>{'\n'}
              <Jx>{'</Routes>'}</Jx>
            </pre>
          </Col>
          <Col>
            {active ? (
              <div className="sk-info" key={active}>
                <div className="sk-tagbig"><span className="sk-wordbadge mono">{PARTS[active].lbl}</span><span style={{ fontWeight: 600, color: T.ink }}>{PARTS[active].t}</span></div>
                <p className="body" style={{ color: T.ink, margin: '10px 0 0' }}>{PARTS[active].desc}</p>
              </div>
            ) : (
              <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Kod bo'lagini bosing</p></div>
            )}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Formula oddiy: har sahifa = bitta <span className="mono">{'<Route path="…" element={<… />} />'}</span>. <span className="mono">{'<Routes>'}</span> esa URL'ga qarab qaysi birini ko'rsatishni tanlaydi.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 (Route nima qiladi?) =====
const Screen4 = (props) => (
  <QuestionScreen {...props} idx={4} scope="module-mikro" eyebrow="Mashq · 1-savol"
    questionText='<Route path="/add" element={<AddPage />} /> nima qiladi?'
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}><span className="mono" style={{ color: T.accent }}>{'<Route path="/add" element={<AddPage />} />'}</span> <span className="italic" style={{ color: T.accent }}>nima qiladi</span>?</h2></>}
    options={['/add manzilini AddPage sahifasiga bog\'laydi', "Yangi o'yin qo'shadi", 'Sahifani qayta yuklaydi', 'Serverga so\'rov yuboradi']} correctIdx={0}
    explainCorrect="To'g'ri! Route — ro'yxatning bitta qatori: path (manzil) + element (sahifa). /add ochilganda Router AddPage komponentini ko'rsatadi."
    explainWrong={{
      1: "Yo'q — Route hech narsa qo'shmaydi. U faqat manzilni sahifaga bog'laydi: /add → AddPage.",
      2: "Aksincha — Router sahifani QAYTA YUKLAMAydi. Route shunchaki manzil → komponent bog'lamasi.",
      3: "Yo'q — bu fetch'ning ishi. Route — manzil va sahifa o'rtasidagi ro'yxat qatori.",
      default: "Route manzilni komponentga bog'laydi: path=\"/add\" → element={<AddPage />}."
    }} />
);

// ===== SCREEN 5 — LINK vs A (qayta yuklash farqi) =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [aReload, setAReload] = useState(false);
  const [aPath, setAPath] = useState('/');
  const [linkPath, setLinkPath] = useState('/');
  const [triedA, setTriedA] = useState(!!storedAnswer);
  const [triedLink, setTriedLink] = useState(!!storedAnswer);
  const timer = useRef(null);
  const done = triedA && triedLink;
  useEffect(() => () => clearTimeout(timer.current), []);
  const goA = () => {
    if (aReload) return;
    setTriedA(true); setAReload(true);
    timer.current = setTimeout(() => { setAPath(p => (p === '/' ? '/add' : '/')); setAReload(false); }, 1000);
  };
  const goLink = () => { setTriedLink(true); setLinkPath(p => (p === '/' ? '/add' : '/')); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Link vs a" screen={screen} scrollSignal={done} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Ikkalasini ham sinang"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Havolaning <span className="italic" style={{ color: T.accent }}>ikki turi</span> — qaysi biri ekranni qayta yuklamaydi?</h2></div>
        <Mentor>Bu — Router'ning eng muhim siri. Oddiy <span className="mono">{'<a href>'}</span> brauzerni <b style={{ color: T.ink }}>butun sahifani qayta yuklashga</b> majbur qiladi. Router'ning <span className="mono">{'<Link to>'}</span> esa faqat kerakli qismni almashtiradi. <b style={{ color: T.ink }}>Ikkala tugmani</b> sinab, farqni o'z ko'zingiz bilan ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label" style={{ margin: 0 }}><span className="mono">{'<a href="/add">'}</span> bilan</p>
            <Win title="robo-games.uz" minH={120}>
              <div style={{ position: 'relative', minHeight: 96 }}>
                {aReload && <div className="page-flash"><div className="spinner" /></div>}
                <UrlBar path={aPath} />
                <div style={{ marginTop: 9 }}><PageView path={aPath} gameId={1} /></div>
              </div>
            </Win>
            <button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={goA} disabled={aReload}>{aReload ? 'Qayta yuklanmoqda…' : '‹a› bilan o\'tish'} {triedA && !aReload ? '✓' : ''}</button>
          </Col>
          <Col>
            <p className="flow-label" style={{ margin: 0 }}><span className="mono">{'<Link to="/add">'}</span> bilan</p>
            <Win title="robo-games.uz" minH={120}>
              <div style={{ minHeight: 96 }}>
                <UrlBar path={linkPath} />
                <div style={{ marginTop: 9 }}><PageView path={linkPath} gameId={1} /></div>
              </div>
            </Win>
            <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={goLink}>‹Link› bilan o'tish {triedLink ? '✓' : ''}</button>
          </Col>
        </div>
        </Zoomable>
        {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Ko'rdingizmi? <span className="mono">{'<a>'}</span> — oq ekran, sekin (butun ilova qaytadan yuklandi). <span className="mono">{'<Link>'}</span> — bir zumda, silliq. Shuning uchun React'da <b>doim {'<Link>'}</b> ishlatiladi, <span className="mono">{'<a>'}</span> emas.</p></div>}
      </div>
    </Stage>
  );
};

// ===== SCREEN 5b — TEST 2 (Link vs a) =====
const Screen5b = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Tekshiruv"
    questionText="Qaysi biri sahifani QAYTA YUKLAMAydi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Mustahkamlash</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Qaysi biri sahifani <span className="italic" style={{ color: T.accent }}>qayta yuklamaydi</span>?</h2></>}
    options={['<a href="/add">', '<Link to="/add"> — Router\'ning havolasi', 'Ikkalasi ham qayta yuklaydi', 'Ikkalasi ham bir xil ishlaydi']} correctIdx={1}
    explainCorrect="To'g'ri! <Link> — Router'ning havolasi: sahifani qayta yuklamay, faqat kerakli qismni almashtiradi. Tez va silliq."
    explainWrong={{
      0: "Esingizdami oq ekran? <a href> brauzerni butun sahifani qayta yuklashga majbur qiladi.",
      2: "Yo'q — <Link> qayta yuklamaydi. Aynan shu uning vazifasi.",
      3: "Yo'q — farqi katta: <a> qaytadan yuklaydi, <Link> esa yo'q.",
      default: "<Link to> qayta yuklamaydi; <a href> esa butun sahifani qaytadan yuklaydi."
    }} />
);

// ===== SCREEN 6 — URL PARAMETR (/game/:id) =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [openId, setOpenId] = useState(storedAnswer ? 2 : null);
  const [seen, setSeen] = useState(storedAnswer ? new Set([1, 2]) : new Set());
  const done = seen.size >= 2;
  const open = (id) => { setOpenId(id); setSeen(prev => { const s = new Set(prev); s.add(id); return s; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="URL parametr" screen={screen} scrollSignal={done} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/2 o'yinni oching`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bitta "O'yin" sahifasi <span className="italic" style={{ color: T.accent }}>minglab o'yinga</span> qanday yetadi?</h2></div>
        <Mentor>Har o'yinga alohida sahifa yozmaymiz! Manzilda <b style={{ color: T.ink }}>o'zgaruvchan joy</b> bor: <span className="mono">/game/<span style={{ color: T.accent }}>:id</span></span>. <span className="mono">:id</span> — bo'sh katak. Adopt Me bosilsa <span className="mono">/game/1</span>, Doors bosilsa <span className="mono">/game/4</span>. Bitta sahifa — istalgan o'yin. Kartochkalarni bosib ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Bosh sahifa — kartochkani bosing</p>
            <Win title="robo-games.uz" minH={120}>
              <UrlBar path="/" />
              <div style={{ marginTop: 8 }}><HomeView onOpen={open} /></div>
            </Win>
          </Col>
          <Col>
            <p className="flow-label">O'yin sahifasi</p>
            <Win title="robo-games.uz" minH={120}>
              {openId ? <><UrlBar path={`/game/${openId}`} /><div style={{ marginTop: 9 }}><GameView id={openId} /></div></>
                : <p style={{ color: T.ink3, fontStyle: 'italic', margin: 0, fontFamily: 'Georgia, serif', fontSize: 13 }}>Chapdan o'yinni bosing…</p>}
            </Win>
            {openId && (
              <div className="code-box fade-step" style={{ padding: '9px 13px' }}>
                <TLine out={<span><Cm>{'// manzildan o\'qiladi:'}</Cm></span>} />
                <TLine out={<span><Jx>{'const'}</Jx>{' { '}<At>id</At>{' } = useParams();  '}<Cm>{`// id = "${openId}"`}</Cm></span>} />
              </div>
            )}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}><span className="mono">:id</span> — manzildagi o'zgaruvchi. Sahifa uni <span className="mono">useParams()</span> bilan o'qiydi va aynan o'sha o'yinni ko'rsatadi. Bitta kod — barcha o'yinlar uchun.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — NAVIGATSIYA SIMULYATSIYASI (to'liq ilova) =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [path, setPath] = useState('/');
  const [openId, setOpenId] = useState(1);
  const [seen, setSeen] = useState(storedAnswer ? new Set(['/', '/game/:id', '/add']) : new Set(['/']));
  const done = seen.size >= 3;
  const go = (p) => { setPath(p); setSeen(prev => { const s = new Set(prev); s.add(p); return s; }); };
  const openGame = (id) => { setOpenId(id); setPath('/game/:id'); setSeen(prev => { const s = new Set(prev); s.add('/game/:id'); return s; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const realPath = path === '/game/:id' ? `/game/${openId}` : path;
  return (
    <Stage eyebrow="Navigatsiya" screen={screen} scrollSignal={done} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Har 3 sahifani oching (${seen.size}/3)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Endi <span className="italic" style={{ color: T.accent }}>to'liq ilova</span> — sahifalar orasida yuring.</h2></div>
        <Mentor>Mana yig'ilgan ilova: tepada menyu, pastda joriy sahifa. Menyudan bosing yoki o'yin kartochkasini oching — diqqat qiling: <b style={{ color: T.ink }}>manzil (URL) o'zgaradi</b>, lekin ekran <b style={{ color: T.ink }}>oqarmaydi</b>. Har 3 sahifani aylanib chiqing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <Win title="robo-games.uz" minH={190}>
              <div style={{ marginBottom: 9 }}><NavMenu active={path} onGo={go} /></div>
              <UrlBar path={realPath} />
              <div style={{ marginTop: 10 }}><PageView path={path} gameId={openId} onOpen={openGame} /></div>
            </Win>
          </Col>
          <Col>
            <p className="flow-label">Ziyorat qilingan sahifalar</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {ROUTES.map(r => {
                const ok = seen.has(r.path);
                return (
                  <div key={r.path} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 13px', borderRadius: 11, background: ok ? T.successSoft : T.paper, boxShadow: ok ? `inset 0 0 0 1.5px ${T.success}` : `0 4px 12px -6px rgba(${T.shadowBase},0.14)`, transition: 'all 0.3s' }}>
                    <span style={{ fontWeight: 700, color: ok ? T.success : T.ink3 }}>{ok ? '✓' : '○'}</span>
                    <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12.5, fontWeight: 700, color: T.ink }}>{r.icon} {r.page}</span>
                    <span className="mono" style={{ marginLeft: 'auto', fontSize: 11, color: T.ink3 }}>{r.path}</span>
                  </div>
                );
              })}
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bitta ilova, uchta sahifa, hech qanday qayta yuklanish yo'q. Aynan shu — <b>Single Page App</b> (bir sahifali ilova): brauzer bitta sahifa deb biladi, Router esa ichini almashtiradi.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — TEST 3 (:id ma'nosi) =====
const Screen8 = (props) => (
  <QuestionScreen {...props} idx={8} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="/game/7 manzilida :id nimaga teng?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}><span className="mono" style={{ color: T.accent }}>/game/7</span> manzilida <span className="mono" style={{ color: T.accent }}>:id</span> <span className="italic" style={{ color: T.accent }}>nimaga teng</span>?</h2></>}
    options={['7 — aynan o\'sha o\'yinning raqami', 'Barcha o\'yinlar', 'Katalogning 7-sahifasi', '7 soniya kutish']} correctIdx={0}
    explainCorrect="To'g'ri! :id — manzildagi o'zgaruvchan joy. /game/7 ochilganda useParams() id sifatida 7 ni beradi, sahifa esa 7-o'yinni ko'rsatadi."
    explainWrong={{
      1: "Yo'q — barcha o'yinlar Bosh sahifada (/). /game/7 esa faqat bittasi — 7-o'yin.",
      2: "Yo'q — bu sahifa raqami emas. :id — o'yinning raqami (id).",
      3: "Yo'q — vaqtga aloqasi yo'q. 7 — o'yinning id raqami.",
      default: "/game/:id da :id — o'yin raqami. /game/7 → id = 7."
    }} />
);

// ===== SCREEN 9 — VIBECODING (REJISSYOR: AI ilovani quradi) =====
const Screen9 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const TASKS = [
    { id: 't1', label: "Router o'rnatib, 3 sahifa qo'sh: Bosh, O'yin, Qo'shish", plan: ['Ro\'yxatni kodga aylantiraman', "Har sahifaga bitta <Route path element /> yozaman"], code: <>{'<Routes>'}{'\n  '}<Jx>{'<Route '}</Jx><At>path</At>=<St>"/"</St> <At>element</At>{'={<Home />}'}<Jx>{' />'}</Jx>{'\n  '}<Jx>{'<Route '}</Jx><At>path</At>=<St>"/game/:id"</St> <At>element</At>{'={<GamePage />}'}<Jx>{' />'}</Jx>{'\n  '}<Jx>{'<Route '}</Jx><At>path</At>=<St>"/add"</St> <At>element</At>{'={<AddPage />}'}<Jx>{' />'}</Jx>{'\n'}{'</Routes>'}</> },
    { id: 't2', label: "Tepaga menyu qo'sh — har sahifaga havola", plan: ['Navbar komponentiga uchta <Link> qo\'shaman', "<a> emas, <Link to> ishlataman — qayta yuklanmasin"], code: <><Jx>{'<Link '}</Jx><At>to</At>=<St>"/"</St><Jx>{'>'}</Jx>{'Bosh'}<Jx>{'</Link>'}</Jx>{'\n'}<Jx>{'<Link '}</Jx><At>to</At>=<St>"/add"</St><Jx>{'>'}</Jx>{'Qo\'shish'}<Jx>{'</Link>'}</Jx></> },
    { id: 't3', label: "O'yin kartochkasi bosilganda o'sha o'yin sahifasiga o'tsin", plan: ['Har kartochkani <Link> ichiga olaman', "Manzilga o'yin id'sini qo'shaman: /game/ + g.id"], code: <><Jx>{'<Link '}</Jx><At>to</At>{'={'}<St>"/game/"</St>{' + g.id}'}<Jx>{'>'}</Jx>{'\n  '}<Jx>{'<GameCard '}</Jx><At>name</At>{'={g.name}'}<Jx>{' />'}</Jx>{'\n'}<Jx>{'</Link>'}</Jx></> }
  ];
  const [task, setTask] = useState(null);
  const [resId, setResId] = useState(null); // t3 natijasi: bosilgan o'yin sahifasi
  const [phase, setPhase] = useState(storedAnswer ? 'done' : 'idle');
  const timer = useRef(null);
  const done = phase === 'done';
  useEffect(() => () => clearTimeout(timer.current), []);
  const choose = (id) => { clearTimeout(timer.current); setTask(id); setPhase('planned'); setResId(null); };
  const approve = () => { clearTimeout(timer.current); setPhase('building'); timer.current = setTimeout(() => setPhase('done'), 1300); };
  const cur = TASKS.find(t => t.id === task) || (storedAnswer ? TASKS[0] : null);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="AI bilan qurish" screen={screen} scrollSignal={done} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Agent bilan quring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Ro'yxat tayyor — endi <span className="italic" style={{ color: T.accent }}>AI quradi</span>.</h2></div>
        <Mentor>Siz qaysi manzil qaysi sahifani ochishini bilasiz, demak agent kodini <b style={{ color: T.ink }}>tekshira olasiz</b>: route'lar to'g'rimi, <span className="mono">{'<Link>'}</span> ishlatilganmi (<span className="mono">{'<a>'}</span> emas), <span className="mono">:id</span> bormi. Buyruq bering, rejani <b style={{ color: T.ink }}>tasdiqlang</b>, kodni o'qing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">1. Agentga so'z bilan ayting</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {TASKS.map(t => <button key={t.id} className={`chip ${task === t.id ? 'chip-on' : ''}`} onClick={() => choose(t.id)} style={{ justifyContent: 'flex-start', textAlign: 'left' }}>"{t.label}"</button>)}
            </div>
            {!cur && <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Yuqoridan bitta buyruqni tanlang</p></div>}
            {cur && (
              <div className="ai-card fade-step" key={task || 'stored'}>
                <div className="ai-row"><span className="ai-badge" style={{ background: T.ink }}>Agent</span><span className="ai-bubble">{phase === 'planned' ? 'Mana rejam — tasdiqlaysizmi?' : (phase === 'building' ? 'Yozyapman…' : 'Bajardim — kodni tekshiring')}</span></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {cur.plan.map((p, i) => <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}><span style={{ color: phase === 'planned' ? T.ink3 : T.success }}>{phase === 'planned' ? '○' : '✓'}</span><span style={{ color: T.ink }}>{p}</span></div>)}
                </div>
                {phase === 'planned' && <button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={approve}>Rejani tasdiqlash</button>}
                {phase === 'building' && <p className="ai-prompt" style={{ color: T.accent }}>Kod yozilyapti…</p>}
                {phase === 'done' && <div className="ai-code fade-step"><div className="ai-line ok" style={{ cursor: 'default', whiteSpace: 'pre-wrap' }}>{cur.code}</div></div>}
              </div>
            )}
          </Col>
          <Col>
            <p className="flow-label">2. Natija — robo-games.uz {done && cur?.id === 't3' ? '· kartochkani bosing' : ''}</p>
            <Win title="robo-games.uz" minH={150}>
              {done && cur ? (
                cur.id === 't3' ? (
                  <div className="fade-step">
                    <NavMenu active="/" />
                    <div style={{ marginTop: 9 }}><UrlBar path={resId ? `/game/${resId}` : '/'} /></div>
                    <div style={{ marginTop: 9 }}>
                      {resId
                        ? <div key={`g${resId}`} className="fade-step"><GameView id={resId} /><button className="btn-soft" style={{ marginTop: 10 }} onClick={() => setResId(null)}>← Bosh sahifa</button></div>
                        : <><HomeView onOpen={setResId} /><p className="small" style={{ color: T.accent, fontStyle: 'italic', margin: '8px 0 0' }}>O'yin kartochkasini bosing — o'yin sahifasiga o'tadi (qayta yuklanmaydi).</p></>}
                    </div>
                  </div>
                ) : (
                  <div className="fade-step">
                    <NavMenu active={cur.id === 't2' ? '/add' : '/'} />
                    <div style={{ marginTop: 9 }}><UrlBar path={cur.id === 't2' ? '/add' : '/'} /></div>
                    <div style={{ marginTop: 9 }}><PageView path={cur.id === 't2' ? '/add' : '/'} gameId={1} /></div>
                  </div>
                )
              ) : (
                <p style={{ color: T.ink3, fontStyle: 'italic', margin: 0, fontFamily: 'Georgia, serif', fontSize: 13 }}>Buyruq bering va rejani tasdiqlang…</p>
              )}
            </Win>
            {done
              ? <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Kodni o'qing: route'lar ro'yxatga mos, <span className="mono">{'<Link>'}</span> ishlatilgan, manzilga <span className="mono">id</span> qo'shilgan. Agent ishini <b>tekshirib</b> qabul qildingiz.</p></div>
              : <p className="body" style={{ margin: 0, color: T.ink3, fontSize: 13 }}>Natija shu yerda paydo bo'ladi — keyin uni o'zingiz tekshirasiz.</p>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 10 — useNavigate (qo'shgandan keyin Bosh'ga qaytish) =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [phase, setPhase] = useState(storedAnswer ? 3 : 0); // 0 forma, 1 POST, 2 navigate, 3 bosh
  const [running, setRunning] = useState(false);
  const timer = useRef(null);
  const done = phase >= 3;
  useEffect(() => () => clearTimeout(timer.current), []);
  const save = () => {
    if (running) return;
    clearTimeout(timer.current); setRunning(true); setPhase(1);
    timer.current = setTimeout(() => {
      setPhase(2);
      timer.current = setTimeout(() => { setPhase(3); setRunning(false); }, 800);
    }, 850);
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="useNavigate" screen={screen} scrollSignal={done} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "O'yin qo'shing"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">"Saqlash" bosilgach, Bosh sahifaga <span className="italic" style={{ color: T.accent }}>kim olib o'tadi</span>?</h2></div>
        <Mentor>Diqqat qiling: foydalanuvchi hech qanday havolani <b style={{ color: T.ink }}>bosmaydi</b> — u faqat "Saqlash"ni bosadi. Keyin ilova uni <b style={{ color: T.ink }}>o'zi</b> Bosh sahifaga olib o'tishi kerak — yangi o'yinini ko'rsin. Bosadigan havola yo'q, demak <span className="mono">{'<Link>'}</span> ish bermaydi. Bu yerda <b style={{ color: T.ink }}>kodning o'zi</b> sahifani almashtiradi: <span className="mono">useNavigate()</span>.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Qo'shish sahifasi (/add)</p>
            <Win title="robo-games.uz" minH={140}>
              <UrlBar path={phase >= 3 ? '/' : '/add'} />
              <div style={{ marginTop: 9 }}>
                {phase >= 3
                  ? <div className="fade-step"><p style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: 12.5, color: T.success, margin: '0 0 7px' }}>✓ Bosh sahifa — yangi o'yin qo'shildi!</p><div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}><RoCard name="Adopt Me!" /><RoCard name="Doors" /><div style={{ borderRadius: 12, background: 'linear-gradient(135deg,#B9A8F4,#6A4AC9)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 84, color: '#fff' }}><span style={{ fontSize: 22 }}>🤖</span><span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: 10, marginTop: 3 }}>Robo Race</span></div></div></div>
                  : <AddView />}
              </div>
            </Win>
            {phase < 3 && <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={save} disabled={running}>{running ? 'Saqlanmoqda…' : '💾 Saqlash'}</button>}
          </Col>
          <Col>
            <p className="flow-label">Kod va konsol</p>
            <pre className="code-box fade-up delay-1" style={{ lineHeight: 1.9 }}>
              <Jx>{'const'}</Jx>{' navigate = useNavigate();'}{'\n\n'}
              <Jx>{'function'}</Jx>{' saqlash() {'}{'\n'}
              <span style={{ background: running && phase === 1 ? 'rgba(255,79,40,0.18)' : 'transparent', borderRadius: 5, padding: '0 4px' }}>{'  '}fetch(url, {'{ '}<At>method</At>: <St>'POST'</St>{' }'});  <Cm>{'// qo\'shildi'}</Cm></span>{'\n'}
              <span style={{ background: phase >= 2 ? 'rgba(31,122,77,0.14)' : 'transparent', borderRadius: 5, padding: '0 4px' }}>{'  '}navigate(<St>'/'</St>);  <Cm>{'// Bosh\'ga qaytaramiz'}</Cm></span>{'\n'}
              {'}'}
            </pre>
            <div className="code-box" style={{ padding: '9px 13px', minHeight: 56 }}>
              {phase === 0 && <TLine out={<span style={{ color: CODE.comment, fontStyle: 'italic' }}>"Saqlash" tugmasini bosing…</span>} />}
              {phase >= 1 && <TLine out={<span className="el-in" style={{ display: 'inline-block' }}><span style={{ color: T.success, fontWeight: 700 }}>POST</span> /games → <span style={{ color: CODE.str }}>201 Created</span></span>} />}
              {phase >= 2 && <TLine out={<span className="el-in" style={{ display: 'inline-block' }}>navigate(<span style={{ color: CODE.str }}>'/'</span>) → <span style={{ color: CODE.str }}>Bosh sahifa ochildi ✓</span></span>} />}
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}><b>useNavigate()</b> — tugma bosilgani kabi hodisadan keyin <b>kod orqali</b> sahifa almashtirish. <span className="mono">{'<Link>'}</span> — bosish uchun, <span className="mono">navigate()</span> — kod ichida.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — AMALIYOT: O'Z SAHIFANGIZ =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const POOL = [
    { path: '/top', page: 'TOP o\'yinlar', icon: '🔥' },
    { path: '/sevimli', page: 'Sevimlilar', icon: '⭐' },
    { path: '/about', page: 'Men haqimda', icon: '👤' }
  ];
  const [added, setAdded] = useState(storedAnswer ? POOL[0] : null);
  const [visited, setVisited] = useState(!!storedAnswer);
  const done = !!added && visited;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const baseNav = ['/', '/game/:id', '/add'];
  return (
    <Stage eyebrow="Amaliyot · o'z sahifangiz" screen={screen} scrollSignal={done} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : (!added ? 'Sahifa tanlang' : 'Sahifani oching')} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Endi o'zingiz: ilovaga <span className="italic" style={{ color: T.accent }}>yangi sahifa</span> qo'shing.</h2></div>
        <Mentor>Quruvchi sifatida sinab ko'ring. Bitta yangi sahifa tanlang — u <b style={{ color: T.ink }}>ro'yxatga</b> (yangi <span className="mono">{'<Route>'}</span>) va <b style={{ color: T.ink }}>menyuga</b> (yangi <span className="mono">{'<Link>'}</span>) qo'shiladi. Keyin menyudan o'sha sahifani oching.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Qaysi sahifani qo'shamiz?</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {POOL.map(p => <button key={p.path} className={`chip ${added?.path === p.path ? 'chip-on' : ''}`} onClick={() => { setAdded(p); setVisited(false); }}>{p.icon} {p.page}</button>)}
            </div>
            <pre className="code-box fade-up delay-2" style={{ lineHeight: 1.85 }}>
              <Jx>{'<Routes>'}</Jx>{'\n'}
              <Cm>{'  // mavjud 3 route…'}</Cm>{'\n'}
              {added
                ? <span className="el-in" style={{ display: 'inline-block', background: 'rgba(31,122,77,0.13)', borderRadius: 5, padding: '0 4px' }}>{'  '}<Jx>{'<Route '}</Jx><At>path</At>=<St>"{added.path}"</St> <At>element</At>{`={<${added.page === "Men haqimda" ? 'About' : (added.path === '/top' ? 'TopPage' : 'FavPage')} />}`}<Jx>{' />'}</Jx>{'  '}<Cm>{'// + yangi'}</Cm></span>
                : <Cm>{'  // sahifa tanlang…'}</Cm>}
              {'\n'}<Jx>{'</Routes>'}</Jx>
            </pre>
          </Col>
          <Col>
            <p className="flow-label">Ilova {added && !visited ? '— menyudan yangi sahifani oching' : ''}</p>
            <Win title="robo-games.uz" minH={140}>
              <div className="navmenu" style={{ marginBottom: 9 }}>
                {[...baseNav.map(p => ROUTES.find(r => r.path === p)), added].filter(Boolean).map(r => (
                  <button key={r.path} className={`navlink ${visited && added && r.path === added.path ? 'on' : (!added || r.path !== added.path ? '' : '')}`} onClick={added && r.path === added.path ? () => setVisited(true) : undefined} style={added && r.path === added.path ? { boxShadow: `inset 0 0 0 1.5px ${T.accent}` } : undefined}>{r.icon} {r.page}</button>
                ))}
              </div>
              <UrlBar path={visited && added ? added.path : '/'} />
              <div style={{ marginTop: 10 }}>
                {visited && added
                  ? <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '14px 0' }}><span style={{ fontSize: 34 }}>{added.icon}</span><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, fontSize: 17, color: T.ink, margin: 0 }}>{added.page}</p><p className="small" style={{ color: T.ink3, margin: 0 }}>sizning yangi sahifangiz</p></div>
                  : <HomeView />}
              </div>
            </Win>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana shunday! Yangi sahifa = bitta <span className="mono">{'<Route>'}</span> + bitta <span className="mono">{'<Link>'}</span>. Ilovangiz endi 4 sahifali — va siz uni o'zingiz kengaytirdingiz.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — TEST 4 (useNavigate stsenariy) =====
const Screen12 = (props) => (
  <QuestionScreen {...props} idx={12} scope="module-mikro" eyebrow="Mashq · 4-savol"
    questionText="Forma saqlangach, o'quvchini avtomatik Bosh sahifaga qaytarish kerak. Nima ishlatamiz?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>"Saqlash" bosilgach, <span className="italic" style={{ color: T.accent }}>kod orqali</span> Bosh sahifaga qaytarish — nima bilan?</h2></>}
    options={['<a href="/"> havolasi', 'useNavigate() — navigate("/") chaqiramiz', '<Link to="/"> tugmasi', 'fetch("/") so\'rovi']} correctIdx={1}
    explainCorrect="To'g'ri! Foydalanuvchi hech narsa bosmaydi — saqlashdan keyin KOD o'zi sahifani almashtiradi. Buning yo'li: useNavigate() → navigate('/')."
    explainWrong={{
      0: "Yo'q — <a> sahifani qayta yuklaydi va bu havola, kod emas. Bizga kod ichida o'tish kerak.",
      2: "<Link> — foydalanuvchi BOSADIGAN havola. Bu yerda hech kim bosmaydi; kod o'zi o'tkazadi.",
      3: "fetch — serverga so'rov. U sahifani almashtirmaydi. Sahifa almashtirish — navigate().",
      default: "Hodisadan keyin kod orqali o'tish = useNavigate() → navigate('/')."
    }} />
);

// ===== SCREEN 13 — DEBUGGING (a href → Link) =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [picked, setPicked] = useState(storedAnswer ? 'a' : null);
  const [fixed, setFixed] = useState(!!storedAnswer);
  const [flash, setFlash] = useState(false);
  const found = picked === 'a';
  const done = fixed;
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const demo = () => { if (fixed) return; setFlash(true); timer.current = setTimeout(() => setFlash(false), 1000); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Debugging" screen={screen} scrollSignal={found || fixed} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : (found ? 'Endi tuzating' : 'Xatoni toping')} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">AI yordam beradi — siz esa <span className="italic" style={{ color: T.accent }}>tekshirasiz</span>.</h2></div>
        <Mentor>AI menyuni bir zumda yozib berdi — lekin "Qo'shish"ni bosganda ilova <b style={{ color: T.ink }}>oqarib, qayta yuklanyapti</b>! Holat ham yo'qoladi. <b style={{ color: T.ink }}>Odamlar ham, AI ham</b> ba'zan adashadi. Menyudagi xato qatorni toping.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="ai-card fade-up delay-2">
              <div className="ai-row"><span className="ai-badge">AI</span><span className="ai-bubble">Menyuni yozdim:</span></div>
              <div className="ai-code">
                <div className={`ai-line ${picked === 'home' ? 'ok' : ''}`} onClick={() => { if (!found) setPicked('home'); }}><Jx>{'<Link '}</Jx><At>to</At>=<St>"/"</St><Jx>{'>'}</Jx>{'Bosh'}<Jx>{'</Link>'}</Jx></div>
                {!fixed ? (
                  <div className={`ai-line ${found ? 'bad' : ''}`} onClick={() => { if (!found) setPicked('a'); }}><Jx>{'<a '}</Jx><At>href</At>=<St>"/add"</St><Jx>{'>'}</Jx>{'Qo\'shish'}<Jx>{'</a>'}</Jx>{'  '}<Cm>{'// menyu havolasi'}</Cm></div>
                ) : (
                  <div className="ai-line ok el-in"><Jx>{'<Link '}</Jx><At>to</At>=<St>"/add"</St><Jx>{'>'}</Jx>{'Qo\'shish'}<Jx>{'</Link>'}</Jx>{'  '}<Cm>{'// tuzatildi!'}</Cm></div>
                )}
                <div className={`ai-line ${picked === 'game' ? 'ok' : ''}`} onClick={() => { if (!found) setPicked('game'); }}><Jx>{'<Link '}</Jx><At>to</At>=<St>"/game/1"</St><Jx>{'>'}</Jx>{'O\'yin'}<Jx>{'</Link>'}</Jx></div>
              </div>
              {!found && <p className="ai-prompt">Qaysi qator sahifani qayta yuklayapti? Bosing.</p>}
              {found && !fixed && <button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={() => setFixed(true)}>🔧 {'<a>'}'ni {'<Link>'}'ga almashtirish</button>}
              {fixed && <p className="ai-prompt" style={{ color: T.success, fontStyle: 'normal', fontWeight: 600 }}>✓ Tuzatildi — endi o'tish silliq, qayta yuklanmaydi!</p>}
            </div>
          </Col>
          <Col>
            <p className="flow-label">"Qo'shish"ni bosib ko'ring</p>
            <Win title="robo-games.uz" minH={120}>
              <div style={{ position: 'relative', minHeight: 96 }}>
                {flash && <div className="page-flash"><div className="spinner" /></div>}
                <NavMenu active="/add" onGo={demo} />
                <div style={{ marginTop: 9 }}><UrlBar path="/add" /></div>
                <div style={{ marginTop: 9 }}><AddView /></div>
              </div>
            </Win>
            {!found && (
              (picked === 'home' || picked === 'game')
                ? <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bu qator to'g'ri — <span className="mono">{'<Link>'}</span> ishlatilgan. Yana qarang: qaysi qatorda <span className="mono">{'<Link>'}</span> emas, boshqa narsa turibdi?</p></div>
                : <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Ikkitasi <span className="mono">{'<Link>'}</span>, bittasi boshqacha. Qayta yuklash — <span className="mono" style={{ color: T.ink }}>{'<a href>'}</span> ning belgisi.</p></div>
            )}
            {found && !fixed && <div className="frame-warn fade-step"><p className="note-h" style={{ color: T.accent }}>✓ Topdingiz!</p><p className="body" style={{ margin: 0, color: T.ink }}><span className="mono">{'<a href="/add">'}</span> — bu Router havolasi emas! Brauzer butun sahifani qayta yuklaydi. To'g'risi: <span className="mono">{'<Link to="/add">'}</span>. Chapdagi tugma bilan tuzating →</p></div>}
            {fixed && <div className="takeaway fade-step"><div className="ta-bulb">🛠️</div><p className="ta-h">Topdingiz va tuzatdingiz — bu debugging!</p><p className="ta-sub">AI tez yozadi, siz tekshirib tuzatasiz — zo'r jamoa</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — YAKUNIY (VS Code: <Route path="/add" element={<AddPage />} />) =====
const Screen14 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [value, setValue] = useState(storedAnswer?.picked || '');
  const [passed, setPassed] = useState(!!storedAnswer?.correct);
  const norm = value.replace(/\s+/g, ' ').trim();
  const valid = /^<\s*Route\s+path\s*=\s*"\/add"\s+element\s*=\s*\{\s*<\s*AddPage\s*\/?\s*>\s*\}\s*\/?\s*>$/.test(norm);
  const hasRoute = /<\s*Route\b/.test(value);
  const hasLowerRoute = /<\s*route\b/i.test(value) && !hasRoute;
  const hasPath = /path\s*=\s*"\/add"/.test(value);
  const hasElement = /element\s*=\s*\{\s*<\s*AddPage\s*\/?\s*>\s*\}/.test(value);
  useEffect(() => {
    if (valid && !passed) {
      setPassed(true);
      onAnswer(screen, { stage: 'final', screenIdx: screen, question: 'VS Code: <Route path="/add" element={<AddPage />} /> ni yozing', studentAnswer: value, correct: true, firstAttemptCorrect: true, solved: true, picked: value });
    }
  }, [valid]);
  const Ln = ({ n, children }) => (
    <div className="vsc-line"><span className="vsc-ln">{n}</span><span style={{ whiteSpace: 'pre' }}>{children}</span></div>
  );
  return (
    <Stage eyebrow="Yakuniy · amaliy" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!passed} label={passed ? 'Davom etish' : 'Route qatorini yozing'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Oxirgi qadam: <span className="italic" style={{ color: T.accent }}>Qo'shish</span> sahifasini ro'yxatga ulang.</h2></div>
        <Mentor>VS Code'da <span className="mono">App.jsx</span> ochiq: Bosh va O'yin route'lari tayyor — faqat <b style={{ color: T.ink }}>4-qator bo'sh</b>. <span className="mono">/add</span> manzilini <span className="mono">AddPage</span> sahifasiga bog'lang: <b style={{ color: T.ink }}>{'<Route'}</b> + <b style={{ color: T.ink }}>path="/add"</b> + <b style={{ color: T.ink }}>element={'{<AddPage />}'}</b> + <b style={{ color: T.ink }}>{'/>'}</b>.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="vsc fade-up delay-2">
              <div className="vsc-bar">
                <span className="vsc-tab on"><span style={{ color: '#61DAFB' }}>⚛</span> App.jsx <span style={{ color: '#6E7681', marginLeft: 4 }}>×</span></span>
                <span className="vsc-tab">Home.jsx</span>
              </div>
              <div className="vsc-body">
                <Ln n={1}><Jx>{'<Routes>'}</Jx></Ln>
                <Ln n={2}>{'  '}<Jx>{'<Route '}</Jx><At>path</At>=<St>"/"</St> <At>element</At>{'={<Home />}'}<Jx>{' />'}</Jx></Ln>
                <Ln n={3}>{'  '}<Jx>{'<Route '}</Jx><At>path</At>=<St>"/game/:id"</St> <At>element</At>{'={<GamePage />}'}<Jx>{' />'}</Jx></Ln>
                <div className="vsc-line">
                  <span className="vsc-ln">4</span>
                  <span style={{ whiteSpace: 'pre' }}>{'  '}</span>
                  <input className={`vsc-input ${valid ? 'ok' : ''}`} value={value} onChange={e => setValue(e.target.value)} placeholder='<Route path="/add" element={<AddPage />} />' spellCheck={false} autoCapitalize="off" autoCorrect="off" />
                </div>
                <Ln n={5}><Jx>{'</Routes>'}</Jx></Ln>
              </div>
            </div>
            <div className="fade-up delay-2" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="tagpill" style={{ opacity: hasRoute ? 1 : 0.4 }}>{hasRoute ? '✓' : '1'} {'<Route'}</span>
              <span className="tagpill" style={{ opacity: hasPath ? 1 : 0.4 }}>{hasPath ? '✓' : '2'} path="/add"</span>
              <span className="tagpill" style={{ opacity: hasElement ? 1 : 0.4 }}>{hasElement ? '✓' : '3'} element={'{<AddPage />}'}</span>
            </div>
            {hasLowerRoute && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Teg nomi <b>Katta harf</b> bilan: <span className="mono">{'<Route'}</span>.</p></div>}
            {passed && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Mukammal! Endi <span className="mono">/add</span> ochilganda Router AddPage'ni ko'rsatadi. Ilovangiz to'liq ko'p sahifali — sizning qo'lingizda.</p></div>}
          </Col>
          <Col>
            <p className="flow-label">natija — robo-games.uz</p>
            <Win title="robo-games.uz" minH={140}>
              {valid
                ? <div className="fade-step"><NavMenu active="/add" /><div style={{ marginTop: 9 }}><UrlBar path="/add" /></div><div style={{ marginTop: 9 }}><AddView /></div></div>
                : <p style={{ fontFamily: 'Georgia, serif', color: T.ink3, fontStyle: 'italic', margin: 0, textAlign: 'center', lineHeight: 1.5 }}>4-qator yozilmaguncha <span className="mono" style={{ fontStyle: 'normal' }}>/add</span> sahifasi ulanmagan: <span className="mono" style={{ fontStyle: 'normal' }}>{'<Route'}</span> + <span className="mono" style={{ fontStyle: 'normal' }}>path</span> + <span className="mono" style={{ fontStyle: 'normal' }}>element</span></p>}
            </Win>
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 15 — YAKUN =====
const Screen15 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const RECAP = [
    "Route = manzil → sahifa: <Route path=\"/add\" element={<AddPage />} />",
    "<Routes> URL'ga qarab qaysi sahifani ko'rsatishni tanlaydi",
    "<Link to> qayta yuklamaydi — <a href> esa yuklaydi",
    "URL parametr /game/:id — bitta sahifa, barcha o'yinlar (useParams)",
    "useNavigate() — kod orqali sahifa almashtirish (POST'dan keyin Bosh'ga)"
  ];
  const HOMEWORK = [
    { b: 'Sahifalar ro\'yxati', t: "— o'z loyihangiz uchun 3-4 sahifa ro'yxatini qog'ozga yozing" },
    { b: 'AI bilan quring', t: "— Antigravity'ga Router'ni o'rnatib, sahifalar va menyuni qurishni buyuring" },
    { b: 'Tekshiring', t: "— hamma havola <Link>mi, /game/:id parametri bormi — o'zingiz nazorat qiling" }
  ];
  const GLOSSARY = [
    { b: 'Route', t: '— manzil va sahifani bog\'laydigan ro\'yxat qatori' },
    { b: '<Routes>', t: "— URL'ga qarab to'g'ri sahifani tanlaydi" },
    { b: '<Link to>', t: '— qayta yuklamaydigan havola (SPA navigatsiya)' },
    { b: '<a href>', t: '— butun sahifani qayta yuklaydi (Router\'da ishlatilmaydi)' },
    { b: '/game/:id', t: '— URL parametr: bitta sahifa, har xil id' },
    { b: 'useParams()', t: '— manzildagi :id ni o\'qiydi' },
    { b: 'useNavigate()', t: '— kod orqali sahifa almashtirish' },
    { b: 'SPA', t: '— bir sahifali ilova: qayta yuklanmaydi' }
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
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">✓</span> Praktika tugadi</span><h2 className="title h-title fade-up d1">Ko'p sahifali ilovangiz <span className="italic" style={{ color: T.accent }}>tayyor</span>.</h2><p className="body h-sub fade-up d2">{PASSED ? "Tabriklaymiz! Siz sahifalar ro'yxatini tuzdingiz, AI bilan qurdingiz va kodini tekshirdingiz — endi React ilovalaringiz ko'p sahifali bo'ladi." : "Yaxshi harakat! Route, Link va /game/:id ni mustahkamlash uchun bir-ikki ekranni qayta ko'ring."}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span className="tick" style={{ width: 16, height: 16, borderRadius: '50%', background: T.success, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck">✓</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>📝 Uyga vazifa</div><p className="body" style={{ margin: '0 0 10px', color: T.ink }}>Antigravity bilan o'z loyihangizda sinang:</p><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">Keyingi qadam — loyiha kuni: React + API + CRUD + Router'ni birlashtirib, o'z ilovangizni boshidan oxirigacha qurasiz! 🚀</p></div>
        </div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">💡 Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function ReactRouterPracticeLesson({ lang: langProp, onFinished }) {
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

        /* === PRAKTIKA · ROUTER CSS === */
        .bp-bar { background: #f0eee8; padding: 8px 11px; display: flex; align-items: center; gap: 9px; }
        .bb-dots { display: flex; gap: 5px; }
        .bb-dots i { width: 9px; height: 9px; border-radius: 50%; }
        .bb-dots i:first-child { background: #ff5f57; } .bb-dots i:nth-child(2) { background: #febc2e; } .bb-dots i:nth-child(3) { background: #28c840; }
        .bp-title { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink3}; }
        .bp-body { padding: clamp(12px,2.2vw,18px); }
        .code-box { background: ${CODE.bg}; color: ${CODE.text}; font-family: 'JetBrains Mono', monospace; font-size: clamp(12px,1.5vw,13.5px); line-height: 1.55; padding: clamp(12px,2.2vw,16px); border-radius: 12px; overflow-x: auto; white-space: pre-wrap; word-break: break-word; margin: 0; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.2); }
        /* Roblox uslubidagi o'yin kartochkasi */
        .rocard { border-radius: 12px; background: #fff; box-shadow: 0 4px 14px -4px rgba(0,0,0,0.16); overflow: hidden; border: 1px solid rgba(0,0,0,0.05); transition: transform 0.15s, box-shadow 0.15s; }
        .rocard:hover { transform: translateY(-2px); box-shadow: 0 8px 20px -5px rgba(0,0,0,0.22); }
        .rocard.tappable { cursor: pointer; }
        .rothumb { height: 58px; display: flex; align-items: center; justify-content: center; position: relative; }
        .topbadge { position: absolute; top: 4px; left: 6px; font-family: 'Manrope', sans-serif; font-weight: 800; font-size: 8.5px; color: #fff; background: rgba(14,14,16,0.72); padding: 2px 7px; border-radius: 99px; letter-spacing: 0.04em; }
        .robody { padding: 7px 10px 9px; }
        .roname { font-family: 'Manrope', sans-serif; font-weight: 800; font-size: 12px; color: ${T.ink}; margin: 0 0 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .rostats { display: flex; align-items: center; gap: 8px; font-family: 'Manrope', sans-serif; font-size: 10.5px; color: ${T.ink3}; font-weight: 600; }
        /* Brauzer URL paneli + navigatsiya menyusi */
        .url-bar { display: flex; align-items: center; gap: 6px; background: #fff; border: 1px solid rgba(0,0,0,0.08); border-radius: 8px; padding: 5px 10px; font-family: 'JetBrains Mono', monospace; font-size: 11.5px; color: ${T.ink2}; }
        .url-bar .u-path { color: ${T.accent}; font-weight: 700; }
        .navmenu { display: flex; gap: 6px; flex-wrap: wrap; }
        .navlink { font-family: 'Manrope', sans-serif; font-weight: 700; font-size: 11.5px; padding: 5px 11px; border-radius: 99px; border: none; background: ${T.bg}; color: ${T.ink}; cursor: pointer; transition: all 0.15s; }
        .navlink.on { background: ${T.ink}; color: #fff; }
        .navlink:hover:not(.on) { background: #EFEBE3; }
        /* Route xaritasi qatori */
        .routerow { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 11px; transition: all 0.3s; }
        /* Sahifa qayta yuklanishi (flash + spinner) */
        @keyframes pageflash { 0% { opacity: 0; } 15% { opacity: 1; } 100% { opacity: 0; } }
        .page-flash { position: absolute; inset: 0; background: #fff; z-index: 5; animation: pageflash 1s ease-out forwards; display: flex; align-items: center; justify-content: center; border-radius: 8px; }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spinner { width: 22px; height: 22px; border: 3px solid rgba(0,0,0,0.12); border-top-color: ${T.accent}; border-radius: 50%; animation: spin 0.7s linear infinite; }
        /* Silkinish (xato tanlov) */
        @keyframes shake { 0%,100% { transform: none; } 25% { transform: translateX(-4px); } 50% { transform: translateX(4px); } 75% { transform: translateX(-3px); } }
        .shake { animation: shake 0.4s ease; }
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
