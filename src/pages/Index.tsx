
import React, { useState, useCallback } from "react";
import { Separator } from "@/components/ui/separator";
import { extractTextFromDocx, processDocumentsWithGroupDistribution } from "@/utils/documentUtils";
import type { ProcessedDocument } from "@/types/document";
import FileUploader from "@/components/FileUploader";
import CsvGenerator from "@/components/CsvGenerator";
import YearInputDialog from "@/components/YearInputDialog";
import CategoryConfig from "@/components/CategoryConfig";
import { useToast } from "@/components/ui/use-toast";
import logoCapta from "@/assets/logo-capta.png";
import cCapta from "@/assets/c-capta.png";
import type { CategoryDefinition } from "@/types/document";
import { applyCategoriestoDocuments } from "@/utils/categoryUtils";

// Process documents in batches to avoid browser freezes with many files
const BATCH_SIZE = 10;

const Index = () => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState({ processed: 0, total: 0 });
  const [activeDocument, setActiveDocument] = useState<ProcessedDocument | null>(null);
  const [processedDocuments, setProcessedDocuments] = useState<ProcessedDocument[]>([]);
  const [currentTitle, setCurrentTitle] = useState<string | null>(null);
  const [showYearDialog, setShowYearDialog] = useState(false);
  const [currentBatchDocs, setCurrentBatchDocs] = useState<ProcessedDocument[]>([]);
  const [currentBatchFiles, setCurrentBatchFiles] = useState<File[]>([]);
  const [batchCount, setBatchCount] = useState(1);
  const [categoryDefinitions, setCategoryDefinitions] = useState<CategoryDefinition[]>([]);
  const { toast } = useToast();

  const processBatch = useCallback(async (files: File[], startIdx: number, accumulator: ProcessedDocument[] = [], allFiles: File[] = []) => {
    const endIdx = Math.min(startIdx + BATCH_SIZE, files.length);
    const currentBatch = files.slice(startIdx, endIdx);
    
    try {
      const batchResults = await Promise.allSettled(
        currentBatch.map(file => extractTextFromDocx(file))
      );
      
      const batchDocuments = batchResults
        .filter((result): result is PromiseFulfilledResult<ProcessedDocument> => 
          result.status === 'fulfilled')
        .map(result => result.value);
      
      const updatedAccumulator = [...accumulator, ...batchDocuments];
      
      // Update progress
      setProcessingProgress({
        processed: updatedAccumulator.length,
        total: files.length
      });
      
      // If there are more files to process, schedule the next batch
      if (endIdx < files.length) {
        // Use setTimeout to allow UI updates and prevent browser freezes
        setTimeout(() => {
          processBatch(files, endIdx, updatedAccumulator, allFiles);
        }, 50);
      } else {
        // All batches processed - now apply group distribution
        console.log("🔄 All files processed, applying group distribution...");
        const documentsWithGroupDistribution = processDocumentsWithGroupDistribution(updatedAccumulator, allFiles);
        
        if (documentsWithGroupDistribution.length > 0) {
          setActiveDocument(documentsWithGroupDistribution[0]);
          setCurrentTitle(documentsWithGroupDistribution[0].title);
        }
        
        // Store current batch documents and files
        setCurrentBatchDocs(documentsWithGroupDistribution);
        setCurrentBatchFiles(allFiles);
        
        // Show year dialog
        setShowYearDialog(true);
        
        toast({
          title: "Procesamiento Completo",
          description: `Se procesaron exitosamente ${documentsWithGroupDistribution.length} de ${files.length} documentos.`,
        });
      }
    } catch (error) {
      console.error("Error processing batch:", error);
      setIsProcessing(false);
      toast({
        title: "Error de Procesamiento",
        description: "Error al procesar lote de documentos",
        variant: "destructive",
      });
    }
  }, [toast]);

  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0) return;

    setIsProcessing(true);
    setProcessingProgress({ processed: 0, total: files.length });
    
    try {
      if (files.length === 1) {
        // Single file processing
        const processed = await extractTextFromDocx(files[0]);
        const processedWithGroup = processDocumentsWithGroupDistribution([processed], files);
        
        setActiveDocument(processedWithGroup[0]);
        setCurrentBatchDocs(processedWithGroup);
        setCurrentBatchFiles(files);
        setCurrentTitle(processedWithGroup[0].title);
        
        // Show year dialog
        setShowYearDialog(true);
        
        toast({
          title: "Documento Procesado",
          description: `Se extrajo con éxito el texto de ${files[0].name}`,
        });
      } else {
        // For multiple files, use batch processing
        processBatch(files, 0, [], files);
      }
    } catch (error) {
      console.error("Error processing files:", error);
      toast({
        title: "Error de Procesamiento",
        description: error instanceof Error ? error.message : "No se pudieron procesar los documentos",
        variant: "destructive",
      });
      setIsProcessing(false);
      setProcessingProgress({ processed: 0, total: 0 });
    }
  };

  const handleYearDialogClose = (year?: string) => {
    setShowYearDialog(false);
    setIsProcessing(false);
    
    if (year && currentBatchDocs.length > 0) {
      // Add year to documents metadata
      const docsWithYear = currentBatchDocs.map(doc => ({
        ...doc,
        metadata: {
          ...doc.metadata,
          creationDate: year
        }
      }));
      
      // Add batch information to the documents
      const updatedBatchDocs = docsWithYear.map(doc => ({
        ...doc,
        metadata: {
          ...doc.metadata,
          batchId: batchCount
        }
      }));
      
      // Add these documents to the main processed list (without categories yet)
      setProcessedDocuments(prevDocs => [...prevDocs, ...updatedBatchDocs]);
      
      // Increment batch counter for the next batch
      setBatchCount(prev => prev + 1);
      
      // Clear current batch
      setCurrentBatchDocs([]);
      setCurrentBatchFiles([]);
    } else {
      // User cancelled, stop processing
      setCurrentBatchDocs([]);
      setCurrentBatchFiles([]);
    }
  };

  const handleApplyCategories = (categories: CategoryDefinition[]) => {
    if (processedDocuments.length === 0) {
      toast({
        title: "Sin Documentos",
        description: "Primero debes cargar documentos antes de aplicar categorías.",
        variant: "destructive",
      });
      return;
    }

    // Apply categories to all processed documents
    const docsWithCategories = applyCategoriestoDocuments(processedDocuments, categories);
    setCategoryDefinitions(categories);
    setProcessedDocuments(docsWithCategories);
    
    // Update active document if it exists
    if (activeDocument) {
      const updatedActiveDoc = docsWithCategories.find(
        doc => doc.originalFilename === activeDocument.originalFilename
      );
      if (updatedActiveDoc) {
        setActiveDocument(updatedActiveDoc);
      }
    }
    
    toast({
      title: "Categorías Aplicadas",
      description: `Se aplicaron ${categories.length} categorías a ${docsWithCategories.length} documentos.`,
    });
  };

  const handleReset = () => {
    setProcessedDocuments([]);
    setActiveDocument(null);
    setCurrentTitle(null);
    setCurrentBatchDocs([]);
    setCurrentBatchFiles([]);
    setBatchCount(1);
    setProcessingProgress({ processed: 0, total: 0 });
    setCategoryDefinitions([]);
  };

  const handleTitleChange = (newTitle: string) => {
    setCurrentTitle(newTitle);
    
    // If we have an active document, update its title too
    if (activeDocument) {
      const updatedDoc = { ...activeDocument, title: newTitle };
      setActiveDocument(updatedDoc);
      
      // Update this document in the processed documents array
      const updatedDocs = processedDocuments.map(doc => 
        doc.originalFilename === activeDocument.originalFilename ? updatedDoc : doc
      );
      setProcessedDocuments(updatedDocs);
    }
  };

  // Function to switch active document for preview
  const switchActiveDocument = (index: number) => {
    if (index >= 0 && index < processedDocuments.length) {
      setActiveDocument(processedDocuments[index]);
      setCurrentTitle(processedDocuments[index].title);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <header className="mb-8">
        <div className="flex items-center justify-center gap-4 mb-6">
          <img src={logoCapta} alt="CAPTA Logo" className="h-16" />
        </div>
        <h1 className="text-3xl font-bold text-primary text-center">
          Herramientas CAPTA: Generador de bases de datos
        </h1>
        <p className="text-muted-foreground mt-2 text-center">
          Convierte tus transcripciones de archivos .txt o .docx a una base de datos csv.
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column - Upload and export */}
        <div className="space-y-6">
          <FileUploader 
            onFileUpload={handleFileUpload} 
            onReset={handleReset}
            isProcessing={isProcessing} 
            processedCount={processingProgress.processed}
            totalCount={processingProgress.total}
            hasProcessedFiles={processedDocuments.length > 0}
          />
          
          {processedDocuments.length > 1 && (
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
              <div className="text-sm font-medium mb-2">Resumen de Procesamiento por Lotes:</div>
              <p className="text-sm text-muted-foreground">
                Se procesaron {processedDocuments.length} documentos
              </p>
              
              {/* Document selector */}
              <div className="mt-4">
                <label htmlFor="document-selector" className="text-sm font-medium mb-1 block">
                  Vista previa del documento:
                </label>
                <select 
                  id="document-selector"
                  className="w-full p-2 border rounded-md"
                  onChange={(e) => switchActiveDocument(parseInt(e.target.value))}
                >
                  {processedDocuments.map((doc, index) => (
                    <option key={index} value={index}>
                      {doc.originalFilename}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
          
          {activeDocument && (
            <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-4">
              <h3 className="font-medium mb-3">Metadatos Extraídos:</h3>
              <ul className="text-sm space-y-1">
                <li><strong>Grupo:</strong> {activeDocument.metadata.grupo || "No detectado"}</li>
                <li><strong>Plaza:</strong> {activeDocument.metadata.plaza || "No detectado"}</li>
                <li><strong>Edades:</strong> {activeDocument.metadata.edades || "No detectado"}</li>
                <li><strong>NSE:</strong> {activeDocument.metadata.nse || "No detectado"}</li>
                <li><strong>Estado:</strong> {activeDocument.metadata.estado || "No detectado"}</li>
                <li><strong>Fecha de sesiones:</strong> {activeDocument.metadata.creationDate || "No detectado"}</li>
                {activeDocument.metadata.distributionSource && (
                  <li><strong>Fuente:</strong> {activeDocument.metadata.distributionSource}</li>
                )}
              </ul>
              
              {categoryDefinitions.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="font-medium mb-2">Categorías Configuradas:</h4>
                  <div className="space-y-2 text-sm">
                    {categoryDefinitions.map((cat, i) => (
                      <div key={i} className="flex gap-2">
                        <span className="font-medium">{cat.nombre}:</span>
                        <span className="text-muted-foreground">
                          {cat.frasesClave.join(", ")}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          
          <Separator className="my-6" />
          <CsvGenerator
            title={currentTitle}
            content={activeDocument?.text || null}
            isDisabled={isProcessing || (!activeDocument && processedDocuments.length === 0)}
            documents={processedDocuments}
            batchCount={batchCount}
          />
        </div>

        {/* Right column - Categories and Document preview */}
        <div className="space-y-6">
          <CategoryConfig 
            onApplyCategories={handleApplyCategories}
            isDisabled={isProcessing}
          />
          
          <Separator className="my-6" />
          <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
            {activeDocument ? (
              <div className="text-center">
                <p className="text-xl font-semibold mb-2">{currentTitle}</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Archivo original: {activeDocument.originalFilename}
                </p>
                <p className="text-muted-foreground">
                  {activeDocument.metadata.wordCount} palabras • 
                  {" "}{activeDocument.metadata.characterCount} caracteres
                </p>
                {activeDocument.metadata.participaciones && (
                  <p className="text-muted-foreground mt-2">
                    {activeDocument.metadata.participaciones.length} participaciones detectadas
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                <p>Sube un documento para ver la vista previa</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <div className="flex items-center justify-center gap-2 mb-2">
          <img src={cCapta} alt="CAPTA" className="h-6" />
          <p>CAPTA • Herramientas de Procesamiento de Documentos</p>
        </div>
      </footer>

      {/* Year input dialog */}
      <YearInputDialog 
        isOpen={showYearDialog} 
        onClose={handleYearDialogClose} 
      />
    </div>
  );
};

export default Index;
