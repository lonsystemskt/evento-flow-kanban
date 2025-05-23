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
    <div className="min-h-screen p-3 bg-gray-50/50">
      <div className="max-w-full mx-auto">
        <header className="mb-5">
          <h1 className="text-2xl font-semibold text-gray-900 mb-1">Sistema de Gestão de Eventos</h1>
          <p className="text-gray-600 text-sm">Organize seus eventos e demandas de forma visual e intuitiva</p>
        </header>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabType)}>
          <TabsList className="grid w-full grid-cols-3 mb-5 bg-white border border-gray-200">
            <TabsTrigger value="demands" className="text-sm font-medium data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">
              Início ({activeEvents.length})
            </TabsTrigger>
            <TabsTrigger value="archived" className="text-sm font-medium data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">
              Arquivadas ({archivedEvents.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="text-sm font-medium data-[state=active]:bg-blue-50 data-[state=active]:text-blue-600">
              Concluídas ({completedDemands.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="demands" className="space-y-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-medium text-gray-900">Eventos Ativos</h2>
              <Button 
                onClick={() => {
                  setEditingEvent(null);
                  setIsEventModalOpen(true);
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-200"
              >
                <Plus className="w-4 h-4" />
                Novo Evento
              </Button>
            </div>

            <div className="space-y-2">
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
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-3">📅</div>
                  <p className="text-base">Nenhum evento criado ainda</p>
                  <p className="text-sm">Clique em "Novo Evento" para começar</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="archived">
            <div className="space-y-2">
              {archivedEvents.map(event => (
                <div key={event.id} className="bg-white p-3 rounded-lg border border-gray-100 flex items-center justify-between transition-all duration-200">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                      {event.logo ? (
                        <img src={event.logo} alt={event.name} className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <span className="text-gray-600 font-medium text-xs">{event.name.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 text-sm">{event.name}</h3>
                      <p className="text-xs text-gray-600">{event.date.toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => handleRestoreEvent(event.id)}
                    variant="outline"
                    size="sm"
                    className="border-gray-200 hover:bg-gray-50 transition-colors duration-200"
                  >
                    Restaurar
                  </Button>
                </div>
              ))}
              
              {archivedEvents.length === 0 && (
                <div className="text-center py-12 text-gray-500">
                  <div className="text-4xl mb-3">📦</div>
                  <p className="text-base">Nenhum evento arquivado</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="completed">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5">
              {completedDemands.map(demand => {
                const event = events.find(e => e.id === demand.eventId);
                return (
                  <div key={demand.id} className="bg-white p-3 rounded-lg border border-gray-100 transition-all duration-200">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900 text-sm">{demand.title}</h3>
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                    <p className="text-xs text-gray-600 mb-2">{demand.subject}</p>
                    <p className="text-xs text-gray-500 mb-1">{event?.name}</p>
                    <p className="text-xs text-gray-500 mb-3">{demand.date.toLocaleDateString('pt-BR')}</p>
                    <Button 
                      onClick={() => handleUpdateDemand(demand.eventId, demand.id, { completed: false })}
                      variant="outline"
                      size="sm"
                      className="w-full text-xs h-6 border-gray-200 hover:bg-gray-50 transition-colors duration-200"
                    >
                      Restaurar
                    </Button>
                  </div>
                );
              })}
              
              {completedDemands.length === 0 && (
                <div className="col-span-full text-center py-12 text-gray-500">
                  <div className="text-4xl mb-3">✅</div>
                  <p className="text-base">Nenhuma demanda concluída</p>
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
