import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../../components/TopBar';
import { Card, Btn, Badge, Modal, Input, Select } from '../../components/UIComponents';
import { api } from '../../api';
import { Plus, Scale, FileText, UploadCloud, RefreshCw, CheckCircle2 } from 'lucide-react';

export const QuotationManagement = () => {
  const navigate = useNavigate();
  const { currentUser } = useSelector((state) => state.auth);

  const [quotations, setQuotations] = useState([]);
  const [purchaseRequests, setPurchaseRequests] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [toast, setToast] = useState('');

  const [showRecordModal, setShowRecordModal] = useState(false);
  const [editingQuoteId, setEditingQuoteId] = useState(null);
  const [form, setForm] = useState({
    purchase_request_id: '',
    dealer_id: '',
    furniture_name: '',
    quantity: 1,
    unit_price: '',
    gst_percent: 18,
    transportation_charges: 0,
    installation_charges: 0,
    warranty_period: '3 Years On-Site',
    estimated_delivery_date: '',
    quotation_document: '',
    quotation_document_data: '',
    additional_remarks: '',
  });

  const canWrite = ['furniture_admin', 'superadmin'].includes(currentUser?.role);

  const loadAll = async () => {
    try {
      setLoading(true);
      const [qData, prData, dData] = await Promise.all([
        api.getQuotations({ status: statusFilter }),
        api.getPurchaseRequests().catch(() => []),
        api.getDealers().catch(() => []),
      ]);
      setQuotations(Array.isArray(qData) ? qData : []);
      setPurchaseRequests(Array.isArray(prData) ? prData : []);
      setDealers(Array.isArray(dData) ? dData : []);
    } catch (err) {
      console.error('Failed to load quotations:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, [statusFilter]);

  if (!currentUser) return null;

  const notify = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const openNewQuote = () => {
    setEditingQuoteId(null);
    const firstPr = purchaseRequests[0];
    setForm({
      purchase_request_id: firstPr?.id || '',
      dealer_id: dealers[0]?.id || '',
      furniture_name: firstPr?.furniture_name || '',
      quantity: firstPr?.quantity || 1,
      unit_price: '',
      gst_percent: 18,
      transportation_charges: 0,
      installation_charges: 0,
      warranty_period: '3 Years On-Site',
      estimated_delivery_date: firstPr?.preferred_delivery_date ? String(firstPr.preferred_delivery_date).slice(0, 10) : '',
      quotation_document: '',
      quotation_document_data: '',
      additional_remarks: '',
    });
    setShowRecordModal(true);
  };

  const openEditQuote = (q) => {
    setEditingQuoteId(q.id);
    setForm({
      purchase_request_id: q.purchase_request_id || '',
      dealer_id: q.dealer_id || '',
      furniture_name: q.furniture_name || '',
      quantity: q.quantity || 1,
      unit_price: q.unit_price || '',
      gst_percent: q.gst_percent ?? 18,
      transportation_charges: q.transportation_charges ?? 0,
      installation_charges: q.installation_charges ?? 0,
      warranty_period: q.warranty_period || '3 Years On-Site',
      estimated_delivery_date: q.estimated_delivery_date ? String(q.estimated_delivery_date).slice(0, 10) : '',
      quotation_document: q.quotation_document || '',
      quotation_document_data: '',
      additional_remarks: q.additional_remarks || '',
    });
    setShowRecordModal(true);
  };

  const handlePrChange = (prId) => {
    const pr = purchaseRequests.find((p) => p.id === prId);
    setForm((prev) => ({
      ...prev,
      purchase_request_id: prId,
      furniture_name: pr ? pr.furniture_name : prev.furniture_name,
      quantity: pr ? pr.quantity : prev.quantity,
      estimated_delivery_date: pr?.preferred_delivery_date ? String(pr.preferred_delivery_date).slice(0, 10) : prev.estimated_delivery_date,
    }));
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setForm((prev) => ({
        ...prev,
        quotation_document: file.name,
        quotation_document_data: typeof reader.result === 'string' ? reader.result : '',
      }));
    };
    reader.readAsDataURL(file);
  };

  const calcPreviewTotal = () => {
    const base = (Number(form.quantity) || 1) * (Number(form.unit_price) || 0);
    const gst = (base * (Number(form.gst_percent) || 0)) / 100;
    return base + gst + (Number(form.transportation_charges) || 0) + (Number(form.installation_charges) || 0);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingQuoteId) {
        await api.updateQuotation(editingQuoteId, form);
        notify('Dealer quotation updated.');
      } else {
        await api.createQuotation(form);
        notify('Dealer quotation recorded.');
      }
      setShowRecordModal(false);
      await loadAll();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <TopBar
        title="Quotation Management"
        subtitle="Collect, Record & Review Dealer Quotations"
        user={currentUser}
      />

      {toast && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 size={15} /> {toast}
        </div>
      )}

      <Card className="p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Select
            label="Filter Status"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={['All', 'Requested', 'Submitted', 'Under Review', 'Recommended', 'Approved', 'Rejected']}
            className="py-1.5 text-xs"
          />
        </div>
        <div className="flex items-center gap-2">
          <Btn size="sm" variant="secondary" onClick={loadAll}>
            <RefreshCw size={14} /> Refresh
          </Btn>
          <Btn size="sm" variant="secondary" onClick={() => navigate('/furniture-admin/quotations/compare')}>
            <Scale size={14} /> Compare Quotations
          </Btn>
          {canWrite && (
            <Btn size="sm" onClick={openNewQuote}>
              <Plus size={15} /> Record Quotation
            </Btn>
          )}
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                <th className="px-5 py-3.5">Quotation ID</th>
                <th className="px-5 py-3.5">Request</th>
                <th className="px-5 py-3.5">Dealer</th>
                <th className="px-5 py-3.5">Furniture</th>
                <th className="px-5 py-3.5">Unit Price</th>
                <th className="px-5 py-3.5">Grand Total</th>
                <th className="px-5 py-3.5">Warranty</th>
                <th className="px-5 py-3.5">Est. Delivery</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {loading ? (
                <tr><td colSpan={10} className="px-5 py-10 text-center text-slate-400">Loading quotations...</td></tr>
              ) : quotations.length === 0 ? (
                <tr><td colSpan={10} className="px-5 py-10 text-center text-slate-400">No quotations found.</td></tr>
              ) : (
                quotations.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition">
                    <td className="px-5 py-3.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">{q.id}</td>
                    <td className="px-5 py-3.5 font-mono">
                      {q.purchase_request_id ? (
                        <button
                          onClick={() => navigate(`/furniture-admin/quotations/compare/${q.purchase_request_id}`)}
                          className="text-indigo-600 dark:text-indigo-400 hover:underline font-bold cursor-pointer"
                        >
                          {q.purchase_request_id}
                        </button>
                      ) : q.service_request_id || '—'}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-white">{q.dealer_name}</td>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{q.furniture_name}</p>
                      <p className="text-[10px] text-slate-400">Qty: {q.quantity}</p>
                    </td>
                    <td className="px-5 py-3.5 font-mono">{Number(q.unit_price) > 0 ? `₹${Number(q.unit_price).toLocaleString('en-IN')}` : '—'}</td>
                    <td className="px-5 py-3.5 font-mono font-bold">{Number(q.grand_total) > 0 ? `₹${Number(q.grand_total).toLocaleString('en-IN')}` : 'Awaiting'}</td>
                    <td className="px-5 py-3.5">{q.warranty_period || '—'}</td>
                    <td className="px-5 py-3.5 font-mono">{q.estimated_delivery_date ? String(q.estimated_delivery_date).slice(0, 10) : '—'}</td>
                    <td className="px-5 py-3.5"><Badge label={q.status} /></td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {canWrite && !['Approved', 'Rejected'].includes(q.status) && (
                          <Btn size="sm" variant="secondary" onClick={() => openEditQuote(q)}>
                            {q.status === 'Requested' ? 'Enter Quote' : 'Edit'}
                          </Btn>
                        )}
                        {q.purchase_request_id && (
                          <Btn size="sm" variant="ghost" onClick={() => navigate(`/furniture-admin/quotations/compare/${q.purchase_request_id}`)}>
                            <Scale size={13} /> Compare
                          </Btn>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {showRecordModal && (
        <Modal title={editingQuoteId ? `Update Quotation ${editingQuoteId}` : 'Record Dealer Quotation'} onClose={() => setShowRecordModal(false)} defaultSize="max-w-2xl">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase">Purchase Request *</label>
                <select
                  value={form.purchase_request_id}
                  onChange={(e) => handlePrChange(e.target.value)}
                  disabled={!!editingQuoteId}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900"
                  required
                >
                  <option value="">Select Request</option>
                  {purchaseRequests.map((pr) => (
                    <option key={pr.id} value={pr.id}>{pr.id} — {pr.furniture_name} ({pr.department})</option>
                  ))}
                </select>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase">Dealer *</label>
                <select
                  value={form.dealer_id}
                  onChange={(e) => setForm({ ...form, dealer_id: e.target.value })}
                  disabled={!!editingQuoteId}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900"
                  required
                >
                  <option value="">Select Dealer</option>
                  {dealers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <Input label="Quantity *" type="number" min={1} value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
              <Input label="Unit Price (₹) *" type="number" step="0.01" min={1} value={form.unit_price} onChange={(e) => setForm({ ...form, unit_price: e.target.value })} required />
              <Input label="GST (%)" type="number" step="0.1" min={0} value={form.gst_percent} onChange={(e) => setForm({ ...form, gst_percent: e.target.value })} />
              <Input label="Est. Delivery Date" type="date" value={form.estimated_delivery_date} onChange={(e) => setForm({ ...form, estimated_delivery_date: e.target.value })} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input label="Transportation (₹)" type="number" min={0} value={form.transportation_charges} onChange={(e) => setForm({ ...form, transportation_charges: e.target.value })} />
              <Input label="Installation (₹)" type="number" min={0} value={form.installation_charges} onChange={(e) => setForm({ ...form, installation_charges: e.target.value })} />
              <Input label="Warranty Period" value={form.warranty_period} onChange={(e) => setForm({ ...form, warranty_period: e.target.value })} />
            </div>

            <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 flex items-center justify-between">
              <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">Computed Grand Total (incl. GST, Freight & Installation)</span>
              <span className="text-base font-extrabold font-mono text-indigo-700 dark:text-indigo-300">
                ₹{calcPreviewTotal().toLocaleString('en-IN')}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-500 uppercase block mb-1">Quotation Document</label>
                <label className="flex items-center gap-2 px-3.5 py-2.5 text-xs border border-dashed border-slate-300 dark:border-slate-700 rounded-xl cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40">
                  <UploadCloud size={15} />
                  <span className="truncate">{form.quotation_document || 'Upload PDF / Quote File'}</span>
                  <input type="file" accept=".pdf,.png,.jpg,.jpeg" className="hidden" onChange={handleFileUpload} />
                </label>
              </div>
              <Input label="Additional Remarks" value={form.additional_remarks} onChange={(e) => setForm({ ...form, additional_remarks: e.target.value })} />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Btn type="button" variant="secondary" onClick={() => setShowRecordModal(false)}>Cancel</Btn>
              <Btn type="submit">{editingQuoteId ? 'Update Quotation' : 'Save Quotation'}</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
