import React, { useState, useEffect, useRef, createContext, useContext, useCallback } from 'react';
import mentorImg from '../../assets/common/mentor.png';

// ============================================================
// REACT MODULI · 5-DARS — API BILAN ISHLASH: GET — PLATFORM STANDARD v16 (AUDIOSIZ)
// Mavzu: nega ma'lumot serverda turadi (1 markaz — hamma qurilma), API = ofitsiant,
//        fetch anatomiyasi (GET so'rovi, URL, endpoint), JSON javob (.json()),
//        loading holati (skeleton), useEffect + fetch + state — to'liq naqsh,
//        endpointlar (/games /top /new), 404 xatosi.
// Misol sayt: robo-games (davom) — katalog endi "serverdan" yuklanadi (robo-api.uz).
// Animatsiyalar: 3 qurilma sinxron yangilanishi (server kuchi), so'rov-javob konsoli,
//        skeleton shimmer (yuklanish), 4 qadamli useEffect+fetch+state oqimi,
//        404 → fix → katalog stagger yuklanishi.
// Oldingi darslar bilan bog'lanish: useEffect [] (3-dars), state (3-dars), massiv+map (4-dars),
//        server/so'rov (Internet darsi L0).
// MUHIM: kelgusi darslar ro'yxati o'quvchiga AYTILMAYDI — faqat yakunda teaser.
// AUDIOSIZ: ovoz (TTS) yo'q — platforma qarori.
// Yakuniy ekran (s15): VS Code — useEffect ichida fetch('https://robo-api.uz/games') yozish.
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

const LESSON_META = { lessonId: 'react-api-get-05-v16', lessonTitle: { uz: "API bilan ishlash: GET — serverdan ma'lumot olish", ru: 'Работа с API — GET' } };
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

// ===== REACT-5 YORDAMCHILAR =====
const Jx = ({ children }) => <span style={{ color: CODE.tag }}>{children}</span>;
const At = ({ children }) => <span style={{ color: CODE.attr }}>{children}</span>;
const St = ({ children }) => <span style={{ color: CODE.str }}>{children}</span>;
const Cm = ({ children }) => <span style={{ color: CODE.comment, fontStyle: 'italic' }}>{children}</span>;
const Win = ({ title, children, minH }) => (
  <div className="bp-window"><div className="bp-bar"><span className="bb-dots"><i /><i /><i /></span><span className="bp-title">{title}</span></div><div className="bp-body" style={{ minHeight: minH, position: 'relative' }}>{children}</div></div>
);
// Roblox uslubidagi o'yinlar (oldingi darslardan tanish)
const GAMES = [
  { name: 'Adopt Me!', emoji: '🐾', likes: 92, players: '402K', bg: 'linear-gradient(135deg,#FF9DBF,#C44569)' },
  { name: 'Blox Fruits', emoji: '🍇', likes: 95, players: '750K', bg: 'linear-gradient(135deg,#7EA6F4,#2E4A9E)' },
  { name: 'Brookhaven', emoji: '🏠', likes: 89, players: '510K', bg: 'linear-gradient(135deg,#8FD3A8,#2E7A4E)' },
  { name: 'Tower of Hell', emoji: '🗼', likes: 84, players: '120K', bg: 'linear-gradient(135deg,#F4B26A,#C9622E)' },
  { name: 'Doors', emoji: '🚪', likes: 91, players: '310K', bg: 'linear-gradient(135deg,#6B7280,#1F2430)' },
  { name: 'Piggy', emoji: '🐷', likes: 87, players: '180K', bg: 'linear-gradient(135deg,#F4A6C0,#B5446E)' },
  { name: 'Bee Swarm', emoji: '🐝', likes: 93, players: '260K', bg: 'linear-gradient(135deg,#F4D06A,#C99B2E)' }
];
const gameByName = (nm) => GAMES.find(g => g.name.toLowerCase() === String(nm).toLowerCase());
// "Server"dagi ma'lumotlar — endpointlar bo'yicha
const SERVER = {
  '/games': ['Adopt Me!', 'Blox Fruits', 'Brookhaven'],
  '/top': ['Blox Fruits', 'Bee Swarm'],
  '/new': ['Doors', 'Piggy', 'Bee Swarm']
};
// O'yin kartochkasi
const RoCard = ({ name, emoji, players, top }) => {
  const g = gameByName(name);
  const bg = g ? g.bg : 'linear-gradient(135deg,#8E9BB5,#4A5670)';
  const em = emoji || (g ? g.emoji : '🎮');
  return (
    <div className="rocard el-in" style={{ position: 'relative' }}>
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
// Skeleton kartochka — yuklanish holati (shimmer)
const SkelCard = () => (
  <div className="rocard">
    <div className="rothumb skel" />
    <div className="robody">
      <div className="skel" style={{ height: 11, width: '70%', borderRadius: 5, marginBottom: 5 }} />
      <div className="skel" style={{ height: 9, width: '45%', borderRadius: 5 }} />
    </div>
  </div>
);
// Terminal/konsol qatori
const TLine = ({ cmd, out, dim }) => (
  <div className="el-in" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 'clamp(11.5px,1.4vw,13px)', lineHeight: 1.7, color: dim ? CODE.comment : CODE.text }}>
    {cmd ? <><span style={{ color: CODE.str }}>$</span> <span style={{ color: CODE.text }}>{cmd}</span></> : out}
  </div>
);

// ===== SCREEN 0 — HOOK (yangi o'yin — hamma qurilmada bir zumda) =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [published, setPublished] = useState(!!storedAnswer);
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const OPTS = [
    { id: 'a', label: "Har bir qurilmaga kod alohida yozib chiqilgan" },
    { id: 'b', label: "Ma'lumot BITTA markazda turadi — hamma qurilma o'sha yerdan oladi" },
    { id: 'c', label: "Qurilmalar bir-biridan ko'chirib oladi" }
  ];
  const pick = (v) => { if (picked !== null || !published) return; setPicked(v); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: true }); };
  const DEVICES = ['telefon', 'planshet', 'noutbuk'];
  return (
    <Stage eyebrow="Kirish" screen={screen} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 800 }}>Yangi o'yin chiqdi — millionlab ekranda <span className="italic" style={{ color: T.accent }}>bir zumda</span> paydo bo'ldi. Qanday?</h1>
        <Mentor>O'tgan darsda katalog kod ichidagi ro'yxatdan chizilardi. Lekin Roblox'da yangi o'yin chiqsa, u <b style={{ color: T.ink }}>bir vaqtning o'zida</b> hammaning telefonida, planshetida, noutbukida paydo bo'ladi. Tugmani bosib, buni o'z ko'zingiz bilan ko'ring.</Mentor>
        <Zoomable>
        <Split>
          <Col>
            <button className="btn fade-up delay-1" style={{ alignSelf: 'flex-start' }} onClick={() => setPublished(true)} disabled={published}>{published ? "✓ E'lon qilindi" : "Yangi o'yinni e'lon qilish"}</button>
            <div className="fade-up delay-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 9 }}>
              {DEVICES.map((d, i) => (
                <div key={d} style={{ minWidth: 0 }}>
                  <p className="flow-label" style={{ marginBottom: 6 }}>{d}</p>
                  <Win title="robo-games" minH={60}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                      <RoCard name="Adopt Me!" />
                      {published && <div className="el-in" style={{ animationDelay: `${0.2 + i * 0.35}s`, animationFillMode: 'backwards' }}><RoCard name="Doors" /></div>}
                    </div>
                  </Win>
                </div>
              ))}
            </div>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Sizningcha, buni qanday uddalashdi?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => {
                const on = picked === o.id;
                return (
                  <button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null || !published} style={{ opacity: !published ? 0.55 : 1 }} onClick={() => pick(o.id)}>
                    <span className="radio">{on && <span className="radio-dot" />}</span>
                    <span>{o.label}</span>
                  </button>
                );
              })}
            </div>
            {!published && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>Avval yangi o'yinni e'lon qiling ←</p>}
            {picked !== null && <p className="hook-ack fade-step">Aynan! O'sha markaz — <b>server</b>. Hech kim millionlab telefonga kod yozib chiqmaydi: ma'lumot bitta joyda turadi, qurilmalar undan <b>so'rab oladi</b>. Bugun katalogingiz ham shunday ishlaydi.</p>}
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
    { text: "Server — ma'lumot markazi", tag: 'robo-api.uz' },
    { text: "fetch — so'rov yuborish", tag: "fetch('…/games')" },
    { text: 'JSON — server javobi', tag: 'res.json()' },
    { text: 'Yuklanish holati', tag: 'skeleton' },
    { text: "To'liq naqsh", tag: 'useEffect + fetch + state' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const PreviewBlock = (
    <Col>
      <p className="flow-label">Dars oxirida — sizning natijangiz</p>
      <Win title="robo-games — localhost:5173" minH={100}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <RoCard name="Adopt Me!" />
          <RoCard name="Blox Fruits" />
          <RoCard name="Brookhaven" />
        </div>
      </Win>
      <pre className="code-box" style={{ padding: '10px 14px' }}>{'fetch('}<St>'https://robo-api.uz/games'</St>{')'}</pre>
      <p className="mono small" style={{ color: T.accent, margin: 0 }}>→ kartochkalar endi serverdan yuklanadi</p>
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
          <h2 className="title h-title fade-up">Bugun katalogingiz ma'lumotni <span className="italic" style={{ color: T.accent }}>internetdagi serverdan</span> oladi.</h2>
        </div>
        <Mentor>Va'da beraman: dars oxirida saytingiz <b style={{ color: T.ink }}>xuddi haqiqiy Roblox kabi</b> ishlaydi — sahifa ochiladi, so'rov serverga uchadi, kartochkalar yuklanib chiqadi. Buning kaliti — bitta buyruq: <span className="mono">fetch</span>.</Mentor>
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

// ===== SCREEN 2 — SERVER (ro'yxat kod ichidan serverga ko'chadi) =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [phase, setPhase] = useState(storedAnswer ? 2 : 0); // 0 kodda, 1 ko'chmoqda, 2 serverda
  const timer = useRef(null);
  const done = phase >= 2;
  useEffect(() => () => clearTimeout(timer.current), []);
  const move = () => {
    if (phase !== 0) return;
    setPhase(1);
    timer.current = setTimeout(() => setPhase(2), 1000);
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Server" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Ro'yxatni ko'chiring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Ro'yxatni kod ichidan <span className="italic" style={{ color: T.accent }}>serverga ko'chirsak</span> nima o'zgaradi?</h2></div>
        <Mentor>Hozir <span className="mono">games</span> ro'yxati App.jsx ichida yashayapti — uni faqat shu sayt ko'radi. Endi uni internetdagi maxsus kompyuterga — <b style={{ color: T.ink }}>serverga</b> ko'chiramiz. Server unga <b style={{ color: T.ink }}>manzil</b> beradi, va istalgan qurilma o'sha manzildan oladi.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">App.jsx — sizning kodingiz</p>
            <pre className="code-box fade-up delay-1" style={{ lineHeight: 1.9, position: 'relative' }}>
              {phase === 1 && <div className="parcel fly-in" style={{ position: 'absolute', top: 6, left: '50%', fontSize: 24 }}>📦</div>}
              {phase < 2
                ? <span style={{ borderRadius: 6, padding: '2px 5px', display: 'inline-block', background: phase === 1 ? 'rgba(255,79,40,0.22)' : 'transparent', transition: 'all 0.3s' }}><Jx>{'const'}</Jx>{' games = ['}<St>"Adopt Me!"</St>{', '}<St>"Doors"</St>{', '}<St>"Brookhaven"</St>{'];'}</span>
                : <span className="el-in"><Cm>{'// ro’yxat endi serverda — kod yengillashdi!'}</Cm></span>}
              {'\n\n'}
              {'{games.map(g => '}<Jx>{'<GameCard '}</Jx><At>name</At>{'={g}'}<Jx>{' />'}</Jx>{')}'}
            </pre>
            <button className="btn fade-up delay-2" style={{ alignSelf: 'flex-start' }} onClick={move} disabled={phase !== 0}>{phase === 0 ? "Serverga ko'chirish" : phase === 1 ? "Ko'chmoqda…" : "✓ Ko'chirildi"}</button>
          </Col>
          <Col>
            <p className="flow-label">robo-api.uz — server</p>
            <div className="code-box fade-up delay-2" style={{ padding: '11px 14px', minHeight: 96 }}>
              <TLine out={<span style={{ color: CODE.attr, fontWeight: 700 }}>robo-api.uz</span>} />
              {phase < 2
                ? <TLine out={<span style={{ color: CODE.comment, fontStyle: 'italic' }}>{phase === 1 ? "posilka yo'lda…" : "bo'sh — ma'lumot kutilmoqda…"}</span>} />
                : <>
                    <TLine out={<span><span style={{ color: CODE.punct }}>/games:</span></span>} />
                    <TLine out={<span className="el-in" style={{ display: 'inline-block' }}>{'[ '}<St>"Adopt Me!"</St>{', '}<St>"Doors"</St>{', '}<St>"Brookhaven"</St>{' ]'}</span>} />
                  </>}
            </div>
            {done && <span className="tagpill fade-step" style={{ color: T.success }}>✓ manzil tayyor: https://robo-api.uz/games</span>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Endi bu ro'yxatni telefon ham, noutbuk ham, boshqa sayt ham — <b>manzili orqali</b> oladi. Bitta markaz — hamma uchun. Savol qoldi: kod uni <b>qanday so'rab oladi</b>?</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — FETCH ANATOMIYASI (3 bosiladigan qism) =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const PARTS = {
    fetch: { title: 'fetch — buyruq', desc: <>Ma'nosi: <b>"shu manzilga borib, ma'lumotni olib kel"</b>. Bu GET so'rovi — faqat olish, serverda hech narsani o'zgartirmaslik.</> },
    url: { title: 'https://robo-api.uz — server manzili', desc: <>Qaysi serverga borish kerakligi. Xuddi do'kon manzili: avval <b>qayerga</b> borishni bilish kerak.</> },
    ep: { title: '/games — endpoint', desc: <>Serverning <b>qaysi bo'limi</b> kerakligi. Bitta serverda bir nechta "eshik" bo'ladi — bu haqda birozdan keyin.</> }
  };
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(storedAnswer ? new Set(['fetch', 'url', 'ep']) : new Set());
  const done = seen.size >= 3;
  const tap = (k) => { setActive(k); setSeen(prev => { const s = new Set(prev); s.add(k); return s; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const partStyle = (k) => ({
    cursor: 'pointer', borderRadius: 6, padding: '3px 5px', transition: 'all 0.18s',
    background: active === k ? 'rgba(255,79,40,0.22)' : (seen.has(k) ? 'rgba(31,122,77,0.14)' : 'rgba(255,255,255,0.07)'),
    boxShadow: active === k ? `inset 0 0 0 1px ${T.accent}` : 'none'
  });
  const Row = ({ k, lbl, val }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 12, background: seen.has(k) ? T.successSoft : T.paper, boxShadow: seen.has(k) ? `inset 0 0 0 1.5px ${T.success}` : `0 4px 12px -6px rgba(${T.shadowBase},0.14)`, transition: 'all 0.3s' }}>
      <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: 11, letterSpacing: '0.08em', color: seen.has(k) ? T.success : T.ink3, minWidth: 64 }}>{lbl}</span>
      <span className="mono" style={{ fontSize: 12.5, color: seen.has(k) ? T.ink : T.ink3 }}>{seen.has(k) ? val : '?'}</span>
    </div>
  );
  return (
    <Stage eyebrow="fetch" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/3 qismni o'rganing`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Serverdan ma'lumotni <span className="italic" style={{ color: T.accent }}>qaysi buyruq</span> olib keladi?</h2></div>
        <Mentor>Tanishing: <span className="mono">fetch</span>. Internet darsidagi ofitsiantni eslaysizmi? <span className="mono">fetch</span> ham shunday ishlaydi: manzilni berasiz — u serverga boradi va javobni olib keladi. Buyruqning <b style={{ color: T.ink }}>3 qismini bosib</b> o'rganing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <pre className="code-box fade-up delay-1" style={{ fontSize: 'clamp(13px,1.9vw,16px)', lineHeight: 2.1, padding: '16px 18px' }}>
              <span onClick={() => tap('fetch')} style={partStyle('fetch')}><Jx>fetch</Jx></span>
              {'('}
              <span onClick={() => tap('url')} style={partStyle('url')}><St>'https://robo-api.uz</St></span>
              <span onClick={() => tap('ep')} style={partStyle('ep')}><St>/games'</St></span>
              {')'}
            </pre>
            {active
              ? <div className="sk-info" key={active}><p className="note-h" style={{ color: T.accent }}>{PARTS[active].title}</p><p className="body" style={{ margin: 0, color: T.ink }}>{PARTS[active].desc}</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Kod qismlarini bosing</p></div>}
          </Col>
          <Col>
            <p className="flow-label">So'rov pasporti</p>
            <div className="fade-up delay-2" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <Row k="fetch" lbl="BUYRUQ" val="GET — borib olib kel" />
              <Row k="url" lbl="SERVER" val="https://robo-api.uz" />
              <Row k="ep" lbl="BO'LIM" val="/games" />
            </div>
            {done && (
              <div className="code-box fade-step" style={{ padding: '9px 13px' }}>
                <TLine out={<span><span style={{ color: CODE.attr }}>GET</span> https://robo-api.uz/games</span>} />
                <TLine out={<span style={{ color: CODE.str }}>✓ 200 OK — server javob berdi</span>} />
              </div>
            )}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>So'rov to'liq: <b>kim</b> (fetch) + <b>qayerga</b> (manzil) + <b>nima</b> (/games). Server tushundi va javob qaytardi.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 (fetch nima qiladi?) =====
const Screen4 = (props) => (
  <QuestionScreen {...props} idx={4} scope="module-mikro" eyebrow="Mashq · 1-savol"
    questionText="fetch('https://robo-api.uz/games') nima qiladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}><span className="mono" style={{ color: T.accent }}>fetch('https://robo-api.uz/games')</span> nima qiladi?</h2></>}
    options={["Saytni qaytadan yuklaydi", "Shu manzilga so'rov yuborib, ma'lumotni olib keladi", "Faylni kompyuterga saqlaydi", "Yangi sahifa ochadi"]} correctIdx={1}
    explainCorrect="To'g'ri! fetch — ofitsiant kabi: manzilga boradi, so'raydi, javobni olib keladi. Bu GET so'rovi — faqat olish."
    explainWrong={{
      0: "Yo'q — sahifa joyida qoladi. fetch indamasdan, orqa fonda serverga borib keladi.",
      2: "Yo'q — hech narsa saqlanmaydi. fetch ma'lumotni kodga olib keladi, xolos.",
      3: "Yo'q — yangi sahifa ochilmaydi. Hammasi shu sahifaning ichida, ko'zga ko'rinmay bo'ladi.",
      default: "fetch = manzilga so'rov yuborish va javobni olib kelish."
    }} />
);

// ===== SCREEN 5 — JSON (javob matn → .json() → massiv) =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [got, setGot] = useState(!!storedAnswer);     // javob keldi (matn)
  const [parsed, setParsed] = useState(!!storedAnswer); // .json() qilindi
  const [loading, setLoading] = useState(false);
  const timer = useRef(null);
  const done = got && parsed;
  useEffect(() => () => clearTimeout(timer.current), []);
  const send = () => {
    if (loading || got) return;
    setLoading(true);
    timer.current = setTimeout(() => { setLoading(false); setGot(true); }, 800);
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="JSON" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : (got ? 'Endi .json() qiling' : "So'rov yuboring")} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Server javobni <span className="italic" style={{ color: T.accent }}>qaysi tilda</span> qaytaradi?</h2></div>
        <Mentor>Server javobi — <b style={{ color: T.ink }}>JSON</b>: kompyuterlarning umumiy ma'lumot tili. Ko'rinishi massivga o'xshaydi, lekin kelganda u hali <b style={{ color: T.ink }}>shunchaki matn</b>. Kod ishlatadigan haqiqiy massivga aylantirish uchun bitta qadam bor: <span className="mono">.json()</span>. Ikkala tugmani ketma-ket sinang.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={send} disabled={loading || got}>1 · So'rov yuborish {got ? '✓' : ''}</button>
              <button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => { if (got) setParsed(true); }} disabled={!got || parsed}>2 · .json() qilish {parsed ? '✓' : ''}</button>
            </div>
            <p className="flow-label" style={{ margin: 0 }}>Konsol</p>
            <div className="code-box" style={{ padding: '10px 13px', minHeight: 88 }}>
              {!got && !loading && <TLine out={<span style={{ color: CODE.comment, fontStyle: 'italic' }}>so'rov yuborilmagan…</span>} />}
              {loading && <TLine out={<span style={{ color: CODE.comment }}>GET /games — javob kutilmoqda…</span>} />}
              {got && !parsed && (
                <>
                  <TLine out={<span style={{ color: CODE.comment }}>{'// javob keldi — hozircha MATN:'}</span>} />
                  <TLine out={<span className="el-in" style={{ display: 'inline-block', color: CODE.str }}>{'\'[{"name":"Adopt Me!"},{"name":"Doors"}]\''}</span>} />
                </>
              )}
              {parsed && (
                <>
                  <TLine out={<span style={{ color: CODE.comment }}>{'// res.json() — endi HAQIQIY massiv:'}</span>} />
                  <TLine out={<span className="el-in" style={{ display: 'inline-block' }}>{'[ { name: '}<St>"Adopt Me!"</St>{' }, { name: '}<St>"Doors"</St>{' } ]'}</span>} />
                  <TLine out={<span className="el-in" style={{ color: CODE.str }}>✓ games.map(…) ishlashga tayyor</span>} />
                </>
              )}
            </div>
          </Col>
          <Col>
            <p className="flow-label">Javobning yo'li</p>
            <div className="fade-up delay-2" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {[
                { k: 1, t: 'Javob keldi — JSON matn', on: got },
                { k: 2, t: '.json() — massivga aylantirdi', on: parsed },
                { k: 3, t: 'map — kartochkalarni chizdi', on: parsed }
              ].map(s => (
                <div key={s.k} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 13px', borderRadius: 12, background: s.on ? T.successSoft : T.paper, boxShadow: s.on ? `inset 0 0 0 1.5px ${T.success}` : `0 4px 12px -6px rgba(${T.shadowBase},0.14)`, transition: 'all 0.3s' }}>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 12, color: s.on ? T.success : T.ink3 }}>{s.on ? '✓' : s.k}</span>
                  <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 13, color: s.on ? T.ink : T.ink3, transition: 'color 0.3s' }}>{s.t}</span>
                </div>
              ))}
            </div>
            {parsed && (
              <Win title="robo-games — localhost:5173" minH={80}>
                <div className="fade-step" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, maxWidth: 280 }}>
                  <RoCard name="Adopt Me!" />
                  <RoCard name="Doors" />
                </div>
              </Win>
            )}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Eslab qoling: javob keldi — avval <span className="mono">.json()</span>, keyin ishlatish. Tarjimasiz massiv yo'q, massivsiz map yo'q.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 5b — TEST 2 (.json) =====
const Screen5b = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Tekshiruv"
    questionText="Server javobini kodda ishlatishdan oldin nima qilamiz?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Mustahkamlash</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Server javobini kodda ishlatishdan oldin <span className="italic" style={{ color: T.accent }}>nima qilamiz</span>?</h2></>}
    options={["Hech narsa — javob darrov tayyor bo'ladi", "Qaytadan serverga yuboramiz", ".json() bilan kod tushunadigan massivga aylantiramiz", "Qo'lda ko'chirib yozamiz"]} correctIdx={2}
    explainCorrect="To'g'ri! Javob JSON matn bo'lib keladi — .json() uni haqiqiy massivga aylantiradi. Shundan keyingina map ishlaydi."
    explainWrong={{
      0: "Konsolni eslang: javob matn edi — qo'shtirnoq ichida. Matnga map qilolmaysiz, avval .json().",
      1: "Yo'q — javob bizga keldi, uni qaytarish shart emas. Faqat tarjima kerak: .json().",
      3: "Yo'q — hech narsa qo'lda yozilmaydi. .json() bir o'zi hammasini aylantiradi.",
      default: "Avval .json() — JSON matnni haqiqiy massivga aylantiradi."
    }} />
);

// ===== SCREEN 6 — YUKLANISH (skeletonsiz vs skeleton) =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const LIST = GAMES.slice(0, 3);
  const [mode, setMode] = useState(null);      // 'plain' | 'skel'
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [tried, setTried] = useState(storedAnswer ? new Set(['plain', 'skel']) : new Set());
  const timer = useRef(null);
  const done = tried.size >= 2;
  useEffect(() => () => clearTimeout(timer.current), []);
  const run = (m) => {
    if (loading) return;
    clearTimeout(timer.current);
    setMode(m); setLoading(true); setLoaded(false);
    setTried(prev => { const s = new Set(prev); s.add(m); return s; });
    timer.current = setTimeout(() => { setLoading(false); setLoaded(true); }, 1800);
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Yuklanish" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkala usulni sinang'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Javob kelguncha foydalanuvchi <span className="italic" style={{ color: T.accent }}>nimani ko'radi</span>?</h2></div>
        <Mentor>Server javobi bir zumda kelmaydi — internet orqali yo'l bor. Shu kutish payti saytlar ikki xil yo'l tutadi. <b style={{ color: T.ink }}>Ikkalasini ham sinang</b> — qaysi biri yaxshiroq, o'zingiz ko'rasiz.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              <button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => run('plain')} disabled={loading}>1 · Shunchaki kutish {tried.has('plain') ? '✓' : ''}</button>
              <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => run('skel')} disabled={loading}>2 · Skeleton bilan kutish {tried.has('skel') ? '✓' : ''}</button>
            </div>
            {tried.has('plain') && mode === 'plain' && loading && <div className="hint fade-step"><p className="body" style={{ margin: 0, color: T.ink2 }}>Bo'sh oq ekran… Sayt qotib qoldimi? Ishlayaptimi? Foydalanuvchi <b style={{ color: T.ink }}>bilmaydi</b>.</p></div>}
            {mode === 'skel' && loading && <div className="hint fade-step"><p className="body" style={{ margin: 0, color: T.ink2 }}>Kulrang kartochkalar lipillayapti — "sayt tirik, ma'lumot <b style={{ color: T.ink }}>yo'lda</b>" degan signal.</p></div>}
            {done && !loading && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}><b>Skeleton</b> — yuklanayotgan kartochkaning kulrang sharpasi. Roblox, YouTube, Instagram — hammasi shuni ishlatadi: foydalanuvchi xotirjam kutadi.</p></div>}
          </Col>
          <Col>
            <p className="flow-label">robo-games {loading ? '— yuklanmoqda…' : ''}</p>
            <Win title="robo-games — localhost:5173" minH={120}>
              {!mode && <p style={{ color: T.ink3, fontStyle: 'italic', margin: 0, fontFamily: 'Georgia, serif', fontSize: 13 }}>Chapdagi tugmalardan birini bosing…</p>}
              {mode && loading && mode === 'plain' && <div style={{ height: 96 }} />}
              {mode && loading && mode === 'skel' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  <SkelCard /><SkelCard /><SkelCard />
                </div>
              )}
              {mode && loaded && (
                <div className="fade-step" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {LIST.map(g => <RoCard key={g.name} name={g.name} />)}
                </div>
              )}
            </Win>
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — TO'LIQ NAQSH (useEffect + fetch + state, 4 qadam anim) =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const LIST = GAMES.slice(0, 3);
  const [step, setStep] = useState(storedAnswer ? 4 : 0); // 0 idle, 1..4
  const [running, setRunning] = useState(false);
  const timer = useRef(null);
  const done = step >= 4;
  useEffect(() => () => clearInterval(timer.current), []);
  const run = () => {
    if (running) return;
    clearInterval(timer.current); setRunning(true); setStep(0);
    let i = 0;
    timer.current = setInterval(() => {
      i += 1; setStep(i);
      if (i >= 4) { clearInterval(timer.current); setRunning(false); }
    }, 950);
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const hl = (z) => ({ borderRadius: 6, padding: '1px 5px', display: 'inline-block', background: running && step === z ? 'rgba(255,79,40,0.22)' : (step > z || (!running && step >= z && step >= 4) ? 'rgba(31,122,77,0.12)' : 'transparent'), transition: 'all 0.3s' });
  const STEPS = [
    { z: 1, t: "Sahifa ochildi — games hali bo'sh [ ]" },
    { z: 2, t: "useEffect fetch'ni yubordi — so'rov yo'lda" },
    { z: 3, t: "Javob keldi — .json() massivga aylantirdi" },
    { z: 4, t: "setGames — React kartochkalarni chizdi" }
  ];
  return (
    <Stage eyebrow="To'liq naqsh" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Naqshni ishga tushiring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(8px,1.2vw,12px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Hammasi birga: to'liq naqsh <span className="italic" style={{ color: T.accent }}>qanday ishlaydi</span>?</h2></div>
        <Mentor>Mana professional saytlarning yuragi — <b style={{ color: T.ink }}>4 qadam</b>: bo'sh state → useEffect so'rov yuboradi → javob keladi → setGames chizadi. ▶ tugmasini bosib, <b style={{ color: T.ink }}>kod bilan ekranni birga</b> kuzating.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <button className="btn fade-up delay-1" style={{ alignSelf: 'flex-start' }} onClick={run} disabled={running}>{running ? 'Ishlayapti…' : (done ? '↻ Yana koʻrish' : '▶ Naqshni ishga tushirish')}</button>
            <pre className="code-box fade-up delay-2" style={{ lineHeight: 1.95 }}>
              <span style={hl(1)}><Jx>{'const'}</Jx>{' [games, setGames] = useState([]);'}</span>{'\n\n'}
              <span style={hl(2)}>{'useEffect(() => {'}</span>{'\n'}
              <span style={hl(2)}>{'  fetch('}<St>'https://robo-api.uz/games'</St>{')'}</span>{'\n'}
              <span style={hl(3)}>{'    .then(res => res.json())'}</span>{'\n'}
              <span style={hl(4)}>{'    .then(data => setGames(data));'}</span>{'\n'}
              {'}, []);'}
            </pre>
          </Col>
          <Col>
            <div className="fade-up delay-2" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {STEPS.map(s => (
                <div key={s.z} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '8px 12px', borderRadius: 11, background: step >= s.z ? T.successSoft : T.paper, boxShadow: running && step === s.z ? `inset 0 0 0 1.5px ${T.accent}` : (step >= s.z ? `inset 0 0 0 1.5px ${T.success}` : `0 4px 12px -6px rgba(${T.shadowBase},0.14)`), transition: 'all 0.35s' }}>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 11.5, color: step >= s.z ? T.success : T.ink3 }}>{step >= s.z ? '✓' : s.z}</span>
                  <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 12.5, color: step >= s.z ? T.ink : T.ink3, transition: 'color 0.35s' }}>{s.t}</span>
                </div>
              ))}
            </div>
            <Win title="robo-games — localhost:5173" minH={96}>
              {step < 2 && <p style={{ color: T.ink3, fontStyle: 'italic', margin: 0, fontFamily: 'Georgia, serif', fontSize: 13 }}>{running ? 'sahifa ochildi…' : '▶ tugmasini bosing'}</p>}
              {(step === 2 || step === 3) && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  <SkelCard /><SkelCard /><SkelCard />
                </div>
              )}
              {step >= 4 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {LIST.map((g, i) => <div key={g.name} className="el-in" style={{ animationDelay: `${i * 0.16}s`, animationFillMode: 'backwards' }}><RoCard name={g.name} /></div>)}
                </div>
              )}
            </Win>
            {done && !running && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Tanish qismlarga e'tibor bering: <span className="mono">useState</span> va <span className="mono">useEffect</span> — o'tgan darslardan! Yangi mehmon faqat bitta: <span className="mono">fetch</span>.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — ENDPOINTLAR (/games /top /new) =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const EPS = ['/games', '/top', '/new'];
  const LABELS = { '/games': "hamma o'yinlar", '/top': "eng zo'rlari", '/new': 'yangilari' };
  const [ep, setEp] = useState(storedAnswer ? '/top' : null);
  const [loading, setLoading] = useState(false);
  const [tried, setTried] = useState(storedAnswer ? new Set(['/games', '/top']) : new Set());
  const timer = useRef(null);
  const done = tried.size >= 2;
  useEffect(() => () => clearTimeout(timer.current), []);
  const choose = (e) => {
    clearTimeout(timer.current);
    setEp(e); setLoading(true);
    setTried(prev => { const s = new Set(prev); s.add(e); return s; });
    timer.current = setTimeout(() => setLoading(false), 600);
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Endpointlar" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Kamida 2 eshikni sinang (${tried.size}/2)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bitta serverdan <span className="italic" style={{ color: T.accent }}>har xil ro'yxat</span> olsa bo'ladimi?</h2></div>
        <Mentor>Bo'ladi! Server — katta bino, <b style={{ color: T.ink }}>endpointlar — eshiklar</b>: <span className="mono">/games</span> hammasi, <span className="mono">/top</span> eng zo'rlari, <span className="mono">/new</span> yangilari. Eshikni tanlang — <span className="mono">fetch</span> o'sha ro'yxatni olib keladi.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Eshikni tanlang</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {EPS.map(e => (
                <button key={e} className={`chip ${ep === e ? 'chip-on' : ''}`} onClick={() => choose(e)}>
                  <span className="mono" style={{ fontSize: 13 }}>{e}</span>
                  <span style={{ fontSize: 11.5, opacity: 0.75 }}>{LABELS[e]}</span>
                  {tried.has(e) ? ' ✓' : ''}
                </button>
              ))}
            </div>
            <pre className="code-box fade-up delay-2" style={{ padding: '12px 14px' }}>
              {'fetch('}<St>'https://robo-api.uz</St>{ep ? <St><b>{ep}</b></St> : <Cm>?</Cm>}<St>'</St>{')'}
            </pre>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bitta server — uchta eshik. Faqat <b>manzil oxiri</b> o'zgaradi, fetch o'sha bo'limni keltiradi. Roblox'dagi "Top", "Yangi" qatorlari ham shunday ishlaydi.</p></div>}
          </Col>
          <Col>
            <p className="flow-label">robo-api.uz{ep || ''}</p>
            <Win title={`robo-api.uz${ep || ''}`} minH={110}>
              {!ep && <p style={{ color: T.ink3, fontStyle: 'italic', margin: 0, fontFamily: 'Georgia, serif', fontSize: 13 }}>Eshik tanlanmagan…</p>}
              {ep && loading && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {SERVER[ep].map((_, i) => <SkelCard key={i} />)}
                </div>
              )}
              {ep && !loading && (
                <div key={ep} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {SERVER[ep].map((nm, i) => <div key={nm} className="el-in" style={{ animationDelay: `${i * 0.12}s`, animationFillMode: 'backwards' }}><RoCard name={nm} top={ep === '/top'} /></div>)}
                </div>
              )}
            </Win>
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 9 — TEST 3 (kelgan ma'lumot qanday ekranga chiqadi?) =====
const Screen9 = (props) => (
  <QuestionScreen {...props} idx={9} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="Serverdan kelgan o'yinlar qanday qilib ekranga chiqadi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Serverdan kelgan o'yinlar <span className="italic" style={{ color: T.accent }}>qanday qilib</span> ekranga chiqadi?</h2></>}
    options={["Sahifani qo'lda yangilash kerak", "fetch o'zi ekranga chizib qo'yadi", "useEffect o'zi chizadi", "Javob setGames bilan state'ga yoziladi — React o'zi qayta chizadi"]} correctIdx={3}
    explainCorrect="To'g'ri! fetch faqat olib keladi, chizish — state'ning ishi: setGames(data) → state yangilandi → React kartochkalarni chizdi. O'tgan darsdagi qoida shu yerda ham ishlayapti!"
    explainWrong={{
      0: "Yo'q — qo'lda yangilash kerak emas. setGames state'ni o'zgartirgan zahoti React o'zi qayta chizadi.",
      1: "fetch — ofitsiant: olib keladi, lekin chizmaydi. Chizish uchun ma'lumot state'ga tushishi kerak.",
      2: "useEffect — faqat 'qachon ishga tushirish'ni hal qiladi. Chizishni state o'zgarishi boshlaydi.",
      default: "Yo'l: javob → .json() → setGames(data) → state yangilandi → React chizdi."
    }} />
);

// ===== SCREEN 10 — 404 (xato manzil) =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const LIST = GAMES.slice(0, 3);
  const [cur, setCur] = useState(storedAnswer ? 'good' : null); // 'bad' | 'good'
  const [triedBad, setTriedBad] = useState(!!storedAnswer);
  const [triedGood, setTriedGood] = useState(!!storedAnswer);
  const done = triedBad && triedGood;
  const send = (which) => {
    setCur(which);
    if (which === 'bad') setTriedBad(true); else setTriedGood(true);
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="404" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Ikkala manzilni sinang"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Manzilda <span className="italic" style={{ color: T.accent }}>bitta harf xato</span> bo'lsa-chi?</h2></div>
        <Mentor>Internet darsidagi <span className="mono">youtub.com</span>ni eslaysizmi? Serverlarda ham shunday: <b style={{ color: T.ink }}>yo'q eshikni</b> so'rasangiz, server <b style={{ color: T.ink }}>404 — "Topilmadi"</b> deb javob beradi. Avval xato manzilni, keyin to'g'risini sinab ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              <button className="btn-soft mono" style={{ alignSelf: 'flex-start', fontFamily: "'JetBrains Mono',monospace" }} onClick={() => send('bad')}>fetch('…/gmaes') {triedBad ? '✓' : ''}</button>
              <button className="btn mono" style={{ alignSelf: 'flex-start', fontFamily: "'JetBrains Mono',monospace" }} onClick={() => send('good')}>fetch('…/games') {triedGood ? '✓' : ''}</button>
            </div>
            <p className="flow-label" style={{ margin: 0 }}>Konsol</p>
            <div className="code-box" style={{ padding: '10px 13px', minHeight: 64 }}>
              {!cur && <TLine out={<span style={{ color: CODE.comment, fontStyle: 'italic' }}>manzilni tanlang…</span>} />}
              {cur === 'bad' && (
                <>
                  <TLine out={<span><span style={{ color: CODE.attr }}>GET</span> https://robo-api.uz/gmaes</span>} />
                  <TLine out={<span className="el-in" style={{ display: 'inline-block', color: CODE.tag }}>❌ 404 Not Found — bunday endpoint yo'q</span>} />
                </>
              )}
              {cur === 'good' && (
                <>
                  <TLine out={<span><span style={{ color: CODE.attr }}>GET</span> https://robo-api.uz/games</span>} />
                  <TLine out={<span className="el-in" style={{ display: 'inline-block', color: CODE.str }}>✓ 200 OK — 3 ta o'yin keldi</span>} />
                </>
              )}
            </div>
          </Col>
          <Col>
            <p className="flow-label">robo-games</p>
            <Win title="robo-games — localhost:5173" minH={104}>
              {cur === 'good'
                ? <div className="fade-step" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>{LIST.map(g => <RoCard key={g.name} name={g.name} />)}</div>
                : <p style={{ color: T.ink3, fontStyle: 'italic', margin: 0, fontFamily: 'Georgia, serif', fontSize: 13 }}>{cur === 'bad' ? 'katalog boʼsh qoldi — maʼlumot kelmadi…' : 'kutilmoqda…'}</p>}
            </Win>
            {triedBad && !triedGood && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>404 — bu serverning javobi: <b>"so'rading, lekin menda /gmaes degan eshik yo'q"</b>. Sayt buzilmadi — faqat manzil xato. Endi to'g'risini sinang.</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>404 — dushman emas, <b>xabarchi</b>: manzilni tekshir, deydi. Konsolda 404 ko'rsangiz — birinchi navbatda <b>manzil harflarini</b> tekshirasiz.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — VIBECODING (AI bilan serverli boyitish) =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const TASKS = [
    { id: 't1', label: "Saytga TOP o'yinlar bo'limini qo'sh", plan: ["fetch('https://robo-api.uz/top') so'rov yuboraman", "Kelgan ro'yxatni alohida TOP qatorida chizaman"], code: <>{'fetch('}<St>'https://robo-api.uz/top'</St>{').then(r => r.json()).then(d => setTop(d))'}</> },
    { id: 't2', label: "Yangi o'yinlar bo'limini qo'sh", plan: ["fetch('https://robo-api.uz/new') so'rov yuboraman", "Javobni 'Yangi' sarlavhasi ostida chizaman"], code: <>{'fetch('}<St>'https://robo-api.uz/new'</St>{').then(r => r.json()).then(d => setNew(d))'}</> },
    { id: 't3', label: "Yuklanayotganda skeleton ko'rsat", plan: ["loading degan state qo'shaman — boshida true", "Javob kelganda false qilib, skeleton o'rniga kartochkalarni chizaman"], code: <>{'{loading ? '}<Jx>{'<Skeleton />'}</Jx>{' : games.map(…)}'}</> }
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
        <div className="head"><h2 className="title h-title fade-up">Serverli saytni <span className="italic" style={{ color: T.accent }}>AI bilan</span> boyitsak-chi?</h2></div>
        <Mentor>Endi siz so'rov naqshini bilasiz — agent kodini <b style={{ color: T.ink }}>tekshira olasiz</b>: manzil to'g'rimi, .json() bormi, javob state'ga tushyaptimi. Buyruq bering, rejani <b style={{ color: T.ink }}>tasdiqlang</b>, natijani sinang.</Mentor>
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
                  {cur.id === 't1' && <p style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: 13.5, color: T.ink, margin: 0 }}>TOP o'yinlar <span className="mono small" style={{ color: T.success, fontWeight: 700 }}>← /top dan keldi</span></p>}
                  {cur.id === 't2' && <p style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: 13.5, color: T.ink, margin: 0 }}>Yangi o'yinlar <span className="mono small" style={{ color: T.success, fontWeight: 700 }}>← /new dan keldi</span></p>}
                  {cur.id === 't3' && <p style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: 13.5, color: T.ink, margin: 0 }}>Yuklanish chiroyli boʼldi <span className="mono small" style={{ color: T.success, fontWeight: 700 }}>← skeleton</span></p>}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                    {cur.id === 't1' && SERVER['/top'].map(nm => <RoCard key={nm} name={nm} top />)}
                    {cur.id === 't2' && SERVER['/new'].map(nm => <RoCard key={nm} name={nm} />)}
                    {cur.id === 't3' && <><SkelCard /><RoCard name="Adopt Me!" /><RoCard name="Doors" /></>}
                  </div>
                </div>
              ) : (
                <p style={{ color: T.ink3, fontStyle: 'italic', margin: 0, fontFamily: 'Georgia, serif', fontSize: 13 }}>Buyruq bering va rejani tasdiqlang…</p>
              )}
            </Win>
            {done
              ? <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Kodni o'qing: manzil <b>to'g'ri eshikka</b> boryapti, javob <b>.json()dan o'tib</b> state'ga tushyapti. Agent ishini <b>isbot bilan</b> qabul qildingiz.</p></div>
              : <p className="body" style={{ margin: 0, color: T.ink3, fontSize: 13 }}>Natija shu yerda paydo bo'ladi — keyin uni o'zingiz tekshirasiz.</p>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — TEST 4 (404 ko'rsangiz nimani tekshirasiz?) =====
const Screen12 = (props) => (
  <QuestionScreen {...props} idx={12} scope="module-mikro" eyebrow="Mashq · 4-savol"
    questionText="Konsolda 404 xatosini ko'rsangiz, birinchi nimani tekshirasiz?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Konsolda <span className="mono" style={{ color: T.accent }}>404</span> ko'rsangiz, birinchi <span className="italic" style={{ color: T.accent }}>nimani tekshirasiz</span>?</h2></>}
    options={["Manzilni — endpoint to'g'ri yozilganmi", "Kompyuterni o'chirib yoqaman", "React'ni qaytadan o'rnataman", "Hech narsani — o'zi tuzalib ketadi"]} correctIdx={0}
    explainCorrect="To'g'ri! 404 = server 'bunday eshik menda yo'q' deyapti. Demak manzilda xato bor — harflarni tekshirasiz: /gmaes emas, /games."
    explainWrong={{
      1: "Yo'q — kompyuterda ayb yo'q. 404 server javobi: so'ralgan manzil topilmadi.",
      2: "Yo'q — React joyida. 404 faqat manzil haqida gapiryapti.",
      3: "O'zi tuzalmaydi — manzil xato bo'lsa, server har safar 404 deyveradi. Harflarni tuzatish kerak.",
      default: "404 = manzil topilmadi. Birinchi qadam — endpoint harflarini tekshirish."
    }} />
);

// ===== SCREEN 13 — AMALIYOT: SO'ROV KODINI YIG'ISH (tartiblangan bo'laklar) =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const LIST = GAMES.slice(0, 3);
  const ORDER = ['effect', 'fetch', 'json', 'set'];
  const CHIPS = {
    effect: 'useEffect(() => {',
    fetch: "fetch('https://robo-api.uz/games')",
    json: '.then(res => res.json())',
    set: '.then(data => setGames(data));'
  };
  const POOL = ['set', 'fetch', 'effect', 'json']; // ataylab aralashtirilgan
  const HINTS = { effect: 'qachon? — sahifa ochilganda', fetch: 'qayerga? — manzilga so’rov', json: 'tarjima — matn → massiv', set: 'ekranga — state yangilanadi' };
  const [placed, setPlaced] = useState(storedAnswer ? 4 : 0);
  const [shakeId, setShakeId] = useState(null);
  const [loaded, setLoaded] = useState(!!storedAnswer);
  const timer = useRef(null);
  const shakeTimer = useRef(null);
  const done = placed >= 4;
  useEffect(() => () => { clearTimeout(timer.current); clearTimeout(shakeTimer.current); }, []);
  useEffect(() => {
    if (done && !loaded) { timer.current = setTimeout(() => setLoaded(true), 900); }
  }, [done]);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const tap = (id) => {
    if (done || POOL.indexOf(id) === -1) return;
    if (ORDER.indexOf(id) < placed) return; // allaqachon joylashgan
    if (ORDER[placed] === id) { setPlaced(p => p + 1); }
    else {
      clearTimeout(shakeTimer.current);
      setShakeId(id);
      shakeTimer.current = setTimeout(() => setShakeId(null), 450);
    }
  };
  const IND = { effect: '', fetch: '  ', json: '    ', set: '    ' };
  return (
    <Stage eyebrow="Amaliyot · kod yig'ish" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Bo'laklarni tartib bilan bosing (${placed}/4)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(8px,1.2vw,12px)' }}>
        <div className="head"><h2 className="title h-title fade-up">So'rov kodini <span className="italic" style={{ color: T.accent }}>o'zingiz yig'a olasizmi</span>?</h2></div>
        <Mentor>4 bo'lak — <b style={{ color: T.ink }}>to'g'ri tartibda</b> bosing: avval <b style={{ color: T.ink }}>qachon</b> (useEffect), keyin <b style={{ color: T.ink }}>qayerga</b> (fetch), keyin <b style={{ color: T.ink }}>tarjima</b> (.json), oxirida <b style={{ color: T.ink }}>ekranga</b> (setGames). Xato bossangiz — bo'lak silkinadi.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Bo'laklar</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {POOL.map(id => {
                const used = ORDER.indexOf(id) < placed;
                return (
                  <button key={id} className={`gchip ${shakeId === id ? 'shake' : ''}`} disabled={used} onClick={() => tap(id)} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, justifyContent: 'space-between', opacity: used ? 0.35 : 1, padding: '9px 13px' }}>
                    <span>{CHIPS[id]}</span>
                    <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 10.5, color: used ? T.success : T.ink3, fontStyle: 'italic' }}>{used ? '✓' : HINTS[id]}</span>
                  </button>
                );
              })}
            </div>
            <pre className="code-box fade-up delay-2" style={{ lineHeight: 1.95, minHeight: 110 }}>
              {placed === 0 && <Cm>{'// bo’laklarni tartib bilan bosing…'}</Cm>}
              {ORDER.slice(0, placed).map(id => <span key={id} className="el-in" style={{ display: 'inline-block' }}>{IND[id]}{id === 'fetch' ? <>{'fetch('}<St>'https://robo-api.uz/games'</St>{')'}</> : CHIPS[id]}{'\n'}</span>)}
              {done && <span className="el-in" style={{ display: 'inline-block' }}><Cm>{'}, []);'}</Cm></span>}
            </pre>
          </Col>
          <Col>
            <p className="flow-label">robo-games</p>
            <Win title="robo-games — localhost:5173" minH={110}>
              {!done && <p style={{ color: T.ink3, fontStyle: 'italic', margin: 0, fontFamily: 'Georgia, serif', fontSize: 13 }}>Kod tayyor bo'lganda katalog yuklanadi…</p>}
              {done && !loaded && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  <SkelCard /><SkelCard /><SkelCard />
                </div>
              )}
              {done && loaded && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  {LIST.map((g, i) => <div key={g.name} className="el-in" style={{ animationDelay: `${i * 0.15}s`, animationFillMode: 'backwards' }}><RoCard name={g.name} /></div>)}
                </div>
              )}
            </Win>
            {done && loaded && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Tartib muhim edi: so'rovsiz javob yo'q, tarjimasiz massiv yo'q, setGames'siz ekran yo'q. Siz naqshni <b>tushunib</b> yig'dingiz.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — DEBUGGING (AI kodida endpoint xatosi → 404) =====
const Screen14 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const LIST = GAMES.slice(0, 3);
  const [picked, setPicked] = useState(storedAnswer ? 'url' : null);
  const [fixed, setFixed] = useState(!!storedAnswer);
  const found = picked === 'url';
  const done = fixed;
  const pickUrl = () => { if (found) return; setPicked('url'); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Debugging" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : (found ? 'Endi tuzating' : 'Xatoni toping')} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">AI yordam beradi — siz esa <span className="italic" style={{ color: T.accent }}>tekshirasiz</span>.</h2></div>
        <Mentor>AI so'rov kodini bir zumda yozib berdi — naqsh to'g'ri. Lekin katalog <b style={{ color: T.ink }}>yuklanmayapti</b>: skeleton aylanaveryapti, konsolda <b style={{ color: T.ink }}>404</b>. Siz endi 404 nima deyishini bilasiz. Xato qaysi qatorda?</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="ai-card fade-up delay-2">
              <div className="ai-row"><span className="ai-badge">AI</span><span className="ai-bubble">So'rov kodini yozdim:</span></div>
              <div className="ai-code">
                <div className={`ai-line ${picked === 'effect' ? 'ok' : ''}`} onClick={() => { if (!found) setPicked('effect'); }}>{'useEffect(() => {'}</div>
                {!fixed ? (
                  <div className={`ai-line ${found ? 'bad' : ''}`} onClick={pickUrl}>{'  fetch('}<St>'https://robo-api.uz/gmaes'</St>{')'}</div>
                ) : (
                  <div className="ai-line ok el-in">{'  fetch('}<St>'https://robo-api.uz/games'</St>{')  '}<Cm>{'// tuzatildi!'}</Cm></div>
                )}
                <div className={`ai-line ${picked === 'json' ? 'ok' : ''}`} onClick={() => { if (!found) setPicked('json'); }}>{'    .then(res => res.json())'}</div>
                <div className={`ai-line ${picked === 'set' ? 'ok' : ''}`} onClick={() => { if (!found) setPicked('set'); }}>{'    .then(data => setGames(data));'}</div>
                <div className={`ai-line ${picked === 'end' ? 'ok' : ''}`} onClick={() => { if (!found) setPicked('end'); }}>{'}, []);'}</div>
              </div>
              {!found && <p className="ai-prompt">Konsoldagi 404 qaysi qator haqida gapiryapti? Bosing.</p>}
              {found && !fixed && <button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={() => setFixed(true)}>🔧 /games deb tuzatish</button>}
              {fixed && <p className="ai-prompt" style={{ color: T.success, fontStyle: 'normal', fontWeight: 600 }}>✓ Tuzatildi — so'rov to'g'ri eshikka ketyapti!</p>}
            </div>
          </Col>
          <Col>
            <p className="flow-label">Konsol va sayt</p>
            <div className="code-box" style={{ padding: '9px 13px' }}>
              {!fixed
                ? <TLine out={<span style={{ color: CODE.tag }}>❌ 404 Not Found — /gmaes</span>} />
                : <TLine out={<span className="el-in" style={{ display: 'inline-block', color: CODE.str }}>✓ 200 OK — /games, 3 ta o'yin keldi</span>} />}
            </div>
            <Win title="robo-games — localhost:5173" minH={104}>
              {!fixed
                ? <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}><SkelCard /><SkelCard /><SkelCard /></div>
                : <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>{LIST.map((g, i) => <div key={g.name} className="el-in" style={{ animationDelay: `${i * 0.15}s`, animationFillMode: 'backwards' }}><RoCard name={g.name} /></div>)}</div>}
            </Win>
            {!found && (
              (picked === 'effect' || picked === 'json' || picked === 'set' || picked === 'end')
                ? <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bu qator to'g'ri{picked === 'json' ? ' — tarjima joyida' : picked === 'set' ? " — state'ga yozish joyida" : ''}. Konsol nima dedi? <span className="mono">404 — /gmaes</span>. Manzilni <b>harfma-harf</b> o'qing.</p></div>
                : <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Skeleton tugamayapti — demak javob <b style={{ color: T.ink }}>hech qachon kelmagan</b>. Konsoldagi 404 sizga aniq manzilni aytib turibdi.</p></div>
            )}
            {found && !fixed && <div className="frame-warn fade-step"><p className="note-h" style={{ color: T.accent }}>✓ Topdingiz!</p><p className="body" style={{ margin: 0, color: T.ink }}><span className="mono">/gmaes</span> — harflar almashib ketgan! Server bunday eshikni tanimaydi, shuning uchun 404. Chapdagi tugma bilan tuzating →</p></div>}
            {fixed && (
              <div className="takeaway fade-step"><div className="ta-bulb">🛠️</div><p className="ta-h">404 ni o'qidingiz, manzilni tuzatdingiz!</p><p className="ta-sub">AI tez yozadi, siz tekshirib tuzatasiz — zo'r jamoa</p></div>
            )}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 15 — YAKUNIY (VS Code: fetch so'rovini yozish) =====
const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const LIST = GAMES.slice(0, 3);
  const [value, setValue] = useState(storedAnswer?.picked || '');
  const [passed, setPassed] = useState(!!storedAnswer?.correct);
  const [loaded, setLoaded] = useState(!!storedAnswer);
  const timer = useRef(null);
  const normQ = value.replace(/[‘’“”]/g, "'").replace(/"/g, "'");
  const norm = normQ.replace(/\s+/g, '');
  const valid = /^fetch\('https:\/\/robo-api\.uz\/games'\)$/.test(norm);
  const hasFetch = /fetch\s*\(/.test(normQ);
  const hasCapFetch = /Fetch\s*\(/.test(value);
  const hasUrl = /'https:\/\/robo-api\.uz\/games'/.test(norm);
  const noQuotes = /fetch\(\s*https/.test(norm);
  const hasTypo = /gmaes|gams\b|gmes/.test(norm);
  const hasClose = /\)\s*$/.test(value.trim());
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (valid && !passed) {
      setPassed(true);
      onAnswer(screen, { stage: 'final', screenIdx: screen, question: "useEffect ichida fetch('https://robo-api.uz/games') ni yozing", studentAnswer: value, correct: true, firstAttemptCorrect: true, solved: true, picked: value });
      timer.current = setTimeout(() => setLoaded(true), 1100);
    }
  }, [valid]);
  const Ln = ({ n, children }) => (
    <div className="vsc-line"><span className="vsc-ln">{n}</span><span style={{ whiteSpace: 'pre' }}>{children}</span></div>
  );
  return (
    <Stage eyebrow="Yakuniy · amaliy" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!passed} label={passed ? 'Davom etish' : "So'rovni yozing"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Oxirgi qadam: so'rovni <span className="italic" style={{ color: T.accent }}>o'zingiz</span> yuboring.</h2></div>
        <Mentor>VS Code'da <span className="mono">App.jsx</span> ochiq: naqsh tayyor — useState bor, .json() bor, setGames bor. Faqat <b style={{ color: T.ink }}>4-qator bo'sh: so'rovning o'zi yo'q!</b> Yozing: <b style={{ color: T.ink }}>fetch(</b> + <b style={{ color: T.ink }}>'https://robo-api.uz/games'</b> qo'shtirnoqda + <b style={{ color: T.ink }}>)</b>.</Mentor>
        <Zoomable>
        <div className="split split-wide">
          <Col>
            <div className="vsc fade-up delay-2">
              <div className="vsc-bar">
                <span className="vsc-tab on"><span style={{ color: '#61DAFB' }}>⚛</span> App.jsx <span style={{ color: '#6E7681', marginLeft: 4 }}>×</span></span>
                <span className="vsc-tab">GameCard.jsx</span>
              </div>
              <div className="vsc-body" style={{ fontSize: 'clamp(11px,1.35vw,12px)', lineHeight: 1.82 }}>
                <Ln n={1}><Jx>{'function'}</Jx><span style={{ color: '#DCDCAA' }}> App</span>{'() {'}</Ln>
                <Ln n={2}>{'  '}<Jx>{'const'}</Jx>{' [games, setGames] = useState([]);'}</Ln>
                <Ln n={3}>{'  useEffect(() => {'}</Ln>
                <div className="vsc-line">
                  <span className="vsc-ln">4</span>
                  <span style={{ whiteSpace: 'pre' }}>{'    '}</span>
                  <input className={`vsc-input ${valid ? 'ok' : ''}`} value={value} onChange={e => setValue(e.target.value)} placeholder="fetch('https://robo-api.uz/games')" spellCheck={false} autoCapitalize="off" autoCorrect="off" autoFocus style={{ fontSize: 'clamp(11px,1.35vw,12px)' }} />
                </div>
                <Ln n={5}>{'      .then(res => res.json())'}</Ln>
                <Ln n={6}>{'      .then(data => setGames(data));'}</Ln>
                <Ln n={7}>{'  }, []);'}</Ln>
                <Ln n={8}>{'  '}<Jx>{'return'}</Jx>{' ('}</Ln>
                <Ln n={9}>{'    '}<Jx>{'<div>'}</Jx></Ln>
                <Ln n={10}>{'      {games.map(g => '}<Jx>{'<GameCard '}</Jx><At>name</At>{'={g}'}<Jx>{' />'}</Jx>{')}'}</Ln>
                <Ln n={11}>{'    '}<Jx>{'</div>'}</Jx></Ln>
                <Ln n={12}>{'  );'}</Ln>
                <Ln n={13}>{'}'}</Ln>
              </div>
            </div>
            <div className="fade-up delay-2" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="tagpill" style={{ opacity: hasFetch ? 1 : 0.4 }}>{hasFetch ? '✓' : '1'} fetch( — buyruq</span>
              <span className="tagpill" style={{ opacity: hasUrl ? 1 : 0.4 }}>{hasUrl ? '✓' : '2'} manzil qo'shtirnoqda</span>
              <span className="tagpill" style={{ opacity: hasClose ? 1 : 0.4 }}>{hasClose ? '✓' : '3'} ) yopilishi</span>
            </div>
            {hasCapFetch && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Buyruqlar kichik harf bilan: <span className="mono">fetch</span> (Fetch emas).</p></div>}
            {noQuotes && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Manzil — matn: <b>qo'shtirnoq ichida</b> yozing: <span className="mono">'https://robo-api.uz/games'</span></p></div>}
            {hasTypo && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Endpoint harflarini tekshiring — bunday yozsangiz server <b>404</b> qaytaradi. To'g'risi: <span className="mono">/games</span></p></div>}
            {passed && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Mukammal! So'rov ketdi — javob kelyapti. Saytingiz endi serverdan ma'lumot oladi.</p></div>}
          </Col>
          <Col>
            <p className="flow-label">natija — localhost:5173</p>
            <Win title="robo-games — localhost:5173" minH={130}>
              {!passed && <p style={{ fontFamily: 'Georgia, serif', color: T.ink3, fontStyle: 'italic', margin: 0, textAlign: 'center', lineHeight: 1.5 }}>4-qator yozilmaguncha so'rov ketmaydi — katalog bo'sh: <span className="mono" style={{ fontStyle: 'normal' }}>fetch(</span> + <span className="mono" style={{ fontStyle: 'normal' }}>'manzil'</span> + <span className="mono" style={{ fontStyle: 'normal' }}>)</span></p>}
              {passed && !loaded && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  <SkelCard /><SkelCard /><SkelCard />
                </div>
              )}
              {passed && loaded && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 9 }}>
                  {LIST.map((g, i) => <div key={g.name} className="el-in" style={{ animationDelay: `${i * 0.15}s`, animationFillMode: 'backwards' }}><RoCard name={g.name} /></div>)}
                </div>
              )}
            </Win>
            {passed && loaded && <span className="tagpill fade-step" style={{ color: T.success }}>✓ so'rov → skeleton → javob → katalog</span>}
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
    "Ma'lumot serverda yashaydi — manzili bor: robo-api.uz/games",
    "fetch — so'rov: shu manzilga borib, olib kel (GET)",
    "Javob JSON matn — .json() uni massivga aylantiradi",
    "Kutish payti — skeleton: \"ma'lumot yo'lda\" signali",
    "To'liq naqsh: useEffect + fetch + .json() + setGames"
  ];
  const HOMEWORK = [
    { b: 'Jonli katalog', t: "— robo-games loyihangizga agent bilan haqiqiy API ulang: \"o'yinlar ro'yxatini serverdan fetch bilan yukla\" deb buyuring" },
    { b: 'Skeleton', t: "— yuklanish paytida skeleton kartochkalar chiqaring" },
    { b: '404 detektivi', t: "— manzilni ataylab xato yozib, konsoldagi 404 ni toping va tuzating" }
  ];
  const GLOSSARY = [
    { b: 'Server', t: "— ma'lumot markazi: bitta joy, hamma qurilma uchun" },
    { b: 'fetch', t: "— so'rov buyrug'i: borib olib kel" },
    { b: 'GET', t: "— so'rov turi: faqat olish" },
    { b: 'Endpoint', t: "— server eshigi: /games, /top, /new" },
    { b: 'JSON', t: "— kompyuterlarning umumiy ma'lumot tili" },
    { b: '.json()', t: "— javobni haqiqiy massivga aylantirish" },
    { b: 'Skeleton', t: "— yuklanayotgan kartochkaning kulrang sharpasi" },
    { b: '404', t: "— server javobi: bunday manzil topilmadi" }
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
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">✓</span> Dars tugadi</span><h2 className="title h-title fade-up d1">Katalogingiz endi <span className="italic" style={{ color: T.accent }}>jonli</span>.</h2><p className="body h-sub fade-up d2">{PASSED ? "Tabriklaymiz! Saytingiz endi serverdan ma'lumot oladi — xuddi haqiqiy Roblox kabi. Siz frontend bilan serverni bog'ladingiz." : "Yaxshi harakat! fetch naqshini mustahkamlash uchun bir-ikki ekranni qayta ko'ring."}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span className="tick" style={{ width: 16, height: 16, borderRadius: '50%', background: T.success, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck">✓</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>📝 Uyga vazifa</div><p className="body" style={{ margin: '0 0 10px', color: T.ink }}>Antigravity bilan o'z loyihangizda sinang:</p><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">Keyingi darsda kuch yana oshadi: serverdan faqat olish emas — unga YUBORISH ham o'rganamiz. O'z o'yiningizni katalogga qo'shasiz! 🚀</p></div>
        </div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">💡 Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT — ({ lang, onFinished })
export default function ReactApiGetLesson({ lang: langProp, onFinished }) {
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
        .rocard { border-radius: 12px; background: #fff; box-shadow: 0 4px 14px -4px rgba(0,0,0,0.16); overflow: hidden; border: 1px solid rgba(0,0,0,0.05); transition: transform 0.15s, box-shadow 0.15s; }
        .rocard:hover { transform: translateY(-2px); box-shadow: 0 8px 20px -5px rgba(0,0,0,0.22); }
        .rocard.tappable { cursor: pointer; }
        .rothumb { height: 58px; display: flex; align-items: center; justify-content: center; position: relative; }
        .topbadge { position: absolute; top: 4px; left: 6px; font-family: 'Manrope', sans-serif; font-weight: 800; font-size: 8.5px; color: #fff; background: rgba(14,14,16,0.72); padding: 2px 7px; border-radius: 99px; letter-spacing: 0.04em; }
        .robody { padding: 7px 10px 9px; }
        .roname { font-family: 'Manrope', sans-serif; font-weight: 800; font-size: 12px; color: ${T.ink}; margin: 0 0 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .rostats { display: flex; align-items: center; gap: 8px; font-family: 'Manrope', sans-serif; font-size: 10.5px; color: ${T.ink3}; font-weight: 600; }
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


        /* === REACT-5 DARS CSS (API GET) === */
        @media (min-width: 761px) { .split-wide { grid-template-columns: minmax(0,1.18fr) minmax(0,0.82fr); } }
        @keyframes shimmer { 0% { background-position: 160% 0; } 100% { background-position: -160% 0; } }
        .skel { background: linear-gradient(100deg, #ECE9E2 38%, #F8F6F1 50%, #ECE9E2 62%); background-size: 220% 100%; animation: shimmer 1.15s linear infinite; }
        @keyframes fly-in { 0% { opacity: 0; transform: translate(-50%, -14px) scale(0.7); } 35% { opacity: 1; } 100% { opacity: 0; transform: translate(-50%, 40px) scale(1); } }
        .fly-in { transform: translateX(-50%); animation: fly-in 0.95s ease-in forwards; z-index: 3; }

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
