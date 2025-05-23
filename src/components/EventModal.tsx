
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Upload, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Event } from '@/types/event';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: Omit<Event, 'id' | 'archived' | 'demands'>) => void;
  editingEvent?: Event | null;
}

const EventModal = React.memo(({ isOpen, onClose, onSave, editingEvent }: EventModalProps) => {
  const [name, setName] = useState('');
  const [date, setDate] = useState<Date>();
  const [logo, setLogo] = useState<string>('');
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [isProcessingImage, setIsProcessingImage] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; date?: string; logo?: string }>({});

  useEffect(() => {
    if (editingEvent) {
      setName(editingEvent.name);
      setDate(editingEvent.date);
      const logoUrl = editingEvent.logo || '';
      setLogo(logoUrl);
      setLogoPreview(logoUrl);
    } else {
      setName('');
      setDate(undefined);
      setLogo('');
      setLogoPreview('');
    }
    setErrors({});
    setIsSaving(false);
    setIsProcessingImage(false);
  }, [editingEvent, isOpen]);

  const validateForm = useCallback(() => {
    const newErrors: { name?: string; date?: string; logo?: string } = {};
    
    if (!name.trim()) {
      newErrors.name = 'Nome do evento é obrigatório';
    }
    
    if (!date) {
      newErrors.date = 'Data do evento é obrigatória';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [name, date]);

  const handleSave = useCallback(async () => {
    if (!validateForm() || isSaving || isProcessingImage) return;

    try {
      setIsSaving(true);
      console.log('💾 Salvando evento:', { name: name.trim(), date, logo: logo ? 'Presente' : 'Ausente' });
      
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
        setLogoPreview('');
      }
    } catch (error) {
      console.error('❌ Erro ao salvar evento:', error);
      // Error handling is done in the parent component
    } finally {
      setIsSaving(false);
    }
  }, [validateForm, isSaving, isProcessingImage, name, date, logo, onSave, editingEvent]);

  const processImageFile = useCallback(async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      // Verificar tamanho (1MB)
      if (file.size > 1024 * 1024) {
        reject(new Error('Arquivo muito grande. Máximo 1MB.'));
        return;
      }

      // Verificar tipo
      if (!file.type.startsWith('image/')) {
        reject(new Error('Arquivo deve ser uma imagem.'));
        return;
      }

      const reader = new FileReader();
      
      reader.onload = (e) => {
        const result = e.target?.result as string;
        
        // Criar elemento de imagem para redimensionar se necessário
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Redimensionar para máximo 200x200 mantendo proporção
          const maxSize = 200;
          let { width, height } = img;
          
          if (width > maxSize || height > maxSize) {
            if (width > height) {
              height = (height * maxSize) / width;
              width = maxSize;
            } else {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          
          ctx?.drawImage(img, 0, 0, width, height);
          
          const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.8);
          
          // Verificar tamanho final
          if (optimizedDataUrl.length > 200000) { // ~150KB em base64
            reject(new Error('Imagem muito complexa. Tente uma imagem mais simples.'));
            return;
          }
          
          resolve(optimizedDataUrl);
        };
        
        img.onerror = () => reject(new Error('Erro ao processar imagem.'));
        img.src = result;
      };
      
      reader.onerror = () => reject(new Error('Erro ao ler arquivo.'));
      reader.readAsDataURL(file);
    });
  }, []);

  const handleLogoUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessingImage(true);
      setErrors(prev => ({ ...prev, logo: undefined }));
      
      const processedImage = await processImageFile(file);
      setLogo(processedImage);
      setLogoPreview(processedImage);
      
      console.log('✅ Imagem processada com sucesso');
    } catch (error) {
      console.error('❌ Erro ao processar imagem:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao processar imagem';
      setErrors(prev => ({ ...prev, logo: errorMessage }));
    } finally {
      setIsProcessingImage(false);
      // Reset input
      event.target.value = '';
    }
  }, [processImageFile]);

  const handleRemoveLogo = useCallback(() => {
    setLogo('');
    setLogoPreview('');
    setErrors(prev => ({ ...prev, logo: undefined }));
  }, []);

  const handleClose = useCallback(() => {
    if (!isSaving && !isProcessingImage) {
      onClose();
    }
  }, [isSaving, isProcessingImage, onClose]);

  const isFormValid = useMemo(() => {
    return name.trim().length > 0 && date && !isProcessingImage;
  }, [name, date, isProcessingImage]);

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
              disabled={isSaving || isProcessingImage}
            />
            {errors.name && <p className="text-red-500 text-xs">{errors.name}</p>}
          </div>

          <div className="space-y-2">
            <Label className="text-sm font-medium">Data do evento *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  disabled={isSaving || isProcessingImage}
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
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center border-2 border-dashed border-slate-300 relative">
                {logoPreview ? (
                  <>
                    <img 
                      src={logoPreview} 
                      alt="Logo" 
                      className="w-16 h-16 rounded-full object-cover"
                      onError={(e) => {
                        console.error('Erro ao carregar imagem preview');
                        setLogoPreview('');
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      disabled={isSaving || isProcessingImage}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </>
                ) : (
                  <Upload className={cn(
                    "w-6 h-6 text-slate-400",
                    isProcessingImage && "animate-pulse"
                  )} />
                )}
              </div>
              <div className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                  id="logo-upload"
                  disabled={isSaving || isProcessingImage}
                />
                <Label
                  htmlFor="logo-upload"
                  className={cn(
                    "cursor-pointer inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition-colors",
                    (isSaving || isProcessingImage) && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {isProcessingImage ? 'Processando...' : 'Escolher arquivo'}
                </Label>
                <p className="text-xs text-slate-500 mt-1">
                  Máximo 1MB - JPG, PNG ou GIF - Será otimizada automaticamente
                </p>
                {errors.logo && <p className="text-red-500 text-xs mt-1">{errors.logo}</p>}
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button 
            variant="outline" 
            onClick={handleClose} 
            className="text-sm"
            disabled={isSaving || isProcessingImage}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSave}
            disabled={!isFormValid || isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm disabled:opacity-50"
          >
            {isSaving ? 'Salvando...' : isProcessingImage ? 'Processando...' : 'Salvar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
});

EventModal.displayName = 'EventModal';

export default EventModal;
