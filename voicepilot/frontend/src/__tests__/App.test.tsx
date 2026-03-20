/**
 * VoicePilot Frontend Tests
 * 
 * Run with: npm test
 * 
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import '@testing-library/jest-dom';

// Mock electronAPI
declare global {
  interface Window {
    electronAPI: {
      getScreenSources: () => Promise<Array<{ id: string; name: string; thumbnail: string }>>;
      captureScreen: (sourceId: string) => Promise<{ success: boolean; image?: string; error?: string }>;
      analyzeCommand: (data: any) => Promise<any>;
      applyChange: (data: any) => Promise<any>;
      getDemoFiles: () => Promise<{ success: boolean; files?: any[]; error?: string }>;
      getFileContent: (filePath: string) => Promise<{ success: boolean; content?: string; error?: string }>;
      checkBackendHealth: () => Promise<{ isHealthy: boolean; url: string }>;
    };
  }
}

// Mock window.electronAPI
Object.defineProperty(window, 'electronAPI', {
  value: {
    getScreenSources: vi.fn(),
    captureScreen: vi.fn(),
    analyzeCommand: vi.fn(),
    applyChange: vi.fn(),
    getDemoFiles: vi.fn(),
    getFileContent: vi.fn(),
    checkBackendHealth: vi.fn(),
  },
  writable: true,
});

// Import App after mocking
import App from '../renderer/App';

describe('VoicePilot App', () => {
  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    
    // Default mock implementations
    window.electronAPI.getScreenSources.mockResolvedValue([]);
    window.electronAPI.checkBackendHealth.mockResolvedValue({ isHealthy: true, url: 'http://localhost:8080' });
    window.electronAPI.getDemoFiles.mockResolvedValue({
      success: true,
      files: [
        { name: 'Button.tsx', path: '/demo/Button.tsx', content: 'export const Button = () => {}' },
        { name: 'Card.tsx', path: '/demo/Card.tsx', content: 'export const Card = () => {}' },
      ],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders the VoicePilot header', async () => {
    await act(async () => {
      render(<App />);
    });
    
    expect(screen.getByText('VoicePilot')).toBeInTheDocument();
    expect(screen.getByText('AI-Powered Code Editing')).toBeInTheDocument();
  });

  it('renders capture and voice command buttons', async () => {
    await act(async () => {
      render(<App />);
    });
    
    expect(screen.getByText('Capture Screen')).toBeInTheDocument();
    expect(screen.getByText('Voice Command')).toBeInTheDocument();
  });

  it('shows demo commands section', async () => {
    await act(async () => {
      render(<App />);
    });
    
    expect(screen.getByText('Try these demo commands:')).toBeInTheDocument();
    expect(screen.getByText('Make this button blue')).toBeInTheDocument();
    expect(screen.getByText('Add more padding here')).toBeInTheDocument();
    expect(screen.getByText('Make this font bigger')).toBeInTheDocument();
    expect(screen.getByText('Make these cards a grid')).toBeInTheDocument();
  });

  it('clicking demo command triggers analysis', async () => {
    window.electronAPI.analyzeCommand.mockResolvedValue({
      success: true,
      targetFile: 'Button.tsx',
      description: 'Change button background color to blue',
      codeChange: {
        before: 'backgroundColor: "#8b5cf6",',
        after: 'backgroundColor: "#3b82f6",',
      },
      fullBefore: '// Button.tsx\nbackgroundColor: "#8b5cf6",',
      fullAfter: '// Button.tsx\nbackgroundColor: "#3b82f6",',
    });

    await act(async () => {
      render(<App />);
    });

    const demoButton = screen.getByText('Make this button blue');
    
    await act(async () => {
      fireEvent.click(demoButton);
    });

    // Wait for async operation
    await waitFor(() => {
      expect(window.electronAPI.analyzeCommand).toHaveBeenCalled();
    });
  });

  it('displays keyboard shortcuts', async () => {
    await act(async () => {
      render(<App />);
    });
    
    const shortcutsButton = screen.getByText('Shortcuts');
    
    await act(async () => {
      fireEvent.click(shortcutsButton);
    });

    // Check that keyboard shortcuts modal opens
    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    expect(screen.getByText('Capture screen')).toBeInTheDocument();
    expect(screen.getByText('Start voice recording')).toBeInTheDocument();
    expect(screen.getByText('Apply changes')).toBeInTheDocument();
  });

  it('handles offline state gracefully', async () => {
    window.electronAPI.checkBackendHealth.mockResolvedValue({
      isHealthy: false,
      url: 'http://localhost:8080',
    });

    await act(async () => {
      render(<App />);
    });

    // Should still render without crashing
    expect(screen.getByText('VoicePilot')).toBeInTheDocument();
  });

  it('displays status indicator', async () => {
    await act(async () => {
      render(<App />);
    });
    
    // Status indicator should be present
    // Check for any status text (Ready, Idle, Capturing, etc.)
    const statusElements = screen.getAllByText(/Ready|Idle|Capturing|Recording|Processing|Applied/i);
    expect(statusElements.length).toBeGreaterThan(0);
  });

  it('shows connection status', async () => {
    await act(async () => {
      render(<App />);
    });
    
    // Connection status should be checked
    await waitFor(() => {
      expect(window.electronAPI.checkBackendHealth).toHaveBeenCalled();
    });
  });
});

describe('Demo Project Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches demo files on mount', async () => {
    window.electronAPI.getDemoFiles.mockResolvedValue({
      success: true,
      files: [
        { name: 'Button.tsx', path: '/demo/Button.tsx', content: 'export const Button = () => {}' },
      ],
    });

    await act(async () => {
      render(<App />);
    });

    await waitFor(() => {
      expect(window.electronAPI.getDemoFiles).toHaveBeenCalled();
    });
  });
});

describe('Keyboard Shortcuts', () => {
  it('opens keyboard shortcuts modal with Shift+?', async () => {
    await act(async () => {
      render(<App />);
    });

    // Press Shift+?
    await act(async () => {
      fireEvent.keyDown(window, { key: '?', shiftKey: true });
    });

    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
  });

  it('closes keyboard shortcuts modal with Escape', async () => {
    await act(async () => {
      render(<App />);
    });

    // Open modal
    const shortcutsButton = screen.getByText('Shortcuts');
    await act(async () => {
      fireEvent.click(shortcutsButton);
    });

    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();

    // Close with Escape
    await act(async () => {
      fireEvent.keyDown(window, { key: 'Escape' });
    });

    // Modal should be closed
    await waitFor(() => {
      expect(screen.queryByText('Keyboard Shortcuts')).not.toBeInTheDocument();
    });
  });
});

describe('Error Handling', () => {
  it('handles analysis errors gracefully', async () => {
    window.electronAPI.analyzeCommand.mockRejectedValue(new Error('Network error'));

    await act(async () => {
      render(<App />);
    });

    const demoButton = screen.getByText('Make this button blue');
    
    await act(async () => {
      fireEvent.click(demoButton);
    });

    // App should not crash
    expect(screen.getByText('VoicePilot')).toBeInTheDocument();
  });

  it('handles backend health check failure', async () => {
    window.electronAPI.checkBackendHealth.mockRejectedValue(new Error('Connection failed'));

    await act(async () => {
      render(<App />);
    });

    // App should still render
    expect(screen.getByText('VoicePilot')).toBeInTheDocument();
  });
});
