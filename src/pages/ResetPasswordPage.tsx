import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import Button from '../components/Button';
import Input from '../components/Input';

type FormValues = {
  password: string;
  confirmPassword: string;
};

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [initialized, setInitialized] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ mode: 'onTouched' });

  useEffect(() => {
    const init = async () => {
      try {
        await supabase.auth.getSessionFromUrl({ storeSession: true });
      } catch (error) {
        console.warn('Password reset init error', error);
      }
      const session = await supabase.auth.getSession();
      setReady(!!session.data.session?.user);
      setInitialized(true);
    };
    init();
  }, []);

  const onSubmit = async (data: FormValues) => {
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: data.password });
      if (error) throw error;
      toast.success('Password updated successfully');
      navigate('/');
    } catch (error: any) {
      toast.error(error?.message || 'Unable to update password');
    } finally {
      setBusy(false);
    }
  };

  if (!initialized) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">Loading reset page…</div>;
  }

  if (!ready) {
    return (
      <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
        <div className="mx-auto w-full max-w-md rounded-[32px] border border-slate-200 bg-white p-8 shadow-soft">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-semibold text-slate-900">Reset password</h1>
            <p className="mt-3 text-sm text-slate-600">We could not validate the reset link. Please request a new password reset from the login page.</p>
          </div>
          <Button type="button" onClick={() => navigate('/login')} className="w-full">
            Back to login
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-md rounded-[32px] border border-slate-200 bg-white p-8 shadow-soft">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold text-slate-900">Reset password</h1>
          <p className="mt-3 text-sm text-slate-600">Enter your new password to complete the reset process.</p>
        </div>
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <label className="block text-sm font-medium text-slate-700">New password</label>
          <Input
            type="password"
            placeholder="Enter new password"
            {...register('password', { required: 'Password is required', minLength: { value: 8, message: 'Password must be at least 8 characters' } })}
          />
          {errors.password ? <p className="text-sm text-rose-600">{errors.password.message}</p> : null}

          <label className="block text-sm font-medium text-slate-700">Confirm password</label>
          <Input
            type="password"
            placeholder="Confirm new password"
            {...register('confirmPassword', {
              required: 'Confirm password is required',
              validate: (value) => value === watch('password') || 'Passwords do not match',
            })}
          />
          {errors.confirmPassword ? <p className="text-sm text-rose-600">{errors.confirmPassword.message}</p> : null}

          <Button type="submit" disabled={busy} className="w-full">
            {busy ? 'Updating…' : 'Update password'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ResetPasswordPage;
