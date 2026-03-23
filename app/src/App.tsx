import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './lib/auth'
import { Navigation } from './components/Navigation'
import { Sidebar, MobileDrawer } from './components/Sidebar'
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
import { News } from './pages/News'
import { DispatchIntel } from './pages/DispatchIntel'
import { Metrics } from './pages/Metrics'
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
    <div className="h-full flex bg-slate-50">
      {/* Desktop sidebar */}
      <Sidebar />

      {/* Main content column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header with hamburger */}
        <div className="md:hidden flex items-center gap-2 px-3 py-2 bg-white border-b border-slate-200 safe-top">
          <MobileDrawer />
          <span className="text-sm font-bold text-slate-800">PORTPAL</span>
        </div>

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
            <Route path="/news" element={<News />} />
            <Route path="/dispatch" element={<DispatchIntel />} />
          </Routes>
        </div>

        {/* Bottom navigation — mobile only */}
        <div className="md:hidden">
          <Navigation />
        </div>
      </div>
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
        <Route path="/metrics" element={<Metrics />} />
        <Route path="/command-center" element={<CommandCenter />} />
        <Route path="/*" element={<MobileApp />} />
      </Routes>
    </HashRouter>
  )
}

export default App
