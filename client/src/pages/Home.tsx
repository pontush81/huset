import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Section } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import DocumentList from "@/components/DocumentList";
import { Skeleton } from "@/components/ui/skeleton";
import SectionEditor from "@/components/SectionEditor";
import FileUploader from "@/components/FileUploader";

export default function Home() {
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  
  // Fetch all sections
  const { data: sections, isLoading } = useQuery<Section[]>({
    queryKey: ['/api/sections'],
  });
  
  // Handle scrolling to section based on URL hash
  useEffect(() => {
    // Wait for sections to load and the page to render
    if (!isLoading && sections && sections.length > 0) {
      // Get slug from URL hash
      const hash = window.location.hash;
      if (hash) {
        const slug = hash.substring(1); // Remove '#' from the hash
        
        // Find element with this ID
        setTimeout(() => {
          const element = document.getElementById(slug);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 300); // Small delay to ensure elements are rendered
      }
    }
  }, [isLoading, sections]);

  // Helper to get icon class for a section
  const getIconClass = (section?: Section) => {
    if (!section) return "fa-file-alt";
    return section.icon || "fa-file-alt";
  };

  // Filtered section that aren't special pages (include all sections except footer)
  const filteredSections = sections?.filter(
    section => section.slug !== "footer" && section.slug !== ""
  ).sort((a, b) => a.id - b.id) || [];

  if (isLoading) {
    return (
      <div className="space-y-8">
        {[1, 2, 3].map(index => (
          <Card key={index} className="bg-white rounded-lg shadow-md">
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
        ))}
      </div>
    );
  }

  if (editingSection) {
    return (
      <SectionEditor 
        section={editingSection} 
        onCancel={() => setEditingSection(null)} 
      />
    );
  }

  // Render a single section
  const renderSection = (section: Section) => {
    // Special handling for guest apartment section
    if (section.slug === "gastlagenhet") {
      return (
        <section key={section.id} id={section.slug} className="mb-8 scroll-mt-20">
          <Card className="bg-white rounded-lg shadow-md">
            <CardContent className="p-6">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center">
                  <div className="bg-primary/10 w-10 h-10 rounded-full flex items-center justify-center mr-3">
                    <i className={`fas ${getIconClass(section)} text-primary`}></i>
                  </div>
                  <h2 className="text-2xl font-semibold">{section.title}</h2>
                </div>
                
                <Button 
                  onClick={() => setEditingSection(section)}
                  size="sm"
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <i className="fas fa-edit"></i>
                  Redigera
                </Button>
              </div>
              
              <div className="mb-6 whitespace-pre-line">
                <p>{section.content}</p>
              </div>
              
              {/* Document list for this section */}
              <div className="mt-8 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-xl font-semibold">Dokument</h3>
                  <FileUploader category={section.slug} />
                </div>
                <DocumentList category={section.slug} limit={5} />
              </div>
              
              {/* Special booking form for guest apartment */}
              <div className="border-t pt-6">
                <h3 className="text-xl font-semibold mb-4">Boka gästlägenheten</h3>
                <Link href="/gastlagenhet/boka">
                  <Button 
                    className="w-full justify-center py-6 text-lg"
                  >
                    Gå till bokningsformuläret
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>
      );
    }
    
    // Standard section rendering
    return (
      <section key={section.id} id={section.slug} className="mb-8 scroll-mt-20">
        <Card className="bg-white rounded-lg shadow-md">
          <CardContent className="p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center">
                <div className="bg-primary/10 w-10 h-10 rounded-full flex items-center justify-center mr-3">
                  <i className={`fas ${getIconClass(section)} text-primary`}></i>
                </div>
                <h2 className="text-2xl font-semibold">{section.title}</h2>
              </div>
              
              <Button 
                onClick={() => setEditingSection(section)}
                size="sm"
                variant="outline"
                className="flex items-center gap-2"
              >
                <i className="fas fa-edit"></i>
                Redigera
              </Button>
            </div>
            
            <div className="mb-6 whitespace-pre-line">
              <p>{section.content}</p>
            </div>
            
            {/* Document list for this section */}
            <div className="mt-8">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold">Dokument</h3>
                <FileUploader category={section.slug} />
              </div>
              <DocumentList category={section.slug} limit={5} />
            </div>
          </CardContent>
        </Card>
      </section>
    );
  };

  return (
    <div className="space-y-8">
      {filteredSections.map(section => renderSection(section))}
    </div>
  );
}
