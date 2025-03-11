import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  format, 
  addMonths, 
  subMonths, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isToday, 
  parseISO, 
  isBefore, 
  isAfter, 
  isSameDay,
  getWeek,
  startOfWeek,
  addDays
} from "date-fns";
import { sv } from "date-fns/locale";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface CalendarProps {
  onDateSelect?: (date: Date) => void;
  selectedDates?: { checkIn: Date | null; checkOut: Date | null };
}

interface BookingDate {
  id: number;
  checkInDate: string;
  checkOutDate: string;
  status: string;
}

export default function Calendar({ onDateSelect, selectedDates }: CalendarProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Calculate calendar range (current month + some days from previous/next month)
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  
  // Create calendar day array, organized by weeks
  const firstDayOfMonth = startOfMonth(currentMonth);
  const firstDayOfCalendar = startOfWeek(firstDayOfMonth, { weekStartsOn: 1 }); // Start on Monday
  
  // Generate 42 days (6 weeks) to ensure we have full weeks visible
  const calendarDays = Array.from({ length: 42 }, (_, i) => addDays(firstDayOfCalendar, i));
  
  // Get bookings for availability check
  const { data: bookings, isLoading } = useQuery<BookingDate[]>({
    queryKey: ['/api/bookings/availability', format(currentMonth, 'yyyy-MM')],
    queryFn: () => fetch(`/api/bookings/availability?startDate=${format(startOfMonth(subMonths(currentMonth, 1)), 'yyyy-MM-dd')}&endDate=${format(endOfMonth(addMonths(currentMonth, 1)), 'yyyy-MM-dd')}`).then(res => res.json()),
  });

  // Helper to check if a date is booked
  const isDateBooked = (date: Date) => {
    if (!bookings) return false;
    
    return bookings.some(booking => {
      const checkIn = parseISO(booking.checkInDate);
      const checkOut = parseISO(booking.checkOutDate);
      
      // Date is between check-in and check-out (inclusive)
      return (
        (isSameDay(date, checkIn) || isAfter(date, checkIn)) && 
        (isBefore(date, checkOut) || isSameDay(date, checkOut))
      );
    });
  };

  // Check if date is one of the selected dates (for highlighting)
  const isSelectedDate = (date: Date) => {
    if (!selectedDates) return false;
    
    return (
      (selectedDates.checkIn && isSameDay(date, selectedDates.checkIn)) ||
      (selectedDates.checkOut && isSameDay(date, selectedDates.checkOut))
    );
  };

  // Check if date is between selected dates (for highlighting range)
  const isInSelectedRange = (date: Date) => {
    if (!selectedDates || !selectedDates.checkIn || !selectedDates.checkOut) return false;
    
    return (
      isAfter(date, selectedDates.checkIn) && 
      isBefore(date, selectedDates.checkOut)
    );
  };

  // Generate day element with appropriate styling
  const renderDay = (day: Date) => {
    const dayNumber = day.getDate();
    const isCurrentMonth = isSameMonth(day, currentMonth);
    const isDateToday = isToday(day);
    const isBooked = isDateBooked(day);
    const isSelected = isSelectedDate(day);
    const isInRange = isInSelectedRange(day);
    
    // Style classes based on state
    let dayClass = "p-2 relative flex items-center justify-center";
    
    if (!isCurrentMonth) {
      dayClass += " text-gray-400";
    }
    
    if (isDateToday) {
      dayClass += " font-bold";
    }
    
    if (isBooked) {
      dayClass += " bg-red-100";
    } else if (isSelected) {
      dayClass += " bg-accent/60 text-white rounded-full";
    } else if (isInRange) {
      dayClass += " bg-accent/20";
    }
    
    return (
      <button 
        key={day.toString()}
        className={dayClass}
        onClick={() => onDateSelect && !isBooked && onDateSelect(day)}
        disabled={isBooked || isBefore(day, new Date())}
      >
        {dayNumber}
      </button>
    );
  };

  // Previous month button
  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  // Next month button
  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  // Week day headers
  const weekDays = ["Vecka", "Mån", "Tis", "Ons", "Tor", "Fre", "Lör", "Sön"];

  // Group days by weeks for rendering
  const weeks = calendarDays.reduce((acc, day, i) => {
    const weekIndex = Math.floor(i / 7);
    if (!acc[weekIndex]) {
      acc[weekIndex] = [];
    }
    acc[weekIndex].push(day);
    return acc;
  }, [] as Date[][]);

  return (
    <Card className="bg-white border rounded-lg overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={prevMonth}
          className="text-primary hover:text-primary/80"
        >
          <i className="fas fa-chevron-left"></i>
        </Button>
        <h4 className="font-medium text-lg">
          {format(currentMonth, "MMMM yyyy", { locale: sv })}
        </h4>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={nextMonth}
          className="text-primary hover:text-primary/80"
        >
          <i className="fas fa-chevron-right"></i>
        </Button>
      </div>
      
      <div className="grid grid-cols-8 text-center">
        {/* Weekday headers */}
        {weekDays.map((day) => (
          <div key={day} className="p-2 border-b text-sm font-medium">
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {isLoading ? (
          // Skeleton loading state for days
          Array(42).fill(0).map((_, i) => (
            <div key={i} className="p-2 border-b border-r">
              <Skeleton className="h-6 w-6 rounded-full mx-auto" />
            </div>
          ))
        ) : (
          // Generate the calendar grid with days by week
          weeks.map((week, weekIndex) => 
            // Använd den tomma fragment-syntaxen <> ... </> istället för Fragment-komponent
            <>
              {/* Week number cell */}
              <div key={`week-${weekIndex}`} className="p-2 border-r border-b flex items-center justify-center bg-gray-50">
                <span className="text-xs font-medium text-gray-500">
                  {getWeek(week[0], { weekStartsOn: 1 })}
                </span>
              </div>
              
              {/* Days in this week */}
              {week.map((day, dayIndex) => (
                <div key={`${weekIndex}-${dayIndex}`} className="border-b border-r">
                  {renderDay(day)}
                </div>
              ))}
            </>
          )
        )}
      </div>
    </Card>
  );
}
