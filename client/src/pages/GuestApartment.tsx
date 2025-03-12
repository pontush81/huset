import { useQuery } from "@tanstack/react-query";
import { Section } from "@shared/schema";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import BookingForm from "@/components/BookingForm";
import SectionEditor from "@/components/SectionEditor";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import FileUploader from "@/components/FileUploader";
import DocumentList from "@/components/DocumentList";
import MonthBookings from "@/components/MonthBookings";
import Calendar from "@/components/Calendar";

export default function GuestApartment() {
  const [isEditing, setIsEditing] = useState(false);
  const [infoItems, setInfoItems] = useState<string[]>([]);
  const [mainContent, setMainContent] = useState("");
  const [currentMonth, setCurrentMonth] = useState(new Date());
  
  // Fetch guest apartment section content
  const { data: section, isLoading } = useQuery<Section>({
    queryKey: ['/api/sections/gastlagenhet'],
  });
  
  // Parse section content to extract info box items
  useEffect(() => {
    if (section) {
      const infoBoxMatch = section.content.match(/\[INFO_BOX\]([\s\S]*?)\[\/INFO_BOX\]/);
      
      if (infoBoxMatch && infoBoxMatch[1]) {
        // Extract the info items and set them
        const items = infoBoxMatch[1].trim().split("\n");
        setInfoItems(items);
        
        // Remove the info box from the main content
        const content = section.content.replace(/\[INFO_BOX\]([\s\S]*?)\[\/INFO_BOX\]/, "").trim();
        setMainContent(content);
      } else {
        // If no info box tags found, use the full content
        setMainContent(section.content);
        // Use empty info items by default
        setInfoItems([]);
      }
    }
  }, [section]);
  
  // Hantera scrollning till bokningsformuläret om vi har en hash i URL:en
  useEffect(() => {
    // Kolla om vi har en hash som är #bookingForm
    if (window.location.hash === '#bookingForm') {
      // Hitta bokningsformuläret
      setTimeout(() => {
        const bookingForm = document.getElementById('bookingForm');
        if (bookingForm) {
          bookingForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 500); // Lite fördröjning för att säkerställa att allt har renderats
    }
  }, []);

  if (isLoading) {
    return (
      <div className="mb-8">
        <Card className="bg-white rounded-lg shadow-md">
          <CardContent className="p-6">
            <Skeleton className="h-8 w-64 mb-4" />
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
            <div className="my-6 bg-secondary p-4 rounded-lg">
              <Skeleton className="h-5 w-48 mb-3" />
              <div className="space-y-2 pl-5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-4 w-3/5" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!section) {
    return (
      <div className="mb-8">
        <Card className="bg-white rounded-lg shadow-md">
          <CardContent className="p-6 text-center py-10">
            <p>Information om gästlägenheten kunde inte hittas.</p>
            <Button className="mt-4" onClick={() => window.location.href = "/"}>
              Gå till startsidan
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <section id="gastlagenhet" className="mb-8">
      {isEditing ? (
        <SectionEditor 
          section={section} 
          onCancel={() => setIsEditing(false)} 
          isGuestApartment={true}
        />
      ) : (
        <Card className="bg-white rounded-lg shadow-md">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold">Gästlägenhet</h2>
              <Button 
                onClick={() => setIsEditing(true)}
                size="sm"
                variant="outline"
                className="flex items-center gap-2"
              >
                <i className="fas fa-edit"></i>
                Redigera
              </Button>
            </div>
            
            <div className="mb-6">
              <p className="mb-4">{mainContent}</p>
              
              {infoItems.length > 0 && (
                <div className="bg-secondary p-4 rounded-lg mb-4">
                  <h3 className="font-semibold mb-2">Information:</h3>
                  <ul className="list-disc pl-5 space-y-2">
                    {infoItems.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
              

            </div>
            
            {/* Document section */}
            <div className="mt-8 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Dokument</h3>
                <FileUploader category="gastlagenhet" />
              </div>
              <DocumentList category="gastlagenhet" limit={5} />
            </div>
            
            {/* Calendar for selecting dates and checking availability */}
            <div className="my-6">
              <h3 className="text-xl font-semibold mb-4">Kalender och tillgänglighet</h3>
              <Calendar 
                currentMonth={currentMonth}
                onMonthChange={(month) => setCurrentMonth(month)}
              />
            </div>
            
            {/* Booking form component */}
            <div id="bookingForm" className="mt-6 scroll-mt-20">
              <h3 className="text-xl font-semibold mb-4">Boka gästlägenheten</h3>
              <BookingForm />
            </div>
            
            {/* Monthly bookings display */}
            <MonthBookings 
              currentMonth={currentMonth}
            />
          </CardContent>
        </Card>
      )}
    </section>
  );
}
