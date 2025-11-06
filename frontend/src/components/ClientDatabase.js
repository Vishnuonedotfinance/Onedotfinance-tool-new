import { useState, useEffect, useRef } from 'react';
import { api } from '../App';
import { toast } from 'sonner';
import { Plus, Edit, Download, Trash2, Upload, FileDown } from 'lucide-react';
import FilterSort from './FilterSort';

export default function ClientDatabase({ user }) {
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [sortBy, setSortBy] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    client_name: '',
    address: '',
    start_date: '',
    tenure_months: 12,
    currency_preference: 'INR',
    service: '',
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
    loadServices();
  }, [sortBy, filterStatus, filterDepartment]);

  const loadClients = async () => {
    try {
      let url = '/clients';
      const params = [];
      if (sortBy) params.push(`sort_by=${sortBy.split('_')[0]}&sort_order=${sortBy.split('_')[1] || 'asc'}`);
      if (filterStatus) params.push(`filter_status=${filterStatus}`);
      if (filterDepartment) params.push(`filter_department=${filterDepartment}`);
      if (params.length > 0) url += '?' + params.join('&');
      
      const response = await api.get(url);
      // Sort by status: Active first, then Churned
      const sorted = response.data.sort((a, b) => {
        if (a.client_status === 'Active' && b.client_status !== 'Active') return -1;
        if (a.client_status !== 'Active' && b.client_status === 'Active') return 1;
        return 0;
      });
      setClients(sorted);
    } catch (error) {
      toast.error('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const response = await api.get('/users');
      setUsers(response.data.filter(u => u.role === 'Director' || u.role === 'Admin'));
    } catch (error) {
      console.error('Failed to load users');
    }
  };

  const loadServices = async () => {
    try {
      const response = await api.get('/services');
      setServices(response.data);
      if (response.data.length > 0 && !formData.service) {
        setFormData(prev => ({ ...prev, service: response.data[0].name }));
      }
    } catch (error) {
      console.error('Failed to load services');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await api.patch(`/clients/${editId}`, formData);
        toast.success('Client updated successfully');
      } else {
        await api.post('/clients', formData);
        toast.success('Client added successfully');
      }
      setShowModal(false);
      setEditMode(false);
      setEditId(null);
      resetForm();
      loadClients();
    } catch (error) {
      toast.error(error.response?.data?.detail || `Failed to ${editMode ? 'update' : 'add'} client`);
    }
  };

  const handleEdit = (client) => {
    setFormData({
      client_name: client.client_name,
      address: client.address,
      start_date: client.start_date,
      tenure_months: client.tenure_months,
      currency_preference: client.currency_preference,
      service: client.service,
      amount_inr: client.amount_inr,
      amount_ppc: client.amount_ppc || 0,
      amount_seo: client.amount_seo || 0,
      authorised_signatory: client.authorised_signatory,
      signatory_designation: client.signatory_designation,
      gst: client.gst,
      poc_name: client.poc_name,
      poc_email: client.poc_email,
      poc_designation: client.poc_designation,
      poc_mobile: client.poc_mobile,
      approver_user_id: client.approver_user_id
    });
    setEditId(client.id);
    setEditMode(true);
    setShowModal(true);
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

  const handleDelete = async (clientId, clientName) => {
    if (window.confirm(`Are you sure you want to delete client "${clientName}"? This action cannot be undone.`)) {
      try {
        await api.delete(`/clients/${clientId}`);
        toast.success('Client deleted successfully');
        loadClients();
      } catch (error) {
        toast.error(error.response?.data?.detail || 'Failed to delete client');
      }
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.get('/clients/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'clients_export.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Clients exported successfully');
    } catch (error) {
      toast.error('Failed to export clients');
    }
  };

  const handleDownloadSample = async () => {
    try {
      const response = await api.get('/clients/sample', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'client_sample.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Sample template downloaded');
    } catch (error) {
      toast.error('Failed to download sample');
    }
  };

  const handleImport = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await api.post('/clients/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success(response.data.message);
      if (response.data.errors && response.data.errors.length > 0) {
        console.log('Import errors:', response.data.errors);
        toast.warning(`${response.data.errors.length} rows had errors. Check console for details.`);
      }
      loadClients();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to import clients');
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div data-testid="client-database">
      <div className="table-container">
        <div className="table-header">
          <h2>Client Database <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>(Total: {clients.length})</span></h2>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Department Filter */}
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #e5e7eb' }}
              data-testid="department-filter"
            >
              <option value="">All Services</option>
              <option value="PPC">PPC</option>
              <option value="SEO">SEO</option>
              <option value="Content">Content</option>
              <option value="Backlink">Backlink</option>
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #e5e7eb' }}
              data-testid="status-filter"
            >
              <option value="">All Status</option>
              <option value="Active">Active</option>
              <option value="Churned">Churned</option>
            </select>

            <button
              className="btn-secondary"
              onClick={handleDownloadSample}
              data-testid="download-sample-button"
              title="Download Sample Template"
            >
              <FileDown size={18} style={{ marginRight: '0.5rem', display: 'inline', verticalAlign: 'middle' }} />
              Sample
            </button>
            <button
              className="btn-secondary"
              onClick={() => fileInputRef.current?.click()}
              data-testid="import-clients-button"
              title="Import from Excel"
            >
              <Upload size={18} style={{ marginRight: '0.5rem', display: 'inline', verticalAlign: 'middle' }} />
              Import
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleImport}
              style={{ display: 'none' }}
              data-testid="file-input"
            />
            <button
              className="btn-secondary"
              onClick={handleExport}
              data-testid="export-clients-button"
              title="Export to Excel"
            >
              <Download size={18} style={{ marginRight: '0.5rem', display: 'inline', verticalAlign: 'middle' }} />
              Export
            </button>
            <button
              className="btn-success"
              onClick={() => { setEditMode(false); setShowModal(true); }}
              data-testid="add-client-button"
            >
              <Plus size={18} style={{ marginRight: '0.5rem', display: 'inline', verticalAlign: 'middle' }} />
              Add Client
            </button>
          </div>
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
                      <button 
                        className="btn-icon" 
                        onClick={() => handleEdit(client)}
                        data-testid={`edit-client-${client.id}`}
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        className="btn-icon" 
                        data-testid={`download-client-${client.id}`}
                        title="Download"
                      >
                        <Download size={16} />
                      </button>
                      <button 
                        className="btn-icon" 
                        onClick={() => handleDelete(client.id, client.client_name)}
                        data-testid={`delete-client-${client.id}`}
                        style={{ color: '#dc2626' }}
                        title="Delete"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              <tr style={{ backgroundColor: '#f3f4f6', fontWeight: '600', borderTop: '2px solid #9ca3af' }}>
                <td colSpan="5" style={{ textAlign: 'right' }}>Total:</td>
                <td>₹{clients.reduce((sum, c) => sum + (c.amount_inr || 0), 0).toLocaleString()}</td>
                <td colSpan="4"></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} data-testid="add-client-modal">
            <div className="modal-header">
              <h2>{editMode ? 'Edit Client' : 'Add New Client'}</h2>
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
                      required
                    >
                      <option value="">Select Service</option>
                      {services.map(service => (
                        <option key={service.id} value={service.name}>{service.name}</option>
                      ))}
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
                  {editMode ? 'Update Client' : 'Save Client'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
