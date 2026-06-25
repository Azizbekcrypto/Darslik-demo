import React, { useState, useEffect, useRef, createContext, useContext, useCallback } from 'react';
import mentorImg from '../../assets/common/mentor.png';

// ============================================================
// REACT MODULI · 4-DARS — PROPS VA QAYTA ISHLATISH — PLATFORM STANDARD v16 (AUDIOSIZ)
// Mavzu: komponentlar orasida ma'lumot uzatish (App → GameCard atribut orqali),
//        bir nechta props, bir tomonlama oqim (faqat yuqoridan pastga, 2 daraja),
//        props read-only (o'zgartirish = state ishi), ma'lumotlar ro'yxati (massiv),
//        map bilan katalog (data-driven UI), name={g} — jingalak qavsli dinamik props.
// Misol sayt: robo-games (davom) — to'liq o'yinlar KATALOGI quriladi.
// Animatsiyalar: rentgen (kartalar skeletga aylanadi), posilka 📦 (props yetkaziladi),
//        ma'lumot daryosi (tomchilar pastga oqadi, teskari — shake ❌),
//        katalog stagger (qator yonadi → kartochka pop).
// MUHIM: kelgusi darslar ro'yxati o'quvchiga AYTILMAYDI — faqat yakunda teaser.
// AUDIOSIZ: ovoz (TTS) yo'q — platforma qarori.
// Yakuniy ekran (s15): VS Code — map ichida <GameCard name={g} /> ni qo'lda yozish.
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

const LESSON_META = { lessonId: 'react-props-reuse-04-v16', lessonTitle: { uz: 'Props va qayta ishlatish', ru: 'Props и переиспользование' } };
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

// ===== REACT-4 YORDAMCHILAR =====
const Jx = ({ children }) => <span style={{ color: CODE.tag }}>{children}</span>;
const At = ({ children }) => <span style={{ color: CODE.attr }}>{children}</span>;
const St = ({ children }) => <span style={{ color: CODE.str }}>{children}</span>;
const Cm = ({ children }) => <span style={{ color: CODE.comment, fontStyle: 'italic' }}>{children}</span>;
const Win = ({ title, children, minH }) => (
  <div className="bp-window"><div className="bp-bar"><span className="bb-dots"><i /><i /><i /></span><span className="bp-title">{title}</span></div><div className="bp-body" style={{ minHeight: minH, position: 'relative' }}>{children}</div></div>
);
// Roblox uslubidagi o'yinlar (oldingi darslardan tanish) + yangi qo'shiladiganlar
const GAMES = [
  { name: 'Adopt Me!', emoji: '🐾', likes: 92, players: '402K', bg: 'linear-gradient(135deg,#FF9DBF,#C44569)' },
  { name: 'Blox Fruits', emoji: '🍇', likes: 95, players: '750K', bg: 'linear-gradient(135deg,#7EA6F4,#2E4A9E)' },
  { name: 'Brookhaven', emoji: '🏠', likes: 89, players: '510K', bg: 'linear-gradient(135deg,#8FD3A8,#2E7A4E)' },
  { name: 'Tower of Hell', emoji: '🗼', likes: 84, players: '120K', bg: 'linear-gradient(135deg,#F4B26A,#C9622E)' },
  { name: 'Pet Sim 99', emoji: '🐶', likes: 90, players: '230K', bg: 'linear-gradient(135deg,#B9A8F4,#6A4AC9)' },
  { name: 'Murder Mystery', emoji: '🕵️', likes: 86, players: '95K', bg: 'linear-gradient(135deg,#9AB6C9,#3E5A70)' }
];
const EXTRA = [
  { name: 'Doors', emoji: '🚪', likes: 91, players: '310K', bg: 'linear-gradient(135deg,#6B7280,#1F2430)' },
  { name: 'Piggy', emoji: '🐷', likes: 87, players: '180K', bg: 'linear-gradient(135deg,#F4A6C0,#B5446E)' },
  { name: 'Bee Swarm', emoji: '🐝', likes: 93, players: '260K', bg: 'linear-gradient(135deg,#F4D06A,#C99B2E)' }
];
const gameByName = (nm) => [...GAMES, ...EXTRA].find(g => g.name.toLowerCase() === String(nm).toLowerCase());
// O'yin kartochkasi: name/emoji/players props bilan; top → 🔥 TOP belgisi; xray → skelet rejimi
const RoCard = ({ name, emoji, players, top, xray, onClick }) => {
  const g = gameByName(name);
  const bg = g ? g.bg : 'linear-gradient(135deg,#8E9BB5,#4A5670)';
  const em = emoji || (g ? g.emoji : '🎮');
  const pct = g ? g.likes : 88;
  return (
    <div className={`rocard el-in ${onClick ? 'tappable' : ''}`} onClick={onClick} style={{ position: 'relative' }}>
      <div className="rothumb" style={{ background: bg }}>
        <span className="rothumb-icon">{em}</span>
        {top && <span className="topbadge el-in">🔥 TOP</span>}
        <span className="rothumb-play">▶</span>
      </div>
      <div className="robar"><span className="robar-fill" style={{ width: `${pct}%` }} /></div>
      <div className="robody">
        <p className="roname">{name}</p>
        <div className="rostats">
          <span className="rolike-static">👍 {pct}%</span>
          {players && <span className="roplayers">👥 {players}</span>}
        </div>
      </div>
      {xray && (
        <div className="xray-ov">
          <span className="mono" style={{ fontSize: 11, fontWeight: 700, color: T.accent }}>{'<GameCard />'}</span>
        </div>
      )}
    </div>
  );
};
// Rentgen/skan ikonkasi (emoji o'rniga toza SVG)
const ScanIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M3 7V5a2 2 0 0 1 2-2h2" /><path d="M17 3h2a2 2 0 0 1 2 2v2" /><path d="M21 17v2a2 2 0 0 1-2 2h-2" /><path d="M7 21H5a2 2 0 0 1-2-2v-2" /><line x1="3" y1="12" x2="21" y2="12" />
  </svg>
);
// Terminal/konsol qatori
const TLine = ({ cmd, out, dim }) => (
  <div className="el-in" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 'clamp(11.5px,1.4vw,13px)', lineHeight: 1.7, color: dim ? CODE.comment : CODE.text }}>
    {cmd ? <><span style={{ color: CODE.str }}>$</span> <span style={{ color: CODE.text }}>{cmd}</span></> : out}
  </div>
);

// ===== SCREEN 0 — HOOK (Rentgen: 6 har xil karta = 1 komponent) =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [xray, setXray] = useState(false);
  const [xrayUsed, setXrayUsed] = useState(!!storedAnswer);
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const toggle = () => { setXray(v => !v); setXrayUsed(true); };
  const OPTS = [
    { id: 'a', label: '6 ta — har kartochkaga alohida kod' },
    { id: 'b', label: 'Bitta — qolgani faqat har xil MA\'LUMOT' },
    { id: 'c', label: "3 ta — har ikkitasiga bittadan" }
  ];
  const pick = (v) => { if (picked !== null || !xrayUsed) return; setPicked(v); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: true }); };
  return (
    <Stage eyebrow="Kirish" screen={screen} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 780 }}>6 ta har xil kartochka — <span className="italic" style={{ color: T.accent }}>nechta kod</span>?</h1>
        <Mentor>Mana robo-games katalogi — xuddi Roblox bosh sahifasiday. Hammasi har xil: nomlar, ranglar, o'yinchilar. Endi <b style={{ color: T.ink }}>Rentgen rejimini</b> yoqing — kartochkalarning "ichini" ko'rasiz. Nimani sezdingiz?</Mentor>
        <Zoomable>
        <Split>
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button className={`chip ${xray ? 'chip-on' : ''}`} onClick={toggle}><ScanIcon /> Rentgen {xray ? 'yoqilgan' : 'rejimi'}</button>
              {xray && <span className="mono small fade-step" style={{ color: T.accent }}>ichkarida — hammasi BIR XIL!</span>}
            </div>
            <div className="fade-up delay-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 9 }}>
              {GAMES.map((g, i) => <RoCard key={g.name} name={g.name} players={g.players} xray={xray} />)}
            </div>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Sizningcha, bunga nechta komponent kodi yozilgan?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => {
                const on = picked === o.id;
                return (
                  <button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null || !xrayUsed} style={{ opacity: !xrayUsed ? 0.55 : 1 }} onClick={() => pick(o.id)}>
                    <span className="radio">{on && <span className="radio-dot" />}</span>
                    <span>{o.label}</span>
                  </button>
                );
              })}
            </div>
            {!xrayUsed && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>Avval Rentgenni yoqib ko'ring ←</p>}
            {picked !== null && <p className="hook-ack fade-step">Aynan! Skelet — <b>bitta <span className="mono">{'<GameCard />'}</span></b>, farq esa faqat <b>ma'lumotda</b> (props). Bugun shu ma'lumotni komponentlarga <b>uzatish san'atini</b> o'rganamiz — va butun katalogni quramiz.</p>}
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
    { text: 'Ma\'lumotni uzatish — posilka', tag: '<GameCard name="…" />' },
    { text: 'Bir nechta props', tag: 'name · players · emoji' },
    { text: "Ma'lumot daryosi — faqat pastga", tag: 'App → Card → Button' },
    { text: "Props faqat o'qiladi", tag: 'read-only' },
    { text: "Ro'yxat → katalog", tag: 'games.map(…)' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const PreviewBlock = (
    <Col>
      <p className="flow-label">Dars oxirida — sizning natijangiz</p>
      <Win title="robo-games — localhost:5173" minH={100}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <RoCard name="Adopt Me!" top />
          <RoCard name="Blox Fruits" />
          <RoCard name="Doors" />
        </div>
      </Win>
      <pre className="code-box" style={{ padding: '10px 14px' }}>{'{games.map(g => '}<Jx>{'<GameCard '}</Jx><At>name</At>{'={g}'}<Jx>{' />'}</Jx>{')}'}</pre>
      <p className="mono small" style={{ color: T.accent, margin: 0 }}>→ butun katalog — bitta qator kod bilan</p>
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
          <h2 className="title h-title fade-up">Butun katalogni <span className="italic" style={{ color: T.accent }}>bitta qator kod</span> bilan chiza olamizmi?</h2>
        </div>
        <Mentor>Va'da beraman: dars oxirida <b style={{ color: T.ink }}>Roblox'dagiday to'liq katalog</b> qurasiz — ro'yxatga yangi o'yin qo'shsangiz, kartochkasi <b style={{ color: T.ink }}>o'zi paydo bo'ladi</b>. Buning kaliti: ma'lumotni komponentlarga to'g'ri uzatish.</Mentor>
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

// ===== SCREEN 2 — POSILKA (App → GameCard ma'lumot yetkaziladi) =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [phase, setPhase] = useState(storedAnswer ? 3 : 0); // 0 idle, 1 uchmoqda, 2 yetib keldi, 3 chizildi
  const [running, setRunning] = useState(false);
  const timer = useRef(null);
  const done = phase >= 3;
  useEffect(() => () => clearTimeout(timer.current), []);
  const send = () => {
    if (running) return;
    clearTimeout(timer.current); setRunning(true); setPhase(1);
    timer.current = setTimeout(() => {
      setPhase(2);
      timer.current = setTimeout(() => { setPhase(3); setRunning(false); }, 900);
    }, 900);
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Uzatish" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Posilkani yuboring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">App ma'lumotni GameCard'ga <span className="italic" style={{ color: T.accent }}>qanday yetkazadi</span>?</h2></div>
        <Mentor>Xuddi Roblox'dagi <b style={{ color: T.ink }}>trade</b> kabi: bir o'yinchi ikkinchisiga buyum uzatadi. Bizda: <b style={{ color: T.ink }}>App jo'natadi</b> (atribut yozadi), <b style={{ color: T.ink }}>GameCard qabul qiladi</b> (props orqali). Posilkani yuborib, yo'lini kuzating.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">App — jo'natuvchi</p>
            <pre className="code-box fade-up delay-1" style={{ lineHeight: 2 }}>
              <Cm>{'// App ichida:'}</Cm>{'\n'}
              <span style={{ borderRadius: 6, padding: '2px 5px', background: phase === 1 ? 'rgba(255,79,40,0.22)' : 'transparent', boxShadow: phase === 1 ? `inset 0 0 0 1px ${T.accent}` : 'none', transition: 'all 0.3s' }}>
                <Jx>{'<GameCard '}</Jx><At>name</At>=<St>"Doors"</St> <At>players</At>=<St>"310K"</St><Jx>{' />'}</Jx>
              </span>
            </pre>
            <button className="btn fade-up delay-2" style={{ alignSelf: 'flex-start' }} onClick={send} disabled={running}>{running ? 'Yo\'lda…' : (done ? '📦 Yana yuborish' : '📦 Posilkani yuborish')}</button>
          </Col>
          <Col>
            <p className="flow-label">GameCard — qabul qiluvchi</p>
            <div className="code-box fade-up delay-2" style={{ padding: '11px 14px', position: 'relative', minHeight: 104, overflow: 'hidden' }}>
              {phase === 1 && <div className="parcel2"><span className="parcel2-box">📦</span><span className="parcel2-lbl">name="Doors", players="310K"</span></div>}
              <TLine out={<span><Jx>{'function'}</Jx> GameCard(<At>props</At>) {'{'}</span>} />
              <TLine out={<span style={{ paddingLeft: 14, display: 'inline-block' }}>props = {'{'} name: {phase >= 2 ? <span className="slot-pop"><St>"Doors"</St></span> : <span style={{ color: CODE.comment }}>?</span>}, players: {phase >= 2 ? <span className="slot-pop"><St>"310K"</St></span> : <span style={{ color: CODE.comment }}>?</span>} {'}'}</span>} />
              <TLine out={<span>{'}'}</span>} />
            </div>
            <p className="flow-label" style={{ marginTop: 2 }}>Ekranda</p>
            <Win title="robo-games — localhost:5173" minH={104}>
              {phase >= 3
                ? <div className="card-pop" style={{ maxWidth: 175 }}><RoCard name="Doors" players="310K" /></div>
                : <p style={{ color: T.ink3, fontStyle: 'italic', margin: 0, fontFamily: 'Georgia, serif', fontSize: 13 }}>{phase >= 1 ? '📦 posilka yo\'lda…' : 'kutilmoqda…'}</p>}
            </Win>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Yo'l: <b>atribut yozildi → props'ga tushdi → kartochka chizildi</b>. Atribut nomi = props ichidagi nom: <span className="mono">name</span> → <span className="mono">props.name</span>.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — BIR NECHTA PROPS =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [name, setName] = useState(storedAnswer ? 'Bee Swarm' : null);
  const [players, setPlayers] = useState(storedAnswer ? '260K' : null);
  const [emoji, setEmoji] = useState(storedAnswer ? '🐝' : null);
  const done = !!(name && players && emoji);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const NAMES = ['Bee Swarm', 'Doors', 'Pet Sim 99'];
  const PLAYERS = ['260K', '310K', '230K'];
  const EMOJIS = ['🐝', '🚪', '🐶'];
  return (
    <Stage eyebrow="Bir nechta props" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "3 ta props'ni to'ldiring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(8px,1.2vw,12px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bitta kartochkaga <span className="italic" style={{ color: T.accent }}>nechta ma'lumot</span> uzatsa bo'ladi?</h2></div>
        <Mentor>Istalgancha! Har atribut — alohida props: <span className="mono">name</span>, <span className="mono">players</span>, <span className="mono">emoji</span>… Uchalasini tanlab, kartochkani <b style={{ color: T.ink }}>to'liq ma'lumot bilan</b> jihozlang. Kod qanday o'sishini kuzating.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">name <span className="propchip-tag">matn props</span></p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {NAMES.map(v => <button key={v} className={`propchip ${name === v ? 'sel' : ''}`} onClick={() => setName(v)}>{name === v && <span className="propchip-tick">✓</span>}{v}</button>)}
            </div>
            <p className="flow-label" style={{ marginTop: 2 }}>players <span className="propchip-tag">son props</span></p>
            <div className="fade-up delay-2" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {PLAYERS.map(v => <button key={v} className={`propchip ${players === v ? 'sel' : ''}`} onClick={() => setPlayers(v)}>{players === v && <span className="propchip-tick">✓</span>}👥 {v}</button>)}
            </div>
            <p className="flow-label" style={{ marginTop: 2 }}>emoji <span className="propchip-tag">belgi props</span></p>
            <div className="fade-up delay-2" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {EMOJIS.map(v => <button key={v} className={`propchip propchip-emoji ${emoji === v ? 'sel' : ''}`} onClick={() => setEmoji(v)}>{v}</button>)}
            </div>
          </Col>
          <Col>
            <pre className="code-box fade-up delay-2">
              <Jx>{'<GameCard'}</Jx>{'\n'}
              {'  '}<At>name</At>={name ? <St>"{name}"</St> : <Cm>?</Cm>}{'\n'}
              {'  '}<At>players</At>={players ? <St>"{players}"</St> : <Cm>?</Cm>}{'\n'}
              {'  '}<At>emoji</At>={emoji ? <St>"{emoji}"</St> : <Cm>?</Cm>}{'\n'}
              <Jx>{'/>'}</Jx>
            </pre>
            <p className="flow-label">Kartochka</p>
            <div style={{ maxWidth: 178 }}>
              {name
                ? <div className="card-pop" key={`${name}-${players}-${emoji}`}><RoCard name={name} players={players || undefined} emoji={emoji || undefined} /></div>
                : <div className="frame-dash" style={{ padding: '22px 12px' }}><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>props tanlang — kartochka shu yerda</p></div>}
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>3 ta props — 3 ta atribut. Komponent ularni <span className="mono">props.name</span>, <span className="mono">props.players</span>, <span className="mono">props.emoji</span> deb o'qiydi.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 (qanday uzatiladi?) =====
const Screen4 = (props) => (
  <QuestionScreen {...props} idx={4} scope="module-mikro" eyebrow="Mashq · 1-savol"
    questionText="App komponenti GameCard'ga ma'lumotni qanday uzatadi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>App ma'lumotni GameCard'ga <span className="italic" style={{ color: T.accent }}>qanday uzatadi</span>?</h2></>}
    options={["Atribut orqali: <GameCard name=\"Doors\" /> — komponent props deb qabul qiladi", 'Internet orqali yuboradi', 'Fayl orqali saqlab beradi', "GameCard o'zi App'dan olib ketadi"]} correctIdx={0}
    explainCorrect="To'g'ri! Chaqiruvda atribut yoziladi, komponent ichida esa o'sha ma'lumot props bo'lib keladi: name → props.name."
    explainWrong={{
      1: "Yo'q — internet kerak emas. Bu kod ichidagi uzatish: atribut → props.",
      2: "Yo'q — fayl ham kerak emas. Atributning o'zi yetadi: <GameCard name=\"…\" />.",
      3: "Yo'q — komponent o'zi 'olib keta olmaydi'. Ota (App) jo'natadi, bola (GameCard) qabul qiladi.",
      default: "Atribut orqali: <GameCard name=\"…\" /> → props.name."
    }} />
);

// ===== SCREEN 5 — MA'LUMOT DARYOSI (faqat pastga, 2 daraja) =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const KIDS = [GAMES[0], EXTRA[0], EXTRA[2]]; // Adopt Me!, Doors, Bee Swarm
  const [flow, setFlow] = useState(storedAnswer ? 2 : 0); // 0 idle, 1 tushyapti, 2 yetkazildi
  const [running, setRunning] = useState(false);
  const [reversed, setReversed] = useState(!!storedAnswer);
  const [shaking, setShaking] = useState(false);
  const [upTick, setUpTick] = useState(0);
  const timer = useRef(null);
  const done = flow >= 2 && reversed;
  useEffect(() => () => clearTimeout(timer.current), []);
  const sendDown = () => {
    if (running) return;
    clearTimeout(timer.current); setRunning(true); setFlow(1);
    timer.current = setTimeout(() => { setFlow(2); setRunning(false); }, 1000);
  };
  const sendUp = () => {
    setReversed(true); setShaking(true); setUpTick(t => t + 1);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setShaking(false), 520);
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Ma'lumot daryosi" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Ikkala yo'nalishni sinang"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bola komponent otasiga ma'lumot <span className="italic" style={{ color: T.accent }}>yubora oladimi</span>?</h2></div>
        <Mentor>Tasavvur qiling: tepada <b style={{ color: T.ink }}>App (ota)</b>, pastida <b style={{ color: T.ink }}>3 ta bola kartochka</b>. Ota har bolaga ma'lumat (props) <b style={{ color: T.ink }}>sharik kabi tashlaydi</b> — yuqoridan pastga. <b style={{ color: T.ink }}>Pastga</b> tugmasini, keyin <b style={{ color: T.ink }}>teskarisini</b> sinab ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="tree fade-up delay-1">
              <div className="tree-parent-row">
                <div className={`tree-parent ${shaking ? 'shake' : ''}`}>
                  <span className="tp-tag">App</span>
                  <span className="tp-sub">ota — props yuboradi</span>
                  {reversed && <span className="tp-block">⛔</span>}
                </div>
              </div>
              <div className="tree-pipes">
                <span className="tree-bus" />
                {KIDS.map((g, i) => (
                  <span key={i} className={`tree-pipe ${flow >= 2 ? 'done' : ''}`}>
                    {running && flow >= 1 && <span className="tree-ball" style={{ animationDelay: `${i * 0.16}s` }} />}
                  </span>
                ))}
              </div>
              <div className="tree-kids">
                {KIDS.map((g, i) => (
                  <div key={g.name} className="tree-kid">
                    {flow >= 2
                      ? <RoCard name={g.name} />
                      : <div className="tree-kid-wait"><span className="tk-tag">bola {i + 1}</span><span className="tk-q">props = ?</span></div>}
                  </div>
                ))}
              </div>
              {upTick > 0 && <span key={upTick} className="tree-upball">🚫 tepaga yo'l yo'q</span>}
            </div>
          </Col>
          <Col>
            <p className="flow-label">Ma'lumotni yuborib ko'ring</p>
            <div className="fade-up delay-2" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={sendDown} disabled={running}>⬇ App'dan bolalarga yuborish {flow >= 2 ? '✓' : ''}</button>
              <button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={sendUp}>⬆ Boladan otaga yuborib ko'rish {reversed ? '✓' : ''}</button>
            </div>
            {flow >= 2 && !reversed && <div className="hint fade-step"><p className="body" style={{ margin: 0, color: T.ink2 }}>Sharik pastga tushdi: App → 3 ta bola, har biri o'z props'ini oldi. Endi <b style={{ color: T.ink }}>teskarisini</b> sinang ↑</p></div>}
            {reversed && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>❌ Yo'l yo'q! Bola otaga props uzata <b>olmaydi</b> — sharik tepaga ketmaydi. Bu React'ning qat'iy qoidasi: ma'lumot <b>faqat yuqoridan pastga</b>. Shuning uchun xatoni topish oson — ma'lumot qayerdan kelganini doim bilasiz.</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bir tomonlama oqim: <span className="mono">App → bola kartochkalar</span>. Har bola faqat <b>o'z otasidan</b> oladi, hech qachon aksincha emas.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 5b — TEST 2 (oqim yo'nalishi) =====
const Screen5b = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Tekshiruv"
    questionText="Props qaysi yo'nalishda oqadi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Mustahkamlash</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Props qaysi <span className="italic" style={{ color: T.accent }}>yo'nalishda</span> oqadi?</h2></>}
    options={['Pastdan yuqoriga — boladan otaga', 'Istalgan tomonga', "Faqat yuqoridan pastga — otadan bolaga", 'Props umuman oqmaydi']} correctIdx={2}
    explainCorrect="To'g'ri! Daryo kabi — faqat pastga: App → GameCard → LikeButton. Bola otaga props uzata olmaydi."
    explainWrong={{
      0: "Teskari yuborishda nima bo'lgandi? ❌ Yo'l yo'q — bola otaga uzata olmaydi.",
      1: "Yo'q — React'da qat'iy tartib bor: faqat yuqoridan pastga. Shu tufayli kod tushunarli qoladi.",
      3: "Oqadi — atribut yozilgan zahoti pastga: name → props.name.",
      default: "Faqat yuqoridan pastga: otadan bolaga."
    }} />
);

// ===== SCREEN 6 — PROPS FAQAT O'QILADI (read-only) =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [triedMutate, setTriedMutate] = useState(!!storedAnswer);
  const [shaking, setShaking] = useState(false);
  const [parentName, setParentName] = useState('Adopt Me!');
  const [parentSent, setParentSent] = useState(!!storedAnswer);
  const [dropping, setDropping] = useState(false);
  const [dropTick, setDropTick] = useState(0);
  const timer = useRef(null);
  const dropTimer = useRef(null);
  const done = triedMutate && parentSent;
  useEffect(() => () => { clearTimeout(timer.current); clearTimeout(dropTimer.current); }, []);
  const mutate = () => {
    setTriedMutate(true); setShaking(true);
    timer.current = setTimeout(() => setShaking(false), 500);
  };
  const fromParent = () => {
    setDropTick(t => t + 1); setDropping(true);
    clearTimeout(dropTimer.current);
    dropTimer.current = setTimeout(() => { setParentName(n => (n === 'Adopt Me!' ? 'Bee Swarm' : 'Adopt Me!')); setParentSent(true); setDropping(false); }, 650);
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Faqat o'qish" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Ikkala usulni sinang"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Komponent o'ziga kelgan props'ni <span className="italic" style={{ color: T.accent }}>o'zgartira oladimi</span>?</h2></div>
        <Mentor>Sinab ko'raylik! 1-tugma: kartochka <b style={{ color: T.ink }}>ichkaridan</b> o'z nomini o'zgartirmoqchi. 2-tugma: <b style={{ color: T.ink }}>App (ota)</b> yangi nom yuboradi. Qaysi biri ishlaydi?</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              <button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={mutate}>1 · Ichkaridan: props.name = "Yangi" {triedMutate ? '✓' : ''}</button>
              <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={fromParent}>2 · App'dan yangi name yuborish {parentSent ? '✓' : ''}</button>
            </div>
            <p className="flow-label" style={{ margin: 0 }}>Konsol</p>
            <div className="code-box" style={{ padding: '9px 13px', minHeight: 64 }}>
              {!triedMutate && !parentSent && <TLine out={<span style={{ color: CODE.comment }}>tugmalarni sinab ko'ring…</span>} />}
              {triedMutate && <TLine out={<span style={{ color: CODE.tag }}>❌ TypeError: props faqat o'qish uchun!</span>} />}
              {parentSent && <TLine out={<span style={{ color: CODE.str }}>✓ App yangi props yubordi → kartochka qayta chizildi</span>} />}
            </div>
          </Col>
          <Col>
            <p className="flow-label">App (ota) → kartochka</p>
            <div className="drop-stage">
              <div className="drop-app"><span className="drop-app-tag">📦 App</span><span className="drop-app-sub">yangi name yuboradi</span></div>
              <div className="drop-pipe">{dropping && <span key={dropTick} className="drop-ball" />}</div>
              <div className={shaking ? 'shake' : ''} style={{ maxWidth: 175, width: '100%' }}><RoCard key={parentName} name={parentName} /></div>
            </div>
            {triedMutate && !parentSent && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Ichkaridan bo'lmadi! Props — <b>sovg'a kabi</b>: olasiz, ishlatasiz, lekin o'zgartira olmaysiz. Endi 2-tugmani sinang.</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Qoida: props — <b>faqat o'qish uchun</b>. O'zgartirishni faqat <b>ota</b> qiladi (yangi qiymat yuboradi). Komponent o'zida nimanidir o'zgartirmoqchi bo'lsa — buning uchun <b>state</b> bor (o'tgan dars!).</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — MA'LUMOTLAR RO'YXATI (massiv) =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const LIST = GAMES.slice(0, 3);
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(storedAnswer ? new Set(LIST.map(g => g.name)) : new Set());
  const done = seen.size >= 3;
  const tap = (nm) => { setActive(nm); setSeen(prev => { const s = new Set(prev); s.add(nm); return s; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Ma'lumotlar ro'yxati" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/3 qatorni ko'ring`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Roblox'dagi barcha o'yinlar ma'lumoti <span className="italic" style={{ color: T.accent }}>qayerda saqlanadi</span>?</h2></div>
        <Mentor>Katta saytlarning siri: ma'lumot <b style={{ color: T.ink }}>kod ichiga yozilmaydi</b> — alohida <b style={{ color: T.ink }}>ro'yxatda (massivda)</b> turadi. Har qator — bitta o'yin, ichida props uchun hamma narsa tayyor. Qatorlarni bosib ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">games — ma'lumotlar massivi</p>
            <pre className="code-box fade-up delay-1" style={{ lineHeight: 1.9 }}>
              <Jx>{'const'}</Jx>{' games = ['}{'\n'}
              {LIST.map((g, i) => (
                <React.Fragment key={g.name}>
                  <span onClick={() => tap(g.name)} style={{ cursor: 'pointer', borderRadius: 6, padding: '2px 5px', display: 'inline-block', background: active === g.name ? 'rgba(255,79,40,0.18)' : (seen.has(g.name) ? 'rgba(31,122,77,0.13)' : 'transparent'), boxShadow: active === g.name ? `inset 0 0 0 1px ${T.accent}` : 'none', transition: 'all 0.18s' }}>
                    {'  { name: '}<St>"{g.name}"</St>{', players: '}<St>"{g.players}"</St>{' }'}{i < LIST.length - 1 ? ',' : ''}
                  </span>{'\n'}
                </React.Fragment>
              ))}
              {'];'}
            </pre>
          </Col>
          <Col>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <p className="flow-label" style={{ margin: 0 }}>Bu qator qanday kartochka bo'ladi?</p>
              <span className="small mono" style={{ color: done ? T.success : T.ink3 }}>{seen.size} / 3</span>
            </div>
            {active ? (
              <div className="fade-step" key={active} style={{ maxWidth: 160 }}>
                <RoCard name={active} players={gameByName(active)?.players} />
              </div>
            ) : (
              <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Chapdan qatorni bosing</p></div>
            )}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Har qator — bitta kartochkaning <b>xom ashyosi</b>. Endi savol: 3 ta qatorni 3 ta kartochkaga <b>kim aylantiradi</b>? Keyingi ekranda!</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — MAP: RO'YXAT → KATALOG (stagger animatsiya) =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const LIST = GAMES.slice(0, 3);
  const [shown, setShown] = useState(storedAnswer ? 3 : 0); // nechta kartochka chizildi
  const [running, setRunning] = useState(false);
  const timer = useRef(null);
  const done = shown >= 3;
  useEffect(() => () => clearInterval(timer.current), []);
  const run = () => {
    if (running) return;
    clearInterval(timer.current); setRunning(true); setShown(0);
    let i = 0;
    timer.current = setInterval(() => {
      i += 1; setShown(i);
      if (i >= LIST.length) { clearInterval(timer.current); setRunning(false); }
    }, 650);
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Katalog" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Katalogni chizing'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Ro'yxatdan katalogga — <span className="italic" style={{ color: T.accent }}>bitta map qatori</span> yetadimi?</h2></div>
        <Mentor>Yetadi! <span className="mono">games.map(…)</span> — ro'yxatdagi <b style={{ color: T.ink }}>har bir o'yin uchun</b> bitta kartochka yasaydi: qatorni oladi → props qilib uzatadi → kartochka chizadi. Tugmani bosib, konveyerni kuzating.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <button className="btn fade-up delay-1" style={{ alignSelf: 'flex-start' }} onClick={run} disabled={running}>{running ? 'Chizilmoqda…' : (done ? '↻ Yana chizish' : '▶ Katalogni chizish')}</button>
            <pre className="code-box fade-up delay-2" style={{ lineHeight: 1.9 }}>
              {LIST.map((g, i) => (
                <React.Fragment key={g.name}>
                  <span style={{ borderRadius: 6, padding: '1px 5px', display: 'inline-block', background: running && shown === i ? 'rgba(255,79,40,0.22)' : (shown > i ? 'rgba(31,122,77,0.13)' : 'transparent'), transition: 'all 0.3s' }}>
                    {'{ name: '}<St>"{g.name}"</St>{' }'}
                  </span>{'\n'}
                </React.Fragment>
              ))}
              {'\n'}
              <Cm>{'// konveyer — har qatorga bitta kartochka:'}</Cm>{'\n'}
              {'{games.map(g => '}<Jx>{'<GameCard '}</Jx><At>name</At>{'={g.name}'}<Jx>{' />'}</Jx>{')}'}
            </pre>
          </Col>
          <Col>
            <p className="flow-label">localhost:5173</p>
            <Win title="robo-games — localhost:5173" minH={110}>
              {shown === 0
                ? <p style={{ color: T.ink3, fontStyle: 'italic', margin: 0, fontFamily: 'Georgia, serif', fontSize: 13 }}>Katalog bo'sh — konveyerni ishga tushiring…</p>
                : <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    {LIST.slice(0, shown).map(g => <RoCard key={g.name} name={g.name} />)}
                  </div>}
            </Win>
            {done && <span className="tagpill fade-step" style={{ color: T.success }}>✓ 3 qator ma'lumot → 3 kartochka · kod: 1 qator</span>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>E'tibor bering: <span className="mono">name={'{g.name}'}</span> — <b>jingalak qavs</b>! Chunki qiymat qo'shtirnoqdagi matn emas, <b>ro'yxatdan kelyapti</b>.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 9 — TEST 3 (ro'yxatga qo'shilsa?) =====
const Screen9 = (props) => (
  <QuestionScreen {...props} idx={9} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="Ro'yxatga yangi o'yin qo'shilsa nima bo'ladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>games ro'yxatiga <span className="italic" style={{ color: T.accent }}>yangi o'yin qo'shilsa</span> nima bo'ladi?</h2></>}
    options={["Katalog kodini ham qayta yozish kerak", "Hech narsa — sayt eski holatda qoladi", 'Sayt buzilib qoladi', "React yangi kartochkani O'ZI chizadi — kod o'zgarmaydi"]} correctIdx={3}
    explainCorrect="To'g'ri! map ro'yxatdagi HAR BIR element uchun ishlaydi — qator qo'shildi, kartochka o'zi paydo bo'ladi. Kod bir qator bo'lib qolaveradi."
    explainWrong={{
      0: "Yo'q — bu eski usul edi. map bilan kod o'zgarmaydi: u ro'yxatning hammasiga ishlaydi.",
      1: "Aksincha — map yangi qatorni ham ko'radi va kartochkasini chizadi.",
      2: "Yo'q — buzilmaydi. map nechta qator bo'lsa, shuncha kartochka yasayveradi.",
      default: "map ro'yxatga qarab ishlaydi: yangi qator → yangi kartochka, kod o'zgarmaydi."
    }} />
);

// ===== SCREEN 10 — YANGI O'YIN QO'SHISH (data-driven) =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const BASE = GAMES.slice(0, 3);
  const [added, setAdded] = useState(storedAnswer ? ['Doors', 'Piggy'] : []);
  const done = added.length >= 2;
  const add = (nm) => setAdded(prev => (prev.includes(nm) ? prev : [...prev, nm]));
  const all = [...BASE.map(g => g.name), ...added];
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Yangi o'yin" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Kamida 2 ta qo'shing (${added.length}/2)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Katalogga yangi o'yin qo'shish uchun <span className="italic" style={{ color: T.accent }}>kod kerakmi</span>?</h2></div>
        <Mentor>Sinab ko'ring! Yangi o'yinni bosing — u faqat <b style={{ color: T.ink }}>ro'yxatga</b> qo'shiladi. Katalog kodiga (<span className="mono">map</span> qatoriga) <b style={{ color: T.ink }}>tegmaymiz</b>. Kartochka qayerdan paydo bo'larkin?</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {EXTRA.map(g => <button key={g.name} className={`chip ${added.includes(g.name) ? 'chip-on' : ''}`} disabled={added.includes(g.name)} onClick={() => add(g.name)}>+ {g.emoji} {g.name} {added.includes(g.name) ? '✓' : ''}</button>)}
            </div>
            <pre className="code-box fade-up delay-2" style={{ lineHeight: 1.8 }}>
              <Jx>{'const'}</Jx>{' games = ['}{'\n'}
              {BASE.map(g => <React.Fragment key={g.name}>{'  { name: '}<St>"{g.name}"</St>{' },'}{'\n'}</React.Fragment>)}
              {added.map(nm => <span key={nm} className="el-in" style={{ display: 'inline-block', background: 'rgba(31,122,77,0.13)', borderRadius: 6, padding: '1px 5px' }}>{'  { name: '}<St>"{nm}"</St>{' },  '}<Cm>{'// + yangi'}</Cm>{'\n'}</span>)}
              {'];'}{'\n\n'}
              <Cm>{'// katalog kodi O’ZGARMADI:'}</Cm>{'\n'}
              {'{games.map(g => '}<Jx>{'<GameCard '}</Jx><At>name</At>{'={g.name}'}<Jx>{' />'}</Jx>{')}'}
            </pre>
          </Col>
          <Col>
            <p className="flow-label">localhost:5173</p>
            <Win title="robo-games — localhost:5173" minH={130}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {all.map(nm => <RoCard key={nm} name={nm} />)}
              </div>
            </Win>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Ko'rdingizmi? <b>Faqat ma'lumot o'zgardi</b> — kartochkalar o'zi paydo bo'ldi. Buning nomi <b>data-driven sayt</b>: sayt ro'yxatga qarab o'zini chizadi. Roblox ham shunday ishlaydi!</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — VIBECODING (katalogga buyurtmalar) =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const TASKS = [
    { id: 't1', label: "Har kartochkaga o'yinchilar sonini chiqar", plan: ["Ro'yxatdagi players'ni map ichida uzataman", "GameCard'da {props.players} chiqaraman"], code: <>{'games.map(g => '}<Jx>{'<GameCard '}</Jx><At>name</At>{'={g.name} '}<At>players</At>{'={g.players}'}<Jx>{' />'}</Jx>{')'}</> },
    { id: 't2', label: "Eng mashhur o'yinga 🔥 TOP belgisi qo'y", plan: ["GameCard'ga top degan props qo'shaman", "top kelganda 🔥 TOP belgisini ko'rsataman"], code: <><Jx>{'<GameCard '}</Jx><At>name</At>=<St>"Blox Fruits"</St> <At>top</At>{'={true}'}<Jx>{' />'}</Jx></> },
    { id: 't3', label: "Katalog tepasiga sarlavha qo'y: nechta o'yin borligi yozilsin", plan: ['Header komponentiga count props uzataman', "Ichida {props.count} ta o'yin deb chiqaraman"], code: <><Jx>{'<Header '}</Jx><At>count</At>{'={games.length}'}<Jx>{' />'}</Jx></> }
  ];
  const [task, setTask] = useState(null);
  const [phase, setPhase] = useState(storedAnswer ? 'done' : 'idle'); // idle | planned | building | done
  const timer = useRef(null);
  const done = phase === 'done';
  useEffect(() => () => clearTimeout(timer.current), []);
  const choose = (id) => { clearTimeout(timer.current); setTask(id); setPhase('planned'); };
  const approve = () => { clearTimeout(timer.current); setPhase('building'); timer.current = setTimeout(() => setPhase('done'), 1300); };
  const cur = TASKS.find(t => t.id === task) || (storedAnswer ? TASKS[0] : null);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Keyingi qadam · AI" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Agent bilan ishlab ko'ring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Katalogni <span className="italic" style={{ color: T.accent }}>AI bilan</span> boyitsak-chi?</h2></div>
        <Mentor>Endi siz props oqimini bilasiz — agent kodini <b style={{ color: T.ink }}>tekshira olasiz</b>: ma'lumot ro'yxatdan kelyaptimi, jingalak qavs to'g'rimi, props pastga oqyaptimi. Buyruq bering, rejani <b style={{ color: T.ink }}>tasdiqlang</b>, natijani sinang.</Mentor>
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
                {phase === 'done' && <div className="ai-code fade-step"><div className="ai-line ok" style={{ cursor: 'default' }}>{cur.code}</div></div>}
              </div>
            )}
          </Col>
          <Col>
            <p className="flow-label">2. Natija — localhost:5173</p>
            <Win title="robo-games — localhost:5173" minH={130}>
              {done && cur ? (
                <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {cur.id === 't3' && <p style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: 13.5, color: T.ink, margin: 0 }}>🎮 Robo Games — 3 ta o'yin <span className="mono small" style={{ color: T.success, fontWeight: 700 }}>+ count</span></p>}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    <RoCard name="Adopt Me!" players={cur.id === 't1' ? '402K' : undefined} />
                    <RoCard name="Blox Fruits" players={cur.id === 't1' ? '750K' : undefined} top={cur.id === 't2'} />
                    <RoCard name="Doors" players={cur.id === 't1' ? '310K' : undefined} />
                  </div>
                </div>
              ) : (
                <p style={{ color: T.ink3, fontStyle: 'italic', margin: 0, fontFamily: 'Georgia, serif', fontSize: 13 }}>Buyruq bering va rejani tasdiqlang…</p>
              )}
            </Win>
            {done
              ? <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Kodni o'qing: ma'lumot <b>ro'yxatdan</b> kelyapti, props <b>pastga</b> oqyapti, jingalak qavs joyida. Agent ishini <b>isbot bilan</b> qabul qildingiz.</p></div>
              : <p className="body" style={{ margin: 0, color: T.ink3, fontSize: 13 }}>Natija shu yerda paydo bo'ladi — keyin uni o'zingiz tekshirasiz.</p>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — TEST 4 (read-only mustahkamlash) =====
const Screen12 = (props) => (
  <QuestionScreen {...props} idx={12} scope="module-mikro" eyebrow="Mashq · 4-savol"
    questionText="GameCard o'ziga kelgan props.name'ni o'zgartira oladimi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>GameCard o'ziga kelgan <span className="mono" style={{ color: T.accent }}>props.name</span>'ni o'zgartira oladimi?</h2></>}
    options={['Ha — xohlagancha o\'zgartiradi', "Yo'q — props faqat o'qiladi; o'zgaruvchan narsa uchun state bor", 'Faqat kichik harf bilan yozsa bo\'ladi', 'Faqat kechasi o\'zgartiradi']} correctIdx={1}
    explainCorrect="To'g'ri! Props — otadan kelgan sovg'a: faqat o'qiladi. O'zgartirishni ota qiladi (yangi props yuboradi), komponentning o'z o'zgaruvchan narsasi esa state'da yashaydi."
    explainWrong={{
      0: "Esingizdami konsol xatosi? ❌ TypeError — props faqat o'qish uchun.",
      2: "Yo'q — harfga bog'liq emas. Props har qanday holatda read-only.",
      3: "Yo'q — vaqtga ham bog'liq emas. Props hech qachon ichkaridan o'zgarmaydi.",
      default: "Props — read-only. O'zgartirish kerakmi? Ota yangi props yuboradi yoki state ishlatiladi."
    }} />
);

// ===== SCREEN 13 — AMALIYOT: O'Z KATALOGINGIZ =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const POOL = [...GAMES.slice(0, 3), ...EXTRA];
  const [mine, setMine] = useState(storedAnswer ? ['Adopt Me!', 'Doors', 'Piggy'] : []);
  const [topName, setTopName] = useState(storedAnswer ? 'Doors' : null);
  const done = mine.length >= 3 && !!topName;
  const toggle = (nm) => {
    setMine(prev => {
      if (prev.includes(nm)) { if (topName === nm) setTopName(null); return prev.filter(x => x !== nm); }
      return prev.length >= 4 ? prev : [...prev, nm];
    });
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Amaliyot · katalog" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : (mine.length < 3 ? `O'yin tanlang (${mine.length}/3)` : 'TOP belgilang')} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(8px,1.2vw,12px)' }}>
        <div className="head"><h2 className="title h-title fade-up">O'z katalogingizni <span className="italic" style={{ color: T.accent }}>yig'a olasizmi</span>?</h2></div>
        <Mentor>Endi o'zingiz! Sevimli o'yinlaringizdan <b style={{ color: T.ink }}>kamida 3 tasini</b> ro'yxatga qo'shing — kartochkalar o'zi chiziladi. Keyin bittasini <b style={{ color: T.ink }}>kartochkasini bosib</b> 🔥 TOP qilib belgilang (top props!).</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Ro'yxatga qo'shing</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {POOL.map(g => <button key={g.name} className={`gchip ${mine.includes(g.name) ? '' : ''}`} style={mine.includes(g.name) ? { background: T.accent, color: '#fff' } : undefined} onClick={() => toggle(g.name)}>{g.emoji} {g.name}</button>)}
            </div>
            <pre className="code-box fade-up delay-2" style={{ lineHeight: 1.8 }}>
              <Jx>{'const'}</Jx>{' mening = ['}{'\n'}
              {mine.length === 0 ? <Cm>{'  // o’yinlarni tanlang…'}{'\n'}</Cm> : mine.map(nm => <React.Fragment key={nm}>{'  { name: '}<St>"{nm}"</St>{topName === nm ? <>, top: <At>true</At></> : ''}{' },'}{'\n'}</React.Fragment>)}
              {'];'}{'\n\n'}
              {'{mening.map(g => '}<Jx>{'<GameCard '}</Jx><At>name</At>{'={g.name} '}<At>top</At>{'={g.top}'}<Jx>{' />'}</Jx>{')}'}
            </pre>
          </Col>
          <Col>
            <p className="flow-label">Katalogingiz {mine.length >= 3 && !topName ? '— kartochkani bosib TOP belgilang' : ''}</p>
            <Win title="mening-katalogim — localhost:5173" minH={120}>
              {mine.length === 0
                ? <p style={{ color: T.ink3, fontStyle: 'italic', margin: 0, fontFamily: 'Georgia, serif', fontSize: 13 }}>Bo'sh — ro'yxatga o'yin qo'shing…</p>
                : <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {mine.map(nm => <RoCard key={nm} name={nm} top={topName === nm} onClick={() => setTopName(nm)} />)}
                  </div>}
            </Win>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Katalogingiz tayyor: ro'yxat + map + props (<span className="mono">name</span>, <span className="mono">top</span>). Siz endi <b>ma'lumot bilan boshqaradigan</b> dasturchisiz.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — DEBUGGING (map ichida name uzatilmagan) =====
const Screen14 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const LIST = GAMES.slice(0, 3);
  const [picked, setPicked] = useState(storedAnswer ? 'call' : null);
  const [fixed, setFixed] = useState(!!storedAnswer);
  const found = picked === 'call';
  const done = fixed;
  const pickCall = () => { if (found) return; setPicked('call'); };
  const fix = () => setFixed(true);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Debugging" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : (found ? 'Endi tuzating' : 'Xatoni toping')} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">AI yordam beradi — siz esa <span className="italic" style={{ color: T.accent }}>tekshirasiz</span>.</h2></div>
        <Mentor>AI kod yozishda <b style={{ color: T.ink }}>zo'r yordamchi</b> — katalogni bir zumda yozib berdi. Lekin <b style={{ color: T.ink }}>odamlar ham, AI ham</b> ba'zan kichik xato qiladi. Qarang: katalog chizildi, lekin hamma kartochka <b style={{ color: T.ink }}>bir xil va nomsiz</b>! Ma'lumot qayerdadir yo'qoldi. Qaysi qatorda?</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="ai-card fade-up delay-2">
              <div className="ai-row"><span className="ai-badge">AI</span><span className="ai-bubble">Katalog kodini yozdim:</span></div>
              <div className="ai-code">
                <div className={`ai-line ${picked === 'arr' ? 'ok' : ''}`} onClick={() => { if (!found) setPicked('arr'); }}><Jx>{'const'}</Jx>{' games = [ '}<St>"Adopt Me!"</St>{', '}<St>"Blox Fruits"</St>{', … ];'}</div>
                <div className={`ai-line ${picked === 'map' ? 'ok' : ''}`} onClick={() => { if (!found) setPicked('map'); }}>{'{games.map(g => ('}</div>
                {!fixed ? (
                  <div className={`ai-line ${found ? 'bad' : ''}`} onClick={pickCall}>{'  '}<Jx>{'<GameCard />'}</Jx>{'  '}<Cm>{'// har o’yinga kartochka'}</Cm></div>
                ) : (
                  <div className="ai-line ok el-in">{'  '}<Jx>{'<GameCard '}</Jx><At>name</At>{'={g}'}<Jx>{' />'}</Jx>{'  '}<Cm>{'// ma’lumot uzatildi!'}</Cm></div>
                )}
                <div className={`ai-line ${picked === 'end' ? 'ok' : ''}`} onClick={() => { if (!found) setPicked('end'); }}>{'))}'}</div>
              </div>
              {!found && <p className="ai-prompt">Ma'lumot qaysi qatorda yo'qolyapti? Bosing.</p>}
              {found && !fixed && <button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={fix}>🔧 name={'{g}'} qo'shish</button>}
              {fixed && <p className="ai-prompt" style={{ color: T.success, fontStyle: 'normal', fontWeight: 600 }}>✓ Tuzatildi — ma'lumot endi kartochkalarga oqyapti!</p>}
            </div>
          </Col>
          <Col>
            <p className="flow-label">localhost:5173</p>
            <Win title="robo-games — localhost:5173" minH={104}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {LIST.map((g, i) => <RoCard key={fixed ? g.name : `empty-${i}`} name={fixed ? g.name : '· · ·'} />)}
              </div>
            </Win>
            {!found && (
              (picked === 'arr' || picked === 'map' || picked === 'end')
                ? <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bu qator to'g'ri{picked === 'arr' ? " — ro'yxat joyida" : picked === 'map' ? ' — konveyer ishlayapti, g qo\'lida' : ''}. Yana qarang: <span className="mono">g</span> dagi ma'lumot kartochkaga <b>uzatilyaptimi</b>?</p></div>
                : <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Kartochkalar nomsiz va kulrang — demak ularga <b style={{ color: T.ink }}>props yetib bormagan</b>. Posilka qayerda jo'natilmay qolgan?</p></div>
            )}
            {found && !fixed && <div className="frame-warn fade-step"><p className="note-h" style={{ color: T.accent }}>✓ Topdingiz!</p><p className="body" style={{ margin: 0, color: T.ink }}><span className="mono">{'<GameCard />'}</span> — chaqirilgan, lekin <b>posilkasiz</b>! <span className="mono">g</span> qo'lda turibdi-yu, uzatilmagan. Chapdagi tugma bilan tuzating →</p></div>}
            {fixed && (
              <div className="takeaway fade-step"><div className="ta-bulb">🛠️</div><p className="ta-h">Topdingiz va tuzatdingiz — bu debugging!</p><p className="ta-sub">AI tez yozadi, siz tekshirib tuzatasiz — zo'r jamoa</p></div>
            )}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 15 — YAKUNIY (VS Code: map ichida <GameCard name={g} />) =====
const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [value, setValue] = useState(storedAnswer?.picked || '');
  const [passed, setPassed] = useState(!!storedAnswer?.correct);
  const norm = value.replace(/\s+/g, ' ').trim();
  const valid = /^<\s*GameCard\s+name\s*=\s*\{\s*g\s*\}\s*\/\s*>$/.test(norm);
  const hasComp = /<\s*GameCard\b/.test(value);
  const hasLowerComp = /<\s*gamecard\b/i.test(value) && !hasComp;
  const hasDyn = /name\s*=\s*\{\s*g\s*\}/.test(value);
  const quoted = /name\s*=\s*"g"/.test(value);
  const hasClose = /\/\s*>\s*$/.test(value.trim());
  useEffect(() => {
    if (valid && !passed) {
      setPassed(true);
      onAnswer(screen, { stage: 'final', screenIdx: screen, question: "map ichida <GameCard name={g} /> ni yozing", studentAnswer: value, correct: true, firstAttemptCorrect: true, solved: true, picked: value });
    }
  }, [valid]);
  const Ln = ({ n, children }) => (
    <div className="vsc-line"><span className="vsc-ln">{n}</span><span style={{ whiteSpace: 'pre' }}>{children}</span></div>
  );
  return (
    <Stage eyebrow="Yakuniy · amaliy" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!passed} label={passed ? 'Davom etish' : 'Konveyer qatorini yozing'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Oxirgi qadam: katalogni <span className="italic" style={{ color: T.accent }}>o'zingiz</span> ishga tushiring.</h2></div>
        <Mentor>VS Code'da <span className="mono">App.jsx</span> ochiq: ro'yxat tayyor, konveyer (<span className="mono">map</span>) aylanyapti — faqat <b style={{ color: T.ink }}>6-qator bo'sh</b>! Yozing: <b style={{ color: T.ink }}>{'<GameCard'}</b> + <b style={{ color: T.ink }}>name={'{g}'}</b> (jingalak qavs — ma'lumot ro'yxatdan!) + <b style={{ color: T.ink }}>{'/>'}</b>.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="vsc fade-up delay-2">
              <div className="vsc-bar">
                <span className="vsc-tab on"><span style={{ color: '#61DAFB' }}>⚛</span> App.jsx <span style={{ color: '#6E7681', marginLeft: 4 }}>×</span></span>
                <span className="vsc-tab">GameCard.jsx</span>
              </div>
              <div className="vsc-body">
                <Ln n={1}><Jx>{'function'}</Jx><span style={{ color: '#DCDCAA' }}> App</span>{'() {'}</Ln>
                <Ln n={2}>{'  '}<Jx>{'const'}</Jx>{' games = ['}<St>'Adopt Me!'</St>{', '}<St>'Doors'</St>{'];'}</Ln>
                <Ln n={3}>{'  '}<Jx>{'return'}</Jx>{' ('}</Ln>
                <Ln n={4}>{'    '}<Jx>{'<div>'}</Jx></Ln>
                <Ln n={5}>{'      {games.map(g =>'}</Ln>
                <div className="vsc-line">
                  <span className="vsc-ln">6</span>
                  <span style={{ whiteSpace: 'pre' }}>{'        '}</span>
                  <input className={`vsc-input ${valid ? 'ok' : ''}`} value={value} onChange={e => setValue(e.target.value)} placeholder='<GameCard name={g} />' spellCheck={false} autoCapitalize="off" autoCorrect="off" />
                </div>
                <Ln n={7}>{'      )}'}</Ln>
                <Ln n={8}>{'    '}<Jx>{'</div>'}</Jx></Ln>
                <Ln n={9}>{'  );'}</Ln>
                <Ln n={10}>{'}'}</Ln>
              </div>
            </div>
            <div className="fade-up delay-2" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="tagpill" style={{ opacity: hasComp ? 1 : 0.4 }}>{hasComp ? '✓' : '1'} {'<GameCard'} — Katta harf</span>
              <span className="tagpill" style={{ opacity: hasDyn ? 1 : 0.4 }}>{hasDyn ? '✓' : '2'} name={'{g}'} — jingalak qavs</span>
              <span className="tagpill" style={{ opacity: hasClose ? 1 : 0.4 }}>{hasClose ? '✓' : '3'} {'/>'} yopilishi</span>
            </div>
            {hasLowerComp && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Esingizdami? Komponent nomi <b>Katta harf</b> bilan: <span className="mono">GameCard</span>.</p></div>}
            {quoted && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Deyarli! <span className="mono">name="g"</span> — bu shunchaki "g" degan matn bo'lib qoladi. Ma'lumot <b>ro'yxatdan kelishi</b> uchun jingalak qavs kerak: <span className="mono">name={'{g}'}</span></p></div>}
            {passed && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Mukammal! Konveyer ishladi: har o'yinga bitta kartochka. Data-driven katalog — sizning qo'lingizda.</p></div>}
          </Col>
          <Col>
            <p className="flow-label">natija — localhost:5173</p>
            <Win title="robo-games — localhost:5173" minH={130}>
              {valid
                ? <div className="fade-step" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
                    <RoCard name="Adopt Me!" />
                    <RoCard name="Doors" />
                  </div>
                : <p style={{ fontFamily: 'Georgia, serif', color: T.ink3, fontStyle: 'italic', margin: 0, textAlign: 'center', lineHeight: 1.5 }}>6-qator yozilmaguncha katalog bo'sh: <span className="mono" style={{ fontStyle: 'normal' }}>{'<GameCard'}</span> + <span className="mono" style={{ fontStyle: 'normal' }}>name={'{g}'}</span> + <span className="mono" style={{ fontStyle: 'normal' }}>{'/>'}</span></p>}
            </Win>
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
    "Ma'lumot atribut orqali uzatiladi: <GameCard name=\"…\" /> → props",
    "Bir nechta props: name, players, emoji — har biri alohida",
    "Oqim faqat yuqoridan pastga: otadan bolaga",
    "Props faqat o'qiladi — o'zgaruvchan narsa uchun state",
    "Ro'yxat + map = katalog: name={g} jingalak qavs bilan"
  ];
  const HOMEWORK = [
    { b: 'Katalog', t: "— robo-games loyihangizda 5 ta sevimli o'yindan ro'yxat tuzib, map bilan katalog chizing" },
    { b: 'Boy kartochka', t: "— har o'yinga players va emoji props'larini ham uzating" },
    { b: 'TOP belgisi', t: "— eng sevimli o'yiningizga top={true} uzatib, 🔥 belgi chiqaring" }
  ];
  const GLOSSARY = [
    { b: 'Props', t: "— otadan bolaga uzatiladigan ma'lumot" },
    { b: 'Atribut', t: "— chaqiruvdagi yozuv: name=\"…\"" },
    { b: 'name={g}', t: "— jingalak qavs: qiymat o'zgaruvchidan keladi" },
    { b: 'Bir tomonlama oqim', t: "— ma'lumot faqat pastga oqadi" },
    { b: 'Read-only', t: "— props'ni komponent o'zgartira olmaydi" },
    { b: 'map', t: "— ro'yxatning har elementiga bitta kartochka" },
    { b: 'Data-driven', t: "— sayt ma'lumotga qarab o'zini chizadi" }
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
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">✓</span> Dars tugadi</span><h2 className="title h-title fade-up d1">Katalogingiz <span className="italic" style={{ color: T.accent }}>tayyor</span>.</h2><p className="body h-sub fade-up d2">{PASSED ? "Tabriklaymiz! Endi ma'lumot komponentlar orasida sizning xohishingiz bilan oqadi — Roblox'dagiday katalog qurdingiz." : "Yaxshi harakat! Props oqimi va map'ni mustahkamlash uchun bir-ikki ekranni qayta ko'ring."}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span className="tick" style={{ width: 16, height: 16, borderRadius: '50%', background: T.success, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck">✓</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>📝 Uyga vazifa</div><p className="body" style={{ margin: '0 0 10px', color: T.ink }}>Antigravity bilan o'z loyihangizda sinang:</p><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">Keyingi darsda katta sirni ochamiz: o'yinlar ro'yxati kod ichidan chiqib ketadi — uni internetdagi serverdan olamiz! 🚀</p></div>
        </div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">💡 Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT — ({ lang, onFinished })
export default function ReactPropsReuseLesson({ lang: langProp, onFinished }) {
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

        /* === REACT-4 DARS CSS === */
        .bp-bar { background: #f0eee8; padding: 8px 11px; display: flex; align-items: center; gap: 9px; }
        .bb-dots { display: flex; gap: 5px; }
        .bb-dots i { width: 9px; height: 9px; border-radius: 50%; }
        .bb-dots i:first-child { background: #ff5f57; } .bb-dots i:nth-child(2) { background: #febc2e; } .bb-dots i:nth-child(3) { background: #28c840; }
        .bp-title { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink3}; }
        .bp-body { padding: clamp(12px,2.2vw,18px); }
        .code-box { background: ${CODE.bg}; color: ${CODE.text}; font-family: 'JetBrains Mono', monospace; font-size: clamp(12px,1.5vw,13.5px); line-height: 1.55; padding: clamp(12px,2.2vw,16px); border-radius: 12px; overflow-x: auto; white-space: pre-wrap; word-break: break-word; margin: 0; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.2); }
        /* Roblox uslubidagi o'yin kartochkasi */
        .rocard { border-radius: 13px; background: #fff; box-shadow: 0 5px 16px -4px rgba(0,0,0,0.18); overflow: hidden; border: 1px solid rgba(0,0,0,0.05); transition: transform 0.15s, box-shadow 0.15s; }
        .rocard:hover { transform: translateY(-2px); box-shadow: 0 12px 26px -5px rgba(0,0,0,0.28); }
        .rocard:hover .rothumb-play { opacity: 1; transform: scale(1); }
        .rocard.tappable { cursor: pointer; }
        .rothumb { position: relative; height: 68px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .rothumb::before { content: ''; position: absolute; inset: 0; background: radial-gradient(circle at 50% 30%, rgba(255,255,255,0.34), transparent 62%); }
        .rothumb::after { content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 44%; background: linear-gradient(transparent, rgba(0,0,0,0.26)); }
        .rothumb-icon { position: relative; z-index: 1; font-size: 32px; line-height: 1; filter: drop-shadow(0 3px 6px rgba(0,0,0,0.32)); }
        .rothumb-play { position: absolute; z-index: 1; bottom: 6px; right: 6px; width: 19px; height: 19px; border-radius: 50%; background: rgba(255,255,255,0.92); color: #1A2436; font-size: 8px; display: flex; align-items: center; justify-content: center; padding-left: 1px; box-shadow: 0 2px 7px rgba(0,0,0,0.3); opacity: 0; transform: scale(0.55); transition: all 0.2s; }
        .topbadge { position: absolute; z-index: 2; top: 6px; left: 6px; font-family: 'Manrope', sans-serif; font-weight: 800; font-size: 8.5px; color: #fff; background: linear-gradient(135deg,#FF6B35,#FF4F28); padding: 3px 8px; border-radius: 99px; letter-spacing: 0.04em; box-shadow: 0 2px 8px -1px rgba(255,79,40,0.6); }
        .robar { height: 4px; background: rgba(0,0,0,0.13); }
        .robar-fill { display: block; height: 100%; background: #1FA463; transition: width 0.4s ease; }
        .robody { padding: 8px 11px 10px; }
        .roname { font-family: 'Manrope', sans-serif; font-weight: 800; font-size: 12.5px; color: ${T.ink}; margin: 0 0 5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .rostats { display: flex; align-items: center; gap: 9px; font-family: 'Manrope', sans-serif; font-size: 11px; color: ${T.ink3}; font-weight: 700; }
        .rolike-static { color: ${T.success}; font-weight: 700; display: inline-flex; align-items: center; gap: 3px; }
        .roplayers { color: ${T.ink3}; display: inline-flex; align-items: center; gap: 3px; }
        @keyframes heart-pop { 0% { transform: scale(1); } 40% { transform: scale(1.45); } 100% { transform: scale(1); } }
        .hpop { animation: heart-pop 0.4s ease; display: inline-block; }
        /* Rentgen rejimi */
        .xray-ov { position: absolute; inset: 0; border: 1.5px dashed ${T.accent}; border-radius: 12px; background: rgba(246,244,239,0.9); display: flex; align-items: center; justify-content: center; animation: fade-step 0.35s ease-out; z-index: 2; }
        /* Posilka */
        @keyframes fly-down { 0% { opacity: 0; transform: translate(-50%, -18px) scale(0.7); } 35% { opacity: 1; } 100% { opacity: 0; transform: translate(-50%, 46px) scale(1); } }
        .parcel { transform: translateX(-50%); animation: fly-down 0.9s ease-in forwards; z-index: 3; }
        /* Ma'lumot daryosi tomchilari */
        @keyframes drip { 0% { transform: translateY(0); opacity: 0; } 30% { opacity: 1; } 100% { transform: translateY(16px); opacity: 0; } }
        .flow-dot { position: absolute; left: 1px; top: 0; width: 6px; height: 6px; border-radius: 50%; background: ${T.accent}; animation: drip 0.75s linear infinite; }
        /* Silkinish (teskari oqim / read-only) */
        @keyframes shake { 0%,100% { transform: none; } 25% { transform: translateX(-4px); } 50% { transform: translateX(4px); } 75% { transform: translateX(-3px); } }
        .shake { animation: shake 0.4s ease; }
        /* === KARTOCHKA POP === */
        @keyframes card-pop { 0% { opacity: 0; transform: scale(0.82) translateY(6px); } 60% { transform: scale(1.04); } 100% { opacity: 1; transform: none; } }
        .card-pop { animation: card-pop 0.4s cubic-bezier(.34,1.45,.5,1); }

        /* === POSILKA 2 (yorliqli) — Screen2 === */
        @keyframes parcel-arc { 0% { opacity: 0; transform: translate(-50%,-24px) scale(0.6) rotate(-10deg); } 25% { opacity: 1; } 80% { opacity: 1; } 100% { opacity: 0; transform: translate(-50%,42px) scale(1.05) rotate(8deg); } }
        .parcel2 { position: absolute; top: 6px; left: 50%; z-index: 3; display: flex; flex-direction: column; align-items: center; gap: 3px; animation: parcel-arc 0.95s cubic-bezier(.5,0,.5,1) forwards; pointer-events: none; }
        .parcel2-box { font-size: 26px; filter: drop-shadow(0 4px 6px rgba(255,79,40,0.45)); }
        .parcel2-lbl { font-family: 'JetBrains Mono'; font-size: 9px; font-weight: 700; color: ${T.accent}; background: #fff; padding: 2px 7px; border-radius: 99px; box-shadow: 0 2px 6px -1px rgba(255,79,40,0.4); white-space: nowrap; }
        @keyframes slot-pop { 0% { transform: scale(0.5); filter: brightness(1.8); } 60% { transform: scale(1.18); } 100% { transform: scale(1); filter: none; } }
        .slot-pop { display: inline-block; animation: slot-pop 0.42s cubic-bezier(.34,1.45,.5,1); }

        /* === PROPS TANLASH CHIPLARI — Screen3 === */
        .propchip { font-family: 'Manrope'; font-weight: 700; font-size: 12.5px; padding: 8px 14px; border-radius: 10px; border: 1.5px solid rgba(0,0,0,0.08); background: ${T.paper}; color: ${T.ink}; cursor: pointer; transition: all 0.16s; display: inline-flex; align-items: center; gap: 5px; box-shadow: 0 3px 9px -5px rgba(${T.shadowBase},0.2); }
        .propchip:hover { transform: translateY(-1px); border-color: rgba(255,79,40,0.4); }
        .propchip.sel { background: ${T.accent}; color: #fff; border-color: ${T.accent}; box-shadow: 0 6px 15px -5px rgba(255,79,40,0.5); }
        .propchip-tick { font-size: 11px; }
        .propchip-emoji { font-size: 18px; padding: 6px 13px; }
        .propchip-tag { font-family: 'JetBrains Mono'; font-weight: 600; font-size: 8.5px; color: ${T.ink3}; background: ${T.bg}; padding: 2px 6px; border-radius: 5px; margin-left: 6px; letter-spacing: 0; text-transform: none; }

        /* === OTA → BOLALAR DARAXTI — Screen5 === */
        .tree { position: relative; display: flex; flex-direction: column; align-items: stretch; gap: 0; }
        .tree-parent-row { display: flex; justify-content: center; }
        .tree-parent { position: relative; display: flex; flex-direction: column; align-items: center; gap: 1px; background: ${T.ink}; color: #fff; border-radius: 12px; padding: 9px 22px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.4); }
        .tp-tag { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 14px; }
        .tp-sub { font-family: 'Manrope'; font-size: 10px; opacity: 0.7; }
        .tp-block { position: absolute; right: -11px; top: -11px; font-size: 19px; animation: card-pop 0.3s ease; }
        .tree-pipes { position: relative; display: grid; grid-template-columns: 1fr 1fr 1fr; height: 40px; }
        .tree-bus { position: absolute; top: 0; left: 16.67%; right: 16.67%; height: 2px; background: ${T.ink3}; opacity: 0.5; }
        .tree-pipe { position: relative; justify-self: center; width: 2px; height: 40px; background: repeating-linear-gradient(${T.ink3} 0 4px, transparent 4px 8px); }
        .tree-pipe.done { background: ${T.success}; }
        .tree-ball { position: absolute; left: 50%; top: 0; width: 12px; height: 12px; margin-left: -6px; border-radius: 50%; background: ${T.accent}; box-shadow: 0 0 9px rgba(255,79,40,0.7); animation: ball-drop 1s ease-in forwards; }
        @keyframes ball-drop { 0% { top: -8px; opacity: 0; } 20% { opacity: 1; } 100% { top: 40px; opacity: 0.4; } }
        .tree-kids { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px; }
        .tree-kid { transition: all 0.4s; }
        .tree-kid-wait { border: 1.5px dashed ${T.ink3}; border-radius: 12px; padding: 16px 6px; display: flex; flex-direction: column; align-items: center; gap: 5px; opacity: 0.7; }
        .tk-tag { font-family: 'Manrope'; font-weight: 700; font-size: 11px; color: ${T.ink2}; }
        .tk-q { font-family: 'JetBrains Mono'; font-size: 10px; color: ${T.ink3}; }
        .tree-upball { position: absolute; left: 50%; bottom: 34%; transform: translateX(-50%); font-family: 'Manrope'; font-weight: 700; font-size: 11px; color: ${T.accent}; background: #fff; padding: 3px 10px; border-radius: 99px; box-shadow: 0 4px 11px -3px rgba(255,79,40,0.45); white-space: nowrap; z-index: 5; animation: upbounce 1s ease-out forwards; }
        @keyframes upbounce { 0% { opacity: 0; transform: translate(-50%,12px); } 20% { opacity: 1; } 55% { transform: translate(-50%,-16px); } 72% { transform: translate(-50%,-7px); } 100% { opacity: 0; transform: translate(-50%,-22px); } }

        /* === APP → KARTOCHKA SHARIK — Screen6 (read-only) === */
        .drop-stage { display: flex; flex-direction: column; align-items: center; gap: 0; }
        .drop-app { display: flex; flex-direction: column; align-items: center; gap: 1px; background: ${T.ink}; color: #fff; border-radius: 11px; padding: 8px 20px; box-shadow: 0 6px 16px -5px rgba(${T.shadowBase},0.4); }
        .drop-app-tag { font-family: 'Manrope'; font-weight: 800; font-size: 13px; }
        .drop-app-sub { font-family: 'Manrope'; font-size: 9.5px; opacity: 0.7; }
        .drop-pipe { position: relative; width: 2px; height: 34px; background: repeating-linear-gradient(${T.ink3} 0 4px, transparent 4px 8px); }
        .drop-ball { position: absolute; left: 50%; top: 0; width: 12px; height: 12px; margin-left: -6px; border-radius: 50%; background: ${T.success}; box-shadow: 0 0 9px rgba(31,122,77,0.7); animation: ball-drop2 0.65s ease-in forwards; }
        @keyframes ball-drop2 { 0% { top: -6px; opacity: 0; } 25% { opacity: 1; } 100% { top: 34px; opacity: 0.35; } }

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

