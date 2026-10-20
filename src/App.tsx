import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation, useParams } from 'react-router-dom';
import { AuthProvider, RequireAuth } from './lib/auth';
import Landing from './pages/Landing';
import AuthPage from './pages/Auth';
import AppLayout from './components/AppLayout';
import Dashboard from './pages/Dashboard';
import Practice from './pages/Practice';
import { ModeRunner, LessonRunner } from './pages/Runner';
import Lessons from './pages/Lessons';
import ResultPage from './pages/Result';
import Profile from './pages/Profile';
import Game from './pages/Game';
import NotFound from './pages/NotFound';
import CertLanding from './pages/CertLanding';
import Verify from './pages/Verify';
import CertRegister from './pages/CertRegister';
import CertTest from './pages/CertTest';
import CertResult from './pages/CertResult';
import MyCertificates from './pages/MyCertificates';
import Admin from './pages/Admin';

function ScrollTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function KeyedMode() {
  const { modeId } = useParams();
  return <ModeRunner key={modeId} />;
}

function KeyedLesson() {
  const { lessonId } = useParams();
  return <LessonRunner key={lessonId} />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollTop />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<AuthPage mode="login" key="login" />} />
          <Route path="/signup" element={<AuthPage mode="signup" key="signup" />} />
          <Route path="/certification" element={<CertLanding />} />
          <Route path="/verify" element={<Verify key="verify" />} />
          <Route path="/verify/:code" element={<Verify />} />
          <Route
            path="/app"
            element={
              <RequireAuth>
                <AppLayout />
              </RequireAuth>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="practice" element={<Practice />} />
            <Route path="practice/:modeId" element={<KeyedMode />} />
            <Route path="lessons" element={<Lessons />} />
            <Route path="lessons/:lessonId" element={<KeyedLesson />} />
            <Route path="game" element={<Game />} />
            <Route path="result/:id" element={<ResultPage />} />
            <Route path="profile" element={<Profile />} />
            <Route path="certificates" element={<MyCertificates />} />
            <Route path="certification/register" element={<CertRegister />} />
            <Route path="certification/test/:regId" element={<CertTest />} />
            <Route path="certification/result/:id" element={<CertResult />} />
            <Route path="admin" element={<Admin />} />
            <Route path="*" element={<NotFound inApp />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
