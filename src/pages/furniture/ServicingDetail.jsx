import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { TopBar } from '../../components/TopBar';
import { Card, Btn, Badge, Modal, Input, Select } from '../../components/UIComponents';
import { setFurnitureList } from '../../store/furnitureSlice';
import { api } from '../../api';
import { ArrowLeft, Wrench, CheckCircle2, UserCheck, Send, Clock, ShieldCheck } from 'lucide-react';

export const ServicingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { currentUser } = useSelector((state) => state.auth);

  const [detail, setDetail] = useState(null);
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  // Action states
  const [assignDealerId, setAssignDealerId] = useState('');
  const [assignNotes, setAssignNotes] = useState('');

  const [estimateCost, setEstimateCost] = useState('');
  const [techName, setTechName] = useState('');
  const [techPhone, setTechPhone] = useState('');
  const [progressNotes, setProgressNotes] = useState('');

  const [showVerify, setShowVerify] = useState(false);
  const [verifyCondition, setVerifyCondition] = useState('Good');
  const [verifyCost, setVerifyCost] = useState('');
  const [verifyRemarks, setVerifyRemarks] = useState('');

  const isFurnitureAdmin = currentUser?.role === 'furniture_admin';
  const isSuperAdmin = currentUser?.role === 'superadmin';
  const canManage = isFurnitureAdmin || isSuperAdmin;

  const notify = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4500);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      const sr = await api.getServiceRequestById(id);
      setDetail(sr);
      setEstimateCost(sr.estimated_cost || '');
      setTechName(sr.technician_name || '');
      setTechPhone(sr.technician_phone || '');
      setProgressNotes(sr.progress_notes || '');
      setVerifyCost(sr.actual_cost || sr.estimated_cost || 0);

      if (canManage) {
        const dList = await api.getDealers().catch(() => []);
        setDealers(Array.isArray(dList) ? dList : []);
        if (dList.length > 0 && !assignDealerId) setAssignDealerId(sr.assigned_dealer_id || dList[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  if (!currentUser) return null;

  const handleAssignDealer = async (e) => {
    e.preventDefault();
    try {
      await api.assignServiceDealer(id, { dealerId: assignDealerId, requestQuotation: true, notes: assignNotes });
      setAssignNotes('');
      notify('Dealer assigned to servicing request.');
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSubmitEstimate = async (e) => {
    e.preventDefault();
    try {
      await api.submitServiceEstimate(id, {
        estimated_cost: estimateCost,
        technician_name: techName,
        technician_phone: techPhone,
        notes: progressNotes,
      });
      notify('Servicing estimate recorded.');
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleForwardApproval = async () => {
    try {
      await api.forwardServiceForApproval(id, { remarks: progressNotes || 'Forwarded servicing estimate for Super Admin approval.' });
      notify('Servicing estimate forwarded to Super Admin for approval.');
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdateProgress = async (newStatus) => {
    try {
      await api.updateServiceProgress(id, {
        status: newStatus,
        technician_name: techName,
        technician_phone: techPhone,
        progress_notes: progressNotes,
      });
      notify(`Servicing status updated to ${newStatus}.`);
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    try {
      await api.verifyServiceCompletion(id, {
        furniture_condition_after: verifyCondition,
        actual_cost: verifyCost,
        servicing_remarks: verifyRemarks,
      });
      setShowVerify(false);
      notify('Servicing verified! Asset condition & maintenance logs updated.');
      await loadData();

      api.getAssets().then((assets) => {
        if (Array.isArray(assets)) dispatch(setFurnitureList(assets));
      }).catch(() => {});
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <div className="p-8 text-center text-sm text-slate-400">Loading servicing details...</div>;
  if (!detail) return <Card className="p-6 text-sm text-rose-600">Service request not found.</Card>;

  return (
    <div className="space-y-6 pb-12">
      <TopBar
        title={`Servicing Request ${detail.id}`}
        subtitle={`${detail.furniture_name} (${detail.furniture_asset_id}) • ${detail.department}`}
        user={currentUser}
      />

      {toast && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 size={16} /> {toast}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Btn size="sm" variant="secondary" onClick={() => navigate('/furniture-admin/servicing')}>
          <ArrowLeft size={14} /> All Servicing Requests
        </Btn>
        <div className="flex items-center gap-2">
          <Badge label={detail.priority} />
          <Badge label={detail.status} />
          {canManage && ['Completed', 'In Progress'].includes(detail.status) && (
            <Btn size="sm" onClick={() => setShowVerify(true)}>
              <ShieldCheck size={14} /> Verify Completed Servicing
            </Btn>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2 space-y-5">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold">Asset ID</p>
              <p className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{detail.furniture_asset_id}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold">Location</p>
              <p className="font-bold text-slate-800 dark:text-white">{detail.furniture_location || '—'}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold">Assigned Dealer</p>
              <p className="font-bold text-slate-800 dark:text-white">{detail.assigned_dealer_name || 'Unassigned'}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-bold">Estimated / Actual Cost</p>
              <p className="font-mono font-bold">
                ₹{Number(detail.actual_cost || detail.estimated_cost || 0).toLocaleString('en-IN')}
              </p>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs">
            <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Reported Issue Description</p>
            <p className="text-slate-800 dark:text-slate-200 leading-relaxed">{detail.issue_description}</p>
          </div>

          {detail.issue_images?.length > 0 && (
            <div className="text-xs">
              <p className="text-[10px] text-slate-400 uppercase font-bold mb-1">Issue Attachments</p>
              <div className="flex flex-wrap gap-2">
                {detail.issue_images.map((img, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 font-semibold">{img.name}</span>
                ))}
              </div>
            </div>
          )}

          {/* Furniture Admin Controls */}
          {canManage && detail.status !== 'Verified' && (
            <div className="space-y-5 pt-4 border-t border-slate-100 dark:border-slate-800">
              {/* Step 1: Assign Dealer */}
              <form onSubmit={handleAssignDealer} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Assign Dealer</label>
                  <select
                    value={assignDealerId}
                    onChange={(e) => setAssignDealerId(e.target.value)}
                    className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  >
                    {dealers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <Input label="Assignment Notes" value={assignNotes} onChange={(e) => setAssignNotes(e.target.value)} placeholder="Request inspection & quote" className="py-2 text-xs" />
                <Btn type="submit" size="sm"><UserCheck size={14} /> Assign & Request Quote</Btn>
              </form>

              {/* Step 2: Estimate, Technician & Approval */}
              <form onSubmit={handleSubmitEstimate} className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
                <Input label="Estimated Cost (₹)" type="number" min={0} value={estimateCost} onChange={(e) => setEstimateCost(e.target.value)} className="py-2 text-xs" />
                <Input label="Technician Name" value={techName} onChange={(e) => setTechName(e.target.value)} className="py-2 text-xs" />
                <Input label="Technician Phone" value={techPhone} onChange={(e) => setTechPhone(e.target.value)} className="py-2 text-xs" />
                <div className="sm:col-span-3">
                  <Input label="Servicing / Progress Notes" value={progressNotes} onChange={(e) => setProgressNotes(e.target.value)} className="py-2 text-xs" />
                </div>
                <div className="sm:col-span-3 flex flex-wrap gap-2 justify-end">
                  <Btn type="submit" size="sm" variant="secondary">Save Estimate & Tech Details</Btn>
                  {['Pending', 'Under Review', 'Dealer Assigned', 'Quotation Awaited'].includes(detail.status) && (
                    <Btn type="button" size="sm" onClick={handleForwardApproval}>
                      <Send size={13} /> Forward for Super Admin Approval
                    </Btn>
                  )}
                  {detail.status === 'Approved' && (
                    <Btn type="button" size="sm" onClick={() => handleUpdateProgress('In Progress')}>
                      <Wrench size={13} /> Mark In Progress
                    </Btn>
                  )}
                  {detail.status === 'In Progress' && (
                    <Btn type="button" size="sm" onClick={() => handleUpdateProgress('Completed')}>
                      Mark Completed
                    </Btn>
                  )}
                </div>
              </form>
            </div>
          )}

          {detail.status === 'Verified' && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 text-xs space-y-1">
              <p className="font-bold text-emerald-700 dark:text-emerald-300">Verified by {detail.verified_by}</p>
              <p className="text-emerald-600 dark:text-emerald-400">
                Condition After Servicing: <strong>{detail.furniture_condition_after}</strong> • Maintenance Log: <span className="font-mono">{detail.maintenance_log_id}</span>
              </p>
              {detail.servicing_remarks && <p className="text-slate-600 dark:text-slate-300">{detail.servicing_remarks}</p>}
            </div>
          )}
        </Card>

        {/* Status Timeline */}
        <Card className="p-6">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white font-display mb-4 flex items-center gap-2">
            <Clock size={15} className="text-indigo-600" /> Servicing History & Timeline
          </h3>
          <div className="space-y-4">
            {(detail.statusHistory || []).map((h) => (
              <div key={h.id} className="relative pl-5 border-l-2 border-indigo-200 dark:border-indigo-900/60">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 absolute -left-[6px] top-1" />
                <div className="flex items-center justify-between gap-2">
                  <Badge label={h.new_status} />
                  <span className="text-[10px] font-mono text-slate-400">{String(h.created_at).slice(0, 16).replace('T', ' ')}</span>
                </div>
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1">{h.remarks}</p>
                <p className="text-[10px] text-slate-400">By {h.changed_by_name}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Asset Servicing & Maintenance History */}
      <Card className="p-6">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white font-display mb-3">
          Complete Servicing History for Asset {detail.furniture_asset_id}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 uppercase">
                <th className="pb-2">Record ID</th>
                <th className="pb-2">Type</th>
                <th className="pb-2">Dealer / Vendor</th>
                <th className="pb-2">Date</th>
                <th className="pb-2">Cost</th>
                <th className="pb-2">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {(detail.assetServiceHistory || []).map((s) => (
                <tr key={s.id}>
                  <td className="py-2.5 font-mono font-bold text-indigo-600">{s.id}</td>
                  <td className="py-2.5">Service Request</td>
                  <td className="py-2.5">{s.assigned_dealer_name || '—'}</td>
                  <td className="py-2.5 font-mono">{String(s.request_date).slice(0, 10)}</td>
                  <td className="py-2.5 font-mono">₹{Number(s.actual_cost || s.estimated_cost || 0).toLocaleString('en-IN')}</td>
                  <td className="py-2.5"><Badge label={s.status} /></td>
                </tr>
              ))}
              {(detail.maintenanceLogs || []).map((m) => (
                <tr key={m.id}>
                  <td className="py-2.5 font-mono font-bold text-emerald-600">{m.id}</td>
                  <td className="py-2.5">Maintenance Log</td>
                  <td className="py-2.5">{m.vendor || '—'}</td>
                  <td className="py-2.5 font-mono">{String(m.completedDate || m.scheduledDate || '').slice(0, 10)}</td>
                  <td className="py-2.5 font-mono">₹{Number(m.cost || 0).toLocaleString('en-IN')}</td>
                  <td className="py-2.5"><Badge label={m.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {showVerify && (
        <Modal title={`Verify Completed Servicing — ${detail.id}`} onClose={() => setShowVerify(false)}>
          <form onSubmit={handleVerify} className="space-y-4">
            <Select
              label="Updated Furniture Condition *"
              value={verifyCondition}
              onChange={(e) => setVerifyCondition(e.target.value)}
              options={['Good', 'Fair', 'Poor', 'Damaged']}
            />
            <Input
              label="Final Servicing Cost (₹) *"
              type="number"
              min={0}
              value={verifyCost}
              onChange={(e) => setVerifyCost(e.target.value)}
              required
            />
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase block mb-1">Verification Remarks</label>
              <textarea
                rows={3}
                value={verifyRemarks}
                onChange={(e) => setVerifyRemarks(e.target.value)}
                placeholder="Confirm repair quality, replaced parts, and asset readiness..."
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Btn type="button" variant="secondary" onClick={() => setShowVerify(false)}>Cancel</Btn>
              <Btn type="submit">Verify & Sync Maintenance Logs</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
