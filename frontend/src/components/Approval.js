import { useState, useEffect } from 'react';
import { api } from '../App';
import { toast } from 'sonner';
import { CheckCircle, XCircle } from 'lucide-react';

export default function Approval({ user }) {
  const [approvals, setApprovals] = useState([]);
  const [clients, setClients] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);

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
    try {
      await api.post(`/approvals/${itemType}/${itemId}/request`);
      toast.success('Approval requested');
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to request approval');
    }
  };

  const handleApprovalAction = async (approvalId, action, notes = '') => {
    try {
      await api.post(`/approvals/${approvalId}/action`, { action, notes });
      toast.success(`Approval ${action === 'approve' ? 'approved' : 'rejected'}`);
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
                          >
                            <CheckCircle size={20} />
                          </button>
                          <button
                            className="btn-icon"
                            onClick={() => handleApprovalAction(approval.id, 'reject')}
                            style={{ color: '#dc2626' }}
                            data-testid={`reject-client-${client.id}`}
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
                          >
                            <CheckCircle size={20} />
                          </button>
                          <button
                            className="btn-icon"
                            onClick={() => handleApprovalAction(approval.id, 'reject')}
                            style={{ color: '#dc2626' }}
                            data-testid={`reject-contractor-${contractor.id}`}
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
                          >
                            <CheckCircle size={20} />
                          </button>
                          <button
                            className="btn-icon"
                            onClick={() => handleApprovalAction(approval.id, 'reject')}
                            style={{ color: '#dc2626' }}
                            data-testid={`reject-employee-${employee.id}`}
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
    </div>
  );
}
