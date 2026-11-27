import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../../components/TopBar';
import { Card, Btn, Badge, Modal, Input } from '../../components/UIComponents';
import { api } from '../../api';
import { CheckCircle2, XCircle, ShieldAlert, Clock, RefreshCw, Eye } from 'lucide-react';

export const Approvals = () => {
  const navigate = useNavigate();
  const { currentUser } = useSelector((state) => state.auth);
  const [data, setData] = useState({ pendingPurchaseRequests: [], pendingServiceRequests: [], pendingPurchaseOrders: [], history: [] });
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  const [decisionModal, setDecisionModal] = useState(null); // { entityType, entityId, title, decision }
  const [remarks, setRemarks] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const isSuperAdmin = currentUser?.role === 'superadmin';

  const loadApprovals = async () => {
    try {
      setLoading(true);
      const res = await api.getApprovals();
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApprovals();
  }, []);

  if (!currentUser) return null;

  const openDecision = (entityType, entityId, title, decision) => {
    setDecisionModal({ entityType, entityId, title, decision });
    setRemarks('');
    setRejectionReason('');
  };

  const handleDecisionSubmit = async (e) => {
    e.preventDefault();
    if (!decisionModal) return;
    try {
      setSubmitting(true);
      await api.submitApprovalDecision({
        entityType: decisionModal.entityType,
        entityId: decisionModal.entityId,
        decision: decisionModal.decision,
        approvalRemarks: remarks,
        rejectionReason,
      });
      setToast(`${decisionModal.entityId} ${decisionModal.decision.toLowerCase()} successfully.`);
      setTimeout(() => setToast(''), 4000);
      setDecisionModal(null);
      await loadApprovals();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const totalPending =
    (data.pendingPurchaseRequests?.length || 0) +
    (data.pendingServiceRequests?.length || 0) +
    (data.pendingPurchaseOrders?.length || 0);

  return (
    <div className="space-y-6 pb-12">
      <TopBar
        title="Procurement & Servicing Approvals"
        subtitle="Centralized Super Admin Approval Queue & Transaction History"
        user={currentUser}
      />

      {toast && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 size={16} /> {toast}
        </div>
      )}

      {!isSuperAdmin && (
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-300 text-xs font-semibold flex items-center gap-2">
          <ShieldAlert size={16} />
          Final approval authority rests strictly with Super Admin. You can view pending recommendations and approval audit history below.
        </div>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
          Pending Super Admin Decisions: <span className="font-mono text-indigo-600 dark:text-indigo-400">{totalPending}</span>
        </p>
        <Btn size="sm" variant="secondary" onClick={loadApprovals}><RefreshCw size={14} /> Refresh</Btn>
      </div>

      {/* Pending Purchase Recommendations */}
      <Card className="p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white font-display">
          Pending Purchase Recommendations ({data.pendingPurchaseRequests?.length || 0})
        </h3>
        {loading ? (
          <p className="text-xs text-slate-400">Loading...</p>
        ) : (data.pendingPurchaseRequests || []).length === 0 ? (
          <p className="text-xs text-slate-400">No purchase recommendations awaiting approval.</p>
        ) : (
          <div className="space-y-3">
            {data.pendingPurchaseRequests.map((pr) => (
              <div key={pr.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">{pr.id}</span>
                    <Badge label={pr.priority} />
                    <Badge label={pr.status} />
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {pr.furniture_name} (Qty: {pr.quantity}) — {pr.department}
                  </p>
                  <p className="text-xs text-slate-500">
                    Recommended Dealer: <strong className="text-slate-700 dark:text-slate-200">{pr.dealer_name || 'N/A'}</strong> •
                    Amount: <strong className="font-mono text-indigo-600 dark:text-indigo-400">₹{Number(pr.recommended_amount || 0).toLocaleString('en-IN')}</strong> •
                    Warranty: {pr.warranty_period || '—'}
                  </p>
                  {pr.internal_remarks && <p className="text-[11px] text-slate-500 italic">"{pr.internal_remarks}"</p>}
                </div>
                <div className="flex items-center gap-2">
                  <Btn size="sm" variant="secondary" onClick={() => navigate(`/furniture-admin/purchase-requests/${pr.id}`)}>
                    <Eye size={13} /> Inspect
                  </Btn>
                  {isSuperAdmin && (
                    <>
                      <Btn size="sm" onClick={() => openDecision('purchase_request', pr.id, `${pr.id} — ${pr.furniture_name}`, 'Approved')}>
                        <CheckCircle2 size={14} /> Approve
                      </Btn>
                      <Btn size="sm" variant="danger" onClick={() => openDecision('purchase_request', pr.id, `${pr.id} — ${pr.furniture_name}`, 'Rejected')}>
                        <XCircle size={14} /> Reject
                      </Btn>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Pending Servicing Estimate Approvals */}
      <Card className="p-6 space-y-4">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white font-display">
          Pending Servicing Cost Estimates ({data.pendingServiceRequests?.length || 0})
        </h3>
        {(data.pendingServiceRequests || []).length === 0 ? (
          <p className="text-xs text-slate-400">No servicing estimates awaiting approval.</p>
        ) : (
          <div className="space-y-3">
            {data.pendingServiceRequests.map((sr) => (
              <div key={sr.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-600 dark:text-indigo-400">{sr.id}</span>
                    <Badge label={sr.priority} />
                    <Badge label={sr.status} />
                  </div>
                  <p className="text-sm font-bold text-slate-900 dark:text-white">
                    {sr.furniture_name} ({sr.furniture_asset_id}) — {sr.department}
                  </p>
                  <p className="text-xs text-slate-500">
                    Assigned Dealer: <strong>{sr.assigned_dealer_name || 'N/A'}</strong> •
                    Estimated Cost: <strong className="font-mono text-indigo-600 dark:text-indigo-400">₹{Number(sr.estimated_cost || 0).toLocaleString('en-IN')}</strong>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Btn size="sm" variant="secondary" onClick={() => navigate(`/furniture-admin/servicing/${sr.id}`)}>
                    <Eye size={13} /> Inspect
                  </Btn>
                  {isSuperAdmin && (
                    <>
                      <Btn size="sm" onClick={() => openDecision('service_request', sr.id, `${sr.id} — ${sr.furniture_name}`, 'Approved')}>
                        <CheckCircle2 size={14} /> Approve
                      </Btn>
                      <Btn size="sm" variant="danger" onClick={() => openDecision('service_request', sr.id, `${sr.id} — ${sr.furniture_name}`, 'Rejected')}>
                        <XCircle size={14} /> Reject
                      </Btn>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Approval Transaction History */}
      <Card className="p-6">
        <h3 className="text-sm font-bold text-slate-800 dark:text-white font-display mb-4 flex items-center gap-2">
          <Clock size={15} className="text-indigo-600" /> Approval Transaction History
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider">
                <th className="pb-2.5">Entity</th>
                <th className="pb-2.5">Dealer</th>
                <th className="pb-2.5">Amount</th>
                <th className="pb-2.5">Action</th>
                <th className="pb-2.5">Approved/Reviewed By</th>
                <th className="pb-2.5">Date</th>
                <th className="pb-2.5">Remarks / Rejection Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {(data.history || []).map((h) => (
                <tr key={h.id}>
                  <td className="py-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">
                    {h.entity_id} <span className="text-[10px] text-slate-400 block">{h.entity_type}</span>
                  </td>
                  <td className="py-3 font-semibold">{h.recommended_dealer_name || '—'}</td>
                  <td className="py-3 font-mono">₹{Number(h.estimated_amount || 0).toLocaleString('en-IN')}</td>
                  <td className="py-3"><Badge label={h.action} /></td>
                  <td className="py-3">{h.approved_by_name || h.submitted_by_name}</td>
                  <td className="py-3 font-mono">{String(h.approval_date || h.created_at).slice(0, 10)}</td>
                  <td className="py-3 max-w-xs text-slate-600 dark:text-slate-400">{h.rejection_reason || h.approval_remarks || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {decisionModal && (
        <Modal
          title={`${decisionModal.decision === 'Approved' ? 'Approve' : 'Reject'} — ${decisionModal.title}`}
          onClose={() => setDecisionModal(null)}
        >
          <form onSubmit={handleDecisionSubmit} className="space-y-4">
            {decisionModal.decision === 'Rejected' && (
              <div>
                <label className="text-xs font-semibold text-rose-600 uppercase block mb-1">Rejection Reason *</label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Provide clear justification for rejecting this recommendation..."
                  className="w-full px-3.5 py-2.5 text-sm border border-rose-200 dark:border-rose-900 rounded-xl bg-white dark:bg-slate-900"
                  required
                />
              </div>
            )}
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase block mb-1">Approval Remarks</label>
              <textarea
                rows={2}
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Optional administrative instructions..."
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Btn type="button" variant="secondary" onClick={() => setDecisionModal(null)}>Cancel</Btn>
              <Btn type="submit" variant={decisionModal.decision === 'Rejected' ? 'danger' : 'primary'} disabled={submitting}>
                {submitting ? 'Processing...' : `Confirm ${decisionModal.decision}`}
              </Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
