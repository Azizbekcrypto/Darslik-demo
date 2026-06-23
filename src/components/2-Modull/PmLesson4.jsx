import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import mentorImg from '../../assets/common/mentor.png';

// ============================================================
// PM 4-DARS — MUAMMO → YECHIM (Problem → Solution) — PLATFORM STANDARD v16
// G'oya: har bir feature (funksiya) — bitta REAL foydalanuvchi og'rig'iga dori.
// Markaziy qoida: "Muammosiz yechim" qurilmaydi. Og'riq bo'lmasa — feature ham kerak emas.
// Metafora: DORI (painkiller) vs SHIRINLIK (vitamin) — yopadigan og'riq bormi?
// JS bog'lanish: feature = funksiya (kirish: og'riq → chiqish: yechim).
// Misollar: o'quvchilar kunda ishlatadigan ilovalar (Instagram, TikTok, Telegram, YouTube).
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
const G = "Georgia, serif"; // "haqiqiy sayt" ko'rinishi uchun

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

// ===== IKONKALAR — abstrakt tushunchalar uchun chiziq, real ilovalar uchun rangli brend belgilari =====
const sv = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' };
const Ico = {
  user: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><circle cx="12" cy="8" r="3.6" /><path d="M5 20c0-3.6 3.2-5.8 7-5.8s7 2.2 7 5.8" /></svg>),
  problem: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><circle cx="12" cy="12" r="9" /><path d="M9.6 9.3a2.4 2.4 0 1 1 3.3 2.2c-.7.4-1 .9-1 1.7" /><path d="M12 16.7h.01" /></svg>),
  solution: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M9.5 18h5" /><path d="M10 21h4" /><path d="M12 3a6 6 0 0 0-3.8 10.7c.7.6 1 1.1 1 1.8h5.6c0-.7.3-1.2 1-1.8A6 6 0 0 0 12 3z" /></svg>),
  arrow: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv} strokeWidth={1.9}><path d="M4 12h14" /><path d="M13 6l6 6-6 6" /></svg>),
  check: (s = 18) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv} strokeWidth={2.3}><path d="M20 6L9 17l-5-5" /></svg>),
  x: (s = 18) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv} strokeWidth={2.2}><path d="M6 6l12 12M18 6L6 18" /></svg>),
  search: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><circle cx="11" cy="11" r="7" /><path d="M21 21l-4.3-4.3" /></svg>),
  image: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><rect x="3" y="5" width="18" height="14" rx="2.5" /><circle cx="8.5" cy="10" r="1.6" /><path d="M21 16l-5-5-9 8" /></svg>),
  moon: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M21 12.8A8.5 8.5 0 1 1 11.2 3a6.5 6.5 0 0 0 9.8 9.8z" /></svg>),
  heart: (s = 22) => (<svg viewBox="0 0 24 24" width={s} height={s} {...sv}><path d="M12 20s-7-4.4-9.2-8.6C1.3 8.3 3 5 6.2 5c2 0 3 1.2 3.8 2.3C10.9 6.2 11.9 5 14 5c3.2 0 4.9 3.3 3.4 6.4C19.2 15.6 12 20 12 20z" /></svg>),
  // real ilovalar — o'z brend ranglari bilan
  instagram: (s = 26) => (<svg viewBox="0 0 24 24" width={s} height={s}><defs><linearGradient id="ig4" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stopColor="#FEDA75" /><stop offset="0.35" stopColor="#FA7E1E" /><stop offset="0.62" stopColor="#D62976" /><stop offset="1" stopColor="#962FBF" /></linearGradient></defs><rect x="2" y="2" width="20" height="20" rx="6" fill="url(#ig4)" /><circle cx="12" cy="12" r="4.4" fill="none" stroke="#fff" strokeWidth="2" /><circle cx="17.2" cy="6.8" r="1.25" fill="#fff" /></svg>),
  tiktok: (s = 26) => (<svg viewBox="0 0 24 24" width={s} height={s}><rect x="2" y="2" width="20" height="20" rx="6" fill="#010101" /><path d="M15.0 5.5c.2 1.5 1.1 2.6 2.7 2.8v2.2c-1 0-2-.3-2.7-.8v4c0 2.2-1.9 3.9-4.1 3.5-1.7-.3-2.9-1.7-3-3.4-.1-2.1 1.6-3.8 3.7-3.7v2.2c-.9-.1-1.7.6-1.6 1.6.1.7.7 1.3 1.4 1.3.9 0 1.5-.7 1.5-1.6V5.5z" fill="#69C9D0" /><path d="M15.7 5.5c.2 1.5 1.1 2.6 2.7 2.8v2.2c-1 0-2-.3-2.7-.8v4c0 2.2-1.9 3.9-4.1 3.5-1.7-.3-2.9-1.7-3-3.4-.1-2.1 1.6-3.8 3.7-3.7v2.2c-.9-.1-1.7.6-1.6 1.6.1.7.7 1.3 1.4 1.3.9 0 1.5-.7 1.5-1.6V5.5z" fill="#EE1D52" /><path d="M15.35 5.5c.2 1.5 1.1 2.6 2.7 2.8v2.2c-1 0-2-.3-2.7-.8v4c0 2.2-1.9 3.9-4.1 3.5-1.7-.3-2.9-1.7-3-3.4-.1-2.1 1.6-3.8 3.7-3.7v2.2c-.9-.1-1.7.6-1.6 1.6.1.7.7 1.3 1.4 1.3.9 0 1.5-.7 1.5-1.6V5.5z" fill="#fff" /></svg>),
  telegram: (s = 26) => (<svg viewBox="0 0 24 24" width={s} height={s}><circle cx="12" cy="12" r="11" fill="#29A9EB" /><path d="M17.9 7.2l-2.05 9.4c-.15.68-.56.84-1.13.52l-3.1-2.28-1.5 1.44c-.16.16-.3.3-.62.3l.22-3.1 5.68-5.13c.25-.22-.05-.34-.38-.12l-7 4.42-3.02-.94c-.66-.2-.67-.66.14-.97l11.8-4.55c.55-.2 1.03.13.98.49z" fill="#fff" /></svg>),
  youtube: (s = 26) => (<svg viewBox="0 0 24 24" width={s} height={s}><rect x="2" y="5" width="20" height="14" rx="4.2" fill="#FF0000" /><path d="M10 8.6v6.8L15.8 12z" fill="#fff" /></svg>)
};

// PM-4 belgilar: dori / shirinlik / uchqun / chaqmoq
const p4sv = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round' };
const p4 = {
  pill: (s = 18) => (<svg viewBox="0 0 24 24" width={s} height={s} {...p4sv}><rect x="2.5" y="8.5" width="19" height="7" rx="3.5" transform="rotate(-45 12 12)" /><path d="M8.3 8.3l7.4 7.4" /></svg>),
  candy: (s = 18) => (<svg viewBox="0 0 24 24" width={s} height={s} {...p4sv}><circle cx="12" cy="12" r="3.9" /><path d="M8.2 10.3L4.6 8.2v7.6l3.6-2.1M15.8 10.3l3.6-2.1v7.6l-3.6-2.1" /></svg>),
  spark: (s = 18) => (<svg viewBox="0 0 24 24" width={s} height={s} {...p4sv}><path d="M12 3.2v3.4M12 17.4v3.4M3.2 12h3.4M17.4 12h3.4M6.1 6.1l2.4 2.4M15.5 15.5l2.4 2.4M17.9 6.1l-2.4 2.4M8.5 15.5l-2.4 2.4" /></svg>),
  bolt: (s = 18) => (<svg viewBox="0 0 24 24" width={s} height={s} {...p4sv}><path d="M13 2.5L4.5 13.5H10l-1 8 9.5-12.5H13z" /></svg>)
};

const LESSON_META = { lessonId: 'pm-problem-solution-04-v16', lessonTitle: { uz: 'Muammo → Yechim', ru: 'Проблема → Решение' } };
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

// ===== KONSEPT LEKSIKONI — har ekranda qayta ishlatiladi =====
// Real ilovalar: og'riq → feature (yechim)
const APPS = {
  instagram: { ic: Ico.instagram(26), name: 'Instagram', pain: 'Chiroyli lahzangizni do\'stlaringizga ko\'rsatish qiyin edi.', feature: 'Rasm va Story — bir bosishda hammaga ulashasiz.' },
  tiktok: { ic: Ico.tiktok(26), name: 'TikTok', pain: 'Zerikkanda nima ko\'rishni bilmaysiz, vaqt o\'tmaydi.', feature: 'Cheksiz qisqa video oqimi — o\'zi didingizga moslashadi.' },
  telegram: { ic: Ico.telegram(26), name: 'Telegram', pain: 'Uzoqdagi do\'st bilan tez, bepul gaplashish qiyin.', feature: 'Bir zumda xabar, rasm va ovoz — bepul yuborasiz.' },
  youtube: { ic: Ico.youtube(26), name: 'YouTube', pain: 'Biror narsani o\'rganmoqchisiz, lekin qayerdan?', feature: 'Istalgan mavzuda video — istalgan vaqtda, bepul.' }
};

// Saralash: DORI (og'riqni yopadi) vs SHIRINLIK (shunchaki bezak)
const SORT_ITEMS = [
  { id: 'rasm', text: 'Rasm yuborish', sub: 'Do\'st mahsulotni ko\'radi, ishonadi', kind: 'dori', ic: Ico.image(17) },
  { id: 'qidiruv', text: 'Qidiruv', sub: 'Kerakli narsani tez topadi', kind: 'dori', ic: Ico.search(17) },
  { id: 'logo3d', text: 'Logoni 3D aylantirish', sub: 'Hech qanday og\'riqni yopmaydi', kind: 'shirinlik', ic: p4.spark(17) },
  { id: 'oqildi', text: '"O\'qildi" belgisi ✓✓', sub: 'Xabarim yetdimi — bilinadi', kind: 'dori', ic: Ico.check(17) },
  { id: 'qor', text: 'Sahifada qor yog\'dirish', sub: 'Chiroyli, lekin keraksiz', kind: 'shirinlik', ic: p4.spark(17) },
  { id: 'shrift', text: '32 xil shrift', sub: 'Foydalanuvchiga yordam bermaydi', kind: 'shirinlik', ic: p4.candy(17) }
];

// Og'riq ↔ feature juftliklari
const PAIRS = [
  { id: 'rasm', pain: 'Xaridor mahsulotni ko\'rmasdan ishonmaydi', feat: 'Rasm yuklash', ic: Ico.image(17), color: T.blue },
  { id: 'qidiruv', pain: 'Minglab e\'lon ichidan keraklisini topolmaydi', feat: 'Qidiruv', ic: Ico.search(17), color: T.honey },
  { id: 'oqildi', pain: 'Xabarim yetib bordimi — bilmayman', feat: '"O\'qildi" belgisi', ic: Ico.check(17), color: T.success },
  { id: 'tungi', pain: 'Kechasi ekran ko\'zni qamashtiradi', feat: 'Tungi rejim', ic: Ico.moon(17), color: T.grape }
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
        <img src={mentorImg} alt="" />
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

// Mobil: Mentor yopilganda ish maydonini ko'rsatadi (avtoskroll)
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

// ===== SIGNATURE ANIMATSIYA: og'riq pulsi (qizil throb → yashil tinchlanadi) =====
const PainPulse = ({ ok, shake, size = 66 }) => (
  <span className="pp" data-ok={ok ? 'true' : 'false'} data-shake={shake ? 'true' : 'false'} style={{ width: size, height: size }}>
    <span className="pp-ring" />
    <span className="pp-ring r2" />
    <span className="pp-core">{ok ? Ico.check(22) : '!'}</span>
  </span>
);

// Qora "mahsulot rejasi" kartasi (teleprompter uslubi) — feature spetsifikatsiyasi
const SpecCard = ({ items, minH = 200, title = 'Mahsulot rejasi', icon }) => (
  <div className="spec-card" style={{ minHeight: minH }}>
    <div className="spec-head"><span style={{ display: 'inline-flex', color: '#9FB4D8' }}>{icon || p4.pill(15)}</span><span className="spec-title">{title}</span></div>
    {items.map((it, i) => (
      <div key={i} className={it.text ? 'feat-pop' : ''}>
        {it.label && <span className="spec-lbl" style={{ color: it.color || '#9FB4D8' }}>{it.label}</span>}
        <p className="spec-text" style={{ color: it.text ? '#E8E5DD' : '#6B7585', fontStyle: it.text ? 'normal' : 'italic' }}>{it.text || it.ph}</p>
      </div>
    ))}
  </div>
);

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

// ===== SCREEN 0 — HOOK =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [tried, setTried] = useState(null); // 'dori' | 'shirinlik'
  const [shake, setShake] = useState(false);
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const relieved = tried === 'dori';
  const OPTS = [
    { id: 'a', label: 'Chiroyliroq ko\'ringani uchun' },
    { id: 'b', label: 'Haqiqiy og\'riqni (muammoni) yopgani uchun' },
    { id: 'c', label: 'Farqi yo\'q, ikkalasi bir xil' }
  ];
  const tryF = (k) => { setTried(k); if (k === 'shirinlik') { setShake(true); setTimeout(() => setShake(false), 450); } };
  const pick = (id) => { if (picked !== null) return; setPicked(id); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: id, correct: true }); };
  return (
    <Stage eyebrow="Kirish" screen={screen} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 820 }}>Nega ba'zi ilovalarni <span className="italic" style={{ color: T.accent }}>har kuni</span> ochasiz, boshqalarini — bir marta ko'rib, unutasiz?</h1>
        <Mentor>Quyidagi <b style={{ color: T.ink }}>og'riqqa</b> ikkita feature'ni sinab ko'ring. Qaysi biri og'riqni yopadi?</Mentor>
        <Zoomable>
        <Split>
          <Col>
            <div className="frame fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 13, padding: 'clamp(18px,3vw,26px)' }}>
              <PainPulse ok={relieved} shake={shake} />
              <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', lineHeight: 1.5, color: T.ink, textAlign: 'center', margin: 0, fontStyle: 'italic' }}>
                {relieved ? '"Endi do\'stim lahzamni ko\'ryapti — yengildim!"' : '"Chiroyli lahzamni do\'stlarimga ko\'rsatolmayapman."'}
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                <button className="kindbtn" onClick={() => tryF('dori')} style={{ background: tried === 'dori' ? T.success : T.successSoft, color: tried === 'dori' ? '#fff' : T.success }}>{p4.pill(15)} Rasm yuborish</button>
                <button className="kindbtn" onClick={() => tryF('shirinlik')} style={{ background: tried === 'shirinlik' ? T.honey : T.honeySoft, color: tried === 'shirinlik' ? '#fff' : T.honey }}>{Ico.moon(15)} Tungi rejim (dark mode)</button>
              </div>
              {tried && <p className="small fade-step" style={{ margin: 0, textAlign: 'center', color: relieved ? T.success : T.ink2, fontWeight: 600 }}>{relieved ? 'Og\'riq yopildi — bu feature haqiqatan kerak.' : 'Og\'riq joyida qoldi — tungi rejim yaxshi feature, lekin bu og\'riqqa dori emas.'}</p>}
            </div>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Sizningcha, feature ilovani nega kerakli qiladi?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => { const on = picked === o.id; return (<button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null} onClick={() => pick(o.id)}><span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span></button>); })}
            </div>
            {picked !== null && <p className="hook-ack fade-step">Feature shunchaki chiroyli yoki zamonaviy bo'lgani uchun emas — <b>aniq bir og'riqni yopgani</b> uchun ishlatiladi. Buni <b>"dori" (painkiller)</b> deyiladi. Bugun shuni o'rganamiz.</p>}
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
    { text: 'Har feature bitta og\'riqqa javob beradi', tag: '' },
    { text: 'Dori (kerak) va shirinlik (bezak)ni ajratish', tag: '' },
    { text: 'Og\'riqni feature bilan moslashtirish', tag: '' },
    { text: 'Muammosiz yechimni topib, tuzatish', tag: 'mashq' },
    { text: 'O\'z mahsulotingiz uchun 3 og\'riq → yechim yozasiz', tag: 'amaliyot' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const Idea = ({ ic, h, t, c, d = 0 }) => (<div className="frame idea-card fade-up" style={{ animationDelay: `${d}s`, display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px' }}><IcoChip color={c} soft={c + '1c'}>{ic}</IcoChip><div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, color: T.ink, margin: 0, fontSize: 'clamp(16px,2.2vw,19px)' }}>{h}</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>{t}</p></div></div>);
  const IdeaBlock = (
    <Col>
      <p className="flow-label">Bugungi asosiy g'oya</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Idea ic={p4.pill(22)} c={T.success} h="FEATURE = DORI" t="Bitta og'riqni yopadi — shuning uchun kerak" d={0.1} />
        <Idea ic={p4.candy(22)} c={T.honey} h="BEZAK = SHIRINLIK" t="Chiroyli, lekin hech qanday og'riqni yopmaydi" d={0.24} />
      </div>
      <p className="mono small fade-up" style={{ color: T.accent, margin: 0, animationDelay: '0.38s' }}>→ Modul 2'da yozadigan har funksiya — bitta og'riqqa yechim</p>
    </Col>
  );
  const StepsBlock = (<Col><p className="flow-label">5 qadam</p><ol className="roadmap">{STEPS.map((s, i) => (<li key={i} className="step-card fade-up" style={{ animationDelay: `${0.08 + i * 0.05}s` }}><span className="step-num">{String(i + 1).padStart(2, '0')}</span><span className="step-body"><span className="step-text">{s.text}</span>{s.tag && <span className="step-tag">{s.tag}</span>}</span></li>))}</ol></Col>);
  return (
    <Stage eyebrow="Reja" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Boshlaymiz →" onClick={onNext} /></>}>
      <div className="screen">
        <div className="head"><h2 className="title h-title fade-up">Yechimni <span className="italic" style={{ color: T.accent }}>mahsulotga</span> aylantiramiz — har feature bitta og'riqni yopadi</h2></div>
        <Mentor>Modul 1'da topdik: <b style={{ color: T.ink }}>kim</b>, qanday <b style={{ color: T.ink }}>muammo</b>, qanday <b style={{ color: T.ink }}>yechim</b>. Endi shu yechimni <b style={{ color: T.ink }}>mahsulot</b>ga aylantiramiz. Mahsulot ko'plab <b style={{ color: T.ink }}>feature</b>'dan (funksiyadan) tuziladi — va har biri bitta haqiqiy og'riqni yopishi kerak.</Mentor>
        {!isNarrow ? (<Zoomable><Split>{IdeaBlock}{StepsBlock}</Split></Zoomable>) : !showSteps ? (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>{IdeaBlock}<button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>5 qadamni ko'rish</button></div>) : (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}><button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ G'oyani ko'rish</button>{StepsBlock}</div>)}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — REAL ILOVALAR: og'riq → feature =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const KEYS = Object.keys(APPS);
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(storedAnswer ? new Set(KEYS) : new Set());
  const isNarrow = useIsMobile(768);
  const done = seen.size >= KEYS.length;
  const tap = (k) => { setActive(k); setSeen(prev => { const n = new Set(prev); n.add(k); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Og'riq → feature" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/4 ko'ring`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Har kuni ochadigan ilovalaringiz — aslida qaysi <span className="italic" style={{ color: T.accent }}>og'riqni</span> yopadi?</h2></div>
        <Mentor>Har bir mashhur ilova — kimningdir og'rig'iga <b style={{ color: T.ink }}>dori</b>. Bittasini bosib, qaysi og'riqni qanday feature yopganini ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {KEYS.map(k => (<button key={k} onClick={() => tap(k)} style={{ display: 'flex', alignItems: 'center', gap: 9, cursor: 'pointer', border: 'none', borderRadius: 13, padding: '13px 12px', background: T.paper, boxShadow: active === k ? `inset 0 0 0 2px ${T.accent}, 0 8px 20px -7px rgba(255,79,40,0.22)` : `0 6px 16px -8px rgba(${T.shadowBase},0.16)`, transition: 'all 0.18s' }}><span style={{ display: 'inline-flex' }}>{APPS[k].ic}</span><span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 13.5, color: T.ink }}>{APPS[k].name}</span>{seen.has(k) && <span style={{ marginLeft: 'auto', color: T.success, display: 'inline-flex' }}>{Ico.check(13)}</span>}</button>))}
            </div>
          </Col>
          <Col>
            {active ? (
              <div className="sk-info fade-step" key={active}>
                <span className="sk-tagbig"><span style={{ display: 'inline-flex' }}>{APPS[active].ic}</span><span className="sk-wordbadge">{APPS[active].name}</span></span>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, margin: '13px 0 0' }}><span style={{ color: T.accent, display: 'inline-flex', marginTop: 1 }}>{Ico.problem(16)}</span><p className="body" style={{ margin: 0, color: T.ink2 }}><b style={{ color: T.accent }}>Og'riq:</b> {APPS[active].pain}</p></div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 9, margin: '8px 0 0' }}><span style={{ color: T.success, display: 'inline-flex', marginTop: 1 }}>{p4.pill(16)}</span><p className="body" style={{ margin: 0, color: T.ink }}><b style={{ color: T.success }}>Feature (dori):</b> {APPS[active].feature}</p></div>
              </div>
            ) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Bir ilovani bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Ko'rdingizmi — bironta ilova "shunchaki chiroyli" bo'lgani uchun emas, <b>og'riqni yopgani</b> uchun ishlatiladi.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — OG'RIQNI OLIB TASHLASAK (toggle) =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [hasPain, setHasPain] = useState(true);
  const [seen, setSeen] = useState(storedAnswer ? new Set(['on', 'off']) : new Set(['on']));
  const done = seen.size >= 2;
  const set = (v) => { setHasPain(v); setSeen(prev => { const n = new Set(prev); n.add(v ? 'on' : 'off'); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Og'riq = yurak" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Og'riq <span className="italic" style={{ color: T.accent }}>yo'qolsa</span> — feature hali ham kerakmi?</h2></div>
        <Mentor>"Rasm yuborish" feature'ini olaylik. <b style={{ color: T.ink }}>Og'riq bor</b> va <b style={{ color: T.ink }}>og'riq yo'q</b> holatini almashtirib ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${hasPain ? 'chip-on' : ''}`} onClick={() => set(true)}>Og'riq bor</button>
              <button className={`chip ${!hasPain ? 'chip-on' : ''}`} onClick={() => set(false)}>Og'riq yo'q</button>
            </div>
            <div key={hasPain ? 'on' : 'off'} className="demo-swap" style={{ background: T.paper, borderRadius: 14, padding: '18px 17px', boxShadow: `0 8px 20px -7px rgba(${T.shadowBase},0.16)`, borderLeft: `4px solid ${hasPain ? T.accent : T.ink3}`, display: 'flex', alignItems: 'center', gap: 14 }}>
              <PainPulse ok={!hasPain} size={56} />
              <div>
                <p style={{ fontFamily: G, fontSize: 'clamp(14px,1.9vw,16px)', lineHeight: 1.5, color: T.ink, margin: 0 }}>{hasPain ? '"Do\'stim mahsulotni ko\'rmayapti."' : '"Hammasi joyida — hech qanday muammo yo\'q."'}</p>
                <p className="small" style={{ margin: '6px 0 0', color: hasPain ? T.accent : T.ink3, fontWeight: 600 }}>{hasPain ? 'Rasm yuborish — bu og\'riqni yopadi' : 'Rasm yuborish — endi hech kimga kerak emas'}</p>
              </div>
            </div>
          </Col>
          <Col>
            {hasPain
              ? <div className="frame-success fade-step" key="p1"><p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: T.success, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Feature kerak</p><p className="body" style={{ margin: 0, color: T.ink }}>Og'riq bor — feature uni yopadi, foydalanuvchi rahmat aytadi.</p></div>
              : <div className="frame-warn fade-step" key="p2"><p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Feature behuda</p><p className="body" style={{ margin: 0, color: T.ink }}>Og'riq yo'q — feature qurish behuda mehnat. Hech kim ishlatmaydi.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Demak <b>og'riq — feature'ning yuragi</b>. Og'riq yo'qolsa, feature ham keraksiz bo'ladi.</p></div>}
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
    questionText="Feature qurishdan oldin nima aniq bo'lishi kerak?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Feature qurishdan <span className="italic" style={{ color: T.accent }}>oldin</span> nima aniq bo'lishi kerak?</h2></>}
    options={['Qaysi rangda bo\'lishi', 'Qaysi foydalanuvchi og\'rig\'ini (muammosini) yopishi', 'Nechta tugma bo\'lishi', 'Logosi qanday ko\'rinishi']} correctIdx={1}
    explainCorrect="To'g'ri! Har bir feature avval bitta aniq og'riqqa javob berishi kerak. Og'riq bo'lmasa — feature ham kerak emas."
    explainWrong={{ 0: 'Rang — bezak. Avval qaysi og\'riqni yopishini aniqlang.', 2: 'Tugmalar soni muhim emas. Muhimi — qaysi muammoni yechishi.', 3: 'Logo — tashqi ko\'rinish. Avval og\'riqni toping.', default: 'Avval feature qaysi og\'riqni yopishini aniqlang.' }} />
);

// ===== SCREEN 5 — SARALASH: dori yoki shirinlik? =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [placed, setPlaced] = useState(storedAnswer ? Object.fromEntries(SORT_ITEMS.map(it => [it.id, true])) : {});
  const [wrong, setWrong] = useState(null);
  const done = SORT_ITEMS.every(it => placed[it.id]);
  const place = (item, choice) => {
    if (placed[item.id]) return;
    if (choice === item.kind) { setPlaced(p => ({ ...p, [item.id]: true })); setWrong(null); }
    else { setWrong(item.id); setTimeout(() => setWrong(w => (w === item.id ? null : w)), 480); }
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cnt = Object.keys(placed).length;
  return (
    <Stage eyebrow="Saralash" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${cnt}/${SORT_ITEMS.length} saralang`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bu feature <span className="italic" style={{ color: T.success }}>dori</span>mi yoki <span className="italic" style={{ color: T.honey }}>shirinlik</span>mi?</h2></div>
        <Mentor>Har bir feature uchun tanlang: og'riqni yopsa — <b style={{ color: T.success }}>dori</b>, shunchaki bezak bo'lsa — <b style={{ color: T.honey }}>shirinlik</b>.</Mentor>
        <Zoomable>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {SORT_ITEMS.map(it => {
            const ok = placed[it.id]; const isWrong = wrong === it.id;
            return (
              <div key={it.id} className={isWrong ? 'shake-x' : ''} style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', background: ok ? (it.kind === 'dori' ? T.successSoft : T.honeySoft) : T.paper, borderRadius: 12, padding: '11px 14px', boxShadow: ok ? 'none' : `0 6px 16px -8px rgba(${T.shadowBase},0.16)`, transition: 'background 0.25s' }}>
                <span style={{ color: ok ? (it.kind === 'dori' ? T.success : T.honey) : T.ink2, display: 'inline-flex' }}>{it.ic}</span>
                <div style={{ flex: 1, minWidth: 140 }}>
                  <p style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 14, color: T.ink, margin: 0 }}>{it.text}</p>
                  <p className="small" style={{ margin: '1px 0 0', color: T.ink3 }}>{it.sub}</p>
                </div>
                {ok ? (
                  <span className="feat-pop" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: "'Manrope'", fontWeight: 700, fontSize: 12.5, color: it.kind === 'dori' ? T.success : T.honey }}>{it.kind === 'dori' ? p4.pill(15) : p4.candy(15)} {it.kind === 'dori' ? 'Dori' : 'Shirinlik'} {Ico.check(14)}</span>
                ) : (
                  <span style={{ display: 'flex', gap: 7 }}>
                    <button className="kindbtn" onClick={() => place(it, 'dori')} style={{ background: T.successSoft, color: T.success }}>{p4.pill(14)} Dori</button>
                    <button className="kindbtn" onClick={() => place(it, 'shirinlik')} style={{ background: T.honeySoft, color: T.honey }}>{p4.candy(14)} Shirinlik</button>
                  </span>
                )}
              </div>
            );
          })}
        </div>
        {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Zo'r! <b>Dori</b> — og'riqni yopadi, kerak. <b>Shirinlik</b> — chiroyli, lekin behuda. Mahsulotni doriga to'ldiring.</p></div>}
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 5b — TEST 2 =====
const Screen5b = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Tekshiruv"
    questionText="Quyidagilardan qaysi biri haqiqiy 'dori' (og'riqni yopadigan feature)?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Mustahkamlash</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Qaysi biri haqiqiy <span className="italic" style={{ color: T.success }}>dori</span>?</h2></>}
    options={['Logoni 3D aylantirish', 'Mahsulot rasmini yuklash — xaridor ko\'rib ishonadi', '32 xil shrift qo\'shish', 'Sahifada qor yog\'dirish animatsiyasi']} correctIdx={1}
    explainCorrect="To'g'ri! Rasm yuklash xaridorning 'ko'rmasdan ishonmayman' og'rig'ini yopadi — bu dori. Qolganlari shunchaki bezak (shirinlik)."
    explainWrong={{ 0: '3D logo — chiroyli, lekin hech qanday og\'riqni yopmaydi. Bu shirinlik.', 2: '32 shrift hech kimga yordam bermaydi — bu bezak.', 3: 'Qor animatsiyasi ko\'zga chiroyli, lekin muammo yechmaydi.', default: 'Dori — og\'riqni yopadigan feature. Rasm yuklash shunday.' }} />
);

// ===== SCREEN 6 — FEATURE TUG'ILISHI (stepper) =====
const BIRTH = [
  { key: 'ogriq', label: 'OG\'RIQ', color: T.accent, ic: Ico.problem(18), text: 'Xaridor mahsulotni ko\'rmasdan ishonmaydi.' },
  { key: 'savol', label: 'SAVOL', color: T.honey, ic: p4.spark(18), text: 'Buni qanday yopamiz?' },
  { key: 'feature', label: 'FEATURE', color: T.blue, ic: p4.bolt(18), text: 'Mahsulot rasmini yuklash imkoni.' },
  { key: 'natija', label: 'NATIJA', color: T.success, ic: Ico.heart(18), text: 'Xaridor ko\'radi, ishonadi, sotib oladi.' }
];
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [step, setStep] = useState(storedAnswer ? BIRTH.length : 0);
  const [running, setRunning] = useState(false);
  const timer = useRef(null);
  const isMobile = useIsMobile();
  const done = step >= BIRTH.length;
  useEffect(() => () => clearTimeout(timer.current), []);
  const run = () => { clearTimeout(timer.current); setStep(0); setRunning(true); const tick = (i) => { setStep(i); if (i < BIRTH.length) timer.current = setTimeout(() => tick(i + 1), 820); else setRunning(false); }; timer.current = setTimeout(() => tick(1), 350); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Feature tug'iladi" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Avval kuzating'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(8px,1.4vw,13px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Feature qayerdan <span className="italic" style={{ color: T.accent }}>tug'iladi</span>?</h2></div>
        <Mentor>Har bir yaxshi feature og'riqdan boshlanadi: <b style={{ color: T.ink }}>og'riq → savol → feature → natija</b>. Tugmani bosib kuzating.</Mentor>
        <Zoomable>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {BIRTH.map((s, i) => { const on = step > i; return (<React.Fragment key={s.key}><div className={on ? 'birth-on' : ''} style={{ display: 'flex', alignItems: 'center', gap: 11, background: T.paper, borderRadius: 11, padding: '9px 13px', opacity: on ? 1 : 0.4, boxShadow: on ? `0 7px 18px -10px rgba(${T.shadowBase},0.18)` : 'none', transition: 'all 0.45s' }}><IcoChip color={on ? s.color : T.ink3} soft={on ? s.color + '1c' : '#ECEAE5'} size={31}>{s.ic}</IcoChip><div style={{ minWidth: 0, flex: 1 }}><p style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: 12.5, letterSpacing: '0.04em', color: on ? s.color : T.ink3, margin: 0 }}>{s.label}</p>{on && <p style={{ fontFamily: G, fontStyle: 'italic', fontSize: 13, color: T.ink2, margin: '1px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: isMobile ? 'normal' : 'nowrap' }}>"{s.text}"</p>}</div>{on && <span style={{ color: T.success }} className="feat-pop">{Ico.check(15)}</span>}</div>{i < BIRTH.length - 1 && <div className={step === i + 1 ? 'arrow-live' : ''} style={{ display: 'flex', justifyContent: 'center', color: step > i + 1 ? T.success : T.ink3, transform: 'rotate(90deg)', lineHeight: 1, transition: 'color 0.3s' }}>{Ico.arrow(12)}</div>}</React.Fragment>); })}
        </div>
        <button className="btn" onClick={run} disabled={running} style={{ alignSelf: 'flex-start' }}>{running ? 'Tug\'ilmoqda…' : (done ? '↻ Yana ko\'rish' : 'Feature\'ni tug\'dirish')}</button>
        {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana — feature <b>og'riqdan tug'iladi</b>, bezakdan emas. Avval og'riq, keyin yechim.</p></div>}
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — DORIGA TO'LA vs SHIRINLIKKA TO'LA ilova (compare) =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [v, setV] = useState('dori');
  const [seen, setSeen] = useState(storedAnswer ? new Set(['dori', 'shirinlik']) : new Set(['dori']));
  const done = seen.size >= 2;
  const set = (x) => { setV(x); setSeen(prev => { const n = new Set(prev); n.add(x); return n; }); };
  const DORI = [{ label: 'FEATURE', color: CODE.str, text: 'Rasm yuklash — xaridor ko\'radi' }, { label: 'FEATURE', color: CODE.str, text: 'Qidiruv — keraklisini topadi' }, { label: 'FEATURE', color: CODE.str, text: '"O\'qildi" belgisi — xabar yetdi' }, { label: 'FEATURE', color: CODE.str, text: 'Tungi rejim — ko\'z og\'rimaydi' }];
  const SHIRINLIK = [{ label: 'BEZAK', color: '#FFCB6B', text: 'Logoni 3D aylantirish' }, { label: 'BEZAK', color: '#FFCB6B', text: '32 xil shrift' }, { label: 'BEZAK', color: '#FFCB6B', text: 'Qor yog\'dirish animatsiyasi' }, { label: 'BEZAK', color: '#FFCB6B', text: 'Salyut effekti' }];
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Qaysini ishlatasiz" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Ikki ilova — qaysi birini <span className="italic" style={{ color: T.accent }}>har kuni</span> ochasiz?</h2></div>
        <Mentor>Biri <b style={{ color: T.success }}>doriga</b> to'la (og'riqlarni yopadi), biri <b style={{ color: T.honey }}>shirinlikka</b> to'la (faqat bezak). Ikkalasini bosib solishtiring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${v === 'dori' ? 'chip-on' : ''}`} onClick={() => set('dori')}>Doriga to'la</button>
              <button className={`chip ${v === 'shirinlik' ? 'chip-on' : ''}`} onClick={() => set('shirinlik')}>Shirinlikka to'la</button>
            </div>
            <div key={v}><SpecCard items={v === 'dori' ? DORI : SHIRINLIK} minH={216} title={v === 'dori' ? 'Doriga to\'la ilova' : 'Shirinlikka to\'la ilova'} icon={v === 'dori' ? p4.pill(15) : p4.candy(15)} /></div>
          </Col>
          <Col>
            {v === 'dori'
              ? <div className="frame-success fade-step" key="d"><p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: T.success, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Har kuni ochiladi</p><p className="body" style={{ margin: 0, color: T.ink }}>Har feature bir og'riqni yopadi. Foydalanuvchi qaytib keladi, chunki unga <b>kerak</b>.</p></div>
              : <div className="frame-warn fade-step" key="s"><p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Bir marta ko'riladi</p><p className="body" style={{ margin: 0, color: T.ink }}>Chiroyli ko'rinadi, lekin hech qanday og'riqni yopmaydi. Bir marta "voy" deydi-yu, qaytmaydi.</p></div>}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mahsulotni <b>dori</b> ushlab turadi, shirinlik emas. Avval og'riqlarni yoping.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — MOSLASH: og'riq ↔ feature =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const FEATS = [
    { id: 'qidiruv', text: 'Qidiruv' },
    { id: 'rasm', text: 'Rasm yuklash' },
    { id: 'tungi', text: 'Tungi rejim' },
    { id: 'oqildi', text: '"O\'qildi" belgisi' }
  ];
  const [sel, setSel] = useState(null);
  const [matched, setMatched] = useState(storedAnswer ? Object.fromEntries(PAIRS.map(p => [p.id, true])) : {});
  const [wrong, setWrong] = useState(null);
  const done = Object.keys(matched).length >= PAIRS.length;
  const pickP = (id) => { if (matched[id]) return; setSel(id); setWrong(null); };
  const pickF = (id) => { if (!sel) return; if (id === sel) { setMatched(prev => ({ ...prev, [sel]: true })); setSel(null); setWrong(null); } else setWrong(id); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cardBtn = (extra) => ({ display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left', border: 'none', borderRadius: 12, padding: '12px 14px', fontFamily: "'Manrope',sans-serif", fontWeight: 500, fontSize: 'clamp(13px,1.5vw,14.5px)', color: T.ink, transition: 'all 0.18s', ...extra });
  return (
    <Stage eyebrow="Moslash" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${Object.keys(matched).length}/${PAIRS.length} moslang`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(12px,2vw,18px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Har bir <span className="italic" style={{ color: T.accent }}>og'riqni</span> uni yopadigan feature bilan ulang</h2></div>
        <Mentor>Avval <b style={{ color: T.ink }}>og'riqni</b>, keyin uni yopadigan <b style={{ color: T.ink }}>feature'ni</b> bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Og'riqlar</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {PAIRS.map(p => { const m = matched[p.id]; const on = sel === p.id; return (<button key={p.id} onClick={() => pickP(p.id)} disabled={m} style={cardBtn({ cursor: m ? 'default' : 'pointer', opacity: m ? 0.5 : 1, background: m ? T.successSoft : T.paper, boxShadow: on ? `inset 0 0 0 2px ${T.accent}, 0 8px 20px -7px rgba(255,79,40,0.22)` : `0 6px 16px -8px rgba(${T.shadowBase},0.16)` })}><span style={{ color: m ? T.success : T.accent, display: 'inline-flex', marginTop: 1 }}>{m ? Ico.check(17) : Ico.problem(17)}</span><span style={{ flex: 1 }}>{p.pain}</span></button>); })}
            </div>
          </Col>
          <Col>
            <p className="flow-label">Feature'lar (yechim)</p>
            <div className="fade-up delay-2" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {FEATS.map(f => { const m = matched[f.id]; const isWrong = wrong === f.id; return (<button key={f.id} onClick={() => pickF(f.id)} disabled={m || !sel} className={isWrong ? 'shake-x' : ''} style={cardBtn({ cursor: (m || !sel) ? 'default' : 'pointer', opacity: m ? 0.5 : (!sel ? 0.65 : 1), background: m ? T.successSoft : (isWrong ? T.accentSoft : T.paper), boxShadow: `0 6px 16px -8px rgba(${T.shadowBase},0.16)` })}><span style={{ color: m ? T.success : T.blue, display: 'inline-flex' }}>{m ? Ico.check(16) : p4.pill(16)}</span><span style={{ flex: 1, fontWeight: 600 }}>{f.text}</span></button>); })}
            </div>
            {wrong && !done && <p className="small" style={{ color: T.accent, margin: 0 }}>Bu feature boshqa og'riqni yopadi. Qaytadan urinib ko'ring.</p>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Zo'r! Har bir feature aniq bir og'riqqa to'g'ri keldi. Mana shu — <b>dori</b>.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 9 — TEST 3 =====
const Screen9 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 2-savol"
    questionText="Foydalanuvchi: 'Mahsulotni ko'rmasdan ishonmayman' deydi. Qaysi feature bu og'riqni yopadi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Og'riq: <span className="italic" style={{ color: T.accent }}>"ko'rmasdan ishonmayman"</span>. Qaysi feature yopadi?</h2></>}
    options={['Logoni kattalashtirish', 'Mahsulot rasmlarini yuklash', 'Sahifa rangini o\'zgartirish', 'Ko\'proq reklama qo\'shish']} correctIdx={1}
    explainCorrect="To'g'ri! Og'riq — 'ko'rmayapman'. Yechim — rasm. Feature to'g'ridan-to'g'ri og'riqqa javob beradi."
    explainWrong={{ 0: 'Logo kattaligi ishonchni oshirmaydi. Xaridor mahsulotni ko\'rishi kerak.', 2: 'Rang og\'riqni yopmaydi. Xaridorga rasm kerak.', 3: 'Reklama og\'riqni kuchaytiradi. Yechim — rasm.', default: 'Og\'riq "ko\'rmayapman" — yechim rasm yuklash.' }} />
);

// ===== SCREEN 10 — SHIRINLIKNI TOPISH (debugging) =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [found, setFound] = useState(!!storedAnswer);
  const [fixed, setFixed] = useState(!!storedAnswer);
  const done = fixed;
  const lines = [
    { key: 'rasm', label: 'FEATURE', color: T.blue, pain: 'Ko\'rmasdan ishonmaydi', text: 'Mahsulot rasmini yuklash', ok: true },
    { key: 'qidiruv', label: 'FEATURE', color: T.honey, pain: 'Keraklisini topolmaydi', text: 'Qidiruv', ok: true },
    { key: 'logo3d', label: '???', color: T.ink3, pain: '—', text: 'Salyut (konfetti) effekti', ok: false },
    { key: 'narx', label: 'FEATURE', color: T.success, pain: 'Xabari yetdimi bilmaydi', text: '"O\'qildi" belgisi', ok: true }
  ];
  const clickLine = (k) => { if (found || fixed) return; if (k === 'logo3d') setFound(true); };
  const fix = () => setFixed(true);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Tuzatish" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : (found ? 'Endi tuzating' : 'Behuda feature\'ni toping')} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bu mahsulotda qaysi feature hech qanday <span className="italic" style={{ color: T.accent }}>og'riqni</span> yopmaydi?</h2></div>
        <Mentor>Mahsulotga 4 ta feature qo'shilgan, lekin bittasi <b style={{ color: T.ink }}>hech qanday og'riqni yopmaydi</b>. Qaysi biri? O'sha qatorni bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="ai-card fade-up delay-1">
              <div className="ai-row"><span className="ai-badge">MAHSULOT</span><span className="ai-bubble">Feature'lar ro'yxati:</span></div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {lines.map(l => {
                  const bad = found && !fixed && l.key === 'logo3d';
                  const isFix = fixed && l.key === 'logo3d';
                  const label = isFix ? 'FEATURE' : l.label;
                  const color = isFix ? T.success : l.color;
                  const pain = isFix ? 'Narxni solishtirolmaydi' : l.pain;
                  const text = isFix ? 'Narx va holatini ko\'rsatish' : l.text;
                  return (<div key={l.key} onClick={() => clickLine(l.key)} style={{ cursor: (found || fixed) ? 'default' : 'pointer', display: 'flex', flexDirection: 'column', gap: 2, background: bad ? T.accentSoft : (isFix ? T.successSoft : T.bg), borderRadius: 10, padding: '9px 12px', boxShadow: bad ? `inset 0 0 0 1.5px ${T.accent}` : 'none', transition: 'all 0.18s' }}><span style={{ display: 'flex', alignItems: 'center', gap: 7 }}><span className="mono" style={{ fontSize: 9.5, fontWeight: 700, color, textTransform: 'uppercase' }}>{label}</span><span className="small" style={{ color: pain === '—' ? T.accent : T.ink3, fontWeight: pain === '—' ? 700 : 400 }}>og'riq: {pain}</span></span><span style={{ fontFamily: G, fontSize: 13.5, color: T.ink }}>{text}</span></div>);
                })}
              </div>
              {found && !fixed && <button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={fix}>Og'riqli feature bilan almashtirish</button>}
              {fixed && <p className="ai-prompt" style={{ color: T.success, fontStyle: 'normal', fontWeight: 600 }}>Tuzatildi — endi har feature bir og'riqni yopadi.</p>}
            </div>
          </Col>
          <Col>
            {!found && <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Eslang: har feature <b>bitta og'riqqa</b> javob beradi. Qaysi qatorda og'riq o'rnida "—" turibdi?</p></div>}
            {found && !fixed && <div className="frame-warn fade-step"><p className="note-h" style={{ color: T.accent }}>Topdingiz!</p><p className="body" style={{ margin: 0, color: T.ink }}>"Salyut (konfetti) effekti" — hech qanday og'riqni yopmaydi (og'riq: —). Bu shirinlik. Chap tugmani bosib, og'riqli feature bilan almashtiring.</p></div>}
            {found && fixed && <div className="takeaway fade-step"><div className="ta-bulb" style={{ color: T.honey, display: 'inline-flex' }}>{p4.candy(34)}</div><p className="ta-h">Og'riqsiz feature — behuda mehnat</p><p className="ta-sub">Har feature bitta og'riqqa javob bersin</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — FEATURE-KARTANI YIG'ISH (build) =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const POOL = {
    kim: { label: 'KIM', color: T.honey, a: 'Hamma uchun', b: 'Onlayn sotuvchi uchun' },
    ogriq: { label: 'OG\'RIQ', color: T.accent, a: 'Sayt rangi xunuk', b: 'Xaridor mahsulotni ko\'rmasdan ishonmaydi' },
    yechim: { label: 'YECHIM (FEATURE)', color: T.blue, a: 'Logoni kattalashtirish', b: 'Mahsulot rasmini yuklash' }
  };
  const KEYS = ['kim', 'ogriq', 'yechim'];
  const [pick, setPick] = useState(storedAnswer?.pick || {});
  const allGood = KEYS.every(k => pick[k] === 'b');
  const allPicked = KEYS.every(k => pick[k]);
  const workRef = useRef(null);
  const set = (k, v) => { if (allGood) return; setPick(prev => ({ ...prev, [k]: v })); };
  useEffect(() => {
    if (!allGood) return;
    if (storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true, pick });
    if (typeof window !== 'undefined' && window.innerWidth < 768 && workRef.current) { const el = workRef.current; setTimeout(() => { if (el) el.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 360); }
  }, [allGood]);
  const items = KEYS.map(k => ({ label: POOL[k].label, color: POOL[k].color, text: pick[k] ? POOL[k][pick[k]] : '', ph: 'tanlanmagan…' }));
  return (
    <Stage eyebrow="Feature-karta" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!allGood} label={allGood ? 'Davom etish' : (allPicked ? 'Eng kuchli variantni tanlang' : 'Har qatordan tanlang')} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Kuchli <span className="italic" style={{ color: T.accent }}>feature-karta</span> yig'ing</h2></div>
        <Mentor>Har qator uchun ikkita variant — <b style={{ color: T.ink }}>aniq og'riqqa</b> yo'naltirilganini tanlang. O'ngda karta to'ladi.</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable>
        <div className="split" ref={workRef}>
          <Col>
            {KEYS.map(k => (<div key={k}><p className="flow-label" style={{ margin: '0 0 6px', color: POOL[k].color }}>{POOL[k].label}</p><div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>{['a', 'b'].map(v => { const on = pick[k] === v; return (<button key={v} onClick={() => set(k, v)} style={{ textAlign: 'left', border: 'none', cursor: 'pointer', borderRadius: 10, padding: '10px 13px', fontFamily: G, fontSize: 13.5, color: on ? '#fff' : T.ink, background: on ? POOL[k].color : T.paper, boxShadow: on ? `0 6px 14px -6px ${POOL[k].color}` : `0 5px 14px -8px rgba(${T.shadowBase},0.16)`, transition: 'all 0.16s' }}>{POOL[k][v]}</button>); })}</div></div>))}
          </Col>
          <Col>
            <p className="flow-label">Feature-kartangiz</p>
            <div className={allGood ? 'spec-done' : ''}><SpecCard items={items} minH={200} title="Feature-karta" /></div>
            {allGood && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana — kuchli feature! Aniq kim, aniq og'riq, aniq yechim. Bu <b>dori</b>.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — TEST 4 =====
const Screen12 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="Nega 'muammosiz yechim' (og'riqsiz feature) yomon?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Nega <span className="italic" style={{ color: T.accent }}>"muammosiz yechim"</span> yomon?</h2></>}
    options={['Chiroyli ko\'rinadi', 'Vaqt va kuch ketadi, lekin hech kim ishlatmaydi', 'Juda foydali bo\'ladi', 'Mahsulotni tezlashtiradi']} correctIdx={1}
    explainCorrect="To'g'ri! Og'riqsiz feature — behuda mehnat. Resurs ketadi, lekin foydalanuvchiga keragi yo'q, shuning uchun ishlatilmaydi."
    explainWrong={{ 0: 'Chiroyli bo\'lishi mumkin, lekin behuda. Resurs bekorga ketadi.', 2: 'Aksincha — og\'riqsiz feature foydasiz.', 3: 'Ko\'pincha sekinlashtiradi. Eng yomoni — keraksiz.', default: 'Og\'riqsiz feature — behuda mehnat, hech kim ishlatmaydi.' }} />
);

// ===== SCREEN 13 — NAMUNA: tayyor mahsulot (har feature → og'riq) =====
const CASE_ROWS = [
  { key: 'rasm', label: 'Rasm yuklash', ic: Ico.image(18), color: T.blue, pain: 'Xaridor ko\'rmasdan ishonmaydi', why: 'Rasm bilan xaridor mahsulotni ko\'radi, ishonadi va sotib oladi. Eng katta og\'riqni yopadi.' },
  { key: 'qidiruv', label: 'Qidiruv', ic: Ico.search(18), color: T.honey, pain: 'Minglab e\'lon ichidan topolmaydi', why: 'Qidiruv kerakli narsani soniyada topadi — vaqt og\'rig\'ini yopadi.' },
  { key: 'oqildi', label: '"O\'qildi" belgisi', ic: Ico.check(18), color: T.success, pain: 'Xabarim yetdimi — bilmayman', why: 'Ikki belgi (✓✓) xabar yetganini ko\'rsatadi — noaniqlik og\'rig\'ini yopadi.' },
  { key: 'tungi', label: 'Tungi rejim', ic: Ico.moon(18), color: T.grape, pain: 'Kechasi ko\'z og\'riydi', why: 'Qora fon kechasi ko\'zni qiynamaydi — jismoniy og\'riqni yopadi.' }
];
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [seen, setSeen] = useState(storedAnswer ? new Set(CASE_ROWS.map(r => r.key)) : new Set());
  const isNarrow = useIsMobile(768);
  const [active, setActive] = useState(null);
  const done = seen.size >= CASE_ROWS.length;
  const tap = (k) => { setActive(k); setSeen(prev => { const n = new Set(prev); n.add(k); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const cur = CASE_ROWS.find(r => r.key === active);
  return (
    <Stage eyebrow="Namuna" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Endi navbat sizga →' : `${seen.size}/${CASE_ROWS.length} qatorni oching`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Tayyor mahsulot: har feature qaysi <span className="italic" style={{ color: T.accent }}>og'riqni</span> yopadi?</h2></div>
        <Mentor>Mana 4 feature'li mahsulot — hammasi <b style={{ color: T.ink }}>dori</b>. Har qatorni bosib, qaysi og'riqni yopishini ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {CASE_ROWS.map(s => { const open = seen.has(s.key); return (<button key={s.key} onClick={() => tap(s.key)} style={{ textAlign: 'left', cursor: 'pointer', border: 'none', borderRadius: 12, padding: '11px 14px', background: T.paper, display: 'flex', flexDirection: 'column', gap: 3, boxShadow: active === s.key ? `inset 0 0 0 2px ${s.color}, 0 8px 20px -8px ${s.color}44` : (open ? `inset 0 0 0 1px ${T.success}55` : `0 6px 16px -8px rgba(${T.shadowBase},0.16)`), transition: 'all 0.18s' }}><span style={{ display: 'flex', alignItems: 'center', gap: 9 }}><span style={{ color: s.color, display: 'inline-flex' }}>{s.ic}</span><span className="mono" style={{ fontSize: 11, fontWeight: 700, color: s.color, textTransform: 'uppercase' }}>{s.label}</span>{open && <span className="feat-pop" style={{ marginLeft: 'auto', color: T.success, display: 'inline-flex' }}>{Ico.check(13)}</span>}</span><span style={{ fontFamily: G, fontSize: 12.5, color: T.ink2 }}>og'riq: {s.pain}</span></button>); })}
            </div>
          </Col>
          <Col>
            {cur ? (<div className="sk-info slide-in-r" key={active}><span className="sk-tagbig"><span style={{ color: cur.color, display: 'inline-flex' }}>{cur.ic}</span><span className="sk-wordbadge" style={{ color: cur.color, background: cur.color + '1c' }}>{cur.label}</span></span><div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, margin: '12px 0 0' }}><span style={{ color: T.accent, display: 'inline-flex', marginTop: 1 }}>{Ico.problem(15)}</span><p className="body" style={{ color: T.ink2, margin: 0 }}><b style={{ color: T.accent }}>Og'riq:</b> {cur.pain}</p></div><p className="body" style={{ color: T.ink, margin: '8px 0 0' }}>{cur.why}</p></div>) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Bir qatorni bosing</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Har feature aniq bir og'riqqa bog'langan — bironta behuda emas. Endi o'zingiznikini yozasiz.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — QOIDA =====
const Screen14 = ({ screen, onNext, onPrev }) => (
  <Stage eyebrow="Qoida" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Yakuniy ishga →" onClick={onNext} /></>}>
    <div className="screen">
      <div className="head"><h2 className="title h-title fade-up">Og'riq bo'lmasa — <span className="italic" style={{ color: T.accent }}>feature ham kerak emas</span></h2></div>
      <Mentor>Har bir feature bitta haqiqiy <b style={{ color: T.ink }}>og'riqqa</b> javob beradi. Og'riq bo'lmasa — feature ham kerak emas. Qurishdan oldin doim so'rang: <b style={{ color: T.ink }}>"Bu kimning qaysi og'rig'ini yopadi?"</b></Mentor>
      <Zoomable>
      <div className="split">
        <Col>
          <div className="frame fade-up" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 'clamp(18px,2.6vw,26px)' }}>
            <IcoChip size={54} color={T.success} soft={T.successSoft}>{p4.pill(28)}</IcoChip>
            <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, margin: 0, color: T.ink, fontSize: 'clamp(18px,2.4vw,22px)' }}>Feature = dori</p><p className="body" style={{ margin: '3px 0 0', color: T.ink2 }}>Og'riq bor → feature kerak. Og'riq yo'q → bu shirinlik.</p></div>
          </div>
        </Col>
        <Col>
          <p className="flow-label">Har feature uchun 3 savol</p>
          <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[{ ic: Ico.user(18), c: T.honey, t: 'KIM bu og\'riqni his qiladi?' }, { ic: Ico.problem(18), c: T.accent, t: 'Qanday OG\'RIQ (muammo)?' }, { ic: p4.pill(18), c: T.blue, t: 'Feature uni QANDAY yopadi?' }].map((s, i) => (<React.Fragment key={i}><div style={{ display: 'flex', alignItems: 'center', gap: 11, background: T.paper, borderRadius: 11, padding: '10px 13px', boxShadow: `0 5px 14px -8px rgba(${T.shadowBase},0.16)` }}><span style={{ color: s.c, display: 'inline-flex' }}>{s.ic}</span><span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, color: T.ink, fontSize: 13.5 }}>{s.t}</span></div>{i < 2 && <span style={{ color: T.ink3, textAlign: 'center', fontSize: 11 }}>↓</span>}</React.Fragment>))}
          </div>
        </Col>
      </div>
      </Zoomable>
    </div>
  </Stage>
);

// ===== SCREEN 15 — YAKUNIY: 3 ta OG'RIQ → YECHIM =====
const emptyRows = () => [{ pain: '', feature: '' }, { pain: '', feature: '' }, { pain: '', feature: '' }];
const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [rows, setRows] = useState(() => storedAnswer?.rows || emptyRows());
  const filled = rows.filter(r => r.pain.trim().length >= 3 && r.feature.trim().length >= 3).length;
  const passed = filled >= 3;
  const prevPassed = useRef(false);
  const workRef = useRef(null);
  useEffect(() => {
    if (passed && !prevPassed.current) {
      prevPassed.current = true;
      onAnswer(screen, { correct: true, rows, stage: 'final', screenIdx: screen });
      if (typeof window !== 'undefined' && window.innerWidth < 768 && workRef.current) { const el = workRef.current; setTimeout(() => { if (el) el.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 360); }
    }
  }, [passed]);
  const upd = (i, field, v) => setRows(prev => prev.map((r, idx) => (idx === i ? { ...r, [field]: v } : r)));
  const items = rows.map((r, i) => ({ label: `${i + 1}-JUFTLIK`, color: '#9FB4D8', text: (r.pain.trim() && r.feature.trim()) ? `${r.pain} → ${r.feature}` : '', ph: 'og\'riq → yechim…' }));
  return (
    <Stage eyebrow="Yakuniy ish" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!passed} label={passed ? 'Davom etish' : `To'ldiring (${filled}/3)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">O'z mahsulotingiz uchun <span className="italic" style={{ color: T.accent }}>3 ta og'riq → yechim</span> yozing</h2></div>
        <Mentor>Har juftlikda: foydalanuvchining <b style={{ color: T.accent }}>og'rig'i</b> va uni yopadigan <b style={{ color: T.success }}>feature</b>. O'ngda mahsulot rejangiz to'ladi.</Mentor>
        <MentorCollapseScroll targetRef={workRef} />
        <Zoomable>
        <div className="split" ref={workRef}>
          <Col>
            {rows.map((r, i) => { const ok = r.pain.trim().length >= 3 && r.feature.trim().length >= 3; return (
              <div key={i} style={{ background: T.paper, borderRadius: 12, padding: '12px 13px', boxShadow: ok ? `inset 0 0 0 1.5px ${T.success}, 0 6px 16px -9px rgba(31,122,77,0.16)` : `0 6px 16px -9px rgba(${T.shadowBase},0.16)`, transition: 'box-shadow 0.2s' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}><span style={{ color: ok ? T.success : T.ink3, display: 'inline-flex' }}>{ok ? Ico.check(15) : <span className="mono" style={{ fontSize: 12, fontWeight: 700, color: T.ink3 }}>{i + 1}</span>}</span><span className="mono" style={{ fontSize: 10.5, fontWeight: 700, letterSpacing: '0.05em', color: T.ink, textTransform: 'uppercase' }}>{i + 1}-juftlik</span></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 7 }}><span style={{ color: T.accent, display: 'inline-flex', flexShrink: 0 }}>{Ico.problem(15)}</span><input value={r.pain} onChange={e => upd(i, 'pain', e.target.value)} placeholder="Og'riq: foydalanuvchi nimadan qiynaladi?" style={{ width: '100%', fontFamily: G, fontSize: 13.5, color: T.ink, background: T.bg, border: 'none', borderRadius: 9, padding: '8px 11px', outline: 'none', boxSizing: 'border-box' }} /></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}><span style={{ color: T.success, display: 'inline-flex', flexShrink: 0 }}>{p4.pill(15)}</span><input value={r.feature} onChange={e => upd(i, 'feature', e.target.value)} placeholder="Yechim: qaysi feature buni yopadi?" style={{ width: '100%', fontFamily: G, fontSize: 13.5, color: T.ink, background: T.bg, border: 'none', borderRadius: 9, padding: '8px 11px', outline: 'none', boxSizing: 'border-box' }} /></div>
              </div>
            ); })}
          </Col>
          <Col>
            <p className="flow-label">Mahsulot rejangiz</p>
            <SpecCard items={items} minH={196} title="Mening mahsulotim" />
            {passed && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Tayyor! Har feature aniq og'riqqa bog'langan. Demo Day'da shu rejani aytasiz.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — YAKUN + DEMO DAY =====
const Screen16 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const RECAP = ['Har feature — bitta og\'riqqa dori', 'Dori (kerak) va shirinlik (bezak)ni ajratish', 'Og\'riqni feature bilan moslashtirish', 'Og\'riq bo\'lmasa — feature ham kerak emas'];
  const HOMEWORK = [{ b: 'Sevimli ilovangizni oching', t: '— uning 3 feature\'i qaysi og\'riqni yopadi?' }, { b: 'O\'z mahsulotingizni tekshiring', t: '— har feature og\'riqqa bog\'langanmi?' }, { b: 'Demo Day\'ga tayyorlaning', t: '— 3 og\'riq → yechimni ayting' }];
  const GLOSSARY = [{ b: 'Og\'riq (pain)', t: '— foydalanuvchining haqiqiy muammosi' }, { b: 'Feature', t: '— og\'riqni yopadigan funksiya' }, { b: 'Dori (painkiller)', t: '— og\'riqni yopadigan kerakli feature' }, { b: 'Shirinlik (vitamin)', t: '— chiroyli, lekin og\'riqsiz bezak' }, { b: 'Demo Day', t: '— mahsulotingizni taqdim qilish kuni' }];
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
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">{Ico.check(11)}</span> PM bloki tugadi</span><h2 className="title h-title fade-up d1">Endi siz <span className="italic" style={{ color: T.accent }}>og'riqdan</span> yechim quryapsiz.</h2><p className="body h-sub fade-up d2">{PASSED ? 'Tabriklaymiz! Har feature bitta og\'riqni yopishini bildingiz. Demo Day\'ga tayyorsiz!' : 'Yaxshi harakat! Bir-ikki joyni mustahkamlash uchun darsni qayta ko\'ring.'}</p></div><ScoreRing correct={correct} total={total} /></div>
        <Zoomable>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span style={{ color: T.success, display: 'inline-flex' }}>{Ico.check(15)}</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck" style={{ display: 'inline-flex' }}>{Ico.check(15)}</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>Demo Day'ga tayyorgarlik</div><p className="body" style={{ margin: '0 0 10px', color: T.ink }}>Og'riq → yechim ko'nikmangizni mashq qiling:</p><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">Demo Day — ko'pchilikning og'rig'iga yechim qurib taqdim qilasiz! 💊</p></div>
        </div>
        </Zoomable>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function PmLesson4({ lang: langProp, onFinished }) {
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
        .zoomable { position: relative; }
        .zoom-btn { position: absolute; top: 6px; right: 6px; z-index: 5; width: 30px; height: 30px; border-radius: 8px; border: none; background: rgba(255,255,255,0.82); color: ${T.ink2}; font-size: 14px; line-height: 1; cursor: pointer; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 12px -4px rgba(${T.shadowBase},0.22); transition: all 0.2s; }
        .zoom-btn:hover { background: ${T.paper}; color: ${T.accent}; transform: scale(1.08); }
        .zoom-backdrop { position: fixed; inset: 0; background: rgba(14,14,16,0.55); z-index: 1000; animation: fade-step 0.25s ease; }
        .zoom-on { position: fixed; top: 50%; left: 50%; transform: translate(-50%,-50%); width: min(880px,94vw); max-height: 90vh; overflow: auto; z-index: 1001; background: ${T.paper}; border-radius: 18px; padding: clamp(20px,4vw,42px); box-shadow: 0 30px 80px -20px rgba(${T.shadowBase},0.5); animation: zoom-pop 0.3s cubic-bezier(.34,1.3,.4,1); }
        @keyframes zoom-pop { from { opacity: 0; transform: translate(-50%,-50%) scale(0.93); } to { opacity: 1; transform: translate(-50%,-50%) scale(1); } }
        .fade-step { animation: fade-step 0.34s cubic-bezier(.2,.7,.2,1); }
        .d1 { animation-delay: 0.12s; } .d2 { animation-delay: 0.24s; } .d3 { animation-delay: 0.36s; } .d4 { animation-delay: 0.48s; }

        /* PM4 — og'riq pulsi */
        .pp { position: relative; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .pp-core { position: relative; width: 64%; height: 64%; min-width: 40px; min-height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-family: 'Fraunces', serif; font-size: 24px; color: #fff; background: ${T.accent}; transition: background .55s cubic-bezier(.2,.7,.2,1); z-index: 2; }
        .pp[data-ok="true"] .pp-core { background: ${T.success}; }
        .pp-ring { position: absolute; width: 64%; height: 64%; min-width: 40px; min-height: 40px; border-radius: 50%; border: 2.5px solid ${T.accent}; animation: pp-throb 1.5s ease-out infinite; z-index: 1; }
        .pp-ring.r2 { animation-delay: .75s; }
        .pp[data-ok="true"] .pp-ring { animation: none; opacity: 0; }
        .pp[data-shake="true"] .pp-core { animation: shake 0.42s; }
        @keyframes pp-throb { 0% { transform: scale(.72); opacity: .7; } 100% { transform: scale(1.55); opacity: 0; } }
        @keyframes shake { 0%,100% { transform: none; } 20% { transform: translateX(-4px); } 40% { transform: translateX(4px); } 60% { transform: translateX(-3px); } 80% { transform: translateX(3px); } }
        .shake-x { animation: shake 0.42s; }
        @keyframes feat-pop { 0% { transform: scale(.82); opacity: 0; } 60% { transform: scale(1.05); } 100% { transform: scale(1); opacity: 1; } }
        .feat-pop { animation: feat-pop .34s cubic-bezier(.2,.7,.2,1); }
        /* PM4 — qo'shimcha animatsiyalar (sahifa 2,8,13,15) */
        .idea-card { transition: transform .2s cubic-bezier(.2,.7,.2,1), box-shadow .2s; }
        .idea-card:hover { transform: translateY(-3px); box-shadow: 0 14px 30px -10px rgba(${T.shadowBase},0.2); }
        @keyframes birth-pop { 0% { transform: scale(.93); } 55% { transform: scale(1.035); } 100% { transform: scale(1); } }
        .birth-on { animation: birth-pop .52s cubic-bezier(.2,.7,.2,1); }
        @keyframes arrow-bob { 0%,100% { transform: rotate(90deg) translateX(0); } 50% { transform: rotate(90deg) translateX(3.5px); } }
        .arrow-live { animation: arrow-bob 0.9s ease-in-out infinite; }
        @keyframes spec-glow { 0% { box-shadow: 0 0 0 0 rgba(31,122,77,0); } 45% { box-shadow: 0 0 0 5px rgba(31,122,77,0.22); } 100% { box-shadow: 0 0 0 0 rgba(31,122,77,0); } }
        .spec-done { border-radius: 14px; animation: spec-glow .75s ease; }
        @keyframes slide-in-r { from { opacity: 0; transform: translateX(12px); } to { opacity: 1; transform: translateX(0); } }
        .slide-in-r { animation: slide-in-r .36s cubic-bezier(.2,.7,.2,1); }

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
        .mentor-ava img { display: block; width: 100%; height: 100%; object-fit: contain; transform: scale(1.12); }
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

        /* === SPEC CARD (qora — mahsulot rejasi) === */
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
        .ai-prompt { font-size: 12px; color: ${T.ink3}; margin: 0; font-style: italic; } .note-h { font-weight: 700; font-size: 13px; margin: 0 0 4px; }
        .takeaway { background: ${T.accentSoft}; border-radius: 14px; padding: 22px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 6px; } .ta-h { font-family: 'Source Serif 4', serif; font-weight: 600; font-size: clamp(16px,2.2vw,20px); color: ${T.ink}; margin: 0; } .ta-sub { color: ${T.accent}; font-weight: 600; font-size: 13px; margin: 0; }

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
