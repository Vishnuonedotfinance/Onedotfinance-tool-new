import { useState } from 'react';
import { api } from '../App';
import { toast } from 'sonner';
import { Download } from 'lucide-react';

export default function OfferLetterGenerator() {
  const [formData, setFormData] = useState({
    employee_name: '',
    date: '',
    gross_salary_lpa: 0,
    sign_before_date: '',
    position: '',
    department: 'PPC'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/employees/generate-offer', formData, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Offer_${formData.employee_name}.docx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.success('Offer Letter generated successfully!');
    } catch (error) {
      toast.error('Failed to generate Offer Letter');
    }
  };

  const calculateCTC = () => {
    const grossAnnual = formData.gross_salary_lpa * 100000;
    const ctcAnnual = grossAnnual + 21600;
    const monthlyCTC = ctcAnnual / 12;
    return { grossAnnual, ctcAnnual, monthlyCTC };
  };

  const { grossAnnual, ctcAnnual, monthlyCTC } = calculateCTC();

  return (
    <div className="generator-container" data-testid="offer-letter-generator">
      <h1>Offer Letter Generator</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          <div className="form-group form-group-full">
            <label>Employee Name *</label>
            <input
              type="text"
              value={formData.employee_name}
              onChange={(e) => setFormData({ ...formData, employee_name: e.target.value })}
              required
              data-testid="employee-name-input"
            />
          </div>
          <div className="form-group">
            <label>Date *</label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
              data-testid="date-input"
            />
          </div>
          <div className="form-group">
            <label>Gross Salary (LPA) *</label>
            <input
              type="number"
              step="0.01"
              value={formData.gross_salary_lpa}
              onChange={(e) => setFormData({ ...formData, gross_salary_lpa: parseFloat(e.target.value) })}
              required
              data-testid="salary-input"
            />
          </div>
          <div className="form-group">
            <label>Sign Before Date *</label>
            <input
              type="date"
              value={formData.sign_before_date}
              onChange={(e) => setFormData({ ...formData, sign_before_date: e.target.value })}
              required
              data-testid="sign-before-input"
            />
          </div>
          <div className="form-group">
            <label>Position *</label>
            <input
              type="text"
              value={formData.position}
              onChange={(e) => setFormData({ ...formData, position: e.target.value })}
              required
              data-testid="position-input"
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

        {formData.gross_salary_lpa > 0 && (
          <div style={{ marginTop: '1.5rem', padding: '1rem', background: '#f8fafc', borderRadius: '12px' }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem' }}>Salary Breakdown Preview:</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
              <div>
                <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Gross Annual</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '600' }}>₹{grossAnnual.toLocaleString()}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Annual CTC</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '600' }}>₹{ctcAnnual.toLocaleString()}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.875rem', color: '#64748b' }}>Monthly CTC</div>
                <div style={{ fontSize: '1.25rem', fontWeight: '600' }}>₹{monthlyCTC.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
              </div>
            </div>
          </div>
        )}

        <button
          type="submit"
          className="btn-primary"
          style={{ marginTop: '2rem', width: '100%' }}
          data-testid="generate-offer-button"
        >
          <Download size={18} style={{ marginRight: '0.5rem', display: 'inline', verticalAlign: 'middle' }} />
          Generate Offer Letter
        </button>
      </form>
    </div>
  );
}
