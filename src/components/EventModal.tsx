
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
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; date?: string }>({});

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
    setErrors({});
    setIsSaving(false);
  }, [editingEvent, isOpen]);

  const validateForm = () => {
    const newErrors: { name?: string; date?: string } = {};
    
    if (!name.trim()) {
      newErrors.name = 'Nome do evento é obrigatório';
    }
    
    if (!date) {
      newErrors.date = 'Data do evento é obrigatória';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm() || isSaving) return;

    try {
      setIsSaving(true);
      console.log('💾 Salvando evento:', { name: name.trim(), date, logo });
      
      await onSave({
        name: name.trim(),
        date: date!,
        logo: logo || undefined
      });

      // Reset form only if not editing (creation mode)
      if (!editingEvent) {
        setName('');
        setDate(undefined);
        setLogo('');
      }
    } catch (error) {
      console.error('❌ Erro ao salvar evento:', error);
      // Error handling is done in the parent component
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (limit to 1MB to prevent database issues)
      if (file.size > 1024 * 1024) {
        alert('Arquivo muito grande. Máximo 1MB.');
        return;
      }
      
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        // Further limit base64 string size
        if (result.length > 100000) {
          alert('Imagem muito grande após conversão. Tente uma imagem menor.');
          return;
        }
        setLogo(result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleClose = () => {
    if (!isSaving) {
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
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
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors(prev => ({ ...prev, name: undefined }));
              }}
              placeholder="Digite o nome do evento"
              className={cn(
                "w-full text-sm",
                errors.name && "border-red-500"
              )}
              disabled={isSaving}
            />
            {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Data do evento *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  disabled={isSaving}
                  className={cn(
                    "w-full justify-start text-left font-normal text-sm",
                    !date && "text-muted-foreground",
                    errors.date && "border-red-500"
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
                  onSelect={(selectedDate) => {
                    setDate(selectedDate);
                    if (errors.date) setErrors(prev => ({ ...prev, date: undefined }));
                  }}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
            {errors.date && <p className="text-red-500 text-xs">{errors.date}</p>}
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
                  disabled={isSaving}
                />
                <Label
                  htmlFor="logo-upload"
                  className={cn(
                    "cursor-pointer inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors",
                    isSaving && "opacity-50 cursor-not-allowed"
                  )}
                >
                  Escolher arquivo
                </Label>
                <p className="text-xs text-slate-500 mt-1">Máximo 1MB - Formato circular preferencial</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button 
            variant="outline" 
            onClick={handleClose} 
            className="text-sm"
            disabled={isSaving}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!name.trim() || !date || isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm disabled:opacity-50"
          >
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EventModal;
