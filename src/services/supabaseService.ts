
import { supabase } from '@/integrations/supabase/client';
import { Event, Demand, CRM, Note } from '@/types/event';

// Cache otimizado com controle de estado
let loadingStates = {
  events: false,
  demands: false,
  crm: false,
  notes: false
};

// Cache de dados
let dataCache = {
  events: [] as Event[],
  demands: [] as Demand[],
  crm: [] as CRM[],
  notes: [] as Note[],
  lastUpdate: {
    events: 0,
    demands: 0,
    crm: 0,
    notes: 0
  }
};

const CACHE_DURATION = 2000; // 2 segundos
const REQUEST_TIMEOUT = 10000; // 10 segundos
const MAX_RETRIES = 3;

// Helper para retry com backoff exponencial
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = MAX_RETRIES,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      console.warn(`❌ Tentativa ${attempt + 1}/${maxRetries + 1} falhou:`, error);
      
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`⏳ Aguardando ${delay}ms antes da próxima tentativa...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError!;
};

// Helper para criar AbortController com timeout
const createAbortController = (timeoutMs: number = REQUEST_TIMEOUT) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, timeoutMs);
  
  return { controller, timeoutId };
};

// Events - Sistema robusto de carregamento
export const fetchEvents = async (forceRefresh = false): Promise<Event[]> => {
  const now = Date.now();
  
  // Usar cache se disponível e não forçado
  if (!forceRefresh && 
      dataCache.events.length > 0 && 
      (now - dataCache.lastUpdate.events) < CACHE_DURATION) {
    console.log('📦 Usando cache de eventos');
    return dataCache.events;
  }
  
  // Evitar múltiplas requisições simultâneas
  if (loadingStates.events && !forceRefresh) {
    console.log('⏳ Eventos já carregando, aguardando...');
    // Aguardar até que o carregamento termine
    while (loadingStates.events) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return dataCache.events;
  }
  
  try {
    loadingStates.events = true;
    console.log('🔄 Carregando eventos da base de dados...');
    
    const result = await retryWithBackoff(async () => {
      const { controller, timeoutId } = createAbortController();
      
      try {
        const { data, error } = await supabase
          .from('events')
          .select('id, name, date, archived, logo, created_at, updated_at')
          .order('date', { ascending: true })
          .abortSignal(controller.signal);
        
        clearTimeout(timeoutId);
        
        if (error) {
          console.error('❌ Erro na query de eventos:', error);
          throw error;
        }
        
        return data || [];
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    });

    console.log('✅ Eventos carregados com sucesso:', result.length);
    
    const events = result.map((event: any) => ({
      ...event,
      date: new Date(event.date),
      demands: [],
      logo: event.logo && event.logo !== 'undefined' ? event.logo : undefined
    }));
    
    // Atualizar cache
    dataCache.events = events;
    dataCache.lastUpdate.events = now;
    
    return events;
  } catch (error) {
    console.error('❌ Erro crítico ao carregar eventos:', error);
    
    // Retornar cache se disponível
    if (dataCache.events.length > 0) {
      console.log('🔄 Retornando dados em cache devido ao erro');
      return dataCache.events;
    }
    
    // Se não há cache, retornar array vazio para não quebrar a UI
    console.warn('⚠️ Retornando array vazio - sem cache disponível');
    return [];
  } finally {
    loadingStates.events = false;
  }
};

export const createEvent = async (event: Omit<Event, 'id' | 'archived' | 'demands'>): Promise<Event> => {
  try {
    console.log('🆕 Criando evento:', event.name);
    
    // Validar dados antes de enviar
    if (!event.name || !event.date) {
      throw new Error('Nome e data são obrigatórios');
    }
    
    let logo = event.logo;
    if (logo && typeof logo === 'string' && logo.length > 1048576) {
      console.warn('⚠️ Logo muito grande, removendo');
      logo = undefined;
    }
    
    const result = await retryWithBackoff(async () => {
      const { data, error } = await supabase
        .from('events')
        .insert({
          name: event.name.trim(),
          date: event.date.toISOString(),
          logo: logo,
          archived: false
        })
        .select()
        .single();
      
      if (error) {
        console.error('❌ Erro ao criar evento:', error);
        throw error;
      }
      
      return data;
    });

    console.log('✅ Evento criado com sucesso:', result.id);
    
    const newEvent = {
      ...result,
      date: new Date(result.date),
      demands: [],
      logo: result.logo && result.logo !== 'undefined' ? result.logo : undefined
    };
    
    // Invalidar cache completamente
    invalidateCache('events');
    
    return newEvent;
  } catch (error) {
    console.error('❌ Falha ao criar evento:', error);
    throw error;
  }
};

export const updateEvent = async (id: string, event: Partial<Event>): Promise<void> => {
  try {
    console.log('✏️ Atualizando evento:', id);
    
    if (!id) {
      throw new Error('ID do evento é obrigatório');
    }
    
    const updates: any = { ...event };
    
    // Converter Date para ISO string
    if (updates.date instanceof Date) {
      updates.date = updates.date.toISOString();
    }
    
    // Remover demands pois não é coluna da base
    delete updates.demands;
    delete updates.id; // Não permitir alterar ID
    
    // Processar logo
    if (updates.logo && typeof updates.logo === 'string' && updates.logo.length > 1048576) {
      console.warn('⚠️ Logo muito grande, removendo');
      updates.logo = null;
    }
    
    // Trim name se presente
    if (updates.name) {
      updates.name = updates.name.trim();
    }
    
    await retryWithBackoff(async () => {
      const { error } = await supabase
        .from('events')
        .update(updates)
        .eq('id', id);
      
      if (error) {
        console.error('❌ Erro ao atualizar evento:', error);
        throw error;
      }
    });

    console.log('✅ Evento atualizado com sucesso:', id);
    
    // Invalidar cache
    invalidateCache('events');
  } catch (error) {
    console.error('❌ Falha ao atualizar evento:', error);
    throw error;
  }
};

export const deleteEvent = async (id: string): Promise<void> => {
  try {
    console.log('🗑️ Deletando evento:', id);
    
    if (!id) {
      throw new Error('ID do evento é obrigatório');
    }
    
    await retryWithBackoff(async () => {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error('❌ Erro ao deletar evento:', error);
        throw error;
      }
    });

    console.log('✅ Evento deletado com sucesso:', id);
    
    // Invalidar cache
    invalidateCache('events');
  } catch (error) {
    console.error('❌ Falha ao deletar evento:', error);
    throw error;
  }
};

// Demands - Sistema robusto
export const fetchDemands = async (forceRefresh = false): Promise<Demand[]> => {
  const now = Date.now();
  
  if (!forceRefresh && 
      dataCache.demands.length > 0 && 
      (now - dataCache.lastUpdate.demands) < CACHE_DURATION) {
    console.log('📦 Usando cache de demandas');
    return dataCache.demands;
  }
  
  if (loadingStates.demands && !forceRefresh) {
    console.log('⏳ Demandas já carregando...');
    while (loadingStates.demands) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return dataCache.demands;
  }
  
  try {
    loadingStates.demands = true;
    console.log('🔄 Carregando demandas...');
    
    const result = await retryWithBackoff(async () => {
      const { controller, timeoutId } = createAbortController();
      
      try {
        const { data, error } = await supabase
          .from('demands')
          .select('*')
          .order('date', { ascending: true })
          .abortSignal(controller.signal);
        
        clearTimeout(timeoutId);
        
        if (error) throw error;
        return data || [];
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    });

    console.log('✅ Demandas carregadas:', result.length);
    
    const demands = result.map((demand: any) => ({
      id: demand.id,
      eventId: demand.event_id,
      title: demand.title,
      subject: demand.subject,
      date: new Date(demand.date),
      completed: demand.completed,
      urgency: demand.urgency as Demand['urgency'],
    }));
    
    dataCache.demands = demands;
    dataCache.lastUpdate.demands = now;
    
    return demands;
  } catch (error) {
    console.error('❌ Erro crítico ao carregar demandas:', error);
    
    if (dataCache.demands.length > 0) {
      return dataCache.demands;
    }
    
    return [];
  } finally {
    loadingStates.demands = false;
  }
};

export const createDemand = async (demand: Omit<Demand, 'id' | 'completed' | 'urgency'>): Promise<Demand> => {
  try {
    // Calcular urgência
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    let urgency: Demand['urgency'] = 'future';
    const demandDate = new Date(demand.date);
    demandDate.setHours(0, 0, 0, 0);
    
    if (demandDate < today) {
      urgency = 'overdue';
    } else if (demandDate.getTime() === today.getTime()) {
      urgency = 'today';
    } else if (demandDate.getTime() === tomorrow.getTime()) {
      urgency = 'tomorrow';
    }

    const result = await retryWithBackoff(async () => {
      const { data, error } = await supabase
        .from('demands')
        .insert({
          event_id: demand.eventId,
          title: demand.title,
          subject: demand.subject,
          date: demand.date.toISOString(),
          urgency,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    });

    const newDemand = {
      id: result.id,
      eventId: result.event_id,
      title: result.title,
      subject: result.subject,
      date: new Date(result.date),
      completed: result.completed,
      urgency: result.urgency as Demand['urgency'],
    };
    
    invalidateCache('demands');
    return newDemand;
  } catch (error) {
    console.error('❌ Falha ao criar demanda:', error);
    throw error;
  }
};

export const updateDemand = async (id: string, demand: Partial<Demand>): Promise<void> => {
  try {
    const updates: any = { ...demand };
    
    if (updates.eventId) {
      updates.event_id = updates.eventId;
      delete updates.eventId;
    }
    
    if (updates.date instanceof Date) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const demandDate = new Date(updates.date);
      demandDate.setHours(0, 0, 0, 0);
      
      if (demandDate < today) {
        updates.urgency = 'overdue';
      } else if (demandDate.getTime() === today.getTime()) {
        updates.urgency = 'today';
      } else if (demandDate.getTime() === tomorrow.getTime()) {
        updates.urgency = 'tomorrow';
      } else {
        updates.urgency = 'future';
      }
      
      updates.date = updates.date.toISOString();
    }
    
    await retryWithBackoff(async () => {
      const { error } = await supabase
        .from('demands')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    });
    
    invalidateCache('demands');
  } catch (error) {
    console.error('❌ Falha ao atualizar demanda:', error);
    throw error;
  }
};

export const deleteDemand = async (id: string): Promise<void> => {
  try {
    await retryWithBackoff(async () => {
      const { error } = await supabase
        .from('demands')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    });
    
    invalidateCache('demands');
  } catch (error) {
    console.error('❌ Falha ao deletar demanda:', error);
    throw error;
  }
};

// CRM - Sistema robusto
export const fetchCRMRecords = async (forceRefresh = false): Promise<CRM[]> => {
  const now = Date.now();
  
  if (!forceRefresh && 
      dataCache.crm.length > 0 && 
      (now - dataCache.lastUpdate.crm) < CACHE_DURATION) {
    console.log('📦 Usando cache de CRM');
    return dataCache.crm;
  }
  
  if (loadingStates.crm && !forceRefresh) {
    console.log('⏳ CRM já carregando...');
    while (loadingStates.crm) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return dataCache.crm;
  }
  
  try {
    loadingStates.crm = true;
    console.log('🔄 Carregando registros CRM...');
    
    const result = await retryWithBackoff(async () => {
      const { controller, timeoutId } = createAbortController();
      
      try {
        const { data, error } = await supabase
          .from('crm_records')
          .select('*')
          .order('date', { ascending: true })
          .abortSignal(controller.signal);
        
        clearTimeout(timeoutId);
        
        if (error) throw error;
        return data || [];
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    });

    console.log('✅ CRM carregado:', result.length);
    
    const crmRecords = result.map((crm: any) => ({
      id: crm.id,
      name: crm.name,
      contact: crm.contact,
      email: crm.email,
      subject: crm.subject,
      file: crm.file,
      date: new Date(crm.date),
      completed: crm.completed,
      status: crm.status || 'Ativo',
    }));
    
    dataCache.crm = crmRecords;
    dataCache.lastUpdate.crm = now;
    
    return crmRecords;
  } catch (error) {
    console.error('❌ Erro crítico ao carregar CRM:', error);
    
    if (dataCache.crm.length > 0) {
      return dataCache.crm;
    }
    
    return [];
  } finally {
    loadingStates.crm = false;
  }
};

export const createCRMRecord = async (crm: Omit<CRM, 'id'>): Promise<CRM> => {
  try {
    const result = await retryWithBackoff(async () => {
      const { data, error } = await supabase
        .from('crm_records')
        .insert({
          name: crm.name,
          contact: crm.contact,
          email: crm.email,
          subject: crm.subject,
          file: crm.file,
          date: crm.date.toISOString(),
          completed: crm.completed,
          status: crm.status,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    });

    const newCRM = {
      id: result.id,
      name: result.name,
      contact: result.contact,
      email: result.email,
      subject: result.subject,
      file: result.file,
      date: new Date(result.date),
      completed: result.completed,
      status: (result.status === 'Inativo' ? 'Inativo' : 'Ativo') as CRM['status'],
    };
    
    invalidateCache('crm');
    return newCRM;
  } catch (error) {
    console.error('❌ Falha ao criar CRM:', error);
    throw error;
  }
};

export const updateCRMRecord = async (id: string, crm: Partial<CRM>): Promise<void> => {
  try {
    const updates: any = { ...crm };
    
    if (updates.date instanceof Date) {
      updates.date = updates.date.toISOString();
    }
    
    await retryWithBackoff(async () => {
      const { error } = await supabase
        .from('crm_records')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    });
    
    invalidateCache('crm');
  } catch (error) {
    console.error('❌ Falha ao atualizar CRM:', error);
    throw error;
  }
};

export const deleteCRMRecord = async (id: string): Promise<void> => {
  try {
    await retryWithBackoff(async () => {
      const { error } = await supabase
        .from('crm_records')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    });
    
    invalidateCache('crm');
  } catch (error) {
    console.error('❌ Falha ao deletar CRM:', error);
    throw error;
  }
};

// Notes - Sistema robusto
export const fetchNotes = async (forceRefresh = false): Promise<Note[]> => {
  const now = Date.now();
  
  if (!forceRefresh && 
      dataCache.notes.length > 0 && 
      (now - dataCache.lastUpdate.notes) < CACHE_DURATION) {
    console.log('📦 Usando cache de notas');
    return dataCache.notes;
  }
  
  if (loadingStates.notes && !forceRefresh) {
    console.log('⏳ Notas já carregando...');
    while (loadingStates.notes) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return dataCache.notes;
  }
  
  try {
    loadingStates.notes = true;
    console.log('🔄 Carregando notas...');
    
    const result = await retryWithBackoff(async () => {
      const { controller, timeoutId } = createAbortController();
      
      try {
        const { data, error } = await supabase
          .from('notes')
          .select('*')
          .order('date', { ascending: false })
          .abortSignal(controller.signal);
        
        clearTimeout(timeoutId);
        
        if (error) throw error;
        return data || [];
      } catch (error) {
        clearTimeout(timeoutId);
        throw error;
      }
    });

    console.log('✅ Notas carregadas:', result.length);
    
    const notes = result.map((note: any) => ({
      id: note.id,
      title: note.title,
      subject: note.subject,
      date: new Date(note.date),
      author: note.author as 'Thiago' | 'Kalil',
    }));
    
    dataCache.notes = notes;
    dataCache.lastUpdate.notes = now;
    
    return notes;
  } catch (error) {
    console.error('❌ Erro crítico ao carregar notas:', error);
    
    if (dataCache.notes.length > 0) {
      return dataCache.notes;
    }
    
    return [];
  } finally {
    loadingStates.notes = false;
  }
};

export const createNote = async (note: Omit<Note, 'id'>): Promise<Note> => {
  try {
    const result = await retryWithBackoff(async () => {
      const { data, error } = await supabase
        .from('notes')
        .insert({
          title: note.title,
          subject: note.subject,
          date: note.date.toISOString(),
          author: note.author,
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    });

    const newNote = {
      id: result.id,
      title: result.title,
      subject: result.subject,
      date: new Date(result.date),
      author: result.author as 'Thiago' | 'Kalil',
    };
    
    invalidateCache('notes');
    return newNote;
  } catch (error) {
    console.error('❌ Falha ao criar nota:', error);
    throw error;
  }
};

export const updateNote = async (id: string, note: Partial<Note>): Promise<void> => {
  try {
    const updates: any = { ...note };
    
    if (updates.date instanceof Date) {
      updates.date = updates.date.toISOString();
    }
    
    await retryWithBackoff(async () => {
      const { error } = await supabase
        .from('notes')
        .update(updates)
        .eq('id', id);
      
      if (error) throw error;
    });
    
    invalidateCache('notes');
  } catch (error) {
    console.error('❌ Falha ao atualizar nota:', error);
    throw error;
  }
};

export const deleteNote = async (id: string): Promise<void> => {
  try {
    await retryWithBackoff(async () => {
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    });
    
    invalidateCache('notes');
  } catch (error) {
    console.error('❌ Falha ao deletar nota:', error);
    throw error;
  }
};

// Sistema de Real-time ULTRA ROBUSTO
let realtimeCleanup: (() => void) | null = null;
let realtimeRetryCount = 0;
const MAX_RETRY_COUNT = 5;
let reconnectTimeout: NodeJS.Timeout | null = null;

export const setupRealtimeSubscriptions = (
  onEventsChange: () => void, 
  onDemandsChange: () => void, 
  onCRMChange: () => void, 
  onNotesChange: () => void
) => {
  // Limpar subscriptions e timeouts existentes
  if (realtimeCleanup) {
    console.log('🧹 Limpando subscriptions existentes...');
    realtimeCleanup();
  }
  
  if (reconnectTimeout) {
    clearTimeout(reconnectTimeout);
    reconnectTimeout = null;
  }
  
  console.log('🔌 Configurando subscriptions ULTRA ROBUSTAS...');
  
  // Debounce robusto para evitar spam
  const createDebouncedHandler = (fn: Function, delay: number, name: string) => {
    let timeoutId: NodeJS.Timeout;
    let lastCall = 0;
    
    return (...args: any[]) => {
      const now = Date.now();
      
      // Evitar chamadas muito frequentes
      if (now - lastCall < 500) {
        console.log(`⚡ ${name} mudança muito frequente, ignorando`);
        return;
      }
      
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        console.log(`🔥 ${name} ATUALIZAÇÃO REAL-TIME EXECUTADA`);
        lastCall = Date.now();
        
        // Invalidar cache COMPLETAMENTE antes de chamar handler
        invalidateCache();
        fn.apply(null, args);
      }, delay);
    };
  };
  
  const debouncedEventsChange = createDebouncedHandler(async () => {
    console.log('🔥🔥🔥 EVENTOS SINCRONIZAÇÃO REAL-TIME');
    onEventsChange();
  }, 300, 'EVENTOS');
  
  const debouncedDemandsChange = createDebouncedHandler(async () => {
    console.log('🔥🔥🔥 DEMANDAS SINCRONIZAÇÃO REAL-TIME');
    onDemandsChange();
  }, 300, 'DEMANDAS');
  
  const debouncedCRMChange = createDebouncedHandler(async () => {
    console.log('🔥🔥🔥 CRM SINCRONIZAÇÃO REAL-TIME');
    onCRMChange();
  }, 300, 'CRM');
  
  const debouncedNotesChange = createDebouncedHandler(async () => {
    console.log('🔥🔥🔥 NOTAS SINCRONIZAÇÃO REAL-TIME');
    onNotesChange();
  }, 300, 'NOTAS');
  
  // Função para reconectar com estratégia robusta
  const setupChannelWithRetry = (channelName: string, tableName: string, handler: Function) => {
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: tableName 
        },
        (payload) => {
          const recordId = (payload.new && typeof payload.new === 'object' && 'id' in payload.new) ? 
            payload.new.id : 
            (payload.old && typeof payload.old === 'object' && 'id' in payload.old) ? 
              payload.old.id : 
              'desconhecido';
          
          console.log(`🔥 REAL-TIME ${tableName.toUpperCase()} DETECTADO:`, payload.eventType, recordId);
          handler();
        }
      )
      .subscribe((status) => {
        console.log(`📡 ${tableName.toUpperCase()} status:`, status);
        
        if (status === 'SUBSCRIBED') {
          console.log(`✅ ${tableName.toUpperCase()}: Sincronização ATIVA 🚀`);
          realtimeRetryCount = 0; // Reset contador de tentativas
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.error(`❌ ${tableName.toUpperCase()}: Sincronização FALHOU:`, status);
          
          // Lógica de reconexão
          if (realtimeRetryCount < MAX_RETRY_COUNT) {
            realtimeRetryCount++;
            const delay = Math.min(1000 * Math.pow(2, realtimeRetryCount), 30000); // Max 30s
            console.log(`🔄 Reconectando ${tableName} (${realtimeRetryCount}/${MAX_RETRY_COUNT}) em ${delay}ms...`);
            
            reconnectTimeout = setTimeout(() => {
              console.log(`🔄 Executando reconexão para ${tableName}...`);
              supabase.removeChannel(channel);
              setupChannelWithRetry(channelName, tableName, handler);
            }, delay);
          } else {
            console.error(`💀 ${tableName.toUpperCase()}: Máximo de tentativas atingido. Real-time desabilitado.`);
            
            // Tentar reconectar após um tempo maior
            reconnectTimeout = setTimeout(() => {
              console.log(`🔄 Tentativa de reconexão após cooldown para ${tableName}...`);
              realtimeRetryCount = 0;
              setupChannelWithRetry(channelName, tableName, handler);
            }, 60000); // 1 minuto
          }
        }
      });
      
    return channel;
  };

  // Criar channels para todas as tabelas
  const eventsChannel = setupChannelWithRetry('realtime:events-ultra', 'events', debouncedEventsChange);
  const demandsChannel = setupChannelWithRetry('realtime:demands-ultra', 'demands', debouncedDemandsChange);
  const crmChannel = setupChannelWithRetry('realtime:crm-ultra', 'crm_records', debouncedCRMChange);
  const notesChannel = setupChannelWithRetry('realtime:notes-ultra', 'notes', debouncedNotesChange);

  // Função de limpeza
  realtimeCleanup = () => {
    console.log('🧹 Limpando TODAS as subscriptions real-time...');
    try {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
      }
      
      supabase.removeChannel(eventsChannel);
      supabase.removeChannel(demandsChannel);
      supabase.removeChannel(crmChannel);
      supabase.removeChannel(notesChannel);
      
      console.log('✅ Todas as subscriptions limpas com sucesso');
    } catch (error) {
      console.error('❌ Erro ao limpar subscriptions:', error);
    }
  };
  
  return realtimeCleanup;
};

// Função para invalidar cache manualmente
export const invalidateCache = (type?: 'events' | 'demands' | 'crm' | 'notes') => {
  if (type) {
    dataCache.lastUpdate[type] = 0;
    dataCache[type] = [] as any;
    console.log(`🔄 Cache INVALIDADO para: ${type}`);
  } else {
    Object.keys(dataCache.lastUpdate).forEach(key => {
      dataCache.lastUpdate[key as keyof typeof dataCache.lastUpdate] = 0;
      dataCache[key as keyof typeof dataCache] = [] as any;
    });
    console.log('🔄 TODO o cache INVALIDADO');
  }
};

// Função para verificar conectividade
export const checkConnectivity = async (): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('events')
      .select('id')
      .limit(1);
    
    return !error;
  } catch (error) {
    console.error('❌ Falha no teste de conectividade:', error);
    return false;
  }
};
