import '../setupTests';

describe('setupTests', () => {
  it('should set up electron API mock', () => {
    expect(window.electronAPI).toBeDefined();
    expect(window.electronAPI.loadTodoFile).toBeDefined();
    expect(window.electronAPI.saveTodoFile).toBeDefined();
    expect(window.electronAPI.showNotification).toBeDefined();
    expect(window.electronAPI.openFileDialog).toBeDefined();
  });

  it('should mock crypto.randomUUID', () => {
    expect(global.crypto.randomUUID).toBeDefined();
    const id1 = global.crypto.randomUUID();
    const id2 = global.crypto.randomUUID();
    
    expect(typeof id1).toBe('string');
    expect(typeof id2).toBe('string');
    expect(id1).toMatch(/^test-uuid-/);
    expect(id2).toMatch(/^test-uuid-/);
  });

  it('should mock Notification API', () => {
    expect(window.Notification).toBeDefined();
    expect(window.Notification.permission).toBe('granted');
    expect(window.Notification.requestPermission).toBeDefined();
  });

  it('should allow creating mock notifications', () => {
    const notification = new window.Notification('Test Title', {
      body: 'Test Body',
    });
    
    expect(notification).toBeDefined();
  });

  it('should have electron API methods return promises', async () => {
    const loadResult = await window.electronAPI.loadTodoFile();
    expect(typeof loadResult).toBe('string');

    await expect(window.electronAPI.saveTodoFile('test')).resolves.not.toThrow();
    await expect(window.electronAPI.showNotification('test', 'test')).resolves.not.toThrow();
    await expect(window.electronAPI.openFileDialog()).resolves.not.toThrow();
  });

  it('should setup testing library jest-dom matchers', () => {
    // This test verifies that jest-dom matchers are available
    const div = document.createElement('div');
    div.textContent = 'Test';
    
    expect(div).toHaveTextContent('Test');
    expect(div).toBeInTheDocument();
  });
});
