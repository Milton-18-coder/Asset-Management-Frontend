import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '../../components/TopBar';
import { StatCard, Card, Badge, Btn } from '../../components/UIComponents';
import { api } from '../../api';
import {
  ClipboardList, Clock, FileSpreadsheet, Truck, Wrench, CheckCircle2,
  IndianRupee, ArrowRight, RefreshCw, AlertCircle, Store, Calendar, TrendingUp
} from 'lucide-react';

export const FurnitureDashboard = () => {
  const navigate = useNavigate();
  const { currentUser } = useSelector((state) => state.auth);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = async () => {
    try {
      setLoading(true);
      setError('');
      const res = await api.getFurnitureDashboard();
      setData(res);
    } catch (err) {
      setError(err.message || 'Failed to load Furniture Admin dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (!currentUser) return null;

  const kpis = data?.kpis || {};
  const monthlyData = data?.monthlyProcurementExpenditure || [];
  const maxMonthVal = Math.max(...monthlyData.map((m) => Number(m.value || 0)), 1);

  return (
    <div className="space-y-6 pb-10">
      <TopBar
        title="Furniture Admin Dashboard"
        subtitle="Central Procurement, Quotation, Order & Servicing Coordination"
        user={currentUser}
      />

      {error && (
        <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400 text-sm font-semibold">
          <div className="flex items-center gap-2">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
          <Btn size="sm" variant="secondary" onClick={loadDashboard}>
            <RefreshCw size={14} /> Retry
          </Btn>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <Card key={i} className="p-5 animate-pulse">
              <div className="h-3 w-24 bg-slate-200 dark:bg-slate-800 rounded mb-3" />
              <div className="h-8 w-16 bg-slate-200 dark:bg-slate-800 rounded mb-2" />
              <div className="h-2.5 w-32 bg-slate-100 dark:bg-slate-800/60 rounded" />
            </Card>
          ))}
        </div>
      ) : (
        <>
          {/* 7 Required KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<ClipboardList size={20} />}
              label="Total Purchase Requests"
              value={kpis.totalPurchaseRequests ?? 0}
              sub="All department requests"
              onClick={() => navigate('/furniture-admin/purchase-requests')}
              color="bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-950/20 dark:border-indigo-900/50 dark:text-indigo-400"
            />
            <StatCard
              icon={<Clock size={20} />}
              label="Pending Purchase Requests"
              value={kpis.pendingPurchaseRequests ?? 0}
              sub="Awaiting processing/approval"
              onClick={() => navigate('/furniture-admin/purchase-requests?status=Pending')}
              color="bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-950/20 dark:border-amber-900/50 dark:text-amber-400"
            />
            <StatCard
              icon={<FileSpreadsheet size={20} />}
              label="Quotations Awaiting Review"
              value={kpis.quotationsAwaitingReview ?? 0}
              sub="Ready for comparison"
              onClick={() => navigate('/furniture-admin/quotations')}
              color="bg-cyan-50 border-cyan-200 text-cyan-600 dark:bg-cyan-950/20 dark:border-cyan-900/50 dark:text-cyan-400"
            />
            <StatCard
              icon={<Truck size={20} />}
              label="Orders Awaiting Delivery"
              value={kpis.ordersAwaitingDelivery ?? 0}
              sub="Open purchase orders"
              onClick={() => navigate('/furniture-admin/deliveries')}
              color="bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-950/20 dark:border-blue-900/50 dark:text-blue-400"
            />
            <StatCard
              icon={<Wrench size={20} />}
              label="Active Servicing Requests"
              value={kpis.activeServicingRequests ?? 0}
              sub="Ongoing repair & upkeep"
              onClick={() => navigate('/furniture-admin/servicing')}
              color="bg-orange-50 border-orange-200 text-orange-600 dark:bg-orange-950/20 dark:border-orange-900/50 dark:text-orange-400"
            />
            <StatCard
              icon={<CheckCircle2 size={20} />}
              label="Completed Servicing Requests"
              value={kpis.completedServicingRequests ?? 0}
              sub="Verified & closed"
              onClick={() => navigate('/furniture-admin/servicing?status=Verified')}
              color="bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900/50 dark:text-emerald-400"
            />
            <StatCard
              icon={<IndianRupee size={20} />}
              label="Total Procurement Expenditure"
              value={`₹${Number(kpis.totalProcurementExpenditure || 0).toLocaleString('en-IN')}`}
              sub="POs + Furniture history"
              onClick={() => navigate('/furniture-admin/reports')}
              color="bg-violet-50 border-violet-200 text-violet-600 dark:bg-violet-950/20 dark:border-violet-900/50 dark:text-violet-400"
            />
          </div>

          {/* 7. Monthly Procurement Expenditure Chart & 6. Servicing Status Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="p-6 lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-white font-display flex items-center gap-2">
                    <TrendingUp size={16} className="text-indigo-600 dark:text-indigo-400" />
                    Monthly Procurement Expenditure
                  </h3>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Furniture spend trajectory across months</p>
                </div>
                <Btn size="sm" variant="secondary" onClick={() => navigate('/furniture-admin/reports')}>
                  Full Reports <ArrowRight size={13} />
                </Btn>
              </div>
              {monthlyData.length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">No monthly expenditure records yet.</div>
              ) : (
                <div className="flex items-end gap-3 h-48 pt-6">
                  {monthlyData.map((m) => {
                    const hPct = Math.max(8, Math.round((Number(m.value || 0) / maxMonthVal) * 100));
                    return (
                      <div key={m.monthKey} className="flex-1 flex flex-col items-center justify-end h-full group">
                        <span className="text-[10px] font-mono font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                          ₹{Number(m.value) >= 100000 ? `${(Number(m.value) / 100000).toFixed(1)}L` : `${Math.round(Number(m.value) / 1000)}k`}
                        </span>
                        <div className="w-full max-w-[44px] bg-slate-100 dark:bg-slate-800 rounded-t-xl h-36 flex items-end overflow-hidden">
                          <div
                            className="w-full bg-indigo-600 dark:bg-indigo-500 rounded-t-xl transition-all duration-500 group-hover:bg-indigo-500"
                            style={{ height: `${hPct}%` }}
                          />
                        </div>
                        <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-2 truncate max-w-full">
                          {m.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>

            {/* 6. Servicing Status Overview */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white font-display">Servicing Status Overview</h3>
                <button onClick={() => navigate('/furniture-admin/servicing')} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">
                  View all
                </button>
              </div>
              {(data?.servicingStatusOverview || []).length === 0 ? (
                <div className="py-12 text-center text-xs text-slate-400">No servicing requests logged yet.</div>
              ) : (
                <div className="space-y-3">
                  {data.servicingStatusOverview.map((s) => (
                    <div key={s.status} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                      <Badge label={s.status} />
                      <span className="text-sm font-extrabold font-mono text-slate-800 dark:text-white">{s.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* 1. Recent Purchase Requests & 2. Recent Servicing Requests */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white font-display">Recent Purchase Requests</h3>
                <button onClick={() => navigate('/furniture-admin/purchase-requests')} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">
                  Manage all →
                </button>
              </div>
              {(data?.recentPurchaseRequests || []).length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No purchase requests found.</p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.recentPurchaseRequests.map((pr) => (
                    <div
                      key={pr.id}
                      onClick={() => navigate(`/furniture-admin/purchase-requests/${pr.id}`)}
                      className="py-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-xl transition"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{pr.furniture_name}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">{pr.id}</span> • {pr.department} • Qty {pr.quantity}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge label={pr.priority} />
                        <Badge label={pr.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white font-display">Recent Servicing Requests</h3>
                <button onClick={() => navigate('/furniture-admin/servicing')} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">
                  Manage all →
                </button>
              </div>
              {(data?.recentServicingRequests || []).length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No servicing requests found.</p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.recentServicingRequests.map((sr) => (
                    <div
                      key={sr.id}
                      onClick={() => navigate(`/furniture-admin/servicing/${sr.id}`)}
                      className="py-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-xl transition"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{sr.furniture_name}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          <span className="font-mono text-indigo-600 dark:text-indigo-400 font-semibold">{sr.id}</span> • {sr.department} • {sr.assigned_dealer_name || 'Unassigned'}
                        </p>
                      </div>
                      <Badge label={sr.status} />
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* 3. Pending Dealer Quotations & 4. Recent Purchase Orders */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white font-display">Pending Dealer Quotations</h3>
                <button onClick={() => navigate('/furniture-admin/quotations')} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">
                  Quotations →
                </button>
              </div>
              {(data?.pendingDealerQuotations || []).length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No pending dealer quotations.</p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.pendingDealerQuotations.map((q) => (
                    <div
                      key={q.id}
                      onClick={() => q.purchase_request_id && navigate(`/furniture-admin/quotations/compare/${q.purchase_request_id}`)}
                      className="py-3 flex items-center justify-between gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 px-2 rounded-xl transition"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{q.dealer_name}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {q.id} • {q.furniture_name} (Qty {q.quantity})
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-xs font-bold font-mono text-slate-800 dark:text-white">
                          {Number(q.grand_total) > 0 ? `₹${Number(q.grand_total).toLocaleString('en-IN')}` : 'Awaiting Quote'}
                        </p>
                        <Badge label={q.status} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white font-display">Recent Purchase Orders</h3>
                <button onClick={() => navigate('/furniture-admin/purchase-orders')} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">
                  Orders →
                </button>
              </div>
              {(data?.recentPurchaseOrders || []).length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No purchase orders generated yet.</p>
              ) : (
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {data.recentPurchaseOrders.map((po) => (
                    <div key={po.id} className="py-3 flex items-center justify-between gap-3 px-2">
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{po.po_number} • {po.dealer_name}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{po.department} • ₹{Number(po.total_amount || 0).toLocaleString('en-IN')}</p>
                      </div>
                      <Badge label={po.status} />
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* 5. Upcoming Deliveries & 8. Dealer Performance Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white font-display flex items-center gap-2">
                  <Calendar size={15} className="text-indigo-600 dark:text-indigo-400" />
                  Upcoming Deliveries
                </h3>
                <button onClick={() => navigate('/furniture-admin/deliveries')} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">
                  Track all →
                </button>
              </div>
              {(data?.upcomingDeliveries || []).length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No pending deliveries scheduled.</p>
              ) : (
                <div className="space-y-2.5">
                  {data.upcomingDeliveries.map((d) => (
                    <div key={d.id} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-bold text-slate-800 dark:text-white">{d.po_number} — {d.dealer_name}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          Expected: <span className="font-semibold text-indigo-600 dark:text-indigo-400">{String(d.expected_delivery_date).slice(0, 10)}</span> • {d.department}
                        </p>
                      </div>
                      <Badge label={d.delivery_status} />
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-slate-800 dark:text-white font-display flex items-center gap-2">
                  <Store size={15} className="text-emerald-600 dark:text-emerald-400" />
                  Dealer Performance Overview
                </h3>
                <button onClick={() => navigate('/furniture-admin/dealers')} className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer">
                  All Dealers →
                </button>
              </div>
              {(data?.dealerPerformanceOverview || []).length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No dealer records available.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider">
                        <th className="pb-2">Dealer</th>
                        <th className="pb-2">Orders</th>
                        <th className="pb-2">Service Jobs</th>
                        <th className="pb-2">Total Value</th>
                        <th className="pb-2">Rating</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                      {data.dealerPerformanceOverview.map((d) => (
                        <tr key={d.id}>
                          <td className="py-2.5 font-bold text-slate-800 dark:text-slate-200">{d.name}</td>
                          <td className="py-2.5 font-mono">{d.totalOrders}</td>
                          <td className="py-2.5 font-mono">{d.serviceJobs}</td>
                          <td className="py-2.5 font-mono">₹{Number(d.totalSpend || 0).toLocaleString('en-IN')}</td>
                          <td className="py-2.5 font-bold text-amber-600 dark:text-amber-400">★ {d.rating}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
};
