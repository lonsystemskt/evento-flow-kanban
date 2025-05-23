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
  setupRealtimeSubscriptions, invalidateCache
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
  const [lastSyncTime, setLastSyncTime] = useState<Date>(new Date());
  const { toast } = useToast();

  // Memoized date/time string
  const getCurrentDateTime = useMemo(() => {
    const now = new Date();
    const day = now.toLocaleDateString('pt-BR', { weekday: 'long' });
    const date = now.toLocaleDateString('pt-BR');
    const time = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    return `Bem-vindo! Hoje é ${day}, ${date} - ${time} | Última sync: ${lastSyncTime.toLocaleTimeString('pt-BR')}`;
  }, [lastSyncTime]);

  // Carregamento otimizado e paralelo de dados
  const loadAllData = useCallback(async (forceRefresh = false, showNotification = false) => {
    try {
      console.log('🔄 INICIANDO carregamento ULTRA otimizado de dados...');
      
      if (!forceRefresh) {
        setIsLoading(true);
      }
      setError(null);
      
      // FORÇAR invalidação completa do cache se necessário
      if (forceRefresh) {
        console.log('🔥 FORÇANDO invalidação completa do cache...');
        invalidateCache();
      }
      
      // Estratégia: carregar eventos primeiro, depois demandas em paralelo com outros dados
      console.log('📊 Step 1: Loading events with FORCE REFRESH...');
      const eventsData = await fetchEvents(true); // SEMPRE forçar refresh para eventos
      
      console.log('📊 Step 2: Loading other data in parallel...');
      const [demandsData, crmData, notesData] = await Promise.allSettled([
        fetchDemands(true), // SEMPRE forçar refresh
        fetchCRMRecords(true), // SEMPRE forçar refresh
        fetchNotes(true) // SEMPRE forçar refresh
      ]);

      // Processar resultados com fallback
      const demands = demandsData.status === 'fulfilled' ? demandsData.value : [];
      const crm = crmData.status === 'fulfilled' ? crmData.value : [];
      const notesResult = notesData.status === 'fulfilled' ? notesData.value : [];

      console.log('✅ DADOS CARREGADOS COM SUCESSO:', {
        eventos: eventsData.length,
        demandas: demands.length,
        crm: crm.length,
        notas: notesResult.length
      });

      // Associar demandas aos eventos
      const eventsWithDemands = eventsData.map(event => ({
        ...event,
        demands: demands.filter(demand => demand.eventId === event.id)
      }));

      // Atualizar estados DE UMA VEZ SÓ
      setEvents(eventsWithDemands);
      setCrmRecords(crm);
      setNotes(notesResult);
      setLastSyncTime(new Date());
      
      if (showNotification) {
        toast({
          title: "🔄 Dados Sincronizados",
          description: `${eventsData.length} eventos, ${demands.length} demandas atualizadas em tempo real`,
          duration: 2000
        });
      }
      
    } catch (error) {
      console.error('❌ Erro crítico ao carregar dados:', error);
      setError('Falha ao carregar dados. Verifique sua conexão.');
      
      toast({
        title: "❌ Erro de Carregamento",
        description: "Não foi possível carregar os dados. Tentando novamente...",
        variant: "destructive",
        duration: 3000
      });
      
      // Retry automático após erro - MAS SEM LOOP INFINITO
      setTimeout(() => {
        console.log('🔄 Tentando recarregar dados automaticamente...');
        loadAllData(true, false);
      }, 5000);
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // Carregamento inicial
  useEffect(() => {
    console.log('🚀 INICIALIZANDO EventManagementSystem...');
    loadAllData(false, false);
  }, [loadAllData]);

  // Real-time subscriptions ULTRA AGRESSIVAS
  useEffect(() => {
    console.log('🔌 Configurando subscriptions ULTRA AGRESSIVAS...');
    
    const cleanup = setupRealtimeSubscriptions(
      // Events change handler - ULTRA CRÍTICO
      async () => {
        console.log('🔥🔥🔥 EVENTOS ATUALIZADOS EM TEMPO REAL - RECARREGANDO TUDO!');
        try {
          // FORÇA invalidação completa
          invalidateCache();
          
          // Recarregar TUDO de forma forçada
          await loadAllData(true, true);
        } catch (error) {
          console.error('❌ Erro na sincronização de eventos:', error);
          toast({
            title: "⚠️ Erro de Sincronização",
            description: "Eventos podem estar desatualizados - recarregando...",
            variant: "destructive",
            duration: 2000
          });
        }
      },
      // Demands change handler
      async () => {
        console.log('🔥🔥🔥 DEMANDAS ATUALIZADAS EM TEMPO REAL - RECARREGANDO TUDO!');
        try {
          invalidateCache();
          await loadAllData(true, true);
        } catch (error) {
          console.error('❌ Erro na sincronização de demandas:', error);
        }
      },
      // CRM change handler
      async () => {
        console.log('🔥🔥🔥 CRM ATUALIZADO EM TEMPO REAL - RECARREGANDO TUDO!');
        try {
          invalidateCache();
          await loadAllData(true, true);
        } catch (error) {
          console.error('❌ Erro na sincronização de CRM:', error);
        }
      },
      // Notes change handler
      async () => {
        console.log('🔥🔥🔥 NOTAS ATUALIZADAS EM TEMPO REAL - RECARREGANDO TUDO!');
        try {
          invalidateCache();
          await loadAllData(true, true);
        } catch (error) {
          console.error('❌ Erro na sincronização de notas:', error);
        }
      }
    );

    return cleanup;
  }, [toast, loadAllData]);

  // Event handlers com otimização AGRESSIVA
  const handleCreateEvent = useCallback(async (eventData: Omit<Event, 'id' | 'archived' | 'demands'>) => {
    if (isCreatingEvent) {
      console.log('⏳ Evento já sendo criado, aguarde...');
      return;
    }
    
    try {
      setIsCreatingEvent(true);
      console.log('🆕 Criando evento:', eventData.name);
      
      const newEvent = await createEvent(eventData);
      console.log('✅ Evento criado com sucesso:', newEvent.id);
      
      setIsEventModalOpen(false);
      setEditingEvent(null);
      
      toast({
        title: "🎉 Sucesso",
        description: `Evento "${eventData.name}" criado com sucesso`,
      });
      
      // FORÇAR recarregamento IMEDIATO
      console.log('📡 Recarregando dados após criação...');
      await loadAllData(true, false);
      
    } catch (error) {
      console.error('❌ Erro ao criar evento:', error);
      toast({
        title: "❌ Erro",
        description: "Falha ao criar evento. Tente novamente.",
        variant: "destructive"
      });
      // Recarregar dados em caso de erro
      loadAllData(true, false);
    } finally {
      setIsCreatingEvent(false);
    }
  }, [isCreatingEvent, toast, loadAllData]);

  const handleEditEvent = useCallback(async (eventData: Omit<Event, 'id' | 'archived' | 'demands'>) => {
    if (!editingEvent) return;
    
    try {
      console.log('✏️ Editando evento:', editingEvent.id);
      
      await updateEvent(editingEvent.id, eventData);
      console.log('✅ Evento editado com sucesso:', editingEvent.id);
      
      setEditingEvent(null);
      setIsEventModalOpen(false);
      
      toast({
        title: "✅ Sucesso",
        description: `Evento "${eventData.name}" atualizado com sucesso`,
      });
      
      console.log('📡 Recarregando dados após edição...');
      await loadAllData(true, false);
      
    } catch (error) {
      console.error('❌ Erro ao editar evento:', error);
      // Reverter em caso de erro
      loadAllData(true, false);
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
      
      console.log('📡 Recarregando dados após arquivamento...');
      await loadAllData(true, false);
    } catch (error) {
      console.error('❌ Erro ao arquivar evento:', error);
      loadAllData(true, false);
      toast({
        title: "❌ Erro",
        description: "Falha ao arquivar evento. Tente novamente.",
        variant: "destructive"
      });
    }
  }, [toast, loadAllData]);

  const handleDeleteEvent = useCallback(async (eventId: string) => {
    try {
      console.log('🗑️ Deletando evento:', eventId);
      
      await deleteEvent(eventId);
      console.log('✅ Evento deletado:', eventId);
      
      toast({
        title: "✅ Sucesso",
        description: "Evento excluído com sucesso",
      });
      
      console.log('📡 Recarregando dados após exclusão...');
      await loadAllData(true, false);
    } catch (error) {
      console.error('❌ Erro ao deletar evento:', error);
      loadAllData(true, false);
      toast({
        title: "❌ Erro",
        description: "Falha ao excluir evento. Tente novamente.",
        variant: "destructive"
      });
    }
  }, [toast, loadAllData]);

  const handleRestoreEvent = useCallback(async (eventId: string) => {
    try {
      console.log('🔄 Restaurando evento:', eventId);
      
      await updateEvent(eventId, { archived: false });
      console.log('✅ Evento restaurado:', eventId);
      
      toast({
        title: "✅ Sucesso",
        description: "Evento restaurado com sucesso",
      });
      
      console.log('📡 Recarregando dados após restauração...');
      await loadAllData(true, false);
    } catch (error) {
      console.error('❌ Erro ao restaurar evento:', error);
      loadAllData(true, false);
      toast({
        title: "❌ Erro",
        description: "Falha ao restaurar evento. Tente novamente.",
        variant: "destructive"
      });
    }
  }, [toast, loadAllData]);

  const handleAddDemand = useCallback(async (eventId: string, demandData: Omit<Demand, 'id' | 'eventId' | 'completed' | 'urgency'>) => {
    try {
      const newDemand = await createDemand({ ...demandData, eventId });
      
      toast({
        title: "✅ Sucesso",
        description: "Demanda adicionada com sucesso",
      });
      
      await loadAllData(true, false);
    } catch (error) {
      console.error('❌ Erro ao adicionar demanda:', error);
      toast({
        title: "❌ Erro",
        description: "Falha ao adicionar demanda. Tente novamente.",
        variant: "destructive"
      });
    }
  }, [toast, loadAllData]);

  const handleUpdateDemand = useCallback(async (eventId: string, demandId: string, demandData: Partial<Demand>) => {
    try {
      await updateDemand(demandId, demandData);
      
      toast({
        title: "✅ Sucesso",
        description: "Demanda atualizada com sucesso",
      });
      
      await loadAllData(true, false);
    } catch (error) {
      console.error('❌ Erro ao atualizar demanda:', error);
      toast({
        title: "❌ Erro",
        description: "Falha ao atualizar demanda. Tente novamente.",
        variant: "destructive"
      });
    }
  }, [toast, loadAllData]);

  const handleDeleteDemand = useCallback(async (eventId: string, demandId: string) => {
    try {
      await deleteDemand(demandId);
      
      toast({
        title: "✅ Sucesso",
        description: "Demanda excluída com sucesso",
      });
      
      await loadAllData(true, false);
    } catch (error) {
      console.error('❌ Erro ao excluir demanda:', error);
      toast({
        title: "❌ Erro",
        description: "Falha ao excluir demanda. Tente novamente.",
        variant: "destructive"
      });
    }
  }, [toast, loadAllData]);

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
      toast({
        title: "✅ Sucesso",
        description: "Registro CRM adicionado com sucesso",
      });
      await loadAllData(true, false);
    } catch (error) {
      console.error('❌ Erro ao adicionar CRM:', error);
      toast({
        title: "❌ Erro",
        description: "Falha ao adicionar registro CRM. Tente novamente.",
        variant: "destructive"
      });
    }
  }, [toast, loadAllData]);

  const handleUpdateCRM = useCallback(async (id: string, crmData: Partial<CRM>) => {
    try {
      await updateCRMRecord(id, crmData);
      
      toast({
        title: "✅ Sucesso",
        description: "Registro CRM atualizado com sucesso",
      });
      
      await loadAllData(true, false);
    } catch (error) {
      console.error('❌ Erro ao atualizar CRM:', error);
      toast({
        title: "❌ Erro",
        description: "Falha ao atualizar registro CRM. Tente novamente.",
        variant: "destructive"
      });
    }
  }, [toast, loadAllData]);

  const handleDeleteCRM = useCallback(async (id: string) => {
    try {
      await deleteCRMRecord(id);
      toast({
        title: "✅ Sucesso",
        description: "Registro CRM excluído com sucesso",
      });
      await loadAllData(true, false);
    } catch (error) {
      console.error('❌ Erro ao excluir CRM:', error);
      toast({
        title: "❌ Erro",
        description: "Falha ao excluir registro CRM. Tente novamente.",
        variant: "destructive"
      });
    }
  }, [toast, loadAllData]);

  // Notes handlers
  const handleAddNote = useCallback(async (noteData: Omit<Note, 'id'>) => {
    try {
      const newNote = await createNote(noteData);
      toast({
        title: "✅ Sucesso",
        description: "Anotação adicionada com sucesso",
      });
      await loadAllData(true, false);
    } catch (error) {
      console.error('❌ Erro ao adicionar nota:', error);
      toast({
        title: "❌ Erro",
        description: "Falha ao adicionar anotação. Tente novamente.",
        variant: "destructive"
      });
    }
  }, [toast, loadAllData]);

  const handleUpdateNote = useCallback(async (id: string, noteData: Partial<Note>) => {
    try {
      await updateNote(id, noteData);
      
      toast({
        title: "✅ Sucesso",
        description: "Anotação atualizada com sucesso",
      });
      
      await loadAllData(true, false);
    } catch (error) {
      console.error('❌ Erro ao atualizar nota:', error);
      toast({
        title: "❌ Erro",
        description: "Falha ao atualizar anotação. Tente novamente.",
        variant: "destructive"
      });
    }
  }, [toast, loadAllData]);

  const handleDeleteNote = useCallback(async (id: string) => {
    try {
      await deleteNote(id);
      toast({
        title: "✅ Sucesso",
        description: "Anotação excluída com sucesso",
      });
      await loadAllData(true, false);
    } catch (error) {
      console.error('❌ Erro ao excluir nota:', error);
      toast({
        title: "❌ Erro",
        description: "Falha ao excluir anotação. Tente novamente.",
        variant: "destructive"
      });
    }
  }, [toast, loadAllData]);

  // Memoized computed values para melhor performance
  const activeEvents = useMemo(() => events.filter(event => !event.archived), [events]);
  const archivedEvents = useMemo(() => events.filter(event => event.archived), [events]);
  const completedDemands = useMemo(() => 
    events.flatMap(event => event.demands.filter(demand => demand.completed)), 
    [events]
  );

  // Manual refresh function
  const handleManualRefresh = useCallback(() => {
    console.log('🔄 Manual refresh triggered - FORÇA TOTAL');
    loadAllData(true, true);
  }, [loadAllData]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full pl-[30px] pr-[30px] pt-[25px] pb-0 bg-[#E4E9EF] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-xl font-medium text-[#2E3A59]">Carregando dados em tempo real...</p>
          <p className="text-sm text-[#2E3A59]/70 mt-2">Conectando à sincronização ULTRA automática</p>
          {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
        </div>
      </div>
    );
  }

  if (error && events.length === 0) {
    return (
      <div className="min-h-screen w-full pl-[30px] pr-[30px] pt-[25px] pb-0 bg-[#E4E9EF] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-6">⚠️</div>
          <p className="text-xl font-medium text-[#2E3A59] mb-3">Erro de Conexão</p>
          <p className="text-base text-[#2E3A59]/70 mb-6">{error}</p>
          <Button 
            onClick={handleManualRefresh}
            className="bg-gradient-to-r from-[#467BCA] to-[#77D1A8] hover:opacity-90 text-white px-6 py-3 rounded-xl mr-3"
          >
            🔄 Tentar Novamente
          </Button>
          <Button 
            onClick={() => window.location.reload()}
            variant="outline"
            className="px-6 py-3 rounded-xl"
          >
            🔄 Recarregar Página
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
            <h1 className="text-4xl font-bold bg-gradient-to-r from-[#467BCA] to-[#77D1A8] inline-block text-transparent bg-clip-text mb-3">
              Lon Demandas 🚀
            </h1>
            <p className="text-[#2E3A59]/70 text-base">{getCurrentDateTime}</p>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs text-[#2E3A59]/70">Sincronização ULTRA em tempo real ativa</span>
              <Button
                onClick={handleManualRefresh}
                variant="ghost"
                size="sm"
                className="text-xs h-6 px-2"
              >
                🔄 Refresh FORÇA
              </Button>
            </div>
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
