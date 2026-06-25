import React, { useState, useEffect, useRef, createContext, useContext, useCallback } from 'react';
import mentorImg from '../../assets/common/mentor.png';

// ============================================================
// REACT MODULI · 3-DARS — STATE VA EFFECT — PLATFORM STANDARD v16 (AUDIOSIZ)
// Mavzu: oddiy o'zgaruvchi UI'ni yangilamaydi (muammo), useState anatomiyasi
//        ([qiymat, setQiymat], boshlang'ich qiymat), set → qayta chizish sikli,
//        bir nechta state, useEffect ([] = mount, [dep] = kuzatish),
//        useState + useEffect birga (document.title), lifecycle: Mount/Update/Unmount.
// Misol sayt: robo-games (2-darsdan davom) — GameCard'ga jonli 👍 like qo'shiladi.
// Lifecycle analogiyasi: Roblox o'yinchisi — serverga kirdi (Mount), o'ynayapti (Update),
//        chiqib ketdi (Unmount).
// MUHIM: kelgusi darslar ro'yxati o'quvchiga AYTILMAYDI — faqat yakunda keyingi dars teaser.
// AUDIOSIZ: ovoz (TTS) yo'q — platforma qarori (JsLoops/JsFunctions kabi).
// Yakuniy ekran (s15): VS Code muhiti — GameCard.jsx, useState qatorini qo'lda yozish.
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

const LESSON_META = { lessonId: 'react-state-effect-03-v16', lessonTitle: { uz: 'State va Effect: useState + useEffect', ru: 'State и Effect: useState + useEffect' } };
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
        <img src={mentorImg} alt="" />
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
const Cm = ({ children }) => <span style={{ color: CODE.comment, fontStyle: 'italic' }}>{children}</span>;
const Win = ({ title, children, minH, hotTitle }) => (
  <div className="bp-window"><div className="bp-bar"><span className="bb-dots"><i /><i /><i /></span><span className="bp-title" style={hotTitle ? { color: T.accent, fontWeight: 700 } : undefined}>{title}</span></div><div className="bp-body" style={{ minHeight: minH, position: 'relative' }}>{children}</div></div>
);
// Roblox uslubidagi o'yinlar (2-darsdan tanish)
const GAMES = [
  { name: 'Adopt Me!', emoji: '🐾', likes: 92, players: '402K', bg: 'linear-gradient(135deg,#FF9DBF,#C44569)' },
  { name: 'Blox Fruits', emoji: '🍇', likes: 95, players: '750K', bg: 'linear-gradient(135deg,#7EA6F4,#2E4A9E)' },
  { name: 'Brookhaven', emoji: '🏠', likes: 89, players: '510K', bg: 'linear-gradient(135deg,#8FD3A8,#2E7A4E)' },
  { name: 'Tower of Hell', emoji: '🗼', likes: 84, players: '120K', bg: 'linear-gradient(135deg,#F4B26A,#C9622E)' }
];
const gameByName = (nm) => GAMES.find(g => g.name.toLowerCase() === String(nm).toLowerCase());
// O'yin kartochkasi. likes/onLike berilsa — jonli sanagich rejimi (state darsining yuragi);
// berilmasa — statik 👍 % (2-darsdagi ko'rinish). starred/onStar — ⭐ sevimlilar.
const RoCard = ({ name, emoji, likes, onLike, starred, onStar }) => {
  const g = gameByName(name);
  const bg = g ? g.bg : 'linear-gradient(135deg,#8E9BB5,#4A5670)';
  const em = emoji || (g ? g.emoji : '🎮');
  const pct = g ? g.likes : 88;
  return (
    <div className="rocard el-in">
      <div className="rothumb" style={{ background: bg }}>
        <span className="rothumb-icon">{em}</span>
        {onStar
          ? <button className={`rostar-btn ${starred ? 'on' : ''}`} onClick={onStar} title="Sevimlilarga qo'shish" aria-label="Sevimlilarga qo'shish">{starred ? '⭐' : '☆'}</button>
          : (starred && <span className="rostar el-in">⭐</span>)}
        <span className="rothumb-play">▶</span>
      </div>
      <div className="robar"><span className="robar-fill" style={{ width: `${pct}%` }} /></div>
      <div className="robody">
        <p className="roname">{name}</p>
        <div className="rostats">
          {onLike
            ? <button className="rolike-btn" onClick={onLike} title="Like bosib ko'ring"><span key={likes} className="hpop">👍</span> <span className="rolike-num">{likes}</span></button>
            : <span className="rolike-static">👍 {pct}%</span>}
          {g && <span className="roplayers">👥 {g.players}</span>}
        </div>
      </div>
    </div>
  );
};
// Terminal/konsol qatori
const TLine = ({ cmd, out, dim }) => (
  <div className="el-in" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 'clamp(11.5px,1.4vw,13px)', lineHeight: 1.7, color: dim ? CODE.comment : CODE.text }}>
    {cmd ? <><span style={{ color: CODE.str }}>$</span> <span style={{ color: CODE.text }}>{cmd}</span></> : out}
  </div>
);

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

// ===== SCREEN 0 — HOOK (oddiy o'zgaruvchi vs state: qaysi tugma tirik?) =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [deadClicks, setDeadClicks] = useState(storedAnswer ? 3 : 0); // chap karta: xotirada o'sadi, ekranda 0
  const [liveLikes, setLiveLikes] = useState(storedAnswer ? 1 : 0);
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const tried = deadClicks >= 2 && liveLikes >= 1;
  const OPTS = [
    { id: 'a', label: 'Chapdagi tugma buzilgan — kod xato' },
    { id: 'b', label: "O'zgaruvchi o'zgardi, lekin React buni bilmadi — qayta chizmadi" },
    { id: 'c', label: 'Internet sekin ishlayapti' }
  ];
  const pick = (v) => { if (picked !== null || !tried) return; setPicked(v); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: true }); };
  return (
    <Stage eyebrow="Kirish" screen={screen} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 780 }}>Bir xil ikki tugma — nega <span className="italic" style={{ color: T.accent }}>biri ishlamaydi</span>?</h1>
        <Mentor>O'tgan darsda kartochka yasadik — endi har biriga <b style={{ color: T.ink }}>👍 like tugmasi</b> qo'shdik. Kartochkalar bir xil ko'rinadi, lekin <b style={{ color: T.ink }}>1-versiyaning like'i</b> sindirilgan. Ikkalasida ham 👍 ni bosing — <b style={{ color: T.ink }}>chap (1-versiya)</b> son qotib qolishini kuzating.</Mentor>
        <Zoomable>
        <Split>
          <Col>
            <div className="fade-up delay-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <p className="flow-label" style={{ marginBottom: 7 }}>1-versiya</p>
                <RoCard name="Adopt Me!" likes={0} onLike={() => setDeadClicks(c => c + 1)} />
                <p className="mono small" style={{ margin: '7px 0 0', color: deadClicks > 0 ? T.accent : T.ink3 }}>{deadClicks > 0 ? `xotirada: likes = ${deadClicks}` : 'bosib ko\'ring ↑'}</p>
                {deadClicks > 0 && <p className="mono small" style={{ margin: 0, color: T.ink3 }}>ekranda esa: 👍 0 — qotib qoldi!</p>}
              </div>
              <div>
                <p className="flow-label" style={{ marginBottom: 7 }}>2-versiya</p>
                <RoCard name="Adopt Me!" likes={liveLikes} onLike={() => setLiveLikes(c => c + 1)} />
                <p className="mono small" style={{ margin: '7px 0 0', color: liveLikes > 0 ? T.success : T.ink3 }}>{liveLikes > 0 ? '✓ ekran darhol yangilandi!' : 'bosib ko\'ring ↑'}</p>
              </div>
            </div>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Sizningcha, chapdagisiga nima bo'ldi?</p>
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
            {!tried && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>Avval ikkala kartochkada 👍 bosing ←</p>}
            {picked !== null && <p className="hook-ack fade-step">Topdingiz! Kod xato emas — son <b>xotirada o'sdi</b>, lekin React bundan <b>bexabar qoldi</b>, shuning uchun ekranni qayta chizmadi. 2-versiyada maxsus xotira ishlatilgan — nomi <b>state</b>. Bugun shuni o'rganamiz.</p>}
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
    { text: "Muammo: oddiy o'zgaruvchi tirik emas", tag: 'let likes' },
    { text: 'useState — komponent xotirasi', tag: '[likes, setLikes]' },
    { text: "set → ekran qayta chiziladi", tag: 'setLikes(likes + 1)' },
    { text: "useEffect — komponent tug'ilganda", tag: 'useEffect(…, [])' },
    { text: "Hayot yo'li", tag: 'Mount · Update · Unmount' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const [likes, setLikes] = useState(0);
  const PreviewBlock = (
    <Col>
      <p className="flow-label">Dars oxirida — sizning natijangiz</p>
      <Win title="robo-games — localhost:5173" minH={100}>
        <div style={{ maxWidth: 165 }}><RoCard name="Blox Fruits" likes={likes} onLike={() => setLikes(l => l + 1)} /></div>
      </Win>
      <pre className="code-box" style={{ padding: '10px 14px' }}><Jx>{'const'}</Jx>{' ['}<At>likes</At>{', '}<At>setLikes</At>{'] = '}<Jx>{'useState'}</Jx>{'('}<St>0</St>{')'}</pre>
      <p className="mono small" style={{ color: T.accent, margin: 0 }}>→ mana shu qatorni dars oxirida to'liq o'zingiz yozasiz</p>
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
          <h2 className="title h-title fade-up">Kartochkadagi <span className="italic" style={{ color: T.accent }}>like qanday jonlanadi</span>?</h2>
        </div>
        <Mentor>Va'da beraman: dars oxirida <b style={{ color: T.ink }}>ishlaydigan like tugmasini</b> o'zingiz yozasiz. Buning kaliti — <b style={{ color: T.ink }}>state</b> (komponent xotirasi) va <b style={{ color: T.ink }}>effect</b>. Yuqoridagi 👍 ni bosib ko'ring — bugun aynan shuni qurasiz.</Mentor>
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

// ===== SCREEN 2 — MUAMMO (oddiy o'zgaruvchi React'ga ko'rinmaydi) =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [clicks, setClicks] = useState(storedAnswer ? 3 : 0);
  const done = clicks >= 3;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Muammo" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `👍 ni 3 marta bosing (${clicks}/3)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Oddiy o'zgaruvchi nega <span className="italic" style={{ color: T.accent }}>ekranga yetib bormaydi</span>?</h2></div>
        <Mentor>Mana 1-versiyaning kodi: oddiy <span className="mono">let likes</span>. Tugmani bosing va <b style={{ color: T.ink }}>konsolga qarang</b> — son rostdan o'syapti! Lekin React'ga hech kim <b style={{ color: T.ink }}>"qayta chiz"</b> demayapti. Shuning uchun ekran eski holatda qotib qolgan.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <pre className="code-box fade-up delay-1">
              <Jx>{'let'}</Jx>{' likes = '}<St>0</St>{';  '}<Cm>{'// oddiy o’zgaruvchi'}</Cm>{'\n\n'}
              <Jx>{'<button'}</Jx> <At>onClick</At>{'={() => {'}{'\n'}
              {'  likes = likes + '}<St>1</St>{';'}{'\n'}
              {'  console.log(likes);  '}<Cm>{'// o’syapti!'}</Cm>{'\n'}
              {'}}'}<Jx>{'>'}</Jx>{'👍 {likes}'}<Jx>{'</button>'}</Jx>
            </pre>
            <p className="flow-label" style={{ margin: 0 }}>Konsol</p>
            <div className="code-box" style={{ padding: '9px 13px', minHeight: 64 }}>
              {clicks === 0
                ? <TLine out={<span style={{ color: CODE.comment }}>hozircha bo'sh — 👍 ni bosing</span>} />
                : Array.from({ length: clicks }, (_, i) => <TLine key={i} out={<span style={{ color: CODE.str }}>likes = {i + 1} ✓ (xotirada o'sdi)</span>} />)}
            </div>
          </Col>
          <Col>
            <p className="flow-label">Ekranda — 👍 ni bosing</p>
            <div style={{ maxWidth: 180 }}><RoCard name="Adopt Me!" likes={0} onLike={() => setClicks(c => Math.min(c + 1, 5))} /></div>
            <div className="gap-viz fade-up delay-1">
              <div className="gap-box mem">
                <span className="gap-lbl">📦 Xotira (let likes)</span>
                <span key={clicks} className={clicks > 0 ? 'gap-num pop' : 'gap-num'}>{clicks}</span>
              </div>
              <span className="gap-vs">≠</span>
              <div className="gap-box scr">
                <span className="gap-lbl">🖥 Ekranda</span>
                <span className="gap-num frozen">0 <span className="gap-lock">🔒</span></span>
              </div>
            </div>
            {clicks > 0 && !done && <p className="mono small" style={{ margin: 0, color: T.accent }}>↑ xotira o'syapti, ekran esa qotgan…</p>}
            {done && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Ko'rdingizmi? Xotirada <b>likes = {clicks}</b>, ekranda esa <b>0</b>. Oddiy o'zgaruvchi o'zgarganini React <b>sezmaydi</b> — unga maxsus xotira kerak. Keyingi ekranda tanishamiz!</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — USESTATE ANATOMIYASI =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const PARTS = {
    val: { word: 'likes — joriy qiymat', info: <>Xotiradagi hozirgi qiymat. Uni JSX ichida o'qiysiz: <span className="mono">{'👍 {likes}'}</span>. Faqat <b>o'qish</b> uchun — to'g'ridan-to'g'ri o'zgartirib bo'lmaydi!</> },
    set: { word: 'setLikes — yangilovchi', info: <>Qiymatni o'zgartiradigan <b>yagona to'g'ri yo'l</b>. <span className="mono">setLikes(5)</span> deysiz — React xotirani yangilaydi VA ekranni qayta chizadi. Mana 1-versiyada yetishmagan narsa!</> },
    init: { word: 'useState(0) — boshlang\'ich', info: <>Qavs ichidagi qiymat — xotiraning <b>boshlang'ich holati</b>. <span className="mono">useState(0)</span> → birinchi ko'rinishda 👍 0. <span className="mono">useState(100)</span> yozsangiz — 100 dan boshlanadi.</> }
  };
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(storedAnswer ? new Set(['val', 'set', 'init']) : new Set());
  const done = seen.size >= 3;
  const tap = (k) => { setActive(k); setSeen(prev => { const s = new Set(prev); s.add(k); return s; }); };
  const COL = { val: T.blue, set: T.accent, init: T.success };
  const tokCls = (k) => `anat-tok tok-${k} ${active === k ? 'on' : ''} ${seen.has(k) ? 'seen' : ''}`;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="useState" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/3 qism o'rganildi`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bu xotira qatori <span className="italic" style={{ color: T.accent }}>nimalardan iborat</span>?</h2></div>
        <Mentor>Mana React'ning maxsus xotirasi — <b style={{ color: T.ink }}>useState</b>. Bitta qator — uch qism: <b style={{ color: T.blue }}>joriy qiymat</b>, <b style={{ color: T.accent }}>yangilovchi funksiya</b> va <b style={{ color: T.success }}>boshlang'ich qiymat</b>. Koddagi rangli qismlarni bosib o'rganing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <pre className="code-box fade-up delay-1" style={{ lineHeight: 2.4, fontSize: 'clamp(12.5px,1.6vw,14.5px)' }}>
              <Jx>{'const'}</Jx>{' ['}<span className={tokCls('val')} onClick={() => tap('val')}><At>likes</At></span>{', '}<span className={tokCls('set')} onClick={() => tap('set')}><At>setLikes</At></span>{'] ='}{'\n'}
              {'      '}<span className={tokCls('init')} onClick={() => tap('init')}><Jx>{'useState'}</Jx>{'('}<St>0</St>{')'}</span>{';'}
            </pre>
            {!active && <p className="small fade-up delay-2" style={{ margin: 0, color: T.ink3, fontStyle: 'italic' }}>👆 Yuqoridagi rangli qismlardan birini bosing</p>}
            <div className="hint fade-up delay-2"><p className="small" style={{ margin: 0, color: T.ink2 }}>O'qilishi: "menga <b style={{ color: T.blue }}>likes</b> degan xotira ber, boshlang'ichi <b style={{ color: T.success }}>0</b>, o'zgartirish uchun <b style={{ color: T.accent }}>setLikes</b> beraman".</p></div>
          </Col>
          <Col>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <p className="flow-label" style={{ margin: 0 }}>Qismlar</p>
              <span className="small mono" style={{ color: done ? T.success : T.ink3 }}>{seen.size} / 3 topildi</span>
            </div>
            {active ? (
              <div className="sk-info" key={active} style={{ boxShadow: `0 8px 20px -6px rgba(${T.shadowBase},0.16), inset 3px 0 0 ${COL[active]}` }}>
                <span className="sk-tagbig"><span className="sk-wordbadge" style={{ color: COL[active], background: COL[active] + '22' }}>{PARTS[active].word}</span></span>
                <p className="body" style={{ color: T.ink, margin: '11px 0 0' }}>{PARTS[active].info}</p>
              </div>
            ) : (
              <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Koddan bir qismni bosing</p></div>
            )}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Formula: <span className="mono">const [qiymat, setQiymat] = useState(boshlang'ich)</span>. Juftlik nomi erkin — <span className="mono">[son, setSon]</span> ham bo'laveradi.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 (useState nima beradi?) =====
const Screen4 = (props) => (
  <QuestionScreen {...props} idx={4} scope="module-mikro" eyebrow="Mashq · 1-savol"
    questionText="useState(0) nima beradi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}><span className="mono" style={{ color: T.accent }}>useState(0)</span> nima beradi?</h2></>}
    options={['Faqat 0 sonini', "Juftlik: joriy qiymat va uni yangilovchi funksiya", 'Yangi komponent', 'CSS klass']} correctIdx={1}
    explainCorrect="To'g'ri! useState juftlik qaytaradi: [likes, setLikes] — joriy qiymat va uni yangilovchi funksiya. 0 esa — boshlang'ich qiymat."
    explainWrong={{
      0: "Yo'q — 0 faqat boshlang'ich qiymat. useState juftlik beradi: qiymat va yangilovchi funksiya.",
      2: "Yo'q — komponent yaratmaydi. useState komponent ICHIDA xotira yaratadi.",
      3: "Yo'q — CSS'ga aloqasi yo'q. useState — xotira: [qiymat, yangilovchi].",
      default: "useState — juftlik: [joriy qiymat, yangilovchi funksiya]."
    }} />
);

// ===== SCREEN 5 — SET → QAYTA CHIZISH SIKLI =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [phase, setPhase] = useState(storedAnswer ? 3 : 0);
  const [likes, setLikes] = useState(storedAnswer ? 1 : 0);
  const [running, setRunning] = useState(false);
  const timer = useRef(null);
  const done = phase >= 3;
  useEffect(() => () => clearTimeout(timer.current), []);
  const run = () => {
    if (running) return;
    clearTimeout(timer.current); setRunning(true); setPhase(1);
    timer.current = setTimeout(() => {
      setPhase(2);
      timer.current = setTimeout(() => { setPhase(3); setLikes(l => l + 1); setRunning(false); }, 1000);
    }, 1000);
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const STEPS = ["setLikes(likes + 1) chaqirildi", "React xotirani yangiladi", "Komponent QAYTA CHIZILDI — ekranda yangi son"];
  return (
    <Stage eyebrow="Qayta chizish" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Siklni kuzating'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">setLikes bosilganda ichkarida <span className="italic" style={{ color: T.accent }}>nima yuz beradi</span>?</h2></div>
        <Mentor><span className="mono">setLikes</span> — oddiy funksiya emas, u <b style={{ color: T.ink }}>React'ga xabar beradi</b>: "xotira o'zgardi — qayta chiz!" Tugmani bosib, 3 qadamlik siklni kuzating.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <button className="btn fade-up delay-1" style={{ alignSelf: 'flex-start' }} onClick={run} disabled={running}>{running ? 'Ishlayapti…' : (done ? '👍 Yana bosing' : '👍 Like bosildi — kuzating')}</button>
            <div className="sflow fade-up delay-2">
              {STEPS.map((s, i) => {
                const reached = phase > i;
                const now = running && phase === i + 1;
                return (
                  <React.Fragment key={i}>
                    {i > 0 && <span className={`sflow-arrow ${phase > i ? 'on' : ''}`}>↓</span>}
                    <div className={`sflow-step ${reached ? 'on' : ''} ${now ? 'now' : ''}`}>
                      <span className="sflow-dot">{reached ? '✓' : i + 1}</span>
                      <span className="sflow-txt">{s}</span>
                    </div>
                  </React.Fragment>
                );
              })}
            </div>
          </Col>
          <Col>
            <p className="flow-label">📦 Xotira (state)</p>
            <div className="code-box" style={{ padding: '11px 14px' }}>
              <TLine out={<span>likes: <span key={phase >= 2 ? 'new' : 'old'} className={phase >= 2 ? 'mem-pop' : undefined} style={{ color: CODE.str, fontWeight: 700, display: 'inline-block', fontSize: 15 }}>{phase >= 2 ? likes + (phase >= 3 ? 0 : 1) : likes}</span>{phase === 2 && <span style={{ color: CODE.attr }}> ← xotira yangilandi!</span>}</span>} />
            </div>
            <p className="flow-label" style={{ marginTop: 2 }}>🖥 Ekranda</p>
            <div className={`render-wrap ${phase === 3 ? 'flash' : ''}`} style={{ maxWidth: 180 }}>
              <RoCard name="Blox Fruits" likes={likes} onLike={run} />
              {phase === 3 && <span className="render-badge fade-step">🔄 qayta chizildi!</span>}
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Sikl: <b>set chaqirildi → xotira yangilandi → qayta chizildi</b>. Har 👍 bosilganda shu uchlik aylanadi. Mana React'ning tirikligi!</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 5b — TEST 2 (qanday yangilanadi?) =====
const Screen5b = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Tekshiruv"
    questionText="Ekranda yangi qiymat ko'rinishi uchun nima qilamiz?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Mustahkamlash</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Ekranda yangi qiymat ko'rinishi uchun <span className="italic" style={{ color: T.accent }}>nima qilamiz</span>?</h2></>}
    options={["likes = likes + 1 deb to'g'ridan-to'g'ri yozamiz", 'Sahifani F5 bilan yangilaymiz', 'setLikes(likes + 1) chaqiramiz — React qolganini o\'zi qiladi', "Brauzerni qayta o'rnatamiz"]} correctIdx={2}
    explainCorrect="To'g'ri! Faqat setLikes orqali — shunda React xotirani yangilaydi VA komponentni qayta chizadi. To'g'ridan-to'g'ri o'zgartirish 1-versiyadagi 'qotib qolgan' tugma edi."
    explainWrong={{
      0: "Esingizdami 1-versiya? Xotirada o'sdi, ekran qotib qoldi. To'g'ridan-to'g'ri o'zgartirishni React sezmaydi.",
      1: "F5 butun sahifani qayta yuklaydi — eski saytlar usuli. React'da setLikes yetadi: faqat kerakli joy yangilanadi.",
      3: "Yo'q — brauzerda muammo yo'q. setLikes chaqirilsa hammasi ishlaydi.",
      default: "Faqat setLikes(yangi qiymat) — React qayta chizishni o'zi bajaradi."
    }} />
);

// ===== SCREEN 6 — IKKINCHI STATE (⭐ sevimlilar) =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [likes, setLikes] = useState(storedAnswer ? 1 : 0);
  const [starred, setStarred] = useState(!!storedAnswer);
  const [starTouched, setStarTouched] = useState(!!storedAnswer);
  const done = likes >= 1 && starTouched;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Ikkinchi xotira" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ham sinang'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bitta komponentda <span className="italic" style={{ color: T.accent }}>nechta xotira</span> bo'la oladi?</h2></div>
        <Mentor>Istalgancha! Kartochkaga <b style={{ color: T.ink }}>ikkinchi state</b> qo'shdik: ⭐ sevimlilar (kartochka ustidagi yulduzchani bosing). Har <span className="mono">useState</span> — <b style={{ color: T.ink }}>alohida quti</b>, ular bir-biriga xalaqit bermaydi. Ikkala tugmani ham bosib sinang.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <pre className="code-box fade-up delay-1">
              <Cm>{'// ikkita mustaqil xotira:'}</Cm>{'\n'}
              <Jx>{'const'}</Jx>{' ['}<At>likes</At>{', '}<At>setLikes</At>{'] = '}<Jx>{'useState'}</Jx>{'('}<St>0</St>{');'}{'\n'}
              <Jx>{'const'}</Jx>{' ['}<At>starred</At>{', '}<At>setStarred</At>{'] = '}<Jx>{'useState'}</Jx>{'('}<St>false</St>{');'}
            </pre>
            <div className="fade-up delay-2" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="tagpill" style={{ opacity: likes >= 1 ? 1 : 0.45, color: likes >= 1 ? T.success : T.ink }}>{likes >= 1 ? '✓' : '○'} likes: {likes}</span>
              <span className="tagpill" style={{ opacity: starTouched ? 1 : 0.45, color: starTouched ? T.success : T.ink }}>{starTouched ? '✓' : '○'} starred: {String(starred)}</span>
            </div>
          </Col>
          <Col>
            <p className="flow-label">👍 like va ⭐ yulduzni bosing</p>
            <div style={{ maxWidth: 188 }}><RoCard name="Brookhaven" likes={likes} onLike={() => setLikes(l => l + 1)} starred={starred} onStar={() => { setStarred(s => !s); setStarTouched(true); }} /></div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>👍 bosganda ⭐ o'zgarmadi — har state <b>mustaqil quti</b>. <span className="mono">false/true</span> ham xotira bo'la oladi: son, matn, belgi — hammasi.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — USEEFFECT KIRISH (mount) =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [mounted, setMounted] = useState(!!storedAnswer);
  const done = mounted;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="useEffect" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Kartochkani qo\'shing'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Kartochka ekranga chiqishi bilan <span className="italic" style={{ color: T.accent }}>"Salom!" deyishi</span> mumkinmi?</h2></div>
        <Mentor>Mumkin! Buning uchun <b style={{ color: T.ink }}>useEffect</b> bor. Komponentning ekranga birinchi chiqishi dasturchilar tilida <b style={{ color: T.ink }}>tug'ilish (mount)</b> deyiladi — useEffect ichidagi ish xuddi shu paytda bajariladi. <span className="mono">[]</span> bo'sh massiv = "<b style={{ color: T.ink }}>faqat bir marta</b>". Kartochkani sahifaga qo'shib, konsolni kuzating.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <pre className="code-box fade-up delay-1">
              <Jx>{'useEffect'}</Jx>{'(() => {'}{'\n'}
              {'  console.log('}<St>"Salom! Men ekranga chiqdim"</St>{');'}{'\n'}
              {'}, '}<At>[]</At>{');  '}<Cm>{'// [] = faqat bir marta'}</Cm>
            </pre>
            {!mounted && <button className="btn fade-up delay-2" style={{ alignSelf: 'flex-start' }} onClick={() => setMounted(true)}>+ Kartochkani sahifaga qo'shish</button>}
            <p className="flow-label" style={{ margin: 0 }}>Konsol</p>
            <div className="code-box" style={{ padding: '9px 13px', minHeight: 46 }}>
              {mounted
                ? <TLine out={<span style={{ color: CODE.str }}>✓ Salom! Men ekranga chiqdim</span>} />
                : <TLine out={<span style={{ color: CODE.comment }}>kutilmoqda…</span>} />}
            </div>
          </Col>
          <Col>
            <p className="flow-label">localhost:5173</p>
            <Win title="robo-games — localhost:5173" minH={110}>
              {mounted
                ? <div style={{ maxWidth: 165 }}><RoCard name="Tower of Hell" /></div>
                : <p style={{ color: T.ink3, fontStyle: 'italic', margin: 0, fontFamily: 'Georgia, serif', fontSize: 13 }}>Sahifa bo'sh — kartochka hali qo'shilmagan…</p>}
            </Win>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Kartochka ekranga chiqdi (tug'ildi) → effect <b>bir marta</b> ishladi va salom yozdi. E'tibor bering: 👍 bosilsa effect <b>qayta ishlamaydi</b> — <span className="mono">[]</span> shuni anglatadi.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — USEEFFECT + STATE BIRGA ([likes] kuzatuv) =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [likes, setLikes] = useState(storedAnswer ? 3 : 0);
  const done = likes >= 3;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Effect + State" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `👍 ni 3 marta bosing (${likes}/3)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Like soni <span className="italic" style={{ color: T.accent }}>tab sarlavhasiga</span> chiqsinmi?</h2></div>
        <Mentor>Eng kuchli juftlik! <span className="mono">[]</span> o'rniga <span className="mono">[likes]</span> yozsak, effect <b style={{ color: T.ink }}>likes'ni kuzatadi</b>: u o'zgargan sari qayta ishlaydi. Misol: like soni brauzer tab sarlavhasiga chiqsin. 👍 bosing va <b style={{ color: T.ink }}>tepadagi tab sarlavhasiga</b> qarang!</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <pre className="code-box fade-up delay-1">
              <Jx>{'const'}</Jx>{' ['}<At>likes</At>{', '}<At>setLikes</At>{'] = '}<Jx>{'useState'}</Jx>{'('}<St>0</St>{');'}{'\n\n'}
              <Jx>{'useEffect'}</Jx>{'(() => {'}{'\n'}
              {'  document.title = '}<St>{'`(${likes}) robo-games`'}</St>{';'}{'\n'}
              {'}, '}<At>[likes]</At>{');  '}<Cm>{'// likes o’zgarsa — qayta ishla'}</Cm>
            </pre>
            <div className="hint fade-up delay-2"><p className="small" style={{ margin: 0, color: T.ink2 }}><span className="mono">[]</span> — faqat tug'ilganda · <span className="mono">[likes]</span> — likes har o'zgarganda · ikkalasi ham useEffect'ning "qachon ishlash" sozlamasi.</p></div>
          </Col>
          <Col>
            <p className="flow-label">📑 Brauzer tab sarlavhasi</p>
            <div className="tab-preview fade-up delay-1">
              <span className="tab-chip"><span className="tab-fav">⚛</span><span key={likes} className={likes > 0 ? 'tab-num pop' : 'tab-num'} style={{ color: likes > 0 ? T.accent : T.ink3 }}>({likes})</span> robo-games</span>
              {likes > 0 && <span className="tab-cue fade-step">← useEffect yangiladi</span>}
            </div>
            <Win title={`(${likes}) robo-games — localhost:5173`} hotTitle={likes > 0} minH={100}>
              <div style={{ maxWidth: 185 }}><RoCard name="Adopt Me!" likes={likes} onLike={() => setLikes(l => l + 1)} /></div>
            </Win>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana <b>useState + useEffect birga</b>: state o'zgardi → ekran qayta chizildi → effect ham ishladi → tab sarlavhasi yangilandi. Ma'lumot butun interfeysni boshqaryapti!</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 9 — TEST 3 (bo'sh massiv qachon?) =====
const Screen9 = (props) => (
  <QuestionScreen {...props} idx={9} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="useEffect(() => {…}, []) — bo'sh massiv bilan qachon ishlaydi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}><span className="mono" style={{ color: T.accent }}>useEffect(…, [])</span> qachon ishlaydi?</h2></>}
    options={['Har safar 👍 bosilganda', 'Hech qachon ishlamaydi', "Faqat bir marta — komponent birinchi chizilganda (tug'ilganda)", 'Komponent o\'chirilganda']} correctIdx={2}
    explainCorrect="To'g'ri! [] bo'sh massiv = kuzatadigan hech narsa yo'q — effect faqat komponent tug'ilganda (mount) bir marta ishlaydi."
    explainWrong={{
      0: "Bu [likes] bo'lganda shunday bo'lardi. [] bo'sh — faqat tug'ilganda bir marta.",
      1: "Ishlaydi — lekin faqat bir marta, komponent ekranga birinchi chiqqanda.",
      3: "Yo'q — o'chirilish Unmount. [] bilan effect tug'ilganda (Mount) ishlaydi.",
      default: "[] = faqat birinchi chizilganda, bir marta."
    }} />
);

// ===== SCREEN 10 — LIFECYCLE (Roblox o'yinchisi: Mount/Update/Unmount) =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [stage, setStage] = useState(storedAnswer ? 3 : 0); // 0 boshlanmagan, 1 mount, 2 update, 3 unmount
  const [likes, setLikes] = useState(storedAnswer ? 1 : 0);
  const done = stage >= 3;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const LOGS = [
    { at: 1, color: CODE.str, text: "MOUNT — komponent tug'ildi, sahifaga qo'shildi" },
    { at: 2, color: CODE.attr, text: 'UPDATE — state o\'zgardi, qayta chizildi' },
    { at: 3, color: CODE.tag, text: 'UNMOUNT — komponent sahifadan olib tashlandi' }
  ];
  const PHASES = [
    { n: 'Mount', d: "tug'ilish — serverga kirdi" },
    { n: 'Update', d: "yangilanish — o'ynayapti" },
    { n: 'Unmount', d: 'xayrlashish — chiqib ketdi' }
  ];
  return (
    <Stage eyebrow="Hayot yo'li" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "3 bosqichni o'tkazing"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Komponent ham o'yinchiday <span className="italic" style={{ color: T.accent }}>yashaydimi</span>?</h2></div>
        <Mentor>Xuddi Roblox o'yinchisi kabi: <b style={{ color: T.ink }}>serverga kirdi</b> (Mount — tug'ildi), <b style={{ color: T.ink }}>o'ynayapti</b> (Update — har state o'zgarishida), <b style={{ color: T.ink }}>chiqib ketdi</b> (Unmount). Kartochkani shu yo'ldan o'tkazing — konsol hammasini yozib boradi.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {PHASES.map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 13px', borderRadius: 11, background: stage > i ? T.successSoft : T.bg, opacity: stage > i ? 1 : 0.55, transition: 'all 0.4s' }}>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 12, color: stage > i ? T.success : T.ink3, minWidth: 16 }}>{stage > i ? '✓' : i + 1}</span>
                  <span style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 12.5, color: stage > i ? T.ink : T.ink2 }}>{p.n}</span>
                    <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 11.5, color: T.ink3 }}>{p.d}</span>
                  </span>
                </div>
              ))}
            </div>
            <p className="flow-label" style={{ margin: 0 }}>Konsol</p>
            <div className="code-box" style={{ padding: '9px 13px', minHeight: 72 }}>
              {stage === 0
                ? <TLine out={<span style={{ color: CODE.comment }}>kutilmoqda — o'yinchini kiriting…</span>} />
                : LOGS.filter(l => stage >= l.at).map((l, i) => <TLine key={i} out={<span style={{ color: l.color }}>✓ {l.text}</span>} />)}
            </div>
          </Col>
          <Col>
            <p className="flow-label">Server (sahifa)</p>
            <Win title="robo-games — localhost:5173" minH={110}>
              {stage >= 1 && stage < 3
                ? <div style={{ maxWidth: 165 }}><RoCard name="Blox Fruits" likes={likes} onLike={() => { if (stage >= 1 && stage < 3) { setLikes(l => l + 1); setStage(s => Math.max(s, 2)); } }} /></div>
                : <p style={{ color: T.ink3, fontStyle: 'italic', margin: 0, fontFamily: 'Georgia, serif', fontSize: 13 }}>{stage >= 3 ? "Kartochka ketdi — sahifa yana bo'sh. Hayot yo'li yakunlandi." : "Sahifa bo'sh…"}</p>}
            </Win>
            <div className="fade-up delay-2" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {stage === 0 && <button className="btn" onClick={() => setStage(1)}>▶ O'yinchi kirdi — kartochkani qo'shish</button>}
              {stage === 1 && <p className="small" style={{ color: T.ink2, margin: 0, fontStyle: 'italic' }}>↑ endi 👍 ni bosing — Update bosqichi</p>}
              {stage === 2 && <button className="btn" onClick={() => setStage(3)}>✕ O'yinchi chiqdi — olib tashlash</button>}
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>To'liq hayot yo'li: <b>Mount → Update → Unmount</b>. Effect'lar shu yo'lga bog'lanadi: <span className="mono">[]</span> — Mount'da, <span className="mono">[likes]</span> — har Update'da.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — VIBECODING (AI agentga state/effect buyurtma) =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const TASKS = [
    { id: 't1', label: "Kartochkaga ishlaydigan like tugmasi qo'shib ber", plan: ['useState bilan likes xotirasini yarataman', "Tugma bosilganda setLikes(likes + 1) chaqiraman"], code: <><Jx>{'const'}</Jx>{' ['}<At>likes</At>{', '}<At>setLikes</At>{'] = '}<Jx>{'useState'}</Jx>{'('}<St>0</St>{')'}</> },
    { id: 't2', label: "Sahifa ochilganda 'Xush kelibsiz!' chiqsin", plan: ["useEffect bilan [] bo'sh massivda yozaman", "Xabarni bir marta ko'rsataman"], code: <><Jx>{'useEffect'}</Jx>{'(() => { '}<At>salom</At>{'() }, '}<At>[]</At>{')'}</> },
    { id: 't3', label: "⭐ sevimlilar tugmasini qo'shib ber", plan: ['useState bilan starred xotirasini yarataman (false)', 'Bosilganda setStarred(!starred) qilaman'], code: <><Jx>{'const'}</Jx>{' ['}<At>starred</At>{', '}<At>setStarred</At>{'] = '}<Jx>{'useState'}</Jx>{'('}<St>false</St>{')'}</> }
  ];
  const [task, setTask] = useState(null);
  const [phase, setPhase] = useState(storedAnswer ? 'done' : 'idle'); // idle | planned | building | done
  const [likes, setLikes] = useState(0);
  const [starred, setStarred] = useState(false);
  const timer = useRef(null);
  const done = phase === 'done';
  useEffect(() => () => clearTimeout(timer.current), []);
  const choose = (id) => { clearTimeout(timer.current); setTask(id); setPhase('planned'); setLikes(0); setStarred(false); };
  const approve = () => { clearTimeout(timer.current); setPhase('building'); timer.current = setTimeout(() => setPhase('done'), 1300); };
  const cur = TASKS.find(t => t.id === task) || (storedAnswer ? TASKS[0] : null);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Keyingi qadam · AI" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Agent bilan ishlab ko'ring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Jonli tugmani <span className="italic" style={{ color: T.accent }}>AI'ga yozdirsak</span>-chi?</h2></div>
        <Mentor>Endi siz <b style={{ color: T.ink }}>state kodini o'qiy olasiz</b>! Buyruq bering, agent rejasini <b style={{ color: T.ink }}>tasdiqlang</b>, keyin kodini tekshiring: <span className="mono">useState</span> bormi, <span className="mono">set…</span> chaqirilganmi, <span className="mono">[]</span> to'g'rimi. Oxirida natijani <b style={{ color: T.ink }}>o'zingiz bosib sinang</b> — boshliq siz.</Mentor>
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
            <p className="flow-label">2. Natija — bosib sinab ko'ring</p>
            <Win title="robo-games — localhost:5173" minH={130}>
              {done && cur ? (
                <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {cur.id === 't2' && (
                    <div className="welcome-toast el-in">
                      <span className="wt-emoji">👋</span>
                      <div className="wt-text"><b>Xush kelibsiz!</b><span>robo-games'ga qaytib keldingiz</span></div>
                      <span className="wt-badge">[] · 1 marta</span>
                    </div>
                  )}
                  <div style={{ maxWidth: 185 }}>
                    {cur.id === 't1' && <RoCard name="Adopt Me!" likes={likes} onLike={() => setLikes(l => l + 1)} />}
                    {cur.id === 't2' && <RoCard name="Adopt Me!" />}
                    {cur.id === 't3' && <RoCard name="Brookhaven" likes={likes} onLike={() => setLikes(l => l + 1)} starred={starred} onStar={() => setStarred(s => !s)} />}
                  </div>
                </div>
              ) : (
                <p style={{ color: T.ink3, fontStyle: 'italic', margin: 0, fontFamily: 'Georgia, serif', fontSize: 13 }}>Buyruq bering va rejani tasdiqlang…</p>
              )}
            </Win>
            {done
              ? <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Tugmani <b>o'zingiz bosib sinadingizmi</b>? Kod ham o'qildi: useState bor, set chaqirilgan. Agent to'g'ri qilganini endi <b>isbotlay olasiz</b>.</p></div>
              : <p className="body" style={{ margin: 0, color: T.ink3, fontSize: 13 }}>Natija shu yerda paydo bo'ladi — keyin uni o'zingiz sinaysiz.</p>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — TEST 4 (state vs props) =====
const Screen12 = (props) => (
  <QuestionScreen {...props} idx={12} scope="module-mikro" eyebrow="Mashq · 4-savol"
    questionText="State props'dan nimasi bilan farq qiladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}><span className="italic" style={{ color: T.accent }}>State</span> props'dan nimasi bilan farq qiladi?</h2></>}
    options={["Farqi yo'q — ikkalasi bir narsa", "State — komponentning O'Z xotirasi, o'zi o'zgartiradi; props — tashqaridan keladi", 'State faqat sonlarni saqlaydi', 'Props tezroq ishlaydi']} correctIdx={1}
    explainCorrect="To'g'ri! Props — tashqaridan keladigan ma'lumot (<GameCard name='…' />), state — komponentning ichki xotirasi (likes), uni komponent o'zi setLikes bilan o'zgartiradi."
    explainWrong={{
      0: "Farqi katta: props tashqaridan KELADI, state esa komponentning O'Z ichki xotirasi.",
      2: "Yo'q — state istalgan narsani saqlaydi: son, matn, true/false (starred esingizdami?).",
      3: "Yo'q — tezlik bir xil. Farq manbada: props tashqaridan, state ichkaridan.",
      default: "State — ichki xotira (o'zi o'zgartiradi), props — tashqaridan kelgan ma'lumot."
    }} />
);

// ===== SCREEN 13 — AMALIYOT: O'Z SANAGICHINGIZNI SOZLANG =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const INITS = [0, 10, 100];
  const STEPS = [1, 5, 10];
  const [init, setInit] = useState(0);
  const [step, setStep] = useState(1);
  const [clicks, setClicks] = useState(0);
  const [initTried, setInitTried] = useState(storedAnswer ? new Set([0, 10]) : new Set([0]));
  const [stepTried, setStepTried] = useState(storedAnswer ? new Set([1, 5]) : new Set([1]));
  const likes = init + clicks * step;
  const done = initTried.size >= 2 && stepTried.size >= 2 && (clicks >= 1 || !!storedAnswer);
  const pickInit = (v) => { setInit(v); setClicks(0); setInitTried(prev => { const s = new Set(prev); s.add(v); return s; }); };
  const pickStep = (v) => { setStep(v); setClicks(0); setStepTried(prev => { const s = new Set(prev); s.add(v); return s; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Amaliyot · sozlash" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Sozlang va bosib sinang'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(8px,1.2vw,12px)' }}>
        <div className="head"><h2 className="title h-title fade-up">O'z <span className="italic" style={{ color: T.accent }}>like hisoblagichingizni</span> sozlay olasizmi?</h2></div>
        <Mentor>Endi o'zingiz boshqaring! <b style={{ color: T.ink }}>Boshlang'ich qiymat</b>ni (useState ichidagi son) va <b style={{ color: T.ink }}>qadam</b>ni tanlang, keyin 👍 bosib sinang. Kod qanday o'zgarishini kuzating.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Boshlang'ich qiymat — useState(?)</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {INITS.map(v => <button key={v} className="gchip" style={init === v ? { background: T.accent, color: '#fff' } : undefined} onClick={() => pickInit(v)}>{v} {initTried.has(v) ? '✓' : ''}</button>)}
            </div>
            <p className="flow-label" style={{ marginTop: 2 }}>Qadam — setLikes(likes + ?)</p>
            <div className="fade-up delay-2" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {STEPS.map(v => <button key={v} className="gchip" style={step === v ? { background: T.accent, color: '#fff' } : undefined} onClick={() => pickStep(v)}>+{v} {stepTried.has(v) ? '✓' : ''}</button>)}
            </div>
            <pre className="code-box fade-up delay-2">
              <Jx>{'const'}</Jx>{' ['}<At>likes</At>{', '}<At>setLikes</At>{'] = '}<Jx>{'useState'}</Jx>{'('}<St>{init}</St>{');'}{'\n\n'}
              <Jx>{'<button'}</Jx> <At>onClick</At>{'={() =>'}{'\n'}
              {'  setLikes(likes + '}<St>{step}</St>{')'}{'\n'}
              {'}'}<Jx>{'>'}</Jx>{'👍 {likes}'}<Jx>{'</button>'}</Jx>
            </pre>
          </Col>
          <Col>
            <p className="flow-label">Hisoblagichingiz — bosib sinang</p>
            <Win title="robo-games — localhost:5173" minH={100}>
              <div style={{ maxWidth: 185 }}><RoCard key={`${init}-${step}`} name="Tower of Hell" likes={likes} onLike={() => setClicks(c => c + 1)} /></div>
            </Win>
            <span className="tagpill fade-step" style={{ color: done ? T.success : T.ink }}>{initTried.size >= 2 ? '✓' : '○'} boshlang'ich · {stepTried.size >= 2 ? '✓' : '○'} qadam · {clicks >= 1 ? '✓' : '○'} sinash</span>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Siz hozir state'ni <b>to'liq boshqardingiz</b>: boshlang'ich qiymat, o'zgarish qadami va qayta chizish — hammasi qo'lingizda.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — DEBUGGING (likes = likes + 1 — to'g'ridan-to'g'ri o'zgartirish) =====
const Screen14 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [picked, setPicked] = useState(storedAnswer ? 'mut' : null);
  const [fixed, setFixed] = useState(!!storedAnswer);
  const [likes, setLikes] = useState(0);
  const found = picked === 'mut';
  const done = fixed;
  const pickMut = () => { if (found) return; setPicked('mut'); };
  const fix = () => setFixed(true);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Debugging" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : (found ? 'Endi tuzating' : 'Xatoni toping')} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">AI yordam beradi — siz esa <span className="italic" style={{ color: T.accent }}>tekshirasiz</span>.</h2></div>
        <Mentor>AI kod yozishda <b style={{ color: T.ink }}>zo'r yordamchi</b> — like tugmasini bir zumda yozib berdi. Lekin <b style={{ color: T.ink }}>odamlar ham, AI ham</b> ba'zan kichik xato qiladi. Shuni topib tuzatish — <b style={{ color: T.ink }}>debugging</b>. Tugma bosilganda ekran yangilanmayapti — siz buni darsda ko'rgansiz! Qaysi qator aybdor?</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="ai-card fade-up delay-2">
              <div className="ai-row"><span className="ai-badge">AI</span><span className="ai-bubble">Like tugmasini yozdim:</span></div>
              <div className="ai-code">
                <div className={`ai-line ${picked === 'st' ? 'ok' : ''}`} onClick={() => { if (!found) setPicked('st'); }}><Jx>{'const'}</Jx>{' ['}<At>likes</At>{', '}<At>setLikes</At>{'] = '}<Jx>{'useState'}</Jx>{'('}<St>0</St>{');'}</div>
                <div className={`ai-line ${picked === 'btn' ? 'ok' : ''}`} onClick={() => { if (!found) setPicked('btn'); }}><Jx>{'<button'}</Jx> <At>onClick</At>{'={() => {'}</div>
                {!fixed ? (
                  <div className={`ai-line ${found ? 'bad' : ''}`} onClick={pickMut}>{'  likes = likes + '}<St>1</St>{';  '}<Cm>{'// yangilash'}</Cm></div>
                ) : (
                  <div className="ai-line ok el-in">{'  setLikes(likes + '}<St>1</St>{');  '}<Cm>{'// yangilash'}</Cm></div>
                )}
                <div className={`ai-line ${picked === 'jsx' ? 'ok' : ''}`} onClick={() => { if (!found) setPicked('jsx'); }}>{'}}'}<Jx>{'>'}</Jx>{'👍 {likes}'}<Jx>{'</button>'}</Jx></div>
              </div>
              {!found && <p className="ai-prompt">Qaysi qator ekranni "qotirib" qo'ydi? Bosing.</p>}
              {found && !fixed && <button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={fix}>🔧 setLikes'ga almashtirish</button>}
              {fixed && <p className="ai-prompt" style={{ color: T.success, fontStyle: 'normal', fontWeight: 600 }}>✓ Tuzatildi — endi React xabardor!</p>}
            </div>
          </Col>
          <Col>
            {!found && (
              (picked === 'st' || picked === 'btn' || picked === 'jsx')
                ? <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bu qator to'g'ri{picked === 'st' ? ' — useState joyida' : picked === 'jsx' ? <> — <span className="mono">{'{likes}'}</span> to'g'ri o'qilyapti</> : ''}. Yana qarang: qiymat <b>qanday o'zgartirilyapti</b>?</p></div>
                : <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Eslang, 1-versiyadagi qotib qolgan tugmani: <b style={{ color: T.ink }}>to'g'ridan-to'g'ri o'zgartirishni React sezmaydi</b>. Qaysi qator xuddi shunday qilyapti?</p></div>
            )}
            {found && !fixed && <div className="frame-warn fade-step"><p className="note-h" style={{ color: T.accent }}>✓ Topdingiz!</p><p className="body" style={{ margin: 0, color: T.ink }}><span className="mono">likes = likes + 1</span> — xotirada o'zgaradi, lekin React'ga <b>xabar bermaydi</b> — ekran qotib qoladi. To'g'risi: <span className="mono">setLikes(likes + 1)</span>. Chapdagi tugma bilan tuzating →</p></div>}
            {fixed && (
              <>
                <div className="takeaway fade-step"><div className="ta-bulb">🛠️</div><p className="ta-h">Topdingiz va tuzatdingiz — bu debugging!</p><p className="ta-sub">AI tez yozadi, siz tekshirib tuzatasiz — zo'r jamoa</p></div>
                <p className="flow-label" style={{ margin: 0 }}>Endi ishlaydi — bosib sinang</p>
                <Win title="robo-games — localhost:5173" minH={110}><div style={{ maxWidth: 185 }}><RoCard name="Adopt Me!" likes={likes} onLike={() => setLikes(l => l + 1)} /></div></Win>
              </>
            )}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 15 — YAKUNIY (VS Code'da useState qatorini yozish) =====
const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [value, setValue] = useState(storedAnswer?.picked || '');
  const [passed, setPassed] = useState(!!storedAnswer?.correct);
  const [likes, setLikes] = useState(0);
  const norm = value.replace(/\s+/g, ' ').trim();
  const valid = /^const\s*\[\s*likes\s*,\s*setLikes\s*\]\s*=\s*useState\s*\(\s*0\s*\)\s*;?$/.test(norm);
  const hasPair = /\[\s*likes\s*,\s*setLikes\s*\]/.test(value);
  const hasHook = /=\s*useState\s*\(/.test(value);
  const hasInit = /useState\s*\(\s*0\s*\)/.test(value);
  const lowerHook = /usestate\s*\(/.test(value) && !/useState\s*\(/.test(value);
  useEffect(() => {
    if (valid && !passed) {
      setPassed(true);
      onAnswer(screen, { stage: 'final', screenIdx: screen, question: "const [likes, setLikes] = useState(0) qatorini yozing", studentAnswer: value, correct: true, firstAttemptCorrect: true, solved: true, picked: value });
    }
  }, [valid]);
  const Ln = ({ n, children }) => (
    <div className="vsc-line"><span className="vsc-ln">{n}</span><span style={{ whiteSpace: 'pre' }}>{children}</span></div>
  );
  return (
    <Stage eyebrow="Yakuniy · amaliy" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!passed} label={passed ? 'Davom etish' : 'Xotira qatorini yozing'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Oxirgi qadam: xotirani <span className="italic" style={{ color: T.accent }}>o'zingiz</span> yarating.</h2></div>
        <Mentor>VS Code'da <span className="mono">GameCard.jsx</span> ochiq — pastdagi tugma <span className="mono">setLikes</span> va <span className="mono">likes</span>'ni kutyapti, lekin <b style={{ color: T.ink }}>xotira qatori yo'q</b>! 2-qatorga yozing: <b style={{ color: T.ink }}>const [likes, setLikes] = useState(0)</b>. Yozishingiz bilan o'ngdagi tugma jonlanadi.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="vsc fade-up delay-2">
              <div className="vsc-bar">
                <span className="vsc-tab on"><span style={{ color: '#61DAFB' }}>⚛</span> GameCard.jsx <span style={{ color: '#6E7681', marginLeft: 4 }}>×</span></span>
                <span className="vsc-tab">App.jsx</span>
              </div>
              <div className="vsc-body">
                <Ln n={1}><Jx>{'function'}</Jx><span style={{ color: '#DCDCAA' }}> GameCard</span>{'() {'}</Ln>
                <div className="vsc-line">
                  <span className="vsc-ln">2</span>
                  <span style={{ whiteSpace: 'pre' }}>{'  '}</span>
                  <input className={`vsc-input ${valid ? 'ok' : ''}`} value={value} onChange={e => setValue(e.target.value)} placeholder="const [likes, setLikes] = useState(0)" spellCheck={false} autoCapitalize="off" autoCorrect="off" />
                </div>
                <Ln n={3}>{'  '}<Jx>{'return'}</Jx>{' ('}</Ln>
                <Ln n={4}>{'    '}<Jx>{'<button'}</Jx> <At>onClick</At>{'={() => setLikes(likes + '}<St>1</St>{')}'}<Jx>{'>'}</Jx></Ln>
                <Ln n={5}>{'      👍 {likes}'}</Ln>
                <Ln n={6}>{'    '}<Jx>{'</button>'}</Jx></Ln>
                <Ln n={7}>{'  );'}</Ln>
                <Ln n={8}>{'}'}</Ln>
              </div>
            </div>
            <div className="fade-up delay-2" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="tagpill" style={{ opacity: hasPair ? 1 : 0.4 }}>{hasPair ? '✓' : '1'} [likes, setLikes] juftlik</span>
              <span className="tagpill" style={{ opacity: hasHook ? 1 : 0.4 }}>{hasHook ? '✓' : '2'} = useState(…)</span>
              <span className="tagpill" style={{ opacity: hasInit ? 1 : 0.4 }}>{hasInit ? '✓' : '3'} boshlang'ich (0)</span>
            </div>
            {lowerHook && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Deyarli! <span className="mono">useState</span> — <b>S katta harf</b> bilan yoziladi.</p></div>}
            {passed && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Mukammal! Xotira yaratildi — tugma jonlandi. Endi siz state'ni noldan yoza olasiz.</p></div>}
          </Col>
          <Col>
            <p className="flow-label">natija — bosib sinang</p>
            <Win title="robo-games — localhost:5173" minH={130}>
              {valid
                ? <div className="fade-step" style={{ maxWidth: 165 }}><RoCard name="Blox Fruits" likes={likes} onLike={() => setLikes(l => l + 1)} /></div>
                : <p style={{ fontFamily: 'Georgia, serif', color: T.ink3, fontStyle: 'italic', margin: 0, textAlign: 'center', lineHeight: 1.5 }}>2-qator yozilmaguncha tugma ishlamaydi: <span className="mono" style={{ fontStyle: 'normal' }}>likes</span> degan xotira yo'q…</p>}
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
    "Oddiy o'zgaruvchi ekranni yangilamaydi — React sezmaydi",
    "useState — komponent xotirasi: [qiymat, setQiymat]",
    "setQiymat → xotira yangilanadi + ekran qayta chiziladi",
    "useEffect(…, []) — tug'ilganda; [likes] — har o'zgarishda",
    "Hayot yo'li: Mount → Update → Unmount"
  ];
  const HOMEWORK = [
    { b: 'Jonli like', t: "— robo-games loyihangizda GameCard'ga useState bilan ishlaydigan 👍 qo'shing" },
    { b: 'Ikkinchi xotira', t: "— ⭐ sevimlilar tugmasi: bosilganda yulduzcha yonsin/o'chsin (true/false)" },
    { b: 'Tab kuzatuvchisi', t: "— useEffect bilan like soni brauzer tab sarlavhasiga chiqsin" }
  ];
  const GLOSSARY = [
    { b: 'State', t: "— komponentning o'z ichki xotirasi" },
    { b: 'useState(0)', t: "— xotira yaratadi: [qiymat, yangilovchi]" },
    { b: 'setLikes', t: "— qiymatni o'zgartirish + qayta chizish" },
    { b: 'Qayta chizish', t: "— React komponentni yangidan ko'rsatadi" },
    { b: 'useEffect', t: "— qo'shimcha ish: tug'ilganda yoki kuzatuvda" },
    { b: '[] / [likes]', t: "— effect qachon ishlashini belgilaydi" },
    { b: 'Mount/Update/Unmount', t: "— tug'ilish / yangilanish / ketish" }
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
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">✓</span> Dars tugadi</span><h2 className="title h-title fade-up d1">Kartochkangiz <span className="italic" style={{ color: T.accent }}>jonlandi</span>.</h2><p className="body h-sub fade-up d2">{PASSED ? "Tabriklaymiz! Endi tugmalaringiz ishlaydi: state xotirani saqlaydi, React esa ekranni yangilab turadi." : "Yaxshi harakat! useState siklini mustahkamlash uchun bir-ikki ekranni qayta ko'ring."}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span className="tick" style={{ width: 16, height: 16, borderRadius: '50%', background: T.success, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck">✓</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>📝 Uyga vazifa</div><p className="body" style={{ margin: '0 0 10px', color: T.ink }}>Antigravity bilan o'z loyihangizda sinang:</p><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">Keyingi darsda komponentlar jamoa bo'lib ishlaydi — ma'lumot bittasidan ikkinchisiga oqadi! 🚀</p></div>
        </div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">💡 Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT — ({ lang, onFinished })
export default function ReactStateEffectLesson({ lang: langProp, onFinished }) {
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
        .zoomable { position: relative; }
        .zoom-btn { position: absolute; top: 6px; right: 6px; z-index: 5; width: 30px; height: 30px; border-radius: 8px; border: none; background: rgba(255,255,255,0.82); color: ${T.ink2}; font-size: 14px; line-height: 1; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px -4px rgba(${T.shadowBase},0.22); transition: all 0.2s; }
        .zoom-btn:hover { background: ${T.paper}; color: ${T.accent}; transform: scale(1.08); }
        .zoom-backdrop { position: fixed; inset: 0; background: rgba(14,14,16,0.55); z-index: 1000; animation: fade-step 0.25s ease; }
        .zoom-on { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%); width: min(880px,94vw); max-height: 90vh; overflow: auto; z-index: 1001; background: ${T.paper}; border-radius: 18px; padding: clamp(20px,4vw,42px); box-shadow: 0 30px 80px -20px rgba(${T.shadowBase},0.5); animation: zoom-pop 0.3s cubic-bezier(.34,1.3,.4,1); }
        @keyframes zoom-pop { from { opacity: 0; transform: translate(-50%,-50%) scale(0.93); } to { opacity: 1; transform: translate(-50%,-50%) scale(1); } }
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

        /* === REACT-3 DARS CSS === */
        .bp-bar { background: #f0eee8; padding: 8px 11px; display: flex; align-items: center; gap: 9px; }
        .bb-dots { display: flex; gap: 5px; }
        .bb-dots i { width: 9px; height: 9px; border-radius: 50%; }
        .bb-dots i:first-child { background: #ff5f57; } .bb-dots i:nth-child(2) { background: #febc2e; } .bb-dots i:nth-child(3) { background: #28c840; }
        .bp-title { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink3}; transition: color 0.3s; }
        .bp-body { padding: clamp(12px,2.2vw,18px); }
        .code-box { background: ${CODE.bg}; color: ${CODE.text}; font-family: 'JetBrains Mono', monospace; font-size: clamp(12px,1.5vw,13.5px); line-height: 1.55; padding: clamp(12px,2.2vw,16px); border-radius: 12px; overflow-x: auto; white-space: pre-wrap; word-break: break-word; margin: 0; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.2); }
        /* Roblox uslubidagi o'yin kartochkasi */
        .rocard { border-radius: 13px; background: #fff; box-shadow: 0 5px 16px -4px rgba(0,0,0,0.18); overflow: hidden; border: 1px solid rgba(0,0,0,0.05); transition: transform 0.15s, box-shadow 0.15s; }
        .rocard:hover { transform: translateY(-2px); box-shadow: 0 12px 26px -5px rgba(0,0,0,0.28); }
        .rocard:hover .rothumb-play { opacity: 1; transform: scale(1); }
        .rothumb { position: relative; height: 72px; display: flex; align-items: center; justify-content: center; overflow: hidden; }
        .rothumb::before { content: ''; position: absolute; inset: 0; background: radial-gradient(circle at 50% 30%, rgba(255,255,255,0.34), transparent 62%); }
        .rothumb::after { content: ''; position: absolute; left: 0; right: 0; bottom: 0; height: 44%; background: linear-gradient(transparent, rgba(0,0,0,0.26)); }
        .rothumb-icon { position: relative; z-index: 1; font-size: 34px; line-height: 1; filter: drop-shadow(0 3px 6px rgba(0,0,0,0.32)); }
        .rothumb-play { position: absolute; z-index: 2; bottom: 7px; right: 7px; width: 20px; height: 20px; border-radius: 50%; background: rgba(255,255,255,0.92); color: #1A2436; font-size: 9px; display: flex; align-items: center; justify-content: center; padding-left: 1px; box-shadow: 0 2px 7px rgba(0,0,0,0.3); opacity: 0; transform: scale(0.55); transition: all 0.2s; }
        .rostar { position: absolute; z-index: 2; top: 6px; right: 8px; font-size: 16px; filter: drop-shadow(0 1px 2px rgba(0,0,0,0.35)); }
        .rostar-btn { position: absolute; z-index: 3; top: 6px; right: 6px; width: 27px; height: 27px; border-radius: 50%; border: none; cursor: pointer; background: rgba(255,255,255,0.92); font-size: 15px; line-height: 1; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 8px -1px rgba(0,0,0,0.3); transition: transform 0.15s, background 0.15s; }
        .rostar-btn:hover { transform: scale(1.13); }
        .rostar-btn:active { transform: scale(0.92); }
        .rostar-btn.on { background: #FFF1CC; box-shadow: 0 2px 11px -1px rgba(255,180,0,0.65); }
        .robar { height: 4px; background: rgba(0,0,0,0.13); }
        .robar-fill { display: block; height: 100%; background: #1FA463; transition: width 0.4s ease; }
        .robody { padding: 8px 11px 10px; }
        .roname { font-family: 'Manrope', sans-serif; font-weight: 800; font-size: 12.5px; color: ${T.ink}; margin: 0 0 6px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .rostats { display: flex; align-items: center; gap: 9px; font-family: 'Manrope', sans-serif; font-size: 11px; color: ${T.ink3}; font-weight: 700; }
        .rolike-btn { border: none; cursor: pointer; font-family: 'Manrope', sans-serif; font-size: 12px; font-weight: 800; color: ${T.success}; background: ${T.successSoft}; padding: 5px 11px; border-radius: 99px; display: inline-flex; align-items: center; gap: 5px; transition: transform 0.15s, box-shadow 0.15s; box-shadow: 0 2px 7px -2px rgba(31,122,77,0.45); }
        .rolike-btn:hover { transform: translateY(-1px); box-shadow: 0 5px 12px -2px rgba(31,122,77,0.55); }
        .rolike-btn:active { transform: scale(0.94); }
        .rolike-num { min-width: 9px; text-align: left; }
        .rolike-static { color: ${T.success}; font-weight: 700; display: inline-flex; align-items: center; gap: 3px; }
        .roplayers { color: ${T.ink3}; display: inline-flex; align-items: center; gap: 3px; }
        @keyframes heart-pop { 0% { transform: scale(1); } 40% { transform: scale(1.45); } 100% { transform: scale(1); } }
        .hpop { animation: heart-pop 0.4s ease; display: inline-block; }
        /* === XOTIRA ≠ EKRAN ko'rsatkichi (muammo) === */
        .gap-viz { display: flex; align-items: stretch; gap: 8px; }
        .gap-box { flex: 1; border-radius: 11px; padding: 9px 11px; display: flex; flex-direction: column; gap: 4px; min-width: 0; }
        .gap-box.mem { background: ${T.accentSoft}; }
        .gap-box.scr { background: ${T.bg}; box-shadow: inset 0 0 0 1.5px rgba(0,0,0,0.07); }
        .gap-lbl { font-family: 'Manrope'; font-weight: 700; font-size: 10px; letter-spacing: 0.03em; color: ${T.ink2}; }
        .gap-num { font-family: 'Fraunces', serif; font-size: 26px; line-height: 1; color: ${T.accent}; }
        .gap-num.frozen { color: ${T.ink3}; display: inline-flex; align-items: center; gap: 5px; }
        .gap-lock { font-size: 13px; }
        .gap-vs { align-self: center; font-family: 'Fraunces', serif; font-size: 20px; color: ${T.ink3}; font-weight: 700; }
        @keyframes gap-pop { 0% { transform: scale(0.5); opacity: 0.4; } 55% { transform: scale(1.28); } 100% { transform: scale(1); opacity: 1; } }
        .gap-num.pop { display: inline-block; animation: gap-pop 0.4s cubic-bezier(.34,1.45,.5,1); }

        /* === USESTATE ANATOMIYA (rangli, bosishga chorlovchi qismlar) === */
        .anat-tok { cursor: pointer; border-radius: 6px; padding: 2px 6px; display: inline-block; transition: all 0.18s; }
        .anat-tok:not(.seen):not(.on) { animation: tok-invite 2.2s ease-in-out infinite; }
        @keyframes tok-invite { 0%,100% { box-shadow: inset 0 0 0 1.5px rgba(255,255,255,0.14); } 50% { box-shadow: inset 0 0 0 1.5px rgba(255,255,255,0.34); } }
        .tok-val.on { background: rgba(1,154,203,0.22); box-shadow: inset 0 0 0 1.5px ${T.blue}; }
        .tok-val.seen:not(.on) { background: rgba(1,154,203,0.12); }
        .tok-set.on { background: rgba(255,79,40,0.2); box-shadow: inset 0 0 0 1.5px ${T.accent}; }
        .tok-set.seen:not(.on) { background: rgba(255,79,40,0.1); }
        .tok-init.on { background: rgba(31,122,77,0.2); box-shadow: inset 0 0 0 1.5px ${T.success}; }
        .tok-init.seen:not(.on) { background: rgba(31,122,77,0.12); }

        /* === SET → QAYTA CHIZISH OQIMI === */
        .sflow { display: flex; flex-direction: column; gap: 5px; }
        .sflow-step { display: flex; align-items: center; gap: 10px; padding: 10px 13px; border-radius: 11px; background: ${T.bg}; transition: background 0.4s, box-shadow 0.3s, transform 0.3s; }
        .sflow-step.on { background: ${T.successSoft}; }
        .sflow-step.now { background: ${T.accentSoft}; box-shadow: inset 0 0 0 1.5px ${T.accent}; transform: translateX(3px); }
        .sflow-dot { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 12px; width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; flex-shrink: 0; background: #fff; color: ${T.ink3}; box-shadow: inset 0 0 0 1.5px rgba(0,0,0,0.1); transition: all 0.3s; }
        .sflow-step.on .sflow-dot { background: ${T.success}; color: #fff; box-shadow: none; }
        .sflow-step.now .sflow-dot { background: ${T.accent}; color: #fff; box-shadow: none; }
        .sflow-txt { font-family: 'Manrope'; font-weight: 600; font-size: 13.5px; color: ${T.ink2}; flex: 1; min-width: 0; }
        .sflow-step.on .sflow-txt, .sflow-step.now .sflow-txt { color: ${T.ink}; }
        .sflow-arrow { text-align: center; color: ${T.ink3}; font-size: 14px; line-height: 1; margin: -1px 0; transition: color 0.3s; }
        .sflow-arrow.on { color: ${T.success}; }
        @keyframes mem-pop { 0% { transform: scale(0.6); } 55% { transform: scale(1.3); } 100% { transform: scale(1); } }
        .mem-pop { animation: mem-pop 0.45s cubic-bezier(.34,1.45,.5,1); }
        .render-wrap { position: relative; border-radius: 14px; transition: box-shadow 0.3s; }
        .render-wrap.flash { box-shadow: 0 0 0 3px rgba(31,122,77,0.4); animation: render-flash 0.7s ease-out; }
        @keyframes render-flash { 0% { box-shadow: 0 0 0 3px rgba(31,122,77,0.7); } 100% { box-shadow: 0 0 0 3px rgba(31,122,77,0); } }
        .render-badge { position: absolute; top: -10px; left: 50%; transform: translateX(-50%); white-space: nowrap; font-family: 'Manrope'; font-weight: 700; font-size: 10.5px; color: #fff; background: ${T.success}; padding: 3px 9px; border-radius: 99px; box-shadow: 0 4px 10px -3px rgba(31,122,77,0.5); z-index: 4; }

        /* === BRAUZER TAB PREVIEW (useEffect [likes]) === */
        .tab-preview { display: flex; align-items: center; gap: 9px; flex-wrap: wrap; }
        .tab-chip { display: inline-flex; align-items: center; gap: 6px; font-family: 'Manrope'; font-weight: 700; font-size: 12px; color: ${T.ink}; background: ${T.paper}; padding: 7px 14px 7px 11px; border-radius: 10px 10px 0 0; box-shadow: 0 -2px 10px -4px rgba(${T.shadowBase},0.2), inset 0 -2px 0 ${T.accent}; }
        .tab-fav { color: ${T.blue}; font-size: 13px; }
        .tab-num { font-family: 'JetBrains Mono'; font-weight: 700; display: inline-block; }
        .tab-num.pop { animation: gap-pop 0.4s cubic-bezier(.34,1.45,.5,1); }
        .tab-cue { font-family: 'Manrope'; font-weight: 700; font-size: 11px; color: ${T.success}; }

        /* === WELCOME TOAST (vibecoding t2) === */
        .welcome-toast { display: flex; align-items: center; gap: 11px; padding: 11px 14px; border-radius: 13px; background: linear-gradient(120deg,#1F7A4D,#2BA86A); box-shadow: 0 10px 24px -8px rgba(31,122,77,0.6); }
        .wt-emoji { font-size: 24px; line-height: 1; filter: drop-shadow(0 2px 3px rgba(0,0,0,0.25)); }
        .wt-text { display: flex; flex-direction: column; line-height: 1.25; flex: 1; min-width: 0; }
        .wt-text b { font-family: 'Manrope'; font-weight: 800; font-size: 14px; color: #fff; }
        .wt-text span { font-family: 'Manrope'; font-weight: 500; font-size: 11px; color: rgba(255,255,255,0.85); }
        .wt-badge { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 9.5px; color: #fff; background: rgba(255,255,255,0.22); padding: 3px 8px; border-radius: 99px; white-space: nowrap; }

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

