import React, { useState, useEffect } from 'react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Package, Check, ShieldCheck, DollarSign, Radio } from 'lucide-react';
import { productAPI } from '../services/api';

export function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {products.map((product) => (
            <Card key={product._id || product.tier} className="flex flex-col justify-between border-slate-800 bg-slate-900/80">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-lg text-white">{product.name || product.tier}</h3>
                  <Badge variant="success">{product.tier || 'ACTIVE'}</Badge>
                </div>

                <p className="text-2xl font-extrabold text-blue-400 mb-1">
                  ${product.monthlyPrice ? `${product.monthlyPrice} / seat` : 'Custom Quote'}
                </p>
                {product.annualPrice && (
                  <p className="text-xs text-slate-400 mb-4 font-mono">
                    Annual: ${product.annualPrice} / seat / yr
                  </p>
                )}

                <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                  {product.description || 'Enterprise sales automation and adaptive AI negotiation.'}
                </p>

                <div className="space-y-2 text-xs text-slate-300 border-t border-slate-800 pt-3">
                  <div className="flex items-center justify-between text-slate-400 text-[11px]">
                    <span>Seat Limits:</span>
                    <span className="font-semibold text-slate-200">{product.minUsers || 1} - {product.maxUsers || '∞'} Seats</span>
                  </div>
                  <div className="flex items-center justify-between text-slate-400 text-[11px] mb-3">
                    <span>Max Discount Cap:</span>
                    <span className="font-semibold text-amber-400">{product.maxDiscountPct || 25}% Max</span>
                  </div>

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
