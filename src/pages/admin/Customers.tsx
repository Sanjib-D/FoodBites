import React, { useEffect, useState } from 'react';
import { InlineLoader } from '../../components/Loader';

export function Customers() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const res = await fetch('/api/admin/customers', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await res.json();
        setCustomers(data);
      } catch(err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCustomers();
  }, []);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex justify-between items-center">
        <h2 className="text-xl font-bold text-slate-800">Customers Directory</h2>
        <span className="text-sm text-slate-500 bg-slate-50 px-3 py-1 rounded-full border border-slate-200">
          Showing previous customers for promotion
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase">
            <tr>
              <th className="px-6 py-3 font-semibold">Name</th>
              <th className="px-6 py-3 font-semibold">Email</th>
              <th className="px-6 py-3 font-semibold">Phone</th>
              <th className="px-6 py-3 font-semibold">Address</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {loading ? (
              <tr><td colSpan={4}><InlineLoader text="Loading customers..." /></td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan={4} className="text-center py-8 text-slate-400">No registered customers yet</td></tr>
            ) : (
              customers.map(cust => (
                <tr key={cust._id}>
                  <td className="px-6 py-4 font-medium">{cust.name}</td>
                  <td className="px-6 py-4">{cust.email}</td>
                  <td className="px-6 py-4">{cust.phone || '-'}</td>
                  <td className="px-6 py-4">{cust.address || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
