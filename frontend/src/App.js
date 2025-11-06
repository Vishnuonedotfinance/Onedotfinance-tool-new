import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import axios from 'axios';
import Login from './components/Login';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Users from './components/Users';
import ClientDatabase from './components/ClientDatabase';
import ContractorDatabase from './components/ContractorDatabase';
import EmployeeDatabase from './components/EmployeeDatabase';
import Approval from './components/Approval';
import AssetTracker from './components/AssetTracker';
import Reports from './components/Reports';
import Signup from './components/Signup';
import ClientOnboarding from './components/ClientOnboarding';
import Consumables from './components/Consumables';
import { Toaster } from './components/ui/sonner';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      api.get('/auth/me')
        .then(res => {
          setUser(res.data);
          setLoading(false);
        })
        .catch(() => {
          localStorage.removeItem('token');
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  if (loading) {
    return <div className="loading-screen">Loading...</div>;
  }

  return (
    <div className="App">
      <Toaster position="top-right" richColors />
      <BrowserRouter>
        <Routes>
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={user ? <Navigate to="/" /> : <Login onLogin={handleLogin} />} />
          <Route
            path="/*"
            element={
              user ? (
                <Layout user={user} onLogout={handleLogout}>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/users" element={<Users user={user} />} />
                    <Route path="/clients" element={<ClientDatabase user={user} />} />
                    <Route path="/clients/sla-generator" element={<SLAGenerator />} />
                    <Route path="/clients/nda-generator" element={<NDAGenerator />} />
                    <Route path="/contractors" element={<ContractorDatabase user={user} />} />
                    <Route path="/contractors/ica-generator" element={<ICAGenerator />} />
                    <Route path="/employees" element={<EmployeeDatabase user={user} />} />
                    <Route path="/employees/offer-letter-generator" element={<OfferLetterGenerator />} />
                    <Route path="/approval" element={<Approval user={user} />} />
                    <Route path="/asset-tracker" element={<AssetTracker />} />
                    <Route path="/reports" element={<Reports />} />
                    <Route path="/client-onboarding" element={<ClientOnboarding />} />
                    <Route path="/consumables" element={<Consumables />} />
                  </Routes>
                </Layout>
              ) : (
                <Navigate to="/login" />
              )
            }
          />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
