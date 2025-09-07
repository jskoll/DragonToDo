import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from '../../store/store';

// Mock React DOM
jest.mock('react-dom/client', () => ({
  createRoot: jest.fn(() => ({
    render: jest.fn(),
    unmount: jest.fn(),
  })),
}));

// Mock the App component
jest.mock('../App_Complete', () => {
  return function MockApp() {
    return <div data-testid="app">Mock App</div>;
  };
});

// Mock Redux store
jest.mock('../../store/store', () => ({
  store: {
    getState: jest.fn(() => ({})),
    dispatch: jest.fn(),
    subscribe: jest.fn(),
  },
}));

describe('renderer/index.tsx', () => {
  let mockContainer: HTMLElement;
  let mockCreateRoot: jest.Mock;
  let mockRender: jest.Mock;

  beforeEach(() => {
    // Setup DOM
    mockContainer = document.createElement('div');
    mockContainer.id = 'root';
    document.body.appendChild(mockContainer);

    // Setup mocks
    mockRender = jest.fn();
    mockCreateRoot = jest.fn(() => ({
      render: mockRender,
      unmount: jest.fn(),
    }));
    
    (createRoot as jest.Mock) = mockCreateRoot;

    // Clear module cache to re-import index.tsx
    jest.resetModules();
  });

  afterEach(() => {
    document.body.removeChild(mockContainer);
    jest.clearAllMocks();
  });

  it('should find the root element and create React root', () => {
    // Import index.tsx which executes the module
    require('../index.tsx');

    expect(mockCreateRoot).toHaveBeenCalledWith(mockContainer);
  });

  it('should render App with Redux Provider', () => {
    // Import index.tsx which executes the module
    require('../index.tsx');

    expect(mockCreateRoot).toHaveBeenCalled();
    expect(mockRender).toHaveBeenCalledWith(
      expect.objectContaining({
        type: Provider,
        props: expect.objectContaining({
          store: store,
        }),
      })
    );
  });

  it('should throw error if root element not found', () => {
    // Remove root element
    document.body.removeChild(mockContainer);

    // Mock console.error to avoid test output noise
    const originalError = console.error;
    console.error = jest.fn();

    expect(() => {
      require('../index.tsx');
    }).toThrow('Root element not found');

    console.error = originalError;
  });

  it('should use the correct store from store module', () => {
    require('../index.tsx');

    expect(mockRender).toHaveBeenCalledWith(
      expect.objectContaining({
        props: expect.objectContaining({
          store: store,
        }),
      })
    );
  });

  it('should render the App_Complete component', () => {
    require('../index.tsx');

    const renderCall = mockRender.mock.calls[0][0];
    expect(renderCall.props.children.type.name).toBe('MockApp');
  });
});
