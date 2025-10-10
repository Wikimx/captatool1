
import React, { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface YearInputDialogProps {
  isOpen: boolean;
  onClose: (date?: string) => void;
  defaultYear?: string;
}

const MONTHS = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

const YearInputDialog: React.FC<YearInputDialogProps> = ({
  isOpen,
  onClose,
  defaultYear = new Date().getFullYear().toString()
}) => {
  const [month, setMonth] = useState<string>("Enero");
  const [year, setYear] = useState<string>(defaultYear);

  const handleConfirm = () => {
    const formattedDate = `${month} ${year}`;
    onClose(formattedDate);
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Fecha de sesiones</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="month-select">Mes:</Label>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger id="month-select">
                <SelectValue placeholder="Seleccione el mes" />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="year-input">Año:</Label>
            <Input
              id="year-input"
              type="text"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="2025"
              className="w-full"
            />
          </div>
          <p className="text-sm text-muted-foreground">
            Este valor se usará para la columna "Fecha de sesiones" en todos los documentos de este lote.
          </p>
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
