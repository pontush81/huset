import { useState } from "react";
import { Section } from "@shared/schema";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

interface SectionEditorProps {
  section: Section;
  onCancel: () => void;
}

export default function SectionEditor({ section, onCancel }: SectionEditorProps) {
  const { toast } = useToast();
  const [content, setContent] = useState(section.content);
  
  // Update section mutation
  const updateMutation = useMutation({
    mutationFn: (updatedContent: string) => 
      apiRequest("PATCH", `/api/sections/${section.id}`, { content: updatedContent }),
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
        title: "Ett fel uppstod",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSave = () => {
    updateMutation.mutate(content);
  };

  return (
    <Card className="bg-white rounded-lg shadow-md mb-4">
      <CardContent className="p-6">
        <h2 className="text-xl font-semibold mb-4">Redigera innehåll</h2>
        
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={10}
          className="w-full mb-4"
          placeholder="Skriv innehållet här..."
        />
        
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