import React, { useState, useEffect, useRef } from 'react';

// PRAKTIKA 2-DARS · PORTFOLIO STILIZATSIYASI (CSS) · 17 ekran · 12–17 yosh · siz murojaati
// Sky Blue palitra (oq fon, ko'k accent, navy footer). Eng zo'r: hover sehri (s12) + palitra (s14).
// Собрано через pipeline (skeleton → content → jsx-builder). UZ-only, аудио нет.
// Платформенный контракт: onFinished(payload) + coins. Принимает initialPortfolio (от 1-урока практики),
// чтобы стилизовать ИМЕННО портфолио ученика (имя/проекты), а не дефолтного "Aziz".

const T = {
  bg: '#F6F4EF', ink: '#16243B', ink2: '#5A5A60', ink3: '#A7A6A2',
  paper: '#FFFFFF', accent: '#FF4F28', accentSoft: '#FFE8E1',
  success: '#1F7A4D', successSoft: '#E3F0E8'
};
const CODE = {
  bg: '#1A2436', text: '#E8E5DD', tag: '#FF7755',
  attr: '#FFD380', str: '#7DD181', comment: '#6B7585', punct: '#9FB4D8'
};
// PORTFOLIO uchun yangi rang sxemasi — Sky Blue (default)
const PORTFOLIO_DEFAULT_ACCENT = '#3B82F6';

const TOTAL_SCREENS = 17;
const COIN_PER = 10;

// --- Платформенный контракт (для LMS payload) ---
const LESSON_META = {
  lessonId: 'practice-02-v1',
  lessonTitle: 'Portfolio loyihasi — CSS stilizatsiya'
};
const SCREEN_META = [
  { id: 's0',  type: 'hook',           template: 'choice',  scored: false, scope: 'hook' },
  { id: 's1',  type: 'plan',           template: 'custom',  scored: false, scope: null },
  { id: 's2',  type: 'toggle-explore', template: 'custom',  scored: false, scope: null },
  { id: 's3',  type: 'builder',        template: 'custom',  scored: false, scope: null },
  { id: 's4',  type: 'test',           template: 'choice',  scored: true,  scope: 'practice' },
  { id: 's5',  type: 'builder',        template: 'custom',  scored: false, scope: null },
  { id: 's6',  type: 'builder',        template: 'custom',  scored: false, scope: null },
  { id: 's7',  type: 'test',           template: 'choice',  scored: true,  scope: 'practice' },
  { id: 's8',  type: 'builder',        template: 'custom',  scored: false, scope: null },
  { id: 's9',  type: 'builder',        template: 'custom',  scored: false, scope: null },
  { id: 's10', type: 'test',           template: 'choice',  scored: true,  scope: 'practice' },
  { id: 's11', type: 'builder',        template: 'custom',  scored: false, scope: null },
  { id: 's12', type: 'hover-explore',  template: 'custom',  scored: false, scope: null },
  { id: 's13', type: 'preview',        template: 'custom',  scored: false, scope: null },
  { id: 's14', type: 'theme-picker',   template: 'custom',  scored: false, scope: null },
  { id: 's15', type: 'test',           template: 'choice',  scored: true,  scope: 'final' },
  { id: 's16', type: 'summary',        template: 'summary', scored: false, scope: null }
];
const SCORED_IDX = SCREEN_META.map((m, i) => (m.scored ? i : null)).filter(i => i !== null);

const TOPICS = [
  'CSS faylini sahifaga ulash',
  'Body — global shrift va ranglar',
  'Header — flexbox bilan menyu',
  'Hero, Loyihalar, Kartalar',
  'Aloqa va Footer — navy uslub',
  '🪄 Hover effekti — sehrli daqiqa',
  '🎨 Rang sxemasini tanlash'
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

// Tag karta
const TagCard = ({ tag, desc }) => (
  <div className="tag-card">
    <code className="tag-card-tag">{tag}</code>
    <span className="tag-card-desc">{desc}</span>
  </div>
);

// ============================================================
// PORTFOLIO QISMLARI — RAW va STYLED (talaba ma'lumotiga moslangan)
// ============================================================
const TNR = "Times New Roman, serif";
const DEFAULT_PROJECTS = [
  { title: 'Birinchi sayt', desc: 'HTML/CSS portfolio.' },
  { title: 'To-do dastur', desc: 'Vazifa eslatuvchi.' },
  { title: 'Ob-havo widget', desc: 'Bugungi havo.' }
];
const safeSlug = (s) => (s || 'aziz').toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 18) || 'aziz';
const projOf = (user) => (user && user.projects && user.projects.length ? user.projects : DEFAULT_PROJECTS);

// RAW (bezaksiz — Times New Roman, default brauzer styles)
const RawHeader = ({ user = {} }) => (
  <header style={{ marginBottom: 12, padding: '10px 14px' }}>
    <h1 style={{ fontFamily: TNR, margin: '0 0 6px', fontSize: 22, color: '#000' }}>{user.name || 'Aziz'}</h1>
    <nav style={{ display: 'flex', gap: 12, fontFamily: TNR }}>
      <a style={{ color: '#0000EE', textDecoration: 'underline', fontSize: 13 }}>Asosiy</a>
      <a style={{ color: '#0000EE', textDecoration: 'underline', fontSize: 13 }}>Loyihalar</a>
      <a style={{ color: '#0000EE', textDecoration: 'underline', fontSize: 13 }}>Aloqa</a>
    </nav>
  </header>
);
const RawHero = ({ user = {} }) => (
  <section style={{ marginBottom: 12, padding: '0 14px' }}>
    <h2 style={{ fontFamily: TNR, margin: '0 0 6px', fontSize: 18, color: '#000' }}>Salom, men {user.name || 'Aziz'}! 👋</h2>
    <p style={{ fontFamily: TNR, margin: '0 0 4px', fontSize: 13, color: '#000' }}>{user.age || '15'} yoshli o'quvchi va yosh veb-dasturchi.</p>
    <p style={{ fontFamily: TNR, margin: 0, fontSize: 13, color: '#000' }}>{user.bio || 'HTML va CSS bilan saytlar yarataman.'}</p>
  </section>
);
const RawProjects = ({ user = {} }) => (
  <section style={{ marginBottom: 12, padding: '0 14px' }}>
    <h2 style={{ fontFamily: TNR, margin: '0 0 8px', fontSize: 18, color: '#000' }}>Mening loyihalarim</h2>
    {projOf(user).map((p, i) => (
      <article key={i} style={{ marginBottom: 8 }}>
        <h3 style={{ fontFamily: TNR, margin: '0 0 2px', fontSize: 15, color: '#000' }}>{p.title}</h3>
        <p style={{ fontFamily: TNR, margin: 0, fontSize: 12, color: '#000' }}>{p.desc}</p>
      </article>
    ))}
  </section>
);
const RawContact = ({ user = {} }) => {
  const slug = safeSlug(user.name);
  return (
    <section style={{ marginBottom: 12, padding: '0 14px' }}>
      <h2 style={{ fontFamily: TNR, margin: '0 0 6px', fontSize: 18, color: '#000' }}>Meni topish</h2>
      <p style={{ fontFamily: TNR, margin: '0 0 4px', fontSize: 13, color: '#000' }}>
        Email: <a style={{ color: '#0000EE', textDecoration: 'underline' }}>{slug}@mail.com</a>
      </p>
      <p style={{ fontFamily: TNR, margin: 0, fontSize: 13, color: '#000' }}>
        Telegram: <a style={{ color: '#0000EE', textDecoration: 'underline' }}>@{slug}_codes</a>
      </p>
    </section>
  );
};
const RawFooter = ({ user = {} }) => (
  <footer style={{ padding: '10px 14px' }}>
    <p style={{ fontFamily: TNR, margin: 0, fontSize: 11, color: '#000' }}>© 2025 {user.name || 'Aziz'}. Barcha huquqlar himoyalangan.</p>
  </footer>
);

// STYLED — Sky Blue palette (accent prop bilan o'zgartiriladi)
const PoppinsFont = "'Manrope', 'Poppins', system-ui, sans-serif";
const SerifAccent = "'Fraunces', Georgia, serif";

const StyledHeader = ({ accent = PORTFOLIO_DEFAULT_ACCENT, user = {} }) => (
  <header style={{
    background: accent, color: '#fff', padding: '14px 18px',
    display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8
  }}>
    <h1 style={{ fontFamily: PoppinsFont, margin: 0, fontSize: 20, fontWeight: 800, color: '#fff', letterSpacing: '-0.01em' }}>{user.name || 'Aziz'}</h1>
    <nav style={{ display: 'flex', gap: 16 }}>
      {['Asosiy', 'Loyihalar', 'Aloqa'].map(l => (
        <a key={l} style={{ color: '#fff', textDecoration: 'none', fontFamily: PoppinsFont, fontSize: 13, fontWeight: 500, opacity: 0.95 }}>{l}</a>
      ))}
    </nav>
  </header>
);
const StyledHero = ({ accent = PORTFOLIO_DEFAULT_ACCENT, user = {} }) => (
  <section style={{ background: `${accent}11`, padding: '36px 18px', textAlign: 'center' }}>
    <h2 style={{ fontFamily: SerifAccent, margin: '0 0 14px', fontSize: 30, color: '#0F172A', fontWeight: 500, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
      Salom, men <span style={{ color: accent, fontStyle: 'italic' }}>{user.name || 'Aziz'}</span>! 👋
    </h2>
    <p style={{ fontFamily: PoppinsFont, margin: '0 auto 6px', fontSize: 14, color: '#475569', maxWidth: 340, lineHeight: 1.55 }}>{user.age || '15'} yoshli o'quvchi va yosh veb-dasturchi.</p>
    <p style={{ fontFamily: PoppinsFont, margin: '0 auto', fontSize: 14, color: '#475569', maxWidth: 340, lineHeight: 1.55 }}>{user.bio || 'HTML va CSS bilan saytlar yarataman.'}</p>
  </section>
);
const StyledProjects = ({ accent = PORTFOLIO_DEFAULT_ACCENT, withHover = true, user = {} }) => (
  <section style={{ padding: '28px 18px', background: '#F8FAFC' }}>
    <h2 style={{ fontFamily: SerifAccent, margin: '0 0 18px', fontSize: 22, color: '#0F172A', fontWeight: 500, textAlign: 'center' }}>Mening loyihalarim</h2>
    <div className="cards-row">
      {projOf(user).map((p, i) => (
        <article key={i} className={withHover ? 'styled-card hoverable' : 'styled-card'} style={{ borderColor: accent }}>
          <h3 style={{ fontFamily: PoppinsFont, margin: '0 0 6px', fontSize: 15, color: '#0F172A', fontWeight: 700 }}>{p.title}</h3>
          <p style={{ fontFamily: PoppinsFont, margin: 0, fontSize: 12, color: '#475569', lineHeight: 1.45 }}>{p.desc}</p>
        </article>
      ))}
    </div>
  </section>
);
const StyledContact = ({ accent = PORTFOLIO_DEFAULT_ACCENT, user = {} }) => {
  const slug = safeSlug(user.name);
  return (
    <section style={{ padding: '28px 18px', background: `${accent}08`, textAlign: 'center' }}>
      <h2 style={{ fontFamily: SerifAccent, margin: '0 0 14px', fontSize: 22, color: '#0F172A', fontWeight: 500 }}>Meni topish</h2>
      <p style={{ fontFamily: PoppinsFont, margin: '0 0 6px', fontSize: 14, color: '#475569' }}>
        Email: <a style={{ color: accent, textDecoration: 'none', fontWeight: 600 }}>{slug}@mail.com</a>
      </p>
      <p style={{ fontFamily: PoppinsFont, margin: 0, fontSize: 14, color: '#475569' }}>
        Telegram: <a style={{ color: accent, textDecoration: 'none', fontWeight: 600 }}>@{slug}_codes</a>
      </p>
    </section>
  );
};
const StyledFooter = ({ accent = PORTFOLIO_DEFAULT_ACCENT, user = {} }) => (
  <footer style={{ background: '#0F172A', padding: '18px', textAlign: 'center' }}>
    <p style={{ fontFamily: PoppinsFont, margin: 0, fontSize: 12, color: '#94A3B8' }}>
      © 2025 <span style={{ color: accent, fontWeight: 600 }}>{user.name || 'Aziz'}</span>. Barcha huquqlar himoyalangan.
    </p>
  </footer>
);

// ============================================================
// SCREEN 0 — HOOK
// ============================================================
const Screen0 = ({ screen, user, storedAnswer, onAnswer, onNext }) => {
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const pick = (v) => {
    setPicked(v); onAnswer(0, { picked: v });
    setTimeout(onNext, 350);
  };
  const slug = safeSlug(user?.name);
  return (
    <Stage eyebrow="Kirish · stilizatsiya" screen={screen}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(18px,3vw,26px)' }}>
        <h1 className="title h-title fade-up">
          Endi <span className="italic" style={{ color: T.accent }}>jonlantiramiz</span>.
        </h1>
        <p className="body fade-up delay-1" style={{ color: T.ink2 }}>
          O'tgan darsda <b style={{ color: T.ink }}>HTML skeletini</b> qurdik — ko'rinishi bezaksiz edi.
          Bugun shu sahifaga CSS qo'shamiz — va u <b style={{ color: T.ink }}>butunlay boshqa</b> narsaga aylanadi.
        </p>
        <div className="fade-up delay-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div>
            <p className="eyebrow" style={{ color: T.ink3, margin: '0 0 6px', fontSize: 11 }}>O'tgan dars</p>
            <Preview minH={210} title={`${slug}.html`}>
              <RawHeader user={user} />
              <RawHero user={user} />
              <RawProjects user={user} />
            </Preview>
          </div>
          <div>
            <p className="eyebrow" style={{ color: T.accent, margin: '0 0 6px', fontSize: 11 }}>Bugun ✨</p>
            <Preview minH={210} title={`${slug}.html`}>
              <StyledHeader user={user} />
              <StyledHero user={user} />
              <StyledProjects withHover={false} user={user} />
            </Preview>
          </div>
        </div>
        <p className="h-sub title fade-up delay-3">
          Tayyor bo'lsangiz, boshlaymiz?
        </p>
        <div className="fade-up delay-4" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            { id: 'a', label: '🎨 Ha, sahifamni chiroyli qilmoqchiman!' },
            { id: 'b', label: '✨ CSS sehrini ko\u2019rmoqchiman' },
            { id: 'c', label: '💼 Portfolio\u2019m to\u2019liq tayyor bo\u2019lsin' },
            { id: 'd', label: '🚀 Boshlay olamiz' }
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
// SCREEN 1 — BUGUN BEZATAMIZ (objectives)
// ============================================================
const Screen1 = ({ screen, onNext, onPrev }) => (
  <Stage eyebrow="Reja" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext label="Boshlaymiz! →" onClick={onNext} /></>}>
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(18px,3vw,24px)' }}>
      <h2 className="title h-title fade-up">
        Bugun <span className="italic" style={{ color: T.accent }}>bezatamiz</span>! 🎨
      </h2>
      <p className="body fade-up delay-1" style={{ color: T.ink2 }}>
        Strategiya — har qismni alohida bezatamiz: <b style={{ color: T.ink }}>Body → Header → Hero → Loyihalar → Aloqa → Footer</b>.
        Eng oxirida — <b style={{ color: T.ink }}>sehrli hover effekt</b> va o'z rangingizni tanlash.
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
        Bu darsda portfolio'ni <b>Sky Blue</b> palitrasi bilan bezaymiz — modern, professional ko'rinish.
        Lekin oxirida <b>5 ta boshqa palitra</b> ham sinab ko'rishingiz mumkin!
      </Fact>
    </div>
  </Stage>
);

// ============================================================
// SCREEN 2 — CSS faylni ulash (<link rel="stylesheet">)
// ============================================================
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [mode, setMode] = useState('separate');
  const [touched, setTouched] = useState(storedAnswer !== undefined);
  const pick = (m) => {
    setMode(m);
    if (!touched) { setTouched(true); if (storedAnswer === undefined) onAnswer(2, { correct: true, picked: true }); }
  };
  return (
    <Stage eyebrow="CSS faylni ulash" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!touched} label={touched ? 'Davom etish' : 'Ikkala usulni ko\u2019ring'} onClick={onNext} /></>}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(18px,3vw,22px)' }}>
        <h2 className="title h-title fade-up">
          CSS'ni HTML'ga <span className="italic" style={{ color: T.accent }}>qanday ulaymiz</span>?
        </h2>
        <p className="body fade-up delay-1" style={{ color: T.ink2 }}>
          Ikki yo'l bor. <b style={{ color: T.ink }}>Tavsiya etiladigan</b> usul — alohida
          <span className="mono"> styles.css</span> fayl yaratish va <span className="mono">{'<link>'}</span> bilan ulash.
          Bu — professional yo'l: katta loyihalarda har doim shunday qilinadi.
        </p>
        <div className="fade-up delay-2" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className={`chip ${mode === 'separate' ? 'chip-on' : ''}`} onClick={() => pick('separate')}>
            ✓ Alohida fayl <span className="small" style={{ opacity: 0.7 }}>(tavsiya)</span>
          </button>
          <button className={`chip ${mode === 'inline' ? 'chip-on' : ''}`} onClick={() => pick('inline')}>
            {'<style>'} ichida
          </button>
        </div>
        <div className="fade-up delay-3" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <TagCard tag={'<link>'} desc="CSS faylni HTML'ga ulaydi" />
          <TagCard tag={'rel="stylesheet"'} desc="Bu CSS ekanini bildiradi" />
          <TagCard tag={'href="..."'} desc="CSS fayl yo'li" />
        </div>
        <div className="fade-up delay-3">
          <CodeBox>
            {mode === 'separate' ? (
              <>
                <Cm>{'<!-- index.html -->'}</Cm>{'\n'}
                <Tg>{'<head>'}</Tg>{'\n'}
                {'  '}<Tg>{'<link '}</Tg><At>rel</At><Pn>=</Pn><Sr>"stylesheet"</Sr> <At>href</At><Pn>=</Pn><Sr>"styles.css"</Sr><Tg>{'>'}</Tg>{'\n'}
                <Tg>{'</head>'}</Tg>{'\n\n'}
                <Cm>{'/* styles.css */'}</Cm>{'\n'}
                <Tg>body</Tg> <Pn>{'{'}</Pn> <At>background</At><Pn>:</Pn> <Sr>#F8FAFC</Sr><Pn>;</Pn> <Pn>{'}'}</Pn>
              </>
            ) : (
              <>
                <Cm>{'<!-- index.html -->'}</Cm>{'\n'}
                <Tg>{'<head>'}</Tg>{'\n'}
                {'  '}<Tg>{'<style>'}</Tg>{'\n'}
                {'    '}<Tg>body</Tg> <Pn>{'{'}</Pn> <At>background</At><Pn>:</Pn> <Sr>#F8FAFC</Sr><Pn>;</Pn> <Pn>{'}'}</Pn>{'\n'}
                {'  '}<Tg>{'</style>'}</Tg>{'\n'}
                <Tg>{'</head>'}</Tg>
              </>
            )}
          </CodeBox>
        </div>
        <Fact delay="delay-4">
          <b>Tavsiya:</b> har doim <span className="mono">styles.css</span> alohida fayl yarating. Sababi —
          ko'p sahifada qayta ishlatish, toza struktura va keshlash. Bu darsda biz shu usulni ishlatamiz.
        </Fact>
      </div>
    </Stage>
  );
};

// ============================================================
// SCREEN 3 — BODY (global uslub)
// ============================================================
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [added, setAdded] = useState(storedAnswer !== undefined);
  const add = () => {
    setAdded(true);
    if (storedAnswer === undefined) onAnswer(3, { correct: true, picked: true });
  };
  return (
    <Stage eyebrow="Body · global uslub" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!added} label={added ? 'Davom etish' : 'Body\u2019ni bezating'} onClick={onNext} /></>}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(18px,3vw,22px)' }}>
        <h2 className="title h-title fade-up">
          <span className="mono">body</span> — <span className="italic" style={{ color: T.accent }}>asos qo'yamiz</span>.
        </h2>
        <p className="body fade-up delay-1" style={{ color: T.ink2 }}>
          <span className="mono">body</span> tegga yozgan qoidalar <b style={{ color: T.ink }}>butun sahifaga</b> ta'sir qiladi.
          Avval umumiy <b style={{ color: T.ink }}>shrift</b>, <b style={{ color: T.ink }}>rang</b> va
          <b style={{ color: T.ink }}> margin</b>ni belgilab olamiz.
        </p>
        {!added ? (
          <div className="fade-up delay-2" style={{ display: 'flex', justifyContent: 'center' }}>
            <button className="build-btn" onClick={add}>✨ Body'ni bezating</button>
          </div>
        ) : (
          <GoodNote label="Body qoidasi qo'shildi">
            Sahifa endi modern shriftda, yumshoq <b>#F8FAFC</b> fonda. Boshqa qoidalar shu asosga quriladi.
          </GoodNote>
        )}
        <div className="fade-up delay-2">
          <p className="eyebrow" style={{ color: T.ink2, margin: '0 0 6px' }}>styles.css</p>
          <CodeBox>
            <Tg>body</Tg> <Pn>{'{'}</Pn>{'\n'}
            {'  '}<At>font-family</At><Pn>:</Pn> <Sr>'Manrope', sans-serif</Sr><Pn>;</Pn>{'\n'}
            {'  '}<At>background</At><Pn>:</Pn> <Sr>#F8FAFC</Sr><Pn>;</Pn>{'\n'}
            {'  '}<At>color</At><Pn>:</Pn> <Sr>#0F172A</Sr><Pn>;</Pn>{'\n'}
            {'  '}<At>margin</At><Pn>:</Pn> <Sr>0</Sr><Pn>;</Pn>{'\n'}
            <Pn>{'}'}</Pn>
          </CodeBox>
        </div>
        <div className="fade-up delay-3">
          <p className="eyebrow" style={{ color: T.ink2, margin: '0 0 6px' }}>Brauzer</p>
          <Preview minH={130}>
            <div style={{ background: added ? '#F8FAFC' : '#fff', transition: 'background 0.4s', padding: 14 }}>
              <h3 style={{
                fontFamily: added ? PoppinsFont : TNR, fontSize: 18, margin: '0 0 6px',
                color: '#0F172A', transition: 'all 0.4s', fontWeight: 700
              }}>Mening sahifam</h3>
              <p style={{
                fontFamily: added ? PoppinsFont : TNR, fontSize: 14, margin: 0,
                color: added ? '#475569' : '#000', transition: 'all 0.4s', lineHeight: 1.5
              }}>Bu — body'ga qo'llangan global qoidalar. Hammasi shu asosga quriladi.</p>
            </div>
          </Preview>
        </div>
        <Fact delay="delay-4">
          <span className="mono">margin: 0</span> — brauzerning standart <b>8px</b> margin'ini olib tashlaydi.
          Bu juda muhim! Aks holda body atrofida bo'sh chiziq qoladi.
        </Fact>
      </div>
    </Stage>
  );
};

// ============================================================
// SCREEN 4 — MCQ #1 [SCORED]
// ============================================================
const Screen4 = (props) => (
  <QuestionScreen {...props} idx={4} scope="practice" eyebrow="Mashq · 1-savol"
    questionText="Alohida styles.css faylni HTML'ga ulash uchun qaysi teg ishlatiladi?"
    question={
      <>
        <p className="eyebrow" style={{ color: T.accent }}>CSS faylni ulash</p>
        <h2 className="title h-sub" style={{ marginTop: 8 }}>
          Alohida <span className="mono">styles.css</span> faylni HTML'ga ulash uchun qaysi teg ishlatiladi?
        </h2>
      </>
    }
    options={[
      '<style src="styles.css">',
      '<link rel="stylesheet" href="styles.css">',
      '<css file="styles.css">',
      '<import "styles.css">'
    ]} correctIdx={1}
    explainCorrect="To'g'ri. <link rel='stylesheet' href='styles.css'> — head ichida turadi. rel — fayl turi, href — fayl yo'li."
    explainWrong={{
      0: '<style> tegida src atribut yo\u2019q — u faqat ichida CSS yozish uchun. Alohida fayl uchun <link> kerak.',
      2: '<css> tegi mavjud emas — bunday teg yo\u2019q.',
      3: '<import> mavjud emas. CSS uchun to\u2019g\u2019ri yo\u2019l — <link>.',
      default: 'Alohida CSS faylni ulash uchun: <link rel="stylesheet" href="...">.'
    }} />
);

// ============================================================
// SCREEN 5 — HEADER (blue bg + flexbox)
// ============================================================
const Screen5 = ({ screen, user, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [added, setAdded] = useState(storedAnswer !== undefined);
  const add = () => {
    setAdded(true);
    if (storedAnswer === undefined) onAnswer(5, { correct: true, picked: true });
  };
  return (
    <Stage eyebrow="1. Header" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!added} label={added ? 'Davom etish' : 'Header\u2019ni bezating'} onClick={onNext} /></>}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(18px,3vw,22px)' }}>
        <h2 className="title h-title fade-up">
          1. <span className="italic" style={{ color: T.accent }}>Header</span> — Sky Blue + flexbox.
        </h2>
        <p className="body fade-up delay-1" style={{ color: T.ink2 }}>
          Header'da 3 muhim ish: <b style={{ color: T.ink }}>fon rangi</b> beramiz (Sky Blue),
          <b style={{ color: T.ink }}> flexbox</b> bilan logo va menyu yonma-yon, va
          <span className="mono"> justify-content: space-between</span> bilan ularni <b style={{ color: T.ink }}>chetlarga</b> suramiz.
        </p>
        <div className="fade-up delay-2" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <TagCard tag={'background'} desc="Fon rangi" />
          <TagCard tag={'display: flex'} desc="Yonma-yon joylash" />
          <TagCard tag={'space-between'} desc="Chetlarga surish" />
        </div>
        {!added ? (
          <div className="fade-up delay-3" style={{ display: 'flex', justifyContent: 'center' }}>
            <button className="build-btn" onClick={add}>✨ Header'ni bezating</button>
          </div>
        ) : (
          <GoodNote label="Header chiroyli bo'ldi">
            Logo chap chetda, menyu o'ng chetda — <b>justify-content: space-between</b>ning ishi.
            <span className="mono"> text-decoration: none</span> — havolalardagi tagchi chiziqni olib tashlaydi.
          </GoodNote>
        )}
        <div className="fade-up delay-2">
          <p className="eyebrow" style={{ color: T.ink2, margin: '0 0 6px' }}>styles.css</p>
          <CodeBox>
            <Tg>header</Tg> <Pn>{'{'}</Pn>{'\n'}
            {'  '}<At>background</At><Pn>:</Pn> <Sr>#3B82F6</Sr><Pn>;</Pn>{'\n'}
            {'  '}<At>color</At><Pn>:</Pn> <Sr>white</Sr><Pn>;</Pn>{'\n'}
            {'  '}<At>display</At><Pn>:</Pn> <Sr>flex</Sr><Pn>;</Pn>{'\n'}
            {'  '}<At>justify-content</At><Pn>:</Pn> <Sr>space-between</Sr><Pn>;</Pn>{'\n'}
            {'  '}<At>align-items</At><Pn>:</Pn> <Sr>center</Sr><Pn>;</Pn>{'\n'}
            {'  '}<At>padding</At><Pn>:</Pn> <Sr>14px 18px</Sr><Pn>;</Pn>{'\n'}
            <Pn>{'}'}</Pn>{'\n'}
            <Tg>nav</Tg> <Pn>{'{'}</Pn> <At>display</At><Pn>:</Pn> <Sr>flex</Sr><Pn>;</Pn> <At>gap</At><Pn>:</Pn> <Sr>16px</Sr><Pn>;</Pn> <Pn>{'}'}</Pn>{'\n'}
            <Tg>nav a</Tg> <Pn>{'{'}</Pn> <At>color</At><Pn>:</Pn> <Sr>white</Sr><Pn>;</Pn> <At>text-decoration</At><Pn>:</Pn> <Sr>none</Sr><Pn>;</Pn> <Pn>{'}'}</Pn>
          </CodeBox>
        </div>
        <div className="fade-up delay-3">
          <p className="eyebrow" style={{ color: T.ink2, margin: '0 0 6px' }}>Brauzer</p>
          <Preview minH={70}>
            {added ? <StyledHeader user={user} /> : <RawHeader user={user} />}
          </Preview>
        </div>
        <Fact delay="delay-4">
          <b>Sky Blue (#3B82F6)</b> — bu Tailwind CSS'ning "blue-500" rangi. Vercel, Linear, Stripe kabi
          modern saytlar shunday ko'k tonlarini ishlatadi.
        </Fact>
      </div>
    </Stage>
  );
};

// ============================================================
// SCREEN 6 — HERO (katta sarlavha + soft blue fon)
// ============================================================
const Screen6 = ({ screen, user, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [added, setAdded] = useState(storedAnswer !== undefined);
  const add = () => {
    setAdded(true);
    if (storedAnswer === undefined) onAnswer(6, { correct: true, picked: true });
  };
  return (
    <Stage eyebrow="2. Hero" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!added} label={added ? 'Davom etish' : 'Hero\u2019ni bezating'} onClick={onNext} /></>}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(18px,3vw,22px)' }}>
        <h2 className="title h-title fade-up">
          2. <span className="italic" style={{ color: T.accent }}>Hero</span> — katta va markazda.
        </h2>
        <p className="body fade-up delay-1" style={{ color: T.ink2 }}>
          Hero — sahifaning eng katta tanishtirish qismi. Uchta sehrli xususiyat:
          <b style={{ color: T.ink }}> markazlash</b> (text-align: center), <b style={{ color: T.ink }}>katta padding</b>
          (yuqori/past bo'sh joy), va <b style={{ color: T.ink }}>katta sarlavha</b> (36px).
        </p>
        <div className="fade-up delay-2" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <TagCard tag={'padding'} desc="Ichkari bo'sh joy" />
          <TagCard tag={'text-align: center'} desc="Markazlash" />
          <TagCard tag={'font-size'} desc="Matn o'lchami" />
        </div>
        {!added ? (
          <div className="fade-up delay-3" style={{ display: 'flex', justifyContent: 'center' }}>
            <button className="build-btn" onClick={add}>✨ Hero'ni bezating</button>
          </div>
        ) : (
          <GoodNote label="Hero ko'zga tashlandi">
            Yumshoq ko'k fon, katta sarlavha — tashrifchi darrov "kim bu" deb biladi.
            <span className="mono"> padding: 60px 32px</span> = yuqori/past 60px, chap/o'ng 32px.
          </GoodNote>
        )}
        <div className="fade-up delay-2">
          <p className="eyebrow" style={{ color: T.ink2, margin: '0 0 6px' }}>styles.css</p>
          <CodeBox>
            <Tg>{'#about'}</Tg> <Pn>{'{'}</Pn>{'\n'}
            {'  '}<At>background</At><Pn>:</Pn> <Sr>#EFF6FF</Sr><Pn>;</Pn> <Cm>{'/* soft blue */'}</Cm>{'\n'}
            {'  '}<At>padding</At><Pn>:</Pn> <Sr>60px 32px</Sr><Pn>;</Pn>{'\n'}
            {'  '}<At>text-align</At><Pn>:</Pn> <Sr>center</Sr><Pn>;</Pn>{'\n'}
            <Pn>{'}'}</Pn>{'\n'}
            <Tg>{'#about h2'}</Tg> <Pn>{'{'}</Pn>{'\n'}
            {'  '}<At>font-size</At><Pn>:</Pn> <Sr>36px</Sr><Pn>;</Pn>{'\n'}
            {'  '}<At>color</At><Pn>:</Pn> <Sr>#0F172A</Sr><Pn>;</Pn>{'\n'}
            {'  '}<At>margin</At><Pn>:</Pn> <Sr>0 0 12px</Sr><Pn>;</Pn>{'\n'}
            <Pn>{'}'}</Pn>
          </CodeBox>
        </div>
        <div className="fade-up delay-3">
          <p className="eyebrow" style={{ color: T.ink2, margin: '0 0 6px' }}>Brauzer</p>
          <Preview minH={160}>
            {added ? <StyledHero user={user} /> : <RawHero user={user} />}
          </Preview>
        </div>
        <Fact delay="delay-4">
          <span className="mono">padding: 60px 32px</span> — 2 ta qiymat: birinchi yuqori/past, ikkinchi chap/o'ng.
          Yana <span className="mono">padding: 60px 32px 40px 20px</span> kabi 4 qiymat ham bo'lishi mumkin.
        </Fact>
      </div>
    </Stage>
  );
};

// ============================================================
// SCREEN 7 — MCQ #2 [SCORED]
// ============================================================
const Screen7 = (props) => (
  <QuestionScreen {...props} idx={7} scope="practice" eyebrow="Mashq · 2-savol"
    questionText="Logo va menyuni Header'ning chap va o'ng chetlariga surish uchun qaysi qoidalar kerak?"
    question={
      <>
        <p className="eyebrow" style={{ color: T.accent }}>Header layout</p>
        <h2 className="title h-sub" style={{ marginTop: 8 }}>
          Logo va menyuni Header'ning chap va o'ng chetlariga surish uchun qaysi qoidalar kerak?
        </h2>
      </>
    }
    options={[
      'text-align: center',
      'display: flex + justify-content: space-between',
      'margin: 0 auto',
      'padding: 0 50%'
    ]} correctIdx={1}
    explainCorrect="To'g'ri. display: flex elementlarni yonma-yon qiladi, justify-content: space-between esa eng birinchini va eng oxirgini chetlarga suradi."
    explainWrong={{
      0: 'text-align matn uchun — blok elementlarni markazlash uchun emas.',
      2: 'margin: 0 auto bitta blok elementni markazga keltiradi. Lekin biz 2 ta elementni chetlarga surishimiz kerak — bu boshqa masala.',
      3: 'padding: 0 50% — bo\u2019sh joy beradi, lekin element pozitsiyasini boshqarmaydi.',
      default: 'Chetlarga surish — flex + justify-content: space-between.'
    }} />
);

// ============================================================
// SCREEN 8 — LOYIHALAR (.cards Flexbox wrapper)
// ============================================================
const Screen8 = ({ screen, user, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [added, setAdded] = useState(storedAnswer !== undefined);
  const projects = projOf(user);
  const add = () => {
    setAdded(true);
    if (storedAnswer === undefined) onAnswer(8, { correct: true, picked: true });
  };
  return (
    <Stage eyebrow="3. Loyihalar · layout" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!added} label={added ? 'Davom etish' : 'Yonma-yon qiling'} onClick={onNext} /></>}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(16px,3vw,22px)' }}>
        <h2 className="title h-title fade-up">
          3. <span className="italic" style={{ color: T.accent }}>Loyihalar</span> — yonma-yon kartalar.
        </h2>
        <p className="body fade-up delay-1" style={{ color: T.ink2 }}>
          Hozir <span className="mono">{'<article>'}</span>'lar ustma-ust turibdi. Ularni <b style={{ color: T.ink }}>yonma-yon</b>
          qilish uchun — <b style={{ color: T.ink }}>HTML'ga kichik o'zgarish</b> kerak.
          <span className="mono"> {'<div class="cards">'}</span> bilan o'rab olamiz va Flexbox qo'llaymiz.
        </p>
        <div className="fade-up delay-2 frame-soft">
          <p className="eyebrow" style={{ color: T.accent, margin: '0 0 6px' }}>📝 HTML'da kichik o'zgarish:</p>
          <p className="small" style={{ margin: 0, color: T.ink, lineHeight: 1.6 }}>
            <span className="mono">{'<article>'}</span>'larni <span className="mono">{'<div class="cards">'}</span> bilan o'rab oling.
            Bu — CSS'ga "uchchovini birga boshqar" deyish.
          </p>
        </div>
        <div className="fade-up delay-2" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <TagCard tag={'.cards'} desc="Klass selektor" />
          <TagCard tag={'display: flex'} desc="Yonma-yon" />
          <TagCard tag={'gap'} desc="Oraliq" />
        </div>
        {!added ? (
          <div className="fade-up delay-3" style={{ display: 'flex', justifyContent: 'center' }}>
            <button className="build-btn" onClick={add}>✨ Flexbox'ni yoqing</button>
          </div>
        ) : (
          <GoodNote label="Yonma-yon joylashdi · 3/5">
            3 ta karta endi qator bo'lib joylashdi. <span className="mono">gap: 12px</span> oraliq beradi.
            Keyingi ekranda — har bir karta'ga uslub beramiz.
          </GoodNote>
        )}
        <div className="fade-up delay-2">
          <p className="eyebrow" style={{ color: T.ink2, margin: '0 0 6px' }}>styles.css</p>
          <CodeBox>
            <Tg>{'#projects'}</Tg> <Pn>{'{'}</Pn> <At>padding</At><Pn>:</Pn> <Sr>28px 18px</Sr><Pn>;</Pn> <Pn>{'}'}</Pn>{'\n'}
            <Tg>{'#projects h2'}</Tg> <Pn>{'{'}</Pn> <At>text-align</At><Pn>:</Pn> <Sr>center</Sr><Pn>;</Pn> <Pn>{'}'}</Pn>{'\n\n'}
            <Tg>{'.cards'}</Tg> <Pn>{'{'}</Pn>{'\n'}
            {'  '}<At>display</At><Pn>:</Pn> <Sr>flex</Sr><Pn>;</Pn>{'\n'}
            {'  '}<At>gap</At><Pn>:</Pn> <Sr>12px</Sr><Pn>;</Pn>{'\n'}
            {'  '}<At>flex-wrap</At><Pn>:</Pn> <Sr>wrap</Sr><Pn>;</Pn> <Cm>{'/* mobilga */'}</Cm>{'\n'}
            <Pn>{'}'}</Pn>
          </CodeBox>
        </div>
        <div className="fade-up delay-3">
          <p className="eyebrow" style={{ color: T.ink2, margin: '0 0 6px' }}>Brauzer</p>
          <Preview minH={120}>
            <div style={{ padding: 14, background: '#F8FAFC' }}>
              <h4 style={{ fontFamily: PoppinsFont, margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: '#0F172A', textAlign: 'center' }}>Mening loyihalarim</h4>
              <div style={{
                display: added ? 'flex' : 'block', gap: 8, flexWrap: 'wrap', transition: 'all 0.4s'
              }}>
                {projects.map((p, i) => (
                  <div key={i} style={{
                    background: '#fff', border: '1px solid #CBD5E1', borderRadius: 6,
                    padding: '8px 10px', marginBottom: added ? 0 : 6,
                    flex: added ? '1 1 100px' : 'none', minWidth: added ? 100 : 'auto',
                    fontFamily: PoppinsFont, fontSize: 12
                  }}>
                    <b>{p.title}</b>
                  </div>
                ))}
              </div>
            </div>
          </Preview>
        </div>
        <Fact delay="delay-4">
          <span className="mono">flex-wrap: wrap</span> — agar kartalar sig'masa, ular yangi qatorga o'tadi.
          Bu mobil ekranlar uchun muhim — kartalar siqilmaydi.
        </Fact>
      </div>
    </Stage>
  );
};

// ============================================================
// SCREEN 9 — KARTA (border + radius + padding)
// ============================================================
const Screen9 = ({ screen, user, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [added, setAdded] = useState(storedAnswer !== undefined);
  const projects = projOf(user);
  const add = () => {
    setAdded(true);
    if (storedAnswer === undefined) onAnswer(9, { correct: true, picked: true });
  };
  return (
    <Stage eyebrow="4. Karta · uslub" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!added} label={added ? 'Davom etish' : 'Karta\u2019ni bezating'} onClick={onNext} /></>}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(16px,3vw,22px)' }}>
        <h2 className="title h-title fade-up">
          4. <span className="italic" style={{ color: T.accent }}>Karta</span> — go'zal qutilar.
        </h2>
        <p className="body fade-up delay-1" style={{ color: T.ink2 }}>
          Endi har bir <span className="mono">{'<article>'}</span>'ga uslub beramiz:
          <b style={{ color: T.ink }}> oq fon</b>, <b style={{ color: T.ink }}>ko'k border</b>,
          <b style={{ color: T.ink }}> yumaloq burchak</b>, <b style={{ color: T.ink }}>ichkari padding</b>.
          Va <span className="mono">flex: 1</span> — kartalar bir xil kenglikda bo'ladi.
        </p>
        <div className="fade-up delay-2" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <TagCard tag={'border'} desc="Chegara chizig'i" />
          <TagCard tag={'border-radius'} desc="Yumaloq burchaklar" />
          <TagCard tag={'flex: 1'} desc="Teng kenglik" />
        </div>
        {!added ? (
          <div className="fade-up delay-3" style={{ display: 'flex', justifyContent: 'center' }}>
            <button className="build-btn" onClick={add}>✨ Karta'ni bezating</button>
          </div>
        ) : (
          <GoodNote label="Kartalar tayyor · 4/5">
            Ko'k border + oq fon + 8px yumaloq burchak = chiroyli kartochka pattern. Modern saytlarda har joyda shu uslub.
          </GoodNote>
        )}
        <div className="fade-up delay-2">
          <p className="eyebrow" style={{ color: T.ink2, margin: '0 0 6px' }}>styles.css</p>
          <CodeBox>
            <Tg>{'.cards article'}</Tg> <Pn>{'{'}</Pn>{'\n'}
            {'  '}<At>flex</At><Pn>:</Pn> <Sr>1</Sr><Pn>;</Pn> <Cm>{'/* teng joy oladi */'}</Cm>{'\n'}
            {'  '}<At>background</At><Pn>:</Pn> <Sr>white</Sr><Pn>;</Pn>{'\n'}
            {'  '}<At>border</At><Pn>:</Pn> <Sr>2px solid #3B82F6</Sr><Pn>;</Pn>{'\n'}
            {'  '}<At>border-radius</At><Pn>:</Pn> <Sr>8px</Sr><Pn>;</Pn>{'\n'}
            {'  '}<At>padding</At><Pn>:</Pn> <Sr>14px</Sr><Pn>;</Pn>{'\n'}
            {'  '}<At>min-width</At><Pn>:</Pn> <Sr>140px</Sr><Pn>;</Pn>{'\n'}
            <Pn>{'}'}</Pn>{'\n'}
            <Tg>{'.cards h3'}</Tg> <Pn>{'{'}</Pn> <At>color</At><Pn>:</Pn> <Sr>#0F172A</Sr><Pn>;</Pn> <At>margin-top</At><Pn>:</Pn> <Sr>0</Sr><Pn>;</Pn> <Pn>{'}'}</Pn>
          </CodeBox>
        </div>
        <div className="fade-up delay-3">
          <p className="eyebrow" style={{ color: T.ink2, margin: '0 0 6px' }}>Brauzer</p>
          <Preview minH={140}>
            {added ? (
              <StyledProjects withHover={false} user={user} />
            ) : (
              <div style={{ padding: 14, background: '#F8FAFC' }}>
                <h4 style={{ fontFamily: PoppinsFont, margin: '0 0 10px', fontSize: 14, fontWeight: 700, color: '#0F172A', textAlign: 'center' }}>Mening loyihalarim</h4>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {projects.map((p, i) => (
                    <div key={i} style={{
                      background: '#fff', border: '1px solid #CBD5E1', borderRadius: 4,
                      padding: '8px 10px', flex: '1 1 100px', minWidth: 100, fontFamily: PoppinsFont, fontSize: 12
                    }}>
                      <b>{p.title}</b>
                      <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>{p.desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Preview>
        </div>
        <Fact delay="delay-4">
          <span className="mono">flex: 1</span> — bu <b>"qolgan joyni teng baham ko'r"</b> degani. Har 3 karta o'zaro
          bir xil kenglikda bo'ladi. <span className="mono">border-radius: 8px</span> — yumshoq, professional ko'rinish.
        </Fact>
      </div>
    </Stage>
  );
};

// ============================================================
// SCREEN 10 — MCQ #3 [SCORED]
// ============================================================
const Screen10 = (props) => (
  <QuestionScreen {...props} idx={10} scope="practice" eyebrow="Mashq · 3-savol"
    questionText="Karta burchaklarini yumaloqlash uchun qaysi qoida ishlatiladi?"
    question={
      <>
        <p className="eyebrow" style={{ color: T.accent }}>Karta uslubi</p>
        <h2 className="title h-sub" style={{ marginTop: 8 }}>
          Karta burchaklarini <b>yumaloqlash</b> uchun qaysi qoida ishlatiladi?
        </h2>
      </>
    }
    options={[
      'border-round: 8px',
      'corner-radius: 8px',
      'border-radius: 8px',
      'round: 8px'
    ]} correctIdx={2}
    explainCorrect="To'g'ri. border-radius — burchaklarni yumaloqlash uchun. Qiymat qancha katta bo'lsa, shuncha yumaloq. 50% — to'liq aylana."
    explainWrong={{
      0: 'border-round qiymati yo\u2019q — bunday qoida mavjud emas.',
      1: 'corner-radius — bunday qoida ham yo\u2019q. To\u2019g\u2019risi — border-radius.',
      3: 'round — bunday qoida yo\u2019q.',
      default: 'Yumaloq burchaklar uchun — border-radius.'
    }} />
);

// ============================================================
// SCREEN 11 — ALOQA + FOOTER (navy)
// ============================================================
const Screen11 = ({ screen, user, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [added, setAdded] = useState(storedAnswer !== undefined);
  const add = () => {
    setAdded(true);
    if (storedAnswer === undefined) onAnswer(11, { correct: true, picked: true });
  };
  return (
    <Stage eyebrow="5. Aloqa + Footer" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!added} label={added ? 'Sehrli daqiqaga →' : 'Yakunlash'} onClick={onNext} /></>}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(16px,3vw,22px)' }}>
        <h2 className="title h-title fade-up">
          5. <span className="italic" style={{ color: T.accent }}>Aloqa + Footer</span>.
        </h2>
        <p className="body fade-up delay-1" style={{ color: T.ink2 }}>
          Aloqa — markazda, havolalar ko'k rangda. Footer — <b style={{ color: T.ink }}>qorong'i navy fon</b>
          (#0F172A), oq matn. Bu — saytni vizual ravishda <b style={{ color: T.ink }}>yopib qo'yadi</b>.
        </p>
        {!added ? (
          <div className="fade-up delay-2" style={{ display: 'flex', justifyContent: 'center' }}>
            <button className="build-btn" onClick={add}>✨ Yakuniy qismlarni bezating</button>
          </div>
        ) : (
          <GoodNote label="🎉 5/5 — barchasi bezatildi!">
            Sayt to'liq stilizatsiyalandi. Endi <b>eng yorqin moment</b>ga o'tamiz — hover effekti!
          </GoodNote>
        )}
        <div className="fade-up delay-2">
          <p className="eyebrow" style={{ color: T.ink2, margin: '0 0 6px' }}>styles.css</p>
          <CodeBox>
            <Tg>{'#contact'}</Tg> <Pn>{'{'}</Pn>{'\n'}
            {'  '}<At>text-align</At><Pn>:</Pn> <Sr>center</Sr><Pn>;</Pn>{'\n'}
            {'  '}<At>padding</At><Pn>:</Pn> <Sr>28px 18px</Sr><Pn>;</Pn>{'\n'}
            <Pn>{'}'}</Pn>{'\n'}
            <Tg>{'#contact a'}</Tg> <Pn>{'{'}</Pn>{'\n'}
            {'  '}<At>color</At><Pn>:</Pn> <Sr>#3B82F6</Sr><Pn>;</Pn>{'\n'}
            {'  '}<At>text-decoration</At><Pn>:</Pn> <Sr>none</Sr><Pn>;</Pn>{'\n'}
            {'  '}<At>font-weight</At><Pn>:</Pn> <Sr>600</Sr><Pn>;</Pn>{'\n'}
            <Pn>{'}'}</Pn>{'\n\n'}
            <Tg>footer</Tg> <Pn>{'{'}</Pn>{'\n'}
            {'  '}<At>background</At><Pn>:</Pn> <Sr>#0F172A</Sr><Pn>;</Pn> <Cm>{'/* navy */'}</Cm>{'\n'}
            {'  '}<At>color</At><Pn>:</Pn> <Sr>white</Sr><Pn>;</Pn>{'\n'}
            {'  '}<At>text-align</At><Pn>:</Pn> <Sr>center</Sr><Pn>;</Pn>{'\n'}
            {'  '}<At>padding</At><Pn>:</Pn> <Sr>18px</Sr><Pn>;</Pn>{'\n'}
            <Pn>{'}'}</Pn>
          </CodeBox>
        </div>
        <div className="fade-up delay-3">
          <p className="eyebrow" style={{ color: T.ink2, margin: '0 0 6px' }}>Brauzer</p>
          <Preview minH={170}>
            {added ? (
              <>
                <StyledContact user={user} />
                <StyledFooter user={user} />
              </>
            ) : (
              <>
                <RawContact user={user} />
                <RawFooter user={user} />
              </>
            )}
          </Preview>
        </div>
        <Fact delay="delay-4">
          Footer'ning navy rangi — Header'ning ko'k rangi bilan birga "<b>vizual qo'shilish</b>" beradi.
          Saytning yuqori va past qismlari bir-biriga aytadi: "biz birga".
        </Fact>
      </div>
    </Stage>
  );
};

// ============================================================
// SCREEN 12 — 🪄 HOVER SEHRI ⭐
// ============================================================
const Screen12 = ({ screen, user, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [simHover, setSimHover] = useState(false);
  const [touched, setTouched] = useState(storedAnswer !== undefined);
  const projects = projOf(user);
  const toggle = () => {
    setSimHover(!simHover);
    if (!touched) { setTouched(true); if (storedAnswer === undefined) onAnswer(12, { correct: true, picked: true }); }
  };
  return (
    <Stage eyebrow="🪄 Sehrli daqiqa" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!touched} label={touched ? 'To\u2019liq sahifa →' : 'Sehrni sinab ko\u2019ring'} onClick={onNext} /></>}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(16px,3vw,22px)' }}>
        <h2 className="title h-title fade-up">
          Hover — <span className="italic" style={{ color: T.accent }}>sichqoncha sehri</span> ✨
        </h2>
        <p className="body fade-up delay-1" style={{ color: T.ink2 }}>
          Hover — bu sichqoncha element ustiga kelganda nima bo'lishi. CSS'da
          <span className="mono"> :hover</span> bilan yozamiz. Yumshoq harakat uchun esa —
          <span className="mono"> transition</span>.
        </p>
        <div className="fade-up delay-2" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <TagCard tag={'transition'} desc="Yumshoq harakat" />
          <TagCard tag={':hover'} desc="Sichqoncha ustida" />
          <TagCard tag={'transform'} desc="Harakat (sakrash)" />
          <TagCard tag={'box-shadow'} desc="Soya" />
        </div>
        <div className="fade-up delay-3 hover-stage">
          <p className="eyebrow" style={{ color: T.ink2, margin: '0 0 6px', textAlign: 'center' }}>Demo karta — sichqoncha bilan ustiga keling</p>
          <article className={`hover-demo-card ${simHover ? 'sim-hover' : ''}`}>
            <h3 className="hover-card-title">{projects[0].title}</h3>
            <p className="hover-card-desc">{projects[0].desc}</p>
            <div className="hover-spark">✨</div>
          </article>
          <div style={{ textAlign: 'center', marginTop: 12 }}>
            <button className={`btn ${simHover ? 'btn-on' : ''}`} onClick={toggle}
              style={{ padding: '10px 18px', fontSize: 14, borderRadius: 99 }}>
              {simHover ? '✓ Sehr ishlamoqda — o\u2019chirish' : '🪄 Mobilda — sehrni faollashtiring'}
            </button>
            <p className="small" style={{ color: T.ink3, marginTop: 8, fontStyle: 'italic' }}>
              Desktop'da — sichqonchani karta ustiga olib keling
            </p>
          </div>
        </div>
        <div className="fade-up delay-3">
          <p className="eyebrow" style={{ color: T.ink2, margin: '0 0 6px' }}>styles.css</p>
          <CodeBox>
            <Tg>{'.cards article'}</Tg> <Pn>{'{'}</Pn>{'\n'}
            {'  '}<At>transition</At><Pn>:</Pn> <Sr>0.25s</Sr><Pn>;</Pn> <Cm>{'/* yumshoq harakat */'}</Cm>{'\n'}
            <Pn>{'}'}</Pn>{'\n'}
            <Tg>{'.cards article:hover'}</Tg> <Pn>{'{'}</Pn>{'\n'}
            {'  '}<At>transform</At><Pn>:</Pn> <Sr>translateY(-6px)</Sr><Pn>;</Pn>{'\n'}
            {'  '}<At>box-shadow</At><Pn>:</Pn> <Sr>0 8px 20px rgba(59,130,246,0.25)</Sr><Pn>;</Pn>{'\n'}
            <Pn>{'}'}</Pn>
          </CodeBox>
        </div>
        {touched && (
          <GoodNote label="Sehrli daqiqa anglandi">
            <b>3 ta qoida</b>: transition (yumshoq), transform: translateY (yuqoriga sakrash), box-shadow (soya).
            Bittasini olib tashlasangiz — sehr buziladi.
          </GoodNote>
        )}
        <Fact delay="delay-4">
          <span className="mono">translateY(-6px)</span> — kartani 6 piksel yuqoriga ko'taradi.
          Manfiy son — yuqoriga, musbat — pastga. Bu eng oddiy va eng professional UI patternlardan biri.
        </Fact>
      </div>
    </Stage>
  );
};

// ============================================================
// SCREEN 13 — 🎉 TO'LIQ PORTFOLIO
// ============================================================
const Screen13 = ({ screen, user, onNext, onPrev }) => (
  <Stage eyebrow="🎉 Tayyor" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext label="Rang tanlashga →" onClick={onNext} /></>}>
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(16px,3vw,22px)' }}>
      <h2 className="title h-title fade-up">
        Mana — <span className="italic" style={{ color: T.accent }}>to'liq portfolio</span>!
      </h2>
      <p className="body fade-up delay-1" style={{ color: T.ink2 }}>
        Bezaksiz HTML'dan — to'liq stilizatsiyalangan saytgacha. <b style={{ color: T.ink }}>Kartalar ustiga kelib ko'ring</b> —
        hover sehri ham ishlaydi!
      </p>
      <div className="fade-up delay-2">
        <p className="eyebrow" style={{ color: T.accent, margin: '0 0 6px' }}>Sizning yangi portfolio'yingiz</p>
        <Preview minH={460} title={`${safeSlug(user?.name)}-portfolio.html`}>
          <StyledHeader user={user} />
          <StyledHero user={user} />
          <StyledProjects user={user} />
          <StyledContact user={user} />
          <StyledFooter user={user} />
        </Preview>
      </div>
      <GoodNote label="Loyihalar tugadi">
        HTML strukturasi + CSS stilizatsiyasi + hover effekti — siz endi modern sayt yasashga tayyor.
        Keyingi ekranda yana bir sehr: <b>o'z rang sxemangizni tanlash</b>.
      </GoodNote>
    </div>
  </Stage>
);

// ============================================================
// SCREEN 14 — 🎨 PALITRA PICKER ⭐
// ============================================================
const PALETTES = [
  { id: 'ocean', emoji: '🌊', name: 'Ocean', val: '#3B82F6' },
  { id: 'sunset', emoji: '🌅', name: 'Sunset', val: '#F97316' },
  { id: 'forest', emoji: '🌿', name: 'Forest', val: '#10B981' },
  { id: 'royal', emoji: '👑', name: 'Royal', val: '#8B5CF6' },
  { id: 'berry', emoji: '🌸', name: 'Berry', val: '#EC4899' }
];
const Screen14 = ({ screen, user, storedAnswer, onAnswer, onNext, onPrev }) => {
  const [paletteId, setPaletteId] = useState('ocean');
  const [touched, setTouched] = useState(new Set(storedAnswer !== undefined ? PALETTES.map(p => p.id) : ['ocean']));
  const done = touched.size >= 2 || storedAnswer !== undefined;
  const cur = PALETTES.find(p => p.id === paletteId);
  const slug = safeSlug(user?.name);
  const pick = (id) => {
    setPaletteId(id);
    const next = new Set(touched); next.add(id);
    setTouched(next);
    if (next.size >= 2 && storedAnswer === undefined) onAnswer(14, { correct: true, picked: true });
  };
  return (
    <Stage eyebrow="🎨 Rang sxemasi" screen={screen} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Yakuniy tekshiruv →' : `Kamida 2 palitra sinang (${touched.size}/2)`} onClick={onNext} /></>}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(16px,3vw,22px)' }}>
        <h2 className="title h-title fade-up">
          O'z <span className="italic" style={{ color: cur.val, transition: 'color 0.3s' }}>rangingiz</span>ni tanlang!
        </h2>
        <p className="body fade-up delay-1" style={{ color: T.ink2 }}>
          CSS o'zgaruvchilari (<span className="mono">:root</span> + <span className="mono">--accent</span>) bilan
          <b style={{ color: T.ink }}> bitta rangni o'zgartirsangiz</b> — butun sayt qayta ranglanadi.
        </p>
        <div className="fade-up delay-2">
          <p className="eyebrow" style={{ color: T.ink2, margin: '0 0 10px' }}>5 ta palitradan tanlang</p>
          <div className="palette-grid">
            {PALETTES.map(p => (
              <button key={p.id} className={`palette-chip ${paletteId === p.id ? 'on' : ''}`} onClick={() => pick(p.id)}>
                <span className="palette-swatch" style={{ background: p.val }} />
                <span className="palette-info">
                  <span className="palette-emoji">{p.emoji}</span>
                  <span className="palette-name">{p.name}</span>
                </span>
              </button>
            ))}
          </div>
        </div>
        <div className="fade-up delay-3">
          <p className="eyebrow" style={{ color: T.ink2, margin: '0 0 6px' }}>styles.css</p>
          <CodeBox>
            <Cm>{'/* Bitta o\u2019zgaruvchi — butun sayt */'}</Cm>{'\n'}
            <Tg>{':root'}</Tg> <Pn>{'{'}</Pn>{'\n'}
            {'  '}<At>--accent</At><Pn>:</Pn> <Sr>{cur.val}</Sr><Pn>;</Pn> <Cm>{'/* ' + cur.name + ' */'}</Cm>{'\n'}
            <Pn>{'}'}</Pn>{'\n'}
            <Tg>header</Tg> <Pn>{'{'}</Pn> <At>background</At><Pn>:</Pn> <Sr>{'var(--accent)'}</Sr><Pn>;</Pn> <Pn>{'}'}</Pn>
          </CodeBox>
        </div>
        <div className="fade-up delay-3">
          <p className="eyebrow" style={{ color: T.ink2, margin: '0 0 6px' }}>Jonli portfolio</p>
          <Preview minH={460} title={`${slug}-${paletteId}.html`}>
            <StyledHeader accent={cur.val} user={user} />
            <StyledHero accent={cur.val} user={user} />
            <StyledProjects accent={cur.val} user={user} />
            <StyledContact accent={cur.val} user={user} />
            <StyledFooter accent={cur.val} user={user} />
          </Preview>
        </div>
        {touched.size >= 2 && (
          <GoodNote label="Sehrli o'zgarish">
            Bitta o'zgaruvchi — butun sayt boshqacha. Uy vazifasida o'zingizga eng yoqgan palitrani tanlang!
          </GoodNote>
        )}
      </div>
    </Stage>
  );
};

// ============================================================
// SCREEN 15 — MCQ FINAL [SCORED · scope:'final']
// ============================================================
const Screen15 = (props) => (
  <QuestionScreen {...props} idx={15} scope="final" eyebrow="Yakuniy tekshiruv"
    questionText="Hover effekti yumshoq bo'lishi uchun qaysi qoida kerak?"
    question={
      <>
        <p className="eyebrow" style={{ color: T.accent }}>So'nggi savol</p>
        <h2 className="title h-sub" style={{ marginTop: 8 }}>
          Hover effekti yumshoq bo'lishi uchun qaysi qoida <b>kerak</b>?
        </h2>
      </>
    }
    options={[
      'animation',
      'transition',
      'duration',
      'speed'
    ]} correctIdx={1}
    explainCorrect="To'g'ri. transition — bu ikki holat orasidagi yumshoq harakat. transition: 0.25s — barcha xususiyatlar 0.25 sekundda o'zgaradi."
    explainWrong={{
      0: 'animation murakkabroq — keyframe\u2019lar bilan ko\u2019p qadamli animatsiya. Hover\u2019ning oddiy holati uchun transition yetarli.',
      2: 'duration alohida qoida emas — u transition yoki animation ichida ishlatiladi.',
      3: 'speed CSS qoidasi emas — bunday narsa yo\u2019q.',
      default: 'Yumshoq hover uchun — transition.'
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
          <p className="eyebrow" style={{ color: T.accent }}>2-loyiha tugadi 🎉</p>
          <h2 className="title h-title" style={{ marginTop: 10 }}>
            Endi siz <span className="italic">haqiqiy sayt</span> yasashga tayyor.
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
            {correct >= total * 0.85 && 'Ajoyib! Portfolio yasashni mukammal o\u2019zlashtirdingiz.'}
            {correct >= total * 0.6 && correct < total * 0.85 && 'Yaxshi! Bir-ikki joyni takrorlasangiz bo\u2019ldi.'}
            {correct < total * 0.6 && 'Darsni yana bir bor ko\u2019rib chiqsangiz foydali bo\u2019ladi.'}
          </p>
        </div>
        <div className="frame-soft fade-up delay-2">
          <p className="eyebrow" style={{ color: T.accent, margin: 0 }}>📝 Uyga vazifa</p>
          <p className="body" style={{ margin: '8px 0 12px', color: T.ink }}>Portfolio'yingizni o'zingizga moslashtiring:</p>
          <ul style={{ ...UL_STYLE, color: T.ink2, fontSize: 'clamp(14px,1.9vw,16px)' }}>
            <li>🎨 <b style={{ color: T.ink }}>Rang tanlang</b> — Ocean, Sunset, Forest, Royal, Berry yoki o'z rangingiz</li>
            <li>📐 <b style={{ color: T.ink }}>Header</b> — flexbox bilan menyu joylash</li>
            <li>🃏 <b style={{ color: T.ink }}>Loyiha kartalari</b> — flex, border, padding</li>
            <li>✨ <b style={{ color: T.ink }}>Hover effekt</b> — transition + translateY + box-shadow</li>
            <li>🚀 <b style={{ color: T.ink }}>Qo'shimcha</b> — AI'dan boshqa dizayn so'rab sinab ko'ring</li>
          </ul>
        </div>
        <div className="fade-up delay-3 frame" style={{ background: T.bg }}>
          <p className="eyebrow" style={{ color: T.accent, margin: 0 }}>Kalit so'zlar</p>
          <ul style={{ ...UL_STYLE, marginTop: 12, color: T.ink2 }}>
            <li><b style={{ color: T.ink }}>{'<link rel="stylesheet">'}</b> — CSS faylini ulash</li>
            <li><b style={{ color: T.ink }}>body</b> — global shrift va ranglar</li>
            <li><b style={{ color: T.ink }}>display: flex + justify-content</b> — yonma-yon va chetlarga</li>
            <li><b style={{ color: T.ink }}>text-decoration: none</b> — toza havolalar</li>
            <li><b style={{ color: T.ink }}>padding, background, color</b> — asosiy bezash</li>
            <li><b style={{ color: T.ink }}>.cards + Flexbox</b> — kartalar grid</li>
            <li><b style={{ color: T.ink }}>border, border-radius</b> — chiroyli qutilar</li>
            <li><b style={{ color: T.ink }}>transition + :hover</b> — sehrli daqiqa</li>
            <li><b style={{ color: T.ink }}>transform: translateY</b> — sakrash</li>
            <li><b style={{ color: T.ink }}>box-shadow</b> — soya effekti</li>
            <li><b style={{ color: T.ink }}>{':root + --accent'}</b> — global rang o'zgaruvchisi</li>
          </ul>
        </div>
      </div>
    </Stage>
  );
};

// ============================================================
// MAIN — корневой компонент. Получает onFinished и initialPortfolio от LMS.
// initialPortfolio (от 1-урока практики) подставляет имя/проекты ученика.
// ============================================================
export default function PortfolioCss({ onFinished, initialPortfolio }) {
  const [screen, setScreen] = useState(0);
  const [answers, setAnswers] = useState({});
  const startTimeRef = useRef(Date.now());

  // Ученик из 1-урока (или дефолт "Aziz" для standalone)
  const user = {
    name: (initialPortfolio && initialPortfolio.name) || 'Aziz',
    age: (initialPortfolio && initialPortfolio.age) || '15',
    bio: (initialPortfolio && initialPortfolio.bio) || 'HTML va CSS bilan saytlar yarataman.',
    projects: (initialPortfolio && initialPortfolio.projects && initialPortfolio.projects.length)
      ? initialPortfolio.projects : DEFAULT_PROJECTS
  };

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
      // Modul yakuni: portfolio (HTML+CSS) keyingi modulga uzatiladi.
      portfolio: user,
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
        .btn-on { background: ${T.success}; border-color: ${T.success}; color: #fff; }
        .btn-on:hover:not(:disabled) { background: ${T.success}; border-color: ${T.success}; opacity: 0.9; }

        .option { background: ${T.paper}; border: 1.5px solid ${T.ink}; cursor: pointer; transition: all 0.2s; font-family: 'Manrope', sans-serif; font-weight: 500; text-align: left; border-radius: 12px; width: 100%; }
        .option:hover:not(:disabled) { background: ${T.ink}; color: ${T.bg}; }
        .option:disabled { cursor: default; }
        .option-correct { background: ${T.successSoft} !important; color: ${T.success} !important; border-color: ${T.success} !important; border-width: 2px; }
        .option-wrong { background: ${T.paper} !important; color: ${T.ink3} !important; border-color: ${T.ink3} !important; }
        .option-picked-wrong { background: ${T.accentSoft} !important; color: ${T.accent} !important; border-color: ${T.accent} !important; border-width: 2px; }

        .chip { font-family: 'Manrope', sans-serif; font-weight: 600; font-size: clamp(13px,1.7vw,15px); display: inline-flex; align-items: center; gap: 8px; padding: 10px 16px; border-radius: 99px; border: 1.5px solid ${T.ink}; background: ${T.paper}; color: ${T.ink}; cursor: pointer; transition: all 0.18s; }
        .chip:hover:not(:disabled) { transform: translateY(-1px); }
        .chip-on { background: ${T.accent}; border-color: ${T.accent}; color: #fff; }

        @keyframes pulse-shadow { 0%,100% { box-shadow: 0 4px 16px rgba(255,79,40,0.3); } 50% { box-shadow: 0 6px 22px rgba(255,79,40,0.5); } }
        .build-btn { font-family: 'Manrope', sans-serif; font-weight: 700; font-size: clamp(16px,2.2vw,18px); padding: clamp(14px,2.5vw,18px) clamp(28px,4vw,40px); border-radius: 14px; border: 2px solid ${T.accent}; background: ${T.accent}; color: #fff; cursor: pointer; transition: all 0.2s; animation: pulse-shadow 2s infinite; }
        .build-btn:hover { transform: translateY(-2px); animation: none; box-shadow: 0 8px 24px rgba(255,79,40,0.5); }

        .code-box { background: ${CODE.bg}; color: ${CODE.text}; font-family: 'JetBrains Mono', monospace; font-size: clamp(13px,1.85vw,15px); line-height: 1.6; padding: clamp(14px,3vw,20px); border-radius: 12px; overflow-x: auto; white-space: pre-wrap; word-break: break-word; margin: 0; }
        .bp-window { border: 1.5px solid ${T.ink}; border-radius: 12px; overflow: hidden; background: #fff; }
        .bp-bar { background: #f0eee8; padding: 8px 12px; display: flex; align-items: center; gap: 10px; border-bottom: 1px solid ${T.ink}30; }
        .bp-title { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink3}; }
        .bp-body { padding: clamp(14px,3vw,20px); }

        .topics { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 10px; }
        .topic-item { display: flex; align-items: center; gap: 14px; padding: 12px 16px; background: ${T.paper}; border-radius: 10px; border: 1px solid ${T.ink3}40; }
        .topic-num { font-family: 'JetBrains Mono'; font-weight: 700; font-size: clamp(13px,1.8vw,15px); color: ${T.accent}; min-width: 26px; }
        .topic-text { font-family: 'Manrope'; font-weight: 500; color: ${T.ink}; font-size: clamp(14px,1.9vw,16px); }

        /* Tag cards */
        .tag-card { display: inline-flex; align-items: center; gap: 8px; background: ${T.paper}; border: 1px solid ${T.ink3}50; border-radius: 8px; padding: 6px 10px; }
        .tag-card-tag { font-family: 'JetBrains Mono'; font-size: clamp(11px,1.5vw,13px); color: ${T.accent}; font-weight: 600; }
        .tag-card-desc { font-family: 'Manrope'; font-size: clamp(11px,1.4vw,13px); color: ${T.ink2}; }

        /* Styled portfolio cards (used in Screen 9, 13, 14) */
        .cards-row { display: flex; gap: 10px; flex-wrap: wrap; }
        .styled-card { flex: 1 1 130px; min-width: 130px; background: #FFFFFF; border: 2px solid #3B82F6; border-radius: 8px; padding: 12px 14px; transition: transform 0.25s, box-shadow 0.25s; }
        .styled-card.hoverable:hover { transform: translateY(-4px); box-shadow: 0 8px 18px rgba(15,23,42,0.12); }

        /* HOVER DEMO (Screen 12) */
        .hover-stage { background: linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%); padding: clamp(20px,4vw,32px); border-radius: 16px; border: 1px dashed #93C5FD; }
        .hover-demo-card { display: block; max-width: 280px; margin: 0 auto; background: #fff; border: 2px solid #3B82F6; border-radius: 12px; padding: 18px 20px; position: relative; transition: transform 0.3s cubic-bezier(.34,1.56,.64,1), box-shadow 0.3s; cursor: pointer; }
        .hover-demo-card:hover, .hover-demo-card.sim-hover { transform: translateY(-8px); box-shadow: 0 14px 30px rgba(59,130,246,0.3); }
        .hover-card-title { font-family: 'Manrope', sans-serif; margin: 0 0 6px; font-size: 16px; font-weight: 700; color: #0F172A; }
        .hover-card-desc { font-family: 'Manrope', sans-serif; margin: 0; font-size: 13px; color: #475569; }
        .hover-spark { position: absolute; top: 8px; right: 10px; font-size: 16px; opacity: 0; transition: opacity 0.3s, transform 0.3s; transform: translateY(4px); }
        .hover-demo-card:hover .hover-spark, .hover-demo-card.sim-hover .hover-spark { opacity: 1; transform: translateY(0); }

        /* Palette picker (Screen 14) */
        .palette-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 10px; }
        .palette-chip { display: flex; align-items: center; gap: 10px; padding: 10px 12px; border-radius: 12px; border: 1.5px solid ${T.ink}; background: ${T.paper}; cursor: pointer; transition: all 0.2s; font-family: 'Manrope', sans-serif; }
        .palette-chip:hover { transform: translateY(-2px); }
        .palette-chip.on { border-width: 2.5px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .palette-swatch { width: 28px; height: 28px; border-radius: 50%; box-shadow: 0 1px 3px rgba(0,0,0,0.2); flex-shrink: 0; }
        .palette-info { display: flex; flex-direction: column; gap: 1px; align-items: flex-start; }
        .palette-emoji { font-size: 14px; line-height: 1; }
        .palette-name { font-weight: 700; font-size: clamp(13px,1.6vw,14px); color: ${T.ink}; }

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
        <Current screen={screen} user={user} storedAnswer={answers[screen]} answers={answers} onAnswer={recordAnswer} onNext={next} onPrev={prev} onReset={reset} onFinish={finishLesson} />
      </div>
    </>
  );
}