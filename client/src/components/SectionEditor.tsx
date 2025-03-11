import { useState, useEffect } from "react";
import { Section } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SectionEditorProps {
  section: Section;
  onCancel: () => void;
  isGuestApartment?: boolean;
}

export default function SectionEditor({ section, onCancel, isGuestApartment = false }: SectionEditorProps) {
  const { toast } = useToast();
  const [content, setContent] = useState(section.content);
  
  // For the guest apartment page, we need to handle additional info
  const [info, setInfo] = useState<string[]>(isGuestApartment ? [
    "Pris: 300 kr per natt",
    "Max 7 dagar per bokning",
    "Bokas tidigast 3 månader i förväg",
    "Incheckning: 15:00, utcheckning: 11:00",
    "Städning ingår inte, lägenheten ska lämnas i samma skick som vid ankomst"
  ] : []);
  
  // Combine all content into HTML for saving
  const combineContent = () => {
    let finalContent = content;
    
    // If we're editing the guest apartment page, add the info box details to the content
    if (isGuestApartment && info.length > 0) {
      // Create a special tag or formatting that we can parse on display
      finalContent += "\n\n[INFO_BOX]\n" + info.join("\n") + "\n[/INFO_BOX]";
    }
    
    return finalContent;
  };
  
  // Parse content on load to separate info box if it exists
  const parseContent = (rawContent: string) => {
    if (isGuestApartment) {
      const infoBoxMatch = rawContent.match(/\[INFO_BOX\]([\s\S]*?)\[\/INFO_BOX\]/);
      if (infoBoxMatch && infoBoxMatch[1]) {
        // Extract the info items and set them
        const infoItems = infoBoxMatch[1].trim().split("\n");
        setInfo(infoItems);
        
        // Remove the info box from the main content
        const mainContent = rawContent.replace(/\[INFO_BOX\]([\s\S]*?)\[\/INFO_BOX\]/, "").trim();
        setContent(mainContent);
        return;
      }
    }
    
    // If no info box was found or we're not on the guest apartment page
    setContent(rawContent);
  };
  
  // Initialize the component
  useEffect(() => {
    parseContent(section.content);
  }, [section.content]);
  
  // Update section mutation
  const updateMutation = useMutation({
    mutationFn: () => {
      // Section ID is always a number from the database
      const sectionId = section.id;
      
      console.log("Updating section with ID:", sectionId);
      return apiRequest("PATCH", `/api/sections/${sectionId}`, { content: combineContent() });
    },
    onSuccess: () => {
      toast({
        title: "Innehållet uppdaterat",
        description: "Sektionen har uppdaterats framgångsrikt.",
      });
      // Invalidate section queries to refresh content
      queryClient.invalidateQueries({ queryKey: ['/api/sections'] });
      queryClient.invalidateQueries({ queryKey: [`/api/sections/${section.slug}`] });
      onCancel();
    },
    onError: (error: Error) => {
      toast({
        title: "Ett fel uppstod vid uppdatering",
        description: `Det gick inte att spara innehållet: ${error.message}`,
        variant: "destructive",
      });
      console.error("Error updating section:", error);
      console.log("Section being updated:", JSON.stringify(section));
    },
  });

  const handleSave = () => {
    updateMutation.mutate();
  };
  
  // Handle changing an info item
  const handleInfoChange = (index: number, value: string) => {
    const newInfo = [...info];
    newInfo[index] = value;
    setInfo(newInfo);
  };
  
  // Add a new info item
  const addInfoItem = () => {
    setInfo([...info, "Ny information"]);
  };
  
  // Remove an info item
  const removeInfoItem = (index: number) => {
    const newInfo = [...info];
    newInfo.splice(index, 1);
    setInfo(newInfo);
  };

  return (
    <Card className="bg-white rounded-lg shadow-md mb-4">
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-4">Redigera innehåll</h2>
        
        {isGuestApartment ? (
          <Tabs defaultValue="content" className="mb-4">
            <TabsList>
              <TabsTrigger value="content">Huvudinnehåll</TabsTrigger>
              <TabsTrigger value="info">Informationsruta</TabsTrigger>
            </TabsList>
            <TabsContent value="content">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={10}
                className="w-full mb-4"
                placeholder="Skriv innehållet här..."
              />
            </TabsContent>
            <TabsContent value="info">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-md font-medium">Informationsrutor</h3>
                  <Button 
                    onClick={addInfoItem}
                    size="sm"
                    type="button"
                  >
                    <i className="fas fa-plus mr-2"></i>
                    Lägg till rad
                  </Button>
                </div>
                
                {info.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={item}
                      onChange={(e) => handleInfoChange(index, e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      onClick={() => removeInfoItem(index)}
                      size="sm"
                      variant="destructive"
                      type="button"
                    >
                      <i className="fas fa-trash"></i>
                    </Button>
                  </div>
                ))}
                
                {info.length === 0 && (
                  <p className="text-gray-500 italic">
                    Inga informationsrutor. Klicka på "Lägg till rad" för att lägga till information.
                  </p>
                )}
              </div>
            </TabsContent>
          </Tabs>
        ) : (
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
            className="w-full mb-4"
            placeholder="Skriv innehållet här..."
          />
        )}
        
        <div className="flex space-x-3">
          <Button 
            onClick={handleSave}
            className="bg-primary hover:bg-primary/90 text-white"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? "Sparar..." : "Spara ändringar"}
          </Button>
          
          <Button 
            variant="outline"
            onClick={onCancel}
            disabled={updateMutation.isPending}
          >
            Avbryt
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}