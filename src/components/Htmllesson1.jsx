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
    this.currentUtterance = u; window.speechSynthesis.speak(u);
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

const LESSON_META = { lessonId: 'html-01-v15', lessonTitle: { uz: 'HTML asoslari', ru: 'Основы HTML' } };
const SCREEN_META = [
  { id: 's0',  type: 'hook',        template: 'custom',   scored: false, scope: 'hook' },
  { id: 's1',  type: 'rule',        template: 'custom',   scored: false, scope: null },
  { id: 's2',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's3',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's4',  type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's5',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's5b', type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's6',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's7',  type: 'test',        template: 'custom',   scored: true,  scope: 'module-mikro' },
  { id: 's8',  type: 'rule',        template: 'custom',   scored: false, scope: null },
  { id: 's9',  type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's10', type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's11', type: 'test',        template: 'MCScreen', scored: true,  scope: 'module-mikro' },
  { id: 's12', type: 'exploration', template: 'custom',   scored: false, scope: null },
  { id: 's13', type: 'rule',        template: 'custom',   scored: false, scope: null },
  { id: 's14', type: 'case',        template: 'custom',   scored: false, scope: null },
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

const Stage = ({ children, eyebrow, screen, totalScreens = TOTAL_SCREENS, navContent, audioState, narrow }) => {
  const isMobile = useIsMobile();
  const padH = isMobile ? 12 : 100;
  return (
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
      <div className={`stage-content ${narrow ? 'narrow' : ''}`} style={{ paddingLeft: padH, paddingRight: padH }}>{children}</div>
      {navContent && <div className="stage-nav" style={{ paddingLeft: padH, paddingRight: padH }}>{navContent}</div>}
    </div>
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
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const [revealed, setRevealed] = useState(storedAnswer !== undefined);
  const pick = (i) => {
    if (revealed) return;
    setPicked(i); setRevealed(true);
    onAnswer(screen, { stage: scope, screenIdx: screen, picked: i, question: questionText, options, correctIndex: correctIdx, correctAnswer: options[correctIdx], studentAnswerIndex: i, studentAnswer: options[i], correct: i === correctIdx });
    if (audioText) { audio.triggerEvent('option_picked'); if (!audio.muted) setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff(i === correctIdx ? (audioOk || "To'g'ri.") : (audioWrong || "Unchalik emas, tushuntirishga qarang.")); }, 300); }
  };
  return (
    <Stage eyebrow={eyebrow} screen={screen} narrow audioState={audioText ? audio : undefined} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!revealed} onClick={onNext} /></>}>
      <div className="screen" style={{ justifyContent: 'center', gap: 'clamp(16px,2.5vw,24px)' }}>
        <div className="fade-up">{question}</div>
        <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {options.map((opt, i) => {
            let cls = 'option';
            if (revealed) { if (i === correctIdx) cls += ' option-correct'; else if (i === picked) cls += ' option-picked-wrong'; else cls += ' option-wrong'; }
            return (
              <button key={i} className={cls} disabled={revealed} onClick={() => pick(i)} style={{ padding: 'clamp(12px,1.8vw,16px) clamp(14px,2.2vw,20px)', fontSize: 'clamp(14px,1.7vw,16px)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="mono small" style={{ minWidth: 20, color: revealed && i === correctIdx ? T.success : T.ink3 }}>{String.fromCharCode(65 + i)}</span>
                <span style={{ flex: 1 }}>{opt}</span>
              </button>
            );
          })}
        </div>
        <FeedbackBlock show={revealed} isCorrect={picked === correctIdx}>
          <p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: picked === correctIdx ? T.success : T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{picked === correctIdx ? "To'g'ri" : 'Unchalik emas'}</p>
          <p className="body" style={{ margin: 0 }}>{picked === correctIdx ? explainCorrect : (explainWrong[picked] || explainWrong.default)}</p>
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
const Mentor = ({ children }) => (
  <div className="mentor fade-up">
    <div className="mentor-ava" aria-hidden="true">
      <svg viewBox="0 0 40 40" width="40" height="40">
        <circle cx="20" cy="20" r="20" fill={T.accentSoft} />
        <circle cx="20" cy="16" r="6" fill={T.accent} />
        <path d="M8 36 a12 9 0 0 1 24 0 Z" fill={T.accent} />
      </svg>
    </div>
    <div className="mentor-col">
      <span className="mentor-name">Mentor</span>
      <div className="mentor-msg body">{children}</div>
    </div>
  </div>
);

// ===== SCREEN 0 — HOOK =====
const Screen0 = ({ screen, storedAnswer, onAnswer, onNext }) => {
  const audio = useAudio([{ id: 's0', text: `Har kuni eMaktab, YouTube, Telegram'ni ochasiz, to'g'rimi? Ularning hammasi bitta narsadan yasalgan. "Sayt" tugmasini bosib, ichida nima borligini ko'ring.`, trigger: 'on_mount', waits_for: { type: 'option_picked' } }]);
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const [view, setView] = useState('site');
  const OPTS = [
    { id: 'a', label: 'Oddiy inglizcha matn' },
    { id: 'b', label: 'HTML — maxsus belgili til' },
    { id: 'c', label: 'Photoshop kabi dastur' },
    { id: 'd', label: 'Bilmayman, bilib olishni xohlayman' }
  ];
  const pick = (v) => { if (picked !== null) return; setPicked(v); onAnswer(screen, { stage: 'hook', screenIdx: screen, picked: v, correct: true }); audio.triggerEvent('option_picked'); };
  return (
    <Stage eyebrow="Kirish" screen={screen} audioState={audio} navContent={<NavNext disabled={picked === null} label="Davom etish" onClick={onNext} />}>
      <div className="screen">
        <h1 className="title h-title fade-up" style={{ maxWidth: 760 }}>Bu sayt nimadan <span className="italic" style={{ color: T.accent }}>yasalgan</span>?</h1>
        <Mentor>Har kuni eMaktab, YouTube, Telegram'ni ochasiz, to'g'rimi? Ularning hammasi bitta narsadan yasalgan. <b style={{ color: T.ink }}>"Sayt"</b> tugmasini bosib, ichida nima borligini ko'ring.</Mentor>
        <Split>
          <Col>
            <div className="fade-up delay-1" style={{ display: 'flex', gap: 8 }}>
              <button className={`chip ${view === 'site' ? 'chip-on' : ''}`} onClick={() => setView('site')}>🌐 Sayt</button>
              <button className={`chip ${view === 'code' ? 'chip-on' : ''}`} onClick={() => setView('code')}>{'</>'} Kod</button>
            </div>
            <div className="demo-swap" key={view}>
              {view === 'site' ? (
                <Preview minH={170} title="maktab.uz">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 10, borderBottom: `1px solid ${T.ink3}40`, marginBottom: 14, flexWrap: 'wrap', gap: 8 }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><span style={{ width: 22, height: 22, borderRadius: 6, background: T.accent, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Manrope', sans-serif", fontWeight: 800, fontSize: 13 }}>M</span><b style={{ fontFamily: "'Manrope', sans-serif", color: T.ink, fontSize: 15 }}>Maktab</b></span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 11, fontFamily: "'Manrope', sans-serif", fontSize: 12, color: T.ink2 }}><span>Asosiy</span><span>Darslar</span><span style={{ background: T.ink, color: T.bg, padding: '5px 11px', borderRadius: 6, fontWeight: 600 }}>Kirish</span></span>
                  </div>
                  <h1 style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(20px,3.2vw,28px)', margin: '0 0 6px', color: T.ink }}>Xush kelibsiz! 👋</h1>
                  <p style={{ fontFamily: 'Georgia, serif', margin: '0 0 12px', color: T.ink2, fontSize: 'clamp(13px,1.8vw,15px)' }}>Bilim — bir bosishda.</p>
                  <span style={{ display: 'inline-block', fontFamily: "'Manrope', sans-serif", fontWeight: 700, background: T.accent, color: '#fff', padding: '8px 16px', borderRadius: 8, fontSize: 'clamp(12px,1.7vw,14px)' }}>Boshlash</span>
                </Preview>
              ) : (
                <>
                  <CodeBox><Tg>{'<header>'}</Tg>Maktab · Asosiy · Darslar · Kirish<Tg>{'</header>'}</Tg>{'\n'}<Tg>{'<h1>'}</Tg>Xush kelibsiz! 👋<Tg>{'</h1>'}</Tg>{'\n'}<Tg>{'<p>'}</Tg>Bilim — bir bosishda.<Tg>{'</p>'}</Tg>{'\n'}<Tg>{'<button>'}</Tg>Boshlash<Tg>{'</button>'}</Tg></CodeBox>
                  <p className="mono small" style={{ color: T.ink3, marginTop: 6, textAlign: 'center' }}>↑ shu saytning kodi — boshqa hech narsa emas!</p>
                </>
              )}
            </div>
          </Col>
          <Col>
            <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Sizningcha, nima ishlatiladi?</p>
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
            {picked !== null && <p className="hook-ack fade-step">Yaxshi! Hozir hammasini birga ko'rib chiqamiz.</p>}
          </Col>
        </Split>
      </div>
    </Stage>
  );
};
// ===== SCREEN 1 — REJA =====
const Screen1 = ({ screen, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's1', text: `Va'da beraman: dars oxirida o'zingizning saytingiz tayyor bo'ladi — xuddi mana shunaqa. Unga 7 ta qadamda yetib boramiz.`, trigger: 'on_mount', waits_for: null }]);
  const STEPS = [
    { text: 'Kod nima? — tushunamiz', tag: '' }, { text: 'HTML bilan tanishamiz', tag: '' },
    { text: 'Sahifa skeletini quramiz', tag: '' }, { text: "Sarlavha qo'shamiz", tag: 'h1–h6' },
    { text: 'Matn bezaymiz', tag: 'p, strong, em' }, { text: "Ro'yxat yasaymiz", tag: 'ul, ol, li' },
    { text: 'Havola ulaymiz', tag: 'a href' }
  ];
  const G = "Georgia, serif";
  return (
    <Stage eyebrow="Reja" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext label="Boshlaymiz →" onClick={onNext} /></>}>
      <div className="screen">
        <div className="head">
          <h2 className="title h-title fade-up"><span className="italic" style={{ color: T.accent }}>Bugun haqiqiy sayt yasaymiz!</span></h2>
        </div>
        <Mentor>Va'da beraman: dars oxirida <b style={{ color: T.ink }}>o'zingizning saytingiz</b> tayyor bo'ladi — xuddi mana shunaqa. Unga <b style={{ color: T.ink }}>7 ta qadamda</b> yetib boramiz.</Mentor>
        <Split>
          <Col>
            <p className="flow-label">Manzil — dars oxirida shunday bo'ladi</p>
            <Preview title="mening-saytim.html" minH={260}>
              <h1 style={{ fontFamily: G, fontSize: 'clamp(20px,3vw,26px)', margin: '0 0 8px', color: T.ink }}>Salom, men Aziza!</h1>
              <p style={{ fontFamily: G, margin: '0 0 14px', color: T.ink2, fontSize: 'clamp(13px,1.8vw,15px)', lineHeight: 1.5 }}>Web-dasturlashni endi o'rganyapman. Bu — mening birinchi saytim.</p>
              <p style={{ fontFamily: G, fontWeight: 700, margin: '0 0 6px', color: T.ink, fontSize: 'clamp(14px,1.9vw,16px)' }}>Sevimli mashg'ulotlarim:</p>
              <ul style={{ fontFamily: G, color: T.ink, margin: '0 0 14px', paddingLeft: 22, fontSize: 'clamp(13px,1.8vw,15px)', lineHeight: 1.6 }}><li>Minecraft</li><li>Futbol</li><li>Shaxmat</li></ul>
              <a style={{ fontFamily: G, color: T.link, textDecoration: 'underline', fontSize: 'clamp(13px,1.8vw,15px)' }}>Mening Telegram kanalim</a>
            </Preview>
          </Col>
          <Col>
            <p className="flow-label">7 qadam</p>
            <ol className="roadmap">
              {STEPS.map((s, i) => (<li key={i} className="step-card fade-up" style={{ animationDelay: `${0.14 + i * 0.06}s` }}><span className="step-num">{String(i + 1).padStart(2, '0')}</span><span className="step-body"><span className="step-text">{s.text}</span>{s.tag && <span className="step-tag">{s.tag}</span>}</span></li>))}
            </ol>
          </Col>
        </Split>
      </div>
    </Stage>
  );
};


// ===== SCREEN 2 — KOMPYUTER O'ZICHA O'YLAY OLADIMI? (Hayotdan misol) =====
const Screen2 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's2', text: `Pitsa tayyorlashni o'ylab ko'ring. Retseptsiz bo'lmaydi — qadamlarni tartib bilan bajarasiz. O'ngdagi tugmani bosib, retseptni "ishga tushiring".`, trigger: 'on_mount', waits_for: null }]);
  const RECIPE = ['Xamirni yoying', 'Sous suring', 'Pishloq seping', "Qo'shimcha mahsulot qo'shing", 'Pechda pishiring'];
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);
  const timer = useRef(null);
  useEffect(() => () => clearTimeout(timer.current), []);
  const run = () => { clearTimeout(timer.current); setStep(0); const tick = (i) => { setStep(i); if (i < RECIPE.length) timer.current = setTimeout(() => tick(i + 1), 520); else setDone(true); }; tick(1); };
  useEffect(() => {
    if (done && storedAnswer === undefined) {
      onAnswer(screen, { correct: true, picked: true });
      if (!audio.muted) setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff(`Mana shu — dasturlash! Kompyuterga aniq, qadamba-qadam ko'rsatma berasiz. Bu ko'rsatmalar — kod, yozish jarayoni esa dasturlash.`); }, 400);
    }
  }, [done]);
  return (
    <Stage eyebrow="Hayotdan misol" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? "Davom etish" : "Avval bajaring"} onClick={onNext} /></>}>
      <div className="screen">
        <div className="head"><h2 className="title h-title fade-up">Kompyuter <span className="italic" style={{ color: T.accent }}>o'zicha</span> o'ylay oladimi?</h2></div>
        <Mentor>Pitsa tayyorlashni o'ylab ko'ring. Retseptsiz bo'lmaydi — qadamlarni <b style={{ color: T.ink }}>tartib bilan</b> bajarasiz. O'ngdagi tugmani bosib, retseptni "ishga tushiring".</Mentor>
        <Split>
          <Col>
            <div className="frame fade-up delay-1">
              <p className="eyebrow" style={{ color: T.accent, margin: '0 0 10px' }}>Savol</p>
              <p className="body" style={{ margin: 0, color: T.ink }}>Kompyuter juda tez ishlaydi, lekin <b>o'zicha hech narsa qila olmaydi</b>. Unga har bir qadamni aniq aytib berish kerak. Buni qanday qilamiz?</p>
            </div>
            {done && (
              <div className="frame-success fade-step">
                <p className="small mono" style={{ margin: '0 0 6px', fontWeight: 600, color: T.success, textTransform: 'uppercase', letterSpacing: '0.08em' }}>✓ Javob</p>
                <p className="body" style={{ margin: 0, color: T.ink }}>Kompyuterga aniq, qadamba-qadam ko'rsatma beramiz. Bu ko'rsatmalar — <b style={{ color: T.success }}>kod</b>, yozish jarayoni esa <b style={{ color: T.success }}>dasturlash</b>. Kompyuter o'zicha o'ylamaydi — faqat aytganimizni bajaradi.</p>
              </div>
            )}
          </Col>
          <Col>
            <div className="frame fade-up delay-2">
              <p className="eyebrow" style={{ color: T.ink2, margin: '0 0 4px' }}>🍕 Pitsa retsepti</p>
              <ol className="recipe-list">{RECIPE.map((r, i) => { const active = step > i; return (<li key={i} className={active ? 'on' : ''}><span className="recipe-num">{active ? '✓' : ''}</span><span className="recipe-text">{r}</span></li>); })}</ol>
              <button className="btn" onClick={run} style={{ marginTop: 14 }}>{step >= RECIPE.length ? '↻ Yana bajaring' : '▶ Retseptni bajarish'}</button>
            </div>
          </Col>
        </Split>
      </div>
    </Stage>
  );
};



// ===== SCREEN 3 — HTML (savol asosida + Mentor) =====
const Screen3 = ({ screen, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's3', text: `Chrome yoki Safari'ni ochganingizda sayt chiroyli ko'rinadi. Lekin brauzer aslida HTML degan tilni o'qiydi, keyin uni sahifaga aylantiradi. Quyiga ismingizni yozing va kod bilan natija qanday bog'liqligini ko'ring.`, trigger: 'on_mount', waits_for: null }]);
  const FlowArrow = ({ delay = 0 }) => (<div className="flow-arrow"><span className="flow-track"><span className="flow-bead" style={{ animationDelay: `${delay}s` }} /></span><span className="flow-chevron" style={{ animationDelay: `${delay}s` }}>▼</span></div>);
  const [name, setName] = useState('Aziz');
  return (
    <Stage eyebrow="HTML" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext label="Davom etish" onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.5vw,14px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Yozgan so'zingiz qanday <span className="italic" style={{ color: T.accent }}>saytga</span> aylanadi?</h2></div>
        <Mentor>Chrome yoki Safari'ni ochganingizda sayt chiroyli ko'rinadi. Lekin brauzer aslida <b style={{ color: T.ink }}>HTML</b> degan tilni o'qiydi, keyin uni sahifaga aylantiradi. Quyiga ismingizni yozing va kod bilan natija qanday bog'liqligini ko'ring.</Mentor>
        <div className="split">
          <div className="col">
            <div className="fade-up delay-1"><p className="eyebrow" style={{ color: T.ink2, margin: '0 0 8px' }}>Ismingizni yozing — kod va sahifa o'zgaradi</p><input className="text-input" value={name} onChange={e => setName(e.target.value)} maxLength={18} placeholder="Ismingiz" /></div>
            <div className="hint fade-up delay-2"><p className="body" style={{ margin: 0, color: T.ink2 }}>Yozganingiz darhol <b style={{ color: T.ink }}>kodga</b>, kod esa <b style={{ color: T.ink }}>sahifaga</b> aylanadi. O'ngda kuzating.</p></div>
          </div>
          <div className="col" style={{ gap: 7 }}>
            <div className="flow-label">HTML kod</div>
            <pre className="code-box"><Tg>{'<h1>'}</Tg>{name || '...'}<Tg>{'</h1>'}</Tg>{'\n'}<Tg>{'<p>'}</Tg>HTML o'rganyapman<Tg>{'</p>'}</Tg>{'\n'}<Tg>{'<button>'}</Tg>Obuna bo'lish<Tg>{'</button>'}</Tg></pre>
            <FlowArrow delay={0} />
            <div className="brauzer-step" key={`b-${name}`}><span className="brauzer-icon">🌐</span><div><p className="brauzer-h">Brauzer o'qiydi</p><p className="brauzer-sub">kod → sahifa</p></div></div>
            <FlowArrow delay={0.4} />
            <div className="flow-label">Sahifa</div>
            <Preview title="profil.html" minH={92}><div className="profile-card" key={`p-${name}`}><div className="pf-ava">{(name || '?').trim().charAt(0).toUpperCase() || '?'}</div><h1 className="pf-name">{name || '...'}</h1><p className="pf-bio">HTML o'rganyapman</p><button className="pf-btn">Obuna bo'lish</button></div></Preview>
          </div>
        </div>
      </div>
    </Stage>
  );
};


// ===== SCREEN 4 — TEST =====
const Screen4 = (props) => (
  <QuestionScreen {...props} idx={4} scope="module-mikro" eyebrow="Mashq · 1-savol"
    audioText="HTML kodini o'qib, sahifani ekranda ko'rsatadigan dastur qaysi? To'g'ri variantni tanlang."
    questionText="HTML kodini o'qib, sahifani ekranda ko'rsatadigan dastur qaysi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Kim nima qiladi?</p><h2 className="title h-sub" style={{ marginTop: 8 }}>HTML kodini o'qib, sahifani ekranda ko'rsatadigan dastur qaysi?</h2></>}
    options={['Brauzer', 'Server', 'Photoshop', 'Klaviatura']} correctIdx={0}
    explainCorrect="To'g'ri. Brauzer (Chrome, Safari, Firefox, Edge) HTML kodini o'qib, sahifa qilib ekraningizda ko'rsatadi."
    explainWrong={{ 1: 'Server faqat HTML faylni saqlaydi va jo\u2019natadi. Uni o\u2019qib sahifaga aylantirish — brauzerning ishi.', 2: 'Photoshop — bu rasm muharriri, HTML\u2019ga aloqasi yo\u2019q.', 3: 'Klaviatura — bu siz yozadigan qurilma. HTML\u2019ni o\u2019qib ko\u2019rsatadigan — brauzer.', default: 'HTML kodini o\u2019qib, sahifa qilib ko\u2019rsatadigan — brauzer.' }} />
);

// ===== SCREEN 5 — SKELET (savol + Mentor) =====
const Screen5 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's5', text: `Odamda ham ko'rinadigan va ko'rinmaydigan tomon bor: yuzingizni hamma ko'radi, lekin miyangiz ichkarida, ko'rinmasdan ishlaydi. Sahifa ham xuddi shunaqa — head ko'rinmaydigan qism, body ko'rinadigan qism. Har bir qismni bosib, nima ekanini ko'ring.`, trigger: 'on_mount', waits_for: null }]);
  const PARTS = {
    doctype: { tag: '<!DOCTYPE html>', word: "E'lon", role: 'Eng boshida turadi va "bu HTML5 sahifa" deb bildiradi.' },
    html: { tag: '<html>', word: 'Butun hujjat', role: 'Butun sahifani o\u2019rab turadi — head ham, body ham shuning ichida.' },
    head: { tag: '<head>', word: 'Bosh — ko\u2019rinmaydi', role: 'Sahifaning "boshi": title (nom) va sozlamalar. title brauzer tabchasida ko\u2019rinadi, lekin sahifa ichida ko\u2019rinmaydi.' },
    body: { tag: '<body>', word: 'Tana — ko\u2019rinadi', role: 'Sahifaning "tanasi": ko\u2019rinadigan hamma narsa — sarlavha, matn, rasm, havola shu yerda.' }
  };
  const [active, setActive] = useState(null);
  const [clicked, setClicked] = useState(new Set());
  const done = clicked.size === 4;
  const tap = (k) => { setActive(k); setClicked(prev => { const n = new Set(prev); n.add(k); return n; }); };
  const fc = (k, base) => `${base} ${active === k ? 'active' : ''} ${clicked.has(k) ? 'seen' : ''}`;
  const ck = (k) => `ck ${active === k ? 'active' : ''} ${clicked.has(k) ? 'seen' : ''}`;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Struktura" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? "Davom etish" : `${clicked.size}/4 qismi ko'rilgan`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Saytning <span className="italic" style={{ color: T.accent }}>ko'rinmaydigan</span> tomoni bormi?</h2></div>
        <Mentor>Odamda ham ko'rinadigan va ko'rinmaydigan tomon bor: yuzingizni hamma ko'radi, lekin miyangiz ichkarida ishlaydi. Sahifa ham xuddi shunaqa — <b style={{ color: T.ink }}>head</b> ko'rinmaydigan qism, <b style={{ color: T.ink }}>body</b> ko'rinadigan qism. Har qismni bosib biling.</Mentor>
        <div className="split">
          <div className="col">
            <div className="bskel fade-up delay-2">
              <div className={fc('doctype', 'bskel-doctype')} onClick={() => tap('doctype')}>&lt;!DOCTYPE html&gt;</div>
              <div className={fc('html', 'bskel-html')} onClick={() => tap('html')}>
                <span className="bskel-htmllabel">&lt;html&gt; — butun hujjat</span>
                <div className="bskel-win" onClick={(e) => e.stopPropagation()}>
                  <div className={fc('head', 'bskel-tab')} onClick={() => tap('head')}><span className="bskel-dots"><i /><i /><i /></span><span className="bskel-tabpill">Mening sahifam</span><span className="bskel-zone">&lt;head&gt;</span></div>
                  <div className={fc('body', 'bskel-page')} onClick={() => tap('body')}><p className="bskel-ptitle">Salom! 👋</p><p className="bskel-ptext">Bu mening sahifam.</p><span className="bskel-zone bskel-zone-b">&lt;body&gt;</span></div>
                </div>
              </div>
            </div>
          </div>
          <div className="col" style={{ gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <div className="flow-label">HTML kodi</div>
              <span className="small mono" style={{ color: done ? T.success : T.ink3 }}>{clicked.size} / 4 ko'rildi</span>
            </div>
            <pre className="code-box fade-up delay-2">
              <span className={ck('doctype')} onClick={() => tap('doctype')}><span className="t-tag">&lt;!DOCTYPE html&gt;</span></span>{'\n'}
              <span className={ck('html')} onClick={() => tap('html')}><span className="t-tag">&lt;html&gt;</span></span>{'\n'}
              {'  '}<span className={ck('head')} onClick={() => tap('head')}><span className="t-tag">&lt;head&gt;</span></span>{'\n'}
              {'    '}<span className="t-title">&lt;title&gt;Mening sahifam&lt;/title&gt;</span>{'\n'}
              {'  '}<span className={ck('head')} onClick={() => tap('head')}><span className="t-tag">&lt;/head&gt;</span></span>{'\n'}
              {'  '}<span className={ck('body')} onClick={() => tap('body')}><span className="t-tag">&lt;body&gt;</span></span>{'\n'}
              {'    '}<span className="t-cm">&lt;!-- kontent shu yerga --&gt;</span>{'\n'}
              {'  '}<span className={ck('body')} onClick={() => tap('body')}><span className="t-tag">&lt;/body&gt;</span></span>{'\n'}
              <span className={ck('html')} onClick={() => tap('html')}><span className="t-tag">&lt;/html&gt;</span></span>
            </pre>
            {done ? (
              <div className="frame-success fade-step"><p className="small mono" style={{ margin: '0 0 4px', fontWeight: 600, color: T.success, textTransform: 'uppercase', letterSpacing: '0.08em' }}>✓ Skeletni o'rgandingiz</p><p className="body" style={{ margin: 0, color: T.ink }}>Har sahifa shu tartibda: <b>DOCTYPE → html → head (ko'rinmaydi) + body (ko'rinadi)</b>.</p></div>
            ) : active ? (
              <div className="sk-info fade-step" key={active}><span className="sk-tagbig"><span className="sk-chip">{PARTS[active].tag}</span><span className="sk-wordbadge">{PARTS[active].word}</span></span><p className="body" style={{ color: T.ink, margin: '11px 0 0' }}>{PARTS[active].role}</p></div>
            ) : (
              <div className="frame-dash"><p className="small" style={{ color: T.ink3, textAlign: 'center', fontStyle: 'italic', margin: 0 }}>Figura yoki koddan bir qismni bosing</p></div>
            )}
          </div>
        </div>
      </div>
    </Stage>
  );
};


// ===== YANGI: SKELET MUSTAHKAMLASH TESTI (s5 dan keyin) =====
const ScreenSkeletTest = (props) => (
  <QuestionScreen {...props} scope="module-mikro" eyebrow="Tekshiruv"
    audioText={`Sahifada ko'rinadigan matn qaysi qismga yoziladi?`}
    questionText="Sahifada ko'rinadigan matn qaysi qismga yoziladi?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>Mustahkamlash</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Sahifada <span className="italic" style={{ color: T.accent }}>ko'rinadigan</span> matn qaysi qismga yoziladi?</h2></>}
    options={['<head>', '<body>', '<title>', '<!DOCTYPE>']} correctIdx={1}
    explainCorrect="To'g'ri! body — sahifada ko'rinadigan hamma narsa (sarlavha, matn, rasm) shu yerda yoziladi."
    explainWrong={{
      0: '<head> — bu ko\u2019rinmaydigan qism: title va sozlamalar. Ko\u2019rinadigan matn body ichida.',
      2: '<title> — faqat brauzer tabchasidagi nom. To\u2019g\u2019risi — body.',
      3: '<!DOCTYPE> — bu "men HTML5 man" degan e\u2019lon, matn joyi emas. To\u2019g\u2019risi — body.',
      default: 'Ko\u2019rinadigan matn body ichiga yoziladi.'
    }} />
);

// ===== SCREEN 6 — TEG (sovg'a analogiyasi + Mentor) =====
const Screen6 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's6', text: `Sovg'ani qog'ozga o'rab berasiz-ku: ichida — sovg'aning o'zi, ikki tomonida — o'ram. Teg ham xuddi shunaqa: matnni ikki tomondan o'rab oladi. Tugmani bosib, o'ralishini ko'ring.`, trigger: 'on_mount', waits_for: null }]);
  const PARTS = { open: { role: 'Ochiluvchi teg — element shu yerdan boshlanadi.' }, content: { role: 'Kontent — ekranda ko\u2019rinadigan matn.' }, close: { role: 'Yopiluvchi teg — / bilan yoziladi, element shu yerda tugaydi.' } };
  const [wrapped, setWrapped] = useState(false);
  const [active, setActive] = useState(null);
  const done = wrapped;
  const ic = (k) => `hug-item hug-${k === 'content' ? 'content' : 'tag'} ${active === k ? 'active' : ''}`;
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Teg" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? "Davom etish" : "Avval teglar bilan o'rang"} onClick={onNext} /></>}>
      <div className="screen">
        <div className="head"><h2 className="title h-title fade-up">Sovg'a bilan HTML'da <span className="italic" style={{ color: T.accent }}>nima</span> umumiy?</h2></div>
        <Mentor>Sovg'ani qog'ozga o'rab berasiz-ku: ichida — <b style={{ color: T.ink }}>sovg'aning o'zi</b>, ikki tomonida — <b style={{ color: T.ink }}>o'ram</b>. Teg ham xuddi shunaqa: matnni ikki tomondan o'rab oladi. Tugmani bosib, o'ralishini ko'ring.</Mentor>
        <div className="split">
          <div className="col">
            <div className="hug-wrap fade-up delay-2"><div className={`hug ${wrapped ? 'on' : ''}`}>
              <div className={ic('open')} onClick={() => setActive('open')}><span className="hug-code">&lt;h1&gt;</span><span className="hug-lbl">ochiluvchi</span></div>
              <div className={ic('content')} onClick={() => setActive('content')}><span className="hug-code">Salom!</span><span className="hug-lbl">kontent</span></div>
              <div className={ic('close')} onClick={() => setActive('close')}><span className="hug-code">&lt;<span className="hug-slash">/</span>h1&gt;</span><span className="hug-lbl">yopiluvchi</span></div>
            </div></div>
            <button className="btn" style={{ alignSelf: 'flex-start' }} onClick={() => setWrapped(w => !w)}>{wrapped ? '↻ Qaytadan' : '▶ Teglar bilan o\u2019rab olish'}</button>
            {active && (<div className="role-line fade-step" key={active}><p className="body" style={{ color: T.ink, margin: 0 }}>{PARTS[active].role}</p></div>)}
          </div>
          <div className="col">
            {!wrapped ? (<div className="hint"><p className="body" style={{ color: T.ink2, margin: 0 }}>Tugmani bosing — ochiluvchi va yopiluvchi teg <b style={{ color: T.ink }}>"Salom!"</b>ni o'rab oladi.</p></div>) : (<><div className="flow-label">Sahifa</div><Preview title="sahifa.html" minH={80}><p className="pv-h1 fade-step">Salom!</p></Preview><div className="frame-ok fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Element tayyor. <span className="mono">&lt;h1&gt;</span> ochdi, <span className="mono">&lt;/h1&gt;</span> yopdi — orasidagi <b>"Salom!"</b> sahifada sarlavha bo'lib ko'rinadi.</p></div></>)}
          </div>
        </div>
      </div>
    </Stage>
  );
};


// ===== SCREEN 7 — YOZISH (baholanadi, + Mentor) =====
const Screen7 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's7', text: `Har bir o'ralgan tegning yopuvchisi bo'lishi shart. Mana, h1 ochildi, lekin yopilmagan. Uni yopuvchi tegini o'zingiz yozing — pastdagi katakka.`, trigger: 'on_mount', waits_for: null }]);
  const ANSWER = '</h1>';
  const normTag = (v) => (v || '').toLowerCase().replace(/\s+/g, '');
  const [val, setVal] = useState(storedAnswer?.studentAnswer ?? '');
  const correct = normTag(val) === ANSWER;
  const touched = val.trim().length > 0;
  useEffect(() => { if (correct && storedAnswer === undefined) onAnswer(screen, { stage: 'module-mikro', screenIdx: screen, picked: val, question: '<h1>Salom! ... yopuvchi tegni yozing', correctAnswer: ANSWER, studentAnswer: val, correct: true }); }, [correct]);
  return (
    <Stage eyebrow="Yozing" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!correct} label={correct ? 'Davom etish' : 'Yopuvchi tegni yozing'} onClick={onNext} /></>}>
      <div className="screen">
        <div className="head"><h2 className="title h-title fade-up">Endi <span className="italic" style={{ color: T.accent }}>o'zingiz</span> yozib ko'ring.</h2></div>
        <Mentor>Har bir o'ralgan tegning <b style={{ color: T.ink }}>yopuvchisi bo'lishi shart</b>. Mana, <span className="mono">&lt;h1&gt;</span> ochildi, lekin yopilmagan. Uni yopuvchi tegini o'zingiz yozing — pastdagi katakka.</Mentor>
        <div className="split">
          <div className="col"><div className="yz-card fade-up delay-2"><div className="yz-line"><span className="yz-code"><span className="t-tag">&lt;h1&gt;</span>Salom!</span>{!correct ? (<input className="yz-input" value={val} onChange={e => setVal(e.target.value)} placeholder="yopuvchi teg…" spellCheck={false} />) : (<span className="yz-code yz-done"><span className="t-tag">&lt;/h1&gt;</span></span>)}</div>{!correct && (<p className="yz-hint">{touched ? "Deyarli! Yopuvchi teg / belgisi bilan boshlanadi: </h1>" : "Maslahat: avval / yozing, keyin teg nomi va >"}</p>)}{correct && <p className="yz-ok">✓ To'g'ri! Endi element yopildi: &lt;h1&gt;...&lt;/h1&gt;</p>}</div></div>
          <div className="col"><div className="flow-label">Natija</div><div className="bp-window fade-up delay-2"><div className="bp-bar"><span className="bb-dots"><i /><i /><i /></span><span className="bp-title">sahifa.html</span></div><div className="bp-body" style={{ minHeight: 110, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{correct ? <p className="pv-h1 fade-step">Salom!</p> : <p className="yz-placeholder">Natija shu yerda chiqadi…</p>}</div></div></div>
        </div>
      </div>
    </Stage>
  );
};


// ===== SCREEN 8 — SARLAVHALAR (gazeta kashfiyoti + Mentor) =====
const Screen8 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's8', text: `Mana oddiy gazeta sahifasi. Hatto o'qib chiqmasangiz ham, qaysi yozuv eng muhim ekanini darrov bilib olasiz. Sizningcha, qaysi biri eng muhim?`, trigger: 'on_mount', waits_for: { type: 'option_picked' } }]);
  const LADDER = [
    { n: 1, size: 28, tag: 'eng katta' }, { n: 2, size: 23, tag: '' }, { n: 3, size: 19, tag: '' },
    { n: 4, size: 16.5, tag: '' }, { n: 5, size: 14.5, tag: '' }, { n: 6, size: 13, tag: 'eng kichik' }
  ];
  const [picked, setPicked] = useState(storedAnswer?.picked ?? null);
  const done = picked !== null;
  const G = "Georgia, serif";
  const pick = (v) => {
    if (done) return; setPicked(v);
    onAnswer(screen, { correct: true, picked: v });
    audio.triggerEvent('option_picked');
    if (!audio.muted) setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff(`Eng katta yozuv eng muhim. HTML'da ham shunday — h1 eng katta va muhim, h6 eng kichik.`); }, 300);
  };
  return (
    <Stage eyebrow="Sarlavhalar" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? 'Davom etish' : 'Avval tanlang'} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Gazetada <span className="italic" style={{ color: T.accent }}>nima</span> darrov ko'zga tashlanadi?</h2></div>
        <Mentor>Mana oddiy gazeta sahifasi. Hatto o'qib chiqmasangiz ham, qaysi yozuv eng muhim ekanini <b style={{ color: T.ink }}>darrov</b> bilib olasiz. Sizningcha, qaysi biri eng muhim?</Mentor>
        <div className="split">
          <div className="col">
            <div className="frame fade-up delay-1">
              <p className="eyebrow" style={{ color: T.ink3, margin: '0 0 10px' }}>📰 Gazeta sahifasi</p>
              <h3 style={{ fontFamily: G, fontWeight: 700, fontSize: 'clamp(20px,3vw,26px)', lineHeight: 1.15, color: T.ink, margin: '0 0 10px' }}>Maktabimizda robototexnika to'garagi ochildi</h3>
              <p style={{ fontFamily: G, fontWeight: 700, fontSize: 'clamp(15px,2vw,17px)', color: T.ink, margin: '0 0 6px' }}>Kim qatnashishi mumkin?</p>
              <p style={{ fontFamily: G, fontSize: 'clamp(13px,1.7vw,14.5px)', color: T.ink2, margin: 0, lineHeight: 1.5 }}>To'garak har shanba soat 10:00 da. Ro'yxatdan o'tish hammaga ochiq.</p>
            </div>
          </div>
          <div className="col" style={{ gap: 9 }}>
            {!done ? (
              <>
                <p className="eyebrow fade-up delay-2" style={{ color: T.ink2, margin: 0 }}>Sizningcha, qaysi yozuv eng muhim?</p>
                {[{ id: 'a', label: 'Eng katta sarlavha (tepadagi)' }, { id: 'b', label: '«Kim qatnashishi mumkin?»' }].map(o => (
                  <button key={o.id} className="hook-option fade-up delay-3" onClick={() => pick(o.id)}><span className="radio" /><span>{o.label}</span></button>
                ))}
              </>
            ) : (
              <div className="fade-step" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="frame-success"><p className="small mono" style={{ margin: '0 0 4px', fontWeight: 600, color: T.success, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{picked === 'a' ? "✓ To'g'ri" : 'Mana gap'}</p><p className="body" style={{ margin: 0, color: T.ink }}>Eng <b>katta</b> yozuv darrov ko'zga tashlanadi — demak u eng muhim. HTML sarlavhalari ham shunday: <b>h1</b> eng katta, <b>h6</b> eng kichik.</p></div>
                <div className="ladder">{LADDER.map(h => (<div key={h.n} className="hl-row" style={{ cursor: 'default' }}><span className="hl-chip">{`<h${h.n}>`}</span><span className="hl-text" style={{ fontSize: h.size }}>Sarlavha</span>{h.tag && <span className="hl-tag">{h.tag}</span>}</div>))}</div>
              </div>
            )}
          </div>
        </div>
        {done && (<div className="frame-soft fade-step"><p className="body" style={{ margin: 0, color: T.ink }}><b>Sizning loyihangiz:</b> saytingizdagi eng katta sarlavha — bu ismingiz. Demak u <span className="mono">&lt;h1&gt;</span>.</p></div>)}
      </div>
    </Stage>
  );
};


// ===== SCREEN 9 — MATN (Telegram analogiyasi + Mentor) =====
const Screen9 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's9', text: `Telegram'da do'stingizga yozganda, muhim so'zni ba'zan qalin qilasiz-ku. HTML'da ham shunaqa: muhim so'z qalin — strong, urg'u beriladigan so'z yotiq — em. Ikkala tugmani bosib ko'ring.`, trigger: 'on_mount', waits_for: null }]);
  const [bold, setBold] = useState(false);
  const [ital, setItal] = useState(false);
  const [bt, setBt] = useState(false);
  const [it, setIt] = useState(false);
  const done = bt && it;
  const toggleBold = () => { setBold(b => !b); setBt(true); };
  const toggleItal = () => { setItal(v => !v); setIt(true); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Matn" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? "Davom etish" : "Ikkalasini sinab ko\u2019ring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Muhim so'zni qanday <span className="italic" style={{ color: T.accent }}>ajratasiz</span>?</h2></div>
        <Mentor>Telegram'da do'stingizga yozganda, muhim so'zni ba'zan <b style={{ color: T.ink }}>qalin</b> qilasiz-ku. HTML'da ham shunaqa: muhim so'z — qalin (<span className="mono">strong</span>), urg'u beriladigan so'z — yotiq (<span className="mono">em</span>). Ikkala tugmani bosib ko'ring.</Mentor>
        <div className="split">
          <div className="mcard fade-up delay-2"><div className="mc-head"><span className="mc-chip">&lt;strong&gt;</span><span className="mc-label">Qalin — muhim so'z</span></div><div className="mc-demo"><span>Bu&nbsp;</span><span key={`b-${bold}`} className={`w-anim ${bold ? 'w-bold' : ''}`}>muhim</span><span>!</span></div><button className={`mc-btn ${bold ? 'on' : ''}`} onClick={toggleBold}><span className="ic" style={{ fontWeight: 800 }}>B</span> {bold ? 'Qalin ✓' : 'Qalin qilish'}</button><p className="mc-code"><span className="tg">&lt;p&gt;</span>Bu {bold ? <><span className="tg">&lt;strong&gt;</span>muhim<span className="tg">&lt;/strong&gt;</span></> : 'muhim'}!<span className="tg">&lt;/p&gt;</span></p></div>
          <div className="mcard fade-up delay-2"><div className="mc-head"><span className="mc-chip">&lt;em&gt;</span><span className="mc-label">Yotiq (kursiv) — urg'u</span></div><div className="mc-demo"><span key={`i-${ital}`} className={`w-anim ${ital ? 'w-ital' : ''}`}>Juda</span><span>&nbsp;zo'r!</span></div><button className={`mc-btn ${ital ? 'on' : ''}`} onClick={toggleItal}><span className="ic" style={{ fontStyle: 'italic' }}>I</span> {ital ? 'Yotiq ✓' : 'Yotiq qilish'}</button><p className="mc-code"><span className="tg">&lt;p&gt;</span>{ital ? <><span className="tg">&lt;em&gt;</span>Juda<span className="tg">&lt;/em&gt;</span></> : 'Juda'} zo'r!<span className="tg">&lt;/p&gt;</span></p></div>
        </div>
        <div className="frame-soft fade-up delay-3"><p className="body" style={{ margin: 0, color: T.ink }}><b>Sizning loyihangiz:</b> o'zingiz haqingizdagi eng muhim so'zni qalin qilib ajratasiz.</p></div>
      </div>
    </Stage>
  );
};


// ===== SCREEN 10 — RO'YXATLAR (xarid ro'yxati vs retsept + Mentor) =====
const Screen10 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's10', text: `Do'konga borishdan oldin xarid ro'yxati yozasiz — tartib muhim emas, faqat ro'yxat. Lekin retseptda qadamlar tartib bilan: bir, ikki, uch. HTML'da ham ikki xil: ul belgili, ol raqamli. Turini almashtirib ko'ring.`, trigger: 'on_mount', waits_for: null }]);
  const ITEMS = ['Minecraft', 'Futbol', 'Shaxmat'];
  const [type, setType] = useState('ul');
  const [touched, setTouched] = useState(false);
  const done = touched;
  const pick = (t) => { setType(t); setTouched(true); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Ro'yxatlar" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? "Davom etish" : "Turini almashtiring"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Xarid ro'yxati va retsept — <span className="italic" style={{ color: T.accent }}>farqi</span> nimada?</h2></div>
        <Mentor>Do'konga borishdan oldin <b style={{ color: T.ink }}>xarid ro'yxati</b> yozasiz — tartib muhim emas. Lekin <b style={{ color: T.ink }}>retseptda</b> qadamlar tartib bilan: 1, 2, 3. HTML'da ham ikki xil: <span className="mono">ul</span> (belgili) va <span className="mono">ol</span> (raqamli). Turini almashtirib ko'ring.</Mentor>
        <div className="split">
          <div className="col">
            <div className="fade-up delay-2" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}><button className={`chip ${type === 'ul' ? 'chip-on' : ''}`} onClick={() => pick('ul')}>• Belgili (ul)</button><button className={`chip ${type === 'ol' ? 'chip-on' : ''}`} onClick={() => pick('ol')}>1. Raqamli (ol)</button></div>
            <pre className="code-box fade-up delay-2" key={type}><span className="tg">{`<${type}>`}</span>{'\n'}{ITEMS.map((it, i) => (<React.Fragment key={i}>{'  '}<span className="tg">&lt;li&gt;</span>{it}<span className="tg">&lt;/li&gt;</span>{'\n'}</React.Fragment>))}<span className="tg">{`</${type}>`}</span></pre>
            <div className="when"><p className="body" style={{ margin: 0, color: T.ink }}>Tartib muhim bo'lsa (qadamlar, reyting) — <b style={{ color: T.accent }}>raqamli (ol)</b>. Aks holda — <b style={{ color: T.accent }}>belgili (ul)</b>.</p></div>
          </div>
          <div className="col"><div className="flow-label">Saytda shunday ko'rinadi</div><div className="bp-window fade-up delay-2"><div className="bp-bar"><span className="bb-dots"><i /><i /><i /></span><span className="bp-title">mening-saytim.uz</span></div><div className="bp-body"><div className="site-header"><span className="site-brand"><span className="site-logo">M</span><span className="site-name">Mening saytim</span></span><span className="site-nav"><span>Asosiy</span><span>O'yinlar</span></span></div><div className="site-sec"><h3 className="site-h3">Sevimli o'yinlarim</h3><div className="site-list" key={type}>{type === 'ul' ? <ul>{ITEMS.map((it, i) => <li key={i}>{it}</li>)}</ul> : <ol>{ITEMS.map((it, i) => <li key={i}>{it}</li>)}</ol>}</div></div></div></div></div>
        </div>
        <div className="frame-soft fade-up delay-3"><p className="body" style={{ margin: 0, color: T.ink }}><b>Sizning loyihangiz:</b> sevimli mashg'ulotlaringizni ro'yxat qilib qo'shasiz.</p></div>
      </div>
    </Stage>
  );
};


// ===== SCREEN 11 — TEST =====
const Screen11 = (props) => (
  <QuestionScreen {...props} idx={11} scope="module-mikro" eyebrow="Mashq · 3-savol"
    audioText="Retsept qadamlarini raqamli tartibda ko'rsatish uchun qaysi tegdan boshlash kerak?"
    questionText="Retsept qadamlarini raqamli tartibda ko'rsatish uchun qaysi tegdan boshlash kerak?"
    question={<><p className="eyebrow" style={{ color: T.accent }}>To'g'ri tegni tanlang</p><h2 className="title h-sub" style={{ marginTop: 8 }}>Retsept qadamlarini raqamli tartibda ko'rsatish uchun qaysi tegdan boshlash kerak?</h2></>}
    options={['<ul>', '<ol>', '<li>', '<a>']} correctIdx={1}
    explainCorrect="To'g'ri. <ol> — ordered list, ya'ni raqamli ro'yxat. Tartib muhim bo'lgan joylarda ishlatiladi."
    explainWrong={{ 0: '<ul> — bu belgili (bullet) ro\u2019yxat. Raqam emas, nuqta chiqaradi.', 2: '<li> — bu alohida element. Avval uni o\u2019rab oluvchi <ol> yoki <ul> kerak.', 3: '<a> — bu havola tegi, ro\u2019yxatga aloqasi yo\u2019q.', default: 'Raqamli ro\u2019yxat uchun <ol> ishlatiladi.' }} />
);

// ===== SCREEN 12 — HAVOLALAR (YouTube analogiyasi + Mentor) =====
const Screen12 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's12', text: `YouTube'da bitta videoni ko'rib bo'lgach, yonidagisiga bosib o'tasiz-ku. O'sha bosish — havola. HTML'da havola a href bilan yasaladi. Quyidagi menyuni bosib, sahifalar o'rtasida yuring.`, trigger: 'on_mount', waits_for: { type: 'link_jumped' } }]);
  const PAGES = {
    bosh: { title: 'Bosh sahifa', file: 'index.html', url: 'sayt.uz', body: "Salom! Bu mening birinchi saytim. O'zim haqimda yozaman.", links: [{ to: 'oyinlar', label: "O'yinlar" }, { to: 'men', label: 'Men haqimda' }] },
    oyinlar: { title: "O'yinlar", file: 'oyinlar.html', url: 'sayt.uz/oyinlar.html', body: "Bo'sh vaqtimda Minecraft va futbol o'ynayman.", links: [{ to: 'minecraft', label: 'Minecraft haqida' }, { to: 'bosh', label: 'Bosh sahifa' }] },
    minecraft: { title: 'Minecraft', file: 'minecraft.html', url: 'sayt.uz/minecraft.html', body: "Minecraft — menga eng yoqadigan o'yin.", links: [{ to: 'oyinlar', label: "O'yinlar" }, { to: 'bosh', label: 'Bosh sahifa' }] },
    men: { title: 'Men haqimda', file: 'men.html', url: 'sayt.uz/men.html', body: "Men CoddyCamp o'quvchisiman. Web-dasturchi bo'lmoqchiman.", links: [{ to: 'bosh', label: 'Bosh sahifa' }] }
  };
  const POS = { bosh: [55, 72], oyinlar: [150, 34], minecraft: [216, 90], men: [108, 122] };
  const EDGES = [['bosh', 'oyinlar'], ['bosh', 'men'], ['oyinlar', 'minecraft']];
  const [page, setPage] = useState('bosh');
  const [jumped, setJumped] = useState(false);
  const done = jumped;
  const go = (to) => { setPage(to); if (!jumped) { setJumped(true); audio.triggerEvent('link_jumped'); } };
  const cur = PAGES[page];
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Havolalar" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? "Davom etish" : "Havolani bosing"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(8px,1.2vw,12px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Bir bosishda boshqa sahifaga qanday <span className="italic" style={{ color: T.accent }}>o'tamiz</span>?</h2></div>
        <Mentor>YouTube'da bitta videoni ko'rib bo'lgach, yonidagisiga bosib o'tasiz-ku. O'sha bosish — <b style={{ color: T.ink }}>havola</b>. HTML'da havola <span className="mono">{'<a href="…">'}</span> bilan yasaladi. Menyuni bosib, sahifalar o'rtasida yuring.</Mentor>
        <div className="split">
          <div className="col"><div className="flow-label">Internet — bu "to'r"</div><div className="web fade-up delay-2"><svg className="web-svg" viewBox="0 0 260 150" preserveAspectRatio="none">{EDGES.map(([a, b], i) => { const active = page === a || page === b; return <line key={i} x1={POS[a][0]} y1={POS[a][1]} x2={POS[b][0]} y2={POS[b][1]} stroke={active ? T.accent : T.ink3} strokeWidth={active ? 2 : 1.2} strokeDasharray={active ? '0' : '4 3'} opacity={active ? 1 : 0.6} />; })}</svg>{Object.keys(PAGES).map(k => (<div key={k} className={`web-node ${page === k ? 'on' : ''}`} onClick={() => go(k)} style={{ left: `${POS[k][0] / 260 * 100}%`, top: `${POS[k][1] / 150 * 100}%` }}>{PAGES[k].title}</div>))}</div><p className="web-cap">Har sahifa boshqasiga <b>havola</b> bilan bog'langan. Shu bog'lanishlar <b>"to'r"</b> hosil qiladi — Internet shundan nom olgan.</p></div>
          <div className="col">
            <div className="bp-window fade-up delay-2"><div className="bp-bar"><span className="bb-dots"><i /><i /><i /></span><span className="bp-url" key={`u-${page}`}><span className="lock">●</span>{cur.url}</span></div><div className="bp-body pg-in" key={`p-${page}`}><div className="site-top"><span className="site-wordmark">Mening saytim</span><span className="site-tag">o'quvchi · CoddyCamp</span></div><h1 className="pg-h1">{cur.title}</h1><p className="pg-body">{cur.body}</p><div className="pg-divider" /><p className="pg-linklabel">Boshqa sahifalar</p><div className="pg-links">{cur.links.map((l, i) => (<a key={i} className="pg-a" onClick={() => go(l.to)}>{l.label} <span className="arr">→</span></a>))}</div></div></div>
            <div className="codecard" key={`c-${page}`}><p className="codecard-top"><span className="dotf" />{cur.file} — havolalar kodi</p><pre className="codeblock">{cur.links.map((l, i) => (<span className="ln" key={i}><span className="tg">&lt;a </span><span className="at">href</span><span className="tx">=</span><span className="st">"{PAGES[l.to].file}"</span><span className="tg">&gt;</span><span className="tx">{l.label}</span><span className="tg">&lt;/a&gt;</span></span>))}</pre><p className="codecap">Har bir havola = bitta <span className="mn">&lt;a&gt;</span> teg.</p></div>
          </div>
        </div>
        <div className="frame-soft fade-up delay-3" style={{ padding: '9px 15px' }}><p className="body" style={{ margin: 0, color: T.ink }}><b>Sizning loyihangiz:</b> saytingizga sevimli sayt yoki Telegram kanalingizga havola qo'shasiz.</p></div>
      </div>
    </Stage>
  );
};


// ===== SCREEN 13 — AI ESLATMA (Mentor + xatoni topish) =====
const Screen13 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's13', text: `Kelajakda AI'dan kod so'rab olishingiz mumkin. Lekin sirni aytaman: AI ham xato qiladi. Pastdagi kodni AI yozgan, bitta qatorida xato bor. Topa olasizmi? O'sha qatorni bosing.`, trigger: 'on_mount', waits_for: { type: 'error_found' } }]);
  const [picked, setPicked] = useState(storedAnswer ? 'h1' : null);
  const found = picked === 'h1';
  const pickH1 = () => { setPicked('h1'); audio.triggerEvent('error_found'); if (!audio.muted) setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff(`Topdingiz! h1 ochildi, lekin yopilmadi. Siz buni payqadingiz, chunki teglarni o'zingiz tushunasiz.`); }, 300); };
  useEffect(() => { if (found && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [found]);
  return (
    <Stage eyebrow="Kichik eslatma" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!found} label={found ? "Tushundim, davom etish" : "Xatoni toping"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">AI ham yordam beradi — <span className="italic" style={{ color: T.accent }}>lekin...</span></h2></div>
        <Mentor>Kelajakda AI'dan kod so'rab olishingiz mumkin. Lekin sirni aytaman: <b style={{ color: T.ink }}>AI ham xato qiladi</b>. Pastdagi kodni AI yozgan, bitta qatorida xato bor. Topa olasizmi? O'sha qatorni bosing.</Mentor>
        <div className="split">
          <div className="col">
            <div className="ai-card fade-up delay-2"><div className="ai-row"><span className="ai-badge">AI</span><span className="ai-bubble">Mana, sahifa kodi tayyor!</span></div><div className="ai-code"><div className={`ai-line ${found ? 'bad' : ''}`} onClick={pickH1}><span className="tg">&lt;h1&gt;</span>Salom!</div><div className={`ai-line ${picked === 'p' ? 'ok' : ''}`} onClick={() => setPicked('p')}><span className="tg">&lt;p&gt;</span>Bu mening saytim.<span className="tg">&lt;/p&gt;</span></div></div><p className="ai-prompt">Xato qaysi qatorda? Bosing.</p></div>
            {picked === 'p' && !found && (<div className="frame-warn fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Bu qator to'g'ri — <span className="mono">&lt;p&gt;</span> ochildi va <span className="mono">&lt;/p&gt;</span> bilan yopildi. Yana qarang: qaysi teg yopilmagan?</p></div>)}
            {found && (<div className="frame-warn fade-step"><p className="note-h" style={{ color: T.accent }}>✓ Topdingiz!</p><p className="body" style={{ margin: 0, color: T.ink }}><span className="mono">&lt;h1&gt;</span> ochildi, lekin <span className="mono">&lt;/h1&gt;</span> bilan yopilmadi. Siz buni payqadingiz — chunki teglarni <b>o'zingiz</b> tushunasiz.</p></div>)}
          </div>
          <div className="col">{found ? (<div className="takeaway fade-step"><div className="ta-bulb">💡</div><p className="ta-h">Avval o'zingiz, keyin AI</p><p className="ta-sub">Bu — eng to'g'ri yo'l</p></div>) : (<div className="hint"><p className="body" style={{ margin: 0, color: T.ink2 }}>Endi siz teglarni bilasiz. AI yozgan kodni <b style={{ color: T.ink }}>tekshira olasiz</b> — xatoni toping-chi.</p></div>)}</div>
        </div>
      </div>
    </Stage>
  );
};


// ===== SCREEN 14 — BUILDER (Mentor + amaliyot) =====
const Screen14 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's14', text: `Mana, vaqti keldi. Bugun o'rgangan teglaringizdan o'z sahifangizni yig'asiz. Buyruq yozing yoki tayyor teglardan tanlang, Yarat tugmasini bosing — kod o'zi paydo bo'ladi. Kamida 3 ta bo'lak qo'shing.`, trigger: 'on_mount', waits_for: null }]);
  const MAX = 6;
  const CHIPS = [{ key: 'h1', label: 'Sarlavha', tag: 'h1' }, { key: 'p', label: 'Matn', tag: 'p' }, { key: 'ul', label: "Ro'yxat", tag: 'ul' }, { key: 'a', label: 'Havola', tag: 'a' }, { key: 'img', label: 'Rasm', tag: 'img' }];
  const detect = (txt) => { const t = (txt || '').toLowerCase(); if (/sarlavha|ism|title|bosh/.test(t)) return 'h1'; if (/rasm|surat|img|foto/.test(t)) return 'img'; if (/ro.?yxat|ruyxat|mashg|list/.test(t)) return 'ul'; if (/havola|sayt|link|url/.test(t)) return 'a'; if (/matn|paragraf|haqim|tavsif|yoz/.test(t)) return 'p'; return null; };
  const elCode = (type) => { switch (type) { case 'h1': return <><Tg>{'<h1>'}</Tg>Mening sahifam<Tg>{'</h1>'}</Tg></>; case 'p': return <><Tg>{'<p>'}</Tg>Men HTML o'rganyapman.<Tg>{'</p>'}</Tg></>; case 'ul': return <><Tg>{'<ul>'}</Tg>{'\n    '}<Tg>{'<li>'}</Tg>Futbol<Tg>{'</li>'}</Tg>{'\n    '}<Tg>{'<li>'}</Tg>Kitob<Tg>{'</li>'}</Tg>{'\n  '}<Tg>{'</ul>'}</Tg></>; case 'a': return <><Tg>{'<a '}</Tg><At>href</At>=<Sr>"coddycamp.uz"</Sr><Tg>{'>'}</Tg>CoddyCamp<Tg>{'</a>'}</Tg></>; case 'img': return <><Tg>{'<img '}</Tg><At>src</At>=<Sr>"rasm.jpg"</Sr><Tg>{'>'}</Tg></>; default: return null; } };
  const ImgPlaceholder = () => (<span style={{ display: 'inline-block', width: 150, height: 96, borderRadius: 10, overflow: 'hidden', border: '1px solid #00000018', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}><svg viewBox="0 0 150 96" width="150" height="96" preserveAspectRatio="none"><defs><linearGradient id="bp-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#a9def0" /><stop offset="100%" stopColor="#eaf6ee" /></linearGradient></defs><rect width="150" height="96" fill="url(#bp-sky)" /><circle cx="118" cy="26" r="14" fill="#FFD36A" /><ellipse cx="42" cy="22" rx="20" ry="7" fill="#ffffff" opacity="0.8" /><ellipse cx="58" cy="26" rx="14" ry="6" fill="#ffffff" opacity="0.8" /><polygon points="0,96 48,44 88,96" fill="#84b18d" /><polygon points="58,96 104,32 150,96" fill="#5f9a78" /><rect y="84" width="150" height="12" fill="#6f9460" /></svg></span>);
  const elView = (type, i) => { switch (type) { case 'h1': return <h1 key={i} style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(18px,2.8vw,24px)', margin: '0 0 6px', color: T.ink }}>Mening sahifam</h1>; case 'p': return <p key={i} style={{ fontFamily: 'Georgia, serif', margin: '0 0 6px', color: T.ink, fontSize: 'clamp(13px,1.8vw,15px)' }}>Men HTML o'rganyapman.</p>; case 'ul': return <ul key={i} style={{ fontFamily: 'Georgia, serif', color: T.ink, margin: '0 0 6px', paddingLeft: 22, fontSize: 'clamp(13px,1.8vw,15px)' }}><li>Futbol</li><li>Kitob</li></ul>; case 'a': return <a key={i} style={{ fontFamily: 'Georgia, serif', color: T.link, textDecoration: 'underline', fontSize: 'clamp(13px,1.8vw,15px)', display: 'inline-block', marginBottom: 6 }}>CoddyCamp</a>; case 'img': return <span key={i} style={{ display: 'block', marginBottom: 6 }}><ImgPlaceholder /></span>; default: return null; } };
  const [items, setItems] = useState([]);
  const [text, setText] = useState('');
  const [hint, setHint] = useState('');
  const [pending, setPending] = useState(null);
  const timer = useRef(null);
  const done = items.length >= 3;
  const generate = (type) => { if (items.length >= MAX || pending) return; setHint(''); setPending(type); clearTimeout(timer.current); timer.current = setTimeout(() => { setItems(prev => [...prev, type]); setPending(null); }, 650); };
  const submit = () => { const type = detect(text); if (!type) { setHint('Tushunmadim 🙂 Mana shulardan yozing: sarlavha, matn, ro\u2019yxat, havola, rasm.'); return; } generate(type); setText(''); };
  const reset = () => { setItems([]); setPending(null); setHint(''); clearTimeout(timer.current); };
  useEffect(() => { if (done && storedAnswer === undefined) onAnswer(screen, { correct: true, picked: true }); }, [done]);
  return (
    <Stage eyebrow="Amaliyot · sahifa quramiz" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!done} label={done ? "Davom etish" : `Kamida 3 ta bo\u2019lak (${items.length}/3)`} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(8px,1.2vw,12px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Buyruq bering — <span className="italic" style={{ color: T.accent }}>kod o'zi yaraladi</span>.</h2></div>
        <Mentor>Mana, vaqti keldi. Bugun o'rgangan teglaringizdan o'z sahifangizni yig'asiz. Buyruq yozing yoki tayyor teglardan tanlang — <b style={{ color: T.ink }}>"Yarat"</b> bosing, kod o'zi paydo bo'ladi. Kamida 3 ta bo'lak qo'shing.</Mentor>
        <div className="split">
          <div className="col">
            <div className="fade-up delay-2"><p className="flow-label" style={{ marginBottom: 7 }}>Buyruq yozing</p><div className="prompt-row"><input className="prompt-input" value={text} placeholder="masalan: rasm qo'sh" onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') submit(); }} /><button className="prompt-btn" onClick={submit} disabled={!!pending || items.length >= MAX}>Yarat</button></div></div>
            <div className="fade-up delay-2"><p className="flow-label" style={{ margin: '2px 0 7px' }}>yoki tayyor buyruqlardan tanlang</p><div className="chips">{CHIPS.map(c => (<button key={c.key} className="gchip" disabled={items.length >= MAX} onClick={() => { setText(c.label.toLowerCase() + " qo'sh"); setHint(''); }}>{c.label} <span className="gt">&lt;{c.tag}&gt;</span></button>))}{items.length > 0 && <button className="gchip" onClick={reset}>↺ Tozalash</button>}</div></div>
            <p className="body fade-up delay-3" style={{ margin: '2px 0 0', color: T.ink3, fontSize: 13 }}><b style={{ color: T.ink2 }}>Tez tugatdingizmi?</b> 5 xil teg ishlating yoki yangi teg topib sinab ko'ring.</p>
            {hint && <p className="hint fade-step">{hint}</p>}
            {done && (<div style={{ background: T.successSoft, borderLeft: `4px solid ${T.success}`, borderRadius: 12, padding: '12px 15px' }} className="fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>Zo'r! Siz <b>buyruq berib</b> sahifa qurdingiz — va kodni o'qib, nima yozilganini tushunasiz.</p></div>)}
          </div>
          <div className="col">
            <div className="flow-label">Kod</div>
            <pre className="code-box"><Tg>{'<body>'}</Tg>{'\n'}{items.length === 0 && !pending && <><span className="cm">{'  <!-- buyruq bering -->'}</span>{'\n'}</>}{items.map((it, i) => (<React.Fragment key={i}>{'  '}{elCode(it)}{'\n'}</React.Fragment>))}{pending && <><span className="gen-line">{'  yaratilmoqda'}</span>{'\n'}</>}<Tg>{'</body>'}</Tg></pre>
            <div className="flow-label">Sahifa</div>
            <div className="bp-window"><div className="bp-bar"><span className="bb-dots"><i /><i /><i /></span><span className="bp-title">mening-sahifam.html</span></div><div className="bp-body">{items.length === 0 && !pending ? <p style={{ color: T.ink3, fontStyle: 'italic', margin: 0, fontFamily: 'Georgia, serif' }}>Bo'sh sahifa — buyruq bering...</p> : items.map((it, i) => <span key={i} className="el-in" style={{ display: 'block' }}>{elView(it, i)}</span>)}</div></div>
          </div>
        </div>
      </div>
    </Stage>
  );
};

// ===== SCREEN 15 — YAKUNIY (qo'lda yozadigan amaliy topshiriq) =====
const Screen15 = ({ screen, storedAnswer, onAnswer, onNext, onPrev }) => {
  const audio = useAudio([{ id: 's15', text: `Oxirgi qadam. Eslang, gazeta misolida ko'rdik: eng katta sarlavha — h1. Endi o'zingiz yozing: ochuvchi teg, ismingiz, yopuvchi teg — to'liq.`, trigger: 'on_mount', waits_for: { type: 'typed_ok' } }]);
  const [value, setValue] = useState(storedAnswer?.picked || '');
  const [passed, setPassed] = useState(!!storedAnswer?.correct);
  const norm = value.replace(/\s+/g, ' ').trim();
  const m = norm.match(/^<\s*h1\s*>(.+?)<\s*\/\s*h1\s*>$/i);
  const inner = m ? m[1].trim() : '';
  const valid = !!inner;
  const hasOpen = /<\s*h1\s*>/i.test(value);
  const hasClose = /<\s*\/\s*h1\s*>/i.test(value);
  useEffect(() => {
    if (valid && !passed) {
      setPassed(true);
      onAnswer(screen, { correct: true, picked: value });
      audio.triggerEvent('typed_ok');
      if (!audio.muted) setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff(`Zo'r! Ochuvchi h1, ismingiz, yopuvchi h1 — to'liq yozdingiz.`); }, 300);
    }
  }, [valid]);
  return (
    <Stage eyebrow="Yakuniy · amaliy" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><NavNext disabled={!passed} label={passed ? "Davom etish" : "Sarlavhani yozing"} onClick={onNext} /></>}>
      <div className="screen" style={{ gap: 'clamp(10px,1.6vw,16px)' }}>
        <div className="head"><h2 className="title h-title fade-up">Oxirgi qadam: ismingizni <span className="italic" style={{ color: T.accent }}>sarlavha</span> qiling.</h2></div>
        <Mentor>Eslang, gazeta misolida ko'rdik: eng katta sarlavha — <span className="mono">h1</span>. Endi o'zingiz yozing: <b style={{ color: T.ink }}>ochuvchi teg</b>, ismingiz, <b style={{ color: T.ink }}>yopuvchi teg</b> — to'liq.</Mentor>
        <div className="split">
          <div className="col">
            <input className="fade-up delay-2" value={value} onChange={e => setValue(e.target.value)} placeholder="<h1>Ismingiz</h1>" spellCheck={false} autoCapitalize="off" autoCorrect="off" style={{ width: '100%', fontFamily: "'JetBrains Mono', monospace", fontSize: 16, padding: '14px 16px', borderRadius: 12, border: 'none', background: T.paper, color: T.ink, outline: 'none', transition: 'box-shadow 0.2s', boxShadow: valid ? `0 0 0 2px ${T.success}, 0 8px 20px -8px rgba(${T.shadowBase},0.2)` : `0 4px 14px -6px rgba(${T.shadowBase},0.16)` }} />
            <div className="fade-up delay-2" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <span className="tagpill" style={{ opacity: hasOpen ? 1 : 0.4 }}>{hasOpen ? '✓' : '1'} ochuvchi &lt;h1&gt;</span>
              <span className="tagpill" style={{ opacity: inner ? 1 : 0.4 }}>{inner ? '✓' : '2'} ismingiz</span>
              <span className="tagpill" style={{ opacity: hasClose ? 1 : 0.4 }}>{hasClose ? '✓' : '3'} yopuvchi &lt;/h1&gt;</span>
            </div>
            {passed
              ? (<div className="frame-success fade-step"><p className="body" style={{ margin: 0, color: T.ink }}>✓ Zo'r! Ochuvchi va yopuvchi teg to'g'ri — bu to'liq <span className="mono">&lt;h1&gt;</span> element.</p></div>)
              : (<p className="body" style={{ margin: 0, color: T.ink3, fontSize: 13 }}>Bu — 5 ta tekshiruvdan biri, yakka o'zi o'tishni hal qilmaydi.</p>)}
          </div>
          <div className="col">
            <div className="flow-label">natija</div>
            <div style={{ background: T.paper, borderRadius: 14, minHeight: 130, padding: '20px 22px', boxShadow: `0 8px 22px -10px rgba(${T.shadowBase},0.16)`, display: 'flex', alignItems: 'center', justifyContent: valid ? 'flex-start' : 'center' }}>
              {valid
                ? <h1 key={inner} className="fade-step" style={{ fontFamily: 'Georgia, serif', fontSize: 'clamp(26px,4.5vw,38px)', color: T.ink, lineHeight: 1.1, margin: 0 }}>{inner}</h1>
                : <p style={{ fontFamily: 'Georgia, serif', color: T.ink3, fontStyle: 'italic', margin: 0, textAlign: 'center', lineHeight: 1.5 }}>To'liq yozing: ochuvchi <span className="mono" style={{ fontStyle: 'normal' }}>&lt;h1&gt;</span> + ismingiz + yopuvchi <span className="mono" style={{ fontStyle: 'normal' }}>&lt;/h1&gt;</span></p>}
            </div>
          </div>
        </div>
      </div>
    </Stage>
  );
};


// ===== SCREEN 16 — YAKUN =====
const Screen16 = ({ screen, answers, onReset, onPrev, onFinish }) => {
  const audio = useAudio([{ id: 's16', text: "Dars yakunlandi. Birinchi saytingizni yasadingiz! Asosiyni eslab qoling: HTML — veb-sahifalar tili, brauzer HTMLni o'qib sahifani ko'rsatadi, teg ochiladi va yopiladi.", trigger: 'on_mount', waits_for: null }]);
  const RECAP = ['HTML bilan veb-sahifa yasash', 'Sahifa skeletini qurish (head, body)', 'Teglarni ochish va yopish', 'Sarlavha (h1–h6) va matn (strong, em)', "Ro'yxat (ul/ol) va havola (a) qo'shish"];
  const HOMEWORK = [{ b: 'Sarlavha (h1)', t: '— ismingiz' }, { b: '2–3 paragraf', t: "— o'zingiz haqingizda" }, { b: "Ro'yxat", t: "— sevimli mashg'ulotlaringiz" }, { b: 'Havola', t: '— sevimli saytingizga' }];
  const GLOSSARY = [{ b: 'HTML', t: '— veb tili' }, { b: 'Skelet', t: '— DOCTYPE, html, head, body' }, { b: 'Teg', t: '— ochiluvchi/yopiluvchi' }, { b: 'Atribut', t: '— href kabi qo\u2019shimcha' }, { b: 'Teglar', t: '— h1–h6, p, strong, em, ul, ol, li, a' }];
  const correct = SCORED_IDX.filter(i => answers[i]?.correct).length;
  const total = SCORED_IDX.length;
  const PASSED = (total ? correct / total : 0) >= 0.6;
  const [open, setOpen] = useState(false);
  return (
    <Stage eyebrow="Tayyor" screen={screen} audioState={audio} navContent={<><NavBack onPrev={onPrev} /><button className="btn-ghost" onClick={onReset} style={{ padding: 'clamp(11px,1.6vw,13px) clamp(16px,2.2vw,22px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Qaytadan</button><button className="btn-white-accent" onClick={onFinish} style={{ marginLeft: 'auto', padding: 'clamp(11px,1.6vw,13px) clamp(22px,2.6vw,30px)', fontSize: 'clamp(13px,1.5vw,15px)' }}>Keyingi dars →</button></>}>
      <div className="screen">
        <div className="hero"><div className="hero-l"><span className="done-chip fade-up"><span className="tick">✓</span> Dars tugadi</span><h2 className="title h-title fade-up d1">Birinchi <span className="italic" style={{ color: T.accent }}>saytingizni</span> yasadingiz.</h2><p className="body h-sub fade-up d2">{PASSED ? 'Tabriklaymiz! Endi o\u2019zingiz veb-sahifa yasay olasiz.' : 'Yaxshi harakat! Bir-ikki joyni mustahkamlash uchun darsni qayta ko\u2019ring.'}</p></div><ScoreRing correct={correct} total={total} /></div>
        <div className="split">
          <div className="card fade-up d3"><div className="card-lbl" style={{ color: T.success }}><span className="tick" style={{ width: 16, height: 16, borderRadius: '50%', background: T.success, color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 10 }}>✓</span> Endi siz bilasiz</div><ul className="recap">{RECAP.map((r, i) => (<li key={i} style={{ animationDelay: `${0.3 + i * 0.07}s` }}><span className="ck">✓</span><span>{r}</span></li>))}</ul></div>
          <div className="card hw fade-up d4"><div className="card-lbl" style={{ color: T.accent }}>📝 Uyga vazifa</div><p className="body" style={{ margin: '0 0 10px', color: T.ink }}>O'zingiz haqingizda HTML sahifa yarating:</p><ul>{HOMEWORK.map((h, i) => (<li key={i}><b>{h.b}</b> <span className="t">{h.t}</span></li>))}</ul><p className="hw-note">Avval o'z qo'lingiz bilan yozing — keyin AI'ga tekshirtiring. Tayyor bo'lsa platformaga yuklang — mentor 4 mezon bo'yicha baholaydi.</p></div>
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
      answers: SCREEN_META.map((s, i) => answers[i]).filter(Boolean)
    };
    if (typeof onFinished === 'function') onFinished(payload);
  };

  const screens = [Screen0, Screen1, Screen2, Screen3, Screen4, Screen5, ScreenSkeletTest, Screen6, Screen7, Screen8, Screen9, Screen10, Screen11, Screen12, Screen13, Screen14, Screen15, Screen16];
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
      `}</style>
      <div className="lesson-root">
        <Current screen={screen} storedAnswer={answers[screen]} answers={answers} onAnswer={recordAnswer} onNext={next} onPrev={prev} onReset={reset} onFinish={finishLesson} />
      </div>
    </LangContext.Provider>
  );
}