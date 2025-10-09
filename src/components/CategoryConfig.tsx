import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, Clock } from "lucide-react";
import { FileTimeCategories, TimeRange } from "@/types/document";
import { ProcessedDocument } from "@/types/document";

interface CategoryConfigProps {
  onApplyCategories: (fileTimeCategories: FileTimeCategories[]) => void;
  isDisabled?: boolean;
  documents?: ProcessedDocument[];
}

const CategoryConfig: React.FC<CategoryConfigProps> = ({
  onApplyCategories,
  isDisabled = false,
  documents = []
}) => {
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [fileTimeCategories, setFileTimeCategories] = useState<FileTimeCategories[]>([]);
  const [currentRanges, setCurrentRanges] = useState<TimeRange[]>([
    { startTime: "", endTime: "", categoryName: "" }
  ]);

  const handleFileSelect = (fileName: string) => {
    setSelectedFile(fileName);
    
    // Load existing time ranges for this file if they exist
    const existing = fileTimeCategories.find(ftc => ftc.fileName === fileName);
    if (existing) {
      setCurrentRanges(existing.timeRanges.length > 0 ? existing.timeRanges : [
        { startTime: "", endTime: "", categoryName: "" }
      ]);
    } else {
      setCurrentRanges([{ startTime: "", endTime: "", categoryName: "" }]);
    }
  };

  const handleAddRange = () => {
    setCurrentRanges([...currentRanges, { startTime: "", endTime: "", categoryName: "" }]);
  };

  const handleRemoveRange = (index: number) => {
    if (currentRanges.length > 1) {
      setCurrentRanges(currentRanges.filter((_, i) => i !== index));
    }
  };

  const handleRangeChange = (index: number, field: keyof TimeRange, value: string) => {
    const updated = [...currentRanges];
    updated[index] = { ...updated[index], [field]: value };
    setCurrentRanges(updated);
  };

  const handleSaveFileRanges = () => {
    if (!selectedFile) {
      return;
    }

    // Filter out empty ranges
    const validRanges = currentRanges.filter(
      r => r.startTime && r.endTime && r.categoryName.trim() !== ""
    );

    if (validRanges.length === 0) {
      return;
    }

    // Update or add file time categories
    const existing = fileTimeCategories.find(ftc => ftc.fileName === selectedFile);
    if (existing) {
      setFileTimeCategories(
        fileTimeCategories.map(ftc =>
          ftc.fileName === selectedFile
            ? { ...ftc, timeRanges: validRanges }
            : ftc
        )
      );
    } else {
      setFileTimeCategories([
        ...fileTimeCategories,
        { fileName: selectedFile, timeRanges: validRanges }
      ]);
    }
  };

  const handleApply = () => {
    // Save current file ranges first
    if (selectedFile) {
      handleSaveFileRanges();
    }
    
    // Apply all configured file time categories
    const validConfigs = fileTimeCategories.filter(ftc => ftc.timeRanges.length > 0);
    onApplyCategories(validConfigs);
  };

  const getFileConfig = (fileName: string) => {
    return fileTimeCategories.find(ftc => ftc.fileName === fileName);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Configurar Categorías por Tiempo
        </CardTitle>
        <CardDescription>
          Define rangos de tiempo (HH:MM) para categorizar las participaciones de cada archivo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {documents.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            Sube archivos primero para configurar categorías por tiempo.
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <Label>Selecciona un archivo</Label>
              <Select
                value={selectedFile}
                onValueChange={handleFileSelect}
                disabled={isDisabled}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un archivo..." />
                </SelectTrigger>
                <SelectContent>
                  {documents.map((doc, idx) => {
                    const config = getFileConfig(doc.originalFilename);
                    return (
                      <SelectItem key={idx} value={doc.originalFilename}>
                        {doc.title}
                        {config && ` ✓ (${config.timeRanges.length} rangos)`}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {selectedFile && (
              <>
                <div className="border rounded-lg p-4 space-y-4 bg-muted/20">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Rangos de Tiempo</h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddRange}
                      disabled={isDisabled}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Agregar Rango
                    </Button>
                  </div>

                  {currentRanges.map((range, index) => (
                    <div
                      key={index}
                      className="grid grid-cols-[1fr_1fr_2fr_auto] gap-3 items-end p-3 bg-background rounded-lg border"
                    >
                      <div>
                        <Label className="text-xs">Hora Inicio</Label>
                        <Input
                          type="time"
                          value={range.startTime}
                          onChange={(e) =>
                            handleRangeChange(index, "startTime", e.target.value)
                          }
                          disabled={isDisabled}
                          placeholder="00:00"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Hora Fin</Label>
                        <Input
                          type="time"
                          value={range.endTime}
                          onChange={(e) =>
                            handleRangeChange(index, "endTime", e.target.value)
                          }
                          disabled={isDisabled}
                          placeholder="00:00"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label className="text-xs">Nombre de Categoría</Label>
                        <Input
                          value={range.categoryName}
                          onChange={(e) =>
                            handleRangeChange(index, "categoryName", e.target.value)
                          }
                          placeholder="Ej: Introducción, Desarrollo..."
                          disabled={isDisabled}
                          className="mt-1"
                        />
                      </div>

                      {currentRanges.length > 1 && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveRange(index)}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          disabled={isDisabled}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}

                  <Button
                    variant="secondary"
                    onClick={handleSaveFileRanges}
                    className="w-full"
                    disabled={isDisabled}
                  >
                    Guardar Rangos para {documents.find(d => d.originalFilename === selectedFile)?.title}
                  </Button>
                </div>
              </>
            )}

            {fileTimeCategories.length > 0 && (
              <div className="border rounded-lg p-4 bg-primary/5">
                <h4 className="font-medium mb-3">Archivos Configurados:</h4>
                <div className="space-y-2 text-sm">
                  {fileTimeCategories.map((ftc, i) => {
                    const doc = documents.find(d => d.originalFilename === ftc.fileName);
                    return (
                      <div key={i} className="flex flex-col gap-1 p-2 bg-background rounded">
                        <span className="font-medium">{doc?.title || ftc.fileName}</span>
                        <div className="text-xs text-muted-foreground pl-3 space-y-0.5">
                          {ftc.timeRanges.map((range, j) => (
                            <div key={j}>
                              • {range.startTime} - {range.endTime}: {range.categoryName}
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <Button
              onClick={handleApply}
              className="w-full"
              disabled={isDisabled || fileTimeCategories.length === 0}
            >
              Aplicar Categorías a Todos los Archivos
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default CategoryConfig;
