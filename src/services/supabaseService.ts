
import { supabase } from '@/integrations/supabase/client';
import { Event, Demand, CRM, Note } from '@/types/event';

// Events
export const fetchEvents = async (): Promise<Event[]> => {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('date', { ascending: true });
  
  if (error) {
    console.error('Error fetching events:', error);
    throw error;
  }

  return data.map((event: any) => ({
    ...event,
    date: new Date(event.date),
    demands: [],
  }));
};

export const createEvent = async (event: Omit<Event, 'id' | 'archived' | 'demands'>): Promise<Event> => {
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
    console.error('Error creating event:', error);
    throw error;
  }

  return {
    ...data,
    date: new Date(data.date),
    demands: [],
  };
};

export const updateEvent = async (id: string, event: Partial<Event>): Promise<void> => {
  const updates: any = { ...event };
  
  // Convert Date object to ISO string for database storage
  if (updates.date instanceof Date) {
    updates.date = updates.date.toISOString();
  }
  
  const { error } = await supabase
    .from('events')
    .update(updates)
    .eq('id', id);
  
  if (error) {
    console.error('Error updating event:', error);
    throw error;
  }
};

export const deleteEvent = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', id);
  
  if (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
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
    urgency: demand.urgency,
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
    urgency: data.urgency,
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
    ...crm,
    date: new Date(crm.date),
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
    })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating CRM record:', error);
    throw error;
  }

  return {
    ...data,
    date: new Date(data.date),
  };
};

export const updateCRMRecord = async (id: string, crm: Partial<CRM>): Promise<void> => {
  const updates: any = { ...crm };
  
  // Convert Date object to ISO string for database storage
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
  
  // Convert Date object to ISO string for database storage
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

// Real-time subscription setup
export const setupRealtimeSubscriptions = (onEventsChange: () => void, onDemandsChange: () => void, onCRMChange: () => void, onNotesChange: () => void) => {
  // Listen for changes to the events table
  const eventsChannel = supabase
    .channel('events-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'events' },
      (payload) => {
        console.log('Events change received:', payload);
        onEventsChange();
      }
    )
    .subscribe();

  // Listen for changes to the demands table  
  const demandsChannel = supabase
    .channel('demands-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'demands' },
      (payload) => {
        console.log('Demands change received:', payload);
        onDemandsChange();
      }
    )
    .subscribe();

  // Listen for changes to the CRM records table
  const crmChannel = supabase
    .channel('crm-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'crm_records' },
      (payload) => {
        console.log('CRM change received:', payload);
        onCRMChange();
      }
    )
    .subscribe();

  // Listen for changes to the notes table
  const notesChannel = supabase
    .channel('notes-changes')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'notes' },
      (payload) => {
        console.log('Notes change received:', payload);
        onNotesChange();
      }
    )
    .subscribe();

  // Return cleanup function to remove all channels
  return () => {
    supabase.removeChannel(eventsChannel);
    supabase.removeChannel(demandsChannel);
    supabase.removeChannel(crmChannel);
    supabase.removeChannel(notesChannel);
  };
};
