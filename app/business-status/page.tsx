'use client';

import { useEffect, useState } from 'react';

interface Booking {
  id: string;
  guestName: string;
  startDate: string;
  endDate: string;
  price: number;
  isPaid: boolean;
  paymentMethod: string;
  roomNumber: string;
}

interface PaymentSummary {
  [key: string]: number;
}

export default function BusinessStatus() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummary>({});
  const [occupancyRate, setOccupancyRate] = useState(0);
  const [totalIncome, setTotalIncome] = useState(0);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const months = [
    'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'
  ];

  const handlePrevMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  };

  useEffect(() => {
    const loadBookings = () => {
      const savedBookings = localStorage.getItem('airportGuestHouseBookings');
      if (savedBookings) {
        const parsedBookings = JSON.parse(savedBookings);
        const paidBookings = parsedBookings.filter((booking: Booking) => {
          const bookingDate = new Date(booking.startDate);
          return booking.isPaid && 
                 bookingDate.getMonth() === selectedMonth && 
                 bookingDate.getFullYear() === selectedYear;
        });
        setBookings(paidBookings);
        
        const summary = paidBookings.reduce((acc: PaymentSummary, booking: Booking) => {
          const method = booking.paymentMethod;
          acc[method] = (acc[method] || 0) + booking.price;
          return acc;
        }, {});
        setPaymentSummary(summary);
        
        const total = paidBookings.reduce((sum: number, booking: Booking) => sum + booking.price, 0);
        setTotalIncome(total);

        const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
        const bookedDays = paidBookings.reduce((days: number, booking: Booking) => {
          const start = new Date(booking.startDate);
          const end = new Date(booking.endDate);
          return days + Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        }, 0);
        setOccupancyRate(Math.round((bookedDays / daysInMonth) * 100));
      }
    };

    loadBookings();
  }, [selectedMonth, selectedYear]);

  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        {/* Navigation Icons */}
        <div className="flex items-center gap-4 mb-6">
          <a 
            href="/"
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span>דף הבית</span>
          </a>

          <a 
            href="/bookings/airport-guest-house"
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span>Airport Guest House</span>
          </a>

          <a 
            href="/bookings/rothschild"
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span>Rothschild 79</span>
          </a>
        </div>

        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-semibold text-gray-900">סיכום הכנסות - Airport Guest House</h1>
          
          {/* בורר חודשים */}
          <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-lg shadow">
            <button 
              onClick={handlePrevMonth}
              className="text-gray-600 hover:text-gray-900"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <div className="text-lg font-medium text-gray-900">
              {months[selectedMonth]} {selectedYear}
            </div>
            
            <button 
              onClick={handleNextMonth}
              className="text-gray-600 hover:text-gray-900"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* סיכום הכנסות לפי אמצעי תשלום */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">הכנסות לפי אמצעי תשלום</h2>
            <div className="space-y-4">
              {Object.entries(paymentSummary).map(([method, amount]) => (
                <div key={method} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-700">{method}</span>
                  <span className="text-lg font-semibold text-green-600">₪{amount.toLocaleString()}</span>
                </div>
              ))}
              <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg mt-4">
                <span className="font-medium text-gray-700">סה"כ הכנסות</span>
                <span className="text-xl font-bold text-green-600">₪{totalIncome.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* סטטיסטיקות */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4">סטטיסטיקות</h2>
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">אחוזי תפוסה החודש</div>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-bold text-blue-600">{occupancyRate}%</span>
                  <span className="text-sm text-gray-500 mb-1">תפוסה</span>
                </div>
              </div>
              
              <div className="p-4 bg-purple-50 rounded-lg">
                <div className="text-sm text-gray-600 mb-1">מספר הזמנות החודש</div>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-bold text-purple-600">{bookings.length}</span>
                  <span className="text-sm text-gray-500 mb-1">הזמנות</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
