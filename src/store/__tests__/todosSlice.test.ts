import todosSlice, {
  setTodos,
  addTodo,
  updateTodo,
  deleteTodo,
} from '../todosSlice';
import { TodoItem } from '../../types/todo';

interface TodosState {
  todos: TodoItem[];
}

const mockTodo: TodoItem = {
  id: '1',
  text: 'Test todo',
  completed: false,
  creationDate: new Date('2024-01-01'),
  rawText: 'Test todo',
  projects: ['project1'],
  contexts: ['context1'],
  keyValuePairs: { key1: 'value1' },
  priority: 'A',
};

const mockTodo2: TodoItem = {
  id: '2',
  text: 'Second todo',
  completed: true,
  creationDate: new Date('2024-01-02'),
  rawText: 'Second todo',
  projects: [],
  contexts: [],
  keyValuePairs: {},
};

describe('todosSlice', () => {
  let initialState: TodosState;

  beforeEach(() => {
    initialState = {
      todos: [],
    };
  });

  it('should return the initial state', () => {
    expect(todosSlice(undefined, { type: 'unknown' })).toEqual({
      todos: [],
    });
  });

  it('should handle setTodos', () => {
    const todos = [mockTodo, mockTodo2];
    const actual = todosSlice(initialState, setTodos(todos));
    expect(actual.todos).toEqual(todos);
  });

  it('should handle addTodo', () => {
    const actual = todosSlice(initialState, addTodo(mockTodo));
    expect(actual.todos).toHaveLength(1);
    expect(actual.todos[0]).toEqual(mockTodo);
  });

  it('should handle addTodo to existing todos', () => {
    const stateWithTodos = {
      todos: [mockTodo],
    };
    const actual = todosSlice(stateWithTodos, addTodo(mockTodo2));
    expect(actual.todos).toHaveLength(2);
    expect(actual.todos[1]).toEqual(mockTodo2);
  });

  it('should handle updateTodo', () => {
    const stateWithTodos = {
      todos: [mockTodo, mockTodo2],
    };
    const actual = todosSlice(stateWithTodos, updateTodo({ 
      id: '1', 
      updates: { text: 'Updated todo text' } 
    }));
    
    expect(actual.todos).toHaveLength(2);
    expect(actual.todos[0].text).toBe('Updated todo text');
    expect(actual.todos[1]).toEqual(mockTodo2); // Unchanged
  });

  it('should handle updateTodo when todo does not exist', () => {
    const stateWithTodos = {
      todos: [mockTodo],
    };
    const actual = todosSlice(stateWithTodos, updateTodo({ 
      id: 'non-existent', 
      updates: { text: 'Should not update' } 
    }));
    
    // Should remain unchanged
    expect(actual.todos).toEqual([mockTodo]);
  });

  it('should handle deleteTodo', () => {
    const stateWithTodos = {
      todos: [mockTodo, mockTodo2],
    };
    const actual = todosSlice(stateWithTodos, deleteTodo('1'));
    
    expect(actual.todos).toHaveLength(1);
    expect(actual.todos[0]).toEqual(mockTodo2);
  });

  it('should handle deleteTodo when todo does not exist', () => {
    const stateWithTodos = {
      todos: [mockTodo],
    };
    const actual = todosSlice(stateWithTodos, deleteTodo('non-existent'));
    
    // Should remain unchanged
    expect(actual.todos).toEqual([mockTodo]);
  });

  it('should handle updateTodo with multiple properties', () => {
    const stateWithTodos = {
      todos: [mockTodo],
    };
    const updates = {
      text: 'New text',
      priority: 'B' as const,
      projects: ['newproject'],
      contexts: ['newcontext'],
      keyValuePairs: { newkey: 'newvalue' },
    };
    
    const actual = todosSlice(stateWithTodos, updateTodo({ 
      id: '1', 
      updates 
    }));
    
    expect(actual.todos[0].text).toBe('New text');
    expect(actual.todos[0].priority).toBe('B');
    expect(actual.todos[0].projects).toEqual(['newproject']);
    expect(actual.todos[0].contexts).toEqual(['newcontext']);
    expect(actual.todos[0].keyValuePairs).toEqual({ newkey: 'newvalue' });
    // Original properties should be preserved
    expect(actual.todos[0].creationDate).toEqual(mockTodo.creationDate);
    expect(actual.todos[0].id).toBe(mockTodo.id);
  });

  it('should handle updateTodo with completed status change', () => {
    const stateWithTodos = {
      todos: [mockTodo, mockTodo2],
    };
    
    // Toggle first todo to completed
    const actual1 = todosSlice(stateWithTodos, updateTodo({ 
      id: '1', 
      updates: { completed: true } 
    }));
    
    expect(actual1.todos[0].completed).toBe(true);
    expect(actual1.todos[1].completed).toBe(true); // Unchanged
    
    // Toggle second todo to incomplete
    const actual2 = todosSlice(actual1, updateTodo({ 
      id: '2', 
      updates: { completed: false } 
    }));
    
    expect(actual2.todos[0].completed).toBe(true); // Unchanged
    expect(actual2.todos[1].completed).toBe(false);
  });
});
