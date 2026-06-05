import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';

// УРОК nat_5_03 v1 — Сложение и вычитание столбиком, 5 класс (15 экранов).
// Анти-скролл (вар. A): при показе решения вопрос ужимается в строку, варианты —
//   в компактные чипы, подсказка столбика прячется, разбор уплотнён — влезает в экран.
// Неверно → дорешивание (3 попытки → «Решение» → разбор). Верно → анимация + озвучка ответа. infrastructure_v1 (v15).
const T = {
  bg: '#F6F4EF',
  ink: '#0E0E10',
  ink2: '#5A5A60',
  ink3: '#A7A6A2',
  paper: '#FFFFFF',
  accent: '#FF4F28',
  accentSoft: '#FFE8E1',
  success: '#1F7A4D',
  successSoft: '#E3F0E8',
  blue: '#019ACB',
  shadowBase: '58, 53, 48'
};

// ============================================================
// LANGUAGE CONTEXT + useT
// ============================================================
const LangContext = createContext('ru');
const useLang = () => useContext(LangContext);

const useT = () => {
  const lang = useLang();
  return useCallback((node) => {
    if (node === null || node === undefined) return '';
    if (typeof node === 'string') return node;
    if (React.isValidElement(node)) return node;
    if (node[lang] !== undefined) return node[lang];
    return node.ru ?? '';
  }, [lang]);
};

// ============================================================
// useIsMobile (design_system 5.0)
// ============================================================
function useIsMobile(breakpoint = 640) {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  );
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onResize = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [breakpoint]);
  return isMobile;
}

// ============================================================
// AUDIO ENGINE
// ============================================================
class AudioEngine {
  constructor() {
    this.queue = [];
    this.currentIdx = 0;
    this.isPlaying = false;
    this.currentUtterance = null;
    this.onStateChange = null;
    this.waitingFor = null;
    this.voicesByLang = { ru: null, uz: null };
    this.voicesReady = false;
    this.currentLang = 'ru';
    this.initVoices();
  }

  initVoices() {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) return;
      this.voicesByLang.ru = voices.find(v => v.lang.startsWith('ru')) || voices[0];
      this.voicesByLang.uz = voices.find(v => v.lang.startsWith('uz'))
                          || voices.find(v => v.lang.startsWith('ru'))
                          || voices[0];
      this.voicesReady = true;
    };
    loadVoices();
    if (window.speechSynthesis.onvoiceschanged !== undefined) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  setLang(lang) {
    this.currentLang = lang;
  }

  getCurrentVoice() {
    if (!this.voicesReady && typeof window !== 'undefined' && window.speechSynthesis) {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        this.voicesByLang.ru = voices.find(v => v.lang.startsWith('ru')) || voices[0];
        this.voicesByLang.uz = voices.find(v => v.lang.startsWith('uz'))
                            || voices.find(v => v.lang.startsWith('ru'))
                            || voices[0];
        this.voicesReady = true;
      }
    }
    return this.voicesByLang[this.currentLang] || this.voicesByLang.ru || null;
  }

  hasRealUzVoice() {
    if (typeof window === 'undefined' || !window.speechSynthesis) return false;
    const voices = window.speechSynthesis.getVoices();
    return voices.some(v => v.lang.startsWith('uz'));
  }

  loadQueue(segments) {
    this.stop();
    this.queue = segments;
    this.currentIdx = 0;
    this.waitingFor = null;
  }

  playSegment(segment) {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(segment.text);
    const wantsUz = this.currentLang === 'uz';
    const useRealUz = wantsUz && this.hasRealUzVoice();
    utterance.lang = useRealUz ? 'uz-UZ' : 'ru-RU';
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    const voice = this.getCurrentVoice();
    if (voice) utterance.voice = voice;
    utterance.onstart = () => {
      this.isPlaying = true;
      if (this.onStateChange) this.onStateChange({ isPlaying: true, currentSegment: segment.id });
    };
    utterance.onend = () => {
      this.isPlaying = false;
      this.currentUtterance = null;
      if (this.onStateChange) this.onStateChange({ isPlaying: false, currentSegment: null });
      this.handleSegmentEnd(segment);
    };
    utterance.onerror = () => {
      this.isPlaying = false;
      this.currentUtterance = null;
      if (this.onStateChange) this.onStateChange({ isPlaying: false, currentSegment: null });
    };
    this.currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  handleSegmentEnd(segment) {
    if (segment.waits_for) {
      this.waitingFor = segment.waits_for;
      if (this.onStateChange) this.onStateChange({ isPlaying: false, waitingFor: segment.waits_for });
    } else {
      this.currentIdx++;
      this.playNext();
    }
  }

  playNext() {
    if (this.currentIdx >= this.queue.length) return;
    this.playSegment(this.queue[this.currentIdx]);
  }

  start() {
    this.currentIdx = 0;
    this.waitingFor = null;
    this.playNext();
  }

  triggerEvent(eventType, target) {
    if (!this.waitingFor) return;
    const matches = this.waitingFor.type === eventType &&
                   (this.waitingFor.target === target || !this.waitingFor.target);
    if (matches) {
      this.waitingFor = null;
      this.currentIdx++;
      this.playNext();
    }
  }

  triggerInternalEvent(eventName) {
    const nextIdx = this.queue.findIndex((s, i) => i >= this.currentIdx && s.trigger === `on_event:${eventName}`);
    if (nextIdx !== -1) {
      this.currentIdx = nextIdx;
      this.waitingFor = null;
      this.playNext();
    }
  }

  pushOneOff(text) {
    if (!text) return;
    this.queue.push({ id: `oneoff_${Date.now()}`, text, trigger: 'manual', waits_for: null });
    this.currentIdx = this.queue.length - 1;
    this.playNext();
  }

  replay() {
    if (this.currentIdx > 0) this.currentIdx--;
    this.waitingFor = null;
    this.playNext();
  }

  stop() {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    this.isPlaying = false;
    this.currentUtterance = null;
    if (this.onStateChange) this.onStateChange({ isPlaying: false, currentSegment: null });
  }
}

let audioEngineInstance = null;
const getAudioEngine = () => {
  if (typeof window === 'undefined') return null;
  if (!audioEngineInstance) audioEngineInstance = new AudioEngine();
  return audioEngineInstance;
};

function useAudio(segments) {
  const lang = useLang();
  const [state, setState] = useState({ isPlaying: false, currentSegment: null, waitingFor: null, muted: false });
  const engineRef = useRef(null);

  // Стабилизация segments по содержимому, не по ссылке (без этого cancel-loop, звук молчит)
  const segmentsRef = useRef(segments);
  const segmentsKey = segments ? JSON.stringify(segments) : '';
  const prevKeyRef = useRef(segmentsKey);
  if (prevKeyRef.current !== segmentsKey) {
    segmentsRef.current = segments;
    prevKeyRef.current = segmentsKey;
  }
  const stableSegments = segmentsRef.current;

  useEffect(() => {
    const engine = getAudioEngine();
    if (!engine) return;
    engineRef.current = engine;
    engine.setLang(lang);
    engine.onStateChange = (s) => setState(prev => ({ ...prev, ...s }));
    if (stableSegments && stableSegments.length > 0 && !state.muted) {
      engine.loadQueue(stableSegments);
      const timer = setTimeout(() => engine.start(), 300);
      return () => {
        clearTimeout(timer);
        engine.stop();
      };
    }
    return () => engine.stop();
  // eslint-disable-next-line
  }, [stableSegments, lang]);

  const triggerEvent = useCallback((type, target) => {
    if (engineRef.current) engineRef.current.triggerEvent(type, target);
  }, []);
  const triggerInternal = useCallback((eventName) => {
    if (engineRef.current) engineRef.current.triggerInternalEvent(eventName);
  }, []);
  const replay = useCallback(() => {
    if (engineRef.current) engineRef.current.replay();
  }, []);
  const toggleMute = useCallback(() => {
    setState(prev => {
      const newMuted = !prev.muted;
      if (newMuted && engineRef.current) engineRef.current.stop();
      return { ...prev, muted: newMuted };
    });
  }, []);

  return { ...state, triggerEvent, triggerInternal, replay, toggleMute };
}

// Хелпер: построить audio-segments для экрана из CONTENT
const makeAudioSegments = (screenContent, lang) => {
  if (Array.isArray(screenContent.audio?.[lang])) {
    return screenContent.audio[lang].map((text, i) => ({
      id: `aud_${i}`,
      text,
      trigger: i === 0 ? 'on_mount' : (i === 1 ? 'after_previous' : `on_event:step_${i - 1}`),
      waits_for: i < screenContent.audio[lang].length - 1
        ? { type: 'button_click', target: 'step' }
        : { type: 'button_click', target: 'next' }
    }));
  }
  const text = screenContent.audio?.[lang];
  if (!text) return [];
  return [{ id: 'aud_0', text, trigger: 'on_mount', waits_for: null }];
};

// ============================================================
// БАЗОВЫЕ КОМПОНЕНТЫ (из infrastructure_v1)
// ============================================================
const Op = React.memo(({ children, size = 'mid' }) => {
  const fontSize = size === 'big' ? 'clamp(25px, 4.7vw, 38px)' :
                   size === 'mid' ? 'clamp(16px, 3vw, 27px)' :
                   'clamp(12px, 2.1vw, 18px)';
  return <span className="mop" style={{ fontSize }}>{children}</span>;
});

const Frac = React.memo(({ n, d, color, size = 'sm' }) => (
  <span className={`frac frac-${size}`} style={{ color }}>
    <span className="n">{n}</span>
    <span className="bar"/>
    <span className="d">{d}</span>
  </span>
));

const AudioIndicator = ({ audioState }) => {
  const { isPlaying, muted, replay, toggleMute } = audioState;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <button onClick={toggleMute} title={muted ? 'Sound on' : 'Sound off'}
        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', color: muted ? T.ink3 : (isPlaying ? T.accent : T.ink2) }}>
        {muted ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
          </svg>
        ) : isPlaying ? (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
          </svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
          </svg>
        )}
      </button>
      {!muted && (
        <button onClick={replay} title="Replay"
          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center', color: T.ink2 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="1 4 1 10 7 10"/><path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
          </svg>
        </button>
      )}
    </div>
  );
};

const FeedbackBlock = ({ show, isCorrect, children }) => {
  const [mounted, setMounted] = useState(show);
  const [visible, setVisible] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (show) {
      setMounted(true);
      requestAnimationFrame(() => requestAnimationFrame(() => {
        setVisible(true);
        setTimeout(() => {
          if (ref.current) {
            ref.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          }
        }, 350);
      }));
    } else {
      setVisible(false);
      const timer = setTimeout(() => setMounted(false), 400);
      return () => clearTimeout(timer);
    }
  }, [show]);
  if (!mounted) return null;
  return (
    <div ref={ref} className={`feedback-block ${visible ? 'visible' : ''}`}>
      <div className={isCorrect ? 'frame-success' : 'frame-soft'}>{children}</div>
    </div>
  );
};

// Slider — компонент v15 с track-wrap + track-bg + track-fill + glow
const Slider = ({ value, min, max, step = 1, onChange, disabled = false }) => {
  const pct = ((value - min) / (max - min)) * 100;
  return (
    <div className="track-wrap">
      <div className="track-bg"/>
      <div className="track-fill" style={{ width: `${pct}%` }}/>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(Number(e.target.value))}
        className="slider-input"
      />
    </div>
  );
};

// Stage — progress + chrome вынесены в отдельный stage-header (sticky, flex-shrink: 0)
const Stage = ({ children, eyebrow, screen, totalScreens, navContent, audioState }) => {
  const t = useT();
  const isMobile = useIsMobile();
  const padH = isMobile ? 12 : 100;
  return (
    <div className="stage">
      <div className="stage-header" style={{ paddingLeft: padH, paddingRight: padH }}>
        <div className="progress-track">
          <div className="progress-bar" style={{ width: `${((screen + 1) / totalScreens) * 100}%` }}/>
        </div>
        <div className="chrome">
          <div className="chrome-left eyebrow">
            <span className="dot"/>
            <span>{t(eyebrow)}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {audioState && <AudioIndicator audioState={audioState}/>}
            <div className="mono small" style={{ color: T.ink3 }}>
              {String(screen + 1).padStart(2, '0')} / {String(totalScreens).padStart(2, '0')}
            </div>
          </div>
        </div>
      </div>
      <div className="stage-content" style={{ paddingLeft: padH, paddingRight: padH }}>
        {children}
      </div>
      {navContent && <div className="stage-nav" style={{ paddingLeft: padH, paddingRight: padH }}>{navContent}</div>}
    </div>
  );
};

const NavBack = ({ onPrev, label = 'Назад' }) => (
  <button className="btn-ghost" onClick={onPrev}
    style={{ padding: 'clamp(10px, 1.7vw, 12px) clamp(15px, 2.1vw, 20px)', fontSize: 'clamp(12px, 1.5vw, 14px)' }}>
    {label}
  </button>
);

const NavNext = ({ disabled, label, onClick }) => (
  <button className="btn-white-accent" disabled={disabled} onClick={onClick}
    style={{ padding: 'clamp(10px, 1.7vw, 12px) clamp(20px, 2.5vw, 27px)', fontSize: 'clamp(12px, 1.5vw, 14px)', marginLeft: 'auto' }}>
    {label}
  </button>
);

const NextLabel = () => {
  const lang = useLang();
  return lang === 'uz' ? 'Davom etish' : 'Дальше';
};

const BackLabel = () => {
  const lang = useLang();
  return lang === 'uz' ? 'Orqaga' : 'Назад';
};

// QuestionScreen (infra)
const QuestionScreen = ({ screen, idx, totalScreens, screenMeta, screenContent, question, options, correctIdx, storedAnswer, onAnswer, onNext, onPrev }) => {
  const lang = useLang();
  const t = useT();
  const c = screenContent;

  const audio = useAudio([{
    id: `s${idx}_intro`,
    text: c.audio.intro[lang],
    trigger: 'on_mount',
    waits_for: { type: 'option_picked' }
  }]);

  const [picked, setPicked] = useState(storedAnswer?.studentAnswerIndex ?? null);
  const [revealed, setRevealed] = useState(storedAnswer !== undefined);

  const pick = (i) => {
    if (revealed) return;
    setPicked(i);
    setRevealed(true);
    const isCorrect = i === correctIdx;
    onAnswer({
      stage: screenMeta?.scope ?? null,
      screenIdx: idx,
      question: typeof question === 'string' ? question : null,
      options: options.map(o => typeof o === 'string' ? o : null),
      correctIndex: correctIdx,
      correctAnswer: typeof options[correctIdx] === 'string' ? options[correctIdx] : null,
      studentAnswerIndex: i,
      studentAnswer: typeof options[i] === 'string' ? options[i] : null,
      correct: isCorrect
    });
    audio.triggerEvent('option_picked');

    if (!audio.muted) {
      setTimeout(() => {
        const engine = getAudioEngine();
        if (engine && !audio.muted) {
          const fbAudio = isCorrect ? c.audio.on_correct[lang] : c.audio.on_wrong[lang];
          engine.pushOneOff(fbAudio);
        }
      }, 300);
    }
  };

  const navContent = (
    <>
      <NavBack onPrev={onPrev} label={<BackLabel/>}/>
      <NavNext disabled={!revealed} onClick={onNext} label={<NextLabel/>}/>
    </>
  );

  return (
    <Stage eyebrow={c.eyebrow} screen={screen} totalScreens={totalScreens} navContent={navContent} audioState={audio}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(17px, 2.5vw, 24px)' }}>
        <div className="fade-up">{question}</div>
        {!revealed && EXTRA[idx]?.hint && <div className="fade-up delay-1"><HintToggle hint={EXTRA[idx].hint}/></div>}
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
                style={{ padding: 'clamp(12px, 1.7vw, 15px) clamp(14px, 2.1vw, 19px)', fontSize: 'clamp(13px, 1.6vw, 14px)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="mono small" style={{ minWidth: 20, color: revealed && i === correctIdx ? T.success : T.ink3 }}>
                  {String.fromCharCode(65 + i)}
                </span>
                <span style={{ flex: 1 }}>{opt}</span>
              </button>
            );
          })}
        </div>
        <FeedbackBlock show={revealed} isCorrect={picked === correctIdx}>
          <p className="small mono" style={{ margin: 0, marginBottom: 8, fontWeight: 600, color: picked === correctIdx ? T.success : T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {picked === correctIdx ? (lang === 'uz' ? "To'g'ri" : 'Верно') : (lang === 'uz' ? "Noto'g'ri" : 'Не совсем')}
          </p>
          <p className="body" style={{ margin: 0 }}>
            {picked === correctIdx
              ? t(c.correct_text)
              : t(c[`wrong_${picked}`] || c.wrong_default)}
          </p>
        </FeedbackBlock>
        {revealed && SOLUTIONS[idx] && <SolutionPlayer sol={SOLUTIONS[idx]}/>}
      </div>
    </Stage>
  );
};

// ArrowLeft/MONO/ColRow (infra)
const ArrowLeft = ({ color }) => (
  <svg width="22" height="14" viewBox="0 0 22 14" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
    <path d="M21 7H3"/><path d="M9 1 3 7l6 6"/>
  </svg>
);

// Моноширинный контекст: ch-ширина черты считается тем же шрифтом, что и числа,
// поэтому черта точно доходит до краёв самого широкого числа.
const MONO = { fontFamily: "'JetBrains Mono', monospace", fontSize: 'clamp(20px, 4.4vw, 30px)', lineHeight: 1.5 };

const ColRow = ({ children, caption, captionColor, numStyle }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
    <div style={numStyle}>{children}</div>
    {caption && (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: captionColor }}>
        <ArrowLeft color={captionColor}/>
        <span className="mono small" style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{caption}</span>
      </div>
    )}
  </div>
);

// renderNum (infra)
const renderNum = (str, color, shift, animate) => {
  const chars = String(str).split('');
  const n = chars.length;
  const out = chars.map((ch, i) => (
    <span key={i} className={animate ? 'mb-pop' : undefined}
      style={{ color, fontWeight: 700, animationDelay: animate ? `${(n - 1 - i) * 0.16}s` : undefined }}>{ch}</span>
  ));
  for (let k = 0; k < (shift || 0); k++) out.push(<span key={`sp${k}`}>{'\u00A0'}</span>);
  return out;
};

// ============================================================
// ЛЕСОН-ВИЗУАЛИЗАТОР — столбик сложения и вычитания
// Раскладка как в учебнике: знак (+/−) в левом столбце, по центру
// относительно слагаемых; цифры — строго разряд под разрядом (правый
// край). Сложение: чип "a + b (+перенос) = sum", перенос — оранжевый sup.
// Вычитание: чип "effTop − bot = diff" (заём учтён в caption).
// ============================================================
const ASCOLORS = (op) => op === '-'
  ? { result: T.blue, active: T.blue }
  : { result: T.success, active: T.accent };

// Сетка столбика: gutter(знак) + числа. operatorRow=true → знак по центру слагаемых.
const ColGrid = ({ op, numWidth, top, bottom, resultNode, resultColor }) => {
  const oc = op === '-' ? '\u2212' : '+';
  const num = { ...MONO, whiteSpace: 'pre', textAlign: 'right', minWidth: `${numWidth}ch`, display: 'block' };
  return (
    <div style={{ display: 'inline-grid', gridTemplateColumns: 'auto auto', alignItems: 'center', columnGap: '0.5ch', rowGap: '1px' }}>
      <div style={{ ...MONO, gridColumn: 1, gridRow: '1 / 3', alignSelf: 'center', justifySelf: 'center', color: T.ink2 }}>{oc}</div>
      <div style={{ gridColumn: 2, gridRow: 1, ...num }}>{String(top)}</div>
      <div style={{ gridColumn: 2, gridRow: 2, ...num }}>{String(bottom)}</div>
      <div style={{ gridColumn: '1 / 3', gridRow: 3, height: 2, background: T.ink, borderRadius: 1, margin: '5px 0' }}/>
      <div style={{ gridColumn: 2, gridRow: 4, ...num, color: resultColor, fontWeight: 700 }}>{resultNode}</div>
    </div>
  );
};

// Статичный столбик (хук)
const AddSubBoard = ({ op, top, bottom, result, resultColor }) => {
  const numWidth = Math.max(String(top).length, String(bottom).length, String(result).length);
  return <ColGrid op={op} numWidth={numWidth} top={top} bottom={bottom} resultNode={String(result)} resultColor={resultColor || T.ink2}/>;
};

// cols — массив разрядов от единиц влево: { cap, sum, carry? }
const AddSubColumnStepwise = ({ op, top, bottom, cols, reveal = 0, chipsShown = 0, activeIdx = -1, result }) => {
  const numWidth = Math.max(String(top).length, String(bottom).length, String(result).length);
  const C = ASCOLORS(op);
  const rArr = String(result).split('');
  const shown = Math.min(reveal, rArr.length);
  const revealedStr = shown > 0 ? rArr.slice(rArr.length - shown).join('') : '';
  const resultNode = shown > 0 ? renderNum(revealedStr, C.result, 0, true) : '\u00A0';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(12px, 2.5vw, 18px)', width: '100%', alignItems: 'center' }}>
      <ColGrid op={op} numWidth={numWidth} top={top} bottom={bottom} resultNode={resultNode} resultColor={C.result}/>
      {chipsShown > 0 && (
        <div className="mb-work">
          <div className="mb-work-chips">
            {cols.slice(0, chipsShown).map((ch, i) => (
              <span key={i} className="mb-chip mb-pop" style={{ animationDelay: `${i * 0.16}s`, boxShadow: i === activeIdx ? `0 0 0 2px ${C.active}, 0 4px 12px -6px rgba(58, 53, 48, 0.16)` : undefined }}>
                <span className="mono">{ch.cap}</span>
                <span className="mono"> = </span>
                <span className="mono" style={{ color: C.active, fontWeight: 700 }}>{ch.sum}</span>
                {ch.carry ? <sup className="mb-carry" style={{ color: T.accent }}>+{ch.carry}</sup> : null}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// UI (infra)
const UI = {
  hint:         { ru: 'Подсказка', uz: 'Maslahat' },
  hide:         { ru: 'Скрыть подсказку', uz: 'Maslahatni yashirish' },
  solution:     { ru: 'Решение', uz: 'Yechim' },
  showSolution: { ru: 'Показать решение', uz: "Yechimni ko'rsatish" },
  replay:       { ru: '↻ Повторить', uz: '↻ Qaytarish' },
  tryAgain:     { ru: 'Не сходится. Загляни в подсказку и попробуй ещё раз.', uz: "To'g'ri kelmadi. Maslahatga qarang va yana urinib ko'ring." },
  retryOk:      { ru: 'Теперь верно. В счёт идёт первая попытка.', uz: "Endi to'g'ri. Hisobga birinchi urinish kiradi." },
  gaveUp:       { ru: 'Ничего страшного. Посмотри разбор решения ниже.', uz: "Hechqisi yo'q. Quyida yechim tahlilini ko'ring." },
  wrongAudio:   { ru: 'Не совсем. Попробуй ещё раз.', uz: "Unchalik emas. Yana urinib ko'ring." }
};

// Анимированное решение примера: проигрывается само, разряд за разрядом, с повтором.
const SolutionPlayer = ({ sol }) => {
  const lang = useLang();
  const steps = sol.cols.length;
  const [step, setStep] = useState(0);
  const [playing, setPlaying] = useState(true);
  useEffect(() => {
    if (!playing) return;
    if (step >= steps - 1) { setPlaying(false); return; }
    const id = setTimeout(() => setStep(s => s + 1), 1300);
    return () => clearTimeout(id);
  }, [step, playing, steps]);
  return (
    <div className="frame-soft fade-up" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <span className="mono small" style={{ color: T.success, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{UI.solution[lang]}</span>
        <button className="sol-replay" onClick={() => { setStep(0); setPlaying(true); }}>{UI.replay[lang]}</button>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', overflowX: 'auto' }}>
        <AddSubColumnStepwise op={sol.op} top={sol.top} bottom={sol.bottom} cols={sol.cols} result={sol.result}
          reveal={step + 1} chipsShown={step + 1} activeIdx={step}/>
      </div>
    </div>
  );
};

// HintToggle (infra)
const HintToggle = ({ hint }) => {
  const t = useT();
  const lang = useLang();
  const [open, setOpen] = useState(false);
  if (!hint) return null;
  return (
    <div>
      <button className="hint-toggle" onClick={() => setOpen(o => !o)}>
        {open ? UI.hide[lang] : `? ${UI.hint[lang]}`}
      </button>
      {open && (
        <div className="frame-soft" style={{ marginTop: 8 }}>
          <p className="body" style={{ margin: 0 }}>{t(hint)}</p>
        </div>
      )}
    </div>
  );
};

// RefNote (infra)
const RefNote = ({ idx }) => {
  const t = useT();
  const r = REFS[idx];
  if (!r) return null;
  return (
    <div className="fade-up" style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginTop: 4 }}>
      <span style={{ flexShrink: 0, paddingTop: 3 }}><ArrowLeft color={T.ink3}/></span>
      <span className="small" style={{ color: T.ink3 }}>{t(r)}</span>
    </div>
  );
};

// CheckLabel (infra)
const CheckLabel = () => {
  const lang = useLang();
  return lang === 'uz' ? 'Tekshirish' : 'Проверить';
};

// Короткая озвучка ответа на верный ввод/выбор (без подробного разбора). Числа словами.
const ANSWER_VOICE = {
  '461': { ru: 'Верно. Ответ четыреста шестьдесят один.', uz: "To'g'ri. Javob to'rt yuz oltmish bir." },
  '332': { ru: 'Верно. Ответ триста тридцать два.', uz: "To'g'ri. Javob uch yuz o'ttiz ikki." },
  '695': { ru: 'Верно. Ответ шестьсот девяносто пять.', uz: "To'g'ri. Javob olti yuz to'qson besh." },
  '604': { ru: 'Верно. Ответ шестьсот четыре.', uz: "To'g'ri. Javob olti yuz to'rt." },
  '308': { ru: 'Верно. Ответ триста восемь.', uz: "To'g'ri. Javob uch yuz sakkiz." },
  '305': { ru: 'Верно. Ответ триста пять.', uz: "To'g'ri. Javob uch yuz besh." },
  '237': { ru: 'Верно. Ответ двести тридцать семь.', uz: "To'g'ri. Javob ikki yuz o'ttiz yetti." },
  '825': { ru: 'Верно. Ответ восемьсот двадцать пять.', uz: "To'g'ri. Javob sakkiz yuz yigirma besh." }
};

// ============================================================
// LESSON: интерактивный столбик. Ядро — ColumnSolver (ученик вводит
// цифры результата + переносы при сложении, поразрядная проверка).
// Используется и на input-экранах (s3,s7,s12), и как recovery на MC:
// при неверном выборе ученик дорешает пример в столбике.
// ============================================================

const DigitBox = ({ value, onChange, status, locked, label, faded, len = 1 }) => (
  <input
    type="text" inputMode="numeric" maxLength={len} value={value} disabled={locked}
    aria-label={label}
    onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, '').slice(-len))}
    style={{
      width: len > 1 ? '2.2em' : '1.55em', height: '1.85em', padding: 0, textAlign: 'center',
      fontFamily: MONO.fontFamily, fontWeight: 700, fontSize: faded ? '0.66em' : '1em',
      color: status === 'wrong' ? T.accent : (status === 'ok' ? T.success : T.ink),
      background: T.paper, borderRadius: 7, border: 'none', outline: 'none',
      boxShadow: status === 'wrong' ? `0 0 0 2px ${T.accent}`
        : (status === 'ok' ? `0 0 0 2px ${T.success}` : 'inset 0 0 0 1.5px rgba(58, 53, 48, 0.18)'),
      transition: 'box-shadow 0.15s, color 0.15s'
    }}
  />
);

// Решатель столбика. onResolved({ firstOk, solved }) — один раз, когда заблокирован.
const ColumnSolver = ({ sol, texts, onResolved }) => {
  const t = useT();
  const lang = useLang();
  const op = sol.op;
  const m = sol.cols.length;
  const n = Math.max(String(sol.top).length, String(sol.bottom).length, String(sol.result).length);
  const topD = String(sol.top).padStart(n, ' ').split('');
  const botD = String(sol.bottom).padStart(n, ' ').split('');
  const expRes = sol.cols.map(x => x.write !== undefined ? String(x.write) : String(x.sum).slice(-1));
  const expCarry = sol.cols.map(x => x.carry ? 1 : 0);
  const effTop = sol.cols.map(x => String(x.cap).split('\u2212')[0].trim());
  // ожидаемое значение НАД-клетки по экранной позиции d:
  //   сложение — перенос «1» над разрядом, который его получает;
  //   вычитание — перестроенная верхняя цифра после заёма (у единиц может быть двузначной, напр. «10»).
  const aboveExp = [];
  for (let d = 0; d < n; d++) {
    const i = n - 1 - d;
    if (op === '+') {
      aboveExp[d] = (i >= 1 && i <= m - 1 && expCarry[i - 1] === 1) ? '1' : null;
    } else {
      const orig = (topD[d] || '').trim();
      if (i < m) aboveExp[d] = (effTop[i] !== undefined && effTop[i] !== orig) ? effTop[i] : null;
      else { const num = Number(orig); aboveExp[d] = isNaN(num) ? null : String(num - 1); }
    }
  }

  const [res, setRes] = useState(Array(m).fill(''));
  const [above, setAbove] = useState(Array(n).fill(''));
  const [checked, setChecked] = useState(false);
  const [solved, setSolved] = useState(false);
  const [gaveUp, setGaveUp] = useState(false);
  const [wrongFlash, setWrongFlash] = useState(false);
  const [wrongCount, setWrongCount] = useState(0);
  const firstRef = useRef(null);
  const resolvedRef = useRef(false);
  const locked = solved || gaveUp;

  const resOk = (i) => res[i] === expRes[i];
  const aboveOk = (d) => aboveExp[d] === null ? true : above[d] === aboveExp[d];
  const allAboveFilled = aboveExp.every((e, d) => e === null || above[d] !== '');
  const allFilled = res.every(v => v !== '') && allAboveFilled;   // включить «Проверить» только когда заполнены ВСЕ клетки над и под чертой
  const allOk = res.every((_, i) => resOk(i)) && aboveExp.every((e, d) => aboveOk(d));   // зачёт — полное совпадение столбика

  const fire = (solvedFlag) => {
    if (!resolvedRef.current) { resolvedRef.current = true; onResolved && onResolved({ firstOk: firstRef.current === 'ok', solved: solvedFlag }); }
  };
  const doCheck = () => {
    if (locked || !allFilled) return;
    const ok = allOk;
    if (firstRef.current === null) firstRef.current = ok ? 'ok' : 'wrong';
    setChecked(true);
    if (ok) { setSolved(true); setWrongFlash(false); fire(true); }
    else { setWrongFlash(true); setWrongCount(w => w + 1); }   // даём решать в столбике; после 3 попыток откроется «Решение»
  };
  // «Решение» (после 3 попыток): ввод ученика остаётся, показываем озвученный разбор; «Далее» откроется по его окончании.
  const reveal = () => { if (firstRef.current === null) firstRef.current = 'wrong'; setChecked(true); setGaveUp(true); };
  const cellStatus = () => solved ? 'ok' : 'idle';   // без поразрядной правильности — иначе можно подбирать цифры

  const numStyle = { fontFamily: MONO.fontFamily, fontWeight: 600, fontSize: 'clamp(20px, 5vw, 26px)', color: T.ink, textAlign: 'center', minWidth: '1.55em', display: 'inline-block' };
  const cells = [];
  for (let d = 0; d < n; d++) {
    const i = n - 1 - d;
    const gc = d + 2;
    const hasRes = i < m;
    if (aboveExp[d] !== null) {
      const alen = aboveExp[d].length;
      cells.push(<div key={`a${d}`} style={{ gridColumn: gc, gridRow: 1, display: 'flex', justifyContent: 'center' }}>
        <DigitBox value={above[d]} onChange={(v) => { if (!locked) { setWrongFlash(false); setAbove(p => { const a = [...p]; a[d] = v; return a; }); } }} status={cellStatus()} locked={locked} faded len={alen} label={`клетка над разрядом ${i + 1}`}/>
      </div>);
    }
    cells.push(<div key={`t${d}`} style={{ gridColumn: gc, gridRow: 2, ...numStyle }}>{topD[d] === ' ' ? '\u00A0' : topD[d]}</div>);
    cells.push(<div key={`b${d}`} style={{ gridColumn: gc, gridRow: 3, ...numStyle }}>{botD[d] === ' ' ? '\u00A0' : botD[d]}</div>);
    cells.push(<div key={`r${d}`} style={{ gridColumn: gc, gridRow: 5, display: 'flex', justifyContent: 'center' }}>
      {hasRes
        ? <DigitBox value={res[i]} onChange={(v) => { if (!locked) { setWrongFlash(false); setRes(p => { const a = [...p]; a[i] = v; return a; }); } }} status={cellStatus()} locked={locked} label={`цифра результата, разряд ${i + 1}`}/>
        : <span style={{ ...numStyle, color: T.ink3 }}>{'\u00A0'}</span>}
    </div>);
  }

  const hint = op === '+'
    ? (lang === 'uz' ? "Chiziq ustiga dildagi (ko'chirish) raqamlarni, ostiga javobni yozing" : 'Над чертой впиши перенос (что держишь в уме), под чертой — ответ')
    : (lang === 'uz' ? "Chiziq ustiga qarz olgandagi yangi raqamlarni, ostiga javobni yozing" : 'Над чертой впиши перестроенные цифры (заём), под чертой — ответ');
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(10px, 2vw, 14px)' }}>
      {!locked && <p className="small" style={{ margin: 0, color: T.ink2 }}>{hint}</p>}
      <div className="frame" style={{ display: 'flex', justifyContent: 'center', padding: 'clamp(20px, 3.4vw, 26px) clamp(10px, 2vw, 18px) clamp(16px, 3vw, 24px)', overflowX: 'auto', boxShadow: (wrongFlash && !solved) ? `0 0 0 2px ${T.accent}, 0 8px 22px -6px rgba(58, 53, 48, 0.14)` : undefined }}>
        <div style={{ display: 'inline-grid', gridTemplateColumns: `auto repeat(${n}, auto)`, alignItems: 'center', columnGap: 'clamp(6px, 1.5vw, 10px)', rowGap: 4 }}>
          <div style={{ gridColumn: 1, gridRow: '2 / 4', alignSelf: 'center', justifySelf: 'center', ...numStyle, color: T.ink2 }}>{op === '-' ? '\u2212' : '+'}</div>
          <div style={{ gridColumn: `1 / ${n + 2}`, gridRow: 4, height: 2, background: T.ink, borderRadius: 1, margin: '4px 0' }}/>
          {cells}
        </div>
      </div>
      {!locked && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          {wrongCount >= 3 && <button className="btn-ghost" onClick={reveal} style={{ padding: 'clamp(10px, 1.7vw, 12px) clamp(15px, 2.1vw, 19px)', fontSize: 'clamp(12px, 1.5vw, 14px)' }}>{UI.showSolution[lang]}</button>}
          <button className="btn-white-accent" disabled={!allFilled} onClick={doCheck} style={{ padding: 'clamp(11px, 1.8vw, 13px) clamp(20px, 2.6vw, 28px)', fontSize: 'clamp(13px, 1.6vw, 14px)' }}><CheckLabel/></button>
        </div>
      )}
      {wrongFlash && !solved && (
        <p className="small" style={{ margin: 0, color: T.accent }}>{lang === 'uz' ? "Hali mos emas — qaytadan tekshiring" : 'Пока не сходится — проверь и нажми ещё раз'}</p>
      )}
      {solved && (
        <FeedbackBlock show={true} isCorrect={true}>
          <p className="small mono" style={{ margin: 0, marginBottom: 8, fontWeight: 600, color: T.success, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{lang === 'uz' ? "To'g'ri" : 'Верно'}</p>
          <p className="body" style={{ margin: 0 }}>{firstRef.current === 'ok' ? (texts && texts.correct ? t(texts.correct) : '') : UI.retryOk[lang]}</p>
        </FeedbackBlock>
      )}
      {gaveUp && sol.narr && <AnimatedSolution sol={sol} onDone={() => fire(false)}/>}
      {gaveUp && !sol.narr && texts && texts.reveal && (
        <div className="frame-success fade-up"><p className="body" style={{ margin: 0 }}>{t(texts.reveal)}</p></div>
      )}
    </div>
  );
};

// Input-экран: вопрос + столбик-решатель (s3, s7, s12).
const InteractiveColumn = ({ idx, screen, totalScreens, storedAnswer, onAnswer, onNext, onPrev }) => {
  const c = CONTENT[`s${idx}`];
  const meta = SCREEN_META[idx];
  const t = useT();
  const lang = useLang();
  const sol = SOLUTIONS[idx];
  const audio = useAudio([{ id: `s${idx}_intro`, text: c.audio.intro[lang], trigger: 'on_mount', waits_for: { type: 'check_pressed' } }]);
  const restored = storedAnswer !== undefined;
  const [resolved, setResolved] = useState(restored);

  const handleResolved = ({ firstOk, solved }) => {
    onAnswer({ stage: meta.scope, screenIdx: idx, question: c.question ? c.question[lang] : null, correctAnswer: String(sol.result), correct: firstOk });
    setResolved(true);
    audio.triggerEvent('check_pressed');
    // верно → коротко озвучиваем ответ; «Решение» (give-up) озвучивает AnimatedSolution сам
    if (solved && ANSWER_VOICE[sol.result] && !audio.muted) {
      setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff(ANSWER_VOICE[sol.result][lang]); }, 250);
    }
  };

  const navContent = (<><NavBack onPrev={onPrev} label={<BackLabel/>}/><NavNext disabled={!resolved} onClick={onNext} label={<NextLabel/>}/></>);
  return (
    <Stage eyebrow={c.eyebrow} screen={screen} totalScreens={totalScreens} navContent={navContent} audioState={audio}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: resolved ? 'clamp(11px, 1.8vw, 15px)' : 'clamp(16px, 2.5vw, 22px)' }}>
        <div className="fade-up">
          <p className="eyebrow" style={{ color: T.accent }}>{t(c.label)}</p>
          {resolved
            ? <p className="small" style={{ marginTop: 5, color: T.ink2 }}>{t(c.question)}</p>
            : <h2 className="title h-sub" style={{ marginTop: 8 }}>{t(c.question)}</h2>}
        </div>
        {!resolved && c.hint && <div className="fade-up delay-1"><HintToggle hint={c.hint}/></div>}
        <div className="fade-up delay-1"><ColumnSolver sol={sol} texts={{ correct: c.fb_correct, reveal: c.fb_wrong }} onResolved={handleResolved}/></div>
      </div>
    </Stage>
  );
};

// Статичный готовый столбик — подтверждение при верном ответе на MC.
const StaticSolution = ({ sol }) => {
  const lang = useLang();
  return (
    <div className="frame-success fade-up" style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <span className="mono small" style={{ color: T.success, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{UI.solution[lang]}</span>
      <div style={{ display: 'flex', justifyContent: 'center', overflowX: 'auto' }}>
        <AddSubColumnStepwise op={sol.op} top={sol.top} bottom={sol.bottom} cols={sol.cols} result={sol.result} reveal={String(sol.result).length} chipsShown={sol.cols.length} activeIdx={-1}/>
      </div>
    </div>
  );
};


// Read-only квадрат демонстрации: цифра «встаёт» в клетку с анимацией.
const DemoCell = ({ digit, revealed, active, color }) => (
  <div style={{
    width: '1.7em', height: '1.95em', display: 'flex', alignItems: 'center', justifyContent: 'center',
    borderRadius: 8, background: T.paper, transition: 'box-shadow 0.2s',
    boxShadow: active ? `0 0 0 2px ${color}` : 'inset 0 0 0 1.5px rgba(58, 53, 48, 0.18)',
    fontFamily: MONO.fontFamily, fontWeight: 700, fontSize: '1em', color: T.ink
  }}>
    {revealed ? <span key={digit} className="cell-pop">{digit}</span> : '\u00A0'}
  </div>
);

// Анимированное объяснение столбика: ученик жмёт «Дальше», урок сам ставит
// цифру/перенос в квадрат и поясняет голосом. Текста нет — только заголовок + визуал + голос.
const ColumnDemo = ({ idx, screen, totalScreens, onNext, onPrev, op, top, bottom, cols, result, plan }) => {
  const c = CONTENT[`s${idx}`];
  const t = useT();
  const lang = useLang();
  const segs = c.audio[lang].map((text, i) => ({
    id: `s${idx}_a${i}`, text,
    trigger: i === 0 ? 'on_mount' : `on_event:step_${i}`,
    waits_for: { type: 'button_click', target: i < c.audio[lang].length - 1 ? 'step' : 'next' }
  }));
  const audio = useAudio(segs);
  const [step, setStep] = useState(0);
  const last = c.audio[lang].length - 1;
  const m = cols.length;
  const n = Math.max(String(top).length, String(bottom).length, String(result).length);
  const topD = String(top).padStart(n, ' ').split('');
  const botD = String(bottom).padStart(n, ' ').split('');
  const resD = cols.map(x => x.write !== undefined ? String(x.write) : String(x.sum).slice(-1));
  const carryD = cols.map(x => x.carry ? '1' : '');
  const effTop = cols.map(x => String(x.cap).split('\u2212')[0].trim());
  const colColor = ASCOLORS(op).active;
  const p = plan[Math.min(step, plan.length - 1)];

  const handleStep = () => {
    if (step < last) { const ns = step + 1; setStep(ns); audio.triggerInternal(`step_${ns}`); }
    else { audio.triggerEvent('button_click', 'next'); onNext(); }
  };
  const navContent = (<><NavBack onPrev={onPrev} label={<BackLabel/>}/><NavNext label={step < last ? t(c.btn_step) : <NextLabel/>} onClick={handleStep}/></>);

  const numStyle = { fontFamily: MONO.fontFamily, fontWeight: 600, fontSize: 'clamp(20px, 5vw, 26px)', color: T.ink, textAlign: 'center', minWidth: '1.7em', display: 'inline-block' };
  const cells = [];
  for (let d = 0; d < n; d++) {
    const i = n - 1 - d;
    const gc = d + 2;
    const hasRes = i < m;
    if (op === '+' && i >= 1 && i <= m - 1 && p.chipsShown >= i && carryD[i - 1]) {
      cells.push(<div key={`c${i}`} style={{ gridColumn: gc, gridRow: 1, display: 'flex', justifyContent: 'center' }}>
        <span className="cell-pop" style={{ fontFamily: MONO.fontFamily, fontSize: '0.62em', color: T.accent, fontWeight: 700 }}>{carryD[i - 1]}</span>
      </div>);
    }
    if (op === '-' && hasRes && p.chipsShown > i && effTop[i] && effTop[i] !== (topD[d] || '').trim()) {
      cells.push(<div key={`e${i}`} className="cell-pop" style={{ gridColumn: gc, gridRow: 1, textAlign: 'center', fontFamily: MONO.fontFamily, fontSize: '0.6em', color: T.ink3 }}>{effTop[i]}</div>);
    }
    cells.push(<div key={`t${d}`} style={{ gridColumn: gc, gridRow: 2, ...numStyle }}>{topD[d] === ' ' ? '\u00A0' : topD[d]}</div>);
    cells.push(<div key={`b${d}`} style={{ gridColumn: gc, gridRow: 3, ...numStyle }}>{botD[d] === ' ' ? '\u00A0' : botD[d]}</div>);
    cells.push(<div key={`r${d}`} style={{ gridColumn: gc, gridRow: 5, display: 'flex', justifyContent: 'center' }}>
      {hasRes
        ? <DemoCell digit={resD[i]} revealed={i < p.reveal} active={i === p.activeIdx} color={colColor}/>
        : <span style={{ ...numStyle, color: T.ink3 }}>{'\u00A0'}</span>}
    </div>);
  }

  return (
    <Stage eyebrow={c.eyebrow} screen={screen} totalScreens={totalScreens} navContent={navContent} audioState={audio}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(18px, 3vw, 26px)', justifyContent: 'center' }}>
        <h2 className="title h-title fade-up" style={{ textAlign: 'center' }}>{t(c.title)}</h2>
        <div className="frame fade-up delay-1" style={{ display: 'flex', justifyContent: 'center', padding: 'clamp(20px, 4vw, 32px) clamp(10px, 2vw, 18px)', overflowX: 'auto' }}>
          <div style={{ display: 'inline-grid', gridTemplateColumns: `auto repeat(${n}, auto)`, alignItems: 'center', columnGap: 'clamp(6px, 1.5vw, 10px)', rowGap: 6 }}>
            <div style={{ gridColumn: 1, gridRow: '2 / 4', alignSelf: 'center', justifySelf: 'center', ...numStyle, color: T.ink2 }}>{op === '-' ? '\u2212' : '+'}</div>
            <div style={{ gridColumn: `1 / ${n + 2}`, gridRow: 4, height: 2, background: T.ink, borderRadius: 1, margin: '4px 0' }}/>
            {cells}
          </div>
        </div>
      </div>
    </Stage>
  );
};


// Анимированное озвученное решение: проигрывается само, разряд за разрядом;
// картинку ведёт фактический конец реплики (ухо=глаз). В конце — заключение примера,
// после которого вызывается onDone (родитель разблокирует «Дальше»). Кнопка «Повторить».
const AnimatedSolution = ({ sol, onDone }) => {
  const lang = useLang();
  const narr = (sol.narr && sol.narr[lang]) || [];
  const stepCount = sol.cols.length;
  const lastIdx = narr.length - 1;
  const [runId, setRunId] = useState(0);
  const [maxStep, setMaxStep] = useState(0);
  const [reachedLast, setReachedLast] = useState(false);
  const doneRef = useRef(false);
  const fireDone = () => { if (!doneRef.current) { doneRef.current = true; onDone && onDone(); } };
  const segs = narr.map((text, i) => ({ id: `sol${i}`, text, trigger: i === 0 ? 'on_mount' : `solseq${i}`, waits_for: null, _r: runId }));
  const audio = useAudio(segs);
  useEffect(() => {
    const cs = audio.currentSegment;
    if (cs && cs.slice(0, 3) === 'sol') {
      const k = parseInt(cs.slice(3), 10);
      if (!isNaN(k)) { setMaxStep(m => Math.max(m, Math.min(k + 1, stepCount))); if (k >= lastIdx) setReachedLast(true); }
    }
  }, [audio.currentSegment]);
  useEffect(() => { if (reachedLast && !audio.isPlaying) fireDone(); }, [reachedLast, audio.isPlaying]);
  useEffect(() => { const id = setTimeout(fireDone, (narr.length + 1) * 9000); return () => clearTimeout(id); }, []);
  const onReplay = () => { setMaxStep(0); setReachedLast(false); setRunId(r => r + 1); };

  const m = sol.cols.length;
  const n = Math.max(String(sol.top).length, String(sol.bottom).length, String(sol.result).length);
  const topD = String(sol.top).padStart(n, ' ').split('');
  const botD = String(sol.bottom).padStart(n, ' ').split('');
  const resD = sol.cols.map(x => x.write !== undefined ? String(x.write) : String(x.sum).slice(-1));
  const carryD = sol.cols.map(x => x.carry ? '1' : '');
  const effTop = sol.cols.map(x => String(x.cap).split('\u2212')[0].trim());
  const colColor = ASCOLORS(sol.op).active;
  const numStyle = { fontFamily: MONO.fontFamily, fontWeight: 600, fontSize: 'clamp(16px, 3.8vw, 21px)', color: T.ink, textAlign: 'center', minWidth: '1.6em', display: 'inline-block' };
  const cells = [];
  for (let d = 0; d < n; d++) {
    const i = n - 1 - d;
    const gc = d + 2;
    const hasRes = i < m;
    if (sol.op === '+' && i >= 1 && i <= m - 1 && maxStep >= i && carryD[i - 1]) {
      cells.push(<div key={`c${i}`} style={{ gridColumn: gc, gridRow: 1, display: 'flex', justifyContent: 'center' }}><span className="cell-pop" style={{ fontFamily: MONO.fontFamily, fontSize: '0.62em', color: T.accent, fontWeight: 700 }}>{carryD[i - 1]}</span></div>);
    }
    if (sol.op === '-' && hasRes && maxStep >= 1 && effTop[i] && effTop[i] !== (topD[d] || '').trim()) {
      cells.push(<div key={`e${i}`} className="cell-pop" style={{ gridColumn: gc, gridRow: 1, textAlign: 'center', fontFamily: MONO.fontFamily, fontSize: '0.6em', color: T.ink3 }}>{effTop[i]}</div>);
    }
    cells.push(<div key={`t${d}`} style={{ gridColumn: gc, gridRow: 2, ...numStyle }}>{topD[d] === ' ' ? '\u00A0' : topD[d]}</div>);
    cells.push(<div key={`b${d}`} style={{ gridColumn: gc, gridRow: 3, ...numStyle }}>{botD[d] === ' ' ? '\u00A0' : botD[d]}</div>);
    cells.push(<div key={`r${d}`} style={{ gridColumn: gc, gridRow: 5, display: 'flex', justifyContent: 'center' }}>{hasRes ? <DemoCell digit={resD[i]} revealed={i < maxStep} active={!reachedLast && i === maxStep - 1} color={colColor}/> : <span style={{ ...numStyle, color: T.ink3 }}>{'\u00A0'}</span>}</div>);
  }
  return (
    <div className="frame-success fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <span className="mono small" style={{ color: T.success, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{UI.solution[lang]}</span>
        <button className="btn-ghost" onClick={onReplay} style={{ padding: 'clamp(7px, 1.2vw, 9px) clamp(12px, 1.8vw, 16px)', fontSize: 'clamp(12px, 1.4vw, 13px)' }}>{UI.replay[lang]}</button>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center', overflowX: 'auto' }}>
        <div style={{ display: 'inline-grid', gridTemplateColumns: `auto repeat(${n}, auto)`, alignItems: 'center', columnGap: 'clamp(6px, 1.5vw, 10px)', rowGap: 4 }}>
          <div style={{ gridColumn: 1, gridRow: '2 / 4', alignSelf: 'center', justifySelf: 'center', ...numStyle, color: T.ink2 }}>{sol.op === '-' ? '\u2212' : '+'}</div>
          <div style={{ gridColumn: `1 / ${n + 2}`, gridRow: 4, height: 2, background: T.ink, borderRadius: 1, margin: '4px 0' }}/>
          {cells}
        </div>
      </div>
      {reachedLast && narr[lastIdx] && <p className="body" style={{ margin: 0, color: T.ink2 }}>{narr[lastIdx]}</p>}
    </div>
  );
};

// Авто-анимация решения для экранов-правил: проигрывается сама, динамично.
// Сложение — ставит результат и переносы по разрядам. Вычитание — сначала
// анимирует ЗАЁМ (единица уходит из старшего разряда, нули по цепочке становятся
// девятками, у младшего появляется десять; исходные цифры зачёркиваются),
// затем вычитает по разрядам. Без озвучки (голос правила звучит отдельно). «Повторить».
const ColumnAutoAnim = ({ sol, onDone }) => {
  const lang = useLang();
  const op = sol.op;
  const m = sol.cols.length;
  const n = Math.max(String(sol.top).length, String(sol.bottom).length, String(sol.result).length);
  const topD = String(sol.top).padStart(n, ' ').split('');
  const botD = String(sol.bottom).padStart(n, ' ').split('');
  const resD = sol.cols.map(x => x.write !== undefined ? String(x.write) : String(x.sum).slice(-1));
  const carryD = sol.cols.map(x => x.carry ? '1' : '');
  const effTop = sol.cols.map(x => String(x.cap).split('\u2212')[0].trim());
  const colColor = ASCOLORS(op).active;

  // перестроенная (после заёма) верхняя цифра по позиции d; null — не меняется
  const regroupD = topD.map((ch, d) => {
    if (op !== '-') return null;
    const i = n - 1 - d;
    if (i < m) return (effTop[i] !== undefined && effTop[i] !== String(ch).trim()) ? effTop[i] : null;
    const num = Number(ch);
    return isNaN(num) ? null : String(num - 1);
  });
  const borrowPos = [];
  if (op === '-') for (let d = 0; d < n; d++) if (regroupD[d] !== null) borrowPos.push(d);

  const events = [];
  borrowPos.forEach(d => events.push({ t: 'b', d }));
  for (let i = 0; i < m; i++) events.push({ t: 'r', i });
  const total = events.length;

  const [step, setStep] = useState(0);
  useEffect(() => {
    if (step >= total) return;
    const id = setTimeout(() => setStep(s => s + 1), step === 0 ? 600 : 850);
    return () => clearTimeout(id);
  }, [step, total]);
  const replay = () => setStep(0);
  const autoDoneRef = useRef(false);
  useEffect(() => { if (step >= total && !autoDoneRef.current) { autoDoneRef.current = true; onDone && onDone(); } }, [step, total]);

  const done = events.slice(0, step);
  const borrowDone = new Set(done.filter(e => e.t === 'b').map(e => e.d));
  const resDone = new Set(done.filter(e => e.t === 'r').map(e => e.i));
  const lastEvent = step > 0 ? events[step - 1] : null;

  const numStyle = { fontFamily: MONO.fontFamily, fontWeight: 600, fontSize: 'clamp(16px, 3.8vw, 21px)', color: T.ink, textAlign: 'center', minWidth: '1.6em', display: 'inline-block' };
  const cells = [];
  for (let d = 0; d < n; d++) {
    const i = n - 1 - d;
    const gc = d + 2;
    const hasRes = i < m;
    const topRegrouped = op === '-' && regroupD[d] !== null && borrowDone.has(d);
    if (op === '+' && i >= 1 && i <= m - 1 && carryD[i - 1] && resDone.has(i - 1)) {
      cells.push(<div key={`c${i}`} style={{ gridColumn: gc, gridRow: 1, display: 'flex', justifyContent: 'center' }}><span className="cell-pop" style={{ fontFamily: MONO.fontFamily, fontSize: '0.62em', color: T.accent, fontWeight: 700 }}>{carryD[i - 1]}</span></div>);
    }
    if (topRegrouped) {
      cells.push(<div key={`e${d}`} className="cell-pop" style={{ gridColumn: gc, gridRow: 1, textAlign: 'center', fontFamily: MONO.fontFamily, fontSize: '0.62em', color: colColor, fontWeight: 700 }}>{regroupD[d]}</div>);
    }
    cells.push(<div key={`t${d}`} style={{ gridColumn: gc, gridRow: 2, ...numStyle, color: topRegrouped ? T.ink3 : T.ink, textDecoration: topRegrouped ? 'line-through' : 'none' }}>{topD[d] === ' ' ? '\u00A0' : topD[d]}</div>);
    cells.push(<div key={`b${d}`} style={{ gridColumn: gc, gridRow: 3, ...numStyle }}>{botD[d] === ' ' ? '\u00A0' : botD[d]}</div>);
    cells.push(<div key={`r${d}`} style={{ gridColumn: gc, gridRow: 5, display: 'flex', justifyContent: 'center' }}>{hasRes ? <DemoCell digit={resD[i]} revealed={resDone.has(i)} active={lastEvent && lastEvent.t === 'r' && lastEvent.i === i} color={colColor}/> : <span style={{ ...numStyle, color: T.ink3 }}>{'\u00A0'}</span>}</div>);
  }
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'center', overflowX: 'auto' }}>
        <div style={{ display: 'inline-grid', gridTemplateColumns: `auto repeat(${n}, auto)`, alignItems: 'center', columnGap: 'clamp(6px, 1.5vw, 10px)', rowGap: 4 }}>
          <div style={{ gridColumn: 1, gridRow: '2 / 4', alignSelf: 'center', justifySelf: 'center', ...numStyle, color: T.ink2 }}>{op === '-' ? '\u2212' : '+'}</div>
          <div style={{ gridColumn: `1 / ${n + 2}`, gridRow: 4, height: 2, background: T.ink, borderRadius: 1, margin: '4px 0' }}/>
          {cells}
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <button className="btn-ghost" onClick={replay} style={{ padding: 'clamp(6px, 1vw, 8px) clamp(12px, 1.8vw, 16px)', fontSize: 'clamp(11px, 1.3vw, 13px)' }}>{UI.replay[lang]}</button>
      </div>
    </div>
  );
};

// ============================================================
// LESSON: MC-экран "найди ответ".
// Верный выбор → тихая анимация столбика + короткая озвучка ответа.
// Неверный выбор → его выбор остаётся, верный не открывается сразу; снизу столбик
//   для счёта, попытки; после 3 неудач → «Решение» → разбор → «Далее».
// Чтобы решение влезало без скролла: после ответа вопрос ужимается в строку,
//   а варианты сворачиваются в компактные чипы (виден выбор и, когда уместно, верный).
// ============================================================
const QuestionScreenRetry = ({ idx, screen, totalScreens, storedAnswer, onAnswer, onNext, onPrev }) => {
  const c = CONTENT[`s${idx}`];
  const meta = SCREEN_META[idx];
  const t = useT();
  const lang = useLang();
  const opts = [c.opt0, c.opt1, c.opt2, c.opt3].filter(o => o !== undefined);
  const correctIdx = c.correctIndex;
  const sol = SOLUTIONS[idx];

  const audio = useAudio([{ id: `s${idx}_intro`, text: c.audio.intro[lang], trigger: 'on_mount', waits_for: { type: 'option_picked' } }]);

  const restored = storedAnswer !== undefined;
  const [picked, setPicked] = useState(restored ? storedAnswer.studentAnswerIndex : null);
  const [firstDone, setFirstDone] = useState(restored);
  const [resolved, setResolved] = useState(restored);
  const [navReady, setNavReady] = useState(restored);
  const isCorrect = picked === correctIdx;

  const pick = (i) => {
    if (firstDone) return;
    const ok = i === correctIdx;
    setPicked(i);
    setFirstDone(true);
    onAnswer({
      stage: meta.scope, screenIdx: idx,
      question: c.question ? c.question[lang] : null,
      options: opts.map(o => o[lang]),
      correctIndex: correctIdx,
      correctAnswer: opts[correctIdx] ? opts[correctIdx][lang] : null,
      studentAnswerIndex: i,
      studentAnswer: opts[i] ? opts[i][lang] : null,
      correct: ok
    });
    audio.triggerEvent('option_picked');
    if (ok) {
      setResolved(true);
      if (sol && ANSWER_VOICE[sol.result] && !audio.muted) {
        setTimeout(() => { const e = getAudioEngine(); if (e && !audio.muted) e.pushOneOff(ANSWER_VOICE[sol.result][lang]); }, 300);
      }
    }
  };

  const navContent = (
    <>
      <NavBack onPrev={onPrev} label={<BackLabel/>}/>
      <NavNext disabled={!navReady} onClick={onNext} label={<NextLabel/>}/>
    </>
  );

  return (
    <Stage eyebrow={c.eyebrow} screen={screen} totalScreens={totalScreens} navContent={navContent} audioState={audio}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: firstDone ? 'clamp(11px, 1.8vw, 15px)' : 'clamp(16px, 2.5vw, 22px)' }}>
        <div className="fade-up">
          <p className="eyebrow" style={{ color: T.accent }}>{t(c.label)}</p>
          {firstDone
            ? <p className="small" style={{ marginTop: 5, color: T.ink2 }}>{t(c.question)}</p>
            : <h2 className="title h-sub" style={{ marginTop: 8 }}>{t(c.question)}</h2>}
        </div>
        {!firstDone && c.hint && <div className="fade-up delay-1"><HintToggle hint={c.hint}/></div>}
        {!firstDone ? (
          <div className="fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {opts.map((opt, i) => (
              <button key={i} className="option" onClick={() => pick(i)}
                style={{ padding: 'clamp(12px, 1.7vw, 15px) clamp(14px, 2.1vw, 19px)', fontSize: 'clamp(13px, 1.6vw, 14px)', display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="mono small" style={{ minWidth: 20, color: T.ink3 }}>{String.fromCharCode(65 + i)}</span>
                <span style={{ flex: 1 }}>{t(opt)}</span>
              </button>
            ))}
          </div>
        ) : (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {opts.map((opt, i) => {
              const show = i === picked || (resolved && i === correctIdx);
              if (!show) return null;
              const isC = i === correctIdx;
              return (
                <span key={i} className="small" style={{ padding: '6px 12px', borderRadius: 8, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6, background: isC ? T.successSoft : T.accentSoft, color: isC ? T.success : T.accent }}>
                  <span className="mono">{String.fromCharCode(65 + i)}</span>
                  <span>{t(opt)}</span>
                </span>
              );
            })}
          </div>
        )}
        {firstDone && sol && isCorrect && (
          <div className="frame-success fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <span className="mono small" style={{ color: T.success, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{lang === 'uz' ? "To'g'ri" : 'Верно'}</span>
            <ColumnAutoAnim sol={sol} onDone={() => setNavReady(true)}/>
          </div>
        )}
        {firstDone && sol && !isCorrect && (
          <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <span className="mono small" style={{ color: T.ink2, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{lang === 'uz' ? 'Ustun shaklida hisoblang' : 'Посчитай в столбике'}</span>
            <ColumnSolver sol={sol} texts={{ correct: c.correct_text, reveal: c.correct_text }} onResolved={() => { setResolved(true); setNavReady(true); }}/>
          </div>
        )}
      </div>
    </Stage>
  );
};

// RuleScreen (infra, unused)
const RuleScreen = ({ idx, screen, totalScreens, onNext, onPrev, rules }) => {
  const c = CONTENT[`s${idx}`];
  const t = useT();
  const lang = useLang();
  const audio = useAudio([{ id: `s${idx}_a`, text: c.audio[lang], trigger: 'on_mount', waits_for: { type: 'button_click', target: 'next' } }]);
  const handleNext = () => { audio.triggerEvent('button_click', 'next'); onNext(); };
  const navContent = (<><NavBack onPrev={onPrev} label={<BackLabel/>}/><NavNext onClick={handleNext} label={<NextLabel/>}/></>);

  return (
    <Stage eyebrow={c.eyebrow} screen={screen} totalScreens={totalScreens} navContent={navContent} audioState={audio}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(18px, 2.5vw, 24px)' }}>
        <h2 className="title h-title fade-up">{t(c.title)}</h2>
        <div className="frame fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {rules.map((r, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '28px 1fr', gap: 12, alignItems: 'start' }}>
              <div className="mono small" style={{ color: T.accent, fontWeight: 600, paddingTop: 2 }}>{String(i + 1).padStart(2, '0')}</div>
              <div className="body" style={{ color: T.ink }}>{t(c[r])}</div>
            </div>
          ))}
          {c.term && (
            <div className="frame-soft" style={{ marginTop: 4 }}>
              <p className="body" style={{ margin: 0 }}>{t(c.term)}</p>
            </div>
          )}
          <div style={{ textAlign: 'center', marginTop: 4 }}>
            <span className="mono" style={{ fontSize: 'clamp(16px, 2.6vw, 20px)', color: T.ink }}>{t(c.example)}</span>
          </div>
        </div>
        <RefNote idx={idx}/>
      </div>
    </Stage>
  );
};

// NumInputScreen (infra, unused)
const NumInputScreen = ({ idx, screen, totalScreens, storedAnswer, onAnswer, onNext, onPrev }) => {
  const c = CONTENT[`s${idx}`];
  const t = useT();
  const lang = useLang();
  const meta = SCREEN_META[idx];
  const target = parseInt(c.correctValue, 10);
  const audio = useAudio([{ id: `s${idx}_intro`, text: c.audio.intro[lang], trigger: 'on_mount', waits_for: { type: 'check_pressed' } }]);

  const restored = storedAnswer !== undefined;
  const [value, setValue] = useState(storedAnswer?.studentAnswer ?? '');
  const [firstDone, setFirstDone] = useState(restored);
  const [firstCorrect, setFirstCorrect] = useState(restored ? !!storedAnswer.correct : false);
  const [solved, setSolved] = useState(restored ? !!storedAnswer.correct : false);
  const [gaveUp, setGaveUp] = useState(restored ? !storedAnswer.correct : false);

  const locked = solved || gaveUp;
  const showSolution = locked && !!SOLUTIONS[idx];

  const submit = () => {
    if (value === '' || locked) return;
    const ok = parseInt(value, 10) === target;
    // В счёт идёт только первая попытка. Дальше — повтор для понимания, без учёта.
    if (!firstDone) {
      setFirstDone(true);
      setFirstCorrect(ok);
      onAnswer({
        stage: meta.scope,
        screenIdx: idx,
        question: typeof c.question?.[lang] === 'string' ? c.question[lang] : null,
        options: null,
        correctIndex: null,
        correctAnswer: c.correctValue,
        studentAnswerIndex: null,
        studentAnswer: String(value),
        correct: ok
      });
    }
    setSolved(ok);
    audio.triggerEvent('check_pressed');
    if (!audio.muted) {
      const fbText = ok ? c.audio.on_correct[lang] : UI.wrongAudio[lang];
      setTimeout(() => {
        const engine = getAudioEngine();
        if (engine && !audio.muted) engine.pushOneOff(fbText);
      }, 300);
    }
  };

  const navContent = (<><NavBack onPrev={onPrev} label={<BackLabel/>}/><NavNext disabled={!firstDone} onClick={onNext} label={<NextLabel/>}/></>);

  const inputState = solved ? 'correct' : (firstDone ? 'wrong' : '');
  const banner = solved ? (lang === 'uz' ? "To'g'ri" : 'Верно') : (lang === 'uz' ? "Noto'g'ri" : 'Не совсем');
  const feedbackText = solved
    ? (firstCorrect ? t(c.fb_correct) : UI.retryOk[lang])
    : (gaveUp ? UI.gaveUp[lang] : UI.tryAgain[lang]);

  return (
    <Stage eyebrow={c.eyebrow} screen={screen} totalScreens={totalScreens} navContent={navContent} audioState={audio}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(18px, 2.5vw, 24px)' }}>
        <div className="fade-up">
          <p className="eyebrow" style={{ color: T.accent }}>{t(c.label)}</p>
          <h2 className="title h-sub" style={{ marginTop: 8 }}>{t(c.question)}</h2>
        </div>
        {!locked && EXTRA[idx]?.hint && <div className="fade-up delay-1"><HintToggle hint={EXTRA[idx].hint}/></div>}
        <div className="frame fade-up delay-1" style={{ display: 'flex', justifyContent: 'center' }}>
          <input type="number" inputMode="numeric"
            className={`answer-input ${inputState}`}
            value={value}
            placeholder={t(c.placeholder)}
            onChange={e => setValue(e.target.value)}
            disabled={locked}
            onKeyDown={e => e.key === 'Enter' && submit()}
            style={{ minWidth: 'min(70%, 240px)' }}/>
        </div>
        <div className="fade-up delay-2" style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          {firstDone && !locked && (
            <button className="btn-ghost" onClick={() => setGaveUp(true)}
              style={{ padding: 'clamp(10px, 1.7vw, 12px) clamp(16px, 2.1vw, 20px)', fontSize: 'clamp(12px, 1.5vw, 14px)' }}>
              {UI.showSolution[lang]}
            </button>
          )}
          <button className="btn-white-accent" disabled={!value || locked} onClick={submit}
            style={{ padding: 'clamp(10px, 1.7vw, 12px) clamp(20px, 2.5vw, 27px)', fontSize: 'clamp(12px, 1.5vw, 14px)' }}>
            <CheckLabel/>
          </button>
        </div>
        <FeedbackBlock show={firstDone} isCorrect={solved}>
          <p className="small mono" style={{ margin: 0, marginBottom: 8, fontWeight: 600, color: solved ? T.success : T.accent, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {banner}
          </p>
          <p className="body" style={{ margin: 0 }}>{feedbackText}</p>
        </FeedbackBlock>
        {showSolution && <SolutionPlayer sol={SOLUTIONS[idx]}/>}
      </div>
    </Stage>
  );
};

// ============================================================
// CONTENT — урок nat_5_03 (Сложение и вычитание столбиком), 5 класс
// Сюжет: классный марафон чтения, цель 1000 страниц.
// Сложение (s0–s4) → вычитание (s5–s8) → кейс/финал (s9–s12) → итог (s13).
// UZ — DRAFT, требует валидации узбекским методистом.
//   Особо: 'qarz olish' (заём), 'ko'chirish' (перенос), 'ustun shaklida' (столбиком).
// Числа в визуале — цифрами; в аудио — словами (audio_rules).
// MC-экраны s4,s8,s10,s11 — модель retry_with_hint: на первый неверный
//   показываем c.hint (наводка без раскрытия), затем повтор; полный разбор
//   (wrong_N + correct_text + решение) — после верного/сдачи.
// ============================================================

const LESSON_META = {
  lessonId: 'nat-5-03-v1',
  lessonTitle: {
    ru: 'Сложение и вычитание столбиком',
    uz: "Ustun shaklida qo'shish va ayirish"
  },
  globalQuestion: {
    ru: 'Куда пропадают разряды?',
    uz: "Xonalar qayerga yo'qoladi?",
    posed_on: 's0',
    answered_on: 's13'
  }
};

const CONTENT = {

  // ===== s0 — HOOK: Бекзод теряет перенос =====
  s0: {
    eyebrow: { ru: 'Вопрос урока', uz: 'Dars savoli' },
    global_q: { ru: 'Куда пропадают разряды?', uz: "Xonalar qayerga yo'qoladi?" },
    claim_lead: {
      ru: 'В классе идёт марафон чтения. За первую неделю Бекзод прочитал 168 страниц, за вторую — 257. Он быстро сложил столбиком и говорит:',
      uz: "Sinfda kitobxonlik marafoni ketyapti. Birinchi haftada Bekzod 168 bet, ikkinchisida 257 bet o'qidi. U tez ustun shaklida qo'shib, shunday deydi:"
    },
    claim_em: { ru: 'Всего 315 страниц.', uz: 'Jami 315 bet.' },
    question: { ru: 'Бекзод прав?', uz: 'Bekzod haqmi?' },
    opt_yes: { ru: 'Бекзод прав', uz: 'Bekzod haq' },
    opt_no: { ru: 'Бекзод ошибается', uz: 'Bekzod xato qilyapti' },
    opt_idk: { ru: 'Не уверен', uz: 'Ishonchim komil emas' },
    correctIndex: null,
    audio: {
      intro: { ru: 'В классе идёт марафон чтения. За первую неделю Бекзод прочитал сто шестьдесят восемь страниц, за вторую двести пятьдесят семь. Он быстро сложил в столбик и говорит, что вышло триста пятнадцать. Как думаешь, прав ли он?', uz: "Sinfda kitobxonlik marafoni ketyapti. Bekzod birinchi haftada bir yuz oltmish sakkiz bet, ikkinchi haftada ikki yuz ellik yetti bet o'qidi. U tez ustun shaklida qo'shib, uch yuz o'n besh chiqdi deydi. Sizningcha, u haqmi?" },
      on_correct: { ru: 'Сейчас проверим вместе.', uz: "Hozir birga tekshiramiz." },
      on_wrong: { ru: 'Сейчас проверим вместе.', uz: "Hozir birga tekshiramiz." }
    }
  },

  // ===== s1 — EXPLORATION: сложение с переносом (168 + 257 = 425) =====
  s1: {
    eyebrow: { ru: 'Разберём', uz: "Ko'rib chiqamiz" },
    title: { ru: 'Почему нельзя терять перенос', uz: "Nega ko'chirishni yo'qotmaslik kerak" },
    intro: {
      ru: 'Складываем по разрядам справа налево. Когда в разряде получается 10 или больше, единицу переносим в следующий разряд.',
      uz: "Xonalar bo'yicha o'ngdan chapga qo'shamiz. Xonada 10 yoki undan ko'p chiqsa, birni keyingi xonaga ko'chiramiz."
    },
    step1_label: { ru: 'Единицы', uz: 'Birlar' },
    step1_text: { ru: '8 + 7 = 15. Пишем 5, единицу держим в уме.', uz: '8 + 7 = 15. 5 ni yozamiz, birni dilda saqlaymiz.' },
    step2_label: { ru: 'Десятки', uz: "O'nlar" },
    step2_text: { ru: '6 + 5 = 11, плюс 1 из ума — 12. Пишем 2, снова 1 в уме.', uz: "6 + 5 = 11, dildagi 1 bilan — 12. 2 ni yozamiz, yana 1 dilda." },
    step3_label: { ru: 'Сотни', uz: 'Yuzlar' },
    step3_text: { ru: '1 + 2 = 3, плюс 1 из ума — 4. Итог 425. Бекзод потерял оба переноса и получил 315.', uz: "1 + 2 = 3, dildagi 1 bilan — 4. Natija 425. Bekzod ikkala ko'chirishni yo'qotib, 315 oldi." },
    btn_step: { ru: 'Дальше', uz: 'Davom etish' },
    audio: {
      ru: [
        'Давай проверим вместе, прав ли Бекзод. Складываем по разрядам, справа налево. В единицах восемь и семь дают пятнадцать. Число двузначное, поэтому пять пишем здесь, а один десяток держим в уме и перекинем в следующий разряд.',
        'Теперь десятки. Шесть и пять это одиннадцать, и не забудем тот один из ума, выходит двенадцать. Снова двузначное, значит два пишем, а один опять держим в уме.',
        'Остались сотни. Один и два это три, и ещё один из ума, итого четыре. Получается четыреста двадцать пять. А Бекзод потерял оба переноса и получил всего триста пятнадцать, вот куда делись разряды.'
      ],
      uz: [
        "Keling, Bekzod haq yoki yo'qligini birga tekshiramiz. Xonama-xona, o'ngdan chapga qo'shamiz. Birlarda sakkiz va yetti o'n besh beradi. Bu ikki xonali son, shuning uchun beshni yozamiz, bir o'nlikni keyingi xonaga ko'chiramiz.",
        "Endi o'nlar. Olti va besh o'n bir, ko'chirilgan birni qo'shsak, o'n ikki. Yana ikki xonali, demak ikkini yozamiz, bir o'nlikni yana ko'chiramiz.",
        "Yuzlar qoldi. Bir va ikki uch, ko'chirilgan bir bilan to'rt. To'rt yuz yigirma besh chiqadi. Bekzod ikkala ko'chirishni yo'qotgan, shuning uchun atigi uch yuz o'n besh olgan."
      ]
    }
  },

  // ===== s2 — RULE: сложение столбиком =====
  s2: {
    eyebrow: { ru: 'Правило', uz: 'Qoida' },
    title: { ru: 'Сложение столбиком', uz: "Ustun shaklida qo'shish" },
    rule_1: { ru: 'Записываем числа разряд под разрядом, выравнивая справа.', uz: "Sonlarni xonama-xona, o'ng tomondan tekislab yozamiz." },
    rule_2: { ru: 'Складываем справа налево. Если в разряде вышло 10 или больше — единицу переносим в следующий разряд.', uz: "O'ngdan chapga qo'shamiz. Xonada 10 yoki undan ko'p chiqsa — birni keyingi xonaga ko'chiramiz." },
    term: { ru: 'Перенос — это единица, которая уходит в следующий разряд, когда сумма разряда достигает десяти.', uz: "Ko'chirish — bu xona yig'indisi o'nga yetganda keyingi xonaga o'tadigan birlik." },
    example: { ru: '168 + 257 = 425', uz: '168 + 257 = 425' },
    ref: { ru: 'Разряды и классы — из уроков о многозначных числах (nat_5_01).', uz: "Xonalar va sinflar — ko'p xonali sonlar darslaridan (nat_5_01)." },
    audio: {
      ru: 'Закрепим то, что увидели. Числа пишем разряд под разрядом и складываем справа налево. Если в разряде вышло десять или больше, одну единицу держим в уме и перекидываем в следующий разряд. Это и есть перенос. Так сто шестьдесят восемь плюс двести пятьдесят семь дают четыреста двадцать пять.',
      uz: "Ko'rganimizni mustahkamlaymiz. Sonlarni xonama-xona yozamiz va o'ngdan chapga qo'shamiz. Agar xonada o'n yoki undan ko'p chiqsa, bir birlikni dilda saqlab keyingi xonaga ko'chiramiz. Bu ko'chirish. Shunday qilib bir yuz oltmish sakkizga ikki yuz ellik yettini qo'shsak, to'rt yuz yigirma besh chiqadi."
    }
  },

  // ===== s3 — TEST input: сложение (276 + 185 = 461), ввод #1 =====
  s3: {
    eyebrow: { ru: 'Тренировка · 1 из 2', uz: 'Mashq · 2 dan 1' },
    label: { ru: 'Сложи сам', uz: "O'zingiz qo'shing" },
    question: { ru: 'Мадина прочитала 276 страниц за первую неделю и 185 за вторую. Сколько всего? 276 + 185.', uz: "Madina birinchi haftada 276 bet, ikkinchisida 185 bet o'qidi. Hammasi bo'lib qancha? 276 + 185." },
    placeholder: { ru: '0', uz: '0' },
    correctValue: '461',
    hint: { ru: 'Складывай справа налево. В единицах и в десятках будет перенос — не теряй его.', uz: "O'ngdan chapga qo'shing. Birlarda ham, o'nlarda ham ko'chirish bo'ladi — uni yo'qotmang." },
    fb_correct: { ru: 'Правильно. 6 + 5 = 11 и 7 + 8 + 1 = 16 — два переноса, в сумме 461.', uz: "To'g'ri. 6 + 5 = 11 va 7 + 8 + 1 = 16 — ikkita ko'chirish, yig'indida 461." },
    fb_wrong: { ru: 'Верный ответ — 461. В единицах 6 + 5 = 11, в десятках 7 + 8 = 15 плюс перенос — оба переноса нужно учесть.', uz: "To'g'ri javob — 461. Birlarda 6 + 5 = 11, o'nlarda 7 + 8 = 15 va ko'chirish — ikkala ko'chirishni hisobga olish kerak." },
    audio: {
      intro: { ru: 'Теперь твоя очередь. Сложи эти числа в столбик сам. Помни про правило, и если в разряде набралось десять, не теряй перенос.', uz: "Endi sizning navbatingiz. Bu sonlarni o'zingiz ustun shaklida qo'shing. Qoidani unutmang, agar xonada o'n yig'ilsa, ko'chirishni yo'qotmang." },
      on_correct: { ru: 'Верно. Перенос ты не потерял, всё сошлось.', uz: "To'g'ri. Ko'chirishni yo'qotmadingiz, hammasi mos keldi." },
      on_wrong: { ru: 'Пока не сходится. Проверь каждый разряд и не забудь про тот один, что держим в уме.', uz: "Hali mos emas. Har bir xonani tekshiring va dildagi birni unutmang." }
    }
  },

  // ===== s4 — TEST choice (retry_with_hint): сложение 285 + 47 =====
  s4: {
    eyebrow: { ru: 'Тренировка · 2 из 2', uz: 'Mashq · 2 dan 2' },
    label: { ru: 'Найди верную сумму', uz: "To'g'ri yig'indini toping" },
    question: { ru: 'Сколько будет 285 + 47?', uz: '285 + 47 nechaga teng?' },
    opt0: { ru: '222', uz: '222' },
    opt1: { ru: '332', uz: '332' },
    opt2: { ru: '755', uz: '755' },
    opt3: { ru: '322', uz: '322' },
    correctIndex: 1,
    hint: { ru: '47 — это десятки и единицы. Подпиши его под 285 справа, по разрядам. Следи за переносом.', uz: "47 — bu o'nlar va birlar. Uni 285 ostiga o'ngdan, xonalar bo'yicha yozing. Ko'chirishga e'tibor bering." },
    correct_text: { ru: 'Правильно. 5 + 7 = 12 и 8 + 4 + 1 = 13 — два переноса, в сумме 332.', uz: "To'g'ri. 5 + 7 = 12 va 8 + 4 + 1 = 13 — ikkita ko'chirish, yig'indida 332." },
    wrong_0: { ru: 'Оба переноса потеряны. 5 + 7 = 12 — единицу переносим в десятки; 8 + 4 = 12 — единицу в сотни. Верно 332.', uz: "Ikkala ko'chirish yo'qolgan. 5 + 7 = 12 — birni o'nlarga ko'chiramiz; 8 + 4 = 12 — birni yuzlarga. To'g'risi 332." },
    wrong_2: { ru: 'Разряды не выровнены. 47 — это сорок семь, а не четыреста семьдесят; единицы под единицами, десятки под десятками. Верно 332.', uz: "Xonalar tekislanmagan. 47 — bu qirq yetti, to'rt yuz yetmish emas; birlar birlar ostida, o'nlar o'nlar ostida. To'g'risi 332." },
    wrong_3: { ru: 'Один перенос потерян. В десятках 8 + 4 = 12 — единицу нужно перенести в сотни. Верно 332.', uz: "Bitta ko'chirish yo'qolgan. O'nlarda 8 + 4 = 12 — birni yuzlarga ko'chirish kerak. To'g'risi 332." },
    wrong_default: { ru: 'Складывай справа налево по разрядам и не теряй перенос. Верно 332.', uz: "Xonalar bo'yicha o'ngdan chapga qo'shing va ko'chirishni yo'qotmang. To'g'risi 332." },
    audio: {
      intro: { ru: 'А здесь выбери верный ответ. Если сомневаешься, всегда можно сложить в столбик и проверить себя.', uz: "Bu yerda esa to'g'ri javobni tanlang. Agar shubhalansangiz, ustun shaklida qo'shib o'zingizni tekshirsangiz bo'ladi." },
      on_correct: { ru: 'Верно.', uz: "To'g'ri." },
      on_wrong: { ru: 'Давай разберёмся вместе. Сложи разряды справа налево и впиши результат, перенос не теряй.', uz: "Keling, birga ko'rib chiqamiz. Xonalarni o'ngdan chapga qo'shing va natijani yozing, ko'chirishni yo'qotmang." }
    }
  },

  // ===== s14 — ПРОВЕРКА ЗНАНИЙ: сложение (367 + 458 = 825) =====
  s14: {
    eyebrow: { ru: 'Проверка знаний', uz: 'Bilim tekshiruvi' },
    label: { ru: 'Проверь себя', uz: "O'zingizni tekshiring" },
    question: { ru: 'Зайнаб прочитала 367 страниц, а Алишер 458. Сколько страниц всего? 367 + 458.', uz: "Zaynab 367 bet, Alisher esa 458 bet o'qidi. Hammasi bo'lib necha bet? 367 + 458." },
    placeholder: { ru: '0', uz: '0' },
    correctValue: '825',
    hint: { ru: 'Складывай справа налево. В единицах и в десятках будет перенос, держи его в уме.', uz: "O'ngdan chapga qo'shing. Birlarda ham, o'nlarda ham ko'chirish bo'ladi, uni dilda saqlang." },
    fb_correct: { ru: 'Верно. 7 + 8 = 15 и 6 + 5 + 1 = 12 — два переноса, в сумме 825.', uz: "To'g'ri. 7 + 8 = 15 va 6 + 5 + 1 = 12 — ikkita ko'chirish, yig'indida 825." },
    fb_wrong: { ru: 'Верный ответ 825. В единицах 7 + 8 = 15, в десятках 6 + 5 = 11 плюс перенос — оба переноса нужно учесть.', uz: "To'g'ri javob 825. Birlarda 7 + 8 = 15, o'nlarda 6 + 5 = 11 va ko'chirish — ikkala ko'chirishni hisobga oling." },
    audio: {
      intro: { ru: 'А теперь проверь себя. Сложи эти числа в столбик сам и убедись, что оба переноса на месте.', uz: "Endi o'zingizni tekshiring. Bu sonlarni o'zingiz ustun shaklida qo'shing va ikkala ko'chirish ham joyida ekanini tekshiring." },
      on_correct: { ru: 'Верно. Оба переноса учтены.', uz: "To'g'ri. Ikkala ko'chirish ham hisobga olindi." },
      on_wrong: { ru: 'Пока не сходится. Проверь каждый разряд и не забудь про единицу в уме.', uz: "Hali mos emas. Har bir xonani tekshiring va dildagi birni unutmang." }
    }
  },

  // ===== s5 — EXPLORATION: вычитание через нули (1000 − 645 = 355) =====
  s5: {
    eyebrow: { ru: 'Разберём', uz: "Ko'rib chiqamiz" },
    title: { ru: 'Что такое заём', uz: 'Qarz olish nima' },
    intro: {
      ru: 'До цели 1000 страниц, прочитано 645. В разряде единиц ноль — вычесть 5 нельзя. Занимаем у старшего разряда.',
      uz: "Maqsadgacha 1000 bet, 645 ta o'qildi. Birlar xonasida nol — beshni ayirib bo'lmaydi. Yuqori xonadan qarz olamiz."
    },
    step1_label: { ru: 'Разбиваем по цепочке', uz: "Zanjir bo'ylab almashtiramiz" },
    step1_text: { ru: '1 тысяча = 10 сотен, 1 сотня = 10 десятков, 1 десяток = 10 единиц. Тысяча становится 0, сотни и десятки — по 9, у единиц — 10.', uz: "1 ming = 10 yuzlik, 1 yuzlik = 10 o'nlik, 1 o'nlik = 10 birlik. Ming 0 bo'ladi, yuzlar va o'nlar — 9 dan, birlarda — 10." },
    step2_label: { ru: 'Вычитаем по разрядам', uz: 'Xonalar bo\'yicha ayiramiz' },
    step2_text: { ru: '10 − 5 = 5, 9 − 4 = 5, 9 − 6 = 3.', uz: '10 − 5 = 5, 9 − 4 = 5, 9 − 6 = 3.' },
    step3_label: { ru: 'Итог', uz: 'Natija' },
    step3_text: { ru: 'Осталось 355 страниц. Заём прокатился через нули — каждый ноль стал девяткой.', uz: "355 bet qoldi. Qarz nollar orqali o'tdi — har bir nol to'qqizga aylandi." },
    btn_step: { ru: 'Дальше', uz: 'Davom etish' },
    audio: {
      ru: [
        'Со сложением разобрались. Теперь вычитание, и здесь сложнее. Вычитаем тоже справа налево. В единицах ноль, а пять вычесть нельзя, значит надо занять у старшего разряда. Нули по цепочке становятся девятками, а у единиц появляется десять. Это называют занять.',
        'Смотрим на единицы. Из десяти вычитаем пять, остаётся пять. Пишем пять.',
        'Переходим к десяткам. Девять минус четыре это пять. Снова пишем пять.',
        'И наконец сотни. Девять минус шесть это три. Получается триста пятьдесят пять страниц, и ни один разряд не потерялся.'
      ],
      uz: [
        "Qo'shishni tushundik. Endi ayirish, bu yerda qiyinroq. Ayirishni ham o'ngdan chapga bajaramiz. Birlarda nol, beshni ayirib bo'lmaydi, demak yuqori xonadan qarz olishimiz kerak. Nollar zanjir bo'ylab to'qqizga aylanadi, birlarda esa o'n hosil bo'ladi. Buni qarz olish deymiz.",
        "Birlarga qaraymiz. O'ndan beshni ayiramiz, besh qoladi. Beshni yozamiz.",
        "O'nlarga o'tamiz. To'qqizdan to'rtni ayirsak, besh. Yana beshni yozamiz.",
        "Va nihoyat yuzlar. To'qqizdan oltini ayirsak, uch. Uch yuz ellik besh bet chiqadi, birorta xona yo'qolmadi."
      ]
    }
  },

  // ===== s6 — RULE: вычитание столбиком и заём через нули =====
  s6: {
    eyebrow: { ru: 'Правило', uz: 'Qoida' },
    title: { ru: 'Вычитание столбиком', uz: 'Ustun shaklida ayirish' },
    rule_1: { ru: 'Записываем разряд под разрядом, вычитаем справа налево.', uz: "Xonama-xona yozamiz, o'ngdan chapga ayiramiz." },
    rule_2: { ru: 'Если верхней цифры не хватает — берём 1 единицу старшего разряда и разбиваем её на 10 единиц текущего. Это и есть занять.', uz: "Yuqoridagi raqam yetmasa — yuqori xonadan 1 birlik olib, uni shu xonaning 10 birligi qilib olamiz. Bu qarz olish." },
    rule_3: { ru: 'Если у соседа ноль, разбиваем дальше по цепочке: нули по пути становятся девятками.', uz: "Qo'shnida nol bo'lsa, zanjir bo'ylab davom etamiz: yo'ldagi nollar to'qqizga aylanadi." },
    term: { ru: 'Заём — взять 1 единицу старшего разряда и заменить её на 10 единиц младшего, когда своей цифры не хватает.', uz: "Qarz olish — o'z raqami yetmaganda yuqori xonadan 1 birlik olib, uni 10 ta kichik birlik bilan almashtirish." },
    example: { ru: '1000 − 645 = 355', uz: '1000 − 645 = 355' },
    audio: {
      ru: 'Закрепим и вычитание. Вычитаем справа налево. Если верхней цифры не хватает, занимаем у старшего разряда единицу как десять единиц текущего. Это занять. Если у соседа ноль, занимаем дальше, нули по пути становятся девятками. Так тысяча минус шестьсот сорок пять дают триста пятьдесят пять.',
      uz: "Ayirishni ham mustahkamlaymiz. O'ngdan chapga ayiramiz. Yuqoridagi raqam yetmasa, yuqori xonadan bir birlik olib, uni shu xonaning o'n birligi qilamiz. Bu qarz olish. Qo'shnida nol bo'lsa, zanjir bo'ylab davom etamiz, nollar to'qqizga aylanadi. Shunday qilib mingdan olti yuz qirq beshni ayirsak, uch yuz ellik besh chiqadi."
    }
  },

  // ===== s7 — TEST input: вычитание через нули (1000 − 396 = 604), ввод #2 =====
  s7: {
    eyebrow: { ru: 'Тренировка · 1 из 2', uz: 'Mashq · 2 dan 1' },
    label: { ru: 'Посчитай сам', uz: "O'zingiz hisoblang" },
    question: { ru: 'До цели 1000 страниц прочитано 396. Сколько осталось? 1000 − 396.', uz: "1000 betlik maqsadgacha 396 ta o'qildi. Qancha qoldi? 1000 − 396." },
    placeholder: { ru: '0', uz: '0' },
    correctValue: '604',
    hint: { ru: 'Занимай у тысячи: нули по пути станут девятками. В ответе есть нулевой разряд — не теряй его.', uz: "Mingdan qarz oling: yo'ldagi nollar to'qqizga aylanadi. Javobda nol xonasi bor — uni yo'qotmang." },
    fb_correct: { ru: 'Правильно. 10 − 6 = 4, 9 − 9 = 0, 9 − 3 = 6 — осталось 604.', uz: "To'g'ri. 10 − 6 = 4, 9 − 9 = 0, 9 − 3 = 6 — 604 qoldi." },
    fb_wrong: { ru: 'Верный ответ — 604. Заём от тысячи прокатывается через нули: 10 − 6 = 4, 9 − 9 = 0, 9 − 3 = 6. Нулевой разряд в ответе не теряем.', uz: "To'g'ri javob — 604. Mingdan qarz nollar orqali o'tadi: 10 − 6 = 4, 9 − 9 = 0, 9 − 3 = 6. Javobdagi nol xonasini yo'qotmaymiz." },
    audio: {
      intro: { ru: 'Снова твоя очередь, теперь вычитание. Вычти в столбик. Здесь сверху нули, так что вспомни, как занимать по цепочке.', uz: "Yana sizning navbatingiz, endi ayirish. Ustun shaklida ayiring. Bu yerda yuqorida nollar bor, shuning uchun zanjir bo'ylab qarz olishni eslang." },
      on_correct: { ru: 'Верно. Заём прошёл через нули, и ответ сошёлся.', uz: "To'g'ri. Qarz nollar orqali o'tdi va javob mos keldi." },
      on_wrong: { ru: 'Пока не то. Помни, что при заёме нули превращаются в девятки, проверь ещё раз.', uz: "Hali emas. Qarz olganda nollar to'qqizga aylanishini eslang va yana tekshiring." }
    }
  },

  // ===== s8 — TEST choice (retry_with_hint): вычитание 506 − 198 = 308 =====
  s8: {
    eyebrow: { ru: 'Тренировка · 2 из 2', uz: 'Mashq · 2 dan 2' },
    label: { ru: 'Найди верную разность', uz: "To'g'ri ayirmani toping" },
    question: { ru: 'Сколько будет 506 − 198?', uz: '506 − 198 nechaga teng?' },
    opt0: { ru: '492', uz: '492' },
    opt1: { ru: '308', uz: '308' },
    opt2: { ru: '318', uz: '318' },
    opt3: { ru: '408', uz: '408' },
    correctIndex: 1,
    hint: { ru: 'В единицах 6 меньше 8 — занимай. В десятках стоит 0, заём идёт у сотен; после отдачи 0 становится 9.', uz: "Birlarda 6 kichik 8 dan — qarz oling. O'nlarda 0 turibdi, qarz yuzlardan keladi; bergach 0 to'qqizga aylanadi." },
    correct_text: { ru: 'Правильно. 16 − 8 = 8, 9 − 9 = 0, 4 − 1 = 3 — разность 308.', uz: "To'g'ri. 16 − 8 = 8, 9 − 9 = 0, 4 − 1 = 3 — ayirma 308." },
    wrong_0: { ru: 'Из меньшей цифры нельзя вычитать большую как угодно. 5 − 1, 0 − 9, 6 − 8 — где не хватает, занимаем у соседа, а не меняем местами. Верно 308.', uz: "Kichik raqamdan kattasini xohlagancha ayirib bo'lmaydi. 5 − 1, 0 − 9, 6 − 8 — yetmagan joyda qo'shnidan qarz olamiz, o'rin almashtirmaymiz. To'g'risi 308." },
    wrong_2: { ru: 'Разряд десятков отдал единицу единицам, поэтому он стал 9, а не 10. 9 − 9 = 0. Верно 308.', uz: "O'nlar xonasi birlarga birlik berdi, shuning uchun u 10 emas, 9 bo'ldi. 9 − 9 = 0. To'g'risi 308." },
    wrong_3: { ru: 'Заём сделан только для единиц, а нулевой разряд десятков оставлен без изменения. Заём должен пройти через ноль. Верно 308.', uz: "Qarz faqat birlar uchun olingan, o'nlardagi nol xona o'zgarishsiz qolgan. Qarz nol orqali o'tishi kerak. To'g'risi 308." },
    wrong_default: { ru: 'Вычитай справа налево, при нехватке занимай у соседа, проводи заём через нули. Верно 308.', uz: "O'ngdan chapga ayiring, yetmasa qo'shnidan qarz oling, qarzni nollar orqali o'tkazing. To'g'risi 308." },
    audio: {
      intro: { ru: 'Выбери ответ. Если не уверен, реши в столбик и помни про заём, особенно там, где сверху ноль.', uz: "Javobni tanlang. Ishonchingiz komil bo'lmasa, ustun shaklida yeching va qarz olishni eslang, ayniqsa yuqorida nol bo'lgan joyda." },
      on_correct: { ru: 'Верно.', uz: "To'g'ri." },
      on_wrong: { ru: 'Давай вместе. Вычитай разряды справа налево и не забудь про заём там, где не хватает.', uz: "Keling, birga. Xonalarni o'ngdan chapga ayiring va yetmagan joyda qarz olishni unutmang." }
    }
  },

  // ===== s9 — CASE setup: финишная неделя марафона =====
  s9: {
    eyebrow: { ru: 'Задача · марафон класса', uz: 'Masala · sinf marafoni' },
    title: { ru: 'Финишная неделя', uz: 'Final haftasi' },
    intro: {
      ru: 'Класс 5-А идёт к цели 1000 страниц. За прошлые недели собрали 428 страниц, на финишной неделе — ещё 267. Сосед, класс 5-Б, собрал 458 страниц. Поможем 5-А разобраться с итогами.',
      uz: "5-A sinf 1000 betlik maqsad sari ketyapti. O'tgan haftalarda 428 bet, final haftasida — yana 267 bet to'plandi. Qo'shni 5-B sinf 458 bet to'pladi. 5-A ga yakunlarni hisoblashda yordam beramiz."
    },
    fact_1: { ru: 'Прошлые недели — 428 страниц', uz: "O'tgan haftalar — 428 bet" },
    fact_2: { ru: 'Финишная неделя — 267 страниц', uz: 'Final haftasi — 267 bet' },
    cta: { ru: 'Помочь классу', uz: 'Sinfga yordam berish' },
    ref: { ru: 'Цель марафона — 1000 страниц. Сосед, 5-Б, — 458 страниц.', uz: "Marafon maqsadi — 1000 bet. Qo'shni 5-B — 458 bet." },
    audio: {
      ru: 'А теперь применим всё к настоящей задаче. Класс пять А идёт к цели в тысячу страниц. За прошлые недели собрали четыреста двадцать восемь, на финишной неделе ещё двести шестьдесят семь. Соседний класс пять Б собрал четыреста пятьдесят восемь. Поможем посчитать итоги.',
      uz: "Endi hammasini haqiqiy masalaga qo'llaymiz. Besh A sinf ming betlik maqsad sari ketyapti. O'tgan haftalarda to'rt yuz yigirma sakkiz, yakuniy haftada yana ikki yuz oltmish yetti bet yig'ildi. Qo'shni besh B sinf to'rt yuz ellik sakkiz bet to'pladi. Natijalarni sanashga yordam beramiz."
    }
  },

  // ===== s10 — CASE step (retry_with_hint): сложение 428 + 267 = 695 =====
  s10: {
    eyebrow: { ru: 'Задача · марафон класса', uz: 'Masala · sinf marafoni' },
    label: { ru: 'Сколько собрал 5-А', uz: '5-A qancha to\'pladi' },
    question: { ru: 'Сколько страниц всего у 5-А? 428 + 267.', uz: "5-A da hammasi bo'lib nechta bet? 428 + 267." },
    opt0: { ru: '685', uz: '685' },
    opt1: { ru: '695', uz: '695' },
    opt2: { ru: '785', uz: '785' },
    correctIndex: 1,
    hint: { ru: 'Складывай справа налево. В единицах 8 + 7 = 15 — будет перенос в десятки.', uz: "O'ngdan chapga qo'shing. Birlarda 8 + 7 = 15 — o'nlarga ko'chirish bo'ladi." },
    correct_text: { ru: 'Правильно. 8 + 7 = 15 — переносим 1; 2 + 6 + 1 = 9; 4 + 2 = 6. Всего 695.', uz: "To'g'ri. 8 + 7 = 15 — 1 ni ko'chiramiz; 2 + 6 + 1 = 9; 4 + 2 = 6. Jami 695." },
    wrong_0: { ru: 'Перенос из единиц потерян. 8 + 7 = 15 — единицу нужно добавить в десятки. Верно 695.', uz: "Birlardan ko'chirish yo'qolgan. 8 + 7 = 15 — birni o'nlarga qo'shish kerak. To'g'risi 695." },
    wrong_2: { ru: 'Перенос ушёл не в тот разряд. Единицу из 8 + 7 = 15 добавляем в десятки, а не в сотни. Верно 695.', uz: "Ko'chirish noto'g'ri xonaga ketgan. 8 + 7 = 15 dagi birni o'nlarga qo'shamiz, yuzlarga emas. To'g'risi 695." },
    wrong_default: { ru: 'Складывай по разрядам и добавляй перенос в следующий разряд. Верно 695.', uz: "Xonalar bo'yicha qo'shing va ko'chirishni keyingi xonaga qo'shing. To'g'risi 695." },
    audio: {
      intro: { ru: 'Сначала сложим, сколько страниц собрал класс пять А за все недели. Выбери верную сумму, а если надо, посчитай в столбик.', uz: "Avval besh A sinf barcha haftalarda nechta bet to'plaganini qo'shamiz. To'g'ri yig'indini tanlang, kerak bo'lsa, ustun shaklida sanang." },
      on_correct: { ru: 'Верно.', uz: "To'g'ri." },
      on_wrong: { ru: 'Давай посчитаем. Сложи четыреста двадцать восемь и двести шестьдесят семь столбиком, перенос не теряй.', uz: "Keling, sanaymiz. To'rt yuz yigirma sakkizga ikki yuz oltmish yettini ustun shaklida qo'shing, ko'chirishni yo'qotmang." }
    }
  },

  // ===== s11 — FINAL test choice (retry_with_hint): вычитание 1000 − 695 = 305 =====
  s11: {
    eyebrow: { ru: 'Итог · 1 из 2', uz: 'Yakun · 2 dan 1' },
    label: { ru: 'Сколько осталось до цели', uz: 'Maqsadgacha qancha qoldi' },
    question: { ru: 'У 5-А 695 страниц, цель — 1000. Сколько осталось? 1000 − 695.', uz: "5-A da 695 bet, maqsad — 1000. Qancha qoldi? 1000 − 695." },
    opt0: { ru: '415', uz: '415' },
    opt1: { ru: '315', uz: '315' },
    opt2: { ru: '305', uz: '305' },
    correctIndex: 2,
    hint: { ru: 'Занимай у тысячи. Нули по цепочке становятся девятками; разряд, который отдал единицу, уже не 10, а 9.', uz: "Mingdan qarz oling. Nollar zanjir bo'ylab to'qqizga aylanadi; birlik bergan xona endi 10 emas, 9." },
    correct_text: { ru: 'Правильно. 10 − 5 = 5, 9 − 9 = 0, 9 − 6 = 3 — осталось 305.', uz: "To'g'ri. 10 − 5 = 5, 9 − 9 = 0, 9 − 6 = 3 — 305 qoldi." },
    wrong_0: { ru: 'Каждый ноль принят за 10 по отдельности. Заём общий: он проходит по цепочке, и средние нули становятся девятками. Верно 305.', uz: "Har bir nol alohida 10 deb olingan. Qarz umumiy: u zanjir bo'ylab o'tadi, o'rtadagi nollar to'qqizga aylanadi. To'g'risi 305." },
    wrong_1: { ru: 'Разряд десятков отдал единицу, поэтому он 9, а не 10. 9 − 9 = 0, а не 1. Верно 305.', uz: "O'nlar xonasi birlik berdi, shuning uchun u 9, 10 emas. 9 − 9 = 0, 1 emas. To'g'risi 305." },
    wrong_default: { ru: 'Заём от тысячи проходит через нули цепочкой. Верно 305.', uz: "Mingdan qarz nollar orqali zanjir bo'lib o'tadi. To'g'risi 305." },
    audio: {
      intro: { ru: 'Теперь узнаем, сколько страниц осталось классу до цели. От тысячи отними то, что уже собрано. Это снова вычитание через нули.', uz: "Endi sinfga maqsadgacha nechta bet qolganini bilamiz. Mingdan to'plangan betlarni ayiring. Bu yana nollar orqali ayirish." },
      on_correct: { ru: 'Верно.', uz: "To'g'ri." },
      on_wrong: { ru: 'Давай разберёмся. Из тысячи вычитай столбиком, нули по цепочке станут девятками, помни про заём.', uz: "Keling, ko'rib chiqamiz. Mingdan ustun shaklida ayiring, nollar zanjir bo'ylab to'qqizga aylanadi, qarz olishni eslang." }
    }
  },

  // ===== s12 — FINAL test input: вычитание 695 − 458 = 237, ввод #3 =====
  s12: {
    eyebrow: { ru: 'Итог · 2 из 2', uz: 'Yakun · 2 dan 2' },
    label: { ru: 'Посчитай и введи', uz: 'Hisoblang va kiriting' },
    question: { ru: 'У 5-А 695 страниц, у 5-Б 458. На сколько 5-А обогнал соседа? 695 − 458.', uz: "5-A da 695 bet, 5-B da 458. 5-A qo'shnisidan qanchaga o'zdi? 695 − 458." },
    placeholder: { ru: '0', uz: '0' },
    correctValue: '237',
    hint: { ru: 'В единицах 5 меньше 8 — занимай у десятков. После заёма десятки уменьшатся на единицу.', uz: "Birlarda 5 kichik 8 dan — o'nlardan qarz oling. Qarzdan keyin o'nlar bir birlikka kamayadi." },
    fb_correct: { ru: 'Правильно. 15 − 8 = 7, 8 − 5 = 3, 6 − 4 = 2 — разница 237.', uz: "To'g'ri. 15 − 8 = 7, 8 − 5 = 3, 6 − 4 = 2 — farq 237." },
    fb_wrong: { ru: 'Верный ответ — 237. В единицах занимаем: 15 − 8 = 7; десятки стали 8, 8 − 5 = 3; 6 − 4 = 2.', uz: "To'g'ri javob — 237. Birlarda qarz olamiz: 15 − 8 = 7; o'nlar 8 bo'ldi, 8 − 5 = 3; 6 − 4 = 2." },
    audio: {
      intro: { ru: 'И последнее. Узнай, на сколько страниц класс пять А обогнал соседей. Вычти из своего результата результат класса пять Б, в столбик.', uz: "Va oxirgisi. Besh A sinf qo'shnilardan necha betga o'zib ketganini toping. O'z natijangizdan besh B sinf natijasini ustun shaklida ayiring." },
      on_correct: { ru: 'Верно. Ты прошёл весь путь, от единиц до сотен.', uz: "To'g'ri. Birlardan yuzlargacha butun yo'lni bosib o'tdingiz." },
      on_wrong: { ru: 'Пока не сходится. Вычитай по разрядам и, если не хватает, занимай у соседа.', uz: "Hali mos emas. Xonama-xona ayiring va yetmasa, qo'shnidan qarz oling." }
    }
  },

  // ===== s13 — SUMMARY: возврат к Бекзоду =====
  s13: {
    eyebrow: { ru: 'Итог урока', uz: 'Dars yakuni' },
    title: { ru: 'Что ты теперь умеешь', uz: 'Endi nimani bilasiz' },
    ring_back: {
      ru: 'Помнишь Бекзода? Он потерял оба переноса и получил 315. На самом деле 168 + 257 = 425. Разряды никуда не пропадают — перенос уносит единицу в следующий разряд, а заём берёт её обратно.',
      uz: "Bekzod esingizdami? U ikkala ko'chirishni yo'qotib, 315 oldi. Aslida 168 + 257 = 425. Xonalar hech qayerga yo'qolmaydi — ko'chirish birlikni keyingi xonaga olib ketadi, qarz esa uni qaytarib oladi."
    },
    learned_1: { ru: 'Складывать столбиком, не теряя перенос.', uz: "Ko'chirishni yo'qotmasdan ustun shaklida qo'shish." },
    learned_2: { ru: 'Вычитать столбиком, проводя заём через нули.', uz: "Qarzni nollar orqali o'tkazib, ustun shaklida ayirish." },
    why_heading: { ru: 'Зачем это нужно', uz: 'Bu nimaga kerak' },
    why_1: { ru: 'Контроль разрядов даёт верный ответ — один потерянный перенос меняет всё число.', uz: "Xonalarni nazorat qilish to'g'ri javob beradi — bitta yo'qolgan ko'chirish butun sonni o'zgartiradi." },
    why_2: { ru: 'Сложение и вычитание столбиком — основа для десятичных дробей и денежных расчётов.', uz: "Ustun shaklida qo'shish va ayirish — o'nli kasrlar va pul hisob-kitoblari uchun asos." },
    score_label: { ru: 'Правильных ответов', uz: "To'g'ri javoblar" },
    teaser: { ru: 'Дальше — умножение столбиком: как быстро сложить одно и то же много раз.', uz: "Keyin — ustun shaklida ko'paytirish: bir xil sonni ko'p marta tez qo'shish." },
    ref: { ru: 'Здесь пригодились разряды из nat_5_01. Дальше — умножение столбиком (nat_5_04).', uz: "Bunda nat_5_01 dagi xonalar asqotdi. Keyin — ustun shaklida ko'paytirish (nat_5_04)." },
    audio: {
      ru: [
        'Вернёмся к самому началу, к Бекзоду. Он потерял оба переноса и получил триста пятнадцать. На самом деле сто шестьдесят восемь плюс двести пятьдесят семь равно четыреста двадцать пять. Видишь, разряды никуда не пропадают.',
        'Теперь ты умеешь складывать в столбик, не теряя перенос, и вычитать, занимая через нули. Это и было главным на сегодня.',
        'А зачем это нужно. Когда следишь за разрядами, ответ всегда верный, ведь один потерянный перенос меняет всё число. И это основа для десятичных дробей и денежных расчётов впереди.',
        'В следующий раз возьмём умножение в столбик и увидим, как быстро сложить одно и то же много раз.'
      ],
      uz: [
        "Eng boshiga, Bekzodga qaytamiz. U ikkala ko'chirishni yo'qotib, uch yuz o'n besh olgan edi. Aslida bir yuz oltmish sakkiz qo'shuv ikki yuz ellik yetti teng to'rt yuz yigirma besh. Ko'rdingizmi, xonalar hech qayerga yo'qolmaydi.",
        "Endi siz ustun shaklida ko'chirishni yo'qotmay qo'shishni va nollar orqali qarz olib ayirishni bilasiz. Bugun asosiysi shu edi.",
        "Bu nimaga kerak. Xonalarni kuzatsangiz, javob doim to'g'ri chiqadi, chunki bitta yo'qolgan ko'chirish butun sonni o'zgartiradi. Bu o'nli kasrlar va pul hisoblari uchun ham asos.",
        "Keyingi safar ustun shaklida ko'paytirishni olamiz va bir xil sonni ko'p marta tez qo'shishni ko'ramiz."
      ]
    }
  }
};

// ============================================================
// LESSON: exploration "столбик по шагам" (сложение/вычитание)
// plan[step] = { reveal, chipsShown, activeIdx } — управляет раскрытием.
// ============================================================
const ExplorationAddSub = ({ idx, screen, totalScreens, onNext, onPrev, op, top, bottom, cols, result, plan }) => {
  const c = CONTENT[`s${idx}`];
  const t = useT();
  const lang = useLang();
  const segs = c.audio[lang].map((text, i) => ({
    id: `s${idx}_a${i}`,
    text,
    trigger: i === 0 ? 'on_mount' : `on_event:step_${i}`,
    waits_for: { type: 'button_click', target: i < c.audio[lang].length - 1 ? 'step' : 'next' }
  }));
  const audio = useAudio(segs);
  const [step, setStep] = useState(0);
  const last = c.audio[lang].length - 1;
  const endRef = useRef(null);

  useEffect(() => {
    if (step > 0 && endRef.current) {
      setTimeout(() => { if (endRef.current) endRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, 150);
    }
  }, [step]);

  const handleStep = () => {
    if (step < last) {
      const ns = step + 1;
      setStep(ns);
      audio.triggerInternal(`step_${ns}`);
    } else {
      audio.triggerEvent('button_click', 'next');
      onNext();
    }
  };

  const p = plan[Math.min(step, plan.length - 1)];
  const navContent = (
    <>
      <NavBack onPrev={onPrev} label={<BackLabel/>}/>
      <NavNext label={step < last ? t(c.btn_step) : <NextLabel/>} onClick={handleStep}/>
    </>
  );
  const blocks = [
    { from: 0, label: 'step1_label', text: 'step1_text' },
    { from: 1, label: 'step2_label', text: 'step2_text' }
  ];

  return (
    <Stage eyebrow={c.eyebrow} screen={screen} totalScreens={totalScreens} navContent={navContent} audioState={audio}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(18px, 2.5vw, 22px)' }}>
        <h2 className="title h-title fade-up">{t(c.title)}</h2>
        <p className="body fade-up delay-1" style={{ color: T.ink2 }}>{t(c.intro)}</p>
        <div className="frame fade-up delay-2" style={{ display: 'flex', justifyContent: 'center', padding: 'clamp(14px, 2.5vw, 20px) clamp(10px, 2vw, 16px)', overflowX: 'auto' }}>
          <AddSubColumnStepwise op={op} top={top} bottom={bottom} cols={cols} result={result} reveal={p.reveal} chipsShown={p.chipsShown} activeIdx={p.activeIdx}/>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {blocks.map((b, i) => (
            step >= b.from && (
              <div key={i} className="fade-up" style={{ display: 'grid', gridTemplateColumns: '28px 1fr', gap: 12, alignItems: 'start' }}>
                <div className="mono small" style={{ color: T.accent, fontWeight: 600, paddingTop: 2 }}>{String(i + 1).padStart(2, '0')}</div>
                <div>
                  <div className="small" style={{ color: T.ink, fontWeight: 600, marginBottom: 4 }}>{t(c[b.label])}</div>
                  <div className="body" style={{ color: T.ink2 }}>{t(c[b.text])}</div>
                </div>
              </div>
            )
          ))}
        </div>
        {step >= last && (
          <div className="fade-up frame-soft">
            <p className="body" style={{ margin: 0 }}>{t(c.step3_text)}</p>
          </div>
        )}
        <div ref={endRef}/>
      </div>
    </Stage>
  );
};

// ============================================================
// SEQUENCE / META
// ============================================================
const SEQUENCE = [0, 1, 2, 3, 4, 14, 5, 6, 7, 8, 9, 10, 11, 12, 13];
const TOTAL_SCREENS = SEQUENCE.length;

const SCREEN_META = [
  { id: 's0',  type: 'hook',        template: 'custom',         scored: false, scope: 'hook' },
  { id: 's1',  type: 'exploration', template: 'custom',         scored: false, scope: null },
  { id: 's2',  type: 'rule',        template: 'custom',         scored: false, scope: null },
  { id: 's3',  type: 'test',        template: 'NumInputScreen', scored: true,  scope: 'module-mikro' },
  { id: 's4',  type: 'test',        template: 'MCScreen',       scored: true,  scope: 'module-mikro' },
  { id: 's5',  type: 'exploration', template: 'custom',         scored: false, scope: null },
  { id: 's6',  type: 'rule',        template: 'custom',         scored: false, scope: null },
  { id: 's7',  type: 'test',        template: 'NumInputScreen', scored: true,  scope: 'module-mikro' },
  { id: 's8',  type: 'test',        template: 'MCScreen',       scored: true,  scope: 'module-mikro' },
  { id: 's9',  type: 'case',        template: 'custom',         scored: false, scope: null },
  { id: 's10', type: 'case',        template: 'MCScreen',       scored: true,  scope: 'module-mikro' },
  { id: 's11', type: 'test',        template: 'MCScreen',       scored: true,  scope: 'final' },
  { id: 's12', type: 'test',        template: 'NumInputScreen', scored: true,  scope: 'final' },
  { id: 's13', type: 'summary',     template: 'custom',         scored: false, scope: null },
  { id: 's14', type: 'test',        template: 'NumInputScreen', scored: true,  scope: 'module-mikro' }
];

// ============================================================
// РЕШЕНИЯ (для анимированного разбора). cols от единиц влево.
// ============================================================
const SOLUTIONS = {
  3:  { op: '+', top: '276', bottom: '185', result: '461', cols: [ { cap: '6 + 5', sum: '11', carry: 1 }, { cap: '7 + 8 + 1', sum: '16', carry: 1 }, { cap: '2 + 1 + 1', sum: '4' } ],
        narr: { ru: [
          'Чтобы понять, верно ли, складываем по разрядам справа налево. В единицах шесть и пять дают одиннадцать. Это больше десяти, поэтому единицу пишем, а десяток держим в уме и перекинем дальше.',
          'В десятках семь и восемь это пятнадцать, и прибавляем тот один из ума, выходит шестнадцать. Снова перекидываем один в сотни, а шесть пишем.',
          'В сотнях два и один это три, и ещё один из ума, получается четыре. Значит ответ четыреста шестьдесят один.',
          'Вот так, по разрядам и не теряя перенос, и получается верный ответ. Можно двигаться дальше.'
        ], uz: [
          "To'g'rimi yo'qmi tushunish uchun xonama-xona qo'shamiz. Birlarda olti va besh o'n bir. Bu o'ndan katta, shuning uchun birni yozamiz, bir o'nlikni dilda saqlab keyingi xonaga ko'chiramiz.",
          "O'nlarda yetti va sakkiz o'n besh, dildagi birni qo'shsak o'n olti. Yana bir o'nlikni yuzlarga ko'chiramiz, oltini yozamiz.",
          "Yuzlarda ikki va bir uch, dildagi bir bilan to'rt. Demak javob to'rt yuz oltmish bir.",
          "Mana shunday, xonama-xona va ko'chirishni yo'qotmay, to'g'ri javob chiqadi. Endi davom etsa bo'ladi."
        ] } },
  4:  { op: '+', top: '285', bottom: '47',  result: '332', cols: [ { cap: '5 + 7', sum: '12', carry: 1 }, { cap: '8 + 4 + 1', sum: '13', carry: 1 }, { cap: '2 + 0 + 1', sum: '3' } ],
        narr: { ru: [
          'Складываем справа налево. В единицах пять и семь дают двенадцать. Больше десяти, поэтому два пишем, а один держим в уме и перекидываем в десятки.',
          'В десятках восемь и четыре это двенадцать, плюс тот один из ума, выходит тринадцать. Три пишем, один снова перекидываем.',
          'В сотнях два, внизу ноль, и ещё один из ума, получается три. Значит ответ триста тридцать два.',
          'Вот так, по разрядам и не теряя перенос, и получается верный ответ. Можно двигаться дальше.'
        ], uz: [
          "O'ngdan chapga qo'shamiz. Birlarda besh va yetti o'n ikki. O'ndan katta, shuning uchun ikkini yozamiz, bir o'nlikni dilda saqlab o'nlarga ko'chiramiz.",
          "O'nlarda sakkiz va to'rt o'n ikki, dildagi birni qo'shsak o'n uch. Uchni yozamiz, bir o'nlikni yana ko'chiramiz.",
          "Yuzlarda ikki, pastda nol, dildagi bir bilan uch. Demak javob uch yuz o'ttiz ikki.",
          "Mana shunday, xonama-xona va ko'chirishni yo'qotmay, to'g'ri javob chiqadi. Endi davom etsa bo'ladi."
        ] } },
  7:  { op: '-', top: '1000', bottom: '396', result: '604', cols: [ { cap: '10 \u2212 6', sum: '4' }, { cap: '9 \u2212 9', sum: '0' }, { cap: '9 \u2212 3', sum: '6' } ],
        narr: { ru: [
          'Чтобы проверить, вычитаем справа налево. В единицах ноль, шесть вычесть нельзя, поэтому занимаем у старших. Нули по цепочке становятся девятками, а у единиц появляется десять. Из десяти вычитаем шесть, пишем четыре.',
          'В десятках теперь девять, вычитаем девять, остаётся ноль. Пишем ноль.',
          'В сотнях девять, вычитаем три, получается шесть. Значит ответ шестьсот четыре.',
          'Вот так, занимая там, где не хватает, проходим все разряды и получаем верный ответ. Можно двигаться дальше.'
        ], uz: [
          "Tekshirish uchun o'ngdan chapga ayiramiz. Birlarda nol, oltini ayirib bo'lmaydi, shuning uchun yuqoridan qarz olamiz. Nollar zanjir bo'ylab to'qqizga aylanadi, birlarda o'n hosil bo'ladi. O'ndan oltini ayirsak, to'rt yozamiz.",
          "O'nlarda endi to'qqiz, to'qqizni ayirsak, nol qoladi. Nolni yozamiz.",
          "Yuzlarda to'qqiz, uchni ayirsak, olti. Demak javob olti yuz to'rt.",
          "Mana shunday, yetmagan joyda qarz olib, barcha xonalardan o'tamiz va to'g'ri javob chiqadi. Endi davom etsa bo'ladi."
        ] } },
  8:  { op: '-', top: '506', bottom: '198', result: '308', cols: [ { cap: '16 \u2212 8', sum: '8' }, { cap: '9 \u2212 9', sum: '0' }, { cap: '4 \u2212 1', sum: '3' } ],
        narr: { ru: [
          'Вычитаем справа налево. В единицах из шести восемь не вычесть, поэтому занимаем десяток. Получается шестнадцать минус восемь, это восемь. Пишем восемь.',
          'В десятках стоял ноль, а единицу мы уже заняли, поэтому берём у сотен, выходит девять. Девять минус девять это ноль. Пишем ноль.',
          'В сотнях после займа осталось четыре. Четыре минус один это три. Значит ответ триста восемь.',
          'Вот так, занимая там, где не хватает, проходим все разряды и получаем верный ответ. Можно двигаться дальше.'
        ], uz: [
          "O'ngdan chapga ayiramiz. Birlarda oltidan sakkizni ayirib bo'lmaydi, shuning uchun o'nlikdan qarz olamiz. O'n oltidan sakkizni ayirsak, sakkiz. Sakkizni yozamiz.",
          "O'nlarda nol edi, birlar uchun qarz oldik, shuning uchun yuzlardan olamiz, to'qqiz bo'ladi. To'qqizdan to'qqizni ayirsak, nol. Nolni yozamiz.",
          "Yuzlarda qarzdan keyin to'rt qoldi. To'rtdan birni ayirsak, uch. Demak javob uch yuz sakkiz.",
          "Mana shunday, yetmagan joyda qarz olib, barcha xonalardan o'tamiz va to'g'ri javob chiqadi. Endi davom etsa bo'ladi."
        ] } },
  10: { op: '+', top: '428', bottom: '267', result: '695', cols: [ { cap: '8 + 7', sum: '15', carry: 1 }, { cap: '2 + 6 + 1', sum: '9' }, { cap: '4 + 2', sum: '6' } ],
        narr: { ru: [
          'Складываем справа налево. В единицах восемь и семь дают пятнадцать. Больше десяти, поэтому пять пишем, а один держим в уме и перекидываем в десятки.',
          'В десятках два и шесть это восемь, плюс тот один из ума, выходит девять. Девять меньше десяти, переносить нечего, пишем девять.',
          'В сотнях четыре и два это шесть. Значит ответ шестьсот девяносто пять.',
          'Вот так, по разрядам и не теряя перенос, и получается верный ответ. Можно двигаться дальше.'
        ], uz: [
          "O'ngdan chapga qo'shamiz. Birlarda sakkiz va yetti o'n besh. O'ndan katta, shuning uchun beshni yozamiz, bir o'nlikni dilda saqlab o'nlarga ko'chiramiz.",
          "O'nlarda ikki va olti sakkiz, dildagi birni qo'shsak to'qqiz. To'qqiz o'ndan kichik, ko'chiradigan narsa yo'q, to'qqizni yozamiz.",
          "Yuzlarda to'rt va ikki olti. Demak javob olti yuz to'qson besh.",
          "Mana shunday, xonama-xona va ko'chirishni yo'qotmay, to'g'ri javob chiqadi. Endi davom etsa bo'ladi."
        ] } },
  11: { op: '-', top: '1000', bottom: '695', result: '305', cols: [ { cap: '10 \u2212 5', sum: '5' }, { cap: '9 \u2212 9', sum: '0' }, { cap: '9 \u2212 6', sum: '3' } ],
        narr: { ru: [
          'Вычитаем справа налево. В единицах ноль, пять вычесть нельзя, поэтому занимаем у старших. Нули по цепочке становятся девятками, у единиц появляется десять. Из десяти вычитаем пять, пишем пять.',
          'В десятках теперь девять, вычитаем девять, остаётся ноль. Пишем ноль.',
          'В сотнях девять, вычитаем шесть, получается три. Значит ответ триста пять.',
          'Вот так, занимая там, где не хватает, проходим все разряды и получаем верный ответ. Можно двигаться дальше.'
        ], uz: [
          "O'ngdan chapga ayiramiz. Birlarda nol, beshni ayirib bo'lmaydi, shuning uchun yuqoridan qarz olamiz. Nollar zanjir bo'ylab to'qqizga aylanadi, birlarda o'n hosil bo'ladi. O'ndan beshni ayirsak, besh yozamiz.",
          "O'nlarda endi to'qqiz, to'qqizni ayirsak, nol qoladi. Nolni yozamiz.",
          "Yuzlarda to'qqiz, oltini ayirsak, uch. Demak javob uch yuz besh.",
          "Mana shunday, yetmagan joyda qarz olib, barcha xonalardan o'tamiz va to'g'ri javob chiqadi. Endi davom etsa bo'ladi."
        ] } },
  12: { op: '-', top: '695', bottom: '458', result: '237', cols: [ { cap: '15 \u2212 8', sum: '7' }, { cap: '8 \u2212 5', sum: '3' }, { cap: '6 \u2212 4', sum: '2' } ],
        narr: { ru: [
          'Вычитаем справа налево. В единицах из пяти восемь не вычесть, поэтому занимаем десяток. Пятнадцать минус восемь это семь. Пишем семь.',
          'В десятках после займа осталось восемь. Восемь минус пять это три. Пишем три.',
          'В сотнях шесть минус четыре это два. Значит ответ двести тридцать семь.',
          'Вот так, занимая там, где не хватает, проходим все разряды и получаем верный ответ. Можно двигаться дальше.'
        ], uz: [
          "O'ngdan chapga ayiramiz. Birlarda beshdan sakkizni ayirib bo'lmaydi, shuning uchun o'nlikdan qarz olamiz. O'n beshdan sakkizni ayirsak, yetti. Yettini yozamiz.",
          "O'nlarda qarzdan keyin sakkiz qoldi. Sakkizdan beshni ayirsak, uch. Uchni yozamiz.",
          "Yuzlarda oltidan to'rtni ayirsak, ikki. Demak javob ikki yuz o'ttiz yetti.",
          "Mana shunday, yetmagan joyda qarz olib, barcha xonalardan o'tamiz va to'g'ri javob chiqadi. Endi davom etsa bo'ladi."
        ] } },
  14: {
    op: '+', top: '367', bottom: '458', result: '825',
    cols: [
      { cap: '7 + 8', sum: '15', carry: 1 },
      { cap: '6 + 5 + 1', sum: '12', carry: 1 },
      { cap: '3 + 4 + 1', sum: '8' }
    ],
    narr: {
      ru: [
        'Начинаем с единиц. Семь и восемь дают пятнадцать. Это больше десяти, поэтому пять пишем, а единицу держим в уме и перекинем в десятки.',
        'Десятки. Шесть и пять дают одиннадцать, и ещё тот один из ума, всего двенадцать. Двойку пишем, единицу снова держим в уме.',
        'Сотни. Три и четыре дают семь, и ещё один из ума, итого восемь. Переносить больше нечего.',
        'Вот так, по разрядам и не теряя перенос, и получается верный ответ. Можно двигаться дальше.'
      ],
      uz: [
        "Birlardan boshlaymiz. Yetti va sakkiz o'n beshni beradi. Bu o'ndan katta, shuning uchun beshni yozamiz, birni dilda saqlab o'nlarga o'tkazamiz.",
        "O'nlar. Olti va besh o'n birni beradi, yana dildagi bir, jami o'n ikki. Ikkini yozamiz, birni yana dilda saqlaymiz.",
        "Yuzlar. Uch va to'rt yettini beradi, yana dildagi bir, jami sakkiz. Boshqa ko'chirish yo'q.",
        "Mana shunday, xonama-xona va ko'chirishni yo'qotmay, to'g'ri javob chiqadi. Endi davom etsa bo'ladi."
      ]
    }
  }
};

// Подсказки (из CONTENT) — для HintToggle на test-экранах.
const EXTRA = {};
[3, 4, 7, 8, 10, 11, 12].forEach((i) => {
  const h = CONTENT[`s${i}`] && CONTENT[`s${i}`].hint;
  if (h) EXTRA[i] = { hint: h };
});

// Отсылки к прошлым/будущим урокам — для RefNote.
const REFS = {
  2:  CONTENT.s2.ref,
  9:  CONTENT.s9.ref,
  13: CONTENT.s13.ref
};

// ============================================================
// SCREEN-КОМПОНЕНТЫ
// ============================================================

// Правило с золотым определением (s2/s6). Определение/факты — золотой акцент.
const RuleScreenGold = ({ idx, screen, totalScreens, onNext, onPrev, rules, demo }) => {
  const c = CONTENT[`s${idx}`];
  const t = useT();
  const lang = useLang();
  const audio = useAudio([{ id: `s${idx}_a`, text: c.audio[lang], trigger: 'on_mount', waits_for: { type: 'button_click', target: 'next' } }]);
  const handleNext = () => { audio.triggerEvent('button_click', 'next'); onNext(); };
  const navContent = (<><NavBack onPrev={onPrev} label={<BackLabel/>}/><NavNext onClick={handleNext} label={<NextLabel/>}/></>);
  return (
    <Stage eyebrow={c.eyebrow} screen={screen} totalScreens={totalScreens} navContent={navContent} audioState={audio}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(18px, 2.5vw, 24px)' }}>
        <h2 className="title h-title fade-up">{t(c.title)}</h2>
        <div className="frame fade-up delay-1" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {rules.map((r, i) => (
            <div key={i} style={{ display: 'grid', gridTemplateColumns: '28px 1fr', gap: 12, alignItems: 'start' }}>
              <div className="mono small" style={{ color: T.accent, fontWeight: 600, paddingTop: 2 }}>{String(i + 1).padStart(2, '0')}</div>
              <div className="body" style={{ color: T.ink }}>{t(c[r])}</div>
            </div>
          ))}
          {c.term && (
            <div className="frame-soft" style={{ marginTop: 4 }}>
              <p className="body" style={{ margin: 0 }}>{t(c.term)}</p>
            </div>
          )}
        </div>
        {demo && (
          <div className="frame fade-up delay-2" style={{ display: 'flex', flexDirection: 'column', gap: 10, padding: 'clamp(16px, 3vw, 22px) clamp(12px, 2vw, 18px)' }}>
            <span className="eyebrow" style={{ color: T.accent }}>{lang === 'uz' ? 'Ustun shaklida tahlil' : 'Разбор в столбик'}</span>
            <ColumnAutoAnim sol={demo}/>
          </div>
        )}
        <RefNote idx={idx}/>
      </div>
    </Stage>
  );
};

// s0 — HOOK (полный сброс picked при возврате)
const Screen0 = ({ screen, totalScreens, onAnswer, onNext }) => {
  const c = CONTENT.s0;
  const t = useT();
  const lang = useLang();
  const audio = useAudio([{ id: 's0_intro', text: c.audio.intro[lang], trigger: 'on_mount', waits_for: { type: 'option_picked' } }]);
  const [picked, setPicked] = useState(null);

  const pick = (v) => {
    if (picked !== null) return;
    setPicked(v);
    onAnswer({ stage: null, screenIdx: 0, studentAnswer: v, correct: true });
    audio.triggerEvent('option_picked');
    setTimeout(onNext, 300);
  };

  return (
    <Stage eyebrow={c.eyebrow} screen={screen} totalScreens={totalScreens} audioState={audio}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(18px, 2.5vw, 24px)' }}>
        <h1 className="title h-title fade-up">{t(c.global_q)}</h1>
        <p className="body fade-up delay-1" style={{ color: T.ink2 }}>{t(c.claim_lead)}</p>
        <div className="frame fade-up delay-2" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'clamp(12px, 2vw, 18px)' }}>
          <AddSubBoard op="+" top="168" bottom="257" result="315" resultColor={T.accent}/>
          <p className="body italic" style={{ margin: 0, color: T.accent, textAlign: 'center' }}>{t(c.claim_em)}</p>
        </div>
        <p className="h-sub title fade-up delay-3">{t(c.question)}</p>
        <div className="fade-up delay-4" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[{ id: 'yes', label: c.opt_yes }, { id: 'no', label: c.opt_no }, { id: 'idk', label: c.opt_idk }].map((opt) => (
            <button key={opt.id} className="option" disabled={picked !== null} onClick={() => pick(opt.id)}
              style={{ padding: 'clamp(14px, 2vw, 15px) clamp(16px, 2.5vw, 20px)', fontSize: 'clamp(15px, 1.9vw, 15px)' }}>
              {t(opt.label)}
            </button>
          ))}
        </div>
      </div>
    </Stage>
  );
};

// s1 — EXPLORATION сложение 168 + 257 = 425
const Screen1 = (props) => (
  <ColumnDemo
    {...props} idx={1} op="+" top="168" bottom="257" result="425"
    cols={[
      { cap: '8 + 7', sum: '15', carry: 1 },
      { cap: '6 + 5 + 1', sum: '12', carry: 1 },
      { cap: '1 + 2 + 1', sum: '4' }
    ]}
    plan={[
      { reveal: 1, chipsShown: 1, activeIdx: 0 },
      { reveal: 2, chipsShown: 2, activeIdx: 1 },
      { reveal: 3, chipsShown: 3, activeIdx: 2 }
    ]}
  />
);

// s2 — RULE сложение
const Screen2 = (props) => <RuleScreenGold {...props} idx={2} rules={['rule_1', 'rule_2']} demo={{ op: '+', top: '168', bottom: '257', result: '425', cols: [{ cap: '8 + 7', sum: '15', carry: 1 }, { cap: '6 + 5 + 1', sum: '12', carry: 1 }, { cap: '1 + 2 + 1', sum: '4' }] }}/>;

// s3 — TEST input (сложение)
const Screen3 = (props) => <InteractiveColumn {...props} idx={3}/>;

// s4 — TEST choice retry (сложение)
const Screen4 = (props) => <QuestionScreenRetry {...props} idx={4}/>;

// s5 — EXPLORATION вычитание 1000 − 645 = 355 (заём через нули)
const Screen5 = (props) => (
  <ColumnDemo
    {...props} idx={5} op="-" top="1000" bottom="645" result="355"
    cols={[
      { cap: '10 \u2212 5', sum: '5' },
      { cap: '9 \u2212 4', sum: '5' },
      { cap: '9 \u2212 6', sum: '3' }
    ]}
    plan={[
      { reveal: 0, chipsShown: 3, activeIdx: -1 },
      { reveal: 1, chipsShown: 3, activeIdx: 0 },
      { reveal: 2, chipsShown: 3, activeIdx: 1 },
      { reveal: 3, chipsShown: 3, activeIdx: 2 }
    ]}
  />
);

// s6 — RULE вычитание
const Screen6 = (props) => <RuleScreenGold {...props} idx={6} rules={['rule_1', 'rule_2', 'rule_3']} demo={{ op: '-', top: '1000', bottom: '645', result: '355', cols: [{ cap: '10 \u2212 5', sum: '5' }, { cap: '9 \u2212 4', sum: '5' }, { cap: '9 \u2212 6', sum: '3' }] }}/>;

// s7 — TEST input (вычитание)
const Screen7 = (props) => <InteractiveColumn {...props} idx={7}/>;

// s8 — TEST choice retry (вычитание)
const Screen8 = (props) => <QuestionScreenRetry {...props} idx={8}/>;

// s9 — CASE setup
const Screen9 = ({ screen, totalScreens, onNext, onPrev }) => {
  const c = CONTENT.s9;
  const t = useT();
  const lang = useLang();
  const audio = useAudio([{ id: 's9_a', text: c.audio[lang], trigger: 'on_mount', waits_for: { type: 'button_click', target: 'next' } }]);
  const handleNext = () => { audio.triggerEvent('button_click', 'next'); onNext(); };
  const navContent = (<><NavBack onPrev={onPrev} label={<BackLabel/>}/><NavNext label={t(c.cta)} onClick={handleNext}/></>);

  return (
    <Stage eyebrow={c.eyebrow} screen={screen} totalScreens={totalScreens} navContent={navContent} audioState={audio}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(18px, 2.5vw, 24px)' }}>
        <h2 className="title h-title fade-up">{t(c.title)}</h2>
        <p className="body fade-up delay-1" style={{ color: T.ink2 }}>{t(c.intro)}</p>
        <div className="fade-up delay-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          {[c.fact_1, c.fact_2].map((fobj, i) => (
            <div key={i} className="frame" style={{ padding: 'clamp(16px, 3vw, 20px)' }}>
              <p className="body" style={{ margin: 0, fontWeight: 600, color: T.ink }}>{t(fobj)}</p>
            </div>
          ))}
        </div>
        <RefNote idx={9}/>
      </div>
    </Stage>
  );
};

// s10 — CASE step retry (сложение)
const Screen10 = (props) => <QuestionScreenRetry {...props} idx={10}/>;

// s11 — FINAL test choice retry (вычитание)
const Screen11 = (props) => <QuestionScreenRetry {...props} idx={11}/>;

// s12 — FINAL test input (вычитание)
const Screen12 = (props) => <InteractiveColumn {...props} idx={12}/>;
const Screen14 = (props) => <InteractiveColumn {...props} idx={14}/>;   // проверка знаний (сложение)

// s13 — SUMMARY
const Screen13 = ({ screen, totalScreens, answers, onReset, onPrev, finishLesson }) => {
  const c = CONTENT.s13;
  const t = useT();
  const lang = useLang();
  const audio = useAudio(makeAudioSegments(c, lang));
  const scored = SEQUENCE.filter(i => SCREEN_META[i]?.scored);
  const correct = scored.filter(i => answers[i]?.correct).length;
  const total = scored.length;

  useEffect(() => {
    finishLesson();
    // eslint-disable-next-line
  }, []);

  const navContent = (
    <>
      <NavBack onPrev={onPrev} label={<BackLabel/>}/>
      <button className="btn-ghost" onClick={onReset}
        style={{ padding: 'clamp(10px, 1.7vw, 12px) clamp(15px, 2.1vw, 20px)', fontSize: 'clamp(12px, 1.5vw, 14px)' }}>
        {lang === 'uz' ? "Qaytadan o'tish" : 'Пройти заново'}
      </button>
      <button className="btn-white-accent" disabled
        style={{ padding: 'clamp(10px, 1.7vw, 12px) clamp(20px, 2.5vw, 27px)', fontSize: 'clamp(12px, 1.5vw, 14px)', marginLeft: 'auto' }}>
        {lang === 'uz' ? 'Keyingi dars →' : 'Следующий урок →'}
      </button>
    </>
  );

  return (
    <Stage eyebrow={c.eyebrow} screen={screen} totalScreens={totalScreens} navContent={navContent} audioState={audio}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'clamp(18px, 3vw, 24px)' }}>
        <h2 className="title h-title fade-up">{t(c.title)}</h2>
        <div className="frame-soft fade-up delay-1"><p className="body" style={{ margin: 0 }}>{t(c.ring_back)}</p></div>
        <div className="frame fade-up delay-1" style={{ textAlign: 'center' }}>
          <p className="eyebrow" style={{ color: T.ink3, margin: 0 }}>{t(c.score_label)}</p>
          <div className="display" style={{ fontSize: 'clamp(56px, 11vw, 80px)', marginTop: 8 }}>
            <span style={{ color: correct >= total * 0.7 ? T.success : T.accent }}>{correct}</span>
            <span style={{ color: T.ink3 }}>/{total}</span>
          </div>
        </div>
        <div className="frame fade-up delay-2">
          <p className="eyebrow" style={{ color: T.accent, margin: 0 }}>{lang === 'uz' ? 'Asosiy' : 'Главное'}</p>
          <ul className="body" style={{ marginTop: 12, paddingLeft: 20, color: T.ink2, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li>{t(c.learned_1)}</li>
            <li>{t(c.learned_2)}</li>
          </ul>
        </div>
        <div className="frame-success fade-up delay-3">
          <p className="eyebrow" style={{ color: T.success, margin: 0 }}>{t(c.why_heading)}</p>
          <ul className="body" style={{ marginTop: 12, paddingLeft: 20, color: T.ink2, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <li>{t(c.why_1)}</li>
            <li>{t(c.why_2)}</li>
          </ul>
        </div>
        <p className="body fade-up delay-4" style={{ color: T.ink2 }}>{t(c.teaser)}</p>
        <RefNote idx={13}/>
      </div>
    </Stage>
  );
};

// ============================================================
// КОРНЕВОЙ КОМПОНЕНТ (шаблон infrastructure_v1)
// ============================================================
export default function ColumnArithmeticLesson({ lang: langProp, onFinished }) {
  const isPreview = !langProp;
  const [previewLang, setPreviewLang] = useState('ru');
  const lang = langProp || previewLang;

  const safeOnFinished = onFinished || ((payload) => {
    // eslint-disable-next-line no-console
    console.log('[Preview] onFinished payload:', payload);
  });

  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState([]);
  const startTimeRef = useRef(Date.now());

  const recordAnswer = useCallback((screenIdx, data) => {
    setAnswers(prev => {
      const next = [...prev];
      next[screenIdx] = data;
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    setAnswers([]);
    setCurrent(0);
    startTimeRef.current = Date.now();
  }, []);

  const finishLesson = useCallback(() => {
    const presentScored = SEQUENCE.filter(i => SCREEN_META[i]?.scored);
    const presentFinal = presentScored.filter(i => SCREEN_META[i]?.scope === 'final');
    const correctAnswersCount = presentScored.filter(i => answers[i]?.correct).length;
    const finalCorrect = presentFinal.filter(i => answers[i]?.correct).length;

    const payload = {
      lessonId: LESSON_META.lessonId,
      lessonTitle: LESSON_META.lessonTitle,
      durationSec: Math.floor((Date.now() - startTimeRef.current) / 1000),
      totalQuestions: presentScored.length,
      correctAnswers: correctAnswersCount,
      scorePercent: presentScored.length > 0
        ? Math.round((correctAnswersCount / presentScored.length) * 100)
        : 0,
      finalScore: finalCorrect,
      finalTotal: presentFinal.length,
      passed: presentFinal.length > 0
        ? finalCorrect / presentFinal.length >= 0.6
        : (presentScored.length > 0 ? (correctAnswersCount / presentScored.length) >= 0.6 : false),
      answers: answers.filter(Boolean)
    };
    safeOnFinished(payload);
  }, [answers, safeOnFinished]);

  const SCREEN_COMPONENTS = { 0: Screen0, 1: Screen1, 2: Screen2, 3: Screen3, 4: Screen4, 5: Screen5, 6: Screen6, 7: Screen7, 8: Screen8, 9: Screen9, 10: Screen10, 11: Screen11, 12: Screen12, 13: Screen13, 14: Screen14 };
  const sIdx = SEQUENCE[current];
  const CurrentScreen = SCREEN_COMPONENTS[sIdx];

  const next = () => setCurrent(s => Math.min(s + 1, TOTAL_SCREENS - 1));
  const prev = () => setCurrent(s => Math.max(s - 1, 0));

  const handleAnswer = useCallback((data) => {
    recordAnswer(SEQUENCE[current], data);
  }, [current, recordAnswer]);

  return (
    <LangContext.Provider value={lang}>
      <style>{STYLES}</style>
      <div className="lesson-root">
        {isPreview && (
          <div className="lang-switch">
            <button className={`lang-btn ${previewLang === 'ru' ? 'active' : ''}`} onClick={() => setPreviewLang('ru')}>RU</button>
            <button className={`lang-btn ${previewLang === 'uz' ? 'active' : ''}`} onClick={() => setPreviewLang('uz')}>UZ</button>
          </div>
        )}
        <CurrentScreen
          screen={current}
          totalScreens={TOTAL_SCREENS}
          storedAnswer={answers[sIdx]}
          answers={answers}
          onAnswer={handleAnswer}
          onNext={next}
          onPrev={prev}
          onReset={reset}
          finishLesson={finishLesson}
        />
      </div>
    </LangContext.Provider>
  );
}

// CSS (infra v15)
const STYLES = `
html, body { margin: 0; padding: 0; }
.lesson-root, .lesson-root * { box-sizing: border-box; }
.lesson-root {
  font-family: 'Manrope', system-ui, sans-serif;
  color: #0E0E10;
  background: #F6F4EF;
  height: 100dvh;
  overflow: hidden;
  -webkit-font-smoothing: antialiased;
  font-feature-settings: "ss01","cv11";
}

.lesson-root h1,
.lesson-root h2,
.lesson-root h3,
.lesson-root h4,
.lesson-root h5,
.lesson-root h6,
.lesson-root p,
.lesson-root ul,
.lesson-root ol { margin: 0; padding: 0; }

.title { font-family: 'Source Serif 4', serif; font-weight: 600; line-height: 1.1; letter-spacing: -0.005em; font-variation-settings: "opsz" 60; }
.display { font-family: 'Source Serif 4', serif; font-weight: 600; line-height: 1.0; letter-spacing: -0.01em; font-variation-settings: "opsz" 60; }
.italic { font-family: 'Source Serif 4', serif; font-style: italic; font-weight: 500; font-variation-settings: "opsz" 60; }
.mono { font-family: 'JetBrains Mono', monospace; }
.mop { font-family: 'Manrope', sans-serif; font-weight: 600; color: #0E0E10; display: inline-block; padding: 0 0.06em; }

.frac { display: inline-flex; flex-direction: column; align-items: center; vertical-align: middle; line-height: 1; margin: 0 0.08em; font-family: 'Fraunces', serif; font-variation-settings: "opsz" 144; font-weight: 400; }
.frac .n, .frac .d { padding: 0 0.12em; }
.frac .bar { height: 0.08em; background: currentColor; width: 100%; margin: 0.08em 0; border-radius: 2px; }

@keyframes fade-in-up { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
.fade-up { animation: fade-in-up 0.4s ease-out forwards; opacity: 0; }
.delay-1 { animation-delay: 0.12s; } .delay-2 { animation-delay: 0.24s; }
.delay-3 { animation-delay: 0.36s; } .delay-4 { animation-delay: 0.48s; }

.feedback-block { max-height: 0; opacity: 0; overflow: hidden; transition: max-height 0.4s ease-out, opacity 0.3s ease-out 0.1s, margin-top 0.4s ease-out; margin-top: 0; }
.feedback-block.visible { max-height: 800px; opacity: 1; margin-top: clamp(14px, 2vw, 20px); }

.btn {
  font-family: 'Manrope', sans-serif;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  background: #0E0E10;
  color: #F6F4EF;
  letter-spacing: 0.01em;
  border-radius: 12px;
  border: none;
  box-shadow: 0 6px 18px -4px rgba(58, 53, 48, 0.32);
}
.btn:hover:not(:disabled) {
  background: #FF4F28;
  box-shadow: 0 10px 24px -4px rgba(255, 79, 40, 0.45);
}
.btn:disabled { opacity: 0.4; cursor: not-allowed; box-shadow: none; }

.btn-white-accent {
  font-family: 'Manrope', sans-serif;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  background: #FFFFFF;
  color: #FF4F28;
  letter-spacing: 0.01em;
  border-radius: 12px;
  border: none;
  box-shadow: 0 8px 22px -4px rgba(255, 79, 40, 0.35), 0 0 0 1px rgba(255, 79, 40, 0.12);
}
.btn-white-accent:hover:not(:disabled) {
  background: #FF4F28;
  color: #FFFFFF;
  box-shadow: 0 12px 28px -6px rgba(255, 79, 40, 0.55);
}
.btn-white-accent:disabled { opacity: 0.45; cursor: not-allowed; box-shadow: 0 4px 12px -4px rgba(58, 53, 48, 0.14); }

.btn-ghost {
  font-family: 'Manrope', sans-serif;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  background: transparent;
  color: #0E0E10;
  letter-spacing: 0.01em;
  border-radius: 12px;
  border: none;
  box-shadow: none;
}
.btn-ghost:hover:not(:disabled) {
  background: #FFFFFF;
  box-shadow: 0 6px 18px -6px rgba(58, 53, 48, 0.18);
}
.btn-ghost:disabled { opacity: 0.4; cursor: not-allowed; }

.option {
  background: #FFFFFF;
  cursor: pointer;
  transition: all 0.2s;
  font-family: 'Manrope', sans-serif;
  font-weight: 500;
  text-align: left;
  border-radius: 12px;
  width: 100%;
  border: none;
  color: #0E0E10;
  box-shadow: 0 6px 16px -6px rgba(58, 53, 48, 0.14);
}
.option:hover:not(:disabled) {
  background: #FDFBF7;
  box-shadow: 0 10px 22px -6px rgba(58, 53, 48, 0.22);
}
.option:disabled { cursor: default; }
.option-correct {
  background: #E3F0E8 !important;
  color: #1F7A4D !important;
  box-shadow: 0 8px 22px -6px rgba(31, 122, 77, 0.32) !important;
}
.option-wrong {
  background: #FFFFFF !important;
  color: #A7A6A2 !important;
  opacity: 0.55 !important;
  box-shadow: 0 4px 12px -6px rgba(58, 53, 48, 0.08) !important;
}
.option-picked-wrong {
  background: #FFE8E1 !important;
  color: #FF4F28 !important;
  box-shadow: 0 8px 22px -6px rgba(255, 79, 40, 0.38) !important;
}

.h-title { font-size: clamp(22px, 4vw, 38px); }
.h-sub { font-size: clamp(17px, 2.5vw, 20px); }
.body { font-size: clamp(15px, 1.9vw, 15px); line-height: 1.5; }
.eyebrow { font-size: clamp(11px, 1.3vw, 11px); letter-spacing: 0.18em; text-transform: uppercase; font-weight: 600; }
.small { font-size: clamp(13px, 1.5vw, 13px); }
.frac-display { font-size: clamp(45px, 9vw, 75px); }
.frac-mid { font-size: clamp(26px, 5vw, 38px); }
.frac-sm { font-size: clamp(16px, 2.5vw, 20px); }

.stage { max-width: 936px; margin: 0 auto; height: 100dvh; display: flex; flex-direction: column; }
.stage-header {
  flex-shrink: 0;
  background: #F6F4EF;
  padding-top: clamp(12px, 2vw, 18px);
  padding-bottom: clamp(8px, 1.5vw, 12px);
}
.stage-content {
  flex: 1;
  padding-top: clamp(10px, 1.7vw, 16px);
  padding-bottom: clamp(17px, 3.4vw, 34px);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}
.stage-nav {
  flex-shrink: 0;
  background: #F6F4EF;
  border-top: 1px solid rgba(167, 166, 162, 0.25);
  padding-top: clamp(12px, 2vw, 15px);
  padding-bottom: clamp(12px, 2vw, 15px);
  display: flex;
  gap: 12px;
}

.chrome { display: flex; align-items: center; justify-content: space-between; margin-bottom: 0; }
.chrome-left { display: flex; align-items: center; gap: 10px; color: #5A5A60; }
.dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #FF4F28;
  box-shadow: 0 0 8px rgba(255, 79, 40, 0.55);
}

.progress-track {
  height: 3px;
  background: rgba(167, 166, 162, 0.25);
  width: 100%;
  margin-bottom: 12px;
  border-radius: 99px;
  overflow: visible;
}
.progress-bar {
  height: 100%;
  background: #FF4F28;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
  border-radius: 99px;
  box-shadow: 0 0 10px rgba(255, 79, 40, 0.55), 0 0 3px rgba(255, 79, 40, 0.40);
}

.track-wrap {
  position: relative;
  height: 26px;
  margin: 18px 0;
  display: flex;
  align-items: center;
}
.track-bg {
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  height: 4px;
  background: rgba(167, 166, 162, 0.30);
  border-radius: 99px;
  pointer-events: none;
}
.track-fill {
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  height: 4px;
  background: #FF4F28;
  border-radius: 99px;
  pointer-events: none;
  box-shadow: 0 0 8px rgba(255, 79, 40, 0.50), 0 0 2px rgba(255, 79, 40, 0.40);
  transition: width 0.15s ease-out;
}
.slider-input {
  -webkit-appearance: none;
  appearance: none;
  position: relative;
  width: 100%;
  height: 24px;
  background: transparent;
  outline: none;
  margin: 0;
  cursor: grab;
  z-index: 2;
}
.slider-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 24px;
  height: 24px;
  background: #FF4F28;
  border-radius: 50%;
  cursor: grab;
  transition: transform 0.1s;
  border: none;
  box-shadow: 0 0 0 4px #F6F4EF, 0 0 12px 0 rgba(255, 79, 40, 0.55);
}
.slider-input::-moz-range-thumb {
  width: 24px;
  height: 24px;
  background: #FF4F28;
  border-radius: 50%;
  cursor: grab;
  border: none;
  box-shadow: 0 0 0 4px #F6F4EF, 0 0 12px 0 rgba(255, 79, 40, 0.55);
}
.slider-input::-webkit-slider-thumb:active { cursor: grabbing; transform: scale(1.12); }
.slider-input:disabled { cursor: not-allowed; }
.slider-input:disabled::-webkit-slider-thumb { opacity: 0.5; cursor: not-allowed; }

.answer-input {
  font-family: 'Fraunces', serif;
  font-size: clamp(22px, 4vw, 27px);
  font-weight: 400;
  text-align: center;
  border-radius: 12px;
  background: #FFFFFF;
  padding: 8px 12px;
  outline: none;
  border: none;
  color: #0E0E10;
  transition: all 0.2s;
  box-shadow: 0 6px 16px -6px rgba(58, 53, 48, 0.14);
}
.answer-input:focus {
  box-shadow: 0 10px 22px -6px rgba(255, 79, 40, 0.30), 0 0 0 1px rgba(255, 79, 40, 0.20);
}
.answer-input.correct {
  background: #E3F0E8;
  color: #1F7A4D;
  box-shadow: 0 8px 20px -6px rgba(31, 122, 77, 0.30);
}
.answer-input.wrong {
  background: #FFE8E1;
  color: #FF4F28;
  box-shadow: 0 8px 20px -6px rgba(255, 79, 40, 0.36);
}

.frame {
  background: #FFFFFF;
  border-radius: 16px;
  padding: clamp(17px, 3.4vw, 30px);
  border: none;
  box-shadow: 0 8px 22px -6px rgba(58, 53, 48, 0.14);
}
.frame-soft {
  background: #FFE8E1;
  border-left: 4px solid #FF4F28;
  border-radius: 12px;
  padding: clamp(14px, 2.5vw, 20px);
  box-shadow: 0 6px 16px -6px rgba(255, 79, 40, 0.22);
}
.frame-success {
  background: #E3F0E8;
  border-left: 4px solid #1F7A4D;
  border-radius: 12px;
  padding: clamp(14px, 2.5vw, 20px);
  box-shadow: 0 6px 16px -6px rgba(31, 122, 77, 0.22);
}

.lang-switch {
  position: fixed;
  top: 12px;
  right: 12px;
  z-index: 100;
  display: flex;
  gap: 4px;
  background: #FFFFFF;
  border-radius: 99px;
  padding: 3px;
  box-shadow: 0 3px 9px -4px rgba(58, 53, 48, 0.16), 0 1px 3px -1px rgba(58, 53, 48, 0.10);
}
.lang-btn {
  font-family: 'JetBrains Mono', monospace;
  font-size: 12px;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 99px;
  border: none;
  background: transparent;
  color: #5A5A60;
  cursor: pointer;
  transition: all 0.15s;
  letter-spacing: 0.06em;
}
.lang-btn.active { background: #0E0E10; color: #F6F4EF; }
.lang-btn:hover:not(.active) { color: #0E0E10; }

@keyframes mb-pop-in { from { opacity: 0; transform: translateY(6px) scale(0.9); } to { opacity: 1; transform: none; } }
.mb-pop { display: inline-block; animation: mb-pop-in 0.32s ease-out both; }
.mb-work { display: flex; flex-direction: column; gap: 8px; align-items: center; width: 100%; }
.mb-work-title { font-weight: 600; letter-spacing: 0.04em; }
.mb-work-chips { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; }
.mb-chip { background: #FFFFFF; border-radius: 10px; padding: 6px 10px; font-size: clamp(13px, 1.7vw, 15px); box-shadow: 0 4px 12px -6px rgba(58, 53, 48, 0.16); white-space: nowrap; }
.mb-carry { font-size: 0.6em; margin-left: 1px; font-weight: 700; }

.hint-toggle { background: transparent; border: 1px dashed rgba(58, 53, 48, 0.28); border-radius: 10px; padding: 8px 14px; font-size: clamp(12px, 1.5vw, 13px); font-weight: 600; color: #B25A1E; cursor: pointer; transition: all 0.15s; }
.hint-toggle:hover { border-color: rgba(178, 90, 30, 0.6); }
.sol-replay { background: #FFFFFF; border: 1px solid rgba(58, 53, 48, 0.14); border-radius: 99px; padding: 6px 12px; font-size: 12px; font-weight: 600; color: #5A5A60; cursor: pointer; transition: color 0.15s; }
.sol-replay:hover { color: #0E0E10; }
/* LESSON: анимация появления цифры в квадрате. */
.cell-pop { display: inline-block; animation: cellPop 0.34s cubic-bezier(0.34, 1.2, 0.64, 1); }
@keyframes cellPop { 0% { opacity: 0; transform: scale(0.4) translateY(-6px); } 100% { opacity: 1; transform: scale(1) translateY(0); } }
`;