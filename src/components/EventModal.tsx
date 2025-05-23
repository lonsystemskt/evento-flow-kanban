
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Upload } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Event } from '@/types/event';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: Omit<Event, 'id' | 'archived' | 'demands'>) => void;
  editingEvent?: Event | null;
}

const EventModal = ({ isOpen, onClose, onSave, editingEvent }: EventModalProps) => {
  const [name, setName] = useState('');
  const [date, setDate] = useState<Date>();
  const [logo, setLogo] = useState<string>('');

  useEffect(() => {
    if (editingEvent) {
      setName(editingEvent.name);
      setDate(editingEvent.date);
      setLogo(editingEvent.logo || '');
    } else {
      setName('');
      setDate(undefined);
      setLogo('');
    }
  }, [editingEvent, isOpen]);

  const handleSave = () => {
    if (!name.trim() || !date) return;

    onSave({
      name: name.trim(),
      date,
      logo: logo || undefined
    });

    // Reset form only if not editing
    if (!editingEvent) {
      setName('');
      setDate(undefined);
      setLogo('');
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogo(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {editingEvent ? 'Editar Evento' : 'Novo Evento'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">Nome do evento *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digite o nome do evento"
              className="w-full text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Data do evento *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal text-sm",
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

          <div className="space-y-2">
            <Label className="text-sm font-medium">Logo do evento</Label>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center border-2 border-dashed border-slate-300">
                {logo ? (
                  <img src={logo} alt="Logo" className="w-16 h-16 rounded-full object-cover" />
                ) : (
                  <Upload className="w-6 h-6 text-slate-400" />
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  id="logo-upload"
                />
                <Label
                  htmlFor="logo-upload"
                  className="cursor-pointer inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors"
                >
                  Escolher arquivo
                </Label>
                <p className="text-xs text-slate-500 mt-1">Formato circular preferencial</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={onClose} className="text-sm">
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!name.trim() || !date}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm"
          >
            Salvar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventModal;
