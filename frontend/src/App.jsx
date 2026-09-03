import React, { useState } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ErrorBoundary } from './components/ErrorBoundary';

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
import { DatasetIntelligencePage } from './pages/DatasetIntelligencePage';

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
          {activeTab === 'datasets' && <DatasetIntelligencePage />}
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
