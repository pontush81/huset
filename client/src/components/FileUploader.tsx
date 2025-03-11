import { useState, useRef, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileUp } from "lucide-react";

interface FileUploaderProps {
  category?: string;
  autoOpen?: boolean;
}

export default function FileUploader({ category, autoOpen = false }: FileUploaderProps) {
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(autoOpen);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(category || "");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Om category ändras, uppdatera selectedCategory
  useEffect(() => {
    if (category) {
      setSelectedCategory(category);
    }
  }, [category]);
  
  const resetForm = () => {
    setTitle("");
    setDescription("");
    setSelectedCategory(category || "");
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };
  
  const closeDialog = () => {
    resetForm();
    setIsOpen(false);
  };

  // File upload mutation
  const uploadMutation = useMutation({
    mutationFn: (formData: FormData) => 
      apiRequest("POST", "/api/documents", formData, {
        headers: {
          // Don't set Content-Type here, let browser set it with boundary
        }
      }),
    onSuccess: () => {
      toast({
        title: "Dokument uppladdat",
        description: "Dokumentet har laddats upp framgångsrikt.",
      });
      // Invalidate document queries to refresh list
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      closeDialog();
    },
    onError: (error: Error) => {
      toast({
        title: "Ett fel uppstod",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) {
      toast({
        title: "Välj en fil",
        description: "Du måste välja en fil att ladda upp.",
        variant: "destructive",
      });
      return;
    }
    
    if (!title) {
      toast({
        title: "Ange en titel",
        description: "Du måste ange en titel för dokumentet.",
        variant: "destructive",
      });
      return;
    }
    
    if (!selectedCategory) {
      toast({
        title: "Välj en kategori",
        description: "Du måste välja en kategori för dokumentet.",
        variant: "destructive",
      });
      return;
    }
    
    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("category", selectedCategory);
    
    uploadMutation.mutate(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button 
          variant="default" 
          className="bg-primary hover:bg-primary/90 text-white"
        >
          <i className="fas fa-upload mr-2"></i>
          Ladda upp dokument
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Ladda upp nytt dokument</DialogTitle>
          <DialogDescription>
            Ladda upp ett dokument till systemet. Dokumentet kommer att vara tillgängligt för alla medlemmar.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="document-title">Titel</Label>
            <Input
              id="document-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Dokumentets titel"
            />
          </div>
          
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="document-description">Beskrivning (valfritt)</Label>
            <Textarea
              id="document-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Kort beskrivning av dokumentet"
              rows={3}
            />
          </div>
          
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="document-category">Kategori</Label>
            {category ? (
              // Om en kategori har skickats med i props, visa den som ett statiskt fält
              <div className="flex items-center border rounded p-2">
                <span className="text-sm text-gray-700">{category}</span>
              </div>
            ) : (
              // Annars visa dropdown för att välja kategori
              <Select 
                value={selectedCategory} 
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger id="document-category">
                  <SelectValue placeholder="Välj en kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Aktivitetsrum">Aktivitetsrum</SelectItem>
                  <SelectItem value="Elbil">Elbil</SelectItem>
                  <SelectItem value="Ellagården">Ellagården</SelectItem>
                  <SelectItem value="Stämma">Stämma</SelectItem>
                  <SelectItem value="Grillregler">Grillregler</SelectItem>
                  <SelectItem value="Gästlägenhet">Gästlägenhet</SelectItem>
                  <SelectItem value="Färgkoder">Färgkoder</SelectItem>
                  <SelectItem value="Sophantering">Sophantering</SelectItem>
                  <SelectItem value="Styrelse">Styrelse</SelectItem>
                  <SelectItem value="Allmänt">Allmänt</SelectItem>
                  <SelectItem value="Annat">Annat</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
          
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="document-file">Fil</Label>
            <Input
              id="document-file"
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
            />
            <p className="text-sm text-gray-500">
              Accepterade filformat: PDF, Word, Excel, PowerPoint, bilder
            </p>
          </div>
          
          <DialogFooter className="pt-4">
            <Button 
              variant="outline" 
              type="button" 
              onClick={closeDialog}
              disabled={uploadMutation.isPending}
            >
              Avbryt
            </Button>
            <Button 
              type="submit"
              disabled={uploadMutation.isPending}
            >
              {uploadMutation.isPending ? "Laddar upp..." : "Ladda upp"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}