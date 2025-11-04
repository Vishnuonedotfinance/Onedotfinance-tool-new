import { useState, useEffect, useRef } from 'react';
import { api } from '../App';
import { toast } from 'sonner';
import { Plus, Edit, Download, Trash2, Upload, FileDown } from 'lucide-react';
import FilterSort from './FilterSort';

export default function ContractorDatabase({ user }) {
  const [contractors, setContractors] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [sortBy, setSortBy] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    name: '',
    doj: '',
    start_date: '',
    tenure_months: 6,
    dob: '',
    pan: '',
    aadhar: '',
    mobile: '',
    personal_email: '',
    bank_name: '',
    account_holder: '',
    account_no: '',
    ifsc: '',
    address_1: '',
    pincode: '',
    city: '',
    address_2: '',
    department: 'PPC',
    monthly_retainer_inr: 0,
    designation: '',
    approver_user_id: ''
  });

  useEffect(() => {
    loadContractors();
    loadUsers();
  }, [sortBy, filterStatus]);

  const loadContractors = async () => {
    try {
      let url = '/contractors';
      const params = [];
      if (sortBy) params.push(`sort_by=${sortBy.split('_')[0]}&sort_order=${sortBy.split('_')[1] || 'asc'}`);
      if (filterStatus) params.push(`filter_status=${filterStatus}`);
      if (params.length > 0) url += '?' + params.join('&');
      
      const response = await api.get(url);
      setContractors(response.data);
    } catch (error) {
      toast.error('Failed to load contractors');
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
      if (editMode) {
        await api.patch(`/contractors/${editId}`, formData);
        toast.success('Contractor updated successfully');
      } else {
        await api.post('/contractors', formData);
        toast.success('Contractor added successfully');
      }
      setShowModal(false);
      setEditMode(false);
      setEditId(null);
      resetForm();
      loadContractors();
    } catch (error) {
      toast.error(error.response?.data?.detail || `Failed to ${editMode ? 'update' : 'add'} contractor`);
    }
  };

  const handleEdit = (contractor) => {
    setFormData({
      name: contractor.name,
      doj: contractor.doj,
      start_date: contractor.start_date,
      tenure_months: contractor.tenure_months,
      dob: contractor.dob,
      pan: contractor.pan,
      aadhar: contractor.aadhar,
      mobile: contractor.mobile,
      personal_email: contractor.personal_email,
      bank_name: contractor.bank_name,
      account_holder: contractor.account_holder,
      account_no: contractor.account_no,
      ifsc: contractor.ifsc,
      address_1: contractor.address_1,
      pincode: contractor.pincode,
      city: contractor.city,
      address_2: contractor.address_2 || '',
      department: contractor.department,
      monthly_retainer_inr: contractor.monthly_retainer_inr,
      designation: contractor.designation,
      approver_user_id: contractor.approver_user_id
    });
    setEditId(contractor.id);
    setEditMode(true);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      name: '',
      doj: '',
      start_date: '',
      tenure_months: 6,
      dob: '',
      pan: '',
      aadhar: '',
      mobile: '',
      personal_email: '',
      bank_name: '',
      account_holder: '',
      account_no: '',
      ifsc: '',
      address_1: '',
      pincode: '',
      city: '',
      address_2: '',
      department: 'PPC',
      monthly_retainer_inr: 0,
      designation: '',
      approver_user_id: ''
    });
  };

  const toggleStatus = async (contractorId, field, currentValue) => {
    const newValue = currentValue === 'Signed' ? 'Not signed' : 
                     currentValue === 'Active' ? 'Terminated' : 
                     currentValue === 'Not signed' ? 'Signed' : 'Active';
    try {
      await api.patch(`/contractors/${contractorId}`, { [field]: newValue });
      loadContractors();
      toast.success('Status updated');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (contractorId, contractorName) => {
    if (window.confirm(`Are you sure you want to delete contractor "${contractorName}"? This action cannot be undone.`)) {
      try {
        await api.delete(`/contractors/${contractorId}`);
        toast.success('Contractor deleted successfully');
        loadContractors();
      } catch (error) {
        toast.error(error.response?.data?.detail || 'Failed to delete contractor');
      }
    }
  };

  return (
    <div data-testid="contractor-database">
      <div className="table-container">
        <div className="table-header">
          <h2>Contractor Database</h2>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <FilterSort
              onSortChange={setSortBy}
              onFilterChange={setFilterStatus}
              sortOptions={[
                { value: 'name_asc', label: 'Name (A-Z)' },
                { value: 'name_desc', label: 'Name (Z-A)' },
                { value: 'doj_desc', label: 'Date (Newest)' },
                { value: 'doj_asc', label: 'Date (Oldest)' }
              ]}
              filterOptions={[
                { value: 'Active', label: 'Active' },
                { value: 'Terminated', label: 'Terminated' }
              ]}
              currentSort={sortBy}
              currentFilter={filterStatus}
            />
            <button
              className="btn-success"
              onClick={() => { setEditMode(false); setShowModal(true); }}
              data-testid="add-contractor-button"
            >
              <Plus size={18} style={{ marginRight: '0.5rem', display: 'inline', verticalAlign: 'middle' }} />
              Add Contractor
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>S/No.</th>
                <th>DOJ</th>
                <th>Name</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Department</th>
                <th>Cost (INR)</th>
                <th>Sign Status</th>
                <th>Status</th>
                <th>Agreement Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {contractors.map((contractor, idx) => (
                <tr key={contractor.id} data-testid={`contractor-row-${contractor.id}`}>
                  <td>{idx + 1}</td>
                  <td>{contractor.doj}</td>
                  <td>{contractor.name}</td>
                  <td>{contractor.start_date}</td>
                  <td>{contractor.end_date}</td>
                  <td>{contractor.department}</td>
                  <td>₹{contractor.monthly_retainer_inr.toLocaleString()}</td>
                  <td>
                    <span
                      className={`status-badge ${contractor.sign_status === 'Signed' ? 'status-active' : 'status-pending'}`}
                      onClick={() => toggleStatus(contractor.id, 'sign_status', contractor.sign_status)}
                      style={{ cursor: 'pointer' }}
                      data-testid={`sign-status-${contractor.id}`}
                    >
                      {contractor.sign_status}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`status-badge ${contractor.status === 'Active' ? 'status-active' : 'status-inactive'}`}
                      onClick={() => toggleStatus(contractor.id, 'status', contractor.status)}
                      style={{ cursor: 'pointer' }}
                      data-testid={`contractor-status-${contractor.id}`}
                    >
                      {contractor.status}
                    </span>
                  </td>
                  <td>
                    <span className={`status-badge ${contractor.agreement_status === 'Live' ? 'status-active' : 'status-inactive'}`}>
                      {contractor.agreement_status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn-icon" 
                        onClick={() => handleEdit(contractor)}
                        data-testid={`edit-contractor-${contractor.id}`}
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        className="btn-icon" 
                        data-testid={`download-contractor-${contractor.id}`}
                        title="Download"
                      >
                        <Download size={16} />
                      </button>
                      <button 
                        className="btn-icon" 
                        onClick={() => handleDelete(contractor.id, contractor.name)}
                        data-testid={`delete-contractor-${contractor.id}`}
                        style={{ color: '#dc2626' }}
                        title="Delete"
                      >
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

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} data-testid="add-contractor-modal" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2>{editMode ? 'Edit Contractor' : 'Add New Contractor'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Name *</label>
                    <input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required data-testid="contractor-name-input" />
                  </div>
                  <div className="form-group">
                    <label>Date of Joining *</label>
                    <input type="date" value={formData.doj} onChange={(e) => setFormData({ ...formData, doj: e.target.value })} required data-testid="doj-input" />
                  </div>
                  <div className="form-group">
                    <label>Start Date *</label>
                    <input type="date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} required data-testid="start-date-input" />
                  </div>
                  <div className="form-group">
                    <label>Tenure (Months) *</label>
                    <input type="number" value={formData.tenure_months} onChange={(e) => setFormData({ ...formData, tenure_months: parseInt(e.target.value) })} required data-testid="tenure-input" />
                  </div>
                  <div className="form-group">
                    <label>Date of Birth *</label>
                    <input type="date" value={formData.dob} onChange={(e) => setFormData({ ...formData, dob: e.target.value })} required data-testid="dob-input" />
                  </div>
                  <div className="form-group">
                    <label>Mobile *</label>
                    <input type="tel" value={formData.mobile} onChange={(e) => setFormData({ ...formData, mobile: e.target.value })} required data-testid="mobile-input" />
                  </div>
                  <div className="form-group">
                    <label>Personal Email *</label>
                    <input type="email" value={formData.personal_email} onChange={(e) => setFormData({ ...formData, personal_email: e.target.value })} required data-testid="email-input" />
                  </div>
                  <div className="form-group">
                    <label>PAN *</label>
                    <input type="text" value={formData.pan} onChange={(e) => setFormData({ ...formData, pan: e.target.value })} required data-testid="pan-input" />
                  </div>
                  <div className="form-group">
                    <label>Aadhar *</label>
                    <input type="text" value={formData.aadhar} onChange={(e) => setFormData({ ...formData, aadhar: e.target.value })} required data-testid="aadhar-input" />
                  </div>
                  <div className="form-group">
                    <label>Bank Name *</label>
                    <input type="text" value={formData.bank_name} onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })} required data-testid="bank-name-input" />
                  </div>
                  <div className="form-group">
                    <label>Account Holder *</label>
                    <input type="text" value={formData.account_holder} onChange={(e) => setFormData({ ...formData, account_holder: e.target.value })} required data-testid="account-holder-input" />
                  </div>
                  <div className="form-group">
                    <label>Account No *</label>
                    <input type="text" value={formData.account_no} onChange={(e) => setFormData({ ...formData, account_no: e.target.value })} required data-testid="account-no-input" />
                  </div>
                  <div className="form-group">
                    <label>IFSC *</label>
                    <input type="text" value={formData.ifsc} onChange={(e) => setFormData({ ...formData, ifsc: e.target.value })} required data-testid="ifsc-input" />
                  </div>
                  <div className="form-group form-group-full">
                    <label>Address 1 *</label>
                    <input type="text" value={formData.address_1} onChange={(e) => setFormData({ ...formData, address_1: e.target.value })} required data-testid="address-1-input" />
                  </div>
                  <div className="form-group">
                    <label>Pincode *</label>
                    <input type="text" value={formData.pincode} onChange={(e) => setFormData({ ...formData, pincode: e.target.value })} required data-testid="pincode-input" />
                  </div>
                  <div className="form-group">
                    <label>City *</label>
                    <input type="text" value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} required data-testid="city-input" />
                  </div>
                  <div className="form-group">
                    <label>Department *</label>
                    <select value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })} data-testid="department-select">
                      <option value="PPC">PPC</option>
                      <option value="SEO">SEO</option>
                      <option value="Content">Content</option>
                      <option value="Business Development">Business Development</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Monthly Retainer (INR) *</label>
                    <input type="number" value={formData.monthly_retainer_inr} onChange={(e) => setFormData({ ...formData, monthly_retainer_inr: parseFloat(e.target.value) })} required data-testid="retainer-input" />
                  </div>
                  <div className="form-group">
                    <label>Designation *</label>
                    <input type="text" value={formData.designation} onChange={(e) => setFormData({ ...formData, designation: e.target.value })} required data-testid="designation-input" />
                  </div>
                  <div className="form-group">
                    <label>Approver (Director) *</label>
                    <select value={formData.approver_user_id} onChange={(e) => setFormData({ ...formData, approver_user_id: e.target.value })} required data-testid="approver-select">
                      <option value="">Select Approver</option>
                      {users.map(u => (
                        <option key={u.id} value={u.id}>{u.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" data-testid="save-contractor-button">
                  {editMode ? 'Update Contractor' : 'Save Contractor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
