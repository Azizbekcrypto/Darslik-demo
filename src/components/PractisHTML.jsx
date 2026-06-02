import React, { useState, useEffect } from 'react';

// LOYIHA · PORTFOLIO STRUKTURASI (v2) · 17 ekran · 12–17 yosh
// Yangi: talaba ismini boshida kiritadi, dars davomida shu ism ishlatiladi.
// Build ekranlarda real vaqtda input — talaba o'z portfolio'sini kichik-kichik yozib boradi.

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
const SCORED = [4, 8, 11, 15];
const COIN_PER = 10;

const TOPICS = [
  'Portfolio nima va nima uchun?',
  'Sahifani qismlarga ajratish',
  'HTML skelet — yo\u2019l xaritasi',
  'Header, Hero, Loyihalar, Aloqa, Footer',
  'Sizning portfolio strukturangiz'
];

// Primitives
const CodeBox = ({ children }) => <pre className="code-box">{children}</pre>;
const Tg = ({ children }) => <span style={{ color: CODE.tag }}>{children}</span>;
const At = ({ children }) => <span style={{ color: CODE.attr }}>{children}</span>;
const Sr = ({ children }) => <span style={{ color: CODE.str }}>{children}</span>;
const Cm = ({ children }) => <span style={{ color: CODE.comment, fontStyle: 'italic' }}>{children}</span>;
const Pn = ({ children }) => <span style={{ color: CODE.punct }}>{children}</span>;

const Preview = ({ children, title = 'portfolio.html', minH }) => (
  <div className="bp-window">
    <div className="bp-bar">
      <span className="bb-dots"><i /><i /><i /></span>
      <span className="bp-title">{title}</span>
    </div>
    <div className="bp-body" style={{ minHeight: minH, padding: 0 }}>{children}</div>
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

const QuestionScreen = ({ screen, idx, eyebrow, question, options, correctIdx, explainCorrect, explainWrong, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const [revealed, setRevealed] = useState(storedAnswer !== undefined);
  const pick = (i) => {
    if (revealed) return;
    setPicked(i); setRevealed(true);
    onAnswer(idx, i === correctIdx, i);
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

// ============================================================
// PORTFOLIO QISMLARI — user object'iga moslangan
// ============================================================
const TNR = "Times New Roman, serif";

const safeSlug = (s) => (s || 'aziz').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 18) || 'aziz';

const PHeader = ({ user, inspector }) => (
  <header data-tag="header" className={inspector ? 'insp' : ''} style={{ padding: '12px 16px' }}>
    <h1 style={{ fontFamily: TNR, margin: '0 0 6px', fontSize: 24, fontWeight: 700, color: '#000' }}>{user.name || 'Aziz'}</h1>
    <nav data-tag="nav" className={inspector ? 'insp' : ''} style={{ display: 'flex', gap: 14, fontFamily: TNR, flexWrap: 'wrap' }}>
      <a style={{ color: '#0000EE', textDecoration: 'underline', fontSize: 14 }}>Asosiy</a>
      <a style={{ color: '#0000EE', textDecoration: 'underline', fontSize: 14 }}>Loyihalar</a>
      <a style={{ color: '#0000EE', textDecoration: 'underline', fontSize: 14 }}>Aloqa</a>
    </nav>
  </header>
);

const PHero = ({ user, inspector }) => (
  <section data-tag='section id="about"' className={inspector ? 'insp' : ''} style={{ padding: '6px 16px 14px' }}>
    <h2 style={{ fontFamily: TNR, margin: '0 0 6px', fontSize: 20, fontWeight: 700, color: '#000' }}>Salom, men {user.name || 'Aziz'}! 👋</h2>
    <p style={{ fontFamily: TNR, margin: '0 0 4px', fontSize: 14, lineHeight: 1.45, color: '#000' }}>{user.age || '15'} yoshli o'quvchi va yosh veb-dasturchi.</p>
    <p style={{ fontFamily: TNR, margin: 0, fontSize: 14, lineHeight: 1.45, color: '#000' }}>{user.bio || 'HTML va CSS bilan saytlar yarataman.'}</p>
  </section>
);

const PProjects = ({ user, inspector }) => (
  <section data-tag='section id="projects"' className={inspector ? 'insp' : ''} style={{ padding: '6px 16px 14px' }}>
    <h2 style={{ fontFamily: TNR, margin: '0 0 10px', fontSize: 20, fontWeight: 700, color: '#000' }}>Mening loyihalarim</h2>
    {(user.projects || []).map((p, i) => (
      <article data-tag="article" key={i} className={inspector ? 'insp' : ''} style={{ marginBottom: 10 }}>
        <h3 style={{ fontFamily: TNR, margin: '0 0 4px', fontSize: 16, fontWeight: 700, color: '#000' }}>{p.title}</h3>
        <p style={{ fontFamily: TNR, margin: 0, fontSize: 13, color: '#000' }}>{p.desc}</p>
      </article>
    ))}
  </section>
);

const PContact = ({ user, inspector }) => {
  const slug = safeSlug(user.name);
  return (
    <section data-tag='section id="contact"' className={inspector ? 'insp' : ''} style={{ padding: '6px 16px 14px' }}>
      <h2 style={{ fontFamily: TNR, margin: '0 0 6px', fontSize: 20, fontWeight: 700, color: '#000' }}>Meni topish</h2>
      <p style={{ fontFamily: TNR, margin: '0 0 4px', fontSize: 14, color: '#000' }}>
        Email: <a style={{ color: '#0000EE', textDecoration: 'underline' }}>{slug}@mail.com</a>
      </p>
      <p style={{ fontFamily: TNR, margin: 0, fontSize: 14, color: '#000' }}>
        Telegram: <a style={{ color: '#0000EE', textDecoration: 'underline' }}>@{slug}_codes</a>
      </p>
    </section>
  );
};

const PFooter = ({ user, inspector }) => (
  <footer data-tag="footer" className={inspector ? 'insp' : ''} style={{ borderTop: '1px solid #ccc', padding: '10px 16px' }}>
    <p style={{ fontFamily: TNR, margin: 0, fontSize: 12, color: '#666' }}>
      © 2025 {user.name || 'Aziz'}. Barcha huquqlar himoyalangan.
    </p>
  </footer>
);

const EmptySlot = ({ label }) => (
  <div style={{
    border: `1.5px dashed ${T.ink3}`, borderRadius: 6, padding: 14, margin: '8px 12px',
    color: T.ink3, fontFamily: 'JetBrains Mono', fontSize: 12, textAlign: 'center', background: T.bg
  }}>
    {label}
  </div>
);

// Yangi teg karta
const TagCard = ({ tag, desc }) => (
  <div className="tag-card">
    <code className="tag-card-tag">{tag}</code>
    <span className="tag-card-desc">{desc}</span>
  </div>
);

// ============================================================
// SCREEN 0 — TANISHAYLIK (ism + yosh)
// ============================================================
const Screen0 = ({ screen, user, updateUser, onNext }) => {
  const [hasInteracted, setHasInteracted] = useState(false);
  return (
    <Stage eyebrow="Tanishaylik" screen={screen} navContent={
      <div style={{ display: 'flex', gap: 12, width: '100%' }}>
        <NavNext label="Boshlash →" onClick={onNext} />
      </div>
    }>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(18px,3vw,26px)' }}>
        <h1 className="title h-title fade-up">
          Bugun <span className="italic" style={{ color: T.accent }}>siz</span> uchun portfolio yasaymiz.
        </h1>
        <p className="body fade-up delay-1" style={{ color: T.ink2 }}>
          Bu — birinchi haqiqiy loyihangiz. Avval <b style={{ color: T.ink }}>tanishaylik</b> — dars
          davomida sizning ismingiz ishlatiladi. Bo'sh qoldirsangiz, namuna sifatida <b style={{ color: T.ink }}>Aziz</b>
          (15 yosh) bilan davom etamiz.
        </p>
        <div className="fade-up delay-2 frame" style={{ background: T.accentSoft, borderColor: T.accent }}>
          <p className="eyebrow" style={{ color: T.accent, margin: '0 0 14px' }}>✨ O'zingizni kiriting (ixtiyoriy)</p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 8 }}>
            <div style={{ flex: 2, minWidth: 160 }}>
              <p className="small" style={{ color: T.ink2, margin: '0 0 4px', fontWeight: 600 }}>Ismingiz</p>
              <input className="text-input" placeholder="Masalan: Aziz"
                value={user.name === 'Aziz' && !hasInteracted ? '' : user.name}
                onChange={e => { setHasInteracted(true); updateUser('name', e.target.value); }}
                onFocus={() => setHasInteracted(true)} maxLength={20} />
            </div>
            <div style={{ flex: 1, minWidth: 90 }}>
              <p className="small" style={{ color: T.ink2, margin: '0 0 4px', fontWeight: 600 }}>Yoshingiz</p>
              <input className="text-input" placeholder="15"
                value={user.age === '15' && !hasInteracted ? '' : user.age}
                onChange={e => { setHasInteracted(true); updateUser('age', e.target.value); }}
                onFocus={() => setHasInteracted(true)} maxLength={3} />
            </div>
          </div>
        </div>
        <Fact delay="delay-3">
          Tanlovingiz dars davomida saqlanadi. Har bo'limda yana o'zgartirishingiz mumkin —
          har <span className="mono">"Qo'shamiz"</span> tugmasi tagida kichik maydon bo'ladi.
        </Fact>
        <div className="fade-up delay-4 frame" style={{ background: T.paper }}>
          <p className="eyebrow" style={{ color: T.ink3, margin: '0 0 10px' }}>Hozir tayyor:</p>
          <p className="body" style={{ margin: 0, color: T.ink }}>
            <b>{user.name || 'Aziz'}</b> ({user.age || '15'} yosh) — sayt tayyorlanmoqda.
          </p>
        </div>
      </div>
    </Stage>
  );
};

// ============================================================
// SCREEN 1 — BUGUN BOSHLAYMIZ
// ============================================================
const Screen1 = ({ screen, user, onNext, onPrev }) => (
  <Stage eyebrow="Reja" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext label="Boshlaymiz! →" onClick={onNext} /></>}>
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(18px,3vw,24px)' }}>
      <h2 className="title h-title fade-up">
        Bugun <b style={{ fontStyle: 'italic', color: T.accent, fontWeight: 400 }}>{user.name || 'Aziz'}</b> uchun
        portfolio yasaymiz!
      </h2>
      <p className="body fade-up delay-1" style={{ color: T.ink2 }}>
        Bu dars boshqacha — endi nazariya emas. Bizning birinchi haqiqiy <b style={{ color: T.ink }}>loyihamiz</b> bor:
        portfolio sayt. <b style={{ color: T.ink }}>Faqat HTML</b> — keyingi darsda CSS bilan bezaymiz.
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
        Loyiha darsi — siz <b>real coder</b>siz. Har qismni o'z qo'lingiz bilan to'ldirasiz, preview real vaqtda yangilanadi.
      </Fact>
    </div>
  </Stage>
);

// ============================================================
// SCREEN 2 — PORTFOLIO NIMA UCHUN
// ============================================================
const REASONS = [
  { icon: '🎓', title: 'Universitet', body: 'Qabul vaqtida o\u2019zingizni ko\u2019rsatish — admission committee uchun yaxshi taassurot.' },
  { icon: '💼', title: 'Ish', body: 'Birinchi ish so\u2019rayotganda CV bilan birga — siz boshqalardan ajralib turasiz.' },
  { icon: '🌍', title: 'Internet', body: 'Google\u2019da ismingizni qidirganlarga — siz tayyor sayt bilan chiqasiz.' },
  { icon: '✨', title: 'Do\u2019stlar', body: 'Ish yoki loyihalaringizni ko\u2019rsatish uchun — havola yuborasiz va tamom.' }
];
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [active, setActive] = useState(null);
  const [clicked, setClicked] = useState(new Set());
  const done = clicked.size >= 2 || storedAnswer !== undefined;
  const tap = (i) => {
    setActive(i);
    const next = new Set(clicked); next.add(i);
    setClicked(next);
    if (next.size >= 2 && storedAnswer === undefined) onAnswer(2, true, true);
  };
  return (
    <Stage eyebrow="Portfolio nima uchun" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Kamida 2 sababi ko'ring (${clicked.size}/2)`} onClick={onNext} /></>}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(18px,3vw,22px)' }}>
        <h2 className="title h-title fade-up">
          Portfolio — sizning <span className="italic" style={{ color: T.accent }}>vizit kartochkangiz</span> internetda.
        </h2>
        <p className="body fade-up delay-1" style={{ color: T.ink2 }}>
          Internetda <b style={{ color: T.ink }}>kim ekanligingizni</b>, <b style={{ color: T.ink }}>nima qila olishingizni</b>,
          <b style={{ color: T.ink }}> qaysi loyihalaringizni</b> va <b style={{ color: T.ink }}>qanday bog'lanishni</b> bir joyda ko'rsatadi.
        </p>
        <p className="small fade-up delay-2" style={{ color: T.ink3 }}>
          4 ta sababdan kamida 2 tasini ko'ring — bossangiz ochiladi.
        </p>
        <div className="reason-grid fade-up delay-3">
          {REASONS.map((r, i) => (
            <button key={i} className={`reason-card ${active === i ? 'active' : ''} ${clicked.has(i) ? 'seen' : ''}`} onClick={() => tap(i)}>
              <span className="reason-icon">{r.icon}</span>
              <span className="reason-title">{r.title}</span>
            </button>
          ))}
        </div>
        {active !== null && (
          <div className="frame-soft fade-step" key={active}>
            <p className="eyebrow" style={{ color: T.accent, margin: 0 }}>{REASONS[active].title}</p>
            <p className="body" style={{ color: T.ink, margin: '8px 0 0' }}>{REASONS[active].body}</p>
          </div>
        )}
      </div>
    </Stage>
  );
};

// ============================================================
// SCREEN 3 — MANA YARATAMIZ (talaba ismi bilan)
// ============================================================
const Screen3 = ({ screen, user, onNext, onPrev }) => (
  <Stage eyebrow="Maqsad" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext label="Davom etish" onClick={onNext} /></>}>
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(18px,3vw,22px)' }}>
      <h2 className="title h-title fade-up">
        Mana — <b style={{ fontStyle: 'italic', color: T.accent, fontWeight: 400 }}>{user.name || 'Aziz'}</b>'ning portfolio'si!
      </h2>
      <p className="body fade-up delay-1" style={{ color: T.ink2 }}>
        Hozircha bu — namuna. Ammo darsning oxirida <b style={{ color: T.ink }}>siz o'zingiz</b> aynan shunday sahifani yasaysiz.
        HTML bilan <b style={{ color: T.ink }}>bezaksiz</b> — keyingi darsda CSS bilan chiroyli bo'ladi.
      </p>
      <div className="fade-up delay-2">
        <Preview title={`${safeSlug(user.name)}.html`} minH={300}>
          <PHeader user={user} />
          <PHero user={user} />
          <PProjects user={user} />
          <PContact user={user} />
          <PFooter user={user} />
        </Preview>
      </div>
      <Fact delay="delay-3">
        Bu — HTML "skelet". Bezaksiz ko'rinadi, lekin <b>kuchli asos</b>. Keyingi dars (CSS) bu sahifani butunlay
        boshqacha qiladi 🎨
      </Fact>
    </div>
  </Stage>
);

// ============================================================
// SCREEN 4 — MCQ #1 [SCORED]
// ============================================================
const Screen4 = (props) => (
  <QuestionScreen {...props} idx={4} eyebrow="Mashq · 1-savol"
    question={
      <>
        <p className="eyebrow" style={{ color: T.accent }}>Portfolio nima?</p>
        <h2 className="title h-sub" style={{ marginTop: 8 }}>
          Portfolio sayt — bu...
        </h2>
      </>
    }
    options={[
      'Faqat fotosuratlar albomi',
      'O\u2019zingizni ko\u2019rsatuvchi shaxsiy sayt — vizit kartochka',
      'Kompyuter o\u2019yini saqlash dasturi',
      'Faqat dasturchilar uchun maxsus dastur'
    ]} correctIdx={1}
    explainCorrect="To'g'ri. Portfolio — siz haqingizdagi shaxsiy sayt: kim siz, nima qila olasiz, qanday loyihalar yasagansiz, va qanday bog'lanish mumkin."
    explainWrong={{
      0: 'Portfolio\u2019da fotosurat bo\u2019lishi mumkin, lekin asosi — siz haqingizdagi to\u2019liq ma\u2019lumot.',
      2: 'Bu kompyuter o\u2019yiniga aloqasi yo\u2019q. Portfolio — siz haqingizdagi sayt.',
      3: 'Portfolio har kasb uchun foydali — dizayner, rassom, yozuvchi, o\u2019quvchi — barchasi uchun.',
      default: 'Portfolio — sizning shaxsiy vizit kartochkangiz internetda.'
    }} />
);

// ============================================================
// SCREEN 5 — DEKOMPOZITSIYA (drag-to-reorder)
// ============================================================
const PARTS_META = {
  header: { label: 'Header', emoji: '👋', desc: 'Logo va navigatsiya' },
  hero: { label: 'Hero', emoji: '✨', desc: '"Salom, men..." + qisqa bio' },
  projects: { label: 'Loyihalar', emoji: '📂', desc: 'Ishlaringizning kartalari' },
  contact: { label: 'Aloqa', emoji: '📧', desc: 'Email, Telegram' },
  footer: { label: 'Footer', emoji: '📜', desc: 'Copyright, oxiri' }
};
const CORRECT_ORDER = ['header', 'hero', 'projects', 'contact', 'footer'];
const INITIAL_SHUFFLED = ['projects', 'footer', 'header', 'contact', 'hero'];

const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [order, setOrder] = useState(storedAnswer !== undefined ? CORRECT_ORDER : INITIAL_SHUFFLED);
  const isCorrect = order.every((id, i) => id === CORRECT_ORDER[i]);
  const [hasReported, setHasReported] = useState(storedAnswer !== undefined);

  useEffect(() => {
    if (isCorrect && !hasReported && storedAnswer === undefined) {
      setHasReported(true);
      onAnswer(5, true, true);
    }
  }, [isCorrect, hasReported, onAnswer, storedAnswer]);

  const moveUp = (i) => {
    if (i === 0) return;
    const next = [...order];
    [next[i - 1], next[i]] = [next[i], next[i - 1]];
    setOrder(next);
  };
  const moveDown = (i) => {
    if (i === order.length - 1) return;
    const next = [...order];
    [next[i + 1], next[i]] = [next[i], next[i + 1]];
    setOrder(next);
  };

  return (
    <Stage eyebrow="Dekompozitsiya · tartibga keltiring" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!isCorrect} label={isCorrect ? 'To\u2019g\u2019ri! Davom →' : 'Aralash — to\u2019g\u2019rilang'} onClick={onNext} /></>}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(16px,3vw,22px)' }}>
        <h2 className="title h-title fade-up">
          Sahifa <span className="italic" style={{ color: T.accent }}>5 ta qism</span>dan iborat.
        </h2>
        <p className="body fade-up delay-1" style={{ color: T.ink2 }}>
          Lekin tartibi aralashgan! Yuqori va past tugmalar bilan to'g'ri tartibga qo'ying:
          <b style={{ color: T.ink }}> Header → Hero → Loyihalar → Aloqa → Footer</b>.
        </p>
        <div className="fade-up delay-2 reorder-list">
          {order.map((id, i) => {
            const m = PARTS_META[id];
            const inRightPlace = CORRECT_ORDER[i] === id;
            return (
              <div key={id} className={`reorder-item ${isCorrect ? 'all-correct' : inRightPlace ? 'in-place' : ''}`}>
                <span className="reorder-num">{i + 1}</span>
                <span className="reorder-emoji">{m.emoji}</span>
                <div className="reorder-content">
                  <p className="reorder-label">{m.label}</p>
                  <p className="reorder-desc">{m.desc}</p>
                </div>
                <div className="reorder-actions">
                  <button className="reorder-btn" disabled={i === 0 || isCorrect} onClick={() => moveUp(i)} aria-label="Yuqoriga">▲</button>
                  <button className="reorder-btn" disabled={i === order.length - 1 || isCorrect} onClick={() => moveDown(i)} aria-label="Pastga">▼</button>
                </div>
              </div>
            );
          })}
        </div>
        {isCorrect ? (
          <GoodNote label="Tartib to'g'ri!">
            Mana shu — portfolio sahifaning standart tartibi. Endi har qismni alohida ko'rib chiqamiz.
          </GoodNote>
        ) : (
          <p className="small fade-up" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic' }}>
            ↑↓ tugmalarini bosib qismlarni almashtiring
          </p>
        )}
      </div>
    </Stage>
  );
};

// ============================================================
// SCREEN 6 — HTML SKELET
// ============================================================
const Screen6 = ({ screen, user, onNext, onPrev }) => (
  <Stage eyebrow="HTML skelet" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext label="Header'dan boshlaymiz →" onClick={onNext} /></>}>
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(18px,3vw,22px)' }}>
      <h2 className="title h-title fade-up">
        Skelet — <span className="italic" style={{ color: T.accent }}>yo'l xaritamiz</span>.
      </h2>
      <p className="body fade-up delay-1" style={{ color: T.ink2 }}>
        Avval bo'sh skelet — 5 ta <b style={{ color: T.ink }}>sharh-belgi</b> body ichida. Sharhlar
        <span className="mono"> {'<!-- ... -->'}</span> brauzerga ko'rinmaydi — bu faqat biz uchun
        <b style={{ color: T.ink }}> belgilar</b>. Keyin har birini almashtirib boramiz.
      </p>
      <div className="fade-up delay-2">
        <CodeBox>
          <Tg>{'<!DOCTYPE html>'}</Tg>{'\n'}
          <Tg>{'<html '}</Tg><At>lang</At><Pn>=</Pn><Sr>"uz"</Sr><Tg>{'>'}</Tg>{'\n'}
          <Tg>{'<head>'}</Tg>{'\n'}
          {'  '}<Tg>{'<meta '}</Tg><At>charset</At><Pn>=</Pn><Sr>"UTF-8"</Sr><Tg>{'>'}</Tg>{'\n'}
          {'  '}<Tg>{'<title>'}</Tg>{user.name || 'Aziz'} — Portfolio<Tg>{'</title>'}</Tg>{'\n'}
          <Tg>{'</head>'}</Tg>{'\n'}
          <Tg>{'<body>'}</Tg>{'\n'}
          {'  '}<Cm>{'<!-- 1. Header -->'}</Cm>{'\n'}
          {'  '}<Cm>{'<!-- 2. Hero -->'}</Cm>{'\n'}
          {'  '}<Cm>{'<!-- 3. Loyihalar -->'}</Cm>{'\n'}
          {'  '}<Cm>{'<!-- 4. Aloqa -->'}</Cm>{'\n'}
          {'  '}<Cm>{'<!-- 5. Footer -->'}</Cm>{'\n'}
          <Tg>{'</body>'}</Tg>{'\n'}
          <Tg>{'</html>'}</Tg>
        </CodeBox>
      </div>
      <div className="fade-up delay-3" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <TagCard tag="<!DOCTYPE html>" desc="HTML5 versiyasini ko'rsatadi" />
        <TagCard tag="<meta charset>" desc="Uzbek harflar uchun" />
        <TagCard tag="<!-- ... -->" desc="Sharh, brauzerga ko'rinmaydi" />
      </div>
      <Fact delay="delay-4">
        <b>Maslahat:</b> har doim avval rejani tuzing — keyin kod yozish oson. Bu tajribali dasturchilar usuli.
      </Fact>
    </div>
  </Stage>
);

// ============================================================
// SCREEN 7 — HEADER QO'SHAMIZ (talaba ismini real vaqtda kiritadi)
// ============================================================
const Screen7 = ({ screen, user, updateUser, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [added, setAdded] = useState(storedAnswer !== undefined);
  const add = () => {
    setAdded(true);
    if (storedAnswer === undefined) onAnswer(7, true, true);
  };
  return (
    <Stage eyebrow="1-qism · Header" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!added} label={added ? 'Davom etish' : 'Header qo\u2019shing'} onClick={onNext} /></>}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(16px,3vw,22px)' }}>
        <h2 className="title h-title fade-up">
          1. <span className="italic" style={{ color: T.accent }}>Header</span> — sayt boshi.
        </h2>
        <p className="body fade-up delay-1" style={{ color: T.ink2 }}>
          <span className="mono">{'<header>'}</span> ichida 2 narsa: <b style={{ color: T.ink }}>logo</b> (sizning ismingiz —
          <span className="mono"> {'<h1>'}</span>) va <b style={{ color: T.ink }}>menyu</b> (<span className="mono">{'<nav>'}</span>).
          Sahifa boshida turadi.
        </p>
        <div className="fade-up delay-2" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <TagCard tag="<header>" desc="Sayt yuqori qismi" />
          <TagCard tag="<nav>" desc="Navigatsiya menyusi" />
          <TagCard tag={'<a href>'} desc="Havola" />
        </div>
        {!added ? (
          <div className="fade-up delay-3" style={{ display: 'flex', justifyContent: 'center' }}>
            <button className="build-btn" onClick={add}>✨ Header'ni qo'shing</button>
          </div>
        ) : (
          <GoodNote label="Header qo'shildi · 1/5">
            Sahifaning birinchi qismi paydo bo'ldi. Pastda <b>ismingizni o'zgartirsangiz</b> — kod va preview real vaqtda yangilanadi.
          </GoodNote>
        )}
        {added && (
          <div className="fade-step inline-input">
            <p className="eyebrow" style={{ color: T.accent, margin: '0 0 6px' }}>✏️ Logo ismi (real vaqtda):</p>
            <input className="text-input" value={user.name} onChange={e => updateUser('name', e.target.value)} placeholder="Ismingiz" maxLength={20} />
          </div>
        )}
        <div className="fade-up delay-2">
          <p className="eyebrow" style={{ color: T.ink2, margin: '0 0 6px' }}>HTML kod</p>
          <CodeBox>
            <Tg>{'<body>'}</Tg>{'\n'}
            {added ? (
              <>
                {'  '}<Tg>{'<header>'}</Tg>{'\n'}
                {'    '}<Tg>{'<h1>'}</Tg>{user.name || 'Aziz'}<Tg>{'</h1>'}</Tg>{'\n'}
                {'    '}<Tg>{'<nav>'}</Tg>{'\n'}
                {'      '}<Tg>{'<a '}</Tg><At>href</At><Pn>=</Pn><Sr>"#about"</Sr><Tg>{'>'}</Tg>Asosiy<Tg>{'</a>'}</Tg>{'\n'}
                {'      '}<Tg>{'<a '}</Tg><At>href</At><Pn>=</Pn><Sr>"#projects"</Sr><Tg>{'>'}</Tg>Loyihalar<Tg>{'</a>'}</Tg>{'\n'}
                {'      '}<Tg>{'<a '}</Tg><At>href</At><Pn>=</Pn><Sr>"#contact"</Sr><Tg>{'>'}</Tg>Aloqa<Tg>{'</a>'}</Tg>{'\n'}
                {'    '}<Tg>{'</nav>'}</Tg>{'\n'}
                {'  '}<Tg>{'</header>'}</Tg>{'\n'}
              </>
            ) : (
              <>{'  '}<Cm>{'<!-- 1. Header -->'}</Cm>{'\n'}</>
            )}
            {'  '}<Cm>{'<!-- ...keyingi qismlar -->'}</Cm>{'\n'}
            <Tg>{'</body>'}</Tg>
          </CodeBox>
        </div>
        <div className="fade-up delay-3">
          <p className="eyebrow" style={{ color: T.ink2, margin: '0 0 6px' }}>Brauzerda (bezaksiz)</p>
          <Preview minH={90}>
            {added ? <PHeader user={user} /> : <EmptySlot label="<!-- Header bu yerga keladi -->" />}
          </Preview>
        </div>
        <Fact delay="delay-3">
          <span className="mono">href="#about"</span> — sahifaning <b>ichidagi</b> joyga havola. Boshqa qismda
          <span className="mono"> id="about"</span> bo'lsa, havola shu yerga olib keladi (anchor link).
        </Fact>
      </div>
    </Stage>
  );
};
// ============================================================
// SCREEN 8 — MCQ #2 [SCORED]
// ============================================================
const Screen8 = (props) => (
  <QuestionScreen {...props} idx={8} eyebrow="Mashq · 2-savol"
    question={
      <>
        <p className="eyebrow" style={{ color: T.accent }}>Sayt boshi</p>
        <h2 className="title h-sub" style={{ marginTop: 8 }}>
          Sayt yuqori qismi — logo va menyu uchun qaysi semantik teg ishlatiladi?
        </h2>
      </>
    }
    options={['<top>', '<header>', '<nav>', '<div>']} correctIdx={1}
    explainCorrect="To'g'ri. <header> — sayt yuqori qismi uchun. Uning ichida <nav> menyu turishi mumkin."
    explainWrong={{
      0: '<top> mavjud emas — bunday teg yo\u2019q.',
      2: '<nav> — bu menyu uchun. Lekin u odatda <header> ichida turadi.',
      3: '<div> ishlatish mumkin, lekin u semantik emas. <header> aniqroq va to\u2019g\u2019riroq.',
      default: 'Sayt yuqori qismi — <header>. Uning ichida <nav> bo\u2019lishi mumkin.'
    }} />
);

// ============================================================
// SCREEN 9 — HERO QO'SHAMIZ (talaba bio kiritadi)
// ============================================================
const Screen9 = ({ screen, user, updateUser, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [added, setAdded] = useState(storedAnswer !== undefined);
  const add = () => {
    setAdded(true);
    if (storedAnswer === undefined) onAnswer(9, true, true);
  };
  return (
    <Stage eyebrow="2-qism · Hero" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!added} label={added ? 'Davom etish' : 'Hero qo\u2019shing'} onClick={onNext} /></>}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(16px,3vw,22px)' }}>
        <h2 className="title h-title fade-up">
          2. <span className="italic" style={{ color: T.accent }}>Hero</span> — o'zimni tanishtirish.
        </h2>
        <p className="body fade-up delay-1" style={{ color: T.ink2 }}>
          Hero — sahifaning <b style={{ color: T.ink }}>"qarshi olish"</b> qismi: "Salom, men..." va 1-2 jumla
          o'zingiz haqida. Tashrifchi <b style={{ color: T.ink }}>birinchi navbatda</b> shu yerni o'qiydi.
        </p>
        <div className="fade-up delay-2" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <TagCard tag={'<section id="about">'} desc='Bo\u2019lim, "about" id bilan' />
          <TagCard tag="<h2>" desc="Bo'lim sarlavhasi" />
          <TagCard tag="<p>" desc="Paragraf (matn)" />
        </div>
        {!added ? (
          <div className="fade-up delay-3" style={{ display: 'flex', justifyContent: 'center' }}>
            <button className="build-btn" onClick={add}>✨ Hero'ni qo'shing</button>
          </div>
        ) : (
          <GoodNote label="Hero qo'shildi · 2/5">
            Pastdagi maydonni to'ldirib — o'zingiz haqida 1 jumla yozing. Preview real vaqtda yangilanadi.
          </GoodNote>
        )}
        {added && (
          <div className="fade-step inline-input">
            <p className="eyebrow" style={{ color: T.accent, margin: '0 0 6px' }}>✏️ O'zingiz haqida 1 jumla (real vaqtda):</p>
            <input className="text-input" value={user.bio} onChange={e => updateUser('bio', e.target.value)}
              placeholder="HTML va CSS bilan saytlar yarataman." maxLength={80} />
          </div>
        )}
        <div className="fade-up delay-2">
          <p className="eyebrow" style={{ color: T.ink2, margin: '0 0 6px' }}>HTML kod</p>
          <CodeBox>
            {added ? (
              <>
                <Tg>{'<section '}</Tg><At>id</At><Pn>=</Pn><Sr>"about"</Sr><Tg>{'>'}</Tg>{'\n'}
                {'  '}<Tg>{'<h2>'}</Tg>Salom, men {user.name || 'Aziz'}! 👋<Tg>{'</h2>'}</Tg>{'\n'}
                {'  '}<Tg>{'<p>'}</Tg>{user.age || '15'} yoshli o'quvchi va yosh veb-dasturchi.<Tg>{'</p>'}</Tg>{'\n'}
                {'  '}<Tg>{'<p>'}</Tg>{user.bio || 'HTML va CSS bilan saytlar yarataman.'}<Tg>{'</p>'}</Tg>{'\n'}
                <Tg>{'</section>'}</Tg>
              </>
            ) : (
              <Cm>{'<!-- 2. Hero -->'}</Cm>
            )}
          </CodeBox>
        </div>
        <div className="fade-up delay-3">
          <p className="eyebrow" style={{ color: T.ink2, margin: '0 0 6px' }}>Brauzerda (bezaksiz)</p>
          <Preview minH={100}>
            {added ? <PHero user={user} /> : <EmptySlot label="<!-- Hero bu yerga keladi -->" />}
          </Preview>
        </div>
        <Fact delay="delay-3">
          <span className="mono">id="about"</span> — Header'dagi <span className="mono">href="#about"</span>
          shu yerga olib keladi. Sahifa ichida sayohat qilish shunday ishlaydi (<b>anchor</b>).
        </Fact>
      </div>
    </Stage>
  );
};

// ============================================================
// SCREEN 10 — LOYIHALAR QO'SHAMIZ (talaba 1-loyiha kiritadi)
// ============================================================
const Screen10 = ({ screen, user, updateProject, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [added, setAdded] = useState(storedAnswer !== undefined);
  const add = () => {
    setAdded(true);
    if (storedAnswer === undefined) onAnswer(10, true, true);
  };
  return (
    <Stage eyebrow="3-qism · Loyihalar" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!added} label={added ? 'Davom etish' : 'Loyihalarni qo\u2019shing'} onClick={onNext} /></>}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(16px,3vw,22px)' }}>
        <h2 className="title h-title fade-up">
          3. <span className="italic" style={{ color: T.accent }}>Loyihalar</span> — mening ishlarim.
        </h2>
        <p className="body fade-up delay-1" style={{ color: T.ink2 }}>
          Eng muhim qism — <b style={{ color: T.ink }}>ishingizning isboti</b>. Har loyiha alohida
          <span className="mono"> {'<article>'}</span> ichida. <span className="mono">{'<article>'}</span> "maqola" degani —
          har bir loyiha o'z-o'zicha to'liq ma'noli.
        </p>
        <div className="fade-up delay-2" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <TagCard tag={'<section id="projects">'} desc='Loyihalar bo\u2019limi' />
          <TagCard tag="<article>" desc="Mustaqil bir loyiha" />
          <TagCard tag="<h3>" desc="Loyiha sarlavhasi" />
        </div>
        {!added ? (
          <div className="fade-up delay-3" style={{ display: 'flex', justifyContent: 'center' }}>
            <button className="build-btn" onClick={add}>✨ Loyihalarni qo'shing</button>
          </div>
        ) : (
          <GoodNote label="Loyihalar qo'shildi · 3/5">
            Birinchi loyihangizni o'zingizniki qiling — pastdagi 2 maydonni to'ldiring.
          </GoodNote>
        )}
        {added && (
          <div className="fade-step inline-input" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p className="eyebrow" style={{ color: T.accent, margin: 0 }}>✏️ 1-loyihangiz (real vaqtda):</p>
            <input className="text-input" value={user.projects[0].title}
              onChange={e => updateProject(0, 'title', e.target.value)} placeholder="Birinchi sayt" maxLength={32} />
            <input className="text-input" value={user.projects[0].desc}
              onChange={e => updateProject(0, 'desc', e.target.value)} placeholder="HTML/CSS portfolio." maxLength={60} />
          </div>
        )}
        <div className="fade-up delay-2">
          <p className="eyebrow" style={{ color: T.ink2, margin: '0 0 6px' }}>HTML kod (qisqartirilgan)</p>
          <CodeBox>
            {added ? (
              <>
                <Tg>{'<section '}</Tg><At>id</At><Pn>=</Pn><Sr>"projects"</Sr><Tg>{'>'}</Tg>{'\n'}
                {'  '}<Tg>{'<h2>'}</Tg>Mening loyihalarim<Tg>{'</h2>'}</Tg>{'\n'}
                {'  '}<Tg>{'<article>'}</Tg>{'\n'}
                {'    '}<Tg>{'<h3>'}</Tg>{user.projects[0].title}<Tg>{'</h3>'}</Tg>{'\n'}
                {'    '}<Tg>{'<p>'}</Tg>{user.projects[0].desc}<Tg>{'</p>'}</Tg>{'\n'}
                {'  '}<Tg>{'</article>'}</Tg>{'\n'}
                {'  '}<Cm>{'<!-- ...va boshqa loyihalar -->'}</Cm>{'\n'}
                <Tg>{'</section>'}</Tg>
              </>
            ) : (
              <Cm>{'<!-- 3. Loyihalar -->'}</Cm>
            )}
          </CodeBox>
        </div>
        <div className="fade-up delay-3">
          <p className="eyebrow" style={{ color: T.ink2, margin: '0 0 6px' }}>Brauzerda (bezaksiz)</p>
          <Preview minH={140}>
            {added ? <PProjects user={user} /> : <EmptySlot label="<!-- Loyihalar bu yerga keladi -->" />}
          </Preview>
        </div>
        <Fact delay="delay-3">
          Har loyiha o'zi mustaqil <span className="mono">{'<article>'}</span> — uni boshqa joyga
          ko'chirsangiz ham ma'nosi yo'qolmaydi. Maqolalar, blog postlar, mahsulot kartalari ham
          <span className="mono"> {'<article>'}</span> bo'ladi.
        </Fact>
      </div>
    </Stage>
  );
};

// ============================================================
// SCREEN 11 — MCQ #3 [SCORED]
// ============================================================
const Screen11 = (props) => (
  <QuestionScreen {...props} idx={11} eyebrow="Mashq · 3-savol"
    question={
      <>
        <p className="eyebrow" style={{ color: T.accent }}>Loyihalar</p>
        <h2 className="title h-sub" style={{ marginTop: 8 }}>
          Har bir alohida loyihani qaysi semantik teg ichiga yozish kerak?
        </h2>
      </>
    }
    options={['<div>', '<section>', '<article>', '<project>']} correctIdx={2}
    explainCorrect="To'g'ri. <article> — mustaqil mazmunli element uchun: maqola, post, va aynan loyiha kartasi uchun ham."
    explainWrong={{
      0: '<div> ham mumkin, lekin u semantik emas. <article> ma\u2019noliroq.',
      1: '<section> kattaroq bo\u2019lim uchun (masalan, "Loyihalar" bo\u2019limi). Lekin har loyiha o\u2019zi — <article>.',
      3: '<project> mavjud emas — bunday teg yo\u2019q.',
      default: 'Mustaqil mazmunli element uchun <article> ishlatiladi.'
    }} />
);

// ============================================================
// SCREEN 12 — ALOQA QO'SHAMIZ (talaba email/telegram nik kiritadi)
// ============================================================
const Screen12 = ({ screen, user, updateUser, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [added, setAdded] = useState(storedAnswer !== undefined);
  const slug = safeSlug(user.name);
  const add = () => {
    setAdded(true);
    if (storedAnswer === undefined) onAnswer(12, true, true);
  };
  return (
    <Stage eyebrow="4-qism · Aloqa" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!added} label={added ? 'Davom etish' : 'Aloqani qo\u2019shing'} onClick={onNext} /></>}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(16px,3vw,22px)' }}>
        <h2 className="title h-title fade-up">
          4. <span className="italic" style={{ color: T.accent }}>Aloqa</span> — meni topish.
        </h2>
        <p className="body fade-up delay-1" style={{ color: T.ink2 }}>
          Email uchun <span className="mono">mailto:</span> ishlatamiz — havola bosilsa email ilovasi avtomatik ochiladi.
          Telegram uchun esa oddiy <span className="mono">https://</span> havolasi.
        </p>
        <div className="fade-up delay-2" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <TagCard tag={'<section id="contact">'} desc='Aloqa bo\u2019limi' />
          <TagCard tag={'mailto:'} desc="Email ilovasini ochuvchi havola" />
        </div>
        {!added ? (
          <div className="fade-up delay-3" style={{ display: 'flex', justifyContent: 'center' }}>
            <button className="build-btn" onClick={add}>✨ Aloqani qo'shing</button>
          </div>
        ) : (
          <GoodNote label="Aloqa qo'shildi · 4/5">
            Havolalar avtomatik <b>"{slug}"</b> niki bilan keladi. Lekin pastdan ham aniqroq qila olasiz.
          </GoodNote>
        )}
        <div className="fade-up delay-2">
          <p className="eyebrow" style={{ color: T.ink2, margin: '0 0 6px' }}>HTML kod</p>
          <CodeBox>
            {added ? (
              <>
                <Tg>{'<section '}</Tg><At>id</At><Pn>=</Pn><Sr>"contact"</Sr><Tg>{'>'}</Tg>{'\n'}
                {'  '}<Tg>{'<h2>'}</Tg>Meni topish<Tg>{'</h2>'}</Tg>{'\n'}
                {'  '}<Tg>{'<p>'}</Tg>Email:{'\n'}
                {'    '}<Tg>{'<a '}</Tg><At>href</At><Pn>=</Pn><Sr>"mailto:{slug}@mail.com"</Sr><Tg>{'>'}</Tg>{slug}@mail.com<Tg>{'</a>'}</Tg>{'\n'}
                {'  '}<Tg>{'</p>'}</Tg>{'\n'}
                {'  '}<Tg>{'<p>'}</Tg>Telegram:{'\n'}
                {'    '}<Tg>{'<a '}</Tg><At>href</At><Pn>=</Pn><Sr>"https://t.me/{slug}"</Sr><Tg>{'>'}</Tg>@{slug}_codes<Tg>{'</a>'}</Tg>{'\n'}
                {'  '}<Tg>{'</p>'}</Tg>{'\n'}
                <Tg>{'</section>'}</Tg>
              </>
            ) : (
              <Cm>{'<!-- 4. Aloqa -->'}</Cm>
            )}
          </CodeBox>
        </div>
        <div className="fade-up delay-3">
          <p className="eyebrow" style={{ color: T.ink2, margin: '0 0 6px' }}>Brauzerda (bezaksiz)</p>
          <Preview minH={110}>
            {added ? <PContact user={user} /> : <EmptySlot label="<!-- Aloqa bu yerga keladi -->" />}
          </Preview>
        </div>
        <Fact delay="delay-3">
          Slug — bu havola uchun toza variant. Ismingizdagi probel va maxsus belgilar olib tashlanadi.
          Sizniki — <b>"{slug}"</b>.
        </Fact>
      </div>
    </Stage>
  );
};

// ============================================================
// SCREEN 13 — FOOTER QO'SHAMIZ
// ============================================================
const Screen13 = ({ screen, user, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [added, setAdded] = useState(storedAnswer !== undefined);
  const add = () => {
    setAdded(true);
    if (storedAnswer === undefined) onAnswer(13, true, true);
  };
  return (
    <Stage eyebrow="5-qism · Footer" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!added} label={added ? '🎉 Tayyor sayt →' : 'Footer qo\u2019shing'} onClick={onNext} /></>}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(16px,3vw,22px)' }}>
        <h2 className="title h-title fade-up">
          5. <span className="italic" style={{ color: T.accent }}>Footer</span> — sayt yopilishi.
        </h2>
        <p className="body fade-up delay-1" style={{ color: T.ink2 }}>
          Sayt oxirgi qismi — <b style={{ color: T.ink }}>mualliflik huquqi</b>. Maxsus belgi uchun
          <span className="mono"> &amp;copy;</span> deb yozamiz — brauzer uni <b>©</b> sifatida ko'rsatadi.
        </p>
        <div className="fade-up delay-2" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <TagCard tag="<footer>" desc="Sayt pastki qismi" />
          <TagCard tag="&copy;" desc="© belgi" />
        </div>
        {!added ? (
          <div className="fade-up delay-3" style={{ display: 'flex', justifyContent: 'center' }}>
            <button className="build-btn" onClick={add}>✨ Footer qo'shing · 5/5</button>
          </div>
        ) : (
          <GoodNote label="🎉 5/5 — TUGADI!">
            Portfolio HTML strukturangiz to'liq tayyor. Keyingi ekranda — natijani to'liq ko'ring!
          </GoodNote>
        )}
        <div className="fade-up delay-2">
          <p className="eyebrow" style={{ color: T.ink2, margin: '0 0 6px' }}>HTML kod</p>
          <CodeBox>
            {added ? (
              <>
                <Tg>{'<footer>'}</Tg>{'\n'}
                {'  '}<Tg>{'<p>'}</Tg>&amp;copy; 2025 {user.name || 'Aziz'}. Barcha huquqlar himoyalangan.<Tg>{'</p>'}</Tg>{'\n'}
                <Tg>{'</footer>'}</Tg>
              </>
            ) : (
              <Cm>{'<!-- 5. Footer -->'}</Cm>
            )}
          </CodeBox>
        </div>
        <div className="fade-up delay-3">
          <p className="eyebrow" style={{ color: T.ink2, margin: '0 0 6px' }}>Brauzerda (bezaksiz)</p>
          <Preview minH={60}>
            {added ? <PFooter user={user} /> : <EmptySlot label="<!-- Footer bu yerga keladi -->" />}
          </Preview>
        </div>
        <Fact delay="delay-3">
          HTML'da maxsus belgilar (<b>&amp;copy;</b>, <b>&amp;amp;</b>, <b>&amp;lt;</b>) <b>entity</b> deyiladi.
          Brauzer ularni o'qib mos belgiga aylantiradi.
        </Fact>
      </div>
    </Stage>
  );
};

// ============================================================
// SCREEN 14 — YAKUNIY PREVIEW + 👁 INSPECTOR + personal edit
// ============================================================
const Screen14 = ({ screen, user, updateUser, onNext, onPrev }) => {
  const [inspector, setInspector] = useState(false);
  return (
    <Stage eyebrow="🎉 Tayyor" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext label="Yakuniy tekshiruv →" onClick={onNext} /></>}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(16px,3vw,22px)' }}>
        <h2 className="title h-title fade-up">
          <b style={{ fontStyle: 'italic', color: T.accent, fontWeight: 400 }}>{user.name || 'Aziz'}</b>'ning portfolio HTML
          strukturasi tayyor!
        </h2>
        <p className="body fade-up delay-1" style={{ color: T.ink2 }}>
          5 ta qism — Header, Hero, Loyihalar, Aloqa, Footer — barchasi joyida. Hozir <b style={{ color: T.ink }}>bezaksiz</b>,
          lekin keyingi darsda CSS bilan chiroyli qilamiz. 🎨
        </p>
        <div className="fade-up delay-2 frame" style={{ background: T.accentSoft, borderColor: T.accent }}>
          <p className="eyebrow" style={{ color: T.accent, margin: '0 0 10px' }}>✏️ Hali ham o'zgartirish mumkin</p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <div style={{ flex: 2, minWidth: 140 }}>
              <p className="small" style={{ color: T.ink2, margin: '0 0 4px' }}>Ism</p>
              <input className="text-input" value={user.name} onChange={e => updateUser('name', e.target.value)} placeholder="Aziz" maxLength={20} />
            </div>
            <div style={{ flex: 1, minWidth: 80 }}>
              <p className="small" style={{ color: T.ink2, margin: '0 0 4px' }}>Yosh</p>
              <input className="text-input" value={user.age} onChange={e => updateUser('age', e.target.value)} placeholder="15" maxLength={3} />
            </div>
          </div>
        </div>
        <div className="fade-up delay-2" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
          <p className="eyebrow" style={{ color: T.ink2, margin: 0 }}>To'liq portfolio</p>
          <button className={`insp-toggle ${inspector ? 'on' : ''}`} onClick={() => setInspector(!inspector)}>
            👁 {inspector ? 'Teglarni yashirish' : 'Teglarni korsatish'}
          </button>
        </div>
        <div className="fade-up delay-3">
          <Preview title={`${safeSlug(user.name)}-portfolio.html`} minH={420}>
            <div className={inspector ? 'insp-mode' : ''}>
              <PHeader user={user} inspector={inspector} />
              <PHero user={user} inspector={inspector} />
              <PProjects user={user} inspector={inspector} />
              <PContact user={user} inspector={inspector} />
              <PFooter user={user} inspector={inspector} />
            </div>
          </Preview>
        </div>
        <Fact delay="delay-4">
          {inspector
            ? <><b>👁 Inspector rejimi:</b> coral chiziqlar — har qism chegarasi. Tepasidagi badge — qaysi HTML tegi. Real DevTools shu tarzda ishlaydi.</>
            : <><b>"Teglarni ko\u2019rsatish"</b> tugmasini bosing — preview ustida HTML teg nomlari va chegaralar paydo bo'ladi. Bu DevTools tajribasiga juda yaqin.</>
          }
        </Fact>
      </div>
    </Stage>
  );
};

// ============================================================
// SCREEN 15 — MCQ FINAL [SCORED]
// ============================================================
const Screen15 = (props) => (
  <QuestionScreen {...props} idx={15} eyebrow="Yakuniy tekshiruv"
    question={
      <>
        <p className="eyebrow" style={{ color: T.accent }}>So'nggi savol</p>
        <h2 className="title h-sub" style={{ marginTop: 8 }}>
          Bizning portfolio sahifa nechta asosiy qismdan iborat va to'g'ri tartibi qaysi?
        </h2>
      </>
    }
    options={[
      'Header → Footer → Hero → Loyihalar → Aloqa',
      'Header → Hero → Loyihalar → Aloqa → Footer',
      'Hero → Header → Loyihalar → Footer → Aloqa',
      'Faqat Header va Footer kerak'
    ]} correctIdx={1}
    explainCorrect="To'g'ri! 5 qism, shu tartibda: Header (sayt boshi) → Hero (tanishtirish) → Loyihalar → Aloqa → Footer (oxiri)."
    explainWrong={{
      0: 'Footer eng oxirida bo\u2019lishi kerak — sayt yopilishi sifatida. Header — boshida.',
      2: 'Header har doim eng boshda — sayt yuqori qismi. Hero — uning ostida.',
      3: 'Bu kichik. Portfolio uchun 5 ta qism kerak: Header, Hero, Loyihalar, Aloqa, Footer.',
      default: 'To\u2019g\u2019ri tartib: Header → Hero → Loyihalar → Aloqa → Footer.'
    }} />
);

// ============================================================
// SCREEN 16 — YAKUN
// ============================================================
const IconCoin = ({ s = 24, c = T.accent }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v10M9.5 9.2c0-1 1.1-1.6 2.5-1.6s2.5.6 2.5 1.7c0 2.4-5 1.3-5 3.7 0 1.1 1.1 1.7 2.5 1.7s2.5-.6 2.5-1.6" strokeLinecap="round" />
  </svg>
);
const Screen16 = ({ screen, user, answers, onReset, onPrev }) => {
  const correct = SCORED.filter(i => answers[i]?.correct).length;
  const total = SCORED.length;
  const coins = correct * COIN_PER;
  return (
    <Stage eyebrow="Tayyor" screen={screen} navContent={
      <>
        <NavBack onPrev={onPrev} />
        <button className="btn btn-ghost" onClick={onReset}
          style={{ padding: 'clamp(12px,2vw,14px) clamp(18px,2.5vw,24px)', fontSize: 'clamp(14px,1.8vw,16px)' }}>
          Qaytadan
        </button>
        <button className="btn" disabled
          style={{ padding: 'clamp(12px,2vw,14px) clamp(24px,3vw,32px)', fontSize: 'clamp(14px,1.8vw,16px)', marginLeft: 'auto' }}>
          CSS dars →
        </button>
      </>
    }>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(16px,3vw,22px)' }}>
        <div className="fade-up">
          <p className="eyebrow" style={{ color: T.accent }}>1-loyiha tugadi</p>
          <h2 className="title h-title" style={{ marginTop: 10 }}>
            <b style={{ fontStyle: 'italic', color: T.accent, fontWeight: 400 }}>{user.name || 'Aziz'}</b> uchun
            portfolio skeleti tayyor.
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
            {correct >= total * 0.85 && 'Ajoyib! Birinchi loyihangiz puxta o\u2019rganildi.'}
            {correct >= total * 0.6 && correct < total * 0.85 && 'Yaxshi! Bir-ikki joyni takrorlasangiz bo\u2019ldi.'}
            {correct < total * 0.6 && 'Darsni yana bir bor ko\u2019rib chiqsangiz foydali bo\u2019ladi.'}
          </p>
        </div>
        <div className="frame-soft fade-up delay-2">
          <p className="eyebrow" style={{ color: T.accent, margin: 0 }}>📝 Uyga vazifa</p>
          <p className="body" style={{ margin: '8px 0 12px', color: T.ink }}>O'zingizning portfolio HTML sahifangizni qo'lda yozing:</p>
          <ul style={{ ...UL_STYLE, color: T.ink2, fontSize: 'clamp(14px,1.9vw,16px)' }}>
            <li>✓ <b style={{ color: T.ink }}>Header</b> — sizning ismingiz + nav menyu</li>
            <li>✓ <b style={{ color: T.ink }}>Hero</b> — "Salom, men [ism]!" + 2 paragraf</li>
            <li>✓ <b style={{ color: T.ink }}>Loyihalar</b> — 2-3 ta loyiha (yoki o'rgangan narsa)</li>
            <li>✓ <b style={{ color: T.ink }}>Aloqa</b> — email va Telegram (yoki o'ylab toping)</li>
            <li>✓ <b style={{ color: T.ink }}>Footer</b> — copyright</li>
          </ul>
          <p className="small" style={{ margin: '12px 0 0', color: T.accent, fontWeight: 700 }}>
            ⚠ Hozircha faqat HTML — CSS keyingi darsda! Qo'lda yozing, AI'siz.
          </p>
        </div>
        <div className="fade-up delay-3 frame" style={{ background: T.bg }}>
          <p className="eyebrow" style={{ color: T.accent, margin: 0 }}>Kalit so'zlar</p>
          <ul style={{ ...UL_STYLE, marginTop: 12, color: T.ink2 }}>
            <li><b style={{ color: T.ink }}>portfolio</b> — o'zini ko'rsatish sayti</li>
            <li><b style={{ color: T.ink }}>dekompozitsiya</b> — qismlarga bo'lish</li>
            <li><b style={{ color: T.ink }}>HTML skelet</b> — DOCTYPE, html, head, body</li>
            <li><b style={{ color: T.ink }}>{'<header>'} + {'<nav>'}</b> — sayt yuqori va menyu</li>
            <li><b style={{ color: T.ink }}>{'<section id="about">'}</b> — Hero bo'lim</li>
            <li><b style={{ color: T.ink }}>{'<section id="projects">'} + {'<article>'}</b></li>
            <li><b style={{ color: T.ink }}>{'<section id="contact">'} + {'<a href>'}</b></li>
            <li><b style={{ color: T.ink }}>{'<footer>'}</b></li>
            <li><b style={{ color: T.ink }}>id</b> + <span className="mono">href="#about"</span> (anchor)</li>
            <li><b style={{ color: T.ink }}>mailto:</b> va <b style={{ color: T.ink }}>https://</b></li>
            <li><b style={{ color: T.ink }}>&amp;copy;</b> — © belgisi (HTML entity)</li>
          </ul>
        </div>
      </div>
    </Stage>
  );
};

// ============================================================
// MAIN
// ============================================================
export default function PortfolioStruktura() {
  const [screen, setScreen] = useState(0);
  const [answers, setAnswers] = useState({});
  const [user, setUser] = useState({
    name: 'Aziz',
    age: '15',
    bio: 'HTML va CSS bilan saytlar yarataman.',
    projects: [
      { title: 'Birinchi sayt', desc: 'HTML/CSS portfolio.' },
      { title: 'To-do dastur', desc: 'Vazifa eslatuvchi.' },
      { title: 'Ob-havo widget', desc: 'Bugungi havo.' }
    ]
  });

  const next = () => setScreen(s => Math.min(s + 1, TOTAL_SCREENS - 1));
  const prev = () => setScreen(s => Math.max(s - 1, 0));
  const recordAnswer = (idx, correct, picked) => setAnswers(a => ({ ...a, [idx]: { correct, picked } }));
  const updateUser = (field, value) => setUser(u => ({ ...u, [field]: value }));
  const updateProject = (idx, field, value) => setUser(u => ({
    ...u,
    projects: u.projects.map((p, i) => i === idx ? { ...p, [field]: value } : p)
  }));
  const reset = () => {
    setAnswers({});
    setScreen(0);
    setUser({
      name: 'Aziz', age: '15', bio: 'HTML va CSS bilan saytlar yarataman.',
      projects: [
        { title: 'Birinchi sayt', desc: 'HTML/CSS portfolio.' },
        { title: 'To-do dastur', desc: 'Vazifa eslatuvchi.' },
        { title: 'Ob-havo widget', desc: 'Bugungi havo.' }
      ]
    });
  };

  const screens = [Screen0, Screen1, Screen2, Screen3, Screen4, Screen5, Screen6, Screen7, Screen8, Screen9, Screen10, Screen11, Screen12, Screen13, Screen14, Screen15, Screen16];
  const Current = screens[screen];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@300;400;500;600;700;800&family=Fraunces:opsz,wght@9..144,300;9..144,400;9..144,500&family=JetBrains+Mono:wght@400;500;700&display=swap');
        html, body { margin: 0; padding: 0; }
        .lesson-root, .lesson-root * { box-sizing: border-box; }
        .lesson-root { font-family: 'Manrope', system-ui, sans-serif; color: ${T.ink}; background: ${T.bg}; height: 100dvh; overflow: hidden; -webkit-font-smoothing: antialiased; }

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

        @keyframes pulse-shadow { 0%,100% { box-shadow: 0 4px 16px rgba(255,79,40,0.3); } 50% { box-shadow: 0 6px 22px rgba(255,79,40,0.5); } }
        .build-btn { font-family: 'Manrope', sans-serif; font-weight: 700; font-size: clamp(16px,2.2vw,18px); padding: clamp(14px,2.5vw,18px) clamp(28px,4vw,40px); border-radius: 14px; border: 2px solid ${T.accent}; background: ${T.accent}; color: #fff; cursor: pointer; transition: all 0.2s; animation: pulse-shadow 2s infinite; }
        .build-btn:hover { transform: translateY(-2px); animation: none; box-shadow: 0 8px 24px rgba(255,79,40,0.5); }

        .text-input { width: 100%; font-family: 'Manrope', sans-serif; font-size: clamp(15px,2vw,17px); font-weight: 500; padding: 10px 14px; border: 1.5px solid ${T.ink}; border-radius: 10px; background: ${T.paper}; color: ${T.ink}; outline: none; transition: border-color 0.2s; }
        .text-input:focus { border-color: ${T.accent}; }

        .inline-input { background: ${T.bg}; padding: clamp(12px,2.5vw,16px); border-radius: 12px; border: 1px dashed ${T.accent}50; }

        .code-box { background: ${CODE.bg}; color: ${CODE.text}; font-family: 'JetBrains Mono', monospace; font-size: clamp(13px,1.85vw,15px); line-height: 1.6; padding: clamp(14px,3vw,20px); border-radius: 12px; overflow-x: auto; white-space: pre-wrap; word-break: break-word; margin: 0; }
        .bp-window { border: 1.5px solid ${T.ink}; border-radius: 12px; overflow: hidden; background: #fff; }
        .bp-bar { background: #f0eee8; padding: 8px 12px; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid ${T.ink}30; }
        .bp-title { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink3}; }
        .bp-body { padding: clamp(14px,3vw,20px); }

        .topics { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
        .topic-item { display: flex; align-items: center; gap: 14px; padding: 12px 16px; background: ${T.paper}; border-radius: 10px; border: 1px solid ${T.ink3}40; }
        .topic-num { font-family: 'JetBrains Mono'; font-weight: 700; font-size: clamp(13px,1.8vw,15px); color: ${T.accent}; min-width: 26px; }
        .topic-text { font-family: 'Manrope'; font-weight: 500; color: ${T.ink}; font-size: clamp(14px,1.9vw,16px); }

        /* Reasons grid */
        .reason-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 10px; }
        .reason-card { background: ${T.paper}; border: 1.5px solid ${T.ink}; border-radius: 14px; padding: 18px 14px; display: flex; flex-direction: column; align-items: center; gap: 8px; cursor: pointer; transition: all 0.2s; font-family: 'Manrope'; }
        .reason-card:hover { transform: translateY(-2px); border-color: ${T.accent}; }
        .reason-card.seen { border-color: ${T.accent}80; }
        .reason-card.active { background: ${T.accent}; border-color: ${T.accent}; color: #fff; }
        .reason-icon { font-size: clamp(28px,5vw,38px); line-height: 1; }
        .reason-title { font-weight: 700; font-size: clamp(13px,1.7vw,15px); color: inherit; }

        /* Reorder list (Screen 5) */
        .reorder-list { display: flex; flex-direction: column; gap: 8px; }
        .reorder-item { display: flex; align-items: center; gap: 10px; padding: 10px 12px; background: ${T.paper}; border: 1.5px solid ${T.ink3}60; border-radius: 12px; transition: all 0.25s; }
        .reorder-item.in-place { border-color: ${T.success}; background: ${T.successSoft}; }
        .reorder-item.all-correct { border-color: ${T.success}; background: ${T.successSoft}; }
        .reorder-num { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 14px; color: ${T.accent}; min-width: 20px; }
        .reorder-emoji { font-size: 22px; line-height: 1; min-width: 24px; text-align: center; }
        .reorder-content { flex: 1; min-width: 0; }
        .reorder-label { font-family: 'Manrope'; font-weight: 700; font-size: clamp(14px,1.9vw,16px); color: ${T.ink}; margin: 0; }
        .reorder-desc { font-family: 'Manrope'; font-size: clamp(11px,1.4vw,13px); color: ${T.ink2}; margin: 2px 0 0; }
        .reorder-actions { display: flex; flex-direction: column; gap: 2px; }
        .reorder-btn { width: 32px; height: 24px; border: 1.5px solid ${T.ink}; background: ${T.paper}; color: ${T.ink}; border-radius: 6px; cursor: pointer; font-size: 10px; transition: all 0.15s; display: flex; align-items: center; justify-content: center; padding: 0; }
        .reorder-btn:hover:not(:disabled) { background: ${T.accent}; border-color: ${T.accent}; color: #fff; }
        .reorder-btn:disabled { opacity: 0.25; cursor: not-allowed; }

        /* Tag cards */
        .tag-card { display: inline-flex; align-items: center; gap: 8px; background: ${T.paper}; border: 1px solid ${T.ink3}50; border-radius: 8px; padding: 6px 10px; }
        .tag-card-tag { font-family: 'JetBrains Mono'; font-size: clamp(11px,1.5vw,13px); color: ${T.accent}; font-weight: 600; }
        .tag-card-desc { font-family: 'Manrope'; font-size: clamp(11px,1.4vw,13px); color: ${T.ink2}; }

        /* Inspector mode (Screen 14) */
        .insp-toggle { font-family: 'Manrope', sans-serif; font-weight: 600; font-size: clamp(12px,1.6vw,14px); padding: 6px 12px; border-radius: 99px; border: 1.5px solid ${T.ink}; background: ${T.paper}; color: ${T.ink}; cursor: pointer; transition: all 0.18s; }
        .insp-toggle:hover { border-color: ${T.accent}; color: ${T.accent}; }
        .insp-toggle.on { background: ${T.accent}; border-color: ${T.accent}; color: #fff; }
        .insp-mode { position: relative; }
        .insp { position: relative !important; outline: 1.5px dashed ${T.accent} !important; outline-offset: -1px !important; margin: 8px !important; }
        .insp::before { content: attr(data-tag); position: absolute; top: 0; left: 0; transform: translateY(-100%); background: ${T.accent}; color: #fff; font-size: 9px; padding: 1px 5px; border-radius: 3px 3px 0 0; font-family: 'JetBrains Mono'; font-weight: 600; white-space: nowrap; z-index: 2; }
        nav.insp::before, article.insp::before { background: ${T.ink}; }

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
        <Current
          screen={screen}
          user={user}
          updateUser={updateUser}
          updateProject={updateProject}
          storedAnswer={answers[screen]}
          answers={answers}
          onAnswer={recordAnswer}
          onNext={next}
          onPrev={prev}
          onReset={reset}
        />
      </div>
    </>
  );
}