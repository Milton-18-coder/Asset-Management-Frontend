import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { TopBar } from '../../components/TopBar';
import { Card, Btn, Badge, Modal, Input, Select } from '../../components/UIComponents';
import { api } from '../../api';
import {
  ArrowLeft, FileText, Store, Send, Scale, CheckCircle2, MessageSquare,
  ShoppingBag, Clock, AlertCircle, Star
} from 'lucide-react';

export const PurchaseRequestDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useSelector((state) => state.auth);

  const [detail, setDetail] = useState(null);
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  // Action states
  const [remarks, setRemarks] = useState('');
  const [infoNote, setInfoNote] = useState('');
  const [deptReply, setDeptReply] = useState('');
  const [nextStatus, setNextStatus] = useState('');

  // Modals
  const [showRfqModal, setShowRfqModal] = useState(false);
  const [selectedDealers, setSelectedDealers] = useState([]);
  const [rfqDueDate, setRfqDueDate] = useState('');
  const [rfqNotes, setRfqNotes] = useState('');

  const [showContactModal, setShowContactModal] = useState(false);
  const [contactDealerId, setContactDealerId] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');

  const [showPoModal, setShowPoModal] = useState(false);
  const [poBuilding, setPoBuilding] = useState('Engineering Block');
  const [poRoom, setPoRoom] = useState('');
  const [poDeliveryDate, setPoDeliveryDate] = useState('');

  const isFurnitureAdmin = currentUser?.role === 'furniture_admin';
  const isSuperAdmin = currentUser?.role === 'superadmin';
  const isDeptAdmin = currentUser?.role === 'deptadmin';
  const canManage = isFurnitureAdmin || isSuperAdmin;

  const notifyToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const loadData = async () => {
    try {
      setLoading(true);
      setError('');
      const pr = await api.getPurchaseRequestById(id);
      setDetail(pr);
      setRemarks(pr.internal_remarks || '');
      setNextStatus(pr.status);
      setPoDeliveryDate(pr.preferred_delivery_date ? String(pr.preferred_delivery_date).slice(0, 10) : '');

      if (canManage) {
        const dList = await api.getDealers().catch(() => []);
        setDealers(Array.isArray(dList) ? dList : []);
        if (dList.length > 0 && !contactDealerId) setContactDealerId(dList[0].id);
      }
    } catch (err) {
      setError(err.message || 'Failed to load request details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  if (!currentUser) return null;

  const handleSaveReview = async (e) => {
    e.preventDefault();
    try {
      await api.updatePurchaseRequestStatus(id, {
        status: nextStatus,
        internal_remarks: remarks,
        info_request_note: infoNote || undefined,
      });
      setInfoNote('');
      notifyToast('Purchase request updated successfully.');
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeptReply = async (e) => {
    e.preventDefault();
    if (!deptReply.trim()) return;
    try {
      await api.respondPurchaseRequestInfo(id, deptReply);
      setDeptReply('');
      notifyToast('Response sent to Furniture Admin.');
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const toggleDealerSelection = (dealerId) => {
    setSelectedDealers((prev) =>
      prev.includes(dealerId) ? prev.filter((d) => d !== dealerId) : [...prev, dealerId]
    );
  };

  const handleSendRfq = async (e) => {
    e.preventDefault();
    if (selectedDealers.length === 0) return;
    try {
      await api.requestDealerQuotations(id, {
        dealerIds: selectedDealers,
        dueDate: rfqDueDate || null,
        notes: rfqNotes,
      });
      setShowRfqModal(false);
      setSelectedDealers([]);
      setRfqNotes('');
      notifyToast('Quotation requests dispatched to selected dealers.');
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleContactDealer = async (e) => {
    e.preventDefault();
    try {
      await api.addDealerCommunication({
        dealer_id: contactDealerId,
        reference_type: 'purchase_request',
        reference_id: id,
        channel: 'Portal',
        subject: contactSubject,
        message: contactMessage,
      });
      setShowContactModal(false);
      setContactSubject('');
      setContactMessage('');
      notifyToast('Dealer communication logged and sent.');
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRecommend = async (quotationId) => {
    try {
      await api.recommendQuotation(id, {
        quotationId,
        remarks: remarks || 'Recommended after quotation comparison.',
      });
      notifyToast('Quotation recommended and forwarded to Super Admin for approval.');
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleGeneratePo = async (e) => {
    e.preventDefault();
    try {
      await api.createPurchaseOrder({
        purchase_request_id: id,
        quotation_id: detail.recommended_quotation_id,
        expected_delivery_date: poDeliveryDate || null,
        target_building: poBuilding,
        target_room: poRoom,
        status: 'Approved',
      });
      setShowPoModal(false);
      notifyToast('Purchase Order generated successfully.');
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-sm text-slate-400">Loading purchase request details...</div>
    );
  }

  if (error || !detail) {
    return (
      <div className="space-y-4">
        <Btn variant="secondary" size="sm" onClick={() => navigate('/furniture-admin/purchase-requests')}>
          <ArrowLeft size={14} /> Back to Requests
        </Btn>
        <Card className="p-6 text-rose-600 text-sm font-semibold">{error || 'Request not found'}</Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <TopBar
        title={`Purchase Request ${detail.id}`}
        subtitle={`${detail.department} • Requested by ${detail.requested_by_name}`}
        user={currentUser}
      />

      {toast && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 size={16} /> {toast}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Btn size="sm" variant="secondary" onClick={() => navigate('/furniture-admin/purchase-requests')}>
          <ArrowLeft size={14} /> All Purchase Requests
        </Btn>
        <div className="flex flex-wrap items-center gap-2">
          {canManage && (
            <>
              <Btn size="sm" variant="secondary" onClick={() => setShowContactModal(true)}>
                <MessageSquare size={14} /> Contact Dealer
              </Btn>
              <Btn size="sm" variant="secondary" onClick={() => setShowRfqModal(true)}>
                <Send size={14} /> Request Quotations
              </Btn>
              <Btn size="sm" variant="secondary" onClick={() => navigate(`/furniture-admin/quotations/compare/${id}`)}>
                <Scale size={14} /> Compare Quotations ({detail.quotations?.length || 0})
              </Btn>
              {detail.status === 'Approved' && (
                <Btn size="sm" onClick={() => setShowPoModal(true)}>
                  <ShoppingBag size={14} /> Generate Purchase Order
                </Btn>
              )}
            </>
          )}
          {isSuperAdmin && detail.status === 'Awaiting Approval' && (
            <Btn size="sm" onClick={() => navigate('/furniture-admin/approvals')}>
              Review Approval
            </Btn>
          )}
        </div>
      </div>

      {/* Main Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-2 space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900 dark:text-white font-display">{detail.furniture_name}</h2>
              <p className="text-xs text-slate-500 mt-1">
                Category: <span className="font-semibold text-slate-700 dark:text-slate-300">{detail.furniture_category}</span> • Quantity:{' '}
                <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">{detail.quantity} units</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge label={detail.priority} />
              <Badge label={detail.status} />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Department</p>
              <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{detail.department}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Requested By</p>
              <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{detail.requested_by_name}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Preferred Delivery</p>
              <p className="font-mono font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                {detail.preferred_delivery_date ? String(detail.preferred_delivery_date).slice(0, 10) : 'Flexible'}
              </p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Approved By</p>
              <p className="font-bold text-slate-800 dark:text-slate-200 mt-0.5">{detail.approved_by_name || 'Pending'}</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Technical Specifications</p>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{detail.specifications || 'No additional specifications provided.'}</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Reason for Purchase</p>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{detail.reason}</p>
            </div>
            {detail.supporting_documents?.length > 0 && (
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase mb-1.5">Supporting Documents</p>
                <div className="flex flex-wrap gap-2">
                  {detail.supporting_documents.map((doc, i) => (
                    <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 font-semibold">
                      <FileText size={13} /> {doc.name} {doc.size ? `(${doc.size})` : ''}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {detail.rejection_reason && (
              <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-400">
                <p className="text-[10px] font-bold uppercase mb-1">Super Admin Rejection Reason</p>
                <p className="font-semibold">{detail.rejection_reason}</p>
              </div>
            )}
          </div>

          {/* Info Request & Dept Admin Response */}
          {(detail.info_request_note || isDeptAdmin) && (
            <div className="p-4 rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/50 dark:bg-amber-950/10 space-y-2">
              {detail.info_request_note && (
                <p className="text-xs text-amber-800 dark:text-amber-300 font-semibold">
                  Furniture Admin Query: {detail.info_request_note}
                </p>
              )}
              {detail.department_response && (
                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold">
                  Department Reply: {detail.department_response}
                </p>
              )}
              {isDeptAdmin && detail.info_request_note && (
                <form onSubmit={handleDeptReply} className="flex gap-2 pt-1">
                  <input
                    value={deptReply}
                    onChange={(e) => setDeptReply(e.target.value)}
                    placeholder="Provide requested clarification..."
                    className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  />
                  <Btn type="submit" size="sm">Reply</Btn>
                </form>
              )}
            </div>
          )}

          {/* Furniture Admin Review & Remarks Panel */}
          {canManage && (
            <form onSubmit={handleSaveReview} className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
              <h3 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">Furniture Admin Review & Remarks</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Select
                  label="Update Status"
                  value={nextStatus}
                  onChange={(e) => setNextStatus(e.target.value)}
                  options={['Pending', 'Under Review', 'Quotation Requested', 'Quotation Received']}
                />
                <Input
                  label="Request Additional Info (Notify Dept)"
                  value={infoNote}
                  onChange={(e) => setInfoNote(e.target.value)}
                  placeholder="Optional question for department..."
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase block mb-1">Internal Remarks</label>
                <textarea
                  rows={2}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
                />
              </div>
              <div className="flex justify-end">
                <Btn type="submit" size="sm">Save Review & Status</Btn>
              </div>
            </form>
          )}
        </Card>

        {/* Status History Timeline */}
        <Card className="p-6">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white font-display mb-4 flex items-center gap-2">
            <Clock size={16} className="text-indigo-600 dark:text-indigo-400" />
            Complete Status History
          </h3>
          {(detail.statusHistory || []).length === 0 ? (
            <p className="text-xs text-slate-400">No status history recorded.</p>
          ) : (
            <div className="space-y-4">
              {detail.statusHistory.map((h) => (
                <div key={h.id} className="relative pl-5 border-l-2 border-indigo-200 dark:border-indigo-900/60">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 absolute -left-[6px] top-1" />
                  <div className="flex items-center justify-between gap-2">
                    <Badge label={h.new_status} />
                    <span className="text-[10px] font-mono text-slate-400">
                      {String(h.created_at || '').slice(0, 16).replace('T', ' ')}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-1">{h.remarks}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">By {h.changed_by_name} ({h.changed_by_role})</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Dealer Quotations for this Request (Hidden from Dept Admin) */}
      {!isDeptAdmin && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white font-display">Dealer Quotations</h3>
            {canManage && (
              <Btn size="sm" variant="secondary" onClick={() => navigate(`/furniture-admin/quotations/compare/${id}`)}>
                <Scale size={14} /> Open Comparison View
              </Btn>
            )}
          </div>
          {(detail.quotations || []).length === 0 ? (
            <p className="text-xs text-slate-400 py-4">No quotations requested or received yet. Use "Request Quotations" to contact dealers.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider">
                    <th className="pb-2.5">Quote ID</th>
                    <th className="pb-2.5">Dealer</th>
                    <th className="pb-2.5">Unit Price</th>
                    <th className="pb-2.5">Grand Total (incl. GST & Freight)</th>
                    <th className="pb-2.5">Warranty</th>
                    <th className="pb-2.5">Est. Delivery</th>
                    <th className="pb-2.5">Status</th>
                    {canManage && <th className="pb-2.5 text-right">Action</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {detail.quotations.map((q) => (
                    <tr key={q.id}>
                      <td className="py-3 font-mono font-bold text-indigo-600 dark:text-indigo-400">{q.id}</td>
                      <td className="py-3 font-bold text-slate-800 dark:text-white">
                        {q.dealer_name} <span className="text-amber-500 text-[10px] ml-1">★ {q.dealer_rating}</span>
                      </td>
                      <td className="py-3 font-mono">
                        {Number(q.unit_price) > 0 ? `₹${Number(q.unit_price).toLocaleString('en-IN')}` : 'Pending'}
                      </td>
                      <td className="py-3 font-mono font-bold">
                        {Number(q.grand_total) > 0 ? `₹${Number(q.grand_total).toLocaleString('en-IN')}` : 'Awaiting Dealer'}
                      </td>
                      <td className="py-3">{q.warranty_period || '—'}</td>
                      <td className="py-3 font-mono">{q.estimated_delivery_date ? String(q.estimated_delivery_date).slice(0, 10) : '—'}</td>
                      <td className="py-3"><Badge label={q.status} /></td>
                      {canManage && (
                        <td className="py-3 text-right">
                          {Number(q.grand_total) > 0 && !['Approved', 'Rejected', 'Recommended'].includes(q.status) && !['Approved', 'Order Placed', 'Completed'].includes(detail.status) && (
                            <Btn size="sm" onClick={() => handleRecommend(q.id)}>
                              Recommend for Approval
                            </Btn>
                          )}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}

      {/* Linked Purchase Orders */}
      {detail.purchaseOrders?.length > 0 && (
        <Card className="p-6">
          <h3 className="text-sm font-bold text-slate-800 dark:text-white font-display mb-3">Linked Purchase Orders</h3>
          <div className="space-y-2">
            {detail.purchaseOrders.map((po) => (
              <div key={po.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-slate-800 dark:text-white">{po.po_number} • {po.dealer_name}</p>
                  <p className="text-[11px] text-slate-500">Order Date: {String(po.order_date).slice(0, 10)} • Total: ₹{Number(po.total_amount).toLocaleString('en-IN')}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge label={po.status} />
                  <Btn size="sm" variant="secondary" onClick={() => navigate('/furniture-admin/purchase-orders')}>View PO</Btn>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Request Quotations Modal */}
      {showRfqModal && (
        <Modal title={`Request Quotations for ${detail.id}`} onClose={() => setShowRfqModal(false)}>
          <form onSubmit={handleSendRfq} className="space-y-4">
            <p className="text-xs text-slate-500">Select one or more registered furniture dealers to send an RFQ:</p>
            <div className="max-h-56 overflow-y-auto space-y-2 border border-slate-200 dark:border-slate-800 rounded-xl p-3">
              {dealers.map((d) => (
                <label key={d.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer">
                  <div className="flex items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={selectedDealers.includes(d.id)}
                      onChange={() => toggleDealerSelection(d.id)}
                      className="w-4 h-4 accent-indigo-600 rounded"
                    />
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-white">{d.name}</p>
                      <p className="text-[10px] text-slate-400">{d.services}</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-bold text-amber-500 flex items-center gap-0.5"><Star size={11} /> {d.rating}</span>
                </label>
              ))}
            </div>
            <Input label="Quote Response Due Date" type="date" value={rfqDueDate} onChange={(e) => setRfqDueDate(e.target.value)} />
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase block mb-1">RFQ Instructions</label>
              <textarea
                rows={2}
                value={rfqNotes}
                onChange={(e) => setRfqNotes(e.target.value)}
                placeholder="Include delivery, installation, and GST terms..."
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Btn type="button" variant="secondary" onClick={() => setShowRfqModal(false)}>Cancel</Btn>
              <Btn type="submit" disabled={selectedDealers.length === 0}>Send Quotation Request</Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* Contact Dealer Modal */}
      {showContactModal && (
        <Modal title="Contact & Log Dealer Communication" onClose={() => setShowContactModal(false)}>
          <form onSubmit={handleContactDealer} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase">Dealer</label>
              <select
                value={contactDealerId}
                onChange={(e) => setContactDealerId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900"
              >
                {dealers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </div>
            <Input label="Subject *" value={contactSubject} onChange={(e) => setContactSubject(e.target.value)} required />
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase block mb-1">Message *</label>
              <textarea
                rows={3}
                value={contactMessage}
                onChange={(e) => setContactMessage(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900"
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Btn type="button" variant="secondary" onClick={() => setShowContactModal(false)}>Cancel</Btn>
              <Btn type="submit">Send & Log Message</Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* Generate PO Modal */}
      {showPoModal && (
        <Modal title="Generate Purchase Order" onClose={() => setShowPoModal(false)}>
          <form onSubmit={handleGeneratePo} className="space-y-4">
            <p className="text-xs text-slate-500">
              Generating PO for Super Admin-approved request <span className="font-mono font-bold text-indigo-600">{detail.id}</span>.
            </p>
            <Input label="Expected Delivery Date" type="date" value={poDeliveryDate} onChange={(e) => setPoDeliveryDate(e.target.value)} />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Target Building" value={poBuilding} onChange={(e) => setPoBuilding(e.target.value)} />
              <Input label="Target Room" value={poRoom} onChange={(e) => setPoRoom(e.target.value)} placeholder="e.g., CS-Lab2" />
            </div>
            <div className="flex justify-end gap-2">
              <Btn type="button" variant="secondary" onClick={() => setShowPoModal(false)}>Cancel</Btn>
              <Btn type="submit">Create Purchase Order</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
