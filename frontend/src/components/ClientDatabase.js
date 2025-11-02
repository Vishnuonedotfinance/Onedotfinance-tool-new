import { useState, useEffect } from 'react';
import { api } from '../App';
import { toast } from 'sonner';
import { Plus, Edit, Download } from 'lucide-react';

export default function ClientDatabase({ user }) {
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    client_name: '',
    address: '',
    start_date: '',
    tenure_months: 12,
    currency_preference: 'INR',
    service: 'PPC',
    amount_inr: 0,
    amount_ppc: 0,
    amount_seo: 0,
    authorised_signatory: '',
    signatory_designation: '',
    gst: '',
    poc_name: '',
    poc_email: '',
    poc_designation: '',
    poc_mobile: '',
    approver_user_id: ''
  });

  useEffect(() => {
    loadClients();
    loadUsers();
  }, []);

  const loadClients = async () => {
    try {
      const response = await api.get('/clients');
      setClients(response.data);
    } catch (error) {
      toast.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await api.get('/users');
      const directors = response.data.filter(u => u.role === 'Director');
      setUsers(directors);
    } catch (error) {
      console.error('Failed to load users');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/clients', formData);
      toast.success('Client added successfully');
      setShowModal(false);
      resetForm();
      loadClients();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to add client');
    }
  };

  const resetForm = () => {
    setFormData({
      client_name: '',
      address: '',
      start_date: '',
      tenure_months: 12,
      currency_preference: 'INR',
      service: 'PPC',
      amount_inr: 0,
      amount_ppc: 0,
      amount_seo: 0,
      authorised_signatory: '',
      signatory_designation: '',
      gst: '',
      poc_name: '',
      poc_email: '',
      poc_designation: '',
      poc_mobile: '',
      approver_user_id: ''
    });
  };

  const toggleStatus = async (clientId, field, currentValue) => {
    const newValue = currentValue === 'Signed' ? 'Not signed' : 
                     currentValue === 'Active' ? 'Churned' : 
                     currentValue === 'Not signed' ? 'Signed' : 'Active';
    try {
      await api.patch(`/clients/${clientId}`, { [field]: newValue });
      loadClients();
      toast.success('Status updated');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  return (
    <div data-testid="client-database">
      <div className="table-container">
        <div className="table-header">
          <h2>Client Database</h2>
          <button
            className="btn-success"
            onClick={() => setShowModal(true)}
            data-testid="add-client-button"
          >
            <Plus size={18} style={{ marginRight: '0.5rem', display: 'inline', verticalAlign: 'middle' }} />
            Add Client
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>S/No.</th>
                <th>Client Name</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Department</th>
                <th>Revenue (INR)</th>
                <th>Sign Status</th>
                <th>Client Status</th>
                <th>Agreement Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map((client, idx) => (
                <tr key={client.id} data-testid={`client-row-${client.id}`}>
                  <td>{idx + 1}</td>
                  <td>{client.client_name}</td>
                  <td>{client.start_date}</td>
                  <td>{client.end_date}</td>
                  <td>{client.service}</td>
                  <td>₹{client.amount_inr.toLocaleString()}</td>
                  <td>
                    <span
                      className={`status-badge ${client.sign_status === 'Signed' ? 'status-active' : 'status-pending'}`}
                      onClick={() => toggleStatus(client.id, 'sign_status', client.sign_status)}
                      style={{ cursor: 'pointer' }}
                      data-testid={`sign-status-${client.id}`}
                    >
                      {client.sign_status}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`status-badge ${client.client_status === 'Active' ? 'status-active' : 'status-inactive'}`}
                      onClick={() => toggleStatus(client.id, 'client_status', client.client_status)}
                      style={{ cursor: 'pointer' }}
                      data-testid={`client-status-${client.id}`}
                    >
                      {client.client_status}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${client.agreement_status === 'Live' ? 'status-active' : 'status-inactive'}`}>
                      {client.agreement_status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button className="btn-icon" data-testid={`edit-client-${client.id}`}>
                        <Edit size={16} />
                      </button>
                      <button className="btn-icon" data-testid={`download-client-${client.id}`}>
                        <Download size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} data-testid="add-client-modal">
            <div className="modal-header">
              <h2>Add New Client</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group form-group-full">
                    <label>Client Name *</label>
                    <input
                      type="text"
                      value={formData.client_name}
                      onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                      required
                      data-testid="client-name-input"
                    />
                  </div>
                  <div className="form-group form-group-full">
                    <label>Address *</label>
                    <textarea
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      required
                      data-testid="address-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Start Date *</label>
                    <input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      required
                      data-testid="start-date-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Tenure (Months) *</label>
                    <input
                      type="number"
                      value={formData.tenure_months}
                      onChange={(e) => setFormData({ ...formData, tenure_months: parseInt(e.target.value) })}
                      required
                      data-testid="tenure-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Service *</label>
                    <select
                      value={formData.service}
                      onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                      data-testid="service-select"
                    >
                      <option value="PPC">PPC</option>
                      <option value="SEO">SEO</option>
                      <option value="Both">Both</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Amount (INR) *</label>
                    <input
                      type="number"
                      value={formData.amount_inr}
                      onChange={(e) => setFormData({ ...formData, amount_inr: parseFloat(e.target.value) })}
                      required
                      data-testid="amount-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>GST *</label>
                    <input
                      type="text"
                      value={formData.gst}
                      onChange={(e) => setFormData({ ...formData, gst: e.target.value })}
                      required
                      data-testid="gst-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Authorised Signatory *</label>
                    <input
                      type="text"
                      value={formData.authorised_signatory}
                      onChange={(e) => setFormData({ ...formData, authorised_signatory: e.target.value })}
                      required
                      data-testid="signatory-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Signatory Designation *</label>
                    <input
                      type="text"
                      value={formData.signatory_designation}
                      onChange={(e) => setFormData({ ...formData, signatory_designation: e.target.value })}
                      required
                      data-testid="designation-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>POC Name *</label>
                    <input
                      type="text"
                      value={formData.poc_name}
                      onChange={(e) => setFormData({ ...formData, poc_name: e.target.value })}
                      required
                      data-testid="poc-name-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>POC Email *</label>
                    <input
                      type="email"
                      value={formData.poc_email}
                      onChange={(e) => setFormData({ ...formData, poc_email: e.target.value })}
                      required
                      data-testid="poc-email-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>POC Designation *</label>
                    <input
                      type="text"
                      value={formData.poc_designation}
                      onChange={(e) => setFormData({ ...formData, poc_designation: e.target.value })}
                      required
                      data-testid="poc-designation-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>POC Mobile *</label>
                    <input
                      type="tel"
                      value={formData.poc_mobile}
                      onChange={(e) => setFormData({ ...formData, poc_mobile: e.target.value })}
                      required
                      data-testid="poc-mobile-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Approver (Director) *</label>
                    <select
                      value={formData.approver_user_id}
                      onChange={(e) => setFormData({ ...formData, approver_user_id: e.target.value })}
                      required
                      data-testid="approver-select"
                    >
                      <option value="">Select Approver</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" data-testid="save-client-button">
                  Save Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
