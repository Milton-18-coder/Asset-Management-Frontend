import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { TopBar } from '../../components/TopBar';
import { StatCard, Card, Btn, Badge, Modal, Input, Select } from '../../components/UIComponents';
import { api } from '../../api';
import {
  FileSpreadsheet, ShoppingBag, Wrench, UploadCloud, Download, MessageSquare,
  CheckCircle2, RefreshCw, Send
} from 'lucide-react';

export const DealerPortal = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { currentUser } = useSelector((state) => state.auth);
  const [activeTab, setActiveTab] = useState(searchParams.get('tab') || 'overview');

  const [portalData, setPortalData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  // Submit Quotation Modal
  const [quoteModal, setQuoteModal] = useState(null);
  const [quoteForm, setQuoteForm] = useState({
    unit_price: '', gst_percent: 18, transportation_charges: 0, installation_charges: 0,
    warranty_period: '3 Years On-Site', estimated_delivery_date: '', quotation_document: '', quotation_document_data: '', additional_remarks: ''
  });

  // Update PO Modal
  const [poModal, setPoModal] = useState(null);
  const [poForm, setPoForm] = useState({ status: 'Processing', delivery_status: 'Processing', expected_delivery_date: '', delivery_notes: '' });

  // Servicing Update / Estimate Modal
  const [srvModal, setSrvModal] = useState(null);
  const [srvMode, setSrvMode] = useState('progress'); // 'estimate' | 'progress'
  const [srvForm, setSrvForm] = useState({
    estimated_cost: '', technician_name: '', technician_phone: '', status: 'In Progress',
    progress_notes: '', actual_cost: '', completion_evidence: []
  });

  // Message Modal
  const [msgForm, setMsgForm] = useState({ subject: '', message: '' });

  useEffect(() => {
    const t = searchParams.get('tab');
    if (t) setActiveTab(t);
  }, [searchParams]);

  const loadPortal = async () => {
    try {
      setLoading(true);
      const data = await api.getDealerPortalSummary();
      setPortalData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPortal();
  }, []);

  if (!currentUser) return null;

  const notify = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const openQuoteModal = (q) => {
    setQuoteModal(q);
    setQuoteForm({
      unit_price: q.unit_price > 0 ? q.unit_price : '',
      gst_percent: q.gst_percent ?? 18,
      transportation_charges: q.transportation_charges ?? 0,
      installation_charges: q.installation_charges ?? 0,
      warranty_period: q.warranty_period || '3 Years On-Site',
      estimated_delivery_date: q.estimated_delivery_date ? String(q.estimated_delivery_date).slice(0, 10) : '',
      quotation_document: q.quotation_document || '',
      quotation_document_data: '',
      additional_remarks: q.additional_remarks || '',
    });
  };

  const handleQuoteFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setQuoteForm((prev) => ({
        ...prev,
        quotation_document: file.name,
        quotation_document_data: typeof reader.result === 'string' ? reader.result : '',
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleQuoteSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.updateQuotation(quoteModal.id, quoteForm);
      setQuoteModal(null);
      notify('Quotation submitted successfully to Furniture Admin.');
      await loadPortal();
    } catch (err) {
      alert(err.message);
    }
  };

  const openPoModal = (po) => {
    setPoModal(po);
    setPoForm({
      status: po.status,
      delivery_status: po.delivery_status,
      expected_delivery_date: po.expected_delivery_date ? String(po.expected_delivery_date).slice(0, 10) : '',
      delivery_notes: po.delivery_notes || '',
    });
  };

  const handlePoUpdate = async (e) => {
    e.preventDefault();
    try {
      await api.updatePurchaseOrderStatus(poModal.id, poForm);
      setPoModal(null);
      notify(`Purchase Order ${poModal.po_number} updated.`);
      await loadPortal();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDownloadPoPdf = async (po) => {
    try {
      const blob = await api.downloadPurchaseOrderPdf(po.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${po.po_number}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message);
    }
  };

  const openSrvModal = (sr, mode) => {
    setSrvModal(sr);
    setSrvMode(mode);
    setSrvForm({
      estimated_cost: sr.estimated_cost || '',
      technician_name: sr.technician_name || '',
      technician_phone: sr.technician_phone || '',
      status: sr.status === 'Approved' ? 'In Progress' : sr.status,
      progress_notes: sr.progress_notes || '',
      actual_cost: sr.actual_cost || sr.estimated_cost || '',
      completion_evidence: sr.completion_evidence || [],
    });
  };

  const handleEvidenceAttach = (e) => {
    const files = Array.from(e.target.files || []);
    const docs = files.map((f) => ({ name: f.name, size: `${Math.max(1, Math.round(f.size / 1024))} KB` }));
    setSrvForm((prev) => ({ ...prev, completion_evidence: [...prev.completion_evidence, ...docs] }));
  };

  const handleSrvSubmit = async (e) => {
    e.preventDefault();
    try {
      if (srvMode === 'estimate') {
        await api.submitServiceEstimate(srvModal.id, {
          estimated_cost: srvForm.estimated_cost,
          technician_name: srvForm.technician_name,
          technician_phone: srvForm.technician_phone,
          notes: srvForm.progress_notes,
        });
        notify('Servicing estimate submitted for review.');
      } else {
        await api.updateServiceProgress(srvModal.id, {
          status: srvForm.status,
          technician_name: srvForm.technician_name,
          technician_phone: srvForm.technician_phone,
          progress_notes: srvForm.progress_notes,
          actual_cost: srvForm.actual_cost,
          completion_evidence: srvForm.completion_evidence,
        });
        notify(`Servicing job ${srvModal.id} updated.`);
      }
      setSrvModal(null);
      await loadPortal();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    try {
      await api.addDealerCommunication({
        reference_type: 'general',
        channel: 'Portal',
        subject: msgForm.subject,
        message: msgForm.message,
      });
      setMsgForm({ subject: '', message: '' });
      notify('Message sent to Furniture Admin.');
      await loadPortal();
    } catch (err) {
      alert(err.message);
    }
  };

  const quotes = portalData?.quotationRequests || [];
  const orders = portalData?.purchaseOrders || [];
  const services = portalData?.serviceRequests || [];
  const comms = portalData?.communications || [];

  const switchTab = (tab) => {
    setActiveTab(tab);
    setSearchParams(tab === 'overview' ? {} : { tab });
  };

  return (
    <div className="space-y-6 pb-12">
      <TopBar
        title={`Dealer Portal — ${portalData?.dealer?.name || currentUser.vendorName || currentUser.name}`}
        subtitle="Restricted Supplier Workspace: Assigned Quotation Requests, Orders & Servicing Tasks"
        user={currentUser}
      />

      {toast && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 size={16} /> {toast}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={<FileSpreadsheet size={20} />}
          label="Quotation Requests"
          value={quotes.length}
          sub={`${quotes.filter((q) => q.status === 'Requested').length} awaiting your quote`}
          onClick={() => switchTab('quotations')}
          color="bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-950/20 dark:border-indigo-900/50 dark:text-indigo-400"
        />
        <StatCard
          icon={<ShoppingBag size={20} />}
          label="Assigned Purchase Orders"
          value={orders.length}
          sub={`${orders.filter((o) => o.status !== 'Delivered').length} active orders`}
          onClick={() => switchTab('orders')}
          color="bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-950/20 dark:border-blue-900/50 dark:text-blue-400"
        />
        <StatCard
          icon={<Wrench size={20} />}
          label="Servicing Assignments"
          value={services.length}
          sub={`${services.filter((s) => !['Completed', 'Verified'].includes(s.status)).length} active jobs`}
          onClick={() => switchTab('servicing')}
          color="bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-950/20 dark:border-amber-900/50 dark:text-amber-400"
        />
      </div>

      {/* Tab Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-2">
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'overview', label: 'Overview & Messages' },
            { id: 'quotations', label: `Quotation Requests (${quotes.length})` },
            { id: 'orders', label: `Purchase Orders (${orders.length})` },
            { id: 'servicing', label: `Servicing Jobs (${services.length})` },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => switchTab(t.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === t.id
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <Btn size="sm" variant="secondary" onClick={loadPortal}><RefreshCw size={14} /> Refresh</Btn>
      </div>

      {loading ? (
        <Card className="p-10 text-center text-sm text-slate-400">Loading your dealer workspace...</Card>
      ) : (
        <>
          {(activeTab === 'overview' || activeTab === 'quotations') && (
            <Card className="p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white font-display">Assigned Quotation Requests</h3>
              {quotes.length === 0 ? (
                <p className="text-xs text-slate-400">No quotation requests assigned to your dealership.</p>
              ) : (
                <div className="space-y-3">
                  {quotes.map((q) => (
                    <div key={q.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-indigo-600">{q.id}</span>
                          <Badge label={q.status} />
                          {q.priority && <Badge label={q.priority} />}
                        </div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{q.furniture_name} (Qty: {q.quantity})</p>
                        <p className="text-xs text-slate-500">
                          Request: {q.purchase_request_id} • Dept: {q.department} • Quoted Total:{' '}
                          <strong className="font-mono">{Number(q.grand_total) > 0 ? `₹${Number(q.grand_total).toLocaleString('en-IN')}` : 'Not Submitted'}</strong>
                        </p>
                      </div>
                      {!['Approved', 'Rejected'].includes(q.status) && (
                        <Btn size="sm" onClick={() => openQuoteModal(q)}>
                          {q.status === 'Requested' ? 'Submit Quotation' : 'Update Quotation'}
                        </Btn>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {(activeTab === 'overview' || activeTab === 'orders') && (
            <Card className="p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white font-display">Assigned Purchase Orders</h3>
              {orders.length === 0 ? (
                <p className="text-xs text-slate-400">No purchase orders assigned yet.</p>
              ) : (
                <div className="space-y-3">
                  {orders.map((po) => (
                    <div key={po.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-indigo-600">{po.po_number}</span>
                          <Badge label={po.status} />
                          <Badge label={po.delivery_status} />
                        </div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          {(po.items || []).map((i) => `${i.furniture_name} (×${i.quantity})`).join(', ')}
                        </p>
                        <p className="text-xs text-slate-500">
                          Department: {po.department} • Total: <strong className="font-mono">₹{Number(po.total_amount).toLocaleString('en-IN')}</strong> •
                          Expected Delivery: <strong className="font-mono">{po.expected_delivery_date ? String(po.expected_delivery_date).slice(0, 10) : 'TBD'}</strong>
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Btn size="sm" variant="secondary" onClick={() => handleDownloadPoPdf(po)}>
                          <Download size={13} /> PO PDF
                        </Btn>
                        {po.status !== 'Delivered' && po.status !== 'Cancelled' && (
                          <Btn size="sm" onClick={() => openPoModal(po)}>Update Order & Delivery</Btn>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {(activeTab === 'overview' || activeTab === 'servicing') && (
            <Card className="p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white font-display">Servicing Assignments</h3>
              {services.length === 0 ? (
                <p className="text-xs text-slate-400">No servicing jobs assigned.</p>
              ) : (
                <div className="space-y-3">
                  {services.map((sr) => (
                    <div key={sr.id} className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-indigo-600">{sr.id}</span>
                          <Badge label={sr.priority} />
                          <Badge label={sr.status} />
                        </div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{sr.furniture_name} ({sr.furniture_location})</p>
                        <p className="text-xs text-slate-500">{sr.issue_description}</p>
                        <p className="text-[11px] text-slate-400">
                          Estimate: <span className="font-mono font-bold">₹{Number(sr.estimated_cost || 0).toLocaleString('en-IN')}</span>
                          {sr.technician_name && ` • Tech: ${sr.technician_name}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {['Dealer Assigned', 'Quotation Awaited', 'Under Review'].includes(sr.status) && (
                          <Btn size="sm" variant="secondary" onClick={() => openSrvModal(sr, 'estimate')}>
                            Submit Estimate
                          </Btn>
                        )}
                        {['Approved', 'In Progress'].includes(sr.status) && (
                          <Btn size="sm" onClick={() => openSrvModal(sr, 'progress')}>
                            Update Progress / Complete
                          </Btn>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          {activeTab === 'overview' && (
            <Card className="p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white font-display flex items-center gap-2">
                <MessageSquare size={16} className="text-indigo-600" /> Communication with Furniture Admin
              </h3>
              <form onSubmit={handleSendMessage} className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  value={msgForm.subject}
                  onChange={(e) => setMsgForm({ ...msgForm, subject: e.target.value })}
                  placeholder="Subject *"
                  className="px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  required
                />
                <input
                  value={msgForm.message}
                  onChange={(e) => setMsgForm({ ...msgForm, message: e.target.value })}
                  placeholder="Write message to Furniture Admin..."
                  className="sm:col-span-2 px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  required
                />
                <Btn type="submit" size="sm" className="justify-center"><Send size={13} /> Send Message</Btn>
              </form>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {comms.map((c) => (
                  <div key={c.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-xs">
                    <div className="flex justify-between">
                      <span className="font-bold text-slate-800 dark:text-white">{c.subject}</span>
                      <span className="text-[10px] text-slate-400">{String(c.created_at).slice(0, 16).replace('T', ' ')}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 mt-0.5">{c.message}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">By {c.logged_by_name}</p>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </>
      )}

      {/* Submit Quotation Modal */}
      {quoteModal && (
        <Modal title={`Submit Quotation — ${quoteModal.furniture_name}`} onClose={() => setQuoteModal(null)} defaultSize="max-w-xl">
          <form onSubmit={handleQuoteSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <Input label="Unit Price (₹) *" type="number" min={1} step="0.01" value={quoteForm.unit_price} onChange={(e) => setQuoteForm({ ...quoteForm, unit_price: e.target.value })} required />
              <Input label="GST (%)" type="number" min={0} step="0.1" value={quoteForm.gst_percent} onChange={(e) => setQuoteForm({ ...quoteForm, gst_percent: e.target.value })} />
              <Input label="Transportation Charges (₹)" type="number" min={0} value={quoteForm.transportation_charges} onChange={(e) => setQuoteForm({ ...quoteForm, transportation_charges: e.target.value })} />
              <Input label="Installation Charges (₹)" type="number" min={0} value={quoteForm.installation_charges} onChange={(e) => setQuoteForm({ ...quoteForm, installation_charges: e.target.value })} />
              <Input label="Warranty Period *" value={quoteForm.warranty_period} onChange={(e) => setQuoteForm({ ...quoteForm, warranty_period: e.target.value })} required />
              <Input label="Estimated Delivery Date *" type="date" value={quoteForm.estimated_delivery_date} onChange={(e) => setQuoteForm({ ...quoteForm, estimated_delivery_date: e.target.value })} required />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-500 uppercase block mb-1">Upload Quotation Document</label>
              <label className="flex items-center gap-2 px-3.5 py-2.5 text-xs border border-dashed border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer">
                <UploadCloud size={15} /> {quoteForm.quotation_document || 'Select PDF / Image Quotation'}
                <input type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={handleQuoteFile} />
              </label>
            </div>
            <Input label="Additional Remarks" value={quoteForm.additional_remarks} onChange={(e) => setQuoteForm({ ...quoteForm, additional_remarks: e.target.value })} />
            <div className="flex justify-end gap-2">
              <Btn type="button" variant="secondary" onClick={() => setQuoteModal(null)}>Cancel</Btn>
              <Btn type="submit">Submit Quotation</Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* Update PO Modal */}
      {poModal && (
        <Modal title={`Update Order Status — ${poModal.po_number}`} onClose={() => setPoModal(null)}>
          <form onSubmit={handlePoUpdate} className="space-y-4">
            <Select label="Order Status" value={poForm.status} onChange={(e) => setPoForm({ ...poForm, status: e.target.value })} options={['Sent to Dealer', 'Processing', 'Partially Delivered', 'Delivered']} />
            <Select label="Delivery Status" value={poForm.delivery_status} onChange={(e) => setPoForm({ ...poForm, delivery_status: e.target.value })} options={['Pending', 'Processing', 'Shipped', 'Partially Delivered', 'Delivered']} />
            <Input label="Expected Delivery Date" type="date" value={poForm.expected_delivery_date} onChange={(e) => setPoForm({ ...poForm, expected_delivery_date: e.target.value })} />
            <Input label="Delivery / Dispatch Notes" value={poForm.delivery_notes} onChange={(e) => setPoForm({ ...poForm, delivery_notes: e.target.value })} />
            <div className="flex justify-end gap-2">
              <Btn type="button" variant="secondary" onClick={() => setPoModal(null)}>Cancel</Btn>
              <Btn type="submit">Save Order Update</Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* Servicing Estimate / Progress Modal */}
      {srvModal && (
        <Modal title={srvMode === 'estimate' ? `Submit Servicing Estimate — ${srvModal.id}` : `Update Servicing Progress — ${srvModal.id}`} onClose={() => setSrvModal(null)}>
          <form onSubmit={handleSrvSubmit} className="space-y-4">
            {srvMode === 'estimate' ? (
              <>
                <Input label="Estimated Cost (₹) *" type="number" min={0} value={srvForm.estimated_cost} onChange={(e) => setSrvForm({ ...srvForm, estimated_cost: e.target.value })} required />
                <Input label="Technician Name" value={srvForm.technician_name} onChange={(e) => setSrvForm({ ...srvForm, technician_name: e.target.value })} />
                <Input label="Technician Phone" value={srvForm.technician_phone} onChange={(e) => setSrvForm({ ...srvForm, technician_phone: e.target.value })} />
                <Input label="Diagnosis / Estimate Notes" value={srvForm.progress_notes} onChange={(e) => setSrvForm({ ...srvForm, progress_notes: e.target.value })} />
              </>
            ) : (
              <>
                <Select label="Work Status" value={srvForm.status} onChange={(e) => setSrvForm({ ...srvForm, status: e.target.value })} options={['In Progress', 'Completed']} />
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Technician Name" value={srvForm.technician_name} onChange={(e) => setSrvForm({ ...srvForm, technician_name: e.target.value })} />
                  <Input label="Actual Cost (₹)" type="number" min={0} value={srvForm.actual_cost} onChange={(e) => setSrvForm({ ...srvForm, actual_cost: e.target.value })} />
                </div>
                <Input label="Progress / Completion Notes" value={srvForm.progress_notes} onChange={(e) => setSrvForm({ ...srvForm, progress_notes: e.target.value })} />
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase block mb-1">Upload Completion Evidence</label>
                  <label className="flex items-center gap-2 px-3.5 py-2.5 text-xs border border-dashed border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer">
                    <UploadCloud size={15} /> Attach Completion Photos ({srvForm.completion_evidence.length} files)
                    <input type="file" multiple accept="image/*,.pdf" className="hidden" onChange={handleEvidenceAttach} />
                  </label>
                </div>
              </>
            )}
            <div className="flex justify-end gap-2">
              <Btn type="button" variant="secondary" onClick={() => setSrvModal(null)}>Cancel</Btn>
              <Btn type="submit">{srvMode === 'estimate' ? 'Submit Estimate' : 'Update Servicing'}</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
