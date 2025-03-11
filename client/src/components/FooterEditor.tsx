import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Section } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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
  // Parse the footer data from the section content
  const initialData: FooterData = (() => {
    try {
      return JSON.parse(section.content);
    } catch (e) {
      // Fallback to default values if parsing fails
      return {
        address: "Ellagårdsvägen 123",
        email: "styrelsen@ellagarden.se",
        phone: "08-123 45 67",
        copyright: "BRF Ellagården. Alla rättigheter förbehållna."
      };
    }
  })();

  const [footerData, setFooterData] = useState<FooterData>(initialData);
  const { toast } = useToast();

  // Update section mutation
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
        title: "Sidfot uppdaterad",
        description: "Sidfoten har uppdaterats framgångsrikt."
      });
      onCancel(); // Close the editor
    },
    onError: (error: Error) => {
      console.error("Error updating footer:", error);
      toast({
        title: "Fel vid uppdatering",
        description: "Det gick inte att uppdatera sidfoten.",
        variant: "destructive"
      });
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(footerData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="address">Adress</Label>
        <Input
          id="address"
          value={footerData.address}
          onChange={(e) => setFooterData({ ...footerData, address: e.target.value })}
          placeholder="Adress"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">E-post</Label>
        <Input
          id="email"
          value={footerData.email}
          onChange={(e) => setFooterData({ ...footerData, email: e.target.value })}
          placeholder="E-post"
          type="email"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Telefon</Label>
        <Input
          id="phone"
          value={footerData.phone}
          onChange={(e) => setFooterData({ ...footerData, phone: e.target.value })}
          placeholder="Telefon"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="copyright">Copyright-text</Label>
        <Input
          id="copyright"
          value={footerData.copyright}
          onChange={(e) => setFooterData({ ...footerData, copyright: e.target.value })}
          placeholder="Copyright-text"
        />
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel}
        >
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
          ) : "Spara ändringar"}
        </Button>
      </div>
    </form>
  );
}