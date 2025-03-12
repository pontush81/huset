import { useQuery } from "@tanstack/react-query";
import { format, parseISO, startOfMonth, endOfMonth } from "date-fns";
import { sv } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { CalendarCheck } from "lucide-react";

interface BookingDate {
  id: number;
  checkInDate: string;
  checkOutDate: string;
  status: string;
  name: string;
  apartmentNumber: string;
}

interface MonthBookingsProps {
  currentMonth?: Date;
}

export default function MonthBookings({ currentMonth: propMonth }: MonthBookingsProps) {
  // Use prop month if provided, otherwise use current date
  const currentMonth = propMonth || new Date();
  
  // Fetch bookings for current month
  const { data: bookings, isLoading } = useQuery<BookingDate[]>({
    queryKey: ['/api/bookings/availability', format(currentMonth, 'yyyy-MM')],
    queryFn: () => fetch(`/api/bookings/availability?startDate=${format(startOfMonth(currentMonth), 'yyyy-MM-dd')}&endDate=${format(endOfMonth(currentMonth), 'yyyy-MM-dd')}`).then(res => res.json()),
  });
  
  // Format each booking for display
  const formatBooking = (booking: BookingDate) => {
    const checkIn = parseISO(booking.checkInDate);
    const checkOut = parseISO(booking.checkOutDate);
    
    return {
      id: booking.id,
      checkInFormatted: format(checkIn, 'd MMMM', { locale: sv }),
      checkOutFormatted: format(checkOut, 'd MMMM', { locale: sv }),
      status: booking.status,
      name: booking.name,
      apartmentNumber: booking.apartmentNumber
    };
  };
  
  if (isLoading) {
    return (
      <div className="mt-4">
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    );
  }
  
  // Only show confirmed and pending bookings (filter out cancelled)
  const activeBookings = bookings?.filter(booking => booking.status !== 'cancelled') || [];
  
  return (
    <div className="mt-4">
      {activeBookings.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <CalendarCheck className="h-12 w-12 mx-auto text-gray-400 mb-2" />
          <p className="text-gray-500">Inga aktiva bokningar denna månad</p>
        </div>
      ) : (
        <div className="space-y-3">
          {activeBookings.map(booking => {
            const formatted = formatBooking(booking);
            return (
              <div key={booking.id} className="flex justify-between items-center p-4 bg-white border border-gray-100 shadow-sm rounded-md hover:border-gray-200 transition-colors">
                <div>
                  <p className="font-medium">
                    {formatted.checkInFormatted} → {formatted.checkOutFormatted}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatted.name} {formatted.apartmentNumber && `· Lägenhet ${formatted.apartmentNumber}`}
                  </p>
                </div>
                <Badge 
                  className={
                    booking.status === 'confirmed' 
                      ? "bg-green-500" 
                      : "bg-yellow-500"
                  }
                >
                  {booking.status === 'confirmed' ? 'Bekräftad' : 'Väntar'}
                </Badge>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}