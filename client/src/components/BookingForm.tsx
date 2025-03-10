import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { insertBookingSchema } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
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

// Extend the booking schema with additional validation
const bookingFormSchema = insertBookingSchema.extend({
  terms: z.boolean().refine(val => val === true, {
    message: "Du måste godkänna reglerna för att boka",
  }),
});

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
      checkInDate: new Date(),
      checkOutDate: new Date(),
      guestCount: 1,
      message: "",
      terms: false,
    },
  });

  // Handle booking submission
  const bookingMutation = useMutation({
    mutationFn: (data: BookingFormValues) => 
      apiRequest("POST", "/api/bookings", data),
    onSuccess: () => {
      toast({
        title: "Bokningsförfrågan skickad",
        description: "Vi kommer att kontakta dig inom kort för att bekräfta bokningen.",
      });
      form.reset();
      setSelectedDates({ checkIn: null, checkOut: null });
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
    // Format dates properly for the API
    const formattedData = {
      ...data,
      checkInDate: format(selectedDates.checkIn || new Date(), 'yyyy-MM-dd'),
      checkOutDate: format(selectedDates.checkOut || new Date(), 'yyyy-MM-dd'),
    };
    
    bookingMutation.mutate(formattedData);
  };

  // Handle date selection in calendar
  const handleDateSelect = (date: Date) => {
    // If no dates selected yet or both dates selected, start fresh with check-in
    if (!selectedDates.checkIn || (selectedDates.checkIn && selectedDates.checkOut)) {
      setSelectedDates({
        checkIn: date,
        checkOut: null,
      });
      form.setValue("checkInDate", date);
    } 
    // If only check-in selected, set check-out
    else if (selectedDates.checkIn && !selectedDates.checkOut) {
      // Ensure check-out is after check-in
      if (date > selectedDates.checkIn) {
        setSelectedDates({
          ...selectedDates,
          checkOut: date,
        });
        form.setValue("checkOutDate", date);
      } else {
        // If selected date is before check-in, swap them
        setSelectedDates({
          checkIn: date,
          checkOut: selectedDates.checkIn,
        });
        form.setValue("checkInDate", date);
        form.setValue("checkOutDate", selectedDates.checkIn);
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
                  <FormLabel>Ditt namn</FormLabel>
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
              name="guestCount"
              render={({ field }) => (
                <FormItem className="md:col-span-2">
                  <FormLabel>Antal gäster</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    defaultValue={field.value.toString()}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Välj antal gäster" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="1">1 person</SelectItem>
                      <SelectItem value="2">2 personer</SelectItem>
                      <SelectItem value="3">3 personer</SelectItem>
                      <SelectItem value="4">4 personer</SelectItem>
                    </SelectContent>
                  </Select>
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
                    <Textarea rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          
          <div className="mt-6">
            <FormField
              control={form.control}
              name="terms"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 mb-4">
                  <FormControl>
                    <Checkbox 
                      checked={field.value} 
                      onCheckedChange={field.onChange} 
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      Jag godkänner <a href="#" className="text-primary hover:underline">reglerna</a> för användning av gästlägenheten
                    </FormLabel>
                    <FormMessage />
                  </div>
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="bg-primary hover:bg-primary/90 text-white px-6 py-3"
              disabled={bookingMutation.isPending}
            >
              {bookingMutation.isPending ? "Skickar..." : "Skicka bokningsförfrågan"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
