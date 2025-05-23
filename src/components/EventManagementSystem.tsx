
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus } from 'lucide-react';
import { Event, Demand, TabType } from '@/types/event';
import EventModal from './EventModal';
import EventRow from './EventRow';
import { v4 as uuidv4 } from 'uuid';

const EventManagementSystem = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('demands');
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  const handleCreateEvent = (eventData: Omit<Event, 'id' | 'archived' | 'demands'>) => {
    const newEvent: Event = {
      ...eventData,
      id: uuidv4(),
      archived: false,
      demands: []
    };
    setEvents(prev => [...prev, newEvent]);
    setIsEventModalOpen(false);
  };

  const handleEditEvent = (eventData: Omit<Event, 'id' | 'archived' | 'demands'>) => {
    if (!editingEvent) return;
    
    setEvents(prev => prev.map(event => 
      event.id === editingEvent.id 
        ? { ...event, ...eventData }
        : event
    ));
    setEditingEvent(null);
    setIsEventModalOpen(false);
  };

  const handleArchiveEvent = (eventId: string) => {
    setEvents(prev => prev.map(event => 
      event.id === eventId 
        ? { ...event, archived: true }
        : event
    ));
  };

  const handleDeleteEvent = (eventId: string) => {
    setEvents(prev => prev.filter(event => event.id !== eventId));
  };

  const handleRestoreEvent = (eventId: string) => {
    setEvents(prev => prev.map(event => 
      event.id === eventId 
        ? { ...event, archived: false }
        : event
    ));
  };

  const handleAddDemand = (eventId: string, demandData: Omit<Demand, 'id' | 'eventId' | 'completed' | 'urgency'>) => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    let urgency: Demand['urgency'] = 'future';
    const demandDate = new Date(demandData.date);
    
    if (demandDate < today) urgency = 'overdue';
    else if (demandDate.toDateString() === today.toDateString()) urgency = 'today';
    else if (demandDate.toDateString() === tomorrow.toDateString()) urgency = 'tomorrow';

    const newDemand: Demand = {
      ...demandData,
      id: uuidv4(),
      eventId,
      completed: false,
      urgency
    };

    setEvents(prev => prev.map(event => 
      event.id === eventId 
        ? { ...event, demands: [...event.demands, newDemand] }
        : event
    ));
  };

  const handleUpdateDemand = (eventId: string, demandId: string, demandData: Partial<Demand>) => {
    setEvents(prev => prev.map(event => 
      event.id === eventId 
        ? {
            ...event,
            demands: event.demands.map(demand => 
              demand.id === demandId 
                ? { ...demand, ...demandData }
                : demand
            )
          }
        : event
    ));
  };

  const handleDeleteDemand = (eventId: string, demandId: string) => {
    setEvents(prev => prev.map(event => 
      event.id === eventId 
        ? {
            ...event,
            demands: event.demands.filter(demand => demand.id !== demandId)
          }
        : event
    ));
  };

  const activeEvents = events.filter(event => !event.archived);
  const archivedEvents = events.filter(event => event.archived);
  const completedDemands = events.flatMap(event => 
    event.demands.filter(demand => demand.completed)
  );

  return (
    <div className="min-h-screen p-3 sm:p-5 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#467BCA] to-[#77D1A8] inline-block text-transparent bg-clip-text mb-2">Lon Demandas</h1>
            <p className="text-[#122A3A]/70 text-sm">Organize seus eventos e demandas de forma visual e intuitiva</p>
          </div>
          
          <Button 
            onClick={() => {
              setEditingEvent(null);
              setIsEventModalOpen(true);
            }}
            className="bg-gradient-to-r from-[#467BCA] to-[#77D1A8] hover:opacity-90 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <Plus className="w-4 h-4" />
            Novo Evento
          </Button>
        </header>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabType)} className="space-y-6">
          <div className="flex justify-end mb-5">
            <TabsList className="bg-white border border-gray-100 rounded-xl shadow-sm">
              <TabsTrigger value="demands" className="text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#467BCA]/10 data-[state=active]:to-[#77D1A8]/10 data-[state=active]:text-[#122A3A] rounded-lg px-4 py-2">
                Início ({activeEvents.length})
              </TabsTrigger>
              <TabsTrigger value="archived" className="text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#467BCA]/10 data-[state=active]:to-[#77D1A8]/10 data-[state=active]:text-[#122A3A] rounded-lg px-4 py-2">
                Arquivadas ({archivedEvents.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#467BCA]/10 data-[state=active]:to-[#77D1A8]/10 data-[state=active]:text-[#122A3A] rounded-lg px-4 py-2">
                Concluídas ({completedDemands.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="demands" className="space-y-4">
            <div className="space-y-4">
              {activeEvents.map(event => (
                <EventRow
                  key={event.id}
                  event={event}
                  onAddDemand={handleAddDemand}
                  onUpdateDemand={handleUpdateDemand}
                  onDeleteDemand={handleDeleteDemand}
                  onEditEvent={(event) => {
                    setEditingEvent(event);
                    setIsEventModalOpen(true);
                  }}
                  onArchiveEvent={handleArchiveEvent}
                  onDeleteEvent={handleDeleteEvent}
                />
              ))}
              
              {activeEvents.length === 0 && (
                <div className="text-center py-16 bg-white rounded-xl border border-gray-100 shadow-sm">
                  <div className="text-5xl mb-4">📅</div>
                  <p className="text-lg font-medium text-[#122A3A] mb-2">Nenhum evento criado ainda</p>
                  <p className="text-sm text-[#122A3A]/70">Clique em "Novo Evento" para começar</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="archived">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {archivedEvents.map(event => (
                <div key={event.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center justify-between transition-all duration-200 hover:shadow-md">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      {event.logo ? (
                        <img src={event.logo} alt={event.name} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <span className="text-[#122A3A] font-medium text-sm">{event.name.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-[#122A3A] text-base">{event.name}</h3>
                      <p className="text-xs text-[#122A3A]/60">{event.date.toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => handleRestoreEvent(event.id)}
                    className="bg-gradient-to-r from-[#467BCA] to-[#77D1A8] hover:opacity-90 text-white px-4 py-2 h-9 text-sm rounded-xl transition-all duration-200"
                  >
                    Restaurar
                  </Button>
                </div>
              ))}
              
              {archivedEvents.length === 0 && (
                <div className="col-span-full text-center py-16 bg-white rounded-xl border border-gray-100 shadow-sm">
                  <div className="text-5xl mb-4">📦</div>
                  <p className="text-lg font-medium text-[#122A3A]">Nenhum evento arquivado</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="completed">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {completedDemands.map(demand => {
                const event = events.find(e => e.id === demand.eventId);
                return (
                  <div key={demand.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm transition-all duration-200 hover:shadow-md">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-[#122A3A] text-sm">{demand.title}</h3>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <p className="text-sm text-[#122A3A]/70 mb-3 line-clamp-2">{demand.subject}</p>
                    <p className="text-xs text-[#122A3A]/60 mb-1">{event?.name}</p>
                    <p className="text-xs text-[#122A3A]/60 mb-4">{demand.date.toLocaleDateString('pt-BR')}</p>
                    <Button 
                      onClick={() => handleUpdateDemand(demand.eventId, demand.id, { completed: false })}
                      className="w-full text-xs h-8 bg-gradient-to-r from-[#467BCA] to-[#77D1A8] hover:opacity-90 text-white rounded-xl transition-all duration-200"
                    >
                      Restaurar
                    </Button>
                  </div>
                );
              })}
              
              {completedDemands.length === 0 && (
                <div className="col-span-full text-center py-16 bg-white rounded-xl border border-gray-100 shadow-sm">
                  <div className="text-5xl mb-4">✅</div>
                  <p className="text-lg font-medium text-[#122A3A]">Nenhuma demanda concluída</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <EventModal
          isOpen={isEventModalOpen}
          onClose={() => {
            setIsEventModalOpen(false);
            setEditingEvent(null);
          }}
          onSave={editingEvent ? handleEditEvent : handleCreateEvent}
          editingEvent={editingEvent}
        />
      </div>
    </div>
  );
};

export default EventManagementSystem;
