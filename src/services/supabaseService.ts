import { supabase } from '@/integrations/supabase/client';
import { Event, Demand, CRM, Note } from '@/types/event';

// Cache simples para evitar múltiplas chamadas
let isLoadingEvents = false;
let isLoadingDemands = false;
let isLoadingCRM = false;
let isLoadingNotes = false;

// Events
export const fetchEvents = async (): Promise<Event[]> => {
  if (isLoadingEvents) {
    console.log('⏳ Events already loading, skipping...');
    return [];
  }
  
  try {
    isLoadingEvents = true;
    console.log('🔄 Fetching events from database...');
    
    const { data, error } = await supabase
      .from('events')
      .select('id, name, date, archived, created_at, updated_at')
      .order('date', { ascending: true });
    
    if (error) {
      console.error('❌ Error fetching events:', error);
      throw error;
    }

    console.log('✅ Events fetched successfully:', data?.length || 0);
    return data.map((event: any) => ({
      ...event,
      date: new Date(event.date),
      demands: [],
      logo: undefined // Don't load logo initially to avoid payload issues
    }));
  } finally {
    isLoadingEvents = false;
  }
};

export const createEvent = async (event: Omit<Event, 'id' | 'archived' | 'demands'>): Promise<Event> => {
  try {
    console.log('🔄 Creating new event:', event.name);
    
    // Limit logo size to prevent payload issues
    let logo = event.logo;
    if (logo && logo.length > 100000) { // 100KB limit
      console.warn('⚠️ Logo too large, removing...');
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
    return {
      ...data,
      date: new Date(data.date),
      demands: [],
    };
  } catch (error) {
    console.error('❌ Create event failed:', error);
    throw error;
  }
};

export const updateEvent = async (id: string, event: Partial<Event>): Promise<void> => {
  try {
    console.log('🔄 Updating event:', id, event);
    const updates: any = { ...event };
    
    // Convert Date object to ISO string for database storage
    if (updates.date instanceof Date) {
      updates.date = updates.date.toISOString();
    }
    
    // Remove demands from updates as it's not a database column
    delete updates.demands;
    
    // Limit logo size
    if (updates.logo && updates.logo.length > 100000) {
      console.warn('⚠️ Logo too large, removing...');
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
  } catch (error) {
    console.error('❌ Delete event failed:', error);
    throw error;
  }
};

// Demands
export const fetchDemands = async (): Promise<Demand[]> => {
  if (isLoadingDemands) {
    console.log('⏳ Demands already loading, skipping...');
    return [];
  }
  
  try {
    isLoadingDemands = true;
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
    return data.map((demand: any) => ({
      id: demand.id,
      eventId: demand.event_id,
      title: demand.title,
      subject: demand.subject,
      date: new Date(demand.date),
      completed: demand.completed,
      urgency: demand.urgency as Demand['urgency'],
    }));
  } finally {
    isLoadingDemands = false;
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

    return {
      id: data.id,
      eventId: data.event_id,
      title: data.title,
      subject: data.subject,
      date: new Date(data.date),
      completed: data.completed,
      urgency: data.urgency as Demand['urgency'],
    };
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
  } catch (error) {
    console.error('❌ Delete demand failed:', error);
    throw error;
  }
};

// CRM
export const fetchCRMRecords = async (): Promise<CRM[]> => {
  if (isLoadingCRM) {
    console.log('⏳ CRM already loading, skipping...');
    return [];
  }
  
  try {
    isLoadingCRM = true;
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
    return data.map((crm: any) => ({
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
  } finally {
    isLoadingCRM = false;
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

    return {
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
  } catch (error) {
    console.error('❌ Delete CRM record failed:', error);
    throw error;
  }
};

// Notes
export const fetchNotes = async (): Promise<Note[]> => {
  if (isLoadingNotes) {
    console.log('⏳ Notes already loading, skipping...');
    return [];
  }
  
  try {
    isLoadingNotes = true;
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
    return data.map((note: any) => ({
      id: note.id,
      title: note.title,
      subject: note.subject,
      date: new Date(note.date),
      author: note.author as 'Thiago' | 'Kalil',
    }));
  } finally {
    isLoadingNotes = false;
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

    return {
      id: data.id,
      title: data.title,
      subject: data.subject,
      date: new Date(data.date),
      author: data.author as 'Thiago' | 'Kalil',
    };
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
  } catch (error) {
    console.error('❌ Delete note failed:', error);
    throw error;
  }
};

// Debounced realtime setup to prevent multiple subscriptions
let realtimeCleanup: (() => void) | null = null;

export const setupRealtimeSubscriptions = (
  onEventsChange: () => void, 
  onDemandsChange: () => void, 
  onCRMChange: () => void, 
  onNotesChange: () => void
) => {
  // Clean up existing subscriptions
  if (realtimeCleanup) {
    console.log('🧹 Cleaning up existing realtime subscriptions...');
    realtimeCleanup();
  }
  
  console.log('🔌 Setting up optimized real-time subscriptions...');
  
  // Debounce functions to prevent too many updates
  const debounce = (fn: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn.apply(null, args), delay);
    };
  };
  
  const debouncedEventsChange = debounce(onEventsChange, 500);
  const debouncedDemandsChange = debounce(onDemandsChange, 500);
  const debouncedCRMChange = debounce(onCRMChange, 500);
  const debouncedNotesChange = debounce(onNotesChange, 500);
  
  // Events channel with size limit
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
        console.log('🔥 EVENTO EM TEMPO REAL DETECTADO:', payload.eventType);
        
        // Check for payload size issues
        if (payload.errors && payload.errors.length > 0) {
          console.warn('⚠️ Payload errors detected:', payload.errors);
        }
        
        debouncedEventsChange();
      }
    )
    .subscribe((status) => {
      console.log('📡 Events channel status:', status);
      if (status === 'SUBSCRIBED') {
        console.log('✅ EVENTOS: Sincronização em tempo real ATIVA');
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        console.error('❌ EVENTOS: Falha na sincronização em tempo real:', status);
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
        console.log('🔥 DEMANDA EM TEMPO REAL DETECTADA:', payload);
        debouncedDemandsChange();
      }
    )
    .subscribe((status) => {
      console.log('📡 Demands channel status:', status);
      if (status === 'SUBSCRIBED') {
        console.log('✅ DEMANDAS: Sincronização em tempo real ATIVA');
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        console.error('❌ DEMANDAS: Falha na sincronização em tempo real:', status);
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
        console.log('🔥 CRM EM TEMPO REAL DETECTADO:', payload);
        debouncedCRMChange();
      }
    )
    .subscribe((status) => {
      console.log('📡 CRM channel status:', status);
      if (status === 'SUBSCRIBED') {
        console.log('✅ CRM: Sincronização em tempo real ATIVA');
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        console.error('❌ CRM: Falha na sincronização em tempo real:', status);
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
        console.log('🔥 NOTA EM TEMPO REAL DETECTADA:', payload);
        debouncedNotesChange();
      }
    )
    .subscribe((status) => {
      console.log('📡 Notes channel status:', status);
      if (status === 'SUBSCRIBED') {
        console.log('✅ NOTAS: Sincronização em tempo real ATIVA');
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
        console.error('❌ NOTAS: Falha na sincronização em tempo real:', status);
      }
    });

  // Return cleanup function
  realtimeCleanup = () => {
    console.log('🧹 Limpando subscriptions em tempo real...');
    supabase.removeChannel(eventsChannel);
    supabase.removeChannel(demandsChannel);
    supabase.removeChannel(crmChannel);
    supabase.removeChannel(notesChannel);
    console.log('✅ Todos os canais em tempo real removidos');
  };
  
  return realtimeCleanup;
};
