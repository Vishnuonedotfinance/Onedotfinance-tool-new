import { useState, useEffect } from 'react';
import { api } from '../App';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Download, Upload, FileDown } from 'lucide-react';

export default function ClientOnboarding() {
  const [onboardings, setOnboardings] = useState([]);
  const [users, setUsers] = useState([]);
  const [availableServices, setAvailableServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [formData, setFormData] = useState({
    client_name: '',
    poc_name: '',
    poc_email: '',
    services: [],
    currency: 'INR',
    pricing: 0,
    approver_user_id: ''
  });

  useEffect(() => {
    loadOnboardings();
    loadUsers();
    loadAvailableServices();
  }, []);

  const loadOnboardings = async () => {
    try {
      const response = await api.get('/client-onboarding');
      setOnboardings(response.data);
    } catch (error) {
      toast.error('Failed to load onboardings');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await api.get('/users');
      const directors = response.data.filter(u => u.role === 'Director' || u.role === 'Admin');
      setUsers(directors);
    } catch (error) {
      console.error('Failed to load users');
    }
  };

  const loadAvailableServices = async () => {
    try {
      const response = await api.get('/services');
      setAvailableServices(response.data);
    } catch (error) {
      console.error('Failed to load services');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await api.patch(`/client-onboarding/${editId}`, formData);
        toast.success('Onboarding updated');
      } else {
        await api.post('/client-onboarding', formData);
        toast.success('Onboarding created');
      }
      loadOnboardings();
      setShowModal(false);
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save');
    }
  };

  const handleEdit = (onboarding) => {
    setFormData({
      client_name: onboarding.client_name,
      poc_name: onboarding.poc_name,
      poc_email: onboarding.poc_email,
      services: onboarding.services,
      currency: onboarding.currency,
      pricing: onboarding.pricing,
      approver_user_id: onboarding.approver_user_id
    });
    setEditId(onboarding.id);
    setEditMode(true);
    setShowModal(true);
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Delete onboarding for ${name}?`)) {
      try {
        await api.delete(`/client-onboarding/${id}`);
        toast.success('Onboarding deleted');
        loadOnboardings();
      } catch (error) {
        toast.error('Failed to delete');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      client_name: '',
      poc_name: '',
      poc_email: '',
      services: [],
      currency: 'INR',
      pricing: 0,
      approver_user_id: ''
    });
    setEditMode(false);
    setEditId(null);
  };

  const handleServiceToggle = (service) => {
    const services = [...formData.services];
    const index = services.indexOf(service);
    if (index > -1) {
      services.splice(index, 1);
    } else {
      services.push(service);
    }
    setFormData({ ...formData, services });
  };

  const handleStatusUpdate = async (id, field, value) => {
    try {
      await api.patch(`/client-onboarding/${id}`, { [field]: value });
      toast.success('Status updated');
      loadOnboardings();
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Client Onboarding</h1>
        <p>Manage client onboarding pipeline</p>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h2>Onboarding Pipeline <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>(Total: {onboardings.length})</span></h2>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              className="btn-success"
              onClick={() => { setEditMode(false); resetForm(); setShowModal(true); }}
            >
              <Plus size={18} style={{ marginRight: '0.5rem', display: 'inline', verticalAlign: 'middle' }} />
              New Onboarding
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>S/No</th>
                <th>Client Name</th>
                <th>POC Name</th>
                <th>Email</th>
                <th>Services</th>
                <th>Currency</th>
                <th>Pricing</th>
                <th>Proposal Status</th>
                <th>Onboarding Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {onboardings.map((item, idx) => (
                <tr key={item.id}>
                  <td>{idx + 1}</td>
                  <td>{item.client_name}</td>
                  <td>{item.poc_name}</td>
                  <td>{item.poc_email}</td>
                  <td>{item.services.join(', ')}</td>
                  <td>{item.currency}</td>
                  <td>{item.currency === 'INR' ? '₹' : '$'}{item.pricing.toLocaleString()}</td>
                  <td>
                    <select
                      value={item.proposal_status}
                      onChange={(e) => handleStatusUpdate(item.id, 'proposal_status', e.target.value)}
                      style={{ padding: '0.25rem', borderRadius: '4px', border: '1px solid #e5e7eb' }}
                    >
                      <option value="Sent">Sent</option>
                      <option value="Approved">Approved</option>
                      <option value="Rejected">Rejected</option>
                      <option value="In Negotiation">In Negotiation</option>
                    </select>
                  </td>
                  <td>
                    <select
                      value={item.onboarding_status}
                      onChange={(e) => handleStatusUpdate(item.id, 'onboarding_status', e.target.value)}
                      style={{ padding: '0.25rem', borderRadius: '4px', border: '1px solid #e5e7eb' }}
                    >
                      <option value="Not Onboarded">Not Onboarded</option>
                      <option value="WIP">WIP</option>
                      <option value="Onboarded">Onboarded</option>
                    </select>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-icon" onClick={() => handleEdit(item)} title="Edit">
                        <Edit size={16} />
                      </button>
                      <button className="btn-icon" onClick={() => handleDelete(item.id, item.client_name)} style={{ color: '#dc2626' }} title="Delete">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>{editMode ? 'Edit' : 'New'} Client Onboarding</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group form-group-full">
                  <label>Client Name *</label>
                  <input type="text" value={formData.client_name} onChange={(e) => setFormData({ ...formData, client_name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>POC Name *</label>
                  <input type="text" value={formData.poc_name} onChange={(e) => setFormData({ ...formData, poc_name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>POC Email *</label>
                  <input type="email" value={formData.poc_email} onChange={(e) => setFormData({ ...formData, poc_email: e.target.value })} required />
                </div>
                <div className="form-group form-group-full">
                  <label>Services * (Multiple Select)</label>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', padding: '0.5rem 0' }}>
                    {['PPC', 'SEO', 'Backlink', 'Content'].map(service => (
                      <label key={service} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          checked={formData.services.includes(service)}
                          onChange={() => handleServiceToggle(service)}
                        />
                        {service}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="form-group">
                  <label>Currency *</label>
                  <select value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value })}>
                    <option value="INR">INR (₹)</option>
                    <option value="USD">USD ($)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Pricing *</label>
                  <input type="number" value={formData.pricing} onChange={(e) => setFormData({ ...formData, pricing: parseFloat(e.target.value) })} required />
                </div>
                <div className="form-group form-group-full">
                  <label>Approver (Director) *</label>
                  <select value={formData.approver_user_id} onChange={(e) => setFormData({ ...formData, approver_user_id: e.target.value })} required>
                    <option value="">Select Director</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
