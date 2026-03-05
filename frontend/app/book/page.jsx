'use client';

import { useState, useEffect, useRef } from 'react';
import { SignedIn, useAuth } from '@clerk/nextjs';
import dynamic from 'next/dynamic';
import { io } from 'socket.io-client';

const Map = dynamic(() => import('../components/Map'), { ssr: false });

export default function Book() {
  const { getToken } = useAuth();
  const [pickup, setPickup] = useState('');
  const [drop, setDrop] = useState('');
  const [promo, setPromo] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const [driverLocation, setDriverLocation] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
    
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    const socket = io(BACKEND_URL, {
      path: '/ws/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log("WebSocket Connected:", socket.id);
    });
    
    socket.on('connect_error', (error) => {
      console.log("WebSocket connection error:", error.message);
    });

    socket.on('disconnect', (reason) => {
      console.log("WebSocket disconnected:", reason);
    });
    
    socket.on('update', (data) => {
      setDriverLocation(data);
      setStatus(`Driver location updated live!`);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const requestRide = async () => {
    if (!pickup || !drop) {
      setStatus("Please enter both locations.");
      return;
    }

    try {
      setLoading(true);
      setStatus("Calculating route & fare...");
      const token = await getToken();
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
      
      const res = await fetch(`${BACKEND_URL}/api/rides/request`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ pickup, drop })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.detail || "Request failed");
      }

      const data = await res.json();
      setStatus(`Ride confirmed! Promo applied. Fare: $${data.fare}. Waiting for driver...`);
    } catch (error) {
      console.error(error);
      setStatus(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SignedIn>
      <div className="p-4 md:p-8 max-w-6xl mx-auto min-h-screen flex flex-col md:flex-row gap-8 items-start">
        
        <div className="w-full md:w-1/3 space-y-6">
          <div className="bg-white/10 p-6 rounded-2xl border border-white/20 shadow-xl">
            <h2 className="text-3xl font-bold mb-6 text-white">Book Ride</h2>
            
            <input 
              className="mb-4 p-4 w-full text-black rounded-lg outline-none font-medium" 
              placeholder="Pickup location" 
              onChange={e => setPickup(e.target.value)} 
            />
            <input 
              className="mb-4 p-4 w-full text-black rounded-lg outline-none font-medium" 
              placeholder="Drop destination" 
              onChange={e => setDrop(e.target.value)} 
            />
            
            <div className="flex gap-2 mb-6">
              <input 
                className="p-3 w-full text-black rounded-lg outline-none text-sm" 
                placeholder="Promo Code (Optional)" 
                onChange={e => setPromo(e.target.value)} 
              />
              <button className="bg-pink-600 hover:bg-pink-700 text-white font-bold px-4 rounded-lg text-sm transition-all">
                Apply
              </button>
            </div>

            <button 
              onClick={requestRide} 
              disabled={loading} 
              className="w-full bg-gradient-to-r from-green-500 to-teal-500 hover:scale-105 text-white font-bold py-4 px-6 rounded-xl transition-all shadow-lg disabled:opacity-50"
            >
              {loading ? "Processing..." : "Confirm Booking"}
            </button>
            
            {status && (
              <div className="mt-4 p-3 bg-black/40 rounded-lg text-green-400 text-sm font-medium border border-green-500/30">
                {status}
              </div>
            )}
          </div>

          <div className="bg-white/10 p-6 rounded-2xl border border-white/20 shadow-xl flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-400">RK Wallet Balance</p>
              <p className="text-2xl font-bold text-white">$45.00</p>
            </div>
            <button className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-lg font-bold text-sm transition-all">
              Top Up
            </button>
          </div>
        </div>

        <div className="w-full md:w-2/3">
           <Map driverLocation={driverLocation} />
           <p className="text-right text-xs text-gray-400 mt-2">*Live mapping powered by Leaflet & Socket.io</p>
        </div>

      </div>
    </SignedIn>
  );
}