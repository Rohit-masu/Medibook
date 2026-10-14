import { Navigate, Route, Routes } from 'react-router-dom';
import { LoginPage } from '@/features/auth/LoginPage';
import { RequireRole, homeFor } from '@/features/auth/RequireRole';
import { useAuth } from '@/features/auth/AuthContext';
import { MrLayout } from '@/layouts/MrLayout';
import { AdminLayout } from '@/layouts/AdminLayout';
import { MrHomePage } from '@/features/home/MrHomePage';
import { DoctorsListPage } from '@/features/doctors/DoctorsListPage';
import { DoctorProfilePage } from '@/features/doctors/DoctorProfilePage';
import { OnboardDoctorPage } from '@/features/doctors/OnboardDoctorPage';
import { AdminDashboard } from '@/features/admin/AdminDashboard';
import { AdminDoctorsPage } from '@/features/admin/AdminDoctorsPage';
import { AdminMrsPage } from '@/features/admin/AdminMrsPage';

function RootRedirect() {
  const { user } = useAuth();
  return <Navigate to={user ? homeFor(user.role) : '/login'} replace />;
}

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />

      <Route element={<RequireRole role="mr" />}>
        <Route path="/app" element={<MrLayout />}>
          <Route index element={<MrHomePage />} />
          <Route path="doctors" element={<DoctorsListPage />} />
          <Route path="doctors/new" element={<OnboardDoctorPage />} />
          <Route path="doctors/:id" element={<DoctorProfilePage />} />
        </Route>
      </Route>

      <Route element={<RequireRole role="admin" />}>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="doctors" element={<AdminDoctorsPage />} />
          <Route path="mrs" element={<AdminMrsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<RootRedirect />} />
    </Routes>
  );
}
