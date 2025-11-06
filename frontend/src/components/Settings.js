import { useState, useEffect } from 'react';
import { api } from '../App';
import { toast } from 'sonner';
import { Building2, Upload, Trash2, Save } from 'lucide-react';

export default function Settings({ user }) {
  const [orgName, setOrgName] = useState('');
  const [orgId, setOrgId] = useState('');
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [currentLogo, setCurrentLogo] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOrgData();
  }, []);

  const loadOrgData = () => {
    const storedOrgName = localStorage.getItem('org_name');
    const storedOrgId = localStorage.getItem('org_id');
    const storedLogo = localStorage.getItem('org_logo');
    setOrgName(storedOrgName || 'One.Finance');
    setOrgId(storedOrgId || '');
    setCurrentLogo(storedLogo);
    setLoading(false);
  };

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Logo must be less than 5MB');
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file (PNG, JPG, etc.)');
        return;
      }
      if (file.type !== 'image/png' && file.type !== 'image/jpeg' && file.type !== 'image/jpg') {
        toast.error('Please select PNG or JPG format only');
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUploadLogo = async () => {
    if (!logoFile) {
      toast.error('Please select a logo file first');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('file', logoFile);

    try {
      const orgId = localStorage.getItem('org_id');
      const response = await api.post(`/auth/upload-logo?org_id=${orgId}`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      localStorage.setItem('org_logo', response.data.logo_url);
      setCurrentLogo(response.data.logo_url);
      setLogoFile(null);
      setLogoPreview(null);
      toast.success('Logo uploaded successfully! Refresh to see changes.');
      
      // Reload page to update logo in sidebar
      setTimeout(() => window.location.reload(), 1500);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to upload logo');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setLogoPreview(null);
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Organization Settings</h1>
        <p>Manage your organization details and branding</p>
      </div>

      <div className="table-container" style={{ maxWidth: '800px' }}>
        <div style={{ padding: '2rem' }}>
          {/* Organization Name */}
          <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <Building2 size={24} style={{ color: '#4F46E5' }} />
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>Organization Name</h2>
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>
              {orgName}
            </div>
          </div>

          {/* Logo Upload Section */}
          <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#f9fafb', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem' }}>
              <Upload size={24} style={{ color: '#4F46E5' }} />
              <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: '600' }}>Organization Logo</h2>
            </div>
            <p style={{ color: '#6b7280', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
              Upload a logo in PNG or JPG format (max 5MB). Recommended size: 200x200px
            </p>

            {/* Current Logo Display */}
            {currentLogo && !logoPreview && (
              <div style={{ marginBottom: '1.5rem' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                  Current Logo:
                </p>
                <img
                  src={`${process.env.REACT_APP_BACKEND_URL}${currentLogo}`}
                  alt="Current Logo"
                  style={{
                    maxWidth: '150px',
                    maxHeight: '150px',
                    borderRadius: '12px',
                    border: '2px solid #e5e7eb',
                    padding: '0.5rem',
                    background: 'white'
                  }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}

            {/* Logo Preview */}
            {logoPreview && (
              <div style={{ marginBottom: '1.5rem' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: '600', color: '#374151', marginBottom: '0.5rem' }}>
                  New Logo Preview:
                </p>
                <div style={{ position: 'relative', display: 'inline-block' }}>
                  <img
                    src={logoPreview}
                    alt="Logo preview"
                    style={{
                      maxWidth: '150px',
                      maxHeight: '150px',
                      borderRadius: '12px',
                      border: '2px solid #4F46E5',
                      padding: '0.5rem',
                      background: 'white'
                    }}
                  />
                  <button
                    onClick={handleRemoveLogo}
                    style={{
                      position: 'absolute',
                      top: '-8px',
                      right: '-8px',
                      background: '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '50%',
                      width: '28px',
                      height: '28px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                    }}
                    title="Remove"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            )}

            {/* Upload Button */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <label style={{
                padding: '0.75rem 1.5rem',
                background: logoPreview ? '#6b7280' : '#4F46E5',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                transition: 'all 0.2s'
              }}
              onMouseEnter={(e) => e.target.style.transform = 'translateY(-2px)'}
              onMouseLeave={(e) => e.target.style.transform = 'translateY(0)'}
              >
                <Upload size={18} />
                {logoPreview ? 'Choose Different Logo' : 'Choose Logo'}
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={handleLogoChange}
                  style={{ display: 'none' }}
                />
              </label>

              {logoPreview && (
                <button
                  onClick={handleUploadLogo}
                  disabled={uploading}
                  style={{
                    padding: '0.75rem 1.5rem',
                    background: uploading ? '#9ca3af' : '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: uploading ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => !uploading && (e.target.style.transform = 'translateY(-2px)')}
                  onMouseLeave={(e) => !uploading && (e.target.style.transform = 'translateY(0)')}
                >
                  <Save size={18} />
                  {uploading ? 'Uploading...' : 'Save Logo'}
                </button>
              )}
            </div>

            {user.role === 'Admin' && (
              <div style={{
                marginTop: '1rem',
                padding: '0.75rem',
                background: '#fef3c7',
                borderRadius: '8px',
                fontSize: '0.875rem',
                color: '#92400e'
              }}>
                <strong>Note:</strong> Only Admin users can upload or change the organization logo.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
