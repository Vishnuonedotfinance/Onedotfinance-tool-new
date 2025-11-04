import { useState, useEffect, useRef } from 'react';
import { api } from '../App';
import { toast } from 'sonner';
import { Plus, Edit, Download, Trash2, Upload, FileDown } from 'lucide-react';
import FilterSort from './FilterSort';

export default function EmployeeDatabase({ user }) {
  const [employees, setEmployees] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const [sortBy, setSortBy] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    doj: '',
    work_email: '',
    emp_id: '',
    first_name: '',
    last_name: '',
    father_name: '',
    dob: '',
    gender: 'Male',
    mobile: '',
    personal_email: '',
    pan: '',
    aadhar: '',
    uan: '',
    pf_account_no: '',
    bank_name: '',
    account_no: '',
    ifsc: '',
    branch: '',
    address: '',
    pincode: '',
    city: '',
    monthly_gross_inr: 0,
    department: 'PPC',
    projects: [],
    approver_user_id: ''
  });
  const [availableClients, setAvailableClients] = useState([]);
  const [filterDepartment, setFilterDepartment] = useState('');

  useEffect(() => {
    loadEmployees();
    loadUsers();
  }, [sortBy, filterStatus, filterDepartment]);

  useEffect(() => {
    if (formData.department) {
      loadAvailableClients(formData.department);
    }
  }, [formData.department]);

  const loadEmployees = async () => {
    try {
      let url = '/employees';
      const params = [];
      if (sortBy) params.push(`sort_by=${sortBy.split('_')[0]}&sort_order=${sortBy.split('_')[1] || 'asc'}`);
      if (filterStatus) params.push(`filter_status=${filterStatus}`);
      if (filterDepartment) params.push(`filter_department=${filterDepartment}`);
      if (params.length > 0) url += '?' + params.join('&');
      
      const response = await api.get(url);
      setEmployees(response.data);
    } catch (error) {
      toast.error('Failed to load employees');
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

  const loadAvailableClients = async (department) => {
    try {
      const response = await api.get(`/clients/active-by-department?department=${department}`);
      setAvailableClients(response.data);
    } catch (error) {
      console.error('Failed to load clients');
      setAvailableClients([]);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await api.patch(`/employees/${editId}`, formData);
        toast.success('Employee updated successfully');
      } else {
        await api.post('/employees', formData);
        toast.success('Employee added successfully');
      }
      setShowModal(false);
      setEditMode(false);
      setEditId(null);
      resetForm();
      loadEmployees();
    } catch (error) {
      toast.error(error.response?.data?.detail || `Failed to ${editMode ? 'update' : 'add'} employee`);
    }
  };

  const handleEdit = (employee) => {
    setFormData({
      doj: employee.doj,
      work_email: employee.work_email,
      emp_id: employee.emp_id,
      first_name: employee.first_name,
      last_name: employee.last_name,
      father_name: employee.father_name,
      dob: employee.dob,
      gender: employee.gender || 'Male',
      mobile: employee.mobile,
      personal_email: employee.personal_email,
      pan: employee.pan,
      aadhar: employee.aadhar,
      uan: employee.uan,
      pf_account_no: employee.pf_account_no,
      bank_name: employee.bank_name,
      account_no: employee.account_no,
      ifsc: employee.ifsc,
      branch: employee.branch,
      address: employee.address,
      pincode: employee.pincode,
      city: employee.city,
      monthly_gross_inr: employee.monthly_gross_inr,
      department: employee.department,
      projects: employee.projects || [],
      approver_user_id: employee.approver_user_id
    });
    setEditId(employee.id);
    setEditMode(true);
    setShowModal(true);
  };

  const resetForm = () => {
    setFormData({
      doj: '',
      work_email: '',
      emp_id: '',
      first_name: '',
      last_name: '',
      father_name: '',
      dob: '',
      gender: 'Male',
      mobile: '',
      personal_email: '',
      pan: '',
      aadhar: '',
      uan: '',
      pf_account_no: '',
      bank_name: '',
      account_no: '',
      ifsc: '',
      branch: '',
      address: '',
      pincode: '',
      city: '',
      monthly_gross_inr: 0,
      department: 'PPC',
      projects: [],
      approver_user_id: ''
    });
  };

  const toggleStatus = async (employeeId, currentStatus) => {
    const newStatus = currentStatus === 'Active' ? 'Terminated' : 'Active';
    try {
      await api.patch(`/employees/${employeeId}`, { status: newStatus });
      loadEmployees();
      toast.success('Status updated');
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (employeeId, employeeName) => {
    if (window.confirm(`Are you sure you want to delete employee "${employeeName}"? This action cannot be undone.`)) {
      try {
        await api.delete(`/employees/${employeeId}`);
        toast.success('Employee deleted successfully');
        loadEmployees();
      } catch (error) {
        toast.error(error.response?.data?.detail || 'Failed to delete employee');
      }
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.get('/employees/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'employees_export.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Employees exported successfully');
    } catch (error) {
      toast.error('Failed to export employees');
    }
  };

  const handleDownloadSample = async () => {
    try {
      const response = await api.get('/employees/sample', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'employee_sample.xlsx');
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
      const response = await api.post('/employees/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success(response.data.message);
      if (response.data.errors && response.data.errors.length > 0) {
        console.log('Import errors:', response.data.errors);
        toast.warning(`${response.data.errors.length} rows had errors. Check console for details.`);
      }
      loadEmployees();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to import employees');
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div data-testid="employee-database">
      <div className="table-container">
        <div className="table-header">
          <h2>Employee Database <span style={{ fontSize: '0.9rem', color: '#6b7280' }}>(Total: {employees.length})</span></h2>
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Department Filter */}
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #e5e7eb' }}
              data-testid="department-filter"
            >
              <option value="">All Departments</option>
              <option value="PPC">PPC</option>
              <option value="SEO">SEO</option>
              <option value="Content">Content</option>
              <option value="Backlink">Backlink</option>
              <option value="Business Development">Business Development</option>
              <option value="Others">Others</option>
            </select>
            <FilterSort
              onSortChange={setSortBy}
              onFilterChange={setFilterStatus}
              sortOptions={[
                { value: 'first_name_asc', label: 'Name (A-Z)' },
                { value: 'first_name_desc', label: 'Name (Z-A)' },
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
              data-testid="import-employees-button"
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
            />
            <button
              className="btn-secondary"
              onClick={handleExport}
              data-testid="export-employees-button"
              title="Export to Excel"
            >
              <Download size={18} style={{ marginRight: '0.5rem', display: 'inline', verticalAlign: 'middle' }} />
              Export
            </button>
            <button
              className="btn-success"
              onClick={() => { setEditMode(false); setShowModal(true); }}
              data-testid="add-employee-button"
            >
              <Plus size={18} style={{ marginRight: '0.5rem', display: 'inline', verticalAlign: 'middle' }} />
              Add Employee
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>S/No.</th>
                <th>Name</th>
                <th>Employee ID</th>
                <th>Mobile</th>
                <th>Email</th>
                <th>Department</th>
                <th>Monthly Salary (INR)</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee, idx) => (
                <tr key={employee.id} data-testid={`employee-row-${employee.id}`}>
                  <td>{idx + 1}</td>
                  <td>{employee.first_name} {employee.last_name}</td>
                  <td>{employee.emp_id}</td>
                  <td>{employee.mobile}</td>
                  <td>{employee.work_email}</td>
                  <td>{employee.department}</td>
                  <td>₹{employee.monthly_gross_inr.toLocaleString()}</td>
                  <td>
                    <span
                      className={`status-badge ${employee.status === 'Active' ? 'status-active' : 'status-inactive'}`}
                      onClick={() => toggleStatus(employee.id, employee.status)}
                      style={{ cursor: 'pointer' }}
                      data-testid={`employee-status-${employee.id}`}
                    >
                      {employee.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn-icon"
                        onClick={() => handleEdit(employee)}
                        data-testid={`view-employee-${employee.id}`}
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        className="btn-icon" 
                        data-testid={`download-employee-${employee.id}`}
                        title="Download"
                      >
                        <Download size={16} />
                      </button>
                      <button 
                        className="btn-icon" 
                        onClick={() => handleDelete(employee.id, `${employee.first_name} ${employee.last_name}`)}
                        data-testid={`delete-employee-${employee.id}`}
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
          <div className="modal-content" onClick={(e) => e.stopPropagation()} data-testid="add-employee-modal" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="modal-header">
              <h2>{editMode ? 'Edit Employee' : 'Add New Employee'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Date of Joining *</label>
                    <input
                      type="date"
                      value={formData.doj}
                      onChange={(e) => setFormData({ ...formData, doj: e.target.value })}
                      required
                      data-testid="doj-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Employee ID *</label>
                    <input
                      type="text"
                      value={formData.emp_id}
                      onChange={(e) => setFormData({ ...formData, emp_id: e.target.value })}
                      required
                      data-testid="emp-id-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>First Name *</label>
                    <input
                      type="text"
                      value={formData.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      required
                      data-testid="first-name-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Last Name *</label>
                    <input
                      type="text"
                      value={formData.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      required
                      data-testid="last-name-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Father's Name *</label>
                    <input
                      type="text"
                      value={formData.father_name}
                      onChange={(e) => setFormData({ ...formData, father_name: e.target.value })}
                      required
                      data-testid="father-name-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Date of Birth *</label>
                    <input
                      type="date"
                      value={formData.dob}
                      onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                      required
                      data-testid="dob-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Mobile *</label>
                    <input
                      type="tel"
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      required
                      data-testid="mobile-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Work Email *</label>
                    <input
                      type="email"
                      value={formData.work_email}
                      onChange={(e) => setFormData({ ...formData, work_email: e.target.value })}
                      required
                      data-testid="work-email-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Personal Email *</label>
                    <input
                      type="email"
                      value={formData.personal_email}
                      onChange={(e) => setFormData({ ...formData, personal_email: e.target.value })}
                      required
                      data-testid="personal-email-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>PAN *</label>
                    <input
                      type="text"
                      value={formData.pan}
                      onChange={(e) => setFormData({ ...formData, pan: e.target.value })}
                      required
                      data-testid="pan-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Aadhar *</label>
                    <input
                      type="text"
                      value={formData.aadhar}
                      onChange={(e) => setFormData({ ...formData, aadhar: e.target.value })}
                      required
                      data-testid="aadhar-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>UAN *</label>
                    <input
                      type="text"
                      value={formData.uan}
                      onChange={(e) => setFormData({ ...formData, uan: e.target.value })}
                      required
                      data-testid="uan-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>PF Account No *</label>
                    <input
                      type="text"
                      value={formData.pf_account_no}
                      onChange={(e) => setFormData({ ...formData, pf_account_no: e.target.value })}
                      required
                      data-testid="pf-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Bank Name *</label>
                    <input
                      type="text"
                      value={formData.bank_name}
                      onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                      required
                      data-testid="bank-name-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Account No *</label>
                    <input
                      type="text"
                      value={formData.account_no}
                      onChange={(e) => setFormData({ ...formData, account_no: e.target.value })}
                      required
                      data-testid="account-no-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>IFSC *</label>
                    <input
                      type="text"
                      value={formData.ifsc}
                      onChange={(e) => setFormData({ ...formData, ifsc: e.target.value })}
                      required
                      data-testid="ifsc-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Branch *</label>
                    <input
                      type="text"
                      value={formData.branch}
                      onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                      required
                      data-testid="branch-input"
                    />
                  </div>
                  <div className="form-group form-group-full">
                    <label>Address *</label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                      required
                      data-testid="address-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Pincode *</label>
                    <input
                      type="text"
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                      required
                      data-testid="pincode-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>City *</label>
                    <input
                      type="text"
                      value={formData.city}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      required
                      data-testid="city-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Department *</label>
                    <select
                      value={formData.department}
                      onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                      data-testid="department-select"
                    >
                      <option value="PPC">PPC</option>
                      <option value="SEO">SEO</option>
                      <option value="Content">Content</option>
                      <option value="Business Development">Business Development</option>
                      <option value="Others">Others</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Monthly Gross (INR) *</label>
                    <input
                      type="number"
                      value={formData.monthly_gross_inr}
                      onChange={(e) => setFormData({ ...formData, monthly_gross_inr: parseFloat(e.target.value) })}
                      required
                      data-testid="salary-input"
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
                <button type="submit" className="btn-primary" data-testid="save-employee-button">
                  {editMode ? 'Update Employee' : 'Save Employee'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
