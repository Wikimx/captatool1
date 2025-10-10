
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

// Function to normalize time format to HH:MM
const normalizeTimeFormat = (time: string): string => {
  if (!time) return "";
  
  // Remove milliseconds if present (e.g., "14:30:45.123" -> "14:30:45")
  const timeWithoutMs = time.split('.')[0];
  
  // Split by colon
  const parts = timeWithoutMs.split(':');
  
  // If we have HH:MM:SS format, keep only HH:MM
  if (parts.length >= 2) {
    const hours = parts[0].padStart(2, '0');
    const minutes = parts[1].padStart(2, '0');
    return `${hours}:${minutes}`;
  }
  
  // Return as is if format is unexpected
  return time;
};

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
          "Fecha de sesiones": creationDate,
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
            "Fecha de sesiones": creationDate,
            Hora: normalizeTimeFormat(p.hora || ""),
            Participante: p.participante || "",
            "Rol": getRolParticipante(p.participante || ""),
            Categoría: p.categoria || "Sin clasificar",
            Participación: p.texto || "",
            "Participación minúsculas": (p.texto || "").toLowerCase(),
            "Archivo fuente": doc.title
          });
        });
      }
    });
    
    return rows;
  };

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

  const downloadCsv = (csvConfigs?: CsvConfig[], creationYear?: string) => {
    const docsToProcess = documents;
    
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

  const hasData = (documents && documents.length > 0) || (title && content);
  const documentsCount = (documents ? documents.length : 0) || (title && content ? 1 : 0);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Opciones de Exportación</CardTitle>
          <CardDescription>Descarga tus documentos procesados</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleOpenDialog}
            disabled={isDisabled || !hasData || isGenerating}
            className="w-full bg-accent hover:bg-accent/90"
            variant="default"
          >
            <Download className="mr-2 h-4 w-4" />
            {isGenerating ? "Generando..." : `Generar y Descargar CSV ${documentsCount > 1 ? `(${documentsCount} archivos)` : ''}`}
          </Button>
          
          <p className="text-sm text-muted-foreground text-center mt-4">
            Recuerda subir el archivo final a la carpeta de transcripciones del proyecto.
          </p>
        </CardContent>
      </Card>
      
      <CsvConfigDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        onConfirm={handleConfirmConfig}
        documents={documents}
        batchCount={batchCount}
      />
    </>
  );
};

export default CsvGenerator;
