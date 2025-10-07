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
          title: "Too many files",
          description: "Maximum 250 files can be processed at once. Only the first 250 files will be processed.",
          variant: "destructive",
        });
        fileArray.splice(250); // Limit to first 250 files
      } else if (fileArray.length > 100) {
        toast({
          title: "Large batch",
          description: `Processing ${fileArray.length} files may take some time. Please wait patiently.`,
        });
      }
      
      // Check if all files are .docx or .txt
      const invalidFiles = fileArray.filter(file => !file.name.endsWith('.docx') && !file.name.endsWith('.txt'));
      
      if (invalidFiles.length > 0) {
        toast({
          title: "Invalid file format",
          description: `${invalidFiles.length} file(s) are not in .docx or .txt format. Only .docx and .txt files will be processed.`,
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
          title: "Invalid file format",
          description: "Only .docx and .txt files can be processed.",
          variant: "destructive",
        });
        return;
      }
      
      // Warn if different number of files than dropped
      if (validFiles.length < droppedFiles.length) {
        toast({
          title: "Some files skipped",
          description: `Only ${validFiles.length} out of ${droppedFiles.length} files are .docx or .txt and will be processed.`,
        });
      }
      
      // Warn if a large number of files is selected
      if (validFiles.length > 250) {
        toast({
          title: "Too many files",
          description: "Maximum 250 files can be processed at once. Only the first 250 files will be processed.",
          variant: "destructive",
        });
        validFiles.splice(250); // Limit to first 250 files
      } else if (validFiles.length > 100) {
        toast({
          title: "Large batch",
          description: `Processing ${validFiles.length} files may take some time. Please wait patiently.`,
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
          ${isProcessing ? 'bg-gray-100 border-gray-300' : 'border-docx-accent hover:border-docx-primary'}`}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <div className="flex flex-col items-center text-center">
          <div className="p-3 rounded-full bg-docx-light/20 mb-4">
            <Upload className="h-10 w-10 text-docx-primary" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Upload Documents</h3>
          <p className="text-sm text-gray-500 mb-4">
            Upload up to 250 .docx or .txt files to convert to text and CSV.<br/>
            Drag and drop files or click to browse.
          </p>
          <Button
            onClick={handleButtonClick}
            disabled={isProcessing}
            className="bg-docx-primary hover:bg-docx-secondary"
          >
            {isProcessing ? "Processing..." : "Select Files"}
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
              <span>Processing files...</span>
              <span>{processedCount} of {totalCount}</span>
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
