import React, { useState, useEffect, useRef, createContext, useContext, useCallback } from 'react';

// ============================================================
// FRONTEND REACT MODULI · PRAKTIKA 4 (OXIRGI) — ISTALGAN SAYTNI QURISH: BO'LAKLASH + ANIQ PROMPT — PLATFORM STANDARD v16 (AUDIOSIZ)
// O'RNI: P3 (AvtoIjara loyiha kuni) dan KEYIN — modulning OXIRGI darsi. O'quvchi hamma narsani biladi.
// MAQSAD: REAL saytni (footer/header abstraksiyasi emas) sahifalarga + komponentlarga bo'lib, har bo'lakka ANIQ PROMPT
//        yozib, AI bilan qurish va tekshirish. P3 da AvtoIjara'ni qurdik — endi USULNI istalgan saytga ko'chiramiz.
// O'rgatish namunasi: "Yetkaz" — ovqat yetkazib berish sayti (Navbar+Hero+Categories+TaomList(TaomCard takrorlanadi)+Footer).
// YURAK (s7): ANIQ PROMPT yozish — Qaysi bo'limlar + Har bo'lim nima ko'rsatadi + Ma'lumot/uslub (aniqlik o'lchagichi).
// Vibecoding (s8): AgentBuild — promptni yig'ib, agentga yuborib, kodni tekshirish.
// Debugging (s10): AI bo'limni to'liq qurdi, lekin narxni unutdi → TUZATUVCHI (follow-up) prompt.
// Transfer (s11): o'quvchi O'Z saytini tanlab bo'laklaydi + birinchi aniq promptni yozadi.
// Bog'lanishlar: React Intro (komponent=blok), P3 (prompt: Nima+Qanday+Qayerda, AgentBuild halqasi).
// AUDIOSIZ. "sehr"/"g'isht" yo'q. Rasmiy "siz". Bu — modulning yakuniy darsi (keyingi dars teaser YO'Q — bitiruv).
// PRODUCTION: <style> ichidagi @import OLIB TASHLANADI — shriftlarni LMS yuklaydi.
// ============================================================

const T = {
  bg: '#F6F4EF', ink: '#0E0E10', ink2: '#5A5A60', ink3: '#A7A6A2',
  paper: '#FFFFFF', accent: '#FF4F28', accentSoft: '#FFE8E1', accentVivid: '#FF4F28',
  success: '#1F7A4D', successSoft: '#E3F0E8', blue: '#019ACB', blueSoft: '#E2F4FA', link: '#1a56db',
  danger: '#C2362B', dangerSoft: '#FAE3E0',
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

const LESSON_META = { lessonId: 'react-build-site-final-p4-v16', lessonTitle: { uz: 'Praktika: Istalgan saytni qurish — bo\'laklash + aniq prompt', ru: 'Практика: Сборка любого сайта — декомпозиция + точный промпт' } };
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
  { id: 's8',  type: 'case',        template: 'custom',   scored: false, scope: null },
  { id: 's9',  type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's10', type: 'case',        template: 'custom',   scored: false, scope: null },
  { id: 's11', type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's12', type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's13', type: 'rule',        template: 'custom',   scored: false, scope: null },
  { id: 's14', type: 'test',        template: 'custom',   scored: true,  scope: 'final' },
  { id: 's15', type: 'summary',     template: 'custom',   scored: false, scope: null }
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

const Jx = ({ children }) => <span style={{ color: CODE.tag }}>{children}</span>;
const At = ({ children }) => <span style={{ color: CODE.attr }}>{children}</span>;
const Cm = ({ children }) => <span style={{ color: CODE.comment, fontStyle: 'italic' }}>{children}</span>;
const Win = ({ title, children, minH }) => (
  <div className="bp-window"><div className="bp-bar"><span className="bb-dots"><i /><i /><i /></span><span className="bp-title">{title}</span></div><div className="bp-body" style={{ minHeight: minH, position: 'relative' }}>{children}</div></div>
);

// ===== "YETKAZ" — ovqat yetkazib berish sayti (o'rgatish namunasi) =====
const TAOMS = [
  { id: 1, nom: 'Pepperoni Pitsa', emoji: '🍕', narx: '45 000', cat: 'Pitsa', color: 'linear-gradient(135deg,#FF9D5C,#E8541E)' },
  { id: 2, nom: 'Cheeseburger', emoji: '🍔', narx: '32 000', cat: 'Burger', color: 'linear-gradient(135deg,#F7C04A,#C8881E)' },
  { id: 3, nom: 'Lavash', emoji: '🌯', narx: '28 000', cat: 'Fast food', color: 'linear-gradient(135deg,#9BD17E,#3E8E3E)' },
  { id: 4, nom: 'Coca-Cola 0.5', emoji: '🥤', narx: '12 000', cat: 'Ichimlik', color: 'linear-gradient(135deg,#7EA6F4,#2E4A9E)' }
];
const CATS = ['🍕 Pitsa', '🍔 Burger', '🌯 Fast food', '🥤 Ichimlik', '🍰 Shirinlik'];

const OutlineLabel = ({ children }) => <span style={{ position: 'absolute', top: -9, left: 8, background: T.accent, color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 5, fontFamily: "'JetBrains Mono',monospace", whiteSpace: 'nowrap', zIndex: 2 }}>{children}</span>;

const TaomCard = ({ taom, outline, label, hidePrice, btnInteractive, btnActive, btnSeen, onBtnClick }) => (
  <div style={{ position: 'relative', background: '#fff', borderRadius: 12, padding: '9px 10px', boxShadow: '0 3px 12px -5px rgba(0,0,0,0.14)', border: outline ? `1.5px dashed ${T.accent}` : '1px solid rgba(0,0,0,0.05)' }}>
    {outline && label && <OutlineLabel>{label}</OutlineLabel>}
    <div style={{ height: 46, borderRadius: 9, background: taom.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 6 }}>{taom.emoji}</div>
    <p style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: 12, color: T.ink, margin: '0 0 4px', lineHeight: 1.2 }}>{taom.nom}</p>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 5 }}>
      {hidePrice
        ? <span style={{ fontSize: 11, fontWeight: 700, color: T.danger, fontStyle: 'italic' }}>narx?</span>
        : <span style={{ fontSize: 11.5, fontWeight: 800, color: T.accent }}>{taom.narx} so'm</span>}
      <span
        onClick={btnInteractive ? (e) => { e.stopPropagation(); onBtnClick && onBtnClick(); } : undefined}
        style={{ fontSize: 10, fontWeight: 700, color: '#fff', background: T.ink, borderRadius: 7, padding: '4px 8px', ...(btnInteractive ? { cursor: 'pointer', outline: btnActive ? `2px solid ${T.accent}` : (btnSeen ? `2px solid ${T.success}` : 'none') } : {}) }}
      >Savatga</span>
    </div>
  </div>
);

const SiteNavbar = ({ outline }) => (
  <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderRadius: 9, background: T.ink, color: '#fff', border: outline ? `1.5px dashed ${T.accent}` : 'none' }}>
    {outline && <OutlineLabel>{'<Navbar />'}</OutlineLabel>}
    <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: 13 }}>🛵 Yetkaz</span>
    <span style={{ fontSize: 14 }}>🛒</span>
  </div>
);
const Hero = ({ outline }) => (
  <div style={{ position: 'relative', borderRadius: 11, padding: '13px 14px', background: 'linear-gradient(135deg,#FF7A45,#E8541E)', color: '#fff', border: outline ? `1.5px dashed ${T.accent}` : 'none' }}>
    {outline && <OutlineLabel>{'<Hero />'}</OutlineLabel>}
    <p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, fontSize: 15, margin: '0 0 3px' }}>30 daqiqada yetkazamiz 🚀</p>
    <p style={{ fontSize: 11.5, opacity: 0.92, margin: '0 0 8px' }}>Issiq taomlar — bepul yetkazib berish</p>
    <span style={{ display: 'inline-block', fontSize: 11, fontWeight: 800, background: '#fff', color: T.accent, borderRadius: 7, padding: '5px 11px' }}>Buyurtma berish</span>
  </div>
);
const CategoryRow = ({ outline }) => (
  <div style={{ position: 'relative', border: outline ? `1.5px dashed ${T.accent}` : 'none', borderRadius: 9, padding: outline ? '9px 7px' : 0 }}>
    {outline && <OutlineLabel>{'<Categories />'}</OutlineLabel>}
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {CATS.map(c => <span key={c} style={{ fontSize: 11, fontWeight: 700, color: T.ink, background: T.paper, borderRadius: 99, padding: '5px 10px', boxShadow: '0 3px 10px -5px rgba(0,0,0,0.14)' }}>{c}</span>)}
    </div>
  </div>
);
const SiteFooter = ({ outline }) => (
  <div style={{ position: 'relative', borderRadius: 9, padding: '9px 12px', background: '#262630', color: '#fff', border: outline ? `1.5px dashed ${T.accent}` : 'none' }}>
    {outline && <OutlineLabel>{'<Footer />'}</OutlineLabel>}
    <span style={{ fontSize: 10.5, opacity: 0.85 }}>© Yetkaz · Aloqa · Ijtimoiy tarmoqlar</span>
  </div>
);
const TaomGrid = ({ outline, hidePrice }) => (
  <div style={{ position: 'relative', border: outline ? `1.5px dashed ${T.accent}` : 'none', borderRadius: 11, padding: outline ? '11px 8px 8px' : 0 }}>
    {outline && <OutlineLabel>{'<TaomList />'}</OutlineLabel>}
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
      {TAOMS.map(t => <TaomCard key={t.id} taom={t} outline={outline} label={outline ? '<TaomCard />' : null} hidePrice={hidePrice} />)}
    </div>
  </div>
);
const HomePreview = ({ outline, hidePrice }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: outline ? 12 : 8 }}>
    <SiteNavbar outline={outline} />
    <Hero outline={outline} />
    <CategoryRow outline={outline} />
    <TaomGrid outline={outline} hidePrice={hidePrice} />
    <SiteFooter outline={outline} />
  </div>
);

// ===== AGENT BUILD — vibecoding halqasi (P3 dan): prompt yig'ish → reja → tasdiq → kod =====
const AgentBuild = ({ base, parts, planSteps, code, onDone, storedDone }) => {
  const [sel, setSel] = useState(storedDone ? new Set(parts.map(p => p.id)) : new Set());
  const [phase, setPhase] = useState(storedDone ? 'done' : 'compose');
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const ready = sel.size >= parts.length;
  const toggle = (id) => { if (phase !== 'compose') return; setSel(prev => { const s = new Set(prev); if (s.has(id)) s.delete(id); else s.add(id); return s; }); };
  const send = () => { if (ready) setPhase('planned'); };
  const approve = () => { setPhase('building'); timer.current = setTimeout(() => { setPhase('done'); if (onDone) onDone(); }, 1200); };
  const chosen = parts.filter(p => sel.has(p.id));
  return (
    <>
      <p className="flow-label">1. Promptni yig'ing — aniqlik qo'shing</p>
      <div className="ai-card">
        <div className="prompt-box">
          <span className="prompt-q">"</span>{base}{chosen.length ? <> — {chosen.map((p, i) => <span key={p.id}><span style={{ color: T.success, fontWeight: 700 }}>{p.label}</span>{i < chosen.length - 1 ? ', ' : ''}</span>)}</> : <span style={{ color: T.ink3, fontStyle: 'italic' }}> …aniqlik qo'shing</span>}<span className="prompt-q">"</span>
        </div>
        {phase === 'compose' && (
          <>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {parts.map(p => <button key={p.id} className={`chip ${sel.has(p.id) ? 'chip-on' : ''}`} style={{ padding: '7px 12px', fontSize: 12.5 }} onClick={() => toggle(p.id)}>+ {p.label}</button>)}
            </div>
            <button className="btn" style={{ alignSelf: 'flex-start' }} disabled={!ready} onClick={send}>{ready ? 'Agentga yuborish →' : `Yana ${parts.length - sel.size} ta aniqlik qo'shing`}</button>
          </>
        )}
        {phase !== 'compose' && (
          <>
            <div className="ai-row"><span className="ai-badge" style={{ background: T.ink }}>Agent</span><span className="ai-bubble">{phase === 'planned' ? 'Mana rejam — tasdiqlaysizmi?' : (phase === 'building' ? 'Yozyapman…' : 'Bajardim — kodni tekshiring')}</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {planSteps.map((s, i) => <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}><span style={{ color: phase === 'planned' ? T.ink3 : T.success }}>{phase === 'planned' ? '○' : '✓'}</span><span style={{ color: T.ink }}>{s}</span></div>)}
            </div>
            {phase === 'planned' && <button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={approve}>Rejani tasdiqlash</button>}
            {phase === 'building' && <p className="ai-prompt" style={{ color: T.accent }}>Kod yozilyapti…</p>}
            {phase === 'done' && <div className="ai-code fade-step"><div className="ai-line ok" style={{ cursor: 'default', whiteSpace: 'pre-wrap' }}>{code}</div></div>}
          </>
        )}
      </div>
    </>
  );
};

// ===== SCREEN 0 — HOOK (sayt qurmoqchisiz — AI'ga nima deysiz?) =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [split, setSplit] = useState(false);
  const [used, setUsed] = useState(!!storedAnswer);
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const toggle = () => { setSplit(v => !v); setUsed(true); };
  const OPTS = [
    { id: 'a', label: "Bitta jumla: \"menga ovqat sayti qur\"" },
    { id: 'b', label: "Bo'laklab, har qismni aniq aytib" },
    { id: 'c', label: "Hammasini o'zim qo'lda yozaman" }
  ];
  const pick = (v) => { if (picked !== null || !used) return; setPicked(v); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: true }); };
  return (
    <Stage eyebrow="Kirish · bitiruv" screen={screen} scrollSignal={picked !== null} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 860 }}>Endi o'zingiz sayt qurasiz — AI'ga <span className="italic" style={{ color: T.accent }}>nima</span> deysiz?</h1>
        <Mentor>Mana tayyor sayt — "Yetkaz" ovqat yetkazib berish. Ko'p narsa bor: tepa menyu, banner, taomlar... AI'dan "shuni qur" desangiz — u qayerdan boshlashni bilmaydi. Sir: <b style={{ color: T.ink }}>🔍 Bo'laklarga ajrating</b> tugmasini bosing — nima ko'rasiz?</Mentor>
        <Split>
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button className={`chip ${split ? 'chip-on' : ''}`} onClick={toggle}>🔍 Bo'laklarga ajratish {split ? '✓' : ''}</button>
              {split && <span className="mono small fade-step" style={{ color: T.accent }}>oddiy bloklar!</span>}
            </div>
            <Win title="Yetkaz — localhost:5173" minH={150}>
              <HomePreview outline={split} />
            </Win>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Bunday saytni AI bilan qanday quramiz?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => {
                const on = picked === o.id;
                return (
                  <button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null || !used} style={{ opacity: !used ? 0.55 : 1 }} onClick={() => pick(o.id)}>
                    <span className="radio">{on && <span className="radio-dot" />}</span>
                    <span>{o.label}</span>
                  </button>
                );
              })}
            </div>
            {!used && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>Avval "Bo'laklarga ajratish"ni bosing ←</p>}
            {picked !== null && <p className="hook-ack fade-step">Aynan! Katta sayt — <b>kichik bloklarning</b> yig'indisi: <span className="mono">{'<Navbar />'}</span>, <span className="mono">{'<Hero />'}</span>, <span className="mono">{'<TaomCard />'}</span>... Buni <b>bo'laklash</b> (dekompozitsiya) deyiladi. Keyin har bo'lakka <b>aniq prompt</b> yozasiz — AI taxmin qilmaydi. Bugun shu ikki mahorat bilan istalgan saytni qurasiz.</p>}
          </Col>
        </Split>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const STEPS = [
    { text: 'Sahifalarga bo\'lish', tag: 'Router' },
    { text: 'Har sahifani bo\'limlarga', tag: 'komponentlar' },
    { text: 'Har bo\'lakka aniq prompt', tag: 'Nima + Mazmun + Ma\'lumot' },
    { text: 'Qur → tekshir → tuzat', tag: 'AI bilan' },
    { text: 'O\'z saytingizni boshlash', tag: 'bitiruv' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const PreviewBlock = (
    <Col>
      <p className="flow-label">Dars oxirida — sizning saytingiz boshlanadi</p>
      <div className="frame" style={{ padding: '16px 18px' }}>
        <p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, fontSize: 16, color: T.ink, margin: '0 0 10px' }}>Har sayt = bir xil bosqichlar:</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {[['📄', 'Sahifalar', 'Bosh · detal · savat'], ['🧩', 'Bo\'limlar', 'Hero, grid, footer...'], ['✍️', 'Aniq prompt', 'AI aynan kerakligini quradi']].map(([e, a, b]) => (
            <div key={a} style={{ display: 'flex', alignItems: 'center', gap: 10 }}><span style={{ fontSize: 16 }}>{e}</span><span style={{ fontWeight: 700, fontSize: 13, color: T.ink, minWidth: 92 }}>{a}</span><span style={{ fontSize: 12, color: T.ink2 }}>{b}</span></div>
          ))}
        </div>
      </div>
      <p className="mono small" style={{ color: T.accent, margin: 0 }}>→ bu usul bilan istalgan saytni qurasiz</p>
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
          <h2 className="title h-title fade-up">Oxirgi mahorat: saytni <span className="italic" style={{ color: T.accent }}>bo'laklab</span>, aniq prompt bilan qurish.</h2>
        </div>
        <Mentor>Bu — modulning <b style={{ color: T.ink }}>oxirgi darsi</b>. P3 da AvtoIjara'ni qurdik. Bugun ko'rasiz: <b style={{ color: T.ink }}>usul aynan o'sha</b> — istalgan saytga ishlaydi. G'oyani bo'laklab, har qismga aniq prompt yozib, AI bilan o'z bitiruv loyihangizni boshlaysiz.</Mentor>
        {!isNarrow ? (
          <Split>{PreviewBlock}{StepsBlock}</Split>
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

// ===== SCREEN 2 — SAHIFALARGA BO'LISH (Router) =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const PAGES = [
    { path: '/', page: 'Bosh', icon: '🏠', desc: 'barcha taomlar (katalog)' },
    { path: '/taom/:id', page: 'Taom', icon: '🍽️', desc: 'bitta taom + "Savatga"' },
    { path: '/savat', page: 'Savat', icon: '🛒', desc: 'tanlangan taomlar + jami' }
  ];
  const SCREENS = ['Bosh', 'Taom', 'Savat', 'Sozlamalar']; // oxirgisi — ortiqcha (hozir shart emas)
  const [chosen, setChosen] = useState(storedAnswer ? new Set(['Bosh', 'Taom', 'Savat']) : new Set());
  const [shake, setShake] = useState(null);
  const timer = useRef(null);
  const valid = new Set(PAGES.map(p => p.page));
  const done = chosen.size >= 3 && [...chosen].every(c => valid.has(c));
  useEffect(() => () => clearTimeout(timer.current), []);
  const tap = (s) => {
    if (valid.has(s)) setChosen(prev => { const n = new Set(prev); if (n.has(s)) n.delete(s); else n.add(s); return n; });
    else { clearTimeout(timer.current); setShake(s); timer.current = setTimeout(() => setShake(null), 450); }
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="1-qadam · sahifalar" screen={screen} scrollSignal={done} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : '3 ta sahifani tanlang'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Birinchi bo'lish: sayt <span className="italic" style={{ color: T.accent }}>nechta sahifa</span>?</h2></div>
        <Mentor>Eng katta bo'lak — <b style={{ color: T.ink }}>sahifalar</b> (Router). "Yetkaz" sayti uchun: foydalanuvchi qayerlarga boradi? Kerakli sahifalarni tanlang. Diqqat: bitta ortiqcha ham bor — hozir shart emasini sezing (keyin qo'shasiz).</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">Qaysi sahifalar kerak?</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {SCREENS.map(s => <button key={s} className={`chip ${chosen.has(s) ? 'chip-on' : ''} ${shake === s ? 'shake' : ''}`} onClick={() => tap(s)}>{s} {chosen.has(s) ? '✓' : ''}</button>)}
            </div>
            {shake && <p className="small fade-step" style={{ color: T.danger, fontStyle: 'italic', margin: 0 }}>"Sozlamalar" hozir shart emas — avval ishlaydigan sayt, keyin qo'shimchalar.</p>}
          </Col>
          <Col>
            <p className="flow-label">Sahifalar (Router) xaritasi</p>
            <div className="code-box fade-up delay-2" style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '13px 15px' }}>
              {PAGES.map(p => (
                <div key={p.path} style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 'clamp(11.5px,1.4vw,13px)', lineHeight: 1.6, opacity: chosen.has(p.page) ? 1 : 0.4, transition: 'opacity 0.3s' }}>{chosen.has(p.page) ? '✓' : '○'} <span style={{ color: CODE.attr }}>{p.path}</span> <span style={{ color: CODE.comment }}>→ {p.desc}</span></div>
              ))}
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>3 ta sahifa — har biri bitta <span className="mono">{'<Route>'}</span>. Birinchi katta bo'lak tayyor. Endi bitta sahifani (Bosh) ichkari bo'laklaymiz.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — BOSH SAHIFA BO'LIMLARI (komponentlar) =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const COMPS = {
    hero: { lbl: '<Hero />', desc: 'Tepa banner — aksiya va asosiy tugma.' },
    cats: { lbl: '<Categories />', desc: 'Kategoriyalar qatori — Pitsa, Burger...' },
    list: { lbl: '<TaomList />', desc: 'Taomlar grid — ichida TaomCard takrorlanadi.' },
    footer: { lbl: '<Footer />', desc: 'Pastki qism — aloqa, havolalar.' }
  };
  const KEYS = ['hero', 'cats', 'list', 'footer'];
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(storedAnswer ? new Set(KEYS) : new Set());
  const done = seen.size >= KEYS.length;
  const tap = (k) => { setActive(k); setSeen(prev => { const s = new Set(prev); s.add(k); return s; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const outline = (k) => active === k ? `2px solid ${T.accent}` : (seen.has(k) ? `1.5px solid ${T.success}` : 'none');
  return (
    <Stage eyebrow="2-qadam · bo'limlar" screen={screen} scrollSignal={done} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/4 bo'limni toping`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bosh sahifa — <span className="italic" style={{ color: T.accent }}>qaysi bo'limlardan</span> tuzilgan?</h2></div>
        <Mentor>Endi Bosh sahifani bo'limlarga ajratamiz — bu <b style={{ color: T.ink }}>komponent daraxti</b>. Har bo'lim — alohida komponent. Sahifadagi <b style={{ color: T.ink }}>4 ta bo'limni</b> bosib toping.</Mentor>
        <div className="split">
          <Col>
            <Win title="Yetkaz · Bosh — localhost:5173" minH={150}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                <SiteNavbar />
                <div onClick={() => tap('hero')} style={{ cursor: 'pointer', borderRadius: 11, outline: outline('hero') }}><Hero /></div>
                <div onClick={() => tap('cats')} style={{ cursor: 'pointer', borderRadius: 9, outline: outline('cats') }}><CategoryRow /></div>
                <div onClick={() => tap('list')} style={{ cursor: 'pointer', borderRadius: 11, outline: outline('list') }}><TaomGrid /></div>
                <div onClick={() => tap('footer')} style={{ cursor: 'pointer', borderRadius: 9, outline: outline('footer') }}><SiteFooter /></div>
              </div>
            </Win>
          </Col>
          <Col>
            {active && <div className="sk-info" key={active}><div className="sk-tagbig"><span className="sk-wordbadge mono">{COMPS[active].lbl}</span></div><p className="body" style={{ color: T.ink, margin: '8px 0 0' }}>{COMPS[active].desc}</p></div>}
            <p className="flow-label" style={{ margin: 0 }}>Komponent daraxti</p>
            <pre className="code-box fade-up delay-2" style={{ lineHeight: 1.9 }}>
              <Jx>{'<BoshSahifa>'}</Jx>{'\n'}
              {'  '}<Jx>{'<Navbar />'}</Jx>{'\n'}
              {'  '}<span style={{ opacity: seen.has('hero') ? 1 : 0.35 }}><Jx>{'<Hero />'}</Jx></span>{'\n'}
              {'  '}<span style={{ opacity: seen.has('cats') ? 1 : 0.35 }}><Jx>{'<Categories />'}</Jx></span>{'\n'}
              {'  '}<span style={{ opacity: seen.has('list') ? 1 : 0.35 }}><Jx>{'<TaomList>'}</Jx>{'\n'}
              {'    '}<Jx>{'<TaomCard />'}</Jx> <Cm>{'// takrorlanadi'}</Cm>{'\n'}
              {'  '}<Jx>{'</TaomList>'}</Jx></span>{'\n'}
              {'  '}<span style={{ opacity: seen.has('footer') ? 1 : 0.35 }}><Jx>{'<Footer />'}</Jx></span>{'\n'}
              <Jx>{'</BoshSahifa>'}</Jx>
            </pre>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana daraxt: blok ichida blok. Bosh sahifa — 4 ta bo'limning yig'indisi. Diqqat: <span className="mono">{'<TaomList>'}</span> ichida <span className="mono">{'<TaomCard />'}</span> <b>takrorlanyapti</b> — buni keyin ko'ramiz.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 (saytni qurish usuli) =====
const Screen4 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 1-savol"
    questionText="Katta saytni AI bilan qurishning to'g'ri yo'li qaysi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Katta saytni AI bilan <span className="italic" style={{ color: T.accent }}>qanday</span> quramiz?</h2></>}
    options={["Sahifa va bo'limlarga bo'lib, har biriga aniq prompt yozaman", "Bitta jumlada \"hammasini qur\" deyman", "Hamma kodni o'zim qo'lda yozaman", "Avval eng chiroyli rangni tanlayman"]} correctIdx={0}
    explainCorrect="To'g'ri! Avval bo'laklash (sahifalar + bo'limlar), keyin har bo'lakka aniq prompt. AI shunda taxmin qilmaydi — aynan kerakligini quradi."
    explainWrong={{
      1: "Yo'q — \"hammasini qur\" juda noaniq. AI taxmin qiladi va chalkash natija beradi. Bo'laklab, aniq so'rang.",
      2: "Hammasini qo'lda yozish — sekin. AI tez yozadi; sizning ishingiz — bo'laklash, aniq prompt, tekshirish.",
      3: "Rang — bezak. Avval struktura: sahifalar va bo'limlarga bo'lish kerak.",
      default: "To'g'ri yo'l: bo'laklash + har bo'lakka aniq prompt."
    }} />
);

// ===== SCREEN 5 — TAKROR → KOMPONENT (reuse) =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [xray, setXray] = useState(false);
  const [used, setUsed] = useState(!!storedAnswer);
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const toggle = () => { setXray(v => !v); setUsed(true); };
  const OPTS = [{ id: 'a', label: '4 ta — har taomga alohida komponent' }, { id: 'b', label: "1 ta — qolgani faqat har xil ma'lumot (props)" }];
  const pick = (v) => { if (picked !== null || !used) return; setPicked(v); onAnswer(screen, { stage: null, screenIdx: screen, picked: v, correct: true }); };
  const done = picked !== null;
  return (
    <Stage eyebrow="3-qadam · takror → komponent" screen={screen} scrollSignal={done} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Javobni tanlang"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Gridda 4 ta taom — lekin <span className="italic" style={{ color: T.accent }}>nechta komponent</span>?</h2></div>
        <Mentor>Bo'laklashning eng kuchli qismi: <b style={{ color: T.ink }}>takrorlanuvchini topish</b>. Taomlar har xil ko'rinadi, lekin tuzilishi bir xil (rasm, nom, narx, tugma). <b style={{ color: T.ink }}>🔍 Rentgen</b>ni yoqing — ichini ko'ring.</Mentor>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button className={`chip ${xray ? 'chip-on' : ''}`} onClick={toggle}>🔍 Rentgen {xray ? 'yoqilgan' : ''}</button>
              {xray && <span className="mono small fade-step" style={{ color: T.accent }}>hammasi bir xil!</span>}
            </div>
            <Win title="Yetkaz · Bosh — localhost:5173" minH={140}>
              <TaomGrid outline={xray} />
            </Win>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Sizningcha, nechta TaomCard komponenti yozilgan?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => {
                const on = picked === o.id;
                return <button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null || !used} style={{ opacity: !used ? 0.55 : 1 }} onClick={() => pick(o.id)}><span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span></button>;
              })}
            </div>
            {!used && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>Avval Rentgenni yoqing ←</p>}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bitta <span className="mono">{'<TaomCard />'}</span> — qolgani <b>props</b> (har xil ma'lumot). Qoida: <b>takrorlanuvchini ko'rsangiz — bitta komponent yasang, props bilan</b>. Butun grid: <span className="mono">{'{taomlar.map(t => <TaomCard taom={t} />)}'}</span>.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 5b — TEST 2 (takror) =====
const Screen5b = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Tekshiruv"
    questionText="Gridda bir xil karta 12 marta takrorlansa, nima qilasiz?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Mustahkamlash</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Bir xil karta <span className="italic" style={{ color: T.accent }}>12 marta takrorlansa</span>?</h2></>}
    options={["Bitta komponent yasab, props + map bilan 12 marta chizaman", "12 marta bir xil kod ko'chiraman", "12 ta alohida fayl yarataman", "Hech narsa — takror normal"]} correctIdx={0}
    explainCorrect="To'g'ri! Takror = bitta komponent + props. map ro'yxatdagi har element uchun chizadi: {taomlar.map(t => <TaomCard taom={t} />)}. Bitta kod — 12 ta karta."
    explainWrong={{
      1: "Yo'q — ko'chirish yomon: narxni o'zgartirsangiz 12 joyni tuzatasiz. Bitta komponent + props.",
      2: "Yo'q — 12 ta fayl shart emas. Bitta komponent yetadi.",
      3: "Takror — belgi: bu yerda komponent kerak. Bitta yasab, props bilan ishlating.",
      default: "Takror → bitta komponent + props + map."
    }} />
);

// ===== SCREEN 6 — MA'LUMOT QAYERDA (state / props / API) =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const ITEMS = [
    { q: 'Taomlar ro\'yxati', srcId: 'api', hint: 'serverdan keladi' },
    { q: 'Taom nomi va narxi', srcId: 'props', hint: 'sahifadan TaomCard\'ga' },
    { q: 'Savatdagi soni (bosilganda ortadi)', srcId: 'state', hint: 'komponent xotirasi' }
  ];
  const SRC = [{ id: 'api', label: 'API (fetch)' }, { id: 'props', label: 'Props' }, { id: 'state', label: 'State' }];
  const [taskIdx, setTaskIdx] = useState(storedAnswer ? ITEMS.length : 0);
  const [shake, setShake] = useState(null);
  const timer = useRef(null);
  const done = taskIdx >= ITEMS.length;
  useEffect(() => () => clearTimeout(timer.current), []);
  const cur = ITEMS[Math.min(taskIdx, ITEMS.length - 1)];
  const tap = (id) => { if (done) return; if (id === cur.srcId) setTaskIdx(t => t + 1); else { clearTimeout(timer.current); setShake(id); timer.current = setTimeout(() => setShake(null), 450); } };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="4-qadam · ma'lumot" screen={screen} scrollSignal={done} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Ma'lumotni joylang (${Math.min(taskIdx, ITEMS.length)}/3)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Har ma'lumot <span className="italic" style={{ color: T.accent }}>qayerda</span> yashaydi?</h2></div>
        <Mentor>Promptni aniq yozish uchun ma'lumot qayerdan kelishini bilish kerak. 3 ta uy bor — <b style={{ color: T.ink }}>API</b> (serverdan), <b style={{ color: T.ink }}>props</b> (otadan bolaga), <b style={{ color: T.ink }}>state</b> (o'zgaradigan xotira). Har ma'lumotga to'g'ri uyni tanlang.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">Ma'lumotlar</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {ITEMS.map((it, i) => {
                const matched = i < taskIdx; const activeRow = !done && i === taskIdx;
                return (
                  <div key={it.q} className="routerow" style={{ boxShadow: activeRow ? `inset 0 0 0 1.5px ${T.accent}` : (matched ? `inset 0 0 0 1.5px ${T.success}` : `0 4px 12px -6px rgba(${T.shadowBase},0.14)`), background: matched ? T.successSoft : T.paper }}>
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: matched ? T.success : T.ink }}>{it.q}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: matched ? T.success : T.ink3 }}>{matched ? SRC.find(s => s.id === it.srcId).label : (activeRow ? '?' : '…')}</span>
                  </div>
                );
              })}
            </div>
          </Col>
          <Col>
            {!done ? (
              <>
                <div className="sk-info" key={taskIdx}><p className="body" style={{ margin: 0, color: T.ink }}><b style={{ color: T.accent }}>{cur.q}</b> — qaysi uyda yashaydi? <span style={{ color: T.ink3 }}>({cur.hint})</span></p></div>
                <p className="flow-label" style={{ margin: 0 }}>Uyni tanlang</p>
                <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {SRC.map(s => <button key={s.id} className={`gchip ${shake === s.id ? 'shake' : ''}`} onClick={() => tap(s.id)} style={{ padding: '11px 15px' }}>{s.label}</button>)}
                </div>
              </>
            ) : (
              <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Tayyor! <b>API</b> — serverdagi taomlar ro'yxati · <b>props</b> — TaomCard'ga uzatiladigan nom/narx · <b>state</b> — savatdagi soni (bosilganda o'zgaradi). Endi promptni aniq yozishga tayyorsiz.</p></div>
            )}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — ANIQ PROMPT (darsning yuragi) =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const SPECS = [
    { id: 'sec', tag: '① Qaysi bo\'limlar', add: 'Hero (aksiya banner), Kategoriyalar, Mashhur taomlar grid, Footer' },
    { id: 'what', tag: '② Har bo\'lim nima ko\'rsatadi', add: 'grid\'da 8 ta TaomCard — rasm, nom, narx, "Savatga" tugma' },
    { id: 'data', tag: '③ Ma\'lumot / uslub', add: 'taomlar API\'dan kelsin, issiq apelsin-qizil uslub' }
  ];
  const [sel, setSel] = useState(storedAnswer ? new Set(SPECS.map(s => s.id)) : new Set());
  const done = sel.size >= SPECS.length;
  const toggle = (id) => setSel(prev => { const s = new Set(prev); if (s.has(id)) s.delete(id); else s.add(id); return s; });
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const pct = Math.round((sel.size / SPECS.length) * 100);
  const chosen = SPECS.filter(s => sel.has(s.id));
  const meterCol = pct >= 100 ? T.success : (pct >= 34 ? T.accent : T.ink3);
  return (
    <Stage eyebrow="5-qadam · aniq prompt" screen={screen} scrollSignal={done} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : '3 ta aniqlik qo\'shing'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">"Bosh sahifa qur" yetarli emas — <span className="italic" style={{ color: T.accent }}>aniq</span> prompt yozamiz.</h2></div>
        <Mentor>Bu — eng muhim mahorat. AI fikringizni o'qiy olmaydi: noaniq aytsangiz — <b style={{ color: T.ink }}>taxmin qiladi</b> va xato chiqadi. Promptga 3 narsani qo'shing — har biri promptni aniqroq qiladi. Aniqlik o'lchagichini to'ldiring.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">Promptni aniqlang — qo'shimchalarni bosing</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SPECS.map(s => <button key={s.id} className={`chip ${sel.has(s.id) ? 'chip-on' : ''}`} style={{ alignSelf: 'flex-start', textAlign: 'left', height: 'auto', padding: '9px 14px' }} onClick={() => toggle(s.id)}>{sel.has(s.id) ? '✓ ' : '+ '}{s.tag}</button>)}
            </div>
            <div className="prompt-box fade-up delay-2">
              <span className="prompt-q">"</span>Bosh sahifani qur{chosen.length ? <>: {chosen.map((s, i) => <span key={s.id}><span style={{ color: T.success, fontWeight: 700 }}>{s.add}</span>{i < chosen.length - 1 ? '; ' : ''}</span>)}</> : <span style={{ color: T.ink3, fontStyle: 'italic' }}> …aniqlik qo'shing</span>}<span className="prompt-q">"</span>
            </div>
          </Col>
          <Col>
            <p className="flow-label" style={{ margin: 0 }}>Prompt aniqligi</p>
            <div className="fade-up delay-2" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ height: 12, borderRadius: 99, background: 'rgba(167,166,162,0.25)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${pct}%`, background: meterCol, borderRadius: 99, transition: 'width 0.4s ease, background 0.4s' }} />
              </div>
              <span className="mono small" style={{ color: meterCol, fontWeight: 700 }}>{pct}% aniq</span>
            </div>
            {!done
              ? <div className="hint fade-step"><p className="body" style={{ margin: 0, color: T.ink2 }}>Prompt hali noaniq — AI <b style={{ color: T.ink }}>taxmin qilyapti</b>. Yana {SPECS.length - sel.size} ta aniqlik qo'shing: AI nima quryotganini aniq bilsin.</p></div>
              : <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana <b>aniq prompt</b>! Formula: <b>Qaysi bo'limlar</b> + <b>Har bo'lim nima ko'rsatadi</b> + <b>Ma'lumot/uslub</b>. AI endi taxmin qilmaydi — aynan kerakli narsani quradi. Endi shu promptni agentga yuboramiz.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — QURISH (vibecoding: AgentBuild) =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [done, setDone] = useState(!!storedAnswer);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Qurish · agent" screen={screen} scrollSignal={done} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Agent bilan quring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Aniq prompt tayyor — endi <span className="italic" style={{ color: T.accent }}>agentga</span> yuboramiz.</h2></div>
        <Mentor>Halqa o'sha: promptni yig'ing → agentga yuboring → rejani tasdiqlang → kodni tekshiring. Aniqlik qo'shgan sari prompt kuchayadi. Yuboring va natijani ko'ring.</Mentor>
        <div className="split">
          <Col>
            <AgentBuild
              base="Bosh sahifani qur"
              parts={[{ id: 'sec', label: 'Hero, Kategoriyalar, Taomlar grid, Footer bo\'limlari bilan' }, { id: 'card', label: 'gridda takrorlanuvchi TaomCard (nom, narx, "Savatga")' }, { id: 'data', label: 'taomlar API\'dan, map bilan chizilsin' }]}
              planSteps={["Bo'limlar: Hero, Categories, TaomList, Footer", "TaomCard komponenti: function TaomCard(props)", "Taomlarni API'dan olib, map bilan chizaman"]}
              code={<><Jx>{'function'}</Jx>{' TaomCard(props) { '}<Jx>{'return'}</Jx>{' <div>{props.nom} — {props.narx}</div> }'}{'\n\n'}{'{taomlar.map(t => '}<Jx>{'<TaomCard '}</Jx><At>taom</At>{'={t}'}<Jx>{' />'}</Jx>{')}'}</>}
              storedDone={!!storedAnswer}
              onDone={() => setDone(true)}
            />
          </Col>
          <Col>
            <p className="flow-label">Natija — bosh sahifa</p>
            <Win title="Yetkaz — localhost:5173" minH={150}>
              {done
                ? <div className="fade-step"><HomePreview /></div>
                : <p style={{ color: T.ink3, fontStyle: 'italic', margin: 0, fontFamily: 'Georgia, serif', fontSize: 13, textAlign: 'center' }}>Promptni yig'ib, agentga yuboring…</p>}
            </Win>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bosh sahifa qurildi! Hero + Kategoriyalar + TaomCard'li grid + Footer — aniq prompt aynan kerakligini berdi. Endi tekshiramiz: hammasi joyidami?</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 9 — TEST 3 (prompt sifati) =====
const Screen9 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="Qaysi prompt AI'ga eng yaxshi natija beradi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Qaysi <span className="italic" style={{ color: T.accent }}>prompt</span> eng yaxshi natija beradi?</h2></>}
    options={["\"Bosh sahifa: Hero (aksiya), Kategoriyalar, 8 ta TaomCard'li grid (nom+narx+Savatga), Footer\"", "\"Chiroyli ovqat sayti qur\"", "\"Sayt qur\"", "\"Menga kod yoz\""]} correctIdx={0}
    explainCorrect="To'g'ri! Aniq prompt = qaysi bo'limlar + har bo'lim nima ko'rsatadi. AI taxmin qilmaydi — aynan shuni quradi."
    explainWrong={{
      1: "\"Chiroyli\" — noaniq. Qaysi bo'limlar? Nima ko'rsatadi? AI taxmin qiladi. Aniq ayting.",
      2: "Juda umumiy — AI nima qurishni bilmaydi. Bo'limlar va mazmunni sanang.",
      3: "Qanday kod? Nima haqida? AI uchun aniq bo'lim va mazmun kerak.",
      default: "Eng yaxshi prompt: bo'limlar + har bo'lim mazmuni aniq sanalgan."
    }} />
);

// ===== SCREEN 10 — DEBUGGING (tuzatuvchi / follow-up prompt) =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const FIXES = [
    { id: 'price', label: 'Har TaomCard\'ga narxni qo\'sh (props.narx + " so\'m")', ok: true },
    { id: 'redo', label: 'Hammasini o\'chirib, qaytadan yozdir', ok: false },
    { id: 'color', label: 'Kartochka rangini o\'zgartir', ok: false }
  ];
  const [fixed, setFixed] = useState(!!storedAnswer);
  const [wrong, setWrong] = useState(null);
  const timer = useRef(null);
  const done = fixed;
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const choose = (f) => {
    if (fixed) return;
    if (f.ok) setFixed(true);
    else { clearTimeout(timer.current); setWrong(f.id); timer.current = setTimeout(() => setWrong(null), 2600); }
  };
  return (
    <Stage eyebrow="Debugging · tuzatish" screen={screen} scrollSignal={fixed} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Xatoni tuzating'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">AI qurdi — siz <span className="italic" style={{ color: T.accent }}>tekshirasiz</span> va tuzatasiz.</h2></div>
        <Mentor>Agent bosh sahifani qurdi. Lekin diqqat bilan qarang — <b style={{ color: T.ink }}>bir narsa yetishmayapti</b>! AI har doim ham mukammal qilmaydi. Siz — NAZORATCHI: xatoni topib, <b style={{ color: T.ink }}>tuzatuvchi (follow-up) prompt</b> berasiz.</Mentor>
        <div className="split">
          <Col>
            <div className="ai-card fade-up delay-1">
              <div className="ai-row"><span className="ai-badge">AI</span><span className="ai-bubble">Bosh sahifani qurib bo'ldim!</span></div>
              <div style={{ background: T.bg, borderRadius: 10, padding: 10 }}>
                <TaomGrid hidePrice={!fixed} />
              </div>
              {!fixed
                ? <p className="ai-prompt" style={{ color: T.danger, fontStyle: 'normal', fontWeight: 600 }}>⚠ Kartochkalarda narx ko'rinmayapti!</p>
                : <p className="ai-prompt" style={{ color: T.success, fontStyle: 'normal', fontWeight: 600 }}>✓ Narxlar qo'shildi — endi to'g'ri!</p>}
            </div>
          </Col>
          <Col>
            <p className="flow-label">To'g'rilovchi (follow-up) promptni tanlang</p>
            <div className="fade-up delay-2" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {FIXES.map(f => (
                <button key={f.id} className={`hook-option ${fixed && f.ok ? 'on' : ''} ${wrong === f.id ? 'shake' : ''}`} disabled={fixed} onClick={() => choose(f)}>
                  <span style={{ fontSize: 15 }}>{fixed && f.ok ? '✓' : '✍️'}</span><span>{f.label}</span>
                </button>
              ))}
            </div>
            {wrong && <p className="small fade-step" style={{ color: T.danger, fontStyle: 'italic', margin: 0 }}>{wrong === 'redo' ? "Hammasini qaytadan yozish shart emas — faqat bitta narsa (narx) yetishmayapti. Aniq, kichik follow-up bering." : "Rang muammo emas — narx yetishmayapti. Aniq nimani tuzatishni ayting."}</p>}
            {fixed && <div className="takeaway fade-step"><div className="ta-bulb">🛠️</div><p className="ta-h">Topdingiz va aniq follow-up bilan tuzatdingiz!</p><p className="ta-sub">AI tez yozadi, siz tekshirib aniq tuzatasiz — zo'r jamoa</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — TRANSFER (o'z saytingizni tanlab bo'laklang) =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const IDEAS = [
    { id: 'recipe', e: '🍳', name: 'Retseptlar', card: 'RetseptCard', pages: 'Bosh · retsept · sevimlilar', first: 'Hero + retseptlar grid (RetseptCard) + Footer' },
    { id: 'game', e: '🎮', name: 'O\'yinlar', card: 'OyinCard', pages: 'Bosh · o\'yin · top ro\'yxat', first: 'Hero + o\'yinlar grid (OyinCard) + Footer' },
    { id: 'book', e: '📚', name: 'Kutubxona', card: 'KitobCard', pages: 'Bosh · kitob · o\'qiganlarim', first: 'Hero + kitoblar grid (KitobCard) + Footer' },
    { id: 'club', e: '⚽', name: 'Sport klub', card: 'MashgulotCard', pages: 'Bosh · mashg\'ulot · a\'zolik', first: 'Hero + mashg\'ulotlar grid (MashgulotCard) + Footer' }
  ];
  const [idea, setIdea] = useState(storedAnswer ? IDEAS[0] : null);
  const [step, setStep] = useState(storedAnswer ? 3 : 0); // 0 tanla, 1 sahifa, 2 komponent, 3 prompt
  const done = step >= 3;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const choose = (i) => { setIdea(i); setStep(1); };
  return (
    <Stage eyebrow="O'z saytingiz" screen={screen} scrollSignal={done} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : (idea ? 'Bo\'laklashni tugating' : 'Saytingizni tanlang')} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Endi <span className="italic" style={{ color: T.accent }}>o'z saytingizni</span> tanlab, bo'laklang.</h2></div>
        <Mentor>Mana eng muhim qadam: <b style={{ color: T.ink }}>o'z g'oyangizni</b> tanlang — va xuddi "Yetkaz" kabi bo'laklang. Ko'rasiz: usul <b>aynan o'sha</b> — sahifalar + takrorlanuvchi komponent + birinchi aniq prompt.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">Bitta g'oyani tanlang</p>
            <div className="fade-up delay-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {IDEAS.map(i => <button key={i.id} className={`chip ${idea?.id === i.id ? 'chip-on' : ''}`} style={{ flexDirection: 'column', alignItems: 'flex-start', gap: 2, padding: '12px 13px', height: 'auto' }} onClick={() => choose(i)}><span style={{ fontSize: 17 }}>{i.e} {i.name}</span></button>)}
            </div>
          </Col>
          <Col>
            {!idea ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Chapdan g'oya tanlang</p></div> : (
              <div className="fade-step">
                <p className="flow-label" style={{ marginBottom: 8 }}>"{idea.name}" bo'laklari</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div className="dstep" style={{ opacity: step >= 1 ? 1 : 0.4 }}>
                    <span className="dstep-n">📄</span><div><b style={{ fontSize: 12.5 }}>Sahifalar</b><p style={{ fontSize: 11.5, color: T.ink2, margin: 0 }}>{idea.pages}</p></div>
                  </div>
                  {step >= 2 && <div className="dstep el-in"><span className="dstep-n">🧩</span><div><b style={{ fontSize: 12.5 }}>Takrorlanuvchi komponent</b><p style={{ fontSize: 11.5, color: T.ink2, margin: 0 }}><span className="mono">{`<${idea.card} />`}</span> — gridda takrorlanadi</p></div></div>}
                  {step >= 3 && <div className="dstep el-in" style={{ boxShadow: `inset 0 0 0 1.5px ${T.success}` }}><span className="dstep-n">✍️</span><div><b style={{ fontSize: 12.5, color: T.success }}>Birinchi aniq prompt</b><p style={{ fontSize: 11.5, color: T.ink2, margin: 0 }}>"Bosh sahifa: {idea.first}"</p></div></div>}
                  {step === 1 && <button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setStep(2)}>Keyingi: takror komponent →</button>}
                  {step === 2 && <button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setStep(3)}>Keyingi: birinchi prompt →</button>}
                </div>
                {done && <div className="frame-success fade-step" style={{ marginTop: 10 }}><p className="body" style={{ margin: 0, color: T.ink }}>Ko'rdingizmi? "{idea.name}" ham xuddi "Yetkaz" kabi bo'laklandi: sahifalar + <span className="mono">{idea.card}</span> + birinchi aniq prompt. <b>Usul o'sha</b> — istalgan saytga ishlaydi.</p></div>}
              </div>
            )}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — TEST 4 (monolit → bo'laklash) =====
const Screen12 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 4-savol"
    questionText="AI hamma kodni bitta ulkan komponentga yozdi. Nima qilasiz?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>AI hamma kodni <span className="italic" style={{ color: T.accent }}>bitta ulkan komponentga</span> yozdi — nima qilasiz?</h2></>}
    options={["Bo'limlarga ajratishni so'rayman (Navbar, Hero, TaomList, Footer...)", "Shundayligicha qoldiraman — ishlayapti-ku", "Hammasini o'chiraman", "Yana ko'proq kod qo'shaman"]} correctIdx={0}
    explainCorrect="To'g'ri! Bitta ulkan komponent (monolit) — yomon: o'zgartirish, qayta ishlatish qiyin. AI'dan uni kichik komponentlarga bo'lishni so'raysiz — har biri alohida, oson."
    explainWrong={{
      1: "Ishlasa ham — monolitni keyin o'zgartirish azob. Bo'laklashni so'rang.",
      2: "Yo'q — o'chirmaymiz, bo'laklaymiz: bitta katta → bir nechta kichik komponent.",
      3: "Aksincha — kod ko'paymaydi, lekin tartibli bo'laklarga ajraladi.",
      default: "Monolitni kichik komponentlarga bo'lishni so'rash — to'g'ri yo'l."
    }} />
);

// ===== SCREEN 13 — BITIRUV (to'liq yo'l + formula) =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const JOURNEY = [
    { e: '🧩', t: 'Komponent + props', d: 'qayta ishlatiladigan bloklar' },
    { e: '💾', t: 'State + Effect', d: 'jonli, o\'zgaradigan ilova' },
    { e: '🌐', t: 'API — CRUD', d: 'serverdan olish va saqlash' },
    { e: '🧭', t: 'Router', d: 'ko\'p sahifali sayt' },
    { e: '✍️', t: 'Aniq prompt', d: 'bo\'limlar + mazmun + ma\'lumot' },
    { e: '🔧', t: 'Tekshir → tuzat', d: 'follow-up prompt bilan debug' }
  ];
  const [seen, setSeen] = useState(storedAnswer ? new Set(JOURNEY.map(j => j.t)) : new Set());
  const done = seen.size >= JOURNEY.length;
  const tap = (t) => setSeen(prev => { const s = new Set(prev); s.add(t); return s; });
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Bitiruv · to'liq yo'l" screen={screen} scrollSignal={done} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Yo\'lingizni ko\'ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Qarang — siz <span className="italic" style={{ color: T.accent }}>qancha yo'l</span> bosib o'tdingiz.</h2></div>
        <Mentor>Bir necha dars oldin React nima ekanini bilmasdingiz. Endi esa — to'liq saytlar qurasiz. Bosib o'tgan <b style={{ color: T.ink }}>6 ta kuchni</b> bosib, eslang. Bularning hammasi endi sizning qo'lingizda.</Mentor>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {JOURNEY.map(j => (
                <button key={j.t} className="vcard" onClick={() => tap(j.t)} style={{ boxShadow: seen.has(j.t) ? `inset 0 0 0 1.5px ${T.success}` : undefined }}>
                  <span style={{ fontSize: 20 }}>{j.e}</span>
                  <span style={{ display: 'flex', flexDirection: 'column' }}><span className="vlbl">{j.t}</span><span style={{ fontSize: 11, color: T.ink2, fontWeight: 500 }}>{j.d}</span></span>
                  <span className="vseen" style={{ color: seen.has(j.t) ? T.success : T.ink3 }}>{seen.has(j.t) ? '✓' : ''}</span>
                </button>
              ))}
            </div>
          </Col>
          <Col>
            <div className="frame" style={{ background: T.ink, color: '#fff', padding: '20px 22px' }}>
              <p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, fontSize: 'clamp(18px,2.5vw,22px)', margin: '0 0 10px', color: '#fff' }}>Sizning formulangiz:</p>
              <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 13.5, lineHeight: 1.9, color: '#fff', margin: 0 }}>
                g'oya → <span style={{ color: '#FFD380' }}>bo'laklash</span> → <span style={{ color: '#7DD181' }}>aniq prompt</span> → agent quradi → <span style={{ color: '#FF7755' }}>tekshir</span> → tuzat
              </p>
              {done && <p className="fade-step" style={{ fontFamily: "'Manrope',sans-serif", fontSize: 13.5, margin: '14px 0 0', color: '#fff', opacity: 0.92 }}>Bu formula bilan siz <b style={{ color: '#FFD380' }}>istalgan saytni</b> qurasiz — ovqat, do'kon, o'yin, kutubxona... mavzu muhim emas. Usul sizniki.</p>}
            </div>
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — YAKUNIY (VS Code: takrorlanuvchi komponentni e'lon qilish) =====
const Screen14 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [value, setValue] = useState(storedAnswer?.picked || '');
  const [passed, setPassed] = useState(!!storedAnswer?.correct);
  const norm = value.replace(/\s+/g, ' ').trim();
  const valid = /^function\s+[A-Z][A-Za-z0-9]*\s*\(\s*props\s*\)\s*\{?$/.test(norm);
  const hasFn = /\bfunction\b/.test(value);
  const hasCap = /\bfunction\s+[A-Z]/.test(value);
  const hasProps = /\(\s*props\s*\)/.test(value);
  const lowerName = /\bfunction\s+[a-z]/.test(value);
  useEffect(() => {
    if (valid && !passed) {
      setPassed(true);
      onAnswer(screen, { stage: 'final', screenIdx: screen, question: 'VS Code: function TaomCard(props) {', studentAnswer: value, correct: true, firstAttemptCorrect: true, solved: true, picked: value });
    }
  }, [valid]);
  const Ln = ({ n, children }) => (
    <div className="vsc-line"><span className="vsc-ln">{n}</span><span style={{ whiteSpace: 'pre' }}>{children}</span></div>
  );
  return (
    <Stage eyebrow="Yakuniy · amaliy" screen={screen} scrollSignal={passed} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!passed} label={passed ? 'Davom etish' : 'Komponentni e\'lon qiling'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Oxirgi qadam: takrorlanuvchi <span className="italic" style={{ color: T.accent }}>komponentni</span> o'zingiz yarating.</h2></div>
        <Mentor>Bo'laklashning yuragi — takrorlanuvchini komponentga aylantirish. <span className="mono">TaomCard</span> komponentini e'lon qiling: <b style={{ color: T.ink }}>function</b> + <b style={{ color: T.ink }}>Katta harf nom</b> (TaomCard) + <b style={{ color: T.ink }}>(props)</b> + <b style={{ color: T.ink }}>{'{'}</b>.</Mentor>
        <div className="split">
          <Col>
            <div className="vsc fade-up delay-2">
              <div className="vsc-bar">
                <span className="vsc-tab on"><span style={{ color: '#61DAFB' }}>⚛</span> TaomCard.jsx <span style={{ color: '#6E7681', marginLeft: 4 }}>×</span></span>
              </div>
              <div className="vsc-body">
                <div className="vsc-line">
                  <span className="vsc-ln">1</span>
                  <input className={`vsc-input ${valid ? 'ok' : ''}`} value={value} onChange={e => setValue(e.target.value)} placeholder='function TaomCard(props) {' spellCheck={false} autoCapitalize="off" autoCorrect="off" />
                </div>
                <Ln n={2}>{'  '}<Jx>{'return'}</Jx>{' ('}</Ln>
                <Ln n={3}>{'    '}<Jx>{'<div>'}</Jx>{'{props.nom} — {props.narx}'}<Jx>{'</div>'}</Jx></Ln>
                <Ln n={4}>{'  );'}</Ln>
                <Ln n={5}>{'}'}</Ln>
              </div>
            </div>
            <div className="fade-up delay-2" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="tagpill" style={{ opacity: hasFn ? 1 : 0.4 }}>{hasFn ? '✓' : '1'} function</span>
              <span className="tagpill" style={{ opacity: hasCap ? 1 : 0.4 }}>{hasCap ? '✓' : '2'} Katta harf nom</span>
              <span className="tagpill" style={{ opacity: hasProps ? 1 : 0.4 }}>{hasProps ? '✓' : '3'} (props)</span>
            </div>
            {lowerName && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Komponent nomi <b>Katta harf</b> bilan: <span className="mono">TaomCard</span> (React shundan komponentligini biladi).</p></div>}
            {passed && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Mukammal! Siz komponent yaratdingiz — bo'laklashning eng asosiy amali. Endi istalgan UI'ni kichik, qayta ishlatiladigan bloklarga ajrata olasiz.</p></div>}
          </Col>
          <Col>
            <p className="flow-label">natija — komponent tayyor</p>
            <Win title="Yetkaz — localhost:5173" minH={130}>
              {valid
                ? <div className="fade-step"><TaomGrid /><p className="small" style={{ color: T.success, fontWeight: 700, margin: '7px 0 0' }}>✓ Bitta TaomCard — to'rtta taom (props bilan)</p></div>
                : <p style={{ fontFamily: 'Georgia, serif', color: T.ink3, fontStyle: 'italic', margin: 0, textAlign: 'center', lineHeight: 1.5 }}>Komponent e'lon qilinmaguncha bo'sh: <span className="mono" style={{ fontStyle: 'normal' }}>function TaomCard(props) {'{'}</span></p>}
            </Win>
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 15 — YAKUN (MODUL BITIRUVI) =====
const Screen15 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const RECAP = [
    "Saytni bo'laklash: sahifalar (Router) + bo'limlar (komponentlar)",
    "Takrorlanuvchi → bitta komponent + props + map",
    "Aniq prompt: qaysi bo'limlar + har bo'lim mazmuni + ma'lumot",
    "Qur → tekshir → follow-up prompt bilan tuzat",
    "g'oya → bo'laklash → prompt → qurish → tekshirish"
  ];
  const HOMEWORK = [
    { b: 'O\'z saytingiz', t: '— g\'oyani qog\'ozga bo\'laklang: sahifalar, komponentlar, birinchi bo\'lim prompti' },
    { b: 'Qurib boshlang', t: '— Antigravity bilan bosh sahifadan boshlab, bo\'lim-bo\'lim quring' },
    { b: 'Portfolio', t: '— tayyor saytni deploy qilib, do\'stlaringizga ko\'rsating' }
  ];
  const GLOSSARY = [
    { b: 'Bo\'laklash', t: '— katta saytni sahifa va bo\'limlarga ajratish' },
    { b: 'Komponent daraxti', t: '— blok ichida blok strukturasi' },
    { b: 'Takror → props', t: '— takrorlanuvchi = bitta komponent + props' },
    { b: 'Aniq prompt', t: '— bo\'limlar + mazmun + ma\'lumot/uslub' },
    { b: 'Follow-up prompt', t: '— AI xatosini tuzatuvchi qo\'shimcha so\'rov' },
    { b: 'Monolit', t: '— hammasi bitta ulkan komponentda (yomon)' }
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
    <Stage eyebrow="Modul tugadi 🎓" screen={screen} navContent={<><NavBack onPrev={onPrev} /><button className="btn-ghost" onClick={onReset} style={{ padding: 'clamp(11px,1.6vw,13px) clamp(16px,2.2vw,22px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Qaytadan</button><button className="btn-white-accent" onClick={onFinish} style={{ marginLeft: 'auto', padding: 'clamp(11px,1.6vw,13px) clamp(22px,2.6vw,30px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Yakunlash ✓</button></>}>
      <div className="screen">
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">✓</span> React moduli tugadi</span><h2 className="title h-title fade-up d1">Siz endi <span className="italic" style={{ color: T.accent }}>React dasturchisiz</span>.</h2><p className="body h-sub fade-up d2">{PASSED ? "Tabriklaymiz! Komponent, state, API, Router, bo'laklash va aniq prompt — hammasi sizda. Endi g'oyani aytib, bo'laklab, AI bilan istalgan saytni qurasiz." : "Yaxshi harakat! Bo'laklash va aniq prompt'ni mustahkamlash uchun bir-ikki ekranni qayta ko'ring."}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span className="tick" style={{ width: 16, height: 16, borderRadius: '50%', background: T.success, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck">✓</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>🎓 Bitiruv vazifasi</div><p className="body" style={{ margin: '0 0 10px', color: T.ink }}>Endi o'z saytingizni quring:</p><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">Modul tugadi — lekin sizning yo'lingiz endi boshlanyapti. G'oyangiz bormi? Bugun boshlang! 🚀</p></div>
        </div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">💡 Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function ReactBuildSiteLesson({ lang: langProp, onFinished }) {
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

  const screens = [Screen0, Screen1, Screen2, Screen3, Screen4, Screen5, Screen5b, Screen6, Screen7, Screen8, Screen9, Screen10, Screen11, Screen12, Screen13, Screen14, Screen15];
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

        .vcard { display: flex; align-items: center; gap: 11px; width: 100%; text-align: left; background: ${T.paper}; border: none; border-radius: 12px; padding: 12px 15px; cursor: pointer; transition: all 0.18s; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.16); }
        .vcard:hover { transform: translateY(-1px); }
        .vlbl { font-family: 'Manrope', sans-serif; font-weight: 700; font-size: 13.5px; color: ${T.ink}; }
        .vseen { margin-left: auto; font-weight: 700; }

        .mentor { display: flex; gap: 12px; align-items: flex-start; }
        .mentor-ava { width: 40px; height: 40px; border-radius: 50%; overflow: hidden; flex-shrink: 0; box-shadow: 0 4px 12px -4px rgba(${T.shadowBase},0.28); }
        .mentor-ava svg { display: block; }
        .mentor-col { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 5px; }
        .mentor-name { font-family: 'Manrope', sans-serif; font-weight: 700; font-size: 13px; color: ${T.accent}; letter-spacing: 0.01em; }
        .mentor-msg { background: ${T.paper}; border-radius: 4px 14px 14px 14px; padding: 13px 16px; color: ${T.ink}; box-shadow: 0 6px 18px -6px rgba(${T.shadowBase},0.16); }

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

        .frame { background: ${T.paper}; border-radius: 16px; padding: clamp(16px,3vw,24px); border: none; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.14); }
        .frame-soft { background: ${T.accentSoft}; border-left: 4px solid ${T.accent}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); box-shadow: 0 6px 16px -6px rgba(255,79,40,0.22); }
        .frame-success { background: ${T.successSoft}; border-left: 4px solid ${T.success}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); box-shadow: 0 6px 16px -6px rgba(31,122,77,0.22); }
        .frame-warn { background: ${T.accentSoft}; border-left: 4px solid ${T.accent}; border-radius: 12px; padding: 12px 15px; }
        .frame-dash { border: 1.5px dashed ${T.ink3}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); }

        .screen { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: clamp(14px,2vw,20px); }
        .head { display: flex; flex-direction: column; gap: 6px; }
        .split { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: clamp(18px,3vw,36px); align-items: start; }
        .col { display: flex; flex-direction: column; gap: clamp(12px,2vw,16px); min-width: 0; }
        @media (max-width: 760px) { .split { grid-template-columns: 1fr; gap: clamp(14px,3vw,20px); } }
        .flow-label { font-family: 'Manrope'; font-weight: 700; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: ${T.ink2}; }

        .roadmap { display: flex; flex-direction: column; gap: 8px; list-style: none; }
        .step-card { display: flex; align-items: center; gap: 14px; background: ${T.paper}; border-radius: 12px; padding: 13px 16px; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.14); }
        .step-num { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 13px; color: ${T.accent}; flex-shrink: 0; }
        .step-body { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .step-text { font-weight: 500; font-size: clamp(14px,1.7vw,16px); color: ${T.ink}; }
        .step-tag { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink2}; background: ${T.bg}; padding: 3px 8px; border-radius: 6px; }

        .sk-info { background: ${T.paper}; border-radius: 12px; padding: 15px 17px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.16); animation: fade-step 0.3s; }
        .sk-tagbig { display: flex; align-items: center; gap: 9px; flex-wrap: wrap; }
        .sk-wordbadge { font-family: 'Manrope'; font-weight: 700; font-size: 13px; color: ${T.accent}; background: ${T.accentSoft}; padding: 4px 10px; border-radius: 6px; }
        .hint { background: ${T.bg}; border: 1.5px dashed ${T.ink3}; border-radius: 12px; padding: 14px 16px; font-size: clamp(13px,1.5vw,14px); color: ${T.ink2}; }

        .ai-card { background: ${T.paper}; border-radius: 14px; padding: 15px 17px; display: flex; flex-direction: column; gap: 11px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.14); }
        .ai-row { display: flex; align-items: center; gap: 9px; } .ai-badge { font-family: 'Manrope'; font-weight: 800; font-size: 11px; color: #fff; background: ${T.blue}; padding: 3px 9px; border-radius: 6px; } .ai-bubble { font-size: 13px; color: ${T.ink2}; }
        .ai-code { background: ${CODE.bg}; border-radius: 9px; padding: 10px 12px; display: flex; flex-direction: column; gap: 3px; }
        .ai-line { font-family: 'JetBrains Mono'; font-size: 13px; color: ${CODE.text}; cursor: pointer; padding: 7px 9px; border-radius: 6px; transition: all 0.15s; white-space: pre-wrap; } .ai-line:hover { background: rgba(255,255,255,0.06); }
        .ai-line.bad { background: rgba(255,79,40,0.16); box-shadow: inset 0 0 0 1px ${T.accent}; } .ai-line.ok { background: rgba(31,122,77,0.16); }
        .ai-prompt { font-size: 12px; color: ${T.ink3}; margin: 0; font-style: italic; } .note-h { font-weight: 700; font-size: 13px; margin: 0 0 4px; }
        .prompt-box { font-family: 'Manrope', sans-serif; font-size: 13px; line-height: 1.5; color: ${T.ink}; background: ${T.bg}; border-radius: 10px; padding: 11px 13px; }
        .prompt-q { color: ${T.accent}; font-weight: 800; }
        .takeaway { background: ${T.accentSoft}; border-radius: 14px; padding: 20px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 5px; } .ta-bulb { font-size: 34px; } .ta-h { font-family: 'Source Serif 4', serif; font-weight: 600; font-size: clamp(16px,2.2vw,20px); color: ${T.ink}; margin: 0; } .ta-sub { color: ${T.accent}; font-weight: 600; font-size: 13px; margin: 0; }

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

        /* === PRAKTIKA · BUILD SITE CSS === */
        .bp-bar { background: #f0eee8; padding: 8px 11px; display: flex; align-items: center; gap: 9px; }
        .bb-dots { display: flex; gap: 5px; }
        .bb-dots i { width: 9px; height: 9px; border-radius: 50%; }
        .bb-dots i:first-child { background: #ff5f57; } .bb-dots i:nth-child(2) { background: #febc2e; } .bb-dots i:nth-child(3) { background: #28c840; }
        .bp-title { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink3}; }
        .bp-body { padding: clamp(12px,2.2vw,18px); }
        .code-box { background: ${CODE.bg}; color: ${CODE.text}; font-family: 'JetBrains Mono', monospace; font-size: clamp(12px,1.5vw,13.5px); line-height: 1.55; padding: clamp(12px,2.2vw,16px); border-radius: 12px; overflow-x: auto; white-space: pre-wrap; word-break: break-word; margin: 0; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.2); }
        .routerow { display: flex; align-items: center; gap: 10px; padding: 10px 14px; border-radius: 11px; transition: all 0.3s; }
        .dstep { display: flex; align-items: center; gap: 11px; background: ${T.paper}; border-radius: 11px; padding: 10px 13px; box-shadow: 0 4px 12px -6px rgba(${T.shadowBase},0.14); cursor: default; }
        .dstep-n { font-size: 17px; flex-shrink: 0; }
        @keyframes shake { 0%,100% { transform: none; } 25% { transform: translateX(-4px); } 50% { transform: translateX(4px); } 75% { transform: translateX(-3px); } }
        .shake { animation: shake 0.4s ease; }
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
