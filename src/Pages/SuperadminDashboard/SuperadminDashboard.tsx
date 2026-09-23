import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SuperadminNavbar } from './components/SuperadminNavbar';
import { SuperadminSidebar, type SuperadminTab } from './components/SuperadminSidebar';
import { UserAccountControl, type UserAccount } from './Sidebarpages/UserAccountControl';
import { Notifications } from './Sidebarpages/Notifications';

interface SuperadminDashboardProps {
  userName: string;
  onShowToast: (msg: string) => void;
  onLogout: () => void;
}

export const SuperadminDashboard: React.FC<SuperadminDashboardProps> = ({
  userName,
  onShowToast,
  onLogout,
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = (searchParams.get('tab') as SuperadminTab) || 'users';
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const setActiveTab = (tab: SuperadminTab) => {
    setSearchParams({ tab });
  };

  // Lifted User State
  const [usersList, setUsersList] = useState<UserAccount[]>([
    { id: 'USR-101', name: 'Eleanor Vance', email: 'eleanor.vance@vanguard.io', phone: '+1 (555) 234-5678', companyName: 'Vanguard Capital', status: 'Active', joinedDate: '2026-01-12', renewalDate: '2027-01-12', plan: 'Enterprise Pro', password: 'password123' },
    { id: 'USR-102', name: 'Marcus Thorne', email: 'm.thorne@apexholdings.com', phone: '+1 (555) 987-6543', companyName: 'Apex Holdings', status: 'Active', joinedDate: '2026-03-22', renewalDate: '2027-03-22', plan: 'Institutional Prime', password: 'securepass99' },
    { id: 'USR-103', name: 'Sophia Chen', email: 'sophia.c@quantumcap.org', phone: '+81 90-1234-5678', companyName: 'Quantum Alpha LLC', status: 'Renewal', joinedDate: '2026-05-14', renewalDate: '2027-05-14', plan: 'Enterprise Pro', password: 'quantumalpha!' },
    { id: 'USR-104', name: 'David Miller', email: 'd.miller@fintechglobal.net', phone: '+44 20 7946 0958', companyName: 'Fintech Global', status: 'Inactive', joinedDate: '2025-11-05', renewalDate: '2026-11-05', plan: 'Standard Business', password: 'davidpass001' },
    { id: 'USR-105', name: 'Amara Okafor', email: 'amara@emeraldwealth.co', phone: '+234 803 123 4567', companyName: 'Emerald Wealth', status: 'Active', joinedDate: '2026-07-02', renewalDate: '2027-07-02', plan: 'Enterprise Pro', password: 'wealthamara22' },
  ]);

  return (
    <div className="h-screen bg-[#F5F9E8] text-[#0F172A] flex flex-col font-sans overflow-hidden">
      
      {/* Top Navbar */}
      <SuperadminNavbar
        userName={userName}
        onLogout={onLogout}
        onShowToast={onShowToast}
        toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
      />

      <div className="flex-1 flex overflow-hidden">
        
        {/* Sidebar */}
        <SuperadminSidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isOpen={sidebarOpen}
          onCloseMobile={() => setSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {activeTab === 'users' && (
            <UserAccountControl
              onShowToast={onShowToast}
              usersList={usersList}
              setUsersList={setUsersList}
            />
          )}
          {activeTab === 'notifications' && (
            <Notifications
              onShowToast={onShowToast}
              usersList={usersList}
            />
          )}
        </main>
      </div>

    </div>
  );
};
