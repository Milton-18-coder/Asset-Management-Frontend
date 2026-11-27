import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { TopBar } from '../../components/TopBar';
import { StatCard, Card, Btn, Badge, Input, Select } from '../../components/UIComponents';
import { ALLOWED_DEPARTMENTS } from '../../constants/departments';
import { api } from '../../api';
import { Download, FileSpreadsheet, IndianRupee, Truck, CheckCircle2, Clock, RefreshCw } from 'lucide-react';

export const ProcurementReports = () => {
  const { currentUser } = useSelector((state) => state.auth);
  const [report, setReport] = useState(null);
  const [dealers, setDealers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [department, setDepartment] = useState('All');
  const [dealerId, setDealerId] = useState('All');

  const loadReports = async () => {
    try {
      setLoading(true);
      const [rep, dList] = await Promise.all([
        api.getFurnitureAnalytics({ from, to, department, dealerId }),
        dealers.length === 0 ? api.getDealers().catch(() => []) : Promise.resolve(dealers),
      ]);
      setReport(rep);
      if (dealers.length === 0 && Array.isArray(dList)) setDealers(dList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [from, to, department, dealerId]);

  if (!currentUser) return null;

  const handleExportPdf = async () => {
    try {
      const blob = await api.downloadFurnitureReportPdf({ from, to, department, dealerId });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `AssetMS_Furniture_Report_${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleExportCsv = async () => {
    try {
      const blob = await api.downloadFurnitureReportCsv({ from, to, department, dealerId });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `AssetMS_Furniture_Report_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message);
    }
  };

  const summary = report?.summary || {};
  const monthlyTrends = report?.monthlyTrends || [];
  const maxMonth = Math.max(...monthlyTrends.map((m) => Number(m.totalSpend || 0)), 1);

  return (
    <div className="space-y-6 pb-12">
      <TopBar
        title="Furniture Procurement & Servicing Reports"
        subtitle="Departmental Requisitions, Dealer Spend, Delivery & Servicing Analytics"
        user={currentUser}
      />

      {/* Filters & Exports */}
      <Card className="p-4 space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Input label="From Date" type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="py-1.5 text-xs" />
          <Input label="To Date" type="date" value={to} onChange={(e) => setTo(e.target.value)} className="py-1.5 text-xs" />
          <Select label="Department" value={department} onChange={(e) => setDepartment(e.target.value)} options={['All', ...ALLOWED_DEPARTMENTS]} className="py-1.5 text-xs" />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 uppercase">Dealer</label>
            <select
              value={dealerId}
              onChange={(e) => setDealerId(e.target.value)}
              className="px-3.5 py-1.5 text-xs border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900"
            >
              <option value="All">All Dealers</option>
              {dealers.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <Btn size="sm" variant="secondary" onClick={loadReports}><RefreshCw size={14} /> Refresh</Btn>
          <Btn size="sm" variant="secondary" onClick={handleExportCsv}><FileSpreadsheet size={14} /> Export CSV</Btn>
          <Btn size="sm" onClick={handleExportPdf}><Download size={14} /> Download PDF Report</Btn>
        </div>
      </Card>

      {/* Summary KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          icon={<IndianRupee size={18} />}
          label="Procurement Spend"
          value={`₹${Number(summary.totalProcurementExpenditure || 0).toLocaleString('en-IN')}`}
          sub="Purchase orders total"
          color="bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-950/20 dark:border-indigo-900/50 dark:text-indigo-400"
        />
        <StatCard
          icon={<IndianRupee size={18} />}
          label="Servicing Spend"
          value={`₹${Number(summary.totalServicingExpenditure || 0).toLocaleString('en-IN')}`}
          sub="Repairs & upkeep"
          color="bg-amber-50 border-amber-200 text-amber-600 dark:bg-amber-950/20 dark:border-amber-900/50 dark:text-amber-400"
        />
        <StatCard
          icon={<Truck size={18} />}
          label="Pending POs"
          value={summary.pendingPurchaseOrders ?? 0}
          sub="Awaiting fulfillment"
          color="bg-blue-50 border-blue-200 text-blue-600 dark:bg-blue-950/20 dark:border-blue-900/50 dark:text-blue-400"
        />
        <StatCard
          icon={<CheckCircle2 size={18} />}
          label="Completed Deliveries"
          value={summary.completedDeliveries ?? 0}
          sub="Verified & synced"
          color="bg-emerald-50 border-emerald-200 text-emerald-600 dark:bg-emerald-950/20 dark:border-emerald-900/50 dark:text-emerald-400"
        />
        <StatCard
          icon={<Clock size={18} />}
          label="Avg Servicing Time"
          value={`${summary.avgServicingDays ?? 0}d`}
          sub="Days to completion"
          color="bg-violet-50 border-violet-200 text-violet-600 dark:bg-violet-950/20 dark:border-violet-900/50 dark:text-violet-400"
        />
      </div>

      {loading ? (
        <Card className="p-10 text-center text-sm text-slate-400">Generating live analytics...</Card>
      ) : (
        <>
          {/* Monthly Purchase Trends */}
          <Card className="p-6">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white font-display mb-4">Monthly Purchase Trends</h3>
            {monthlyTrends.length === 0 ? (
              <p className="text-xs text-slate-400 py-6 text-center">No purchase order trend data in selected range.</p>
            ) : (
              <div className="space-y-3">
                {monthlyTrends.map((m) => (
                  <div key={m.monthKey} className="flex items-center gap-3 text-xs">
                    <span className="w-24 font-semibold text-slate-600 dark:text-slate-300">{m.monthLabel}</span>
                    <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${Math.max(5, Math.round((Number(m.totalSpend) / maxMonth) * 100))}%` }} />
                    </div>
                    <span className="w-28 text-right font-mono font-bold">₹{Number(m.totalSpend).toLocaleString('en-IN')}</span>
                    <span className="w-16 text-right text-slate-400">{m.orderCount} PO(s)</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Department-wise Purchase & Servicing */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white font-display mb-3">Department-wise Purchase Requests</h3>
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 uppercase">
                    <th className="pb-2">Department</th>
                    <th className="pb-2">Requests</th>
                    <th className="pb-2">Total Qty</th>
                    <th className="pb-2">Completed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {(report?.departmentPurchaseRequests || []).map((d) => (
                    <tr key={d.department}>
                      <td className="py-2.5 font-bold">{d.department}</td>
                      <td className="py-2.5 font-mono">{d.totalRequests}</td>
                      <td className="py-2.5 font-mono">{d.totalQuantity}</td>
                      <td className="py-2.5 font-mono text-emerald-600">{d.completedCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>

            <Card className="p-6">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white font-display mb-3">Department-wise Servicing Requests</h3>
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 uppercase">
                    <th className="pb-2">Department</th>
                    <th className="pb-2">Requests</th>
                    <th className="pb-2">Completed</th>
                    <th className="pb-2">Total Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {(report?.departmentServicingRequests || []).map((d) => (
                    <tr key={d.department}>
                      <td className="py-2.5 font-bold">{d.department}</td>
                      <td className="py-2.5 font-mono">{d.totalRequests}</td>
                      <td className="py-2.5 font-mono text-emerald-600">{d.completedCount}</td>
                      <td className="py-2.5 font-mono">₹{Number(d.totalCost || 0).toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
          </div>

          {/* Dealer-wise Purchases, Servicing Expenditure & Performance */}
          <Card className="p-6">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white font-display mb-3">Dealer-wise Purchases, Servicing Expenditure & Performance</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 uppercase">
                    <th className="pb-2">Dealer Name</th>
                    <th className="pb-2">Purchase Orders</th>
                    <th className="pb-2">Purchase Value</th>
                    <th className="pb-2">Service Jobs</th>
                    <th className="pb-2">Service Spend</th>
                    <th className="pb-2">Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                  {(report?.dealerPerformance || []).map((d) => (
                    <tr key={d.id}>
                      <td className="py-2.5 font-bold text-slate-800 dark:text-white">{d.name}</td>
                      <td className="py-2.5 font-mono">{d.totalOrders}</td>
                      <td className="py-2.5 font-mono">₹{Number(d.totalPurchaseValue || 0).toLocaleString('en-IN')}</td>
                      <td className="py-2.5 font-mono">{d.totalServiceJobs}</td>
                      <td className="py-2.5 font-mono">₹{Number(d.totalServiceSpend || 0).toLocaleString('en-IN')}</td>
                      <td className="py-2.5 font-bold text-amber-600">★ {d.rating}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Pending POs & Completed Deliveries */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white font-display mb-3">Pending Purchase Orders</h3>
              {(report?.pendingOrdersList || []).length === 0 ? (
                <p className="text-xs text-slate-400">No pending purchase orders.</p>
              ) : (
                <div className="space-y-2 text-xs">
                  {report.pendingOrdersList.map((po) => (
                    <div key={po.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 flex justify-between items-center">
                      <div>
                        <p className="font-bold">{po.po_number} • {po.dealer_name}</p>
                        <p className="text-[11px] text-slate-400">{po.department} • Expected: {po.expected_delivery_date ? String(po.expected_delivery_date).slice(0, 10) : 'TBD'}</p>
                      </div>
                      <Badge label={po.status} />
                    </div>
                  ))}
                </div>
              )}
            </Card>

            <Card className="p-6">
              <h3 className="text-sm font-bold text-slate-800 dark:text-white font-display mb-3">Completed Deliveries</h3>
              {(report?.completedDeliveriesList || []).length === 0 ? (
                <p className="text-xs text-slate-400">No completed deliveries in selected range.</p>
              ) : (
                <div className="space-y-2 text-xs">
                  {report.completedDeliveriesList.map((po) => (
                    <div key={po.id} className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 flex justify-between items-center">
                      <div>
                        <p className="font-bold">{po.po_number} • {po.dealer_name}</p>
                        <p className="text-[11px] text-slate-400">{po.department} • Delivered: {po.actual_delivery_date ? String(po.actual_delivery_date).slice(0, 10) : '—'}</p>
                      </div>
                      <span className="font-mono font-bold text-emerald-600">₹{Number(po.total_amount).toLocaleString('en-IN')}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </>
      )}
    </div>
  );
};
