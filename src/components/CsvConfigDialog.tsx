
import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ProcessedDocument } from "@/utils/documentUtils";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";

interface CsvConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (configs: CsvConfig[], creationYear: string) => void;
  documents: ProcessedDocument[];
  batchCount: number;
}

export interface CsvConfig {
  documentId: string;
  title: string;
  grupo: string;
  plaza: string;
  nse: string;
  edades: string;
  estado: string;
}

// Mapping function for plaza to estado
const getEstadoFromPlaza = (plaza: string): string => {
  const plazaMapping: Record<string, string> = {
    'CDMX': 'CDMX',
    'MTY': 'Nuevo León',
    'GDL': 'Jalisco',
    'VER': 'Veracruz'
  };
  
  return plazaMapping[plaza.toUpperCase()] || "";
};

// Function to check if a document is missing critical categories
const isDocumentIncomplete = (config: CsvConfig): boolean => {
  return !config.nse || !config.edades;
};

const CsvConfigDialog: React.FC<CsvConfigDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  documents,
  batchCount
}) => {
  const [configs, setConfigs] = useState<CsvConfig[]>([]);
  const [creationYear, setCreationYear] = useState<string>(new Date().getFullYear().toString());
  const [dragStartData, setDragStartData] = useState<{
    field: string;
    value: string;
    rowIndex: number;
    plaza: string;
  } | null>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [hasUserModifications, setHasUserModifications] = useState<Set<string>>(new Set());
  const previousDocumentsRef = useRef<ProcessedDocument[]>([]);
  const isInitializedRef = useRef(false);
  const [sortConfig, setSortConfig] = useState<{
    key: keyof CsvConfig | null;
    direction: 'asc' | 'desc';
  }>({ key: null, direction: 'asc' });

  const groupDocumentsByPlaza = (docs: ProcessedDocument[]): Record<string, ProcessedDocument[]> => {
    const grouped: Record<string, ProcessedDocument[]> = {};
    
    docs.forEach(doc => {
      const plaza = doc.metadata?.plaza || "Sin plaza";
      if (!grouped[plaza]) {
        grouped[plaza] = [];
      }
      grouped[plaza].push(doc);
    });
    
    // Sort documents within each plaza group - incomplete documents first
    Object.keys(grouped).forEach(plaza => {
      grouped[plaza].sort((a, b) => {
        const aConfig = configs.find(c => c.documentId === a.originalFilename);
        const bConfig = configs.find(c => c.documentId === b.originalFilename);
        
        if (!aConfig || !bConfig) return 0;
        
        const aIncomplete = isDocumentIncomplete(aConfig);
        const bIncomplete = isDocumentIncomplete(bConfig);
        
        if (aIncomplete && !bIncomplete) return -1;
        if (!aIncomplete && bIncomplete) return 1;
        return 0;
      });
    });
    
    return grouped;
  };

  // Check if documents have actually changed (not just reference)
  const documentsHaveChanged = (newDocs: ProcessedDocument[], oldDocs: ProcessedDocument[]): boolean => {
    if (newDocs.length !== oldDocs.length) return true;
    
    return newDocs.some((doc, index) => {
      const oldDoc = oldDocs[index];
      return !oldDoc || doc.originalFilename !== oldDoc.originalFilename;
    });
  };

  // Initialize configs only when necessary
  useEffect(() => {
    const shouldReinitialize = !isInitializedRef.current || 
                               documentsHaveChanged(documents, previousDocumentsRef.current);
    
    if (shouldReinitialize) {
      console.log("🔄 Initializing CSV configs for", documents.length, "documents");
      
      const newConfigs = documents.map(doc => {
        const initialPlaza = doc.metadata?.plaza || "";
        const autoEstado = getEstadoFromPlaza(initialPlaza);
        
        return {
          documentId: doc.originalFilename,
          title: doc.title,
          grupo: doc.metadata?.grupo || "",
          plaza: initialPlaza,
          nse: doc.metadata?.nse || "",
          edades: doc.metadata?.edades || "",
          estado: autoEstado || doc.metadata?.estado || ""
        };
      });
      
      setConfigs(newConfigs);
      setHasUserModifications(new Set());
      isInitializedRef.current = true;
      previousDocumentsRef.current = [...documents];
    }
  }, [documents]);

  // Reset initialization when dialog closes
  useEffect(() => {
    if (!isOpen) {
      isInitializedRef.current = false;
      setHasUserModifications(new Set());
    }
  }, [isOpen]);

  const handleInputChange = (documentId: string, field: keyof Omit<CsvConfig, 'documentId' | 'title'>, value: string) => {
    console.log(`📝 User modified ${field} for ${documentId}: "${value}"`);
    
    setConfigs(prev => {
      return prev.map(config => {
        if (config.documentId === documentId) {
          const updatedConfig = {
            ...config,
            [field]: value,
          };
          
          // Auto-map estado when plaza changes
          if (field === 'plaza') {
            const autoEstado = getEstadoFromPlaza(value);
            if (autoEstado) {
              updatedConfig.estado = autoEstado;
              console.log(`🗺️ Auto-mapped plaza "${value}" to estado "${autoEstado}"`);
            }
          }
          
          return updatedConfig;
        }
        return config;
      });
    });
    
    // Mark this field as manually modified
    setHasUserModifications(prev => new Set(prev).add(`${documentId}-${field}`));
    
    // Also mark estado as modified if plaza was changed and auto-mapped
    if (field === 'plaza' && getEstadoFromPlaza(value)) {
      setHasUserModifications(prev => new Set(prev).add(`${documentId}-estado`));
    }
  };

  const handleSort = (key: keyof CsvConfig) => {
    let direction: 'asc' | 'desc' = 'asc';
    
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    
    setSortConfig({ key, direction });
  };

  const getSortedConfigs = () => {
    if (!sortConfig.key) {
      return configs.sort((a, b) => {
        const aIncomplete = isDocumentIncomplete(a);
        const bIncomplete = isDocumentIncomplete(b);
        
        if (aIncomplete && !bIncomplete) return -1;
        if (!aIncomplete && bIncomplete) return 1;
        return 0;
      });
    }

    return [...configs].sort((a, b) => {
      const aValue = a[sortConfig.key!];
      const bValue = b[sortConfig.key!];
      
      if (aValue === bValue) return 0;
      
      const comparison = aValue < bValue ? -1 : 1;
      return sortConfig.direction === 'asc' ? comparison : -comparison;
    });
  };

  const handleConfirm = () => {
    onConfirm(configs, creationYear);
  };

  const groupedDocuments = groupDocumentsByPlaza(documents);
  const plazaGroups = Object.keys(groupedDocuments).sort();

  const handleMouseDown = (field: keyof Omit<CsvConfig, 'documentId' | 'title'>, value: string, rowIndex: number) => {
    setDragStartData({ field, value, rowIndex, plaza: "" });
    setIsMouseDown(true);
  };

  const handleMouseUp = () => {
    setDragStartData(null);
    setIsMouseDown(false);
  };
  
  const handleMouseEnter = (documentId: string, field: keyof Omit<CsvConfig, 'documentId' | 'title'>, rowIndex: number) => {
    if (isMouseDown && dragStartData && dragStartData.field === field) {
      handleInputChange(documentId, field, dragStartData.value);
    }
  };

  const handleFillDown = (field: keyof Omit<CsvConfig, 'documentId' | 'title'>, documentId: string) => {
    const sourceConfig = configs.find(config => config.documentId === documentId);
    if (!sourceConfig) return;
    
    const valueToFill = sourceConfig[field];
    
    const startIndex = configs.findIndex(config => config.documentId === documentId);
    
    if (startIndex === -1) return;
    
    const docIdsToUpdate = configs
      .slice(startIndex + 1)
      .map(config => config.documentId);
    
    console.log(`🔄 Fill down ${field} with "${valueToFill}" for ${docIdsToUpdate.length} documents`);
    
    setConfigs(prev => {
      return prev.map(config => {
        if (docIdsToUpdate.includes(config.documentId)) {
          const updatedConfig = {
            ...config,
            [field]: valueToFill,
          };
          
          // Auto-map estado when plaza is filled down
          if (field === 'plaza') {
            const autoEstado = getEstadoFromPlaza(valueToFill);
            if (autoEstado) {
              updatedConfig.estado = autoEstado;
            }
          }
          
          return updatedConfig;
        }
        return config;
      });
    });
    
    // Mark all filled fields as manually modified
    docIdsToUpdate.forEach(docId => {
      setHasUserModifications(prev => new Set(prev).add(`${docId}-${field}`));
      // Also mark estado if plaza was filled and auto-mapped
      if (field === 'plaza' && getEstadoFromPlaza(valueToFill)) {
        setHasUserModifications(prev => new Set(prev).add(`${docId}-estado`));
      }
    });
  };

  useEffect(() => {
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Count incomplete documents
  const incompleteCount = configs.filter(isDocumentIncomplete).length;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-5xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Confirmar información de los documentos ({configs.length})</DialogTitle>
        </DialogHeader>

        <div className="mb-4">
          <Label htmlFor="creationYear">Fecha de sesiones:</Label>
          <Input
            id="creationYear"
            type="text"
            value={creationYear}
            onChange={(e) => setCreationYear(e.target.value)}
            placeholder="Marzo 2025"
            className="max-w-xs"
          />
          <p className="text-sm text-muted-foreground mt-1">
            Este valor se usará para la columna "Fecha de sesiones" en todos los documentos de este lote.
          </p>
        </div>
        
        <div className="text-sm text-muted-foreground mb-4">
          {incompleteCount > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
              <p className="text-yellow-800 font-medium">
                ⚠️ {incompleteCount} documento(s) requieren NSE y/o edades (aparecen primero en la lista)
              </p>
            </div>
          )}
          
          <p>Consejos: </p>
          <ul className="list-disc pl-5">
            <li>Arrastra hacia abajo en una columna para copiar el valor a filas consecutivas</li>
            <li>Doble clic en una celda para llenar todas las filas inferiores con el mismo valor</li>
            <li>Al cambiar la plaza, el estado se asigna automáticamente (CDMX, MTY→Nuevo León, GDL→Jalisco, VER→Veracruz)</li>
          </ul>
        </div>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-[50vh]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="w-[180px] cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort('title')}
                  >
                    <div className="flex items-center gap-1">
                      Documento
                      {sortConfig.key === 'title' && (
                        <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort('grupo')}
                  >
                    <div className="flex items-center gap-1">
                      Grupo
                      {sortConfig.key === 'grupo' && (
                        <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort('plaza')}
                  >
                    <div className="flex items-center gap-1">
                      Plaza
                      {sortConfig.key === 'plaza' && (
                        <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort('nse')}
                  >
                    <div className="flex items-center gap-1">
                      NSE
                      {sortConfig.key === 'nse' && (
                        <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort('edades')}
                  >
                    <div className="flex items-center gap-1">
                      Edades
                      {sortConfig.key === 'edades' && (
                        <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted/50 select-none"
                    onClick={() => handleSort('estado')}
                  >
                    <div className="flex items-center gap-1">
                      Estado
                      {sortConfig.key === 'estado' && (
                        <span>{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {getSortedConfigs().map((config, rowIndex) => {
                    const isIncomplete = isDocumentIncomplete(config);
                    const rowClassName = isIncomplete ? "bg-yellow-50 border-l-4 border-l-yellow-400" : "";
                    
                    return (
                      <TableRow key={config.documentId} className={rowClassName}>
                        <TableCell className="font-medium text-xs">
                          {isIncomplete && <span className="text-yellow-600 mr-1">⚠️</span>}
                          {config.title}
                        </TableCell>
                        <TableCell>
                          <Input
                            value={config.grupo}
                            onChange={(e) => handleInputChange(config.documentId, "grupo", e.target.value)}
                            placeholder="SG##"
                            onMouseDown={() => handleMouseDown("grupo", config.grupo, rowIndex)}
                            onMouseEnter={() => handleMouseEnter(config.documentId, "grupo", rowIndex)}
                            onDoubleClick={() => handleFillDown("grupo", config.documentId)}
                            className={hasUserModifications.has(`${config.documentId}-grupo`) ? "border-blue-300 bg-blue-50" : ""}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={config.plaza}
                            onChange={(e) => handleInputChange(config.documentId, "plaza", e.target.value)}
                            placeholder="CDMX, GDL, MTY, VER"
                            onMouseDown={() => handleMouseDown("plaza", config.plaza, rowIndex)}
                            onMouseEnter={() => handleMouseEnter(config.documentId, "plaza", rowIndex)}
                            onDoubleClick={() => handleFillDown("plaza", config.documentId)}
                            className={hasUserModifications.has(`${config.documentId}-plaza`) ? "border-blue-300 bg-blue-50" : ""}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={config.nse}
                            onChange={(e) => handleInputChange(config.documentId, "nse", e.target.value)}
                            placeholder="A, B, C+, C, C-, D+, D, E"
                            onMouseDown={() => handleMouseDown("nse", config.nse, rowIndex)}
                            onMouseEnter={() => handleMouseEnter(config.documentId, "nse", rowIndex)}
                            onDoubleClick={() => handleFillDown("nse", config.documentId)}
                            className={`${hasUserModifications.has(`${config.documentId}-nse`) ? "border-blue-300 bg-blue-50" : ""} ${!config.nse ? "border-yellow-300 bg-yellow-50" : ""}`}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={config.edades}
                            onChange={(e) => handleInputChange(config.documentId, "edades", e.target.value)}
                            placeholder="18 a 35"
                            onMouseDown={() => handleMouseDown("edades", config.edades, rowIndex)}
                            onMouseEnter={() => handleMouseEnter(config.documentId, "edades", rowIndex)}
                            onDoubleClick={() => handleFillDown("edades", config.documentId)}
                            className={`${hasUserModifications.has(`${config.documentId}-edades`) ? "border-blue-300 bg-blue-50" : ""} ${!config.edades ? "border-yellow-300 bg-yellow-50" : ""}`}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            value={config.estado}
                            onChange={(e) => handleInputChange(config.documentId, "estado", e.target.value)}
                            placeholder="Estado"
                            onMouseDown={() => handleMouseDown("estado", config.estado, rowIndex)}
                            onMouseEnter={() => handleMouseEnter(config.documentId, "estado", rowIndex)}
                            onDoubleClick={() => handleFillDown("estado", config.documentId)}
                            className={hasUserModifications.has(`${config.documentId}-estado`) ? "border-blue-300 bg-blue-50" : ""}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </ScrollArea>
        </div>

        <DialogFooter className="mt-4 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm} className="bg-primary hover:bg-primary/90">
            Confirmar y generar CSV ({configs.length} documentos)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CsvConfigDialog;
