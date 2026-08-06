import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import Home from './pages/Home';
import Analyzer from './pages/Analyzer';
import Results from './pages/Results';
import Dashboard from './pages/Dashboard';
import ScamGuide from './pages/ScamGuide';
import Radar from './pages/Radar';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import CheckRecruiter from './pages/CheckRecruiter';
import OfferDna from './pages/OfferDna';
import MyReports from './pages/MyReports';
import EmergencyHelp from './pages/EmergencyHelp';
import BrowserCopilot from './pages/BrowserCopilot';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      navigateToLogin();
      return null;
    }
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/analyzer" element={<Analyzer />} />
      <Route path="/results/:id" element={<Results />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/guide" element={<ScamGuide />} />
      <Route path="/radar" element={<Radar />} />
      <Route path="/check-recruiter" element={<CheckRecruiter />} />
      <Route path="/offer-dna" element={<OfferDna />} />
      <Route path="/my-reports" element={<MyReports />} />
      <Route path="/emergency-help" element={<EmergencyHelp />} />
      <Route path="/browser-copilot" element={<BrowserCopilot />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
