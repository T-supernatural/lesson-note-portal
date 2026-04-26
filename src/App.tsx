import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import TeacherDashboardPage from './pages/TeacherDashboardPage';
import NotesPage from './pages/NotesPage';
import NoteFormPage from './pages/NoteFormPage';
import NoteViewPage from './pages/NoteViewPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminNotesPage from './pages/AdminNotesPage';
import AdminReviewPage from './pages/AdminReviewPage';
import ProtectedRoute from './layouts/ProtectedRoute';

function App() {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="rounded-3xl bg-white p-8 shadow-soft text-slate-900">
          <p className="text-lg font-semibold">Loading portal…</p>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute requiredRole="teacher">
            <TeacherDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notes"
        element={
          <ProtectedRoute requiredRole="teacher">
            <NotesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notes/new"
        element={
          <ProtectedRoute requiredRole="teacher">
            <NoteFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notes/:id/edit"
        element={
          <ProtectedRoute requiredRole="teacher">
            <NoteFormPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/notes/:id"
        element={
          <ProtectedRoute requiredRole="teacher">
            <NoteViewPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/notes"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminNotesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/notes/:id"
        element={
          <ProtectedRoute requiredRole="admin">
            <AdminReviewPage />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={profile ? <Navigate to={profile.role === 'admin' ? '/admin' : '/dashboard'} /> : <Navigate to="/login" />} />
      <Route path="*" element={<Navigate to={profile ? (profile.role === 'admin' ? '/admin' : '/dashboard') : '/login'} />} />
    </Routes>
  );
}

export default App;
