import React from 'react';
import { X, Keyboard, ArrowRight, Sparkles, Navigation } from 'lucide-react';
import { SHORTCUT_REGISTRY, TabId } from '../hooks/useKeyboardShortcuts';
import { sounds } from '../utils/audio';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: string;
  onSelectTab: (tab: TabId) => void;
}

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
}) => {
  if (!isOpen) return null;

  const navShortcuts = SHORTCUT_REGISTRY.filter((s) => s.category === 'Navigation');
  const generalShortcuts = SHORTCUT_REGISTRY.filter((s) => s.category === 'General');

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl bg-[#0f172a] border border-slate-800 rounded-xl shadow-2xl shadow-emerald-950/20 overflow-hidden text-slate-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#131d31]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h2 id="shortcuts-modal-title" className="text-base font-bold text-slate-100 tracking-tight flex items-center gap-2">
                Keyboard Shortcuts
                <span className="text-[11px] font-normal uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-900/50 text-emerald-300 border border-emerald-700/50">
                  Global Hotkeys
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Press any key directly anywhere across the app to navigate instantly
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close shortcuts dialog"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Navigation Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-800/60">
              <span className="flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-emerald-400" />
                Tab Navigation
              </span>
              <span className="text-[11px] font-normal text-slate-500">Single Keystroke</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {navShortcuts.map((shortcut) => {
                const isActive = activeTab === shortcut.tabId;
                return (
                  <button
                    key={shortcut.key}
                    onClick={() => {
                      if (shortcut.tabId) {
                        onSelectTab(shortcut.tabId);
                        sounds.playClick();
                        onClose();
                      }
                    }}
                    className={`flex items-center justify-between p-2.5 rounded-lg border text-left transition-all group ${
                      isActive
                        ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-200 ring-1 ring-emerald-500/30'
                        : 'bg-slate-900/70 border-slate-800/80 hover:bg-slate-800/70 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <kbd className="px-2 py-1 text-xs font-mono font-bold rounded bg-slate-800 border border-slate-700 text-emerald-400 shadow-sm group-hover:border-emerald-500/50 group-hover:bg-slate-750 transition-colors shrink-0">
                        {shortcut.displayKey}
                      </kbd>
                      <div className="truncate">
                        <div className="text-xs font-semibold text-slate-200 group-hover:text-white flex items-center gap-1.5">
                          {shortcut.label}
                          {isActive && (
                            <span className="text-[10px] text-emerald-400 font-normal">
                              (Active)
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">
                          {shortcut.description}
                        </div>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all shrink-0 ml-1.5" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* General & Modals */}
          <div className="space-y-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 pb-1 border-b border-slate-800/60 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
              General Controls
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {generalShortcuts.map((shortcut) => (
                <div
                  key={shortcut.key}
                  className="flex items-center justify-between p-2.5 rounded-lg border bg-slate-900/50 border-slate-800/80 text-slate-300"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <kbd className="px-2 py-1 text-xs font-mono font-bold rounded bg-slate-800 border border-slate-700 text-slate-300 shadow-sm shrink-0">
                      {shortcut.displayKey}
                    </kbd>
                    <div className="truncate">
                      <div className="text-xs font-semibold text-slate-200">
                        {shortcut.label}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {shortcut.description}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pro-Tip Box */}
          <div className="p-3.5 rounded-lg bg-emerald-950/20 border border-emerald-800/30 text-xs text-emerald-300 flex items-start gap-2.5 leading-relaxed">
            <span className="p-1 rounded bg-emerald-500/20 text-emerald-400 shrink-0 font-mono text-[11px] font-bold">
              TIP
            </span>
            <span>
              Shortcuts automatically disable when you are typing inside query search bars, SQL code inputs, or form fields so you can type freely without triggering navigation.
            </span>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-[#131d31]/80 flex items-center justify-between text-xs text-slate-400">
          <span>
            Press <kbd className="px-1.5 py-0.5 text-[11px] font-mono bg-slate-800 rounded border border-slate-700 text-slate-200">Esc</kbd> to dismiss
          </span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors font-medium text-xs"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
