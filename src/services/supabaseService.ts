
import { supabase } from '@/integrations/supabase/client';
import { Event, Demand, CRM, Note } from '@/types/event';

// Sistema de cache otimizado
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

// Estados de carregamento
let loadingStates = {
  events: false,
  demands: false,
  crm: false,
  notes: false
};

const CACHE_DURATION = 5000; // 5 segundos
const REQUEST_TIMEOUT = 15000; // 15 segundos

// Helper para retry com backoff
const retryOperation = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.warn(`Tentativa ${attempt + 1}/${maxRetries + 1} falhou:`, error);
      
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError!;
};

// Helper para timeout de requisições
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number = REQUEST_TIMEOUT): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
    )
  ]);
};

// EVENTS
export const fetchEvents = async (forceRefresh = false): Promise<Event[]> => {
  const now = Date.now();
  
  // Usar cache se disponível
  if (!forceRefresh && 
      dataCache.events.length > 0 && 
      (now - dataCache.lastUpdate.events) < CACHE_DURATION) {
    console.log('📦 Cache: eventos');
    return dataCache.events;
  }
  
  // Evitar múltiplas requisições
  if (loadingStates.events && !forceRefresh) {
    while (loadingStates.events) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return dataCache.events;
  }
  
  try {
    loadingStates.events = true;
    console.log('🔄 Carregando eventos...');
    
    const result = await retryOperation(async () => {
      const queryPromise = supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });
      
      return await withTimeout(queryPromise);
    });

    if (result.error) {
      throw new Error(`Erro na query: ${result.error.message}`);
    }
    
    const events = (result.data || []).map((event: any) => ({
      id: event.id,
      name: event.name,
      date: new Date(event.date),
      logo: event.logo || undefined,
      archived: event.archived,
      demands: []
    }));
    
    dataCache.events = events;
    dataCache.lastUpdate.events = now;
    
    console.log('✅ Eventos carregados:', events.length);
    return events;
    
  } catch (error) {
    console.error('❌ Erro ao carregar eventos:', error);
    
    if (dataCache.events.length > 0) {
      console.log('🔄 Retornando cache devido ao erro');
      return dataCache.events;
    }
    
    return [];
  } finally {
    loadingStates.events = false;
  }
};

export const createEvent = async (event: Omit<Event, 'id' | 'archived' | 'demands'>): Promise<Event> => {
  try {
    console.log('🆕 Criando evento:', event.name);
    
    const result = await retryOperation(async () => {
      const queryPromise = supabase
        .from('events')
        .insert({
          name: event.name.trim(),
          date: event.date.toISOString(),
          logo: event.logo || null,
          archived: false
        })
        .select()
        .single();
      
      return await withTimeout(queryPromise);
    });

    if (result.error) {
      throw new Error(`Erro ao criar: ${result.error.message}`);
    }
    
    const newEvent = {
      id: result.data.id,
      name: result.data.name,
      date: new Date(result.data.date),
      logo: result.data.logo || undefined,
      archived: result.data.archived,
      demands: []
    };
    
    invalidateCache('events');
    console.log('✅ Evento criado:', newEvent.id);
    
    return newEvent;
  } catch (error) {
    console.error('❌ Falha ao criar evento:', error);
    throw error;
  }
};

export const updateEvent = async (id: string, event: Partial<Event>): Promise<void> => {
  try {
    console.log('✏️ Atualizando evento:', id);
    
    const updates: any = { ...event };
    
    if (updates.date instanceof Date) {
      updates.date = updates.date.toISOString();
    }
    
    delete updates.demands;
    delete updates.id;
    
    if (updates.name) {
      updates.name = updates.name.trim();
    }
    
    const result = await retryOperation(async () => {
      const queryPromise = supabase
        .from('events')
        .update(updates)
        .eq('id', id);
      
      return await withTimeout(queryPromise);
    });

    if (result.error) {
      throw new Error(`Erro ao atualizar: ${result.error.message}`);
    }
    
    invalidateCache('events');
    console.log('✅ Evento atualizado:', id);
  } catch (error) {
    console.error('❌ Falha ao atualizar evento:', error);
    throw error;
  }
};

export const deleteEvent = async (id: string): Promise<void> => {
  try {
    console.log('🗑️ Deletando evento:', id);
    
    const result = await retryOperation(async () => {
      const queryPromise = supabase
        .from('events')
        .delete()
        .eq('id', id);
      
      return await withTimeout(queryPromise);
    });

    if (result.error) {
      throw new Error(`Erro ao deletar: ${result.error.message}`);
    }
    
    invalidateCache('events');
    console.log('✅ Evento deletado:', id);
  } catch (error) {
    console.error('❌ Falha ao deletar evento:', error);
    throw error;
  }
};

// DEMANDS
export const fetchDemands = async (forceRefresh = false): Promise<Demand[]> => {
  const now = Date.now();
  
  if (!forceRefresh && 
      dataCache.demands.length > 0 && 
      (now - dataCache.lastUpdate.demands) < CACHE_DURATION) {
    console.log('📦 Cache: demandas');
    return dataCache.demands;
  }
  
  if (loadingStates.demands && !forceRefresh) {
    while (loadingStates.demands) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return dataCache.demands;
  }
  
  try {
    loadingStates.demands = true;
    console.log('🔄 Carregando demandas...');
    
    const result = await retryOperation(async () => {
      const queryPromise = supabase
        .from('demands')
        .select('*')
        .order('date', { ascending: true });
      
      return await withTimeout(queryPromise);
    });

    if (result.error) {
      throw new Error(`Erro na query: ${result.error.message}`);
    }
    
    const demands = (result.data || []).map((demand: any) => ({
      id: demand.id,
      eventId: demand.event_id,
      title: demand.title,
      subject: demand.subject,
      date: new Date(demand.date),
      completed: demand.completed,
      urgency: demand.urgency as Demand['urgency']
    }));
    
    dataCache.demands = demands;
    dataCache.lastUpdate.demands = now;
    
    console.log('✅ Demandas carregadas:', demands.length);
    return demands;
    
  } catch (error) {
    console.error('❌ Erro ao carregar demandas:', error);
    return dataCache.demands.length > 0 ? dataCache.demands : [];
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

    const result = await retryOperation(async () => {
      const queryPromise = supabase
        .from('demands')
        .insert({
          event_id: demand.eventId,
          title: demand.title.trim(),
          subject: demand.subject.trim(),
          date: demand.date.toISOString(),
          urgency,
          completed: false
        })
        .select()
        .single();
      
      return await withTimeout(queryPromise);
    });

    if (result.error) {
      throw new Error(`Erro ao criar: ${result.error.message}`);
    }
    
    const newDemand = {
      id: result.data.id,
      eventId: result.data.event_id,
      title: result.data.title,
      subject: result.data.subject,
      date: new Date(result.data.date),
      completed: result.data.completed,
      urgency: result.data.urgency as Demand['urgency']
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
    
    if (updates.title) {
      updates.title = updates.title.trim();
    }
    
    if (updates.subject) {
      updates.subject = updates.subject.trim();
    }
    
    delete updates.id;
    
    const result = await retryOperation(async () => {
      const queryPromise = supabase
        .from('demands')
        .update(updates)
        .eq('id', id);
      
      return await withTimeout(queryPromise);
    });

    if (result.error) {
      throw new Error(`Erro ao atualizar: ${result.error.message}`);
    }
    
    invalidateCache('demands');
  } catch (error) {
    console.error('❌ Falha ao atualizar demanda:', error);
    throw error;
  }
};

export const deleteDemand = async (id: string): Promise<void> => {
  try {
    const result = await retryOperation(async () => {
      const queryPromise = supabase
        .from('demands')
        .delete()
        .eq('id', id);
      
      return await withTimeout(queryPromise);
    });

    if (result.error) {
      throw new Error(`Erro ao deletar: ${result.error.message}`);
    }
    
    invalidateCache('demands');
  } catch (error) {
    console.error('❌ Falha ao deletar demanda:', error);
    throw error;
  }
};

// CRM
export const fetchCRMRecords = async (forceRefresh = false): Promise<CRM[]> => {
  const now = Date.now();
  
  if (!forceRefresh && 
      dataCache.crm.length > 0 && 
      (now - dataCache.lastUpdate.crm) < CACHE_DURATION) {
    console.log('📦 Cache: CRM');
    return dataCache.crm;
  }
  
  if (loadingStates.crm && !forceRefresh) {
    while (loadingStates.crm) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return dataCache.crm;
  }
  
  try {
    loadingStates.crm = true;
    console.log('🔄 Carregando CRM...');
    
    const result = await retryOperation(async () => {
      const queryPromise = supabase
        .from('crm_records')
        .select('*')
        .order('date', { ascending: true });
      
      return await withTimeout(queryPromise);
    });

    if (result.error) {
      throw new Error(`Erro na query: ${result.error.message}`);
    }
    
    const crmRecords = (result.data || []).map((crm: any) => ({
      id: crm.id,
      name: crm.name,
      contact: crm.contact,
      email: crm.email,
      subject: crm.subject,
      file: crm.file || undefined,
      date: new Date(crm.date),
      completed: crm.completed,
      status: (crm.status === 'Inativo' ? 'Inativo' : 'Ativo') as CRM['status']
    }));
    
    dataCache.crm = crmRecords;
    dataCache.lastUpdate.crm = now;
    
    console.log('✅ CRM carregado:', crmRecords.length);
    return crmRecords;
    
  } catch (error) {
    console.error('❌ Erro ao carregar CRM:', error);
    return dataCache.crm.length > 0 ? dataCache.crm : [];
  } finally {
    loadingStates.crm = false;
  }
};

export const createCRMRecord = async (crm: Omit<CRM, 'id'>): Promise<CRM> => {
  try {
    const result = await retryOperation(async () => {
      const queryPromise = supabase
        .from('crm_records')
        .insert({
          name: crm.name.trim(),
          contact: crm.contact.trim(),
          email: crm.email.trim(),
          subject: crm.subject.trim(),
          file: crm.file || null,
          date: crm.date.toISOString(),
          completed: crm.completed,
          status: crm.status
        })
        .select()
        .single();
      
      return await withTimeout(queryPromise);
    });

    if (result.error) {
      throw new Error(`Erro ao criar: ${result.error.message}`);
    }
    
    const newCRM = {
      id: result.data.id,
      name: result.data.name,
      contact: result.data.contact,
      email: result.data.email,
      subject: result.data.subject,
      file: result.data.file || undefined,
      date: new Date(result.data.date),
      completed: result.data.completed,
      status: (result.data.status === 'Inativo' ? 'Inativo' : 'Ativo') as CRM['status']
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
    
    if (updates.name) {
      updates.name = updates.name.trim();
    }
    
    if (updates.contact) {
      updates.contact = updates.contact.trim();
    }
    
    if (updates.email) {
      updates.email = updates.email.trim();
    }
    
    if (updates.subject) {
      updates.subject = updates.subject.trim();
    }
    
    delete updates.id;
    
    const result = await retryOperation(async () => {
      const queryPromise = supabase
        .from('crm_records')
        .update(updates)
        .eq('id', id);
      
      return await withTimeout(queryPromise);
    });

    if (result.error) {
      throw new Error(`Erro ao atualizar: ${result.error.message}`);
    }
    
    invalidateCache('crm');
  } catch (error) {
    console.error('❌ Falha ao atualizar CRM:', error);
    throw error;
  }
};

export const deleteCRMRecord = async (id: string): Promise<void> => {
  try {
    const result = await retryOperation(async () => {
      const queryPromise = supabase
        .from('crm_records')
        .delete()
        .eq('id', id);
      
      return await withTimeout(queryPromise);
    });

    if (result.error) {
      throw new Error(`Erro ao deletar: ${result.error.message}`);
    }
    
    invalidateCache('crm');
  } catch (error) {
    console.error('❌ Falha ao deletar CRM:', error);
    throw error;
  }
};

// NOTES
export const fetchNotes = async (forceRefresh = false): Promise<Note[]> => {
  const now = Date.now();
  
  if (!forceRefresh && 
      dataCache.notes.length > 0 && 
      (now - dataCache.lastUpdate.notes) < CACHE_DURATION) {
    console.log('📦 Cache: notas');
    return dataCache.notes;
  }
  
  if (loadingStates.notes && !forceRefresh) {
    while (loadingStates.notes) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
    return dataCache.notes;
  }
  
  try {
    loadingStates.notes = true;
    console.log('🔄 Carregando notas...');
    
    const result = await retryOperation(async () => {
      const queryPromise = supabase
        .from('notes')
        .select('*')
        .order('date', { ascending: false });
      
      return await withTimeout(queryPromise);
    });

    if (result.error) {
      throw new Error(`Erro na query: ${result.error.message}`);
    }
    
    const notes = (result.data || []).map((note: any) => ({
      id: note.id,
      title: note.title,
      subject: note.subject,
      date: new Date(note.date),
      author: note.author as 'Thiago' | 'Kalil'
    }));
    
    dataCache.notes = notes;
    dataCache.lastUpdate.notes = now;
    
    console.log('✅ Notas carregadas:', notes.length);
    return notes;
    
  } catch (error) {
    console.error('❌ Erro ao carregar notas:', error);
    return dataCache.notes.length > 0 ? dataCache.notes : [];
  } finally {
    loadingStates.notes = false;
  }
};

export const createNote = async (note: Omit<Note, 'id'>): Promise<Note> => {
  try {
    const result = await retryOperation(async () => {
      const queryPromise = supabase
        .from('notes')
        .insert({
          title: note.title.trim(),
          subject: note.subject.trim(),
          date: note.date.toISOString(),
          author: note.author
        })
        .select()
        .single();
      
      return await withTimeout(queryPromise);
    });

    if (result.error) {
      throw new Error(`Erro ao criar: ${result.error.message}`);
    }
    
    const newNote = {
      id: result.data.id,
      title: result.data.title,
      subject: result.data.subject,
      date: new Date(result.data.date),
      author: result.data.author as 'Thiago' | 'Kalil'
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
    
    if (updates.title) {
      updates.title = updates.title.trim();
    }
    
    if (updates.subject) {
      updates.subject = updates.subject.trim();
    }
    
    delete updates.id;
    
    const result = await retryOperation(async () => {
      const queryPromise = supabase
        .from('notes')
        .update(updates)
        .eq('id', id);
      
      return await withTimeout(queryPromise);
    });

    if (result.error) {
      throw new Error(`Erro ao atualizar: ${result.error.message}`);
    }
    
    invalidateCache('notes');
  } catch (error) {
    console.error('❌ Falha ao atualizar nota:', error);
    throw error;
  }
};

export const deleteNote = async (id: string): Promise<void> => {
  try {
    const result = await retryOperation(async () => {
      const queryPromise = supabase
        .from('notes')
        .delete()
        .eq('id', id);
      
      return await withTimeout(queryPromise);
    });

    if (result.error) {
      throw new Error(`Erro ao deletar: ${result.error.message}`);
    }
    
    invalidateCache('notes');
  } catch (error) {
    console.error('❌ Falha ao deletar nota:', error);
    throw error;
  }
};

// REAL-TIME
let realtimeCleanup: (() => void) | null = null;

export const setupRealtimeSubscriptions = (
  onEventsChange: () => void, 
  onDemandsChange: () => void, 
  onCRMChange: () => void, 
  onNotesChange: () => void
) => {
  // Limpar subscriptions existentes
  if (realtimeCleanup) {
    console.log('🧹 Limpando subscriptions...');
    realtimeCleanup();
  }
  
  console.log('🔌 Configurando Real-time...');
  
  // Debounce para evitar spam
  const createDebounced = (fn: Function, delay: number = 500) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        invalidateCache();
        fn.apply(null, args);
      }, delay);
    };
  };
  
  const debouncedEventsChange = createDebounced(onEventsChange);
  const debouncedDemandsChange = createDebounced(onDemandsChange);
  const debouncedCRMChange = createDebounced(onCRMChange);
  const debouncedNotesChange = createDebounced(onNotesChange);
  
  // Criar channels
  const eventsChannel = supabase
    .channel('events-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, debouncedEventsChange)
    .subscribe((status) => {
      console.log('📡 Events channel:', status);
    });
    
  const demandsChannel = supabase
    .channel('demands-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'demands' }, debouncedDemandsChange)
    .subscribe((status) => {
      console.log('📡 Demands channel:', status);
    });
    
  const crmChannel = supabase
    .channel('crm-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'crm_records' }, debouncedCRMChange)
    .subscribe((status) => {
      console.log('📡 CRM channel:', status);
    });
    
  const notesChannel = supabase
    .channel('notes-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, debouncedNotesChange)
    .subscribe((status) => {
      console.log('📡 Notes channel:', status);
    });

  // Função de limpeza
  realtimeCleanup = () => {
    console.log('🧹 Removendo channels...');
    supabase.removeChannel(eventsChannel);
    supabase.removeChannel(demandsChannel);
    supabase.removeChannel(crmChannel);
    supabase.removeChannel(notesChannel);
  };
  
  return realtimeCleanup;
};

// Função para invalidar cache
export const invalidateCache = (type?: 'events' | 'demands' | 'crm' | 'notes') => {
  if (type) {
    dataCache.lastUpdate[type] = 0;
    dataCache[type] = [] as any;
    console.log(`🔄 Cache invalidado: ${type}`);
  } else {
    Object.keys(dataCache.lastUpdate).forEach(key => {
      dataCache.lastUpdate[key as keyof typeof dataCache.lastUpdate] = 0;
      dataCache[key as keyof typeof dataCache] = [] as any;
    });
    console.log('🔄 Todo cache invalidado');
  }
};

// Função para verificar conectividade
export const checkConnectivity = async (): Promise<boolean> => {
  try {
    const queryPromise = supabase
      .from('events')
      .select('id')
      .limit(1);
    
    const { error } = await withTimeout(queryPromise, 5000);
    
    return !error;
  } catch (error) {
    console.error('❌ Teste de conectividade falhou:', error);
    return false;
  }
};
