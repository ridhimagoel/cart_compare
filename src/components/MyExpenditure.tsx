import React, { useEffect, useState } from 'react';
import { loadUserProfile, Purchase } from '../lib/digitalTwin';

function getCurrentMonthYear() {
  const now = new Date();
  return { month: now.getMonth(), year: now.getFullYear() };
}

function filterPurchasesThisMonth(purchases: Purchase[]) {
  const { month, year } = getCurrentMonthYear();
  return purchases.filter(p => {
    const d = new Date(p.date);
    return d.getMonth() === month && d.getFullYear() === year;
  });
}

const MyExpenditure: React.FC = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const profile = loadUserProfile();
    const thisMonth = filterPurchasesThisMonth(profile.purchases || []);
    setPurchases(thisMonth);
    setTotal(thisMonth.reduce((sum, p) => sum + (p.price || 0), 0));
  }, []);

  return (
    <div className="rounded-lg bg-green-50 border border-green-200 p-4 my-4 text-green-900 shadow-sm">
      <h2 className="font-bold text-lg mb-2">My Expenditure (This Month)</h2>
      <div className="mb-2">Total Spent: <span className="font-semibold">₹{total.toFixed(2)}</span></div>
      {purchases.length === 0 ? (
        <div>No purchases this month.</div>
      ) : (
        <ul className="list-disc pl-5">
          {purchases.map((p, i) => (
            <li key={i}>
              {p.productName || 'Product'} — ₹{p.price} on {new Date(p.date).toLocaleDateString()}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MyExpenditure;
