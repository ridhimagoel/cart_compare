import React, { useEffect, useState } from 'react';

interface Purchase {
  productName: string;
  price: number;
  date: string;
}

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

const MyExpenditureDetails: React.FC = () => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const all = JSON.parse(localStorage.getItem('purchases') || '[]');
    setPurchases(all);
    setTotal(all.reduce((sum: number, p: Purchase) => sum + (p.price || 0), 0));
  }, []);

  const thisMonth = filterPurchasesThisMonth(purchases);
  const monthTotal = thisMonth.reduce((sum, p) => sum + (p.price || 0), 0);

  return (
    <div className="rounded-lg bg-green-50 border border-green-200 p-4 my-4 text-green-900 shadow-sm max-w-md mx-auto">
      <h2 className="font-bold text-lg mb-2">My Expenditure Details</h2>
      <div className="mb-2">Total Spent (All Time): <span className="font-semibold">₹{total.toLocaleString()}</span></div>
      <div className="mb-2">This Month: <span className="font-semibold">₹{monthTotal.toLocaleString()}</span></div>
      <h3 className="font-semibold mt-4 mb-2">Purchases This Month:</h3>
      {thisMonth.length === 0 ? (
        <div>No purchases this month.</div>
      ) : (
        <ul className="list-disc pl-5">
          {thisMonth.map((p, i) => (
            <li key={i}>
              {p.productName || 'Product'} — ₹{p.price} on {new Date(p.date).toLocaleDateString()}
            </li>
          ))}
        </ul>
      )}
      <h3 className="font-semibold mt-4 mb-2">All Purchases:</h3>
      {purchases.length === 0 ? (
        <div>No purchases recorded.</div>
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

export default MyExpenditureDetails;
