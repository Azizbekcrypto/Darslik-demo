import { Routes, Route, useNavigate } from 'react-router-dom';

import HomePage from './components/HomePage';
import InternetLesson from './components/Internestlesson';
import HtmlLesson from './components/Htmllesson1';
import HtmlLesson2 from './components/Htmllesson2';
import CssLesson from './components/Csslesson1';
import CssLesson2 from './components/Csslesson2';
import PortfolioStruktura from './components/PractisHTML';
import PortfolioCss from './components/PractisCSS';
import DivisionLesson from './components/DivisionLesson';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />

      <Route
        path="/lesson/1"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <InternetLesson />
          </div>
        }
      />

      <Route
        path="/lesson/2"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <HtmlLesson />
          </div>
        }
      />
      <Route
        path="/lesson/3"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <HtmlLesson2 />
          </div>
        }
      />
      <Route
        path="/lesson/4"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <CssLesson />
          </div>
        }
      />
      <Route
        path="/lesson/5"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <CssLesson2 />
          </div>
        }
      />
      <Route
        path="/lesson/6"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <PortfolioStruktura />
          </div>
        }
      />
      <Route
        path="/lesson/7"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <PortfolioCss />
          </div>
        }
      />
       <Route
        path="/lesson/8"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <DivisionLesson />
          </div>
        }
      />
    </Routes>
  );
}

function BackButton() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/')}
      title="Bosh sahifaga qaytish"
      style={{
        position: 'fixed',
        top: 18,
        left: 20,
        zIndex: 9999,
        background: 'rgba(245,240,235,0.92)',
        backdropFilter: 'blur(8px)',
        border: '1.5px solid #d8d0c8',
        borderRadius: 10,
        padding: '7px 16px 7px 12px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 13,
        fontFamily: 'sans-serif',
        color: '#444',
        letterSpacing: '0.04em',
        boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
        transition: 'all 0.15s ease',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#e05a2b';
        e.currentTarget.style.color = '#e05a2b';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#d8d0c8';
        e.currentTarget.style.color = '#444';
      }}
    >
      <div
        style={{
          width: 22,
          height: 22,
          background: '#e05a2b',
          borderRadius: 5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <span
          style={{
            color: '#fff',
            fontWeight: 700,
            fontSize: 12,
          }}
        >
          C
        </span>
      </div>

      <span style={{ fontWeight: 600 }}>CODDYCAMP</span>
    </button>
  );
}

export default App;
