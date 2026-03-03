import React, { useState, useEffect } from 'react';
import client from '../api/client';

export default function AdminDashboard() {
  const [operators, setOperators] = useState([]);
  const [serviceHistory, setServiceHistory] = useState([]);
  const [stats, setStats] = useState({
    totalOperators: 0,
    totalCompleted: 0,
    averageRating: 4.8,
    totalRevenue: 0,
    activeNow: 0,
    queueLength: 0
  });
  const [showAddOperator, setShowAddOperator] = useState(false);
  const [newOperator, setNewOperator] = useState({ name: '', email: '', password: '' });
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [operatorsRes, historyRes, statsRes] = await Promise.all([
        client.get('/admin/operators'),
        client.get('/admin/service-history'),
        client.get('/admin/stats')
      ]);
      setOperators(operatorsRes.data || []);
      setServiceHistory(historyRes.data || []);
      setStats(statsRes.data || {});
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const addOperator = async (e) => {
    e.preventDefault();
    try {
      await client.post('/admin/operators', newOperator);
      setNewOperator({ name: '', email: '', password: '' });
      setShowAddOperator(false);
      fetchDashboardData();
    } catch (error) {
      console.error('Error adding operator:', error);
    }
  };

  const deleteOperator = async (operatorId) => {
    if (window.confirm('Are you sure you want to remove this operator?')) {
      try {
        await client.delete(`/admin/operators/${operatorId}`);
        fetchDashboardData();
      } catch (error) {
        console.error('Error deleting operator:', error);
      }
    }
  };

  const filteredHistory = serviceHistory.filter(service => {
    if (filter === 'all') return true;
    return service.status === filter;
  });

  return (
    <div className="admin-dashboard-container">
      <style>{`
        .admin-dashboard-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          padding: 30px 20px;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', sans-serif;
        }

        .admin-wrapper {
          max-width: 1600px;
          margin: 0 auto;
        }

        .admin-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          color: white;
          margin-bottom: 30px;
        }

        .admin-header h1 {
          font-size: 2rem;
          margin: 0;
          font-weight: 700;
        }

        .add-operator-btn {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%);
          color: white;
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.3s ease;
        }

        .add-operator-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(16, 185, 129, 0.3);
        }

        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }

        .modal-content {
          background: white;
          border-radius: 12px;
          padding: 30px;
          max-width: 500px;
          width: 100%;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }

        .modal-header {
          font-size: 1.5rem;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 20px;
        }

        .modal-form {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .modal-form input {
          padding: 12px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          font-size: 1rem;
        }

        .modal-form input:focus {
          outline: none;
          border-color: #10b981;
        }

        .modal-buttons {
          display: flex;
          gap: 10px;
          margin-top: 15px;
        }

        .btn-cancel, .btn-save {
          flex: 1;
          padding: 12px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .btn-cancel {
          background: #e5e7eb;
          color: #374151;
        }

        .btn-cancel:hover {
          background: #d1d5db;
        }

        .btn-save {
          background: #10b981;
          color: white;
        }

        .btn-save:hover {
          background: #059669;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .stat-card {
          background: white;
          border-radius: 12px;
          padding: 25px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        }

        .stat-label {
          color: #6b7280;
          font-size: 0.9rem;
          margin-bottom: 8px;
          font-weight: 500;
        }

        .stat-value {
          font-size: 2.5rem;
          font-weight: 700;
          color: #1f2937;
          margin: 0;
          line-height: 1;
        }

        .stat-change {
          color: #10b981;
          font-size: 0.85rem;
          margin-top: 8px;
        }

        .stat-change.negative {
          color: #ef4444;
        }

        .dashboard-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
          margin-bottom: 30px;
        }

        .dashboard-card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
          overflow: hidden;
        }

        .card-header {
          padding: 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          font-size: 1.2rem;
          font-weight: 600;
        }

        .card-body {
          padding: 20px;
        }

        .operator-list {
          display: flex;
          flex-direction: column;
          gap: 15px;
        }

        .operator-item {
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          border-radius: 10px;
          padding: 15px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          transition: all 0.3s ease;
        }

        .operator-item:hover {
          border-color: #667eea;
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
        }

        .operator-info h3 {
          margin: 0 0 6px 0;
          color: #1f2937;
          font-weight: 600;
        }

        .operator-details {
          display: flex;
          gap: 15px;
          font-size: 0.85rem;
          color: #6b7280;
        }

        .operator-actions {
          display: flex;
          gap: 8px;
        }

        .btn-view, .btn-remove {
          padding: 6px 12px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          font-size: 0.8rem;
          font-weight: 600;
          transition: all 0.2s ease;
        }

        .btn-view {
          background: #dbeafe;
          color: #1e40af;
        }

        .btn-view:hover {
          background: #bfdbfe;
        }

        .btn-remove {
          background: #fee2e2;
          color: #991b1b;
        }

        .btn-remove:hover {
          background: #fecaca;
        }

        .status-badge {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 0.75rem;
          font-weight: 700;
        }

        .status-badge.online {
          background: #dcfce7;
          color: #166534;
        }

        .status-badge.offline {
          background: #fee2e2;
          color: #991b1b;
        }

        .status-badge.completed {
          background: #dcfce7;
          color: #166534;
        }

        .status-badge.in-progress {
          background: #fef3c7;
          color: #b45309;
        }

        .service-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-height: 400px;
          overflow-y: auto;
        }

        .service-item {
          background: #f9fafb;
          border-left: 4px solid #667eea;
          padding: 12px;
          border-radius: 6px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .service-item.completed {
          border-left-color: #10b981;
        }

        .service-item.in-progress {
          border-left-color: #f59e0b;
        }

        .service-info h4 {
          margin: 0;
          color: #1f2937;
          font-size: 0.95rem;
        }

        .service-meta {
          display: flex;
          gap: 12px;
          font-size: 0.8rem;
          color: #6b7280;
          margin-top: 4px;
        }

        .filter-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 15px;
          flex-wrap: wrap;
        }

        .filter-btn {
          padding: 6px 12px;
          border: 2px solid #e5e7eb;
          background: white;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          font-size: 0.85rem;
          color: #6b7280;
          transition: all 0.2s ease;
        }

        .filter-btn.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-color: transparent;
        }

        .analytics {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-top: 15px;
        }

        .analytics-item {
          background: #f0f4ff;
          padding: 12px;
          border-radius: 8px;
          text-align: center;
        }

        .analytics-label {
          color: #6b7280;
          font-size: 0.8rem;
          margin-bottom: 4px;
        }

        .analytics-value {
          font-size: 1.3rem;
          font-weight: 700;
          color: #667eea;
        }

        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: #9ca3af;
        }

        .empty-state-icon {
          font-size: 2.5rem;
          margin-bottom: 10px;
        }

        .empty-state h3 {
          margin: 0 0 5px 0;
          color: #6b7280;
        }

        .queue-indicator {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #fef3c7;
          border: 1px solid #fbbf24;
          color: #b45309;
          padding: 6px 12px;
          border-radius: 20px;
          font-size: 0.85rem;
          font-weight: 600;
        }

        @media (max-width: 1200px) {
          .dashboard-grid {
            grid-template-columns: 1fr;
          }

          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }

        @media (max-width: 640px) {
          .admin-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 15px;
          }

          .stats-grid {
            grid-template-columns: 1fr;
          }

          .operator-item {
            flex-direction: column;
            align-items: flex-start;
          }

          .operator-actions {
            width: 100%;
            margin-top: 10px;
          }

          .operator-actions button {
            flex: 1;
          }

          .analytics {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="admin-wrapper">
        <div className="admin-header">
          <h1>⚙️ Admin Dashboard</h1>
          <button className="add-operator-btn" onClick={() => setShowAddOperator(true)}>
            + Add Operator
          </button>
        </div>

        {showAddOperator && (
          <div className="modal-overlay" onClick={() => setShowAddOperator(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">Add New Operator</div>
              <form className="modal-form" onSubmit={addOperator}>
                <input
                  type="text"
                  placeholder="Full Name"
                  value={newOperator.name}
                  onChange={(e) => setNewOperator({ ...newOperator, name: e.target.value })}
                  required
                />
                <input
                  type="email"
                  placeholder="Email Address"
                  value={newOperator.email}
                  onChange={(e) => setNewOperator({ ...newOperator, email: e.target.value })}
                  required
                />
                <input
                  type="password"
                  placeholder="Password"
                  value={newOperator.password}
                  onChange={(e) => setNewOperator({ ...newOperator, password: e.target.value })}
                  required
                  minLength={6}
                />
                <div className="modal-buttons">
                  <button 
                    type="button" 
                    className="btn-cancel"
                    onClick={() => setShowAddOperator(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn-save">
                    Add Operator
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-label">Total Operators</div>
            <p className="stat-value">{stats.totalOperators || 0}</p>
            <div className="stat-change">{stats.activeNow || 0} active now</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Services Completed</div>
            <p className="stat-value">{stats.totalCompleted || 0}</p>
            <div className="stat-change">↑ 12% from last week</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Average Rating</div>
            <p className="stat-value">⭐ {stats.averageRating || 4.8}</p>
            <div className="stat-change">Excellent performance</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Queue Length</div>
            <p className="stat-value">{stats.queueLength || 0}</p>
            <div className="stat-change">Customers waiting</div>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="dashboard-card">
            <div className="card-header">👨‍💼 Operators Management</div>
            <div className="card-body">
              {operators.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">👥</div>
                  <h3>No Operators</h3>
                  <p>Add operators to get started</p>
                </div>
              ) : (
                <div className="operator-list">
                  {operators.map((operator) => (
                    <div key={operator.id} className="operator-item">
                      <div className="operator-info">
                        <h3>{operator.name}</h3>
                        <div className="operator-details">
                          <span>📧 {operator.email}</span>
                          <span>📱 {operator.phone}</span>
                          <span className="status-badge online">🟢 Online</span>
                        </div>
                      </div>
                      <div className="operator-actions">
                        <button className="btn-view">View Stats</button>
                        <button className="btn-remove" onClick={() => deleteOperator(operator.id)}>
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <div className="analytics">
                <div className="analytics-item">
                  <div className="analytics-label">Avg Tasks/Day</div>
                  <div className="analytics-value">12.4</div>
                </div>
                <div className="analytics-item">
                  <div className="analytics-label">Avg Rating</div>
                  <div className="analytics-value">4.8⭐</div>
                </div>
              </div>
            </div>
          </div>

          <div className="dashboard-card">
            <div className="card-header">📋 Service History</div>
            <div className="card-body">
              <div className="filter-tabs">
                <button 
                  className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                  onClick={() => setFilter('all')}
                >
                  All
                </button>
                <button 
                  className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
                  onClick={() => setFilter('completed')}
                >
                  Completed
                </button>
                <button 
                  className={`filter-btn ${filter === 'in-progress' ? 'active' : ''}`}
                  onClick={() => setFilter('in-progress')}
                >
                  In Progress
                </button>
              </div>

              {filteredHistory.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📭</div>
                  <h3>No Services</h3>
                  <p>Service history will appear here</p>
                </div>
              ) : (
                <div className="service-list">
                  {filteredHistory.map((service, index) => (
                    <div key={index} className={`service-item ${service.status}`}>
                      <div className="service-info">
                        <h4>Token #{service.tokenNumber}</h4>
                        <div className="service-meta">
                          <span>👤 {service.customerName}</span>
                          <span>👨‍🔧 {service.operatorName}</span>
                          <span>⏱️ {service.duration}m</span>
                        </div>
                      </div>
                      <span className={`status-badge ${service.status}`}>
                        {service.status === 'completed' ? '✓ Done' : '⏳ Progress'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
