import { useState } from 'react';
import { api } from '../App';
import { toast } from 'sonner';
import { Download } from 'lucide-react';

export default function SLAGenerator() {
  const [formData, setFormData] = useState({
    client_name: '',
    address: '',
    start_date: '',
    tenure_months: 12,
    currency_preference: 'INR',
    service: 'PPC',
    amount: 0,
    amount_ppc: 0,
    amount_seo: 0,
    authorised_signatory: '',
    designation: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/clients/generate-sla', formData, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `SLA_${formData.client_name}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('SLA generated successfully!');
    } catch (error) {
      toast.error('Failed to generate SLA');
    }
  };

  return (
    <div className="generator-container" data-testid="sla-generator">
      <h1>SLA Generator</h1>
      <form onSubmit={handleSubmit}>
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
            <label>Currency *</label>
            <select
              value={formData.currency_preference}
              onChange={(e) => setFormData({ ...formData, currency_preference: e.target.value })}
              data-testid="currency-select"
            >
              <option value="INR">INR</option>
              <option value="USD">USD</option>
            </select>
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

          {formData.service === 'Both' ? (
            <>
              <div className="form-group">
                <label>PPC Amount *</label>
                <input
                  type="number"
                  value={formData.amount_ppc}
                  onChange={(e) => setFormData({ ...formData, amount_ppc: parseFloat(e.target.value) })}
                  required
                  data-testid="amount-ppc-input"
                />
              </div>
              <div className="form-group">
                <label>SEO Amount *</label>
                <input
                  type="number"
                  value={formData.amount_seo}
                  onChange={(e) => setFormData({ ...formData, amount_seo: parseFloat(e.target.value) })}
                  required
                  data-testid="amount-seo-input"
                />
              </div>
            </>
          ) : (
            <div className="form-group">
              <label>Amount *</label>
              <input
                type="number"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) })}
                required
                data-testid="amount-input"
              />
            </div>
          )}

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
          data-testid="generate-sla-button"
        >
          <Download size={18} style={{ marginRight: '0.5rem', display: 'inline', verticalAlign: 'middle' }} />
          Generate SLA Document
        </button>
      </form>
    </div>
  );
}
