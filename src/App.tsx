import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { MainLayout } from './components/layout/MainLayout';
import Dashboard from './components/pages/Dashboard/Dashboard';
import LabsPage from './components/pages/Labs/LabsPage';
import PCsPage from './components/pages/PCs/PCsPage';
import SoftwarePage from './components/pages/Software/SoftwarePage';
import TimetablePage from './components/pages/Timetable/TimetablePage';
import ClassesPage from './components/pages/Classes/ClassesPage';
import FacultyPage from './components/pages/Faculty/FacultyPage';
import SettingsPage from './components/pages/Settings/SettingsPage';
import AdminDashboard from './components/pages/Admin/AdminDashboard';
import StudentView from './components/pages/Student/StudentView';
import StudentLabDetail from './components/pages/Student/StudentLabDetail';
import AnimatedLoginPage from './components/ui/animated-characters-login-page';
import './App.css';

type UserRole = 'student' | 'labAssistant' | 'faculty' | 'admin';

const AppShell: React.FC = () => {
  const { isAuthenticated, login, loginAsAdmin, role } = useAuth();

  const handleLoginSuccess = ({ email, role: loginRole }: { email: string; role: UserRole }) => {
    if (loginRole === 'admin') {
      loginAsAdmin(email);
    } else {
      login(email, loginRole);
    }
  };

  // Not authenticated → show login/selector screen
  if (!isAuthenticated) {
    return <AnimatedLoginPage onLoginSuccess={handleLoginSuccess} />;
  }

  // Student role → dedicated student UI (no MainLayout)
  if (role === 'student') {
    return (
      <Router>
        <Routes>
          <Route path="/" element={<StudentView />} />
          <Route path="/lab/:labNo" element={<StudentLabDetail />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    );
  }

  // Staff / Admin → full layout with sidebar
  return (
    <Router>
      <MainLayout>
        <Routes>
          {role === 'admin' && <Route path="/" element={<AdminDashboard />} />}
          {role === 'admin' && <Route path="/admin" element={<AdminDashboard />} />}
          {role !== 'admin' && <Route path="/" element={<Dashboard />} />}
          <Route path="/labs" element={<LabsPage />} />
          <Route path="/pcs" element={<PCsPage />} />
          <Route path="/software" element={<SoftwarePage />} />
          <Route path="/timetable" element={<TimetablePage />} />
          <Route path="/classes" element={<ClassesPage />} />
          <Route path="/faculty" element={<FacultyPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </MainLayout>
    </Router>
  );
};

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <AppShell />
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
