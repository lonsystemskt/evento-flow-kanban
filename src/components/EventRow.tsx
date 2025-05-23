
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
      const scrollAmount = 320;
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
    <div className="bg-white rounded-xl border border-slate-200/60 shadow-sm hover:shadow-lg transition-all duration-300 p-4 relative overflow-hidden">
      <div className="flex items-center gap-4 h-16">
        {/* Fixed Event Info Section - Left Side */}
        <div className="flex items-center gap-3 w-80 flex-shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center cursor-pointer hover:scale-105 transition-transform duration-200 shadow-md relative group">
                {event.logo ? (
                  <img src={event.logo} alt={event.name} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <span className="text-white font-bold text-sm">{event.name.charAt(0).toUpperCase()}</span>
                )}
                <div className="absolute inset-0 bg-black/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 bg-white/95 backdrop-blur-sm border border-slate-200/60">
              <DropdownMenuItem onClick={() => onEditEvent(event)} className="cursor-pointer hover:bg-slate-50">
                <Edit className="w-4 h-4 mr-2" />
                Editar evento
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onArchiveEvent(event.id)} className="cursor-pointer hover:bg-slate-50">
                <Archive className="w-4 h-4 mr-2" />
                Arquivar evento
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDeleteEvent(event.id)} 
                className="cursor-pointer text-red-600 focus:text-red-600 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir evento
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-slate-800 truncate leading-tight">{event.name}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{event.date.toLocaleDateString('pt-BR')}</p>
          </div>

          <Button
            onClick={handleAddDemand}
            size="sm"
            className="w-8 h-8 rounded-full bg-gradient-to-r from-emerald-500 to-green-500 hover:from-emerald-600 hover:to-green-600 text-white p-0 shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105 flex-shrink-0"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Demands Section - Right Side */}
        <div className="flex-1 relative min-w-0">
          {activeDemands.length > 0 ? (
            <>
              {/* Navigation Arrows */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => scroll('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white/90 hover:bg-white shadow-md backdrop-blur-sm border border-slate-200/60 transition-all duration-200 hover:scale-105"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => scroll('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-7 h-7 rounded-full bg-white/90 hover:bg-white shadow-md backdrop-blur-sm border border-slate-200/60 transition-all duration-200 hover:scale-105"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>

              {/* Cards Container */}
              <div 
                ref={scrollContainerRef}
                className="flex gap-3 overflow-x-auto scrollbar-hide py-1 px-8"
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
            <div className="text-center py-4 text-slate-400">
              <p className="text-xs">Nenhuma demanda criada</p>
            </div>
          )}
        </div>
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
