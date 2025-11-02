import { useState, useEffect } from 'react';
import { api } from '../App';
import { toast } from 'sonner';
import { CheckCircle, XCircle, PauseCircle } from 'lucide-react';

export default function Approval({ user }) {
  const [approvals, setApprovals] = useState([]);
  const [clients, setClients] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRemarkModal, setShowRemarkModal] = useState(false);
  const [remarkType, setRemarkType] = useState(''); // 'request' or 'action'
  const [selectedItem, setSelectedItem] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [actionType, setActionType] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [approvalsRes, clientsRes, contractorsRes, employeesRes] = await Promise.all([
        api.get('/approvals'),
        api.get('/clients'),
        api.get('/contractors'),
        api.get('/employees')
      ]);
      
      setApprovals(approvalsRes.data);
      setClients(clientsRes.data.filter(c => c.client_status === 'Active'));
      setContractors(contractorsRes.data.filter(c => c.status === 'Active'));
      setEmployees(employeesRes.data.filter(e => e.status === 'Active'));
    } catch (error) {
      toast.error('Failed to load approval data');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestApproval = async (itemType, itemId) => {
    setSelectedItem({ itemType, itemId });
    setRemarkType('request');
    setShowRemarkModal(true);
  };

  const submitRequestApproval = async () => {
    try {
      await api.post(`/approvals/${selectedItem.itemType}/${selectedItem.itemId}/request`, {
        staff_remarks: remarks
      });
      toast.success('Approval requested');
      setShowRemarkModal(false);
      setRemarks('');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to request approval');
    }
  };

  const handleApprovalAction = async (approvalId, action) => {
    setSelectedItem({ approvalId });
    setActionType(action);
    setRemarkType('action');
    setShowRemarkModal(true);
  };

  const submitApprovalAction = async () => {
    try {
      await api.post(`/approvals/${selectedItem.approvalId}/action`, { 
        action: actionType, 
        notes: remarks 
      });
      toast.success(`Approval ${actionType === 'approve' ? 'approved' : actionType === 'reject' ? 'rejected' : 'held'}`);
      setShowRemarkModal(false);
      setRemarks('');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to process approval');
    }
  };

  const getApprovalForItem = (itemType, itemId) => {
    return approvals.find(a => a.item_type === itemType && a.item_id === itemId);
  };

  const canRequestApproval = user.role === 'Staff';
  const canApprove = user.role === 'Director';

  return (
    <div data-testid="approval-page">
      <div className="page-header">
        <h1>Approval Management</h1>
        <p>Manage approval requests for clients, contractors, and employees</p>
      </div>

      {/* Client Items */}
      <div className="table-container" style={{ marginBottom: '2rem' }}>
        <div className="table-header">
          <h2>Client Items</h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Service</th>
                <th>Amount (INR)</th>
                <th>Approval Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {clients.map(client => {
                const approval = getApprovalForItem('client', client.id);
                return (
                  <tr key={client.id} data-testid={`approval-client-${client.id}`}>
                    <td>{client.client_name}</td>
                    <td>{client.service}</td>
                    <td>₹{client.amount_inr.toLocaleString()}</td>
                    <td>
                      {approval ? (
                        <span className={`status-badge ${
                          approval.status === 'Approved' ? 'status-active' :
                          approval.status === 'Rejected' ? 'status-inactive' :
                          approval.status === 'Hold' ? 'status-pending' :
                          'status-pending'
                        }`}>
                          {approval.status}
                        </span>
                      ) : (
                        <span className="status-badge status-inactive">Not Requested</span>
                      )}
                    </td>
                    <td>
                      {!approval && canRequestApproval && (
                        <button
                          className="btn-secondary"
                          onClick={() => handleRequestApproval('client', client.id)}
                          data-testid={`request-approval-client-${client.id}`}
                        >
                          Request Approval
                        </button>
                      )}
                      {approval && approval.status === 'Requested' && canApprove && (
                        <div className="action-buttons">
                          <button
                            className="btn-icon"
                            onClick={() => handleApprovalAction(approval.id, 'approve')}
                            style={{ color: '#10b981' }}
                            data-testid={`approve-client-${client.id}`}
                            title="Approve"
                          >
                            <CheckCircle size={20} />
                          </button>
                          <button
                            className="btn-icon"
                            onClick={() => handleApprovalAction(approval.id, 'hold')}
                            style={{ color: '#f59e0b' }}
                            data-testid={`hold-client-${client.id}`}
                            title="Hold"
                          >
                            <PauseCircle size={20} />
                          </button>
                          <button
                            className="btn-icon"
                            onClick={() => handleApprovalAction(approval.id, 'reject')}
                            style={{ color: '#dc2626' }}
                            data-testid={`reject-client-${client.id}`}
                            title="Reject"
                          >
                            <XCircle size={20} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Contractor Items */}
      <div className="table-container" style={{ marginBottom: '2rem' }}>
        <div className="table-header">
          <h2>Contractor Items</h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Department</th>
                <th>Amount (INR)</th>
                <th>Approval Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {contractors.map(contractor => {
                const approval = getApprovalForItem('contractor', contractor.id);
                return (
                  <tr key={contractor.id} data-testid={`approval-contractor-${contractor.id}`}>
                    <td>{contractor.name}</td>
                    <td>{contractor.department}</td>
                    <td>₹{contractor.monthly_retainer_inr.toLocaleString()}</td>
                    <td>
                      {approval ? (
                        <span className={`status-badge ${
                          approval.status === 'Approved' ? 'status-active' :
                          approval.status === 'Rejected' ? 'status-inactive' :
                          approval.status === 'Hold' ? 'status-pending' :
                          'status-pending'
                        }`}>
                          {approval.status}
                        </span>
                      ) : (
                        <span className="status-badge status-inactive">Not Requested</span>
                      )}
                    </td>
                    <td>
                      {!approval && canRequestApproval && (
                        <button
                          className="btn-secondary"
                          onClick={() => handleRequestApproval('contractor', contractor.id)}
                          data-testid={`request-approval-contractor-${contractor.id}`}
                        >
                          Request Approval
                        </button>
                      )}
                      {approval && approval.status === 'Requested' && canApprove && (
                        <div className="action-buttons">
                          <button
                            className="btn-icon"
                            onClick={() => handleApprovalAction(approval.id, 'approve')}
                            style={{ color: '#10b981' }}
                            data-testid={`approve-contractor-${contractor.id}`}
                            title="Approve"
                          >
                            <CheckCircle size={20} />
                          </button>
                          <button
                            className="btn-icon"
                            onClick={() => handleApprovalAction(approval.id, 'hold')}
                            style={{ color: '#f59e0b' }}
                            data-testid={`hold-contractor-${contractor.id}`}
                            title="Hold"
                          >
                            <PauseCircle size={20} />
                          </button>
                          <button
                            className="btn-icon"
                            onClick={() => handleApprovalAction(approval.id, 'reject')}
                            style={{ color: '#dc2626' }}
                            data-testid={`reject-contractor-${contractor.id}`}
                            title="Reject"
                          >
                            <XCircle size={20} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Employee Items */}
      <div className="table-container">
        <div className="table-header">
          <h2>Employee Items</h2>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>Name</th>
                <th>Department</th>
                <th>Amount (INR)</th>
                <th>Approval Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(employee => {
                const approval = getApprovalForItem('employee', employee.id);
                return (
                  <tr key={employee.id} data-testid={`approval-employee-${employee.id}`}>
                    <td>{employee.first_name} {employee.last_name}</td>
                    <td>{employee.department}</td>
                    <td>₹{employee.monthly_gross_inr.toLocaleString()}</td>
                    <td>
                      {approval ? (
                        <span className={`status-badge ${
                          approval.status === 'Approved' ? 'status-active' :
                          approval.status === 'Rejected' ? 'status-inactive' :
                          approval.status === 'Hold' ? 'status-pending' :
                          'status-pending'
                        }`}>
                          {approval.status}
                        </span>
                      ) : (
                        <span className="status-badge status-inactive">Not Requested</span>
                      )}
                    </td>
                    <td>
                      {!approval && canRequestApproval && (
                        <button
                          className="btn-secondary"
                          onClick={() => handleRequestApproval('employee', employee.id)}
                          data-testid={`request-approval-employee-${employee.id}`}
                        >
                          Request Approval
                        </button>
                      )}
                      {approval && approval.status === 'Requested' && canApprove && (
                        <div className="action-buttons">
                          <button
                            className="btn-icon"
                            onClick={() => handleApprovalAction(approval.id, 'approve')}
                            style={{ color: '#10b981' }}
                            data-testid={`approve-employee-${employee.id}`}
                            title="Approve"
                          >
                            <CheckCircle size={20} />
                          </button>
                          <button
                            className="btn-icon"
                            onClick={() => handleApprovalAction(approval.id, 'hold')}
                            style={{ color: '#f59e0b' }}
                            data-testid={`hold-employee-${employee.id}`}
                            title="Hold"
                          >
                            <PauseCircle size={20} />
                          </button>
                          <button
                            className="btn-icon"
                            onClick={() => handleApprovalAction(approval.id, 'reject')}
                            style={{ color: '#dc2626' }}
                            data-testid={`reject-employee-${employee.id}`}
                            title="Reject"
                          >
                            <XCircle size={20} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Remarks Modal */}
      {showRemarkModal && (
        <div className="modal-overlay" onClick={() => setShowRemarkModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} data-testid="remark-modal">
            <div className="modal-header">
              <h2>{remarkType === 'request' ? 'Add Remarks (Optional)' : 'Add Notes'}</h2>
              <button className="modal-close" onClick={() => setShowRemarkModal(false)}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>{remarkType === 'request' ? 'Staff Remarks' : 'Director Notes'}</label>
                <textarea
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder="Enter remarks or notes..."
                  data-testid="remarks-textarea"
                  rows="5"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button 
                type="button" 
                className="btn-secondary" 
                onClick={() => setShowRemarkModal(false)}
              >
                Cancel
              </button>
              <button 
                type="button" 
                className="btn-primary" 
                onClick={remarkType === 'request' ? submitRequestApproval : submitApprovalAction}
                data-testid="submit-remarks-button"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
