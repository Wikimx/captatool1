
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface YearInputDialogProps {
  isOpen: boolean;
  onClose: (year?: string) => void;
  defaultYear?: string;
}

const YearInputDialog: React.FC<YearInputDialogProps> = ({
  isOpen,
  onClose,
  defaultYear = new Date().getFullYear().toString()
}) => {
  const [year, setYear] = useState<string>(defaultYear);

  const handleConfirm = () => {
    onClose(year);
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Fecha de creación</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="year-input">Ingrese el año para este lote de documentos:</Label>
            <Input
              id="year-input"
              type="text"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="2024"
              className="w-full"
            />
            <p className="text-sm text-muted-foreground">
              Este valor se usará para la columna "Fecha de creación" en todos los documentos de este lote.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm}>
            Confirmar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default YearInputDialog;
