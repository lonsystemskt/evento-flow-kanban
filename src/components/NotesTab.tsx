
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Edit, Plus } from 'lucide-react';
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
          notes.map((note) => (
            <div key={note.id} className="bg-gray-50/40 rounded-lg border border-gray-200/30 p-4 hover:bg-gray-50/60 transition-all duration-200">
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-semibold text-[#122A3A] text-sm line-clamp-2 flex-1 text-left">{note.title}</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditNote(note)}
                  className="w-6 h-6 p-0 hover:bg-blue-50 hover:text-blue-600 rounded-md transition-colors duration-200 flex-shrink-0 ml-2"
                >
                  <Edit className="w-3 h-3" />
                </Button>
              </div>
              
              <p className="text-[#122A3A]/60 text-xs mb-3 line-clamp-3 leading-relaxed text-left">{note.subject}</p>
              
              <div className="flex items-center justify-between text-xs">
                <span className="text-[#122A3A]/50 font-medium">
                  {note.date.toLocaleDateString('pt-BR')}
                </span>
                <span className="bg-gradient-to-r from-[#467BCA] to-[#77D1A8] text-white px-2 py-1 rounded-full text-xs font-medium">
                  {note.author}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-left py-20 bg-white rounded-xl border border-gray-200 shadow-sm px-6">
            <div className="text-6xl mb-6">📝</div>
            <p className="text-xl font-medium text-[#122A3A] mb-3">Nenhuma anotação</p>
            <p className="text-base text-[#122A3A]/70">Clique em "Nova Anotação" para começar</p>
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
