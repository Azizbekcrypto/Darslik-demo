import React, { useState, useEffect, useRef, createContext, useContext } from 'react';
import mentorImg from '../../assets/common/mentor.png';

// ============================================================
// 10-DARS — JAVASCRIPT: SIKLLAR (for, while) + MASSIVNI AYLANIB CHIQISH — PLATFORM STANDARD v16
// Mavzu: takrorlash (sikl), for sikli (3 qism: boshlanish, shart, qadam),
//        while sikli (shart bajarilguncha), massiv (ro'yxat, indeks 0 dan),
//        massivni aylanib chiqish (sikl + massiv[i] + .length).
// Hook: 30 ta do'stga bir xil xabarni qo'lda yozish — takrorlash dardi.
// AUDIOSIZ versiya — Mentor matni qoladi, TTS yo'q.
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

const LESSON_META = { lessonId: 'js-loops-01-v16', lessonTitle: { uz: 'JavaScript — Sikllar (for, while)', ru: 'JavaScript — Циклы (for, while)' } };
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

// ===== KO'P TANLOVLI TEST (audiosiz) =====
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

// ===== MENTOR (matn, audiosiz) =====
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

// Terminal (console.log natijasi)
const Terminal = ({ lines, empty = '// natija shu yerda chiqadi…', title = 'console' }) => (
  <div className="term">
    <div className="term-bar"><span className="term-dot" style={{ background: '#FF5F56' }} /><span className="term-dot" style={{ background: '#FFBD2E' }} /><span className="term-dot" style={{ background: '#27C93F' }} /><span className="term-title">{title}</span></div>
    <div className="term-body">
      {lines.length === 0 ? <p className="term-empty">{empty}</p> : lines.map((l, i) => (
        <div key={i} className="term-line"><span className="term-arrow">›</span><span>{l}</span></div>
      ))}
    </div>
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

// ===== SCREEN 0 — HOOK (takrorlash dardi) =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const NEED = 30;
  const [count, setCount] = useState(0);
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const OPTS = [
    { id: 'a', label: "Bittalab — 1000 marta qo'lda yozaman" },
    { id: 'b', label: "Sikl bilan — bir marta yozib, takrorlataman" },
    { id: 'c', label: "Umuman yozmayman" }
  ];
  const write = () => setCount(c => Math.min(c + 1, NEED));
  const pick = (v) => { if (picked !== null) return; setPicked(v); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: true }); };
  return (
    <Stage eyebrow="Kirish" screen={screen} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 780 }}>30 ta do'stingizga bir xil xabarni <span className="italic" style={{ color: T.accent }}>bittalab</span> yozasizmi?</h1>
        <Mentor>Tasavvur qiling: bayramda 30 ta sinfdoshingizga <b style={{ color: T.ink }}>"Bayram muborak!"</b> deb yozmoqchisiz. Bittalab yozsangiz — qo'lingiz charchaydi. Tugmani bir necha marta bosing-chi, qancha zerikarli ekanini his qiling.</Mentor>
        <Zoomable>
        <Split>
          <Col>
            <p className="flow-label">Qo'lda yuborilgan xabarlar</p>
            <div className="msg-list fade-up delay-1">
              {count === 0 ? (
                <p style={{ color: T.ink3, fontStyle: 'italic', margin: 0, fontFamily: "'JetBrains Mono',monospace", fontSize: 13 }}>// hali bittasi ham yuborilmadi</p>
              ) : Array.from({ length: count }).map((_, i) => (
                <div key={i} className="msg-line el-in"><span className="msg-ok">✅</span><span>Do'st #{i + 1} — "Bayram muborak!"</span></div>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <button className={`btn ${count >= 20 ? 'btn-tired' : ''}`} onClick={write} disabled={count >= NEED} style={{ alignSelf: 'flex-start' }}>{count >= NEED ? '😮‍💨 Charchadim…' : '✍️ Yana bittasini yozish'}</button>
              <span className="mono small" style={{ color: T.ink3 }}>{count} / {NEED}</span>
            </div>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="flow-label" style={{ margin: 0 }}>Charchoq darajasi <span className="face-pop" key={count === 0 ? 0 : count < 12 ? 1 : count < 21 ? 2 : count < 30 ? 3 : 4} style={{ fontSize: 15 }}>{count < 12 ? '🙂' : count < 21 ? '😐' : count < 30 ? '😓' : '😮‍💨'}</span></span>
                <span className="mono small" style={{ color: count < NEED * 0.5 ? T.success : count < NEED * 0.8 ? '#C77800' : T.accent }}>{Math.round((count / NEED) * 100)}%</span>
              </div>
              <div className="fatigue"><div className="fatigue-bar" style={{ width: `${(count / NEED) * 100}%`, color: count < NEED * 0.5 ? T.success : count < NEED * 0.8 ? '#E6A100' : T.accent, background: count < NEED * 0.5 ? T.success : count < NEED * 0.8 ? '#E6A100' : T.accent }} /></div>
            </div>
            {count >= 5 && count < NEED && <p className="hook-ack fade-step">Hali <b>{NEED - count} ta</b> qoldi… va bu atigi 30 ta. 1000 ta bo'lsa-chi? 😅</p>}
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Dasturchi 1000 ta xabarni qanday yozadi?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => {
                const on = picked === o.id;
                return (
                  <button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null} onClick={() => pick(o.id)}>
                    <span className="radio">{on && <span className="radio-dot" />}</span>
                    <span>{o.label}</span>
                  </button>
                );
              })}
            </div>
            {picked !== null && <p className="hook-ack fade-step">To'g'ri yo'l — <b>sikl</b>! Bir marta yozasiz, kompyuter uni 1000 marta takrorlaydi. Bugun shuni o'rganamiz.</p>}
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
    { text: 'Sikl nima? — takrorlash', tag: '' },
    { text: 'for sikli — 3 qism', tag: 'boshlanish · shart · qadam' },
    { text: 'while sikli — shart bajarilguncha', tag: '' },
    { text: 'Massiv — qiymatlar ro\'yxati', tag: '[0], [1], [2]' },
    { text: 'Massivni aylanib chiqish — sikl + massiv', tag: '' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const PreviewBlock = (
    <Col>
      <p className="flow-label">Bugungi 2 katta vosita</p>
      <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="frame" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px' }}>
          <span className="ic-spin" style={{ fontSize: 32 }}>🔁</span>
          <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, color: T.ink, margin: 0, fontSize: 'clamp(16px,2.2vw,19px)' }}>SIKL</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>Bir amalni ko'p marta takrorlaydi (for, while)</p></div>
        </div>
        <div className="frame" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px' }}>
          <span className="ic-float" style={{ fontSize: 32 }}>📚</span>
          <div style={{ flex: 1 }}><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, color: T.ink, margin: 0, fontSize: 'clamp(16px,2.2vw,19px)' }}>MASSIV</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>Bitta o'zgaruvchida qiymatlar ro'yxati</p>
            <div className="mini-arr">{[0, 1, 2].map(i => <span key={i} className="mini-cell" style={{ animationDelay: `${i * 0.45}s` }}>{i}</span>)}</div>
          </div>
        </div>
      </div>
      <p className="mono small" style={{ color: T.accent, margin: 0 }}>→ ikkalasini birga ishlatsak — haqiqiy kuch!</p>
    </Col>
  );
  const StepsBlock = (
    <Col>
      <p className="flow-label">5 qadam</p>
      <ol className="roadmap">
        {STEPS.map((s, i) => (<li key={i} className="step-card fade-up" style={{ animationDelay: `${0.08 + i * 0.05}s` }}><span className="step-num">{String(i + 1).padStart(2, '0')}</span><span className="step-body"><span className="step-text">{s.text}</span>{s.tag && <span className="step-tag">{s.tag}</span>}</span></li>))}
      </ol>
    </Col>
  );
  return (
    <Stage eyebrow="Reja" screen={screen} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Boshlaymiz →" onClick={onNext} /></>}>
      <div className="screen">
        <div className="head">
          <h2 className="title h-title fade-up"><span className="italic" style={{ color: T.accent }}>Dangasa</span> dasturchi bo'lishni o'rganamiz!</h2>
        </div>
        <Mentor>Yaxshi dasturchi <b style={{ color: T.ink }}>takrorlashni yoqtirmaydi</b>. Bir ishni 100 marta yozish o'rniga, u <b style={{ color: T.ink }}>siklga</b> "100 marta takrorla" deydi. Bugun ikkita vositani ochamiz — <b style={{ color: T.ink }}>sikl</b> va <b style={{ color: T.ink }}>massiv</b> — 5 ta qadamda.</Mentor>
        {!isNarrow ? (
          <Zoomable><Split>{PreviewBlock}{StepsBlock}</Split></Zoomable>
        ) : !showSteps ? (
          <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>
            {PreviewBlock}
            <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>📋 Bugungi 5 qadamni ko'rish</button>
          </div>
        ) : (
          <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>
            <button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ Vositalarni ko'rish</button>
            {StepsBlock}
          </div>
        )}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — SIKL NIMA (siklsiz vs sikl bilan) =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [mode, setMode] = useState('manual');
  const [seen, setSeen] = useState(new Set(['manual']));
  const done = seen.size >= 2;
  const set = (m) => { setMode(m); setSeen(prev => { const n = new Set(prev); n.add(m); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Sikl nima" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Ikkala usulni ko'ring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bitta ishni <span className="italic" style={{ color: T.accent }}>5 marta</span> — qanday yozamiz?</h2></div>
        <Mentor>"Salom" so'zini 5 marta chop etmoqchimiz. <b style={{ color: T.ink }}>Siklsiz</b> — har birini alohida yozasiz (5 qator). <b style={{ color: T.ink }}>Sikl bilan</b> — bir marta yozib, "5 marta takrorla" deysiz. Ikkala tugmani bosib solishtiring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${mode === 'manual' ? 'chip-on' : ''}`} onClick={() => set('manual')}>😕 Siklsiz</button>
              <button className={`chip ${mode === 'loop' ? 'chip-on' : ''}`} onClick={() => set('loop')}>🔁 Sikl bilan</button>
            </div>
            <div className="codebox demo-swap" key={mode}>
              {mode === 'manual' ? (
                <>
                  <div><FN>console</FN>.<FN>log</FN>(<STR>"Salom"</STR>)</div>
                  <div><FN>console</FN>.<FN>log</FN>(<STR>"Salom"</STR>)</div>
                  <div><FN>console</FN>.<FN>log</FN>(<STR>"Salom"</STR>)</div>
                  <div><FN>console</FN>.<FN>log</FN>(<STR>"Salom"</STR>)</div>
                  <div><FN>console</FN>.<FN>log</FN>(<STR>"Salom"</STR>)</div>
                  <div><CM>// 5 qator… 100 marta bo'lsa-chi?</CM></div>
                </>
              ) : (
                <>
                  <div><KW>for</KW> (<KW>let</KW> i = <NUM>1</NUM>; i &lt;= <NUM>5</NUM>; i++) {'{'}</div>
                  <div style={{ paddingLeft: 18 }}><FN>console</FN>.<FN>log</FN>(<STR>"Salom"</STR>)</div>
                  <div>{'}'}</div>
                  <div><CM>// 1 qator → 5 marta. 100 marta ham shu!</CM></div>
                </>
              )}
            </div>
          </Col>
          <Col>
            <p className="flow-label">Natija (ikkalasida bir xil)</p>
            <Terminal lines={['Salom', 'Salom', 'Salom', 'Salom', 'Salom']} />
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Natija aynan bir xil! Lekin <b>sikl</b> bilan kod qisqa, o'zgartirishi oson. Mana shuning uchun sikl kerak.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — for ANATOMIYASI =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const N = 5;
  const [out, setOut] = useState(storedAnswer ? Array.from({ length: N }, (_, i) => i + 1) : []);
  const [iVal, setIVal] = useState(storedAnswer ? N : 0);
  const [running, setRunning] = useState(false);
  const [part, setPart] = useState(null);
  const timer = useRef(null);
  const done = out.length >= N;
  const PARTS = {
    init: { color: T.blue, num: '1', name: 'Boshlanish', code: 'let i = 1', stair: 'Qaysi zinadan boshlaymiz', desc: 'Sanagich qayerdan boshlanadi. Bu yerda i = 1 — birinchi zina.' },
    cond: { color: T.accent, num: '2', name: 'Shart', code: 'i <= 5', stair: 'Qaysi zinagacha chiqamiz', desc: "Qachongacha davom etadi. i 5 dan oshmaguncha sikl ishlaydi; shart buzilsa — to'xtaydi." },
    step: { color: T.success, num: '3', name: 'Qadam', code: 'i++', stair: 'Har safar nechta zina', desc: 'Har aylanishdan keyin i qanday o\'zgaradi. i++ — i ga +1 (bir zina yuqori).' }
  };
  useEffect(() => () => clearTimeout(timer.current), []);
  const run = () => {
    clearTimeout(timer.current); setOut([]); setIVal(0); setRunning(true);
    const tick = (i) => {
      setIVal(i); setOut(prev => [...prev, i]);
      if (i < N) timer.current = setTimeout(() => tick(i + 1), 620);
      else setRunning(false);
    };
    timer.current = setTimeout(() => tick(1), 350);
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="for sikli" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Avval ishga tushiring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Kompyuter 1 dan 5 gacha <span className="italic" style={{ color: T.accent }}>qanday</span> ko'tariladi?</h2></div>
        <Mentor>for ni zinapoyaga o'xshating: <b style={{ color: T.blue }}>qaysi zinadan</b> boshlaysiz, <b style={{ color: T.accent }}>qaysi zinagacha</b> chiqasiz, va <b style={{ color: T.success }}>har safar nechta zina</b> ko'tarilasiz. Mana shu 3 sozlama qavs ichida turadi. Rangli qismlarni <b style={{ color: T.ink }}>bosib</b> bilib oling, so'ng "Ishga tushir"ni bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="codebox fade-up delay-1" style={{ fontSize: 'clamp(13px,1.8vw,15px)' }}>
              <div>
                <KW>for</KW> (
                <span className="for-pt for-init" onClick={() => setPart('init')} style={{ cursor: 'pointer', outline: part === 'init' ? `2px solid ${T.blue}` : 'none' }}>let i = 1</span>;{' '}
                <span className="for-pt for-cond" onClick={() => setPart('cond')} style={{ cursor: 'pointer', outline: part === 'cond' ? `2px solid ${T.accent}` : 'none' }}>i &lt;= 5</span>;{' '}
                <span className="for-pt for-step" onClick={() => setPart('step')} style={{ cursor: 'pointer', outline: part === 'step' ? `2px solid ${T.success}` : 'none' }}>i++</span>) {'{'}
              </div>
              <div style={{ paddingLeft: 18 }}><FN>console</FN>.<FN>log</FN>(<STR>"Salom"</STR>, i)</div>
              <div>{'}'}</div>
            </div>
            {part ? (
              <div className="sk-info fade-step" key={part}>
                <span className="sk-tagbig"><span className="lg-dot" style={{ background: PARTS[part].color, width: 14, height: 14 }} /><span className="sk-wordbadge" style={{ color: PARTS[part].color, background: PARTS[part].color + '22' }}>{PARTS[part].num}. {PARTS[part].name}</span><span className="mono" style={{ color: T.ink2 }}>{PARTS[part].code}</span></span>
                <p className="body" style={{ color: T.ink, margin: '10px 0 0' }}>🪜 <b>{PARTS[part].stair}.</b> {PARTS[part].desc}</p>
              </div>
            ) : (
              <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>👆 Koddagi 3 ta rangli qismni bosing</p></div>
            )}
          </Col>
          <Col>
            <div className="iwatch fade-up delay-1">
              <span className="iwatch-lbl">hozir</span>
              <span className="iwatch-eq">i =</span>
              <span className="iwatch-num">{iVal || '·'}</span>
            </div>
            <div className="stair-strip fade-up delay-1">
              {[1, 2, 3, 4, 5].map(s => (
                <div key={s} className={`stair-col ${iVal >= s ? 'on' : ''}`}>
                  <span className="stair-walker" key={iVal} style={{ visibility: iVal === s ? 'visible' : 'hidden' }}>🚶</span>
                  <div className={`stair-bar ${iVal >= s ? 'lit' : ''}`} style={{ height: `${24 + s * 13}%` }} />
                  <span className="stair-n">{s}</span>
                </div>
              ))}
            </div>
            <Terminal lines={out.map(v => `Salom ${v}`)} empty="// ▶ ishga tushiring" />
            <button className="btn" onClick={run} disabled={running} style={{ alignSelf: 'flex-start' }}>{running ? 'Bajarilmoqda…' : (done ? '↻ Yana ishga tushir' : '▶ Ishga tushir')}</button>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ i 1→2→3→4→5 bo'ldi, har safar bir marta ishladi. i = 6 bo'lganda shart (<span className="mono">i &lt;= 5</span>) buzildi — sikl to'xtadi.</p></div>}
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
    questionText="for siklida 'i++' nima vazifani bajaradi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>for siklidagi <span className="mono" style={{ color: T.accent }}>i++</span> nima qiladi?</h2></>}
    options={['Siklni boshlang\'ich qiymatini belgilaydi', 'Har aylanishdan keyin i ni 1 ga oshiradi (qadam)', 'Siklni butunlay to\'xtatadi', 'Massiv yaratadi']} correctIdx={1}
    explainCorrect="To'g'ri! i++ — bu qadam. Har bir aylanishdan so'ng i qiymati 1 ga oshadi va shart qaytadan tekshiriladi."
    explainWrong={{
      0: 'Yo’q — boshlang’ich qiymat «let i = 1» qismi. i++ esa qadam — har safar i ni o’zgartiradi.',
      2: 'Yo’q — siklni shart to’xtatadi (i <= 5 buzilganda). i++ esa i ni oshiradi.',
      3: 'Yo’q — massiv boshqa narsa. i++ faqat i ni 1 ga oshiradi.',
      default: 'i++ — qadam: har aylanishdan keyin i ni 1 ga oshiradi.'
    }} />
);

// ===== SCREEN 5 — PARAMETRLARNI O'ZGARTIRISH =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [end, setEnd] = useState(5);
  const [step, setStep] = useState(1);
  const [seen, setSeen] = useState(new Set(['5-1']));
  const done = seen.size >= 2;
  const mark = (e, s) => setSeen(prev => { const n = new Set(prev); n.add(`${e}-${s}`); return n; });
  const setE = (e) => { setEnd(e); mark(e, step); };
  const setS = (s) => { setStep(s); mark(end, s); };
  const nums = []; for (let i = 1; i <= end; i += step) nums.push(i);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Siklni boshqarish" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Parametrni o\'zgartiring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Siklni <span className="italic" style={{ color: T.accent }}>o'zingiz</span> boshqarib ko'ring</h2></div>
        <Mentor>3 qismni o'zgartirsangiz — sikl boshqacha ishlaydi. <b style={{ color: T.ink }}>Shart</b>ni o'zgartiring (qachongacha) yoki <b style={{ color: T.ink }}>qadam</b>ni (qancha sakraydi). Pastdagi natija darhol o'zgaradi.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Shart — i qachongacha?</p>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              {[5, 8, 12].map(e => <button key={e} className={`chip ${end === e ? 'chip-on' : ''}`} onClick={() => setE(e)}>i &lt;= {e}</button>)}
            </div>
            <p className="flow-label" style={{ marginTop: 4 }}>Qadam — qancha sakraydi?</p>
            <div className="fade-up delay-2" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${step === 1 ? 'chip-on' : ''}`} onClick={() => setS(1)}>i++ (bir-bir)</button>
              <button className={`chip ${step === 2 ? 'chip-on' : ''}`} onClick={() => setS(2)}>i += 2 (ikki-ikki)</button>
            </div>
            <div className="codebox" style={{ marginTop: 6 }}>
              <div><KW>for</KW> (<KW>let</KW> i = <NUM>1</NUM>; <span className="for-pt for-cond">i &lt;= {end}</span>; <span className="for-pt for-step">{step === 1 ? 'i++' : 'i += 2'}</span>) {'{'}</div>
              <div style={{ paddingLeft: 18 }}><FN>console</FN>.<FN>log</FN>(i)</div>
              <div>{'}'}</div>
            </div>
          </Col>
          <Col>
            <p className="flow-label">Natija — {nums.length} ta son</p>
            <div className="numline fade-up delay-1">
              {Array.from({ length: 12 }, (_, k) => k + 1).map(n => (
                <span key={n} className={`num-cell ${nums.includes(n) ? 'hit' : ''}`}>{n}</span>
              ))}
            </div>
            <Terminal lines={nums.map(String)} />
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Ko'rdingizmi? Bitta sonni o'zgartirdingiz — butun natija o'zgardi. Qadam <b>2</b> bo'lsa, sikl sonlarni <b>sakrab</b> o'tadi. Sikl moslashuvchan!</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 5b — TEST 2 (siklni o'qib tushunish) =====
const Screen5b = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Tekshiruv"
    questionText="for (let i = 1; i <= 3; i++) console.log(i) — konsolda qaysi sonlar chiqadi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Siklni o'qing</p><h2 className="title h-sub" style={{ margin: '8px 0 2px' }}>Bu sikl konsolga <span className="italic" style={{ color: T.accent }}>qaysi sonlarni</span> yozadi?</h2><div className="codebox" style={{ marginTop: 10, marginBottom: 4 }}><div><KW>for</KW> (<KW>let</KW> i = <NUM>1</NUM>; i &lt;= <NUM>3</NUM>; i++) {'{'}</div><div style={{ paddingLeft: 18 }}><FN>console</FN>.<FN>log</FN>(i)</div><div>{'}'}</div></div></>}
    options={['1, 2, 3', '1, 2', '1, 2, 3, 4', '3, 2, 1']} correctIdx={0}
    explainCorrect="To'g'ri! i = 1 dan boshlanadi va «i <= 3» bo'lgancha ishlaydi: 1, 2, 3. i = 4 bo'lganda shart buziladi — sikl to'xtaydi."
    explainWrong={{
      1: 'Deyarli! Shart «i <= 3» — ya’ni 3 ham kiradi (3 <= 3 — to’g’ri). Demak 1, 2, 3.',
      2: 'Yo’q — i = 4 bo’lganda «4 <= 3» noto’g’ri, sikl to’xtaydi. 4 chiqmaydi. Faqat 1, 2, 3.',
      3: 'Yo’q — i++ i ni oshiradi (1 dan yuqoriga), kamaytirmaydi. Demak 1, 2, 3 tartibda.',
      default: 'Boshlanish 1, shart «i <= 3» → 1, 2, 3.'
    }} />
);

// ===== SCREEN 6 — while SIKLI =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const STEP = 20;
  const [suv, setSuv] = useState(storedAnswer ? 100 : 0);
  const [iter, setIter] = useState(storedAnswer ? 5 : 0);
  const [running, setRunning] = useState(false);
  const timer = useRef(null);
  const done = suv >= 100;
  useEffect(() => () => clearTimeout(timer.current), []);
  const run = () => {
    clearTimeout(timer.current); setSuv(0); setIter(0); setRunning(true);
    const tick = (v, c) => {
      setSuv(v); setIter(c);
      if (v < 100) timer.current = setTimeout(() => tick(Math.min(v + STEP, 100), c + 1), 480);
      else setRunning(false);
    };
    timer.current = setTimeout(() => tick(STEP, 1), 350);
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="while sikli" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Stakanni to\'ldiring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Necha marta takrorlashni <span className="italic" style={{ color: T.accent }}>bilmasak-chi?</span></h2></div>
        <Mentor>Stakanga suv quyyapsiz — necha marta quyishni oldindan sanaysizmi? Yo'q! Siz faqat bitta narsani bilasiz: <b style={{ color: T.ink }}>"to'lmaguncha quyaver"</b>. <span className="mono" style={{ color: T.accent }}>while</span> ham aynan shunday ishlaydi: shart <b style={{ color: T.ink }}>rost ekan</b> — takrorlayveradi, rost bo'lmay qolsa — to'xtaydi.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="codebox fade-up delay-1">
              <div><KW>let</KW> suv = <NUM>0</NUM></div>
              <div><KW>while</KW> (<span className="for-pt for-cond">suv &lt; 100</span>) {'{'}</div>
              <div style={{ paddingLeft: 18 }}>suv += <NUM>20</NUM> <CM>// yana quyamiz</CM></div>
              <div>{'}'}</div>
            </div>
            <button className="btn" onClick={run} disabled={running} style={{ alignSelf: 'flex-start' }}>{running ? 'Quyilmoqda…' : (done ? '↻ Yana' : '💧 Suv quyishni boshlash')}</button>
            <p className="body" style={{ margin: 0, color: T.ink2, fontSize: 13 }}>Aylanishlar: <b style={{ color: T.accent, fontFamily: "'JetBrains Mono',monospace" }}>{iter}</b> marta</p>
          </Col>
          <Col>
            <div className="glass-wrap fade-up delay-1">
              <span className="tap-emoji">🚰{running && <span className="drip">💧</span>}</span>
              <div className="glass">
                <div className="glass-fill" style={{ height: `${suv}%` }}>{suv > 0 && suv < 100 && <div className="glass-wave" />}</div>
                <span className="glass-pct">{suv}%</span>
                {running && suv > 0 && <span className="splash" key={suv}>+20</span>}
              </div>
              <div className="cond-pill" style={{ background: suv < 100 ? T.successSoft : T.accentSoft, color: suv < 100 ? T.success : T.accent }}>suv {suv} &lt; 100 → {suv < 100 ? "✓ yana quy" : "✗ to'xta"}</div>
              <p className="mono small" style={{ color: T.ink3, margin: 0 }}>{iter}-aylanish</p>
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Stakan to'ldi! Sikl 5 marta ishladi — biz buni oldindan sanamadik, shart (<span className="mono">suv &lt; 100</span>) o'zi to'xtatdi. Mana <b>while</b>ning farqi.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — for vs while =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const CARDS = {
    forc: { ic: '🔢', name: 'for', when: 'Necha marta — OLDINDAN MA\'LUM', ex: ['5 marta sakra', '30 ta do\'stga yoz', '1 dan 100 gacha sana'] },
    whilec: { ic: '❓', name: 'while', when: 'Necha marta — NOMA\'LUM (shartga bog\'liq)', ex: ['jon tugaguncha o\'yna', 'parol to\'g\'ri bo\'lguncha so\'ra', 'stakan to\'lguncha quy'] }
  };
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(new Set());
  const isNarrow = useIsMobile(768);
  const done = seen.size >= 2;
  const tap = (k) => { setActive(k); setSeen(prev => { const n = new Set(prev); n.add(k); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="for ⚔️ while" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/2 ko'ring`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Qaysi birini <span className="italic" style={{ color: T.accent }}>qachon</span> ishlatamiz?</h2></div>
        <Mentor>Ikkalasi ham takrorlaydi. Farq <b style={{ color: T.ink }}>bitta savolda</b>: necha marta takrorlashni <b style={{ color: T.ink }}>oldindan bilamizmi?</b> Bilsak — <b style={{ color: T.accent }}>for</b>. Bilmasak, faqat shart bo'lsa — <b style={{ color: T.accent }}>while</b>. Ikkala kartani bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.keys(CARDS).map(k => (
                <button key={k} onClick={() => tap(k)} style={{ display: 'flex', alignItems: 'center', gap: 13, textAlign: 'left', cursor: 'pointer', border: 'none', borderRadius: 14, padding: '15px 16px', background: T.paper, boxShadow: active === k ? `inset 0 0 0 2px ${T.accent}, 0 8px 20px -6px rgba(255,79,40,0.22)` : `0 6px 16px -6px rgba(${T.shadowBase},0.14)`, transition: 'all 0.18s' }}>
                  <span className={k === 'whilec' ? 'pulse-q' : 'ic-float'} style={{ fontSize: 28 }}>{CARDS[k].ic}</span>
                  <span className="mono" style={{ fontWeight: 700, fontSize: 18, color: T.accent }}>{CARDS[k].name}</span>
                  {seen.has(k) && <span style={{ marginLeft: 'auto', color: T.success, fontSize: 15 }}>✓</span>}
                </button>
              ))}
            </div>
          </Col>
          <Col>
            {active ? (
              <div className="sk-info fade-step" key={active}>
                <span className="sk-tagbig"><span className={active === 'whilec' ? 'pulse-q' : 'ic-float'} style={{ fontSize: 24 }}>{CARDS[active].ic}</span><span className="sk-wordbadge">{CARDS[active].name}</span></span>
                <p className="body" style={{ color: T.ink, margin: '11px 0 9px', fontWeight: 600 }}>{CARDS[active].when}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {CARDS[active].ex.map((e, i) => (<div key={i} className="ex-row" style={{ display: 'flex', gap: 8, alignItems: 'center', background: T.bg, borderRadius: 8, padding: '8px 11px', animationDelay: `${0.05 + i * 0.09}s` }}><span style={{ color: T.accent }}>•</span><span className="body" style={{ margin: 0, color: T.ink2 }}>{e}</span></div>))}
                </div>
              </div>
            ) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Bir kartani bosing</p></div> : null)}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Esda tuting: <b>for</b> = sanab bo'ladigan ishlar, <b>while</b> = "qachongacha?" deb so'raydigan ishlar.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — MASSIV (ro'yxat) =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const ARR = [{ e: '🍎', n: 'olma' }, { e: '🍌', n: 'banan' }, { e: '🍇', n: 'uzum' }, { e: '🍓', n: 'qulupnay' }];
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(new Set());
  const isNarrow = useIsMobile(768);
  const done = seen.size >= 2;
  const tap = (i) => { setActive(i); setSeen(prev => { const n = new Set(prev); n.add(i); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Massiv" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Elementlarni bosing'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Ko'p narsani <span className="italic" style={{ color: T.accent }}>bitta joyda</span> qanday saqlaymiz?</h2></div>
        <Mentor>4 ta meva uchun 4 ta alohida o'zgaruvchi (<span className="mono">meva1, meva2…</span>) yasash — noqulay. 100 ta bo'lsa-chi? Yaxshisi — hammasini bitta <b style={{ color: T.ink }}>massivga</b>, raqamlangan qator qutilarga joylaymiz. Eng qizig'i: qutilar <b style={{ color: T.accent }}>1 dan emas, 0 dan</b> sanaladi! Dasturlashda shunday qabul qilingan: birinchi element — 0-o'rinda. Har bir qutini bosib ko'ring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="codebox fade-up delay-1">
              <div><KW>const</KW> mevalar = [<STR>"olma"</STR>, <STR>"banan"</STR>, <STR>"uzum"</STR>, <STR>"qulupnay"</STR>]</div>
            </div>
            <p className="flow-label">Qutilar — indeksini bosing</p>
            <div className="arr-row">
              {ARR.map((it, i) => (
                <button key={i} className={`arr-cell ex-row ${active === i ? 'on' : ''}`} onClick={() => tap(i)} style={{ animationDelay: `${0.15 + i * 0.09}s` }}>
                  <span className="arr-emoji">{it.e}</span>
                  <span className="arr-name">{it.n}</span>
                  <span className="arr-idx">[{i}]</span>
                </button>
              ))}
            </div>
          </Col>
          <Col>
            {active !== null ? (
              <div className="sk-info fade-step" key={active}>
                <p className="flow-label" style={{ margin: '0 0 8px' }}>Indeks orqali olamiz</p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, flexWrap: 'wrap' }}>
                  <span className="mono" style={{ fontSize: 'clamp(18px,3vw,24px)', color: T.ink }}>mevalar[<span style={{ color: T.accent, fontWeight: 700 }}>{active}</span>]</span>
                  <span className="mono" style={{ color: T.ink3, fontSize: 20 }}>→</span>
                  <span style={{ fontSize: 26 }}>{ARR[active].e}</span>
                  <span className="mono" style={{ fontSize: 'clamp(16px,2.4vw,20px)', color: T.success, fontWeight: 700 }}>"{ARR[active].n}"</span>
                </div>
                <p className="body" style={{ color: T.ink, margin: '12px 0 0' }}>{active === 0 ? <>🎯 <b>Indeks 0</b> — eng birinchi element! Sanash noldan boshlanadi, shuning uchun "olma" — nolinchi.</> : <>Bu <b>{active + 1}-element</b>, lekin indeksi <b>{active}</b> — chunki 0 dan sanadik.</>}</p>
              </div>
            ) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Bir qutini bosing — indeksini ko'ring</p></div> : null)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Birinchi element <b>[0]</b>, oxirgisi <b>[3]</b>. Bu "0 dan sanash" — dasturlashning eng mashhur "tuzog'i". Endi bilasiz! 😉</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 9 — TEST 3 (indeks) =====
const Screen9 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 2-savol"
    questionText="mevalar = ['olma','banan','uzum']. mevalar[0] nima?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><div className="codebox" style={{ marginTop: 10, marginBottom: 6 }}><div><KW>const</KW> mevalar = [<STR>"olma"</STR>, <STR>"banan"</STR>, <STR>"uzum"</STR>]</div></div><h2 className="title h-sub" style={{ marginTop: 6 }}><span className="mono" style={{ color: T.accent }}>mevalar[0]</span> nimaga teng?</h2></>}
    options={['"banan"', '"olma"', 'Xato — [0] yo\'q', '"uzum"']} correctIdx={1}
    explainCorrect={`To'g'ri! Indeks 0 dan boshlanadi, shuning uchun mevalar[0] — birinchi element, ya'ni "olma".`}
    explainWrong={{
      0: 'Yo’q — "banan" ikkinchi element, uning indeksi [1]. [0] esa birinchi — "olma".',
      2: 'Yo’q — [0] aniq bor: u birinchi elementni bildiradi (indeks 0 dan boshlanadi).',
      3: 'Yo’q — "uzum" uchinchi element, indeksi [2]. [0] — "olma".',
      default: 'Indeks 0 dan boshlanadi → mevalar[0] = "olma".'
    }} />
);

// ===== SCREEN 10 — MASSIVNI AYLANIB CHIQISH =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const ARR = [{ e: '🍎', n: 'olma' }, { e: '🍌', n: 'banan' }, { e: '🍇', n: 'uzum' }, { e: '🍓', n: 'qulupnay' }];
  const N = ARR.length;
  const [hi, setHi] = useState(-1);
  const [out, setOut] = useState(storedAnswer ? ARR.map(a => a.n) : []);
  const [running, setRunning] = useState(false);
  const timer = useRef(null);
  const done = out.length >= N;
  useEffect(() => () => clearTimeout(timer.current), []);
  const run = () => {
    clearTimeout(timer.current); setOut([]); setHi(-1); setRunning(true);
    const tick = (i) => {
      setHi(i); setOut(prev => [...prev, ARR[i].n]);
      if (i < N - 1) timer.current = setTimeout(() => tick(i + 1), 640);
      else { setRunning(false); timer.current = setTimeout(() => setHi(-1), 700); }
    };
    timer.current = setTimeout(() => tick(0), 350);
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Aylanib chiqish" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Avval ishga tushiring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Sikl massivni <span className="italic" style={{ color: T.accent }}>birma-bir</span> o'qiydi</h2></div>
        <Mentor>Mana eng kuchli birikma! <b style={{ color: T.ink }}>for</b> sikli massivning har bir elementini <b style={{ color: T.ink }}>birma-bir ko'rib chiqadi</b> — buni "ro'yxatni <b style={{ color: T.ink }}>aylanib chiqish</b>" deymiz. <span className="mono" style={{ color: T.accent }}>i</span> indeks bo'ladi (0, 1, 2…), <span className="mono" style={{ color: T.accent }}>.length</span> esa massivda nechta element borligini aytadi. Ishga tushiring.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="codebox fade-up delay-1">
              <div><KW>for</KW> (<KW>let</KW> i = <NUM>0</NUM>; i &lt; mevalar.<FN>length</FN>; i++) {'{'}</div>
              <div style={{ paddingLeft: 18 }}><FN>console</FN>.<FN>log</FN>(mevalar[<span style={{ color: T.accent }}>i</span>])</div>
              <div>{'}'}</div>
            </div>
            <div className="arr-row fade-up delay-2">
              {ARR.map((it, i) => (
                <div key={i} className={`arr-cell ${hi === i ? 'scan' : ''}`}>
                  <span className="arr-emoji">{it.e}</span>
                  <span className="arr-name">{it.n}</span>
                  <span className="arr-idx">[{i}]</span>
                </div>
              ))}
            </div>
            <button className="btn" onClick={run} disabled={running} style={{ alignSelf: 'flex-start' }}>{running ? 'Aylanyapti…' : (done ? '↻ Yana' : '▶ Ishga tushir')}</button>
          </Col>
          <Col>
            <p className="flow-label">Natija (har bir element)</p>
            <Terminal lines={out} empty="// ▶ ishga tushiring" />
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Sikl massivning 4 ta elementini birma-bir chop etdi. <span className="mono">i &lt; .length</span> tufayli oxiriga yetganda o'zi to'xtadi — qancha element bo'lsa ham ishlaydi!</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — HAYOTIY MISOL (hook yechimi) =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const NAMES = ['Ali', 'Laylo', 'Bobur'];
  const N = NAMES.length;
  const [out, setOut] = useState(storedAnswer ? NAMES.map(n => `Bayram muborak, ${n}`) : []);
  const [running, setRunning] = useState(false);
  const timer = useRef(null);
  const done = out.length >= N;
  useEffect(() => () => clearTimeout(timer.current), []);
  const run = () => {
    clearTimeout(timer.current); setOut([]); setRunning(true);
    const tick = (i) => {
      setOut(prev => [...prev, `Bayram muborak, ${NAMES[i]}`]);
      if (i < N - 1) timer.current = setTimeout(() => tick(i + 1), 460);
      else setRunning(false);
    };
    timer.current = setTimeout(() => tick(0), 300);
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Hayotiy misol" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Hammaga yuboring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Esingizdami — <span className="italic" style={{ color: T.accent }}>30 ta xabar?</span> Mana yechim!</h2></div>
        <Mentor>Dars boshida do'stlarga qo'lda yozayotgan edingiz. Endi qo'lingizda kuchli usul bor: do'stlar ro'yxatini massivga solamiz, sikl esa ro'yxatni <b style={{ color: T.ink }}>aylanib chiqib</b>, <b style={{ color: T.ink }}>har biriga</b> tabrik yozadi — bir marta yozib! Tugmani bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="codebox fade-up delay-1" style={{ lineHeight: 2 }}>
              <div><KW>const</KW> dostlar = [<STR>"Ali"</STR>, <STR>"Laylo"</STR>, <STR>"Bobur"</STR>]</div>
              <div style={{ marginTop: 10 }}><KW>for</KW> (<KW>let</KW> i = <NUM>0</NUM>; i &lt; dostlar.<FN>length</FN>; i++) {'{'}</div>
              <div style={{ paddingLeft: 16 }}><FN>console</FN>.<FN>log</FN>(<STR>"Bayram muborak, "</STR> + dostlar[i])</div>
              <div>{'}'}</div>
            </div>
            <button className="btn" onClick={run} disabled={running} style={{ alignSelf: 'flex-start' }}>{running ? 'Yuborilmoqda…' : (done ? '↻ Yana yuborish' : '🎉 Hammaga tabrik yuborish')}</button>
          </Col>
          <Col>
            <p className="flow-label">Sikl har bir do'stga yuboryapti</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {NAMES.map((nm, i) => {
                const got = out.length > i;
                return (
                  <div key={i} className={`friend-card ${got ? 'got' : ''}`}>
                    <span className="friend-ava">{['🧑', '👩', '🧔'][i]}</span>
                    <div><div className="friend-name">{nm}</div><div className="friend-msg">{got ? `"Bayram muborak, ${nm}"` : 'navbatini kutyapti…'}</div></div>
                    <span className="friend-status">{got ? '✅' : '✉️'}</span>
                  </div>
                );
              })}
            </div>
            <Terminal lines={out} empty="// ▶ tugmani bosing" title="xabarlar" />
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ 3 ta shaxsiy tabrik — <b>bitta sikl bilan</b>! Ro'yxatda 1000 ta nom bo'lsa ham, kod aynan shu qoladi. Mana dasturchining "dangasaligi" — aslida zukkolik!</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — TEST 4 (aylanib chiqish) =====
const Screen12 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="dostlar massivida 5 ta nom bor. for (i=0; i<dostlar.length; i++) sikli necha marta ishlaydi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><div className="codebox" style={{ marginTop: 10, marginBottom: 6 }}><div><CM>// dostlar = 5 ta nom</CM></div><div><KW>for</KW> (<KW>let</KW> i = <NUM>0</NUM>; i &lt; dostlar.<FN>length</FN>; i++) {'{ … }'}</div></div><h2 className="title h-sub" style={{ marginTop: 6 }}>Sikl <span className="italic" style={{ color: T.accent }}>necha marta</span> ishlaydi?</h2></>}
    options={['4 marta', '5 marta', '6 marta', 'Cheksiz']} correctIdx={1}
    explainCorrect="To'g'ri! .length = 5, sikl i = 0, 1, 2, 3, 4 bo'lganda ishlaydi — ya'ni 5 marta, har bir element uchun bir marta."
    explainWrong={{
      0: 'Yo’q — bu klassik «±1» xato. i 0,1,2,3,4 — bu 5 ta qiymat. Demak 5 marta.',
      2: 'Yo’q — i 5 bo’lganda «5 < 5» noto’g’ri, sikl to’xtaydi. Demak 6 emas, 5 marta.',
      3: 'Yo’q — i++ tufayli i oshadi va shart bir kun buziladi. Cheksiz emas — 5 marta.',
      default: '.length = 5 → i 0..4 → 5 marta.'
    }} />
);

// ===== SCREEN 13 — AMALIYOT: O'Z SIKLINGNI QUR =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const MSGS = ['Men dasturchiman!', "Sikl — bu kuch!"];
  const [n, setN] = useState(5);
  const [msgIdx, setMsgIdx] = useState(0);
  const [out, setOut] = useState([]);
  const [running, setRunning] = useState(false);
  const [ran, setRan] = useState(!!storedAnswer);
  const timer = useRef(null);
  const done = ran;
  useEffect(() => () => clearTimeout(timer.current), []);
  const run = () => {
    clearTimeout(timer.current); setOut([]); setRunning(true);
    const msg = MSGS[msgIdx];
    const tick = (i) => {
      setOut(prev => [...prev, `${i}. ${msg}`]);
      if (i < n) timer.current = setTimeout(() => tick(i + 1), 360);
      else { setRunning(false); setRan(true); }
    };
    timer.current = setTimeout(() => tick(1), 300);
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Amaliyot · o'z siklingiz" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Siklni ishga tushiring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(8px,1.4vw,14px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Endi <span className="italic" style={{ color: T.accent }}>siz</span> sikl quring</h2></div>
        <Mentor>Navbat sizga! <b style={{ color: T.ink }}>Necha marta</b> takrorlashni va <b style={{ color: T.ink }}>qaysi xabarni</b> tanlang, keyin "Ishga tushir"ni bosing. Kod o'zgarishini va natijani kuzating.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Necha marta? (shart)</p>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              {[3, 5, 7].map(v => <button key={v} className={`chip ${n === v ? 'chip-on' : ''}`} onClick={() => { setN(v); setRan(false); }}>{v} marta</button>)}
            </div>
            <p className="flow-label" style={{ marginTop: 4 }}>Qaysi xabar?</p>
            <div className="fade-up delay-2" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {MSGS.map((m, i) => <button key={i} className={`chip ${msgIdx === i ? 'chip-on' : ''}`} onClick={() => { setMsgIdx(i); setRan(false); }}>"{m}"</button>)}
            </div>
            <div className="codebox" style={{ marginTop: 6 }}>
              <div><KW>for</KW> (<KW>let</KW> i = <NUM>1</NUM>; i &lt;= <NUM>{n}</NUM>; i++) {'{'}</div>
              <div style={{ paddingLeft: 18 }}><FN>console</FN>.<FN>log</FN>(i + <STR>". {MSGS[msgIdx]}"</STR>)</div>
              <div>{'}'}</div>
            </div>
            <button className="btn" onClick={run} disabled={running} style={{ alignSelf: 'flex-start' }}>{running ? 'Bajarilmoqda…' : '▶ Ishga tushir'}</button>
          </Col>
          <Col>
            <p className="flow-label">Sizning natijangiz</p>
            <div className="fade-up delay-1" style={{ display: 'flex', alignItems: 'center', gap: 13, background: T.paper, borderRadius: 12, padding: '12px 18px', boxShadow: `0 8px 20px -6px rgba(${T.shadowBase},0.14)` }}>
              <span className="rep-badge burst" key={out.length}>{out.length}</span>
              <div><div className="flow-label" style={{ margin: 0 }}>marta bajarildi</div><div className="mono small" style={{ color: T.ink2 }}>{n} martadan</div></div>
              {done && <span className="burst" key="cel" style={{ marginLeft: 'auto', fontSize: 30 }}>🎉</span>}
            </div>
            <Terminal lines={out} empty="// parametrni tanlab, ishga tushiring" />
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Zo'r! Siz haqiqiy sikl qurdingiz va ishga tushirdingiz. Parametrni o'zgartirib, yana sinab ko'ring.</p></div>}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — DEBUGGING (cheksiz sikl: i-- xato, top → tuzat) =====
const Screen14 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [picked, setPicked] = useState(storedAnswer ? 'step' : null);
  const [fixed, setFixed] = useState(!!storedAnswer);
  const found = picked === 'step';
  const done = fixed;
  const click = (part) => { if (found) return; setPicked(part); };
  const fix = () => setFixed(true);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Debugging" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Yakuniy sinov →' : (found ? 'Endi tuzating' : 'Xatoni toping')} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bu sikl <span className="italic" style={{ color: T.accent }}>to'xtamayapti</span> — nega?</h2></div>
        <Mentor>AI 1 dan 5 gacha sanaydigan sikl yozdi, lekin u <b style={{ color: T.ink }}>cheksiz</b> aylanyapti! Sir <b style={{ color: T.ink }}>qadam</b> qismida yashiringan. Diqqat bilan o'qing: i 5 ga <b style={{ color: T.ink }}>yaqinlashyaptimi</b>? Xato qismni toping va bosing.</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <div className="ai-card fade-up delay-1">
              <div className="ai-row"><span className="ai-badge">AI</span><span className="ai-bubble">1 dan 5 gacha sanaymiz:</span></div>
              <div className="ai-code">
                <div className="ai-line" style={{ cursor: 'default' }}>
                  <KW>for</KW> (
                  <span onClick={() => click('init')} style={{ cursor: found ? 'default' : 'pointer' }}>let i = 1</span>;{' '}
                  <span onClick={() => click('cond')} style={{ cursor: found ? 'default' : 'pointer' }}>i &lt;= 5</span>;{' '}
                  <span className={found ? (fixed ? 'tok-ok' : 'tok-bad') : ''} onClick={() => click('step')} style={{ cursor: found ? 'default' : 'pointer' }}>{fixed ? 'i++' : 'i--'}</span>) {'{'}
                </div>
                <div className="ai-line" style={{ cursor: 'default', paddingLeft: 16 }}><FN>console</FN>.<FN>log</FN>(i)</div>
                <div className="ai-line" style={{ cursor: 'default' }}>{'}'}</div>
              </div>
              {!found && <p className="ai-prompt">Qaysi qism xato? Ustiga bosing.</p>}
              {found && !fixed && (<button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={fix}>🔧 i-- ni i++ ga almashtirish</button>)}
              {fixed && <p className="ai-prompt" style={{ color: T.success, fontStyle: 'normal', fontWeight: 600 }}>✓ Tuzatildi — endi i oshadi va sikl 5 da to'xtaydi!</p>}
            </div>
            {!fixed ? (
              <div className="term fade-up delay-2">
                <div className="term-bar"><span className="term-dot" style={{ background: '#FF5F56' }} /><span className="term-dot" style={{ background: '#FFBD2E' }} /><span className="term-dot" style={{ background: '#27C93F' }} /><span className="term-title">console</span></div>
                <div className="term-body">{[1, 0, -1, -2].map((v, k) => <div key={k} className="term-line"><span className="term-arrow" style={{ color: T.accent }}>›</span><span>{v}</span></div>)}<div className="term-line warn-pulse" style={{ color: T.accent }}><span className="term-arrow" style={{ color: T.accent }}>›</span><span>⋮</span></div><p className="term-empty warn-pulse" style={{ color: T.accent }}>⚠️ i kamayyapti — 5 ga hech yetmaydi, cheksiz!</p></div>
              </div>
            ) : (
              <div className="term fade-step">
                <div className="term-bar"><span className="term-dot" style={{ background: '#FF5F56' }} /><span className="term-dot" style={{ background: '#FFBD2E' }} /><span className="term-dot" style={{ background: '#27C93F' }} /><span className="term-title">console</span></div>
                <div className="term-body">{[1, 2, 3, 4, 5].map(v => <div key={v} className="term-line"><span className="term-arrow">›</span><span>{v}</span></div>)}<p className="term-empty" style={{ color: T.success }}>✓ 5 marta ishladi va to'xtadi</p></div>
              </div>
            )}
          </Col>
          <Col>
            {!found && (
              picked && picked !== 'step'
                ? (<div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bu qism to'g'ri. {picked === 'init' ? 'Boshlanish (i = 1) — joyida.' : 'Shart (i <= 5) — joyida.'} Xato esa <b>qadam</b> qismida — i qaysi tomonga o'zgaryapti?</p></div>)
                : (<div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Eslang: sikl to'xtashi uchun i <b style={{ color: T.ink }}>shartga yaqinlashishi</b> kerak. Bu yerda i 5 ga tomon ketyaptimi yoki undan <b style={{ color: T.ink }}>uzoqlashyaptimi?</b></p></div>)
            )}
            {found && !fixed && (<div className="frame-warn fade-step"><p className="note-h" style={{ color: T.accent }}>✓ Topdingiz!</p><p className="body" style={{ margin: 0, color: T.ink }}><span className="mono">i--</span> i ni <b>kamaytiradi</b> (1, 0, -1, …) — 5 ga hech qachon yetmaydi. To'g'risi: <span className="mono">i++</span>. Chap tugmani bosing →</p></div>)}
            {fixed && (<div className="takeaway fade-step"><div className="ta-bulb">🛠️</div><p className="ta-h">Topdingiz va tuzatdingiz — bu debugging!</p><p className="ta-sub">Cheksiz sikl — qadam shartga yaqinlashmaganda yuz beradi</p></div>)}
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 15 — YAKUNIY (for siklni o'zi yozadi) =====
const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [value, setValue] = useState(storedAnswer?.picked || '');
  const [passed, setPassed] = useState(!!storedAnswer?.correct);
  const v = value.trim();
  const hasFor = /^for\b/.test(v);
  const hasParen = /^for\s*\(.+\)/.test(v);
  const hasCond = /(<=|<|>=|>)/.test(v);
  const hasStep = /(\+\+|\+=)/.test(v);
  const hasBrace = /\{/.test(v);
  const valid = /^for\s*\([^)]*(<=|<|>=|>)[^)]*(\+\+|\+=)[^)]*\)\s*\{/.test(v);
  useEffect(() => { if (valid && !passed) { setPassed(true); onAnswer(screen, { stage: 'final', screenIdx: screen, question: 'for siklini yozing', studentAnswer: value, correct: true, firstAttemptCorrect: true, solved: true, picked: value }); } }, [valid]);
  return (
    <Stage eyebrow="Yakuniy · amaliy" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!passed} label={passed ? 'Davom etish' : 'Siklni yozing'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Oxirgi qadam: <span className="mono italic" style={{ color: T.accent }}>for</span> siklini o'zingiz yozing.</h2></div>
        <Mentor>Navbat sizga! 1 dan 5 gacha sanaydigan <span className="mono">for</span> siklini yozing. Pastda <b style={{ color: T.ink }}>namuna</b> turibdi — xuddi shunday yozing. To'g'ri yozsangiz, har bir belgi <b style={{ color: T.success }}>yashil</b> yonadi. ✓</Mentor>
        <Zoomable>
        <div className="split">
          <Col>
            <p className="flow-label">Namuna — shunday yozing</p>
            <div className="codebox fade-up delay-1" style={{ opacity: 0.85 }}>
              <div><KW>for</KW> (<KW>let</KW> i = <NUM>1</NUM>; i &lt;= <NUM>5</NUM>; i++) {'{'}</div>
            </div>
            <p className="flow-label" style={{ marginTop: 4 }}>Bu yerga yozing 👇</p>
            <input className="fade-up delay-2" value={value} onChange={e => setValue(e.target.value)} placeholder={'for (let i = 1; i <= 5; i++) {'} spellCheck={false} autoCapitalize="off" autoCorrect="off" style={{ width: '100%', fontFamily: "'JetBrains Mono', monospace", fontSize: 16, padding: '14px 16px', borderRadius: 12, border: 'none', background: T.paper, color: T.ink, outline: 'none', transition: 'box-shadow 0.2s', boxShadow: valid ? `0 0 0 2px ${T.success}, 0 8px 20px -8px rgba(${T.shadowBase},0.2)` : `0 4px 14px -6px rgba(${T.shadowBase},0.16)` }} />
            <div className="fade-up delay-2" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="tagpill" style={{ opacity: hasFor ? 1 : 0.4 }}>{hasFor ? '✓' : '1'} for</span>
              <span className="tagpill" style={{ opacity: hasParen ? 1 : 0.4 }}>{hasParen ? '✓' : '2'} ( ... )</span>
              <span className="tagpill" style={{ opacity: hasCond ? 1 : 0.4 }}>{hasCond ? '✓' : '3'} shart</span>
              <span className="tagpill" style={{ opacity: hasStep ? 1 : 0.4 }}>{hasStep ? '✓' : '4'} i++</span>
              <span className="tagpill" style={{ opacity: hasBrace ? 1 : 0.4 }}>{hasBrace ? '✓' : '5'} {'{'}</span>
            </div>
            {passed
              ? (<div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Zo'r! Bu to'g'ri for sikli — endi kompyuter takrorlashni o'zi bajaradi!</p></div>)
              : (<p className="body" style={{ margin: 0, color: T.ink3, fontSize: 13 }}>3 qism: boshlanish, shart (&lt; yoki &lt;=), qadam (i++). Oxirida {'{'} ni unutmang.</p>)}
          </Col>
          <Col>
            <p className="flow-label">natija</p>
            <div style={{ background: T.paper, borderRadius: 14, minHeight: 130, padding: '20px', boxShadow: `0 8px 22px -10px rgba(${T.shadowBase},0.16)`, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              {valid
                ? <div className="fade-step"><div style={{ fontSize: 36 }}>🔁</div><p style={{ fontFamily: "'Source Serif 4',serif", color: T.success, fontWeight: 700, margin: '8px 0 4px', fontSize: 'clamp(16px,2.4vw,20px)' }}>Sikl tayyor!</p><p className="mono small" style={{ margin: 0, color: T.ink2 }}>1 → 2 → 3 → 4 → 5</p></div>
                : <p style={{ fontFamily: "'Source Serif 4',serif", color: T.ink3, fontStyle: 'italic', margin: 0 }}>To'liq yozing: <span className="mono" style={{ fontStyle: 'normal' }}>{'for ( ... ) {'}</span></p>}
            </div>
          </Col>
        </div>
        </Zoomable>
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — YAKUN =====
const Screen16 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const RECAP = ['Sikl — bir amalni ko\'p marta takrorlaydi', 'for — 3 qism: boshlanish, shart, qadam', 'while — shart rost ekan takrorlaydi', 'Massiv — qutilar qatori, indeks 0 dan', 'Aylanib chiqish — for + massiv[i] + .length'];
  const HOMEWORK = [{ b: '1 dan 20 gacha', t: '— for sikli bilan barcha sonlarni chop eting' }, { b: 'O\'z ro\'yxatingiz', t: '— 5 ta sevimli narsangizni massivga solib, sikl bilan aylanib chiqing' }, { b: 'Juft sonlar', t: '— 2 dan 10 gacha faqat juft sonlarni chiqaring (i += 2)' }];
  const GLOSSARY = [{ b: 'Sikl', t: '— takrorlash vositasi' }, { b: 'for', t: '— sanab bo\'ladigan sikl (3 qism)' }, { b: 'while', t: '— shartga bog\'liq sikl' }, { b: 'Massiv', t: '— qiymatlar ro\'yxati' }, { b: 'Indeks', t: '— element raqami (0 dan)' }, { b: '.length', t: '— massiv uzunligi' }, { b: 'Aylanib chiqish', t: '— massivning har elementini ko\'rib chiqish' }];
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
    <Stage eyebrow="Tayyor" screen={screen} navContent={<><NavBack onPrev={onPrev} /><button className="btn-ghost" onClick={onReset} style={{ padding: 'clamp(11px,1.6vw,13px) clamp(16px,2.2vw,22px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Qaytadan</button><button className="btn-white-accent" onClick={onFinish} style={{ marginLeft: 'auto', padding: 'clamp(11px,1.6vw,13px) clamp(22px,2.6vw,30px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Yakunlash ✓</button></>}>
      <div className="screen">
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">✓</span> Dars tugadi</span><h2 className="title h-title fade-up d1">Endi <span className="italic" style={{ color: T.accent }}>takrorlashni</span> kompyuterga topshirasiz.</h2><p className="body h-sub fade-up d2">{PASSED ? 'Tabriklaymiz! for, while va massivni aylanib chiqish — hammasini egalladingiz. Bu — dasturlashning yuragi.' : 'Yaxshi harakat! Sikllar muhim — bir-ikki ekranni qayta ko\'rib mustahkamlang.'}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span className="tick" style={{ width: 16, height: 16, borderRadius: '50%', background: T.success, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck">✓</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>📝 Uyga vazifa</div><p className="body" style={{ margin: '0 0 10px', color: T.ink }}>Sikllar bilan mashq qiling:</p><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">Sikllar — eng ko'p ishlatiladigan vosita. Mashq qilsangiz, qo'lingizga o'tirib qoladi! 🚀</p></div>
        </div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">💡 Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function JsLoopsLesson({ lang: langProp, onFinished }) {
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
        .demo-swap { animation: fade-step 0.3s ease-out; }

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
        .for-pt { border-radius: 5px; padding: 1px 5px; font-weight: 700; }
        .for-init { background: rgba(1,154,203,0.22); color: #5BC8EC; }
        .for-cond { background: rgba(255,79,40,0.22); color: #FF9777; }
        .for-step { background: rgba(31,122,77,0.28); color: #6FD79E; }
        .tok-bad { background: rgba(255,79,40,0.22); color: #FF9777; border-radius: 4px; padding: 1px 4px; }
        .tok-ok { background: rgba(31,122,77,0.28); color: #6FD79E; border-radius: 4px; padding: 1px 4px; }

        /* === AI CARD / DEBUGGING / TAGPILL === */
        .tagpill { font-family: 'JetBrains Mono', monospace; font-size: 12.5px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 99px; background: ${T.paper}; color: ${T.ink}; box-shadow: 0 3px 10px -5px rgba(${T.shadowBase},0.18); transition: opacity 0.2s; }
        .hint { background: ${T.bg}; border: 1.5px dashed ${T.ink3}; border-radius: 12px; padding: 14px 16px; font-size: clamp(13px,1.5vw,14px); color: ${T.ink2}; }
        .ai-card { background: ${T.paper}; border-radius: 14px; padding: 15px 17px; display: flex; flex-direction: column; gap: 11px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.14); }
        .ai-row { display: flex; align-items: center; gap: 9px; } .ai-badge { font-family: 'Manrope'; font-weight: 800; font-size: 11px; color: #fff; background: ${T.blue}; padding: 3px 9px; border-radius: 6px; } .ai-bubble { font-size: 13px; color: ${T.ink2}; }
        .ai-code { background: ${CODE.bg}; border-radius: 9px; padding: 10px 12px; display: flex; flex-direction: column; gap: 3px; }
        .ai-line { font-family: 'JetBrains Mono'; font-size: clamp(12.5px,1.7vw,14px); color: ${CODE.text}; padding: 7px 9px; border-radius: 6px; transition: all 0.15s; white-space: pre-wrap; word-break: break-word; }
        .ai-prompt { font-size: 12px; color: ${T.ink3}; margin: 0; font-style: italic; } .note-h { font-weight: 700; font-size: 13px; margin: 0 0 4px; }
        .takeaway { background: ${T.accentSoft}; border-radius: 14px; padding: 20px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 5px; } .ta-bulb { font-size: 34px; } .ta-h { font-family: 'Source Serif 4', serif; font-weight: 600; font-size: clamp(16px,2.2vw,20px); color: ${T.ink}; margin: 0; } .ta-sub { color: ${T.accent}; font-weight: 600; font-size: 13px; margin: 0; }

        /* === TERMINAL === */
        .term { background: ${CODE.bg}; border-radius: 12px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.18); overflow: hidden; }
        .term-bar { display: flex; align-items: center; gap: 6px; padding: 9px 13px; background: rgba(255,255,255,0.04); border-bottom: 1px solid rgba(255,255,255,0.06); }
        .term-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
        .term-title { font-family: 'JetBrains Mono'; font-size: 11px; color: ${CODE.comment}; margin-left: 6px; }
        .term-body { padding: 12px 14px; display: flex; flex-direction: column; gap: 5px; font-family: 'JetBrains Mono'; font-size: clamp(12.5px,1.6vw,14px); color: ${CODE.text}; min-height: 64px; }
        .term-line { display: flex; gap: 9px; animation: el-pop 0.25s ease-out; }
        .term-arrow { color: ${T.success}; flex-shrink: 0; }
        .term-empty { color: ${CODE.comment}; font-style: italic; margin: 0; font-family: 'JetBrains Mono'; font-size: 13px; }

        /* === IWATCH (i qiymati) === */
        .iwatch { display: flex; align-items: baseline; gap: 9px; background: ${T.paper}; border-radius: 12px; padding: 12px 18px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.14); }
        .iwatch-lbl { font-family: 'Manrope'; font-weight: 700; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: ${T.ink3}; }
        .iwatch-eq { font-family: 'JetBrains Mono'; font-size: 18px; color: ${T.ink2}; }
        .iwatch-num { font-family: 'Fraunces', serif; font-size: clamp(34px,7vw,52px); color: ${T.accent}; line-height: 1; }

        /* === LEGEND === */
        .legend { display: flex; flex-direction: column; gap: 7px; }
        .legend-row { display: flex; align-items: center; gap: 9px; font-size: clamp(13px,1.5vw,14px); color: ${T.ink}; }
        .legend-row b { font-weight: 700; }
        .lg-dot { width: 11px; height: 11px; border-radius: 3px; flex-shrink: 0; }

        /* === ARRAY === */
        .arr-row { display: flex; flex-wrap: wrap; gap: 9px; }
        .arr-cell { display: flex; flex-direction: column; align-items: center; gap: 3px; border: none; cursor: pointer; background: ${T.paper}; border-radius: 12px; padding: 12px 14px; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.14); transition: all 0.18s; font-family: 'Manrope'; }
        .arr-cell:hover { transform: translateY(-2px); }
        .arr-cell.on { box-shadow: inset 0 0 0 2px ${T.accent}, 0 10px 22px -6px rgba(255,79,40,0.35); transform: translateY(-3px) scale(1.04); background: ${T.accentSoft}; }
        .arr-cell.scan { box-shadow: inset 0 0 0 2px ${T.accent}, 0 8px 22px -6px rgba(255,79,40,0.4); background: ${T.accentSoft}; transform: translateY(-3px) scale(1.04); }
        .arr-emoji { font-size: 26px; }
        .arr-name { font-weight: 600; font-size: 12.5px; color: ${T.ink}; }
        .arr-idx { font-family: 'JetBrains Mono'; font-size: 11px; font-weight: 700; color: ${T.accent}; }

        /* === GLASS (while) === */
        .glass-wrap { display: flex; flex-direction: column; align-items: center; gap: 9px; background: ${T.paper}; border-radius: 16px; padding: 20px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.14); }
        .glass { position: relative; width: 86px; height: 124px; border: 3px solid ${T.ink3}; border-top: none; border-radius: 6px 6px 16px 16px; overflow: hidden; background: rgba(1,154,203,0.04); }
        .glass-fill { position: absolute; bottom: 0; left: 0; width: 100%; background: linear-gradient(180deg, #4FC3E8, #019ACB); transition: height 0.45s cubic-bezier(.4,0,.2,1); }
        .glass-pct { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-family: 'JetBrains Mono'; font-weight: 700; font-size: 18px; color: ${T.ink}; mix-blend-mode: difference; filter: invert(1); }

        /* === MSG LIST (hook) === */
        .msg-list { display: flex; flex-direction: column; gap: 6px; max-height: 230px; overflow-y: auto; background: ${T.paper}; border-radius: 12px; padding: 13px 15px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.14); }
        .msg-line { display: flex; align-items: center; gap: 9px; font-family: 'Manrope'; font-size: 13.5px; color: ${T.ink}; }
        .msg-ok { flex-shrink: 0; }

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

        /* ===== QO'SHIMCHA ANIMATSIYALAR (v16 yaxshilash) ===== */
        /* S0 — charchoq o'lchagich */
        .fatigue { height: 11px; border-radius: 99px; background: rgba(167,166,162,0.28); overflow: hidden; box-shadow: inset 0 1px 3px rgba(0,0,0,0.12); }
        .fatigue-bar { height: 100%; border-radius: 99px; transition: width 0.35s cubic-bezier(.4,0,.2,1), background 0.35s ease; box-shadow: 0 0 10px -2px currentColor; }
        @keyframes wobble { 0%,100%{transform:rotate(0)} 25%{transform:rotate(-2.5deg)} 75%{transform:rotate(2.5deg)} }
        .btn-tired { animation: wobble 0.45s ease-in-out infinite; }
        @keyframes pop-face { 0%{transform:scale(0.4); opacity:0;} 60%{transform:scale(1.25);} 100%{transform:scale(1); opacity:1;} }
        .face-pop { display: inline-block; animation: pop-face 0.4s cubic-bezier(.34,1.4,.4,1); }

        /* S1 — reja ikonkalari */
        @keyframes spin360 { to { transform: rotate(360deg); } }
        .ic-spin { display: inline-block; animation: spin360 2.6s linear infinite; }
        @keyframes floaty { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-5px)} }
        .ic-float { display: inline-block; animation: floaty 2.4s ease-in-out infinite; }
        .mini-arr { display: flex; gap: 5px; margin-top: 9px; }
        .mini-cell { width: 27px; height: 27px; border-radius: 7px; display: flex; align-items: center; justify-content: center; font-family: 'JetBrains Mono'; font-weight: 700; font-size: 12px; color: ${T.ink2}; background: ${T.bg}; animation: cellwave 2.4s ease-in-out infinite; }
        @keyframes cellwave { 0%,100%{ background: ${T.bg}; color: ${T.ink2}; transform: translateY(0);} 50%{ background: ${T.accent}; color:#fff; transform: translateY(-5px); box-shadow: 0 6px 14px -5px rgba(255,79,40,0.45);} }

        /* S3 — zinapoya */
        .stair-strip { display: flex; align-items: flex-end; gap: 6px; height: 104px; background: ${T.paper}; border-radius: 12px; padding: 10px 12px 8px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.14); }
        .stair-col { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 3px; height: 100%; }
        .stair-bar { width: 100%; border-radius: 5px 5px 0 0; background: rgba(167,166,162,0.3); transition: background 0.35s ease, box-shadow 0.35s ease; }
        .stair-bar.lit { background: linear-gradient(180deg, #6FD79E, ${T.success}); box-shadow: 0 0 14px rgba(31,122,77,0.4); }
        .stair-walker { font-size: 19px; animation: hop 0.5s ease; }
        @keyframes hop { 0%{transform:translateY(-9px)} 60%{transform:translateY(2px)} 100%{transform:translateY(0)} }
        .stair-n { font-family: 'JetBrains Mono'; font-size: 10px; font-weight: 700; color: ${T.ink3}; }
        .stair-bar.lit + .stair-n, .stair-col.on .stair-n { color: ${T.success}; }

        /* S5 — son chizig'i */
        .numline { display: flex; flex-wrap: wrap; gap: 5px; }
        .num-cell { width: 31px; height: 31px; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-family: 'JetBrains Mono'; font-weight: 700; font-size: 12.5px; background: ${T.bg}; color: ${T.ink3}; transition: all 0.3s cubic-bezier(.4,0,.2,1); }
        .num-cell.hit { background: ${T.accent}; color: #fff; transform: translateY(-3px) scale(1.06); box-shadow: 0 6px 15px -5px rgba(255,79,40,0.5); }

        /* S6 — stakan qo'shimchalari */
        .glass-wave { position: absolute; top: -5px; left: -4%; width: 108%; height: 11px; background: #5BC8EC; border-radius: 50%; animation: bob 1.05s ease-in-out infinite; }
        @keyframes bob { 0%,100%{transform: scaleX(1.05) translateY(0);} 50%{transform: scaleX(0.95) translateY(2px);} }
        .tap-emoji { font-size: 30px; position: relative; display: inline-block; }
        .drip { position: absolute; left: 50%; top: 88%; font-size: 14px; animation: dripfall 0.5s linear infinite; }
        @keyframes dripfall { 0%{ opacity: 0; transform: translate(-50%, 0);} 20%{opacity:1;} 100%{ opacity: 0; transform: translate(-50%, 46px);} }
        .splash { position: absolute; top: 10px; left: 50%; font-family: 'JetBrains Mono'; font-weight: 700; font-size: 15px; color: ${T.blue}; animation: floatup 0.72s ease-out; }
        @keyframes floatup { from { opacity: 1; transform: translate(-50%, 8px);} to { opacity: 0; transform: translate(-50%, -24px);} }
        .cond-pill { font-family: 'JetBrains Mono'; font-size: 12px; font-weight: 700; padding: 6px 13px; border-radius: 99px; transition: all 0.3s ease; }

        /* S7 — karta ikonkalari + misol satrlari */
        @keyframes pulseq { 0%,100%{transform:scale(1); opacity:1;} 50%{transform:scale(1.16); opacity:0.65;} }
        .pulse-q { display:inline-block; animation: pulseq 1.4s ease-in-out infinite; }
        .ex-row { animation: el-pop 0.32s ease-out both; }

        /* S11 — do'stlar */
        .friend-card { display: flex; align-items: center; gap: 11px; background: ${T.paper}; border-radius: 12px; padding: 10px 14px; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.14); transition: all 0.4s cubic-bezier(.4,0,.2,1); opacity: 0.5; }
        .friend-card.got { opacity: 1; box-shadow: inset 0 0 0 1.5px ${T.success}, 0 8px 20px -6px rgba(31,122,77,0.25); }
        .friend-ava { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; background: ${T.accentSoft}; flex-shrink: 0; transition: background 0.35s; }
        .friend-card.got .friend-ava { background: ${T.successSoft}; animation: hop 0.5s ease; }
        .friend-name { font-weight: 600; font-size: 14px; color: ${T.ink}; }
        .friend-msg { font-size: 12px; color: ${T.ink2}; }
        .friend-status { margin-left: auto; font-size: 17px; }

        /* S13 — takror hisoblagich */
        .rep-badge { font-family: 'Fraunces', serif; font-size: clamp(30px,7vw,48px); color: ${T.accent}; line-height: 1; }
        @keyframes burstpop { 0%{transform:scale(0); opacity:0;} 55%{transform:scale(1.3);} 100%{transform:scale(1); opacity:1;} }
        .burst { display: inline-block; animation: burstpop 0.5s cubic-bezier(.34,1.4,.4,1); }

        /* S14 — xato silkinishi */
        @keyframes shakeX { 0%,100%{transform:translateX(0)} 18%{transform:translateX(-3px)} 38%{transform:translateX(3px)} 58%{transform:translateX(-2px)} 78%{transform:translateX(2px)} }
        .tok-bad { animation: shakeX 0.42s ease; }
        @keyframes warnpulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
        .warn-pulse { animation: warnpulse 1s ease-in-out infinite; }
      `}</style>
      <div className="lesson-root">
        <Current screen={screen} storedAnswer={answers[screen]} answers={answers} onAnswer={recordAnswer} onNext={next} onPrev={prev} onReset={reset} onFinish={finishLesson} />
      </div>
    </LangContext.Provider>
  );
}
