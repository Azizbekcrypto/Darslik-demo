import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';

// ============================================================
// REACT MODULI · 2-DARS — BIRINCHI KOMPONENT — PLATFORM STANDARD v16
// Mavzu: Vite setup (npm create vite), loyiha tuzilishi (package.json, index.html,
//        main.jsx, App.jsx), JSX qoidalari ({}, className, bitta o'rama),
//        birinchi komponent yozish va chaqirish, props bilan ma'lumot uzatish.
// Misol sayt: robo-games — Roblox uslubidagi o'yin kartochkalari (roblox.com/home'dagidek:
//        thumbnail + nom + 👍 % + 👥 o'yinchilar). Komponent: <GameCard />.
// MUHIM: kelgusi darslar ro'yxati o'quvchiga AYTILMAYDI — faqat yakunda keyingi dars teaser.
// Yakuniy ekran (s15): VS Code muhiti — App.jsx tab, qator raqamlari, kod ichida input.
// Hook: bitta buyruq — butun loyiha skeleti tayyor (npm create vite@latest).
// Senariy: tushunchalar -> vibecoding (AI agent) -> debugging -> qo'lda yozish -> yakun.
// Toza dizayn — ortiqcha emoji yo'q; ma'no so'z va tipografiya bilan beriladi.
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
const MentorCtx = createContext(null); // mobil: yig'iladigan Mentor
const useLang = () => useContext(LangContext);

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

class AudioEngine {
  constructor() {
    this.queue = []; this.currentIdx = 0; this.isPlaying = false;
    this.currentUtterance = null; this.onStateChange = null; this.waitingFor = null;
    this.voicesByLang = { ru: null, uz: null }; this.voicesReady = false; this.currentLang = 'uz';
    this.initVoices();
  }
  initVoices() {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const load = () => {
      const v = window.speechSynthesis.getVoices();
      if (!v.length) return;
      this.voicesByLang.ru = v.find(x => x.lang.startsWith('ru')) || v[0];
      this.voicesByLang.uz = v.find(x => x.lang.startsWith('uz')) || v.find(x => x.lang.startsWith('ru')) || v[0];
      this.voicesReady = true;
    };
    load();
    if (window.speechSynthesis.onvoiceschanged !== undefined) window.speechSynthesis.onvoiceschanged = load;
  }
  setLang(l) { this.currentLang = l; }
  getVoice() { return this.voicesByLang[this.currentLang] || this.voicesByLang.ru || null; }
  hasUz() { if (typeof window === 'undefined' || !window.speechSynthesis) return false; return window.speechSynthesis.getVoices().some(v => v.lang.startsWith('uz')); }
  loadQueue(s) { this.stop(); this.queue = s; this.currentIdx = 0; this.waitingFor = null; }
  playSegment(seg) {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(seg.text);
    const useUz = this.currentLang === 'uz' && this.hasUz();
    u.lang = useUz ? 'uz-UZ' : 'ru-RU'; u.rate = 0.95; u.pitch = 1.0;
    const v = this.getVoice(); if (v) u.voice = v;
    u.onstart = () => { this.isPlaying = true; if (this.onStateChange) this.onStateChange({ isPlaying: true, currentSegment: seg.id }); };
    u.onend = () => { this.isPlaying = false; this.currentUtterance = null; if (this.onStateChange) this.onStateChange({ isPlaying: false, currentSegment: null }); this.handleEnd(seg); };
    u.onerror = () => { this.isPlaying = false; this.currentUtterance = null; if (this.onStateChange) this.onStateChange({ isPlaying: false, currentSegment: null }); };
    this.currentUtterance = u; /* AUDIOSIZ: ovoz o'chirildi (kontekst saqlandi) */
  }
  handleEnd(seg) { if (seg.waits_for) { this.waitingFor = seg.waits_for; if (this.onStateChange) this.onStateChange({ isPlaying: false, waitingFor: seg.waits_for }); } else { this.currentIdx++; this.playNext(); } }
  playNext() { if (this.currentIdx >= this.queue.length) return; this.playSegment(this.queue[this.currentIdx]); }
  start() { this.currentIdx = 0; this.waitingFor = null; this.playNext(); }
  triggerEvent(type, target) { if (!this.waitingFor) return; const m = this.waitingFor.type === type && (this.waitingFor.target === target || !this.waitingFor.target); if (m) { this.waitingFor = null; this.currentIdx++; this.playNext(); } }
  pushOneOff(text) { if (!text) return; this.queue.push({ id: `oneoff_${Date.now()}`, text, trigger: 'manual', waits_for: null }); this.currentIdx = this.queue.length - 1; this.playNext(); }
  replay() { if (this.currentIdx > 0) this.currentIdx--; this.waitingFor = null; this.playNext(); }
  stop() { if (typeof window !== 'undefined' && window.speechSynthesis) window.speechSynthesis.cancel(); this.isPlaying = false; this.currentUtterance = null; if (this.onStateChange) this.onStateChange({ isPlaying: false, currentSegment: null }); }
}
let audioEngineInstance = null;
const getAudioEngine = () => { if (typeof window === 'undefined') return null; if (!audioEngineInstance) audioEngineInstance = new AudioEngine(); return audioEngineInstance; };

function useAudio(segments) {
  const lang = useLang();
  const [state, setState] = useState({ isPlaying: false, currentSegment: null, waitingFor: null, muted: false });
  const engineRef = useRef(null);
  const segmentsRef = useRef(segments);
  const key = segments ? JSON.stringify(segments) : '';
  const prevKey = useRef(key);
  if (prevKey.current !== key) { segmentsRef.current = segments; prevKey.current = key; }
  const stable = segmentsRef.current;
  useEffect(() => {
    const engine = getAudioEngine(); if (!engine) return;
    engineRef.current = engine; engine.setLang(lang);
    engine.onStateChange = (s) => setState(p => ({ ...p, ...s }));
    if (stable && stable.length > 0 && !state.muted) {
      engine.loadQueue(stable);
      const t = setTimeout(() => engine.start(), 300);
      return () => { clearTimeout(t); engine.stop(); };
    }
    return () => { if (engine) engine.stop(); };
    // eslint-disable-next-line
  }, [stable, lang]);
  const triggerEvent = useCallback((type, target) => { if (engineRef.current) engineRef.current.triggerEvent(type, target); }, []);
  const replay = useCallback(() => { if (engineRef.current) engineRef.current.replay(); }, []);
  const toggleMute = useCallback(() => { setState(p => { const m = !p.muted; if (m && engineRef.current) engineRef.current.stop(); return { ...p, muted: m }; }); }, []);
  return { ...state, triggerEvent, replay, toggleMute };
}

const AudioIndicator = ({ audioState }) => {
  const { isPlaying, muted, replay, toggleMute } = audioState;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <button onClick={toggleMute} title={muted ? 'Sound on' : 'Sound off'} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', color: muted ? T.ink3 : (isPlaying ? T.accent : T.ink2) }}>
        {muted ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></svg>
        ) : isPlaying ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /></svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /></svg>
        )}
      </button>
      {!muted && (
        <button onClick={replay} title="Replay" style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', color: T.ink2 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" /></svg>
        </button>
      )}
    </div>
  );
};

const LESSON_META = { lessonId: 'react-first-component-02-v16', lessonTitle: { uz: 'Birinchi komponent: Vite, JSX, props', ru: 'Первый компонент: Vite, JSX, props' } };
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
  { id: 's11', type: 'case',        template: 'custom',   scored: false, scope: null },
  { id: 's12', type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's13', type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's14', type: 'rule',        template: 'custom',   scored: false, scope: null },
  { id: 's15', type: 'test',        template: 'custom',   scored: true,  scope: 'final' },
  { id: 's16', type: 'summary',     template: 'custom',   scored: false, scope: null }
];
const TOTAL_SCREENS = SCREEN_META.length;
const SCORED_IDX = SCREEN_META.map((m, i) => (m.scored ? i : null)).filter(i => i !== null);

const Split = ({ children }) => <div className="split">{children}</div>;
const Col = ({ children, gap }) => <div className="col" style={gap ? { gap } : undefined}>{children}</div>;

const Stage = ({ children, eyebrow, screen, totalScreens = TOTAL_SCREENS, navContent, audioState, narrow, mentorStatic }) => {
  const isMobile = useIsMobile();
  const isNarrow = useIsMobile(768); // mobil: Mentor yig'ilish rejimi
  const collapseOn = isNarrow && !mentorStatic; // ba'zi sahifalarda Mentor yig'ilmaydi
  const padH = isMobile ? 12 : 100;
  const [mCollapsed, setMCollapsed] = useState(false);
  const contentRef = useRef(null);
  useEffect(() => { setMCollapsed(false); }, [screen]); // har ekranda Mentor ochiq holatdan boshlanadi
  const setCollapsed = useCallback((v) => {
    setMCollapsed(v);
    if (v === false && contentRef.current) { const el = contentRef.current; requestAnimationFrame(() => { if (el) el.scrollTo({ top: 0, behavior: 'auto' }); }); }
  }, []);
  const onContentClick = (e) => {
    if (!collapseOn || mCollapsed) return;
    if (e.target && e.target.closest && e.target.closest('.mentor')) return; // Mentorning o'ziga tegsa — yig'maymiz
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {audioState && <AudioIndicator audioState={audioState} />}
              <div className="mono small" style={{ color: T.ink3 }}>{String(screen + 1).padStart(2, '0')} / {String(totalScreens).padStart(2, '0')}</div>
            </div>
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

const QuestionScreen = ({ screen, idx, scope, eyebrow, question, questionText, options, correctIdx, explainCorrect, explainWrong, audioText, audioOk, audioWrong, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio(audioText ? [{ id: `s${screen}_intro`, text: audioText, trigger: 'on_mount', waits_for: { type: 'option_picked' } }] : null);
  const [picked, setPicked] = useState(storedAnswer?.lastPicked ?? storedAnswer?.picked ?? null);
  const [solved, setSolved] = useState(storedAnswer ? (storedAnswer.solved ?? (storedAnswer.picked === correctIdx)) : false);
  const firstCorrectRef = useRef(storedAnswer ? (storedAnswer.firstAttemptCorrect ?? storedAnswer.correct ?? null) : null);
  const pick = (i) => {
    if (solved) return;
    setPicked(i);
    const isCorrect = i === correctIdx;
    if (firstCorrectRef.current === null) firstCorrectRef.current = isCorrect; // ball: 1-urinishni qotirib qo'yamiz
    if (isCorrect) setSolved(true);
    onAnswer(screen, { stage: scope, screenIdx: screen, question: questionText, options, correctIndex: correctIdx, correctAnswer: options[correctIdx], picked: i, studentAnswerIndex: i, studentAnswer: options[i], correct: firstCorrectRef.current, firstAttemptCorrect: firstCorrectRef.current, solved: isCorrect, lastPicked: i });
    if (audioText) { audio.triggerEvent('option_picked'); if (!audio.muted) setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff(isCorrect ? (audioOk || "To'g'ri.") : (audioWrong || "Unchalik emas. Qaytadan urinib ko'ring.")); }, 300); }
  };
  return (
    <Stage eyebrow={eyebrow} screen={screen} narrow audioState={audioText ? audio : undefined} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!solved} label={solved ? 'Davom etish' : "To'g'ri javobni toping"} onClick={onNext} /></>}>
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

// ===== MENTOR =====
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

// ===== REACT-2 YORDAMCHILAR =====
const Jx = ({ children }) => <span style={{ color: CODE.tag }}>{children}</span>;
const At = ({ children }) => <span style={{ color: CODE.attr }}>{children}</span>;
const St = ({ children }) => <span style={{ color: CODE.str }}>{children}</span>;
const Cm = ({ children }) => <span style={{ color: CODE.comment, fontStyle: 'italic' }}>{children}</span>;
const Win = ({ title, children, minH }) => (
  <div className="bp-window"><div className="bp-bar"><span className="bb-dots"><i /><i /><i /></span><span className="bp-title">{title}</span></div><div className="bp-body" style={{ minHeight: minH, position: 'relative' }}>{children}</div></div>
);
// Roblox uslubidagi o'yinlar — misol saytning kartochkalari (roblox.com/home'dagidek)
const GAMES = [
  { name: 'Adopt Me!', emoji: '🐾', likes: 92, players: '402K', bg: 'linear-gradient(135deg,#FF9DBF,#C44569)' },
  { name: 'Blox Fruits', emoji: '🍇', likes: 95, players: '750K', bg: 'linear-gradient(135deg,#7EA6F4,#2E4A9E)' },
  { name: 'Brookhaven', emoji: '🏠', likes: 89, players: '510K', bg: 'linear-gradient(135deg,#8FD3A8,#2E7A4E)' },
  { name: 'Tower of Hell', emoji: '🗼', likes: 84, players: '120K', bg: 'linear-gradient(135deg,#F4B26A,#C9622E)' },
  { name: 'Pet Sim 99', emoji: '🐶', likes: 90, players: '230K', bg: 'linear-gradient(135deg,#B9A8F4,#6A4AC9)' },
  { name: 'Murder Mystery', emoji: '🕵️', likes: 86, players: '95K', bg: 'linear-gradient(135deg,#9AB6C9,#3E5A70)' }
];
const gameByName = (nm) => GAMES.find(g => g.name.toLowerCase() === String(nm).toLowerCase());
// Jonli o'yin kartochkasi — Roblox'dagidek: thumbnail + nom + 👍 % (+ 👥 o'yinchilar)
const RoCard = ({ name, emoji, players, likeable }) => {
  const g = gameByName(name);
  const bg = g ? g.bg : 'linear-gradient(135deg,#8E9BB5,#4A5670)';
  const em = emoji || (g ? g.emoji : '🎮');
  const baseLikes = g ? g.likes : 88;
  const [liked, setLiked] = useState(false);
  return (
    <div className="rocard el-in">
      <div className="rothumb" style={{ background: bg }}><span style={{ fontSize: 26 }}>{em}</span></div>
      <div className="robody">
        <p className="roname">{name}</p>
        <div className="rostats">
          {likeable ? (
            <button className={`rolike ${liked ? 'on' : ''}`} onClick={() => setLiked(v => !v)} title="Like bosib ko'ring">
              <span className={liked ? 'hpop' : undefined} style={{ display: 'inline-block' }}>👍</span> {baseLikes + (liked ? 1 : 0)}%
            </button>
          ) : (
            <span>👍 {baseLikes}%</span>
          )}
          {players && <span>👥 {players}</span>}
        </div>
      </div>
    </div>
  );
};
// Terminal qatori
const TLine = ({ cmd, out, dim }) => (
  <div className="el-in" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 'clamp(11.5px,1.4vw,13px)', lineHeight: 1.7, color: dim ? CODE.comment : CODE.text }}>
    {cmd ? <><span style={{ color: CODE.str }}>$</span> <span style={{ color: CODE.text }}>{cmd}</span></> : out}
  </div>
);

// ===== SCREEN 0 — HOOK (bitta buyruq — butun loyiha: fayllar jonli paydo bo'ladi) =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const audio = useAudio([{ id: 's0', text: `Roblox Studio'da yangi o'yin boshlasangiz nima bo'ladi? Tayyor maydoncha keladi: yer, osmon, yorug'lik — hammasini noldan qurmaysiz. Sayt qurishda ham xuddi shunday yordamchi bor. Enter tugmasini bosing va kompyuteringizda nima paydo bo'lishini kuzating.`, trigger: 'on_mount', waits_for: { type: 'option_picked' } }]);
  const [phase, setPhase] = useState(storedAnswer ? 2 : 0); // 0 kutish, 1 ishlayapti, 2 tayyor
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const run = () => {
    if (phase > 0) return;
    setPhase(1);
    timer.current = setTimeout(() => setPhase(2), 1300);
  };
  // Fayl-panel: Enter'dan keyin birin-ketin "paydo bo'ladi"
  const TREE = [
    { d: 0, icon: '📁', label: 'robo-games', sub: 'loyihangiz' },
    { d: 1, icon: '📁', label: 'src' },
    { d: 2, icon: '⚛️', label: 'App.jsx', hot: true, sub: 'sizning kodingiz' },
    { d: 2, icon: '⚛️', label: 'main.jsx' },
    { d: 1, icon: '📄', label: 'index.html' },
    { d: 1, icon: '📦', label: 'package.json' }
  ];
  const OPTS = [
    { id: 'a', label: 'Internetdan tayyor saytni ko\'chirib oldi' },
    { id: 'b', label: 'Loyiha skeletini — barcha papka va fayllarni yaratdi' },
    { id: 'c', label: 'Kompyuterga o\'yin o\'rnatdi' }
  ];
  const pick = (v) => { if (picked !== null || phase < 2) return; setPicked(v); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: true }); audio.triggerEvent('option_picked'); };
  return (
    <Stage eyebrow="Kirish" screen={screen} audioState={audio} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 780 }}>Bitta tugma bilan <span className="italic" style={{ color: T.accent }}>butun loyiha</span> paydo bo'ladimi?</h1>
        <Mentor>Roblox Studio'da yangi o'yin boshlasangiz — <b style={{ color: T.ink }}>tayyor maydoncha</b> keladi: yer, osmon, yorug'lik. Hammasini noldan qurmaysiz-ku! Sayt qurishda ham shunday yordamchi bor. <b style={{ color: T.ink }}>Enter'ni bosing</b> — kompyuteringizda nima paydo bo'lishini kuzating.</Mentor>
        <Split>
          <Col>
            <div className="code-box fade-up delay-1" style={{ padding: '11px 14px' }}>
              <TLine cmd="npm create vite@latest robo-games" />
              {phase === 1 && <TLine out={<span style={{ color: CODE.attr }}>→ papka va fayllar yaratilmoqda…</span>} />}
              {phase >= 2 && <TLine out={<span style={{ color: CODE.str }}>✔ Tayyor! Pastga qarang —</span>} />}
            </div>
            {phase === 0 && <button className="btn fade-up delay-2" style={{ alignSelf: 'flex-start' }} onClick={run}>⏎ Enter — ishga tushirish</button>}
            <p className="flow-label fade-up delay-2" style={{ margin: 0 }}>Kompyuteringizda</p>
            <div className="frame fade-up delay-2" style={{ padding: '11px 14px', minHeight: 138 }}>
              {phase < 2 ? (
                <p style={{ color: T.ink3, fontStyle: 'italic', margin: 0, fontFamily: 'Georgia, serif', fontSize: 13, textAlign: 'center', paddingTop: 38 }}>{phase === 0 ? "Hozircha bo'sh — buyruqni ishga tushiring…" : 'yaratilmoqda…'}</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {TREE.map((f, i) => (
                    <div key={f.label} className="fade-up" style={{ animationDelay: `${i * 0.18}s`, display: 'flex', alignItems: 'center', gap: 8, padding: '4px 9px', paddingLeft: 9 + f.d * 20, borderRadius: 7, background: f.hot ? T.accentSoft : 'transparent', fontFamily: "'JetBrains Mono',monospace", fontSize: 12.5, color: T.ink }}>
                      <span>{f.icon}</span><span style={{ fontWeight: f.hot ? 700 : 500 }}>{f.label}</span>
                      {f.sub && <span style={{ marginLeft: 'auto', fontFamily: "'Manrope',sans-serif", fontSize: 10, color: f.hot ? T.accent : T.ink3, fontWeight: 600 }}>← {f.sub}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {phase === 2 && <span className="tagpill fade-up" style={{ color: T.success, animationDelay: '1.2s' }}>✓ 1 buyruq → butun loyiha skeleti</span>}
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Sizningcha, hozir nima yuz berdi?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => {
                const on = picked === o.id;
                return (
                  <button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null || phase < 2} style={{ opacity: phase < 2 ? 0.55 : 1 }} onClick={() => pick(o.id)}>
                    <span className="radio">{on && <span className="radio-dot" />}</span>
                    <span>{o.label}</span>
                  </button>
                );
              })}
            </div>
            {phase < 2 && <p className="small" style={{ color: T.ink3, fontStyle: 'italic', margin: 0 }}>Avval buyruqni ishga tushiring ←</p>}
            {picked !== null && <p className="hook-ack fade-step">Aynan shunday! Bu yordamchining nomi — <b>Vite</b> (talaffuzi: "vit", fransuzcha "tez"). Xuddi Roblox Studio'ning tayyor maydonchasiday: skelet tayyor — <b>ichini esa siz to'ldirasiz</b>. Bugun shu yerga birinchi komponentingizni yozasiz.</p>}
          </Col>
        </Split>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA (va'da: dars oxiridagi natija + bugungi 5 qadam) =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's1', text: `Va'da beraman: dars oxirida o'z loyihangizni noldan yaratib, mana shu o'yin kartochkasini kod bilan o'zingiz chaqirasiz — xuddi Roblox saytidagidek. Yo'limiz besh qadam: Vite, loyiha tuzilishi, JSX, birinchi komponent va props.`, trigger: 'on_mount', waits_for: null }]);
  const STEPS = [
    { text: 'Vite bilan loyiha yaratish', tag: 'npm create vite' },
    { text: 'Loyiha tuzilishi', tag: 'App.jsx · main.jsx' },
    { text: 'JSX — JS ichidagi HTML', tag: '{ } · className' },
    { text: 'Birinchi komponent', tag: '<GameCard />' },
    { text: "Props — ma'lumot uzatish", tag: 'name="Blox Fruits"' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const PreviewBlock = (
    <Col>
      <p className="flow-label">Dars oxirida — sizning natijangiz</p>
      <Win title="robo-games — localhost:5173" minH={110}>
        <div className="fade-up delay-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, maxWidth: 320 }}>
          <RoCard name="Blox Fruits" likeable />
          <RoCard name="Adopt Me!" likeable />
        </div>
      </Win>
      <pre className="code-box" style={{ padding: '10px 14px' }}><Jx>{'<GameCard '}</Jx><At>name</At>=<St>"Blox Fruits"</St><Jx>{' />'}</Jx></pre>
      <p className="mono small" style={{ color: T.accent, margin: 0 }}>→ mana shu qatorni dars oxirida to'liq o'zingiz yozasiz</p>
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
    <Stage eyebrow="Reja" screen={screen} audioState={audio} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Boshlaymiz →" onClick={onNext} /></>}>
      <div className="screen">
        <div className="head">
          <h2 className="title h-title fade-up">Roblox'dagiday o'yin kartochkasini <span className="italic" style={{ color: T.accent }}>o'zingiz</span> yasay olasizmi?</h2>
        </div>
        <Mentor>Va'da beraman: dars oxirida <b style={{ color: T.ink }}>o'z loyihangizni noldan yaratib</b>, mana shu o'yin kartochkasini <b style={{ color: T.ink }}>kod bilan o'zingiz chaqirasiz</b> — xuddi Roblox saytidagidek. Kartochkalardagi 👍 ni bosib ko'ring — ular jonli!</Mentor>
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

// ===== SCREEN 2 — VITE SETUP (4 ta terminal qadam) =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's2', text: `Loyiha to'rt qadamda tug'iladi. Har bir buyruqni tartib bilan bosing va nima qilishini o'qing. Oxirgi buyruqdan keyin loyihangiz brauzerda ochiladi — localhost besh ming bir yuz yetmish uchda.`, trigger: 'on_mount', waits_for: null }]);
  const STEPS = [
    { cmd: 'npm create vite@latest robo-games', info: "Loyiha skeletini yaratadi — barcha papka va fayllar tayyor." },
    { cmd: 'cd robo-games', info: "Loyiha papkasining ichiga kiramiz." },
    { cmd: 'npm install', info: "Kerakli kutubxonalarni — shu jumladan React'ning o'zini — yuklab oladi (node_modules)." },
    { cmd: 'npm run dev', info: "Loyihani kompyuteringizda ishga tushiradi. Manzil: localhost:5173." }
  ];
  const [step, setStep] = useState(storedAnswer ? 4 : 0);
  const [count, setCount] = useState(0);
  const done = step >= 4;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="O'rnatish" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Qadamlar: ${step}/4`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Loyiha <span className="italic" style={{ color: T.accent }}>to'rt qadamda</span> tug'iladimi?</h2></div>
        <Mentor>Har bir buyruqni <b style={{ color: T.ink }}>tartib bilan</b> bosing va nima qilishini o'qing. Oxirgi buyruqdan keyin loyihangiz brauzerda ochiladi — <span className="mono">localhost:5173</span>. Bu manzil — <b style={{ color: T.ink }}>o'z kompyuteringiz</b>, internet emas.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">Terminal — buyruqlarni bosing</p>
            <div className="code-box fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {STEPS.map((s, i) => (
                <div key={i} onClick={() => { if (i === step) setStep(v => v + 1); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 9px', borderRadius: 7, cursor: i === step ? 'pointer' : 'default', background: i < step ? 'rgba(31,122,77,0.16)' : (i === step ? 'rgba(255,79,40,0.14)' : 'transparent'), boxShadow: i === step ? `inset 0 0 0 1px ${T.accent}` : 'none', opacity: i > step ? 0.4 : 1, transition: 'all 0.2s' }}>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: i < step ? CODE.str : CODE.comment, minWidth: 14 }}>{i < step ? '✓' : i + 1}</span>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 'clamp(11.5px,1.4vw,13px)', color: CODE.text }}><span style={{ color: CODE.str }}>$</span> {s.cmd}</span>
                  {i === step && <span style={{ marginLeft: 'auto', fontFamily: "'Manrope',sans-serif", fontSize: 10, color: CODE.attr, whiteSpace: 'nowrap' }}>← bosing</span>}
                </div>
              ))}
            </div>
            {step > 0 && <div className="hint fade-step" key={step}><p className="body" style={{ margin: 0, color: T.ink2 }}>{STEPS[step - 1].info}</p></div>}
          </Col>
          <Col>
            <p className="flow-label">Natija — brauzeringizda</p>
            {done ? (
              <Win title="localhost:5173" minH={120}>
                <div className="fade-step" style={{ textAlign: 'center', padding: '8px 0' }}>
                  <p style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: 16, color: T.ink, margin: '0 0 4px' }}>Vite + React</p>
                  <p className="small" style={{ color: T.ink3, margin: '0 0 10px' }}>Loyihangiz ishlayapti!</p>
                  <button className="likebtn" onClick={() => setCount(c => c + 1)}>count is {count}</button>
                  <p className="small" style={{ color: T.ink3, margin: '10px 0 0', fontStyle: 'italic' }}>↑ Vite'ning tayyor tugmasi — bosib ko'ring. Buni keyingi darsda o'zingiz yasaysiz!</p>
                </div>
              </Win>
            ) : (
              <div className="frame-dash" style={{ minHeight: 120, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>4 qadamni bajaring — sayt shu yerda ochiladi</p></div>
            )}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}><span className="mono">localhost:5173</span> — saytingizning <b>kompyuteringizdagi</b> manzili. Hali internetda emas — faqat siz ko'rasiz. Xuddi Roblox Studio'da hali e'lon qilinmagan o'yiningizday!</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — LOYIHA TUZILISHI (fayl daraxti) =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's3', text: `Vite yaratgan papkani ochsak, bir nechta fayl bor. Qo'rqmang — sizga faqat to'rttasi kerak. Har bir faylni bosib, vazifasini bilib oling. Eng muhimi — App.jsx: siz ishlaydigan joy.`, trigger: 'on_mount', waits_for: null }]);
  const FILES = {
    pkg: { label: 'package.json', icon: '📦', info: "Loyiha pasporti: nomi, buyruqlar (dev, build) va kerakli kutubxonalar ro'yxati shu yerda yoziladi." },
    html: { label: 'index.html', icon: '📄', info: <>Saytning yagona HTML fayli. Ichida bo'sh <span className="mono">{'<div id="root">'}</span> bor — React butun saytni shu yerga chizadi.</> },
    main: { label: 'src/main.jsx', icon: '🔌', info: <>Kirish nuqtasi: <span className="mono">App</span> komponentini olib, <span className="mono">root</span> ichiga ulaydi. Bir marta yozilgan — unga tegmaysiz.</> },
    app: { label: 'src/App.jsx', icon: '⭐', info: "Bosh komponent — SIZ ishlaydigan joy! Birinchi kodingizni aynan shu faylga yozasiz." }
  };
  const KEYS = ['pkg', 'html', 'main', 'app'];
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(storedAnswer ? new Set(KEYS) : new Set());
  const done = seen.size >= 4;
  const tap = (k) => { setActive(k); setSeen(prev => { const s = new Set(prev); s.add(k); return s; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const Row = ({ k, depth }) => (
    <button onClick={() => tap(k)} className="fade-up" style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left', border: 'none', cursor: 'pointer', borderRadius: 8, padding: '8px 11px', paddingLeft: 11 + depth * 18, fontFamily: "'JetBrains Mono',monospace", fontSize: 'clamp(12px,1.5vw,13.5px)', background: active === k ? T.accentSoft : T.paper, boxShadow: seen.has(k) ? `inset 0 0 0 1.5px ${active === k ? T.accent : T.success}` : `0 3px 9px -4px rgba(${T.shadowBase},0.14)`, color: T.ink, transition: 'all 0.18s' }}>
      <span>{FILES[k].icon}</span><span>{FILES[k].label}</span>
      {seen.has(k) && <span style={{ marginLeft: 'auto', color: T.success, fontSize: 11 }}>✓</span>}
    </button>
  );
  return (
    <Stage eyebrow="Loyiha tuzilishi" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/4 fayl ko'rildi`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bu fayllarning qaysi biri <span className="italic" style={{ color: T.accent }}>sizniki</span>?</h2></div>
        <Mentor>Vite yaratgan papkada bir nechta fayl bor. Qo'rqmang — sizga faqat <b style={{ color: T.ink }}>to'rttasi</b> kerak. Har birini bosib, vazifasini bilib oling. Eng muhimi — <span className="mono">App.jsx</span>: <b style={{ color: T.ink }}>siz ishlaydigan joy</b>.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">robo-games/ papkasi</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: T.ink3, padding: '2px 11px' }}>📁 robo-games/</div>
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: T.ink3, padding: '2px 11px', paddingLeft: 29, opacity: 0.6 }}>📁 node_modules/ <span style={{ fontSize: 10 }}>(kutubxonalar — tegmaymiz)</span></div>
              <Row k="pkg" depth={1} />
              <Row k="html" depth={1} />
              <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: 12, color: T.ink3, padding: '2px 11px', paddingLeft: 29 }}>📁 src/</div>
              <Row k="main" depth={2} />
              <Row k="app" depth={2} />
            </div>
          </Col>
          <Col>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <p className="flow-label" style={{ margin: 0 }}>Fayl nima qiladi?</p>
              <span className="small mono" style={{ color: done ? T.success : T.ink3 }}>{seen.size} / 4</span>
            </div>
            {active ? (
              <div className="sk-info" key={active}>
                <span className="sk-tagbig"><span style={{ fontSize: 22 }}>{FILES[active].icon}</span><span className="sk-wordbadge">{FILES[active].label}</span></span>
                <p className="body" style={{ color: T.ink, margin: '11px 0 0' }}>{FILES[active].info}</p>
              </div>
            ) : (
              <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Chapdan faylni bosing</p></div>
            )}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Yo'l aniq: <span className="mono">index.html</span> → <span className="mono">main.jsx</span> → <span className="mono">App.jsx</span>. Bugun butun ishimiz — <b>App.jsx</b> ichida.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 (npm run dev) =====
const Screen4 = (props) => (
  <QuestionScreen {...props} idx={4} scope="module-mikro" eyebrow="Mashq · 1-savol"
    audioText="npm run dev buyrug'i nima qiladi? To'g'ri javobni tanlang."
    questionText="npm run dev buyrug'i nima qiladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}><span className="mono" style={{ color: T.accent }}>npm run dev</span> buyrug'i nima qiladi?</h2></>}
    options={['Saytni internetga chiqaradi', "Loyihani kompyuteringizda ishga tushiradi — localhost'da", 'Koddagi xatolarni avtomatik tuzatadi', "React'ni o'chirib tashlaydi"]} correctIdx={1}
    explainCorrect="To'g'ri! npm run dev loyihani localhost:5173 manzilida ishga tushiradi — faqat sizning kompyuteringizda. Internetga chiqarish — boshqa jarayon (deploy, esingizdami?)."
    explainWrong={{
      0: "Yo'q — internetga chiqarish deploy deyiladi (Git darsida ko'rganmiz). dev — faqat kompyuteringizda ishga tushiradi.",
      2: "Yo'q — xatolarni tuzatish dasturchining (ya'ni sizning) ishingiz. dev faqat loyihani ishga tushiradi.",
      3: "Aksincha! dev loyihani jonlantiradi — React ishlay boshlaydi.",
      default: "npm run dev — loyihani localhost'da ishga tushiradi."
    }} />
);

// ===== SCREEN 5 — JSX (3 qoida) =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's5', text: `App.jsx'ni ochsak, g'alati kod ko'ramiz: JavaScript ichida HTML teglar! Bu JSX deyiladi — React'ning maxsus yozuvi. U HTML'ga juda o'xshaydi, lekin uchta farqli qoidasi bor. Har birini bosib o'rganing.`, trigger: 'on_mount', waits_for: null }]);
  const RULES = {
    curly: {
      chip: '{ } — jingalak qavs', word: 'JS ichida',
      info: "Jingalak qavs ichida JavaScript ishlaydi: o'zgaruvchi, hisob-kitob — hammasi. HTML'da bunday imkon yo'q edi!",
      code: <><Jx>{'<h3>'}</Jx>{'{'}<At>nom</At>{'}'}<Jx>{'</h3>'}</Jx></>,
      result: <>Agar <span className="mono">nom = "Blox Fruits"</span> bo'lsa → ekranda: <b>Blox Fruits</b></>
    },
    cls: {
      chip: 'className', word: 'class emas',
      info: <>HTML'dagi <span className="mono">class</span> JSX'da <span className="mono">className</span> deb yoziladi — chunki <span className="mono">class</span> so'zi JavaScript'da band (u bilan boshqa narsa yasaladi).</>,
      code: <><Jx>{'<div '}</Jx><At>className</At>=<St>"card"</St><Jx>{'>'}</Jx></>,
      result: <>HTML'da: <span className="mono">class="card"</span> · JSX'da: <span className="mono">className="card"</span></>
    },
    wrap: {
      chip: "Bitta o'rama", word: 'yagona ildiz',
      info: "Komponent faqat BITTA tashqi teg qaytaradi. Ikkita yonma-yon teg kerakmi? Ularni bitta <div> ichiga o'rang.",
      code: <><Jx>{'<div>'}</Jx>{' '}<Cm>{'// hammasi shu o’rama ichida'}</Cm>{'\n'}{'  '}<Jx>{'<h3>'}</Jx>…<Jx>{'</h3>'}</Jx>{'\n'}{'  '}<Jx>{'<p>'}</Jx>…<Jx>{'</p>'}</Jx>{'\n'}<Jx>{'</div>'}</Jx></>,
      result: <>2 ta teg — lekin tashqarida <b>bitta</b> o'rama <span className="mono">{'<div>'}</span></>
    }
  };
  const KEYS = ['curly', 'cls', 'wrap'];
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(storedAnswer ? new Set(KEYS) : new Set());
  const done = seen.size >= 3;
  const tap = (k) => { setActive(k); setSeen(prev => { const s = new Set(prev); s.add(k); return s; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="JSX" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/3 qoida o'rganildi`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bu HTML'mi yoki <span className="italic" style={{ color: T.accent }}>JavaScript'mi</span>?</h2></div>
        <Mentor>Ikkalasi ham! <span className="mono">App.jsx</span> ichida <b style={{ color: T.ink }}>JavaScript ichida HTML teglar</b> yoziladi — bu <b style={{ color: T.ink }}>JSX</b> deyiladi. HTML'ga juda o'xshaydi, lekin <b style={{ color: T.ink }}>3 ta farqli qoidasi</b> bor. Har birini bosib o'rganing.</Mentor>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {KEYS.map(k => (
                <button key={k} className={`chip ${active === k ? 'chip-on' : ''}`} onClick={() => tap(k)}>{RULES[k].chip} {seen.has(k) ? '✓' : ''}</button>
              ))}
            </div>
            {active ? (
              <pre className="code-box fade-step" key={active} style={{ minHeight: 70 }}>{RULES[active].code}</pre>
            ) : (
              <pre className="code-box fade-up delay-2" style={{ minHeight: 70 }}>
                <Cm>{'// App.jsx — JS ichida HTML?!'}</Cm>{'\n'}
                <Jx>{'function'}</Jx>{' App() {'}{'\n'}
                {'  '}<Jx>{'return'}</Jx>{' '}<Jx>{'<h1>'}</Jx>{'Salom!'}<Jx>{'</h1>'}</Jx>{';'}{'\n'}
                {'}'}
              </pre>
            )}
          </Col>
          <Col>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <p className="flow-label" style={{ margin: 0 }}>Qoida nima deydi?</p>
              <span className="small mono" style={{ color: done ? T.success : T.ink3 }}>{seen.size} / 3</span>
            </div>
            {active ? (
              <div className="sk-info" key={active}>
                <span className="sk-tagbig"><span className="sk-wordbadge">{RULES[active].word}</span></span>
                <p className="body" style={{ color: T.ink, margin: '11px 0 0' }}>{RULES[active].info}</p>
                <div className="hint" style={{ marginTop: 10 }}><p className="small" style={{ margin: 0, color: T.ink2 }}>{RULES[active].result}</p></div>
              </div>
            ) : (
              <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Chapdan qoidani tanlang</p></div>
            )}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>JSX = HTML ko'rinishli JavaScript. 3 qoida: <b>{'{ }'} ichida JS</b> · <b>className</b> · <b>bitta o'rama</b>. Shu uchtasi bilan deyarli hamma JSX o'qiladi!</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 5b — TEST 2 (className) =====
const Screen5b = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Tekshiruv"
    audioText="JSX'da nima uchun class o'rniga className yoziladi? To'g'ri javobni tanlang."
    questionText="JSX'da nima uchun class o'rniga className yoziladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Mustahkamlash</p><h2 className="title h-sub" style={{ marginTop: 8 }}>JSX'da nima uchun <span className="mono" style={{ color: T.accent }}>className</span> yoziladi?</h2></>}
    options={["Chunki class so'zi JavaScript'da band — JSX esa JavaScript ichida yashaydi", 'Chunki className chiroyliroq eshitiladi', "Chunki HTML'da class degan so'z yo'q", 'Farqi yo\'q — ikkalasi ham ishlayveradi']} correctIdx={0}
    explainCorrect="To'g'ri! JSX — JavaScript ichida, class esa JS'ning band so'zi. Shuning uchun React className'ni tanlagan."
    explainWrong={{
      1: "Yo'q — gap chiroyda emas. class so'zi JavaScript'da band, JSX esa JS ichida yashaydi.",
      2: "Aksincha — HTML'da aynan class ishlatiladi. JSX JavaScript ichida bo'lgani uchun className kerak.",
      3: "Farqi bor: JSX'da class yozsangiz, React ogohlantirish beradi — to'g'risi className.",
      default: "class — JavaScript'ning band so'zi, shuning uchun JSX'da className."
    }} />
);

// ===== SCREEN 6 — KOMPONENT ANATOMIYASI =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's6', text: `Mana birinchi komponentingiz — GameCard. U oddiy JavaScript funksiyasi, siz funksiyalarni yaxshi bilasiz! Faqat ikki farqi bor: nomi katta harf bilan boshlanadi va JSX qaytaradi. O'ngdagi kartochkaga qarang — bu kod aynan shuni chizadi. Koddagi uch qismni bosib o'rganing.`, trigger: 'on_mount', waits_for: null }]);
  const PARTS = {
    name: { word: 'Katta harf!', info: <>Komponent nomi <b>Katta harf</b> bilan boshlanadi: <span className="mono">GameCard</span>. React shundan biladi: bu oddiy teg emas — komponent! (Funksiyalarni JS darsidan bilasiz — bu o'sha funksiya.)</> },
    ret: { word: 'return', info: <>Funksiya JS darsida son yoki matn qaytarardi. Komponent esa <b>JSX qaytaradi</b> — ya'ni ekranda nima ko'rinishini.</> },
    jsx: { word: 'JSX — ko\'rinish', info: <>Qaytarilayotgan JSX — o'ngdagi kartochkaning ko'rinishi. E'tibor bering: <span className="mono">className</span> va bitta o'rama <span className="mono">{'<div>'}</span> — hozirgina o'rgangan qoidalar!</> }
  };
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(storedAnswer ? new Set(['name', 'ret', 'jsx']) : new Set());
  const done = seen.size >= 3;
  const tap = (k) => { setActive(k); setSeen(prev => { const s = new Set(prev); s.add(k); return s; }); };
  const lineStyle = (k) => ({ cursor: 'pointer', borderRadius: 6, padding: '2px 6px', margin: '0 -6px', display: 'inline-block', background: active === k ? 'rgba(255,79,40,0.18)' : (seen.has(k) ? 'rgba(31,122,77,0.13)' : 'transparent'), boxShadow: active === k ? `inset 0 0 0 1px ${T.accent}` : 'none', transition: 'all 0.18s' });
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Komponent" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/3 qism topildi`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Komponent ichida <span className="italic" style={{ color: T.accent }}>nima yashaydi</span>?</h2></div>
        <Mentor>Mana <b style={{ color: T.ink }}>birinchi komponentingiz</b> — <span className="mono">GameCard</span>. Aslida u oddiy <b style={{ color: T.ink }}>JavaScript funksiyasi</b> — funksiyalarni yaxshi bilasiz! Faqat 2 farq: <b style={{ color: T.ink }}>nomi Katta harf</b> bilan, va <b style={{ color: T.ink }}>JSX qaytaradi</b>. O'ngdagi kartochka — shu kodning natijasi. Koddagi 3 qismni bosing.</Mentor>
        <div className="split">
          <Col>
            <pre className="code-box fade-up delay-1" style={{ lineHeight: 1.9 }}>
              <span style={lineStyle('name')} onClick={() => tap('name')}><Jx>{'function'}</Jx> <At>GameCard</At>{'() {'}</span>{'\n'}
              {'  '}<span style={lineStyle('ret')} onClick={() => tap('ret')}><Jx>{'return'}</Jx>{' ('}</span>{'\n'}
              <span style={lineStyle('jsx')} onClick={() => tap('jsx')}>{'    '}<Jx>{'<div '}</Jx><At>className</At>=<St>"card"</St><Jx>{'>'}</Jx>{'\n'}{'      '}<Jx>{'<h3>'}</Jx>Adopt Me!<Jx>{'</h3>'}</Jx>{'\n'}{'      '}<Jx>{'<p>'}</Jx>👍 92%<Jx>{'</p>'}</Jx>{'\n'}{'    '}<Jx>{'</div>'}</Jx></span>{'\n'}
              {'  );'}{'\n'}
              {'}'}
            </pre>
          </Col>
          <Col>
            <p className="flow-label">Bu kod chizadigan kartochka</p>
            <div className="fade-up delay-2" style={{ maxWidth: 160 }}><RoCard name="Adopt Me!" /></div>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <p className="flow-label" style={{ margin: 0 }}>Qismlar</p>
              <span className="small mono" style={{ color: done ? T.success : T.ink3 }}>{seen.size} / 3 topildi</span>
            </div>
            {active ? (
              <div className="sk-info" key={active}>
                <span className="sk-tagbig"><span className="sk-wordbadge">{PARTS[active].word}</span></span>
                <p className="body" style={{ color: T.ink, margin: '11px 0 0' }}>{PARTS[active].info}</p>
              </div>
            ) : (
              <div className="frame-dash" style={{ padding: '10px 14px' }}><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Koddan bir qismni bosing</p></div>
            )}
            {done && (
              <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Komponent = <b>Katta harfli funksiya + return JSX</b>. Tamom — butun formula shu!</p></div>
            )}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — KOMPONENTNI CHAQIRISH =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's7', text: `Komponent yozildi — lekin ekranda hali ko'rinmaydi! Uni chaqirish kerak: App ichida xuddi teg kabi yozasiz. Qo'shib ko'ring — va e'tibor bering, har chaqiruv bir xil kartochka chiqaradi.`, trigger: 'on_mount', waits_for: null }]);
  const [n, setN] = useState(storedAnswer ? 2 : 0);
  const done = n >= 2;
  const add = () => setN(v => Math.min(v + 1, 4));
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Chaqirish" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `Kamida 2 marta chaqiring (${n}/2)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Yozdik — endi qanday <span className="italic" style={{ color: T.accent }}>ekranga chiqaramiz</span>?</h2></div>
        <Mentor>Komponent yozildi, lekin ekranda <b style={{ color: T.ink }}>hali ko'rinmaydi</b>! Uni <b style={{ color: T.ink }}>chaqirish</b> kerak: <span className="mono">App</span> ichida xuddi teg kabi — <span className="mono">{'<GameCard />'}</span>. Qo'shib ko'ring — har chaqiruvda saytda yangi kartochka paydo bo'ladi.</Mentor>
        <div className="split">
          <Col>
            <button className="btn fade-up delay-1" style={{ alignSelf: 'flex-start' }} onClick={add} disabled={n >= 4}>+ {'<GameCard />'} chaqirish</button>
            <pre className="code-box fade-up delay-2">
              <Jx>{'function'}</Jx>{' App() {'}{'\n'}
              {'  '}<Jx>{'return'}</Jx>{' ('}{'\n'}
              {'    '}<Jx>{'<div>'}</Jx>{'\n'}
              {n === 0
                ? <>{'      '}<Cm>{'// hozircha bo’sh…'}</Cm>{'\n'}</>
                : Array.from({ length: n }, (_, i) => <React.Fragment key={i}>{'      '}<Jx>{'<GameCard />'}</Jx>{'\n'}</React.Fragment>)}
              {'    '}<Jx>{'</div>'}</Jx>{'\n'}
              {'  );'}{'\n'}
              {'}'}
            </pre>
          </Col>
          <Col>
            <p className="flow-label">localhost:5173</p>
            <Win title="robo-games — localhost:5173" minH={120}>
              {n === 0
                ? <p style={{ color: T.ink3, fontStyle: 'italic', margin: 0, fontFamily: 'Georgia, serif', fontSize: 13 }}>Bo'sh sahifa — komponent chaqirilmagan…</p>
                : <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>{Array.from({ length: n }, (_, i) => <RoCard key={i} name="Adopt Me!" />)}</div>}
            </Win>
            {done && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Ishladi! Lekin bir muammo bor: hamma kartochka <b>bir xil — Adopt Me!</b>. Blox Fruits va Brookhaven qani? Keyingi ekranda yechamiz.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — PROPS KIRISH =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's8', text: `Mana yechim: komponentga ma'lumot uzatamiz — xuddi tegga atribut yozganday. Bu props deyiladi. O'yin nomlarini bosib ko'ring: komponent bitta, ma'lumot har xil!`, trigger: 'on_mount', waits_for: null }]);
  const NAMES = ['Adopt Me!', 'Blox Fruits', 'Brookhaven'];
  const [cards, setCards] = useState(storedAnswer ? ['Adopt Me!', 'Blox Fruits'] : ['Adopt Me!']);
  const [tried, setTried] = useState(storedAnswer ? new Set(['Adopt Me!', 'Blox Fruits']) : new Set(['Adopt Me!']));
  const done = tried.size >= 3;
  const add = (nm) => {
    setCards(prev => (prev.length >= 4 ? prev : [...prev, nm]));
    setTried(prev => { const s = new Set(prev); s.add(nm); return s; });
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Props" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `3 xil nom sinang (${tried.size}/3)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bitta komponent — <span className="italic" style={{ color: T.accent }}>har xil ma'lumot</span>. Qanday?</h2></div>
        <Mentor>Yechim — <b style={{ color: T.ink }}>props</b>: komponentga ma'lumot uzatish, xuddi tegga atribut yozganday: <span className="mono">{'<GameCard name="Blox Fruits" />'}</span>. Nomlarni bosib ko'ring: <b style={{ color: T.ink }}>komponent bitta, ma'lumot har xil</b>!</Mentor>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {NAMES.map(nm => <button key={nm} className={`chip ${tried.has(nm) ? 'chip-on' : ''}`} disabled={cards.length >= 4 && !tried.has(nm)} onClick={() => add(nm)}>+ name="{nm}" {tried.has(nm) ? '✓' : ''}</button>)}
              {cards.length > 1 && <button className="gchip" onClick={() => { setCards(['Adopt Me!']); }}>↺ Tozalash</button>}
            </div>
            <pre className="code-box fade-up delay-2">
              <Cm>{'// App ichida:'}</Cm>{'\n'}
              {cards.map((nm, i) => <React.Fragment key={i}><Jx>{'<GameCard '}</Jx><At>name</At>=<St>"{nm}"</St><Jx>{' />'}</Jx>{'\n'}</React.Fragment>)}
            </pre>
            <span className="tagpill fade-step" key={cards.length} style={{ color: T.success }}>Komponent kodi: 1 dona · chaqiruv: {cards.length} ta</span>
          </Col>
          <Col>
            <p className="flow-label">localhost:5173</p>
            <Win title="robo-games — localhost:5173" minH={120}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
                {cards.map((nm, i) => <RoCard key={`${nm}-${i}`} name={nm} />)}
              </div>
            </Win>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}><b>Props</b> — komponentga uzatiladigan ma'lumot. Kartochkalar har xil bo'ldi, kod esa bitta. 1-darsdagi va'da bajarildi: <b>bir marta yoz — ming marta ishlat</b>!</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 9 — TEST 3 (props nima?) =====
const Screen9 = (props) => (
  <QuestionScreen {...props} idx={9} scope="module-mikro" eyebrow="Mashq · 3-savol"
    audioText="Props nima? To'g'ri javobni tanlang."
    questionText="Props nima?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}><span className="italic" style={{ color: T.accent }}>Props</span> nima?</h2></>}
    options={["Komponentga tashqaridan uzatiladigan ma'lumot", 'Komponentning rangi', "React'ni tezlashtiruvchi sozlama", 'Brauzer kengaytmasi']} correctIdx={0}
    explainCorrect="To'g'ri! Props — komponentga uzatiladigan ma'lumot: <GameCard name='Blox Fruits' />. Komponent bitta, ma'lumot har xil."
    explainWrong={{
      1: "Yo'q — rang emas. Props orqali istalgan ma'lumot uzatiladi: nom, rasm, son…",
      2: "Yo'q — tezlikka aloqasi yo'q. Props — komponentga ma'lumot uzatish usuli.",
      3: "Yo'q — brauzerga aloqasi yo'q. Props — <GameCard name='…' /> dagi name kabi ma'lumot.",
      default: "Props — komponentga tashqaridan uzatiladigan ma'lumot."
    }} />
);

// ===== SCREEN 10 — MA'LUMOT YO'LI (props oqimi) =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's10', text: `Savol tug'iladi: name teng Blox Fruits deb yozdik — bu ma'lumot komponent ichiga qanday yetib boradi? Tugmani bosib, ma'lumotning uch qadamlik yo'lini kuzating.`, trigger: 'on_mount', waits_for: null }]);
  const [phase, setPhase] = useState(storedAnswer ? 3 : 0);
  const [running, setRunning] = useState(false);
  const timer = useRef(null);
  const done = phase >= 3;
  useEffect(() => () => clearTimeout(timer.current), []);
  const run = () => {
    clearTimeout(timer.current); setRunning(true); setPhase(1);
    timer.current = setTimeout(() => {
      setPhase(2);
      timer.current = setTimeout(() => { setPhase(3); setRunning(false); }, 1100);
    }, 1100);
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const STEPS = ['Chaqiruvda yoziladi: name="Blox Fruits"', "Komponent uni props orqali qabul qiladi", "JSX ichida {props.name} bo'lib chiqadi"];
  return (
    <Stage eyebrow="Ma'lumot yo'li" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Yo'lni kuzating"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">name="Blox Fruits" komponent ichiga <span className="italic" style={{ color: T.accent }}>qanday yetib boradi</span>?</h2></div>
        <Mentor>Ma'lumot <b style={{ color: T.ink }}>3 qadamlik yo'l</b> bosadi: chaqiruvdagi atribut → <span className="mono">props</span> qutisi → JSX ichidagi <span className="mono">{'{props.name}'}</span>. Tugmani bosib kuzating.</Mentor>
        <div className="split">
          <Col>
            <button className="btn fade-up delay-1" style={{ alignSelf: 'flex-start' }} onClick={run} disabled={running}>{running ? 'Ishlayapti…' : (done ? "↻ Yana ko'rsatish" : "▶ Ma'lumot yo'lini kuzating")}</button>
            <div className="fade-up delay-2" style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {STEPS.map((s, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 13px', borderRadius: 11, background: phase > i ? T.successSoft : T.bg, opacity: phase > i ? 1 : 0.55, transition: 'all 0.4s' }}>
                  <span style={{ fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 12, color: phase > i ? T.success : T.ink3, minWidth: 16 }}>{phase > i ? '✓' : i + 1}</span>
                  <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 13.5, color: phase > i ? T.ink : T.ink2 }}>{s}</span>
                </div>
              ))}
            </div>
          </Col>
          <Col>
            <p className="flow-label">Kod ichida</p>
            <pre className="code-box fade-up delay-2" style={{ lineHeight: 1.9 }}>
              <span style={{ borderRadius: 5, padding: '1px 4px', background: phase === 1 ? 'rgba(255,79,40,0.22)' : 'transparent', boxShadow: phase === 1 ? `inset 0 0 0 1px ${T.accent}` : 'none', transition: 'all 0.3s' }}><Jx>{'<GameCard '}</Jx><At>name</At>=<St>"Blox Fruits"</St><Jx>{' />'}</Jx></span>{'\n\n'}
              <span style={{ borderRadius: 5, padding: '1px 4px', background: phase === 2 ? 'rgba(255,79,40,0.22)' : 'transparent', boxShadow: phase === 2 ? `inset 0 0 0 1px ${T.accent}` : 'none', transition: 'all 0.3s' }}><Jx>{'function'}</Jx> <At>GameCard</At>{'('}<At>props</At>{') {'}</span>{'\n'}
              {'  '}<Jx>{'return'}</Jx>{' '}<span style={{ borderRadius: 5, padding: '1px 4px', background: phase === 3 ? 'rgba(31,122,77,0.25)' : 'transparent', boxShadow: phase === 3 ? `inset 0 0 0 1px ${T.success}` : 'none', transition: 'all 0.3s' }}><Jx>{'<h3>'}</Jx>{'{'}<At>props.name</At>{'}'}<Jx>{'</h3>'}</Jx></span>{';'}{'\n'}
              {'}'}
            </pre>
            <p className="flow-label" style={{ marginTop: 2 }}>Ekranda</p>
            <Win title="localhost:5173" minH={56}>
              {phase >= 3
                ? <div className="fade-step" style={{ maxWidth: 160 }}><RoCard name="Blox Fruits" /></div>
                : <p style={{ color: T.ink3, fontStyle: 'italic', margin: 0, fontFamily: 'Georgia, serif', fontSize: 13 }}>kutilmoqda…</p>}
            </Win>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Yo'l aniq: <span className="mono">name="Blox Fruits"</span> → <span className="mono">props</span> → <span className="mono">{'{props.name}'}</span> → ekranda <b>Blox Fruits</b>!</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — VIBECODING (AI agentga komponent buyurtma qilish) =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's11', text: `Prompt berishni praktika darslarida o'rgangansiz. Endi katta farq bor: siz React kodini o'qiy olasiz! AI agentga komponent buyurtma qiling: rejani tasdiqlang, keyin yozgan kodini o'zingiz tekshiring — props to'g'rimi, katta harf joyidami.`, trigger: 'on_mount', waits_for: null }]);
  const TASKS = [
    { id: 't1', label: "Kartochkaga o'yinchilar sonini qo'shib ber", plan: ["GameCard'ga players degan yangi props qo'shaman", "Kartochka pastida {props.players} chiqaraman"], code: <><Jx>{'<GameCard '}</Jx><At>name</At>=<St>"Adopt Me!"</St> <At>players</At>=<St>"402K"</St><Jx>{' />'}</Jx></> },
    { id: 't2', label: 'Saytga sarlavha komponenti yasab ber', plan: ['Header degan yangi komponent yozaman', "App boshida <Header /> deb chaqiraman"], code: <><Jx>{'function'}</Jx> <At>Header</At>{'() { '}<Jx>{'return'}</Jx> <Jx>{'<h1>'}</Jx>🎮 Robo Games<Jx>{'</h1>'}</Jx>{'; }'}</> },
    { id: 't3', label: 'Sayt pastiga footer yasab ber', plan: ['Footer degan yangi komponent yozaman', "App oxirida <Footer /> deb chaqiraman"], code: <><Jx>{'function'}</Jx> <At>Footer</At>{'() { '}<Jx>{'return'}</Jx> <Jx>{'<p>'}</Jx>© robo-games · 2026<Jx>{'</p>'}</Jx>{'; }'}</> }
  ];
  const [task, setTask] = useState(null);
  const [phase, setPhase] = useState(storedAnswer ? 'done' : 'idle'); // idle | planned | building | done
  const timer = useRef(null);
  const done = phase === 'done';
  useEffect(() => () => clearTimeout(timer.current), []);
  const choose = (id) => { clearTimeout(timer.current); setTask(id); setPhase('planned'); };
  const approve = () => { clearTimeout(timer.current); setPhase('building'); timer.current = setTimeout(() => setPhase('done'), 1300); };
  const cur = TASKS.find(t => t.id === task) || (storedAnswer ? TASKS[0] : null);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Keyingi qadam · AI" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : "Agent bilan ishlab ko'ring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Komponentni <span className="italic" style={{ color: T.accent }}>AI'ga buyurtma</span> qilsak-chi?</h2></div>
        <Mentor>Prompt berishni praktikada o'rgangansiz. Endi katta farq bor: siz <b style={{ color: T.ink }}>React kodini o'qiy olasiz</b>! Buyruq bering, agent rejasini <b style={{ color: T.ink }}>tasdiqlang</b>, keyin yozgan kodini <b style={{ color: T.ink }}>o'zingiz tekshiring</b>: props to'g'rimi, Katta harf joyidami. Boshliq — siz.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">1. Agentga so'z bilan ayting</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {TASKS.map(t => <button key={t.id} className={`chip ${task === t.id ? 'chip-on' : ''}`} onClick={() => choose(t.id)} style={{ justifyContent: 'flex-start', textAlign: 'left' }}>"{t.label}"</button>)}
            </div>
            {!cur && <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Yuqoridan bitta buyruqni tanlang</p></div>}
            {cur && (
              <div className="ai-card fade-step" key={task || 'stored'}>
                <div className="ai-row"><span className="ai-badge" style={{ background: T.ink }}>Agent</span><span className="ai-bubble">{phase === 'planned' ? 'Mana rejam — tasdiqlaysizmi?' : (phase === 'building' ? 'Yozyapman…' : 'Bajardim — kodni tekshiring')}</span></div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {cur.plan.map((p, i) => <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}><span style={{ color: phase === 'planned' ? T.ink3 : T.success }}>{phase === 'planned' ? '○' : '✓'}</span><span style={{ color: T.ink }}>{p}</span></div>)}
                </div>
                {phase === 'planned' && <button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={approve}>Rejani tasdiqlash</button>}
                {phase === 'building' && <p className="ai-prompt" style={{ color: T.accent }}>Kod yozilyapti…</p>}
                {phase === 'done' && <div className="ai-code fade-step"><div className="ai-line ok" style={{ cursor: 'default' }}>{cur.code}</div></div>}
              </div>
            )}
          </Col>
          <Col>
            <p className="flow-label">2. Natija — localhost:5173</p>
            <Win title="robo-games — localhost:5173" minH={130}>
              {done && cur ? (
                <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {cur.id === 't2' && <p style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 800, fontSize: 14, color: T.ink, margin: 0 }}>🎮 Robo Games <span className="mono small" style={{ color: T.success, fontWeight: 700 }}>+ yangi</span></p>}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9 }}>
                    <RoCard name="Adopt Me!" players={cur.id === 't1' ? '402K' : undefined} />
                    <RoCard name="Blox Fruits" players={cur.id === 't1' ? '750K' : undefined} />
                  </div>
                  {cur.id === 't1' && <span className="mono small" style={{ color: T.success, fontWeight: 700 }}>+ 👥 o'yinchilar soni props orqali keldi</span>}
                  {cur.id === 't3' && <p style={{ fontFamily: "'Manrope',sans-serif", fontSize: 10.5, color: T.ink3, margin: 0, textAlign: 'center' }}>© robo-games · 2026 <span className="mono" style={{ color: T.success, fontWeight: 700 }}>+ yangi</span></p>}
                </div>
              ) : (
                <p style={{ color: T.ink3, fontStyle: 'italic', margin: 0, fontFamily: 'Georgia, serif', fontSize: 13 }}>Buyruq bering va rejani tasdiqlang…</p>
              )}
            </Win>
            {done
              ? <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Agent kodini <b>o'qiy oldingizmi</b>? Komponent Katta harf bilan, props to'g'ri — siz buni endi <b>tekshira olasiz</b>. Aynan shu — vibecoding'dagi eng kuchli mahorat.</p></div>
              : <p className="body" style={{ margin: 0, color: T.ink3, fontSize: 13 }}>Natija shu yerda paydo bo'ladi — keyin uni o'zingiz tekshirasiz.</p>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — TEST 4 (Katta harf qoidasi) =====
const Screen12 = (props) => (
  <QuestionScreen {...props} idx={12} scope="module-mikro" eyebrow="Mashq · 4-savol"
    audioText="Nima uchun komponent nomi katta harf bilan boshlanadi? To'g'ri javobni tanlang."
    questionText="Nima uchun komponent nomi Katta harf bilan boshlanadi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Nima uchun komponent nomi <span className="italic" style={{ color: T.accent }}>Katta harf</span> bilan boshlanadi?</h2></>}
    options={['Shunchaki chiroyli ko\'rinishi uchun', "React katta harfdan komponentligini biladi — kichik harf oddiy HTML teg hisoblanadi", 'Katta harf kodni tezlashtiradi', "Klaviaturada shunday qulay"]} correctIdx={1}
    explainCorrect="To'g'ri! <gamecard /> deb yozsangiz, React uni oddiy HTML teg deb o'ylaydi va komponentingizni topa olmaydi. <GameCard /> — Katta harf — komponent!"
    explainWrong={{
      0: "Yo'q — bu chiroy uchun emas, qoida: React katta harfdan komponentligini ajratadi.",
      2: "Yo'q — tezlikka aloqasi yo'q. Katta harf — React uchun 'bu komponent' degan belgi.",
      3: "Yo'q — qulaylik emas, qoida: kichik harfli teg HTML deb qabul qilinadi.",
      default: "Katta harf — React uchun komponent belgisi; kichik harf — oddiy HTML teg."
    }} />
);

// ===== SCREEN 13 — AMALIYOT: O'Z KARTOCHKANGIZNI SOZLANG =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's13', text: `Endi o'zingiz boshqaring! Ikkita props bor: name va emoji. Qiymatlarni almashtirib, o'z o'yin kartochkangizni yasang. Kod qanday o'zgarishini kuzating — komponent esa bitta bo'lib qolaveradi.`, trigger: 'on_mount', waits_for: null }]);
  const EMOJIS = ['🐾', '🍇', '🏠', '🗼', '🐶', '🕵️'];
  const [nm, setNm] = useState('Adopt Me!');
  const [em, setEm] = useState('🐾');
  const [nmTried, setNmTried] = useState(storedAnswer ? new Set(['Adopt Me!', 'Blox Fruits']) : new Set(['Adopt Me!']));
  const [emTried, setEmTried] = useState(storedAnswer ? new Set(['🐾', '🍇']) : new Set(['🐾']));
  const done = nmTried.size >= 2 && emTried.size >= 2;
  const pickNm = (v) => { setNm(v); setNmTried(prev => { const s = new Set(prev); s.add(v); return s; }); };
  const pickEm = (v) => { setEm(v); setEmTried(prev => { const s = new Set(prev); s.add(v); return s; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Amaliyot · props" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkala props\'ni almashtiring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(8px,1.2vw,12px)' }}>
        <div className="head"><h2 className="title h-title fade-up">O'z kartochkangizni <span className="italic" style={{ color: T.accent }}>props bilan</span> sozlay olasizmi?</h2></div>
        <Mentor>Endi o'zingiz boshqaring! 2 ta props bor: <span className="mono">name</span> va <span className="mono">emoji</span>. Qiymatlarni almashtirib, o'z kartochkangizni yasang. <b style={{ color: T.ink }}>Kod qanday o'zgarishini kuzating</b> — komponent esa bitta bo'lib qolaveradi.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">name props</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {GAMES.map(g => <button key={g.name} className={`gchip ${nm === g.name ? 'chip-on' : ''}`} style={nm === g.name ? { background: T.accent, color: '#fff' } : undefined} onClick={() => pickNm(g.name)}>{g.name}</button>)}
            </div>
            <p className="flow-label" style={{ marginTop: 2 }}>emoji props</p>
            <div className="fade-up delay-2" style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
              {EMOJIS.map(e => <button key={e} className="gchip" style={em === e ? { background: T.accent } : undefined} onClick={() => pickEm(e)}>{e}</button>)}
            </div>
            <pre className="code-box fade-up delay-2">
              <Jx>{'<GameCard'}</Jx>{'\n'}
              {'  '}<At>name</At>=<St>"{nm}"</St>{'\n'}
              {'  '}<At>emoji</At>=<St>"{em}"</St>{'\n'}
              <Jx>{'/>'}</Jx>
            </pre>
          </Col>
          <Col>
            <p className="flow-label">Kartochkangiz</p>
            <Win title="robo-games — localhost:5173" minH={110}>
              <div style={{ maxWidth: 170 }}><RoCard key={`${nm}-${em}`} name={nm} emoji={em} likeable /></div>
            </Win>
            <span className="tagpill fade-step" style={{ color: done ? T.success : T.ink }}>{nmTried.size >= 2 ? '✓' : '○'} name almashtirildi · {emTried.size >= 2 ? '✓' : '○'} emoji almashtirildi</span>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Siz hozir <b>props bilan boshqardingiz</b>: ma'lumot o'zgardi — ko'rinish o'zgardi, kod esa bitta. Keyingi darsda kartochka <b>bosilganda ham o'zgaradigan</b> bo'ladi (state)!</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — DEBUGGING (class vs className) =====
const Screen14 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's14', text: `AI kod yozishda zo'r yordamchi — yangi GameCard komponentini bir zumda yozib berdi. Lekin odamlar ham, AI ham ba'zan kichik xato qiladi. Shuni topib tuzatish debugging deyiladi. Endi siz JSX qoidalarini bilasiz: kodda bitta qator qoidaga zid. Toping-chi.`, trigger: 'on_mount', waits_for: { type: 'error_found' } }]);
  const [picked, setPicked] = useState(storedAnswer ? 'cls' : null);
  const [fixed, setFixed] = useState(!!storedAnswer);
  const found = picked === 'cls';
  const done = fixed;
  const pickCls = () => {
    if (found) return; setPicked('cls'); audio.triggerEvent('error_found');
    if (!audio.muted) setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff(`Topdingiz! JSX'da class emas — className. Endi tuzatamiz.`); }, 300);
  };
  const fix = () => {
    setFixed(true);
    if (!audio.muted) setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff(`Tuzatildi! Mana, debugging shunday bo'ladi: xatoni topasiz va to'g'rilaysiz.`); }, 300);
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Debugging" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : (found ? 'Endi tuzating' : 'Xatoni toping')} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">AI yordam beradi — siz esa <span className="italic" style={{ color: T.accent }}>tekshirasiz</span>.</h2></div>
        <Mentor>AI kod yozishda <b style={{ color: T.ink }}>zo'r yordamchi</b> — yangi komponentni bir zumda yozib berdi. Lekin <b style={{ color: T.ink }}>odamlar ham, AI ham</b> ba'zan kichik xato qiladi. Shuni topib tuzatish — <b style={{ color: T.ink }}>debugging</b>, va bu eng zo'r mahorat. Endi siz JSX qoidalarini bilasiz: bitta qator qoidaga zid — toping-chi.</Mentor>
        <div className="split">
          <Col>
            <div className="ai-card fade-up delay-2">
              <div className="ai-row"><span className="ai-badge">AI</span><span className="ai-bubble">GameCard komponentini yozdim:</span></div>
              <div className="ai-code">
                <div className={`ai-line ${picked === 'fn' ? 'ok' : ''}`} onClick={() => { if (!found) setPicked('fn'); }}><Jx>{'function'}</Jx> <At>GameCard</At>{'(props) {'}</div>
                <div className={`ai-line ${picked === 'ret' ? 'ok' : ''}`} onClick={() => { if (!found) setPicked('ret'); }}>{'  '}<Jx>{'return'}</Jx>{' ('}</div>
                {!fixed ? (
                  <div className={`ai-line ${found ? 'bad' : ''}`} onClick={pickCls}>{'    '}<Jx>{'<div '}</Jx><At>class</At>=<St>"card"</St><Jx>{'>'}</Jx></div>
                ) : (
                  <div className="ai-line ok el-in">{'    '}<Jx>{'<div '}</Jx><At>className</At>=<St>"card"</St><Jx>{'>'}</Jx></div>
                )}
                <div className={`ai-line ${picked === 'h3' ? 'ok' : ''}`} onClick={() => { if (!found) setPicked('h3'); }}>{'      '}<Jx>{'<h3>'}</Jx>{'{'}<At>props.name</At>{'}'}<Jx>{'</h3>'}</Jx></div>
                <div className="ai-line" style={{ cursor: 'default' }}>{'    '}<Jx>{'</div>'}</Jx>{'  );'}{'\n'}{'}'}</div>
              </div>
              {!found && <p className="ai-prompt">Qaysi qator JSX qoidasiga zid? Bosing.</p>}
              {found && !fixed && <button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={fix}>🔧 className'ga almashtirish</button>}
              {fixed && <p className="ai-prompt" style={{ color: T.success, fontStyle: 'normal', fontWeight: 600 }}>✓ Tuzatildi — endi kod JSX qoidasiga mos!</p>}
            </div>
          </Col>
          <Col>
            {!found && (
              (picked === 'fn' || picked === 'ret' || picked === 'h3')
                ? <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bu qator to'g'ri{picked === 'fn' ? ' — Katta harf joyida' : picked === 'h3' ? <> — <span className="mono">{'{props.name}'}</span> jingalak qavsda, qoidaga mos</> : ''}. Yana qarang: JSX'da qaysi <b>so'z taqiqlangan</b> edi?</p></div>
                : <div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Endi siz JSX qoidalarini bilasiz — AI kodini <b style={{ color: T.ink }}>tekshira olasiz</b>. Eslang: JSX'da bitta so'z <b style={{ color: T.ink }}>band</b> edi…</p></div>
            )}
            {found && !fixed && <div className="frame-warn fade-step"><p className="note-h" style={{ color: T.accent }}>✓ Topdingiz!</p><p className="body" style={{ margin: 0, color: T.ink }}>JSX'da <span className="mono">class</span> yozib bo'lmaydi — u JavaScript'ning band so'zi. To'g'risi: <span className="mono">className</span>. Chapdagi tugma bilan tuzating →</p></div>}
            {fixed && (
              <>
                <div className="takeaway fade-step"><div className="ta-bulb">🛠️</div><p className="ta-h">Topdingiz va tuzatdingiz — bu debugging!</p><p className="ta-sub">AI tez yozadi, siz tekshirib tuzatasiz — zo'r jamoa</p></div>
                <Win title="localhost:5173"><div style={{ maxWidth: 160 }}><RoCard name="Adopt Me!" /></div></Win>
              </>
            )}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 15 — YAKUNIY (VS Code muhitida komponentni qo'lda chaqirish) =====
const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's15', text: `Oxirgi qadam — endi to'liq o'zingiz! Mana haqiqiy dasturchi muhiti: VS Code'da App.jsx ochiq, to'rtinchi qatorda komponent chaqiruvi yetishmayapti. GameCard'ni istalgan o'yin nomi bilan chaqirib yozing — yozishingiz bilan o'ngda kartochka jonlanadi.`, trigger: 'on_mount', waits_for: { type: 'typed_ok' } }]);
  const [value, setValue] = useState(storedAnswer?.picked || '');
  const [passed, setPassed] = useState(!!storedAnswer?.correct);
  const norm = value.replace(/\s+/g, ' ').trim();
  const m = norm.match(/^<\s*GameCard\s+name\s*=\s*"([^"]{2,20})"\s*\/\s*>$/);
  const inner = m ? m[1].trim() : '';
  const valid = !!inner;
  const hasComp = /<\s*GameCard\b/.test(value);
  const hasLowerComp = /<\s*gamecard\b/i.test(value) && !hasComp;
  const hasName = /name\s*=\s*"[^"]+"/.test(value);
  const hasClose = /\/\s*>\s*$/.test(value.trim());
  useEffect(() => {
    if (valid && !passed) {
      setPassed(true);
      onAnswer(screen, { stage: 'final', screenIdx: screen, question: "<GameCard name=\"...\" /> chaqiruvini yozing", studentAnswer: value, correct: true, firstAttemptCorrect: true, solved: true, picked: value });
      audio.triggerEvent('typed_ok');
      if (!audio.muted) setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff(`Zo'r! Birinchi komponent chaqiruvingizni xuddi haqiqiy dasturchiday yozdingiz.`); }, 300);
    }
  }, [valid]);
  const Ln = ({ n, children }) => (
    <div className="vsc-line"><span className="vsc-ln">{n}</span><span style={{ whiteSpace: 'pre' }}>{children}</span></div>
  );
  return (
    <Stage eyebrow="Yakuniy · amaliy" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!passed} label={passed ? 'Davom etish' : 'Chaqiruvni yozing'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Oxirgi qadam: komponentni <span className="italic" style={{ color: T.accent }}>o'zingiz</span> chaqiring.</h2></div>
        <Mentor>Mana <b style={{ color: T.ink }}>haqiqiy dasturchi muhiti</b> — VS Code'da <span className="mono">App.jsx</span> ochiq. 4-qatorda komponent chaqiruvi yetishmayapti: <b style={{ color: T.ink }}>{'<GameCard'}</b> + <b style={{ color: T.ink }}>name="…"</b> (istalgan o'yin nomi) + <b style={{ color: T.ink }}>{'/>'}</b> yozing. Yozishingiz bilan o'ngda kartochka jonlanadi.</Mentor>
        <div className="split">
          <Col>
            <div className="vsc fade-up delay-2">
              <div className="vsc-bar">
                <span className="vsc-tab on"><span style={{ color: '#61DAFB' }}>⚛</span> App.jsx <span style={{ color: '#6E7681', marginLeft: 4 }}>×</span></span>
                <span className="vsc-tab">main.jsx</span>
              </div>
              <div className="vsc-body">
                <Ln n={1}><Jx>{'function'}</Jx><span style={{ color: '#DCDCAA' }}> App</span>{'() {'}</Ln>
                <Ln n={2}>{'  '}<Jx>{'return'}</Jx>{' ('}</Ln>
                <Ln n={3}>{'    '}<Jx>{'<div>'}</Jx></Ln>
                <div className="vsc-line">
                  <span className="vsc-ln">4</span>
                  <span style={{ whiteSpace: 'pre' }}>{'      '}</span>
                  <input className={`vsc-input ${valid ? 'ok' : ''}`} value={value} onChange={e => setValue(e.target.value)} placeholder='<GameCard name="Blox Fruits" />' spellCheck={false} autoCapitalize="off" autoCorrect="off" />
                </div>
                <Ln n={5}>{'    '}<Jx>{'</div>'}</Jx></Ln>
                <Ln n={6}>{'  );'}</Ln>
                <Ln n={7}>{'}'}</Ln>
              </div>
            </div>
            <div className="fade-up delay-2" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="tagpill" style={{ opacity: hasComp ? 1 : 0.4 }}>{hasComp ? '✓' : '1'} {'<GameCard'} — Katta harf</span>
              <span className="tagpill" style={{ opacity: hasName ? 1 : 0.4 }}>{hasName ? '✓' : '2'} name="…" props</span>
              <span className="tagpill" style={{ opacity: hasClose ? 1 : 0.4 }}>{hasClose ? '✓' : '3'} {'/>'} yopilishi</span>
            </div>
            {hasLowerComp && <div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Esingizdami? Komponent nomi <b>Katta harf</b> bilan: <span className="mono">GameCard</span> — aks holda React uni HTML teg deb o'ylaydi.</p></div>}
            {passed && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Mukammal! Komponent + props — chaqiruvni to'liq o'zingiz yozdingiz. Bu endi sizning mahoratingiz.</p></div>}
          </Col>
          <Col>
            <p className="flow-label">natija — localhost:5173</p>
            <Win title="robo-games — localhost:5173" minH={130}>
              {valid
                ? <div key={inner} className="fade-step" style={{ maxWidth: 170 }}><RoCard name={inner} likeable /></div>
                : <p style={{ fontFamily: 'Georgia, serif', color: T.ink3, fontStyle: 'italic', margin: 0, textAlign: 'center', lineHeight: 1.5 }}>4-qatorni to'liq yozing: <span className="mono" style={{ fontStyle: 'normal' }}>{'<GameCard'}</span> + <span className="mono" style={{ fontStyle: 'normal' }}>name="…"</span> + <span className="mono" style={{ fontStyle: 'normal' }}>{'/>'}</span></p>}
            </Win>
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — YAKUN =====
const Screen16 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const audio = useAudio([{ id: 's16', text: "Tabriklaymiz — birinchi React komponentingiz tayyor! Esda saqlang: Vite loyihani bir buyruqda yaratadi, kod App.jsx'da yoziladi, JSX'da className va jingalak qavs ishlaydi, komponent katta harf bilan boshlanadi, props esa ma'lumot uzatadi. Keyingi darsda kartochkalarimiz jonlanadi: state va effect!", trigger: 'on_mount', waits_for: null }]);
  const RECAP = [
    "Vite — loyihani 1 buyruqda yaratadi: npm create vite@latest",
    "npm run dev — localhost:5173, faqat kompyuteringizda",
    "JSX — JS ichidagi HTML: { } ichida JS, class → className",
    "Komponent — Katta harfli funksiya, JSX qaytaradi",
    "Props — komponentga ma'lumot: <GameCard name=\"Blox Fruits\" />"
  ];
  const HOMEWORK = [
    { b: "O'rnatish", t: "— kompyuteringizda npm create vite@latest buyrug'i bilan loyiha yarating va npm run dev qiling" },
    { b: 'Birinchi komponent', t: "— App.jsx ichida OyinKartam komponentini yozib, <OyinKartam /> deb chaqiring" },
    { b: 'Props ovi', t: "— unga name props uzatib, sevimli 3 ta o'yiningiz kartochkasini chiqaring" }
  ];
  const GLOSSARY = [
    { b: 'Vite', t: "— loyiha skeletini yaratuvchi tez asbob" },
    { b: 'localhost:5173', t: "— loyihangizning kompyuteringizdagi manzili" },
    { b: 'App.jsx', t: "— bosh komponent, siz ishlaydigan fayl" },
    { b: 'JSX', t: "— JavaScript ichidagi HTML ko'rinishli yozuv" },
    { b: 'className', t: "— JSX'dagi class (class JS'da band so'z)" },
    { b: 'Komponent', t: "— Katta harfli funksiya + return JSX" },
    { b: 'Props', t: "— komponentga uzatiladigan ma'lumot" }
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
    <Stage eyebrow="Tayyor" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><button className="btn-ghost" onClick={onReset} style={{ padding: 'clamp(11px,1.6vw,13px) clamp(16px,2.2vw,22px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Qaytadan</button><button className="btn-white-accent" onClick={onFinish} style={{ marginLeft: 'auto', padding: 'clamp(11px,1.6vw,13px) clamp(22px,2.6vw,30px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Yakunlash ✓</button></>}>
      <div className="screen">
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">✓</span> Dars tugadi</span><h2 className="title h-title fade-up d1">Birinchi komponentingiz <span className="italic" style={{ color: T.accent }}>tayyor</span>.</h2><p className="body h-sub fade-up d2">{PASSED ? "Tabriklaymiz! Loyiha yaratdingiz, JSX o'rgandingiz va komponentni props bilan chaqirdingiz — xuddi haqiqiy dasturchiday." : "Yaxshi harakat! JSX qoidalari va props'ni mustahkamlash uchun bir-ikki ekranni qayta ko'ring."}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span className="tick" style={{ width: 16, height: 16, borderRadius: '50%', background: T.success, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck">✓</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>📝 Uyga vazifa</div><p className="body" style={{ margin: '0 0 10px', color: T.ink }}>Bugungi qadamlarni o'z kompyuteringizda takrorlang:</p><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">Keyingi darsda kartochkangiz jonlanadi: 👍 bosilganda son o'zi yangilanadi — bu State! 🚀</p></div>
        </div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">💡 Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT — ({ lang, onFinished })
export default function ReactFirstComponentLesson({ lang: langProp, onFinished }) {
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
        .btn-soft:disabled { opacity: 0.5; cursor: not-allowed; }

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
        .chip:disabled { opacity: 0.4; cursor: not-allowed; }
        .gchip { font-family: 'Manrope'; font-weight: 600; font-size: 12.5px; padding: 8px 13px; border-radius: 99px; border: none; background: ${T.paper}; color: ${T.ink}; cursor: pointer; transition: all 0.18s; box-shadow: 0 3px 10px -5px rgba(${T.shadowBase},0.2); display: inline-flex; align-items: center; gap: 6px; } .gchip:hover:not(:disabled) { transform: translateY(-1px); } .gchip:disabled { opacity: 0.4; cursor: not-allowed; }
        .tagpill { font-family: 'JetBrains Mono', monospace; font-size: 12.5px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 99px; background: ${T.paper}; color: ${T.ink}; box-shadow: 0 3px 10px -5px rgba(${T.shadowBase},0.18); transition: opacity 0.2s; }

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

        .bp-window { border-radius: 13px; overflow: hidden; background: #fff; box-shadow: 0 10px 26px -6px rgba(${T.shadowBase},0.16); }

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
        .hint { background: ${T.bg}; border: 1.5px dashed ${T.ink3}; border-radius: 12px; padding: 14px 16px; font-size: clamp(13px,1.5vw,14px); color: ${T.ink2}; }

        /* === AI CARD === */
        .ai-card { background: ${T.paper}; border-radius: 14px; padding: 15px 17px; display: flex; flex-direction: column; gap: 11px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.14); }
        .ai-row { display: flex; align-items: center; gap: 9px; } .ai-badge { font-family: 'Manrope'; font-weight: 800; font-size: 11px; color: #fff; background: ${T.blue}; padding: 3px 9px; border-radius: 6px; } .ai-bubble { font-size: 13px; color: ${T.ink2}; }
        .ai-code { background: ${CODE.bg}; border-radius: 9px; padding: 10px 12px; display: flex; flex-direction: column; gap: 3px; }
        .ai-line { font-family: 'JetBrains Mono'; font-size: 13px; color: ${CODE.text}; cursor: pointer; padding: 7px 9px; border-radius: 6px; transition: all 0.15s; white-space: pre-wrap; } .ai-line:hover { background: rgba(255,255,255,0.06); }
        .ai-line.bad { background: rgba(255,79,40,0.16); box-shadow: inset 0 0 0 1px ${T.accent}; } .ai-line.ok { background: rgba(31,122,77,0.16); }
        .ai-prompt { font-size: 12px; color: ${T.ink3}; margin: 0; font-style: italic; } .note-h { font-weight: 700; font-size: 13px; margin: 0 0 4px; }
        .takeaway { background: ${T.accentSoft}; border-radius: 14px; padding: 20px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 5px; } .ta-bulb { font-size: 34px; } .ta-h { font-family: 'Source Serif 4', serif; font-weight: 600; font-size: clamp(16px,2.2vw,20px); color: ${T.ink}; margin: 0; } .ta-sub { color: ${T.accent}; font-weight: 600; font-size: 13px; margin: 0; }

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

        /* === REACT-2 DARS CSS === */
        .bp-bar { background: #f0eee8; padding: 8px 11px; display: flex; align-items: center; gap: 9px; }
        .bb-dots { display: flex; gap: 5px; }
        .bb-dots i { width: 9px; height: 9px; border-radius: 50%; }
        .bb-dots i:first-child { background: #ff5f57; } .bb-dots i:nth-child(2) { background: #febc2e; } .bb-dots i:nth-child(3) { background: #28c840; }
        .bp-title { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink3}; }
        .bp-body { padding: clamp(12px,2.2vw,18px); }
        .code-box { background: ${CODE.bg}; color: ${CODE.text}; font-family: 'JetBrains Mono', monospace; font-size: clamp(12px,1.5vw,13.5px); line-height: 1.55; padding: clamp(12px,2.2vw,16px); border-radius: 12px; overflow-x: auto; white-space: pre-wrap; word-break: break-word; margin: 0; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.2); }
        /* Roblox uslubidagi o'yin kartochkasi */
        .rocard { border-radius: 12px; background: #fff; box-shadow: 0 4px 14px -4px rgba(0,0,0,0.16); overflow: hidden; border: 1px solid rgba(0,0,0,0.05); transition: transform 0.15s, box-shadow 0.15s; }
        .rocard:hover { transform: translateY(-2px); box-shadow: 0 8px 20px -5px rgba(0,0,0,0.22); }
        .rothumb { height: 58px; display: flex; align-items: center; justify-content: center; }
        .robody { padding: 7px 10px 9px; }
        .roname { font-family: 'Manrope', sans-serif; font-weight: 800; font-size: 12px; color: ${T.ink}; margin: 0 0 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .rostats { display: flex; align-items: center; gap: 8px; font-family: 'Manrope', sans-serif; font-size: 10.5px; color: ${T.ink3}; font-weight: 600; }
        .rolike { border: none; background: transparent; cursor: pointer; padding: 0; font-family: 'Manrope', sans-serif; font-size: 10.5px; font-weight: 600; color: ${T.ink3}; transition: color 0.15s; }
        .rolike.on { color: ${T.success}; font-weight: 800; }
        /* VS Code muhiti (yakuniy ekran) */
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
        .likebtn { font-family: 'Manrope'; font-weight: 700; font-size: 13px; border: none; border-radius: 10px; background: ${T.bg}; color: ${T.ink}; padding: 7px 13px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; transition: all 0.15s; box-shadow: 0 3px 8px -3px rgba(0,0,0,0.15); }
        .likebtn:hover { transform: translateY(-1px); }
        .likebtn.liked { background: ${T.accentSoft}; color: ${T.accent}; }
        @keyframes heart-pop { 0% { transform: scale(1); } 40% { transform: scale(1.45); } 100% { transform: scale(1); } }
        .hpop { animation: heart-pop 0.4s ease; display: inline-block; }

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

