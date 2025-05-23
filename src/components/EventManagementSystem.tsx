import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus } from 'lucide-react';
import { Event, Demand, CRM, Note, TabType } from '@/types/event';
import EventModal from './EventModal';
import EventRow from './EventRow';
import OverviewTab from './OverviewTab';
import CRMTab from './CRMTab';
import NotesTab from './NotesTab';
import DemandModal from './DemandModal';
import { v4 as uuidv4 } from 'uuid';

const EventManagementSystem = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [crmRecords, setCrmRecords] = useState<CRM[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('demands');
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isDemandModalOpen, setIsDemandModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editingDemand, setEditingDemand] = useState<Demand | null>(null);

  console.log('EventManagementSystem rendering with events:', events);

  const getCurrentDateTime = () => {
    const now = new Date();
    const day = now.toLocaleDateString('pt-BR', { weekday: 'long' });
    const date = now.toLocaleDateString('pt-BR');
    const time = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `Bem-vindo! Hoje é ${day}, ${date} - ${time}`;
  };

  const handleCreateEvent = (eventData: Omit<Event, 'id' | 'archived' | 'demands'>) => {
    const newEvent: Event = {
      ...eventData,
      id: uuidv4(),
      archived: false,
      demands: []
    };
    console.log('Creating new event:', newEvent);
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
    console.log('Adding demand to event:', eventId, demandData);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    let urgency: Demand['urgency'] = 'future';
    const demandDate = new Date(demandData.date);
    demandDate.setHours(0, 0, 0, 0);
    
    if (demandDate < today) {
      urgency = 'overdue';
    } else if (demandDate.getTime() === today.getTime()) {
      urgency = 'today';
    } else if (demandDate.getTime() === tomorrow.getTime()) {
      urgency = 'tomorrow';
    }

    const newDemand: Demand = {
      ...demandData,
      id: uuidv4(),
      eventId,
      completed: false,
      urgency
    };

    console.log('New demand created:', newDemand);

    setEvents(prev => prev.map(event => 
      event.id === eventId 
        ? { ...event, demands: [...event.demands, newDemand] }
        : event
    ));
  };

  const handleUpdateDemand = (eventId: string, demandId: string, demandData: Partial<Demand>) => {
    console.log('Updating demand:', eventId, demandId, demandData);
    
    setEvents(prev => prev.map(event => 
      event.id === eventId 
        ? {
            ...event,
            demands: event.demands.map(demand => {
              if (demand.id === demandId) {
                const updatedDemand = { ...demand, ...demandData };
                
                // Recalculate urgency if date is updated
                if (demandData.date) {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  
                  const tomorrow = new Date(today);
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  
                  const demandDate = new Date(demandData.date);
                  demandDate.setHours(0, 0, 0, 0);
                  
                  if (demandDate < today) {
                    updatedDemand.urgency = 'overdue';
                  } else if (demandDate.getTime() === today.getTime()) {
                    updatedDemand.urgency = 'today';
                  } else if (demandDate.getTime() === tomorrow.getTime()) {
                    updatedDemand.urgency = 'tomorrow';
                  } else {
                    updatedDemand.urgency = 'future';
                  }
                }
                
                return updatedDemand;
              }
              return demand;
            })
          }
        : event
    ));
  };

  const handleDeleteDemand = (eventId: string, demandId: string) => {
    console.log('Deleting demand:', eventId, demandId);
    
    setEvents(prev => prev.map(event => 
      event.id === eventId 
        ? {
            ...event,
            demands: event.demands.filter(demand => demand.id !== demandId)
          }
        : event
    ));
  };

  const handleEditDemandFromOverview = (demand: Demand) => {
    setEditingDemand(demand);
    setIsDemandModalOpen(true);
  };

  const handleSaveDemandFromOverview = (demandData: Omit<Demand, 'id' | 'eventId' | 'completed' | 'urgency'>) => {
    if (editingDemand) {
      handleUpdateDemand(editingDemand.eventId, editingDemand.id, demandData);
    }
    setIsDemandModalOpen(false);
    setEditingDemand(null);
  };

  // CRM handlers
  const handleAddCRM = (crmData: Omit<CRM, 'id'>) => {
    const newCRM: CRM = {
      ...crmData,
      id: uuidv4()
    };
    setCrmRecords(prev => [...prev, newCRM]);
  };

  const handleUpdateCRM = (id: string, crmData: Partial<CRM>) => {
    setCrmRecords(prev => prev.map(crm => 
      crm.id === id ? { ...crm, ...crmData } : crm
    ));
  };

  const handleDeleteCRM = (id: string) => {
    setCrmRecords(prev => prev.filter(crm => crm.id !== id));
  };

  // Notes handlers
  const handleAddNote = (noteData: Omit<Note, 'id'>) => {
    const newNote: Note = {
      ...noteData,
      id: uuidv4()
    };
    setNotes(prev => [...prev, newNote]);
  };

  const handleUpdateNote = (id: string, noteData: Partial<Note>) => {
    setNotes(prev => prev.map(note => 
      note.id === id ? { ...note, ...noteData } : note
    ));
  };

  const handleDeleteNote = (id: string) => {
    setNotes(prev => prev.filter(note => note.id !== id));
  };

  const activeEvents = events.filter(event => !event.archived);
  const archivedEvents = events.filter(event => event.archived);
  const completedDemands = events.flatMap(event => 
    event.demands.filter(demand => demand.completed)
  );

  console.log('Active events:', activeEvents);
  console.log('Archived events:', archivedEvents);
  console.log('Completed demands:', completedDemands);

  return (
    <div className="min-h-screen p-5 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20" style={{ margin: '20px' }}>
      <div className="max-w-full mx-auto">
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#467BCA] to-[#77D1A8] inline-block text-transparent bg-clip-text mb-3">Lon Demandas</h1>
            <p className="text-[#122A3A]/70 text-lg">{getCurrentDateTime()}</p>
          </div>
          
          <Button 
            onClick={() => {
              setEditingEvent(null);
              setIsEventModalOpen(true);
            }}
            className="bg-gradient-to-r from-[#467BCA] to-[#77D1A8] hover:opacity-90 text-white px-6 py-3 rounded-xl flex items-center gap-3 transition-all duration-200 shadow-lg hover:shadow-xl text-lg font-medium"
          >
            <Plus className="w-5 h-5" />
            Novo Evento
          </Button>
        </header>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabType)} className="space-y-6">
          <div className="flex justify-end mb-4">
            <TabsList className="bg-white border border-gray-200 rounded-xl shadow-md p-1">
              <TabsTrigger value="demands" className="text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#467BCA]/10 data-[state=active]:to-[#77D1A8]/10 data-[state=active]:text-[#122A3A] rounded-lg px-5 py-3">
                Demandas ({activeEvents.length})
              </TabsTrigger>
              <TabsTrigger value="overview" className="text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#467BCA]/10 data-[state=active]:to-[#77D1A8]/10 data-[state=active]:text-[#122A3A] rounded-lg px-5 py-3">
                Visão Geral
              </TabsTrigger>
              <TabsTrigger value="crm" className="text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#467BCA]/10 data-[state=active]:to-[#77D1A8]/10 data-[state=active]:text-[#122A3A] rounded-lg px-5 py-3">
                CRM ({crmRecords.length})
              </TabsTrigger>
              <TabsTrigger value="notes" className="text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#467BCA]/10 data-[state=active]:to-[#77D1A8]/10 data-[state=active]:text-[#122A3A] rounded-lg px-5 py-3">
                Anotações ({notes.length})
              </TabsTrigger>
              <TabsTrigger value="archived" className="text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#467BCA]/10 data-[state=active]:to-[#77D1A8]/10 data-[state=active]:text-[#122A3A] rounded-lg px-5 py-3">
                Arquivadas ({archivedEvents.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#467BCA]/10 data-[state=active]:to-[#77D1A8]/10 data-[state=active]:text-[#122A3A] rounded-lg px-5 py-3">
                Concluídas ({completedDemands.length})
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="demands" className="space-y-0">
            <div className="space-y-0">
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
                <div className="text-center py-20 bg-white rounded-xl border border-gray-200 shadow-md">
                  <div className="text-6xl mb-6">📅</div>
                  <p className="text-xl font-medium text-[#122A3A] mb-3">Nenhum evento criado ainda</p>
                  <p className="text-lg text-[#122A3A]/70">Clique em "Novo Evento" para começar</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="overview">
            <OverviewTab
              events={activeEvents}
              onEditDemand={handleEditDemandFromOverview}
              onCompleteDemand={handleUpdateDemand}
            />
          </TabsContent>

          <TabsContent value="crm">
            <CRMTab
              crmRecords={crmRecords}
              onAddCRM={handleAddCRM}
              onUpdateCRM={handleUpdateCRM}
              onDeleteCRM={handleDeleteCRM}
            />
          </TabsContent>

          <TabsContent value="notes">
            <NotesTab
              notes={notes}
              onAddNote={handleAddNote}
              onUpdateNote={handleUpdateNote}
              onDeleteNote={handleDeleteNote}
            />
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

        <DemandModal
          isOpen={isDemandModalOpen}
          onClose={() => {
            setIsDemandModalOpen(false);
            setEditingDemand(null);
          }}
          onSave={handleSaveDemandFromOverview}
          editingDemand={editingDemand}
        />
      </div>
    </div>
  );
};

export default EventManagementSystem;
