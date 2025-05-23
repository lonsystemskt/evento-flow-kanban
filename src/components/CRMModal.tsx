
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
import { CRM } from '@/types/event';

interface CRMModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (crm: Omit<CRM, 'id'>) => void;
  editingCRM?: CRM | null;
}

const CRMModal = ({ isOpen, onClose, onSave, editingCRM }: CRMModalProps) => {
  const [name, setName] = useState('');
  const [contact, setContact] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (editingCRM) {
      setName(editingCRM.name);
      setContact(editingCRM.contact);
      setEmail(editingCRM.email);
      setSubject(editingCRM.subject);
      setDate(editingCRM.date);
      setCompleted(editingCRM.completed);
    } else {
      setName('');
      setContact('');
      setEmail('');
      setSubject('');
      setDate(new Date());
      setCompleted(false);
    }
  }, [editingCRM]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && contact && date) {
      onSave({
        name,
        contact,
        email,
        subject,
        file: '', // Mantendo campo vazio para compatibilidade
        date,
        completed
      });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-[#1A1F2B] rounded-xl border border-gray-200 dark:border-gray-800">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#2E3A59] dark:text-white text-left">
            {editingCRM ? 'Editar Registro CRM' : 'Novo Registro CRM'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-sm font-medium text-[#2E3A59] dark:text-white text-left block">Nome</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 dark:bg-[#292f3d] dark:border-gray-700 dark:text-white"
              required
            />
          </div>

          <div>
            <Label htmlFor="contact" className="text-sm font-medium text-[#2E3A59] dark:text-white text-left block">Contato (Telefone/WhatsApp)</Label>
            <Input
              id="contact"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="mt-1 dark:bg-[#292f3d] dark:border-gray-700 dark:text-white"
              required
            />
          </div>

          <div>
            <Label htmlFor="email" className="text-sm font-medium text-[#2E3A59] dark:text-white text-left block">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 dark:bg-[#292f3d] dark:border-gray-700 dark:text-white"
            />
          </div>

          <div>
            <Label htmlFor="subject" className="text-sm font-medium text-[#2E3A59] dark:text-white text-left block">Assunto</Label>
            <Textarea
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1 dark:bg-[#292f3d] dark:border-gray-700 dark:text-white"
              rows={3}
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-[#2E3A59] dark:text-white text-left block">Data</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal mt-1 dark:bg-[#292f3d] dark:border-gray-700 dark:text-white",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "dd/MM/yyyy") : <span>Selecione uma data</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 dark:bg-[#1A1F2B]" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  className="pointer-events-auto dark:bg-[#1A1F2B] dark:text-white"
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="completed"
              checked={completed}
              onChange={(e) => setCompleted(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded dark:bg-[#292f3d] dark:border-gray-700"
            />
            <Label htmlFor="completed" className="text-sm font-medium text-[#2E3A59] dark:text-white">OK</Label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="dark:bg-[#292f3d] dark:border-gray-700 dark:text-white">
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-[#467BCA] to-[#77D1A8] hover:opacity-90 text-white"
            >
              {editingCRM ? 'Atualizar' : 'Salvar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CRMModal;
