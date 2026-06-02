import React, { useState, useEffect, useRef } from 'react';

// CSS 1-DARS · CSS asoslari · 17 ekran · 12–17 yosh · siz murojaati
// Mavzu: selektorlar, ranglar, shriftlar, Box Model, margin/padding
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
  lessonId: 'css-01-v1',
  lessonTitle: 'CSS asoslari'
};
const SCREEN_META = [
  { id: 's0',  type: 'hook',           template: 'choice',  scored: false, scope: 'hook' },
  { id: 's1',  type: 'plan',           template: 'custom',  scored: false, scope: null },
  { id: 's2',  type: 'toggle-explore', template: 'custom',  scored: false, scope: null },
  { id: 's3',  type: 'live-explore',   template: 'custom',  scored: false, scope: null },
  { id: 's4',  type: 'test',           template: 'choice',  scored: true,  scope: 'practice' },
  { id: 's5',  type: 'live-explore',   template: 'custom',  scored: false, scope: null },
  { id: 's6',  type: 'toggle-explore', template: 'custom',  scored: false, scope: null },
  { id: 's7',  type: 'test',           template: 'choice',  scored: true,  scope: 'practice' },
  { id: 's8',  type: 'slider-explore', template: 'custom',  scored: false, scope: null },
  { id: 's9',  type: 'toggle-explore', template: 'custom',  scored: false, scope: null },
  { id: 's10', type: 'test',           template: 'choice',  scored: true,  scope: 'practice' },
  { id: 's11', type: 'box-model',      template: 'custom',  scored: false, scope: null },
  { id: 's12', type: 'slider-explore', template: 'custom',  scored: false, scope: null },
  { id: 's13', type: 'note',           template: 'custom',  scored: false, scope: null },
  { id: 's14', type: 'builder',        template: 'custom',  scored: false, scope: null },
  { id: 's15', type: 'test',           template: 'choice',  scored: true,  scope: 'final' },
  { id: 's16', type: 'summary',        template: 'summary', scored: false, scope: null }
];
const SCORED_IDX = SCREEN_META.map((m, i) => (m.scored ? i : null)).filter(i => i !== null);

const TOPICS = [
  'CSS nima va u qanday ishlaydi?',
  'Selektorlar — element, .class, #id',
  'Ranglar — nom, HEX, RGB',
  'Shriftlar — font-family, size, weight',
  'Box Model — qutining tuzilishi',
  'margin va padding — oraliqlar'
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

// SCREEN 0 — HOOK (CSS'siz vs CSS bilan)
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
          HTML — skelet. CSS — <span className="italic" style={{ color: T.accent }}>kiyim, bo'yoq, ko'rinish</span>.
        </h1>
        <p className="body fade-up delay-1" style={{ color: T.ink2 }}>
          Avvalgi darslarda HTML bilan tanishdik — u sahifani <b style={{ color: T.ink }}>tuzadi</b>. Endi <b style={{ color: T.ink }}>CSS</b> bilan tanishamiz —
          u sahifaga <b style={{ color: T.ink }}>ko'rinish beradi</b>. Bir xil HTML, boshqacha CSS — butunlay boshqacha sahifa.
        </p>
        <div className="fade-up delay-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div>
            <p className="eyebrow" style={{ color: T.ink3, margin: '0 0 6px', fontSize: 11 }}>CSS'siz</p>
            <Preview minH={120}>
              <h3 style={{ fontFamily: 'Times New Roman, serif', margin: '0 0 4px', color: '#000', fontSize: 16 }}>Mening sahifam</h3>
              <p style={{ fontFamily: 'Times New Roman, serif', margin: 0, color: '#000', fontSize: 13 }}>Bezaksiz, sodda matn.</p>
            </Preview>
          </div>
          <div>
            <p className="eyebrow" style={{ color: T.accent, margin: '0 0 6px', fontSize: 11 }}>CSS bilan ✨</p>
            <Preview minH={120}>
              <div style={{ background: '#FFF4EF', padding: 12, borderRadius: 6, margin: -4 }}>
                <h3 style={{ fontFamily: 'Georgia, serif', margin: '0 0 4px', color: '#FF5A36', fontSize: 16, fontWeight: 700 }}>Mening sahifam</h3>
                <p style={{ fontFamily: 'Georgia, serif', margin: 0, color: '#1C2A48', fontSize: 13 }}>Chiroyli va o'qish qulay!</p>
              </div>
            </Preview>
          </div>
        </div>
        <p className="h-sub title fade-up delay-3">
          Sizningcha, ikkala sahifa o'rtasidagi farq nima?
        </p>
        <div className="fade-up delay-4" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { id: 'a', label: 'Ikkalasi ham bir xil HTML, faqat CSS bilan bezatilgan' },
            { id: 'b', label: 'Ular butunlay boshqa sahifalar' },
            { id: 'c', label: 'Birinchisi rasm, ikkinchisi haqiqiy sahifa' },
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
        CSS — sahifaga jon kirgizadigan til. Bu darsda asoslarini bosqichma-bosqich o'rganib, oxirida o'z sahifangizni bezatasiz.
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
        CSS — <i>Cascading Style Sheets</i>. "Kaskad" — bu uslublarning bir-birining ustiga to'planib boruvchi tartibi.
        Bir teg uchun bir nechta qoida yozsangiz, brauzer ularni mantiqiy tartibda qo'llaydi.
      </Fact>
    </div>
  </Stage>
);

// SCREEN 2 — CSS NIMA (toggle CSS on/off)
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [cssOn, setCssOn] = useState(false);
  const [touched, setTouched] = useState(storedAnswer !== undefined);

  const toggle = () => {
    setCssOn(!cssOn);
    if (!touched) { setTouched(true); if (storedAnswer === undefined) onAnswer(2, { correct: true, picked: true }); }
  };

  return (
    <Stage eyebrow="CSS nima" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!touched} label={touched ? 'Davom etish' : 'CSS\u2019ni yoqing'} onClick={onNext} /></>}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(18px,3vw,22px)' }}>
        <h2 className="title h-title fade-up">
          CSS — sahifaga <span className="italic" style={{ color: T.accent }}>jon kiritadi</span>.
        </h2>
        <p className="body fade-up delay-1" style={{ color: T.ink2 }}>
          <b style={{ color: T.ink }}>CSS</b> — Cascading Style Sheets. HTML sahifaning skeletini tuzadi, CSS uni <b style={{ color: T.ink }}>bezaydi</b>:
          ranglar, shriftlar, joylashuv, oraliqlar — barchasi CSS bilan.
          U <span className="mono">{'<style>'}</span> tegi ichida yoki alohida <span className="mono">.css</span> faylida yoziladi.
        </p>
        <Fact delay="delay-2">
          Bir xil HTML va boshqacha CSS bilan ikki butunlay boshqa sahifa olish mumkin. CSS — bu sahifaga "kiyim".
        </Fact>
        <div className="fade-up delay-3">
          <button onClick={toggle} className="btn" style={{ padding: 'clamp(12px,2vw,14px) clamp(22px,3vw,28px)', fontSize: 'clamp(14px,1.8vw,16px)' }}>
            {cssOn ? '○ CSS\u2019ni o\u2019chirish' : '✨ CSS\u2019ni yoqing'}
          </button>
        </div>
        <div className="fade-up delay-3">
          <CodeBox>
            <Tg>h2</Tg> <Pn>{'{'}</Pn>{'\n'}
            {'  '}<At>color</At><Pn>:</Pn> <Sr>{cssOn ? '#FF5A36' : 'black'}</Sr><Pn>;</Pn>{'\n'}
            {'  '}<At>font-family</At><Pn>:</Pn> <Sr>{cssOn ? "'Georgia', serif" : "default"}</Sr><Pn>;</Pn>{'\n'}
            <Pn>{'}'}</Pn>{'\n'}
            <Tg>body</Tg> <Pn>{'{'}</Pn>{'\n'}
            {'  '}<At>background-color</At><Pn>:</Pn> <Sr>{cssOn ? '#FFF4EF' : 'white'}</Sr><Pn>;</Pn>{'\n'}
            <Pn>{'}'}</Pn>
          </CodeBox>
        </div>
        <div className="fade-up delay-3">
          <Preview minH={140}>
            <div style={{
              transition: 'all 0.6s cubic-bezier(.2,.7,.2,1)',
              background: cssOn ? '#FFF4EF' : 'transparent',
              padding: cssOn ? 18 : 0,
              borderRadius: cssOn ? 8 : 0,
              margin: cssOn ? -4 : 0
            }}>
              <h2 style={{
                transition: 'all 0.6s cubic-bezier(.2,.7,.2,1)',
                fontFamily: cssOn ? 'Georgia, serif' : 'Times New Roman, serif',
                color: cssOn ? '#FF5A36' : '#000',
                margin: '0 0 8px',
                fontSize: 'clamp(18px,3vw,24px)',
                fontWeight: 700
              }}>
                Mening sahifam
              </h2>
              <p style={{
                transition: 'all 0.6s cubic-bezier(.2,.7,.2,1)',
                fontFamily: cssOn ? 'Georgia, serif' : 'Times New Roman, serif',
                color: cssOn ? '#1C2A48' : '#000',
                margin: 0,
                fontSize: 'clamp(14px,1.9vw,16px)'
              }}>
                Bu oddiy paragraf — {cssOn ? "endi chiroyli va o'qish qulay!" : "bezaksiz, sodda matn."}
              </p>
            </div>
          </Preview>
        </div>
        {cssOn && touched && (
          <GoodNote label="Sehrli farq">
            Bir xil matn — lekin CSS qo'shilgach, butunlay boshqa ko'rinish. Endi bu sehr qanday ishlashini o'rganamiz.
          </GoodNote>
        )}
      </div>
    </Stage>
  );
};

// SCREEN 3 — SELEKTORLAR (interactive)
const SELECTORS = [
  { id: 'el', sel: 'p', label: 'Element', desc: 'p teglariga tegishli — barchasiga', color: '#1C2A48', targets: ['p1', 'p2', 'p3'] },
  { id: 'cl', sel: '.muhim', label: 'Class (.)', desc: 'class="muhim" bo\u2019lganlarga — birdaniga bir nechtasini tanlaydi', color: '#FF5A36', targets: ['p2'] },
  { id: 'id', sel: '#bosh', label: 'ID (#)', desc: 'id="bosh" bo\u2019lganga — sahifada faqat bittasi bo\u2019ladi', color: '#2E8B57', targets: ['p3'] }
];
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [active, setActive] = useState(null);
  const [clicked, setClicked] = useState(new Set());
  const done = clicked.size === 3 || storedAnswer !== undefined;
  const tap = (id) => {
    setActive(id);
    const next = new Set(clicked); next.add(id);
    setClicked(next);
    if (next.size === 3 && storedAnswer === undefined) onAnswer(3, { correct: true, picked: true });
  };
  const cur = active ? SELECTORS.find(s => s.id === active) : null;
  const colorOf = (pid) => cur && cur.targets.includes(pid) ? cur.color : T.ink;
  const isHi = (pid) => cur && cur.targets.includes(pid);

  return (
    <Stage eyebrow="Selektorlar" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${clicked.size}/3 selektor`} onClick={onNext} /></>}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(18px,3vw,22px)' }}>
        <h2 className="title h-title fade-up">
          Selektorlar — <span className="italic" style={{ color: T.accent }}>elementni tanlash</span>.
        </h2>
        <p className="body fade-up delay-1" style={{ color: T.ink2 }}>
          CSS qoidani qaysi elementga qo'llashni <b style={{ color: T.ink }}>selektor</b> orqali aytamiz. 3 turi bor:
          element nomi, <span className="mono">.class</span> (nuqta), va <span className="mono">#id</span> (panjara).
        </p>
        <div className="fade-up delay-2" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {SELECTORS.map(s => (
            <button key={s.id} className={`chip ${active === s.id ? 'chip-on' : ''} ${clicked.has(s.id) ? 'chip-seen' : ''}`}
              onClick={() => tap(s.id)}>
              <span className="mono">{s.sel}</span>
            </button>
          ))}
        </div>
        <div className="fade-up delay-3">
          <CodeBox>
            <Cm>{'/* HTML kod */'}</Cm>{'\n'}
            <Tg>{'<h1>'}</Tg>Sarlavha<Tg>{'</h1>'}</Tg>{'\n'}
            <Tg>{'<p>'}</Tg>Oddiy paragraf<Tg>{'</p>'}</Tg>{'\n'}
            <Tg>{'<p '}</Tg><At>class</At><Pn>=</Pn><Sr>"muhim"</Sr><Tg>{'>'}</Tg>Muhim paragraf<Tg>{'</p>'}</Tg>{'\n'}
            <Tg>{'<p '}</Tg><At>id</At><Pn>=</Pn><Sr>"bosh"</Sr><Tg>{'>'}</Tg>Bosh paragraf<Tg>{'</p>'}</Tg>{'\n'}
            {cur && (
              <>
                {'\n'}<Cm>{'/* CSS qoida */'}</Cm>{'\n'}
                <Tg>{cur.sel}</Tg> <Pn>{'{'}</Pn> <At>color</At><Pn>:</Pn> <Sr>{cur.color}</Sr><Pn>;</Pn> <Pn>{'}'}</Pn>
              </>
            )}
          </CodeBox>
        </div>
        <div className="fade-up delay-3">
          <Preview minH={150}>
            <h3 style={{ fontFamily: 'Georgia, serif', margin: '0 0 8px', color: T.ink, fontSize: 'clamp(16px,2.5vw,20px)' }}>Sarlavha</h3>
            <p id="p1" style={{
              fontFamily: 'Georgia, serif', margin: '0 0 6px',
              color: colorOf('p1'), fontWeight: isHi('p1') ? 600 : 400,
              transition: 'color 0.3s, font-weight 0.3s',
              fontSize: 'clamp(14px,1.9vw,16px)'
            }}>Oddiy paragraf</p>
            <p id="p2" style={{
              fontFamily: 'Georgia, serif', margin: '0 0 6px',
              color: colorOf('p2'), fontWeight: isHi('p2') ? 600 : 400,
              transition: 'color 0.3s, font-weight 0.3s',
              fontSize: 'clamp(14px,1.9vw,16px)'
            }}>Muhim paragraf <span className="mono small" style={{ color: T.ink3 }}>(class="muhim")</span></p>
            <p id="p3" style={{
              fontFamily: 'Georgia, serif', margin: 0,
              color: colorOf('p3'), fontWeight: isHi('p3') ? 600 : 400,
              transition: 'color 0.3s, font-weight 0.3s',
              fontSize: 'clamp(14px,1.9vw,16px)'
            }}>Bosh paragraf <span className="mono small" style={{ color: T.ink3 }}>(id="bosh")</span></p>
          </Preview>
        </div>
        {cur && (
          <div className="frame-soft fade-step" key={cur.id}>
            <p className="eyebrow" style={{ color: T.accent, margin: 0 }}>{cur.label}</p>
            <p className="body" style={{ color: T.ink, margin: '8px 0 0' }}>{cur.desc}</p>
          </div>
        )}
        <Fact delay="delay-4">
          <b>id</b> — har sahifada bitta bo'lishi kerak (yagona). <b>class</b> — bir nechta elementga qo'llanishi mumkin.
          Shu sababli ko'pincha class ishlatiladi, id esa kamroq.
        </Fact>
      </div>
    </Stage>
  );
};

// SCREEN 4 — MCQ #1 [SCORED]
const Screen4 = (props) => (
  <QuestionScreen {...props} idx={4} scope="practice" eyebrow="Mashq · 1-savol"
    questionText=".karta — bu qaysi turdagi selektor?"
    question={
      <>
        <p className="eyebrow" style={{ color: T.accent }}>Selektor turi</p>
        <h2 className="title h-sub" style={{ marginTop: 8 }}>
          <span className="mono" style={{ color: T.ink }}>.karta</span> — bu qaysi turdagi selektor?
        </h2>
      </>
    }
    options={['Element selektori', 'Class selektori', 'ID selektori', 'Bunday narsa yo\u2019q']} correctIdx={1}
    explainCorrect="To'g'ri. Nuqta (.) bilan boshlangan selektor — class selektor. U class atributiga teng elementlarga qo'llanadi."
    explainWrong={{
      0: 'Element selektori — bu p, h1, div kabi teg nomi. Nuqta (.) class selektor uchun.',
      2: 'ID selektori panjara (#) bilan boshlanadi: #karta. Nuqta — bu class.',
      3: 'Mavjud, va u juda ko\u2019p ishlatiladi. Nuqta bilan boshlangan — class selektor.',
      default: 'Nuqta (.) bilan boshlangan selektor — class selektor.'
    }} />
);

// SCREEN 5 — RANGLAR — 3 YO'L (interactive)
const COLORS = [
  { id: 'coral', name: 'coral', hex: '#FF7F50', rgb: 'rgb(255, 127, 80)', swatch: '#FF7F50' },
  { id: 'navy', name: 'navy', hex: '#000080', rgb: 'rgb(0, 0, 128)', swatch: '#000080' },
  { id: 'orange', name: 'orange', hex: '#FFA500', rgb: 'rgb(255, 165, 0)', swatch: '#FFA500' },
  { id: 'seagreen', name: 'seagreen', hex: '#2E8B57', rgb: 'rgb(46, 139, 87)', swatch: '#2E8B57' },
  { id: 'custom', name: '—', hex: '#FF5A36', rgb: 'rgb(255, 90, 54)', swatch: '#FF5A36', noName: true }
];
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [idx, setIdx] = useState(0);
  const [touched, setTouched] = useState(storedAnswer !== undefined);
  const pick = (i) => {
    setIdx(i);
    if (!touched) { setTouched(true); if (storedAnswer === undefined) onAnswer(5, { correct: true, picked: true }); }
  };
  const cur = COLORS[idx];

  return (
    <Stage eyebrow="Ranglar" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!touched} label={touched ? 'Davom etish' : 'Rangni tanlang'} onClick={onNext} /></>}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(18px,3vw,22px)' }}>
        <h2 className="title h-title fade-up">
          Ranglar — <span className="italic" style={{ color: T.accent }}>3 ta yo'l</span>.
        </h2>
        <p className="body fade-up delay-1" style={{ color: T.ink2 }}>
          CSS'da rangni 3 xil usulda yozish mumkin: <b style={{ color: T.ink }}>tayyor nom</b>, <b style={{ color: T.ink }}>HEX kod</b>, yoki <b style={{ color: T.ink }}>RGB raqamlar</b>.
          Uchchalasi ham bir xil rangni ifodalaydi — siz xohlagan usulni tanlang.
        </p>
        <div className="fade-up delay-2">
          <p className="eyebrow" style={{ color: T.ink2, margin: '0 0 10px' }}>Rangni tanlang</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {COLORS.map((c, i) => (
              <button key={c.id} className={`chip ${idx === i ? 'chip-on' : ''}`} onClick={() => pick(i)}
                style={{ paddingLeft: 8 }}>
                <span style={{ width: 16, height: 16, borderRadius: '50%', background: c.swatch, border: '1px solid rgba(0,0,0,0.15)', display: 'inline-block' }} />
                <span className="mono small">{c.noName ? c.hex : c.name}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="fade-up delay-3" style={{ position: 'relative' }}>
          <div className="color-swatch" style={{ background: cur.swatch, transition: 'background 0.35s ease-out' }}>
            <span style={{ color: '#fff', fontFamily: 'Fraunces, serif', fontSize: 'clamp(18px,3vw,26px)', fontStyle: 'italic', textShadow: '0 1px 6px rgba(0,0,0,0.25)' }}>
              {cur.hex}
            </span>
          </div>
        </div>
        <div className="fade-up delay-3">
          <CodeBox>
            <Cm>{'/* tayyor nom */'}</Cm>{'\n'}
            <Tg>h1</Tg> <Pn>{'{'}</Pn> <At>color</At><Pn>:</Pn> <Sr>{cur.noName ? '/* nom yo\u2019q */' : cur.name}</Sr><Pn>;</Pn> <Pn>{'}'}</Pn>{'\n\n'}
            <Cm>{'/* HEX kod */'}</Cm>{'\n'}
            <Tg>h1</Tg> <Pn>{'{'}</Pn> <At>color</At><Pn>:</Pn> <Sr>{cur.hex}</Sr><Pn>;</Pn> <Pn>{'}'}</Pn>{'\n\n'}
            <Cm>{'/* RGB raqamlar */'}</Cm>{'\n'}
            <Tg>h1</Tg> <Pn>{'{'}</Pn> <At>color</At><Pn>:</Pn> <Sr>{cur.rgb}</Sr><Pn>;</Pn> <Pn>{'}'}</Pn>
          </CodeBox>
        </div>
        <Fact delay="delay-4">
          CSS'da ~140 ta <b>tayyor nom</b> bor (red, blue, tomato, lavender...). Boshqa har qanday rang uchun HEX yoki RGB ishlating.
          HEX qulayroq — har 2 ta belgi: qizil, yashil, ko'k miqdori.
        </Fact>
      </div>
    </Stage>
  );
};

// SCREEN 6 — color va background-color
const TEXT_COLORS = [
  { name: 'Navy', val: '#1C2A48' },
  { name: 'Coral', val: '#FF5A36' },
  { name: 'SeaGreen', val: '#2E8B57' },
  { name: 'Black', val: '#000000' }
];
const BG_COLORS = [
  { name: 'Yengil pushti', val: '#FFF4EF' },
  { name: 'Yengil ko\u2019k', val: '#EAF4FB' },
  { name: 'Yengil yashil', val: '#EDF6EE' },
  { name: 'Oq', val: '#FFFFFF' }
];
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [tIdx, setTIdx] = useState(0);
  const [bIdx, setBIdx] = useState(0);
  const [touched, setTouched] = useState(storedAnswer !== undefined);
  const touch = () => { if (!touched) { setTouched(true); if (storedAnswer === undefined) onAnswer(6, { correct: true, picked: true }); } };
  const t = TEXT_COLORS[tIdx];
  const b = BG_COLORS[bIdx];
  return (
    <Stage eyebrow="color · background" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!touched} label={touched ? 'Davom etish' : 'Rangni o\u2019zgartiring'} onClick={onNext} /></>}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(18px,3vw,22px)' }}>
        <h2 className="title h-title fade-up">
          <span className="mono">color</span> va <span className="italic" style={{ color: T.accent }}>background-color</span>.
        </h2>
        <p className="body fade-up delay-1" style={{ color: T.ink2 }}>
          <span className="mono">color</span> — matn rangi. <span className="mono">background-color</span> — fon rangi. Quyida ikkalasini almashtirib ko'ring.
        </p>
        <div className="fade-up delay-2">
          <p className="eyebrow" style={{ color: T.ink2, margin: '0 0 8px' }}>Matn rangi</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {TEXT_COLORS.map((c, i) => (
              <button key={c.name} className={`chip ${tIdx === i ? 'chip-on' : ''}`} onClick={() => { setTIdx(i); touch(); }} style={{ paddingLeft: 8 }}>
                <span style={{ width: 14, height: 14, borderRadius: '50%', background: c.val, border: '1px solid rgba(0,0,0,0.15)', display: 'inline-block' }} />
                {c.name}
              </button>
            ))}
          </div>
        </div>
        <div className="fade-up delay-2">
          <p className="eyebrow" style={{ color: T.ink2, margin: '0 0 8px' }}>Fon rangi</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {BG_COLORS.map((c, i) => (
              <button key={c.name} className={`chip ${bIdx === i ? 'chip-on' : ''}`} onClick={() => { setBIdx(i); touch(); }} style={{ paddingLeft: 8 }}>
                <span style={{ width: 14, height: 14, borderRadius: '50%', background: c.val, border: '1px solid rgba(0,0,0,0.15)', display: 'inline-block' }} />
                {c.name}
              </button>
            ))}
          </div>
        </div>
        <div className="fade-up delay-3">
          <CodeBox>
            <Tg>h1</Tg> <Pn>{'{'}</Pn> <At>color</At><Pn>:</Pn> <Sr>{t.val}</Sr><Pn>;</Pn> <Pn>{'}'}</Pn>{'\n'}
            <Tg>body</Tg> <Pn>{'{'}</Pn> <At>background-color</At><Pn>:</Pn> <Sr>{b.val}</Sr><Pn>;</Pn> <Pn>{'}'}</Pn>
          </CodeBox>
        </div>
        <div className="fade-up delay-3">
          <Preview minH={130}>
            <div style={{ background: b.val, padding: 16, borderRadius: 6, margin: -4, transition: 'background 0.3s' }}>
              <h2 style={{ fontFamily: 'Georgia, serif', margin: '0 0 6px', color: t.val, transition: 'color 0.3s', fontSize: 'clamp(18px,3vw,24px)' }}>
                Mening sahifam
              </h2>
              <p style={{ fontFamily: 'Georgia, serif', margin: 0, color: t.val, transition: 'color 0.3s', fontSize: 'clamp(14px,1.9vw,16px)' }}>
                Bu — chiroyli bezatilgan sahifa.
              </p>
            </div>
          </Preview>
        </div>
        {touched && (
          <GoodNote label="Yaxshi tushdi">
            <span className="mono">color</span> matnga, <span className="mono">background-color</span> fonga ta'sir qiladi. Boshqa ko'p xususiyatlar ham xuddi shu tartibda ishlaydi.
          </GoodNote>
        )}
      </div>
    </Stage>
  );
};

// SCREEN 7 — MCQ #2 [SCORED]
const Screen7 = (props) => (
  <QuestionScreen {...props} idx={7} scope="practice" eyebrow="Mashq · 2-savol"
    questionText="#FF5A36 — bu rangni qaysi formatda yozish?"
    question={
      <>
        <p className="eyebrow" style={{ color: T.accent }}>Rang formati</p>
        <h2 className="title h-sub" style={{ marginTop: 8 }}>
          <span className="mono" style={{ color: T.ink }}>#FF5A36</span> — bu rangni qaysi formatda yozish?
        </h2>
      </>
    }
    options={['Tayyor nom', 'HEX kod', 'RGB raqamlar', 'HTML teg']} correctIdx={1}
    explainCorrect="To'g'ri. Panjara (#) va 6 ta belgi — bu HEX kod. Har 2 ta belgi qizil, yashil va ko'k miqdorini bildiradi."
    explainWrong={{
      0: 'Tayyor nom — bu red, blue, tomato kabi inglizcha so\u2019zlar. # bilan boshlanmaydi.',
      2: 'RGB shu shaklda yoziladi: rgb(255, 90, 54) — qavslar va vergullar bilan.',
      3: 'Bu CSS rang formati, HTML tegi emas.',
      default: 'Panjara (#) bilan boshlanib, 6 ta belgi bilan davom etgan — HEX kod.'
    }} />
);

// SCREEN 8 — FONT-FAMILY + SIZE
const FONTS = [
  { id: 'georgia', name: 'Georgia', stack: "'Georgia', serif", style: 'serif (klassik)' },
  { id: 'manrope', name: 'Manrope', stack: "'Manrope', sans-serif", style: 'sans-serif (zamonaviy)' },
  { id: 'mono', name: 'Courier', stack: "'Courier New', monospace", style: 'monospace (kod uchun)' },
  { id: 'fraunces', name: 'Fraunces', stack: "'Fraunces', serif", style: 'display (qiziq)' }
];
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [fIdx, setFIdx] = useState(1);
  const [size, setSize] = useState(20);
  const [touched, setTouched] = useState(storedAnswer !== undefined);
  const touch = () => { if (!touched) { setTouched(true); if (storedAnswer === undefined) onAnswer(8, { correct: true, picked: true }); } };
  const f = FONTS[fIdx];
  return (
    <Stage eyebrow="Shriftlar" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!touched} label={touched ? 'Davom etish' : 'Shrift yoki o\u2019lcham bilan o\u2019ynang'} onClick={onNext} /></>}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(18px,3vw,22px)' }}>
        <h2 className="title h-title fade-up">
          Shriftlar — <span className="italic" style={{ color: T.accent }}>font-family</span> va o'lcham.
        </h2>
        <p className="body fade-up delay-1" style={{ color: T.ink2 }}>
          <span className="mono">font-family</span> — qaysi shriftda yozish, <span className="mono">font-size</span> — qanchalik katta.
          Shriftni tanlang va sliderni surib o'lchamini o'zgartiring.
        </p>
        <div className="fade-up delay-2">
          <p className="eyebrow" style={{ color: T.ink2, margin: '0 0 10px' }}>Shrift</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {FONTS.map((ft, i) => (
              <button key={ft.id} className={`chip ${fIdx === i ? 'chip-on' : ''}`} onClick={() => { setFIdx(i); touch(); }}
                style={{ fontFamily: ft.stack }}>
                {ft.name} <span className="mono small" style={{ color: T.ink3, fontFamily: 'JetBrains Mono' }}>· {ft.style}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="fade-up delay-3">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <span className="eyebrow" style={{ color: T.ink2 }}>O'lcham: {size}px</span>
            <span className="mono small" style={{ color: T.accent, fontWeight: 700 }}>{size <= 14 ? 'Kichik' : size <= 24 ? 'Oddiy' : size <= 36 ? 'Katta' : 'Juda katta'}</span>
          </div>
          <input type="range" className="sl" min="12" max="48" value={size} onChange={e => { setSize(parseInt(e.target.value)); touch(); }} />
        </div>
        <div className="fade-up delay-3">
          <CodeBox>
            <Tg>p</Tg> <Pn>{'{'}</Pn>{'\n'}
            {'  '}<At>font-family</At><Pn>:</Pn> <Sr>{f.stack}</Sr><Pn>;</Pn>{'\n'}
            {'  '}<At>font-size</At><Pn>:</Pn> <Sr>{size}px</Sr><Pn>;</Pn>{'\n'}
            <Pn>{'}'}</Pn>
          </CodeBox>
        </div>
        <div className="fade-up delay-3">
          <Preview minH={90}>
            <p style={{
              fontFamily: f.stack, fontSize: size, margin: 0, color: T.ink, transition: 'font-size 0.2s, font-family 0.2s', lineHeight: 1.4
            }}>
              Mening sahifam — bu o'qish qulay matn.
            </p>
          </Preview>
        </div>
        <Fact delay="delay-4">
          Shrift veb-saytga "ovoz" beradi. <b>Serif</b> (Georgia) — klassik, jurnal kabi. <b>Sans-serif</b> (Manrope) — toza, zamonaviy.
          <b> Monospace</b> (Courier) — har harf bir xil kenglikda, kod yozish uchun.
        </Fact>
      </div>
    </Stage>
  );
};

// SCREEN 9 — FONT-WEIGHT / STYLE / ALIGN
const Screen9 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [bold, setBold] = useState(false);
  const [ital, setItal] = useState(false);
  const [align, setAlign] = useState('left');
  const [touched, setTouched] = useState(storedAnswer !== undefined);
  const touch = () => { if (!touched) { setTouched(true); if (storedAnswer === undefined) onAnswer(9, { correct: true, picked: true }); } };
  return (
    <Stage eyebrow="Shriftga uslub" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!touched} label={touched ? 'Davom etish' : 'Bittasini bosing'} onClick={onNext} /></>}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(18px,3vw,22px)' }}>
        <h2 className="title h-title fade-up">
          Shriftga <span className="italic" style={{ color: T.accent }}>uslub berish</span>.
        </h2>
        <p className="body fade-up delay-1" style={{ color: T.ink2 }}>
          <span className="mono">font-weight</span> — qalinlik. <span className="mono">font-style</span> — uslub (italic).
          <span className="mono"> text-align</span> — joylashish (chap, markaz, o'ng).
        </p>
        <div className="fade-up delay-2" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          <button className={`chip ${bold ? 'chip-on' : ''}`} onClick={() => { setBold(!bold); touch(); }}>
            <b style={{ fontSize: 16 }}>B</b> Qalin (bold)
          </button>
          <button className={`chip ${ital ? 'chip-on' : ''}`} onClick={() => { setItal(!ital); touch(); }}>
            <i style={{ fontSize: 16, fontFamily: 'Georgia, serif' }}>I</i> Kursiv (italic)
          </button>
        </div>
        <div className="fade-up delay-2">
          <p className="eyebrow" style={{ color: T.ink2, margin: '0 0 8px' }}>Joylashuv (text-align)</p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[
              { v: 'left', label: '◀ Chap' },
              { v: 'center', label: '● Markaz' },
              { v: 'right', label: 'O\u2019ng ▶' }
            ].map(a => (
              <button key={a.v} className={`chip ${align === a.v ? 'chip-on' : ''}`} onClick={() => { setAlign(a.v); touch(); }}>
                {a.label}
              </button>
            ))}
          </div>
        </div>
        <div className="fade-up delay-3">
          <CodeBox>
            <Tg>p</Tg> <Pn>{'{'}</Pn>{'\n'}
            {'  '}<At>font-weight</At><Pn>:</Pn> <Sr>{bold ? 'bold' : 'normal'}</Sr><Pn>;</Pn>{'\n'}
            {'  '}<At>font-style</At><Pn>:</Pn> <Sr>{ital ? 'italic' : 'normal'}</Sr><Pn>;</Pn>{'\n'}
            {'  '}<At>text-align</At><Pn>:</Pn> <Sr>{align}</Sr><Pn>;</Pn>{'\n'}
            <Pn>{'}'}</Pn>
          </CodeBox>
        </div>
        <div className="fade-up delay-3">
          <Preview minH={90}>
            <p style={{
              fontFamily: 'Georgia, serif',
              fontWeight: bold ? 700 : 400,
              fontStyle: ital ? 'italic' : 'normal',
              textAlign: align,
              margin: 0, fontSize: 'clamp(16px,2.5vw,20px)', color: T.ink, transition: 'all 0.2s'
            }}>
              Bu — uslubli matn.
            </p>
          </Preview>
        </div>
        <Fact delay="delay-4">
          Eskirgan teglar <span className="mono">{'<b>'}</span>, <span className="mono">{'<i>'}</span> bor edi. Endi
          <span className="mono"> font-weight: bold</span> va <span className="mono">font-style: italic</span> ishlatish — CSS orqali — afzal.
        </Fact>
      </div>
    </Stage>
  );
};

// SCREEN 10 — MCQ #3 [SCORED]
const Screen10 = (props) => (
  <QuestionScreen {...props} idx={10} scope="practice" eyebrow="Mashq · 3-savol"
    questionText="Matnni qalin (bold) qilish uchun qaysi CSS xususiyat ishlatiladi?"
    question={
      <>
        <p className="eyebrow" style={{ color: T.accent }}>Shriftga ta'sir</p>
        <h2 className="title h-sub" style={{ marginTop: 8 }}>
          Matnni qalin (bold) qilish uchun qaysi CSS xususiyat ishlatiladi?
        </h2>
      </>
    }
    options={['text-align: bold', 'font-weight: bold', 'font-style: bold', 'color: bold']} correctIdx={1}
    explainCorrect="To'g'ri. font-weight: bold — matnni qalin qiladi. Yana raqam ham yozish mumkin: 100 (eng yupqa) dan 900 (eng qalin) gacha."
    explainWrong={{
      0: 'text-align — bu joylashuv (chap, markaz, o\u2019ng), qalinlik emas.',
      2: 'font-style faqat italic (kursiv) yoki normal qabul qiladi, bold emas.',
      3: 'color — bu matn rangi, qalinlikka aloqasi yo\u2019q.',
      default: 'Qalinlik uchun font-weight ishlatiladi.'
    }} />
);

// SCREEN 11 — BOX MODEL (4-layer nested visual)
const BM_PARTS = {
  margin: { label: 'margin', desc: 'Tashqi bo\u2019sh joy — elementning chegarasidan keyingi bo\u2019shliq. Boshqa elementlar bilan oraliqni belgilaydi.' },
  border: { label: 'border', desc: 'Chegara chizig\u2019i — element atrofidagi ramka. Qalinligi, rangi va turi (solid, dashed) bo\u2019lishi mumkin.' },
  padding: { label: 'padding', desc: 'Ichki bo\u2019sh joy — kontent va chegara o\u2019rtasidagi bo\u2019shliq. Matn ramkaga yopishmasligi uchun.' },
  content: { label: 'content', desc: 'Asosiy mazmun — matn, rasm yoki boshqa elementlar. Qutining "yuragi".' }
};
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [active, setActive] = useState(null);
  const [clicked, setClicked] = useState(new Set());
  const done = clicked.size === 4 || storedAnswer !== undefined;
  const tap = (k, e) => {
    if (e) e.stopPropagation();
    setActive(k);
    const next = new Set(clicked); next.add(k);
    setClicked(next);
    if (next.size === 4 && storedAnswer === undefined) onAnswer(11, { correct: true, picked: true });
  };
  return (
    <Stage eyebrow="Box Model" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${clicked.size}/4 qatlam`} onClick={onNext} /></>}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(18px,3vw,22px)' }}>
        <h2 className="title h-title fade-up">
          Box Model — <span className="italic" style={{ color: T.accent }}>qutining qatlamlari</span>.
        </h2>
        <p className="body fade-up delay-1" style={{ color: T.ink2 }}>
          Har bir HTML element — bu <b style={{ color: T.ink }}>quti</b>. Quti 4 qatlamdan iborat: ichidan tashqariga —
          content, padding, border, margin. Pastdagi maketda har qatlamni bosib o'rganing.
        </p>
        <div className="fade-up delay-2">
          <div className={`bm bm-margin ${active === 'margin' ? 'active' : ''} ${clicked.has('margin') ? 'seen' : ''}`}
            onClick={(e) => tap('margin', e)}>
            <span className="bm-label">margin</span>
            <div className={`bm bm-border ${active === 'border' ? 'active' : ''} ${clicked.has('border') ? 'seen' : ''}`}
              onClick={(e) => tap('border', e)}>
              <span className="bm-label">border</span>
              <div className={`bm bm-padding ${active === 'padding' ? 'active' : ''} ${clicked.has('padding') ? 'seen' : ''}`}
                onClick={(e) => tap('padding', e)}>
                <span className="bm-label">padding</span>
                <div className={`bm bm-content ${active === 'content' ? 'active' : ''} ${clicked.has('content') ? 'seen' : ''}`}
                  onClick={(e) => tap('content', e)}>
                  <span className="bm-label">content</span>
                  <span style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(15px,2.5vw,20px)' }}>Salom!</span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {active ? (
          <div className="frame-soft fade-step" key={active}>
            <p className="mono" style={{ color: T.accent, fontWeight: 700, margin: 0, fontSize: 'clamp(15px,2vw,17px)' }}>
              {BM_PARTS[active].label}
            </p>
            <p className="body" style={{ color: T.ink, margin: '8px 0 0' }}>{BM_PARTS[active].desc}</p>
          </div>
        ) : (
          <p className="small fade-up" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic' }}>↑ Qatlamlardan birini bosing</p>
        )}
        <Fact delay="delay-3">
          Box Model — CSS'ning eng muhim tushunchasi. Sahifaning butun joylashuvi shu 4 qatlamga tayanadi.
          DevTools'da har element uchun ularni ranglar bilan ko'rsatadi.
        </Fact>
        {done && (
          <GoodNote label="4 qatlamni o'rgandingiz">
            Endi har qanday CSS xatosini hal qilishingiz oson bo'ladi — element atrofida bo'shliq ko'p? padding yoki margin'ni qarang.
          </GoodNote>
        )}
      </div>
    </Stage>
  );
};

// SCREEN 12 — MARGIN va PADDING (sliders playground)
const Screen12 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [pad, setPad] = useState(8);
  const [mar, setMar] = useState(8);
  const [touched, setTouched] = useState(storedAnswer !== undefined);
  const touch = () => { if (!touched) { setTouched(true); if (storedAnswer === undefined) onAnswer(12, { correct: true, picked: true }); } };
  return (
    <Stage eyebrow="Oraliqlar" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!touched} label={touched ? 'Davom etish' : 'Sliderlarni surib ko\u2019ring'} onClick={onNext} /></>}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(18px,3vw,22px)' }}>
        <h2 className="title h-title fade-up">
          <span className="mono">margin</span> va <span className="italic" style={{ color: T.accent }}>padding</span> — oraliqlar.
        </h2>
        <p className="body fade-up delay-1" style={{ color: T.ink2 }}>
          <b style={{ color: T.ink }}>padding</b> — quti ichidagi bo'sh joy. <b style={{ color: T.ink }}>margin</b> — qutining tashqaridagi bo'sh joy
          (boshqa elementlar bilan oraliq). Sliderlarni surib o'zgarishni kuzating.
        </p>
        <div className="fade-up delay-2">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <span className="eyebrow" style={{ color: T.ink2 }}>padding: {pad}px</span>
            <span className="mono small" style={{ color: T.accent, fontWeight: 700 }}>ichkari bo'shliq</span>
          </div>
          <input type="range" className="sl" min="0" max="40" value={pad} onChange={e => { setPad(parseInt(e.target.value)); touch(); }} />
        </div>
        <div className="fade-up delay-2">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
            <span className="eyebrow" style={{ color: T.ink2 }}>margin: {mar}px</span>
            <span className="mono small" style={{ color: T.accent, fontWeight: 700 }}>tashqi bo'shliq</span>
          </div>
          <input type="range" className="sl" min="0" max="50" value={mar} onChange={e => { setMar(parseInt(e.target.value)); touch(); }} />
        </div>
        <div className="fade-up delay-3">
          <CodeBox>
            <Tg>.karta</Tg> <Pn>{'{'}</Pn>{'\n'}
            {'  '}<At>padding</At><Pn>:</Pn> <Sr>{pad}px</Sr><Pn>;</Pn>{'\n'}
            {'  '}<At>margin</At><Pn>:</Pn> <Sr>{mar}px</Sr><Pn>;</Pn>{'\n'}
            {'  '}<At>border</At><Pn>:</Pn> <Sr>2px solid #FF5A36</Sr><Pn>;</Pn>{'\n'}
            <Pn>{'}'}</Pn>
          </CodeBox>
        </div>
        <div className="fade-up delay-3">
          <Preview minH={140}>
            <div style={{ background: '#F3F0EA', padding: 1, borderRadius: 4, transition: 'all 0.25s' }}>
              {[1, 2].map(i => (
                <div key={i} style={{
                  padding: pad + 'px',
                  marginBottom: i === 1 ? mar + 'px' : 0,
                  border: '2px solid #FF5A36',
                  background: '#FFF4EF',
                  borderRadius: 6,
                  fontFamily: 'Georgia, serif',
                  fontSize: 'clamp(14px,1.9vw,16px)',
                  color: T.ink,
                  transition: 'all 0.25s'
                }}>
                  Karta {i}
                </div>
              ))}
            </div>
          </Preview>
        </div>
        <Fact delay="delay-4">
          Yuqorida ko'rganingizdek: <b>padding'siz</b> matn ramkaga yopishadi, <b>padding bilan</b> chiroyli oraliq paydo bo'ladi.
          <b> margin'siz</b> ikki karta yopishib turadi, <b>margin bilan</b> orasida bo'shliq.
        </Fact>
      </div>
    </Stage>
  );
};

// SCREEN 13 — AI ESLATMA
const Screen13 = ({ screen, onNext, onPrev }) => (
  <Stage eyebrow="Kichik eslatma" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext label="Tushundim, davom etish" onClick={onNext} /></>}>
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(18px,3vw,24px)' }}>
      <h2 className="title h-title fade-up">
        CSS — <span className="italic" style={{ color: T.accent }}>yodlash kerakmas</span>.
      </h2>
      <p className="body fade-up delay-1" style={{ color: T.ink2 }}>
        CSS'da juda ko'p xususiyat bor — <b style={{ color: T.ink }}>hammasini yodlab bo'lmaydi</b>. Va kerak ham emas.
      </p>
      <p className="body fade-up delay-2" style={{ color: T.ink2 }}>
        Eng muhimi — <b style={{ color: T.accent }}>asosini tushunish</b>: selektorlar, ranglar, oraliqlar, Box Model.
        Bu asosni mustahkamlasangiz, qolganini o'rganish oson bo'ladi.
      </p>
      <p className="body fade-up delay-3" style={{ color: T.ink2 }}>
        Qolganini — "qanday yumshatish kerak?", "animatsiya qanday qo'shiladi?" — AI'dan so'rasangiz bo'ladi.
        Lekin <b style={{ color: T.ink }}>avval asosingiz mustahkam bo'lsin</b>!
      </p>
      <div className="ai-highlight fade-up delay-4">
        <div className="ai-bulb">🎨</div>
        <p className="ai-h">Asos — siz, tafsilot — AI</p>
        <p className="ai-sub">Eng samarali aralashma</p>
      </div>
    </div>
  </Stage>
);

// SCREEN 14 — MINI CSS BUILDER
const BUILD_H1_COLORS = [
  { name: 'Coral', val: '#FF5A36' },
  { name: 'Navy', val: '#1C2A48' },
  { name: 'SeaGreen', val: '#2E8B57' },
  { name: 'Plum', val: '#8E4585' }
];
const BUILD_BG = [
  { name: 'Yengil pushti', val: '#FFF4EF' },
  { name: 'Yengil ko\u2019k', val: '#EAF4FB' },
  { name: 'Yengil yashil', val: '#EDF6EE' },
  { name: 'Krem', val: '#FBF7EE' }
];
const BUILD_FONTS = [
  { name: 'Georgia', stack: "'Georgia', serif" },
  { name: 'Manrope', stack: "'Manrope', sans-serif" },
  { name: 'Fraunces', stack: "'Fraunces', serif" }
];
const BUILD_PAD = [
  { name: 'Yo\u2019q', val: 0 },
  { name: 'Kichik', val: 14 },
  { name: 'Katta', val: 28 }
];
const Screen14 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [hC, setHC] = useState(0);
  const [bC, setBC] = useState(0);
  const [fF, setFF] = useState(0);
  const [pd, setPD] = useState(1);
  const [touchedKeys, setTouchedKeys] = useState(new Set(storedAnswer !== undefined ? ['h', 'b'] : []));
  const [done, setDone] = useState(storedAnswer !== undefined);

  const touch = (key) => {
    const next = new Set(touchedKeys); next.add(key);
    setTouchedKeys(next);
    if (next.size >= 2 && !done) { setDone(true); if (storedAnswer === undefined) onAnswer(14, { correct: true, picked: true }); }
  };
  const h = BUILD_H1_COLORS[hC];
  const b = BUILD_BG[bC];
  const f = BUILD_FONTS[fF];
  const p = BUILD_PAD[pd];

  return (
    <Stage eyebrow="Amaliyot · sahifani bezatish" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Kamida 2 sozlama o'zgartiring (${touchedKeys.size}/2)`} onClick={onNext} /></>}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(16px,3vw,22px)' }}>
        <h2 className="title h-title fade-up">
          O'z <span className="italic" style={{ color: T.accent }}>uslubingizni</span> yarating.
        </h2>
        <p className="body fade-up delay-1" style={{ color: T.ink2 }}>
          Quyidagi 4 ta sozlamani o'zgartirib, sahifangizni xohlagancha bezating. Kamida 2 ta o'zgartirsangiz davom etishingiz mumkin.
        </p>
        <div className="fade-up delay-2">
          <p className="eyebrow" style={{ color: T.ink2, margin: '0 0 8px' }}>1. Sarlavha rangi (h1 color)</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {BUILD_H1_COLORS.map((c, i) => (
              <button key={c.name} className={`chip ${hC === i ? 'chip-on' : ''}`} onClick={() => { setHC(i); touch('h'); }} style={{ paddingLeft: 8 }}>
                <span style={{ width: 14, height: 14, borderRadius: '50%', background: c.val, border: '1px solid rgba(0,0,0,0.15)', display: 'inline-block' }} />
                {c.name}
              </button>
            ))}
          </div>
        </div>
        <div className="fade-up delay-2">
          <p className="eyebrow" style={{ color: T.ink2, margin: '0 0 8px' }}>2. Fon (background-color)</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {BUILD_BG.map((c, i) => (
              <button key={c.name} className={`chip ${bC === i ? 'chip-on' : ''}`} onClick={() => { setBC(i); touch('b'); }} style={{ paddingLeft: 8 }}>
                <span style={{ width: 14, height: 14, borderRadius: '50%', background: c.val, border: '1px solid rgba(0,0,0,0.15)', display: 'inline-block' }} />
                {c.name}
              </button>
            ))}
          </div>
        </div>
        <div className="fade-up delay-2">
          <p className="eyebrow" style={{ color: T.ink2, margin: '0 0 8px' }}>3. Shrift (font-family)</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {BUILD_FONTS.map((ft, i) => (
              <button key={ft.name} className={`chip ${fF === i ? 'chip-on' : ''}`} onClick={() => { setFF(i); touch('f'); }} style={{ fontFamily: ft.stack }}>
                {ft.name}
              </button>
            ))}
          </div>
        </div>
        <div className="fade-up delay-3">
          <p className="eyebrow" style={{ color: T.ink2, margin: '0 0 8px' }}>4. Ichki bo'shliq (padding)</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {BUILD_PAD.map((p, i) => (
              <button key={p.name} className={`chip ${pd === i ? 'chip-on' : ''}`} onClick={() => { setPD(i); touch('p'); }}>
                {p.name} <span className="mono small" style={{ color: T.ink3 }}>({p.val}px)</span>
              </button>
            ))}
          </div>
        </div>
        <div className="fade-up delay-3">
          <CodeBox>
            <Tg>body</Tg> <Pn>{'{'}</Pn>{'\n'}
            {'  '}<At>background-color</At><Pn>:</Pn> <Sr>{b.val}</Sr><Pn>;</Pn>{'\n'}
            {'  '}<At>font-family</At><Pn>:</Pn> <Sr>{f.stack}</Sr><Pn>;</Pn>{'\n'}
            {'  '}<At>padding</At><Pn>:</Pn> <Sr>{p.val}px</Sr><Pn>;</Pn>{'\n'}
            <Pn>{'}'}</Pn>{'\n'}
            <Tg>h1</Tg> <Pn>{'{'}</Pn> <At>color</At><Pn>:</Pn> <Sr>{h.val}</Sr><Pn>;</Pn> <Pn>{'}'}</Pn>
          </CodeBox>
        </div>
        <div className="fade-up delay-3">
          <Preview minH={140}>
            <div style={{ background: b.val, padding: p.val, borderRadius: 6, margin: -4, transition: 'all 0.25s' }}>
              <h1 style={{ fontFamily: f.stack, color: h.val, margin: '0 0 8px', fontSize: 'clamp(20px,3.5vw,28px)', transition: 'all 0.25s' }}>
                Mening sahifam
              </h1>
              <p style={{ fontFamily: f.stack, color: T.ink, margin: 0, fontSize: 'clamp(14px,1.9vw,16px)', transition: 'all 0.25s' }}>
                Bu — mening birinchi CSS bilan bezatilgan sahifam.
              </p>
            </div>
          </Preview>
        </div>
        {done && (
          <GoodNote label="Birinchi CSS sahifangiz tayyor">
            4 ta xususiyat — va sahifa butunlay boshqacha ko'rinishda. Endi uy vazifasida xuddi shu narsani qo'lda yozasiz.
          </GoodNote>
        )}
      </div>
    </Stage>
  );
};

// SCREEN 15 — MCQ FINAL [SCORED · scope:'final']
const Screen15 = (props) => (
  <QuestionScreen {...props} idx={15} scope="final" eyebrow="Yakuniy tekshiruv"
    questionText="Element atrofidagi tashqi bo'shliq — bu qaysi CSS xususiyati?"
    question={
      <>
        <p className="eyebrow" style={{ color: T.accent }}>So'nggi savol</p>
        <h2 className="title h-sub" style={{ marginTop: 8 }}>
          Element atrofidagi <b>tashqi</b> bo'shliq — bu qaysi CSS xususiyati?
        </h2>
      </>
    }
    options={['padding', 'margin', 'border', 'content']} correctIdx={1}
    explainCorrect="To'g'ri. margin — bu element atrofidagi tashqi bo'shliq. Boshqa elementlar bilan oraliqni belgilaydi."
    explainWrong={{
      0: 'padding — bu ICHKI bo\u2019shliq, ya\u2019ni kontent va chegara o\u2019rtasidagi joy.',
      2: 'border — bu chegara chizig\u2019i, bo\u2019shliq emas.',
      3: 'content — bu asosiy mazmun (matn yoki rasm), bo\u2019shliq emas.',
      default: 'Tashqi bo\u2019shliq uchun margin ishlatiladi.'
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
          Keyingi dars →
        </button>
      </>
    }>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(16px,3vw,22px)' }}>
        <div className="fade-up">
          <p className="eyebrow" style={{ color: T.accent }}>Dars tugadi</p>
          <h2 className="title h-title" style={{ marginTop: 10 }}>
            Sahifangiz endi<br /><span className="italic">chiroyli</span>.
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
            {correct >= total * 0.85 && 'Ajoyib! CSS asoslari tushunarli.'}
            {correct >= total * 0.6 && correct < total * 0.85 && 'Yaxshi! Bir-ikki joyni takrorlasangiz bo\u2019ldi.'}
            {correct < total * 0.6 && 'Darsni yana bir bor ko\u2019rib chiqsangiz foydali bo\u2019ladi.'}
          </p>
        </div>
        <div className="frame-soft fade-up delay-2">
          <p className="eyebrow" style={{ color: T.accent, margin: 0 }}>📝 Uyga vazifa</p>
          <p className="body" style={{ margin: '8px 0 12px', color: T.ink }}>HTML sahifangizga CSS qo'shing:</p>
          <ul style={{ ...UL_STYLE, color: T.ink2, fontSize: 'clamp(14px,1.9vw,16px)' }}>
            <li><b style={{ color: T.ink }}>Sarlavhaga rang bering</b> — HEX bilan (masalan, #FF5A36)</li>
            <li><b style={{ color: T.ink }}>Fon rangini o'zgartiring</b> — yengil bo'lsin, matnga mos</li>
            <li><b style={{ color: T.ink }}>Shrift va o'lcham sozlang</b> — font-family va font-size</li>
            <li><b style={{ color: T.ink }}>Ro'yxat yoki paragrafga</b> — padding va margin qo'shing</li>
          </ul>
          <p className="small" style={{ margin: '12px 0 0', color: T.accent, fontWeight: 700 }}>⚠ Hammasini qo'lda yozing — AI'siz!</p>
        </div>
        <div className="fade-up delay-3 frame" style={{ background: T.bg }}>
          <p className="eyebrow" style={{ color: T.accent, margin: 0 }}>Kalit so'zlar</p>
          <ul style={{ ...UL_STYLE, marginTop: 12, color: T.ink2 }}>
            <li><b style={{ color: T.ink }}>CSS</b> — sahifa uslubi (Cascading Style Sheets)</li>
            <li><b style={{ color: T.ink }}>Selektorlar</b> — element (p), .class, #id</li>
            <li><b style={{ color: T.ink }}>Ranglar</b> — nom, HEX (#FF5A36), RGB (rgb(255, 90, 54))</li>
            <li><b style={{ color: T.ink }}>color, background-color</b> — matn va fon rangi</li>
            <li><b style={{ color: T.ink }}>font-family, font-size, font-weight, font-style</b></li>
            <li><b style={{ color: T.ink }}>text-align</b> — chap, markaz, o'ng</li>
            <li><b style={{ color: T.ink }}>Box Model</b> — content, padding, border, margin</li>
          </ul>
        </div>
      </div>
    </Stage>
  );
};

// ============================================================
// MAIN — корневой компонент. Получает onFinished от LMS.
// ============================================================
export default function CssLesson({ onFinished }) {
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
        .chip-seen { border-color: ${T.accent}80; }
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

        /* Slider */
        input[type="range"].sl { -webkit-appearance: none; appearance: none; width: 100%; height: 3px; background: ${T.ink}; outline: none; margin: 12px 0 6px; border-radius: 99px; }
        input[type="range"].sl::-webkit-slider-thumb { -webkit-appearance: none; appearance: none; width: 24px; height: 24px; background: ${T.accent}; border-radius: 50%; cursor: grab; border: 3px solid ${T.bg}; box-shadow: 0 0 0 1.5px ${T.ink}; }
        input[type="range"].sl::-webkit-slider-thumb:active { cursor: grabbing; transform: scale(1.12); }

        /* Color swatch (Screen 5) */
        .color-swatch { width: 100%; height: clamp(90px, 14vw, 130px); border-radius: 16px; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 20px rgba(0,0,0,0.12); }

        /* Box Model (Screen 11) */
        .bm { position: relative; border-radius: 6px; cursor: pointer; transition: all 0.25s; }
        .bm-label { position: absolute; top: 4px; left: 8px; font-family: 'JetBrains Mono'; font-size: 10px; color: ${T.ink2}; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; pointer-events: none; }
        .bm-margin { background: ${T.ink3}30; padding: clamp(34px,5vw,42px) clamp(28px,4vw,36px) clamp(28px,4vw,36px); }
        .bm-border { border: 4px solid ${T.ink2}; background: ${T.paper}; padding: clamp(20px,3vw,26px) 16px 16px; }
        .bm-padding { background: ${T.accentSoft}; padding: clamp(28px,4vw,36px) clamp(18px,3vw,24px) clamp(18px,3vw,24px); }
        .bm-content { background: ${T.paper}; padding: clamp(20px,3vw,28px) 14px 14px; text-align: center; border: 1px dashed ${T.ink3}80; }
        .bm.seen { outline: 1.5px solid ${T.accent}30; outline-offset: -2px; }
        .bm.active.bm-margin { background: ${T.accentSoft}; outline: 3px dashed ${T.accent}; outline-offset: -8px; }
        .bm.active.bm-border { border-color: ${T.accent}; border-width: 5px; }
        .bm.active.bm-padding { background: ${T.accent}50; }
        .bm.active.bm-content { background: ${T.accent}; }
        .bm.active.bm-content span { color: #fff !important; }
        .bm.active .bm-label { color: ${T.accent}; }

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