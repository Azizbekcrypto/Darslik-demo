import React, { useState, useEffect, useRef } from 'react';

// HTML 2-DARS · Rasmlar · Struktura · Formlar · DevTools · 17 ekran · 12–17 yosh
// Собрано через pipeline (skeleton → content → jsx-builder). UZ-only, аудио нет.
// Платформенный контракт: onFinished(payload) + coins, LESSON_META/SCREEN_META.

const T = {
  bg: '#F6F4EF', ink: '#16243B', ink2: '#5A5A60', ink3: '#A7A6A2',
  paper: '#FFFFFF', accent: '#FF4F28', accentSoft: '#FFE8E1',
  success: '#1F7A4D', successSoft: '#E3F0E8'
};
const CODE = {
  bg: '#1A2436', text: '#E8E5DD', tag: '#FF7755',
  attr: '#FFD380', str: '#7DD181', comment: '#6B7585', punct: '#9FB4D8'
};
const TOTAL_SCREENS = 17;
const COIN_PER = 10;

// --- Платформенный контракт (для LMS payload) ---
const LESSON_META = {
  lessonId: 'html-02-v1',
  lessonTitle: 'Rasmlar, struktura, formalar va DevTools'
};
const SCREEN_META = [
  { id: 's0',  type: 'hook',           template: 'choice',  scored: false, scope: 'hook' },
  { id: 's1',  type: 'plan',           template: 'custom',  scored: false, scope: null },
  { id: 's2',  type: 'live-explore',   template: 'custom',  scored: false, scope: null },
  { id: 's3',  type: 'test',           template: 'choice',  scored: true,  scope: 'practice' },
  { id: 's4',  type: 'wireframe',      template: 'custom',  scored: false, scope: null },
  { id: 's5',  type: 'code-anatomy',   template: 'custom',  scored: false, scope: null },
  { id: 's6',  type: 'toggle-explore', template: 'custom',  scored: false, scope: null },
  { id: 's7',  type: 'test',           template: 'choice',  scored: true,  scope: 'practice' },
  { id: 's8',  type: 'form-live',      template: 'custom',  scored: false, scope: null },
  { id: 's9',  type: 'toggle-explore', template: 'custom',  scored: false, scope: null },
  { id: 's10', type: 'test',           template: 'choice',  scored: true,  scope: 'practice' },
  { id: 's11', type: 'devtools-reveal',template: 'custom',  scored: false, scope: null },
  { id: 's12', type: 'journey-stepper',template: 'custom',  scored: false, scope: null },
  { id: 's13', type: 'note',           template: 'custom',  scored: false, scope: null },
  { id: 's14', type: 'builder',        template: 'custom',  scored: false, scope: null },
  { id: 's15', type: 'test',           template: 'choice',  scored: true,  scope: 'final' },
  { id: 's16', type: 'summary',        template: 'summary', scored: false, scope: null }
];
const SCORED_IDX = SCREEN_META.map((m, i) => (m.scored ? i : null)).filter(i => i !== null);

const TOPICS = [
  'Rasmlar — <img> tegi',
  'Sahifa strukturasi — semantik teglar',
  '<header>, <nav>, <main>, <section>, <article>, <footer>',
  '<div> va <span> — bo\u2019laklash',
  'Formlar — <input>, <label>, <button>',
  'DevTools — brauzer asboblari'
];

// Primitives
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

const UL_STYLE = { margin: 0, paddingLeft: 26, listStyleType: 'disc', listStylePosition: 'outside', fontFamily: 'Georgia, serif', color: T.ink };
const OL_STYLE = { margin: 0, paddingLeft: 26, listStyleType: 'decimal', listStylePosition: 'outside', fontFamily: 'Georgia, serif', color: T.ink };

const Stage = ({ children, eyebrow, screen, navContent }) => (
  <div className="stage">
    <div className="stage-content">
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
    style={{ padding: 'clamp(12px,2vw,14px) clamp(18px,2.5vw,24px)', fontSize: 'clamp(14px,1.8vw,16px)' }}>
    Orqaga
  </button>
);

const NavNext = ({ disabled, label = 'Davom etish', onClick }) => (
  <button className="btn" disabled={disabled} onClick={onClick}
    style={{ padding: 'clamp(12px,2vw,14px) clamp(24px,3vw,32px)', fontSize: 'clamp(14px,1.8vw,16px)', marginLeft: 'auto' }}>
    {label}
  </button>
);

const Fact = ({ children, delay = '' }) => (
  <div className={`factbox fade-up ${delay}`}>
    <span className="factbox-label">💡 Bilasizmi?</span>
    <p className="body" style={{ margin: '6px 0 0', color: T.ink2 }}>{children}</p>
  </div>
);

const GoodNote = ({ label, children }) => (
  <div className="frame-success fade-step" style={{ marginTop: 2 }}>
    {label && (
      <p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: T.success, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
        ✓ {label}
      </p>
    )}
    <p className="body" style={{ margin: 0, color: T.ink }}>{children}</p>
  </div>
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

// Универсальный MCQ-экран. Пишет полную структуру в answers для LMS payload.
const QuestionScreen = ({ screen, idx, scope, eyebrow, question, questionText, options, correctIdx, explainCorrect, explainWrong, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const [revealed, setRevealed] = useState(storedAnswer !== undefined);
  const pick = (i) => {
    if (revealed) return;
    setPicked(i); setRevealed(true);
    onAnswer(idx, {
      stage: scope,
      screenIdx: idx,
      picked: i,
      question: questionText,
      options,
      correctIndex: correctIdx,
      correctAnswer: options[correctIdx],
      studentAnswerIndex: i,
      studentAnswer: options[i],
      correct: i === correctIdx
    });
  };
  return (
    <Stage eyebrow={eyebrow} screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!revealed} onClick={onNext} /></>}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(20px,3vw,28px)' }}>
        <div className="fade-up">{question}</div>
        <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {options.map((opt, i) => {
            let cls = 'option';
            if (revealed) {
              if (i === correctIdx) cls += ' option-correct';
              else if (i === picked) cls += ' option-picked-wrong';
              else cls += ' option-wrong';
            }
            return (
              <button key={i} className={cls} disabled={revealed} onClick={() => pick(i)}
                style={{ padding: 'clamp(14px,2vw,18px) clamp(16px,2.5vw,22px)', fontSize: 'clamp(15px,1.9vw,17px)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="mono small" style={{ minWidth: 20, color: revealed && i === correctIdx ? T.success : T.ink3 }}>
                  {String.fromCharCode(65 + i)}
                </span>
                <span style={{ flex: 1 }}>{opt}</span>
              </button>
            );
          })}
        </div>
        <FeedbackBlock show={revealed} isCorrect={picked === correctIdx}>
          <p className="small mono" style={{ margin: '0 0 8px', fontWeight: 600, color: picked === correctIdx ? T.success : T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
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

// SVG "rasm" placeholders (no external dependency)
const SvgMountain = ({ size = 200 }) => (
  <svg viewBox="0 0 300 200" width={size} height={size * 0.667} style={{ display: 'block', borderRadius: 8 }}>
    <defs>
      <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FFB07A" /><stop offset="100%" stopColor="#FFD9B5" />
      </linearGradient>
    </defs>
    <rect width="300" height="200" fill="url(#sky)" />
    <circle cx="220" cy="55" r="22" fill="#FFEBC2" />
    <polygon points="0,200 80,90 130,140 200,60 280,150 300,170 300,200" fill="#4A6B7C" />
    <polygon points="60,200 120,120 170,160 230,100 300,160 300,200" fill="#2D4754" />
  </svg>
);
const SvgBook = ({ size = 200 }) => (
  <svg viewBox="0 0 300 200" width={size} height={size * 0.667} style={{ display: 'block', borderRadius: 8 }}>
    <rect width="300" height="200" fill="#F0E6D6" />
    <rect x="60" y="40" width="180" height="130" rx="4" fill="#B85042" />
    <rect x="65" y="44" width="170" height="122" rx="3" fill="#D6685A" />
    <line x1="150" y1="44" x2="150" y2="166" stroke="#8B3A2E" strokeWidth="2" />
    <rect x="80" y="70" width="50" height="3" fill="#F5E6D3" />
    <rect x="80" y="82" width="60" height="3" fill="#F5E6D3" />
    <rect x="80" y="94" width="40" height="3" fill="#F5E6D3" />
    <rect x="170" y="70" width="50" height="3" fill="#F5E6D3" />
    <rect x="170" y="82" width="55" height="3" fill="#F5E6D3" />
  </svg>
);
const SvgStar = ({ size = 200 }) => (
  <svg viewBox="0 0 300 200" width={size} height={size * 0.667} style={{ display: 'block', borderRadius: 8 }}>
    <rect width="300" height="200" fill="#1A2436" />
    <circle cx="50" cy="40" r="1.5" fill="#fff" /><circle cx="120" cy="30" r="1" fill="#fff" />
    <circle cx="200" cy="50" r="1.2" fill="#fff" /><circle cx="260" cy="35" r="1" fill="#fff" />
    <circle cx="80" cy="170" r="1" fill="#fff" /><circle cx="240" cy="160" r="1.5" fill="#fff" />
    <polygon points="150,55 165,105 220,105 175,135 190,185 150,155 110,185 125,135 80,105 135,105" fill="#FFD380" />
  </svg>
);

// SCREEN 0 — HOOK
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const pick = (v) => {
    setPicked(v); onAnswer(0, { picked: v });
    setTimeout(onNext, 350);
  };
  return (
    <Stage eyebrow="Kirish" screen={screen}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(18px,3vw,26px)' }}>
        <h1 className="title h-title fade-up">
          Endi <span className="italic" style={{ color: T.accent }}>haqiqiy sahifa</span> yaratamiz.
        </h1>
        <p className="body fade-up delay-1" style={{ color: T.ink2 }}>
          1-darsda matn, sarlavha, ro'yxat va havolalar bilan tanishdingiz. Lekin haqiqiy sayt — bu nafaqat matn.
          U yerda <b style={{ color: T.ink }}>rasmlar, formalar</b> bo'ladi va kod <b style={{ color: T.ink }}>tartibga solingan</b> qismlarga ajratilgan.
        </p>
        <div className="fade-up delay-2">
          <Preview title="sayt.html" minH={180}>
            <div style={{ fontFamily: 'Georgia, serif', color: T.ink }}>
              <div style={{ background: T.accentSoft, padding: '8px 10px', borderRadius: 6, marginBottom: 8, fontSize: 13 }}>
                <b>Mening blogim</b>
              </div>
              <h2 style={{ margin: '0 0 6px', fontSize: 18 }}>Salom!</h2>
              <p style={{ margin: '0 0 8px', fontSize: 14 }}>Bu mening birinchi maqolam.</p>
              <SvgMountain size={150} />
              <div style={{ marginTop: 8, padding: '6px 8px', background: '#F0EEE8', borderRadius: 6, fontSize: 12, color: T.ink2 }}>
                Ism: <input style={{ border: 'none', borderBottom: `1px solid ${T.ink3}`, background: 'transparent', fontSize: 12, width: 80 }} placeholder="..." readOnly /> [Yuborish]
              </div>
            </div>
          </Preview>
        </div>
        <p className="h-sub title fade-up delay-3">
          Sizningcha, bu sahifada nechta turdagi element bor?
        </p>
        <div className="fade-up delay-4" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { id: 'a', label: 'Faqat matn va sarlavhalar' },
            { id: 'b', label: 'Matn, sarlavha va rasm' },
            { id: 'c', label: 'Matn, sarlavha, rasm, forma va tuzilma — har biri o\u2019z tegi bilan' },
            { id: 'd', label: 'Bilmayman, bilib olishni xohlayman' }
          ].map(o => (
            <button key={o.id} className="option" disabled={picked !== null} onClick={() => pick(o.id)}
              style={{
                padding: 'clamp(14px,2vw,18px) clamp(16px,2.5vw,24px)', fontSize: 'clamp(15px,1.9vw,17px)',
                background: picked === o.id ? T.ink : T.paper, color: picked === o.id ? T.bg : T.ink
              }}>
              {o.label}
            </button>
          ))}
        </div>
      </div>
    </Stage>
  );
};

// SCREEN 1 — BUGUN O'RGANAMIZ
const Screen1 = ({ screen, onNext, onPrev }) => (
  <Stage eyebrow="Reja" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext label="Boshlaymiz →" onClick={onNext} /></>}>
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(18px,3vw,24px)' }}>
      <h2 className="title h-title fade-up">
        Bugun <span className="italic" style={{ color: T.accent }}>nimani o'rganamiz</span>?
      </h2>
      <p className="body fade-up delay-1" style={{ color: T.ink2 }}>
        Bu dars 1-darsning davomi. Endi sahifangizga jon kiritamiz — rasmlar, formalar va to'g'ri tuzilma qo'shamiz.
      </p>
      <ol className="topics" style={{ listStyleType: 'none', padding: 0, margin: 0 }}>
        {TOPICS.map((t, i) => (
          <li key={i} className="topic-item fade-up" style={{ animationDelay: `${0.15 + i * 0.08}s` }}>
            <span className="topic-num">{String(i + 1).padStart(2, '0')}</span>
            <span className="topic-text">{t}</span>
          </li>
        ))}
      </ol>
      <Fact delay="delay-4">
        Eng oxirida sahifangizni brauzerda DevTools bilan ochasiz — haqiqiy dasturchilar sayt yaratganda qo'llaydigan asbob bilan tanishasiz.
      </Fact>
    </div>
  </Stage>
);

// SCREEN 2 — RASMLAR (img live)
const IMAGES = [
  { id: 'tog', file: 'tog.jpg', alt: "Tog' surati", Svg: SvgMountain },
  { id: 'kitob', file: 'kitob.jpg', alt: 'Kitob surati', Svg: SvgBook },
  { id: 'yulduz', file: 'yulduz.jpg', alt: 'Tunda yulduzlar', Svg: SvgStar }
];
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [imgIdx, setImgIdx] = useState(0);
  const [width, setWidth] = useState(220);
  const [broken, setBroken] = useState(false);
  const [touched, setTouched] = useState(storedAnswer !== undefined);
  const touch = () => { if (!touched) { setTouched(true); if (storedAnswer === undefined) onAnswer(2, { correct: true, picked: true }); } };
  const cur = IMAGES[imgIdx];

  return (
    <Stage eyebrow="Rasmlar" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!touched} label={touched ? 'Davom etish' : 'Rasmni almashtiring'} onClick={onNext} /></>}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(18px,3vw,22px)' }}>
        <h2 className="title h-title fade-up">
          Rasmlar — <span className="italic" style={{ color: T.accent }}>{'<img>'}</span> tegi.
        </h2>
        <p className="body fade-up delay-1" style={{ color: T.ink2 }}>
          Sahifaga rasm qo'shish uchun <span className="mono">{'<img>'}</span> tegi ishlatiladi. Bu — <b style={{ color: T.ink }}>yolg'iz teg</b>: yopuvchisi yo'q!
          U bir nechta <b style={{ color: T.ink }}>atribut</b> bilan keladi: <span className="mono">src</span>, <span className="mono">alt</span>, <span className="mono">width</span>, <span className="mono">height</span>.
        </p>
        <Fact delay="delay-2">
          <b>src</b> — rasm manzili (URL yoki fayl yo'li). <b>alt</b> — rasm ko'rinmasa, uning o'rniga matn chiqadi.
          Bu nafaqat texnik ehtiyot, balki ko'rish qobiliyati cheklangan foydalanuvchilar uchun ham muhim.
        </Fact>
        <div className="fade-up delay-3">
          <p className="eyebrow" style={{ color: T.ink2, margin: '0 0 10px' }}>Rasmni tanlang</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {IMAGES.map((im, i) => (
              <button key={im.id} className={`chip ${imgIdx === i ? 'chip-on' : ''}`} onClick={() => { setImgIdx(i); touch(); }}>
                {im.file}
              </button>
            ))}
          </div>
        </div>
        <div className="fade-up delay-3">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <span className="eyebrow" style={{ color: T.ink2 }}>width: {width}px</span>
            <button onClick={() => { setBroken(!broken); touch(); }}
              style={{ background: 'transparent', border: 'none', color: T.accent, fontSize: 12, cursor: 'pointer', fontFamily: 'JetBrains Mono', fontWeight: 700 }}>
              {broken ? '✓ rasm topildi' : '⚠ rasm topilmadi (alt sinab ko\u2019r)'}
            </button>
          </div>
          <input type="range" className="sl" min="100" max="360" value={width} onChange={e => { setWidth(parseInt(e.target.value)); touch(); }} />
        </div>
        <div className="fade-up delay-4">
          <CodeBox>
            <Tg>{'<img '}</Tg><At>src</At><Pn>=</Pn><Sr>"{cur.file}"</Sr>{'\n'}
            {'     '}<At>alt</At><Pn>=</Pn><Sr>"{cur.alt}"</Sr>{'\n'}
            {'     '}<At>width</At><Pn>=</Pn><Sr>"{width}"</Sr><Tg>{'>'}</Tg>{'\n'}
            <Cm>{'<!-- yopiluvchi teg yo\u2019q! -->'}</Cm>
          </CodeBox>
        </div>
        <div className="fade-up delay-4">
          <Preview minH={width * 0.667 + 30}>
            {broken ? (
              <div style={{ border: `1.5px dashed ${T.ink3}`, padding: 10, borderRadius: 6, color: T.ink2, fontFamily: 'Georgia, serif', display: 'inline-flex', alignItems: 'center', gap: 10, fontSize: 13 }}>
                <span style={{ fontSize: 18 }}>🖼</span> {cur.alt}
              </div>
            ) : (
              <cur.Svg size={width} />
            )}
          </Preview>
        </div>
        {touched && (
          <GoodNote label="Sezdingizmi?">
            Atributlar (src, alt, width) o'zgarsa — rasm darrov yangilanadi. Va agar rasm yuklanmasa, <b>alt</b> matni ko'rinadi.
          </GoodNote>
        )}
      </div>
    </Stage>
  );
};

// SCREEN 3 — MCQ #1 [SCORED]
const Screen3 = (props) => (
  <QuestionScreen {...props} idx={3} scope="practice" eyebrow="Mashq · 1-savol"
    questionText="alt atributi nima uchun kerak?"
    question={
      <>
        <p className="eyebrow" style={{ color: T.accent }}>{'<img>'} haqida</p>
        <h2 className="title h-sub" style={{ marginTop: 8 }}>
          <span className="mono" style={{ color: T.ink }}>alt</span> atributi nima uchun kerak?
        </h2>
      </>
    }
    options={[
      'Rasm o\u2019lchamini belgilash uchun',
      'Rasm yuklanmasa yoki ko\u2019rinmasa, o\u2019rniga ko\u2019rinadigan matn',
      'Rasm formatini belgilash uchun (jpg yoki png)',
      'Faqat bezak — kerak emas'
    ]} correctIdx={1}
    explainCorrect="To'g'ri. alt — rasm yuklanmasa yoki foydalanuvchi uni ko'ra olmasa (masalan, ekran o'qiydigan dasturlar uchun), o'rniga shu matn chiqadi."
    explainWrong={{
      0: 'O\u2019lcham uchun width va height ishlatiladi, alt emas.',
      2: 'Format manzilning o\u2019zida bo\u2019ladi (.jpg, .png). alt — bu matn, format emas.',
      3: 'Alt juda muhim — ham texnik ehtiyot, ham ko\u2019rishi cheklangan foydalanuvchilar uchun zarur.',
      default: 'alt — rasm ko\u2019rinmasa, uning o\u2019rniga chiqadigan matn.'
    }} />
);

// SCREEN 4 — SAHIFA STRUKTURASI WIREFRAME (interactive)
const STRUCT_PARTS = {
  header: { label: '<header>', body: 'Sayt yuqorisi — logo, sarlavha, asosiy ma\u2019lumotlar. Odatda har sahifada bir xil bo\u2019ladi.' },
  nav: { label: '<nav>', body: 'Navigatsiya — sahifalar orasidagi havolalar (menyu). Foydalanuvchi shu yerdan bo\u2019limga o\u2019tadi.' },
  main: { label: '<main>', body: 'Asosiy mazmun — sahifaning "yuragi". Bitta sahifada faqat bitta <main> bo\u2019lishi kerak.' },
  aside: { label: '<aside>', body: 'Yondosh kontent — qo\u2019shimcha ma\u2019lumotlar, reklama, "tegishli maqolalar".' },
  footer: { label: '<footer>', body: 'Pastki qism — mualliflik huquqi, aloqa, ijtimoiy tarmoq havolalari.' }
};
const Screen4 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [active, setActive] = useState(null);
  const [clicked, setClicked] = useState(new Set());
  const done = clicked.size === 5 || storedAnswer !== undefined;
  const tap = (k) => {
    setActive(k);
    const next = new Set(clicked); next.add(k);
    setClicked(next);
    if (next.size === 5 && storedAnswer === undefined) onAnswer(4, { correct: true, picked: true });
  };
  const cls = (k) => `wf-zone ${active === k ? 'active' : ''} ${clicked.has(k) ? 'seen' : ''}`;
  return (
    <Stage eyebrow="Sahifa strukturasi" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${clicked.size}/5 qismi ko'rilgan`} onClick={onNext} /></>}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(18px,3vw,22px)' }}>
        <h2 className="title h-title fade-up">
          Sahifa <span className="italic" style={{ color: T.accent }}>strukturasi</span>.
        </h2>
        <p className="body fade-up delay-1" style={{ color: T.ink2 }}>
          Veb-sahifa odatda bir nechta qismdan iborat. HTML'da bu qismlarni <b style={{ color: T.ink }}>semantik teglar</b> bilan belgilaymiz —
          shunda kod tushunarli bo'ladi va qidiruv tizimlari ham sahifani yaxshi tushunadi.
          Pastdagi sahifa maketida har bir qismni bosing.
        </p>
        <div className="wireframe fade-up delay-2">
          <div className={cls('header')} onClick={() => tap('header')} style={{ gridArea: 'h' }}>header</div>
          <div className={cls('nav')} onClick={() => tap('nav')} style={{ gridArea: 'n' }}>nav</div>
          <div className={cls('main')} onClick={() => tap('main')} style={{ gridArea: 'm' }}>main</div>
          <div className={cls('aside')} onClick={() => tap('aside')} style={{ gridArea: 'a' }}>aside</div>
          <div className={cls('footer')} onClick={() => tap('footer')} style={{ gridArea: 'f' }}>footer</div>
        </div>
        {active && (
          <div className="frame fade-step" key={active}>
            <p className="mono" style={{ color: T.accent, fontWeight: 700, margin: 0, fontSize: 'clamp(15px,2vw,17px)' }}>
              {STRUCT_PARTS[active].label}
            </p>
            <p className="body" style={{ color: T.ink2, margin: '8px 0 0' }}>{STRUCT_PARTS[active].body}</p>
          </div>
        )}
        {!active && (
          <p className="small fade-up" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic' }}>↑ Maketdan birortasini bosing</p>
        )}
        <Fact delay="delay-3">
          Semantik teglar ilgari ham bor edi, lekin <span className="mono">{'<div>'}</span> bilan ishlanardi. HTML5 dan beri brauzer va qidiruvchilar sahifaning ma'nosini ham tushunadi.
        </Fact>
        {done && (
          <GoodNote label="Tuzilma tushunarli">
            Endi har qanday saytni ochsangiz, qismlarini ajratib ko'rasiz. Keyingi ekranda buni kodda yozamiz.
          </GoodNote>
        )}
      </div>
    </Stage>
  );
};

// SCREEN 5 — SEMANTIK TEGLAR KODDA (interactive code)
const SEM_PARTS = {
  header: { title: '<header>', body: 'Sayt yuqori qismi: logo, sarlavha, mualliflik.' },
  nav: { title: '<nav>', body: 'Navigatsiya: menyu havolalari.' },
  main: { title: '<main>', body: 'Asosiy mazmun. Sahifada faqat bitta <main> bo\u2019ladi.' },
  section: { title: '<section>', body: 'Mavzuli bo\u2019lim — masalan, "Yangiliklar", "Maqolalar".' },
  article: { title: '<article>', body: 'Mustaqil maqola yoki post — bir o\u2019zi ma\u2019noli.' },
  footer: { title: '<footer>', body: 'Pastki qism: mualliflik, aloqa, qo\u2019shimcha havolalar.' }
};
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [active, setActive] = useState(null);
  const [clicked, setClicked] = useState(new Set());
  const done = clicked.size === 6 || storedAnswer !== undefined;
  const tap = (k) => {
    setActive(k);
    const next = new Set(clicked); next.add(k);
    setClicked(next);
    if (next.size === 6 && storedAnswer === undefined) onAnswer(5, { correct: true, picked: true });
  };
  const cls = (k) => `sk-part ${active === k ? 'active' : ''} ${clicked.has(k) ? 'seen' : ''}`;
  return (
    <Stage eyebrow="Semantik teglar" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${clicked.size}/6 qismi ko'rilgan`} onClick={onNext} /></>}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(18px,3vw,22px)' }}>
        <h2 className="title h-title fade-up">
          Semantik teglar — <span className="italic" style={{ color: T.accent }}>kodda</span>.
        </h2>
        <p className="body fade-up delay-1" style={{ color: T.ink2 }}>
          Mana sahifa qismlarini kodda qanday yozish kerak. Har bir tegni bosib, vazifasini bilib oling.
        </p>
        <div className="fade-up delay-2">
          <CodeBox>
            <Tg>{'<body>'}</Tg>{'\n'}
            {'  '}<span className={cls('header')} onClick={() => tap('header')}><Tg>{'<header>'}</Tg></span>Sayt sarlavhasi<span className={cls('header')} onClick={() => tap('header')}><Tg>{'</header>'}</Tg></span>{'\n'}
            {'  '}<span className={cls('nav')} onClick={() => tap('nav')}><Tg>{'<nav>'}</Tg></span>Menyu havolalari<span className={cls('nav')} onClick={() => tap('nav')}><Tg>{'</nav>'}</Tg></span>{'\n'}
            {'  '}<span className={cls('main')} onClick={() => tap('main')}><Tg>{'<main>'}</Tg></span>{'\n'}
            {'    '}<span className={cls('section')} onClick={() => tap('section')}><Tg>{'<section>'}</Tg></span>Asosiy bo'lim<span className={cls('section')} onClick={() => tap('section')}><Tg>{'</section>'}</Tg></span>{'\n'}
            {'    '}<span className={cls('article')} onClick={() => tap('article')}><Tg>{'<article>'}</Tg></span>Maqola<span className={cls('article')} onClick={() => tap('article')}><Tg>{'</article>'}</Tg></span>{'\n'}
            {'  '}<span className={cls('main')} onClick={() => tap('main')}><Tg>{'</main>'}</Tg></span>{'\n'}
            {'  '}<span className={cls('footer')} onClick={() => tap('footer')}><Tg>{'<footer>'}</Tg></span>Pastki qism<span className={cls('footer')} onClick={() => tap('footer')}><Tg>{'</footer>'}</Tg></span>{'\n'}
            <Tg>{'</body>'}</Tg>
          </CodeBox>
        </div>
        {active && (
          <div className="frame-soft fade-step" key={active}>
            <p className="mono" style={{ color: T.accent, fontWeight: 700, margin: 0, fontSize: 'clamp(15px,2vw,17px)' }}>
              {SEM_PARTS[active].title}
            </p>
            <p className="body" style={{ color: T.ink, margin: '8px 0 0' }}>{SEM_PARTS[active].body}</p>
          </div>
        )}
        {done && (
          <GoodNote label="Semantikani o'rgandingiz">
            Mana endi sahifangiz nafaqat ko'rinishda, balki <b>tuzilishi</b> bilan ham tushunarli bo'ldi.
          </GoodNote>
        )}
      </div>
    </Stage>
  );
};

// SCREEN 6 — DIV va SPAN (block vs inline)
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [mode, setMode] = useState('div');
  const [touched, setTouched] = useState(storedAnswer !== undefined);
  const switchTo = (m) => {
    setMode(m);
    if (!touched) { setTouched(true); if (storedAnswer === undefined) onAnswer(6, { correct: true, picked: true }); }
  };
  return (
    <Stage eyebrow="div va span" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!touched} label={touched ? 'Davom etish' : 'Turini almashtiring'} onClick={onNext} /></>}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(18px,3vw,22px)' }}>
        <h2 className="title h-title fade-up">
          <span className="mono">{'<div>'}</span> va <span className="mono">{'<span>'}</span> — <span className="italic" style={{ color: T.accent }}>umumiy konteynerlar</span>.
        </h2>
        <p className="body fade-up delay-1" style={{ color: T.ink2 }}>
          Bular semantik ma'noga ega emas — faqat <b style={{ color: T.ink }}>guruhlash</b> uchun. Farqi: <b>div</b> — yangi qator, butun joyni egallaydi.
          <b> span</b> — qator ichida, faqat o'zi egallagan joy.
        </p>
        <div className="fade-up delay-2" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button className={`chip ${mode === 'div' ? 'chip-on' : ''}`} onClick={() => switchTo('div')}>⬛ {'<div>'} (blok)</button>
          <button className={`chip ${mode === 'span' ? 'chip-on' : ''}`} onClick={() => switchTo('span')}>▭ {'<span>'} (qator ichida)</button>
        </div>
        <div className="fade-up delay-3">
          <CodeBox>
            {mode === 'div' ? (
              <>
                <Tg>{'<div>'}</Tg>Birinchi blok<Tg>{'</div>'}</Tg>{'\n'}
                <Tg>{'<div>'}</Tg>Ikkinchi blok<Tg>{'</div>'}</Tg>{'\n'}
                <Tg>{'<div>'}</Tg>Uchinchi blok<Tg>{'</div>'}</Tg>
              </>
            ) : (
              <>
                <Tg>{'<p>'}</Tg>Bahosi —{'\n'}
                {'   '}<Tg>{'<span>'}</Tg>$5<Tg>{'</span>'}</Tg>{'\n'}
                {'   '}faqat bugun!<Tg>{'</p>'}</Tg>
              </>
            )}
          </CodeBox>
        </div>
        <div className="fade-up delay-3">
          <Preview minH={100}>
            {mode === 'div' ? (
              <>
                <div style={{ background: T.accentSoft, padding: '6px 10px', marginBottom: 4, fontFamily: 'Georgia, serif', borderRadius: 4 }}>Birinchi blok</div>
                <div style={{ background: T.accentSoft, padding: '6px 10px', marginBottom: 4, fontFamily: 'Georgia, serif', borderRadius: 4 }}>Ikkinchi blok</div>
                <div style={{ background: T.accentSoft, padding: '6px 10px', fontFamily: 'Georgia, serif', borderRadius: 4 }}>Uchinchi blok</div>
              </>
            ) : (
              <p style={{ fontFamily: 'Georgia, serif', margin: 0, fontSize: 'clamp(15px,2vw,18px)' }}>
                Bahosi — <span style={{ background: T.accentSoft, padding: '2px 6px', borderRadius: 3 }}>$5</span> faqat bugun!
              </p>
            )}
          </Preview>
        </div>
        <Fact delay="delay-4">
          Mumkin bo'lsa, har doim <b>semantik</b> teglarni (header, main, footer) ishlating. <span className="mono">{'<div>'}</span> va <span className="mono">{'<span>'}</span> esa mos teg yo'q joylarda yordamga keladi.
        </Fact>
      </div>
    </Stage>
  );
};

// SCREEN 7 — MCQ #2 [SCORED]
const Screen7 = (props) => (
  <QuestionScreen {...props} idx={7} scope="practice" eyebrow="Mashq · 2-savol"
    questionText="Paragraf ichida bitta so'zni belgilash uchun qaysi teg ishlatiladi?"
    question={
      <>
        <p className="eyebrow" style={{ color: T.accent }}>div yoki span?</p>
        <h2 className="title h-sub" style={{ marginTop: 8 }}>
          Paragraf ichida bitta so'zni belgilash uchun qaysi teg ishlatiladi?
        </h2>
      </>
    }
    options={['<div>', '<span>', '<section>', '<main>']} correctIdx={1}
    explainCorrect="To'g'ri. <span> qator ichida ishlaydi va qatorni buzmaydi — bitta so'z yoki kichik qismni belgilash uchun ideal."
    explainWrong={{
      0: '<div> yangi qatordan boshlanadi va butun qatorni egallaydi. Paragraf ichida ishlatilsa, matn buzilib qoladi.',
      2: '<section> — bu kattaroq mavzuli bo\u2019lim. Bitta so\u2019z uchun haddan ortiq.',
      3: '<main> — sahifaning asosiy qismi, bitta so\u2019z uchun emas.',
      default: 'Qator ichidagi kichik qism uchun <span> ishlatiladi.'
    }} />
);

// SCREEN 8 — FORMLAR KIRISH (functional rendered form)
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [touched, setTouched] = useState(storedAnswer !== undefined);

  const submit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    if (!touched) { setTouched(true); if (storedAnswer === undefined) onAnswer(8, { correct: true, picked: true }); }
    setTimeout(() => setSubmitted(false), 2200);
  };

  return (
    <Stage eyebrow="Formlar" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!touched} label={touched ? 'Davom etish' : 'Formani yuboring'} onClick={onNext} /></>}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(18px,3vw,22px)' }}>
        <h2 className="title h-title fade-up">
          Formlar — <span className="italic" style={{ color: T.accent }}>foydalanuvchidan ma'lumot</span>.
        </h2>
        <p className="body fade-up delay-1" style={{ color: T.ink2 }}>
          <b style={{ color: T.ink }}>Forma</b> — foydalanuvchidan ma'lumot to'plash uchun joy.
          Ro'yxatdan o'tish, kirish, izoh qoldirish — barchasi forma orqali.
          Asosiy teglar: <span className="mono">{'<form>'}</span>, <span className="mono">{'<input>'}</span>, <span className="mono">{'<label>'}</span>, <span className="mono">{'<button>'}</span>.
        </p>
        <Fact delay="delay-2">
          Forma ishlashi uchun yana <b>server</b> ham kerak — bu kelasi darslarda. Hozir biz faqat formaning ko'rinishi va HTML qismi bilan tanishamiz.
        </Fact>
        <div className="fade-up delay-3">
          <p className="eyebrow" style={{ color: T.ink2, margin: '0 0 10px' }}>Sinab ko'ring — quyidagi formani to'ldiring va Yuboring</p>
          <Preview minH={200}>
            <form onSubmit={submit} style={{ fontFamily: 'Georgia, serif', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: T.ink2, marginBottom: 4 }}>Ism:</label>
                <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Aziz"
                  style={{ width: '100%', padding: '8px 10px', border: `1px solid ${T.ink3}`, borderRadius: 6, fontSize: 14, fontFamily: 'inherit' }} />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 13, color: T.ink2, marginBottom: 4 }}>Email:</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="aziz@mail.com"
                  style={{ width: '100%', padding: '8px 10px', border: `1px solid ${T.ink3}`, borderRadius: 6, fontSize: 14, fontFamily: 'inherit' }} />
              </div>
              <button type="submit"
                style={{ alignSelf: 'flex-start', padding: '8px 18px', background: T.accent, color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', fontSize: 14 }}>
                Yuborish
              </button>
            </form>
            {submitted && (
              <div className="fade-step" style={{ marginTop: 12, padding: '8px 12px', background: T.successSoft, color: T.success, borderRadius: 6, fontFamily: 'JetBrains Mono', fontSize: 13, fontWeight: 600 }}>
                ✓ Forma yuborildi: {name || '(ism kiritilmadi)'} · {email || '(email kiritilmadi)'}
              </div>
            )}
          </Preview>
        </div>
        {touched && (
          <GoodNote label="Demo">
            Bu yerda Yuborish tugmasi faqat ko'rsatuv — haqiqiy saytda u ma'lumotni serverga jo'natadi va saqlaydi.
          </GoodNote>
        )}
      </div>
    </Stage>
  );
};

// SCREEN 9 — INPUT TURLARI (type chip selector)
const INPUT_TYPES = [
  { t: 'text', label: 'Oddiy matn', placeholder: 'Aziz' },
  { t: 'email', label: 'Email manzil', placeholder: 'aziz@mail.com' },
  { t: 'password', label: 'Parol (yashirin)', placeholder: '••••••' },
  { t: 'number', label: 'Raqam', placeholder: '14' },
  { t: 'checkbox', label: 'Belgilash', placeholder: '' },
  { t: 'radio', label: 'Tanlash', placeholder: '' }
];
const Screen9 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [typeIdx, setTypeIdx] = useState(0);
  const [touched, setTouched] = useState(storedAnswer !== undefined);
  const pick = (i) => {
    setTypeIdx(i);
    if (!touched) { setTouched(true); if (storedAnswer === undefined) onAnswer(9, { correct: true, picked: true }); }
  };
  const cur = INPUT_TYPES[typeIdx];
  const isCheck = cur.t === 'checkbox' || cur.t === 'radio';

  return (
    <Stage eyebrow="Input turlari" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!touched} label={touched ? 'Davom etish' : 'Bittasini tanlang'} onClick={onNext} /></>}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(18px,3vw,22px)' }}>
        <h2 className="title h-title fade-up">
          <span className="mono">{'<input>'}</span> — turli xil <span className="italic" style={{ color: T.accent }}>turlari</span>.
        </h2>
        <p className="body fade-up delay-1" style={{ color: T.ink2 }}>
          <span className="mono">{'<input>'}</span> tegining <span className="mono">type</span> atributi maydonning <b style={{ color: T.ink }}>turini</b> belgilaydi:
          oddiy matn, email, parol, raqam, belgilash va tanlash.
        </p>
        <div className="fade-up delay-2">
          <p className="eyebrow" style={{ color: T.ink2, margin: '0 0 10px' }}>Turini tanlang</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {INPUT_TYPES.map((it, i) => (
              <button key={it.t} className={`chip ${typeIdx === i ? 'chip-on' : ''}`} onClick={() => pick(i)}>
                <span className="mono small">type="{it.t}"</span>
              </button>
            ))}
          </div>
        </div>
        <div className="fade-up delay-3">
          <CodeBox>
            <Tg>{'<label>'}</Tg>{cur.label}<Pn>:</Pn><Tg>{'</label>'}</Tg>{'\n'}
            <Tg>{'<input '}</Tg><At>type</At><Pn>=</Pn><Sr>"{cur.t}"</Sr><Tg>{'>'}</Tg>
          </CodeBox>
        </div>
        <div className="fade-up delay-3">
          <Preview minH={70}>
            <div style={{ fontFamily: 'Georgia, serif' }}>
              <label style={{ display: 'block', fontSize: 13, color: T.ink2, marginBottom: 6 }}>{cur.label}:</label>
              {isCheck ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <input type={cur.t} name="demo" key={cur.t} style={{ width: 18, height: 18, accentColor: T.accent }} />
                  <span style={{ fontSize: 14, color: T.ink }}>Tanlangan</span>
                </div>
              ) : (
                <input type={cur.t} placeholder={cur.placeholder} key={cur.t}
                  style={{ width: '100%', maxWidth: 280, padding: '8px 10px', border: `1px solid ${T.ink3}`, borderRadius: 6, fontSize: 14, fontFamily: 'inherit' }} />
              )}
            </div>
          </Preview>
        </div>
        <Fact delay="delay-4">
          Parol (<span className="mono">password</span>) maydonida siz yozgan harflar avtomatik nuqtalarga aylanadi —
          bu boshqalar ekranga qarab qolsa, parolingizni ko'ra olmasligi uchun.
        </Fact>
      </div>
    </Stage>
  );
};

// SCREEN 10 — MCQ #3 [SCORED]
const Screen10 = (props) => (
  <QuestionScreen {...props} idx={10} scope="practice" eyebrow="Mashq · 3-savol"
    questionText='Parol kiritish maydoni uchun <input> ning qaysi turi to&#39;g&#39;ri?'
    question={
      <>
        <p className="eyebrow" style={{ color: T.accent }}>To'g'ri turini tanlang</p>
        <h2 className="title h-sub" style={{ marginTop: 8 }}>
          Parol kiritish maydoni uchun <span className="mono" style={{ color: T.ink }}>{'<input>'}</span> ning qaysi turi to'g'ri?
        </h2>
      </>
    }
    options={['type="text"', 'type="password"', 'type="hidden"', 'type="secret"']} correctIdx={1}
    explainCorrect={'To\u2019g\u2019ri. type="password" — siz yozgan harflar nuqtalarga aylanadi. Ekran ortidagilar parolni ko\u2019rmaydi.'}
    explainWrong={{
      0: 'type="text" oddiy matn maydoni — yozgan harflaringiz hammaga ko\u2019rinadi. Parol uchun xavfsiz emas.',
      2: 'type="hidden" — ko\u2019rinmaydigan maydon (orqada ishlaydi), parol uchun emas.',
      3: 'type="secret" mavjud emas — HTML\u2019da bunday tur yo\u2019q.',
      default: 'Parol uchun type="password" ishlatiladi.'
    }} />
);

// SCREEN 11 — DEVTOOLS KIRISH (F12 reveal animation)
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [opened, setOpened] = useState(false);
  const [tab, setTab] = useState('Elements');
  const touched = opened || storedAnswer !== undefined;

  const open = () => {
    setOpened(true);
    if (storedAnswer === undefined) onAnswer(11, { correct: true, picked: true });
  };

  return (
    <Stage eyebrow="DevTools" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!touched} label={touched ? 'Davom etish' : 'F12 ni bosing'} onClick={onNext} /></>}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(18px,3vw,22px)' }}>
        <h2 className="title h-title fade-up">
          DevTools — <span className="italic" style={{ color: T.accent }}>brauzer asboblari</span>.
        </h2>
        <p className="body fade-up delay-1" style={{ color: T.ink2 }}>
          DevTools — brauzerga o'rnatilgan <b style={{ color: T.ink }}>dasturchi asboblari</b>.
          Saytning HTML kodini ko'rish, o'zgartirish va xatolarni topish uchun ishlatiladi.
          Hech narsa o'rnatish kerak emas — Chrome, Safari, Firefox, Edge — barchasida bor.
        </p>
        <Fact delay="delay-2">
          Qanday ochish? <b>F12</b> tugmasini bosing · yoki sahifada o'ng tugma → <b>Inspect</b> · yoki <span className="mono">Ctrl + Shift + I</span> (Windows) / <span className="mono">Cmd + Option + I</span> (Mac).
        </Fact>
        <div className="dt-wrap fade-up delay-3">
          {/* Browser top */}
          <div className="dt-browser">
            <div className="bp-bar">
              <span className="bb-dots"><i /><i /><i /></span>
              <span className="bp-title">mening-saytim.uz</span>
            </div>
            <div className={`dt-page ${opened ? 'small' : ''}`}>
              <h3 style={{ fontFamily: 'Georgia, serif', margin: '0 0 6px', color: T.ink }}>Salom!</h3>
              <p style={{ fontFamily: 'Georgia, serif', margin: 0, fontSize: 13, color: T.ink2 }}>Bu mening saytim.</p>
            </div>
          </div>
          {/* DevTools panel (revealed) */}
          <div className={`dt-panel ${opened ? 'show' : ''}`}>
            <div className="dt-tabs">
              {['Elements', 'Console', 'Sources', 'Network'].map(t => (
                <button key={t} className={`dt-tab ${tab === t ? 'on' : ''}`} onClick={() => setTab(t)}>{t}</button>
              ))}
            </div>
            <div className="dt-body">
              {tab === 'Elements' && (
                <pre style={{ margin: 0, fontFamily: 'JetBrains Mono', fontSize: 12, color: '#d4d4d4', lineHeight: 1.5 }}>
{`<html>
  <head>...</head>
  <body>
    `}<span style={{ color: CODE.tag }}>{'<h3>'}</span>Salom!<span style={{ color: CODE.tag }}>{'</h3>'}</span>{`
    `}<span style={{ color: CODE.tag }}>{'<p>'}</span>Bu mening saytim.<span style={{ color: CODE.tag }}>{'</p>'}</span>{`
  </body>
</html>`}
                </pre>
              )}
              {tab === 'Console' && <p style={{ color: '#888', fontFamily: 'JetBrains Mono', fontSize: 12, margin: 0 }}>{'>'} Xabarlar va xatolar shu yerda ko'rinadi</p>}
              {tab === 'Sources' && <p style={{ color: '#888', fontFamily: 'JetBrains Mono', fontSize: 12, margin: 0 }}>Sayt fayllari (HTML, CSS, JS)</p>}
              {tab === 'Network' && <p style={{ color: '#888', fontFamily: 'JetBrains Mono', fontSize: 12, margin: 0 }}>Tarmoq so'rovlari kuzatiladi</p>}
            </div>
          </div>
          {/* F12 button overlay */}
          {!opened && (
            <button className="dt-f12-btn" onClick={open}>
              <span className="dt-key">F12</span> ni bosing
            </button>
          )}
        </div>
        {opened && (
          <GoodNote label="DevTools ochildi">
            Pastdagi panelda saytning HTML kodi ko'rinadi. Tab'larni almashtirib ko'ring — Elements eng ko'p ishlatiladigan.
          </GoodNote>
        )}
      </div>
    </Stage>
  );
};

// SCREEN 12 — DEVTOOLS 3 QADAM (step-by-step walkthrough)
const DT_STEPS = [
  { t: 'Element ustiga bosing', d: 'Saytdagi har qanday matn yoki rasmga sichqoncha bilan o\u2019ng tugma bosing → "Inspect" tanlang.' },
  { t: 'Kodda topiladi', d: 'Elements tab\u2019da o\u2019sha tegga avtomatik o\u2019tiladi va u rangli ramka bilan belgilanadi.' },
  { t: 'Tahrir qiling, natijani ko\u2019ring', d: 'Matnni o\u2019zgartirsangiz — sahifada darhol o\u2019zgaradi. Bu vaqtinchalik — sahifa qayta yuklansa, asl holatga qaytadi.' }
];
const Screen12 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(storedAnswer !== undefined);
  const advance = () => {
    if (step < 3) {
      const ns = step + 1;
      setStep(ns);
      if (ns === 3) { setDone(true); if (storedAnswer === undefined) onAnswer(12, { correct: true, picked: true }); }
    }
  };
  return (
    <Stage eyebrow="DevTools · 3 qadam" screen={screen} navContent={
      <>
        <NavBack onPrev={onPrev} />
        {step < 3
          ? <button className="btn" onClick={advance} style={{ marginLeft: 'auto', padding: 'clamp(12px,2vw,14px) clamp(24px,3vw,32px)', fontSize: 'clamp(14px,1.8vw,16px)' }}>Keyingi qadam →</button>
          : <NavNext disabled={!done} onClick={onNext} />}
      </>
    }>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(18px,3vw,22px)' }}>
        <h2 className="title h-title fade-up">
          DevTools'da <span className="italic" style={{ color: T.accent }}>kodni o'rganish</span>.
        </h2>
        <p className="body fade-up delay-1" style={{ color: T.ink2 }}>
          Pastdagi simulyatsiyada ko'rsatamiz — "Keyingi qadam"ni bosib qadamlarni kuzating.
        </p>
        {/* Simulation */}
        <div className="dt-sim fade-up delay-2">
          <div className="dt-sim-page">
            <p className="mono small" style={{ color: T.ink3, margin: '0 0 6px' }}>mening-saytim.uz</p>
            <h3 className={`sim-target ${step >= 1 ? 'sim-hi' : ''}`}
              style={{ fontFamily: 'Georgia, serif', margin: 0, fontSize: 18 }}>
              {step >= 3 ? "O'zgartirilgan sarlavha!" : 'Salom!'}
            </h3>
          </div>
          <div className="dt-sim-code">
            <p className="mono small" style={{ color: '#888', margin: '0 0 6px' }}>Elements tab</p>
            <pre className={`sim-codeline ${step >= 2 ? 'sim-hi' : ''}`} style={{ margin: 0, fontFamily: 'JetBrains Mono', fontSize: 13, color: '#d4d4d4' }}>
              <span style={{ color: CODE.tag }}>{'<h3>'}</span>{step >= 3 ? "O'zgartirilgan sarlavha!" : 'Salom!'}<span style={{ color: CODE.tag }}>{'</h3>'}</span>
            </pre>
          </div>
        </div>
        {/* Steps cards */}
        <div className="fade-step" key={step}>
          <div className="frame" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span className="mono" style={{ fontSize: 'clamp(28px,6vw,44px)', color: T.accent, fontWeight: 700, lineHeight: 1 }}>{step}</span>
            <div>
              <p className="title" style={{ fontSize: 'clamp(18px,2.5vw,22px)', margin: 0 }}>{DT_STEPS[step - 1].t}</p>
              <p className="body" style={{ margin: '4px 0 0', color: T.ink2 }}>{DT_STEPS[step - 1].d}</p>
            </div>
          </div>
        </div>
        {step === 3 && (
          <GoodNote label="Endi siz ham qila olasiz">
            Bu ko'nikma juda foydali: AI yozgan kodni tushunish, xatolarni topish, boshqa saytlardan o'rganish — barchasida yordam beradi.
          </GoodNote>
        )}
      </div>
    </Stage>
  );
};

// SCREEN 13 — AI ESLATMA (DevTools sizniki)
const Screen13 = ({ screen, onNext, onPrev }) => (
  <Stage eyebrow="Kichik eslatma" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext label="Tushundim, davom etish" onClick={onNext} /></>}>
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(18px,3vw,24px)' }}>
      <h2 className="title h-title fade-up">
        AI sizga yordam beradi —<br /><span className="italic" style={{ color: T.accent }}>lekin DevTools sizniki</span>.
      </h2>
      <p className="body fade-up delay-1" style={{ color: T.ink2 }}>
        Murakkab forma yoki sahifa kerakmi? AI'dan so'rasangiz, <b style={{ color: T.accent }}>kod beradi</b>.
      </p>
      <p className="body fade-up delay-2" style={{ color: T.ink2 }}>
        Lekin <b style={{ color: T.ink }}>DevTools</b> — bu sizning o'zingiz tushunishingiz va xatolarni topishingiz uchun.
        AI yozgan kod ham xato beradi — uni o'zingiz tahlil qila olishingiz kerak.
      </p>
      <p className="body fade-up delay-3" style={{ color: T.ink2 }}>
        Yaxshi dasturchi bo'lish uchun <b style={{ color: T.accent }}>ikkalasini</b> ham bilish kerak: qo'lda yozish + DevTools + AI yordami.
      </p>
      <div className="ai-highlight fade-up delay-4">
        <div className="ai-bulb">🛠</div>
        <p className="ai-h">Qo'lda + DevTools + AI</p>
        <p className="ai-sub">Uchchalasi ham kerak</p>
      </div>
    </div>
  </Stage>
);

// SCREEN 14 — BUILDER (semantic page with new elements)
const B2_ITEMS = [
  { id: 'header', label: 'Header', short: 'header' },
  { id: 'img', label: 'Rasm', short: 'img' },
  { id: 'main', label: 'Main + matn', short: 'main' },
  { id: 'form', label: 'Mini forma', short: 'form' },
  { id: 'footer', label: 'Footer', short: 'footer' }
];
const renderB2 = (id, name) => {
  switch (id) {
    case 'header':
      return {
        code: <><Tg>{'<header>'}</Tg>{'\n  '}<Tg>{'<h1>'}</Tg>{name || 'Mening saytim'}<Tg>{'</h1>'}</Tg>{'\n'}<Tg>{'</header>'}</Tg></>,
        view: <header style={{ borderBottom: `1px solid ${T.ink3}40`, paddingBottom: 8, marginBottom: 10 }}>
          <h1 style={{ fontFamily: 'Georgia, serif', margin: 0, fontSize: 'clamp(18px,3vw,24px)', color: T.ink }}>{name || 'Mening saytim'}</h1>
        </header>
      };
    case 'img':
      return {
        code: <><Tg>{'<img '}</Tg><At>src</At><Pn>=</Pn><Sr>"tog.jpg"</Sr> <At>alt</At><Pn>=</Pn><Sr>"Tog' surati"</Sr> <At>width</At><Pn>=</Pn><Sr>"200"</Sr><Tg>{'>'}</Tg></>,
        view: <div style={{ marginBottom: 10 }}><SvgMountain size={180} /></div>
      };
    case 'main':
      return {
        code: <><Tg>{'<main>'}</Tg>{'\n  '}<Tg>{'<p>'}</Tg>Bu mening birinchi saytim. HTML asoslarini o'rgandim.<Tg>{'</p>'}</Tg>{'\n'}<Tg>{'</main>'}</Tg></>,
        view: <main style={{ marginBottom: 10 }}>
          <p style={{ fontFamily: 'Georgia, serif', margin: 0, color: T.ink, fontSize: 'clamp(14px,1.9vw,16px)' }}>Bu mening birinchi saytim. HTML asoslarini o'rgandim.</p>
        </main>
      };
    case 'form':
      return {
        code: <><Tg>{'<form>'}</Tg>{'\n  '}<Tg>{'<label>'}</Tg>Ism<Tg>{'</label>'}</Tg>{'\n  '}<Tg>{'<input '}</Tg><At>type</At><Pn>=</Pn><Sr>"text"</Sr><Tg>{'>'}</Tg>{'\n  '}<Tg>{'<button>'}</Tg>Yuborish<Tg>{'</button>'}</Tg>{'\n'}<Tg>{'</form>'}</Tg></>,
        view: <form onSubmit={e => e.preventDefault()} style={{ marginBottom: 10, display: 'flex', gap: 6, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div>
            <label style={{ display: 'block', fontSize: 11, color: T.ink2, fontFamily: 'Georgia, serif' }}>Ism</label>
            <input type="text" placeholder="..." style={{ padding: '5px 8px', border: `1px solid ${T.ink3}`, borderRadius: 4, fontSize: 13, fontFamily: 'Georgia, serif' }} />
          </div>
          <button style={{ padding: '6px 14px', background: T.accent, color: '#fff', border: 'none', borderRadius: 4, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Yuborish</button>
        </form>
      };
    case 'footer':
      return {
        code: <><Tg>{'<footer>'}</Tg>{'\n  '}<Tg>{'<p>'}</Tg>© 2025 {name || 'Mening saytim'}<Tg>{'</p>'}</Tg>{'\n'}<Tg>{'</footer>'}</Tg></>,
        view: <footer style={{ borderTop: `1px solid ${T.ink3}40`, paddingTop: 8, marginTop: 4 }}>
          <p style={{ fontFamily: 'Georgia, serif', margin: 0, fontSize: 12, color: T.ink3 }}>© 2025 {name || 'Mening saytim'}</p>
        </footer>
      };
    default: return null;
  }
};
const Screen14 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [name, setName] = useState('');
  const [added, setAdded] = useState([]);
  const [done, setDone] = useState(storedAnswer !== undefined);
  const MAX = 6;
  const add = (id) => {
    if (added.length >= MAX) return;
    const next = [...added, id];
    setAdded(next);
    if (next.length >= 3 && !done) { setDone(true); if (storedAnswer === undefined) onAnswer(14, { correct: true, picked: true }); }
  };
  const reset = () => setAdded([]);
  return (
    <Stage eyebrow="Amaliyot · to'liq sahifa" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Kamida 3 ta element qo'shing (${added.length}/3)`} onClick={onNext} /></>}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(16px,3vw,22px)' }}>
        <h2 className="title h-title fade-up">
          To'liq <span className="italic" style={{ color: T.accent }}>semantik sahifa</span> yarating.
        </h2>
        <p className="body fade-up delay-1" style={{ color: T.ink2 }}>
          1-darsdagi sahifangizni kengaytiring: rasm, semantik teglar va forma qo'shing.
          Kamida 3 ta element qo'shsangiz davom etishingiz mumkin.
        </p>
        <div className="fade-up delay-2">
          <p className="eyebrow" style={{ color: T.ink2, margin: '0 0 8px' }}>Saytingiz nomi (header uchun)</p>
          <input className="text-input" value={name} onChange={e => setName(e.target.value)} maxLength={28} placeholder="Masalan: Aziz blog" />
        </div>
        <div className="fade-up delay-2">
          <p className="eyebrow" style={{ color: T.ink2, margin: '0 0 10px' }}>Element qo'shing</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {B2_ITEMS.map(it => (
              <button key={it.id} className="chip" disabled={added.length >= MAX} onClick={() => add(it.id)}>
                + {it.label} <span className="mono small" style={{ color: T.ink3 }}>({it.short})</span>
              </button>
            ))}
            {added.length > 0 && (
              <button className="chip" style={{ borderColor: T.ink3, color: T.ink2 }} onClick={reset}>↺ Tozalash</button>
            )}
          </div>
        </div>
        <div className="fade-up delay-3">
          <CodeBox>
            <Tg>{'<body>'}</Tg>{'\n'}
            {added.length === 0 && <><Cm>{'  <!-- elementlar shu yerga -->'}</Cm>{'\n'}</>}
            {added.map((id, i) => {
              const el = renderB2(id, name);
              return <React.Fragment key={i}>{'  '}{el.code}{'\n'}</React.Fragment>;
            })}
            <Tg>{'</body>'}</Tg>
          </CodeBox>
        </div>
        <div className="fade-up delay-3">
          <Preview minH={120}>
            {added.length === 0
              ? <p style={{ color: T.ink3, fontStyle: 'italic', margin: 0, fontFamily: 'Georgia, serif' }}>Bo'sh sahifa — element qo'shing...</p>
              : added.map((id, i) => <React.Fragment key={i}>{renderB2(id, name).view}</React.Fragment>)}
          </Preview>
        </div>
        {done && added.length >= 3 && (
          <GoodNote label="Semantik sahifa tayyor">
            Endi sahifangizning tuzilishi aniq: header, main, forma, footer — har biri o'z joyida.
            Uy vazifasida bularning hammasini qo'lda yozasiz.
          </GoodNote>
        )}
      </div>
    </Stage>
  );
};

// SCREEN 15 — MCQ FINAL [SCORED · scope:'final']
const Screen15 = (props) => (
  <QuestionScreen {...props} idx={15} scope="final" eyebrow="Yakuniy tekshiruv"
    questionText="Sayt yuqori qismi (logo va asosiy sarlavha) uchun qaysi semantik teg ishlatiladi?"
    question={
      <>
        <p className="eyebrow" style={{ color: T.accent }}>So'nggi savol</p>
        <h2 className="title h-sub" style={{ marginTop: 8 }}>
          Sayt yuqori qismi (logo va asosiy sarlavha) uchun qaysi semantik teg ishlatiladi?
        </h2>
      </>
    }
    options={['<div>', '<header>', '<top>', '<section>']} correctIdx={1}
    explainCorrect="To'g'ri. <header> — sayt yuqori qismi uchun maxsus semantik teg. Brauzer va qidiruv tizimlari uning ma'nosini tushunadi."
    explainWrong={{
      0: '<div> ham ishlatish mumkin, lekin u semantik emas. <header> aniqroq va to\u2019g\u2019riroq.',
      2: '<top> mavjud emas — bunday teg yo\u2019q.',
      3: '<section> — mavzuli bo\u2019lim uchun, sayt yuqori qismi uchun emas.',
      default: 'Sayt yuqori qismi uchun <header> ishlatiladi.'
    }} />
);

// SCREEN 16 — YAKUN + UY VAZIFASI
const IconCoin = ({ s = 24, c = T.accent }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v10M9.5 9.2c0-1 1.1-1.6 2.5-1.6s2.5.6 2.5 1.7c0 2.4-5 1.3-5 3.7 0 1.1 1.1 1.7 2.5 1.7s2.5-.6 2.5-1.6" strokeLinecap="round" />
  </svg>
);
const Screen16 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const correct = SCORED_IDX.filter(i => answers[i]?.correct).length;
  const total = SCORED_IDX.length;
  const coins = correct * COIN_PER;
  return (
    <Stage eyebrow="Tayyor" screen={screen} navContent={
      <>
        <NavBack onPrev={onPrev} />
        <button className="btn btn-ghost" onClick={onReset}
          style={{ padding: 'clamp(12px,2vw,14px) clamp(18px,2.5vw,24px)', fontSize: 'clamp(14px,1.8vw,16px)' }}>
          Qaytadan
        </button>
        <button className="btn" onClick={onFinish}
          style={{ padding: 'clamp(12px,2vw,14px) clamp(24px,3vw,32px)', fontSize: 'clamp(14px,1.8vw,16px)', marginLeft: 'auto' }}>
          Keyingi dars →
        </button>
      </>
    }>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(16px,3vw,22px)' }}>
        <div className="fade-up">
          <p className="eyebrow" style={{ color: T.accent }}>Dars tugadi</p>
          <h2 className="title h-title" style={{ marginTop: 10 }}>
            Endi siz <br /><span className="italic">to'liq sahifa yaratasiz</span>.
          </h2>
        </div>
        <div className="frame fade-up delay-1" style={{ textAlign: 'center' }}>
          <p className="eyebrow" style={{ color: T.ink3, margin: 0 }}>To'g'ri javoblar</p>
          <div className="display" style={{ fontSize: 'clamp(72px,14vw,128px)', marginTop: 6 }}>
            <span style={{ color: correct >= total * 0.7 ? T.success : T.accent }}>{correct}</span>
            <span style={{ color: T.ink3 }}>/{total}</span>
          </div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 6, background: T.accentSoft, padding: '8px 16px', borderRadius: 99 }}>
            <IconCoin s={20} />
            <span className="mono" style={{ color: T.accent, fontWeight: 700, fontSize: 16 }}>+{coins} coin</span>
          </div>
          <p className="body" style={{ color: T.ink2, marginTop: 12 }}>
            {correct >= total * 0.85 && 'Ajoyib! Hammasini tushundingiz.'}
            {correct >= total * 0.6 && correct < total * 0.85 && 'Yaxshi! Bir-ikki joyni takrorlasangiz bo\u2019ldi.'}
            {correct < total * 0.6 && 'Darsni yana bir bor ko\u2019rib chiqsangiz foydali bo\u2019ladi.'}
          </p>
        </div>
        <div className="frame-soft fade-up delay-2">
          <p className="eyebrow" style={{ color: T.accent, margin: 0 }}>📝 Uyga vazifa</p>
          <p className="body" style={{ margin: '8px 0 12px', color: T.ink }}>1-darsdagi sahifangizni kengaytiring:</p>
          <ul style={{ ...UL_STYLE, color: T.ink2, fontSize: 'clamp(14px,1.9vw,16px)' }}>
            <li><b style={{ color: T.ink }}>Rasm qo'shing</b> — <span className="mono">{'<img>'}</span> bilan (src va alt bilan)</li>
            <li><b style={{ color: T.ink }}>Semantik teglar</b> ishlatib qayta tuzing — header, main, footer</li>
            <li><b style={{ color: T.ink }}>Kichik forma</b> qo'shing — ism, email, tugma</li>
            <li><b style={{ color: T.ink }}>DevTools oching</b> — har bir tegingizni toping va ko'rib chiqing</li>
          </ul>
          <p className="small" style={{ margin: '12px 0 0', color: T.accent, fontWeight: 700 }}>⚠ Yana qo'lda yozing — AI'siz!</p>
        </div>
        <div className="fade-up delay-3 frame" style={{ background: T.bg }}>
          <p className="eyebrow" style={{ color: T.accent, margin: 0 }}>Kalit so'zlar</p>
          <ul style={{ ...UL_STYLE, marginTop: 12, color: T.ink2 }}>
            <li><b style={{ color: T.ink }}>{'<img>'}</b> — src, alt, width, height</li>
            <li><b style={{ color: T.ink }}>Semantik teglar</b> — header, nav, main, section, article, footer</li>
            <li><b style={{ color: T.ink }}>{'<div>'}, {'<span>'}</b> — umumiy konteynerlar (semantik emas)</li>
            <li><b style={{ color: T.ink }}>Forma</b> — form, input, label, button</li>
            <li><b style={{ color: T.ink }}>Input turlari</b> — text, email, password, number, checkbox, radio</li>
            <li><b style={{ color: T.ink }}>DevTools</b> — F12 yoki Inspect, Elements tab</li>
          </ul>
        </div>
      </div>
    </Stage>
  );
};

// ============================================================
// MAIN — корневой компонент. Получает onFinished от LMS.
// ============================================================
export default function HtmlLesson2({ onFinished }) {
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
      coins: correctAnswers * COIN_PER,
      finalScore: finalCorrect,
      finalTotal: finalMeta.length,
      passed: finalMeta.length
        ? finalCorrect / finalMeta.length >= 0.6
        : (scoredMeta.length ? correctAnswers / scoredMeta.length >= 0.6 : false),
      answers: SCREEN_META.map((s, i) => answers[i]).filter(Boolean)
    };
    if (typeof onFinished === 'function') onFinished(payload);
  };

  const screens = [Screen0, Screen1, Screen2, Screen3, Screen4, Screen5, Screen6, Screen7, Screen8, Screen9, Screen10, Screen11, Screen12, Screen13, Screen14, Screen15, Screen16];
  const Current = screens[screen];
  return (
    <>
      <style>{`
        /* Шрифты приходят от LMS (Manrope, Fraunces, JetBrains Mono).
           Для standalone-предпросмотра можно временно раскомментировать строку ниже: */
        /* @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500&family=JetBrains+Mono:wght@400;500;700&display=swap'); */
        html, body { margin: 0; padding: 0; }
        .lesson-root, .lesson-root * { box-sizing: border-box; }
        .lesson-root { font-family: 'Manrope', system-ui, sans-serif; color: ${T.ink}; background: ${T.bg}; height: 100dvh; overflow: hidden; -webkit-font-smoothing: antialiased; }

        /* CRITICAL FIX: ensure list markers always show in previews */
        .bp-body ul { list-style-type: disc; list-style-position: outside; padding-left: 26px; }
        .bp-body ol { list-style-type: decimal; list-style-position: outside; padding-left: 26px; }
        .bp-body li { display: list-item; }

        .title { font-family: 'Fraunces', serif; font-weight: 400; line-height: 1.0; letter-spacing: -0.02em; font-variation-settings: "opsz" 144; }
        .display { font-family: 'Fraunces', serif; font-weight: 400; line-height: 0.9; letter-spacing: -0.03em; font-variation-settings: "opsz" 144; }
        .italic { font-style: italic; }
        .mono { font-family: 'JetBrains Mono', monospace; }

        @keyframes fade-in-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fade-in-up 0.4s ease-out forwards; opacity: 0; }
        .delay-1 { animation-delay: 0.10s; } .delay-2 { animation-delay: 0.20s; }
        .delay-3 { animation-delay: 0.30s; } .delay-4 { animation-delay: 0.40s; }
        @keyframes fade-step { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .fade-step { animation: fade-step 0.35s ease-out; }

        .feedback-block { max-height: 0; opacity: 0; overflow: hidden; transition: max-height 0.4s ease-out, opacity 0.3s ease-out 0.1s, margin-top 0.4s ease-out; margin-top: 0; }
        .feedback-block.visible { max-height: 600px; opacity: 1; margin-top: clamp(16px,2.5vw,24px); }

        .factbox { background: ${T.paper}; border: 1px dashed ${T.accent}; border-radius: 12px; padding: clamp(14px,3vw,20px); }
        .factbox-label { font-family: 'Manrope'; font-weight: 800; font-size: 11px; letter-spacing: 0.14em; text-transform: uppercase; color: ${T.accent}; }

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

        .chip { font-family: 'Manrope', sans-serif; font-weight: 600; font-size: clamp(13px,1.7vw,15px); display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px; border-radius: 99px; border: 1.5px solid ${T.ink}; background: ${T.paper}; color: ${T.ink}; cursor: pointer; transition: all 0.18s; }
        .chip:hover:not(:disabled) { transform: translateY(-1px); }
        .chip-on { background: ${T.accent}; border-color: ${T.accent}; color: #fff; }
        .chip:disabled { opacity: 0.4; cursor: not-allowed; }

        .text-input { width: 100%; font-family: 'JetBrains Mono', monospace; font-size: clamp(15px,2vw,17px); font-weight: 500; padding: 12px 14px; border: 1.5px solid ${T.ink}; border-radius: 10px; background: ${T.paper}; color: ${T.ink}; outline: none; transition: border-color 0.2s; }
        .text-input:focus { border-color: ${T.accent}; }

        .code-box { background: ${CODE.bg}; color: ${CODE.text}; font-family: 'JetBrains Mono', monospace; font-size: clamp(13px,1.85vw,15px); line-height: 1.6; padding: clamp(14px,3vw,20px); border-radius: 12px; overflow-x: auto; white-space: pre-wrap; word-break: break-word; margin: 0; }
        .bp-window { border: 1.5px solid ${T.ink}; border-radius: 12px; overflow: hidden; background: #fff; }
        .bp-bar { background: #f0eee8; padding: 8px 12px; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid ${T.ink}30; }
        .bp-title { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink3}; }
        .bp-body { padding: clamp(14px,3vw,20px); }

        .topics { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
        .topic-item { display: flex; align-items: center; gap: 14px; padding: 12px 16px; background: ${T.paper}; border-radius: 10px; border: 1px solid ${T.ink3}40; }
        .topic-num { font-family: 'JetBrains Mono'; font-weight: 700; font-size: clamp(13px,1.8vw,15px); color: ${T.accent}; min-width: 26px; }
        .topic-text { font-family: 'Manrope'; font-weight: 500; color: ${T.ink}; font-size: clamp(14px,1.9vw,16px); }

        .sk-part { padding: 1px 4px; border-radius: 4px; cursor: pointer; transition: background 0.2s; }
        .sk-part:hover { background: rgba(255,79,40,0.18); }
        .sk-part.seen { background: rgba(255,79,40,0.10); }
        .sk-part.active { background: ${T.accent}; }
        .sk-part.active span { color: #fff !important; }

        /* Wireframe (Screen 4) */
        .wireframe { display: grid; grid-template-columns: 2fr 1fr; grid-template-rows: auto auto 1fr auto; grid-template-areas: 'h h' 'n n' 'm a' 'f f'; gap: 8px; padding: 10px; background: ${T.paper}; border: 1.5px solid ${T.ink}; border-radius: 12px; min-height: 280px; }
        .wf-zone { display: flex; align-items: center; justify-content: center; padding: 16px 12px; background: ${T.bg}; border: 1.5px dashed ${T.ink3}; border-radius: 8px; cursor: pointer; font-family: 'JetBrains Mono'; font-weight: 700; color: ${T.ink2}; transition: all 0.2s; font-size: clamp(13px,1.9vw,16px); }
        .wf-zone:hover { border-style: solid; border-color: ${T.accent}; color: ${T.accent}; }
        .wf-zone.seen { border-color: ${T.accent}80; color: ${T.accent}; background: ${T.accentSoft}; border-style: solid; }
        .wf-zone.active { background: ${T.accent}; border-color: ${T.accent}; color: #fff; }
        .wf-zone[style*="grid-area: m"] { min-height: 90px; }

        /* Slider */
        input[type="range"].sl { -webkit-appearance: none; appearance: none; width: 100%; height: 3px; background: ${T.ink}; outline: none; margin: 12px 0 6px; border-radius: 99px; }
        input[type="range"].sl::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 24px; height: 24px; background: ${T.accent}; border-radius: 50%; cursor: grab; border: 3px solid ${T.bg}; box-shadow: 0 0 0 1.5px ${T.ink}; }
        input[type="range"].sl::-webkit-slider-thumb:active { cursor: grabbing; transform: scale(1.12); }

        /* DevTools mock (Screen 11) */
        .dt-wrap { position: relative; border: 1.5px solid ${T.ink}; border-radius: 12px; overflow: hidden; background: #fff; }
        .dt-browser { position: relative; }
        .dt-page { padding: clamp(18px,4vw,26px); min-height: 120px; transition: all 0.5s cubic-bezier(.2,.7,.2,1); }
        .dt-page.small { min-height: 80px; padding: clamp(12px,3vw,18px); }
        .dt-panel { background: #1A1A1A; max-height: 0; overflow: hidden; transition: max-height 0.6s cubic-bezier(.2,.7,.2,1); border-top: 1px solid #333; }
        .dt-panel.show { max-height: 320px; }
        .dt-tabs { display: flex; gap: 0; background: #2A2A2A; border-bottom: 1px solid #333; }
        .dt-tab { font-family: 'Manrope'; background: transparent; border: none; color: #aaa; padding: 8px 14px; font-size: 12px; font-weight: 600; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.15s; }
        .dt-tab:hover { color: #fff; }
        .dt-tab.on { color: #fff; border-bottom-color: ${T.accent}; background: #1A1A1A; }
        .dt-body { padding: 12px 14px; min-height: 100px; }
        .dt-f12-btn { position: absolute; right: 12px; bottom: 12px; background: ${T.accent}; color: #fff; border: none; padding: 8px 14px; border-radius: 8px; font-family: 'Manrope'; font-weight: 700; font-size: 13px; cursor: pointer; box-shadow: 0 4px 14px rgba(255,79,40,0.35); display: inline-flex; align-items: center; gap: 6px; }
        .dt-key { background: #fff; color: ${T.accent}; padding: 2px 8px; border-radius: 4px; font-family: 'JetBrains Mono'; font-weight: 700; font-size: 12px; }

        /* DevTools simulation (Screen 12) */
        .dt-sim { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; min-height: 140px; }
        .dt-sim-page, .dt-sim-code { padding: 14px; border-radius: 10px; transition: all 0.3s; }
        .dt-sim-page { background: #fff; border: 1.5px solid ${T.ink}; }
        .dt-sim-code { background: #1A1A1A; border: 1.5px solid #333; }
        .sim-target { transition: all 0.4s; padding: 2px 4px; border-radius: 3px; }
        .sim-target.sim-hi { background: rgba(255,79,40,0.18); outline: 2px dashed ${T.accent}; outline-offset: 2px; }
        .sim-codeline { padding: 4px 6px; border-radius: 3px; transition: all 0.4s; }
        .sim-codeline.sim-hi { background: rgba(255,79,40,0.22); }
        @media (max-width: 480px) { .dt-sim { grid-template-columns: 1fr; } }

        .ai-highlight { background: ${T.accentSoft}; border-radius: 18px; padding: clamp(24px,5vw,36px); text-align: center; border: 1.5px solid ${T.accent}30; }
        .ai-bulb { font-size: clamp(40px,8vw,60px); margin-bottom: 10px; line-height: 1; }
        .ai-h { font-family: 'Fraunces', serif; font-size: clamp(22px,4vw,30px); font-weight: 500; color: ${T.ink}; margin: 0 0 6px; }
        .ai-sub { font-family: 'JetBrains Mono', monospace; font-size: clamp(13px,1.7vw,15px); color: ${T.ink2}; margin: 0; font-style: italic; }

        .h-title { font-size: clamp(28px,5vw,52px); }
        .h-sub { font-size: clamp(20px,3vw,28px); }
        .body { font-size: clamp(15px,1.9vw,18px); line-height: 1.55; }
        .eyebrow { font-size: clamp(11px,1.3vw,13px); letter-spacing: 0.18em; text-transform: uppercase; font-weight: 700; }
        .small { font-size: clamp(13px,1.5vw,15px); }

        .stage { max-width: 720px; margin: 0 auto; height: 100dvh; display: flex; flex-direction: column; }
        .stage-content { flex: 1; padding: clamp(20px,4vw,40px) clamp(20px,4vw,32px); display: flex; flex-direction: column; overflow-y: auto; overflow-x: hidden; -webkit-overflow-scrolling: touch; }
        .stage-nav { flex-shrink: 0; background: ${T.bg}; border-top: 1px solid ${T.ink3}40; padding: clamp(14px,2.5vw,18px) clamp(20px,4vw,32px); display: flex; gap: 12px; }

        .chrome { display: flex; align-items: center; justify-content: space-between; margin-bottom: clamp(20px,3vw,32px); }
        .chrome-left { display: flex; align-items: center; gap: 10px; color: ${T.ink2}; }
        .dot { width: 7px; height: 7px; border-radius: 50%; background: ${T.accent}; }

        .progress-track { height: 3px; background: ${T.ink3}40; width: 100%; margin-bottom: 24px; border-radius: 99px; overflow: hidden; }
        .progress-bar { height: 100%; background: ${T.accent}; transition: width 0.5s cubic-bezier(.4,0,.2,1); border-radius: 99px; }

        .frame { background: ${T.paper}; border: 1.5px solid ${T.ink}; border-radius: 16px; padding: clamp(18px,4vw,28px); }
        .frame-soft { background: ${T.accentSoft}; border-left: 4px solid ${T.accent}; border-radius: 12px; padding: clamp(16px,3vw,24px); }
        .frame-success { background: ${T.successSoft}; border-left: 4px solid ${T.success}; border-radius: 12px; padding: clamp(16px,3vw,24px); }

        .bb-dots { display: flex; gap: 5px; }
        .bb-dots i { width: 9px; height: 9px; border-radius: 50%; }
        .bb-dots i:first-child{ background:#ff5f57; } .bb-dots i:nth-child(2){ background:#febc2e; } .bb-dots i:nth-child(3){ background:#28c840; }
      `}</style>
      <div className="lesson-root">
        <Current screen={screen} storedAnswer={answers[screen]} answers={answers} onAnswer={recordAnswer} onNext={next} onPrev={prev} onReset={reset} onFinish={finishLesson} />
      </div>
    </>
  );
}