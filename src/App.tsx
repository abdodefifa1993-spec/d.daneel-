/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/common/Header';
import { PassengerApp } from './components/passenger/PassengerApp';
import { DriverApp } from './components/driver/DriverApp';
import { OwnerDashboard } from './components/owner/OwnerDashboard';
import { LiveMonitoringCenter } from './components/monitoring/LiveMonitoringCenter';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { ManagerDashboard } from './components/manager/ManagerDashboard';
import { DispatcherPortal } from './components/dispatcher/DispatcherPortal';
import { CallCenterDashboard } from './components/callcenter/CallCenterDashboard';
import { SupportDashboard } from './components/support/SupportDashboard';
import { TechRoadmap } from './components/roadmap/TechRoadmap';
import { DeliveryApp } from './components/delivery/DeliveryApp';

const MainContent: React.FC = () => {
  const { role } = useApp();

  return (
    <main className="min-h-[calc(100vh-4.5rem)] pb-6">
      {role === 'passenger' && <PassengerApp />}
      {role === 'driver' && <DriverApp />}
      {role === 'delivery' && <DeliveryApp />}
      {role === 'owner' && <OwnerDashboard />}
      {role === 'monitoring' && <LiveMonitoringCenter />}
      {role === 'admin' && <AdminDashboard />}
      {role === 'manager' && <ManagerDashboard />}
      {role === 'dispatcher' && <DispatcherPortal />}
      {role === 'call_center' && <CallCenterDashboard />}
      {role === 'support' && <SupportDashboard />}
      {role === 'roadmap' && <TechRoadmap />}
    </main>
  );
};

export default function App() {
  return (
    <AppProvider>
      <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-amber-500 selection:text-slate-950 font-sans" dir="rtl">
        <Header />
        <MainContent />
      </div>
    </AppProvider>
  );
}

