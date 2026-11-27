import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { TopBar } from '../../components/TopBar';
import { Card, Btn, Badge, Modal, Input, Select } from '../../components/UIComponents';
import { ALLOWED_DEPARTMENTS } from '../../constants/departments';
import { ASSET_CATEGORIES } from '../../constants/assetCategories';
import { api } from '../../api';
import { Plus, Search, Eye, Filter, UploadCloud, FileText, RefreshCw, AlertCircle } from 'lucide-react';

const STATUS_OPTIONS = [
  'All', 'Pending', 'Under Review', 'Quotation Requested', 'Quotation Received',
  'Awaiting Approval', 'Approved', 'Rejected', 'Order Placed', 'Partially Delivered', 'Delivered', 'Completed'
];
const PRIORITY_OPTIONS = ['All', 'Low', 'Medium', 'High', 'Urgent'];
const FURNITURE_SUBCATEGORIES = Object.keys(ASSET_CATEGORIES.Furniture?.subCategories || {});

export const PurchaseRequests = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser } = useSelector((state) => state.auth);

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [department, setDepartment] = useState('All');
  const [status, setStatus] = useState(searchParams.get('status') || 'All');
  const [priority, setPriority] = useState('All');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [search, setSearch] = useState('');

  // Modal state
  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [form, setForm] = useState({
    department: currentUser?.role === 'deptadmin' ? currentUser.department : ALLOWED_DEPARTMENTS[0],
    furniture_name: '',
    furniture_category: FURNITURE_SUBCATEGORIES[0] || 'Chair',
    sub_category: '',
    quantity: 10,
    specifications: '',
    reason: '',
    preferred_delivery_date: '',
    priority: 'Medium',
    supporting_documents: [],
  });

  const isDeptAdmin = currentUser?.role === 'deptadmin';
  const isAuditor = currentUser?.role === 'auditor';
  const canCreate = ['deptadmin', 'furniture_admin', 'superadmin'].includes(currentUser?.role);

  const loadRequests = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getPurchaseRequests({
        department,
        status,
        priority,
        from: fromDate,
        to: toDate,
        search,
      });
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load purchase requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [department, status, priority, fromDate, toDate]);

  if (!currentUser) return null;

  const handleFileAttach = (e) => {
    const files = Array.from(e.target.files || []);
    const docs = files.map((f) => ({
      name: f.name,
      size: `${Math.max(1, Math.round(f.size / 1024))} KB`,
      uploadedAt: new Date().toISOString().slice(0, 10),
    }));
    setForm((prev) => ({
      ...prev,
      supporting_documents: [...prev.supporting_documents, ...docs],
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    if (!form.furniture_name.trim() || !form.reason.trim() || Number(form.quantity) < 1) {
      setFormError('Please fill in furniture name, valid quantity, and reason for purchase.');
      return;
    }

    try {
      setSubmitting(true);
      const created = await api.createPurchaseRequest({
        ...form,
        department: isDeptAdmin ? currentUser.department : form.department,
        requested_by_name: currentUser.name,
      });
      setShowCreate(false);
      setForm({
        department: isDeptAdmin ? currentUser.department : ALLOWED_DEPARTMENTS[0],
        furniture_name: '',
        furniture_category: FURNITURE_SUBCATEGORIES[0] || 'Chair',
        sub_category: '',
        quantity: 10,
        specifications: '',
        reason: '',
        preferred_delivery_date: '',
        priority: 'Medium',
        supporting_documents: [],
      });
      await loadRequests();
      if (created?.id) {
        navigate(`/furniture-admin/purchase-requests/${created.id}`);
      }
    } catch (err) {
      setFormError(err.message || 'Failed to submit purchase request');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredRequests = requests.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.id?.toLowerCase().includes(q) ||
      r.furniture_name?.toLowerCase().includes(q) ||
      r.department?.toLowerCase().includes(q) ||
      r.requested_by_name?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-10">
      <TopBar
        title="Furniture Purchase Requests"
        subtitle={isDeptAdmin ? `${currentUser.department} Department Requisitions` : 'Departmental Requisition Intake & Coordination'}
        user={currentUser}
      />

      {/* Action & Filter Bar */}
      <Card className="p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Request ID, furniture item, department, requester..."
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
            />
          </div>
          <div className="flex items-center gap-2">
            <Btn size="sm" variant="secondary" onClick={loadRequests}>
              <RefreshCw size={14} /> Refresh
            </Btn>
            {canCreate && !isAuditor && (
              <Btn size="sm" onClick={() => setShowCreate(true)}>
                <Plus size={15} /> New Purchase Request
              </Btn>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          {!isDeptAdmin && (
            <Select
              label="Department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              options={['All', ...ALLOWED_DEPARTMENTS]}
              className="py-1.5 text-xs"
            />
          )}
          <Select
            label="Status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={STATUS_OPTIONS}
            className="py-1.5 text-xs"
          />
          <Select
            label="Priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            options={PRIORITY_OPTIONS}
            className="py-1.5 text-xs"
          />
          <Input
            label="From Date"
            type="date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="py-1.5 text-xs"
          />
          <Input
            label="To Date"
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="py-1.5 text-xs"
          />
        </div>
      </Card>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 text-xs font-semibold flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Requests Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                <th className="px-5 py-3.5">Request ID</th>
                <th className="px-5 py-3.5">Department</th>
                <th className="px-5 py-3.5">Furniture Item</th>
                <th className="px-5 py-3.5">Qty</th>
                <th className="px-5 py-3.5">Priority</th>
                <th className="px-5 py-3.5">Preferred Date</th>
                <th className="px-5 py-3.5">Quotes</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-5 py-10 text-center text-slate-400">Loading purchase requests...</td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-5 py-10 text-center text-slate-400">No purchase requests match your filters.</td>
                </tr>
              ) : (
                filteredRequests.map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => navigate(`/furniture-admin/purchase-requests/${r.id}`)}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 cursor-pointer transition"
                  >
                    <td className="px-5 py-3.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">{r.id}</td>
                    <td className="px-5 py-3.5 font-semibold text-slate-700 dark:text-slate-300">{r.department}</td>
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-800 dark:text-white">{r.furniture_name}</p>
                      <p className="text-[11px] text-slate-400">{r.furniture_category} • {r.requested_by_name}</p>
                    </td>
                    <td className="px-5 py-3.5 font-mono font-bold">{r.quantity}</td>
                    <td className="px-5 py-3.5"><Badge label={r.priority} /></td>
                    <td className="px-5 py-3.5 font-mono text-slate-500">
                      {r.preferred_delivery_date ? String(r.preferred_delivery_date).slice(0, 10) : 'Flexible'}
                    </td>
                    <td className="px-5 py-3.5 font-mono">
                      {r.quotations_received_count || 0}/{r.quotations_total_count || 0}
                    </td>
                    <td className="px-5 py-3.5"><Badge label={r.status} /></td>
                    <td className="px-5 py-3.5 text-right">
                      <Btn
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/furniture-admin/purchase-requests/${r.id}`);
                        }}
                      >
                        <Eye size={13} /> Details
                      </Btn>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Create Purchase Request Modal */}
      {showCreate && (
        <Modal title="Submit Furniture Purchase Request" onClose={() => setShowCreate(false)} defaultSize="max-w-2xl">
          <form onSubmit={handleCreate} className="space-y-4">
            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 text-rose-700 dark:text-rose-400 text-xs font-semibold">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {isDeptAdmin ? (
                <Input label="Department" value={currentUser.department} disabled />
              ) : (
                <Select
                  label="Department *"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  options={ALLOWED_DEPARTMENTS}
                />
              )}
              <Input label="Requested By" value={currentUser.name} disabled />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Furniture Name *"
                value={form.furniture_name}
                onChange={(e) => setForm({ ...form, furniture_name: e.target.value })}
                placeholder="e.g., Ergonomic Mesh Task Chairs"
                required
              />
              <Select
                label="Furniture Category *"
                value={form.furniture_category}
                onChange={(e) => setForm({ ...form, furniture_category: e.target.value })}
                options={FURNITURE_SUBCATEGORIES}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Quantity *"
                type="number"
                min={1}
                value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })}
                required
              />
              <Select
                label="Priority *"
                value={form.priority}
                onChange={(e) => setForm({ ...form, priority: e.target.value })}
                options={['Low', 'Medium', 'High', 'Urgent']}
              />
              <Input
                label="Preferred Delivery Date"
                type="date"
                value={form.preferred_delivery_date}
                onChange={(e) => setForm({ ...form, preferred_delivery_date: e.target.value })}
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase block mb-1.5">
                Specifications (Dimensions, Material, Finish)
              </label>
              <textarea
                rows={3}
                value={form.specifications}
                onChange={(e) => setForm({ ...form, specifications: e.target.value })}
                placeholder="Describe technical specs, frame gauge, material, ergonomics..."
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase block mb-1.5">
                Reason for Purchase *
              </label>
              <textarea
                rows={2}
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                placeholder="Explain departmental need, lab expansion, or replacement rationale..."
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase block mb-1.5">
                Supporting Documents
              </label>
              <label className="flex items-center justify-center gap-2 p-3 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 text-xs font-semibold text-slate-500">
                <UploadCloud size={16} /> Attach PDF, Spec Sheet, or Layout Approval
                <input type="file" multiple className="hidden" onChange={handleFileAttach} />
              </label>
              {form.supporting_documents.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {form.supporting_documents.map((doc, idx) => (
                    <span key={idx} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-xs font-semibold">
                      <FileText size={12} /> {doc.name} ({doc.size})
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Btn type="button" variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Btn>
              <Btn type="submit" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Purchase Request'}</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
