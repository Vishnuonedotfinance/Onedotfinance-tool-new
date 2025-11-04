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

  const departments = ['PPC', 'SEO', 'Content', 'Backlink', 'Business Development', 'Others'];

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
          <h3>Agreements Expiring Soon (30 days)</h3>
          <p>{data.alerts.expiring_agreements.length}</p>
          {data.alerts.expiring_agreements.length > 0 && (
            <div style={{ marginTop: '1rem', fontSize: '0.875rem' }}>
              {data.alerts.expiring_agreements.map((client, idx) => (
                <div key={idx} style={{ padding: '0.5rem 0', borderBottom: '1px solid #fbbf24' }}>
                  <div style={{ fontWeight: '600' }}>{client.name}</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                    {client.service} - Expires: {client.end_date}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="alert-card" data-testid="alert-upcoming-birthdays">
          <AlertTriangle size={24} style={{ marginBottom: '0.5rem' }} />
          <h3>Upcoming Birthdays (15 days)</h3>
          <p>{data.alerts.upcoming_birthdays.length}</p>
          {data.alerts.upcoming_birthdays.length > 0 && (
            <div style={{ marginTop: '1rem', fontSize: '0.875rem' }}>
              {data.alerts.upcoming_birthdays.map((person, idx) => (
                <div key={idx} style={{ padding: '0.5rem 0', borderBottom: '1px solid #fbbf24' }}>
                  <div style={{ fontWeight: '600' }}>{person.name}</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                    {person.type} - {person.department} - {new Date(person.date).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="alert-card" data-testid="alert-expired-agreements" style={{ backgroundColor: '#fee2e2', borderColor: '#ef4444' }}>
          <AlertTriangle size={24} style={{ marginBottom: '0.5rem', color: '#dc2626' }} />
          <h3 style={{ color: '#991b1b' }}>Expired Agreements</h3>
          <p style={{ color: '#991b1b' }}>{data.alerts.expired_agreements?.length || 0}</p>
          {data.alerts.expired_agreements && data.alerts.expired_agreements.length > 0 && (
            <div style={{ marginTop: '1rem', fontSize: '0.875rem' }}>
              {data.alerts.expired_agreements.map((client, idx) => (
                <div key={idx} style={{ padding: '0.5rem 0', borderBottom: '1px solid #fca5a5' }}>
                  <div style={{ fontWeight: '600' }}>{client.name}</div>
                  <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>
                    {client.service} - Expired: {client.end_date}
                  </div>
                </div>
              ))}
            </div>
          )}
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
