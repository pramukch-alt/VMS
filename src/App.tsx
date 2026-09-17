import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardStats, Vehicle, WorkOrder } from './types';
import { fetchDashboardStats, fetchVehicles } from './services/api';
import { Dashboard } from './pages/Dashboard';
import { VehiclesPage } from './pages/VehiclesPage';
import { WorkOrdersPage } from './pages/WorkOrdersPage';
import { FuelLogsPage } from './pages/FuelLogsPage';
import { MaintenancePage } from './pages/MaintenancePage';
import { Pn1ReportPage } from './pages/Pn1ReportPage';
import { UserManagementPage } from './pages/UserManagementPage';
import { VehicleDrawer } from './components/VehicleDrawer';
import { WorkOrderModal } from './components/WorkOrderModal';
import { CompleteWorkOrderModal } from './components/CompleteWorkOrderModal';
import { FuelLogModal } from './components/FuelLogModal';

export function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedDepartmentFilter, setSelectedDepartmentFilter] = useState<string>('all');
  const [taxDueOnlyFilter, setTaxDueOnlyFilter] = useState<boolean>(false);

  // Modals & Drawers state
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);
  const [isWorkOrderModalOpen, setIsWorkOrderModalOpen] = useState(false);
  const [activeWorkOrderToComplete, setActiveWorkOrderToComplete] = useState<WorkOrder | null>(null);
  const [isFuelLogModalOpen, setIsFuelLogModalOpen] = useState(false);
  const [workOrdersRefreshKey, setWorkOrdersRefreshKey] = useState(0);
  const [lastUpdatedWorkOrderId, setLastUpdatedWorkOrderId] = useState<number | null>(null);

  const handleWorkOrderSuccess = (woId?: number) => {
    loadData();
    setWorkOrdersRefreshKey(k => k + 1);
    if (woId) setLastUpdatedWorkOrderId(woId);
    setActiveTab('work-orders');
  };

  const loadData = () => {
    fetchDashboardStats()
      .then(res => setStats(res))
      .catch(err => console.error(err));

    fetchVehicles()
      .then(res => setVehicles(res))
      .catch(err => console.error(err));
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSelectVehicle = (v: Vehicle) => {
    setSelectedVehicleId(v.id);
  };

  const handleSelectDepartmentFilterFromDashboard = (dept: string, taxDueOnly: boolean = false) => {
    setSelectedDepartmentFilter(dept);
    setTaxDueOnlyFilter(taxDueOnly);
    setActiveTab('vehicles');
  };

  return (
    <div className="h-screen w-screen bg-brand-bg flex overflow-hidden font-thai antialiased text-brand-textPrimary">
      {/* Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Main Container Right */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Top Navbar */}
        <Navbar
          taxAlertCount={stats?.metrics.taxDue90Days || 0}
          onOpenAlerts={() => setActiveTab('dashboard')}
        />

        {/* Scrollable Content Area - Expanded Workspace (max-w-[1800px]) */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 max-w-[1800px] w-full mx-auto">
          {activeTab === 'dashboard' && (
            <Dashboard
              stats={stats}
              vehicles={vehicles}
              onSelectVehicle={handleSelectVehicle}
              onNavigateToTab={setActiveTab}
              onSelectDepartmentFilter={handleSelectDepartmentFilterFromDashboard}
            />
          )}

          {activeTab === 'vehicles' && (
            <VehiclesPage
              vehicles={vehicles}
              onSelectVehicle={handleSelectVehicle}
              onRefreshVehicles={loadData}
              selectedDepartmentFilter={selectedDepartmentFilter}
              onDepartmentFilterChange={setSelectedDepartmentFilter}
              taxDueOnlyFilter={taxDueOnlyFilter}
              onTaxDueOnlyChange={setTaxDueOnlyFilter}
            />
          )}

          {activeTab === 'work-orders' && (
            <WorkOrdersPage
              onOpenNewWorkOrder={() => setIsWorkOrderModalOpen(true)}
              onOpenCompleteWorkOrder={(wo) => setActiveWorkOrderToComplete(wo)}
              refreshTrigger={workOrdersRefreshKey}
              highlightId={lastUpdatedWorkOrderId}
            />
          )}

          {activeTab === 'fuel-logs' && (
            <FuelLogsPage
              onOpenNewFuelLog={() => setIsFuelLogModalOpen(true)}
            />
          )}

          {activeTab === 'maintenance' && (
            <MaintenancePage />
          )}

          {activeTab === 'pn1-report' && (
            <Pn1ReportPage />
          )}

          {activeTab === 'user-management' && (
            <UserManagementPage />
          )}
        </main>
      </div>

      {/* Side Drawer for Vehicle Detail */}
      <VehicleDrawer
        vehicleId={selectedVehicleId}
        onClose={() => setSelectedVehicleId(null)}
        onRefresh={loadData}
      />

      {/* Modals */}
      <WorkOrderModal
        isOpen={isWorkOrderModalOpen}
        onClose={() => setIsWorkOrderModalOpen(false)}
        onSuccess={handleWorkOrderSuccess}
      />

      <CompleteWorkOrderModal
        workOrder={activeWorkOrderToComplete}
        onClose={() => setActiveWorkOrderToComplete(null)}
        onSuccess={handleWorkOrderSuccess}
      />

      <FuelLogModal
        isOpen={isFuelLogModalOpen}
        onClose={() => setIsFuelLogModalOpen(false)}
        onSuccess={() => {
          loadData();
          setActiveTab('fuel-logs');
        }}
      />
    </div>
  );
}

export default App;
