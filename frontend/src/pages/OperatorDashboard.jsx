import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';
// icons
import { MdCheck, MdRefresh, MdDeleteOutline, MdPlayArrow, MdTimer, MdDirectionsCar, MdCleanHands, MdPhone, MdBusiness, MdCalendarToday, MdConfirmationNumber } from 'react-icons/md';
import LiveTimer from '../components/LiveTimer';
import Navbar from '../components/Navbar';

// expected durations for services (minutes)
const SERVICE_DURATIONS = {
  basic: 15,
  standard: 30,
  premium: 45,
  detail: 60
};


export default function OperatorDashboardNew() {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [inProgressRequests, setInProgressRequests] = useState([]);
  const [completedRequests, setCompletedRequests] = useState([]);
  const [recentCompletedRequests, setRecentCompletedRequests] = useState([]);
  const [completedHistory, setCompletedHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('queue');
  const [successMessage, setSuccessMessage] = useState('');
  const [notification, setNotification] = useState('');
  const prevCounts = React.useRef({ pending: 0, inProgress: 0 });
  const [operatorNotes, setOperatorNotes] = useState('');
  const [completeTaskId, setCompleteTaskId] = useState(null);
  const [reassignModal, setReassignModal] = useState({ show: false, taskId: null });
  const [operators, setOperators] = useState([]);
  const [reassignLoading, setReassignLoading] = useState(false);
  const [queueView, setQueueView] = useState('pending'); // 'pending' | 'inProgress' | 'recent'
  const navigate = useNavigate();

  useEffect(() => {
    fetchServiceRequests();
    fetchOperators();
    const interval = setInterval(fetchServiceRequests, 5000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  const fetchOperators = async () => {
    try {
      const response = await client.get('/admin/operators-lite');
      setOperators(response.data || []);
    } catch (error) {
      console.error('Error fetching operators:', error);
    }
  };

  const fetchServiceRequests = async () => {
    try {
      const [pendingRes, inProgressRes, completedRes, recentRes, historyRes] = await Promise.all([
        client.get('/customer/requests/pending'),
        client.get('/customer/requests/in-progress'),
        client.get('/customer/requests/completed'),
        client.get('/customer/requests/operator/completed-recent'),
        client.get('/customer/requests/operator/completed-history')
      ]);
      const pending = pendingRes.data || [];
      const inProg = inProgressRes.data || [];
      // trigger notification if counts jump
      if (prevCounts.current.pending < pending.length) {
        setNotification('New pending task arrived');
        setTimeout(() => setNotification(''), 3500);
      }
      if (prevCounts.current.inProgress < inProg.length) {
        setNotification('A task entered in‑progress');
        setTimeout(() => setNotification(''), 3500);
      }
      prevCounts.current = { pending: pending.length, inProgress: inProg.length };

      setPendingRequests(pending);
      setInProgressRequests(inProg);
      setCompletedRequests(completedRes.data || []);
      setRecentCompletedRequests(recentRes.data || []);
      setCompletedHistory(historyRes.data || []);
    } catch (error) {
      console.error('Error fetching service requests:', error);
    } finally {
      setLoading(false);
    }
  };

  const acceptTask = async (requestId) => {
    try {
      const response = await client.patch(`/customer/requests/${requestId}/accept`);
      setPendingRequests(pendingRequests.filter(r => r._id !== requestId));
      setInProgressRequests([...inProgressRequests, response.data]);
      setSuccessMessage('Task claimed — click ▶️ to start timer');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error accepting task:', error);
    }
  };

  const startTask = async (requestId) => {
    try {
      const response = await client.patch(`/customer/requests/${requestId}/start`);
      setInProgressRequests(
        inProgressRequests.map(r => (r._id === requestId ? response.data : r))
      );
      setSuccessMessage('Timer started');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error starting task:', error);
    }
  };

  const completeTask = async (requestId) => {
    try {
      const response = await client.patch(`/customer/requests/${requestId}/complete`, {
        operatorNotes
      });
      setInProgressRequests(inProgressRequests.filter(r => r._id !== requestId));
      setCompletedRequests([...completedRequests, response.data]);
      setRecentCompletedRequests([response.data, ...recentCompletedRequests]);
      setSuccessMessage('✓ Task completed successfully!');
      setOperatorNotes('');
      setCompleteTaskId(null);
      setTimeout(() => setSuccessMessage(''), 3000);
      fetchServiceRequests();
    } catch (error) {
      console.error('Error completing task:', error);
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      await client.delete(`/customer/requests/${taskId}`);
      setPendingRequests(pendingRequests.filter(r => r._id !== taskId));
      setInProgressRequests(inProgressRequests.filter(r => r._id !== taskId));
      setSuccessMessage('✓ Task deleted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const reassignTask = async (taskId, newOperatorId) => {
    if (!newOperatorId) return;

    setReassignLoading(true);
    try {
      await client.patch(`/customer/requests/${taskId}/reassign`, {
        newOperatorId
      });
      setPendingRequests(pendingRequests.filter(r => r._id !== taskId));
      setInProgressRequests(inProgressRequests.filter(r => r._id !== taskId));
      setSuccessMessage('✓ Task reassigned successfully!');
      setReassignModal({ show: false, taskId: null });
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error reassigning task:', error);
      setSuccessMessage(`✗ ${error.response?.data?.message || 'Failed to reassign task'}`);
    } finally {
      setReassignLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50">
      <Navbar
        role="Operator"
        tabs={[
          { id: 'queue', label: 'Queue' },
          { id: 'recent', label: 'Recent' },
          { id: 'history', label: 'History' },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div className="mx-auto flex max-w-6xl flex-col px-4 pb-10 pt-6 lg:px-6 lg:pt-8">
        {/* Header + KPIs */}
        <section className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
              Live operations overview
            </p>
            <h1 className="mt-1 text-xl font-semibold text-slate-50 sm:text-2xl">
              Service Queue Management
            </h1>
            <p className="mt-1 max-w-xl text-xs text-slate-400">
              Monitor incoming requests, active work, and completion history in a single
              consolidated workspace.
            </p>
          </div>
          <div className="grid w-full gap-3 text-[11px] text-slate-200 sm:grid-cols-3 md:w-auto">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-3 py-2.5">
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400">
                Pending
              </p>
              <p className="mt-1 text-lg font-semibold text-amber-300">
                {pendingRequests.length}
              </p>
              <p className="mt-0.5 text-[10px] text-slate-500">Awaiting acceptance</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-3 py-2.5">
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400">
                In progress
              </p>
              <p className="mt-1 text-lg font-semibold text-sky-300">
                {inProgressRequests.length}
              </p>
              <p className="mt-0.5 text-[10px] text-slate-500">Currently active</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 px-3 py-2.5">
              <p className="text-[10px] font-medium uppercase tracking-[0.16em] text-slate-400">
                30‑day throughput
              </p>
              <p className="mt-1 text-lg font-semibold text-emerald-300">
                {recentCompletedRequests.length}
              </p>
              <p className="mt-0.5 text-[10px] text-slate-500">Completed in last month</p>
            </div>
          </div>
        </section>

        {successMessage && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs text-emerald-200">
            <span><MdCheck /></span>
            <p>{successMessage}</p>
          </div>
        )}
        {notification && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-xs text-amber-200">
            <span><MdTimer /></span>
            <p>{notification}</p>
          </div>
        )}

        {/* QUEUE TAB */}
        {activeTab === 'queue' && (
          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-md text-xs">
            {/* Sub-navigation for queue views */}
            <div className="mb-4 inline-flex rounded-full bg-slate-950/70 p-1 text-[11px]">
              {[
                { id: 'pending', label: 'Pending', icon: <MdTimer size={16} /> },
                { id: 'inProgress', label: 'In progress', icon: <MdPlayArrow size={16} /> },
                { id: 'recent', label: 'Recently done', icon: <MdCheck size={16} /> },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setQueueView(tab.id)}
                  className={`inline-flex items-center gap-1 rounded-full px-3 py-1.5 transition ${
                    queueView === tab.id
                      ? 'bg-slate-50 text-slate-900 shadow-sm'
                      : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>

            {/* Pending view */}
            {queueView === 'pending' && (
              <div className="rounded-2xl border border-amber-400/40 bg-slate-900/80 p-3 shadow-lg">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-medium text-amber-100">⏳ Pending tasks</p>
                  <span className="rounded-full bg-amber-500/20 px-2 py-0.5 text-[11px] font-semibold text-amber-100">
                    {pendingRequests.length}
                  </span>
                </div>
                {pendingRequests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-[11px] text-slate-400">
                    <span className="mb-2 text-3xl">📭</span>
                    <p>No pending tasks.</p>
                  </div>
                ) : (
                  <div className="space-y-3 text-xs">
                    {pendingRequests.slice(0, 20).map((request) => (
                      <div
                        key={request._id}
                        className="rounded-xl border border-slate-700 bg-white/5 backdrop-blur px-3 py-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-slate-50">
                              {request.customerName}
                            </p>
                            <p className="mt-0.5 text-[11px] text-slate-400">
                              {formatDate(request.createdAt)}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-200">
                          <span className="inline-flex items-center gap-1"><MdDirectionsCar size={14} /> {request.vehicle}</span>
                          <span className="inline-flex items-center gap-1"><MdCleanHands size={14} /> {request.service}</span>
                          <span className="inline-flex items-center gap-1"><MdPhone size={14} /> {request.phone}</span>
                          <span className="inline-flex items-center gap-1"><MdBusiness size={14} /> {request.company}</span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-1 text-[11px]">
                          <button
                            onClick={() => acceptTask(request._id)}
                            className="flex-1 rounded-full bg-white/10 backdrop-blur bg-emerald-500/60 px-2 py-1 font-semibold text-emerald-950 hover:bg-emerald-400"
                          >
                            <MdCheck size={18} /> Accept
                          </button>
                          <button
                            onClick={() =>
                              setReassignModal({ show: true, taskId: request._id })
                            }
                            className="flex-1 rounded-full bg-white/10 backdrop-blur bg-amber-500/40 px-2 py-1 font-semibold text-amber-100 ring-1 ring-amber-500/40 hover:bg-amber-500/30"
                          >
                            <MdRefresh size={18} /> Reassign
                          </button>
                          <button
                            onClick={() => deleteTask(request._id)}
                            className="flex-1 rounded-full bg-white/10 backdrop-blur bg-red-500/40 px-2 py-1 font-semibold text-red-200 ring-1 ring-red-500/40 hover:bg-red-500/30"
                          >
                            <MdDeleteOutline size={18} /> Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* In progress view */}
            {queueView === 'inProgress' && (
              <div className="rounded-2xl border border-sky-400/40 bg-slate-900/80 p-3 shadow-lg">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-medium text-sky-100"><MdPlayArrow className="inline-block" /> In progress</p>
                  <span className="rounded-full bg-sky-500/20 px-2 py-0.5 text-[11px] font-semibold text-sky-100">
                    {inProgressRequests.length}
                  </span>
                </div>
                {inProgressRequests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-[11px] text-slate-400">
                    <span className="mb-2 text-3xl">🎯</span>
                    <p>No active tasks.</p>
                  </div>
                ) : (
                  <div className="space-y-3 text-xs">
                    {inProgressRequests.slice(0, 20).map((request) => (
                      <div
                        key={request._id}
                        className="rounded-xl border border-slate-700 bg-white/5 backdrop-blur px-3 py-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-slate-50">
                              {request.customerName}
                            </p>
                            <p className="mt-0.5 text-[11px] text-sky-200">
                              In progress
                            </p>
                            {request.startedAt && (
                              <div className="mt-1 text-[11px] text-amber-200">
                                <MdTimer className="inline-block mr-1" />
                                <LiveTimer
                                  start={request.startedAt}
                                  expectedMinutes={SERVICE_DURATIONS[request.service]}
                                />
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-200">
                          <span className="inline-flex items-center gap-1"><MdDirectionsCar size={14} /> {request.vehicle}</span>
                          <span className="inline-flex items-center gap-1"><MdCleanHands size={14} /> {request.service}</span>
                          <span className="inline-flex items-center gap-1"><MdPhone size={14} /> {request.phone}</span>
                          <span className="inline-flex items-center gap-1"><MdBusiness size={14} /> {request.company}</span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-1 text-[11px]">
                          {!request.startedAt && (
                            <button
                              onClick={() => startTask(request._id)}
                              className="flex-none rounded-full bg-white/10 backdrop-blur bg-sky-500/60 px-2 py-1 font-semibold text-white hover:bg-sky-400"
                            >
                              <MdPlayArrow size={18} /> Start
                            </button>
                          )}
                          <button
                            onClick={() => setCompleteTaskId(request._id)}
                            className="flex-1 rounded-full bg-white/10 backdrop-blur bg-emerald-500/60 px-2 py-1 font-semibold text-emerald-950 hover:bg-emerald-400"
                          >
                            <MdCheck size={18} /> Complete
                          </button>
                          <button
                            onClick={() =>
                              setReassignModal({ show: true, taskId: request._id })
                            }
                            className="flex-1 rounded-full bg-white/10 backdrop-blur bg-amber-500/40 px-2 py-1 font-semibold text-amber-100 ring-1 ring-amber-500/40 hover:bg-amber-500/30"
                          >
                            <MdRefresh size={18} /> Reassign
                          </button>
                          <button
                            onClick={() => deleteTask(request._id)}
                            className="flex-1 rounded-full bg-white/10 backdrop-blur bg-red-500/40 px-2 py-1 font-semibold text-red-200 ring-1 ring-red-500/40 hover:bg-red-500/30"
                          >
                            <MdDeleteOutline size={18} /> Delete
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Recently done view */}
            {queueView === 'recent' && (
              <div className="rounded-2xl border border-emerald-400/40 bg-slate-900/80 p-3 shadow-lg">
                <div className="mb-3 flex items-center justify-between">
                  <p className="text-xs font-medium text-emerald-100">
                    ✅ Recently done
                  </p>
                  <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-100">
                    {recentCompletedRequests.slice(0, 5).length}
                  </span>
                </div>
                {recentCompletedRequests.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-6 text-[11px] text-slate-400">
                    <span className="mb-2 text-3xl">📋</span>
                    <p>No completed tasks yet.</p>
                  </div>
                ) : (
                  <div className="space-y-3 text-xs">
                    {recentCompletedRequests.slice(0, 20).map((request) => (
                      <div
                        key={request._id}
                        className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-3 py-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-slate-50">
                              {request.customerName}
                            </p>
                            <p className="mt-0.5 text-[11px] text-emerald-200">
                              {formatDate(request.completedAt)}
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-100">
                          <span>🚗 {request.vehicle}</span>
                          <span>🛁 {request.service}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        )}

        {/* RECENT MONTH */}
        {activeTab === 'recent' && (
          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-md text-xs">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-100">
                ⏰ Last 30 days — completed tasks
              </p>
              <span className="rounded-full bg-emerald-500/15 px-3 py-1 text-[11px] font-semibold text-emerald-200">
                {recentCompletedRequests.length} total
              </span>
            </div>
            {recentCompletedRequests.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <span className="mb-2 text-3xl">📭</span>
                <p>No tasks completed this month.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentCompletedRequests.map((request) => (
                  <div
                    key={request._id}
                    className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-3 py-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-50">
                          {request.customerName}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-slate-200">
                          <span className="inline-flex items-center gap-1"><MdConfirmationNumber className="inline-block" /> {request.tokenId}</span>
                          <span className="inline-flex items-center gap-1"><MdDirectionsCar size={14} /> {request.vehicle}</span>
                          <span className="inline-flex items-center gap-1"><MdCleanHands size={14} /> {request.service}</span>
                          <span className="inline-flex items-center gap-1"><MdCalendarToday size={14} /> {formatDate(request.completedAt)}</span>
                        </div>
                      </div>
                      <span className="text-[11px] text-emerald-200">✓ Done</span>
                    </div>
                    {request.operatorNotes && (
                      <p className="mt-2 text-[11px] italic text-slate-200">
                        📝 {request.operatorNotes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* HISTORY */}
        {activeTab === 'history' && (
          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-md text-xs">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-medium text-slate-100">
                <MdCalendarToday className="inline-block mr-1" /> Last 12 months — completion history
              </p>
              <span className="rounded-full bg-slate-50/10 px-3 py-1 text-[11px] font-semibold text-slate-100">
                {completedHistory.length} total
              </span>
            </div>
            {completedHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400">
                <span className="mb-2 text-3xl">📭</span>
                <p>No tasks completed this year.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {completedHistory.map((request) => (
                  <div
                    key={request._id}
                    className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 px-3 py-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-50">
                          {request.customerName}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-slate-200">
                          <span className="inline-flex items-center gap-1"><MdConfirmationNumber className="inline-block" /> {request.tokenId}</span>
                          <span className="inline-flex items-center gap-1"><MdDirectionsCar size={14} /> {request.vehicle}</span>
                          <span className="inline-flex items-center gap-1"><MdCleanHands size={14} /> {request.service}</span>
                          <span className="inline-flex items-center gap-1"><MdCalendarToday size={14} /> {formatDate(request.completedAt)}</span>
                        </div>
                      </div>
                      <span className="text-[11px] text-emerald-200">✓ Done</span>
                    </div>
                    {request.operatorNotes && (
                      <p className="mt-2 text-[11px] italic text-slate-200">
                        📝 {request.operatorNotes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </div>

      {/* COMPLETE TASK MODAL */}
      {completeTaskId && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-950 px-5 py-6 shadow-[0_30px_80px_rgba(0,0,0,0.75)] text-xs">
            <h2 className="mb-3 text-sm font-semibold text-slate-50">
              ✅ Complete task
            </h2>
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                completeTask(completeTaskId);
              }}
            >
              <label className="text-slate-300">
                Add notes (optional)
                <textarea
                  className="mt-1 h-28 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-50 outline-none ring-0 transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/60"
                  placeholder="Add any notes about the service..."
                  value={operatorNotes}
                  onChange={(e) => setOperatorNotes(e.target.value)}
                />
              </label>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setCompleteTaskId(null)}
                  className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 font-semibold text-slate-200 hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 rounded-xl bg-emerald-500 px-3 py-2 font-semibold text-emerald-950 hover:bg-emerald-400"
                >
                  Mark as complete
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REASSIGN TASK MODAL */}
      {reassignModal.show && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-700 bg-slate-950 px-5 py-6 shadow-[0_30px_80px_rgba(0,0,0,0.75)] text-xs">
            <h2 className="mb-3 text-sm font-semibold text-slate-50">
              ↗ Reassign task
            </h2>
            <p className="mb-3 text-slate-300">
              Select another operator with available capacity.
            </p>
            <div className="max-h-60 space-y-2 overflow-y-auto pr-1">
              {operators.filter((op) => op.tasksInProgress < 10).length === 0 ? (
                <p className="text-slate-500">
                  No operators available with capacity.
                </p>
              ) : (
                operators
                  .filter((op) => op.tasksInProgress < 10)
                  .map((op) => (
                    <button
                      key={op._id}
                      disabled={reassignLoading}
                      onClick={() => reassignTask(reassignModal.taskId, op._id)}
                      className="flex w-full items-center justify-between rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-left text-slate-100 hover:bg-slate-800 disabled:opacity-60"
                    >
                      <span>
                        👨‍🔧 {op.name}{' '}
                        <span className="ml-1 text-[11px] text-slate-400">
                          ({op.tasksInProgress || 0}/10 in queue)
                        </span>
                      </span>
                    </button>
                  ))
              )}
            </div>
            <button
              disabled={reassignLoading}
              onClick={() => setReassignModal({ show: false, taskId: null })}
              className="mt-4 w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 font-semibold text-slate-200 hover:bg-slate-800 disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
