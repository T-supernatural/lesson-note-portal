import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import {
  createSubmissionDeadline,
  fetchSubmissionDeadlines,
  updateSubmissionDeadline,
} from "../services/deadlines";
import { fetchAcademicSessions } from "../services/sessions";
import type { AcademicSession, SubmissionDeadline } from "../types";
import Button from "../components/Button";
import Input from "../components/Input";
import Select from "../components/Select";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import toast from "react-hot-toast";
import NavigationShell from "../components/NavigationShell";
import LoadingState from "../components/LoadingState";
import InlineError from "../components/InlineError";

const terms = ["Term 1", "Term 2", "Term 3"];
const weeks = Array.from({ length: 11 }, (_, index) => String(index + 1));
const days = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
type DeadlineForm = {
  academic_session_id: string;
  term: string;
  week: string;
  lesson_day: string;
  due_at: string;
};

const AdminDeadlinesPage = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [deadlines, setDeadlines] = useState<SubmissionDeadline[]>([]);
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, reset } = useForm<DeadlineForm>({
    defaultValues: {
      academic_session_id: "",
      term: "",
      week: "",
      lesson_day: "",
      due_at: "",
    },
  });

  useEffect(() => {
    if (!profile) return;
    Promise.all([fetchSubmissionDeadlines(), fetchAcademicSessions()])
      .then(([deadlineData, sessionData]) => {
        setDeadlines(deadlineData);
        setSessions(sessionData);
      })
      .catch(() => {
        setError("Unable to load deadlines.");
        toast.error("Unable to load deadlines");
      })
      .finally(() => setLoading(false));
  }, [profile]);

  const sessionNames = useMemo(
    () => new Map(sessions.map((session) => [session.id, session.name])),
    [sessions],
  );

  const createDeadline = async (values: DeadlineForm) => {
    if (
      !values.academic_session_id ||
      !values.term ||
      !values.week ||
      !values.due_at
    )
      return;
    setSaving(true);
    try {
      const created = await createSubmissionDeadline({
        ...values,
        lesson_day: values.lesson_day || null,
        due_at: new Date(values.due_at).toISOString(),
        is_active: true,
      });
      setDeadlines((current) => [
        created,
        ...current.filter((deadline) => deadline.id !== created.id),
      ]);
      reset({ ...values, due_at: "" });
      toast.success("Submission deadline saved");
    } catch (error: any) {
      toast.error(error?.message || "Unable to save deadline");
    } finally {
      setSaving(false);
    }
  };

  const toggleDeadline = async (deadline: SubmissionDeadline) => {
    setUpdatingId(deadline.id);
    try {
      const updated = await updateSubmissionDeadline(deadline.id, {
        due_at: deadline.due_at,
        is_active: !deadline.is_active,
      });
      setDeadlines((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      toast.success(
        updated.is_active ? "Deadline activated" : "Deadline deactivated",
      );
    } catch (error: any) {
      toast.error(error?.message || "Unable to update deadline");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <NavigationShell role="admin">
      <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-slate-500">
                Administration
              </p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">
                Submission deadlines
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Set weekly deadlines used by the missing-notes report and
                teacher reminders.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => navigate("/admin")}>Dashboard</Button>
              <Button variant="secondary" onClick={signOut}>
                Sign Out
              </Button>
            </div>
          </div>
          <form
            className="mb-6 rounded-[32px] border border-slate-200 bg-white p-6 shadow-soft"
            onSubmit={handleSubmit(createDeadline)}
          >
            <PageHeader
              title="Add or replace a deadline"
              description="A deadline applies to every active teacher in the selected schedule."
            />
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Session
                <Select
                  {...register("academic_session_id", { required: true })}
                >
                  <option value="">Select session</option>
                  {sessions
                    .filter((session) => !session.is_archived)
                    .map((session) => (
                      <option key={session.id} value={session.id}>
                        {session.name}
                      </option>
                    ))}
                </Select>
              </label>
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Term
                <Select {...register("term", { required: true })}>
                  <option value="">Select term</option>
                  {terms.map((term) => (
                    <option key={term} value={term}>
                      {term}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Week
                <Select {...register("week", { required: true })}>
                  <option value="">Select week</option>
                  {weeks.map((week) => (
                    <option key={week} value={week}>
                      Week {week}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Day
                <Select {...register("lesson_day")}>
                  <option value="">Any day</option>
                  {days.map((day) => (
                    <option key={day} value={day}>
                      {day}
                    </option>
                  ))}
                </Select>
              </label>
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Due at
                <Input
                  type="datetime-local"
                  {...register("due_at", { required: true })}
                />
              </label>
            </div>
            <div className="mt-4">
              <Button type="submit" disabled={saving || loading}>
                {saving ? "Saving…" : "Save deadline"}
              </Button>
            </div>
          </form>
          {error ? (
            <InlineError message={error} />
          ) : loading ? (
            <LoadingState label="Loading deadlines..." />
          ) : deadlines.length === 0 ? (
            <EmptyState
              title="No deadlines configured"
              subtitle="Add a deadline for a session, term, and week."
            />
          ) : (
            <div className="grid gap-4">
              {deadlines.map((deadline) => (
                <div
                  key={deadline.id}
                  className={`rounded-[28px] border bg-white p-5 shadow-soft ${deadline.is_active ? "border-slate-200" : "border-slate-300 opacity-70"}`}
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                        {sessionNames.get(deadline.academic_session_id) ||
                          "Unknown session"}{" "}
                        • {deadline.term} • Week {deadline.week}
                        {deadline.lesson_day
                          ? ` • ${deadline.lesson_day}`
                          : " • Any day"}
                      </p>
                      <p className="mt-2 text-lg font-semibold text-slate-900">
                        Due {new Date(deadline.due_at).toLocaleString()}
                      </p>
                      <p
                        className={`mt-1 text-sm ${deadline.is_active ? "text-emerald-700" : "text-slate-500"}`}
                      >
                        {deadline.is_active
                          ? "Active deadline"
                          : "Inactive deadline"}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => void toggleDeadline(deadline)}
                      disabled={updatingId === deadline.id}
                    >
                      {updatingId === deadline.id
                        ? "Updating…"
                        : deadline.is_active
                          ? "Deactivate"
                          : "Activate"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </NavigationShell>
  );
};

export default AdminDeadlinesPage;
