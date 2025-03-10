import { useQuery } from "@tanstack/react-query";
import { Section } from "@shared/schema";
import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import BookingForm from "@/components/BookingForm";
import SectionEditor from "@/components/SectionEditor";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function GuestApartment() {
  const [isEditing, setIsEditing] = useState(false);
  const [infoItems, setInfoItems] = useState<string[]>([]);
  const [mainContent, setMainContent] = useState("");
  
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
        // Default info items if needed
        setInfoItems([
          "Pris: 300 kr per natt",
          "Max 7 dagar per bokning",
          "Bokas tidigast 3 månader i förväg",
          "Incheckning: 15:00, utcheckning: 11:00",
          "Städning ingår inte, lägenheten ska lämnas i samma skick som vid ankomst"
        ]);
      }
    }
  }, [section]);

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
              
              <div className="flex flex-wrap gap-3 mb-6">
                <a href="/api/documents/1/file" target="_blank" rel="noopener noreferrer" className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded flex items-center">
                  <i className="fas fa-download mr-2"></i>
                  <span>Regler (PDF)</span>
                </a>
                <Button variant="default" className="bg-primary hover:bg-primary/90 text-white">
                  <i className="fas fa-images mr-2"></i>
                  <span>Bildgalleri</span>
                </Button>
              </div>
            </div>
            
            {/* Booking form component */}
            <BookingForm />
          </CardContent>
        </Card>
      )}
    </section>
  );
}
