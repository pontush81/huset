import { useState } from "react";
import BookingManager from "@/components/BookingManager";
import MonthBookings from "@/components/MonthBookings";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format, addMonths, subMonths } from "date-fns";
import { sv } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

export default function ManageBookings() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  const handlePreviousMonth = () => {
    setCurrentMonth(prev => subMonths(prev, 1));
  };
  
  const handleNextMonth = () => {
    setCurrentMonth(prev => addMonths(prev, 1));
  };
  
  return (
    <div className="space-y-8">
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-2">Bokningsadministration</h2>
        <p className="text-gray-600">
          Här kan du hantera, bekräfta, avboka och exportera bokningar för gästlägenheten.
        </p>
      </div>
      
      {/* Månadsvy med kalender för bokningar */}
      <div className="mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold flex items-center">
                <Calendar className="mr-2 h-5 w-5" />
                Bokningsöversikt
              </h3>
              <div className="flex items-center space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handlePreviousMonth}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="font-medium px-2">
                  {format(currentMonth, 'MMMM yyyy', { locale: sv })}
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleNextMonth}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            <MonthBookings currentMonth={currentMonth} />
          </CardContent>
        </Card>
      </div>
      
      {/* Bokningshanterare */}
      <BookingManager />
    </div>
  );
}