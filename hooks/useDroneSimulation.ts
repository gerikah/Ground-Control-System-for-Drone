import React, { useState, useEffect, useRef } from 'react';
import type { OverviewStat, LiveTelemetry, BreedingSiteInfo } from '../types';

const defaultTelemetry: LiveTelemetry = {
    gps: { lat: 34.0522, lon: -118.2437 },
    altitude: 0,
    speed: 0,
    roll: 0,
    pitch: 0,
    heading: 345,
    signalStrength: -55,
    battery: { voltage: 16.8, percentage: 99 },
    satellites: 14,
    flightTime: '00:00',
    distanceFromHome: 0,
    flightMode: 'Loiter',
    armed: false,
    verticalSpeed: 0,
    breedingSiteDetected: false,
    detectedSites: [],
    gpsTrack: [],
};

const breedingSiteObjects = {
    Enclosed: ['Flower Pots', 'Discarded Containers', 'Clogged Gutters'],
    Open: ['Stagnant Ponds', 'Construction Puddles', 'Old Tires']
};

export const useDashboardData = (isMissionActive: boolean) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [liveTelemetry, setLiveTelemetry] = useState<LiveTelemetry>(defaultTelemetry);
  const [battery, setBattery] = useState(98.7);
  
  const missionTimeRef = useRef(0);
  const initialGpsRef = useRef<{ lat: number, lon: number}>(defaultTelemetry.gps);
  const gpsTrackRef = useRef<{ lat: number; lon: number }[]>([]);
  const detectedSitesRef = useRef<BreedingSiteInfo[]>([]);

  const setArmedState = (shouldArm: boolean) => {
      if (isMissionActive && !shouldArm) {
          alert("Cannot disarm while a mission is active. Please end the mission first.");
          return;
      }
      setLiveTelemetry(prev => ({
          ...prev,
          armed: shouldArm,
          flightMode: shouldArm ? 'Loiter' : 'Manual',
          ...(shouldArm ? {} : { // Reset values on disarm
              altitude: 0, speed: 0, roll: 0, pitch: 0, verticalSpeed: 0, distanceFromHome: 0,
          })
      }));
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
      setBattery(b => Math.max(0, b - 0.0005));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isMissionActive) {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {
                initialGpsRef.current = { lat: position.coords.latitude, lon: position.coords.longitude };
            }, () => console.warn("Geolocation permission denied. Using default coordinates."));
        }
        missionTimeRef.current = 0;
        gpsTrackRef.current = [];
        detectedSitesRef.current = [];
        setLiveTelemetry(prev => ({ 
            ...defaultTelemetry, armed: true, flightMode: 'Take Off',
            gps: initialGpsRef.current, battery: { ...prev.battery, percentage: battery },
            gpsTrack: [], detectedSites: [] 
        }));
    } else {
        setLiveTelemetry(prev => ({...prev, armed: false, flightTime: '00:00', flightMode: 'Manual'}));
    }
  }, [isMissionActive]);


  useEffect(() => {
    let simulationInterval: number | undefined;
    
    if (liveTelemetry.armed) {
        // Immediately start counting when armed during mission
        if (isMissionActive) {
            missionTimeRef.current += 1;
            const seconds = missionTimeRef.current;
            setLiveTelemetry(prev => ({
                ...prev,
                flightTime: `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`
            }));
        }
        
        simulationInterval = window.setInterval(() => {
            if(isMissionActive) missionTimeRef.current += 1;
            const seconds = missionTimeRef.current;
            const newBatteryLevel = Math.max(0, battery - (isMissionActive ? 0.05 : 0.005) + (Math.random() * 0.01));
            setBattery(newBatteryLevel);

            setLiveTelemetry(prev => {
                const newLat = initialGpsRef.current.lat + (isMissionActive ? Math.sin(seconds / 20) * 0.0005 : 0);
                const newLon = initialGpsRef.current.lon + (isMissionActive ? Math.cos(seconds / 20) * 0.0005 : 0);
                const newGps = { lat: newLat, lon: newLon };
                if (isMissionActive) gpsTrackRef.current.push(newGps);
                
                const newAltitude = isMissionActive ? (50 + Math.sin(seconds / 10) * 5 + (Math.random() - 0.5) * 2) : 0;
                const verticalSpeed = newAltitude - prev.altitude; // Per second change

                const breedingSiteDetected = isMissionActive && (seconds % 25 > 10 && seconds % 25 < 14);
                let currentBreedingSite: BreedingSiteInfo | undefined = undefined;

                if (isMissionActive && breedingSiteDetected) {
                    if (!prev.breedingSiteDetected) {
                        const type = Math.random() > 0.5 ? 'Enclosed' : 'Open';
                        currentBreedingSite = { type, object: breedingSiteObjects[type][0] };
                        detectedSitesRef.current.push(currentBreedingSite);
                    } else {
                        currentBreedingSite = prev.currentBreedingSite;
                    }
                }

                return {
                    ...prev,
                    gps: newGps,
                    altitude: newAltitude,
                    speed: isMissionActive ? 10 + Math.cos(seconds/5) * 2 + (Math.random() - 0.5) * 1.5 : 0,
                    roll: isMissionActive ? Math.sin(seconds / 2) * 5 + (Math.random() - 0.5) : 0,
                    pitch: isMissionActive ? Math.cos(seconds / 3) * 3 + (Math.random() - 0.5) : 0,
                    heading: (prev.heading + (isMissionActive ? 0.5 + (Math.random() - 0.5) : 0)) % 360,
                    verticalSpeed,
                    battery: { voltage: Math.max(12, 12 + (newBatteryLevel/100) * 4.8), percentage: newBatteryLevel },
                    flightTime: `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`,
                    distanceFromHome: isMissionActive ? Math.sqrt(Math.pow(seconds * 2, 2) + Math.pow(seconds,2)) : 0,
                    breedingSiteDetected, currentBreedingSite,
                    detectedSites: [...detectedSitesRef.current], gpsTrack: [...gpsTrackRef.current],
                };
            });
        }, 1000);
    }
    
    return () => { if (simulationInterval) clearInterval(simulationInterval); }
  }, [liveTelemetry.armed, isMissionActive, battery]);

  const formattedTime = currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
  const formattedDate = currentTime.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

  const overviewStats: Omit<OverviewStat, 'icon'>[] = [
      { id: 'flights', label: 'Total Flights', value: '12 Flights', subtext: 'Completed Missions' },
      { id: 'flightTime', label: 'Total Flight Time', value: '6.7 Hours', subtext: 'Accumulated drone flight duration' },
      { id: 'battery', label: 'System Battery', value: `${battery.toFixed(1)}%`, subtext: battery > 20 ? 'Healthy' : 'Low' },
  ];

  return {
    overviewStats, time: formattedTime, date: formattedDate,
    liveTelemetry: { ...liveTelemetry, battery: { ...liveTelemetry.battery, percentage: battery } },
    setArmedState
  };
};