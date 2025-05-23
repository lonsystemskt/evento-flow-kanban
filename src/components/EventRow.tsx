
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
    <div className="bg-white rounded-lg border border-gray-100 hover:border-gray-200 transition-all duration-200 p-3 relative overflow-hidden">
      <div className="flex items-center gap-3 h-12">
        {/* Fixed Event Info Section - Left Side */}
        <div className="flex items-center gap-2.5 w-72 flex-shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors duration-200 relative group">
                {event.logo ? (
                  <img src={event.logo} alt={event.name} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <span className="text-gray-600 font-medium text-xs">{event.name.charAt(0).toUpperCase()}</span>
                )}
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 bg-white border border-gray-100">
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

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-900 truncate leading-tight">{event.name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{event.date.toLocaleDateString('pt-BR')}</p>
          </div>

          <Button
            onClick={handleAddDemand}
            size="sm"
            className="w-6 h-6 rounded-full bg-blue-500 hover:bg-blue-600 text-white p-0 transition-all duration-200 hover:scale-105 flex-shrink-0"
          >
            <Plus className="w-3 h-3" />
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
                className="absolute left-0 top-1/2 -translate-y-1/2 z-20 w-6 h-6 rounded-full bg-white hover:bg-gray-50 border border-gray-200 transition-all duration-200"
              >
                <ChevronLeft className="w-3 h-3" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => scroll('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-20 w-6 h-6 rounded-full bg-white hover:bg-gray-50 border border-gray-200 transition-all duration-200"
              >
                <ChevronRight className="w-3 h-3" />
              </Button>

              {/* Cards Container */}
              <div 
                ref={scrollContainerRef}
                className="flex gap-2.5 overflow-x-auto scrollbar-hide py-1 px-7"
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
            <div className="text-center py-3 text-gray-400">
              <p className="text-xs">Sem demandas</p>
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
