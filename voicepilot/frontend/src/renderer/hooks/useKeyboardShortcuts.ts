import { useEffect, useCallback } from 'react';

export interface KeyboardShortcut {
  key: string;
  modifiers?: {
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean;
  };
  handler: () => void;
  description?: string;
}

export interface UseKeyboardShortcutsOptions {
  shortcuts: KeyboardShortcut[];
  enabled?: boolean;
}

/**
 * Custom hook for handling keyboard shortcuts
 * Provides power-user features for faster navigation
 */
export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions): void {
  const { shortcuts, enabled = true } = options;

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      for (const shortcut of shortcuts) {
        const { key, modifiers = {}, handler } = shortcut;
        
        // Check if key matches (case insensitive)
        const keyMatches = event.key.toLowerCase() === key.toLowerCase();
        
        // Check modifiers
        const ctrlMatches = modifiers.ctrl === undefined || event.ctrlKey === modifiers.ctrl;
        const shiftMatches = modifiers.shift === undefined || event.shiftKey === modifiers.shift;
        const altMatches = modifiers.alt === undefined || event.altKey === modifiers.alt;
        const metaMatches = modifiers.meta === undefined || event.metaKey === modifiers.meta;
        
        if (keyMatches && ctrlMatches && shiftMatches && altMatches && metaMatches) {
          event.preventDefault();
          event.stopPropagation();
          handler();
          break;
        }
      }
    },
    [shortcuts, enabled]
  );

  useEffect(() => {
    if (!enabled) return;

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown, enabled]);
}

/**
 * Predefined shortcuts for VoicePilot
 */
export const VOICEPILOT_SHORTCUTS = {
  // Capture
  CAPTURE_SCREEN: { key: 'c', modifiers: { ctrl: true }, description: 'Capture screen' },
  START_RECORDING: { key: 'r', modifiers: { ctrl: true }, description: 'Start voice recording' },
  
  // Actions
  APPLY_CHANGES: { key: 'Enter', modifiers: { ctrl: true }, description: 'Apply changes' },
  CANCEL: { key: 'Escape', description: 'Cancel current operation' },
  
  // Navigation
  FOCUS_COMMAND: { key: 'k', modifiers: { ctrl: true }, description: 'Focus command input' },
  TOGGLE_PREVIEW: { key: 'p', modifiers: { ctrl: true, shift: true }, description: 'Toggle preview window' },
  
  // Demo
  DEMO_COMMAND_1: { key: '1', modifiers: { alt: true }, description: 'Demo: Make button blue' },
  DEMO_COMMAND_2: { key: '2', modifiers: { alt: true }, description: 'Demo: Add padding' },
  DEMO_COMMAND_3: { key: '3', modifiers: { alt: true }, description: 'Demo: Make font bigger' },
  DEMO_COMMAND_4: { key: '4', modifiers: { alt: true }, description: 'Demo: Grid layout' },
};

export default useKeyboardShortcuts;