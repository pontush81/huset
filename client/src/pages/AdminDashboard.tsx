import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Section, Document } from "@shared/schema";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import SectionEditor from "@/components/SectionEditor";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import FileUploader from "@/components/FileUploader";
import { Trash2, Edit, FileText, ExternalLink, Plus } from "lucide-react";
import { apiRequest, queryClient } from "@/lib/queryClient";

export default function AdminDashboard() {
  const [currentTab, setCurrentTab] = useState<string>("sections");
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  
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
      } catch (error) {
        console.error("Error deleting document:", error);
        alert("Det gick inte att radera dokumentet.");
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
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Administratörsdashboard</h1>
      
      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <p className="text-5xl font-bold text-primary mb-2">{stats.totalSections}</p>
            <p className="text-sm text-gray-500">Totalt antal sektioner</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <p className="text-5xl font-bold text-primary mb-2">{stats.totalDocuments}</p>
            <p className="text-sm text-gray-500">Totalt antal dokument</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-6">
            <p className="text-5xl font-bold text-primary mb-2">{stats.categoriesByDocuments}</p>
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
        <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto">
          <TabsTrigger value="sections">Sektioner</TabsTrigger>
          <TabsTrigger value="documents">Dokument</TabsTrigger>
        </TabsList>
        
        {/* Sections Tab */}
        <TabsContent value="sections" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Hantera Sektioner</CardTitle>
              <CardDescription>
                Redigera innehåll i de olika sektionerna av handboken.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSections ? (
                <p>Laddar sektioner...</p>
              ) : (
                <div className="space-y-4">
                  {sections?.map(section => (
                    <div 
                      key={section.id} 
                      className="border rounded-lg p-4 flex justify-between items-center hover:bg-gray-50"
                    >
                      <div>
                        <div className="flex items-center">
                                          <div className="bg-primary/10 w-10 h-10 rounded-full flex items-center justify-center mr-3">
                            <i className={`fas ${section.icon || 'fa-file-alt'} text-primary`}></i>
                          </div>
                          <h3 className="text-lg font-medium">{section.title}</h3>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          Senast uppdaterad: {new Date(section.updatedAt).toLocaleDateString('sv-SE')}
                        </p>
                      </div>
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
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Hantera Dokument</CardTitle>
                  <CardDescription>
                    Ladda upp och hantera dokument för de olika sektionerna.
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => {
                    // Öppna en enkel dialogruta för att välja kategori
                    const category = prompt("Ange kategori för dokumentet:", "Allmänt");
                    if (category) {
                      // Du kan göra något med kategorin här om du vill
                      // För enkelhetens skull sätter vi bara kategori-staten
                      setOpenDialog(false);
                    }
                  }}
                  size="sm"
                  className="bg-primary text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Ladda upp dokument
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingDocuments ? (
                <p>Laddar dokument...</p>
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
                          <Card key={doc.id}>
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start">
                                <div className="flex items-start space-x-2">
                                  <FileText className="h-5 w-5 mt-1 text-primary" />
                                  <div>
                                    <h4 className="font-medium">{doc.title}</h4>
                                    {doc.description && (
                                      <p className="text-sm text-gray-500">{doc.description}</p>
                                    )}
                                    <p className="text-xs text-gray-400 mt-1">
                                      Uppladdad: {new Date(doc.uploadedAt).toLocaleDateString('sv-SE')}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex mt-4 space-x-2 justify-end">
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
                                    Öppna
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
      </Tabs>
      
      {/* Edit Section Dialog */}
      <Dialog open={openDialog} onOpenChange={setOpenDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Redigera Sektion: {editingSection?.title}</DialogTitle>
            <DialogDescription>
              Gör ändringar i innehållet för denna sektion.
            </DialogDescription>
          </DialogHeader>
          
          {editingSection && (
            <SectionEditor 
              section={editingSection} 
              onCancel={() => setOpenDialog(false)}
              isGuestApartment={editingSection.slug === 'gastlagenhet'}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}