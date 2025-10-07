
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

interface TitleEditorProps {
  originalTitle: string | null;
  content: string | null;
  onTitleChange: (newTitle: string) => void;
  isDisabled: boolean;
}

const TitleEditor: React.FC<TitleEditorProps> = ({ 
  originalTitle, 
  content,
  onTitleChange,
  isDisabled 
}) => {
  const [title, setTitle] = useState<string>("");
  const { toast } = useToast();

  useEffect(() => {
    if (originalTitle) {
      setTitle(originalTitle);
    }
  }, [originalTitle]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleSave = () => {
    if (title.trim()) {
      onTitleChange(title);
      toast({
        title: "Título actualizado",
        description: "El título del documento se ha actualizado exitosamente."
      });
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-md flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          Editar Título del Documento
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <Input
            value={title}
            onChange={handleTitleChange}
            placeholder="Ingresa el título del documento"
            disabled={isDisabled}
            className="flex-1"
          />
          <Button 
            onClick={handleSave} 
            disabled={isDisabled || !title.trim()}
            className="bg-primary hover:bg-primary/90"
          >
            Guardar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default TitleEditor;
