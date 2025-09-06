import { TodoParser } from '../todoParser';
import { TodoItem } from '../../types/todo';

describe('TodoParser', () => {
  describe('parseLine', () => {
    it('should parse a simple todo', () => {
      const result = TodoParser.parseLine('Buy milk');
      
      expect(result).toMatchObject({
        text: 'Buy milk',
        completed: false,
        projects: [],
        contexts: [],
        keyValuePairs: {},
        rawText: 'Buy milk'
      });
    });

    it('should parse a completed todo', () => {
      const result = TodoParser.parseLine('x Buy milk');
      
      expect(result).toMatchObject({
        text: 'Buy milk',
        completed: true
      });
    });

    it('should parse a todo with priority', () => {
      const result = TodoParser.parseLine('(A) Buy milk');
      
      expect(result).toMatchObject({
        text: 'Buy milk',
        completed: false,
        priority: 'A'
      });
    });

    it('should parse a completed todo with completion date', () => {
      const result = TodoParser.parseLine('x 2023-12-01 Buy milk');
      
      expect(result).toMatchObject({
        text: 'Buy milk',
        completed: true,
        completionDate: new Date('2023-12-01')
      });
    });

    it('should parse a todo with creation date', () => {
      const result = TodoParser.parseLine('2023-12-01 Buy milk');
      
      expect(result).toMatchObject({
        text: 'Buy milk',
        completed: false,
        creationDate: new Date('2023-12-01')
      });
    });

    it('should parse a todo with priority and creation date', () => {
      const result = TodoParser.parseLine('(A) 2023-12-01 Buy milk');
      
      expect(result).toMatchObject({
        text: 'Buy milk',
        completed: false,
        priority: 'A',
        creationDate: new Date('2023-12-01')
      });
    });

    it('should parse projects', () => {
      const result = TodoParser.parseLine('Buy milk +shopping +groceries');
      
      expect(result).toMatchObject({
        text: 'Buy milk',
        projects: ['shopping', 'groceries']
      });
    });

    it('should parse contexts', () => {
      const result = TodoParser.parseLine('Buy milk @store @weekend');
      
      expect(result).toMatchObject({
        text: 'Buy milk',
        contexts: ['store', 'weekend']
      });
    });

    it('should parse key-value pairs', () => {
      const result = TodoParser.parseLine('Buy milk due:2023-12-15 priority:high');
      
      expect(result).toMatchObject({
        text: 'Buy milk',
        keyValuePairs: {
          due: '2023-12-15',
          priority: 'high'
        }
      });
    });

    it('should parse reminder', () => {
      const result = TodoParser.parseLine('Buy milk reminder:2023-12-15T10:00');
      
      expect(result).toMatchObject({
        text: 'Buy milk',
        reminder: {
          dateTime: new Date('2023-12-15T10:00'),
          enabled: true
        }
      });
    });

    it('should parse complex todo with all elements', () => {
      const result = TodoParser.parseLine('x 2023-12-02 (A) 2023-12-01 Call mom +family @home due:2023-12-15 reminder:2023-12-14T18:00');
      
      expect(result).toMatchObject({
        text: 'Call mom',
        completed: true,
        priority: 'A',
        creationDate: new Date('2023-12-01'),
        completionDate: new Date('2023-12-02'),
        projects: ['family'],
        contexts: ['home'],
        keyValuePairs: {
          due: '2023-12-15'
        },
        reminder: {
          dateTime: new Date('2023-12-14T18:00'),
          enabled: true
        }
      });
    });

    it('should return null for empty lines', () => {
      expect(TodoParser.parseLine('')).toBeNull();
      expect(TodoParser.parseLine('   ')).toBeNull();
    });

    it('should handle malformed input gracefully', () => {
      expect(() => TodoParser.parseLine('(Invalid priority')).not.toThrow();
      expect(() => TodoParser.parseLine('x incomplete-date text')).not.toThrow();
    });
  });

  describe('serializeTodo', () => {
    it('should serialize a simple todo', () => {
      const todo: TodoItem = {
        id: 'test',
        text: 'Buy milk',
        completed: false,
        projects: [],
        contexts: [],
        keyValuePairs: {},
        rawText: 'Buy milk'
      };

      const result = TodoParser.serializeTodo(todo);
      expect(result).toBe('Buy milk');
    });

    it('should serialize a completed todo', () => {
      const todo: TodoItem = {
        id: 'test',
        text: 'Buy milk',
        completed: true,
        completionDate: new Date('2023-12-01'),
        projects: [],
        contexts: [],
        keyValuePairs: {},
        rawText: 'x 2023-12-01 Buy milk'
      };

      const result = TodoParser.serializeTodo(todo);
      expect(result).toBe('x 2023-12-01 Buy milk');
    });

    it('should serialize a todo with priority', () => {
      const todo: TodoItem = {
        id: 'test',
        text: 'Buy milk',
        completed: false,
        priority: 'A',
        projects: [],
        contexts: [],
        keyValuePairs: {},
        rawText: '(A) Buy milk'
      };

      const result = TodoParser.serializeTodo(todo);
      expect(result).toBe('(A) Buy milk');
    });

    it('should not include priority for completed todos', () => {
      const todo: TodoItem = {
        id: 'test',
        text: 'Buy milk',
        completed: true,
        priority: 'A',
        projects: [],
        contexts: [],
        keyValuePairs: {},
        rawText: 'x Buy milk'
      };

      const result = TodoParser.serializeTodo(todo);
      expect(result).toBe('x Buy milk');
    });

    it('should serialize with creation date', () => {
      const todo: TodoItem = {
        id: 'test',
        text: 'Buy milk',
        completed: false,
        creationDate: new Date('2023-12-01'),
        projects: [],
        contexts: [],
        keyValuePairs: {},
        rawText: '2023-12-01 Buy milk'
      };

      const result = TodoParser.serializeTodo(todo);
      expect(result).toBe('2023-12-01 Buy milk');
    });

    it('should serialize with projects and contexts', () => {
      const todo: TodoItem = {
        id: 'test',
        text: 'Buy milk',
        completed: false,
        projects: ['shopping'],
        contexts: ['store'],
        keyValuePairs: {},
        rawText: 'Buy milk +shopping @store'
      };

      const result = TodoParser.serializeTodo(todo);
      expect(result).toBe('Buy milk +shopping @store');
    });

    it('should serialize with key-value pairs', () => {
      const todo: TodoItem = {
        id: 'test',
        text: 'Buy milk',
        completed: false,
        projects: [],
        contexts: [],
        keyValuePairs: { due: '2023-12-15' },
        rawText: 'Buy milk due:2023-12-15'
      };

      const result = TodoParser.serializeTodo(todo);
      expect(result).toBe('Buy milk due:2023-12-15');
    });

    it('should serialize with reminder', () => {
      const todo: TodoItem = {
        id: 'test',
        text: 'Buy milk',
        completed: false,
        projects: [],
        contexts: [],
        keyValuePairs: {},
        rawText: 'Buy milk',
        reminder: {
          dateTime: new Date('2023-12-15T10:00:00.000Z'),
          enabled: true
        }
      };

      const result = TodoParser.serializeTodo(todo);
      expect(result).toBe('Buy milk reminder:2023-12-15T10:00');
    });
  });

  describe('parseFile', () => {
    it('should parse multiple lines', () => {
      const content = `Buy milk
(A) Call mom
x 2023-12-01 Done task
      
(B) 2023-12-01 Important task +work @office`;

      const result = TodoParser.parseFile(content);
      
      expect(result).toHaveLength(4);
      expect(result[0].text).toBe('Buy milk');
      expect(result[1].priority).toBe('A');
      expect(result[2].completed).toBe(true);
      expect(result[3].priority).toBe('B');
    });

    it('should skip empty lines', () => {
      const content = `Buy milk

(A) Call mom`;

      const result = TodoParser.parseFile(content);
      expect(result).toHaveLength(2);
    });
  });

  describe('serializeFile', () => {
    it('should serialize multiple todos', () => {
      const todos: TodoItem[] = [
        {
          id: '1',
          text: 'Buy milk',
          completed: false,
          projects: [],
          contexts: [],
          keyValuePairs: {},
          rawText: 'Buy milk'
        },
        {
          id: '2',
          text: 'Call mom',
          completed: false,
          priority: 'A',
          projects: [],
          contexts: [],
          keyValuePairs: {},
          rawText: '(A) Call mom'
        }
      ];

      const result = TodoParser.serializeFile(todos);
      expect(result).toBe('Buy milk\n(A) Call mom');
    });
  });
});