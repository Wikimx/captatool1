
import React from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { ProcessedDocument } from "@/utils/documentUtils";

interface TxtDownloaderProps {
  document: ProcessedDocument | null;
  isDisabled?: boolean;
}

const TxtDownloader: React.FC<TxtDownloaderProps> = ({ 
  document, 
  isDisabled = false 
}) => {
  const { toast } = useToast();

  const downloadTxt = () => {
    if (!document) {
      toast({
        title: "Error",
        description: "No hay documento para descargar",
        variant: "destructive"
      });
      return;
    }

    try {
      // Create blob with UTF-8 BOM for proper encoding
      const BOM = "\uFEFF";
      const content = BOM + document.text;
      const blob = new Blob([content], { type: "text/plain;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      
      const link = window.document.createElement("a");
      link.setAttribute("href", url);
      
      // Use the document title for filename, removing invalid characters
      const filename = `${document.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.txt`;
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      
      URL.revokeObjectURL(url);
      
      toast({
        title: "Descarga Completa",
        description: `Archivo ${filename} descargado exitosamente.`
      });
    } catch (error) {
      console.error("Error downloading TXT:", error);
      toast({
        title: "Error de Descarga",
        description: "No se pudo descargar el archivo TXT.",
        variant: "destructive"
      });
    }
  };

  return (
    <Button
      onClick={downloadTxt}
      disabled={isDisabled || !document}
      variant="outline"
      className="w-full"
    >
      <Download className="mr-2 h-4 w-4" />
      Descargar TXT extraído
    </Button>
  );
};

export default TxtDownloader;
