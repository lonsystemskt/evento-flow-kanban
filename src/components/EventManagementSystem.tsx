
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
    <div className="min-h-screen p-2.5">
      <div className="max-w-full mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">Sistema de Gestão de Eventos</h1>
          <p className="text-slate-600">Organize seus eventos e demandas de forma visual e intuitiva</p>
        </header>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabType)}>
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="demands" className="text-sm font-medium">
              Demandas ({activeEvents.length})
            </TabsTrigger>
            <TabsTrigger value="archived" className="text-sm font-medium">
              Eventos Arquivados ({archivedEvents.length})
            </TabsTrigger>
            <TabsTrigger value="completed" className="text-sm font-medium">
              Demandas Concluídas ({completedDemands.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="demands" className="space-y-2">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold text-slate-800">Eventos Ativos</h2>
              <Button 
                onClick={() => {
                  setEditingEvent(null);
                  setIsEventModalOpen(true);
                }}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center gap-2 shadow-lg transition-all duration-200 hover:shadow-xl"
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
                <div className="text-center py-16 text-slate-500">
                  <div className="text-6xl mb-4">📅</div>
                  <p className="text-lg">Nenhum evento criado ainda</p>
                  <p>Clique em "Novo Evento" para começar</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="archived">
            <div className="space-y-2">
              {archivedEvents.map(event => (
                <div key={event.id} className="bg-white p-4 rounded-lg border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-slate-200 rounded-full flex items-center justify-center">
                      {event.logo ? (
                        <img src={event.logo} alt={event.name} className="w-12 h-12 rounded-full object-cover" />
                      ) : (
                        <span className="text-slate-600 font-semibold">{event.name.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-800">{event.name}</h3>
                      <p className="text-sm text-slate-600">{event.date.toLocaleDateString('pt-BR')}</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => handleRestoreEvent(event.id)}
                    variant="outline"
                    size="sm"
                  >
                    Restaurar
                  </Button>
                </div>
              ))}
              
              {archivedEvents.length === 0 && (
                <div className="text-center py-16 text-slate-500">
                  <div className="text-6xl mb-4">📦</div>
                  <p className="text-lg">Nenhum evento arquivado</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="completed">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {completedDemands.map(demand => {
                const event = events.find(e => e.id === demand.eventId);
                return (
                  <div key={demand.id} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-slate-800">{demand.title}</h3>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">{demand.subject}</p>
                    <p className="text-xs text-slate-500">{event?.name}</p>
                    <p className="text-xs text-slate-500">{demand.date.toLocaleDateString('pt-BR')}</p>
                    <Button 
                      onClick={() => handleUpdateDemand(demand.eventId, demand.id, { completed: false })}
                      variant="outline"
                      size="sm"
                      className="mt-3 w-full"
                    >
                      Restaurar
                    </Button>
                  </div>
                );
              })}
              
              {completedDemands.length === 0 && (
                <div className="col-span-full text-center py-16 text-slate-500">
                  <div className="text-6xl mb-4">✅</div>
                  <p className="text-lg">Nenhuma demanda concluída</p>
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
