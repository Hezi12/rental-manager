'use client'
import { useEffect, useState, memo, useRef, useCallback } from 'react'

// קדכון הטיפוס של המידע
type RoomData = {
  guestName: string;
  status: 'empty' | 'occupied' | 'dirty' | 'check-in';
  occupiedUntil?: string;
}

// קומפוננטת RoomRow מופרדת עם memo
const RoomRow = memo(({ 
  location, 
  date, 
  room, 
  onUpdate, 
  initialData,
  setRooms  // הוספת setRooms לפרופס
}: { 
  location: string;
  date: Date;
  room: string;
  onUpdate: (field: 'guestName' | 'status' | 'occupiedUntil', value: string) => void;
  initialData: RoomData;
  setRooms: (rooms: Record<string, RoomData>) => void;
}) => {
  const [roomData, setRoomData] = useState(initialData)

  const handleChange = (field: 'guestName' | 'status' | 'occupiedUntil', value: string) => {
    // אם מה שינוי שם אורח
    if (field === 'guestName') {
      // רק אם החדר היה במצב 'empty' נשנה אותו ל-'check-in'
      if (roomData.status === 'empty' && value.trim() !== '') {
        const newData = { 
          ...roomData, 
          guestName: value,
          status: 'check-in' 
        }
        setRoomData(newData)
        onUpdate('guestName', value)
        onUpdate('status', 'check-in')
      } else {
        // אחרת, רק נעדכן את השם בלי לשנות סטטוס
        setRoomData(prev => ({ ...prev, guestName: value }))
        onUpdate('guestName', value)
      }
      return
    }

    // אם משנים סטטוס
    if (field === 'status') {
      const newData = { ...roomData, status: value }
      setRoomData(newData)
      onUpdate('status', value)

      // אם משנים לסטטוס 'empty' (פנוי)
      if (value === 'empty') {
        let updatedRooms = {} // אובייקט זמני לאיסוף כל השינויים
        
        // אם יש תאריך סיום, נאפס את כל התאריכים העתידיים עד אליו
        if (roomData.occupiedUntil) {
          const endDate = new Date(roomData.occupiedUntil)
          const currentDate = new Date(date)
          
          for (let d = new Date(currentDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0]
            const key = `${location}-${dateStr}-${room}`
            updatedRooms[key] = {
              status: 'empty',
              guestName: '',
              occupiedUntil: undefined
            }
          }
          
          // עדכון אחד מרוכז
          setRooms(prev => ({
            ...prev,
            ...updatedRooms
          }))
        }
      } 
      // אם משנים לסטטוס 'occupied' (מאוכלס) - הקוד הקיים
      else if (value === 'occupied') {
        const newData = { ...roomData, status: value }
        setRoomData(newData)
        
        // עדכון היום הנוכחי
        onUpdate('status', value)
        
        // אם יש תאריך סיום, נעדכן את כל התאריכים העתידיים
        if (roomData.occupiedUntil) {
          const endDate = new Date(roomData.occupiedUntil)
          const currentDate = new Date(date)
          
          let updatedRooms = {} // אובייקט זמני לאיסוף כל השינויים
          
          for (let d = new Date(currentDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0]
            const key = `${location}-${dateStr}-${room}`
            updatedRooms[key] = {
              status: 'occupied',
              guestName: roomData.guestName
            }
          }
          
          // עדכון אחד מרוכז
          setRooms(prev => ({
            ...prev,
            ...updatedRooms
          }))
        }
      }
      return
    }

    // אם משנים את תאריך הסיום
    if (field === 'occupiedUntil') {
      const newData = { ...roomData, occupiedUntil: value }
      setRoomData(newData)
      onUpdate('occupiedUntil', value)

      const selectedDate = new Date(value)
      const currentDate = new Date(date)
      
      if (selectedDate > currentDate) {
        let updatedRooms = {} // אובייקט זמני לאיסוף כל השינויים
        
        // עדכון כל התאריכים העתידיים עד לתאריך שנבחר
        for (let d = new Date(currentDate); d <= selectedDate; d.setDate(d.getDate() + 1)) {
          const dateStr = d.toISOString().split('T')[0]
          const key = `${location}-${dateStr}-${room}`
          updatedRooms[key] = {
            ...roomData,
            status: 'occupied',
            guestName: roomData.guestName,
            occupiedUntil: value // שמירת תאריך הסיום בכל הרשומות
          }
        }
        
        // עדכון אחד מרוכז
        setRooms(prev => ({
          ...prev,
          ...updatedRooms
        }))
      }
      return
    }

    // עדכון רגיל לכל שאר המקרים
    setRoomData(prev => ({ ...prev, [field]: value }))
    onUpdate(field, value)
  }

  // פונקציה שמחזירה את הצבע המתאים לפי הסטטוס ושם האורח
  const getStatusColor = (status: string, guestName: string | undefined) => {
    // בדיקה לסימן קריאה - אדום בוהק
    if (guestName?.includes('!')) {
      return 'bg-red-600/50 hover:bg-red-600/70'
    }

    switch (status) {
      case 'check-in':
        return 'bg-blue-600/25 hover:bg-blue-600/40'
      case 'occupied':
        return 'bg-blue-950/50 hover:bg-blue-950/70'
      case 'dirty':
        return 'bg-gray-950/80 hover:bg-gray-950/90'
      default:
        // רק אם הסטטוס ריק (empty) ויש שם אורח, נשתמש בצבע הכחול בהיר יותר
        if (guestName && guestName.trim()) {
          return 'bg-blue-600/25 hover:bg-blue-600/40'
        }
        return 'bg-white/5 hover:bg-white/10'
    }
  }

  return (
    <div className={`flex items-center space-x-4 space-x-reverse p-2.5 rounded-lg transition-colors duration-300 ${getStatusColor(roomData.status, roomData.guestName)}`}>
      <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center">
        <span className="text-sm font-medium text-white/80">{room}</span>
      </div>
      <div className="flex-1 flex items-center gap-3">
        <select
          value={roomData.status}
          onChange={(e) => handleChange('status', e.target.value)}
          className="bg-white/5 text-sm text-gray-200 px-3 py-1.5 rounded-md outline-none focus:ring-1 focus:ring-blue-500/50 border border-white/5 hover:bg-white/10 transition-colors"
        >
          <option value="empty">פנוי</option>
          <option value="check-in">צ'ק אין</option>
          <option value="occupied">מאוכלס</option>
          <option value="dirty">מלוכלך</option>
        </select>
        
        <div className="flex-1 flex gap-2">
          <input
            type="text"
            placeholder=""
            value={roomData.guestName || ''}
            onChange={(e) => handleChange('guestName', e.target.value)}
            className="flex-1 bg-white/5 text-sm text-gray-200 px-3 py-1.5 rounded-md outline-none focus:ring-1 focus:ring-blue-500/50 text-right border border-white/5 hover:bg-white/10 transition-colors"
          />
          
          {roomData.status === 'occupied' && (
            <input
              type="date"
              value={roomData.occupiedUntil || ''}
              onChange={(e) => handleChange('occupiedUntil', e.target.value)}
              className="bg-white/5 text-sm text-gray-200 px-3 py-1.5 rounded-md outline-none focus:ring-1 focus:ring-blue-500/50 border border-white/5 hover:bg-white/10 transition-colors"
            />
          )}
        </div>
      </div>
    </div>
  )
})

RoomRow.displayName = 'RoomRow'

const STORAGE_KEY = 'rental-manager-data'

// Add new type for timer state
type TimerState = 'work' | 'break' | 'idle';

// Add PomodoroTimer component before HomePage
const PomodoroTimer = memo(() => {
  const [timeLeft, setTimeLeft] = useState<number>(45 * 60);
  const [timerState, setTimerState] = useState<TimerState>('idle');
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // הוספת רפרנסים לצלילים
  const workEndSound = useRef<HTMLAudioElement | null>(null);
  const breakEndSound = useRef<HTMLAudioElement | null>(null);

  // יצירת אלמנטי האודיו בטעינה הראשונית
  useEffect(() => {
    workEndSound.current = new Audio('/sounds/work-end.mp3');
    breakEndSound.current = new Audio('/sounds/break-end.mp3');
  }, []);

  // פונקציה להשמעת צליל
  const playSound = (sound: HTMLAudioElement | null) => {
    if (sound) {
      sound.currentTime = 0; // חזרה לתחילת הצליל
      sound.play().catch(err => console.log('Error playing sound:', err));
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startTimer = useCallback(() => {
    setIsActive(true);
    setTimerState('work');
  }, []);

  const pauseTimer = useCallback(() => {
    setIsActive(false);
  }, []);

  const resetTimer = useCallback(() => {
    setIsActive(false);
    setTimerState('idle');
    setTimeLeft(45 * 60);
  }, []);

  useEffect(() => {
    if (isActive) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // השמעת הצליל המתאים בהתאם למצב הנוכחי
            if (timerState === 'work') {
              playSound(workEndSound.current); // צליל סיום עבודה
              setTimerState('break');
              return 5 * 60;
            } else {
              playSound(breakEndSound.current); // צליל סיום הפסקה
              setTimerState('work');
              return 45 * 60;
            }
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, timerState]);

  return (
    <div className="flex items-center gap-2 text-orange-400">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className="text-sm font-medium">{formatTime(timeLeft)}</span>
      <div className="flex gap-2">
        {!isActive ? (
          <button
            onClick={startTimer}
            className="p-1.5 text-gray-400 hover:text-white transition-colors"
            title="התחל"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        ) : (
          <button
            onClick={pauseTimer}
            className="p-1.5 text-gray-400 hover:text-white transition-colors"
            title="השהה"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
        )}
        <button
          onClick={resetTimer}
          className="p-1.5 text-gray-400 hover:text-white transition-colors"
          title="אפס"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>
    </div>
  );
});

PomodoroTimer.displayName = 'PomodoroTimer';

export default function HomePage() {
  // ישתמש במערך של תאריכים - נציג יותר ימים
  const [dates, setDates] = useState<Date[]>([])
  const DAYS_TO_SHOW = 60 // נציג 60 יום - 30 לפני ו-30 אחרי

  // יפרנס נפרד לכל עמוד
  const airportTodayRef = useRef<HTMLDivElement>(null)
  const rothschildTodayRef = useRef<HTMLDivElement>(null)

  // יצירת מערך התאריכים וגלילה לתאריך הנוכחי
  useEffect(() => {
    const today = new Date()
    const datesArray = []
    for (let i = -30; i <= 30; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      datesArray.push(date)
    }
    setDates(datesArray)

    // גלילה לתאריך הנוכחי בשני העמודים
    setTimeout(() => {
      airportTodayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      rothschildTodayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
  }, [])

  // פונקציה לפורמט התאריך
  const formatDate = (date: Date) => {
    const dateStr = date.toLocaleDateString('en-GB', { 
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    })
    
    const dayName = date.toLocaleDateString('he-IL', { weekday: 'long' })
    return `${dateStr} - ${dayName}`
  }

  // פשימת החדרים הקבועה
  const airportRooms = ['1', '2', '3', '5', '6', '7', '8', '9']
  const rothschildRooms = ['1a', '3a', '4', '6', '13', '17', '21', '106']

  // פונקציה לטעינת הנתונים מ-localStorage
  const loadRoomsFromStorage = (): Record<string, RoomData> => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      // אם אין נתונים, נחזיר אובייקט ריק
      if (!saved) return {}
      
      // ניסיון לפרסר את הנתונים
      try {
        const parsedData = JSON.parse(saved)
        // בדיקה שהערך שהתקבל הוא אובייקט
        if (typeof parsedData !== 'object' || parsedData === null) {
          console.error('Invalid data structure in localStorage')
          return {}
        }
        return parsedData
      } catch (parseError) {
        console.error('Failed to parse localStorage data:', parseError)
        return {}
      }
    } catch (error) {
      console.error('Error accessing localStorage:', error)
      return {}
    }
  }

  // פונקציה לשמירת הנתונים ב-localStorage
  const updateRooms = (newRooms: Record<string, RoomData>) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newRooms))
      setRooms(newRooms)
      console.log('Saved to localStorage:', newRooms)
    } catch (error) {
      console.error('Error saving to localStorage:', error)
    }
  }

  const [rooms, setRooms] = useState<Record<string, RoomData>>(loadRoomsFromStorage())

  // עדכון ה-handleRoomUpdate
  const handleRoomUpdate = (location: string, date: Date, room: string) => 
    (field: 'guestName' | 'status' | 'occupiedUntil', value: string) => {
      const key = `${location}-${date.toISOString().split('T')[0]}-${room}`
      const newRooms = {
        ...rooms,
        [key]: {
          ...(rooms[key] || {}),
          [field]: value
        }
      }
      updateRooms(newRooms)
    }

  // טמירה אוטומטית בכל שינוי
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms))
      console.log('Auto-saved to localStorage:', rooms)
    } catch (error) {
      console.error('Error auto-saving to localStorage:', error)
    }
  }, [rooms])

  // שונקציה לעדכון שם אורח
  const updateRoom = (location: string, date: Date, room: string, field: 'guestName' | 'status', value: string) => {
    const key = `${location}-${date.toISOString().split('T')[0]}-${room}`
    setRooms(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: value
      }
    }))
  }

  // פונקציה לקבלת שם אורח
  const getRoom = (location: string, date: Date, room: string) => {
    const key = `${location}-${date.toISOString().split('T')[0]}-${room}`
    return rooms[key] || { guestName: '', status: 'empty' }
  }

  // פונקציה לגלילה לתאריך הנוכחי
  const scrollToToday = () => {
    airportTodayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    rothschildTodayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  // פונקציות נפרדות לגלילה לכל רשימה
  const scrollToAirportToday = () => {
    airportTodayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const scrollToRothschildToday = () => {
    rothschildTodayRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  const [currentTime, setCurrentTime] = useState(() => null);

  // עדכון השעה רק בצד הלקוח
  useEffect(() => {
    setCurrentTime(new Date());
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // פונקציה לפורמט השעה
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('he-IL', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  // פונקציה לפורמט התאריך
  const formatDateForClock = (date: Date) => {
    return date.toLocaleDateString('he-IL', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
      weekday: 'long'
    })
  }

  // נוסיף פונקציה לקבלת היום הבא
  const getNextDayRef = (location: string, daysToAdd: number) => {
    const nextDate = new Date()
    nextDate.setDate(nextDate.getDate() + daysToAdd)
    const nextDateStr = nextDate.toISOString().split('T')[0]
    return dates.findIndex(date => date.toISOString().split('T')[0] === nextDateStr)
  }

  // בתחילת הקומפוננטה
  const [nextDays, setNextDays] = useState<{ date: Date; dayName: string }[]>([])

  // עדכון הימים הבאים כל יום בחצות
  useEffect(() => {
    const updateNextDays = () => {
      // מערך של אותיות הימים בסדר הנכון
      const dayLetters = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש']
      const days = []
      
      for (let i = 1; i <= 7; i++) {
        const nextDate = new Date()
        nextDate.setDate(nextDate.getDate() + i)
        // שציאת האות המתאימה לפי היום בשבוע (0 = ראשון, 1 = שני וכו')
        const dayLetter = dayLetters[nextDate.getDay()]
        days.push({ 
          date: nextDate, 
          dayName: dayLetter,
          fullDayName: nextDate.toLocaleDateString('he-IL', { weekday: 'long' }) // שומר את השם המלא לטולטיפ
        })
      }
      setNextDays(days)
    }

    // עדכון ראשוני
    updateNextDays()

    // חישוב הזמן עד חצות הלילה הבא
    const now = new Date()
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    tomorrow.setHours(0, 0, 0, 0)
    const msUntilMidnight = tomorrow.getTime() - now.getTime()

    // הגדרת טיימר שיתעדכן בחצות
    const timer = setTimeout(() => {
      updateNextDays()
      // הגדר טיימר חדש שיתעדכן כל 24 שעות
      setInterval(updateNextDays, 24 * 60 * 60 * 1000)
    }, msUntilMidnight)

    return () => {
      clearTimeout(timer)
    }
  }, [])

  // פונקציה לפורמט סטטוס החדרים
  const getRoomStatus = (location: string, date: Date, roomsList: string[]) => {
    const empty = roomsList.filter(room => {
      const key = `${location}-${date.toISOString().split('T')[0]}-${room}`
      return !rooms[key] || rooms[key].status === 'empty'
    }).length

    const occupied = roomsList.filter(room => {
      const key = `${location}-${date.toISOString().split('T')[0]}-${room}`
      return rooms[key]?.status === 'occupied'
    }).length

    const checkIn = roomsList.filter(room => {
      const key = `${location}-${date.toISOString().split('T')[0]}-${room}`
      return rooms[key]?.status === 'check-in'
    }).length

    const dirty = roomsList.filter(room => {
      const key = `${location}-${date.toISOString().split('T')[0]}-${room}`
      return rooms[key]?.status === 'dirty'
    }).length

    return { empty, occupied, checkIn, dirty }
  }

  // הוספת בדיקה לפני הרינדור של השעה
  const timeDisplay = currentTime ? (
    <div className="flex items-center gap-2 text-orange-400">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      <span className="text-sm font-medium">{formatTime(currentTime)}</span>
      <span className="text-orange-600 mx-2">|</span>
      <span className="text-sm">{formatDateForClock(currentTime)}</span>
    </div>
  ) : null;

  return (
    <main className="min-h-screen bg-gray-900 p-4 md:p-8" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Rothschild 79 - עכשיו ראשון */}
          <div className="bg-white/[0.03] backdrop-blur-sm rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <a 
                  href="/bookings/rothschild"
                  className="text-lg text-white/90 font-medium hover:text-white transition-colors duration-300 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Rothschild 79
                </a>
              </div>

              <div className="flex items-center gap-2">
                {/* כפתורי ניווט מהיר */}
                <div className="flex gap-2">
                  {nextDays.map((day, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        const targetRef = rothschildTodayRef.current?.parentElement?.children[getNextDayRef('rothschild', index + 1)]
                        targetRef?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                      }}
                      className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-xs font-medium text-gray-400 hover:text-white transition-colors"
                      title={`קפוץ ליום ${day.fullDayName}`}
                    >
                      {day.dayName}
                    </button>
                  ))}
                </div>

                <button
                  onClick={scrollToRothschildToday}
                  className="p-1.5 text-gray-400 hover:text-white transition-colors"
                  title="חזור להיום"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent hover:scrollbar-thumb-white/10">
              {dates.map((date) => {
                const isToday = date.toDateString() === new Date().toDateString()
                const status = getRoomStatus('rothschild', date, rothschildRooms) // או 'airport' ו-airportRooms בהתאמה
                
                return (
                  <div 
                    key={date.toISOString()} 
                    className="mb-6"
                    ref={isToday ? rothschildTodayRef : null}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className={`text-sm font-medium ${
                        isToday 
                          ? 'text-orange-400 bg-orange-400/10 px-3 py-1 rounded-full inline-block' 
                          : date < new Date() 
                            ? 'text-blue-400/90' 
                            : 'text-yellow-400/90'
                      }`}>
                        {formatDate(date)}
                      </h3>

                      <div className="flex gap-2 text-xs font-medium">
                        <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md">
                          <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                          <span className="text-green-400">{status.empty}</span>
                        </div>

                        <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md">
                          <svg className="w-3.5 h-3.5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-purple-400">{status.checkIn}</span>
                        </div>

                        <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md">
                          <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="text-blue-400">{status.occupied}</span>
                        </div>

                        <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md">
                          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span className="text-gray-400">{status.dirty}</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {rothschildRooms.map(room => (
                        <RoomRow 
                          key={`${date.toISOString()}-${room}`}
                          location="rothschild"
                          date={date}
                          room={room}
                          onUpdate={handleRoomUpdate('rothschild', date, room)}
                          initialData={getRoom('rothschild', date, room)}
                          setRooms={updateRooms}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Airport Guest House - עכשיו שני */}
          <div className="bg-white/[0.03] backdrop-blur-sm rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-4">
                <a 
                  href="/bookings/airport-guest-house"
                  className="text-lg text-white/90 font-medium hover:text-white transition-colors duration-300 flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  Airport Guest House
                </a>
              </div>

              <div className="flex items-center gap-2">
                {/* כפתורי ניווט מהיר */}
                <div className="flex gap-2">
                  {nextDays.map((day, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        const targetRef = airportTodayRef.current?.parentElement?.children[getNextDayRef('airport', index + 1)]
                        targetRef?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                      }}
                      className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-xs font-medium text-gray-400 hover:text-white transition-colors"
                      title={`קפוץ ליום ${day.fullDayName}`}
                    >
                      {day.dayName}
                    </button>
                  ))}
                </div>

                <button
                  onClick={scrollToAirportToday}
                  className="p-1.5 text-gray-400 hover:text-white transition-colors"
                  title="חזור להיום"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-white/5 scrollbar-track-transparent hover:scrollbar-thumb-white/10">
              {dates.map((date) => {
                const isToday = date.toDateString() === new Date().toDateString()
                const status = getRoomStatus('airport', date, airportRooms) // או 'rothschild' ו-rothschildRooms בהתאמה
                
                return (
                  <div 
                    key={date.toISOString()} 
                    className="mb-6"
                    ref={isToday ? airportTodayRef : null}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h3 className={`text-sm font-medium ${
                        isToday 
                          ? 'text-orange-400 bg-orange-400/10 px-3 py-1 rounded-full inline-block' 
                          : date < new Date() 
                            ? 'text-blue-400/90' 
                            : 'text-yellow-400/90'
                      }`}>
                        {formatDate(date)}
                      </h3>

                      <div className="flex gap-2 text-xs font-medium">
                        <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md">
                          <svg className="w-3.5 h-3.5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                          </svg>
                          <span className="text-green-400">{status.empty}</span>
                        </div>

                        <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md">
                          <svg className="w-3.5 h-3.5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="text-purple-400">{status.checkIn}</span>
                        </div>

                        <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md">
                          <svg className="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span className="text-blue-400">{status.occupied}</span>
                        </div>

                        <div className="flex items-center gap-1.5 bg-white/5 px-2 py-1 rounded-md">
                          <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          <span className="text-gray-400">{status.dirty}</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {airportRooms.map(room => (
                        <RoomRow 
                          key={`${date.toISOString()}-${room}`}
                          location="airport"
                          date={date}
                          room={room}
                          onUpdate={handleRoomUpdate('airport', date, room)}
                          initialData={getRoom('airport', date, room)}
                          setRooms={updateRooms}
                        />
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer with Reports Link and Clock in the same row */}
        <div className="mt-8 flex justify-between items-center">
          {timeDisplay}
          <PomodoroTimer />
          <a 
            href="/business-status"
            className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors duration-300"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-sm">Reports</span>
          </a>
        </div>
      </div>
    </main>
  );
}
