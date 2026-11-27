import React, { useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from './store/authSlice';
import { setFurnitureList } from './store/furnitureSlice';
import { setTransfersList } from './store/transfersSlice';
import { setInspectionsList } from './store/inspectionsSlice';
import { setUsersList } from './store/usersSlice';
import { setNotificationsList } from './store/notificationsSlice';
import { setPurchaseHistoryList } from './store/purchaseHistorySlice';
import { api } from './api';
import { Sidebar } from './components/Sidebar';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { FurnitureList } from './pages/FurnitureList';
import { AddFurniture } from './pages/AddFurniture';
import { FurnitureDetail } from './pages/FurnitureDetail';
import { CategoryPage } from './pages/CategoryPage';
import { Buildings } from './pages/Buildings';
import { Departments } from './pages/Departments';
import { Rooms } from './pages/Rooms';
import { Transfers } from './pages/Transfers';
import { Inspections } from './pages/Inspections';
import { Users } from './pages/Users';
import { Settings } from './pages/Settings';
import { Profile } from './pages/Profile';
import { NotificationsPage } from './pages/NotificationsPage';
import { Maintenance } from './pages/Maintenance';
import { Vendors } from './pages/Vendors';
import { Purchases } from './pages/Purchases';
import { AuditLogs } from './pages/AuditLogs';
import { Analytics } from './pages/Analytics';
import { FurnitureDashboard } from './pages/furniture/FurnitureDashboard';
import { PurchaseRequests } from './pages/furniture/PurchaseRequests';
import { PurchaseRequestDetail } from './pages/furniture/PurchaseRequestDetail';
import { DealerManagement } from './pages/furniture/DealerManagement';
import { QuotationManagement } from './pages/furniture/QuotationManagement';
import { QuotationComparison } from './pages/furniture/QuotationComparison';
import { PurchaseOrders } from './pages/furniture/PurchaseOrders';
import { DeliveryTracking } from './pages/furniture/DeliveryTracking';
import { ServicingRequests } from './pages/furniture/ServicingRequests';
import { ServicingDetail } from './pages/furniture/ServicingDetail';
import { DealerAssignments } from './pages/furniture/DealerAssignments';
import { Approvals } from './pages/furniture/Approvals';
import { ProcurementReports } from './pages/furniture/ProcurementReports';
import { DealerPortal } from './pages/furniture/DealerPortal';

import { AIChatbot } from './components/AIChatbot';

export default function App() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { currentUser } = useSelector((state) => state.auth);
  const role = currentUser?.role || '';
  const isDealer = role === 'dealer';

  // Synchronize with MySQL database on mount (skip college-wide data for external dealers)
  useEffect(() => {
    async function syncDatabase() {
      try {
        if (isDealer) {
          const notifications = await api.getNotifications({
            userId: currentUser.id || currentUser.username,
            role: currentUser.role,
          });
          if (Array.isArray(notifications)) {
            dispatch(setNotificationsList(notifications));
          }
          return;
        }

        const [assets, transfers, inspections, users, notifications, purchases] = await Promise.allSettled([
          api.getAssets(),
          api.getTransfers(),
          api.getInspections(),
          api.getUsers(),
          api.getNotifications(
            currentUser
              ? { userId: currentUser.id || currentUser.username, role: currentUser.role, department: currentUser.department }
              : {}
          ),
          api.getPurchaseHistory(),
        ]);

        if (assets.status === 'fulfilled' && Array.isArray(assets.value) && assets.value.length > 0) {
          dispatch(setFurnitureList(assets.value));
        }
        if (transfers.status === 'fulfilled' && Array.isArray(transfers.value) && transfers.value.length > 0) {
          dispatch(setTransfersList(transfers.value));
        }
        if (inspections.status === 'fulfilled' && Array.isArray(inspections.value) && inspections.value.length > 0) {
          dispatch(setInspectionsList(inspections.value));
        }
        if (users.status === 'fulfilled' && Array.isArray(users.value) && users.value.length > 0) {
          dispatch(setUsersList(users.value));
        }
        if (notifications.status === 'fulfilled' && Array.isArray(notifications.value) && notifications.value.length > 0) {
          dispatch(setNotificationsList(notifications.value));
        }
        if (purchases.status === 'fulfilled' && Array.isArray(purchases.value) && purchases.value.length > 0) {
          dispatch(setPurchaseHistoryList(purchases.value));
        }
      } catch (err) {
        console.warn('Backend sync warning (fallback to local state):', err.message);
      }
    }

    syncDatabase();
  }, [dispatch, isDealer, currentUser?.id]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  if (!currentUser) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  const isSuperAdmin = role === 'superadmin';
  const isFurnitureAdmin = role === 'furniture_admin';
  const isDeptAdmin = role === 'deptadmin';
  const isAuditor = role === 'auditor';

  const canAccessFurnitureMgmt = isSuperAdmin || isFurnitureAdmin || isAuditor;
  const canAccessRequestsAndServicing = isSuperAdmin || isFurnitureAdmin || isDeptAdmin || isAuditor;
  const canManageDealers = isSuperAdmin || isFurnitureAdmin;

  const homeElement = isFurnitureAdmin ? (
    <FurnitureDashboard />
  ) : isDealer ? (
    <DealerPortal />
  ) : (
    <Dashboard />
  );

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950/20 overflow-hidden transition-colors duration-300">
      <Sidebar
        user={currentUser}
        onLogout={handleLogout}
      />
      <main className="flex-1 ml-64 overflow-y-auto">
        <div className="p-6 sm:p-8 max-w-[1280px] mx-auto animate-in fade-in slide-in-from-bottom-2 duration-300">
          {isDealer ? (
            <Routes>
              <Route path="/" element={<Navigate to="/dealer/portal" replace />} />
              <Route path="/login" element={<Navigate to="/dealer/portal" replace />} />
              <Route path="/dealer/portal" element={<DealerPortal />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="*" element={<Navigate to="/dealer/portal" replace />} />
            </Routes>
          ) : (
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/login" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={homeElement} />
              <Route path="/analytics" element={!isFurnitureAdmin ? <Analytics /> : <Navigate to="/furniture-admin/reports" replace />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/assets" element={<FurnitureList />} />
              <Route path="/assets/new" element={!isFurnitureAdmin && !isAuditor ? <AddFurniture /> : <Navigate to="/dashboard" replace />} />
              <Route path="/assets/edit/:id" element={!isFurnitureAdmin && !isAuditor ? <AddFurniture /> : <Navigate to="/dashboard" replace />} />
              <Route path="/assets/:id" element={<FurnitureDetail />} />
              <Route path="/category" element={<CategoryPage />} />
              <Route path="/buildings" element={isSuperAdmin ? <Buildings /> : <Navigate to="/dashboard" replace />} />
              <Route path="/departments" element={isSuperAdmin ? <Departments /> : <Navigate to="/dashboard" replace />} />
              <Route path="/rooms" element={!isFurnitureAdmin ? <Rooms /> : <Navigate to="/dashboard" replace />} />
              <Route path="/transfers" element={!isFurnitureAdmin ? <Transfers /> : <Navigate to="/dashboard" replace />} />
              <Route path="/inspections" element={!isFurnitureAdmin ? <Inspections /> : <Navigate to="/dashboard" replace />} />
              <Route path="/maintenance" element={isSuperAdmin ? <Maintenance /> : <Navigate to="/dashboard" replace />} />
              <Route path="/vendors" element={isSuperAdmin ? <Vendors /> : <Navigate to="/dashboard" replace />} />
              <Route path="/purchases" element={<Purchases />} />
              <Route path="/audit-logs" element={isSuperAdmin ? <AuditLogs /> : <Navigate to="/dashboard" replace />} />
              <Route path="/users" element={isSuperAdmin ? <Users /> : <Navigate to="/dashboard" replace />} />
              <Route path="/settings" element={isSuperAdmin ? <Settings /> : <Navigate to="/dashboard" replace />} />
              <Route path="/profile" element={<Profile />} />

              {/* Furniture Administration Module Routes */}
              <Route path="/furniture-admin/dashboard" element={canAccessFurnitureMgmt ? <FurnitureDashboard /> : <Navigate to="/dashboard" replace />} />
              <Route path="/furniture-admin/purchase-requests" element={canAccessRequestsAndServicing ? <PurchaseRequests /> : <Navigate to="/dashboard" replace />} />
              <Route path="/furniture-admin/purchase-requests/:id" element={canAccessRequestsAndServicing ? <PurchaseRequestDetail /> : <Navigate to="/dashboard" replace />} />
              <Route path="/furniture-admin/dealers" element={canManageDealers ? <DealerManagement /> : <Navigate to="/dashboard" replace />} />
              <Route path="/furniture-admin/quotations" element={canAccessFurnitureMgmt ? <QuotationManagement /> : <Navigate to="/dashboard" replace />} />
              <Route path="/furniture-admin/quotations/compare" element={canAccessFurnitureMgmt ? <QuotationComparison /> : <Navigate to="/dashboard" replace />} />
              <Route path="/furniture-admin/quotations/compare/:requestId" element={canAccessFurnitureMgmt ? <QuotationComparison /> : <Navigate to="/dashboard" replace />} />
              <Route path="/furniture-admin/purchase-orders" element={canAccessRequestsAndServicing ? <PurchaseOrders /> : <Navigate to="/dashboard" replace />} />
              <Route path="/furniture-admin/deliveries" element={canAccessFurnitureMgmt ? <DeliveryTracking /> : <Navigate to="/dashboard" replace />} />
              <Route path="/furniture-admin/servicing" element={canAccessRequestsAndServicing ? <ServicingRequests /> : <Navigate to="/dashboard" replace />} />
              <Route path="/furniture-admin/servicing/:id" element={canAccessRequestsAndServicing ? <ServicingDetail /> : <Navigate to="/dashboard" replace />} />
              <Route path="/furniture-admin/assignments" element={canAccessFurnitureMgmt ? <DealerAssignments /> : <Navigate to="/dashboard" replace />} />
              <Route path="/furniture-admin/approvals" element={canAccessFurnitureMgmt ? <Approvals /> : <Navigate to="/dashboard" replace />} />
              <Route path="/furniture-admin/reports" element={canAccessFurnitureMgmt ? <ProcurementReports /> : <Navigate to="/dashboard" replace />} />

              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          )}
        </div>
      </main>

      {/* Global AI Assistant across campus admin screens (hidden for external dealers) */}
      {!isDealer && <AIChatbot />}
    </div>
  );
}
