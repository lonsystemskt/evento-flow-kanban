import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Wifi, WifiOff, RefreshCw } from 'lucide-react';
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
  setupRealtimeSubscriptions, invalidateCache, checkConnectivity
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
  const [isConnected, setIsConnected] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  // Status de conectividade
  const getCurrentDateTime = useMemo(() => {
    const now = new Date();
    const day = now.toLocaleDateString('pt-BR', { weekday: 'long' });
    const date = now.toLocaleDateString('pt-BR');
    const time = now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const syncTime = lastSyncTime.toLocaleTimeString('pt-BR');
    return `Bem-vindo! Hoje é ${day}, ${date} - ${time} | Última sync: ${syncTime}`;
  }, [lastSyncTime]);

  // Verificar conectividade periodicamente
  useEffect(() => {
    const checkConnection = async () => {
      const connected = await checkConnectivity();
      setIsConnected(connected);
      
      if (!connected && retryCount < 5) {
        console.log('❌ Sem conectividade, tentando reconectar...');
        setRetryCount(prev => prev + 1);
        setTimeout(checkConnection, 5000 * Math.pow(2, retryCount)); // Backoff exponencial
      } else if (connected && retryCount > 0) {
        console.log('✅ Conectividade restaurada!');
        setRetryCount(0);
        loadAllData(true, true);
      }
    };

    const interval = setInterval(checkConnection, 30000); // Verificar a cada 30s
    return () => clearInterval(interval);
  }, [retryCount]);

  // Carregamento de dados com recuperação robusta
  const loadAllData = useCallback(async (forceRefresh = false, showNotification = false) => {
    try {
      console.log('🔄 INICIANDO carregamento robusto de dados...');
      
      if (!forceRefresh) {
        setIsLoading(true);
      }
      setError(null);
      
      // Verificar conectividade primeiro
      const connected = await checkConnectivity();
      if (!connected) {
        throw new Error('Sem conectividade com a base de dados');
      }
      
      setIsConnected(true);
      
      // Invalidar cache se forçado
      if (forceRefresh) {
        console.log('🔥 Invalidando cache completamente...');
        invalidateCache();
      }
      
      // Carregar dados de forma paralela com fallback
      console.log('📊 Carregando todos os dados...');
      const [eventsResult, demandsResult, crmResult, notesResult] = await Promise.allSettled([
        fetchEvents(true),
        fetchDemands(true),
        fetchCRMRecords(true),
        fetchNotes(true)
      ]);

      // Processar resultados com fallback seguro
      const eventsData = eventsResult.status === 'fulfilled' ? eventsResult.value : [];
      const demandsData = demandsResult.status === 'fulfilled' ? demandsResult.value : [];
      const crmData = crmResult.status === 'fulfilled' ? crmResult.value : [];
      const notesData = notesResult.status === 'fulfilled' ? notesResult.value : [];

      // Log de erros se houver
      [eventsResult, demandsResult, crmResult, notesResult].forEach((result, index) => {
        if (result.status === 'rejected') {
          const tables = ['eventos', 'demandas', 'crm', 'notas'];
          console.error(`❌ Erro ao carregar ${tables[index]}:`, result.reason);
        }
      });

      console.log('✅ DADOS CARREGADOS:', {
        eventos: eventsData.length,
        demandas: demandsData.length,
        crm: crmData.length,
        notas: notesResult.length
      });

      // Associar demandas aos eventos
      const eventsWithDemands = eventsData.map(event => ({
        ...event,
        demands: demandsData.filter(demand => demand.eventId === event.id)
      }));

      // Atualizar estados
      setEvents(eventsWithDemands);
      setCrmRecords(crmData);
      setNotes(notesData);
      setLastSyncTime(new Date());
      setRetryCount(0); // Reset contador de erros
      
      if (showNotification) {
        toast({
          title: "🔄 Dados Sincronizados",
          description: `${eventsData.length} eventos, ${demandsData.length} demandas atualizadas`,
          duration: 2000
        });
      }
      
    } catch (error) {
      console.error('❌ Erro crítico ao carregar dados:', error);
      setIsConnected(false);
      
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setError(`Falha no carregamento: ${errorMessage}`);
      
      toast({
        title: "❌ Erro de Carregamento",
        description: `${errorMessage}. ${retryCount < 3 ? 'Tentando novamente...' : 'Verifique sua conexão.'}`,
        variant: "destructive",
        duration: 4000
      });
      
      // Retry automático com backoff
      if (retryCount < 3) {
        const delay = 2000 * Math.pow(2, retryCount);
        setRetryCount(prev => prev + 1);
        setTimeout(() => {
          console.log(`🔄 Tentativa ${retryCount + 1}/3 em ${delay}ms...`);
          loadAllData(true, false);
        }, delay);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [toast, retryCount]);

  // Carregamento inicial
  useEffect(() => {
    console.log('🚀 INICIALIZANDO Sistema de Eventos...');
    loadAllData(false, false);
  }, [loadAllData]);

  // Real-time subscriptions com reconexão automática
  useEffect(() => {
    console.log('🔌 Configurando subscriptions robustas...');
    
    const cleanup = setupRealtimeSubscriptions(
      // Events change handler
      async () => {
        console.log('🔥 EVENTOS ATUALIZADOS - RECARREGANDO');
        try {
          await loadAllData(true, true);
        } catch (error) {
          console.error('❌ Erro na sincronização de eventos:', error);
          toast({
            title: "⚠️ Erro de Sincronização",
            description: "Eventos podem estar desatualizados",
            variant: "destructive",
            duration: 2000
          });
        }
      },
      // Demands change handler
      async () => {
        console.log('🔥 DEMANDAS ATUALIZADAS - RECARREGANDO');
        try {
          await loadAllData(true, true);
        } catch (error) {
          console.error('❌ Erro na sincronização de demandas:', error);
        }
      },
      // CRM change handler
      async () => {
        console.log('🔥 CRM ATUALIZADO - RECARREGANDO');
        try {
          await loadAllData(true, true);
        } catch (error) {
          console.error('❌ Erro na sincronização de CRM:', error);
        }
      },
      // Notes change handler
      async () => {
        console.log('🔥 NOTAS ATUALIZADAS - RECARREGANDO');
        try {
          await loadAllData(true, true);
        } catch (error) {
          console.error('❌ Erro na sincronização de notas:', error);
        }
      }
    );

    return cleanup;
  }, [toast, loadAllData]);

  // Handlers para eventos
  const handleCreateEvent = useCallback(async (eventData: Omit<Event, 'id' | 'archived' | 'demands'>) => {
    if (isCreatingEvent) return;
    
    try {
      setIsCreatingEvent(true);
      console.log('🆕 Criando evento:', eventData.name);
      
      const newEvent = await createEvent(eventData);
      console.log('✅ Evento criado:', newEvent.id);
      
      setIsEventModalOpen(false);
      setEditingEvent(null);
      
      toast({
        title: "🎉 Sucesso",
        description: `Evento "${eventData.name}" criado com sucesso`,
      });
      
      // Forçar recarregamento imediato
      await loadAllData(true, false);
      
    } catch (error) {
      console.error('❌ Erro ao criar evento:', error);
      toast({
        title: "❌ Erro",
        description: "Falha ao criar evento. Tente novamente.",
        variant: "destructive"
      });
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
      console.log('✅ Evento editado:', editingEvent.id);
      
      setEditingEvent(null);
      setIsEventModalOpen(false);
      
      toast({
        title: "✅ Sucesso",
        description: `Evento "${eventData.name}" atualizado`,
      });
      
      await loadAllData(true, false);
      
    } catch (error) {
      console.error('❌ Erro ao editar evento:', error);
      loadAllData(true, false);
      toast({
        title: "❌ Erro",
        description: "Falha ao atualizar evento.",
        variant: "destructive"
      });
    }
  }, [editingEvent, toast, loadAllData]);

  const handleArchiveEvent = useCallback(async (eventId: string) => {
    try {
      await updateEvent(eventId, { archived: true });
      toast({
        title: "✅ Sucesso",
        description: "Evento arquivado",
      });
      await loadAllData(true, false);
    } catch (error) {
      console.error('❌ Erro ao arquivar:', error);
      loadAllData(true, false);
      toast({
        title: "❌ Erro",
        description: "Falha ao arquivar evento.",
        variant: "destructive"
      });
    }
  }, [toast, loadAllData]);

  const handleDeleteEvent = useCallback(async (eventId: string) => {
    try {
      await deleteEvent(eventId);
      toast({
        title: "✅ Sucesso",
        description: "Evento excluído",
      });
      await loadAllData(true, false);
    } catch (error) {
      console.error('❌ Erro ao deletar:', error);
      loadAllData(true, false);
      toast({
        title: "❌ Erro",
        description: "Falha ao excluir evento.",
        variant: "destructive"
      });
    }
  }, [toast, loadAllData]);

  const handleRestoreEvent = useCallback(async (eventId: string) => {
    try {
      await updateEvent(eventId, { archived: false });
      toast({
        title: "✅ Sucesso",
        description: "Evento restaurado",
      });
      await loadAllData(true, false);
    } catch (error) {
      console.error('❌ Erro ao restaurar:', error);
      loadAllData(true, false);
      toast({
        title: "❌ Erro",
        description: "Falha ao restaurar evento.",
        variant: "destructive"
      });
    }
  }, [toast, loadAllData]);

  const handleAddDemand = useCallback(async (eventId: string, demandData: Omit<Demand, 'id' | 'eventId' | 'completed' | 'urgency'>) => {
    try {
      await createDemand({ ...demandData, eventId });
      toast({
        title: "✅ Sucesso",
        description: "Demanda adicionada",
      });
      await loadAllData(true, false);
    } catch (error) {
      console.error('❌ Erro ao adicionar demanda:', error);
      toast({
        title: "❌ Erro",
        description: "Falha ao adicionar demanda.",
        variant: "destructive"
      });
    }
  }, [toast, loadAllData]);

  const handleUpdateDemand = useCallback(async (eventId: string, demandId: string, demandData: Partial<Demand>) => {
    try {
      await updateDemand(demandId, demandData);
      toast({
        title: "✅ Sucesso",
        description: "Demanda atualizada",
      });
      await loadAllData(true, false);
    } catch (error) {
      console.error('❌ Erro ao atualizar demanda:', error);
      toast({
        title: "❌ Erro",
        description: "Falha ao atualizar demanda.",
        variant: "destructive"
      });
    }
  }, [toast, loadAllData]);

  const handleDeleteDemand = useCallback(async (eventId: string, demandId: string) => {
    try {
      await deleteDemand(demandId);
      toast({
        title: "✅ Sucesso",
        description: "Demanda excluída",
      });
      await loadAllData(true, false);
    } catch (error) {
      console.error('❌ Erro ao excluir demanda:', error);
      toast({
        title: "❌ Erro",
        description: "Falha ao excluir demanda.",
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
      await createCRMRecord(crmData);
      toast({
        title: "✅ Sucesso",
        description: "Registro CRM adicionado",
      });
      await loadAllData(true, false);
    } catch (error) {
      console.error('❌ Erro ao adicionar CRM:', error);
      toast({
        title: "❌ Erro",
        description: "Falha ao adicionar CRM.",
        variant: "destructive"
      });
    }
  }, [toast, loadAllData]);

  const handleUpdateCRM = useCallback(async (id: string, crmData: Partial<CRM>) => {
    try {
      await updateCRMRecord(id, crmData);
      toast({
        title: "✅ Sucesso",
        description: "CRM atualizado",
      });
      await loadAllData(true, false);
    } catch (error) {
      console.error('❌ Erro ao atualizar CRM:', error);
      toast({
        title: "❌ Erro",
        description: "Falha ao atualizar CRM.",
        variant: "destructive"
      });
    }
  }, [toast, loadAllData]);

  const handleDeleteCRM = useCallback(async (id: string) => {
    try {
      await deleteCRMRecord(id);
      toast({
        title: "✅ Sucesso",
        description: "CRM excluído",
      });
      await loadAllData(true, false);
    } catch (error) {
      console.error('❌ Erro ao excluir CRM:', error);
      toast({
        title: "❌ Erro",
        description: "Falha ao excluir CRM.",
        variant: "destructive"
      });
    }
  }, [toast, loadAllData]);

  // Notes handlers
  const handleAddNote = useCallback(async (noteData: Omit<Note, 'id'>) => {
    try {
      await createNote(noteData);
      toast({
        title: "✅ Sucesso",
        description: "Anotação adicionada",
      });
      await loadAllData(true, false);
    } catch (error) {
      console.error('❌ Erro ao adicionar nota:', error);
      toast({
        title: "❌ Erro",
        description: "Falha ao adicionar anotação.",
        variant: "destructive"
      });
    }
  }, [toast, loadAllData]);

  const handleUpdateNote = useCallback(async (id: string, noteData: Partial<Note>) => {
    try {
      await updateNote(id, noteData);
      toast({
        title: "✅ Sucesso",
        description: "Anotação atualizada",
      });
      await loadAllData(true, false);
    } catch (error) {
      console.error('❌ Erro ao atualizar nota:', error);
      toast({
        title: "❌ Erro",
        description: "Falha ao atualizar anotação.",
        variant: "destructive"
      });
    }
  }, [toast, loadAllData]);

  const handleDeleteNote = useCallback(async (id: string) => {
    try {
      await deleteNote(id);
      toast({
        title: "✅ Sucesso",
        description: "Anotação excluída",
      });
      await loadAllData(true, false);
    } catch (error) {
      console.error('❌ Erro ao excluir nota:', error);
      toast({
        title: "❌ Erro",
        description: "Falha ao excluir anotação.",
        variant: "destructive"
      });
    }
  }, [toast, loadAllData]);

  // Computed values
  const activeEvents = useMemo(() => events.filter(event => !event.archived), [events]);
  const archivedEvents = useMemo(() => events.filter(event => event.archived), [events]);
  const completedDemands = useMemo(() => 
    events.flatMap(event => event.demands.filter(demand => demand.completed)), 
    [events]
  );

  // Manual refresh
  const handleManualRefresh = useCallback(async () => {
    console.log('🔄 Refresh manual acionado');
    setIsRefreshing(true);
    setRetryCount(0);
    await loadAllData(true, true);
  }, [loadAllData]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full pl-[30px] pr-[30px] pt-[25px] pb-0 bg-[#E4E9EF] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-xl font-medium text-[#2E3A59]">
            {isConnected ? 'Carregando dados...' : 'Reconectando...'}
          </p>
          <p className="text-sm text-[#2E3A59]/70 mt-2">
            {isConnected ? 'Sincronização em tempo real' : `Tentativa ${retryCount}/3`}
          </p>
          {error && <p className="text-red-500 mt-2 text-sm">{error}</p>}
        </div>
      </div>
    );
  }

  if (error && events.length === 0 && !isConnected) {
    return (
      <div className="min-h-screen w-full pl-[30px] pr-[30px] pt-[25px] pb-0 bg-[#E4E9EF] flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-6">
            {isConnected ? '⚠️' : '📡'}
          </div>
          <p className="text-xl font-medium text-[#2E3A59] mb-3">
            {isConnected ? 'Erro de Carregamento' : 'Sem Conectividade'}
          </p>
          <p className="text-base text-[#2E3A59]/70 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <Button 
              onClick={handleManualRefresh}
              disabled={isRefreshing}
              className="bg-gradient-to-r from-[#467BCA] to-[#77D1A8] hover:opacity-90 text-white px-6 py-3 rounded-xl"
            >
              {isRefreshing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Reconectando...
                </>
              ) : (
                <>
                  🔄 Tentar Novamente
                </>
              )}
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
              {isConnected ? (
                <Wifi className="w-4 h-4 text-green-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-500" />
              )}
              <span className="text-xs text-[#2E3A59]/70">
                {isConnected ? 'Conectado - Sincronização ativa' : 'Desconectado - Tentando reconectar'}
              </span>
              <Button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                variant="ghost"
                size="sm"
                className="text-xs h-6 px-2"
              >
                {isRefreshing ? (
                  <RefreshCw className="w-3 h-3 animate-spin" />
                ) : (
                  '🔄 Atualizar'
                )}
              </Button>
            </div>
          </div>
          
          <Button 
            onClick={() => {
              setEditingEvent(null);
              setIsEventModalOpen(true);
            }}
            disabled={isCreatingEvent || !isConnected}
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
