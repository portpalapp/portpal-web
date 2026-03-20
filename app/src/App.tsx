import { HashRouter, Routes, Route } from 'react-router-dom'
import { Navigation } from './components/Navigation'
import { Home } from './pages/Home'
import { Shifts } from './pages/Shifts'
import { Calendar } from './pages/Calendar'
import { Analytics } from './pages/Analytics'
import { Chat } from './pages/Chat'
import { Subscribe } from './pages/Subscribe'
import { Landing } from './pages/Landing'
import { Dashboard } from './pages/Dashboard'
import { CommandCenter } from './pages/CommandCenter'
import { SocialPreview } from './social/SocialPreview'
import { InstagramMockup } from './social/InstagramMockup'

function MobileApp() {
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
          <Route path="/subscribe" element={<Subscribe />} />
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
