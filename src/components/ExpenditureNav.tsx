import React, { useEffect, useState } from 'react';

const ExpenditureNav: React.FC = () => {
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const purchases = JSON.parse(localStorage.getItem('purchases') || '[]');
    const sum = purchases.reduce((acc: number, p: any) => acc + (p.price || 0), 0);
    setTotal(sum);
  }, []);

  return (
    <span className="ml-4 px-3 py-1 rounded-full bg-green-100 text-green-800 font-bold text-sm whitespace-nowrap">
      My Expenditure: ₹{total.toLocaleString()}
    </span>
  );
};

export default ExpenditureNav;
