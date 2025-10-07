
import React, { useState, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { extractTextFromDocx, processDocumentsWithGroupDistribution } from "@/utils/documentUtils";
import type { ProcessedDocument } from "@/types/document";
import FileUploader from "@/components/FileUploader";
import DocumentPreview from "@/components/DocumentPreview";
import TitleEditor from "@/components/TitleEditor";
import CsvGenerator from "@/components/CsvGenerator";
import YearInputDialog from "@/components/YearInputDialog";
import { useToast } from "@/components/ui/use-toast";
import TxtDownloader from "@/components/TxtDownloader";

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
        
        // Store current batch documents and files for year dialog
        setCurrentBatchDocs(documentsWithGroupDistribution);
        setCurrentBatchFiles(allFiles);
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
        
        // Show year dialog for single file too
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
      // Add batch information and year to the documents
      const updatedBatchDocs = currentBatchDocs.map(doc => ({
        ...doc,
        metadata: {
          ...doc.metadata,
          creationDate: year,
          batchId: batchCount
        }
      }));
      
      // Add these documents to the main processed list
      setProcessedDocuments(prevDocs => [...prevDocs, ...updatedBatchDocs]);
      
      // Increment batch counter for the next batch
      setBatchCount(prev => prev + 1);
      
      // Clear current batch
      setCurrentBatchDocs([]);
      setCurrentBatchFiles([]);
    }
  };

  const handleReset = () => {
    setProcessedDocuments([]);
    setActiveDocument(null);
    setCurrentTitle(null);
    setCurrentBatchDocs([]);
    setCurrentBatchFiles([]);
    setBatchCount(1);
    setProcessingProgress({ processed: 0, total: 0 });
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
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-docx-primary">DocX Scribe Extract</h1>
        <p className="text-muted-foreground mt-2">
          Convert DOCX files to TXT and CSV with intelligent metadata extraction
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Upload and export */}
        <div className="lg:col-span-1 space-y-6">
          <FileUploader 
            onFileUpload={handleFileUpload} 
            onReset={handleReset}
            isProcessing={isProcessing} 
            processedCount={processingProgress.processed}
            totalCount={processingProgress.total}
            hasProcessedFiles={processedDocuments.length > 0}
          />
          <Separator className="my-6" />
          <TitleEditor 
            originalTitle={activeDocument?.title || null} 
            content={activeDocument?.text || null}
            onTitleChange={handleTitleChange}
            isDisabled={isProcessing || !activeDocument}
          />
          <TxtDownloader 
            document={activeDocument}
            isDisabled={isProcessing}
          />
          <CsvGenerator 
            title={currentTitle}
            content={activeDocument?.text || null}
            isDisabled={isProcessing || (!activeDocument && processedDocuments.length === 0)}
            documents={processedDocuments}
            batchCount={batchCount}
          />
        </div>

        {/* Right column - Document preview */}
        <div className="lg:col-span-2">
          <Tabs defaultValue="preview" className="w-full">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="preview">Document Preview</TabsTrigger>
              <TabsTrigger value="text">Extracted Text</TabsTrigger>
            </TabsList>
            <TabsContent value="preview">
              <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-6">
                {processedDocuments.length > 1 && (
                  <div className="mb-4">
                    <div className="text-sm font-medium mb-2">Batch Processing Summary:</div>
                    <p className="text-sm text-muted-foreground">
                      Processed {processedDocuments.length} documents
                    </p>
                    
                    {/* Document selector */}
                    <div className="mt-4">
                      <label htmlFor="document-selector" className="text-sm font-medium mb-1 block">
                        Preview document:
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
                
                {activeDocument ? (
                  <div className="text-center">
                    <p className="text-xl font-semibold mb-2">{currentTitle}</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      Original file: {activeDocument.originalFilename}
                    </p>
                    <p className="text-muted-foreground">
                      {activeDocument.metadata.wordCount} words • 
                      {" "}{activeDocument.metadata.characterCount} characters
                    </p>
                    {activeDocument.metadata.participaciones && (
                      <p className="text-muted-foreground mt-2">
                        {activeDocument.metadata.participaciones.length} participaciones detectadas
                      </p>
                    )}
                    
                    <div className="mt-4 text-left p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-medium mb-2">Extracted Metadata:</h3>
                      <ul className="text-sm space-y-1">
                        <li><strong>Grupo:</strong> {activeDocument.metadata.grupo || "No detected"}</li>
                        <li><strong>Plaza:</strong> {activeDocument.metadata.plaza || "No detected"}</li>
                        <li><strong>Edades:</strong> {activeDocument.metadata.edades || "No detected"}</li>
                        <li><strong>NSE:</strong> {activeDocument.metadata.nse || "No detected"}</li>
                        <li><strong>Estado:</strong> {activeDocument.metadata.estado || "No detected"}</li>
                        <li><strong>Fecha:</strong> {activeDocument.metadata.creationDate || "No detected"}</li>
                        {activeDocument.metadata.distributionSource && (
                          <li><strong>Source:</strong> {activeDocument.metadata.distributionSource}</li>
                        )}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground">
                    <p>Upload a document to see preview</p>
                  </div>
                )}
              </div>
            </TabsContent>
            <TabsContent value="text">
              <DocumentPreview 
                content={activeDocument?.text || null} 
                title={currentTitle}
                isLoading={isProcessing}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <footer className="mt-12 text-center text-sm text-muted-foreground">
        <p>DocX Scribe Extract • Document Processing Tool</p>
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
