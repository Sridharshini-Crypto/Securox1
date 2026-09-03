import React, { useState, Component } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ShieldAlert, RefreshCw } from 'lucide-react';

import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { AttackSimulatorModal } from './components/AttackSimulatorModal';
import { StepUpAuthModal } from './components/StepUpAuthModal';

import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { TrafficManagementPage } from './pages/TrafficManagementPage';
import { MunicipalServicesPage } from './pages/MunicipalServicesPage';
import { PaymentPortalPage } from './pages/PaymentPortalPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { SecurityLogsPage } from './pages/SecurityLogsPage';
import { MlAnomalyPage } from './pages/MlAnomalyPage';

// Inlined ErrorBoundary for client-side crash recovery
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Securox ErrorBoundary caught:", error, errorInfo);
  }

  handleReset = () => {
    localStorage.removeItem('securox_token');
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#07111F] text-white flex items-center justify-center p-6 font-sans">
          <div className="max-w-xl w-full p-8 rounded-3xl bg-[#0B1728] border border-slate-800 shadow-2xl space-y-6">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="p-3 rounded-2xl bg-rose-500/10">
                <ShieldAlert className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white font-mono">Securox Portal Diagnostics</h1>
                <p className="text-xs text-slate-400 font-mono">Interface render recovery layer</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-black/60 border border-slate-800 text-xs font-mono text-rose-300 overflow-x-auto">
              <div className="font-bold">Error: {this.state.error?.toString()}</div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button
                onClick={this.handleReset}
                className="px-5 py-2.5 rounded-xl bg-[#0B4EA2] hover:bg-[#0B4EA2]/90 text-white font-bold text-xs font-mono flex items-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reset Session &amp; Reload</span>
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const MainLayout = () => {
  const { isAuthenticated } = useAuth();
  const [publicView, setPublicView] = useState('landing'); // 'landing' or 'login'
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  // If not authenticated: show Landing Page or Login/Register Gateway
  if (!isAuthenticated) {
    if (publicView === 'login') {
      return <LoginPage onBackToLanding={() => setPublicView('landing')} />;
    }
    return (
      <LandingPage 
        onEnterLogin={() => setPublicView('login')} 
        onEnterRegister={() => setPublicView('login')} 
      />
    );
  }

  // Once authenticated: show Full Working Portal Workspace
  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#080D1A] text-slate-900 dark:text-slate-100 flex flex-col transition-colors duration-200">
      
      {/* Top Sovereign Navigation */}
      <Navbar onOpenSimulator={() => setIsSimulatorOpen(true)} />

      {/* Main Content Area */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        
        {/* Left Sidebar */}
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Dynamic Page View */}
        <main className="flex-1 p-6 overflow-y-auto">
          {activeTab === 'dashboard' && <DashboardPage onOpenSimulator={() => setIsSimulatorOpen(true)} />}
          {activeTab === 'traffic' && <TrafficManagementPage />}
          {activeTab === 'municipal' && <MunicipalServicesPage />}
          {activeTab === 'payment' && <PaymentPortalPage />}
          {activeTab === 'users' && <UserManagementPage />}
          {activeTab === 'logs' && <SecurityLogsPage />}
          {activeTab === 'ml' && <MlAnomalyPage />}
        </main>

      </div>

      {/* Interactive Global Modals */}
      <AttackSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
      />
      <StepUpAuthModal />

    </div>
  );
};

export function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <MainLayout />
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
