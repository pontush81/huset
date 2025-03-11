import { useQuery } from "@tanstack/react-query";
import { format, parseISO, startOfMonth, endOfMonth } from "date-fns";
import { sv } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface BookingDate {
  id: number;
  checkInDate: string;
  checkOutDate: string;
  status: string;
}

export default function MonthBookings() {
  const currentMonth = new Date();
  
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
      status: booking.status
    };
  };
  
  if (isLoading) {
    return (
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-xl">Bokningar denna månad</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Only show confirmed bookings
  const confirmedBookings = bookings?.filter(booking => booking.status === 'confirmed') || [];
  
  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle className="text-xl">Bokningar denna månad</CardTitle>
      </CardHeader>
      <CardContent>
        {confirmedBookings.length === 0 ? (
          <p className="text-gray-500 italic text-center py-4">
            Inga bokningar denna månad
          </p>
        ) : (
          <div className="space-y-3">
            {confirmedBookings.map(booking => {
              const formatted = formatBooking(booking);
              return (
                <div key={booking.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-md">
                  <div>
                    <p className="font-medium">{formatted.checkInFormatted} → {formatted.checkOutFormatted}</p>
                  </div>
                  <Badge variant="outline" className="bg-primary text-white">
                    Bokad
                  </Badge>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}