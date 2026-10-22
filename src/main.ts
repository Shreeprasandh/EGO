import { Engine } from './core/Engine';

window.addEventListener('DOMContentLoaded', () => {
  try {
    const engine = new Engine();
    (window as any).__egoEngine = engine;
    engine.start();
    console.log('🚀 EGO Engine initialized successfully. Ready for flight.');
  } catch (err) {
    console.error('Failed to initialize EGO Engine:', err);
  }
});
