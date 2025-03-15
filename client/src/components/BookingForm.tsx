import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format, addDays, isSameDay } from "date-fns";
import { sv } from "date-fns/locale";
import { insertBookingSchema } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import Calendar from "./Calendar";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent } from "@/components/ui/card";

// Use the booking schema from the shared schema definition
const bookingFormSchema = insertBookingSchema;

type BookingFormValues = z.infer<typeof bookingFormSchema>;

export default function BookingForm() {
  const { toast } = useToast();
  const [selectedDates, setSelectedDates] = useState<{
    checkIn: Date | null;
    checkOut: Date | null;
  }>({
    checkIn: null,
    checkOut: null,
  });

  // Set up form with validation
  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingFormSchema),
    defaultValues: {
      name: "",
      apartmentNumber: "",
      email: "",
      phone: "",
      // Convert Date to string format for the form
      checkInDate: format(new Date(), 'yyyy-MM-dd'),
      checkOutDate: format(new Date(), 'yyyy-MM-dd'),
      guestCount: 1,
      message: "", // Always initialize with empty string, never null
    },
  });

  // Handle booking submission
  const bookingMutation = useMutation({
    mutationFn: (data: BookingFormValues) => 
      apiRequest("POST", "/api/bookings", data),
    onSuccess: () => {
      toast({
        title: "Bokning genomförd",
        description: "Din bokning har registrerats.",
      });
      // Reset form and selected dates
      form.reset();
      setSelectedDates({ checkIn: null, checkOut: null });
      
      // Invalidate the availability cache to refresh the calendar
      queryClient.invalidateQueries({ queryKey: ['/api/bookings/availability'] });
      // Invalidate bookings list to ensure the new booking appears in the management view
      queryClient.invalidateQueries({ queryKey: ['/api/bookings'] });
    },
    onError: (error: Error) => {
      toast({
        title: "Ett fel uppstod",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submission
  const onSubmit = (data: BookingFormValues) => {
    // Check if dates are selected
    if (!selectedDates.checkIn || !selectedDates.checkOut) {
      toast({
        title: "Datum saknas",
        description: "Du måste välja både in- och utcheckningsdatum",
        variant: "destructive",
      });
      return;
    }
    
    // Format dates properly for the API
    const formattedData = {
      ...data,
      checkInDate: format(selectedDates.checkIn, 'yyyy-MM-dd'),
      checkOutDate: format(selectedDates.checkOut, 'yyyy-MM-dd'),
    };
    
    console.log("Submitting booking:", formattedData);
    bookingMutation.mutate(formattedData);
  };

  // Handle date selection in calendar
  const handleDateSelect = (date: Date) => {
    // If no dates selected yet or both dates selected, start fresh with check-in
    if (!selectedDates.checkIn || (selectedDates.checkIn && selectedDates.checkOut)) {
      // Start a new selection with check-in date
      setSelectedDates({
        checkIn: date,
        checkOut: null,
      });
      // Format the date as a string for the form
      form.setValue("checkInDate", format(date, 'yyyy-MM-dd'));
      form.setValue("checkOutDate", ""); // Clear checkout date
    } 
    // If only check-in selected, set check-out
    else if (selectedDates.checkIn && !selectedDates.checkOut) {
      // Ensure check-out is after check-in
      if (date > selectedDates.checkIn) {
        // Set check-out date
        setSelectedDates({
          ...selectedDates,
          checkOut: date,
        });
        // Format the date as a string for the form
        form.setValue("checkOutDate", format(date, 'yyyy-MM-dd'));
      } else if (date.getTime() === selectedDates.checkIn.getTime()) {
        // If clicking same date, require at least 1 day stay
        const nextDay = addDays(date, 1);
        setSelectedDates({
          checkIn: date,
          checkOut: nextDay,
        });
        form.setValue("checkOutDate", format(nextDay, 'yyyy-MM-dd'));
      } else {
        // If selected date is before check-in, swap them
        setSelectedDates({
          checkIn: date,
          checkOut: selectedDates.checkIn,
        });
        // Format the dates as strings for the form
        form.setValue("checkInDate", format(date, 'yyyy-MM-dd'));
        form.setValue("checkOutDate", format(selectedDates.checkIn, 'yyyy-MM-dd'));
      }
    }
  };

  return (
    <div>
      <h3 className="text-xl font-semibold mb-4">Boka gästlägenheten</h3>
      
      {/* Calendar section */}
      <div className="mb-8">
        <h4 className="text-lg font-medium mb-3">Välj datum</h4>
        <Calendar onDateSelect={handleDateSelect} selectedDates={selectedDates} />
        
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-100 mr-2 rounded"></div>
            <span>Bokad</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-accent/60 mr-2 rounded-full"></div>
            <span>Valda datum</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-accent/20 mr-2 rounded"></div>
            <span>Valda dagar</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-white border mr-2 rounded"></div>
            <span>Tillgänglig</span>
          </div>
        </div>
        
        {/* Selected dates summary */}
        {selectedDates.checkIn && (
          <Card className="mt-4">
            <CardContent className="p-4">
              <p className="font-medium">Valda datum:</p>
              <div className="flex flex-wrap gap-x-6 gap-y-2 mt-2">
                <div>
                  <span className="text-sm text-gray-500">Incheckning:</span>
                  <p>
                    {selectedDates.checkIn
                      ? format(selectedDates.checkIn, "d MMMM yyyy", { locale: sv })
                      : "Ej valt"}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-gray-500">Utcheckning:</span>
                  <p>
                    {selectedDates.checkOut
                      ? format(selectedDates.checkOut, "d MMMM yyyy", { locale: sv })
                      : "Ej valt"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* Booking form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="bg-secondary p-6 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Gästens namn</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="apartmentNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Lägenhetsnummer</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>E-post</FormLabel>
                  <FormControl>
                    <Input type="email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Telefonnummer</FormLabel>
                  <FormControl>
                    <Input type="tel" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            

            
            <FormField
              control={form.control}
              name="message"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Meddelande (valfritt)</FormLabel>
                  <FormControl>
                    <Textarea 
                      rows={3} 
                      {...field} 
                      value={field.value || ''} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="mt-6">
            <Button 
              type="submit" 
              className="bg-primary hover:bg-primary/90 text-white px-6 py-3"
              disabled={bookingMutation.isPending}
            >
              {bookingMutation.isPending ? "Bearbetar..." : "Boka lägenheten"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
