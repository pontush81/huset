import { useQuery } from "@tanstack/react-query";
import { Section } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import BookingForm from "@/components/BookingForm";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function GuestApartment() {
  // Fetch guest apartment section content
  const { data: section, isLoading } = useQuery<Section>({
    queryKey: ['/api/sections/gastlagenhet'],
  });

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
      <Card className="bg-white rounded-lg shadow-md">
        <CardContent className="p-6">
          <h2 className="text-2xl font-semibold mb-4">Gästlägenhet</h2>
          
          <div className="mb-6">
            <p className="mb-4">{section.content}</p>
            
            <div className="bg-secondary p-4 rounded-lg mb-4">
              <h3 className="font-semibold mb-2">Information:</h3>
              <ul className="list-disc pl-5 space-y-2">
                <li>Pris: 300 kr per natt</li>
                <li>Max 7 dagar per bokning</li>
                <li>Bokas tidigast 3 månader i förväg</li>
                <li>Incheckning: 15:00, utcheckning: 11:00</li>
                <li>Städning ingår inte, lägenheten ska lämnas i samma skick som vid ankomst</li>
              </ul>
            </div>
            
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
    </section>
  );
}
