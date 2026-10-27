import test from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveTabShortcut,
  SHORTCUT_REGISTRY,
  TabId,
} from '../src/hooks/useKeyboardShortcuts';

export async function runKeyboardShortcutTests() {
  const results = [];
  const start = performance.now();

  try {
    // Test 1: Home key resolution
    const hResult = resolveTabShortcut('h');
    const HResult = resolveTabShortcut('H');
    assert.equal(hResult?.type, 'tab');
    if (hResult?.type === 'tab') {
      assert.equal(hResult.tabId, 'home');
    }
    assert.equal(HResult?.type, 'tab');
    if (HResult?.type === 'tab') {
      assert.equal(HResult.tabId, 'home');
    }
    results.push({
      name: "Tab Shortcut Resolution: 'H' / 'h' -> Overview / Home",
      passed: true,
      durationMs: +(performance.now() - start).toFixed(2),
    });
  } catch (err: any) {
    results.push({
      name: "Tab Shortcut Resolution: 'H' / 'h' -> Overview / Home",
      passed: false,
      durationMs: +(performance.now() - start).toFixed(2),
      error: err.message,
    });
  }

  try {
    // Test 2: Live matches resolution
    const lResult = resolveTabShortcut('l');
    const LResult = resolveTabShortcut('L');
    assert.equal(lResult?.type, 'tab');
    if (lResult?.type === 'tab') {
      assert.equal(lResult.tabId, 'live');
    }
    assert.equal(LResult?.type, 'tab');
    if (LResult?.type === 'tab') {
      assert.equal(LResult.tabId, 'live');
    }
    results.push({
      name: "Tab Shortcut Resolution: 'L' / 'l' -> Live Matches",
      passed: true,
      durationMs: +(performance.now() - start).toFixed(2),
    });
  } catch (err: any) {
    results.push({
      name: "Tab Shortcut Resolution: 'L' / 'l' -> Live Matches",
      passed: false,
      durationMs: +(performance.now() - start).toFixed(2),
      error: err.message,
    });
  }

  try {
    // Test 3: Analytics resolution ('A' and 'S')
    const aResult = resolveTabShortcut('a');
    const AResult = resolveTabShortcut('A');
    const sResult = resolveTabShortcut('s');
    assert.equal(aResult?.type, 'tab');
    if (aResult?.type === 'tab') {
      assert.equal(aResult.tabId, 'analytics');
    }
    assert.equal(AResult?.type, 'tab');
    if (AResult?.type === 'tab') {
      assert.equal(AResult.tabId, 'analytics');
    }
    assert.equal(sResult?.type, 'tab');
    if (sResult?.type === 'tab') {
      assert.equal(sResult.tabId, 'analytics');
    }
    results.push({
      name: "Tab Shortcut Resolution: 'A' / 'S' -> SQL Analytics",
      passed: true,
      durationMs: +(performance.now() - start).toFixed(2),
    });
  } catch (err: any) {
    results.push({
      name: "Tab Shortcut Resolution: 'A' / 'S' -> SQL Analytics",
      passed: false,
      durationMs: +(performance.now() - start).toFixed(2),
      error: err.message,
    });
  }

  try {
    // Test 4: Remaining navigation tabs ('P', '3', 'C', 'D')
    const pResult = resolveTabShortcut('p');
    const threeResult = resolveTabShortcut('3');
    const cResult = resolveTabShortcut('c');
    const dResult = resolveTabShortcut('d');

    assert.equal(pResult?.type === 'tab' && pResult.tabId, 'players');
    assert.equal(threeResult?.type === 'tab' && threeResult.tabId, '3d');
    assert.equal(cResult?.type === 'tab' && cResult.tabId, 'crud');
    assert.equal(dResult?.type === 'tab' && dResult.tabId, 'diagnostics');

    results.push({
      name: "Tab Shortcut Resolution: 'P', '3', 'C', 'D' mappings",
      passed: true,
      durationMs: +(performance.now() - start).toFixed(2),
    });
  } catch (err: any) {
    results.push({
      name: "Tab Shortcut Resolution: 'P', '3', 'C', 'D' mappings",
      passed: false,
      durationMs: +(performance.now() - start).toFixed(2),
      error: err.message,
    });
  }

  try {
    // Test 5: Action keys ('?' and 'Escape')
    const helpResult = resolveTabShortcut('?');
    const escResult = resolveTabShortcut('Escape');

    assert.equal(helpResult?.type, 'action');
    if (helpResult?.type === 'action') {
      assert.equal(helpResult.action, 'toggle_help');
    }
    assert.equal(escResult?.type, 'action');
    if (escResult?.type === 'action') {
      assert.equal(escResult.action, 'close_modal');
    }

    results.push({
      name: "Action Shortcuts: '?' for Help & 'Escape' for Modal Close",
      passed: true,
      durationMs: +(performance.now() - start).toFixed(2),
    });
  } catch (err: any) {
    results.push({
      name: "Action Shortcuts: '?' for Help & 'Escape' for Modal Close",
      passed: false,
      durationMs: +(performance.now() - start).toFixed(2),
      error: err.message,
    });
  }

  try {
    // Test 6: Input suppression & Modifier keys suppression
    const inputActive = resolveTabShortcut('h', { isInputActive: true });
    assert.equal(inputActive, null, 'Keystroke inside input must be ignored');

    const ctrlModifier = resolveTabShortcut('l', { hasModifierKey: true });
    assert.equal(ctrlModifier, null, 'Keystroke with Ctrl/Meta/Alt must be ignored');

    const unknownKey = resolveTabShortcut('z');
    assert.equal(unknownKey, null, 'Unregistered key must return null');

    results.push({
      name: 'Input Element & Modifier Key Event Suppression',
      passed: true,
      durationMs: +(performance.now() - start).toFixed(2),
    });
  } catch (err: any) {
    results.push({
      name: 'Input Element & Modifier Key Event Suppression',
      passed: false,
      durationMs: +(performance.now() - start).toFixed(2),
      error: err.message,
    });
  }

  return results;
}

// Standalone node:test runner executions
test("resolveTabShortcut correctly handles 'h' and 'H'", () => {
  const result = resolveTabShortcut('h');
  assert.equal(result?.type, 'tab');
  if (result?.type === 'tab') {
    assert.equal(result.tabId, 'home');
  }
});

test("resolveTabShortcut maps 'l' and 'L' to live match tab", () => {
  const result = resolveTabShortcut('L');
  assert.equal(result?.type, 'tab');
  if (result?.type === 'tab') {
    assert.equal(result.tabId, 'live');
  }
});

test("resolveTabShortcut maps 'a' to analytics tab", () => {
  const result = resolveTabShortcut('a');
  assert.equal(result?.type, 'tab');
  if (result?.type === 'tab') {
    assert.equal(result.tabId, 'analytics');
  }
});

test('resolveTabShortcut suppresses keys when isInputActive is true', () => {
  const result = resolveTabShortcut('a', { isInputActive: true });
  assert.equal(result, null);
});

test('resolveTabShortcut suppresses keys when hasModifierKey is true', () => {
  const result = resolveTabShortcut('h', { hasModifierKey: true });
  assert.equal(result, null);
});

test('resolveTabShortcut handles help and escape keys', () => {
  assert.deepEqual(resolveTabShortcut('?'), {
    type: 'action',
    action: 'toggle_help',
    label: 'Shortcuts',
  });
  assert.deepEqual(resolveTabShortcut('Escape'), {
    type: 'action',
    action: 'close_modal',
    label: 'Dismiss',
  });
});
