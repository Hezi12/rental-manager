'use client';

import React, { useState, useEffect } from 'react';

// נוסיף טיפוס להזמנה
interface Booking {
  bookingNumber: string;
  guestName: string;
  startDate: Date;
  endDate: Date;
  roomNumber: string;
  price: number;
  pricePerNight: number;
  additionalAmount?: number;
  paymentMethod: 'credit' | 'cash' | 'hapoalim' | 'mizrahi';
  isPaid: boolean;
  paidAt?: Date;  // שדה חדש
  notes?: string;
  isTourist: boolean;
}

// פונקציה לחישוב מע"מ
const calculateTotalWithVat = (price: number, guestType: 'israeli' | 'tourist', includesVat: boolean) => {
  if (guestType === 'tourist' || !includesVat) return price;
  return price * 1.18; // 18% מע"מ
};

// פונקציה לחישוב מספר הלילות
const calculateNights = (startDate: Date, endDate: Date) => {
  const diffTime = endDate.getTime() - startDate.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// הוספת פונקציה ליצירת מספר הזמנה
const generateBookingNumber = () => {
  const timestamp = Date.now().toString();
  return `BK${timestamp.slice(-6)}`;
};

// פונקציה ליצירת ID ייחודי
const generateId = () => {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
};

// פונקציה לבדיקה אם התאריך הוא היום, אתמול או מחר
const isSpecialDate = (date: Date) => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  return (
    date.toDateString() === today.toDateString() ||
    date.toDateString() === yesterday.toDateString() ||
    date.toDateString() === tomorrow.toDateString()
  );
};

// Add these new interfaces
interface PomodoroSettings {
  workDuration: number;
  breakDuration: number;
  selectedSound: string;
}

interface TimerState {
  timeLeft: number;
  isRunning: boolean;
  isBreak: boolean;
}

// Add these new components before the main component
const SOUND_OPTIONS = [
  { id: 'bell', name: 'פעמון', url: '/sounds/bell.mp3' },
  { id: 'digital', name: 'דיגיטלי', url: '/sounds/digital.mp3' },
  { id: 'gentle', name: 'עדין', url: '/sounds/gentle.mp3' },
];

// Add new interface for invoice details
interface InvoiceDetails {
  invoiceNumber: string;
  businessName: string;
  businessId: string;
  businessAddress: string;
  customerName: string;
  customerAddress?: string;
  customerBusinessId?: string;
}

// Add new function to generate invoice number
const generateInvoiceNumber = () => {
  const timestamp = Date.now().toString();
  return `INV${timestamp.slice(-6)}`;
};

const calculateTotalPrice = () => {
  const form = document.querySelector('form');
  if (!form) return 0;

  const startDate = new Date(form.startDate.value);
  const endDate = new Date(form.endDate.value);
  const pricePerNight = Number(form.pricePerNight.value) || 0;
  const additionalAmount = Number(form.additionalAmount.value) || 0;
  const isTourist = form.isTourist.checked;

  const nights = calculateNights(startDate, endDate);
  const subtotal = (pricePerNight * nights) + additionalAmount;
  
  // אם זה תייר - אין מע"מ, אחרת מוסיפים 18% מע"מ
  return isTourist ? subtotal : subtotal * 1.18;
};

export default function AirportGuestHouse() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [bookings, setBookings] = useState<Booking[]>(() => {
    const savedBookings = localStorage.getItem('bookings');
    if (savedBookings) {
      const parsed = JSON.parse(savedBookings);
      // המרת תאריכים חזרה ל-Date objects
      return parsed.map((booking: any) => ({
        ...booking,
        startDate: new Date(booking.startDate),
        endDate: new Date(booking.endDate)
      }));
    }
    return [];
  });
  const [isAddingBooking, setIsAddingBooking] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{roomNumber: number, date: Date} | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{roomNumber: number, date: Date} | null>(null);
  const [dragEnd, setDragEnd] = useState<{roomNumber: number, date: Date} | null>(null);

  // Add new state for Pomodoro
  const [pomodoroSettings, setPomodoroSettings] = useState<PomodoroSettings>({
    workDuration: 45,
    breakDuration: 5,
    selectedSound: SOUND_OPTIONS[0].id,
  });
  
  const [timerState, setTimerState] = useState<TimerState>({
    timeLeft: pomodoroSettings.workDuration * 60,
    isRunning: false,
    isBreak: false,
  });

  // Add new state for invoice details
  const [invoiceDetails, setInvoiceDetails] = useState<InvoiceDetails>({
    invoiceNumber: generateInvoiceNumber(),
    businessName: 'Airport Guest House',
    businessId: '123456789',
    businessAddress: 'רחוב הרצל 1, תל אביב',
    customerName: '',
    customerAddress: '',
    customerBusinessId: '',
  });

  // Add new useEffect for timer
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (timerState.isRunning && timerState.timeLeft > 0) {
      interval = setInterval(() => {
        setTimerState(prev => ({
          ...prev,
          timeLeft: prev.timeLeft - 1
        }));
      }, 1000);
    } else if (timerState.timeLeft === 0) {
      // Play sound
      const sound = new Audio(SOUND_OPTIONS.find(s => s.id === pomodoroSettings.selectedSound)?.url);
      sound.play();

      // Switch between work and break
      setTimerState(prev => ({
        isBreak: !prev.isBreak,
        isRunning: false,
        timeLeft: !prev.isBreak ? 
          pomodoroSettings.breakDuration * 60 : 
          pomodoroSettings.workDuration * 60
      }));
    }

    return () => clearInterval(interval);
  }, [timerState, pomodoroSettings]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => {
    setTimerState(prev => ({
      ...prev,
      isRunning: !prev.isRunning
    }));
  };

  const resetTimer = () => {
    setTimerState({
      timeLeft: pomodoroSettings.workDuration * 60,
      isRunning: false,
      isBreak: false
    });
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const goToNextMonth = () => {
    const nextMonth = new Date(selectedDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    setSelectedDate(nextMonth);
  };

  const goToPreviousMonth = () => {
    const prevMonth = new Date(selectedDate);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    
    // מגביל את הניווט לתחילת 2025
    const minDate = new Date(2025, 0, 1);
    if (prevMonth >= minDate) {
      setSelectedDate(prevMonth);
    }
  };

  // בודק אם הכפתור "הקודם" צריך להיות מושבת
  const isPreviousDisabled = () => {
    const minDate = new Date(2025, 0, 1);
    const prevMonth = new Date(selectedDate);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    return prevMonth < minDate;
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const form = e.target.form;
    if (form) {
      const startDate = new Date(form.startDate.value);
      const endDate = new Date(form.endDate.value);
      const pricePerNight = Number(form.pricePerNight.value);
      const isTourist = form.isTourist.checked;
      
      updatePriceCalculation(form, startDate, endDate, pricePerNight, isTourist);
    }
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const form = e.target.form;
    if (!form) return;

    const pricePerNight = Number(e.target.value) || 0;
    const startDate = new Date(form.startDate.value);
    const endDate = new Date(form.endDate.value);
    const isTourist = form.isTourist.checked;

    if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
      const nights = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const total = pricePerNight * nights;
      const finalPrice = isTourist ? total : total * 1.17;

      const nightsCountElement = document.querySelector('.nights-count');
      const totalPriceElement = document.querySelector('.total-price');

      if (nightsCountElement) {
        nightsCountElement.textContent = `${nights} לילות`;
      }

      if (totalPriceElement) {
        totalPriceElement.textContent = finalPrice > 0 ? `₪${finalPrice.toFixed(2)}` : '₪0.00';
      }
    }
  };

  const handleTouristChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const form = e.target.form;
    if (form) {
      const startDate = new Date(form.startDate.value);
      const endDate = new Date(form.endDate.value);
      const pricePerNight = Number(form.pricePerNight.value);
      const isTourist = e.target.checked;
      
      updatePriceCalculation(form, startDate, endDate, pricePerNight, isTourist);
    }
  };

  const updatePriceCalculation = (
    form: HTMLFormElement,
    startDate: Date,
    endDate: Date,
    pricePerNight: number,
    isTourist: boolean
  ) => {
    const nights = calculateNights(startDate, endDate);
    const subtotal = pricePerNight * nights;
    const total = isTourist ? subtotal : subtotal * 1.18; // מע"מ 18%
    
    const totalElement = form.querySelector('.total-price');
    const nightsElement = form.querySelector('.nights-count');
    const priceDetails = form.querySelector('.price-details');
    const priceInput = form.querySelector('input[name="price"]') as HTMLInputElement;
    
    if (totalElement) totalElement.textContent = `₪${total.toFixed(2)}`;
    if (nightsElement) nightsElement.textContent = `${nights} לילות`;
    if (priceDetails) {
      priceDetails.textContent = isTourist ? 
        `מחיר ללא מע"מ` : 
        `כולל מע"מ 18% (${subtotal.toFixed(2)}₪ + ${(subtotal * 0.18).toFixed(2)}₪)`;
    }
    if (priceInput) priceInput.value = total.toString();
  };

  // פונקציה להצגת החודש בעברית
  const getHebrewMonth = (date: Date) => {
    const months = ['ינו׳', 'פבר׳', 'מרץ', 'אפר׳', 'מאי', 'יונ׳', 
                   'יול׳', 'אוג׳', 'ספט׳', 'אוק׳', 'נוב׳', 'דצמ׳'];
    return `${months[date.getMonth()]} ${date.getFullYear()}`;
  };

  // נדכון מערך החדרים
  const rooms = [
    { number: 1, name: '1' },
    { number: 2, name: '2' },
    { number: 3, name: '3' },
    { number: 5, name: '5' },
    { number: 6, name: '6' },
    { number: 7, name: '7' },
    { number: 8, name: '8' },
    { number: 9, name: '9' },
  ];

  const handleCellClick = (roomNumber: number, date: Date) => {
    setSelectedCell({ roomNumber, date });
    setIsAddingBooking(true);
  };

  const handleAddBooking = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const bookingData = {
      id: selectedBooking?.id || generateId(),
      bookingNumber: formData.get('bookingNumber') as string,
      guestName: formData.get('guestName') as string,
      roomNumber: selectedCell.roomNumber,
      startDate: new Date(formData.get('startDate') as string),
      endDate: new Date(formData.get('endDate') as string),
      pricePerNight: Number(formData.get('pricePerNight')),
      paymentMethod: formData.get('paymentMethod') as Booking['paymentMethod'],
      isPaid: formData.get('isPaid') === 'on',
      paidAt: formData.get('isPaid') === 'on' ? new Date() : undefined,
      notes: formData.get('notes') as string,
      price: calculateTotalPrice(),
    };

    try {
      // שמירה מקומית
      const updatedBookings = [...bookings, bookingData];
      setBookings(updatedBookings);
      localStorage.setItem('bookings', JSON.stringify(updatedBookings));

      // שמירה בשרת
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bookingData),
      });

      if (!response.ok) throw new Error('Failed to save booking');

      // שמירת רשומת תשלום אם שולם
      if (bookingData.isPaid) {
        await fetch('/api/payments', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            bookingNumber: bookingData.bookingNumber,
            amount: bookingData.price,
            paymentMethod: bookingData.paymentMethod,
            paidAt: bookingData.paidAt,
            propertyName: 'airport-guest-house'
          }),
        });
      }

      // אם ההזמנה שולמה, נציע להפיק חשבונית
      if (bookingData.isPaid) {
        const generateInvoiceNow = window.confirm('האם להפיק חשבונית?');
        if (generateInvoiceNow) {
          await generateInvoice(bookingData);
        }
      }

      // איפוס הטופס וסגירת המודל
      setIsAddingBooking(false);
      setSelectedBooking(null);

    } catch (error) {
      console.error('Error saving booking:', error);
      alert('שגיאה בשמירת ההזמנה');
    }
  };

  // פונקציה לחישוב המחיר הסופי
  const calculateFinalPrice = (pricePerNight: number, startDate: Date, endDate: Date, isTourist: boolean) => {
    const nights = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const total = pricePerNight * nights;
    return isTourist ? total : total * 1.17;
  };

  // עדכון ה-localStorage
  const updateLocalStorage = (updatedBookings: Booking[]) => {
    localStorage.setItem('bookings', JSON.stringify(updatedBookings));
  };

  // פונקציה שבודקת אם יש הזמנה בתא מסוים
  const getBookingForCell = (roomNumber: number, date: Date) => {
    return bookings.find(booking => {
      const cellDate = new Date(date.setHours(0, 0, 0, 0));
      const startDate = new Date(booking.startDate.setHours(0, 0, 0, 0));
      const endDate = new Date(booking.endDate.setHours(0, 0, 0, 0));
      
      return booking.roomNumber === roomNumber && 
             cellDate >= startDate && 
             cellDate <= endDate;
    });
  };

  // פונקציה שמחשבת האם התא הוא תחילת ההזמנה
  const isBookingStart = (booking: Booking, date: Date) => {
    return new Date(booking.startDate.setHours(0, 0, 0, 0)).getTime() === 
           new Date(date.setHours(0, 0, 0, 0)).getTime();
  };

  const handleBookingClick = (booking: Booking, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedBooking(booking);
  };

  const handleUpdateBooking = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedBooking) return;

    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const updatedBookings = bookings.map(booking => {
      if (booking.id === selectedBooking.id) {
        return {
          ...booking,
          startDate: new Date(formData.get('startDate') as string),
          endDate: new Date(formData.get('endDate') as string),
          guestName: formData.get('guestName') as string,
          // ... שאר השדות המעודכנים
        };
      }
      return booking;
    });

    setBookings(updatedBookings);
    updateLocalStorage(updatedBookings); // שמירה בלוקל סטורג'
    setSelectedBooking(null);
  };

  const handleDeleteBooking = (booking: Booking) => {
    const newBookings = bookings.filter(b => b.id !== booking.id);
    setBookings(newBookings);
    updateLocalStorage(newBookings);
    setSelectedBooking(null);  // מאפס את ההזמנה הנבחרת
    setIsAddingBooking(false); // סוגר את המודאל
  };

  // פונקציה שמחזירה את כל ימי החודש
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const lastDay = new Date(year, month + 1, 0);
    const totalDays = lastDay.getDate();
    const days = [];

    for (let d = 1; d <= totalDays; d++) {
      days.push(new Date(year, month, d));
    }

    return days;
  };

  const handleDragStart = (roomNumber: number, date: Date) => {
    setIsDragging(true);
    setDragStart({ roomNumber, date });
    setDragEnd({ roomNumber, date });
  };

  const handleDragOver = (roomNumber: number, date: Date) => {
    if (isDragging && dragStart?.roomNumber === roomNumber) {
      setDragEnd({ roomNumber, date });
    }
  };

  const handleDragEnd = () => {
    if (dragStart && dragEnd) {
      // וודא שהתאריכים בסדר הנכון
      const startDate = new Date(Math.min(dragStart.date.getTime(), dragEnd.date.getTime()));
      const endDate = new Date(Math.max(dragStart.date.getTime(), dragEnd.date.getTime()));
      
      // פתיחת המודאל עם הערכים הנכונים
      setSelectedCell({ 
        roomNumber: dragStart.roomNumber,
        date: startDate
      });
      setIsAddingBooking(true);

      // יצירת אובייקט עם הערכים ההתחלתיים
      const initialValues = {
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0]
      };

      // עדכון הטופס עם הערכים החדשים
      setTimeout(() => {
        const form = document.querySelector('form');
        if (form) {
          const startInput = form.querySelector('input[name="startDate"]') as HTMLInputElement;
          const endInput = form.querySelector('input[name="endDate"]') as HTMLInputElement;
          if (startInput && endInput) {
            startInput.value = initialValues.startDate;
            endInput.value = initialValues.endDate;
          }
        }
      }, 0);
    }
    
    setIsDragging(false);
    setDragStart(null);
    setDragEnd(null);
  };

  const isBookingEnd = (booking: Booking, date: Date) => {
    return new Date(booking.endDate.setHours(0, 0, 0, 0)).getTime() === 
           new Date(date.setHours(0, 0, 0, 0)).getTime();
  };

  // עדכון הטופס כשפותחים הזמנה קיימת
  useEffect(() => {
    if (selectedBooking && isAddingBooking) {
      setTimeout(() => {
        const form = document.querySelector('form');
        if (form) {
          // פרטים בסיסיים
          form.guestName.value = selectedBooking.guestName;
          form.startDate.value = new Date(selectedBooking.startDate).toISOString().split('T')[0];
          form.endDate.value = new Date(selectedBooking.endDate).toISOString().split('T')[0];
          
          // פודם כל נגדיר את המחיר ללילה
          const pricePerNight = Number(selectedBooking.pricePerNight) || 0;
          form.pricePerNight.value = pricePerNight.toString();
          
          // שאר הפרטים
          form.paymentMethod.value = selectedBooking.paymentMethod;
          form.isPaid.checked = selectedBooking.isPaid;
          form.isTourist.checked = selectedBooking.isTourist;
          
          // פישוב מחיר מחדש
          const startDate = new Date(selectedBooking.startDate);
          const endDate = new Date(selectedBooking.endDate);
          const nights = Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          
          // חישוב המחיר הסופי
          const total = pricePerNight * nights;
          const finalPrice = selectedBooking.isTourist ? total : total * 1.17;
          
          // עדכון התצוגה
          const nightsCountElement = document.querySelector('.nights-count');
          const totalPriceElement = document.querySelector('.total-price');
          
          if (nightsCountElement) {
            nightsCountElement.textContent = `${nights} לילות`;
          }
          
          if (totalPriceElement) {
            totalPriceElement.textContent = finalPrice > 0 ? `₪${finalPrice.toFixed(2)}` : '₪0.00';
          }
          
          // פרטי אשראי
          form.cardNumber.value = selectedBooking.cardNumber || '';
          form.expiry.value = selectedBooking.expiry || '';
          form.cvv.value = selectedBooking.cvv || '';
          form.idNumber.value = selectedBooking.idNumber || '';
          
          // הערות
          form.notes.value = selectedBooking.notes || '';
        }
      }, 100);
    }
  }, [selectedBooking, isAddingBooking]);

  // Add new function to generate PDF invoice
  const generateInvoice = async (booking: Booking) => {
    try {
      const response = await fetch('/api/generate-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          booking,
          invoiceDetails: {
            invoiceNumber: `INV${Date.now().toString().slice(-6)}`,
            businessName: 'Airport Guest House',
            businessId: '123456789',
            businessAddress: 'רחוב הרצל 1, תל אביב',
            customerName: booking.guestName,
          },
        }),
      });

      if (!response.ok) throw new Error('Failed to generate invoice');

      // Get the PDF blob
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${booking.bookingNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating invoice:', error);
      alert('שגיאה בהפקת החשבונית');
    }
  };

  const renderPomodoro = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-lg z-40">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="text-2xl font-bold font-mono">
            {formatTime(timerState.timeLeft)}
          </div>
          <div className="text-sm text-gray-500">
            {timerState.isBreak ? 'הפסקה' : 'זמן עבודה'}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <select
            value={pomodoroSettings.selectedSound}
            onChange={(e) => setPomodoroSettings(prev => ({
              ...prev,
              selectedSound: e.target.value
            }))}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
          >
            {SOUND_OPTIONS.map(sound => (
              <option key={sound.id} value={sound.id}>
                {sound.name}
              </option>
            ))}
          </select>
          
          <button
            onClick={toggleTimer}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            {timerState.isRunning ? 'עצור' : 'התחל'}
          </button>
          
          <button
            onClick={resetTimer}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-200"
          >
            איפוס
          </button>
        </div>
      </div>
    </div>
  );

  const renderBookingDetails = () => (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-medium text-gray-900">פרטי הזמנה</h3>
              <div className="text-sm text-gray-500 mt-1">
                מספר הזמנה: {selectedBooking.bookingNumber}
              </div>
            </div>
            <button 
              onClick={() => setSelectedBooking(null)}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* תרטי ההזמנה */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">שם האורח</div>
                <div className="font-medium">{selectedBooking.guestName}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">חדר</div>
                <div className="font-medium">{selectedBooking.roomNumber}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">תאריך התחלה</div>
                <div className="font-medium">
                  {new Date(selectedBooking.startDate).toLocaleDateString('he-IL')}
                </div>
              </div>
              <div>
                <div className="text-sm text-gray-500">תאריך סיום</div>
                <div className="font-medium">
                  {new Date(selectedBooking.endDate).toLocaleDateString('he-IL')}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">מחיר ללילה</div>
                <div className="font-medium">₪{selectedBooking.pricePerNight}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">סה"כ לתשלום</div>
                <div className="font-medium">₪{selectedBooking.price}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-gray-500">אמצעי תשלום</div>
                <div className="font-medium">{selectedBooking.paymentMethod}</div>
              </div>
              <div>
                <div className="text-sm text-gray-500">סטטוס תשלום</div>
                <div className="font-medium">{selectedBooking.isPaid ? 'שולם' : 'טרם שולם'}</div>
              </div>
            </div>

            {selectedBooking.notes && (
              <div>
                <div className="text-sm text-gray-500">הערות</div>
                <div className="font-medium">{selectedBooking.notes}</div>
              </div>
            )}
          </div>

          {/* Add invoice section before the action buttons */}
          {selectedBooking?.isPaid && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-500">
                  הפקת חשבונית
                </div>
                <button
                  onClick={() => generateInvoice(selectedBooking)}
                  className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  הפק חשבונית
                </button>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
            <button
              onClick={() => {
                if (window.confirm('האם אתה בטוח שברצונך למחוק את ההזמנה?')) {
                  handleDeleteBooking(selectedBooking);
                }
              }}
              className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
            >
              ביטול הזמנה
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen p-8 pb-32 bg-gray-50">
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
            href="/bookings/rothschild"
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <span>Rothschild 79</span>
          </a>

          <a 
            href="/business-status"
            className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-white rounded-lg transition-all"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>דוחות</span>
          </a>
        </div>

        {/* Existing Header */}
        <div className="flex items-center mb-6">
          <div className="flex items-center gap-3">
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            <h1 className="text-2xl font-medium text-gray-900">Airport Guest House</h1>
          </div>
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <button
              onClick={goToPreviousMonth}
              disabled={isPreviousDisabled()}
              className="p-2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h2 className="text-lg font-medium text-gray-900">{getHebrewMonth(selectedDate)}</h2>
            <button
              onClick={goToNextMonth}
              className="p-2 text-gray-500 hover:text-gray-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          
          <button
            onClick={goToToday}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-lg hover:bg-gray-50"
          >
            היום
          </button>
        </div>

        {/* Calendar Container */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto relative">
            <div className="min-w-max">
              {/* Days Header */}
              <div className="grid grid-cols-[80px_repeat(31,minmax(60px,1fr))] bg-gray-50 border-b border-gray-200">
                <div className="p-3 text-right text-sm font-semibold text-gray-900 sticky left-0 bg-gray-50 z-20 border-r border-gray-200">
                  חדר
                </div>
                {getDaysInMonth(selectedDate).map((date, i) => (
                  <div 
                    key={i} 
                    className="p-2 text-center border-r border-gray-200"
                  >
                    <div className="text-xs font-semibold text-gray-700">
                      {['א׳','ב׳','ג׳','ד׳','ה׳','ו׳','ש׳'][date.getDay()]}
                    </div>
                    <div className="text-sm font-bold text-gray-900">
                      {date.getDate().toString().padStart(2, '0')}.{(date.getMonth() + 1).toString().padStart(2, '0')}
                    </div>
                  </div>
                ))}
              </div>

              {/* Rooms Grid */}
              <div className="divide-y divide-gray-200">
                {rooms.map((room) => (
                  <div key={room.number} 
                    className="grid grid-cols-[80px_repeat(31,minmax(60px,1fr))] hover:bg-gray-50 transition-colors"
                  >
                    <div className="p-3 text-right font-medium text-gray-900 flex items-center justify-end sticky left-0 bg-white z-20 border-r border-gray-200">
                      <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg">
                        {room.name}
                      </span>
                    </div>
                    {getDaysInMonth(selectedDate).map((date, i) => {
                      const booking = getBookingForCell(room.number, date);
                      const isToday = new Date().toDateString() === date.toDateString();
                      
                      return (
                        <div 
                          key={i}
                          onMouseDown={() => handleDragStart(room.number, date)}
                          onMouseOver={() => handleDragOver(room.number, date)}
                          onMouseUp={handleDragEnd}
                          className={`
                            relative p-1.5 border-r border-gray-200 cursor-pointer
                            ${isToday ? 'ring-2 ring-blue-400 ring-inset' : ''}
                            ${isDragging && dragStart?.roomNumber === room.number && 
                              date >= new Date(Math.min(dragStart.date.getTime(), (dragEnd?.date || dragStart.date).getTime())) &&
                              date <= new Date(Math.max(dragStart.date.getTime(), (dragEnd?.date || dragStart.date).getTime()))
                              ? 'bg-blue-50'
                              : 'hover:bg-blue-50/50'
                            }
                            transition-colors
                          `}
                        >
                          {booking && (
                            <div 
                              onClick={(e) => handleBookingClick(booking, e)}
                              className={`
                                absolute inset-0
                                bg-blue-100/70
                                flex items-center
                                cursor-pointer
                                group
                                transition-all duration-200
                                hover:bg-blue-200/70
                                ${isBookingStart(booking, date) ? 'rounded-r-md' : ''}
                                ${isBookingEnd(booking, date) ? 'rounded-l-md' : ''}
                              `}
                            >
                              <span className="text-[10px] font-medium text-blue-700 group-hover:text-blue-800 leading-tight px-1 line-clamp-2 break-words w-full">
                                {booking.guestName}
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add/Edit Booking Modal */}
      {isAddingBooking && selectedCell && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl">
            <div className="p-6">
              {/* כותרת עם כפתורי סגירה וביטול */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-medium text-gray-900">
                    {selectedBooking ? 'עריכת הזמנה' : 'הזמנה חדשה'}
                  </h3>
                  {selectedBooking && (
                    <div className="text-sm text-gray-500 mt-1">
                      מספר הזמנה: {selectedBooking.bookingNumber}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {selectedBooking && (
                    <button
                      onClick={() => {
                        if (window.confirm('האם אתה בטוח שברצונך למחוק את ההזמנה?')) {
                          handleDeleteBooking(selectedBooking);
                        }
                      }}
                      className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      ביטול הזמנה
                    </button>
                  )}
                  <button 
                    onClick={() => {
                      setIsAddingBooking(false);
                      setSelectedBooking(null);
                    }}
                    className="text-gray-400 hover:text-gray-500"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <form onSubmit={handleAddBooking} className="space-y-4">
                {/* שדה מוסתר למספר הזמנה */}
                <input 
                  type="hidden" 
                  name="bookingNumber" 
                  value={selectedBooking?.bookingNumber || generateBookingNumber()} 
                />

                {/* פרטים בסיסיים */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <input
                      type="text"
                      name="guestName"
                      required
                      placeholder="שם האורח *"
                      className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">תאריך כניסה</label>
                    <input
                      type="date"
                      name="startDate"
                      required
                      defaultValue={selectedCell?.date.toISOString().split('T')[0]}
                      onChange={handleDateChange}
                      className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">תאריך יציאה</label>
                    <input
                      type="date"
                      name="endDate"
                      required
                      onChange={handleDateChange}
                      className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                    />
                  </div>
                </div>

                {/* מחיר ותשלום */}
                <div className="grid grid-cols-3 gap-3 items-center">
                  <div>
                    <input
                      type="number"
                      name="pricePerNight"
                      placeholder="מחיר ללילה"
                      onChange={handlePriceChange}
                      className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                    />
                  </div>
                  <div>
                    <input
                      type="number"
                      name="additionalAmount"
                      placeholder="סכום נוסף"
                      onChange={handlePriceChange}
                      className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                    />
                  </div>
                  <div>
                    <select
                      name="paymentMethod"
                      className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                    >
                      <option value="credit">כרטיס אשראי</option>
                      <option value="cash">מזומן</option>
                      <option value="hapoalim">בנק הפועלים</option>
                      <option value="mizrahi">בנק מזרחי</option>
                    </select>
                  </div>
                </div>

                {/* סיכום מחיר */}
                <div className="flex items-center justify-between bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="isTourist"
                      id="isTourist"
                      onChange={handleTouristChange}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="isTourist" className="text-sm font-medium text-gray-900">
                      תייר (ללא מע"מ)
                    </label>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="isPaid"
                      id="isPaid"
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <label htmlFor="isPaid" className="text-sm font-medium text-gray-900">
                      שולם
                    </label>
                  </div>
                  <div className="text-left">
                    <div className="text-sm text-gray-600 nights-count">0 לילות</div>
                    <div className="text-lg font-semibold text-gray-900">
                      סה"כ: <span className="total-price">₪0</span>
                    </div>
                  </div>
                </div>

                {/* פרטי אשראי */}
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      name="cardNumber"
                      placeholder="מספר כרטיס"
                      className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                    />
                    <input
                      type="text"
                      name="idNumber"
                      placeholder="ת.ז"
                      className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      name="expiry"
                      placeholder="תוקף (MM/YY)"
                      className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                    />
                    <input
                      type="text"
                      name="cvv"
                      placeholder="CVV"
                      maxLength={3}
                      className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                    />
                  </div>
                </div>

                {/* הערות */}
                <textarea
                  name="notes"
                  placeholder="הערות"
                  rows={4}
                  className="w-full px-3 py-2 text-gray-900 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
                ></textarea>

                <input type="hidden" name="price" />

                {/* כפתור שמירה */}
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    שמירה
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Booking Details Modal */}
      {selectedBooking && !isAddingBooking && (
        renderBookingDetails()
      )}
      {renderPomodoro()}
    </main>
  );
}