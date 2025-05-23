
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
import { Note } from '@/types/event';

interface NotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: Omit<Note, 'id'>) => void;
  editingNote?: Note | null;
}

const NotesModal = ({ isOpen, onClose, onSave, editingNote }: NotesModalProps) => {
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [author, setAuthor] = useState<'Thiago' | 'Kalil'>('Thiago');

  useEffect(() => {
    if (editingNote) {
      setTitle(editingNote.title);
      setSubject(editingNote.subject);
      setDate(editingNote.date);
      setAuthor(editingNote.author);
    } else {
      setTitle('');
      setSubject('');
      setDate(new Date());
      setAuthor('Thiago');
    }
  }, [editingNote]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title && subject && date) {
      onSave({
        title,
        subject,
        date,
        author
      });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white rounded-xl border border-gray-200">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#122A3A]">
            {editingNote ? 'Editar Anotação' : 'Nova Anotação'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="title" className="text-sm font-medium text-[#122A3A]">Título</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="subject" className="text-sm font-medium text-[#122A3A]">Assunto</Label>
            <Textarea
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1"
              rows={4}
              required
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-[#122A3A]">Data</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal mt-1",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "dd/MM/yyyy") : <span>Selecione uma data</span>}
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

          <div>
            <Label className="text-sm font-medium text-[#122A3A]">Autor</Label>
            <div className="mt-1 flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="Thiago"
                  checked={author === 'Thiago'}
                  onChange={(e) => setAuthor(e.target.value as 'Thiago' | 'Kalil')}
                  className="mr-2"
                />
                <span className="text-sm text-[#122A3A]">Thiago</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="Kalil"
                  checked={author === 'Kalil'}
                  onChange={(e) => setAuthor(e.target.value as 'Thiago' | 'Kalil')}
                  className="mr-2"
                />
                <span className="text-sm text-[#122A3A]">Kalil</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-[#467BCA] to-[#77D1A8] hover:opacity-90 text-white"
            >
              {editingNote ? 'Atualizar' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NotesModal;
