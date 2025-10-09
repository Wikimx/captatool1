import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trash2, Plus, Table } from "lucide-react";
import { CategoryDefinition } from "@/types/document";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CategoryConfigProps {
  onApplyCategories: (categories: CategoryDefinition[]) => void;
  isDisabled?: boolean;
}

const CategoryConfig: React.FC<CategoryConfigProps> = ({
  onApplyCategories,
  isDisabled = false
}) => {
  const [categories, setCategories] = useState<CategoryDefinition[]>([
    { nombre: "", frasesClave: [] }
  ]);
  
  const [textInputs, setTextInputs] = useState<string[]>([""]);
  const [bulkInput, setBulkInput] = useState<string>("");

  const handleAddCategory = () => {
    setCategories([...categories, { nombre: "", frasesClave: [] }]);
    setTextInputs([...textInputs, ""]);
  };

  const handleRemoveCategory = (index: number) => {
    if (categories.length > 1) {
      setCategories(categories.filter((_, i) => i !== index));
      setTextInputs(textInputs.filter((_, i) => i !== index));
    }
  };

  const handleCategoryNameChange = (index: number, nombre: string) => {
    const updated = [...categories];
    updated[index].nombre = nombre;
    setCategories(updated);
  };

  const handleFrasesChange = (index: number, text: string) => {
    const updatedTexts = [...textInputs];
    updatedTexts[index] = text;
    setTextInputs(updatedTexts);
    
    const updated = [...categories];
    updated[index].frasesClave = text
      .split(",")
      .map(f => f.trim())
      .filter(f => f.length > 0);
    setCategories(updated);
  };

  const handleBulkInputChange = (text: string) => {
    setBulkInput(text);
    
    // Parse the pasted data
    const lines = text.split('\n').filter(line => line.trim() !== '');
    const parsedCategories: CategoryDefinition[] = [];
    
    lines.forEach(line => {
      // Split by tab (Excel copy-paste) or by pipe |
      const parts = line.includes('\t') ? line.split('\t') : line.split('|');
      
      if (parts.length >= 2) {
        const nombre = parts[0].trim();
        const frases = parts[1]
          .split(',')
          .map(f => f.trim())
          .filter(f => f.length > 0);
        
        if (nombre && frases.length > 0) {
          parsedCategories.push({ nombre, frasesClave: frases });
        }
      }
    });
    
    if (parsedCategories.length > 0) {
      setCategories(parsedCategories);
      setTextInputs(parsedCategories.map(cat => cat.frasesClave.join(", ")));
    }
  };

  const handleApply = () => {
    const validCategories = categories.filter(
      cat => cat.nombre.trim() !== "" && cat.frasesClave.length > 0
    );
    onApplyCategories(validCategories);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurar Categorías de Bloque</CardTitle>
        <CardDescription>
          Define las categorías y las palabras o frases clave que las identifican.
          Las categorías se aplicarán cuando el moderador mencione estas frases.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Tabs defaultValue="bulk" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="bulk">
              <Table className="h-4 w-4 mr-2" />
              Copiar/Pegar desde Excel
            </TabsTrigger>
            <TabsTrigger value="manual">
              <Plus className="h-4 w-4 mr-2" />
              Manual
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="bulk" className="space-y-4">
            <div>
              <Label htmlFor="bulk-input">
                Pega aquí tus datos desde Excel o tabla
              </Label>
              <p className="text-xs text-muted-foreground mt-1 mb-2">
                Formato: Nombre de Categoría [TAB o |] palabra1, palabra2, palabra3
              </p>
              <div className="mb-2 p-2 bg-muted/50 rounded text-xs font-mono">
                <div className="text-muted-foreground">Ejemplo:</div>
                <div>Introducción | buenos días, vamos a comenzar, primera parte</div>
                <div>Desarrollo | ahora vamos a hablar de, siguiente tema</div>
                <div>Cierre | muchas gracias, hasta luego, nos vemos</div>
              </div>
              <Textarea
                id="bulk-input"
                value={bulkInput}
                onChange={(e) => handleBulkInputChange(e.target.value)}
                placeholder="Introducción	buenos días, vamos a comenzar, primera parte"
                className="min-h-[150px] font-mono text-sm"
                disabled={isDisabled}
              />
              <p className="text-xs text-muted-foreground mt-2">
                💡 Tip: Copia directamente desde Excel (dos columnas) o separa nombre y frases con el símbolo |
              </p>
            </div>
          </TabsContent>
          
          <TabsContent value="manual" className="space-y-4">
            {categories.map((category, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-4 relative">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 space-y-4">
                    <div>
                      <Label htmlFor={`category-name-${index}`}>
                        Nombre de la Categoría
                      </Label>
                      <Input
                        id={`category-name-${index}`}
                        value={category.nombre}
                        onChange={(e) => handleCategoryNameChange(index, e.target.value)}
                        placeholder="Ej: Introducción, Desarrollo, Cierre"
                        className="mt-1"
                        disabled={isDisabled}
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor={`category-phrases-${index}`}>
                        Palabras o Frases Clave (separadas por comas)
                      </Label>
                      <p className="text-sm text-muted-foreground mb-1">
                        Recuerda poner todo en minúsculas.
                      </p>
                      <Textarea
                        id={`category-phrases-${index}`}
                        value={textInputs[index] || ""}
                        onChange={(e) => handleFrasesChange(index, e.target.value)}
                        placeholder="Ej: buenos días, vamos a comenzar, primera parte"
                        className="mt-1"
                        rows={3}
                        disabled={isDisabled}
                      />
                      {category.frasesClave.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {category.frasesClave.map((frase, i) => (
                            <span
                              key={i}
                              className="text-xs bg-primary/10 text-primary px-2 py-1 rounded"
                            >
                              {frase}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {categories.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveCategory(index)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      disabled={isDisabled}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}

            <Button
              variant="outline"
              onClick={handleAddCategory}
              className="w-full"
              disabled={isDisabled}
            >
              <Plus className="h-4 w-4 mr-2" />
              Agregar Nueva Categoría
            </Button>
          </TabsContent>
        </Tabs>

        {categories.length > 0 && (
          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Resumen de Categorías:</h4>
            <div className="space-y-2 text-sm">
              {categories
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

        <Button 
          onClick={handleApply} 
          className="w-full"
          disabled={isDisabled || categories.every(cat => cat.nombre.trim() === "" || cat.frasesClave.length === 0)}
        >
          Aplicar Categorías
        </Button>
      </CardContent>
    </Card>
  );
};

export default CategoryConfig;
