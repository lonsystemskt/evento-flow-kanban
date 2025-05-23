import React, { useState, useEffect } from 'react';
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
import { useToast } from "@/components/ui/use-toast";
import {
  fetchEvents, createEvent, updateEvent, deleteEvent,
  fetchDemands, createDemand, updateDemand, deleteDemand,
  fetchCRMRecords, createCRMRecord, updateCRMRecord, deleteCRMRecord,
  fetchNotes, createNote, updateNote, deleteNote,
  setupRealtimeSubscriptions
} from '@/services/supabaseService';

const EventManagementSystem = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [crmRecords, setCrmRecords] = useState<CRM[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('demands');
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isDemandModalOpen, setIsDemandModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editingDemand, setEditingDemand] = useState<Demand | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  // Improved data loading function with better error handling
  const loadAllData = async () => {
    try {
      console.log('🔄 Loading all data...');
      setIsLoading(true);
      
      // Load events and demands in parallel
      const [eventsData, demandsData, crmData, notesData] = await Promise.all([
        fetchEvents(),
        fetchDemands(),
        fetchCRMRecords(),
        fetchNotes()
      ]);

      console.log('✅ Events loaded:', eventsData.length);
      console.log('✅ Demands loaded:', demandsData.length);
      console.log('✅ CRM records loaded:', crmData.length);
      console.log('✅ Notes loaded:', notesData.length);

      // Associate demands with their events
      const eventsWithDemands = eventsData.map(event => ({
        ...event,
        demands: demandsData.filter(demand => demand.eventId === event.id)
      }));

      setEvents(eventsWithDemands);
      setCrmRecords(crmData);
      setNotes(notesData);
      
    } catch (error) {
      console.error('❌ Error loading data:', error);
      toast({
        title: "Erro",
        description: "Falha ao carregar dados. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Initial data load
  useEffect(() => {
    loadAllData();
  }, [toast]);

  // Enhanced real-time subscriptions with immediate updates
  useEffect(() => {
    console.log('🔌 Setting up real-time subscriptions...');
    
    const cleanup = setupRealtimeSubscriptions(
      // Events change handler - reload events and demands immediately
      async () => {
        console.log('🔄 Event change detected - reloading events...');
        try {
          const [eventsData, demandsData] = await Promise.all([
            fetchEvents(),
            fetchDemands()
          ]);
          
          const eventsWithDemands = eventsData.map(event => ({
            ...event,
            demands: demandsData.filter(demand => demand.eventId === event.id)
          }));
          
          console.log('✅ Events updated via real-time:', eventsWithDemands.length);
          setEvents(eventsWithDemands);
          
          // Show toast notification for event updates
          toast({
            title: "Atualização",
            description: "Eventos atualizados em tempo real",
            duration: 2000
          });
        } catch (error) {
          console.error('❌ Error updating events in real-time:', error);
        }
      },
      // Demands change handler - reload demands for all events immediately
      async () => {
        console.log('🔄 Demand change detected - reloading demands...');
        try {
          const demandsData = await fetchDemands();
          
          setEvents(prevEvents => {
            const updatedEvents = prevEvents.map(event => ({
              ...event,
              demands: demandsData.filter(demand => demand.eventId === event.id)
            }));
            console.log('✅ Demands updated via real-time for events:', updatedEvents.length);
            return updatedEvents;
          });
          
          // Show toast notification for demand updates
          toast({
            title: "Atualização",
            description: "Demandas atualizadas em tempo real",
            duration: 2000
          });
        } catch (error) {
          console.error('❌ Error updating demands in real-time:', error);
        }
      },
      // CRM change handler
      async () => {
        console.log('🔄 CRM change detected - reloading CRM records...');
        try {
          const crmData = await fetchCRMRecords();
          console.log('✅ CRM records updated via real-time:', crmData.length);
          setCrmRecords(crmData);
          
          // Show toast notification for CRM updates
          toast({
            title: "Atualização",
            description: "Registros CRM atualizados em tempo real",
            duration: 2000
          });
        } catch (error) {
          console.error('❌ Error updating CRM records in real-time:', error);
        }
      },
      // Notes change handler
      async () => {
        console.log('🔄 Notes change detected - reloading notes...');
        try {
          const notesData = await fetchNotes();
          console.log('✅ Notes updated via real-time:', notesData.length);
          setNotes(notesData);
          
          // Show toast notification for notes updates
          toast({
            title: "Atualização",
            description: "Anotações atualizadas em tempo real",
            duration: 2000
          });
        } catch (error) {
          console.error('❌ Error updating notes in real-time:', error);
        }
      }
    );

    return cleanup;
  }, [toast]);

  // Current date and time string
  const getCurrentDateTime = () => {
    const now = new Date();
    const day = now.toLocaleDateString('pt-BR', { weekday: 'long' });
    const date = now.toLocaleDateString('pt-BR');
    const time = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `Bem-vindo! Hoje é ${day}, ${date} - ${time}`;
  };

  // Event handlers with immediate local updates
  const handleCreateEvent = async (eventData: Omit<Event, 'id' | 'archived' | 'demands'>) => {
    try {
      const newEvent = await createEvent(eventData);
      // Immediate local update (real-time will also trigger)
      setEvents(prev => [...prev, { ...newEvent, demands: [] }]);
      setIsEventModalOpen(false);
      toast({
        title: "Sucesso",
        description: "Evento criado com sucesso",
      });
    } catch (error) {
      console.error('Error creating event:', error);
      toast({
        title: "Erro",
        description: "Falha ao criar evento. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleEditEvent = async (eventData: Omit<Event, 'id' | 'archived' | 'demands'>) => {
    if (!editingEvent) return;
    
    try {
      await updateEvent(editingEvent.id, eventData);
      
      // Immediate local update (real-time will also trigger)
      setEvents(prev => prev.map(event => 
        event.id === editingEvent.id 
          ? { ...event, ...eventData }
          : event
      ));
      
      setEditingEvent(null);
      setIsEventModalOpen(false);
      toast({
        title: "Sucesso",
        description: "Evento atualizado com sucesso",
      });
    } catch (error) {
      console.error('Error editing event:', error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar evento. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleArchiveEvent = async (eventId: string) => {
    try {
      await updateEvent(eventId, { archived: true });
      
      setEvents(prev => prev.map(event => 
        event.id === eventId 
          ? { ...event, archived: true }
          : event
      ));
      
      toast({
        title: "Sucesso",
        description: "Evento arquivado com sucesso",
      });
    } catch (error) {
      console.error('Error archiving event:', error);
      toast({
        title: "Erro",
        description: "Falha ao arquivar evento. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteEvent(eventId);
      setEvents(prev => prev.filter(event => event.id !== eventId));
      toast({
        title: "Sucesso",
        description: "Evento excluído com sucesso",
      });
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({
        title: "Erro",
        description: "Falha ao excluir evento. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleRestoreEvent = async (eventId: string) => {
    try {
      await updateEvent(eventId, { archived: false });
      
      setEvents(prev => prev.map(event => 
        event.id === eventId 
          ? { ...event, archived: false }
          : event
      ));
      
      toast({
        title: "Sucesso",
        description: "Evento restaurado com sucesso",
      });
    } catch (error) {
      console.error('Error restoring event:', error);
      toast({
        title: "Erro",
        description: "Falha ao restaurar evento. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleAddDemand = async (eventId: string, demandData: Omit<Demand, 'id' | 'eventId' | 'completed' | 'urgency'>) => {
    try {
      const newDemand = await createDemand({ ...demandData, eventId });
      
      setEvents(prev => prev.map(event => 
        event.id === eventId 
          ? { ...event, demands: [...event.demands, newDemand] }
          : event
      ));
      
      toast({
        title: "Sucesso",
        description: "Demanda adicionada com sucesso",
      });
    } catch (error) {
      console.error('Error adding demand:', error);
      toast({
        title: "Erro",
        description: "Falha ao adicionar demanda. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateDemand = async (eventId: string, demandId: string, demandData: Partial<Demand>) => {
    try {
      await updateDemand(demandId, demandData);
      
      // Find the demand to update
      const eventIndex = events.findIndex(event => event.id === eventId);
      if (eventIndex === -1) return;
      
      const demandIndex = events[eventIndex].demands.findIndex(demand => demand.id === demandId);
      if (demandIndex === -1) return;
      
      // Create a copy of the events array and update the specific demand
      const updatedEvents = [...events];
      updatedEvents[eventIndex] = {
        ...updatedEvents[eventIndex],
        demands: [
          ...updatedEvents[eventIndex].demands.slice(0, demandIndex),
          { ...updatedEvents[eventIndex].demands[demandIndex], ...demandData },
          ...updatedEvents[eventIndex].demands.slice(demandIndex + 1)
        ]
      };
      
      setEvents(updatedEvents);
      
      toast({
        title: "Sucesso",
        description: "Demanda atualizada com sucesso",
      });
    } catch (error) {
      console.error('Error updating demand:', error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar demanda. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteDemand = async (eventId: string, demandId: string) => {
    try {
      await deleteDemand(demandId);
      
      setEvents(prev => prev.map(event => 
        event.id === eventId 
          ? {
              ...event,
              demands: event.demands.filter(demand => demand.id !== demandId)
            }
          : event
      ));
      
      toast({
        title: "Sucesso",
        description: "Demanda excluída com sucesso",
      });
    } catch (error) {
      console.error('Error deleting demand:', error);
      toast({
        title: "Erro",
        description: "Falha ao excluir demanda. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleEditDemandFromOverview = (demand: Demand) => {
    setEditingDemand(demand);
    setIsDemandModalOpen(true);
  };

  const handleSaveDemandFromOverview = async (demandData: Omit<Demand, 'id' | 'eventId' | 'completed' | 'urgency'>) => {
    if (editingDemand) {
      await handleUpdateDemand(editingDemand.eventId, editingDemand.id, demandData);
    }
    setIsDemandModalOpen(false);
    setEditingDemand(null);
  };

  // CRM handlers
  const handleAddCRM = async (crmData: Omit<CRM, 'id'>) => {
    try {
      const newCRM = await createCRMRecord(crmData);
      setCrmRecords(prev => [...prev, newCRM]);
      toast({
        title: "Sucesso",
        description: "Registro CRM adicionado com sucesso",
      });
    } catch (error) {
      console.error('Error adding CRM record:', error);
      toast({
        title: "Erro",
        description: "Falha ao adicionar registro CRM. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateCRM = async (id: string, crmData: Partial<CRM>) => {
    try {
      await updateCRMRecord(id, crmData);
      
      setCrmRecords(prev => prev.map(crm => 
        crm.id === id ? { ...crm, ...crmData } : crm
      ));
      
      toast({
        title: "Sucesso",
        description: "Registro CRM atualizado com sucesso",
      });
    } catch (error) {
      console.error('Error updating CRM record:', error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar registro CRM. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteCRM = async (id: string) => {
    try {
      await deleteCRMRecord(id);
      setCrmRecords(prev => prev.filter(crm => crm.id !== id));
      toast({
        title: "Sucesso",
        description: "Registro CRM excluído com sucesso",
      });
    } catch (error) {
      console.error('Error deleting CRM record:', error);
      toast({
        title: "Erro",
        description: "Falha ao excluir registro CRM. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  // Notes handlers
  const handleAddNote = async (noteData: Omit<Note, 'id'>) => {
    try {
      const newNote = await createNote(noteData);
      setNotes(prev => [...prev, newNote]);
      toast({
        title: "Sucesso",
        description: "Anotação adicionada com sucesso",
      });
    } catch (error) {
      console.error('Error adding note:', error);
      toast({
        title: "Erro",
        description: "Falha ao adicionar anotação. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleUpdateNote = async (id: string, noteData: Partial<Note>) => {
    try {
      await updateNote(id, noteData);
      
      setNotes(prev => prev.map(note => 
        note.id === id ? { ...note, ...noteData } : note
      ));
      
      toast({
        title: "Sucesso",
        description: "Anotação atualizada com sucesso",
      });
    } catch (error) {
      console.error('Error updating note:', error);
      toast({
        title: "Erro",
        description: "Falha ao atualizar anotação. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      await deleteNote(id);
      setNotes(prev => prev.filter(note => note.id !== id));
      toast({
        title: "Sucesso",
        description: "Anotação excluída com sucesso",
      });
    } catch (error) {
      console.error('Error deleting note:', error);
      toast({
        title: "Erro",
        description: "Falha ao excluir anotação. Tente novamente.",
        variant: "destructive"
      });
    }
  };

  const activeEvents = events.filter(event => !event.archived);
  const archivedEvents = events.filter(event => event.archived);
  const completedDemands = events.flatMap(event => 
    event.demands.filter(demand => demand.completed)
  );

  if (isLoading) {
    return (
      <div className="min-h-screen w-full pl-[30px] pr-[30px] pt-[25px] pb-0 bg-[#E4E9EF] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-xl font-medium text-[#2E3A59]">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full pl-[30px] pr-[30px] pt-[25px] pb-0 bg-[#E4E9EF]">
      <div className="w-full">
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="text-left">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#467BCA] to-[#77D1A8] inline-block text-transparent bg-clip-text mb-3">Lon Demandas</h1>
            <p className="text-[#2E3A59]/70 text-base">{getCurrentDateTime()}</p>
          </div>
          
          <Button 
            onClick={() => {
              setEditingEvent(null);
              setIsEventModalOpen(true);
            }}
            className="bg-gradient-to-r from-[#467BCA] to-[#77D1A8] hover:opacity-90 text-white px-6 py-3 rounded-xl flex items-center gap-3 transition-all duration-200 text-base font-medium"
          >
            <Plus className="w-5 h-5" />
            Novo Evento
          </Button>
        </header>

        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as TabType)} className="space-y-6">
          <div className="flex justify-end mb-4">
            <TabsList className="bg-white border-none rounded-2xl p-1.5 gap-1">
              <TabsTrigger 
                value="demands" 
                className="text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#467BCA] data-[state=active]:to-[#77D1A8] data-[state=active]:text-white data-[state=inactive]:text-[#2E3A59] data-[state=inactive]:hover:text-[#467BCA] rounded-xl px-6 py-3 transition-all duration-300"
              >
                Demandas ({activeEvents.length})
              </TabsTrigger>
              <TabsTrigger 
                value="overview" 
                className="text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#467BCA] data-[state=active]:to-[#77D1A8] data-[state=active]:text-white data-[state=inactive]:text-[#2E3A59] data-[state=inactive]:hover:text-[#467BCA] rounded-xl px-6 py-3 transition-all duration-300"
              >
                Visão Geral
              </TabsTrigger>
              <TabsTrigger 
                value="crm" 
                className="text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#467BCA] data-[state=active]:to-[#77D1A8] data-[state=active]:text-white data-[state=inactive]:text-[#2E3A59] data-[state=inactive]:hover:text-[#467BCA] rounded-xl px-6 py-3 transition-all duration-300"
              >
                CRM ({crmRecords.length})
              </TabsTrigger>
              <TabsTrigger 
                value="notes" 
                className="text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#467BCA] data-[state=active]:to-[#77D1A8] data-[state=active]:text-white data-[state=inactive]:text-[#2E3A59] data-[state=inactive]:hover:text-[#467BCA] rounded-xl px-6 py-3 transition-all duration-300"
              >
                Anotações ({notes.length})
              </TabsTrigger>
              <TabsTrigger 
                value="archived" 
                className="text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#467BCA] data-[state=active]:to-[#77D1A8] data-[state=active]:text-white data-[state=inactive]:text-[#2E3A59] data-[state=inactive]:hover:text-[#467BCA] rounded-xl px-6 py-3 transition-all duration-300"
              >
                Arquivadas ({archivedEvents.length})
              </TabsTrigger>
              <TabsTrigger 
                value="completed" 
                className="text-sm font-medium data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#467BCA] data-[state=active]:to-[#77D1A8] data-[state=active]:text-white data-[state=inactive]:text-[#2E3A59] data-[state=inactive]:hover:text-[#467BCA] rounded-xl px-6 py-3 transition-all duration-300"
              >
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
                <div className="text-center py-20 bg-[#F6F7FB] rounded-xl border border-[rgba(0,0,0,0.05)]">
                  <div className="text-6xl mb-6">📅</div>
                  <p className="text-xl font-medium text-[#2E3A59] mb-3">Nenhum evento criado ainda</p>
                  <p className="text-base text-[#2E3A59]/70">Clique em "Novo Evento" para começar</p>
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
                <div key={event.id} className="bg-[#F6F7FB] p-4 rounded-xl border border-[rgba(0,0,0,0.05)] flex items-center justify-between transition-all duration-200">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                      {event.logo ? (
                        <img src={event.logo} alt={event.name} className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <span className="text-[#2E3A59] font-medium text-sm">{event.name.charAt(0)}</span>
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-[#2E3A59] text-base">{event.name}</h3>
                      <p className="text-xs text-[#2E3A59]/60">{event.date.toLocaleDateString('pt-BR')}</p>
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
                <div className="col-span-full text-center py-16 bg-[#F6F7FB] rounded-xl border border-[rgba(0,0,0,0.05)]">
                  <div className="text-5xl mb-4">📦</div>
                  <p className="text-base font-medium text-[#2E3A59]">Nenhum evento arquivado</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="completed">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {completedDemands.map(demand => {
                const event = events.find(e => e.id === demand.eventId);
                return (
                  <div key={demand.id} className="bg-[#F6F7FB] p-4 rounded-xl border border-[rgba(0,0,0,0.05)] transition-all duration-200">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-bold text-[#2E3A59] text-sm">{demand.title}</h3>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <p className="text-sm text-[#2E3A59]/70 mb-3 line-clamp-2">{demand.subject}</p>
                    <p className="text-xs text-[#2E3A59]/60 mb-1">{event?.name}</p>
                    <p className="text-xs text-[#2E3A59]/60 mb-4">{demand.date.toLocaleDateString('pt-BR')}</p>
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
                <div className="col-span-full text-center py-16 bg-[#F6F7FB] rounded-xl border border-[rgba(0,0,0,0.05)]">
                  <div className="text-5xl mb-4">✅</div>
                  <p className="text-base font-medium text-[#2E3A59]">Nenhuma demanda concluída</p>
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
