import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
import { MdTimer, MdCheck, MdPlayArrow, MdBarChart, MdAssignment, MdConfirmationNumber, MdPerson, MdEdit, MdDeleteOutline, MdClose, MdLogout } from 'react-icons/md';
import LiveTimer from '../components/LiveTimer';
import LiveProgress from '../components/LiveProgress';
import Navbar from '../components/Navbar';

const SERVICE_DURATIONS = {
  basic: 15,
  standard: 30,
  premium: 45,
  detail: 60
};


const SERVICES = [
  { id: 'basic', name: 'Basic Wash', price: 299, duration: '15 mins' },
  { id: 'standard', name: 'Standard Wash', price: 599, duration: '30 mins' },
  { id: 'premium', name: 'Premium Wash', price: 999, duration: '45 mins' },
  { id: 'detail', name: 'Detail Clean', price: 1499, duration: '60 mins' },
];

export default function CustomerDashboard() {
  const [formData, setFormData] = useState({
    customerName: '',
    email: '',
    phone: '',
    company: '',
    vehicle: '',
    service: ''
  });
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [notification, setNotification] = useState('');
  const [queueStatus, setQueueStatus] = useState(null);
  const [loadingQueue, setLoadingQueue] = useState(false);
  const [customerRecentTask, setCustomerRecentTask] = useState(null);
  const [editingTask, setEditingTask] = useState(null);
  const [editFormData, setEditFormData] = useState({ vehicle: '', phone: '', company: '', service: '' });
  const [editLoading, setEditLoading] = useState(false);
  const prevStatus = React.useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchQueueStatus();
    fetchCustomerRecentTask();
    const interval = setInterval(() => {
      fetchQueueStatus();
      fetchCustomerRecentTask();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchCustomerRecentTask = async () => {
    try {
      const response = await client.get('/customer/customer/recent-task');
      setCustomerRecentTask(response.data);
    } catch (error) {
      console.error('Error fetching customer recent task:', error);
    }
  };

  const fetchQueueStatus = async () => {
    try {
      setLoadingQueue(true);
      const response = await client.get('/customer/queue-status');
      // notify customer when status updates
      if (prevStatus.current && prevStatus.current.status !== response.data.status) {
        setNotification(`Your request status is now ${response.data.status}`);
        setTimeout(() => setNotification(''), 5000);
      }
      prevStatus.current = response.data;
      setQueueStatus(response.data);
    } catch (error) {
      console.error('Error fetching queue status:', error);
    } finally {
      setLoadingQueue(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.customerName.trim()) newErrors.customerName = 'Full name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = 'Invalid email format';
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) newErrors.phone = 'Phone must be 10 digits';
    if (!formData.company.trim()) newErrors.company = 'Company name is required';
    if (!formData.vehicle.trim()) newErrors.vehicle = 'Vehicle model is required';
    if (!formData.service) newErrors.service = 'Please select a service';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    try {
      const response = await client.post('/customer/token/generate', formData);
      setToken(response.data);
      setSuccessMessage('Token generated successfully! An operator will be notified shortly.');
      setTimeout(() => setSuccessMessage(''), 5000);
      setFormData({ customerName: '', email: '', phone: '', company: '', vehicle: '', service: '' });
    } catch (error) {
      console.error('Error generating token:', error);
      setErrors({ submit: error.response?.data?.message || 'Failed to generate token. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const selectedService = SERVICES.find(s => s.id === formData.service);

  const openEditModal = (task) => {
    setEditingTask(task._id);
    setEditFormData({
      vehicle: task.vehicle,
      phone: task.phone,
      company: task.company,
      service: task.service
    });
  };

  const handleEditTask = async (e) => {
    e.preventDefault();
    if (!editingTask) return;

    setEditLoading(true);
    try {
      const response = await client.patch(`/customer/requests/${editingTask}/edit`, editFormData);
      setCustomerRecentTask(response.data);
      setSuccessMessage('✓ Task updated successfully!');
      setEditingTask(null);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error updating task:', error);
      setErrors({ edit: error.response?.data?.message || 'Failed to update task' });
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      await client.delete(`/customer/requests/${taskId}`);
      setCustomerRecentTask(null);
      setToken(null);
      setSuccessMessage('✓ Task deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting task:', error);
      setErrors({ delete: error.response?.data?.message || 'Failed to delete task' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <Navbar
        role="Customer"
        tabs={[
          { id: 'overview', label: 'Overview' },
          { id: 'services', label: 'Services' },
          { id: 'support', label: 'Support' },
        ]}
      />

      <div className="mx-auto max-w-4xl px-4 pb-10 pt-6 lg:px-6 lg:pt-8">
        {/* Header */}
        <section className="mb-6 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
            Customer portal
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-slate-50 sm:text-3xl">
            Car Wash Service Request
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            Submit your vehicle details, select a service package, and track your place in
            line in real time.
          </p>
        </section>

        {/* Queue Status */}
        {queueStatus && !loadingQueue && (
          <section className="mb-5 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-md text-xs">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-100">
                <MdBarChart className="inline-block mr-1" /> Current queue status
              </p>
              <span className="rounded-full bg-slate-50/10 px-3 py-1 text-[11px] font-semibold text-slate-100">
                {queueStatus.availableCount} operators available
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {queueStatus.operators &&
                queueStatus.operators.map((op) => (
                  <div
                    key={op.id}
                    className={`rounded-xl border bg-slate-900 px-3 py-3 shadow-sm transition ${
                      op.isAvailable
                        ? 'border-emerald-500/50 bg-emerald-500/5'
                        : 'border-slate-700'
                    }`}
                  >
                    <div className="mb-1 flex items-center justify-between">
                      <p className="text-sm font-semibold text-slate-50">
                        <span
                          className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${
                            op.isAvailable ? 'bg-emerald-400' : 'bg-amber-400'
                          }`}
                        />
                        {op.name}
                      </p>
                      <span className="text-[11px] text-slate-300">
                        {op.queueCount}/10 in queue
                      </span>
                    </div>
                    {op.isAvailable && (
                      <p className="text-[11px] font-semibold text-emerald-200">
                        ✓ Ready for next customer
                      </p>
                    )}
                  </div>
                ))}
            </div>
            {queueStatus.availableCount === 0 && (
              <p className="mt-3 rounded-xl bg-slate-900 px-3 py-2 text-[11px] text-slate-200 inline-flex items-center gap-1">
                <MdTimer /> All operators currently have full queues. Your request will be added
                to the next available operator.
              </p>
            )}
          </section>
        )}

        {/* Recent task */}
        {customerRecentTask && (
          <section className="mb-5 rounded-2xl border border-emerald-500/40 bg-emerald-500/5 p-4 shadow-md text-xs">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-100">
                <MdAssignment className="inline-block mr-1" /> Your recent request
              </p>
              <span className="rounded-full bg-emerald-500/20 px-3 py-1 text-[11px] font-semibold text-emerald-100">
                Token {customerRecentTask.tokenId}
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <p className="text-[11px] text-slate-300">Service</p>
                <p className="text-sm font-semibold text-slate-50">
                  {customerRecentTask.service}
                </p>
              </div>
              <div>
                <p className="text-[11px] text-slate-300">Vehicle</p>
                <p className="text-sm font-semibold text-slate-50">
                  {customerRecentTask.vehicle}
                </p>
              </div>
            </div>
            <div className="mt-3">
              <p className="text-[11px] text-slate-300">Status</p>
              <p className="text-sm font-semibold text-slate-50">
                    {customerRecentTask.status === 'pending' && 'Waiting for operator'}
                {customerRecentTask.status === 'in-progress' && (
                  <span className="inline-flex items-center gap-1">
                    In progress
                    {customerRecentTask.startedAt && (
                      <span className="ml-2 text-[10px] text-sky-300">
                        <MdTimer className="inline-block" />
                        <LiveTimer
                          start={customerRecentTask.startedAt}
                          expectedMinutes={SERVICE_DURATIONS[customerRecentTask.service]}
                          className="ml-1"
                        />
                      </span>
                    )}
                  </span>
                )}
                {customerRecentTask.status === 'completed' && 'Completed'}
              </p>
            </div>
            {customerRecentTask.assignedOperator && (
              <div className="mt-3 border-t border-emerald-500/30 pt-3">
                <p className="text-[11px] text-slate-300">Assigned operator</p>
                <p className="text-sm font-semibold text-emerald-200">
                  <MdPerson className="inline-block mr-1" /> {customerRecentTask.assignedOperator.name}
                </p>
              </div>
            )}
            {customerRecentTask.startedAt && customerRecentTask.status === 'in-progress' && (
              <div className="mt-3">
                <p className="text-[11px] text-slate-300">Progress</p>
                <LiveProgress
                  start={customerRecentTask.startedAt}
                  expectedMinutes={SERVICE_DURATIONS[customerRecentTask.service]}
                />
              </div>
            )}
            {customerRecentTask.status === 'pending' && (
              <div className="mt-4 flex gap-2 text-[11px]">
                <button
                  onClick={() => openEditModal(customerRecentTask)}
                  className="flex-1 rounded-full bg-white/10 backdrop-blur bg-sky-500/60 px-3 py-2 font-semibold text-sky-950 hover:bg-sky-400"
                >
                  <MdEdit size={16} /> Edit details
                </button>
                <button
                  onClick={() => handleDeleteTask(customerRecentTask._id)}
                  className="flex-1 rounded-full bg-white/10 backdrop-blur bg-red-500/40 px-3 py-2 font-semibold text-red-200 ring-1 ring-red-500/40 hover:bg-red-500/30"
                >
                  <MdDeleteOutline size={16} /> Cancel request
                </button>
              </div>
            )}
          </section>
        )}

        {/* Main card */}
        <section className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.9)] sm:p-6">
          {token ? (
            <div className="text-center text-xs">
              <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full bg-emerald-500/15 px-4 py-1 text-[11px] font-semibold text-emerald-200">
                <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Token generated
              </div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">
                Your token
              </p>
              <p className="mt-2 font-mono text-4xl font-bold tracking-[0.25em] text-emerald-300 sm:text-5xl">
                {token.tokenNumber}
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl bg-slate-950/70 px-3 py-3">
                  <p className="text-[11px] text-slate-400">Service</p>
                  <p className="mt-1 text-sm font-semibold text-slate-50">
                    {selectedService?.name}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-950/70 px-3 py-3">
                  <p className="text-[11px] text-slate-400">Queue position</p>
                  <p className="mt-1 text-sm font-semibold text-slate-50">
                    {token.queuePosition || 'Processing'}
                  </p>
                </div>
              </div>
              <p className="mt-4 text-[11px] text-slate-300">
                An operator will start on your vehicle shortly. You&apos;ll be
                notified at the service bay.
              </p>
              <button
                onClick={() => setToken(null)}
                className="mt-5 inline-flex items-center justify-center rounded-full border border-slate-700 bg-slate-950 px-4 py-2 text-[11px] font-semibold text-slate-100 hover:bg-slate-800"
              >
                Generate another token
              </button>
            </div>
          ) : (
            <div className="text-xs">
              <h2 className="mb-4 text-sm font-semibold text-slate-100">
                Service request form
              </h2>

              {successMessage && (
                <div className="mb-3 flex items-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs text-emerald-200">
                  <span>✓</span>
                  <p>{successMessage}</p>
                </div>
              )}

              {errors.submit && (
                <div className="mb-3 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-2 text-xs text-red-200">
                  ✕ {errors.submit}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="customerName"
                      className="mb-1 block text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400"
                    >
                      Full name *
                    </label>
                    <input
                      id="customerName"
                      type="text"
                      placeholder="John Doe"
                      value={formData.customerName}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          customerName: e.target.value,
                        })
                      }
                      className={`w-full rounded-xl border bg-slate-950/70 px-3 py-2 text-xs text-slate-50 outline-none ring-0 transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/60 ${
                        errors.customerName ? 'border-red-500' : 'border-slate-700'
                      }`}
                    />
                    {errors.customerName && (
                      <p className="mt-1 text-[11px] text-red-300">
                        ⚠ {errors.customerName}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-1 block text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400"
                    >
                      Email *
                    </label>
                    <input
                      id="email"
                      type="email"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className={`w-full rounded-xl border bg-slate-950/70 px-3 py-2 text-xs text-slate-50 outline-none ring-0 transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/60 ${
                        errors.email ? 'border-red-500' : 'border-slate-700'
                      }`}
                    />
                    {errors.email && (
                      <p className="mt-1 text-[11px] text-red-300">
                        ⚠ {errors.email}
                      </p>
                    )}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="phone"
                      className="mb-1 block text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400"
                    >
                      Phone *
                    </label>
                    <input
                      id="phone"
                      type="tel"
                      placeholder="9876543210"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className={`w-full rounded-xl border bg-slate-950/70 px-3 py-2 text-xs text-slate-50 outline-none ring-0 transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/60 ${
                        errors.phone ? 'border-red-500' : 'border-slate-700'
                      }`}
                    />
                    {errors.phone && (
                      <p className="mt-1 text-[11px] text-red-300">
                        ⚠ {errors.phone}
                      </p>
                    )}
                  </div>
                  <div>
                    <label
                      htmlFor="company"
                      className="mb-1 block text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400"
                    >
                      Company *
                    </label>
                    <input
                      id="company"
                      type="text"
                      placeholder="Your company"
                      value={formData.company}
                      onChange={(e) =>
                        setFormData({ ...formData, company: e.target.value })
                      }
                      className={`w-full rounded-xl border bg-slate-950/70 px-3 py-2 text-xs text-slate-50 outline-none ring-0 transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/60 ${
                        errors.company ? 'border-red-500' : 'border-slate-700'
                      }`}
                    />
                    {errors.company && (
                      <p className="mt-1 text-[11px] text-red-300">
                        ⚠ {errors.company}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="vehicle"
                    className="mb-1 block text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400"
                  >
                    Vehicle model *
                  </label>
                  <input
                    id="vehicle"
                    type="text"
                    placeholder="e.g., Honda City 2020"
                    value={formData.vehicle}
                    onChange={(e) =>
                      setFormData({ ...formData, vehicle: e.target.value })
                    }
                    className={`w-full rounded-xl border bg-slate-950/70 px-3 py-2 text-xs text-slate-50 outline-none ring-0 transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/60 ${
                      errors.vehicle ? 'border-red-500' : 'border-slate-700'
                    }`}
                  />
                  {errors.vehicle && (
                    <p className="mt-1 text-[11px] text-red-300">
                      ⚠ {errors.vehicle}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="service"
                    className="mb-1 block text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400"
                  >
                    Select service *
                  </label>
                  <select
                    id="service"
                    value={formData.service}
                    onChange={(e) =>
                      setFormData({ ...formData, service: e.target.value })
                    }
                    className={`w-full rounded-xl border bg-slate-950/70 px-3 py-2 text-xs text-slate-50 outline-none ring-0 transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/60 ${
                      errors.service ? 'border-red-500' : 'border-slate-700'
                    }`}
                  >
                    <option value="">Choose a service package</option>
                    {SERVICES.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name} - ₹{service.price} ({service.duration})
                      </option>
                    ))}
                  </select>
                  {errors.service && (
                    <p className="mt-1 text-[11px] text-red-300">
                      ⚠ {errors.service}
                    </p>
                  )}
                </div>

                {selectedService && (
                  <div className="mt-2 flex items-center justify-between rounded-2xl border border-slate-700 bg-slate-950/70 px-4 py-3 text-xs">
                    <div>
                      <p className="text-sm font-semibold text-slate-50">
                        {selectedService.name}
                      </p>
                      <p className="text-[11px] text-slate-300">
                        Estimated time: {selectedService.duration}
                      </p>
                    </div>
                    <p className="text-lg font-semibold text-emerald-300">
                      ₹{selectedService.price}
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-400 px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_45px_rgba(79,70,229,0.7)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_60px_rgba(79,70,229,0.85)] disabled:opacity-70"
                >
                  {loading ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Generating token...
                    </>
                  ) : (
                    <><MdConfirmationNumber className="inline-block" /> Generate token</>
                  )}
                </button>
              </form>
            </div>
          )}
        </section>

        {/* Edit Task Modal */}
        {editingTask && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-950 px-5 py-6 text-xs shadow-[0_30px_80px_rgba(0,0,0,0.75)]">
              <h2 className="mb-3 text-sm font-semibold text-slate-50">
                <MdEdit className="inline-block mr-1" /> Edit request
              </h2>
              <form onSubmit={handleEditTask} className="space-y-3">
                <div>
                  <label className="mb-1 block text-[11px] text-slate-300">
                    Vehicle model
                  </label>
                  <input
                    type="text"
                    value={editFormData.vehicle}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        vehicle: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-50 outline-none ring-0 transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/60"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-slate-300">
                    Phone number
                  </label>
                  <input
                    type="tel"
                    value={editFormData.phone}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        phone: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-50 outline-none ring-0 transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/60"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-slate-300">
                    Company name
                  </label>
                  <input
                    type="text"
                    value={editFormData.company}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        company: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-50 outline-none ring-0 transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/60"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-slate-300">
                    Service type
                  </label>
                  <select
                    value={editFormData.service}
                    onChange={(e) =>
                      setEditFormData({
                        ...editFormData,
                        service: e.target.value,
                      })
                    }
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-50 outline-none ring-0 transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/60"
                  >
                    <option value="">Select a service</option>
                    {SERVICES.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {errors.edit && (
                  <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-[11px] text-red-200">
                    ⚠ {errors.edit}
                  </div>
                )}

                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingTask(null)}
                    className="flex-1 rounded-xl border border-slate-700 bg-white/10 backdrop-blur bg-slate-900/60 px-3 py-2 font-semibold text-slate-200 hover:bg-slate-800"
                  >
                    <MdClose size={16} /> Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editLoading}
                    className="flex-1 rounded-xl bg-white/10 backdrop-blur bg-indigo-500/60 px-3 py-2 font-semibold text-white hover:bg-indigo-400 disabled:opacity-60"
                  >
                    {editLoading ? 'Updating...' : <><MdCheck size={16} /> Save changes</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
