import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { TopBar } from '../../components/TopBar';
import { Card, Btn, Badge, Modal, Input, Select } from '../../components/UIComponents';
import { api } from '../../api';
import { Store, Star, Mail, Phone, MapPin, Plus, Search, History, MessageSquare, Edit3, CheckCircle2 } from 'lucide-react';

export const DealerManagement = () => {
  const { currentUser } = useSelector((state) => state.auth);
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [editingDealer, setEditingDealer] = useState(null);
  const [form, setForm] = useState({
    name: '', contactPerson: '', email: '', phone: '', address: '', gstin: '', rating: 4.5, services: '', vendor_type: 'Furniture Dealer', status: 'Active'
  });

  const [selectedDealerDetail, setSelectedDealerDetail] = useState(null);
  const [commForm, setCommForm] = useState({ channel: 'Portal', subject: '', message: '' });

  const loadDealers = async () => {
    try {
      setLoading(true);
      const data = await api.getDealers();
      setDealers(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load dealers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDealers();
  }, []);

  if (!currentUser) return null;

  const notify = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const openAdd = () => {
    setEditingDealer(null);
    setForm({
      name: '', contactPerson: '', email: '', phone: '', address: '', gstin: '', rating: 4.5, services: '', vendor_type: 'Furniture Dealer', status: 'Active'
    });
    setShowModal(true);
  };

  const openEdit = (d) => {
    setEditingDealer(d);
    setForm({
      name: d.name || '',
      contactPerson: d.contactPerson || '',
      email: d.email || '',
      phone: d.phone || '',
      address: d.address || '',
      gstin: d.gstin || '',
      rating: d.rating || 4.5,
      services: d.services || '',
      vendor_type: d.vendor_type || 'Furniture Dealer',
      status: d.status || 'Active',
    });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingDealer) {
        await api.updateDealer(editingDealer.id, form);
        notify('Dealer updated successfully.');
      } else {
        await api.addDealer(form);
        notify('Dealer registered successfully.');
      }
      setShowModal(false);
      await loadDealers();
    } catch (err) {
      alert(err.message);
    }
  };

  const openDetail = async (d) => {
    try {
      const detail = await api.getDealerById(d.id);
      setSelectedDealerDetail(detail);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSendComm = async (e) => {
    e.preventDefault();
    if (!selectedDealerDetail?.dealer?.id) return;
    try {
      await api.addDealerCommunication({
        dealer_id: selectedDealerDetail.dealer.id,
        reference_type: 'general',
        ...commForm,
      });
      setCommForm({ channel: 'Portal', subject: '', message: '' });
      const updated = await api.getDealerById(selectedDealerDetail.dealer.id);
      setSelectedDealerDetail(updated);
      notify('Communication logged.');
    } catch (err) {
      alert(err.message);
    }
  };

  const filtered = dealers.filter((d) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      d.name?.toLowerCase().includes(q) ||
      d.contactPerson?.toLowerCase().includes(q) ||
      d.services?.toLowerCase().includes(q) ||
      d.gstin?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 pb-12">
      <TopBar
        title="Furniture Dealer Management"
        subtitle="Integrated Vendors & Dealers Directory, Performance & Communication History"
        user={currentUser}
      />

      {toast && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 size={15} /> {toast}
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search dealers by name, contact, GSTIN, or services..."
            className="w-full pl-9 pr-4 py-2.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900"
          />
        </div>
        <Btn size="sm" onClick={openAdd}>
          <Plus size={15} /> Register Dealer
        </Btn>
      </div>

      {loading ? (
        <div className="p-10 text-center text-sm text-slate-400">Loading dealers...</div>
      ) : filtered.length === 0 ? (
        <Card className="p-10 text-center text-sm text-slate-400">No dealers found.</Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((d) => (
            <Card key={d.id} className="p-5 flex flex-col justify-between gap-4 hover:shadow-md transition">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-100 dark:border-indigo-900/50">
                      <Store size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">{d.name}</h3>
                      <p className="text-[11px] text-slate-400 font-mono">{d.id} • {d.gstin || 'No GSTIN'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 text-xs font-bold">
                    <Star size={12} fill="currentColor" /> {d.rating}
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                  <p className="flex items-center gap-2"><Mail size={13} className="text-slate-400" /> {d.email || '—'}</p>
                  <p className="flex items-center gap-2"><Phone size={13} className="text-slate-400" /> {d.phone || '—'} ({d.contactPerson || 'Contact'})</p>
                  <p className="flex items-start gap-2"><MapPin size={13} className="text-slate-400 mt-0.5 flex-shrink-0" /> <span className="line-clamp-2">{d.address || '—'}</span></p>
                </div>

                <p className="text-[11px] text-slate-500 bg-slate-50 dark:bg-slate-800/40 p-2.5 rounded-xl line-clamp-2">
                  {d.services || 'General Furniture & Equipment'}
                </p>

                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                  <div>
                    <p className="text-sm font-extrabold font-mono text-slate-800 dark:text-white">{d.performance?.totalOrders || 0}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">POs</p>
                  </div>
                  <div>
                    <p className="text-sm font-extrabold font-mono text-slate-800 dark:text-white">{d.performance?.totalServiceJobs || 0}</p>
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Servicing</p>
                  </div>
                  <div>
                    <p className="text-sm font-extrabold font-mono text-emerald-600 dark:text-emerald-400">{d.performance?.onTimeRate ?? 100}%</p>
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">On-Time</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <Btn size="sm" variant="secondary" className="flex-1 justify-center" onClick={() => openDetail(d)}>
                  <History size={13} /> History & Logs
                </Btn>
                <Btn size="sm" variant="ghost" onClick={() => openEdit(d)} title="Edit Dealer">
                  <Edit3 size={14} />
                </Btn>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dealer Modal */}
      {showModal && (
        <Modal title={editingDealer ? 'Edit Dealer Profile' : 'Register Furniture Dealer'} onClose={() => setShowModal(false)} defaultSize="max-w-xl">
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Dealer / Company Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
              <Input label="Contact Person" value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} />
              <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <Input label="GSTIN" value={form.gstin} onChange={(e) => setForm({ ...form, gstin: e.target.value })} />
              <Input label="Rating (1-5)" type="number" step="0.1" min="1" max="5" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} />
            </div>
            <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
            <Input label="Furniture Categories & Services" value={form.services} onChange={(e) => setForm({ ...form, services: e.target.value })} placeholder="Classroom Desks, Ergonomic Chairs, Steel Cupboards, Repair..." />
            <div className="flex justify-end gap-2 pt-2">
              <Btn type="button" variant="secondary" onClick={() => setShowModal(false)}>Cancel</Btn>
              <Btn type="submit">{editingDealer ? 'Save Changes' : 'Register Dealer'}</Btn>
            </div>
          </form>
        </Modal>
      )}

      {/* Dealer History & Communications Modal */}
      {selectedDealerDetail && (
        <Modal title={`${selectedDealerDetail.dealer.name} — History & Communications`} onClose={() => setSelectedDealerDetail(null)} defaultSize="max-w-3xl">
          <div className="space-y-5 text-xs">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Purchase Orders</p>
                <p className="text-lg font-extrabold font-mono">{selectedDealerDetail.purchaseOrders?.length || 0}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Past Purchases</p>
                <p className="text-lg font-extrabold font-mono">{selectedDealerDetail.purchaseHistory?.length || 0}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                <p className="text-[10px] text-slate-400 uppercase font-bold">Servicing Jobs</p>
                <p className="text-lg font-extrabold font-mono">{selectedDealerDetail.serviceRequests?.length || 0}</p>
              </div>
            </div>

            <div>
              <h4 className="font-bold text-slate-800 dark:text-white mb-2">Previous Purchase History & Orders</h4>
              <div className="max-h-40 overflow-y-auto border border-slate-100 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800">
                {[...(selectedDealerDetail.purchaseOrders || []), ...(selectedDealerDetail.purchaseHistory || [])].length === 0 ? (
                  <p className="p-4 text-slate-400 text-center">No previous purchase records.</p>
                ) : (
                  <>
                    {(selectedDealerDetail.purchaseOrders || []).map((po) => (
                      <div key={po.id} className="p-2.5 flex justify-between items-center">
                        <span><strong>{po.po_number}</strong> • {po.department} ({String(po.order_date).slice(0, 10)})</span>
                        <span className="font-mono font-bold">₹{Number(po.total_amount).toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                    {(selectedDealerDetail.purchaseHistory || []).map((ph) => (
                      <div key={ph.id} className="p-2.5 flex justify-between items-center">
                        <span>{ph.assetName} • Qty {ph.quantity} ({String(ph.purchaseDate).slice(0, 10)})</span>
                        <span className="font-mono font-bold">₹{Number(ph.totalAmount).toLocaleString('en-IN')}</span>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>

            <div className="border-t border-slate-100 dark:border-slate-800 pt-4 space-y-3">
              <h4 className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                <MessageSquare size={14} className="text-indigo-600" /> Dealer Communication Log
              </h4>
              <form onSubmit={handleSendComm} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <select
                  value={commForm.channel}
                  onChange={(e) => setCommForm({ ...commForm, channel: e.target.value })}
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                >
                  {['Portal', 'Email', 'Phone', 'WhatsApp', 'In-Person'].map((c) => <option key={c}>{c}</option>)}
                </select>
                <input
                  value={commForm.subject}
                  onChange={(e) => setCommForm({ ...commForm, subject: e.target.value })}
                  placeholder="Subject *"
                  className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  required
                />
                <input
                  value={commForm.message}
                  onChange={(e) => setCommForm({ ...commForm, message: e.target.value })}
                  placeholder="Message / Call note *"
                  className="sm:col-span-2 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                  required
                />
                <div className="sm:col-span-4 flex justify-end">
                  <Btn type="submit" size="sm">Log Communication</Btn>
                </div>
              </form>

              <div className="max-h-40 overflow-y-auto space-y-2">
                {(selectedDealerDetail.communications || []).map((c) => (
                  <div key={c.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                    <div className="flex justify-between">
                      <span className="font-bold text-slate-800 dark:text-white">[{c.channel}] {c.subject}</span>
                      <span className="text-[10px] text-slate-400">{String(c.created_at).slice(0, 16).replace('T', ' ')}</span>
                    </div>
                    <p className="text-slate-600 dark:text-slate-400 mt-0.5">{c.message}</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">Logged by {c.logged_by_name}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
