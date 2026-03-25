import React, { useState } from 'react';
import { Card } from '../../common/Card';
import { Button } from '../../common/Button';
import { useApp } from '../../../context/AppContext';
import { useAuth } from '../../../context/AuthContext';
import { FiMoon, FiSun } from 'react-icons/fi';

const SettingsPage: React.FC = () => {
  const { isDarkMode, toggleDarkMode } = useApp();
  const { user } = useAuth();
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const Toggle: React.FC<{ enabled: boolean; onToggle: () => void }> = ({ enabled, onToggle }) => (
    <button
      onClick={onToggle}
      className={`w-11 h-6 rounded-full p-0.5 transition-colors ${enabled ? 'bg-sky-500' : 'bg-slate-300'}`}
    >
      <div
        className={`w-5 h-5 rounded-full bg-white transition-transform ${enabled ? 'translate-x-5' : 'translate-x-0'}`}
      />
    </button>
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Settings</h1>
        <p className="text-sm text-slate-500 mt-1">Manage your preferences and account settings</p>
      </div>

      {/* User Profile */}
      <Card title="User Profile">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-sky-100 flex items-center justify-center text-sky-700 text-2xl font-semibold">
              {user.name.charAt(0)}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-900">{user.name}</h3>
              <p className="text-slate-600">{user.email}</p>
              <p className="text-sm text-slate-500 mt-1 capitalize">Role: {user.role}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Appearance Settings */}
      <Card title="Appearance">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isDarkMode ? <FiMoon size={24} /> : <FiSun size={24} />}
              <div>
                <p className="font-medium text-slate-900">Dark Mode</p>
                <p className="text-sm text-slate-500">
                  {isDarkMode ? 'Dark theme is enabled' : 'Light theme is active'}
                </p>
              </div>
            </div>
            <Toggle enabled={isDarkMode} onToggle={toggleDarkMode} />
          </div>
        </div>
      </Card>

      <Card title="Security">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="font-medium text-slate-900">Change Password</p>
            <p className="text-sm text-slate-500">Update your account password securely.</p>
          </div>
          <Button
            label={isChangingPassword ? 'Coming Soon' : 'Change Password'}
            variant="secondary"
            onClick={() => setIsChangingPassword(true)}
          />
        </div>
      </Card>
    </div>
  );
};

export default SettingsPage;
