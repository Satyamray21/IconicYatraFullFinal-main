import React, { useState, useEffect } from 'react';
import axios from '../../utils/axios';

const TenantsList = () => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    address: '',
    domain: '',
    adminEmail: '',
    adminPassword: ''
  });

  const fetchTenants = async () => {
    try {
      const { data } = await axios.get('/company');
      setTenants(data.data || []);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching tenants:", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // The API endpoint handles creating both the Company and the Admin Staff
      await axios.post('/company', formData);
      setShowModal(false);
      setFormData({ companyName: '', address: '', domain: '', adminEmail: '', adminPassword: '' });
      fetchTenants();
      alert("Tenant created successfully!");
    } catch (error) {
      alert("Error creating tenant: " + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">SaaS Super Admin: Tenants</h1>
        <button 
          onClick={() => setShowModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          + Provision New Tenant
        </button>
      </div>

      {loading ? (
        <p>Loading tenants...</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Company Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Domain</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created At</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {tenants.map(tenant => (
                <tr key={tenant._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tenant.companyName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{tenant.domain || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(tenant.createdAt).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
              {tenants.length === 0 && (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">No tenants found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE TENANT MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Provision New Tenant</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
                &times;
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                <input required type="text" name="companyName" value={formData.companyName} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="e.g. Dream Travels" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company Address *</label>
                <input required type="text" name="address" value={formData.address} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="e.g. 123 Main St, NY" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tenant Domain *</label>
                <input required type="text" name="domain" value={formData.domain} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="e.g. agency-test.com" />
              </div>
              <hr className="my-4" />
              <h3 className="text-md font-semibold text-gray-800">Initial Admin User</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin Email *</label>
                <input required type="email" name="adminEmail" value={formData.adminEmail} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="admin@domain.com" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Admin Password *</label>
                <input required type="password" name="adminPassword" value={formData.adminPassword} onChange={handleChange} className="w-full border border-gray-300 rounded-md px-3 py-2" placeholder="********" />
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Provision Tenant</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TenantsList;
