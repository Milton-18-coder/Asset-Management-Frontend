import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { TopBar } from '../../components/TopBar';
import { Card, Btn, Badge, Select } from '../../components/UIComponents';
import { api } from '../../api';
import { UserCheck, MessageSquare, RefreshCw } from 'lucide-react';

export const DealerAssignments = () => {
  const { currentUser } = useSelector((state) => state.auth);
  const [assignments, setAssignments] = useState([]);
  const [communications, setCommunications] = useState([]);
  const [typeFilter, setTypeFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      setLoading(true);
      const [asn, comm] = await Promise.all([
        api.getDealerAssignments({ assignment_type: typeFilter, status: statusFilter }),
        api.getDealerCommunications().catch(() => []),
      ]);
      setAssignments(Array.isArray(asn) ? asn : []);
      setCommunications(Array.isArray(comm) ? comm : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [typeFilter, statusFilter]);

  if (!currentUser) return null;

  return (
    <div className="space-y-6 pb-12">
      <TopBar
        title="Dealer Assignments & Activity Monitor"
        subtitle="Track All Dealer Tasks, Quotation Requests, Purchase Orders & Servicing Assignments"
        user={currentUser}
      />

      <Card className="p-4 flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <div className="w-48">
            <Select
              label="Assignment Type"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              options={['All', 'quotation_request', 'purchase_order', 'servicing']}
              className="py-1.5 text-xs"
            />
          </div>
          <div className="w-44">
            <Select
              label="Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              options={['All', 'Pending', 'Accepted', 'In Progress', 'Submitted', 'Completed', 'Declined']}
              className="py-1.5 text-xs"
            />
          </div>
        </div>
        <Btn size="sm" variant="secondary" onClick={loadData}><RefreshCw size={14} /> Refresh</Btn>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                <th className="px-5 py-3.5">Assignment ID</th>
                <th className="px-5 py-3.5">Type</th>
                <th className="px-5 py-3.5">Reference</th>
                <th className="px-5 py-3.5">Dealer</th>
                <th className="px-5 py-3.5">Notes / Dealer Response</th>
                <th className="px-5 py-3.5">Due Date</th>
                <th className="px-5 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {loading ? (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-400">Loading assignments...</td></tr>
              ) : assignments.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-400">No dealer assignments found.</td></tr>
              ) : (
                assignments.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition">
                    <td className="px-5 py-3.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">{a.id}</td>
                    <td className="px-5 py-3.5 uppercase text-[11px] font-bold">{a.assignment_type.replace('_', ' ')}</td>
                    <td className="px-5 py-3.5 font-mono font-semibold">{a.reference_id}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-white">{a.dealer_name}</td>
                    <td className="px-5 py-3.5 max-w-xs">
                      <p className="text-slate-600 dark:text-slate-300 truncate">{a.communication_notes || '—'}</p>
                      {a.dealer_response && <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-0.5">{a.dealer_response}</p>}
                    </td>
                    <td className="px-5 py-3.5 font-mono">{a.due_date ? String(a.due_date).slice(0, 10) : '—'}</td>
                    <td className="px-5 py-3.5"><Badge label={a.status} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white font-display mb-4 flex items-center gap-2">
          <MessageSquare size={16} className="text-indigo-600" /> Recent Dealer Communication Records
        </h3>
        {communications.length === 0 ? (
          <p className="text-xs text-slate-400">No communications logged yet.</p>
        ) : (
          <div className="space-y-3">
            {communications.slice(0, 15).map((c) => (
              <div key={c.id} className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <p className="font-bold text-slate-800 dark:text-white">
                    {c.dealer_name} • <span className="text-indigo-600 dark:text-indigo-400">[{c.channel}]</span> {c.subject}
                  </p>
                  <p className="text-slate-600 dark:text-slate-400 mt-0.5">{c.message}</p>
                </div>
                <div className="text-[10px] text-slate-400 sm:text-right flex-shrink-0">
                  <p className="font-semibold">{c.logged_by_name}</p>
                  <p className="font-mono">{String(c.created_at).slice(0, 16).replace('T', ' ')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
};
