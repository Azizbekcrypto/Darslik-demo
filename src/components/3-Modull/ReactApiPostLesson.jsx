import React, { useState, useEffect, useRef, createContext, useContext, useCallback } from 'react';
import mentorImg from '../../assets/common/mentor.png';

// ============================================================
// REACT MODULI · 6-DARS — API: POST/PUT/DELETE — SERVERGA YUBORISH — PLATFORM STANDARD v16 (AUDIOSIZ)
// Mavzu: so'rov fe'llari (method): GET o'qiydi, POST qo'shadi, PUT almashtiradi, DELETE o'chiradi;
//        fetch'ning 2-argumenti (sozlamalar qutisi), body + JSON.stringify (.json()ning teskarisi),
//        201 Created, ID (/games/2), DELETE tasdiqlash (qaytarilmaydi), CRUD nomi yakunda ochiladi.
// Misol sayt: robo-games (davom) — o'quvchi endi O'YINCHI emas, DEVELOPER tomonida:
//        o'z o'yinini serverga qo'shadi, tuzatadi, o'chiradi. L5 teaseri shu yerda bajariladi.
// Ekranlar 19 ta (s7 ID va s10 like-persist qo'shimcha o'rta sahifalar — user ruxsati bilan).
// Animatsiyalar: posilka endi TESKARI uchadi (siz→server, .fly-right), server jadvali jonli
//        (srow-new/changed/del), 4 qadamli POST parvozi (stringify→uchish→201→katalog),
//        like persist (PUT→refresh→turibdi), DELETE fade-out + confirm dialog.
// Oldingi darslar bilan bog'lanish: GET/fetch/.json()/404/skeleton (5-dars), state/setGames (3-dars),
//        map (4-dars), "refresh→yo'qoldi" muammosi (State darsi) — endi serverda saqlanadi.
// MUHIM: kelgusi darslar ro'yxati o'quvchiga AYTILMAYDI — faqat yakunda teaser.
// AUDIOSIZ: ovoz (TTS) yo'q — platforma qarori.
// Yakuniy ekran (s16): o'z o'yiniga nom+emoji berib, VS Code'da method: 'POST', ni yozish →
//        o'z kartochkasi katalogda paydo bo'ladi (payoff).
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

const LESSON_META = { lessonId: 'react-api-post-06-v16', lessonTitle: { uz: "API: POST/PUT/DELETE — serverga ma'lumot yuborish", ru: 'Работа с API — POST/PUT/DELETE' } };
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
  { id: 's11', type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's12', type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's13', type: 'case',        template: 'custom',   scored: false, scope: null },
  { id: 's14', type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's15', type: 'rule',        template: 'custom',   scored: false, scope: null },
  { id: 's16', type: 'test',        template: 'custom',   scored: true,  scope: 'final' },
  { id: 's17', type: 'summary',     template: 'custom',   scored: false, scope: null }
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
// To'rt so'rov fe'li (method) — rang va vazifa bilan
const VERBS = {
  GET: { col: '#019ACB', soft: '#E2F4FA', t: 'OLADI', desc: "ro'yxatni o'qib olib keladi — hech narsani o'zgartirmaydi" },
  POST: { col: '#1F7A4D', soft: '#E3F0E8', t: "QO'SHADI", desc: "yangi yozuv yaratadi — posilka (body) bilan keladi" },
  PUT: { col: '#B45309', soft: '#FBEEDB', t: 'ALMASHTIRADI', desc: "mavjud yozuvni yangisiga almashtiradi — ID kerak" },
  DELETE: { col: '#C2362B', soft: '#FAE3E0', t: "O'CHIRADI", desc: "yozuvni butunlay olib tashlaydi — ID kerak, body kerak emas" }
};
const VKEYS = ['GET', 'POST', 'PUT', 'DELETE'];
// Server jadvali qatori (id + nom) — holatlar: read/new/changed/del
const SrvRow = ({ id, name, state, extra }) => (
  <div className={`srow ${state ? `srow-${state}` : ''}`}>
    <span className="srid">{id}</span>
    <span className="srname">{name}</span>
    {extra && <span className="srextra">{extra}</span>}
  </div>
);
// O'yin kartochkasi (bu darsda: likes override + bosiladigan 👍)
const RoCard = ({ name, emoji, players, top, likes, onLike }) => {
  const g = gameByName(name);
  const bg = g ? g.bg : 'linear-gradient(135deg,#8E9BB5,#4A5670)';
  const em = emoji || (g ? g.emoji : '🎮');
  const pct = likes != null ? likes : (g ? g.likes : 88);
  return (
    <div className="rocard el-in" style={{ position: 'relative' }}>
      <div className="rothumb" style={{ background: bg }}>
        <span style={{ fontSize: 26 }}>{em}</span>
        {top && <span className="topbadge el-in">🔥 TOP</span>}
      </div>
      <div className="robody">
        <p className="roname">{name}</p>
        <div className="rostats">
          <span key={pct} className={onLike ? 'hpop' : undefined} onClick={onLike} style={onLike ? { cursor: 'pointer', fontWeight: 700, color: T.ink } : undefined}>👍 {pct}%</span>
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

// ===== SCREEN 0 — HOOK (siz o'yin yaratdingiz — GET uni katalogga chiqarmadi!) =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [fetched, setFetched] = useState(!!storedAnswer);
  const [loading, setLoading] = useState(false);
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const doGet = () => {
    if (loading) return;
    setLoading(true); setFetched(false);
    timer.current = setTimeout(() => { setLoading(false); setFetched(true); }, 1100);
  };
  const OPTS = [
    { id: 'a', label: 'Internet sekin ishladi' },
    { id: 'b', label: "GET faqat OLADI — serverga hech narsa yubormaydi" },
    { id: 'c', label: 'Server sizning oʻyiningizni yoqtirmadi' }
  ];
  const pick = (v) => { if (picked !== null || !fetched) return; setPicked(v); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: true }); };
  return (
    <Stage eyebrow="Kirish" screen={screen} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 800 }}>Siz o'yin yaratdingiz. Nega u katalogga <span className="italic" style={{ color: T.accent }}>chiqmayapti</span>?</h1>
        <Mentor>O'tgan darsda <b style={{ color: T.ink }}>katalogni</b> — robo-games sahifasidagi, hammaga ko'rinadigan o'yinlar ro'yxatini — serverdan <span className="mono">fetch</span> bilan oldik. Mana sizning yangi o'yiningiz — <b style={{ color: T.ink }}>Robo Race</b>, kompyuteringizda tayyor turibdi. GET so'rovini yuborib ko'ring — katalogga chiqarmikan?</Mentor>
        <Zoomable>
        <Split>
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ maxWidth: 150, flexShrink: 0 }}>
                <p className="flow-label" style={{ marginBottom: 6 }}>Sizning kompyuteringizda</p>
                <div className="frame-dash" style={{ padding: 8 }}><RoCard name="Robo Race" emoji="🤖" likes={100} /></div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button className="btn" onClick={doGet} disabled={loading}>{loading ? "So'rov yo'lda…" : (fetched ? '↻ Yana GET yuborish' : 'GET bilan olish')}</button>
                {fetched && <span className="mono small fade-step" style={{ color: T.ink2 }}>GET /games → 200 OK</span>}
              </div>
            </div>
            <p className="flow-label" style={{ margin: 0 }}>robo-games — katalog</p>
            <Win title="robo-games — localhost:5173" minH={96}>
              {loading && <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}><SkelCard /><SkelCard /><SkelCard /></div>}
              {!loading && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  <RoCard name="Adopt Me!" />
                  <RoCard name="Doors" />
                  <RoCard name="Piggy" />
                </div>
              )}
            </Win>
            {fetched && <p className="small fade-step" style={{ color: T.accent, fontStyle: 'italic', margin: 0 }}>Katalog keldi… lekin Robo Race ICHIDA YO'Q!</p>}
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Sizningcha, nega chiqmadi?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => {
                const on = picked === o.id;
                return (
                  <button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null || !fetched} style={{ opacity: !fetched ? 0.55 : 1 }} onClick={() => pick(o.id)}>
                    <span className="radio">{on && <span className="radio-dot" />}</span>
                    <span>{o.label}</span>
                  </button>
                );
              })}
            </div>
            {!fetched && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>Avval GET yuborib ko'ring ←</p>}
            {picked !== null && <p className="hook-ack fade-step">Aynan! GET — <b>faqat o'qiydi</b>: serverga boradi, bor narsani olib keladi. Sizning o'yiningiz esa hali serverga <b>yetib bormagan</b>. Bugun yuborishni o'rganamiz: <b>POST, PUT, DELETE</b>.</p>}
          </Col>
        </Split>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA (developer tomoniga o'tamiz) =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const STEPS = [
    { text: "So'rov fe'llari — 4 buyruq", tag: 'GET · POST · PUT · DELETE' },
    { text: "POST — yangi qo'shish", tag: "method: 'POST'" },
    { text: 'Posilka yuki — body', tag: 'JSON.stringify(yangi)' },
    { text: 'PUT — almashtirish', tag: '/games/2 + ID' },
    { text: "DELETE — o'chirish", tag: 'tasdiqlash bilan' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const PreviewBlock = (
    <Col>
      <p className="flow-label">Dars oxirida — sizning o'yiningiz serverda</p>
      <Win title="robo-games — localhost:5173" minH={92}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
          <RoCard name="Adopt Me!" />
          <RoCard name="Doors" />
          <RoCard name="Robo Race" emoji="🤖" likes={100} top />
        </div>
      </Win>
      <pre className="code-box" style={{ padding: '10px 14px' }}>{'fetch(url, { '}<At>method</At>{': '}<St>'POST'</St>{', '}<At>body</At>{': … })'}</pre>
      <p className="mono small" style={{ color: T.accent, margin: 0 }}>→ endi siz serverga buyruq berasiz</p>
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
          <h2 className="title h-title fade-up">Bugun siz o'yinchi emas — <span className="italic" style={{ color: T.accent }}>developer</span> bo'lasiz.</h2>
        </div>
        <Mentor>Va'da beraman: dars oxirida <b style={{ color: T.ink }}>o'z o'yiningizni serverga joylaysiz</b> — u katalogda hammaga ko'rinadi. Yo'lda yana ikkita kuch olasiz: xatoni <b style={{ color: T.ink }}>tuzatish</b> (PUT) va keraksizini <b style={{ color: T.ink }}>o'chirish</b> (DELETE).</Mentor>
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

// ===== SCREEN 2 — TO'RT FE'L (GET/POST/PUT/DELETE jonli demo) =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(storedAnswer ? new Set(VKEYS) : new Set());
  const done = seen.size >= 4;
  const tap = (k) => { setActive(k); setSeen(prev => { const s = new Set(prev); s.add(k); return s; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const CONSOLE = {
    GET: <span style={{ color: CODE.str }}>200 OK — 3 qator o'qildi</span>,
    POST: <span style={{ color: CODE.str }}>201 Created — yangi qator qo'shildi</span>,
    PUT: <span style={{ color: CODE.str }}>200 OK — 2-qator almashtirildi</span>,
    DELETE: <span style={{ color: CODE.str }}>200 OK — 3-qator o'chirildi</span>
  };
  return (
    <Stage eyebrow="Fe'llar" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/4 fe'lni sinang`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(8px,1.2vw,12px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Serverga necha xil <span className="italic" style={{ color: T.accent }}>buyruq</span> berish mumkin?</h2></div>
        <Mentor>To'rtta! Har so'rovning <b style={{ color: T.ink }}>fe'li (method)</b> bor — server shu fe'lga qarab nima qilishni biladi. Hozirgacha bittasini bilardingiz: GET. <b style={{ color: T.ink }}>To'rtalasini bosib</b>, server jadvaliga nima bo'lishini kuzating.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {VKEYS.map(k => {
                const v = VERBS[k];
                const on = active === k;
                return (
                  <button key={k} className="vcard" onClick={() => tap(k)} style={{ boxShadow: on ? `inset 0 0 0 1.5px ${v.col}, 0 8px 20px -6px rgba(${T.shadowBase},0.2)` : undefined }}>
                    <span className="vbadge" style={{ background: v.col }}>{k}</span>
                    <span className="vlbl">{v.t}</span>
                    <span className="vseen" style={{ color: seen.has(k) ? T.success : T.ink3 }}>{seen.has(k) ? '✓' : ''}</span>
                  </button>
                );
              })}
            </div>
            {active && <div className="sk-info" key={active}><p className="body" style={{ margin: 0, color: T.ink }}><b style={{ color: VERBS[active].col }}>{active}</b> — {VERBS[active].desc}.</p></div>}
          </Col>
          <Col>
            <p className="flow-label">robo-api.uz — server jadvali</p>
            <div className="code-box fade-up delay-2" style={{ padding: '11px 13px', display: 'flex', flexDirection: 'column', gap: 5 }}>
              <SrvRow id={1} name="Adopt Me!" state={active === 'GET' ? 'read' : null} />
              <SrvRow id={2} name={active === 'PUT' ? 'Doors 2.0' : 'Doors'} state={active === 'GET' ? 'read' : (active === 'PUT' ? 'changed' : null)} extra={active === 'PUT' ? 'yangilandi' : null} />
              <SrvRow id={3} name="Piggy" state={active === 'GET' ? 'read' : (active === 'DELETE' ? 'del' : null)} extra={active === 'DELETE' ? "o'chirildi" : null} />
              {active === 'POST' && <SrvRow id={4} name="Robo Race" state="new" extra="+ yangi" />}
            </div>
            <div className="code-box" style={{ padding: '9px 13px', minHeight: 40 }}>
              {active
                ? <TLine out={<span className="el-in" style={{ display: 'inline-block' }}><span style={{ color: VERBS[active].col, fontWeight: 700 }}>{active}</span> /games{(active === 'PUT' || active === 'DELETE') ? <span style={{ color: CODE.attr }}>/{active === 'PUT' ? 2 : 3}</span> : ''} → {CONSOLE[active]}</span>} />
                : <TLine out={<span style={{ color: CODE.comment, fontStyle: 'italic' }}>chapdan fe'lni tanlang…</span>} />}
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bular — <b>HTTP fe'llari</b>. Manzil bitta (<span className="mono">/games</span>), fe'l har xil — server har safar boshqa ish qiladi. Endi har birini alohida o'rganamiz.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — POST (posilka endi teskari uchadi + 2-argument) =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [phase, setPhase] = useState(storedAnswer ? 2 : 0); // 0 idle, 1 uchmoqda, 2 yetib bordi
  const [running, setRunning] = useState(false);
  const timer = useRef(null);
  const done = phase >= 2;
  useEffect(() => () => clearTimeout(timer.current), []);
  const send = () => {
    if (running) return;
    clearTimeout(timer.current); setRunning(true); setPhase(1);
    timer.current = setTimeout(() => { setPhase(2); setRunning(false); }, 1000);
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="POST" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Posilkani yuboring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Ma'lumot posilkasi endi <span className="italic" style={{ color: T.accent }}>qaysi tomonga</span> uchadi?</h2></div>
        <Mentor>O'tgan darsda <b style={{ color: T.ink }}>posilka</b> — ya'ni ma'lumot to'plami — <b style={{ color: T.ink }}>serverDAN sizga</b> kelardi. Endi teskarisi: o'yiningizni <b style={{ color: T.ink }}>SIZ serverga</b> yuborasiz! Buning uchun fetch'ga ikkinchi qism qo'shiladi — <b style={{ color: T.ink }}>sozlamalar qutisi</b>. Ichida fe'l: <span className="mono">method: 'POST'</span>.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Taqqoslang</p>
            <pre className="code-box fade-up delay-1" style={{ lineHeight: 2 }}>
              <Cm>{'// o’tgan dars — olish:'}</Cm>{'\n'}
              {'fetch(url)'}{'\n\n'}
              <Cm>{'// bugun — yuborish:'}</Cm>{'\n'}
              {'fetch(url, '}<span style={{ borderRadius: 6, padding: '2px 5px', background: 'rgba(255,79,40,0.18)', boxShadow: `inset 0 0 0 1px ${T.accent}` }}>{'{ '}<At>method</At>{': '}<St>'POST'</St>{' }'}</span>{')'}
            </pre>
            <button className="btn fade-up delay-2" style={{ alignSelf: 'flex-start' }} onClick={send} disabled={running}>{running ? "Yo'lda…" : (done ? '📦 Yana yuborish' : '📦 POST yuborish')}</button>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Ikkinchi qism — <b>sozlamalar qutisi</b> <span className="mono">{'{ }'}</span>: fetch'ga "qanday borish"ni aytadi. <span className="mono">method: 'POST'</span> = "olib kelma — <b>olib bor</b>".</p></div>}
          </Col>
          <Col>
            <p className="flow-label">Posilka yo'li</p>
            <div className="fade-up delay-2" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, textAlign: 'center', padding: '10px 8px', borderRadius: 12, background: T.paper, boxShadow: `0 4px 12px -6px rgba(${T.shadowBase},0.14)` }}>
                <p className="flow-label" style={{ margin: 0 }}>SIZ</p>
                <p className="mono small" style={{ margin: '4px 0 0', color: T.ink }}>Robo Race</p>
              </div>
              <div style={{ position: 'relative', width: 64, height: 28, flexShrink: 0 }}>
                <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.ink3, fontSize: 15 }}>→</span>
                {phase === 1 && <span className="fly-right" style={{ position: 'absolute', left: 0, top: 1, fontSize: 19 }}>📦</span>}
              </div>
              <div style={{ flex: 1, textAlign: 'center', padding: '10px 8px', borderRadius: 12, background: phase >= 2 ? T.successSoft : T.paper, boxShadow: phase >= 2 ? `inset 0 0 0 1.5px ${T.success}` : `0 4px 12px -6px rgba(${T.shadowBase},0.14)`, transition: 'all 0.35s' }}>
                <p className="flow-label" style={{ margin: 0 }}>SERVER</p>
                <p className="mono small" style={{ margin: '4px 0 0', color: phase >= 2 ? T.success : T.ink3 }}>{phase >= 2 ? 'qabul qildi ✓' : 'kutmoqda…'}</p>
              </div>
            </div>
            <p className="flow-label" style={{ margin: 0 }}>robo-api.uz — jadval</p>
            <div className="code-box" style={{ padding: '11px 13px', display: 'flex', flexDirection: 'column', gap: 5 }}>
              <SrvRow id={1} name="Adopt Me!" />
              <SrvRow id={2} name="Doors" />
              <SrvRow id={3} name="Piggy" />
              {phase >= 2 && <SrvRow id={4} name="Robo Race" state="new" extra="+ yangi" />}
            </div>
            {done && <span className="tagpill fade-step" style={{ color: T.success }}>✓ POST — serverda YANGI qator paydo qildi</span>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 (qo'shish uchun qaysi fe'l?) =====
const Screen4 = (props) => (
  <QuestionScreen {...props} idx={4} scope="module-mikro" eyebrow="Mashq · 1-savol"
    questionText="Serverga YANGI ma'lumot qo'shish uchun qaysi so'rov ishlatiladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Serverga <span className="italic" style={{ color: T.accent }}>yangi ma'lumot qo'shish</span> uchun qaysi so'rov?</h2></>}
    options={["GET — u hamma ishni qiladi", "POST — sozlamalar qutisida method: 'POST'", "Sahifani yangilash kifoya", "DELETE"]} correctIdx={1}
    explainCorrect="To'g'ri! POST = qo'shish. fetch(url, { method: 'POST', … }) — ikkinchi qismdagi fe'l serverga 'yangi yozuv yarat' deydi."
    explainWrong={{
      0: "Hook'ni eslang: GET yubordingiz — o'yiningiz katalogga chiqmadi. GET faqat O'QIYDI.",
      2: "Yangilash faqat bor narsani qayta ko'rsatadi. Serverda yo'q narsa paydo bo'lmaydi.",
      3: "DELETE — aksincha, o'chiradi! Qo'shish uchun POST.",
      default: "Qo'shish = POST. Fe'l sozlamalar qutisida yoziladi: { method: 'POST' }."
    }} />
);

// ===== SCREEN 5 — BODY + JSON.stringify (posilkaning yuki) =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const NAMES = ['Robo Race', 'Super Kart', 'Pixel Quest'];
  const EMOJIS = ['🤖', '🏎️', '🐉'];
  const [name, setName] = useState(storedAnswer ? 'Robo Race' : null);
  const [emoji, setEmoji] = useState(storedAnswer ? '🤖' : null);
  const done = !!(name && emoji);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Body" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Posilkani yiging'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(8px,1.2vw,12px)' }}>
        <div className="head"><h2 className="title h-title fade-up">O'yiningiz posilkaning <span className="italic" style={{ color: T.accent }}>qaysi qismiga</span> joylanadi?</h2></div>
        <Mentor>Sozlamalar qutisida yana bir xona bor: <b style={{ color: T.ink }}>body — posilka yuki</b>. Lekin server obyektni tushunmaydi — unga <b style={{ color: T.ink }}>JSON matn</b> kerak. Tarjimon: <span className="mono">JSON.stringify()</span>. <b style={{ color: T.ink }}>headers</b> esa serverga ma'lumot JSON ekanini aytadi. O'yiningizni tanlab, kod qanday yig'ilishini kuzating.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">name</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {NAMES.map(v => <button key={v} className="gchip" style={name === v ? { background: T.accent, color: '#fff' } : undefined} onClick={() => setName(v)}>{v}</button>)}
            </div>
            <p className="flow-label" style={{ marginTop: 2 }}>emoji</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {EMOJIS.map(v => <button key={v} className="gchip" style={emoji === v ? { background: T.accent } : undefined} onClick={() => setEmoji(v)}>{v}</button>)}
            </div>
            <pre className="code-box fade-up delay-2" style={{ lineHeight: 1.95 }}>
              <Jx>{'const'}</Jx>{' yangi = { name: '}{name ? <St>'{name}'</St> : <Cm>?</Cm>}{', emoji: '}{emoji ? <St>'{emoji}'</St> : <Cm>?</Cm>}{' };'}{'\n\n'}
              {'fetch(url, {'}{'\n'}
              {'  '}<At>method</At>{': '}<St>'POST'</St>{','}{'\n'}
              {'  '}<At>headers</At>{": { 'Content-Type': 'application/json' },"}{'\n'}
              {'  '}<span style={{ borderRadius: 6, padding: '1px 5px', background: done ? 'rgba(31,122,77,0.14)' : 'rgba(255,255,255,0.06)' }}><At>body</At>{': JSON.stringify(yangi)'}</span>{'\n'}
              {'});'}
            </pre>
          </Col>
          <Col>
            <p className="flow-label">Tarjimon ikki tomonga ishlaydi</p>
            <div className="fade-up delay-2" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 14px', borderRadius: 12, background: T.paper, boxShadow: `0 4px 12px -6px rgba(${T.shadowBase},0.14)` }}>
                <span className="mono" style={{ fontSize: 11.5, fontWeight: 700, color: T.blue, minWidth: 72 }}>KELISHDA</span>
                <span style={{ fontSize: 12.5, color: T.ink }}><span className="mono">res.json()</span> — JSON matn → massiv</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 14px', borderRadius: 12, background: T.paper, boxShadow: `0 4px 12px -6px rgba(${T.shadowBase},0.14)` }}>
                <span className="mono" style={{ fontSize: 11.5, fontWeight: 700, color: T.success, minWidth: 72 }}>KETISHDA</span>
                <span style={{ fontSize: 12.5, color: T.ink }}><span className="mono">JSON.stringify()</span> — obyekt → JSON matn</span>
              </div>
            </div>
            <p className="flow-label" style={{ margin: 0 }}>Posilka ichi {done ? '— tayyor' : ''}</p>
            <div className="code-box" style={{ padding: '10px 13px', minHeight: 52 }}>
              {done
                ? <TLine out={<span className="el-in" style={{ display: 'inline-block', color: CODE.str }}>{`'{"name":"${name}","emoji":"${emoji}"}'`}</span>} />
                : <TLine out={<span style={{ color: CODE.comment, fontStyle: 'italic' }}>name va emoji tanlang…</span>} />}
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Tanish ko'rinishmi? O'tgan darsda javob <b>shunday matn</b> bo'lib kelardi! Endi siz ham serverga <b>o'sha tilda</b> yozyapsiz. <span className="mono">stringify</span> = "matnga aylantir".</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 5b — TEST 2 (JSON.stringify nima qiladi?) =====
const Screen5b = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Tekshiruv"
    questionText="JSON.stringify(yangi) nima qiladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Mustahkamlash</p><h2 className="title h-sub" style={{ marginTop: 8 }}><span className="mono" style={{ color: T.accent }}>JSON.stringify(yangi)</span> nima qiladi?</h2></>}
    options={["O'yinni darhol katalogga chizadi", "Obyektda xato bor-yo'qligini tekshiradi", "Obyektni JSON matnga aylantiradi — posilka yuki shunday yuboriladi", "Serverdan javob olib keladi"]} correctIdx={2}
    explainCorrect={"To'g'ri! Server obyektni emas, JSON matnni tushunadi. stringify — 'matnga aylantir': obyektdan JSON matn yasaydi. Bu .json()ning teskarisi."}
    explainWrong={{
      0: "Yo'q — chizish React'ning ishi. stringify faqat tarjima qiladi: obyekt → matn.",
      1: "Yo'q — u tekshirmaydi, aylantiradi. Obyektdan JSON matn yasaydi.",
      3: "Bu .json()ning ishi — KELGAN javobni o'girish. stringify esa KETAYOTGAN yukni o'giradi.",
      default: "stringify = obyektni JSON matnga aylantirish, body shu matn bilan uchadi."
    }} />
);

// ===== SCREEN 6 — TO'LIQ PARVOZ (stringify → POST → 201 → katalog) =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [step, setStep] = useState(storedAnswer ? 4 : 0);
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
  const hl = (z) => ({ borderRadius: 6, padding: '1px 5px', display: 'inline-block', background: running && step === z ? 'rgba(255,79,40,0.22)' : (step >= z && step >= 4 ? 'rgba(31,122,77,0.12)' : (step > z ? 'rgba(31,122,77,0.12)' : 'transparent')), transition: 'all 0.3s' });
  const STEPS = [
    { z: 1, t: 'Yuk tayyorlandi — stringify matnga oʼgirdi' },
    { z: 2, t: "POST uchdi — posilka serverga yo'lda" },
    { z: 3, t: 'Server qabul qildi — 201 Created' },
    { z: 4, t: 'Katalog yangilandi — kartochka paydo' }
  ];
  return (
    <Stage eyebrow="Parvoz" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Posilkani kuzating'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(8px,1.2vw,12px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Posilka serverga yetib borganini <span className="italic" style={{ color: T.accent }}>qayerdan bilamiz</span>?</h2></div>
        <Mentor>Server javob qaytaradi! GET'da <b style={{ color: T.ink }}>200 OK</b> kelardi. POST muvaffaqiyatli bo'lsa — <b style={{ color: T.ink }}>201 Created</b>: "yangi yozuv yaratildi" degani. ▶ bosib, posilkaning to'liq parvozini kuzating.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <button className="btn fade-up delay-1" style={{ alignSelf: 'flex-start' }} onClick={run} disabled={running}>{running ? 'Parvozda…' : (done ? '↻ Yana kuzatish' : '▶ Posilkani uchirish')}</button>
            <pre className="code-box fade-up delay-2" style={{ lineHeight: 1.95 }}>
              <span style={hl(1)}><Jx>{'const'}</Jx>{' yangi = { name: '}<St>'Robo Race'</St>{' };'}</span>{'\n\n'}
              <span style={hl(2)}>{'fetch('}<St>'https://robo-api.uz/games'</St>{', {'}</span>{'\n'}
              <span style={hl(2)}>{'  '}<At>method</At>{': '}<St>'POST'</St>{','}</span>{'\n'}
              <span style={hl(1)}>{'  '}<At>body</At>{': JSON.stringify(yangi)'}</span>{'\n'}
              {'})'}{'\n'}
              <span style={hl(3)}>{'  .then(res => res.json())'}</span>{'\n'}
              <span style={hl(4)}>{'  .then(data => setGames([...games, data]));'}</span>
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
            <div className="code-box" style={{ padding: '9px 13px', minHeight: 38 }}>
              {step >= 3
                ? <TLine out={<span className="el-in" style={{ display: 'inline-block' }}><span style={{ color: VERBS.POST.col, fontWeight: 700 }}>POST</span> /games → <span style={{ color: CODE.str }}>201 Created ✓</span></span>} />
                : <TLine out={<span style={{ color: CODE.comment, fontStyle: 'italic' }}>{step >= 2 ? "posilka yo'lda…" : 'konsol kutmoqda…'}</span>} />}
            </div>
            <Win title="robo-games — localhost:5173" minH={86}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <RoCard name="Adopt Me!" />
                <RoCard name="Doors" />
                {step >= 4 ? <div className="el-in"><RoCard name="Robo Race" emoji="🤖" likes={100} /></div> : <div style={{ borderRadius: 12, border: `1.5px dashed ${T.ink3}`, minHeight: 86 }} />}
              </div>
            </Win>
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — ID (server siznikini qanday topadi?) =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const ROWS = [{ id: 1, name: 'Adopt Me!' }, { id: 2, name: 'Doors' }, { id: 3, name: 'Piggy' }];
  const TASKS = [{ target: 'Doors', id: 2 }, { target: 'Piggy', id: 3 }];
  const [taskIdx, setTaskIdx] = useState(storedAnswer ? 2 : 0);
  const [picked, setPicked] = useState(null);
  const [shakeId, setShakeId] = useState(null);
  const shakeTimer = useRef(null);
  const done = taskIdx >= TASKS.length;
  useEffect(() => () => clearTimeout(shakeTimer.current), []);
  const cur = TASKS[Math.min(taskIdx, TASKS.length - 1)];
  const tap = (id) => {
    if (done) return;
    if (id === cur.id) { setPicked(id); setTimeout(() => { setPicked(null); setTaskIdx(t => t + 1); }, 700); }
    else { clearTimeout(shakeTimer.current); setShakeId(id); shakeTimer.current = setTimeout(() => setShakeId(null), 450); }
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="ID" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Manzilni toping (${taskIdx}/2)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Server minglab o'yindan <span className="italic" style={{ color: T.accent }}>keraklisini</span> qanday topadi?</h2></div>
        <Mentor>Har yozuvning <b style={{ color: T.ink }}>ID</b>si bor — pasport raqami kabi. Bitta yozuv ustida ishlash uchun ID <b style={{ color: T.ink }}>manzilga qo'shiladi</b>: <span className="mono">/games/2</span>. Topshiriq: kerakli o'yinning manzilini toping.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">robo-api.uz — jadval</p>
            <div className="code-box fade-up delay-1" style={{ padding: '11px 13px', display: 'flex', flexDirection: 'column', gap: 5 }}>
              {ROWS.map(r => <SrvRow key={r.id} id={r.id} name={r.name} state={!done && cur.target === r.name ? 'read' : null} extra={!done && cur.target === r.name ? '← shu kerak' : null} />)}
            </div>
            {!done
              ? <div className="sk-info" key={taskIdx}><p className="body" style={{ margin: 0, color: T.ink }}>Topshiriq {taskIdx + 1}/2: <b>{cur.target}</b> ustida ishlamoqchimiz. Qaysi manzilga so'rov yuboramiz?</p></div>
              : <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>ID — yozuvning aniq manzili. <span className="mono">/games</span> = hammasi, <span className="mono">/games/2</span> = faqat 2-yozuv. PUT va DELETE <b>doim ID bilan</b> ishlaydi.</p></div>}
          </Col>
          <Col>
            <p className="flow-label">Manzilni tanlang</p>
            <div className="fade-up delay-2" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ROWS.map(r => (
                <button key={r.id} className={`gchip ${shakeId === r.id ? 'shake' : ''}`} onClick={() => tap(r.id)} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13, padding: '10px 14px', justifyContent: 'flex-start', background: picked === r.id ? T.success : undefined, color: picked === r.id ? '#fff' : undefined }}>
                  robo-api.uz/games/<b>{r.id}</b>
                </button>
              ))}
            </div>
            {done && <span className="tagpill fade-step" style={{ color: T.success }}>✓ 2/2 — manzil + ID = aniq nishon</span>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — PUT (xato nomni almashtirish) =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [found, setFound] = useState(!!storedAnswer);
  const [fixed, setFixed] = useState(!!storedAnswer);
  const [shakeId, setShakeId] = useState(null);
  const shakeTimer = useRef(null);
  const done = fixed;
  useEffect(() => () => clearTimeout(shakeTimer.current), []);
  const ROWS = [{ id: 1, name: 'Adopt Me!' }, { id: 2, name: 'Doors' }, { id: 4, name: 'Robo Rase' }];
  const tapRow = (id) => {
    if (found) return;
    if (id === 4) setFound(true);
    else { clearTimeout(shakeTimer.current); setShakeId(id); shakeTimer.current = setTimeout(() => setShakeId(null), 450); }
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="PUT" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : (found ? 'PUT yuboring' : 'Xato yozuvni toping')} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Serverdagi xatoni qanday <span className="italic" style={{ color: T.accent }}>tuzatamiz</span>?</h2></div>
        <Mentor>Voy — o'yiningizni shoshilib yuboribsiz: nomida xato bor! O'chirib qayta qo'shish shartmas — <b style={{ color: T.ink }}>PUT</b> mavjud yozuvni yangisiga <b style={{ color: T.ink }}>almashtiradi</b>. Roblox o'yinlari har hafta UPDATE oladi — bu o'sha kuch. Avval xato yozuvni jadvaldan toping.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">robo-api.uz — jadval {found ? '' : '(xatoni bosing)'}</p>
            <div className="code-box fade-up delay-1" style={{ padding: '11px 13px', display: 'flex', flexDirection: 'column', gap: 5 }}>
              {ROWS.map(r => (
                <div key={r.id} className={shakeId === r.id ? 'shake' : ''} onClick={() => tapRow(r.id)} style={{ cursor: found ? 'default' : 'pointer' }}>
                  <SrvRow id={r.id} name={r.id === 4 && fixed ? 'Robo Race' : r.name} state={r.id === 4 ? (fixed ? 'changed' : (found ? 'read' : null)) : null} extra={r.id === 4 ? (fixed ? 'almashtirildi' : (found ? '← xato!' : null)) : null} />
                </div>
              ))}
            </div>
            {found && !fixed && (
              <pre className="code-box fade-step" style={{ lineHeight: 1.9 }}>
                {'fetch('}<St>'https://robo-api.uz/games/</St><span style={{ borderRadius: 5, padding: '0 4px', background: 'rgba(255,79,40,0.2)' }}><St>4</St></span><St>'</St>{', {'}{'\n'}
                {'  '}<At>method</At>{': '}<St>'PUT'</St>{','}{'\n'}
                {'  '}<At>body</At>{': JSON.stringify({ name: '}<St>'Robo Race'</St>{' })'}{'\n'}
                {'});'}
              </pre>
            )}
            {found && !fixed && <button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={() => setFixed(true)}>PUT yuborish</button>}
          </Col>
          <Col>
            <p className="flow-label">Katalogda</p>
            <div style={{ maxWidth: 160 }}>
              <RoCard key={fixed ? 'ok' : 'bad'} name={fixed ? 'Robo Race' : 'Robo Rase'} emoji="🤖" likes={100} />
            </div>
            {!found && <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Jadvalda bitta nom <b style={{ color: T.ink }}>xato yozilgan</b> — diqqat bilan o'qing va o'sha qatorni bosing.</p></div>}
            {found && !fixed && <div className="frame-warn fade-step"><p className="note-h" style={{ color: T.accent }}>✓ Topdingiz: "Robo Rase"</p><p className="body" style={{ margin: 0, color: T.ink }}>E'tibor bering: manzilda <b>ID bor</b> — <span className="mono">/games/4</span>. PUT aynan shu yozuvni body'dagi yangisiga almashtiradi.</p></div>}
            {fixed && (
              <>
                <div className="code-box" style={{ padding: '9px 13px' }}>
                  <TLine out={<span className="el-in" style={{ display: 'inline-block' }}><span style={{ color: VERBS.PUT.col, fontWeight: 700 }}>PUT</span> /games/4 → <span style={{ color: CODE.str }}>200 OK — almashtirildi ✓</span></span>} />
                </div>
                <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>PUT formulasi: <b>manzil + ID</b> (qaysi yozuv) + <b>body</b> (yangi varianti). Server eskisini olib tashlab, yangisini qo'yadi.</p></div>
              </>
            )}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 9 — TEST 3 (manzildagi ID nima degani?) =====
const Screen9 = (props) => (
  <QuestionScreen {...props} idx={9} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="robo-api.uz/games/7 — bu manzil nima degani?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}><span className="mono" style={{ color: T.accent }}>robo-api.uz/games/7</span> — bu manzil nima degani?</h2></>}
    options={["7 ta o'yin olib keladi", "Katalogning 7-sahifasini ochadi", "7 soniya kutib turadi", "ID raqami 7 bo'lgan BITTA o'yin ustida ish"]} correctIdx={3}
    explainCorrect="To'g'ri! Manzil oxiridagi raqam — ID, yozuvning pasport raqami. PUT/DELETE shu aniq yozuvga qaratiladi."
    explainWrong={{
      0: "Yo'q — soni emas, manzili. /games hammasi bo'lardi, /games/7 esa faqat bittasi.",
      1: "Yo'q — bu sahifa emas, serverdagi yozuvning raqami.",
      2: "Yo'q — vaqtga aloqasi yo'q. 7 — yozuvning ID raqami.",
      default: "/games/7 = ID'si 7 bo'lgan bitta yozuv. PUT va DELETE shunga ishlaydi."
    }} />
);

// ===== SCREEN 10 — LIKE PERSIST (PUT real hayotda — refresh sinovi) =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [likes, setLikes] = useState(storedAnswer ? 93 : 92);
  const [sent, setSent] = useState(!!storedAnswer);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshed, setRefreshed] = useState(!!storedAnswer);
  const timer = useRef(null);
  const done = sent && refreshed;
  useEffect(() => () => clearTimeout(timer.current), []);
  const like = () => {
    if (sent) return;
    setLikes(93); setSent(true);
  };
  const refresh = () => {
    if (!sent || refreshing) return;
    setRefreshing(true); setRefreshed(false);
    timer.current = setTimeout(() => { setRefreshing(false); setRefreshed(true); }, 1300);
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Serverda saqlanadi" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : (sent ? 'Endi sahifani yangilang' : 'Like bosing')} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Like bosganingiz nega <span className="italic" style={{ color: T.accent }}>yo'qolib qolmaydi</span>?</h2></div>
        <Mentor>State darsini eslang: like faqat <b style={{ color: T.ink }}>xotirada</b> edi — sahifa yangilansa, yo'qolardi. Sirning yechimi: like bosilganda sayt <b style={{ color: T.ink }}>serverga PUT yuboradi</b>. Sinab ko'ring: kartochkadagi <b style={{ color: T.ink }}>👍 ni bosing</b>, keyin sahifani yangilang.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
              <div style={{ maxWidth: 160, flexShrink: 0 }}>
                {refreshing
                  ? <SkelCard />
                  : <RoCard name="Adopt Me!" likes={likes} onLike={like} />}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button className="btn-soft" onClick={refresh} disabled={!sent || refreshing}>⟳ Sahifani yangilash {refreshed ? '✓' : ''}</button>
                {!sent && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>← avval 👍 ni bosing</p>}
              </div>
            </div>
            <p className="flow-label" style={{ margin: 0 }}>Konsol</p>
            <div className="code-box" style={{ padding: '10px 13px', minHeight: 64 }}>
              {!sent && <TLine out={<span style={{ color: CODE.comment, fontStyle: 'italic' }}>like kutilmoqda…</span>} />}
              {sent && <TLine out={<span className="el-in" style={{ display: 'inline-block' }}><span style={{ color: VERBS.PUT.col, fontWeight: 700 }}>PUT</span> /games/1 {'{ likes: 93 }'} → <span style={{ color: CODE.str }}>200 OK</span></span>} />}
              {refreshing && <TLine out={<span><span style={{ color: VERBS.GET.col, fontWeight: 700 }}>GET</span> /games → <span style={{ color: CODE.comment }}>yuklanmoqda…</span></span>} />}
              {refreshed && sent && <TLine out={<span className="el-in" style={{ display: 'inline-block', color: CODE.str }}>✓ serverdan keldi: likes = 93 — saqlanib qolgan!</span>} />}
            </div>
          </Col>
          <Col>
            <p className="flow-label">robo-api.uz — jadval</p>
            <div className="code-box fade-up delay-2" style={{ padding: '11px 13px', display: 'flex', flexDirection: 'column', gap: 5 }}>
              <SrvRow id={1} name="Adopt Me!" state={sent ? 'changed' : null} extra={sent ? 'likes: 93' : 'likes: 92'} />
              <SrvRow id={2} name="Doors" extra="likes: 91" />
            </div>
            {sent && !refreshed && !refreshing && <div className="hint fade-step"><p className="body" style={{ margin: 0, color: T.ink2 }}>Like serverga yozildi. Endi katta sinov: <b style={{ color: T.ink }}>sahifani yangilang</b> — yo'qolarmikan?</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana farq! Avval: xotirada → yangilansa yo'q. Endi: <b>serverda</b> → istalgan qurilmada, istalgan vaqtda turibdi. Roblox'dagi millionlab like shunday yashaydi.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — DELETE (tasdiqlash bilan o'chirish) =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [asking, setAsking] = useState(false);
  const [deleted, setDeleted] = useState(!!storedAnswer);
  const [cancelled, setCancelled] = useState(false);
  const done = deleted;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="DELETE" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Eski o'yinni o'chiring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Keraksiz yozuvni qanday <span className="italic" style={{ color: T.accent }}>olib tashlaymiz</span>?</h2></div>
        <Mentor>Jadvalda eski sinov yozuvi qolib ketgan: <b style={{ color: T.ink }}>"test test"</b> (ID 5). Uni <b style={{ color: T.ink }}>DELETE</b> olib tashlaydi. E'tibor bering: body kerak emas — <b style={{ color: T.ink }}>faqat manzil + ID</b>. Lekin ehtiyot bo'ling: DELETE'ni <b style={{ color: T.ink }}>qaytarib bo'lmaydi</b>!</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">robo-api.uz — jadval</p>
            <div className="code-box fade-up delay-1" style={{ padding: '11px 13px', display: 'flex', flexDirection: 'column', gap: 5 }}>
              <SrvRow id={1} name="Adopt Me!" />
              <SrvRow id={4} name="Robo Race" />
              {!deleted ? <SrvRow id={5} name="test test" state={asking ? 'read' : null} extra="← eski sinov" /> : <div className="el-in" style={{ opacity: 0.45 }}><SrvRow id={5} name="test test" state="del" extra="o'chirildi" /></div>}
            </div>
            <pre className="code-box fade-up delay-2" style={{ lineHeight: 1.9, padding: '10px 14px' }}>
              {'fetch('}<St>'https://robo-api.uz/games/5'</St>{', {'}{'\n'}
              {'  '}<At>method</At>{': '}<St>'DELETE'</St>{'\n'}
              {'});  '}<Cm>{'// body yo’q — faqat nishon'}</Cm>
            </pre>
            {!deleted && !asking && <button className="btn fade-up delay-2" style={{ alignSelf: 'flex-start', background: VERBS.DELETE.col }} onClick={() => { setAsking(true); setCancelled(false); }}>DELETE yuborish</button>}
          </Col>
          <Col>
            {asking && !deleted && (
              <div className="frame fade-step" style={{ boxShadow: `inset 0 0 0 1.5px ${VERBS.DELETE.col}, 0 8px 22px -6px rgba(${T.shadowBase},0.2)` }}>
                <p className="note-h" style={{ color: VERBS.DELETE.col }}>Rostdan o'chirilsinmi?</p>
                <p className="body" style={{ margin: '0 0 12px', color: T.ink }}>"test test" (ID 5) butunlay o'chadi. Bu amalni <b>qaytarib bo'lmaydi</b>.</p>
                <div style={{ display: 'flex', gap: 9 }}>
                  <button className="btn-soft" onClick={() => { setAsking(false); setCancelled(true); }}>Bekor qilish</button>
                  <button className="btn" style={{ background: VERBS.DELETE.col }} onClick={() => { setAsking(false); setDeleted(true); }}>Ha, o'chirilsin</button>
                </div>
              </div>
            )}
            {cancelled && !asking && !deleted && <div className="hint fade-step"><p className="body" style={{ margin: 0, color: T.ink2 }}>Bekor qildingiz — hech narsa o'zgarmadi. Bu ham muhim ko'nikma! Tayyor bo'lsangiz, yana DELETE yuboring.</p></div>}
            {!asking && !deleted && !cancelled && <div className="hint fade-up delay-2"><p className="body" style={{ margin: 0, color: T.ink2 }}>Nega saytlar o'chirishdan oldin doim <b style={{ color: T.ink }}>"Ishonchingiz komilmi?"</b> deb so'raydi? Hozir bilib olasiz.</p></div>}
            {deleted && (
              <>
                <div className="code-box" style={{ padding: '9px 13px' }}>
                  <TLine out={<span className="el-in" style={{ display: 'inline-block' }}><span style={{ color: VERBS.DELETE.col, fontWeight: 700 }}>DELETE</span> /games/5 → <span style={{ color: CODE.str }}>200 OK — o'chirildi ✓</span></span>} />
                </div>
                <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Yozuv ketdi — <b>butunlay</b>. Shuning uchun yaxshi saytlar avval tasdiqlash so'raydi: bitta bosishda baza o'chib ketmasin. Siz ham o'z saytingizda shunday qilasiz.</p></div>
              </>
            )}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — TEST 4 (to'g'ri fe'l + manzil juftligi) =====
const Screen12 = (props) => (
  <QuestionScreen {...props} idx={12} scope="module-mikro" eyebrow="Mashq · 4-savol"
    questionText="Piggy (ID 3) ni o'chirish uchun to'g'ri so'rov qaysi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Piggy (ID 3) ni <span className="italic" style={{ color: T.accent }}>o'chirish</span> uchun to'g'ri so'rov qaysi?</h2></>}
    options={["DELETE /games/3", "DELETE /games — hammasiga yuboramiz", "POST /games/3", "GET /games/3"]} correctIdx={0}
    explainCorrect="To'g'ri! Fe'l (DELETE) + aniq nishon (/games/3 — ID). Body kerak emas."
    explainWrong={{
      1: "Xavfli! ID'siz DELETE — qaysi birini? Butun ro'yxatdan ayrilish mumkin. Doim aniq ID bilan.",
      2: "POST — qo'shadi, o'chirmaydi. Fe'l noto'g'ri.",
      3: "GET — faqat o'qiydi: Piggy ma'lumotini olib keladi, lekin o'chirmaydi.",
      default: "O'chirish = DELETE + ID: DELETE /games/3."
    }} />
);

// ===== SCREEN 13 — CRUD PULT (3 stsenariy: to'g'ri fe'lni tanlash) =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const SCEN = [
    { q: "Do'stingiz yangi o'yin chiqardi — katalogga qo'shish kerak", verb: 'POST', url: '/games' },
    { q: 'Doors nomi eskirdi — "Doors 2" qilish kerak (ID 2)', verb: 'PUT', url: '/games/2' },
    { q: "Eski sinov yozuvi turibdi — olib tashlash kerak (ID 5)", verb: 'DELETE', url: '/games/5' }
  ];
  const [idx, setIdx] = useState(storedAnswer ? 3 : 0);
  const [shakeK, setShakeK] = useState(null);
  const [flash, setFlash] = useState(null);
  const shakeTimer = useRef(null);
  const done = idx >= SCEN.length;
  useEffect(() => () => clearTimeout(shakeTimer.current), []);
  const cur = SCEN[Math.min(idx, SCEN.length - 1)];
  const pick = (k) => {
    if (done) return;
    if (k === cur.verb) {
      setFlash(k);
      setTimeout(() => { setFlash(null); setIdx(i => i + 1); }, 800);
    } else {
      clearTimeout(shakeTimer.current); setShakeK(k);
      shakeTimer.current = setTimeout(() => setShakeK(null), 450);
    }
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  // jadval holati bosqichma-bosqich o'zgaradi
  const rows = [
    { id: 1, name: 'Adopt Me!' },
    { id: 2, name: idx >= 2 ? 'Doors 2' : 'Doors', state: idx === 2 && flash ? 'changed' : (idx >= 2 && idx < 3 ? null : null) },
    ...(idx >= 1 ? [{ id: 6, name: "Yangi o'yin", state: idx === 1 && !flash ? 'new' : null }] : []),
    ...(idx < 3 ? [{ id: 5, name: 'test test' }] : [])
  ];
  return (
    <Stage eyebrow="Amaliyot · pult" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `To'g'ri buyruqni tanlang (${idx}/3)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(8px,1.2vw,12px)' }}>
        <div className="head"><h2 className="title h-title fade-up">To'g'ri buyruqni <span className="italic" style={{ color: T.accent }}>o'zingiz tanlay olasizmi</span>?</h2></div>
        <Mentor>Mana sizning boshqaruv pultingiz! Har vaziyatga <b style={{ color: T.ink }}>to'g'ri buyruqni</b> tanlang — server darhol bajaradi. Xato buyruq — silkinadi. 3 ta vaziyat bor.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            {!done
              ? <div className="sk-info" key={idx}><p className="flow-label" style={{ marginBottom: 5 }}>Vaziyat {idx + 1}/3</p><p className="body" style={{ margin: 0, color: T.ink, fontWeight: 600 }}>{cur.q}</p></div>
              : <div className="takeaway fade-step"><div className="ta-bulb">🎛️</div><p className="ta-h">Siz endi CRUD'ni bilasiz!</p><p className="ta-sub">Create · Read · Update · Delete — barcha ilovalar shu 4 amal ustida turadi</p></div>}
            <p className="flow-label" style={{ margin: 0 }}>Pult</p>
            <div className="fade-up delay-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {VKEYS.map(k => {
                const v = VERBS[k];
                return (
                  <button key={k} className={`vcard ${shakeK === k ? 'shake' : ''}`} disabled={done} onClick={() => pick(k)} style={{ boxShadow: flash === k ? `inset 0 0 0 2px ${v.col}, 0 8px 20px -6px rgba(${T.shadowBase},0.2)` : undefined, opacity: done ? 0.55 : 1 }}>
                    <span className="vbadge" style={{ background: v.col }}>{k}</span>
                    <span className="vlbl" style={{ fontSize: 11 }}>{v.t}</span>
                  </button>
                );
              })}
            </div>
            {!done && idx === 0 && !flash && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>Maslahat: yangi yozuv = qaysi buyruq edi?</p>}
          </Col>
          <Col>
            <p className="flow-label">robo-api.uz — jadval (jonli)</p>
            <div className="code-box fade-up delay-2" style={{ padding: '11px 13px', display: 'flex', flexDirection: 'column', gap: 5 }}>
              {rows.map(r => <SrvRow key={`${r.id}-${r.name}`} id={r.id} name={r.name} state={r.state} />)}
              {idx >= 3 && <TLine out={<span style={{ color: CODE.comment, fontStyle: 'italic' }}>test test o'chirildi ✓</span>} />}
            </div>
            <div className="code-box" style={{ padding: '9px 13px', minHeight: 38 }}>
              {flash
                ? <TLine out={<span className="el-in" style={{ display: 'inline-block' }}><span style={{ color: VERBS[flash].col, fontWeight: 700 }}>{flash}</span> {cur.url} → <span style={{ color: CODE.str }}>{flash === 'POST' ? '201 Created ✓' : '200 OK ✓'}</span></span>} />
                : <TLine out={<span style={{ color: CODE.comment, fontStyle: 'italic' }}>{done ? '3/3 — pult sizniki!' : 'buyruq tanlanishini kutmoqda…'}</span>} />}
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Sezdingizmi — <b>kod deyarli bir xil</b>: fetch + manzil + fe'l. Faqat fe'l va ID o'zgaradi. Shu 4 tugma bilan istalgan ilovani boshqarasiz.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — VIBECODING (AI bilan to'liq boshqaruv) =====
const Screen14 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const TASKS = [
    { id: 't1', label: "O'yin qo'shish formasi yasa — tugma bosilganda POST ketsin", plan: ["Forma: name + emoji uchun input va state", "Tugmada: fetch POST + body: JSON.stringify(yangi)"], code: <>{'fetch(url, { '}<At>method</At>{': '}<St>'POST'</St>{', '}<At>body</At>{': JSON.stringify(yangi) })'}</> },
    { id: 't2', label: 'Like tugmasi serverda saqlanadigan boʼlsin', plan: ["onLike ichida PUT yuboraman: /games/ID", "body'da yangi likes soni ketadi"], code: <>{'fetch(url + '}<St>'/'</St>{' + g.id, { '}<At>method</At>{': '}<St>'PUT'</St>{', '}<At>body</At>{': … })'}</> },
    { id: 't3', label: "O'chirish tugmasi qo'sh — lekin avval tasdiqlash so'rasin", plan: ["Avval confirm: 'Rostdan o'chirilsinmi?'", "Ha bo'lsa: fetch DELETE /games/ID — body'siz"], code: <>{'if (tasdiq) fetch(url + '}<St>'/'</St>{' + g.id, { '}<At>method</At>{': '}<St>'DELETE'</St>{' })'}</> }
  ];
  const [task, setTask] = useState(null);
  const [phase, setPhase] = useState(storedAnswer ? 'done' : 'idle');
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
        <div className="head"><h2 className="title h-title fade-up">To'liq boshqaruvni <span className="italic" style={{ color: T.accent }}>AI bilan</span> saytga qo'shamizmi?</h2></div>
        <Mentor>Endi siz fe'llarni bilasiz — agent kodini <b style={{ color: T.ink }}>tekshira olasiz</b>: fe'l to'g'rimi, ID bormi, body kerak joyda stringify bormi, DELETE'dan oldin tasdiqlash so'ralganmi. Buyruq bering, rejani tasdiqlang.</Mentor>
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
                  {cur.id === 't1' && (
                    <>
                      <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
                        <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 11.5, background: T.bg, borderRadius: 7, padding: '6px 10px', color: T.ink2 }}>Robo Race</span>
                        <span style={{ fontFamily: "'Manrope',sans-serif", fontSize: 11.5, background: T.bg, borderRadius: 7, padding: '6px 10px', color: T.ink2 }}>🤖</span>
                        <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: 11, background: T.ink, color: '#fff', borderRadius: 7, padding: '6px 10px' }}>+ Qo'shish</span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                        <RoCard name="Adopt Me!" /><RoCard name="Doors" /><RoCard name="Robo Race" emoji="🤖" likes={100} />
                      </div>
                    </>
                  )}
                  {cur.id === 't2' && (
                    <>
                      <p style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: 13, color: T.ink, margin: 0 }}>👍 bosildi <span className="mono small" style={{ color: T.success, fontWeight: 700 }}>→ PUT → serverda</span></p>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                        <RoCard name="Adopt Me!" likes={93} /><RoCard name="Doors" /><RoCard name="Piggy" />
                      </div>
                    </>
                  )}
                  {cur.id === 't3' && (
                    <>
                      <div style={{ borderRadius: 9, padding: '8px 11px', background: VERBS.DELETE.soft, fontFamily: "'Manrope',sans-serif", fontSize: 11.5, color: T.ink }}>Rostdan o'chirilsinmi? <b>[Bekor]</b> <b style={{ color: VERBS.DELETE.col }}>[Ha]</b></div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                        <RoCard name="Adopt Me!" /><RoCard name="Doors" /><div style={{ borderRadius: 12, border: `1.5px dashed ${T.ink3}`, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 86 }}><span className="small" style={{ color: T.ink3, fontStyle: 'italic' }}>o'chdi</span></div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <p style={{ color: T.ink3, fontStyle: 'italic', margin: 0, fontFamily: 'Georgia, serif', fontSize: 13 }}>Buyruq bering va rejani tasdiqlang…</p>
              )}
            </Win>
            {done
              ? <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Kodni o'qing: fe'l vaziyatga mosmi, ID aniq nishonga olinganmi, xavfli amal tasdiqlash bilanmi. Agent ishini <b>isbot bilan</b> qabul qildingiz.</p></div>
              : <p className="body" style={{ margin: 0, color: T.ink3, fontSize: 13 }}>Natija shu yerda paydo bo'ladi — keyin uni o'zingiz tekshirasiz.</p>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 15 — DEBUGGING (method yozilmagan → jimgina GET ketgan) =====
const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [picked, setPicked] = useState(storedAnswer ? 'opts' : null);
  const [fixed, setFixed] = useState(!!storedAnswer);
  const found = picked === 'opts';
  const done = fixed;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Debugging" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : (found ? 'Endi tuzating' : "Yetishmayotganini toping")} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">AI yordam beradi — siz esa <span className="italic" style={{ color: T.accent }}>tekshirasiz</span>.</h2></div>
        <Mentor>AI qo'shish kodini yozdi — hammasi joyidaday. Lekin o'yin <b style={{ color: T.ink }}>qo'shilmayapti</b>! Konsolga qarang: biz POST kutgandik, u yerda esa… <b style={{ color: T.ink }}>GET</b>?! Kodda nimadir <b style={{ color: T.ink }}>yetishmayapti</b>. Qaysi qatorda bo'lishi kerak edi?</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="ai-card fade-up delay-2">
              <div className="ai-row"><span className="ai-badge">AI</span><span className="ai-bubble">Qo'shish kodini yozdim:</span></div>
              <div className="ai-code">
                <div className={`ai-line ${picked === 'obj' ? 'ok' : ''}`} onClick={() => { if (!found) setPicked('obj'); }}><Jx>{'const'}</Jx>{' yangi = { name: '}<St>'Super Kart'</St>{' };'}</div>
                {!fixed ? (
                  <div className={`ai-line ${found ? 'bad' : ''}`} onClick={() => { if (!found) setPicked('opts'); }}>{'fetch(url, {'}</div>
                ) : (
                  <div className="ai-line ok el-in">{'fetch(url, {'}</div>
                )}
                {fixed && <div className="ai-line ok el-in">{'  '}<At>method</At>{': '}<St>'POST'</St>{',  '}<Cm>{'// yetishmagan fe’l!'}</Cm></div>}
                <div className={`ai-line ${picked === 'body' ? 'ok' : ''}`} onClick={() => { if (!found) setPicked('body'); }}>{'  '}<At>body</At>{': JSON.stringify(yangi)'}</div>
                <div className={`ai-line ${picked === 'end' ? 'ok' : ''}`} onClick={() => { if (!found) setPicked('end'); }}>{'});'}</div>
              </div>
              {!found && <p className="ai-prompt">Fe'l qayerda yozilishi kerak edi? O'sha qatorni bosing.</p>}
              {found && !fixed && <button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={() => setFixed(true)}>🔧 method: 'POST' qo'shish</button>}
              {fixed && <p className="ai-prompt" style={{ color: T.success, fontStyle: 'normal', fontWeight: 600 }}>✓ Tuzatildi — endi server fe'lni tushunadi!</p>}
            </div>
          </Col>
          <Col>
            <p className="flow-label">Konsol va jadval</p>
            <div className="code-box" style={{ padding: '9px 13px' }}>
              {!fixed
                ? <TLine out={<span><span style={{ color: VERBS.GET.col, fontWeight: 700 }}>GET</span> /games → <span style={{ color: CODE.str }}>200 OK</span> <span style={{ color: CODE.comment }}>…lekin hech narsa qo'shilmadi</span></span>} />
                : <TLine out={<span className="el-in" style={{ display: 'inline-block' }}><span style={{ color: VERBS.POST.col, fontWeight: 700 }}>POST</span> /games → <span style={{ color: CODE.str }}>201 Created ✓</span></span>} />}
            </div>
            <div className="code-box" style={{ padding: '11px 13px', display: 'flex', flexDirection: 'column', gap: 5 }}>
              <SrvRow id={1} name="Adopt Me!" />
              <SrvRow id={2} name="Doors" />
              {fixed && <SrvRow id={6} name="Super Kart" state="new" extra="+ yangi" />}
            </div>
            {!found && (
              (picked === 'obj' || picked === 'body' || picked === 'end')
                ? <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bu qator to'g'ri{picked === 'obj' ? ' — obyekt tayyor' : picked === 'body' ? ' — yuk stringify bilan joyida' : ''}. Lekin sozlamalar qutisida <b>nima yo'q</b>? Konsol GET deyapti…</p></div>
                : <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Sir shu yerda: fe'l yozilmasa, fetch <b style={{ color: T.ink }}>jimgina GET yuboradi</b>. GET esa hech narsa qo'shmaydi.</p></div>
            )}
            {found && !fixed && <div className="frame-warn fade-step"><p className="note-h" style={{ color: T.accent }}>✓ Topdingiz!</p><p className="body" style={{ margin: 0, color: T.ink }}>Sozlamalar qutisi ochilgan-u, ichida <b>method yo'q</b>! Fe'lsiz fetch sukut bo'yicha GET ishlatadi. Chapdagi tugma bilan tuzating →</p></div>}
            {fixed && (
              <div className="takeaway fade-step"><div className="ta-bulb">🛠️</div><p className="ta-h">Ko'rinmas xatoni ham topdingiz!</p><p className="ta-sub">Konsoldagi fe'lni o'qish — professional odat</p></div>
            )}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — YAKUNIY (o'z o'yiningizni serverga qo'shing!) =====
const Screen16 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const EMOJIS = ['🤖', '🏎️', '🐉', '⚽', '🎯'];
  const [gname, setGname] = useState(storedAnswer?.gameName || '');
  const [emoji, setEmoji] = useState(storedAnswer?.gameEmoji || '🤖');
  const [value, setValue] = useState(storedAnswer?.picked || '');
  const [passed, setPassed] = useState(!!storedAnswer?.correct);
  const [loaded, setLoaded] = useState(!!storedAnswer);
  const timer = useRef(null);
  const nameOk = gname.trim().length >= 2;
  const normQ = value.replace(/[‘’“”]/g, "'").replace(/"/g, "'");
  const norm = normQ.replace(/\s+/g, '');
  const lineOk = /^method:'POST',$/.test(norm);
  const valid = lineOk && nameOk;
  const hasMethod = /method\s*:/.test(normQ);
  const hasPost = /'POST'/.test(normQ);
  const hasComma = /,\s*$/.test(value.trim());
  const lowerPost = /'(post|Post|pOST)'/.test(normQ);
  const capMethod = /Method|METHOD/.test(value);
  const noQuotes = /method\s*:\s*POST/.test(norm.replace(/'/g, '')) && !hasPost;
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (valid && !passed) {
      setPassed(true);
      onAnswer(screen, { stage: 'final', screenIdx: screen, question: "O'z o'yiningizni POST bilan serverga qo'shing", studentAnswer: `${gname} | ${value}`, gameName: gname, gameEmoji: emoji, correct: true, firstAttemptCorrect: true, solved: true, picked: value });
      timer.current = setTimeout(() => setLoaded(true), 1100);
    }
  }, [valid]);
  const Ln = ({ n, children }) => (
    <div className="vsc-line"><span className="vsc-ln">{n}</span><span style={{ whiteSpace: 'pre' }}>{children}</span></div>
  );
  return (
    <Stage eyebrow="Yakuniy · amaliy" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!passed} label={passed ? 'Davom etish' : (nameOk ? "Fe'lni yozing" : "O'yiningizga nom bering")} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(8px,1.2vw,12px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Va'da qilingan daqiqa: <span className="italic" style={{ color: T.accent }}>o'z o'yiningizni</span> serverga qo'shing.</h2></div>
        <Mentor>Hammasi tayyor: manzil bor, body bor. Avval o'yiningizga <b style={{ color: T.ink }}>nom va emoji</b> bering, keyin VS Code'da yetishmayotgan qatorni yozing: <b style={{ color: T.ink }}>method: 'POST',</b> — fe'l qo'shtirnoqda, KATTA harflarda, oxirida vergul.</Mentor>
        <Zoomable>
        <div className="split split-wide">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                value={gname}
                onChange={e => setGname(e.target.value.slice(0, 18))}
                placeholder="O'yiningiz nomi…"
                spellCheck={false}
                style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 13.5, padding: '9px 13px', borderRadius: 10, border: 'none', outline: 'none', background: T.paper, color: T.ink, boxShadow: nameOk ? `inset 0 0 0 1.5px ${T.success}` : `0 4px 12px -6px rgba(${T.shadowBase},0.2)`, width: 170 }}
              />
              {EMOJIS.map(e => <button key={e} className="gchip" style={emoji === e ? { background: T.accent } : undefined} onClick={() => setEmoji(e)}>{e}</button>)}
            </div>
            <div className="vsc fade-up delay-2">
              <div className="vsc-bar">
                <span className="vsc-tab on"><span style={{ color: '#61DAFB' }}>⚛</span> App.jsx <span style={{ color: '#6E7681', marginLeft: 4 }}>×</span></span>
                <span className="vsc-tab">GameCard.jsx</span>
              </div>
              <div className="vsc-body" style={{ fontSize: 'clamp(11px,1.35vw,12px)', lineHeight: 1.82 }}>
                <Ln n={1}><Jx>{'const'}</Jx>{' yangi = { name: '}<St>'{nameOk ? gname : '?'}'</St>{', emoji: '}<St>'{emoji}'</St>{' };'}</Ln>
                <Ln n={2}>{''}</Ln>
                <Ln n={3}>{'fetch('}<St>'https://robo-api.uz/games'</St>{', {'}</Ln>
                <div className="vsc-line">
                  <span className="vsc-ln">4</span>
                  <span style={{ whiteSpace: 'pre' }}>{'  '}</span>
                  <input className={`vsc-input ${lineOk ? 'ok' : ''}`} value={value} onChange={e => setValue(e.target.value)} placeholder="method: 'POST'," spellCheck={false} autoCapitalize="off" autoCorrect="off" style={{ fontSize: 'clamp(11px,1.35vw,12px)' }} />
                </div>
                <Ln n={5}>{'  '}<At>body</At>{': JSON.stringify(yangi)'}</Ln>
                <Ln n={6}>{'});'}</Ln>
              </div>
            </div>
            <div className="fade-up delay-2" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="tagpill" style={{ opacity: hasMethod ? 1 : 0.4 }}>{hasMethod ? '✓' : '1'} method: — kichik harf</span>
              <span className="tagpill" style={{ opacity: hasPost && !lowerPost ? 1 : 0.4 }}>{hasPost && !lowerPost ? '✓' : '2'} 'POST' — katta, qo'shtirnoqda</span>
              <span className="tagpill" style={{ opacity: hasComma ? 1 : 0.4 }}>{hasComma ? '✓' : '3'} , — oxirida vergul</span>
            </div>
            {lowerPost && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Fe'llar doim <b>KATTA harflarda</b>: <span className="mono">'POST'</span> ('post' emas).</p></div>}
            {capMethod && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}><span className="mono">method</span> — kichik harf bilan yoziladi.</p></div>}
            {noQuotes && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Fe'l — matn: <b>qo'shtirnoq ichida</b> yozing: <span className="mono">'POST'</span></p></div>}
            {lineOk && !nameOk && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Qator to'g'ri! Endi tepada o'yiningizga <b>nom bering</b> — posilka bo'sh ketmasin.</p></div>}
            {passed && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Posilka yo'lda! Server qabul qilyapti…</p></div>}
          </Col>
          <Col>
            <p className="flow-label">natija — localhost:5173</p>
            <Win title="robo-games — localhost:5173" minH={130}>
              {!passed && <p style={{ fontFamily: 'Georgia, serif', color: T.ink3, fontStyle: 'italic', margin: 0, textAlign: 'center', lineHeight: 1.5 }}>4-qator yozilmaguncha o'yiningiz shu yerda paydo bo'lmaydi…</p>}
              {passed && !loaded && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                  <SkelCard /><SkelCard /><SkelCard />
                </div>
              )}
              {passed && loaded && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 9 }}>
                  <RoCard name="Adopt Me!" />
                  <RoCard name="Doors" />
                  <div className="el-in" style={{ animationDelay: '0.25s', animationFillMode: 'backwards' }}><RoCard name={gname} emoji={emoji} likes={100} top /></div>
                </div>
              )}
            </Win>
            {passed && loaded && (
              <>
                <div className="code-box" style={{ padding: '9px 13px' }}>
                  <TLine out={<span className="el-in" style={{ display: 'inline-block' }}><span style={{ color: VERBS.POST.col, fontWeight: 700 }}>POST</span> /games → <span style={{ color: CODE.str }}>201 Created ✓</span></span>} />
                </div>
                <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>"<b>{gname}</b>" endi serverda — katalogda hammaga ko'rinadi. O'tgan dars va'dasi <b>bajarildi</b>!</p></div>
              </>
            )}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 17 — YAKUN =====
const Screen17 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const RECAP = [
    "4 fe'l: GET o'qiydi · POST qo'shadi · PUT almashtiradi · DELETE o'chiradi",
    "Fe'l sozlamalar qutisida: fetch(url, { method: 'POST', … })",
    "Yuk — body: JSON.stringify(obyekt) — .json()ning teskarisi",
    "PUT va DELETE — doim ID bilan: /games/2",
    "201 Created = yaratildi; DELETE qaytarilmaydi — avval tasdiqlash",
    "Bularning umumiy nomi — CRUD"
  ];
  const HOMEWORK = [
    { b: "Qo'shish formasi", t: "— robo-games loyihangizga agent bilan forma qo'shing: nom + emoji → POST bilan serverga ketsin" },
    { b: 'Jonli like', t: "— like tugmasi PUT yuborsin; sahifani yangilab, saqlanganini tekshiring" },
    { b: 'Xavfsiz o\'chirish', t: "— DELETE tugmasi qo'shing, lekin avval \"Ishonchingiz komilmi?\" so'ralsin" }
  ];
  const GLOSSARY = [
    { b: 'Method (fe\'l)', t: "— so'rov turi: server nima qilishni shundan biladi" },
    { b: 'POST', t: '— yangi yozuv yaratish (201 Created)' },
    { b: 'PUT', t: '— mavjud yozuvni almashtirish (ID kerak)' },
    { b: 'DELETE', t: "— yozuvni o'chirish (qaytarilmaydi!)" },
    { b: 'body', t: "— posilka yuki: yuborilayotgan ma'lumot" },
    { b: 'JSON.stringify', t: '— obyekt → JSON matn (.json()ning teskarisi)' },
    { b: 'ID', t: "— yozuvning raqami: /games/2" },
    { b: 'CRUD', t: '— Create · Read · Update · Delete' }
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
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">✓</span> Dars tugadi</span><h2 className="title h-title fade-up d1">Server endi sizning <span className="italic" style={{ color: T.accent }}>buyrug'ingizda</span>.</h2><p className="body h-sub fade-up d2">{PASSED ? "Tabriklaymiz! Siz to'liq aylanani yopdingiz: o'qish, qo'shish, almashtirish, o'chirish. O'z o'yiningiz serverda — siz endi chinakam developer tomonidasiz." : "Yaxshi harakat! Fe'llarni mustahkamlash uchun bir-ikki ekranni qayta ko'ring."}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span className="tick" style={{ width: 16, height: 16, borderRadius: '50%', background: T.success, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck">✓</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>📝 Uyga vazifa</div><p className="body" style={{ margin: '0 0 10px', color: T.ink }}>Antigravity bilan o'z loyihangizda sinang:</p><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">Sizda endi to'liq quvvat bor: React + server + 4 fe'l. Keyingi qadam — hammasini birlashtirib, boshidan oxirigacha O'ZINGIZNING ilovangizni qurish! 🚀</p></div>
        </div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">💡 Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT — ({ lang, onFinished })
export default function ReactApiPostLesson({ lang: langProp, onFinished }) {
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

  const screens = [Screen0, Screen1, Screen2, Screen3, Screen4, Screen5, Screen5b, Screen6, Screen7, Screen8, Screen9, Screen10, Screen11, Screen12, Screen13, Screen14, Screen15, Screen16, Screen17];
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


        /* === REACT-6 DARS CSS (POST/PUT/DELETE) === */
        .vcard { display: flex; align-items: center; gap: 11px; width: 100%; text-align: left; background: ${T.paper}; border: none; border-radius: 12px; padding: 11px 14px; cursor: pointer; transition: all 0.18s; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.14); font-family: 'Manrope', sans-serif; }
        .vcard:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 18px -6px rgba(${T.shadowBase},0.2); }
        .vcard:disabled { cursor: default; }
        .vbadge { font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 11px; color: #fff; padding: 4px 9px; border-radius: 7px; letter-spacing: 0.04em; flex-shrink: 0; min-width: 52px; text-align: center; }
        .vlbl { font-weight: 700; font-size: 12px; color: ${T.ink}; letter-spacing: 0.05em; }
        .vseen { margin-left: auto; font-weight: 700; font-size: 13px; }
        .srow { display: flex; align-items: center; gap: 10px; font-family: 'JetBrains Mono', monospace; font-size: 12.5px; color: ${CODE.text}; padding: 5px 8px; border-radius: 7px; transition: all 0.3s; }
        .srid { color: ${CODE.attr}; min-width: 16px; text-align: right; flex-shrink: 0; }
        .srname { color: ${CODE.text}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .srextra { margin-left: auto; font-size: 10.5px; color: ${CODE.comment}; font-style: italic; flex-shrink: 0; }
        .srow-read { background: rgba(1,154,203,0.16); box-shadow: inset 0 0 0 1px rgba(1,154,203,0.5); }
        .srow-new { background: rgba(31,122,77,0.18); box-shadow: inset 0 0 0 1px rgba(125,209,129,0.5); animation: el-pop 0.35s ease-out; }
        .srow-new .srextra { color: ${CODE.str}; font-style: normal; }
        .srow-changed { background: rgba(180,83,9,0.2); box-shadow: inset 0 0 0 1px rgba(255,211,128,0.5); animation: el-pop 0.35s ease-out; }
        .srow-changed .srextra { color: ${CODE.attr}; font-style: normal; }
        .srow-del { background: rgba(194,54,43,0.16); }
        .srow-del .srname { text-decoration: line-through; color: ${CODE.comment}; }
        @keyframes fly-right { 0% { opacity: 0; transform: translateX(-6px) scale(0.7); } 30% { opacity: 1; } 100% { opacity: 0; transform: translateX(46px) scale(1); } }
        .fly-right { animation: fly-right 0.95s ease-in forwards; }

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
