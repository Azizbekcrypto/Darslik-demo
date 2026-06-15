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

const LESSON_META = { lessonId: 'git-github-01-v16', lessonTitle: { uz: 'Git va GitHub — kod uchun vaqt mashinasi', ru: 'Git и GitHub — машина времени для кода' } };
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
  { id: 's15', type: 'test',        template: 'MCScreen', scored: true,  scope: 'final' },
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
        <div ref={contentRef} onClick={onContentClick} className={`stage-content ${narrow ? 'narrow' : ''}`} style={{ paddingLeft: padH, paddingRight: padH }}>{children}</div>
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
  const audio = useAudio([{ id: 's0', text: `Loyiha ustida ishlayapsiz. Bir narsani o'zgartirib — saqlaysiz. Yana o'zgartirib — yana saqlaysiz. Tez orada papkangiz to'la bo'ladi: loyiha, loyiha2, loyiha_final, loyiha_oxirgi_ROST... Endi xato qildingiz, lekin uchinchi versiya yaxshiroq edi. Qaysi biriga qaytasiz? Buning aqlli yo'li bormi?`, trigger: 'on_mount', waits_for: { type: 'option_picked' } }]);
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const FILES = ['loyiha.html', 'loyiha2.html', 'loyiha_final.html', 'loyiha_final_ROST.html', 'loyiha_oxirgi(1).html'];
  const [saved, setSaved] = useState(storedAnswer ? FILES.length : 1);
  const OPTS = [
    { id: 'a', label: "Yo'q — har safar yangi nom bilan saqlayverish kerak" },
    { id: 'b', label: 'Ha — maxsus dastur har bir versiyani eslab qoladi' },
    { id: 'c', label: "Eski faylni o'chirib, qaytadan yozish kerak" }
  ];
  const save = () => setSaved(s => Math.min(s + 1, FILES.length));
  const pick = (v) => { if (picked !== null) return; setPicked(v); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: true }); audio.triggerEvent('option_picked'); };
  return (
    <Stage eyebrow="Kirish" screen={screen} audioState={audio} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 760 }}>Xato qildingiz — kodni <span className="italic" style={{ color: T.accent }}>orqaga</span> qaytarib bo'ladimi?</h1>
        <Mentor>Bir narsani o'zgartirib <b style={{ color: T.ink }}>saqlaysiz</b>. Yana — yana saqlaysiz. Tez orada papka to'la: <span className="mono">loyiha_final_ROST.html</span>… Endi 3-versiya yaxshiroq edi. Qaysi biriga qaytasiz? Tugmani bosib, tartibsizlikni ko'ring.</Mentor>
        <Split>
          <Col>
            <div className="flow-label">Papkangiz</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minHeight: 150 }}>
              {FILES.slice(0, saved).map((f, i) => (
                <div key={i} className="fade-step" style={{ display: 'flex', alignItems: 'center', gap: 9, background: T.paper, borderRadius: 9, padding: '9px 13px', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, color: T.ink, boxShadow: '0 4px 12px -6px rgba(58,53,48,0.18)' }}>
                  <span>📄</span><span style={{ flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis' }}>{f}</span>
                  {i === saved - 1 && saved > 1 && <span className="mono small" style={{ color: T.accent, flexShrink: 0 }}>yangi</span>}
                </div>
              ))}
            </div>
            <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={save} disabled={saved >= FILES.length}>{saved >= FILES.length ? '🤯 Tamom — chalkashlik!' : '💾 Yana saqlash'}</button>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Buning aqlli yo'li bormi?</p>
            <div className="fade-up delay-3" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {OPTS.map(o => { const on = picked === o.id; return (<button key={o.id} className={`hook-option ${on ? 'on' : ''}`} disabled={picked !== null} onClick={() => pick(o.id)}><span className="radio">{on && <span className="radio-dot" />}</span><span>{o.label}</span></button>); })}
            </div>
            {picked !== null && <p className="hook-ack fade-step">To'g'ri yo'nalish! Maxsus dastur — <b>Git</b> — har bir o'zgarishni eslab qoladi va istalgan nuqtaga qaytaradi. Xuddi <b>vaqt mashinasi</b> kabi.</p>}
          </Col>
        </Split>
      </div>
    </Stage>
  );
};

// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's1', text: `Bugun Git va GitHub bilan tanishamiz — bu dasturchining eng muhim quroli. 5 qadamda kodingizni xavfsiz saqlash, istalgan nuqtaga orqaga qaytish va uni bulutga — GitHub'ga yuborishni o'rganamiz.`, trigger: 'on_mount', waits_for: null }]);
  const STEPS = [
    { text: 'Git nima?', tag: 'versiya nazorati' },
    { text: 'commit — saqlangan nuqta', tag: 'snapshot' },
    { text: 'Tarix — vaqt mashinasi', tag: 'orqaga qaytish' },
    { text: 'GitHub — bulutdagi uy', tag: 'github.com' },
    { text: 'push — bulutga yuborish', tag: '' }
  ];
  const isNarrow = useIsMobile(768);
  const [showSteps, setShowSteps] = useState(false);
  const JOURNEY = [{ ic: '✏️', l: "O'zgartirish" }, { ic: '💾', l: 'commit' }, { ic: '🕐', l: 'Tarix' }, { ic: '☁️', l: 'GitHub' }, { ic: '👥', l: 'Jamoa' }];
  const PreviewBlock = (
    <Col>
      <p className="flow-label">Dars oxirida bilasiz — bu yo'lni</p>
      <div className="jmini fade-up delay-1">
        {JOURNEY.map((j, i) => (<React.Fragment key={i}><div className="jmini-node"><span className="jmini-ic">{j.ic}</span><span className="jmini-l">{j.l}</span></div>{i < JOURNEY.length - 1 && <span className="jmini-arr">→</span>}</React.Fragment>))}
      </div>
      <p className="body" style={{ margin: 0, color: T.ink2 }}>…va kodingiz <b style={{ color: T.ink }}>hech qachon</b> yo'qolmaydi.</p>
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
        <div className="head"><h2 className="title h-title fade-up">Kodingiz uchun <span className="italic" style={{ color: T.accent }}>vaqt mashinasi</span> quramiz</h2></div>
        <Mentor>Bugun <b style={{ color: T.ink }}>Git</b> va <b style={{ color: T.ink }}>GitHub</b> bilan tanishamiz — dasturchining eng muhim quroli. <b style={{ color: T.ink }}>5 qadamda</b> kodni saqlash, orqaga qaytish va bulutga yuborishni o'rganamiz.</Mentor>
        {!isNarrow ? (<Split>{PreviewBlock}{StepsBlock}</Split>)
          : !showSteps ? (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}>{PreviewBlock}<button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(true)}>📋 5 qadamni ko'rish</button></div>)
          : (<div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px,2vw,16px)' }}><button className="btn-soft" style={{ alignSelf: 'flex-start' }} onClick={() => setShowSteps(false)}>↩ Yo'lni ko'rish</button>{StepsBlock}</div>)}
      </div>
    </Stage>
  );
};

// ===== SCREEN 2 — GIT (save point) =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's2', text: `Git — versiya nazorati tizimi. Eng oson tushuntirish: kompyuter o'yinini eslang. Qiyin bosqichga yetganda checkpoint — saqlash nuqtasi qo'yasiz. Agar o'lib qolsangiz, boshidan emas, o'sha checkpointdan davom etasiz. Git aynan shu — kodingiz uchun checkpoint qo'yadi. Oldinga yuring, checkpoint qo'ying va xato qilib ko'ring.`, trigger: 'on_mount', waits_for: null }]);
  const N = 5;
  const [pos, setPos] = useState(storedAnswer ? 3 : 0);
  const [cp, setCp] = useState(storedAnswer ? 3 : null);
  const done = cp !== null;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const fwd = () => setPos(p => Math.min(p + 1, N - 1));
  const save = () => setCp(pos);
  const die = () => { if (cp !== null) setPos(cp); };
  return (
    <Stage eyebrow="Git" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? "Davom etish" : "Checkpoint qo'ying"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Git aslida <span className="italic" style={{ color: T.accent }}>nima</span>?</h2></div>
        <Mentor>Git — <b style={{ color: T.ink }}>versiya nazorati</b> tizimi. Kompyuter o'yinini eslang: qiyin joyga yetganda <b style={{ color: T.ink }}>checkpoint</b> qo'yasiz. O'lib qolsangiz — boshidan emas, o'sha nuqtadan davom etasiz. Git kodingiz uchun shunday ishlaydi.</Mentor>
        <div className="split">
          <div className="col">
            <div className="flow-label">O'yin bosqichi</div>
            <div className="lvl fade-up delay-2">
              {Array.from({ length: N }).map((_, i) => (
                <div key={i} className={`lvl-cell ${cp === i ? 'cp' : ''} ${pos === i ? 'here' : ''}`}>{pos === i ? '🏃' : (cp === i ? '🚩' : '')}</div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn" onClick={fwd} disabled={pos >= N - 1}>▶ Oldinga</button>
              <button className="btn-soft" onClick={save}>💾 Checkpoint (commit)</button>
              <button className="btn-soft" onClick={die} disabled={cp === null}>💀 Xato qildim!</button>
            </div>
          </div>
          <div className="col">
            {done ? (
              <div className="frame-success fade-step"><p className="small mono" style={{ margin: '0 0 4px', fontWeight: 600, color: T.success, textTransform: 'uppercase', letterSpacing: '0.08em' }}>✓ Checkpoint ishladi</p><p className="body" style={{ margin: 0, color: T.ink }}>"Xato qildim" bossangiz — oxirgi <b>🚩 checkpoint</b>ga qaytdingiz, boshidan emas! Git ham xuddi shunday: har <b>commit</b> — checkpoint.</p></div>
            ) : (<div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Oldinga yuring, bir joyda <b>Checkpoint</b> qo'ying, keyin "Xato qildim"ni bosib ko'ring.</p></div>)}
            <div className="frame-soft"><p className="body" style={{ margin: 0, color: T.ink }}><b>Git</b> — kodning har bir holatini eslab qoladigan dastur. Checkpoint = <span className="mono">commit</span>.</p></div>
          </div>
        </div>
      </div>
    </Stage>
  );
};
// ===== SCREEN 3 — COMMIT (snapshot) =====
const Screen3 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's3', text: `Git kodni qanday saqlaydi? Har bir saqlash — commit deyiladi. commit — bu kodingizning o'sha lahzadagi surati, xuddi fotosurat kabi. Unga qisqa izoh yozasiz: nima o'zgardi. Rangni o'zgartirib, surat oling — commit qiling.`, trigger: 'on_mount', waits_for: null }]);
  const COLORS = [{ n: 'qora', c: '#0E0E10' }, { n: "ko'k", c: '#019ACB' }, { n: 'qizil', c: '#FF4F28' }, { n: 'yashil', c: '#1F7A4D' }];
  const HASHES = ['a1b2c3d', 'e4f5a6b', 'c7d8e9f', 'b9a8c7d'];
  const [ci, setCi] = useState(0);
  const [commits, setCommits] = useState(storedAnswer?.commits || []);
  const done = commits.length > 0;
  const change = () => setCi(i => (i + 1) % COLORS.length);
  const commit = () => {
    const col = COLORS[ci];
    const next = [{ msg: `Sarlavha rangi: ${col.n}`, hash: HASHES[commits.length % HASHES.length], c: col.c }, ...commits];
    setCommits(next);
    if (storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true, commits: next });
  };
  return (
    <Stage eyebrow="commit" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? "Davom etish" : "Surat oling (commit)"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Git o'zgarishni qanday <span className="italic" style={{ color: T.accent }}>eslab qoladi</span>?</h2></div>
        <Mentor>Git'da har bir saqlash — <b style={{ color: T.ink }}>commit</b>. Bu kodingizning o'sha lahzadagi <b style={{ color: T.ink }}>surati</b> 📸, qisqa izoh bilan. Rangni o'zgartirib, surat oling.</Mentor>
        <div className="split">
          <div className="col">
            <div className="flow-label">Kodingiz</div>
            <pre className="code-box fade-up delay-2" style={{ minHeight: 50 }}><Tg>{'<h1 '}</Tg><At>style</At>=<Sr>{`"color:${COLORS[ci].c}"`}</Sr><Tg>{'>'}</Tg>Salom<Tg>{'</h1>'}</Tg></pre>
            <Preview title="index.html" minH={64}><h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(20px,3vw,28px)', color: COLORS[ci].c, margin: 0 }}>Salom</h1></Preview>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn-soft" onClick={change}>🎨 Rangini o'zgartir</button>
              <button className="btn" onClick={commit}>📸 commit qilish</button>
            </div>
          </div>
          <div className="col">
            <div className="flow-label">commit tarixi</div>
            {commits.length === 0 ? (
              <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Hali surat yo'q — "commit qilish"ni bosing</p></div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {commits.map((c, i) => (
                  <div key={i} className="gcommit">
                    <span className="gcommit-dot">📸</span>
                    <span className="gcommit-body"><span className="gcommit-msg">{c.msg}</span><span className="gcommit-meta">commit {c.hash} · hozir</span></span>
                    <span style={{ width: 16, height: 16, borderRadius: '50%', background: c.c, flexShrink: 0, alignSelf: 'center' }} />
                  </div>
                ))}
              </div>
            )}
            {done && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Har commit — alohida surat: <b>izoh</b> + <b>vaqt</b> + maxsus raqam (<span className="mono">hash</span>). Tarix saqlanib qoladi.</p></div>}
          </div>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 4 — TEST (Git nima qiladi) =====
const Screen4 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 1-savol"
    audioText="Git dasturchiga asosan nima beradi — uning asosiy vazifasi nima?"
    questionText="Git asosan nima qiladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To’g’ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Git asosan <span className="italic" style={{ color: T.accent }}>nima</span> qiladi?</h2></>}
    options={['Kodni chiroyli ranglaydi', 'Kod versiyalarini saqlaydi va orqaga qaytaradi', 'Internetni tezlashtiradi', 'Rasmlarni tahrirlaydi']} correctIdx={1}
    explainCorrect="To’g’ri! Git — versiya nazorati: u kodning har bir versiyasini (commit) saqlaydi va istalgan nuqtaga qaytaradi."
    explainWrong={{ 0: 'Ranglash — CSS ishi. Git esa kod versiyalarini saqlaydi.', 2: "Internet tezligi Git bilan bog'liq emas. Git versiyalarni boshqaradi.", 3: 'Rasm tahrirlash — Git vazifasi emas. U kod tarixini saqlaydi.', default: 'Git kod versiyalarini saqlaydi va orqaga qaytaradi.' }} />
);

// ===== SCREEN 5 — COMMIT JARAYONI (add -> commit) =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's5', text: `commit ikki qadamda bo'ladi. Avval git add — qaysi fayllarni saqlashni tanlaysiz, xuddi savatga solganday. Keyin git commit — ularni izoh bilan saqlaysiz. Tugmalarni bosib, faylni o'zgartirgandan saqlangangacha bo'lgan yo'lni ko'ring.`, trigger: 'on_mount', waits_for: null }]);
  const [stage, setStage] = useState(storedAnswer ? 2 : 0);
  const done = stage >= 2;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const STATUS = [{ ic: '🔴', l: "o'zgartirildi", cls: 'gst-mod' }, { ic: '🟢', l: 'tayyorlandi (staged)', cls: 'gst-staged' }, { ic: '✅', l: 'saqlandi (committed)', cls: 'gst-done' }];
  const cur = STATUS[stage];
  const add = () => { if (stage === 0) setStage(1); };
  const commit = () => { if (stage === 1) setStage(2); };
  return (
    <Stage eyebrow="commit jarayoni" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? "Davom etish" : "Saqlang (add → commit)"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Saqlashdan oldin <span className="italic" style={{ color: T.accent }}>nima bo'ladi</span>?</h2></div>
        <Mentor>Avval <span className="mono">git add</span> — qaysi fayllarni saqlashni tanlaysiz (xuddi savatga solganday). Keyin <span className="mono">git commit</span> — ularni <b style={{ color: T.ink }}>izoh bilan</b> saqlaysiz. Tugmalarni bosing.</Mentor>
        <div className="split">
          <div className="col">
            <div className="flow-label">Fayl holati</div>
            <div className="gfile fade-up delay-2"><span style={{ fontSize: 18 }}>📄</span><span className="gfile-name">index.html</span><span className={`gfile-status ${cur.cls}`}>{cur.ic} {cur.l}</span></div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn" onClick={add} disabled={stage !== 0}>📥 git add</button>
              <button className="btn" onClick={commit} disabled={stage !== 1}>💾 git commit</button>
            </div>
            <div className="frame-soft"><p className="body" style={{ margin: 0, color: T.ink }}><b>add</b> → fayllarni tanlash. <b>commit</b> → izoh bilan saqlash. Ikkisi birga.</p></div>
          </div>
          <div className="col">
            <div className="flow-label">Terminal</div>
            <div className="term fade-up delay-2">
              <span className="term-row"><span className="term-prompt">$ </span><span className="term-cmd">{stage >= 1 ? 'git add index.html' : '_'}</span></span>
              {stage >= 2 && <span className="term-row"><span className="term-prompt">$ </span><span className="term-cmd">git commit -m "yangi o'zgarish"</span></span>}
              {stage >= 2 && <span className="term-row"><span className="term-ok">[main a1b2c3d] yangi o'zgarish</span></span>}
              {stage >= 2 && <span className="term-row"><span className="term-out"> 1 fayl o'zgardi</span></span>}
            </div>
            {done && (<div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}><b>add</b> faylni tanladi, <b>commit</b> uni izoh bilan saqladi. Checkpoint tayyor!</p></div>)}
          </div>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 5b — TEST (commit nima) =====
const Screen5b = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Tekshiruv"
    audioText="Kodning bir holatini izoh bilan saqlagan nuqta — bu nima deb ataladi?"
    questionText="Kodning izoh bilan saqlangan nuqtasi nima deb ataladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Mustahkamlash</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Kodning izoh bilan saqlangan <span className="italic" style={{ color: T.accent }}>nuqtasi (surati)</span> nima deb ataladi?</h2></>}
    options={['Brauzer', 'commit', 'Parol', 'Domen']} correctIdx={1}
    explainCorrect="To’g’ri! commit — kodning o’sha lahzadagi saqlangan nuqtasi (surati), izoh bilan birga."
    explainWrong={{ 0: 'Brauzer — saytni ochadigan dastur. Saqlangan nuqta — commit.', 2: "Parol — maxfiy so'z. Kod surati — commit.", 3: 'Domen — sayt manzili. Kodning saqlangan nuqtasi — commit.', default: 'Kodning saqlangan surati — commit.' }} />
);
// ===== SCREEN 6 — TARIX (vaqt mashinasi) =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's6', text: `Endi sehr boshlanadi. Har commit tarixda saqlanadi. Istalgan eski commit'ni tanlasangiz, kodingiz aynan o'sha holatga qaytadi — xuddi vaqt mashinasi. Tarixdagi commit'larni bosib, kod qanday o'zgarishini ko'ring.`, trigger: 'on_mount', waits_for: { type: 'time_travel' } }]);
  const HISTORY = [
    { hash: 'c7d8e9f', msg: "Tugma qo'shildi", code: ['<h1>Salom</h1>', '<p>Mening saytim</p>', '<button>Obuna</button>'] },
    { hash: 'e4f5a6b', msg: "Paragraf qo'shildi", code: ['<h1>Salom</h1>', '<p>Mening saytim</p>'] },
    { hash: 'a1b2c3d', msg: "Boshlang'ich sarlavha", code: ['<h1>Salom</h1>'] }
  ];
  const [sel, setSel] = useState(0);
  const [traveled, setTraveled] = useState(!!storedAnswer);
  const done = traveled;
  const pick = (i) => { setSel(i); if (i !== 0 && !traveled) { setTraveled(true); audio.triggerEvent('time_travel'); if (storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); } };
  const cur = HISTORY[sel];
  return (
    <Stage eyebrow="Tarix" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? "Davom etish" : "Eski commit'ga qayting"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bir hafta oldingi kodga <span className="italic" style={{ color: T.accent }}>qaytib bo'ladimi</span>?</h2></div>
        <Mentor>Har commit tarixda saqlanadi. Istalgan <b style={{ color: T.ink }}>eski commit</b>'ni tanlasangiz, kod aynan o'sha holatga qaytadi — xuddi <b style={{ color: T.ink }}>vaqt mashinasi</b>. Eski commit'ni bosib ko'ring.</Mentor>
        <div className="split">
          <div className="col">
            <div className="flow-label">commit tarixi (yangidan eskiga)</div>
            <div className="gtl fade-up delay-2">
              {HISTORY.map((h, i) => (
                <div key={h.hash} className={`gtl-node ${sel === i ? 'on' : ''}`} onClick={() => pick(i)}>
                  <div className="gtl-rail"><span className="gtl-dot" />{i < HISTORY.length - 1 && <span className="gtl-line" />}</div>
                  <div className="gtl-card"><div className="gtl-msg">{h.msg}{i === 0 && <span style={{ color: T.accent, fontWeight: 700 }}> · hozir</span>}</div><div className="gtl-hash">commit {h.hash}</div></div>
                </div>
              ))}
            </div>
          </div>
          <div className="col">
            <div className="flow-label">{sel === 0 ? 'Hozirgi kod' : `Kod o'sha paytda · ${cur.hash}`}</div>
            <pre className="code-box fade-up delay-2" key={cur.hash} style={{ minHeight: 90 }}>{cur.code.join('\n')}</pre>
            {done && sel !== 0 && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Kod <b>{cur.hash}</b> holatiga qaytdi! Hech narsa yo'qolmadi — istalgan paytga sayohat qilsangiz bo'ladi.</p></div>}
            {done && sel === 0 && <div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Yana <b>hozirgi</b> holatga qaytdingiz. Git hammasini eslab turadi.</p></div>}
          </div>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 7 — GITHUB (bulutdagi uy) =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's7', text: `Git kompyuteringizda ishlaydi — bu sizning shaxsiy kundaligingiz. Lekin kompyuter buzilsa-chi? Yoki kodni do'stingizga ko'rsatmoqchi bo'lsangiz? Shu yerda GitHub keladi — bu bulutdagi uy. Kodingiz internetda xavfsiz saqlanadi, istalgan joydan ochiladi va boshqalar bilan ulashasiz. Tugmani bosib, loyihani GitHub'ga joylang.`, trigger: 'on_mount', waits_for: null }]);
  const [uploaded, setUploaded] = useState(!!storedAnswer);
  const done = uploaded;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const BEN = [{ ic: '🛡️', t: 'Zaxira — kompyuter buzilsa ham kod saqlanadi' }, { ic: '🌍', t: 'Istalgan joydan — uydan, maktabdan ochiladi' }, { ic: '👥', t: "Ulashish — do'stlar bilan birga ishlaysiz" }, { ic: '💼', t: "Portfolio — ishlaringiz ko'rinadi" }];
  return (
    <Stage eyebrow="GitHub" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? "Davom etish" : "GitHub'ga joylang"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Kompyuter buzilsa, kod <span className="italic" style={{ color: T.accent }}>yo'qoladimi</span>?</h2></div>
        <Mentor>Git faqat <b style={{ color: T.ink }}>kompyuteringizda</b> ishlaydi. Lekin kompyuter buzilsa yoki yo'qolsa — kod ham ketadimi? Yo'q! <b style={{ color: T.ink }}>GitHub</b> bor — kodning <b style={{ color: T.ink }}>bulutdagi nusxasi</b>. Tugmani bosib, loyihani bulutga joylang.</Mentor>
        <div className="split">
          <div className="col">
            <div className="cs fade-up delay-2">
              <div className="cs-node"><span className="cs-ic">💻</span><span className="cs-l">Git<br />(kompyuteringiz)</span></div>
              <div className="cs-wire"><div className={`cs-msg cs-req ${uploaded ? 'on' : ''}`}>⬆️ push</div></div>
              <div className={`cs-node ${uploaded ? 'cs-active' : ''}`}><span className="cs-ic">☁️</span><span className="cs-l">GitHub<br />(bulut)</span></div>
            </div>
            {!uploaded ? <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setUploaded(true)}>☁️ GitHub'ga joylash</button>
              : <p className="mono small fade-step" style={{ color: T.success, margin: 0, fontWeight: 600 }}>✓ github.com/siz/loyiha</p>}
          </div>
          <div className="col">
            <div className="flow-label">GitHub nima beradi</div>
            {uploaded ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }} className="fade-step">
                {BEN.map((b, i) => (<div key={i} className="gfile" style={{ fontFamily: "'Manrope', sans-serif" }}><span style={{ fontSize: 18 }}>{b.ic}</span><span className="gfile-name" style={{ fontFamily: "'Manrope', sans-serif", fontSize: 13.5 }}>{b.t}</span></div>))}
              </div>
            ) : (<div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Chapdagi tugmani bosing — kod kompyuterdan bulutga (GitHub) ko'chadi.</p></div>)}
          </div>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 8 — PUSH & PULL =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's8', text: "Kodingiz ikki joyda — kompyuteringizda va bulutda. push sizdagi commit'larni bulutga yuboradi, pull bulutdagilarni sizga oladi. Bu yerda erkin sinab ko'ring: yangi commit qo'shib push qiling, do'stingiz commit qo'shsa pull qiling. Istagancha qayta-qayta bosib ko'ring.", trigger: 'on_mount', waits_for: null }]);
  const [local, setLocal] = useState(2);
  const [cloud, setCloud] = useState(storedAnswer ? 2 : 1);
  const [anim, setAnim] = useState(null);
  const [didPush, setDidPush] = useState(!!storedAnswer);
  const [didPull, setDidPull] = useState(!!storedAnswer);
  const timer = useRef(null);
  const done = didPush && didPull;
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  const newCommit = () => { if (anim) return; setLocal(n => n + 1); };
  const friendCommit = () => { if (anim) return; setCloud(n => n + 1); };
  const push = () => { if (anim || local <= cloud) return; const target = local; setAnim('push'); timer.current = setTimeout(() => { setCloud(target); setAnim(null); setDidPush(true); }, 750); };
  const pull = () => { if (anim || cloud <= local) return; const target = cloud; setAnim('pull'); timer.current = setTimeout(() => { setLocal(target); setAnim(null); setDidPull(true); }, 750); };
  return (
    <Stage eyebrow="push & pull" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? "Davom etish" : "push va pull'ni sinang"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Kodni bulut bilan qanday <span className="italic" style={{ color: T.accent }}>almashasiz</span>?</h2></div>
        <Mentor>Kodingiz ikki joyda: kompyuter va bulut. <b style={{ color: T.ink }}>push</b> — sizdagini bulutga yuboradi, <b style={{ color: T.ink }}>pull</b> — bulutdagini sizga oladi. Erkin sinang: commit qo'shib push qiling, do'st commit qo'shsa pull qiling — qayta-qayta.</Mentor>
        <div className="split">
          <div className="col">
            <div className="cs fade-up delay-2">
              <div className={`cs-node ${local >= cloud ? 'cs-active' : ''}`}><span className="cs-ic">💻</span><span className="cs-l">Lokal<br /><b>{local} commit</b></span></div>
              <div className="cs-wire">
                <div className={`cs-msg cs-req ${anim === 'push' ? 'on' : ''}`}>⬆️ push</div>
                <div className={`cs-msg cs-res ${anim === 'pull' ? 'on' : ''}`}>⬇️ pull</div>
              </div>
              <div className={`cs-node ${cloud >= local ? 'cs-active' : ''}`}><span className="cs-ic">☁️</span><span className="cs-l">GitHub<br /><b>{cloud} commit</b></span></div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn" onClick={push} disabled={anim !== null || local <= cloud}>⬆️ git push</button>
              <button className="btn" onClick={pull} disabled={anim !== null || cloud <= local}>⬇️ git pull</button>
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn-soft" onClick={newCommit} disabled={anim !== null}>✏️ Yangi commit</button>
              <button className="btn-soft" onClick={friendCommit} disabled={anim !== null}>👤 Do'st commit qo'shdi</button>
            </div>
          </div>
          <div className="col">
            {anim === 'push' ? (<div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>⬆️ commit'lar bulutga yuborilmoqda…</p></div>)
              : anim === 'pull' ? (<div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>⬇️ commit'lar bulutdan olinmoqda…</p></div>)
                : local > cloud ? (<div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Lokalda <b>{local - cloud}</b> ta yangi commit bor. <b>push</b> bilan bulutga yuboring.</p></div>)
                  : cloud > local ? (<div className="frame-soft"><p className="small mono" style={{ margin: '0 0 4px', fontWeight: 600, color: T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>👤 Do'stdan yangilik</p><p className="body" style={{ margin: 0, color: T.ink }}>Bulutda <b>{cloud - local}</b> ta yangi commit bor. <b>pull</b> bilan o'zingizga oling.</p></div>)
                    : (<div className="frame-success"><p className="small mono" style={{ margin: '0 0 4px', fontWeight: 600, color: T.success, textTransform: 'uppercase', letterSpacing: '0.08em' }}>✓ Sinxron</p><p className="body" style={{ margin: 0, color: T.ink }}>Lokal va bulut bir xil! "Yangi commit" yoki "Do'st commit" qo'shib, yana push/pull qiling.</p></div>)}
            <div style={{ display: 'flex', gap: 16, fontFamily: "'Manrope', sans-serif", fontSize: 13, fontWeight: 600 }}>
              <span style={{ color: didPush ? T.success : T.ink3 }}>{didPush ? '✓' : '○'} push sinaldi</span>
              <span style={{ color: didPull ? T.success : T.ink3 }}>{didPull ? '✓' : '○'} pull sinaldi</span>
            </div>
          </div>
        </div>
      </div>
    </Stage>
  );
};
// ===== SCREEN 9 — TEST (push) =====
const Screen9 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 2-savol"
    audioText="git push buyrug'i nima qiladi — u kodni qayerga jo'natadi?"
    questionText="git push buyrug'i nima qiladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}><span className="italic" style={{ color: T.accent }}>git push</span> buyrug'i nima qiladi?</h2></>}
    options={["Kodni butunlay o'chiradi", "Lokal commit'larni GitHub'ga (bulutga) yuboradi", "Yangi rang qo'shadi", 'Internetni tezlashtiradi']} correctIdx={1}
    explainCorrect="To'g'ri! push — lokal kompyuteringizdagi commit'larni GitHub'ga (bulutga) yuboradi."
    explainWrong={{ 0: "push o'chirmaydi — aksincha, commit'laringizni bulutga yuboradi.", 2: "Rang — CSS ishi. push esa commit'larni bulutga yuboradi.", 3: "Internet tezligi push bilan bog'liq emas. U commit'larni yuboradi.", default: "push — lokal commit'larni GitHub'ga yuboradi." }} />
);

// ===== SCREEN 10 — REPOSITORY =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's10', text: "Kodingiz qayerda yashaydi? Repository'da — qisqacha repo. Repo — bu Git kuzatadigan loyiha papkasi. Ichida barcha fayllar, commit tarixi va README bor. GitHub'dagi repo qismlarini bosib o'rganing.", trigger: 'on_mount', waits_for: null }]);
  const PARTS = {
    name: { label: 'Repo nomi', body: "Repository — Git kuzatadigan loyiha papkasi. Har repo'ning manzili bor: github.com/siz/loyiha." },
    files: { label: 'Fayllar', body: "Loyihaning barcha fayllari shu yerda: index.html, style.css va boshqalar." },
    readme: { label: 'README.md', body: "README — loyiha tavsifi. Repo'ni ochgan har kim avval shuni o'qiydi: bu qanday loyiha." },
    commits: { label: 'commit tarixi', body: "Repo barcha commit'larni saqlaydi — butun tarix shu yerda, vaqt mashinasi." }
  };
  const KEYS = Object.keys(PARTS);
  const [seen, setSeen] = useState(storedAnswer?.seen || []);
  const [active, setActive] = useState(storedAnswer ? 'name' : null);
  const done = seen.length >= KEYS.length;
  const click = (k) => { setActive(k); setSeen(s => { const ns = s.includes(k) ? s : [...s, k]; if (ns.length >= KEYS.length && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true, seen: ns }); return ns; }); };
  return (
    <Stage eyebrow="Repository" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? "Davom etish" : `Qismlarni oching (${seen.length}/${KEYS.length})`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Loyihaning hamma narsasi <span className="italic" style={{ color: T.accent }}>qayerda turadi</span>?</h2></div>
        <Mentor>Loyihangizning fayllari, commit tarixi va tavsifi — hammasi qayerda? <b style={{ color: T.ink }}>Repository</b>'da (qisqacha <b style={{ color: T.ink }}>repo</b>) — Git kuzatadigan loyiha papkasi. GitHub'dagi repo qismlarini bosib o'rganing.</Mentor>
        <div className="split">
          <div className="col">
            <div className="repo fade-up delay-2">
              <div className="repo-top">📦 <b>mening-saytim</b> <span style={{ marginLeft: 'auto', color: T.ink3, fontSize: 11 }}>Public</span></div>
              <div className={`repo-row ${active === 'name' ? 'on' : ''}`} onClick={() => click('name')}>🔗 github.com/siz/mening-saytim</div>
              <div className={`repo-row ${active === 'files' ? 'on' : ''}`} onClick={() => click('files')}>📄 index.html · style.css</div>
              <div className={`repo-row ${active === 'readme' ? 'on' : ''}`} onClick={() => click('readme')}>📝 README.md</div>
              <div className={`repo-row ${active === 'commits' ? 'on' : ''}`} onClick={() => click('commits')}>🕐 5 commit</div>
            </div>
          </div>
          <div className="col">
            <div className="flow-label">Qism haqida</div>
            {active ? (
              <div className="sk-info" key={active}><div className="sk-tagbig" style={{ marginBottom: 8 }}><span className="sk-wordbadge">{PARTS[active].label}</span></div><p className="body" style={{ margin: 0, color: T.ink }}>{PARTS[active].body}</p></div>
            ) : (<div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Repo qismini bosing — izoh chiqadi</p></div>)}
            {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Repo — bitta loyiha uchun bitta uy: fayllar + tarix + tavsif, hammasi birga.</p></div>}
          </div>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 11 — CLONE & JAMOA =====
const Screen11 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's11', text: "GitHub'ning eng kuchli tomoni — birga ishlash. Boshqaning ochiq loyihasini ko'rdingizmi? clone qilib, butun repo'ni kompyuteringizga nusxalaysiz. Keyin o'zgartirib, push qilasiz. Shunday qilib millionlab dasturchilar bitta loyihada birga ishlaydi. Clone tugmasini bosib ko'ring.", trigger: 'on_mount', waits_for: null }]);
  const [cloned, setCloned] = useState(!!storedAnswer);
  const done = cloned;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Jamoa" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? "Davom etish" : "Clone qiling"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Boshqaning loyihasini qanday <span className="italic" style={{ color: T.accent }}>olasiz</span>?</h2></div>
        <Mentor>GitHub'ning eng kuchli tomoni — <b style={{ color: T.ink }}>birga ishlash</b>. Boshqaning loyihasini <b style={{ color: T.ink }}>clone</b> qilib, butun repo'ni kompyuteringizga nusxalaysiz. Keyin o'zgartirib, push qilasiz. Tugmani bosing.</Mentor>
        <div className="split">
          <div className="col">
            <div className="cs fade-up delay-2">
              <div className="cs-node cs-active"><span className="cs-ic">☁️</span><span className="cs-l">GitHub repo<br />(jamoaniki)</span></div>
              <div className="cs-wire"><div className={`cs-msg cs-res ${cloned ? 'on' : ''}`}>⬇️ clone</div></div>
              <div className={`cs-node ${cloned ? 'cs-active' : ''}`}><span className="cs-ic">💻</span><span className="cs-l">Sizning<br />kompyuter</span></div>
            </div>
            {!cloned ? <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setCloned(true)}>⬇️ git clone</button>
              : <div className="term fade-step"><span className="term-row"><span className="term-prompt">$ </span><span className="term-cmd">git clone github.com/jamoa/loyiha</span></span><span className="term-row"><span className="term-ok">✓ Nusxalandi — barcha fayl va tarix</span></span></div>}
          </div>
          <div className="col">
            {done ? (
              <div className="frame-success fade-step"><p className="small mono" style={{ margin: '0 0 4px', fontWeight: 600, color: T.success, textTransform: 'uppercase', letterSpacing: '0.08em' }}>✓ Repo nusxalandi</p><p className="body" style={{ margin: 0, color: T.ink }}>Endi butun loyiha sizda — barcha fayl va commit tarixi bilan. O'zgartirib, <b>push</b> qilsangiz, jamoa sizning hissangizni ko'radi.</p></div>
            ) : (<div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}><b>clone</b> — bulutdagi butun repo'ni kompyuteringizga ko'chiradi.</p></div>)}
            <div className="frame-soft"><p className="body" style={{ margin: 0, color: T.ink }}>Millionlab dasturchilar shunday ishlaydi: <b>clone</b> → o'zgartir → <b>push</b>. Bitta loyiha — ko'p odam.</p></div>
          </div>
        </div>
      </div>
    </Stage>
  );
};
// ===== SCREEN 12 — TEST (GitHub nima uchun) =====
const Screen12 = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Mashq · 3-savol"
    audioText="GitHub asosan nima uchun kerak — uning ikki asosiy foydasi nima?"
    questionText="GitHub asosan nima uchun kerak?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri javobni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>GitHub asosan <span className="italic" style={{ color: T.accent }}>nima uchun</span> kerak?</h2></>}
    options={["Faqat o'yin o'ynash uchun", "Kodni bulutda saqlash va jamoa bilan ishlash uchun", "Rasmlarni tahrirlash uchun", "Internetni tezlashtirish uchun"]} correctIdx={1}
    explainCorrect="To'g'ri! GitHub — kodni bulutda xavfsiz saqlaydi va boshqalar bilan birga ishlash imkonini beradi."
    explainWrong={{ 0: "GitHub o'yin platformasi emas. U kodni saqlaydi va jamoa ishini birlashtiradi.", 2: "Rasm tahrirlash — Photoshop ishi. GitHub kod va loyihalar uchun.", 3: "Internet tezligi GitHub bilan bog'liq emas. U kodni bulutda saqlaydi.", default: "GitHub — kodni bulutda saqlash va birga ishlash uchun." }} />
);

// ===== SCREEN 13 — WORKFLOW SIMULATOR =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's13', text: "Endi o'zingiz to'liq aylanani bajaring. Faylni o'zgartirdingiz. Endi uchta buyruqni tartib bilan bosing: git add fayllarni tanlaydi, git commit saqlaydi, git push GitHub'ga yuboradi. Tartib muhim!", trigger: 'on_mount', waits_for: null }]);
  const CMDS = [
    { cmd: 'git add .', out: "O'zgarishlar tanlandi (staged)", ic: '📥', l: 'add' },
    { cmd: 'git commit -m "yangi sahifa"', out: '[main a1b2c3d] yangi sahifa', ic: '💾', l: 'commit' },
    { cmd: 'git push', out: "GitHub'ga yuborildi ✓", ic: '⬆️', l: 'push' }
  ];
  const NODES = [{ ic: '✏️', l: "O'zgartirish" }, ...CMDS.map(c => ({ ic: c.ic, l: c.l }))];
  const [step, setStep] = useState(storedAnswer ? CMDS.length : 0);
  const done = step >= CMDS.length;
  const run = (i) => { if (i !== step) return; const ns = step + 1; setStep(ns); if (ns >= CMDS.length && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); };
  return (
    <Stage eyebrow="Amaliyot · workflow" screen={screen} narrow audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? "Davom etish" : "Aylanani bajaring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(12px,2vw,18px)' }}>
        <div className="head"><h2 className="title h-title fade-up">To'liq aylana — <span className="italic" style={{ color: T.accent }}>o'zingiz bajaring</span></h2></div>
        <Mentor>Faylni o'zgartirdingiz. Endi uchta buyruqni <b style={{ color: T.ink }}>tartib bilan</b> bosing: <span className="mono">add</span> → <span className="mono">commit</span> → <span className="mono">push</span>. Tartib muhim!</Mentor>
        <div className="frame frame-col fade-up delay-2">
          <div className="pz-flow">{NODES.map((s, i) => (<React.Fragment key={i}><div className={`pz-step ${i === 0 || step >= i ? 'on' : ''} ${i > 0 && step + 1 === i ? 'active' : ''}`}><span className="pz-ic">{i === 0 ? '✏️' : (step >= i ? '✓' : s.ic)}</span><span className="pz-lbl">{s.l}</span></div>{i < NODES.length - 1 && <span className={`pz-arrow ${step >= i ? 'on' : ''}`}>→</span>}</React.Fragment>))}</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {CMDS.map((c, i) => (<button key={i} className={`chip ${step === i ? 'chip-on' : ''}`} disabled={step !== i} onClick={() => run(i)}>{c.ic} git {c.l}</button>))}
          </div>
        </div>
        <div className="term fade-up delay-2" style={{ minHeight: 70 }}>
          {step === 0 ? <span className="term-row"><span className="term-out">{'// Buyruqlarni tartib bilan bosing…'}</span></span>
            : CMDS.slice(0, step).map((c, i) => (<React.Fragment key={i}><span className="term-row"><span className="term-prompt">$ </span><span className="term-cmd">{c.cmd}</span></span><span className="term-row"><span className="term-ok">{c.out}</span></span></React.Fragment>))}
        </div>
        {done && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Mana to'liq aylana: <b>o'zgartir → add → commit → push</b>. Kodingiz endi GitHub'da, xavfsiz!</p></div>}
      </div>
    </Stage>
  );
};

// ===== SCREEN 14 — DEBUGGING (push ishlamadi) =====
const Screen14 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's14', text: "AI sizga buyruqlar berdi, lekin push ishlamadi. Nega? Diqqat bilan qarang: git add bor, git push bor, lekin orasida git commit yo'q! Saqlanmagan narsani yuborib bo'lmaydi. Avval ishga tushiring, keyin yetishmagan qadamni qo'shing.", trigger: 'on_mount', waits_for: { type: 'error_found' } }]);
  const [stage, setStage] = useState(storedAnswer ? 'fixed' : 'idle'); // idle -> failed -> fixed
  const done = stage === 'fixed';
  const fail = () => { if (stage !== 'idle') return; setStage('failed'); audio.triggerEvent('error_found'); if (!audio.muted) setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff("Mana muammo: git add dan keyin to'g'ridan-to'g'ri push. Orasida git commit yo'q — saqlanmagan o'zgarishni yuborib bo'lmaydi."); }, 300); };
  const fix = () => { setStage('fixed'); if (storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); if (!audio.muted) setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff("Tuzatildi! Endi git commit bor — o'zgarish saqlandi va push ishladi."); }, 300); };
  return (
    <Stage eyebrow="Debugging" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? "Davom etish" : (stage === 'failed' ? "Endi tuzating" : "Ishga tushiring")} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">push ishlamadi — <span className="italic" style={{ color: T.accent }}>nega</span>?</h2></div>
        <Mentor>AI buyruqlar berdi, lekin push ishlamadi. Diqqat bilan qarang: <span className="mono">add</span> bor, <span className="mono">push</span> bor, lekin orasida <b style={{ color: T.ink }}>commit yo'q</b>! Ishga tushiring, keyin tuzating.</Mentor>
        <div className="split">
          <div className="col">
            <div className="term fade-up delay-2" style={{ minHeight: 100 }}>
              <span className="term-row"><span className="term-prompt">$ </span><span className="term-cmd">git add .</span></span>
              {stage === 'fixed' && <span className="term-row fade-step"><span className="term-prompt">$ </span><span className="term-cmd">git commit -m "yangi"</span></span>}
              {stage === 'fixed' && <span className="term-row"><span className="term-ok">[main a1b2c3d] yangi</span></span>}
              <span className="term-row"><span className="term-prompt">$ </span><span className="term-cmd">git push</span></span>
              {stage === 'failed' && <span className="term-row fade-step"><span className="term-err">✗ Xato: nothing to commit — saqlanmagan</span></span>}
              {stage === 'fixed' && <span className="term-row"><span className="term-ok">✓ GitHub'ga yuborildi</span></span>}
            </div>
            {stage === 'idle' && <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={fail}>▶ Buyruqlarni bajarish</button>}
            {stage === 'failed' && <button className="btn fade-step" style={{ alignSelf: 'flex-start' }} onClick={fix}>🔧 git commit qo'shib tuzatish</button>}
            {stage === 'fixed' && <p className="mono small" style={{ color: T.success, margin: 0, fontWeight: 600 }}>✓ add → commit → push — to'g'ri!</p>}
          </div>
          <div className="col">
            {stage === 'idle' && (<div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Buyruqlarni o'qing. "Bajarish"ni bosib, nima bo'lishini ko'ring.</p></div>)}
            {stage === 'failed' && (<div className="frame-warn fade-step"><p className="note-h" style={{ color: T.accent }}>❌ commit tushib qolgan</p><p className="body" style={{ margin: 0, color: T.ink }}><span className="mono">add</span> fayllarni tanladi, lekin <b>commit</b> qilinmadi — saqlangan narsa yo'q. push yuboradigan narsani topolmadi. Chap tomondagi tugma bilan tuzating →</p></div>)}
            {stage === 'fixed' && (<div className="takeaway fade-step"><div className="ta-bulb">🛠️</div><p className="ta-h">Yetishmagan qadamni topding!</p><p className="ta-sub">add → commit → push: har biri kerak, tartib bilan</p></div>)}
          </div>
        </div>
      </div>
    </Stage>
  );
};
// ===== SCREEN 15 — YAKUNIY (yozma) =====
const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's15', text: "Oxirgi qadam: o'zingiz commit buyrug'ini yozing. Uch qism kerak: git commit, so'ng -m bayrog'i, so'ng qo'shtirnoq ichida izoh. Pastdagi namunaga qarab yozing.", trigger: 'on_mount', waits_for: null }]);
  const [val, setVal] = useState(storedAnswer?.picked || '');
  const norm = val.trim();
  const hasCmd = /git\s+commit/i.test(norm);
  const hasM = /-m\b/.test(norm);
  const afterM = hasM ? norm.split(/-m/i).slice(1).join('-m') : '';
  const qmatch = afterM.match(/["'‘’“”]\s*([^"'‘’“”]+?)\s*["'‘’“”]/);
  const hasMsg = hasM && !!qmatch;
  const valid = hasCmd && hasM && hasMsg;
  const solvedRef = useRef(!!storedAnswer);
  useEffect(() => {
    if (valid && !solvedRef.current) {
      solvedRef.current = true;
      onAnswer(screen, { stage: 'final', screenIdx: screen, correct: true, firstAttemptCorrect: true, picked: val });
      const e = getAudioEngine();
      if (e && !audio.muted) setTimeout(() => { if (!audio.muted) e.pushOneOff("Zo'r! git commit, -m va izoh — uchchalasini to'liq yozdingiz."); }, 200);
    }
    // eslint-disable-next-line
  }, [valid]);
  const CHECKS = [{ ok: hasCmd, l: '1. git commit' }, { ok: hasM, l: `2. -m bayrog'i` }, { ok: hasMsg, l: `3. "izoh" qo'shtirnoqda` }];
  return (
    <Stage eyebrow="Yakuniy · amaliy" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!valid} label={valid ? "Davom etish" : "To'liq buyruqni yozing"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(12px,2vw,18px)' }}>
        <div className="head"><h2 className="title h-title fade-up">O'zingiz <span className="italic" style={{ color: T.accent }}>commit</span> yozing</h2></div>
        <Mentor>Uch qism kerak: <span className="mono">git commit</span> + <span className="mono">-m</span> + qo'shtirnoq ichida <b style={{ color: T.ink }}>izoh</b>. Namuna: <span className="mono">{`git commit -m "birinchi commit"`}</span>.</Mentor>
        <div className="split">
          <div className="col">
            <input className="text-input" style={valid ? { boxShadow: `0 8px 22px -6px rgba(31,122,77,0.4), 0 0 0 2px ${T.success}` } : undefined} value={val} placeholder={`git commit -m "..."`} onChange={e => setVal(e.target.value)} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              {CHECKS.map((c, i) => (<div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, fontFamily: "'Manrope', sans-serif", fontSize: 14, color: c.ok ? T.success : T.ink3, fontWeight: c.ok ? 600 : 500 }}><span style={{ width: 20, height: 20, borderRadius: '50%', background: c.ok ? T.success : 'transparent', boxShadow: c.ok ? 'none' : `inset 0 0 0 2px ${T.ink3}`, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, flexShrink: 0 }}>{c.ok ? '✓' : ''}</span>{c.l}</div>))}
            </div>
          </div>
          <div className="col">
            <div className="flow-label">Natija</div>
            {valid ? (
              <div className="term fade-step"><span className="term-row"><span className="term-prompt">$ </span><span className="term-cmd">{norm}</span></span><span className="term-row"><span className="term-ok">[main a1b2c3d] saqlandi ✓</span></span></div>
            ) : (<div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>To'liq buyruqni yozing — natija shu yerda chiqadi</p></div>)}
            {valid && <div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>To'liq commit buyrug'ini o'zingiz yozdingiz! Endi haqiqiy loyihada ishlata olasiz.</p></div>}
          </div>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 16 — YAKUN =====
const Screen16 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const audio = useAudio([{ id: 's16', text: "Tabriklaymiz! Endi Git va GitHub sirini bilasiz: Git — kod uchun vaqt mashinasi, commit — saqlangan surat, tarix orqali istalgan nuqtaga qaytasiz, GitHub — kodning bulutdagi uyi va jamoa maydoni. push bilan yuborasiz, clone bilan birga ishlaysiz. Endi o'zingizning birinchi repongizni ochishga tayyorsiz!", trigger: 'on_mount', waits_for: null }]);
  const RECAP = ['Git — kod uchun vaqt mashinasi', 'commit — kodning saqlangan surati', 'Tarix — istalgan nuqtaga qaytish', 'GitHub — kodning bulutdagi uyi', 'push / pull — bulut bilan aloqa', 'clone — jamoa bilan birga ishlash'];
  const HOMEWORK = [{ b: "Ro'yxatdan o'ting", t: '— github.com da bepul account oching' }, { b: 'Repo yarating', t: '— birinchi repository: mening-saytim' }, { b: 'commit qiling', t: "— fayl qo'shib, izoh bilan saqlang" }];
  const GLOSSARY = [{ b: 'Git', t: '— versiya nazorati (vaqt mashinasi)' }, { b: 'commit', t: '— kodning saqlangan surati' }, { b: 'repository', t: '— loyiha papkasi (repo)' }, { b: 'GitHub', t: '— bulutdagi uy' }, { b: 'push', t: '— lokal → bulut' }, { b: 'pull', t: '— bulut → lokal' }, { b: 'clone', t: '— repo nusxasini olish' }];
  const correct = SCORED_IDX.filter(i => answers[i]?.correct).length;
  const total = SCORED_IDX.length;
  const PASSED = (total ? correct / total : 0) >= 0.6;
  const [open, setOpen] = useState(false);
  return (
    <Stage eyebrow="Tayyor" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><button className="btn-ghost" onClick={onReset} style={{ padding: 'clamp(11px,1.6vw,13px) clamp(16px,2.2vw,22px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Qaytadan</button><button className="btn-white-accent" onClick={onFinish} style={{ marginLeft: 'auto', padding: 'clamp(11px,1.6vw,13px) clamp(22px,2.6vw,30px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Yakunlash ✓</button></>}>
      <div className="screen">
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">✓</span> Git va GitHub darsi tugadi</span><h2 className="title h-title fade-up d1">Git va GitHub <span className="italic" style={{ color: T.accent }}>sirini</span> ochding.</h2><p className="body h-sub fade-up d2">{PASSED ? "Tabriklaymiz! Endi kodingizni Git bilan boshqarib, GitHub'ga joylaysiz." : "Yaxshi harakat! Bir-ikki joyni mustahkamlash uchun darsni qayta ko'ring."}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span className="tick" style={{ width: 16, height: 16, borderRadius: '50%', background: T.success, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck">✓</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>🔎 Uyga vazifa</div><p className="body" style={{ margin: '0 0 10px', color: T.ink }}>Bilimingizni amalda sinang:</p><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">GitHub'da birinchi repongizni yaratib, do'stlaringizga ulashing!</p></div>
        </div>
        <div className="gloss fade-up d4"><div className="gloss-head" onClick={() => setOpen(o => !o)}><span className="lbl">💡 Kalit so'zlar (takrorlash)</span><span className="gloss-toggle">{open ? '−' : '+'}</span></div>{open && (<div className="gloss-body">{GLOSSARY.map((g, i) => (<span key={i}><b>{g.b}</b> {g.t}{i < GLOSSARY.length - 1 ? ' · ' : ''}</span>))}</div>)}</div>
      </div>
    </Stage>
  );
};

// ============================================================ LESSON ROOT — ({ lang, onFinished })
export default function GitLesson({ lang: langProp, onFinished }) {
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

        /* ============ INTERNET DARS CSS ============ */
        .urlbar { display: flex; align-items: center; gap: 8px; background: ${T.paper}; border-radius: 12px; padding: 8px 8px 8px 14px; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.16); }
        .urlbar-lock { font-size: 13px; flex-shrink: 0; }
        .urlbar-text { font-family: 'JetBrains Mono', monospace; font-size: clamp(14px,1.8vw,16px); color: ${T.ink}; flex: 1; min-width: 0; }
        .urlbar-input { flex: 1; min-width: 0; font-family: 'JetBrains Mono', monospace; font-size: clamp(14px,1.8vw,16px); border: none; background: transparent; color: ${T.ink}; outline: none; }
        .urlbar-go { flex-shrink: 0; font-family: 'Manrope'; font-weight: 700; font-size: 13px; padding: 8px 16px; border-radius: 9px; border: none; background: ${T.accent}; color: #fff; cursor: pointer; transition: all 0.2s; }
        .urlbar-go:hover:not(:disabled) { box-shadow: 0 6px 14px -4px rgba(255,79,40,0.5); }
        .urlbar-go:disabled { opacity: 0.5; cursor: not-allowed; }
        .urlbar-err { box-shadow: 0 0 0 2px ${T.accent}, 0 6px 16px -6px rgba(255,79,40,0.3); }
        .dompill { display: inline-flex; align-self: center; border-radius: 10px; overflow: hidden; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.18); font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: clamp(15px,2.2vw,19px); }
        .dpart { padding: 10px 14px; }
        .dpart-name { background: ${T.accentSoft}; color: ${T.accent}; }
        .dpart-tld { background: #E2F1F7; color: ${T.blue}; }
        .dlabels { display: flex; justify-content: center; gap: 18px; font-size: 12px; color: ${T.ink2}; font-family: 'Manrope'; }
        .ipbox { align-self: flex-start; font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: clamp(16px,2.4vw,20px); color: ${T.blue}; background: #E2F1F7; padding: 10px 16px; border-radius: 10px; }
        .ipbox-sm { font-size: clamp(13px,1.7vw,15px); padding: 5px 10px; }
        .anabox { display: flex; align-items: center; justify-content: center; gap: 12px; background: ${T.paper}; border-radius: 12px; padding: 14px; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.14); text-align: center; }
        .ana-name { font-family: 'Manrope'; font-weight: 600; font-size: 13px; color: ${T.ink}; }
        .ana-arr { font-family: 'JetBrains Mono'; font-weight: 700; color: ${T.accent}; font-size: 12px; flex-shrink: 0; }
        .ana-num { font-family: 'JetBrains Mono'; font-size: 12px; color: ${T.ink2}; }
        .dns-card { background: ${T.paper}; border-radius: 14px; padding: 14px 16px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.14); display: flex; flex-direction: column; gap: 10px; }
        .dns-head { font-family: 'Manrope'; font-weight: 700; font-size: 13px; color: ${T.ink}; }
        .dns-row { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
        .dns-arr { font-family: 'JetBrains Mono'; font-weight: 700; color: ${T.accent}; }
        .cs { display: flex; align-items: center; gap: 8px; background: ${T.paper}; border-radius: 14px; padding: 16px 12px; box-shadow: 0 8px 20px -6px rgba(${T.shadowBase},0.14); }
        .cs-node { display: flex; flex-direction: column; align-items: center; gap: 6px; flex-shrink: 0; padding: 8px; border-radius: 10px; transition: all 0.3s; min-width: 76px; }
        .cs-node.cs-active { background: ${T.accentSoft}; }
        .cs-ic { font-size: 30px; }
        .cs-l { font-family: 'Manrope'; font-size: 11px; font-weight: 600; color: ${T.ink2}; text-align: center; line-height: 1.2; }
        .cs-wire { flex: 1; display: flex; flex-direction: column; gap: 8px; min-width: 0; }
        .cs-msg { font-family: 'JetBrains Mono'; font-size: 11px; padding: 5px 8px; border-radius: 7px; text-align: center; opacity: 0; transform: translateX(-8px); transition: all 0.4s; }
        .cs-req { background: ${T.accentSoft}; color: ${T.accent}; }
        .cs-res { background: ${T.successSoft}; color: ${T.success}; transform: translateX(8px); }
        .cs-msg.on { opacity: 1; transform: none; }
        .jmini { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; background: ${T.paper}; border-radius: 12px; padding: 14px 12px; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.14); }
        .jmini-node { display: flex; flex-direction: column; align-items: center; gap: 3px; }
        .jmini-ic { font-size: 22px; }
        .jmini-l { font-family: 'Manrope'; font-size: 10px; font-weight: 600; color: ${T.ink2}; }
        .jmini-arr { color: ${T.accent}; font-weight: 700; }

        /* ============ GIT/GITHUB DARS CSS ============ */
        .lvl { display: flex; gap: 5px; }
        .lvl-cell { flex: 1; height: 40px; border-radius: 8px; background: ${T.paper}; box-shadow: inset 0 0 0 1.5px rgba(167,166,162,0.4); display: flex; align-items: center; justify-content: center; font-size: 19px; transition: all 0.25s; }
        .lvl-cell.cp { box-shadow: inset 0 0 0 2px ${T.success}; background: ${T.successSoft}; }
        .lvl-cell.here { box-shadow: inset 0 0 0 2px ${T.accent}; background: ${T.accentSoft}; }
        .term { background: ${CODE.bg}; border-radius: 12px; padding: 14px 16px; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.2); display: flex; flex-direction: column; gap: 5px; font-family: 'JetBrains Mono', monospace; font-size: clamp(12px,1.6vw,13.5px); line-height: 1.5; overflow-x: auto; }
        .term-row { white-space: pre-wrap; word-break: break-word; }
        .term-prompt { color: ${CODE.str}; } .term-cmd { color: ${CODE.attr}; } .term-out { color: ${CODE.punct}; } .term-err { color: ${CODE.tag}; } .term-ok { color: ${CODE.str}; }
        .gfile { display: flex; align-items: center; gap: 10px; background: ${T.paper}; border-radius: 11px; padding: 12px 15px; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.16); font-family: 'JetBrains Mono', monospace; font-size: 14px; transition: all 0.3s; }
        .gfile-name { color: ${T.ink}; flex: 1; min-width: 0; }
        .gfile-status { font-family: 'Manrope'; font-weight: 700; font-size: 11px; padding: 4px 11px; border-radius: 99px; flex-shrink: 0; }
        .gst-mod { background: ${T.accentSoft}; color: ${T.accent}; } .gst-staged { background: #E2F1F7; color: ${T.blue}; } .gst-done { background: ${T.successSoft}; color: ${T.success}; }
        .gcommit { display: flex; align-items: flex-start; gap: 12px; background: ${T.paper}; border-radius: 11px; padding: 11px 14px; box-shadow: 0 6px 16px -6px rgba(${T.shadowBase},0.16); animation: fade-step 0.35s ease-out; }
        .gcommit-dot { width: 32px; height: 32px; border-radius: 50%; background: ${T.accentSoft}; display: flex; align-items: center; justify-content: center; font-size: 16px; flex-shrink: 0; }
        .gcommit-body { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
        .gcommit-msg { font-family: 'Manrope'; font-weight: 600; font-size: 13.5px; color: ${T.ink}; }
        .gcommit-meta { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink3}; }
        .gtl { display: flex; flex-direction: column; }
        .gtl-node { display: flex; gap: 13px; cursor: pointer; }
        .gtl-rail { display: flex; flex-direction: column; align-items: center; flex-shrink: 0; }
        .gtl-dot { width: 16px; height: 16px; border-radius: 50%; box-shadow: inset 0 0 0 3px ${T.paper}, 0 0 0 2px ${T.ink3}; background: ${T.ink3}; transition: all 0.25s; margin-top: 5px; }
        .gtl-line { width: 2px; flex: 1; min-height: 20px; background: rgba(167,166,162,0.35); }
        .gtl-node.on .gtl-dot { box-shadow: inset 0 0 0 3px ${T.paper}, 0 0 0 2px ${T.accent}; background: ${T.accent}; }
        .gtl-card { flex: 1; min-width: 0; padding: 9px 13px; border-radius: 10px; background: ${T.paper}; box-shadow: 0 5px 14px -6px rgba(${T.shadowBase},0.14); margin-bottom: 8px; transition: all 0.2s; }
        .gtl-node.on .gtl-card { box-shadow: 0 0 0 2px ${T.accent}, 0 8px 18px -6px rgba(255,79,40,0.25); background: ${T.accentSoft}; }
        .gtl-msg { font-family: 'Manrope'; font-weight: 600; font-size: 13px; color: ${T.ink}; }
        .gtl-hash { font-family: 'JetBrains Mono'; font-size: 11px; color: ${T.ink3}; }
        .repo { background: ${T.paper}; border-radius: 14px; overflow: hidden; box-shadow: 0 8px 22px -6px rgba(${T.shadowBase},0.16); }
        .repo-top { display: flex; align-items: center; gap: 8px; padding: 12px 15px; border-bottom: 1px solid rgba(167,166,162,0.25); font-family: 'JetBrains Mono'; font-size: 13px; color: ${T.ink}; }
        .repo-row { display: flex; align-items: center; gap: 10px; padding: 11px 15px; cursor: pointer; transition: background 0.2s; font-family: 'JetBrains Mono'; font-size: 13px; color: ${T.ink2}; }
        .repo-row:hover { background: ${T.bg}; }
        .repo-row.on { background: ${T.accentSoft}; color: ${T.accent}; }

      `}</style>
      <div className="lesson-root">
        <Current screen={screen} storedAnswer={answers[screen]} answers={answers} onAnswer={recordAnswer} onNext={next} onPrev={prev} onReset={reset} onFinish={finishLesson} />
      </div>
    </LangContext.Provider>
  );
}