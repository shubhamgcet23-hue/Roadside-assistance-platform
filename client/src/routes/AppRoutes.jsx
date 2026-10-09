import { Suspense, lazy } from 'react';
import { Route, Routes } from 'react-router-dom';
import { FullPageLoader } from '../components/ui/index.js';
import AppLayout from '../layouts/AppLayout.jsx';
import PublicLayout from '../layouts/PublicLayout.jsx';
import { GuestRoute, ProtectedRoute } from './ProtectedRoute.jsx';

const page = (loader) => lazy(loader);
const Landing = page(() => import('../pages/public/Landing.jsx'));
const Login = page(() => import('../pages/public/Login.jsx'));
const Register = page(() => import('../pages/public/Register.jsx'));
const NotFound = page(() => import('../pages/shared/NotFound.jsx'));
const Notifications = page(() => import('../pages/shared/Notifications.jsx'));

const UserDashboard = page(() => import('../pages/user/Dashboard.jsx'));
const Vehicles = page(() => import('../pages/user/Vehicles.jsx'));
const RequestWizard = page(() => import('../pages/user/request/RequestWizard.jsx'));
const ActiveRequest = page(() => import('../pages/user/ActiveRequest.jsx'));
const History = page(() => import('../pages/user/History.jsx'));
const RequestDetail = page(() => import('../pages/user/RequestDetail.jsx'));
const UserProfile = page(() => import('../pages/user/Profile.jsx'));

const PartnerDashboard = page(() => import('../pages/partner/Dashboard.jsx'));
const PartnerRequests = page(() => import('../pages/partner/Requests.jsx'));
const ActiveJob = page(() => import('../pages/partner/ActiveJob.jsx'));
const JobHistory = page(() => import('../pages/partner/JobHistory.jsx'));
const Earnings = page(() => import('../pages/partner/Earnings.jsx'));
const PartnerProfile = page(() => import('../pages/partner/Profile.jsx'));
const Availability = page(() => import('../pages/partner/Availability.jsx'));

const AdminDashboard = page(() => import('../pages/admin/Dashboard.jsx'));
const AdminUsers = page(() => import('../pages/admin/Users.jsx'));
const AdminPartners = page(() => import('../pages/admin/Partners.jsx'));
const AdminRequests = page(() => import('../pages/admin/Requests.jsx'));
const AdminServices = page(() => import('../pages/admin/Services.jsx'));
const AdminComplaints = page(() => import('../pages/admin/Complaints.jsx'));
const AdminReports = page(() => import('../pages/admin/Reports.jsx'));
const AdminSettings = page(() => import('../pages/admin/Settings.jsx'));

const PARTNER_ROLES = ['MECHANIC', 'TOWING_PARTNER'];

export default function AppRoutes() {
  return (
    <Suspense fallback={<FullPageLoader />}>
      <Routes>
        <Route element={<PublicLayout />}><Route index element={<Landing />} /></Route>
        <Route path="login" element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="register" element={<GuestRoute><Register /></GuestRoute>} />

        <Route path="app" element={<ProtectedRoute roles={['USER']}><AppLayout /></ProtectedRoute>}>
          <Route index element={<UserDashboard />} />
          <Route path="vehicles" element={<Vehicles />} />
          <Route path="request" element={<RequestWizard />} />
          <Route path="active" element={<ActiveRequest />} />
          <Route path="active/:id" element={<ActiveRequest />} />
          <Route path="history" element={<History />} />
          <Route path="history/:id" element={<RequestDetail />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="profile" element={<UserProfile />} />
        </Route>

        <Route path="partner" element={<ProtectedRoute roles={PARTNER_ROLES}><AppLayout /></ProtectedRoute>}>
          <Route index element={<PartnerDashboard />} />
          <Route path="requests" element={<PartnerRequests />} />
          <Route path="active" element={<ActiveJob />} />
          <Route path="history" element={<JobHistory />} />
          <Route path="earnings" element={<Earnings />} />
          <Route path="profile" element={<PartnerProfile />} />
          <Route path="availability" element={<Availability />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>

        <Route path="admin" element={<ProtectedRoute roles={['ADMIN']}><AppLayout /></ProtectedRoute>}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="partners" element={<AdminPartners />} />
          <Route path="requests" element={<AdminRequests />} />
          <Route path="services" element={<AdminServices />} />
          <Route path="complaints" element={<AdminComplaints />} />
          <Route path="reports" element={<AdminReports />} />
          <Route path="settings" element={<AdminSettings />} />
          <Route path="notifications" element={<Notifications />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </Suspense>
  );
}
