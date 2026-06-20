import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';

// ============================================================
// HTML 1-DARS — PLATFORM STANDARD v15 (Notion: design_system + platform_contract + infrastructure_v1)
// Arxitektura va asosiy dizayn — Notiondan. 17 ekran bizning kontentimiz.
// PRODUCTION: <style> ichidagi @import OLIB TASHLANADI — shriftlarni LMS yuklaydi.
// Eslatma: ekran-spetsifik widget bezaklari page-by-page bosqichida yakuniy sayqal oladi.
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
const useT = () => {
  const lang = useLang();
  return useCallback((node) => {
    if (node === null || node === undefined) return '';
    if (typeof node === 'string') return node;
    if (React.isValidElement(node)) return node;
    if (node[lang] !== undefined) return node[lang];
    return node.uz ?? node.ru ?? '';
  }, [lang]);
};

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

const LESSON_META = { lessonId: 'css-01-v16', lessonTitle: { uz: 'CSS asoslari: ranglar, shriftlar, bo\'shliqlar', ru: 'CSS руками — часть 1' } };
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

const CodeBox = ({ children }) => <pre className="code-box">{children}</pre>;
const Tg = ({ children }) => <span style={{ color: CODE.tag }}>{children}</span>;
const At = ({ children }) => <span style={{ color: CODE.attr }}>{children}</span>;
const Sr = ({ children }) => <span style={{ color: CODE.str }}>{children}</span>;
const Preview = ({ children, title = 'preview.html', minH }) => (
  <div className="bp-window"><div className="bp-bar"><span className="bb-dots"><i /><i /><i /></span><span className="bp-title">{title}</span></div><div className="bp-body" style={{ minHeight: minH }}>{children}</div></div>
);
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

// ===== DEMO KARTA (CSS bor/yo'q solishtirish) =====
const DemoCard = ({ on }) => (
  <div style={on
    ? { background: '#fff', borderRadius: 14, padding: 18, boxShadow: `0 8px 22px -8px rgba(${T.shadowBase},0.18)`, textAlign: 'center' }
    : { background: 'transparent', padding: 4, textAlign: 'left' }}>
    <div style={{ width: 50, height: 50, borderRadius: on ? '50%' : 0, background: on ? T.accent : '#bbb', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 22, fontFamily: on ? "'Manrope', sans-serif" : "'Times New Roman', serif", margin: on ? '0 auto 8px' : '0 0 4px', transition: 'all 0.3s' }}>A</div>
    <h1 style={on ? { fontFamily: "'Manrope', sans-serif", fontSize: 22, color: T.ink, margin: '0 0 2px' } : { fontFamily: "'Times New Roman', serif", fontSize: 30, color: '#000', margin: '0 0 2px' }}>Aziza</h1>
    <p style={on ? { fontFamily: "'Manrope', sans-serif", color: T.accent, fontWeight: 600, fontSize: 13, margin: '0 0 12px' } : { fontFamily: "'Times New Roman', serif", color: '#000', fontSize: 16, margin: '0 0 8px' }}>Web-dasturchi</p>
    <span style={on ? { display: 'inline-block', background: T.accent, color: '#fff', borderRadius: 8, padding: '8px 18px', fontFamily: "'Manrope', sans-serif", fontWeight: 700, fontSize: 13 } : { fontFamily: "'Times New Roman', serif", color: '#0000ee', fontSize: 16, textDecoration: 'underline' }}>Obuna</span>
  </div>
);

// ===== SCREEN 0 — HOOK =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const audio = useAudio([{ id: 's0', text: `Mana ikkita sahifa. Ichidagi matn — bir xil, bitta harf ham farq qilmaydi. Lekin biri oddiy, biri chiroyli. Sizningcha, nima ularni farqlaydi? Tugmani bosib, ikkalasini solishtiring.`, trigger: 'on_mount', waits_for: { type: 'option_picked' } }]);
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const [on, setOn] = useState(false);
  const OPTS = [
    { id: 'a', label: 'HTML — sahifa tuzilishi' },
    { id: 'b', label: 'CSS — bezak (dizayn) tili' },
    { id: 'c', label: 'Yangi rasm qo’shilgan' }
  ];
  const pick = (v) => { if (picked !== null) return; setPicked(v); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: true }); audio.triggerEvent('option_picked'); };
  return (
    <Stage eyebrow="Kirish" screen={screen} audioState={audio} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 760 }}>Bir xil matn — nega biri <span className="italic" style={{ color: T.accent }}>chiroyli</span>?</h1>
        <Mentor>Mana ikkita sahifa. Ichidagi matn — <b style={{ color: T.ink }}>bir xil</b>, bitta harf ham farq qilmaydi. Lekin biri oddiy, biri chiroyli. Tugmani bosib, farqni ko'ring.</Mentor>
        <Split>
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${!on ? 'chip-on' : ''}`} onClick={() => setOn(false)}>Oddiy</button>
              <button className={`chip ${on ? 'chip-on' : ''}`} onClick={() => setOn(true)}>✨ Bezakli</button>
            </div>
            <Preview title="profil.html" minH={170}><div key={on ? 'on' : 'off'} className="demo-swap" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 130 }}><DemoCard on={on} /></div></Preview>
            <p className="mono small" style={{ color: T.ink3, margin: 0, textAlign: 'center' }}>{on ? '✨ CSS qo’shilgan — ranglar, shrift, bo’shliq' : 'CSS yo’q — brauzerning oddiy ko’rinishi'}</p>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Sizningcha, nima ularni farqlaydi?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => { const sel = picked === o.id; return (<button key={o.id} className={`hook-option ${sel ? 'on' : ''}`} disabled={picked !== null} onClick={() => pick(o.id)}><span className="radio">{sel && <span className="radio-dot" />}</span><span>{o.label}</span></button>); })}
            </div>
            {picked !== null && <p className="hook-ack fade-step">Aynan! HTML — skelet, CSS esa uni bezaydi: ranglar, shriftlar, bo'shliqlar.</p>}
          </Col>
        </Split>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's1', text: `HTML bilan sahifa skeletini qurdingiz. Endi CSS bilan uni bezaymiz. Bugun 5 qadamda o'rganasiz: CSS nima, qanday yoziladi, ranglar, shriftlar va bo'shliqlar. Dars oxirida mana shunday chiroyli karta yasaysiz.`, trigger: 'on_mount', waits_for: null }]);
  const STEPS = [
    { text: 'CSS nima?', tag: 'bezak tili' },
    { text: 'Qanday yoziladi', tag: 'selektor { ... }' },
    { text: 'Ranglar', tag: 'color, background' },
    { text: 'Shriftlar', tag: 'font-family, size' },
    { text: 'Bo’shliqlar', tag: 'padding, margin' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const PreviewBlock = (
    <Col>
      <p className="flow-label">Dars oxirida shu kartani bezaysiz</p>
      <Preview title="mening-kartam.html" minH={200}><div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 160 }}><DemoCard on={true} /></div></Preview>
    </Col>
  );
  const StepsBlock = (
    <Col>
      <p className="flow-label">5 qadam</p>
      <ol className="roadmap">{STEPS.map((s, i) => (<li key={i} className="step-card fade-up" style={{ animationDelay: `${0.08 + i * 0.05}s` }}><span className="step-num">{String(i + 1).padStart(2, '0')}</span><span className="step-body"><span className="step-text">{s.text}</span>{s.tag && <span className="step-tag">{s.tag}</span>}</span></li>))}</ol>
    </Col>
  );
  return (
    <Stage eyebrow="Reja" screen={screen} audioState={audio} mentorStatic navContent={<><NavBack onPrev={onPrev} /><NavNext label="Boshlaymiz →" onClick={onNext} /></>}>
      <div className="screen">
        <div className="head"><h2 className="title h-title fade-up"><span className="italic" style={{ color: T.accent }}>Sahifani bezashni o'rganamiz!</span></h2></div>
        <Mentor>HTML bilan sahifa <b style={{ color: T.ink }}>skeletini</b> qurdingiz. Endi <b style={{ color: T.ink }}>CSS</b> bilan uni bezaymiz: ranglar, shriftlar, bo'shliqlar. <b style={{ color: T.ink }}>5 qadamda</b> o'rganamiz.</Mentor>
        {!isNarrow ? (<Split>{PreviewBlock}{StepsBlock}</Split>)
          : !showSteps ? (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>{PreviewBlock}<button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>📋 5 qadamni ko'rish</button></div>)
          : (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}><button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ Natijani ko'rish</button>{StepsBlock}</div>)}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — CSS NIMA (skelet vs bezak) =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's2', text: `Yaxshi taqqoslash: HTML — uyning skeleti, devorlar va xonalar. CSS — bo'yoq, mebel, pardalar. Skelet bo'lmasa uy qulaydi, bezak bo'lmasa uy quruq. Ikkalasi birga kerak. Tugmani bosib, CSS'ni yoqing.`, trigger: 'on_mount', waits_for: null }]);
  const [on, setOn] = useState(!!storedAnswer);
  const done = on;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="CSS nima" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? "Davom etish" : "CSS'ni yoqing"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">HTML va CSS — <span className="italic" style={{ color: T.accent }}>vazifasi</span> nimada?</h2></div>
        <Mentor>Yaxshi taqqoslash: <b style={{ color: T.ink }}>HTML</b> — uyning skeleti (devorlar, xonalar). <b style={{ color: T.ink }}>CSS</b> — bo'yoq, mebel, pardalar. Skelet bo'lmasa uy qulaydi, bezak bo'lmasa uy quruq. Tugmani bosib, CSS'ni yoqing.</Mentor>
        <div className="split">
          <div className="col">
            <div className="flow-label">{on ? 'HTML + CSS' : 'Faqat HTML'}</div>
            <Preview title="sahifa.html" minH={170}><div key={on ? 'on' : 'off'} className="demo-swap" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 130 }}><DemoCard on={on} /></div></Preview>
            <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setOn(o => !o)}>{on ? '↩ CSS’ni o’chirish' : '🎨 CSS’ni yoqish'}</button>
          </div>
          <div className="col">
            <div className="ana2"><div className="ana2-row"><span className="ana2-tag">HTML</span><span className="ana2-txt">🏗️ skelet — tuzilish, kontent</span></div><div className="ana2-row"><span className="ana2-tag ana2-css">CSS</span><span className="ana2-txt">🎨 bezak — rang, shrift, bo'shliq</span></div></div>
            <div className={on ? 'frame-success fade-step' : 'hint'}><p className="body" style={{ margin: 0, color: T.ink }}>{on ? <>✓ Bir xil HTML, lekin CSS qo'shildi — va sahifa <b>jonlandi</b>. Kontent o'zgarmadi, faqat <b>ko'rinishi</b> o'zgardi.</> : <>Hozir faqat HTML — brauzerning quruq ko'rinishi. CSS qo'shilsa, sahifa chiroyli bo'ladi.</>}</p></div>
          </div>
        </div>
      </div>
    </Stage>
  );
};
// ===== SCREEN 3 — SINTAKSIS =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's3', text: `CSS qoidasi 3 qismdan iborat. Selektor — qaysi elementni bezashni aytadi. Xususiyat — nimani o'zgartirishni. Qiymat — qanday bo'lishini. Mana: h1 ochiq qavs, color ikki nuqta red nuqta-vergul, yopiq qavs. Har bir qismni bosib, vazifasini ko'ring.`, trigger: 'on_mount', waits_for: null }]);
  const PARTS = {
    sel: { label: 'Selektor', role: "Qaysi elementni bezashni ko'rsatadi. Bu yerda h1 — sahifadagi barcha h1 sarlavhalar." },
    prop: { label: 'Xususiyat', role: "Nimani o'zgartirishni aytadi. color — matn rangi." },
    val: { label: 'Qiymat', role: "Qanday bo'lishini aytadi. red — qizil rang." }
  };
  const [active, setActive] = useState(null);
  const [clicked, setClicked] = useState(new Set());
  const isNarrow = useIsMobile(768);
  const done = clicked.size === 3;
  const tap = (k) => { setActive(k); setClicked(prev => { const n = new Set(prev); n.add(k); return n; }); };
  const cp = (k) => `csspart ${active === k ? 'on' : ''} ${clicked.has(k) ? 'seen' : ''}`;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Sintaksis" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? "Davom etish" : `${clicked.size}/3 qism ko'rilgan`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">CSS qoidasi qanday <span className="italic" style={{ color: T.accent }}>yoziladi</span>?</h2></div>
        <Mentor>CSS qoidasi 3 qismdan iborat: <b style={{ color: T.ink }}>selektor</b> (qaysi element), <b style={{ color: T.ink }}>xususiyat</b> (nima), <b style={{ color: T.ink }}>qiymat</b> (qanday). Har bir qismni bosib, vazifasini ko'ring.</Mentor>
        <div className="split">
          <div className="col">
            <pre className="code-box fade-up delay-2" style={{ fontSize: 'clamp(16px,2.6vw,22px)', textAlign: 'center', lineHeight: 2 }}>
              <span className={cp('sel')} onClick={() => tap('sel')} style={{ color: CODE.tag }}>h1</span>
              <span style={{ color: CODE.text }}>{' { '}</span>
              <span className={cp('prop')} onClick={() => tap('prop')} style={{ color: CODE.attr }}>color</span>
              <span style={{ color: CODE.text }}>: </span>
              <span className={cp('val')} onClick={() => tap('val')} style={{ color: CODE.str }}>red</span>
              <span style={{ color: CODE.text }}>; </span>
              <span style={{ color: CODE.text }}>{'}'}</span>
            </pre>
            <div className="csslegend fade-up delay-2">
              {['sel', 'prop', 'val'].map(k => (<span key={k} className={`csstab ${clicked.has(k) ? 'seen' : ''} ${active === k ? 'on' : ''}`} onClick={() => tap(k)}>{clicked.has(k) ? '✓' : '•'} {PARTS[k].label}</span>))}
            </div>
          </div>
          <div className="col">
            {done ? (
              <div className="frame-success fade-step"><p className="small mono" style={{ margin: '0 0 4px', fontWeight: 600, color: T.success, textTransform: 'uppercase', letterSpacing: '0.08em' }}>✓ Sintaksisni o'rgandingiz</p><p className="body" style={{ margin: 0, color: T.ink }}><b>selektor { '{' } xususiyat: qiymat; { '}' }</b> — barcha CSS shu shaklda yoziladi.</p></div>
            ) : active ? (
              <div className="sk-info fade-step" key={active}><span className="sk-tagbig"><span className="sk-wordbadge">{PARTS[active].label}</span></span><p className="body" style={{ color: T.ink, margin: '11px 0 0' }}>{PARTS[active].role}</p></div>
            ) : (!isNarrow ? <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Koddan bir qismni bosing</p></div> : null)}
            <div className="frame-soft"><p className="body" style={{ margin: 0, color: T.ink }}><b>Eslatma:</b> har bir qator <span className="mono">;</span> (nuqta-vergul) bilan tugaydi — bu juda muhim!</p></div>
          </div>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST (sintaksis) =====
const Screen4 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 1-savol"
    audioText="CSS qoidasida color ikki nuqta red — bu yerda color nima deb ataladi?"
    questionText="h1 { color: red; } — bu yerda 'color' nima deb ataladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}><span className="mono">h1 {'{'} color: red; {'}'}</span> — bu yerda <span className="italic" style={{ color: T.accent }}>color</span> nima deb ataladi?</h2></>}
    options={['Selektor', 'Qiymat', 'Teg', 'Xususiyat (property)']} correctIdx={3}
    explainCorrect="To'g'ri! color — bu xususiyat (property): nimani o'zgartirishni aytadi. Bu yerda — matn rangini."
    explainWrong={{ 0: 'Selektor — bu h1 (qaysi element). color esa xususiyat.', 1: 'Qiymat — bu red (qanday). color esa xususiyat.', 2: 'Teg — bu HTML tushunchasi. CSS’da color — xususiyat.', default: 'color — bu xususiyat (property).' }} />
);

// ===== SCREEN 5 — RANGLAR =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's5', text: `Eng yoqimli qism — ranglar. Ikki xususiyat bor: color matn rangini, background-color esa fon rangini o'zgartiradi. Pastdagi ranglardan tanlab, kartani bo'yang.`, trigger: 'on_mount', waits_for: null }]);
  const TEXTC = [{ n: 'Qora', v: '#0E0E10' }, { n: 'Oq', v: '#FFFFFF' }, { n: 'Qizil', v: '#E03131' }, { n: 'Ko’k', v: '#1971C2' }];
  const BGC = [{ n: 'Oq', v: '#FFFFFF' }, { n: 'Sariq', v: '#FFE066' }, { n: 'Pushti', v: '#FF8787' }, { n: 'Ko’k', v: '#4DABF7' }];
  const [tc, setTc] = useState(storedAnswer?.tc || '#0E0E10');
  const [bg, setBg] = useState(storedAnswer?.bg || '#FFFFFF');
  const [touched, setTouched] = useState(!!storedAnswer);
  const done = touched;
  const set = (kind, v) => { if (kind === 'tc') setTc(v); else setBg(v); setTouched(true); if (storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true, tc, bg }); };
  return (
    <Stage eyebrow="Ranglar" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? "Davom etish" : "Rang tanlang"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Matn va fonni qanday <span className="italic" style={{ color: T.accent }}>bo'yaymiz</span>?</h2></div>
        <Mentor>Ikki xususiyat: <span className="mono">color</span> — matn rangi, <span className="mono">background-color</span> — fon rangi. Pastdagi ranglardan tanlab, kartani bo'yang.</Mentor>
        <div className="split">
          <div className="col">
            <div className="fade-up delay-2"><p className="flow-label" style={{ marginBottom: 6 }}>color — matn rangi</p><div className="swatches">{TEXTC.map(c => (<button key={c.v} className={`swatch ${tc === c.v ? 'on' : ''}`} onClick={() => set('tc', c.v)} style={{ background: c.v }} title={c.n}>{tc === c.v && <span style={{ color: c.v === '#FFFFFF' ? '#000' : '#fff' }}>✓</span>}</button>))}</div></div>
            <div className="fade-up delay-2"><p className="flow-label" style={{ marginBottom: 6 }}>background-color — fon rangi</p><div className="swatches">{BGC.map(c => (<button key={c.v} className={`swatch ${bg === c.v ? 'on' : ''}`} onClick={() => set('bg', c.v)} style={{ background: c.v }} title={c.n}>{bg === c.v && <span style={{ color: '#000' }}>✓</span>}</button>))}</div></div>
            <pre className="code-box fade-up delay-3" style={{ fontSize: 'clamp(12px,1.7vw,14px)' }}><span style={{ color: CODE.tag }}>.karta</span> {'{'}{'\n  '}<span style={{ color: CODE.attr }}>color</span>: <span style={{ color: CODE.str }}>{tc}</span>;{'\n  '}<span style={{ color: CODE.attr }}>background-color</span>: <span style={{ color: CODE.str }}>{bg}</span>;{'\n'}{'}'}</pre>
          </div>
          <div className="col">
            <div className="flow-label">Natija</div>
            <Preview title="karta.html" minH={150}><div style={{ background: bg, color: tc, borderRadius: 12, padding: 20, textAlign: 'center', transition: 'all 0.3s', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.06)' }}><h1 style={{ fontFamily: 'Georgia, serif', fontSize: 24, margin: '0 0 6px', color: tc }}>Salom! 👋</h1><p style={{ fontFamily: 'Georgia, serif', fontSize: 15, margin: 0, color: tc, opacity: 0.85 }}>Bu mening kartam.</p></div></Preview>
          </div>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 5b — TEST (ranglar) =====
const Screen5b = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Tekshiruv"
    audioText="Matnning rangini qaysi xususiyat o'zgartiradi?"
    questionText="Matnning rangini qaysi xususiyat o'zgartiradi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Mustahkamlash</p><h2 className="title h-sub" style={{ marginTop: 8 }}><span className="italic" style={{ color: T.accent }}>Matnning</span> rangini qaysi xususiyat o'zgartiradi?</h2></>}
    options={['background-color', 'color', 'font-size', 'margin']} correctIdx={1}
    explainCorrect="To'g'ri! color — matnning (harflarning) rangini o'zgartiradi."
    explainWrong={{ 0: 'background-color — bu fon rangi, matn emas. Matn uchun — color.', 2: 'font-size — shrift o’lchami. Rang uchun — color.', 3: 'margin — tashqi bo’shliq. Rang uchun — color.', default: 'Matn rangi — color xususiyati.' }} />
);
// ===== SCREEN 6 — RANG FORMATLARI (nom / hex) =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's6', text: `Rangni ikki xil yozish mumkin: nom bilan, masalan red, yoki maxsus hex kod bilan, masalan panjara FF4F28. Nomlar oson, lekin kam. Hex kod esa millionlab rangni aniq beradi. Ranglardan birini bosib, ikkala yozuvini ko'ring.`, trigger: 'on_mount', waits_for: null }]);
  const COLORS = [{ n: 'red', hex: '#E03131' }, { n: 'orange', hex: '#FF4F28' }, { n: 'gold', hex: '#F59F00' }, { n: 'green', hex: '#2F9E44' }, { n: 'teal', hex: '#0CA678' }, { n: 'blue', hex: '#1971C2' }, { n: 'purple', hex: '#7048E8' }, { n: 'pink', hex: '#E64980' }];
  const [sel, setSel] = useState(storedAnswer ? (storedAnswer.sel ?? 1) : null);
  const done = sel !== null;
  const cur = sel !== null ? COLORS[sel] : null;
  const pick = (i) => { setSel(i); if (storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true, sel: i }); };
  return (
    <Stage eyebrow="Rang formatlari" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? "Davom etish" : "Rangni tanlang"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Rang nomini <span className="italic" style={{ color: T.accent }}>raqamda</span> qanday yozamiz?</h2></div>
        <Mentor>Rangni ikki xil yozish mumkin: <b style={{ color: T.ink }}>nom</b> bilan (<span className="mono">red</span>) yoki <b style={{ color: T.ink }}>hex kod</b> bilan (<span className="mono">#FF4F28</span>). Nomlar oddiy, lekin kam. Hex esa millionlab rangni aniq beradi. Rangni bosing.</Mentor>
        <div className="split">
          <div className="col">
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Rang tanlang</p>
            <div className="swatches fade-up delay-2" style={{ flexWrap: 'wrap' }}>{COLORS.map((c, i) => (<button key={c.hex} className={`swatch ${sel === i ? 'on' : ''}`} onClick={() => pick(i)} style={{ background: c.hex }} title={c.n}>{sel === i && <span style={{ color: '#fff' }}>✓</span>}</button>))}</div>
          </div>
          <div className="col">
            {done ? (
              <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ height: 70, borderRadius: 12, background: cur.hex, boxShadow: `0 8px 20px -8px ${cur.hex}` }} />
                <div className="hexrow"><span className="hexlbl">nom</span><span className="mono hexval">{cur.n}</span></div>
                <div className="hexrow"><span className="hexlbl">hex kod</span><span className="mono hexval">{cur.hex}</span></div>
                <div className="frame-soft"><p className="body" style={{ margin: 0, color: T.ink }}>Hex <b>#</b> bilan boshlanadi va 6 ta belgidan iborat. Har juftlik — qizil, yashil, ko'k miqdori. Dizaynerlar shu kodlardan foydalanadi.</p></div>
              </div>
            ) : (<div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Rangni bosing — nom va hex kodi chiqadi</p></div>)}
          </div>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — SHRIFTLAR =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's7', text: `Shrift sahifaning ovozi kabi. font-family shrift turini, font-size esa o'lchamini belgilaydi. Turini va o'lchamini almashtirib, matn qanday o'zgarishini ko'ring.`, trigger: 'on_mount', waits_for: null }]);
  const FONTS = [{ k: 'sans', l: 'Sans', css: 'sans-serif', ff: "'Manrope', sans-serif" }, { k: 'serif', l: 'Serif', css: 'serif', ff: 'Georgia, serif' }, { k: 'mono', l: 'Mono', css: 'monospace', ff: "'JetBrains Mono', monospace" }];
  const SIZES = [{ l: 'Kichik', v: 16 }, { l: "O'rta", v: 24 }, { l: 'Katta', v: 34 }];
  const [font, setFont] = useState(storedAnswer?.font || 'sans');
  const [size, setSize] = useState(storedAnswer?.size || 24);
  const [touched, setTouched] = useState(!!storedAnswer);
  const done = touched;
  const cur = FONTS.find(f => f.k === font);
  const change = (kind, v) => { if (kind === 'f') setFont(v); else setSize(v); setTouched(true); if (storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true, font, size }); };
  return (
    <Stage eyebrow="Shriftlar" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? "Davom etish" : "Shriftni o'zgartiring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Matnning <span className="italic" style={{ color: T.accent }}>turini</span> qanday tanlaymiz?</h2></div>
        <Mentor>Shrift — sahifaning ovozi. <span className="mono">font-family</span> shrift turini, <span className="mono">font-size</span> o'lchamini belgilaydi. Turini va o'lchamini almashtiring.</Mentor>
        <div className="split">
          <div className="col">
            <div className="fade-up delay-2"><p className="flow-label" style={{ marginBottom: 6 }}>font-family — turi</p><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{FONTS.map(f => (<button key={f.k} className={`chip ${font === f.k ? 'chip-on' : ''}`} onClick={() => change('f', f.k)} style={{ fontFamily: f.ff }}>{f.l}</button>))}</div></div>
            <div className="fade-up delay-2"><p className="flow-label" style={{ marginBottom: 6 }}>font-size — o'lchami</p><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{SIZES.map(s => (<button key={s.v} className={`chip ${size === s.v ? 'chip-on' : ''}`} onClick={() => change('s', s.v)}>{s.l}</button>))}</div></div>
            <pre className="code-box fade-up delay-3" style={{ fontSize: 'clamp(12px,1.7vw,14px)' }}><span style={{ color: CODE.tag }}>h1</span> {'{'}{'\n  '}<span style={{ color: CODE.attr }}>font-family</span>: <span style={{ color: CODE.str }}>{cur.css}</span>;{'\n  '}<span style={{ color: CODE.attr }}>font-size</span>: <span style={{ color: CODE.str }}>{size}px</span>;{'\n'}{'}'}</pre>
          </div>
          <div className="col">
            <div className="flow-label">Natija</div>
            <Preview title="matn.html" minH={150}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 120 }}><h1 key={font + size} className="fade-step" style={{ fontFamily: cur.ff, fontSize: size, color: T.ink, margin: 0, textAlign: 'center', transition: 'font-size 0.2s' }}>Salom, dunyo!</h1></div></Preview>
          </div>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — QALINLIK VA TEKISLASH =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's8', text: `Yana ikki foydali xususiyat. font-weight matnni qalin qiladi — bold. text-align esa matnni joylashtiradi: chapga, markazga yoki o'ngga. Ikkalasini sinab ko'ring.`, trigger: 'on_mount', waits_for: null }]);
  const ALIGNS = [{ k: 'left', l: '⬅ Chap' }, { k: 'center', l: '⬌ Markaz' }, { k: 'right', l: 'O’ng ➡' }];
  const [bold, setBold] = useState(!!storedAnswer?.bold);
  const [align, setAlign] = useState(storedAnswer?.align || 'left');
  const [bt, setBt] = useState(!!storedAnswer);
  const [at, setAt] = useState(!!storedAnswer);
  const done = bt && at;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true, bold, align }); }, [done]);
  return (
    <Stage eyebrow="Qalinlik · tekislash" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? "Davom etish" : "Ikkalasini sinang"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Matnni <span className="italic" style={{ color: T.accent }}>qalin</span> va joyiga qanday qo'yamiz?</h2></div>
        <Mentor><span className="mono">font-weight: bold</span> — matnni qalin qiladi. <span className="mono">text-align</span> — matnni joylashtiradi: chap, markaz yoki o'ng. Ikkalasini sinang.</Mentor>
        <div className="split">
          <div className="col">
            <div className="fade-up delay-2"><p className="flow-label" style={{ marginBottom: 6 }}>font-weight</p><button className={`chip ${bold ? 'chip-on' : ''}`} onClick={() => { setBold(b => !b); setBt(true); }}><b>B</b> {bold ? 'bold ✓' : 'normal'}</button></div>
            <div className="fade-up delay-2"><p className="flow-label" style={{ marginBottom: 6 }}>text-align</p><div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{ALIGNS.map(a => (<button key={a.k} className={`chip ${align === a.k ? 'chip-on' : ''}`} onClick={() => { setAlign(a.k); setAt(true); }}>{a.l}</button>))}</div></div>
            <pre className="code-box fade-up delay-3" style={{ fontSize: 'clamp(12px,1.7vw,14px)' }}><span style={{ color: CODE.tag }}>p</span> {'{'}{'\n  '}<span style={{ color: CODE.attr }}>font-weight</span>: <span style={{ color: CODE.str }}>{bold ? 'bold' : 'normal'}</span>;{'\n  '}<span style={{ color: CODE.attr }}>text-align</span>: <span style={{ color: CODE.str }}>{align}</span>;{'\n'}{'}'}</pre>
          </div>
          <div className="col">
            <div className="flow-label">Natija</div>
            <Preview title="matn.html" minH={130}><p style={{ fontFamily: 'Georgia, serif', fontSize: 18, color: T.ink, margin: 0, fontWeight: bold ? 700 : 400, textAlign: align, transition: 'all 0.2s' }}>Men CSS o'rganyapman!</p></Preview>
          </div>
        </div>
      </div>
    </Stage>
  );
};
// ===== SCREEN 9 — TEST (shriftlar) =====
const Screen9 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 2-savol"
    audioText="Shriftning o'lchamini qaysi xususiyat belgilaydi?"
    questionText="Shriftning o'lchamini (kattaligini) qaysi xususiyat belgilaydi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Shriftning <span className="italic" style={{ color: T.accent }}>o'lchamini</span> qaysi xususiyat belgilaydi?</h2></>}
    options={['color', 'font-family', 'font-size', 'padding']} correctIdx={2}
    explainCorrect="To'g'ri! font-size — shriftning o'lchamini (masalan 24px) belgilaydi."
    explainWrong={{ 0: 'color — matn rangi, o’lcham emas. O’lcham — font-size.', 1: 'font-family — shrift turi (Sans, Serif). O’lcham — font-size.', 3: 'padding — ichki bo’shliq. Shrift o’lchami — font-size.', default: 'Shrift o’lchami — font-size xususiyati.' }} />
);

// ===== SCREEN 10 — PADDING (ichki bo'shliq) =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's10', text: `Bo'shliq ham dizaynning bir qismi. padding — ichki bo'shliq: kontent bilan elementning cheti orasidagi joy. Xuddi ramka ichidagi hoshiya kabi — surat chetga yopishib turmaydi. Qiymatni o'zgartirib, ichki bo'shliq qanday kengayishini ko'ring.`, trigger: 'on_mount', waits_for: null }]);
  const PADS = [{ l: "Yo'q", v: 0 }, { l: 'Kichik', v: 12 }, { l: "O'rta", v: 26 }, { l: 'Katta', v: 42 }];
  const [pad, setPad] = useState(storedAnswer ? (storedAnswer.pad ?? 26) : 12);
  const [touched, setTouched] = useState(!!storedAnswer);
  const done = touched;
  const set = (v) => { setPad(v); setTouched(true); if (storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true, pad: v }); };
  return (
    <Stage eyebrow="padding" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? "Davom etish" : "Bo'shliqni o'zgartiring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Kontent ichida <span className="italic" style={{ color: T.accent }}>bo'shliq</span> qanday beriladi?</h2></div>
        <Mentor><span className="mono">padding</span> — <b style={{ color: T.ink }}>ichki bo'shliq</b>: kontent bilan elementning cheti orasidagi joy. Xuddi ramka ichidagi hoshiya kabi. Qiymatni o'zgartiring.</Mentor>
        <div className="split">
          <div className="col">
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>padding qiymati</p>
            <div className="fade-up delay-2" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{PADS.map(p => (<button key={p.v} className={`chip ${pad === p.v ? 'chip-on' : ''}`} onClick={() => set(p.v)}>{p.l} ({p.v}px)</button>))}</div>
            <pre className="code-box fade-up delay-3" style={{ fontSize: 'clamp(12px,1.7vw,14px)' }}><span style={{ color: CODE.tag }}>.karta</span> {'{'}{'\n  '}<span style={{ color: CODE.attr }}>padding</span>: <span style={{ color: CODE.str }}>{pad}px</span>;{'\n'}{'}'}</pre>
          </div>
          <div className="col">
            <div className="flow-label">Natija (sariq — ichki bo'shliq)</div>
            <Preview title="padding.html" minH={150}><div style={{ display: 'flex', justifyContent: 'center' }}><div style={{ background: '#FFE066', borderRadius: 12, padding: pad, transition: 'padding 0.25s' }}><div style={{ background: '#fff', borderRadius: 8, padding: '14px 18px', textAlign: 'center', boxShadow: `0 4px 12px -6px rgba(${T.shadowBase},0.2)`, fontFamily: "'Manrope', sans-serif", fontWeight: 600, color: T.ink }}>Kontent</div></div></div></Preview>
            <div className="frame-soft"><p className="body" style={{ margin: 0, color: T.ink }}>Sariq zona — <b>padding</b>. Qancha katta bo'lsa, kontent chetdan shuncha uzoq turadi.</p></div>
          </div>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — MARGIN (tashqi bo'shliq) =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's11', text: `padding ichki bo'shliq edi. margin esa tashqi bo'shliq — element bilan qo'shnilari orasidagi masofa. Xuddi odamlar orasidagi shaxsiy joy kabi. Qiymatni o'zgartirib, ikki karta orasi qanday ochilishini ko'ring.`, trigger: 'on_mount', waits_for: null }]);
  const MARGS = [{ l: "Yo'q", v: 0 }, { l: 'Kichik', v: 10 }, { l: "O'rta", v: 24 }, { l: 'Katta', v: 44 }];
  const [mar, setMar] = useState(storedAnswer ? (storedAnswer.mar ?? 24) : 10);
  const [touched, setTouched] = useState(!!storedAnswer);
  const done = touched;
  const set = (v) => { setMar(v); setTouched(true); if (storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true, mar: v }); };
  const box = { background: '#fff', borderRadius: 10, padding: '14px 16px', textAlign: 'center', fontFamily: "'Manrope', sans-serif", fontWeight: 600, color: T.ink, boxShadow: `0 4px 12px -6px rgba(${T.shadowBase},0.2)` };
  return (
    <Stage eyebrow="margin" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? "Davom etish" : "Masofani o'zgartiring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Elementlar <span className="italic" style={{ color: T.accent }}>orasidagi</span> masofa-chi?</h2></div>
        <Mentor><span className="mono">margin</span> — <b style={{ color: T.ink }}>tashqi bo'shliq</b>: element bilan qo'shnilari orasidagi masofa. Xuddi odamlar orasidagi shaxsiy joy kabi. Qiymatni o'zgartiring.</Mentor>
        <div className="split">
          <div className="col">
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>margin qiymati</p>
            <div className="fade-up delay-2" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{MARGS.map(m => (<button key={m.v} className={`chip ${mar === m.v ? 'chip-on' : ''}`} onClick={() => set(m.v)}>{m.l} ({m.v}px)</button>))}</div>
            <pre className="code-box fade-up delay-3" style={{ fontSize: 'clamp(12px,1.7vw,14px)' }}><span style={{ color: CODE.tag }}>.karta</span> {'{'}{'\n  '}<span style={{ color: CODE.attr }}>margin-bottom</span>: <span style={{ color: CODE.str }}>{mar}px</span>;{'\n'}{'}'}</pre>
          </div>
          <div className="col">
            <div className="flow-label">Natija (ko'k — tashqi bo'shliq)</div>
            <Preview title="margin.html" minH={150}><div style={{ background: '#D0EBFF', borderRadius: 12, padding: 12 }}><div style={{ ...box, marginBottom: mar, transition: 'margin 0.25s' }}>Karta 1</div><div style={box}>Karta 2</div></div></Preview>
            <div className="frame-soft"><p className="body" style={{ margin: 0, color: T.ink }}>Ko'k zona — <b>margin</b>: kartalar orasini ochadi. <b>padding</b> ichkarida, <b>margin</b> tashqarida.</p></div>
          </div>
        </div>
      </div>
    </Stage>
  );
};
// ===== SCREEN 12 — TEST (padding/margin) =====
const Screen12 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 3-savol"
    audioText="Element ichidagi bo'shliq, ya'ni kontent bilan chet orasidagi joy, qaysi xususiyat?"
    questionText="Kontent bilan elementning cheti orasidagi ichki bo'shliq qaysi xususiyat?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Kontent bilan elementning cheti orasidagi <span className="italic" style={{ color: T.accent }}>ichki</span> bo'shliq qaysi xususiyat?</h2></>}
    options={['margin', 'color', 'font-size', 'padding']} correctIdx={3}
    explainCorrect="To'g'ri! padding — ichki bo'shliq (kontent bilan chet orasida)."
    explainWrong={{ 0: 'margin — tashqi bo’shliq (elementlar orasida). Ichki — padding.', 1: 'color — matn rangi, bo’shliq emas.', 2: 'font-size — shrift o’lchami. Ichki bo’shliq — padding.', default: 'Ichki bo’shliq — padding.' }} />
);

// ===== SCREEN 13 — BUILDER (kartani bezat) =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's13', text: `Vaqti keldi — o'zingiz karta bezaysiz. Quyidagi xususiyatlarni yoqib, kartani jonlantiring. Kamida 3 ta xususiyat qo'shing — kod o'zi yoziladi.`, trigger: 'on_mount', waits_for: null }]);
  const PROPS = [
    { k: 'color', label: '🎨 Matn rangi', css: 'color', val: '#E03131' },
    { k: 'background', label: '🟨 Fon rangi', css: 'background-color', val: '#FFF3BF' },
    { k: 'font', label: '🔤 Serif shrift', css: 'font-family', val: 'Georgia, serif' },
    { k: 'size', label: '🔠 Katta shrift', css: 'font-size', val: '26px' },
    { k: 'padding', label: '↔ Ichki bo’shliq', css: 'padding', val: '26px' },
    { k: 'radius', label: '⬭ Yumaloq chet', css: 'border-radius', val: '16px' }
  ];
  const [ap, setAp] = useState(storedAnswer?.ap || {});
  const count = Object.values(ap).filter(Boolean).length;
  const done = count >= 3;
  const toggle = (k) => setAp(p => ({ ...p, [k]: !p[k] }));
  const P = (k) => !!ap[k];
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true, ap }); }, [done]);
  const cardStyle = {
    color: P('color') ? '#E03131' : T.ink,
    background: P('background') ? '#FFF3BF' : '#fff',
    fontFamily: P('font') ? 'Georgia, serif' : "'Manrope', sans-serif",
    fontSize: P('size') ? 26 : 18,
    padding: P('padding') ? 26 : 14,
    borderRadius: P('radius') ? 16 : 4,
    textAlign: 'center', fontWeight: 600, transition: 'all 0.25s', boxShadow: `0 8px 22px -10px rgba(${T.shadowBase},0.2)`
  };
  return (
    <Stage eyebrow="Amaliyot · kartani bezat" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? "Davom etish" : `Kamida 3 ta xususiyat (${count}/3)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(8px,1.4vw,14px)' }}>
        <div className="head"><h2 className="title h-title fade-up">O'zingiz <span className="italic" style={{ color: T.accent }}>karta bezang</span>.</h2></div>
        <Mentor>Quyidagi xususiyatlarni yoqib, kartani jonlantiring. <b style={{ color: T.ink }}>Kamida 3 ta</b> xususiyat qo'shing — CSS kodi o'zi yoziladi.</Mentor>
        <div className="split">
          <div className="col">
            <p className="flow-label">Xususiyatlarni yoqing</p>
            <div className="chips fade-up delay-2">{PROPS.map(pr => (<button key={pr.k} className={`gchip ${P(pr.k) ? 'gchip-on' : ''}`} onClick={() => toggle(pr.k)}>{P(pr.k) ? '✓ ' : ''}{pr.label}</button>))}</div>
            {done && <div style={{ background: T.successSoft, borderLeft: `4px solid ${T.success}`, borderRadius: 12, padding: '12px 15px' }} className="fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Zo'r! Bir nechta xususiyat bilan kartani butunlay o'zgartirdingiz — bu CSS kuchi!</p></div>}
          </div>
          <div className="col">
            <div className="flow-label">Karta</div>
            <Preview title="karta.html" minH={120}><div style={{ display: 'flex', justifyContent: 'center' }}><div style={cardStyle}>Mening kartam ✨</div></div></Preview>
            <div className="flow-label">CSS kodi</div>
            <pre className="code-box" style={{ fontSize: 'clamp(11.5px,1.6vw,13px)' }}><span style={{ color: CODE.tag }}>.karta</span> {'{'}{'\n'}{count === 0 && <><span style={{ color: CODE.comment }}>{'  /* xususiyat yoqing */'}</span>{'\n'}</>}{PROPS.filter(pr => P(pr.k)).map(pr => (<React.Fragment key={pr.k}>{'  '}<span style={{ color: CODE.attr }}>{pr.css}</span>: <span style={{ color: CODE.str }}>{pr.val}</span>;{'\n'}</React.Fragment>))}{'}'}</pre>
          </div>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — DEBUGGING (CSS xato) =====
const Screen14 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's14', text: `AI sizga CSS yozib berdi, lekin matn bo'yalmadi. Sababi — kichik, lekin ko'p uchraydigan xato: bir qatordan nuqta-vergul tushib qolgan. Buzuq qatorni topib bosing, keyin tuzatamiz.`, trigger: 'on_mount', waits_for: { type: 'error_found' } }]);
  const [found, setFound] = useState(!!storedAnswer);
  const [fixed, setFixed] = useState(!!storedAnswer);
  const done = fixed;
  const pickLine = () => { if (found) return; setFound(true); audio.triggerEvent('error_found'); if (!audio.muted) setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff(`Topdingiz! color: blue qatoridan nuqta-vergul tushib qolgan. Shuning uchun keyingi qator ham ishlamadi.`); }, 300); };
  const fix = () => { setFixed(true); if (storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); if (!audio.muted) setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff(`Tuzatildi! Nuqta-vergul qo'shildi va endi CSS ishladi — matn ko'k va katta bo'ldi.`); }, 300); };
  return (
    <Stage eyebrow="Debugging" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? "Davom etish" : (found ? "Endi tuzating" : "Xatoni toping")} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">CSS ishlamadi — <span className="italic" style={{ color: T.accent }}>nega</span>?</h2></div>
        <Mentor>AI sizga CSS yozib berdi, lekin matn <b style={{ color: T.ink }}>bo'yalmadi</b>. Sababi kichik, lekin ko'p uchraydigan xato: bir qatordan <b style={{ color: T.ink }}>nuqta-vergul (;)</b> tushib qolgan. Buzuq qatorni topib bosing.</Mentor>
        <div className="split">
          <div className="col">
            <div className="ai-card fade-up delay-2">
              <div className="ai-row"><span className="ai-badge">AI</span><span className="ai-bubble">Mana CSS! (lekin nimadir ishlamayapti 🤔)</span></div>
              <div className="ai-code">
                <div className="ai-line" style={{ cursor: 'default' }}><span className="tg">.karta</span> {'{'}</div>
                <div className={`ai-line ${found ? (fixed ? 'ok' : 'bad') : ''}`} onClick={pickLine}>{'  '}<span className="at">color</span>: <span className="st">blue</span>{fixed ? <span className="st">;</span> : ''}</div>
                <div className="ai-line" style={{ cursor: 'default' }}>{'  '}<span className="at">font-size</span>: <span className="st">24px</span>;</div>
                <div className="ai-line" style={{ cursor: 'default' }}>{'}'}</div>
              </div>
              {!found && <p className="ai-prompt">Qaysi qatorda xato? Bosing.</p>}
              {found && !fixed && (<button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={fix}>🔧 Nuqta-vergul (;) qo'shib tuzatish</button>)}
              {fixed && <p className="ai-prompt" style={{ color: T.success, fontStyle: 'normal', fontWeight: 600 }}>✓ Tuzatildi — endi CSS ishlaydi!</p>}
            </div>
          </div>
          <div className="col">
            <div className="flow-label">Natija</div>
            <Preview title="karta.html" minH={120}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 90 }}><h1 style={{ fontFamily: 'Georgia, serif', margin: 0, transition: 'all 0.3s', color: fixed ? '#1971C2' : T.ink, fontSize: fixed ? 24 : 18 }}>Salom!</h1></div></Preview>
            {!found && (<div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Matn oddiy qora — CSS ishlamadi. Har CSS qatori <span className="mono">;</span> bilan tugashi kerak. Qaysi qatorda u yo'q?</p></div>)}
            {found && !fixed && (<div className="frame-warn fade-step"><p className="note-h" style={{ color: T.accent }}>✓ Topdingiz!</p><p className="body" style={{ margin: 0, color: T.ink }}><span className="mono">color: blue</span> oxirida <b>;</b> yo'q. Brauzer qayerda tugashini bilmay, keyingi qatorni ham buzadi. Tuzating →</p></div>)}
            {fixed && (<div className="takeaway fade-step"><div className="ta-bulb">🛠️</div><p className="ta-h">Bitta ; — katta farq!</p><p className="ta-sub">Har CSS qatori nuqta-vergul bilan tugaydi</p></div>)}
          </div>
        </div>
      </div>
    </Stage>
  );
};
// ===== SCREEN 15 — YAKUNIY (qo'lda CSS yozish) =====
const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's15', text: `Oxirgi qadam — o'zingiz yozasiz. h1 sarlavhani qizil qiling: to'liq CSS qoidasini yozing — selektor, qavs, xususiyat, qiymat va nuqta-vergul. Pastdagi yordamchi tugmalarni bosib, qism-qism ham yig'ishingiz mumkin.`, trigger: 'on_mount', waits_for: { type: 'typed_ok' } }]);
  const [value, setValue] = useState(storedAnswer?.picked || '');
  const [passed, setPassed] = useState(!!storedAnswer?.correct);
  const hasSel = /h1/i.test(value);
  const hasOpen = value.includes('{');
  const hasClose = value.includes('}');
  const hasBrace = hasOpen && hasClose;
  const cm = value.match(/color\s*:\s*([^;}\s]+)/i);
  const hasProp = /color\s*:/i.test(value);
  const colorVal = cm ? cm[1] : '';
  const hasVal = !!colorVal;
  const hasSemi = value.includes(';');
  const valid = hasSel && hasBrace && hasProp && hasVal && hasSemi;
  const HELP = [{ l: 'h1', t: 'h1 ' }, { l: '{', t: '{ ' }, { l: 'color:', t: 'color: ' }, { l: 'red', t: 'red' }, { l: ';', t: '; ' }, { l: '}', t: '}' }];
  const insert = (t) => { if (passed) return; setValue(prev => prev + t); };
  useEffect(() => {
    if (valid && !passed) {
      setPassed(true);
      onAnswer(screen, { correct: true, picked: value, stage: 'final' });
      audio.triggerEvent('typed_ok');
      if (!audio.muted) setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff(`Zo'r! To'liq CSS qoidasini o'zingiz yozdingiz — selektor, xususiyat, qiymat va nuqta-vergul.`); }, 300);
    }
  }, [valid]);
  return (
    <Stage eyebrow="Yakuniy · amaliy" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!passed} label={passed ? "Davom etish" : "CSS qoidasini yozing"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Oxirgi qadam: <span className="italic" style={{ color: T.accent }}>o'zingiz</span> CSS yozing.</h2></div>
        <Mentor>h1 sarlavhani <b style={{ color: T.ink }}>qizil</b> qiling. To'liq qoidani yozing: <span className="mono">h1 {'{'} color: red; {'}'}</span>. Pastdagi tugmalarni bosib qism-qism ham yig'sangiz bo'ladi.</Mentor>
        <div className="split">
          <div className="col">
            <input className="fade-up delay-2" value={value} onChange={e => setValue(e.target.value)} placeholder="h1 { color: red; }" spellCheck={false} autoCapitalize="off" autoCorrect="off" style={{ width: '100%', fontFamily: "'JetBrains Mono', monospace", fontSize: 16, padding: '14px 16px', borderRadius: 12, border: 'none', background: T.paper, color: T.ink, outline: 'none', transition: 'box-shadow 0.2s', boxShadow: valid ? `0 0 0 2px ${T.success}, 0 8px 20px -8px rgba(${T.shadowBase},0.2)` : `0 4px 14px -6px rgba(${T.shadowBase},0.16)` }} />
            <div className="fade-up delay-2"><p className="flow-label" style={{ margin: '0 0 6px' }}>yordamchi — bosib qo'shing</p><div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>{HELP.map(h => (<button key={h.l} className="gchip" disabled={passed} onClick={() => insert(h.t)} style={{ fontFamily: "'JetBrains Mono', monospace" }}>{h.l}</button>))}{value && !passed && <button className="gchip" onClick={() => setValue('')}>↺ Tozalash</button>}</div></div>
            <div className="fade-up delay-2" style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              <span className="tagpill" style={{ opacity: hasSel ? 1 : 0.4 }}>{hasSel ? '✓' : '1'} h1</span>
              <span className="tagpill" style={{ opacity: hasBrace ? 1 : 0.4 }}>{hasBrace ? '✓' : '2'} {'{ }'}</span>
              <span className="tagpill" style={{ opacity: hasProp ? 1 : 0.4 }}>{hasProp ? '✓' : '3'} color:</span>
              <span className="tagpill" style={{ opacity: hasVal ? 1 : 0.4 }}>{hasVal ? '✓' : '4'} qiymat</span>
              <span className="tagpill" style={{ opacity: hasSemi ? 1 : 0.4 }}>{hasSemi ? '✓' : '5'} ;</span>
            </div>
            {passed
              ? (<div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Zo'r! To'liq CSS qoidasi — <b>selektor {'{'} xususiyat: qiymat; {'}'}</b>.</p></div>)
              : (<p className="body" style={{ margin: 0, color: T.ink3, fontSize: 13 }}>Bu — 5 ta tekshiruvdan biri, yakka o'zi o'tishni hal qilmaydi.</p>)}
          </div>
          <div className="col">
            <div className="flow-label">natija (jonli)</div>
            <Preview title="natija.html" minH={130}><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 100 }}>
              {hasVal
                ? <h1 key={colorVal} className="fade-step" style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(26px,4.5vw,36px)', color: colorVal, margin: 0, transition: 'color 0.2s' }}>Salom! 👋</h1>
                : <p style={{ fontFamily: 'Georgia, serif', color: T.ink3, fontStyle: 'italic', margin: 0, textAlign: 'center', lineHeight: 1.5 }}>Yoza boshlang — matn shu yerda <br />jonli bo'yaladi</p>}
            </div></Preview>
            <p className="mono small" style={{ color: T.ink3, margin: 0, textAlign: 'center' }}>{hasVal ? `color: ${colorVal}` : '↑ color qiymatini yozsangiz, darhol ko‘rinadi'}</p>
          </div>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — YAKUN =====
const Screen16 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const audio = useAudio([{ id: 's16', text: "Birinchi CSS darsi tugadi! Endi sahifani bezay olasiz: ranglar — color va background-color, shriftlar — font-family va font-size, bo'shliqlar — padding va margin. Va hammasi bitta shaklda: selektor, xususiyat, qiymat. Keyingi darsda yana ko'proq bezak sirlarini o'rganamiz.", trigger: 'on_mount', waits_for: null }]);
  const RECAP = ['CSS — sahifani bezaydi (HTML skelet, CSS bezak)', 'Shakl: selektor { xususiyat: qiymat; }', 'Ranglar — color va background-color', 'Shriftlar — font-family, font-size, font-weight', 'Bo’shliqlar — padding (ichki), margin (tashqi)'];
  const HOMEWORK = [{ b: 'Ranglar', t: '— sahifangizga color va background bering' }, { b: 'Shrift', t: '— font-family va font-size tanlang' }, { b: 'Bo’shliq', t: '— padding va margin bilan tartibga soling' }];
  const GLOSSARY = [{ b: 'CSS', t: '— bezak tili' }, { b: 'Selektor', t: '— qaysi element (h1)' }, { b: 'Xususiyat', t: '— nima (color)' }, { b: 'Qiymat', t: '— qanday (red)' }, { b: 'color/background-color', t: '— ranglar' }, { b: 'font-family/size/weight', t: '— shrift' }, { b: 'padding/margin', t: '— ichki/tashqi bo’shliq' }];
  const correct = SCORED_IDX.filter(i => answers[i]?.correct).length;
  const total = SCORED_IDX.length;
  const PASSED = (total ? correct / total : 0) >= 0.6;
  const [open, setOpen] = useState(false);
  return (
    <Stage eyebrow="Tayyor" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><button className="btn-ghost" onClick={onReset} style={{ padding: 'clamp(11px,1.6vw,13px) clamp(16px,2.2vw,22px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Qaytadan</button><button className="btn-white-accent" onClick={onFinish} style={{ marginLeft: 'auto', padding: 'clamp(11px,1.6vw,13px) clamp(22px,2.6vw,30px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Keyingi dars →</button></>}>
      <div className="screen">
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">✓</span> CSS 1-dars tugadi</span><h2 className="title h-title fade-up d1">Sahifani <span className="italic" style={{ color: T.accent }}>bezashni</span> o'rganding.</h2><p className="body h-sub fade-up d2">{PASSED ? 'Tabriklaymiz! Endi ranglar, shriftlar va bo’shliqlarni o’zing boshqarasan.' : 'Yaxshi harakat! Bir-ikki joyni mustahkamlash uchun darsni qayta ko’ring.'}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span className="tick" style={{ width: 16, height: 16, borderRadius: '50%', background: T.success, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck">✓</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>🎨 Uyga vazifa</div><p className="body" style={{ margin: '0 0 10px', color: T.ink }}>HTML sahifangizni CSS bilan bezang:</p><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">Keyingi darsda chegaralar, soyalar va joylashuvni o'rganamiz!</p></div>
        </div>
        <div className="gloss fade-up d4"><div className="gloss-head" onClick={() => setOpen(o => !o)}><span className="lbl">💡 Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT — ({ lang, onFinished })
export default function HtmlLesson({ lang: langProp, onFinished }) {
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
      answers: SCREEN_META.map((_s, i) => answers[i]).filter(Boolean)
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
        .ck.active .t-tag { color: #fff; }
        .t-cm, .cm { color: ${CODE.comment}; font-style: italic; }
        .t-title { color: ${CODE.comment}; font-style: italic; opacity: 0.85; }
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
        .stage-content { flex: 1; min-height: 0; padding-top: clamp(10px,1.7vw,16px); padding-bottom: clamp(17px,3.4vw,34px); display: flex; flex-direction: column; overflow-y: auto; overflow-x: hidden; -webkit-overflow-scrolling: touch; }
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

        /* === LAYOUT === */
        .screen { flex: 1; min-height: 0; display: flex; flex-direction: column; gap: clamp(14px,2vw,20px); }
        .head { display: flex; flex-direction: column; gap: 6px; }
        .split { display: grid; grid-template-columns: minmax(0,1fr) minmax(0,1fr); gap: clamp(18px,3vw,36px); align-items: start; }
        .col { display: flex; flex-direction: column; gap: clamp(12px,2vw,16px); min-width: 0; }
        @media (max-width: 760px) { .split { grid-template-columns: 1fr; gap: clamp(14px,3vw,20px); } }
        .flow-label { font-family: 'Manrope'; font-weight: 700; font-size: 10px; letter-spacing: 0.14em; text-transform: uppercase; color: ${T.ink2}; }

        /* === PROBLEM REVEAL === */
        .pr { display: flex; flex-direction: column; gap: 12px; }
        .mu-block { display: flex; flex-direction: column; gap: 14px; transition: opacity 0.35s, transform 0.35s; }
        .mu-block.leave { opacity: 0; transform: translateY(-8px); }
        .ps-line { display: flex; gap: 10px; align-items: flex-start; }
        .ps-badge { flex-shrink: 0; font-family: 'JetBrains Mono'; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; padding: 4px 9px; border-radius: 6px; margin-top: 2px; }
        .ps-q { background: ${T.accentSoft}; color: ${T.accent}; }
        .ps-a { background: ${T.successSoft}; color: ${T.success}; }
        .ps-text { font-size: clamp(14px,1.7vw,16px); line-height: 1.5; color: ${T.ink}; }
        .solve-btn { align-self: flex-start; font-family: 'Manrope'; font-weight: 600; font-size: clamp(13px,1.6vw,15px); padding: 10px 18px; border-radius: 10px; border: none; background: ${T.ink}; color: ${T.bg}; cursor: pointer; transition: all 0.2s; box-shadow: 0 6px 16px -5px rgba(${T.shadowBase},0.3); }
        .solve-btn:hover:not(:disabled) { background: ${T.accent}; }
        .ye-solved, .ye-stack { display: flex; flex-direction: column; gap: 12px; }
        .mu-mini { opacity: 0.7; }
        .idea { display: flex; align-items: center; justify-content: center; gap: 8px; padding: 6px 0; }
        .happy { font-size: 30px; animation: pop 0.5s ease-out; } .idea-bulb { font-size: 22px; animation: pop 0.5s ease-out 0.1s both; }
        @keyframes pop { 0% { transform: scale(0); } 70% { transform: scale(1.2); } 100% { transform: scale(1); } }
        .pr-answer { animation: fade-step 0.4s ease-out; }

        .demo-swap { animation: fade-step 0.3s ease-out; }

        /* === ROADMAP === */
        .roadmap { display: flex; flex-direction: column; gap: 8px; list-style: none; }
        .step-card { display: flex; align-items: center; gap: 14px; background: ${T.paper}; border-radius: 12px; padding: 13px 16px; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.14); }
        .step-num { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 13px; color: ${T.accent}; flex-shrink: 0; }
        .step-body { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .step-text { font-weight: 500; font-size: clamp(14px,1.7vw,16px); color: ${T.ink}; }
        .step-tag { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink2}; background: ${T.bg}; padding: 3px 8px; border-radius: 6px; }
        .dest { display: flex; align-items: center; gap: 14px; background: ${T.accentSoft}; border-left: 4px solid ${T.accent}; border-radius: 12px; padding: 14px 18px; }
        .dest-emoji { font-size: 28px; } .dest-title { font-weight: 700; color: ${T.ink}; margin: 0; font-size: clamp(15px,1.8vw,17px); } .dest-sub { color: ${T.ink2}; margin: 2px 0 0; font-size: clamp(13px,1.5vw,14px); }

        /* === RECIPE === */
        .recipe-list { display: flex; flex-direction: column; list-style: none; }
        .recipe-list li { display: flex; align-items: center; gap: 13px; padding: 11px 2px; border-bottom: 1px solid rgba(167,166,162,0.22); transition: all 0.3s; }
        .recipe-list li:last-child { border-bottom: none; }
        .recipe-num { width: 22px; height: 22px; border-radius: 50%; box-shadow: inset 0 0 0 2px ${T.ink3}; background: transparent; color: #fff; display: flex; align-items: center; justify-content: center; font-family: 'JetBrains Mono'; font-weight: 700; font-size: 12px; flex-shrink: 0; transition: all 0.3s; }
        .recipe-list li.on .recipe-num { box-shadow: inset 0 0 0 2px ${T.success}; background: ${T.success}; }
        .recipe-text { font-size: clamp(14px,1.7vw,16px); color: ${T.ink}; }

        /* === FLOW ARROW === */
        .flow-arrow { display: flex; flex-direction: column; align-items: center; gap: 1px; padding: 0; }
        .flow-track { width: 2px; height: 10px; background: ${T.ink3}; position: relative; overflow: hidden; border-radius: 2px; }
        .flow-bead { position: absolute; top: -8px; left: -1px; width: 4px; height: 8px; background: ${T.accent}; border-radius: 2px; animation: bead 1.4s linear infinite; }
        @keyframes bead { from { top: -8px; } to { top: 18px; } }
        .flow-chevron { color: ${T.accent}; font-size: 11px; animation: chev 1.4s ease-in-out infinite; }
        @keyframes chev { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }
        .brauzer-step { display: flex; align-items: center; gap: 12px; background: ${T.paper}; border-radius: 12px; padding: 9px 14px; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.14); animation: fade-step 0.3s; }
        .brauzer-icon { font-size: 20px; } .brauzer-h { font-weight: 700; color: ${T.ink}; margin: 0; font-size: 14px; } .brauzer-sub { color: ${T.ink2}; margin: 1px 0 0; font-size: 12px; font-family: 'JetBrains Mono'; }

        /* === PROFILE CARD === */
        .profile-card { display: flex; flex-direction: column; align-items: center; gap: 5px; text-align: center; padding: 2px 0; animation: fade-step 0.3s; }
        .pf-ava { width: 44px; height: 44px; border-radius: 50%; background: ${T.accent}; color: #fff; display: flex; align-items: center; justify-content: center; font-family: 'Manrope'; font-weight: 800; font-size: 20px; }
        .pf-name { font-family: 'Georgia, serif'; font-size: clamp(16px,2.2vw,19px); color: ${T.ink}; margin: 0; }
        .pf-bio { color: ${T.ink2}; margin: 0; font-size: 12.5px; }
        .pf-btn { margin-top: 3px; background: ${T.accent}; color: #fff; border: none; border-radius: 8px; padding: 6px 14px; font-family: 'Manrope'; font-weight: 700; font-size: 12.5px; cursor: default; }

        /* === BSKEL (skeleton anatomy) === */
        .bskel { display: flex; flex-direction: column; gap: 0; }
        .bskel-doctype, .bskel-html, .bskel-tab, .bskel-page { cursor: pointer; transition: all 0.2s; position: relative; }
        .bskel-doctype { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink2}; padding: 6px 10px; border-radius: 8px 8px 0 0; background: ${T.bg}; }
        .bskel-html { border: 2px solid ${T.ink3}; border-radius: 0 8px 12px 12px; padding: 18px 10px 10px; background: ${T.paper}; }
        .bskel-htmllabel { position: absolute; top: -1px; left: 10px; transform: translateY(-50%); font-family: 'JetBrains Mono'; font-size: 10px; color: ${T.ink2}; background: ${T.paper}; padding: 0 6px; }
        .bskel-win { border-radius: 10px; overflow: hidden; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.18); }
        .bskel-tab { background: #f0eee8; padding: 8px 10px; display: flex; align-items: center; gap: 8px; }
        .bskel-dots { display: flex; gap: 4px; } .bskel-dots i { width: 8px; height: 8px; border-radius: 50%; background: ${T.ink3}; }
        .bskel-tabpill { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink2}; background: #fff; padding: 3px 9px; border-radius: 5px; }
        .bskel-zone { margin-left: auto; font-family: 'JetBrains Mono'; font-size: 10px; color: ${T.ink3}; }
        .bskel-page { background: #fff; padding: 16px; min-height: 80px; }
        .bskel-ptitle { font-family: 'Georgia, serif'; font-size: 18px; color: ${T.ink}; margin: 0 0 4px; } .bskel-ptext { font-family: 'Georgia, serif'; color: ${T.ink2}; margin: 0; font-size: 13px; }
        .bskel-zone-b { position: absolute; bottom: 6px; right: 10px; }
        .bskel-doctype.active, .bskel-html.active, .bskel-tab.active, .bskel-page.active { box-shadow: inset 0 0 0 2px ${T.accent}; background: ${T.accentSoft}; }
        .bskel-tab.active, .bskel-page.active { background: ${T.accentSoft}; }
        .ck { cursor: pointer; border-radius: 4px; transition: all 0.15s; padding: 0 2px; }
        .ck:hover { background: rgba(255,255,255,0.08); }
        .ck.active { background: ${T.accent}; }
        .sk-info { background: ${T.paper}; border-radius: 12px; padding: 15px 17px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.16); animation: fade-step 0.3s; }
        .sk-tagbig { display: flex; align-items: center; gap: 9px; flex-wrap: wrap; }
        .sk-chip { font-family: 'JetBrains Mono'; font-size: 12px; font-weight: 600; color: ${CODE.tag}; background: ${CODE.bg}; padding: 4px 9px; border-radius: 6px; }
        .sk-wordbadge { font-family: 'Manrope'; font-weight: 700; font-size: 13px; color: ${T.accent}; background: ${T.accentSoft}; padding: 4px 10px; border-radius: 6px; }

        /* === HUG (teg o'raydi) === */
        .hug-wrap { display: flex; justify-content: center; padding: 10px 0; }
        .hug { display: flex; align-items: stretch; gap: 0; transition: gap 0.4s; }
        .hug.on { gap: 4px; }
        .hug-item { display: flex; flex-direction: column; align-items: center; gap: 5px; padding: 12px 14px; cursor: pointer; border-radius: 10px; transition: all 0.2s; }
        .hug-tag { background: ${CODE.bg}; } .hug-content { background: ${T.accentSoft}; }
        .hug-item.active { box-shadow: 0 0 0 2px ${T.accent}; }
        .hug-code { font-family: 'JetBrains Mono'; font-weight: 700; font-size: clamp(15px,2vw,18px); }
        .hug-tag .hug-code { color: ${CODE.tag}; } .hug-content .hug-code { color: ${T.accent}; }
        .hug-slash { color: ${CODE.attr}; }
        .hug-lbl { font-family: 'JetBrains Mono'; font-size: 9px; text-transform: uppercase; letter-spacing: 0.05em; color: ${T.ink3}; }
        .role-line { background: ${T.paper}; border-radius: 10px; padding: 12px 15px; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.14); animation: fade-step 0.3s; }
        .hint { background: ${T.bg}; border: 1.5px dashed ${T.ink3}; border-radius: 12px; padding: 14px 16px; font-size: clamp(13px,1.5vw,14px); color: ${T.ink2}; }
        .pv-h1 { font-family: 'Georgia, serif'; font-size: clamp(22px,3vw,30px); color: ${T.ink}; margin: 0; animation: fade-step 0.4s; }

        /* === LADDER (sarlavhalar) === */
        .ladder { display: flex; flex-direction: column; gap: 6px; }
        .hl-row { display: flex; align-items: center; gap: 13px; padding: 9px 14px; border-radius: 10px; cursor: pointer; transition: all 0.18s; background: ${T.paper}; box-shadow: 0 4px 12px -6px rgba(${T.shadowBase},0.12); }
        .hl-row:hover { box-shadow: 0 8px 18px -6px rgba(${T.shadowBase},0.2); }
        .hl-row.on { box-shadow: 0 0 0 2px ${T.accent}, 0 8px 18px -6px rgba(255,79,40,0.25); background: ${T.accentSoft}; }
        .hl-chip { font-family: 'JetBrains Mono'; font-size: 12px; font-weight: 600; color: ${CODE.tag}; background: ${CODE.bg}; padding: 3px 8px; border-radius: 5px; flex-shrink: 0; }
        .hl-text { font-family: 'Georgia, serif'; font-weight: 700; color: ${T.ink}; line-height: 1; }
        .hl-tag { margin-left: auto; font-family: 'Manrope'; font-weight: 600; font-size: 11px; color: ${T.accent}; background: ${T.accentSoft}; padding: 3px 9px; border-radius: 99px; }
        .hl-note { background: ${T.paper}; border-radius: 10px; padding: 12px 15px; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.14); animation: fade-step 0.3s; }
        .hl-note .nb { font-family: 'JetBrains Mono'; font-weight: 700; color: ${T.accent}; }
        .hl-hint { padding: 10px 2px; }

        /* === MCARD (matn) === */
        .mcard { background: ${T.paper}; border-radius: 14px; padding: 16px 18px; display: flex; flex-direction: column; gap: 12px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.14); }
        .mc-head { display: flex; align-items: center; gap: 9px; flex-wrap: wrap; }
        .mc-chip { font-family: 'JetBrains Mono'; font-size: 12px; font-weight: 600; color: ${CODE.tag}; background: ${CODE.bg}; padding: 3px 9px; border-radius: 5px; }
        .mc-label { font-weight: 600; font-size: 13px; color: ${T.ink2}; }
        .mc-demo { font-family: 'Georgia, serif'; font-size: clamp(18px,2.5vw,24px); color: ${T.ink}; padding: 8px 0; }
        .w-anim { display: inline-block; transition: all 0.3s; } .w-bold { font-weight: 800; } .w-ital { font-style: italic; }
        .mc-btn { align-self: flex-start; font-family: 'Manrope'; font-weight: 600; font-size: 13px; padding: 8px 15px; border-radius: 9px; border: none; background: ${T.bg}; color: ${T.ink}; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; gap: 7px; }
        .mc-btn:hover { box-shadow: 0 6px 14px -5px rgba(${T.shadowBase},0.2); }
        .mc-btn.on { background: ${T.accent}; color: #fff; }
        .mc-btn .ic { font-family: 'Georgia, serif'; }
        .mc-code { font-family: 'JetBrains Mono'; font-size: 12px; color: ${T.ink2}; background: ${T.bg}; padding: 8px 11px; border-radius: 8px; margin: 0; } .mc-code .tg { color: ${CODE.tag}; }

        /* === WHEN / LISTS === */
        .when { background: ${T.accentSoft}; border-left: 4px solid ${T.accent}; border-radius: 10px; padding: 11px 15px; }
        .site-header { display: flex; justify-content: space-between; align-items: center; padding-bottom: 10px; border-bottom: 1px solid ${T.ink3}40; margin-bottom: 12px; flex-wrap: wrap; gap: 8px; }
        .site-brand { display: inline-flex; align-items: center; gap: 8px; } .site-logo { width: 22px; height: 22px; border-radius: 6px; background: ${T.accent}; color: #fff; display: inline-flex; align-items: center; justify-content: center; font-family: 'Manrope'; font-weight: 800; font-size: 13px; } .site-name { font-family: 'Manrope'; font-weight: 700; color: ${T.ink}; font-size: 14px; }
        .site-nav { display: inline-flex; gap: 11px; font-family: 'Manrope'; font-size: 12px; color: ${T.ink2}; }
        .site-sec { } .site-h3 { font-family: 'Georgia, serif'; font-size: clamp(16px,2.2vw,20px); color: ${T.ink}; margin: 0 0 8px; }
        .site-list { font-family: 'Georgia, serif'; color: ${T.ink}; font-size: clamp(14px,1.8vw,16px); }
        .site-list ul, .site-list ol { padding-left: 24px; } .site-list li { display: list-item; margin: 3px 0; }

        /* === WEB (graf) === */
        .web { position: relative; height: 150px; background: ${T.paper}; border-radius: 14px; overflow: hidden; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.14); }
        .web-svg { position: absolute; inset: 0; width: 100%; height: 100%; }
        .web-node { position: absolute; transform: translate(-50%,-50%); font-family: 'Manrope'; font-weight: 600; font-size: 11px; color: ${T.ink}; background: ${T.bg}; padding: 5px 10px; border-radius: 99px; cursor: pointer; transition: all 0.2s; white-space: nowrap; box-shadow: 0 3px 8px -3px rgba(${T.shadowBase},0.25); }
        .web-node:hover { transform: translate(-50%,-50%) scale(1.06); }
        .web-node.on { background: ${T.accent}; color: #fff; }
        .web-cap { font-size: clamp(12px,1.5vw,13px); color: ${T.ink2}; margin: 0; line-height: 1.5; }

        .bp-url { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink2}; display: flex; align-items: center; gap: 6px; animation: fade-step 0.3s; } .lock { color: ${T.success}; font-size: 8px; }
        .pg-in { animation: pg-in 0.35s ease-out; } @keyframes pg-in { from { opacity: 0; transform: translateX(8px); } to { opacity: 1; transform: translateX(0); } }
        .site-top { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 10px; flex-wrap: wrap; gap: 4px; }
        .site-wordmark { font-family: 'Georgia, serif'; font-weight: 700; color: ${T.ink}; font-size: 14px; } .site-tag { font-size: 10px; color: ${T.ink3}; font-family: 'JetBrains Mono'; }
        .pg-h1 { font-family: 'Georgia, serif'; font-size: clamp(20px,2.8vw,26px); color: ${T.ink}; margin: 0 0 7px; } .pg-body { font-family: 'Georgia, serif'; color: ${T.ink2}; font-size: clamp(13px,1.7vw,15px); line-height: 1.55; margin: 0 0 12px; }
        .pg-divider { height: 1px; background: ${T.ink3}30; margin: 0 0 12px; }
        .pg-linklabel { font-family: 'Manrope'; font-weight: 700; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; color: ${T.ink3}; margin: 0 0 8px; }
        .pg-links { display: flex; flex-direction: column; gap: 7px; margin-bottom: 12px; }
        .pg-a { font-family: 'Georgia, serif'; color: ${T.link}; text-decoration: underline; cursor: pointer; font-size: clamp(13px,1.7vw,15px); display: inline-flex; align-items: center; gap: 5px; transition: gap 0.2s; } .pg-a:hover { gap: 9px; } .arr { font-size: 12px; }
        .pg-foot { font-size: 10px; color: ${T.ink3}; margin: 0; font-family: 'Manrope'; }

        .codecard { background: ${T.paper}; border-radius: 12px; padding: 12px 14px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.14); animation: fade-step 0.3s ease-out forwards; }
        .codecard-top { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink2}; margin: 0 0 8px; display: flex; align-items: center; gap: 7px; } .dotf { width: 8px; height: 8px; border-radius: 50%; background: ${T.accent}; }
        .codeblock { background: ${CODE.bg}; border-radius: 8px; padding: 11px 13px; margin: 0; font-family: 'JetBrains Mono'; font-size: 12px; line-height: 1.6; display: flex; flex-direction: column; } .codeblock .ln { white-space: pre-wrap; word-break: break-word; } .codeblock .tg { color: ${CODE.tag}; }
        .codecap { font-size: 12px; color: ${T.ink2}; margin: 8px 0 0; } .mn { font-family: 'JetBrains Mono'; color: ${T.accent}; }

        /* === AI CARD === */
        .ai-card { background: ${T.paper}; border-radius: 14px; padding: 15px 17px; display: flex; flex-direction: column; gap: 11px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.14); }
        .ai-row { display: flex; align-items: center; gap: 9px; } .ai-badge { font-family: 'Manrope'; font-weight: 800; font-size: 11px; color: #fff; background: ${T.blue}; padding: 3px 9px; border-radius: 6px; } .ai-bubble { font-size: 13px; color: ${T.ink2}; }
        .ai-code { background: ${CODE.bg}; border-radius: 9px; padding: 10px 12px; display: flex; flex-direction: column; gap: 3px; }
        .ai-line { font-family: 'JetBrains Mono'; font-size: 13px; color: ${CODE.text}; cursor: pointer; padding: 4px 7px; border-radius: 6px; transition: all 0.15s; } .ai-line:hover { background: rgba(255,255,255,0.06); } .ai-line .tg { color: ${CODE.tag}; }
        .ai-line.bad { background: rgba(255,79,40,0.16); box-shadow: inset 0 0 0 1px ${T.accent}; } .ai-line.ok { background: rgba(31,122,77,0.16); }
        .ai-prompt { font-size: 12px; color: ${T.ink3}; margin: 0; font-style: italic; } .note-h { font-weight: 700; font-size: 13px; margin: 0 0 4px; }
        .takeaway { background: ${T.accentSoft}; border-radius: 14px; padding: 20px; display: flex; flex-direction: column; align-items: center; text-align: center; gap: 5px; } .ta-bulb { font-size: 34px; } .ta-h { font-family: 'Source Serif 4', serif; font-weight: 600; font-size: clamp(16px,2.2vw,20px); color: ${T.ink}; margin: 0; } .ta-sub { color: ${T.accent}; font-weight: 600; font-size: 13px; margin: 0; }

        /* === BUILDER === */
        .prompt-row { display: flex; gap: 8px; }
        .prompt-btn { flex-shrink: 0; font-family: 'Manrope'; font-weight: 700; font-size: 14px; padding: 0 18px; border-radius: 12px; border: none; background: ${T.accent}; color: #fff; cursor: pointer; transition: all 0.2s; box-shadow: 0 6px 16px -5px rgba(255,79,40,0.4); } .prompt-btn:hover:not(:disabled) { box-shadow: 0 10px 22px -5px rgba(255,79,40,0.55); } .prompt-btn:disabled { opacity: 0.4; cursor: not-allowed; }
        .chips { display: flex; flex-wrap: wrap; gap: 7px; }
        .gchip { font-family: 'Manrope'; font-weight: 600; font-size: 12.5px; padding: 7px 12px; border-radius: 99px; border: none; background: ${T.paper}; color: ${T.ink}; cursor: pointer; transition: all 0.18s; box-shadow: 0 3px 10px -5px rgba(${T.shadowBase},0.2); display: inline-flex; align-items: center; gap: 6px; } .gchip:hover:not(:disabled) { transform: translateY(-1px); } .gchip:disabled { opacity: 0.4; cursor: not-allowed; } .gt { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.accent}; }
        .gen-line { color: ${CODE.attr}; } .gen-line::after { content: '…'; animation: blink 1s steps(3) infinite; } @keyframes blink { 0% { opacity: 0.3; } 50% { opacity: 1; } 100% { opacity: 0.3; } }
        .el-in { animation: fade-step 0.35s ease-out; }

        /* === YOZISH (Screen7) === */
        .yz-card { background: ${T.paper}; border-radius: 14px; padding: 18px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.14); display: flex; flex-direction: column; gap: 10px; }
        .yz-line { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-family: 'JetBrains Mono'; font-size: clamp(15px,2vw,18px); }
        .yz-code { color: ${T.ink}; } .yz-code .t-tag { color: ${CODE.tag}; } .yz-done { animation: fade-step 0.3s; }
        .yz-input { font-family: 'JetBrains Mono'; font-size: clamp(15px,2vw,18px); padding: 5px 10px; border: none; border-radius: 8px; background: ${T.bg}; color: ${T.ink}; outline: none; width: 150px; box-shadow: inset 0 0 0 1.5px ${T.accent}40; } .yz-input:focus { box-shadow: inset 0 0 0 2px ${T.accent}; }
        .yz-hint { font-size: 12.5px; color: ${T.ink2}; margin: 0; } .yz-ok { font-size: 13px; color: ${T.success}; font-weight: 600; margin: 0; animation: fade-step 0.3s; } .yz-placeholder { color: ${T.ink3}; font-style: italic; margin: 0; font-family: 'Georgia, serif'; }

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
        /* ============ v16 QO'SHIMCHA CSS ============ */
        /* SCREEN 2 — Hayotdan misol (2-bosqich) */
        .frame-col { display: flex; flex-direction: column; gap: 14px; }
        .savo { gap: 12px; }
        .btn-soft { font-family: 'Manrope'; font-weight: 600; cursor: pointer; transition: all 0.2s; background: ${T.bg}; color: ${T.ink}; border: none; border-radius: 10px; padding: 9px 15px; font-size: 13px; }
        .btn-soft:hover:not(:disabled) { box-shadow: 0 6px 14px -5px rgba(${T.shadowBase},0.2); }
        .btn-soft:disabled { opacity: 0.5; cursor: not-allowed; }
        .pz-head { display: flex; align-items: flex-start; gap: 12px; }
        .pz-emoji { font-size: 26px; line-height: 1; flex-shrink: 0; }
        .pz-title { font-family: 'Manrope'; font-weight: 700; font-size: 14px; color: ${T.accent}; text-transform: uppercase; letter-spacing: 0.06em; margin: 0 0 3px; }
        .pz-sub { font-size: clamp(13px,1.6vw,15px); color: ${T.ink2}; line-height: 1.45; margin: 0; }
        .pz-flow { display: flex; align-items: flex-start; gap: 4px; overflow-x: auto; padding: 4px 2px 2px; }
        .pz-step { display: flex; flex-direction: column; align-items: center; gap: 8px; min-width: 88px; flex: 0 0 auto; padding: 10px 6px; border-radius: 12px; transition: background 0.3s; }
        .pz-step.on { background: ${T.successSoft}; }
        .pz-step.active { background: ${T.accentSoft}; }
        .pz-ic { width: 34px; height: 34px; border-radius: 50%; box-shadow: inset 0 0 0 2px ${T.ink3}; display: flex; align-items: center; justify-content: center; font-family: 'JetBrains Mono'; font-weight: 700; font-size: 14px; color: ${T.ink2}; background: transparent; transition: all 0.3s; }
        .pz-step.on .pz-ic { box-shadow: inset 0 0 0 2px ${T.success}; background: ${T.success}; color: #fff; }
        .pz-step.active .pz-ic { box-shadow: inset 0 0 0 2px ${T.accent}; color: ${T.accent}; }
        .pz-lbl { font-size: 11.5px; text-align: center; color: ${T.ink2}; line-height: 1.25; font-weight: 500; }
        .pz-step.on .pz-lbl { color: ${T.ink}; }
        .pz-arrow { align-self: center; margin-top: 16px; color: ${T.ink3}; font-size: 15px; flex: 0 0 auto; transition: color 0.3s; }
        .pz-arrow.on { color: ${T.success}; }
        /* SCREEN 6 — Teg (qo'shtirnoq modeli) */
        .pv-plain { font-family: 'Georgia, serif'; font-size: 14px; color: ${T.ink3}; margin: 0; }
        .tegbuild-wrap { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 22px 0 14px; }
        .tegbuild { display: flex; align-items: center; justify-content: center; gap: 5px; min-height: 78px; }
        .tegbuild.on { gap: 4px; }
        .tb-chip { display: flex; flex-direction: column; align-items: center; gap: 7px; padding: 13px 16px; border-radius: 11px; transition: transform 0.55s cubic-bezier(.34,1.25,.4,1), opacity 0.4s; cursor: default; }
        .tegbuild.on .tb-chip { cursor: pointer; }
        .tb-tag { background: ${CODE.bg}; } .tb-content { background: ${T.accentSoft}; }
        .tb-code { font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: clamp(16px,2.4vw,20px); }
        .tb-tag .tb-code { color: ${CODE.tag}; } .tb-content .tb-code { color: ${T.accent}; }
        .tb-slash { color: ${CODE.attr}; display: inline-block; }
        .tegbuild.on .tb-slash { animation: slashpulse 1.3s ease-in-out 0.55s 2; }
        @keyframes slashpulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.45); } }
        .tb-lbl { font-family: 'JetBrains Mono', monospace; font-size: 9px; text-transform: uppercase; letter-spacing: 0.06em; color: ${T.ink3}; transition: opacity 0.3s 0.35s; }
        .tb-open.hide { transform: translateX(-64px) scale(0.82); opacity: 0; }
        .tb-close.hide { transform: translateX(64px) scale(0.82); opacity: 0; }
        .tegbuild:not(.on) .tb-tag .tb-lbl { opacity: 0; }
        .tb-chip.active { box-shadow: 0 0 0 2px ${T.accent}; }
        .tb-bracket { display: flex; flex-direction: column; align-items: center; gap: 4px; opacity: 0; transition: opacity 0.3s 0.5s; }
        .tegbuild-wrap.on .tb-bracket { opacity: 1; }
        .tb-brace { width: 150px; max-width: 70%; height: 9px; border: 1.5px solid ${T.ink3}; border-top: none; border-radius: 0 0 9px 9px; }
        .tb-brace-lbl { font-family: 'Manrope'; font-weight: 600; font-size: 12px; color: ${T.ink2}; }
        .slash-callout { display: flex; align-items: center; gap: 13px; background: ${T.accentSoft}; border-left: 4px solid ${T.accent}; border-radius: 12px; padding: 12px 15px; }
        .slash-big { font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 30px; color: ${T.accent}; line-height: 1; flex-shrink: 0; }
        /* SCREEN 8 — Sarlavhalar (gazeta -> teglar qo'nadi) */
        .news-card { display: flex; flex-direction: column; }
        .news-line { display: flex; align-items: center; gap: 12px; padding: 9px 10px; margin: 0 -10px; border-radius: 10px; transition: background 0.4s ease; }
        .news-card.tagged .news-line { background: ${T.bg}; }
        .news-card.tagged .news-headline { background: ${T.accentSoft}; }
        .news-line > h3, .news-line > p { flex: 1; min-width: 0; }
        .tag-badge { flex-shrink: 0; font-family: 'JetBrains Mono', monospace; font-size: 12px; font-weight: 600; color: ${CODE.tag}; background: ${CODE.bg}; padding: 4px 9px; border-radius: 6px; opacity: 0; transform: translateX(10px) scale(0.9); transition: opacity 0.4s ease, transform 0.45s cubic-bezier(.34,1.25,.4,1); }
        .news-card.tagged .tag-badge { opacity: 1; transform: none; }
        .tag-badge.accent { color: #fff; background: ${T.accent}; box-shadow: 0 4px 12px -4px rgba(255,79,40,0.5); }
        .tag-badge.soft { color: ${T.ink2}; background: ${T.bg}; box-shadow: inset 0 0 0 1px ${T.ink3}55; }
        .news-hint { font-family: 'Manrope'; font-size: 12.5px; color: ${T.ink2}; margin: 12px 0 0; }
        /* Avtoscroll */
        .stage-content { scroll-behavior: smooth; }
        /* MOBIL: yig'iladigan Mentor (skrollni kamaytirish) */
        .mentor-mob .mentor-msg { overflow: hidden; max-height: 360px; transition: max-height 0.38s cubic-bezier(.4,0,.2,1), opacity 0.25s ease, padding 0.38s ease, box-shadow 0.3s ease; }
        .mentor-mob.is-collapsed { align-items: center; cursor: pointer; }
        .mentor-mob.is-collapsed .mentor-col { gap: 0; }
        .mentor-mob.is-collapsed .mentor-msg { max-height: 0; opacity: 0; padding-top: 0; padding-bottom: 0; box-shadow: none; }
        .mentor-cue { font-family: 'Manrope'; font-weight: 600; font-size: 11px; color: ${T.accent}; letter-spacing: 0.01em; }

        /* ============ CSS DARS CSS ============ */
        .ana2 { display: flex; flex-direction: column; gap: 10px; background: ${T.paper}; border-radius: 12px; padding: 14px 16px; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.14); }
        .ana2-row { display: flex; align-items: center; gap: 10px; }
        .ana2-tag { font-family: 'JetBrains Mono'; font-weight: 700; font-size: 12px; color: ${T.ink2}; background: ${T.bg}; padding: 4px 9px; border-radius: 6px; flex-shrink: 0; min-width: 44px; text-align: center; }
        .ana2-tag.ana2-css { color: #fff; background: ${T.accent}; }
        .ana2-txt { font-family: 'Manrope'; font-size: 13.5px; color: ${T.ink}; }
        .csspart { cursor: pointer; border-radius: 6px; padding: 2px 5px; transition: all 0.15s; }
        .csspart:hover { background: rgba(255,255,255,0.08); }
        .csspart.on { box-shadow: 0 0 0 2px ${T.accent}; background: rgba(255,79,40,0.14); }
        .csspart.seen { text-decoration: underline; text-decoration-color: rgba(255,255,255,0.3); text-underline-offset: 4px; }
        .csslegend { display: flex; gap: 8px; flex-wrap: wrap; }
        .csstab { font-family: 'Manrope'; font-weight: 600; font-size: 12.5px; padding: 7px 13px; border-radius: 99px; background: ${T.paper}; color: ${T.ink2}; cursor: pointer; transition: all 0.18s; box-shadow: 0 3px 10px -5px rgba(${T.shadowBase},0.2); border: none; }
        .csstab.seen { color: ${T.success}; }
        .csstab.on { box-shadow: 0 0 0 1.5px ${T.accent}; color: ${T.accent}; }
        .swatches { display: flex; gap: 10px; flex-wrap: wrap; }
        .swatch { width: 42px; height: 42px; border-radius: 10px; border: none; cursor: pointer; transition: all 0.18s; display: inline-flex; align-items: center; justify-content: center; font-weight: 800; font-size: 16px; box-shadow: inset 0 0 0 1px rgba(0,0,0,0.08), 0 4px 10px -5px rgba(${T.shadowBase},0.25); }
        .swatch:hover { transform: translateY(-2px); }
        .swatch.on { box-shadow: 0 0 0 3px ${T.bg}, 0 0 0 5px ${T.accent}; transform: translateY(-2px); }
        .hexrow { display: flex; align-items: center; justify-content: space-between; background: ${T.paper}; border-radius: 10px; padding: 10px 14px; box-shadow: 0 4px 12px -6px rgba(${T.shadowBase},0.14); }
        .hexlbl { font-family: 'Manrope'; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: ${T.ink3}; }
        .hexval { font-size: clamp(14px,2vw,17px); color: ${T.ink}; font-weight: 600; }
        .gchip-on { background: ${T.accent} !important; color: #fff !important; box-shadow: 0 6px 16px -5px rgba(255,79,40,0.45) !important; }

      `}</style>
      <div className="lesson-root">
        <Current screen={screen} storedAnswer={answers[screen]} answers={answers} onAnswer={recordAnswer} onNext={next} onPrev={prev} onReset={reset} onFinish={finishLesson} />
      </div>
    </LangContext.Provider>
  );
}