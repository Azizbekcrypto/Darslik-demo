import React, { useState, useEffect, useRef, createContext, useContext, useCallback } from 'react';
import mentorImg from '../../assets/common/mentor.png';

// ============================================================
// FRONTEND REACT MODULI · PRAKTIKA 1 — CRUD: TO'LIQ BOSHQARILADIGAN ILOVA (SERVERSIZ) — PLATFORM STANDARD v16 (AUDIOSIZ)
// O'RNI: "Props va qayta ishlatish" darsidan KEYIN, "API — GET" darsidan OLDIN.
//        O'quvchi biladi: komponent, props, useState, map. Hali bilmaydi: server, fetch.
// Mavzu: CRUD = ilovaning 4 amali — Create (qo'shish), Read (ko'rsatish), Update (tahrirlash), Delete (o'chirish).
//        Hammasi FAQAT React state bilan (serversiz): [...games, yangi] / games.map(... ? {...g} : g) / games.filter(...).
//        AI bilan bitta to'liq loyiha ("Mening o'yinlarim") bitiriladi: o'quvchi rejani tuzadi, AI quradi, o'quvchi tekshiradi.
// KO'PRIK: yakunda — "ishlaydi, lekin sahifani yangilasangiz yo'qoladi (faqat xotirada)" → keyingi dars (server/GET) ga intro.
// PEDAGOGIKA: rejani siz tuzasiz → AI quradi → siz tekshirasiz (debugging). "me'mor"/"xarita" so'zlari ishlatilmaydi.
// Klassik xato (s13): games.push(yangi) — mutatsiya, React ko'rmaydi → setGames([...games, yangi]). State darsidagi bug'ning ukasi.
// MUHIM: kelgusi darslar ro'yxati AYTILMAYDI — faqat yakunda teaser. AUDIOSIZ. "sehr"/"g'isht" yo'q.
// Yakuniy ekran (s14): VS Code — setGames([...games, yangi]) ni qo'lda yozish.
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

const LESSON_META = { lessonId: 'react-crud-practice-p1-v16', lessonTitle: { uz: "Praktika: CRUD — to'liq boshqariladigan ilova", ru: 'Практика: CRUD — управляемое приложение' } };
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

// ===== O'YIN MA'LUMOTLARI (oldingi darslardan tanish) =====
const GAMES = [
  { id: 1, name: 'Adopt Me!', emoji: '🐾', likes: 92, bg: 'linear-gradient(135deg,#FF9DBF,#C44569)' },
  { id: 2, name: 'Blox Fruits', emoji: '🍇', likes: 95, bg: 'linear-gradient(135deg,#7EA6F4,#2E4A9E)' },
  { id: 3, name: 'Brookhaven', emoji: '🏠', likes: 89, bg: 'linear-gradient(135deg,#8FD3A8,#2E7A4E)' },
  { id: 4, name: 'Doors', emoji: '🚪', likes: 91, bg: 'linear-gradient(135deg,#6B7280,#1F2430)' }
];
const POOL = [
  { id: 5, name: 'Piggy', emoji: '🐷', likes: 87, bg: 'linear-gradient(135deg,#F4A6C0,#B5446E)' },
  { id: 6, name: 'Tower of Hell', emoji: '🗼', likes: 84, bg: 'linear-gradient(135deg,#F4B26A,#C9622E)' },
  { id: 7, name: 'Bee Swarm', emoji: '🐝', likes: 93, bg: 'linear-gradient(135deg,#F4D06A,#C99B2E)' },
  { id: 8, name: 'Pet Sim 99', emoji: '🐶', likes: 90, bg: 'linear-gradient(135deg,#B9A8F4,#6A4AC9)' }
];

// O'yin kartochkasi — CRUD amallari uchun ixtiyoriy tugmalar (❤️ like, 🔥 top, ✕ o'chirish)
const MyCard = ({ game, onLike, onTop, onDelete, dim, flash }) => (
  <div className="rocard el-in" style={{ position: 'relative', opacity: dim ? 0.4 : 1, boxShadow: flash ? `0 0 0 2px ${T.success}, 0 6px 16px -5px rgba(0,0,0,0.2)` : undefined, transition: 'all 0.3s' }}>
    <div className="rothumb" style={{ background: game.bg }}>
      <span style={{ fontSize: 24 }}>{game.emoji}</span>
      {game.top && <span className="topbadge el-in">🔥 TOP</span>}
      {onDelete && <button className="cardx" onClick={onDelete} title="O'chirish">✕</button>}
    </div>
    <div className="robody">
      <p className="roname">{game.name}</p>
      <div className="rostats"><span key={game.likes} className="hpop">❤️ {game.likes}</span></div>
      {(onLike || onTop) && (
        <div className="cardacts">
          {onLike && <button className="cardbtn" onClick={onLike}>❤️ like</button>}
          {onTop && <button className="cardbtn" onClick={onTop} style={game.top ? { background: T.accentSoft, color: T.accent } : undefined}>🔥 TOP</button>}
        </div>
      )}
    </div>
  </div>
);
const CardGrid = ({ children, cols = 3 }) => (
  <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols},1fr)`, gap: 8 }}>{children}</div>
);

// CRUD 4 amali
const OPS = [
  { key: 'C', amal: "Qo'shish", en: 'Create', effId: 'add', eff: "+1 element qo'shiladi", code: 'setGames([...games, yangi])' },
  { key: 'R', amal: "Ko'rsatish", en: 'Read', effId: 'map', eff: 'map bilan chiziladi', code: 'games.map(g => <Card />)' },
  { key: 'U', amal: 'Tahrirlash', en: 'Update', effId: 'change', eff: '1 element o\'zgaradi', code: 'games.map(... ? {...g} : g)' },
  { key: 'D', amal: "O'chirish", en: 'Delete', effId: 'remove', eff: '1 element olib tashlanadi', code: 'games.filter(g => g.id !== id)' }
];

// ===== SCREEN 0 — HOOK (faqat ko'rsatadigan ro'yxat — tugmalar ishlamaydi) =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [tried, setTried] = useState(!!storedAnswer);
  const [shakeId, setShakeId] = useState(null);
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const poke = (id) => {
    setTried(true);
    clearTimeout(timer.current); setShakeId(id); timer.current = setTimeout(() => setShakeId(null), 450);
  };
  const OPTS = [
    { id: 'a', label: "Hech narsa — ko'rsatgani yetadi" },
    { id: 'b', label: "Qo'shish, o'zgartirish va o'chirish ham kerak" },
    { id: 'c', label: 'Ko\'proq rang va animatsiya' }
  ];
  const pick = (v) => { if (picked !== null || !tried) return; setPicked(v); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: true }); };
  return (
    <Stage eyebrow="Kirish" screen={screen} scrollSignal={picked !== null} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 820 }}>Ro'yxat ko'rinadi — lekin nega uni <span className="italic" style={{ color: T.accent }}>o'zgartirib bo'lmaydi</span>?</h1>
        <Mentor>Mana "Mening o'yinlarim" ro'yxati. Yangi o'yin <b style={{ color: T.ink }}>qo'shmoqchi</b> bo'ling yoki bittasini <b style={{ color: T.ink }}>o'chirmoqchi</b> bo'ling — tugmalarni bosib ko'ring. Nima sezdingiz?</Mentor>
        <Zoomable>
        <Split>
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p className="flow-label" style={{ margin: 0 }}>Mening o'yinlarim</p>
              <button className={`chip ${shakeId === 'add' ? 'shake' : ''}`} onClick={() => poke('add')} style={{ padding: '7px 13px', fontSize: 13 }}>+ Qo'shish</button>
            </div>
            <div className="fade-up delay-2"><CardGrid cols={3}>
              {GAMES.slice(0, 3).map(g => (
                <div key={g.id} className={shakeId === g.id ? 'shake' : ''}>
                  <MyCard game={g} onDelete={() => poke(g.id)} />
                </div>
              ))}
            </CardGrid></div>
            {tried && <p className="small fade-step" style={{ color: T.accent, fontStyle: 'italic', margin: 0 }}>Tugmalar bor — lekin hech narsa bo'lmadi. Orqasida kod yo'q!</p>}
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Haqiqiy ilovaga, ko'rsatishdan tashqari, yana nima kerak?</p>
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
            {picked !== null && <p className="hook-ack fade-step">Aynan! Ilova faqat <b>ko'rsata</b> oladi (Read). Lekin to'liq ilovaga yana 3 ta amal kerak: <b>qo'shish, o'zgartirish, o'chirish</b>. Bugun shularni qo'shib, <b>to'liq boshqariladigan ilova</b> quramiz.</p>}
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
    { text: 'CRUD — ilovaning 4 amali', tag: 'Create · Read · Update · Delete' },
    { text: 'Create — qo\'shish', tag: '[...games, yangi]' },
    { text: 'Update — tahrirlash', tag: 'games.map(...)' },
    { text: 'Delete — o\'chirish', tag: 'games.filter(...)' },
    { text: 'AI bilan loyihani bitirish', tag: 'vibecoding' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const PreviewBlock = (
    <Col>
      <p className="flow-label">Dars oxirida — sizning to'liq ilovangiz</p>
      <Win title="Mening o'yinlarim — localhost:5173" minH={120}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: 12.5, color: T.ink }}>3 ta o'yin</span>
          <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: 10.5, background: T.ink, color: '#fff', borderRadius: 7, padding: '5px 10px' }}>+ Qo'shish</span>
        </div>
        <CardGrid cols={3}><MyCard game={{ ...GAMES[0], top: true }} /><MyCard game={GAMES[1]} /><MyCard game={GAMES[3]} /></CardGrid>
      </Win>
      <pre className="code-box" style={{ padding: '10px 14px' }}>{'setGames('}<span style={{ background: 'rgba(255,79,40,0.18)', borderRadius: 5, padding: '1px 5px' }}>{'[...games, yangi]'}</span>{')'}</pre>
      <p className="mono small" style={{ color: T.accent, margin: 0 }}>→ qo'shish · tahrirlash · o'chirish — hammasi sizda</p>
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
          <h2 className="title h-title fade-up">Bugun <span className="italic" style={{ color: T.accent }}>bitta to'liq ilovani</span> AI bilan bitirasiz.</h2>
        </div>
        <Mentor>Va'da beraman: dars oxirida o'yinlarni <b style={{ color: T.ink }}>qo'sha, tahrirlay va o'chira</b> oladigan ilovangiz bo'ladi. Avval har amalni o'zingiz tushunasiz, keyin AI bilan birga loyihani <b style={{ color: T.ink }}>to'liq bitirasiz</b>.</Mentor>
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

// ===== SCREEN 2 — CRUD = 4 AMAL (har birini bosib, ro'yxatga ta'sirini ko'rish) =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const BASE = GAMES.slice(0, 3);
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(storedAnswer ? new Set(OPS.map(o => o.key)) : new Set());
  const done = seen.size >= 4;
  const tap = (k) => { setActive(k); setSeen(prev => { const s = new Set(prev); s.add(k); return s; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  // har amalning ro'yxatga ta'siri (vizual)
  const list = (() => {
    if (active === 'C') return [...BASE, POOL[0]];
    if (active === 'D') return BASE.slice(0, 2);
    if (active === 'U') return BASE.map((g, i) => i === 0 ? { ...g, top: true } : g);
    return BASE;
  })();
  return (
    <Stage eyebrow="CRUD · 4 amal" screen={screen} scrollSignal={done} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/4 amalni sinang`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(8px,1.2vw,12px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Har ilova <span className="italic" style={{ color: T.accent }}>4 ta amal</span> ustida turadi.</h2></div>
        <Mentor>Instagram, Roblox, do'kon — hammasi shu 4 amalni bajaradi: <b style={{ color: T.ink }}>qo'shish, ko'rsatish, o'zgartirish, o'chirish</b>. Ularning nomi — <b style={{ color: T.ink }}>CRUD</b>. To'rttasini bosib, ro'yxatga nima bo'lishini kuzating.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {OPS.map(o => {
                const on = active === o.key;
                return (
                  <button key={o.key} className="vcard" onClick={() => tap(o.key)} style={{ boxShadow: on ? `inset 0 0 0 1.5px ${T.accent}, 0 8px 20px -6px rgba(${T.shadowBase},0.2)` : undefined }}>
                    <span className="vbadge" style={{ background: o.key === 'D' ? T.danger : (o.key === 'C' ? T.success : (o.key === 'U' ? '#B45309' : T.blue)) }}>{o.en}</span>
                    <span className="vlbl">{o.amal}</span>
                    <span className="vseen" style={{ color: seen.has(o.key) ? T.success : T.ink3 }}>{seen.has(o.key) ? '✓' : ''}</span>
                  </button>
                );
              })}
            </div>
            {active && <div className="sk-info" key={active}><p className="body" style={{ margin: 0, color: T.ink }}><b style={{ color: T.accent }}>{OPS.find(o => o.key === active).amal}</b> — {OPS.find(o => o.key === active).eff}.</p></div>}
          </Col>
          <Col>
            <p className="flow-label">Mening o'yinlarim</p>
            <Win title="localhost:5173" minH={96}>
              <CardGrid cols={3}>
                {list.map(g => <MyCard key={g.id} game={g} flash={active === 'C' && g.id === POOL[0].id} dim={false} />)}
              </CardGrid>
            </Win>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana ular — <b>CRUD</b>: <b>C</b>reate (qo'shish) · <b>R</b>ead (ko'rsatish) · <b>U</b>pdate (tahrirlash) · <b>D</b>elete (o'chirish). Bugun hammasini state bilan quramiz.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — LOYIHALASH: HAR AMAL STATE'NI QANDAY O'ZGARTIRADI (qo'lda) =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const EFFECTS = [
    { id: 'add', label: "+1 element qo'shiladi" },
    { id: 'map', label: 'map bilan chiziladi' },
    { id: 'change', label: "1 element o'zgaradi" },
    { id: 'remove', label: '1 element olib tashlanadi' }
  ];
  const [taskIdx, setTaskIdx] = useState(storedAnswer ? OPS.length : 0);
  const [shakeId, setShakeId] = useState(null);
  const timer = useRef(null);
  const done = taskIdx >= OPS.length;
  useEffect(() => () => clearTimeout(timer.current), []);
  const cur = OPS[Math.min(taskIdx, OPS.length - 1)];
  const tap = (effId) => {
    if (done) return;
    if (effId === cur.effId) { setTaskIdx(t => t + 1); }
    else { clearTimeout(timer.current); setShakeId(effId); timer.current = setTimeout(() => setShakeId(null), 450); }
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="1-qadam · loyihalash" screen={screen} scrollSignal={done} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Rejani tuzing (${Math.min(taskIdx, OPS.length)}/4)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Har amal <span className="italic" style={{ color: T.accent }}>ro'yxatni</span> qanday o'zgartiradi?</h2></div>
        <Mentor>AI kod yozishidan oldin <b style={{ color: T.ink }}>siz</b> rejani tuzasiz: ro'yxat (massiv) <span className="mono">games</span> — har amal unga nima qiladi? Har bir amal uchun to'g'ri natijani tanlang.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">CRUD amallari</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {OPS.map((o, i) => {
                const matched = i < taskIdx;
                const activeRow = !done && i === taskIdx;
                return (
                  <div key={o.key} className="routerow" style={{ boxShadow: activeRow ? `inset 0 0 0 1.5px ${T.accent}` : (matched ? `inset 0 0 0 1.5px ${T.success}` : `0 4px 12px -6px rgba(${T.shadowBase},0.14)`), background: matched ? T.successSoft : T.paper }}>
                    <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: 12.5, color: matched ? T.success : T.ink }}>{o.amal}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 12, color: T.ink3 }}>→</span>
                    <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 11, fontWeight: 600, color: matched ? T.success : T.ink3 }}>{matched ? EFFECTS.find(e => e.id === o.effId).label : (activeRow ? '?' : '…')}</span>
                  </div>
                );
              })}
            </div>
          </Col>
          <Col>
            {!done ? (
              <>
                <div className="sk-info" key={taskIdx}><p className="body" style={{ margin: 0, color: T.ink }}><b style={{ color: T.accent }}>{cur.amal}</b> ({cur.en}) bosilganda <span className="mono">games</span> ro'yxatiga nima bo'ladi?</p></div>
                <p className="flow-label" style={{ margin: 0 }}>Natijani tanlang</p>
                <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {EFFECTS.map(e => (
                    <button key={e.id} className={`gchip ${shakeId === e.id ? 'shake' : ''}`} onClick={() => tap(e.id)} style={{ justifyContent: 'flex-start', padding: '11px 14px' }}>{e.label}</button>
                  ))}
                </div>
              </>
            ) : (
              <>
                <p className="flow-label" style={{ margin: 0 }}>Tayyor reja — kod tilida</p>
                <pre className="code-box fade-step" style={{ lineHeight: 1.95 }}>
                  {OPS.map(o => <React.Fragment key={o.key}><Cm>{`// ${o.amal}`}</Cm>{`\n${o.code}\n\n`}</React.Fragment>)}
                </pre>
                <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Reja tayyor! Har amal — <span className="mono">games</span> ustida bitta amal. Endi uchtasini (qo'shish, tahrirlash, o'chirish) birma-bir quramiz.</p></div>
              </>
            )}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 (CRUD nima?) =====
const Screen4 = (props) => (
  <QuestionScreen {...props} idx={4} scope="module-mikro" eyebrow="Mashq · 1-savol"
    questionText="CRUD nima?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}><span className="mono" style={{ color: T.accent }}>CRUD</span> — bu <span className="italic" style={{ color: T.accent }}>nima</span>?</h2></>}
    options={["Ilovaning 4 amali: qo'shish, ko'rsatish, o'zgartirish, o'chirish", 'Yangi dasturlash tili', 'Internet tezligini oshiruvchi dastur', 'CSS rang nomi']} correctIdx={0}
    explainCorrect="To'g'ri! CRUD = Create (qo'shish) · Read (ko'rsatish) · Update (o'zgartirish) · Delete (o'chirish). Deyarli har ilova shu 4 amalni bajaradi."
    explainWrong={{
      1: "Yo'q — CRUD til emas. Bu 4 ta amalning qisqartmasi: Create, Read, Update, Delete.",
      2: "Yo'q — tezlikka aloqasi yo'q. CRUD — ma'lumot ustidagi 4 amal.",
      3: "Yo'q — rang emas. CRUD = qo'shish, ko'rsatish, o'zgartirish, o'chirish.",
      default: "CRUD = Create · Read · Update · Delete — ilovaning 4 asosiy amali."
    }} />
);

// ===== SCREEN 5 — CREATE (qo'shish: [...games, yangi]) =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const START = GAMES.slice(0, 2);
  const [list, setList] = useState(storedAnswer ? [...START, POOL[0], POOL[1]] : START);
  const added = list.length - START.length;
  const done = added >= 2;
  const remaining = POOL.filter(p => !list.some(g => g.id === p.id));
  const add = (g) => setList(prev => (prev.some(x => x.id === g.id) ? prev : [...prev, g]));
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Create · qo'shish" screen={screen} scrollSignal={done} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Kamida 2 ta qo'shing (${added}/2)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Yangi o'yin ro'yxatga <span className="italic" style={{ color: T.accent }}>qanday</span> qo'shiladi?</h2></div>
        <Mentor>Sir — uchta nuqtada: <span className="mono">[...games, yangi]</span>. Uch nuqta (<b style={{ color: T.ink }}>spread</b>) "eski ro'yxatning <b style={{ color: T.ink }}>hammasini ko'chir</b>" degani, keyin oxiriga <b style={{ color: T.ink }}>yangisini</b> qo'shamiz. O'yin tanlab, qo'shib ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Qo'shish uchun tanlang</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {remaining.length ? remaining.map(g => <button key={g.id} className="gchip" onClick={() => add(g)}>+ {g.emoji} {g.name}</button>) : <span className="small" style={{ color: T.ink3, fontStyle: 'italic' }}>Hammasi qo'shildi ✓</span>}
            </div>
            <pre className="code-box fade-up delay-2" style={{ lineHeight: 1.95 }}>
              <Jx>{'const'}</Jx>{' yangi = { name: '}<St>"…"</St>{' };'}{'\n\n'}
              {'setGames('}<span style={{ background: 'rgba(255,79,40,0.18)', borderRadius: 5, padding: '1px 5px', boxShadow: `inset 0 0 0 1px ${T.accent}` }}>{'['}<At>...games</At>{', yangi]'}</span>{');'}{'\n'}
              <Cm>{'//      ↑ eski hammasi   ↑ yangisi'}</Cm>
            </pre>
          </Col>
          <Col>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <p className="flow-label" style={{ margin: 0 }}>Mening o'yinlarim</p>
              <span className="mono small" style={{ color: T.ink3 }}>{list.length} ta</span>
            </div>
            <Win title="localhost:5173" minH={110}>
              <CardGrid cols={3}>{list.map(g => <MyCard key={g.id} game={g} flash={added > 0 && g.id === list[list.length - 1].id} />)}</CardGrid>
            </Win>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Ro'yxat o'sdi! <span className="mono">[...games, yangi]</span> har safar yangi ro'yxat yasaydi: eskisi + yangisi. React buni ko'radi va kartochkani chizadi.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 5b — TEST 2 (qo'shish) =====
const Screen5b = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Tekshiruv"
    questionText="Ro'yxatga yangi o'yin qo'shish uchun to'g'ri kod qaysi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Mustahkamlash</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Ro'yxatga <span className="italic" style={{ color: T.accent }}>yangi o'yin qo'shish</span> uchun qaysi kod?</h2></>}
    options={['setGames([...games, yangi]) — eski hammasi + yangisi', "games = yangi — ro'yxatni almashtiradi", 'games.length + 1', 'setGames(yangi) — faqat bittasi qoladi']} correctIdx={0}
    explainCorrect="To'g'ri! [...games, yangi] eski ro'yxatning hammasini ko'chiradi va oxiriga yangisini qo'shadi. setGames buni ekranga chiqaradi."
    explainWrong={{
      1: "Yo'q — bunda eski o'yinlar yo'qoladi. [...games, yangi] eskisini ham saqlaydi.",
      2: "Yo'q — bu shunchaki son. Ro'yxatga qo'shish: [...games, yangi].",
      3: "Yo'q — setGames(yangi) bo'lsa ro'yxatda faqat bitta o'yin qoladi. Eskisini saqlash uchun [...games, yangi].",
      default: "Qo'shish = setGames([...games, yangi]): eski hammasi + yangisi."
    }} />
);

// ===== SCREEN 6 — UPDATE (tahrirlash: games.map(... ? {...g} : g)) =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [list, setList] = useState(storedAnswer ? GAMES.slice(0, 3).map((g, i) => i < 2 ? { ...g, top: true } : g) : GAMES.slice(0, 3));
  const [lastId, setLastId] = useState(null);
  const changed = list.filter(g => g.top).length;
  const done = changed >= 2;
  const toggleTop = (id) => { setLastId(id); setList(prev => prev.map(g => g.id === id ? { ...g, top: !g.top } : g)); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Update · tahrirlash" screen={screen} scrollSignal={done} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `2 ta o'yinni TOP qiling (${changed}/2)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bitta o'yin o'zgaradi — <span className="italic" style={{ color: T.accent }}>qolganlari joyida qoladimi</span>?</h2></div>
        <Mentor>Bu yerda <span className="mono">map</span> yana yordam beradi! U <b style={{ color: T.ink }}>har bir o'yindan o'tadi</b>: kerakligini topsa — o'zgartiradi, qolganini <b style={{ color: T.ink }}>o'sha holicha</b> qoldiradi. <span className="mono">{'{...g, top: !g.top}'}</span> — "o'yinni ko'chir, faqat top'ini o'zgartir". Kartochkalardagi 🔥 TOP ni bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <pre className="code-box fade-up delay-1" style={{ lineHeight: 1.95 }}>
              {'setGames(games.map(g =>'}{'\n'}
              {'  g.id === id'}{'\n'}
              {'    ? '}<span style={{ background: 'rgba(255,79,40,0.16)', borderRadius: 5, padding: '1px 5px' }}>{'{ '}<At>...g</At>{', top: !g.top }'}</span>{'  '}<Cm>{'// o\'zgartir'}</Cm>{'\n'}
              {'    : g'}{'             '}<Cm>{'// o\'sha holicha'}</Cm>{'\n'}
              {'));'}
            </pre>
            <div className="code-box" style={{ padding: '9px 13px', minHeight: 38 }}>
              {lastId
                ? <TLine out={<span className="el-in" style={{ display: 'inline-block', color: CODE.str }}>✓ "{list.find(g => g.id === lastId)?.name}" yangilandi — qolganlari o'zgarmadi</span>} />
                : <TLine out={<span style={{ color: CODE.comment, fontStyle: 'italic' }}>kartochkadan 🔥 TOP ni bosing…</span>} />}
            </div>
          </Col>
          <Col>
            <p className="flow-label">Mening o'yinlarim</p>
            <Win title="localhost:5173" minH={120}>
              <CardGrid cols={3}>{list.map(g => <MyCard key={g.id} game={g} onTop={() => toggleTop(g.id)} flash={g.id === lastId} />)}</CardGrid>
            </Win>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Sezdingizmi — faqat <b>siz bosgan</b> o'yin o'zgardi, qolganlari joyida. <span className="mono">map</span> shuning uchun ishonchli: u har birini ko'rib chiqadi, lekin faqat keraklisini almashtiradi.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — DELETE (o'chirish: games.filter(...)) =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const START = GAMES.slice(0, 4);
  const [list, setList] = useState(storedAnswer ? START.slice(0, 2) : START);
  const [lastName, setLastName] = useState(null);
  const removed = START.length - list.length;
  const done = removed >= 1;
  const del = (g) => { setLastName(g.name); setList(prev => prev.filter(x => x.id !== g.id)); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Delete · o'chirish" screen={screen} scrollSignal={done} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Bitta o'yinni o'chiring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Keraksiz o'yinni ro'yxatdan <span className="italic" style={{ color: T.accent }}>qanday</span> olib tashlaymiz?</h2></div>
        <Mentor>Bunga <span className="mono">filter</span> bor — "elak" kabi. U <b style={{ color: T.ink }}>shartga mos kelganlarni</b> o'tkazadi, qolganini tashlab yuboradi. <span className="mono">{'g.id !== id'}</span> = "o'chirilayotganidan <b style={{ color: T.ink }}>boshqa</b> hammasini saqla". Kartochkadagi ✕ ni bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <pre className="code-box fade-up delay-1" style={{ lineHeight: 1.95 }}>
              {'setGames(games.'}<span style={{ background: 'rgba(255,79,40,0.16)', borderRadius: 5, padding: '1px 5px' }}><At>filter</At>{'(g => g.id !== id)'}</span>{');'}{'\n'}
              <Cm>{'// "shu id\'dan boshqa hammasini saqla"'}</Cm>
            </pre>
            <div className="code-box" style={{ padding: '9px 13px', minHeight: 38 }}>
              {lastName
                ? <TLine out={<span className="el-in" style={{ display: 'inline-block', color: CODE.str }}>✓ "{lastName}" o'chirildi — ro'yxatda {list.length} ta qoldi</span>} />
                : <TLine out={<span style={{ color: CODE.comment, fontStyle: 'italic' }}>kartochkadagi ✕ ni bosing…</span>} />}
            </div>
          </Col>
          <Col>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <p className="flow-label" style={{ margin: 0 }}>Mening o'yinlarim</p>
              <span className="mono small" style={{ color: T.ink3 }}>{list.length} ta</span>
            </div>
            <Win title="localhost:5173" minH={120}>
              {list.length ? <CardGrid cols={2}>{list.map(g => <MyCard key={g.id} game={g} onDelete={() => del(g)} />)}</CardGrid>
                : <p style={{ color: T.ink3, fontStyle: 'italic', margin: 0, fontFamily: 'Georgia, serif', fontSize: 13 }}>Ro'yxat bo'sh qoldi…</p>}
            </Win>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}><span className="mono">filter</span> o'chirilgan o'yinsiz yangi ro'yxat yasadi. E'tibor bering: hech narsani "buzib" tashlamaydik — har safar <b>yangi ro'yxat</b> yasaymiz.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — TEST 3 (qaysi amal?) =====
const Screen8 = (props) => (
  <QuestionScreen {...props} idx={8} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="Bitta o'yinni ro'yxatdan o'chirish uchun qaysi kod?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Bitta o'yinni <span className="italic" style={{ color: T.accent }}>o'chirish</span> uchun qaysi kod?</h2></>}
    options={['games.filter(g => g.id !== id) — boshqa hammasini saqlaydi', 'games.map(...) — bittasini o\'zgartiradi', '[...games, yangi] — bittasini qo\'shadi', 'games.length — sonini sanaydi']} correctIdx={0}
    explainCorrect="To'g'ri! filter shartga mos kelganlarni saqlaydi. g.id !== id = 'o'chirilayotganidan boshqa hammasini olib qol' — natijada o'sha o'yin tushib qoladi."
    explainWrong={{
      1: "Yo'q — map o'chirmaydi, o'zgartiradi (Update). O'chirish — filter.",
      2: "Yo'q — bu qo'shish (Create). O'chirish uchun filter.",
      3: "Yo'q — bu shunchaki son. O'chirish: games.filter(g => g.id !== id).",
      default: "O'chirish = games.filter(g => g.id !== id) — o'sha id'dan boshqa hammasini saqlaydi."
    }} />
);

// ===== SCREEN 9 — VIBECODING (AI loyihani quradi, natija ishlaydi) =====
const Screen9 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const TASKS = [
    { id: 't1', label: "Qo'shish tugmasi yasa — bosilganda ro'yxatga yangi o'yin qo'shilsin", plan: ["Tugmaga onClick qo'shaman", "setGames([...games, yangi]) chaqiraman"], code: <>{'setGames('}<At>{'[...games, yangi]'}</At>{')'}</> },
    { id: 't2', label: "Har kartochkaga ❤️ tugma — bosilganda like soni oshsin", plan: ["map ichida o'sha o'yinni topaman", "{...g, likes: g.likes + 1} bilan yangilayman"], code: <>{'games.map(g => g.id === id ? { '}<At>...g</At>{', likes: g.likes + 1 } : g)'}</> },
    { id: 't3', label: "Har kartochkaga ✕ tugma — bosilganda o'chsin", plan: ["filter bilan o'sha o'yinni chiqarib tashlayman"], code: <>{'games.'}<At>filter</At>{'(g => g.id !== id)'}</> }
  ];
  const [task, setTask] = useState(null);
  const [phase, setPhase] = useState(storedAnswer ? 'done' : 'idle');
  const [demo, setDemo] = useState(GAMES.slice(0, 3));
  const timer = useRef(null);
  const done = phase === 'done';
  useEffect(() => () => clearTimeout(timer.current), []);
  const choose = (id) => { clearTimeout(timer.current); setTask(id); setPhase('planned'); setDemo(GAMES.slice(0, 3)); };
  const approve = () => { clearTimeout(timer.current); setPhase('building'); timer.current = setTimeout(() => setPhase('done'), 1300); };
  const cur = TASKS.find(t => t.id === task) || (storedAnswer ? TASKS[0] : null);
  // natija demosi
  const addDemo = () => setDemo(prev => (prev.length >= 4 ? prev : [...prev, POOL[prev.length - 3] || POOL[0]]));
  const likeDemo = (id) => setDemo(prev => prev.map(g => g.id === id ? { ...g, likes: g.likes + 1 } : g));
  const delDemo = (id) => setDemo(prev => prev.filter(g => g.id !== id));
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="AI bilan qurish" screen={screen} scrollSignal={done} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Agent bilan quring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Reja tayyor — endi loyihani <span className="italic" style={{ color: T.accent }}>AI bilan</span> quramiz.</h2></div>
        <Mentor>Siz har amal state'ni qanday o'zgartirishini bilasiz, demak agent kodini <b style={{ color: T.ink }}>tekshira olasiz</b>: qo'shishda <span className="mono">[...games]</span> bormi, o'chirishda <span className="mono">filter</span>mi. Buyruq bering, rejani <b style={{ color: T.ink }}>tasdiqlang</b>, natijani <b style={{ color: T.ink }}>o'zingiz sinang</b>.</Mentor>
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
                <div className="ai-row"><span className="ai-badge" style={{ background: T.ink }}>Agent</span><span className="ai-bubble">{phase === 'planned' ? 'Mana rejam — tasdiqlaysizmi?' : (phase === 'building' ? 'Yozyapman…' : 'Bajardim — natijani sinang')}</span></div>
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
            <p className="flow-label">2. Natija — o'zingiz sinab ko'ring</p>
            <Win title="Mening o'yinlarim — localhost:5173" minH={150}>
              {done && cur ? (
                <div className="fade-step">
                  {cur.id === 't1' && <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}><button className="chip chip-on" style={{ padding: '6px 12px', fontSize: 12 }} onClick={addDemo}>+ O'yin qo'shish</button></div>}
                  <CardGrid cols={3}>
                    {demo.map(g => <MyCard key={g.id} game={g} onLike={cur.id === 't2' ? () => likeDemo(g.id) : undefined} onDelete={cur.id === 't3' ? () => delDemo(g.id) : undefined} />)}
                  </CardGrid>
                  {cur.id === 't1' && <p className="small" style={{ color: T.accent, fontStyle: 'italic', margin: '8px 0 0' }}>"+ O'yin qo'shish"ni bosing — ro'yxat o'sadi.</p>}
                  {cur.id === 't2' && <p className="small" style={{ color: T.accent, fontStyle: 'italic', margin: '8px 0 0' }}>Kartochkadagi ❤️ ni bosing — like oshadi.</p>}
                  {cur.id === 't3' && <p className="small" style={{ color: T.accent, fontStyle: 'italic', margin: '8px 0 0' }}>Kartochkadagi ✕ ni bosing — o'chadi.</p>}
                </div>
              ) : (
                <p style={{ color: T.ink3, fontStyle: 'italic', margin: 0, fontFamily: 'Georgia, serif', fontSize: 13 }}>Buyruq bering va rejani tasdiqlang…</p>
              )}
            </Win>
            {done
              ? <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Ishladi! Kodni o'qing: amal to'g'ri (qo'shish/o'zgartirish/o'chirish), state ko'chirilgan (<span className="mono">...games</span> yoki <span className="mono">filter</span>). Agent ishini <b>sinab</b> qabul qildingiz.</p></div>
              : <p className="body" style={{ margin: 0, color: T.ink3, fontSize: 13 }}>Natija shu yerda jonlanadi — keyin uni o'zingiz sinaysiz.</p>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 10 — O'CHIRISHDAN OLDIN TASDIQ =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [list, setList] = useState(GAMES.slice(0, 3));
  const [asking, setAsking] = useState(null); // o'chirilayotgan o'yin
  const [done, setDone] = useState(!!storedAnswer);
  const [cancelled, setCancelled] = useState(false);
  const confirmDel = () => { setList(prev => prev.filter(g => g.id !== asking.id)); setAsking(null); setDone(true); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Xavfsizlik · tasdiq" screen={screen} scrollSignal={done || !!asking} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Bitta o'yinni o'chiring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Nega o'chirishdan oldin <span className="italic" style={{ color: T.accent }}>"Rostdan?"</span> deb so'raladi?</h2></div>
        <Mentor>O'chirishni <b style={{ color: T.ink }}>qaytarib bo'lmaydi</b> — bitta noto'g'ri bosish, o'yin yo'q. Shuning uchun yaxshi ilovalar avval <b style={{ color: T.ink }}>tasdiq</b> so'raydi. Kartochkadagi ✕ ni bosing — nima bo'lishini ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Mening o'yinlarim</p>
            <Win title="localhost:5173" minH={120}>
              {list.length ? <CardGrid cols={3}>{list.map(g => <MyCard key={g.id} game={g} onDelete={() => { setAsking(g); setCancelled(false); }} />)}</CardGrid>
                : <p style={{ color: T.ink3, fontStyle: 'italic', margin: 0, fontFamily: 'Georgia, serif', fontSize: 13 }}>Bo'sh…</p>}
            </Win>
            <pre className="code-box fade-up delay-1" style={{ lineHeight: 1.9, padding: '10px 14px' }}>
              <Jx>{'if'}</Jx>{' (confirm('}<St>"Rostdan o\'chirilsinmi?"</St>{')) {'}{'\n'}
              {'  setGames(games.filter(...));'}{'\n'}
              {'}'}
            </pre>
          </Col>
          <Col>
            {asking && (
              <div className="frame fade-step" style={{ boxShadow: `inset 0 0 0 1.5px ${T.danger}, 0 8px 22px -6px rgba(${T.shadowBase},0.2)` }}>
                <p className="note-h" style={{ color: T.danger }}>Rostdan o'chirilsinmi?</p>
                <p className="body" style={{ margin: '0 0 12px', color: T.ink }}>"{asking.name}" ro'yxatdan butunlay olib tashlanadi. Buni qaytarib bo'lmaydi.</p>
                <div style={{ display: 'flex', gap: 9 }}>
                  <button className="btn-soft" onClick={() => { setAsking(null); setCancelled(true); }}>Bekor qilish</button>
                  <button className="btn" style={{ background: T.danger }} onClick={confirmDel}>Ha, o'chirilsin</button>
                </div>
              </div>
            )}
            {cancelled && !asking && !done && <div className="hint fade-step"><p className="body" style={{ margin: 0, color: T.ink2 }}>Bekor qildingiz — hech narsa o'zgarmadi. Bu ham muhim: tasdiq sizni xatodan saqladi. Tayyor bo'lsangiz, yana ✕ ni bosing.</p></div>}
            {!asking && !done && !cancelled && <div className="hint fade-up delay-2"><p className="body" style={{ margin: 0, color: T.ink2 }}>Maslahat: foydalanuvchini o'zidan himoya qiling — muhim amaldan oldin doim <b style={{ color: T.ink }}>so'rang</b>.</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana yaxshi ilova: avval <b>so'radi</b>, keyin <b>o'chirdi</b>. Bitta bosishda muhim narsa yo'qolmasin. Siz ham o'z ilovangizda shunday qilasiz.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — AMALIYOT: O'Z LOYIHANGIZNI BITIRING (to'liq CRUD) =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [list, setList] = useState(storedAnswer ? [...GAMES.slice(0, 2), POOL[0]] : GAMES.slice(0, 2));
  const [didAdd, setDidAdd] = useState(!!storedAnswer);
  const [didTop, setDidTop] = useState(!!storedAnswer);
  const [didDel, setDidDel] = useState(!!storedAnswer);
  const done = didAdd && didTop && didDel;
  const remaining = POOL.filter(p => !list.some(g => g.id === p.id));
  const add = (g) => { setList(prev => [...prev, g]); setDidAdd(true); };
  const top = (id) => { setList(prev => prev.map(g => g.id === id ? { ...g, top: !g.top } : g)); setDidTop(true); };
  const del = (id) => { setList(prev => prev.filter(g => g.id !== id)); setDidDel(true); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const Tick = ({ ok, label }) => (
    <span className="tagpill" style={{ color: ok ? T.success : T.ink3, boxShadow: ok ? `0 3px 10px -5px rgba(31,122,77,0.3)` : undefined }}>{ok ? '✓' : '○'} {label}</span>
  );
  return (
    <Stage eyebrow="Amaliyot · loyihani bitirish" screen={screen} scrollSignal={done} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : '3 amalni ham bajaring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(8px,1.2vw,12px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Endi o'zingiz — loyihani <span className="italic" style={{ color: T.accent }}>to'liq boshqaring</span>.</h2></div>
        <Mentor>Mana sizning ilovangiz. Uchala amalni ham sinang: bitta o'yin <b style={{ color: T.ink }}>qo'shing</b>, bittasini <b style={{ color: T.ink }}>🔥 TOP</b> qiling, bittasini <b style={{ color: T.ink }}>✕ o'chiring</b>. Uchalasi bajarilsa — loyihangiz tayyor!</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Qo'shish uchun</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {remaining.length ? remaining.map(g => <button key={g.id} className="gchip" onClick={() => add(g)}>+ {g.emoji} {g.name}</button>) : <span className="small" style={{ color: T.ink3, fontStyle: 'italic' }}>Hammasi qo'shildi</span>}
            </div>
            <p className="flow-label" style={{ margin: '4px 0 0' }}>Bajarildi</p>
            <div className="fade-up delay-2" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              <Tick ok={didAdd} label="Qo'shdim" /><Tick ok={didTop} label="TOP qildim" /><Tick ok={didDel} label="O'chirdim" />
            </div>
          </Col>
          <Col>
            <p className="flow-label">Mening o'yinlarim</p>
            <Win title="localhost:5173" minH={130}>
              {list.length ? <CardGrid cols={2}>{list.map(g => <MyCard key={g.id} game={g} onTop={() => top(g.id)} onDelete={() => del(g.id)} />)}</CardGrid>
                : <p style={{ color: T.ink3, fontStyle: 'italic', margin: 0, fontFamily: 'Georgia, serif', fontSize: 13 }}>Bo'sh — o'yin qo'shing…</p>}
            </Win>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>🎉 Loyihangiz tayyor! Siz to'liq CRUD ilovani boshqardingiz: qo'shdingiz, o'zgartirdingiz, o'chirdingiz — hammasi state bilan.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — TEST 4 (stsenariy → amal) =====
const Screen12 = (props) => (
  <QuestionScreen {...props} idx={12} scope="module-mikro" eyebrow="Mashq · 4-savol"
    questionText="O'yinning like sonini oshirish — bu CRUD'ning qaysi amali?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>O'yinning <span className="italic" style={{ color: T.accent }}>like sonini oshirish</span> — qaysi amal?</h2></>}
    options={['Update — mavjud o\'yinni o\'zgartirish', 'Create — yangi o\'yin qo\'shish', 'Delete — o\'yinni o\'chirish', 'Read — ro\'yxatni ko\'rsatish']} correctIdx={0}
    explainCorrect="To'g'ri! Like soni o'zgaradi, lekin o'yin o'sha o'yinligicha qoladi — bu Update. games.map bilan faqat o'sha elementni yangilaymiz."
    explainWrong={{
      1: "Yo'q — yangi o'yin qo'shilmayapti, mavjudi o'zgaryapti. Bu Update.",
      2: "Yo'q — o'yin o'chmayapti, like'i o'zgaryapti. Bu Update.",
      3: "Read — faqat ko'rsatish. Bu yerda esa o'zgartirish bor — Update.",
      default: "Mavjud narsani o'zgartirish = Update (games.map)."
    }} />
);

// ===== SCREEN 13 — DEBUGGING (mutatsiya: games.push → setGames([...games])) =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [picked, setPicked] = useState(storedAnswer ? 'push' : null);
  const [fixed, setFixed] = useState(!!storedAnswer);
  const [clicks, setClicks] = useState(0);
  const found = picked === 'push';
  const done = fixed;
  const base = GAMES.slice(0, 2);
  // tuzatilmaguncha — bossang ham ro'yxat o'zgarmaydi (mutatsiya: React ko'rmaydi)
  const shown = fixed ? [...base, ...Array.from({ length: clicks }, (_, i) => POOL[i] || POOL[0])] : base;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Debugging" screen={screen} scrollSignal={found || fixed} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : (found ? 'Endi tuzating' : 'Xatoni toping')} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">AI yordam beradi — siz esa <span className="italic" style={{ color: T.accent }}>tekshirasiz</span>.</h2></div>
        <Mentor>AI "Qo'shish"ni yozdi — lekin tugmani bosganda <b style={{ color: T.ink }}>hech narsa bo'lmayapti</b>! O'yin qo'shilmaydi. <b style={{ color: T.ink }}>State darsini</b> eslang: ro'yxatni to'g'ridan-to'g'ri o'zgartirsangiz, React buni <b style={{ color: T.ink }}>ko'rmaydi</b>. Qaysi qatorda shu xato?</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="ai-card fade-up delay-2">
              <div className="ai-row"><span className="ai-badge">AI</span><span className="ai-bubble">Qo'shish kodini yozdim:</span></div>
              <div className="ai-code">
                <div className={`ai-line ${picked === 'obj' ? 'ok' : ''}`} onClick={() => { if (!found) setPicked('obj'); }}><Jx>{'const'}</Jx>{' yangi = { name: '}<St>"Piggy"</St>{' };'}</div>
                {!fixed ? (
                  <div className={`ai-line ${found ? 'bad' : ''}`} onClick={() => { if (!found) setPicked('push'); }}>{'games.'}<At>push</At>{'(yangi);'}{'  '}<Cm>{'// ro\'yxatga tiqib qo\'ydi'}</Cm></div>
                ) : (
                  <div className="ai-line ok el-in">{'setGames('}<At>{'[...games, yangi]'}</At>{');'}{'  '}<Cm>{'// yangi ro\'yxat — React ko\'radi!'}</Cm></div>
                )}
                {!fixed && <div className={`ai-line ${picked === 'set' ? 'ok' : ''}`} onClick={() => { if (!found) setPicked('set'); }}>{'setGames(games);'}{'  '}<Cm>{'// o\'sha ro\'yxat...'}</Cm></div>}
              </div>
              {!found && <p className="ai-prompt">Ro'yxat nega yangilanmayapti? Xato qatorni bosing.</p>}
              {found && !fixed && <button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={() => { setFixed(true); setClicks(0); }}>🔧 setGames([...games, yangi]) ga almashtirish</button>}
              {fixed && <p className="ai-prompt" style={{ color: T.success, fontStyle: 'normal', fontWeight: 600 }}>✓ Tuzatildi — endi yangi ro'yxat yasaladi, React ko'radi!</p>}
            </div>
          </Col>
          <Col>
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button className="chip" style={{ padding: '6px 12px', fontSize: 12 }} disabled={clicks >= 2} onClick={() => setClicks(c => Math.min(c + 1, 2))}>+ Qo'shish</button>
            </div>
            <Win title="localhost:5173" minH={110}>
              <CardGrid cols={3}>{shown.map((g, i) => <MyCard key={`${g.id}-${i}`} game={g} />)}</CardGrid>
            </Win>
            {!found && (
              (picked === 'obj' || picked === 'set')
                ? <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bu qator{picked === 'obj' ? ' to\'g\'ri — yangi o\'yin tayyorlandi' : ' o\'zi xato emas, lekin oldingi qator ro\'yxatni allaqachon buzgan'}. Yana qarang: <span className="mono">games</span>'ni <b>to'g'ridan-to'g'ri</b> o'zgartirayotgan qator qaysi?</p></div>
                : <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>"+ Qo'shish"ni bosing — son o'zgarmaydi. <span className="mono" style={{ color: T.ink }}>push</span> eski ro'yxatni <b style={{ color: T.ink }}>buzadi</b>, yangisini yasamaydi — React esa faqat yangi ro'yxatni sezadi.</p></div>
            )}
            {found && !fixed && <div className="frame-warn fade-step"><p className="note-h" style={{ color: T.accent }}>✓ Topdingiz!</p><p className="body" style={{ margin: 0, color: T.ink }}><span className="mono">games.push(yangi)</span> — eski ro'yxatni o'zgartiradi, lekin React uchun u <b>o'sha ro'yxat</b> — qayta chizmaydi. To'g'risi: <span className="mono">setGames([...games, yangi])</span> — yangi ro'yxat. Chapdagi tugma bilan tuzating →</p></div>}
            {fixed && <div className="takeaway fade-step"><div className="ta-bulb">🛠️</div><p className="ta-h">Topdingiz va tuzatdingiz — bu debugging!</p><p className="ta-sub">AI tez yozadi, siz tekshirib tuzatasiz — zo'r jamoa</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — YAKUNIY (VS Code: setGames([...games, yangi])) =====
const Screen14 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [value, setValue] = useState(storedAnswer?.picked || '');
  const [passed, setPassed] = useState(!!storedAnswer?.correct);
  const norm = value.replace(/\s+/g, ' ').trim();
  const valid = /^setGames\(\s*\[\s*\.\.\.\s*games\s*,\s*yangi\s*\]\s*\)\s*;?$/.test(norm);
  const hasSet = /setGames\s*\(/.test(value);
  const hasSpread = /\[\s*\.\.\.\s*games/.test(value);
  const hasNew = /,\s*yangi\s*\]/.test(value);
  const pushBug = /\bgames\s*\.\s*push\b/.test(value);
  useEffect(() => {
    if (valid && !passed) {
      setPassed(true);
      onAnswer(screen, { stage: 'final', screenIdx: screen, question: 'VS Code: setGames([...games, yangi]) ni yozing', studentAnswer: value, correct: true, firstAttemptCorrect: true, solved: true, picked: value });
    }
  }, [valid]);
  const Ln = ({ n, children }) => (
    <div className="vsc-line"><span className="vsc-ln">{n}</span><span style={{ whiteSpace: 'pre' }}>{children}</span></div>
  );
  return (
    <Stage eyebrow="Yakuniy · amaliy" screen={screen} scrollSignal={passed} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!passed} label={passed ? 'Davom etish' : 'Qo\'shish qatorini yozing'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Oxirgi qadam: <span className="italic" style={{ color: T.accent }}>qo'shish</span> kodini o'zingiz yozing.</h2></div>
        <Mentor>VS Code'da <span className="mono">App.jsx</span> ochiq: forma tayyor, yangi o'yin <span className="mono">yangi</span>'da turibdi — faqat <b style={{ color: T.ink }}>3-qator bo'sh</b>. Uni ro'yxatga qo'shing: <b style={{ color: T.ink }}>setGames(</b> + <b style={{ color: T.ink }}>[...games</b> (eski hammasi) + <b style={{ color: T.ink }}>, yangi]</b> (yangisi) + <b style={{ color: T.ink }}>)</b>.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="vsc fade-up delay-2">
              <div className="vsc-bar">
                <span className="vsc-tab on"><span style={{ color: '#61DAFB' }}>⚛</span> App.jsx <span style={{ color: '#6E7681', marginLeft: 4 }}>×</span></span>
                <span className="vsc-tab">MyCard.jsx</span>
              </div>
              <div className="vsc-body">
                <Ln n={1}><Jx>{'function'}</Jx><span style={{ color: '#DCDCAA' }}> qoshish</span>{'() {'}</Ln>
                <Ln n={2}>{'  '}<Jx>{'const'}</Jx>{' yangi = { name: '}<St>'Piggy'</St>{' };'}</Ln>
                <div className="vsc-line">
                  <span className="vsc-ln">3</span>
                  <span style={{ whiteSpace: 'pre' }}>{'  '}</span>
                  <input className={`vsc-input ${valid ? 'ok' : ''}`} value={value} onChange={e => setValue(e.target.value)} placeholder='setGames([...games, yangi])' spellCheck={false} autoCapitalize="off" autoCorrect="off" />
                </div>
                <Ln n={4}>{'}'}</Ln>
              </div>
            </div>
            <div className="fade-up delay-2" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="tagpill" style={{ opacity: hasSet ? 1 : 0.4 }}>{hasSet ? '✓' : '1'} setGames(</span>
              <span className="tagpill" style={{ opacity: hasSpread ? 1 : 0.4 }}>{hasSpread ? '✓' : '2'} [...games</span>
              <span className="tagpill" style={{ opacity: hasNew ? 1 : 0.4 }}>{hasNew ? '✓' : '3'} , yangi]</span>
            </div>
            {pushBug && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Esingizdami? <span className="mono">games.push</span> ishlamaydi — React ko'rmaydi. Yangi ro'yxat kerak: <span className="mono">setGames([...games, yangi])</span>.</p></div>}
            {passed && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Mukammal! Qo'shish ishladi — eski hammasi + yangisi. To'liq CRUD ilovasi sizning qo'lingizda.</p></div>}
          </Col>
          <Col>
            <p className="flow-label">natija — localhost:5173</p>
            <Win title="Mening o'yinlarim — localhost:5173" minH={130}>
              {valid
                ? <div className="fade-step"><CardGrid cols={3}><MyCard game={GAMES[0]} /><MyCard game={GAMES[1]} /><MyCard game={{ ...POOL[0] }} flash /></CardGrid><p className="small" style={{ color: T.success, fontWeight: 700, margin: '8px 0 0' }}>✓ "Piggy" qo'shildi!</p></div>
                : <p style={{ fontFamily: 'Georgia, serif', color: T.ink3, fontStyle: 'italic', margin: 0, textAlign: 'center', lineHeight: 1.5 }}>3-qator yozilmaguncha qo'shish ishlamaydi: <span className="mono" style={{ fontStyle: 'normal' }}>setGames([...games, yangi])</span></p>}
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
    "CRUD = ilovaning 4 amali: Create · Read · Update · Delete",
    "Create — qo'shish: setGames([...games, yangi])",
    "Update — tahrirlash: games.map(... ? {...g} : g)",
    "Delete — o'chirish: games.filter(g => g.id !== id)",
    "Ro'yxatni buzma — har safar YANGI ro'yxat yasa (React shuni ko'radi)"
  ];
  const HOMEWORK = [
    { b: 'To\'liq CRUD', t: "— Antigravity bilan o'z ro'yxatingizga qo'shish, tahrirlash, o'chirishni qo'shing" },
    { b: 'Tasdiq', t: "— o'chirishdan oldin 'Rostdan?' deb so'rang" },
    { b: 'Tekshiring', t: "— qo'shishda [...games] bormi, o'chirishda filter'mi — o'zingiz nazorat qiling" }
  ];
  const GLOSSARY = [
    { b: 'CRUD', t: '— Create, Read, Update, Delete: 4 amal' },
    { b: 'Create', t: '— qo\'shish: [...games, yangi]' },
    { b: 'Read', t: '— ko\'rsatish: games.map(...)' },
    { b: 'Update', t: '— o\'zgartirish: games.map(... ? {...g} : g)' },
    { b: 'Delete', t: '— o\'chirish: games.filter(...)' },
    { b: '...games (spread)', t: '— eski ro\'yxatning hammasini ko\'chirish' },
    { b: 'filter', t: '— shartga mos kelganlarni saqlash (elak)' },
    { b: 'Mutatsiya', t: '— ro\'yxatni buzish (push) — React ko\'rmaydi, ishlatma' }
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
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">✓</span> Birinchi loyihangiz bitdi</span><h2 className="title h-title fade-up d1">To'liq ilovani <span className="italic" style={{ color: T.accent }}>o'zingiz bitirdingiz</span>.</h2><p className="body h-sub fade-up d2">{PASSED ? "Tabriklaymiz! Endi siz qo'sha, tahrirlay va o'chira oladigan haqiqiy ilova quryapsiz — CRUD sizning qo'lingizda." : "Yaxshi harakat! Create, Update va Delete'ni mustahkamlash uchun bir-ikki ekranni qayta ko'ring."}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span className="tick" style={{ width: 16, height: 16, borderRadius: '50%', background: T.success, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck">✓</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>📝 Uyga vazifa</div><p className="body" style={{ margin: '0 0 10px', color: T.ink }}>Antigravity bilan o'z loyihangizda sinang:</p><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">⚠️ Lekin sahifani yangilang — ro'yxatingiz YO'QOLADI! Chunki hammasi faqat xotirada. Keyingi darsda buni hal qilamiz: server — ma'lumot abadiy saqlanadigan joy. 🚀</p></div>
        </div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">💡 Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function ReactCrudPracticeLesson({ lang: langProp, onFinished }) {
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

        /* === VCARD (CRUD amal tugmasi) === */
        .vcard { display: flex; align-items: center; gap: 11px; width: 100%; text-align: left; background: ${T.paper}; border: none; border-radius: 12px; padding: 12px 15px; cursor: pointer; transition: all 0.18s; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.16); }
        .vcard:hover { transform: translateY(-1px); }
        .vbadge { font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 11px; color: #fff; padding: 4px 9px; border-radius: 6px; letter-spacing: 0.02em; }
        .vlbl { font-family: 'Manrope', sans-serif; font-weight: 700; font-size: 13.5px; color: ${T.ink}; }
        .vseen { margin-left: auto; font-weight: 700; }

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

        /* === PRAKTIKA · CRUD CSS === */
        .bp-bar { background: #f0eee8; padding: 8px 11px; display: flex; align-items: center; gap: 9px; }
        .bb-dots { display: flex; gap: 5px; }
        .bb-dots i { width: 9px; height: 9px; border-radius: 50%; }
        .bb-dots i:first-child { background: #ff5f57; } .bb-dots i:nth-child(2) { background: #febc2e; } .bb-dots i:nth-child(3) { background: #28c840; }
        .bp-title { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink3}; }
        .bp-body { padding: clamp(12px,2.2vw,18px); }
        .code-box { background: ${CODE.bg}; color: ${CODE.text}; font-family: 'JetBrains Mono', monospace; font-size: clamp(12px,1.5vw,13.5px); line-height: 1.55; padding: clamp(12px,2.2vw,16px); border-radius: 12px; overflow-x: auto; white-space: pre-wrap; word-break: break-word; margin: 0; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.2); }
        /* O'yin kartochkasi */
        .rocard { border-radius: 12px; background: #fff; box-shadow: 0 4px 14px -4px rgba(0,0,0,0.16); overflow: hidden; border: 1px solid rgba(0,0,0,0.05); transition: transform 0.15s, box-shadow 0.15s; }
        .rothumb { height: 54px; display: flex; align-items: center; justify-content: center; position: relative; }
        .topbadge { position: absolute; top: 4px; left: 6px; font-family: 'Manrope', sans-serif; font-weight: 800; font-size: 8.5px; color: #fff; background: rgba(14,14,16,0.72); padding: 2px 7px; border-radius: 99px; letter-spacing: 0.04em; }
        .robody { padding: 7px 9px 9px; }
        .roname { font-family: 'Manrope', sans-serif; font-weight: 800; font-size: 12px; color: ${T.ink}; margin: 0 0 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .rostats { display: flex; align-items: center; gap: 8px; font-family: 'Manrope', sans-serif; font-size: 10.5px; color: ${T.ink3}; font-weight: 600; }
        @keyframes heart-pop { 0% { transform: scale(1); } 40% { transform: scale(1.4); } 100% { transform: scale(1); } }
        .hpop { animation: heart-pop 0.4s ease; display: inline-block; }
        /* Kartochka amal tugmalari */
        .cardx { position: absolute; top: 4px; right: 5px; width: 20px; height: 20px; border-radius: 50%; border: none; background: rgba(14,14,16,0.5); color: #fff; font-size: 10px; cursor: pointer; display: flex; align-items: center; justify-content: center; line-height: 1; transition: background 0.15s; z-index: 2; }
        .cardx:hover { background: ${T.danger}; }
        .cardacts { display: flex; gap: 5px; margin-top: 6px; }
        .cardbtn { flex: 1; border: none; background: ${T.bg}; border-radius: 7px; padding: 5px 4px; font-family: 'Manrope', sans-serif; font-size: 10.5px; font-weight: 700; color: ${T.ink2}; cursor: pointer; transition: all 0.15s; }
        .cardbtn:hover { background: #EFEBE3; color: ${T.ink}; transform: translateY(-1px); }
        /* Route/qator (loyihalash ro'yxati) */
        .routerow { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 11px; transition: all 0.3s; }
        /* Silkinish (xato tanlov / ishlamaydigan tugma) */
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
