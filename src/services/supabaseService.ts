import { supabase } from '@/integrations/supabase/client';
import { Event, Demand, CRM, Note } from '@/types/event';

// Cache otimizado para evitar múltiplas chamadas
let loadingStates = {
  events: false,
  demands: false,
  crm: false,
  notes: false
};

// Cache de dados para melhor performance
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

const CACHE_DURATION = 3000; // 3 segundos para melhor responsividade

// Events - Otimizado para performance
export const fetchEvents = async (forceRefresh = false): Promise<Event[]> => {
  const now = Date.now();
  
  // Usar cache se não forçado e dados são recentes
  if (!forceRefresh && 
      dataCache.events.length > 0 && 
      (now - dataCache.lastUpdate.events) < CACHE_DURATION) {
    console.log('📦 Using cached events data');
    return dataCache.events;
  }
  
  if (loadingStates.events && !forceRefresh) {
    console.log('⏳ Events already loading, waiting...');
    await new Promise(resolve => setTimeout(resolve, 100));
    return dataCache.events;
  }
  
  try {
    loadingStates.events = true;
    console.log('🔄 Fetching events from database...');
    
    // Query otimizada com timeout menor
    const { data, error } = await supabase
      .from('events')
      .select('id, name, date, archived, logo, created_at, updated_at')
      .order('date', { ascending: true })
      .abortSignal(AbortSignal.timeout(8000)); // 8 segundos timeout
    
    if (error) {
      console.error('❌ Error fetching events:', error);
      // Retornar cache em caso de erro se disponível
      if (dataCache.events.length > 0) {
        console.log('🔄 Returning cached data due to error');
        return dataCache.events;
      }
      throw error;
    }

    console.log('✅ Events fetched successfully:', data?.length || 0);
    
    const events = (data || []).map((event: any) => ({
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
    console.error('❌ Critical error fetching events:', error);
    // Retornar cache se disponível
    if (dataCache.events.length > 0) {
      console.log('🔄 Returning cached data due to critical error');
      return dataCache.events;
    }
    throw error;
  } finally {
    loadingStates.events = false;
  }
};

export const createEvent = async (event: Omit<Event, 'id' | 'archived' | 'demands'>): Promise<Event> => {
  try {
    console.log('🔄 Creating new event:', event.name);
    
    // Processar logo se presente
    let logo = event.logo;
    if (logo && typeof logo === 'string' && logo.length > 1048576) { // 1MB limit
      console.warn('⚠️ Logo size too large, removing');
      logo = undefined;
    }
    
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
      console.error('❌ Error creating event:', error);
      throw error;
    }

    console.log('✅ Event created successfully:', data.id);
    
    const newEvent = {
      ...data,
      date: new Date(data.date),
      demands: [],
      logo: data.logo && data.logo !== 'undefined' ? data.logo : undefined
    };
    
    // Invalidar cache imediatamente
    dataCache.lastUpdate.events = 0;
    
    return newEvent;
  } catch (error) {
    console.error('❌ Create event failed:', error);
    throw error;
  }
};

export const updateEvent = async (id: string, event: Partial<Event>): Promise<void> => {
  try {
    console.log('🔄 Updating event:', id);
    const updates: any = { ...event };
    
    // Convert Date object to ISO string for database storage
    if (updates.date instanceof Date) {
      updates.date = updates.date.toISOString();
    }
    
    // Remove demands from updates as it's not a database column
    delete updates.demands;
    
    // Processar logo se presente
    if (updates.logo && typeof updates.logo === 'string' && updates.logo.length > 1048576) {
      console.warn('⚠️ Logo size too large, removing');
      updates.logo = null;
    }
    
    // Trim name if present
    if (updates.name) {
      updates.name = updates.name.trim();
    }
    
    const { error } = await supabase
      .from('events')
      .update(updates)
      .eq('id', id);
    
    if (error) {
      console.error('❌ Error updating event:', error);
      throw error;
    }

    console.log('✅ Event updated successfully:', id);
    
    // Invalidar cache imediatamente
    dataCache.lastUpdate.events = 0;
  } catch (error) {
    console.error('❌ Update event failed:', error);
    throw error;
  }
};

export const deleteEvent = async (id: string): Promise<void> => {
  try {
    console.log('🔄 Deleting event:', id);
    const { error } = await supabase
      .from('events')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('❌ Error deleting event:', error);
      throw error;
    }

    console.log('✅ Event deleted successfully:', id);
    
    // Invalidar cache imediatamente
    dataCache.lastUpdate.events = 0;
  } catch (error) {
    console.error('❌ Delete event failed:', error);
    throw error;
  }
};

// Demands - Mantendo as otimizações existentes
export const fetchDemands = async (forceRefresh = false): Promise<Demand[]> => {
  const now = Date.now();
  
  if (!forceRefresh && 
      dataCache.demands.length > 0 && 
      (now - dataCache.lastUpdate.demands) < CACHE_DURATION) {
    console.log('📦 Using cached demands data');
    return dataCache.demands;
  }
  
  if (loadingStates.demands && !forceRefresh) {
    console.log('⏳ Demands already loading, waiting...');
    await new Promise(resolve => setTimeout(resolve, 100));
    return dataCache.demands;
  }
  
  try {
    loadingStates.demands = true;
    console.log('🔄 Fetching demands from database...');
    
    const { data, error } = await supabase
      .from('demands')
      .select('*')
      .order('date', { ascending: true })
      .abortSignal(AbortSignal.timeout(8000));
    
    if (error) {
      console.error('❌ Error fetching demands:', error);
      if (dataCache.demands.length > 0) {
        return dataCache.demands;
      }
      throw error;
    }

    console.log('✅ Demands fetched successfully:', data?.length || 0);
    
    const demands = (data || []).map((demand: any) => ({
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
    console.error('❌ Critical error fetching demands:', error);
    if (dataCache.demands.length > 0) {
      return dataCache.demands;
    }
    throw error;
  } finally {
    loadingStates.demands = false;
  }
};

export const createDemand = async (demand: Omit<Demand, 'id' | 'completed' | 'urgency'>): Promise<Demand> => {
  try {
    // Calculate urgency
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
    
    if (error) {
      console.error('❌ Error creating demand:', error);
      throw error;
    }

    const newDemand = {
      id: data.id,
      eventId: data.event_id,
      title: data.title,
      subject: data.subject,
      date: new Date(data.date),
      completed: data.completed,
      urgency: data.urgency as Demand['urgency'],
    };
    
    dataCache.lastUpdate.demands = 0;
    return newDemand;
  } catch (error) {
    console.error('❌ Create demand failed:', error);
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
    
    const { error } = await supabase
      .from('demands')
      .update(updates)
      .eq('id', id);
    
    if (error) {
      console.error('❌ Error updating demand:', error);
      throw error;
    }
    
    dataCache.lastUpdate.demands = 0;
  } catch (error) {
    console.error('❌ Update demand failed:', error);
    throw error;
  }
};

export const deleteDemand = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('demands')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('❌ Error deleting demand:', error);
      throw error;
    }
    
    dataCache.lastUpdate.demands = 0;
  } catch (error) {
    console.error('❌ Delete demand failed:', error);
    throw error;
  }
};

// CRM
export const fetchCRMRecords = async (forceRefresh = false): Promise<CRM[]> => {
  const now = Date.now();
  
  if (!forceRefresh && 
      dataCache.crm.length > 0 && 
      (now - dataCache.lastUpdate.crm) < CACHE_DURATION) {
    console.log('📦 Using cached CRM data');
    return dataCache.crm;
  }
  
  if (loadingStates.crm && !forceRefresh) {
    console.log('⏳ CRM already loading, waiting...');
    await new Promise(resolve => setTimeout(resolve, 100));
    return dataCache.crm;
  }
  
  try {
    loadingStates.crm = true;
    console.log('🔄 Fetching CRM records from database...');
    
    const { data, error } = await supabase
      .from('crm_records')
      .select('*')
      .order('date', { ascending: true })
      .abortSignal(AbortSignal.timeout(8000));
    
    if (error) {
      console.error('❌ Error fetching CRM records:', error);
      if (dataCache.crm.length > 0) {
        return dataCache.crm;
      }
      throw error;
    }

    console.log('✅ CRM records fetched successfully:', data?.length || 0);
    
    const crmRecords = (data || []).map((crm: any) => ({
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
    console.error('❌ Critical error fetching CRM:', error);
    if (dataCache.crm.length > 0) {
      return dataCache.crm;
    }
    throw error;
  } finally {
    loadingStates.crm = false;
  }
};

export const createCRMRecord = async (crm: Omit<CRM, 'id'>): Promise<CRM> => {
  try {
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
    
    if (error) {
      console.error('❌ Error creating CRM record:', error);
      throw error;
    }

    const newCRM = {
      id: data.id,
      name: data.name,
      contact: data.contact,
      email: data.email,
      subject: data.subject,
      file: data.file,
      date: new Date(data.date),
      completed: data.completed,
      status: (data.status === 'Inativo' ? 'Inativo' : 'Ativo') as CRM['status'],
    };
    
    dataCache.lastUpdate.crm = 0;
    return newCRM;
  } catch (error) {
    console.error('❌ Create CRM record failed:', error);
    throw error;
  }
};

export const updateCRMRecord = async (id: string, crm: Partial<CRM>): Promise<void> => {
  try {
    const updates: any = { ...crm };
    
    if (updates.date instanceof Date) {
      updates.date = updates.date.toISOString();
    }
    
    const { error } = await supabase
      .from('crm_records')
      .update(updates)
      .eq('id', id);
    
    if (error) {
      console.error('❌ Error updating CRM record:', error);
      throw error;
    }
    
    dataCache.lastUpdate.crm = 0;
  } catch (error) {
    console.error('❌ Update CRM record failed:', error);
    throw error;
  }
};

export const deleteCRMRecord = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('crm_records')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('❌ Error deleting CRM record:', error);
      throw error;
    }
    
    dataCache.lastUpdate.crm = 0;
  } catch (error) {
    console.error('❌ Delete CRM record failed:', error);
    throw error;
  }
};

// Notes
export const fetchNotes = async (forceRefresh = false): Promise<Note[]> => {
  const now = Date.now();
  
  if (!forceRefresh && 
      dataCache.notes.length > 0 && 
      (now - dataCache.lastUpdate.notes) < CACHE_DURATION) {
    console.log('📦 Using cached notes data');
    return dataCache.notes;
  }
  
  if (loadingStates.notes && !forceRefresh) {
    console.log('⏳ Notes already loading, waiting...');
    await new Promise(resolve => setTimeout(resolve, 100));
    return dataCache.notes;
  }
  
  try {
    loadingStates.notes = true;
    console.log('🔄 Fetching notes from database...');
    
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('date', { ascending: false })
      .abortSignal(AbortSignal.timeout(8000));
    
    if (error) {
      console.error('❌ Error fetching notes:', error);
      if (dataCache.notes.length > 0) {
        return dataCache.notes;
      }
      throw error;
    }

    console.log('✅ Notes fetched successfully:', data?.length || 0);
    
    const notes = (data || []).map((note: any) => ({
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
    console.error('❌ Critical error fetching notes:', error);
    if (dataCache.notes.length > 0) {
      return dataCache.notes;
    }
    throw error;
  } finally {
    loadingStates.notes = false;
  }
};

export const createNote = async (note: Omit<Note, 'id'>): Promise<Note> => {
  try {
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
    
    if (error) {
      console.error('❌ Error creating note:', error);
      throw error;
    }

    const newNote = {
      id: data.id,
      title: data.title,
      subject: data.subject,
      date: new Date(data.date),
      author: data.author as 'Thiago' | 'Kalil',
    };
    
    dataCache.lastUpdate.notes = 0;
    return newNote;
  } catch (error) {
    console.error('❌ Create note failed:', error);
    throw error;
  }
};

export const updateNote = async (id: string, note: Partial<Note>): Promise<void> => {
  try {
    const updates: any = { ...note };
    
    if (updates.date instanceof Date) {
      updates.date = updates.date.toISOString();
    }
    
    const { error } = await supabase
      .from('notes')
      .update(updates)
      .eq('id', id);
    
    if (error) {
      console.error('❌ Error updating note:', error);
      throw error;
    }
    
    dataCache.lastUpdate.notes = 0;
  } catch (error) {
    console.error('❌ Update note failed:', error);
    throw error;
  }
};

export const deleteNote = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('notes')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('❌ Error deleting note:', error);
      throw error;
    }
    
    dataCache.lastUpdate.notes = 0;
  } catch (error) {
    console.error('❌ Delete note failed:', error);
    throw error;
  }
};

// Sistema de Real-time OTIMIZADO e ROBUSTO
let realtimeCleanup: (() => void) | null = null;
let realtimeRetryCount = 0;
const MAX_RETRY_COUNT = 3;

export const setupRealtimeSubscriptions = (
  onEventsChange: () => void, 
  onDemandsChange: () => void, 
  onCRMChange: () => void, 
  onNotesChange: () => void
) => {
  // Limpar subscriptions existentes
  if (realtimeCleanup) {
    console.log('🧹 Cleaning up existing realtime subscriptions...');
    realtimeCleanup();
  }
  
  console.log('🔌 Setting up OPTIMIZED real-time subscriptions...');
  
  // Debounce inteligente para evitar spam
  const createDebouncedHandler = (fn: Function, delay: number, name: string) => {
    let timeoutId: NodeJS.Timeout;
    let lastCall = 0;
    
    return (...args: any[]) => {
      const now = Date.now();
      
      // Evitar chamadas muito frequentes
      if (now - lastCall < 500) {
        console.log(`⚡ ${name} change debounced (too frequent)`);
        return;
      }
      
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        console.log(`🔥 ${name} REALTIME UPDATE TRIGGERED`);
        lastCall = Date.now();
        fn.apply(null, args);
      }, delay);
    };
  };
  
  const debouncedEventsChange = createDebouncedHandler(() => {
    console.log('🔥 EVENTS REALTIME SYNC STARTING...');
    dataCache.lastUpdate.events = 0; // Força refresh
    onEventsChange();
  }, 200, 'EVENTS');
  
  const debouncedDemandsChange = createDebouncedHandler(() => {
    console.log('🔥 DEMANDS REALTIME SYNC STARTING...');
    dataCache.lastUpdate.demands = 0; // Força refresh
    onDemandsChange();
  }, 200, 'DEMANDS');
  
  const debouncedCRMChange = createDebouncedHandler(() => {
    console.log('🔥 CRM REALTIME SYNC STARTING...');
    dataCache.lastUpdate.crm = 0; // Força refresh
    onCRMChange();
  }, 200, 'CRM');
  
  const debouncedNotesChange = createDebouncedHandler(() => {
    console.log('🔥 NOTES REALTIME SYNC STARTING...');
    dataCache.lastUpdate.notes = 0; // Força refresh
    onNotesChange();
  }, 200, 'NOTES');
  
  // Função para reconectar em caso de erro
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
          console.log(`🔥 REAL-TIME ${tableName.toUpperCase()} DETECTED:`, payload.eventType, payload.new?.id || payload.old?.id);
          handler();
        }
      )
      .subscribe((status) => {
        console.log(`📡 ${tableName.toUpperCase()} channel status:`, status);
        
        if (status === 'SUBSCRIBED') {
          console.log(`✅ ${tableName.toUpperCase()}: Real-time sync ACTIVE 🚀`);
          realtimeRetryCount = 0; // Reset retry count on success
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          console.error(`❌ ${tableName.toUpperCase()}: Real-time sync FAILED:`, status);
          
          // Retry logic
          if (realtimeRetryCount < MAX_RETRY_COUNT) {
            realtimeRetryCount++;
            console.log(`🔄 Retrying ${tableName} subscription (${realtimeRetryCount}/${MAX_RETRY_COUNT})...`);
            setTimeout(() => {
              supabase.removeChannel(channel);
              setupChannelWithRetry(channelName, tableName, handler);
            }, 2000 * realtimeRetryCount); // Exponential backoff
          } else {
            console.error(`💀 ${tableName.toUpperCase()}: Max retries reached. Real-time disabled for this table.`);
          }
        }
      });
      
    return channel;
  };

  // Events channel - CRÍTICO para sincronização
  const eventsChannel = setupChannelWithRetry('realtime:events', 'events', debouncedEventsChange);

  // Demands channel
  const demandsChannel = setupChannelWithRetry('realtime:demands', 'demands', debouncedDemandsChange);

  // CRM channel
  const crmChannel = setupChannelWithRetry('realtime:crm_records', 'crm_records', debouncedCRMChange);

  // Notes channel
  const notesChannel = setupChannelWithRetry('realtime:notes', 'notes', debouncedNotesChange);

  // Return cleanup function
  realtimeCleanup = () => {
    console.log('🧹 Cleaning up ALL real-time subscriptions...');
    try {
      supabase.removeChannel(eventsChannel);
      supabase.removeChannel(demandsChannel);
      supabase.removeChannel(crmChannel);
      supabase.removeChannel(notesChannel);
      console.log('✅ All real-time channels cleaned up successfully');
    } catch (error) {
      console.error('❌ Error cleaning up channels:', error);
    }
  };
  
  return realtimeCleanup;
};

// Função para invalidar cache manualmente se necessário
export const invalidateCache = (type?: 'events' | 'demands' | 'crm' | 'notes') => {
  if (type) {
    dataCache.lastUpdate[type] = 0;
    console.log(`🔄 Cache invalidated for: ${type}`);
  } else {
    Object.keys(dataCache.lastUpdate).forEach(key => {
      dataCache.lastUpdate[key as keyof typeof dataCache.lastUpdate] = 0;
    });
    console.log('🔄 All cache invalidated');
  }
};
