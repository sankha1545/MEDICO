import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import {
  CreditCard,
  DollarSign,
  Search,
  Filter,
  Download,
  Plus,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import ThreeBackground from '../../components/payments/ThreeBackground';
import Toast from '../../components/payments/Toast';
import PaymentMethodCard from '../../components/payments/PaymentMethodCard'; // adjust import if filename differs
import { AuthContext } from '../../../contexts/AuthContext';

// Types
interface PaymentHistory {
  id: string;
  date: string;
  service: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  receiptUrl?: string;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'upi';
  name: string;
  details: string;
  isDefault: boolean;
}

interface OutstandingItem {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
}

interface OutstandingBalance {
  total: number;
  items: OutstandingItem[];
}

const PaymentsPage: React.FC = () => {
  const { token } = useContext(AuthContext);

  // Tab state
  const [activeTab, setActiveTab] = useState<'history' | 'new' | 'methods'>('history');

  // Search & filter
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'paid' | 'pending' | 'failed'>('all');

  // Toast notifications
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'warning'; message: string } | null>(null);

  // Data states
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [methodsLoading, setMethodsLoading] = useState(false);

  const [outstandingBalance, setOutstandingBalance] = useState<OutstandingBalance | null>(null);
  const [outstandingLoading, setOutstandingLoading] = useState(false);

  // New payment form
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'upi'>('card');
  const [paymentForm, setPaymentForm] = useState({
    appointmentId: '',
    amount: '',
    cardName: '',
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    upiId: ''
  });
  const [paymentLoading, setPaymentLoading] = useState(false);

  // Fetch functions
  const fetchPaymentHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await axios.get('/api/payments/history', {
        headers: { Authorization: `Bearer ${token}` }
      });
      // Expect an array of PaymentHistory
      setPaymentHistory(res.data);
    } catch (err: any) {
      console.error('Error fetching payment history', err);
      setToast({ type: 'error', message: 'Failed to load payment history.' });
    } finally {
      setHistoryLoading(false);
    }
  };

  const fetchPaymentMethods = async () => {
    setMethodsLoading(true);
    try {
      const res = await axios.get('/api/payments/methods', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPaymentMethods(res.data);
    } catch (err: any) {
      console.error('Error fetching payment methods', err);
      setToast({ type: 'error', message: 'Failed to load payment methods.' });
    } finally {
      setMethodsLoading(false);
    }
  };

  const fetchOutstandingBalance = async () => {
    setOutstandingLoading(true);
    try {
      const res = await axios.get('/api/payments/outstanding', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOutstandingBalance(res.data);
    } catch (err: any) {
      console.error('Error fetching outstanding balance', err);
      setToast({ type: 'error', message: 'Failed to load outstanding balance.' });
    } finally {
      setOutstandingLoading(false);
    }
  };

  // On mount or tab change, fetch relevant data
  useEffect(() => {
    if (activeTab === 'history') {
      fetchPaymentHistory();
    } else if (activeTab === 'methods') {
      fetchPaymentMethods();
    }
    // Always refresh outstanding on mount
    // (or you can choose to refresh whenever relevant)
  }, [activeTab]);

  useEffect(() => {
    fetchOutstandingBalance();
  }, []);

  // Payment handler
  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentLoading(true);

    // Build payload
    const payload: any = {
      appointmentId: paymentForm.appointmentId,
      amount: parseFloat(paymentForm.amount),
      method: selectedMethod
    };
    if (selectedMethod === 'card') {
      payload.card = {
        name: paymentForm.cardName,
        number: paymentForm.cardNumber,
        expiryMonth: paymentForm.expiryMonth,
        expiryYear: paymentForm.expiryYear,
        cvv: paymentForm.cvv
      };
    } else {
      payload.upiId = paymentForm.upiId;
    }

    try {
      const res = await axios.post('/api/payments', payload, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setToast({ type: 'success', message: 'Payment processed successfully!' });
      // Clear form
      setPaymentForm({
        appointmentId: '',
        amount: '',
        cardName: '',
        cardNumber: '',
        expiryMonth: '',
        expiryYear: '',
        cvv: '',
        upiId: ''
      });
      // Refresh history and outstanding
      fetchPaymentHistory();
      fetchOutstandingBalance();
    } catch (err: any) {
      console.error('Payment error', err);
      const msg = err.response?.data?.message || 'Payment failed.';
      setToast({ type: 'error', message: msg });
    } finally {
      setPaymentLoading(false);
    }
  };

  // Filtered history based on search/filter inputs
  const filteredHistory = paymentHistory.filter(payment => {
    const matchesSearch = payment.service.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || payment.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Status icon/color helpers
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'text-green-600 bg-green-50';
      case 'pending':
        return 'text-yellow-600 bg-yellow-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  // Handlers for payment methods actions
  const handleRemoveMethod = async (id: string) => {
    try {
      await axios.delete(`/api/payments/methods/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setToast({ type: 'success', message: 'Payment method removed' });
      fetchPaymentMethods();
    } catch (err) {
      console.error('Remove method error', err);
      setToast({ type: 'error', message: 'Failed to remove method' });
    }
  };

  const handleSetDefaultMethod = async (id: string) => {
    try {
      await axios.put(`/api/payments/methods/${id}/default`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setToast({ type: 'success', message: 'Default payment method updated' });
      fetchPaymentMethods();
    } catch (err) {
      console.error('Set default error', err);
      setToast({ type: 'error', message: 'Failed to set default method' });
    }
  };

  // Pay all outstanding
  const handlePayAllOutstanding = async () => {
    if (!outstandingBalance) return;
    setPaymentLoading(true);
    try {
      const res = await axios.post('/api/payments/pay-outstanding', {
        items: outstandingBalance.items.map(item => item.id)
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setToast({ type: 'success', message: 'Outstanding balance paid!' });
      fetchOutstandingBalance();
      fetchPaymentHistory();
    } catch (err) {
      console.error('Pay outstanding error', err);
      setToast({ type: 'error', message: 'Failed to pay outstanding balance' });
    } finally {
      setPaymentLoading(false);
    }
  };

  return (
    <>
      <ThreeBackground />

      <div className="min-h-screen bg-gradient-to-br from-blue-50/80 to-indigo-100/80 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Payment Center</h1>
            <p className="text-lg text-gray-600">Manage your payments and financial records</p>
          </div>

          {/* Navigation Tabs */}
          <div className="flex justify-center mb-8">
            <div className="bg-white/80 backdrop-blur-sm rounded-xl p-1 shadow-lg">
              {['history', 'new', 'methods'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab as any)}
                  className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 focus:outline-none ${
                    activeTab === tab
                      ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                  }`}
                >
                  {tab === 'history' && 'Payment History'}
                  {tab === 'new' && 'New Payment'}
                  {tab === 'methods' && 'Payment Methods'}
                </button>
              ))}
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* History Tab */}
              {activeTab === 'history' && (
                <>
                  {/* Search & Filter */}
                  <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg transition transform hover:shadow-xl">
                    <div className="flex flex-col sm:flex-row gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          placeholder="Search payments..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <div className="relative">
                        <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <select
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value as any)}
                          className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none bg-white"
                        >
                          <option value="all">All Status</option>
                          <option value="paid">Paid</option>
                          <option value="pending">Pending</option>
                          <option value="failed">Failed</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Payment History Table */}
                  <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden transition transform hover:shadow-xl">
                    {historyLoading ? (
                      <div className="p-6 text-center text-gray-500">Loading...</div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Date
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Service
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Amount
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Status
                              </th>
                              <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Receipt
                              </th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-gray-200">
                            {filteredHistory.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                                  No records found.
                                </td>
                              </tr>
                            ) : (
                              filteredHistory.map((payment) => (
                                <tr
                                  key={payment.id}
                                  className="hover:bg-blue-50 transition-transform transform hover:scale-[1.01] cursor-pointer"
                                >
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {new Date(payment.date).toLocaleDateString()}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {payment.service}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                    ₹{payment.amount}
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                                      {getStatusIcon(payment.status)}
                                      <span className="capitalize">{payment.status}</span>
                                    </span>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    {payment.receiptUrl ? (
                                      <a
                                        href={payment.receiptUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                                      >
                                        <Download className="w-4 h-4" />
                                        <span>Download</span>
                                      </a>
                                    ) : (
                                      '-'
                                    )}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* New Payment Tab */}
              {activeTab === 'new' && (
                <div className="bg-white/90 backdrop-blur-sm rounded-xl p-8 shadow-lg transition transform hover:shadow-xl">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Make a Payment</h2>

                  <form onSubmit={handlePayment} className="space-y-6">
                    {/* Payment Method Selection */}
                    <div className="flex space-x-4">
                      {['card', 'upi'].map((method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setSelectedMethod(method as any)}
                          className={`flex-1 p-4 rounded-lg border-2 transition-all duration-200 focus:outline-none ${
                            selectedMethod === method
                              ? 'border-blue-500 bg-blue-50'
                              : 'border-gray-200 hover:border-blue-300'
                          }`}
                        >
                          <div className="flex items-center justify-center space-x-2">
                            {method === 'card' ? (
                              <CreditCard className="w-5 h-5" />
                            ) : (
                              <DollarSign className="w-5 h-5" />
                            )}
                            <span className="font-medium">
                              {method === 'card' ? 'Credit/Debit Card' : 'UPI'}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>

                    {selectedMethod === 'card' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Appointment ID
                          </label>
                          <input
                            type="text"
                            value={paymentForm.appointmentId}
                            onChange={(e) => setPaymentForm({ ...paymentForm, appointmentId: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder="Enter appointment ID"
                            required
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Card Holder Name
                          </label>
                          <input
                            type="text"
                            value={paymentForm.cardName}
                            onChange={(e) => setPaymentForm({ ...paymentForm, cardName: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder="John Doe"
                            required
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Card Number
                          </label>
                          <input
                            type="text"
                            value={paymentForm.cardNumber}
                            onChange={(e) => setPaymentForm({ ...paymentForm, cardNumber: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder="1234 5678 9012 3456"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Expiry Month
                          </label>
                          <input
                            type="text"
                            value={paymentForm.expiryMonth}
                            onChange={(e) => setPaymentForm({ ...paymentForm, expiryMonth: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder="MM"
                            required
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Expiry Year
                          </label>
                          <input
                            type="text"
                            value={paymentForm.expiryYear}
                            onChange={(e) => setPaymentForm({ ...paymentForm, expiryYear: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder="YYYY"
                            required
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            CVV
                          </label>
                          <input
                            type="password"
                            value={paymentForm.cvv}
                            onChange={(e) => setPaymentForm({ ...paymentForm, cvv: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                            placeholder="123"
                            required
                          />
                        </div>
                      </div>
                    )}

                    {selectedMethod === 'upi' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Appointment ID
                        </label>
                        <input
                          type="text"
                          value={paymentForm.appointmentId}
                          onChange={(e) => setPaymentForm({ ...paymentForm, appointmentId: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          placeholder="Enter appointment ID"
                          required
                        />
                        <label className="block text-sm font-medium text-gray-700 mb-2 mt-4">
                          UPI ID
                        </label>
                        <input
                          type="text"
                          value={paymentForm.upiId}
                          onChange={(e) => setPaymentForm({ ...paymentForm, upiId: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          placeholder="yourname@bank"
                          required
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Amount
                      </label>
                      <input
                        type="number"
                        value={paymentForm.amount}
                        onChange={(e) => setPaymentForm({ ...paymentForm, amount: e.target.value })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        placeholder="0.00"
                        required
                        min="0"
                        step="0.01"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={paymentLoading}
                      className={`w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white py-3 px-6 rounded-lg font-medium transition-all duration-200 hover:from-blue-600 hover:to-indigo-700 transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {paymentLoading ? 'Processing...' : 'Pay Now'}
                    </button>
                  </form>
                </div>
              )}

              {/* Methods Tab */}
              {activeTab === 'methods' && (
                <div className="space-y-4">
                  {methodsLoading ? (
                    <div className="p-6 text-center text-gray-500 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg">
                      Loading...
                    </div>
                  ) : (
                    <>
                      {paymentMethods.length === 0 && (
                        <div className="p-6 text-center text-gray-500 bg-white/90 backdrop-blur-sm rounded-xl shadow-lg">
                          No payment methods found.
                        </div>
                      )}
                      {paymentMethods.map((method) => (
                        <div
                          key={method.id}
                          className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg transition transform hover:shadow-xl hover:scale-[1.01]"
                        >
                          <PaymentMethodCard
                            method={method}
                            onRemove={() => handleRemoveMethod(method.id)}
                            onSetDefault={() => handleSetDefaultMethod(method.id)}
                          />
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          // Trigger your "Add New Payment Method" flow/modal
                          setToast({ type: 'warning', message: 'Add new payment method flow not implemented.' });
                        }}
                        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-4 px-6 rounded-xl font-medium transition-colors flex items-center justify-center space-x-2"
                      >
                        <Plus className="w-5 h-5" />
                        <span>Add New Payment Method</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Outstanding Balance */}
              <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-xl p-6 border border-red-200 shadow-lg transition transform hover:shadow-xl">
                <h3 className="text-lg font-semibold text-red-900 mb-4">Outstanding Balance</h3>
                {outstandingLoading ? (
                  <div className="text-gray-500">Loading...</div>
                ) : outstandingBalance ? (
                  <>
                    <div className="text-3xl font-bold text-red-600 mb-4">
                      ₹{outstandingBalance.total}
                    </div>
                    <div className="space-y-2">
                      {outstandingBalance.items.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="text-gray-700">{item.description}</span>
                          <span className="font-medium">₹{item.amount}</span>
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={handlePayAllOutstanding}
                      disabled={paymentLoading || outstandingBalance.items.length === 0}
                      className="w-full mt-4 bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {paymentLoading ? 'Processing...' : 'Pay All Outstanding'}
                    </button>
                  </>
                ) : (
                  <div className="text-gray-500">No outstanding balance.</div>
                )}
              </div>

              {/* Quick Stats */}
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-6 shadow-lg transition transform hover:shadow-xl">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">This Month</h3>
                {/* These stats can be fetched from backend if available. For now placeholder */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Successful Payments</p>
                      <p className="font-semibold">--</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <DollarSign className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total Spent</p>
                      <p className="font-semibold">--</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <Clock className="w-5 h-5 text-yellow-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Pending</p>
                      <p className="font-semibold">--</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      {toast && (
        <Toast
          type={toast.type}
          message={toast.message}
          onClose={() => setToast(null)}
        />
      )}
    </>
  );
};

export default PaymentsPage;
