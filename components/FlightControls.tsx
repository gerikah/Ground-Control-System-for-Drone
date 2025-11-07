import React from 'react';
import type { LiveTelemetry } from '../types';

const TelemetryItem: React.FC<{ label: string; value: string | number; unit?: string; icon: React.ReactNode }> = ({ label, value, unit, icon }) => (
    <div className="flex flex-col justify-center p-1.5 bg-white/5 rounded-lg">
        <div className="flex items-center gap-1.5 mb-0.5">
            <div className="text-gcs-orange">{icon}</div>
            <span className="text-xs text-gray-300 leading-tight">{label}</span>
        </div>
        <span className="font-mono text-xs text-white text-center leading-tight">
            {value}
            <span className="text-xs ml-0.5 opacity-70">{unit}</span>
        </span>
    </div>
);

// Icons
const SignalIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.556a8.889 8.889 0 0111.112-1.41M5.556 12.889a13.333 13.333 0 0116.11-2.044M3 9.222a17.778 17.778 0 0120.222-2.388M12 18.222h.01" /></svg>;
const BatteryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
const SatelliteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>;
const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;


const FlightControls: React.FC<{ telemetry: LiveTelemetry }> = ({ telemetry }) => {
    const modes = [
        'ARM',
        'ANGLE',
        'POSITION HOLD',
        'RETURN TO HOME',
        'ALTITUDE HOLD',
        'HEADING HOLD',
        'AIRMODE',
        'SURFACE',
        'MC BRAKING',
        'BEEPER'
    ];

    return (
        <div className="bg-gray-800/50 backdrop-blur-md p-2.5 rounded-xl border border-white/10 flex flex-col gap-2">
            {/* Flight Modes */}
            <div className="flex flex-col">
                 <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Modes</h3>
                 <div className="grid grid-cols-2 gap-1">
                     {modes.map(mode => (
                         <div 
                             key={mode}
                             className="py-1 px-1.5 text-xs rounded bg-white/10 text-gray-300 font-semibold text-center leading-tight"
                         >
                             {mode}
                         </div>
                     ))}
                 </div>
            </div>

            {/* Telemetry */}
            <div className="flex flex-col">
                 <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">Telemetry</h3>
                 <div className="grid grid-cols-2 gap-1">
                    <TelemetryItem label="Signal Strength" value={telemetry.signalStrength} unit="dBm" icon={<SignalIcon />} />
                    <TelemetryItem label="Battery" value={`${telemetry.battery.percentage.toFixed(1)}%`} unit={`${telemetry.battery.voltage.toFixed(1)}V`} icon={<BatteryIcon />} />
                    <TelemetryItem label="Satellites" value={telemetry.satellites} icon={<SatelliteIcon />} />
                    <TelemetryItem label="Dist. from Home" value={telemetry.distanceFromHome.toFixed(0)} unit="m" icon={<HomeIcon />} />
                 </div>
            </div>
        </div>
    );
};

export default FlightControls;