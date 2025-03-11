import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Section, Document } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import SectionEditor from "@/components/SectionEditor";
import FooterEditor from "@/components/FooterEditor";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import FileUploader from "@/components/FileUploader";
import { Trash2, Edit, FileText, ExternalLink, Plus, FileUp, Calendar, LayoutDashboard } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function AdminDashboard() {
  const [currentTab, setCurrentTab] = useState<string>("sections");
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openNewSectionDialog, setOpenNewSectionDialog] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [newSection, setNewSection] = useState({
    title: "",
    slug: "",
    icon: "fa-file-alt",
    content: "Nytt innehåll"
  });
  const { toast } = useToast();
  
  // Fetch all sections
  const { data: sections, isLoading: loadingSections } = useQuery<Section[]>({
    queryKey: ['/api/sections'],
  });
  
  // Fetch all documents
  const { data: documents, isLoading: loadingDocuments } = useQuery<Document[]>({
    queryKey: ['/api/documents'],
  });
  
  // Handle document deletion
  const handleDeleteDocument = async (id: number) => {
    if (confirm("Är du säker på att du vill radera detta dokument?")) {
      try {
        await apiRequest("DELETE", `/api/documents/${id}`);
        queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
        toast({
          title: "Dokument raderat",
          description: "Dokumentet har raderats framgångsrikt",
        });
      } catch (error) {
        console.error("Error deleting document:", error);
        toast({
          title: "Fel vid radering",
          description: "Det gick inte att radera dokumentet",
          variant: "destructive",
        });
      }
    }
  };
  
  // Calculate section and document statistics
  const stats = {
    totalSections: sections?.length || 0,
    totalDocuments: documents?.length || 0,
    categoriesByDocuments: documents ? Array.from(new Set(documents.map(doc => doc.category))).length : 0,
  };
  
  // Group documents by category for better display
  const documentsByCategory = documents ? documents.reduce((acc, doc) => {
    if (!acc[doc.category]) {
      acc[doc.category] = [];
    }
    acc[doc.category].push(doc);
    return acc;
  }, {} as Record<string, Document[]>) : {};
  
  // Handle category selection
  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setOpenUploadDialog(true);
  };
  
  // Create section mutation
  const createSectionMutation = useMutation({
    mutationFn: async (sectionData: typeof newSection) => {
      return apiRequest("POST", "/api/sections", sectionData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sections'] });
      setOpenNewSectionDialog(false);
      setNewSection({
        title: "",
        slug: "",
        icon: "fa-file-alt",
        content: "Nytt innehåll"
      });
      toast({
        title: "Sektion skapad",
        description: "Sektionen har skapats framgångsrikt",
      });
    },
    onError: (error: Error) => {
      console.error("Error creating section:", error);
      toast({
        title: "Fel vid skapande",
        description: `Det gick inte att skapa sektionen: ${error.message}`,
        variant: "destructive",
      });
    }
  });
  
  // Delete section mutation
  const deleteSectionMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/sections/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sections'] });
      toast({
        title: "Sektion raderad",
        description: "Sektionen har raderats framgångsrikt",
      });
    },
    onError: (error: any) => {
      console.error("Error deleting section:", error);
      let errorMessage = "Det gick inte att radera sektionen";
      if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      toast({
        title: "Fel vid radering",
        description: errorMessage,
        variant: "destructive",
      });
    }
  });
  
  // Handle section deletion
  const handleDeleteSection = async (section: Section) => {
    // Kontrollera om det är en väsentlig sektion som inte får raderas
    const essentialSlugs = ['gastlagenhet', 'ellagarden', 'styrelse'];
    if (essentialSlugs.includes(section.slug)) {
      toast({
        title: "Kan inte radera",
        description: "Denna sektion är väsentlig för handboken och kan inte raderas",
        variant: "destructive",
      });
      return;
    }
    
    if (confirm(`Är du säker på att du vill radera sektionen "${section.title}"?\nDenna åtgärd kan inte ångras.`)) {
      deleteSectionMutation.mutate(section.id);
    }
  };
  
  // Handle slug generation from title
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const title = e.target.value;
    setNewSection(prev => ({
      ...prev,
      title,
      slug: title.toLowerCase()
        .replace(/å/g, 'a').replace(/ä/g, 'a').replace(/ö/g, 'o')
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
    }));
  };
  
  // Handle form submission
  const handleCreateSection = () => {
    if (!newSection.title || !newSection.slug) {
      toast({
        title: "Fält saknas",
        description: "Titel och URL-namn måste fyllas i",
        variant: "destructive",
      });
      return;
    }
    
    createSectionMutation.mutate(newSection);
  };
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Administratörsdashboard</h1>
      
      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="bg-primary/10 w-14 h-14 rounded-full flex items-center justify-center mb-4">
              <LayoutDashboard className="h-8 w-8 text-primary" />
            </div>
            <p className="text-4xl font-bold mb-2">{stats.totalSections}</p>
            <p className="text-sm text-gray-500">Totalt antal sektioner</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="bg-primary/10 w-14 h-14 rounded-full flex items-center justify-center mb-4">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <p className="text-4xl font-bold mb-2">{stats.totalDocuments}</p>
            <p className="text-sm text-gray-500">Totalt antal dokument</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <div className="bg-primary/10 w-14 h-14 rounded-full flex items-center justify-center mb-4">
              <Calendar className="h-8 w-8 text-primary" />
            </div>
            <p className="text-4xl font-bold mb-2">{stats.categoriesByDocuments}</p>
            <p className="text-sm text-gray-500">Dokumentkategorier</p>
          </CardContent>
        </Card>
      </div>
      
      {/* Main Content */}
      <Tabs 
        defaultValue="sections" 
        value={currentTab}
        onValueChange={setCurrentTab}
        className="space-y-4"
      >
        <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto overflow-x-auto">
          <TabsTrigger value="sections" className="mobile-touch-target">
            <i className="fas fa-file-alt mr-2 hidden sm:inline"></i>
            <span>Sektioner</span>
          </TabsTrigger>
          <TabsTrigger value="documents" className="mobile-touch-target">
            <i className="fas fa-folder mr-2 hidden sm:inline"></i>
            <span>Dokument</span>
          </TabsTrigger>
          <TabsTrigger value="administration" className="mobile-touch-target">
            <i className="fas fa-cog mr-2 hidden sm:inline"></i>
            <span>Administration</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Sections Tab */}
        <TabsContent value="sections" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <CardTitle>Hantera Sektioner</CardTitle>
                  <CardDescription>
                    Redigera innehåll i de olika sektionerna av handboken.
                  </CardDescription>
                </div>
                
                <Button
                  onClick={() => setOpenNewSectionDialog(true)}
                  className="bg-primary text-white mobile-touch-target"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Lägg till sektion
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingSections ? (
                <div className="flex justify-center items-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
                </div>
              ) : (
                <div className="space-y-4">
                  {sections?.filter(section => section.slug !== 'footer').map(section => (
                    <div 
                      key={section.id} 
                      className="border rounded-lg p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center hover:bg-gray-50 transition-colors gap-4"
                    >
                      <div>
                        <div className="flex items-center">
                          <div className="bg-primary/10 w-10 h-10 rounded-full flex items-center justify-center mr-3">
                            <i className={`fas ${section.icon || 'fa-file-alt'} text-primary`}></i>
                          </div>
                          <div>
                            <h3 className="text-lg font-medium">{section.title}</h3>
                            <p className="text-sm text-gray-500">
                              Senast uppdaterad: {new Date(section.updatedAt).toLocaleDateString('sv-SE')}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 w-full sm:w-auto justify-start sm:justify-end mt-2 sm:mt-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setEditingSection(section);
                            setOpenDialog(true);
                          }}
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Redigera
                        </Button>
                        {/* Visa inte Ta bort-knappen för väsentliga sektioner */}
                        {!['gastlagenhet', 'ellagarden', 'styrelse'].includes(section.slug) && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteSection(section)}
                            disabled={deleteSectionMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {deleteSectionMutation.isPending ? 'Raderar...' : 'Radera'}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Documents Tab */}
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div>
                  <CardTitle>Hantera Dokument</CardTitle>
                  <CardDescription>
                    Ladda upp och hantera dokument för de olika sektionerna.
                  </CardDescription>
                </div>
                
                <Dialog>
                  <Button
                    onClick={() => {
                      const category = prompt("Ange kategorin för dokumentet:", "Allmänt");
                      if (category && category.trim() !== "") {
                        // Öppna FileUploader med angiven kategori
                        handleCategorySelect(category);
                      }
                    }}
                    className="bg-primary text-white mobile-touch-target"
                    size="sm"
                  >
                    <FileUp className="h-4 w-4 mr-2" />
                    Ladda upp
                  </Button>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {loadingDocuments ? (
                <div className="flex justify-center items-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
                </div>
              ) : documents && documents.length > 0 ? (
                <div className="space-y-6">
                  {Object.entries(documentsByCategory).map(([category, docs]) => (
                    <div key={category} className="space-y-3">
                      <div className="flex items-center">
                        <h3 className="text-lg font-medium">{category}</h3>
                        <Badge variant="outline" className="ml-2">
                          {docs.length} dokument
                        </Badge>
                      </div>
                      <Separator />
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {docs.map(doc => (
                          <Card key={doc.id} className="overflow-hidden border border-gray-200">
                            <CardContent className="p-4">
                              <div className="flex items-start mb-3">
                                <div className="bg-primary/10 p-2 rounded mr-3 flex-shrink-0">
                                  <FileText className="h-5 w-5 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium truncate">{doc.title}</h4>
                                  {doc.description && (
                                    <p className="text-sm text-gray-500 line-clamp-2">{doc.description}</p>
                                  )}
                                  <p className="text-xs text-gray-400 mt-1">
                                    {new Date(doc.uploadedAt).toLocaleDateString('sv-SE')}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  asChild
                                >
                                  <a 
                                    href={`/api/documents/${doc.id}/file`} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                  >
                                    <ExternalLink className="h-4 w-4 mr-1" />
                                    Visa
                                  </a>
                                </Button>
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  onClick={() => handleDeleteDocument(doc.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertTitle>Inga dokument</AlertTitle>
                  <AlertDescription>
                    Det finns inga dokument uppladdade ännu. Använd "Ladda upp" knappen för att lägga till dokument.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Administration Tab */}
        <TabsContent value="administration" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Sidfotsinställningar</CardTitle>
                  <CardDescription>
                    Anpassa information som visas i sidfoten på alla sidor.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingSections ? (
                <div className="flex justify-center items-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary"></div>
                </div>
              ) : (
                <>
                  {(() => {
                    const footerSection = sections?.find(s => s.slug === 'footer');
                    if (!footerSection) {
                      return (
                        <Alert>
                          <AlertTitle>Kunde inte hitta sidfot</AlertTitle>
                          <AlertDescription>
                            Sidfotsinställningar kunde inte hittas. Kontakta systemadministratören.
                          </AlertDescription>
                        </Alert>
                      );
                    }
                    
                    let footerData;
                    try {
                      footerData = footerSection.content ? JSON.parse(footerSection.content) : null;
                    } catch (e) {
                      console.error("Error parsing footer content:", e);
                      footerData = null;
                    }
                    
                    return (
                      <div className="space-y-6">
                        <div className="border rounded-lg p-6">
                          <h3 className="text-lg font-medium mb-4">Sidfotsinformation</h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                            <div>
                              <p className="text-sm font-medium text-gray-500">Adress</p>
                              <p className="font-medium">{footerData?.address || '-'}</p>
                            </div>
                            
                            <div>
                              <p className="text-sm font-medium text-gray-500">E-postadress</p>
                              <p className="font-medium">{footerData?.email || '-'}</p>
                            </div>
                            
                            <div>
                              <p className="text-sm font-medium text-gray-500">Telefonnummer</p>
                              <p className="font-medium">{footerData?.phone || '-'}</p>
                            </div>
                            
                            <div>
                              <p className="text-sm font-medium text-gray-500">Copyright</p>
                              <p className="font-medium">{footerData?.copyright || '-'}</p>
                            </div>
                          </div>
                          
                          <div className="flex justify-end">
                            <Button
                              variant="outline"
                              onClick={() => {
                                setEditingSection(footerSection);
                                setOpenDialog(true);
                              }}
                            >
                              <Edit className="h-4 w-4 mr-2" />
                              Redigera sidfot
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Edit Section Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Redigera Sektion: {editingSection?.title}</DialogTitle>
            <DialogDescription>
              {editingSection?.slug === 'footer' 
                ? 'Redigera information som visas i sidfoten på alla sidor.'
                : 'Gör ändringar i innehållet för denna sektion.'}
            </DialogDescription>
          </DialogHeader>
          
          {editingSection && (
            editingSection.slug === 'footer' ? (
              <FooterEditor 
                section={editingSection} 
                onCancel={() => setOpenDialog(false)}
              />
            ) : (
              <SectionEditor 
                section={editingSection} 
                onCancel={() => setOpenDialog(false)}
                isGuestApartment={editingSection.slug === 'gastlagenhet'}
              />
            )
          )}
        </DialogContent>
      </Dialog>
      
      {/* Upload Dialog */}
      {openUploadDialog && selectedCategory && (
        <Dialog open={openUploadDialog} onOpenChange={setOpenUploadDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Ladda upp dokument</DialogTitle>
              <DialogDescription>
                Välj en fil att ladda upp i kategorin "{selectedCategory}".
              </DialogDescription>
            </DialogHeader>
            <div className="pt-4">
              <FileUploader 
                category={selectedCategory} 
                autoOpen={true} 
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
      
      {/* Create New Section Dialog */}
      <Dialog open={openNewSectionDialog} onOpenChange={setOpenNewSectionDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Skapa ny sektion</DialogTitle>
            <DialogDescription>
              Fyll i information för att skapa en ny sektion i handboken.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titel</Label>
              <Input 
                id="title" 
                value={newSection.title} 
                onChange={handleTitleChange}
                placeholder="T.ex. Regler för tvättstugan"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="slug">URL-namn</Label>
              <Input 
                id="slug" 
                value={newSection.slug} 
                onChange={(e) => setNewSection({...newSection, slug: e.target.value})}
                placeholder="t-ex-regler-for-tvattstugan"
                disabled={!!newSection.title}
              />
              <p className="text-xs text-gray-500">URL-namnet genereras automatiskt från titeln</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="icon">Ikon (Font Awesome-kod)</Label>
              <Input 
                id="icon" 
                value={newSection.icon} 
                onChange={(e) => setNewSection({...newSection, icon: e.target.value})}
                placeholder="fa-file-alt"
              />
              <p className="text-xs text-gray-500">
                Använd Font Awesome-ikon kod, t.ex. fa-home, fa-car, fa-building
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenNewSectionDialog(false)}>
              Avbryt
            </Button>
            <Button 
              onClick={handleCreateSection}
              disabled={createSectionMutation.isPending}
              className="bg-primary text-white"
            >
              {createSectionMutation.isPending ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"></div>
                  Skapar...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Skapa sektion
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}