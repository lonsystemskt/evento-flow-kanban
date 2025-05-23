
export interface Event {
  id: string;
  name: string;
  date: Date;
  logo?: string;
  archived: boolean;
  demands: Demand[];
}

export interface Demand {
  id: string;
  eventId: string;
  title: string;
  subject: string;
  date: Date;
  completed: boolean;
  urgency: 'overdue' | 'today' | 'tomorrow' | 'future';
}

export interface CRM {
  id: string;
  name: string;
  contact: string;
  email: string;
  subject: string;
  file?: string;
  date: Date;
  completed: boolean;
}

export interface Note {
  id: string;
  title: string;
  subject: string;
  date: Date;
  author: 'Thiago' | 'Kalil';
}

export type TabType = 'demands' | 'overview' | 'crm' | 'notes' | 'archived' | 'completed';
