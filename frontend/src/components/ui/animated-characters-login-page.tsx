"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff, Mail, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

type StaffRole = 'labAssistant' | 'faculty';
type UserRole = 'student' | StaffRole | 'admin';

interface LoginPageProps {
  onLoginSuccess: (payload: { email: string; role: UserRole }) => void;
}

interface PupilProps {
  size?: number;
  maxDistance?: number;
  pupilColor?: string;
}

const Pupil = ({ size = 12, maxDistance = 5, pupilColor = '#1e293b' }: PupilProps) => {
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const pupilRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const position = useMemo(() => {
    if (!pupilRef.current) return { x: 0, y: 0 };
    const rect = pupilRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    const dx = mouseX - centerX;
    const dy = mouseY - centerY;
    const angle = Math.atan2(dy, dx);
    const distance = Math.min(Math.hypot(dx, dy), maxDistance);

    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance,
    };
  }, [maxDistance, mouseX, mouseY]);

  return (
    <div
      ref={pupilRef}
      className='rounded-full'
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: pupilColor,
        transform: `translate(${position.x}px, ${position.y}px)`,
        transition: 'transform 0.08s ease-out',
      }}
    />
  );
};

export function Component({ onLoginSuccess }: LoginPageProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [askStaffRole, setAskStaffRole] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [remember, setRemember] = useState(false);
  const [adminKey, setAdminKey] = useState('');
  const [askAdminKey, setAskAdminKey] = useState(false);

  const isStudentEmail = (value: string) => /^2\w*@pccoepune\.org$/i.test(value.trim());
  const isAdminEmail = (value: string) => /^admin[a-z0-9]*@pccoepune\.org$/i.test(value.trim());
  const isStaffDomainEmail = (value: string) => /^[^\s@]+@pccoepune\.org$/i.test(value.trim());

  const completeLogin = (targetEmail: string, role: UserRole) => {
    onLoginSuccess({ email: targetEmail.trim().toLowerCase(), role });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setAskStaffRole(false);
    setAskAdminKey(false);

    if (!email || !password) {
      setError('Please enter email and password.');
      return;
    }

    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 250));

    if (password.length < 4) {
      setIsLoading(false);
      setError('Password must be at least 4 characters.');
      return;
    }

    // Admin role detection
    if (isAdminEmail(email)) {
      setIsLoading(false);
      setPendingEmail(email);
      setAskAdminKey(true);
      return;
    }

    if (isStudentEmail(email)) {
      setIsLoading(false);
      completeLogin(email, 'student');
      return;
    }

    if (isStaffDomainEmail(email)) {
      setIsLoading(false);
      setPendingEmail(email);
      setAskStaffRole(true);
      return;
    }

    setIsLoading(false);
    setError('Use a valid pccoepune.org email.');
  };

  const handleStaffRolePick = (role: StaffRole) => {
    completeLogin(pendingEmail || email, role);
  };

  const handleAdminKeySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminKey === 'ADMIN123') {
      completeLogin(pendingEmail || email, 'admin');
    } else {
      setError('Invalid admin verification key.');
    }
  };

  return (
    <div className={cn('min-h-screen grid lg:grid-cols-2 bg-slate-50')}>
      <div className='relative hidden lg:flex flex-col justify-between bg-gradient-to-br from-sky-600 via-blue-600 to-indigo-700 p-12 text-white overflow-hidden'>
        <div className='relative z-10'>
          <div className='flex items-center gap-2 text-lg font-semibold'>
            <div className='size-8 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center'>
              <Sparkles className='size-4' />
            </div>
            <span>Lab Management</span>
          </div>
        </div>

        <div className='relative z-10 flex items-end justify-center h-[440px]'>
          <div className='relative w-[460px] h-[330px]'>
            <div className='absolute left-12 bottom-0 w-40 h-72 rounded-t-[14px] bg-violet-500'>
              <div className='absolute left-10 top-8 flex gap-8'>
                <Pupil size={11} />
                <Pupil size={11} />
              </div>
            </div>
            <div className='absolute left-48 bottom-0 w-32 h-56 rounded-t-[12px] bg-slate-900'>
              <div className='absolute left-8 top-7 flex gap-6'>
                <Pupil size={10} pupilColor='white' />
                <Pupil size={10} pupilColor='white' />
              </div>
            </div>
            <div className='absolute left-0 bottom-0 w-48 h-36 rounded-t-[100px] bg-orange-300'>
              <div className='absolute left-14 top-14 flex gap-7'>
                <Pupil size={10} />
                <Pupil size={10} />
              </div>
            </div>
            <div className='absolute left-[270px] bottom-0 w-40 h-44 rounded-t-[80px] bg-yellow-300'>
              <div className='absolute left-14 top-8 flex gap-7'>
                <Pupil size={10} />
                <Pupil size={10} />
              </div>
              <div className='absolute left-[52px] top-[62px] w-14 h-1 rounded-full bg-slate-900' />
            </div>
          </div>
        </div>

        <div className='relative z-10 flex items-center gap-8 text-sm text-white/70'>
          <span>Privacy</span>
          <span>Terms</span>
          <span>Support</span>
        </div>

        <div className='absolute top-[-80px] right-[-40px] size-64 rounded-full bg-white/10 blur-3xl' />
        <div className='absolute bottom-[-100px] left-[-60px] size-80 rounded-full bg-white/10 blur-3xl' />
      </div>

      <div className='flex items-center justify-center p-8 bg-white'>
        <div className='w-full max-w-[420px]'>
          <div className='lg:hidden flex items-center justify-center gap-2 text-lg font-semibold mb-10'>
            <div className='size-8 rounded-lg bg-sky-100 flex items-center justify-center'>
              <Sparkles className='size-4 text-sky-600' />
            </div>
            <span>Lab Management</span>
          </div>

          <div className='text-center mb-8'>
            <h1 className='text-3xl font-bold tracking-tight mb-2 text-slate-900'>Welcome back!</h1>
            <p className='text-slate-500 text-sm'>Sign in with your institutional email</p>
          </div>

          <form onSubmit={handleSubmit} className='space-y-5'>
            <div className='space-y-2'>
              <Label htmlFor='email'>Email</Label>
              <Input
                id='email'
                type='email'
                placeholder='2x123@pccoepune.org or admin@pccoepune.org'
                value={email}
                autoComplete='off'
                onChange={(e) => setEmail(e.target.value)}
                required
                className='h-12'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='password'>Password</Label>
              <div className='relative'>
                <Input
                  id='password'
                  type={showPassword ? 'text' : 'password'}
                  placeholder='â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢'
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className='h-12 pr-10'
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(!showPassword)}
                  className='absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors'
                >
                  {showPassword ? <EyeOff className='size-5' /> : <Eye className='size-5' />}
                </button>
              </div>
            </div>

            <div className='flex items-center justify-between'>
              <div className='flex items-center space-x-2'>
                <Checkbox id='remember' checked={remember} onCheckedChange={(v) => setRemember(Boolean(v))} />
                <Label htmlFor='remember' className='text-sm font-normal cursor-pointer'>
                  Remember for 30 days
                </Label>
              </div>
              <button type='button' className='text-sm text-sky-700 hover:underline font-medium'>
                Forgot password?
              </button>
            </div>

            {error && (
              <div className='p-3 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-lg'>
                {error}
              </div>
            )}

            {askAdminKey && (
              <div className='p-4 border border-red-200 bg-red-50 rounded-lg space-y-3'>
                <p className='text-sm text-red-800 font-medium'>Admin access detected. Enter verification key:</p>
                <Input
                  type='password'
                  placeholder='Enter admin key'
                  value={adminKey}
                  onChange={(e) => setAdminKey(e.target.value)}
                  className='h-10'
                />
                <div className='flex gap-2'>
                  <Button type='button' variant='outline' onClick={() => {
                    setAskAdminKey(false);
                    setAdminKey('');
                    setError('');
                  }} className='flex-1'>
                    Cancel
                  </Button>
                  <Button type='button' onClick={handleAdminKeySubmit} className='flex-1 bg-red-600 hover:bg-red-700'>
                    Verify
                  </Button>
                </div>
              </div>
            )}

            {askStaffRole && (
              <div className='p-4 border border-amber-200 bg-amber-50 rounded-lg space-y-3'>
                <p className='text-sm text-amber-800 font-medium'>Staff domain detected. Choose your role:</p>
                <div className='grid grid-cols-2 gap-2'>
                  <Button type='button' variant='outline' onClick={() => handleStaffRolePick('labAssistant')}>
                    Lab Assistant
                  </Button>
                  <Button type='button' variant='outline' onClick={() => handleStaffRolePick('faculty')}>
                    Faculty
                  </Button>
                </div>
              </div>
            )}

            <Button type='submit' className='w-full h-12 text-base font-medium' size='lg' disabled={isLoading || askAdminKey || askStaffRole}>
              {isLoading ? 'Signing in...' : 'Log in'}
            </Button>
          </form>

          <div className='mt-6'>
            <Button variant='outline' className='w-full h-12' type='button'>
              <Mail className='mr-2 size-5' />
              Log in with Google
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Component;
