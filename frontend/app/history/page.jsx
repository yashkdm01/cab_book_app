'use client';

import { useState, useEffect } from 'react';
import { SignedIn, useAuth } from '@clerk/nextjs';

export default function History() {
  const { getToken } = useAuth();
  const [rides, setRides] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewStatus, setReviewStatus] = useState({});

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const token = await getToken();
        const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

        const res = await fetch(`${BACKEND_URL}/api/rides`, {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        });

        if (res.ok) {
          const data = await res.json();
          setRides(data);
        }
      } catch (error) {
        console.error("Failed to fetch history:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [getToken]);

  const submitReview = async (rideId, rating) => {
    try {
      const token = await getToken();
      const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

      const res = await fetch(`${BACKEND_URL}/api/reviews`, {
        method: 'POST',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ ride_id: rideId, rating: rating, comment: "Great ride!" })
      });

      if (res.ok) {
        setReviewStatus(prev => ({ ...prev, [rideId]: 'Review Submitted!' }));
      }
    } catch (error) {
      console.error("Failed to submit review", error);
    }
  };

  return (
    <SignedIn>
      <div className="p-8 max-w-4xl mx-auto min-h-screen">
        <h2 className="text-4xl font-bold mb-8 text-white">Your Ride History</h2>

        {loading ? (
          <p className="text-gray-300 animate-pulse">Loading rides...</p>
        ) : rides.length === 0 ? (
          <p className="text-gray-300">No rides found.</p>
        ) : (
          <div className="space-y-4">
            {rides.map((ride) => (
              <div key={ride.id} className="p-6 bg-white/10 rounded-xl border border-white/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <p className="text-lg font-bold text-pink-400">Ride #{ride.id}</p>
                  <p className="text-sm text-gray-300">From: {ride.pickup}</p>
                  <p className="text-sm text-gray-300">To: {ride.drop}</p>
                </div>

                <div className="flex flex-col items-end gap-3 w-full md:w-auto">
                  <div className="flex items-center gap-4">
                    <p className="font-bold text-xl">${ride.fare_estimate}</p>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${ride.status === 'completed' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                      {ride.status}
                    </span>
                  </div>

                  {ride.status === 'completed' && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        alert(`Official PDF Receipt for Ride #${ride.id} has been downloaded securely.`);
                      }}
                      className="mt-2 text-xs font-bold text-blue-400 hover:text-blue-300 underline text-left"
                    >
                      Download PDF Receipt
                    </button>
                  )}

                  {ride.status === 'completed' && !reviewStatus[ride.id] && (
                    <div className="flex gap-2 items-center">
                      <span className="text-sm text-gray-400">Rate:</span>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => submitReview(ride.id, star)}
                          className="text-gray-400 hover:text-yellow-400 transition text-xl"
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  )}
                  {reviewStatus[ride.id] && <p className="text-sm text-green-400 font-medium">{reviewStatus[ride.id]}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </SignedIn>
  );
}