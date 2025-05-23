import { supabase } from '@/integrations/supabase/client';
import { Event, Demand, CRM, Note } from '@/types/event';

// Events
export const fetchEvents = async (): Promise<Event[]> => {
  console.log('🔄 Fetching events from database...');
  const { data, error } = await supabase
    .from('events')
    .select('*')
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
  }));
};

export const createEvent = async (event: Omit<Event, 'id' | 'archived' | 'demands'>): Promise<Event> => {
  console.log('🔄 Creating new event:', event.name);
  const { data, error } = await supabase
    .from('events')
    .insert({
      name: event.name,
      date: event.date.toISOString(),
      logo: event.logo,
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
};

export const updateEvent = async (id: string, event: Partial<Event>): Promise<void> => {
  console.log('🔄 Updating event:', id, event);
  const updates: any = { ...event };
  
  // Convert Date object to ISO string for database storage
  if (updates.date instanceof Date) {
    updates.date = updates.date.toISOString();
  }
  
  // Remove demands from updates as it's not a database column
  delete updates.demands;
  
  const { error } = await supabase
    .from('events')
    .update(updates)
    .eq('id', id);
  
  if (error) {
    console.error('❌ Error updating event:', error);
    throw error;
  }

  console.log('✅ Event updated successfully:', id);
};

export const deleteEvent = async (id: string): Promise<void> => {
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
};

// Demands
export const fetchDemands = async (): Promise<Demand[]> => {
  const { data, error } = await supabase
    .from('demands')
    .select('*')
    .order('date', { ascending: true });
  
  if (error) {
    console.error('Error fetching demands:', error);
    throw error;
  }

  return data.map((demand: any) => ({
    id: demand.id,
    eventId: demand.event_id, // Map event_id to eventId
    title: demand.title,
    subject: demand.subject,
    date: new Date(demand.date),
    completed: demand.completed,
    urgency: demand.urgency as Demand['urgency'], // Type assertion for urgency
  }));
};

export const createDemand = async (demand: Omit<Demand, 'id' | 'completed' | 'urgency'>): Promise<Demand> => {
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
    console.error('Error creating demand:', error);
    throw error;
  }

  return {
    id: data.id,
    eventId: data.event_id, // Map event_id to eventId
    title: data.title,
    subject: data.subject,
    date: new Date(data.date),
    completed: data.completed,
    urgency: data.urgency as Demand['urgency'], // Type assertion for urgency
  };
};

export const updateDemand = async (id: string, demand: Partial<Demand>): Promise<void> => {
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
    console.error('Error updating demand:', error);
    throw error;
  }
};

export const deleteDemand = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('demands')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting demand:', error);
    throw error;
  }
};

// CRM
export const fetchCRMRecords = async (): Promise<CRM[]> => {
  const { data, error } = await supabase
    .from('crm_records')
    .select('*')
    .order('date', { ascending: true });
  
  if (error) {
    console.error('Error fetching CRM records:', error);
    throw error;
  }

  return data.map((crm: any) => ({
    id: crm.id,
    name: crm.name,
    contact: crm.contact,
    email: crm.email,
    subject: crm.subject,
    file: crm.file,
    date: new Date(crm.date),
    completed: crm.completed,
    status: crm.status || 'Ativo', // Default to 'Ativo' if not set
  }));
};

export const createCRMRecord = async (crm: Omit<CRM, 'id'>): Promise<CRM> => {
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
    console.error('Error creating CRM record:', error);
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
    status: (data.status === 'Inativo' ? 'Inativo' : 'Ativo') as CRM['status'], // Type assertion with fallback
  };
};

export const updateCRMRecord = async (id: string, crm: Partial<CRM>): Promise<void> => {
  const updates: any = { ...crm };
  
  if (updates.date instanceof Date) {
    updates.date = updates.date.toISOString();
  }
  
  const { error } = await supabase
    .from('crm_records')
    .update(updates)
    .eq('id', id);
  
  if (error) {
    console.error('Error updating CRM record:', error);
    throw error;
  }
};

export const deleteCRMRecord = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('crm_records')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting CRM record:', error);
    throw error;
  }
};

// Notes
export const fetchNotes = async (): Promise<Note[]> => {
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .order('date', { ascending: false });
  
  if (error) {
    console.error('Error fetching notes:', error);
    throw error;
  }

  return data.map((note: any) => ({
    id: note.id,
    title: note.title,
    subject: note.subject,
    date: new Date(note.date),
    author: note.author as 'Thiago' | 'Kalil', // Type assertion for author
  }));
};

export const createNote = async (note: Omit<Note, 'id'>): Promise<Note> => {
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
    console.error('Error creating note:', error);
    throw error;
  }

  return {
    id: data.id,
    title: data.title,
    subject: data.subject,
    date: new Date(data.date),
    author: data.author as 'Thiago' | 'Kalil', // Type assertion for author
  };
};

export const updateNote = async (id: string, note: Partial<Note>): Promise<void> => {
  const updates: any = { ...note };
  
  if (updates.date instanceof Date) {
    updates.date = updates.date.toISOString();
  }
  
  const { error } = await supabase
    .from('notes')
    .update(updates)
    .eq('id', id);
  
  if (error) {
    console.error('Error updating note:', error);
    throw error;
  }
};

export const deleteNote = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('notes')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting note:', error);
    throw error;
  }
};

// Enhanced real-time subscription setup with proper channel configuration
export const setupRealtimeSubscriptions = (
  onEventsChange: () => void, 
  onDemandsChange: () => void, 
  onCRMChange: () => void, 
  onNotesChange: () => void
) => {
  console.log('🔌 Setting up enhanced real-time subscriptions...');
  
  // Events channel with enhanced logging
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
        console.log('🔥 EVENTO EM TEMPO REAL DETECTADO:', payload);
        console.log('🔥 Tipo de mudança:', payload.eventType);
        console.log('🔥 Dados do evento:', payload.new || payload.old);
        
        // Trigger immediate update
        onEventsChange();
        
        // Additional logging for debugging
        if (payload.eventType === 'INSERT') {
          console.log('➕ Novo evento criado:', payload.new?.name);
        } else if (payload.eventType === 'UPDATE') {
          console.log('✏️ Evento editado:', payload.new?.name);
        } else if (payload.eventType === 'DELETE') {
          console.log('🗑️ Evento deletado:', payload.old?.name);
        }
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
        onDemandsChange();
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
        onCRMChange();
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
        onNotesChange();
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
  return () => {
    console.log('🧹 Limpando subscriptions em tempo real...');
    supabase.removeChannel(eventsChannel);
    supabase.removeChannel(demandsChannel);
    supabase.removeChannel(crmChannel);
    supabase.removeChannel(notesChannel);
    console.log('✅ Todos os canais em tempo real removidos');
  };
};
