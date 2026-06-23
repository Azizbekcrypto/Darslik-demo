import React, { useState, useEffect, useRef, createContext, useContext, useCallback, useMemo } from 'react';
import mentorImg from '../../assets/common/mentor.png';

// ============================================================
// BOTLAR VA AVTOMATIZATSIYA MODULI · DARS 2 — TELEGRAM BOT API + TUGMALAR — PLATFORM STANDARD v16 (AUDIOSIZ)
// Maqsad: o'quvchi botni qanday yaratishni (BotFather → token), arxitekturani (NestJS + Telegraf),
//         /start handler, ctx, inline va reply tugmalarni tushunadi. trigger → action endi KODDA.
// Davomi: Dars 1 (trigger → action sxemasi). Endi shu sxemani tirik Telegraf kodida quramiz.
// Falsafa: SIZ — DIREKTOR, AI — ISHCHI. Kodni AI yozadi, lekin siz har qismni tushunib, tekshirasiz.
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

const LESSON_META = { lessonId: 'bot-api-buttons-v1', lessonTitle: { uz: 'Telegram Bot API + tugmalar', ru: 'Telegram Bot API и кнопки' } };
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

// ===== TELEGRAM CHAT (realistik ko'rinish) =====
const TgChat = ({ title = 'AvtoPizza bot', sub = 'bot · onlayn', ava = '🤖', verified, children, replyKb, input = true, minH }) => (
  <div className="tg">
    <div className="tg-head">
      <span className="tg-ava">{ava}</span>
      <span className="tg-name">{title}{verified && <span className="tg-badge">✓</span>}<span className="tg-status">{sub}</span></span>
    </div>
    <div className="tg-body" style={{ minHeight: minH }}>{children}</div>
    {replyKb && <div className="tg-replykb">{replyKb.map((row, ri) => <div key={ri} className="tg-replykb-row">{row.map((b, bi) => <span key={bi} className="tg-replykb-btn" onClick={b.onClick}>{b.label}</span>)}</div>)}</div>}
    {input && <div className="tg-input"><span className="tg-input-field">{replyKb ? 'Tugmani tanlang…' : 'Xabar yozing…'}</span><span className="tg-send">➤</span></div>}
  </div>
);
const Bubble = ({ from = 'bot', children, inline }) => (
  <div className={`tg-bubble-wrap ${from}`}>
    <div className={`tg-bubble ${from} el-in`}>{children}</div>
    {inline && <div className="tg-inline el-in">{inline.map((row, ri) => <div key={ri} className="tg-inline-row">{row.map((b, bi) => <span key={bi} className="tg-inline-btn" onClick={b.onClick}>{b.label}</span>)}</div>)}</div>}
  </div>
);

// ===== BOTFATHER SUHBATI =====
const FAKE_TOKEN = '7843129005:AAH9zK_mQ2vNqL8xQ';
const BF_STEPS = [
  { u: '/newbot', b: "Salom! Yangi bot yaratamiz. Botingizga qanday nom (ko'rinadigan ism) qo'yamiz?" },
  { u: 'AvtoPizza', b: "Yaxshi tanlov. Endi bot uchun username tanlang — u majburiy ravishda 'bot' bilan tugashi kerak." },
  { u: 'avto_pizza_bot', b: "Tabriklayman! 🎉 Botingiz tayyor. Mana uning tokeni (maxfiy kalit) — uni hech kimga bermang:" }
];

// ===== NESTJS + TELEGRAF STACK =====
const STACK = [
  { id: 'tg', ico: '✈️', label: 'Telegram', desc: "Foydalanuvchi xabarlari shu yerda. Tashqi dunyoga Bot API orqali ulanadi." },
  { id: 'telegraf', ico: '📦', label: 'Telegraf', desc: "Node.js kutubxonasi — Bot API bilan gaplashishni o'zi bajaradi (1-darsdagi \"pochtachi\"ni ishlatadi). Siz token berasiz, u ulanadi." },
  { id: 'service', ico: '🧠', label: 'Bot Service', desc: "Botning miyasi — sizning handlerlaringiz: bot.start, bot.hears, bot.action. trigger → action shu yerda yoziladi." },
  { id: 'module', ico: '🧩', label: 'Nest Module', desc: "Servisni Nest ilovasiga ulaydi — xuddi 4-modulda Car / Book resurslari kabi. Tanish, to'g'rimi?" }
];

// ===== HANDLER QISMLARI (kod tahlili) =====
const HANDLER_PARTS = [
  { id: 'start', tok: 'bot.start', desc: "trigger: foydalanuvchi /start buyrug'ini yuborganda ishga tushadi (1-darsdagi trigger — endi kodda)." },
  { id: 'ctx', tok: 'ctx', desc: "\"context\" — kelgan xabar haqida hamma narsa: kim yubordi (ctx.from), matn (ctx.message.text) va javob berish usuli (ctx.reply)." },
  { id: 'reply', tok: 'ctx.reply', desc: "action: botning javobi — foydalanuvchiga xabar qaytaradi. Bu — 1-darsdagi action." }
];

// ===== FINAL: bot.ts qatorlari =====
const BOT_LINES = [
  { id: 'env', label: "const token = process.env.BOT_TOKEN", note: 'token .env\'dan o\'qiladi' },
  { id: 'create', label: "const bot = new Telegraf(token)", note: 'bot yaratiladi (token bilan)' },
  { id: 'start', label: "bot.start((ctx) => ctx.reply('Salom!'))", note: '/start trigger → action' },
  { id: 'action', label: "bot.action('pizza', (ctx) => ctx.reply('🍕'))", note: 'tugma bosilishi → action' },
  { id: 'launch', label: "bot.launch()", note: 'botni ishga tushiradi (kutadi)' }
];
const BOT_ORDER = BOT_LINES.map(l => l.id);
const BOT_SCRAMBLED = ['start', 'launch', 'create', 'action', 'env'];

// ===== SCREEN 0 — HOOK: BotFather'da bot tug'iladi =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [step, setStep] = useState(storedAnswer ? BF_STEPS.length : 0);
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const [sc, setSc] = useState(0);
  const revealed = step >= BF_STEPS.length;
  const OPTS = [
    { id: 'a', label: "Avval chiroyli logo va rang tanlayman" },
    { id: 'b', label: "Tokenni olaman — usiz kodim Telegram bilan gaplasha olmaydi" },
    { id: 'c', label: "Hech narsa — bot allaqachon o'zi ishlaydi" }
  ];
  const advance = () => { setStep(n => Math.min(n + 1, BF_STEPS.length)); setSc(n => n + 1); };
  const pick = (v) => { if (picked !== null || !revealed) return; setPicked(v); setSc(n => n + 1); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: true }); };
  return (
    <Stage eyebrow="Kirish" screen={screen} scrollSignal={sc} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 880 }}>1-darsda botning sxemasini chizdingiz. Lekin u qog'ozda. Haqiqiy bot <span className="italic" style={{ color: T.accent }}>qanday tug'iladi</span>?</h1>
        <Mentor>Telegram'da bot yaratadigan rasmiy bot bor — <b style={{ color: T.ink }}>@BotFather</b>. U bilan suhbatlashib bot ochasiz. Tugmani bosib, butun jarayonni ko'ring.</Mentor>
        <Zoomable><Split>
          <Col>
            <TgChat title="BotFather" sub="rasmiy · bot yaratuvchi" ava="🧙" verified input={false} minH={170}>
              {BF_STEPS.slice(0, step).map((s, i) => (
                <React.Fragment key={i}>
                  <Bubble from="user">{s.u}</Bubble>
                  <Bubble from="bot">{s.b}</Bubble>
                </React.Fragment>
              ))}
              {revealed && <div className="token-bubble el-in"><span className="token-key">🔑</span><span className="token-val mono">{FAKE_TOKEN}</span></div>}
              {step === 0 && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: '6px 2px' }}>Suhbat hali boshlanmagan — tugmani bosing.</p>}
            </TgChat>
            <button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={advance} disabled={revealed}>{revealed ? '✓ Bot yaratildi — token olindi' : step === 0 ? '▶ BotFather bilan suhbat' : `Keyingi qadam (${step}/3)`}</button>
            {revealed && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>3 ta xabar bilan bot tug'ildi — va sizga <b>token</b> berildi. Bu token botning kaliti: kodingiz Telegram bilan aynan shu orqali gaplashadi.</p></div>}
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Bot yaratilгach, birinchi nima muhim?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => {
                const on = picked === o.id;
                return (<button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null || !revealed} style={{ opacity: !revealed ? 0.55 : 1 }} onClick={() => pick(o.id)}><span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span></button>);
              })}
            </div>
            {!revealed && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>Avval BotFather suhbatini oching ←</p>}
            {picked !== null && <p className="hook-ack fade-step">Aynan! <b>Token</b> — eng muhim narsa. Bugun: token olish, uni xavfsiz saqlash, Telegraf bilan botni yozish va <b>tugmalar</b> qo'shishni o'rganamiz.</p>}
          </Col>
        </Split></Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const STEPS = [
    { text: "BotFather → token va uni .env'da saqlash", tag: 'kalit' },
    { text: "Arxitektura: NestJS + Telegraf", tag: 'tuzilma' },
    { text: "/start handler va ctx", tag: 'kod' },
    { text: "Inline va reply tugmalar", tag: 'tugmalar' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const Preview = (
    <Col>
      <p className="flow-label">dars oxirida — shu ishlaydigan botni tushunasiz</p>
      <TgChat input={false} minH={0}>
        <Bubble from="user">/start</Bubble>
        <Bubble from="bot" inline={[[{ label: '🍕 Menyu' }, { label: '🛒 Buyurtma' }], [{ label: 'ℹ️ Biz haqimizda' }]]}>Salom! 👋 AvtoPizza'ga xush kelibsiz. Nima qilamiz?</Bubble>
      </TgChat>
      <div className="sk-info"><p className="body" style={{ margin: 0, color: T.ink }}>/start (trigger) → salom + tugmalar (action). 1-darsdagi sxema — endi tirik Telegraf kodida. Mana shuni quramiz.</p></div>
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
        <div className="head"><h2 className="title h-title fade-up">Endi sxemani <span className="italic" style={{ color: T.accent }}>tirik kodga</span> aylantiramiz.</h2></div>
        <Mentor>1-darsda <b style={{ color: T.ink }}>trigger → action</b>ni tushundingiz. Bugun shuni haqiqiy Telegram botida quramiz: token olamiz, Telegraf'ni Nest bilan ulaymiz, /start handler yozamiz va tugmalar qo'shamiz. Mana natija va 4 qadam.</Mentor>
        {!isNarrow ? (<Zoomable><Split>{Preview}{StepsB}</Split></Zoomable>)
          : !showSteps ? <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>{Preview}<button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>4 qadamni ko'rish</button></div>
            : <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}><button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ Natijani ko'rish</button>{StepsB}</div>}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — TOKEN + .env =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [show, setShow] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = show;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Token · .env" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Xavfsiz usulni ko'ring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Token — botning kaliti. Uni <span className="italic" style={{ color: T.accent }}>qayerda saqlash</span> kerak?</h2></div>
        <Mentor>Token maxfiy. Agar uni to'g'ridan-to'g'ri kodga yozsangiz va git'ga yuborsangiz — <b style={{ color: T.danger }}>hamma ko'radi</b> va botingizni o'g'irlaydi. To'g'ri usulni ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label" style={{ color: T.danger }}>❌ Xato — kodda ochiq</p>
            <CodeFile name="bot.ts" minH={70}>
              <Kw>const</Kw>{' bot = '}<Kw>new</Kw>{' '}<At>Telegraf</At>{'('}<St>'{FAKE_TOKEN}'</St>{')'}{'\n'}
              <Cm>{'// ❌ git\'ga tushadi — hamma o\'qiydi!'}</Cm>
            </CodeFile>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={show} onClick={() => { setShow(true); setSc(n => n + 1); }}>{show ? '✓ Ko\'rdingiz' : "To'g'ri usul qanday?"}</button>
          </Col>
          <Col>
            {show ? <>
              <p className="flow-label" style={{ color: T.success }}>✅ To'g'ri — .env faylda</p>
              <CodeFile name=".env" minH={0}>
                <At>BOT_TOKEN</At>{'='}{FAKE_TOKEN}{'\n'}
                <Cm>{'// .gitignore\'da → git\'ga TUSHMAYDI'}</Cm>
              </CodeFile>
              <CodeFile name="bot.ts" minH={0}>
                <Kw>const</Kw>{' bot = '}<Kw>new</Kw>{' '}<At>Telegraf</At>{'(process.env.'}<At>BOT_TOKEN</At>{')'}{'\n'}
                <Cm>{'// ✅ kod toza, token maxfiy'}</Cm>
              </CodeFile>
            </> : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tugmani bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Token <span className="mono">.env</span>'da yashaydi (4-modulda auth'da ko'rgansiz). Kod undan <span className="mono">process.env.BOT_TOKEN</span> orqali o'qiydi. Token hech qachon git'ga tushmaydi.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — ARXITEKTURA: NestJS + Telegraf =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(STACK.map(s => s.id)) : new Set());
  const [active, setActive] = useState(null);
  const [sc, setSc] = useState(0);
  const done = seen.size >= STACK.length;
  const tap = (id) => { setActive(id); setSeen(prev => new Set(prev).add(id)); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = STACK.find(s => s.id === active);
  return (
    <Stage eyebrow="Arxitektura" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Qatlamlarni ko'ring (${seen.size}/4)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bot kodingiz <span className="italic" style={{ color: T.accent }}>NestJS</span> ichida yashaydi.</h2></div>
        <Mentor>Yodingizdami — 4-modulda NestJS resurslari (Car, Book) qurgansiz. Bot ham xuddi shunday: <b style={{ color: T.ink }}>Telegraf</b> kutubxonasi Telegram bilan gaplashadi, sizning handlerlaringiz esa Nest service ichida yashaydi. Har qatlamni bosing.</Mentor>
        <div className="fade-up"><div className="archflow">
          {STACK.map((s, i) => (
            <React.Fragment key={s.id}>
              {i > 0 && <span className="archflow-arrow">→</span>}
              <div className={`archnode ${seen.has(s.id) ? 'on' : ''}`}><span className="archnode-ico">{s.ico}</span><span className="archnode-lbl">{s.label}</span></div>
            </React.Fragment>
          ))}
        </div></div>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {STACK.map(s => <button key={s.id} className="gchip" onClick={() => tap(s.id)} style={seen.has(s.id) ? { boxShadow: `inset 0 0 0 1.5px ${T.success}`, color: T.success } : undefined}>{seen.has(s.id) ? '✓ ' : ''}{s.ico} {s.label}</button>)}
            </div>
          </Col>
          <Col>
            {cur
              ? <div className="sk-info fade-step" key={active}><p className="note-h"><span style={{ fontSize: 18, marginRight: 6 }}>{cur.ico}</span>{cur.label}</p><p className="body" style={{ margin: 0, color: T.ink }}>{cur.desc}</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Qatlamni bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Siz faqat <b>Bot Service</b>ga handler yozasiz (trigger → action). Telegraf va Telegram aloqasini o'zi hal qiladi. Nest bilimingiz to'g'ridan-to'g'ri ishlaydi.</p></div>}
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
    questionText="Bot tokenini qayerda saqlash to'g'ri?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Bot <span className="mono" style={{ color: T.accent }}>token</span>ini qayerda saqlash <span className="italic" style={{ color: T.accent }}>to'g'ri</span>?</h2></>}
    options={[".env faylda — u .gitignore'da, git'ga tushmaydi va kod toza qoladi", "To'g'ridan-to'g'ri bot.ts kodida — qulay bo'ladi", "README.md faylida — hujjat bilan birga", "Hech qayerda saqlamayman — har safar qaytadan olaman"]} correctIdx={0}
    explainCorrect="To'g'ri! Token .env faylda saqlanadi, u .gitignore'ga qo'shiladi — shuning uchun git'ga (va GitHub'ga) tushmaydi. Kod undan process.env.BOT_TOKEN orqali o'qiydi. Maxfiylik saqlanadi."
    explainWrong={{
      1: "Xavfli — kodda ochiq token git'ga tushadi va hamma ko'radi, botingizni o'g'irlaydi. .env ishlating.",
      2: "README — ochiq hujjat, hamma o'qiydi. Token maxfiy bo'lishi kerak — .env'da saqlang.",
      3: "BotFather tokenni faqat bir marta beradi (yoki qayta tiklash kerak). Uni .env'da xavfsiz saqlash kerak.",
      default: "Token .env faylda saqlanadi — maxfiy va git'ga tushmaydi."
    }} />
);

// ===== SCREEN 5 — /start HANDLER =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(HANDLER_PARTS.map(p => p.id)) : new Set());
  const [active, setActive] = useState(null);
  const [sc, setSc] = useState(0);
  const done = seen.size >= HANDLER_PARTS.length;
  const tap = (id) => { setActive(id); setSeen(prev => new Set(prev).add(id)); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = HANDLER_PARTS.find(p => p.id === active);
  return (
    <Stage eyebrow="Kod · /start" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `3 qismni oching (${seen.size}/3)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Birinchi handler: <span className="italic" style={{ color: T.accent }}>/start</span> kelganda bot javob bersin.</h2></div>
        <Mentor>Mana 1-darsdagi "<b style={{ color: T.ink }}>/start → salom</b>" sxemasi tirik kodda. Pastdagi 3 qismni bosib, har biri nima qilishini oching.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <CodeFile name="bot.service.ts" minH={120}>
              <Kw>bot</Kw>{'.'}<At>start</At>{'(('}<Kw>ctx</Kw>{') => {'}{'\n'}
              {'  '}<Kw>ctx</Kw>{'.'}<At>reply</At>{'('}<St>'Salom! 👋'</St>{')'}{'\n'}
              {'})'}
            </CodeFile>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {HANDLER_PARTS.map(p => <button key={p.id} className="gchip" onClick={() => tap(p.id)} style={seen.has(p.id) ? { boxShadow: `inset 0 0 0 1.5px ${T.success}`, color: T.success } : undefined}>{seen.has(p.id) ? '✓ ' : ''}<span className="mono">{p.tok}</span></button>)}
            </div>
          </Col>
          <Col>
            {cur
              ? <div className="sk-info fade-step" key={active}><p className="note-h"><span className="mono" style={{ color: T.accent }}>{cur.tok}</span></p><p className="body" style={{ margin: 0, color: T.ink }}>{cur.desc}</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Kod qismini bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}><span className="mono">bot.start</span> = trigger, <span className="mono">ctx.reply</span> = action. Aynan 1-darsdagi mantiq — faqat endi Telegraf sintaksisida.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 6 — ctx (konvert) =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const FIELDS = [
    { id: 'from', tok: 'ctx.from', val: '{ id: 5012, first_name: "Aziza" }', desc: "Kim yubordi — foydalanuvchi haqida ma'lumot." },
    { id: 'text', tok: 'ctx.message.text', val: '"Salom"', desc: "Foydalanuvchi yuborgan matn." },
    { id: 'reply', tok: 'ctx.reply(...)', val: '→ Telegramga javob', desc: "Javob qaytarish usuli (action)." }
  ];
  const [seen, setSeen] = useState(storedAnswer ? new Set(FIELDS.map(f => f.id)) : new Set());
  const [active, setActive] = useState(null);
  const [sc, setSc] = useState(0);
  const done = seen.size >= FIELDS.length;
  const tap = (id) => { setActive(id); setSeen(prev => new Set(prev).add(id)); setSc(n => n + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = FIELDS.find(f => f.id === active);
  return (
    <Stage eyebrow="Kod · ctx" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `ctx ichini oching (${seen.size}/3)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up"><span className="mono" style={{ color: T.accent }}>ctx</span> — har xabar bilan keladigan <span className="italic" style={{ color: T.accent }}>konvert</span>.</h2></div>
        <Mentor>Har handler'ga <b style={{ color: T.ink }}>ctx</b> (context) keladi — bu signal bilan birga kelgan "konvert": kim yozdi, nima yozdi va qanday javob berish. Ichidagi 3 narsani bosib ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="env-card">
              <p className="flow-label" style={{ marginBottom: 8 }}>✉️ ctx — konvert ichida</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {FIELDS.map(f => <button key={f.id} className={`pick-row ${seen.has(f.id) ? 'picked' : ''} ${active === f.id ? 'sel' : ''}`} onClick={() => tap(f.id)} disabled={false}><span className="mono" style={{ flex: 1 }}>{f.tok}</span><span className="pick-plus">{seen.has(f.id) ? '✓' : '+'}</span></button>)}
              </div>
            </div>
          </Col>
          <Col>
            {cur
              ? <div className="sk-info fade-step" key={active}><p className="note-h"><span className="mono" style={{ color: T.accent }}>{cur.tok}</span></p><p className="mono small" style={{ color: T.success, margin: '0 0 6px' }}>{cur.val}</p><p className="body" style={{ margin: 0, color: T.ink }}>{cur.desc}</p></div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Konvert ichini bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Demak <span className="mono">ctx</span> orqali botingiz kim bilan, nima haqida gaplashayotganini biladi va javob bera oladi. Har handler shu konvert bilan ishlaydi.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — SIGNATURE: inline vs reply tugmalar maydoni =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [mode, setMode] = useState('inline');
  const [tried, setTried] = useState(storedAnswer ? new Set(['inline', 'reply']) : new Set(['inline']));
  const [cb, setCb] = useState(null);
  const [sent, setSent] = useState([]);
  const [sc, setSc] = useState(0);
  const done = tried.size >= 2;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const switchMode = (m) => { setMode(m); setTried(prev => new Set(prev).add(m)); setCb(null); setSc(n => n + 1); };
  const inlineClick = (label, data) => { setCb({ label, data }); setSc(n => n + 1); };
  const replyClick = (label) => { setSent(s => [...s, label]); setSc(n => n + 1); };
  return (
    <Stage eyebrow="Tugmalar · maydon" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Ikkala turni sinab ko'ring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Ikki xil tugma: <span className="italic" style={{ color: T.accent }}>inline</span> va <span className="italic" style={{ color: T.accent }}>reply</span>. Farqini his qiling.</h2></div>
        <Mentor>Yuqoridagi tugmalar bilan rejimni almashtiring va tugmalarni bosib ko'ring. <b style={{ color: T.ink }}>Inline</b> — xabar tagiga yopishadi (callback yuboradi). <b style={{ color: T.ink }}>Reply</b> — pastda klaviatura bo'lib chiqadi (matn yuboradi).</Mentor>
        <div className="seg fade-up">
          <button className={`seg-btn ${mode === 'inline' ? 'on' : ''}`} onClick={() => switchMode('inline')}>🔘 Inline tugmalar {tried.has('inline') && '✓'}</button>
          <button className={`seg-btn ${mode === 'reply' ? 'on' : ''}`} onClick={() => switchMode('reply')}>⌨️ Reply tugmalar {tried.has('reply') && '✓'}</button>
        </div>
        <Zoomable>
        <div className="split">
          <Col>
            {mode === 'inline'
              ? <TgChat key="inline" input={false} minH={150}>
                  <Bubble from="user">/menyu</Bubble>
                  <Bubble from="bot" inline={[[{ label: '🍕 Pizza', onClick: () => inlineClick('🍕 Pizza', 'pizza') }, { label: '🥤 Ichimlik', onClick: () => inlineClick('🥤 Ichimlik', 'drink') }], [{ label: '🛒 Savat', onClick: () => inlineClick('🛒 Savat', 'cart') }]]}>Menyuni tanlang:</Bubble>
                </TgChat>
              : <TgChat key="reply" minH={150} replyKb={[[{ label: '🍕 Pizza', onClick: () => replyClick('🍕 Pizza') }, { label: '🥤 Ichimlik', onClick: () => replyClick('🥤 Ichimlik') }], [{ label: '🛒 Savat', onClick: () => replyClick('🛒 Savat') }]]}>
                  <Bubble from="bot">Tugmani bosing — u xabar bo'lib yuboriladi:</Bubble>
                  {sent.map((s, i) => <Bubble key={i} from="user">{s}</Bubble>)}
                </TgChat>}
          </Col>
          <Col>
            {mode === 'inline' ? <>
              <div className="sk-info"><p className="note-h" style={{ color: T.accent }}>🔘 Inline tugma</p><p className="body" style={{ margin: 0, color: T.ink }}>Xabarning tagiga yopishadi. Bosilganda matn YUBORMAYDI — yashirin <b>callback</b> jo'natadi. Bot uni <span className="mono">bot.action(...)</span> bilan ushlaydi.</p></div>
              {cb ? <div className="frame-success fade-step" key={cb.data}><p className="body mono" style={{ margin: 0, color: T.ink, fontSize: 13 }}>⚡ callback keldi → <b style={{ color: T.success }}>action: '{cb.data}'</b><br />(chat tarixiga yangi xabar qo'shilmadi)</p></div>
                : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Chapdagi inline tugmani bosing ←</p></div>}
            </> : <>
              <div className="sk-info"><p className="note-h" style={{ color: T.accent }}>⌨️ Reply tugma</p><p className="body" style={{ margin: 0, color: T.ink }}>Pastda klaviatura bo'lib chiqadi. Bosilganda u oddiy <b>matn xabar</b> sifatida yuboriladi. Bot uni <span className="mono">bot.hears(...)</span> bilan ushlaydi.</p></div>
              {sent.length > 0 ? <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Ko'rdingizmi — bosilgan tugma <b>foydalanuvchi xabari</b> bo'lib chatga qo'shildi. Inline'da bunday bo'lmagandi.</p></div>
                : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Pastdagi reply tugmani bosing ←</p></div>}
            </>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Qoida: tez tanlov/menyu uchun <b>inline</b>, doimiy klaviatura (asosiy buyruqlar) uchun <b>reply</b> ishlatiladi.</p></div>}
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
    questionText="Inline va reply tugma orasidagi asosiy farq nima?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}><span className="mono" style={{ color: T.accent }}>Inline</span> va <span className="mono" style={{ color: T.accent }}>reply</span> tugma orasidagi asosiy <span className="italic" style={{ color: T.accent }}>farq</span>?</h2></>}
    options={["Inline xabar tagiga yopishib callback yuboradi; reply pastda klaviatura bo'lib matn yuboradi", "Ikkalasi bir xil — faqat rangi farq qiladi", "Inline faqat rasmlar uchun, reply faqat matn uchun", "Inline bepul, reply pullik"]} correctIdx={0}
    explainCorrect="To'g'ri! Inline tugma xabarga yopishadi va yashirin callback (bot.action ushlaydi) yuboradi. Reply tugma pastda klaviatura bo'lib chiqadi va oddiy matn xabar (bot.hears ushlaydi) yuboradi."
    explainWrong={{
      1: "Rang emas — xulq-atvori farq qiladi: inline callback yuboradi, reply matn yuboradi.",
      2: "Ikkalasi ham matn yoki menyu uchun ishlatiladi. Farq — qanday signal yuborishida.",
      3: "Pullik/bepul degan narsa yo'q — ikkalasi ham bepul. Farq — callback vs matn.",
      default: "Inline → callback (yopishgan); reply → matn (pastki klaviatura)."
    }} />
);

// ===== SCREEN 9 — TUGMANI USHLASH: action vs hears =====
const Screen9 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [show, setShow] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = show;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Kod · ushlash" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Ikkala handlerni ko'ring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Tugma bosildi — kod uni <span className="italic" style={{ color: T.accent }}>qanday ushlaydi</span>?</h2></div>
        <Mentor>Tugma bosilishi ham — bu trigger. Lekin inline va reply tugmalar har xil handler bilan ushlanadi. Tugmani bosib ikkalasini solishtiring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">🔘 inline → callback'ni ushlaydi</p>
            <CodeFile name="inline.ts" minH={70}>
              <Kw>bot</Kw>{'.'}<At>action</At>{'('}<St>'pizza'</St>{', ('}<Kw>ctx</Kw>{') => {'}{'\n'}
              {'  '}<Kw>ctx</Kw>{'.'}<At>reply</At>{'('}<St>'🍕 Pizza tanlandi'</St>{')'}{'\n'}
              {'})'}
            </CodeFile>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={show} onClick={() => { setShow(true); setSc(n => n + 1); }}>{show ? '✓ Ko\'rdingiz' : "Reply uchun-chi?"}</button>
          </Col>
          <Col>
            {show ? <>
              <p className="flow-label">⌨️ reply → matnni ushlaydi</p>
              <CodeFile name="reply.ts" minH={70}>
                <Kw>bot</Kw>{'.'}<At>hears</At>{'('}<St>'🍕 Pizza'</St>{', ('}<Kw>ctx</Kw>{') => {'}{'\n'}
                {'  '}<Kw>ctx</Kw>{'.'}<At>reply</At>{'('}<St>'🍕 Pizza tanlandi'</St>{')'}{'\n'}
                {'})'}
              </CodeFile>
            </> : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tugmani bosing ←</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}><span className="mono">bot.action('pizza')</span> — inline callback'ni ushlaydi. <span className="mono">bot.hears('🍕 Pizza')</span> — reply matnni ushlaydi. Ikkalasi ham: trigger → action.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 10 — FALSAFA + hosting bir og'iz =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [show, setShow] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  const done = show;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Falsafa · direktor" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "To'g'ri buyruqni ko'ring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bu kodni <span className="italic" style={{ color: T.accent }}>AI yozadi</span> — lekin buyruqni siz berasiz.</h2></div>
        <Mentor>Endi tushunasiz: handler, ctx, inline, reply, action, hears. Shuning uchun AI'ga <b style={{ color: T.ink }}>aniq</b> buyruq bera olasiz — va u qaytargan kodni o'qib, to'g'ri-noto'g'riligini bilasiz. Tugmani bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="frame" style={{ borderLeft: `4px solid ${T.danger}` }}>
              <p className="note-h" style={{ color: T.danger }}>🙈 Noaniq buyruq</p>
              <p className="body" style={{ margin: 0, color: T.ink }}>"AI, menga tugmali bot yasab ber." → AI nimadir yozdi, lekin inline'mi reply'mi, action'mi hears'mi — bilmaysiz. Buzilsa, tuzata olmaysiz.</p>
            </div>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={show} onClick={() => { setShow(true); setSc(n => n + 1); }}>{show ? '✓ Ko\'rdingiz' : "Aniq buyruq — qanday?"}</button>
          </Col>
          <Col>
            {show
              ? <div className="agent-card fade-step" style={{ borderLeftColor: T.success }}>
                  <span className="agent-lbl" style={{ color: T.success }}>🎯 ANIQ BUYRUQ</span>
                  <p className="agent-msg">"Telegraf'da <b>/start</b>'ga 3 ta <b>inline</b> tugmali menyu chiqaradigan handler yoz. 'pizza' tugmasi uchun <b>bot.action</b> bilan javob qo'sh. Token <b>.env</b>'dan olinsin." → AI yozdi → siz o'qiysiz, tekshirasiz, kerak bo'lsa tuzatasiz.</p>
                </div>
              : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Tugmani bosing ←</p></div>}
            {done && <div className="sk-info fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>💡 <b>Eslatma:</b> <span className="mono">bot.launch()</span> botni "polling" rejimida ishga tushiradi — u sizning kompyuteringizda ishlaydi. Noutbukni yopsangiz — bot to'xtaydi. Doim ishlashi uchun <b>hosting</b> kerak (keyingi darslarda).</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — TEST 3 =====
const Screen11 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="Inline tugma bosilganda kelgan callback'ni qaysi handler ushlaydi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}><span className="mono" style={{ color: T.accent }}>Inline</span> tugma callback'ini qaysi handler <span className="italic" style={{ color: T.accent }}>ushlaydi</span>?</h2></>}
    options={["bot.action('pizza', ...)", "bot.hears('pizza', ...)", "bot.start(...)", "bot.launch('pizza')"]} correctIdx={0}
    explainCorrect="To'g'ri! Inline tugma callback yuboradi — uni bot.action(...) ushlaydi. (Reply tugma esa matn yuboradi va uni bot.hears(...) ushlaydi.)"
    explainWrong={{
      1: "bot.hears matn xabarni (reply tugma) ushlaydi. Inline callback uchun bot.action kerak.",
      2: "bot.start faqat /start buyrug'ini ushlaydi, tugma callback'ini emas.",
      3: "bot.launch() — botni ishga tushiradi, handler emas. Inline uchun bot.action ishlatiladi.",
      default: "Inline callback → bot.action(...) ushlaydi."
    }} />
);

// ===== SCREEN 12 — CASE: AvtoPizza bot kodda =====
const Screen12 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const STEPS = [
    { u: '/start', bot: 'Salom! 👋 AvtoPizza. Nima qilamiz?', inline: [[{ label: '🍕 Menyu' }, { label: '🛒 Savat' }]], code: "bot.start((ctx) => ctx.reply('Salom!', menu))", note: '/start → menyu (inline)' },
    { u: '🍕 Menyu', bot: 'Bizda: Margarita, Pepperoni. Tanlang:', inline: [[{ label: 'Margarita' }, { label: 'Pepperoni' }]], code: "bot.action('menu', (ctx) => ctx.reply('Tanlang…'))", note: 'menyu tugmasi → taomlar' },
    { u: 'Pepperoni', bot: 'Zo\'r! ✅ Buyurtma qabul qilindi. 25 daqiqada yetkazamiz!', inline: null, code: "bot.action('pepperoni', (ctx) => ctx.reply('Qabul!'))", note: 'taom tanlandi → tasdiq' }
  ];
  const [shown, setShown] = useState(storedAnswer ? STEPS.length : 0);
  const [sc, setSc] = useState(0);
  const done = shown >= STEPS.length;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const advance = () => { setShown(n => Math.min(n + 1, STEPS.length)); setSc(n => n + 1); };
  return (
    <Stage eyebrow="Hayotiy · pizza boti" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Suhbatni davom ettiring (${shown}/3)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">1-darsdagi pizza boti — endi <span className="italic" style={{ color: T.accent }}>tirik kodda</span> va tugmalar bilan.</h2></div>
        <Mentor>Chapda — foydalanuvchi ko'radigan chat (tugmalar bilan). O'ngda — har xabar ortida ishlagan kod. Tugmani bosib, ikkalasini birga kuzating.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <TgChat minH={180} input={false}>
              {STEPS.slice(0, shown).map((s, i) => (
                <React.Fragment key={i}>
                  <Bubble from="user">{s.u}</Bubble>
                  <Bubble from="bot" inline={s.inline}>{s.bot}</Bubble>
                </React.Fragment>
              ))}
              {shown === 0 && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: '6px 2px' }}>Tugmani bosing — suhbat boshlanadi.</p>}
            </TgChat>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={done} onClick={advance}>{done ? '✓ Buyurtma yakunlandi' : shown === 0 ? '▶ Suhbatni boshlash' : 'Keyingi qadam →'}</button>
          </Col>
          <Col>
            <p className="flow-label">har qadam ortidagi kod</p>
            {shown > 0 ? <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {STEPS.slice(0, shown).map((s, i) => (
                <div key={i} className="el-in"><CodeFile name={`handler ${i + 1}`} minH={0}><Kw>{s.code.split('(')[0]}</Kw>{'(' + s.code.split('(').slice(1).join('(')}</CodeFile><p className="small" style={{ color: T.ink2, margin: '4px 2px 0' }}>↳ {s.note}</p></div>
              ))}
            </div> : <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Bu yerda kod to'planadi →</p></div>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana — tugmali ishlaydigan bot. 3 ta handler, har biri trigger → action. Siz buni tushunasiz, demak AI bilan istalganini qura olasiz.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 13 — ISHGA TUSHIRISH + T3 ko'prik =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [done, setDone] = useState(!!storedAnswer);
  const [sc, setSc] = useState(0);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Ishga tushirish" screen={screen} scrollSignal={sc} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Cheklovni tushuning"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bot ishladi — lekin u hali hech narsani <span className="italic" style={{ color: T.accent }}>eslab qolmaydi</span>.</h2></div>
        <Mentor><span className="mono">bot.launch()</span> botni ishga tushiradi. Lekin ikki cheklov bor — ularni bilsangiz, keyingi qadamlarga tayyor bo'lasiz.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="sk-info"><p className="note-h">🖥️ 1. Hozircha lokalda (polling)</p><p className="body" style={{ margin: 0, color: T.ink }}><span className="mono">bot.launch()</span> — bot sizning kompyuteringizda ishlaydi. Yopsangiz — to'xtaydi. Doim onlayn bo'lishi uchun <b>hosting</b> kerak (keyingi darslarda).</p></div>
            <div className="sk-info"><p className="note-h">🧠 2. Bot "esi" yo'q</p><p className="body" style={{ margin: 0, color: T.ink }}>Hozir bot har xabarni "birinchi marta"dek qabul qiladi — foydalanuvchini, savatni, suhbat holatini eslamaydi.</p></div>
            <button className="btn-soft" style={{ alignSelf: 'flex-start' }} disabled={done} onClick={() => { setDone(true); setSc(n => n + 1); }}>{done ? '✓ Tushundim' : 'Tushundim ✓'}</button>
          </Col>
          <Col>
            <div className="agent-card"><span className="agent-lbl">📍 KEYINGI DARS</span><p className="agent-msg">Botga <b>xotira</b> beramiz: <b>PostgreSQL</b> bilan foydalanuvchilarni va suhbat holatini saqlaymiz (4-moduldagi DB bilimi ishga tushadi). Bot endi sizni "tanийdigan" bo'ladi.</p></div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bugun: bot tug'ildi, gapira oladi, tugmalari bor. Ertaga: u eslab qoladigan bo'ladi.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — TEST 4 =====
const Screen14 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 4-savol"
    questionText="bot.launch() nima qiladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}><span className="mono" style={{ color: T.accent }}>bot.launch()</span> nima <span className="italic" style={{ color: T.accent }}>qiladi</span>?</h2></>}
    options={["Botni ishga tushiradi — u signallarni kutib, handlerlarga javob bera boshlaydi", "Botni Telegram'dan butunlay o'chiradi", "Yangi token yaratadi", "Saytni internetga deploy qiladi"]} correctIdx={0}
    explainCorrect="To'g'ri! bot.launch() botni ishga tushiradi — u Telegram'dan signallarni kuta boshlaydi va siz yozgan handlerlar (start, action, hears) ishlay boshlaydi. (Lokalda polling rejimida.)"
    explainWrong={{
      1: "Aksincha — launch botni YOQADI, o'chirmaydi. O'chirish boshqa amal (bot.stop).",
      2: "Token BotFather'dan olinadi, launch uni yaratmaydi. launch — botni ishga tushiradi.",
      3: "Deploy — boshqa narsa. bot.launch() faqat botni signal kutadigan holatga keltiradi.",
      default: "bot.launch() botni ishga tushiradi — u signallarni kuta boshlaydi."
    }} />
);

// ===== SCREEN 15 — YAKUNIY: bot.ts'ni to'g'ri tartibda yig'ish =====
const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [placed, setPlaced] = useState(() => (storedAnswer ? [...BOT_ORDER] : []));
  const [shakeId, setShakeId] = useState(null);
  const [hint, setHint] = useState(null);
  const done = placed.length === BOT_ORDER.length;
  const need = BOT_ORDER[placed.length];
  const fired = useRef(!!storedAnswer);
  useEffect(() => {
    if (done && !fired.current) {
      fired.current = true;
      onAnswer(screen, { stage: 'final', screenIdx: screen, question: "bot.ts qatorlarini to'g'ri tartibda joylang", correct: true, firstAttemptCorrect: true, solved: true, picked: BOT_ORDER.join(' → ') });
    }
  }, [done]);
  const lineById = (id) => BOT_LINES.find(l => l.id === id);
  const tap = (id) => {
    if (placed.includes(id) || done) return;
    if (id === need) { setPlaced(p => [...p, id]); setHint(null); }
    else {
      const needL = lineById(need);
      setShakeId(id); setHint(`Hozir emas — avval "${needL.note}" qatori bo'lishi kerak.`);
      setTimeout(() => setShakeId(x => (x === id ? null : x)), 450);
    }
  };
  return (
    <Stage eyebrow="Yakuniy · amaliy" screen={screen} scrollSignal={placed.length} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "bot.ts'ni yig'ing"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Oxirgi qadam: <span className="italic" style={{ color: T.accent }}>bot.ts</span>ni to'g'ri tartibda yig'ing.</h2></div>
        <Mentor>Bot fayli aniq tartibda yoziladi: avval token o'qiladi, bot yaratiladi, handlerlar qo'shiladi va oxirida ishga tushiriladi. To'g'ri qatorni o'ng tomondan tanlang.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">bot.ts (siz yig'yapsiz)</p>
            {placed.length === 0
              ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Hali bo'sh — o'ng tomondan tanlang →</p></div>
              : <CodeFile name="bot.ts" minH={0}>{placed.map((id, i) => <React.Fragment key={id}>{i > 0 ? '\n' : ''}<span style={{ color: CODE.text }}>{lineById(id).label}</span></React.Fragment>)}</CodeFile>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Tayyor bot fayli: token → yaratish → handlerlar → ishga tushirish. Mana shu — to'liq ishlaydigan Telegraf bot.</p></div>}
          </Col>
          <Col>
            <p className="flow-label">qatorni tanlang (keyingisi: {placed.length}/{BOT_ORDER.length})</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {BOT_SCRAMBLED.map(id => {
                const l = lineById(id);
                const isPlaced = placed.includes(id);
                return (
                  <button key={id} className={`pick-row code ${isPlaced ? 'picked' : ''} ${shakeId === id ? 'shake' : ''}`} disabled={isPlaced || done} onClick={() => tap(id)}>
                    <span className="mono" style={{ flex: 1, fontSize: 11.5 }}>{l.label}</span>
                    <span className="pick-plus">{isPlaced ? '✓' : '+'}</span>
                  </button>
                );
              })}
            </div>
            {hint && !done && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>{hint}</p></div>}
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
    "Bot @BotFather orqali yaratiladi va token (maxfiy kalit) oladi",
    "Token .env faylda saqlanadi — git'ga tushmaydi, kod toza qoladi",
    "Arxitektura: Telegram → Telegraf → Bot Service (Nest) — handlerlar shu yerda",
    "/start = trigger, ctx.reply = action; ctx — xabar haqidagi konvert",
    "Inline tugma → callback (bot.action); reply tugma → matn (bot.hears)"
  ];
  const HOMEWORK = [
    { b: 'Yarating', t: "— Telegram'da @BotFather'ga /newbot yuborib, o'z botingizni oching" },
    { b: 'Saqlang', t: "— olgan tokeningizni .env faylga BOT_TOKEN sifatida yozing (hech kimga bermang)" },
    { b: "O'ylang", t: "— botingiz uchun 3 ta tugma o'ylang: qaysilari inline, qaysilari reply bo'ladi?" }
  ];
  const GLOSSARY = [
    { b: 'BotFather', t: '— bot yaratadigan rasmiy Telegram bot' },
    { b: 'token', t: '— botning maxfiy kaliti (.env\'da)' },
    { b: 'Telegraf', t: '— Node.js bot kutubxonasi' },
    { b: 'ctx', t: '— context: xabar haqidagi konvert' },
    { b: 'bot.start', t: '— /start triggerini ushlaydi' },
    { b: 'inline', t: '— xabarga yopishgan tugma (callback)' },
    { b: 'reply', t: '— pastki klaviatura tugmasi (matn)' },
    { b: 'bot.action', t: '— inline callback handleri' },
    { b: 'bot.hears', t: '— matn / reply handleri' },
    { b: 'bot.launch', t: '— botni ishga tushiradi' }
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
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">✓</span> Birinchi tugmali botingizni tushundingiz</span><h2 className="title h-title fade-up d1">Bot endi <span className="italic" style={{ color: T.accent }}>gapira oladi</span> va tugmalari bor.</h2><p className="body h-sub fade-up d2">{PASSED ? "Tabriklaymiz! BotFather, token, Telegraf arxitekturasi, /start, ctx va inline/reply tugmalarni bilib oldingiz." : "Yaxshi harakat! Token saqlash va inline/reply tugma farqini mustahkamlash uchun bir-ikki ekranni qayta ko'ring."}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span className="tick" style={{ width: 16, height: 16, borderRadius: '50%', background: T.success, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck">✓</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>📝 Uyga vazifa</div><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">🚀 Keyingi dars — Stateful logika + PostgreSQL: botga xotira beramiz, foydalanuvchi va suhbat holatini saqlaymiz!</p></div>
        </div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">💡 Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function BotApiButtonsLesson({ lang: langProp, onFinished }) {
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
        .pick-row.code { background: ${CODE.bg}; color: ${CODE.text}; box-shadow: 0 4px 12px -6px rgba(${T.shadowBase},0.26); }
        .pick-row.sel { box-shadow: inset 0 0 0 1.5px ${T.accent}, 0 8px 18px -6px rgba(255,79,40,0.28); background: ${T.accentSoft}; }
        .pick-row.picked { background: ${T.successSoft}; color: ${T.success}; box-shadow: inset 0 0 0 1.5px ${T.success}; cursor: default; }
        .pick-row.code.picked { background: ${T.successSoft}; color: ${T.success}; }
        .pick-row:disabled { cursor: default; }
        .pick-plus { margin-left: auto; font-weight: 700; color: ${T.ink3}; } .pick-row.picked .pick-plus { color: ${T.success}; } .pick-row.sel .pick-plus { color: ${T.accent}; }

        /* AGENT / AI CARD */
        .agent-card { background: ${T.blueSoft}; border-left: 4px solid ${T.blue}; border-radius: 10px; padding: 13px 16px; }
        .agent-lbl { font-family: 'Manrope'; font-weight: 800; font-size: 11px; color: ${T.blue}; display: block; margin-bottom: 5px; letter-spacing: 0.04em; }
        .agent-msg { font-family: 'Manrope'; font-size: clamp(13px,1.5vw,14.5px); color: ${T.ink}; margin: 0; line-height: 1.55; }
        .agent-msg b { color: ${T.ink}; }

        .env-card { background: ${T.paper}; border-radius: 14px; padding: 14px 16px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.14); }

        /* ===== TELEGRAM CHAT (realistik) ===== */
        .tg { border-radius: 16px; overflow: hidden; box-shadow: 0 12px 30px -8px rgba(${T.shadowBase},0.3); border: 1px solid rgba(167,166,162,0.22); }
        .tg-head { background: linear-gradient(180deg,#5A9FD4,#4E8FC0); padding: 10px 14px; display: flex; align-items: center; gap: 10px; }
        .tg-ava { width: 32px; height: 32px; border-radius: 50%; background: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 17px; flex-shrink: 0; }
        .tg-name { font-family: 'Manrope'; font-weight: 700; font-size: 13.5px; color: #fff; display: flex; flex-direction: column; line-height: 1.25; position: relative; }
        .tg-badge { position: absolute; left: -16px; top: 1px; width: 13px; height: 13px; border-radius: 50%; background: #fff; color: #4E8FC0; font-size: 9px; display: inline-flex; align-items: center; justify-content: center; font-weight: 800; }
        .tg-status { font-weight: 500; font-size: 10.5px; color: #DCEBF7; }
        .tg-body { background: #CAD7E0; background-image: radial-gradient(rgba(255,255,255,0.45) 1px, transparent 1px); background-size: 18px 18px; padding: 13px 12px; display: flex; flex-direction: column; gap: 4px; }
        .tg-bubble-wrap { display: flex; flex-direction: column; max-width: 86%; gap: 0; }
        .tg-bubble-wrap.user { align-self: flex-end; align-items: flex-end; }
        .tg-bubble-wrap.bot { align-self: flex-start; align-items: flex-start; }
        .tg-bubble { padding: 8px 12px; border-radius: 14px; font-family: 'Manrope'; font-weight: 500; font-size: clamp(12.5px,1.5vw,14px); line-height: 1.45; box-shadow: 0 1px 2px rgba(0,0,0,0.12); word-break: break-word; margin-bottom: 3px; }
        .tg-bubble.bot { background: #fff; color: #0E0E10; border-bottom-left-radius: 5px; }
        .tg-bubble.user { background: #EFFDDE; color: #0E0E10; border-bottom-right-radius: 5px; }
        .tg-inline { display: flex; flex-direction: column; gap: 4px; width: 100%; margin-bottom: 2px; }
        .tg-inline-row { display: flex; gap: 4px; }
        .tg-inline-btn { flex: 1; text-align: center; background: rgba(255,255,255,0.96); color: #2E78B5; font-family: 'Manrope'; font-weight: 600; font-size: 12px; padding: 9px 8px; border-radius: 9px; cursor: pointer; box-shadow: 0 1px 2px rgba(0,0,0,0.1); transition: all 0.15s; }
        .tg-inline-btn:hover { background: #fff; transform: translateY(-1px); }
        .tg-replykb { background: #E4E8EC; padding: 6px; display: flex; flex-direction: column; gap: 5px; border-top: 1px solid rgba(0,0,0,0.07); }
        .tg-replykb-row { display: flex; gap: 5px; }
        .tg-replykb-btn { flex: 1; text-align: center; background: #fff; color: #0E0E10; font-family: 'Manrope'; font-weight: 600; font-size: 12.5px; padding: 10px 8px; border-radius: 8px; cursor: pointer; box-shadow: 0 1px 1px rgba(0,0,0,0.14); transition: all 0.15s; }
        .tg-replykb-btn:hover { background: #F4F4F2; transform: translateY(-1px); }
        .tg-input { display: flex; align-items: center; gap: 10px; background: #fff; padding: 10px 14px; border-top: 1px solid rgba(0,0,0,0.06); }
        .tg-input-field { flex: 1; color: #A7A6A2; font-family: 'Manrope'; font-size: 13px; }
        .tg-send { color: #5A9FD4; font-size: 17px; }

        /* ===== TOKEN ===== */
        .token-bubble { align-self: flex-start; display: flex; align-items: center; gap: 8px; background: ${CODE.bg}; border-radius: 12px; padding: 10px 13px; max-width: 92%; box-shadow: 0 2px 4px rgba(0,0,0,0.18); }
        .token-key { font-size: 16px; }
        .token-val { font-size: clamp(11px,1.4vw,13px); color: ${CODE.str}; letter-spacing: 0.03em; word-break: break-all; }

        /* ===== ARXITEKTURA / STACK OQIMI ===== */
        .archflow { display: flex; align-items: center; flex-wrap: wrap; gap: 5px; padding: 4px 0; }
        .archnode { display: flex; flex-direction: column; align-items: center; gap: 3px; background: ${T.paper}; border-radius: 11px; padding: 10px 10px; min-width: 78px; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.16); transition: all 0.25s; }
        .archnode.on { box-shadow: inset 0 0 0 1.5px ${T.success}, 0 6px 16px -6px rgba(31,122,77,0.26); background: ${T.successSoft}; }
        .archnode-ico { font-size: 19px; line-height: 1; }
        .archnode-lbl { font-family: 'Manrope'; font-weight: 700; font-size: 10px; color: ${T.ink}; text-align: center; }
        .archflow-arrow { color: ${T.ink3}; font-weight: 700; font-size: 15px; }

        /* ===== SEGMENT TOGGLE ===== */
        .seg { display: inline-flex; gap: 5px; background: ${T.paper}; padding: 5px; border-radius: 12px; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.16); align-self: flex-start; flex-wrap: wrap; }
        .seg-btn { font-family: 'Manrope'; font-weight: 700; font-size: clamp(12px,1.5vw,13.5px); padding: 9px 15px; border-radius: 9px; border: none; background: transparent; color: ${T.ink2}; cursor: pointer; transition: all 0.18s; }
        .seg-btn:hover:not(.on) { background: ${T.bg}; }
        .seg-btn.on { background: ${T.accent}; color: #fff; box-shadow: 0 6px 16px -5px rgba(255,79,40,0.4); }

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
