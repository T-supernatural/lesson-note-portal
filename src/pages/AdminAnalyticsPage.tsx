import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import { fetchAnalyticsNotes } from "../services/notes";
import { fetchAcademicSessions } from "../services/sessions";
import { fetchTeachers } from "../services/profiles";
import type { AcademicSession, LessonNote, Profile } from "../types";
import Button from "../components/Button";
import ChartCard from "../components/ChartCard";
import EmptyState from "../components/EmptyState";
import Select from "../components/Select";
import StatCard from "../components/StatCard";
import NavigationShell from "../components/NavigationShell";
import toast from "react-hot-toast";
import LoadingState from "../components/LoadingState";
import InlineError from "../components/InlineError";

type AnalyticsNote = Pick<
  LessonNote,
  | "status"
  | "subject"
  | "week"
  | "teacher_id"
  | "academic_session_id"
  | "updated_at"
>;
const chartColors: Record<string, string> = {
  submitted: "#2563eb",
  draft: "#94a3b8",
  rejected: "#ef4444",
  approved: "#16a34a",
};

const countBy = (items: string[]) =>
  items.reduce<Record<string, number>>((counts, item) => {
    counts[item] = (counts[item] || 0) + 1;
    return counts;
  }, {});

const AdminAnalyticsPage = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [notes, setNotes] = useState<AnalyticsNote[]>([]);
  const [teachers, setTeachers] = useState<Profile[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [sessionId, setSessionId] = useState("");
  const [loading, setLoading] = useState(true);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    Promise.all([fetchTeachers(), fetchAcademicSessions()])
      .then(([teacherData, sessionData]) => {
        setTeachers(teacherData);
        setSessions(sessionData);
      })
      .catch(() => {
        setError("Unable to load analytics options.");
        toast.error("Unable to load analytics options");
      })
      .finally(() => setLoading(false));
  }, [profile]);

  useEffect(() => {
    if (!profile) return;
    setAnalyticsLoading(true);
    fetchAnalyticsNotes(sessionId || undefined)
      .then(setNotes)
      .catch(() => {
        setError("Unable to refresh analytics.");
        toast.error("Unable to refresh analytics");
      })
      .finally(() => setAnalyticsLoading(false));
  }, [profile, sessionId]);

  const statusTotals = useMemo(
    () => ({
      draft: notes.filter((note) => note.status === "draft").length,
      submitted: notes.filter((note) => note.status === "submitted").length,
      approved: notes.filter((note) => note.status === "approved").length,
      rejected: notes.filter((note) => note.status === "rejected").length,
    }),
    [notes],
  );
  const reviewedCount = statusTotals.approved + statusTotals.rejected;
  const approvalRate = reviewedCount
    ? Math.round((statusTotals.approved / reviewedCount) * 100)
    : 0;
  const statusData = Object.entries(statusTotals)
    .map(([status, value]) => ({
      name: status[0].toUpperCase() + status.slice(1),
      value,
    }))
    .filter((item) => item.value > 0);
  const weeklyData = Object.entries(countBy(notes.map((note) => note.week)))
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([week, value]) => ({ week: `Week ${week}`, notes: value }));
  const subjectData = Object.entries(countBy(notes.map((note) => note.subject)))
    .map(([subject, value]) => ({ subject, notes: value }))
    .sort((a, b) => b.notes - a.notes)
    .slice(0, 12);
  const teacherLabels = useMemo(
    () => new Map(teachers.map((teacher) => [teacher.id, teacher.full_name])),
    [teachers],
  );
  const teacherData = Object.entries(
    countBy(notes.map((note) => note.teacher_id)),
  )
    .map(([teacherId, value]) => ({
      teacher: teacherLabels.get(teacherId) || "Unknown teacher",
      notes: value,
    }))
    .sort((a, b) => b.notes - a.notes)
    .slice(0, 12);
  const selectedSession =
    sessions.find((session) => session.id === sessionId)?.name ||
    "All sessions";

  return (
    <NavigationShell role="admin">
      <div className="min-h-screen bg-[var(--color-bg)] px-4 pb-8 pt-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Detailed reporting
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                Full lesson analytics
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Explore the complete submission picture for{" "}
                {selectedSession.toLowerCase()}.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => navigate("/admin")}>
                Dashboard overview
              </Button>
              <Button variant="secondary" onClick={signOut}>
                Sign Out
              </Button>
            </div>
          </header>
          <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <label className="block max-w-sm text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Academic session
              <Select
                value={sessionId}
                onChange={(event) => setSessionId(event.target.value)}
              >
                <option value="">All sessions</option>
                {sessions.map((session) => (
                  <option key={session.id} value={session.id}>
                    {session.name}
                    {session.is_active ? " (Active)" : ""}
                  </option>
                ))}
                <option value="unassigned">Unassigned</option>
              </Select>
            </label>
          </section>
          {error ? (
            <InlineError message={error} />
          ) : loading || analyticsLoading ? (
            <LoadingState label="Loading full analytics..." />
          ) : notes.length === 0 ? (
            <EmptyState
              title="No lesson data yet"
              subtitle="Create or submit lesson notes to see full analytics."
            />
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                <StatCard label="Total notes" value={notes.length} />
                <StatCard label="Drafts" value={statusTotals.draft} />
                <StatCard
                  label="Submitted"
                  value={statusTotals.submitted}
                  tone="accent"
                />
                <StatCard
                  label="Approved"
                  value={statusTotals.approved}
                  tone="success"
                />
                <StatCard
                  label="Rejected"
                  value={statusTotals.rejected}
                  tone="warning"
                />
              </div>
              <div className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.5fr]">
                <ChartCard
                  title="Approval rate"
                  description={`${approvalRate}% of reviewed notes approved.`}
                >
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={72}
                          outerRadius={112}
                          paddingAngle={3}
                        >
                          {statusData.map((entry) => (
                            <Cell
                              key={entry.name}
                              fill={chartColors[entry.name.toLowerCase()] || chartColors.submitted}
                            />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>
                <ChartCard
                  title="Weekly submission trend"
                  description="All note statuses by teaching week."
                >
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={weeklyData}
                        margin={{ top: 12, right: 20, left: 0, bottom: 8 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="week" />
                        <YAxis allowDecimals={false} />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="notes"
                          stroke="#1e3a8a"
                          strokeWidth={3}
                          dot={{ r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>
              </div>
              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <ChartCard
                  title="Subject distribution"
                  description="Up to twelve highest-volume subjects."
                >
                  <div className="h-[26rem]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={subjectData}
                        layout="vertical"
                        margin={{ left: 12, right: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis type="number" allowDecimals={false} />
                        <YAxis
                          type="category"
                          dataKey="subject"
                          width={110}
                          tick={{ fontSize: 11 }}
                        />
                        <Tooltip />
                        <Bar
                          dataKey="notes"
                          fill="#2563eb"
                          radius={[0, 5, 5, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>
                <ChartCard
                  title="Teacher contribution"
                  description="Up to twelve highest-volume teachers."
                >
                  <div className="h-[26rem]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={teacherData}
                        layout="vertical"
                        margin={{ left: 12, right: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis type="number" allowDecimals={false} />
                        <YAxis
                          type="category"
                          dataKey="teacher"
                          width={130}
                          tick={{ fontSize: 11 }}
                        />
                        <Tooltip />
                        <Bar
                          dataKey="notes"
                          fill="#60a5fa"
                          radius={[0, 5, 5, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>
              </div>
            </>
          )}
        </div>
      </div>
    </NavigationShell>
  );
};

export default AdminAnalyticsPage;
