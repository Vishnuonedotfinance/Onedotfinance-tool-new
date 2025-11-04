import { useState, useEffect } from 'react';
import { api } from '../App';
import { toast } from 'sonner';
import { Download } from 'lucide-react';

export default function Reports() {
  const [activeTab, setActiveTab] = useState('dept-pl');
  const [clients, setClients] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [contractors, setContractors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clientProfitDeptFilter, setClientProfitDeptFilter] = useState('');
  const [resourceUtilDeptFilter, setResourceUtilDeptFilter] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [clientsRes, employeesRes, contractorsRes] = await Promise.all([
        api.get('/clients'),
        api.get('/employees'),
        api.get('/contractors')
      ]);
      setClients(clientsRes.data.filter(c => c.client_status === 'Active'));
      setEmployees(employeesRes.data.filter(e => e.status === 'Active'));
      setContractors(contractorsRes.data.filter(c => c.status === 'Active'));
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // Department-wise P&L
  const calculateDeptPL = () => {
    const departments = ['PPC', 'SEO', 'Content', 'Backlink'];
    return departments.map(dept => {
      const deptClients = clients.filter(c => c.service === dept);
      const deptEmployees = employees.filter(e => e.department === dept);
      const deptContractors = contractors.filter(c => c.department === dept);
      
      const revenue = deptClients.reduce((sum, c) => sum + (c.amount_inr || 0), 0);
      const employeeCost = deptEmployees.reduce((sum, e) => sum + (e.monthly_gross_inr || 0), 0);
      const contractorCost = deptContractors.reduce((sum, c) => sum + (c.monthly_retainer_inr || 0), 0);
      
      const profit = revenue - employeeCost - contractorCost;
      const profitPercent = revenue > 0 ? ((profit / revenue) * 100).toFixed(2) : 0;

      return {
        department: dept,
        clientCount: deptClients.length,
        resourceCount: deptEmployees.length + deptContractors.length,
        revenue,
        employeeCost,
        contractorCost,
        totalCost: employeeCost + contractorCost,
        profit,
        profitPercent
      };
    });
  };

  // Client-level Profitability
  const calculateClientProfitability = () => {
    let filteredClients = clients;
    if (clientProfitDeptFilter) {
      filteredClients = clients.filter(c => c.service === clientProfitDeptFilter);
    }
    
    return filteredClients.map(client => {
      // Get resources working on this client
      const clientEmployees = employees.filter(e => 
        e.projects && e.projects.includes(client.id)
      );
      const clientContractors = contractors.filter(c => 
        c.projects && c.projects.includes(client.id)
      );

      // Calculate split costs
      const resources = [];
      let totalCost = 0;

      clientEmployees.forEach(emp => {
        const projectCount = emp.projects?.length || 1;
        const cost = (emp.monthly_gross_inr || 0) / projectCount;
        resources.push({ name: emp.first_name + ' ' + emp.last_name, cost, type: 'Employee' });
        totalCost += cost;
      });

      clientContractors.forEach(con => {
        const projectCount = con.projects?.length || 1;
        const cost = (con.monthly_retainer_inr || 0) / projectCount;
        resources.push({ name: con.name, cost, type: 'Contractor' });
        totalCost += cost;
      });

      const revenue = client.amount_inr || 0;
      const profit = revenue - totalCost;
      const profitPercent = revenue > 0 ? ((profit / revenue) * 100).toFixed(2) : 0;

      return {
        client_name: client.client_name,
        department: client.service,
        revenue,
        resources,
        totalCost,
        profit,
        profitPercent
      };
    });
  };

  // Resource Utilization
  const calculateResourceUtilization = () => {
    let allResources = [];

    employees.forEach(emp => {
      const projectCount = emp.projects?.length || 0;
      allResources.push({
        name: emp.first_name + ' ' + emp.last_name,
        type: 'Employee',
        department: emp.department,
        cost: emp.monthly_gross_inr || 0,
        projectCount,
        perClientCost: projectCount > 0 ? (emp.monthly_gross_inr || 0) / projectCount : 0
      });
    });

    contractors.forEach(con => {
      const projectCount = con.projects?.length || 0;
      allResources.push({
        name: con.name,
        type: 'Contractor',
        department: con.department,
        cost: con.monthly_retainer_inr || 0,
        projectCount,
        perClientCost: projectCount > 0 ? (con.monthly_retainer_inr || 0) / projectCount : 0
      });
    });

    if (resourceUtilDeptFilter) {
      allResources = allResources.filter(r => r.department === resourceUtilDeptFilter);
    }

    return allResources;
  };

  const downloadClientProfitability = () => {
    const data = calculateClientProfitability();
    const csvContent = [
      ['S/No', 'Client Name', 'Department', 'Revenue', 'Resource 1/Cost', 'Resource 2/Cost', 'Resource 3/Cost', 'Resource 4/Cost', 'Total Cost', 'Profit'],
      ...data.map((item, idx) => [
        idx + 1,
        item.client_name,
        item.department,
        item.revenue,
        item.resources[0] ? `${item.resources[0].name}/₹${item.resources[0].cost.toFixed(0)}` : '',
        item.resources[1] ? `${item.resources[1].name}/₹${item.resources[1].cost.toFixed(0)}` : '',
        item.resources[2] ? `${item.resources[2].name}/₹${item.resources[2].cost.toFixed(0)}` : '',
        item.resources[3] ? `${item.resources[3].name}/₹${item.resources[3].cost.toFixed(0)}` : '',
        item.totalCost,
        item.profit
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'client_profitability.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success('Report downloaded');
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Reports</h1>
        <p>Financial analytics and insights</p>
      </div>

      <div className="table-container">
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '2px solid #e5e7eb' }}>
          <button
            onClick={() => setActiveTab('dept-pl')}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'dept-pl' ? '3px solid #4F46E5' : 'none',
              color: activeTab === 'dept-pl' ? '#4F46E5' : '#6b7280',
              fontWeight: activeTab === 'dept-pl' ? '600' : '400',
              cursor: 'pointer'
            }}
          >
            Department P&L
          </button>
          <button
            onClick={() => setActiveTab('client-profit')}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'client-profit' ? '3px solid #4F46E5' : 'none',
              color: activeTab === 'client-profit' ? '#4F46E5' : '#6b7280',
              fontWeight: activeTab === 'client-profit' ? '600' : '400',
              cursor: 'pointer'
            }}
          >
            Client Profitability
          </button>
          <button
            onClick={() => setActiveTab('resource-util')}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'resource-util' ? '3px solid #4F46E5' : 'none',
              color: activeTab === 'resource-util' ? '#4F46E5' : '#6b7280',
              fontWeight: activeTab === 'resource-util' ? '600' : '400',
              cursor: 'pointer'
            }}
          >
            Resource Utilization
          </button>
        </div>

        {/* Department P&L */}
        {activeTab === 'dept-pl' && (
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Client Count</th>
                  <th>Resource Count</th>
                  <th>Revenue</th>
                  <th>Employee Cost</th>
                  <th>Contractor Cost</th>
                  <th>Total Cost</th>
                  <th>Profit</th>
                  <th>Profit %</th>
                </tr>
              </thead>
              <tbody>
                {calculateDeptPL().map(row => (
                  <tr key={row.department}>
                    <td><strong>{row.department}</strong></td>
                    <td>{row.clientCount}</td>
                    <td>{row.resourceCount}</td>
                    <td>₹{row.revenue.toLocaleString()}</td>
                    <td>₹{row.employeeCost.toLocaleString()}</td>
                    <td>₹{row.contractorCost.toLocaleString()}</td>
                    <td>₹{row.totalCost.toLocaleString()}</td>
                    <td style={{ color: row.profit >= 0 ? '#10b981' : '#ef4444', fontWeight: '600' }}>
                      ₹{row.profit.toLocaleString()}
                    </td>
                    <td style={{ color: row.profitPercent >= 0 ? '#10b981' : '#ef4444', fontWeight: '600' }}>
                      {row.profitPercent}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Client Profitability */}
        {activeTab === 'client-profit' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <select
                value={clientProfitDeptFilter}
                onChange={(e) => setClientProfitDeptFilter(e.target.value)}
                style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #e5e7eb' }}
              >
                <option value="">All Departments</option>
                <option value="PPC">PPC</option>
                <option value="SEO">SEO</option>
                <option value="Content">Content</option>
                <option value="Backlink">Backlink</option>
              </select>
              <button className="btn-secondary" onClick={downloadClientProfitability}>
                <Download size={18} style={{ marginRight: '0.5rem', display: 'inline', verticalAlign: 'middle' }} />
                Download Excel
              </button>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>S/No</th>
                    <th>Client Name</th>
                    <th>Department</th>
                    <th>Revenue</th>
                    <th>Resources</th>
                    <th>Total Cost</th>
                    <th>Profit</th>
                    <th>Profit %</th>
                  </tr>
                </thead>
                <tbody>
                  {calculateClientProfitability().map((row, idx) => (
                    <tr key={row.client_name}>
                      <td>{idx + 1}</td>
                      <td>{row.client_name}</td>
                      <td>{row.department}</td>
                      <td>₹{row.revenue.toLocaleString()}</td>
                      <td>
                        <div style={{ fontSize: '0.875rem' }}>
                          {row.resources.map((res, i) => (
                            <div key={i}>
                              {res.name} ({res.type}): ₹{res.cost.toFixed(0)}
                            </div>
                          ))}
                          {row.resources.length === 0 && <span style={{ color: '#6b7280' }}>No resources assigned</span>}
                        </div>
                      </td>
                      <td>₹{row.totalCost.toFixed(0)}</td>
                      <td style={{ color: row.profit >= 0 ? '#10b981' : '#ef4444', fontWeight: '600' }}>
                        ₹{row.profit.toFixed(0)}
                      </td>
                      <td style={{ color: row.profitPercent >= 0 ? '#10b981' : '#ef4444', fontWeight: '600' }}>
                        {row.profitPercent}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Resource Utilization */}
        {activeTab === 'resource-util' && (
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <select
                value={resourceUtilDeptFilter}
                onChange={(e) => setResourceUtilDeptFilter(e.target.value)}
                style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid #e5e7eb' }}
              >
                <option value="">All Departments</option>
                <option value="PPC">PPC</option>
                <option value="SEO">SEO</option>
                <option value="Content">Content</option>
                <option value="Backlink">Backlink</option>
                <option value="Business Development">Business Development</option>
                <option value="Others">Others</option>
              </select>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table>
                <thead>
                  <tr>
                    <th>S/No</th>
                    <th>Resource Name</th>
                    <th>Type</th>
                    <th>Department</th>
                    <th>Cost (Monthly)</th>
                    <th>Projects Count</th>
                    <th>Per Client Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {calculateResourceUtilization().map((row, idx) => (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td>{row.name}</td>
                      <td>
                        <span className={`status-badge ${row.type === 'Employee' ? 'status-active' : 'status-pending'}`}>
                          {row.type}
                        </span>
                      </td>
                      <td>{row.department}</td>
                      <td>₹{row.cost.toLocaleString()}</td>
                      <td>{row.projectCount}</td>
                      <td>₹{row.perClientCost.toFixed(0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
