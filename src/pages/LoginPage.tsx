import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import Input from '../components/Input';

type FormValues = {
  email: string;
  password: string;
};

const LoginPage = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ mode: 'onTouched' });

  const onSubmit = async (data: FormValues) => {
    setBusy(true);
    try {
      await signIn(data.email, data.password);
      toast.success('Signed in successfully');
      navigate('/');
    } catch (error: any) {
      toast.error(error?.message || 'Unable to sign in');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-md rounded-[32px] border border-slate-200 bg-white p-8 shadow-soft">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-semibold text-slate-900">RealJoy Schools</h1>
          <p className="mt-3 text-sm text-slate-600">Teacher lesson note portal. Login with your school email.</p>
        </div>
        <form className="space-y-5" onSubmit={handleSubmit(onSubmit)}>
          <label className="block text-sm font-medium text-slate-700">Email</label>
          <Input type="email" placeholder="teacher@realjoy.sch" {...register('email', { required: 'Email is required' })} />
          {errors.email ? <p className="text-sm text-rose-600">{errors.email.message}</p> : null}

          <label className="block text-sm font-medium text-slate-700">Password</label>
          <Input type="password" placeholder="Enter password" {...register('password', { required: 'Password is required' })} />
          {errors.password ? <p className="text-sm text-rose-600">{errors.password.message}</p> : null}

          <Button type="submit" disabled={busy} className="w-full">
            {busy ? 'Signing in…' : 'Login'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
