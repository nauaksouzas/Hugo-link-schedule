import React, { useState, useMemo } from 'react';

// Using local time to display calendar dates.
// The timezone for locking dates should optimally be NY, but we'll use the browser's local time for simplicity to match the original getLocalDateString.
// If needed, we can construct NY dates. For now, doing standard JS Date manipulation based on what the original code did.

interface CalendarPickerProps {
  selectedDate: string;
  onChange: (dateStr: string) => void;
  lang: 'en' | 'pt';
}

const getLocalDateString = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export function CalendarPicker({ selectedDate, onChange, lang }: CalendarPickerProps) {
  const [currentMonth, setCurrentMonth] = useState(() => {
    const d = selectedDate ? new Date(selectedDate + 'T12:00:00Z') : new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" }));
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });

  const today = useMemo(() => new Date(new Date().toLocaleString("en-US", { timeZone: "America/New_York" })), []);
  const todayStr = getLocalDateString(today);

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Generate days
  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 (Sun) to 6 (Sat)
    
    const days = [];
    
    // Add empty slots for days before the 1st
    for (let i = 0; i < firstDayOfWeek; i++) {
        days.push(null);
    }
    
    for (let d = 1; d <= daysInMonth; d++) {
        const dateObj = new Date(year, month, d);
        days.push(dateObj);
    }
    
    return days;
  }, [currentMonth]);

  const monthNamesEn = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const monthNamesPt = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const weekDaysEn = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const weekDaysPt = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  
  const monthNames = lang === 'pt' ? monthNamesPt : monthNamesEn;
  const weekDays = lang === 'pt' ? weekDaysPt : weekDaysEn;

  // Disable previous month button if current month is the current real month
  const isCurrentMonthOrPast = currentMonth.getFullYear() < today.getFullYear() || 
                               (currentMonth.getFullYear() === today.getFullYear() && currentMonth.getMonth() <= today.getMonth());

  return (
    <div className="calendar-picker bg-[#13110d] border border-[#c99a3c]/20 rounded-[16px] overflow-hidden shadow-sm">
      <div className="flex items-center justify-between p-4 border-b border-white/5">
        <button 
          type="button" 
          onClick={prevMonth} 
          disabled={isCurrentMonthOrPast}
          className={`w-10 h-10 flex items-center justify-center rounded-full transition-colors ${isCurrentMonthOrPast ? 'opacity-30 cursor-not-allowed' : 'hover:bg-white/10 text-cream'}`}
          aria-label={lang === 'pt' ? 'Mês anterior' : 'Previous month'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div className="font-serif text-[18px] text-cream font-medium">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </div>
        <button 
          type="button" 
          onClick={nextMonth}
          className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-white/10 text-cream transition-colors"
          aria-label={lang === 'pt' ? 'Próximo mês' : 'Next month'}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </button>
      </div>
      
      <div className="p-4 sm:p-5">
        <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map((day, i) => (
                <div key={i} className="text-center text-[12px] font-bold text-muted uppercase tracking-wider mb-2">
                    {day}
                </div>
            ))}
        </div>
        
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {calendarDays.map((dateObj, i) => {
                if (!dateObj) {
                    return <div key={`empty-${i}`} className="p-2"></div>;
                }
                
                const dateStr = getLocalDateString(dateObj);
                const isPast = dateStr < todayStr;
                const isSunday = dateObj.getDay() === 0;
                const isDisabled = isPast || isSunday;
                const isSelected = dateStr === selectedDate;
                const isToday = dateStr === todayStr;
                
                return (
                    <button
                        key={dateStr}
                        type="button"
                        disabled={isDisabled}
                        onClick={() => onChange(dateStr)}
                        className={`
                            relative h-[44px] w-full flex items-center justify-center rounded-xl text-[15px] font-medium transition-all duration-200 border
                            ${isDisabled ? 'opacity-30 cursor-not-allowed border-transparent line-through decoration-white/20' : ''}
                            ${!isDisabled && !isSelected ? 'bg-[#1a1711] border-[#362f22] text-cream hover:bg-[#262118] hover:border-[#c99a3c] shadow-sm' : ''}
                            ${isSelected ? 'bg-[#262118] border-gold-2 text-gold-2 font-bold shadow-[0_4px_12px_rgba(201,154,60,0.4)] transform scale-105' : ''}
                            ${isToday && !isSelected ? 'border-[#c99a3c]/40 text-[#f1cf83]' : ''}
                        `}
                    >
                        {dateObj.getDate()}
                    </button>
                );
            })}
        </div>
      </div>
    </div>
  );
}
