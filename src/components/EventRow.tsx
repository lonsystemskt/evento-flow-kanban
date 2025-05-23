
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

  console.log('EventRow rendering with event:', event);
  console.log('Event demands:', event.demands);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = 190;
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
  console.log('Active demands:', activeDemands);

  return (
    <div className="py-1 px-2 relative bg-transparent border-b border-gray-200/20 hover:bg-gray-50/20 transition-all duration-200">
      <div className="flex items-center gap-3 min-h-[100px]">
        {/* Fixed Event Info Section - Left Side */}
        <div className="flex items-center gap-2 w-44 flex-shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-50/50 to-green-50/50 rounded-full flex items-center justify-center cursor-pointer hover:bg-gradient-to-br hover:from-blue-100/50 hover:to-green-100/50 transition-all duration-200 relative group">
                {event.logo ? (
                  <img src={event.logo} alt={event.name} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <span className="text-[#122A3A] font-bold text-base">{event.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-44 bg-white rounded-lg z-50">
              <DropdownMenuItem onClick={() => onEditEvent(event)} className="cursor-pointer hover:bg-gray-50 text-xs">
                <Edit className="w-3 h-3 mr-2" />
                Editar evento
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onArchiveEvent(event.id)} className="cursor-pointer hover:bg-gray-50 text-xs">
                <Archive className="w-3 h-3 mr-2" />
                Arquivar evento
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDeleteEvent(event.id)} 
                className="cursor-pointer text-red-500 focus:text-red-500 hover:bg-red-50 text-xs"
              >
                <Trash2 className="w-3 h-3 mr-2" />
                Excluir evento
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex-1 min-w-0 max-w-[100px] flex flex-col">
            <h3 className="text-sm font-bold text-[#122A3A] truncate leading-tight mb-0.5">{event.name}</h3>
            <p className="text-[11px] text-[#122A3A]/60 font-bold">{event.date.toLocaleDateString('pt-BR')}</p>
          </div>

          <Button
            onClick={handleAddDemand}
            size="sm"
            className="w-6 h-6 rounded-full bg-gradient-to-r from-[#467BCA] to-[#77D1A8] hover:opacity-90 text-white p-0 transition-all duration-200 hover:scale-105 flex-shrink-0"
          >
            <Plus className="w-3 h-3" />
          </Button>
        </div>

        {/* Separator - Very subtle */}
        <div className="w-px h-8 bg-gray-100/40"></div>

        {/* Demands Section - Right Side */}
        <div className="flex-1 relative min-w-0">
          {activeDemands.length > 0 ? (
            <>
              {/* Navigation Arrows */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => scroll('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-6 h-6 rounded-full bg-white hover:bg-gray-50 border-0 backdrop-blur-sm"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => scroll('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-6 h-6 rounded-full bg-white hover:bg-gray-50 border-0 backdrop-blur-sm"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </Button>

              {/* Cards Container */}
              <div 
                ref={scrollContainerRef}
                className="flex gap-2 overflow-x-auto scrollbar-hide py-1 px-6"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', minHeight: '100px' }}
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
            <div className="text-center py-3 text-[#122A3A]/50 bg-gray-50/20 rounded-lg border border-dashed border-gray-200/30">
              <p className="text-xs font-medium mb-0.5">Sem demandas</p>
              <p className="text-[10px]">Clique no botão + para criar uma nova demanda</p>
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
