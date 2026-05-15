import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useWatch } from 'react-hook-form';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { createLessonNote, fetchNoteById, fetchTeacherNotes, updateLessonNote } from '../services/notes';
import { generateLessonNote, type AiGeneratedLessonNote, type AiLessonGenerationRequest } from '../lib/gemini';
import Button from '../components/Button';
import Input from '../components/Input';
import Textarea from '../components/Textarea';
import Select from '../components/Select';
import RichTextEditor from '../components/RichTextEditor';
import PageHeader from '../components/PageHeader';

const classLevels = ['Playgroup', 'Nursery 1', 'Nursery 2', 'Kindergarten', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Jss 1', 'Jss 2', 'Jss 3', 'Ss 1', 'Ss 2', 'Ss 3'];
const terms = ['Term 1', 'Term 2', 'Term 3'];
const weeks = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11'];
const AUTO_SAVE_DELAY_MS = 1800;

const learningLevels = ['Simple', 'Moderate', 'Advanced'] as const;

type LocalDraft = {
  savedAt: string;
  noteId: string;
  values: Record<string, string>;
};

type AiGenerationRequest = AiLessonGenerationRequest;

type AiGeneratedDraft = AiGeneratedLessonNote;


const formFields = [
  'subject',
  'class_level',
  'term',
  'week',
  'topic',
  'objectives',
  'materials',
  'introduction',
  'main_content',
  'evaluation',
  'teachers_presentation',
  'assignment',
];

const isBlankRichText = (content?: string) => {
  if (!content) return true;
  const withoutTags = content
    .replace(/<br\s*\/?>/gi, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .trim();
  const hasMediaOrTable = /<(img|table)\b/i.test(content);
  return !withoutTags && !hasMediaOrTable;
};

const hasDraftContent = (values: Record<string, string>) => {
  return formFields.some((field) => {
    const value = values[field];
    if (field === 'main_content') return !isBlankRichText(value);
    return Boolean(value?.trim());
  });
};

const formatRecoveryTime = (savedAt: string) => {
  const date = new Date(savedAt);
  if (Number.isNaN(date.getTime())) return 'a previous session';
  return date.toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const NoteFormPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [noteLocked, setNoteLocked] = useState(false);
  const [duplicateLoading, setDuplicateLoading] = useState(false);
  const [existingNote, setExistingNote] = useState<any>(null);
  const [localDraft, setLocalDraft] = useState<LocalDraft | null>(null);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [isAiPanelOpen, setIsAiPanelOpen] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiRetrying, setAiRetrying] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiGeneratedDraft, setAiGeneratedDraft] = useState<AiGeneratedDraft | null>(null);
  const [aiGenerationMode, setAiGenerationMode] = useState<'short' | 'detailed'>('short');
  const [aiForm, setAiForm] = useState<AiGenerationRequest>({
    subject: '',
    classLevel: '',
    topic: '',
    week: '',
    duration: '40 minutes',
    learningLevel: 'Moderate',
    curriculumStyle: 'Nigerian Curriculum',
    additionalInstructions: '',
    generationMode: 'short',
  });

  const [lastLocalSave, setLastLocalSave] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(() => (typeof navigator === 'undefined' ? true : navigator.onLine));
  const hydratedRef = useRef(false);
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    control,
    formState: { errors, isSubmitting },
  } = useForm<Record<string, string>>({ mode: 'onTouched' });

  const mainContent = watch('main_content');
  const watchedValues = useWatch({ control });
  const draftKey = useMemo(() => {
    if (!profile) return null;
    return `lesson-note-autosave:${profile.id}:${id ?? 'new'}`;
  }, [id, profile]);

  const openAiPanel = () => {
    setAiForm((current) => ({
      ...current,
      subject: watchedValues.subject ?? '',
      classLevel: watchedValues.class_level ?? '',
      topic: watchedValues.topic ?? '',
      week: watchedValues.week ?? '',
    }));
    setAiError(null);
    setAiGeneratedDraft(null);
    setIsAiPanelOpen(true);
  };

  const closeAiPanel = () => {
    setIsAiPanelOpen(false);
    setAiError(null);
  };

  const generateAiDraft = async () => {
    if (aiGenerating || aiRetrying) return;
    if (!aiForm.subject || !aiForm.classLevel || !aiForm.topic || !aiForm.week) {
      setAiError('Please provide subject, class level, topic, and week.');
      return;
    }

    setAiError(null);
    setAiGenerating(true);
    setAiGeneratedDraft(null);

    try {
      const lesson = await generateLessonNote({
        subject: aiForm.subject,
        classLevel: aiForm.classLevel,
        topic: aiForm.topic,
        week: aiForm.week,
        term: watchedValues.term || undefined,
        duration: aiForm.duration,
        learningLevel: aiForm.learningLevel,
        curriculumStyle: aiForm.curriculumStyle,
        additionalInstructions: aiForm.additionalInstructions?.trim(),
        generationMode: aiGenerationMode,
      });
      setAiGeneratedDraft(lesson);
    } catch (error: any) {
      const errorMsg = error?.message || 'Unable to generate content. Please try again.';
      const isOverloadError = errorMsg.toLowerCase().includes('high demand') || 
                             errorMsg.toLowerCase().includes('temporarily unavailable');
      
      if (isOverloadError) {
        setAiError('AI service is currently busy. Please try again in a few moments.');
      } else {
        setAiError(errorMsg);
      }
    } finally {
      setAiGenerating(false);
    }
  };

  const insertAiDraft = () => {
    if (!aiGeneratedDraft) return;

    setValue('subject', aiForm.subject);
    setValue('class_level', aiForm.classLevel);
    setValue('topic', aiForm.topic);
    setValue('week', aiForm.week);
    setValue('objectives', aiGeneratedDraft.objectives);
    setValue('materials', aiGeneratedDraft.materials);
    setValue('introduction', aiGeneratedDraft.introduction);
    setValue('teachers_presentation', aiGeneratedDraft.teachers_presentation);
    setValue('main_content', aiGeneratedDraft.main_content);
    setValue('evaluation', aiGeneratedDraft.evaluation);
    setValue('assignment', aiGeneratedDraft.assignment);

    toast.success('AI-generated content inserted. Review and save your note.');
    setIsAiPanelOpen(false);
  };


  const readLocalDraft = () => {
    if (!draftKey) return null;
    try {
      const rawDraft = localStorage.getItem(draftKey);
      if (!rawDraft) return null;
      const parsed = JSON.parse(rawDraft) as LocalDraft;
      if (!parsed?.values || !hasDraftContent(parsed.values)) {
        localStorage.removeItem(draftKey);
        return null;
      }
      return parsed;
    } catch {
      localStorage.removeItem(draftKey);
      return null;
    }
  };

  const clearLocalDraft = () => {
    if (!draftKey) return;
    localStorage.removeItem(draftKey);
    setLocalDraft(null);
    setLastLocalSave(null);
    setAutoSaveStatus('idle');
  };

  const restoreLocalDraft = () => {
    if (!localDraft) return;
    reset(localDraft.values);
    setLocalDraft(null);
    setLastLocalSave(localDraft.savedAt);
    setAutoSaveStatus('saved');
    hydratedRef.current = true;
    toast.success('Local draft restored');
  };

  const discardLocalDraft = () => {
    clearLocalDraft();
    hydratedRef.current = true;
    toast.success('Local draft discarded');
  };

  useEffect(() => {
    if (!profile || !draftKey) return;
    if (!id) {
      const draft = readLocalDraft();
      if (draft) setLocalDraft(draft);
      hydratedRef.current = true;
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchNoteById(id, profile.id)
      .then((note) => {
        if (note) {
          reset({
            subject: note.subject,
            class_level: note.class_level,
            term: note.term,
            week: note.week,
            topic: note.topic,
            objectives: note.objectives,
            materials: note.materials,
            introduction: note.introduction,
            main_content: note.main_content,
            evaluation: note.evaluation,
            teachers_presentation: note.teachers_presentation || '',
            assignment: note.assignment,
          });
          setExistingNote(note);
          const locked = note.status === 'submitted' || note.status === 'approved';
          setNoteLocked(locked);
          const draft = locked ? null : readLocalDraft();
          if (draft) setLocalDraft(draft);
          hydratedRef.current = true;
        }
      })
      .catch(() => {
        const draft = readLocalDraft();
        if (draft) {
          setLocalDraft(draft);
          hydratedRef.current = true;
          toast.error('Unable to load from server. Your local draft is still available.');
        } else {
          toast.error('Unable to load note');
          navigate('/notes');
        }
      })
      .finally(() => setLoading(false));
  }, [draftKey, id, navigate, profile, reset]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (!draftKey || loading || noteLocked || localDraft || !hydratedRef.current) return;

    const valuesToSave = formFields.reduce<Record<string, string>>((acc, field) => {
      acc[field] = watchedValues[field] ?? '';
      return acc;
    }, {});

    if (!hasDraftContent(valuesToSave)) return;

    setAutoSaveStatus('saving');
    const timeoutId = window.setTimeout(() => {
      try {
        const savedAt = new Date().toISOString();
        const draft: LocalDraft = {
          savedAt,
          noteId: id ?? 'new',
          values: valuesToSave,
        };
        localStorage.setItem(draftKey, JSON.stringify(draft));
        setLastLocalSave(savedAt);
        setAutoSaveStatus('saved');
      } catch {
        setAutoSaveStatus('error');
      }
    }, AUTO_SAVE_DELAY_MS);

    return () => window.clearTimeout(timeoutId);
  }, [draftKey, existingNote, id, loading, localDraft, noteLocked, watchedValues]);

  useEffect(() => {
    const saveBeforeUnload = () => {
      if (!draftKey || noteLocked || localDraft || !hydratedRef.current) return;
      const valuesToSave = formFields.reduce<Record<string, string>>((acc, field) => {
        acc[field] = watchedValues[field] ?? '';
        return acc;
      }, {});
      if (!hasDraftContent(valuesToSave)) return;
      try {
        localStorage.setItem(
          draftKey,
          JSON.stringify({
            savedAt: new Date().toISOString(),
            noteId: id ?? 'new',
            values: valuesToSave,
          }),
        );
      } catch {
        // Best-effort protection during tab close.
      }
    };

    window.addEventListener('beforeunload', saveBeforeUnload);
    return () => window.removeEventListener('beforeunload', saveBeforeUnload);
  }, [draftKey, id, localDraft, noteLocked, watchedValues]);

  const latestNote = async () => {
    if (!profile) return;
    setDuplicateLoading(true);
    try {
      const notes = await fetchTeacherNotes(profile.id);
      const last = notes.find((note) => note.id !== id && note.status !== 'draft');
      if (!last) {
        toast('No previous note found to duplicate', { icon: 'ℹ️' });
        return;
      }
      reset({
        subject: last.subject,
        class_level: last.class_level,
        term: last.term,
        week: last.week,
        topic: last.topic,
        objectives: last.objectives,
        materials: last.materials,
        introduction: last.introduction,
        main_content: last.main_content,
        evaluation: last.evaluation,
        teachers_presentation: last.teachers_presentation || '',
        assignment: last.assignment,
      });
      toast.success('Previous note copied. Changes are protected locally.');
    } finally {
      setDuplicateLoading(false);
    }
  };

  const onSubmit = async (data: Record<string, string>, status: 'draft' | 'submitted') => {
    if (!profile) return;
    if (noteLocked) {
      toast.error('This note is locked from editing.');
      return;
    }

    if (isBlankRichText(mainContent)) {
      toast.error('Main content is required');
      return;
    }

    const payload = {
      teacher_id: profile.id,
      subject: data.subject,
      class_level: data.class_level,
      term: data.term,
      week: data.week,
      topic: data.topic,
      objectives: data.objectives,
      materials: data.materials,
      introduction: data.introduction,
      main_content: mainContent,
      evaluation: data.evaluation,
      teachers_presentation: data.teachers_presentation,
      assignment: data.assignment,
      status,
      admin_comment: existingNote?.admin_comment ?? null,
      submitted_at: status === 'submitted' ? new Date().toISOString() : null,
    };

    try {
      if (id && existingNote) {
        await updateLessonNote(id, payload);
        toast.success(status === 'submitted' ? 'Lesson submitted' : 'Draft saved');
      } else {
        await createLessonNote(payload as any);
        toast.success(status === 'submitted' ? 'Lesson submitted' : 'Draft saved');
      }
      clearLocalDraft();
      navigate('/notes');
    } catch (error: any) {
      toast.error(error?.message || 'Unable to save note. Your work is still protected locally.');
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading note…</div>;
  }

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate('/notes')}>
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Lesson note form</p>
              <h1 className="mt-2 text-3xl font-semibold text-slate-900">{id ? 'Edit lesson note' : 'Create a new lesson note'}</h1>
            </div>
          </div>
        </div>
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 shadow-soft">
          <PageHeader title="Lesson note details" description="Complete all sections and save your work as a draft or submit for review." />
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-600">Use AI to generate a structured lesson draft based on your topic and grade level.</p>
            <Button type="button" variant="secondary" onClick={openAiPanel} disabled={noteLocked || aiGenerating}>
              {aiGenerating ? 'Generating…' : 'Generate with AI'}
            </Button>
          </div>
          {noteLocked ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
              This lesson note has already been submitted or approved. You cannot edit it further unless it is rejected.
            </div>
          ) : null}
          {isAiPanelOpen ? (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4">
              <div className="max-h-[90vh] w-full max-w-5xl overflow-y-auto rounded-[32px] bg-white p-6 shadow-2xl">
                <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-slate-900">Generate lesson note with AI</h2>
                    <p className="mt-2 text-sm text-slate-500">Fill the inputs below, generate a structured note, then insert it into the form for review.</p>
                  </div>
                  <Button type="button" variant="outline" onClick={closeAiPanel}>
                    Close
                  </Button>
                </div>

                <div className="mb-6 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
                  <label className="text-sm font-medium text-slate-700">Content length:</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setAiGenerationMode('short')}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                        aiGenerationMode === 'short'
                          ? 'bg-slate-900 text-white'
                          : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      Short
                    </button>
                    <button
                      type="button"
                      onClick={() => setAiGenerationMode('detailed')}
                      className={`px-3 py-1 rounded-lg text-sm font-medium transition ${
                        aiGenerationMode === 'detailed'
                          ? 'bg-slate-900 text-white'
                          : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      Detailed
                    </button>
                  </div>
                  <p className="ml-auto text-xs text-slate-600">
                    {aiGenerationMode === 'short' ? 'Concise, ready to expand' : 'More detailed and comprehensive'}
                  </p>
                </div>

                <div className="grid gap-4 lg:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Subject</label>
                    <Input
                      value={aiForm.subject}
                      onChange={(event) => setAiForm((current) => ({ ...current, subject: event.target.value }))}
                      placeholder="Mathematics"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Class</label>
                    <Select
                      value={aiForm.classLevel}
                      onChange={(event) => setAiForm((current) => ({ ...current, classLevel: event.target.value }))}
                    >
                      <option value="">Select class</option>
                      {classLevels.map((level) => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Week</label>
                    <Select
                      value={aiForm.week}
                      onChange={(event) => setAiForm((current) => ({ ...current, week: event.target.value }))}
                    >
                      <option value="">Select week</option>
                      {weeks.map((week) => (
                        <option key={week} value={week}>{week}</option>
                      ))}
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2 mt-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Topic</label>
                    <Input
                      value={aiForm.topic}
                      onChange={(event) => setAiForm((current) => ({ ...current, topic: event.target.value }))}
                      placeholder="Lesson topic"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Duration</label>
                    <Input
                      value={aiForm.duration}
                      onChange={(event) => setAiForm((current) => ({ ...current, duration: event.target.value }))}
                      placeholder="40 minutes"
                    />
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2 mt-4">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Learning level</label>
                    <Select
                      value={aiForm.learningLevel}
                      onChange={(event) => setAiForm((current) => ({ ...current, learningLevel: event.target.value as 'Simple' | 'Moderate' | 'Advanced' }))}
                    >
                      {learningLevels.map((level) => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </Select>
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">Curriculum style</label>
                    <Input
                      value={aiForm.curriculumStyle}
                      onChange={(event) => setAiForm((current) => ({ ...current, curriculumStyle: event.target.value }))}
                      placeholder="Nigerian Curriculum"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="mb-2 block text-sm font-medium text-slate-700">Additional instructions</label>
                  <Textarea
                    value={aiForm.additionalInstructions}
                    onChange={(event) => setAiForm((current) => ({ ...current, additionalInstructions: event.target.value }))}
                    placeholder="Include class activity, use simpler language, add practical examples"
                  />
                </div>

                {aiError ? (
                  <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                    {aiError}
                  </div>
                ) : null}

                {aiGeneratedDraft ? (
                  <div className="mt-6 rounded-3xl border border-slate-200 bg-slate-50 p-5">
                    <div className="mb-4 flex items-center justify-between gap-4">
                      <div>
                        <p className="text-base font-semibold text-slate-900">Generated lesson note ready to insert</p>
                        <p className="mt-1 text-sm text-slate-600">You can review the generated draft and insert it into the note form.</p>
                      </div>
                    </div>
                    <div className="grid gap-4">
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">Learning objectives</h3>
                        <p className="mt-2 text-sm text-slate-600 whitespace-pre-line">{aiGeneratedDraft.objectives}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">Teaching materials</h3>
                        <p className="mt-2 text-sm text-slate-600 whitespace-pre-line">{aiGeneratedDraft.materials}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">Evaluation</h3>
                        <p className="mt-2 text-sm text-slate-600 whitespace-pre-line">{aiGeneratedDraft.evaluation}</p>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-slate-900">Assignment</h3>
                        <p className="mt-2 text-sm text-slate-600 whitespace-pre-line">{aiGeneratedDraft.assignment}</p>
                      </div>
                    </div>
                  </div>
                ) : null}

                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
                  <Button type="button" variant="outline" onClick={closeAiPanel}>
                    Close
                  </Button>
                  <Button type="button" onClick={generateAiDraft} disabled={aiGenerating}>
                    {aiGenerating ? (
                      <>
                        <span className="inline-block mr-2">⏳</span>
                        Generating...
                      </>
                    ) : aiGeneratedDraft ? (
                      'Regenerate draft'
                    ) : (
                      'Generate draft'
                    )}
                  </Button>
                  {aiGeneratedDraft ? (
                    <Button type="button" variant="primary" onClick={insertAiDraft}>
                      Insert into note
                    </Button>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
          {localDraft ? (
            <div className="mb-6 rounded-2xl border border-sky-200 bg-sky-50 px-5 py-4 text-sm text-sky-950">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-semibold">You have an unsaved local draft from {formatRecoveryTime(localDraft.savedAt)}.</p>
                  <p className="mt-1 text-sky-800">Restore it to continue where you stopped, or discard it and keep the current form.</p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button type="button" onClick={restoreLocalDraft}>Restore Draft</Button>
                  <Button type="button" variant="outline" onClick={discardLocalDraft}>Discard Draft</Button>
                </div>
              </div>
            </div>
          ) : !noteLocked ? (
            <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-5 py-3 text-xs font-medium text-slate-600">
              <span className={isOnline ? 'text-emerald-700' : 'text-amber-700'}>
                {isOnline ? 'Online' : 'Offline mode'}
              </span>
              <span>
                {autoSaveStatus === 'saving'
                  ? 'Saving locally...'
                  : autoSaveStatus === 'saved' && lastLocalSave
                    ? `Changes protected locally at ${formatRecoveryTime(lastLocalSave)}`
                    : autoSaveStatus === 'error'
                      ? 'Local auto-save is unavailable'
                      : 'Changes will be protected locally as you type'}
              </span>
            </div>
          ) : null}

          <form className="space-y-6" onSubmit={handleSubmit((data) => onSubmit(data, 'draft'))}>
            <div className="grid gap-4 lg:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Subject</label>
                <Input {...register('subject', { required: 'Subject is required' })} placeholder="Mathematics" disabled={noteLocked} />
                {errors.subject && <p className="mt-1 text-sm text-rose-600">{errors.subject.message}</p>}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Class level</label>
                <Select {...register('class_level', { required: 'Class level is required' })} disabled={noteLocked}>
                  <option value="">Select class</option>
                  {classLevels.map((level) => (
                    <option key={level} value={level}>{level}</option>
                  ))}
                </Select>
                {errors.class_level && <p className="mt-1 text-sm text-rose-600">{errors.class_level.message}</p>}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Term</label>
                <Select {...register('term', { required: 'Term is required' })} disabled={noteLocked}>
                  <option value="">Select term</option>
                  {terms.map((term) => (
                    <option key={term} value={term}>{term}</option>
                  ))}
                </Select>
                {errors.term && <p className="mt-1 text-sm text-rose-600">{errors.term.message}</p>}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Week</label>
                <Select {...register('week', { required: 'Week is required' })} disabled={noteLocked}>
                  <option value="">Select week</option>
                  {weeks.map((week) => (
                    <option key={week} value={week}>{week}</option>
                  ))}
                </Select>
                {errors.week && <p className="mt-1 text-sm text-rose-600">{errors.week.message}</p>}
              </div>
              <div className="lg:col-span-2">
                <label className="mb-2 block text-sm font-medium text-slate-700">Topic</label>
                <Input {...register('topic', { required: 'Topic is required' })} placeholder="Lesson topic" disabled={noteLocked} />
                {errors.topic && <p className="mt-1 text-sm text-rose-600">{errors.topic.message}</p>}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Learning objectives</label>
                <Textarea {...register('objectives', { required: 'Objectives are required' })} placeholder="Describe what students will learn" disabled={noteLocked} />
                {errors.objectives && <p className="mt-1 text-sm text-rose-600">{errors.objectives.message}</p>}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Teaching materials</label>
                <Textarea {...register('materials', { required: 'Materials are required' })} placeholder="List any resources or materials" disabled={noteLocked} />
                {errors.materials && <p className="mt-1 text-sm text-rose-600">{errors.materials.message}</p>}
              </div>
            </div>

            <div className="grid gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Introduction</label>
                <Textarea {...register('introduction', { required: 'Introduction is required' })} placeholder="Write a short introduction" disabled={noteLocked} />
                {errors.introduction && <p className="mt-1 text-sm text-rose-600">{errors.introduction.message}</p>}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Main lesson content</label>
                <RichTextEditor
                  value={mainContent || ''}
                  onChange={(value) => setValue('main_content', value)}
                  placeholder="Describe the teaching steps and activities. Format with bold, lists, tables, images, and more..."
                  disabled={noteLocked}
                />
                {errors.main_content && <p className="mt-1 text-sm text-rose-600">{errors.main_content.message}</p>}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Evaluation</label>
                <Textarea {...register('evaluation', { required: 'Evaluation is required' })} placeholder="How will you assess learning?" disabled={noteLocked} />
                {errors.evaluation && <p className="mt-1 text-sm text-rose-600">{errors.evaluation.message}</p>}
              </div>
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-700">Assignment</label>
                <Textarea {...register('assignment', { required: 'Assignment is required' })} placeholder="What tasks will learners complete?" disabled={noteLocked} />
                {errors.assignment && <p className="mt-1 text-sm text-rose-600">{errors.assignment.message}</p>}
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">Teacher's presentation</label>
              <Textarea
                {...register('teachers_presentation', { required: "Teacher's presentation is required" })}
                placeholder="Describe how you will present this lesson to the class"
                disabled={noteLocked}
              />
              {errors.teachers_presentation && <p className="mt-1 text-sm text-rose-600">{errors.teachers_presentation.message}</p>}
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button type="button" variant="secondary" onClick={latestNote} disabled={duplicateLoading || noteLocked}>
                  {duplicateLoading ? 'Copying…' : 'Duplicate previous note'}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate('/notes')}>
                  Cancel
                </Button>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button type="submit" disabled={isSubmitting || noteLocked}>
                  Save draft
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleSubmit((data) => onSubmit(data, 'submitted'))}
                  disabled={isSubmitting || noteLocked}
                >
                  Submit note
                </Button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default NoteFormPage;
