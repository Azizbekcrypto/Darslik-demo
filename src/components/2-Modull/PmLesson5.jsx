import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';

// ============================================================
// PM 5-DARS — DEKOMPOZITSIYA (Decomposition / MVP) — PLATFORM STANDARD v16
// G'oya: katta mahsulotni bo'laklarga bo'lish — feature list → MVP → backlog.
// Markaziy qoida: avval eng kichik ISHLAYDIGAN versiya (MVP), keyin bosqichma-bosqich o'stir.
// Metafora: SKEYTBORD → SAMOKAT → VELOSIPED → MASHINA (har biri haydaladi).
// JS bog'lanish: dasturni kichik funksiyalarga bo'lish + versiyama-versiya (iteratsiya).
// Keyslar: Amazon, Facebook, Uber, Airbnb — ulkanlar ham kichik MVP'dan boshlagan.
// Sandbox: mini-do'kon (Modul 2 praktikalari bilan izchil).
// AUDIOSIZ — ovoz yo'q, faqat matn va animatsiya.
// PRODUCTION: <style> ichidagi @import OLIB TASHLANADI — shriftlarni LMS yuklaydi.
// ============================================================

const T = {
  bg: '#F6F4EF', ink: '#0E0E10', ink2: '#5A5A60', ink3: '#A7A6A2',
  paper: '#FFFFFF', accent: '#FF4F28', accentSoft: '#FFE8E1', accentVivid: '#FF4F28',
  success: '#1F7A4D', successSoft: '#E3F0E8', blue: '#019ACB', blueSoft: '#E2F4FA', link: '#1a56db',
  honey: '#E0892B', honeySoft: '#FBEFDD', grape: '#7B3FE4', grapeSoft: '#EFE9FB',
  shadowBase: '58, 53, 48'
};
const CODE = { bg: '#1A2436', text: '#E8E5DD', tag: '#FF7755', attr: '#FFD380', str: '#7DD181', comment: '#6B7585', punct: '#9FB4D8' };
const G = "Georgia, serif";

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

// ===== IKONKALAR =====
const sv = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' };
const Ico = {
  check: (s = 18) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv} strokeWidth={2.3}><path d="M20 6L9 17l-5-5" /></svg>),
  x: (s = 18) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv} strokeWidth={2.2}><path d="M6 6l12 12M18 6L6 18" /></svg>),
  arrow: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv} strokeWidth={1.9}><path d="M4 12h14" /><path d="M13 6l6 6-6 6" /></svg>),
  clock: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></svg>),
  search: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>),
  list: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M8 6h12M8 12h12M8 18h12" /><circle cx="4" cy="6" r="1" /><circle cx="4" cy="12" r="1" /><circle cx="4" cy="18" r="1" /></svg>),
  page: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v4h4M9 13h6M9 16h5" /></svg>),
  cart: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><circle cx="9" cy="20" r="1.5" /><circle cx="17" cy="20" r="1.5" /><path d="M3 4h2l2.4 11h10l2-7H6.2" /></svg>),
  chat: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M4 5h16v11H9l-4 4v-4H4z" /></svg>),
  star: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M12 4l2.3 5 5.4.6-4 3.7 1.1 5.4L12 16l-4.8 2.7 1.1-5.4-4-3.7 5.4-.6z" /></svg>),
  card: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M3 10h18M6.5 14.5h4" /></svg>),
  truck: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M3 7h11v8H3zM14 10h4l3 3v2h-7z" /><circle cx="7" cy="18" r="1.7" /><circle cx="17.5" cy="18" r="1.7" /></svg>),
  // brendlar
  amazon: (s = 26) => (<svg viewBox="0 0 24 24" width={s} height={s}><rect x="2" y="2" width="20" height="20" rx="5" fill="#232F3E" /><text x="12" y="14.4" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="11" fontWeight="700" fill="#fff">a</text><path d="M6.8 17.4c3.2 1.9 7.2 1.9 10.4 0" stroke="#FF9900" strokeWidth="1.7" fill="none" strokeLinecap="round" /></svg>),
  facebook: (s = 26) => (<svg viewBox="0 0 24 24" width={s} height={s}><rect x="2" y="2" width="20" height="20" rx="5" fill="#1877F2" /><path d="M14.6 12.2h-2.1v6H10v-6H8.6V9.9H10V8.5c0-1.7 1-2.7 2.6-2.7.8 0 1.5.1 1.5.1v1.9h-.8c-.8 0-1.1.5-1.1 1v1.1h1.9z" fill="#fff" /></svg>),
  uber: (s = 26) => (<svg viewBox="0 0 24 24" width={s} height={s}><rect x="2" y="2" width="20" height="20" rx="5" fill="#000" /><text x="12" y="15.2" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="8" fontWeight="800" fill="#fff">Uber</text></svg>),
  airbnb: (s = 26) => (<svg viewBox="0 0 24 24" width={s} height={s}><rect x="2" y="2" width="20" height="20" rx="5" fill="#fff" stroke="#EDEDED" /><path d="M12 5.6c-1.1 0-1.9.9-2.6 2.4-2.1 4-3.1 6.2-3.1 7.7 0 1.5 1.1 2.5 2.5 2.5.9 0 1.6-.4 2.2-1.1.6.7 1.3 1.1 2.2 1.1 1.4 0 2.5-1 2.5-2.5 0-1.5-1-3.7-3.1-7.7C13.9 6.5 13.1 5.6 12 5.6zm0 2c.3 0 .6.4 1.2 1.5 1.8 3.5 2.6 5.4 2.6 6.5 0 .7-.5 1.1-1 1.1-.6 0-1.1-.5-1.8-1.4.7-1 1.1-1.8 1.1-2.5 0-1.2-.9-2.2-2.1-2.2s-2.1 1-2.1 2.2c0 .7.4 1.5 1.1 2.5-.7.9-1.2 1.4-1.8 1.4-.5 0-1-.4-1-1.1 0-1.1.8-3 2.6-6.5C11.4 8 11.7 7.6 12 7.6zm0 5.3c.4 0 .8.3.8.9 0 .3-.3.8-.8 1.4-.5-.6-.8-1.1-.8-1.4 0-.6.4-.9.8-.9z" fill="#FF5A5F" /></svg>)
};

// PM-5 belgilar: transport (skeyt→mashina), raketa, qatlamlar, uchqun, quti
const p5sv = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' };
const p5 = {
  rocket: (s = 18) => (<svg viewBox="0 0 24 24" width={s} height={s} {...p5sv}><path d="M12 3c2.8 1.2 4.6 4 4.6 7.6 0 1.9-.8 3.7-1.8 4.9l-2.8 2-2.8-2c-1-1.2-1.8-3-1.8-4.9C7.4 7 9.2 4.2 12 3z" /><circle cx="12" cy="10" r="1.6" /><path d="M9.4 16l-2 3.5 3-1M14.6 16l2 3.5-3-1" /></svg>),
  layers: (s = 18) => (<svg viewBox="0 0 24 24" width={s} height={s} {...p5sv}><path d="M12 3l9 5-9 5-9-5z" /><path d="M3 13l9 5 9-5" /></svg>),
  spark: (s = 18) => (<svg viewBox="0 0 24 24" width={s} height={s} {...p5sv}><path d="M12 3.2v3.4M12 17.4v3.4M3.2 12h3.4M17.4 12h3.4M6.1 6.1l2.4 2.4M15.5 15.5l2.4 2.4M17.9 6.1l-2.4 2.4M8.5 15.5l-2.4 2.4" /></svg>),
  box: (s = 18) => (<svg viewBox="0 0 24 24" width={s} height={s} {...p5sv}><path d="M3 8l9-5 9 5v8l-9 5-9-5z" /><path d="M3 8l9 5 9-5M12 13v8" /></svg>),
  flag: (s = 18) => (<svg viewBox="0 0 24 24" width={s} height={s} {...p5sv}><path d="M5 21V4M5 5h11l-2 3 2 3H5" /></svg>)
};

// Transport siluetlari (chavandoz bilan) — evolyutsiya
const VEH = {
  skate: (<g fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M10 34h40" /><circle cx="20" cy="38" r="2.6" /><circle cx="40" cy="38" r="2.6" /><circle cx="30" cy="12" r="4" /><path d="M30 16v9M30 25l-6 9M30 25l6 9M30 19l-7 3M30 19l7 3" /></g>),
  scooter: (<g fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M11 34h22" /><circle cx="12" cy="38" r="2.6" /><circle cx="35" cy="38" r="2.6" /><path d="M35 34V16h8" /><circle cx="25" cy="12" r="4" /><path d="M25 16v9M25 25l-3 9M25 25l5 9M25 19l13-3" /></g>),
  bike: (<g fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><circle cx="15" cy="32" r="7.5" /><circle cx="45" cy="32" r="7.5" /><path d="M15 32l10-12h10l-7 12M25 20l9 12M22 18h8" /><circle cx="28" cy="11" r="4" /><path d="M28 15v5M28 16l-6 2" /></g>),
  car: (<g fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M6 33q0-5 5-5l5-9h22l7 9q5 0 5 5v3H6z" /><path d="M19 19l-3 9h26l-5-9z" /><circle cx="19" cy="36" r="3.6" /><circle cx="43" cy="36" r="3.6" /></g>)
};
const Vehicle = ({ stage, size = 120 }) => (
  <svg viewBox="0 0 60 44" width={size} height={Math.round(size * 44 / 60)} style={{ display: 'block' }}>{VEH[stage]}</svg>
);

const LESSON_META = { lessonId: 'pm-decomposition-05-v16', lessonTitle: { uz: 'Dekompozitsiya — MVP', ru: 'Декомпозиция — MVP' } };
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
  { id: 's14', type: 'rule',        template: 'custom',   scored: false, scope: null },
  { id: 's15', type: 'test',        template: 'custom',   scored: true,  scope: 'final' },
  { id: 's16', type: 'summary',     template: 'custom',   scored: false, scope: null }
];
const TOTAL_SCREENS = SCREEN_META.length;
const SCORED_IDX = SCREEN_META.map((m, i) => (m.scored ? i : null)).filter(i => i !== null);

// ===== KONSEPT LEKSIKONI =====
// Zo'r keyslar — ulkanlar ham kichik MVP'dan boshlagan
const CASES = {
  amazon: { ic: Ico.amazon(26), name: 'Amazon', year: '1994', mvp: 'Faqat onlayn KITOB do\'koni.', today: 'Elektronika, kiyim, Prime, Kindle, bulut — hamma narsa.' },
  facebook: { ic: Ico.facebook(26), name: 'Facebook', year: '2004', mvp: 'Faqat 1 universitet (Garvard) talabalari uchun profil.', today: '3 milliard odam, video, Marketplace, Messenger.' },
  uber: { ic: Ico.uber(26), name: 'Uber', year: '2010', mvp: '1 shahar, faqat qora premium mashina.', today: '70+ davlat, arzon UberX, ovqat yetkazish.' },
  airbnb: { ic: Ico.airbnb(26), name: 'Airbnb', year: '2008', mvp: 'O\'z xonasida 3 mehmonga havo matras ijara.', today: '220+ davlat, millionlab uy, sayohat tajribalari.' }
};

// Evolyutsiya bosqichlari (har biri ISHLAYDI)
const STAGES = [
  { key: 'skate', label: 'Skeytbord', color: T.honey, use: 'Eng oddiy — lekin sizni A dan B ga olib boradi. Allaqachon haydaladi!' },
  { key: 'scooter', label: 'Samokat', color: T.blue, use: 'Tezroq va qulayroq. Hali ham sodda, lekin yaxshilangan.' },
  { key: 'bike', label: 'Velosiped', color: T.grape, use: 'Uzoq masofa, kam kuch. Foydalanuvchi mamnun.' },
  { key: 'car', label: 'Mashina', color: T.success, use: 'Mukammal versiya. Lekin shu yergacha HAR bosqich ishlatilgan!' }
];

// Mini-do'kon feature'lari (MVP / Keyin)
const FEATURES = [
  { id: 'list', text: 'Mahsulot ro\'yxati (rasm+narx)', stage: 'mvp', ic: Ico.list(17) },
  { id: 'detail', text: 'Mahsulot sahifasi', stage: 'mvp', ic: Ico.page(17) },
  { id: 'search', text: 'Qidiruv', stage: 'mvp', ic: Ico.search(17) },
  { id: 'cart', text: 'Savat', stage: 'keyin', ic: Ico.cart(17) },
  { id: 'chat', text: 'Sotuvchiga yozish', stage: 'keyin', ic: Ico.chat(17) },
  { id: 'review', text: 'Sharh va baho', stage: 'keyin', ic: Ico.star(17) },
  { id: 'pay', text: 'Onlayn to\'lov', stage: 'keyin', ic: Ico.card(17) },
  { id: 'ai', text: 'AI tavsiya', stage: 'keyin', ic: p5.spark(17) }
];

// Versiyalar (mini-do'kon v1→v2→v3)
const VERSIONS = [
  { key: 'v1', label: 'v1 — MVP', color: T.success, feats: ['Mahsulot ro\'yxati', 'Qidiruv', 'Mahsulot sahifasi'], note: 'Eng kichik ishlaydigan do\'kon — odam ko\'radi va sotib oladi.' },
  { key: 'v2', label: 'v2 — O\'sish', color: T.blue, feats: ['Savat', 'Sotuvchiga yozish', 'Sharh va baho'], note: 'Foydalanuvchi fikriga qarab qulayliklar qo\'shildi.' },
  { key: 'v3', label: 'v3 — Kengayish', color: T.grape, feats: ['Onlayn to\'lov', 'Yetkazib berish', 'AI tavsiya'], note: 'Katta funksiyalar — endi bozorga tayyor.' }
];

const Split = ({ children, refEl }) => <div className="split" ref={refEl}>{children}</div>;
const Col = ({ children, gap }) => <div className="col" style={gap ? { gap } : undefined}>{children}</div>;

const Stage = ({ children, eyebrow, screen, totalScreens = TOTAL_SCREENS, navContent, narrow, mentorStatic }) => {
  const isMobile = useIsMobile();
  const isNarrow = useIsMobile(768);
  const collapseOn = isNarrow && !mentorStatic;
  const padH = isMobile ? 12 : 100;
  const [mCollapsed, setMCollapsed] = useState(false);
  const contentRef = useRef(null);
  useEffect(() => { setMCollapsed(false); }, [screen]);
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

const Mentor = ({ children }) => {
  const ctx = useContext(MentorCtx) || {};
  const enabled = !!ctx.enabled;
  const collapsed = enabled && ctx.collapsed;
  const expand = (e) => { e.stopPropagation(); if (ctx.setCollapsed) ctx.setCollapsed(false); };
  return (
    <div className={`mentor fade-up ${enabled ? 'mentor-mob' : ''} ${collapsed ? 'is-collapsed' : ''}`} onClick={collapsed ? expand : undefined} role={collapsed ? 'button' : undefined}>
      <div className="mentor-ava" aria-hidden="true">
        <svg viewBox="0 0 40 40" width="40" height="40">
          <circle cx="20" cy="20" r="20" fill={T.accentSoft} />
          <circle cx="20" cy="16" r="6" fill={T.accent} />
          <path d="M8 36 a12 9 0 0 1 24 0 Z" fill={T.accent} />
        </svg>
      </div>
      <div className="mentor-col">
        <span className="mentor-name">Mentor{collapsed && <span className="mentor-cue"> · ko'rsatmani ochish ▾</span>}</span>
        <div className="mentor-msg body">{children}</div>
      </div>
    </div>
  );
};

const Q = ({ children, max = 760 }) => <h2 className="title h-title fade-up" style={{ maxWidth: max }}>{children}</h2>;
const IcoChip = ({ color = T.accent, soft = T.accentSoft, children, size = 46 }) => (
  <span style={{ width: size, height: size, borderRadius: 13, background: soft, color, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{children}</span>
);

const MentorCollapseScroll = ({ targetRef }) => {
  const ctx = useContext(MentorCtx) || {};
  const prev = useRef(false);
  useEffect(() => {
    if (ctx.enabled && ctx.collapsed && !prev.current && targetRef && targetRef.current) {
      const el = targetRef.current;
      setTimeout(() => { if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 420);
    }
    prev.current = !!ctx.collapsed;
  }, [ctx.collapsed, ctx.enabled, targetRef]);
  return null;
};

// Qora "reja" kartasi — MVP / yo'l xaritasi
const SpecCard = ({ items, minH = 200, title = 'Yo\'l xaritasi', icon }) => (
  <div className="spec-card" style={{ minHeight: minH }}>
    <div className="spec-head"><span style={{ display: 'inline-flex', color: '#9FB4D8' }}>{icon || p5.layers(15)}</span><span className="spec-title">{title}</span></div>
    {items.map((it, i) => (
      <div key={i} className={it.text ? 'feat-pop' : ''}>
        {it.label && <span className="spec-lbl" style={{ color: it.color || '#9FB4D8' }}>{it.label}</span>}
        <p className="spec-text" style={{ color: it.text ? '#E8E5DD' : '#6B7585', fontStyle: it.text ? 'normal' : 'italic' }}>{it.text || it.ph}</p>
      </div>
    ))}
  </div>
);

// PM5 — resurs/vaqt o'lchagichi (juda ko'p feature → to'lib toshadi)
const ResourceMeter = ({ load, max = 8 }) => {
  const pct = Math.min(100, Math.round((load / max) * 100));
  const over = load > max * 0.6;
  const col = over ? T.accent : T.success;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
      {[{ lbl: 'Vaqt', mul: 1 }, { lbl: 'Risk', mul: 1.15 }].map(b => {
        const w = Math.min(100, pct * b.mul);
        const bover = w > 70;
        return (
          <div key={b.lbl}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span className="mono small" style={{ color: T.ink2 }}>{b.lbl}</span><span className="mono small" style={{ color: bover ? T.accent : T.ink3, fontWeight: 700 }}>{bover ? 'YUQORI' : 'normal'}</span></div>
            <div className="meter-track"><div className={`meter-fill ${bover ? 'over' : ''}`} style={{ width: `${w}%`, background: bover ? T.accent : T.success }} /></div>
          </div>
        );
      })}
    </div>
  );
};

// ===== SCREEN 0 — HOOK =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [mode, setMode] = useState('step'); // 'step' | 'all'
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const OPTS = [
    { id: 'a', label: 'Chiroyliroq ko\'rinadi' },
    { id: 'b', label: 'Har bosqichda ishlaydigan narsa bor — foyda erta keladi' },
    { id: 'c', label: 'Farqi yo\'q, ikkalasi bir xil' }
  ];
  const pick = (id) => { if (picked !== null) return; setPicked(id); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: id, correct: true }); };
  return (
    <Stage eyebrow="Kirish" screen={screen} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 840 }}>Mashinani <span className="italic" style={{ color: T.accent }}>g'ildirakdanmi</span> yoki skeytborddan boshlaymizmi?</h1>
        <Mentor>Ikki jamoa bitta ilova quryapti. Birini bosib, har birining natijasini ko'ring.</Mentor>
        <Split>
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${mode === 'step' ? 'chip-on' : ''}`} onClick={() => setMode('step')}>Bosqichma-bosqich</button>
              <button className={`chip ${mode === 'all' ? 'chip-on' : ''}`} onClick={() => setMode('all')}>Hammasini birato'la</button>
            </div>
            <div key={mode} className="demo-swap" style={{ background: T.paper, borderRadius: 16, padding: '20px 18px', boxShadow: `0 8px 22px -7px rgba(${T.shadowBase},0.16)`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, borderLeft: `4px solid ${mode === 'step' ? T.success : T.ink3}` }}>
              {mode === 'step' ? (
                <>
                  <span className="roll" style={{ color: T.honey }}><Vehicle stage="skate" size={120} /></span>
                  <div style={{ textAlign: 'center' }}>
                    <p className="mono small" style={{ color: T.success, fontWeight: 700, margin: 0 }}>1-HAFTA · SKEYTBORD</p>
                    <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: '5px 0 0' }}>Allaqachon yuryapti! Foydalanuvchi bugundan foydalanmoqda.</p>
                  </div>
                </>
              ) : (
                <>
                  <span style={{ color: T.ink3, opacity: 0.45 }}><Vehicle stage="car" size={120} /></span>
                  <div style={{ textAlign: 'center' }}>
                    <p className="mono small" style={{ color: T.accent, fontWeight: 700, margin: 0 }}>1-YIL · HALI QURILMOQDA ⏳</p>
                    <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', color: T.ink, margin: '5px 0 0' }}>Hali hech narsa yurmaydi — foydalanuvchi kutib o'tiribdi.</p>
                  </div>
                </>
              )}
            </div>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Nega bosqichma-bosqich yaxshiroq?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => { const on = picked === o.id; return (<button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null} onClick={() => pick(o.id)}><span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span></button>); })}
            </div>
            {picked !== null && <p className="hook-ack fade-step">Katta mahsulotni birato'la qurib bo'lmaydi. Avval <b>eng kichik ishlaydigan versiya</b> (skeytbord) — buni <b>MVP</b> deyiladi. Keyin bosqichma-bosqich o'stiramiz.</p>}
          </Col>
        </Split>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const STEPS = [
    { text: 'Mahsulotni feature\'larga bo\'lamiz (dekompozitsiya)', tag: '' },
    { text: 'MVP — eng kichik ishlaydigan versiyani ajratamiz', tag: '' },
    { text: 'Qolganini "keyin" (backlog)ga qo\'yamiz', tag: '' },
    { text: 'MVPga keraksiz og\'ir feature\'ni topib olib tashlash', tag: 'mashq' },
    { text: 'O\'z loyihangizni MVP vs Keyin ga bo\'lasiz', tag: 'amaliyot' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const Idea = ({ ic, h, t, c }) => (<div className="frame" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px' }}><IcoChip color={c} soft={c + '1c'}>{ic}</IcoChip><div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, color: T.ink, margin: 0, fontSize: 'clamp(16px,2.2vw,19px)' }}>{h}</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>{t}</p></div></div>);
  const IdeaBlock = (
    <Col>
      <p className="flow-label">Bugungi asosiy g'oya</p>
      <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Idea ic={<span style={{ color: T.honey }}><Vehicle stage="skate" size={30} /></span>} c={T.honey} h="AVVAL SKEYTBORD" t="Eng kichik ishlaydigan versiya — MVP" />
        <Idea ic={p5.layers(22)} c={T.grape} h="KEYIN O'STIR" t="v1 → v2 → v3, bosqichma-bosqich" />
      </div>
      <p className="mono small" style={{ color: T.accent, margin: 0 }}>→ Dekompozitsiya = katta dasturni kichik funksiyalarga bo'lish</p>
    </Col>
  );
  const StepsBlock = (<Col><p className="flow-label">5 qadam</p><ol className="roadmap">{STEPS.map((s, i) => (<li key={i} className="step-card fade-up" style={{ animationDelay: `${0.08 + i * 0.05}s` }}><span className="step-num">{String(i + 1).padStart(2, '0')}</span><span className="step-body"><span className="step-text">{s.text}</span>{s.tag && <span className="step-tag">{s.tag}</span>}</span></li>))}</ol></Col>);
  return (
    <Stage eyebrow="Reja" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Boshlaymiz →" onClick={onNext} /></>}>
      <div className="screen">
        <div className="head"><h2 className="title h-title fade-up"><span className="italic" style={{ color: T.accent }}>Katta g'oyani qanday bosqichlarga bo'lamiz?</span></h2></div>
        <Mentor>Hamma "ajoyib, mukammal mahsulot qilaman" deydi — lekin u <b style={{ color: T.ink }}>katta resurs</b> talab qiladi. PM sirri: katta g'oyani <b style={{ color: T.ink }}>bosqichlarga</b> bo'lish. Avval skeytbord, keyin mashina.</Mentor>
        {!isNarrow ? (<Split>{IdeaBlock}{StepsBlock}</Split>) : !showSteps ? (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>{IdeaBlock}<button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>5 qadamni ko'rish</button></div>) : (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}><button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ G'oyani ko'rish</button>{StepsBlock}</div>)}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — ZO'R KEYSLAR (ulkanlar kichikdan boshlagan) =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const KEYS = Object.keys(CASES);
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(storedAnswer ? new Set(KEYS) : new Set());
  const isNarrow = useIsMobile(768);
  const done = seen.size >= KEYS.length;
  const tap = (k) => { setActive(k); setSeen(prev => { const n = new Set(prev); n.add(k); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = active ? CASES[active] : null;
  return (
    <Stage eyebrow="Zo'r keyslar" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/4 ko'ring`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Ulkan kompaniyalar <span className="italic" style={{ color: T.accent }}>qanchadan</span> boshlagan?</h2></div>
        <Mentor>Bugungi gigantlar ham birinchi kuni ulkan bo'lmagan — hammasi <b style={{ color: T.ink }}>kichik MVP</b>'dan boshlagan. Bittasini bosib, boshlanishini ko'ring.</Mentor>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {KEYS.map(k => (<button key={k} onClick={() => tap(k)} style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', border: 'none', borderRadius: 13, padding: '13px 12px', background: T.paper, boxShadow: active === k ? `inset 0 0 0 2px ${T.accent}, 0 8px 20px -7px rgba(255,79,40,0.22)` : `0 6px 16px -8px rgba(${T.shadowBase},0.16)`, transition: 'all 0.18s' }}><span style={{ display: 'inline-flex' }}>{CASES[k].ic}</span><span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 13.5, color: T.ink }}>{CASES[k].name}</span>{seen.has(k) && <span style={{ marginLeft: 'auto', color: T.success, display: 'inline-flex' }}>{Ico.check(13)}</span>}</button>))}
            </div>
          </Col>
          <Col>
            {cur ? (
              <div className="sk-info fade-step" key={active}>
                <span className="sk-tagbig"><span style={{ display: 'inline-flex' }}>{cur.ic}</span><span className="sk-wordbadge">{cur.name} · {cur.year}</span></span>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, margin: '13px 0 0' }}><span style={{ color: T.honey, display: 'inline-flex', marginTop: 1 }}><Vehicle stage="skate" size={18} /></span><p className="body" style={{ margin: 0, color: T.ink }}><b style={{ color: T.honey }}>MVP:</b> {cur.mvp}</p></div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, margin: '8px 0 0' }}><span style={{ color: T.success, display: 'inline-flex', marginTop: 1 }}><Vehicle stage="car" size={18} /></span><p className="body" style={{ margin: 0, color: T.ink2 }}><b style={{ color: T.success }}>Bugun:</b> {cur.today}</p></div>
              </div>
            ) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Bir kompaniyani bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Hech biri birinchi kuni gigant bo'lmagan. Hammasi <b>kichik MVP</b>'dan boshlab, bosqichma-bosqich o'sgan.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — HAMMASINI BIRATO'LA → RESURS PORTLAYDI =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [mode, setMode] = useState('mvp');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['mvp', 'all']) : new Set(['mvp']));
  const done = seen.size >= 2;
  const set = (v) => { setMode(v); setSeen(prev => { const n = new Set(prev); n.add(v); return n; }); };
  const load = mode === 'mvp' ? 2 : 8;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Resurs" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Hammasini <span className="italic" style={{ color: T.accent }}>birato'la</span> qursak — nima bo'ladi?</h2></div>
        <Mentor>Bitta versiyada nechta feature qurishni tanlang. Vaqt va risk o'lchagichini kuzating.</Mentor>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${mode === 'mvp' ? 'chip-on' : ''}`} onClick={() => set('mvp')}>MVP — 2 feature</button>
              <button className={`chip ${mode === 'all' ? 'chip-on' : ''}`} onClick={() => set('all')}>Hammasi — 8 feature</button>
            </div>
            <div key={mode} className="frame demo-swap" style={{ padding: 'clamp(16px,2.5vw,22px)' }}>
              <p className="mono small" style={{ color: T.ink2, margin: '0 0 12px' }}>Bitta versiyada: <b style={{ color: load > 5 ? T.accent : T.success }}>{load} feature</b></p>
              <ResourceMeter load={load} />
            </div>
          </Col>
          <Col>
            {mode === 'mvp'
              ? <div className="frame-success fade-step" key="m"><p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: T.success, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Tez chiqadi</p><p className="body" style={{ margin: 0, color: T.ink }}>Kam feature — kam vaqt, kam risk. 1 haftada chiqarib, foydalanuvchi fikrini olasiz.</p></div>
              : <div className="frame-warn fade-step" key="a"><p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Loyiha cho'kadi</p><p className="body" style={{ margin: 0, color: T.ink }}>Hammasini birato'la — vaqt va risk portlaydi. Oylab hech narsa chiqmaydi, foydalanuvchi fikri ham yo'q.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Shuning uchun avval <b>kam, lekin ishlaydigan</b> feature — MVP. Resurs cheklangan, uni to'g'ri sarflang.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 =====
const Screen4 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 1-savol"
    questionText="MVP ning asosiy maqsadi nima?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>MVP ning asosiy <span className="italic" style={{ color: T.accent }}>maqsadi</span> nima?</h2></>}
    options={['Mukammal mahsulotni bir martada chiqarish', 'Eng kichik ishlaydigan versiya bilan tez sinab, erta fikr olish', 'Imkon qadar ko\'p feature qo\'shish', 'Eng chiroyli dizaynni yasash']} correctIdx={1}
    explainCorrect="To'g'ri! MVP — eng kichik ISHLAYDIGAN versiya. Maqsad: tez chiqarib, foydalanuvchidan erta fikr olish va shu asosda o'stirish."
    explainWrong={{ 0: 'Mukammal mahsulot bir martada chiqmaydi. Avval kichik ishlaydigan versiya.', 2: 'Ko\'p feature — ko\'p vaqt va risk. MVP aksincha: kam, lekin ishlaydigan.', 3: 'Dizayn keyin. Avval ishlaydigan o\'zak va foydalanuvchi fikri.', default: 'MVP — eng kichik ishlaydigan versiya bilan tez sinash.' }} />
);

// ===== SCREEN 5 — EVOLYUTSIYA (skeytbord → mashina) — signature =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [idx, setIdx] = useState(0);
  const [seen, setSeen] = useState(storedAnswer ? new Set([0, 1, 2, 3]) : new Set([0]));
  const done = seen.size >= STAGES.length;
  const go = (i) => { if (i < 0 || i >= STAGES.length) return; setIdx(i); setSeen(prev => { const n = new Set(prev); n.add(i); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const st = STAGES[idx];
  return (
    <Stage eyebrow="Evolyutsiya" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/4 bosqichni ko'ring`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Har bosqich <span className="italic" style={{ color: T.accent }}>haydaladi</span> — skeytborddan mashinagacha</h2></div>
        <Mentor>To'g'ri MVP — mashinaning g'ildiragi emas, <b style={{ color: T.ink }}>haydab bo'ladigan skeytbord</b>. Har bosqichni bosib, foydasini ko'ring.</Mentor>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ background: T.paper, borderRadius: 16, padding: 'clamp(16px,2.5vw,24px)', boxShadow: `0 8px 22px -7px rgba(${T.shadowBase},0.16)`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
              <span key={st.key} className="veh-pop roll" style={{ color: st.color }}><Vehicle stage={st.key} size={130} /></span>
              <div style={{ display: 'flex', gap: 6 }}>
                {STAGES.map((s, i) => (<button key={s.key} onClick={() => go(i)} aria-label={s.label} style={{ width: 30, height: 30, borderRadius: 9, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', background: i === idx ? s.color : (seen.has(i) ? s.color + '22' : T.bg), color: i === idx ? '#fff' : s.color, transition: 'all 0.18s' }}><Vehicle stage={s.key} size={20} /></button>))}
              </div>
            </div>
          </Col>
          <Col>
            <div className="sk-info fade-step" key={st.key}>
              <span className="sk-tagbig"><span className="mono" style={{ fontSize: 11, fontWeight: 700, color: st.color }}>{idx + 1}-BOSQICH</span><span className="sk-wordbadge" style={{ color: st.color, background: st.color + '1c' }}>{st.label}</span></span>
              <p className="body" style={{ color: T.ink, margin: '12px 0 0' }}>{st.use}</p>
            </div>
            {idx < STAGES.length - 1
              ? <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => go(idx + 1)}>Keyingi versiya →</button>
              : <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana farqi: har bosqich <b>ishlaydi</b>. Mashinani g'ildirakdan boshlasangiz — yo'lda hech narsa yurmaydi.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 5b — TEST 2 =====
const Screen5b = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Tekshiruv"
    questionText="Mahsulot uchun to'g'ri MVP qaysi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Mustahkamlash</p><h2 className="title h-sub" style={{ marginTop: 8 }}>To'g'ri MVP qaysi — <span className="italic" style={{ color: T.accent }}>g'ildirakmi</span> yoki skeytbord?</h2></>}
    options={['Mashinaning bitta g\'ildiragi', 'Haydab bo\'ladigan skeytbord', 'Mashinaning dvigateli', 'Yarim qurilgan mashina']} correctIdx={1}
    explainCorrect="To'g'ri! MVP butun, ishlaydigan narsa bo'lishi kerak — skeytbord sizni haydaydi. G'ildirak yoki dvigatel alohida hech qayerga olib bormaydi."
    explainWrong={{ 0: 'Bitta g\'ildirak haydalmaydi. MVP — butun ishlaydigan narsa (skeytbord).', 2: 'Dvigatel o\'zi yurmaydi. MVP foydalanuvchini A dan B ga olib borishi kerak.', 3: 'Yarim mashina yurmaydi. Skeytbord kichik, lekin to\'liq ishlaydi.', default: 'MVP — kichik, lekin butun ishlaydigan narsa: skeytbord.' }} />
);

// ===== SCREEN 6 — VERSIYA STEPPERI (v1→v2→v3) =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [step, setStep] = useState(storedAnswer ? VERSIONS.length : 0);
  const [running, setRunning] = useState(false);
  const timer = useRef(null);
  const done = step >= VERSIONS.length;
  useEffect(() => () => clearTimeout(timer.current), []);
  const run = () => { clearTimeout(timer.current); setStep(0); setRunning(true); const tick = (i) => { setStep(i); if (i < VERSIONS.length) timer.current = setTimeout(() => tick(i + 1), 900); else setRunning(false); }; timer.current = setTimeout(() => tick(1), 350); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="O'sish" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Avval kuzating'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Mini-do'kon <span className="italic" style={{ color: T.accent }}>versiyama-versiya</span> qanday o'sadi?</h2></div>
        <Mentor>MVP chiqqach to'xtamaymiz — foydalanuvchi fikriga qarab <b style={{ color: T.ink }}>v2, v3</b> qo'shamiz. Tugmani bosib, o'sishni kuzating.</Mentor>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {VERSIONS.map((v, i) => { const on = step > i; return (
            <div key={v.key} className={on ? 'ver-in' : ''} style={{ background: T.paper, borderRadius: 13, padding: '13px 15px', opacity: on ? 1 : 0.32, boxShadow: on ? `0 8px 20px -10px rgba(${T.shadowBase},0.2)` : 'none', borderLeft: `4px solid ${on ? v.color : T.ink3}`, transition: 'all 0.5s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 7 }}><span className="mono" style={{ fontSize: 12, fontWeight: 800, color: on ? v.color : T.ink3 }}>{v.label}</span>{on && <span style={{ marginLeft: 'auto', color: T.success, display: 'inline-flex' }}>{Ico.check(15)}</span>}</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{v.feats.map(f => (<span key={f} style={{ fontFamily: "'Manrope'", fontWeight: 600, fontSize: 12, color: on ? v.color : T.ink3, background: on ? v.color + '16' : T.bg, padding: '4px 10px', borderRadius: 99 }}>{f}</span>))}</div>
              {on && <p className="small fade-step" style={{ margin: '8px 0 0', color: T.ink2, fontStyle: 'italic' }}>{v.note}</p>}
            </div>
          ); })}
        </div>
        <button className="btn" onClick={run} disabled={running} style={{ alignSelf: 'flex-start' }}>{running ? 'O\'smoqda…' : (done ? '↻ Yana ko\'rish' : 'Mahsulotni o\'stirish')}</button>
        {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana — <b>v1 → v2 → v3</b>. Har versiya ishlaydi va o'sib boradi. Bu — iteratsiya.</p></div>}
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — BIR FEATURE: MVP'DAMI YOKI KEYIN? (compare) =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('lean');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['lean', 'full']) : new Set(['lean']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  const LEAN = [{ label: 'MVP (v1)', color: CODE.str, text: 'Mahsulot ro\'yxati' }, { label: 'MVP (v1)', color: CODE.str, text: 'Qidiruv' }, { label: 'MVP (v1)', color: CODE.str, text: 'Mahsulot sahifasi' }];
  const FULL = [{ label: 'v1', color: '#FFCB6B', text: 'Mahsulot ro\'yxati' }, { label: 'v1', color: '#FFCB6B', text: 'Qidiruv' }, { label: 'v1', color: '#FFCB6B', text: 'Savat + to\'lov + yetkazish' }, { label: 'v1', color: '#FFCB6B', text: 'AI tavsiya + chat + sharh' }];
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="MVP vs Hammasi" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Birinchi versiyaga <span className="italic" style={{ color: T.accent }}>nimani</span> qo'yamiz?</h2></div>
        <Mentor>Ikki xil v1 reja: biri <b style={{ color: T.success }}>ozg'in</b> (faqat shart), biri <b style={{ color: T.honey }}>shishgan</b> (hammasi). Ikkalasini solishtiring.</Mentor>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${v === 'lean' ? 'chip-on' : ''}`} onClick={() => set('lean')}>Ozg'in MVP</button>
              <button className={`chip ${v === 'full' ? 'chip-on' : ''}`} onClick={() => set('full')}>Shishgan v1</button>
            </div>
            <div key={v}><SpecCard items={v === 'lean' ? LEAN : FULL} minH={200} title={v === 'lean' ? 'v1 — ozg\'in MVP' : 'v1 — hammasi birato\'la'} icon={v === 'lean' ? p5.flag(15) : p5.box(15)} /></div>
          </Col>
          <Col>
            {v === 'lean'
              ? <div className="frame-success fade-step" key="l"><p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: T.success, textTransform: 'uppercase', letterSpacing: '0.08em' }}>1 haftada tayyor</p><p className="body" style={{ margin: 0, color: T.ink }}>Faqat eng kerakli 3 feature. Tez chiqadi, foydalanuvchi sotib oladi, fikr keladi.</p></div>
              : <div className="frame-warn fade-step" key="f"><p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Oylar ketadi</p><p className="body" style={{ margin: 0, color: T.ink }}>Hamma narsa v1'da — to'lov, AI, chat... Oylab qoladi, hech kim ishlatib ko'rmaydi.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Har feature uchun so'rang: <b>"MVP'da shartmi, yoki keyin bo'ladimi?"</b></p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — SARALASH: MVP yoki Keyin? =====
const S8 = [
  { id: 'list', text: 'Mahsulot ro\'yxati', stage: 'mvp', ic: Ico.list(17) },
  { id: 'search', text: 'Qidiruv', stage: 'mvp', ic: Ico.search(17) },
  { id: 'detail', text: 'Mahsulot sahifasi', stage: 'mvp', ic: Ico.page(17) },
  { id: 'cart', text: 'Savat', stage: 'keyin', ic: Ico.cart(17) },
  { id: 'pay', text: 'Onlayn to\'lov tizimi', stage: 'keyin', ic: Ico.card(17) },
  { id: 'ai', text: 'AI tavsiya', stage: 'keyin', ic: p5.spark(17) }
];
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [placed, setPlaced] = useState(storedAnswer ? Object.fromEntries(S8.map(it => [it.id, true])) : {});
  const [wrong, setWrong] = useState(null);
  const done = S8.every(it => placed[it.id]);
  const place = (item, choice) => {
    if (placed[item.id]) return;
    if (choice === item.stage) { setPlaced(p => ({ ...p, [item.id]: true })); setWrong(null); }
    else { setWrong(item.id); setTimeout(() => setWrong(w => (w === item.id ? null : w)), 480); }
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cnt = Object.keys(placed).length;
  return (
    <Stage eyebrow="Saralash" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${cnt}/${S8.length} saralang`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bu feature <span className="italic" style={{ color: T.success }}>MVP</span>gami yoki <span className="italic" style={{ color: T.grape }}>Keyin</span>gami?</h2></div>
        <Mentor>Mini-do'kon feature'lari. Har biri uchun tanlang: birinchi versiyada <b style={{ color: T.success }}>shart</b> bo'lsa — MVP, keyinroq bo'lsa — <b style={{ color: T.grape }}>Keyin</b>.</Mentor>
        <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {S8.map(it => {
            const ok = placed[it.id]; const isWrong = wrong === it.id;
            return (
              <div key={it.id} className={isWrong ? 'shake-x' : ''} style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', background: ok ? (it.stage === 'mvp' ? T.successSoft : T.grapeSoft) : T.paper, borderRadius: 12, padding: '11px 14px', boxShadow: ok ? 'none' : `0 6px 16px -8px rgba(${T.shadowBase},0.16)`, transition: 'background 0.25s' }}>
                <span style={{ color: ok ? (it.stage === 'mvp' ? T.success : T.grape) : T.ink2, display: 'inline-flex' }}>{it.ic}</span>
                <p style={{ flex: 1, minWidth: 130, fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 14, color: T.ink, margin: 0 }}>{it.text}</p>
                {ok ? (
                  <span className="feat-pop" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: "'Manrope'", fontWeight: 700, fontSize: 12.5, color: it.stage === 'mvp' ? T.success : T.grape }}>{it.stage === 'mvp' ? p5.flag(15) : p5.layers(15)} {it.stage === 'mvp' ? 'MVP' : 'Keyin'} {Ico.check(14)}</span>
                ) : (
                  <span style={{ display: 'flex', gap: 7 }}>
                    <button className="kindbtn" onClick={() => place(it, 'mvp')} style={{ background: T.successSoft, color: T.success }}>{p5.flag(14)} MVP</button>
                    <button className="kindbtn" onClick={() => place(it, 'keyin')} style={{ background: T.grapeSoft, color: T.grape }}>{p5.layers(14)} Keyin</button>
                  </span>
                )}
              </div>
            );
          })}
        </div>
        {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Zo'r! <b>MVP</b> — ro'yxat, qidiruv, sahifa (do'kon ishlashi uchun shart). Savat, to'lov, AI — keyin qo'shiladi.</p></div>}
      </div>
    </Stage>
  );
};

// ===== SCREEN 9 — TEST 3 =====
const Screen9 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 2-savol"
    questionText="Mini-do'kon MVP'siga (birinchi versiya) qaysi feature kiradi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Mini-do'kon <span className="italic" style={{ color: T.accent }}>MVP</span>'siga qaysi feature kiradi?</h2></>}
    options={['AI tavsiya tizimi', 'Mahsulot ro\'yxati (rasm + narx)', 'Bonus ballar o\'yini', 'Mahsulotni 3D ko\'rish']} correctIdx={1}
    explainCorrect="To'g'ri! Do'kon ishlashi uchun avvalo mahsulot ro'yxati shart — odam ko'rmasa, sotib ololmaydi. Bu MVP o'zagi."
    explainWrong={{ 0: 'AI tavsiya — kuchli, lekin keyingi bosqich. Avval oddiy ro\'yxat ishlasin.', 2: 'Bonus o\'yin — bezak. MVP do\'kon ishlashi uchun shart narsa.', 3: '3D ko\'rish — keyinroq. Avval oddiy rasmli ro\'yxat yetarli.', default: 'MVPга mahsulot ro\'yxati kiradi — do\'kon ishlashi uchun shart.' }} />
);

// ===== SCREEN 10 — OG'IR FEATURE'NI BACKLOGGA KO'CHIRISH (debug + raketa) =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [found, setFound] = useState(!!storedAnswer);
  const [fixed, setFixed] = useState(!!storedAnswer);
  const done = fixed;
  const lines = [
    { key: 'list', text: 'Mahsulot ro\'yxati', sub: 'yengil · 2 kun', ok: true },
    { key: 'search', text: 'Qidiruv', sub: 'yengil · 1 kun', ok: true },
    { key: 'pay', text: 'Onlayn to\'lov tizimi', sub: 'OG\'IR · 2 oy, bank, xavfsizlik', ok: false },
    { key: 'detail', text: 'Mahsulot sahifasi', sub: 'yengil · 2 kun', ok: true }
  ];
  const clickLine = (k) => { if (found || fixed) return; if (k === 'pay') setFound(true); };
  const fix = () => setFixed(true);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Tuzatish" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : (found ? 'Endi ko\'chiring' : 'Og\'ir feature\'ni toping')} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bu MVP'da qaysi feature <span className="italic" style={{ color: T.accent }}>juda og'ir</span>?</h2></div>
        <Mentor>Bu MVP rejasiga 1 ta <b style={{ color: T.ink }}>og'ir</b> feature solib qo'yilgan — u oylab vaqt oladi va MVP'ni cho'ktiradi. Qaysi biri? O'sha qatorni bosing.</Mentor>
        <div className="split">
          <Col>
            <div className="ai-card fade-up delay-1">
              <div className="ai-row"><span className="ai-badge">MVP REJA</span><span className="ai-bubble">{fixed ? 'Yengil — uchishga tayyor:' : 'Tekshiring:'}</span></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {lines.filter(l => !(fixed && l.key === 'pay')).map(l => {
                  const bad = found && !fixed && l.key === 'pay';
                  return (<div key={l.key} onClick={() => clickLine(l.key)} style={{ cursor: (found || fixed) ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: 9, background: bad ? T.accentSoft : T.bg, borderRadius: 10, padding: '9px 12px', boxShadow: bad ? `inset 0 0 0 1.5px ${T.accent}` : 'none', transition: 'all 0.18s' }}><span style={{ color: l.ok ? T.success : T.accent, display: 'inline-flex' }}>{l.ok ? p5.flag(15) : p5.box(15)}</span><div style={{ flex: 1 }}><span style={{ fontFamily: G, fontSize: 13.5, color: T.ink, display: 'block' }}>{l.text}</span><span className="mono" style={{ fontSize: 10, color: l.ok ? T.ink3 : T.accent, fontWeight: l.ok ? 400 : 700 }}>{l.sub}</span></div></div>);
                })}
                {fixed && <div className="fade-step" style={{ display: 'flex', alignItems: 'center', gap: 9, background: T.grapeSoft, borderRadius: 10, padding: '9px 12px' }}><span style={{ color: T.grape, display: 'inline-flex' }}>{p5.layers(15)}</span><div style={{ flex: 1 }}><span style={{ fontFamily: G, fontSize: 13.5, color: T.ink, display: 'block' }}>Onlayn to'lov tizimi</span><span className="mono" style={{ fontSize: 10, color: T.grape, fontWeight: 700 }}>→ Backlog (v3)ga ko'chdi</span></div></div>}
              </div>
              {found && !fixed && <button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={fix}>To'lovni Backlog (v3)ga ko'chirish</button>}
            </div>
          </Col>
          <Col>
            {!found && <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Eslang: MVP <b>tez</b> chiqishi kerak. Qaysi feature oylab vaqt oladi (bank, xavfsizlik)?</p></div>}
            {found && !fixed && <div className="frame-warn fade-step"><p className="note-h" style={{ color: T.accent }}>Topdingiz!</p><p className="body" style={{ margin: 0, color: T.ink }}>"Onlayn to'lov" — 2 oy ish, bank va xavfsizlik kerak. MVP'ni cho'ktiradi. Uni v3 backloggа ko'chiring — boshida naqd to'lov yetadi.</p></div>}
            {fixed && <div className="takeaway fade-step"><div className="ta-bulb" style={{ color: T.success, display: 'inline-flex' }}>{p5.rocket(36)}</div><p className="ta-h">MVP yengillashdi — uchishga tayyor! 🚀</p><p className="ta-sub">Og'ir feature'lar keyingi bosqichga</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — MVP UCHUN ENG MUHIM 3 TASINI TANLASH (build) =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const POOL = [
    { id: 'list', text: 'Mahsulot ro\'yxati', ic: Ico.list(16) },
    { id: 'detail', text: 'Mahsulot sahifasi', ic: Ico.page(16) },
    { id: 'search', text: 'Qidiruv', ic: Ico.search(16) },
    { id: 'cart', text: 'Savat', ic: Ico.cart(16) },
    { id: 'pay', text: 'Onlayn to\'lov', ic: Ico.card(16) },
    { id: 'ai', text: 'AI tavsiya', ic: p5.spark(16) }
  ];
  const CORRECT = ['list', 'detail', 'search'];
  const [chosen, setChosen] = useState(() => new Set(storedAnswer?.chosen || []));
  const allGood = chosen.size === 3 && CORRECT.every(c => chosen.has(c));
  const workRef = useRef(null);
  const toggle = (id) => {
    if (allGood) return;
    setChosen(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else if (n.size < 3) n.add(id); return n; });
  };
  useEffect(() => {
    if (!allGood) return;
    if (storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true, chosen: [...chosen] });
    if (typeof window !== 'undefined' && window.innerWidth < 768 && workRef.current) { const el = workRef.current; setTimeout(() => { if (el) el.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 360); }
  }, [allGood]);
  const mvpItems = POOL.filter(p => chosen.has(p.id)).map(p => ({ label: 'MVP', color: CODE.str, text: p.text }));
  while (mvpItems.length < 3) mvpItems.push({ label: 'MVP', color: '#6B7585', text: '', ph: 'bo\'sh slot…' });
  const badPick = chosen.size === 3 && !allGood;
  return (
    <Stage eyebrow="MVP yig'ish" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!allGood} label={allGood ? 'Davom etish' : (chosen.size < 3 ? `MVP uchun tanlang (${chosen.size}/3)` : 'Eng muhim 3 tasi?')} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">MVP'ga faqat <span className="italic" style={{ color: T.accent }}>3 ta joy</span> bor — eng muhimini tanlang</h2></div>
        <Mentor>6 feature, lekin MVP'ga faqat 3 ta sig'adi. Do'kon <b style={{ color: T.ink }}>ishlashi</b> uchun eng shart 3 tasini tanlang.</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <div className="split" ref={workRef}>
          <Col>
            <p className="flow-label">Feature'lar ({chosen.size}/3 tanlangan)</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {POOL.map(p => { const on = chosen.has(p.id); const full = chosen.size >= 3 && !on; return (
                <button key={p.id} onClick={() => toggle(p.id)} disabled={full && !allGood} style={{ display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', border: 'none', borderRadius: 11, padding: '11px 13px', cursor: full ? 'not-allowed' : 'pointer', background: on ? T.success : T.paper, color: on ? '#fff' : T.ink, opacity: full ? 0.45 : 1, boxShadow: on ? `0 7px 16px -7px ${T.success}` : `0 6px 16px -8px rgba(${T.shadowBase},0.16)`, transition: 'all 0.16s' }}><span style={{ display: 'inline-flex', color: on ? '#fff' : T.ink2 }}>{on ? Ico.check(16) : p.ic}</span><span style={{ flex: 1, fontFamily: "'Manrope'", fontWeight: 600, fontSize: 14 }}>{p.text}</span></button>
              ); })}
            </div>
          </Col>
          <Col>
            <p className="flow-label">v1 — MVP rejangiz</p>
            <SpecCard items={mvpItems} minH={180} title="MVP (v1)" icon={p5.flag(15)} />
            {badPick && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bu 3 ta do'konni ishlatmaydi. O'ylang: odam mahsulotni <b>ko'rishi, ochishi va topishi</b> kerak.</p></div>}
            {allGood && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana — ishlaydigan MVP! Ro'yxat + sahifa + qidiruv. Qolgani keyin qo'shiladi.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — TEST 4 =====
const Screen12 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="Nega hammasini birato'la qurish (katta v1) xato?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Nega hammasini <span className="italic" style={{ color: T.accent }}>birato'la</span> qurish xato?</h2></>}
    options={['Mahsulot tezroq chiqadi', 'Ko\'p resurs/vaqt ketadi va foydalanuvchi fikrini kech bilasiz', 'Arzonroq bo\'ladi', 'Xavfsizroq bo\'ladi']} correctIdx={1}
    explainCorrect="To'g'ri! Hammasini birato'la — oylab vaqt, ko'p resurs va katta risk. Eng yomoni: foydalanuvchi kerakmi-yo'qmi — buni juda kech bilasiz."
    explainWrong={{ 0: 'Aksincha — sekinroq chiqadi. Ko\'p feature = ko\'p vaqt.', 2: 'Qimmatroq: ko\'p ish, lekin foyda noaniq. MVP arzon va tez.', 3: 'Xavfliroq: katta loyiha cho\'kishi oson. Kichik MVP xavfsizroq.', default: 'Birato\'la qurish — ko\'p resurs/vaqt va foydalanuvchi fikrini kech bilasiz.' }} />
);

// ===== SCREEN 13 — NAMUNA: bosqichli backlog (mini-do'kon) =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const WHY = { v1: 'Bularsiz do\'kon umuman ishlamaydi — odam mahsulotni ko\'radi, ochadi, topadi va sotib oladi. Eng kichik ishlaydigan o\'zak.', v2: 'MVP chiqib, foydalanuvchi fikri kelgach: savat qulaylik, chat ishonch, sharh esa boshqalarga yordam beradi.', v3: 'Do\'kon o\'sgach, katta investitsiya talab qiladigan funksiyalar — to\'lov, yetkazish, AI. Endi ularga arziydi.' };
  const [seen, setSeen] = useState(storedAnswer ? new Set(VERSIONS.map(v => v.key)) : new Set());
  const isNarrow = useIsMobile(768);
  const [active, setActive] = useState(null);
  const done = seen.size >= VERSIONS.length;
  const tap = (k) => { setActive(k); setSeen(prev => { const n = new Set(prev); n.add(k); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = active ? VERSIONS.find(v => v.key === active) : null;
  return (
    <Stage eyebrow="Namuna" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Endi navbat sizga →' : `${seen.size}/3 bosqichni oching`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Tayyor backlog: har bosqich <span className="italic" style={{ color: T.accent }}>nega</span> shu yerda?</h2></div>
        <Mentor>Mana mini-do'konning to'g'ri bo'lingan <b style={{ color: T.ink }}>yo'l xaritasi</b>. Har bosqichni bosib, nega aynan shu yerda turishini ko'ring.</Mentor>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {VERSIONS.map(v => { const open = seen.has(v.key); return (<button key={v.key} onClick={() => tap(v.key)} style={{ textAlign: 'left', cursor: 'pointer', border: 'none', borderRadius: 12, padding: '11px 14px', background: T.paper, display: 'flex', flexDirection: 'column', gap: 5, borderLeft: `4px solid ${v.color}`, boxShadow: active === v.key ? `inset 0 0 0 2px ${v.color}, 0 8px 20px -8px ${v.color}44` : (open ? `0 6px 16px -8px rgba(${T.shadowBase},0.18)` : `0 6px 16px -8px rgba(${T.shadowBase},0.16)`), transition: 'all 0.18s' }}><span style={{ display: 'flex', alignItems: 'center', gap: 9 }}><span className="mono" style={{ fontSize: 12, fontWeight: 800, color: v.color }}>{v.label}</span>{open && <span style={{ marginLeft: 'auto', color: T.success, display: 'inline-flex' }}>{Ico.check(13)}</span>}</span><span style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>{v.feats.map(f => (<span key={f} style={{ fontFamily: G, fontSize: 11.5, color: T.ink2, background: T.bg, padding: '3px 8px', borderRadius: 6 }}>{f}</span>))}</span></button>); })}
            </div>
          </Col>
          <Col>
            {cur ? (<div className="sk-info fade-step" key={active}><span className="sk-tagbig"><span className="mono" style={{ fontSize: 12, fontWeight: 800, color: cur.color }}>{cur.label}</span></span><p className="body" style={{ color: T.ink, margin: '12px 0 0' }}>{WHY[cur.key]}</p></div>) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Bir bosqichni bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Har bosqich oldingisiga tayanadi va o'sib boradi. Endi o'z loyihangizni bo'lasiz.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — QOIDA =====
const Screen14 = ({ screen, onNext, onPrev }) => (
  <Stage eyebrow="Qoida" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Yakuniy ishga →" onClick={onNext} /></>}>
    <div className="screen">
      <div className="head"><h2 className="title h-title fade-up">Avval <span className="italic" style={{ color: T.accent }}>skeytbord</span> — keyin mashina</h2></div>
      <Mentor>Hammasini birato'la qurma. Avval eng kichik <b style={{ color: T.ink }}>ishlaydigan</b> versiya (MVP), keyin foydalanuvchi fikriga qarab bosqichma-bosqich o'stir.</Mentor>
      <div className="split">
        <Col>
          <div className="frame fade-up" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 'clamp(18px,2.6vw,26px)' }}>
            <span style={{ color: T.honey }}><Vehicle stage="skate" size={54} /></span>
            <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, margin: 0, color: T.ink, fontSize: 'clamp(18px,2.4vw,22px)' }}>MVP = skeytbord</p><p className="body" style={{ margin: '3px 0 0', color: T.ink2 }}>Kichik, lekin butun ishlaydigan narsa.</p></div>
          </div>
        </Col>
        <Col>
          <p className="flow-label">Dekompozitsiya — 3 qadam</p>
          <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[{ ic: Ico.list(18), c: T.honey, t: 'Feature LIST — hammasini sanab chiq' }, { ic: p5.flag(18), c: T.success, t: 'MVP — eng kichik ishlaydigan to\'plam' }, { ic: p5.layers(18), c: T.grape, t: 'BACKLOG — qolganini bosqichlarga qo\'y' }].map((s, i) => (<React.Fragment key={i}><div style={{ display: 'flex', alignItems: 'center', gap: 11, background: T.paper, borderRadius: 11, padding: '10px 13px', boxShadow: `0 5px 14px -8px rgba(${T.shadowBase},0.16)` }}><span style={{ color: s.c, display: 'inline-flex' }}>{s.ic}</span><span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, color: T.ink, fontSize: 13.5 }}>{s.t}</span></div>{i < 2 && <span style={{ color: T.ink3, textAlign: 'center', fontSize: 11 }}>↓</span>}</React.Fragment>))}
          </div>
        </Col>
      </div>
    </div>
  </Stage>
);

// ===== SCREEN 15 — YAKUNIY: o'z loyihangizni MVP vs Keyin =====
const emptyPlan = () => ({ mvp: ['', '', ''], keyin: ['', ''] });
const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [plan, setPlan] = useState(() => storedAnswer?.plan || emptyPlan());
  const mvpFilled = plan.mvp.filter(x => x.trim().length >= 3).length;
  const keyinFilled = plan.keyin.filter(x => x.trim().length >= 3).length;
  const passed = mvpFilled >= 2 && keyinFilled >= 1;
  const prevPassed = useRef(false);
  const workRef = useRef(null);
  useEffect(() => {
    if (passed && !prevPassed.current) {
      prevPassed.current = true;
      onAnswer(screen, { correct: true, plan, stage: 'final', screenIdx: screen });
      if (typeof window !== 'undefined' && window.innerWidth < 768 && workRef.current) { const el = workRef.current; setTimeout(() => { if (el) el.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 360); }
    }
  }, [passed]);
  const upd = (sec, i, v) => setPlan(prev => ({ ...prev, [sec]: prev[sec].map((x, idx) => (idx === i ? v : x)) }));
  const items = [];
  plan.mvp.forEach(x => { if (x.trim()) items.push({ label: 'MVP (hozir)', color: CODE.str, text: x }); });
  plan.keyin.forEach(x => { if (x.trim()) items.push({ label: 'KEYIN', color: '#C792EA', text: x }); });
  if (items.length === 0) items.push({ label: 'MVP (hozir)', color: '#6B7585', text: '', ph: 'feature yozing…' });
  const inputStyle = { width: '100%', fontFamily: G, fontSize: 13.5, color: T.ink, background: T.bg, border: 'none', borderRadius: 9, padding: '8px 11px', outline: 'none', boxSizing: 'border-box' };
  return (
    <Stage eyebrow="Yakuniy ish" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!passed} label={passed ? 'Davom etish' : `MVP ${mvpFilled}/2 · Keyin ${keyinFilled}/1`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">O'z loyihangizni <span className="italic" style={{ color: T.accent }}>MVP</span> va <span className="italic" style={{ color: T.grape }}>Keyin</span> ga bo'ling</h2></div>
        <Mentor>Mahsulotingiz feature'larini yozing. <b style={{ color: T.success }}>MVP</b> — hozir quriladigan eng kichik ishlaydigan to'plam. <b style={{ color: T.grape }}>Keyin</b> — backlogga.</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <div className="split" ref={workRef}>
          <Col>
            <div style={{ background: T.paper, borderRadius: 12, padding: '12px 13px', boxShadow: `0 6px 16px -9px rgba(${T.shadowBase},0.16)`, borderLeft: `4px solid ${T.success}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}><span style={{ color: T.success, display: 'inline-flex' }}>{p5.flag(16)}</span><span className="mono" style={{ fontSize: 11, fontWeight: 800, color: T.success, textTransform: 'uppercase' }}>MVP (hozir) — kamida 2</span></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>{plan.mvp.map((x, i) => (<input key={i} value={x} onChange={e => upd('mvp', i, e.target.value)} placeholder={`Shart feature ${i + 1}`} style={inputStyle} />))}</div>
            </div>
            <div style={{ background: T.paper, borderRadius: 12, padding: '12px 13px', boxShadow: `0 6px 16px -9px rgba(${T.shadowBase},0.16)`, borderLeft: `4px solid ${T.grape}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}><span style={{ color: T.grape, display: 'inline-flex' }}>{p5.layers(16)}</span><span className="mono" style={{ fontSize: 11, fontWeight: 800, color: T.grape, textTransform: 'uppercase' }}>Keyin (backlog) — kamida 1</span></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>{plan.keyin.map((x, i) => (<input key={i} value={x} onChange={e => upd('keyin', i, e.target.value)} placeholder={`Keyingi feature ${i + 1}`} style={inputStyle} />))}</div>
            </div>
          </Col>
          <Col>
            <p className="flow-label">Loyihangiz yo'l xaritasi</p>
            <SpecCard items={items} minH={188} title="Mening loyiham" />
            {passed && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Tayyor! Avval MVP'ni qurasiz, keyin backlogni bosqichma-bosqich ochasiz. Demo Day'da shu rejani aytasiz.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — YAKUN + DEMO DAY =====
const Screen16 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const RECAP = ['Dekompozitsiya — katta g\'oyani feature\'larga bo\'lish', 'MVP — eng kichik ishlaydigan versiya (skeytbord)', 'Backlog — qolgani bosqichma-bosqich (v2, v3)', 'Hammasini birato\'la qurma — avval sinab ko\'r'];
  const HOMEWORK = [{ b: 'Sevimli ilovangizni o\'ylang', t: '— uning MVP\'si nima bo\'lgan deb taxmin qiling' }, { b: 'Loyihangiz feature listini yozing', t: '— hammasini sanab, MVP vs Keyin ga bo\'ling' }, { b: 'Demo Day\'ga tayyorlaning', t: '— "men avval MVP\'ni qildim" deb ayting' }];
  const GLOSSARY = [{ b: 'Dekompozitsiya', t: '— katta narsani kichik bo\'laklarga ajratish' }, { b: 'MVP', t: '— eng kichik ishlaydigan versiya' }, { b: 'Feature list', t: '— barcha mumkin funksiyalar ro\'yxati' }, { b: 'Backlog', t: '— keyin qilinadigan ishlar navbati' }, { b: 'Iteratsiya', t: '— versiyama-versiya o\'sish (v1→v2→v3)' }];
  const correct = SCORED_IDX.filter(i => answers[i]?.correct).length;
  const total = SCORED_IDX.length;
  const PASSED = (total ? correct / total : 0) >= 0.6;
  const [open, setOpen] = useState(false);
  const glossRef = useRef(null);
  const isNarrow = useIsMobile(768);
  const toggleGloss = () => setOpen(o => { const nv = !o; if (nv && isNarrow) setTimeout(() => { if (glossRef.current) glossRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 80); return nv; });
  return (
    <Stage eyebrow="Tayyor" screen={screen} navContent={<><NavBack onPrev={onPrev} /><button className="btn-ghost" onClick={onReset} style={{ padding: 'clamp(11px,1.6vw,13px) clamp(16px,2.2vw,22px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Qaytadan</button><button className="btn-white-accent" onClick={onFinish} style={{ marginLeft: 'auto', padding: 'clamp(11px,1.6vw,13px) clamp(22px,2.6vw,30px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Yakunlash</button></>}>
      <div className="screen">
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">{Ico.check(11)}</span> PM bloki tugadi</span><h2 className="title h-title fade-up d1">Endi siz katta g'oyani <span className="italic" style={{ color: T.accent }}>bosqichlarga</span> bo'lasiz.</h2><p className="body h-sub fade-up d2">{PASSED ? 'Tabriklaymiz! MVP, backlog va bosqichma-bosqich o\'sishni o\'rgandingiz. Demo Day\'ga tayyorsiz!' : 'Yaxshi harakat! Bir-ikki joyni mustahkamlash uchun darsni qayta ko\'ring.'}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(15)}</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck" style={{ display: 'inline-flex' }}>{Ico.check(15)}</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>Demo Day'ga tayyorgarlik</div><p className="body" style={{ margin: '0 0 10px', color: T.ink }}>Dekompozitsiya ko'nikmangizni mashq qiling:</p><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">Demo Day — o'z mahsulotingiz MVP'sini qurib taqdim qilasiz! 🛹→🚗</p></div>
        </div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function PmLesson5({ lang: langProp, onFinished }) {
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
    const finalCorrect = SCREEN_META.map((s, i) => (s.scored && s.scope === 'final' ? answers[i] : null)).filter(Boolean).filter(a => a.correct).length;
    const payload = {
      lessonId: LESSON_META.lessonId, lessonTitle: LESSON_META.lessonTitle,
      durationSec: Math.floor((Date.now() - startTimeRef.current) / 1000),
      totalQuestions: scoredMeta.length, correctAnswers,
      scorePercent: scoredMeta.length ? Math.round((correctAnswers / scoredMeta.length) * 100) : 0,
      finalScore: finalCorrect, finalTotal: finalMeta.length,
      passed: finalMeta.length ? finalCorrect / finalMeta.length >= 0.6 : (scoredMeta.length ? correctAnswers / scoredMeta.length >= 0.6 : false),
      answers: SCREEN_META.map((_s, i) => answers[i]).filter(Boolean)
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
        .fade-up { animation: fade-in-up 0.45s cubic-bezier(.2,.7,.2,1) forwards; opacity: 0; }
        .delay-1 { animation-delay: 0.12s; } .delay-2 { animation-delay: 0.24s; } .delay-3 { animation-delay: 0.36s; } .delay-4 { animation-delay: 0.48s; }
        @keyframes fade-step { from { opacity: 0; transform: translateY(7px); } to { opacity: 1; transform: translateY(0); } }
        .fade-step { animation: fade-step 0.34s cubic-bezier(.2,.7,.2,1); }
        .d1 { animation-delay: 0.12s; } .d2 { animation-delay: 0.24s; } .d3 { animation-delay: 0.36s; } .d4 { animation-delay: 0.48s; }

        /* PM5 — transport / evolyutsiya / resurs */
        @keyframes roll { 0%,100% { transform: translateX(-4px); } 50% { transform: translateX(4px); } }
        .roll { animation: roll 1.8s ease-in-out infinite; display: inline-flex; }
        @keyframes veh-pop { 0% { transform: scale(.78) translateY(6px); opacity: 0; } 60% { transform: scale(1.05); } 100% { transform: scale(1); opacity: 1; } }
        .veh-pop { animation: veh-pop .4s cubic-bezier(.2,.7,.2,1); }
        @keyframes ver-in { from { opacity: 0; transform: translateX(14px); } to { opacity: 1; transform: none; } }
        .ver-in { animation: ver-in .45s cubic-bezier(.2,.7,.2,1); }
        @keyframes feat-pop { 0% { transform: scale(.82); opacity: 0; } 60% { transform: scale(1.05); } 100% { transform: scale(1); opacity: 1; } }
        .feat-pop { animation: feat-pop .34s cubic-bezier(.2,.7,.2,1); }
        @keyframes shake { 0%,100% { transform: none; } 20% { transform: translateX(-4px); } 40% { transform: translateX(4px); } 60% { transform: translateX(-3px); } 80% { transform: translateX(3px); } }
        .shake-x { animation: shake 0.42s; }
        .meter-track { height: 12px; border-radius: 99px; background: rgba(167,166,162,0.22); overflow: hidden; }
        .meter-fill { height: 100%; border-radius: 99px; transition: width 0.5s cubic-bezier(.4,0,.2,1), background 0.3s; }
        .meter-fill.over { animation: meter-pulse 1s ease-in-out infinite; }
        @keyframes meter-pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.62; } }

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
        .kindbtn { font-family: 'Manrope'; font-weight: 700; font-size: 12.5px; border: none; border-radius: 99px; padding: 8px 14px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: all 0.16s; }
        .kindbtn:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 6px 14px -6px rgba(${T.shadowBase},0.28); }

        /* === OPSIYALAR === */
        .option { background: ${T.paper}; cursor: pointer; transition: all 0.2s; font-family: 'Manrope', sans-serif; font-weight: 500; text-align: left; border-radius: 12px; width: 100%; border: none; color: ${T.ink}; box-shadow: 0 6px 16px -7px rgba(${T.shadowBase},0.16); }
        .option:hover:not(:disabled) { background: #FDFBF7; transform: translateY(-1px); box-shadow: 0 12px 24px -8px rgba(${T.shadowBase},0.22); }
        .option:disabled { cursor: default; }
        .option-correct { background: ${T.successSoft} !important; color: ${T.success} !important; box-shadow: 0 8px 22px -8px rgba(31,122,77,0.32) !important; }
        .option-wrong { background: ${T.paper} !important; color: ${T.ink3} !important; opacity: 0.5 !important; box-shadow: none !important; }
        .option-picked-wrong { background: ${T.accentSoft} !important; color: ${T.accent} !important; box-shadow: 0 8px 22px -8px rgba(255,79,40,0.34) !important; }

        .chip { font-family: 'Manrope', sans-serif; font-weight: 600; font-size: clamp(13px,1.6vw,15px); display: inline-flex; align-items: center; gap: 7px; padding: 9px 16px; border-radius: 99px; border: none; background: ${T.paper}; color: ${T.ink}; cursor: pointer; transition: all 0.18s; box-shadow: 0 4px 12px -6px rgba(${T.shadowBase},0.2); }
        .chip:hover:not(:disabled) { transform: translateY(-1px); }
        .chip-on { background: ${T.accent}; color: #fff; box-shadow: 0 6px 16px -5px rgba(255,79,40,0.4); }

        /* === MENTOR === */
        .mentor { display: flex; gap: 12px; align-items: flex-start; }
        .mentor-ava { width: 40px; height: 40px; border-radius: 50%; overflow: hidden; flex-shrink: 0; box-shadow: 0 4px 12px -4px rgba(${T.shadowBase},0.28); }
        .mentor-ava svg { display: block; }
        .mentor-col { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5px; }
        .mentor-name { font-family: 'Manrope', sans-serif; font-weight: 700; font-size: 13px; color: ${T.accent}; letter-spacing: 0.01em; }
        .mentor-msg { background: ${T.paper}; border-radius: 4px 14px 14px 14px; padding: 13px 16px; color: ${T.ink}; box-shadow: 0 6px 18px -7px rgba(${T.shadowBase},0.16); }

        /* === HOOK OPSIYALARI === */
        .hook-option { display: flex; align-items: center; gap: 13px; width: 100%; text-align: left; background: ${T.paper}; border: none; border-radius: 12px; padding: clamp(13px,1.9vw,16px) clamp(15px,2.2vw,18px); font-family: 'Manrope', sans-serif; font-weight: 500; font-size: clamp(14px,1.7vw,16px); color: ${T.ink}; cursor: pointer; transition: all 0.18s; box-shadow: 0 6px 16px -7px rgba(${T.shadowBase},0.16); }
        .hook-option:hover:not(:disabled):not(.on) { transform: translateY(-1px); box-shadow: 0 12px 24px -8px rgba(${T.shadowBase},0.22); }
        .hook-option.on { background: ${T.accentSoft}; color: ${T.accent}; box-shadow: 0 8px 22px -8px rgba(255,79,40,0.3), inset 0 0 0 1.5px ${T.accent}; }
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
        .flow-label { font-family: 'Manrope'; font-weight: 700; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: ${T.ink2}; }
        .demo-swap { animation: fade-step 0.34s cubic-bezier(.2,.7,.2,1); }

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
        .frame { background: ${T.paper}; border-radius: 16px; padding: clamp(16px,3vw,24px); border: none; box-shadow: 0 8px 22px -7px rgba(${T.shadowBase},0.14); }
        .frame-soft { background: ${T.accentSoft}; border-left: 4px solid ${T.accent}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); box-shadow: 0 6px 16px -8px rgba(255,79,40,0.22); }
        .frame-success { background: ${T.successSoft}; border-left: 4px solid ${T.success}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); box-shadow: 0 6px 16px -8px rgba(31,122,77,0.22); }
        .frame-warn { background: ${T.accentSoft}; border-left: 4px solid ${T.accent}; border-radius: 12px; padding: 12px 15px; }
        .frame-dash { border: 1.5px dashed ${T.ink3}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); }

        /* === SPEC CARD (qora — reja) === */
        .spec-card { background: ${CODE.bg}; border-radius: 14px; padding: 16px 17px; box-shadow: 0 12px 30px -10px rgba(${T.shadowBase},0.3); display: flex; flex-direction: column; gap: 12px; }
        .spec-head { display: flex; align-items: center; gap: 8px; padding-bottom: 9px; border-bottom: 1px solid #ffffff18; }
        .spec-title { font-family: 'JetBrains Mono'; font-size: 10.5px; letter-spacing: 0.12em; text-transform: uppercase; color: #9FB4D8; }
        .spec-lbl { font-family: 'JetBrains Mono'; font-size: 10px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; }
        .spec-text { font-family: 'Georgia, serif'; font-size: clamp(13px,1.7vw,15px); line-height: 1.5; margin: 3px 0 0; }

        /* === LAYOUT === */
        .screen { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: clamp(14px,2vw,20px); }
        .head { display: flex; flex-direction: column; gap: 6px; }
        .split { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: clamp(18px,3vw,36px); align-items: start; }
        .col { display: flex; flex-direction: column; gap: clamp(12px,2vw,16px); min-width: 0; }
        @media (max-width: 760px) { .split { grid-template-columns: 1fr; gap: clamp(14px,3vw,20px); } }

        /* === ROADMAP === */
        .roadmap { display: flex; flex-direction: column; gap: 8px; list-style: none; }
        .step-card { display: flex; align-items: center; gap: 14px; background: ${T.paper}; border-radius: 12px; padding: 13px 16px; box-shadow: 0 5px 14px -7px rgba(${T.shadowBase},0.16); }
        .step-num { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 13px; color: ${T.accent}; flex-shrink: 0; }
        .step-body { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .step-text { font-weight: 500; font-size: clamp(14px,1.7vw,16px); color: ${T.ink}; }
        .step-tag { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink2}; background: ${T.bg}; padding: 3px 8px; border-radius: 6px; }

        /* === SK-INFO === */
        .sk-info { background: ${T.paper}; border-radius: 12px; padding: 16px 18px; box-shadow: 0 8px 20px -8px rgba(${T.shadowBase},0.16); animation: fade-step 0.34s; }
        .sk-tagbig { display: flex; align-items: center; gap: 9px; flex-wrap: wrap; }
        .sk-wordbadge { font-family: 'Manrope'; font-weight: 700; font-size: 13px; color: ${T.accent}; background: ${T.accentSoft}; padding: 4px 10px; border-radius: 6px; }
        .hint { background: ${T.bg}; border: 1.5px dashed ${T.ink3}; border-radius: 12px; padding: 14px 16px; font-size: clamp(13px,1.5vw,14px); color: ${T.ink2}; }

        /* === AI CARD / TAKEAWAY === */
        .ai-card { background: ${T.paper}; border-radius: 14px; padding: 15px 17px; display: flex; flex-direction: column; gap: 11px; box-shadow: 0 8px 20px -8px rgba(${T.shadowBase},0.14); }
        .ai-row { display: flex; align-items: center; gap: 9px; } .ai-badge { font-family: 'Manrope'; font-weight: 800; font-size: 11px; color: #fff; background: ${T.blue}; padding: 3px 9px; border-radius: 6px; } .ai-bubble { font-size: 13px; color: ${T.ink2}; }
        .note-h { font-weight: 700; font-size: 13px; margin: 0 0 4px; }
        .takeaway { background: ${T.successSoft}; border-radius: 14px; padding: 22px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 6px; } .ta-h { font-family: 'Source Serif 4', serif; font-weight: 600; font-size: clamp(16px,2.2vw,20px); color: ${T.ink}; margin: 0; } .ta-sub { color: ${T.success}; font-weight: 600; font-size: 13px; margin: 0; }

        /* === YAKUN === */
        .hero { display: flex; align-items: center; justify-content: space-between; gap: 24px; flex-wrap: wrap; }
        .hero-l { flex: 1; min-width: 240px; display: flex; flex-direction: column; gap: 8px; }
        .done-chip { display: inline-flex; align-items: center; gap: 7px; align-self: flex-start; font-family: 'Manrope'; font-weight: 700; font-size: 12px; color: ${T.success}; background: ${T.successSoft}; padding: 5px 12px; border-radius: 99px; } .done-chip .tick { display: inline-flex; }
        .ring-wrap { position: relative; width: 128px; height: 128px; flex-shrink: 0; }
        .ring-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .ring-num { font-family: 'Fraunces', serif; font-size: 30px; font-weight: 400; line-height: 1; } .ring-den { color: ${T.ink3}; font-size: 20px; } .ring-lbl { font-size: 10px; color: ${T.ink2}; text-transform: uppercase; letter-spacing: 0.08em; margin-top: 3px; }
        .card { background: ${T.paper}; border-radius: 16px; padding: 18px 20px; box-shadow: 0 8px 22px -7px rgba(${T.shadowBase},0.14); }
        .card-lbl { display: flex; align-items: center; gap: 8px; font-family: 'Manrope'; font-weight: 700; font-size: 13px; margin-bottom: 11px; }
        .recap { display: flex; flex-direction: column; gap: 8px; list-style: none; } .recap li { display: flex; align-items: flex-start; gap: 10px; font-size: clamp(13px,1.6vw,15px); color: ${T.ink}; animation: fade-in-up 0.4s ease-out forwards; opacity: 0; } .recap .ck { color: ${T.success}; flex-shrink: 0; margin-top: 1px; }
        .hw ul { display: flex; flex-direction: column; gap: 6px; list-style: none; } .hw li { font-size: clamp(13px,1.6vw,15px); color: ${T.ink}; } .hw li b { color: ${T.accent}; } .hw .t { color: ${T.ink2}; } .hw-note { margin: 11px 0 0; font-size: 12px; color: ${T.accent}; font-weight: 600; }
        .gloss { background: ${T.paper}; border-radius: 12px; box-shadow: 0 6px 16px -7px rgba(${T.shadowBase},0.12); overflow: hidden; }
        .gloss-head { display: flex; align-items: center; justify-content: space-between; padding: 13px 17px; cursor: pointer; } .gloss-head .lbl { font-family: 'Manrope'; font-weight: 700; font-size: 13px; color: ${T.ink}; } .gloss-toggle { font-size: 18px; color: ${T.ink2}; }
        .gloss-body { padding: 0 17px 15px; font-size: clamp(12.5px,1.5vw,14px); color: ${T.ink2}; line-height: 1.7; animation: fade-step 0.3s; } .gloss-body b { color: ${T.ink}; }

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
