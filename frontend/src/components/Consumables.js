import { useState, useEffect } from 'react';
import { api } from '../App';
import { toast } from 'sonner';
import { Plus, Package, TrendingUp, TrendingDown } from 'lucide-react';

export default function Consumables() {
  const [activeTab, setActiveTab] = useState('availability');
  const [stockAvailability, setStockAvailability] = useState([]);
  const [stockTransactions, setStockTransactions] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showStockInModal, setShowStockInModal] = useState(false);
  const [showStockOutModal, setShowStockOutModal] = useState(false);
  const [stockInForm, setStockInForm] = useState({
    product_name: '',
    quantity: 0,
    price: 0,
    vendor_name: '',
    email: '',
    invoice_number: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [stockOutForm, setStockOutForm] = useState({
    product_name: '',
    quantity: 0,
    issued_to: '',
    email: '',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [availabilityRes, transactionsRes, productsRes] = await Promise.all([
        api.get('/stock-availability'),
        api.get('/stock-transactions'),
        api.get('/stock-products')
      ]);
      setStockAvailability(availabilityRes.data);
      setStockTransactions(transactionsRes.data);
      setProducts(productsRes.data);
    } catch (error) {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleStockIn = async (e) => {
    e.preventDefault();
    try {
      await api.post('/stock-in', stockInForm);
      toast.success('Stock In recorded successfully');
      loadData();
      setShowStockInModal(false);
      resetStockInForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to record Stock In');
    }
  };

  const handleStockOut = async (e) => {
    e.preventDefault();
    try {
      await api.post('/stock-out', stockOutForm);
      toast.success('Stock Out recorded successfully');
      loadData();
      setShowStockOutModal(false);
      resetStockOutForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to record Stock Out');
    }
  };

  const handleNotesUpdate = async (stockId, notes) => {
    try {
      await api.patch(`/stock-availability/${stockId}`, { notes });
      toast.success('Notes updated');
      loadData();
    } catch (error) {
      toast.error('Failed to update notes');
    }
  };

  const resetStockInForm = () => {
    setStockInForm({
      product_name: '',
      quantity: 0,
      price: 0,
      vendor_name: '',
      email: '',
      invoice_number: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  const resetStockOutForm = () => {
    setStockOutForm({
      product_name: '',
      quantity: 0,
      issued_to: '',
      email: '',
      date: new Date().toISOString().split('T')[0]
    });
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>Consumables Management</h1>
        <p>Track stock inventory and transactions</p>
      </div>

      <div className="table-container">
        {/* Tabs */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', borderBottom: '2px solid #e5e7eb' }}>
          <button
            onClick={() => setActiveTab('availability')}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'availability' ? '3px solid #4F46E5' : 'none',
              color: activeTab === 'availability' ? '#4F46E5' : '#6b7280',
              fontWeight: activeTab === 'availability' ? '600' : '400',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Package size={20} />
            Stock Availability
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            style={{
              padding: '0.75rem 1.5rem',
              border: 'none',
              background: 'none',
              borderBottom: activeTab === 'transactions' ? '3px solid #4F46E5' : 'none',
              color: activeTab === 'transactions' ? '#4F46E5' : '#6b7280',
              fontWeight: activeTab === 'transactions' ? '600' : '400',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <TrendingUp size={20} />
            Stock Transactions
          </button>
        </div>

        {/* Action Buttons */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', gap: '1rem' }}>
          <button
            className="btn-success"
            onClick={() => { resetStockInForm(); setShowStockInModal(true); }}
          >
            <TrendingUp size={18} style={{ marginRight: '0.5rem', display: 'inline', verticalAlign: 'middle' }} />
            Stock In
          </button>
          <button
            className="btn-primary"
            onClick={() => { resetStockOutForm(); setShowStockOutModal(true); }}
            style={{ background: '#ef4444' }}
          >
            <TrendingDown size={18} style={{ marginRight: '0.5rem', display: 'inline', verticalAlign: 'middle' }} />
            Stock Out
          </button>
        </div>

        {/* Stock Availability Tab */}
        {activeTab === 'availability' && (
          <div style={{ overflowX: 'auto' }}>
            <h3 style={{ marginBottom: '1rem' }}>Current Stock (Total Products: {stockAvailability.length})</h3>
            <table>
              <thead>
                <tr>
                  <th>S/No</th>
                  <th>Product Name</th>
                  <th>Vendor Name</th>
                  <th>Stock Available</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {stockAvailability.map((item, idx) => (
                  <tr key={item.id}>
                    <td>{idx + 1}</td>
                    <td><strong>{item.product_name}</strong></td>
                    <td>{item.vendor_name}</td>
                    <td>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        background: item.stock_available > 10 ? '#d1fae5' : item.stock_available > 0 ? '#fed7aa' : '#fee2e2',
                        color: item.stock_available > 10 ? '#065f46' : item.stock_available > 0 ? '#9a3412' : '#991b1b',
                        fontWeight: '600'
                      }}>
                        {item.stock_available}
                      </span>
                    </td>
                    <td>
                      <input
                        type="text"
                        defaultValue={item.notes || ''}
                        onBlur={(e) => handleNotesUpdate(item.id, e.target.value)}
                        placeholder="Add notes..."
                        style={{ width: '100%', padding: '0.25rem 0.5rem', border: '1px solid #e5e7eb', borderRadius: '4px' }}
                      />
                    </td>
                  </tr>
                ))}
                {stockAvailability.length === 0 && (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                      No stock items yet. Use "Stock In" to add products.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Stock Transactions Tab */}
        {activeTab === 'transactions' && (
          <div style={{ overflowX: 'auto' }}>
            <h3 style={{ marginBottom: '1rem' }}>Transaction History (Total: {stockTransactions.length})</h3>
            <table>
              <thead>
                <tr>
                  <th>S/No</th>
                  <th>Type</th>
                  <th>Product Name</th>
                  <th>Vendor/Issued To</th>
                  <th>Invoice Number</th>
                  <th>Email</th>
                  <th>Date</th>
                  <th>Quantity</th>
                </tr>
              </thead>
              <tbody>
                {stockTransactions.map((txn, idx) => (
                  <tr key={txn.id}>
                    <td>{idx + 1}</td>
                    <td>
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        background: txn.type === 'Stock In' ? '#d1fae5' : '#fee2e2',
                        color: txn.type === 'Stock In' ? '#065f46' : '#991b1b',
                        fontWeight: '600',
                        fontSize: '0.875rem'
                      }}>
                        {txn.type}
                      </span>
                    </td>
                    <td><strong>{txn.product_name}</strong></td>
                    <td>{txn.vendor_name_or_issued_to}</td>
                    <td>{txn.invoice_number || '-'}</td>
                    <td>{txn.email}</td>
                    <td>{txn.date}</td>
                    <td style={{ fontWeight: '600' }}>{txn.quantity}</td>
                  </tr>
                ))}
                {stockTransactions.length === 0 && (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                      No transactions yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Stock In Modal */}
      {showStockInModal && (
        <div className="modal-overlay" onClick={() => setShowStockInModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>Stock In</h2>
              <button className="modal-close" onClick={() => setShowStockInModal(false)}>×</button>
            </div>
            <form onSubmit={handleStockIn}>
              <div className="form-grid">
                <div className="form-group form-group-full">
                  <label>Product Name *</label>
                  <input
                    list="products-list"
                    value={stockInForm.product_name}
                    onChange={(e) => setStockInForm({ ...stockInForm, product_name: e.target.value })}
                    placeholder="Enter or select product"
                    required
                  />
                  <datalist id="products-list">
                    {products.map(p => (
                      <option key={p.product_name} value={p.product_name} />
                    ))}
                  </datalist>
                </div>
                <div className="form-group">
                  <label>Quantity Purchased *</label>
                  <input type="number" min="1" value={stockInForm.quantity} onChange={(e) => setStockInForm({ ...stockInForm, quantity: parseInt(e.target.value) })} required />
                </div>
                <div className="form-group">
                  <label>Price (₹) *</label>
                  <input type="number" min="0" step="0.01" value={stockInForm.price} onChange={(e) => setStockInForm({ ...stockInForm, price: parseFloat(e.target.value) })} required />
                </div>
                <div className="form-group">
                  <label>Vendor Name *</label>
                  <input type="text" value={stockInForm.vendor_name} onChange={(e) => setStockInForm({ ...stockInForm, vendor_name: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Vendor Email *</label>
                  <input type="email" value={stockInForm.email} onChange={(e) => setStockInForm({ ...stockInForm, email: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Invoice Number *</label>
                  <input type="text" value={stockInForm.invoice_number} onChange={(e) => setStockInForm({ ...stockInForm, invoice_number: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Date of Purchase *</label>
                  <input type="date" value={stockInForm.date} onChange={(e) => setStockInForm({ ...stockInForm, date: e.target.value })} required />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowStockInModal(false)}>Cancel</button>
                <button type="submit" className="btn-success">Record Stock In</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Stock Out Modal */}
      {showStockOutModal && (
        <div className="modal-overlay" onClick={() => setShowStockOutModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h2>Stock Out</h2>
              <button className="modal-close" onClick={() => setShowStockOutModal(false)}>×</button>
            </div>
            <form onSubmit={handleStockOut}>
              <div className="form-grid">
                <div className="form-group form-group-full">
                  <label>Product Name *</label>
                  <select
                    value={stockOutForm.product_name}
                    onChange={(e) => setStockOutForm({ ...stockOutForm, product_name: e.target.value })}
                    required
                  >
                    <option value="">Select Product</option>
                    {products.map(p => (
                      <option key={p.product_name} value={p.product_name}>
                        {p.product_name} (Available: {p.stock_available})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Quantity Issued *</label>
                  <input type="number" min="1" value={stockOutForm.quantity} onChange={(e) => setStockOutForm({ ...stockOutForm, quantity: parseInt(e.target.value) })} required />
                </div>
                <div className="form-group">
                  <label>Issued To *</label>
                  <input type="text" value={stockOutForm.issued_to} onChange={(e) => setStockOutForm({ ...stockOutForm, issued_to: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Email *</label>
                  <input type="email" value={stockOutForm.email} onChange={(e) => setStockOutForm({ ...stockOutForm, email: e.target.value })} required />
                </div>
                <div className="form-group">
                  <label>Date of Issue *</label>
                  <input type="date" value={stockOutForm.date} onChange={(e) => setStockOutForm({ ...stockOutForm, date: e.target.value })} required />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowStockOutModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ background: '#ef4444' }}>Record Stock Out</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
