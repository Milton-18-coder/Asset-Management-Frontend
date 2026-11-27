import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useParams, useNavigate } from 'react-router-dom';
import { TopBar } from '../../components/TopBar';
import { Card, Btn, Badge, Input } from '../../components/UIComponents';
import { api } from '../../api';
import { Scale, Star, Clock, Award, CheckCircle2, ArrowRight, FileText } from 'lucide-react';

export const QuotationComparison = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useSelector((state) => state.auth);

  const [requests, setRequests] = useState([]);
  const [selectedPrId, setSelectedPrId] = useState(requestId || '');
  const [comparison, setComparison] = useState(null);
  const [loading, setLoading] = useState(true);
  const [remarks, setRemarks] = useState('');
  const [toast, setToast] = useState('');

  const canRecommend = ['furniture_admin', 'superadmin'].includes(currentUser?.role);

  useEffect(() => {
    api.getPurchaseRequests().then((list) => {
      const arr = Array.isArray(list) ? list : [];
      setRequests(arr);
      if (!selectedPrId && arr.length > 0) {
        const withQuotes = arr.find((r) => r.quotations_total_count > 0) || arr[0];
        setSelectedPrId(withQuotes.id);
      }
    }).catch(() => {});
  }, []);

  const loadComparison = async (prId) => {
    if (!prId) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const data = await api.compareQuotations(prId);
      setComparison(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (requestId) setSelectedPrId(requestId);
  }, [requestId]);

  useEffect(() => {
    if (selectedPrId) loadComparison(selectedPrId);
  }, [selectedPrId]);

  if (!currentUser) return null;

  const handleRecommend = async (quotationId) => {
    try {
      await api.recommendQuotation(selectedPrId, {
        quotationId,
        remarks: remarks || 'Recommended after multi-dealer comparison.',
      });
      setToast('Quotation recommended and forwarded to Super Admin for approval (pending Super Admin review).');
      setTimeout(() => setToast(''), 5000);
      await loadComparison(selectedPrId);
    } catch (err) {
      alert(err.message);
    }
  };

  const pr = comparison?.purchaseRequest;
  const quotes = comparison?.quotations || [];

  return (
    <div className="space-y-6 pb-12">
      <TopBar
        title="Quotation Comparison"
        subtitle="Compare Dealer Offers by Cost, Warranty, Delivery & Rating"
        user={currentUser}
      />

      {toast && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 text-emerald-700 dark:text-emerald-300 text-xs font-bold flex items-center gap-2">
          <CheckCircle2 size={16} /> {toast}
        </div>
      )}

      <Card className="p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex-1 min-w-[260px]">
          <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Select Purchase Request to Compare</label>
          <select
            value={selectedPrId}
            onChange={(e) => setSelectedPrId(e.target.value)}
            className="w-full px-3.5 py-2.5 text-xs font-semibold border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-slate-800 dark:text-white"
          >
            {requests.map((r) => (
              <option key={r.id} value={r.id}>
                {r.id} — {r.furniture_name} ({r.department}, Qty {r.quantity}) [{r.status}]
              </option>
            ))}
          </select>
        </div>
        {pr && (
          <div className="flex items-center gap-3">
            <Badge label={pr.status} />
            <Btn size="sm" variant="secondary" onClick={() => navigate(`/furniture-admin/purchase-requests/${pr.id}`)}>
              View Request <ArrowRight size={13} />
            </Btn>
          </div>
        )}
      </Card>

      {canRecommend && pr && !['Approved', 'Order Placed', 'Completed'].includes(pr.status) && (
        <Card className="p-4">
          <Input
            label="Recommendation Remarks (forwarded to Super Admin)"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="e.g., Best total cost with 3-year on-site warranty and earliest delivery..."
          />
        </Card>
      )}

      {loading ? (
        <Card className="p-10 text-center text-sm text-slate-400">Loading comparison matrix...</Card>
      ) : quotes.length === 0 ? (
        <Card className="p-10 text-center text-sm text-slate-400">
          No quotations recorded for this purchase request yet. Request quotations from dealers first.
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {quotes.map((q) => {
            const hasPrice = Number(q.grand_total) > 0;
            const isRecommended = q.status === 'Recommended' || q.status === 'Approved';
            return (
              <Card
                key={q.id}
                className={`p-5 flex flex-col justify-between gap-4 border-2 transition ${
                  isRecommended
                    ? 'border-indigo-500 dark:border-indigo-500 shadow-lg shadow-indigo-500/10'
                    : 'border-slate-200/80 dark:border-slate-800'
                }`}
              >
                <div className="space-y-4">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[11px] font-mono font-bold text-indigo-600 dark:text-indigo-400">{q.id}</p>
                      <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-0.5">{q.dealer_name}</h3>
                    </div>
                    <Badge label={q.status} />
                  </div>

                  {/* Highlight Chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {q.isLowestCost && hasPrice && (
                      <span className="px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold flex items-center gap-1">
                        <Award size={11} /> Lowest Total Cost
                      </span>
                    )}
                    {q.isFastestDelivery && hasPrice && (
                      <span className="px-2 py-0.5 rounded-lg bg-sky-50 dark:bg-sky-950/30 text-sky-700 dark:text-sky-400 text-[10px] font-bold flex items-center gap-1">
                        <Clock size={11} /> Fastest Delivery
                      </span>
                    )}
                    {q.isHighestRated && (
                      <span className="px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-[10px] font-bold flex items-center gap-1">
                        <Star size={11} /> Top Rated ({q.dealer_rating})
                      </span>
                    )}
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Unit Price × {q.quantity}</span>
                      <span className="font-mono font-bold">
                        {hasPrice ? `₹${Number(q.unit_price).toLocaleString('en-IN')}` : 'Pending'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Base Subtotal</span>
                      <span className="font-mono">₹{Number(q.total_price || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">GST ({q.gst_percent}%)</span>
                      <span className="font-mono">₹{Number(q.gst_amount || 0).toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Transport + Installation</span>
                      <span className="font-mono">
                        ₹{(Number(q.transportation_charges || 0) + Number(q.installation_charges || 0)).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-700 text-sm font-extrabold text-slate-900 dark:text-white">
                      <span>Total Cost</span>
                      <span className="font-mono text-indigo-600 dark:text-indigo-400">
                        {hasPrice ? `₹${Number(q.grand_total).toLocaleString('en-IN')}` : 'Awaiting'}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5 text-xs">
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Warranty</p>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">{q.warranty_period || '—'}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Delivery Duration</p>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">
                        {q.delivery_duration_days ? `${q.delivery_duration_days} days` : '—'}
                      </p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Dealer Rating</p>
                      <p className="font-bold text-amber-600 dark:text-amber-400">★ {q.dealer_rating} / 5</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 uppercase font-bold">Past Orders</p>
                      <p className="font-mono font-semibold">{q.past_orders_count || 0} POs</p>
                    </div>
                  </div>

                  {q.quotation_document && (
                    <p className="text-[11px] text-indigo-600 dark:text-indigo-400 flex items-center gap-1.5 font-semibold">
                      <FileText size={13} /> {q.quotation_document}
                    </p>
                  )}
                  {q.additional_remarks && (
                    <p className="text-[11px] text-slate-500 italic">"{q.additional_remarks}"</p>
                  )}
                </div>

                {canRecommend && hasPrice && !['Approved', 'Order Placed', 'Completed'].includes(pr?.status) && (
                  <Btn
                    size="sm"
                    variant={q.status === 'Recommended' ? 'secondary' : 'primary'}
                    disabled={q.status === 'Recommended'}
                    onClick={() => handleRecommend(q.id)}
                    className="w-full justify-center"
                  >
                    {q.status === 'Recommended' ? 'Recommended (Awaiting Super Admin)' : 'Recommend Quotation'}
                  </Btn>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
