import React, { useEffect, useState } from 'react';
import client from '../api/client';

export default function ServicesPage() {
  const [groups, setGroups] = useState([]);
  const [services, setServices] = useState([]);
  const [newGroupName, setNewGroupName] = useState('');
  const [newService, setNewService] = useState({
    name: '',
    group: '',
    durationMinutes: 60
  });

  const load = async () => {
    const [gRes, sRes] = await Promise.all([
      client.get('/services/groups'),
      client.get('/services')
    ]);
    setGroups(gRes.data);
    setServices(sRes.data);
  };

  useEffect(() => {
    load().catch(console.error);
  }, []);

  const createGroup = async (e) => {
    e.preventDefault();
    await client.post('/services/groups', { name: newGroupName });
    setNewGroupName('');
    await load();
  };

  const createService = async (e) => {
    e.preventDefault();
    await client.post('/services', newService);
    setNewService({ name: '', group: '', durationMinutes: 60 });
    await load();
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div>
        <h2 className="text-xl mb-2">Service Groups</h2>
        <ul className="bg-white shadow divide-y">
          {groups.map((g) => (
            <li key={g._id} className="p-2">
              {g.name} (priority {g.priority})
            </li>
          ))}
        </ul>
        <form onSubmit={createGroup} className="mt-4 space-y-2">
          <h3 className="font-semibold">Add Group</h3>
          <input
            className="border border-gray-300 w-full p-2"
            placeholder="Group name"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            required
          />
          <button className="bg-blue-700 text-white px-3 py-1 rounded" type="submit">
            Create
          </button>
        </form>
      </div>
      <div>
        <h2 className="text-xl mb-2">Services</h2>
        <ul className="bg-white shadow divide-y max-h-80 overflow-y-auto">
          {services.map((s) => (
            <li key={s._id} className="p-2">
              <div className="font-semibold">{s.name}</div>
              <div className="text-sm text-gray-600">
                Group: {s.group?.name} · Duration: {s.durationMinutes} min
              </div>
            </li>
          ))}
        </ul>
        <form onSubmit={createService} className="mt-4 space-y-2">
          <h3 className="font-semibold">Add Service</h3>
          <input
            className="border border-gray-300 w-full p-2"
            placeholder="Service name"
            value={newService.name}
            onChange={(e) => setNewService((v) => ({ ...v, name: e.target.value }))}
            required
          />
          <select
            className="border border-gray-300 w-full p-2"
            value={newService.group}
            onChange={(e) => setNewService((v) => ({ ...v, group: e.target.value }))}
            required
          >
            <option value="">Select group</option>
            {groups.map((g) => (
              <option key={g._id} value={g._id}>
                {g.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            className="border border-gray-300 w-full p-2"
            value={newService.durationMinutes}
            onChange={(e) =>
              setNewService((v) => ({ ...v, durationMinutes: Number(e.target.value) }))
            }
          />
          <button className="bg-blue-700 text-white px-3 py-1 rounded" type="submit">
            Create
          </button>
        </form>
      </div>
    </div>
  );
}

