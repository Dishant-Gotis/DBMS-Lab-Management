import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { MainLayout } from './components/layout/MainLayout';
import Dashboard from './components/pages/Dashboard/Dashboard';
import LabsPage from './components/pages/Labs/LabsPage';
import TimetablePage from './components/pages/Timetable/TimetablePage';
import ClassesPage from './components/pages/Classes/ClassesPage';
import FacultyPage from './components/pages/Faculty/FacultyPage';
import SettingsPage from './components/pages/Settings/SettingsPage';
import AdminDashboard from './components/pages/Admin/AdminDashboard';
import StudentView from './components/pages/Student/StudentView';
import StudentLabDetail from './components/pages/Student/StudentLabDetail';
import LoginPage from './components/ui/animated-characters-login-page';
import './App.css';

const AppShell: React.FC = () => {
  const { isAuthenticated, role, loginWithCredentials, loginAsStudent } = useAuth();

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route
          path="*"
          element={
            <LoginPage
              onLoginSuccess={loginWithCredentials}
              onStudentAccess={loginAsStudent}
            />
          }
        />
      </Routes>
    );
  }

  if (role === 'student') {
    return (
      <Routes>
        <Route path="/" element={<StudentView />} />
        <Route path="/lab/:labNo" element={<StudentLabDetail />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <MainLayout>
      <Routes>
        {role === 'admin' && <Route path="/" element={<AdminDashboard />} />}
        {role === 'admin' && <Route path="/admin" element={<AdminDashboard />} />}
        {role !== 'admin' && <Route path="/" element={<Dashboard />} />}
        <Route path="/labs"      element={<LabsPage />} />
        <Route path="/timetable" element={<TimetablePage />} />
        <Route path="/classes"   element={<ClassesPage />} />
        <Route path="/faculty"   element={<FacultyPage />} />
        <Route path="/settings"  element={<SettingsPage />} />
        <Route path="*"          element={<Navigate to="/" replace />} />
      </Routes>
    </MainLayout>
  );
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppProvider>
          <AppShell />
        </AppProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
