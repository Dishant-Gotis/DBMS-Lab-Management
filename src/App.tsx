import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
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
import './App.css';

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <Router>
          <MainLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/labs" element={<LabsPage />} />
              <Route path="/pcs" element={<PCsPage />} />
              <Route path="/software" element={<SoftwarePage />} />
              <Route path="/timetable" element={<TimetablePage />} />
              <Route path="/classes" element={<ClassesPage />} />
              <Route path="/faculty" element={<FacultyPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Routes>
          </MainLayout>
        </Router>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;
