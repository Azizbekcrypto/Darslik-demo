import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import mentorImg from '../../assets/common/mentor.png';

// ============================================================
// PRAKTIKA 3-DARS — DEKOMPOZITSIYA (mini-do'kon, 1-qism) — PLATFORM STANDARD v16
// Mavzu: AI'ni ochishdan oldin rejalashtirish; bo'laklash (katta -> kichik qadam);
//        MVP (shart vs keyin); qadamlarni tartiblash; qadam -> buyruq; o'zakni AI bilan qurish.
// Loyiha: mini-do'kon — MVP o'zagi (mahsulotlar ro'yxati + narx). Savat/jami -> 4-dars.
// Asosiy xabar: "Avval bo'laklab rejalashtir, keyin AI'ni och. Siz — arxitektor."
// Tool: Antigravity (haqiqiy uyga vazifa muhiti).
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

// ===== Kod bo'yoqlari (syntax highlight) =====
const KW = ({ children }) => <span style={{ color: CODE.tag }}>{children}</span>;
const NUM = ({ children }) => <span style={{ color: CODE.attr }}>{children}</span>;
const STR = ({ children }) => <span style={{ color: CODE.str }}>{children}</span>;
const FN = ({ children }) => <span style={{ color: CODE.punct }}>{children}</span>;
const CM = ({ children }) => <span style={{ color: CODE.comment }}>{children}</span>;

const LESSON_META = { lessonId: 'practice-03-decompose-v16', lessonTitle: { uz: 'Praktika 3 — Dekompozitsiya (mini-do\'kon)', ru: 'Практика 3 — Декомпозиция (мини-магазин)' } };
const SCREEN_META = [
  { id: 's0',  type: 'hook',        template: 'custom',   scored: false, scope: 'hook' },
  { id: 's1',  type: 'rule',        template: 'custom',   scored: false, scope: null },
  { id: 's2',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's3',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's4',  type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's5',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's6',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's7',  type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's8',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's9',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's10', type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's11', type: 'case',        template: 'custom',   scored: false, scope: null },
  { id: 's12', type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's13', type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's14', type: 'exploration', template: 'custom',   scored: false, scope: null },
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
  const setCollapsed = (v) => {
    setMCollapsed(v);
    if (v === false && contentRef.current) { const el = contentRef.current; requestAnimationFrame(() => { if (el) el.scrollTo({ top: 0, behavior: 'auto' }); }); }
  };
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

// ===== KO'P TANLOVLI TEST =====
const QuestionScreen = ({ screen, scope, eyebrow, question, questionText, options, correctIdx, explainCorrect, explainWrong, storedAnswer, onAnswer, onNext, onPrev }) => {
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

// ===== BROWSER (jonli sayt preview) =====
const Browser = ({ url = 'mening-saytim.uz', children, dark = false }) => (
  <div className={`browser ${dark ? 'browser-dark' : ''}`}>
    <div className="browser-bar">
      <span className="browser-dot" style={{ background: '#FF5F56' }} />
      <span className="browser-dot" style={{ background: '#FFBD2E' }} />
      <span className="browser-dot" style={{ background: '#27C93F' }} />
      <span className="browser-url">{url}</span>
    </div>
    <div className="browser-body">{children}</div>
  </div>
);

// ===== FLOW (Hodisa -> Reaksiya -> O'zgarish) =====
const Flow = ({ step }) => {
  const NODES = [{ n: '1', l: 'Hodisa' }, { n: '2', l: 'Reaksiya' }, { n: '3', l: "O'zgarish" }];
  return (
    <div className="flow">
      {NODES.map((nd, i) => (
        <React.Fragment key={i}>
          <div className={`flow-node ${step >= i + 1 ? 'on' : ''}`}><span className="flow-n">{nd.n}</span><span>{nd.l}</span></div>
          {i < 2 && <span className="flow-arrow">→</span>}
        </React.Fragment>
      ))}
    </div>
  );
};

// Kichik sayt kartasi (ko'p ekranda qayta ishlatiladi)
const SiteCard = ({ name = 'Akmal', role = 'Veb-dasturchi · 14 yosh', children }) => (
  <div className="site-card">
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div className="site-ava">{(name && name.trim()[0]) || 'A'}</div>
      <div>
        <div className="site-name">{name}</div>
        <div style={{ fontSize: 13, opacity: 0.7 }}>{role}</div>
      </div>
    </div>
    {children}
  </div>
);

// ===== MINI-DO'KON MA'LUMOTLARI =====
const PRODUCTS = [
  { name: 'Kitob', price: '35 000', emoji: '📚', tint: '#2563EB' },
  { name: 'Daftar', price: '12 000', emoji: '📓', tint: '#1F9D55' },
  { name: 'Ruchka', price: '5 000', emoji: '✏️', tint: '#F59E0B' },
  { name: 'Sumka', price: '90 000', emoji: '🎒', tint: '#7C3AED' }
];

// Mini-do'kon preview (katalog). L3: narx bor, savat yo'q.
const ShopPreview = ({ showPrice = true, showCart = false, accent = '#2563EB', missing = false }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <span style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, fontSize: 'clamp(15px,2.2vw,18px)', color: T.ink }}>MAKTAB DO'KONI</span>
      {showCart && <span style={{ fontFamily: "'Manrope'", fontWeight: 700, fontSize: 11.5, color: accent, background: `${accent}1f`, borderRadius: 99, padding: '3px 10px' }}>Savat: 0</span>}
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 7 }}>
      {PRODUCTS.map((p, i) => (
        <div key={i} style={{ background: T.paper, borderRadius: 9, padding: '7px 9px', boxShadow: `0 4px 12px -6px rgba(${T.shadowBase},0.16)`, display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 30, height: 30, borderRadius: 7, background: missing ? '#E6E1D8' : `${p.tint || accent}22`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{missing ? '' : p.emoji}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 12, color: T.ink, whiteSpace: 'nowrap' }}>{p.name}</div>
            {showPrice
              ? <div style={{ fontFamily: "'Manrope'", fontWeight: 700, fontSize: 11.5, color: accent }}>{p.price} so'm</div>
              : <div style={{ fontSize: 10.5, color: T.accent, fontStyle: 'italic' }}>{missing ? 'narx yo\'q' : ''}</div>}
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Yo'l-xarita: qayerdamiz va keyin nima (bosqichlar tasmasi)
const JourneyBar = ({ stages }) => (
  <div className="journey fade-up">
    {stages.map((s, i) => (
      <React.Fragment key={i}>
        <div className={`jn jn-${s.state}`}>
          <span className="jn-dot">{s.state === 'done' ? '✓' : i + 1}</span>
          <span className="jn-txt"><span className="jn-lbl">{s.label}</span><span className="jn-tag">{s.tag}</span></span>
        </div>
        {i < stages.length - 1 && <span className="jn-line" />}
      </React.Fragment>
    ))}
  </div>
);

// "Agent quryapti…" — jonli shimmer skeleton
const BuildingPreview = () => (
  <div className="build-skel">
    <div className="bs-bar bs-lg" />
    <div className="bs-bar" style={{ width: '72%' }} />
    <div className="bs-bar" style={{ width: '90%' }} />
    <p className="build-note">Agent quryapti…</p>
  </div>
);

// Restoran sayti MVP preview (yakuniy natija) — menyu + narx
const REST_MENU = [
  { name: 'Osh', price: '30 000', emoji: '🍚', tint: '#E0892B' },
  { name: "Lag'mon", price: '28 000', emoji: '🍜', tint: '#C2410C' },
  { name: 'Somsa', price: '8 000', emoji: '🥟', tint: '#B45309' },
  { name: 'Choy', price: '3 000', emoji: '🍵', tint: '#1F7A4D' }
];
const RestaurantPreview = () => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
    <span style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, fontSize: 'clamp(15px,2.2vw,18px)', color: T.ink }}>MILLIY TAOMLAR</span>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 7 }}>
      {REST_MENU.map((p, i) => (
        <div key={i} style={{ background: T.paper, borderRadius: 9, padding: '7px 9px', boxShadow: `0 4px 12px -6px rgba(${T.shadowBase},0.16)`, display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 30, height: 30, borderRadius: 7, background: `${p.tint}22`, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>{p.emoji}</div>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 12, color: T.ink, whiteSpace: 'nowrap' }}>{p.name}</div>
            <div style={{ fontFamily: "'Manrope'", fontWeight: 700, fontSize: 11.5, color: '#C2410C' }}>{p.price} so'm</div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// MVP / keyin uchun xususiyatlar
const FEATURES = [
  { id: 'list', label: "Mahsulotlar ro'yxati", mvp: true },
  { id: 'price', label: 'Har biriga narx', mvp: true },
  { id: 'cart', label: "Savatga qo'shish", mvp: false },
  { id: 'total', label: 'Jami narx hisobi', mvp: false },
  { id: 'search', label: 'Qidiruv', mvp: false },
  { id: 'login', label: 'Foydalanuvchi login', mvp: false }
];

// Mobil avtoskroll
function useScrollIntoViewOnMobile(trigger) {
  const ref = useRef(null);
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (!trigger) return;
    if (typeof window === 'undefined' || window.innerWidth >= 768) return;
    const el = ref.current;
    if (!el) return;
    const t = setTimeout(() => { if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 160);
    return () => clearTimeout(t);
  }, [trigger]);
  return ref;
}

// Animatsiyani katta ekranda ko'rish uchun o'rovchi — ⛶ tugma, holat saqlanadi
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

// ===== SCREEN 0 — HOOK (rejasiz boshlash) =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [phase, setPhase] = useState(storedAnswer ? 'built' : 'idle');
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const OPTS = [
    { id: 'a', label: "Avval vazifani bo'laklab, reja tuzmadik" },
    { id: 'b', label: "AI juda sekin ishlagani uchun" },
    { id: 'c', label: "Kompyuter eski bo'lgani uchun" }
  ];
  const send = () => { clearTimeout(timer.current); setPhase('building'); timer.current = setTimeout(() => setPhase('built'), 1200); };
  const pick = (v) => { if (picked !== null) return; setPicked(v); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: true }); };
  const built = phase === 'built';
  const builtRef = useScrollIntoViewOnMobile(built);
  return (
    <Stage eyebrow="Kirish" screen={screen} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 820 }}>To'g'ridan-to'g'ri <span className="italic" style={{ color: T.accent }}>"do'kon yasab ber"</span> desak — nima bo'ladi?</h1>
        <Mentor>Endi kichik sahifa emas, butun bir <b style={{ color: T.ink }}>onlayn do'kon</b> kerak. Vasvasaga berilib, AI'ga rejasiz "do'kon yasab ber" deb yuboramiz. Tugmani bosing va natijaga qarang — bu yetarlimi?</Mentor>
        <Zoomable>
        <Split>
          <Col>
            <p className="flow-label">Sizning buyrug'ingiz</p>
            <div className="promptbox">Menga <span className="pb-slot">onlayn do'kon</span> yasab ber.</div>
            <button className="btn" onClick={send} disabled={phase === 'building'} style={{ alignSelf: 'flex-start' }}>{phase === 'building' ? 'Quryapti…' : (built ? '↻ Qayta yuborish' : 'Agentga yuborish')}</button>
            {built && <p className="hook-ack fade-step" style={{ marginTop: 4 }}>Chala chiqdi — narxlar yo'q, tartib yo'q. O'ngda: nega shunday?</p>}
          </Col>
          <Col>
            <p className="flow-label">Natija</p>
            <div ref={builtRef}><Browser url="dokon.uz">
              {phase === 'idle' && <p className="small" style={{ margin: 0, opacity: 0.5, textAlign: 'center', padding: '24px 0' }}>(hali yuborilmadi)</p>}
              {phase === 'building' && <p className="small" style={{ margin: 0, opacity: 0.6, textAlign: 'center', padding: '24px 0' }}>Agent quryapti…</p>}
              {built && <ShopPreview showPrice={false} missing />}
            </Browser></div>
            {built && (
              <div className="fade-step">
                <p className="eyebrow" style={{ color: T.ink2, margin: '0 0 9px' }}>Nega natija chala chiqdi?</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {OPTS.map(o => { const on = picked === o.id; return (
                    <button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null} onClick={() => pick(o.id)}>
                      <span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span>
                    </button>); })}
                </div>
                {picked !== null && <p className="hook-ack fade-step">To'g'ri! Katta vazifani <b>bo'laklamasak</b>, AI ham, biz ham adashamiz. Usta uy qurishdan oldin <b>chizma</b> chizadi. Bugun aynan shuni — rejalashtirishni — o'rganamiz.</p>}
              </div>
            )}
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
    { text: 'Nega reja kerak? — rejasiz tartibsizlik', tag: '' },
    { text: 'Bo\'laklash — katta vazifa, kichik qadamlar', tag: '' },
    { text: 'MVP — eng kichik ishlaydigan versiya', tag: 'shart vs keyin' },
    { text: 'Qadamlarni tartiblash', tag: '1·2·3' },
    { text: 'Qadamni AI buyrug\'iga aylantirish', tag: '' },
    { text: 'O\'zakni AI bilan qurish', tag: 'katalog' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const PreviewBlock = (
    <Col>
      <div className="fade-up frame" style={{ background: T.ink, color: '#fff', textAlign: 'center', padding: '20px 18px' }}>
        <p className="eyebrow" style={{ color: 'rgba(255,255,255,0.6)', margin: '0 0 8px' }}>Bugungi asosiy qoida</p>
        <p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, fontSize: 'clamp(18px,3vw,24px)', lineHeight: 1.25, margin: 0 }}>Avval <span style={{ color: T.accent, fontStyle: 'italic' }}>bo'laklab rejalashtir</span>, keyin AI'ni och.</p>
        <p className="body" style={{ color: 'rgba(255,255,255,0.85)', margin: '10px 0 0' }}>Siz — <b style={{ color: '#fff' }}>arxitektor</b>, AI — quruvchi.</p>
      </div>
    </Col>
  );
  const StepsBlock = (
    <Col>
      <p className="flow-label">Bugungi 6 qadam</p>
      <ol className="roadmap">
        {STEPS.map((s, i) => (<li key={i} className="step-card fade-up" style={{ animationDelay: `${0.08 + i * 0.05}s` }}><span className="step-num">{String(i + 1).padStart(2, '0')}</span><span className="step-body"><span className="step-text">{s.text}</span>{s.tag && <span className="step-tag">{s.tag}</span>}</span></li>))}
      </ol>
    </Col>
  );
  return (
    <Stage eyebrow="Reja" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Boshlaymiz →" onClick={onNext} /></>}>
      <div className="screen">
        <div className="head"><h2 className="title h-title fade-up">Katta loyihani qanday <span className="italic" style={{ color: T.accent }}>boshlaymiz?</span></h2></div>
        <Mentor>Katta ishni AI ham bir zarbda mukammal qila olmaydi — uni avval <b style={{ color: T.ink }}>bo'laklarga</b> bo'lish kerak. Yaxshi dasturchi AI'ni ochishdan oldin <b style={{ color: T.ink }}>rejani</b> tuzadi. Bugun mini-do'kon misolida shuni o'rganamiz, 6 qadamda.</Mentor>
        {!isNarrow ? (
          <Zoomable><Split>{PreviewBlock}{StepsBlock}</Split></Zoomable>
        ) : !showSteps ? (
          <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>{PreviewBlock}<button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>6 qadamni ko'rish</button></div>
        ) : (
          <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}><button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ Qoidani ko'rish</button>{StepsBlock}</div>
        )}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — KATTA G'OYA (bo'laklash) =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const PIECES = ['Mahsulotlar ro\'yxati', 'Narxlar', 'Savatga qo\'shish', 'Jami narx', 'Qidiruv', 'Login'];
  const [open, setOpen] = useState(!!storedAnswer);
  const done = open;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Bo'laklash" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Vazifani bo\'laklang'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Katta vazifa aslida <span className="italic" style={{ color: T.accent }}>ko'p kichik</span> qadam</h2></div>
        <Mentor>"Onlayn do'kon" — bu bitta ulkan, qo'rqinchli vazifaga o'xshaydi. Lekin uni <b style={{ color: T.ink }}>bo'laklarga</b> ajratsak, har biri kichik va bajariladigan bo'lib qoladi. Tugmani bosib, ulkan vazifani bo'laklang.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className={`big-task ${open ? 'is-split' : ''}`}>
              <p className="big-task-title">ONLAYN DO'KON</p>
              <p className="big-task-sub">{open ? '6 ta kichik qadamga bo‘lindi ↓' : 'bitta ulkan, qo‘rqinchli vazifa'}</p>
            </div>
            <button className="btn" onClick={() => setOpen(true)} disabled={open} style={{ alignSelf: 'flex-start' }}>{open ? '✓ Bo\'laklandi' : 'Vazifani bo\'laklash ↓'}</button>
          </Col>
          <Col>
            <p className="flow-label">Kichik qadamlar</p>
            {open ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {PIECES.map((p, i) => (
                  <div key={i} className="piece-card" style={{ animationDelay: `${i * 0.08}s` }}>
                    <span className="piece-num">{i + 1}</span>
                    <span className="piece-label">{p}</span>
                  </div>
                ))}
              </div>
            ) : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Chap tomondagi tugmani bosing</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Ko'rdingizmi? Bitta "qo'rqinchli" vazifa — 6 ta oddiy qadamga aylandi. Endi har birini alohida bajara olamiz.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — MVP: SHART vs KEYIN =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [placed, setPlaced] = useState(storedAnswer ? Object.fromEntries(FEATURES.map(f => [f.id, f.mvp ? 'mvp' : 'keyin'])) : {});
  const correctBucket = (f) => (f.mvp ? 'mvp' : 'keyin');
  const allCorrect = FEATURES.every(f => placed[f.id] === correctBucket(f));
  const done = allCorrect;
  const place = (f, bucket) => setPlaced(p => ({ ...p, [f.id]: bucket }));
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="MVP" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Hammasini to\'g\'ri joylang'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Avval nimani qurish <span className="italic" style={{ color: T.accent }}>shart?</span></h2></div>
        <Mentor><b style={{ color: T.ink }}>MVP</b> — eng kichik, lekin <b style={{ color: T.ink }}>ishlaydigan</b> versiya. Do'kon uchun eng zarur narsa — mahsulot va narxni ko'rsatish. Savat, qidiruv, login ham kerak, lekin ularni <b style={{ color: T.ink }}>keyin</b> qo'shamiz. Har bir xususiyatni to'g'ri joylang.</Mentor>
        <Zoomable>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {FEATURES.map(f => {
            const b = placed[f.id];
            const ok = b === correctBucket(f);
            const wrong = b && !ok;
            return (
              <div key={f.id} className="frame" style={{ padding: '11px 14px', display: 'flex', flexDirection: 'column', gap: wrong ? 7 : 0, boxShadow: ok ? `inset 0 0 0 2px ${T.success}, 0 6px 16px -6px rgba(31,122,77,0.2)` : `0 6px 16px -6px rgba(${T.shadowBase},0.14)` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ flex: 1, fontWeight: 600, fontSize: 'clamp(13px,1.7vw,15px)', color: T.ink, minWidth: 130 }}>{ok && <span style={{ color: T.success, marginRight: 6 }}>✓</span>}{f.label}</span>
                  <div style={{ display: 'flex', gap: 7 }}>
                    <button className={`chip ${b === 'mvp' ? (ok ? '' : '') : ''}`} onClick={() => place(f, 'mvp')} style={{ background: b === 'mvp' ? (ok ? T.success : T.accent) : T.paper, color: b === 'mvp' ? '#fff' : T.ink, boxShadow: `0 4px 12px -5px rgba(${T.shadowBase},0.18)` }}>Shart (MVP)</button>
                    <button className={`chip`} onClick={() => place(f, 'keyin')} style={{ background: b === 'keyin' ? (ok ? T.success : T.accent) : T.paper, color: b === 'keyin' ? '#fff' : T.ink, boxShadow: `0 4px 12px -5px rgba(${T.shadowBase},0.18)` }}>Keyin</button>
                  </div>
                </div>
                {wrong && <p className="small" style={{ margin: 0, color: T.accent }}>{f.mvp ? 'Bu MVP uchun shart — do\'kon busiz bo\'lmaydi.' : 'Muhim, lekin birinchi bosqichda shart emas — keyin qo\'shamiz.'}</p>}
              </div>
            );
          })}
        </div>
        {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Zo'r! MVP = mahsulotlar ro'yxati + narx. Qolgani — keyingi bosqich. Mana shu — aqlli rejalashtirish.</p></div>}
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 =====
const Screen4 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 1-savol"
    questionText="MVP nima?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}><span className="mono" style={{ color: T.accent }}>MVP</span> nima degani?</h2></>}
    options={['Eng kichik, lekin ishlaydigan versiya', 'Eng chiroyli dizayn', 'Eng qimmat funksiya', 'Loyihaning oxirgi varianti']} correctIdx={0}
    explainCorrect="To'g'ri! MVP — eng kam xususiyat bilan, lekin haqiqatan ishlaydigan birinchi versiya. Avval shuni quramiz, qolganini keyin qo'shamiz."
    explainWrong={{
      1: 'Yo’q — chiroyli dizayn keyin bo’ladi. MVP — avvalo ishlaydigan eng kichik versiya.',
      2: 'Yo’q — qimmat funksiya emas. MVP — eng zarur, eng oddiy ishlaydigan qism.',
      3: 'Yo’q — oxirgisi emas, aksincha birinchi ishlaydigan versiya. Keyin yaxshilanadi.',
      default: 'MVP — eng kichik ishlaydigan versiya.'
    }} />
);

// ===== SCREEN 5 — QADAMLARNI TARTIBLASH =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const STEPS = [
    { id: 'list', label: "Mahsulotlar ro'yxatini yarat" },
    { id: 'price', label: 'Har biriga narx qo\'sh' },
    { id: 'style', label: 'Chiroyli kartalarga joyla' }
  ];
  const CORRECT = ['list', 'price', 'style'];
  const [order, setOrder] = useState(storedAnswer ? CORRECT : []);
  const full = order.length === STEPS.length;
  const correct = full && order.join() === CORRECT.join();
  const done = correct;
  const add = (id) => { if (order.includes(id)) return; setOrder(o => [...o, id]); };
  const reset = () => setOrder([]);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const label = (id) => STEPS.find(s => s.id === id).label;
  return (
    <Stage eyebrow="Tartiblash" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'To\'g\'ri tartibni tuzing'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">MVP'ni <span className="italic" style={{ color: T.accent }}>nimadan</span> boshlaymiz?</h2></div>
        <Mentor>Endi MVP qadamlarini <b style={{ color: T.ink }}>to'g'ri tartibda</b> qo'yamiz. Uy poydevordan quriladi: avval mahsulotlar, keyin narx, so'ng chiroyli ko'rinish. Qadamlarni bosib, qurilish tartibini tuzing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Qadamlar (bosib tartibga qo'ying)</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {STEPS.map(s => <button key={s.id} className="chip" onClick={() => add(s.id)} disabled={order.includes(s.id)} style={{ justifyContent: 'flex-start', opacity: order.includes(s.id) ? 0.4 : 1 }}>{s.label}</button>)}
            </div>
            {order.length > 0 && <button className="btn-soft" onClick={reset} style={{ alignSelf: 'flex-start' }}>↺ Tozalash</button>}
          </Col>
          <Col>
            <p className="flow-label">Qurilish tartibi</p>
            <div className="frame" style={{ padding: '14px 16px', minHeight: 90 }}>
              {order.length === 0 ? <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>Chapdan qadamlarni tanlang…</p> : order.map((id, i) => <div key={id} style={{ display: 'flex', gap: 9, alignItems: 'center', marginBottom: 6 }}><span className="num-badge" style={{ width: 24, height: 24, fontSize: 12 }}>{i + 1}</span><span style={{ fontSize: 14, color: T.ink }}>{label(id)}</span></div>)}
            </div>
            {full && !correct && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Tartib biroz boshqacha. Poydevordan boshlang: avval <b>mahsulotlar</b>, keyin narx, so'ng ko'rinish. Tozalab, qayta urinib ko'ring.</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>To'g'ri! Avval poydevor (mahsulotlar), keyin narx, oxirida bezak. To'g'ri tartib — tez va aniq qurilish.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 6 — QADAM -> PROMPT (har buyruq → o'z natijasi) =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const OPTS = [
    { id: 'a', label: 'ro\'yxat', good: false, why: 'Bitta so\'z — AI «nimaning» ro\'yxati ekanini bilmaydi.' },
    { id: 'b', label: "Maktab do'koni uchun 4 ta mahsulotdan iborat ro'yxat yarat — har birining nomi bilan", good: true },
    { id: 'c', label: 'biror narsa qil', good: false, why: 'Mutlaqo noaniq — natija tasodifiy va bo\'sh chiqadi.' }
  ];
  const [picked, setPicked] = useState(storedAnswer ? 'b' : null);
  const [phase, setPhase] = useState(storedAnswer ? 'done' : 'idle'); // idle | building | done
  const timer = useRef(null);
  const good = picked === 'b' && phase === 'done';
  const done = good;
  useEffect(() => () => clearTimeout(timer.current), []);
  const pick = (id) => { if (good) return; clearTimeout(timer.current); setPicked(id); setPhase('building'); timer.current = setTimeout(() => setPhase('done'), 850); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = OPTS.find(o => o.id === picked);
  const showResult = picked && phase === 'done';
  return (
    <Stage eyebrow="Qadam → buyruq" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Aniq buyruqni tanlang'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bir buyruq — bir <span className="italic" style={{ color: T.accent }}>natija</span>. Qaysi biri aniq?</h2></div>
        <Mentor>Reja tayyor. Endi <b style={{ color: T.ink }}>1-qadamni</b> ("Mahsulotlar ro'yxatini yarat") AI buyrug'iga aylantiramiz. Har buyruqni bosib ko'ring — o'ngda AI <b style={{ color: T.ink }}>aynan shu buyruqdan</b> nima chiqarishini ko'rasiz. Aniq buyruq → aniq natija.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="frame" style={{ padding: '12px 15px', display: 'flex', alignItems: 'center', gap: 10 }}><span className="num-badge" style={{ width: 26, height: 26, fontSize: 12 }}>1</span><span style={{ fontWeight: 600, color: T.ink }}>Mahsulotlar ro'yxatini yarat</span></div>
            <p className="flow-label">Buyruqni tanlang — natijani solishtiring</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {OPTS.map(o => <button key={o.id} className={`hook-option ${picked === o.id ? 'on' : ''}`} disabled={good} onClick={() => pick(o.id)}><span className="radio">{picked === o.id && <span className="radio-dot" />}</span><span>{o.label}</span></button>)}
            </div>
          </Col>
          <Col>
            <p className="flow-label">AI natijasi</p>
            <Browser url="maktab-dokoni.uz">
              {!picked && <p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0, padding: '24px 0' }}>Chapdan buyruq tanlang</p>}
              {picked && phase === 'building' && <BuildingPreview />}
              {showResult && cur.good && <div className="result-reveal"><ShopPreview showPrice={false} accent="#2563EB" /></div>}
              {showResult && !cur.good && (
                <div className="result-reveal" style={{ textAlign: 'center', padding: '14px 8px' }}>
                  <div style={{ fontSize: 30, marginBottom: 6 }}>🤷</div>
                  <p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, fontSize: 16, margin: '0 0 4px', color: T.ink2 }}>Bo'sh natija</p>
                  <p className="small" style={{ margin: 0, color: T.ink3, fontStyle: 'italic' }}>AI buyruqni tushunmadi…</p>
                </div>
              )}
            </Browser>
            {showResult && !cur.good && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}><b>«{cur.label}»</b> — {cur.why} Mahsulot soni va nimasi kerakligini ayting.</p></div>}
            {good && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana! Aniq buyruq → AI 4 ta mahsulotni ro'yxat qildi. 1-qadam bajarildi. Keyingi qadam — narx qo'shish.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — TEST 2 =====
const Screen7 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 2-savol"
    questionText="Mini-do'kon qurishni nimadan boshlaysiz?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Mini-do'kon qurishni <span className="italic" style={{ color: T.accent }}>nimadan</span> boshlaysiz?</h2></>}
    options={['Foydalanuvchi login tizimidan', 'Mahsulotlar ro\'yxatidan (poydevor)', 'Reklama bannerlaridan', 'Sharhlar bo\'limidan']} correctIdx={1}
    explainCorrect="To'g'ri! Mahsulotlar ro'yxati — do'konning poydevori. Busiz qolgan hamma narsa (savat, qidiruv) ma'nosiz. Poydevordan boshlanadi."
    explainWrong={{
      0: 'Yo’q — login muhim, lekin u poydevor emas. Avval mahsulotlar bo’lishi kerak.',
      2: 'Yo’q — reklama keyin. Avval sotadigan mahsulot ro’yxati kerak.',
      3: 'Yo’q — sharhlar mahsulotga yoziladi. Demak avval mahsulotlar ro’yxati.',
      default: 'Poydevor — mahsulotlar ro’yxati.'
    }} />
);

// ===== SCREEN 8 — O'ZAKNI AI BILAN QURISH =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [phase, setPhase] = useState(storedAnswer ? 'done' : 'idle'); // idle | planned | building | done
  const timer = useRef(null);
  const done = phase === 'done';
  const doneRef = useScrollIntoViewOnMobile(done);
  const PLAN = ["Mahsulotlar ro'yxatini yarataman", 'Har biriga narx qo\'shaman', 'Chiroyli kartalarga joylayman'];
  useEffect(() => () => clearTimeout(timer.current), []);
  const send = () => { clearTimeout(timer.current); setPhase('planned'); };
  const approve = () => { clearTimeout(timer.current); setPhase('building'); timer.current = setTimeout(() => setPhase('done'), 1300); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Asosini qurish" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Asosini qurib oling'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Reja tayyor — endi AI <span className="italic" style={{ color: T.accent }}>birinchi ishlaydigan versiyani</span> quradi</h2></div>
        <Mentor>Mana eng yoqimli qism! Bugun do'konning <b style={{ color: T.ink }}>asosini</b> quramiz — ya'ni mahsulotlar ro'yxati va narx (savat, qidiruv keyin qo'shiladi). Reja aniq bo'lgani uchun AI'ga ishonch bilan topshiramiz: avval u <b style={{ color: T.ink }}>rejani</b> ko'rsatadi — siz <b style={{ color: T.ink }}>tasdiqlaysiz</b> — keyin quradi.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">MVP rejasi (3 qadam)</p>
            <button className="btn" onClick={send} disabled={phase !== 'idle' && phase !== 'done'} style={{ alignSelf: 'flex-start' }}>{phase === 'idle' || phase === 'done' ? 'Agentga yuborish' : (phase === 'building' ? 'Quryapti…' : 'Reja tayyor')}</button>
            {(phase === 'planned' || phase === 'building' || done) && (
              <div className="ai-card fade-step">
                <div className="ai-row"><span className="ai-badge" style={{ background: T.ink }}>Agent</span><span className="ai-bubble">{phase === 'planned' ? 'Rejam — tasdiqlaysizmi?' : (phase === 'building' ? 'Quryapman…' : 'Bajardim')}</span></div>
                {PLAN.map((p, i) => <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}><span style={{ color: phase === 'planned' ? T.ink3 : T.success }}>{phase === 'planned' ? '○' : '✓'}</span><span>{p}</span></div>)}
                {phase === 'planned' && <button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={approve}>Rejani tasdiqlash</button>}
                {phase === 'building' && <p className="ai-prompt" style={{ color: T.accent }}>Kod yozilyapti…</p>}
              </div>
            )}
          </Col>
          <Col>
            <p className="flow-label">Do'konning asosiy qismi</p>
            <Browser url="maktab-dokoni.uz">
              {phase === 'idle' && <p className="small" style={{ margin: 0, opacity: 0.5, textAlign: 'center', padding: '24px 0' }}>(rejani yuboring)</p>}
              {phase === 'planned' && <p className="small" style={{ margin: 0, opacity: 0.6, textAlign: 'center', padding: '24px 0' }}>Tasdiqlashni kutyapti…</p>}
              {phase === 'building' && <BuildingPreview />}
              {done && <div className="result-reveal"><ShopPreview showPrice accent="#2563EB" /></div>}
            </Browser>
            {done && <div ref={doneRef} className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Asosiy qism tayyor! Mahsulotlar va narxlar ko'rinyapti — bu birinchi <b>ishlaydigan</b> versiya (MVP). Rejasiz boshdagi tartibsizlikni eslang — farqni his qildingizmi?</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 9 — O'ZAKNI TEKSHIRISH =====
const Screen9 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const CHECKS = [
    { id: 'c1', label: 'Mahsulotlar ko\'rinyaptimi?', note: 'Ha — 4 ta mahsulot bor.' },
    { id: 'c2', label: 'Har biriga narx bormi?', note: 'Ha — har biriga narx qo\'shilgan.' },
    { id: 'c3', label: 'Savat bormi?', note: 'Yo\'q — va bu normal! Savat keyingi bosqichda.' }
  ];
  const [ok, setOk] = useState(storedAnswer ? new Set(['c1', 'c2', 'c3']) : new Set());
  const done = ok.size >= CHECKS.length;
  const check = (id) => setOk(prev => { const n = new Set(prev); n.add(id); return n; });
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Tekshirish" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Hammasini tekshiring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Asosiy qism <span className="italic" style={{ color: T.accent }}>rejaga mos</span> chiqdimi?</h2></div>
        <Mentor>AI qurdi — endi siz <b style={{ color: T.ink }}>arxitektor</b> sifatida tekshirasiz: rejada nima bo'lsa, o'shalar bormi? Har bir savolni bosib, do'kon bilan solishtiring. (Savat yo'qligi — xato emas, u keyingi bosqichda.)</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Do'konning asosiy qismi</p>
            <Browser url="maktab-dokoni.uz"><ShopPreview showPrice accent="#2563EB" /></Browser>
          </Col>
          <Col>
            <p className="flow-label">Tekshiruv ro'yxati</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {CHECKS.map(c => {
                const done1 = ok.has(c.id);
                return (
                  <button key={c.id} onClick={() => check(c.id)} disabled={done1} style={{ textAlign: 'left', border: 'none', borderRadius: 11, padding: '11px 14px', background: T.paper, cursor: done1 ? 'default' : 'pointer', boxShadow: done1 ? `inset 0 0 0 2px ${T.success}` : `0 6px 16px -6px rgba(${T.shadowBase},0.14)` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><span style={{ color: done1 ? T.success : T.ink3, fontWeight: 700 }}>{done1 ? '✓' : '○'}</span><span style={{ fontWeight: 600, fontSize: 14, color: T.ink }}>{c.label}</span></div>
                    {done1 && <p className="small fade-step" style={{ margin: '6px 0 0 18px', color: T.ink2 }}>{c.note}</p>}
                  </button>
                );
              })}
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Asosiy qism rejaga to'liq mos! Mahsulot va narx bor, savat esa ataylab keyinga qoldirilgan. Bu — nazoratli, rejali ishlash.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 10 — TEST 3 =====
const Screen10 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="Bu bosqichda do'konning qaysi qismini qurdik?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Bu bosqichda do'konning <span className="italic" style={{ color: T.accent }}>qaysi qismini</span> qurdik?</h2></>}
    options={['Mahsulot katalogi: ro\'yxat + narx (MVP o\'zagi)', 'Savat va to\'lov tizimi', 'Hamma narsa — do\'kon tayyor', 'Faqat login sahifasi']} correctIdx={0}
    explainCorrect="To'g'ri! Biz MVP o'zagini — mahsulotlar ro'yxati va narxlarni — qurdik. Savat, jami narx va boshqalari keyingi darsda qo'shiladi."
    explainWrong={{
      1: 'Yo’q — savat va to’lov hali yo’q, ular keyingi bosqich. Biz katalogni qurdik.',
      2: 'Yo’q — hammasi tugamadi. Biz faqat o’zakni (katalog) qurdik, davomi bor.',
      3: 'Yo’q — login MVP’ga kirmadi. Biz mahsulot ro’yxati va narxni qurdik.',
      default: 'Biz MVP o’zagini qurdik: ro’yxat + narx.'
    }} />
);

// ===== SCREEN 11 — KEYINGI BOSQICH (4-darsga ko'prik) =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const CARDS = {
    bugun: { name: 'Bugun qurdik', color: T.success, items: ['Mahsulotlar ro\'yxati', 'Har biriga narx', 'Chiroyli katalog'] },
    keyin: { name: 'Keyingi darsda', color: T.accent, items: ['Savatga qo\'shish', 'Jami narx hisobi', 'Bug tuzatish va deploy'] }
  };
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(new Set());
  const isNarrow = useIsMobile(768);
  const done = seen.size >= 2;
  const tap = (k) => { setActive(k); setSeen(prev => { const n = new Set(prev); n.add(k); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Keyingi bosqich" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/2 ko'ring`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Asosiy qism tayyor — <span className="italic" style={{ color: T.accent }}>keyin nima?</span></h2></div>
        <Mentor>Rejaning kuchi shunda: nima qilinganini va nima qolganini <b style={{ color: T.ink }}>aniq bilasiz</b>. Bugun do'konning asosini qurdik. Keyingi darsda uni <b style={{ color: T.ink }}>to'liq MVP</b>ga aylantiramiz — savat va jami narx qo'shamiz, so'ng internetga chiqaramiz (deploy). Quyidagi yo'l-xarita buni ko'rsatadi:</Mentor>
        <JourneyBar stages={[
          { label: 'Asosiy qism', tag: 'bugun bajardik', state: 'done' },
          { label: "To'liq MVP", tag: 'keyingi dars', state: 'cur' },
          { label: 'Deploy', tag: "do'kon tayyor", state: 'next' }
        ]} />
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.keys(CARDS).map(k => (
                <button key={k} onClick={() => tap(k)} style={{ display: 'flex', alignItems: 'center', gap: 13, textAlign: 'left', cursor: 'pointer', border: 'none', borderRadius: 14, padding: '15px 16px', background: T.paper, boxShadow: active === k ? `inset 0 0 0 2px ${CARDS[k].color}, 0 8px 20px -6px rgba(${T.shadowBase},0.2)` : `0 6px 16px -6px rgba(${T.shadowBase},0.14)`, transition: 'all 0.18s' }}>
                  <span style={{ width: 14, height: 14, borderRadius: 4, background: CARDS[k].color, flexShrink: 0 }} />
                  <span style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, fontSize: 16, color: T.ink }}>{CARDS[k].name}</span>
                  {seen.has(k) && <span style={{ marginLeft: 'auto', color: T.success }}>✓</span>}
                </button>
              ))}
            </div>
          </Col>
          <Col>
            {active ? (
              <div className="sk-info fade-step" key={active}>
                <span className="sk-tagbig"><span style={{ width: 14, height: 14, borderRadius: 4, background: CARDS[active].color }} /><span className="sk-wordbadge" style={{ color: CARDS[active].color, background: CARDS[active].color + '22' }}>{CARDS[active].name}</span></span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 11 }}>
                  {CARDS[active].items.map((e, i) => (<div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', background: T.bg, borderRadius: 8, padding: '8px 11px' }}><span style={{ color: CARDS[active].color }}>•</span><span className="body" style={{ margin: 0, color: T.ink2 }}>{e}</span></div>))}
                </div>
              </div>
            ) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Bir kartani bosing</p></div> : null)}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Qadam-baqadam: bugun o'zak, keyingi darsda to'liq MVP. Mana shu — professional ishlash usuli.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// Qayta ishlatiladigan MVP-taxta (s12, s15)
const MvpRows = ({ items, placed, setPlaced }) => {
  const cb = (f) => (f.mvp ? 'mvp' : 'keyin');
  return (
    <Zoomable>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {items.map(f => {
        const b = placed[f.id];
        const ok = b === cb(f);
        const wrong = b && !ok;
        return (
          <div key={f.id} className="frame" style={{ padding: '11px 14px', display: 'flex', flexDirection: 'column', gap: wrong ? 7 : 0, boxShadow: ok ? `inset 0 0 0 2px ${T.success}, 0 6px 16px -6px rgba(31,122,77,0.2)` : `0 6px 16px -6px rgba(${T.shadowBase},0.14)` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ flex: 1, fontWeight: 600, fontSize: 'clamp(13px,1.7vw,15px)', color: T.ink, minWidth: 120 }}>{ok && <span style={{ color: T.success, marginRight: 6 }}>✓</span>}{f.label}</span>
              <div style={{ display: 'flex', gap: 7 }}>
                <button className="chip" onClick={() => setPlaced(p => ({ ...p, [f.id]: 'mvp' }))} style={{ background: b === 'mvp' ? (ok ? T.success : T.accent) : T.paper, color: b === 'mvp' ? '#fff' : T.ink, boxShadow: `0 4px 12px -5px rgba(${T.shadowBase},0.18)` }}>Shart (MVP)</button>
                <button className="chip" onClick={() => setPlaced(p => ({ ...p, [f.id]: 'keyin' }))} style={{ background: b === 'keyin' ? (ok ? T.success : T.accent) : T.paper, color: b === 'keyin' ? '#fff' : T.ink, boxShadow: `0 4px 12px -5px rgba(${T.shadowBase},0.18)` }}>Keyin</button>
              </div>
            </div>
            {wrong && <p className="small" style={{ margin: 0, color: T.accent }}>{f.mvp ? 'Bu MVP uchun shart.' : 'Muhim, lekin keyingi bosqich uchun.'}</p>}
          </div>
        );
      })}
    </div>
    </Zoomable>
  );
};

// ===== SCREEN 12 — O'Z DEKOMPOZITSIYANG (to-do ilova) =====
const Screen12 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const TODO = [
    { id: 'add', label: 'Vazifa qo\'shish', mvp: true },
    { id: 'list', label: 'Vazifalar ro\'yxati', mvp: true },
    { id: 'check', label: 'Bajarildi deb belgilash', mvp: true },
    { id: 'remind', label: 'Eslatma (notification)', mvp: false },
    { id: 'tags', label: 'Ranglar va teglar', mvp: false },
    { id: 'stats', label: 'Statistika', mvp: false }
  ];
  const [placed, setPlaced] = useState(storedAnswer ? Object.fromEntries(TODO.map(f => [f.id, f.mvp ? 'mvp' : 'keyin'])) : {});
  const done = TODO.every(f => placed[f.id] === (f.mvp ? 'mvp' : 'keyin'));
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="O'z dekompozitsiyangiz" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'MVP\'ni belgilang'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Endi <span className="italic" style={{ color: T.accent }}>boshqa</span> loyihani bo'laklang</h2></div>
        <Mentor>Mahorat boshqa loyihalarga ham mos. Mana — <b style={{ color: T.ink }}>vazifalar ilovasi (to-do)</b>. Uning xususiyatlarini MVP (eng zarur, ishlaydigan) va keyin (bonus) ga ajrating.</Mentor>
        <MvpRows items={TODO} placed={placed} setPlaced={setPlaced} />
        {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mukammal! To-do ilovaning MVP'si — vazifa qo'shish, ro'yxat va belgilash. Eslatma, teglar, statistika — keyin. Siz dekompozitsiyani egalladingiz!</p></div>}
      </div>
    </Stage>
  );
};

// ===== SCREEN 13 — HAYOTDA (dekompozitsiya har joyda) =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const CARDS = {
    apps: { name: 'Mashhur ilovalar MVP\'dan boshlangan', color: T.success, items: ['Instagram — avval faqat rasm ulashish', 'YouTube — avval oddiy video yuklash', 'Keyin sekin-asta yangi funksiyalar'] },
    life: { name: 'Dekompozitsiya — hayotda ham', color: T.blue, items: ['Uy qurish — chizmadan boshlanadi', 'Ovqat — retsept qadamlari', 'Sayohat — bosqichma-bosqich reja'] }
  };
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(new Set());
  const isNarrow = useIsMobile(768);
  const done = seen.size >= 2;
  const tap = (k) => { setActive(k); setSeen(prev => { const n = new Set(prev); n.add(k); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Hayotda" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/2 ko'ring`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bu usulni <span className="italic" style={{ color: T.accent }}>kim</span> ishlatadi?</h2></div>
        <Mentor>Dekompozitsiya va MVP — bu o'yin emas, <b style={{ color: T.ink }}>haqiqiy dasturchilar va startaplar</b> aynan shunday ishlaydi. Hatto kundalik hayotda ham. Ikkala kartani ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.keys(CARDS).map(k => (
                <button key={k} onClick={() => tap(k)} style={{ display: 'flex', alignItems: 'center', gap: 13, textAlign: 'left', cursor: 'pointer', border: 'none', borderRadius: 14, padding: '15px 16px', background: T.paper, boxShadow: active === k ? `inset 0 0 0 2px ${CARDS[k].color}, 0 8px 20px -6px rgba(${T.shadowBase},0.2)` : `0 6px 16px -6px rgba(${T.shadowBase},0.14)`, transition: 'all 0.18s' }}>
                  <span style={{ width: 14, height: 14, borderRadius: 4, background: CARDS[k].color, flexShrink: 0 }} />
                  <span style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, fontSize: 15, color: T.ink }}>{CARDS[k].name}</span>
                  {seen.has(k) && <span style={{ marginLeft: 'auto', color: T.success }}>✓</span>}
                </button>
              ))}
            </div>
          </Col>
          <Col>
            {active ? (
              <div className="sk-info fade-step" key={active}>
                <span className="sk-tagbig"><span style={{ width: 14, height: 14, borderRadius: 4, background: CARDS[active].color }} /><span className="sk-wordbadge" style={{ color: CARDS[active].color, background: CARDS[active].color + '22' }}>{CARDS[active].name}</span></span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 11 }}>
                  {CARDS[active].items.map((e, i) => (<div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', background: T.bg, borderRadius: 8, padding: '8px 11px' }}><span style={{ color: CARDS[active].color }}>•</span><span className="body" style={{ margin: 0, color: T.ink2 }}>{e}</span></div>))}
                </div>
              </div>
            ) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Bir kartani bosing</p></div> : null)}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Katta narsa — kichik qadamlardan. MVP'dan boshlab, sekin-asta o'stiriladi. Siz endi shunday fikrlaysiz.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — ANTIGRAVITY (rejani tasdiqlash odati) =====
const Screen14 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [phase, setPhase] = useState(storedAnswer ? 'done' : 'idle'); // idle | planned | building | done
  const timer = useRef(null);
  const done = phase === 'done';
  const doneRef = useScrollIntoViewOnMobile(done);
  const PLAN = ["Mahsulotlar ro'yxatini yarataman", 'Har biriga narx qo\'shaman', 'Chiroyli kartalarga joylayman'];
  useEffect(() => () => clearTimeout(timer.current), []);
  const send = () => { clearTimeout(timer.current); setPhase('planned'); };
  const approve = () => { clearTimeout(timer.current); setPhase('building'); timer.current = setTimeout(() => setPhase('done'), 1300); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Haqiqiy asbob" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Demoni ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Antigravity'da <span className="italic" style={{ color: T.accent }}>rejani</span> qanday tasdiqlaymiz?</h2></div>
        <Mentor>Haqiqiy <b style={{ color: T.ink }}>Antigravity</b>da eng muhim odat: agent quryotganidan oldin <b style={{ color: T.ink }}>rejasini ko'rsatadi</b>. Siz uni o'qiysiz — to'g'ri bo'lsa tasdiqlaysiz, noto'g'ri bo'lsa tuzatasiz. Demoni ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Antigravity'ga topshiriq</p>
            <div className="promptbox">Maktab do'koni uchun mahsulot katalogini qur — <span className="pb-slot">ro'yxat</span> va <span className="pb-slot">narx</span> bilan.</div>
            <button className="btn" onClick={send} disabled={phase !== 'idle' && phase !== 'done'} style={{ alignSelf: 'flex-start' }}>{phase === 'idle' || phase === 'done' ? 'Antigravity\'ga yuborish' : (phase === 'building' ? 'Quryapti…' : 'Reja tayyor')}</button>
            {(phase === 'planned' || phase === 'building' || done) && (
              <div className="ai-card fade-step">
                <div className="ai-row"><span className="ai-badge" style={{ background: T.ink }}>Agent</span><span className="ai-bubble">{phase === 'planned' ? 'Rejam — tasdiqlaysizmi?' : (phase === 'building' ? 'Quryapman…' : 'Bajardim')}</span></div>
                {PLAN.map((p, i) => <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}><span style={{ color: phase === 'planned' ? T.ink3 : T.success }}>{phase === 'planned' ? '○' : '✓'}</span><span>{p}</span></div>)}
                {phase === 'planned' && <button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={approve}>Rejani o'qidim — tasdiqlash</button>}
                {phase === 'building' && <p className="ai-prompt" style={{ color: T.accent }}>Kod yozilyapti…</p>}
              </div>
            )}
          </Col>
          <Col>
            <p className="flow-label">Antigravity brauzeri</p>
            <Browser url="maktab-dokoni.uz">
              {phase === 'idle' && <p className="small" style={{ margin: 0, opacity: 0.5, textAlign: 'center', padding: '24px 0' }}>(topshiriqni yuboring)</p>}
              {(phase === 'planned' || phase === 'building') && <p className="small" style={{ margin: 0, opacity: 0.6, textAlign: 'center', padding: '24px 0' }}>{phase === 'planned' ? 'Tasdiqlashni kutyapti…' : 'Quryapti…'}</p>}
              {done && <ShopPreview showPrice accent="#2563EB" />}
            </Browser>
            {done && <div ref={doneRef} className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Aynan shu! Uyga vazifada o'z g'oyangizni Antigravity'da quring: avval reja, o'qing, tasdiqlang, keyin o'zak.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 15 — YAKUNIY (restoran sayti dekompozitsiyasi) =====
const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const REST = [
    { id: 'menu', label: 'Taomlar menyusi', mvp: true },
    { id: 'price', label: 'Narxlar', mvp: true },
    { id: 'order', label: 'Onlayn buyurtma', mvp: false },
    { id: 'review', label: 'Mijoz sharhlari', mvp: false }
  ];
  const [placed, setPlaced] = useState(storedAnswer?.correct ? Object.fromEntries(REST.map(f => [f.id, f.mvp ? 'mvp' : 'keyin'])) : {});
  const [passed, setPassed] = useState(!!storedAnswer?.correct);
  const passedRef = useScrollIntoViewOnMobile(passed);
  const allCorrect = REST.every(f => placed[f.id] === (f.mvp ? 'mvp' : 'keyin'));
  useEffect(() => { if (allCorrect && !passed) { setPassed(true); onAnswer(screen, { stage: 'final', screenIdx: screen, question: 'Restoran sayti dekompozitsiyasi (MVP)', studentAnswer: JSON.stringify(placed), correct: true, firstAttemptCorrect: true, solved: true, picked: 'ok' }); } }, [allCorrect]);
  return (
    <Stage eyebrow="Yakuniy · amaliy" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!passed} label={passed ? 'Davom etish' : 'MVP\'ni to\'g\'ri belgilang'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Oxirgi sinov: <span className="italic" style={{ color: T.accent }}>restoran sayti</span></h2></div>
        <Mentor>Vazifa: <b style={{ color: T.ink }}>restoran sayti</b> uchun MVP'ni rejalashtiring. Qaysi xususiyat eng zarur (shart), qaysi biri keyin? Har birini to'g'ri joylang.</Mentor>
        <MvpRows items={REST} placed={placed} setPlaced={setPlaced} />
        {passed ? (
          <div ref={passedRef} style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(10px,1.6vw,14px)' }}>
            <p className="flow-label">Natija — restoran saytining ishlaydigan asosi</p>
            <div className="result-reveal" style={{ maxWidth: 470 }}><Browser url="milliy-taomlar.uz"><RestaurantPreview /></Browser></div>
            <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mukammal! Menyu va narx — eng zarur asos, sayt shu zahoti ishlaydi. Onlayn buyurtma va sharhlar esa keyingi bosqich. Siz endi istalgan loyihani rejalashtira olasiz!</p></div>
          </div>
        ) : <p className="body" style={{ margin: 0, color: T.ink3, fontSize: 13 }}>Eslatma: restoranni ko'rsatish uchun avval menyu va narx kerak.</p>}
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — YAKUN =====
const Screen16 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const RECAP = ['Rejasiz boshlash — tartibsizlik; avval bo\'laklash kerak', 'Katta vazifa = ko\'p kichik qadam (dekompozitsiya)', 'MVP — eng kichik ishlaydigan versiya (shart vs keyin)', 'Qadamlar tartibi: poydevordan boshlanadi', 'O\'zakni AI bilan quramiz — reja, tasdiq, natija'];
  const HOMEWORK = [{ b: 'O\'z g\'oyangiz', t: '— bitta loyiha o\'ylab, uni qadamlarga bo\'ling' }, { b: 'MVP\'ni belgilang', t: '— qaysi xususiyat shart, qaysi biri keyin?' }, { b: 'Antigravity\'da', t: '— rejani tasdiqlab, o\'zakni qurdiring' }];
  const GLOSSARY = [{ b: 'Dekompozitsiya', t: '— katta vazifani kichik qadamlarga bo\'lish' }, { b: 'MVP', t: '— eng kichik ishlaydigan versiya' }, { b: 'Reja', t: '— AI\'ni ochishdan oldin tuzilgan qadamlar' }, { b: 'O\'zak', t: '— loyihaning asosiy ishlaydigan qismi' }, { b: 'Arxitektor', t: '— rejalashtiruvchi (siz); AI — quruvchi' }];
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
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">✓</span> 3-praktika tugadi</span><h2 className="title h-title fade-up d1">Endi siz — loyihaning <span className="italic" style={{ color: T.accent }}>arxitektori</span></h2><p className="body h-sub fade-up d2">{PASSED ? 'Zo\'r! Dekompozitsiya, MVP va o\'zakni qurishni egalladingiz. Keyingi darsda do\'konni to\'liq MVP\'ga aylantiramiz — savat va jami narx.' : 'Yaxshi harakat! Bo\'laklash va MVP — bir-ikki ekranni qayta ko\'rib mustahkamlang.'}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span className="tick" style={{ width: 16, height: 16, borderRadius: '50%', background: T.success, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck">✓</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>Uyga vazifa</div><p className="body" style={{ margin: '0 0 10px', color: T.ink }}>Rejalashtirishni mashq qiling:</p><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">Esda tuting: avval o'ylab bo'laklang, keyin AI'ni oching.</p></div>
        </div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">Kalit so'zlar (rejalashtirish)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};
// ============================================================ LESSON ROOT
export default function PracticeLesson3({ lang: langProp, onFinished }) {
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
      answers: SCREEN_META.map((_, i) => answers[i]).filter(Boolean)
    };
    if (typeof onFinished === 'function') onFinished(payload);
  };

  const screens = [Screen0, Screen1, Screen2, Screen3, Screen4, Screen5, Screen6, Screen7, Screen8, Screen9, Screen10, Screen11, Screen12, Screen13, Screen14, Screen15, Screen16];
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
        .zoomable { position: relative; }
        .zoom-btn { position: absolute; top: 6px; right: 6px; z-index: 5; width: 30px; height: 30px; border-radius: 8px; border: none; background: rgba(255,255,255,0.82); color: ${T.ink2}; font-size: 14px; line-height: 1; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px -4px rgba(${T.shadowBase},0.22); transition: all 0.2s; }
        .zoom-btn:hover { background: ${T.paper}; color: ${T.accent}; transform: scale(1.08); }
        .zoom-backdrop { position: fixed; inset: 0; background: rgba(14,14,16,0.55); z-index: 1000; animation: fade-step 0.25s ease; }
        .zoom-on { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%); width: min(880px,94vw); max-height: 90vh; overflow: auto; z-index: 1001; background: ${T.paper}; border-radius: 18px; padding: clamp(20px,4vw,42px); box-shadow: 0 30px 80px -20px rgba(${T.shadowBase},0.5); animation: zoom-pop 0.3s cubic-bezier(.34,1.3,.4,1); }
        @keyframes zoom-pop { from { opacity: 0; transform: translate(-50%,-50%) scale(0.93); } to { opacity: 1; transform: translate(-50%,-50%) scale(1); } }
        .fade-step { animation: fade-step 0.3s ease-out; }
        .d1 { animation-delay: 0.12s; } .d2 { animation-delay: 0.24s; } .d3 { animation-delay: 0.36s; } .d4 { animation-delay: 0.48s; }
        @keyframes el-pop { from { opacity: 0; transform: translateX(8px); } to { opacity: 1; transform: none; } }
        .el-in { animation: el-pop 0.3s ease-out; }

        /* === NATIJA REVEAL + "QURYAPTI" SKELETON === */
        @keyframes result-reveal { from { opacity: 0; transform: translateY(9px) scale(0.97); } to { opacity: 1; transform: none; } }
        .result-reveal { animation: result-reveal 0.42s cubic-bezier(.34,1.18,.5,1); }
        @keyframes bs-shimmer { 0% { background-position: 180% 0; } 100% { background-position: -180% 0; } }
        .build-skel { display: flex; flex-direction: column; gap: 11px; padding: 10px 2px; }
        .build-skel .bs-bar { height: 13px; border-radius: 7px; background: linear-gradient(90deg, #ECEAE4 25%, #FAF8F3 50%, #ECEAE4 75%); background-size: 200% 100%; animation: bs-shimmer 1.15s ease-in-out infinite; }
        .build-skel .bs-lg { height: 34px; border-radius: 10px; }
        .build-note { text-align: center; font-size: 11.5px; color: ${T.ink3}; margin: 6px 0 0; font-family: 'JetBrains Mono'; letter-spacing: 0.04em; }

        /* === KATTA VAZIFA (qora karta, bo'linish) + KICHIK QADAM KARTALARI === */
        @keyframes piece-pop { 0% { opacity: 0; transform: translateY(-7px) scale(0.9); } 60% { transform: scale(1.025); } 100% { opacity: 1; transform: none; } }
        @keyframes split-pulse { 0% { box-shadow: 0 14px 34px -14px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.07); } 50% { box-shadow: 0 14px 34px -14px rgba(255,79,40,0.5), inset 0 0 0 1px rgba(255,79,40,0.4); } 100% { box-shadow: 0 14px 34px -14px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.07); } }
        .big-task { border-radius: 16px; text-align: center; padding: clamp(24px,4vw,32px) 18px; background: radial-gradient(130% 150% at 50% -10%, #262A33 0%, #15171D 60%, #0B0C10 100%); box-shadow: 0 14px 34px -14px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(255,255,255,0.07); transition: transform 0.3s ease; }
        .big-task.is-split { transform: scale(0.97); animation: split-pulse 1.4s ease-in-out; }
        .big-task-title { font-family: 'Source Serif 4', serif; font-weight: 600; font-size: clamp(22px,4vw,30px); margin: 0; color: #F4F1EA; }
        .big-task-sub { font-family: 'Manrope', sans-serif; font-size: clamp(12px,1.6vw,13.5px); margin: 7px 0 0; color: rgba(255,255,255,0.62); }
        .big-task.is-split .big-task-sub { color: #FFC56B; font-weight: 600; }
        .piece-card { display: flex; align-items: center; gap: 11px; background: ${T.paper}; border-radius: 11px; padding: 11px 14px; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.16); opacity: 0; animation: piece-pop 0.42s cubic-bezier(.34,1.4,.5,1) forwards; }
        .piece-num { width: 26px; height: 26px; border-radius: 50%; background: ${T.accentSoft}; color: ${T.accent}; font-family: 'JetBrains Mono'; font-weight: 800; font-size: 13px; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .piece-label { font-family: 'Manrope', sans-serif; font-weight: 600; font-size: clamp(13.5px,1.8vw,15px); color: ${T.ink}; }

        /* === YO'L-XARITA (journey) === */
        .journey { display: flex; align-items: stretch; gap: 6px; flex-wrap: wrap; }
        .jn { flex: 1; min-width: 130px; display: flex; align-items: center; gap: 9px; background: ${T.paper}; border-radius: 12px; padding: 10px 12px; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.14); }
        .jn-dot { width: 24px; height: 24px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-family: 'JetBrains Mono'; font-weight: 800; font-size: 12px; color: #fff; flex-shrink: 0; }
        .jn-txt { display: flex; flex-direction: column; min-width: 0; }
        .jn-lbl { font-family: 'Manrope', sans-serif; font-weight: 700; font-size: 13px; color: ${T.ink}; }
        .jn-tag { font-family: 'Manrope', sans-serif; font-size: 11px; color: ${T.ink3}; }
        .jn-done { box-shadow: inset 0 0 0 1.5px ${T.success}, 0 6px 16px -6px rgba(31,122,77,0.25); }
        .jn-done .jn-dot { background: ${T.success}; }
        .jn-cur { box-shadow: inset 0 0 0 2px ${T.accent}, 0 8px 20px -6px rgba(255,79,40,0.28); }
        .jn-cur .jn-dot { background: ${T.accent}; }
        .jn-next .jn-dot { background: ${T.ink3}; }
        .jn-line { align-self: center; width: 14px; height: 2px; background: ${T.ink3}; opacity: 0.4; flex-shrink: 0; border-radius: 2px; }
        @media (max-width: 640px) { .jn-line { display: none; } .jn { min-width: 100%; } }

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

        /* === MENTOR === */
        .mentor { display: flex; gap: 12px; align-items: flex-start; }
        .mentor-ava { width: 40px; height: 40px; border-radius: 50%; overflow: hidden; flex-shrink: 0; box-shadow: 0 4px 12px -4px rgba(${T.shadowBase},0.28); }
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
        .num-badge { width: 30px; height: 30px; border-radius: 50%; background: ${T.accentSoft}; color: ${T.accent}; display: flex; align-items: center; justify-content: center; font-family: 'JetBrains Mono'; font-weight: 800; font-size: 14px; flex-shrink: 0; }

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

        /* === CODEBOX === */
        .codebox { background: ${CODE.bg}; border-radius: 12px; padding: 14px 16px; font-family: 'JetBrains Mono', monospace; font-size: clamp(12.5px,1.6vw,14.5px); color: ${CODE.text}; line-height: 1.75; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.18); overflow-x: hidden; }
        .codebox > div { white-space: pre-wrap; word-break: break-word; }

        /* === TAGPILL / AI CARD === */
        .tagpill { font-family: 'JetBrains Mono', monospace; font-size: 12.5px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 99px; background: ${T.paper}; color: ${T.ink}; box-shadow: 0 3px 10px -5px rgba(${T.shadowBase},0.18); transition: opacity 0.2s; }
        .ai-card { background: ${T.paper}; border-radius: 14px; padding: 15px 17px; display: flex; flex-direction: column; gap: 11px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.14); }
        .ai-row { display: flex; align-items: center; gap: 9px; } .ai-badge { font-family: 'Manrope'; font-weight: 800; font-size: 11px; color: #fff; background: ${T.blue}; padding: 3px 9px; border-radius: 6px; } .ai-bubble { font-size: 13px; color: ${T.ink2}; }
        .ai-prompt { font-size: 12px; color: ${T.ink3}; margin: 0; font-style: italic; }

        /* === BROWSER / SAYT PREVIEW === */
        .browser { background: ${T.paper}; border-radius: 14px; overflow: hidden; box-shadow: 0 12px 30px -10px rgba(${T.shadowBase},0.22); border: 1px solid rgba(167,166,162,0.25); }
        .browser-bar { display: flex; align-items: center; gap: 6px; padding: 9px 12px; background: #ECEAE4; }
        .browser-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
        .browser-url { margin-left: 8px; flex: 1; font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink3}; background: ${T.paper}; border-radius: 6px; padding: 4px 10px; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
        .browser-body { padding: clamp(15px,2.6vw,22px); min-height: 150px; background: ${T.paper}; color: ${T.ink}; transition: background .35s ease, color .35s ease; }
        .browser-dark .browser-bar { background: #11151C; }
        .browser-dark .browser-body { background: #161E2B; color: #E8E5DD; }
        .browser-dark .browser-url { background: #0E141D; color: #7A8699; }

        /* === MINI-SAYT === */
        .site-card { display: flex; flex-direction: column; gap: 13px; align-items: flex-start; }
        .site-ava { width: 52px; height: 52px; border-radius: 50%; background: linear-gradient(135deg, ${T.accent}, #FF9B7D); display: flex; align-items: center; justify-content: center; font-family: 'Source Serif 4', serif; font-weight: 700; font-size: 24px; color: #fff; flex-shrink: 0; text-transform: uppercase; }
        .site-name { font-family: 'Source Serif 4', serif; font-weight: 600; font-size: clamp(17px,2.4vw,21px); }
        .site-btn { font-family: 'Manrope'; font-weight: 600; font-size: 14px; border: none; border-radius: 10px; padding: 9px 16px; cursor: pointer; background: ${T.ink}; color: ${T.paper}; transition: all .18s; }
        .site-btn:hover:not(:disabled) { transform: translateY(-1px); }
        .site-btn:disabled { cursor: not-allowed; }
        .site-like { display: inline-flex; align-items: center; gap: 8px; background: ${T.accentSoft}; color: ${T.accent}; border: none; border-radius: 99px; padding: 8px 16px; font-family: 'Manrope'; font-weight: 700; font-size: 15px; cursor: pointer; transition: transform .15s; }
        .site-like:active { transform: scale(.94); }
        .shake { animation: shake .36s ease; }
        @keyframes shake { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-5px); } 40% { transform: translateX(5px); } 60% { transform: translateX(-4px); } 80% { transform: translateX(4px); } }

        /* === FLOW (Hodisa->Reaksiya->O'zgarish) === */
        .flow { display: flex; align-items: center; justify-content: center; gap: 5px; flex-wrap: wrap; }
        .flow-node { display: flex; align-items: center; gap: 5px; background: ${T.paper}; border-radius: 9px; padding: 6px 9px; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.16); font-family: 'Manrope'; font-weight: 600; font-size: 11.5px; color: ${T.ink2}; transition: all .25s; opacity: .45; white-space: nowrap; }
        .flow-node.on { opacity: 1; background: ${T.accent}; color: #fff; transform: translateY(-2px); box-shadow: 0 8px 18px -6px rgba(255,79,40,0.4); }
        .flow-node .flow-n { display: inline-flex; align-items: center; justify-content: center; width: 15px; height: 15px; border-radius: 50%; background: rgba(167,166,162,0.3); font-family: 'JetBrains Mono'; font-weight: 700; font-size: 9.5px; flex-shrink: 0; }
        .flow-node.on .flow-n { background: rgba(255,255,255,0.3); }
        .flow-arrow { color: ${T.ink3}; font-size: 13px; }

        /* === PROMPT-QURUVCHI === */
        .chiprow { display: flex; flex-wrap: wrap; gap: 8px; }
        .promptbox { background: ${T.paper}; border-radius: 12px; padding: 12px 14px; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.16); font-family: 'Manrope'; font-size: clamp(13px,1.6vw,14.5px); line-height: 2; color: ${T.ink}; }
        .pb-slot { display: inline-flex; align-items: center; background: ${T.accentSoft}; color: ${T.accent}; font-weight: 700; border-radius: 6px; padding: 2px 8px; margin: 0 1px; }
        .pb-ph { display: inline-flex; align-items: center; border: 1.5px dashed ${T.ink3}; color: ${T.ink3}; border-radius: 6px; padding: 1px 8px; margin: 0 1px; font-style: italic; }

        /* === EVENT KARTALAR === */
        .evt-card { display: flex; align-items: center; gap: 12px; text-align: left; cursor: pointer; border: none; border-radius: 12px; padding: 13px 15px; background: ${T.paper}; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.14); transition: all .18s; width: 100%; }
        .evt-card:hover { transform: translateY(-1px); }
        .evt-card.on { box-shadow: inset 0 0 0 2px ${T.accent}, 0 8px 20px -6px rgba(255,79,40,0.22); }
        .evt-card .evt-name { font-family: 'Manrope'; font-weight: 600; font-size: 14px; color: ${T.ink}; }
        .evt-card .evt-hint { font-size: 12px; color: ${T.ink2}; }

        /* === IWATCH === */
        .iwatch { display: flex; align-items: baseline; gap: 9px; background: ${T.paper}; border-radius: 12px; padding: 12px 18px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.14); }
        .iwatch-lbl { font-family: 'Manrope'; font-weight: 700; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: ${T.ink3}; }
        .iwatch-eq { font-family: 'JetBrains Mono'; font-size: 18px; color: ${T.ink2}; }
        .iwatch-num { font-family: 'Fraunces', serif; font-size: clamp(34px,7vw,52px); color: ${T.accent}; line-height: 1; }

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

        /* MOBIL: yig'iladigan Mentor */
        .mentor-mob .mentor-msg { overflow: hidden; max-height: 360px; transition: max-height 0.38s cubic-bezier(.4,0,.2,1), opacity 0.25s ease, padding 0.38s ease, box-shadow 0.3s ease; }
        .mentor-mob.is-collapsed { align-items: center; cursor: pointer; }
        .mentor-mob.is-collapsed .mentor-col { gap: 0; }
        .mentor-mob.is-collapsed .mentor-msg { max-height: 0; opacity: 0; padding-top: 0; padding-bottom: 0; box-shadow: none; }
        .mentor-cue { font-family: 'Manrope'; font-weight: 600; font-size: 11px; color: ${T.accent}; letter-spacing: 0.01em; }

        /* === MOBIL POLISH (zichroq, toza, gorizontal toshmasin) === */
        @media (max-width: 640px) {
          .stage-content { padding-bottom: clamp(14px,3vw,22px); }
          .screen { gap: 13px; }
          .browser-body { min-height: 84px; padding: 14px 15px; }
          .codebox { font-size: 12.5px; line-height: 1.6; padding: 12px 13px; }
          .mentor-msg { padding: 11px 14px; }
          .site-ava { width: 46px; height: 46px; font-size: 21px; }
          .frame { padding: 15px 16px; }
          .split { gap: 14px; }
          .flow { gap: 4px; }
          .flow-node { padding: 6px 8px; }
        }
      `}</style>
      <div className="lesson-root">
        <Current screen={screen} storedAnswer={answers[screen]} answers={answers} onAnswer={recordAnswer} onNext={next} onPrev={prev} onReset={reset} onFinish={finishLesson} />
      </div>
    </LangContext.Provider>
  );
}
