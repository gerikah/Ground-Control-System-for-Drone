import React from 'react';
import type { LiveTelemetry } from '../types';

const TelemetryItem: React.FC<{ label: string; value: string | number; unit?: string; icon: React.ReactNode }> = ({ label, value, unit, icon }) => (
    <div className="flex flex-col justify-center p-2 bg-white/5 rounded-lg">
        <div className="flex items-center gap-2 mb-1">
            <div className="text-gcs-orange">{icon}</div>
            <span className="text-xs text-gray-300">{label}</span>
        </div>
        <span className="font-mono text-sm text-white text-center">
            {value}
            <span className="text-xs ml-1 opacity-70">{unit}</span>
        </span>
    </div>
);

// Icons
const SignalIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.556a8.889 8.889 0 0111.112-1.41M5.556 12.889a13.333 13.333 0 0116.11-2.044M3 9.222a17.778 17.778 0 0120.222-2.388M12 18.222h.01" /></svg>;
const BatteryIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>;
const SatelliteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>;
const HomeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg>;


const FlightControls: React.FC<{ telemetry: LiveTelemetry }> = ({ telemetry }) => {
    return (
        <div className="bg-gray-800/50 backdrop-blur-md p-3 rounded-xl border border-white/10 flex flex-col gap-2 flex-1">
            {/* Status Indicators */}
            <div className="grid grid-cols-2 gap-2 text-center">
                <div className={`py-1.5 px-2 rounded-lg ${telemetry.armed ? 'bg-green-500/80' : 'bg-red-500/80'}`}>
                    <p className="text-xs opacity-80">STATUS</p>
                    <p className="font-bold text-xs">{telemetry.armed ? 'ARMED' : 'DISARMED'}</p>
                </div>
                <div className="py-1.5 px-2 bg-blue-500/80 rounded-lg">
                    <p className="text-xs opacity-80">FLIGHT MODE</p>
                    <p className="font-bold text-xs">{telemetry.flightMode}</p>
                </div>
            </div>

            {/* Combined Commands & Telemetry */}
            <div className="flex-1 flex flex-col">
                 <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1.5">System Interface</h3>
                 <div className="grid grid-cols-2 gap-1.5 mb-2">
                     <button className="bg-white/10 hover:bg-white/20 py-2 px-2 text-xs rounded-lg transition-colors">Take Off</button>
                     <button className="bg-white/10 hover:bg-white/20 py-2 px-2 text-xs rounded-lg transition-colors">Land</button>
                     <button className="bg-white/10 hover:bg-white/20 py-2 px-2 text-xs rounded-lg transition-colors">Hold Position</button>
                     <button className="bg-gcs-orange/80 hover:bg-gcs-orange py-2 px-2 text-xs rounded-lg transition-colors font-bold">Return to Launch</button>
                 </div>
                 <div className="grid grid-cols-2 gap-1.5 flex-1">
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