
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Demand } from '@/types/event';

interface DemandModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (demandData: Omit<Demand, 'id' | 'eventId' | 'completed' | 'urgency'>) => void;
  editingDemand?: Demand | null;
}

const DemandModal = ({ isOpen, onClose, onSave, editingDemand }: DemandModalProps) => {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [date, setDate] = useState<Date>();

  useEffect(() => {
    if (editingDemand) {
      setTitle(editingDemand.title);
      setSubject(editingDemand.subject);
      setDate(editingDemand.date);
    } else {
      setTitle('');
      setSubject('');
      setDate(undefined);
    }
  }, [editingDemand, isOpen]);

  const handleSave = () => {
    if (!title.trim() || !subject.trim() || !date) return;

    onSave({
      title: title.trim(),
      subject: subject.trim(),
      date
    });

    // Reset form only if not editing
    if (!editingDemand) {
      setTitle('');
      setSubject('');
      setDate(undefined);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {editingDemand ? 'Editar Demanda' : 'Nova Demanda'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">Título *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Digite o título da demanda"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject" className="text-sm font-medium">Assunto *</Label>
            <Textarea
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Descreva o assunto da demanda"
              className="w-full min-h-[80px] resize-none"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Data *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "dd/MM/yyyy") : "Selecione uma data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!title.trim() || !subject.trim() || !date}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DemandModal;
