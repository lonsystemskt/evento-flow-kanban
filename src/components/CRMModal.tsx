
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  const [status, setStatus] = useState<'Ativo' | 'Inativo'>('Ativo');

  useEffect(() => {
    if (editingCRM) {
      setName(editingCRM.name);
      setContact(editingCRM.contact);
      setEmail(editingCRM.email);
      setSubject(editingCRM.subject);
      setDate(editingCRM.date);
      setStatus(editingCRM.status || 'Ativo');
    } else {
      setName('');
      setContact('');
      setEmail('');
      setSubject('');
      setDate(new Date());
      setStatus('Ativo');
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
        completed: false, // Mantendo para compatibilidade
        status
      });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white rounded-xl border border-gray-200">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#2E3A59] text-left">
            {editingCRM ? 'Editar Registro CRM' : 'Novo Registro CRM'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-sm font-medium text-[#2E3A59] text-left block">Nome</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="contact" className="text-sm font-medium text-[#2E3A59] text-left block">Contato (Telefone/WhatsApp)</Label>
            <Input
              id="contact"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="email" className="text-sm font-medium text-[#2E3A59] text-left block">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="subject" className="text-sm font-medium text-[#2E3A59] text-left block">Assunto</Label>
            <Textarea
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-[#2E3A59] text-left block">Status</Label>
            <Select value={status} onValueChange={(value: 'Ativo' | 'Inativo') => setStatus(value)}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Selecione o status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Ativo">Ativo</SelectItem>
                <SelectItem value="Inativo">Inativo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-sm font-medium text-[#2E3A59] text-left block">Data</Label>
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

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
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
