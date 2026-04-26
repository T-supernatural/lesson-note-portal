import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { supabase } from '../lib/supabase';
import Button from '../components/Button';
import Input from '../components/Input';

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<{ email: string }>({ mode: 'onTouched' });

  const onSubmit = async (data: { email: string }) => {
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success('Password reset email sent. Check your inbox.');
      navigate('/login');
    } catch (error: any) {
      toast.error(error?.message || 'Unable to send reset email');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-md rounded-[32px] border border-slate-200 bg-white p-8 shadow-soft">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold text-slate-900">Forgot password</h1>
          <p className="mt-3 text-sm text-slate-600">Enter your email and we will send you a link to reset your password.</p>
        </div>
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <label className="block text-sm font-medium text-slate-700">Email</label>
          <Input type="email" placeholder="teacher@realjoy.sch" {...register('email', { required: 'Email is required' })} />
          {errors.email ? <p className="text-sm text-rose-600">{errors.email.message}</p> : null}

          <Button type="submit" disabled={busy} className="w-full">
            {busy ? 'Sending…' : 'Send reset link'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
