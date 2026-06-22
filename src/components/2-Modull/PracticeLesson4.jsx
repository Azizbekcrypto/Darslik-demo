import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import mentorImg from '../../assets/common/mentor.png';

// ============================================================
// PRAKTIKA 4-DARS — MVP TAYYOR (mini-do'kon, 2-qism) — PLATFORM STANDARD v16
// Mavzu: o'zakka savat + jami narx qo'shish (to'liq MVP); AI bilan bug tuzatish;
//        jilolash; deploy (dunyoga chiqarish); universal yo'l (reja->MVP->qur->tekshir->deploy).
// Loyiha: mini-do'kon — to'liq, ishlaydigan, deploy qilingan MVP.
// Asosiy xabar: "O'zakni to'liq do'konga aylantirib chiqaramiz — men istalgan narsani qura olaman."
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

const LESSON_META = { lessonId: 'practice-04-mvp-deploy-v16', lessonTitle: { uz: 'Praktika 4 — MVP tayyor (deploy)', ru: 'Практика 4 — MVP готов (деплой)' } };
const SCREEN_META = [
  { id: 's0',  type: 'hook',        template: 'custom',   scored: false, scope: 'hook' },
  { id: 's1',  type: 'rule',        template: 'custom',   scored: false, scope: null },
  { id: 's2',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's3',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's4',  type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's5',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's6',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's7',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's8',  type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's9',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's10', type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's11', type: 'exploration', template: 'custom',   scored: false, scope: null },
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

// ===== MINI-DO'KON MA'LUMOTLARI (narx — son) =====
const PRODUCTS = [
  { name: 'Kitob', price: 35000 },
  { name: 'Daftar', price: 12000 },
  { name: 'Ruchka', price: 5000 },
  { name: 'Sumka', price: 90000 }
];
const som = (n) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');

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

// Ishlaydigan mini-do'kon: savatga qo'shish, sanagich, jami narx
const InteractiveShop = ({ cart = [], onAdd, showCart = true, showTotal = true, buggy = false, accent = '#2563EB' }) => {
  const real = cart.reduce((s, i) => s + PRODUCTS[i].price, 0);
  const shown = buggy ? real * 2 : real;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 6 }}>
        <span style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, fontSize: 'clamp(15px,2.2vw,18px)', color: T.ink }}>MAKTAB DO'KONI</span>
        <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
          {showCart && <span style={{ fontFamily: "'Manrope'", fontWeight: 700, fontSize: 11.5, color: accent, background: `${accent}1f`, borderRadius: 99, padding: '4px 11px' }}>Savat: {cart.length}</span>}
          {showTotal && <span style={{ fontFamily: "'Manrope'", fontWeight: 800, fontSize: 12, color: '#fff', background: accent, borderRadius: 99, padding: '4px 11px' }}>Jami: {som(shown)} so'm</span>}
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 7 }}>
        {PRODUCTS.map((p, i) => (
          <div key={i} style={{ background: T.paper, borderRadius: 9, padding: '7px 9px', boxShadow: `0 4px 12px -6px rgba(${T.shadowBase},0.16)`, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 26, height: 26, borderRadius: 6, background: `${accent}22`, flexShrink: 0 }} />
            <div style={{ minWidth: 0, flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 12, color: T.ink, whiteSpace: 'nowrap' }}>{p.name}</div>
              <div style={{ fontFamily: "'Manrope'", fontWeight: 700, fontSize: 11.5, color: accent }}>{som(p.price)} so'm</div>
            </div>
            {onAdd && <button onClick={() => onAdd(i)} title="Savatga qo'shish" style={{ width: 26, height: 26, borderRadius: '50%', border: 'none', background: accent, color: '#fff', fontSize: 17, fontWeight: 700, lineHeight: 1, cursor: 'pointer', flexShrink: 0 }}>+</button>}
          </div>
        ))}
      </div>
    </div>
  );
};

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

// ===== SCREEN 0 — HOOK (o'zak bor, lekin sotib bo'lmaydi) =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [tries, setTries] = useState(0);
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const OPTS = [
    { id: 'a', label: "Savat va xarid qilish imkoni yo'q" },
    { id: 'b', label: "Mahsulotlar soni kam" },
    { id: 'c', label: "Ranglar yoqimsiz" }
  ];
  const pick = (v) => { if (picked !== null) return; setPicked(v); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: true }); };
  return (
    <Stage eyebrow="Kirish" screen={screen} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 820 }}>Do'kon ko'rinadi, lekin <span className="italic" style={{ color: T.accent }}>sotib olib</span> bo'lmaydi 🤔</h1>
        <Mentor>3-darsda do'konning <b style={{ color: T.ink }}>o'zagini</b> qurdik — mahsulotlar va narxlar bor. Lekin bu hali haqiqiy do'kon emas: <b style={{ color: T.ink }}>"Sotib olish"</b> tugmasini bosib ko'ring — biror narsa bo'ladimi?</Mentor>
        <Zoomable>
        <Split>
          <Col>
            <p className="flow-label">3-darsdagi o'zak (katalog)</p>
            <Browser url="maktab-dokoni.uz"><InteractiveShop showCart={false} showTotal={false} /></Browser>
            <button className="btn" onClick={() => setTries(t => t + 1)} style={{ alignSelf: 'flex-start' }}>🛒 Sotib olish</button>
            {tries > 0 && <p className="mono small" style={{ color: T.accent, margin: 0 }}>{tries}-marta bosildi — hech narsa bo'lmadi. Savat yo'q.</p>}
          </Col>
          <Col>
            {tries < 2 ? (
              <div className="frame-dash" style={{ display: 'flex', alignItems: 'center', minHeight: 120 }}>
                <p className="body" style={{ margin: 0, color: T.ink2 }}>"Sotib olish"ni <b>kamida 2 marta</b> bosib ko'ring — do'konda nima yetishmayotganini his qiling.</p>
              </div>
            ) : (
              <div className="fade-step">
                <p className="eyebrow" style={{ color: T.ink2, margin: '0 0 9px' }}>Bu do'konda nima yetishmayapti?</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {OPTS.map(o => { const on = picked === o.id; return (
                    <button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null} onClick={() => pick(o.id)}>
                      <span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span>
                    </button>); })}
                </div>
                {picked !== null && <p className="hook-ack fade-step">To'g'ri! Mahsulotni ko'rsatish — bu boshlanish. Haqiqiy do'kon uchun <b>savat</b> va <b>jami narx</b> kerak. Bugun o'zakni <b>to'liq, ishlaydigan MVP</b>ga aylantirib, dunyoga chiqaramiz!</p>}
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
    { text: 'Savatga qo\'shish — sanagich ishlasin', tag: 'savat' },
    { text: 'Jami narx — avtomatik hisob', tag: 'jami' },
    { text: 'Bug tuzatish — AI bilan', tag: '' },
    { text: 'Jilolash — oxirgi pardoz', tag: '' },
    { text: 'Deploy — dunyoga chiqarish', tag: 'havola' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const PreviewBlock = (
    <Col>
      <div className="fade-up frame" style={{ background: T.ink, color: '#fff', textAlign: 'center', padding: '20px 18px' }}>
        <p className="eyebrow" style={{ color: 'rgba(255,255,255,0.6)', margin: '0 0 8px' }}>Oxirgi dars — cho'qqi</p>
        <p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, fontSize: 'clamp(18px,3vw,24px)', lineHeight: 1.25, margin: 0 }}>O'zakni <span style={{ color: T.accent, fontStyle: 'italic' }}>to'liq MVP</span>ga aylantirib, <span style={{ color: T.accent, fontStyle: 'italic' }}>dunyoga</span> chiqaramiz.</p>
        <p className="body" style={{ color: 'rgba(255,255,255,0.85)', margin: '10px 0 0' }}>Yakunda: "Men istalgan narsani qura olaman."</p>
      </div>
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
        <div className="head"><h2 className="title h-title fade-up">Do'konni <span className="italic" style={{ color: T.accent }}>oxiriga</span> yetkazamiz</h2></div>
        <Mentor>Reja bizda bor: o'zakka savat va jami narxni qo'shamiz, buglarni tuzatamiz, jilolaymiz va <b style={{ color: T.ink }}>deploy</b> qilamiz. Dars oxirida sizda haqiqiy, ulashiladigan do'kon bo'ladi. Mana yo'l — 5 qadam.</Mentor>
        {!isNarrow ? (
          <Zoomable><Split>{PreviewBlock}{StepsBlock}</Split></Zoomable>
        ) : !showSteps ? (
          <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>{PreviewBlock}<button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>5 qadamni ko'rish</button></div>
        ) : (
          <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}><button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ Maqsadni ko'rish</button>{StepsBlock}</div>
        )}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — XUSUSIYAT 1: SAVATGA QO'SHISH =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [phase, setPhase] = useState(storedAnswer ? 'ready' : 'idle'); // idle | planned | building | ready
  const [cart, setCart] = useState([]);
  const timer = useRef(null);
  const ready = phase === 'ready';
  const done = ready && (storedAnswer ? true : cart.length >= 1);
  const shopRef = useScrollIntoViewOnMobile(ready);
  useEffect(() => () => clearTimeout(timer.current), []);
  const send = () => { clearTimeout(timer.current); setPhase('planned'); };
  const approve = () => { clearTimeout(timer.current); setPhase('building'); timer.current = setTimeout(() => setPhase('ready'), 1100); };
  const add = (i) => { if (ready) setCart(c => [...c, i]); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Xususiyat 1 · Savat" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : (ready ? 'Savatga qo\'shing' : 'Avval qo\'shib oling')} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Avval — <span className="italic" style={{ color: T.accent }}>savatga qo'shish</span></h2></div>
        <Mentor>Birinchi xususiyat: har mahsulotga <b style={{ color: T.ink }}>"+"</b> tugmasi va <b style={{ color: T.ink }}>savat sanagichi</b>. AI'ga aniq buyruq beramiz, u rejani ko'rsatadi, tasdiqlaymiz — keyin "+" ni bosib, savat to'lishini ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="promptbox">Har mahsulotga <span className="pb-slot">"+ savatga"</span> tugmasi va <span className="pb-slot">savat sanagichi</span> qo'sh.</div>
            <button className="btn" onClick={send} disabled={phase !== 'idle' && phase !== 'ready'} style={{ alignSelf: 'flex-start' }}>{phase === 'idle' || phase === 'ready' ? 'Agentga yuborish' : (phase === 'building' ? 'Quryapti…' : 'Reja tayyor')}</button>
            {(phase === 'planned' || phase === 'building' || ready) && (
              <div className="ai-card fade-step">
                <div className="ai-row"><span className="ai-badge" style={{ background: T.ink }}>Agent</span><span className="ai-bubble">{phase === 'planned' ? 'Rejam — tasdiqlaysizmi?' : (phase === 'building' ? 'Quryapman…' : 'Bajardim')}</span></div>
                {["Har kartaga + tugmasi qo'shaman", 'Savat sanagichini ulayman'].map((p, i) => <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}><span style={{ color: phase === 'planned' ? T.ink3 : T.success }}>{phase === 'planned' ? '○' : '✓'}</span><span>{p}</span></div>)}
                {phase === 'planned' && <button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={approve}>Rejani tasdiqlash</button>}
                {phase === 'building' && <p className="ai-prompt" style={{ color: T.accent }}>Kod yozilyapti…</p>}
              </div>
            )}
          </Col>
          <Col>
            <p className="flow-label">Do'kon</p>
            <div ref={shopRef}><Browser url="maktab-dokoni.uz">
              {!ready && <p className="small" style={{ margin: 0, opacity: 0.55, textAlign: 'center', padding: '24px 0' }}>{phase === 'idle' ? '(savat hali yo\'q)' : 'Quryapti…'}</p>}
              {ready && <InteractiveShop cart={cart} onAdd={add} showCart showTotal={false} />}
            </Browser></div>
            {ready && cart.length === 0 && <p className="hook-ack" style={{ margin: 0 }}>"+" tugmalarini bosib, savatni to'ldiring.</p>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Ishladi! Endi "+" bosilsa, savat sanagichi oshyapti. Bu — haqiqiy interaktivlik (1-darsdan eslang: hodisa → reaksiya → o'zgarish).</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — XUSUSIYAT 2: JAMI NARX =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [phase, setPhase] = useState(storedAnswer ? 'ready' : 'idle'); // idle | building | ready
  const [cart, setCart] = useState([]);
  const timer = useRef(null);
  const ready = phase === 'ready';
  const done = ready && (storedAnswer ? true : cart.length >= 1);
  const shopRef = useScrollIntoViewOnMobile(ready);
  useEffect(() => () => clearTimeout(timer.current), []);
  const send = () => { clearTimeout(timer.current); setPhase('building'); timer.current = setTimeout(() => setPhase('ready'), 1100); };
  const add = (i) => { if (ready) setCart(c => [...c, i]); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Xususiyat 2 · Jami narx" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : (ready ? 'Mahsulot qo\'shing' : 'Avval qo\'shing')} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Endi — <span className="italic" style={{ color: T.accent }}>jami narx</span> avtomatik hisoblanadi</h2></div>
        <Mentor>Savat bor, lekin xaridor qancha to'lashini bilishi kerak. <b style={{ color: T.ink }}>Jami narx</b> — qo'shilgan mahsulotlar narxining yig'indisi (10-darsdagi sikl/qo'shish esingizdami?). AI'ga qo'shtiramiz, keyin mahsulot qo'shib, jami o'zgarishini ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="promptbox">Savatga qo'shilgan mahsulotlarning <span className="pb-slot">jami narxini</span> avtomatik hisoblab ko'rsat.</div>
            <button className="btn" onClick={send} disabled={phase === 'building'} style={{ alignSelf: 'flex-start' }}>{phase === 'building' ? 'Quryapti…' : (ready ? '↻ Qayta' : 'Agentga yuborish')}</button>
            {ready && <div className="frame" style={{ padding: '11px 14px' }}><p className="small mono" style={{ margin: 0, color: T.ink2 }}>jami = narx[0] + narx[1] + …</p></div>}
          </Col>
          <Col>
            <p className="flow-label">Do'kon</p>
            <div ref={shopRef}><Browser url="maktab-dokoni.uz">
              {!ready && <p className="small" style={{ margin: 0, opacity: 0.55, textAlign: 'center', padding: '24px 0' }}>{phase === 'idle' ? '(jami narx hali yo\'q)' : 'Quryapti…'}</p>}
              {ready && <InteractiveShop cart={cart} onAdd={add} showCart showTotal />}
            </Browser></div>
            {ready && cart.length === 0 && <p className="hook-ack" style={{ margin: 0 }}>"+" bosing — jami narx o'zgarishini kuzating.</p>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Zo'r! Har qo'shilganda jami narx avtomatik yangilanyapti. Endi bu — haqiqiy, ishlaydigan do'kon. MVP deyarli tayyor!</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 =====
const Screen4 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 1-savol"
    questionText="Katalogni haqiqiy do'konga aylantirgan narsa nima?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Oddiy katalogni <span className="italic" style={{ color: T.accent }}>haqiqiy do'konga</span> aylantirgan narsa nima?</h2></>}
    options={['Ko\'proq rang qo\'shish', 'Savatga qo\'shish va jami narx (xarid imkoni)', 'Kattaroq shrift', 'Ko\'proq rasm']} correctIdx={1}
    explainCorrect="To'g'ri! Mahsulotni ko'rsatish — boshlanish. Lekin xaridor savatga qo'sha olsa va jami narxni ko'rsa — bu haqiqiy do'kon. Mana shu MVP'ni to'ldiradi."
    explainWrong={{
      0: 'Yo’q — rang bezak, xarid imkoni emas. Do’kon uchun savat va jami narx kerak.',
      2: 'Yo’q — shrift ko’rinish. Haqiqiy do’kon uchun savat va jami narx zarur.',
      3: 'Yo’q — rasm yaxshi, lekin asosiysi — savatga qo’shish va jami narx.',
      default: 'Savat + jami narx = haqiqiy do’kon (MVP).'
    }} />
);

// ===== SCREEN 5 — TO'LIQ ISHLAYDIGAN DO'KON =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [cart, setCart] = useState([]);
  const done = storedAnswer ? true : cart.length >= 2;
  const add = (i) => setCart(c => [...c, i]);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="To'liq MVP" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Kamida 2 mahsulot qo\'shing'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Mana — sizning <span className="italic" style={{ color: T.accent }}>ishlaydigan</span> do'koningiz!</h2></div>
        <Mentor>Hammasi birlashdi: katalog, savat va jami narx. Bu endi to'laqonli MVP. Bir necha mahsulot qo'shing — savat va jami narx birga o'zgarishini his qiling. Bu — siz qurgan haqiqiy do'kon!</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Do'kon — sinab ko'ring</p>
            <Browser url="maktab-dokoni.uz"><InteractiveShop cart={cart} onAdd={add} showCart showTotal /></Browser>
            {cart.length > 0 && <button className="btn-soft" onClick={() => setCart([])} style={{ alignSelf: 'flex-start' }}>↺ Savatni tozalash</button>}
          </Col>
          <Col>
            <p className="flow-label">Savatingiz</p>
            <div className="frame" style={{ padding: '14px 16px', minHeight: 90 }}>
              {cart.length === 0 ? <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>Savat bo'sh — "+" bosing…</p> : <>
                {cart.map((idx, k) => <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 4 }}><span>{PRODUCTS[idx].name}</span><span className="mono" style={{ color: T.ink2 }}>{som(PRODUCTS[idx].price)}</span></div>)}
                <div style={{ borderTop: `1px solid ${T.ink3}55`, marginTop: 6, paddingTop: 6, display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}><span>Jami</span><span style={{ color: T.accent }}>{som(cart.reduce((s, i) => s + PRODUCTS[i].price, 0))} so'm</span></div>
              </>}
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Siz haqiqiy, ishlaydigan do'kon qurdingiz! Boshidagi "sotib bo'lmaydigan" katalogni eslang — qancha yo'l bosib o'tdingiz.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 6 — BUG TOPISH =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [cart, setCart] = useState([]);
  const [found, setFound] = useState(storedAnswer ? 'total' : null);
  const isFound = found === 'total';
  const done = isFound;
  const ASPECTS = [['count', 'Savat soni'], ['total', 'Jami narx'], ['name', 'Mahsulot nomi'], ['none', 'Xato yo\'q']];
  const add = (i) => setCart(c => [...c, i]);
  const real = cart.reduce((s, i) => s + PRODUCTS[i].price, 0);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Bug topish" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Endi tuzatamiz' : 'Xatoni toping'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Diqqat — bu yerda bir narsa <span className="italic" style={{ color: T.accent }}>noto'g'ri</span></h2></div>
        <Mentor>AI ba'zan kichik xato qiladi — bu mutlaqo normal. Do'konga mahsulot qo'shing va <b style={{ color: T.ink }}>jami narxni diqqat bilan</b> tekshiring: u to'g'ri hisoblanyaptimi? (Maslahat: bitta narxni hisobda ushlab, jamiga solishtiring.)</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Do'kon (mahsulot qo'shing)</p>
            <Browser url="maktab-dokoni.uz"><InteractiveShop cart={cart} onAdd={add} showCart showTotal buggy /></Browser>
            {cart.length > 0 && <p className="mono small" style={{ margin: 0, color: T.ink2 }}>Haqiqiy yig'indi: {som(real)} so'm — lekin do'konda boshqa son ko'rinyapti…</p>}
          </Col>
          <Col>
            {!isFound && <>
              <p className="flow-label">Qaysi qismda xato bor?</p>
              <div className="chiprow">{ASPECTS.map(([k, l]) => <button key={k} className={`chip ${found === k ? 'chip-on' : ''}`} disabled={isFound} onClick={() => setFound(k)}>{l}</button>)}</div>
            </>}
            {found && !isFound && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bu qism to'g'ri ishlayapti. Yana solishtiring — qo'shgan narxlaringiz yig'indisi <b>jami narx</b>ga to'g'ri kelyaptimi?</p></div>}
            {isFound && <div className="takeaway fade-step"><div className="ta-bulb" style={{ fontSize: 24, fontWeight: 800, color: T.accent }}>!</div><p className="ta-h">Topdingiz — jami narx noto'g'ri!</p><p className="ta-sub">Har mahsulot ikki marta hisoblanyapti. AI adashibdi — endi aniq qilib qayta so'raymiz.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — BUG'NI AI BILAN TUZATISH =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const OPTS = [
    { id: 'a', label: 'ishlamayapti, tuzat', good: false },
    { id: 'b', label: "Jami narx ikki barobar ko'p chiqyapti — har mahsulot faqat bir marta hisoblansin", good: true },
    { id: 'c', label: 'biror narsa noto\'g\'ri', good: false }
  ];
  const [picked, setPicked] = useState(storedAnswer ? 'b' : null);
  const [cart, setCart] = useState([2, 2]);
  const good = picked === 'b';
  const done = good;
  const fixRef = useScrollIntoViewOnMobile(good);
  const add = (i) => setCart(c => [...c, i]);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Bug tuzatish" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Aniq tushuntiring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bugni AI'ga <span className="italic" style={{ color: T.accent }}>aniq tushuntiramiz</span></h2></div>
        <Mentor>Bugni tuzatish uchun AI'ga <b style={{ color: T.ink }}>aniq</b> aytish kerak: nima noto'g'ri va qanday bo'lishi kerak. "Tuzat" — kam; "jami ikki barobar ko'p, bir marta hisoblansin" — aniq. Qaysi tushuntirish eng aniq?</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">AI'ga qanday aytamiz?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {OPTS.map(o => <button key={o.id} className={`hook-option ${picked === o.id ? 'on' : ''}`} disabled={good} onClick={() => setPicked(o.id)}><span className="radio">{picked === o.id && <span className="radio-dot" />}</span><span>{o.label}</span></button>)}
            </div>
            {picked && !good && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bu juda umumiy — AI nimani tuzatishni bilmaydi. Nima noto'g'ri va qanday bo'lishi kerakligini ayting.</p></div>}
          </Col>
          <Col>
            <p className="flow-label">Do'kon (savatda 2 ta ruchka)</p>
            <div ref={fixRef}><Browser url="maktab-dokoni.uz"><InteractiveShop cart={cart} onAdd={add} showCart showTotal buggy={!good} /></Browser></div>
            {good
              ? <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Tuzatildi! Aniq tushuntirdingiz — AI bugni topdi va jami narx endi to'g'ri ({som(cart.reduce((s, i) => s + PRODUCTS[i].price, 0))} so'm). Mana — AI bilan debugging.</p></div>
              : <p className="body" style={{ margin: 0, color: T.ink3, fontSize: 13 }}>Hozircha jami narx ikki barobar (xato). Aniq buyruq tanlang — tuzatamiz.</p>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — TEST 2 =====
const Screen8 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 2-savol"
    questionText="AI bugni tuzatishi uchun unga qanday aytish kerak?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>AI bugni <span className="italic" style={{ color: T.accent }}>tuzatishi</span> uchun unga qanday aytish kerak?</h2></>}
    options={['Faqat "tuzat" deyish kifoya', 'Nima noto\'g\'ri va qanday bo\'lishi kerakligini aniq aytish', 'Hech narsa demaslik — AI o\'zi topadi', 'Jahl bilan "ishlamayapti!" deyish']} correctIdx={1}
    explainCorrect="To'g'ri! Aniq bug-report: nima noto'g'ri (jami ikki barobar) va qanday bo'lishi kerak (bir marta hisoblansin). Aniqlik — AI tez va to'g'ri tuzatadi."
    explainWrong={{
      0: 'Yo’q — "tuzat" juda umumiy. AI nimani tuzatishni bilmaydi. Aniq tushuntiring.',
      2: 'Yo’q — AI o’zi qaysi bug’ni nazarda tutganingizni bilmaydi. Aniq ayting.',
      3: 'Yo’q — hissiyot yordam bermaydi. Aniq, tinch tushuntirish ishlaydi.',
      default: 'Aniq ayting: nima noto’g’ri va qanday bo’lishi kerak.'
    }} />
);

// ===== SCREEN 9 — JILOLASH (oxirgi pardoz) =====
const Screen9 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const POLISH = [
    { id: 'checkout', label: '"Buyurtma berish" tugmasi' },
    { id: 'empty', label: 'Bo\'sh savat xabari' },
    { id: 'thanks', label: 'Buyurtmadan keyin "Rahmat!"' }
  ];
  const [applied, setApplied] = useState(storedAnswer ? 'checkout' : null);
  const [cart, setCart] = useState([0]);
  const done = !!applied;
  const add = (i) => setCart(c => [...c, i]);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Jilolash" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Bitta pardoz tanlang'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">MVP ishlayapti — endi <span className="italic" style={{ color: T.accent }}>jilolaymiz</span></h2></div>
        <Mentor>Asosiy ish tugadi. Endi do'konni <b style={{ color: T.ink }}>yanada qulay</b> qiladigan kichik pardoz qo'shamiz. Bu shart emas, lekin foydalanuvchiga yoqadi. Bitta pardozni tanlang — natijada qanday ko'rinishini ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Qaysi pardozni qo'shamiz?</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {POLISH.map(p => <button key={p.id} className={`chip ${applied === p.id ? 'chip-on' : ''}`} onClick={() => setApplied(p.id)} style={{ justifyContent: 'flex-start' }}>{applied === p.id ? '✓ ' : '+ '}{p.label}</button>)}
            </div>
          </Col>
          <Col>
            <p className="flow-label">Do'kon</p>
            <Browser url="maktab-dokoni.uz">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <InteractiveShop cart={applied === 'empty' ? [] : cart} onAdd={add} showCart showTotal />
                {applied === 'checkout' && <button className="fade-step" style={{ border: 'none', borderRadius: 10, padding: '10px', background: T.success, color: '#fff', fontFamily: "'Manrope'", fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Buyurtma berish</button>}
                {applied === 'empty' && <p className="fade-step small" style={{ margin: 0, textAlign: 'center', color: T.ink2, fontStyle: 'italic' }}>Savatingiz bo'sh — mahsulot qo'shing.</p>}
                {applied === 'thanks' && <div className="fade-step" style={{ background: T.successSoft, color: T.success, borderRadius: 10, padding: '10px 12px', fontSize: 13, fontWeight: 700, textAlign: 'center' }}>Rahmat! Buyurtmangiz qabul qilindi.</div>}
              </div>
            </Browser>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana shu kichik pardoz do'konni professional ko'rsatadi. Endi MVP to'liq jilolangan — chiqarishga tayyor!</p></div>}
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
    questionText="MVP 'tayyor' deganda nimani nazarda tutamiz?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>MVP <span className="italic" style={{ color: T.accent }}>"tayyor"</span> deganda nimani nazarda tutamiz?</h2></>}
    options={['Hech qanday kamchilik qolmagan, mukammal', 'Asosiy funksiyalar ishlaydi (keyin yaxshilash mumkin)', 'Faqat dizayn chiroyli', 'Juda ko\'p funksiya bor']} correctIdx={1}
    explainCorrect="To'g'ri! MVP tayyor = asosiy funksiyalar ishlaydi va foydalanish mumkin. U mukammal bo'lishi shart emas — keyin yaxshilab boriladi. Asosiysi — ishlaydi va chiqarsa bo'ladi."
    explainWrong={{
      0: 'Yo’q — mukammallikni kutib o’tirilmaydi. MVP — ishlaydigan eng kichik versiya, keyin yaxshilanadi.',
      2: 'Yo’q — faqat dizayn yetarli emas. MVP — ishlaydigan asosiy funksiyalar.',
      3: 'Yo’q — ko’p funksiya MVP emas. MVP — eng zarurlari ishlaydi.',
      default: 'MVP tayyor = asosiy funksiyalar ishlaydi.'
    }} />
);

// ===== SCREEN 11 — DEPLOY (dunyoga chiqarish) =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [phase, setPhase] = useState(storedAnswer ? 'live' : 'idle'); // idle | deploying | live
  const timer = useRef(null);
  const live = phase === 'live';
  const done = live;
  const liveRef = useScrollIntoViewOnMobile(live);
  useEffect(() => () => clearTimeout(timer.current), []);
  const deploy = () => { clearTimeout(timer.current); setPhase('deploying'); timer.current = setTimeout(() => setPhase('live'), 1600); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Deploy" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Saytni chiqaring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">MVP tayyor — <span className="italic" style={{ color: T.accent }}>dunyoga</span> chiqaramiz!</h2></div>
        <Mentor>Do'kon kompyuteringizda ishlayapti. Lekin haqiqiy loyiha — boshqalar ham ko'ra oladigan loyiha. <b style={{ color: T.ink }}>Deploy</b> — saytni internetga chiqarish (6-darsdagi Netlify esingizdami?). Tugmani bosing va havola oling.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Saytni internetga chiqarish</p>
            <Browser url={live ? 'maktab-dokoni.netlify.app' : 'localhost:3000'}>
              <InteractiveShop cart={[0, 2]} showCart showTotal />
            </Browser>
            <button className="btn" onClick={deploy} disabled={phase === 'deploying'} style={{ alignSelf: 'flex-start' }}>{phase === 'deploying' ? 'Chiqarilyapti…' : (live ? '✓ Chiqarildi' : 'Deploy qilish')}</button>
          </Col>
          <Col>
            <div ref={liveRef}>
              {phase === 'idle' && <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>"Deploy qilish"ni bosing</p></div>}
              {phase === 'deploying' && <div className="frame"><p className="body" style={{ margin: 0, color: T.ink2 }}>Fayllar yuklanyapti… server tayyorlanyapti…</p></div>}
              {live && <div className="frame-success fade-step" style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 700, fontSize: 'clamp(18px,3vw,22px)', color: T.success, margin: '0 0 8px' }}>Saytingiz endi internetda!</p>
                <p className="mono small" style={{ margin: '0 0 10px', color: T.ink, background: T.paper, borderRadius: 8, padding: '8px 10px', display: 'inline-block' }}>https://maktab-dokoni.netlify.app</p>
                <p className="body" style={{ margin: 0, color: T.ink }}>Bu havolani do'stlaringizga yuboring — ular ham do'koningizni ochib ko'ra oladi. Siz haqiqiy ilova chiqardingiz!</p>
              </div>}
            </div>
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — SIZ NIMA QURDINGIZ (tabrik) =====
const Screen12 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const ACH = [
    { id: 'cat', label: 'Mahsulot katalogini qurdim' },
    { id: 'cart', label: 'Savat qo\'shdim — ishlaydi' },
    { id: 'total', label: 'Jami narx avtomatik hisoblanadi' },
    { id: 'deploy', label: 'Internetga chiqardim (deploy)' }
  ];
  const [got, setGot] = useState(storedAnswer ? new Set(ACH.map(a => a.id)) : new Set());
  const done = got.size >= ACH.length;
  const claim = (id) => setGot(prev => { const n = new Set(prev); n.add(id); return n; });
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Tabriklaymiz" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Yutuqlarni belgilang'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Mana — <span className="italic" style={{ color: T.accent }}>siz</span> qurgan do'kon!</h2></div>
        <Mentor>To'xtab, bir nazar tashlang: nolingdan boshlab, haqiqiy, internetda ishlaydigan do'kon qurdingiz. Quyidagi yutuqlarning har birini bosib, "o'zimniki" deb belgilang — bularning hammasini <b style={{ color: T.ink }}>siz</b> qildingiz.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Tayyor do'kon</p>
            <Browser url="maktab-dokoni.netlify.app"><InteractiveShop cart={[0, 2, 1]} showCart showTotal /></Browser>
          </Col>
          <Col>
            <p className="flow-label">Sizning yutuqlaringiz</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ACH.map(a => {
                const ok = got.has(a.id);
                return (
                  <button key={a.id} onClick={() => claim(a.id)} disabled={ok} style={{ textAlign: 'left', border: 'none', borderRadius: 11, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, background: T.paper, cursor: ok ? 'default' : 'pointer', boxShadow: ok ? `inset 0 0 0 2px ${T.success}` : `0 6px 16px -6px rgba(${T.shadowBase},0.14)` }}>
                    <span style={{ color: ok ? T.success : T.ink3, fontWeight: 700, fontSize: 16 }}>{ok ? '✓' : '○'}</span>
                    <span style={{ fontWeight: 600, fontSize: 14, color: T.ink }}>{a.label}</span>
                  </button>
                );
              })}
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>To'rttala yutuq — sizniki! Bu bir kichik sahifa emas, to'laqonli, ishlaydigan, chiqarilgan loyiha. Haqiqiy dasturchi ishi.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 13 — BUTUN SAFAR (4 praktika) =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const PRACTICES = [
    { n: '1', name: 'Saytni jonlantirish', gain: 'Interaktivlik: hodisa → reaksiya → o\'zgarish' },
    { n: '2', name: 'AI bilan tez sayt', gain: 'Yaxshi prompt, iteratsiya, tekshirish' },
    { n: '3', name: 'Dekompozitsiya', gain: 'Bo\'laklash, MVP, rejalashtirish' },
    { n: '4', name: 'MVP tayyor', gain: 'To\'liq loyiha qurish va deploy' }
  ];
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(new Set());
  const done = seen.size >= 4;
  const tap = (n) => { setActive(n); setSeen(prev => { const s = new Set(prev); s.add(n); return s; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Butun safar" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Har bir darsni bosing'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Qarang — qancha <span className="italic" style={{ color: T.accent }}>yo'l bosib o'tdingiz</span></h2></div>
        <Mentor>Bu 4 ta praktikada siz bir necha kichik tugmadan to'laqonli, chiqarilgan ilovagacha keldingiz. Har bir darsni bosib, nimani egallaganingizni eslang.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {PRACTICES.map(p => (
                <button key={p.n} onClick={() => tap(p.n)} style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', cursor: 'pointer', border: 'none', borderRadius: 12, padding: '13px 15px', background: T.paper, boxShadow: active === p.n ? `inset 0 0 0 2px ${T.accent}, 0 8px 20px -6px rgba(255,79,40,0.2)` : `0 6px 16px -6px rgba(${T.shadowBase},0.14)`, transition: 'all 0.18s' }}>
                  <span className="num-badge">{p.n}</span>
                  <span style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, fontSize: 15, color: T.ink, flex: 1 }}>{p.name}</span>
                  {seen.has(p.n) && <span style={{ color: T.success }}>✓</span>}
                </button>
              ))}
            </div>
          </Col>
          <Col>
            {active ? (
              <div className="sk-info fade-step" key={active}>
                <span className="sk-tagbig"><span className="num-badge" style={{ width: 24, height: 24, fontSize: 12 }}>{active}</span><span className="sk-wordbadge">{PRACTICES.find(p => p.n === active).name}</span></span>
                <p className="body" style={{ color: T.ink, margin: '11px 0 0' }}>Bu darsda egalladingiz: <b>{PRACTICES.find(p => p.n === active).gain}</b></p>
              </div>
            ) : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Bir darsni bosing</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bularning hammasi — bitta katta mahorat: <b>g'oyani real, chiqarilgan loyihaga aylantirish</b>. Endi bu sizda bor.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — ANTIGRAVITY (to'liq loyiha) =====
const Screen14 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const STEPS14 = [
    { t: 'Rejani yozasiz', d: 'Antigravity\'ga oddiy tilda nima kerakligini aytasiz.' },
    { t: 'Agent reja + quradi', d: 'Rejani ko\'rsatadi — tasdiqlaysiz — quradi.' },
    { t: 'Brauzerda tekshirasiz', d: 'Natijani sinab ko\'rasiz: ishlayaptimi?' },
    { t: 'Kerak bo\'lsa qayta so\'raysiz', d: 'Bug yoki o\'zgartirish — aniq aytib tuzattirasiz.' },
    { t: 'Deploy qilasiz', d: 'Havola olib, dunyoga chiqarasiz.' }
  ];
  const [shown, setShown] = useState(storedAnswer ? STEPS14.length : 0);
  const done = shown >= STEPS14.length;
  const next = () => setShown(s => Math.min(s + 1, STEPS14.length));
  const doneRef = useScrollIntoViewOnMobile(done);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Haqiqiy asbob" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Qadamlarni ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Antigravity'da <span className="italic" style={{ color: T.accent }}>to'liq loyiha</span> shunday quriladi</h2></div>
        <Mentor>Bugun o'rgangan hamma narsa haqiqiy <b style={{ color: T.ink }}>Antigravity</b>da bitta oqimga birlashadi. Quyidagi qadamlarni ketma-ket ochib chiqing — uyga vazifada aynan shu yo'l bilan o'z loyihangizni qurasiz.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {STEPS14.map((s, i) => (
                <div key={i} className="frame" style={{ padding: '12px 14px', opacity: i < shown ? 1 : 0.35, display: 'flex', gap: 11, alignItems: 'flex-start', transition: 'opacity 0.3s' }}>
                  <span className="num-badge" style={{ width: 26, height: 26, fontSize: 12, background: i < shown ? T.accent : T.bg, color: i < shown ? '#fff' : T.ink3 }}>{i + 1}</span>
                  <div><div style={{ fontWeight: 700, fontSize: 14, color: T.ink }}>{s.t}</div>{i < shown && <p className="small fade-step" style={{ margin: '2px 0 0', color: T.ink2 }}>{s.d}</p>}</div>
                </div>
              ))}
            </div>
            {!done && <button className="btn" onClick={next} style={{ alignSelf: 'flex-start' }}>{shown === 0 ? 'Boshlash →' : 'Keyingi qadam →'}</button>}
          </Col>
          <Col>
            <div ref={doneRef}>
              {!done ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Qadamlarni ochib boring…</p></div>
                : <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana to'liq oqim: <b>reja → qur → tekshir → tuzat → deploy</b>. Uyga vazifada o'z g'oyangizni shu yo'l bilan haqiqatga aylantiring.</p></div>}
            </div>
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 15 — YAKUNIY (har qanday loyiha qadamlari) =====
const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const STEPS = [
    { id: 'plan', label: 'G\'oyani bo\'lakla (reja)' },
    { id: 'mvp', label: 'MVP\'ni belgila' },
    { id: 'build', label: 'AI bilan qur' },
    { id: 'check', label: 'Natijani tekshir' },
    { id: 'deploy', label: 'Deploy qil' }
  ];
  const CORRECT = ['plan', 'mvp', 'build', 'check', 'deploy'];
  const [order, setOrder] = useState(storedAnswer?.correct ? CORRECT : []);
  const [passed, setPassed] = useState(!!storedAnswer?.correct);
  const passedRef = useScrollIntoViewOnMobile(passed);
  const full = order.length === STEPS.length;
  const correct = full && order.join() === CORRECT.join();
  const add = (id) => { if (!order.includes(id)) setOrder(o => [...o, id]); };
  const reset = () => setOrder([]);
  const label = (id) => STEPS.find(s => s.id === id).label;
  useEffect(() => { if (correct && !passed) { setPassed(true); onAnswer(screen, { stage: 'final', screenIdx: screen, question: 'Har qanday loyiha qadamlari tartibi', studentAnswer: order.join('>'), correct: true, firstAttemptCorrect: true, solved: true, picked: order.join('>') }); } }, [correct]);
  return (
    <Stage eyebrow="Yakuniy · amaliy" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!passed} label={passed ? 'Davom etish' : 'To\'g\'ri tartibni tuzing'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Oxirgi sinov: <span className="italic" style={{ color: T.accent }}>istalgan</span> loyiha yo'li</h2></div>
        <Mentor>Mana — butun modulning sirri bitta ketma-ketlikda. Endi siz <b style={{ color: T.ink }}>istalgan</b> loyihani shu yo'l bilan qura olasiz. Qadamlarni to'g'ri tartibga qo'ying.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Qadamlar (bosib tartibga qo'ying)</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {STEPS.map(s => <button key={s.id} className="chip" onClick={() => add(s.id)} disabled={order.includes(s.id)} style={{ justifyContent: 'flex-start', opacity: order.includes(s.id) ? 0.4 : 1 }}>{s.label}</button>)}
            </div>
            {order.length > 0 && !passed && <button className="btn-soft" onClick={reset} style={{ alignSelf: 'flex-start' }}>↺ Tozalash</button>}
          </Col>
          <Col>
            <p className="flow-label">Sizning yo'lingiz</p>
            <div className="frame" style={{ padding: '14px 16px', minHeight: 100 }}>
              {order.length === 0 ? <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>Chapdan qadamlarni tanlang…</p> : order.map((id, i) => <div key={id} style={{ display: 'flex', gap: 9, alignItems: 'center', marginBottom: 6 }}><span className="num-badge" style={{ width: 24, height: 24, fontSize: 12 }}>{i + 1}</span><span style={{ fontSize: 14, color: T.ink }}>{label(id)}</span></div>)}
            </div>
            {full && !correct && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Tartib boshqacha. Eslang: avval o'ylash (reja, MVP), keyin qurish, so'ng tekshirish, oxirida chiqarish. Tozalab, qayta urinib ko'ring.</p></div>}
            {passed && <div ref={passedRef} className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mukammal! Reja → MVP → qur → tekshir → deploy. Bu — istalgan loyihaning universal yo'li. Siz uni egalladingiz!</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — YAKUN =====
const Screen16 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const RECAP = ['Savat va jami narx — katalogni haqiqiy do\'konga aylantiradi', 'AI ham adashadi — aniq tushuntirib, qayta so\'rab tuzatamiz', 'MVP tayyor = asosiy funksiyalar ishlaydi (keyin yaxshilanadi)', 'Deploy — loyihani dunyoga chiqarish', 'Universal yo\'l: reja → MVP → qur → tekshir → deploy'];
  const HOMEWORK = [{ b: 'O\'z g\'oyangiz', t: '— bitta loyihani tanlab, MVP\'sini belgilang' }, { b: 'Antigravity\'da quring', t: '— reja, qur, tekshir, bug bo\'lsa tuzating' }, { b: 'Deploy qiling', t: '— havolani oling va kimgadir ulashing!' }];
  const GLOSSARY = [{ b: 'Savat', t: '— tanlangan mahsulotlar ro\'yxati' }, { b: 'Jami narx', t: '— narxlar yig\'indisi' }, { b: 'Bug', t: '— dasturadagi xato' }, { b: 'Debugging', t: '— xatoni topib tuzatish' }, { b: 'Deploy', t: '— saytni internetga chiqarish' }, { b: 'MVP', t: '— eng kichik ishlaydigan versiya' }];
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
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">✓</span> Praktika moduli tugadi</span><h2 className="title h-title fade-up d1">Endi siz <span className="italic" style={{ color: T.accent }}>istalgan loyihani</span> qura olasiz</h2><p className="body h-sub fade-up d2">{PASSED ? 'Tabriklaymiz! Siz g\'oyadan tortib internetda ishlaydigan ilovagacha bo\'lgan butun yo\'lni bosib o\'tdingiz. Bu — haqiqiy dasturchining mahorati.' : 'Yaxshi harakat! MVP, bug tuzatish va deploy — bir-ikki ekranni qayta ko\'rib mustahkamlang.'}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span className="tick" style={{ width: 16, height: 16, borderRadius: '50%', background: T.success, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck">✓</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>Uyga vazifa</div><p className="body" style={{ margin: '0 0 10px', color: T.ink }}>O'z ilovangizni quring va chiqaring:</p><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">Demak: siz istalgan g'oyani real, ishlaydigan loyihaga aylantira olasiz. 🚀</p></div>
        </div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">Kalit so'zlar (MVP va deploy)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};
// ============================================================ LESSON ROOT
export default function PracticeLesson4({ lang: langProp, onFinished }) {
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
