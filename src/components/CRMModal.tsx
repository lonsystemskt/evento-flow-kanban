
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Upload } from 'lucide-react';
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
  const [file, setFile] = useState('');
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (editingCRM) {
      setName(editingCRM.name);
      setContact(editingCRM.contact);
      setEmail(editingCRM.email);
      setSubject(editingCRM.subject);
      setFile(editingCRM.file || '');
      setDate(editingCRM.date);
      setCompleted(editingCRM.completed);
      setUploadedFile(null);
    } else {
      setName('');
      setContact('');
      setEmail('');
      setSubject('');
      setFile('');
      setDate(new Date());
      setCompleted(false);
      setUploadedFile(null);
    }
  }, [editingCRM]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setUploadedFile(selectedFile);
      // Create a URL for the file so it can be accessed later
      const fileUrl = URL.createObjectURL(selectedFile);
      setFile(fileUrl);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && contact && date) {
      onSave({
        name,
        contact,
        email,
        subject,
        file,
        date,
        completed
      });
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white rounded-xl border border-gray-200">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-[#122A3A]">
            {editingCRM ? 'Editar Registro CRM' : 'Novo Registro CRM'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-sm font-medium text-[#122A3A]">Nome</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="contact" className="text-sm font-medium text-[#122A3A]">Contato (Telefone/WhatsApp)</Label>
            <Input
              id="contact"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              className="mt-1"
              required
            />
          </div>

          <div>
            <Label htmlFor="email" className="text-sm font-medium text-[#122A3A]">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <Label htmlFor="subject" className="text-sm font-medium text-[#122A3A]">Assunto</Label>
            <Textarea
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1"
              rows={3}
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-[#122A3A]">Arquivo</Label>
            <div className="mt-1 flex items-center gap-2">
              <Input
                type="file"
                onChange={handleFileUpload}
                className="flex-1"
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.txt"
              />
              <Button type="button" variant="outline" size="sm" asChild>
                <label className="cursor-pointer">
                  <Upload className="w-4 h-4" />
                </label>
              </Button>
            </div>
            {uploadedFile && (
              <p className="text-xs text-green-600 mt-1">
                Arquivo selecionado: {uploadedFile.name}
              </p>
            )}
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

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="completed"
              checked={completed}
              onChange={(e) => setCompleted(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <Label htmlFor="completed" className="text-sm font-medium text-[#122A3A]">OK</Label>
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
