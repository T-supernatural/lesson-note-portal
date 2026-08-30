import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/auth-context";
import {
  createAcademicSession,
  deleteAcademicSession,
  fetchAcademicSessions,
  setAcademicSessionArchived,
  setActiveAcademicSession,
  updateAcademicSession,
} from "../services/sessions";
import type { AcademicSession } from "../types";
import Button from "../components/Button";
import Input from "../components/Input";
import EmptyState from "../components/EmptyState";
import PageHeader from "../components/PageHeader";
import toast from "react-hot-toast";
import NavigationShell from "../components/NavigationShell";
import LoadingState from "../components/LoadingState";
import InlineError from "../components/InlineError";

type SessionForm = { name: string; starts_on: string; ends_on: string };

const SessionRow = ({
  session,
  saving,
  onSave,
  onActivate,
  onArchive,
  onDelete,
}: {
  session: AcademicSession;
  saving: boolean;
  onSave: (values: SessionForm) => Promise<void>;
  onActivate: () => Promise<void>;
  onArchive: () => Promise<void>;
  onDelete: () => Promise<void>;
}) => {
  const { register, handleSubmit, reset } = useForm<SessionForm>({
    defaultValues: {
      name: session.name,
      starts_on: session.starts_on || "",
      ends_on: session.ends_on || "",
    },
  });
  return (
    <form
      className={`rounded-[28px] border bg-white p-5 shadow-soft ${session.is_archived ? "border-slate-300 opacity-80" : "border-slate-200"}`}
      onSubmit={handleSubmit(onSave)}
    >
      <div className="grid gap-4 md:grid-cols-3">
        <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Name
          <Input {...register("name", { required: true })} />
        </label>
        <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Starts on
          <Input type="date" {...register("starts_on")} />
        </label>
        <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
          Ends on
          <Input type="date" {...register("ends_on")} />
        </label>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <span
          className={`text-sm font-semibold ${session.is_active ? "text-emerald-700" : session.is_archived ? "text-slate-600" : "text-slate-500"}`}
        >
          {session.is_active
            ? "Active session"
            : session.is_archived
              ? "Archived session"
              : "Historical session"}
        </span>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() =>
              reset({
                name: session.name,
                starts_on: session.starts_on || "",
                ends_on: session.ends_on || "",
              })
            }
          >
            Reset
          </Button>
          {!session.is_active && !session.is_archived ? (
            <Button
              type="button"
              variant="secondary"
              onClick={onActivate}
              disabled={saving}
            >
              {saving ? "Activating…" : "Make active"}
            </Button>
          ) : null}
          {!session.is_active ? (
            <Button
              type="button"
              variant="outline"
              onClick={onArchive}
              disabled={saving}
            >
              {saving
                ? "Updating…"
                : session.is_archived
                  ? "Unarchive"
                  : "Archive"}
            </Button>
          ) : null}
          <Button
            type="button"
            variant="danger"
            onClick={() => void onDelete()}
            disabled={saving || session.is_active}
          >
            {saving ? "Deleting…" : "Delete"}
          </Button>
          <Button type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>
    </form>
  );
};

const AdminSessionsPage = () => {
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<AcademicSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { register, handleSubmit, reset } = useForm<SessionForm>();

  useEffect(() => {
    if (!profile) return;
    fetchAcademicSessions()
      .then(setSessions)
      .catch(() => {
        setError("Unable to load sessions.");
        toast.error("Unable to load sessions");
      })
      .finally(() => setLoading(false));
  }, [profile]);

  const saveSession = async (sessionId: string | null, values: SessionForm) => {
    if (
      values.starts_on &&
      values.ends_on &&
      values.ends_on < values.starts_on
    ) {
      toast.error("The end date must be after the start date");
      return;
    }
    setSavingId(sessionId || "new");
    try {
      const payload = {
        name: values.name.trim(),
        starts_on: values.starts_on || null,
        ends_on: values.ends_on || null,
      };
      const saved = sessionId
        ? await updateAcademicSession(sessionId, payload)
        : await createAcademicSession({
            ...payload,
            is_active: sessions.length === 0,
          });
      setSessions((current) =>
        sessionId
          ? current.map((session) =>
              session.id === sessionId ? saved : session,
            )
          : [...current, saved],
      );
      reset();
      toast.success(sessionId ? "Session updated" : "Session created");
    } catch (error: any) {
      toast.error(error?.message || "Unable to save session");
    } finally {
      setSavingId(null);
    }
  };

  const activate = async (sessionId: string) => {
    setSavingId(sessionId);
    try {
      const active = await setActiveAcademicSession(sessionId);
      setSessions((current) =>
        current.map((session) => ({
          ...session,
          is_active: session.id === active.id,
        })),
      );
      toast.success(`${active.name} is now active`);
    } catch (error: any) {
      toast.error(error?.message || "Unable to change active session");
    } finally {
      setSavingId(null);
    }
  };

  const archive = async (session: AcademicSession) => {
    const action = session.is_archived ? "unarchive" : "archive";
    if (
      !session.is_archived &&
      !window.confirm(
        `Archive ${session.name}? It will remain available in historical reports.`,
      )
    )
      return;
    setSavingId(session.id);
    try {
      const updated = await setAcademicSessionArchived(
        session.id,
        !session.is_archived,
      );
      setSessions((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
      toast.success(`${updated.name} ${action}d`);
    } catch (error: any) {
      toast.error(error?.message || `Unable to ${action} session`);
    } finally {
      setSavingId(null);
    }
  };

  const removeSession = async (session: AcademicSession) => {
    if (!window.confirm(`Delete ${session.name}? This cannot be undone.`)) {
      return;
    }

    setSavingId(session.id);
    try {
      await deleteAcademicSession(session.id);
      setSessions((current) => current.filter((item) => item.id !== session.id));
      toast.success(`${session.name} deleted`);
    } catch (error: any) {
      toast.error(error?.message || "Unable to delete session");
    } finally {
      setSavingId(null);
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
                Academic sessions
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                Manage active and historical school sessions without changing
                existing lesson notes.
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
            onSubmit={handleSubmit((values) => saveSession(null, values))}
          >
            <PageHeader
              title="Add a session"
              description="Create a future or historical academic session."
            />
            <div className="grid gap-4 md:grid-cols-3">
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Name
                <Input
                  {...register("name", { required: true })}
                  placeholder="2027/28"
                />
              </label>
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Starts on
                <Input type="date" {...register("starts_on")} />
              </label>
              <label className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                Ends on
                <Input type="date" {...register("ends_on")} />
              </label>
            </div>
            <div className="mt-4">
              <Button type="submit" disabled={savingId === "new"}>
                {savingId === "new" ? "Creating…" : "Create session"}
              </Button>
            </div>
          </form>
          {error ? (
            <InlineError message={error} />
          ) : loading ? (
            <LoadingState label="Loading sessions..." />
          ) : sessions.length === 0 ? (
            <EmptyState
              title="No sessions found"
              subtitle="Create the first academic session."
            />
          ) : (
            <div className="grid gap-4">
              {sessions.map((session) => (
                <SessionRow
                  key={session.id}
                  session={session}
                  saving={savingId === session.id}
                  onSave={(values) => saveSession(session.id, values)}
                  onActivate={() => activate(session.id)}
                  onArchive={() => archive(session)}
                  onDelete={() => removeSession(session)}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </NavigationShell>
  );
};

export default AdminSessionsPage;
