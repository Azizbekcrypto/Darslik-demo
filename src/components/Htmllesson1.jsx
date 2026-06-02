import React, { useState, useEffect, useRef } from 'react';

// HTML 1-DARS (v2) · HTML asoslari · 17 ekran · 12–17 yosh · siz murojaati
// v2 yangiliklari (UX):
//   - Skrolsiz: har ekran viewportga sig'adi (2-ustunli split, ixcham sarlavha/oraliq)
//   - Kengroq + responsive konteyner (~1060px), mobilda 1 ustunga tushadi
//   - "Qiziqarli ma'lumot" — optional, bosib ochiladigan (joy egallamaydi)
//   - Muammo → Yechim ramkasi (standart ta'rif emas, qiziqarli)
// Mantiq va platforma kontrakti (onFinished, SCREEN_META, baholash) o'zgarmagan.

const T = {
  bg: '#F6F4EF', ink: '#16243B', ink2: '#5A5A60', ink3: '#A7A6A2',
  paper: '#FFFFFF', accent: '#E8502E', accentSoft: '#FFE8E1', accentVivid: '#FF4F28',
  success: '#1F7A4D', successSoft: '#E3F0E8'
};
const CODE = {
  bg: '#1A2436', text: '#E8E5DD', tag: '#FF7755',
  attr: '#FFD380', str: '#7DD181', comment: '#6B7585', punct: '#9FB4D8'
};
const TOTAL_SCREENS = 17;

const LESSON_META = { lessonId: 'html-01-v2', lessonTitle: 'HTML asoslari' };
const SCREEN_META = [
  { id: 's0',  type: 'hook',           template: 'choice',  scored: false, scope: 'hook' },
  { id: 's1',  type: 'plan',           template: 'custom',  scored: false, scope: null },
  { id: 's2',  type: 'theory',         template: 'custom',  scored: false, scope: null },
  { id: 's3',  type: 'live-explore',   template: 'custom',  scored: false, scope: null },
  { id: 's4',  type: 'test',           template: 'choice',  scored: true,  scope: 'practice' },
  { id: 's5',  type: 'code-anatomy',   template: 'custom',  scored: false, scope: null },
  { id: 's6',  type: 'code-anatomy',   template: 'custom',  scored: false, scope: null },
  { id: 's7',  type: 'test',           template: 'choice',  scored: true,  scope: 'practice' },
  { id: 's8',  type: 'slider-explore', template: 'custom',  scored: false, scope: null },
  { id: 's9',  type: 'toggle-explore', template: 'custom',  scored: false, scope: null },
  { id: 's10', type: 'toggle-explore', template: 'custom',  scored: false, scope: null },
  { id: 's11', type: 'test',           template: 'choice',  scored: true,  scope: 'practice' },
  { id: 's12', type: 'toggle-explore', template: 'custom',  scored: false, scope: null },
  { id: 's13', type: 'note',           template: 'custom',  scored: false, scope: null },
  { id: 's14', type: 'builder',        template: 'custom',  scored: false, scope: null },
  { id: 's15', type: 'test',           template: 'choice',  scored: true,  scope: 'final' },
  { id: 's16', type: 'summary',        template: 'summary', scored: false, scope: null }
];
const SCORED_IDX = SCREEN_META.map((m, i) => (m.scored ? i : null)).filter(i => i !== null);

const TOPICS = [
  'Dasturlash va kod nima?',
  'HTML — veb tili',
  'Sahifa skeleti va teglar',
  'Sarlavhalar (h1–h6)',
  'Paragraf va matn (p, strong, em)',
  "Ro'yxatlar (ul, ol, li)",
  'Havolalar (a href)'
];

// --- Code & preview primitives ---
const CodeBox = ({ children }) => <pre className="code-box">{children}</pre>;
const Tg = ({ children }) => <span style={{ color: CODE.tag }}>{children}</span>;
const At = ({ children }) => <span style={{ color: CODE.attr }}>{children}</span>;
const Sr = ({ children }) => <span style={{ color: CODE.str }}>{children}</span>;
const Cm = ({ children }) => <span style={{ color: CODE.comment, fontStyle: 'italic' }}>{children}</span>;
const Pn = ({ children }) => <span style={{ color: CODE.punct }}>{children}</span>;

const Preview = ({ children, title = 'preview.html', minH }) => (
  <div className="bp-window">
    <div className="bp-bar">
      <span className="bb-dots"><i /><i /><i /></span>
      <span className="bp-title">{title}</span>
    </div>
    <div className="bp-body" style={{ minHeight: minH }}>{children}</div>
  </div>
);

const UL_STYLE = { margin: 0, paddingLeft: 24, listStyleType: 'disc', listStylePosition: 'outside', fontFamily: 'Georgia, serif', color: T.ink };
const OL_STYLE = { margin: 0, paddingLeft: 24, listStyleType: 'decimal', listStylePosition: 'outside', fontFamily: 'Georgia, serif', color: T.ink };

// --- Layout helpers (v2) ---
// Split: desktop'da 2 ustun, mobilda 1 ustun (skrolni yo'qotadi)
const Split = ({ children }) => <div className="split">{children}</div>;
const Col = ({ children, gap }) => (
  <div className="col" style={gap ? { gap } : undefined}>{children}</div>
);

// Muammo → Yechim ramkasi (standart ta'rif o'rniga)
const Problem = ({ q, a }) => (
  <div className="ps fade-up delay-1">
    <p className="ps-line">
      <span className="ps-badge ps-q">Muammo</span>
      <span className="ps-text">{q}</span>
    </p>
    {a && (
      <p className="ps-line">
        <span className="ps-badge ps-a">Yechim</span>
        <span className="ps-text">{a}</span>
      </p>
    )}
  </div>
);

// Interaktiv Muammo → Yechim.
//  variant="think"  → o'ylayotgan stiker (🤔 qimirlaydi, ❓ suzadi); yashil "Yechim" bosilsa stiker xursand (🤩) + 💡 idea chiqadi.
//  variant="tap"    → stikersiz, oddiy interaktiv ochilish (tugma bosilsa yechim chiqadi).
const ProblemReveal = ({ q, a, variant = 'tap', face = '🤔', faceHappy = '🤩' }) => {
  const [solved, setSolved] = useState(false);
  return (
    <div className="pr fade-up delay-1">
      <p className="ps-line" style={{ margin: 0 }}>
        <span className="ps-badge ps-q">Muammo</span>
        <span className="ps-text">{q}</span>
      </p>
      {variant === 'think' && (
        <div className="char-stage">
          <div className={`char ${solved ? 'happy' : 'think'}`}>
            <span className="char-face">{solved ? faceHappy : face}</span>
            <span className="char-badge char-q">❓</span>
            <span className="char-badge char-bulb">💡</span>
          </div>
        </div>
      )}
      {!solved ? (
        <button className="solve-btn" onClick={() => setSolved(true)}>
          💡 Yechimni ko'rsat
        </button>
      ) : (
        <p className="ps-line pr-answer fade-step" style={{ margin: 0 }}>
          <span className="ps-badge ps-a">Yechim</span>
          <span className="ps-text">{a}</span>
        </p>
      )}
    </div>
  );
};

// Optional, bosib ochiladigan "Qiziqarli ma'lumot" — joy egallamaydi
const FactToggle = ({ children, label = 'Qiziqarli ma\u2019lumot', delay = '' }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className={`factt fade-up ${delay} ${open ? 'open' : ''}`}>
      <button className="factt-btn" onClick={() => setOpen(o => !o)} aria-expanded={open}>
        <span>💡 {label}</span>
        <span className="factt-sign">{open ? '–' : '+'}</span>
      </button>
      {open && <p className="factt-body">{children}</p>}
    </div>
  );
};

const GoodNote = ({ label, children }) => (
  <div className="frame-success fade-step" style={{ marginTop: 2 }}>
    {label && (
      <p className="small mono" style={{ margin: '0 0 4px', fontWeight: 600, color: T.success, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        ✓ {label}
      </p>
    )}
    <p className="body" style={{ margin: 0, color: T.ink }}>{children}</p>
  </div>
);

// --- Stage + nav (ixcham chrome) ---
const Stage = ({ children, eyebrow, screen, navContent, narrow }) => (
  <div className="stage">
    <div className={`stage-content ${narrow ? 'narrow' : ''}`}>
      <div className="progress-track">
        <div className="progress-bar" style={{ width: `${((screen + 1) / TOTAL_SCREENS) * 100}%` }} />
      </div>
      <div className="chrome">
        <div className="chrome-left eyebrow">
          <span className="dot" /><span>{eyebrow}</span>
        </div>
        <div className="mono small" style={{ color: T.ink3 }}>
          {String(screen + 1).padStart(2, '0')} / {String(TOTAL_SCREENS).padStart(2, '0')}
        </div>
      </div>
      {children}
    </div>
    {navContent && <div className="stage-nav">{navContent}</div>}
  </div>
);

const NavBack = ({ onPrev }) => (
  <button className="btn btn-ghost" onClick={onPrev}
    style={{ padding: 'clamp(11px,1.6vw,13px) clamp(16px,2.2vw,22px)', fontSize: 'clamp(14px,1.6vw,15px)' }}>
    Orqaga
  </button>
);

const NavNext = ({ disabled, label = 'Davom etish', onClick }) => (
  <button className="btn" disabled={disabled} onClick={onClick}
    style={{ padding: 'clamp(11px,1.6vw,13px) clamp(22px,2.6vw,30px)', fontSize: 'clamp(14px,1.6vw,15px)', marginLeft: 'auto' }}>
    {label}
  </button>
);

const FeedbackBlock = ({ show, isCorrect, children }) => {
  const [mounted, setMounted] = useState(show);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (show) {
      setMounted(true);
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    } else {
      setVisible(false);
      const t = setTimeout(() => setMounted(false), 400);
      return () => clearTimeout(t);
    }
  }, [show]);
  if (!mounted) return null;
  return (
    <div className={`feedback-block ${visible ? 'visible' : ''}`}>
      <div className={isCorrect ? 'frame-success' : 'frame-soft'}>{children}</div>
    </div>
  );
};

// Универсальный MCQ — компактен, центрирован (narrow)
const QuestionScreen = ({ screen, idx, scope, eyebrow, question, questionText, options, correctIdx, explainCorrect, explainWrong, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const [revealed, setRevealed] = useState(storedAnswer !== undefined);
  const pick = (i) => {
    if (revealed) return;
    setPicked(i); setRevealed(true);
    onAnswer(idx, {
      stage: scope, screenIdx: idx, picked: i, question: questionText, options,
      correctIndex: correctIdx, correctAnswer: options[correctIdx],
      studentAnswerIndex: i, studentAnswer: options[i], correct: i === correctIdx
    });
  };
  return (
    <Stage eyebrow={eyebrow} screen={screen} narrow navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!revealed} onClick={onNext} /></>}>
      <div className="screen" style={{ justifyContent: 'center', gap: 'clamp(16px,2.5vw,24px)' }}>
        <div className="fade-up">{question}</div>
        <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {options.map((opt, i) => {
            let cls = 'option';
            if (revealed) {
              if (i === correctIdx) cls += ' option-correct';
              else if (i === picked) cls += ' option-picked-wrong';
              else cls += ' option-wrong';
            }
            return (
              <button key={i} className={cls} disabled={revealed} onClick={() => pick(i)}
                style={{ padding: 'clamp(12px,1.8vw,16px) clamp(14px,2.2vw,20px)', fontSize: 'clamp(14px,1.7vw,16px)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="mono small" style={{ minWidth: 20, color: revealed && i === correctIdx ? T.success : T.ink3 }}>
                  {String.fromCharCode(65 + i)}
                </span>
                <span style={{ flex: 1 }}>{opt}</span>
              </button>
            );
          })}
        </div>
        <FeedbackBlock show={revealed} isCorrect={picked === correctIdx}>
          <p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: picked === correctIdx ? T.success : T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {picked === correctIdx ? 'To\u2019g\u2019ri' : 'Unchalik emas'}
          </p>
          <p className="body" style={{ margin: 0 }}>
            {picked === correctIdx ? explainCorrect : (explainWrong[picked] || explainWrong.default)}
          </p>
        </FeedbackBlock>
      </div>
    </Stage>
  );
};

const ProblemRevealA = ({ q, a }) => {
  const [phase, setPhase] = useState('problem'); // problem | leaving | solved
  const reveal = () => {
    setPhase('leaving');
    setTimeout(() => setPhase('solved'), 360);
  };
  return (
    <div className="pr fade-up delay-1">
      {phase !== 'solved' ? (
        <div className={`mu-block ${phase === 'leaving' ? 'leave' : ''}`}>
          <p className="ps-line" style={{ margin: 0 }}>
            <span className="ps-badge ps-q">Muammo</span>
            <span className="ps-text">{q}</span>
          </p>
          <button className="solve-btn" onClick={reveal} disabled={phase === 'leaving'}>💡 Yechimni ko'rsat</button>
        </div>
      ) : (
        <div className="ye-solved">
          <p className="ps-line mu-mini">
            <span className="ps-badge ps-q">Muammo</span>
            <span className="ps-text">{q}</span>
          </p>
          <div className="idea">
            <div className="happy">🤩</div>
            <span className="idea-bulb">💡</span>
          </div>
          <p className="ps-line pr-answer">
            <span className="ps-badge ps-a">Yechim</span>
            <span className="ps-text">{a}</span>
          </p>
        </div>
      )}
    </div>
  );
};
const ProblemRevealB = ({ q, a }) => {
  const [phase, setPhase] = useState('problem');
  const reveal = () => { setPhase('leaving'); setTimeout(() => setPhase('solved'), 300); };
  return (
    <div className="pr fade-up delay-1">
      {phase !== 'solved' ? (
        <div className={`mu-block ${phase === 'leaving' ? 'leave' : ''}`}>
          <p className="ps-line" style={{ margin: 0 }}>
            <span className="ps-badge ps-q">Muammo</span>
            <span className="ps-text">{q}</span>
          </p>
          <button className="solve-btn" onClick={reveal} disabled={phase === 'leaving'}>💡 Yechimni ko'rsat</button>
        </div>
      ) : (
        <div className="ye-stack">
          <p className="ps-line mu-mini">
            <span className="ps-badge ps-q">Muammo</span>
            <span className="ps-text">{q}</span>
          </p>
          <p className="ps-line pr-answer">
            <span className="ps-badge ps-a">Yechim</span>
            <span className="ps-text">{a}</span>
          </p>
        </div>
      )}
    </div>
  );
};
function ScoreRing({ correct, total }) {
  const PCT = total ? correct / total : 0;
  const PASSED = PCT >= 0.6;
  const R = 50, ST = 9, C = 2 * Math.PI * R;
  const col = PASSED ? T.success : T.accent;
  const [off, setOff] = useState(C);
  useEffect(() => { const t = setTimeout(() => setOff(C * (1 - PCT)), 200); return () => clearTimeout(t); }, [C]);
  return (
    <div className="ring-wrap">
      <svg width="128" height="128" viewBox="0 0 128 128">
        <circle cx="64" cy="64" r={R} fill="none" stroke={T.ink3 + '40'} strokeWidth={ST} />
        <circle cx="64" cy="64" r={R} fill="none" stroke={col} strokeWidth={ST} strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={off} transform="rotate(-90 64 64)"
          style={{ transition: 'stroke-dashoffset 1s cubic-bezier(.4,0,.2,1)' }} />
      </svg>
      <div className="ring-center">
        <div className="ring-num"><span style={{ color: col }}>{correct}</span><span className="ring-den">/{total}</span></div>
        <div className="ring-lbl">to'g'ri javob</div>
      </div>
    </div>
  );
}

// SCREEN 0 — (saqlangan)
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const [view, setView] = useState('site');
  const pick = (v) => {
    setPicked(v); onAnswer(0, { picked: v });
    setTimeout(onNext, 350);
  };
  return (
    <Stage eyebrow="Kirish" screen={screen}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 760 }}>
          Bu sayt nimadan <span className="italic" style={{ color: T.accent }}>yasalgan</span>?
        </h1>
        <Split>
          <Col>
            <p className="body" style={{ color: T.ink2, margin: 0 }}>
              eMaktab, YouTube, Telegram — har kuni ochadigan saytlaringiz. Hammasi bir narsadan yasalgan: <b style={{ color: T.ink }}>ya'ni Koddan</b>.
              {/* Mana shunday maktab portali ham. «Kod» tugmasini bosing — ichida nima borligini ko'ring 👇 */}
            </p>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${view === 'site' ? 'chip-on' : ''}`} onClick={() => setView('site')}>🌐 Sayt</button>
              <button className={`chip ${view === 'code' ? 'chip-on' : ''}`} onClick={() => setView('code')}>{'</>'} Kod</button>
            </div>
            <div className="demo-swap" key={view}>
              {view === 'site' ? (
                <Preview minH={170} title="maktab.uz">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: `1px solid ${T.ink3}40`, marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 22, height: 22, borderRadius: 6, background: T.accent, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: 13 }}>M</span>
                      <b style={{ fontFamily: "'Manrope', sans-serif", color: T.ink, fontSize: 15 }}>Maktab</b>
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 11, fontFamily: "'Manrope', sans-serif", fontSize: 12, color: T.ink2 }}>
                      <span>Asosiy</span><span>Darslar</span>
                      <span style={{ background: T.ink, color: T.bg, padding: '5px 11px', borderRadius: 6, fontWeight: 600 }}>Kirish</span>
                    </span>
                  </div>
                  <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(20px,3.2vw,28px)', margin: '0 0 6px', color: T.ink }}>Xush kelibsiz! 👋</h1>
                  <p style={{ fontFamily: 'Georgia, serif', margin: '0 0 12px', color: T.ink2, fontSize: 'clamp(13px,1.8vw,15px)' }}>Bilim — bir bosishda.</p>
                  <span style={{ display: 'inline-block', fontFamily: "'Manrope', sans-serif", fontWeight: 700, background: T.accent, color: '#fff', padding: '8px 16px', borderRadius: 8, fontSize: 'clamp(12px,1.7vw,14px)' }}>Boshlash</span>
                </Preview>
              ) : (
                <>
                  <CodeBox>
                    <Tg>{'<header>'}</Tg>Maktab · Asosiy · Darslar · Kirish<Tg>{'</header>'}</Tg>{'\n'}
                    <Tg>{'<h1>'}</Tg>Xush kelibsiz! 👋<Tg>{'</h1>'}</Tg>{'\n'}
                    <Tg>{'<p>'}</Tg>Bilim — bir bosishda.<Tg>{'</p>'}</Tg>{'\n'}
                    <Tg>{'<button>'}</Tg>Boshlash<Tg>{'</button>'}</Tg>
                  </CodeBox>
                  <p className="mono small" style={{ color: T.ink3, marginTop: 6, textAlign: 'center' }}>↑ shu saytning kodi — boshqa hech narsa emas!</p>
                </>
              )}
            </div>
          </Col>
          <Col>
            <p className="h-sub title fade-up delay-2" style={{ margin: 0 }}>
              Sizningcha, sayt yaratish uchun qaysi til ishlatiladi?
            </p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {[
                { id: 'a', label: 'Oddiy inglizcha matn' },
                { id: 'b', label: 'HTML — maxsus belgili til' },
                { id: 'c', label: 'Photoshop kabi dastur' },
                { id: 'd', label: 'Bilmayman, bilib olishni xohlayman' }
              ].map(o => (
                <button key={o.id} className="option" disabled={picked !== null} onClick={() => pick(o.id)}
                  style={{
                    padding: 'clamp(12px,1.8vw,16px) clamp(14px,2.2vw,20px)', fontSize: 'clamp(14px,1.7vw,16px)',
                    background: picked === o.id ? T.ink : T.paper, color: picked === o.id ? T.bg : T.ink
                  }}>
                  {o.label}
                </button>
              ))}
            </div>
          </Col>
        </Split>
      </div>
    </Stage>
  );
};

// ============================================================
// SCREEN 1 — REJA (qayta dizayn)
// ============================================================
const Screen1 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  // Harakatli qadamlar — o'quvchi "men yasayman" deb his qilsin (emojisiz)
  const STEPS = [
    { text: 'Kod nima? — tushunamiz', tag: '' },
    { text: 'HTML bilan tanishamiz', tag: '' },
    { text: 'Sahifa skeletini quramiz', tag: '' },
    { text: "Sarlavha qo'shamiz", tag: 'h1–h6' },
    { text: 'Matn bezaymiz', tag: 'p, strong, em' },
    { text: "Ro'yxat yasaymiz", tag: 'ul, ol, li' },
    { text: 'Havola ulaymiz', tag: 'a href' }
  ];
  return (
    <Stage eyebrow="Reja" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext label="Boshlaymiz →" onClick={onNext} /></>}>
      <div className="screen">

            <div className="head">
              <h2 className="title h-title fade-up">
                <span className="italic" style={{ color: T.accent }}>Bugun web-sayt yaratamiz!</span>
              </h2>
              <p className="body fade-up delay-1" style={{ color: T.ink2, margin: 0 }}>
                Ha, rostdan — dars oxirida <b style={{ color: T.ink }}>o'zingizning birinchi saytingiz</b> tayyor bo'ladi.
                Manzilga 7 ta qadamda yetamiz 👇
              </p>
            </div>

            <ol className="roadmap">
              {STEPS.map((s, i) => (
                <li key={i} className="step-card fade-up" style={{ animationDelay: `${0.14 + i * 0.07}s` }}>
                  <span className="step-num">{String(i + 1).padStart(2, '0')}</span>
                  <span className="step-body">
                    <span className="step-text">{s.text}</span>
                    {s.tag && <span className="step-tag">{s.tag}</span>}
                  </span>
                </li>
              ))}
            </ol>

            <div className="dest fade-up" style={{ animationDelay: '0.7s' }}>
              <span className="dest-emoji">🎉</span>
              <span>
                <p className="dest-title">O'zingizning birinchi saytingiz</p>
                <p className="dest-sub">Hammasini birlashtirib, o'z sahifangizni qo'lingiz bilan yasaysiz.</p>
              </span>
            </div>
      </div>
    </Stage>
  );
};
// ============================================================
// SCREEN 2 — DASTURLASH (qayta dizayn)
// ============================================================
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const RECIPE = ['Xamirni yoying', 'Sous surting', 'Pishloq seping', "Topping qo'shing", 'Pechda pishiring'];

  // Muammo → (animatsiya) → Yechim. O'ylash emojisi yo'q; yechimda 🤩 + 💡 idea.
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const run = () => {
    clearTimeout(timer.current);
    setStep(0);
    const tick = (i) => {
      setStep(i);
      if (i < RECIPE.length) timer.current = setTimeout(() => tick(i + 1), 550);
      else setDone(true);
    };
    tick(1);
  };
  useEffect(() => { if ((done) && storedAnswer === undefined) onAnswer(2, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Nazariya" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!(done)} label={(done) ? "Davom etish" : "Avval bajaring"} onClick={onNext} /></>}>
      <div className="screen">

            <div className="head">
              <h2 className="title h-title fade-up">Dasturlash <span className="italic" style={{ color: T.accent }}>nima</span>?</h2>
            </div>
            <div className="split">
              <div className="col">
                <ProblemRevealA
                  q="Kompyuter juda tez, lekin o'zi hech narsa qila olmaydi. Unga har bir ishni aniq aytib berish kerak. Qanday qilib?"
                  a={<>Kompyuterga aniq ko'rsatmalar yozamiz — bu <b style={{ color: T.success }}>kod</b>. Kod yozish jarayoni esa <b style={{ color: T.success }}>dasturlash</b> deyiladi. Xuddi retsept kabi: qadamba-qadam.</>} />
              </div>
              <div className="col">
                <div className="frame">
                  <p className="eyebrow" style={{ color: T.ink2, margin: '0 0 10px' }}>Pitsa retsepti</p>
                  <ol className="recipe-list">
                    {RECIPE.map((r, i) => {
                      const active = step > i;
                      return (
                        <li key={i} className={active ? 'on' : ''}>
                          <span className="recipe-num">{active ? '✓' : i + 1}</span>
                          <span className="recipe-text">{r}</span>
                        </li>
                      );
                    })}
                  </ol>
                  <button className="btn" onClick={run} style={{ marginTop: 14, padding: 'clamp(10px,1.6vw,13px) clamp(18px,2.6vw,24px)', fontSize: 'clamp(13px,1.6vw,15px)' }}>
                    {step >= RECIPE.length ? '↻ Yana bajaring' : '▶ Retseptni bajarish'}
                  </button>
                </div>
                {done && (
                  <div className="frame-success fade-step">
                    <p className="small mono" style={{ margin: '0 0 4px', fontWeight: 600, color: T.success, textTransform: 'uppercase', letterSpacing: '0.08em' }}>✓ Mana shu — dasturlash</p>
                    <p className="body" style={{ margin: 0, color: T.ink }}>
                      Dasturlashda kodlarimiz ham xuddi retsept kabi — qadamma-qadam yoziladi. Kompyuter ularni tartib bilan bajarib, saytni yaratadi.
                    </p>
                  </div>
                )}
              </div>
            </div>
      </div>
    </Stage>
  );
};
// ============================================================
// SCREEN 3 — HTML (qayta dizayn)
// ============================================================
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const FlowArrow = ({ delay = 0 }) => (
    <div className="flow-arrow">
      <span className="flow-track"><span className="flow-bead" style={{ animationDelay: `${delay}s` }} /></span>
      <span className="flow-chevron" style={{ animationDelay: `${delay}s` }}>▼</span>
    </div>
  );

  // Muammo → Yechim: emojisiz, Muammo animatsiyalanadi (kichrayib qoladi), Yechim ko'tariladi
  const [name, setName] = useState('Aziz');
  return (
    <Stage eyebrow="HTML" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext label="Davom etish" onClick={onNext} /></>}>
      <div className="screen">

            <div className="head">
              <h2 className="title h-title fade-up">Har sayt ortida — bitta <span className="italic" style={{ color: T.accent }}>til</span>.</h2>
            </div>
            <div className="split">
              <div className="col">
                <ProblemRevealB
                  q="Kod yozamiz dedik. Lekin brauzer aynan qaysi tilni o'qiydi — sahifani nimadan yasaydi?"
                  a={<>Brauzer <b style={{ color: T.success }}>HTML</b> tilini o'qiydi. HTML — veb-sahifalar tili: sarlavha, matn, rasm, havola — hammasi shu tilda yoziladi. Bir marta o'rgansangiz, istalgan sahifani o'zingiz yasaysiz.</>} />
                <div className="fade-up delay-1">
                  <p className="eyebrow" style={{ color: T.ink2, margin: '0 0 8px' }}>Ismingizni yozing — kod va sahifa o'zgaradi</p>
                  <input className="text-input" value={name} onChange={e => setName(e.target.value)} maxLength={18} placeholder="Ismingiz" />
                </div>
              </div>

              <div className="col">
                <div className="flow-label">HTML kod</div>
                <pre className="code-box">
                  <Tg>{'<h1>'}</Tg>{name || '...'}<Tg>{'</h1>'}</Tg>{'\n'}
                  <Tg>{'<p>'}</Tg>HTML o'rganyapman<Tg>{'</p>'}</Tg>{'\n'}
                  <Tg>{'<button>'}</Tg>Obuna bo'lish<Tg>{'</button>'}</Tg>
                </pre>
                <FlowArrow delay={0} />
                <div className="brauzer-step" key={`b-${name}`}>
                  <span className="brauzer-icon">🌐</span>
                  <div>
                    <p className="brauzer-h">Brauzer o'qiydi</p>
                    <p className="brauzer-sub">kod → sahifa</p>
                  </div>
                </div>
                <FlowArrow delay={0.4} />
                <div className="flow-label">Sahifa</div>
                <Preview title="profil.html" minH={150}>
                  <div className="profile-card" key={`p-${name}`}>
                    <div className="pf-ava">{(name || '?').trim().charAt(0).toUpperCase() || '?'}</div>
                    <h1 className="pf-name">{name || '...'}</h1>
                    <p className="pf-bio">HTML o'rganyapman</p>
                    <button className="pf-btn">Obuna bo'lish</button>
                  </div>
                </Preview>
              </div>
            </div>
      </div>
    </Stage>
  );
};
// SCREEN 4 — (saqlangan)
const Screen4 = (props) => (
  <QuestionScreen {...props} idx={4} scope="practice" eyebrow="Mashq · 1-savol"
    questionText="HTML kodini o'qib, sahifani ekranda ko'rsatadigan dastur qaysi?"
    question={
      <>
        <p className="eyebrow" style={{ color: T.accent }}>Kim nima qiladi?</p>
        <h2 className="title h-sub" style={{ marginTop: 8 }}>HTML kodini o'qib, sahifani ekranda ko'rsatadigan dastur qaysi?</h2>
      </>
    }
    options={['Brauzer', 'Server', 'Photoshop', 'Klaviatura']} correctIdx={0}
    explainCorrect="To'g'ri. Brauzer (Chrome, Safari, Firefox, Edge) HTML kodini o'qib, sahifa qilib ekraningizda ko'rsatadi."
    explainWrong={{
      1: 'Server faqat HTML faylni saqlaydi va jo\u2019natadi. Uni o\u2019qib sahifaga aylantirish — brauzerning ishi.',
      2: 'Photoshop — bu rasm muharriri, HTML\u2019ga aloqasi yo\u2019q.',
      3: 'Klaviatura — bu siz yozadigan qurilma. HTML\u2019ni o\u2019qib ko\u2019rsatadigan — brauzer.',
      default: 'HTML kodini o\u2019qib, sahifa qilib ko\u2019rsatadigan — brauzer.'
    }} />
);

// ============================================================
// SCREEN 5 — SKELET (qayta dizayn)
// ============================================================
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const PARTS = {
    doctype: { tag: '<!DOCTYPE html>', word: "E'lon", role: 'Eng boshida turadi va "bu HTML5 sahifa" deb bildiradi.' },
    html: { tag: '<html>', word: 'Butun hujjat', role: 'Butun sahifani o\u2019rab turadi — head ham, body ham shuning ichida.' },
    head: { tag: '<head>', word: 'Bosh — sozlamalar', role: 'Sahifaning "boshi": title (nom) va sozlamalar. title brauzer tabchasida ko\u2019rinadi, lekin sahifa ichida ko\u2019rinmaydi.' },
    body: { tag: '<body>', word: 'Tana — kontent', role: 'Sahifaning "tanasi": ko\u2019rinadigan hamma narsa — sarlavha, matn, rasm, havola shu yerda.' }
  };
  const [active, setActive] = useState(null);
  const [clicked, setClicked] = useState(new Set());
  const done = clicked.size === 4;
  const tap = (k) => {
    setActive(k);
    setClicked(prev => { const n = new Set(prev); n.add(k); return n; });
  };
  const fc = (k, base) => `${base} ${active === k ? 'active' : ''} ${clicked.has(k) ? 'seen' : ''}`;
  const ck = (k) => `ck ${active === k ? 'active' : ''} ${clicked.has(k) ? 'seen' : ''}`;
  useEffect(() => { if ((done) && storedAnswer === undefined) onAnswer(5, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Struktura" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!(done)} label={(done) ? "Davom etish" : `${clicked.size}/4 qismi ko'rilgan`} onClick={onNext} /></>}>
      <div className="screen">

            <div className="head">
              <h2 className="title h-title fade-up">HTML sahifaning <span className="italic" style={{ color: T.accent }}>skeleti</span>.</h2>
              <p className="body lead fade-up delay-1" style={{ color: T.ink2 }}>
                Har HTML sahifa ikki qismdan iborat: <b style={{ color: T.ink }}>head</b> (brauzer tabchasidagi nom va sozlamalar — ko'rinmaydi) va <b style={{ color: T.ink }}>body</b> (ko'rinadigan kontent). Brauzer yoki kodni bosib, har qismni biling.
              </p>
            </div>

            <div className="split">
              {/* CHAP: figura */}
              <div className="col">
                <div className="bskel fade-up delay-2">
                  <div className={fc('doctype', 'bskel-doctype')} onClick={() => tap('doctype')}>&lt;!DOCTYPE html&gt;</div>
                  <div className={fc('html', 'bskel-html')} onClick={() => tap('html')}>
                    <span className="bskel-htmllabel">&lt;html&gt; — butun hujjat</span>
                    <div className="bskel-win" onClick={(e) => e.stopPropagation()}>
                      <div className={fc('head', 'bskel-tab')} onClick={() => tap('head')}>
                        <span className="bskel-dots"><i /><i /><i /></span>
                        <span className="bskel-tabpill">Mening sahifam</span>
                        <span className="bskel-zone">&lt;head&gt;</span>
                      </div>
                      <div className={fc('body', 'bskel-page')} onClick={() => tap('body')}>
                        <p className="bskel-ptitle">Salom! 👋</p>
                        <p className="bskel-ptext">Bu mening sahifam.</p>
                        <span className="bskel-zone bskel-zone-b">&lt;body&gt;</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* O'NG: asl kod + tushuntirish */}
              <div className="col">
                <div className="flow-label">HTML kodi</div>
                <pre className="code-box fade-up delay-2">
                  <span className={ck('doctype')} onClick={() => tap('doctype')}><span className="t-tag">&lt;!DOCTYPE html&gt;</span></span>{'\n'}
                  <span className={ck('html')} onClick={() => tap('html')}><span className="t-tag">&lt;html&gt;</span></span>{'\n'}
                  {'  '}<span className={ck('head')} onClick={() => tap('head')}><span className="t-tag">&lt;head&gt;</span></span>{'\n'}
                  {'    '}<span className="t-title">&lt;title&gt;Mening sahifam&lt;/title&gt;</span>{'\n'}
                  {'  '}<span className={ck('head')} onClick={() => tap('head')}><span className="t-tag">&lt;/head&gt;</span></span>{'\n'}
                  {'  '}<span className={ck('body')} onClick={() => tap('body')}><span className="t-tag">&lt;body&gt;</span></span>{'\n'}
                  {'    '}<span className="t-cm">&lt;!-- kontent shu yerga --&gt;</span>{'\n'}
                  {'  '}<span className={ck('body')} onClick={() => tap('body')}><span className="t-tag">&lt;/body&gt;</span></span>{'\n'}
                  <span className={ck('html')} onClick={() => tap('html')}><span className="t-tag">&lt;/html&gt;</span></span>
                </pre>

                {active ? (
                  <div className="sk-info fade-step" key={active}>
                    <span className="sk-tagbig">
                      <span className="sk-chip">{PARTS[active].tag}</span>
                      <span className="sk-wordbadge">{PARTS[active].word}</span>
                    </span>
                    <p className="body" style={{ color: T.ink, margin: '11px 0 0' }}>{PARTS[active].role}</p>
                  </div>
                ) : (
                  <div className="frame-dash">
                    <p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>
                      Figura yoki koddan bir qismni bosing
                    </p>
                  </div>
                )}
                {done && (
                  <div className="frame-success fade-step">
                    <p className="small mono" style={{ margin: '0 0 4px', fontWeight: 600, color: T.success, textTransform: 'uppercase', letterSpacing: '0.08em' }}>✓ Skeletni o'rgandingiz</p>
                    <p className="body" style={{ margin: 0, color: T.ink }}>
                      Har sahifa shu tartibda: <b>DOCTYPE → html → bosh (head) + tana (body)</b>.
                    </p>
                  </div>
                )}
              </div>
            </div>
      </div>
    </Stage>
  );
};
// ============================================================
// SCREEN 6 — TEG (qayta dizayn)
// ============================================================
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const PARTS = {
    open: { role: 'Ochiluvchi teg — element shu yerdan boshlanadi.' },
    content: { role: 'Kontent — ekranda ko\u2019rinadigan matn.' },
    close: { role: 'Yopiluvchi teg — / bilan yoziladi, element shu yerda tugaydi.' }
  };
  const [wrapped, setWrapped] = useState(false);
  const [active, setActive] = useState(null);
  const done = wrapped;
  const ic = (k) => `hug-item hug-${k === 'content' ? 'content' : 'tag'} ${active === k ? 'active' : ''}`;
  useEffect(() => { if ((done) && storedAnswer === undefined) onAnswer(6, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Teg" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!(done)} label={(done) ? "Davom etish" : "Avval teglar bilan o'rang"} onClick={onNext} /></>}>
      <div className="screen">

            <div className="head">
              <h2 className="title h-title fade-up">Teg kontentni <span className="italic" style={{ color: T.accent }}>o'raydi</span>.</h2>
              <p className="body lead fade-up delay-1" style={{ color: T.ink2 }}>
                Har element juftlik: <b style={{ color: T.ink }}>ochiluvchi</b> teg boshlaydi, <b style={{ color: T.ink }}>yopiluvchi</b> teg (<span className="mono">/</span> bilan) tugatadi. Orasidagi matn — kontent.
              </p>
            </div>

            <div className="split">
              {/* CHAP: quchoq interaksiyasi */}
              <div className="col">
                <div className="hug-wrap fade-up delay-2">
                  <div className={`hug ${wrapped ? 'on' : ''}`}>
                    <div className={ic('open')} onClick={() => setActive('open')}>
                      <span className="hug-code">&lt;h1&gt;</span>
                      <span className="hug-lbl">ochiluvchi</span>
                    </div>
                    <div className={ic('content')} onClick={() => setActive('content')}>
                      <span className="hug-code">Salom!</span>
                      <span className="hug-lbl">kontent</span>
                    </div>
                    <div className={ic('close')} onClick={() => setActive('close')}>
                      <span className="hug-code">&lt;<span className="hug-slash">/</span>h1&gt;</span>
                      <span className="hug-lbl">yopiluvchi</span>
                    </div>
                  </div>
                </div>

                <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setWrapped(w => !w)}>
                  {wrapped ? '↻ Qaytadan' : '▶ Teglar bilan o\u2019rab olish'}
                </button>

                {active && (
                  <div className="role-line fade-step" key={active}>
                    <p className="body" style={{ color: T.ink, margin: 0 }}>{PARTS[active].role}</p>
                  </div>
                )}
              </div>

              {/* O'NG: natija */}
              <div className="col">
                {!wrapped ? (
                  <div className="hint">
                    <p className="body" style={{ color: T.ink2, margin: 0 }}>
                      Tugmani bosing — ochiluvchi va yopiluvchi teg <b style={{ color: T.ink }}>"Salom!"</b>ni o'rab oladi.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="flow-label">Sahifa</div>
                    <Preview title="sahifa.html" minH={80}>
                      <p className="pv-h1 fade-step">Salom!</p>
                    </Preview>
                    <div className="frame-ok fade-step">
                      <p className="body" style={{ margin: 0, color: T.ink }}>
                        ✓ Element tayyor. <span className="mono">&lt;h1&gt;</span> ochdi, <span className="mono">&lt;/h1&gt;</span> yopdi — orasidagi <b>"Salom!"</b> sahifada sarlavha bo'lib ko'rinadi.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
      </div>
    </Stage>
  );
};
// SCREEN 7 — YOZISH (yopuvchi teg, baholanadi)
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const ANSWER = '</h1>';
  const normTag = (v) => (v || '').toLowerCase().replace(/\s+/g, '');
  const [val, setVal] = useState(storedAnswer?.studentAnswer ?? '');
  const correct = normTag(val) === ANSWER;
  const touched = val.trim().length > 0;
  useEffect(() => {
    if (correct && storedAnswer === undefined) {
      onAnswer(7, { stage: 'practice', screenIdx: 7, picked: val, question: '<h1>Salom! ... yopuvchi tegni yozing', correctAnswer: ANSWER, studentAnswer: val, correct: true });
    }
  }, [correct]);
  return (
    <Stage eyebrow="Yozing" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!correct} label={correct ? 'Davom etish' : 'Yopuvchi tegni yozing'} onClick={onNext} /></>}>
      <div className="screen">
        <div className="head">
          <h2 className="title h-title fade-up">Endi <span className="italic" style={{ color: T.accent }}>o'zingiz</span> yozing.</h2>
          <p className="body lead fade-up delay-1" style={{ color: T.ink2 }}>
            <span className="mono">&lt;h1&gt;</span> ochildi va <b style={{ color: T.ink }}>"Salom!"</b> yozildi. Endi uni yoping — <b style={{ color: T.ink }}>yopuvchi tegni</b> yozing.
          </p>
        </div>
        <div className="split">
          <div className="col">
            <div className="yz-card fade-up delay-2">
              <div className="yz-line">
                <span className="yz-code"><span className="t-tag">&lt;h1&gt;</span>Salom!</span>
                {!correct ? (
                  <input className="yz-input" value={val} onChange={e => setVal(e.target.value)} placeholder="yopuvchi teg…" spellCheck={false} />
                ) : (
                  <span className="yz-code yz-done"><span className="t-tag">&lt;/h1&gt;</span></span>
                )}
              </div>
              {!correct && (
                <p className="yz-hint">{touched ? "Deyarli! Yopuvchi teg / belgisi bilan boshlanadi: </h1>" : "Maslahat: yopuvchi teg shu shaklda — </...>"}</p>
              )}
              {correct && <p className="yz-ok">✓ To'g'ri! Endi element yopildi: &lt;h1&gt;...&lt;/h1&gt;</p>}
            </div>
          </div>
          <div className="col">
            <div className="flow-label">Natija</div>
            <div className="bp-window fade-up delay-2">
              <div className="bp-bar"><span className="bb-dots"><i /><i /><i /></span><span className="bp-title">sahifa.html</span></div>
              <div className="bp-body" style={{ minHeight: 110, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {correct ? <p className="pv-h1 fade-step">Salom!</p> : <p className="yz-placeholder">Natija shu yerda chiqadi…</p>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Stage>
  );
};

// ============================================================
// SCREEN 8 — SARLAVHALAR (v2 — sodda o'lcham zinapoyasi)
// ============================================================
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const LADDER = [
    { n: 1, size: 30, tag: 'eng katta', note: 'Asosiy sarlavha — sahifada bittadan. Google ham buni sahifa nomi deb oladi.' },
    { n: 2, size: 25, tag: '', note: "Bo'lim sarlavhasi — sahifani katta bo'limlarga ajratadi." },
    { n: 3, size: 21, tag: '', note: 'Kichik bo\u2019lim — h2 ichidagi mavzu.' },
    { n: 4, size: 18, tag: '', note: 'Yana kichikroq daraja.' },
    { n: 5, size: 15.5, tag: '', note: 'Juda kichik daraja — kam ishlatiladi.' },
    { n: 6, size: 13.5, tag: 'eng kichik', note: 'Eng kichik sarlavha.' }
  ];
  const [active, setActive] = useState(null);
  const done = active !== null;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(8, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Sarlavhalar" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Sarlavhani bosing'} onClick={onNext} /></>}>
      <div className="screen">
        <div className="head">
          <h2 className="title h-title fade-up">Sarlavhalar — <span className="italic" style={{ color: T.accent }}>H1 dan H6 gacha</span>.</h2>
          <p className="body lead fade-up delay-1" style={{ color: T.ink2 }}>
            Qoida oddiy: <b style={{ color: T.ink }}>raqam qancha katta — sarlavha shuncha kichik</b>. Birortasini bosib ko'ring.
          </p>
        </div>
        <div className="ladder fade-up delay-2">
          {LADDER.map(h => (
            <div key={h.n} className={`hl-row ${active === h.n ? 'on' : ''}`} onClick={() => setActive(h.n)}>
              <span className="hl-chip">{`<h${h.n}>`}</span>
              <span className="hl-text" style={{ fontSize: h.size }}>Sarlavha</span>
              {h.tag && <span className="hl-tag">{h.tag}</span>}
            </div>
          ))}
        </div>
        {active !== null ? (
          <div className="hl-note" key={active}>
            <p className="body" style={{ margin: 0, color: T.ink }}>
              <span className="nb">{`<h${active}>`}</span> — {LADDER.find(h => h.n === active).note}
            </p>
          </div>
        ) : (
          <div className="hl-hint">
            <p className="body" style={{ margin: 0, color: T.ink2 }}>Yuqoridan bir sarlavhani bosing — qisqa izohi chiqadi.</p>
          </div>
        )}
      </div>
    </Stage>
  );
};
// ============================================================
// SCREEN 9 — MATN (qayta dizayn)
// ============================================================
const Screen9 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [bold, setBold] = useState(false);
  const [ital, setItal] = useState(false);
  const [bt, setBt] = useState(false); // bold tried
  const [it, setIt] = useState(false); // ital tried
  const done = bt && it;
  const toggleBold = () => { setBold(b => !b); setBt(true); };
  const toggleItal = () => { setItal(v => !v); setIt(true); };
  useEffect(() => { if ((done) && storedAnswer === undefined) onAnswer(9, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Matn" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!(done)} label={(done) ? "Davom etish" : "Ikkalasini sinab ko\u2019ring"} onClick={onNext} /></>}>
      <div className="screen">

            <div className="head">
              <h2 className="title h-title fade-up">Matnni qalin yoki <span className="italic" style={{ color: T.accent }}>yotiq</span> qanday qilamiz?</h2>
              <p className="body lead fade-up delay-1" style={{ color: T.ink2 }}>
                Ba'zi so'zlarni ajratib ko'rsatamiz: muhimini — <b style={{ color: T.ink }}>qalin</b>, urg'uni — <i style={{ color: T.ink }}>yotiq (kursiv)</i>. Ikkala tugmani bosib ko'ring.
              </p>
            </div>

            <div className="split">
              {/* QALIN */}
              <div className="mcard fade-up delay-2">
                <div className="mc-head">
                  <span className="mc-chip">&lt;strong&gt;</span>
                  <span className="mc-label">Qalin — muhim so'z</span>
                </div>
                <div className="mc-demo">
                  <span>Bu&nbsp;</span>
                  <span key={`b-${bold}`} className={`w-anim ${bold ? 'w-bold' : ''}`}>muhim</span>
                  <span>!</span>
                </div>
                <button className={`mc-btn ${bold ? 'on' : ''}`} onClick={toggleBold}>
                  <span className="ic" style={{ fontWeight: 800 }}>B</span> {bold ? 'Qalin ✓' : 'Qalin qilish'}
                </button>
                <p className="mc-code">
                  <span className="tg">&lt;p&gt;</span>Bu {bold ? <><span className="tg">&lt;strong&gt;</span>muhim<span className="tg">&lt;/strong&gt;</span></> : 'muhim'}!<span className="tg">&lt;/p&gt;</span>
                </p>
              </div>

              {/* KURSIV */}
              <div className="mcard fade-up delay-2">
                <div className="mc-head">
                  <span className="mc-chip">&lt;em&gt;</span>
                  <span className="mc-label">Yotiq (kursiv) — urg'u</span>
                </div>
                <div className="mc-demo">
                  <span key={`i-${ital}`} className={`w-anim ${ital ? 'w-ital' : ''}`}>Juda</span>
                  <span>&nbsp;zo'r!</span>
                </div>
                <button className={`mc-btn ${ital ? 'on' : ''}`} onClick={toggleItal}>
                  <span className="ic" style={{ fontStyle: 'italic' }}>I</span> {ital ? 'Yotiq ✓' : 'Yotiq qilish'}
                </button>
                <p className="mc-code">
                  <span className="tg">&lt;p&gt;</span>{ital ? <><span className="tg">&lt;em&gt;</span>Juda<span className="tg">&lt;/em&gt;</span></> : 'Juda'} zo'r!<span className="tg">&lt;/p&gt;</span>
                </p>
              </div>
            </div>
      </div>
    </Stage>
  );
};
// ============================================================
// SCREEN 10 — RO'YXATLAR (qayta dizayn)
// ============================================================
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const ITEMS = ['Minecraft', 'Futbol', 'Shaxmat'];
  const [type, setType] = useState('ul');
  const [touched, setTouched] = useState(false);
  const done = touched;
  const pick = (t) => { setType(t); setTouched(true); };
  useEffect(() => { if ((done) && storedAnswer === undefined) onAnswer(10, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Ro'yxatlar" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!(done)} label={(done) ? "Davom etish" : "Turini almashtiring"} onClick={onNext} /></>}>
      <div className="screen">

            <div className="head">
              <h2 className="title h-title fade-up">Ro'yxatni qanday teglar bilan <span className="italic" style={{ color: T.accent }}>yasaymiz</span>?</h2>
              <p className="body lead fade-up delay-1" style={{ color: T.ink2 }}>
                <span className="mono">{'<ul>'}</span> — belgili (nuqtali), <span className="mono">{'<ol>'}</span> — raqamli. Har element <span className="mono">{'<li>'}</span> ichida. Tugmani bosib, saytda qanday ko'rinishini ko'ring.
              </p>
            </div>

            <div className="split">
              <div className="col">
                <div className="fade-up delay-2" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <button className={`chip ${type === 'ul' ? 'chip-on' : ''}`} onClick={() => pick('ul')}>• Belgili (ul)</button>
                  <button className={`chip ${type === 'ol' ? 'chip-on' : ''}`} onClick={() => pick('ol')}>1. Raqamli (ol)</button>
                </div>
                <pre className="code-box fade-up delay-2" key={type}>
                  <span className="tg">{`<${type}>`}</span>{'\n'}
                  {ITEMS.map((it, i) => (
                    <React.Fragment key={i}>{'  '}<span className="tg">&lt;li&gt;</span>{it}<span className="tg">&lt;/li&gt;</span>{'\n'}</React.Fragment>
                  ))}
                  <span className="tg">{`</${type}>`}</span>
                </pre>
                <div className="when">
                  <p className="body" style={{ margin: 0, color: T.ink }}>
                    Tartib muhim bo'lsa (qadamlar, reyting) — <b style={{ color: T.accent }}>raqamli (ol)</b>. Aks holda — <b style={{ color: T.accent }}>belgili (ul)</b>.
                  </p>
                </div>
              </div>

              <div className="col">
                <div className="flow-label">Saytda shunday ko'rinadi</div>
                <div className="bp-window fade-up delay-2">
                  <div className="bp-bar">
                    <span className="bb-dots"><i /><i /><i /></span>
                    <span className="bp-title">mening-saytim.uz</span>
                  </div>
                  <div className="bp-body">
                    <div className="site-header">
                      <span className="site-brand"><span className="site-logo">M</span><span className="site-name">Mening saytim</span></span>
                      <span className="site-nav"><span>Asosiy</span><span>O'yinlar</span></span>
                    </div>
                    <div className="site-sec">
                      <h3 className="site-h3">Sevimli o'yinlarim</h3>
                      <div className="site-list" key={type}>
                        {type === 'ul'
                          ? <ul>{ITEMS.map((it, i) => <li key={i}>{it}</li>)}</ul>
                          : <ol>{ITEMS.map((it, i) => <li key={i}>{it}</li>)}</ol>}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
      </div>
    </Stage>
  );
};
// SCREEN 11 — (saqlangan)
const Screen11 = (props) => (
  <QuestionScreen {...props} idx={11} scope="practice" eyebrow="Mashq · 3-savol"
    questionText="Retsept qadamlarini raqamli tartibda ko'rsatish uchun qaysi tegdan boshlash kerak?"
    question={
      <>
        <p className="eyebrow" style={{ color: T.accent }}>To'g'ri tegni tanlang</p>
        <h2 className="title h-sub" style={{ marginTop: 8 }}>Retsept qadamlarini raqamli tartibda ko'rsatish uchun qaysi tegdan boshlash kerak?</h2>
      </>
    }
    options={['<ul>', '<ol>', '<li>', '<a>']} correctIdx={1}
    explainCorrect="To'g'ri. <ol> — ordered list, ya'ni raqamli ro'yxat. Tartib muhim bo'lgan joylarda ishlatiladi."
    explainWrong={{
      0: '<ul> — bu belgili (bullet) ro\u2019yxat. Raqam emas, nuqta chiqaradi.',
      2: '<li> — bu alohida element. Avval uni o\u2019rab oluvchi <ol> yoki <ul> kerak.',
      3: '<a> — bu havola tegi, ro\u2019yxatga aloqasi yo\u2019q.',
      default: 'Raqamli ro\u2019yxat uchun <ol> ishlatiladi.'
    }} />
);

// ============================================================
// SCREEN 12 — HAVOLALAR (v3 — haqiqiy sayt)
// ============================================================
const Screen12 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const PAGES = {
    bosh: {
      title: 'Bosh sahifa', file: 'index.html', url: 'sayt.uz',
      body: "Salom! Bu mening birinchi saytim. Bu yerda o'zim va sevimli mashg'ulotlarim haqida yozaman.",
      links: [{ to: 'oyinlar', label: "O'yinlar" }, { to: 'men', label: 'Men haqimda' }]
    },
    oyinlar: {
      title: "O'yinlar", file: 'oyinlar.html', url: 'sayt.uz/oyinlar.html',
      body: "Bo'sh vaqtimda ko'pincha Minecraft va futbol o'ynayman.",
      links: [{ to: 'minecraft', label: 'Minecraft haqida' }, { to: 'bosh', label: 'Bosh sahifa' }]
    },
    minecraft: {
      title: 'Minecraft', file: 'minecraft.html', url: 'sayt.uz/minecraft.html',
      body: "Minecraft — menga eng yoqadigan o'yin. Soatlab o'ynasam ham zerikmayman.",
      links: [{ to: 'oyinlar', label: "O'yinlar" }, { to: 'bosh', label: 'Bosh sahifa' }]
    },
    men: {
      title: 'Men haqimda', file: 'men.html', url: 'sayt.uz/men.html',
      body: "Men CoddyCamp o'quvchisiman. Kelajakda web-dasturchi bo'lmoqchiman.",
      links: [{ to: 'bosh', label: 'Bosh sahifa' }]
    }
  };
  const POS = { bosh: [55, 72], oyinlar: [150, 34], minecraft: [216, 90], men: [108, 122] };
  const EDGES = [['bosh', 'oyinlar'], ['bosh', 'men'], ['oyinlar', 'minecraft']];
  const [page, setPage] = useState('bosh');
  const [jumped, setJumped] = useState(false);
  const done = jumped;
  const go = (to) => { setPage(to); setJumped(true); };
  const cur = PAGES[page];
  useEffect(() => { if ((done) && storedAnswer === undefined) onAnswer(12, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Havolalar" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!(done)} label={(done) ? "Davom etish" : "Havolani bosing"} onClick={onNext} /></>}>
      <div className="screen">

            <div className="head">
              <h2 className="title h-title fade-up">Bir bosishda — boshqa sahifaga <span className="italic" style={{ color: T.accent }}>o'tish</span>.</h2>
              <p className="body lead fade-up delay-1" style={{ color: T.ink2 }}>
                Unga bosgan zahoti siz bir sahifadan boshqasiga sayohat qilasiz. <span className="mono">{'<a href="...">'}</span> ana shunday ko'prik yaratadi.
              </p>
            </div>

            <div className="split">
              {/* CHAP: to'r diagrammasi */}
              <div className="col">
                <div className="flow-label">Internet — bu "to'r"</div>
                <div className="web fade-up delay-2">
                  <svg className="web-svg" viewBox="0 0 260 150" preserveAspectRatio="none">
                    {EDGES.map(([a, b], i) => {
                      const active = page === a || page === b;
                      return <line key={i} x1={POS[a][0]} y1={POS[a][1]} x2={POS[b][0]} y2={POS[b][1]}
                        stroke={active ? T.accent : T.ink3} strokeWidth={active ? 2 : 1.2} strokeDasharray={active ? '0' : '4 3'} opacity={active ? 1 : 0.6} />;
                    })}
                  </svg>
                  {Object.keys(PAGES).map(k => (
                    <div key={k} className={`web-node ${page === k ? 'on' : ''}`}
                      onClick={() => go(k)}
                      style={{ left: `${POS[k][0] / 260 * 100}%`, top: `${POS[k][1] / 150 * 100}%` }}>
                      {PAGES[k].title}
                    </div>
                  ))}
                </div>
                <p className="web-cap">
                  Har sahifa boshqasiga <b>havola</b> bilan bog'langan. Shu bog'lanishlar <b>"to'r"</b> hosil qiladi — Internet shundan nom olgan.
                </p>
              </div>

              {/* O'NG: haqiqiy sayt + kod */}
              <div className="col">
                <div className="bp-window fade-up delay-2">
                  <div className="bp-bar">
                    <span className="bb-dots"><i /><i /><i /></span>
                    <span className="bp-url" key={`u-${page}`}><span className="lock">●</span>{cur.url}</span>
                  </div>
                  <div className="bp-body pg-in" key={`p-${page}`}>
                    <div className="site-top">
                      <span className="site-wordmark">Mening saytim</span>
                      <span className="site-tag">o'quvchi · CoddyCamp</span>
                    </div>
                    <h1 className="pg-h1">{cur.title}</h1>
                    <p className="pg-body">{cur.body}</p>
                    <div className="pg-divider" />
                    <p className="pg-linklabel">Boshqa sahifalar</p>
                    <div className="pg-links">
                      {cur.links.map((l, i) => (
                        <a key={i} className="pg-a" onClick={() => go(l.to)}>{l.label} <span className="arr">→</span></a>
                      ))}
                    </div>
                    <p className="pg-foot">© 2026 Mening saytim</p>
                  </div>
                </div>

                <div className="codecard fade-up delay-2" key={`c-${page}`}>
                  <p className="codecard-top"><span className="dotf" />{cur.file} — havolalar kodi</p>
                  <pre className="codeblock">
                    {cur.links.map((l, i) => (
                      <span className="ln" key={i}>
                        <span className="tg">&lt;a </span><span className="at">href</span><span className="tx">=</span><span className="st">"{PAGES[l.to].file}"</span><span className="tg">&gt;</span><span className="tx">{l.label}</span><span className="tg">&lt;/a&gt;</span>
                      </span>
                    ))}
                  </pre>
                  <p className="codecap">Sahifadagi har bir havola = bitta <span className="mn">&lt;a&gt;</span> teg.</p>
                </div>
              </div>
            </div>
      </div>
    </Stage>
  );
};
// ============================================================
// SCREEN 13 — AI ESLATMA (qayta dizayn)
// ============================================================
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [picked, setPicked] = useState(null); // 'h1' | 'p'
  const found = picked === 'h1';
  useEffect(() => { if ((found) && storedAnswer === undefined) onAnswer(13, { correct: true, picked: true }); }, [found]);
  return (
    <Stage eyebrow="Kichik eslatma" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!(found)} label={(found) ? "Tushundim, davom etish" : "Xatoni toping"} onClick={onNext} /></>}>
      <div className="screen">

            <div className="head">
              <h2 className="title h-title fade-up">AI ham yordam beradi — <span className="italic" style={{ color: T.accent }}>lekin...</span></h2>
              <p className="body lead fade-up delay-1" style={{ color: T.ink2 }}>
                AI'dan HTML kod so'rasangiz bo'ladi. Lekin <b style={{ color: T.ink }}>AI ham xato qiladi</b> — buni faqat o'zingiz tushunsangiz payqaysiz. Pastdagi kodda xato bor — topa olasizmi?
              </p>
            </div>

            <div className="split">
              {/* CHAP: AI yozgan kod (xatoni top) */}
              <div className="col">
                <div className="ai-card fade-up delay-2">
                  <div className="ai-row">
                    <span className="ai-badge">AI</span>
                    <span className="ai-bubble">Mana, sahifa kodi tayyor!</span>
                  </div>
                  <div className="ai-code">
                    <div className={`ai-line ${found ? 'bad' : ''}`} onClick={() => setPicked('h1')}>
                      <span className="tg">&lt;h1&gt;</span>Salom!
                    </div>
                    <div className={`ai-line ${picked === 'p' ? 'ok' : ''}`} onClick={() => setPicked('p')}>
                      <span className="tg">&lt;p&gt;</span>Bu mening saytim.<span className="tg">&lt;/p&gt;</span>
                    </div>
                  </div>
                  <p className="ai-prompt">Xato qaysi qatorda? Bosing.</p>
                </div>

                {picked === 'p' && !found && (
                  <div className="frame-warn fade-step">
                    <p className="body" style={{ margin: 0, color: T.ink }}>Bu qator to'g'ri — <span className="mono">&lt;p&gt;</span> ochildi va <span className="mono">&lt;/p&gt;</span> bilan yopildi. Yana qarang: qaysi teg yopilmagan?</p>
                  </div>
                )}
                {found && (
                  <div className="frame-warn fade-step">
                    <p className="note-h" style={{ color: T.accent }}>✓ Topdingiz!</p>
                    <p className="body" style={{ margin: 0, color: T.ink }}>
                      <span className="mono">&lt;h1&gt;</span> ochildi, lekin <span className="mono">&lt;/h1&gt;</span> bilan yopilmadi. Siz buni payqadingiz — chunki teglarni <b>o'zingiz</b> tushunasiz.
                    </p>
                  </div>
                )}
              </div>

              {/* O'NG: xulosa */}
              <div className="col">
                {found ? (
                  <div className="takeaway fade-step">
                    <div className="ta-bulb">💡</div>
                    <p className="ta-h">Avval o'zingiz, keyin AI</p>
                    <p className="ta-sub">Bu — eng to'g'ri yo'l</p>
                  </div>
                ) : (
                  <div className="hint">
                    <p className="body" style={{ margin: 0, color: T.ink2 }}>
                      Endi siz teglarni bilasiz. AI yozган kodni <b style={{ color: T.ink }}>tekshira olasiz</b> — xatoni toping-chi.
                    </p>
                  </div>
                )}
              </div>
            </div>
      </div>
    </Stage>
  );
};
// ============================================================
// SCREEN 14 — BUILDER (qayta dizayn)
// ============================================================
const Screen14 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const MAX = 6;

  const CHIPS = [
    { key: 'h1', label: 'Sarlavha', tag: 'h1' },
    { key: 'p', label: 'Matn', tag: 'p' },
    { key: 'ul', label: "Ro'yxat", tag: 'ul' },
    { key: 'a', label: 'Havola', tag: 'a' },
    { key: 'img', label: 'Rasm', tag: 'img' }
  ];

  const detect = (txt) => {
    const t = (txt || '').toLowerCase();
    if (/sarlavha|ism|title|bosh/.test(t)) return 'h1';
    if (/rasm|surat|img|foto/.test(t)) return 'img';
    if (/ro.?yxat|ruyxat|mashg|list/.test(t)) return 'ul';
    if (/havola|sayt|link|url/.test(t)) return 'a';
    if (/matn|paragraf|haqim|tavsif|yoz/.test(t)) return 'p';
    return null;
  };


  const elCode = (type) => {
    switch (type) {
      case 'h1': return <><Tg>{'<h1>'}</Tg>Mening sahifam<Tg>{'</h1>'}</Tg></>;
      case 'p': return <><Tg>{'<p>'}</Tg>Men HTML o'rganyapman.<Tg>{'</p>'}</Tg></>;
      case 'ul': return <><Tg>{'<ul>'}</Tg>{'\n    '}<Tg>{'<li>'}</Tg>Futbol<Tg>{'</li>'}</Tg>{'\n    '}<Tg>{'<li>'}</Tg>Kitob<Tg>{'</li>'}</Tg>{'\n  '}<Tg>{'</ul>'}</Tg></>;
      case 'a': return <><Tg>{'<a '}</Tg><At>href</At>=<Sr>"coddycamp.uz"</Sr><Tg>{'>'}</Tg>CoddyCamp<Tg>{'</a>'}</Tg></>;
      case 'img': return <><Tg>{'<img '}</Tg><At>src</At>=<Sr>"rasm.jpg"</Sr><Tg>{'>'}</Tg></>;
      default: return null;
    }
  };

  const ImgPlaceholder = () => (
    <span style={{ display: 'inline-block', width: 150, height: 96, borderRadius: 10, overflow: 'hidden', border: '1px solid #00000018', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
      <svg viewBox="0 0 150 96" width="150" height="96" preserveAspectRatio="none">
        <defs>
          <linearGradient id="bp-sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a9def0" />
            <stop offset="100%" stopColor="#eaf6ee" />
          </linearGradient>
        </defs>
        <rect width="150" height="96" fill="url(#bp-sky)" />
        <circle cx="118" cy="26" r="14" fill="#FFD36A" />
        <ellipse cx="42" cy="22" rx="20" ry="7" fill="#ffffff" opacity="0.8" />
        <ellipse cx="58" cy="26" rx="14" ry="6" fill="#ffffff" opacity="0.8" />
        <polygon points="0,96 48,44 88,96" fill="#84b18d" />
        <polygon points="58,96 104,32 150,96" fill="#5f9a78" />
        <rect y="84" width="150" height="12" fill="#6f9460" />
      </svg>
    </span>
  );

  const elView = (type, i) => {
    switch (type) {
      case 'h1': return <h1 key={i} style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(18px,2.8vw,24px)', margin: '0 0 6px', color: T.ink }}>Mening sahifam</h1>;
      case 'p': return <p key={i} style={{ fontFamily: 'Georgia, serif', margin: '0 0 6px', color: T.ink, fontSize: 'clamp(13px,1.8vw,15px)' }}>Men HTML o'rganyapman.</p>;
      case 'ul': return <ul key={i} style={{ fontFamily: 'Georgia, serif', color: T.ink, margin: '0 0 6px', paddingLeft: 22, fontSize: 'clamp(13px,1.8vw,15px)' }}><li>Futbol</li><li>Kitob</li></ul>;
      case 'a': return <a key={i} style={{ fontFamily: 'Georgia, serif', color: T.link, textDecoration: 'underline', fontSize: 'clamp(13px,1.8vw,15px)', display: 'inline-block', marginBottom: 6 }}>CoddyCamp</a>;
      case 'img': return <span key={i} style={{ display: 'block', marginBottom: 6 }}><ImgPlaceholder /></span>;
      default: return null;
    }
  };
  const [items, setItems] = useState([]);
  const [text, setText] = useState('');
  const [hint, setHint] = useState('');
  const [pending, setPending] = useState(null);
  const timer = useRef(null);
  const done = items.length >= 2;

  const generate = (type) => {
    if (items.length >= MAX || pending) return;
    setHint('');
    setPending(type);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setItems(prev => [...prev, type]);
      setPending(null);
    }, 650);
  };
  const submit = () => {
    const type = detect(text);
    if (!type) { setHint('Tushunmadim 🙂 Mana shulardan yozing: sarlavha, matn, ro\u2019yxat, havola, rasm.'); return; }
    generate(type);
    setText('');
  };
  const reset = () => { setItems([]); setPending(null); setHint(''); clearTimeout(timer.current); };
  useEffect(() => { if ((done) && storedAnswer === undefined) onAnswer(14, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Amaliyot · sahifa quramiz" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!(done)} label={(done) ? "Davom etish" : `Kamida 2 element (${items.length}/2)`} onClick={onNext} /></>}>
      <div className="screen">

            <div className="head">
              <h2 className="title h-title fade-up">Buyruq bering — <span className="italic" style={{ color: T.accent }}>kod o'zi yaraladi</span>.</h2>
              <p className="body lead fade-up delay-1" style={{ color: T.ink2 }}>
                Buyruqni yozing yoki tanlang — u inputga tushadi. "Yarat" bosing, kod o'zi yaraladi. Hammasi siz o'rgangan teglar!
              </p>
            </div>

            <div className="split">
              <div className="col">
                <div className="fade-up delay-2">
                  <p className="flow-label" style={{ marginBottom: 7 }}>Buyruq yozing</p>
                  <div className="prompt-row">
                    <input className="prompt-input" value={text} placeholder="masalan: rasm qo'sh"
                      onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') submit(); }} />
                    <button className="prompt-btn" onClick={submit} disabled={!!pending || items.length >= MAX}>Yarat</button>
                  </div>
                </div>
                <div className="fade-up delay-2">
                  <p className="flow-label" style={{ margin: '2px 0 7px' }}>yoki tayyor buyruqlardan tanlang</p>
                  <div className="chips">
                    {CHIPS.map(c => (
                      <button key={c.key} className="gchip" disabled={items.length >= MAX} onClick={() => { setText(c.label.toLowerCase() + " qo'sh"); setHint(''); }}>
                        {c.label} <span className="gt">&lt;{c.tag}&gt;</span>
                      </button>
                    ))}
                    {items.length > 0 && <button className="gchip" onClick={reset}>↺ Tozalash</button>}
                  </div>
                </div>
                {hint && <p className="hint fade-step">{hint}</p>}
                {done && (
                  <div style={{ background: T.successSoft, borderLeft: `4px solid ${T.success}`, borderRadius: 12, padding: '12px 15px' }} className="fade-step">
                    <p className="body" style={{ margin: 0, color: T.ink }}>
                      Zo'r! Siz <b>buyruq berib</b> sahifa qurdingiz — va kodni o'qib, nima yozilganini tushunasiz.
                    </p>
                  </div>
                )}
              </div>

              <div className="col">
                <div className="flow-label">Kod</div>
                <pre className="code-box">
                  <Tg>{'<body>'}</Tg>{'\n'}
                  {items.length === 0 && !pending && <><span className="cm">{'  <!-- buyruq bering -->'}</span>{'\n'}</>}
                  {items.map((it, i) => (
                    <React.Fragment key={i}>{'  '}{elCode(it)}{'\n'}</React.Fragment>
                  ))}
                  {pending && <><span className="gen-line">{'  yaratilmoqda'}</span>{'\n'}</>}
                  <Tg>{'</body>'}</Tg>
                </pre>
                <div className="flow-label">Sahifa</div>
                <div className="bp-window">
                  <div className="bp-bar"><span className="bb-dots"><i /><i /><i /></span><span className="bp-title">mening-sahifam.html</span></div>
                  <div className="bp-body">
                    {items.length === 0 && !pending
                      ? <p style={{ color: T.ink3, fontStyle: 'italic', margin: 0, fontFamily: 'Georgia, serif' }}>Bo'sh sahifa — buyruq bering...</p>
                      : items.map((it, i) => <span key={i} className="el-in" style={{ display: 'block' }}>{elView(it, i)}</span>)}
                  </div>
                </div>
              </div>
            </div>
      </div>
    </Stage>
  );
};
// SCREEN 15 — (saqlangan)
const Screen15 = (props) => (
  <QuestionScreen {...props} idx={15} scope="final" eyebrow="Yakuniy tekshiruv"
    questionText="Sahifaga eng katta sarlavhani qo'shish uchun qaysi teg ishlatiladi?"
    question={
      <>
        <p className="eyebrow" style={{ color: T.accent }}>So'nggi savol</p>
        <h2 className="title h-sub" style={{ marginTop: 8 }}>Sahifaga eng katta sarlavhani qo'shish uchun qaysi teg ishlatiladi?</h2>
      </>
    }
    options={['<h6>', '<p>', '<h1>', '<a>']} correctIdx={2}
    explainCorrect="To'g'ri. <h1> — eng yuqori daraja, ya'ni eng katta sarlavha. <h6> esa eng kichigi."
    explainWrong={{
      0: '<h6> — bu eng KICHIK sarlavha. Eng katta — <h1>.',
      1: '<p> — bu paragraf (oddiy matn), sarlavha emas.',
      3: '<a> — bu havola. Sarlavha uchun <h1>...<h6> ishlatiladi.',
      default: 'Eng katta sarlavha — <h1>. Raqam o\u2019sgani sayin sarlavha kichrayadi.'
    }} />
);

// ============================================================
// SCREEN 16 — YAKUN (qayta dizayn: score ring + recap + glossariy)
// ============================================================
const Screen16 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  // --- namuna natija ---

  const RECAP = [
    'HTML bilan veb-sahifa yasash',
    'Sahifa skeletini qurish (head, body)',
    'Teglarni ochish va yopish',
    'Sarlavha (h1–h6) va matn (strong, em)',
    "Ro'yxat (ul/ol) va havola (a) qo'shish"
  ];
  const HOMEWORK = [
    { b: 'Sarlavha (h1)', t: '— ismingiz' },
    { b: '2–3 paragraf', t: "— o'zingiz haqingizda" },
    { b: "Ro'yxat", t: "— sevimli mashg'ulotlaringiz" },
    { b: 'Havola', t: '— sevimli saytingizga' }
  ];
  const GLOSSARY = [
    { b: 'HTML', t: '— veb tili' },
    { b: 'Skelet', t: '— DOCTYPE, html, head, body' },
    { b: 'Teg', t: '— ochiluvchi/yopiluvchi' },
    { b: 'Atribut', t: '— href kabi qo\u2019shimcha' },
    { b: 'Teglar', t: '— h1–h6, p, strong, em, ul, ol, li, a' }
  ];
  const correct = SCORED_IDX.filter(i => answers[i]?.correct).length;
  const total = SCORED_IDX.length;
  const PCT = total ? correct / total : 0;
  const PASSED = PCT >= 0.6;
  const [open, setOpen] = useState(false);
  return (
    <Stage eyebrow="Tayyor" screen={screen} navContent={<>
        <NavBack onPrev={onPrev} />
        <button className="btn btn-ghost" onClick={onReset} style={{ padding: 'clamp(11px,1.6vw,13px) clamp(16px,2.2vw,22px)', fontSize: 'clamp(14px,1.6vw,15px)' }}>Qaytadan</button>
        <button className="btn" onClick={onFinish} style={{ marginLeft: 'auto' }}>Keyingi dars →</button>
      </>}>
      <div className="screen">

            {/* HERO */}
            <div className="hero">
              <div className="hero-l">
                <span className="done-chip fade-up"><span className="tick">✓</span> Dars tugadi</span>
                <h2 className="title h-title fade-up d1">HTML asoslarini <span className="italic" style={{ color: T.accent }}>o'zlashtirdingiz</span>.</h2>
                <p className="body h-sub fade-up d2">
                  {PASSED ? 'Tabriklaymiz! Birinchi qadamni qo\u2019ydingiz — endi sahifa yasay olasiz.' : 'Yaxshi harakat! Asoslarni mustahkamlash uchun darsni qayta ko\u2019ring.'}
                </p>
              </div>
              <ScoreRing correct={correct} total={total} />
            </div>

            {/* SPLIT: recap | uyga vazifa */}
            <div className="split">
              <div className="card fade-up d3">
                <div className="card-lbl" style={{ color: T.success }}><span className="tick" style={{ width: 16, height: 16, borderRadius: '50%', background: T.success, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span> Endi siz bilasiz</div>
                <ul className="recap">
                  {RECAP.map((r, i) => (
                    <li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck">✓</span><span>{r}</span></li>
                  ))}
                </ul>
              </div>

              <div className="card hw fade-up d4">
                <div className="card-lbl" style={{ color: T.accent }}>📝 Uyga vazifa</div>
                <p className="body" style={{ margin: '0 0 10px', color: T.ink }}>O'zingiz haqingizda HTML sahifa yarating:</p>
                <ul>
                  {HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}
                </ul>
                <p className="hw-note">⚠ Hammasini qo'lda yozing — AI'siz!</p>
              </div>
            </div>

            {/* GLOSSARY (yopiladigan) */}
            <div className="gloss fade-up d4">
              <div className="gloss-head" onClick={() => setOpen(o => !o)}>
                <span className="lbl">💡 Kalit so'zlar (takrorlash)</span>
                <span className="gloss-toggle">{open ? '−' : '+'}</span>
              </div>
              {open && (
                <div className="gloss-body">
                  {GLOSSARY.map((g, i) => (
                    <span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>
                  ))}
                </div>
              )}
            </div>
      </div>
    </Stage>
  );
};
// ============================================================
// LESSON ROOT
// ============================================================
export default function HtmlLesson({ onFinished }) {
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
      lessonId: LESSON_META.lessonId,
      lessonTitle: LESSON_META.lessonTitle,
      durationSec: Math.floor((Date.now() - startTimeRef.current) / 1000),
      totalQuestions: scoredMeta.length,
      correctAnswers,
      scorePercent: scoredMeta.length ? Math.round((correctAnswers / scoredMeta.length) * 100) : 0,
      finalScore: finalCorrect,
      finalTotal: finalMeta.length,
      passed: finalMeta.length ? finalCorrect / finalMeta.length >= 0.6 : (scoredMeta.length ? correctAnswers / scoredMeta.length >= 0.6 : false),
      answers: SCREEN_META.map((s, i) => answers[i]).filter(Boolean)
    };
    if (typeof onFinished === 'function') onFinished(payload);
  };

  const screens = [Screen0, Screen1, Screen2, Screen3, Screen4, Screen5, Screen6, Screen7, Screen8, Screen9, Screen10, Screen11, Screen12, Screen13, Screen14, Screen15, Screen16];
  const Current = screens[screen];
  return (
    <>
      <style>{`
        /* Шрифты приходят от LMS. Для standalone-предпросмотра раскомментировать: */
        /* @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500&family=JetBrains+Mono:wght@400;500;700&display=swap'); */
        html, body { margin: 0; padding: 0; }
        .lesson-root, .lesson-root * { box-sizing: border-box; }
        .lesson-root { font-family: 'Manrope', system-ui, sans-serif; color: ${T.ink}; background: ${T.bg}; height: 100dvh; overflow: hidden; -webkit-font-smoothing: antialiased; }

        .bp-body ul { list-style-type: disc; list-style-position: outside; padding-left: 24px; }
        .bp-body ol { list-style-type: decimal; list-style-position: outside; padding-left: 24px; }
        .bp-body li { display: list-item; }

        .title { font-family: 'Fraunces', serif; font-weight: 400; line-height: 1.04; letter-spacing: -0.02em; font-variation-settings: "opsz" 144; }
        .display { font-family: 'Fraunces', serif; font-weight: 400; line-height: 0.9; letter-spacing: -0.03em; font-variation-settings: "opsz" 144; }
        .italic { font-style: italic; }
        .mono { font-family: 'JetBrains Mono', monospace; }

        @keyframes fade-in-up { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fade-in-up 0.4s ease-out forwards; opacity: 0; }
        .delay-1 { animation-delay: 0.08s; } .delay-2 { animation-delay: 0.16s; }
        .delay-3 { animation-delay: 0.24s; } .delay-4 { animation-delay: 0.32s; }
        @keyframes fade-step { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .fade-step { animation: fade-step 0.3s ease-out; }

        .feedback-block { max-height: 0; opacity: 0; overflow: hidden; transition: max-height 0.4s ease-out, opacity 0.3s ease-out 0.1s, margin-top 0.4s ease-out; margin-top: 0; }
        .feedback-block.visible { max-height: 600px; opacity: 1; margin-top: clamp(12px,2vw,18px); }

        .btn { font-family: 'Manrope', sans-serif; font-weight: 600; cursor: pointer; transition: all 0.2s; border: 1.5px solid ${T.ink}; background: ${T.ink}; color: ${T.bg}; border-radius: 12px; }
        .btn:hover:not(:disabled) { background: ${T.accent}; border-color: ${T.accent}; }
        .btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .btn-ghost { background: transparent; color: ${T.ink}; }
        .btn-ghost:hover:not(:disabled) { background: ${T.ink}; color: ${T.bg}; }

        .option { background: ${T.paper}; border: 1.5px solid ${T.ink}; cursor: pointer; transition: all 0.2s; font-family: 'Manrope', sans-serif; font-weight: 500; text-align: left; border-radius: 12px; width: 100%; }
        .option:hover:not(:disabled) { background: ${T.ink}; color: ${T.bg}; }
        .option:disabled { cursor: default; }
        .option-correct { background: ${T.successSoft} !important; color: ${T.success} !important; border-color: ${T.success} !important; border-width: 2px; }
        .option-wrong { background: ${T.paper} !important; color: ${T.ink3} !important; border-color: ${T.ink3} !important; }
        .option-picked-wrong { background: ${T.accentSoft} !important; color: ${T.accent} !important; border-color: ${T.accent} !important; border-width: 2px; }

        .chip { font-family: 'Manrope', sans-serif; font-weight: 600; font-size: clamp(13px,1.6vw,15px); display: inline-flex; align-items: center; gap: 8px; padding: 9px 15px; border-radius: 99px; border: 1.5px solid ${T.ink}; background: ${T.paper}; color: ${T.ink}; cursor: pointer; transition: all 0.18s; }
        .chip:hover:not(:disabled) { transform: translateY(-1px); }
        .chip-on { background: ${T.accent}; border-color: ${T.accent}; color: #fff; }
        .chip:disabled { opacity: 0.4; cursor: not-allowed; }

        .text-input { width: 100%; font-family: 'JetBrains Mono', monospace; font-size: clamp(14px,1.8vw,16px); font-weight: 500; padding: 11px 13px; border: 1.5px solid ${T.ink}; border-radius: 10px; background: ${T.paper}; color: ${T.ink}; outline: none; transition: border-color 0.2s; }
        .text-input:focus { border-color: ${T.accent}; }

        .code-box { background: ${CODE.bg}; color: ${CODE.text}; font-family: 'JetBrains Mono', monospace; font-size: clamp(12.5px,1.6vw,14.5px); line-height: 1.55; padding: clamp(12px,2.2vw,18px); border-radius: 12px; overflow-x: auto; white-space: pre-wrap; word-break: break-word; margin: 0; }
        .bp-window { border: 1.5px solid ${T.ink}; border-radius: 12px; overflow: hidden; background: #fff; }
        .bp-bar { background: #f0eee8; padding: 7px 11px; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid ${T.ink}30; }
        .bp-title { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink3}; }
        .bp-body { padding: clamp(12px,2.2vw,18px); }

        /* --- v2 LAYOUT --- */
        .screen { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: clamp(12px,2vw,18px); }
        .head { display: flex; flex-direction: column; gap: 6px; }
        .lead { margin: 0; }
        .split { flex: 1; min-height: 0; display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: clamp(18px,3vw,36px); align-items: start; }
        .col { display: flex; flex-direction: column; gap: clamp(12px,2vw,16px); min-width: 0; }
        @media (max-width: 880px) {
          .split { grid-template-columns: 1fr; gap: clamp(14px,3vw,20px); }
        }

        /* Muammo → Yechim */
        .ps { display: flex; flex-direction: column; gap: 10px; }
        .ps-line { display: flex; gap: 10px; align-items: flex-start; margin: 0; }
        .ps-badge { flex-shrink: 0; font-family: 'Manrope'; font-weight: 800; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; padding: 4px 9px; border-radius: 99px; margin-top: 2px; }
        .ps-q { background: ${T.accentSoft}; color: ${T.accent}; }
        .ps-a { background: ${T.successSoft}; color: ${T.success}; }
        .ps-text { font-family: 'Manrope'; font-size: clamp(14px,1.8vw,16px); line-height: 1.5; color: ${T.ink}; }

        /* Interaktiv Muammo→Yechim (ProblemReveal) */
        .pr { display: flex; flex-direction: column; gap: 12px; align-items: flex-start; }
        .pr .ps-line { width: 100%; }
        .char-stage { width: 100%; display: flex; justify-content: center; padding: 4px 0 2px; }
        .char { position: relative; font-size: clamp(46px,8vw,62px); line-height: 1; }
        .char-face { display: inline-block; }
        .char.think .char-face { animation: think-wiggle 1.6s ease-in-out infinite; }
        @keyframes think-wiggle { 0%,100% { transform: rotate(-7deg); } 50% { transform: rotate(7deg); } }
        .char-badge { position: absolute; font-size: clamp(20px,3.5vw,26px); opacity: 0; pointer-events: none; }
        .char-q { top: -8px; right: -20px; }
        .char.think .char-q { opacity: 1; animation: q-float 1.6s ease-in-out infinite; }
        @keyframes q-float { 0%,100% { transform: translateY(0) rotate(8deg); } 50% { transform: translateY(-7px) rotate(8deg); } }
        .char-bulb { top: -12px; right: -16px; }
        .char.happy .char-face { animation: happy-bounce 0.6s cubic-bezier(.34,1.56,.64,1); }
        @keyframes happy-bounce { 0% { transform: scale(0.8); } 55% { transform: scale(1.18); } 100% { transform: scale(1); } }
        .char.happy .char-bulb { opacity: 1; animation: bulb-pop 0.55s cubic-bezier(.34,1.56,.64,1) 0.1s both; }
        @keyframes bulb-pop { 0% { transform: scale(0) translateY(8px); } 70% { transform: scale(1.25) translateY(-2px); } 100% { transform: scale(1) translateY(0); } }

        .solve-btn { align-self: flex-start; font-family: 'Manrope', sans-serif; font-weight: 700; font-size: clamp(13px,1.7vw,15px); padding: 10px 20px; border-radius: 99px; border: 1.5px solid ${T.success}; background: ${T.success}; color: #fff; cursor: pointer; transition: all 0.2s; }
        .solve-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 16px rgba(31,122,77,0.32); }
        .pr-answer { background: ${T.successSoft}; border-radius: 12px; padding: 12px 14px; }

        /* Optional "Qiziqarli ma'lumot" */
        .factt { border: 1px dashed ${T.accent}; border-radius: 12px; overflow: hidden; }
        .factt-btn { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 10px; background: ${T.paper}; border: none; cursor: pointer; padding: 10px 14px; font-family: 'Manrope'; font-weight: 700; font-size: clamp(12px,1.5vw,13.5px); letter-spacing: 0.04em; text-transform: uppercase; color: ${T.accent}; transition: background 0.18s; }
        .factt-btn:hover { background: ${T.accentSoft}; }
        .factt-sign { font-family: 'JetBrains Mono'; font-size: 18px; line-height: 1; color: ${T.accent}; }
        .factt-body { margin: 0; padding: 0 14px 12px; font-family: 'Manrope'; font-size: clamp(13px,1.7vw,15px); line-height: 1.5; color: ${T.ink2}; animation: fade-step 0.25s ease-out; }

        .reveal-stack { display: flex; flex-direction: column; gap: 10px; }
        .reveal-rendered { background: ${T.paper}; border: 1.5px solid ${T.ink}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); text-align: center; transition: opacity 0.5s, transform 0.5s; }
        .reveal-rendered.fade { opacity: 0.55; transform: scale(0.98); }
        .reveal-code { opacity: 0; transform: translateY(6px); transition: opacity 0.6s, transform 0.6s; pointer-events: none; }
        .reveal-code.show { opacity: 1; transform: none; pointer-events: auto; }

        .demo-swap { min-height: 214px; animation: fade-step 0.28s ease-out; }

        /* Reja — 2 ustunli grid */
        .topics-grid { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 9px; }
        @media (max-width: 880px) { .topics-grid { grid-template-columns: 1fr; } }
        .topic-item { display: flex; align-items: center; gap: 12px; padding: 10px 14px; background: ${T.paper}; border-radius: 10px; border: 1px solid ${T.ink3}40; transition: transform 0.18s, border-color 0.18s, box-shadow 0.18s; }
        .topic-item:hover { transform: translateY(-2px); border-color: ${T.accent}; box-shadow: 0 4px 14px rgba(255,79,40,0.12); }
        .topic-num { font-family: 'JetBrains Mono'; font-weight: 700; font-size: clamp(12px,1.6vw,14px); color: ${T.accent}; min-width: 24px; }
        .topic-text { font-family: 'Manrope'; font-weight: 500; color: ${T.ink}; font-size: clamp(13px,1.7vw,15px); }

        /* Reja — maqsad kartasi */
        .goal-card { display: flex; align-items: center; gap: 14px; padding: clamp(12px,2vw,16px) clamp(14px,2.5vw,20px); border-radius: 14px; background: ${T.accentSoft}; border: 1.5px solid ${T.accent}; }
        .goal-flag { font-size: clamp(26px,4.5vw,36px); line-height: 1; animation: goal-bob 2.6s ease-in-out infinite; }
        @keyframes goal-bob { 0%,100% { transform: translateY(0) rotate(-5deg); } 50% { transform: translateY(-3px) rotate(5deg); } }
        .goal-h { font-family: 'Fraunces', serif; font-weight: 500; font-size: clamp(16px,2.4vw,21px); color: ${T.ink}; margin: 0; }
        .goal-sub { font-family: 'Manrope'; font-size: clamp(12px,1.5vw,13.5px); color: ${T.ink2}; margin: 2px 0 0; }

        .recipe-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 7px; }
        .recipe-list li { display: flex; align-items: center; gap: 11px; padding: 9px 11px; border-radius: 8px; background: ${T.bg}; transition: all 0.3s; }
        .recipe-list li.on { background: ${T.successSoft}; }
        .recipe-num { width: 26px; height: 26px; border-radius: 50%; background: ${T.paper}; border: 1.5px solid ${T.ink3}; display: flex; align-items: center; justify-content: center; font-family: 'JetBrains Mono'; font-weight: 700; font-size: 12px; color: ${T.ink2}; flex-shrink: 0; transition: all 0.3s; }
        .recipe-list li.on .recipe-num { background: ${T.success}; border-color: ${T.success}; color: #fff; }
        .recipe-text { font-family: 'Manrope'; font-weight: 500; color: ${T.ink}; font-size: clamp(13px,1.7vw,15px); }

        .flow-label { font-family: 'Manrope'; font-weight: 700; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: ${T.ink2}; }
        @keyframes pulse-flash { 0%{transform:scale(1);} 50%{transform:scale(1.02);} 100%{transform:scale(1);} }
        .brauzer-step { background: ${T.accentSoft}; color: ${T.ink}; padding: 11px 15px; border-radius: 12px; border: 1px solid ${T.accent}33; font-family: 'Manrope'; display: flex; align-items: center; gap: 12px; justify-content: center; animation: fade-step 0.4s ease-out; }
        .brauzer-icon { font-size: 20px; }
        .brauzer-h { font-weight: 700; margin: 0; font-size: clamp(13px,1.8vw,15px); color: ${T.ink}; }
        .brauzer-sub { margin: 0; font-size: 11px; color: ${T.ink2}; font-family: 'JetBrains Mono'; }

        .sk-part { padding: 1px 4px; border-radius: 4px; cursor: pointer; transition: background 0.2s; }
        .sk-part:hover { background: rgba(255,79,40,0.18); }
        .sk-part.seen { background: rgba(255,79,40,0.10); }
        .sk-part.active { background: ${T.accent}; }
        .sk-part.active span { color: #fff !important; }

        .anatomy-row { display: flex; flex-wrap: nowrap; justify-content: center; align-items: flex-start; gap: clamp(2px,1vw,8px); }
        .anatomy-col { display: flex; flex-direction: column; align-items: center; gap: 5px; min-width: 0; }
        .tag-part { font-family: 'JetBrains Mono'; font-weight: 700; font-size: clamp(18px,3.6vw,32px); padding: 5px 9px; border-radius: 6px; cursor: pointer; transition: all 0.2s; border: 2px solid transparent; color: ${T.ink}; white-space: nowrap; }
        .tag-part:hover { background: ${T.accentSoft}; }
        .tag-part.seen { border-color: ${T.accent}40; }
        .tag-part.active { background: ${T.accent}; color: #fff; border-color: ${T.accent}; }
        .anatomy-pipe { font-family: 'JetBrains Mono'; color: ${T.accent}; font-size: 13px; opacity: 0; transition: opacity 0.3s; line-height: 1; }
        .anatomy-pipe.show { opacity: 1; }
        .anatomy-label { font-family: 'Manrope'; font-style: italic; font-size: clamp(10px,1.6vw,13px); color: ${T.accent}; font-weight: 600; opacity: 0; transition: opacity 0.3s 0.05s; }
        .anatomy-label.show { opacity: 1; }

        input[type="range"].sl { -webkit-appearance: none; appearance: none; width: 100%; height: 3px; background: ${T.ink}; outline: none; margin: 12px 0 6px; border-radius: 99px; }
        input[type="range"].sl::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 22px; height: 22px; background: ${T.accent}; border-radius: 50%; cursor: grab; border: 3px solid ${T.bg}; box-shadow: 0 0 0 1.5px ${T.ink}; }
        input[type="range"].sl::-webkit-slider-thumb:active { cursor: grabbing; transform: scale(1.12); }

        .ai-highlight { background: ${T.accentSoft}; border-radius: 18px; padding: clamp(22px,4vw,32px); text-align: center; border: 1.5px solid ${T.accent}30; max-width: 460px; margin: 0 auto; width: 100%; }
        .ai-bulb { font-size: clamp(36px,7vw,52px); margin-bottom: 8px; line-height: 1; }
        .ai-h { font-family: 'Fraunces', serif; font-size: clamp(20px,3.5vw,28px); font-weight: 500; color: ${T.ink}; margin: 0 0 4px; }
        .ai-sub { font-family: 'JetBrains Mono', monospace; font-size: clamp(12px,1.6vw,14px); color: ${T.ink2}; margin: 0; font-style: italic; }

        .h-title { font-size: clamp(26px,3.6vw,40px); }
        .h-sub { font-size: clamp(19px,2.6vw,26px); }
        .body { font-size: clamp(14px,1.6vw,16.5px); line-height: 1.5; }
        .eyebrow { font-size: clamp(10.5px,1.2vw,12.5px); letter-spacing: 0.18em; text-transform: uppercase; font-weight: 700; }
        .small { font-size: clamp(12.5px,1.4vw,14px); }

        /* Kengroq + senterda konteyner */
        .stage { max-width: 1060px; margin: 0 auto; height: 100dvh; display: flex; flex-direction: column; }
        .stage-content { flex: 1; min-height: 0; padding: clamp(16px,3vw,30px) clamp(20px,4vw,44px); display: flex; flex-direction: column; overflow-y: auto; overflow-x: hidden; -webkit-overflow-scrolling: touch; }
        .stage-content.narrow { max-width: 680px; width: 100%; margin: 0 auto; }
        .stage-nav { flex-shrink: 0; background: ${T.bg}; border-top: 1px solid ${T.ink3}40; padding: clamp(12px,2vw,16px) clamp(20px,4vw,44px); display: flex; gap: 12px; }

        .chrome { display: flex; align-items: center; justify-content: space-between; margin-bottom: clamp(14px,2.2vw,22px); }
        .chrome-left { display: flex; align-items: center; gap: 10px; color: ${T.ink2}; }
        .dot { width: 7px; height: 7px; border-radius: 50%; background: ${T.accent}; }

        .progress-track { height: 3px; background: ${T.ink3}40; width: 100%; margin-bottom: 16px; border-radius: 99px; overflow: hidden; }
        .progress-bar { height: 100%; background: ${T.accent}; transition: width 0.5s cubic-bezier(.4,0,.2,1); border-radius: 99px; }

        .frame { background: ${T.paper}; border: 1.5px solid ${T.ink}; border-radius: 16px; padding: clamp(16px,3vw,24px); }
        .frame-soft { background: ${T.accentSoft}; border-left: 4px solid ${T.accent}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); }
        .frame-success { background: ${T.successSoft}; border-left: 4px solid ${T.success}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); }

        .bb-dots { display: flex; gap: 5px; }
        .bb-dots i { width: 9px; height: 9px; border-radius: 50%; }
        .bb-dots i:first-child{ background:#ff5f57; } .bb-dots i:nth-child(2){ background:#febc2e; } .bb-dots i:nth-child(3){ background:#28c840; }

        /* ===== qo’shilgan ekran uslublari (qayta dizayn) ===== */
        .btn:hover { background: ${T.accent}; border-color: ${T.accent}; }
        .btn-ghost:hover { background: ${T.ink}; color: ${T.bg}; }
        .roadmap { list-style: none; padding: 0; margin: 0; display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
        @media (max-width: 860px) { .roadmap { grid-template-columns: 1fr; } }
        .step-card { display: flex; align-items: center; gap: 13px; padding: 12px 15px; background: ${T.paper}; border: 1px solid ${T.ink3}40; border-radius: 12px; transition: transform 0.18s, box-shadow 0.18s, border-color 0.18s; }
        .step-card:hover { transform: translateY(-2px); border-color: ${T.accent}; box-shadow: 0 6px 16px rgba(22,36,59,0.06); }
        .step-num { width: 30px; height: 30px; flex-shrink: 0; border-radius: 8px; background: ${T.accentSoft}; color: ${T.accent}; display: flex; align-items: center; justify-content: center; font-family: 'JetBrains Mono'; font-weight: 700; font-size: clamp(12px,1.5vw,14px); }
        .step-body { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
        .step-text { font-family: 'Manrope'; font-weight: 600; color: ${T.ink}; font-size: clamp(13px,1.7vw,15px); }
        .step-tag { font-family: 'JetBrains Mono'; font-size: clamp(10px,1.3vw,12px); color: ${T.ink3}; }
        .dest { display: flex; align-items: center; gap: 14px; padding: clamp(14px,2vw,18px) clamp(16px,2.4vw,22px); background: ${T.accentSoft}; border-left: 4px solid ${T.accent}; border-radius: 12px; }
        .dest-badge { flex-shrink: 0; font-family: 'Manrope'; font-weight: 800; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: ${T.accent}; background: ${T.paper}; padding: 6px 11px; border-radius: 99px; }
        .dest-emoji { flex-shrink: 0; font-size: clamp(20px,2.6vw,24px); line-height: 1; }
        .dest-title { font-family: 'Fraunces', serif; font-weight: 500; color: ${T.ink}; font-size: clamp(17px,2.2vw,21px); margin: 0; line-height: 1.15; }
        .dest-sub { font-family: 'Manrope'; color: ${T.ink2}; font-size: clamp(12.5px,1.6vw,14px); margin: 3px 0 0; }
        .dot-led { width: 7px; height: 7px; border-radius: 50%; background: ${T.accent}; }
        @media (max-width: 880px) { .split { grid-template-columns: 1fr; gap: clamp(14px,3vw,20px); } }
        .mu-block { display: flex; flex-direction: column; gap: 16px; align-items: flex-start; min-height: 150px; }
        .mu-block.leave { animation: mu-leave 0.3s ease-in forwards; }
        @keyframes mu-leave { from { opacity: 1; transform: translateY(0) scale(1); } to { opacity: 0; transform: translateY(-6px) scale(0.98); } }
        .ye-solved { display: flex; flex-direction: column; justify-content: space-between; align-items: stretch; gap: 10px; min-height: 325px; }
        .mu-mini { margin: 0; animation: mu-shrink 0.4s ease-out both; }
        .mu-mini .ps-text { font-size: clamp(12.5px,1.5vw,14px); color: ${T.ink2}; }
        @keyframes mu-shrink { 0% { opacity: 0; transform: scale(1.06) translateY(6px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
        .idea { position: relative; display: flex; justify-content: center; align-self: center; }
        .happy { width: clamp(48px,7vw,60px); height: clamp(48px,7vw,60px); border-radius: 50%; background: ${T.successSoft}; display: flex; align-items: center; justify-content: center; font-size: clamp(26px,4.6vw,36px); line-height: 1; animation: happy-bounce 0.5s cubic-bezier(.34,1.4,.64,1); }
        .idea-bulb { position: absolute; top: -7px; left: calc(50% + 13px); font-size: clamp(16px,2.6vw,21px); animation: bulb-pop 0.5s cubic-bezier(.34,1.4,.64,1) 0.13s both; }
        @keyframes ye-rise { 0% { opacity: 0; transform: translateY(12px); } 100% { opacity: 1; transform: translateY(0); } }
        .solve-btn:hover:not(:disabled) { background: ${T.successSoft}; transform: translateY(-1px); box-shadow: 0 4px 12px rgba(31,122,77,0.15); }
        .solve-btn:disabled { opacity: 0.5; cursor: default; }
        @media (max-width: 880px) { .split { grid-template-columns: 1fr; gap: clamp(14px,3vw,20px); } }
        .ye-stack { display: flex; flex-direction: column; gap: 11px; }
        .flow-arrow { display: flex; flex-direction: column; align-items: center; gap: 1px; padding: 1px 0; }
        .flow-track { position: relative; width: 2px; height: 20px; background: ${T.ink3}40; border-radius: 99px; overflow: hidden; }
        .flow-bead { position: absolute; left: -2px; width: 6px; height: 6px; border-radius: 50%; background: ${T.accent}; animation: flow-down 1.4s ease-in infinite; }
        @keyframes flow-down { 0% { top: -6px; opacity: 0; } 22% { opacity: 1; } 88% { opacity: 1; } 100% { top: 20px; opacity: 0; } }
        .flow-chevron { color: ${T.accent}; font-size: 11px; line-height: 1; animation: chev-bob 1.4s ease-in-out infinite; }
        @keyframes chev-bob { 0%,100% { transform: translateY(0); opacity: 0.45; } 50% { transform: translateY(2px); opacity: 1; } }
        .profile-card { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 7px; animation: fade-step 0.3s ease-out; }
        .pf-ava { width: 54px; height: 54px; border-radius: 50%; background: ${T.accentVivid}; color: #fff; display: flex; align-items: center; justify-content: center; font-family: 'Manrope'; font-weight: 800; font-size: 24px; }
        .pf-name { font-family: 'Georgia', serif; font-size: clamp(20px,3vw,27px); margin: 2px 0 0; color: ${T.ink}; }
        .pf-bio { font-family: 'Georgia', serif; margin: 0; color: ${T.ink2}; font-size: clamp(13px,1.8vw,15px); }
        .pf-btn { margin-top: 6px; font-family: 'Manrope'; font-weight: 700; background: ${T.accentVivid}; color: #fff; border: none; border-radius: 8px; padding: 8px 20px; font-size: clamp(12px,1.7vw,14px); cursor: pointer; }
        @media (max-width: 880px) { .split { grid-template-columns: 1fr; gap: clamp(14px,3vw,20px); } }
        .frame-dash { border: 1.5px dashed ${T.ink3}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); }
        .fig { display: flex; flex-direction: column; align-items: center; gap: 9px; padding-top: 4px; }
        .fig-doctype { font-family: 'JetBrains Mono'; font-weight: 700; font-size: clamp(11px,1.5vw,13px); padding: 5px 12px; border-radius: 99px; border: 1.5px solid ${T.ink3}; background: ${T.paper}; color: ${T.ink2}; cursor: pointer; transition: all 0.2s; }
        .fig-doctype:hover { border-color: ${T.accent}; }
        .fig-doctype.seen { border-color: ${T.accent}66; }
        .fig-doctype.active { border-color: ${T.accent}; background: ${T.accentSoft}; color: ${T.accent}; }
        .fig-html { position: relative; display: flex; flex-direction: column; align-items: center; gap: 0; border: 2px solid ${T.ink}; border-radius: 22px; padding: 26px 18px 18px; cursor: pointer; transition: all 0.2s; width: 100%; max-width: 270px; }
        .fig-html:hover { border-color: ${T.accent}; }
        .fig-html.active { border-color: ${T.accent}; background: ${T.accentSoft}55; }
        .fig-htmllabel { position: absolute; top: -11px; background: ${T.bg}; padding: 0 8px; font-family: 'JetBrains Mono'; font-weight: 700; font-size: clamp(11px,1.5vw,13px); color: ${T.ink}; white-space: nowrap; }
        .fig-html.active .fig-htmllabel { color: ${T.accent}; }
        .fig-head { width: 88px; height: 88px; border-radius: 50%; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 1px; border: 1.5px solid ${T.ink3}; background: ${T.ink3}1f; cursor: pointer; transition: all 0.2s; }
        .fig-head:hover { border-color: ${T.accent}; }
        .fig-head.active { border-color: ${T.accent}; background: ${T.accentSoft}; }
        .fig-neck { width: 12px; height: 13px; background: ${T.ink3}55; }
        .fig-body { width: 100%; border-radius: 14px; padding: 12px 14px; display: flex; flex-direction: column; align-items: center; gap: 3px; border: 1.5px solid ${T.ink3}; background: ${T.paper}; cursor: pointer; transition: all 0.2s; }
        .fig-body:hover { border-color: ${T.accent}; }
        .fig-body.active { border-color: ${T.accent}; background: ${T.accentSoft}; }
        /* ===== 6-ekran: brauzer-anatomiya (head=tab, body=sahifa) ===== */
        .bskel { display: flex; flex-direction: column; align-items: center; gap: 9px; padding-top: 4px; }
        .bskel-doctype { font-family: 'JetBrains Mono'; font-size: clamp(11px,1.4vw,13px); color: ${T.ink2}; background: ${T.paper}; border: 1.5px solid ${T.ink3}; border-radius: 99px; padding: 5px 14px; cursor: pointer; transition: all 0.2s; }
        .bskel-doctype:hover { border-color: ${T.accent}; }
        .bskel-doctype.active { border-color: ${T.accent}; background: ${T.accentSoft}; color: ${T.ink}; }
        .bskel-html { width: 100%; border: 1.5px dashed ${T.ink3}; border-radius: 16px; padding: 12px 14px 16px; display: flex; flex-direction: column; align-items: flex-start; gap: 10px; cursor: pointer; transition: all 0.2s; background: ${T.bg}; }
        .bskel-html:hover { border-color: ${T.accent}; }
        .bskel-html.active { border-color: ${T.accent}; }
        .bskel-htmllabel { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink3}; }
        .bskel-win { width: 100%; border: 1.5px solid ${T.ink}; border-radius: 12px; overflow: hidden; background: #fff; box-shadow: 0 8px 20px rgba(22,36,59,0.08); }
        .bskel-tab { display: flex; align-items: center; gap: 10px; padding: 9px 12px; background: #f0eee8; border-bottom: 1.5px solid ${T.ink}20; cursor: pointer; transition: all 0.2s; }
        .bskel-tab:hover { background: ${T.accentSoft}; }
        .bskel-tab.active { background: ${T.accentSoft}; box-shadow: inset 3px 0 0 ${T.accent}; }
        .bskel-dots { display: flex; gap: 4px; }
        .bskel-dots i { width: 8px; height: 8px; border-radius: 50%; background: ${T.ink3}80; }
        .bskel-tabpill { flex: 1; background: #fff; border: 1px solid ${T.ink3}55; border-bottom: none; border-radius: 7px 7px 0 0; padding: 5px 12px; font-family: 'Manrope'; font-weight: 600; font-size: clamp(12px,1.6vw,14px); color: ${T.ink}; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .bskel-zone { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.accent}; font-weight: 600; flex-shrink: 0; }
        .bskel-page { position: relative; padding: 16px 16px 14px; display: flex; flex-direction: column; align-items: flex-start; gap: 3px; cursor: pointer; transition: all 0.2s; min-height: 84px; }
        .bskel-page:hover { background: ${T.accentSoft}55; }
        .bskel-page.active { background: ${T.accentSoft}; box-shadow: inset 3px 0 0 ${T.accent}; }
        .bskel-ptitle { font-family: 'Georgia', serif; font-weight: 700; font-size: clamp(16px,2.2vw,20px); color: ${T.ink}; margin: 0; }
        .bskel-ptext { font-family: 'Georgia', serif; font-size: clamp(13px,1.7vw,15px); color: ${T.ink2}; margin: 0; }
        .bskel-zone-b { position: absolute; right: 12px; bottom: 9px; }
        .fig-bp { font-family: 'JetBrains Mono'; font-weight: 700; font-size: clamp(12px,1.6vw,14px); color: ${T.ink}; }
        .fig-word { font-family: 'Manrope'; font-weight: 800; font-size: 9px; letter-spacing: 0.12em; text-transform: uppercase; color: ${T.ink3}; }
        .fig-content { font-family: 'Georgia', serif; font-size: clamp(12px,1.6vw,14px); color: ${T.ink}; margin-top: 2px; }
        .ck { padding: 1px 4px; border-radius: 4px; cursor: pointer; transition: background 0.2s; }
        .ck:hover { background: rgba(255,79,40,0.20); }
        .ck.seen { background: rgba(255,79,40,0.10); }
        .ck.active { background: ${T.accent}; }
        .t-tag { color: ${CODE.tag}; }
        .ck.active .t-tag { color: #fff; }
        .t-cm { color: ${CODE.comment}; font-style: italic; }
        .t-title { color: ${CODE.comment}; font-style: italic; opacity: 0.85; }
        .sk-info { background: ${T.paper}; border: 1.5px solid ${T.ink}; border-radius: 16px; padding: clamp(15px,2.6vw,20px); }
        .sk-tagbig { display: inline-flex; align-items: center; gap: 9px; }
        .sk-chip { font-family: 'JetBrains Mono'; font-weight: 700; font-size: clamp(12px,1.6vw,14px); padding: 4px 10px; border-radius: 7px; background: ${T.accent}; color: #fff; }
        .sk-wordbadge { font-family: 'Manrope'; font-weight: 800; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: ${T.accent}; }
        @media (max-width: 880px) { .split { grid-template-columns: 1fr; gap: clamp(14px,3vw,20px); } }
        .hug-wrap { background: ${T.paper}; border: 1.5px solid ${T.ink}; border-radius: 16px; padding: clamp(18px,3vw,26px) clamp(12px,2vw,18px); }
        .hug { display: flex; align-items: center; justify-content: center; gap: 30px; transition: gap 0.55s cubic-bezier(.34,1.3,.5,1); }
        .hug.on { gap: 6px; }
        .hug-item { display: flex; flex-direction: column; align-items: center; gap: 7px; cursor: pointer; transition: transform 0.55s cubic-bezier(.34,1.3,.5,1); }
        .hug-code { font-family: 'JetBrains Mono'; font-weight: 700; font-size: clamp(20px,3.8vw,30px); padding: 9px 11px; border-radius: 10px; transition: all 0.25s; line-height: 1; }
        .hug-tag .hug-code { background: ${T.accentSoft}; color: ${T.accent}; }
        .hug-content .hug-code { background: ${T.bg}; color: ${T.ink}; }
        .hug.on .hug-content .hug-code { background: ${T.successSoft}; box-shadow: 0 0 0 2px ${T.success}55; }
        .hug-item.active .hug-code { box-shadow: 0 0 0 2px ${T.accent}; }
        .hug-slash { color: ${T.ink}; font-weight: 800; }
        .hug-lbl { font-family: 'Manrope'; font-weight: 800; font-size: 9px; letter-spacing: 0.1em; text-transform: uppercase; color: ${T.ink3}; }
        .hug-item.active .hug-lbl { color: ${T.accent}; }
        .role-line { background: ${T.paper}; border: 1.5px solid ${T.ink3}; border-radius: 12px; padding: 11px 14px; }
        .hint { border: 1.5px dashed ${T.ink3}; border-radius: 14px; padding: clamp(16px,3vw,22px); text-align: center; }
        .frame-ok { background: ${T.successSoft}; border-left: 4px solid ${T.success}; border-radius: 12px; padding: 12px 15px; }
        .pv-h1 { font-family: 'Georgia', serif; font-weight: 700; font-size: clamp(24px,3.6vw,32px); color: ${T.ink}; margin: 0; }
        @media (max-width: 880px) { .split { grid-template-columns: 1fr; gap: clamp(14px,3vw,20px); } }
        .doc-h { position: relative; display: inline-flex; align-items: center; gap: 9px; align-self: flex-start; font-family: 'Georgia', serif; font-weight: 700; color: ${T.ink}; line-height: 1.15; cursor: pointer; padding: 3px 8px; margin-left: -8px; border-radius: 8px; border: 1.5px solid transparent; transition: all 0.18s; }
        .doc-h:hover { background: ${T.accentSoft}66; }
        .doc-h.on { background: ${T.accentSoft}; border-color: ${T.accent}; }
        .doc-badge { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 10px; color: #fff; background: ${T.ink3}; padding: 2px 6px; border-radius: 5px; flex-shrink: 0; transition: background 0.18s; }
        .doc-h.on .doc-badge { background: ${T.accent}; }
        .doc-h.lvl3 { margin-left: 8px; }
        .doc-p { font-family: 'Georgia', serif; font-size: clamp(13px,1.7vw,14.5px); color: ${T.ink2}; margin: 0; line-height: 1.5; }
        .doc-h.lvl3 + .doc-p, .doc-p.indent { margin-left: 0; }
        .detail { background: ${T.paper}; border: 1.5px solid ${T.ink}; border-radius: 16px; padding: clamp(16px,3vw,22px); }
        .detail-tag { display: inline-flex; align-items: center; gap: 9px; margin-bottom: 10px; }
        .detail-chip { font-family: 'JetBrains Mono'; font-weight: 700; font-size: clamp(13px,1.7vw,15px); padding: 4px 11px; border-radius: 7px; background: ${T.accent}; color: #fff; }
        .detail-name { font-family: 'Manrope'; font-weight: 800; font-size: 10px; letter-spacing: 0.1em; text-transform: uppercase; color: ${T.accent}; }
        .codeline { font-family: 'JetBrains Mono', monospace; font-size: clamp(12.5px,1.6vw,14px); color: ${T.ink2}; background: ${T.bg}; border: 1px solid ${T.ink3}55; border-radius: 8px; padding: 8px 11px; margin: 11px 0 0; overflow-x: auto; white-space: nowrap; }
        .codeline .tg { color: ${T.accent}; }
        @media (max-width: 880px) { .split { grid-template-columns: 1fr; gap: clamp(14px,3vw,18px); } }
        .mcard { background: ${T.paper}; border: 1.5px solid ${T.ink}; border-radius: 16px; padding: clamp(16px,2.6vw,22px); display: flex; flex-direction: column; gap: 14px; }
        .mc-head { display: flex; align-items: center; gap: 10px; }
        .mc-chip { font-family: 'JetBrains Mono'; font-weight: 700; font-size: clamp(12px,1.6vw,14px); padding: 4px 10px; border-radius: 7px; background: ${T.accentSoft}; color: ${T.accent}; }
        .mc-label { font-family: 'Manrope'; font-weight: 700; font-size: clamp(12.5px,1.6vw,14px); color: ${T.ink2}; }
        .mc-demo { min-height: 54px; display: flex; align-items: center; justify-content: center; text-align: center; background: ${T.bg}; border-radius: 12px; padding: 12px; font-family: 'Georgia', serif; font-size: clamp(18px,2.8vw,24px); color: ${T.ink}; }
        .w-bold { font-weight: 800; }
        .w-ital { font-style: italic; }
        .w-anim { animation: word-pop 0.3s ease-out; display: inline-block; }
        @keyframes word-pop { 0% { transform: scale(0.92); } 60% { transform: scale(1.06); } 100% { transform: scale(1); } }
        .mc-btn { align-self: flex-start; font-family: 'Manrope', sans-serif; font-weight: 700; font-size: clamp(13px,1.7vw,15px); padding: 10px 20px; border-radius: 99px; border: 1.5px solid ${T.ink}; background: ${T.paper}; color: ${T.ink}; cursor: pointer; transition: all 0.2s; display: inline-flex; align-items: center; gap: 8px; }
        .mc-btn:hover { border-color: ${T.accent}; }
        .mc-btn.on { background: ${T.accent}; border-color: ${T.accent}; color: #fff; }
        .mc-btn .ic { font-family: 'Georgia', serif; font-size: 16px; }
        .mc-code { font-family: 'JetBrains Mono', monospace; font-size: clamp(12.5px,1.6vw,14px); color: ${T.ink2}; background: ${T.bg}; border: 1px solid ${T.ink3}55; border-radius: 9px; padding: 9px 12px; margin: 0; overflow-x: auto; white-space: nowrap; }
        .mc-code .tg { color: ${T.accent}; }
        @media (max-width: 880px) { .split { grid-template-columns: 1fr; gap: clamp(14px,3vw,20px); } }
        .chip:hover { transform: translateY(-1px); }
        .code-box .tg { color: ${CODE.tag}; }
        .when { background: ${T.accentSoft}; border-left: 4px solid ${T.accent}; border-radius: 12px; padding: 12px 15px; }
        .site-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; border-bottom: 1px solid ${T.ink3}33; background: ${T.bg}; }
        .site-brand { display: inline-flex; align-items: center; gap: 8px; }
        .site-logo { width: 22px; height: 22px; border-radius: 6px; background: ${T.accent}; color: #fff; display: inline-flex; align-items: center; justify-content: center; font-family: 'Manrope'; font-weight: 800; font-size: 12px; }
        .site-name { font-family: 'Manrope'; font-weight: 800; color: ${T.ink}; font-size: 14px; }
        .site-nav { font-family: 'Manrope'; font-size: 12px; color: ${T.ink2}; display: inline-flex; gap: 12px; }
        .site-sec { padding: 16px 20px 20px; }
        .site-h3 { font-family: 'Georgia', serif; font-weight: 700; font-size: clamp(16px,2.3vw,19px); color: ${T.ink}; margin: 0 0 10px; }
        .site-list ul { margin: 0; padding-left: 26px; list-style: disc; }
        .site-list ol { margin: 0; padding-left: 26px; list-style: decimal; }
        .site-list li { display: list-item; font-family: 'Georgia', serif; font-size: clamp(14px,1.9vw,16px); color: ${T.ink}; margin: 7px 0; }
        .site-list li::marker { color: ${T.accent}; font-weight: 700; }
        @media (max-width: 880px) { .split { grid-template-columns: 1fr; gap: clamp(14px,3vw,20px); } }
        .codeline .at { color: ${CODE.attr}; }
        .codeline .st { color: ${CODE.str}; }
        .codeline .tx { color: #E8E5DD; }
        .web { position: relative; width: 100%; aspect-ratio: 260 / 150; background: ${T.paper}; border: 1.5px solid ${T.ink}; border-radius: 16px; }
        .web-svg { position: absolute; inset: 0; width: 100%; height: 100%; }
        .web-node { position: absolute; transform: translate(-50%,-50%); font-family: 'Manrope'; font-weight: 700; font-size: clamp(10px,1.4vw,12px); padding: 5px 10px; border-radius: 99px; border: 1.5px solid ${T.ink3}; background: ${T.paper}; color: ${T.ink2}; white-space: nowrap; transition: all 0.3s; }
        .web-node.on { background: ${T.accent}; border-color: ${T.accent}; color: #fff; box-shadow: 0 4px 12px rgba(255,79,40,0.3); }
        .web-cap { font-family: 'Manrope'; font-size: clamp(13px,1.6vw,14.5px); line-height: 1.5; color: ${T.ink2}; margin: 0; }
        .web-cap b { color: ${T.accent}; }
        .bp-url { flex: 1; font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink3}; background: #fff; border: 1px solid ${T.ink3}55; border-radius: 99px; padding: 4px 11px; }
        .pg-h1 { font-family: 'Georgia', serif; font-weight: 700; font-size: clamp(21px,3vw,27px); color: ${T.ink}; margin: 0 0 6px; }
        .pg-sub { font-family: 'Georgia', serif; font-size: clamp(13px,1.7vw,14.5px); color: ${T.ink2}; margin: 0 0 16px; }
        .pg-links { display: flex; flex-direction: column; gap: 9px; align-items: flex-start; }
        .pg-a { font-family: 'Georgia', serif; font-size: clamp(15px,2vw,17px); color: ${T.link}; text-decoration: underline; cursor: pointer; background: none; border: none; padding: 0; text-align: left; }
        .pg-a:hover { color: ${T.accent}; }
        @media (max-width: 880px) { .split { grid-template-columns: 1fr; gap: clamp(14px,3vw,20px); } }
        .ai-card { background: ${T.paper}; border: 1.5px solid ${T.ink}; border-radius: 16px; padding: clamp(14px,2.4vw,18px); display: flex; flex-direction: column; gap: 12px; }
        .ai-row { display: flex; align-items: flex-start; gap: 10px; }
        .ai-badge { flex-shrink: 0; width: 30px; height: 30px; border-radius: 50%; background: ${T.ink}; color: #fff; display: flex; align-items: center; justify-content: center; font-family: 'Manrope'; font-weight: 800; font-size: 12px; }
        .ai-bubble { background: ${T.bg}; border-radius: 12px; padding: 9px 13px; font-family: 'Manrope'; font-size: clamp(13px,1.7vw,15px); color: ${T.ink}; }
        .ai-code { background: ${CODE.bg}; border-radius: 12px; padding: 8px; display: flex; flex-direction: column; gap: 2px; }
        .ai-line { font-family: 'JetBrains Mono', monospace; font-size: clamp(13px,1.7vw,15px); color: ${CODE.text}; padding: 7px 11px; border-radius: 8px; cursor: pointer; transition: background 0.18s; }
        .ai-line:hover { background: rgba(255,255,255,0.07); }
        .ai-line .tg { color: ${CODE.tag}; }
        .ai-line.bad { background: rgba(255,79,40,0.22); box-shadow: inset 0 0 0 1.5px ${T.accent}; }
        .ai-line.ok { background: rgba(125,209,129,0.16); }
        .ai-prompt { font-family: 'Manrope'; font-weight: 600; font-size: clamp(12.5px,1.6vw,14px); color: ${T.ink2}; margin: 0; text-align: center; }
        .frame-warn { background: ${T.accentSoft}; border-left: 4px solid ${T.accent}; border-radius: 12px; padding: 12px 15px; }
        .note-h { font-family: 'JetBrains Mono'; font-weight: 600; font-size: clamp(11px,1.4vw,12.5px); text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 4px; }
        .takeaway { background: ${T.accentSoft}; border-radius: 18px; padding: clamp(20px,3.5vw,28px); text-align: center; border: 1.5px solid ${T.accent}30; }
        .ta-bulb { font-size: clamp(30px,5vw,42px); margin-bottom: 6px; line-height: 1; }
        .ta-h { font-family: 'Fraunces', serif; font-size: clamp(19px,3vw,26px); font-weight: 500; color: ${T.ink}; margin: 0 0 4px; }
        .ta-sub { font-family: 'JetBrains Mono', monospace; font-size: clamp(12px,1.6vw,14px); color: ${T.ink2}; margin: 0; font-style: italic; }
        @media (max-width: 880px) { .split { grid-template-columns: 1fr; gap: clamp(14px,3vw,20px); } }
        .prompt-row { display: flex; gap: 9px; }
        .prompt-input { flex: 1; font-family: 'Manrope'; font-size: clamp(14px,1.8vw,16px); padding: 12px 15px; border: 1.5px solid ${T.ink}; border-radius: 12px; background: ${T.paper}; color: ${T.ink}; outline: none; transition: border-color 0.2s; }
        .prompt-input:focus { border-color: ${T.accent}; }
        .prompt-btn { flex-shrink: 0; font-family: 'Manrope'; font-weight: 700; background: ${T.accent}; color: #fff; border: none; border-radius: 12px; padding: 0 20px; font-size: clamp(13px,1.7vw,15px); cursor: pointer; transition: all 0.2s; }
        .prompt-btn:hover:not(:disabled) { filter: brightness(1.05); }
        .prompt-btn:disabled { opacity: 0.5; cursor: default; }
        .chips { display: flex; flex-wrap: wrap; gap: 8px; }
        .gchip { font-family: 'Manrope'; font-weight: 600; font-size: clamp(12.5px,1.6vw,14px); padding: 8px 14px; border-radius: 99px; border: 1.5px solid ${T.ink3}; background: ${T.paper}; color: ${T.ink}; cursor: pointer; transition: all 0.18s; display: inline-flex; align-items: center; gap: 6px; }
        .gchip:hover:not(:disabled) { border-color: ${T.accent}; transform: translateY(-1px); }
        .gchip:disabled { opacity: 0.45; cursor: default; }
        .gchip .gt { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink3}; }
        .gen-line { color: ${T.accent}; }
        .gen-line::after { content: '▍'; animation: blink 0.8s steps(1) infinite; }
        @keyframes blink { 50% { opacity: 0; } }
        .cm { color: ${CODE.comment}; font-style: italic; }
        .el-in { animation: fade-step 0.35s ease-out; }
        .d1 { animation-delay: 0.07s; }
        .d2 { animation-delay: 0.14s; }
        .d3 { animation-delay: 0.21s; }
        .d4 { animation-delay: 0.28s; }
        @keyframes pop-in { 0% { opacity: 0; transform: scale(0.6); } 60% { transform: scale(1.12); } 100% { opacity: 1; transform: scale(1); } }
        .hero { display: grid; grid-template-columns: 1fr auto; gap: clamp(18px,3vw,40px); align-items: center; }
        .hero-l { display: flex; flex-direction: column; gap: 8px; }
        .done-chip { display: inline-flex; align-items: center; gap: 7px; align-self: flex-start; background: ${T.successSoft}; color: ${T.success}; font-weight: 700; font-size: clamp(10.5px,1.2vw,12px); letter-spacing: 0.1em; text-transform: uppercase; padding: 5px 11px; border-radius: 99px; }
        .done-chip .tick { width: 16px; height: 16px; border-radius: 50%; background: ${T.success}; color: #fff; display: inline-flex; align-items: center; justify-content: center; font-size: 10px; }
        .ring-wrap { position: relative; width: 128px; height: 128px; flex-shrink: 0; animation: pop-in 0.5s ease-out 0.1s both; }
        .ring-center { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .ring-num { font-family: 'Fraunces', serif; font-weight: 600; font-size: 34px; line-height: 1; }
        .ring-den { color: ${T.ink3}; font-size: 22px; }
        .ring-lbl { font-family: 'JetBrains Mono'; font-size: 10.5px; color: ${T.ink2}; margin-top: 3px; }
        @media (max-width: 880px) { .hero { grid-template-columns: 1fr; justify-items: center; text-align: center; } .done-chip { align-self: center; } }
        @media (max-width: 880px) { .split { grid-template-columns: 1fr; } }
        .card { background: ${T.paper}; border-radius: 16px; padding: clamp(15px,2.4vw,20px); }
        .card-lbl { display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: clamp(11px,1.3vw,12.5px); letter-spacing: 0.1em; text-transform: uppercase; margin-bottom: 12px; }
        .recap { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 10px; }
        .recap li { display: flex; align-items: flex-start; gap: 10px; font-size: clamp(13.5px,1.6vw,15px); color: ${T.ink}; opacity: 0; animation: fade-in-up 0.4s ease-out forwards; }
        .recap li .ck { flex-shrink: 0; width: 20px; height: 20px; border-radius: 50%; background: ${T.successSoft}; color: ${T.success}; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 800; margin-top: 1px; }
        .hw { border-left: 4px solid ${T.accent}; background: ${T.accentSoft}; }
        .hw ul { list-style: none; margin: 0 0 0; padding: 0; display: flex; flex-direction: column; gap: 7px; }
        .hw li { font-size: clamp(13.5px,1.6vw,15px); color: ${T.ink}; }
        .hw li b { color: ${T.ink}; }
        .hw li .t { color: ${T.ink2}; }
        .hw-note { margin: 12px 0 0; font-weight: 700; color: ${T.accent}; font-size: clamp(13px,1.5vw,14.5px); }
        .gloss { border: 1.5px solid ${T.ink3}; border-radius: 16px; overflow: hidden; }
        .gloss-head { display: flex; align-items: center; justify-content: space-between; padding: 13px 16px; cursor: pointer; user-select: none; }
        .gloss-head .lbl { display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: clamp(11px,1.3vw,12.5px); letter-spacing: 0.1em; text-transform: uppercase; color: ${T.ink}; }
        .gloss-toggle { font-size: 20px; color: ${T.ink2}; line-height: 1; }
        .gloss-body { padding: 0 16px 15px; font-size: clamp(13px,1.5vw,14.5px); line-height: 1.7; color: ${T.ink2}; }
        .gloss-body b { color: ${T.ink}; }

        /* ===== 13-ekran (haqiqiy sayt) yangi uslublari ===== */
        .title { font-family: 'Fraunces', serif; font-weight: 500; line-height: 1.05; letter-spacing: -0.02em; font-variation-settings: "opsz" 144; }
        @keyframes pg-in { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .pg-in { animation: pg-in 0.32s ease-out; }
        .stage-content { flex: 1; min-height: 0; padding: clamp(16px,3vw,30px) clamp(20px,4vw,44px); display: flex; flex-direction: column; overflow-y: auto; overflow-x: hidden; }
        .progress-bar { height: 100%; background: ${T.accent}; border-radius: 99px; }
        .screen { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: clamp(14px,2vw,20px); }
        .h-title { font-size: clamp(25px,3.4vw,38px); }
        .col { display: flex; flex-direction: column; gap: clamp(13px,2vw,16px); min-width: 0; }
        .btn { font-family: 'Manrope', sans-serif; font-weight: 600; cursor: pointer; transition: all 0.2s; border: 1.5px solid ${T.ink}; background: ${T.ink}; color: ${T.bg}; border-radius: 12px; padding: clamp(11px,1.6vw,13px) clamp(22px,2.6vw,30px); font-size: clamp(14px,1.6vw,15px); }
        .btn-ghost { background: transparent; color: ${T.ink}; padding: clamp(11px,1.6vw,13px) clamp(16px,2.2vw,22px); }
        .web-node { position: absolute; transform: translate(-50%,-50%); font-family: 'Manrope'; font-weight: 700; font-size: clamp(10px,1.4vw,12px); padding: 5px 10px; border-radius: 99px; border: 1.5px solid ${T.ink3}; background: ${T.paper}; color: ${T.ink2}; white-space: nowrap; transition: all 0.3s; cursor: pointer; }
        .bp-window { border: 1.5px solid ${T.ink}; border-radius: 13px; overflow: hidden; background: #fff; box-shadow: 0 10px 26px rgba(22,36,59,0.08); }
        .bp-bar { background: #f0eee8; padding: 8px 11px; display: flex; align-items: center; gap: 9px; border-bottom: 1px solid ${T.ink}30; }
        .bb-dots i:first-child { background: #ff5f57; }
        .bb-dots i:nth-child(2) { background: #febc2e; }
        .bb-dots i:nth-child(3) { background: #28c840; }
        .bp-url { flex: 1; font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink2}; background: #fff; border: 1px solid ${T.ink3}55; border-radius: 99px; padding: 4px 12px; display: flex; align-items: center; gap: 6px; }
        .bp-url .lock { color: ${T.success}; font-size: 9px; }
        .bp-body { padding: clamp(16px,2.6vw,22px) clamp(18px,3vw,26px) clamp(14px,2.4vw,20px); min-height: 220px; display: flex; flex-direction: column; }
        .site-top { display: flex; align-items: center; justify-content: space-between; padding-bottom: 10px; border-bottom: 1px solid ${T.ink3}40; margin-bottom: 16px; }
        .site-wordmark { font-family: 'Fraunces', serif; font-weight: 600; font-size: clamp(14px,1.9vw,16px); color: ${T.accent}; white-space: nowrap; }
        .site-tag { font-family: 'Manrope'; font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: ${T.ink3}; }
        .pg-h1 { font-family: 'Georgia', serif; font-weight: 700; font-size: clamp(20px,2.8vw,26px); color: ${T.ink}; margin: 0 0 8px; }
        .pg-body { font-family: 'Georgia', serif; font-size: clamp(13.5px,1.8vw,15.5px); line-height: 1.6; color: ${T.ink2}; margin: 0 0 14px; }
        .pg-divider { height: 1px; background: ${T.ink3}40; margin: 0 0 12px; }
        .pg-linklabel { font-family: 'Manrope'; font-weight: 700; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: ${T.ink3}; margin: 0 0 9px; }
        .pg-links { display: flex; flex-direction: column; gap: 8px; align-items: flex-start; }
        .pg-a { font-family: 'Georgia', serif; font-size: clamp(14px,1.9vw,16px); color: ${T.link}; text-decoration: underline; text-underline-offset: 2px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: color 0.15s; }
        .pg-a .arr { font-family: 'Manrope'; text-decoration: none; transition: transform 0.15s; }
        .pg-a:hover .arr { transform: translateX(3px); }
        .pg-foot { margin-top: auto; padding-top: 14px; font-family: 'Manrope'; font-size: 11px; color: ${T.ink3}; }
        .codecard { background: ${CODE.bg}; border-radius: 12px; padding: 13px 15px; }
        .codecard-top { font-family: 'JetBrains Mono'; font-size: 11px; color: #6B7585; margin: 0 0 9px; display: flex; align-items: center; gap: 7px; }
        .codecard-top .dotf { width: 6px; height: 6px; border-radius: 50%; background: ${CODE.str}; }
        .codeblock { margin: 0; font-family: 'JetBrains Mono', monospace; font-size: clamp(12px,1.5vw,13.5px); line-height: 1.85; }
        .codeblock .ln { display: block; white-space: nowrap; overflow-x: auto; }
        .codeblock .tg { color: ${CODE.tag}; }
        .codeblock .at { color: ${CODE.attr}; }
        .codeblock .st { color: ${CODE.str}; }
        .codeblock .tx { color: #E8E5DD; }
        .codecap { font-family: 'Manrope'; font-size: clamp(12px,1.5vw,13px); color: ${T.ink2}; margin: 10px 0 0; }
        .codecap .mn { font-family: 'JetBrains Mono'; color: ${T.accent}; font-weight: 600; }
        /* ===== 08-ekran: yopuvchi tegni yozish ===== */
        .yz-card { background: ${T.paper}; border: 1.5px solid ${T.ink}; border-radius: 16px; padding: clamp(18px,3vw,26px); display: flex; flex-direction: column; gap: 14px; }
        .yz-line { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; font-family: 'JetBrains Mono', monospace; font-size: clamp(15px,2.2vw,20px); }
        .yz-code { color: ${T.ink}; }
        .yz-done { animation: fade-step 0.3s ease-out; }
        .yz-input { font-family: 'JetBrains Mono', monospace; font-size: clamp(14px,2vw,18px); font-weight: 500; padding: 7px 12px; border: 1.5px dashed ${T.accent}; border-radius: 9px; background: ${T.accentSoft}55; color: ${T.ink}; outline: none; width: clamp(130px,22vw,170px); transition: all 0.18s; }
        .yz-input::placeholder { color: ${T.ink3}; }
        .yz-input:focus { border-style: solid; background: ${T.paper}; }
        .yz-hint { font-family: 'Manrope'; font-size: clamp(12.5px,1.6vw,14px); color: ${T.ink2}; margin: 0; }
        .yz-ok { font-family: 'Manrope'; font-weight: 700; font-size: clamp(13px,1.7vw,15px); color: ${T.success}; margin: 0; animation: fade-step 0.3s ease-out; }
        .yz-placeholder { font-family: 'Georgia', serif; font-style: italic; color: ${T.ink3}; margin: 0; font-size: clamp(14px,1.9vw,16px); }
        /* ===== 09-ekran: sarlavha o'lcham zinapoyasi ===== */
        .ladder { background: ${T.paper}; border: 1.5px solid ${T.ink}; border-radius: 18px; padding: clamp(14px,2.4vw,22px) clamp(16px,3vw,26px); display: flex; flex-direction: column; max-width: 620px; width: 100%; margin: 0 auto; }
        .hl-row { display: flex; align-items: center; gap: 14px; padding: clamp(8px,1.4vw,11px) 12px; border-radius: 12px; cursor: pointer; transition: background 0.16s; border: 1.5px solid transparent; }
        .hl-row + .hl-row { margin-top: 2px; }
        .hl-row:hover { background: ${T.accentSoft}55; }
        .hl-row.on { background: ${T.accentSoft}; border-color: ${T.accent}; }
        .hl-chip { flex-shrink: 0; font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: clamp(11px,1.4vw,13px); color: #fff; background: ${T.ink3}; padding: 3px 8px; border-radius: 6px; width: 46px; text-align: center; transition: background 0.16s; }
        .hl-row.on .hl-chip { background: ${T.accent}; }
        .hl-text { font-family: 'Georgia', serif; font-weight: 700; color: ${T.ink}; line-height: 1.1; flex: 1; }
        .hl-tag { flex-shrink: 0; font-family: 'Manrope'; font-weight: 700; font-size: clamp(9.5px,1.2vw,11px); letter-spacing: 0.08em; text-transform: uppercase; color: ${T.accent}; background: ${T.paper}; border: 1px solid ${T.accent}55; padding: 3px 8px; border-radius: 99px; }
        .hl-note { background: ${T.paper}; border: 1.5px solid ${T.ink3}; border-left: 4px solid ${T.accent}; border-radius: 12px; padding: 12px 16px; max-width: 620px; width: 100%; margin: 0 auto; animation: fade-step 0.28s ease-out; }
        .hl-note .nb { font-family: 'JetBrains Mono'; font-weight: 700; color: ${T.accent}; }
        .hl-hint { max-width: 620px; width: 100%; margin: 0 auto; border: 1.5px dashed ${T.ink3}; border-radius: 12px; padding: 12px 16px; text-align: center; }
      `}</style>
      <div className="lesson-root">
        <Current screen={screen} storedAnswer={answers[screen]} answers={answers} onAnswer={recordAnswer} onNext={next} onPrev={prev} onReset={reset} onFinish={finishLesson} />
      </div>
    </>
  );
}