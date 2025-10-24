import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, Plus, Clock, FileText } from "lucide-react";
import { CategoryDefinition, FileTimeCategories, TimeRange, CategoryConfiguration } from "@/types/document";
import { ProcessedDocument } from "@/types/document";

// Function to validate and format time input
const formatTimeInput = (value: string): string => {
  // Remove any non-digit characters
  const digits = value.replace(/[^\d]/g, '');
  
  if (digits.length === 0) return '';
  
  // Handle different digit lengths
  if (digits.length <= 2) {
    // 1-2 digits: treat as minutes
    return `00:${digits.padStart(2, '0')}:00`;
  } else if (digits.length <= 4) {
    // 3-4 digits: treat as MM:SS
    const minutes = digits.slice(0, -2);
    const seconds = digits.slice(-2);
    return `00:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
  } else if (digits.length <= 6) {
    // 5-6 digits: treat as HH:MM:SS
    const hours = digits.slice(0, -4);
    const minutes = digits.slice(-4, -2);
    const seconds = digits.slice(-2);
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
  } else {
    // More than 6 digits: truncate to 6 digits
    const truncated = digits.slice(0, 6);
    const hours = truncated.slice(0, -4);
    const minutes = truncated.slice(-4, -2);
    const seconds = truncated.slice(-2);
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
  }
};

// Function to handle time input - allow free typing, format only on blur
const handleTimeInput = (value: string): string => {
  // Allow only digits and colons, limit to 8 characters
  const cleaned = value.replace(/[^\d:]/g, '').slice(0, 8);
  
  // If it's just digits and less than 7 characters, allow it
  if (/^\d+$/.test(cleaned) && cleaned.length <= 6) {
    return cleaned;
  }
  
  // If it has colons, allow partial format
  if (cleaned.includes(':')) {
    const parts = cleaned.split(':');
    if (parts.length <= 3) {
      return cleaned;
    }
  }
  
  // If deleting, allow it
  return cleaned;
};

// Function to format time when user finishes typing (on blur)
const formatTimeOnBlur = (value: string): string => {
  if (!value) return '';
  
  // Remove any non-digit characters
  const digits = value.replace(/[^\d]/g, '');
  
  if (digits.length === 0) return '';
  
  // Format based on digit count
  if (digits.length <= 2) {
    // 1-2 digits: treat as minutes
    return `00:${digits.padStart(2, '0')}:00`;
  } else if (digits.length <= 4) {
    // 3-4 digits: treat as MM:SS
    const minutes = digits.slice(0, -2);
    const seconds = digits.slice(-2);
    return `00:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
  } else if (digits.length <= 6) {
    // 5-6 digits: treat as HH:MM:SS
    const hours = digits.slice(0, -4);
    const minutes = digits.slice(-4, -2);
    const seconds = digits.slice(-2);
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
  } else {
    // More than 6 digits: truncate to 6 digits
    const truncated = digits.slice(0, 6);
    const hours = truncated.slice(0, -4);
    const minutes = truncated.slice(-4, -2);
    const seconds = truncated.slice(-2);
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
  }
};

interface CategoryConfigProps {
  onApplyCategories: (config: CategoryConfiguration) => void;
  isDisabled?: boolean;
  documents?: ProcessedDocument[];
}

const CategoryConfig: React.FC<CategoryConfigProps> = ({
  onApplyCategories,
  isDisabled = false,
  documents = []
}) => {
  // Keyword-based state
  const [keywordCategories, setKeywordCategories] = useState<CategoryDefinition[]>([
    { nombre: "", frasesClave: [] }
  ]);
  const [textInputs, setTextInputs] = useState<string[]>([""]);

  // Time-based state
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [fileTimeCategories, setFileTimeCategories] = useState<FileTimeCategories[]>([]);
  const [currentRanges, setCurrentRanges] = useState<TimeRange[]>([
    { startTime: "00:00:00", endTime: "", categoryName: "Pruebas técnicas y bienvenida" },
    { startTime: "", endTime: "", categoryName: "" },
    { startTime: "", endTime: "", categoryName: "" },
    { startTime: "", endTime: "", categoryName: "" },
    { startTime: "", endTime: "", categoryName: "" },
    { startTime: "", endTime: "", categoryName: "" },
    { startTime: "", endTime: "", categoryName: "" },
    { startTime: "", endTime: "", categoryName: "" }
  ]);
  
  // Refs for time input fields to control cursor position
  const timeInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});

  const [activeMethod, setActiveMethod] = useState<'keywords' | 'time'>('keywords');

  // Keyword-based methods
  const handleAddCategory = () => {
    setKeywordCategories([...keywordCategories, { nombre: "", frasesClave: [] }]);
    setTextInputs([...textInputs, ""]);
  };

  const handleRemoveCategory = (index: number) => {
    if (keywordCategories.length > 1) {
      setKeywordCategories(keywordCategories.filter((_, i) => i !== index));
      setTextInputs(textInputs.filter((_, i) => i !== index));
    }
  };

  const handleCategoryNameChange = (index: number, nombre: string) => {
    const updated = [...keywordCategories];
    updated[index].nombre = nombre;
    setKeywordCategories(updated);
  };

  const handleFrasesChange = (index: number, text: string) => {
    const updatedTexts = [...textInputs];
    updatedTexts[index] = text;
    setTextInputs(updatedTexts);
    
    const updated = [...keywordCategories];
    updated[index].frasesClave = text
      .split(",")
      .map(f => f.trim())
      .filter(f => f.length > 0);
    setKeywordCategories(updated);
  };

  const handlePasteInTable = (e: React.ClipboardEvent) => {
    e.preventDefault();
    
    const pastedData = e.clipboardData.getData('text');
    if (!pastedData) return;
    
    const lines = pastedData.split('\n').filter(line => line.trim() !== '');
    const parsedCategories: CategoryDefinition[] = [];
    const parsedTextInputs: string[] = [];
    
    lines.forEach(line => {
      const parts = line.split('\t');
      
      if (parts.length >= 2) {
        const nombre = parts[0].trim();
        const frasesText = parts[1].trim();
        const frases = frasesText
          .split(',')
          .map(f => f.trim())
          .filter(f => f.length > 0);
        
        if (nombre && frases.length > 0) {
          parsedCategories.push({ nombre, frasesClave: frases });
          parsedTextInputs.push(frasesText);
        }
      } else if (parts.length === 1 && parts[0].trim()) {
        const nombre = parts[0].trim();
        parsedCategories.push({ nombre, frasesClave: [] });
        parsedTextInputs.push("");
      }
    });
    
    if (parsedCategories.length > 0) {
      setKeywordCategories(parsedCategories);
      setTextInputs(parsedTextInputs);
    }
  };

  // Time-based methods
  const handleFileSelect = (fileName: string) => {
    setSelectedFile(fileName);
    
    const existing = fileTimeCategories.find(ftc => ftc.fileName === fileName);
    if (existing) {
      // Merge existing ranges with our 8-category structure
      const mergedRanges = [
        { startTime: "00:00:00", endTime: "", categoryName: "Pruebas técnicas y bienvenida" },
        ...existing.timeRanges.slice(1), // Keep existing ranges starting from index 1
        ...Array(8 - existing.timeRanges.length).fill({ startTime: "", endTime: "", categoryName: "" })
      ].slice(0, 8); // Ensure we only have 8 categories
      
      setCurrentRanges(mergedRanges);
    } else {
      // Use default 8 categories
      setCurrentRanges([
        { startTime: "00:00:00", endTime: "", categoryName: "Pruebas técnicas y bienvenida" },
        { startTime: "", endTime: "", categoryName: "" },
        { startTime: "", endTime: "", categoryName: "" },
        { startTime: "", endTime: "", categoryName: "" },
        { startTime: "", endTime: "", categoryName: "" },
        { startTime: "", endTime: "", categoryName: "" },
        { startTime: "", endTime: "", categoryName: "" },
        { startTime: "", endTime: "", categoryName: "" }
      ]);
    }
  };

  const handleAddRange = () => {
    const newRanges = [...currentRanges];
    
    // If there are existing ranges, auto-fill start time with previous end time
    if (newRanges.length > 0) {
      const lastRange = newRanges[newRanges.length - 1];
      const newRange = { 
        startTime: lastRange.endTime || "", 
        endTime: "", 
        categoryName: "" 
      };
      newRanges.push(newRange);
    } else {
      newRanges.push({ startTime: "", endTime: "", categoryName: "" });
    }
    
    setCurrentRanges(newRanges);
  };

  const handleRemoveRange = (index: number) => {
    // Only allow removing categories beyond the initial 8 (index > 7)
    if (index > 7 && currentRanges.length > 8) {
      setCurrentRanges(currentRanges.filter((_, i) => i !== index));
    }
  };

  const handleRangeChange = (index: number, field: keyof TimeRange, value: string) => {
    const updated = [...currentRanges];
    
    // For time fields, allow free typing without formatting
    if (field === 'startTime' || field === 'endTime') {
      updated[index] = { 
        ...updated[index], 
        [field]: handleTimeInput(value)
      };
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    
    // If startTime is changed, update previous endTime
    if (field === 'startTime' && index > 0 && value) {
      const formattedValue = handleTimeInput(value);
      updated[index - 1] = { 
        ...updated[index - 1], 
        endTime: formattedValue
      };
    }
    
    setCurrentRanges(updated);
  };

  // Handle time field blur (when user finishes typing)
  const handleTimeBlur = (index: number, field: 'startTime' | 'endTime') => {
    const updated = [...currentRanges];
    const currentValue = updated[index][field];
    const formattedValue = formatTimeOnBlur(currentValue);
    
    updated[index] = { 
      ...updated[index], 
      [field]: formattedValue
    };
    
    // If startTime is changed, update previous endTime
    if (field === 'startTime' && index > 0 && formattedValue) {
      updated[index - 1] = { 
        ...updated[index - 1], 
        endTime: formattedValue
      };
    }
    
    setCurrentRanges(updated);
  };

  const handleSaveFileRanges = () => {
    if (!selectedFile) return;

    // Only consider categories that have a category name (excluding empty ones)
    const validRanges = currentRanges.filter(
      r => r.categoryName.trim() !== ""
    );

    if (validRanges.length === 0) return;

    // Auto-complete the end time of the last category if it's empty
    const rangesWithAutoComplete = [...validRanges];
    const lastRangeIndex = rangesWithAutoComplete.length - 1;
    
    if (lastRangeIndex >= 0 && !rangesWithAutoComplete[lastRangeIndex].endTime) {
      // Find the document to get the last participation time
      const doc = documents.find(d => d.originalFilename === selectedFile);
      if (doc && doc.metadata.participaciones && doc.metadata.participaciones.length > 0) {
        // Get the last participation time
        const lastParticipation = doc.metadata.participaciones[doc.metadata.participaciones.length - 1];
        rangesWithAutoComplete[lastRangeIndex].endTime = lastParticipation.hora;
      }
    }

    const existing = fileTimeCategories.find(ftc => ftc.fileName === selectedFile);
    if (existing) {
      setFileTimeCategories(
        fileTimeCategories.map(ftc =>
          ftc.fileName === selectedFile
            ? { ...ftc, timeRanges: rangesWithAutoComplete }
            : ftc
        )
      );
    } else {
      setFileTimeCategories([
        ...fileTimeCategories,
        { fileName: selectedFile, timeRanges: rangesWithAutoComplete }
      ]);
    }
  };

  const handleApply = () => {
    if (activeMethod === 'keywords') {
      const validCategories = keywordCategories.filter(
        cat => cat.nombre.trim() !== "" && cat.frasesClave.length > 0
      );
      onApplyCategories({
        method: 'keywords',
        keywordCategories: validCategories
      });
    } else {
      // Save current file ranges first (with auto-complete) if needed
      if (selectedFile) {
        handleSaveFileRanges();
      }
      
      const validConfigs = fileTimeCategories.filter(ftc => ftc.timeRanges.length > 0);
      onApplyCategories({
        method: 'time',
        timeCategories: validConfigs
      });
    }
  };

  const getFileConfig = (fileName: string) => {
    return fileTimeCategories.find(ftc => ftc.fileName === fileName);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurar Categorías de Bloque</CardTitle>
        <CardDescription>
          Elige el método de categorización: por palabras clave o por rangos de tiempo.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs value={activeMethod} onValueChange={(v) => setActiveMethod(v as 'keywords' | 'time')} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="keywords">
              <FileText className="h-4 w-4 mr-2" />
              Por Palabras Clave
            </TabsTrigger>
            <TabsTrigger value="time">
              <Clock className="h-4 w-4 mr-2" />
              Por Tiempo
            </TabsTrigger>
          </TabsList>
          
          {/* Keywords Tab */}
          <TabsContent value="keywords" className="space-y-4">
            <div className="space-y-3">
              <div>
                <Label>Tabla de Categorías</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  📋 Copia y pega directamente desde Excel o Google Sheets
                </p>
              </div>
              
              <div className="border rounded-lg overflow-hidden" onPaste={handlePasteInTable}>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-1/3 font-semibold">Categoría</TableHead>
                      <TableHead className="font-semibold">
                        Palabras o frases clave
                        <span className="block text-xs font-normal text-muted-foreground mt-0.5">
                          Separar por comas
                        </span>
                      </TableHead>
                      <TableHead className="w-[60px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Example row */}
                    <TableRow className="bg-muted/20">
                      <TableCell className="font-mono text-xs text-muted-foreground italic">
                        Introducción
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground italic">
                        buenos días, vamos a comenzar, primera parte
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                    
                    {/* Editable rows */}
                    {keywordCategories.map((category, index) => (
                      <TableRow key={index}>
                        <TableCell className="p-2">
                          <Input
                            value={category.nombre}
                            onChange={(e) => handleCategoryNameChange(index, e.target.value)}
                            onPaste={handlePasteInTable}
                            placeholder="Nombre categoría"
                            className="h-9"
                            disabled={isDisabled}
                          />
                        </TableCell>
                        <TableCell className="p-2">
                          <Input
                            value={textInputs[index] || ""}
                            onChange={(e) => handleFrasesChange(index, e.target.value)}
                            onPaste={handlePasteInTable}
                            placeholder="palabra1, palabra2, palabra3"
                            className="h-9"
                            disabled={isDisabled}
                          />
                        </TableCell>
                        <TableCell className="p-2">
                          {keywordCategories.length > 1 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveCategory(index)}
                              className="h-9 w-9 text-destructive hover:text-destructive hover:bg-destructive/10"
                              disabled={isDisabled}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <Button
                variant="outline"
                onClick={handleAddCategory}
                className="w-full"
                disabled={isDisabled}
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar Fila
              </Button>
            </div>

            {keywordCategories.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="font-medium mb-2">Resumen de Categorías:</h4>
                <div className="space-y-2 text-sm">
                  {keywordCategories
                    .filter(cat => cat.nombre.trim() !== "")
                    .map((cat, i) => (
                      <div key={i} className="flex gap-2">
                        <span className="font-medium">{cat.nombre}:</span>
                        <span className="text-muted-foreground">
                          {cat.frasesClave.length > 0 
                            ? cat.frasesClave.join(", ")
                            : "Sin frases clave"}
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </TabsContent>
          
          {/* Time Tab */}
          <TabsContent value="time" className="space-y-4">
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
                        <div>
                          <h4 className="font-medium">Rangos de Tiempo</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            💡 La primera categoría "Pruebas técnicas y bienvenida" es automática y no se puede modificar
                            <br />
                            ⏰ Escribe números secuenciales: 002347 → 00:23:47 (se formatea al salir del campo)
                          </p>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Se muestran 8 categorías automáticamente. Solo se guardan las que tengan nombre.
                        </div>
                      </div>

                      {/* Categoría por defecto - elemento visual fijo */}
                      <div className="grid grid-cols-[1fr_1fr_2fr] gap-3 items-end p-2 bg-muted/30 rounded-lg border-2 border-dashed border-muted-foreground/30 mb-1">
                        <div>
                          <Label className="text-xs">Hora Inicio</Label>
                          <div className="mt-1 p-1.5 bg-background rounded border font-mono text-sm text-muted-foreground">
                            00:00:00
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Hora Fin</Label>
                          <div className="mt-1 p-1.5 bg-background rounded border font-mono text-sm text-muted-foreground">
                            {currentRanges.length > 1 ? currentRanges[1]?.startTime || "" : "Se llena automáticamente"}
                          </div>
                        </div>
                        <div>
                          <Label className="text-xs">Nombre de Categoría</Label>
                          <div className="mt-1 p-1.5 bg-background rounded border text-sm font-medium text-primary">
                            Pruebas técnicas y bienvenida
                          </div>
                        </div>
                      </div>

                      {/* Categorías adicionales - campos editables */}
                      {currentRanges.slice(1).map((range, index) => (
                        <div
                          key={index + 1}
                          className={`grid gap-3 items-end p-2 bg-background rounded-lg border mb-1 ${
                            index + 1 > 7 ? 'grid-cols-[1fr_1fr_2fr_auto]' : 'grid-cols-[1fr_1fr_2fr]'
                          }`}
                        >
                          <div>
                            <Label className="text-xs">Hora Inicio</Label>
                            <Input
                              ref={(el) => {
                                const inputKey = `${index + 1}-startTime`;
                                timeInputRefs.current[inputKey] = el;
                              }}
                              type="text"
                              value={range.startTime}
                              onChange={(e) =>
                                handleRangeChange(index + 1, "startTime", e.target.value)
                              }
                              onBlur={() => handleTimeBlur(index + 1, "startTime")}
                              onFocus={(e) => {
                                // Only select all if the field is empty or has default value
                                if (!range.startTime || range.startTime === "00:00:00") {
                                  e.target.select();
                                }
                              }}
                              disabled={isDisabled}
                              placeholder="Escribe: 002347"
                              className="mt-1 font-mono h-8 text-sm"
                              maxLength={8}
                            />
                          </div>

                          <div>
                            <Label className="text-xs">Hora Fin</Label>
                            <Input
                              ref={(el) => {
                                const inputKey = `${index + 1}-endTime`;
                                timeInputRefs.current[inputKey] = el;
                              }}
                              type="text"
                              value={range.endTime}
                              onChange={(e) =>
                                handleRangeChange(index + 1, "endTime", e.target.value)
                              }
                              onBlur={() => handleTimeBlur(index + 1, "endTime")}
                              onFocus={(e) => {
                                // Only select all if the field is empty or has default value
                                if (!range.endTime || range.endTime === "00:00:00") {
                                  e.target.select();
                                }
                              }}
                              disabled={isDisabled}
                              placeholder="Escribe: 002347"
                              className="mt-1 font-mono h-8 text-sm"
                              maxLength={8}
                            />
                          </div>

                          <div>
                            <Label className="text-xs">Nombre de Categoría</Label>
                            <Input
                              value={range.categoryName}
                              onChange={(e) =>
                                handleRangeChange(index + 1, "categoryName", e.target.value)
                              }
                              placeholder="Ej: Introducción, Desarrollo..."
                              disabled={isDisabled}
                              className="mt-1 h-8 text-sm"
                            />
                          </div>

                          {/* Solo mostrar botón eliminar para categorías adicionales (índice > 7) */}
                          {index + 1 > 7 && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveRange(index + 1)}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8"
                              disabled={isDisabled}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      ))}

                      {/* Botón para agregar más categorías */}
                      <div className="flex justify-center mt-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleAddRange}
                          disabled={isDisabled}
                          className="text-sm h-8"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Agregar otra categoría
                        </Button>
                      </div>

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
              </>
            )}
          </TabsContent>
        </Tabs>

        <Button 
          onClick={handleApply} 
          className="w-full"
          disabled={
            isDisabled || 
            (activeMethod === 'keywords' && keywordCategories.every(cat => cat.nombre.trim() === "" || cat.frasesClave.length === 0)) ||
            (activeMethod === 'time' && fileTimeCategories.length === 0 && !selectedFile)
          }
        >
          {activeMethod === 'keywords' 
            ? 'Aplicar Categorías (Por Palabras Clave)' 
            : `Guardar y Aplicar Categorías (Por Tiempo)${selectedFile ? ` - ${documents.find(d => d.originalFilename === selectedFile)?.title}` : ''}`
          }
        </Button>
      </CardContent>
    </Card>
  );
};

export default CategoryConfig;
