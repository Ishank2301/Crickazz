import { useEffect, useCallback } from 'react';
import { sounds } from '../utils/audio';

export type TabId = 'home' | 'live' | '3d' | 'players' | 'analytics' | 'crud' | 'diagnostics';

export interface ShortcutDefinition {
  key: string;
  displayKey: string;
  label: string;
  tabId?: TabId;
  action?: 'toggle_help' | 'close_modal';
  description: string;
  category: 'Navigation' | 'General';
}

export const SHORTCUT_REGISTRY: ShortcutDefinition[] = [
  {
    key: 'h',
    displayKey: 'H',
    label: 'Overview',
    tabId: 'home',
    description: 'Switch to match overview, quick summary cards & points table',
    category: 'Navigation',
  },
  {
    key: 'l',
    displayKey: 'L',
    label: 'Live Matches',
    tabId: 'live',
    description: 'Switch to live match center, scorecards & commentary simulator',
    category: 'Navigation',
  },
  {
    key: 'a',
    displayKey: 'A',
    label: 'SQL Analytics',
    tabId: 'analytics',
    description: 'Switch to in-browser SQLite console with 25 analytical questions',
    category: 'Navigation',
  },
  {
    key: 'p',
    displayKey: 'P',
    label: 'Player Stats',
    tabId: 'players',
    description: 'Switch to batting & bowling leaderboards and strike rates',
    category: 'Navigation',
  },
  {
    key: '3',
    displayKey: '3',
    label: '3D Hawkeye',
    tabId: '3d',
    description: 'Switch to 3D stadium pitch, trajectory simulation & wagon wheel',
    category: 'Navigation',
  },
  {
    key: 'c',
    displayKey: 'C',
    label: 'Data Admin',
    tabId: 'crud',
    description: 'Switch to CRUD tournament manager and match editor',
    category: 'Navigation',
  },
  {
    key: 'd',
    displayKey: 'D',
    label: 'Diagnostics',
    tabId: 'diagnostics',
    description: 'Switch to system telemetry, SQLite latency benchmarks & logs',
    category: 'Navigation',
  },
  {
    key: '?',
    displayKey: '?',
    label: 'Keyboard Shortcuts',
    action: 'toggle_help',
    description: 'Open or close this keyboard shortcuts cheat sheet',
    category: 'General',
  },
  {
    key: 'Escape',
    displayKey: 'Esc',
    label: 'Dismiss Modal',
    action: 'close_modal',
    description: 'Close open dialogs or shortcut cheat sheet',
    category: 'General',
  },
];

export interface ResolveShortcutOptions {
  isInputActive?: boolean;
  hasModifierKey?: boolean;
}

export type ShortcutResolution =
  | { type: 'tab'; tabId: TabId; label: string }
  | { type: 'action'; action: 'toggle_help' | 'close_modal'; label: string }
  | null;

/**
 * Checks if the event target is an interactive text input where global shortcuts should be disabled.
 */
export function isInputElement(element: EventTarget | null): boolean {
  if (!element || typeof HTMLElement === 'undefined' || !(element instanceof HTMLElement)) {
    return false;
  }
  const tag = element.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
    return true;
  }
  if (element.isContentEditable) {
    return true;
  }
  return false;
}

/**
 * Pure function to map a keyboard event key to an applet tab or action.
 * Decoupled from React lifecycle for fast unit-testing.
 */
export function resolveTabShortcut(
  key: string,
  options: ResolveShortcutOptions = {}
): ShortcutResolution {
  if (options.isInputActive) {
    return null;
  }
  if (options.hasModifierKey) {
    return null;
  }

  if (key === '?' || key === '/') {
    return { type: 'action', action: 'toggle_help', label: 'Shortcuts' };
  }
  if (key === 'Escape') {
    return { type: 'action', action: 'close_modal', label: 'Dismiss' };
  }

  const normalized = key.toLowerCase();
  switch (normalized) {
    case 'h':
      return { type: 'tab', tabId: 'home', label: 'Overview' };
    case 'l':
      return { type: 'tab', tabId: 'live', label: 'Live Matches' };
    case 'a':
    case 's': // alias 's' for SQL
      return { type: 'tab', tabId: 'analytics', label: 'SQL Analytics' };
    case 'p':
      return { type: 'tab', tabId: 'players', label: 'Player Stats' };
    case '3':
    case 'w': // alias 'w' for 3D/Wagon wheel
      return { type: 'tab', tabId: '3d', label: '3D Hawkeye' };
    case 'c':
    case 'm': // alias 'm' for Management
      return { type: 'tab', tabId: 'crud', label: 'Data Admin' };
    case 'd':
      return { type: 'tab', tabId: 'diagnostics', label: 'Diagnostics' };
    default:
      return null;
  }
}

export interface UseKeyboardShortcutsProps {
  activeTab: string;
  onNavigate: (tab: TabId) => void;
  onToggleHelp?: () => void;
  onCloseHelp?: () => void;
  isHelpOpen?: boolean;
  disabled?: boolean;
  onShortcutTriggered?: (info: { key: string; label: string; tabId?: TabId }) => void;
}

/**
 * Global Keyboard Shortcut Hook for rapid tab navigation & modal toggling.
 */
export function useKeyboardShortcuts({
  activeTab,
  onNavigate,
  onToggleHelp,
  onCloseHelp,
  isHelpOpen = false,
  disabled = false,
  onShortcutTriggered,
}: UseKeyboardShortcutsProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (disabled) return;

      const isInput = isInputElement(e.target);

      // Special case: Escape always dismisses modal even if inside an input
      if (e.key === 'Escape' && isHelpOpen) {
        e.preventDefault();
        onCloseHelp?.();
        return;
      }

      // Check if Ctrl / Meta / Alt is pressed (Shift is permitted for '?')
      const hasModifierKey = e.ctrlKey || e.metaKey || e.altKey;

      const result = resolveTabShortcut(e.key, {
        isInputActive: isInput,
        hasModifierKey,
      });

      if (!result) return;

      if (result.type === 'tab') {
        e.preventDefault();
        if (activeTab !== result.tabId) {
          onNavigate(result.tabId);
          try {
            sounds.playClick();
          } catch {
            // Audio error non-blocking
          }
          onShortcutTriggered?.({
            key: e.key.toUpperCase(),
            label: result.label,
            tabId: result.tabId,
          });
        }
      } else if (result.type === 'action') {
        if (result.action === 'toggle_help') {
          e.preventDefault();
          onToggleHelp?.();
        } else if (result.action === 'close_modal') {
          if (isHelpOpen) {
            e.preventDefault();
            onCloseHelp?.();
          }
        }
      }
    },
    [
      disabled,
      isHelpOpen,
      activeTab,
      onNavigate,
      onToggleHelp,
      onCloseHelp,
      onShortcutTriggered,
    ]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleKeyDown]);
}
