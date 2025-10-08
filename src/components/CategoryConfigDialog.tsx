import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Trash2, Plus } from "lucide-react";
import { CategoryDefinition } from "@/types/document";

interface CategoryConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (categories: CategoryDefinition[]) => void;
}

const CategoryConfigDialog: React.FC<CategoryConfigDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [categories, setCategories] = useState<CategoryDefinition[]>([
    { nombre: "", frasesClave: [] }
  ]);

  const handleAddCategory = () => {
    setCategories([...categories, { nombre: "", frasesClave: [] }]);
  };

  const handleRemoveCategory = (index: number) => {
    if (categories.length > 1) {
      setCategories(categories.filter((_, i) => i !== index));
    }
  };

  const handleCategoryNameChange = (index: number, nombre: string) => {
    const updated = [...categories];
    updated[index].nombre = nombre;
    setCategories(updated);
  };

  const handleFrasesChange = (index: number, frases: string) => {
    const updated = [...categories];
    updated[index].frasesClave = frases
      .split(",")
      .map(f => f.trim())
      .filter(f => f.length > 0);
    setCategories(updated);
  };

  const handleConfirm = () => {
    const validCategories = categories.filter(
      cat => cat.nombre.trim() !== "" && cat.frasesClave.length > 0
    );
    onConfirm(validCategories);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Configurar Categorías de Bloque</DialogTitle>
          <DialogDescription>
            Define las categorías y las palabras o frases clave que las identifican.
            Las categorías se aplicarán cuando el moderador mencione estas frases.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
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
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor={`category-phrases-${index}`}>
                      Palabras o Frases Clave (separadas por comas)
                    </Label>
                    <Textarea
                      id={`category-phrases-${index}`}
                      value={category.frasesClave.join(", ")}
                      onChange={(e) => handleFrasesChange(index, e.target.value)}
                      placeholder="Ej: buenos días, vamos a comenzar, primera parte"
                      className="mt-1"
                      rows={3}
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
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Nueva Categoría
          </Button>

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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm}>
            Procesar Archivos
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CategoryConfigDialog;
