
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";

interface DocumentPreviewProps {
  content: string | null;
  title: string | null;
  isLoading: boolean;
}

const DocumentPreview: React.FC<DocumentPreviewProps> = ({ content, title, isLoading }) => {
  if (isLoading) {
    return (
      <Card className="w-full h-[500px]">
        <CardHeader>
          <Skeleton className="h-8 w-3/4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-5 w-full mb-2" />
          <Skeleton className="h-5 w-5/6 mb-2" />
          <Skeleton className="h-5 w-4/6 mb-2" />
          <Skeleton className="h-5 w-5/6 mb-2" />
          <Skeleton className="h-5 w-3/6" />
        </CardContent>
      </Card>
    );
  }

  if (!content) {
    return (
      <Card className="w-full h-[500px]">
        <CardHeader>
          <CardTitle>Vista Previa del Documento</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[400px] text-muted-foreground">
          Sube un documento para ver la vista previa
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full h-[500px]">
      <CardHeader>
        <CardTitle>{title || "Vista Previa del Documento"}</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] rounded-md border p-4">
          <div className="whitespace-pre-wrap font-mono text-sm">
            {content}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default DocumentPreview;
