import React, { useState, useEffect, useRef } from 'react';

// ============================================================
// "MEN INTERNETDAMAN" — 1-DARS: INTERNET QANDAY ISHLAYDI?
// Interaktiv, qadamba-qadam dars · 12–17 yosh · hurmat shakli (siz)
// Собрано через pipeline (skeleton → content → jsx-builder). UZ-only, аудио нет.
// Платформенный контракт: onFinished(payload) + coins, LESSON_META/SCREEN_META.
// ============================================================

const T = {
  bg: '#F6F4EF',
  ink: '#16243B',
  ink2: '#5A5A60',
  ink3: '#A7A6A2',
  paper: '#FFFFFF',
  accent: '#FF4F28',
  accentSoft: '#FFE8E1',
  success: '#1F7A4D',
  successSoft: '#E3F0E8'
};

const TOTAL_SCREENS = 13;
const COIN_PER = 10;

// --- Платформенный контракт (для LMS payload) ---
const LESSON_META = {
  lessonId: 'internet-01-v1',
  lessonTitle: 'Internet qanday ishlaydi?'
};
// Один объект на экран. scored=true только у MCQ; scope:'final' — финальный тест.
const SCREEN_META = [
  { id: 's0',  type: 'hook',           template: 'choice',  scored: false, scope: 'hook' },
  { id: 's1',  type: 'multiselect',    template: 'custom',  scored: false, scope: null },
  { id: 's2',  type: 'sequence-anim',  template: 'custom',  scored: false, scope: null },
  { id: 's3',  type: 'test',           template: 'choice',  scored: true,  scope: 'practice' },
  { id: 's4',  type: 'flip-cards',     template: 'custom',  scored: false, scope: null },
  { id: 's5',  type: 'translate-anim', template: 'custom',  scored: false, scope: null },
  { id: 's6',  type: 'test',           template: 'choice',  scored: true,  scope: 'practice' },
  { id: 's7',  type: 'journey-stepper',template: 'custom',  scored: false, scope: null },
  { id: 's8',  type: 'order-task',     template: 'custom',  scored: false, scope: null },
  { id: 's9',  type: 'test',           template: 'choice',  scored: true,  scope: 'practice' },
  { id: 's10', type: 'test',           template: 'choice',  scored: true,  scope: 'practice' },
  { id: 's11', type: 'test',           template: 'choice',  scored: true,  scope: 'final' },
  { id: 's12', type: 'summary',        template: 'summary', scored: false, scope: null }
];
const SCORED_IDX = SCREEN_META.map((m, i) => (m.scored ? i : null)).filter(i => i !== null);

// ============================================================
// IKONKALAR
// ============================================================
const IconBrowser = ({ s = 24, c = '#fff' }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="4" width="20" height="14" rx="2" />
    <path d="M9 9l-2 2 2 2M15 9l2 2-2 2" />
    <line x1="8" y1="22" x2="16" y2="22" />
  </svg>
);
const IconDNS = ({ s = 24, c = '#fff' }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 5a2 2 0 0 1 2-2h13v18H6a2 2 0 0 1-2-2z" />
    <line x1="19" y1="7" x2="21" y2="7" />
    <line x1="19" y1="12" x2="21" y2="12" />
    <line x1="19" y1="17" x2="21" y2="17" />
    <circle cx="11" cy="9" r="2" />
    <path d="M8 15c0-1.7 1.3-3 3-3s3 1.3 3 3" />
  </svg>
);
const IconServer = ({ s = 24, c = '#fff' }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="6" rx="1.5" />
    <rect x="3" y="14" width="18" height="6" rx="1.5" />
    <line x1="7" y1="7" x2="7" y2="7" />
    <line x1="7" y1="17" x2="7" y2="17" />
  </svg>
);
const IconGlobe = ({ s = 24, c = '#fff' }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" />
  </svg>
);
const IconCoin = ({ s = 24, c = T.accent }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v10M9.5 9.2c0-1 1.1-1.6 2.5-1.6s2.5.6 2.5 1.7c0 2.4-5 1.3-5 3.7 0 1.1 1.1 1.7 2.5 1.7s2.5-.6 2.5-1.6" strokeLinecap="round" />
  </svg>
);

// ============================================================
// БАЗОВЫЕ КОМПОНЕНТЫ
// ============================================================
const Stage = ({ children, eyebrow, screen, navContent }) => (
  <div className="stage">
    <div className="stage-content">
      <div className="progress-track">
        <div className="progress-bar" style={{ width: `${((screen + 1) / TOTAL_SCREENS) * 100}%` }} />
      </div>
      <div className="chrome">
        <div className="chrome-left eyebrow">
          <span className="dot" />
          <span>{eyebrow}</span>
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

// ============================================================
// УНИВЕРСАЛЬНЫЙ ЭКРАН-ВОПРОС (пишет полную структуру в answers)
// ============================================================
const QuestionScreen = ({ screen, idx, scope, eyebrow, question, questionText, options, correctIdx, explainCorrect, explainWrong, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const [revealed, setRevealed] = useState(storedAnswer !== undefined);

  const pick = (i) => {
    if (revealed) return;
    setPicked(i);
    setRevealed(true);
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

  const navContent = (
    <>
      <NavBack onPrev={onPrev} />
      <NavNext disabled={!revealed} onClick={onNext} />
    </>
  );

  return (
    <Stage eyebrow={eyebrow} screen={screen} navContent={navContent}>
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

// ============================================================
// ЭКРАН 1 — KIRISH + HOOK
// ============================================================
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const [typed, setTyped] = useState('');
  const full = 'google.com';

  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      i++;
      setTyped(full.slice(0, i));
      if (i >= full.length) clearInterval(id);
    }, 90);
    return () => clearInterval(id);
  }, []);

  const pick = (v) => {
    setPicked(v);
    onAnswer(0, { picked: v });
    setTimeout(onNext, 350);
  };

  return (
    <Stage eyebrow="Kirish" screen={screen}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(18px,3vw,26px)' }}>
        <h1 className="title h-title fade-up">
          Manzilni yozasiz —<br />va sayt <span className="italic" style={{ color: T.accent }}>soniyalarda</span> ochiladi.
        </h1>

        <p className="body fade-up delay-1" style={{ color: T.ink2 }}>
          Har kuni internetdan foydalanasiz: sayt ochasiz, video ko'rasiz, do'stlaringizga yozasiz.
          Lekin shuni o'ylab ko'rganmisiz — bularning <b style={{ color: T.ink }}>ortida</b> nima turadi?
          Aslida bu yerda bir necha "yordamchi" bor: <b style={{ color: T.ink }}>brauzer, DNS</b> va <b style={{ color: T.ink }}>server</b>.
          Bugun ularning har biri nima qilishini ko'rib chiqamiz.
        </p>

        <div className="browser-bar fade-up delay-2">
          <span className="bb-dots"><i /><i /><i /></span>
          <span className="bb-url">{typed}<span className="bb-caret">|</span></span>
          <span className="bb-enter">Enter ⏎</span>
        </div>

        <p className="h-sub title fade-up delay-3">
          google.com yozib Enter bosganingizda sayt deyarli darhol chiqadi.
          Sizningcha, shu qisqa vaqtda orqada nima yuz beradi?
        </p>

        <div className="fade-up delay-4" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { id: 'a', label: 'Hech narsa — sayt o\u2019zi paydo bo\u2019ladi' },
            { id: 'b', label: 'Bir nechta qadam ko\u2019zga ko\u2019rinmas tezlikda bajariladi' },
            { id: 'c', label: 'Bilmayman, lekin bilib olishni xohlayman' }
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

// ============================================================
// ЭКРАН 2 — БРАУЗЕР
// ============================================================
const BROWSERS = ['Chrome', 'Safari', 'Firefox', 'Edge'];
const Screen1 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [sel, setSel] = useState(new Set());
  const done = storedAnswer !== undefined || sel.size > 0;

  const toggle = (b) => {
    const next = new Set(sel);
    next.has(b) ? next.delete(b) : next.add(b);
    setSel(next);
    if (next.size > 0 && storedAnswer === undefined) onAnswer(1, { correct: true, picked: true });
  };

  const navContent = (
    <>
      <NavBack onPrev={onPrev} />
      <NavNext disabled={!done} label={done ? 'Davom etish' : 'Birortasini belgilang'} onClick={onNext} />
    </>
  );

  return (
    <Stage eyebrow="Brauzer" screen={screen} navContent={navContent}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(18px,3vw,24px)' }}>
        <h2 className="title h-title fade-up">
          Brauzer — internetga<br />ochiladigan <span className="italic" style={{ color: T.accent }}>derazangiz</span>.
        </h2>

        <p className="body fade-up delay-1" style={{ color: T.ink2 }}>
          Brauzer saytlarni topib, ularni ekraningizda chiroyli qilib ko'rsatadi.
          Chrome, Safari, Firefox, Edge — bularning hammasi brauzer.
        </p>

        <div className="frame-soft fade-up delay-1">
          <p className="body" style={{ margin: 0 }}>
            <b>Analogiya:</b> brauzer — <b style={{ color: T.accent }}>ofitsiant</b> kabi. Buyurtmangizni oshxonaga (serverga) olib boradi va taomni (sahifani) sizga qaytarib keladi.
          </p>
        </div>

        <Fact delay="delay-2">
          Brauzer ichida kichik "dvigatel" bor: u sayt kodini (HTML) o'qib, matn, rasm va tugmalarni joy-joyiga qo'yadi —
          va bularning hammasini millisekundlarda chiroyli sahifaga aylantiradi.
        </Fact>

        <div className="fade-up delay-3">
          <p className="eyebrow" style={{ color: T.ink2, marginBottom: 12 }}>Qaysi brauzerlarni bilasiz? Bosib belgilang</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {BROWSERS.map(b => (
              <button key={b} className={`chip ${sel.has(b) ? 'chip-on' : ''}`} onClick={() => toggle(b)}>
                <IconBrowser s={16} c={sel.has(b) ? '#fff' : T.ink2} /> {b}
              </button>
            ))}
          </div>
        </div>

        {sel.size > 0 && (
          <GoodNote label="To'g'ri tanlov">
            Bularning hammasi — brauzer. Nomi har xil bo'lsa-da, vazifasi bir xil: saytni topib, ekraningizda chiroyli ko'rsatish.
          </GoodNote>
        )}
      </div>
    </Stage>
  );
};

// ============================================================
// ЭКРАН 3 — СЕРВЕР (анимация запрос → ответ)
// ============================================================
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [phase, setPhase] = useState(0);
  const [done, setDone] = useState(storedAnswer !== undefined);
  const timers = useRef([]);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const send = () => {
    timers.current.forEach(clearTimeout);
    setPhase(1);
    timers.current = [
      setTimeout(() => setPhase(2), 800),
      setTimeout(() => setPhase(3), 1700),
      setTimeout(() => { setPhase(4); setDone(true); if (storedAnswer === undefined) onAnswer(2, { correct: true, picked: true }); }, 2600)
    ];
  };

  const navContent = (
    <>
      <NavBack onPrev={onPrev} />
      <NavNext disabled={!done} label={done ? 'Davom etish' : 'Avval so\u2019rov yuboring'} onClick={onNext} />
    </>
  );

  return (
    <Stage eyebrow="Server" screen={screen} navContent={navContent}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(18px,3vw,24px)' }}>
        <h2 className="title h-title fade-up">
          Server — doim ishlab<br />turadigan <span className="italic" style={{ color: T.accent }}>kuchli kompyuter</span>.
        </h2>

        <p className="body fade-up delay-1" style={{ color: T.ink2 }}>
          Server saytlar, rasm va videolarni o'zida saqlaydi. So'rov kelganda kerakli sahifani tayyorlab jo'natadi.
        </p>

        <div className="frame-soft fade-up delay-1">
          <p className="body" style={{ margin: 0 }}>
            <b>Analogiya:</b> server — <b style={{ color: T.accent }}>restoran oshxonasi</b>. Buyurtma kelsa, taomni (sahifani) tayyorlab beradi.
          </p>
        </div>

        <Fact delay="delay-2">
          Serverlar maxsus binolarda — data-markazlarda joylashgan va kechayu kunduz, ya'ni 24/7 ishlaydi.
          Aynan shuning uchun sevimli saytlaringiz har doim ochiq turadi.
        </Fact>

        {/* Анимация запрос/ответ */}
        <div className="frame fade-up delay-3" style={{ overflow: 'hidden' }}>
          <div className="srv-scene">
            <div className="srv-node">
              <div className="srv-circle" style={{ background: T.ink }}><IconBrowser s={22} /></div>
              <span className="mono small" style={{ color: T.ink2 }}>Brauzer</span>
            </div>

            <div className="srv-track">
              <div className={`srv-packet req ${phase === 1 ? 'go' : ''} ${phase >= 2 ? 'hide' : ''}`}>so'rov</div>
              <div className={`srv-packet resp ${phase === 3 ? 'go' : ''} ${phase >= 4 ? 'parked' : ''} ${phase < 3 ? 'hide' : ''}`}>sahifa</div>
            </div>

            <div className="srv-node">
              <div className="srv-circle" style={{ background: T.accent, boxShadow: phase === 2 ? `0 0 0 6px ${T.accentSoft}` : 'none' }}>
                <IconServer s={22} />
              </div>
              <span className="mono small" style={{ color: T.ink2 }}>Server {phase === 2 ? '·tayyorlamoqda…' : ''}</span>
            </div>
          </div>

          <button className="btn" onClick={send} disabled={phase !== 0 && phase !== 4}
            style={{ marginTop: 20, padding: 'clamp(12px,2vw,14px) clamp(22px,3vw,30px)', fontSize: 'clamp(14px,1.8vw,16px)' }}>
            {phase === 0 ? 'So\u2019rov yuboring' : phase === 4 ? 'Yana yuboring' : 'Yuborilmoqda…'}
          </button>
        </div>

        {phase === 4 && (
          <GoodNote label="Ko'rdingizmi?">
            Brauzer so'rov yubordi, server esa kerakli sahifani tayyorlab qaytarib berdi. Mana shu — <b>so'rov va javob</b>: internetning butun ishi shunga asoslangan.
          </GoodNote>
        )}
      </div>
    </Stage>
  );
};

// ============================================================
// ЭКРАН 4 — ВОПРОС (браузер/сервер)
// ============================================================
const Screen3 = (props) => (
  <QuestionScreen
    {...props}
    idx={3}
    scope="practice"
    eyebrow="Mashq · 1-savol"
    questionText="Saytlarni saqlab turadigan va so'rov kelganda sahifani tayyorlaydigan qism qaysi?"
    question={
      <>
        <p className="eyebrow" style={{ color: T.accent }}>Kim nima qiladi?</p>
        <h2 className="title h-sub" style={{ marginTop: 8 }}>
          Saytlarni saqlab turadigan va so'rov kelganda sahifani tayyorlaydigan qism qaysi?
        </h2>
      </>
    }
    options={['Brauzer', 'Server', 'Klaviatura', 'Sichqoncha']}
    correctIdx={1}
    explainCorrect="To'g'ri. Server — sahifalarni saqlaydigan va so'rovga javoban tayyorlab beradigan kuchli kompyuter."
    explainWrong={{
      0: 'Brauzer — bu deraza/ofitsiant: u faqat so\u2019rov yuboradi va natijani ko\u2019rsatadi. Saqlash va tayyorlash — serverning ishi.',
      2: 'Klaviatura — bu siz matn yozadigan qurilma, ma\u2019lumotni saqlamaydi. Sahifalarni saqlab tayyorlaydigan — server.',
      3: 'Sichqoncha — bu boshqaruv qurilmasi. Sayt ma\u2019lumotlarini saqlab, so\u2019rovga sahifa tayyorlaydigan — server.',
      default: 'Bu qism sayt ma\u2019lumotlarini saqlab, so\u2019rovga sahifa tayyorlaydi — bu server.'
    }}
  />
);

// ============================================================
// ЭКРАН 5 — ДОМЕН И IP (карточки-переворот)
// ============================================================
const SITES = [
  { d: 'google.com', ip: '142.250.74.78' },
  { d: 'youtube.com', ip: '142.250.180.46' },
  { d: 'coddycamp.uz', ip: '185.196.213.10' }
];
const Screen4 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [flipped, setFlipped] = useState(new Set());
  const done = storedAnswer !== undefined || flipped.size > 0;

  const flip = (i) => {
    const next = new Set(flipped);
    next.has(i) ? next.delete(i) : next.add(i);
    setFlipped(next);
    if (next.size > 0 && storedAnswer === undefined) onAnswer(4, { correct: true, picked: true });
  };

  const navContent = (
    <>
      <NavBack onPrev={onPrev} />
      <NavNext disabled={!done} label={done ? 'Davom etish' : 'Kartani ochib ko\u2019ring'} onClick={onNext} />
    </>
  );

  return (
    <Stage eyebrow="Manzil" screen={screen} navContent={navContent}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(18px,3vw,24px)' }}>
        <h2 className="title h-title fade-up">
          Domen va <span className="italic" style={{ color: T.accent }}>IP-manzil</span>.
        </h2>

        <p className="body fade-up delay-1" style={{ color: T.ink2 }}>
          <b style={{ color: T.ink }}>Domen</b> — eslab qolish oson nom: <span className="mono">google.com</span>.
          <b style={{ color: T.ink }}> IP-manzil</b> esa kompyuter tushunadigan raqamli manzil: <span className="mono">142.250.74.78</span>.
          Har bir saytning o'z IP-manzili bor.
        </p>

        <div className="frame-soft fade-up delay-1">
          <p className="body" style={{ margin: 0 }}>
            <b>Analogiya:</b> domen — insonning <b style={{ color: T.accent }}>ismi</b>, IP-manzil esa uning <b style={{ color: T.accent }}>telefon raqami</b>.
            Ismni eslash oson, lekin bog'lanish raqam orqali bo'ladi.
          </p>
        </div>

        <Fact delay="delay-2">
          IP-manzil 4 ta raqam guruhidan iborat (masalan <span className="mono">142.250.74.78</span>), har biri 0 dan 255 gacha.
          Faqat saytlarda emas — telefoningiz va kompyuteringizda ham o'z IP-manzili bor.
        </Fact>

        <p className="eyebrow fade-up delay-3" style={{ color: T.ink2 }}>Kartani bosib, uning IP-manzilini ko'ring</p>

        <div className="fade-up delay-3" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: 12 }}>
          {SITES.map((s, i) => {
            const open = flipped.has(i);
            return (
              <button key={i} className={`ipcard ${open ? 'open' : ''}`} onClick={() => flip(i)}>
                {!open ? (
                  <>
                    <span className="eyebrow" style={{ color: T.ink3, fontSize: 10 }}>Domen</span>
                    <span className="ipcard-d">{s.d}</span>
                    <span className="mono small" style={{ color: T.accent }}>IP-ni ko'rish →</span>
                  </>
                ) : (
                  <>
                    <span className="eyebrow" style={{ color: T.ink3, fontSize: 10 }}>IP-manzil</span>
                    <span className="ipcard-ip mono">{s.ip}</span>
                    <span className="mono small" style={{ color: T.ink3 }}>↺ {s.d}</span>
                  </>
                )}
              </button>
            );
          })}
        </div>

        {flipped.size > 0 && (
          <GoodNote label="Sezdingizmi?">
            Har bir domen ortida shunday raqamli IP-manzil turadi. Inson uchun — qulay nom, kompyuter uchun — aniq raqam.
          </GoodNote>
        )}
      </div>
    </Stage>
  );
};

// ============================================================
// ЭКРАН 6 — DNS (анимация перевода)
// ============================================================
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [sel, setSel] = useState(null);
  const [phase, setPhase] = useState('idle');
  const [done, setDone] = useState(storedAnswer !== undefined);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const lookup = (site) => {
    clearTimeout(timer.current);
    setSel(site);
    setPhase('searching');
    timer.current = setTimeout(() => {
      setPhase('done');
      setDone(true);
      if (storedAnswer === undefined) onAnswer(5, { correct: true, picked: true });
    }, 1100);
  };

  const navContent = (
    <>
      <NavBack onPrev={onPrev} />
      <NavNext disabled={!done} label={done ? 'Davom etish' : 'Domen tanlab ko\u2019ring'} onClick={onNext} />
    </>
  );

  return (
    <Stage eyebrow="DNS" screen={screen} navContent={navContent}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(18px,3vw,24px)' }}>
        <h2 className="title h-title fade-up">
          DNS — internetning<br /><span className="italic" style={{ color: T.accent }}>telefon kitobchasi</span>.
        </h2>
        <p className="body fade-up delay-1" style={{ color: T.ink2 }}>
          Siz <span className="mono">google.com</span> deysiz, lekin kompyuter faqat raqamlarni tushunadi.
          <b style={{ color: T.ink }}> DNS</b> domen nomini IP-manzilga aylantirib beradi.
          DNS bo'lmaganda, har bir saytning raqamini yodlashga to'g'ri kelardi!
        </p>

        <Fact delay="delay-2">
          DNS so'rovi avtomatik va juda tez — odatda millisekundlarda — bajariladi, siz buni sezmaysiz ham.
          Brauzer ko'p kirgan saytlaringizning IP-manzilini eslab qoladi, shuning uchun ular keyingi safar yanada tezroq ochiladi.
        </Fact>

        <div className="frame fade-up delay-3">
          <p className="eyebrow" style={{ color: T.ink2, marginBottom: 12 }}>Domenni tanlang</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 20 }}>
            {SITES.map(s => (
              <button key={s.d} className={`chip ${sel?.d === s.d ? 'chip-on' : ''}`} onClick={() => lookup(s)}>{s.d}</button>
            ))}
          </div>

          <div className="dns-flow">
            <div className="dns-cell">
              <span className="eyebrow" style={{ color: T.ink3, fontSize: 10 }}>Siz aytasiz</span>
              <span className="dns-val" style={{ color: T.ink }}>{sel ? sel.d : '—'}</span>
            </div>
            <div className="dns-box">
              <IconDNS s={26} c={T.accent} />
              {phase === 'searching'
                ? <span className="dns-dots"><i /><i /><i /></span>
                : <span className="mono small" style={{ color: T.ink3, marginTop: 4 }}>DNS</span>}
            </div>
            <div className="dns-cell">
              <span className="eyebrow" style={{ color: T.ink3, fontSize: 10 }}>DNS topadi</span>
              <span className="dns-val mono" style={{ color: phase === 'done' ? T.success : T.ink3 }}>
                {phase === 'done' ? sel.ip : '?.?.?.?'}
              </span>
            </div>
          </div>
        </div>

        {phase === 'done' && (
          <GoodNote label="Tayyor">
            {sel.d} → {sel.ip}. Mana shunday DNS nomni raqamli IP-manzilga "tarjima" qildi — endi brauzer serverni topa oladi.
          </GoodNote>
        )}
      </div>
    </Stage>
  );
};

// ============================================================
// ЭКРАН 7 — ВОПРОС (DNS)
// ============================================================
const Screen6 = (props) => (
  <QuestionScreen
    {...props}
    idx={6}
    scope="practice"
    eyebrow="Mashq · 2-savol"
    questionText="DNS'ning asosiy vazifasi qaysi?"
    question={
      <>
        <p className="eyebrow" style={{ color: T.accent }}>DNS nima qiladi?</p>
        <h2 className="title h-sub" style={{ marginTop: 8 }}>DNS'ning asosiy vazifasi qaysi?</h2>
      </>
    }
    options={[
      'Domen nomini IP-manzilga aylantiradi',
      'Sayt sahifalarini o\u2019zida saqlaydi',
      'Internetga deraza ochadi',
      'Videolarni yuklab oladi'
    ]}
    correctIdx={0}
    explainCorrect="To'g'ri. DNS — telefon kitobchasi kabi: google.com kabi nomni 142.250.74.78 kabi IP-manzilga aylantiradi."
    explainWrong={{
      1: 'Sahifalarni saqlash — serverning ishi. DNS faqat nomni raqamga aylantiradi.',
      2: 'Deraza ochadigan — brauzer. DNS esa nomni IP-manzilga aylantiradi.',
      3: 'Bu DNS emas. DNS faqat nomni raqamli IP-manzilga aylantiradi.',
      default: 'DNS domen nomini (google.com) IP-manzilga (142.250.74.78) aylantiradi.'
    }}
  />
);

// ============================================================
// ЭКРАН 8 — ПУТЬ ЗАПРОСА (пошаговая анимация)
// ============================================================
const JOURNEY = [
  { icon: IconBrowser, t: 'Brauzer', d: 'Siz manzilni yozasiz: google.com' },
  { icon: IconDNS, t: 'DNS', d: 'DNS google.com\u2019ni IP-manzilga aylantiradi' },
  { icon: IconServer, t: 'Server', d: 'Server kerakli sahifani tayyorlaydi' },
  { icon: IconGlobe, t: 'Sayt', d: 'Sahifa ekraningizda paydo bo\u2019ladi' }
];
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [step, setStep] = useState(1);
  const [done, setDone] = useState(storedAnswer !== undefined);

  const advance = () => {
    if (step < 4) {
      const ns = step + 1;
      setStep(ns);
      if (ns === 4) { setDone(true); if (storedAnswer === undefined) onAnswer(7, { correct: true, picked: true }); }
    }
  };

  const navContent = (
    <>
      <NavBack onPrev={onPrev} />
      {step < 4
        ? <button className="btn" onClick={advance}
            style={{ marginLeft: 'auto', padding: 'clamp(12px,2vw,14px) clamp(24px,3vw,32px)', fontSize: 'clamp(14px,1.8vw,16px)' }}>
            Keyingi qadam →
          </button>
        : <NavNext disabled={!done} onClick={onNext} />}
    </>
  );

  return (
    <Stage eyebrow="So'rov yo'li" screen={screen} navContent={navContent}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(20px,3vw,28px)' }}>
        <h2 className="title h-title fade-up">
          So'rov saytgacha qanday<br /><span className="italic" style={{ color: T.accent }}>yetib boradi</span>?
        </h2>

        <p className="body fade-up delay-1" style={{ color: T.ink2 }}>
          Endi hammasini birlashtiramiz. "Keyingi qadam" tugmasini bosib, so'rovning yo'lini bosqichma-bosqich kuzating.
        </p>

        <div className="journey">
          {JOURNEY.map((j, i) => {
            const n = i + 1;
            const active = n <= step;
            const current = n === step;
            const Icon = j.icon;
            return (
              <React.Fragment key={i}>
                <div className="jc-wrap">
                  <div className={`jc ${active ? 'on' : ''} ${current ? 'cur' : ''}`}>
                    {current && <span className="jc-ring" />}
                    <Icon s={22} c={active ? '#fff' : T.ink3} />
                  </div>
                  <span className="jc-label" style={{ color: active ? T.ink : T.ink3 }}>{j.t}</span>
                </div>
                {i < JOURNEY.length - 1 && (
                  <div className={`jc-arrow ${step > n ? 'on' : ''}`}>→</div>
                )}
              </React.Fragment>
            );
          })}
        </div>

        <div className="frame fade-step" key={step}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span className="mono" style={{ fontSize: 'clamp(28px,6vw,44px)', color: T.accent, fontWeight: 700, lineHeight: 1 }}>
              {step}
            </span>
            <div>
              <p className="title" style={{ fontSize: 'clamp(20px,3vw,26px)', margin: 0 }}>{JOURNEY[step - 1].t}</p>
              <p className="body" style={{ margin: '4px 0 0', color: T.ink2 }}>{JOURNEY[step - 1].d}</p>
            </div>
          </div>
        </div>

        {step === 4 && (
          <GoodNote label="Zo'r">
            Brauzer → DNS → Server → Sayt. Bularning barchasi atigi bir necha soniyada sodir bo'ladi! ⚡
          </GoodNote>
        )}
      </div>
    </Stage>
  );
};

// ============================================================
// ЭКРАН 9 — ПОСЛЕДОВАТЕЛЬНОСТЬ (расставь по порядку)
// ============================================================
const ORDER = ['Brauzer', 'DNS', 'Server', 'Sayt'];
const SHUFFLED = ['Server', 'Sayt', 'Brauzer', 'DNS'];
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [placed, setPlaced] = useState([]);
  const [checked, setChecked] = useState(false);
  const [done, setDone] = useState(storedAnswer !== undefined);

  const place = (label) => {
    if (checked) return;
    if (placed.includes(label)) setPlaced(placed.filter(l => l !== label));
    else if (placed.length < 4) setPlaced([...placed, label]);
  };

  const check = () => {
    setChecked(true);
    const ok = placed.every((l, i) => l === ORDER[i]);
    if (ok) { setDone(true); if (storedAnswer === undefined) onAnswer(8, { correct: true, picked: true }); }
  };

  const reset = () => { setPlaced([]); setChecked(false); };
  const isCorrect = checked && placed.every((l, i) => l === ORDER[i]);

  const navContent = (
    <>
      <NavBack onPrev={onPrev} />
      <NavNext disabled={!done} label={done ? 'Davom etish' : 'Tartibni toping'} onClick={onNext} />
    </>
  );

  return (
    <Stage eyebrow="Tartibga solish" screen={screen} navContent={navContent}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(20px,3vw,26px)' }}>
        <h2 className="title h-title fade-up">
          Qadamlarni <span className="italic" style={{ color: T.accent }}>to'g'ri tartibda</span> joylang.
        </h2>
        <p className="body fade-up delay-1" style={{ color: T.ink2 }}>
          Manzil yozilgandan sayt ochilgunicha bo'lgan yo'lni tiklang. Quyidagi kartalarni tartib bilan bosing.
        </p>

        <div className="fade-up delay-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
          {[0, 1, 2, 3].map(i => {
            const label = placed[i];
            let cls = 'slot';
            if (label) cls += ' slot-filled';
            if (checked && label) cls += (label === ORDER[i] ? ' slot-correct' : ' slot-wrong');
            return (
              <div key={i} className={cls} onClick={() => label && !checked && place(label)}>
                <span className="mono small slot-num">{i + 1}</span>
                <span className="slot-label">{label || ''}</span>
              </div>
            );
          })}
        </div>

        <div className="fade-up delay-3" style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
          {SHUFFLED.map(label => (
            <button key={label} className={`chip ${placed.includes(label) ? 'chip-used' : ''}`}
              disabled={placed.includes(label) || checked} onClick={() => place(label)}>
              {label}
            </button>
          ))}
        </div>

        <div className="fade-up delay-4" style={{ display: 'flex', gap: 10 }}>
          <button className="btn" disabled={placed.length !== 4 || checked} onClick={check}
            style={{ padding: 'clamp(12px,2vw,14px) clamp(22px,3vw,28px)', fontSize: 'clamp(14px,1.8vw,16px)' }}>
            Tekshirish
          </button>
          {checked && !isCorrect && (
            <button className="btn btn-ghost" onClick={reset}
              style={{ padding: 'clamp(12px,2vw,14px) clamp(22px,3vw,28px)', fontSize: 'clamp(14px,1.8vw,16px)' }}>
              Qaytadan
            </button>
          )}
        </div>

        {checked && (
          <div className={isCorrect ? 'frame-success' : 'frame-soft'}>
            <p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: isCorrect ? T.success : T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              {isCorrect ? 'To\u2019g\u2019ri tartib' : 'Tartib noto\u2019g\u2019ri'}
            </p>
            <p className="body" style={{ margin: 0 }}>
              {isCorrect
                ? 'Brauzer → DNS → Server → Sayt. Ana shu yo\u2019l bilan har bir sayt ochiladi.'
                : 'To\u2019g\u2019ri tartib: avval Brauzer manzilni oladi, keyin DNS IP topadi, so\u2019ng Server sahifa tayyorlaydi, oxirida Sayt ko\u2019rinadi.'}
            </p>
          </div>
        )}
      </div>
    </Stage>
  );
};

// ============================================================
// ЭКРАН 10 — СЦЕНАРИЙ
// ============================================================
const Screen9 = (props) => (
  <QuestionScreen
    {...props}
    idx={9}
    scope="practice"
    eyebrow="Vaziyat"
    questionText="Laylo brauzerga youtube.com yozib Enter bosdi. Eng birinchi nima sodir bo'ladi?"
    question={
      <>
        <p className="eyebrow" style={{ color: T.accent }}>Laylo sayt ochmoqchi</p>
        <h2 className="title h-sub" style={{ marginTop: 8 }}>
          Laylo brauzerga youtube.com yozib Enter bosdi. Eng birinchi nima sodir bo'ladi?
        </h2>
      </>
    }
    options={[
      'Server darhol videoni yuboradi',
      'Brauzer DNS\u2019dan youtube.com\u2019ning IP-manzilini so\u2019raydi',
      'Sahifa ekranda darhol ko\u2019rinadi',
      'Domen o\u2019zgarib ketadi'
    ]}
    correctIdx={1}
    explainCorrect="To'g'ri. Avval brauzer DNS'dan IP-manzilni so'rashi kerak — manzilsiz serverga murojaat qila olmaydi."
    explainWrong={{
      0: 'Server hali so\u2019rovni olgani yo\u2019q. Avval brauzer DNS orqali IP-manzilni topib olishi kerak.',
      2: 'Sahifa eng oxirida ko\u2019rinadi. Birinchi qadam — DNS orqali IP-manzilni topish.',
      3: 'Domen o\u2019zgarmaydi. Birinchi ish — DNS domenni IP-manzilga aylantiradi.',
      default: 'Birinchi qadam: brauzer DNS\u2019dan youtube.com\u2019ning IP-manzilini so\u2019raydi.'
    }}
  />
);

// ============================================================
// ЭКРАН 11 — ВОПРОС (что такое IP)
// ============================================================
const Screen10 = (props) => (
  <QuestionScreen
    {...props}
    idx={10}
    scope="practice"
    eyebrow="Mashq · 3-savol"
    questionText="142.250.74.78 — bu nima?"
    question={
      <>
        <p className="eyebrow" style={{ color: T.accent }}>Bu nima?</p>
        <h2 className="title h-sub" style={{ marginTop: 8 }}>
          <span className="mono" style={{ color: T.ink }}>142.250.74.78</span> — bu nima?
        </h2>
      </>
    }
    options={['Domen nomi', 'IP-manzil', 'Brauzer nomi', 'DNS server']}
    correctIdx={1}
    explainCorrect="To'g'ri. Bu — IP-manzil: kompyuter tushunadigan raqamli manzil. Insonning telefon raqami kabi."
    explainWrong={{
      0: 'Domen — bu google.com kabi nom. Raqamlardan iborat bu manzil esa IP-manzil deyiladi.',
      2: 'Brauzer — bu Chrome yoki Safari kabi dastur nomi, raqamli manzil emas. Bu raqamlar — IP-manzil.',
      3: 'DNS — bu nomni IP-ga aylantiruvchi xizmat, manzilning o\u2019zi emas. Raqamli manzil — IP-manzil.',
      default: 'Raqamlardan iborat bu manzil — IP-manzil. Domen esa google.com kabi nom.'
    }}
  />
);

// ============================================================
// ЭКРАН 12 — ФИНАЛЬНЫЙ ВОПРОС (порядок) [scope:'final']
// ============================================================
const Screen11 = (props) => (
  <QuestionScreen
    {...props}
    idx={11}
    scope="final"
    eyebrow="Yakuniy tekshiruv"
    questionText="Manzil yozilgandan sayt ochilgunicha bo'lgan to'g'ri yo'l qaysi?"
    question={
      <>
        <p className="eyebrow" style={{ color: T.accent }}>To'g'ri tartibni tanlang</p>
        <h2 className="title h-sub" style={{ marginTop: 8 }}>
          Manzil yozilgandan sayt ochilgunicha bo'lgan to'g'ri yo'l qaysi?
        </h2>
      </>
    }
    options={[
      'Brauzer → DNS → Server → Sayt',
      'Server → DNS → Brauzer → Sayt',
      'DNS → Server → Brauzer → Sayt',
      'Brauzer → Server → DNS → Sayt'
    ]}
    correctIdx={0}
    explainCorrect="To'g'ri! Brauzer manzilni oladi, DNS IP topadi, Server sahifa tayyorlaydi, Sayt ekranda ko'rinadi."
    explainWrong={{
      1: 'Server birinchi bo\u2019la olmaydi — unga murojaat qilish uchun avval IP-manzil kerak. To\u2019g\u2019ri yo\u2019l: Brauzer → DNS → Server → Sayt.',
      2: 'DNS birinchi emas: avval brauzer manzilni qabul qiladi, keyin DNS\u2019ga murojaat qiladi. To\u2019g\u2019ri yo\u2019l: Brauzer → DNS → Server → Sayt.',
      3: 'Server\u2019ga DNS\u2019dan oldin borib bo\u2019lmaydi — IP-manzilsiz server topilmaydi. To\u2019g\u2019ri yo\u2019l: Brauzer → DNS → Server → Sayt.',
      default: 'Eslab qoling: Brauzer → DNS → Server → Sayt. Avval manzil, keyin IP, so\u2019ng tayyor sahifa, oxirida ekran.'
    }}
  />
);

// ============================================================
// ЭКРАН 13 — ФИНАЛ + БАЛЛЫ/КОИНЫ
// ============================================================
const Screen12 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const correct = SCORED_IDX.filter(i => answers[i]?.correct).length;
  const total = SCORED_IDX.length;
  const coins = correct * COIN_PER;

  const navContent = (
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
  );

  return (
    <Stage eyebrow="Tayyor" screen={screen} navContent={navContent}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 'clamp(18px,3.5vw,30px)' }}>
        <div className="fade-up">
          <p className="eyebrow" style={{ color: T.accent }}>Dars tugadi</p>
          <h2 className="title h-title" style={{ marginTop: 10 }}>
            Internet qanday<br /><span className="italic">ishlashini</span> bilib oldingiz.
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
            {correct >= total * 0.85 && 'Ajoyib! Mavzu to\u2019liq tushunarli.'}
            {correct >= total * 0.6 && correct < total * 0.85 && 'Yaxshi! Bir-ikki joyni takrorlasangiz bo\u2019ldi.'}
            {correct < total * 0.6 && 'Darsni yana bir bor ko\u2019rib chiqsangiz foydali bo\u2019ladi.'}
          </p>
        </div>

        <div className="fade-up delay-2 frame" style={{ background: T.bg }}>
          <p className="eyebrow" style={{ color: T.accent, margin: 0 }}>Kalit so'zlar</p>
          <ul className="body" style={{ marginTop: 12, paddingLeft: 20, color: T.ink2, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li><b style={{ color: T.ink }}>Brauzer</b> — internetga deraza, so'rovni olib boruvchi ofitsiant</li>
            <li><b style={{ color: T.ink }}>Server</b> — sahifalarni saqlovchi va tayyorlovchi oshxona</li>
            <li><b style={{ color: T.ink }}>Domen va IP</b> — ism va telefon raqami</li>
            <li><b style={{ color: T.ink }}>DNS</b> — nomni IP-manzilga aylantiruvchi telefon kitobchasi</li>
          </ul>
        </div>
      </div>
    </Stage>
  );
};

// ============================================================
// ГЛАВНЫЙ КОМПОНЕНТ — получает onFinished от LMS
// ============================================================
export default function InternetLesson({ onFinished }) {
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

  const screens = [Screen0, Screen1, Screen2, Screen3, Screen4, Screen5, Screen6, Screen7, Screen8, Screen9, Screen10, Screen11, Screen12];
  const Current = screens[screen];

  return (
    <>
      <style>{`
        /* Шрифты приходят от LMS (Manrope, Fraunces, JetBrains Mono).
           Для standalone-предпросмотра можно временно раскомментировать строку ниже: */
        /* @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500&family=JetBrains+Mono:wght@400;500;700&display=swap'); */

        html, body { margin: 0; padding: 0; }
        .lesson-root, .lesson-root * { box-sizing: border-box; }
        .lesson-root {
          font-family: 'Manrope', system-ui, sans-serif;
          color: ${T.ink};
          background: ${T.bg};
          height: 100dvh;
          overflow: hidden;
          -webkit-font-smoothing: antialiased;
        }

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
        .chip-used { opacity: 0.35; cursor: default; text-decoration: line-through; }
        .chip:disabled { cursor: default; }

        .slot { position: relative; min-height: 70px; border: 2px dashed ${T.ink3}; border-radius: 12px; display: flex; align-items: center; justify-content: center; background: ${T.paper}; transition: all 0.2s; padding: 8px 4px; }
        .slot-num { position: absolute; top: 6px; left: 8px; color: ${T.ink3}; }
        .slot-label { font-family: 'Manrope'; font-weight: 700; font-size: clamp(13px,1.8vw,16px); color: ${T.ink}; }
        .slot-filled { border-style: solid; border-color: ${T.ink}; cursor: pointer; }
        .slot-correct { border-color: ${T.success} !important; background: ${T.successSoft} !important; }
        .slot-wrong { border-color: ${T.accent} !important; background: ${T.accentSoft} !important; }

        .ipcard { font-family: 'Manrope'; border: 1.5px solid ${T.ink}; background: ${T.paper}; border-radius: 14px; padding: 16px 12px; cursor: pointer; display: flex; flex-direction: column; align-items: center; gap: 8px; min-height: 110px; justify-content: center; transition: all 0.2s; }
        .ipcard:hover { transform: translateY(-2px); box-shadow: 0 8px 20px -10px rgba(0,0,0,0.25); }
        .ipcard.open { border-color: ${T.accent}; background: ${T.accentSoft}; }
        .ipcard-d { font-family: 'JetBrains Mono'; font-weight: 700; font-size: clamp(14px,2vw,17px); color: ${T.ink}; }
        .ipcard-ip { font-weight: 700; font-size: clamp(14px,2vw,17px); color: ${T.accent}; }

        .srv-scene { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .srv-node { display: flex; flex-direction: column; align-items: center; gap: 8px; flex-shrink: 0; }
        .srv-circle { width: clamp(50px,12vw,64px); height: clamp(50px,12vw,64px); border-radius: 50%; display: flex; align-items: center; justify-content: center; transition: box-shadow 0.3s; }
        .srv-track { position: relative; flex: 1; height: 40px; }
        .srv-packet { position: absolute; top: 50%; transform: translateY(-50%); font-family: 'JetBrains Mono'; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 99px; white-space: nowrap; transition: left 0.8s cubic-bezier(.4,0,.2,1), opacity 0.3s; }
        .srv-packet.req { left: 0; background: ${T.ink}; color: #fff; }
        .srv-packet.req.go { left: calc(100% - 48px); }
        .srv-packet.resp { left: calc(100% - 48px); background: ${T.success}; color: #fff; }
        .srv-packet.resp.go { left: 0; }
        .srv-packet.resp.parked { left: 0; }
        .srv-packet.hide { opacity: 0; }

        .dns-flow { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
        .dns-cell { display: flex; flex-direction: column; align-items: center; gap: 4px; flex: 1; text-align: center; }
        .dns-val { font-family: 'JetBrains Mono'; font-weight: 700; font-size: clamp(13px,2.3vw,18px); }
        .dns-box { flex-shrink: 0; width: clamp(56px,14vw,72px); height: clamp(56px,14vw,72px); border-radius: 16px; border: 1.5px solid ${T.accent}; background: ${T.accentSoft}; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .dns-dots { display: flex; gap: 3px; margin-top: 4px; }
        .dns-dots i { width: 5px; height: 5px; border-radius: 50%; background: ${T.accent}; animation: dns-blink 1s infinite; }
        .dns-dots i:nth-child(2){ animation-delay: .2s; } .dns-dots i:nth-child(3){ animation-delay: .4s; }
        @keyframes dns-blink { 0%,100%{ opacity:.25; } 50%{ opacity:1; } }

        .browser-bar { display: flex; align-items: center; gap: 12px; background: ${T.paper}; border: 1.5px solid ${T.ink}; border-radius: 12px; padding: 12px 16px; }
        .bb-dots { display: flex; gap: 5px; }
        .bb-dots i { width: 9px; height: 9px; border-radius: 50%; background: ${T.ink3}; }
        .bb-dots i:first-child{ background:#ff5f57; } .bb-dots i:nth-child(2){ background:#febc2e; } .bb-dots i:nth-child(3){ background:#28c840; }
        .bb-url { flex: 1; font-family: 'JetBrains Mono'; font-weight: 500; font-size: clamp(15px,2.3vw,19px); color: ${T.ink}; }
        .bb-caret { color: ${T.accent}; animation: blink 1s steps(1) infinite; }
        @keyframes blink { 50% { opacity: 0; } }
        .bb-enter { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink3}; border: 1px solid ${T.ink3}; padding: 3px 8px; border-radius: 6px; white-space: nowrap; }

        .journey { display: flex; align-items: flex-start; justify-content: space-between; gap: 2px; padding: 8px 0; }
        .jc-wrap { display: flex; flex-direction: column; align-items: center; gap: 8px; flex-shrink: 0; }
        .jc { position: relative; width: clamp(46px,13vw,64px); height: clamp(46px,13vw,64px); border-radius: 50%; border: 2px solid ${T.ink3}; background: ${T.paper}; display: flex; align-items: center; justify-content: center; transition: all 0.35s cubic-bezier(.2,.7,.2,1); }
        .jc.on { background: ${T.accent}; border-color: ${T.accent}; }
        .jc.cur { transform: scale(1.08); box-shadow: 0 10px 24px -10px ${T.accent}; }
        .jc-ring { position: absolute; inset: -4px; border-radius: 50%; border: 2px solid ${T.accent}; animation: ring 1.4s ease-out infinite; }
        @keyframes ring { 0%{ transform: scale(1); opacity:.7; } 100%{ transform: scale(1.4); opacity:0; } }
        .jc-label { font-family: 'Manrope'; font-weight: 700; font-size: clamp(11px,2.3vw,14px); }
        .jc-arrow { font-family: 'Manrope'; font-weight: 700; font-size: clamp(16px,4vw,22px); color: ${T.ink3}; margin-top: clamp(12px,4vw,20px); transition: color 0.35s; }
        .jc-arrow.on { color: ${T.accent}; }

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

        .frame { background: ${T.paper}; border: 1.5px solid ${T.ink}; border-radius: 16px; padding: clamp(18px,4vw,32px); }
        .frame-soft { background: ${T.accentSoft}; border-left: 4px solid ${T.accent}; border-radius: 12px; padding: clamp(16px,3vw,24px); }
        .frame-success { background: ${T.successSoft}; border-left: 4px solid ${T.success}; border-radius: 12px; padding: clamp(16px,3vw,24px); }
      `}</style>
      <div className="lesson-root">
        <Current
          screen={screen}
          storedAnswer={answers[screen]}
          answers={answers}
          onAnswer={recordAnswer}
          onNext={next}
          onPrev={prev}
          onReset={reset}
          onFinish={finishLesson}
        />
      </div>
    </>
  );
}