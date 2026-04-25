import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, FileText, Clock3, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import PageHeader from '../components/PageHeader';
import StatsCard from '../components/StatsCard';
import EmptyState from '../components/EmptyState';

const AdminDashboardPage = () => {
  const { profile, signOut } = useAuth();
  const [summary, setSummary] = useState({ teachers: 0, submitted: 0, pending: 0, approvedThisWeek: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (!profile) return;
    setLoading(true);
    Promise.all([
      supabase.from('profiles').select('id').eq('role', 'teacher'),
      supabase.from('lesson_notes').select('id').eq('status', 'submitted'),
      supabase.from('lesson_notes').select('id').eq('status', 'submitted'),
      supabase
        .from('lesson_notes')
        .select('id')
        .eq('status', 'approved')
        .gte('updated_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()),
    ])
      .then(([teachers, submitted, pending, approved]) => {
        setSummary({
          teachers: teachers.data?.length ?? 0,
          submitted: submitted.data?.length ?? 0,
          pending: pending.data?.length ?? 0,
          approvedThisWeek: approved.data?.length ?? 0,
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [profile]);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Admin portal</p>
            <h1 className="mt-2 text-3xl font-semibold text-slate-900">Head of Academics</h1>
            <p className="mt-2 text-sm text-slate-600">Review and approve teacher lesson notes quickly.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button onClick={() => navigate('/admin/notes')}>View all notes</Button>
            <Button variant="secondary" onClick={signOut}>Sign Out</Button>
          </div>
        </div>

        {loading ? (
          <div className="rounded-[32px] border border-slate-200 bg-white p-10 text-center text-slate-500 shadow-soft">Loading summary…</div>
        ) : (
          <div className="grid gap-4 md:grid-cols-4">
            <StatsCard label="Total teachers" value={summary.teachers} />
            <StatsCard label="Submitted" value={summary.submitted} />
            <StatsCard label="Pending review" value={summary.pending} />
            <StatsCard label="Approved this week" value={summary.approvedThisWeek} />
          </div>
        )}

        <div className="mt-8 rounded-[32px] border border-slate-200 bg-white p-6 shadow-soft">
          <PageHeader title="Review workflow" description="Manage lesson note submissions from your team." />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-[24px] border border-slate-200 p-5 text-slate-700">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-sm text-slate-700">
                <Users className="h-4 w-4" /> Teachers
              </div>
              <p className="text-sm text-slate-500">Keep track of your active lessons.</p>
            </div>
            <div className="rounded-[24px] border border-slate-200 p-5 text-slate-700">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-sm text-slate-700">
                <FileText className="h-4 w-4" /> Submissions
              </div>
              <p className="text-sm text-slate-500">Open notes from teachers for review.</p>
            </div>
            <div className="rounded-[24px] border border-slate-200 p-5 text-slate-700">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-sm text-slate-700">
                <Clock3 className="h-4 w-4" /> Response
              </div>
              <p className="text-sm text-slate-500">Respond quickly so teachers can continue planning.</p>
            </div>
            <div className="rounded-[24px] border border-slate-200 p-5 text-slate-700">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-sm text-slate-700">
                <CheckCircle2 className="h-4 w-4" /> Approvals
              </div>
              <p className="text-sm text-slate-500">Approve lessons that match curriculum standards.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
