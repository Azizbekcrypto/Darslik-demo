import React, { useState, useEffect, useRef, createContext, useContext, useCallback, useMemo } from 'react';
import mentorImg from '../../assets/common/mentor.png';

// ============================================================
// BOTLAR VA AVTOMATIZATSIYA MODULI · DARS 7 (P4) — FIDBEK VA ITERATSIYA — PLATFORM STANDARD v16 (AUDIOSIZ)
// Maqsad: o'quvchi tayyor mahsulotni (P3 bot) foydalanuvchi fikri bilan YAXSHILASHni o'rganadi.
//         Chalkash inson fikrini → triaj → prioritet (chastota × ta'sir) → aniq o'zgarish → AI prompt → qayta tinglash.
// Yangi ko'nikma: vibecoding'dan (o'zing test qilib bug topish, P1/P3) FARQI — bu yerda FOYDALANUVCHI aytadi, siz saralaysiz.
// Metafora: SIZ — restoran egasi, fikr — mehmonlar kitobi. Mahsulot hech qachon "tayyor" emas — iteratsiya.
// O'zak sikl: Tingla → Guruhla → Tanla → Tuzat → Qayta tingla. P5 KO'PRIK: qo'lda sikl (P4) → agent sikli (P5).
// SIFAT: javob aralashtirish (placeCorrect), mobil avtoscroll, mentor mobil, "siz" rasmiy. AUDIOSIZ. Lotincha.
// PRODUCTION: <style> ichidagi @import OLIB TASHLANADI.
// ============================================================

const T = {
  bg: '#F6F4EF', ink: '#0E0E10', ink2: '#5A5A60', ink3: '#A7A6A2',
  paper: '#FFFFFF', accent: '#FF4F28', accentSoft: '#FFE8E1',
  success: '#1F7A4D', successSoft: '#E3F0E8', blue: '#019ACB', blueSoft: '#E2F4FA',
  danger: '#C2362B', dangerSoft: '#FAE3E0', amber: '#B45309', amberSoft: '#F7ECD9',
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

const LESSON_META = { lessonId: 'bot-feedback-iteration-v1', lessonTitle: { uz: 'Fidbek va iteratsiya', ru: 'Фидбек и итерации' } };
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
  { id: 's10', type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's11', type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's12', type: 'case',        template: 'custom',   scored: false, scope: null },
  { id: 's13', type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's14', type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's15', type: 'test',        template: 'custom',   scored: true,  scope: 'final' },
  { id: 's16', type: 'summary',     template: 'custom',   scored: false, scope: null }
];
const TOTAL_SCREENS = SCREEN_META.length;
const SCORED_IDX = SCREEN_META.map((m, i) => (m.scored ? i : null)).filter(i => i !== null);

const Split = ({ children }) => <div className="split">{children}</div>;
const Col = ({ children, gap }) => <div className="col" style={gap ? { gap } : undefined}>{children}</div>;

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

const Stage = ({ children, eyebrow, screen, totalScreens = TOTAL_SCREENS, navContent, narrow, mentorStatic, scrollSignal }) => {
  const isMobile = useIsMobile();
  const isNarrow = useIsMobile(768);
  const collapseOn = isNarrow && !mentorStatic;
  const padH = isMobile ? 12 : 100;
  const [mCollapsed, setMCollapsed] = useState(false);
  const contentRef = useRef(null);
  useEffect(() => { setMCollapsed(false); }, [screen]);
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
    const tgt = e.target;
    if (tgt && tgt.closest && tgt.closest('.mentor')) return;
    setMCollapsed(true);
    const isControl = tgt && tgt.closest && tgt.closest('button, input, a, .vcard, .option, .hook-option, .pick-row');
    if (!isControl) {
      const el = contentRef.current;
      if (el) setTimeout(() => { if (el) el.scrollTo({ top: 0, behavior: 'smooth' }); }, 80);
    }
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

function placeCorrect(n, correctIdx, screen) {
  const others = [];
  for (let i = 0; i < n; i++) if (i !== correctIdx) others.push(i);
  let seed = ((screen + 7) * 48271) % 2147483647;
  const rnd = () => { seed = (seed * 48271) % 2147483647; return seed / 2147483647; };
  for (let i = others.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); const t = others[i]; others[i] = others[j]; others[j] = t; }
  const pos = n > 1 ? 1 + (screen % (n - 1)) : 0;
  const out = []; let oi = 0;
  for (let p = 0; p < n; p++) out.push(p === pos ? correctIdx : others[oi++]);
  return out;
}
const QuestionScreen = ({ screen, scope, eyebrow, question, questionText, options, correctIdx, explainCorrect, explainWrong, storedAnswer, onAnswer, onNext, onPrev }) => {
  const order = useMemo(() => placeCorrect(options.length, correctIdx, screen), [options.length, correctIdx, screen]);
  const dispOptions = order.map(i => options[i]);
  const dispCorrect = order.indexOf(correctIdx);
  const [picked, setPicked] = useState(storedAnswer?.lastPicked ?? storedAnswer?.picked ?? null);
  const [solved, setSolved] = useState(storedAnswer ? (storedAnswer.solved ?? (storedAnswer.picked === dispCorrect)) : false);
  const firstCorrectRef = useRef(storedAnswer ? (storedAnswer.firstAttemptCorrect ?? storedAnswer.correct ?? null) : null);
  const pick = (i) => {
    if (solved) return;
    setPicked(i);
    const isCorrect = i === dispCorrect;
    if (firstCorrectRef.current === null) firstCorrectRef.current = isCorrect;
    if (isCorrect) setSolved(true);
    onAnswer(screen, { stage: scope, screenIdx: screen, question: questionText, options: dispOptions, correctIndex: dispCorrect, correctAnswer: dispOptions[dispCorrect], picked: i, studentAnswerIndex: i, studentAnswer: dispOptions[i], correct: firstCorrectRef.current, firstAttemptCorrect: firstCorrectRef.current, solved: isCorrect, lastPicked: i });
  };
  return (
    <Stage eyebrow={eyebrow} screen={screen} narrow navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!solved} label={solved ? 'Davom etish' : "To'g'ri javobni toping"} onClick={onNext} /></>}>
      <div className="screen" style={{ justifyContent: 'center', gap: 'clamp(16px,2.5vw,24px)' }}>
        <div className="fade-up">{question}</div>
        <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {dispOptions.map((opt, i) => {
            let cls = 'option';
            if (solved) { if (i === dispCorrect) cls += ' option-correct'; else cls += ' option-wrong'; }
            else if (i === picked) cls += ' option-picked-wrong';
            return (
              <button key={i} className={cls} disabled={solved} onClick={() => pick(i)} style={{ padding: 'clamp(12px,1.8vw,16px) clamp(14px,2.2vw,20px)', fontSize: 'clamp(14px,1.7vw,16px)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="mono small" style={{ minWidth: 20, color: solved && i === dispCorrect ? T.success : T.ink3 }}>{String.fromCharCode(65 + i)}</span>
                <span style={{ flex: 1 }}>{opt}</span>
              </button>
            );
          })}
        </div>
        <FeedbackBlock show={picked !== null} isCorrect={solved}>
          <p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: solved ? T.success : T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{solved ? "To'g'ri" : "Qaytadan urinib ko'ring"}</p>
          <p className="body" style={{ margin: 0 }}>{solved ? explainCorrect : (explainWrong[order[picked]] ?? explainWrong.default)}</p>
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

// ============================================================ BOT MAVZUSI KOMPONENTLARI

const TgChat = ({ title = 'AvtoPizza bot', sub = 'bot · onlayn', ava = '🍕', children, input = true, minH }) => (
  <div className="tg">
    <div className="tg-head"><span className="tg-ava">{ava}</span><span className="tg-name">{title}<span className="tg-status">{sub}</span></span></div>
    <div className="tg-body" style={{ minHeight: minH }}>{children}</div>
    {input && <div className="tg-input"><span className="tg-input-field">Xabar yozing…</span><span className="tg-send">➤</span></div>}
  </div>
);
const Bubble = ({ from = 'bot', children, thinking }) => (
  <div className={`tg-bubble-wrap ${from}`}>
    <div className={`tg-bubble ${from} ${thinking ? 'think' : ''} el-in`}>{thinking ? <span className="gen-dots inline"><i /><i /><i /></span> : children}</div>
  </div>
);
const PromptCard = ({ children, who = 'prompt', tone }) => (
  <div className={`prompt-card ${tone || ''}`}><span className="prompt-who">📝 {who}</span><p className="prompt-text">{children}</p></div>
);
const TypeBadge = ({ ico, label, color, soft }) => (
  <span className="type-badge" style={{ color, background: soft }}>{ico} {label}</span>
);

// ===== FIKR TURLARI =====
const TYPES = {
  bug: { ico: '🐞', label: 'Buzuq (bug)', color: T.danger, soft: T.dangerSoft },
  ux: { ico: '😕', label: 'Chalkashlik (UX)', color: T.amber, soft: T.amberSoft },
  feature: { ico: '💡', label: 'Taklif (feature)', color: T.blue, soft: T.blueSoft },
  praise: { ico: '👍', label: 'Maqtov', color: T.success, soft: T.successSoft }
};

// ===== FIKR MANBALARI (s2) =====
const SOURCES = [
  { id: 'direct', ico: '💬', label: "To'g'ridan xabar", desc: "Foydalanuvchi botga to'g'ridan-to'g'ri shikoyat yoki taklif yozadi — eng aniq signal." },
  { id: 'drop', ico: '🚪', label: 'Tiqilib qolish', desc: "Ko'p odam suhbatning bir joyida to'xtab, ketib qoladi (drop-off). Demak o'sha qadam chalkash." },
  { id: 'repeat', ico: '🔁', label: 'Takror savollar', desc: "Bir xil savol qayta-qayta berilsa — bot biror narsani aniq ko'rsatmayapti." },
  { id: 'error', ico: '⚠️', label: 'Xatolar / loglar', desc: "Serverdagi xato yozuvlari — qayerda bot buzilayotganini ko'rsatadi (texnik signal)." }
];

// ===== KELGAN FIKRLAR (s3 — inbox) =====
const REVIEWS = [
  { id: 'r1', txt: "Bot manzilimni 2 marta so'radi 😤", t: 'bug', why: "Bot holatni eslab qolmagan (o'tgan darsda o'rgangan) — bu buzuq xatti-harakat. Tuzatish kerak." },
  { id: 'r2', txt: "Narxni hech qayerda ko'rsatmaydi", t: 'ux', why: "Bot ishlaydi, lekin noqulay — foydalanuvchi adashadi. Bu chalkashlik (UX)." },
  { id: 'r3', txt: "Glutensiz pizza qo'shsangiz zo'r bo'lardi", t: 'feature', why: "Hozir yo'q narsa so'ralyapti — yangi imkoniyat (taklif). Qo'shishni direktor hal qiladi." },
  { id: 'r4', txt: "Juda tez va qulay, rahmat! 🍕", t: 'praise', why: "Maqtov — nima yaxshi ishlayotganini bildiradi. Buni saqlang, tuzatishda buzib qo'ymang." }
];

// ===== SHIKOYAT CHASTOTASI (s5) =====
const COMPLAINTS = [
  { id: 'addr', label: "Manzilni qayta so'raydi", n: 18, pain: 'yuqori' },
  { id: 'price', label: "Narx ko'rinmaydi", n: 12, pain: "o'rta" },
  { id: 'long', label: "Javoblar juda uzun", n: 5, pain: 'past' },
  { id: 'gluten', label: "Glutensiz yo'q", n: 3, pain: 'past' }
];
const MAX_N = 18;

// ===== NOANIQ → ANIQ (s7) =====
const PAIRS = [
  { id: 'p1', vague: "«Menyu chalkash»", concrete: "Har pizza yoniga narx va 2-3 so'z tavsif qo'sh." },
  { id: 'p2', vague: "«Bot meni tushunmaydi»", concrete: "system prompt'ga: noaniq savolda aniqlovchi savol ber." },
  { id: 'p3', vague: "«Sekin javob beradi»", concrete: "Oddiy savollarni AI'siz, tugma bilan tez javob ber." }
];

// ===== ITERATSIYA SIKLI (final s15) =====
const FLOW = [
  { id: 'listen', ico: '👂', label: 'Tingla', d: "foydalanuvchi fikrini yig'." },
  { id: 'group', ico: '🗂️', label: 'Guruhla', d: "bir xil shikoyatlarni birlashtir." },
  { id: 'pick', ico: '🎯', label: 'Tanla', d: "chastota × ta'sir — eng og'riqlisini." },
  { id: 'fix', ico: '🔧', label: 'Tuzat', d: "aniq o'zgarish → AI prompt." },
  { id: 'relisten', ico: '🔁', label: 'Qayta tingla', d: "ishladimi? yana fikr yig'." }
];
const FLOW_ORDER = FLOW.map(f => f.id);
const FLOW_SCRAMBLED = ['pick', 'listen', 'relisten', 'group', 'fix'];

// ===== SCREEN 0 — HOOK: shikoyatlar kela boshladi =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [tried, setTried] = useState(!!storedAnswer);
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const [sc, setSc] = useState(0);
  const OPTS = [
    { id: 'a', label: "Hech narsa — bot ishlayapti, shikoyat normal holat" },
    { id: 'b', label: "Fikrlarni tinglab, eng ko'p og'ritganini tuzataman va yana so'rayman" },
    { id: 'c', label: "Hammasini darrov noldan qayta yozaman" }
  ];
  const poke = () => { setTried(true); setSc(n => n + 1); };
  const pick = (v) => { if (picked !== null || !tried) return; setPicked(v); setSc(n => n + 1); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: true }); };
  return (
    <Stage eyebrow="Loyiha · kirish" screen={screen} scrollSignal={sc} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 880 }}>Botingiz jonli, mijozlar foydalanyapti. Endi <span className="italic" style={{ color: T.accent }}>fikr</span> kela boshladi. Nima qilasiz?</h1>
        <Mentor>Eng yaxshi mahsulot ham birinchi versiyada mukammal emas. Foydalanuvchilar uni siz ko'rmagan tomondan ishlatadi. Tugmani bosib, kelgan fikrlarni ko'ring.</Mentor>
        <Zoomable><Split>
          <Col>
            <div className="review-stack">
              <div className="review-card r-in" style={{ animationDelay: '0s' }}><span className="rc-ava">🙍</span><p className="rc-txt">Manzilimni 2 marta so'radi 😤</p></div>
              {tried && <>
                <div className="review-card r-in" style={{ animationDelay: '0.1s' }}><span className="rc-ava">🧑</span><p className="rc-txt">Narxni ko'rsatmaydi, noqulay</p></div>
                <div className="review-card r-in" style={{ animationDelay: '0.2s' }}><span className="rc-ava">👩</span><p className="rc-txt">Glutensiz pizza qo'shing!</p></div>
                <div className="review-card r-in" style={{ animationDelay: '0.3s' }}><span className="rc-ava">🧔</span><p className="rc-txt">Tez va qulay, rahmat! 🍕</p></div>
              </>}
            </div>
            <button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={poke} disabled={tried}>{tried ? '✓ Fikrlar keldi' : "▶ Mijozlar nima dedi?"}</button>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Eng to'g'ri qadam qaysi?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => {
                const on = picked === o.id;
                return (<button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null || !tried} style={{ opacity: !tried ? 0.55 : 1 }} onClick={() => pick(o.id)}><span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span></button>);
              })}
            </div>
            {!tried && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>Avval tugmani bosing ←</p>}
            {picked !== null && <p className="hook-ack fade-step">Aynan! Mahsulot hech qachon «tayyor» bo'lmaydi — u <b>iteratsiya</b> qiladi. Bugun fikrni tinglab, saralab, eng muhimini tuzatib, yana tinglashni o'rganamiz.</p>}
          </Col>
        </Split></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const STEPS = [
    { text: "Fikrni tinglash va turlarga ajratish (triaj)", tag: 'tingla' },
    { text: "Guruhlab, prioritet qo'yish (chastota × ta'sir)", tag: 'tanla' },
    { text: "Noaniq fikrni aniq o'zgarishga aylantirish", tag: 'tuzat' },
    { text: "Qayta tinglash — iteratsiya sikli", tag: 'sikl' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const Preview = (
    <Col>
      <p className="flow-label">dars oxirida — yaxshilangan bot</p>
      <TgChat input={false} minH={0} sub="bot · v2 🟢">
        <Bubble from="user">Margarita, Chilonzor 5</Bubble>
        <Bubble from="bot">Qabul qilindi ✅ Margarita (45 000 so'm) · Chilonzor 5 📍 — manzilni qayta so'ramayman 😊</Bubble>
      </TgChat>
      <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>Mijozlar shikoyat qilgan narsalar tuzatildi: manzil bir marta so'raladi, narx ko'rinadi. Mahsulot yaxshilandi.</p></div>
    </Col>
  );
  const StepsB = (
    <Col>
      <p className="flow-label">Bugungi 4 qadam</p>
      <ol className="roadmap">{STEPS.map((s, i) => (<li key={i} className="step-card fade-up" style={{ animationDelay: `${0.08 + i * 0.05}s` }}><span className="step-num">{String(i + 1).padStart(2, '0')}</span><span className="step-body"><span className="step-text">{s.text}</span><span className="step-tag">{s.tag}</span></span></li>))}</ol>
    </Col>
  );
  return (
    <Stage eyebrow="Reja" screen={screen} mentorStatic scrollSignal={showSteps} navContent={<><NavBack onPrev={onPrev} /><NavNext label="Boshlaymiz →" onClick={onNext} /></>}>
      <div className="screen">
        <div className="head"><h2 className="title h-title fade-up">Siz — <span className="italic" style={{ color: T.accent }}>restoran egasisiz</span>, fikr — mehmonlar kitobi.</h2></div>
        <Mentor>Eslang vibecoding (o'tgan darslarda): <b style={{ color: T.ink }}>siz o'zingiz</b> test qilib bug topardingiz. Bugun boshqacha — <b style={{ color: T.ink }}>foydalanuvchilar</b> muammoni aytadi, siz saralab, eng muhimini tuzatasiz. Yangi mahorat: chalkash fikrni aniq vazifaga aylantirish.</Mentor>
        {!isNarrow ? (<Zoomable><Split>{Preview}{StepsB}</Split></Zoomable>)
          : !showSteps ? <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>{Preview}<button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>4 qadamni ko'rish</button></div>
            : <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}><button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ Natijani ko'rish</button>{StepsB}</div>}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — FIKR QAYERDAN KELADI =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(SOURCES.map(s => s.id)) : new Set());
  const [active, setActive] = useState(null);
  const [sc, setSc] = useState(0);
  const done = seen.size >= SOURCES.length;
  const tap = (id) => { setActive(id); setSeen(prev => new Set(prev).add(id)); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = SOURCES.find(s => s.id === active);
  return (
    <Stage eyebrow="Tushuncha · manba" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `4 manbani ko'ring (${seen.size}/4)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Fikr faqat <span className="italic" style={{ color: T.accent }}>shikoyatda</span> emas — 4 manbadan keladi.</h2></div>
        <Mentor>Foydalanuvchi har doim ham «menga bu yoqmadi» deb yozmaydi. Ko'pincha fikr <b style={{ color: T.ink }}>xatti-harakatda</b> ko'rinadi — qayerda to'xtaydi, nimani qayta so'raydi. Har manbani bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {SOURCES.map(s => <button key={s.id} className="gchip" onClick={() => tap(s.id)} style={seen.has(s.id) ? { boxShadow: `inset 0 0 0 1.5px ${T.success}`, color: T.success } : undefined}>{seen.has(s.id) ? '✓ ' : ''}{s.ico} {s.label}</button>)}
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>To'g'ri xabar — eng aniq, lekin kam. Xatti-harakat (drop-off, takror) — ko'p va yashirin. Yaxshi direktor ikkalasini ham o'qiydi.</p></div>}
          </Col>
          <Col>
            {cur
              ? <div className="sk-info fade-step" key={active}><p className="note-h"><span style={{ fontSize: 18, marginRight: 6 }}>{cur.ico}</span>{cur.label}</p><p className="body" style={{ margin: 0, color: T.ink }}>{cur.desc}</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Manbani bosing ←</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — FEEDBACK INBOX (triaj) =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(REVIEWS.map(r => r.id)) : new Set());
  const [active, setActive] = useState(null);
  const [sc, setSc] = useState(0);
  const done = seen.size >= REVIEWS.length;
  const tap = (id) => { setActive(id); setSeen(prev => new Set(prev).add(id)); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = REVIEWS.find(r => r.id === active);
  const curType = cur ? TYPES[cur.t] : null;
  return (
    <Stage eyebrow="Triaj · saralash" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `4 fikrni saralang (${seen.size}/4)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Har fikr — <span className="italic" style={{ color: T.accent }}>boshqa</span> signal. Avval turini aniqlang.</h2></div>
        <Mentor>Fikrlar chalkash kiradi. Birinchi ish — har birini turga ajratish: <b style={{ color: T.ink }}>buzuq</b> (tuzat), <b style={{ color: T.ink }}>chalkashlik</b> (soddalashtir), <b style={{ color: T.ink }}>taklif</b> (qaror qil), <b style={{ color: T.ink }}>maqtov</b> (saqla). Har fikrni bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="review-stack">
              {REVIEWS.map(r => {
                const ty = TYPES[r.t];
                const on = seen.has(r.id);
                return (
                  <button key={r.id} className={`review-card tap ${active === r.id ? 'sel' : ''}`} onClick={() => tap(r.id)}>
                    <span className="rc-ava">💬</span>
                    <p className="rc-txt" style={{ flex: 1 }}>{r.txt}</p>
                    {on ? <TypeBadge ico={ty.ico} label={ty.label.split(' ')[0]} color={ty.color} soft={ty.soft} /> : <span className="pick-plus">▶</span>}
                  </button>
                );
              })}
            </div>
          </Col>
          <Col>
            {cur
              ? <div className="sk-info fade-step" key={active}><p className="note-h"><TypeBadge ico={curType.ico} label={curType.label} color={curType.color} soft={curType.soft} /></p><p className="body" style={{ margin: '8px 0 0', color: T.ink }}>{cur.why}</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Fikrni bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Saraladingiz! Endi har turga boshqacha munosabat: bug — darrov tuzat, taklif — o'ylab qaror qil, maqtov — buzma. Bu — triaj.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 (signal turi — global) =====
const Screen4 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 1-savol"
    questionText="Foydalanuvchi 'bot manzilimni 2 marta so'radi' dedi. Bu qanday signal?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>«Bot manzilimni <span className="italic" style={{ color: T.accent }}>2 marta</span> so'radi» — bu qanday signal?</h2></>}
    options={["Buzuq xatti-harakat (bug) — bot holatni eslab qolmagan, tuzatish kerak", "Yangi imkoniyat so'rovi (taklif) — qaror qilish kerak", "Maqtov — demak bot to'g'ri ishlayapti", "Ahamiyatsiz shovqin — e'tibor bermaslik kerak"]} correctIdx={0}
    explainCorrect="To'g'ri! Bu bug — bot kutilgan ishni bajarmayapti (holatni eslamayapti). Har fikr boshqa harakat talab qiladi: bug → tuzat, taklif → qaror qil, maqtov → saqla. Turini to'g'ri aniqlash — birinchi qadam."
    explainWrong={{
      1: "Taklif — bu hozir yo'q narsani so'rash. Bu yerda mavjud narsa noto'g'ri ishlayapti — demak bug.",
      2: "Maqtov ijobiy fikr. «So'radi 😤» — bu norozilik, ya'ni buzuq xatti-harakat (bug).",
      3: "Aksincha — bu aniq signal: ko'p odam shunday desa, jiddiy bug. E'tibor berish kerak.",
      default: "Bu bug — bot kerakli ishni qilmayapti."
    }} />
);

// ===== SCREEN 5 — FREQUENCY BARS =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [shown, setShown] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = shown;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const sorted = [...COMPLAINTS].sort((a, b) => b.n - a.n);
  return (
    <Stage eyebrow="Pattern · chastota" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Fikrlarni guruhlang"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bitta shikoyat — tasodif. <span className="italic" style={{ color: T.accent }}>Ko'pchilik</span> aytsa — pattern.</h2></div>
        <Mentor>Har bir fikrga alohida ergashsangiz — adashasiz. Bir xil shikoyatlarni <b style={{ color: T.ink }}>guruhlang</b> va sanang: nechta odam shu narsadan shikoyat qildi? Tugmani bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={shown} onClick={() => { setShown(true); setSc(n => n + 1); }}>{shown ? '✓ Guruhlandi' : "📊 Fikrlarni guruhlash"}</button>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4 }}>
              {sorted.map((c, i) => (
                <div key={c.id} className="fbar-row">
                  <span className="fbar-lbl">{c.label}</span>
                  <div className="fbar-track"><div className={`fbar-fill ${shown && i === 0 ? 'top' : ''}`} style={{ width: shown ? `${(c.n / MAX_N) * 100}%` : '0%' }}>{shown ? c.n : ''}</div></div>
                </div>
              ))}
            </div>
          </Col>
          <Col>
            {shown
              ? <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Pattern aniq: <b>«manzilni qayta so'raydi»</b> — 18 kishi. Bu eng ko'p og'ritgan narsa. Mana shu — birinchi nomzod. Eng baland ustun yo'lni ko'rsatadi.</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tugmani bosing — ustunlar to'ladi ←</p></div>}
            {done && <div className="sk-info fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Faqat son emas — keyingi ekranda <b>ta'sir</b>ni ham qo'shamiz. Ba'zan kam, lekin og'riqli shikoyat ham muhim.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 6 — PRIORITET: chastota × ta'sir =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [show, setShow] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = show;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Qaror · prioritet" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Qoidani ko'ring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Hammasini qila olmaysiz. Prioritet = <span className="italic" style={{ color: T.accent }}>chastota × ta'sir</span>.</h2></div>
        <Mentor>Vaqtingiz cheklangan — har fikrni tuzata olmaysiz. Direktor sifatida tanlaysiz: <b style={{ color: T.ink }}>nechta odam</b> aytdi (chastota) va <b style={{ color: T.ink }}>qanchalik og'ritadi</b> (ta'sir). Tugmani bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="sk-info"><p className="note-h">🎯 Qoida</p><p className="body" style={{ margin: 0, color: T.ink }}>Eng ko'p so'ralgan <b>va</b> eng og'riqli narsani birinchi tuzating. Kam so'ralgan, lekin juda og'riqli (masalan to'lov buzilishi) ham yuqoriga chiqishi mumkin.</p></div>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={show} onClick={() => { setShow(true); setSc(n => n + 1); }}>{show ? '✓ Ko\'rdingiz' : "«Yo'q deyish» ham qarormi?"}</button>
          </Col>
          <Col>
            {show
              ? <div className="agent-card fade-step"><span className="agent-lbl">🛑 «YO'Q» DEYISH — DIREKTOR ISHI</span><p className="agent-msg">Har taklifni qo'shsangiz — bot chalkashadi, loyiha cho'ziladi. Ba'zi fikrlarga <b>«hozir emas»</b> yoki <b>«yo'q»</b> deyish kerak. Bu — sifatni saqlash, e'tiborsizlik emas.</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tugmani bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Demak: guruhla → chastota × ta'sir bo'yicha tartibla → yuqoridagini ol, qolganiga «keyin». Mana prioritet.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — NOANIQ → ANIQ =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(PAIRS.map(p => p.id)) : new Set());
  const [active, setActive] = useState(null);
  const [sc, setSc] = useState(0);
  const done = seen.size >= PAIRS.length;
  const tap = (id) => { setActive(id); setSeen(prev => new Set(prev).add(id)); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = PAIRS.find(p => p.id === active);
  return (
    <Stage eyebrow="Tarjima · aniqlik" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `3 fikrni tarjima qiling (${seen.size}/3)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Foydalanuvchi <span className="italic" style={{ color: T.accent }}>noaniq</span> gapiradi — siz <span className="italic" style={{ color: T.accent }}>aniq</span> vazifaga aylantirasiz.</h2></div>
        <Mentor>«Menyu chalkash» — bu shikoyat, vazifa emas. AI bunga to'g'ri kod yoza olmaydi. Direktor sifatida uni aniq o'zgarishga aylantirasiz. Har noaniq fikrni bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {PAIRS.map(p => <button key={p.id} className={`pick-row ${active === p.id ? 'sel' : ''} ${seen.has(p.id) ? 'done-row' : ''}`} onClick={() => tap(p.id)}><span style={{ flex: 1 }}>{p.vague}</span><span className="pick-plus">{seen.has(p.id) ? '✓' : '→'}</span></button>)}
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Har noaniq shikoyat ortida aniq o'zgarish bor. Uni siz topasiz — AI esa shu aniq vazifani bajaradi.</p></div>}
          </Col>
          <Col>
            {cur
              ? <div className="fade-step" key={active} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="frame" style={{ borderLeft: `4px solid ${T.ink3}` }}><p className="note-h" style={{ color: T.ink2 }}>🗣 Foydalanuvchi (noaniq)</p><p className="body" style={{ margin: 0, color: T.ink }}>{cur.vague}</p></div>
                  <div className="agent-card" style={{ borderLeftColor: T.success }}><span className="agent-lbl" style={{ color: T.success }}>🎯 ANIQ O'ZGARISH</span><p className="agent-msg">{cur.concrete}</p></div>
                </div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Noaniq fikrni bosing ←</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — TEST 2 (prioritet — global) =====
const Screen8 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 2-savol"
    questionText="Vaqtingiz cheklangan. 18 kishi 'manzilni qayta so'raydi' (bug), 3 kishi 'glutensiz qo'shing' (taklif) dedi. Birinchi nima?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Vaqtingiz cheklangan. <span className="mono">18</span> kishi manzil bug'idan, <span className="mono">3</span> kishi glutensiz taklifidan gapirdi. <span className="italic" style={{ color: T.accent }}>Birinchi</span> nima?</h2></>}
    options={["Manzil bug'ini — ko'p kishi va kuchli og'riq (chastota × ta'sir eng yuqori)", "Glutensiz pizzani — yangi narsa qiziqroq va e'tirof keltiradi", "Ikkalasini bir vaqtda — hech narsani kechiktirmaslik kerak", "Hech narsani — fikrlar shunchaki shikoyat, jiddiy emas"]} correctIdx={0}
    explainCorrect="To'g'ri! Cheklangan resursda eng katta ta'sir beradigan ishni tanlaysiz: ko'p odam (18) + kuchli og'riq = manzil bug'i. Glutensiz taklif kutadi. Bu — har mahsulotda ishlaydigan prioritet qoidasi."
    explainWrong={{
      1: "«Qiziqroq» — bu sizning hissingiz, foydalanuvchi og'rig'i emas. 18 kishilik bug 3 kishilik taklifdan ustun.",
      2: "Cheklangan vaqtda hammasini birdan qilsangiz — hech biri sifatli chiqmaydi. Avval eng kattasini.",
      3: "Aksincha — 18 kishilik takroriy shikoyat juda jiddiy signal. Uni birinchi tuzatasiz.",
      default: "Eng ko'p + eng og'riqlisini birinchi: manzil bug'i."
    }} />
);

// ===== SCREEN 9 — FIXFORGE: aniq o'zgarish → prompt =====
const Screen9 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [show, setShow] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = show;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Tuzatish · prompt" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "AI'ga buyuring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Tanlangan fikrni <span className="italic" style={{ color: T.accent }}>AI promptiga</span> aylantirasiz.</h2></div>
        <Mentor>Prioritet #1 — manzil bug'i. Sababi (siz topasiz): bot holatni saqlamayapti (o'tgan darsda o'rgangan). Endi buni AI'ga aniq buyuruq qilib beramiz — bu vibecoding'ning davomi. Tugmani bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="sk-info"><p className="note-h">🎯 Aniq o'zgarish</p><p className="body" style={{ margin: 0, color: T.ink }}>Manzil qabul qilingach, holatni TAYYOR ga o'tkaz va uni qayta so'rama. Tasdiqda narxni ham ko'rsat.</p></div>
            <PromptCard who="tuzatish prompti" tone="live">Botda bug bor: manzil yuborilgandan keyin ham bot uni qayta so'rayapti. Manzil qabul qilingach holatni TAYYOR ga o'tkaz, qayta so'rama. Tasdiq xabarida pizza nomi, narxi va manzilni ko'rsat.</PromptCard>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={show} onClick={() => { setShow(true); setSc(n => n + 1); }}>{show ? '✓ Tuzatildi' : "▶ AI tuzatdi — natijani ko'r"}</button>
          </Col>
          <Col>
            {show
              ? <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <p className="flow-label" style={{ color: T.success }}>✓ tuzatilgandan keyin (v2)</p>
                  <TgChat input={false} minH={0} sub="bot · v2 🟢">
                    <Bubble from="user">Margarita, Chilonzor 5</Bubble>
                    <Bubble from="bot">Qabul qilindi ✅ Margarita (45 000 so'm) · Chilonzor 5 📍</Bubble>
                  </TgChat>
                </div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tugmani bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Endi manzil bir marta so'raladi, narx ko'rinadi. Aniq fikr → aniq prompt → aniq tuzatish.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 10 — ISHLADIMI? QAYTA O'LCHASH =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [show, setShow] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = show;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="O'lchash · natija" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Natijani tekshiring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Tuzatdingiz — lekin <span className="italic" style={{ color: T.accent }}>ishladimi</span>? Qayta o'lchaysiz.</h2></div>
        <Mentor>Tuzatish — taxmin. U haqiqatan yordam berdimi, buni faqat <b style={{ color: T.ink }}>yangi fikr</b> aytadi. Versiya chiqargach, o'sha shikoyat kamaydimi — tekshirasiz. Tugmani bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="sk-info"><p className="note-h">📊 «Manzilni qayta so'raydi» shikoyati</p><div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
              <div className="fbar-row"><span className="fbar-lbl">v1 (oldin)</span><div className="fbar-track"><div className="fbar-fill top" style={{ width: '90%' }}>18</div></div></div>
              <div className="fbar-row"><span className="fbar-lbl">v2 (keyin)</span><div className="fbar-track"><div className="fbar-fill" style={{ width: show ? '8%' : '90%', background: show ? T.success : T.danger }}>{show ? '1' : '18'}</div></div></div>
            </div></div>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={show} onClick={() => { setShow(true); setSc(n => n + 1); }}>{show ? '✓ O\'lchandi' : "▶ Yangi fikrlarni o'lchash"}</button>
          </Col>
          <Col>
            {show
              ? <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Shikoyat 18 dan 1 ga tushdi — fix <b>ishladi</b>. Agar tushmaganida, boshqa sabab izlardik. O'lchamasangiz — tuzatish ko'r-ko'rona bo'ladi.</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tugmani bosing ←</p></div>}
            {done && <div className="agent-card fade-step"><span className="agent-lbl">🔁 SIKL DAVOM ETADI</span><p className="agent-msg">Endi yangi ro'yxatda <b>«narx ko'rinmaydi»</b> tepaga chiqdi. Demak keyingi iteratsiya — o'sha. Sikl hech qachon tugamaydi.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — TEST 3 (iteratsiya mentaliteti — global) =====
const Screen11 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="Eng katta shikoyatni tuzatib, yangi versiyani chiqardingiz. Endi nima qilasiz?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Eng katta shikoyatni tuzatib, yangi versiyani chiqardingiz. <span className="italic" style={{ color: T.accent }}>Endi</span> nima?</h2></>}
    options={["Qayta tinglayman: fix ishladimi tekshiraman va yangi fikrlarni yig'aman — sikl davom etadi", "Loyiha tugadi — bot endi mukammal, fikr kerak emas", "Qolgan hamma narsani ham birdan qayta yozaman", "Foydalanuvchilarni tinglashni to'xtataman — ortiqcha shovqin"]} correctIdx={0}
    explainCorrect="To'g'ri! Mahsulot hech qachon «tayyor» bo'lmaydi. Har tuzatishdan keyin qayta tinglaysiz: ishladimi va keyin nima muhim. Tingla → tuzat → qayta tingla — bu doimiy sikl, har muvaffaqiyatli mahsulotda shunday."
    explainWrong={{
      1: "Hech bir mahsulot «mukammal» emas — ehtiyojlar o'zgaradi, yangi muammolar chiqadi. Tinglashni davom ettiring.",
      2: "Hammasini birdan qayta yozish — xavfli va keraksiz. Iteratsiya bittadan, o'lchab boriladi.",
      3: "Tinglashni to'xtatsangiz — mahsulot foydalanuvchidan uzoqlashadi. Fikr — eng qimmatli manba.",
      default: "Qayta tinglaysiz — sikl davom etadi."
    }} />
);

// ===== SCREEN 12 — CASE: AvtoPizza to'liq iteratsiya =====
const Screen12 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const STAGES = [
    { lbl: '👂 Tingla', tone: 'info', txt: "18 kishi: «manzilni qayta so'raydi». Eng ko'p shikoyat — bu birinchi." },
    { lbl: '🎯 Tanla', tone: 'info', txt: "Chastota yuqori + og'riq kuchli → prioritet #1. Glutensiz taklif kutadi." },
    { lbl: '🔧 Tuzat', tone: 'ok', txt: "AI'ga aniq prompt: manzilni bir marta so'ra, holatni TAYYOR qil, narxni ko'rsat. v2 chiqdi." },
    { lbl: '🔁 Qayta tingla', tone: 'ok', txt: "Yangi fikr: shikoyat 18 → 1. Ishladi! Endi «narx» tepaga chiqdi — keyingi iteratsiya." }
  ];
  const [step, setStep] = useState(storedAnswer ? STAGES.length : 0);
  const [sc, setSc] = useState(0);
  const done = step >= STAGES.length;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const advance = () => { if (!done) { setStep(n => n + 1); setSc(n => n + 1); } };
  return (
    <Stage eyebrow="Hayotiy · iteratsiya" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Siklni yuriting (${step}/${STAGES.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">AvtoPizza — bitta to'liq <span className="italic" style={{ color: T.accent }}>iteratsiya</span> aylanishi.</h2></div>
        <Mentor>Mana hammasi birga: chalkash fikrdan yaxshilangan mahsulotgacha. Tugmani bosib, iteratsiya siklini boshidan oxirigacha yuring.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {STAGES.slice(0, step).map((s, i) => (
                <div key={i} className={s.tone === 'ok' ? 'frame-success fade-step' : 'sk-info fade-step'}>
                  <p className="note-h" style={{ margin: '0 0 4px' }}>{s.lbl}</p>
                  <p className="body" style={{ margin: 0, color: T.ink }}>{s.txt}</p>
                </div>
              ))}
              {step === 0 && <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tugmani bosing — sikl boshlanadi.</p></div>}
            </div>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={done} onClick={advance}>{done ? '✓ Iteratsiya tugadi' : step === 0 ? '▶ Tinglashni boshlash' : 'Keyingi qadam →'}</button>
          </Col>
          <Col>
            <div className="sk-info"><p className="note-h">🍕 Mijoz tomonidan</p>{done
              ? <TgChat input={false} minH={0} sub="bot · v2 🟢"><Bubble from="user">Margarita, Chilonzor 5</Bubble><Bubble from="bot">Qabul qilindi ✅ Margarita (45 000) · Chilonzor 5 📍</Bubble></TgChat>
              : <TgChat input={false} minH={0} sub="bot · v1"><Bubble from="user">Margarita, Chilonzor 5</Bubble><Bubble from="bot">Manzilingizni yuboring 📍</Bubble><Bubble from="user">Aytdim-ku, Chilonzor 5 😤</Bubble></TgChat>}
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>v1 da bot manzilni qayta so'radi; v2 da — bir marta, narx bilan. Bitta iteratsiya mahsulotni sezilarli yaxshiladi.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 13 — NIMANI TUZATMASLIK (anti-pattern) =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const TRAPS = [
    { id: 't1', ico: '🙋', label: 'Bitta odam = hammasi', desc: "Bir kishi so'radi deb darrov qo'shmang. Pattern (ko'pchilik) qidiring." },
    { id: 't2', ico: '📦', label: 'Scope shishishi', desc: "Har taklifni qo'shsangiz — bot og'irlashadi, chalkashadi. Asosiy ishda qoling." },
    { id: 't3', ico: '🔇', label: "Maqtovni e'tiborsiz", desc: "Maqtov — nima ishlayotganini aytadi. Tuzatishda o'shani buzib qo'ymang." }
  ];
  const [seen, setSeen] = useState(storedAnswer ? new Set(TRAPS.map(t => t.id)) : new Set());
  const [active, setActive] = useState(null);
  const [sc, setSc] = useState(0);
  const done = seen.size >= TRAPS.length;
  const tap = (id) => { setActive(id); setSeen(prev => new Set(prev).add(id)); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = TRAPS.find(t => t.id === active);
  return (
    <Stage eyebrow="Ehtiyot · tuzoqlar" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `3 tuzoqni ko'ring (${seen.size}/3)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Fikrni qo'llashning <span className="italic" style={{ color: T.accent }}>3 tuzog'i</span>.</h2></div>
        <Mentor>Fikrni tinglash yaxshi — lekin uni noto'g'ri qo'llash mahsulotni buzadi. Mana 3 ta keng tarqalgan xato. Har birini bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {TRAPS.map(t => <button key={t.id} className="gchip" onClick={() => tap(t.id)} style={seen.has(t.id) ? { boxShadow: `inset 0 0 0 1.5px ${T.success}`, color: T.success } : undefined}>{seen.has(t.id) ? '✓ ' : ''}{t.ico} {t.label}</button>)}
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Fikr — yo'l-yo'riq, buyruq emas. Direktor uni saralab, o'lchab, sifatni saqlab qo'llaydi.</p></div>}
          </Col>
          <Col>
            {cur
              ? <div className="frame-warn fade-step" key={active}><p className="note-h" style={{ margin: '0 0 4px' }}>{cur.ico} {cur.label}</p><p className="body" style={{ margin: 0, color: T.ink }}>{cur.desc}</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tuzoqni bosing ←</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — TEST 4 (scope / yo'q deyish — global) =====
const Screen14 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 4-savol"
    questionText="100 foydalanuvchidan 1 tasi juda o'ziga xos, faqat unga kerakli narsa so'radi. Nima qilasiz?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>100 foydalanuvchidan <span className="mono">1</span> tasi juda <span className="italic" style={{ color: T.accent }}>o'ziga xos</span> narsa so'radi (faqat unga kerak). Nima qilasiz?</h2></>}
    options={["Ko'pchilikka foyda beradigan fikrlarga e'tibor beraman; bitta tor so'rovga «hozir emas» deyish ham qaror", "Darrov qo'shaman — har bir foydalanuvchining so'rovi bajarilishi shart", "O'sha foydalanuvchini bloklayman — u xalaqit beradi", "Hamma so'rovni navbat bilan, istisnosiz qo'shaman"]} correctIdx={0}
    explainCorrect="To'g'ri! Cheklangan vaqtni ko'pchilikka ta'sir qiladigan ishlarga sarflaysiz. Bitta tor so'rovga «yo'q» yoki «hozir emas» deyish — e'tiborsizlik emas, balki mahsulot fokusini saqlash. Bu — har joyda kerakli qaror."
    explainWrong={{
      1: "Har so'rovni qo'shsangiz — bot chalkashadi va ko'pchilik uchun yomonlashadi. Fokus muhim.",
      2: "Foydalanuvchini bloklash — fikrdan qochish. To'g'ri yo'l — xushmuomala «hozir emas» deyish.",
      3: "Istisnosiz qo'shish — scope shishishi. Direktor tanlaydi, hammasini emas.",
      default: "Ko'pchilikka foydani ustun qo'yib, tor so'rovga «hozir emas» deysiz."
    }} />
);

// ===== SCREEN 15 — YAKUNIY: iteratsiya siklini yig'ish =====
const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [placed, setPlaced] = useState(() => (storedAnswer ? [...FLOW_ORDER] : []));
  const [shakeId, setShakeId] = useState(null);
  const [hint, setHint] = useState(null);
  const done = placed.length === FLOW_ORDER.length;
  const need = FLOW_ORDER[placed.length];
  const fired = useRef(!!storedAnswer);
  useEffect(() => {
    if (done && !fired.current) {
      fired.current = true;
      onAnswer(screen, { stage: 'final', screenIdx: screen, question: "Iteratsiya siklini to'g'ri tartibda joylang", correct: true, firstAttemptCorrect: true, solved: true, picked: FLOW_ORDER.join(' → ') });
    }
  }, [done]);
  const flowById = (id) => FLOW.find(f => f.id === id);
  const tap = (id) => {
    if (placed.includes(id) || done) return;
    if (id === need) { setPlaced(p => [...p, id]); setHint(null); }
    else {
      const needF = flowById(need);
      setShakeId(id); setHint(`Hozir emas — avval ${needF.ico} ${needF.label} bo'lishi kerak.`);
      setTimeout(() => setShakeId(x => (x === id ? null : x)), 450);
    }
  };
  return (
    <Stage eyebrow="Yakuniy · amaliy" screen={screen} scrollSignal={placed.length} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Siklni yig'ing"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Oxirgi qadam: iteratsiya siklini <span className="italic" style={{ color: T.accent }}>to'g'ri tartibda</span> yig'ing.</h2></div>
        <Mentor>Fikrdan yaxshilangan mahsulotgacha yo'l: tinglaysiz, guruhlaysiz, prioritet tanlaysiz, tuzatasiz — va yana tinglaysiz. To'g'ri qadamni o'ng tomondan tanlang.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <p className="flow-label">iteratsiya sikli (siz yig'yapsiz)</p>
            {placed.length === 0
              ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Hali bo'sh — o'ng tomondan tanlang →</p></div>
              : <div className="cyc fade-step">
                  {placed.map((id, i) => { const f = flowById(id); return <React.Fragment key={id}>{i > 0 && <span className="cyc-arrow on">→</span>}<div className="cyc-node done"><span className="cyc-ico">{f.ico}</span><span className="cyc-lbl">{f.label}</span></div></React.Fragment>; })}
                </div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Sikl tayyor: <b>Tingla → Guruhla → Tanla → Tuzat → Qayta tingla</b>. Va u qayta boshlanadi — mahsulot doim yaxshilanadi.</p></div>}
          </Col>
          <Col>
            <p className="flow-label">qadamni tanlang (keyingisi: {placed.length}/{FLOW_ORDER.length})</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {FLOW_SCRAMBLED.map(id => {
                const f = flowById(id);
                const isPlaced = placed.includes(id);
                return (
                  <button key={id} className={`pick-row ${isPlaced ? 'picked' : ''} ${shakeId === id ? 'shake' : ''}`} disabled={isPlaced || done} onClick={() => tap(id)}>
                    <span style={{ marginRight: 6 }}>{f.ico}</span>
                    <span style={{ flex: 1 }}>{f.label} <span style={{ color: T.ink3, fontWeight: 500 }}>· {f.d}</span></span>
                    <span className="pick-plus">{isPlaced ? '✓' : '+'}</span>
                  </button>
                );
              })}
            </div>
            {hint && !done && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>{hint}</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — YAKUN =====
const Screen16 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const RECAP = [
    "Mahsulot hech qachon «tayyor» emas — u iteratsiya qiladi",
    "Fikrni saralash (triaj): bug → tuzat, taklif → qaror, maqtov → saqla",
    "Prioritet = chastota × ta'sir; «yo'q deyish» ham qaror",
    "Noaniq fikrni aniq o'zgarishga → AI promptiga aylantirasiz",
    "Tuzatdingizmi — qayta o'lchaysiz; sikl: tingla → tuzat → qayta tingla"
  ];
  const HOMEWORK = [
    { b: "Yig'ing", t: "— botingiz uchun 5 ta xayoliy foydalanuvchi fikrini yozing va turlarga ajrating" },
    { b: 'Tanlang', t: "— chastota × ta'sir bo'yicha qaysi birini birinchi tuzatishni belgilang" },
    { b: 'Aylantiring', t: "— eng muhim fikrni aniq AI promptiga aylantiring (vibecoding bilan)" }
  ];
  const GLOSSARY = [
    { b: 'iteratsiya', t: '— mahsulotni qayta-qayta yaxshilash' },
    { b: 'triaj', t: '— fikrni turlarga saralash' },
    { b: 'prioritet', t: '— chastota × ta\'sir bo\'yicha tartiblash' },
    { b: 'chastota', t: '— nechta odam aytgani' },
    { b: "ta'sir", t: '— qanchalik og\'ritgani' },
    { b: 'drop-off', t: '— foydalanuvchining tiqilib, ketishi' },
    { b: 'scope', t: '— loyiha qamrovi (chegarasi)' },
    { b: "«yo'q» deyish", t: '— ba\'zi so\'rovni rad etish qarori' }
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
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">✓</span> Mahsulotni yaxshiladingiz</span><h2 className="title h-title fade-up d1">Endi botingiz <span className="italic" style={{ color: T.accent }}>foydalanuvchi bilan</span> o'sadi.</h2><p className="body h-sub fade-up d2">{PASSED ? "Tabriklaymiz! Fikrni saralash, prioritet (chastota × ta'sir) va iteratsiya siklini o'rgandingiz." : "Yaxshi harakat! Prioritet (chastota × ta'sir) va iteratsiya sikli bo'limlarini qayta ko'ring."}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span className="tick" style={{ width: 16, height: 16, borderRadius: '50%', background: T.success, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck">✓</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>📝 Uyga vazifa</div><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">🚀 Keyingi — AI-agent: bu siklni endi botning O'ZIga beramiz (idrok → qaror → amal).</p></div>
        </div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">💡 Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function BotFeedbackIterationLesson({ lang: langProp, onFinished }) {
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

  const screens = [Screen0, Screen1, Screen2, Screen3, Screen4, Screen5, Screen6, Screen7, Screen8, Screen9, Screen10, Screen11, Screen12, Screen13, Screen14, Screen15, Screen16];
  const Current = screens[screen];
  return (
    <LangContext.Provider value={lang}>
      <style>{`
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
        .delay-1 { animation-delay: 0.12s; } .delay-2 { animation-delay: 0.24s; } .delay-3 { animation-delay: 0.36s; }
        @keyframes fade-step { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .fade-step { animation: fade-step 0.3s ease-out; }
        .d1 { animation-delay: 0.12s; } .d2 { animation-delay: 0.24s; } .d3 { animation-delay: 0.36s; } .d4 { animation-delay: 0.48s; }
        @keyframes el-pop { from { opacity: 0; transform: translateX(8px); } to { opacity: 1; transform: none; } }
        .el-in { animation: el-pop 0.3s ease-out; }
        .feedback-block { max-height: 0; opacity: 0; overflow: hidden; transition: max-height 0.4s ease-out, opacity 0.3s ease-out 0.1s, margin-top 0.4s ease-out; margin-top: 0; }
        .feedback-block.visible { max-height: 800px; opacity: 1; margin-top: clamp(14px,2vw,20px); }

        .btn { font-family: 'Manrope'; font-weight: 600; cursor: pointer; transition: all 0.2s; background: ${T.ink}; color: ${T.bg}; border: none; border-radius: 12px; box-shadow: 0 6px 18px -4px rgba(${T.shadowBase},0.32); padding: clamp(11px,1.6vw,13px) clamp(20px,2.5vw,26px); font-size: clamp(13px,1.6vw,15px); }
        .btn:hover:not(:disabled) { background: ${T.accent}; box-shadow: 0 10px 24px -4px rgba(255,79,40,0.45); }
        .btn:disabled { opacity: 0.55; cursor: not-allowed; box-shadow: none; }
        .btn-white-accent { font-family: 'Manrope'; font-weight: 600; cursor: pointer; transition: all 0.2s; background: ${T.paper}; color: ${T.accent}; border: none; border-radius: 12px; box-shadow: 0 8px 22px -4px rgba(255,79,40,0.35), 0 0 0 1px rgba(255,79,40,0.12); }
        .btn-white-accent:hover:not(:disabled) { background: ${T.accent}; color: #fff; }
        .btn-white-accent:disabled { opacity: 0.45; cursor: not-allowed; box-shadow: 0 4px 12px -4px rgba(${T.shadowBase},0.14); }
        .btn-ghost { font-family: 'Manrope'; font-weight: 600; cursor: pointer; transition: all 0.2s; background: transparent; color: ${T.ink}; border: none; border-radius: 12px; }
        .btn-ghost:hover:not(:disabled) { background: ${T.paper}; box-shadow: 0 6px 18px -6px rgba(${T.shadowBase},0.18); }
        .btn-soft { font-family: 'Manrope'; font-weight: 600; cursor: pointer; transition: all 0.2s; background: ${T.bg}; color: ${T.ink}; border: none; border-radius: 10px; padding: 9px 14px; font-size: 12.5px; }
        .btn-soft:hover:not(:disabled) { box-shadow: 0 6px 14px -5px rgba(${T.shadowBase},0.2); }
        .btn-soft:disabled { opacity: 0.6; cursor: not-allowed; }
        .gchip { font-family: 'JetBrains Mono'; font-weight: 600; font-size: 12px; padding: 8px 13px; border-radius: 99px; border: none; background: ${T.paper}; color: ${T.ink}; cursor: pointer; transition: all 0.18s; box-shadow: 0 3px 10px -5px rgba(${T.shadowBase},0.2); } .gchip:hover:not(:disabled) { transform: translateY(-1px); }

        .option { background: ${T.paper}; cursor: pointer; transition: all 0.2s; font-family: 'Manrope'; font-weight: 500; text-align: left; border-radius: 12px; width: 100%; border: none; color: ${T.ink}; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.14); }
        .option:hover:not(:disabled) { background: #FDFBF7; box-shadow: 0 10px 22px -6px rgba(${T.shadowBase},0.22); }
        .option:disabled { cursor: default; }
        .option-correct { background: ${T.successSoft} !important; color: ${T.success} !important; box-shadow: 0 8px 22px -6px rgba(31,122,77,0.32) !important; }
        .option-wrong { background: ${T.paper} !important; color: ${T.ink3} !important; opacity: 0.55 !important; }
        .option-picked-wrong { background: ${T.accentSoft} !important; color: ${T.accent} !important; box-shadow: 0 8px 22px -6px rgba(255,79,40,0.38) !important; }

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
        .mentor-name { font-family: 'Manrope'; font-weight: 700; font-size: 13px; color: ${T.accent}; }
        .mentor-msg { background: ${T.paper}; border-radius: 4px 14px 14px 14px; padding: 13px 16px; color: ${T.ink}; box-shadow: 0 6px 18px -6px rgba(${T.shadowBase},0.16); }

        .hook-option { display: flex; align-items: center; gap: 13px; width: 100%; text-align: left; background: ${T.paper}; border: none; border-radius: 12px; padding: clamp(13px,1.9vw,16px) clamp(15px,2.2vw,18px); font-family: 'Manrope'; font-weight: 500; font-size: clamp(14px,1.7vw,16px); color: ${T.ink}; cursor: pointer; transition: all 0.18s; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.14); }
        .hook-option:hover:not(:disabled):not(.on) { box-shadow: 0 10px 22px -6px rgba(${T.shadowBase},0.22); }
        .hook-option.on { background: ${T.accentSoft}; color: ${T.accent}; box-shadow: 0 8px 22px -6px rgba(255,79,40,0.3), inset 0 0 0 1.5px ${T.accent}; }
        .hook-option:disabled { cursor: default; }
        .hook-option .radio { width: 20px; height: 20px; border-radius: 50%; flex-shrink: 0; box-shadow: inset 0 0 0 2px ${T.ink3}; display: inline-flex; align-items: center; justify-content: center; }
        .hook-option.on .radio { box-shadow: inset 0 0 0 2px ${T.accent}; }
        .radio-dot { width: 10px; height: 10px; border-radius: 50%; background: ${T.accent}; }
        .hook-ack { margin: 2px 0 0; font-family: 'Manrope'; font-weight: 500; font-size: clamp(13px,1.5vw,14.5px); color: ${T.ink2}; }

        .h-title { font-size: clamp(22px,4vw,38px); } .h-sub { font-size: clamp(17px,2.5vw,22px); }
        .body { font-size: clamp(14px,1.6vw,16px); line-height: 1.5; }
        .eyebrow { font-size: clamp(11px,1.3vw,12px); letter-spacing: 0.18em; text-transform: uppercase; font-weight: 600; }
        .small { font-size: clamp(12.5px,1.4vw,13.5px); }

        .stage { max-width: 936px; margin: 0 auto; height: 100dvh; display: flex; flex-direction: column; }
        .stage-header { flex-shrink: 0; background: ${T.bg}; padding-top: clamp(12px,2vw,18px); padding-bottom: clamp(8px,1.5vw,12px); }
        .stage-content { flex: 1; min-height: 0; padding-top: clamp(10px,1.7vw,16px); padding-bottom: clamp(17px,3.4vw,34px); display: flex; flex-direction: column; overflow-y: auto; overflow-x: hidden; scroll-behavior: smooth; }
        .stage-content.narrow { max-width: 680px; width: 100%; margin: 0 auto; }
        .stage-nav { flex-shrink: 0; background: ${T.bg}; border-top: 1px solid rgba(167,166,162,0.25); padding-top: clamp(12px,2vw,15px); padding-bottom: clamp(12px,2vw,15px); display: flex; gap: 12px; align-items: center; }
        .chrome { display: flex; align-items: center; justify-content: space-between; }
        .chrome-left { display: flex; align-items: center; gap: 10px; color: ${T.ink2}; }
        .dot { width: 7px; height: 7px; border-radius: 50%; background: ${T.accent}; box-shadow: 0 0 8px rgba(255,79,40,0.55); }
        .progress-track { height: 3px; background: rgba(167,166,162,0.25); width: 100%; margin-bottom: 12px; border-radius: 99px; }
        .progress-bar { height: 100%; background: ${T.accent}; transition: width 0.5s cubic-bezier(.4,0,.2,1); border-radius: 99px; box-shadow: 0 0 10px rgba(255,79,40,0.55); }

        .frame { background: ${T.paper}; border-radius: 16px; padding: clamp(15px,2.5vw,22px); box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.14); }
        .frame-soft { background: ${T.accentSoft}; border-left: 4px solid ${T.accent}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); }
        .frame-success { background: ${T.successSoft}; border-left: 4px solid ${T.success}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); }
        .frame-warn { background: ${T.accentSoft}; border-left: 4px solid ${T.danger}; border-radius: 12px; padding: 12px 15px; }
        .frame-dash { border: 1.5px dashed ${T.ink3}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); }

        .screen { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: clamp(14px,2vw,20px); }
        .head { display: flex; flex-direction: column; gap: 6px; }
        .split { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: clamp(18px,3vw,36px); align-items: start; }
        .col { display: flex; flex-direction: column; gap: clamp(12px,2vw,16px); min-width: 0; }
        @media (max-width: 760px) { .split { grid-template-columns: 1fr; gap: clamp(14px,3vw,20px); } }
        .flow-label { font-family: 'Manrope'; font-weight: 700; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: ${T.ink2}; }

        .roadmap { display: flex; flex-direction: column; gap: 8px; list-style: none; }
        .step-card { display: flex; align-items: center; gap: 14px; background: ${T.paper}; border-radius: 12px; padding: 12px 15px; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.14); }
        .step-num { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 12px; color: ${T.accent}; flex-shrink: 0; min-width: 38px; }
        .step-body { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .step-text { font-weight: 600; font-size: clamp(13px,1.6vw,15px); color: ${T.ink}; }
        .step-tag { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink2}; background: ${T.bg}; padding: 3px 8px; border-radius: 6px; }

        .sk-info { background: ${T.paper}; border-radius: 12px; padding: 13px 16px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.16); animation: fade-step 0.3s; }
        .note-h { font-weight: 700; font-size: 13.5px; margin: 0 0 5px; display: flex; align-items: center; }

        /* VS CODE EDITOR */
        .editor { border-radius: 12px; overflow: hidden; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.2); }
        .editor-bar { background: #2D2D2D; padding: 7px 11px; display: flex; align-items: center; gap: 9px; }
        .editor-tab { font-family: 'JetBrains Mono'; font-size: 11px; color: #C9D1D9; background: #1E1E1E; padding: 4px 11px; border-radius: 6px 6px 0 0; word-break: break-all; }
        .editor-body { background: ${CODE.bg}; padding: 12px 14px; }
        .editor-code { font-family: 'JetBrains Mono'; font-size: clamp(11px,1.4vw,12.5px); line-height: 1.75; color: ${CODE.text}; white-space: pre-wrap; word-break: break-word; margin: 0; }
        .bb-dots { display: flex; gap: 5px; } .bb-dots i { width: 9px; height: 9px; border-radius: 50%; } .bb-dots i:first-child { background: #ff5f57; } .bb-dots i:nth-child(2) { background: #febc2e; } .bb-dots i:nth-child(3) { background: #28c840; }

        /* PICK ROWS */
        .pick-row { display: flex; align-items: center; gap: 10px; width: 100%; text-align: left; background: ${T.paper}; border: none; border-radius: 10px; padding: 11px 13px; cursor: pointer; transition: all 0.16s; box-shadow: 0 4px 12px -6px rgba(${T.shadowBase},0.16); font-family: 'Manrope'; font-weight: 600; font-size: clamp(12.5px,1.5vw,14px); color: ${T.ink}; }
        .pick-row:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 18px -6px rgba(${T.shadowBase},0.22); }
        .pick-row.sel { box-shadow: inset 0 0 0 1.5px ${T.accent}, 0 8px 18px -6px rgba(255,79,40,0.28); background: ${T.accentSoft}; }
        .pick-row.done-row { box-shadow: inset 0 0 0 1.5px ${T.success}; }
        .pick-row.picked { background: ${T.successSoft}; color: ${T.success}; box-shadow: inset 0 0 0 1.5px ${T.success}; cursor: default; }
        .pick-row:disabled { cursor: default; }
        .pick-plus { margin-left: auto; font-weight: 700; color: ${T.ink3}; } .pick-row.picked .pick-plus { color: ${T.success}; } .pick-row.sel .pick-plus { color: ${T.accent}; } .pick-row.done-row .pick-plus { color: ${T.success}; }

        /* AGENT / AI CARD */
        .agent-card { background: ${T.blueSoft}; border-left: 4px solid ${T.blue}; border-radius: 10px; padding: 13px 16px; }
        .agent-lbl { font-family: 'Manrope'; font-weight: 800; font-size: 11px; color: ${T.blue}; display: block; margin-bottom: 5px; letter-spacing: 0.04em; }
        .agent-msg { font-family: 'Manrope'; font-size: clamp(13px,1.5vw,14.5px); color: ${T.ink}; margin: 0; line-height: 1.55; }
        .agent-msg b { color: ${T.ink}; }

        /* PROMPT CARD */
        .prompt-card { background: ${T.paper}; border-radius: 12px; padding: 12px 15px; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.16); border-left: 4px solid ${T.amber}; }
        .prompt-card.live { border-left-color: ${T.accent}; }
        .prompt-who { font-family: 'Manrope'; font-weight: 800; font-size: 10.5px; color: ${T.amber}; display: block; margin-bottom: 5px; letter-spacing: 0.04em; }
        .prompt-card.live .prompt-who { color: ${T.accent}; }
        .prompt-text { font-family: 'JetBrains Mono'; font-size: clamp(11.5px,1.4vw,13px); color: ${T.ink}; margin: 0; line-height: 1.6; }

        /* GENERATING DOTS */
        .gen-dots { display: inline-flex; gap: 4px; }
        .gen-dots.inline { vertical-align: middle; }
        .gen-dots i { width: 7px; height: 7px; border-radius: 50%; background: ${T.blue}; animation: gen-bounce 1s infinite ease-in-out; }
        .gen-dots i:nth-child(2) { animation-delay: 0.15s; } .gen-dots i:nth-child(3) { animation-delay: 0.3s; }
        @keyframes gen-bounce { 0%,80%,100% { transform: scale(0.5); opacity: 0.4; } 40% { transform: scale(1); opacity: 1; } }

        /* ===== TELEGRAM CHAT ===== */
        .tg { border-radius: 16px; overflow: hidden; box-shadow: 0 12px 30px -8px rgba(${T.shadowBase},0.3); border: 1px solid rgba(167,166,162,0.22); }
        .tg-head { background: linear-gradient(180deg,#5A9FD4,#4E8FC0); padding: 10px 14px; display: flex; align-items: center; gap: 10px; }
        .tg-ava { width: 32px; height: 32px; border-radius: 50%; background: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 17px; flex-shrink: 0; }
        .tg-name { font-family: 'Manrope'; font-weight: 700; font-size: 13.5px; color: #fff; display: flex; flex-direction: column; line-height: 1.25; }
        .tg-status { font-weight: 500; font-size: 10.5px; color: #DCEBF7; }
        .tg-body { background: #CAD7E0; background-image: radial-gradient(rgba(255,255,255,0.45) 1px, transparent 1px); background-size: 18px 18px; padding: 13px 12px; display: flex; flex-direction: column; gap: 4px; }
        .tg-bubble-wrap { display: flex; flex-direction: column; max-width: 86%; gap: 0; }
        .tg-bubble-wrap.user { align-self: flex-end; align-items: flex-end; }
        .tg-bubble-wrap.bot { align-self: flex-start; align-items: flex-start; }
        .tg-bubble { padding: 8px 12px; border-radius: 14px; font-family: 'Manrope'; font-weight: 500; font-size: clamp(12.5px,1.5vw,14px); line-height: 1.45; box-shadow: 0 1px 2px rgba(0,0,0,0.12); word-break: break-word; margin-bottom: 3px; }
        .tg-bubble.bot { background: #fff; color: #0E0E10; border-bottom-left-radius: 5px; }
        .tg-bubble.user { background: #EFFDDE; color: #0E0E10; border-bottom-right-radius: 5px; }
        .tg-bubble.think { padding: 11px 14px; }
        .tg-input { display: flex; align-items: center; gap: 10px; background: #fff; padding: 10px 14px; border-top: 1px solid rgba(0,0,0,0.06); }
        .tg-input-field { flex: 1; color: #A7A6A2; font-family: 'Manrope'; font-size: 13px; }
        .tg-send { color: #5A9FD4; font-size: 17px; }

        /* ===== REVIEW CARD (fikr) ===== */
        .review-stack { display: flex; flex-direction: column; gap: 8px; }
        .review-card { display: flex; align-items: center; gap: 10px; background: ${T.paper}; border-radius: 12px; padding: 11px 14px; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.16); width: 100%; text-align: left; border: none; }
        .review-card.tap { cursor: pointer; transition: all 0.16s; } .review-card.tap:hover { transform: translateY(-1px); box-shadow: 0 9px 20px -6px rgba(${T.shadowBase},0.24); }
        .review-card.sel { box-shadow: inset 0 0 0 1.5px ${T.accent}, 0 8px 18px -6px rgba(255,79,40,0.24); }
        .rc-ava { width: 30px; height: 30px; border-radius: 50%; background: ${T.bg}; display: inline-flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
        .rc-txt { font-family: 'Manrope'; font-weight: 500; font-size: clamp(13px,1.5vw,14.5px); color: ${T.ink}; margin: 0; }
        @keyframes rev-in { from { opacity: 0; transform: translateY(-6px) scale(0.98); } to { opacity: 1; transform: none; } }
        .review-card.r-in { animation: rev-in 0.4s ease-out both; }
        .type-badge { display: inline-flex; align-items: center; gap: 5px; font-family: 'Manrope'; font-weight: 700; font-size: 11px; padding: 4px 10px; border-radius: 99px; white-space: nowrap; }

        /* ===== FREQUENCY BARS ===== */
        .fbar-row { display: flex; align-items: center; gap: 10px; }
        .fbar-lbl { font-family: 'Manrope'; font-weight: 600; font-size: clamp(11px,1.4vw,13px); color: ${T.ink}; min-width: clamp(110px,30vw,150px); }
        .fbar-track { flex: 1; height: 24px; background: ${T.bg}; border-radius: 7px; overflow: hidden; box-shadow: inset 0 0 0 1px rgba(167,166,162,0.25); }
        .fbar-fill { height: 100%; background: ${T.ink3}; border-radius: 7px; transition: width 0.8s cubic-bezier(.4,0,.2,1), background 0.4s; display: flex; align-items: center; justify-content: flex-end; padding-right: 8px; color: #fff; font-family: 'JetBrains Mono'; font-weight: 700; font-size: 11px; min-width: 18px; }
        .fbar-fill.top { background: ${T.accent}; }

        /* ===== OQIM (final ko'rinish) ===== */
        .cyc { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; padding: 4px 0; }
        .cyc-node { display: flex; flex-direction: column; align-items: center; gap: 2px; background: ${T.paper}; border-radius: 11px; padding: 9px 8px; min-width: 76px; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.16); }
        .cyc-node.done { background: ${T.successSoft}; box-shadow: inset 0 0 0 1.5px ${T.success}; }
        .cyc-ico { font-size: 18px; line-height: 1; } .cyc-lbl { font-family: 'Manrope'; font-weight: 700; font-size: 10px; color: ${T.ink}; text-align: center; }
        .cyc-arrow { color: ${T.ink3}; font-weight: 700; font-size: 14px; } .cyc-arrow.on { color: ${T.success}; }

        @keyframes shake { 0%,100% { transform: none; } 25% { transform: translateX(-4px); } 50% { transform: translateX(4px); } 75% { transform: translateX(-3px); } }
        .shake { animation: shake 0.4s ease; }

        .hero { display: flex; align-items: center; justify-content: space-between; gap: 24px; flex-wrap: wrap; }
        .hero-l { flex: 1; min-width: 240px; display: flex; flex-direction: column; gap: 8px; }
        .done-chip { display: inline-flex; align-items: center; gap: 7px; align-self: flex-start; font-family: 'Manrope'; font-weight: 700; font-size: 12px; color: ${T.success}; background: ${T.successSoft}; padding: 5px 12px; border-radius: 99px; } .done-chip .tick { width: 15px; height: 15px; border-radius: 50%; background: ${T.success}; color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 9px; }
        .ring-wrap { position: relative; width: 128px; height: 128px; flex-shrink: 0; }
        .ring-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .ring-num { font-family: 'Fraunces', serif; font-size: 30px; line-height: 1; } .ring-den { color: ${T.ink3}; font-size: 20px; } .ring-lbl { font-size: 10px; color: ${T.ink2}; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 3px; }
        .card { background: ${T.paper}; border-radius: 16px; padding: 18px 20px; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.14); }
        .card-lbl { display: flex; align-items: center; gap: 8px; font-family: 'Manrope'; font-weight: 700; font-size: 13px; margin-bottom: 11px; }
        .recap { display: flex; flex-direction: column; gap: 8px; list-style: none; } .recap li { display: flex; align-items: flex-start; gap: 10px; font-size: clamp(13px,1.6vw,15px); color: ${T.ink}; animation: fade-in-up 0.4s ease-out forwards; opacity: 0; } .recap .ck { color: ${T.success}; font-weight: 700; flex-shrink: 0; }
        .hw ul { display: flex; flex-direction: column; gap: 6px; list-style: none; } .hw li { font-size: clamp(13px,1.6vw,15px); color: ${T.ink}; } .hw li b { color: ${T.accent}; } .hw .t { color: ${T.ink2}; } .hw-note { margin: 11px 0 0; font-size: 12px; color: ${T.accent}; font-weight: 600; }
        .gloss { background: ${T.paper}; border-radius: 12px; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.12); overflow: hidden; }
        .gloss-head { display: flex; align-items: center; justify-content: space-between; padding: 13px 17px; cursor: pointer; } .gloss-head .lbl { font-family: 'Manrope'; font-weight: 700; font-size: 13px; color: ${T.ink}; } .gloss-toggle { font-size: 18px; color: ${T.ink2}; }
        .gloss-body { padding: 0 17px 15px; font-size: clamp(12.5px,1.5vw,14px); color: ${T.ink2}; line-height: 1.7; } .gloss-body b { color: ${T.ink}; }

        .mentor-mob .mentor-msg { overflow: hidden; max-height: 360px; transition: max-height 0.38s cubic-bezier(.4,0,.2,1), opacity 0.25s ease, padding 0.38s ease, box-shadow 0.3s ease; }
        .mentor-mob.is-collapsed { align-items: center; cursor: pointer; }
        .mentor-mob.is-collapsed .mentor-col { gap: 0; }
        .mentor-mob.is-collapsed .mentor-msg { max-height: 0; opacity: 0; padding-top: 0; padding-bottom: 0; box-shadow: none; }
        .mentor-cue { font-family: 'Manrope'; font-weight: 600; font-size: 11px; color: ${T.accent}; }
      `}</style>
      <div className="lesson-root">
        <Current screen={screen} storedAnswer={answers[screen]} answers={answers} onAnswer={recordAnswer} onNext={next} onPrev={prev} onReset={reset} onFinish={finishLesson} />
      </div>
    </LangContext.Provider>
  );
}
