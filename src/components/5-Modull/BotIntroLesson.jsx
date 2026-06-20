import React, { useState, useEffect, useRef, createContext, useContext, useCallback, useMemo } from 'react';

// ============================================================
// BOTLAR VA AVTOMATIZATSIYA MODULI · DARS 1 — BOT NIMA: trigger → action — PLATFORM STANDARD v16 (AUDIOSIZ)
// Maqsad: o'quvchi bot nima ekanini (signalga reaksiya qiladigan dastur), event-driven mantiqni (trigger → action),
//         bot arxitekturasini (Foydalanuvchi → Telegram → Bot API → Bot kodi → DB/AI) va bot tsiklini tushunadi.
// Falsafa: SIZ — DIREKTOR, AI — ISHCHI. Arxitekturani tushunsangiz, AI bilan ISTALGAN botni qura olasiz.
// Metafora: trigger → action (botning refleksi). Bot = 24/7 reaksiya qiladigan xizmatchi.
// SIFAT: javob aralashtirish (placeCorrect), mobil avtoscroll, mentor mobil, "siz" rasmiy. AUDIOSIZ. Lotincha.
// PRODUCTION: <style> ichidagi @import OLIB TASHLANADI — shriftlarni LMS yuklaydi.
// ============================================================

const T = {
  bg: '#F6F4EF', ink: '#0E0E10', ink2: '#5A5A60', ink3: '#A7A6A2',
  paper: '#FFFFFF', accent: '#FF4F28', accentSoft: '#FFE8E1',
  success: '#1F7A4D', successSoft: '#E3F0E8', blue: '#019ACB', blueSoft: '#E2F4FA',
  danger: '#C2362B', dangerSoft: '#FAE3E0', amber: '#B45309',
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

const LESSON_META = { lessonId: 'bot-intro-v1', lessonTitle: { uz: 'Bot nima — trigger va action', ru: 'Что такое бот' } };
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
        <svg viewBox="0 0 40 40" width="40" height="40"><circle cx="20" cy="20" r="20" fill={T.accentSoft} /><circle cx="20" cy="16" r="6" fill={T.accent} /><path d="M8 36 a12 9 0 0 1 24 0 Z" fill={T.accent} /></svg>
      </div>
      <div className="mentor-col">
        <span className="mentor-name">Mentor{collapsed && <span className="mentor-cue"> · ko'rsatmani ochish ▾</span>}</span>
        <div className="mentor-msg body">{children}</div>
      </div>
    </div>
  );
};

const Kw = ({ children }) => <span style={{ color: CODE.tag }}>{children}</span>;
const At = ({ children }) => <span style={{ color: CODE.attr }}>{children}</span>;
const St = ({ children }) => <span style={{ color: CODE.str }}>{children}</span>;
const Cm = ({ children }) => <span style={{ color: CODE.comment, fontStyle: 'italic' }}>{children}</span>;

const CodeFile = ({ name, children, minH }) => (
  <div className="editor">
    <div className="editor-bar"><span className="bb-dots"><i /><i /><i /></span><span className="editor-tab">{name}</span></div>
    <div className="editor-body" style={{ minHeight: minH }}><pre className="editor-code">{children}</pre></div>
  </div>
);

// ============================================================ BOT MAVZUSI KOMPONENTLARI

// trigger → action juftliklari (modul yuragidagi misollar)
const TA_PAIRS = [
  { id: 'start', trig: '/start', tIco: '🚀', act: 'Salomlashadi va menyuni ko\'rsatadi', aIco: '👋' },
  { id: 'menu',  trig: '"Menyu" tugmasi bosildi', tIco: '🔘', act: 'Taomlar ro\'yxatini yuboradi', aIco: '📋' },
  { id: 'photo', trig: 'Rasm yuborildi', tIco: '🖼️', act: 'Rasmni saqlab "qabul qilindi" deydi', aIco: '💾' },
  { id: 'help',  trig: '/help', tIco: '❓', act: 'Yordam matnini yuboradi', aIco: '📖' }
];
const ACT_DISPLAY_ORDER = ['photo', 'help', 'start', 'menu']; // sxemada action ustuni aralash chiqsin

// Bot arxitekturasi qismlari
const ARCH = [
  { id: 'user', ico: '👤', label: 'Foydalanuvchi', desc: "Telegram'da botga xabar, tugma yoki buyruq (/start) yuboradi. Bu — signal, ya'ni trigger." },
  { id: 'tg',   ico: '✈️', label: 'Telegram',     desc: "Xabarni qabul qiladi va Bot API orqali sizning kodingizga uzatadi. Botingiz Telegram ichida yashaydi." },
  { id: 'api',  ico: '📮', label: 'Bot API',      desc: "\"Pochtachi\": xabarni Telegramdan kodingizga, javobni kodingizdan Telegramga olib boradi. Token bilan ishlaydi." },
  { id: 'code', ico: '🧠', label: 'Bot kodi',     desc: "Botning \"miyasi\": signalni tushunadi, qaror qiladi va qaysi amalni bajarishni hal qiladi — trigger → action. Buni siz (AI bilan) yozasiz." },
  { id: 'data', ico: '🗄️', label: 'DB / AI',      desc: "Ixtiyoriy: bot ma'lumotni eslab qolishi (PostgreSQL) yoki aqlli javob berishi (AI) uchun. Keyingi darslarda ulaymiz." }
];

// Bot tsikli — kutadi → reaksiya qiladi → yana kutadi
const CYCLE = [
  { id: 'wait',       ico: '👂', label: 'Kutadi',          d: "Bot doim yoqilgan — yangi signalni sabr bilan kutib turadi." },
  { id: 'signal',     ico: '📩', label: 'Signal keldi',    d: "Foydalanuvchi xabar / tugma / buyruq yubordi. Bu — trigger." },
  { id: 'understand', ico: '🔎', label: 'Tushunadi',       d: "Bu qaysi trigger? Bot signalni taniydi (masalan: bu /start ekan)." },
  { id: 'action',     ico: '⚡', label: 'Amal bajaradi',   d: "Mos action'ni bajaradi: javob tayyorlaydi, ma'lumot saqlaydi yoki API chaqiradi." },
  { id: 'reply',      ico: '💬', label: 'Javob qaytaradi', d: "Natijani foydalanuvchiga yuboradi — va darhol yana kutishga qaytadi ↻." }
];
const CYCLE_ORDER = CYCLE.map(c => c.id);
const CYCLE_SCRAMBLED = ['action', 'wait', 'reply', 'signal', 'understand'];

// ===== TELEGRAM CHAT (jonli ko'rinish) =====
const TgChat = ({ title = 'AvtoPizza bot', children, minH }) => (
  <div className="tg">
    <div className="tg-head"><span className="tg-ava">🤖</span><span className="tg-name">{title}<span className="tg-status">bot · onlayn</span></span></div>
    <div className="tg-body" style={{ minHeight: minH }}>{children}</div>
  </div>
);
const Bubble = ({ from = 'bot', children }) => <div className={`tg-bubble ${from} el-in`}>{children}</div>;
const TgBtns = ({ items }) => <div className="tg-btns el-in">{items.map((b, i) => <span key={i} className="tg-btn">{b}</span>)}</div>;

// ===== SIGNAL SAYOHATI: trigger → 🧠 → action (animatsiya) =====
const RunFlow = ({ trig, tIco, act, aIco, playKey }) => {
  const [step, setStep] = useState(playKey ? 3 : 0);
  useEffect(() => {
    if (!playKey) return;
    setStep(0);
    const t0 = setTimeout(() => setStep(1), 60);
    const t1 = setTimeout(() => setStep(2), 520);
    const t2 = setTimeout(() => setStep(3), 1080);
    return () => { clearTimeout(t0); clearTimeout(t1); clearTimeout(t2); };
  }, [playKey]);
  return (
    <div className="bflow">
      <div className={`bnode trig ${step >= 1 ? 'on' : ''}`}><span className="bnode-ico">{tIco}</span><span className="bnode-lbl">{trig}</span><span className="bnode-tag">trigger</span></div>
      <span className={`bflow-arrow ${step >= 2 ? 'on' : ''}`}>›</span>
      <div className={`bnode brain ${step >= 2 ? 'on' : ''} ${step === 2 ? 'thinking' : ''}`}><span className="bnode-ico">🧠</span><span className="bnode-lbl">Bot</span><span className="bnode-tag">{step === 2 ? "o'ylayapti…" : 'mantiq'}</span></div>
      <span className={`bflow-arrow ${step >= 3 ? 'on' : ''}`}>›</span>
      <div className={`bnode act ${step >= 3 ? 'on' : ''}`}><span className="bnode-ico">{aIco}</span><span className="bnode-lbl">{act}</span><span className="bnode-tag">action</span></div>
    </div>
  );
};

// ===== ARXITEKTURA OQIMI =====
const ArchFlow = ({ seen }) => (
  <div className="archflow">
    {ARCH.map((a, i) => (
      <React.Fragment key={a.id}>
        {i > 0 && <span className={`archflow-arrow ${a.id === 'data' ? 'dashed' : ''}`}>{a.id === 'data' ? '⇢' : '→'}</span>}
        <div className={`archnode ${seen.has(a.id) ? 'on' : ''} ${a.id === 'data' ? 'opt' : ''}`}>
          <span className="archnode-ico">{a.ico}</span>
          <span className="archnode-lbl">{a.label}</span>
        </div>
      </React.Fragment>
    ))}
  </div>
);

// ===== BOT TSIKLI TRAKI =====
const CycleTrack = ({ upto = 0, showLoop }) => (
  <div className="cyc">
    {CYCLE.map((c, i) => (
      <React.Fragment key={c.id}>
        {i > 0 && <span className={`cyc-arrow ${i < upto ? 'on' : ''}`}>→</span>}
        <div className={`cyc-node ${i < upto ? 'done' : ''} ${i === upto - 1 ? 'active' : ''}`}>
          <span className="cyc-ico">{c.ico}</span>
          <span className="cyc-lbl">{c.label}</span>
        </div>
      </React.Fragment>
    ))}
    <span className={`cyc-loop ${showLoop ? 'on' : ''}`}>↻ yana kutadi</span>
  </div>
);

// ===== SCREEN 0 — HOOK: soat 03:00, bot o'zi javob berdi =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [tried, setTried] = useState(!!storedAnswer);
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const [sc, setSc] = useState(0);
  const OPTS = [
    { id: 'a', label: "Men — telefonni olib, qo'lda javob berdim" },
    { id: 'b', label: "Bot — men uxlasam ham, signalga o'zi javob berdi" },
    { id: 'c', label: "Hech kim — mijoz javob kutib, ketib qoldi" }
  ];
  const poke = () => { setTried(true); setSc(n => n + 1); };
  const pick = (v) => { if (picked !== null || !tried) return; setPicked(v); setSc(n => n + 1); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: true }); };
  return (
    <Stage eyebrow="Kirish" screen={screen} scrollSignal={sc} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 880 }}>Soat <span className="mono" style={{ color: T.accent }}>03:00</span>. Siz uxlayapsiz. Mijoz do'koningizga yozdi — <span className="italic" style={{ color: T.accent }}>kim javob beradi</span>?</h1>
        <Mentor>Tasavvur qiling: kechasi mijoz buyurtma bermoqchi. Siz uxlayapsiz. Tugmani bosing — va nima bo'lishini ko'ring.</Mentor>
        <Split>
          <Col>
            <TgChat minH={150}>
              <Bubble from="user">Salom, hali ochiqmisiz? 🍕</Bubble>
              {tried && <>
                <Bubble from="bot">Salom! Ha, bot 24/7 ishlaydi 🤖 Menyuni ko'rasizmi?</Bubble>
                <TgBtns items={['🍕 Menyu', '🛒 Buyurtma', '📍 Manzil']} />
              </>}
            </TgChat>
            <button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={poke} disabled={tried}>{tried ? "✓ Bot o'zi javob berdi (03:00)" : "▶ Mijoz xabar yozdi (03:00)"}</button>
            {tried && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Siz uxladingiz — lekin <b>bot uxlamaydi</b>. Xabar (signal) keldi, bot darhol javob (amal) qildi. U buni har kuni, har soatda, charchamasdan qiladi.</p></div>}
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Sizningcha, kim javob berdi?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => {
                const on = picked === o.id;
                return (<button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null || !tried} style={{ opacity: !tried ? 0.55 : 1 }} onClick={() => pick(o.id)}><span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span></button>);
              })}
            </div>
            {!tried && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>Avval chap tomondagi tugmani bosing ←</p>}
            {picked !== null && <p className="hook-ack fade-step">Aynan! <b>Bot</b> — bu sizning o'rningizga signalga reaksiya qiladigan dastur. Bugun shu botning ichida nima borligini, u qanday "o'ylashini" va nega buni bilsangiz <b>AI bilan istalgan botni</b> qura olishingizni o'rganamiz.</p>}
          </Col>
        </Split>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA / RULE: bot nima =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const STEPS = [
    { text: "Bot nima — reaksiya qiladigan dastur", tag: 'tushuncha' },
    { text: "trigger → action — botning mantig'i", tag: 'yurak' },
    { text: "Arxitektura — Telegram, API, kod", tag: 'qismlar' },
    { text: "Siz direktor — AI bilan istalgan bot", tag: 'falsafa' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const Preview = (
    <Col>
      <p className="flow-label">botning butun mantig'i — bitta jumlada</p>
      <RunFlow trig="/start" tIco="🚀" act="Salom! 👋" aIco="👋" playKey={1} />
      <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>Signal keladi (<b>trigger</b>) → bot tushunadi → amal qiladi (<b>action</b>). Bot — shuni qayta-qayta, charchamasdan bajaradigan dastur. Mana shu darsda buni to'liq ochamiz.</p></div>
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
        <div className="head"><h2 className="title h-title fade-up">Bot — bu <span className="italic" style={{ color: T.accent }}>sehr emas</span>. Bu signalga javob beradigan oddiy mantiq.</h2></div>
        <Mentor>Bot — bu <b style={{ color: T.ink }}>signalga reaksiya qiladigan dastur</b>. U oddiy skriptdan farq qiladi: skript bir marta yuqoridan-pastga ishlab to'xtaydi, bot esa <b style={{ color: T.ink }}>doim kutadi</b> va har signalga javob beradi. Mana natija va unga olib boradigan 4 qadam.</Mentor>
        {!isNarrow ? <Split>{Preview}{StepsB}</Split>
          : !showSteps ? <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>{Preview}<button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>4 qadamni ko'rish</button></div>
            : <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}><button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ Mantiqni ko'rish</button>{StepsB}</div>}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — trigger → action (signal sayohati) =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(TA_PAIRS.map(p => p.id)) : new Set());
  const [active, setActive] = useState(storedAnswer ? 'start' : null);
  const [playKey, setPlayKey] = useState(storedAnswer ? 1 : 0);
  const [sc, setSc] = useState(0);
  const done = seen.size >= TA_PAIRS.length;
  const tap = (id) => { setActive(id); setSeen(prev => new Set(prev).add(id)); setPlayKey(k => k + 1); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = TA_PAIRS.find(p => p.id === active);
  return (
    <Stage eyebrow="Tushuncha · trigger→action" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Signallarni sinab ko'ring (${seen.size}/4)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Botning butun mantig'i: <span className="italic" style={{ color: T.accent }}>trigger → action</span></h2></div>
        <Mentor>Har bot ichida juftliklar bor: <b style={{ color: T.ink }}>signal kelsa → shu amalni qil</b>. Har bir signalni bosing — uning bot ichidan qanday o'tib, amalga aylanishini ko'ring.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">signal yuboring (trigger)</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {TA_PAIRS.map(p => <button key={p.id} className="gchip" onClick={() => tap(p.id)} style={seen.has(p.id) ? { boxShadow: `inset 0 0 0 1.5px ${T.success}`, color: T.success } : undefined}>{p.tIco} {p.trig}</button>)}
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana botning siri: u shunchaki <b>trigger → action</b> juftliklari to'plami. Qancha juftlik qo'shsangiz — bot shuncha "aqlli" bo'ladi.</p></div>}
          </Col>
          <Col>
            <p className="flow-label">signal bot ichidan qanday o'tadi</p>
            {cur
              ? <div key={playKey} className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <RunFlow trig={cur.trig} tIco={cur.tIco} act={cur.act} aIco={cur.aIco} playKey={playKey} />
                  <TgChat minH={0}><Bubble from="user">{cur.trig}</Bubble><Bubble from="bot">{cur.aIco} {cur.act}</Bubble></TgChat>
                </div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Chapdan signalni bosing ←</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — BOT TSIKLI (kutadi → reaksiya → yana kutadi) =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [upto, setUpto] = useState(storedAnswer ? CYCLE.length : 0);
  const [running, setRunning] = useState(false);
  const [sc, setSc] = useState(0);
  const done = upto >= CYCLE.length;
  const play = () => {
    if (running) return;
    setRunning(true); setUpto(0); setSc(n => n + 1);
    CYCLE.forEach((_, i) => setTimeout(() => { setUpto(i + 1); if (i === CYCLE.length - 1) setRunning(false); }, 500 + i * 650));
  };
  useEffect(() => { if (done && !running && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done, running]);
  const curStep = upto > 0 ? CYCLE[upto - 1] : null;
  return (
    <Stage eyebrow="Tushuncha · tsikl" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Bir aylanani ko'ring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bot qanday "yashaydi"? <span className="italic" style={{ color: T.accent }}>Kutadi → reaksiya qiladi → yana kutadi</span></h2></div>
        <Mentor>Oddiy skript bir marta ishlab tugaydi. Bot esa <b style={{ color: T.ink }}>aylana</b> ichida yashaydi: u doim kutadi, signal kelsa reaksiya qiladi va yana kutishga qaytadi. Tugmani bosib bitta aylanani ko'ring.</Mentor>
        <div className="fade-up"><CycleTrack upto={upto} showLoop={done} /></div>
        <div className="split">
          <Col>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={running} onClick={play}>{done && !running ? "↻ Yana bir marta" : running ? "● Aylana ketyapti…" : "▶ Bir aylanani ko'rsat"}</button>
            <div className="frame" style={{ borderLeft: `4px solid ${T.ink3}` }}><p className="note-h" style={{ color: T.ink2 }}>📜 Oddiy skript</p><p className="body" style={{ margin: 0, color: T.ink }}>Yuqoridan-pastga bir marta ishlaydi va <b>to'xtaydi</b>. Yangi signalni kutmaydi.</p></div>
          </Col>
          <Col>
            <p className="flow-label">hozirgi qadam</p>
            {curStep
              ? <div className="sk-info fade-step" key={curStep.id}><p className="note-h"><span style={{ fontSize: 18, marginRight: 6 }}>{curStep.ico}</span>{curStep.label}</p><p className="body" style={{ margin: 0, color: T.ink }}>{curStep.d}</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tugmani bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana farqi: bot hech qachon "tugamaydi" — u <b>doim kutadi</b>. Shuning uchun u kechasi 03:00 da ham javob bera oldi.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 =====
const Screen4 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 1-savol"
    questionText="Bot oddiy skriptdan nimasi bilan farq qiladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Bot oddiy <span className="mono" style={{ color: T.accent }}>skriptdan</span> nimasi bilan <span className="italic" style={{ color: T.accent }}>farq qiladi</span>?</h2></>}
    options={["Bot tugamaydi — doim kutadi va har signalga (trigger) reaksiya qiladi", "Bot faqat bir marta yuqoridan-pastga ishlaydi va to'xtaydi", "Bot internetsiz, butunlay yolg'iz ishlaydi", "Bot saytni chiroyli dizayn qiladi"]} correctIdx={0}
    explainCorrect="To'g'ri! Bot — event-driven (signalga asoslangan) dastur. U aylana ichida doim kutadi va har trigger kelganda mos action'ni bajaradi. Aynan shuning uchun 24/7 javob bera oladi."
    explainWrong={{
      1: "Bu — oddiy skript ta'rifi. Bot aksincha: bir marta ishlab to'xtamaydi, doim kutadi va reaksiya qiladi.",
      2: "Aksincha — bot Telegram (internet) orqali ishlaydi. Yolg'izlik bilan aloqasi yo'q.",
      3: "Dizayn — CSS ishi. Bot esa signalga (trigger) javob (action) berish bilan shug'ullanadi.",
      default: "Bot — doim kutadigan, har signalga reaksiya qiladigan dastur."
    }} />
);

// ===== SCREEN 5 — ARXITEKTURA =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(ARCH.map(a => a.id)) : new Set());
  const [active, setActive] = useState(null);
  const [sc, setSc] = useState(0);
  const done = seen.size >= ARCH.length;
  const tap = (id) => { setActive(id); setSeen(prev => new Set(prev).add(id)); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = ARCH.find(a => a.id === active);
  return (
    <Stage eyebrow="Arxitektura" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Qismlarni ko'ring (${seen.size}/5)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bir xabar yo'lda <span className="italic" style={{ color: T.accent }}>kimlardan</span> o'tadi?</h2></div>
        <Mentor>Botda 4 ta asosiy qism bor (5-chisi ixtiyoriy). Xabar shu zanjir bo'ylab boradi va qaytadi. Har qismni bosib, u nima qilishini ko'ring — bu zanjirni bilsangiz, AI'ga aniq buyruq bera olasiz.</Mentor>
        <div className="fade-up"><ArchFlow seen={seen} /></div>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {ARCH.map(a => <button key={a.id} className="gchip" onClick={() => tap(a.id)} style={seen.has(a.id) ? { boxShadow: `inset 0 0 0 1.5px ${T.success}`, color: T.success } : undefined}>{seen.has(a.id) ? '✓ ' : ''}{a.ico} {a.label}</button>)}
            </div>
          </Col>
          <Col>
            {cur
              ? <div className="sk-info fade-step" key={active}><p className="note-h"><span style={{ fontSize: 18, marginRight: 6 }}>{cur.ico}</span>{cur.label}</p><p className="body" style={{ margin: 0, color: T.ink }}>{cur.desc}</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Qismni bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Zanjir: <b>Foydalanuvchi → Telegram → Bot API → Bot kodi</b>. Sizning ishingiz — faqat "miya" (bot kodi)ni yozish. DB va AI esa keyingi darslarda.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 6 — BOT API = pochtachi + token =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [sent, setSent] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = sent;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Bot API · token" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Pochtachini ishlatib ko'ring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bot API — bu <span className="italic" style={{ color: T.accent }}>pochtachi</span>. Token — uning <span className="italic" style={{ color: T.accent }}>kaliti</span>.</h2></div>
        <Mentor>Sizning kodingiz Telegram bilan to'g'ridan-to'g'ri gaplashmaydi. Orada <b style={{ color: T.ink }}>Bot API</b> turadi — u xabarlarni ikki tomonga tashiydi. Tugmani bosib xabarning yo'lini ko'ring.</Mentor>
        <div className="split">
          <Col>
            <div className={`postman ${sent ? 'on' : ''}`}>
              <div className="post-node"><span className="post-ico">🧠</span><span className="post-lbl">Bot kodi</span></div>
              <div className="post-mid"><span className="post-pkt">📮</span><span className="post-cap">Bot API</span></div>
              <div className="post-node"><span className="post-ico">✈️</span><span className="post-lbl">Telegram → 👤</span></div>
            </div>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={sent} onClick={() => { setSent(true); setSc(n => n + 1); }}>{sent ? "✓ Xabar yetkazildi" : "▶ Javob yuborilsin"}</button>
            {sent && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Kodingiz "javob ber" dedi → Bot API uni Telegramga oborib berdi → foydalanuvchi ko'rdi. Teskari yo'l ham xuddi shunday: foydalanuvchi xabari API orqali kodingizga keladi.</p></div>}
          </Col>
          <Col>
            <p className="flow-label">bot token (BotFather beradi)</p>
            <div className="token-box"><span className="token-key">🔑</span><span className="token-val mono">7<span className="token-mask">●●●●●●●●●</span>:AA<span className="token-mask">●●●●●●</span>xZ</span></div>
            <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>Token — botning <b>parol-kaliti</b>. Telegram qaysi bot ekanini token orqali taniydi. Usiz Bot API sizni kiritmaydi. U <b style={{ color: T.danger }}>maxfiy</b> — hech kimga bermaysiz (keyingi darsda <span className="mono">.env</span>'da saqlaymiz).</p></div>
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — SIGNATURE: bot sxemasini ulash (trigger → action) =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [selTrig, setSelTrig] = useState(null);
  const [wired, setWired] = useState(storedAnswer ? new Set(TA_PAIRS.map(p => p.id)) : new Set());
  const [shakeId, setShakeId] = useState(null);
  const [hint, setHint] = useState(null);
  const [sc, setSc] = useState(0);
  const done = wired.size >= TA_PAIRS.length;
  const fired = useRef(!!storedAnswer);
  useEffect(() => { if (done && !fired.current) { fired.current = true; onAnswer(screen, { correct: true, picked: true }); } }, [done]);
  const tapTrig = (id) => { if (wired.has(id)) return; setSelTrig(id); setHint(null); };
  const tapAct = (id) => {
    if (wired.has(id) || done) return;
    if (!selTrig) { setHint("Avval chapdan bitta signalni (trigger) tanlang."); return; }
    if (id === selTrig) { setWired(prev => new Set(prev).add(id)); setSelTrig(null); setHint(null); setSc(n => n + 1); }
    else { setShakeId(id); setHint("Bu signalga bu amal mos kelmaydi — qaytadan o'ylang."); setTimeout(() => setShakeId(x => (x === id ? null : x)), 450); }
  };
  const trigById = (id) => TA_PAIRS.find(p => p.id === id);
  return (
    <Stage eyebrow="Sxema · amaliy" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Botning miyasini chizing (${wired.size}/4)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Endi <span className="italic" style={{ color: T.accent }}>siz</span> botning miyasini chizing: har signalni mos amalga ulang.</h2></div>
        <Mentor>Chapdan bitta <b style={{ color: T.ink }}>signalni</b> (trigger) tanlang, keyin o'ngdan unga mos <b style={{ color: T.ink }}>amalni</b> (action) bosing. To'rttala juftlikni to'g'ri ulasangiz — bot sxemasi tayyor bo'ladi.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">signallar (trigger) — birini tanlang</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {TA_PAIRS.map(p => {
                const isW = wired.has(p.id); const isSel = selTrig === p.id;
                return <button key={p.id} className={`pick-row ${isW ? 'picked' : ''} ${isSel ? 'sel' : ''}`} disabled={isW || done} onClick={() => tapTrig(p.id)}><span style={{ marginRight: 6 }}>{p.tIco}</span><span style={{ flex: 1 }}>{p.trig}</span><span className="pick-plus">{isW ? '✓' : isSel ? '●' : '○'}</span></button>;
              })}
            </div>
          </Col>
          <Col>
            <p className="flow-label">amallar (action) — mosini bosing</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {ACT_DISPLAY_ORDER.map(id => {
                const p = trigById(id); const isW = wired.has(id);
                return <button key={id} className={`pick-row ${isW ? 'picked' : ''} ${shakeId === id ? 'shake' : ''}`} disabled={isW || done} onClick={() => tapAct(id)}><span style={{ marginRight: 6 }}>{p.aIco}</span><span style={{ flex: 1 }}>{p.act}</span><span className="pick-plus">{isW ? '✓' : '+'}</span></button>;
              })}
            </div>
          </Col>
        </div>
        {wired.size > 0 && <div className="wire fade-step">
          <p className="flow-label">bot miyasi (siz uladingiz)</p>
          {[...wired].map(id => { const p = trigById(id); return <div key={id} className="wire-row el-in"><span className="wire-ico">{p.tIco}</span><span className="wire-t">{p.trig}</span><span className="wire-arrow">→</span><span className="wire-ico">{p.aIco}</span><span className="wire-t">{p.act}</span></div>; })}
        </div>}
        {hint && !done && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>{hint}</p></div>}
        {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Bot sxemasi tayyor! Mana bu — botning butun "aqli": 4 ta trigger → action juftligi. Haqiqiy botda ham aynan shunday yoziladi.</p></div>}
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — TEST 2 =====
const Screen8 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 2-savol"
    questionText="Bot token nima uchun kerak?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Bot <span className="mono" style={{ color: T.accent }}>token</span>i nima uchun <span className="italic" style={{ color: T.accent }}>kerak</span>?</h2></>}
    options={["U botning maxfiy kaliti — Telegram qaysi bot ekanini token orqali taniydi", "U botning rangi va dizaynini belgilaydi", "Usiz ham bot bemalol ishlayveradi", "U foydalanuvchining Telegram paroli"]} correctIdx={0}
    explainCorrect="To'g'ri! Token — botning parol-kaliti. BotFather beradi, Bot API uni tekshiradi. Usiz Telegram sizning botingizni tanimaydi. Shuning uchun u maxfiy — hech kimga bermaysiz."
    explainWrong={{
      1: "Rang/dizayn bilan aloqasi yo'q. Token — botning kim ekanini isbotlovchi maxfiy kalit.",
      2: "Aksincha — tokensiz bot umuman ishlamaydi. Telegram uni tanimaydi.",
      3: "Yo'q — bu foydalanuvchining emas, botning kaliti. Uni BotFather sizga beradi.",
      default: "Token — botning maxfiy kaliti, Telegram uni shu orqali taniydi."
    }} />
);

// ===== SCREEN 9 — EVENT-DRIVEN: ko'p signal birdaniga =====
const Screen9 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const USERS = [
    { id: 'aziza', name: 'Aziza', trig: '/start', tIco: '🚀', act: 'Salom + menyu' },
    { id: 'bek',   name: 'Bek',   trig: '"Buyurtma" tugmasi', tIco: '🔘', act: 'Savatni ochadi' },
    { id: 'dilnoza', name: 'Dilnoza', trig: '/help', tIco: '❓', act: 'Yordam matni' }
  ];
  const [seen, setSeen] = useState(storedAnswer ? new Set(USERS.map(u => u.id)) : new Set());
  const [active, setActive] = useState(null);
  const [sc, setSc] = useState(0);
  const done = seen.size >= USERS.length;
  const tap = (id) => { setActive(id); setSeen(prev => new Set(prev).add(id)); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = USERS.find(u => u.id === active);
  return (
    <Stage eyebrow="Event-driven" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `3 mijozni ko'ring (${seen.size}/3)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bir vaqtda <span className="italic" style={{ color: T.accent }}>uch mijoz</span> yozdi. Bot adashadimi?</h2></div>
        <Mentor>Bot "event-driven" — ya'ni har signalni alohida hodisa (event) sifatida ko'radi. Kim yozsa, o'shanga mos amalni qiladi — boshqalarni kutmaydi. Har mijozni bosib ko'ring.</Mentor>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {USERS.map(u => (
                <button key={u.id} className="vcard" onClick={() => tap(u.id)} style={{ boxShadow: active === u.id ? `inset 0 0 0 1.5px ${T.accent}, 0 8px 20px -6px rgba(${T.shadowBase},0.2)` : undefined }}>
                  <span className="role-ico">👤</span>
                  <span className="vlbl">{u.name} <span style={{ color: T.ink2, fontWeight: 500 }}>· {u.tIco} {u.trig}</span></span>
                  <span className="vseen" style={{ color: seen.has(u.id) ? T.success : T.ink3 }}>{seen.has(u.id) ? '✓' : ''}</span>
                </button>
              ))}
            </div>
          </Col>
          <Col>
            {cur
              ? <div className="sk-info fade-step" key={active}><p className="body" style={{ margin: 0, color: T.ink }}>Bot <b>{cur.name}</b>ning signalini ({cur.tIco} {cur.trig}) ko'rdi → unga mos amalni qildi: <b style={{ color: T.success }}>{cur.act}</b>. Boshqa mijozlarga aralashmadi.</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Mijozni bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bot har signalni mustaqil hodisa deb ko'radi — shuning uchun minglab mijoz bilan bir vaqtda gaplasha oladi. Har biriga o'z trigger → action'i.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 10 — FALSAFA: siz direktor, AI ishchi =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [show, setShow] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = show;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Falsafa · direktor" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Ikkinchi yo'lni ko'ring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bu modulning siri: <span className="italic" style={{ color: T.accent }}>siz — direktor, AI — ishchi</span>.</h2></div>
        <Mentor>Kodni AI yozadi — bu tez va qulay. Lekin bitta shart bor: <b style={{ color: T.ink }}>botning ichi qanday ishlashini bilsangizgina</b> AI'ga aniq buyruq bera olasiz va uning kodini tekshira olasiz. Ikki yo'lni solishtiring.</Mentor>
        <div className="split">
          <Col>
            <div className="frame" style={{ borderLeft: `4px solid ${T.danger}` }}>
              <p className="note-h" style={{ color: T.danger }}>🙈 Tushunmasdan prompt</p>
              <p className="body" style={{ margin: 0, color: T.ink }}>"AI, menga bot yasab ber" → ishladi → biroz buzildi → "tuzat" → yana buzildi. <b>Nima bo'layotganini bilmaysiz</b>, shuning uchun boshi berk ko'chada qolasiz.</p>
            </div>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={show} onClick={() => { setShow(true); setSc(n => n + 1); }}>{show ? '✓ Ko\'rdingiz' : "Tushunib buyurish — qanday?"}</button>
          </Col>
          <Col>
            {show
              ? <div className="agent-card fade-step" style={{ borderLeftColor: T.success }}>
                  <span className="agent-lbl" style={{ color: T.success }}>🎯 TUSHUNIB BUYURISH</span>
                  <p className="agent-msg">"Botda <b>/start</b> triggeriga menyu chiqaradigan, <b>'Buyurtma'</b> tugmasiga savat ochadigan handler yoz. Telegraf ishlat." → AI yozdi → siz <b>o'qiysiz</b>, <b>testlaysiz</b>, kerak bo'lsa <b>tuzatasiz</b>. Rul sizda.</p>
                </div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tugmani bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana shuning uchun avval <b>trigger → action</b> va arxitekturani o'rganamiz. Tushunsangiz — AI bilan <b>istalgan murakkablikdagi</b> botni qura olasiz. Tushunmasdan prompt yozmang.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — TEST 3 (trigger/action yo'nalishi) =====
const Screen11 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="trigger → action juftligi qaysi qatorda TO'G'RI?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}><span className="mono" style={{ color: T.accent }}>trigger → action</span> juftligi qaysi qatorda <span className="italic" style={{ color: T.accent }}>to'g'ri</span>?</h2></>}
    options={["/start (trigger) → salom xabarini yuborish (action)", "salom xabarini yuborish (trigger) → /start (action)", "menyu ko'rsatish (trigger) → tugma bosildi (action)", "rasmni saqlash (trigger) → rasm yuborildi (action)"]} correctIdx={0}
    explainCorrect="To'g'ri! Avval signal keladi (/start — trigger), keyin bot amal qiladi (salom yuboradi — action). Yo'nalish doim: oldin trigger, keyin action."
    explainWrong={{
      1: "Teskari! Salom yuborish — bu bot qiladigan amal (action), trigger emas. Avval /start keladi.",
      2: "Teskari: tugma bosilishi — bu trigger (signal), menyu ko'rsatish esa action.",
      3: "Teskari: rasm yuborilishi — trigger, uni saqlash — action. Avval signal, keyin amal.",
      default: "Doim avval trigger (signal), keyin action (amal)."
    }} />
);

// ===== SCREEN 12 — CASE: pizza buyurtma boti =====
const Screen12 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const STEPS = [
    { u: '/start', b: "Salom! 🍕 AvtoPizza'ga xush kelibsiz. Nima qilamiz?", btns: ['🍕 Menyu', '🛒 Buyurtma'], trig: '/start', act: 'salom + menyu tugmalari' },
    { u: '🍕 Menyu', b: "Bizda: Margarita, Pepperoni, To'rt pishloq. Qaysi birini?", btns: ['Margarita', 'Pepperoni'], trig: '"Menyu" tugmasi', act: 'taomlar ro\'yxati' },
    { u: 'Pepperoni', b: "Zo'r tanlov! 📍 Manzilingizni yuboring.", btns: null, trig: 'taom tanlandi', act: 'manzil so\'raydi' },
    { u: 'Chilonzor 5-kvartal', b: "Qabul qilindi ✅ Buyurtma 25 daqiqada yetib boradi. Rahmat!", btns: null, trig: 'manzil yuborildi', act: 'buyurtmani tasdiqlaydi' }
  ];
  const [shown, setShown] = useState(storedAnswer ? STEPS.length : 0);
  const [sc, setSc] = useState(0);
  const done = shown >= STEPS.length;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const advance = () => { setShown(n => Math.min(n + 1, STEPS.length)); setSc(n => n + 1); };
  return (
    <Stage eyebrow="Hayotiy · pizza boti" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Suhbatni davom ettiring (${shown}/4)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Butun pizza buyurtmasi — bu shunchaki <span className="italic" style={{ color: T.accent }}>trigger → action</span> zanjiri.</h2></div>
        <Mentor>Murakkab ko'rinadigan bot ham, aslida, ketma-ket trigger → action juftliklaridan iborat. Tugmani bosib suhbatni qadam-baqadam oching va har qadamda qaysi trigger qaysi action'ni chaqirganini ko'ring.</Mentor>
        <div className="split">
          <Col>
            <TgChat minH={180}>
              {STEPS.slice(0, shown).map((s, i) => (
                <React.Fragment key={i}>
                  <Bubble from="user">{s.u}</Bubble>
                  <Bubble from="bot">{s.b}</Bubble>
                  {s.btns && <TgBtns items={s.btns} />}
                </React.Fragment>
              ))}
              {shown === 0 && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: '6px 2px' }}>Suhbat hali boshlanmagan — tugmani bosing.</p>}
            </TgChat>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={done} onClick={advance}>{done ? '✓ Buyurtma yakunlandi' : shown === 0 ? '▶ Suhbatni boshlash' : 'Keyingi xabar →'}</button>
          </Col>
          <Col>
            <p className="flow-label">har qadamning trigger → action'i</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {STEPS.slice(0, shown).map((s, i) => (
                <div key={i} className="wire-row el-in"><span className="mono" style={{ color: T.accent, fontSize: 11, minWidth: 14 }}>{i + 1}</span><span className="wire-t">{s.trig}</span><span className="wire-arrow">→</span><span className="wire-t" style={{ color: T.success }}>{s.act}</span></div>
              ))}
              {shown === 0 && <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Bu yerda zanjir to'planadi →</p></div>}
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>4 trigger → 4 action. Mana shu — to'liq ishlaydigan bot. Endi tasavvur qiling: AI'ga "shu zanjirni yoz" desangiz — natijani tushunib, tekshira olasiz.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 13 — KEYINGI DARSLAR (Telegraf teaser) =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [done, setDone] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const NEXT = [
    { t: 'Dars 2 — Telegram API + tugmalar', d: "BotFather, token, /start, inline va reply tugmalar. Arxitektura: NestJS + Telegraf." },
    { t: 'Dars 3 — Holat + PostgreSQL', d: "Bot foydalanuvchini va suhbat holatini eslab qolsin — ma'lumotni saqlaymiz." },
    { t: 'Praktikalar — AI bilan bot', d: "AI bilan istalgan bot, AI-bot, to'liq mini-loyiha va AI-agent." }
  ];
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Keyingi darslar" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Kelajak kodga qarang"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bu sxema kodda <span className="italic" style={{ color: T.accent }}>qanday ko'rinadi</span>?</h2></div>
        <Mentor>Keyingi darsda haqiqiy botni quramiz. Mana bugun chizgan sxemangiz Telegraf kutubxonasida deyarli shu ko'rinishda yoziladi — <b style={{ color: T.ink }}>har qatorni hozir tushunish shart emas</b>, faqat tanish bo'lsin.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">bot.js — sizning sxemangiz kodda (namuna)</p>
            <CodeFile name="bot.js" minH={170}>
              <Cm>{'// trigger → action — xuddi siz chizgandek'}</Cm>{'\n'}
              <Kw>bot</Kw>{'.'}<At>start</At>{'(('}<Kw>ctx</Kw>{') => '}{'\n'}
              {'  '}<Kw>ctx</Kw>{'.'}<At>reply</At>{'('}<St>'Salom! 👋'</St>{'))'}{'\n\n'}
              <Kw>bot</Kw>{'.'}<At>hears</At>{'('}<St>'Menyu'</St>{', ('}<Kw>ctx</Kw>{') => '}{'\n'}
              {'  '}<Kw>ctx</Kw>{'.'}<At>reply</At>{'('}<St>'Bizning taomlar…'</St>{'))'}{'\n\n'}
              <Kw>bot</Kw>{'.'}<At>launch</At>{'()  '}<Cm>{'// botni ishga tushiradi (kutadi)'}</Cm>
            </CodeFile>
            <button className="btn-soft" style={{ alignSelf: 'flex-start' }} disabled={done} onClick={() => { setDone(true); setSc(n => n + 1); }}>{done ? '✓ Tushundim' : 'Tushundim ✓'}</button>
          </Col>
          <Col>
            <p className="flow-label">modulda nima quramiz</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {NEXT.map((n, i) => <div key={i} className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}><b style={{ color: T.accent }}>{n.t}</b> — {n.d}</p></div>)}
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}><span className="mono">bot.start</span> = /start triggeri, <span className="mono">bot.hears</span> = matn triggeri, <span className="mono">ctx.reply</span> = action. Bugun o'rgangan tushunchalar — ertaga ishlaydigan kod.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — TEST 4 =====
const Screen14 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 4-savol"
    questionText="Bot signalni qabul qilgach, qaysi tartib to'g'ri?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Bot signalni qabul qilgach, qaysi <span className="italic" style={{ color: T.accent }}>tartib</span> to'g'ri?</h2></>}
    options={["Signalni tushunadi (qaysi trigger) → mos amalni (action) bajaradi → javob qaytaradi", "Avval javob yuboradi → keyin signal nimaligini tushunadi", "Hech narsa qilmaydi — men qo'lda buyruq berishimni kutadi", "Botni o'chiradi va qaytadan yoqadi"]} correctIdx={0}
    explainCorrect="To'g'ri! Bot tsikli: signalni tushunadi → mos action'ni bajaradi → javobni qaytaradi → yana kutadi. Aynan shu ketma-ketlik botni ishlatadi."
    explainWrong={{
      1: "Teskari — bot avval signalni tushunmasa, qanday javob berishni bilmaydi. Oldin tushunish, keyin amal.",
      2: "Yo'q — bot avtomatik ishlaydi. Sizning qo'lda buyrug'ingizni kutmaydi, signalga o'zi reaksiya qiladi.",
      3: "O'chirib-yoqish bilan aloqasi yo'q — bot signalni tushunib, mos amalni bajaradi.",
      default: "Tushunadi → amal qiladi → javob qaytaradi → yana kutadi."
    }} />
);

// ===== SCREEN 15 — YAKUNIY: bot tsiklini to'g'ri tartibda yig'ish =====
const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [placed, setPlaced] = useState(() => (storedAnswer ? [...CYCLE_ORDER] : []));
  const [shakeId, setShakeId] = useState(null);
  const [hint, setHint] = useState(null);
  const done = placed.length === CYCLE_ORDER.length;
  const need = CYCLE_ORDER[placed.length];
  const fired = useRef(!!storedAnswer);
  useEffect(() => {
    if (done && !fired.current) {
      fired.current = true;
      onAnswer(screen, { stage: 'final', screenIdx: screen, question: "Bot tsiklini to'g'ri tartibda joylang", correct: true, firstAttemptCorrect: true, solved: true, picked: CYCLE_ORDER.join(' → ') });
    }
  }, [done]);
  const cycById = (id) => CYCLE.find(c => c.id === id);
  const tap = (id) => {
    if (placed.includes(id) || done) return;
    if (id === need) { setPlaced(p => [...p, id]); setHint(null); }
    else {
      const needC = cycById(need);
      setShakeId(id); setHint(`Hozir emas — avval ${needC.ico} ${needC.label} bo'lishi kerak.`);
      setTimeout(() => setShakeId(x => (x === id ? null : x)), 450);
    }
  };
  return (
    <Stage eyebrow="Yakuniy · amaliy" screen={screen} scrollSignal={placed.length} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Tsiklni yig'ing"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Oxirgi qadam: bot tsiklini <span className="italic" style={{ color: T.accent }}>to'g'ri tartibda</span> yig'ing.</h2></div>
        <Mentor>Bot signalga reaksiya qilganda qadamlar qat'iy tartibda boradi: avval kutadi, signal keladi, uni tushunadi, amal qiladi va javob qaytaradi. To'g'ri qadamni o'ng tomondan tanlang.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">bot tsikli (siz yig'yapsiz)</p>
            {placed.length === 0
              ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Hali bo'sh — o'ng tomondan tanlang →</p></div>
              : <div className="fade-step"><CycleTrack upto={placed.length} showLoop={done} /></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Tsikl tayyor: <b>Kutadi → Signal → Tushunadi → Amal → Javob</b> → va yana kutadi ↻. Mana botning butun hayoti shu aylanada.</p></div>}
          </Col>
          <Col>
            <p className="flow-label">qadamni tanlang (keyingisi: {placed.length}/{CYCLE_ORDER.length})</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {CYCLE_SCRAMBLED.map(id => {
                const c = cycById(id);
                const isPlaced = placed.includes(id);
                return (
                  <button key={id} className={`pick-row ${isPlaced ? 'picked' : ''} ${shakeId === id ? 'shake' : ''}`} disabled={isPlaced || done} onClick={() => tap(id)}>
                    <span style={{ marginRight: 6 }}>{c.ico}</span>
                    <span style={{ flex: 1 }}>{c.label}</span>
                    <span className="pick-plus">{isPlaced ? '✓' : '+'}</span>
                  </button>
                );
              })}
            </div>
            {hint && !done && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>{hint}</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — YAKUN =====
const Screen16 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const RECAP = [
    "Bot — signalga reaksiya qiladigan, tugamaydigan (doim kutadigan) dastur",
    "trigger → action — botning butun mantig'i: signal kelsa, mos amal bajariladi",
    "Arxitektura: Foydalanuvchi → Telegram → Bot API → Bot kodi (→ DB/AI)",
    "Bot API — pochtachi; token — botning maxfiy kaliti",
    "Siz direktorsiz: arxitekturani tushunsangiz, AI bilan istalgan botni qurasiz"
  ];
  const HOMEWORK = [
    { b: "O'ylang", t: "— kundalik hayotda qaysi ishni bot avtomatlashtirishi mumkin? 3 ta g'oya yozing" },
    { b: 'Yozing', t: "— har g'oya uchun kamida bitta trigger → action juftligini daftarga yozing" },
    { b: 'Toping', t: "— Telegram'da @BotFather'ni qidirib toping (hali bot yaratmang) — ertaga kerak" }
  ];
  const GLOSSARY = [
    { b: 'bot', t: '— signalga reaksiya qiladigan dastur' },
    { b: 'trigger', t: '— signal: xabar, tugma yoki buyruq (/start)' },
    { b: 'action', t: '— bot bajaradigan amal (javob, saqlash…)' },
    { b: 'event-driven', t: '— har signalni alohida hodisa deb ko\'rish' },
    { b: 'Bot API', t: '— Telegram va kod orasidagi "pochtachi"' },
    { b: 'token', t: '— botning maxfiy kaliti' },
    { b: 'BotFather', t: '— Telegram\'da bot yaratadigan rasmiy bot' },
    { b: 'Telegraf', t: '— Node.js uchun bot kutubxonasi' }
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
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">✓</span> Bot nima ekanini tushundingiz</span><h2 className="title h-title fade-up d1">Endi bot siz uchun <span className="italic" style={{ color: T.accent }}>sehr emas</span> — aniq mantiq.</h2><p className="body h-sub fade-up d2">{PASSED ? "Tabriklaymiz! trigger → action mantig'ini, bot arxitekturasini va tsiklini bilib oldingiz. Endi haqiqiy bot qurishga tayyorsiz." : "Yaxshi harakat! trigger → action va arxitektura zanjirini mustahkamlash uchun bir-ikki ekranni qayta ko'ring."}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span className="tick" style={{ width: 16, height: 16, borderRadius: '50%', background: T.success, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck">✓</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>📝 Uyga vazifa</div><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">🚀 Keyingi dars — Telegram Bot API: @BotFather bilan birinchi haqiqiy botingizni yaratamiz va tugmalarni qo'shamiz (NestJS + Telegraf)!</p></div>
        </div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">💡 Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function BotIntroLesson({ lang: langProp, onFinished }) {
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

        .vcard { display: flex; align-items: center; gap: 10px; width: 100%; text-align: left; background: ${T.paper}; border: none; border-radius: 12px; padding: 11px 14px; cursor: pointer; transition: all 0.18s; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.16); }
        .vcard:hover:not(:disabled) { transform: translateY(-1px); }
        .vcard:disabled { cursor: default; }
        .vlbl { font-family: 'Manrope'; font-weight: 700; font-size: 13.5px; color: ${T.ink}; }
        .vseen { margin-left: auto; font-weight: 700; }
        .role-ico { font-size: 20px; flex-shrink: 0; }

        .mentor { display: flex; gap: 12px; align-items: flex-start; }
        .mentor-ava { width: 40px; height: 40px; border-radius: 50%; overflow: hidden; flex-shrink: 0; box-shadow: 0 4px 12px -4px rgba(${T.shadowBase},0.28); }
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

        /* PICK ROWS (sxema/tsikl) */
        .pick-row { display: flex; align-items: center; gap: 10px; width: 100%; text-align: left; background: ${T.paper}; border: none; border-radius: 10px; padding: 11px 13px; cursor: pointer; transition: all 0.16s; box-shadow: 0 4px 12px -6px rgba(${T.shadowBase},0.16); font-family: 'Manrope'; font-weight: 600; font-size: clamp(12.5px,1.5vw,14px); color: ${T.ink}; }
        .pick-row:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 8px 18px -6px rgba(${T.shadowBase},0.22); }
        .pick-row.sel { box-shadow: inset 0 0 0 1.5px ${T.accent}, 0 8px 18px -6px rgba(255,79,40,0.28); background: ${T.accentSoft}; }
        .pick-row.picked { background: ${T.successSoft}; color: ${T.success}; box-shadow: inset 0 0 0 1.5px ${T.success}; cursor: default; }
        .pick-row:disabled { cursor: default; }
        .pick-plus { margin-left: auto; font-weight: 700; color: ${T.ink3}; } .pick-row.picked .pick-plus { color: ${T.success}; } .pick-row.sel .pick-plus { color: ${T.accent}; }

        /* AGENT / AI CARD */
        .agent-card { background: ${T.blueSoft}; border-left: 4px solid ${T.blue}; border-radius: 10px; padding: 13px 16px; }
        .agent-lbl { font-family: 'Manrope'; font-weight: 800; font-size: 11px; color: ${T.blue}; display: block; margin-bottom: 5px; letter-spacing: 0.04em; }
        .agent-msg { font-family: 'Manrope'; font-size: clamp(13px,1.5vw,14.5px); color: ${T.ink}; margin: 0; line-height: 1.55; }
        .agent-msg b { color: ${T.ink}; }

        /* ===== TELEGRAM CHAT ===== */
        .tg { border-radius: 14px; overflow: hidden; box-shadow: 0 10px 26px -8px rgba(${T.shadowBase},0.26); border: 1px solid rgba(167,166,162,0.2); }
        .tg-head { background: linear-gradient(180deg,#5A9FD4,#4E8FC0); padding: 10px 14px; display: flex; align-items: center; gap: 10px; }
        .tg-ava { width: 30px; height: 30px; border-radius: 50%; background: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
        .tg-name { font-family: 'Manrope'; font-weight: 700; font-size: 13.5px; color: #fff; display: flex; flex-direction: column; line-height: 1.25; }
        .tg-status { font-weight: 500; font-size: 10.5px; color: #DCEBF7; }
        .tg-body { background: #CFD9E0; background-image: radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1px); background-size: 18px 18px; padding: 13px 12px; display: flex; flex-direction: column; gap: 7px; }
        .tg-bubble { max-width: 82%; padding: 8px 12px; border-radius: 14px; font-family: 'Manrope'; font-weight: 500; font-size: clamp(12.5px,1.5vw,14px); line-height: 1.45; box-shadow: 0 1px 2px rgba(0,0,0,0.12); word-break: break-word; }
        .tg-bubble.bot { align-self: flex-start; background: #fff; color: #0E0E10; border-bottom-left-radius: 5px; }
        .tg-bubble.user { align-self: flex-end; background: #EFFDDE; color: #0E0E10; border-bottom-right-radius: 5px; }
        .tg-btns { align-self: flex-start; display: flex; flex-wrap: wrap; gap: 5px; max-width: 92%; }
        .tg-btn { font-family: 'Manrope'; font-weight: 600; font-size: 11.5px; color: #2E6FA6; background: rgba(255,255,255,0.92); padding: 6px 11px; border-radius: 9px; box-shadow: 0 1px 2px rgba(0,0,0,0.1); }

        /* ===== SIGNAL SAYOHATI: trigger → brain → action ===== */
        .bflow { display: flex; align-items: stretch; gap: 6px; flex-wrap: wrap; }
        .bnode { flex: 1; min-width: 84px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 3px; text-align: center; background: ${T.paper}; border-radius: 13px; padding: 12px 9px; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.16); opacity: 0.4; transform: scale(0.96); transition: all 0.35s cubic-bezier(.4,0,.2,1); }
        .bnode.on { opacity: 1; transform: scale(1); }
        .bnode.trig.on { box-shadow: inset 0 0 0 1.5px ${T.accent}, 0 8px 18px -6px rgba(255,79,40,0.3); }
        .bnode.brain.on { box-shadow: inset 0 0 0 1.5px ${T.blue}, 0 8px 18px -6px rgba(1,154,203,0.3); }
        .bnode.brain.thinking { animation: think-pulse 0.7s ease-in-out infinite; }
        .bnode.act.on { background: ${T.successSoft}; box-shadow: inset 0 0 0 1.5px ${T.success}, 0 8px 18px -6px rgba(31,122,77,0.3); }
        .bnode-ico { font-size: 22px; line-height: 1; }
        .bnode-lbl { font-family: 'Manrope'; font-weight: 700; font-size: 11.5px; color: ${T.ink}; line-height: 1.2; }
        .bnode-tag { font-family: 'JetBrains Mono'; font-size: 9.5px; text-transform: uppercase; letter-spacing: 0.06em; color: ${T.ink3}; }
        .bflow-arrow { align-self: center; font-size: 22px; font-weight: 800; color: ${T.ink3}; opacity: 0.35; transition: all 0.35s; }
        .bflow-arrow.on { color: ${T.accent}; opacity: 1; }
        @keyframes think-pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.05); } }

        /* ===== ARXITEKTURA OQIMI ===== */
        .archflow { display: flex; align-items: center; flex-wrap: wrap; gap: 5px; padding: 4px 0; }
        .archnode { display: flex; flex-direction: column; align-items: center; gap: 3px; background: ${T.paper}; border-radius: 11px; padding: 10px 9px; min-width: 74px; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.16); transition: all 0.25s; }
        .archnode.on { box-shadow: inset 0 0 0 1.5px ${T.success}, 0 6px 16px -6px rgba(31,122,77,0.26); background: ${T.successSoft}; }
        .archnode.opt { border: 1.5px dashed ${T.ink3}; box-shadow: none; background: transparent; }
        .archnode.opt.on { border-style: solid; }
        .archnode-ico { font-size: 19px; line-height: 1; }
        .archnode-lbl { font-family: 'Manrope'; font-weight: 700; font-size: 10px; color: ${T.ink}; text-align: center; }
        .archflow-arrow { color: ${T.ink3}; font-weight: 700; font-size: 15px; }
        .archflow-arrow.dashed { color: ${T.ink3}; opacity: 0.6; }

        /* ===== BOT API POCHTACHI ===== */
        .postman { display: flex; align-items: center; justify-content: space-between; gap: 6px; background: ${T.paper}; border-radius: 14px; padding: 16px 12px; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.16); }
        .post-node { display: flex; flex-direction: column; align-items: center; gap: 4px; min-width: 64px; }
        .post-ico { font-size: 24px; } .post-lbl { font-family: 'Manrope'; font-weight: 700; font-size: 10.5px; color: ${T.ink}; text-align: center; }
        .post-mid { display: flex; flex-direction: column; align-items: center; gap: 3px; flex: 1; }
        .post-pkt { font-size: 22px; transition: transform 0.6s cubic-bezier(.4,0,.2,1); }
        .postman.on .post-pkt { transform: translateX(0); animation: deliver 0.9s ease-in-out; }
        @keyframes deliver { 0% { transform: translateX(-46px); } 100% { transform: translateX(46px); } }
        .post-cap { font-family: 'JetBrains Mono'; font-size: 10px; color: ${T.blue}; font-weight: 700; }

        /* ===== TOKEN ===== */
        .token-box { display: flex; align-items: center; gap: 10px; background: ${CODE.bg}; border-radius: 12px; padding: 13px 15px; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.2); }
        .token-key { font-size: 18px; }
        .token-val { font-size: clamp(12px,1.5vw,14px); color: ${CODE.str}; letter-spacing: 0.04em; }
        .token-mask { color: ${CODE.comment}; letter-spacing: 0.06em; }

        /* ===== WIRE (sxema natijasi) ===== */
        .wire { background: ${T.paper}; border-radius: 14px; padding: 13px 15px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.14); display: flex; flex-direction: column; gap: 7px; }
        .wire-row { display: flex; align-items: center; gap: 7px; font-family: 'Manrope'; font-weight: 600; font-size: clamp(11.5px,1.4vw,13px); color: ${T.ink}; }
        .wire-ico { font-size: 15px; flex-shrink: 0; }
        .wire-t { color: ${T.ink}; }
        .wire-arrow { color: ${T.accent}; font-weight: 800; }

        /* ===== BOT TSIKLI ===== */
        .cyc { display: flex; align-items: center; flex-wrap: wrap; gap: 4px; padding: 4px 0; }
        .cyc-node { display: flex; flex-direction: column; align-items: center; gap: 2px; background: ${T.paper}; border-radius: 11px; padding: 9px 8px; min-width: 70px; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.16); opacity: 0.45; transition: all 0.3s; }
        .cyc-node.done { opacity: 1; background: ${T.successSoft}; box-shadow: inset 0 0 0 1.5px ${T.success}; }
        .cyc-node.active { animation: think-pulse 0.6s ease-in-out; }
        .cyc-ico { font-size: 18px; line-height: 1; } .cyc-lbl { font-family: 'Manrope'; font-weight: 700; font-size: 10px; color: ${T.ink}; text-align: center; }
        .cyc-arrow { color: ${T.ink3}; font-weight: 700; font-size: 14px; opacity: 0.35; transition: all 0.3s; } .cyc-arrow.on { color: ${T.success}; opacity: 1; }
        .cyc-loop { font-family: 'JetBrains Mono'; font-size: 10.5px; font-weight: 700; color: ${T.ink3}; padding: 5px 10px; border-radius: 99px; border: 1.5px dashed ${T.ink3}; opacity: 0.4; transition: all 0.3s; margin-left: 4px; }
        .cyc-loop.on { opacity: 1; color: ${T.accent}; border-color: ${T.accent}; border-style: solid; }

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
