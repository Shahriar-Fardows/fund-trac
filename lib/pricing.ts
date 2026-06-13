// Client-safe pricing/formatting helpers (no node-only deps) so they can be
// imported from both API routes and React components.

export function formatMoney(amount: number | undefined, currency: string): string {
  const symbol = currency === "USD" ? "$" : "Tk ";
  return `${symbol}${Number(amount || 0).toLocaleString()}`;
}

type Phase = { cost?: number };
type Milestone = { amount?: number };

type PricingInput = {
  totalPrice?: number;
  discount?: number;
  taxPercent?: number;
  phases?: Phase[];
  milestones?: Milestone[];
};

/**
 * Resolve a proposal's headline price.
 *  - subtotal = explicit totalPrice, else sum of phase costs, else milestones
 *  - final    = (subtotal - discount) + tax%
 */
export function computePricing(p: PricingInput): {
  subtotal: number;
  finalAmount: number;
  phaseSum: number;
} {
  const phaseSum = (p.phases || []).reduce((s, ph) => s + (Number(ph.cost) || 0), 0);
  const milestoneSum = (p.milestones || []).reduce((s, m) => s + (Number(m.amount) || 0), 0);
  const subtotal = Number(p.totalPrice) || phaseSum || milestoneSum || 0;
  const afterDiscount = Math.max(0, subtotal - (Number(p.discount) || 0));
  const finalAmount = Math.round(afterDiscount * (1 + (Number(p.taxPercent) || 0) / 100));
  return { subtotal, finalAmount, phaseSum };
}
