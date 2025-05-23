
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
      const scrollAmount = 340;
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
    <div className="bg-white rounded-xl border border-gray-200 hover:border-blue-200 hover:shadow-lg transition-all duration-200 p-6 relative overflow-hidden shadow-md">
      <div className="flex items-center gap-6 min-h-[280px]">
        {/* Fixed Event Info Section - Left Side */}
        <div className="flex items-center gap-4 w-72 flex-shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="w-12 h-12 bg-gradient-to-br from-blue-50 to-green-50 rounded-full flex items-center justify-center cursor-pointer hover:bg-gradient-to-br hover:from-blue-100 hover:to-green-100 transition-all duration-200 relative group border-2 border-gray-100">
                {event.logo ? (
                  <img src={event.logo} alt={event.name} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <span className="text-[#122A3A] font-bold text-lg">{event.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 bg-white border border-gray-100 rounded-xl shadow-lg">
              <DropdownMenuItem onClick={() => onEditEvent(event)} className="cursor-pointer hover:bg-gray-50">
                <Edit className="w-4 h-4 mr-2" />
                Editar evento
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onArchiveEvent(event.id)} className="cursor-pointer hover:bg-gray-50">
                <Archive className="w-4 h-4 mr-2" />
                Arquivar evento
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={() => onDeleteEvent(event.id)} 
                className="cursor-pointer text-red-500 focus:text-red-500 hover:bg-red-50"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Excluir evento
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <div className="flex-1 min-w-0 max-w-[180px]">
            <h3 className="text-lg font-bold text-[#122A3A] truncate leading-tight mb-1">{event.name}</h3>
            <p className="text-sm text-[#122A3A]/60 font-medium">{event.date.toLocaleDateString('pt-BR')}</p>
          </div>

          <Button
            onClick={handleAddDemand}
            size="sm"
            className="w-10 h-10 rounded-full bg-gradient-to-r from-[#467BCA] to-[#77D1A8] hover:opacity-90 text-white p-0 transition-all duration-200 hover:scale-105 flex-shrink-0 shadow-md"
          >
            <Plus className="w-5 h-5" />
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
                className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white hover:bg-gray-50 border border-gray-200 shadow-lg transition-all duration-200"
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => scroll('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white hover:bg-gray-50 border border-gray-200 shadow-lg transition-all duration-200"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>

              {/* Cards Container */}
              <div 
                ref={scrollContainerRef}
                className="flex gap-4 overflow-x-auto scrollbar-hide py-2 px-12"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', minHeight: '280px' }}
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
            <div className="text-center py-12 text-[#122A3A]/50 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
              <p className="text-lg font-medium mb-2">Sem demandas</p>
              <p className="text-sm">Clique no botão + para criar uma nova demanda</p>
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
