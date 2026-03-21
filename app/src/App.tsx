import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './lib/auth'
import { Navigation } from './components/Navigation'
import { Home } from './pages/Home'
import { Shifts } from './pages/Shifts'
import { Calendar } from './pages/Calendar'
import { Analytics } from './pages/Analytics'
import { Chat } from './pages/Chat'
import { Contract } from './pages/Contract'
import { Subscribe } from './pages/Subscribe'
import { Landing } from './pages/Landing'
import { Login } from './pages/Login'
import { Migrate } from './pages/Migrate'
import { Onboarding } from './pages/Onboarding'
import { Dashboard } from './pages/Dashboard'
import { CommandCenter } from './pages/CommandCenter'
import { Holidays } from './pages/Holidays'
import { Pension } from './pages/Pension'
import { Profile } from './pages/Profile'
import { TemplateBuilder } from './pages/TemplateBuilder'
import { Vessels } from './pages/Vessels'
import { PayStubs } from './pages/PayStubs'
import { SocialPreview } from './social/SocialPreview'
import { InstagramMockup } from './social/InstagramMockup'

function MobileApp() {
  const { session, loading, demoMode } = useAuth();

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  // Redirect to login if not authenticated and not in demo mode
  if (!session && !demoMode) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="h-full flex flex-col bg-slate-50">
      {/* Status bar spacer — respects device safe area */}
      <div className="safe-top bg-slate-50" />

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto no-scrollbar">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shifts" element={<Shifts />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/holidays" element={<Holidays />} />
          <Route path="/pension" element={<Pension />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/subscribe" element={<Subscribe />} />
          <Route path="/template-builder" element={<TemplateBuilder />} />
          <Route path="/vessels" element={<Vessels />} />
          <Route path="/pay-stubs" element={<PayStubs />} />
          <Route path="/contract" element={<Contract />} />
        </Routes>
      </div>

      {/* Bottom navigation — respects device safe area */}
      <Navigation />
    </div>
  )
}

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/landing" element={<Landing />} />
        <Route path="/signup" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/migrate" element={<Migrate />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="/social" element={<SocialPreview />} />
        <Route path="/instagram" element={<InstagramMockup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/command-center" element={<CommandCenter />} />
        <Route path="/*" element={<MobileApp />} />
      </Routes>
    </HashRouter>
  )
}

export default App
