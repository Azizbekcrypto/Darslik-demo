import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';

// ============================================================
// 06-DARS — NETLIFY VA DEPLOY — PLATFORM STANDARD v16
// Mavzu: Hosting nima, saytni internetga chiqarish (deploy),
//        maktab poddomeniga ulash (ism.maktab.uz).
// Arxitektura/dizayn — platform_contract (HTML/CSS/Git darslari bilan bir xil).
// PRODUCTION: <style> ichidagi @import OLIB TASHLANADI — shriftlarni LMS yuklaydi.
// ============================================================

const T = {
  bg: '#F6F4EF', ink: '#0E0E10', ink2: '#5A5A60', ink3: '#A7A6A2',
  paper: '#FFFFFF', accent: '#FF4F28', accentSoft: '#FFE8E1', accentVivid: '#FF4F28',
  success: '#1F7A4D', successSoft: '#E3F0E8', blue: '#019ACB', link: '#1a56db',
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

const LESSON_META = { lessonId: 'deploy-01-v16', lessonTitle: { uz: 'Netlify va Deploy', ru: 'Netlify и деплой' } };
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

const Preview = ({ children, title = 'preview.html', minH }) => (
  <div className="bp-window"><div className="bp-bar"><span className="bb-dots"><i /><i /><i /></span><span className="bp-title">{title}</span></div><div className="bp-body" style={{ minHeight: minH }}>{children}</div></div>
);
const Split = ({ children }) => <div className="split">{children}</div>;
const Col = ({ children, gap }) => <div className="col" style={gap ? { gap } : undefined}>{children}</div>;

// GitHub Octocat logotipi (qoramtir) — sakkizoyoq emoji o'rniga
const GitHubMark = ({ size = 30 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" aria-hidden="true" fill="#24292F" style={{ display: 'block' }}>
    <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
  </svg>
);

// Kichik namuna-sayt (deploy/poddomen ekranlarida qayta ishlatiladi)
const MiniSite = ({ name = 'Aziza' }) => (
  <div style={{ fontFamily: 'Georgia, serif' }}>
    <h1 style={{ fontSize: 'clamp(18px,2.6vw,24px)', margin: '0 0 6px', color: T.ink }}>Salom, men {name}!</h1>
    <p style={{ margin: '0 0 12px', color: T.ink2, fontSize: 'clamp(13px,1.7vw,15px)', lineHeight: 1.5 }}>Bu mening birinchi saytim. Web-dasturlashni endi o'rganyapman.</p>
    <span style={{ display: 'inline-block', background: T.accent, color: '#fff', padding: '7px 15px', borderRadius: 8, fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: 13 }}>Obuna bo'lish</span>
  </div>
);

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

// ===== MENTOR (nomsiz ustoz ovozi — intro/izoh shu orqali; audio matni = shu matn) =====
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

// ===== SCREEN 0 — HOOK =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const audio = useAudio([{ id: 's0', text: `Saytingiz tayyor — kompyuteringizda zo'r ishlayapti. Lekin do'stingiz boshqa shahardan uni ocholmayapti. Nega? Pastdagi tugmalarni bosib ko'ring.`, trigger: 'on_mount', waits_for: { type: 'option_picked' } }]);
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const [view, setView] = useState('me');
  const OPTS = [
    { id: 'a', label: 'Faylni Telegram orqali yuboraman' },
    { id: 'b', label: 'Saytni internetga joylashtirish kerak' },
    { id: 'c', label: "Do'stim ham shu kompyuterga kelishi kerak" }
  ];
  const pick = (v) => { if (picked !== null) return; setPicked(v); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: true }); audio.triggerEvent('option_picked'); };
  return (
    <Stage eyebrow="Kirish" screen={screen} audioState={audio} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 760 }}>Saytingizni <span className="italic" style={{ color: T.accent }}>butun dunyo</span> ko'ra oladimi?</h1>
        <Mentor>Saytingiz tayyor — kompyuteringizda zo'r ishlayapti. Lekin <b style={{ color: T.ink }}>do'stingiz</b> boshqa shahardan uni ocholmayapti. Nega? <b style={{ color: T.ink }}>"Do'stim"</b> tugmasini bosib ko'ring.</Mentor>
        <Split>
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${view === 'me' ? 'chip-on' : ''}`} onClick={() => setView('me')}>💻 Mening kompyuterim</button>
              <button className={`chip ${view === 'friend' ? 'chip-on' : ''}`} onClick={() => setView('friend')}>📱 Do'stim</button>
            </div>
            <div className="demo-swap" key={view}>
              {view === 'me' ? (
                <Preview minH={158} title="localhost:5500">
                  <MiniSite name="Aziza" />
                </Preview>
              ) : (
                <Preview minH={158} title="???">
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 8, padding: '14px 0' }}>
                    <span style={{ fontSize: 38 }}>😕</span>
                    <p style={{ fontFamily: 'Georgia, serif', fontWeight: 700, color: T.ink, margin: 0, fontSize: 'clamp(15px,2vw,18px)' }}>Bu sahifa ochilmadi</p>
                    <p style={{ fontFamily: "'JetBrains Mono', monospace", color: T.ink3, margin: 0, fontSize: 12 }}>ERR — manzil topilmadi</p>
                  </div>
                </Preview>
              )}
            </div>
            {view === 'friend' && <p className="mono small" style={{ color: T.ink3, marginTop: 2, textAlign: 'center' }}>↑ do'stingizda sayt yo'q — chunki u faqat sizning kompyuteringizda</p>}
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Sizningcha, do'st ham ko'rishi uchun nima qilish kerak?</p>
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
            {picked !== null && <p className="hook-ack fade-step">To'g'ri yo'nalish! Saytni internetga <b>joylashtirish</b> — bugun shuni o'rganamiz.</p>}
          </Col>
        </Split>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's1', text: `Va'da beraman: dars oxirida saytingiz internetda, haqiqiy manzil bilan ochiq bo'ladi — masalan, aziza nuqta maktab nuqta uz. Unga 5 ta qadamda yetib boramiz.`, trigger: 'on_mount', waits_for: null }]);
  const STEPS = [
    { text: 'Hosting nima? — tushunamiz', tag: '' },
    { text: 'Netlify bilan tanishamiz', tag: 'hosting' },
    { text: "GitHub'dan kodni ulaymiz", tag: 'repo' },
    { text: 'Deploy qilamiz — sayt jonlanadi', tag: 'deploy' },
    { text: 'Maktab poddomeniga ulaymiz', tag: 'ism.maktab.uz' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const PreviewBlock = (
    <Col>
      <p className="flow-label">Manzil — dars oxirida shunday bo'ladi</p>
      <Preview title="aziza.maktab.uz" minH={210}>
        <MiniSite name="Aziza" />
      </Preview>
      <p className="mono small" style={{ color: T.success, margin: 0 }}>🌍 internetda · har kim ochishi mumkin</p>
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
    <Stage eyebrow="Reja" screen={screen} audioState={audio} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Boshlaymiz →" onClick={onNext} /></>}>
      <div className="screen">
        <div className="head">
          <h2 className="title h-title fade-up"><span className="italic" style={{ color: T.accent }}>Bugun saytni butun dunyoga ochamiz!</span></h2>
        </div>
        <Mentor>Va'da beraman: dars oxirida saytingiz <b style={{ color: T.ink }}>internetda</b>, haqiqiy manzil bilan ochiq bo'ladi — masalan <span className="mono">aziza.maktab.uz</span>. Unga <b style={{ color: T.ink }}>5 ta qadamda</b> yetib boramiz.</Mentor>
        {!isNarrow ? (
          <Split>{PreviewBlock}{StepsBlock}</Split>
        ) : !showSteps ? (
          <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>
            {PreviewBlock}
            <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>📋 Bugungi 5 qadamni ko'rish</button>
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

// ===== SCREEN 2 — HOSTING NIMA (localhost vs hosting) =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's2', text: `Saytingiz hozir faqat sizning kompyuteringizda yashayapti — buni "localhost" deyiladi. Uni hammaga ochish uchun doimo ishlab turadigan boshqa kompyuterga — hosting serveriga qo'yish kerak. Ikkala holatni almashtirib ko'ring.`, trigger: 'on_mount', waits_for: null }]);
  const [mode, setMode] = useState('local');
  const [touched, setTouched] = useState(false);
  const done = touched;
  const pick = (m) => { setMode(m); setTouched(true); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const VISITORS = ['🧑', '👩', '👨', '👵', '🧒', '👧'];
  return (
    <Stage eyebrow="Hosting" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ikkalasini ko’ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Sayt internetda <span className="italic" style={{ color: T.accent }}>qayerda</span> yashaydi?</h2></div>
        <Mentor>Saytingiz hozir faqat <b style={{ color: T.ink }}>sizning kompyuteringizda</b> yashayapti — buni <span className="mono">localhost</span> deyiladi. Uni hammaga ochish uchun doimo ishlab turadigan boshqa kompyuterga — <b style={{ color: T.ink }}>hosting serveriga</b> qo'yish kerak.</Mentor>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${mode === 'local' ? 'chip-on' : ''}`} onClick={() => pick('local')}>💻 localhost</button>
              <button className={`chip ${mode === 'host' ? 'chip-on' : ''}`} onClick={() => pick('host')}>🌍 Hosting</button>
            </div>
            <div className="demo-swap" key={mode} style={{ background: T.paper, borderRadius: 14, padding: '20px 18px', boxShadow: `0 8px 20px -6px rgba(${T.shadowBase},0.14)`, textAlign: 'center' }}>
              {mode === 'local' ? (
                <>
                  <div style={{ fontSize: 40 }}>💻</div>
                  <p style={{ fontFamily: 'Georgia, serif', fontWeight: 700, color: T.ink, margin: '8px 0 4px', fontSize: 'clamp(15px,2vw,18px)' }}>Faqat bitta odam ko'radi</p>
                  <p className="body" style={{ margin: 0, color: T.ink2 }}>Sayt sizning kompyuteringizda. Kompyuter o'chsa — sayt ham yo'q.</p>
                  <div style={{ marginTop: 12, fontSize: 26 }}>🧑</div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 40 }}>🌍</div>
                  <p style={{ fontFamily: 'Georgia, serif', fontWeight: 700, color: T.ink, margin: '8px 0 4px', fontSize: 'clamp(15px,2vw,18px)' }}>Butun dunyo ko'radi</p>
                  <p className="body" style={{ margin: 0, color: T.ink2 }}>Sayt hosting serverida — 24/7 yonib turadi, har kim manzildan ochadi.</p>
                  <div style={{ marginTop: 12, fontSize: 22, letterSpacing: 4 }}>{VISITORS.join(' ')}</div>
                </>
              )}
            </div>
          </Col>
          <Col>
            <div className="frame frame-col fade-up delay-2">
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <span style={{ fontSize: 26 }}>🏠</span>
                <div>
                  <p className="eyebrow" style={{ color: T.accent, margin: '0 0 4px' }}>Oddiy qilib aytganda</p>
                  <p className="body" style={{ margin: 0, color: T.ink }}><b>Hosting</b> — saytingiz uchun internetda ijaraga olingan <b>doimiy uy</b>. U yerda fayllaringiz turadi va server ularni 24 soat har kimga ko'rsatib beradi.</p>
                </div>
              </div>
            </div>
            <div className="frame-soft fade-up delay-3"><p className="body" style={{ margin: 0, color: T.ink }}>Esingizdami — Internet darsida <b>server</b> haqida gaplashgandik? Hosting — aynan saytingizni shunday serverga joylashtirishdir.</p></div>
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 3 — HOSTING QANDAY ISHLAYDI (oqim) =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's3', text: `Saytni hostingga qo'yganingizda nima bo'ladi? Fayllaringiz serverga ko'chiriladi, manzil oladi, va har bir tashrifchi brauzerda o'sha manzilni ochadi. "Boshlash" tugmasini bosib, yo'lni kuzating.`, trigger: 'on_mount', waits_for: { type: 'flow_done' } }]);
  const STEPS = [
    { ic: '📄', h: 'Fayllaringiz', s: 'index.html, style.css' },
    { ic: '⬆️', h: 'Serverga yuklanadi', s: 'hosting xotirasiga' },
    { ic: '🌐', h: 'Manzil oladi', s: 'masalan: sayt.netlify.app' },
    { ic: '👀', h: 'Tashrifchi ochadi', s: 'brauzerda ko’radi' }
  ];
  const [step, setStep] = useState(storedAnswer ? STEPS.length : 0);
  const [running, setRunning] = useState(false);
  const timer = useRef(null);
  const isNarrow = useIsMobile(768);
  const done = step >= STEPS.length;
  useEffect(() => () => clearTimeout(timer.current), []);
  const run = () => {
    clearTimeout(timer.current); setStep(0); setRunning(true);
    const tick = (i) => { setStep(i); if (i < STEPS.length) timer.current = setTimeout(() => tick(i + 1), 620); else { setRunning(false); audio.triggerEvent('flow_done'); } };
    timer.current = setTimeout(() => tick(1), 350);
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Hosting oqimi" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Avval oqimni ko’ring'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(12px,2vw,18px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Saytni qo'ysangiz — <span className="italic" style={{ color: T.accent }}>nima bo'ladi?</span></h2></div>
        <Mentor>Saytni hostingga qo'yganingizda: fayllaringiz <b style={{ color: T.ink }}>serverga ko'chiriladi</b>, <b style={{ color: T.ink }}>manzil</b> oladi, va har bir tashrifchi brauzerda o'sha manzilni ochadi. Tugmani bosib, yo'lni kuzating.</Mentor>
        {!isNarrow ? (
          <div className="pz-flow" style={{ justifyContent: 'center' }}>
            {STEPS.map((s, i) => (
              <React.Fragment key={i}>
                <div className={`pz-step ${step > i ? 'on' : ''} ${running && step === i + 1 ? 'active' : ''}`} style={{ minWidth: 104 }}>
                  <span style={{ fontSize: 26 }}>{step > i ? s.ic : '○'}</span>
                  <span className="pz-lbl"><b style={{ color: step > i ? T.ink : T.ink2 }}>{s.h}</b><br />{s.s}</span>
                </div>
                {i < STEPS.length - 1 && <span className={`pz-arrow ${step > i + 1 ? 'on' : ''}`}>→</span>}
              </React.Fragment>
            ))}
          </div>
        ) : (
          <div className="pz-flow-v">
            {STEPS.map((s, i) => (
              <React.Fragment key={i}>
                <div className={`pz-rowstep ${step > i ? 'on' : ''} ${running && step === i + 1 ? 'active' : ''}`}>
                  <span className="pz-rowic">{step > i ? s.ic : '○'}</span>
                  <span className="pz-rowtxt"><b>{s.h}</b><span>{s.s}</span></span>
                  {step > i && <span style={{ marginLeft: 'auto', color: T.success, fontSize: 15 }}>✓</span>}
                </div>
                {i < STEPS.length - 1 && <span className={`pz-varrow ${step > i + 1 ? 'on' : ''}`}>↓</span>}
              </React.Fragment>
            ))}
          </div>
        )}
        <button className="btn" onClick={run} disabled={running} style={{ alignSelf: 'flex-start' }}>{running ? 'Bajarilmoqda…' : (done ? '↻ Yana ko’rsatish' : '▶ Boshlash')}</button>
        {done && (
          <div className="frame-success fade-step"><p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: T.success, textTransform: 'uppercase', letterSpacing: '0.08em' }}>✓ Mana shu — hosting</p><p className="body" style={{ margin: 0, color: T.ink }}>Fayllaringiz serverda <b>doimo</b> turadi va manzil orqali ochiladi. Endi kerak — buni qiladigan <b>oson vosita</b>. Mana <b>Netlify</b> kiradi.</p></div>
        )}
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST 1 =====
const Screen4 = (props) => (
  <QuestionScreen {...props} idx={4} scope="module-mikro" eyebrow="Mashq · 1-savol"
    audioText="Hosting asosan qanday vazifa bajaradi? To'g'ri variantni tanlang."
    questionText="Hosting asosan qanday vazifa bajaradi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Hosting nima qiladi?</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Hosting asosan qanday vazifa bajaradi?</h2></>}
    options={['Kodni ranglar bilan bezaydi', 'Saytni internetda doimo ochiq saqlaydi', 'Rasmlarni tahrirlaydi', 'Internetni tezlashtiradi']} correctIdx={1}
    explainCorrect="To'g'ri! Hosting — saytingizni doimo ishlab turadigan serverda saqlaydi, shunda u internetda har kim uchun ochiq bo'ladi."
    explainWrong={{ 0: 'Yo’q — kodni bezash CSS ishi. Hosting esa saytni internetda ochiq saqlaydi.', 2: 'Yo’q — rasm tahriri boshqa narsa. Hosting saytni serverda joylashtiradi.', 3: 'Yo’q — hosting internetni tezlashtirmaydi, u saytingizni doimo ochiq saqlaydi.', default: 'Hosting saytni internetda doimo ochiq saqlaydi.' }} />
);

// ===== SCREEN 5 — NETLIFY NIMA =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's5', text: `Netlify — saytingizni bir necha soniyada va bepul internetga chiqaradigan hosting platformasi. Ikki yo'li bor: papkani sichqoncha bilan tortib tashlash, yoki GitHub'ni ulash. Ikkala usulni bosib ko'ring.`, trigger: 'on_mount', waits_for: null }]);
  const WAYS = {
    drag: { ic: '📁', title: 'Papkani tortib tashlash', body: "Sayt papkangizni Netlify oynasiga sichqoncha bilan tortib tashlaysiz — tamom, sayt internetda. Eng tez usul." },
    github: { ic: '🔗', title: "GitHub'ni ulash", body: "Netlify GitHub repongizni kuzatadi. Siz push qilgan har bir o'zgarish avtomatik internetga chiqadi. Biz shu usulni o'rganamiz." }
  };
  const [active, setActive] = useState(null);
  const [seen, setSeen] = useState(new Set());
  const isNarrow = useIsMobile(768);
  const done = seen.size >= 2;
  const tap = (k) => { setActive(k); setSeen(prev => { const n = new Set(prev); n.add(k); return n; }); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Netlify" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${seen.size}/2 usulni ko'ring`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Saytni <span className="italic" style={{ color: T.accent }}>bir necha soniyada</span> chiqaramiz</h2></div>
        <Mentor>Netlify — saytingizni <b style={{ color: T.ink }}>bepul</b> va tez internetga chiqaradigan hosting platformasi. Ikki yo'li bor — ikkalasini bosib ko'ring.</Mentor>
        <div className="split">
          <Col>
            <div className="bp-window fade-up delay-1">
              <div className="bp-bar"><span className="bb-dots"><i /><i /><i /></span><span className="bp-title">app.netlify.com</span></div>
              <div className="bp-body" style={{ background: '#0e1726', display: 'flex', flexDirection: 'column', gap: 10, minHeight: 150 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                  <span style={{ width: 26, height: 26, borderRadius: 7, background: '#00C7B7', color: '#0e1726', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontFamily: "'Manrope',sans-serif", fontSize: 14 }}>N</span>
                  <span style={{ color: '#fff', fontFamily: "'Manrope',sans-serif", fontWeight: 700, fontSize: 15 }}>Netlify</span>
                  <span style={{ marginLeft: 'auto', color: '#7DD181', fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>● bepul</span>
                </div>
                {Object.keys(WAYS).map(k => (
                  <button key={k} onClick={() => tap(k)} style={{ textAlign: 'left', cursor: 'pointer', border: active === k ? `1.5px solid #00C7B7` : '1.5px solid #2a3a52', background: active === k ? 'rgba(0,199,183,0.12)' : 'transparent', borderRadius: 10, padding: '11px 13px', display: 'flex', alignItems: 'center', gap: 10, transition: 'all 0.18s' }}>
                    <span style={{ fontSize: 22 }}>{WAYS[k].ic}</span>
                    <span style={{ color: '#E8E5DD', fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 13.5 }}>{WAYS[k].title}</span>
                    {seen.has(k) && <span style={{ marginLeft: 'auto', color: '#7DD181', fontSize: 13 }}>✓</span>}
                  </button>
                ))}
              </div>
            </div>
          </Col>
          <Col>
            {active ? (
              <div className="sk-info fade-step" key={active}>
                <span className="sk-tagbig"><span style={{ fontSize: 24 }}>{WAYS[active].ic}</span><span className="sk-wordbadge">{WAYS[active].title}</span></span>
                <p className="body" style={{ color: T.ink, margin: '11px 0 0' }}>{WAYS[active].body}</p>
              </div>
            ) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Chapdan bir usulni bosing</p></div> : null)}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Biz <b>GitHub'ni ulash</b> usulidan foydalanamiz — chunki Git darsida kodimizni allaqachon GitHub'ga qo'ygan edik.</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 5b — TEST 2 =====
const Screen5b = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Tekshiruv"
    audioText="Netlify nima?"
    questionText="Netlify nima?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Mustahkamlash</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Netlify nima?</h2></>}
    options={['Brauzer', 'Saytlarni bepul joylaydigan platforma (hosting)', "O'yin", 'Domen nomi']} correctIdx={1}
    explainCorrect="To'g'ri! Netlify — saytlarni bepul va tez internetga chiqaradigan hosting platformasi."
    explainWrong={{
      0: 'Brauzer — saytni ko’rsatadigan dastur (Chrome). Netlify esa saytni joylaydigan hosting.',
      2: 'Yo’q — Netlify o’yin emas, u hosting platformasi.',
      3: 'Domen — saytning manzili (maktab.uz). Netlify esa saytni joylaydigan platforma.',
      default: 'Netlify — saytlarni joylaydigan bepul hosting platformasi.'
    }} />
);

// ===== SCREEN 6 — GITHUB'NI ULASH =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's6', text: `Netlify kodingizni qayerdan oladi? GitHub'dan. Git darsida push qilgan repongizni tanlaysiz va ulaysiz — shundan keyin Netlify uni doimo kuzatib turadi. Repongizni tanlab, "Ulash" tugmasini bosing.`, trigger: 'on_mount', waits_for: { type: 'connected' } }]);
  const REPOS = ['mening-saytim', 'maktab-loyiha', 'portfolio'];
  const [repo, setRepo] = useState(storedAnswer ? 'mening-saytim' : null);
  const [connected, setConnected] = useState(!!storedAnswer);
  const done = connected;
  const connect = () => { if (!repo) return; setConnected(true); audio.triggerEvent('connected'); if (!audio.muted) setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff(`Ulandi! Endi Netlify shu repони kuzatadi.`); }, 300); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="GitHub ulash" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Repони ulang'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Netlify kodni <span className="italic" style={{ color: T.accent }}>qayerdan</span> oladi?</h2></div>
        <Mentor>Netlify kodingizni <b style={{ color: T.ink }}>GitHub'dan</b> oladi. Git darsida push qilgan repongizni tanlaysiz — shundan keyin Netlify uni doimo kuzatib turadi.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">GitHub repolaringiz</p>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {REPOS.map(r => (
                <button key={r} onClick={() => !connected && setRepo(r)} disabled={connected} style={{ display: 'flex', alignItems: 'center', gap: 10, textAlign: 'left', cursor: connected ? 'default' : 'pointer', border: 'none', borderRadius: 12, padding: '12px 15px', background: T.paper, color: T.ink, boxShadow: repo === r ? `inset 0 0 0 2px ${T.accent}, 0 6px 16px -6px rgba(255,79,40,0.25)` : `0 6px 16px -6px rgba(${T.shadowBase},0.14)`, fontFamily: "'JetBrains Mono',monospace", fontSize: 14, fontWeight: 500, transition: 'all 0.18s' }}>
                  <span style={{ fontSize: 17 }}>📦</span>
                  <span>{r}</span>
                  {repo === r && <span style={{ marginLeft: 'auto', color: T.accent, fontSize: 16 }}>●</span>}
                </button>
              ))}
            </div>
            {!connected && <button className="btn" onClick={connect} disabled={!repo} style={{ alignSelf: 'flex-start', marginTop: 4 }}>🔗 Netlify'ga ulash</button>}
          </Col>
          <Col>
            {connected ? (
              <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, background: T.paper, borderRadius: 14, padding: '18px 14px', boxShadow: `0 8px 20px -6px rgba(${T.shadowBase},0.14)` }}>
                  <div style={{ textAlign: 'center' }}><div style={{ height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><GitHubMark size={30} /></div><span className="mono small" style={{ color: T.ink2, marginTop: 4, display: 'block' }}>GitHub</span></div>
                  <span style={{ color: T.success, fontSize: 20 }}>🔗</span>
                  <div style={{ textAlign: 'center' }}><div style={{ height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>🌍</div><span className="mono small" style={{ color: T.ink2, marginTop: 4, display: 'block' }}>Netlify</span></div>
                </div>
                <div className="frame-success"><p className="small mono" style={{ margin: '0 0 4px', fontWeight: 600, color: T.success, textTransform: 'uppercase', letterSpacing: '0.08em' }}>✓ Ulandi</p><p className="body" style={{ margin: 0, color: T.ink }}><b className="mono">{repo}</b> reposi Netlify'ga ulandi. Endi push qilingan kod avtomatik internetga chiqadi.</p></div>
              </div>
            ) : (
              <div className="frame-soft"><p className="body" style={{ margin: 0, color: T.ink }}><b>Eslatma:</b> kodingiz GitHub'da turibdi (Git darsidan). Netlify uni o'sha yerdan o'qiydi — qayta yuklash shart emas.</p></div>
            )}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — DEPLOY QILISH =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's7', text: `Endi eng zo'r lahza — deploy. Deploy degani: fayllaringizni serverga joylab, saytni internetda ochiq qilish. "Deploy" tugmasini bosing va kuzating.`, trigger: 'on_mount', waits_for: { type: 'deployed' } }]);
  const [phase, setPhase] = useState(storedAnswer ? 'live' : 'idle'); // idle | building | live
  const timer = useRef(null);
  const done = phase === 'live';
  useEffect(() => () => clearTimeout(timer.current), []);
  const deploy = () => {
    setPhase('building');
    timer.current = setTimeout(() => { setPhase('live'); audio.triggerEvent('deployed'); if (!audio.muted) setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff(`Tayyor! Saytingiz internetda — manzilni do'stingizga yuborsangiz, ochib ko'radi.`); }, 300); }, 1600);
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Deploy" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Saytni deploy qiling'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Sayt qanday <span className="italic" style={{ color: T.accent }}>jonlanadi?</span></h2></div>
        <Mentor><b style={{ color: T.ink }}>Deploy</b> — fayllaringizni serverga joylab, saytni internetda ochiq qilish. Tugmani bosing va kuzating.</Mentor>
        <div className="split">
          <Col>
            <div className="bp-window fade-up delay-1">
              <div className="bp-bar"><span className="bb-dots"><i /><i /><i /></span><span className="bp-title">app.netlify.com</span></div>
              <div className="bp-body" style={{ minHeight: 150, display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                {phase === 'idle' && (<>
                  <span style={{ fontSize: 40 }}>🚀</span>
                  <p className="body" style={{ margin: 0, color: T.ink2 }}>Sayt deploy qilishga tayyor.</p>
                  <button className="btn" onClick={deploy}>🚀 Deploy qilish</button>
                </>)}
                {phase === 'building' && (<>
                  <div style={{ width: 34, height: 34, border: `3px solid ${T.accentSoft}`, borderTopColor: T.accent, borderRadius: '50%', animation: 'dl-spin 0.8s linear infinite' }} />
                  <p className="body" style={{ margin: 0, color: T.ink }}>Building… fayllar serverga yuklanyapti</p>
                  <p className="mono small" style={{ color: T.ink3, margin: 0 }}>index.html · style.css</p>
                </>)}
                {phase === 'live' && (<>
                  <span style={{ fontSize: 40 }}>✅</span>
                  <p style={{ fontFamily: 'Georgia, serif', fontWeight: 700, color: T.success, margin: 0, fontSize: 'clamp(16px,2.2vw,19px)' }}>Published! Sayt internetda</p>
                  <span className="mono" style={{ fontSize: 13, color: T.link, textDecoration: 'underline' }}>mening-saytim.netlify.app</span>
                </>)}
              </div>
            </div>
          </Col>
          <Col>
            {done ? (
              <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p className="flow-label">Endi sayt shu manzilda ochiladi</p>
                <Preview title="mening-saytim.netlify.app" minH={150}><MiniSite name="Aziza" /></Preview>
                <div className="frame-success"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Bu manzilni istalgan odamga yuborsangiz — u brauzerda ochib, saytingizni ko'radi.</p></div>
              </div>
            ) : (
              <div className="frame-soft"><p className="body" style={{ margin: 0, color: T.ink }}>Netlify avtomatik manzil beradi: <span className="mono">tasodifiy-nom.netlify.app</span>. Keyinroq uni <b>maktab poddomeniga</b> almashtiramiz.</p></div>
            )}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — AVTO-DEPLOY (push -> auto) =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's8', text: `Eng sehrli qismi: kodni o'zgartirib GitHub'ga push qilsangiz, Netlify o'zi sezadi va saytni avtomatik yangilaydi. Sinab ko'ring: sarlavhani o'zgartiring, keyin "push" qiling.`, trigger: 'on_mount', waits_for: { type: 'pushed' } }]);
  const [text, setText] = useState('Salom, men Aziza!');
  const [live, setLive] = useState('Salom, men Aziza!');
  const [phase, setPhase] = useState('idle'); // idle | deploying
  const [pushed, setPushed] = useState(!!storedAnswer);
  const timer = useRef(null);
  const dirty = text.trim() !== live.trim() && text.trim().length > 0;
  const done = pushed;
  useEffect(() => () => clearTimeout(timer.current), []);
  const push = () => {
    if (!dirty || phase === 'deploying') return;
    setPhase('deploying');
    timer.current = setTimeout(() => { setLive(text.trim()); setPhase('idle'); setPushed(true); audio.triggerEvent('pushed'); if (!audio.muted) setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff(`Ko'rdingizmi! Push qildingiz — Netlify o'zi qayta deploy qildi. Sayt yangilandi.`); }, 300); }, 1400);
  };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Avto-deploy" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'O’zgartirib push qiling'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Kodni o'zgartirsangiz <span className="italic" style={{ color: T.accent }}>nima bo'ladi?</span></h2></div>
        <Mentor>Eng sehrli qismi: kodni o'zgartirib GitHub'ga <b style={{ color: T.ink }}>push</b> qilsangiz, Netlify o'zi sezadi va saytni <b style={{ color: T.ink }}>avtomatik</b> yangilaydi. Sinab ko'ring.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">Kod (sarlavhani o'zgartiring)</p>
            <div className="fade-up delay-1" style={{ background: CODE.bg, borderRadius: 12, padding: '13px 14px', boxShadow: `0 8px 22px -6px rgba(${T.shadowBase},0.2)`, fontFamily: "'JetBrains Mono',monospace", fontSize: 13.5 }}>
              <span style={{ color: CODE.tag }}>{'<h1>'}</span>
              <input value={text} onChange={e => setText(e.target.value)} maxLength={30} spellCheck={false} style={{ background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: 6, color: CODE.text, fontFamily: "'JetBrains Mono',monospace", fontSize: 13.5, padding: '3px 7px', margin: '0 3px', width: 'min(60%, 200px)', outline: 'none' }} />
              <span style={{ color: CODE.tag }}>{'</h1>'}</span>
            </div>
            <button className="btn" onClick={push} disabled={!dirty || phase === 'deploying'} style={{ alignSelf: 'flex-start' }}>{phase === 'deploying' ? 'Deploying…' : '⬆️ git push'}</button>
            {dirty && phase === 'idle' && <p className="mono small" style={{ color: T.accent, margin: 0 }}>● o'zgarish push qilinmagan</p>}
          </Col>
          <Col>
            <p className="flow-label">Internetdagi sayt {phase === 'deploying' && <span style={{ color: T.accent }}>· yangilanyapti…</span>}</p>
            <div style={{ position: 'relative' }}>
              <Preview title="mening-saytim.netlify.app" minH={130}>
                <div key={live} className="fade-step"><MiniSite name={live.replace(/^Salom,?\s*men\s*/i, '').replace(/!$/, '') || live} /></div>
              </Preview>
              {phase === 'deploying' && <div style={{ position: 'absolute', inset: 0, top: 32, background: 'rgba(246,244,239,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '0 0 13px 13px' }}><div style={{ width: 28, height: 28, border: `3px solid ${T.accentSoft}`, borderTopColor: T.accent, borderRadius: '50%', animation: 'dl-spin 0.8s linear infinite' }} /></div>}
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ <b>Continuous deployment</b>: push qilsangiz — sayt o'zi yangilanadi. Qo'lda hech narsa qilish shart emas!</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 9 — TEST 3 =====
const Screen9 = (props) => (
  <QuestionScreen {...props} idx={9} scope="module-mikro" eyebrow="Mashq · 2-savol"
    audioText="Saytni deploy qilgandan keyin uni kim ko'ra oladi?"
    questionText="Saytni deploy qilgandan keyin uni kim ko'ra oladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Saytni deploy qilgandan keyin uni kim ko'ra oladi?</h2></>}
    options={['Faqat men', 'Internetdagi har bir kishi (manzil orqali)', 'Hech kim', 'Faqat GitHub xodimlari']} correctIdx={1}
    explainCorrect="To'g'ri! Deploy qilingach sayt internetda ochiq bo'ladi — manzilni bilgan har bir kishi uni ochib ko'radi."
    explainWrong={{ 0: 'Yo’q — bu localhost edi. Deploy qilingach sayt hamma uchun ochiq.', 2: 'Yo’q — aksincha, deploy saytni hammaga ochib beradi.', 3: 'Yo’q — manzilni bilgan istalgan odam ko’radi, faqat GitHub emas.', default: 'Deploy qilingach saytni manzil orqali har kim ko’radi.' }} />
);

// ===== SCREEN 10 — PODDOMEN NIMA =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's10', text: `Netlify bergan manzil chiroyli emas — tasodifiy-nom nuqta netlify nuqta app. Maktabimizning o'z domeni bor: maktab nuqta uz. Har bir o'quvchiga uning oldidan o'z nomi qo'shiladi — bu poddomen. Masalan aziza nuqta maktab nuqta uz. Ismni bosib ko'ring.`, trigger: 'on_mount', waits_for: null }]);
  const NAMES = ['aziza', 'ali', 'dilnoza'];
  const [pick, setPick] = useState(null);
  const [touched, setTouched] = useState(false);
  const done = touched;
  const choose = (n) => { setPick(n); setTouched(true); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Poddomen" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ismni bosing'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Maktabning <span className="italic" style={{ color: T.accent }}>poddomeni</span> nima?</h2></div>
        <Mentor>Maktabimizning o'z domeni bor: <span className="mono">maktab.uz</span>. Har bir o'quvchiga uning oldidan o'z nomi qo'shiladi — bu <b style={{ color: T.ink }}>poddomen</b>. Masalan <span className="mono">aziza.maktab.uz</span>. Ismni bosib ko'ring.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">Bitta domen — ko'p poddomen</p>
            <div className="fade-up delay-1" style={{ background: T.paper, borderRadius: 14, padding: '18px 16px', boxShadow: `0 8px 20px -6px rgba(${T.shadowBase},0.14)` }}>
              <div style={{ textAlign: 'center', marginBottom: 12 }}>
                <span style={{ display: 'inline-block', background: T.ink, color: T.bg, fontFamily: "'JetBrains Mono',monospace", fontWeight: 700, fontSize: 15, padding: '8px 16px', borderRadius: 10 }}>🏫 maktab.uz</span>
                <p className="mono small" style={{ color: T.ink3, margin: '5px 0 0' }}>domen (asosiy manzil)</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, flexWrap: 'wrap' }}>
                {NAMES.map(n => (
                  <button key={n} onClick={() => choose(n)} style={{ cursor: 'pointer', border: 'none', borderRadius: 9, padding: '8px 12px', fontFamily: "'JetBrains Mono',monospace", fontSize: 12.5, fontWeight: 600, background: pick === n ? T.accent : T.bg, color: pick === n ? '#fff' : T.ink, boxShadow: pick === n ? '0 6px 16px -5px rgba(255,79,40,0.4)' : 'none', transition: 'all 0.18s' }}>{n}.maktab.uz</button>
                ))}
              </div>
              <p className="mono small" style={{ color: T.ink3, margin: '8px 0 0', textAlign: 'center' }}>↑ poddomenlar (har o'quvchiga bittadan)</p>
            </div>
          </Col>
          <Col>
            {pick ? (
              <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="sk-info">
                  <p className="flow-label" style={{ marginBottom: 8 }}>Manzilning qismlari</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', fontFamily: "'JetBrains Mono',monospace", fontSize: 'clamp(15px,2.2vw,19px)' }}>
                    <span style={{ background: T.accentSoft, color: T.accent, padding: '4px 8px', borderRadius: 6, fontWeight: 700 }}>{pick}</span>
                    <span style={{ color: T.ink3 }}>.</span>
                    <span style={{ background: T.bg, color: T.ink, padding: '4px 8px', borderRadius: 6, fontWeight: 700, boxShadow: `inset 0 0 0 1px ${T.ink3}55` }}>maktab.uz</span>
                  </div>
                  <p className="body" style={{ margin: '11px 0 0', color: T.ink }}><b style={{ color: T.accent }}>{pick}</b> — sizning nomingiz (poddomen), <b>maktab.uz</b> — maktab domeni. Birga — sizning shaxsiy manzilingiz.</p>
                </div>
                <Preview title={`${pick}.maktab.uz`} minH={110}><MiniSite name={pick.charAt(0).toUpperCase() + pick.slice(1)} /></Preview>
              </div>
            ) : (
              <div className="frame-soft"><p className="body" style={{ margin: 0, color: T.ink }}>Bitta maktab domeni ostida <b>yuzlab o'quvchi</b> o'z saytiga ega bo'ladi — har biri o'z poddomeni bilan. Tartibli va chiroyli!</p></div>
            )}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — PODDOMENGA ULASH =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's11', text: `Endi saytingizni maktab poddomeniga ulaymiz. Netlify'da "Add custom domain" bo'limiga ismingizni yozasiz — manzilingiz tayyor bo'ladi. Pastga ismingizni yozing.`, trigger: 'on_mount', waits_for: null }]);
  const [name, setName] = useState(storedAnswer?.name || '');
  const clean = name.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
  const done = clean.length >= 2;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true, name: clean }); }, [done]);
  return (
    <Stage eyebrow="Poddomenga ulash" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Ismingizni yozing'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Saytni <span className="italic" style={{ color: T.accent }}>maktab poddomeniga</span> ulaymiz</h2></div>
        <Mentor>Netlify'da <b style={{ color: T.ink }}>"Add custom domain"</b> bo'limiga ismingizni yozasiz, maktab adminstratori uni tasdiqlaydi — va manzilingiz tayyor. Pastga ismingizni yozing.</Mentor>
        <div className="split">
          <Col>
            <p className="flow-label">Netlify · Add custom domain</p>
            <div className="fade-up delay-1" style={{ display: 'flex', alignItems: 'center', gap: 2, background: T.paper, borderRadius: 12, padding: '6px 8px', boxShadow: `0 6px 16px -6px rgba(${T.shadowBase},0.14)`, fontFamily: "'JetBrains Mono',monospace" }}>
              <input value={name} onChange={e => setName(e.target.value)} maxLength={16} placeholder="ismingiz" spellCheck={false} autoCapitalize="off" autoCorrect="off" style={{ flex: 1, minWidth: 0, border: 'none', outline: 'none', background: 'transparent', fontFamily: "'JetBrains Mono',monospace", fontSize: 'clamp(14px,2vw,17px)', fontWeight: 700, color: T.accent, padding: '8px 6px' }} />
              <span style={{ color: T.ink2, fontSize: 'clamp(14px,2vw,17px)', fontWeight: 700, whiteSpace: 'nowrap' }}>.maktab.uz</span>
            </div>
            <div className="fade-up delay-2" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span className="tagpill" style={{ opacity: clean.length >= 2 ? 1 : 0.4 }}>{clean.length >= 2 ? '✓' : '1'} ismingiz</span>
              <span className="tagpill" style={{ opacity: clean.length >= 2 ? 1 : 0.4 }}>{clean.length >= 2 ? '✓' : '2'} .maktab.uz qo'shiladi</span>
            </div>
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Tayyor! Sizning manzilingiz: <b className="mono">{clean}.maktab.uz</b></p></div>}
          </Col>
          <Col>
            <p className="flow-label">natija</p>
            <Preview title={done ? `${clean}.maktab.uz` : 'manzil...'} minH={140}>
              {done ? <MiniSite name={clean.charAt(0).toUpperCase() + clean.slice(1)} /> : <p style={{ fontFamily: 'Georgia, serif', color: T.ink3, fontStyle: 'italic', margin: 0, textAlign: 'center' }}>Ismingizni yozing — manzilingiz shu yerda paydo bo'ladi</p>}
            </Preview>
            {done && <p className="mono small" style={{ color: T.success, margin: 0 }}>🌍 endi do'stlaringiz shu manzildan ochadi</p>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 12 — TEST 4 =====
const Screen12 = (props) => (
  <QuestionScreen {...props} idx={12} scope="module-mikro" eyebrow="Mashq · 3-savol"
    audioText="aziza nuqta maktab nuqta uz — bu nima?"
    questionText="aziza.maktab.uz — bu nima?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}><span className="mono" style={{ fontSize: '0.85em' }}>aziza.maktab.uz</span> — bu nima?</h2></>}
    options={['Boshqa mustaqil sayt', 'maktab.uz domenining poddomeni', 'Parol', 'Fayl nomi']} correctIdx={1}
    explainCorrect="To'g'ri! aziza.maktab.uz — bu maktab.uz domenining poddomeni. Asosiy domen oldiga qo'shilgan shaxsiy nom."
    explainWrong={{
      0: 'Yo’q — bu mustaqil domen emas, u maktab.uz ichidagi poddomen.',
      2: 'Yo’q — bu parol emas, bu saytning manzili (poddomen).',
      3: 'Yo’q — bu fayl emas, bu internet manzili — maktab.uz poddomeni.',
      default: 'aziza.maktab.uz — maktab.uz domenining poddomeni.'
    }} />
);

// ===== SCREEN 13 — AMALIYOT: TO'LIQ DEPLOY OQIMI =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's13', text: `Endi to'liq yo'lni o'zingiz bosib chiqing. To'rtta qadam, aniq tartibda: GitHub'ga push, Netlify'ga ulash, deploy, va poddomen. Tugmalarni ketma-ket bosing.`, trigger: 'on_mount', waits_for: null }]);
  const STEPS = [
    { ic: '⬆️', label: 'git push', log: '$ git push  →  kod GitHub’da' },
    { ic: '🔗', label: "Netlify'ga ulash", log: 'Netlify  ←  mening-saytim repo ulandi' },
    { ic: '🚀', label: 'Deploy', log: 'Building… ✓ Published — netlify.app' },
    { ic: '🌍', label: 'Poddomen', log: 'Custom domain  →  aziza.maktab.uz ✓' }
  ];
  const [step, setStep] = useState(storedAnswer ? STEPS.length : 0);
  const done = step >= STEPS.length;
  const advance = () => { if (step < STEPS.length) setStep(s => s + 1); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Amaliyot · to'liq oqim" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : `${step}/4 qadam`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">To'liq yo'l — <span className="italic" style={{ color: T.accent }}>o'zingiz bajaring</span></h2></div>
        <Mentor>To'rtta qadam, aniq <b style={{ color: T.ink }}>tartibda</b>: push → ulash → deploy → poddomen. Tugmalarni ketma-ket bosing.</Mentor>
        <div className="split">
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {STEPS.map((s, i) => {
                const stepDone = step > i;
                const stepActive = step === i;
                return (
                  <button key={i} onClick={stepActive ? advance : undefined} disabled={!stepActive} style={{ display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left', cursor: stepActive ? 'pointer' : 'default', border: 'none', borderRadius: 12, padding: '13px 15px', background: stepDone ? T.successSoft : (stepActive ? T.paper : T.bg), boxShadow: stepActive ? `0 8px 20px -6px rgba(255,79,40,0.28), inset 0 0 0 1.5px ${T.accent}` : 'none', opacity: stepDone || stepActive ? 1 : 0.5, transition: 'all 0.2s' }}>
                    <span style={{ fontSize: 22 }}>{stepDone ? '✅' : s.ic}</span>
                    <span style={{ fontFamily: "'Manrope',sans-serif", fontWeight: 600, fontSize: 15, color: stepDone ? T.success : T.ink }}>{i + 1}. {s.label}</span>
                    {stepActive && <span style={{ marginLeft: 'auto', color: T.accent, fontWeight: 700, fontSize: 13 }}>bosing →</span>}
                  </button>
                );
              })}
            </div>
          </Col>
          <Col>
            <p className="flow-label">Terminal / jurnal</p>
            <pre className="code-box" style={{ minHeight: 130 }}>
              {STEPS.slice(0, step).map((s, i) => (<React.Fragment key={i}><span style={{ color: CODE.str }}>{s.log}</span>{'\n'}</React.Fragment>))}
              {step === 0 && <span style={{ color: CODE.comment }}>{'// qadamlarni boshlang…'}</span>}
              {!done && step > 0 && <span style={{ color: CODE.attr }}>▌</span>}
            </pre>
            {done && <div className="frame-success fade-step"><p className="small mono" style={{ margin: '0 0 4px', fontWeight: 600, color: T.success, textTransform: 'uppercase', letterSpacing: '0.08em' }}>✓ To'liq oqim bajarildi</p><p className="body" style={{ margin: 0, color: T.ink }}><b>push → ulash → deploy → poddomen</b>. Saytingiz endi <b className="mono">aziza.maktab.uz</b> da!</p></div>}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — DEBUGGING (index.html) =====
const Screen14 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's14', text: `Deploy bo'ldi-yu, lekin sayt ochilganda bo'm-bo'sh, "404 — sahifa topilmadi" chiqdi. Sabab: bosh sahifa fayli "index.html" deb nomlanishi shart, lekin u "home.html" deb qo'yilgan. Xato faylни bosing.`, trigger: 'on_mount', waits_for: { type: 'error_found' } }]);
  const [picked, setPicked] = useState(storedAnswer ? 'home' : null);
  const [fixed, setFixed] = useState(!!storedAnswer);
  const found = picked === 'home';
  const done = fixed;
  const pickHome = () => { if (found) return; setPicked('home'); audio.triggerEvent('error_found'); if (!audio.muted) setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff(`Topdingiz! Bosh sahifa index.html bo'lishi kerak. Endi nomini to'g'rilaymiz.`); }, 300); };
  const fix = () => { setFixed(true); if (!audio.muted) setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff(`Tuzatildi! index.html — endi sayt ochiladi.`); }, 300); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Debugging" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : (found ? 'Endi tuzating' : 'Xatoni toping')} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Sayt ochildi-yu, <span className="italic" style={{ color: T.accent }}>bo'm-bo'sh</span> — nega?</h2></div>
        <Mentor>Deploy bo'ldi, lekin sayt <b style={{ color: T.ink }}>"404 — topilmadi"</b> chiqaryapti. Sabab: bosh sahifa fayli <span className="mono">index.html</span> bo'lishi shart. Fayllarni qarang — qaysi biri noto'g'ri nomlangan?</Mentor>
        <div className="split">
          <Col>
            <div className="ai-card fade-up delay-1">
              <div className="ai-row"><span className="ai-badge">AI</span><span className="ai-bubble">Saytingiz fayllari deploy qilindi:</span></div>
              <div className="ai-code">
                <div className={`ai-line ${found ? (fixed ? 'ok' : 'bad') : ''}`} onClick={pickHome}>📄 {fixed ? 'index.html' : 'home.html'} <span style={{ color: CODE.comment }}>{fixed ? '✓ bosh sahifa' : '← bosh sahifa?'}</span></div>
                <div className="ai-line" onClick={() => { if (!found) setPicked('css'); }}>🎨 style.css</div>
                <div className="ai-line" onClick={() => { if (!found) setPicked('img'); }}>🖼️ rasm.jpg</div>
              </div>
              {!found && <p className="ai-prompt">Qaysi fayl noto'g'ri nomlangan? Bosing.</p>}
              {found && !fixed && (<button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={fix}>🔧 Faylni index.html deb nomlash</button>)}
              {fixed && <p className="ai-prompt" style={{ color: T.success, fontStyle: 'normal', fontWeight: 600 }}>✓ Tuzatildi — endi sayt ochiladi!</p>}
            </div>
          </Col>
          <Col>
            {!found && (
              picked && picked !== 'home'
                ? (<div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bu fayl to'g'ri — {picked === 'css' ? 'style.css uslublar uchun' : 'rasm.jpg surat uchun'}. Yana qarang: <b>bosh sahifa</b> qanday nomlanishi kerak edi?</p></div>)
                : (<div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Hosting bosh sahifani <b style={{ color: T.ink }}>index.html</b> deb qidiradi. Topa olmasa — 404 chiqaradi. Qaysi fayl boshqacha nomlangan?</p></div>)
            )}
            {found && !fixed && (<div className="frame-warn fade-step"><p className="note-h" style={{ color: T.accent }}>✓ Topdingiz!</p><p className="body" style={{ margin: 0, color: T.ink }}>Bosh sahifa <span className="mono">home.html</span> deb nomlangan, lekin hosting <span className="mono">index.html</span> ni qidiradi. Chap tugmani bosib to'g'rilang →</p></div>)}
            {fixed ? (<>
              <p className="flow-label">Endi sayt to'g'ri ochiladi</p>
              <Preview title="aziza.maktab.uz" minH={120}><MiniSite name="Aziza" /></Preview>
              <div className="takeaway fade-step"><div className="ta-bulb">🛠️</div><p className="ta-h">Topding va tuzatding — bu debugging!</p><p className="ta-sub">Bosh sahifa doim index.html bo'ladi</p></div>
            </>) : (
              <div className="bp-window"><div className="bp-bar"><span className="bb-dots"><i /><i /><i /></span><span className="bp-title">aziza.maktab.uz</span></div><div className="bp-body" style={{ minHeight: 96, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 6 }}><span style={{ fontSize: 30 }}>📭</span><p style={{ fontFamily: "'JetBrains Mono',monospace", color: T.accent, margin: 0, fontWeight: 700 }}>404 — Not Found</p></div></div>
            )}
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 15 — YAKUNIY (manzilni o'zi yozadi) =====
const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's15', text: `Oxirgi qadam. O'z poddomen manzilingizni to'liq o'zingiz yozing: ismingiz, nuqta, maktab nuqta uz. Masalan: aziza nuqta maktab nuqta uz.`, trigger: 'on_mount', waits_for: { type: 'typed_ok' } }]);
  const [value, setValue] = useState(storedAnswer?.picked || '');
  const [passed, setPassed] = useState(!!storedAnswer?.correct);
  const v = value.trim().toLowerCase();
  const hasName = /^[a-z0-9-]{2,}\./.test(v);
  const hasDot = (v.match(/\./g) || []).length >= 2;
  const endsMaktab = /\.maktab\.uz$/.test(v);
  const valid = /^[a-z0-9-]{2,}\.maktab\.uz$/.test(v);
  const namePart = valid ? v.split('.')[0] : '';
  useEffect(() => {
    if (valid && !passed) {
      setPassed(true);
      onAnswer(screen, { correct: true, picked: value });
      audio.triggerEvent('typed_ok');
      if (!audio.muted) setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff(`Zo'r! To'liq manzilingizni yozdingiz — saytingiz internetda tayyor.`); }, 300);
    }
  }, [valid]);
  return (
    <Stage eyebrow="Yakuniy · amaliy" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!passed} label={passed ? 'Davom etish' : 'Manzilni yozing'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Oxirgi qadam: <span className="italic" style={{ color: T.accent }}>manzilingizni</span> yozing.</h2></div>
        <Mentor>O'z poddomen manzilingizni to'liq yozing: <b style={{ color: T.ink }}>ismingiz</b> + <span className="mono">.maktab.uz</span>. Masalan: <span className="mono">aziza.maktab.uz</span>.</Mentor>
        <div className="split">
          <Col>
            <input className="fade-up delay-1" value={value} onChange={e => setValue(e.target.value)} placeholder="ismingiz.maktab.uz" spellCheck={false} autoCapitalize="off" autoCorrect="off" style={{ width: '100%', fontFamily: "'JetBrains Mono', monospace", fontSize: 16, padding: '14px 16px', borderRadius: 12, border: 'none', background: T.paper, color: T.ink, outline: 'none', transition: 'box-shadow 0.2s', boxShadow: valid ? `0 0 0 2px ${T.success}, 0 8px 20px -8px rgba(${T.shadowBase},0.2)` : `0 4px 14px -6px rgba(${T.shadowBase},0.16)` }} />
            <div className="fade-up delay-2" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="tagpill" style={{ opacity: hasName ? 1 : 0.4 }}>{hasName ? '✓' : '1'} ismingiz</span>
              <span className="tagpill" style={{ opacity: hasDot ? 1 : 0.4 }}>{hasDot ? '✓' : '2'} nuqta bilan</span>
              <span className="tagpill" style={{ opacity: endsMaktab ? 1 : 0.4 }}>{endsMaktab ? '✓' : '3'} .maktab.uz</span>
            </div>
            {passed
              ? (<div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Zo'r! <b className="mono">{v}</b> — to'liq, to'g'ri poddomen manzili.</p></div>)
              : (<p className="body" style={{ margin: 0, color: T.ink3, fontSize: 13 }}>Masalan: <span className="mono">ali.maktab.uz</span> · faqat lotin harf, raqam va tire.</p>)}
          </Col>
          <Col>
            <p className="flow-label">natija</p>
            <Preview title={valid ? v : 'manzil...'} minH={130}>
              {valid ? <MiniSite name={namePart.charAt(0).toUpperCase() + namePart.slice(1)} /> : <p style={{ fontFamily: 'Georgia, serif', color: T.ink3, fontStyle: 'italic', margin: 0, textAlign: 'center' }}>To'liq manzilni yozing: ismingiz.maktab.uz</p>}
            </Preview>
          </Col>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — YAKUN =====
const Screen16 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const audio = useAudio([{ id: 's16', text: "Dars yakunlandi. Saytingizni internetga chiqardingiz! Asosiyni eslab qoling: hosting saytni serverda saqlaydi, Netlify uni bepul deploy qiladi, deploy qilingach sayt internetda ochiq, va poddomen — maktab domeni ostidagi shaxsiy manzilingiz.", trigger: 'on_mount', waits_for: null }]);
  const RECAP = ['Hosting nima — saytning internetdagi uyi', "Netlify bilan saytni bepul deploy qilish", "GitHub'ni ulash va avto-deploy (push → yangilanadi)", 'Deploy — sayt internetda har kim uchun ochiq', 'Poddomen — ism.maktab.uz (shaxsiy manzil)'];
  const HOMEWORK = [{ b: 'GitHub', t: '— saytingizni repoga push qiling' }, { b: 'Netlify', t: '— bepul account oching va repони ulang' }, { b: 'Deploy', t: '— saytni internetga chiqaring' }, { b: 'Manzil', t: '— poddomenni do’stingizga yuboring' }];
  const GLOSSARY = [{ b: 'Hosting', t: '— saytni serverda saqlash' }, { b: 'Netlify', t: '— bepul hosting platformasi' }, { b: 'Deploy', t: '— saytni internetga chiqarish' }, { b: 'Domen', t: '— maktab.uz' }, { b: 'Poddomen', t: '— ism.maktab.uz' }, { b: 'index.html', t: '— bosh sahifa fayli' }, { b: 'Avto-deploy', t: '— push → sayt o’zi yangilanadi' }];
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
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">✓</span> Dars tugadi</span><h2 className="title h-title fade-up d1">Saytingizni <span className="italic" style={{ color: T.accent }}>internetga</span> chiqardingiz.</h2><p className="body h-sub fade-up d2">{PASSED ? 'Tabriklaymiz! Endi saytingizni o’zingiz deploy qilib, maktab poddomeniga ulay olasiz.' : 'Yaxshi harakat! Bir-ikki joyni mustahkamlash uchun darsni qayta ko’ring.'}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span className="tick" style={{ width: 16, height: 16, borderRadius: '50%', background: T.success, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck">✓</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>🚀 Uyga vazifa</div><p className="body" style={{ margin: '0 0 10px', color: T.ink }}>O'z saytingizni internetga chiqaring:</p><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">Saytingiz tayyor bo'lsa — manzilni mentor va do'stlaringizga yuboring. Bu sizning birinchi jonli loyihangiz!</p></div>
        </div>
        <div ref={glossRef} className="gloss fade-up d4" style={{ scrollMarginBottom: 16 }}><div className="gloss-head" onClick={toggleGloss}><span className="lbl">💡 Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT — ({ lang, onFinished })
export default function DeployLesson({ lang: langProp, onFinished }) {
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
        .bp-body ul { list-style-type: disc; list-style-position: outside; padding-left: 24px; }
        .bp-body ol { list-style-type: decimal; list-style-position: outside; padding-left: 24px; }
        .bp-body li { display: list-item; }

        .title { font-family: 'Source Serif 4', serif; font-weight: 600; line-height: 1.1; letter-spacing: -0.005em; }
        .display { font-family: 'Source Serif 4', serif; font-weight: 600; line-height: 1.0; letter-spacing: -0.01em; }
        .italic { font-family: 'Source Serif 4', serif; font-style: italic; font-weight: 500; }
        .mono { font-family: 'JetBrains Mono', monospace; }

        @keyframes fade-in-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fade-in-up 0.4s ease-out forwards; opacity: 0; }
        .delay-1 { animation-delay: 0.12s; } .delay-2 { animation-delay: 0.24s; } .delay-3 { animation-delay: 0.36s; } .delay-4 { animation-delay: 0.48s; }
        @keyframes fade-step { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .fade-step { animation: fade-step 0.3s ease-out; }
        .d1 { animation-delay: 0.12s; } .d2 { animation-delay: 0.24s; } .d3 { animation-delay: 0.36s; } .d4 { animation-delay: 0.48s; }
        @keyframes dl-spin { to { transform: rotate(360deg); } }

        .feedback-block { max-height: 0; opacity: 0; overflow: hidden; transition: max-height 0.4s ease-out, opacity 0.3s ease-out 0.1s, margin-top 0.4s ease-out; margin-top: 0; }
        .feedback-block.visible { max-height: 800px; opacity: 1; margin-top: clamp(14px,2vw,20px); }

        /* === KNOPKALAR v15 (soyalar) === */
        .btn { font-family: 'Manrope', sans-serif; font-weight: 600; cursor: pointer; transition: all 0.2s; background: ${T.ink}; color: ${T.bg}; border: none; border-radius: 12px; letter-spacing: 0.01em; box-shadow: 0 6px 18px -4px rgba(${T.shadowBase},0.32); padding: clamp(11px,1.6vw,13px) clamp(20px,2.5vw,26px); font-size: clamp(13px,1.6vw,15px); }
        .btn:hover:not(:disabled) { background: ${T.accent}; box-shadow: 0 10px 24px -4px rgba(255,79,40,0.45); }
        .btn:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: none; }
        .btn-white-accent { font-family: 'Manrope', sans-serif; font-weight: 600; cursor: pointer; transition: all 0.2s; background: ${T.paper}; color: ${T.accent}; border: none; border-radius: 12px; letter-spacing: 0.01em; box-shadow: 0 8px 22px -4px rgba(255,79,40,0.35), 0 0 0 1px rgba(255,79,40,0.12); }
        .btn-white-accent:hover:not(:disabled) { background: ${T.accent}; color: #fff; box-shadow: 0 12px 28px -6px rgba(255,79,40,0.55); }
        .btn-white-accent:disabled { opacity: 0.45; cursor: not-allowed; box-shadow: 0 4px 12px -4px rgba(${T.shadowBase},0.14); }
        .btn-ghost { font-family: 'Manrope', sans-serif; font-weight: 600; cursor: pointer; transition: all 0.2s; background: transparent; color: ${T.ink}; border: none; border-radius: 12px; box-shadow: none; }
        .btn-ghost:hover:not(:disabled) { background: ${T.paper}; box-shadow: 0 6px 18px -6px rgba(${T.shadowBase},0.18); }
        .btn-ghost:disabled { opacity: 0.4; cursor: not-allowed; }

        /* === OPSIYALAR v15 === */
        .option { background: ${T.paper}; cursor: pointer; transition: all 0.2s; font-family: 'Manrope', sans-serif; font-weight: 500; text-align: left; border-radius: 12px; width: 100%; border: none; color: ${T.ink}; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.14); }
        .option:hover:not(:disabled) { background: #FDFBF7; box-shadow: 0 10px 22px -6px rgba(${T.shadowBase},0.22); }
        .option:disabled { cursor: default; }
        .option-correct { background: ${T.successSoft} !important; color: ${T.success} !important; box-shadow: 0 8px 22px -6px rgba(31,122,77,0.32) !important; }
        .option-wrong { background: ${T.paper} !important; color: ${T.ink3} !important; opacity: 0.55 !important; box-shadow: 0 4px 12px -6px rgba(${T.shadowBase},0.08) !important; }
        .option-picked-wrong { background: ${T.accentSoft} !important; color: ${T.accent} !important; box-shadow: 0 8px 22px -6px rgba(255,79,40,0.38) !important; }

        .chip { font-family: 'Manrope', sans-serif; font-weight: 600; font-size: clamp(13px,1.6vw,15px); display: inline-flex; align-items: center; gap: 8px; padding: 9px 15px; border-radius: 99px; border: none; background: ${T.paper}; color: ${T.ink}; cursor: pointer; transition: all 0.18s; box-shadow: 0 4px 12px -5px rgba(${T.shadowBase},0.18); }
        .tagpill { font-family: 'JetBrains Mono', monospace; font-size: 12.5px; font-weight: 600; display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; border-radius: 99px; background: ${T.paper}; color: ${T.ink}; box-shadow: 0 3px 10px -5px rgba(${T.shadowBase},0.18); transition: opacity 0.2s; }
        .chip:hover:not(:disabled) { transform: translateY(-1px); }
        .chip-on { background: ${T.accent}; color: #fff; box-shadow: 0 6px 16px -5px rgba(255,79,40,0.4); }
        .chip:disabled { opacity: 0.4; cursor: not-allowed; }

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

        .text-input, .prompt-input { width: 100%; font-family: 'JetBrains Mono', monospace; font-size: clamp(14px,1.8vw,16px); font-weight: 500; padding: 11px 13px; border: none; border-radius: 12px; background: ${T.paper}; color: ${T.ink}; outline: none; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.14); transition: box-shadow 0.2s; }
        .text-input:focus, .prompt-input:focus { box-shadow: 0 10px 22px -6px rgba(255,79,40,0.3), 0 0 0 1px rgba(255,79,40,0.2); }
        .prompt-input { font-family: 'Manrope'; }

        .code-box { background: ${CODE.bg}; color: ${CODE.text}; font-family: 'JetBrains Mono', monospace; font-size: clamp(12.5px,1.6vw,14.5px); line-height: 1.55; padding: clamp(12px,2.2vw,18px); border-radius: 12px; overflow-x: auto; white-space: pre-wrap; word-break: break-word; margin: 0; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.2); }
        .code-box .tg, .t-tag { color: ${CODE.tag}; }
        .t-cm, .cm { color: ${CODE.comment}; font-style: italic; }
        .at { color: ${CODE.attr}; } .st { color: ${CODE.str}; } .tx { color: ${CODE.text}; }

        .bp-window { border-radius: 13px; overflow: hidden; background: #fff; box-shadow: 0 10px 26px -6px rgba(${T.shadowBase},0.16); }
        .bp-bar { background: #f0eee8; padding: 8px 11px; display: flex; align-items: center; gap: 9px; }
        .bb-dots { display: flex; gap: 5px; }
        .bb-dots i { width: 9px; height: 9px; border-radius: 50%; }
        .bb-dots i:first-child { background: #ff5f57; } .bb-dots i:nth-child(2) { background: #febc2e; } .bb-dots i:nth-child(3) { background: #28c840; }
        .bp-title { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink3}; }
        .bp-body { padding: clamp(12px,2.2vw,18px); }

        .h-title { font-size: clamp(22px,4vw,38px); }
        .h-sub { font-size: clamp(17px,2.5vw,22px); }
        .body { font-size: clamp(14px,1.6vw,16px); line-height: 1.5; }
        .lead { margin: 0; }
        .eyebrow { font-size: clamp(11px,1.3vw,12px); letter-spacing: 0.18em; text-transform: uppercase; font-weight: 600; }
        .small { font-size: clamp(12.5px,1.4vw,13.5px); }

        /* === STAGE v15 (sticky header, 936px) === */
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

        /* === FRAME v15 === */
        .frame { background: ${T.paper}; border-radius: 16px; padding: clamp(16px,3vw,24px); border: none; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.14); }
        .frame-soft { background: ${T.accentSoft}; border-left: 4px solid ${T.accent}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); box-shadow: 0 6px 16px -6px rgba(255,79,40,0.22); }
        .frame-success { background: ${T.successSoft}; border-left: 4px solid ${T.success}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); box-shadow: 0 6px 16px -6px rgba(31,122,77,0.22); }
        .frame-ok { background: ${T.successSoft}; border-left: 4px solid ${T.success}; border-radius: 12px; padding: 12px 15px; }
        .frame-warn { background: ${T.accentSoft}; border-left: 4px solid ${T.accent}; border-radius: 12px; padding: 12px 15px; }
        .frame-dash { border: 1.5px dashed ${T.ink3}; border-radius: 12px; padding: clamp(14px,2.5vw,20px); }
        .frame-col { display: flex; flex-direction: column; gap: 14px; }
        .savo { gap: 12px; }

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

        /* === PIZZA/STEP FLOW === */
        .pz-flow { display: flex; align-items: flex-start; gap: 4px; overflow-x: auto; padding: 4px 2px 2px; }
        .pz-step { display: flex; flex-direction: column; align-items: center; gap: 8px; min-width: 88px; flex: 0 0 auto; padding: 10px 6px; border-radius: 12px; transition: background 0.3s; }
        .pz-step.on { background: ${T.successSoft}; }
        .pz-step.active { background: ${T.accentSoft}; }
        .pz-lbl { font-size: 11.5px; text-align: center; color: ${T.ink2}; line-height: 1.3; font-weight: 500; }
        .pz-step.on .pz-lbl { color: ${T.ink}; }
        .pz-arrow { align-self: center; margin-top: 18px; color: ${T.ink3}; font-size: 15px; flex: 0 0 auto; transition: color 0.3s; }
        .pz-arrow.on { color: ${T.success}; }
        /* Vertikal oqim (mobil) — skrolsiz, hamma qadam ko'rinadi */
        .pz-flow-v { display: flex; flex-direction: column; align-items: stretch; gap: 3px; }
        .pz-rowstep { display: flex; align-items: center; gap: 12px; padding: 11px 14px; border-radius: 12px; background: ${T.bg}; transition: background 0.3s; }
        .pz-rowstep.on { background: ${T.successSoft}; }
        .pz-rowstep.active { background: ${T.accentSoft}; }
        .pz-rowic { font-size: 22px; width: 28px; text-align: center; flex-shrink: 0; }
        .pz-rowtxt { display: flex; flex-direction: column; gap: 1px; min-width: 0; }
        .pz-rowtxt b { font-size: 14px; color: ${T.ink2}; font-weight: 700; }
        .pz-rowstep.on .pz-rowtxt b { color: ${T.ink}; }
        .pz-rowtxt span { font-size: 12px; color: ${T.ink3}; }
        .pz-varrow { align-self: center; color: ${T.ink3}; font-size: 15px; line-height: 1; transition: color 0.3s; }
        .pz-varrow.on { color: ${T.success}; }

        /* === SK-INFO (anatomy/info card) === */
        .sk-info { background: ${T.paper}; border-radius: 12px; padding: 15px 17px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.16); animation: fade-step 0.3s; }
        .sk-tagbig { display: flex; align-items: center; gap: 9px; flex-wrap: wrap; }
        .sk-wordbadge { font-family: 'Manrope'; font-weight: 700; font-size: 13px; color: ${T.accent}; background: ${T.accentSoft}; padding: 4px 10px; border-radius: 6px; }

        .hint { background: ${T.bg}; border: 1.5px dashed ${T.ink3}; border-radius: 12px; padding: 14px 16px; font-size: clamp(13px,1.5vw,14px); color: ${T.ink2}; }
        .when { background: ${T.accentSoft}; border-left: 4px solid ${T.accent}; border-radius: 10px; padding: 11px 15px; }

        /* === AI CARD === */
        .ai-card { background: ${T.paper}; border-radius: 14px; padding: 15px 17px; display: flex; flex-direction: column; gap: 11px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.14); }
        .ai-row { display: flex; align-items: center; gap: 9px; } .ai-badge { font-family: 'Manrope'; font-weight: 800; font-size: 11px; color: #fff; background: ${T.blue}; padding: 3px 9px; border-radius: 6px; } .ai-bubble { font-size: 13px; color: ${T.ink2}; }
        .ai-code { background: ${CODE.bg}; border-radius: 9px; padding: 10px 12px; display: flex; flex-direction: column; gap: 3px; }
        .ai-line { font-family: 'JetBrains Mono'; font-size: 13px; color: ${CODE.text}; cursor: pointer; padding: 6px 8px; border-radius: 6px; transition: all 0.15s; } .ai-line:hover { background: rgba(255,255,255,0.06); } .ai-line .tg { color: ${CODE.tag}; }
        .ai-line.bad { background: rgba(255,79,40,0.16); box-shadow: inset 0 0 0 1px ${T.accent}; } .ai-line.ok { background: rgba(31,122,77,0.16); }
        .ai-prompt { font-size: 12px; color: ${T.ink3}; margin: 0; font-style: italic; } .note-h { font-weight: 700; font-size: 13px; margin: 0 0 4px; }
        .takeaway { background: ${T.accentSoft}; border-radius: 14px; padding: 20px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 5px; } .ta-bulb { font-size: 34px; } .ta-h { font-family: 'Source Serif 4', serif; font-weight: 600; font-size: clamp(16px,2.2vw,20px); color: ${T.ink}; margin: 0; } .ta-sub { color: ${T.accent}; font-weight: 600; font-size: 13px; margin: 0; }

        /* === YAKUN (Screen16) === */
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

        /* MOBIL: yig'iladigan Mentor (skrollni kamaytirish) */
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
