import { Routes, Route, useNavigate } from 'react-router-dom';

import HomePage from './components/HomePage';
import InternetLesson from './components/1-Modull/InternetLesson';
import HtmlLesson from './components/1-Modull/Htmllesson1';
import HtmlLesson2 from './components/1-Modull/Htmllesson2';
import CssLesson1 from './components/1-Modull/CssLesson1';
import CssLesson2 from './components/1-Modull/CssLesson2';
import HtmlPractice from './components/1-Modull/HtmlPractice';
import CssPractice from './components/1-Modull/CssPractice';
import GitLesson from './components/1-Modull/GitLesson';
import DeployLesson from './components/1-Modull/DeployLesson';
import PmLesson1 from './components/1-Modull/PmLesson1';
import PmLesson2 from './components/1-Modull/PmLesson2';
import PmLesson3 from './components/1-Modull/PmLesson3';
import JsIntroLesson from './components/2-Modull/JsIntroLesson';
import JsVarsLesson from './components/2-Modull/JsVarsLesson';
import JsConditionsLesson from './components/2-Modull/JsConditionsLesson';
import JsLoopsLesson from './components/2-Modull/JsLoopsLesson';
import JsFunctionsLesson from './components/2-Modull/JsFunctionsLesson';
import PracticeLesson1 from './components/2-Modull/PracticeLesson1';
import PracticeLesson2 from './components/2-Modull/PracticeLesson2';
import PeanStackLesson from './components/2-Modull/PeanStackLesson';
import PracticeLesson3 from './components/2-Modull/PracticeLesson3';
import PracticeLesson4 from './components/2-Modull/PracticeLesson4';
import PmLesson4 from './components/2-Modull/PmLesson4';
import PmLesson5 from './components/2-Modull/PmLesson5';
import PmLesson6 from './components/2-Modull/PmLesson6';
import PmLesson7 from './components/3-Modull/PmLesson7';
import PmLesson8 from './components/3-Modull/PmLesson8';
import PmLesson9 from './components/3-Modull/PmLesson9';
import PmLesson10 from './components/3-Modull/PmLesson10';
import ReactIntroLesson from './components/3-Modull/ReactIntroLesson';
import ReactFirstComponentLesson from './components/3-Modull/ReactFirstComponentLesson';
import ReactStateEffectLesson from './components/3-Modull/ReactStateEffectLesson';
import ReactPropsReuseLesson from './components/3-Modull/ReactPropsReuseLesson';
import ReactApiGetLesson from './components/3-Modull/ReactApiGetLesson';
import ReactApiPostLesson from './components/3-Modull/ReactApiPostLesson';
import ReactCrudPracticeLesson from './components/3-Modull/ReactCrudPracticeLesson';
import ReactRouterPracticeLesson from './components/3-Modull/ReactRouterPracticeLesson';
import ReactProjectDayLesson from './components/3-Modull/ReactProjectDayLesson';
import ReactBuildSiteLesson from './components/3-Modull/ReactBuildSiteLesson';
import PmLesson11 from './components/4-Modull/PmLesson11';
import PmLesson12 from './components/4-Modull/PmLesson12';
import PmLesson13 from './components/4-Modull/PmLesson13';
import PmLesson14 from './components/4-Modull/PmLesson14';
import DataIntroLesson from './components/4-Modull/DataIntroLesson';
import DbSqlNosqlLesson from './components/4-Modull/DbSqlNosqlLesson';
import NodeServerLesson from './components/4-Modull/NodeServerLesson';
import RoutingLesson from './components/4-Modull/RoutingLesson';
import PostgresCrudLesson from './components/4-Modull/PostgresCrudLesson';
import ApiPostmanLesson from './components/4-Modull/ApiPostmanLesson';
import AuthEnvLesson from './components/4-Modull/AuthEnvLesson';
import BackendCrudPracticeLesson from './components/4-Modull/BackendCrudPracticeLesson';
import FullstackConnectPracticeLesson from './components/4-Modull/FullstackConnectPracticeLesson';
import FullstackProjectDayLesson from './components/4-Modull/FullstackProjectDayLesson';
import FullstackFeedbackLesson from './components/4-Modull/FullstackFeedbackLesson';
import PmLesson15 from './components/4a-Modull/PmLesson15';
import NestArchAliveLesson from './components/4a-Modull/NestArchAliveLesson';
import NestArchResourceLesson from './components/4a-Modull/NestArchResourceLesson';
import NestArchPracticeLesson from './components/4a-Modull/NestArchPracticeLesson';
import PmLesson16 from './components/4b-Modull/PmLesson16';
import JestUnitTestLesson from './components/4b-Modull/JestUnitTestLesson';
import EdgeCasesTestLesson from './components/4b-Modull/EdgeCasesTestLesson';
import CiCdIntroLesson from './components/4c-Modull/CiCdIntroLesson';
import PmLesson17 from './components/4c-Modull/PmLesson17';
import GithubActionsLesson from './components/4c-Modull/GithubActionsLesson';
import FullPipelineProjectLesson from './components/4c-Modull/FullPipelineProjectLesson';
import AiPipelineProjectLesson from './components/4c-Modull/AiPipelineProjectLesson';
import PmLesson18 from './components/4c-Modull/PmLesson18';
import FullProPipelineLesson from './components/4c-Modull/FullProPipelineLesson';
import BotIntroLesson from './components/5-Modull/BotIntroLesson';
import PmLesson19 from './components/5-Modull/PmLesson19';
import BotApiButtonsLesson from './components/5-Modull/BotApiButtonsLesson';
import BotAiProjectLesson from './components/5-Modull/BotAiProjectLesson';
import BotAiBrainLesson from './components/5-Modull/BotAiBrainLesson';
import BotStatefulMemoryLesson from './components/5-Modull/BotStatefulMemoryLesson';
import BotFullProjectLesson from './components/5-Modull/BotFullProjectLesson';
import PmLesson20 from './components/5-Modull/PmLesson20';
import BotFeedbackIterationLesson from './components/5-Modull/BotFeedbackIterationLesson';
import BotAiAgentLesson from './components/5-Modull/BotAiAgentLesson';
import PmLesson21 from './components/5-Modull/PmLesson21';
import SystemArchitectureLesson from './components/6-Modull/SystemArchitectureLesson';
import ArchPatternsLesson from './components/6-Modull/ArchPatternsLesson';
import AgentArchitectureLesson from './components/6-Modull/AgentArchitectureLesson';
import ClaudeSkillsLesson from './components/6-Modull/ClaudeSkillsLesson';
import WriteSkillLesson from './components/6-Modull/WriteSkillLesson';
import ReactNativeBasicsLesson from './components/6-Modull/ReactNativeBasicsLesson';
import ReactNativeAppLesson from './components/6-Modull/ReactNativeAppLesson';
import PipelineProjectLesson from './components/6-Modull/PipelineProjectLesson';
import MobileAppPracticeLesson from './components/6-Modull/MobileAppPracticeLesson';
import FullSystemProjectLesson from './components/6-Modull/FullSystemProjectLesson';
import PmLesson22 from './components/6-Modull/PmLesson22';
import PmLesson23 from './components/6-Modull/PmLesson23';
import PmLesson24 from './components/6-Modull/PmLesson24';
import PmLesson25 from './components/6-Modull/PmLesson25';


function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />

      <Route
        path="/lesson/0"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <InternetLesson />
          </div>
        }
      />

      <Route
        path="/lesson/1"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <PmLesson1 />
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
            <PmLesson2 />
          </div>
        }
      />

      <Route
        path="/lesson/5"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <CssLesson1 />
          </div>
        }
      />

      <Route
        path="/lesson/6"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <CssLesson2 />
          </div>
        }
      />

      <Route
        path="/lesson/7"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <HtmlPractice />
          </div>
        }
      />

      <Route
        path="/lesson/8"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <GitLesson />
          </div>
        }
      />

      <Route
        path="/lesson/9"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <CssPractice />
          </div>
        }
      />

      <Route
        path="/lesson/10"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <DeployLesson />
          </div>
        }
      />

      <Route
        path="/lesson/11"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <PmLesson3 />
          </div>
        }
      />

      <Route
        path="/lesson/12"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <JsIntroLesson />
          </div>
        }
      />

      <Route
        path="/lesson/13"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <PmLesson4 />
          </div>
        }
      />

      <Route
        path="/lesson/14"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <JsVarsLesson />
          </div>
        }
      />

      <Route
        path="/lesson/15"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <JsConditionsLesson />
          </div>
        }
      />

      <Route
        path="/lesson/16"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <JsLoopsLesson />
          </div>
        }
      />

      <Route
        path="/lesson/17"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <JsFunctionsLesson />
          </div>
        }
      />

      <Route
        path="/lesson/18"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <PmLesson5 />
          </div>
        }
      />

      <Route
        path="/lesson/19"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <PracticeLesson1 />
          </div>
        }
      />

      <Route
        path="/lesson/20"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <PracticeLesson2 />
          </div>
        }
      />

      <Route
        path="/lesson/21"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <PeanStackLesson />
          </div>
        }
      />

      <Route
        path="/lesson/22"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <PracticeLesson3 />
          </div>
        }
      />

      <Route
        path="/lesson/23"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <PracticeLesson4 />
          </div>
        }
      />

      <Route
        path="/lesson/24"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <PmLesson6 />
          </div>
        }
      />

      <Route
        path="/lesson/25"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <ReactIntroLesson />
          </div>
        }
      />

      <Route
        path="/lesson/26"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <PmLesson7 />
          </div>
        }
      />

      <Route
        path="/lesson/27"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <ReactFirstComponentLesson />
          </div>
        }
      />

      <Route
        path="/lesson/28"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <ReactStateEffectLesson />
          </div>
        }
      />

      <Route
        path="/lesson/29"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <PmLesson8 />
          </div>
        }
      />

      <Route
        path="/lesson/30"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <ReactPropsReuseLesson />
          </div>
        }
      />

      <Route
        path="/lesson/31"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <ReactCrudPracticeLesson />
          </div>
        }
      />

      <Route
        path="/lesson/32"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <ReactApiGetLesson />
          </div>
        }
      />

      <Route
        path="/lesson/33"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <ReactApiPostLesson />
          </div>
        }
      />

      <Route
        path="/lesson/34"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <PmLesson9 />
          </div>
        }
      />

      <Route
        path="/lesson/35"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <ReactRouterPracticeLesson />
          </div>
        }
      />

      <Route
        path="/lesson/36"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <ReactProjectDayLesson />
          </div>
        }
      />

      <Route
        path="/lesson/37"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <ReactBuildSiteLesson />
          </div>
        }
      />

      <Route
        path="/lesson/38"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <PmLesson10 />
          </div>
        }
      />

      <Route
        path="/lesson/39"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <DataIntroLesson />
          </div>
        }
      />

      <Route
        path="/lesson/40"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <PmLesson11 />
          </div>
        }
      />

      <Route
        path="/lesson/41"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <DbSqlNosqlLesson />
          </div>
        }
      />

      <Route
        path="/lesson/42"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <NodeServerLesson />
          </div>
        }
      />

      <Route
        path="/lesson/43"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <RoutingLesson />
          </div>
        }
      />

      <Route
        path="/lesson/44"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <PostgresCrudLesson />
          </div>
        }
      />

      <Route
        path="/lesson/45"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <PmLesson12 />
          </div>
        }
      />

      <Route
        path="/lesson/46"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <BackendCrudPracticeLesson />
          </div>
        }
      />

      <Route
        path="/lesson/47"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <ApiPostmanLesson />
          </div>
        }
      />

      <Route
        path="/lesson/48"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <FullstackConnectPracticeLesson />
          </div>
        }
      />

      <Route
        path="/lesson/49"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <AuthEnvLesson />
          </div>
        }
      />

      <Route
        path="/lesson/50"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <PmLesson13 />
          </div>
        }
      />

      <Route
        path="/lesson/51"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <FullstackProjectDayLesson />
          </div>
        }
      />

      <Route
        path="/lesson/52"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <FullstackFeedbackLesson />
          </div>
        }
      />

      <Route
        path="/lesson/53"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <PmLesson14 />
          </div>
        }
      />

      <Route
        path="/lesson/54"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <NestArchAliveLesson />
          </div>
        }
      />

      <Route
        path="/lesson/55"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <PmLesson15 />
          </div>
        }
      />

      <Route
        path="/lesson/56"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <NestArchResourceLesson />
          </div>
        }
      />

      <Route
        path="/lesson/57"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <NestArchPracticeLesson />
          </div>
        }
      />

      <Route
        path="/lesson/58"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <JestUnitTestLesson />
          </div>
        }
      />

      <Route
        path="/lesson/59"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <PmLesson16 />
          </div>
        }
      />

      <Route
        path="/lesson/60"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <EdgeCasesTestLesson />
          </div>
        }
      />

      <Route
        path="/lesson/61"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <CiCdIntroLesson />
          </div>
        }
      />

      <Route
        path="/lesson/62"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <PmLesson17 />
          </div>
        }
      />

      <Route
        path="/lesson/63"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <GithubActionsLesson />
          </div>
        }
      />

      <Route
        path="/lesson/64"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <FullPipelineProjectLesson />
          </div>
        }
      />

      <Route
        path="/lesson/65"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <AiPipelineProjectLesson />
          </div>
        }
      />

      <Route
        path="/lesson/66"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <PmLesson18 />
          </div>
        }
      />

      <Route
        path="/lesson/67"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <FullProPipelineLesson />
          </div>
        }
      />

      <Route
        path="/lesson/68"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <BotIntroLesson />
          </div>
        }
      />

      <Route
        path="/lesson/69"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <PmLesson19 />
          </div>
        }
      />

      <Route
        path="/lesson/70"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <BotApiButtonsLesson />
          </div>
        }
      />

      <Route
        path="/lesson/71"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <BotStatefulMemoryLesson />
          </div>
        }
      />

      <Route
        path="/lesson/72"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <BotAiProjectLesson />
          </div>
        }
      />

      <Route
        path="/lesson/73"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <BotAiBrainLesson />
          </div>
        }
      />

      <Route
        path="/lesson/74"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <BotFullProjectLesson />
          </div>
        }
      />

      <Route
        path="/lesson/75"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <PmLesson20 />
          </div>
        }
      />

      <Route
        path="/lesson/76"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <BotFeedbackIterationLesson />
          </div>
        }
      />

      <Route
        path="/lesson/77"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <BotAiAgentLesson />
          </div>
        }
      />

      <Route
        path="/lesson/78"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <PmLesson21 />
          </div>
        }
      />

      <Route
        path="/lesson/79"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <SystemArchitectureLesson />
          </div>
        }
      />

      <Route
        path="/lesson/80"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <PmLesson22 />
          </div>
        }
      />

      <Route
        path="/lesson/81"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <ArchPatternsLesson />
          </div>
        }
      />

      <Route
        path="/lesson/82"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <AgentArchitectureLesson />
          </div>
        }
      />

      <Route
        path="/lesson/83"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <ClaudeSkillsLesson />
          </div>
        }
      />

      <Route
        path="/lesson/84"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <PmLesson23 />
          </div>
        }
      />

      <Route
        path="/lesson/85"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <WriteSkillLesson />
          </div>
        }
      />

      <Route
        path="/lesson/86"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <PipelineProjectLesson />
          </div>
        }
      />

      <Route
        path="/lesson/87"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <ReactNativeBasicsLesson />
          </div>
        }
      />

      <Route
        path="/lesson/88"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <ReactNativeAppLesson />
          </div>
        }
      />

      <Route
        path="/lesson/89"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <MobileAppPracticeLesson />
          </div>
        }
      />

      <Route
        path="/lesson/90"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <PmLesson24 />
          </div>
        }
      />

      <Route
        path="/lesson/91"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <FullSystemProjectLesson />
          </div>
        }
      />

      <Route
        path="/lesson/92"
        element={
          <div style={{ position: 'relative' }}>
            <BackButton />
            <PmLesson25 />
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
