import { useState, useEffect } from 'react';
import { api } from '../App';
import { AlertTriangle, TrendingUp, Users, UserCheck } from 'lucide-react';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const response = await api.get('/dashboard/summary');
      setData(response.data);
    } catch (error) {
      console.error('Failed to load dashboard', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading dashboard...</div>;
  if (!data) return <div>Failed to load dashboard</div>;

  const departments = ['PPC', 'SEO', 'Content', 'Business Development', 'Others'];

  return (
    <div className="dashboard" data-testid="dashboard">
      <div className="page-header">
        <h1>Dashboard</h1>
        <p>Overview of your business metrics</p>
      </div>

      {/* Alerts Section */}
      <div className="alerts-section">
        <div className="alert-card" data-testid="alert-expiring-agreements">
          <AlertTriangle size={24} style={{ marginBottom: '0.5rem' }} />
          <h3>Agreements Expiring Soon</h3>
          <p>{data.alerts.expiring_agreements}</p>
        </div>
        <div className="alert-card" data-testid="alert-upcoming-birthdays">
          <AlertTriangle size={24} style={{ marginBottom: '0.5rem' }} />
          <h3>Upcoming Birthdays (15 days)</h3>
          <p>{data.alerts.upcoming_birthdays}</p>
        </div>
      </div>

      {/* Revenue Metrics */}
      <div className="metrics-section">
        <h2 className="section-title">
          <TrendingUp size={24} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Recurring Revenue
        </h2>
        <div className="metrics-grid">
          {departments.map(dept => (
            <div key={dept} className="metric-card" data-testid={`revenue-${dept.toLowerCase().replace(' ', '-')}`}>
              <h4>{dept}</h4>
              <div className="metric-value">{data.revenue[dept]?.count || 0}</div>
              <div className="metric-amount">₹{(data.revenue[dept]?.amount || 0).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Employee Metrics */}
      <div className="metrics-section">
        <h2 className="section-title">
          <Users size={24} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Employee Count & Cost
        </h2>
        <div className="metrics-grid">
          {departments.map(dept => (
            <div key={dept} className="metric-card" data-testid={`employee-${dept.toLowerCase().replace(' ', '-')}`}>
              <h4>{dept}</h4>
              <div className="metric-value">{data.employees[dept]?.count || 0}</div>
              <div className="metric-amount">₹{(data.employees[dept]?.cost || 0).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Contractor Metrics */}
      <div className="metrics-section">
        <h2 className="section-title">
          <UserCheck size={24} style={{ display: 'inline', marginRight: '0.5rem', verticalAlign: 'middle' }} />
          Contractor Count & Cost
        </h2>
        <div className="metrics-grid">
          {departments.map(dept => (
            <div key={dept} className="metric-card" data-testid={`contractor-${dept.toLowerCase().replace(' ', '-')}`}>
              <h4>{dept}</h4>
              <div className="metric-value">{data.contractors[dept]?.count || 0}</div>
              <div className="metric-amount">₹{(data.contractors[dept]?.cost || 0).toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
