import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import BookingForm from "@/components/BookingForm";
import Calendar from "@/components/Calendar";
import DocumentList from "@/components/DocumentList";
import { Section } from "@shared/schema";
import { ArrowLeft } from "lucide-react";

export default function BookingPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Fetch guest apartment section content
  const { data: section, isLoading } = useQuery<Section>({
    queryKey: ['/api/sections/gastlagenhet'],
  });
  
  return (
    <section className="max-w-4xl mx-auto px-4 pt-6 mb-8">
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost" className="mb-4 -ml-2 text-muted-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Tillbaka till startsidan
          </Button>
        </Link>
        <h1 className="text-3xl font-bold mb-2">Boka gästlägenhet</h1>
        <p className="text-muted-foreground">
          Här kan du boka föreningens gästlägenhet. Fyll i dina uppgifter och välj önskade datum nedan.
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-white rounded-lg shadow-md order-2 lg:order-1">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Bokningsformulär</h2>
            <BookingForm />
          </CardContent>
        </Card>
        
        <div className="order-1 lg:order-2">
          <Card className="bg-white rounded-lg shadow-md mb-6">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Kalender och tillgänglighet</h2>
              <Calendar 
                currentMonth={currentMonth}
                onMonthChange={(month) => setCurrentMonth(month)}
              />
            </CardContent>
          </Card>
          
          <Card className="bg-white rounded-lg shadow-md">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Dokument och information</h2>
              <DocumentList category="gastlagenhet" limit={3} />
              
              <div className="mt-4 pt-4 border-t border-border">
                <h3 className="font-medium mb-2">Mer information</h3>
                <Link href="/gastlagenhet">
                  <Button variant="outline" className="w-full">
                    Läs mer om gästlägenheten
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}