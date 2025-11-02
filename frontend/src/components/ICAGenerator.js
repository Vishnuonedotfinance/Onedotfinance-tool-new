import { useState } from 'react';
import { api } from '../App';
import { toast } from 'sonner';
import { Download } from 'lucide-react';

export default function ICAGenerator() {
  const [formData, setFormData] = useState({
    contractor_name: '',
    address: '',
    start_date: '',
    tenure_months: 6,
    amount_inr: 0,
    designation: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/contractors/generate-ica', formData, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ICA_${formData.contractor_name}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('ICA generated successfully!');
    } catch (error) {
      toast.error('Failed to generate ICA');
    }
  };

  return (
    <div className="generator-container" data-testid="ica-generator">
      <h1>ICA Generator</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group form-group-full">
            <label>Contractor Name *</label>
            <input
              type="text"
              value={formData.contractor_name}
              onChange={(e) => setFormData({ ...formData, contractor_name: e.target.value })}
              required
              data-testid="contractor-name-input"
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
            <label>Designation *</label>
            <input
              type="text"
              value={formData.designation}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              required
              data-testid="designation-input"
            />
          </div>
        </div>

        <button
          type="submit"
          className="btn-primary"
          style={{ marginTop: '2rem', width: '100%' }}
          data-testid="generate-ica-button"
        >
          <Download size={18} style={{ marginRight: '0.5rem', display: 'inline', verticalAlign: 'middle' }} />
          Generate ICA Document
        </button>
      </form>
    </div>
  );
}
