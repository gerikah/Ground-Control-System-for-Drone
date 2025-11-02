import React, { useState, useEffect } from 'react';

import Sidebar from './components/ControlPanel'; 
import DashboardHeader from './components/Header'; 
import LiveMissionView from './components/LiveMissionView';
import DashboardView from './components/DashboardView';
import AnalyticsPanel from './components/AnalyticsPanel';
import FlightLogsPanel from './components/FlightLogsPanel';
import SettingsPanel from './components/SettingsPanel';
import MissionSetupView from './components/MissionSetupView';
import GuidePanel from './components/GuidePanel';
import AboutPanel from './components/AboutPanel';

import { useDashboardData } from './hooks/useDroneSimulation'; 
import type { Mission, BreedingSiteInfo, MissionPlan, LiveTelemetry } from './types';

const initialMissions: Mission[] = [
  { id: 'm12', name: 'Mission 12', date: 'Oct 9, 2025', duration: '22 mins', status: 'Completed', location: '428 Sampaloc', gpsTrack: [{lat: 34.0522, lon: -118.2437}, {lat: 34.0525, lon: -118.2440}, {lat: 34.0528, lon: -118.2435}], detectedSites: [{type: 'Open', object: 'Old Tires'}] },
  { id: 'm11', name: 'Mission 11', date: 'Oct 9, 2025', duration: '30 mins', status: 'Interrupted', location: '428 Sampaloc' },
  { id: 'm10', name: 'Mission 10', date: 'Oct 8, 2025', duration: '27 mins', status: 'Completed', location: '428 Sampaloc', gpsTrack: [{lat: 34.0532, lon: -118.2427}, {lat: 34.0535, lon: -118.2430}, {lat: 34.0538, lon: -118.2425}], detectedSites: [{type: 'Enclosed', object: 'Flower Pots'}, {type: 'Open', object: 'Stagnant Puddle'}] },
  { id: 'm09', name: 'Mission 9', date: 'Oct 6, 2025', duration: '24 mins', status: 'Completed', location: '428 Sampaloc' },
  { id: 'm08', name: 'Mission 8', date: 'Oct 4, 2025', duration: '31 mins', status: 'Completed', location: '428 Sampaloc' },
  { id: 'm07', name: 'Mission 7', date: 'Oct 4, 2025', duration: '19 mins', status: 'Interrupted', location: '428 Sampaloc' },
  { id: 'm06', name: 'Mission 6', date: 'Oct 3, 2025', duration: '22 mins', status: 'Completed', location: '428 Sampaloc' },
];

type View = 'dashboard' | 'analytics' | 'flightLogs' | 'settings' | 'guide' | 'about';

const App: React.FC = () => {
  const [isMissionActive, setMissionActive] = useState(false);
  const [missionPlan, setMissionPlan] = useState<MissionPlan | null>(null);
  const [isSetupViewVisible, setSetupViewVisible] = useState(false);
  const [isDarkMode, setDarkMode] = useState(false);

  const [missions, setMissions] = useState<Mission[]>(initialMissions);
  const { overviewStats, time, date, liveTelemetry, setArmedState } = useDashboardData(isMissionActive);
  const [currentView, setCurrentView] = useState<View>('dashboard');

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);
  
  const endMission = (duration: string, gpsTrack: { lat: number; lon: number }[], detectedSites: BreedingSiteInfo[]) => {
    const newMission: Mission = {
        id: `m-${Date.now()}`,
        name: missionPlan?.name || `Mission ${missions.length + 1}`,
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        duration: `${Math.round(parseInt(duration.split(':')[0]) * 60 + parseInt(duration.split(':')[1]))} secs`,
        status: 'Completed',
        location: 'Live Location',
        gpsTrack,
        detectedSites,
    };
    setMissions(prevMissions => [newMission, ...prevMissions]);
    setMissionActive(false);
    setMissionPlan(null);
  };
  
  const handleLaunchMission = (plan: MissionPlan) => {
    setMissionPlan(plan);
    setSetupViewVisible(false);
    setMissionActive(true);
  };

  const handleOpenMissionSetup = () => {
    setSetupViewVisible(true);
  };


  const renderView = () => {
    switch (currentView) {
      case 'analytics':
        return <AnalyticsPanel missions={missions} />;
      case 'flightLogs':
        return <FlightLogsPanel missions={missions} />;
      case 'settings':
        return <SettingsPanel isDarkMode={isDarkMode} onToggleDarkMode={() => setDarkMode(!isDarkMode)} />;
      case 'guide':
        return <GuidePanel />;
      case 'about':
        return <AboutPanel />;
      case 'dashboard':
      default:
        return <DashboardView overviewStats={overviewStats} missions={missions} onMissionSetup={handleOpenMissionSetup} telemetry={liveTelemetry} setArmedState={setArmedState} />;
    }
  };
  
  const viewTitles: Record<View, string> = {
    dashboard: 'Dashboard',
    analytics: 'Analytics',
    flightLogs: 'Flight Logs',
    settings: 'Settings',
    guide: 'Guide',
    about: 'About Project',
  };

  return (
    <div className="flex h-screen bg-gcs-background text-gcs-text-dark font-sans dark:bg-gcs-dark dark:text-gcs-text-light overflow-hidden">
      <Sidebar currentView={currentView} onNavigate={setCurrentView} />
      <main className="flex-1 flex flex-col p-4 overflow-hidden">
        <DashboardHeader time={time} date={date} title={viewTitles[currentView]} batteryPercentage={liveTelemetry.battery.percentage} />
        <div className="flex-1 overflow-y-auto min-h-0">
          {renderView()}
        </div>
      </main>
      
      {isSetupViewVisible && <MissionSetupView onLaunch={handleLaunchMission} onClose={() => setSetupViewVisible(false)} />}
      {isMissionActive && <LiveMissionView telemetry={liveTelemetry} onEndMission={endMission} />}
    </div>
  );
};

export default App;