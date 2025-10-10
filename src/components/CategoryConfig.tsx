import React, { useState } from "react";
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
    { startTime: "", endTime: "", categoryName: "" }
  ]);

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
    if (!selectedFile) return;

    const validRanges = currentRanges.filter(
      r => r.startTime && r.endTime && r.categoryName.trim() !== ""
    );

    if (validRanges.length === 0) return;

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
    if (activeMethod === 'keywords') {
      const validCategories = keywordCategories.filter(
        cat => cat.nombre.trim() !== "" && cat.frasesClave.length > 0
      );
      onApplyCategories({
        method: 'keywords',
        keywordCategories: validCategories
      });
    } else {
      // Save current file ranges first if needed
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
          Aplicar Categorías ({activeMethod === 'keywords' ? 'Por Palabras Clave' : 'Por Tiempo'})
        </Button>
      </CardContent>
    </Card>
  );
};

export default CategoryConfig;
