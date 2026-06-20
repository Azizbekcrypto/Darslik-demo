import React, { useState, useEffect, useRef, createContext, useContext, useCallback, useMemo } from 'react';

// ============================================================
// BOTLAR VA AVTOMATIZATSIYA MODULI · DARS 5 (P2) — AI-BOT: BOTGA AI MIYA ULASH — PLATFORM STANDARD v16 (AUDIOSIZ)
// Maqsad: o'quvchi AI API'ni (Claude) botga ulashni, system prompt bilan xulqni sozlashni tushunadi.
//         Rule-bot (tayyor javoblar) → AI-bot (o'ylab javob yozadi). AI-bot REAKTIV: faqat matn, amal qilmaydi.
// Davomi: T2 (Telegraf, bot.on text), P1 (AI bilan bot qurish). Endi botning MIYASIni AI qilamiz.
// Falsafa: SIZ — DIREKTOR, AI — ISHCHI. system prompt = AI ishchingizga bergan ish yo'riqnomasi.
// MUHIM: AI-bot (P2, reaktiv javob) ↔ AI-agent (P5, o'zi qaror+amal) farqi aniq ko'rsatiladi.
// SIFAT: javob aralashtirish (placeCorrect), mobil avtoscroll, mentor mobil, "siz" rasmiy. AUDIOSIZ. Lotincha.
// PRODUCTION: <style> ichidagi @import OLIB TASHLANADI. AI API: @anthropic-ai/sdk, model claude-opus-4-8.
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

const LESSON_META = { lessonId: 'bot-ai-brain-v1', lessonTitle: { uz: 'AI-bot: botga AI miya ulash', ru: 'ИИ внутри бота' } };
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

// ===== TELEGRAM CHAT =====
const TgChat = ({ title = 'AvtoPizza AI-bot', sub = 'bot · AI bilan', ava = '🤖', children, input = true, minH }) => (
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

const PromptCard = ({ children, who = 'system prompt', tone }) => (
  <div className={`prompt-card ${tone || ''}`}><span className="prompt-who">⚙️ {who}</span><p className="prompt-text">{children}</p></div>
);

// ===== AI-BOT XULQLARI (system prompt laboratoriyasi) =====
const PERSONAS = [
  { id: 'samimiy', label: '😊 Samimiy', sys: "Sen samimiy, do'stona yordamchisan. Iliq gapir, emoji ishlat.", reply: "Voy salom! 😊 Bugun issiqqina Pepperoni va Margarita bor 🍕 Qaysi birini olib beray?" },
  { id: 'rasmiy', label: '🎩 Rasmiy', sys: "Sen rasmiy ohangda gaplashadigan yordamchisan. Hurmat bilan, qisqa va aniq.", reply: "Assalomu alaykum. Hozirda Pepperoni va Margarita mavjud. Buyurtma berishni xohlaysizmi?" },
  { id: 'qisqa', label: '⚡ Qisqa', sys: "Faqat juda qisqa javob ber. Ortiqcha gap yo'q.", reply: "Pepperoni, Margarita bor. Qaysi biri?" }
];

// ===== ARXITEKTURA: AI qatlami =====
const AI_ARCH = [
  { id: 'user', ico: '👤', label: 'Foydalanuvchi', desc: "Erkin savol yozadi — oldindan belgilangan tugma yoki buyruq emas, oddiy gap." },
  { id: 'bot', ico: '🤖', label: 'Bot (Telegraf)', desc: "Xabarni qabul qiladi (o'tgan darsdagi bot.on('text')) va uni AI API'ga uzatadi." },
  { id: 'ai', ico: '🧠', label: 'AI API (Claude)', desc: "Botning tashqi miyasi. system prompt + foydalanuvchi xabarini oladi, o'ylab javob matnini yozadi." },
  { id: 'reply', ico: '💬', label: 'Javob', desc: "Bot AI yozgan matnni ctx.reply bilan foydalanuvchiga qaytaradi." }
];

// ===== KOD QISMLARI (AI so'rovi tahlili) =====
const CODE_PARTS = [
  { id: 'create', tok: 'ai.messages.create', desc: "AI API'ga so'rov yuboradi — \"o'ylab, javob yoz\" deydi." },
  { id: 'model', tok: "model: 'claude-opus-4-8'", desc: "Qaysi AI \"miya\" ishlashini belgilaydi." },
  { id: 'system', tok: 'system: "..."', desc: "Botning XULQI va shaxsi — bu yerda \"sozlaysiz\" (samimiy? rasmiy? faqat pizza haqida?)." },
  { id: 'messages', tok: 'messages: [...]', desc: "Foydalanuvchi yuborgan xabar (ctx.message.text) shu yerga qo'yiladi." },
  { id: 'text', tok: 'res.content[0].text', desc: "AI yozgan javob matni — uni ctx.reply bilan qaytarasiz (action)." }
];

// ===== AI-BOT OQIMI (final) =====
const FLOW = [
  { id: 'msg', ico: '📩', label: 'Xabar keladi', d: "Foydalanuvchi erkin savol yozadi (bot.on('text'))." },
  { id: 'send', ico: '📤', label: "AI'ga yuboriladi", d: "system prompt + xabar AI API'ga jo'natiladi." },
  { id: 'think', ico: '🧠', label: 'AI o\'ylaydi', d: "AI javob matnini yozadi (system prompt asosida)." },
  { id: 'back', ico: '📥', label: 'Javob qaytadi', d: "res.content[0].text — tayyor javob matni." },
  { id: 'reply', ico: '💬', label: 'ctx.reply', d: "Bot javobni foydalanuvchiga yuboradi." }
];
const FLOW_ORDER = FLOW.map(f => f.id);
const FLOW_SCRAMBLED = ['think', 'msg', 'reply', 'send', 'back'];

// ===== SCREEN 0 — HOOK: rule-bot cheklangan, AI-bot o'ylaydi =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [tried, setTried] = useState(!!storedAnswer);
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const [sc, setSc] = useState(0);
  const OPTS = [
    { id: 'a', label: "Men bu aniq savolni oldindan kodlab qo'yganman" },
    { id: 'b', label: "AI o'ylab, yangi javob yozdi — tayyor javob emas" },
    { id: 'c', label: "Tasodif — botda shunday javob bor edi" }
  ];
  const poke = () => { setTried(true); setSc(n => n + 1); };
  const pick = (v) => { if (picked !== null || !tried) return; setPicked(v); setSc(n => n + 1); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: true }); };
  return (
    <Stage eyebrow="Loyiha · kirish" screen={screen} scrollSignal={sc} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 880 }}>Mijoz <span className="italic" style={{ color: T.accent }}>kutilmagan</span> savol berdi. Sizning botingiz javob bera oladimi?</h1>
        <Mentor>Hozirgacha botingiz faqat tayyor javoblarni qaytardi (rule-bot). Lekin mijoz har doim "menyu" deb yozmaydi. Tugmani bosing — bir savolga ikki xil bot qanday javob berishini ko'ring.</Mentor>
        <Split>
          <Col>
            <TgChat title="Rule-bot (tayyor javoblar)" sub="bot · AI yo'q" input={false} minH={120}>
              <Bubble from="user">Bolalarim uchun nimani tavsiya qilasiz?</Bubble>
              {tried && <Bubble from="bot">Tushunmadim 🤖 "menyu" yoki "narx" deb yozing.</Bubble>}
            </TgChat>
            <TgChat title="AI-bot (o'ylab javob)" sub="bot · AI bilan" input={false} minH={120}>
              <Bubble from="user">Bolalarim uchun nimani tavsiya qilasiz?</Bubble>
              {tried && <Bubble from="bot">Bolalar uchun Margarita zo'r — achchiq emas, hammaga yoqadi 🧀 Kichik o'lcham ham bor 😊</Bubble>}
            </TgChat>
            <button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={poke} disabled={tried}>{tried ? '✓ Ikki bot solishtirildi' : "▶ Bir savol — ikki bot"}</button>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Nega AI-bot javob bera oldi?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => {
                const on = picked === o.id;
                return (<button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null || !tried} style={{ opacity: !tried ? 0.55 : 1 }} onClick={() => pick(o.id)}><span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span></button>);
              })}
            </div>
            {!tried && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>Avval tugmani bosing ←</p>}
            {picked !== null && <p className="hook-ack fade-step">Aynan! Rule-bot faqat siz kodlagan javoblarni biladi. <b>AI-bot</b> esa <b>o'ylab</b>, har savolga yangi javob yozadi. Bugun botimizga shunday AI miya ulaymiz.</p>}
          </Col>
        </Split>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const STEPS = [
    { text: "AI API'ni botga ulash (Claude)", tag: 'miya' },
    { text: "system prompt — botning xulqi", tag: 'shaxs' },
    { text: "Xabarni AI'ga yuborish", tag: 'so\'rov' },
    { text: "AI javobini qaytarish", tag: 'javob' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const Preview = (
    <Col>
      <p className="flow-label">dars oxirida — botingiz o'ylab javob beradi</p>
      <TgChat input={false} minH={0}>
        <Bubble from="user">Vegetarianlar uchun nima bor?</Bubble>
        <Bubble from="bot">Margarita to'liq vegetarian — pomidor, pishloq, rayhon 🌿 Buyurtma beraylikmi?</Bubble>
      </TgChat>
      <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>Tayyor javob emas — AI har savolni tushunib, system prompt asosida yangi javob yozadi. Mana shuni quramiz.</p></div>
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
        <div className="head"><h2 className="title h-title fade-up">Botingizga <span className="italic" style={{ color: T.accent }}>o'ylaydigan miya</span> beramiz.</h2></div>
        <Mentor>Hozirgacha botingiz refleks bilan ishladi: trigger → tayyor action. Bugun unga <b style={{ color: T.ink }}>AI miya</b> ulaymiz — endi u tushunadi va o'ylab javob yozadi. Mana natija va 4 qadam.</Mentor>
        {!isNarrow ? <Split>{Preview}{StepsB}</Split>
          : !showSteps ? <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>{Preview}<button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>4 qadamni ko'rish</button></div>
            : <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}><button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ Natijani ko'rish</button>{StepsB}</div>}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — RULE-BOT vs AI-BOT =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const ROWS = [
    { id: 'how', k: 'Qanday javob beradi?', rule: 'if/else — tayyor javoblar', ai: "o'ylab, yangi javob yozadi" },
    { id: 'new', k: 'Kutilmagan savol', rule: '"Tushunmadim" deydi', ai: 'tushunadi va javob beradi' },
    { id: 'tone', k: 'Ohang / xulq', rule: 'qattiq, o\'zgarmas matn', ai: 'system prompt bilan sozlanadi' },
    { id: 'work', k: 'Kuchli tomoni', rule: 'tez, arzon, aniq', ai: 'moslashuvchan, tabiiy' }
  ];
  const [seen, setSeen] = useState(storedAnswer ? new Set(ROWS.map(r => r.id)) : new Set());
  const [active, setActive] = useState(null);
  const [sc, setSc] = useState(0);
  const done = seen.size >= ROWS.length;
  const tap = (id) => { setActive(id); setSeen(prev => new Set(prev).add(id)); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = ROWS.find(r => r.id === active);
  return (
    <Stage eyebrow="Tushuncha · farq" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `4 farqni ko'ring (${seen.size}/4)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up"><span className="italic" style={{ color: T.accent }}>Rule-bot</span> va <span className="italic" style={{ color: T.accent }}>AI-bot</span> — qaysi biri qachon?</h2></div>
        <Mentor>AI-bot rule-bot'dan yaxshiroq degani emas — ular har xil. Rule-bot tez va aniq, AI-bot moslashuvchan. Har jihatni bosib, farqni ko'ring.</Mentor>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {ROWS.map(r => <button key={r.id} className="gchip" onClick={() => tap(r.id)} style={seen.has(r.id) ? { boxShadow: `inset 0 0 0 1.5px ${T.success}`, color: T.success } : undefined}>{seen.has(r.id) ? '✓ ' : ''}{r.k}</button>)}
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Aqlli yechim: oddiy buyruqlarga rule (tugmalar), erkin savollarga AI. Ko'p bot ikkalasini birga ishlatadi.</p></div>}
          </Col>
          <Col>
            {cur
              ? <div className="fade-step" key={active} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <p className="flow-label">{cur.k}</p>
                  <div className="frame" style={{ borderLeft: `4px solid ${T.ink3}` }}><p className="note-h" style={{ color: T.ink2 }}>🧱 Rule-bot</p><p className="body" style={{ margin: 0, color: T.ink }}>{cur.rule}</p></div>
                  <div className="agent-card"><span className="agent-lbl">🧠 AI-bot</span><p className="agent-msg">{cur.ai}</p></div>
                </div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Jihatni bosing ←</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — ARXITEKTURA: AI qatlami =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(AI_ARCH.map(a => a.id)) : new Set());
  const [active, setActive] = useState(null);
  const [sc, setSc] = useState(0);
  const done = seen.size >= AI_ARCH.length;
  const tap = (id) => { setActive(id); setSeen(prev => new Set(prev).add(id)); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = AI_ARCH.find(a => a.id === active);
  return (
    <Stage eyebrow="Arxitektura" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Yangi qatlamni ko'ring (${seen.size}/4)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Yangi qatlam: bot endi <span className="italic" style={{ color: T.accent }}>AI API</span> bilan gaplashadi.</h2></div>
        <Mentor>O'tgan darsdagi arxitekturaga bitta qatlam qo'shildi: botingiz xabarni <b style={{ color: T.ink }}>AI API'ga</b> (Claude) yuboradi, javobni oladi va foydalanuvchiga qaytaradi. Har qismni bosing.</Mentor>
        <div className="fade-up"><div className="archflow">
          {AI_ARCH.map((a, i) => (
            <React.Fragment key={a.id}>
              {i > 0 && <span className="archflow-arrow">→</span>}
              <div className={`archnode ${seen.has(a.id) ? 'on' : ''} ${a.id === 'ai' ? 'ai' : ''}`}><span className="archnode-ico">{a.ico}</span><span className="archnode-lbl">{a.label}</span></div>
            </React.Fragment>
          ))}
        </div></div>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {AI_ARCH.map(a => <button key={a.id} className="gchip" onClick={() => tap(a.id)} style={seen.has(a.id) ? { boxShadow: `inset 0 0 0 1.5px ${T.success}`, color: T.success } : undefined}>{seen.has(a.id) ? '✓ ' : ''}{a.ico} {a.label}</button>)}
            </div>
          </Col>
          <Col>
            {cur
              ? <div className="sk-info fade-step" key={active}><p className="note-h"><span style={{ fontSize: 18, marginRight: 6 }}>{cur.ico}</span>{cur.label}</p><p className="body" style={{ margin: 0, color: T.ink }}>{cur.desc}</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Qismni bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Endi 2 ta kalit kerak: <span className="mono">BOT_TOKEN</span> (Telegram) va <span className="mono">ANTHROPIC_API_KEY</span> (AI). Ikkalasi ham <span className="mono">.env</span>'da.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 =====
const Screen4 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 1-savol"
    questionText="Rule-bot va AI-bot orasidagi asosiy farq nima?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}><span className="mono" style={{ color: T.accent }}>Rule-bot</span> va <span className="mono" style={{ color: T.accent }}>AI-bot</span> orasidagi asosiy <span className="italic" style={{ color: T.accent }}>farq</span>?</h2></>}
    options={["Rule-bot tayyor javoblardan tanlaydi; AI-bot har savolni o'ylab, yangi javob yozadi", "Hech qanday farqi yo'q — ikkalasi bir xil", "AI-bot internetsiz, rule-bot internetda ishlaydi", "Rule-bot faqat rasm yuboradi"]} correctIdx={0}
    explainCorrect="To'g'ri! Rule-bot faqat siz oldindan yozgan javoblarni biladi (trigger → tayyor action). AI-bot esa xabarni tushunib, AI yordamida yangi javob yozadi — shuning uchun kutilmagan savollarga ham javob beradi."
    explainWrong={{
      1: "Farq katta: rule-bot tayyor javoblar, AI-bot o'ylab yozadi.",
      2: "Ikkalasi ham internetda ishlaydi (AI-bot AI API'ga ulanadi). Farq — javobni qanday hosil qilishida.",
      3: "Rule-bot ham matn, tugma — har narsa yubora oladi. Farq — javobni o'ylab yozadimi yoki tayyormi.",
      default: "Rule-bot tayyor javoblar; AI-bot o'ylab yozadi."
    }} />
);

// ===== SCREEN 5 — KOD: AI'ga so'rov =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(CODE_PARTS.map(p => p.id)) : new Set());
  const [active, setActive] = useState(null);
  const [sc, setSc] = useState(0);
  const done = seen.size >= CODE_PARTS.length;
  const tap = (id) => { setActive(id); setSeen(prev => new Set(prev).add(id)); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = CODE_PARTS.find(p => p.id === active);
  return (
    <Stage eyebrow="Kod · AI so'rovi" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `5 qismni oching (${seen.size}/5)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bot xabarni AI'ga shunday <span className="italic" style={{ color: T.accent }}>yuboradi</span>.</h2></div>
        <Mentor>Mana o'tgan darsdagi <span className="mono">bot.on('text')</span> handleri — endi ichida AI'ga so'rov bor. Pastdagi qismlarni bosib, har biri nima qilishini oching. Hammasi tanish bo'lsin — yozishni AI bilan birga qilasiz.</Mentor>
        <div className="split">
          <Col>
            <CodeFile name="ai-bot.ts" minH={170}>
              <Kw>bot</Kw>{'.'}<At>on</At>{'('}<St>'text'</St>{', '}<Kw>async</Kw>{' ('}<Kw>ctx</Kw>{') => {'}{'\n'}
              {'  '}<Kw>const</Kw>{' res = '}<Kw>await</Kw>{' ai.'}<At>messages</At>{'.'}<At>create</At>{'({'}{'\n'}
              {'    '}<At>model</At>{': '}<St>'claude-opus-4-8'</St>{','}{'\n'}
              {'    '}<At>max_tokens</At>{': 1024,'}{'\n'}
              {'    '}<At>system</At>{': '}<St>"Sen AvtoPizza yordamchisisan."</St>{','}{'\n'}
              {'    '}<At>messages</At>{': [{ '}<At>role</At>{': '}<St>'user'</St>{', '}<At>content</At>{': '}<Kw>ctx</Kw>{'.message.text }]'}{'\n'}
              {'  })'}{'\n'}
              {'  '}<Kw>ctx</Kw>{'.'}<At>reply</At>{'(res.content[0].text)'}{'\n'}
              {'})'}
            </CodeFile>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {CODE_PARTS.map(p => <button key={p.id} className="gchip" onClick={() => tap(p.id)} style={seen.has(p.id) ? { boxShadow: `inset 0 0 0 1.5px ${T.success}`, color: T.success } : undefined}>{seen.has(p.id) ? '✓ ' : ''}<span className="mono">{p.tok.split(':')[0].split('(')[0]}</span></button>)}
            </div>
          </Col>
          <Col>
            {cur
              ? <div className="sk-info fade-step" key={active}><p className="note-h"><span className="mono" style={{ color: T.accent, fontSize: 12 }}>{cur.tok}</span></p><p className="body" style={{ margin: 0, color: T.ink }}>{cur.desc}</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Kod qismini bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Xabar keldi → AI'ga yuborildi (system + xabar) → AI javob yozdi → <span className="mono">ctx.reply</span> bilan qaytdi. Eng muhim qism — <b>system</b>.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 6 — system prompt = xulq =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [show, setShow] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = show;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Tushuncha · system" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Misolni ko'ring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up"><span className="mono" style={{ color: T.accent }}>system prompt</span> — botning <span className="italic" style={{ color: T.accent }}>shaxsi va xulqi</span>.</h2></div>
        <Mentor><b style={{ color: T.ink }}>system prompt</b> — bu AI'ga bergan "ish yo'riqnomasi": kim bo'lishi, qanday gapirishi, nimaga ruxsat borligi. Aynan shu yerda botning xulqini <b style={{ color: T.ink }}>sozlaysiz</b>. Tugmani bosing.</Mentor>
        <div className="split">
          <Col>
            <PromptCard who="system prompt — namuna">Sen AvtoPizza'ning samimiy yordamchisisan. Faqat pizza va buyurtma haqida gaplash. Qisqa, iliq javob ber, emoji ishlat. Narxni so'rashsa, menyuga yo'naltir.</PromptCard>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={show} onClick={() => { setShow(true); setSc(n => n + 1); }}>{show ? '✓ Ko\'rdingiz' : "Bu nimani belgilaydi?"}</button>
          </Col>
          <Col>
            {show ? <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>👤 <b>Kim:</b> AvtoPizza yordamchisi</p></div>
              <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>🗣 <b>Qanday:</b> samimiy, qisqa, emoji bilan</p></div>
              <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>🚧 <b>Chegara:</b> faqat pizza haqida (boshqa mavzuga ketmaydi)</p></div>
            </div> : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tugmani bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>system prompt'ni o'zgartirsangiz — botning butun xulqi o'zgaradi. Keyingi ekranda buni o'z ko'zingiz bilan ko'rasiz.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — SIGNATURE: system prompt laboratoriyasi =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [active, setActive] = useState(null);
  const [tried, setTried] = useState(storedAnswer ? new Set(PERSONAS.map(p => p.id)) : new Set());
  const [phase, setPhase] = useState('idle'); // idle → think → show
  const [sc, setSc] = useState(0);
  const done = tried.size >= 2;
  const fired = useRef(!!storedAnswer);
  useEffect(() => { if (done && !fired.current) { fired.current = true; onAnswer(screen, { correct: true, picked: true }); } }, [done]);
  const pick = (id) => {
    setActive(id); setPhase('think'); setTried(prev => new Set(prev).add(id)); setSc(n => n + 1);
    setTimeout(() => { setPhase('show'); setSc(n => n + 1); }, 1000);
  };
  const cur = PERSONAS.find(p => p.id === active);
  return (
    <Stage eyebrow="Laboratoriya · system" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `2+ xulqni sinab ko'ring (${tried.size}/3)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bitta savol, uch xil xulq. <span className="italic" style={{ color: T.accent }}>system prompt</span> qanday o'zgartirishini ko'ring.</h2></div>
        <Mentor>Pastdagi xulqni tanlang — bot <b style={{ color: T.ink }}>aynan bir xil savolga</b> ("Salom, nima bor?") system prompt'ga qarab boshqacha javob beradi. Kamida 2 ta xulqni sinab ko'ring.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">botning xulqini tanlang (system prompt)</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {PERSONAS.map(p => <button key={p.id} className={`pick-row ${active === p.id ? 'sel' : ''} ${tried.has(p.id) ? 'done-row' : ''}`} onClick={() => pick(p.id)}><span style={{ flex: 1 }}>{p.label}</span><span className="pick-plus">{tried.has(p.id) ? '✓' : '▶'}</span></button>)}
            </div>
            {cur && <PromptCard who="tanlangan system prompt" tone="live">{cur.sys}</PromptCard>}
          </Col>
          <Col>
            <p className="flow-label">AI-bot javobi</p>
            <TgChat input={false} minH={120}>
              <Bubble from="user">Salom, nima bor?</Bubble>
              {phase === 'think' && <Bubble from="bot" thinking />}
              {phase === 'show' && cur && <Bubble from="bot" key={cur.id}>{cur.reply}</Bubble>}
              {phase === 'idle' && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: '6px 2px' }}>Chapdan xulqni tanlang ←</p>}
            </TgChat>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bir xil savol, bir xil AI — lekin <b>system prompt</b> javobni butunlay o'zgartirdi. Mana shu — "xulqni sozlash".</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — TEST 2 =====
const Screen8 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 2-savol"
    questionText="system prompt nima qiladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}><span className="mono" style={{ color: T.accent }}>system prompt</span> nima <span className="italic" style={{ color: T.accent }}>qiladi</span>?</h2></>}
    options={["Botning xulqini sozlaydi — kim bo'lishi, qanday gapirishi, nimaga ruxsat borligi", "Botning rangini o'zgartiradi", "Foydalanuvchining xabarini o'chiradi", "Internetni tezlashtiradi"]} correctIdx={0}
    explainCorrect="To'g'ri! system prompt AI'ga «sen kimsan va qanday gaplashasan» deb aytadi. Uni o'zgartirsangiz — botning butun xulqi (ohang, chegara, rol) o'zgaradi. Bu — xulqni sozlash."
    explainWrong={{
      1: "Rang bilan aloqasi yo'q — system prompt botning xulqi va shaxsini belgilaydi.",
      2: "Foydalanuvchi xabari messages'da bo'ladi. system esa botning xulqini belgilaydi.",
      3: "Internet tezligiga aloqasi yo'q. system prompt — botning ish yo'riqnomasi.",
      default: "system prompt botning xulqini (rol, ohang, chegara) sozlaydi."
    }} />
);

// ===== SCREEN 9 — AI-BOT CHEGARASI (agent setup) =====
const Screen9 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [show, setShow] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = show;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Chegara · muhim" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Haqiqatni ko'ring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Diqqat: AI-bot <span className="italic" style={{ color: T.accent }}>faqat gapiradi</span> — amal qilmaydi.</h2></div>
        <Mentor>Bu juda muhim tushuncha. AI-bot chiroyli javob yozadi, lekin u <b style={{ color: T.ink }}>matndan boshqa hech narsa qilmaydi</b>: bazaga yozmaydi, buyurtmani saqlamaydi. Tugmani bosib, haqiqatni ko'ring.</Mentor>
        <div className="split">
          <Col>
            <TgChat input={false} minH={120}>
              <Bubble from="user">Buyurtmamni saqlab qo'y!</Bubble>
              <Bubble from="bot">Albatta, saqladim ✅ Tez orada yetkazamiz!</Bubble>
            </TgChat>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={show} onClick={() => { setShow(true); setSc(n => n + 1); }}>{show ? '✓ Ko\'rdingiz' : "Rostan saqladimi? 🤔"}</button>
          </Col>
          <Col>
            {show ? <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>❌ <b>Aslida hech narsa saqlanmadi!</b> AI faqat "saqladim" degan <b>matn</b> yozdi. Bazaga (DB) hech narsa yozilmadi, API chaqirilmadi. AI-bot — reaktiv: xabar kiradi → matn chiqadi, vassalom.</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tugmani bosing ←</p></div>}
            {done && <div className="agent-card fade-step"><span className="agent-lbl">📍 KEYINGI BOSQICH — AI-AGENT</span><p className="agent-msg">AI-bot faqat <b>gapiradi</b>. <b>AI-agent</b> esa o'ylab <b>amal ham qiladi</b>: bazaga yozadi, API chaqiradi, qadamlar bajaradi (idrok → qaror → amal). Buni keyingi darsda quramiz.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 10 — FALSAFA: system prompt = ish yo'riqnomasi =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [show, setShow] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = show;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Falsafa · direktor" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "To'g'ri yo'riqnomani ko'ring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">system prompt — sizning <span className="italic" style={{ color: T.accent }}>AI ishchingizga</span> bergan yo'riqnomangiz.</h2></div>
        <Mentor>Siz direktorsiz, AI — ishchi. Aniq yo'riqnoma (system prompt) bersangiz — aniq xulq olasiz. Noaniq bersangiz — bot adashadi. Tugmani bosing.</Mentor>
        <div className="split">
          <Col>
            <div className="frame" style={{ borderLeft: `4px solid ${T.danger}` }}>
              <p className="note-h" style={{ color: T.danger }}>🙈 Noaniq yo'riqnoma</p>
              <p className="body mono" style={{ margin: 0, color: T.ink, fontSize: 12 }}>"Sen yordamchisan."</p>
              <p className="body" style={{ margin: '8px 0 0', color: T.ink }}>→ Bot har mavzuda gaplashadi, ohangi tasodifiy, chegarasi yo'q.</p>
            </div>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={show} onClick={() => { setShow(true); setSc(n => n + 1); }}>{show ? '✓ Ko\'rdingiz' : "Aniq yo'riqnoma-chi?"}</button>
          </Col>
          <Col>
            {show
              ? <div className="agent-card fade-step" style={{ borderLeftColor: T.success }}>
                  <span className="agent-lbl" style={{ color: T.success }}>🎯 ANIQ YO'RIQNOMA</span>
                  <p className="agent-msg" style={{ fontFamily: "'JetBrains Mono'", fontSize: 12, marginBottom: 8 }}>"Sen AvtoPizza yordamchisisan. Faqat pizza haqida gaplash. Qisqa, samimiy, emoji bilan. Boshqa mavzuга 'men faqat pizza bo'yicha yordam beraman' deb javob ber."</p>
                  <p className="agent-msg">→ Bot aniq rol, ohang va chegara bilan ishlaydi. Siz test qilib, sozlab borasiz.</p>
                </div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tugmani bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Yaxshi AI-bot = yaxshi system prompt. Uni yozasiz, test qilasiz, javoblar yoqmasa — aniqlashtirasiz. Bu ham direktorlik.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — TEST 3 (AI-bot chegarasi) =====
const Screen11 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="AI-bot 'saqladim' desa, ma'lumot rostan saqlanadimi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>AI-bot <span className="italic" style={{ color: T.accent }}>"saqladim"</span> desa, ma'lumot rostan saqlanadimi?</h2></>}
    options={["Yo'q — AI faqat matn yozadi; bazaga yozish uchun alohida kod (yoki agent) kerak", "Ha, AI hamma narsani avtomatik saqlaydi", "Ha, system prompt buni o'zi qiladi", "Faqat rasmiy system prompt bo'lsa saqlaydi"]} correctIdx={0}
    explainCorrect="To'g'ri! AI-bot reaktiv: u faqat javob MATNINI yozadi. «Saqladim» desa ham, aslida DB'ga hech narsa yozilmaydi — buning uchun alohida kod yoki AI-agent kerak. AI-bot gapiradi, amal qilmaydi."
    explainWrong={{
      1: "Yo'q — AI faqat matn ishlab chiqaradi. Saqlash uchun siz kod yozishingiz (yoki agent qurish) kerak.",
      2: "system prompt faqat xulqni belgilaydi, amal qilmaydi. Saqlash — alohida ish.",
      3: "Ohangdan qat'i nazar, AI-bot hech narsa saqlamaydi — u faqat javob yozadi.",
      default: "AI-bot faqat matn yozadi; amalni alohida kod/agent qiladi."
    }} />
);

// ===== SCREEN 12 — CASE: AvtoPizza AI-bot =====
const Screen12 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const STEPS = [
    { u: 'Salom! Och qornimga nima maslahat berasiz? 😅', b: "Salom! 😊 Och bo'lsangiz to'yimli Pepperoni zo'r — go'shtli va mazali 🍕 Yoki klassik Margarita?" },
    { u: "Achchiq narsa yoqmaydi menga", b: "Unda Margarita aynan siz uchun — umuman achchiq emas, yumshoq pishloqli 🧀 Olib beraymi?" },
    { u: 'Ha, bittasini olaman', b: "Zo'r tanlov! 🎉 Margarita tanlandi. Manzilingizni yuborsangiz, buyurtmani rasmiylashtiramiz 📍" }
  ];
  const [shown, setShown] = useState(storedAnswer ? STEPS.length : 0);
  const [phase, setPhase] = useState(storedAnswer ? 'idle' : 'idle');
  const [sc, setSc] = useState(0);
  const done = shown >= STEPS.length;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const advance = () => {
    if (phase === 'think') return;
    setPhase('think'); setSc(n => n + 1);
    setTimeout(() => { setShown(n => Math.min(n + 1, STEPS.length)); setPhase('idle'); setSc(n => n + 1); }, 850);
  };
  return (
    <Stage eyebrow="Hayotiy · AI-bot" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Suhbatni davom ettiring (${shown}/3)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Erkin suhbat — AI-bot har savolga <span className="italic" style={{ color: T.accent }}>tabiiy</span> javob beradi.</h2></div>
        <Mentor>Mijoz hech qanday tugma bosmaydi — shunchaki gaplashadi. AI-bot system prompt asosida har gapni tushunib, tabiiy javob beradi. Tugmani bosib suhbatni davom ettiring.</Mentor>
        <div className="split">
          <Col>
            <TgChat minH={200} input={false}>
              {STEPS.slice(0, shown).map((s, i) => (
                <React.Fragment key={i}>
                  <Bubble from="user">{s.u}</Bubble>
                  <Bubble from="bot">{s.b}</Bubble>
                </React.Fragment>
              ))}
              {phase === 'think' && <Bubble from="bot" thinking />}
              {shown === 0 && phase !== 'think' && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: '6px 2px' }}>Tugmani bosing — mijoz yozadi.</p>}
            </TgChat>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={done || phase === 'think'} onClick={advance}>{done ? '✓ Buyurtma yo\'lga qo\'yildi' : shown === 0 ? '▶ Suhbatni boshlash' : 'Keyingi savol →'}</button>
          </Col>
          <Col>
            <div className="sk-info"><p className="note-h">🧠 Har javob ortida</p><p className="body" style={{ margin: 0, color: T.ink }}>Bot mijoz gapini AI'ga yuboradi → AI system prompt'ni eslab (samimiy, faqat pizza) tabiiy javob yozadi → ctx.reply qaytaradi.</p></div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Hech bir javob oldindan kodlanmagan — AI har gapni tushunib o'zi yozdi. Mana AI-bot kuchi. (Eslang: buyurtmani saqlash uchun hali kod kerak — buni keyingi darsda quramiz.)</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 13 — XAVFSIZLIK + XARAJAT + ko'prik =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [done, setDone] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Amalda · 2 nuqta" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Tushunding ✓"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">AI ulashdan oldin — <span className="italic" style={{ color: T.accent }}>2 ta</span> amaliy nuqta.</h2></div>
        <Mentor>AI-bot zo'r, lekin ikki narsani yodda tuting: kalit xavfsizligi va xarajat.</Mentor>
        <div className="split">
          <Col>
            <div className="sk-info"><p className="note-h">🔑 1. API kalit — .env'da</p><p className="body" style={{ margin: 0, color: T.ink }}><span className="mono">ANTHROPIC_API_KEY</span> ham token kabi maxfiy — <span className="mono">.env</span>'da saqlanadi, kodda ochiq emas, git'ga tushmaydi (o'tgan darsdagi qoida).</p></div>
            <div className="sk-info"><p className="note-h">💰 2. Har so'rov — xarajat</p><p className="body" style={{ margin: 0, color: T.ink }}>AI'ga har murojaat ozgina pul/token sarflaydi. Shuning uchun oddiy ishlarni (tugmalar) rule bilan, faqat erkin savollarni AI bilan qiling.</p></div>
            <button className="btn-soft" style={{ alignSelf: 'flex-start' }} disabled={done} onClick={() => { setDone(true); setSc(n => n + 1); }}>{done ? '✓ Tushundim' : 'Tushundim ✓'}</button>
          </Col>
          <Col>
            <div className="agent-card"><span className="agent-lbl">📍 KEYINGI DARSLAR</span><p className="agent-msg"><b>P3:</b> bot + <b>DB</b> (eslab qoladi) + <b>AI</b> (o'ylaydi) + <b>hosting</b> — to'liq mini-loyiha. <b>P5:</b> AI-agent — bot endi gapiribgina qolmay, <b>amal</b> ham qiladi.</p></div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bugun: botingiz o'ylaydigan bo'ldi. Keyin: eslab qoladi va amal qiladi.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — TEST 4 =====
const Screen14 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 4-savol"
    questionText="ANTHROPIC_API_KEY ni qayerda saqlash kerak?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}><span className="mono" style={{ color: T.accent }}>ANTHROPIC_API_KEY</span> ni qayerda <span className="italic" style={{ color: T.accent }}>saqlash</span> kerak?</h2></>}
    options={[".env faylda — bot tokeni kabi maxfiy, git'ga tushmasligi kerak", "To'g'ridan-to'g'ri kodda — qulay bo'ladi", "Foydalanuvchiga chatda yuborib qo'yaman", "Hech qayerda — AI usiz ham ishlaydi"]} correctIdx={0}
    explainCorrect="To'g'ri! AI API kaliti ham bot tokeni kabi maxfiy — .env faylda saqlanadi va git'ga tushmaydi. Aks holda boshqalar sizning hisobingizdan AI'ni ishlatib, pulingizni sarflaydi."
    explainWrong={{
      1: "Kodda ochiq kalit git'ga tushadi va o'g'irlanadi. .env ishlating (o'tgan darsdagi qoida).",
      2: "Kalitni hech kimga bermaysiz! U sizning maxfiy hisob kalitingiz.",
      3: "AI API kalitsiz ishlamaydi — u sizning hisobingizni taniydi. .env'da saqlang.",
      default: "API kalit .env faylda, maxfiy saqlanadi."
    }} />
);

// ===== SCREEN 15 — YAKUNIY: AI-bot oqimini yig'ish =====
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
      onAnswer(screen, { stage: 'final', screenIdx: screen, question: "AI-bot oqimini to'g'ri tartibda joylang", correct: true, firstAttemptCorrect: true, solved: true, picked: FLOW_ORDER.join(' → ') });
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
        <div className="head"><h2 className="title h-title fade-up">Oxirgi qadam: AI-bot oqimini <span className="italic" style={{ color: T.accent }}>to'g'ri tartibda</span> yig'ing.</h2></div>
        <Mentor>Xabar kelganda nima sodir bo'ladi? Tartibni eslang: xabar keladi, AI'ga yuboriladi, AI o'ylaydi, javob qaytadi, foydalanuvchiga boradi. To'g'ri qadamni o'ng tomondan tanlang.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">AI-bot oqimi (siz yig'yapsiz)</p>
            {placed.length === 0
              ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Hali bo'sh — o'ng tomondan tanlang →</p></div>
              : <div className="cyc fade-step">
                  {placed.map((id, i) => { const f = flowById(id); return <React.Fragment key={id}>{i > 0 && <span className="cyc-arrow on">→</span>}<div className="cyc-node done"><span className="cyc-ico">{f.ico}</span><span className="cyc-lbl">{f.label}</span></div></React.Fragment>; })}
                </div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Oqim tayyor: <b>Xabar → AI'ga → o'ylaydi → javob → ctx.reply</b>. Mana AI-botning butun ishlash sxemasi.</p></div>}
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
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — YAKUN =====
const Screen16 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const RECAP = [
    "AI-bot rule-bot'dan farqi: o'ylab javob yozadi, tayyor javob emas",
    "Arxitektura: Foydalanuvchi → Bot → AI API (Claude) → javob → foydalanuvchi",
    "AI'ga so'rov: ai.messages.create({ model, system, messages })",
    "system prompt — botning xulqini (rol, ohang, chegara) sozlaydi",
    "AI-bot faqat MATN yozadi — amal qilmaydi (saqlash/API uchun kod yoki agent kerak)"
  ];
  const HOMEWORK = [
    { b: 'Ulang', t: "— o'z botingizga AI API'ni ulang (@anthropic-ai/sdk, kalit .env'da)" },
    { b: 'Yozing', t: "— botingiz uchun aniq system prompt yozing: kim, qanday ohang, qaysi chegara" },
    { b: 'Sinang', t: "— bir savolga 2 xil system prompt bilan javob oling va farqni ko'ring" }
  ];
  const GLOSSARY = [
    { b: 'AI-bot', t: '— AI bilan o\'ylab javob beradigan bot' },
    { b: 'rule-bot', t: '— tayyor javoblar beradigan bot' },
    { b: 'AI API', t: '— botning tashqi miyasi (Claude)' },
    { b: 'system prompt', t: '— botning xulqi/shaxsi yo\'riqnomasi' },
    { b: 'messages', t: '— foydalanuvchi xabari AI uchun' },
    { b: 'reaktiv', t: '— faqat javob beradi, amal qilmaydi' },
    { b: 'ANTHROPIC_API_KEY', t: '— AI kaliti (.env\'da)' },
    { b: 'AI-agent', t: '— o\'ylab amal ham qiladigan bot' }
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
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">✓</span> Botingizga AI miya uladingiz</span><h2 className="title h-title fade-up d1">Endi botingiz <span className="italic" style={{ color: T.accent }}>o'ylab</span> javob beradi.</h2><p className="body h-sub fade-up d2">{PASSED ? "Tabriklaymiz! AI-bot arxitekturasini, ai.messages.create kodini va system prompt bilan xulqni sozlashni o'rgandingiz." : "Yaxshi harakat! system prompt va AI-bot chegarasi (faqat gapiradi) bo'limlarini qayta ko'ring."}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span className="tick" style={{ width: 16, height: 16, borderRadius: '50%', background: T.success, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck">✓</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>📝 Uyga vazifa</div><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">🚀 Keyingi dars — Mini-loyiha: bot + DB + AI + hosting birga, to'liq ishlaydigan mahsulot!</p></div>
        </div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">💡 Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function BotAiBrainLesson({ lang: langProp, onFinished }) {
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
        .vlbl { font-family: 'Manrope'; font-weight: 700; font-size: 13.5px; color: ${T.ink}; }
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

        /* ===== ARXITEKTURA OQIMI ===== */
        .archflow { display: flex; align-items: center; flex-wrap: wrap; gap: 5px; padding: 4px 0; }
        .archnode { display: flex; flex-direction: column; align-items: center; gap: 3px; background: ${T.paper}; border-radius: 11px; padding: 10px 10px; min-width: 84px; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.16); transition: all 0.25s; }
        .archnode.on { box-shadow: inset 0 0 0 1.5px ${T.success}, 0 6px 16px -6px rgba(31,122,77,0.26); background: ${T.successSoft}; }
        .archnode.ai { min-width: 96px; }
        .archnode.ai.on { box-shadow: inset 0 0 0 1.5px ${T.blue}, 0 6px 16px -6px rgba(1,154,203,0.26); background: ${T.blueSoft}; }
        .archnode-ico { font-size: 19px; line-height: 1; }
        .archnode-lbl { font-family: 'Manrope'; font-weight: 700; font-size: 10px; color: ${T.ink}; text-align: center; }
        .archflow-arrow { color: ${T.ink3}; font-weight: 700; font-size: 15px; }

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
