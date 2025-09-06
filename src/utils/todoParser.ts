import { TodoItem, ReminderSettings } from '../types/todo';
import { v4 as uuidv4 } from 'uuid';

export class TodoParser {
  private static readonly PRIORITY_REGEX = /^\(([A-Z])\)\s*/;
  private static readonly DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
  private static readonly PROJECT_REGEX = /\+(\S+)/g;
  private static readonly CONTEXT_REGEX = /@(\S+)/g;
  private static readonly KEY_VALUE_REGEX = /(\w+):(\S+)/g;
  private static readonly REMINDER_REGEX = /reminder:(\d{4}-\d{2}-\d{2}T\d{2}:\d{2})/;

  static parseLine(line: string): TodoItem | null {
    if (!line.trim()) {
      return null;
    }

    const originalLine = line;
    let workingLine = line.trim();
    
    // Check if completed
    const completed = workingLine.startsWith('x ');
    if (completed) {
      workingLine = workingLine.substring(2).trim();
    }

    // Parse completion date (only if completed)
    let completionDate: Date | undefined;
    if (completed && this.DATE_REGEX.test(workingLine.split(' ')[0])) {
      completionDate = new Date(workingLine.split(' ')[0]);
      workingLine = workingLine.substring(11).trim();
    }

    // Parse priority
    let priority: TodoItem['priority'];
    const priorityMatch = workingLine.match(this.PRIORITY_REGEX);
    if (priorityMatch) {
      priority = priorityMatch[1] as TodoItem['priority'];
      workingLine = workingLine.replace(this.PRIORITY_REGEX, '');
    }

    // Parse creation date
    let creationDate: Date | undefined;
    if (this.DATE_REGEX.test(workingLine.split(' ')[0])) {
      creationDate = new Date(workingLine.split(' ')[0]);
      workingLine = workingLine.substring(11).trim();
    }

    // Extract projects
    const projects: string[] = [];
    let match;
    while ((match = this.PROJECT_REGEX.exec(workingLine)) !== null) {
      projects.push(match[1]);
    }

    // Extract contexts
    const contexts: string[] = [];
    this.CONTEXT_REGEX.lastIndex = 0; // Reset regex
    while ((match = this.CONTEXT_REGEX.exec(workingLine)) !== null) {
      contexts.push(match[1]);
    }

    // Extract key-value pairs
    const keyValuePairs: Record<string, string> = {};
    this.KEY_VALUE_REGEX.lastIndex = 0; // Reset regex
    while ((match = this.KEY_VALUE_REGEX.exec(workingLine)) !== null) {
      keyValuePairs[match[1]] = match[2];
    }

    // Parse reminder
    let reminder: ReminderSettings | undefined;
    const reminderMatch = workingLine.match(this.REMINDER_REGEX);
    if (reminderMatch) {
      reminder = {
        dateTime: new Date(reminderMatch[1]),
        enabled: true,
        message: workingLine.replace(this.REMINDER_REGEX, '').trim() || undefined
      };
    }

    // Clean up the text (remove projects, contexts, key-value pairs)
    let cleanText = workingLine
      .replace(this.PROJECT_REGEX, '')
      .replace(this.CONTEXT_REGEX, '')
      .replace(this.KEY_VALUE_REGEX, '')
      .replace(/\s+/g, ' ')
      .trim();

    return {
      id: uuidv4(),
      text: cleanText,
      completed,
      priority,
      creationDate,
      completionDate,
      projects,
      contexts,
      keyValuePairs,
      rawText: originalLine,
      reminder
    };
  }

  static parseFile(content: string): TodoItem[] {
    return content
      .split('\n')
      .map((line, index) => {
        try {
          return this.parseLine(line);
        } catch (error) {
          console.error(`Error parsing line ${index + 1}: ${line}`, error);
          return null;
        }
      })
      .filter((item): item is TodoItem => item !== null);
  }

  static serializeTodo(todo: TodoItem): string {
    let line = '';

    // Add completion marker
    if (todo.completed) {
      line += 'x ';
      
      // Add completion date
      if (todo.completionDate) {
        line += `${this.formatDate(todo.completionDate)} `;
      }
    }

    // Add priority
    if (todo.priority && !todo.completed) {
      line += `(${todo.priority}) `;
    }

    // Add creation date
    if (todo.creationDate) {
      line += `${this.formatDate(todo.creationDate)} `;
    }

    // Add text
    line += todo.text;

    // Add projects
    if (todo.projects.length > 0) {
      line += ' ' + todo.projects.map(p => `+${p}`).join(' ');
    }

    // Add contexts
    if (todo.contexts.length > 0) {
      line += ' ' + todo.contexts.map(c => `@${c}`).join(' ');
    }

    // Add key-value pairs
    if (Object.keys(todo.keyValuePairs).length > 0) {
      const kvPairs = Object.entries(todo.keyValuePairs)
        .map(([key, value]) => `${key}:${value}`)
        .join(' ');
      line += ' ' + kvPairs;
    }

    // Add reminder
    if (todo.reminder?.enabled) {
      line += ` reminder:${todo.reminder.dateTime.toISOString().substring(0, 16)}`;
    }

    return line.trim();
  }

  static serializeFile(todos: TodoItem[]): string {
    return todos.map(todo => this.serializeTodo(todo)).join('\n');
  }

  private static formatDate(date: Date): string {
    return date.toISOString().substring(0, 10);
  }
}