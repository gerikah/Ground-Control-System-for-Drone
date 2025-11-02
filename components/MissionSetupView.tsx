import React, { useState, useRef, useMemo } from 'react';
import type { MissionPlan } from '../types';
import LoadPlanModal from './LoadPlanModal';

const MAP_BOUNDS = {
    minLat: 34.0500, maxLat: 34.0550,
    minLon: -118.2450, maxLon: -118.2400,
};

interface MissionSetupViewProps {
    onLaunch: (plan: MissionPlan) => void;
    onClose: () => void;
}

const CloseIcon = () => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
);

const MissionSetupView: React.FC<MissionSetupViewProps> = ({ onLaunch, onClose }) => {
    const [missionName, setMissionName] = useState('New Mission Plan');
    const [altitude, setAltitude] = useState(50);
    const [speed, setSpeed] = useState(10);
    const [checklist, setChecklist] = useState([
        { id: 'battery', text: 'Battery Charged & Secure', checked: false },
        { id: 'props', text: 'Propellers Secure', checked: false },
        { id: 'gps', text: 'GPS Lock Acquired', checked: false },
        { id: 'weather', text: 'Weather Conditions Checked', checked: false },
    ]);
    const [isLoadModalOpen, setLoadModalOpen] = useState(false);
    
    const [history, setHistory] = useState<({ lat: number; lon: number }[])[]>([[]]);
    const [historyIndex, setHistoryIndex] = useState(0);
    const [draggingWaypointIndex, setDraggingWaypointIndex] = useState<number | null>(null);

    const waypoints = history[historyIndex];

    const mapContainerRef = useRef<HTMLDivElement>(null);
    const isChecklistComplete = useMemo(() => checklist.every(item => item.checked), [checklist]);

    const updateWaypoints = (newWaypoints: { lat: number; lon: number }[]) => {
        const newHistory = history.slice(0, historyIndex + 1);
        newHistory.push(newWaypoints);
        setHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
    };

    const screenToWorld = (x: number, y: number, rect: DOMRect) => {
        const lon = MAP_BOUNDS.minLon + (x / rect.width) * (MAP_BOUNDS.maxLon - MAP_BOUNDS.minLon);
        const lat = MAP_BOUNDS.maxLat - (y / rect.height) * (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat);
        return { lat, lon };
    };
    
    const handleMapClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (draggingWaypointIndex !== null || !mapContainerRef.current) return;
        const rect = mapContainerRef.current.getBoundingClientRect();
        const { lat, lon } = screenToWorld(e.clientX - rect.left, e.clientY - rect.top, rect);
        updateWaypoints([...waypoints, { lat, lon }]);
    };

    const handleWaypointDrag = (e: React.MouseEvent<HTMLDivElement>) => {
        if (draggingWaypointIndex === null || !mapContainerRef.current) return;

        const rect = mapContainerRef.current.getBoundingClientRect();
        const { lat, lon } = screenToWorld(e.clientX - rect.left, e.clientY - rect.top, rect);
        
        const newWaypoints = [...waypoints];
        newWaypoints[draggingWaypointIndex] = { lat, lon };

        const updatedHistory = [...history];
        updatedHistory[historyIndex] = newWaypoints;
        setHistory(updatedHistory);
    };

    const handleMouseUp = () => {
        if (draggingWaypointIndex !== null) {
            updateWaypoints(history[historyIndex]);
        }
        setDraggingWaypointIndex(null);
    };
    
    const worldToScreen = (lat: number, lon: number, rect: DOMRect) => {
        const x = ((lon - MAP_BOUNDS.minLon) / (MAP_BOUNDS.maxLon - MAP_BOUNDS.minLon)) * rect.width;
        const y = ((MAP_BOUNDS.maxLat - lat) / (MAP_BOUNDS.maxLat - MAP_BOUNDS.minLat)) * rect.height;
        return { x, y };
    };
    
    const svgPathPoints = useMemo(() => {
        if (!mapContainerRef.current || waypoints.length === 0) return '';
        const rect = mapContainerRef.current.getBoundingClientRect();
        return waypoints.map(wp => {
            const { x, y } = worldToScreen(wp.lat, wp.lon, rect);
            return `${x},${y}`;
        }).join(' ');
    }, [waypoints, mapContainerRef.current]);

    const handleChecklistItemToggle = (id: string) => {
        setChecklist(prev => prev.map(item => item.id === id ? { ...item, checked: !item.checked } : item));
    };
    
    const handleCheckAll = () => {
        setChecklist(prev => prev.map(item => ({ ...item, checked: true })));
    };

    const handleLaunchClick = () => {
        const plan: MissionPlan = {
            name: missionName,
            waypoints,
            altitude,
            speed,
        };
        onLaunch(plan);
    };

    const handleSavePlan = () => {
        const newPlan: MissionPlan = {
            id: `plan-${Date.now()}`,
            name: missionName,
            waypoints,
            altitude,
            speed,
        };
        const savedPlansRaw = localStorage.getItem('gcs-mission-plans');
        const savedPlans: MissionPlan[] = savedPlansRaw ? JSON.parse(savedPlansRaw) : [];
        savedPlans.push(newPlan);
        localStorage.setItem('gcs-mission-plans', JSON.stringify(savedPlans));
        alert(`Mission plan "${missionName}" saved!`);
    };

    const handleLoadPlan = (plan: MissionPlan) => {
        setMissionName(plan.name);
        setHistory([plan.waypoints]);
        setHistoryIndex(0);
        setAltitude(plan.altitude);
        setSpeed(plan.speed);
        setLoadModalOpen(false);
    };

    const handleUndo = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (historyIndex > 0) {
            setHistoryIndex(historyIndex - 1);
        }
    };
    
    const handleRedo = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (historyIndex < history.length - 1) {
            setHistoryIndex(historyIndex + 1);
        }
    };

    const handleClearWaypoints = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        if (waypoints.length > 0) {
            updateWaypoints([]);
        }
    };

    return (
        <>
            <div className="fixed inset-0 bg-gcs-dark bg-opacity-95 backdrop-blur-sm z-40 flex flex-col p-4 text-gcs-text-light font-sans animate-fade-in">
                <header className="flex justify-between items-center pb-3 border-b border-gray-700">
                    <h1 className="text-xl font-bold text-white">Mission Setup & Pre-flight Checklist</h1>
                    <button onClick={onClose} className="text-gray-400 hover:text-white p-1.5 rounded-full hover:bg-white/10 transition-colors">
                        <CloseIcon />
                    </button>
                </header>

                <div className="flex-grow flex flex-col lg:flex-row gap-4 mt-4 overflow-hidden min-h-0">
                    <div className="flex-[2] flex flex-col gap-3 min-h-0">
                        <h3 className="text-base font-semibold text-gcs-orange">Flight Path Planning</h3>
                        <div 
                            ref={mapContainerRef} 
                            onClick={handleMapClick}
                            onMouseMove={handleWaypointDrag}
                            onMouseUp={handleMouseUp}
                            onMouseLeave={handleMouseUp}
                            className={`flex-1 bg-gray-900 rounded-xl overflow-hidden relative border-2 border-gray-700 min-h-0 ${draggingWaypointIndex !== null ? 'cursor-grabbing' : 'cursor-crosshair'}`}
                        >
                            <img src="https://images.unsplash.com/photo-1542435520-2504a3771520?q=80&w=1200&auto=format&fit=crop" alt="Map" className="w-full h-full object-cover opacity-30 pointer-events-none" />
                            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                                {svgPathPoints && <polyline points={svgPathPoints} fill="none" stroke="#F97316" strokeWidth="3" strokeDasharray="5 5" />}
                                {waypoints.map((wp, index) => {
                                    if (!mapContainerRef.current) return null;
                                    const { x, y } = worldToScreen(wp.lat, wp.lon, mapContainerRef.current.getBoundingClientRect());
                                    return (
                                        <g key={index} onMouseDown={(e) => { e.stopPropagation(); setDraggingWaypointIndex(index); }} style={{ cursor: 'grab', pointerEvents: 'all' }}>
                                            <circle cx={x} cy={y} r="12" fill="transparent" />
                                            <circle cx={x} cy={y} r="8" fill={draggingWaypointIndex === index ? 'rgba(249, 115, 22, 0.5)' : 'rgba(249, 115, 22, 0.3)'} />
                                            <circle cx={x} cy={y} r="4" fill="#F97316" stroke="white" strokeWidth="1.5" />
                                            <text x={x+10} y={y+5} fontSize="12" fill="white" className="font-mono font-bold">{index + 1}</text>
                                        </g>
                                    )
                                })}
                            </svg>
                            <div className="absolute top-2 right-2 flex gap-1.5">
                                <button onClick={handleUndo} disabled={historyIndex <= 0} className="bg-black/50 hover:bg-black/70 text-white text-xs font-bold py-1 px-2.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Undo</button>
                                <button onClick={handleRedo} disabled={historyIndex >= history.length - 1} className="bg-black/50 hover:bg-black/70 text-white text-xs font-bold py-1 px-2.5 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Redo</button>
                                <button onClick={handleClearWaypoints} className="bg-black/50 hover:bg-black/70 text-white text-xs font-bold py-1 px-2.5 rounded-md transition-colors">Clear</button>
                            </div>
                        </div>
                    </div>

                    <aside className="flex-1 flex flex-col gap-3 bg-gray-800/50 p-4 rounded-xl border border-white/10 overflow-y-auto min-h-0">
                        <div>
                            <label htmlFor="missionName" className="block text-sm font-bold mb-1.5">Mission Name</label>
                            <input id="missionName" type="text" value={missionName} onChange={(e) => setMissionName(e.target.value)} className="w-full bg-gray-900/80 p-2 text-sm rounded-lg border border-gray-600 focus:outline-none focus:ring-2 focus:ring-gcs-orange" />
                        </div>

                        <div>
                            <label className="block text-sm font-bold mb-1.5">Mission Parameters</label>
                            <div className="space-y-2 bg-gray-900/50 p-3 rounded-lg border border-gray-700">
                                <div>
                                    <div className="flex justify-between text-sm mb-1"><span>Altitude</span><span className="font-mono">{altitude} m</span></div>
                                    <input type="range" min="10" max="120" value={altitude} onChange={(e) => setAltitude(Number(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-thumb" />
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-1"><span>Speed</span><span className="font-mono">{speed} m/s</span></div>
                                    <input type="range" min="1" max="25" value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer range-thumb" />
                                </div>
                            </div>
                        </div>

                        <div className="flex-grow flex flex-col min-h-0">
                             <div className="flex justify-between items-center mb-1.5">
                                <label className="block text-sm font-bold">Pre-flight Checklist</label>
                                <button onClick={handleCheckAll} className="text-sm text-blue-400 hover:text-blue-300 font-semibold hover:underline">
                                    Check All
                                </button>
                            </div>
                            <div className="bg-gray-900/50 border border-gray-700 p-3 rounded-lg space-y-2.5 flex-grow overflow-y-auto">
                                {checklist.map(item => (
                                    <label key={item.id} className="flex items-center gap-2.5 cursor-pointer">
                                        <input type="checkbox" checked={item.checked} onChange={() => handleChecklistItemToggle(item.id)} className="w-4 h-4 rounded bg-gray-600 border-gray-500 text-gcs-orange focus:ring-gcs-orange flex-shrink-0" />
                                        <span className={`text-sm ${item.checked ? 'text-gray-500 line-through' : 'text-gcs-text-light'}`}>{item.text}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-700 mt-auto">
                            <button onClick={() => setLoadModalOpen(true)} className="w-full text-white font-bold py-2 px-3 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 transition-colors">Load Plan</button>
                            <button onClick={handleSavePlan} className="w-full text-white font-bold py-2 px-3 text-sm rounded-lg bg-green-600 hover:bg-green-700 transition-colors">Save Plan</button>
                            <button onClick={onClose} className="w-full text-white font-bold py-2 px-3 text-sm rounded-lg bg-white/20 hover:bg-white/30 transition-colors">Cancel</button>
                            <button 
                                onClick={handleLaunchClick}
                                disabled={!isChecklistComplete || waypoints.length < 2}
                                className="w-full text-white font-bold py-2 px-3 text-sm rounded-lg transition-all duration-200 bg-gcs-orange hover:opacity-90 shadow-lg shadow-gcs-orange/30 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gcs-orange disabled:bg-gray-500 disabled:opacity-70 disabled:cursor-not-allowed disabled:shadow-none"
                            >
                                Launch Mission
                            </button>
                        </div>
                    </aside>
                </div>
            </div>
            {isLoadModalOpen && <LoadPlanModal onLoad={handleLoadPlan} onClose={() => setLoadModalOpen(false)} />}
        </>
    );
};

export default MissionSetupView;