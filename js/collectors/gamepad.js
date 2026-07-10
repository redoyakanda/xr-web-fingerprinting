import { createCollectorResult } from '../utils/utils.js';

/** Collects one passive snapshot of static/coarse Gamepad metadata only; no polling, listeners, axes values, button states, pose, or motion. */
export function collectGamepadFingerprint() {
  const warnings = ['Many browsers expose gamepads only after prior user interaction or connection events.'];
  const errors = [];
  const nav = globalThis.navigator ?? {};
  const gamepadAPIAvailable = typeof nav.getGamepads === 'function';
  const values = {
    gamepadAPIAvailable,
    constructors: {
      Gamepad: typeof (globalThis.window ?? globalThis).Gamepad === 'function',
      GamepadButton: typeof (globalThis.window ?? globalThis).GamepadButton === 'function',
    },
    eventSupport: {
      gamepadconnected: 'ongamepadconnected' in (globalThis.window ?? {}),
      gamepaddisconnected: 'ongamepaddisconnected' in (globalThis.window ?? {}),
    },
    exposedGamepadCount: 0,
    nullSlotCount: 0,
    priorUserInteractionLikelyRequired: null,
    gamepads: [],
  };

  if (!gamepadAPIAvailable) {
    warnings.push('navigator.getGamepads is unavailable.');
    values.priorUserInteractionLikelyRequired = false;
    return createCollectorResult('gamepad', false, values, warnings, errors);
  }

  try {
    const pads = Array.from(nav.getGamepads() ?? []); // exactly one call per collection
    values.nullSlotCount = pads.filter((pad) => pad == null).length;
    values.gamepads = pads.filter(Boolean).map(summarizeGamepad);
    values.exposedGamepadCount = values.gamepads.length;
    values.priorUserInteractionLikelyRequired = values.exposedGamepadCount === 0 && values.nullSlotCount >= 0;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    errors.push(message);
    warnings.push('navigator.getGamepads() threw; returning static API availability only.');
  }

  return createCollectorResult('gamepad', gamepadAPIAvailable, values, warnings, errors);
}

function summarizeGamepad(gamepad) {
  const actuator = gamepad.vibrationActuator ?? gamepad.hapticActuators?.[0] ?? null;
  return {
    index: safeValue(gamepad.index),
    id: safeValue(gamepad.id),
    mapping: safeValue(gamepad.mapping),
    connected: Boolean(gamepad.connected),
    buttonCount: Array.isArray(gamepad.buttons) ? gamepad.buttons.length : (gamepad.buttons?.length ?? 0),
    axisCount: Array.isArray(gamepad.axes) ? gamepad.axes.length : (gamepad.axes?.length ?? 0),
    vibrationActuatorAvailable: Boolean(actuator),
    hapticActuatorType: actuator?.type ?? null,
    hand: 'hand' in Object(gamepad) ? safeValue(gamepad.hand) : null,
    displayId: 'displayId' in Object(gamepad) ? safeValue(gamepad.displayId) : null,
    timestampExposed: typeof gamepad.timestamp === 'number',
  };
}

function safeValue(value) {
  return value === undefined ? null : value;
}
