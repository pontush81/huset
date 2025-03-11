import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Document } from "@shared/schema";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { format } from "date-fns";
import { sv } from "date-fns/locale";
import { Skeleton } from "@/components/ui/skeleton";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface DocumentListProps {
  category?: string;
  limit?: number;
}

export default function DocumentList({ category, limit }: DocumentListProps) {
  const [expanded, setExpanded] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<Document | null>(null);
  const { toast } = useToast();
  
  // Fetch documents
  const { data: documents, isLoading } = useQuery<Document[]>({
    queryKey: ['/api/documents', { category }],
  });
  
  // Delete document mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest("DELETE", `/api/documents/${id}`),
    onSuccess: () => {
      toast({
        title: "Dokument borttaget",
        description: "Dokumentet har tagits bort framgångsrikt.",
      });
      // Invalidate document queries to refresh list
      queryClient.invalidateQueries({ queryKey: ['/api/documents'] });
      setDocumentToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Ett fel uppstod",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const handleDelete = () => {
    if (documentToDelete) {
      deleteMutation.mutate(documentToDelete.id);
    }
  };
  
  // Filter and limit documents if needed
  const displayDocuments = documents
    ? (limit && !expanded ? documents.slice(0, limit) : documents)
    : [];
  
  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-4">
          <Skeleton className="h-6 w-48 mb-4" />
          <div className="space-y-2">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="flex justify-between items-center">
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (!documents || documents.length === 0) {
    return (
      <Card>
        <CardContent className="p-4 text-center py-8">
          <p className="text-gray-500">Inga dokument tillgängliga</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardContent className="p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="min-w-[180px]">Dokument</TableHead>
              <TableHead className="hidden sm:table-cell">Uppladdad</TableHead>
              <TableHead className="text-right">Handling</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayDocuments.map((doc) => (
              <TableRow key={doc.id}>
                <TableCell className="font-medium">
                  {doc.title}
                  {doc.description && (
                    <p className="text-sm text-gray-500">{doc.description}</p>
                  )}
                </TableCell>
                <TableCell>
                  {format(new Date(doc.uploadedAt), "d MMM yyyy", { locale: sv })}
                </TableCell>
                <TableCell className="text-right space-x-4">
                  <a 
                    href={`/api/documents/${doc.id}/file`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    <i className="fas fa-download mr-1"></i> Ladda ner
                  </a>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-destructive hover:text-destructive/90"
                        onClick={() => setDocumentToDelete(doc)}
                      >
                        <i className="fas fa-trash mr-1"></i> Ta bort
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Är du säker?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Detta kommer att permanent ta bort dokumentet "{documentToDelete?.title}".
                          Du kan inte ångra denna åtgärd.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDocumentToDelete(null)}>
                          Avbryt
                        </AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleDelete}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          {deleteMutation.isPending ? "Tar bort..." : "Ta bort"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        {limit && documents.length > limit && (
          <div className="mt-4 text-center">
            <Button 
              variant="outline" 
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? "Visa färre" : `Visa alla ${documents.length} dokument`}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
