import { useState } from 'react';
import { api } from '../App';
import { toast } from 'sonner';
import { Download } from 'lucide-react';

export default function NDAGenerator() {
  const [formData, setFormData] = useState({
    client_name: '',
    address: '',
    start_date: '',
    authorised_signatory: '',
    designation: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/clients/generate-nda', formData, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `NDA_${formData.client_name}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('NDA generated successfully!');
    } catch (error) {
      toast.error('Failed to generate NDA');
    }
  };

  return (
    <div className="generator-container" data-testid="nda-generator">
      <h1>NDA Generator</h1>
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
          data-testid="generate-nda-button"
        >
          <Download size={18} style={{ marginRight: '0.5rem', display: 'inline', verticalAlign: 'middle' }} />
          Generate NDA Document
        </button>
      </form>
    </div>
  );
}
