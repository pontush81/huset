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
import { Switch } from "@/components/ui/switch";
import { ChevronLeft, ChevronRight } from "lucide-react";

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
  const [showWeekNumbers, setShowWeekNumbers] = useState<boolean>(true);
  
  // Calculate calendar range (current month + some days from previous/next month)
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  
  // Create calendar day array, organized by weeks
  const firstDayOfMonth = startOfMonth(currentMonth);
  // Start on Monday (1)
  const firstDayOfCalendar = startOfWeek(firstDayOfMonth, { weekStartsOn: 1 });
  
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

  // Check if date is one of the selected dates (for highlighting check-in and check-out dates)
  const isSelectedDate = (date: Date) => {
    if (!selectedDates) return false;
    
    // Create normalized date objects for comparison
    const dateObj = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    
    const checkInObj = selectedDates.checkIn ? 
      new Date(
        selectedDates.checkIn.getFullYear(), 
        selectedDates.checkIn.getMonth(), 
        selectedDates.checkIn.getDate()
      ) : null;
    
    const checkOutObj = selectedDates.checkOut ? 
      new Date(
        selectedDates.checkOut.getFullYear(), 
        selectedDates.checkOut.getMonth(), 
        selectedDates.checkOut.getDate()
      ) : null;
    
    // Compare the date objects
    return (
      (checkInObj && dateObj.getTime() === checkInObj.getTime()) ||
      (checkOutObj && dateObj.getTime() === checkOutObj.getTime())
    );
  };

  // Check if date is between selected dates (for highlighting the entire range)
  const isInSelectedRange = (date: Date) => {
    if (!selectedDates?.checkIn || !selectedDates?.checkOut) return false;
    
    // Clear time components for accurate date comparison
    const dayStart = startOfDay(date);
    const checkInDay = startOfDay(selectedDates.checkIn);
    const checkOutDay = startOfDay(selectedDates.checkOut);
    
    // Return true if date is between check-in and check-out (not inclusive)
    return (
      isAfter(dayStart, checkInDay) && 
      isBefore(dayStart, checkOutDay)
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
    let dayClass = "w-full h-full p-2 flex items-center justify-center relative";
    
    if (!isCurrentMonth) {
      dayClass += " text-gray-400";
    }
    
    if (isDateToday) {
      dayClass += " font-bold";
    }
    
    // Calculate range and edge cases
    let dayStyles = {};
    let rangeClass = '';
    
    if (isBooked) {
      // Booked dates always get red background
      dayClass += " bg-red-100";
    } else if (isSelected) {
      // Selected dates (check-in/check-out) get accent highlight
      dayClass += " bg-primary text-white font-medium z-10";
      
      // Add indicator styling for check-in/check-out
      const normalizedDayDate = new Date(
        day.getFullYear(), 
        day.getMonth(), 
        day.getDate()
      ).getTime();
      
      const normalizedCheckInDate = selectedDates?.checkIn ? 
        new Date(
          selectedDates.checkIn.getFullYear(), 
          selectedDates.checkIn.getMonth(), 
          selectedDates.checkIn.getDate()
        ).getTime() : null;
      
      const normalizedCheckOutDate = selectedDates?.checkOut ? 
        new Date(
          selectedDates.checkOut.getFullYear(), 
          selectedDates.checkOut.getMonth(), 
          selectedDates.checkOut.getDate()
        ).getTime() : null;
      
      if (normalizedCheckInDate && normalizedDayDate === normalizedCheckInDate) {
        dayStyles = { 
          ...dayStyles,
          borderRadius: "50%",
          boxShadow: "0 0 0 2px #fff"
        };
      } else if (normalizedCheckOutDate && normalizedDayDate === normalizedCheckOutDate) {
        dayStyles = { 
          ...dayStyles,
          borderRadius: "50%",
          boxShadow: "0 0 0 2px #fff"
        };
      }
    } else if (isInRange) {
      // Dates in the range use a uniform background color with improved contrast
      dayClass += " bg-primary/20";
      dayStyles = {
        ...dayStyles,
        backgroundColor: "rgba(var(--primary), 0.2)",
        background: "rgba(var(--primary), 0.2)"
      };
    }
    
    return (
      <button 
        className={`${dayClass} ${rangeClass}`}
        style={dayStyles}
        onClick={() => onDateSelect && !isBooked && onDateSelect(day)}
        disabled={isBooked || isBefore(day, new Date())}
      >
        {dayNumber}
        {selectedDates?.checkIn && isSelectedDate(day) && 
          new Date(
            selectedDates.checkIn.getFullYear(), 
            selectedDates.checkIn.getMonth(), 
            selectedDates.checkIn.getDate()
          ).getTime() === new Date(
            day.getFullYear(), 
            day.getMonth(), 
            day.getDate()
          ).getTime() && (
          <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 text-[8px] font-medium text-primary-foreground">
            In
          </span>
        )}
        {selectedDates?.checkOut && isSelectedDate(day) && 
          new Date(
            selectedDates.checkOut.getFullYear(), 
            selectedDates.checkOut.getMonth(), 
            selectedDates.checkOut.getDate()
          ).getTime() === new Date(
            day.getFullYear(), 
            day.getMonth(), 
            day.getDate()
          ).getTime() && (
          <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 text-[8px] font-medium text-primary-foreground">
            Ut
          </span>
        )}
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
      <div className="flex flex-col sm:flex-row items-center border-b">
        <div className="flex items-center justify-between p-4 w-full">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={prevMonth}
            className="text-primary hover:text-primary/80"
          >
            <ChevronLeft className="h-4 w-4" />
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
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2 px-4 pb-4 sm:pb-0 sm:pr-4 sm:border-l">
          <label htmlFor="show-weeks" className="text-sm">
            Visa veckonummer
          </label>
          <Switch 
            id="show-weeks"
            checked={showWeekNumbers}
            onCheckedChange={setShowWeekNumbers}
          />
        </div>
      </div>
      
      <div className={`grid ${showWeekNumbers ? 'grid-cols-8' : 'grid-cols-7'} text-center`}>
        {/* Weekday headers */}
        {weekDays.filter((_, i) => showWeekNumbers || i > 0).map((day) => (
          <div key={day} className="p-2 border-b text-sm font-medium">
            {day}
          </div>
        ))}
        
        {/* Calendar days with week numbers */}
        {isLoading ? (
          // Skeleton loading state for days
          Array(showWeekNumbers ? 48 : 42).fill(0).map((_, i) => (
            <div key={i} className="p-2 border-b border-r">
              <Skeleton className="h-6 w-6 rounded-full mx-auto" />
            </div>
          ))
        ) : (
          // Render all weeks and days
          weeks.flatMap((week, weekIndex) => {
            // Create week row array
            const weekRow = [];
            
            // Add week number cell
            if (showWeekNumbers) {
              weekRow.push(
                <div key={`week-${weekIndex}`} className="p-2 border-r border-b flex items-center justify-center bg-gray-50">
                  <span className="text-xs font-medium text-gray-500">
                    {getWeek(week[0], { weekStartsOn: 1 })}
                  </span>
                </div>
              );
            }
            
            // Add day cells
            week.forEach((day, dayIndex) => {
              weekRow.push(
                <div key={`day-${weekIndex}-${dayIndex}`} className="border-b border-r">
                  {renderDay(day)}
                </div>
              );
            });
            
            return weekRow;
          })
        )}
      </div>
    </Card>
  );
}
