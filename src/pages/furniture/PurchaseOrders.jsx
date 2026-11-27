import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { TopBar } from '../../components/TopBar';
import { Card, Btn, Badge, Modal, Input, Select } from '../../components/UIComponents';
import { api } from '../../api';
import { ShoppingBag, Download, Plus, Send, RefreshCw, CheckCircle2, Truck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const PurchaseOrders = () => {
  const navigate = useNavigate();
  const { currentUser } = useSelector((state) => state.auth);
  const [orders, setOrders] = useState([]);
  const [approvedRequests, setApprovedRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');
  const [toast, setToast] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [selectedPrId, setSelectedPrId] = useState('');
  const [targetBuilding, setTargetBuilding] = useState('Engineering Block');
  const [targetRoom, setTargetRoom] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [poNotes, setPoNotes] = useState('');

  const canManage = ['furniture_admin', 'superadmin'].includes(currentUser?.role);

  const loadData = async () => {
    try {
      setLoading(true);
      const [poList, prList] = await Promise.all([
        api.getPurchaseOrders({ status: statusFilter }),
        canManage ? api.getPurchaseRequests({ status: 'Approved' }).catch(() => []) : Promise.resolve([]),
      ]);
      setOrders(Array.isArray(poList) ? poList : []);
      const appList = Array.isArray(prList) ? prList : [];
      setApprovedRequests(appList);
      if (appList.length > 0 && !selectedPrId) {
        setSelectedPrId(appList[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  if (!currentUser) return null;

  const notify = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 4000);
  };

  const handleCreatePo = async (e) => {
    e.preventDefault();
    try {
      await api.createPurchaseOrder({
        purchase_request_id: selectedPrId,
        target_building: targetBuilding,
        target_room: targetRoom,
        expected_delivery_date: expectedDate || null,
        delivery_notes: poNotes,
        status: 'Approved',
      });
      setShowCreate(false);
      notify('Purchase Order generated successfully.');
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleSendToDealer = async (po) => {
    try {
      await api.updatePurchaseOrderStatus(po.id, {
        status: 'Sent to Dealer',
        delivery_status: 'Processing',
      });
      notify(`Purchase Order ${po.po_number} dispatched to ${po.dealer_name}.`);
      await loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDownloadPdf = async (po) => {
    try {
      const blob = await api.downloadPurchaseOrderPdf(po.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${po.po_number || po.id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Failed to download PO PDF: ' + err.message);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <TopBar
        title="Purchase Orders"
        subtitle="Generate, Dispatch & Download Official Furniture Purchase Orders"
        user={currentUser}
      />

      {toast && (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 size={15} /> {toast}
        </div>
      )}

      <Card className="p-4 flex flex-wrap items-center justify-between gap-3">
        <Select
          label="PO Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={['All', 'Draft', 'Awaiting Approval', 'Approved', 'Sent to Dealer', 'Processing', 'Partially Delivered', 'Delivered', 'Cancelled']}
          className="py-1.5 text-xs max-w-xs"
        />
        <div className="flex items-center gap-2">
          <Btn size="sm" variant="secondary" onClick={loadData}><RefreshCw size={14} /> Refresh</Btn>
          {canManage && (
            <Btn size="sm" onClick={() => setShowCreate(true)} disabled={approvedRequests.length === 0}>
              <Plus size={15} /> Create PO ({approvedRequests.length} Approved)
            </Btn>
          )}
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                <th className="px-5 py-3.5">PO Number</th>
                <th className="px-5 py-3.5">Request ID</th>
                <th className="px-5 py-3.5">Dealer</th>
                <th className="px-5 py-3.5">Department</th>
                <th className="px-5 py-3.5">Items</th>
                <th className="px-5 py-3.5">Total Amount</th>
                <th className="px-5 py-3.5">Payment</th>
                <th className="px-5 py-3.5">Delivery</th>
                <th className="px-5 py-3.5">PO Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {loading ? (
                <tr><td colSpan={10} className="px-5 py-10 text-center text-slate-400">Loading purchase orders...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={10} className="px-5 py-10 text-center text-slate-400">No purchase orders found.</td></tr>
              ) : (
                orders.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition">
                    <td className="px-5 py-3.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">{po.po_number}</td>
                    <td className="px-5 py-3.5 font-mono">{po.purchase_request_id}</td>
                    <td className="px-5 py-3.5 font-bold text-slate-800 dark:text-white">{po.dealer_name}</td>
                    <td className="px-5 py-3.5">{po.department}</td>
                    <td className="px-5 py-3.5">
                      {(po.items || []).map((it) => `${it.furniture_name} (×${it.quantity})`).join(', ') || po.request_furniture_name}
                    </td>
                    <td className="px-5 py-3.5 font-mono font-bold">₹{Number(po.total_amount || 0).toLocaleString('en-IN')}</td>
                    <td className="px-5 py-3.5"><Badge label={po.payment_status} /></td>
                    <td className="px-5 py-3.5"><Badge label={po.delivery_status} /></td>
                    <td className="px-5 py-3.5"><Badge label={po.status} /></td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Btn size="sm" variant="secondary" onClick={() => handleDownloadPdf(po)} title="Download PDF">
                          <Download size={13} /> PDF
                        </Btn>
                        {canManage && ['Approved', 'Draft'].includes(po.status) && (
                          <Btn size="sm" onClick={() => handleSendToDealer(po)}>
                            <Send size={13} /> Send
                          </Btn>
                        )}
                        {canManage && !['Delivered', 'Cancelled'].includes(po.status) && (
                          <Btn size="sm" variant="ghost" onClick={() => navigate('/furniture-admin/deliveries')}>
                            <Truck size={13} /> Verify
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

      {showCreate && (
        <Modal title="Generate Purchase Order from Approved Request" onClose={() => setShowCreate(false)}>
          <form onSubmit={handleCreatePo} className="space-y-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase">Super Admin Approved Request *</label>
              <select
                value={selectedPrId}
                onChange={(e) => setSelectedPrId(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900"
                required
              >
                {approvedRequests.map((pr) => (
                  <option key={pr.id} value={pr.id}>{pr.id} — {pr.furniture_name} ({pr.department}, Qty {pr.quantity})</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Input label="Target Building" value={targetBuilding} onChange={(e) => setTargetBuilding(e.target.value)} />
              <Input label="Target Room" value={targetRoom} onChange={(e) => setTargetRoom(e.target.value)} placeholder="e.g., ME-102" />
            </div>
            <Input label="Expected Delivery Date" type="date" value={expectedDate} onChange={(e) => setExpectedDate(e.target.value)} />
            <Input label="Order Notes" value={poNotes} onChange={(e) => setPoNotes(e.target.value)} placeholder="Delivery gate instructions..." />
            <div className="flex justify-end gap-2 pt-2">
              <Btn type="button" variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Btn>
              <Btn type="submit">Generate Purchase Order</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
