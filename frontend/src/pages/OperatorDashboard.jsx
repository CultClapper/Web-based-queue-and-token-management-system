import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';

export default function OperatorDashboardNew() {
  const [pendingRequests, setPendingRequests] = useState([]);
  const [inProgressRequests, setInProgressRequests] = useState([]);
  const [completedRequests, setCompletedRequests] = useState([]);
  const [recentCompletedRequests, setRecentCompletedRequests] = useState([]);
  const [completedHistory, setCompletedHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('queue');
  const [successMessage, setSuccessMessage] = useState('');
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
    return () => clearInterval(interval);
  }, []);

  const fetchOperators = async () => {
    try {
      const response = await client.get('/admin/operators');
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
      setPendingRequests(pendingRes.data || []);
      setInProgressRequests(inProgressRes.data || []);
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
      setSuccessMessage('✓ Task accepted successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error accepting task:', error);
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
      {/* Global navigation */}
      <header className="sticky top-0 z-30 bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 text-slate-50">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 lg:px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-indigo-500 text-sm font-bold shadow-lg">
              SS
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold text-slate-50">ServSync</p>
              <p className="text-[11px] text-slate-400">Operator Workspace</p>
            </div>
          </div>
          <nav className="hidden items-center gap-5 text-xs font-medium text-slate-300 md:flex">
            <button className="relative text-slate-50">
              Home
              <span className="absolute -bottom-1 left-0 h-[2px] w-6 rounded-full bg-slate-50" />
            </button>
            <button className="hover:text-slate-50">Queue</button>
            <button className="hover:text-slate-50">History</button>
          </nav>
          <div className="flex items-center gap-3">
            <span className="hidden rounded-full bg-slate-900/70 px-3 py-1.5 text-xs font-medium text-slate-100 md:inline-flex items-center gap-2">
              <span className="text-xs">🧰</span>
              Operator
            </span>
            <button
              onClick={() => {
                localStorage.removeItem('servsync_token');
                localStorage.removeItem('servsync_role');
                localStorage.removeItem('servsync_user');
                navigate('/login');
              }}
              className="inline-flex items-center gap-2 rounded-full border border-slate-500 bg-slate-100 px-4 py-1.5 text-xs font-semibold text-slate-900 shadow-sm hover:bg-white"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-6xl flex-col px-4 pb-10 pt-6 lg:px-6 lg:pt-8">
        {/* Header */}
        <section className="mb-6 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
              Operator workspace
            </p>
            <h1 className="mt-1 text-xl font-semibold text-slate-50 sm:text-2xl">
              📦 Live Service Queue
            </h1>
            <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-slate-300">
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1">
                🎯 Pending: {pendingRequests.length}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1">
                ⚙️ Active: {inProgressRequests.length}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-900 px-3 py-1">
                ✅ Completed: {completedRequests.length}
              </span>
            </div>
          </div>
        </section>

        {successMessage && (
          <div className="mb-4 flex items-center gap-2 rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-xs text-emerald-200">
            <span>✓</span>
            <p>{successMessage}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="mb-5 flex flex-wrap gap-2 rounded-full border border-slate-800 bg-slate-900/70 p-1 text-xs">
          {[
            { id: 'queue', label: 'Queue', icon: '📋' },
            { id: 'recent', label: 'Recent month', icon: '⏰' },
            { id: 'history', label: 'Year history', icon: '📅' },
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

        {/* QUEUE TAB */}
        {activeTab === 'queue' && (
          <section className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4 shadow-md text-xs">
            {/* Sub-navigation for queue views */}
            <div className="mb-4 inline-flex rounded-full bg-slate-950/70 p-1 text-[11px]">
              {[
                { id: 'pending', label: 'Pending', icon: '⏳' },
                { id: 'inProgress', label: 'In progress', icon: '⚙️' },
                { id: 'recent', label: 'Recently done', icon: '✅' },
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
                        className="rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-3"
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
                          <span>🚗 {request.vehicle}</span>
                          <span>🛁 {request.service}</span>
                          <span>📱 {request.phone}</span>
                          <span>🏢 {request.company}</span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-1 text-[11px]">
                          <button
                            onClick={() => acceptTask(request._id)}
                            className="flex-1 rounded-full bg-emerald-500 px-2 py-1 font-semibold text-emerald-950 hover:bg-emerald-400"
                          >
                            ✓ Accept
                          </button>
                          <button
                            onClick={() =>
                              setReassignModal({ show: true, taskId: request._id })
                            }
                            className="flex-1 rounded-full bg-amber-500/20 px-2 py-1 font-semibold text-amber-100 ring-1 ring-amber-500/40 hover:bg-amber-500/30"
                          >
                            ↗ Reassign
                          </button>
                          <button
                            onClick={() => deleteTask(request._id)}
                            className="flex-1 rounded-full bg-red-500/20 px-2 py-1 font-semibold text-red-200 ring-1 ring-red-500/40 hover:bg-red-500/30"
                          >
                            🗑 Delete
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
                  <p className="text-xs font-medium text-sky-100">⚙️ In progress</p>
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
                        className="rounded-xl border border-slate-700 bg-slate-950/80 px-3 py-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-semibold text-slate-50">
                              {request.customerName}
                            </p>
                            <p className="mt-0.5 text-[11px] text-sky-200">
                              In progress
                            </p>
                          </div>
                        </div>
                        <div className="mt-2 grid grid-cols-2 gap-2 text-[11px] text-slate-200">
                          <span>🚗 {request.vehicle}</span>
                          <span>🛁 {request.service}</span>
                          <span>📱 {request.phone}</span>
                          <span>🏢 {request.company}</span>
                        </div>
                        <div className="mt-3 flex flex-wrap gap-1 text-[11px]">
                          <button
                            onClick={() => setCompleteTaskId(request._id)}
                            className="flex-1 rounded-full bg-emerald-500 px-2 py-1 font-semibold text-emerald-950 hover:bg-emerald-400"
                          >
                            ✓ Complete
                          </button>
                          <button
                            onClick={() =>
                              setReassignModal({ show: true, taskId: request._id })
                            }
                            className="flex-1 rounded-full bg-amber-500/20 px-2 py-1 font-semibold text-amber-100 ring-1 ring-amber-500/40 hover:bg-amber-500/30"
                          >
                            ↗ Reassign
                          </button>
                          <button
                            onClick={() => deleteTask(request._id)}
                            className="flex-1 rounded-full bg-red-500/20 px-2 py-1 font-semibold text-red-200 ring-1 ring-red-500/40 hover:bg-red-500/30"
                          >
                            🗑 Delete
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
                          <span>🎫 {request.tokenId}</span>
                          <span>🚗 {request.vehicle}</span>
                          <span>🛁 {request.service}</span>
                          <span>📅 {formatDate(request.completedAt)}</span>
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
                📅 Last 12 months — completion history
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
                          <span>🎫 {request.tokenId}</span>
                          <span>🚗 {request.vehicle}</span>
                          <span>🛁 {request.service}</span>
                          <span>📅 {formatDate(request.completedAt)}</span>
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
