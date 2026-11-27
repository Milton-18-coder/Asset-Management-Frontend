import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { TopBar } from '../../components/TopBar';
import { Card, Btn, Badge, Modal, Input, Select } from '../../components/UIComponents';
import { setFurnitureList } from '../../store/furnitureSlice';
import { setPurchaseHistoryList } from '../../store/purchaseHistorySlice';
import { api } from '../../api';
import { Truck, CheckCircle2, PackageCheck, RefreshCw } from 'lucide-react';

export const DeliveryTracking = () => {
  const dispatch = useDispatch();
  const { currentUser } = useSelector((state) => state.auth);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  const [verifyModalPo, setVerifyModalPo] = useState(null);
  const [verifyForm, setVerifyForm] = useState({
    actual_delivery_date: new Date().toISOString().slice(0, 10),
    delivery_challan_no: '',
    invoice_number: '',
    received_by: '',
    payment_status: 'Paid',
    target_building: 'Engineering Block',
    target_room: '',
    delivery_notes: '',
    partial: false,
  });

  const canManage = ['furniture_admin', 'superadmin'].includes(currentUser?.role);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await api.getPurchaseOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  if (!currentUser) return null;

  const openVerify = (po) => {
    setVerifyModalPo(po);
    setVerifyForm({
      actual_delivery_date: new Date().toISOString().slice(0, 10),
      delivery_challan_no: po.delivery_challan_no || `DC-${po.po_number}`,
      invoice_number: po.invoice_number || `INV-${po.po_number}`,
      received_by: currentUser.name,
      payment_status: 'Paid',
      target_building: po.items?.[0]?.target_building || 'Engineering Block',
      target_room: po.items?.[0]?.target_room || `${po.department.slice(0, 3).toUpperCase()}-101`,
      delivery_notes: po.delivery_notes || '',
      partial: false,
    });
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (!verifyModalPo) return;
    try {
      const res = await api.verifyPurchaseOrderDelivery(verifyModalPo.id, verifyForm);
      setVerifyModalPo(null);
      setToast(
        `Delivery verified for ${verifyModalPo.po_number}. ${
          res.syncedAssets?.length ? `Inventory synced (${res.syncedAssets.join(', ')})` : ''
        }`
      );
      setTimeout(() => setToast(''), 5000);
      await loadOrders();

      // Refresh Redux global assets and purchase history lists
      Promise.all([api.getAssets(), api.getPurchaseHistory()])
        .then(([assets, ph]) => {
          if (Array.isArray(assets)) dispatch(setFurnitureList(assets));
          if (Array.isArray(ph)) dispatch(setPurchaseHistoryList(ph));
        })
        .catch(() => {});
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <TopBar
        title="Delivery Tracking & Inventory Verification"
        subtitle="Coordinate Furniture Deliveries, Verify Physical Receipt & Update Asset Registry"
        user={currentUser}
      />

      {toast && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 size={16} /> {toast}
        </div>
      )}

      <div className="flex justify-end">
        <Btn size="sm" variant="secondary" onClick={loadOrders}><RefreshCw size={14} /> Refresh</Btn>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                <th className="px-5 py-3.5">PO Number</th>
                <th className="px-5 py-3.5">Dealer & Dept</th>
                <th className="px-5 py-3.5">Items</th>
                <th className="px-5 py-3.5">Expected Delivery</th>
                <th className="px-5 py-3.5">Actual Delivery</th>
                <th className="px-5 py-3.5">Delivery Status</th>
                <th className="px-5 py-3.5">Inventory Synced</th>
                {canManage && <th className="px-5 py-3.5 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
              {loading ? (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-slate-400">Loading deliveries...</td></tr>
              ) : orders.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-10 text-center text-slate-400">No purchase orders to track.</td></tr>
              ) : (
                orders.map((po) => (
                  <tr key={po.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition">
                    <td className="px-5 py-3.5 font-mono font-bold text-indigo-600 dark:text-indigo-400">{po.po_number}</td>
                    <td className="px-5 py-3.5">
                      <p className="font-bold text-slate-800 dark:text-white">{po.dealer_name}</p>
                      <p className="text-[11px] text-slate-400">{po.department}</p>
                    </td>
                    <td className="px-5 py-3.5">
                      {(po.items || []).map((it) => `${it.furniture_name} (×${it.quantity})`).join(', ')}
                    </td>
                    <td className="px-5 py-3.5 font-mono">{po.expected_delivery_date ? String(po.expected_delivery_date).slice(0, 10) : 'TBD'}</td>
                    <td className="px-5 py-3.5 font-mono">{po.actual_delivery_date ? String(po.actual_delivery_date).slice(0, 10) : '—'}</td>
                    <td className="px-5 py-3.5"><Badge label={po.delivery_status} /></td>
                    <td className="px-5 py-3.5">
                      {po.inventory_synced ? (
                        <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                          <CheckCircle2 size={13} /> Synced
                        </span>
                      ) : (
                        <span className="text-slate-400">Pending</span>
                      )}
                    </td>
                    {canManage && (
                      <td className="px-5 py-3.5 text-right">
                        {po.delivery_status !== 'Verified' && po.status !== 'Cancelled' ? (
                          <Btn size="sm" onClick={() => openVerify(po)}>
                            <PackageCheck size={14} /> Verify Delivery
                          </Btn>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-semibold">Verified by {po.verified_by}</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {verifyModalPo && (
        <Modal title={`Verify Delivery — ${verifyModalPo.po_number}`} onClose={() => setVerifyModalPo(null)} defaultSize="max-w-lg">
          <form onSubmit={handleVerifySubmit} className="space-y-4">
            <p className="text-xs text-slate-500">
              Verifying delivery will atomically update the Furniture Inventory (`assets`), record Purchase History, and log an audit trail without creating duplicate assets.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Actual Delivery Date *"
                type="date"
                value={verifyForm.actual_delivery_date}
                onChange={(e) => setVerifyForm({ ...verifyForm, actual_delivery_date: e.target.value })}
                required
              />
              <Select
                label="Payment Status"
                value={verifyForm.payment_status}
                onChange={(e) => setVerifyForm({ ...verifyForm, payment_status: e.target.value })}
                options={['Pending', 'Partial', 'Paid']}
              />
              <Input
                label="Delivery Challan No."
                value={verifyForm.delivery_challan_no}
                onChange={(e) => setVerifyForm({ ...verifyForm, delivery_challan_no: e.target.value })}
              />
              <Input
                label="Invoice Number"
                value={verifyForm.invoice_number}
                onChange={(e) => setVerifyForm({ ...verifyForm, invoice_number: e.target.value })}
              />
              <Input
                label="Target Building *"
                value={verifyForm.target_building}
                onChange={(e) => setVerifyForm({ ...verifyForm, target_building: e.target.value })}
                required
              />
              <Input
                label="Target Room *"
                value={verifyForm.target_room}
                onChange={(e) => setVerifyForm({ ...verifyForm, target_room: e.target.value })}
                required
              />
            </div>
            <Input
              label="Received By"
              value={verifyForm.received_by}
              onChange={(e) => setVerifyForm({ ...verifyForm, received_by: e.target.value })}
            />
            <Input
              label="Inspection & Delivery Remarks"
              value={verifyForm.delivery_notes}
              onChange={(e) => setVerifyForm({ ...verifyForm, delivery_notes: e.target.value })}
            />
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={verifyForm.partial}
                onChange={(e) => setVerifyForm({ ...verifyForm, partial: e.target.checked })}
                className="w-4 h-4 accent-indigo-600 rounded"
              />
              Mark as Partially Delivered (keep PO open for remaining items)
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <Btn type="button" variant="secondary" onClick={() => setVerifyModalPo(null)}>Cancel</Btn>
              <Btn type="submit">Confirm & Sync Inventory</Btn>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
