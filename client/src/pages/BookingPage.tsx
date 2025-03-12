import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import BookingForm from "@/components/BookingForm";
import DocumentList from "@/components/DocumentList";
import { Section } from "@shared/schema";
import { ArrowLeft } from "lucide-react";

export default function BookingPage() {
  // Fetch guest apartment section content
  const { data: section } = useQuery<Section>({
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
          <Card className="bg-white rounded-lg shadow-md">
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">Dokument och information</h2>
              <DocumentList category="gastlagenhet" limit={3} />
              
              <div className="mt-4 pt-4 border-t border-border space-y-4">
                <h3 className="font-medium mb-2">Mer information</h3>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    // Scrolla först till toppen av sidan innan navigering
                    window.scrollTo({ top: 0, behavior: 'instant' });
                    // Använd sedan en timeout innan navigation för att säkerställa att scrollningen hinner utföras
                    setTimeout(() => {
                      window.location.href = "/gastlagenhet";
                    }, 10);
                  }}
                >
                  Läs mer om gästlägenheten
                </Button>
                
                <Button 
                  variant="outline" 
                  className="w-full mt-2"
                  onClick={() => {
                    // Scrolla först till toppen av sidan innan navigering
                    window.scrollTo({ top: 0, behavior: 'instant' });
                    // Använd sedan en timeout innan navigation för att säkerställa att scrollningen hinner utföras
                    setTimeout(() => {
                      window.location.href = "/admin/bokningar";
                    }, 10);
                  }}
                >
                  Gå till bokningsadministration
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}