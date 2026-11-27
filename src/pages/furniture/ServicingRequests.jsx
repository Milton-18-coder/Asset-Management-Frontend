import React, { useState, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { TopBar } from '../../components/TopBar';
import { Card, Btn, Badge, Modal, Input, Select } from '../../components/UIComponents';
import { ALLOWED_DEPARTMENTS } from '../../constants/departments';
import { api } from '../../api';
import { Plus, Search, Eye, UploadCloud, Wrench, RefreshCw } from 'lucide-react';

const SERVICE_STATUSES = [
  'All', 'Pending', 'Under Review', 'Dealer Assigned', 'Quotation Awaited',
  'Awaiting Approval', 'Approved', 'In Progress', 'Completed', 'Verified', 'Rejected', 'Cancelled'
];

export const ServicingRequests = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser } = useSelector((state) => state.auth);
  const assetsList = useSelector((state) => state.furniture.list || []);

  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [department, setDepartment] = useState('All');
  const [status, setStatus] = useState(searchParams.get('status') || 'All');
  const [search, setSearch] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    department: currentUser?.role === 'deptadmin' ? currentUser.department : ALLOWED_DEPARTMENTS[0],
    furniture_asset_id: '',
    furniture_name: '',
    furniture_location: '',
    issue_description: '',
    priority: 'Medium',
    request_date: new Date().toISOString().slice(0, 10),
    issue_images: [],
  });

  const isDeptAdmin = currentUser?.role === 'deptadmin';
  const isAuditor = currentUser?.role === 'auditor';
  const canCreate = ['deptadmin', 'furniture_admin', 'superadmin'].includes(currentUser?.role);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await api.getServiceRequests({ department, status, search });
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, [department, status]);

  const deptFurnitureAssets = useMemo(() => {
    const targetDept = isDeptAdmin ? currentUser?.department : form.department;
    return assetsList.filter(
      (a) => a.mainCategory === 'Furniture' && (!targetDept || a.department === targetDept)
    );
  }, [assetsList, isDeptAdmin, currentUser, form.department]);

  if (!currentUser) return null;

  const handleAssetPick = (assetId) => {
    const asset = assetsList.find((a) => a.id === assetId);
    setForm((prev) => ({
      ...prev,
      furniture_asset_id: assetId,
      furniture_name: asset ? asset.name : '',
      furniture_location: asset ? `${asset.building || ''} • ${asset.room || ''}` : '',
    }));
  };

  const handleImageAttach = (e) => {
    const files = Array.from(e.target.files || []);
    const imgs = files.map((f) => ({
      name: f.name,
      size: `${Math.max(1, Math.round(f.size / 1024))} KB`,
    }));
    setForm((prev) => ({ ...prev, issue_images: [...prev.issue_images, ...imgs] }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      const created = await api.createServiceRequest({
        ...form,
        department: isDeptAdmin ? currentUser.department : form.department,
        requested_by_name: currentUser.name,
      });
      setShowCreate(false);
      await loadRequests();
      if (created?.id) navigate(`/furniture-admin/servicing/${created.id}`);
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = requests.filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.id?.toLowerCase().includes(q) ||
      r.furniture_name?.toLowerCase().includes(q) ||
      r.furniture_asset_id?.toLowerCase().includes(q) ||
      r.department?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-12">
      <TopBar
        title="Furniture Servicing & Repairs"
        subtitle={isDeptAdmin ? `${currentUser.department} Furniture Servicing Requests` : 'Coordinate Furniture Repairs, Dealer Servicing & Verification'}
        user={currentUser}
      />

      <Card className="p-4 flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3 flex-1">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Service ID, Asset ID, Furniture..."
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900"
            />
          </div>
          {!isDeptAdmin && (
            <div className="w-44">
              <Select label="Department" value={department} onChange={(e) => setDepartment(e.target.value)} options={['All', ...ALLOWED_DEPARTMENTS]} className="py-1.5 text-xs" />
            </div>
          )}
          <div className="w-44">
            <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)} options={SERVICE_STATUSES} className="py-1.5 text-xs" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Btn size="sm" variant="secondary" onClick={loadRequests}><RefreshCw size={14} /> Refresh</Btn>
          {canCreate && !isAuditor && (
            <Btn size="sm" onClick={() => setShowCreate(true)}><Plus size={15} /> New Servicing Request</Btn>
          )}
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                <th className="px-5 py-3.5">Service ID</th>
                <th className="px-5 py-3.5">Asset & Location</th>
                <th className="px-5 py-3.5">Department</th>
                <th className="px-5 py-3.5">Assigned Dealer</th>
                <th className="px-5 py-3.5">Est. Cost</th>
                <th className="px-5 py-3.5">Priority</th>
                <th className="px-5 py-3.5">Request Date</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {loading ? (
                <tr><td colSpan={9} className="px-5 py-10 text-center text-slate-400">Loading servicing requests...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="px-5 py-10 text-center text-slate-400">No servicing requests found.</td></tr>
              ) : (
                filtered.map((sr) => (
                  <tr
                    key={sr.id}
                    onClick={() => navigate(`/furniture-admin/servicing/${sr.id}`)}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 cursor-pointer transition"
                  >
                    <td className="px-5 py-3.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">{sr.id}</td>
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-800 dark:text-white">{sr.furniture_name}</p>
                      <p className="text-[11px] text-slate-400">{sr.furniture_asset_id} • {sr.furniture_location}</p>
                    </td>
                    <td className="px-5 py-3.5 font-semibold">{sr.department}</td>
                    <td className="px-5 py-3.5">{sr.assigned_dealer_name || <span className="text-slate-400 italic">Unassigned</span>}</td>
                    <td className="px-5 py-3.5 font-mono">
                      {Number(sr.actual_cost || sr.estimated_cost) > 0
                        ? `₹${Number(sr.actual_cost || sr.estimated_cost).toLocaleString('en-IN')}`
                        : '—'}
                    </td>
                    <td className="px-5 py-3.5"><Badge label={sr.priority} /></td>
                    <td className="px-5 py-3.5 font-mono">{String(sr.request_date).slice(0, 10)}</td>
                    <td className="px-5 py-3.5"><Badge label={sr.status} /></td>
                    <td className="px-5 py-3.5 text-right">
                      <Btn size="sm" variant="secondary" onClick={(e) => { e.stopPropagation(); navigate(`/furniture-admin/servicing/${sr.id}`); }}>
                        <Eye size={13} /> Manage
                      </Btn>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {showCreate && (
        <Modal title="Submit Furniture Servicing Request" onClose={() => setShowCreate(false)} defaultSize="max-w-xl">
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {isDeptAdmin ? (
                <Input label="Department" value={currentUser.department} disabled />
              ) : (
                <Select
                  label="Department *"
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value, furniture_asset_id: '', furniture_name: '' })}
                  options={ALLOWED_DEPARTMENTS}
                />
              )}
              <Input label="Requested By" value={currentUser.name} disabled />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase">Select Furniture Asset *</label>
              <select
                value={form.furniture_asset_id}
                onChange={(e) => handleAssetPick(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900"
                required
              >
                <option value="">Choose a furniture asset...</option>
                {deptFurnitureAssets.map((a) => (
                  <option key={a.id} value={a.id}>{a.id} — {a.name} ({a.room})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Furniture Location" value={form.furniture_location} onChange={(e) => setForm({ ...form, furniture_location: e.target.value })} />
              <Select label="Priority" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} options={['Low', 'Medium', 'High', 'Urgent']} />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase block mb-1">Issue Description *</label>
              <textarea
                rows={3}
                value={form.issue_description}
                onChange={(e) => setForm({ ...form, issue_description: e.target.value })}
                placeholder="Describe damage, structural defect, broken hinges, hydraulic failure..."
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900"
                required
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase block mb-1">Issue Images</label>
              <label className="flex items-center justify-center gap-2 p-3 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer text-xs font-semibold text-slate-500">
                <UploadCloud size={15} /> Attach Photos ({form.issue_images.length} selected)
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageAttach} />
              </label>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Btn type="button" variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Btn>
              <Btn type="submit" disabled={submitting}>{submitting ? 'Submitting...' : 'Submit Servicing Request'}</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
