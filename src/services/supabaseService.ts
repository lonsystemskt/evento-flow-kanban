import { supabase } from '@/integrations/supabase/client';
import { Event, Demand, CRM, Note } from '@/types/event';

// Cache mais inteligente para evitar múltiplas chamadas
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

const CACHE_DURATION = 5000; // 5 segundos

// Events
export const fetchEvents = async (forceRefresh = false): Promise<Event[]> => {
  const now = Date.now();
  
  // Usar cache se não forçado e dados são recentes
  if (!forceRefresh && 
      dataCache.events.length > 0 && 
      (now - dataCache.lastUpdate.events) < CACHE_DURATION) {
    console.log('📦 Using cached events data');
    return dataCache.events;
  }
  
  if (loadingStates.events) {
    console.log('⏳ Events already loading, waiting...');
    // Aguardar um pouco e tentar novamente
    await new Promise(resolve => setTimeout(resolve, 100));
    return dataCache.events;
  }
  
  try {
    loadingStates.events = true;
    console.log('🔄 Fetching events from database...');
    
    const { data, error } = await supabase
      .from('events')
      .select('id, name, date, archived, logo, created_at, updated_at')
      .order('date', { ascending: true });
    
    if (error) {
      console.error('❌ Error fetching events:', error);
      throw error;
    }

    console.log('✅ Events fetched successfully:', data?.length || 0);
    
    const events = data.map((event: any) => ({
      ...event,
      date: new Date(event.date),
      demands: [],
      logo: event.logo && event.logo !== 'undefined' ? event.logo : undefined
    }));
    
    // Atualizar cache
    dataCache.events = events;
    dataCache.lastUpdate.events = now;
    
    return events;
  } finally {
    loadingStates.events = false;
  }
};

export const createEvent = async (event: Omit<Event, 'id' | 'archived' | 'demands'>): Promise<Event> => {
  try {
    console.log('🔄 Creating new event:', event.name);
    
    // Processar logo se presente
    let logo = event.logo;
    if (logo && typeof logo === 'string' && logo.length > 200000) { // ~150KB limit
      console.warn('⚠️ Logo size optimized during creation');
      // Se ainda for muito grande, não incluir
      logo = undefined;
    }
    
    const { data, error } = await supabase
      .from('events')
      .insert({
        name: event.name,
        date: event.date.toISOString(),
        logo: logo,
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
    
    // Invalidar cache
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
    if (updates.logo && typeof updates.logo === 'string' && updates.logo.length > 200000) {
      console.warn('⚠️ Logo size optimized during update');
      updates.logo = null;
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
    
    // Invalidar cache
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
    
    // Invalidar cache
    dataCache.lastUpdate.events = 0;
  } catch (error) {
    console.error('❌ Delete event failed:', error);
    throw error;
  }
};

// Demands
export const fetchDemands = async (forceRefresh = false): Promise<Demand[]> => {
  const now = Date.now();
  
  if (!forceRefresh && 
      dataCache.demands.length > 0 && 
      (now - dataCache.lastUpdate.demands) < CACHE_DURATION) {
    console.log('📦 Using cached demands data');
    return dataCache.demands;
  }
  
  if (loadingStates.demands) {
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
      .order('date', { ascending: true });
    
    if (error) {
      console.error('❌ Error fetching demands:', error);
      throw error;
    }

    console.log('✅ Demands fetched successfully:', data?.length || 0);
    
    const demands = data.map((demand: any) => ({
      id: demand.id,
      eventId: demand.event_id,
      title: demand.title,
      subject: demand.subject,
      date: new Date(demand.date),
      completed: demand.completed,
      urgency: demand.urgency as Demand['urgency'],
    }));
    
    // Atualizar cache
    dataCache.demands = demands;
    dataCache.lastUpdate.demands = now;
    
    return demands;
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
    
    // Invalidar cache
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
    
    // Map eventId to event_id for database
    if (updates.eventId) {
      updates.event_id = updates.eventId;
      delete updates.eventId;
    }
    
    // Convert Date object to ISO string for database storage
    if (updates.date instanceof Date) {
      // Calculate urgency if date is updated
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
    
    // Invalidar cache
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
    
    // Invalidar cache
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
  
  if (loadingStates.crm) {
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
      .order('date', { ascending: true });
    
    if (error) {
      console.error('❌ Error fetching CRM records:', error);
      throw error;
    }

    console.log('✅ CRM records fetched successfully:', data?.length || 0);
    
    const crmRecords = data.map((crm: any) => ({
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
  
  if (loadingStates.notes) {
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
      .order('date', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching notes:', error);
      throw error;
    }

    console.log('✅ Notes fetched successfully:', data?.length || 0);
    
    const notes = data.map((note: any) => ({
      id: note.id,
      title: note.title,
      subject: note.subject,
      date: new Date(note.date),
      author: note.author as 'Thiago' | 'Kalil',
    }));
    
    dataCache.notes = notes;
    dataCache.lastUpdate.notes = now;
    
    return notes;
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

// Sistema de Real-time mais eficiente
let realtimeCleanup: (() => void) | null = null;

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
  
  console.log('🔌 Setting up optimized real-time subscriptions...');
  
  // Debounce mais inteligente
  const createDebouncedHandler = (fn: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        // Invalidar cache relacionado antes de executar
        fn.apply(null, args);
      }, delay);
    };
  };
  
  const debouncedEventsChange = createDebouncedHandler(() => {
    dataCache.lastUpdate.events = 0;
    onEventsChange();
  }, 300);
  
  const debouncedDemandsChange = createDebouncedHandler(() => {
    dataCache.lastUpdate.demands = 0;
    onDemandsChange();
  }, 300);
  
  const debouncedCRMChange = createDebouncedHandler(() => {
    dataCache.lastUpdate.crm = 0;
    onCRMChange();
  }, 300);
  
  const debouncedNotesChange = createDebouncedHandler(() => {
    dataCache.lastUpdate.notes = 0;
    onNotesChange();
  }, 300);
  
  // Events channel
  const eventsChannel = supabase
    .channel('public:events')
    .on(
      'postgres_changes',
      { 
        event: '*', 
        schema: 'public', 
        table: 'events' 
      },
      (payload) => {
        console.log('🔥 REAL-TIME EVENT DETECTED:', payload.eventType);
        debouncedEventsChange();
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ EVENTS: Real-time sync ACTIVE');
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        console.error('❌ EVENTS: Real-time sync FAILED:', status);
      }
    });

  // Demands channel
  const demandsChannel = supabase
    .channel('public:demands')
    .on(
      'postgres_changes',
      { 
        event: '*', 
        schema: 'public', 
        table: 'demands' 
      },
      (payload) => {
        console.log('🔥 REAL-TIME DEMAND DETECTED:', payload.eventType);
        debouncedDemandsChange();
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ DEMANDS: Real-time sync ACTIVE');
      }
    });

  // CRM channel
  const crmChannel = supabase
    .channel('public:crm_records')
    .on(
      'postgres_changes',
      { 
        event: '*', 
        schema: 'public', 
        table: 'crm_records' 
      },
      (payload) => {
        console.log('🔥 REAL-TIME CRM DETECTED:', payload.eventType);
        debouncedCRMChange();
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ CRM: Real-time sync ACTIVE');
      }
    });

  // Notes channel
  const notesChannel = supabase
    .channel('public:notes')
    .on(
      'postgres_changes',
      { 
        event: '*', 
        schema: 'public', 
        table: 'notes' 
      },
      (payload) => {
        console.log('🔥 REAL-TIME NOTE DETECTED:', payload.eventType);
        debouncedNotesChange();
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ NOTES: Real-time sync ACTIVE');
      }
    });

  // Return cleanup function
  realtimeCleanup = () => {
    console.log('🧹 Cleaning up real-time subscriptions...');
    supabase.removeChannel(eventsChannel);
    supabase.removeChannel(demandsChannel);
    supabase.removeChannel(crmChannel);
    supabase.removeChannel(notesChannel);
    console.log('✅ All real-time channels removed');
  };
  
  return realtimeCleanup;
};
