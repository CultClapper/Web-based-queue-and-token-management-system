import React, { useEffect, useState } from 'react';
import client from '../api/client';

export default function SchedulePage() {
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [slots, setSlots] = useState([]);
  const [status, setStatus] = useState('');

  const loadSlots = async () => {
    const { data } = await client.get('/schedules', { params: { date } });
    setSlots(data);
  };

  useEffect(() => {
    loadSlots().catch(console.error);
  }, [date]);

  const generate = async () => {
    setStatus('Generating...');
    await client.post('/takt/generate', { date });
    await loadSlots();
    setStatus('Generated');
    setTimeout(() => setStatus(''), 2000);
  };

  const updateSlot = async (id, patch) => {
    await client.patch(`/schedules/${id}`, patch);
    await loadSlots();
  };

  return (
    <div>
      <h2 className="text-xl mb-4">Schedule</h2>
      <div className="flex items-center gap-4 mb-4">
        <input
          type="date"
          className="border border-gray-300 p-2"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <button className="bg-blue-700 text-white px-3 py-1 rounded" onClick={generate}>
          Generate takt schedule
        </button>
        {status && <span>{status}</span>}
      </div>
      <div className="bg-white shadow max-h-[500px] overflow-y-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left">Service</th>
              <th className="p-2 text-left">Start</th>
              <th className="p-2 text-left">End</th>
              <th className="p-2 text-left">Seq</th>
              <th className="p-2 text-left">Status</th>
              <th className="p-2 text-left">Allocated</th>
            </tr>
          </thead>
          <tbody>
            {slots.map((slot) => (
              <tr key={slot._id} className="border-t">
                <td className="p-2">{slot.service?.name}</td>
                <td className="p-2">
                  {new Date(slot.startTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </td>
                <td className="p-2">
                  {new Date(slot.endTime).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </td>
                <td className="p-2">{slot.taktSequence}</td>
                <td className="p-2">
                  <select
                    className="border border-gray-300 p-1"
                    value={slot.status}
                    onChange={(e) => updateSlot(slot._id, { status: e.target.value })}
                  >
                    <option value="planned">planned</option>
                    <option value="in_progress">in_progress</option>
                    <option value="completed">completed</option>
                    <option value="cancelled">cancelled</option>
                  </select>
                </td>
                <td className="p-2">
                  <input
                    className="border border-gray-300 p-1"
                    defaultValue={slot.allocatedTo || ''}
                    onBlur={(e) => updateSlot(slot._id, { allocatedTo: e.target.value })}
                    placeholder="Customer/Order"
                  />
                </td>
              </tr>
            ))}
            {!slots.length && (
              <tr>
                <td className="p-4 text-center text-gray-500" colSpan={6}>
                  No slots yet. Generate schedule for this date.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

