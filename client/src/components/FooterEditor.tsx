import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Section } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Save, ArrowLeft } from "lucide-react";

interface FooterEditorProps {
  section: Section;
  onCancel: () => void;
}

interface FooterData {
  address: string;
  email: string;
  phone: string;
  copyright: string;
}

export default function FooterEditor({ section, onCancel }: FooterEditorProps) {
  const { toast } = useToast();
  
  // Parse initial footer data from section content
  const initialData: FooterData = (() => {
    try {
      if (section.content) {
        return JSON.parse(section.content);
      }
    } catch (e) {
      console.error("Error parsing footer content:", e);
    }
    
    // Default values if parsing fails or content is empty
    return {
      address: "Ellagårdsvägen 123",
      email: "styrelsen@ellagarden.se",
      phone: "08-123 45 67",
      copyright: "BRF Ellagården. Alla rättigheter förbehållna."
    };
  })();
  
  const [footerData, setFooterData] = useState<FooterData>(initialData);
  const [error, setError] = useState<string | null>(null);
  
  // Update footer data in database
  const updateMutation = useMutation({
    mutationFn: async (data: FooterData) => {
      return apiRequest("PATCH", `/api/sections/${section.id}`, {
        content: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/sections'] });
      queryClient.invalidateQueries({ queryKey: ['/api/sections/footer'] });
      toast({
        title: "Uppdateringen slutförd",
        description: "Sidfoten har uppdaterats framgångsrikt",
      });
      onCancel();
    },
    onError: (error: Error) => {
      console.error("Error updating footer:", error);
      setError(error.message || "Ett fel uppstod vid uppdatering av sidfoten");
      toast({
        title: "Fel vid uppdatering",
        description: error.message || "Ett fel uppstod vid uppdatering av sidfoten",
        variant: "destructive",
      });
    }
  });
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    updateMutation.mutate(footerData);
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFooterData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-6">
            <div className="space-y-2">
              <Label htmlFor="address">Adress</Label>
              <Input
                id="address"
                name="address"
                value={footerData.address}
                onChange={handleInputChange}
                placeholder="T.ex. Ellagårdsvägen 123, 123 45 Stockholm"
                required
              />
              <p className="text-sm text-gray-500">Föreningens fullständiga adress</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">E-postadress</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={footerData.email}
                onChange={handleInputChange}
                placeholder="T.ex. styrelsen@ellagarden.se"
                required
              />
              <p className="text-sm text-gray-500">Kontakt e-postadress för föreningen</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="phone">Telefonnummer</Label>
              <Input
                id="phone"
                name="phone"
                value={footerData.phone}
                onChange={handleInputChange}
                placeholder="T.ex. 08-123 45 67"
                required
              />
              <p className="text-sm text-gray-500">Kontakt telefonnummer för föreningen</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="copyright">Copyright text</Label>
              <Input
                id="copyright"
                name="copyright"
                value={footerData.copyright}
                onChange={handleInputChange}
                placeholder="T.ex. BRF Ellagården. Alla rättigheter förbehållna."
                required
              />
              <p className="text-sm text-gray-500">Copyright-text som visas i sidfoten (utan årtal)</p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="flex justify-between pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Avbryt
        </Button>
        
        <Button
          type="submit"
          disabled={updateMutation.isPending}
          className="bg-primary text-white"
        >
          {updateMutation.isPending ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"></div>
              Sparar...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Spara ändringar
            </>
          )}
        </Button>
      </div>
    </form>
  );
}