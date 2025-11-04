import { useState, useEffect, useRef } from 'react';
import { api } from '../App';
import { toast } from 'sonner';
import { Plus, Edit, Trash2, Download, Upload, FileDown } from 'lucide-react';

export default function AssetTracker() {
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editId, setEditId] = useState(null);
  const fileInputRef = useRef(null);
  const [formData, setFormData] = useState({
    asset_type: '',
    model: '',
    serial_number: '',
    purchase_date: '',
    vendor: '',
    value_ex_gst: 0,
    warranty_period_months: 12,
    alloted_to: '',
    email: '',
    department: 'PPC'
  });

  useEffect(() => {
    loadAssets();
  }, []);

  const loadAssets = async () => {
    try {
      const response = await api.get('/assets');
      setAssets(response.data);
    } catch (error) {
      toast.error('Failed to load assets');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await api.patch(`/assets/${editId}`, formData);
        toast.success('Asset updated successfully');
      } else {
        await api.post('/assets', formData);
        toast.success('Asset added successfully');
      }
      setShowModal(false);
      setEditMode(false);
      setEditId(null);
      resetForm();
      loadAssets();
    } catch (error) {
      toast.error(error.response?.data?.detail || `Failed to ${editMode ? 'update' : 'add'} asset`);
    }
  };

  const handleEdit = (asset) => {
    setFormData({
      asset_type: asset.asset_type,
      model: asset.model,
      serial_number: asset.serial_number,
      purchase_date: asset.purchase_date,
      vendor: asset.vendor,
      value_ex_gst: asset.value_ex_gst,
      warranty_period_months: asset.warranty_period_months,
      alloted_to: asset.alloted_to,
      email: asset.email,
      department: asset.department
    });
    setEditId(asset.id);
    setEditMode(true);
    setShowModal(true);
  };

  const handleDelete = async (assetId, assetType) => {
    if (window.confirm(`Are you sure you want to delete asset "${assetType}"? This action cannot be undone.`)) {
      try {
        await api.delete(`/assets/${assetId}`);
        toast.success('Asset deleted successfully');
        loadAssets();
      } catch (error) {
        toast.error(error.response?.data?.detail || 'Failed to delete asset');
      }
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.get('/assets/export', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'assets_export.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Assets exported successfully');
    } catch (error) {
      toast.error('Failed to export assets');
    }
  };

  const handleDownloadSample = async () => {
    try {
      const response = await api.get('/assets/sample', { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'asset_sample.xlsx');
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
      const response = await api.post('/assets/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      toast.success(response.data.message);
      if (response.data.errors && response.data.errors.length > 0) {
        console.log('Import errors:', response.data.errors);
        toast.warning(`${response.data.errors.length} rows had errors. Check console for details.`);
      }
      loadAssets();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to import assets');
    }
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const resetForm = () => {
    setFormData({
      asset_type: '',
      model: '',
      serial_number: '',
      purchase_date: '',
      vendor: '',
      value_ex_gst: 0,
      warranty_period_months: 12,
      alloted_to: '',
      email: '',
      department: 'PPC'
    });
  };

  return (
    <div data-testid="asset-tracker">
      <div className="page-header">
        <h1>Asset Tracker</h1>
        <p>Manage company assets and track warranties</p>
      </div>

      <div className="table-container">
        <div className="table-header">
          <h2>Asset Master List</h2>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              className="btn-secondary"
              onClick={handleExport}
              data-testid="export-assets-button"
            >
              <Download size={18} style={{ marginRight: '0.5rem', display: 'inline', verticalAlign: 'middle' }} />
              Export to Excel
            </button>
            <button
              className="btn-success"
              onClick={() => { setEditMode(false); resetForm(); setShowModal(true); }}
              data-testid="add-asset-button"
            >
              <Plus size={18} style={{ marginRight: '0.5rem', display: 'inline', verticalAlign: 'middle' }} />
              New Asset
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table>
            <thead>
              <tr>
                <th>S/No.</th>
                <th>Asset Type</th>
                <th>Model</th>
                <th>Serial Number</th>
                <th>Purchase Date</th>
                <th>Value (ex. GST)</th>
                <th>Warranty Status</th>
                <th>Alloted To</th>
                <th>Email</th>
                <th>Department</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assets.map((asset, idx) => (
                <tr key={asset.id} data-testid={`asset-row-${asset.id}`}>
                  <td>{idx + 1}</td>
                  <td>{asset.asset_type}</td>
                  <td>{asset.model}</td>
                  <td>{asset.serial_number}</td>
                  <td>{asset.purchase_date}</td>
                  <td>₹{asset.value_ex_gst.toLocaleString()}</td>
                  <td>
                    <span className={`status-badge ${asset.warranty_status === 'Active' ? 'status-active' : 'status-inactive'}`}>
                      {asset.warranty_status}
                    </span>
                  </td>
                  <td>{asset.alloted_to}</td>
                  <td>{asset.email}</td>
                  <td>{asset.department}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn-icon" 
                        onClick={() => handleEdit(asset)}
                        data-testid={`edit-asset-${asset.id}`}
                        title="Edit"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        className="btn-icon" 
                        onClick={() => handleDelete(asset.id, asset.asset_type)}
                        data-testid={`delete-asset-${asset.id}`}
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

      {/* Add/Edit Asset Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} data-testid="asset-modal">
            <div className="modal-header">
              <h2>{editMode ? 'Edit Asset' : 'New Asset'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Asset Type *</label>
                    <input
                      type="text"
                      value={formData.asset_type}
                      onChange={(e) => setFormData({ ...formData, asset_type: e.target.value })}
                      required
                      data-testid="asset-type-input"
                      placeholder="e.g., Laptop, Monitor, Phone"
                    />
                  </div>
                  <div className="form-group">
                    <label>Model *</label>
                    <input
                      type="text"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                      required
                      data-testid="model-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Serial Number *</label>
                    <input
                      type="text"
                      value={formData.serial_number}
                      onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                      required
                      data-testid="serial-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Purchase Date *</label>
                    <input
                      type="date"
                      value={formData.purchase_date}
                      onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                      required
                      data-testid="purchase-date-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Vendor *</label>
                    <input
                      type="text"
                      value={formData.vendor}
                      onChange={(e) => setFormData({ ...formData, vendor: e.target.value })}
                      required
                      data-testid="vendor-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Value (ex. GST) *</label>
                    <input
                      type="number"
                      value={formData.value_ex_gst}
                      onChange={(e) => setFormData({ ...formData, value_ex_gst: parseFloat(e.target.value) })}
                      required
                      data-testid="value-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Warranty Period (Months) *</label>
                    <input
                      type="number"
                      value={formData.warranty_period_months}
                      onChange={(e) => setFormData({ ...formData, warranty_period_months: parseInt(e.target.value) })}
                      required
                      data-testid="warranty-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Alloted To *</label>
                    <input
                      type="text"
                      value={formData.alloted_to}
                      onChange={(e) => setFormData({ ...formData, alloted_to: e.target.value })}
                      required
                      data-testid="alloted-to-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Email *</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                      data-testid="email-input"
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
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" data-testid="save-asset-button">
                  {editMode ? 'Update Asset' : 'Save Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
