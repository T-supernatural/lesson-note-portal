import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { useAuth } from "../context/auth-context";
import { fetchAnalyticsNotes } from "../services/notes";
import { fetchAcademicSessions } from "../services/sessions";
import { fetchTeachers } from "../services/profiles";
import type { AcademicSession, LessonNote, Profile } from "../types";
import Button from "../components/Button";
import StatCard from "../components/StatCard";
import ChartCard from "../components/ChartCard";
import Select from "../components/Select";
import EmptyState from "../components/EmptyState";
import toast from "react-hot-toast";
import NavigationShell from "../components/NavigationShell";
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

const chartColors = ["#1e3a8a", "#2563eb", "#60a5fa", "#93c5fd"];

const countBy = (items: string[]) =>
  items.reduce<Record<string, number>>((counts, item) => {
    counts[item] = (counts[item] || 0) + 1;
    return counts;
  }, {});

const AdminDashboardPage = () => {
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
        setError("Unable to load dashboard options.");
        toast.error("Unable to load dashboard options");
      })
      .finally(() => setLoading(false));
  }, [profile]);

  useEffect(() => {
    if (!profile) return;
    setAnalyticsLoading(true);
    fetchAnalyticsNotes(sessionId || undefined)
      .then(setNotes)
      .catch(() => {
        setError("Unable to refresh dashboard analytics.");
        toast.error("Unable to refresh dashboard analytics");
      })
      .finally(() => setAnalyticsLoading(false));
  }, [profile, sessionId]);

  const summary = useMemo(() => {
    const nonDraft = notes.filter((note) => note.status !== "draft").length;
    const pending = notes.filter((note) => note.status === "submitted").length;
    const approved = notes.filter((note) => note.status === "approved").length;
    return {
      teachers: teachers.length,
      submitted: nonDraft,
      pending,
      approved,
    };
  }, [notes, teachers]);

  const rejectedCount = notes.filter(
    (note) => note.status === "rejected",
  ).length;
  const approvalRate =
    summary.approved + rejectedCount > 0
      ? Math.round(
          (summary.approved / (summary.approved + rejectedCount)) * 100,
        )
      : 0;
  const statusData = useMemo(
    () =>
      [
        {
          name: "Pending review",
          value: notes.filter((note) => note.status === "submitted").length,
        },
        {
          name: "Approved",
          value: notes.filter((note) => note.status === "approved").length,
        },
        { name: "Rejected", value: rejectedCount },
        {
          name: "Draft",
          value: notes.filter((note) => note.status === "draft").length,
        },
      ].filter((item) => item.value > 0),
    [notes, rejectedCount],
  );
  const weeklyData = useMemo(
    () =>
      Object.entries(countBy(notes.map((note) => note.week)))
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([week, value]) => ({ week: `Week ${week}`, notes: value })),
    [notes],
  );
  const subjectData = useMemo(
    () =>
      Object.entries(countBy(notes.map((note) => note.subject)))
        .map(([subject, notesCount]) => ({ subject, notes: notesCount }))
        .sort((a, b) => b.notes - a.notes)
        .slice(0, 8),
    [notes],
  );
  const teacherLabels = useMemo(
    () => new Map(teachers.map((teacher) => [teacher.id, teacher.full_name])),
    [teachers],
  );
  const teacherData = useMemo(
    () =>
      Object.entries(countBy(notes.map((note) => note.teacher_id)))
        .map(([teacherId, notesCount]) => ({
          teacher: teacherLabels.get(teacherId) || "Unknown teacher",
          notes: notesCount,
        }))
        .sort((a, b) => b.notes - a.notes)
        .slice(0, 8),
    [notes, teacherLabels],
  );

  return (
    <NavigationShell role="admin">
      <div className="min-h-screen bg-[var(--color-bg)] px-4 pb-8 pt-5 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <header className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Admin workspace
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
                Academic overview
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                A clear view of lesson submissions and review progress.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" onClick={signOut}>
                Sign Out
              </Button>
            </div>
          </header>

          <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-soft">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-base font-semibold text-slate-950">
                  Analytics scope
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Choose a session to compare its lesson activity.
                </p>
              </div>
              <label className="w-full max-w-xs text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
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
            </div>
          </section>

          {error ? (
            <InlineError message={error} />
          ) : loading || analyticsLoading ? (
            <LoadingState label="Loading analytics..." />
          ) : notes.length === 0 ? (
            <EmptyState
              title="No lesson data yet"
              subtitle="Create or submit lesson notes to see analytics."
            />
          ) : (
            <>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard label="Active teachers" value={summary.teachers} />
                <StatCard
                  label="Submitted notes"
                  value={summary.submitted}
                  tone="accent"
                />
                <StatCard
                  label="Pending review"
                  value={summary.pending}
                  tone="warning"
                />
                <StatCard
                  label="Approval rate (%)"
                  value={approvalRate}
                  tone="success"
                />
              </div>
              <div className="mt-6 grid gap-6 lg:grid-cols-[0.85fr_1.4fr]">
                <ChartCard
                  title="Review status"
                  description="How notes are progressing through review."
                >
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={statusData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={62}
                          outerRadius={92}
                          paddingAngle={3}
                        >
                          {statusData.map((entry, index) => (
                            <Cell
                              key={entry.name}
                              fill={chartColors[index % chartColors.length]}
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
                  title="Notes by week"
                  description="Lesson-note volume across the selected scope."
                >
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={weeklyData}
                        margin={{ top: 8, right: 12, left: -20, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Line
                          type="monotone"
                          dataKey="notes"
                          stroke="#1e3a8a"
                          strokeWidth={3}
                          dot={{ r: 4, fill: "#1e3a8a" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </ChartCard>
              </div>
              <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <ChartCard
                  title="Notes by subject"
                  description="Top subjects by note volume."
                >
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={subjectData}
                        layout="vertical"
                        margin={{ top: 4, right: 12, left: 12, bottom: 4 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis
                          type="number"
                          allowDecimals={false}
                          tick={{ fontSize: 11 }}
                        />
                        <YAxis
                          type="category"
                          dataKey="subject"
                          width={90}
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
                  title="Notes by teacher"
                  description="Top contributors across the selected scope."
                >
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={teacherData}
                        layout="vertical"
                        margin={{ top: 4, right: 12, left: 12, bottom: 4 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis
                          type="number"
                          allowDecimals={false}
                          tick={{ fontSize: 11 }}
                        />
                        <YAxis
                          type="category"
                          dataKey="teacher"
                          width={110}
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
              <div className="mt-6 flex justify-end">
                <Button
                  variant="outline"
                  onClick={() => navigate("/admin/analytics")}
                >
                  View full analytics
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </NavigationShell>
  );
};

export default AdminDashboardPage;
