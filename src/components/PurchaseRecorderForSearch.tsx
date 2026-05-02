import React from 'react';

interface PurchaseRecorderProps {
  productName: string;
  price: number;
  onPurchaseRecorded?: () => void;
}

function recordPurchase(productName: string, price: number) {
  const purchases = JSON.parse(localStorage.getItem('purchases') || '[]');
  purchases.push({ productName, price, date: new Date().toISOString() });
  localStorage.setItem('purchases', JSON.stringify(purchases));
}

const PurchaseRecorder: React.FC<PurchaseRecorderProps> = ({ productName, price, onPurchaseRecorded }) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent navigation if inside a link
    if (window.confirm(`Record purchase of ${productName} for ₹${price}?`)) {
      recordPurchase(productName, price);
      if (onPurchaseRecorded) onPurchaseRecorded();
      alert('Purchase recorded!');
    }
  };

  return (
    <button
      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm mt-2"
      onClick={handleClick}
    >
      Record Purchase
    </button>
  );
};

export default PurchaseRecorder;
