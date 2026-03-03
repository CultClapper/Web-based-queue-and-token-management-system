import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [operators, setOperators] = useState([]);
  const [completedTasks, setCompletedTasks] = useState([]);
  const [inProgressTasks, setInProgressTasks] = useState([]);
  const [pendingTasks, setPendingTasks] = useState([]);
  const [stats, setStats] = useState({
    totalOperators: 0,
    totalCompleted: 0,
    totalPending: 0,
    totalInProgress: 0,
    averageRating: 0,
    activeOperators: 0,
  });
  const [showAddOperator, setShowAddOperator] = useState(false);
  const [newOperator, setNewOperator] = useState({
    name: '',
    email: '',
    password: '',
  });
  const [operatorStats, setOperatorStats] = useState(null);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [assignmentModal, setAssignmentModal] = useState({
    show: false,
    taskId: null,
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [operatorsRes, completedRes, inProgressRes, pendingRes, statsRes] =
        await Promise.all([
          client.get('/admin/operators'),
          client.get('/admin/tasks/completed'),
          client.get('/admin/tasks/in-progress'),
          client.get('/admin/tasks/pending'),
          client.get('/admin/stats'),
        ]);
      setOperators(operatorsRes.data || []);
      setCompletedTasks(completedRes.data || []);
      setInProgressTasks(inProgressRes.data || []);
      setPendingTasks(pendingRes.data || []);
      setStats(statsRes.data || {});
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setErrorMessage('Failed to fetch dashboard data');
    }
  };

  const addOperator = async (e) => {
    e.preventDefault();
    try {
      await client.post('/admin/operators', newOperator);
      setNewOperator({ name: '', email: '', password: '' });
      setShowAddOperator(false);
      setSuccessMessage('Operator added successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchDashboardData();
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to add operator');
    }
  };

  const viewOperatorStats = async (operatorId) => {
    try {
      const response = await client.get(`/admin/operators/${operatorId}/stats`);
      setOperatorStats(response.data);
      setShowStatsModal(true);
    } catch (error) {
      setErrorMessage('Failed to fetch operator stats');
    }
  };

  const deleteOperator = async (operatorId) => {
    if (!window.confirm('Are you sure you want to remove this operator?')) {
      return;
    }
    try {
      await client.delete(`/admin/operators/${operatorId}`);
      setSuccessMessage('Operator removed successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchDashboardData();
    } catch (error) {
      setErrorMessage('Failed to delete operator');
    }
  };

  const toggleOperatorStatus = async (operatorId, currentStatus) => {
    try {
      await client.patch(`/admin/operators/${operatorId}`, {
        isActive: !currentStatus,
      });
      setSuccessMessage('Operator status updated!');
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchDashboardData();
    } catch (error) {
      setErrorMessage('Failed to update operator status');
    }
  };

  const assignOperatorToTask = async (taskId, operatorId) => {
    try {
      await client.patch(`/admin/tasks/${taskId}/assign-operator`, {
        operatorId,
      });
      setSuccessMessage('Task assigned successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      setAssignmentModal({ show: false, taskId: null });
      fetchDashboardData();
    } catch (error) {
      setErrorMessage('Failed to assign operator');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('servsync_token');
    localStorage.removeItem('servsync_role');
    localStorage.removeItem('servsync_user');
    navigate('/login');
  };

  const formatDate = (date) =>
    new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      {/* Global navigation */}
      <header className="sticky top-0 z-30 bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 text-slate-50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 lg:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-500 text-sm font-bold shadow-lg">
              SS
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-slate-50">ServSync</p>
              <p className="text-[11px] text-slate-400">Operations Suite</p>
            </div>
          </div>
          <nav className="hidden items-center gap-6 text-xs font-medium text-slate-300 md:flex">
            <button className="relative text-slate-50">
              Home
              <span className="absolute -bottom-1 left-0 h-[2px] w-6 rounded-full bg-slate-50" />
            </button>
            <button className="hover:text-slate-50">Analytics</button>
            <button className="hover:text-slate-50">Operators</button>
            <button className="hover:text-slate-50">Settings</button>
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full bg-slate-900/70 px-3 py-1.5 text-xs font-medium text-slate-100 md:inline-flex items-center gap-2">
              <span className="text-xs">🛡</span>
              Admin
            </span>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-2 rounded-full border border-slate-500 bg-slate-100 px-4 py-1.5 text-xs font-semibold text-slate-900 shadow-sm hover:bg-white"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col px-4 pb-10 pt-6 lg:px-6 lg:pt-8">
        {/* Top section */}
        <div className="mb-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-500/40">
              <span className="text-xl">⚙️</span>
            </div>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                Admin control
              </p>
              <h1 className="text-xl font-semibold text-slate-50 sm:text-2xl">
                ServSync Command Center
              </h1>
            </div>
          </div>
          <button
            onClick={() => setShowAddOperator(true)}
            className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-400 px-4 py-2 text-xs font-semibold text-emerald-950 shadow-[0_16px_40px_rgba(16,185,129,0.55)] transition hover:-translate-y-0.5 hover:shadow-[0_20px_55px_rgba(16,185,129,0.75)]"
          >
            <span className="text-base">+</span>
            <span>Add operator</span>
          </button>
        </div>

        {/* Hero & stats */}
        <section className="mb-6 grid gap-4 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          <div className="relative overflow-hidden rounded-3xl border border-indigo-500/40 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 px-5 py-5 sm:px-7 sm:py-7">
            <div className="absolute inset-0 opacity-50 mix-blend-screen">
              <div className="absolute -left-10 top-0 h-40 w-40 rounded-full bg-indigo-500/40 blur-3xl" />
              <div className="absolute right-[-40px] bottom-[-40px] h-48 w-48 rounded-full bg-sky-400/40 blur-3xl" />
            </div>
            <div className="relative flex h-full flex-col justify-between gap-6">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-indigo-200/80">
                  Live operations
                </p>
                <h2 className="mt-2 text-2xl font-semibold sm:text-3xl">
                  Full visibility across every bay.
                </h2>
                <p className="mt-2 max-w-md text-xs text-slate-300 sm:text-sm">
                  Monitor capacity, re‑assign work, and keep your service promise —
                  all from one real‑time dashboard.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-2xl bg-slate-900/80 px-4 py-3 text-xs shadow-lg ring-1 ring-indigo-500/40">
                  <p className="text-slate-400">Active operators</p>
                  <p className="mt-1 text-lg font-semibold text-indigo-300">
                    {stats.activeOperators || 0}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-900/80 px-4 py-3 text-xs shadow-lg ring-1 ring-emerald-500/40">
                  <p className="text-slate-400">In progress</p>
                  <p className="mt-1 text-lg font-semibold text-emerald-300">
                    {stats.totalInProgress || 0}
                  </p>
                </div>
                <div className="rounded-2xl bg-slate-900/80 px-4 py-3 text-xs shadow-lg ring-1 ring-amber-400/50">
                  <p className="text-slate-400">Pending queue</p>
                  <p className="mt-1 text-lg font-semibold text-amber-200">
                    {stats.totalPending || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-1">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-4 shadow-lg">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                Lifetime completed
              </p>
              <p className="mt-2 text-3xl font-semibold text-emerald-300">
                {stats.totalCompleted || 0}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Average rating{' '}
                <span className="font-semibold text-amber-200">
                  ⭐ {stats.averageRating || 0}
                </span>
              </p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 px-4 py-4 shadow-lg">
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                Overview
              </p>
              <p className="mt-2 text-sm text-slate-300">
                {stats.totalOperators || 0} operators,{' '}
                {inProgressTasks.length} active tasks,{' '}
                {pendingTasks.length} waiting in queue.
              </p>
            </div>
          </div>
        </section>

        {/* Tabs */}
        <div className="mb-5 flex flex-wrap gap-2 rounded-full border border-slate-800 bg-slate-900/70 p-1 text-xs">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'operators', label: 'Operators', icon: '👨‍💼' },
            { id: 'completed', label: 'Completed', icon: '✅' },
            { id: 'in-progress', label: 'In progress', icon: '⏳' },
            { id: 'pending', label: 'Pending', icon: '⏸️' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 transition ${
                activeTab === tab.id
                  ? 'bg-slate-50 text-slate-900 shadow-sm'
                  : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {successMessage && (
          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-200">
            <span>✓</span>
            <p>{successMessage}</p>
          </div>
        )}
        {errorMessage && (
          <div className="mb-4 flex items-center gap-3 rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-xs text-red-200">
            <span>!</span>
            <p>{errorMessage}</p>
          </div>
        )}

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <section className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-md">
              <h3 className="mb-3 text-sm font-medium text-slate-100">
                Network health
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-slate-900 px-4 py-3 text-xs">
                  <p className="text-slate-400">Total operators</p>
                  <p className="mt-1 text-2xl font-semibold text-slate-50">
                    {stats.totalOperators || 0}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-900 px-4 py-3 text-xs">
                  <p className="text-slate-400">Active right now</p>
                  <p className="mt-1 text-2xl font-semibold text-indigo-200">
                    {stats.activeOperators || 0}
                  </p>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-md">
              <h3 className="mb-3 text-sm font-medium text-slate-100">
                Workload snapshot
              </h3>
              <div className="grid gap-3 sm:grid-cols-3 text-xs">
                <div className="rounded-xl bg-slate-900 px-4 py-3">
                  <p className="text-slate-400">Completed</p>
                  <p className="mt-1 text-xl font-semibold text-emerald-300">
                    {completedTasks.length}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-900 px-4 py-3">
                  <p className="text-slate-400">In progress</p>
                  <p className="mt-1 text-xl font-semibold text-sky-300">
                    {inProgressTasks.length}
                  </p>
                </div>
                <div className="rounded-xl bg-slate-900 px-4 py-3">
                  <p className="text-slate-400">Pending</p>
                  <p className="mt-1 text-xl font-semibold text-amber-200">
                    {pendingTasks.length}
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* OPERATORS */}
        {activeTab === 'operators' && (
          <section className="mt-1">
            {operators.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-900/40 px-6 py-12 text-center text-slate-400">
                <span className="mb-3 text-4xl">👥</span>
                <p className="text-sm font-medium text-slate-200">
                  No operators yet
                </p>
                <p className="mt-1 text-xs text-slate-400">
                  Add your first operator to start routing tasks.
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {operators.map((operator) => (
                  <div
                    key={operator._id}
                    className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-md"
                  >
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-slate-50">
                          {operator.name}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {operator.email}
                        </p>
                      </div>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                          operator.isActive
                            ? 'bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-500/40'
                            : 'bg-red-500/15 text-red-200 ring-1 ring-red-500/40'
                        }`}
                      >
                        <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-current" />
                        {operator.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>

                    <div className="mb-3 grid grid-cols-3 gap-2 rounded-xl bg-slate-950/60 p-3 text-[11px]">
                      <div>
                        <p className="text-slate-400">Completed</p>
                        <p className="mt-1 text-sm font-semibold text-emerald-300">
                          {operator.tasksCompleted || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400">In queue</p>
                        <p className="mt-1 text-sm font-semibold text-sky-300">
                          {operator.tasksInProgress || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-400">Rating</p>
                        <p className="mt-1 text-sm font-semibold text-amber-200">
                          ⭐ {operator.averageRating || 0}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 text-[11px]">
                      <button
                        onClick={() => viewOperatorStats(operator._id)}
                        className="inline-flex flex-1 items-center justify-center rounded-full bg-slate-800 px-3 py-1.5 text-slate-100 hover:bg-slate-700"
                      >
                        📊 View stats
                      </button>
                      <button
                        onClick={() =>
                          toggleOperatorStatus(operator._id, operator.isActive)
                        }
                        className="inline-flex flex-1 items-center justify-center rounded-full bg-sky-500/15 px-3 py-1.5 text-sky-200 ring-1 ring-sky-500/40 hover:bg-sky-500/25"
                      >
                        {operator.isActive ? '⏸ Pause' : '▶ Resume'}
                      </button>
                      <button
                        onClick={() => deleteOperator(operator._id)}
                        className="inline-flex flex-1 items-center justify-center rounded-full bg-red-500/15 px-3 py-1.5 text-red-200 ring-1 ring-red-500/40 hover:bg-red-500/25"
                      >
                        🗑 Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* COMPLETED */}
        {activeTab === 'completed' && (
          <section className="mt-1 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-md">
            <h3 className="mb-3 text-sm font-medium text-slate-100">
              ✅ Completed tasks
            </h3>
            {completedTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <span className="mb-2 text-4xl">📭</span>
                <p className="text-xs">No completed tasks yet.</p>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                {completedTasks.map((task) => (
                  <div
                    key={task._id}
                    className="flex items-start justify-between rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-3 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-50">
                        {task.customerName}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-slate-300">
                        <span>🎫 {task.tokenId}</span>
                        <span>🔧 {task.service}</span>
                        <span>
                          👨‍🔧 {task.assignedOperator?.name || 'Unassigned'}
                        </span>
                      </div>
                    </div>
                    <p className="ml-3 text-[11px] text-emerald-200">
                      {formatDate(task.completedAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* IN PROGRESS */}
        {activeTab === 'in-progress' && (
          <section className="mt-1 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-md">
            <h3 className="mb-3 text-sm font-medium text-slate-100">
              ⏳ In progress
            </h3>
            {inProgressTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <span className="mb-2 text-4xl">🎉</span>
                <p className="text-xs">No tasks currently in progress.</p>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                {inProgressTasks.map((task) => (
                  <div
                    key={task._id}
                    className="rounded-xl border border-sky-500/30 bg-sky-500/5 px-3 py-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-50">
                          {task.customerName}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-slate-300">
                          <span>🎫 {task.tokenId}</span>
                          <span>🚗 {task.vehicle}</span>
                          <span>
                            👨‍🔧 {task.assignedOperator?.name || 'Unassigned'}
                          </span>
                          <span>🛠 {task.service}</span>
                        </div>
                      </div>
                      <span className="text-[11px] text-sky-200">Live</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* PENDING */}
        {activeTab === 'pending' && (
          <section className="mt-1 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-md">
            <h3 className="mb-3 text-sm font-medium text-slate-100">
              ⏸️ Pending — not assigned
            </h3>
            {pendingTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <span className="mb-2 text-4xl">✨</span>
                <p className="text-xs">All caught up — no pending tasks.</p>
              </div>
            ) : (
              <div className="space-y-3 text-xs">
                {pendingTasks.map((task) => (
                  <div
                    key={task._id}
                    className="flex items-start justify-between rounded-xl border border-amber-400/40 bg-amber-400/5 px-3 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-slate-50">
                        {task.customerName}
                      </p>
                      <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-slate-900">
                        <span>🎫 {task.tokenId}</span>
                        <span>🚗 {task.vehicle}</span>
                        <span>🔧 {task.service}</span>
                        <span className="text-amber-900/80">
                          📅 {formatDate(task.createdAt)}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() =>
                        setAssignmentModal({ show: true, taskId: task._id })
                      }
                      className="ml-3 inline-flex items-center rounded-full bg-slate-900/80 px-3 py-1.5 text-[11px] text-slate-100 ring-1 ring-slate-700 hover:bg-slate-800"
                    >
                      📋 Assign
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {/* Add operator modal */}
      {showAddOperator && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-950 px-5 py-6 shadow-[0_30px_80px_rgba(0,0,0,0.75)]">
            <h2 className="mb-4 text-sm font-semibold text-slate-50">
              ➕ Add new operator
            </h2>
            <form
              className="space-y-3 text-xs"
              onSubmit={addOperator}
            >
              <div className="space-y-1.5">
                <label className="text-slate-300">Full name</label>
                <input
                  type="text"
                  value={newOperator.name}
                  onChange={(e) =>
                    setNewOperator({ ...newOperator, name: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-50 outline-none ring-0 transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/60"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-slate-300">Email address</label>
                <input
                  type="email"
                  value={newOperator.email}
                  onChange={(e) =>
                    setNewOperator({ ...newOperator, email: e.target.value })
                  }
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-50 outline-none ring-0 transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/60"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-slate-300">Password</label>
                <input
                  type="password"
                  value={newOperator.password}
                  onChange={(e) =>
                    setNewOperator({ ...newOperator, password: e.target.value })
                  }
                  minLength={6}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-50 outline-none ring-0 transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/60"
                  required
                />
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddOperator(false)}
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-indigo-500 px-3 py-2 text-xs font-semibold text-white shadow-lg hover:bg-indigo-400"
                >
                  Add operator
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assignment modal */}
      {assignmentModal.show && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-950 px-5 py-6 shadow-[0_30px_80px_rgba(0,0,0,0.75)]">
            <h2 className="mb-4 text-sm font-semibold text-slate-50">
              📋 Assign task to operator
            </h2>
            <p className="mb-3 text-xs text-slate-400">
              Choose an operator to take ownership of this request.
            </p>
            <div className="mb-4 max-h-64 space-y-2 overflow-y-auto text-xs">
              {operators.length === 0 ? (
                <p className="text-slate-500">No operators available.</p>
              ) : (
                operators.map((op) => (
                  <button
                    key={op._id}
                    onClick={() =>
                      assignOperatorToTask(assignmentModal.taskId, op._id)
                    }
                    className="flex w-full items-center justify-between rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-left text-slate-100 hover:bg-slate-800"
                  >
                    <span>
                      👨‍🔧 {op.name}{' '}
                      <span className="ml-1 text-[11px] text-slate-400">
                        ({op.tasksInProgress || 0} in queue)
                      </span>
                    </span>
                  </button>
                ))
              )}
            </div>
            <button
              onClick={() => setAssignmentModal({ show: false, taskId: null })}
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Operator stats modal */}
      {showStatsModal && operatorStats && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-3xl rounded-2xl border border-slate-700 bg-slate-950 px-5 py-6 shadow-[0_30px_80px_rgba(0,0,0,0.75)]">
            <h2 className="mb-4 text-sm font-semibold text-slate-50">
              📊 {operatorStats.name} — performance
            </h2>
            <div className="grid gap-3 md:grid-cols-4 text-xs mb-5">
              <div className="rounded-xl bg-slate-900 px-3 py-3">
                <p className="text-slate-400">Completed</p>
                <p className="mt-1 text-xl font-semibold text-emerald-300">
                  {operatorStats.tasksCompleted}
                </p>
              </div>
              <div className="rounded-xl bg-slate-900 px-3 py-3">
                <p className="text-slate-400">In progress</p>
                <p className="mt-1 text-xl font-semibold text-sky-300">
                  {operatorStats.tasksInProgress}
                </p>
              </div>
              <div className="rounded-xl bg-slate-900 px-3 py-3">
                <p className="text-slate-400">Rating</p>
                <p className="mt-1 text-xl font-semibold text-amber-200">
                  ⭐ {operatorStats.averageRating?.toFixed(1) || '0'}
                </p>
              </div>
              <div className="rounded-xl bg-slate-900 px-3 py-3">
                <p className="text-slate-400">Ratings count</p>
                <p className="mt-1 text-xl font-semibold text-indigo-200">
                  {operatorStats.totalRatings || 0}
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 text-xs max-h-[420px] overflow-y-auto pr-1">
              <div className="space-y-2">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  In progress
                </h3>
                {operatorStats.inProgressTasks?.length === 0 ? (
                  <p className="rounded-xl bg-slate-900 px-3 py-3 text-slate-500">
                    No tasks in progress.
                  </p>
                ) : (
                  operatorStats.inProgressTasks?.map((task) => (
                    <div
                      key={task._id}
                      className="rounded-xl border border-sky-500/30 bg-sky-500/5 px-3 py-3"
                    >
                      <p className="text-sm font-semibold text-slate-50">
                        {task.customerName}
                      </p>
                      <div className="mt-1 grid grid-cols-2 gap-2 text-[11px] text-slate-200">
                        <span>🎫 {task.tokenId}</span>
                        <span>🚗 {task.vehicle}</span>
                        <span>🛁 {task.service}</span>
                        <span>📱 {task.phone}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Recent completed
                </h3>
                {operatorStats.completedTasks?.length === 0 ? (
                  <p className="rounded-xl bg-slate-900 px-3 py-3 text-slate-500">
                    No completed tasks.
                  </p>
                ) : (
                  operatorStats.completedTasks?.map((task) => (
                    <div
                      key={task._id}
                      className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-3 py-3"
                    >
                      <p className="text-sm font-semibold text-slate-50">
                        {task.customerName}
                      </p>
                      <div className="mt-1 grid grid-cols-2 gap-2 text-[11px] text-slate-200">
                        <span>🎫 {task.tokenId}</span>
                        <span>🚗 {task.vehicle}</span>
                        <span>🛁 {task.service}</span>
                        <span>📅 {formatDate(task.completedAt)}</span>
                      </div>
                      {task.operatorNotes && (
                        <p className="mt-2 text-[11px] italic text-slate-300">
                          📝 {task.operatorNotes}
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowStatsModal(false)}
                className="rounded-xl border border-slate-700 bg-slate-900 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
