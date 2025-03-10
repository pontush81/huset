import { useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Section } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DocumentList from "@/components/DocumentList";
import { Skeleton } from "@/components/ui/skeleton";
import SectionEditor from "@/components/SectionEditor";
import FileUploader from "@/components/FileUploader";

export default function Home() {
  const params = useParams();
  const currentSlug = params.section || "ellagarden"; // Default to Ellagarden section
  const [isEditing, setIsEditing] = useState(false);
  
  // Fetch all sections
  const { data: sections, isLoading: sectionsLoading } = useQuery<Section[]>({
    queryKey: ['/api/sections'],
  });
  
  // Fetch the current section specifically
  const { data: currentSection, isLoading: sectionLoading } = useQuery<Section>({
    queryKey: ['/api/sections', currentSlug],
    enabled: !!currentSlug && currentSlug !== "ellagarden", // Only fetch if we have a slug
  });

  // If we're on the home page with no specific section, show a welcome message
  // or if we're viewing a section, display that section's content
  const displaySection = currentSection || 
                        (sections?.find(s => s.slug === currentSlug)) || 
                        sections?.[0];
  
  const isLoading = sectionsLoading || sectionLoading;

  // Determine the icon to use
  const getIconClass = () => {
    if (isLoading) return "fa-file-alt";
    return displaySection?.icon || "fa-file-alt";
  };

  if (isLoading) {
    return (
      <div className="mb-8">
        <Card className="bg-white rounded-lg shadow-md">
          <CardContent className="p-6">
            <div className="flex items-center mb-4">
              <div className="bg-gray-100 w-10 h-10 rounded-full flex items-center justify-center mr-3">
                <Skeleton className="w-6 h-6 rounded" />
              </div>
              <Skeleton className="h-8 w-64" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!displaySection) {
    return (
      <div className="mb-8">
        <Card className="bg-white rounded-lg shadow-md">
          <CardContent className="p-6 text-center py-10">
            <p>Sektionen kunde inte hittas.</p>
            <Button className="mt-4" onClick={() => window.location.href = "/"}>
              Gå till startsidan
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isEditing && displaySection) {
    return (
      <SectionEditor 
        section={displaySection} 
        onCancel={() => setIsEditing(false)} 
      />
    );
  }

  return (
    <section className="mb-8">
      <Card className="bg-white rounded-lg shadow-md">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <div className="bg-primary/10 w-10 h-10 rounded-full flex items-center justify-center mr-3">
                <i className={`fas ${getIconClass()} text-primary`}></i>
              </div>
              <h2 className="text-2xl font-semibold">{displaySection.title}</h2>
            </div>
            
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
          
          <div className="mb-6 whitespace-pre-line">
            <p>{displaySection.content}</p>
          </div>
          
          {/* Document list for this section */}
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-semibold">Dokument</h3>
              <FileUploader category={displaySection.slug} />
            </div>
            <DocumentList category={displaySection.slug} limit={5} />
          </div>
        </CardContent>
      </Card>
    </section>
  );
}
