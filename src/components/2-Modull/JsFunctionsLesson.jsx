import React, { useState, useEffect, useRef, createContext, useContext } from 'react';

// ============================================================
// 11-DARS — JAVASCRIPT: FUNKSIYA, PARAMETR, return — PLATFORM STANDARD v16
// Mavzu: funksiya (nomlangan, qayta ishlatiladigan kod bloki = "mashina"),
//        funksiyani chaqirish (call), parametr (kirish/input),
//        return (mashinadan chiqadigan natija/output),
//        console.log vs return farqi, bir nechta parametr.
// Hook: limonadni har safar qo'lda 4 bosqichda tayyorlash — takror dardi.
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

const LESSON_META = { lessonId: 'js-functions-01-v16', lessonTitle: { uz: 'JavaScript — Funksiya, parametr, return', ru: 'JavaScript — Функция, параметры, return' } };
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

// ===== SCREEN 0 — HOOK (qo'lda takror dardi) =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const NEED = 5;
  const [count, setCount] = useState(0);
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const OPTS = [
    { id: 'a', label: "Har safar 4 bosqichni qo'lda takrorlayman" },
    { id: 'b', label: "Bir marta 'mashina' yasab, keyin tugma bosaman" },
    { id: 'c', label: "Umuman limonad ichmayman" }
  ];
  const make = () => setCount(c => Math.min(c + 1, NEED));
  const pick = (v) => { if (picked !== null) return; setPicked(v); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: true }); };
  return (
    <Stage eyebrow="Kirish" screen={screen} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 800 }}>Limonadni har safar <span className="italic" style={{ color: T.accent }}>noldan</span> qo'lda tayyorlaysizmi?</h1>
        <Mentor>Tasavvur qiling: do'stlaringiz kelishdi, hammaga limonad kerak. Har bir stakan uchun <b style={{ color: T.ink }}>4 bosqichni</b> — limon kesish, shakar qo'shish, suv quyish, aralashtirish — qo'lda takrorlaysiz. Tugmani bir necha marta bosing, qancha zerikarli ekanini his qiling.</Mentor>
        <Split>
          <Col>
            <p className="flow-label">Qo'lda tayyorlangan limonadlar</p>
            <div className="msg-list fade-up delay-1">
              {count === 0 ? (
                <p style={{ color: T.ink3, fontStyle: 'italic', margin: 0, fontFamily: "'JetBrains Mono',monospace", fontSize: 13 }}>// hali bittasi ham tayyorlanmadi</p>
              ) : Array.from({ length: count }).map((_, i) => (
                <div key={i} className="msg-line el-in"><span className="msg-ok">🍋</span><span>Limonad #{i + 1} — 4 bosqich qo'lda bajarildi</span></div>
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <button className="btn" onClick={make} disabled={count >= NEED} style={{ alignSelf: 'flex-start' }}>{count >= NEED ? '😕 Charchadim…' : "🍋 Yana bittasini qo'lda tayyorlash"}</button>
              <span className="mono small" style={{ color: T.ink3 }}>{count} / {NEED}</span>
            </div>
            {count >= 3 && count < NEED && <p className="hook-ack fade-step">Har safar <b>aynan bir xil 4 bosqich</b>… Zerikarli, to'g'rimi? 😅</p>}
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Dasturchi buni qanday hal qiladi?</p>
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
            {picked !== null && <p className="hook-ack fade-step">To'g'ri yo'l — <b>funksiya</b> yasash! Bir marta "mashina"ni yozasiz, keyin nom bilan istalgancha chaqirasiz. Bugun shuni o'rganamiz.</p>}
          </Col>
        </Split>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const STEPS = [
    { text: 'Funksiya nima? — nomlangan retsept', tag: '' },
    { text: 'Funksiyani chaqirish — nom bilan', tag: 'salomBer()' },
    { text: 'Parametr — mashinaga kirish', tag: '(ism)' },
    { text: 'return — mashinadan natija', tag: 'javob' },
    { text: 'Hammasi birga — kalkulyator mashinasi', tag: '' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const PreviewBlock = (
    <Col>
      <p className="flow-label">Bugungi 3 tushuncha</p>
      <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
        <div className="frame" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px' }}>
          <span style={{ fontSize: 30 }}>🛠️</span>
          <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, color: T.ink, margin: 0, fontSize: 'clamp(16px,2.2vw,19px)' }}>FUNKSIYA</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>Nomlangan, qayta ishlatiladigan kod bloki (mashina)</p></div>
        </div>
        <div className="frame" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px' }}>
          <span style={{ fontSize: 30 }}>⬅️</span>
          <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, color: T.ink, margin: 0, fontSize: 'clamp(16px,2.2vw,19px)' }}>PARAMETR</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>Mashinaga beriladigan kirish (input)</p></div>
        </div>
        <div className="frame" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px' }}>
          <span style={{ fontSize: 30 }}>➡️</span>
          <div><p style={{ fontFamily: "'Source Serif 4',serif", fontWeight: 600, color: T.ink, margin: 0, fontSize: 'clamp(16px,2.2vw,19px)' }}>RETURN</p><p className="body" style={{ margin: '2px 0 0', color: T.ink2 }}>Mashinadan chiqadigan natija (output)</p></div>
        </div>
      </div>
      <p className="mono small" style={{ color: T.accent, margin: 0 }}>→ uchalasi birga — haqiqiy "mashina"!</p>
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
          <h2 className="title h-title fade-up">Murakkab ishni bitta <span className="italic" style={{ color: T.accent }}>nom</span> ortiga yashiramiz!</h2>
        </div>
        <Mentor>Yaxshi dasturchi bir ishni <b style={{ color: T.ink }}>bir marta yozadi</b>, unga nom beradi va keyin shu nom bilan istalgancha ishlatadi. Bu — <b style={{ color: T.ink }}>funksiya</b>. Bugun 3 tushunchani ochamiz — <b style={{ color: T.ink }}>funksiya</b>, <b style={{ color: T.ink }}>parametr</b> va <b style={{ color: T.ink }}>return</b> — 5 ta qadamda.</Mentor>
        {!isNarrow ? (
          <Split>{PreviewBlock}{StepsBlock}</Split>
        ) : !showSteps ? (
          <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>
            {PreviewBlock}
            <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>📋 Bugungi 5 qadamni ko'rish</button>
          </div>
        ) : (
          <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>
            <button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ Tushunchalarni ko'rish</button>
            {StepsBlock}
          </div>
        )}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — FUNKSIYA NIMA (funksiyasiz vs funksiya bilan) =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [mode, setMode] = useState('manual');
  const [seen, setSeen] = useState(new Set(['manual']));
  const done = seen.size >= 2;
  const set = (m) => { setMode(m); setSeen(prev => { const n = new Set(prev); n.add(m); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Funksiya nima" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Ikkala usulni ko'ring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bir retseptni <span className="italic" style={{ color: T.accent }}>3 marta</span> — qanday yozamiz?</h2></div>
        <Mentor>3 qatorli salomlashishni 3 marta chop etmoqchimiz. <b style={{ color: T.ink }}>Funksiyasiz</b> — uch qatorni qayta-qayta ko'chiramiz (9 qator). <b style={{ color: T.ink }}>Funksiya bilan</b> — bir marta yozib, unga <b style={{ color: T.ink }}>nom</b> beramiz va shu nomni 3 marta chaqiramiz. Ikkala tugmani bosib solishtiring.</Mentor>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${mode === 'manual' ? 'chip-on' : ''}`} onClick={() => set('manual')}>😕 Funksiyasiz</button>
              <button className={`chip ${mode === 'loop' ? 'chip-on' : ''}`} onClick={() => set('loop')}>🛠️ Funksiya bilan</button>
            </div>
            <div className="codebox demo-swap" key={mode}>
              {mode === 'manual' ? (
                <>
                  <div><FN>console</FN>.<FN>log</FN>(<STR>"Salom!"</STR>)</div>
                  <div><FN>console</FN>.<FN>log</FN>(<STR>"Xush kelibsiz"</STR>)</div>
                  <div><FN>console</FN>.<FN>log</FN>(<STR>"Yaxshi kun!"</STR>)</div>
                  <div><CM>// ... yana, yana — 9 qator</CM></div>
                  <div><CM>// matnni o'zgartirsak — 3 joyda tuzatamiz 🥲</CM></div>
                </>
              ) : (
                <>
                  <div><KW>function</KW> <FN>salomBer</FN>() {'{'}</div>
                  <div style={{ paddingLeft: 18 }}><FN>console</FN>.<FN>log</FN>(<STR>"Salom!"</STR>)</div>
                  <div style={{ paddingLeft: 18 }}><FN>console</FN>.<FN>log</FN>(<STR>"Xush kelibsiz"</STR>)</div>
                  <div style={{ paddingLeft: 18 }}><FN>console</FN>.<FN>log</FN>(<STR>"Yaxshi kun!"</STR>)</div>
                  <div>{'}'}</div>
                  <div style={{ marginTop: 8 }}><FN>salomBer</FN>() <CM>// 1-marta</CM></div>
                  <div><FN>salomBer</FN>() <CM>// 2-marta</CM></div>
                  <div><FN>salomBer</FN>() <CM>// 3-marta</CM></div>
                </>
              )}
            </div>
          </Col>
          <Col>
            <p className="flow-label">Natija (ikkalasida bir xil)</p>
            <Terminal lines={['Salom!', 'Xush kelibsiz', 'Yaxshi kun!', '...', '(har chaqiriqda shu uchlik takrorlanadi)']} />
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Natija bir xil! Lekin <b>funksiya</b> bilan retsept bir marta yozildi. Matnni o'zgartirsangiz — faqat <b>bitta joyda</b> tuzatasiz. Mana shuning uchun funksiya kerak.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — FUNKSIYA ANATOMIYASI =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [part, setPart] = useState(null);
  const [out, setOut] = useState(storedAnswer ? ['Salom, Ali!'] : []);
  const [running, setRunning] = useState(false);
  const timer = useRef(null);
  const done = out.length >= 1;
  const PARTS = {
    name: { color: T.blue, num: '1', name: 'Funksiya nomi', code: 'salomBer', desc: "Mashinaning nomi. Aynan shu nom bilan funksiyani chaqiramiz: salomBer()." },
    param: { color: T.accent, num: '2', name: 'Parametr', code: 'ism', desc: 'Mashinaga beriladigan kirish (input). Chaqirganda haqiqiy qiymat solamiz, masalan "Ali".' },
    ret: { color: T.success, num: '3', name: 'return', code: 'return', desc: 'Mashinadan chiqadigan natija (output). Funksiya javobni shu yerda tashqariga qaytaradi.' }
  };
  useEffect(() => () => clearTimeout(timer.current), []);
  const run = () => {
    clearTimeout(timer.current); setOut([]); setRunning(true);
    timer.current = setTimeout(() => { setOut(['Salom, Ali!']); setRunning(false); }, 700);
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Funksiya tuzilishi" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Avval chaqiring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Funksiya nimalardan <span className="italic" style={{ color: T.accent }}>tuzilgan?</span></h2></div>
        <Mentor>Funksiyani mashinaga o'xshating: uning <b style={{ color: T.blue }}>nomi</b> bor (qaysi mashina), <b style={{ color: T.accent }}>parametri</b> bor (nima kiritamiz) va <b style={{ color: T.success }}>return</b>i bor (qanday natija chiqaradi). Qavs ichidagi <b style={{ color: T.ink }}>{'{ }'}</b> — uning ichki mexanizmi (tanasi). Rangli qismlarni <b style={{ color: T.ink }}>bosib</b> bilib oling, so'ng "Chaqirish"ni bosing.</Mentor>
        <div className="split">
          <Col>
            <div className="codebox fade-up delay-1" style={{ fontSize: 'clamp(13px,1.8vw,15px)' }}>
              <div>
                <KW>function</KW>{' '}
                <span onClick={() => setPart('name')} style={{ cursor: 'pointer', color: '#5BC8EC', fontWeight: 700, outline: part === 'name' ? `2px solid ${T.blue}` : 'none', borderRadius: 4, padding: '0 2px' }}>salomBer</span>(
                <span onClick={() => setPart('param')} style={{ cursor: 'pointer', color: '#FF9777', fontWeight: 700, outline: part === 'param' ? `2px solid ${T.accent}` : 'none', borderRadius: 4, padding: '0 2px' }}>ism</span>) {'{'}
              </div>
              <div style={{ paddingLeft: 18 }}>
                <span onClick={() => setPart('ret')} style={{ cursor: 'pointer', color: '#6FD79E', fontWeight: 700, outline: part === 'ret' ? `2px solid ${T.success}` : 'none', borderRadius: 4, padding: '0 2px' }}>return</span>{' '}
                <STR>"Salom, "</STR> + ism + <STR>"!"</STR>
              </div>
              <div>{'}'}</div>
            </div>
            {part ? (
              <div className="sk-info fade-step" key={part}>
                <span className="sk-tagbig"><span className="lg-dot" style={{ background: PARTS[part].color, width: 14, height: 14 }} /><span className="sk-wordbadge" style={{ color: PARTS[part].color, background: PARTS[part].color + '22' }}>{PARTS[part].num}. {PARTS[part].name}</span><span className="mono" style={{ color: T.ink2 }}>{PARTS[part].code}</span></span>
                <p className="body" style={{ color: T.ink, margin: '10px 0 0' }}>{PARTS[part].desc}</p>
              </div>
            ) : (
              <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>👆 Koddagi 3 ta rangli qismni bosing</p></div>
            )}
          </Col>
          <Col>
            <p className="flow-label">Mashinani sinab ko'ramiz</p>
            <div className="codebox fade-up delay-1"><div><FN>console</FN>.<FN>log</FN>(<FN>salomBer</FN>(<STR>"Ali"</STR>))</div></div>
            <Terminal lines={out} empty="// ▶ chaqiring" />
            <button className="btn" onClick={run} disabled={running} style={{ alignSelf: 'flex-start' }}>{running ? 'Ishlayapti…' : (done ? '↻ Yana chaqirish' : '▶ salomBer("Ali") ni chaqirish')}</button>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ "Ali" qiymati <b>ism</b> parametriga tushdi, funksiya <span className="mono">return</span> orqali <b>"Salom, Ali!"</b> ni qaytardi. Mana to'liq mashina!</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 =====
const Screen4 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 1-savol"
    questionText="salomBer() deb yozsak nima bo'ladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}><span className="mono" style={{ color: T.accent }}>salomBer()</span> deb yozsak nima bo'ladi?</h2></>}
    options={['Hech narsa — bu shunchaki nom', 'Funksiya ichidagi kod ishga tushadi (chaqiriladi)', 'Funksiya butunlay o\'chib ketadi', 'Yangi funksiya yaratiladi']} correctIdx={1}
    explainCorrect="To'g'ri! Nomdan keyingi () — bu chaqirish (call). Funksiya ichida yozilgan kod aynan shu paytda ishga tushadi."
    explainWrong={{
      0: 'Yo’q — () qo’shilsa, bu chaqirish bo’ladi: funksiya ichidagi kod ishlaydi.',
      2: 'Yo’q — chaqirish funksiyani o’chirmaydi. Aksincha, uni ishga tushiradi va keyin yana chaqirsa bo’ladi.',
      3: 'Yo’q — funksiya «function» bilan bir marta yaratiladi. salomBer() esa borini chaqiradi.',
      default: 'salomBer() — funksiyani chaqiradi: ichidagi kod ishga tushadi.'
    }} />
);

// ===== SCREEN 5 — PARAMETR (kirishni o'zgartirish) =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const ISMLAR = ['Ali', 'Laylo', 'Bobur', 'Nodira'];
  const [sel, setSel] = useState(0);
  const [seen, setSeen] = useState(new Set([0]));
  const done = seen.size >= 2;
  const pick = (i) => { setSel(i); setSeen(prev => { const n = new Set(prev); n.add(i); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const ism = ISMLAR[sel];
  return (
    <Stage eyebrow="Parametr" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Kirishni o\'zgartiring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Mashinaga <span className="italic" style={{ color: T.accent }}>turli narsa</span> kiriting</h2></div>
        <Mentor>Parametr — bu mashinaning <b style={{ color: T.ink }}>kirish teshigi</b>. Funksiyani <span className="mono">salomBer("Ali")</span> deb chaqirganda, <b style={{ color: T.ink }}>"Ali"</b> qiymati <span className="mono">ism</span> parametriga tushadi. Kirishni o'zgartiring — natija o'zi o'zgaradi.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">Kimga salom beramiz?</p>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {ISMLAR.map((nm, i) => <button key={i} className={`chip ${sel === i ? 'chip-on' : ''}`} onClick={() => pick(i)}>{nm}</button>)}
            </div>
            <div className="codebox" style={{ marginTop: 6 }}>
              <div><KW>function</KW> <FN>salomBer</FN>(<span style={{ color: '#FF9777', fontWeight: 700 }}>ism</span>) {'{'}</div>
              <div style={{ paddingLeft: 18 }}><KW>return</KW> <STR>"Salom, "</STR> + <span style={{ color: '#FF9777', fontWeight: 700 }}>ism</span> + <STR>"!"</STR></div>
              <div>{'}'}</div>
              <div style={{ marginTop: 8 }}><FN>salomBer</FN>(<STR>"{ism}"</STR>)</div>
            </div>
          </Col>
          <Col>
            <p className="flow-label">Natija</p>
            <Terminal lines={[`Salom, ${ism}!`]} />
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Ko'rdingizmi? Funksiya <b>bitta</b>, lekin har xil <b>parametr</b> bilan har xil natija beradi. Bir mashina — ko'p ish!</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 5b — TEST 2 (chaqiruv natijasi) =====
const Screen5b = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Tekshiruv"
    questionText="function kvadrat(n) { return n * n }. kvadrat(3) nimani qaytaradi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Funksiyani o'qing</p><div className="codebox" style={{ marginTop: 10, marginBottom: 6 }}><div><KW>function</KW> <FN>kvadrat</FN>(n) {'{'} <KW>return</KW> n * n {'}'}</div></div><h2 className="title h-sub" style={{ marginTop: 6 }}><span className="mono" style={{ color: T.accent }}>kvadrat(3)</span> nimani qaytaradi?</h2></>}
    options={['6', '9', '3', '33']} correctIdx={1}
    explainCorrect="To'g'ri! 3 qiymati n parametriga tushadi, funksiya n * n = 3 * 3 = 9 ni qaytaradi."
    explainWrong={{
      0: 'Yo’q — 6 bu 3 + 3 bo’lardi. Bizda esa n * n (ko’paytirish): 3 * 3 = 9.',
      2: 'Yo’q — 3 bu shunchaki n ning o’zi. Funksiya n * n qaytaradi: 9.',
      3: 'Yo’q — 33 bu matn ulanishi. Bizda son ko’paytiriladi: 3 * 3 = 9.',
      default: 'n = 3 → n * n = 9.'
    }} />
);

// ===== SCREEN 6 — return (natija qaytarish) =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [n, setN] = useState(5);
  const [natija, setNatija] = useState(storedAnswer ? 25 : null);
  const [running, setRunning] = useState(false);
  const [ran, setRan] = useState(!!storedAnswer);
  const timer = useRef(null);
  const done = ran;
  useEffect(() => () => clearTimeout(timer.current), []);
  const run = () => {
    clearTimeout(timer.current); setNatija(null); setRunning(true);
    timer.current = setTimeout(() => { setNatija(n * n); setRunning(false); setRan(true); }, 750);
  };
  const setNN = (v) => { setN(v); setNatija(null); setRan(false); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="return" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Avval ishga tushiring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Funksiya javobini qanday <span className="italic" style={{ color: T.accent }}>saqlab qolamiz?</span></h2></div>
        <Mentor><span className="mono" style={{ color: T.accent }}>return</span> funksiyaning <b style={{ color: T.ink }}>javobini tashqariga qaytaradi</b>. Eng muhimi: bu javobni <b style={{ color: T.ink }}>o'zgaruvchiga saqlash</b> va keyin ishlatish mumkin! <span className="mono">kvadrat</span> mashinasiga son kiriting va ishga tushiring — natija <span className="mono">natija</span> o'zgaruvchisida saqlanadi.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">Qaysi sonni kiritamiz?</p>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              {[4, 5, 6].map(v => <button key={v} className={`chip ${n === v ? 'chip-on' : ''}`} onClick={() => setNN(v)}>{v}</button>)}
            </div>
            <div className="codebox" style={{ marginTop: 6 }}>
              <div><KW>function</KW> <FN>kvadrat</FN>(n) {'{'}</div>
              <div style={{ paddingLeft: 18 }}><KW>return</KW> n * n <CM>// natijani qaytaradi</CM></div>
              <div>{'}'}</div>
              <div style={{ marginTop: 8 }}><KW>let</KW> natija = <FN>kvadrat</FN>(<NUM>{n}</NUM>) <CM>// natija ni saqlaydi</CM></div>
            </div>
            <button className="btn" onClick={run} disabled={running} style={{ alignSelf: 'flex-start' }}>{running ? 'Ishlayapti…' : (done ? '↻ Yana' : '▶ Ishga tushir')}</button>
          </Col>
          <Col>
            <div className="iwatch fade-up delay-1">
              <span className="iwatch-lbl">natija</span>
              <span className="iwatch-eq">=</span>
              <span className="iwatch-num">{natija ?? '·'}</span>
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ <span className="mono">return n * n</span> javob ({n} × {n} = {n * n}) ni qaytardi, u <span className="mono">natija</span> o'zgaruvchisiga saqlandi. Endi bu qiymatni xohlagancha ishlatishingiz mumkin!</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — console.log vs return =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const CARDS = {
    logc: { ic: '👁️', name: 'console.log', when: 'EKRANGA chiqaradi (ko\'rsatadi)', ex: ['natijani ko\'zga ko\'rsatish', 'xabar chop etish', 'tekshirish uchun yozish'] },
    retc: { ic: '📦', name: 'return', when: 'QIYMATNI qaytaradi (beradi)', ex: ['natijani o\'zgaruvchiga saqlash', 'boshqa joyda ishlatish', 'hisob-kitobni qaytarish'] }
  };
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(new Set());
  const isNarrow = useIsMobile(768);
  const done = seen.size >= 2;
  const tap = (k) => { setActive(k); setSeen(prev => { const n = new Set(prev); n.add(k); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="log ⚔️ return" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/2 ko'ring`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Eng ko'p <span className="italic" style={{ color: T.accent }}>chalkashtiradigan</span> ikkita narsa</h2></div>
        <Mentor>Yangi dasturchilar <span className="mono">console.log</span> va <span className="mono">return</span> ni adashtiradi. Farq oddiy: <b style={{ color: T.accent }}>console.log</b> natijani <b style={{ color: T.ink }}>ekranga ko'rsatadi</b> (ko'z uchun), <b style={{ color: T.accent }}>return</b> esa qiymatni <b style={{ color: T.ink }}>kodga qaytaradi</b> (saqlash uchun). Ikkala kartani bosing.</Mentor>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {Object.keys(CARDS).map(k => (
                <button key={k} onClick={() => tap(k)} style={{ display: 'flex', alignItems: 'center', gap: 13, textAlign: 'left', cursor: 'pointer', border: 'none', borderRadius: 14, padding: '15px 16px', background: T.paper, boxShadow: active === k ? `inset 0 0 0 2px ${T.accent}, 0 8px 20px -6px rgba(255,79,40,0.22)` : `0 6px 16px -6px rgba(${T.shadowBase},0.14)`, transition: 'all 0.18s' }}>
                  <span style={{ fontSize: 28 }}>{CARDS[k].ic}</span>
                  <span className="mono" style={{ fontWeight: 700, fontSize: 16, color: T.accent }}>{CARDS[k].name}</span>
                  {seen.has(k) && <span style={{ marginLeft: 'auto', color: T.success, fontSize: 15 }}>✓</span>}
                </button>
              ))}
            </div>
          </Col>
          <Col>
            {active ? (
              <div className="sk-info fade-step" key={active}>
                <span className="sk-tagbig"><span style={{ fontSize: 24 }}>{CARDS[active].ic}</span><span className="sk-wordbadge">{CARDS[active].name}</span></span>
                <p className="body" style={{ color: T.ink, margin: '11px 0 9px', fontWeight: 600 }}>{CARDS[active].when}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {CARDS[active].ex.map((e, i) => (<div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', background: T.bg, borderRadius: 8, padding: '8px 11px' }}><span style={{ color: T.accent }}>•</span><span className="body" style={{ margin: 0, color: T.ink2 }}>{e}</span></div>))}
                </div>
              </div>
            ) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Bir kartani bosing</p></div> : null)}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Esda tuting: <b>console.log</b> = ko'rsatadi (yo'qoladi), <b>return</b> = qaytaradi (saqlanadi va ishlatiladi).</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — BIR NECHTA PARAMETR =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [a, setA] = useState(5);
  const [b, setB] = useState(3);
  const [seen, setSeen] = useState(new Set(['5-3']));
  const done = seen.size >= 2;
  const mark = (x, y) => setSeen(prev => { const n = new Set(prev); n.add(`${x}-${y}`); return n; });
  const setAA = (x) => { setA(x); mark(x, b); };
  const setBB = (y) => { setB(y); mark(a, y); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Ko'p parametr" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Sonlarni o\'zgartiring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Mashinaga <span className="italic" style={{ color: T.accent }}>2 ta narsa</span> kiritsak-chi?</h2></div>
        <Mentor>Bitta funksiya bir nechta parametr olishi mumkin — ularni <b style={{ color: T.ink }}>vergul</b> bilan ajratamiz. <span className="mono">qoshish(a, b)</span> ikkita son oladi va yig'indisini qaytaradi. Diqqat: <b style={{ color: T.ink }}>tartib</b> muhim — birinchisi <span className="mono">a</span>, ikkinchisi <span className="mono">b</span>.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">Birinchi son — a</p>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              {[2, 5, 10].map(v => <button key={v} className={`chip ${a === v ? 'chip-on' : ''}`} onClick={() => setAA(v)}>{v}</button>)}
            </div>
            <p className="flow-label" style={{ marginTop: 4 }}>Ikkinchi son — b</p>
            <div className="fade-up delay-2" style={{ display: 'flex', gap: 8 }}>
              {[3, 4, 7].map(v => <button key={v} className={`chip ${b === v ? 'chip-on' : ''}`} onClick={() => setBB(v)}>{v}</button>)}
            </div>
            <div className="codebox" style={{ marginTop: 6 }}>
              <div><KW>function</KW> <FN>qoshish</FN>(<span style={{ color: '#FF9777', fontWeight: 700 }}>a</span>, <span style={{ color: '#FF9777', fontWeight: 700 }}>b</span>) {'{'}</div>
              <div style={{ paddingLeft: 18 }}><KW>return</KW> a + b</div>
              <div>{'}'}</div>
              <div style={{ marginTop: 8 }}><FN>qoshish</FN>(<NUM>{a}</NUM>, <NUM>{b}</NUM>)</div>
            </div>
          </Col>
          <Col>
            <p className="flow-label">Natija</p>
            <Terminal lines={[`${a} + ${b} = ${a + b}`]} />
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Ikkita parametr — ikkita kirish. Sonlarni o'zgartirdingiz, funksiya darhol yangi yig'indini qaytardi. Bitta mashina, cheksiz hisob-kitob!</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 9 — TEST 3 (parametr tartibi) =====
const Screen9 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 2-savol"
    questionText="function ayir(a, b) { return a - b }. ayir(10, 3) nimani qaytaradi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><div className="codebox" style={{ marginTop: 10, marginBottom: 6 }}><div><KW>function</KW> <FN>ayir</FN>(a, b) {'{'} <KW>return</KW> a - b {'}'}</div></div><h2 className="title h-sub" style={{ marginTop: 6 }}><span className="mono" style={{ color: T.accent }}>ayir(10, 3)</span> nimani qaytaradi?</h2></>}
    options={['13', '7', '-7', '103']} correctIdx={1}
    explainCorrect="To'g'ri! Tartib bo'yicha a = 10, b = 3. Funksiya a - b = 10 - 3 = 7 ni qaytaradi."
    explainWrong={{
      0: 'Yo’q — 13 bu a + b bo’lardi. Bizda ayirma: a - b = 10 - 3 = 7.',
      2: 'Yo’q — bu b - a (3 - 10). Lekin tartib muhim: a birinchi = 10, b ikkinchi = 3 → 7.',
      3: 'Yo’q — 103 bu matn ulanishi. Bizda son ayiriladi: 10 - 3 = 7.',
      default: 'a = 10, b = 3 → a - b = 7.'
    }} />
);

// ===== SCREEN 10 — HAMMASI BIRGA (kalkulyator mashinasi) =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const NARX = 1000;
  const [soni, setSoni] = useState(3);
  const [jami, setJami] = useState(storedAnswer ? NARX * 3 : null);
  const [running, setRunning] = useState(false);
  const [ran, setRan] = useState(!!storedAnswer);
  const timer = useRef(null);
  const done = ran;
  useEffect(() => () => clearTimeout(timer.current), []);
  const run = () => {
    clearTimeout(timer.current); setJami(null); setRunning(true);
    timer.current = setTimeout(() => { setJami(NARX * soni); setRunning(false); setRan(true); }, 750);
  };
  const setSS = (v) => { setSoni(v); setJami(null); setRan(false); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Hammasi birga" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Avval hisoblang'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Funksiya + parametr + return — <span className="italic" style={{ color: T.accent }}>birga</span></h2></div>
        <Mentor>Mana haqiqiy "mashina"! Do'kon kassasini yasaymiz: <span className="mono">hisobla(narx, soni)</span> ikkita parametr oladi, ularni ko'paytiradi va <b style={{ color: T.ink }}>jami narxni</b> <span className="mono">return</span> qiladi. Nechta daftar olishni tanlang va hisoblang.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">Nechta daftar? (donasi {NARX} so'm)</p>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              {[2, 3, 4].map(v => <button key={v} className={`chip ${soni === v ? 'chip-on' : ''}`} onClick={() => setSS(v)}>{v} ta</button>)}
            </div>
            <div className="codebox" style={{ marginTop: 6 }}>
              <div><KW>function</KW> <FN>hisobla</FN>(narx, soni) {'{'}</div>
              <div style={{ paddingLeft: 18 }}><KW>return</KW> narx * soni</div>
              <div>{'}'}</div>
              <div style={{ marginTop: 8 }}><KW>let</KW> jami = <FN>hisobla</FN>(<NUM>{NARX}</NUM>, <NUM>{soni}</NUM>)</div>
            </div>
            <button className="btn" onClick={run} disabled={running} style={{ alignSelf: 'flex-start' }}>{running ? 'Hisoblanyapti…' : (done ? '↻ Yana' : '🧮 Jami narxni hisoblash')}</button>
          </Col>
          <Col>
            <div className="iwatch fade-up delay-1">
              <span className="iwatch-lbl">jami</span>
              <span className="iwatch-eq">=</span>
              <span className="iwatch-num">{jami ?? '·'}</span>
            </div>
            <p className="mono small" style={{ color: T.ink3, margin: 0 }}>{jami !== null ? `${jami} so'm` : "// hisoblanmadi"}</p>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ <b>Funksiya</b> (hisobla), <b>parametrlar</b> (narx, soni) va <b>return</b> (narx × soni) — uchalasi birga ishladi. {NARX} × {soni} = {jami} so'm!</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — HAYOTIY MISOL (hook yechimi: limonad mashinasi) =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const XILLAR = [{ e: '🍋', n: 'klassik' }, { e: '🌿', n: 'yalpizli' }, { e: '🫐', n: 'malinali' }];
  const N = XILLAR.length;
  const [out, setOut] = useState(storedAnswer ? XILLAR.map(x => `🥤 ${x.n} limonad tayyor`) : []);
  const [running, setRunning] = useState(false);
  const timer = useRef(null);
  const done = out.length >= N;
  useEffect(() => () => clearTimeout(timer.current), []);
  const run = () => {
    clearTimeout(timer.current); setOut([]); setRunning(true);
    const tick = (i) => {
      setOut(prev => [...prev, `🥤 ${XILLAR[i].n} limonad tayyor`]);
      if (i < N - 1) timer.current = setTimeout(() => tick(i + 1), 520);
      else setRunning(false);
    };
    timer.current = setTimeout(() => tick(0), 300);
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Hayotiy misol" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Mashinani ishlating'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Esingizdami — <span className="italic" style={{ color: T.accent }}>limonad?</span> Mana mashina!</h2></div>
        <Mentor>Dars boshida har bir limonadni qo'lda 4 bosqichda tayyorlayotgan edingiz. Endi <b style={{ color: T.ink }}>limonad mashinasini</b> yozdik: retsept bir marta funksiya ichida. Mashinani <b style={{ color: T.ink }}>xil</b> (ta'm) parametri bilan chaqirsangiz — har safar tayyor limonad qaytaradi. Tugmani bosing.</Mentor>
        <div className="split">
          <Col>
            <div className="codebox fade-up delay-1" style={{ lineHeight: 1.9 }}>
              <div><KW>function</KW> <FN>limonadTayyorla</FN>(<span style={{ color: '#FF9777', fontWeight: 700 }}>xil</span>) {'{'}</div>
              <div style={{ paddingLeft: 16 }}><CM>// limon, shakar, suv, aralashtir</CM></div>
              <div style={{ paddingLeft: 16 }}><KW>return</KW> <STR>"🥤 "</STR> + xil + <STR>" limonad tayyor"</STR></div>
              <div>{'}'}</div>
              <div style={{ marginTop: 8 }}><FN>limonadTayyorla</FN>(<STR>"klassik"</STR>)</div>
              <div><FN>limonadTayyorla</FN>(<STR>"yalpizli"</STR>)</div>
              <div><FN>limonadTayyorla</FN>(<STR>"malinali"</STR>)</div>
            </div>
            <button className="btn" onClick={run} disabled={running} style={{ alignSelf: 'flex-start' }}>{running ? 'Tayyorlanyapti…' : (done ? '↻ Yana tayyorlash' : '🍋 Mashinada tayyorlash')}</button>
          </Col>
          <Col>
            <p className="flow-label">Tayyor limonadlar</p>
            <Terminal lines={out} empty="// ▶ tugmani bosing" title="limonad mashinasi" />
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ 3 xil limonad — <b>bitta funksiya bilan</b>! Retsept bir marta yozildi, mashina har xil parametr bilan har xil natija qaytardi. Mana funksiyaning kuchi! 🚀</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — TEST 4 (return qiymatini saqlash) =====
const Screen12 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 3-savol"
    questionText="function salom(ism) { return 'Salom, ' + ism }. let x = salom('Olim'). x da nima saqlanadi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><div className="codebox" style={{ marginTop: 10, marginBottom: 6 }}><div><KW>function</KW> <FN>salom</FN>(ism) {'{'} <KW>return</KW> <STR>"Salom, "</STR> + ism {'}'}</div><div style={{ marginTop: 4 }}><KW>let</KW> x = <FN>salom</FN>(<STR>"Olim"</STR>)</div></div><h2 className="title h-sub" style={{ marginTop: 6 }}><span className="mono" style={{ color: T.accent }}>x</span> o'zgaruvchisida nima saqlanadi?</h2></>}
    options={['"salom"', '"ism"', '"Salom, Olim"', 'undefined']} correctIdx={2}
    explainCorrect={`To'g'ri! "Olim" ism parametriga tushadi, funksiya "Salom, " + ism = "Salom, Olim" ni qaytaradi. return qiymati x ga saqlanadi.`}
    explainWrong={{
      0: 'Yo’q — funksiya nomi «salom», lekin u matn qaytarmaydi. Qaytadigan qiymat «Salom, Olim».',
      1: 'Yo’q — «ism» bu parametr nomi. Uning qiymati «Olim», natija esa «Salom, Olim».',
      3: 'Yo’q — return bor, demak undefined emas. Funksiya «Salom, Olim» ni qaytaradi.',
      default: 'return «Salom, Olim» ni qaytaradi → x = «Salom, Olim».'
    }} />
);

// ===== SCREEN 13 — AMALIYOT: O'Z FUNKSIYANGIZNI CHAQIRING =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const ISMLAR = ['Ali', 'Laylo', 'Bobur'];
  const SALOMLAR = ['Salom', 'Assalom', 'Hayrli kun'];
  const [ismI, setIsmI] = useState(0);
  const [sI, setSI] = useState(0);
  const [out, setOut] = useState([]);
  const [running, setRunning] = useState(false);
  const [ran, setRan] = useState(!!storedAnswer);
  const timer = useRef(null);
  const done = ran;
  useEffect(() => () => clearTimeout(timer.current), []);
  const run = () => {
    clearTimeout(timer.current); setOut([]); setRunning(true);
    timer.current = setTimeout(() => { setOut([`${SALOMLAR[sI]}, ${ISMLAR[ismI]}!`]); setRunning(false); setRan(true); }, 600);
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Amaliyot · o'z funksiyangiz" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Funksiyani chaqiring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(8px,1.4vw,14px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Endi <span className="italic" style={{ color: T.accent }}>siz</span> funksiyani sinab ko'ring</h2></div>
        <Mentor>Navbat sizga! <b style={{ color: T.ink }}>Salomlashish so'zini</b> tanlang (funksiya ichida) va <b style={{ color: T.ink }}>kimga</b> ekanini tanlang (parametr), keyin "Chaqirish"ni bosing. Kod va natija o'zgarishini kuzating.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">Qaysi so'z? (funksiya ichi)</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {SALOMLAR.map((m, i) => <button key={i} className={`chip ${sI === i ? 'chip-on' : ''}`} onClick={() => { setSI(i); setRan(false); }}>"{m}"</button>)}
            </div>
            <p className="flow-label" style={{ marginTop: 4 }}>Kimga? (parametr)</p>
            <div className="fade-up delay-2" style={{ display: 'flex', gap: 8 }}>
              {ISMLAR.map((nm, i) => <button key={i} className={`chip ${ismI === i ? 'chip-on' : ''}`} onClick={() => { setIsmI(i); setRan(false); }}>{nm}</button>)}
            </div>
            <div className="codebox" style={{ marginTop: 6 }}>
              <div><KW>function</KW> <FN>salomBer</FN>(ism) {'{'}</div>
              <div style={{ paddingLeft: 18 }}><KW>return</KW> <STR>"{SALOMLAR[sI]}, "</STR> + ism + <STR>"!"</STR></div>
              <div>{'}'}</div>
              <div style={{ marginTop: 8 }}><FN>salomBer</FN>(<STR>"{ISMLAR[ismI]}"</STR>)</div>
            </div>
            <button className="btn" onClick={run} disabled={running} style={{ alignSelf: 'flex-start' }}>{running ? 'Chaqirilyapti…' : '▶ Chaqirish'}</button>
          </Col>
          <Col>
            <p className="flow-label">Sizning natijangiz</p>
            <Terminal lines={out} empty="// tanlab, chaqiring" />
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Zo'r! Siz funksiyani parametr bilan chaqirdingiz va u natija qaytardi. Tanlovni o'zgartirib, yana sinab ko'ring.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — DEBUGGING (return unutilgan → undefined) =====
const Screen14 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [picked, setPicked] = useState(storedAnswer ? 'body' : null);
  const [fixed, setFixed] = useState(!!storedAnswer);
  const found = picked === 'body';
  const done = fixed;
  const click = (part) => { if (found) return; setPicked(part); };
  const fix = () => setFixed(true);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Debugging" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Yakuniy sinov →' : (found ? 'Endi tuzating' : 'Xatoni toping')} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bu funksiya <span className="italic" style={{ color: T.accent }}>undefined</span> qaytaryapti — nega?</h2></div>
        <Mentor>AI sonning kvadratini hisoblaydigan funksiya yozdi, lekin natija <b style={{ color: T.ink }}>undefined</b> (hech narsa) chiqyapti! Funksiya hisobni bajaryapti, lekin natijani <b style={{ color: T.ink }}>tashqariga bermayapti</b>. Diqqat bilan o'qing: bir narsa <b style={{ color: T.ink }}>yetishmayapti</b>. Xato qatorni toping va bosing.</Mentor>
        <div className="split">
          <Col>
            <div className="ai-card fade-up delay-1">
              <div className="ai-row"><span className="ai-badge">AI</span><span className="ai-bubble">Sonning kvadratini qaytaramiz:</span></div>
              <div className="ai-code">
                <div className="ai-line" style={{ cursor: 'default' }}>
                  <KW>function</KW>{' '}
                  <span onClick={() => click('name')} style={{ cursor: found ? 'default' : 'pointer' }}>kvadrat</span>(
                  <span onClick={() => click('param')} style={{ cursor: found ? 'default' : 'pointer' }}>n</span>) {'{'}
                </div>
                <div className="ai-line" style={{ cursor: 'default', paddingLeft: 16 }}>
                  <span className={found ? (fixed ? 'tok-ok' : 'tok-bad') : ''} onClick={() => click('body')} style={{ cursor: found ? 'default' : 'pointer' }}>{fixed ? 'return n * n' : 'n * n'}</span>
                </div>
                <div className="ai-line" style={{ cursor: 'default' }}>{'}'}</div>
                <div className="ai-line" style={{ cursor: 'default' }}><KW>let</KW> x = kvadrat(5)</div>
              </div>
              {!found && <p className="ai-prompt">Qaysi qator xato? Ustiga bosing.</p>}
              {found && !fixed && (<button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={fix}>🔧 "return" so'zini qo'shish</button>)}
              {fixed && <p className="ai-prompt" style={{ color: T.success, fontStyle: 'normal', fontWeight: 600 }}>✓ Tuzatildi — endi funksiya natijani qaytaradi!</p>}
            </div>
            {!fixed ? (
              <div className="term fade-up delay-2">
                <div className="term-bar"><span className="term-dot" style={{ background: '#FF5F56' }} /><span className="term-dot" style={{ background: '#FFBD2E' }} /><span className="term-dot" style={{ background: '#27C93F' }} /><span className="term-title">console</span></div>
                <div className="term-body"><div className="term-line"><span className="term-arrow" style={{ color: T.accent }}>›</span><span>undefined</span></div><p className="term-empty" style={{ color: T.accent }}>⚠️ funksiya hisobladi, lekin hech narsa qaytarmadi!</p></div>
              </div>
            ) : (
              <div className="term fade-step">
                <div className="term-bar"><span className="term-dot" style={{ background: '#FF5F56' }} /><span className="term-dot" style={{ background: '#FFBD2E' }} /><span className="term-dot" style={{ background: '#27C93F' }} /><span className="term-title">console</span></div>
                <div className="term-body"><div className="term-line"><span className="term-arrow">›</span><span>25</span></div><p className="term-empty" style={{ color: T.success }}>✓ endi natija (5 × 5 = 25) qaytdi</p></div>
              </div>
            )}
          </Col>
          <Col>
            {!found && (
              picked && picked !== 'body'
                ? (<div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bu qism to'g'ri. {picked === 'name' ? 'Funksiya nomi (kvadrat) — joyida.' : 'Parametr (n) — joyida.'} Xato esa <b>ichki qatorida</b> — natija qaytarilyaptimi?</p></div>)
                : (<div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Eslang: funksiya natija berishi uchun <b style={{ color: T.ink }}>return</b> kerak. Bu yerda <span className="mono">n * n</span> hisoblanyapti, lekin qaytarilyaptimi?</p></div>)
            )}
            {found && !fixed && (<div className="frame-warn fade-step"><p className="note-h" style={{ color: T.accent }}>✓ Topdingiz!</p><p className="body" style={{ margin: 0, color: T.ink }}><span className="mono">n * n</span> hisoblanadi, ammo <b>return yo'q</b> — natija tashqariga chiqmaydi, shuning uchun x = undefined. To'g'risi: <span className="mono">return n * n</span>. Chap tugmani bosing →</p></div>)}
            {fixed && (<div className="takeaway fade-step"><div className="ta-bulb">🛠️</div><p className="ta-h">Topdingiz va tuzatdingiz — bu debugging!</p><p className="ta-sub">return bo'lmasa — funksiya undefined qaytaradi</p></div>)}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 15 — YAKUNIY (funksiyani o'zi yozadi) =====
const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [value, setValue] = useState(storedAnswer?.picked || '');
  const [passed, setPassed] = useState(!!storedAnswer?.correct);
  const v = value.trim();
  const hasFn = /^function\b/.test(v);
  const hasName = /^function\s+[A-Za-z_$][\w$]*\s*\(/.test(v);
  const hasParen = /^function\s+[A-Za-z_$][\w$]*\s*\([^)]*\)/.test(v);
  const hasOpen = /\{/.test(v);
  const hasSquare = /n\s*\*\s*n/.test(v);
  const hasReturn = /\breturn\b/.test(v);
  const hasClose = /\}/.test(v);
  const valid = hasFn && hasName && hasParen && hasOpen && hasReturn && hasSquare && hasClose;
  useEffect(() => { if (valid && !passed) { setPassed(true); onAnswer(screen, { stage: 'final', screenIdx: screen, question: 'kvadrat funksiyasini yozing', studentAnswer: value, correct: true, firstAttemptCorrect: true, solved: true, picked: value }); } }, [valid]);
  return (
    <Stage eyebrow="Yakuniy · amaliy" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!passed} label={passed ? 'Davom etish' : 'Funksiyani yozing'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Oxirgi qadam: <span className="mono italic" style={{ color: T.accent }}>kvadrat</span> funksiyasini o'zingiz yozing.</h2></div>
        <Mentor>Navbat sizga! Endi <b style={{ color: T.ink }}>namuna yo'q</b> — funksiyani o'zingiz yodingizdan yozasiz. Son (<span className="mono">n</span>) oladigan <span className="mono">kvadrat</span> funksiyasini tuzing: <b style={{ color: T.ink }}>function</b>, nom va <span className="mono">(n)</span> dan boshlang, <span className="mono">{'{'}</span> qavsni oching, ichiga <span className="mono">return n * n</span> yozing va qavsni <b style={{ color: T.ink }}>{'}'}</b> bilan yoping. Har bir qism to'g'ri bo'lsa, belgisi <b style={{ color: T.success }}>yashil</b> yonadi. ✓</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">Funksiyangizni shu yerga yozing 👇</p>
            <input className="fade-up delay-1" value={value} onChange={e => setValue(e.target.value)} placeholder={'function ...'} spellCheck={false} autoCapitalize="off" autoCorrect="off" style={{ width: '100%', fontFamily: "'JetBrains Mono', monospace", fontSize: 16, padding: '14px 16px', borderRadius: 12, border: 'none', background: T.paper, color: T.ink, outline: 'none', transition: 'box-shadow 0.2s', boxShadow: valid ? `0 0 0 2px ${T.success}, 0 8px 20px -8px rgba(${T.shadowBase},0.2)` : `0 4px 14px -6px rgba(${T.shadowBase},0.16)` }} />
            <div className="fade-up delay-2" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="tagpill" style={{ opacity: hasFn ? 1 : 0.4 }}>{hasFn ? '✓' : '1'} function</span>
              <span className="tagpill" style={{ opacity: hasName ? 1 : 0.4 }}>{hasName ? '✓' : '2'} nom</span>
              <span className="tagpill" style={{ opacity: hasParen ? 1 : 0.4 }}>{hasParen ? '✓' : '3'} (n)</span>
              <span className="tagpill" style={{ opacity: hasOpen ? 1 : 0.4 }}>{hasOpen ? '✓' : '4'} {'{'}</span>
              <span className="tagpill" style={{ opacity: (hasReturn && hasSquare) ? 1 : 0.4 }}>{(hasReturn && hasSquare) ? '✓' : '5'} return n*n</span>
              <span className="tagpill" style={{ opacity: hasClose ? 1 : 0.4 }}>{hasClose ? '✓' : '6'} {'}'}</span>
            </div>
            {passed
              ? (<div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Zo'r! Bu to'g'ri funksiya — parametr oladi, kvadratini hisoblaydi va return bilan qaytaradi!</p></div>)
              : (<p className="body" style={{ margin: 0, color: T.ink3, fontSize: 13 }}>6 ta belgi yashil yonishi kerak. <span className="mono">{'{ }'}</span> qavslarni oching va yoping, ichiga <span className="mono">return n * n</span> yozing.</p>)}
          </Col>
          <Col>
            <p className="flow-label">natija</p>
            <div style={{ background: T.paper, borderRadius: 14, minHeight: 130, padding: '20px', boxShadow: `0 8px 22px -10px rgba(${T.shadowBase},0.16)`, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
              {valid
                ? <div className="fade-step"><div style={{ fontSize: 36 }}>🛠️</div><p style={{ fontFamily: "'Source Serif 4',serif", color: T.success, fontWeight: 700, margin: '8px 0 4px', fontSize: 'clamp(16px,2.4vw,20px)' }}>Funksiya tayyor!</p><p className="mono small" style={{ margin: 0, color: T.ink2 }}>kvadrat(4) → 16</p></div>
                : <p style={{ fontFamily: "'Source Serif 4',serif", color: T.ink3, fontStyle: 'italic', margin: 0 }}>Funksiyangizni to'liq yozsangiz, natija shu yerda paydo bo'ladi.</p>}
            </div>
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — YAKUN =====
const Screen16 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const RECAP = ['Funksiya — nomlangan, qayta ishlatiladigan kod bloki (mashina)', 'Funksiyani nomi bilan chaqiramiz — salomBer()', 'Parametr — funksiyaga beriladigan kirish (input)', 'return — funksiya qaytaradigan natija (output)', 'console.log ko\'rsatadi, return qaytaradi (saqlash uchun)'];
  const HOMEWORK = [{ b: 'Salomlashish', t: '— ism oladigan va "Salom, <ism>!" qaytaradigan funksiya yozing' }, { b: 'Kalkulyator', t: '— ikki son oladigan va yig\'indisini qaytaradigan qoshish(a, b) yozing' }, { b: 'Kvadrat', t: '— son oladigan funksiyani 3 xil son bilan chaqirib, natijalarni chop eting' }];
  const GLOSSARY = [{ b: 'Funksiya', t: '— qayta ishlatiladigan kod bloki' }, { b: 'function', t: '— funksiya e\'lon qilish kaliti' }, { b: 'Parametr', t: '— kirish o\'zgaruvchisi' }, { b: 'Argument', t: '— chaqiruvda beriladigan haqiqiy qiymat' }, { b: 'return', t: '— natijani qaytarish' }, { b: 'Chaqirish', t: '— funksiyani ishga tushirish (call)' }, { b: 'undefined', t: '— return bo\'lmasa qaytadigan "hech narsa"' }];
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
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">✓</span> Dars tugadi</span><h2 className="title h-title fade-up d1">Endi murakkab ishni bitta <span className="italic" style={{ color: T.accent }}>nom</span> ortiga yashira olasiz.</h2><p className="body h-sub fade-up d2">{PASSED ? 'Tabriklaymiz! Funksiya, parametr va return — hammasini egalladingiz. Bu dasturlashning eng asosiy quroli.' : 'Yaxshi harakat! Funksiyalar juda muhim — bir-ikki ekranni qayta ko\'rib mustahkamlang.'}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span className="tick" style={{ width: 16, height: 16, borderRadius: '50%', background: T.success, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck">✓</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>📝 Uyga vazifa</div><p className="body" style={{ margin: '0 0 10px', color: T.ink }}>Funksiyalar bilan mashq qiling:</p><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">Funksiya — kodni tartibli va qayta ishlatiladigan qiladi. Mashq qilsangiz, qo'lingizga o'tirib qoladi! 🚀</p></div>
        </div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">💡 Kalit so'zlar (funksiya)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT
export default function JsFunctionsLesson({ lang: langProp, onFinished }) {
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
        .mentor-ava svg { display: block; }
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

        /* === IWATCH (qiymat) === */
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
        .arr-cell.on { box-shadow: inset 0 0 0 2px ${T.accent}, 0 8px 20px -6px rgba(255,79,40,0.25); }
        .arr-cell.scan { box-shadow: inset 0 0 0 2px ${T.accent}, 0 8px 22px -6px rgba(255,79,40,0.4); background: ${T.accentSoft}; transform: translateY(-3px) scale(1.04); }
        .arr-emoji { font-size: 26px; }
        .arr-name { font-weight: 600; font-size: 12.5px; color: ${T.ink}; }
        .arr-idx { font-family: 'JetBrains Mono'; font-size: 11px; font-weight: 700; color: ${T.accent}; }

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
      `}</style>
      <div className="lesson-root">
        <Current screen={screen} storedAnswer={answers[screen]} answers={answers} onAnswer={recordAnswer} onNext={next} onPrev={prev} onReset={reset} onFinish={finishLesson} />
      </div>
    </LangContext.Provider>
  );
}
