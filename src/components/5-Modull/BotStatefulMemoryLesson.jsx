import React, { useState, useEffect, useRef, createContext, useContext, useCallback, useMemo } from 'react';
import mentorImg from '../../assets/common/mentor.png';

// ============================================================
// BOTLAR VA AVTOMATIZATSIYA MODULI · DARS 3 (T3) — STATEFUL LOGIKA + POSTGRESQL — PLATFORM STANDARD v16 (AUDIOSIZ)
// Maqsad: o'quvchi bot tabiatan STATELESS (xotirasiz) ekanini tushunadi; suhbat holati (qisqa muddatli)
//         va PostgreSQL (uzoq muddatli) bilan botni ESLAB QOLADIGAN qiladi. Xabar oqimi: SELECT → qaror → UPDATE.
// Metafora: bot — XOTIRASI YO'Q XIZMATCHI; daftar (DB) bersangiz eslab qoladi.
// Davomi: T1 (trigger→action), T2 (Telegraf, bot.on). Modul 04'dagi PostgreSQL — "eski do'st", endi botga ulanadi.
// Falsafa: SIZ — DIREKTOR, AI — ISHCHI. Nimani va QACHON eslab qolishni siz hal qilasiz; SQL'ni AI yozadi.
// SIFAT: javob aralashtirish (placeCorrect), mobil avtoscroll, mentor mobil, "siz" rasmiy. AUDIOSIZ. Lotincha.
// PRODUCTION: <style> ichidagi @import OLIB TASHLANADI.
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

const LESSON_META = { lessonId: 'bot-stateful-memory-v1', lessonTitle: { uz: 'Stateful logika + PostgreSQL', ru: 'Stateful логика + PostgreSQL' } };
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

// ===== TELEGRAM CHAT =====
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

const PromptCard = ({ children, who = 'namuna', tone }) => (
  <div className={`prompt-card ${tone || ''}`}><span className="prompt-who">📝 {who}</span><p className="prompt-text">{children}</p></div>
);

// ===== POSTGRESQL JADVAL KO'RINISHI =====
const DB_COLS = [{ k: 'id', h: 'id' }, { k: 'tg', h: 'telegram_id' }, { k: 'ism', h: 'ism' }, { k: 'holat', h: 'holat' }];
const DbTable = ({ rows, hlRow, hlCol, newRow }) => (
  <div className="dbt-wrap">
    <div className="dbt-cap">🗄️ jadval: <span className="mono">users</span></div>
    <table className="dbt">
      <thead><tr>{DB_COLS.map(c => <th key={c.k}>{c.h}</th>)}</tr></thead>
      <tbody>
        {rows.length === 0
          ? <tr className="empty"><td colSpan={DB_COLS.length}>— jadval bo'sh —</td></tr>
          : rows.map((r, ri) => (
              <tr key={ri} className={`${hlRow === ri ? 'hl' : ''} ${newRow === ri ? 'rowin' : ''}`}>
                {DB_COLS.map(c => <td key={c.k} className={(hlCol === c.k && hlRow === ri) ? 'hlc' : ''}>{r[c.k]}</td>)}
              </tr>
            ))}
      </tbody>
    </table>
  </div>
);

// ===== IKKI XOTIRA TURI =====
const MEMORY_TYPES = [
  { id: 'short', ico: '📝', label: 'Qisqa muddatli — suhbat holati', tag: 'state', desc: "Hozir suhbat qaysi bosqichda: «o'lcham so'radim, javobni kutyapman». Tez-tez o'zgaradi. Bu — qo'ldagi buyurtma varaqasi.", ex: "holat: O'LCHAM_KUTYAPMAN" },
  { id: 'long', ico: '🗄️', label: 'Uzoq muddatli — PostgreSQL', tag: 'DB', desc: "Bu user kim, ismi nima, oldin nima buyurtma qilgan. Bot o'chib yonsa ham qoladi — diskdagi daftar.", ex: "ism, telefon, oldingi buyurtmalar" }
];

// ===== JADVAL USTUNLARI (sxema) =====
const SCHEMA_COLS = [
  { id: 'tg', tok: 'telegram_id', desc: "Har foydalanuvchining noyob raqami — botda uni shu orqali tanaymiz (ctx.chat.id)." },
  { id: 'ism', tok: 'ism', desc: "Foydalanuvchi ismi — uzoq muddatli ma'lumot, bir marta so'rab saqlaymiz." },
  { id: 'holat', tok: 'holat', desc: "Suhbat hozir qaysi bosqichda. Qisqa muddatli holatni ham shu yerga yozamiz — restart'da yo'qolmasin." },
  { id: 'created', tok: 'created_at', desc: "Qachon qo'shilgan — Modul 04'dagi kabi standart vaqt ustuni." }
];

// ===== STATE MACHINE (s3) =====
const SM_STATES = [
  { id: 'idle', label: "BO'SH", note: "Suhbat hali boshlanmagan." },
  { id: 'size', label: "O'LCHAM_KUTYAPMAN", note: "O'lchamni so'radim — javobni kutyapman." },
  { id: 'addr', label: "MANZIL_KUTYAPMAN", note: "Manzilni so'radim — javobni kutyapman." },
  { id: 'done', label: "TAYYOR", note: "Buyurtma to'liq yig'ildi." }
];
const SM_MSGS = [
  { u: '/start', b: "Salom! 🍕 O'lchamni tanlang: kichik yoki katta?", to: 'size' },
  { u: 'Katta', b: "Zo'r! Endi manzilingizni yuboring 📍", to: 'addr' },
  { u: 'Chilonzor 5-uy', b: "Rahmat! Buyurtmangiz qabul qilindi ✅", to: 'done' }
];

// ===== KOD QISMLARI (s13 — to'liq stateful handler) =====
const HANDLER_PARTS = [
  { id: 'select', tok: 'SELECT … WHERE telegram_id', desc: "Userni va uning holatini DB'dan o'qiydi — «bu kim va suhbat qayerda?» (eslash)." },
  { id: 'check', tok: 'if (user.holat === …)', desc: "Holatga qarab qaror qiladi — har bosqichda boshqa ish bajaradi." },
  { id: 'update', tok: 'UPDATE … SET', desc: "Foydalanuvchi javobini saqlaydi va holatni keyingi bosqichga o'tkazadi." },
  { id: 'reply', tok: 'ctx.reply(…)', desc: "Keyingi savolni yoki javobni foydalanuvchiga yuboradi (action)." }
];

// ===== STATEFUL OQIM (final) =====
const FLOW = [
  { id: 'msg', ico: '📩', label: 'Xabar keladi', d: "Foydalanuvchi xabar yuboradi." },
  { id: 'select', ico: '🔍', label: 'SELECT — userni top', d: "DB'dan user va holatini o'qiydi." },
  { id: 'check', ico: '🧭', label: 'Holatni tekshir', d: "Suhbat qaysi bosqichda — shunga qarab qaror." },
  { id: 'act', ico: '⚡', label: 'Action', d: "Javob beradi / keyingi savolni so'raydi." },
  { id: 'update', ico: '💾', label: 'UPDATE — saqla', d: "Yangi holat va ma'lumotni DB'ga yozadi." }
];
const FLOW_ORDER = FLOW.map(f => f.id);
const FLOW_SCRAMBLED = ['check', 'msg', 'update', 'select', 'act'];

// ===== SCREEN 0 — HOOK: bot ismni unutadi =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [tried, setTried] = useState(!!storedAnswer);
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const [sc, setSc] = useState(0);
  const OPTS = [
    { id: 'a', label: "Bot buzuq — kodda xato bor" },
    { id: 'b', label: "Bot har xabarni alohida ko'radi — o'tgan gaplarni eslamaydi" },
    { id: 'c', label: "Internet sekin edi, xabar yo'qoldi" }
  ];
  const poke = () => { setTried(true); setSc(n => n + 1); };
  const pick = (v) => { if (picked !== null || !tried) return; setPicked(v); setSc(n => n + 1); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: true }); };
  return (
    <Stage eyebrow="Dars · kirish" screen={screen} scrollSignal={sc} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 880 }}>Botga ismingizni aytdingiz. Bir xabardan keyin u <span className="italic" style={{ color: T.accent }}>yana so'raydi</span>. Nega?</h1>
        <Mentor>Botingiz tugmalar va javoblarni biladi (o'tgan darsda) — lekin u <b style={{ color: T.ink }}>hech narsani eslab qolmaydi</b>. Tugmani bosing va o'z ko'zingiz bilan ko'ring.</Mentor>
        <Zoomable><Split>
          <Col>
            <TgChat title="Xotirasiz bot" sub="bot · onlayn" input={false} minH={150}>
              <Bubble from="bot">Salom! Ismingiz nima?</Bubble>
              {tried && <><Bubble from="user">Ali</Bubble>
                <Bubble from="bot">Tanishganimdan xursandman! 🙂</Bubble>
                <Bubble from="user">Buyurtma bermoqchiman</Bubble>
                <Bubble from="bot">Albatta! Ismingiz nima? 🤔</Bubble></>}
            </TgChat>
            <button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={poke} disabled={tried}>{tried ? '✓ Suhbatni ko\'rdingiz' : "▶ Suhbatni davom ettirish"}</button>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Nega bot ismni unutdi?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => {
                const on = picked === o.id;
                return (<button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null || !tried} style={{ opacity: !tried ? 0.55 : 1 }} onClick={() => pick(o.id)}><span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span></button>);
              })}
            </div>
            {!tried && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>Avval tugmani bosing ←</p>}
            {picked !== null && <p className="hook-ack fade-step">Aynan! Bot tabiatan <b>xotirasiz (stateless)</b> — har xabar u uchun «birinchi marta». Bugun unga <b>xotira</b> beramiz: suhbat holati va PostgreSQL.</p>}
          </Col>
        </Split></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const STEPS = [
    { text: "Bot nega unutadi — stateless muammosi", tag: 'muammo' },
    { text: "2 xil xotira: qisqa (holat) va uzoq (DB)", tag: 'xotira' },
    { text: "PostgreSQL — users jadvali (Modul 04)", tag: 'baza' },
    { text: "Xabar oqimi: SELECT → qaror → UPDATE", tag: 'oqim' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const Preview = (
    <Col>
      <p className="flow-label">dars oxirida — botingiz eslab qoladi</p>
      <TgChat input={false} minH={0}>
        <Bubble from="user">Salom!</Bubble>
        <Bubble from="bot">Yana xush kelibsiz, Ali! 😊 O'tgan safargi Margaritani yana olasizmi?</Bubble>
      </TgChat>
      <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>Bot ismni va o'tgan buyurtmani esladi — chunki ularni <b>bazaga</b> saqlab qo'ygan. Mana shuni quramiz.</p></div>
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
        <div className="head"><h2 className="title h-title fade-up">Botingizga <span className="italic" style={{ color: T.accent }}>xotira</span> beramiz.</h2></div>
        <Mentor>Bu modulning eng «texnik» darsi — lekin qo'rqmang. G'oya oddiy: bot xotirasiz, biz unga <b style={{ color: T.ink }}>daftar</b> (baza) beramiz. Yaxshi xabar — PostgreSQL'ni <b style={{ color: T.ink }}>Modul 04'da</b> o'rgangansiz, endi uni botga ulaymiz.</Mentor>
        {!isNarrow ? (<Zoomable><Split>{Preview}{StepsB}</Split></Zoomable>)
          : !showSteps ? <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>{Preview}<button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>4 qadamni ko'rish</button></div>
            : <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}><button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ Natijani ko'rish</button>{StepsB}</div>}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — STATELESS + 2 XOTIRA TURI =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(MEMORY_TYPES.map(m => m.id)) : new Set());
  const [active, setActive] = useState(null);
  const [sc, setSc] = useState(0);
  const done = seen.size >= MEMORY_TYPES.length;
  const tap = (id) => { setActive(id); setSeen(prev => new Set(prev).add(id)); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = MEMORY_TYPES.find(m => m.id === active);
  return (
    <Stage eyebrow="Tushuncha · xotira" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `2 xotira turini ko'ring (${seen.size}/2)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bot — <span className="italic" style={{ color: T.accent }}>xotirasi yo'q xizmatchi</span>. Unga 2 xil daftar kerak.</h2></div>
        <Mentor>Tasavvur qiling: xizmatchingiz juda xushmuomala, lekin har xabardan keyin hammasini unutadi. Eslab qolishi uchun ikki xil daftar beramiz. Ikkalasini ham bosib ko'ring.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {MEMORY_TYPES.map(m => <button key={m.id} className={`pick-row ${active === m.id ? 'sel' : ''} ${seen.has(m.id) ? 'done-row' : ''}`} onClick={() => tap(m.id)}><span style={{ fontSize: 18, marginRight: 4 }}>{m.ico}</span><span style={{ flex: 1 }}>{m.label}</span><span className="pick-plus">{seen.has(m.id) ? '✓' : '▶'}</span></button>)}
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Eslab qoling: <b>qisqa</b> = «suhbat hozir qayerda», <b>uzoq</b> = «bu kim va tarixi». Professional bot ikkalasini ham <b>bazada</b> saqlaydi.</p></div>}
          </Col>
          <Col>
            {cur
              ? <div className="fade-step" key={active} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="sk-info"><p className="note-h"><span style={{ fontSize: 18, marginRight: 6 }}>{cur.ico}</span>{cur.label}</p><p className="body" style={{ margin: 0, color: T.ink }}>{cur.desc}</p></div>
                  <PromptCard who={`namuna · ${cur.tag}`}>{cur.ex}</PromptCard>
                </div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Xotira turini bosing ←</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — STATE MACHINE (suhbat holati) =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [step, setStep] = useState(storedAnswer ? SM_MSGS.length : 0);
  const [sc, setSc] = useState(0);
  const done = step >= SM_MSGS.length;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const curStateId = step === 0 ? 'idle' : SM_MSGS[step - 1].to;
  const advance = () => { if (!done) { setStep(n => n + 1); setSc(n => n + 1); } };
  return (
    <Stage eyebrow="Tushuncha · holat" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Suhbatni o'tkazing (${step}/${SM_MSGS.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Suhbat holati — bir xil <span className="italic" style={{ color: T.accent }}>«Katta»</span> so'zi, holatga qarab boshqa ma'no.</h2></div>
        <Mentor>Bot har lahzada bitta <b style={{ color: T.ink }}>holatda</b> turadi. Kelgan xabar holatga qarab tushuniladi: «Katta» — o'lchammi yoki boshqa narsami? Tugmani bosib, holat qanday o'zgarishini kuzating.</Mentor>
        <div className="fade-up"><div className="archflow">
          {SM_STATES.map((s, i) => (
            <React.Fragment key={s.id}>
              {i > 0 && <span className="archflow-arrow">→</span>}
              <div className={`archnode ${curStateId === s.id ? 'cur' : ''}`}><span className="archnode-lbl mono" style={{ fontSize: 9 }}>{s.label}</span></div>
            </React.Fragment>
          ))}
        </div></div>
        <Zoomable><div className="split">
          <Col>
            <TgChat input={false} minH={150}>
              {SM_MSGS.slice(0, step).map((m, i) => (<React.Fragment key={i}><Bubble from="user">{m.u}</Bubble><Bubble from="bot">{m.b}</Bubble></React.Fragment>))}
              {step === 0 && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: '6px 2px' }}>Tugmani bosing — suhbat boshlanadi.</p>}
            </TgChat>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={done} onClick={advance}>{done ? '✓ Suhbat tugadi' : step === 0 ? '▶ Suhbatni boshlash' : 'Keyingi xabar →'}</button>
          </Col>
          <Col>
            <div className="sk-info"><p className="note-h">📍 Hozirgi holat</p><p className="holat-badge">{SM_STATES.find(s => s.id === curStateId).label}</p><p className="body" style={{ margin: '8px 0 0', color: T.ink }}>{SM_STATES.find(s => s.id === curStateId).note}</p></div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bir xil bot, bir xil kod — lekin javob <b>holatga</b> bog'liq edi. Bu — stateful logika. Endi savol: bu holatni qayerda saqlaymiz?</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 =====
const Screen4 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 1-savol"
    questionText="Bot o'chib qayta yonsa ham eslab qolishi kerak bo'lgan ma'lumot qayerda saqlanadi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Bot <span className="italic" style={{ color: T.accent }}>o'chib qayta yonsa</span> ham eslab qolishi kerak bo'lgan ma'lumot qayerda saqlanadi?</h2></>}
    options={["Uzoq muddatli xotirada — PostgreSQL bazasida (diskda qoladi)", "Hech qayerda — bot baribir eslamaydi", "Faqat foydalanuvchining telefonida", "Botning nomida"]} correctIdx={0}
    explainCorrect="To'g'ri! Eslab qolinishi shart bo'lgan ma'lumot (ism, buyurtma tarixi, hatto suhbat holati) PostgreSQL bazasida — diskda saqlanadi. Bot o'chib yonsa ham baza joyida turadi."
    explainWrong={{
      1: "Aksincha — to'g'ri saqlasak, bot eslab qoladi. Buning uchun baza (PostgreSQL) kerak.",
      2: "Ma'lumot foydalanuvchida emas, bot tomonida — serverdagi bazada saqlanadi.",
      3: "Bot nomi — bu boshqa narsa. Ma'lumot users jadvalida saqlanadi.",
      default: "Uzoq muddat eslanadigan ma'lumot PostgreSQL bazasida saqlanadi."
    }} />
);

// ===== SCREEN 5 — IN-MEMORY OBYEKT (sodda, lekin zaif) =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [show, setShow] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = show;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Kod · sodda yo'l" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Kamchiligini ko'ring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Holatni saqlashning eng <span className="italic" style={{ color: T.accent }}>sodda</span> yo'li — oddiy obyekt.</h2></div>
        <Mentor>Holatni shunchaki kod ichidagi obyektda saqlash mumkin — chat raqamiga qarab holatni eslab turamiz. Ishlaydi, lekin bitta jiddiy kamchiligi bor. Tugmani bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <CodeFile name="holat.ts" minH={130}>
              <Cm>{'// Holatni oddiy obyektda saqlash'}</Cm>{'\n'}
              <Kw>const</Kw>{' holatlar = {}'}{'  '}<Cm>{'// { [chatId]: holat }'}</Cm>{'\n\n'}
              <Cm>{'// /start bosilganda:'}</Cm>{'\n'}
              {'holatlar[ctx.chat.id] = '}<St>'OLCHAM_KUTYAPMAN'</St>{'\n\n'}
              <Cm>{'// xabar kelganda:'}</Cm>{'\n'}
              <Kw>const</Kw>{' holat = holatlar[ctx.chat.id]'}
            </CodeFile>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={show} onClick={() => { setShow(true); setSc(n => n + 1); }}>{show ? '✓ Ko\'rdingiz' : "Kamchiligi nimada? 🤔"}</button>
          </Col>
          <Col>
            {show
              ? <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>❌ <b>Bu obyekt RAM'da yashaydi.</b> Bot serveri o'chsa yoki qayta ishga tushsa — obyekt bo'shab qoladi. Hamma holat va ma'lumot <b>g'oyib bo'ladi</b>. Yuzlab foydalanuvchi suhbat o'rtasida «adashib» qoladi.</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tugmani bosing ←</p></div>}
            {done && <div className="agent-card fade-step"><span className="agent-lbl">📍 YECHIM</span><p className="agent-msg">RAM emas — <b>diskka</b> yozish kerak. Mana shu yerda <b>PostgreSQL</b> kiradi. Keyingi ekranda nega kerakligini o'z ko'zingiz bilan ko'rasiz.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 6 — RESTART SIMULYATSIYASI =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [restarted, setRestarted] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = restarted;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Tajriba · restart" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Botni qayta ishga tushiring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Botni <span className="italic" style={{ color: T.accent }}>o'chir-yoqing</span> — nima qoladi, nima yo'qoladi?</h2></div>
        <Mentor>Serverlar har kuni qayta ishga tushadi (yangilanish, nosozlik, deploy). Tugmani bosib, restart paytida ikki xotiraga nima bo'lishini ko'ring.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div className={`mem-box ${restarted ? 'gone' : ''}`}>
              <p className="note-h" style={{ color: restarted ? T.danger : T.ink2 }}>📝 RAM — in-memory obyekt</p>
              {restarted
                ? <p className="body" style={{ margin: 0, color: T.danger }}>💨 bo'sh — hammasi yo'qoldi!</p>
                : <p className="body mono" style={{ margin: 0, color: T.ink }}>holatlar = {'{'} 5582: 'MANZIL_KUTYAPMAN' {'}'}</p>}
            </div>
            <div className="mem-box keep">
              <p className="note-h" style={{ color: T.success }}>🗄️ PostgreSQL — diskdagi baza</p>
              <p className="body mono" style={{ margin: 0, color: T.ink }}>users: Ali · MANZIL_KUTYAPMAN ✅</p>
            </div>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={restarted} onClick={() => { setRestarted(true); setSc(n => n + 1); }}>{restarted ? '✓ Restart bo\'ldi' : "🔌 Botni qayta ishga tushirish"}</button>
          </Col>
          <Col>
            {restarted
              ? <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Ko'rdingizmi? RAM tozalandi, lekin <b>bazadagi ma'lumot joyida</b>. Shuning uchun holatni ham, ma'lumotni ham PostgreSQL'da saqlaymiz — bot restart'dan keyin suhbatni davom ettira oladi.</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tugmani bosing — restart qiling ←</p></div>}
            {done && <div className="sk-info fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Xulosa: <b>RAM — vaqtinchalik</b>, <b>baza — doimiy</b>. Ishonchli bot ma'lumotni bazaga yozadi.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — POSTGRESQL: ESKI DO'ST (users jadvali) =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(SCHEMA_COLS.map(c => c.id)) : new Set());
  const [active, setActive] = useState(null);
  const [sc, setSc] = useState(0);
  const done = seen.size >= SCHEMA_COLS.length;
  const tap = (id) => { setActive(id); setSeen(prev => new Set(prev).add(id)); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = SCHEMA_COLS.find(c => c.id === active);
  return (
    <Stage eyebrow="Baza · users" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `4 ustunni oching (${seen.size}/4)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up"><span className="mono" style={{ color: T.accent }}>PostgreSQL</span> — eski do'st. Botning <span className="italic" style={{ color: T.accent }}>users</span> jadvali.</h2></div>
        <Mentor>Buni <b style={{ color: T.ink }}>Modul 04'da</b> o'rgangansiz: jadval, ustunlar, qatorlar. Yangilik faqat shuki — endi bu jadvalga <b style={{ color: T.ink }}>bot</b> yozadi. Har ustunni bosib, nima saqlashini eslang.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <CodeFile name="schema.sql" minH={150}>
              <Kw>CREATE TABLE</Kw>{' users ('}{'\n'}
              {'  '}<At>id</At>{'           '}<Kw>SERIAL</Kw>{' PRIMARY KEY,'}{'\n'}
              {'  '}<At>telegram_id</At>{'  '}<Kw>BIGINT</Kw>{' UNIQUE,'}{'\n'}
              {'  '}<At>ism</At>{'          '}<Kw>TEXT</Kw>{','}{'\n'}
              {'  '}<At>holat</At>{'        '}<Kw>TEXT</Kw>{','}{'\n'}
              {'  '}<At>created_at</At>{'   '}<Kw>TIMESTAMP</Kw>{' DEFAULT now()'}{'\n'}
              {')'}
            </CodeFile>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {SCHEMA_COLS.map(c => <button key={c.id} className="gchip" onClick={() => tap(c.id)} style={seen.has(c.id) ? { boxShadow: `inset 0 0 0 1.5px ${T.success}`, color: T.success } : undefined}>{seen.has(c.id) ? '✓ ' : ''}<span className="mono">{c.tok}</span></button>)}
            </div>
          </Col>
          <Col>
            {cur
              ? <div className="sk-info fade-step" key={active}><p className="note-h"><span className="mono" style={{ color: T.accent, fontSize: 12 }}>{cur.tok}</span></p><p className="body" style={{ margin: 0, color: T.ink }}>{cur.desc}</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Ustunni bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Diqqat: <span className="mono">holat</span> ham shu yerda — suhbat holatini ham bazaga yozamiz, restart'da yo'qolmasin. Endi bot bu jadval bilan qanday ishlashini ko'ramiz.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — TEST 2 (state machine) =====
const Screen8 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 2-savol"
    questionText="Bot O'LCHAM_KUTYAPMAN holatida. Foydalanuvchi 'Katta' dedi. Bot nima qiladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Bot <span className="mono" style={{ color: T.accent }}>O'LCHAM_KUTYAPMAN</span> holatida. Foydalanuvchi <span className="italic" style={{ color: T.accent }}>«Katta»</span> dedi. Bot nima qiladi?</h2></>}
    options={["«Katta»ni o'lcham deb saqlaydi, holatni MANZIL_KUTYAPMAN ga o'tkazadi va keyingi savolni beradi", "Yana o'lcham so'raydi — chunki holatni bilmaydi", "«Tushunmadim» deydi, chunki «Katta» buyruq emas", "Hech narsa qilmaydi, holat o'zgarmaydi"]} correctIdx={0}
    explainCorrect="To'g'ri! Holat O'LCHAM_KUTYAPMAN bo'lgani uchun bot «Katta»ni o'lcham javobi deb tushunadi: saqlaydi, holatni keyingi bosqichga (MANZIL_KUTYAPMAN) o'tkazadi va manzil so'raydi. Mana shu — stateful logika."
    explainWrong={{
      1: "Yo'q — bot aynan holatni bilgani uchun adashmaydi. O'LCHAM_KUTYAPMAN'da «Katta» = o'lcham javobi.",
      2: "AI-bot emas, bu oddiy stateful bot — u holatga qarab javobni aniq tushunadi.",
      3: "Aksincha — holat saqlangani uchun bot keyingi bosqichga o'tadi, to'xtab qolmaydi.",
      default: "Holatga qarab javobni saqlaydi va keyingi bosqichga o'tadi."
    }} />
);

// ===== SCREEN 9 — INSERT (yangi user) =====
const Screen9 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [inserted, setInserted] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = inserted;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const rows = inserted ? [{ id: 1, tg: '5582103', ism: 'Ali', holat: "BO'SH" }] : [];
  return (
    <Stage eyebrow="Baza · INSERT" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "/start bosing"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Yangi foydalanuvchi <span className="mono" style={{ color: T.accent }}>/start</span> bosdi — bazaga <span className="italic" style={{ color: T.accent }}>yoziladi</span>.</h2></div>
        <Mentor>Foydalanuvchi birinchi marta botni ochganda (<span className="mono">/start</span>), uni jadvalga qo'shamiz — <b style={{ color: T.ink }}>INSERT</b>. Bu — «daftarga yangi mijoz qo'shish». Tugmani bosing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <CodeFile name="start.ts" minH={90}>
              <Kw>bot</Kw>{'.'}<At>start</At>{'('}<Kw>async</Kw>{' (ctx) => {'}{'\n'}
              {'  '}<Kw>await</Kw>{' db.'}<At>query</At>{'('}{'\n'}
              {'    '}<St>'INSERT INTO users(telegram_id, holat)'</St>{'\n'}
              {'    '}<St>'VALUES($1, $2)'</St>{', [ctx.chat.id, '}<St>'BOSH'</St>{'])'}{'\n'}
              {'  ctx.'}<At>reply</At>{'('}<St>'Salom! 🍕'</St>{')'}{'\n'}
              {'})'}
            </CodeFile>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={inserted} onClick={() => { setInserted(true); setSc(n => n + 1); }}>{inserted ? '✓ Qator qo\'shildi' : "▶ /start bosildi"}</button>
          </Col>
          <Col>
            <DbTable rows={rows} newRow={inserted ? 0 : null} />
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Yangi qator paydo bo'ldi — endi bot bu foydalanuvchini «taniydi». <span className="mono">INSERT</span> = bazaga yangi qator qo'shish.</p></div>}
            {!done && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: '4px 2px' }}>Jadval hozircha bo'sh — tugmani bosing ←</p>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 10 — SELECT + UPDATE =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const base = { id: 1, tg: '5582103', ism: 'Ali', holat: 'MANZIL_KUTYAPMAN' };
  const [rows, setRows] = useState([base]);
  const [hlRow, setHlRow] = useState(null);
  const [hlCol, setHlCol] = useState(null);
  const [seen, setSeen] = useState(storedAnswer ? new Set(['select', 'update']) : new Set());
  const [note, setNote] = useState(null);
  const [sc, setSc] = useState(0);
  const done = seen.size >= 2;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const doSelect = () => { setRows([base]); setHlRow(0); setHlCol(null); setNote('select'); setSeen(p => new Set(p).add('select')); setSc(n => n + 1); };
  const doUpdate = () => { setRows([{ ...base, holat: 'TAYYOR' }]); setHlRow(0); setHlCol('holat'); setNote('update'); setSeen(p => new Set(p).add('update')); setSc(n => n + 1); };
  return (
    <Stage eyebrow="Baza · SELECT + UPDATE" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Ikkalasini sinang (${seen.size}/2)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up"><span className="mono" style={{ color: T.accent }}>SELECT</span> — eslash, <span className="mono" style={{ color: T.accent }}>UPDATE</span> — saqlash.</h2></div>
        <Mentor>Xabar kelganda bot avval foydalanuvchini <b style={{ color: T.ink }}>o'qiydi</b> (SELECT — «bu kim, holati nima?»), keyin yangi holatni <b style={{ color: T.ink }}>yozadi</b> (UPDATE). Ikkala tugmani ham bosib, jadvalga e'tibor bering.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className={`gchip ${seen.has('select') ? '' : ''}`} onClick={doSelect} style={{ padding: '10px 15px', ...(seen.has('select') ? { boxShadow: `inset 0 0 0 1.5px ${T.success}`, color: T.success } : {}) }}>{seen.has('select') ? '✓ ' : ''}🔍 SELECT (eslash)</button>
              <button className="gchip" onClick={doUpdate} style={{ padding: '10px 15px', ...(seen.has('update') ? { boxShadow: `inset 0 0 0 1.5px ${T.success}`, color: T.success } : {}) }}>{seen.has('update') ? '✓ ' : ''}💾 UPDATE (saqlash)</button>
            </div>
            {note === 'select' && <div className="sk-info fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>🔍 Bot qatorni o'qidi: «Bu Ali, holati — MANZIL_KUTYAPMAN». Endi u suhbat qayerda turganini biladi.</p></div>}
            {note === 'update' && <div className="sk-info fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>💾 Bot <span className="mono">holat</span> ustunini <b>TAYYOR</b> ga yangiladi — suhbat keyingi bosqichga o'tdi.</p></div>}
            {!note && <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tugmalardan birini bosing ←</p></div>}
          </Col>
          <Col>
            <DbTable rows={rows} hlRow={hlRow} hlCol={hlCol} />
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana botning xotira mexanizmi: <b>SELECT</b> bilan eslaydi, <b>UPDATE</b> bilan yangi holatni saqlaydi. INSERT, SELECT, UPDATE — uchovi yetarli.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — TEST 3 (qaysi SQL) =====
const Screen11 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="Foydalanuvchi birinchi marta /start bossa, uni users jadvaliga qo'shish uchun qaysi SQL?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Foydalanuvchi birinchi marta <span className="mono" style={{ color: T.accent }}>/start</span> bossa, uni jadvalga <span className="italic" style={{ color: T.accent }}>qo'shish</span> uchun qaysi SQL?</h2></>}
    options={["INSERT — yangi qator qo'shadi", "SELECT — faqat o'qiydi, qo'shmaydi", "UPDATE — faqat mavjud qatorni o'zgartiradi", "DELETE — qatorni o'chiradi"]} correctIdx={0}
    explainCorrect="To'g'ri! Yangi foydalanuvchi — bazada hali yo'q, shuning uchun INSERT bilan yangi qator qo'shamiz. Keyin uni o'qish uchun SELECT, holatini o'zgartirish uchun UPDATE ishlatamiz."
    explainWrong={{
      1: "SELECT faqat o'qiydi — yangi qator qo'shmaydi. Yangi user uchun INSERT kerak.",
      2: "UPDATE mavjud qatorni o'zgartiradi. Lekin yangi user hali yo'q — avval INSERT.",
      3: "DELETE o'chiradi — bizga aksincha, yangi qator qo'shish (INSERT) kerak.",
      default: "Yangi qator qo'shish uchun INSERT ishlatiladi."
    }} />
);

// ===== SCREEN 12 — CASE: AvtoPizza stateful buyurtma boti =====
const Screen12 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const STEPS = [
    { u: '/start', b: "Salom! 🍕 Pizza o'lchamini tanlang: kichik yoki katta?", state: "O'LCHAM_KUTYAPMAN" },
    { u: 'Katta', b: "Zo'r! Qo'shimcha pishloq qo'shaymi? (ha / yo'q)", state: 'QOSHIMCHA_KUTYAPMAN' },
    { u: 'Ha', b: "Mazza 🧀 Endi manzilingizni yuboring 📍", state: 'MANZIL_KUTYAPMAN' },
    { u: 'Chilonzor 5-uy', b: "Rahmat! Buyurtma: Katta + pishloq, Chilonzor 5-uy. Qabul qilindi ✅", state: 'TAYYOR' }
  ];
  const [shown, setShown] = useState(storedAnswer ? STEPS.length : 0);
  const [phase, setPhase] = useState('idle');
  const [sc, setSc] = useState(0);
  const done = shown >= STEPS.length;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const advance = () => {
    if (phase === 'think') return;
    setPhase('think'); setSc(n => n + 1);
    setTimeout(() => { setShown(n => Math.min(n + 1, STEPS.length)); setPhase('idle'); setSc(n => n + 1); }, 750);
  };
  const curState = shown === 0 ? "BO'SH" : STEPS[shown - 1].state;
  return (
    <Stage eyebrow="Hayotiy · buyurtma boti" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Buyurtmani yig'ing (${shown}/4)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">AvtoPizza buyurtma boti — har javob <span className="italic" style={{ color: T.accent }}>saqlanadi</span>, holat siljiydi.</h2></div>
        <Mentor>Bu — to'liq stateful suhbat. Bot har javobni bazaga yozadi va keyingi bosqichga o'tadi. O'ng tomonda holat qanday o'zgarishini kuzating. Tugmani bosib buyurtmani yig'ing.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <TgChat minH={210} input={false}>
              {STEPS.slice(0, shown).map((s, i) => (<React.Fragment key={i}><Bubble from="user">{s.u}</Bubble><Bubble from="bot">{s.b}</Bubble></React.Fragment>))}
              {phase === 'think' && <Bubble from="bot" thinking />}
              {shown === 0 && phase !== 'think' && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: '6px 2px' }}>Tugmani bosing — buyurtma boshlanadi.</p>}
            </TgChat>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={done || phase === 'think'} onClick={advance}>{done ? '✓ Buyurtma qabul qilindi' : shown === 0 ? '▶ Buyurtmani boshlash' : 'Keyingi javob →'}</button>
          </Col>
          <Col>
            <div className="sk-info"><p className="note-h">📍 Hozirgi holat (bazada)</p><p className="holat-badge">{curState}</p></div>
            <div className="sk-info"><p className="note-h">🧠 Har qadamda</p><p className="body" style={{ margin: 0, color: T.ink }}>Bot javobni <b>UPDATE</b> bilan saqlaydi, <span className="mono">holat</span>ni keyingisiga o'tkazadi. Keyingi xabarda <b>SELECT</b> bilan shu holatni o'qiydi.</p></div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Buyurtma bosqichma-bosqich yig'ildi — chunki bot har lahzada «qayerda turganini» esladi. Bot restart bo'lsa ham, holat bazada — suhbat davom etadi.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 13 — TO'LIQ STATEFUL HANDLER (kod) =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(HANDLER_PARTS.map(p => p.id)) : new Set());
  const [active, setActive] = useState(null);
  const [sc, setSc] = useState(0);
  const done = seen.size >= HANDLER_PARTS.length;
  const tap = (id) => { setActive(id); setSeen(prev => new Set(prev).add(id)); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = HANDLER_PARTS.find(p => p.id === active);
  return (
    <Stage eyebrow="Kod · to'liq oqim" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `4 qismni oching (${seen.size}/4)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Mana to'liq <span className="italic" style={{ color: T.accent }}>stateful</span> handler — AI yozadi, siz tushunasiz.</h2></div>
        <Mentor>Bu kodni AI yozib beradi — lekin har qismni o'qiy olishingiz kerak (siz direktorsiz). Pastdagi 4 qismni bosib, har biri nima qilishini oching.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <CodeFile name="handler.ts" minH={180}>
              <Kw>bot</Kw>{'.'}<At>on</At>{'('}<St>'text'</St>{', '}<Kw>async</Kw>{' (ctx) => {'}{'\n'}
              {'  '}<Kw>const</Kw>{' { rows } = '}<Kw>await</Kw>{' db.'}<At>query</At>{'('}{'\n'}
              {'    '}<St>'SELECT * FROM users WHERE telegram_id=$1'</St>{', [ctx.chat.id])'}{'\n'}
              {'  '}<Kw>const</Kw>{' user = rows[0]'}{'\n\n'}
              {'  '}<Kw>if</Kw>{' (user.holat === '}<St>'OLCHAM_KUTYAPMAN'</St>{') {'}{'\n'}
              {'    '}<Kw>await</Kw>{' db.'}<At>query</At>{'('}<St>'UPDATE users SET olcham=$1, holat=$2 …'</St>{')'}{'\n'}
              {'    ctx.'}<At>reply</At>{'('}<St>'Manzilingizni yuboring 📍'</St>{')'}{'\n'}
              {'  }'}{'\n'}
              {'})'}
            </CodeFile>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {HANDLER_PARTS.map(p => <button key={p.id} className="gchip" onClick={() => tap(p.id)} style={seen.has(p.id) ? { boxShadow: `inset 0 0 0 1.5px ${T.success}`, color: T.success } : undefined}>{seen.has(p.id) ? '✓ ' : ''}<span className="mono">{p.id}</span></button>)}
            </div>
          </Col>
          <Col>
            {cur
              ? <div className="sk-info fade-step" key={active}><p className="note-h"><span className="mono" style={{ color: T.accent, fontSize: 12 }}>{cur.tok}</span></p><p className="body" style={{ margin: 0, color: T.ink }}>{cur.desc}</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Kod qismini bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Naqsh aniq: <b>SELECT</b> (o'qi) → <b>holatni tekshir</b> → <b>action</b> → <b>UPDATE</b> (saqla). Har xabar shu yo'ldan o'tadi.</p></div>}
          </Col>
        </div></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — TEST 4 (restart) =====
const Screen14 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 4-savol"
    questionText="Bot serveri qayta ishga tushdi (restart). Nima bo'ladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Bot serveri <span className="italic" style={{ color: T.accent }}>qayta ishga tushdi</span> (restart). Nima bo'ladi?</h2></>}
    options={["PostgreSQL'dagi ma'lumot saqlanib qoladi; faqat RAM'dagi (in-memory) holat yo'qoladi", "Hammasi yo'qoladi — bot endi hech kimni eslamaydi", "Hammasi qoladi, hatto RAM'dagi oddiy obyektlar ham", "Bot butunlay ishlamay qoladi"]} correctIdx={0}
    explainCorrect="To'g'ri! PostgreSQL ma'lumotni diskda saqlaydi — restart unga ta'sir qilmaydi. Faqat RAM'dagi (kod ichidagi obyekt) holat yo'qoladi. Shuning uchun muhim narsani bazaga yozamiz."
    explainWrong={{
      1: "Yo'q — bazaga yozilgan narsa saqlanadi. Faqat RAM'dagi vaqtinchalik holat yo'qoladi.",
      2: "RAM (in-memory obyekt) restart'da tozalanadi — u saqlanmaydi. Faqat baza qoladi.",
      3: "Bot kodi qaytadan yuklanadi va ishlayveradi — bazadagi ma'lumot bilan suhbatni davom ettiradi.",
      default: "Baza saqlanadi, RAM yo'qoladi."
    }} />
);

// ===== SCREEN 15 — YAKUNIY: stateful oqimni yig'ish =====
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
      onAnswer(screen, { stage: 'final', screenIdx: screen, question: "Stateful xabar oqimini to'g'ri tartibda joylang", correct: true, firstAttemptCorrect: true, solved: true, picked: FLOW_ORDER.join(' → ') });
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
    <Stage eyebrow="Yakuniy · amaliy" screen={screen} scrollSignal={placed.length} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Oqimni yig'ing"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Oxirgi qadam: stateful xabar oqimini <span className="italic" style={{ color: T.accent }}>to'g'ri tartibda</span> yig'ing.</h2></div>
        <Mentor>Xabar kelganda bot nima qiladi? Tartibni eslang: xabar keladi, userni o'qiydi (SELECT), holatni tekshiradi, action bajaradi, yangi holatni saqlaydi (UPDATE). To'g'ri qadamni o'ng tomondan tanlang.</Mentor>
        <Zoomable><div className="split">
          <Col>
            <p className="flow-label">stateful oqim (siz yig'yapsiz)</p>
            {placed.length === 0
              ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Hali bo'sh — o'ng tomondan tanlang →</p></div>
              : <div className="cyc fade-step">
                  {placed.map((id, i) => { const f = flowById(id); return <React.Fragment key={id}>{i > 0 && <span className="cyc-arrow on">→</span>}<div className="cyc-node done"><span className="cyc-ico">{f.ico}</span><span className="cyc-lbl">{f.label}</span></div></React.Fragment>; })}
                </div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Oqim tayyor: <b>Xabar → SELECT → holatni tekshir → action → UPDATE</b>. Mana stateful botning butun ishlash sxemasi.</p></div>}
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
    "Bot tabiatan stateless — har xabarni alohida ko'radi, eslab qolmaydi",
    "2 xil xotira: qisqa (suhbat holati) va uzoq (user ma'lumoti, tarix)",
    "In-memory obyekt sodda, lekin restart'da yo'qoladi — baza kerak",
    "PostgreSQL users jadvali: telegram_id, ism, holat (Modul 04'dagi bilim)",
    "Xabar oqimi: SELECT (o'qi) → holatni tekshir → action → UPDATE (saqla)"
  ];
  const HOMEWORK = [
    { b: 'Loyihalang', t: "— o'z botingiz uchun users jadvali sxemasini chizing: qaysi ustunlar kerak?" },
    { b: 'Ajrating', t: "— qaysi ma'lumot qisqa muddatli (holat), qaysi uzoq muddatli (ma'lumot)?" },
    { b: 'Yozing', t: "— AI'ga: «foydalanuvchini /start'da INSERT qil, holatga qarab UPDATE qil» deb prompt yozing" }
  ];
  const GLOSSARY = [
    { b: 'stateless', t: '— xotirasiz; har xabar alohida' },
    { b: 'stateful', t: '— holatni eslab qoladigan logika' },
    { b: 'suhbat holati', t: '— suhbat hozir qaysi bosqichda (state)' },
    { b: 'in-memory', t: '— RAM\'dagi, restart\'da yo\'qoluvchi' },
    { b: 'PostgreSQL', t: '— diskdagi doimiy baza' },
    { b: 'INSERT', t: '— yangi qator qo\'shish' },
    { b: 'SELECT', t: '— qatorni o\'qish (eslash)' },
    { b: 'UPDATE', t: '— qatorni o\'zgartirish (saqlash)' }
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
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">✓</span> Botingizga xotira berdingiz</span><h2 className="title h-title fade-up d1">Endi botingiz <span className="italic" style={{ color: T.accent }}>eslab qoladi</span>.</h2><p className="body h-sub fade-up d2">{PASSED ? "Tabriklaymiz! Stateless muammosini, suhbat holatini va PostgreSQL bilan (INSERT/SELECT/UPDATE) ma'lumot saqlashni o'rgandingiz." : "Yaxshi harakat! Suhbat holati va SELECT → UPDATE oqimi bo'limlarini qayta ko'ring."}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span className="tick" style={{ width: 16, height: 16, borderRadius: '50%', background: T.success, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck">✓</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>📝 Uyga vazifa</div><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">🚀 Keyingi — Loyiha kuni: AI bilan istalgan bot. Endi miya (AI), xotira (DB) va tugmalar — hammasi qo'lingizda!</p></div>
        </div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">💡 Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function BotStatefulMemoryLesson({ lang: langProp, onFinished }) {
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

        /* ===== ARXITEKTURA / STATE MACHINE OQIMI ===== */
        .archflow { display: flex; align-items: center; flex-wrap: wrap; gap: 5px; padding: 4px 0; }
        .archnode { display: flex; flex-direction: column; align-items: center; gap: 3px; background: ${T.paper}; border-radius: 11px; padding: 10px 10px; min-width: 84px; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.16); transition: all 0.25s; }
        .archnode.cur { box-shadow: inset 0 0 0 2px ${T.accent}, 0 6px 16px -6px rgba(255,79,40,0.3); background: ${T.accentSoft}; }
        .archnode-ico { font-size: 19px; line-height: 1; }
        .archnode-lbl { font-family: 'Manrope'; font-weight: 700; font-size: 10px; color: ${T.ink}; text-align: center; }
        .archflow-arrow { color: ${T.ink3}; font-weight: 700; font-size: 15px; }

        /* ===== POSTGRES JADVAL ===== */
        .dbt-wrap { border-radius: 12px; overflow: hidden; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.18); }
        .dbt-cap { background: #2D2D2D; color: #C9D1D9; font-family: 'JetBrains Mono'; font-size: 11px; padding: 7px 12px; }
        .dbt-cap .mono { color: ${T.accent}; }
        .dbt { width: 100%; border-collapse: collapse; font-family: 'JetBrains Mono'; font-size: clamp(10.5px,1.3vw,12px); background: ${T.paper}; }
        .dbt th { background: ${CODE.bg}; color: ${CODE.text}; font-weight: 600; padding: 7px 9px; text-align: left; font-size: 10px; letter-spacing: 0.03em; white-space: nowrap; }
        .dbt td { padding: 8px 9px; border-top: 1px solid rgba(167,166,162,0.22); color: ${T.ink}; white-space: nowrap; transition: background 0.3s; }
        .dbt tr.hl td { background: ${T.blueSoft}; }
        .dbt td.hlc { background: ${T.successSoft}; color: ${T.success}; font-weight: 700; }
        .dbt .empty td { text-align: center; color: ${T.ink3}; font-style: italic; padding: 16px; }
        @keyframes row-in { from { opacity: 0; transform: translateY(-5px); } to { opacity: 1; transform: none; } }
        .dbt tr.rowin td { animation: row-in 0.45s ease; }

        /* ===== HOLAT BADGE / MEM BOX ===== */
        .holat-badge { display: inline-flex; align-items: center; gap: 6px; font-family: 'JetBrains Mono'; font-weight: 700; font-size: clamp(11px,1.4vw,13px); color: ${T.accent}; background: ${T.accentSoft}; padding: 6px 12px; border-radius: 99px; margin: 0; }
        .mem-box { background: ${T.paper}; border-radius: 12px; padding: 14px 16px; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.16); border-left: 4px solid ${T.ink3}; transition: all 0.35s; }
        .mem-box.keep { border-left-color: ${T.success}; }
        .mem-box.gone { border-left-color: ${T.danger}; background: ${T.dangerSoft}; }

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
