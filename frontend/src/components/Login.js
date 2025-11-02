import { useState } from 'react';
import { api } from '../App';
import { toast } from 'sonner';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('Vishnu@onedotfinance.com');
  const [password, setPassword] = useState('12345678');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      setOtpCode(response.data.otp);
      setOtpSent(true);
      toast.success(`OTP sent! Use: ${response.data.otp}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.post('/auth/verify-otp', { email, otp });
      localStorage.setItem('token', response.data.token);
      onLogin(response.data.user);
      toast.success('Login successful!');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container" data-testid="login-container">
      <div className="login-card">
        <div className="login-logo">
          <h1>Piperocket</h1>
          <p>Finance Management Tool</p>
        </div>

        {!otpSent ? (
          <form className="login-form" onSubmit={handleLogin} data-testid="login-form">
            <div className="form-group">
              <label>Email</label>
              <input
                data-testid="email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                data-testid="password-input"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              data-testid="login-button"
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>
        ) : (
          <form className="login-form" onSubmit={handleVerifyOTP} data-testid="otp-form">
            <div className="success-message">
              OTP sent to your email. For MVP: {otpCode}
            </div>

            <div className="form-group">
              <label>Enter OTP</label>
              <input
                data-testid="otp-input"
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit OTP"
                required
              />
            </div>

            <button
              data-testid="verify-otp-button"
              type="submit"
              className="btn-primary"
              disabled={loading}
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <button
              type="button"
              className="btn-secondary"
              onClick={() => setOtpSent(false)}
              style={{ width: '100%', marginTop: '0.5rem' }}
            >
              Back to Login
            </button>
          </form>
        )}

        <div className="sidebar-footer" style={{ marginTop: '2rem' }}>
          tool powered by one.Finance (www.onedotfinance.com)
        </div>
      </div>
    </div>
  );
}
