import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Booking } from "@shared/schema";

export default function BookingManager() {
  const { toast } = useToast();
  const [showCancelDialog, setShowCancelDialog] = useState<boolean>(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState<boolean>(false);
  const [selectedBookingId, setSelectedBookingId] = useState<number | null>(null);
  const [filter, setFilter] = useState<string>("active"); // Filtrera på aktiva bokningar som standard

  // Fetch all bookings
  const { data: bookings, isLoading } = useQuery<Booking[]>({
    queryKey: ['/api/bookings'],
  });

  // Export bookings mutation
  const exportMutation = useMutation<
    { success: boolean; message: string; fileName: string; downloadUrl: string },
    Error,
    void
  >({
    mutationFn: () => apiRequest("GET", "/api/bookings/export"),
    onSuccess: (data) => {
      toast({
        title: "Export slutförd",
        description: "Bokningarna har exporterats och kan nu laddas ner.",
      });
      
      // Trigger download
      window.location.href = data.downloadUrl;
    },
    onError: (error: Error) => {
      toast({
        title: "Export misslyckades",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Cancel booking mutation
  const cancelMutation = useMutation({
    mutationFn: (bookingId: number) => 
      apiRequest("PATCH", `/api/bookings/${bookingId}/status`, { status: "cancelled" }),
    onSuccess: () => {
      toast({
        title: "Bokning avbokad",
        description: "Bokningen har avbokats.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings/availability'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Avbokning misslyckades",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Confirm booking mutation
  const confirmMutation = useMutation({
    mutationFn: (bookingId: number) => 
      apiRequest("PATCH", `/api/bookings/${bookingId}/status`, { status: "confirmed" }),
    onSuccess: () => {
      toast({
        title: "Bokning bekräftad",
        description: "Bokningen har bekräftats.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
      queryClient.invalidateQueries({ queryKey: ['/api/bookings/availability'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Bekräftelse misslyckades",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle booking cancellation
  const handleCancelBooking = (bookingId: number) => {
    // Hitta bokningen för att visa relevant dialog
    const booking = bookings?.find(b => b.id === bookingId);
    setSelectedBookingId(bookingId);
    setShowCancelDialog(true);
  };

  // Confirm booking cancellation
  const confirmCancelBooking = () => {
    if (selectedBookingId !== null) {
      cancelMutation.mutate(selectedBookingId);
      setShowCancelDialog(false);
      setSelectedBookingId(null);
    }
  };
  
  // Handle booking confirmation
  const handleConfirmBooking = (bookingId: number) => {
    setSelectedBookingId(bookingId);
    setShowConfirmDialog(true);
  };
  
  // Confirm booking
  const confirmBookingAction = () => {
    if (selectedBookingId !== null) {
      confirmMutation.mutate(selectedBookingId);
      setShowConfirmDialog(false);
      setSelectedBookingId(null);
    }
  };

  // Filter bookings by status
  const pendingBookings = bookings?.filter(booking => booking.status === 'pending') || [];
  const confirmedBookings = bookings?.filter(booking => booking.status === 'confirmed') || [];
  const cancelledBookings = bookings?.filter(booking => booking.status === 'cancelled') || [];
  const activeBookings = bookings?.filter(booking => booking.status !== 'cancelled') || [];

  // Get status badge style
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge className="bg-yellow-500">Väntar</Badge>;
      case 'confirmed':
        return <Badge className="bg-green-500">Bekräftad</Badge>;
      case 'cancelled':
        return <Badge className="bg-red-500">Avbokad</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  // Format date to Swedish format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "d MMMM yyyy", { locale: sv });
  };

  // Handle export
  const handleExport = () => {
    exportMutation.mutate();
  };

  // Render booking card
  const renderBookingCard = (booking: Booking) => (
    <Card key={booking.id} className="mb-4">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg">{booking.name}</CardTitle>
          {getStatusBadge(booking.status)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <p className="text-sm text-gray-500">Datum</p>
            <p>{formatDate(booking.checkInDate)} - {formatDate(booking.checkOutDate)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Lägenhet</p>
            <p>{booking.apartmentNumber}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-gray-500">Kontakt</p>
            <p>{booking.phone} · {booking.email}</p>
          </div>
        </div>
        
        {booking.message && (
          <div className="mt-3">
            <p className="text-sm text-gray-500">Meddelande</p>
            <p className="bg-gray-50 p-2 rounded mt-1">{booking.message}</p>
          </div>
        )}
        
        <div className="mt-4 flex gap-2">
          {booking.status === 'pending' && (
            <Button 
              variant="outline" 
              size="sm"
              className="text-green-500 border-green-500 hover:bg-green-50"
              onClick={() => handleConfirmBooking(booking.id)}
            >
              Bekräfta
            </Button>
          )}
          
          {/* Visa avbokningsknapp för alla bokningsstatus */}
          <Button 
            variant="outline" 
            size="sm"
            className="text-red-500 border-red-500 hover:bg-red-50"
            onClick={() => handleCancelBooking(booking.id)}
          >
            Avboka
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center">
        <div>
          <h3 className="text-xl font-semibold mb-2">Hantera bokningar</h3>
          <div className="flex flex-wrap gap-2">
            <Button 
              variant={filter === 'active' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setFilter('active')}
              className={filter === 'active' ? 'bg-primary hover:bg-primary/90' : ''}
            >
              Aktiva ({activeBookings.length})
            </Button>
            <Button 
              variant={filter === 'confirmed' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setFilter('confirmed')}
              className={filter === 'confirmed' ? 'bg-green-500 hover:bg-green-600' : 'text-green-500'}
            >
              Bekräftade ({confirmedBookings.length})
            </Button>
            <Button 
              variant={filter === 'pending' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setFilter('pending')}
              className={filter === 'pending' ? 'bg-yellow-500 hover:bg-yellow-600' : 'text-yellow-500'}
            >
              Väntar ({pendingBookings.length})
            </Button>
            <Button 
              variant={filter === 'cancelled' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setFilter('cancelled')}
              className={filter === 'cancelled' ? 'bg-red-500 hover:bg-red-600' : 'text-red-500'}
            >
              Avbokade ({cancelledBookings.length})
            </Button>
          </div>
        </div>
        
        <Button 
          onClick={handleExport}
          disabled={exportMutation.isPending || !bookings?.length}
          className="bg-primary hover:bg-primary/90"
        >
          {exportMutation.isPending ? "Exporterar..." : "Exportera bokningar"}
        </Button>
      </div>
      
      {isLoading ? (
        <div className="text-center py-8">Laddar bokningar...</div>
      ) : bookings?.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Inga bokningar hittades</p>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings
            ?.filter(booking => {
              if (filter === 'active') return booking.status !== 'cancelled';
              return booking.status === filter;
            })
            .map(renderBookingCard)}
        </div>
      )}
      
      {/* Cancellation confirmation dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bekräfta avbokning</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedBookingId && bookings?.find(b => b.id === selectedBookingId)?.status === 'confirmed' 
                ? 'Är du säker på att du vill avboka denna bekräftade bokning? Detta kan påverka gästen och bör endast göras vid särskilda omständigheter.'
                : 'Är du säker på att du vill avboka denna bokning? Denna åtgärd kan inte ångras.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={confirmCancelBooking} className="bg-red-500 text-white">
              Avboka
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Confirmation dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Bekräfta bokning</AlertDialogTitle>
            <AlertDialogDescription>
              Bekräfta denna bokning? Gästen kommer att meddelas om att bokningen är bekräftad.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Avbryt</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBookingAction} className="bg-green-500 text-white">
              Bekräfta
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}