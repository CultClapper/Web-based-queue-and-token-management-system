import React, { useEffect, useState } from 'react';
import client from '../api/client';

export default function DashboardPage() {
  const [takt, setTakt] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await client.get('/takt/config');
        setTakt(data);
      } catch (err) {
        console.error('Failed to load takt config:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 mt-2">Welcome to your ServSync dashboard</p>
      </div>

      {loading ? (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <p className="text-gray-600">Loading configuration...</p>
        </div>
      ) : takt ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Current Takt Configuration</h2>
            <div className="space-y-3">
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Takt Time:</span>
                <span className="font-semibold text-gray-800">{takt.taktTimeMinutes} minutes</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-600">Working Hours:</span>
                <span className="font-semibold text-gray-800">
                  {takt.workingDayStart} – {takt.workingDayEnd}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Time Zone:</span>
                <span className="font-semibold text-gray-800">{takt.timeZone}</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-blue-700 shadow rounded-lg p-6 text-white">
            <h2 className="text-xl font-semibold mb-4">Quick Stats</h2>
            <div className="space-y-3">
              <div className="flex justify-between bg-white bg-opacity-10 rounded p-3">
                <span>Services</span>
                <span className="font-semibold">—</span>
              </div>
              <div className="flex justify-between bg-white bg-opacity-10 rounded p-3">
                <span>Scheduled Slots</span>
                <span className="font-semibold">—</span>
              </div>
              <div className="flex justify-between bg-white bg-opacity-10 rounded p-3">
                <span>Status</span>
                <span className="font-semibold">Active</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <p className="text-gray-600">No configuration found. Please set up your takt parameters.</p>
        </div>
      )}
    </div>
  );
}



