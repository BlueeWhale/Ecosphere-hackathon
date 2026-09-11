import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Check, ShieldCheck, Radio, Star } from 'lucide-react';
import { productAPI } from '../services/api';

export function Products() {
  const [products, setProducts] = useState([]);
  const [billingPeriod, setBillingPeriod] = useState('monthly');
  const [loading, setLoading] = useState(true);

  const billingOptions = [
    { id: 'monthly', label: 'Monthly' },
    { id: 'sixMonths', label: '6 Months' },
    { id: 'annually', label: 'Annually' },
  ];

  const visibleProducts = products
    .filter((product) => {
      if (billingPeriod === 'annually') return product.pricePeriod === 'year';
      return product.pricePeriod === 'month';
    })
    .map((product) => ({
      ...product,
      displayPrice: billingPeriod === 'sixMonths' ? product.sixMonthAmount : product.priceAmount,
      displayPeriod: billingPeriod === 'sixMonths' ? '6 months' : product.pricePeriod,
    }))
    .filter((product) => product.displayPrice !== null && product.displayPrice !== undefined);

  useEffect(() => {
    async function loadCatalog() {
      try {
        setLoading(true);
        const res = await productAPI.getProducts();
        if (res.data?.success && Array.isArray(res.data.data)) {
          setProducts(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load products catalog:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCatalog();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Product Catalog & Pricing Tiers"
        subtitle="Authoritative backend pricing configurations consumed by Deterministic Pricing Engine."
      />

      <div className="flex justify-center" role="group" aria-label="Billing period">
        <div className="inline-flex w-full max-w-sm rounded-xl border border-slate-700/80 bg-slate-900/70 p-1 shadow-lg shadow-slate-950/20">
          {billingOptions.map((option) => {
            const isSelected = billingPeriod === option.id;
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setBillingPeriod(option.id)}
                className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 ${
                  isSelected
                    ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-xs text-blue-300 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" />
        <span>
          Backend Security Enforcement: All final quotes, volume brackets, and discount caps (Max 25%) are calculated authoritatively by Node.js server. Client-side price tampering is impossible.
        </span>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2">
          <Radio className="w-5 h-5 text-blue-400 animate-spin" />
          <span>Loading catalog from MongoDB database...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {visibleProducts.map((product) => (
            <Card key={product._id || product.tier} className={`flex flex-col justify-between bg-slate-900/80 ${product.tier === 'PROFESSIONAL' && billingPeriod !== 'annually' ? 'border-blue-400 ring-1 ring-blue-400/40' : 'border-slate-800'}`}>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-lg text-white">{product.name || product.tier}</h3>
                  {product.tier === 'PROFESSIONAL' && billingPeriod !== 'annually' ? (
                    <Badge variant="info"><Star className="w-3 h-3 mr-1" />Recommended</Badge>
                  ) : (
                    <Badge variant="success">{product.tier || 'ACTIVE'}</Badge>
                  )}
                </div>

                <p className="text-2xl font-extrabold text-blue-400 mb-1">
                  ${Number(product.displayPrice ?? product.priceAmount ?? product.price ?? 0).toLocaleString()} <span className="text-sm font-semibold text-slate-400">/ {product.displayPeriod || 'month'}</span>
                </p>

                <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                  {product.description || 'Enterprise sales automation and adaptive AI negotiation.'}
                </p>

                <div className="space-y-2 text-xs text-slate-300 border-t border-slate-800 pt-3">
                  {Array.isArray(product.features) &&
                    product.features.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{feat}</span>
                      </div>
                    ))}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default Products;
