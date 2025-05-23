import React, { useState, useEffect, useCallback, useMemo } from 'react';
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

const EventManagementSystem = React.memo(() => {
  const [events, setEvents] = useState<Event[]>([]);
  const [crmRecords, setCrmRecords] = useState<CRM[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('demands');
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isDemandModalOpen, setIsDemandModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [editingDemand, setEditingDemand] = useState<Demand | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const { toast } = useToast();

  // Memoized date/time string
  const getCurrentDateTime = useMemo(() => {
    const now = new Date();
    const day = now.toLocaleDateString('pt-BR', { weekday: 'long' });
    const date = now.toLocaleDateString('pt-BR');
    const time = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `Bem-vindo! Hoje é ${day}, ${date} - ${time}`;
  }, []);

  // Otimizado carregamento paralelo de dados
  const loadAllData = useCallback(async (forceRefresh = false) => {
    try {
      console.log('🔄 Carregando dados otimizado...');
      setIsLoading(true);
      setError(null);
      
      // Carregar dados em paralelo para melhor performance
      const [eventsData, demandsData, crmData, notesData] = await Promise.all([
        fetchEvents(forceRefresh).catch(err => {
          console.error('Erro ao carregar eventos:', err);
          return [];
        }),
        fetchDemands(forceRefresh).catch(err => {
          console.error('Erro ao carregar demandas:', err);
          return [];
        }),
        fetchCRMRecords(forceRefresh).catch(err => {
          console.error('Erro ao carregar CRM:', err);
          return [];
        }),
        fetchNotes(forceRefresh).catch(err => {
          console.error('Erro ao carregar notas:', err);
          return [];
        })
      ]);

      console.log('✅ Dados carregados com sucesso:', {
        eventos: eventsData.length,
        demandas: demandsData.length,
        crm: crmData.length,
        notas: notesData.length
      });

      // Associar demandas aos eventos de forma otimizada
      const eventsWithDemands = eventsData.map(event => ({
        ...event,
        demands: demandsData.filter(demand => demand.eventId === event.id)
      }));

      setEvents(eventsWithDemands);
      setCrmRecords(crmData);
      setNotes(notesData);
      
    } catch (error) {
      console.error('❌ Erro crítico ao carregar dados:', error);
      setError('Falha ao carregar dados. Verifique sua conexão.');
      toast({
        title: "Erro",
        description: "Falha ao carregar dados. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Carregamento inicial
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Real-time subscriptions otimizadas
  useEffect(() => {
    console.log('🔌 Configurando subscriptions otimizadas...');
    
    const cleanup = setupRealtimeSubscriptions(
      // Events change handler
      async () => {
        console.log('🔥 EVENTOS ATUALIZADOS EM TEMPO REAL');
        try {
          const [eventsData, demandsData] = await Promise.all([
            fetchEvents(true),
            fetchDemands(true)
          ]);
          
          const eventsWithDemands = eventsData.map(event => ({
            ...event,
            demands: demandsData.filter(demand => demand.eventId === event.id)
          }));
          
          setEvents(eventsWithDemands);
          
          toast({
            title: "✅ Atualizado",
            description: "Eventos sincronizados automaticamente",
            duration: 2000
          });
        } catch (error) {
          console.error('❌ Erro na sincronização de eventos:', error);
        }
      },
      // Demands change handler
      async () => {
        console.log('🔥 DEMANDAS ATUALIZADAS EM TEMPO REAL');
        try {
          const demandsData = await fetchDemands(true);
          
          setEvents(prevEvents => 
            prevEvents.map(event => ({
              ...event,
              demands: demandsData.filter(demand => demand.eventId === event.id)
            }))
          );
          
          toast({
            title: "✅ Atualizado", 
            description: "Demandas sincronizadas automaticamente",
            duration: 2000
          });
        } catch (error) {
          console.error('❌ Erro na sincronização de demandas:', error);
        }
      },
      // CRM change handler
      async () => {
        console.log('🔥 CRM ATUALIZADO EM TEMPO REAL');
        try {
          const crmData = await fetchCRMRecords(true);
          setCrmRecords(crmData);
          
          toast({
            title: "✅ Atualizado",
            description: "CRM sincronizado automaticamente", 
            duration: 2000
          });
        } catch (error) {
          console.error('❌ Erro na sincronização de CRM:', error);
        }
      },
      // Notes change handler
      async () => {
        console.log('🔥 NOTAS ATUALIZADAS EM TEMPO REAL');
        try {
          const notesData = await fetchNotes(true);
          setNotes(notesData);
          
          toast({
            title: "✅ Atualizado",
            description: "Notas sincronizadas automaticamente",
            duration: 2000
          });
        } catch (error) {
          console.error('❌ Erro na sincronização de notas:', error);
        }
      }
    );

    return cleanup;
  }, [toast]);

  // Event handlers otimizados
  const handleCreateEvent = useCallback(async (eventData: Omit<Event, 'id' | 'archived' | 'demands'>) => {
    if (isCreatingEvent) {
      console.log('⏳ Evento já sendo criado, aguarde...');
      return;
    }
    
    try {
      setIsCreatingEvent(true);
      console.log('🆕 Criando evento otimizado:', eventData.name);
      
      const newEvent = await createEvent(eventData);
      console.log('✅ Evento criado:', newEvent.id);
      
      // Atualização otimista da UI
      setEvents(prev => [...prev, { ...newEvent, demands: [] }]);
      
      setIsEventModalOpen(false);
      setEditingEvent(null);
      
      toast({
        title: "✅ Sucesso",
        description: `Evento "${eventData.name}" criado com sucesso`,
      });
    } catch (error) {
      console.error('❌ Erro ao criar evento:', error);
      toast({
        title: "❌ Erro",
        description: "Falha ao criar evento. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsCreatingEvent(false);
    }
  }, [isCreatingEvent, toast]);

  const handleEditEvent = useCallback(async (eventData: Omit<Event, 'id' | 'archived' | 'demands'>) => {
    if (!editingEvent) return;
    
    try {
      console.log('✏️ Editando evento otimizado:', editingEvent.id);
      
      // Atualização otimista
      setEvents(prev => prev.map(event => 
        event.id === editingEvent.id 
          ? { ...event, ...eventData }
          : event
      ));
      
      await updateEvent(editingEvent.id, eventData);
      console.log('✅ Evento editado:', editingEvent.id);
      
      setEditingEvent(null);
      setIsEventModalOpen(false);
      
      toast({
        title: "✅ Sucesso",
        description: `Evento "${eventData.name}" atualizado com sucesso`,
      });
    } catch (error) {
      console.error('❌ Erro ao editar evento:', error);
      // Reverter em caso de erro
      loadAllData(true);
      toast({
        title: "❌ Erro",
        description: "Falha ao atualizar evento. Tente novamente.",
        variant: "destructive"
      });
    }
  }, [editingEvent, toast, loadAllData]);

  const handleArchiveEvent = useCallback(async (eventId: string) => {
    try {
      console.log('📦 Arquivando evento:', eventId);
      await updateEvent(eventId, { archived: true });
      console.log('✅ Evento arquivado:', eventId);
      
      toast({
        title: "✅ Sucesso",
        description: "Evento arquivado com sucesso",
      });
    } catch (error) {
      console.error('❌ Erro ao arquivar evento:', error);
      toast({
        title: "❌ Erro",
        description: "Falha ao arquivar evento. Tente novamente.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const handleDeleteEvent = useCallback(async (eventId: string) => {
    try {
      console.log('🗑️ Deletando evento:', eventId);
      await deleteEvent(eventId);
      console.log('✅ Evento deletado:', eventId);
      
      toast({
        title: "✅ Sucesso",
        description: "Evento excluído com sucesso",
      });
    } catch (error) {
      console.error('❌ Erro ao deletar evento:', error);
      toast({
        title: "❌ Erro",
        description: "Falha ao excluir evento. Tente novamente.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const handleRestoreEvent = useCallback(async (eventId: string) => {
    try {
      console.log('🔄 Restaurando evento:', eventId);
      await updateEvent(eventId, { archived: false });
      console.log('✅ Evento restaurado:', eventId);
      
      toast({
        title: "✅ Sucesso",
        description: "Evento restaurado com sucesso",
      });
    } catch (error) {
      console.error('❌ Erro ao restaurar evento:', error);
      toast({
        title: "❌ Erro",
        description: "Falha ao restaurar evento. Tente novamente.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const handleAddDemand = useCallback(async (eventId: string, demandData: Omit<Demand, 'id' | 'eventId' | 'completed' | 'urgency'>) => {
    try {
      const newDemand = await createDemand({ ...demandData, eventId });
      
      setEvents(prev => prev.map(event => 
        event.id === eventId 
          ? { ...event, demands: [...event.demands, newDemand] }
          : event
      ));
      
      toast({
        title: "✅ Sucesso",
        description: "Demanda adicionada com sucesso",
      });
    } catch (error) {
      console.error('❌ Erro ao adicionar demanda:', error);
      toast({
        title: "❌ Erro",
        description: "Falha ao adicionar demanda. Tente novamente.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const handleUpdateDemand = useCallback(async (eventId: string, demandId: string, demandData: Partial<Demand>) => {
    try {
      await updateDemand(demandId, demandData);
      
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
      
      toast({
        title: "✅ Sucesso",
        description: "Demanda atualizada com sucesso",
      });
    } catch (error) {
      console.error('❌ Erro ao atualizar demanda:', error);
      toast({
        title: "❌ Erro",
        description: "Falha ao atualizar demanda. Tente novamente.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const handleDeleteDemand = useCallback(async (eventId: string, demandId: string) => {
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
        title: "✅ Sucesso",
        description: "Demanda excluída com sucesso",
      });
    } catch (error) {
      console.error('❌ Erro ao excluir demanda:', error);
      toast({
        title: "❌ Erro",
        description: "Falha ao excluir demanda. Tente novamente.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const handleEditDemandFromOverview = useCallback((demand: Demand) => {
    setEditingDemand(demand);
    setIsDemandModalOpen(true);
  }, []);

  const handleSaveDemandFromOverview = useCallback(async (demandData: Omit<Demand, 'id' | 'eventId' | 'completed' | 'urgency'>) => {
    if (editingDemand) {
      await handleUpdateDemand(editingDemand.eventId, editingDemand.id, demandData);
    }
    setIsDemandModalOpen(false);
    setEditingDemand(null);
  }, [editingDemand, handleUpdateDemand]);

  // CRM handlers
  const handleAddCRM = useCallback(async (crmData: Omit<CRM, 'id'>) => {
    try {
      const newCRM = await createCRMRecord(crmData);
      setCrmRecords(prev => [...prev, newCRM]);
      toast({
        title: "✅ Sucesso",
        description: "Registro CRM adicionado com sucesso",
      });
    } catch (error) {
      console.error('❌ Erro ao adicionar CRM:', error);
      toast({
        title: "❌ Erro",
        description: "Falha ao adicionar registro CRM. Tente novamente.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const handleUpdateCRM = useCallback(async (id: string, crmData: Partial<CRM>) => {
    try {
      await updateCRMRecord(id, crmData);
      
      setCrmRecords(prev => prev.map(crm => 
        crm.id === id ? { ...crm, ...crmData } : crm
      ));
      
      toast({
        title: "✅ Sucesso",
        description: "Registro CRM atualizado com sucesso",
      });
    } catch (error) {
      console.error('❌ Erro ao atualizar CRM:', error);
      toast({
        title: "❌ Erro",
        description: "Falha ao atualizar registro CRM. Tente novamente.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const handleDeleteCRM = useCallback(async (id: string) => {
    try {
      await deleteCRMRecord(id);
      setCrmRecords(prev => prev.filter(crm => crm.id !== id));
      toast({
        title: "✅ Sucesso",
        description: "Registro CRM excluído com sucesso",
      });
    } catch (error) {
      console.error('❌ Erro ao excluir CRM:', error);
      toast({
        title: "❌ Erro",
        description: "Falha ao excluir registro CRM. Tente novamente.",
        variant: "destructive"
      });
    }
  }, [toast]);

  // Notes handlers
  const handleAddNote = useCallback(async (noteData: Omit<Note, 'id'>) => {
    try {
      const newNote = await createNote(noteData);
      setNotes(prev => [...prev, newNote]);
      toast({
        title: "✅ Sucesso",
        description: "Anotação adicionada com sucesso",
      });
    } catch (error) {
      console.error('❌ Erro ao adicionar nota:', error);
      toast({
        title: "❌ Erro",
        description: "Falha ao adicionar anotação. Tente novamente.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const handleUpdateNote = useCallback(async (id: string, noteData: Partial<Note>) => {
    try {
      await updateNote(id, noteData);
      
      setNotes(prev => prev.map(note => 
        note.id === id ? { ...note, ...noteData } : note
      ));
      
      toast({
        title: "✅ Sucesso",
        description: "Anotação atualizada com sucesso",
      });
    } catch (error) {
      console.error('❌ Erro ao atualizar nota:', error);
      toast({
        title: "❌ Erro",
        description: "Falha ao atualizar anotação. Tente novamente.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const handleDeleteNote = useCallback(async (id: string) => {
    try {
      await deleteNote(id);
      setNotes(prev => prev.filter(note => note.id !== id));
      toast({
        title: "✅ Sucesso",
        description: "Anotação excluída com sucesso",
      });
    } catch (error) {
      console.error('❌ Erro ao excluir nota:', error);
      toast({
        title: "❌ Erro",
        description: "Falha ao excluir anotação. Tente novamente.",
        variant: "destructive"
      });
    }
  }, [toast]);

  // Memoized computed values para melhor performance
  const activeEvents = useMemo(() => events.filter(event => !event.archived), [events]);
  const archivedEvents = useMemo(() => events.filter(event => event.archived), [events]);
  const completedDemands = useMemo(() => 
    events.flatMap(event => event.demands.filter(demand => demand.completed)), 
    [events]
  );

  if (isLoading) {
    return (
      <div className="min-h-screen w-full pl-[30px] pr-[30px] pt-[25px] pb-0 bg-[#E4E9EF] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-xl font-medium text-[#2E3A59]">Carregando dados...</p>
          {error && <p className="text-red-500 mt-2">{error}</p>}
        </div>
      </div>
    );
  }

  if (error && events.length === 0) {
    return (
      <div className="min-h-screen w-full pl-[30px] pr-[30px] pt-[25px] pb-0 bg-[#E4E9EF] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-6">⚠️</div>
          <p className="text-xl font-medium text-[#2E3A59] mb-3">Erro ao carregar dados</p>
          <p className="text-base text-[#2E3A59]/70 mb-6">{error}</p>
          <Button 
            onClick={() => loadAllData(true)}
            className="bg-gradient-to-r from-[#467BCA] to-[#77D1A8] hover:opacity-90 text-white px-6 py-3 rounded-xl"
          >
            Tentar Novamente
          </Button>
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
            <p className="text-[#2E3A59]/70 text-base">{getCurrentDateTime}</p>
          </div>
          
          <Button 
            onClick={() => {
              setEditingEvent(null);
              setIsEventModalOpen(true);
            }}
            disabled={isCreatingEvent}
            className="bg-gradient-to-r from-[#467BCA] to-[#77D1A8] hover:opacity-90 text-white px-6 py-3 rounded-xl flex items-center gap-3 transition-all duration-200 text-base font-medium disabled:opacity-50"
          >
            <Plus className="w-5 h-5" />
            {isCreatingEvent ? 'Criando...' : 'Novo Evento'}
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
                      {event.logo && event.logo !== 'undefined' ? (
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
});

EventManagementSystem.displayName = 'EventManagementSystem';

export default EventManagementSystem;
