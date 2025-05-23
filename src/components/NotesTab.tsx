
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Plus, Trash2 } from 'lucide-react';
import { Note } from '@/types/event';
import NotesModal from './NotesModal';

interface NotesTabProps {
  notes: Note[];
  onAddNote: (note: Omit<Note, 'id'>) => void;
  onUpdateNote: (id: string, note: Partial<Note>) => void;
  onDeleteNote: (id: string) => void;
}

const NotesTab = ({ notes, onAddNote, onUpdateNote, onDeleteNote }: NotesTabProps) => {
  const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);

  const handleAddNote = () => {
    setEditingNote(null);
    setIsNotesModalOpen(true);
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setIsNotesModalOpen(true);
  };

  const handleSaveNote = (noteData: Omit<Note, 'id'>) => {
    if (editingNote) {
      onUpdateNote(editingNote.id, noteData);
    } else {
      onAddNote(noteData);
    }
    setIsNotesModalOpen(false);
    setEditingNote(null);
  };

  const handleDeleteNote = (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta anotação?')) {
      onDeleteNote(id);
    }
  };

  // Sort notes by date with most recent first (high priority)
  const sortedNotes = [...notes].sort((a, b) => {
    return a.date.getTime() - b.date.getTime();
  });

  const getPriorityColor = (date: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const noteDate = new Date(date);
    noteDate.setHours(0, 0, 0, 0);
    
    if (noteDate < today) {
      return 'bg-red-500'; // Overdue/high priority
    } else if (noteDate.getTime() === today.getTime()) {
      return 'bg-orange-500'; // Today
    } else if (noteDate.getTime() === tomorrow.getTime()) {
      return 'bg-green-500'; // Tomorrow
    } else {
      return 'bg-gray-400'; // Future
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button 
          onClick={handleAddNote}
          className="bg-gradient-to-r from-[#467BCA] to-[#77D1A8] hover:opacity-90 text-white px-6 py-3 rounded-xl flex items-center gap-3 transition-all duration-200 shadow-lg hover:shadow-xl text-base font-medium"
        >
          <Plus className="w-5 h-5" />
          Nova Anotação
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {notes.length > 0 ? (
          sortedNotes.map((note) => (
            <div key={note.id} className="bg-[#F6F7FB] dark:bg-[#1A1F2B] rounded-lg border border-[rgba(0,0,0,0.05)] dark:border-[rgba(60,60,60,0.1)] p-4 hover:bg-[#F0F2F7] dark:hover:bg-[#212736] transition-all duration-200 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${getPriorityColor(note.date)} flex-shrink-0`}></div>
                  <h4 className="font-semibold text-[#2E3A59] dark:text-white text-sm line-clamp-2 flex-1 text-left">{note.title}</h4>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditNote(note)}
                    className="w-6 h-6 p-0 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 rounded-md transition-colors duration-200 flex-shrink-0"
                  >
                    <Edit className="w-3 h-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteNote(note.id)}
                    className="w-6 h-6 p-0 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 rounded-md transition-colors duration-200 flex-shrink-0"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              
              <p className="text-[#3B4D63] dark:text-gray-300 text-xs mb-3 line-clamp-3 leading-relaxed text-left">{note.subject}</p>
              
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#3B4D63]/50 dark:text-gray-400 font-medium">
                  {note.date.toLocaleDateString('pt-BR')}
                </span>
                <span className="bg-gradient-to-r from-[#467BCA] to-[#77D1A8] text-white px-2 py-1 rounded-full text-xs font-medium">
                  {note.author}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-left py-20 bg-[#F6F7FB] dark:bg-[#1A1F2B] rounded-xl border border-[rgba(0,0,0,0.05)] dark:border-[rgba(60,60,60,0.1)] shadow-sm px-6">
            <div className="text-6xl mb-6">📝</div>
            <p className="text-xl font-medium text-[#2E3A59] dark:text-white mb-3">Nenhuma anotação</p>
            <p className="text-base text-[#3B4D63] dark:text-gray-300">Clique em "Nova Anotação" para começar</p>
          </div>
        )}
      </div>

      <NotesModal
        isOpen={isNotesModalOpen}
        onClose={() => {
          setIsNotesModalOpen(false);
          setEditingNote(null);
        }}
        onSave={handleSaveNote}
        editingNote={editingNote}
      />
    </div>
  );
};

export default NotesTab;
