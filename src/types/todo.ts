export interface TodoItem {
  id: string;
  text: string;
  completed: boolean;
  priority?: Priority;
  creationDate?: Date;
  completionDate?: Date;
  projects: string[];
  contexts: string[];
  keyValuePairs: Record<string, string>;
  rawText: string;
  reminder?: ReminderSettings;
}

export interface ReminderSettings {
  dateTime: Date;
  message?: string;
  enabled: boolean;
  notified?: boolean;
}

export type Priority = 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | 'H' | 'I' | 'J' | 'K' | 'L' | 'M' | 'N' | 'O' | 'P' | 'Q' | 'R' | 'S' | 'T' | 'U' | 'V' | 'W' | 'X' | 'Y' | 'Z';

export interface TodoFilter {
  completed?: boolean;
  priority?: TodoItem['priority'];
  projects?: string[];
  contexts?: string[];
  searchText?: string;
}

export interface TodoStats {
  total: number;
  completed: number;
  pending: number;
  byPriority: Record<NonNullable<TodoItem['priority']>, number>;
  byProject: Record<string, number>;
  byContext: Record<string, number>;
}

export type SortField = 'priority' | 'creationDate' | 'text' | 'completed';
export type SortDirection = 'asc' | 'desc';