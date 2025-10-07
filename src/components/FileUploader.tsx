import React, { useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Upload, RotateCcw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";

interface FileUploaderProps {
  onFileUpload: (files: File[]) => void;
  onReset: () => void;
  isProcessing: boolean;
  processedCount?: number;
  totalCount?: number;
  hasProcessedFiles?: boolean;
}

const FileUploader: React.FC<FileUploaderProps> = ({ 
  onFileUpload, 
  onReset,
  isProcessing,
  processedCount = 0,
  totalCount = 0,
  hasProcessedFiles = false
}) => {
  const { toast } = useToast();
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      // Convert FileList to array to make it easier to work with
      const fileArray = Array.from(files);
      
      // Warn if a large number of files is selected
      if (fileArray.length > 250) {
        toast({
          title: "Demasiados archivos",
          description: "Se pueden procesar un máximo de 250 archivos a la vez. Solo se procesarán los primeros 250 archivos.",
          variant: "destructive",
        });
        fileArray.splice(250); // Limit to first 250 files
      } else if (fileArray.length > 100) {
        toast({
          title: "Lote grande",
          description: `Procesar ${fileArray.length} archivos puede tomar algún tiempo. Por favor espera pacientemente.`,
        });
      }
      
      // Check if all files are .docx or .txt
      const invalidFiles = fileArray.filter(file => !file.name.endsWith('.docx') && !file.name.endsWith('.txt'));
      
      if (invalidFiles.length > 0) {
        toast({
          title: "Formato de archivo inválido",
          description: `${invalidFiles.length} archivo(s) no están en formato .docx o .txt. Solo se procesarán archivos .docx y .txt.`,
          variant: "destructive",
        });
        
        // Filter out invalid files
        const validFiles = fileArray.filter(file => file.name.endsWith('.docx') || file.name.endsWith('.txt'));
        
        if (validFiles.length === 0) {
          return;
        }
        
        // Process only valid files
        onFileUpload(validFiles);
      } else {
        // All files are valid
        onFileUpload(fileArray);
      }
    },
    [onFileUpload, toast]
  );

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isProcessing) return;
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      
      // Filter for just .docx and .txt files
      const validFiles = droppedFiles.filter(file => file.name.endsWith('.docx') || file.name.endsWith('.txt'));
      
      if (validFiles.length === 0) {
        toast({
          title: "Formato de archivo inválido",
          description: "Solo se pueden procesar archivos .docx y .txt.",
          variant: "destructive",
        });
        return;
      }
      
      // Warn if different number of files than dropped
      if (validFiles.length < droppedFiles.length) {
        toast({
          title: "Algunos archivos omitidos",
          description: `Solo ${validFiles.length} de ${droppedFiles.length} archivos son .docx o .txt y serán procesados.`,
        });
      }
      
      // Warn if a large number of files is selected
      if (validFiles.length > 250) {
        toast({
          title: "Demasiados archivos",
          description: "Se pueden procesar un máximo de 250 archivos a la vez. Solo se procesarán los primeros 250 archivos.",
          variant: "destructive",
        });
        validFiles.splice(250); // Limit to first 250 files
      } else if (validFiles.length > 100) {
        toast({
          title: "Lote grande",
          description: `Procesar ${validFiles.length} archivos puede tomar algún tiempo. Por favor espera pacientemente.`,
        });
      }
      
      onFileUpload(validFiles.slice(0, 250)); // Process up to 250 files
    }
  };

  const handleReset = () => {
    onReset();
    toast({
      title: "Archivos eliminados",
      description: "Se han eliminado todos los archivos procesados. Puedes comenzar de nuevo.",
    });
  };

  return (
    <div className="relative w-full space-y-4">
      <div 
        className={`border-2 border-dashed rounded-lg p-8 flex flex-col items-center justify-center gap-4 
          ${isProcessing ? 'bg-muted border-border' : 'border-accent hover:border-primary'}`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center text-center">
          <div className="p-3 rounded-full bg-accent/20 mb-4">
            <Upload className="h-10 w-10 text-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Subir Documentos</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Sube hasta 250 archivos .docx o .txt para convertir a texto y CSV.<br/>
            Arrastra y suelta archivos o haz clic para explorar.
          </p>
          <Button
            onClick={handleButtonClick}
            disabled={isProcessing}
            className="bg-primary hover:bg-primary/90"
          >
            {isProcessing ? "Procesando..." : "Seleccionar Archivos"}
          </Button>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept=".docx,.txt"
          multiple
          disabled={isProcessing}
        />
        
        {isProcessing && totalCount > 0 && (
          <div className="w-full mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Procesando archivos...</span>
              <span>{processedCount} de {totalCount}</span>
            </div>
            <Progress value={(processedCount / totalCount) * 100} className="h-2" />
          </div>
        )}
      </div>
      
      {hasProcessedFiles && !isProcessing && (
        <Button
          onClick={handleReset}
          variant="outline"
          className="w-full text-red-600 border-red-300 hover:bg-red-50"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Borrar archivos y empezar de cero
        </Button>
      )}
    </div>
  );
};

export default FileUploader;
