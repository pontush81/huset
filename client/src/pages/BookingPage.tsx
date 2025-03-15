import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import BookingForm from "@/components/BookingForm";
import BookingManager from "@/components/BookingManager";
import DocumentList from "@/components/DocumentList";
import MonthBookings from "@/components/MonthBookings";
import { Section } from "@shared/schema";
import { ArrowLeft } from "lucide-react";

export default function BookingPage() {
  // Fetch guest apartment section content
  const { data: section } = useQuery<Section>({
    queryKey: ['/api/sections/gastlagenhet'],
  });
  
  // State för aktiv tab
  const [activeTab, setActiveTab] = useState("booking-form");
  
  // State för aktuell månad i kalendern
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Navigation
  const [location, setLocation] = useLocation();
  
  return (
    <section className="max-w-5xl mx-auto px-4 pt-6 mb-8">
      <div className="mb-6">
        <Link href="/">
          <Button variant="ghost" className="mb-4 -ml-2 text-muted-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Tillbaka till startsidan
          </Button>
        </Link>
        <h1 className="text-3xl font-bold mb-2">Gästlägenhet</h1>
        <p className="text-muted-foreground">
          Här kan du boka föreningens gästlägenhet och hantera bokningar.
        </p>
      </div>
      
      <Tabs 
        defaultValue="booking-form" 
        value={activeTab}
        onValueChange={setActiveTab}
        className="mb-6"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="booking-form" className="py-3">
            <i className="fas fa-calendar-plus mr-2"></i>
            Boka lägenhet
          </TabsTrigger>
          <TabsTrigger value="booking-manage" className="py-3">
            <i className="fas fa-calendar-check mr-2"></i>
            Hantera bokningar
          </TabsTrigger>
        </TabsList>
        
        {/* Bookningsformulär */}
        <TabsContent value="booking-form">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-white rounded-lg shadow-md">
              <CardContent className="p-6">
                <BookingForm />
              </CardContent>
            </Card>
            
            <div>
              <Card className="bg-white rounded-lg shadow-md mb-6">
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        window.scrollTo({ top: 0, behavior: 'instant' });
                        setTimeout(() => {
                          setLocation("/gastlagenhet");
                        }, 10);
                      }}
                    >
                      Läs mer om gästlägenheten
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      className="w-full"
                      onClick={() => {
                        setActiveTab("booking-manage");
                      }}
                    >
                      Visa bokningshantering
                    </Button>
                  </div>
                </CardContent>
              </Card>
              
              {/* Månadens bokningar */}
              <Card className="bg-white rounded-lg shadow-md">
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold mb-4">Månadens bokningar</h2>
                  <MonthBookings 
                    currentMonth={currentMonth}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        {/* Hantera bokningar */}
        <TabsContent value="booking-manage">
          <Card className="bg-white rounded-lg shadow-md">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Hantera bokningar</h2>
              <p className="text-muted-foreground mb-6">
                Här ser du alla bokningar och kan hantera dem. Du kan ändra status, exportera bokningar och se detaljer.
              </p>
              <BookingManager />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      <div className="mt-6 text-center">
        <Button 
          variant="ghost" 
          onClick={() => {
            window.scrollTo({ top: 0, behavior: 'instant' });
            setTimeout(() => {
              setLocation("/");
            }, 10);
          }}
        >
          <i className="fas fa-home mr-2"></i>
          Tillbaka till startsidan
        </Button>
      </div>
    </section>
  );
}