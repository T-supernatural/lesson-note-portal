import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, FileText } from "lucide-react";
import { useAuth } from "../context/auth-context";
import { fetchTeacherNotes } from "../services/notes";
import {
  fetchNotifications,
  markNotificationRead,
} from "../services/notifications";
import { fetchActiveSubmissionDeadlines } from "../services/deadlines";
import type { Notification, SubmissionDeadline } from "../types";
import toast from "react-hot-toast";
import Button from "../components/Button";
import PageHeader from "../components/PageHeader";
import StatsCard from "../components/StatsCard";
import EmptyState from "../components/EmptyState";
import StatCard from "../components/StatCard";
import ChartCard from "../components/ChartCard";
import NotificationBell from "../components/NotificationBell";
import NavigationShell from "../components/NavigationShell";
import LoadingState from "../components/LoadingState";
import InlineError from "../components/InlineError";

const TeacherDashboardPage = () => {
  const { profile, signOut } = useAuth();
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [deadlines, setDeadlines] = useState<SubmissionDeadline[]>([]);
  const [notificationsError, setNotificationsError] = useState<string | null>(
    null,
  );
  const navigate = useNavigate();

  useEffect(() => {
    if (!profile) return;
    setLoading(true);
    fetchTeacherNotes(profile.id)
      .then(setNotes)
      .catch(() => {})
      .finally(() => setLoading(false));
    fetchNotifications(profile.id)
      .then(setNotifications)
      .catch(() =>
        setNotificationsError("Review updates could not be loaded."),
      );
    fetchActiveSubmissionDeadlines()
      .then(setDeadlines)
      .catch(() => {});
  }, [profile]);

  const upcomingDeadlines = deadlines
    .filter((deadline) => new Date(deadline.due_at).getTime() > Date.now())
    .slice(0, 3);
  const handleNotificationRead = async (notification: Notification) => {
    await markNotificationRead(notification.id);
    setNotifications((current) =>
      current.map((item) =>
        item.id === notification.id
          ? { ...item, read_at: new Date().toISOString() }
          : item,
      ),
    );
  };

  const stats = useMemo(() => {
    const count = (status: string) =>
      notes.filter((note) => note.status === status).length;
    return {
      draft: count("draft"),
      submitted: count("submitted"),
      approved: count("approved"),
      rejected: count("rejected"),
    };
  }, [notes]);

  return (
    <NavigationShell role="teacher"><div className="min-h-screen bg-[var(--color-bg)] px-4 pb-24 pt-5 sm:px-6 md:pb-8 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img
              src="/image/logo.png"
              alt="RealJoy Schools"
              className="h-12 w-12 object-contain"
            />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Teacher workspace
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                Welcome back, {profile?.full_name}
              </h1>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell
              notifications={notifications}
              onRead={handleNotificationRead}
              onOpenNote={(noteId) => navigate(`/notes/${noteId}`)}
            />
            <Button
              variant="secondary"
              className="hidden sm:inline-flex"
              onClick={signOut}
            >
              Sign Out
            </Button>
          </div>
        </header>

        <div className="mb-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Draft notes" value={stats.draft} />
          <StatCard label="Submitted" value={stats.submitted} tone="accent" />
          <StatCard label="Approved" value={stats.approved} tone="success" />
          <StatCard label="Rejected" value={stats.rejected} tone="warning" />
        </div>

        <div className="mb-8 flex flex-col gap-3 sm:flex-row">
          <Button onClick={() => navigate("/notes/new")}>
            <Plus className="h-4 w-4" />
            New note
          </Button>
          <Button variant="outline" onClick={() => navigate("/notes")}>
            <FileText className="h-4 w-4" />
            My notes
          </Button>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_0.8fr]">
          <ChartCard
            title="Recent lesson notes"
            description="Your latest planning activity."
          >
            {loading ? (
              <LoadingState
                label="Loading notes..."
                className="border-0 bg-transparent p-0 shadow-none"
              />
            ) : notes.length === 0 ? (
              <EmptyState
                title="No lesson notes yet"
                subtitle="Start with a new note and save your first draft."
              />
            ) : (
              <div className="divide-y divide-slate-100">
                {notes.slice(0, 5).map((note) => (
                  <div
                    key={note.id}
                    className="flex items-center justify-between gap-4 py-4 first:pt-0 last:pb-0"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-950">
                        {note.topic}
                      </p>
                      <p className="mt-1 truncate text-xs text-slate-500">
                        {note.subject} • Week {note.week} • {note.class_level}
                      </p>
                    </div>
                    <span className="shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-600">
                      {note.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </ChartCard>
          <ChartCard
            title="Upcoming deadlines"
            description="Submission dates from your administrator."
          >
            {upcomingDeadlines.length ? (
              <div className="space-y-3">
                {upcomingDeadlines.map((deadline) => (
                  <div
                    key={deadline.id}
                    className="border-b border-slate-100 pb-3 last:border-0 last:pb-0"
                  >
                    <p className="text-sm font-semibold text-slate-950">
                      {deadline.term} • Week {deadline.week}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {deadline.lesson_day || "Any day"} • Due{" "}
                      {new Date(deadline.due_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No upcoming deadlines.</p>
            )}
          </ChartCard>
        </div>
        {notificationsError ? (
          <div className="mt-6">
            <InlineError message={notificationsError} />
          </div>
        ) : null}
      </div>
    </div></NavigationShell>
  );
};

export default TeacherDashboardPage;
