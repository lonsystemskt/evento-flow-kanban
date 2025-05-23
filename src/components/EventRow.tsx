
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus, ChevronLeft, ChevronRight, Edit, Archive, Trash2 } from 'lucide-react';
import { Event, Demand } from '@/types/event';
import DemandCard from './DemandCard';
import DemandModal from './DemandModal';

interface EventRowProps {
  event: Event;
  onAddDemand: (eventId: string, demand: Omit<Demand, 'id' | 'eventId' | 'completed' | 'urgency'>) => void;
  onUpdateDemand: (eventId: string, demandId: string, demand: Partial<Demand>) => void;
  onDeleteDemand: (eventId: string, demandId: string) => void;
  onEditEvent: (event: Event) => void;
  onArchiveEvent: (eventId: string) => void;
  onDeleteEvent: (eventId: string) => void;
}

const EventRow = ({ 
  event, 
  onAddDemand, 
  onUpdateDemand, 
  onDeleteDemand, 
  onEditEvent, 
  onArchiveEvent, 
  onDeleteEvent 
}: EventRowProps) => {
  const [isDemandModalOpen, setIsDemandModalOpen] = useState(false);
  const [editingDemand, setEditingDemand] = useState<Demand | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 320; // Card width + gap
      const currentScroll = scrollContainerRef.current.scrollLeft;
      const newScroll = direction === 'left' 
        ? currentScroll - scrollAmount 
        : currentScroll + scrollAmount;
      
      scrollContainerRef.current.scrollTo({
        left: newScroll,
        behavior: 'smooth'
      });
    }
  };

  const handleAddDemand = () => {
    setEditingDemand(null);
    setIsDemandModalOpen(true);
  };

  const handleEditDemand = (demand: Demand) => {
    setEditingDemand(demand);
    setIsDemandModalOpen(true);
  };

  const handleSaveDemand = (demandData: Omit<Demand, 'id' | 'eventId' | 'completed' | 'urgency'>) => {
    if (editingDemand) {
      onUpdateDemand(event.id, editingDemand.id, demandData);
    } else {
      onAddDemand(event.id, demandData);
    }
    setIsDemandModalOpen(false);
    setEditingDemand(null);
  };

  const activeDemands = event.demands.filter(demand => !demand.completed);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-200 p-6">
      <div className="flex items-center gap-4 mb-4">
        {/* Event Info Section */}
        <div className="flex items-center gap-4 min-w-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center cursor-pointer hover:scale-105 transition-transform duration-200 shadow-lg">
                {event.logo ? (
                  <img src={event.logo} alt={event.name} className="w-14 h-14 rounded-full object-cover" />
                ) : (
                  <span className="text-white font-bold text-lg">{event.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuItem onClick={() => onEditEvent(event)} className="cursor-pointer">
                <Edit className="w-4 h-4 mr-2" />
                Editar evento
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onArchiveEvent(event.id)} className="cursor-pointer">
                <Archive className="w-4 h-4 mr-2" />
                Arquivar evento
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDeleteEvent(event.id)} 
                className="cursor-pointer text-red-600 focus:text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir evento
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-slate-800 truncate">{event.name}</h3>
            <p className="text-sm text-slate-600">{event.date.toLocaleDateString('pt-BR')}</p>
          </div>
        </div>

        {/* Add Demand Button */}
        <Button
          onClick={handleAddDemand}
          size="sm"
          className="w-8 h-8 rounded-full bg-green-500 hover:bg-green-600 text-white p-0 shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      {/* Demands Section */}
      <div className="relative">
        {activeDemands.length > 0 ? (
          <>
            {/* Navigation Arrows */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/90 hover:bg-white shadow-lg backdrop-blur-sm border border-slate-200"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white/90 hover:bg-white shadow-lg backdrop-blur-sm border border-slate-200"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>

            {/* Cards Container */}
            <div 
              ref={scrollContainerRef}
              className="flex gap-4 overflow-x-auto scrollbar-hide py-2 px-10"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {activeDemands.map(demand => (
                <DemandCard
                  key={demand.id}
                  demand={demand}
                  onEdit={() => handleEditDemand(demand)}
                  onDelete={() => onDeleteDemand(event.id, demand.id)}
                  onComplete={() => onUpdateDemand(event.id, demand.id, { completed: true })}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-8 text-slate-400">
            <p className="text-sm">Nenhuma demanda criada</p>
            <p className="text-xs">Clique no botão "+" para adicionar</p>
          </div>
        )}
      </div>

      <DemandModal
        isOpen={isDemandModalOpen}
        onClose={() => {
          setIsDemandModalOpen(false);
          setEditingDemand(null);
        }}
        onSave={handleSaveDemand}
        editingDemand={editingDemand}
      />
    </div>
  );
};

export default EventRow;
