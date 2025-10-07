
import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import * as Papa from "papaparse";
import { ProcessedDocument } from "@/utils/documentUtils";
import CsvConfigDialog, { CsvConfig } from "./CsvConfigDialog";

interface CsvGeneratorProps {
  title: string | null;
  content: string | null;
  isDisabled: boolean;
  documents?: ProcessedDocument[];
  batchCount?: number;
}

// Function to determine participant role
const getRolParticipante = (name: string): string => {
  const MODERADORES = [
    "Yvone Carrillo",
    "Yvon Carrillo",
    "Dan Cortés",
    "Carlos Villanueva Avilez",
    "Karime Galicia",
    "Mario Juárez", 
    "Natalia Rodríguez",
    "Diego De Alba Montes",
    "Daniela RK",
    "Jaime Ruiz",
    "Joaquín García Luna Pérez",
    "Daniel Behn",
    "Judith B.",
    "Andrea Chávez"
  ];
  
  return MODERADORES.some(moderador => 
    moderador.toLowerCase() === name.toLowerCase().trim()) 
    ? "Moderador" 
    : "Participante";
};

const CsvGenerator: React.FC<CsvGeneratorProps> = ({ 
  title, 
  content, 
  isDisabled,
  documents = [],
  batchCount = 1
}) => {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [allBatchDocuments, setAllBatchDocuments] = useState<ProcessedDocument[]>([]);
  const [localBatchCount, setLocalBatchCount] = useState(batchCount);

  const generateParticipacionesCsv = (processedDocuments: ProcessedDocument[], csvConfigs?: CsvConfig[], creationYear?: string) => {
    if (processedDocuments.length === 0) {
      return [];
    }

    const rows: any[] = [];
    
    processedDocuments.forEach((doc) => {
      const { metadata } = doc;
      
      const docConfig = csvConfigs?.find(config => config.documentId === doc.originalFilename);
      
      const grupo = docConfig?.grupo || metadata.grupo || "";
      const plaza = docConfig?.plaza || metadata.plaza || "";
      const nse = docConfig?.nse || metadata.nse || "";
      const edades = docConfig?.edades || metadata.edades || "";
      const estado = docConfig?.estado || metadata.estado || "";
      const creationDate = creationYear || metadata.creationDate || new Date().getFullYear().toString();
      
      if (!metadata.participaciones || metadata.participaciones.length === 0) {
        rows.push({
          Grupo: grupo,
          Plaza: plaza,
          Estado: estado,
          Edades: edades,
          NSE: nse,
          "Fecha de creación": creationDate,
          Hora: "",
          Participante: "",
          "Rol": "",
          Participación: "",
          "Participación minúsculas": "",
          "Archivo fuente": doc.title
        });
      } else {
        metadata.participaciones.forEach((p) => {
          rows.push({
            Grupo: grupo,
            Plaza: plaza,
            Estado: estado,
            Edades: edades,
            NSE: nse,
            "Fecha de creación": creationDate,
            Hora: p.hora || "",
            Participante: p.participante || "",
            "Rol": getRolParticipante(p.participante || ""),
            Participación: p.texto || "",
            "Participación minúsculas": (p.texto || "").toLowerCase(),
            "Archivo fuente": doc.title
          });
        });
      }
    });
    
    return rows;
  };

  React.useEffect(() => {
    setLocalBatchCount(batchCount);
  }, [batchCount]);
  
  const handleOpenDialog = () => {
    let documentsToProcess = documents.length > 0 ? documents : [];
    
    if (title && content && documentsToProcess.length === 0) {
      toast({
        title: "Error",
        description: "No hay documentos procesados disponibles. Por favor, sube un archivo primero.",
        variant: "destructive"
      });
      return;
    }
    
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  const handleConfirmConfig = (configs: CsvConfig[], creationYear: string) => {
    downloadCsv(configs, creationYear);
    setIsDialogOpen(false);
  };

  const handleAddBatch = () => {
    const newDocuments = documents.filter(doc => 
      !allBatchDocuments.some(existingDoc => existingDoc.originalFilename === doc.originalFilename)
    );
    
    if (newDocuments.length === 0) {
      toast({
        title: "Lote ya agregado",
        description: "Estos archivos ya han sido agregados previamente."
      });
      return;
    }
    
    setAllBatchDocuments(prev => [...prev, ...newDocuments]);
    setLocalBatchCount(prevCount => prevCount + 1);
    
    toast({
      title: "Lote agregado",
      description: `Se agregaron ${newDocuments.length} archivos al lote ${localBatchCount}. Puede continuar agregando más lotes.`
    });
  };

  const downloadCsv = (csvConfigs?: CsvConfig[], creationYear?: string) => {
    const docsToProcess = [...allBatchDocuments];
    
    const currentBatchDocs = documents.filter(doc => 
      !allBatchDocuments.some(existingDoc => existingDoc.originalFilename === doc.originalFilename)
    );
    docsToProcess.push(...currentBatchDocs);
    
    if (docsToProcess.length === 0) {
      return;
    }

    setIsGenerating(true);
    try {
      const csvData = generateParticipacionesCsv(docsToProcess, csvConfigs, creationYear);
      
      if (csvData.length === 0) {
        throw new Error("No data to export");
      }
      
      const BOM = "\uFEFF";
      const csv = BOM + Papa.unparse(csvData);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.setAttribute("href", url);
      
      const filename = docsToProcess.length > 1 
        ? `batch_export_${new Date().toISOString().split('T')[0]}.csv`
        : `${(title || "document").replace(/[^a-z0-9]/gi, "_").toLowerCase()}_data.csv`;
        
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "CSV Generado",
        description: `Tu archivo CSV con datos de ${docsToProcess.length} documento(s) ha sido generado y descargado exitosamente.`
      });
    } catch (error) {
      console.error("Error generating CSV:", error);
      toast({
        title: "Error",
        description: "Error al generar archivo CSV.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  React.useEffect(() => {
    if (documents.length === 0 && allBatchDocuments.length > 0) {
      setAllBatchDocuments([]);
      setLocalBatchCount(1);
    }
  }, [documents.length]);

  const hasData = (allBatchDocuments.length > 0) || (documents && documents.length > 0) || (title && content);
  const documentsCount = allBatchDocuments.length + (documents ? documents.length : 0) || (title && content ? 1 : 0);
  const hasCurrentBatch = documents && documents.length > 0;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Opciones de Exportación</CardTitle>
          <CardDescription>Descarga tus documentos procesados</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {hasCurrentBatch && (
          <Button
            onClick={handleAddBatch}
            disabled={isDisabled || documents.length === 0}
            className="w-full bg-secondary hover:bg-secondary/90"
            variant="default"
          >
            Agregar lote actual ({documents.length} archivos)
          </Button>
          )}
          
          <Button
            onClick={handleOpenDialog}
            disabled={isDisabled || !hasData || isGenerating}
            className="w-full bg-accent hover:bg-accent/90"
            variant="default"
          >
            <Download className="mr-2 h-4 w-4" />
            {isGenerating ? "Generando..." : `Generar y Descargar CSV ${documentsCount > 1 ? `(${documentsCount} archivos)` : ''}`}
          </Button>
          
          {allBatchDocuments.length > 0 && (
            <div className="text-sm text-gray-500 pt-2">
              <p>Lotes guardados: {localBatchCount - 1}</p>
              <p>Total archivos: {allBatchDocuments.length}</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      <CsvConfigDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        onConfirm={handleConfirmConfig}
        documents={[...allBatchDocuments, ...documents]}
        batchCount={localBatchCount}
      />
    </>
  );
};

export default CsvGenerator;
