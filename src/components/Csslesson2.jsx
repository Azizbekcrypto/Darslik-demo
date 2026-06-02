import React, { useState, useEffect, useRef } from 'react';

// CSS 2-DARS · Layout, Flexbox, DevTools · 17 ekran · 12–17 yosh · siz murojaati
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
  lessonId: 'css-02-v1',
  lessonTitle: 'Layout, Flexbox va DevTools'
};
const SCREEN_META = [
  { id: 's0',  type: 'hook',           template: 'choice',  scored: false, scope: 'hook' },
  { id: 's1',  type: 'plan',           template: 'custom',  scored: false, scope: null },
  { id: 's2',  type: 'wireframe',      template: 'custom',  scored: false, scope: null },
  { id: 's3',  type: 'toggle-explore', template: 'custom',  scored: false, scope: null },
  { id: 's4',  type: 'test',           template: 'choice',  scored: true,  scope: 'practice' },
  { id: 's5',  type: 'toggle-explore', template: 'custom',  scored: false, scope: null },
  { id: 's6',  type: 'live-explore',   template: 'custom',  scored: false, scope: null },
  { id: 's7',  type: 'test',           template: 'choice',  scored: true,  scope: 'practice' },
  { id: 's8',  type: 'live-explore',   template: 'custom',  scored: false, scope: null },
  { id: 's9',  type: 'slider-explore', template: 'custom',  scored: false, scope: null },
  { id: 's10', type: 'test',           template: 'choice',  scored: true,  scope: 'practice' },
  { id: 's11', type: 'devtools-sim',   template: 'custom',  scored: false, scope: null },
  { id: 's12', type: 'devtools-reveal',template: 'custom',  scored: false, scope: null },
  { id: 's13', type: 'prompt-explore', template: 'custom',  scored: false, scope: null },
  { id: 's14', type: 'builder',        template: 'custom',  scored: false, scope: null },
  { id: 's15', type: 'test',           template: 'choice',  scored: true,  scope: 'final' },
  { id: 's16', type: 'summary',        template: 'summary', scored: false, scope: null }
];
const SCORED_IDX = SCREEN_META.map((m, i) => (m.scored ? i : null)).filter(i => i !== null);

const TOPICS = [
  'Layout — sahifani joylashtirish',
  'display — block, inline, inline-block',
  'Flexbox — display: flex',
  'justify-content va align-items',
  'flex-direction va gap',
  'DevTools — CSS va Flexbox overlay',
  'AI bilan sayt yaratish'
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

// Flex demo box (small numbered box)
const FBox = ({ n, h }) => (
  <div className="fbox" style={h ? { height: h } : null}>{n}</div>
);

// SCREEN 0 — HOOK (klassik vs flexbox)
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
          Elementlar <span className="italic" style={{ color: T.accent }}>qayerga joylashadi</span>?
        </h1>
        <p className="body fade-up delay-1" style={{ color: T.ink2 }}>
          Avval CSS bilan rang va shrift bezashni o'rgandik. Endi <b style={{ color: T.ink }}>joylashtirish</b> san'atini —
          elementlarni yonma-yon, markazda, qator yoki ustunda qanday joylashtirishni o'rganamiz.
        </p>
        <div className="fade-up delay-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <p className="eyebrow" style={{ color: T.ink3, margin: '0 0 6px', fontSize: 11 }}>Eski usul</p>
            <Preview minH={130}>
              <div style={{ display: 'block' }}>
                <div style={{ background: T.accent, color: '#fff', padding: '8px 12px', marginBottom: 4, borderRadius: 4, fontSize: 13, fontFamily: 'Manrope, sans-serif', fontWeight: 600 }}>Header</div>
                <div style={{ background: T.accent, color: '#fff', padding: '8px 12px', marginBottom: 4, borderRadius: 4, fontSize: 13, fontFamily: 'Manrope, sans-serif', fontWeight: 600 }}>Menyu</div>
                <div style={{ background: T.accent, color: '#fff', padding: '8px 12px', borderRadius: 4, fontSize: 13, fontFamily: 'Manrope, sans-serif', fontWeight: 600 }}>Aloqa</div>
              </div>
            </Preview>
          </div>
          <div>
            <p className="eyebrow" style={{ color: T.accent, margin: '0 0 6px', fontSize: 11 }}>Flexbox ✨</p>
            <Preview minH={130}>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                <div style={{ background: T.accent, color: '#fff', padding: '8px 12px', borderRadius: 4, fontSize: 13, fontFamily: 'Manrope, sans-serif', fontWeight: 600 }}>Header</div>
                <div style={{ background: T.accent, color: '#fff', padding: '8px 12px', borderRadius: 4, fontSize: 13, fontFamily: 'Manrope, sans-serif', fontWeight: 600 }}>Menyu</div>
                <div style={{ background: T.accent, color: '#fff', padding: '8px 12px', borderRadius: 4, fontSize: 13, fontFamily: 'Manrope, sans-serif', fontWeight: 600 }}>Aloqa</div>
              </div>
            </Preview>
          </div>
        </div>
        <p className="h-sub title fade-up delay-3">
          Bugun zamonaviy va eng kuchli usulni o'rganamiz —{' '}
          <span className="italic" style={{ color: T.accent }}>Flexbox</span>.
        </p>
        <div className="fade-up delay-4" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { id: 'a', label: 'Ha, joylashuvni nazorat qilishni xohlayman' },
            { id: 'b', label: 'Flexbox haqida eshitganman — chuqurroq o\u2019rganmoqchiman' },
            { id: 'c', label: 'Hozircha sayt tuzilmasi qiyin ko\u2019rinadi' },
            { id: 'd', label: 'Boshlay olamiz' }
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
        Bu dars 1-darsning davomi. Endi sahifa <b style={{ color: T.ink }}>tuzilishi</b> — qaysi element qayerda turishi haqida.
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
        Flexbox 2012-yilda paydo bo'lgan va veb-saytlarni joylashtirish usulini butunlay o'zgartirgan. Bugun deyarli har bir sayt undan foydalanadi.
      </Fact>
    </div>
  </Stage>
);

// SCREEN 2 — LAYOUT (sahifa wireframe)
const LAYOUT_PARTS = {
  header: { label: 'Header', body: 'Sayt yuqori qismi — logo va asosiy navigatsiya. Flexbox bilan logo va menyuni yonma-yon joylashtirish oson.' },
  nav: { label: 'Nav (menyu)', body: '4-5 ta havola gorizontal qatorda. Flexbox bilan ularni teng bo\u2019lishtirish, markazlash yoki chetga surish — bir necha satr kod.' },
  main: { label: 'Asosiy', body: 'Sahifaning yuragi. Bu yerda Flexbox kontent va yon panelni yonma-yon joylashtiradi.' },
  aside: { label: 'Yon panel', body: 'Asosiyga yondosh — qo\u2019shimcha ma\u2019lumotlar, reklamalar. Flexbox bilan asosiyga yopishadi.' },
  footer: { label: 'Footer', body: 'Sayt pastida. Flexbox bilan mualliflik va aloqa havolalarini chetlarga taqsimlash oson.' }
};
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [active, setActive] = useState(null);
  const [clicked, setClicked] = useState(new Set());
  const done = clicked.size === 5 || storedAnswer !== undefined;
  const tap = (k) => {
    setActive(k);
    const next = new Set(clicked); next.add(k);
    setClicked(next);
    if (next.size === 5 && storedAnswer === undefined) onAnswer(2, { correct: true, picked: true });
  };
  const cls = (k) => `wf-zone ${active === k ? 'active' : ''} ${clicked.has(k) ? 'seen' : ''}`;

  return (
    <Stage eyebrow="Layout" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${clicked.size}/5 qism`} onClick={onNext} /></>}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(18px,3vw,22px)' }}>
        <h2 className="title h-title fade-up">
          Layout — <span className="italic" style={{ color: T.accent }}>joylashtirish san'ati</span>.
        </h2>
        <p className="body fade-up delay-1" style={{ color: T.ink2 }}>
          <b style={{ color: T.ink }}>Layout</b> — bu sahifadagi elementlarni qanday joylashtirish: qator yoki ustun?
          Markazga yoki chetga? Yonma-yon yoki ustma-ust?
        </p>
        <div className="wireframe fade-up delay-2">
          <div className={cls('header')} onClick={() => tap('header')} style={{ gridArea: 'h' }}>Header</div>
          <div className={cls('nav')} onClick={() => tap('nav')} style={{ gridArea: 'n' }}>Asosiy · Loyihalar · Aloqa</div>
          <div className={cls('main')} onClick={() => tap('main')} style={{ gridArea: 'm' }}>Asosiy kontent</div>
          <div className={cls('aside')} onClick={() => tap('aside')} style={{ gridArea: 'a' }}>Yon panel</div>
          <div className={cls('footer')} onClick={() => tap('footer')} style={{ gridArea: 'f' }}>Footer</div>
        </div>
        {active && (
          <div className="frame-soft fade-step" key={active}>
            <p className="eyebrow" style={{ color: T.accent, margin: 0 }}>{LAYOUT_PARTS[active].label}</p>
            <p className="body" style={{ color: T.ink, margin: '8px 0 0' }}>{LAYOUT_PARTS[active].body}</p>
          </div>
        )}
        <Fact delay="delay-3">
          Yaxshi layout — kichik tafsilot, lekin sayt ko'rinishida juda katta farq qiladi. Aynan layout ham sayt "qulay" yoki "qiyin" ko'rinishini hal qiladi.
        </Fact>
      </div>
    </Stage>
  );
};

// SCREEN 3 — DISPLAY (block/inline/inline-block)
const DISPLAYS = [
  { v: 'block', label: 'block', desc: 'To\u2019liq qator egallaydi. Keyingisi yangi qatorda.', ex: 'div, p, h1, section' },
  { v: 'inline', label: 'inline', desc: 'Faqat o\u2019z mazmuni qadar joy. Qatorni davom ettiradi. Width/height qo\u2019llanmaydi.', ex: 'span, a, strong' },
  { v: 'inline-block', label: 'inline-block', desc: 'Qatorda qoladi (yonma-yon), lekin width va height qo\u2019llaniladi.', ex: 'button, input' }
];
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [idx, setIdx] = useState(0);
  const [touched, setTouched] = useState(storedAnswer !== undefined);
  const cur = DISPLAYS[idx];
  const pick = (i) => {
    setIdx(i);
    if (!touched) { setTouched(true); if (storedAnswer === undefined) onAnswer(3, { correct: true, picked: true }); }
  };

  return (
    <Stage eyebrow="display" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!touched} label={touched ? 'Davom etish' : 'Display turini almashtiring'} onClick={onNext} /></>}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(18px,3vw,22px)' }}>
        <h2 className="title h-title fade-up">
          <span className="mono">display</span> — element <span className="italic" style={{ color: T.accent }}>qanday joylashadi</span>?
        </h2>
        <p className="body fade-up delay-1" style={{ color: T.ink2 }}>
          Har bir HTML elementning o'z display turi bor. Bu — element sahifada qanday "yashashini" belgilaydi.
          3 ta asosiy turi bor — quyida sinab ko'ring.
        </p>
        <div className="fade-up delay-2">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {DISPLAYS.map((d, i) => (
              <button key={d.v} className={`chip ${idx === i ? 'chip-on' : ''}`} onClick={() => pick(i)}>
                <span className="mono">{d.v}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="fade-up delay-3">
          <CodeBox>
            <Tg>.qutim</Tg> <Pn>{'{'}</Pn>{'\n'}
            {'  '}<At>display</At><Pn>:</Pn> <Sr>{cur.v}</Sr><Pn>;</Pn>{'\n'}
            <Pn>{'}'}</Pn>
          </CodeBox>
        </div>
        <div className="fade-up delay-3">
          <Preview minH={120}>
            <div>
              {[1, 2, 3].map(n => (
                <span key={n} style={{
                  display: cur.v,
                  background: T.accent,
                  color: '#fff',
                  padding: '8px 14px',
                  borderRadius: 6,
                  margin: cur.v === 'block' ? '0 0 4px' : '0 6px 6px 0',
                  fontWeight: 700,
                  width: (cur.v === 'block' || cur.v === 'inline-block') ? 100 : 'auto',
                  textAlign: 'center',
                  transition: 'all 0.25s',
                  fontFamily: 'Manrope, sans-serif',
                  fontSize: 14
                }}>
                  Quti {n}
                </span>
              ))}
            </div>
          </Preview>
        </div>
        <div className="frame-soft fade-step" key={cur.v}>
          <p className="eyebrow" style={{ color: T.accent, margin: 0 }}>{cur.label}</p>
          <p className="body" style={{ color: T.ink, margin: '8px 0 4px' }}>{cur.desc}</p>
          <p className="small mono" style={{ color: T.ink3, margin: 0 }}>Misol: {cur.ex}</p>
        </div>
        <Fact delay="delay-4">
          Inline elementlar (<span className="mono">span</span>, <span className="mono">a</span>) — matn ichida ishlatiladi.
          Block elementlar (<span className="mono">div</span>, <span className="mono">p</span>) — alohida qatorda yashaydi.
        </Fact>
      </div>
    </Stage>
  );
};

// SCREEN 4 — MCQ #1 [SCORED]
const Screen4 = (props) => (
  <QuestionScreen {...props} idx={4} scope="practice" eyebrow="Mashq · 1-savol"
    questionText="<div> tegi avtomatik qaysi display turida bo'ladi?"
    question={
      <>
        <p className="eyebrow" style={{ color: T.accent }}>Display turi</p>
        <h2 className="title h-sub" style={{ marginTop: 8 }}>
          <span className="mono" style={{ color: T.ink }}>{'<div>'}</span> tegi avtomatik qaysi display turida bo'ladi?
        </h2>
      </>
    }
    options={['inline', 'block', 'inline-block', 'flex']} correctIdx={1}
    explainCorrect="To'g'ri. <div> — block element. To'liq qator egallaydi, keyingisi yangi qatordan boshlanadi."
    explainWrong={{
      0: 'inline — bu span, a, strong kabi elementlar. <div> esa block.',
      2: 'inline-block — bu button, input kabi. <div> esa to\u2019liq block.',
      3: 'flex — bu CSS bilan qo\u2019shiladigan tur, avtomatik emas. <div> avtomatik block.',
      default: '<div> avtomatik block element.'
    }} />
);

// SCREEN 5 — FLEXBOX KIRISH (toggle on/off)
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [flexOn, setFlexOn] = useState(false);
  const [touched, setTouched] = useState(storedAnswer !== undefined);
  const toggle = () => {
    setFlexOn(!flexOn);
    if (!touched) { setTouched(true); if (storedAnswer === undefined) onAnswer(5, { correct: true, picked: true }); }
  };

  return (
    <Stage eyebrow="Flexbox" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!touched} label={touched ? 'Davom etish' : 'Flex\u2019ni yoqing'} onClick={onNext} /></>}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(18px,3vw,22px)' }}>
        <h2 className="title h-title fade-up">
          Flexbox — qatorga <span className="italic" style={{ color: T.accent }}>avtomatik tushadi</span>.
        </h2>
        <p className="body fade-up delay-1" style={{ color: T.ink2 }}>
          Bitta CSS qatori bilan — <span className="mono">display: flex</span> — ota elementining bolalari avtomatik yonma-yon joylashadi.
          Tugmani bosib o'zingiz ko'ring.
        </p>
        <div className="fade-up delay-2">
          <button onClick={toggle} className="btn" style={{ padding: 'clamp(12px,2vw,14px) clamp(22px,3vw,28px)', fontSize: 'clamp(14px,1.8vw,16px)' }}>
            {flexOn ? '○ display: flex\u2019ni o\u2019chirish' : '✨ display: flex\u2019ni yoqing'}
          </button>
        </div>
        <div className="fade-up delay-3">
          <CodeBox>
            <Tg>.container</Tg> <Pn>{'{'}</Pn>{'\n'}
            {flexOn ? <>{'  '}<At>display</At><Pn>:</Pn> <Sr>flex</Sr><Pn>;</Pn>{'\n'}</> : <>{'  '}<Cm>{'/* display: flex yo\u2019q */'}</Cm>{'\n'}</>}
            <Pn>{'}'}</Pn>{'\n\n'}
            <Cm>{'<!-- HTML -->'}</Cm>{'\n'}
            <Tg>{'<div '}</Tg><At>class</At><Pn>=</Pn><Sr>"container"</Sr><Tg>{'>'}</Tg>{'\n'}
            {'  '}<Tg>{'<div>'}</Tg>1<Tg>{'</div>'}</Tg>{'\n'}
            {'  '}<Tg>{'<div>'}</Tg>2<Tg>{'</div>'}</Tg>{'\n'}
            {'  '}<Tg>{'<div>'}</Tg>3<Tg>{'</div>'}</Tg>{'\n'}
            <Tg>{'</div>'}</Tg>
          </CodeBox>
        </div>
        <div className="fade-up delay-3">
          <Preview minH={140}>
            <div className="fcontainer" style={{
              display: flexOn ? 'flex' : 'block',
              gap: 8,
              transition: 'gap 0.4s'
            }}>
              <FBox n={1} />
              <FBox n={2} />
              <FBox n={3} />
            </div>
          </Preview>
        </div>
        {flexOn && touched && (
          <GoodNote label="Sehrli farq">
            Bitta CSS qatori — va elementlar gorizontalga aylandi. Bu — Flexbox sehri. Endi <b>justify-content</b> va <b>align-items</b> bilan ularni har xil joylashtiramiz.
          </GoodNote>
        )}
      </div>
    </Stage>
  );
};

// SCREEN 6 — JUSTIFY-CONTENT
const JUSTIFY_OPTIONS = ['flex-start', 'center', 'flex-end', 'space-between', 'space-around'];
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [idx, setIdx] = useState(0);
  const [touched, setTouched] = useState(storedAnswer !== undefined);
  const pick = (i) => {
    setIdx(i);
    if (!touched) { setTouched(true); if (storedAnswer === undefined) onAnswer(6, { correct: true, picked: true }); }
  };
  const cur = JUSTIFY_OPTIONS[idx];
  return (
    <Stage eyebrow="justify-content" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!touched} label={touched ? 'Davom etish' : 'Qiymatlarni almashtiring'} onClick={onNext} /></>}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(18px,3vw,22px)' }}>
        <h2 className="title h-title fade-up">
          <span className="mono">justify-content</span> — <span className="italic" style={{ color: T.accent }}>qatorda joylashuv</span>.
        </h2>
        <p className="body fade-up delay-1" style={{ color: T.ink2 }}>
          Flex elementlarini gorizontal o'qda qayerga joylashtirish kerakligini belgilaydi: boshida, markazda, oxirida yoki teng taqsimlangan.
        </p>
        <div className="fade-up delay-2">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {JUSTIFY_OPTIONS.map((j, i) => (
              <button key={j} className={`chip ${idx === i ? 'chip-on' : ''}`} onClick={() => pick(i)}>
                <span className="mono">{j}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="fade-up delay-3">
          <CodeBox>
            <Tg>.container</Tg> <Pn>{'{'}</Pn>{'\n'}
            {'  '}<At>display</At><Pn>:</Pn> <Sr>flex</Sr><Pn>;</Pn>{'\n'}
            {'  '}<At>justify-content</At><Pn>:</Pn> <Sr>{cur}</Sr><Pn>;</Pn>{'\n'}
            <Pn>{'}'}</Pn>
          </CodeBox>
        </div>
        <div className="fade-up delay-3">
          <Preview minH={100}>
            <div className="fcontainer" style={{ display: 'flex', justifyContent: cur, gap: 6 }}>
              <FBox n={1} /><FBox n={2} /><FBox n={3} />
            </div>
          </Preview>
        </div>
        <div className="frame-soft fade-step" key={cur}>
          <p className="mono" style={{ color: T.accent, fontWeight: 700, margin: 0, fontSize: 'clamp(14px,1.9vw,16px)' }}>{cur}</p>
          <p className="body" style={{ color: T.ink, margin: '6px 0 0' }}>
            {cur === 'flex-start' && 'Elementlar boshida (chap chetda) joylashadi — bu default qiymat.'}
            {cur === 'center' && 'Elementlar markazda yig\u2019iladi. Sayt sarlavhalarini markazlash uchun ideal.'}
            {cur === 'flex-end' && 'Elementlar oxirida (o\u2019ng chetda) joylashadi.'}
            {cur === 'space-between' && 'Elementlar oralig\u2019iga teng bo\u2019shliq beriladi. Chetdagilar — chegarada.'}
            {cur === 'space-around' && 'Har element atrofida teng bo\u2019shliq. Chet va o\u2019rta bo\u2019shliqlar nisbatda farq qiladi.'}
          </p>
        </div>
        <Fact delay="delay-4">
          Default qiymat — <span className="mono">flex-start</span>. Boshqasini xohlasangiz, justify-content yozasiz.
        </Fact>
      </div>
    </Stage>
  );
};

// SCREEN 7 — MCQ #2 [SCORED]
const Screen7 = (props) => (
  <QuestionScreen {...props} idx={7} scope="practice" eyebrow="Mashq · 2-savol"
    questionText="Flex elementlarini qatorda markazga joylashtirish uchun qiymat?"
    question={
      <>
        <p className="eyebrow" style={{ color: T.accent }}>justify-content</p>
        <h2 className="title h-sub" style={{ marginTop: 8 }}>
          Flex elementlarini qatorda markazga joylashtirish uchun qiymat?
        </h2>
      </>
    }
    options={['justify-content: middle', 'justify-content: center', 'align-items: center', 'text-align: center']} correctIdx={1}
    explainCorrect="To'g'ri. justify-content: center — elementlar qatorda markazda yig'iladi."
    explainWrong={{
      0: 'middle qiymati yo\u2019q. To\u2019g\u2019risi — center.',
      2: 'align-items vertikal o\u2019qni boshqaradi. Qatordagi (gorizontal) markazlash — justify-content.',
      3: 'text-align — bu matnga ta\u2019sir qiladi, flex elementlarini joylashtirmayidi.',
      default: 'Qatorda markazlash — justify-content: center.'
    }} />
);

// SCREEN 8 — ALIGN-ITEMS (vertikal)
const ALIGN_OPTIONS = ['flex-start', 'center', 'flex-end', 'stretch'];
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [idx, setIdx] = useState(0);
  const [touched, setTouched] = useState(storedAnswer !== undefined);
  const pick = (i) => {
    setIdx(i);
    if (!touched) { setTouched(true); if (storedAnswer === undefined) onAnswer(8, { correct: true, picked: true }); }
  };
  const cur = ALIGN_OPTIONS[idx];
  return (
    <Stage eyebrow="align-items" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!touched} label={touched ? 'Davom etish' : 'Qiymatlarni almashtiring'} onClick={onNext} /></>}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(18px,3vw,22px)' }}>
        <h2 className="title h-title fade-up">
          <span className="mono">align-items</span> — <span className="italic" style={{ color: T.accent }}>vertikal joylashuv</span>.
        </h2>
        <p className="body fade-up delay-1" style={{ color: T.ink2 }}>
          Flex elementlarini vertikal o'qda qayerga joylashtirish kerakligini belgilaydi: yuqori, markaz, past yoki to'liq cho'zilgan.
        </p>
        <div className="fade-up delay-2">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {ALIGN_OPTIONS.map((a, i) => (
              <button key={a} className={`chip ${idx === i ? 'chip-on' : ''}`} onClick={() => pick(i)}>
                <span className="mono">{a}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="fade-up delay-3">
          <CodeBox>
            <Tg>.container</Tg> <Pn>{'{'}</Pn>{'\n'}
            {'  '}<At>display</At><Pn>:</Pn> <Sr>flex</Sr><Pn>;</Pn>{'\n'}
            {'  '}<At>align-items</At><Pn>:</Pn> <Sr>{cur}</Sr><Pn>;</Pn>{'\n'}
            <Pn>{'}'}</Pn>
          </CodeBox>
        </div>
        <div className="fade-up delay-3">
          <Preview minH={170}>
            <div className="fcontainer" style={{ display: 'flex', alignItems: cur, gap: 8, height: 130 }}>
              <FBox n={1} h={cur === 'stretch' ? undefined : 40} />
              <FBox n={2} h={cur === 'stretch' ? undefined : 60} />
              <FBox n={3} h={cur === 'stretch' ? undefined : 50} />
            </div>
          </Preview>
        </div>
        <div className="frame-soft fade-step" key={cur}>
          <p className="mono" style={{ color: T.accent, fontWeight: 700, margin: 0, fontSize: 'clamp(14px,1.9vw,16px)' }}>{cur}</p>
          <p className="body" style={{ color: T.ink, margin: '6px 0 0' }}>
            {cur === 'flex-start' && 'Elementlar yuqori qismida joylashadi.'}
            {cur === 'center' && 'Elementlar vertikal markazda yig\u2019iladi.'}
            {cur === 'flex-end' && 'Elementlar pastki qismida joylashadi.'}
            {cur === 'stretch' && 'Elementlar konteyner balandligini to\u2019liq egallaydi (cho\u2019zilib).'}
          </p>
        </div>
        <Fact delay="delay-4">
          <b>Pro tip:</b> Markazda joylashtirish uchun ikkalasini birga ishlatamiz —{' '}
          <span className="mono">justify-content: center; align-items: center;</span>
        </Fact>
      </div>
    </Stage>
  );
};

// SCREEN 9 — FLEX-DIRECTION + GAP
const Screen9 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [dir, setDir] = useState('row');
  const [gap, setGap] = useState(8);
  const [touched, setTouched] = useState(storedAnswer !== undefined);
  const touch = () => { if (!touched) { setTouched(true); if (storedAnswer === undefined) onAnswer(9, { correct: true, picked: true }); } };
  return (
    <Stage eyebrow="flex-direction · gap" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!touched} label={touched ? 'Davom etish' : 'Bilan o\u2019ynang'} onClick={onNext} /></>}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(18px,3vw,22px)' }}>
        <h2 className="title h-title fade-up">
          <span className="mono">flex-direction</span> va <span className="italic" style={{ color: T.accent }}>gap</span>.
        </h2>
        <p className="body fade-up delay-1" style={{ color: T.ink2 }}>
          <b style={{ color: T.ink }}>flex-direction</b> — elementlar yo'nalishi (qator yoki ustun).
          <b style={{ color: T.ink }}> gap</b> — elementlar orasidagi oraliq.
        </p>
        <div className="fade-up delay-2">
          <p className="eyebrow" style={{ color: T.ink2, margin: '0 0 8px' }}>flex-direction</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className={`chip ${dir === 'row' ? 'chip-on' : ''}`} onClick={() => { setDir('row'); touch(); }}>
              ▷ <span className="mono">row</span> (gorizontal)
            </button>
            <button className={`chip ${dir === 'column' ? 'chip-on' : ''}`} onClick={() => { setDir('column'); touch(); }}>
              ▽ <span className="mono">column</span> (vertikal)
            </button>
          </div>
        </div>
        <div className="fade-up delay-2">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <span className="eyebrow" style={{ color: T.ink2 }}>gap: {gap}px</span>
            <span className="mono small" style={{ color: T.accent, fontWeight: 700 }}>oraliq</span>
          </div>
          <input type="range" className="sl" min="0" max="32" value={gap} onChange={e => { setGap(parseInt(e.target.value)); touch(); }} />
        </div>
        <div className="fade-up delay-3">
          <CodeBox>
            <Tg>.container</Tg> <Pn>{'{'}</Pn>{'\n'}
            {'  '}<At>display</At><Pn>:</Pn> <Sr>flex</Sr><Pn>;</Pn>{'\n'}
            {'  '}<At>flex-direction</At><Pn>:</Pn> <Sr>{dir}</Sr><Pn>;</Pn>{'\n'}
            {'  '}<At>gap</At><Pn>:</Pn> <Sr>{gap}px</Sr><Pn>;</Pn>{'\n'}
            <Pn>{'}'}</Pn>
          </CodeBox>
        </div>
        <div className="fade-up delay-3">
          <Preview minH={dir === 'column' ? 200 : 110}>
            <div className="fcontainer" style={{ display: 'flex', flexDirection: dir, gap: gap, transition: 'gap 0.2s' }}>
              <FBox n={1} /><FBox n={2} /><FBox n={3} /><FBox n={4} />
            </div>
          </Preview>
        </div>
        <Fact delay="delay-4">
          <span className="mono">row</span> — default (avtomatik). Agar elementlarni vertikal joylashtirmoqchi bo'lsangiz, <span className="mono">column</span>.
          Yana <span className="mono">row-reverse</span> va <span className="mono">column-reverse</span> ham bor — teskari yo'nalish.
        </Fact>
      </div>
    </Stage>
  );
};

// SCREEN 10 — MCQ #3 [SCORED]
const Screen10 = (props) => (
  <QuestionScreen {...props} idx={10} scope="practice" eyebrow="Mashq · 3-savol"
    questionText="Flex elementlarini gorizontaldan vertikalga o'tkazish uchun?"
    question={
      <>
        <p className="eyebrow" style={{ color: T.accent }}>flex-direction</p>
        <h2 className="title h-sub" style={{ marginTop: 8 }}>
          Flex elementlarini gorizontaldan vertikalga o'tkazish uchun?
        </h2>
      </>
    }
    options={['display: column', 'flex-direction: column', 'align-items: column', 'justify-content: vertical']} correctIdx={1}
    explainCorrect="To'g'ri. flex-direction: column — elementlar ustun bo'lib joylashadi. Default — row (qator)."
    explainWrong={{
      0: 'display: column qiymati yo\u2019q. display: flex yoq, keyin flex-direction: column.',
      2: 'align-items vertikal joylashuvni boshqaradi, lekin yo\u2019nalishni o\u2019zgartirmaydi.',
      3: 'justify-content qiymatlarida "vertical" yo\u2019q. To\u2019g\u2019risi — flex-direction: column.',
      default: 'Vertikal yo\u2019nalish uchun flex-direction: column.'
    }} />
);

// SCREEN 11 — DEVTOOLS STYLES PANEL (interactive)
const DT_COLORS = ['#FF5A36', '#1C2A48', '#2E8B57', '#8E4585'];
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [color, setColor] = useState('#FF5A36');
  const [padding, setPadding] = useState(20);
  const [touched, setTouched] = useState(storedAnswer !== undefined);
  const touch = () => { if (!touched) { setTouched(true); if (storedAnswer === undefined) onAnswer(11, { correct: true, picked: true }); } };
  return (
    <Stage eyebrow="DevTools · Styles" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!touched} label={touched ? 'Davom etish' : 'Qiymatni o\u2019zgartiring'} onClick={onNext} /></>}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(18px,3vw,22px)' }}>
        <h2 className="title h-title fade-up">
          DevTools'da <span className="italic" style={{ color: T.accent }}>CSS'ni ko'rish</span>.
        </h2>
        <p className="body fade-up delay-1" style={{ color: T.ink2 }}>
          F12 → Elements tab → o'ng tomonda <b style={{ color: T.ink }}>Styles paneli</b>. U yerda element uchun yozilgan barcha CSS qoidalari bor.
          Qiymatni bosib o'zgartiring — sahifa darrov yangilanadi!
        </p>
        <div className="fade-up delay-2">
          <p className="eyebrow" style={{ color: T.ink2, margin: '0 0 6px' }}>Preview (.karta element)</p>
          <Preview minH={100}>
            <div style={{
              background: T.bg, padding: padding + 'px', borderRadius: 8, transition: 'all 0.25s',
              border: `2px solid ${color}`, color: color, fontFamily: 'Georgia, serif',
              fontWeight: 700, fontSize: 'clamp(15px,2.5vw,18px)', textAlign: 'center'
            }}>
              Mening kartam
            </div>
          </Preview>
        </div>
        <div className="fade-up delay-3 dt-styles">
          <div className="dt-styles-head">
            <span className="dt-tab-on">Styles</span>
            <span className="dt-tab">Computed</span>
            <span className="dt-tab">Layout</span>
          </div>
          <div className="dt-styles-body">
            <div className="dt-rule">
              <span className="mono" style={{ color: CODE.tag }}>.karta</span>
              <span className="mono" style={{ color: CODE.punct }}> {'{'}</span>
            </div>
            <div className="dt-prop">
              <span className="mono" style={{ color: CODE.attr }}>color</span>
              <span className="mono" style={{ color: CODE.punct }}>:</span>
              <div style={{ display: 'inline-flex', gap: 4, marginLeft: 6 }}>
                {DT_COLORS.map(c => (
                  <button key={c} className="dt-color-pick" onClick={() => { setColor(c); touch(); }}
                    style={{ background: c, border: color === c ? '2px solid #fff' : '2px solid transparent', outline: color === c ? '2px solid ' + c : 'none' }}
                    title={c} />
                ))}
              </div>
              <span className="mono small" style={{ color: CODE.str, marginLeft: 6 }}>{color}</span>
              <span className="mono" style={{ color: CODE.punct }}>;</span>
            </div>
            <div className="dt-prop">
              <span className="mono" style={{ color: CODE.attr }}>padding</span>
              <span className="mono" style={{ color: CODE.punct }}>:</span>
              <input type="range" min="0" max="40" value={padding} onChange={e => { setPadding(parseInt(e.target.value)); touch(); }}
                className="dt-slider" style={{ marginLeft: 6, verticalAlign: 'middle' }} />
              <span className="mono small" style={{ color: CODE.str, marginLeft: 6 }}>{padding}px</span>
              <span className="mono" style={{ color: CODE.punct }}>;</span>
            </div>
            <div className="dt-rule"><span className="mono" style={{ color: CODE.punct }}>{'}'}</span></div>
          </div>
        </div>
        {touched && (
          <GoodNote label="Mashq qilish vositasi">
            Real DevTools'da xuddi shu tarzda ishlaydi. Bu sizning eng yaxshi do'stingiz — CSS'ni o'rganishda. Hech narsani buzmaysiz, faqat vaqtinchalik o'zgaradi.
          </GoodNote>
        )}
      </div>
    </Stage>
  );
};

// SCREEN 12 — FLEXBOX OVERLAY
const Screen12 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [overlay, setOverlay] = useState(false);
  const [touched, setTouched] = useState(storedAnswer !== undefined);
  const toggle = () => {
    setOverlay(!overlay);
    if (!touched) { setTouched(true); if (storedAnswer === undefined) onAnswer(12, { correct: true, picked: true }); }
  };
  return (
    <Stage eyebrow="Flexbox overlay" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!touched} label={touched ? 'Davom etish' : '"flex" tugmasini bosing'} onClick={onNext} /></>}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(18px,3vw,22px)' }}>
        <h2 className="title h-title fade-up">
          DevTools — <span className="italic" style={{ color: T.accent }}>Flexbox overlay</span>.
        </h2>
        <p className="body fade-up delay-1" style={{ color: T.ink2 }}>
          DevTools display: flex bo'lgan elementlarni topib, yonida kichkina <b style={{ color: T.accent }}>"flex"</b> belgi ko'rsatadi.
          Belgini bossangiz — sahifada vizual to'r chiqadi. Bu — flexboxni ko'z bilan ko'rish.
        </p>
        <div className="fade-up delay-2">
          <p className="eyebrow" style={{ color: T.ink2, margin: '0 0 6px' }}>Elements tab</p>
          <CodeBox>
            <Tg>{'<div '}</Tg><At>class</At><Pn>=</Pn><Sr>"nav"</Sr><Tg>{'>'}</Tg>
            <button className={`flex-badge ${overlay ? 'on' : ''}`} onClick={toggle}>flex</button>
            {'\n'}
            {'  '}<Tg>{'<a>'}</Tg>Asosiy<Tg>{'</a>'}</Tg>{'\n'}
            {'  '}<Tg>{'<a>'}</Tg>Loyihalar<Tg>{'</a>'}</Tg>{'\n'}
            {'  '}<Tg>{'<a>'}</Tg>Aloqa<Tg>{'</a>'}</Tg>{'\n'}
            {'  '}<Tg>{'<a>'}</Tg>Blog<Tg>{'</a>'}</Tg>{'\n'}
            <Tg>{'</div>'}</Tg>
          </CodeBox>
        </div>
        <div className="fade-up delay-3">
          <p className="eyebrow" style={{ color: T.ink2, margin: '0 0 6px' }}>Sahifada ko'rinish</p>
          <Preview minH={90}>
            <div className={`nav-demo ${overlay ? 'overlay' : ''}`}>
              {['Asosiy', 'Loyihalar', 'Aloqa', 'Blog'].map((s, i) => (
                <a key={i} className={`nav-link ${overlay ? 'overlay' : ''}`}>{s}</a>
              ))}
            </div>
          </Preview>
        </div>
        <div className="frame-soft fade-step" key={overlay}>
          <p className="eyebrow" style={{ color: T.accent, margin: 0 }}>{overlay ? 'Overlay yoqilgan' : 'Overlay o\u2019chiq'}</p>
          <p className="body" style={{ color: T.ink, margin: '8px 0 0' }}>
            {overlay
              ? 'Coral dashed chiziqlar — bu brauzer chizgan to\u2019r. Konteyner chegarasi va elementlar oralig\u2019i aniq ko\u2019rinadi.'
              : 'Yuqorida kod ichidagi "flex" belgisini bosing — sahifada vizual to\u2019r ochiladi.'}
          </p>
        </div>
        <Fact delay="delay-4">
          Flex overlay — flexbox o'rganishning eng yaxshi usuli. Boshlanish — chap chetda, oxir — o'ng chetda, gap — orasidagi yashil bo'shliqlar.
          Bu — ko'z bilan tushunish.
        </Fact>
      </div>
    </Stage>
  );
};

// SCREEN 13 — AI BILAN SAYT YARATISH
const PROMPTS = [
  {
    short: 'Portfolio sahifa',
    text: 'Coral rangli portfolio sahifa yasab ber. Yuqorida header, flexbox bilan menyu, o\u2019rtada loyihalar bo\u2019limi, pastda footer.',
    code: <>
      <Tg>{'<body>'}</Tg> <Pn>{'{'}</Pn> <At>display</At><Pn>:</Pn> <Sr>flex</Sr><Pn>;</Pn> <At>flex-direction</At><Pn>:</Pn> <Sr>column</Sr><Pn>;</Pn> <Pn>{'}'}</Pn>{'\n'}
      <Tg>.nav</Tg> <Pn>{'{'}</Pn> <At>display</At><Pn>:</Pn> <Sr>flex</Sr><Pn>;</Pn> <At>gap</At><Pn>:</Pn> <Sr>20px</Sr><Pn>;</Pn> <Pn>{'}'}</Pn>{'\n'}
      <Tg>.loyihalar</Tg> <Pn>{'{'}</Pn> <At>display</At><Pn>:</Pn> <Sr>flex</Sr><Pn>;</Pn> <At>gap</At><Pn>:</Pn> <Sr>16px</Sr><Pn>;</Pn> <At>flex-wrap</At><Pn>:</Pn> <Sr>wrap</Sr><Pn>;</Pn> <Pn>{'}'}</Pn>{'\n'}
      <Cm>{'/* ...va boshqa qoidalar */'}</Cm>
    </>
  },
  {
    short: 'Markaziy karta',
    text: 'Sahifa o\u2019rtasida bitta karta bo\u2019lsin. Karta tepasida sarlavha, o\u2019rtada matn, pastda tugma.',
    code: <>
      <Tg>body</Tg> <Pn>{'{'}</Pn> <At>display</At><Pn>:</Pn> <Sr>flex</Sr><Pn>;</Pn> <At>justify-content</At><Pn>:</Pn> <Sr>center</Sr><Pn>;</Pn> <At>align-items</At><Pn>:</Pn> <Sr>center</Sr><Pn>;</Pn> <At>min-height</At><Pn>:</Pn> <Sr>100vh</Sr><Pn>;</Pn> <Pn>{'}'}</Pn>{'\n'}
      <Tg>.karta</Tg> <Pn>{'{'}</Pn> <At>display</At><Pn>:</Pn> <Sr>flex</Sr><Pn>;</Pn> <At>flex-direction</At><Pn>:</Pn> <Sr>column</Sr><Pn>;</Pn> <At>gap</At><Pn>:</Pn> <Sr>12px</Sr><Pn>;</Pn> <At>padding</At><Pn>:</Pn> <Sr>24px</Sr><Pn>;</Pn> <Pn>{'}'}</Pn>
    </>
  },
  {
    short: '3 ta loyiha kartalari',
    text: '3 ta loyiha kartasi bo\u2019lsin. Bir qatorda, oraliq 16px, har biri o\u2019xshash o\u2019lchamda.',
    code: <>
      <Tg>.loyihalar</Tg> <Pn>{'{'}</Pn> <At>display</At><Pn>:</Pn> <Sr>flex</Sr><Pn>;</Pn> <At>gap</At><Pn>:</Pn> <Sr>16px</Sr><Pn>;</Pn> <Pn>{'}'}</Pn>{'\n'}
      <Tg>.loyiha</Tg> <Pn>{'{'}</Pn> <At>flex</At><Pn>:</Pn> <Sr>1</Sr><Pn>;</Pn> <Cm>{'/* har biri teng joy oladi */'}</Cm> <Pn>{'}'}</Pn>
    </>
  }
];
const Screen13 = ({ screen, onNext, onPrev }) => {
  const [idx, setIdx] = useState(null);
  const cur = idx !== null ? PROMPTS[idx] : null;
  return (
    <Stage eyebrow="AI bilan sayt" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext label="Davom etish" onClick={onNext} /></>}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(18px,3vw,22px)' }}>
        <h2 className="title h-title fade-up">
          Endi AI bilan <span className="italic" style={{ color: T.accent }}>sayt yaratish</span>.
        </h2>
        <p className="body fade-up delay-1" style={{ color: T.ink2 }}>
          Tabriklayman! HTML va CSS asoslarini bilasiz. Endi AI bilan tezroq sayt yarata olasiz —
          sizga faqat <b style={{ color: T.ink }}>yaxshi prompt</b> yozish kerak.
        </p>
        <div className="fade-up delay-2">
          <p className="eyebrow" style={{ color: T.ink2, margin: '0 0 10px' }}>Misol promptlar — bosing va AI javobini ko'ring</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {PROMPTS.map((p, i) => (
              <button key={i} className={`chip ${idx === i ? 'chip-on' : ''}`} onClick={() => setIdx(i)}>
                {p.short}
              </button>
            ))}
          </div>
        </div>
        {cur && (
          <div className="fade-step" key={idx} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="frame-soft">
              <p className="eyebrow" style={{ color: T.accent, margin: '0 0 6px' }}>Sizning promptingiz</p>
              <p className="body" style={{ color: T.ink, margin: 0, fontStyle: 'italic' }}>"{cur.text}"</p>
            </div>
            <div>
              <p className="eyebrow" style={{ color: T.ink2, margin: '0 0 6px' }}>AI'dan kelgan kod (qisqacha)</p>
              <CodeBox>{cur.code}</CodeBox>
            </div>
          </div>
        )}
        <div className="ai-highlight fade-up delay-3">
          <div className="ai-bulb">✨</div>
          <p className="ai-h">Asosingiz mustahkam — AI sizning yordamchingiz</p>
          <p className="ai-sub">Siz kodni o'qib, tushunib, tahrirlay olasiz</p>
        </div>
      </div>
    </Stage>
  );
};

// SCREEN 14 — MINI FLEXBOX BUILDER
const Screen14 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [dir, setDir] = useState('row');
  const [jc, setJC] = useState('flex-start');
  const [ai, setAI] = useState('flex-start');
  const [gap, setGap] = useState(8);
  const [touchedKeys, setTouchedKeys] = useState(new Set(storedAnswer !== undefined ? ['d', 'j'] : []));
  const [done, setDone] = useState(storedAnswer !== undefined);
  const touch = (k) => {
    const next = new Set(touchedKeys); next.add(k);
    setTouchedKeys(next);
    if (next.size >= 2 && !done) { setDone(true); if (storedAnswer === undefined) onAnswer(14, { correct: true, picked: true }); }
  };
  return (
    <Stage eyebrow="Amaliyot · sayt layout" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Kamida 2 sozlama (${touchedKeys.size}/2)`} onClick={onNext} /></>}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(16px,3vw,22px)' }}>
        <h2 className="title h-title fade-up">
          O'z <span className="italic" style={{ color: T.accent }}>layoutingizni</span> yarating.
        </h2>
        <p className="body fade-up delay-1" style={{ color: T.ink2 }}>
          4 ta menyu havolasi — Flexbox bilan ularni xohlagancha joylashtiring.
          Kamida 2 ta sozlamani o'zgartirsangiz davom etishingiz mumkin.
        </p>
        <div className="fade-up delay-2">
          <p className="eyebrow" style={{ color: T.ink2, margin: '0 0 8px' }}>1. flex-direction</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['row', 'column'].map(v => (
              <button key={v} className={`chip ${dir === v ? 'chip-on' : ''}`} onClick={() => { setDir(v); touch('d'); }}>
                <span className="mono">{v}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="fade-up delay-2">
          <p className="eyebrow" style={{ color: T.ink2, margin: '0 0 8px' }}>2. justify-content</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['flex-start', 'center', 'flex-end', 'space-between'].map(v => (
              <button key={v} className={`chip ${jc === v ? 'chip-on' : ''}`} onClick={() => { setJC(v); touch('j'); }}>
                <span className="mono">{v}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="fade-up delay-2">
          <p className="eyebrow" style={{ color: T.ink2, margin: '0 0 8px' }}>3. align-items</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['flex-start', 'center', 'flex-end'].map(v => (
              <button key={v} className={`chip ${ai === v ? 'chip-on' : ''}`} onClick={() => { setAI(v); touch('a'); }}>
                <span className="mono">{v}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="fade-up delay-3">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <span className="eyebrow" style={{ color: T.ink2 }}>4. gap: {gap}px</span>
          </div>
          <input type="range" className="sl" min="0" max="32" value={gap} onChange={e => { setGap(parseInt(e.target.value)); touch('g'); }} />
        </div>
        <div className="fade-up delay-3">
          <CodeBox>
            <Tg>.nav</Tg> <Pn>{'{'}</Pn>{'\n'}
            {'  '}<At>display</At><Pn>:</Pn> <Sr>flex</Sr><Pn>;</Pn>{'\n'}
            {'  '}<At>flex-direction</At><Pn>:</Pn> <Sr>{dir}</Sr><Pn>;</Pn>{'\n'}
            {'  '}<At>justify-content</At><Pn>:</Pn> <Sr>{jc}</Sr><Pn>;</Pn>{'\n'}
            {'  '}<At>align-items</At><Pn>:</Pn> <Sr>{ai}</Sr><Pn>;</Pn>{'\n'}
            {'  '}<At>gap</At><Pn>:</Pn> <Sr>{gap}px</Sr><Pn>;</Pn>{'\n'}
            <Pn>{'}'}</Pn>
          </CodeBox>
        </div>
        <div className="fade-up delay-3">
          <Preview minH={dir === 'column' ? 230 : 130}>
            <div className="fcontainer" style={{
              display: 'flex', flexDirection: dir, justifyContent: jc, alignItems: ai, gap: gap,
              minHeight: dir === 'column' ? 200 : 100, transition: 'gap 0.2s'
            }}>
              {['Asosiy', 'Loyihalar', 'Aloqa', 'Blog'].map((s, i) => (
                <div key={i} className="fbox" style={{ background: T.accent, padding: '10px 16px', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>{s}</div>
              ))}
            </div>
          </Preview>
        </div>
        {done && (
          <GoodNote label="Mukammal layout">
            4 ta Flexbox xususiyati — va sahifaning butun joylashuvini siz boshqarasiz. Uy vazifasida xuddi shu narsani o'z saytingizga qo'shing.
          </GoodNote>
        )}
      </div>
    </Stage>
  );
};

// SCREEN 15 — MCQ FINAL [SCORED · scope:'final']
const Screen15 = (props) => (
  <QuestionScreen {...props} idx={15} scope="final" eyebrow="Yakuniy tekshiruv"
    questionText="Element ichidagi flex bolalarini to'liq markazga joylashtirish uchun qaysi 2 ta xususiyat birga ishlatiladi?"
    question={
      <>
        <p className="eyebrow" style={{ color: T.accent }}>So'nggi savol</p>
        <h2 className="title h-sub" style={{ marginTop: 8 }}>
          Element ichidagi flex bolalarini <b>to'liq markazga</b> joylashtirish uchun qaysi 2 ta xususiyat birga ishlatiladi?
        </h2>
      </>
    }
    options={[
      'justify-content + text-align',
      'margin + padding',
      'justify-content + align-items',
      'flex-direction + gap'
    ]} correctIdx={2}
    explainCorrect="To'g'ri. justify-content: center qatorda (gorizontal), align-items: center vertikal — ikkalasi birga to'liq markazlash beradi."
    explainWrong={{
      0: 'text-align matnga ta\u2019sir qiladi, flex elementlariga emas.',
      1: 'margin va padding bo\u2019shliqlarni belgilaydi, lekin flex markazlash uchun yetarli emas.',
      3: 'flex-direction yo\u2019nalishni, gap esa oraliqni belgilaydi — ikkalasi ham markazlash uchun emas.',
      default: 'To\u2019liq markazlash uchun justify-content: center + align-items: center.'
    }} />
);

// SCREEN 16 — YAKUN
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
          Keyingi modul →
        </button>
      </>
    }>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(16px,3vw,22px)' }}>
        <div className="fade-up">
          <p className="eyebrow" style={{ color: T.accent }}>Dars tugadi</p>
          <h2 className="title h-title" style={{ marginTop: 10 }}>
            Endi siz <br /><span className="italic">Flexbox'ni bilasiz</span>.
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
            {correct >= total * 0.85 && 'Ajoyib! Flexbox\u2019ni o\u2019zlashtirdingiz.'}
            {correct >= total * 0.6 && correct < total * 0.85 && 'Yaxshi! Bir-ikki joyni takrorlasangiz bo\u2019ldi.'}
            {correct < total * 0.6 && 'Darsni yana bir bor ko\u2019rib chiqsangiz foydali bo\u2019ladi.'}
          </p>
        </div>
        <div className="frame-soft fade-up delay-2">
          <p className="eyebrow" style={{ color: T.accent, margin: 0 }}>📝 Uyga vazifa</p>
          <p className="body" style={{ margin: '8px 0 12px', color: T.ink }}>Sahifangizni Flexbox bilan qayta tuzing:</p>
          <ul style={{ ...UL_STYLE, color: T.ink2, fontSize: 'clamp(14px,1.9vw,16px)' }}>
            <li><b style={{ color: T.ink }}>Body</b> — flex column (header, main, footer)</li>
            <li><b style={{ color: T.ink }}>Nav menyu</b> — flex row + gap bilan</li>
            <li><b style={{ color: T.ink }}>justify-content va align-items</b> sinab ko'ring</li>
            <li><b style={{ color: T.ink }}>DevTools</b>'da flex overlay'ni yoqing va o'rganing</li>
          </ul>
          <p className="small" style={{ margin: '12px 0 0', color: T.accent, fontWeight: 700 }}>
            ✨ Qo'shimcha: AI'ga "portfolio sahifa" promptini bering va kelgan kodni o'rganing.
          </p>
        </div>
        <div className="fade-up delay-3 frame" style={{ background: T.bg }}>
          <p className="eyebrow" style={{ color: T.accent, margin: 0 }}>Kalit so'zlar</p>
          <ul style={{ ...UL_STYLE, marginTop: 12, color: T.ink2 }}>
            <li><b style={{ color: T.ink }}>display</b> — block, inline, inline-block, flex</li>
            <li><b style={{ color: T.ink }}>Flexbox</b> — container va items</li>
            <li><b style={{ color: T.ink }}>justify-content</b> — qatorda (gorizontal) joylashuv</li>
            <li><b style={{ color: T.ink }}>align-items</b> — vertikal joylashuv</li>
            <li><b style={{ color: T.ink }}>flex-direction</b> — row yoki column</li>
            <li><b style={{ color: T.ink }}>gap</b> — elementlar orasidagi oraliq</li>
            <li><b style={{ color: T.ink }}>DevTools</b> — Styles, Computed, Flexbox overlay</li>
            <li><b style={{ color: T.ink }}>AI prompt</b> — asos siz, tafsilot AI</li>
          </ul>
        </div>
      </div>
    </Stage>
  );
};

// ============================================================
// MAIN — корневой компонент. Получает onFinished от LMS.
// ============================================================
export default function CssLesson2({ onFinished }) {
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

        .code-box { background: ${CODE.bg}; color: ${CODE.text}; font-family: 'JetBrains Mono', monospace; font-size: clamp(13px,1.85vw,15px); line-height: 1.6; padding: clamp(14px,3vw,20px); border-radius: 12px; overflow-x: auto; white-space: pre-wrap; word-break: break-word; margin: 0; }
        .bp-window { border: 1.5px solid ${T.ink}; border-radius: 12px; overflow: hidden; background: #fff; }
        .bp-bar { background: #f0eee8; padding: 8px 12px; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid ${T.ink}30; }
        .bp-title { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink3}; }
        .bp-body { padding: clamp(14px,3vw,20px); }

        .topics { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
        .topic-item { display: flex; align-items: center; gap: 14px; padding: 12px 16px; background: ${T.paper}; border-radius: 10px; border: 1px solid ${T.ink3}40; }
        .topic-num { font-family: 'JetBrains Mono'; font-weight: 700; font-size: clamp(13px,1.8vw,15px); color: ${T.accent}; min-width: 26px; }
        .topic-text { font-family: 'Manrope'; font-weight: 500; color: ${T.ink}; font-size: clamp(14px,1.9vw,16px); }

        /* Wireframe (Screen 2) */
        .wireframe { display: grid; grid-template-columns: 2fr 1fr; grid-template-rows: auto auto 1fr auto; grid-template-areas: 'h h' 'n n' 'm a' 'f f'; gap: 8px; padding: 10px; background: ${T.paper}; border: 1.5px solid ${T.ink}; border-radius: 12px; min-height: 280px; }
        .wf-zone { display: flex; align-items: center; justify-content: center; padding: 16px 12px; background: ${T.bg}; border: 1.5px dashed ${T.ink3}; border-radius: 8px; cursor: pointer; font-family: 'JetBrains Mono'; font-weight: 700; color: ${T.ink2}; transition: all 0.2s; font-size: clamp(13px,1.9vw,16px); text-align: center; }
        .wf-zone:hover { border-style: solid; border-color: ${T.accent}; color: ${T.accent}; }
        .wf-zone.seen { border-color: ${T.accent}80; color: ${T.accent}; background: ${T.accentSoft}; border-style: solid; }
        .wf-zone.active { background: ${T.accent}; border-color: ${T.accent}; color: #fff; }
        .wf-zone[style*="grid-area: m"] { min-height: 90px; }

        /* Slider */
        input[type="range"].sl { -webkit-appearance: none; appearance: none; width: 100%; height: 3px; background: ${T.ink}; outline: none; margin: 12px 0 6px; border-radius: 99px; }
        input[type="range"].sl::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 24px; height: 24px; background: ${T.accent}; border-radius: 50%; cursor: grab; border: 3px solid ${T.bg}; box-shadow: 0 0 0 1.5px ${T.ink}; }
        input[type="range"].sl::-webkit-slider-thumb:active { cursor: grabbing; transform: scale(1.12); }

        /* Flex demo boxes */
        .fcontainer { background: ${T.bg}; border: 1.5px dashed ${T.ink3}; border-radius: 10px; padding: 12px; transition: all 0.3s; }
        .fbox { background: ${T.accent}; color: #fff; padding: 12px 18px; border-radius: 8px; font-family: 'Manrope'; font-weight: 700; font-size: 16px; min-width: 40px; text-align: center; transition: height 0.3s; display: flex; align-items: center; justify-content: center; }

        /* DevTools Styles panel (Screen 11) */
        .dt-styles { background: #1A1A1A; border-radius: 10px; overflow: hidden; }
        .dt-styles-head { background: #2A2A2A; padding: 8px 12px; display: flex; gap: 14px; border-bottom: 1px solid #333; font-family: 'Manrope'; font-size: 12px; font-weight: 600; }
        .dt-tab { color: #888; cursor: default; }
        .dt-tab-on { color: #fff; border-bottom: 2px solid ${T.accent}; padding-bottom: 4px; margin-bottom: -10px; }
        .dt-styles-body { padding: 12px 14px; font-size: 13px; line-height: 1.7; }
        .dt-rule { padding: 2px 0; }
        .dt-prop { padding: 2px 0 2px 14px; display: flex; align-items: center; flex-wrap: wrap; }
        .dt-color-pick { width: 18px; height: 18px; border-radius: 4px; cursor: pointer; padding: 0; outline-offset: 1px; }
        .dt-slider { -webkit-appearance: none; appearance: none; width: 80px; height: 3px; background: #555; outline: none; border-radius: 99px; }
        .dt-slider::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 14px; height: 14px; background: ${T.accent}; border-radius: 50%; cursor: pointer; }

        /* Flexbox overlay (Screen 12) */
        .flex-badge { display: inline-block; margin-left: 6px; background: ${T.accent}; color: #fff; font-family: 'JetBrains Mono'; font-weight: 700; font-size: 10px; padding: 1px 6px; border-radius: 3px; border: none; cursor: pointer; transition: all 0.2s; vertical-align: middle; }
        .flex-badge:hover { transform: scale(1.05); }
        .flex-badge.on { background: ${T.success}; box-shadow: 0 0 0 2px ${T.success}40; }
        .nav-demo { display: flex; gap: 12px; padding: 10px; background: ${T.bg}; border-radius: 8px; transition: all 0.3s; }
        .nav-demo.overlay { border: 2px dashed ${T.accent}; background: ${T.accentSoft}; }
        .nav-link { background: ${T.paper}; padding: 8px 14px; border-radius: 6px; font-family: 'Manrope'; font-weight: 600; font-size: 14px; color: ${T.ink}; text-decoration: none; transition: all 0.3s; border: 1px solid ${T.ink3}40; }
        .nav-link.overlay { outline: 1.5px dashed ${T.accent}; outline-offset: -1.5px; }

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