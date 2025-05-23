
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

export type TabType = 'demands' | 'archived' | 'completed';
