import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const lessons = [
  {
    id: 1,
    number: '01',
    title: 'Internet bu nima',
    subtitle: "Brauzer - IP",
    screens: 13,
    emoji: '½',
    ready: true,
  },
  {
    id: 2,
    number: '01',
    title: 'Html 1-lesson',
    subtitle: '',
    screens: 16,
    emoji: '123',
    ready: true,
  },
  {
    id: 3,
    number: '02',
    title: 'Html 2-lesson',
    subtitle: '',
    screens: 17,
    emoji: '123',
    ready: true,
  },
  {
    id: 4,
    number: '01',
    title: 'Css 1-lesson',
    subtitle: '',
    screens: 17,
    emoji: '123',
    ready: true,
  },
  {
    id: 5,
    number: '02',
    title: 'Css 2-lesson',
    subtitle: '',
    screens: 17,
    emoji: '123',
    ready: true,
  },
  {
    id: 6,
    number: '01',
    title: 'HTML Practis',
    subtitle: '',
    screens: 17,
    emoji: '123',
    ready: true,
  },
  {
    id: 7,
    number: '02',
    title: 'Css Practis',
    subtitle: '',
    screens: 17,
    emoji: '123',
    ready: true,
  },
]

const INK = '#1a1a1a'
const INK_SOFT = '#6b6b6b'
const INK_FAINT = '#a0a0a0'
const BORDER = '#eaeaea'
const ACCENT = '#e05a2b'
const SERIF = 'Georgia, "Times New Roman", serif'
const SANS = '-apple-system, "Helvetica Neue", Arial, sans-serif'

export default function HomePage({ onSelectLesson }) {
  const [hovered, setHovered] = useState(null)
  const navigate = useNavigate()

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#ffffff',
        color: INK,
        fontFamily: SERIF,
        paddingBottom: 96,
      }}
    >
      <style>{`
        @keyframes ccUp   { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:none; } }
        @keyframes ccFade { from { opacity:0; } to { opacity:1; } }
        @keyframes ccSlide{ from { opacity:0; transform:translateX(-52px); } to { opacity:1; transform:none; } }
        @keyframes ccLine { from { transform:scaleX(0); } to { transform:scaleX(1); } }

        .cc-up   { opacity:0; animation:ccUp   .8s cubic-bezier(.2,.7,.2,1) forwards; }
        .cc-fade { opacity:0; animation:ccFade 1s ease forwards; }
        .cc-slide{ opacity:0; animation:ccSlide .85s cubic-bezier(.18,.7,.2,1) forwards; }
        .cc-line { transform:scaleX(0); transform-origin:left; animation:ccLine .7s cubic-bezier(.2,.7,.2,1) forwards; }

        .cc ::selection { background:${ACCENT}; color:#fff; }
        .cc-card .cc-arrow { display:inline-block; transition:transform .35s cubic-bezier(.2,.7,.2,1); }
        .cc-card:hover .cc-arrow { transform:translateX(6px); }
      `}</style>

      <div className="cc">
        {/* HEADER */}
        <header
          className="cc-fade"
          style={{
            borderBottom: `1px solid ${BORDER}`,
            padding: '24px clamp(24px,6vw,64px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 13 }}>
            <div
              style={{
                width: 34,
                height: 34,
                background: ACCENT,
                borderRadius: 8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 15, fontFamily: SANS }}>C</span>
            </div>
            <span
              style={{
                fontSize: 14,
                letterSpacing: '0.2em',
                textTransform: 'uppercase',
                color: INK,
                fontFamily: SANS,
                fontWeight: 600,
              }}
            >
              Coddycamp
            </span>
          </div>
          <span
            style={{
              fontSize: 12,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: INK_FAINT,
              fontFamily: SANS,
            }}
          >
            O'quv darsligi
          </span>
        </header>

        {/* HERO */}
        <section style={{ padding: 'clamp(56px,8vw,84px) clamp(24px,6vw,64px) clamp(40px,5vw,56px)' }}>
          <div
            className="cc-up"
            style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, animationDelay: '.05s' }}
          >
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: ACCENT }} />
            <span
              style={{
                fontSize: 12,
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: ACCENT,
                fontFamily: SANS,
                fontWeight: 600,
              }}
            >
              Interaktiv darslar
            </span>
          </div>

          <h1
            className="cc-up"
            style={{
              fontSize: 'clamp(40px,7vw,76px)',
              fontWeight: 400,
              lineHeight: 1.08,
              margin: '0 0 24px',
              maxWidth: 720,
              animationDelay: '.14s',
            }}
          >
            CODDYCAMP<br />
            <span style={{ color: ACCENT, fontStyle: 'italic' }}>o'quv darsligi</span>
          </h1>

          <p
            className="cc-up"
            style={{
              fontSize: 18,
              color: INK_SOFT,
              fontFamily: SANS,
              lineHeight: 1.7,
              maxWidth: 520,
              margin: 0,
              animationDelay: '.24s',
            }}
          >
            Interaktiv animatsiyalar orqali matematika va ingliz tilini oson va qiziqarli o'rganing.
          </p>
        </section>

        {/* SECTION HEADING — slide in */}
        <div
          style={{
            padding: '0 clamp(24px,6vw,64px)',
            marginBottom: 34,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            gap: 20,
          }}
        >
          <div style={{ overflow: 'hidden' }}>
            <h2
              className="cc-slide"
              style={{
                fontSize: 'clamp(32px,5vw,46px)',
                fontWeight: 400,
                margin: 0,
                lineHeight: 1.1,
                animationDelay: '.32s',
              }}
            >
              Darslar
            </h2>
            <div
              className="cc-line"
              style={{
                height: 3,
                width: 64,
                background: ACCENT,
                borderRadius: 2,
                marginTop: 12,
                animationDelay: '.9s',
              }}
            />
          </div>
          <span
            className="cc-fade"
            style={{
              fontSize: 12,
              letterSpacing: '0.16em',
              textTransform: 'uppercase',
              color: INK_FAINT,
              fontFamily: SANS,
              paddingBottom: 6,
              animationDelay: '.6s',
            }}
          >
            {lessons.length} ta dars
          </span>
        </div>

        {/* CARDS */}
        <div
          style={{
            padding: '0 clamp(24px,6vw,64px)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: 22,
            maxWidth: 1120,
          }}
        >
          {lessons.map((lesson, i) => {
            const on = hovered === lesson.id
            return (
              <article
                key={lesson.id}
                className="cc-card cc-up"
                onClick={() => lesson.ready && navigate(`/lesson/${lesson.id}`)}
                onMouseEnter={() => setHovered(lesson.id)}
                onMouseLeave={() => setHovered(null)}
                style={{
                  background: '#fff',
                  border: `1px solid ${on ? ACCENT : BORDER}`,
                  borderRadius: 14,
                  padding: '32px 32px 28px',
                  cursor: lesson.ready ? 'pointer' : 'default',
                  transition: 'transform .35s cubic-bezier(.2,.7,.2,1), box-shadow .35s ease, border-color .25s ease',
                  transform: on ? 'translateY(-4px)' : 'none',
                  boxShadow: on ? '0 18px 44px -16px rgba(224,90,43,0.28)' : '0 1px 3px rgba(0,0,0,0.04)',
                  animationDelay: `${0.5 + i * 0.12}s`,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 30,
                  }}
                >
                  <span
                    style={{
                      fontSize: 13,
                      letterSpacing: '0.14em',
                      color: ACCENT,
                      fontFamily: SANS,
                      fontWeight: 600,
                    }}
                  >
                    {lesson.number}
                  </span>
                  <span
                    style={{
                      fontSize: 26,
                      color: ACCENT,
                      fontStyle: 'italic',
                      lineHeight: 1,
                      fontFamily: SERIF,
                    }}
                  >
                    {lesson.emoji}
                  </span>
                </div>

                <h3
                  style={{
                    fontSize: 26,
                    fontWeight: 400,
                    lineHeight: 1.2,
                    margin: '0 0 8px',
                  }}
                >
                  {lesson.title}
                </h3>
                <p
                  style={{
                    fontSize: 14,
                    color: INK_SOFT,
                    fontFamily: SANS,
                    lineHeight: 1.6,
                    margin: '0 0 28px',
                  }}
                >
                  {lesson.subtitle}
                </p>

                <div style={{ height: 1, background: BORDER, marginBottom: 18 }} />

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span
                    style={{
                      fontSize: 12,
                      color: INK_FAINT,
                      fontFamily: SANS,
                      letterSpacing: '0.06em',
                    }}
                  >
                    {lesson.screens} ta ekran
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      fontFamily: SANS,
                      fontWeight: 500,
                      color: on ? ACCENT : INK_SOFT,
                      transition: 'color .25s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    Boshlash <span className="cc-arrow">→</span>
                  </span>
                </div>
              </article>
            )
          })}
        </div>
      </div>
    </div>
  )
}