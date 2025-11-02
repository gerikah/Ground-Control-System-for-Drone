import React, { useState } from 'react';
import type { LiveTelemetry, BreedingSiteInfo } from '../types';
import CameraFeed from './CameraFeed';
import FlightControls from './FlightControls';

// --- Instrument Components (Refined for a more compact layout) ---

const GaugeWrapper: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
    <div className={`relative w-32 h-32 bg-[#0A1019] rounded-full border-2 border-gray-700 flex items-center justify-center ${className}`}>
        {children}
    </div>
);

const Speedometer: React.FC<{ speed: number }> = ({ speed }) => {
    const SPEED_MAX = 22;
    const angle = Math.min(speed, SPEED_MAX) / SPEED_MAX * 270 - 135;
    return (
        <GaugeWrapper>
            <div className="absolute w-full h-full">
                {[...Array(12)].map((_, i) => (
                    <div key={i} className="absolute w-full h-full" style={{ transform: `rotate(${i * (270 / 11) - 135}deg)` }}>
                        <div className="w-0.5 h-2.5 bg-white/50 absolute top-2 left-1/2 -ml-0.25 rounded-full"></div>
                    </div>
                ))}
            </div>
            <div className="absolute w-full h-full text-white text-xs text-center" style={{transform: `rotate(135deg)`}}>
                <span className="absolute" style={{transform: 'rotate(-135deg) translateY(-3.7rem)'}}>0</span>
                <span className="absolute" style={{transform: 'rotate(-90deg) translateY(-3.7rem)'}}>6</span>
                <span className="absolute" style={{transform: 'rotate(0deg) translateY(-3.7rem)'}}>12</span>
                <span className="absolute" style={{transform: 'rotate(90deg) translateY(-3.7rem)'}}>20</span>
                <span className="absolute" style={{transform: 'rotate(135deg) translateY(-3.7rem)'}}>22</span>
            </div>
            <div className="absolute w-1 h-1/2 bg-transparent top-0 left-1/2 -ml-0.5 origin-bottom transition-transform duration-200" style={{ transform: `rotate(${angle}deg)` }}>
                <div className="w-1.5 h-14 bg-green-400 rounded-t-full" />
            </div>
            <div className="relative z-10 text-center bg-[#0A1019] p-1 rounded-lg">
                <p className="text-xs text-gray-400">SPEED</p>
                <p className="text-xl font-mono font-bold text-white">{speed.toFixed(1)}</p>
                <p className="text-xs text-gray-400">m/s</p>
            </div>
        </GaugeWrapper>
    );
};

const AttitudeIndicatorGauge: React.FC<{ roll: number; pitch: number }> = ({ roll, pitch }) => {
    return (
        <GaugeWrapper>
            <div className="w-full h-full rounded-full overflow-hidden transition-transform duration-100 ease-linear" style={{ transform: `rotate(${-roll}deg)` }}>
                <div className="absolute w-full h-[200%] bg-sky-400 top-[-50%]" style={{ transform: `translateY(${-pitch * 1.8}px)` }}>
                    <div className="h-1/2 bg-yellow-800 absolute bottom-0 w-full" />
                </div>
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
                <svg viewBox="0 0 100 50" fill="none" className="w-20 h-10">
                    <path d="M50 25 L30 35 M50 25 L70 35 M50 25 L50 10 M10 25 H 90" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" />
                </svg>
            </div>
        </GaugeWrapper>
    );
};

const HeadingIndicator: React.FC<{ heading: number }> = ({ heading }) => {
    const cardinals = ['N', 'E', 'S', 'W'];
    return (
        <GaugeWrapper>
            <div className="absolute w-[120%] h-[120%] rounded-full transition-transform duration-200" style={{ transform: `rotate(${-heading}deg)` }}>
                {[...Array(12)].map((_, i) => (
                    <div key={i} className="absolute w-full h-full" style={{ transform: `rotate(${i * 30}deg)` }}>
                        <div className={`absolute top-2.5 left-1/2 -ml-0.5 ${i % 3 === 0 ? 'w-0.5 h-4 bg-white' : 'w-px h-2.5 bg-gray-400'}`} />
                        {i % 3 === 0 && <span className="absolute top-6 left-1/2 -translate-x-1/2 text-base font-bold text-white">{cardinals[i/3]}</span>}
                    </div>
                ))}
            </div>
             <div className="absolute inset-0 flex items-center justify-center">
                <svg viewBox="0 0 50 50" fill="#2DD4BF" className="w-10 h-10 drop-shadow-lg"><path d="M25 5 L40 45 L25 35 L10 45 Z" /></svg>
            </div>
            <div className="absolute top-1.5 text-green-400 font-mono text-sm">{Math.round(heading)}°</div>
        </GaugeWrapper>
    );
};

const VerticalSpeedIndicator: React.FC<{ vspeed: number }> = ({ vspeed }) => {
    const VSPEED_MAX = 10;
    const angle = Math.max(-VSPEED_MAX, Math.min(vspeed, VSPEED_MAX)) / VSPEED_MAX * 90;
    return (
        <GaugeWrapper>
            <div className="absolute w-full h-full text-white text-sm">
                <span className="absolute top-1/2 -translate-y-1/2 left-4">0</span>
                <span className="absolute top-1/4 -translate-y-1/2 left-6">6</span>
                <span className="absolute bottom-1/4 translate-y-1/2 left-6">6</span>
                <span className="absolute top-4 left-1/2 -translate-x-1/2 text-xs">UP</span>
                <span className="absolute bottom-4 left-1/2 -translate-x-1/2 text-xs">DN</span>
            </div>
             <div className="absolute w-1/2 h-0.5 bg-transparent top-1/2 -mt-px right-0 origin-left transition-transform duration-200" style={{ transform: `rotate(${angle}deg)` }}>
                <div className="w-full h-0.5 bg-green-400 rounded-r-full" />
            </div>
            <div className="relative z-10 text-center bg-[#0A1019] p-1 rounded-lg">
                <p className="text-xs text-gray-400">V.SPEED</p>
                <p className="text-xl font-mono font-bold text-white">{vspeed.toFixed(1)}</p>
                <p className="text-xs text-gray-400">m/s</p>
            </div>
        </GaugeWrapper>
    );
};

const AltitudeTape: React.FC<{ altitude: number }> = ({ altitude }) => {
    const ALT_MAX = 120;
    const percent = Math.min(altitude, ALT_MAX) / ALT_MAX * 100;
    return (
        <div className="w-12 h-full bg-[#0A1019] rounded-lg border-2 border-gray-700 flex flex-col justify-end relative overflow-hidden">
            <div className="absolute inset-0 text-white text-xs text-right pr-1">
                {[...Array(7)].map((_,i) => <div key={i} style={{bottom: `${i * (100/6)}%`}} className="absolute w-full pr-1.5">{i * 20}</div>)}
            </div>
            <div className="bg-cyan-400/80 w-full transition-all duration-200" style={{ height: `${percent}%` }} />
            <div className="absolute top-1/2 -translate-y-1/2 w-full h-8 bg-black/30 border-y-2 border-cyan-400 flex items-center justify-center">
                <span className="font-mono text-cyan-300 font-bold text-base">{altitude.toFixed(1)}</span>
            </div>
        </div>
    );
};

const FlightInstruments: React.FC<{ telemetry: LiveTelemetry }> = ({ telemetry }) => {
    return (
        <div className="bg-gray-800/50 backdrop-blur-md p-3 rounded-xl border border-white/10 flex flex-col gap-2">
             <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 text-center">Instruments</h3>
             <div className="flex gap-2 justify-center items-center">
                <div className="grid grid-cols-2 gap-2">
                    <Speedometer speed={telemetry.speed} />
                    <AttitudeIndicatorGauge roll={telemetry.roll} pitch={telemetry.pitch} />
                    <HeadingIndicator heading={telemetry.heading} />
                    <VerticalSpeedIndicator vspeed={telemetry.verticalSpeed} />
                </div>
                <div className="h-full max-h-[272px]">
                    <AltitudeTape altitude={telemetry.altitude} />
                </div>
            </div>
        </div>
    );
};


// --- Main Live View Component ---

interface LiveMissionViewProps {
  telemetry: LiveTelemetry;
  onEndMission: (duration: string, gpsTrack: { lat: number; lon: number }[], detectedSites: BreedingSiteInfo[]) => void;
}

const AlertIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
);

const LiveMissionView: React.FC<LiveMissionViewProps> = ({ telemetry, onEndMission }) => {
  const [isConfirmingEndMission, setConfirmingEndMission] = useState(false);
  
  return (
    <div className="fixed inset-0 bg-gcs-dark bg-opacity-95 backdrop-blur-sm z-50 flex flex-col p-3 text-gcs-text-light font-sans animate-fade-in">
      <header className="flex justify-between items-center pb-2 border-b border-gray-700">
        <h1 className="text-lg font-bold text-white">Live Mission: <span className="text-gcs-orange">Sector 7G</span></h1>
        <div className="flex items-center gap-3">
            <div className="text-center">
                <p className="text-xs text-gray-400">MISSION TIME</p>
                <p className="text-sm font-mono tracking-widest">{telemetry.flightTime}</p>
            </div>
            <button onClick={() => setConfirmingEndMission(true)} className="bg-red-600 hover:bg-red-700 text-white font-bold py-1.5 px-3 text-xs rounded-lg transition-colors duration-200">
                End Mission
            </button>
        </div>
      </header>
      
      <main className="flex-1 flex gap-3 mt-3 overflow-hidden min-h-0">
        {/* Left Column: Camera Feed */}
        <div className="w-2/3 flex flex-col gap-2 min-h-0">
            <div className="flex-1 bg-black rounded-xl overflow-hidden relative min-h-0">
                <CameraFeed telemetry={telemetry} />
            </div>
            {telemetry.breedingSiteDetected && telemetry.currentBreedingSite && (
                <div className="bg-yellow-400/80 border border-yellow-600 text-yellow-900 px-2 py-1.5 rounded-lg flex items-center gap-2 animate-pulse">
                    <AlertIcon />
                    <span className="font-bold text-xs">Alert:</span> <span className="text-xs">Potential Site Detected - {telemetry.currentBreedingSite.type} ({telemetry.currentBreedingSite.object}).</span>
                </div>
            )}
        </div>
        
        {/* Right Column: Instruments & Controls */}
        <div className="w-1/3 flex flex-col gap-3 overflow-hidden min-h-0">
            <FlightInstruments telemetry={telemetry} />
            <FlightControls telemetry={telemetry} />
        </div>
      </main>

      {isConfirmingEndMission && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-60" aria-modal="true" role="dialog">
            <div className="bg-gray-800 p-6 rounded-xl shadow-2xl border border-white/10 max-w-sm text-center animate-dialog-in">
                <h2 className="text-lg font-bold text-white mb-2">Confirm End Mission</h2>
                <p className="text-sm text-gray-300 mb-4">Are you sure you want to end the current mission?</p>
                <div className="flex justify-center gap-3">
                    <button 
                        onClick={() => setConfirmingEndMission(false)} 
                        className="px-6 py-2 text-sm bg-white/20 hover:bg-white/30 text-white font-semibold rounded-lg transition-colors"
                    >
                        Cancel
                    </button>
                    <button 
                        onClick={() => onEndMission(telemetry.flightTime, telemetry.gpsTrack, telemetry.detectedSites)} 
                        className="px-6 py-2 text-sm bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition-colors"
                    >
                        Confirm
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

// Animations for the view and dialog
const style = document.createElement('style');
style.innerHTML = `
@keyframes fade-in {
    from { opacity: 0; transform: scale(0.98); }
    to { opacity: 1; transform: scale(1); }
}
.animate-fade-in {
    animation: fade-in 0.3s ease-out forwards;
}
@keyframes dialog-in {
    from { opacity: 0; transform: scale(0.95) translateY(10px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
}
.animate-dialog-in {
    animation: dialog-in 0.2s ease-out forwards;
}
`;
document.head.appendChild(style);


export default LiveMissionView;