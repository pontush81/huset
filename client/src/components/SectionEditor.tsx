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
  const [title, setTitle] = useState(section.title);
  const [slug, setSlug] = useState(section.slug);
  const [icon, setIcon] = useState(section.icon || "fa-file-alt");
  
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
      // Verify that section.id exists and is valid
      if (!section || section.id === undefined || section.id === null) {
        throw new Error('Sektions-ID saknas. Vänligen ladda om sidan och försök igen.');
      }
      
      console.log("Updating section with ID:", section.id);
      return apiRequest("PATCH", `/api/sections/${section.id}`, { 
        content: combineContent(),
        title,
        slug,
        icon
      });
    },
    onSuccess: () => {
      toast({
        title: "Sektionen uppdaterad",
        description: "Sektionen har uppdaterats framgångsrikt.",
      });
      // Invalidate section queries to refresh content
      queryClient.invalidateQueries({ queryKey: ['/api/sections'] });
      // Invalidate the specific section query with the correct format
      section.slug && queryClient.invalidateQueries({ queryKey: [`/api/sections/${section.slug}`] });
      // Invalidate with new slug if changed
      if (slug !== section.slug) {
        queryClient.invalidateQueries({ queryKey: [`/api/sections/${slug}`] });
      }
      
      // Spara sektions-ID så vi kan scrolla till den efter omladdning
      const sectionId = section.slug;
      const sectionIdNumber = section.id;
      
      // Avsluta redigeringsläget
      onCancel();
      
      // Scrolla till rätt position efter att sidan har uppdaterats
      setTimeout(() => {
        // Hitta rätt element med ID (slug) för sektionen
        const element = document.getElementById(sectionId);
        
        if (element) {
          console.log("Scrolling to section:", sectionId, "with ID:", sectionIdNumber);
          
          // Lägg till en klass för att markera den aktiva sektionen
          element.classList.add('just-edited');
          
          // Scrolla med mer precis offset för att säkerställa att rätt sektion visas
          const headerOffset = 120; // Ökad offset för att undvika problem
          
          window.scrollTo({
            top: element.offsetTop - headerOffset,
            behavior: 'smooth'
          });
          
          // Ta bort markeringen efter en stund
          setTimeout(() => {
            element.classList.remove('just-edited');
          }, 3000);
        } else {
          console.error("Could not find section with ID:", sectionId);
        }
      }, 600); // Längre fördröjning för att säkerställa att DOMen har uppdaterats
    },
    onError: (error: Error) => {
      toast({
        title: "Ett fel uppstod vid uppdatering",
        description: `Det gick inte att spara sektionen: ${error.message}`,
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

  // Generate slug from title
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    
    // Only generate slug if the slug hasn't been manually edited
    if (slug === section.slug) {
      const newSlug = newTitle.toLowerCase()
        .replace(/å/g, 'a').replace(/ä/g, 'a').replace(/ö/g, 'o')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
      setSlug(newSlug);
    }
  };
  
  return (
    <Card className="bg-white rounded-lg shadow-md mb-4">
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-4">Redigera sektion</h2>
        
        <Tabs defaultValue="content" className="mb-4">
          <TabsList className="w-full flex overflow-x-auto md:w-auto space-x-1">
            <TabsTrigger value="content" className="mobile-touch-target flex-1 text-center">
              <i className="fas fa-file-alt mr-2 hidden sm:inline"></i>
              <span>Innehåll</span>
            </TabsTrigger>
            <TabsTrigger value="metadata" className="mobile-touch-target flex-1 text-center">
              <i className="fas fa-cog mr-2 hidden sm:inline"></i>
              <span>Sektionsinfo</span>
            </TabsTrigger>
            <TabsTrigger value="markup" className="mobile-touch-target flex-1 text-center">
              <i className="fas fa-code mr-2 hidden sm:inline"></i>
              <span>Markup</span>
            </TabsTrigger>
            {isGuestApartment && (
              <TabsTrigger value="info" className="mobile-touch-target flex-1 text-center">
                <i className="fas fa-info-circle mr-2 hidden sm:inline"></i>
                <span>Informationsruta</span>
              </TabsTrigger>
            )}
          </TabsList>
          
          {/* Content Tab */}
          <TabsContent value="content">
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={10}
              className="w-full mb-4 min-h-[150px] md:min-h-[200px]"
              placeholder="Skriv innehållet här..."
            />
          </TabsContent>
          
          {/* Metadata Tab */}
          <TabsContent value="metadata">
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium">Titel</Label>
                <Input 
                  id="title" 
                  value={title} 
                  onChange={handleTitleChange}
                  placeholder="T.ex. Regler för tvättstugan"
                  className="mobile-touch-target"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="slug" className="text-sm font-medium">URL-namn</Label>
                <Input 
                  id="slug" 
                  value={slug} 
                  onChange={(e) => setSlug(e.target.value)}
                  placeholder="t-ex-regler-for-tvattstugan"
                  className="mobile-touch-target"
                />
                <p className="text-xs text-gray-500">URL-namnet genereras automatiskt från titeln men kan redigeras manuellt</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="icon" className="text-sm font-medium">Ikon (Font Awesome-kod)</Label>
                <Input 
                  id="icon" 
                  value={icon} 
                  onChange={(e) => setIcon(e.target.value)}
                  placeholder="fa-file-alt"
                  className="mobile-touch-target"
                />
                <div className="flex flex-wrap gap-2 mt-2">
                  {["fa-home", "fa-car", "fa-building", "fa-file-alt", "fa-book"].map(iconOption => (
                    <Button 
                      key={iconOption}
                      type="button" 
                      variant="outline" 
                      size="sm"
                      className="text-xs p-2"
                      onClick={() => setIcon(iconOption)}
                    >
                      <i className={`fas ${iconOption} mr-1`}></i>
                      {iconOption}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Välj en ikon ovan eller skriv in en Font Awesome-ikon kod
                </p>
              </div>
            </div>
          </TabsContent>
          
          {/* Markup Helper Tab */}
          <TabsContent value="markup">
            <div className="space-y-5 py-2">
              <h3 className="text-md font-semibold">Formatering av text</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-md p-3 space-y-2">
                  <h4 className="text-sm font-medium">Textformatering</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <code className="bg-gray-100 px-1 rounded">**fet text**</code>
                      <span>→</span>
                      <span className="font-bold">fet text</span>
                    </div>
                    <div className="flex justify-between">
                      <code className="bg-gray-100 px-1 rounded">*kursiv text*</code>
                      <span>→</span>
                      <span className="italic">kursiv text</span>
                    </div>
                    <div className="flex justify-between">
                      <code className="bg-gray-100 px-1 rounded">~~genomstruken~~</code>
                      <span>→</span>
                      <span className="line-through">genomstruken</span>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs"
                    onClick={() => {
                      const text = "Detta är **fet text**, *kursiv text* och ~~genomstruken text~~.";
                      setContent(content + "\n\n" + text);
                      toast({
                        title: "Text tillagd",
                        description: "Exempel på textformatering har lagts till i innehållet.",
                      });
                    }}
                  >
                    <i className="fas fa-plus-circle mr-1"></i> Lägg till exempel
                  </Button>
                </div>
                
                <div className="border rounded-md p-3 space-y-2">
                  <h4 className="text-sm font-medium">Listor</h4>
                  <div className="space-y-1 text-sm">
                    <div>
                      <div>
                        <code className="bg-gray-100 px-1 rounded">- Punkt ett</code>
                      </div>
                      <div>
                        <code className="bg-gray-100 px-1 rounded">- Punkt två</code>
                      </div>
                    </div>
                    <div>
                      <div>
                        <code className="bg-gray-100 px-1 rounded">1. Första</code>
                      </div>
                      <div>
                        <code className="bg-gray-100 px-1 rounded">2. Andra</code>
                      </div>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs"
                    onClick={() => {
                      const text = "- Punkt ett\n- Punkt två\n- Punkt tre\n\n1. Första punkten\n2. Andra punkten\n3. Tredje punkten";
                      setContent(content + "\n\n" + text);
                      toast({
                        title: "Text tillagd",
                        description: "Exempel på listor har lagts till i innehållet.",
                      });
                    }}
                  >
                    <i className="fas fa-plus-circle mr-1"></i> Lägg till exempel
                  </Button>
                </div>
                
                <div className="border rounded-md p-3 space-y-2">
                  <h4 className="text-sm font-medium">Rubriker</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <code className="bg-gray-100 px-1 rounded"># Stor rubrik</code>
                      <span>→</span>
                      <span className="font-bold text-lg">Stor rubrik</span>
                    </div>
                    <div className="flex justify-between">
                      <code className="bg-gray-100 px-1 rounded">## Mellanstor</code>
                      <span>→</span>
                      <span className="font-bold text-base">Mellanstor</span>
                    </div>
                    <div className="flex justify-between">
                      <code className="bg-gray-100 px-1 rounded">### Liten</code>
                      <span>→</span>
                      <span className="font-bold text-sm">Liten</span>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs"
                    onClick={() => {
                      const text = "# Stor rubrik\n\nText under den stora rubriken.\n\n## Mellanstor rubrik\n\nMer text under den mellanstora rubriken.\n\n### Liten rubrik\n\nYtterligare text under den lilla rubriken.";
                      setContent(content + "\n\n" + text);
                      toast({
                        title: "Text tillagd",
                        description: "Exempel på rubriker har lagts till i innehållet.",
                      });
                    }}
                  >
                    <i className="fas fa-plus-circle mr-1"></i> Lägg till exempel
                  </Button>
                </div>
                
                <div className="border rounded-md p-3 space-y-2">
                  <h4 className="text-sm font-medium">Länkar och bilder</h4>
                  <div className="space-y-1 text-sm">
                    <div>
                      <code className="bg-gray-100 px-1 rounded">[text](https://example.com)</code>
                      <div className="text-xs text-gray-500">Länk till en webbsida</div>
                    </div>
                    <div>
                      <code className="bg-gray-100 px-1 rounded">![alt text](https://example.com/bild.jpg)</code>
                      <div className="text-xs text-gray-500">Bild (används sällan, ladda istället upp dokumentet)</div>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs"
                    onClick={() => {
                      const text = "Här är en [länk till vår förenings hemsida](https://exempel.se).";
                      setContent(content + "\n\n" + text);
                      toast({
                        title: "Text tillagd",
                        description: "Exempel på länkar har lagts till i innehållet.",
                      });
                    }}
                  >
                    <i className="fas fa-plus-circle mr-1"></i> Lägg till exempel
                  </Button>
                </div>
              </div>
              
              <div className="border rounded-md p-3 space-y-2">
                <h4 className="text-sm font-medium">Specialformat för innehåll</h4>
                <div className="space-y-1 text-sm">
                  <div>
                    <code className="bg-gray-100 px-1 rounded">[INFO_BOX] Information i ruta [/INFO_BOX]</code>
                    <div className="text-xs text-gray-500">Skapar en informationsruta (används främst för gästlägenhet)</div>
                  </div>
                  <div>
                    <code className="bg-gray-100 px-1 rounded">[HIGHLIGHT] Viktig information [/HIGHLIGHT]</code>
                    <div className="text-xs text-gray-500">Framhäver information med färgad bakgrund</div>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs"
                  onClick={() => {
                    const text = "[HIGHLIGHT]Detta är viktig information som ska framhävas.[/HIGHLIGHT]";
                    setContent(content + "\n\n" + text);
                    toast({
                      title: "Text tillagd",
                      description: "Exempel på framhävd text har lagts till i innehållet.",
                    });
                  }}
                >
                  <i className="fas fa-plus-circle mr-1"></i> Lägg till exempel
                </Button>
              </div>
            </div>
          </TabsContent>
          
          {/* Info Box Tab (Only for Guest Apartment) */}
          {isGuestApartment && (
            <TabsContent value="info">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-md font-medium">Informationsrutor</h3>
                  <Button 
                    onClick={addInfoItem}
                    size="sm"
                    type="button"
                    className="mobile-touch-target"
                  >
                    <i className="fas fa-plus mr-1"></i>
                    <span className="hidden sm:inline mr-1">Lägg till rad</span>
                    <span className="sm:hidden">Lägg till</span>
                  </Button>
                </div>
                
                {info.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={item}
                      onChange={(e) => handleInfoChange(index, e.target.value)}
                      className="flex-1 mobile-touch-target"
                    />
                    <Button 
                      onClick={() => removeInfoItem(index)}
                      size="sm"
                      variant="destructive"
                      type="button"
                      className="mobile-touch-target"
                      aria-label="Ta bort"
                    >
                      <i className="fas fa-trash"></i>
                    </Button>
                  </div>
                ))}
                
                {info.length === 0 && (
                  <p className="text-gray-500 italic text-sm">
                    Inga informationsrutor. Klicka på "Lägg till" för att lägga till information.
                  </p>
                )}
              </div>
            </TabsContent>
          )}
        </Tabs>
        
        <div className="flex flex-col sm:flex-row gap-3 sm:space-x-3">
          <Button 
            onClick={handleSave}
            className="bg-primary hover:bg-primary/90 text-white mobile-touch-target order-1 sm:order-1 w-full sm:w-auto"
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? (
              <>
                <i className="fas fa-spinner fa-spin mr-2"></i>
                <span>Sparar...</span>
              </>
            ) : (
              <>
                <i className="fas fa-save mr-2"></i>
                <span>Spara ändringar</span>
              </>
            )}
          </Button>
          
          <Button 
            variant="outline"
            onClick={onCancel}
            disabled={updateMutation.isPending}
            className="mobile-touch-target order-2 sm:order-2 w-full sm:w-auto"
          >
            <i className="fas fa-times mr-2"></i>
            <span>Avbryt</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}