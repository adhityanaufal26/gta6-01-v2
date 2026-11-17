// Palmera Bay — keyboard and mouse input.
// One job: track held keys, edge-triggered presses, and the mouse position
// in canvas coordinates. The game reads this, never the DOM directly.

export function createInput(canvas) {
  const keys = new Set();
  const pressed = new Set();
  let mouseX = 0;
  let mouseY = 0;
  let mouseClicked = false;
  let mouseDown = false;

  function keyName(e) {
    return e.key.length === 1 ? e.key.toLowerCase() : e.key;
  }

  window.addEventListener('keydown', (e) => {
    const k = keyName(e);
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key)) e.preventDefault();
    if (!keys.has(k)) pressed.add(k);
    keys.add(k);
  });
  window.addEventListener('keyup', (e) => keys.delete(keyName(e)));
  window.addEventListener('blur', () => keys.clear());

  canvas.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    mouseX = ((e.clientX - r.left) / r.width) * canvas.width;
    mouseY = ((e.clientY - r.top) / r.height) * canvas.height;
  });
  canvas.addEventListener('mousedown', (e) => {
    const r = canvas.getBoundingClientRect();
    mouseX = ((e.clientX - r.left) / r.width) * canvas.width;
    mouseY = ((e.clientY - r.top) / r.height) * canvas.height;
    mouseDown = true;
    mouseClicked = true;
    e.preventDefault();
  });
  window.addEventListener('mouseup', () => { mouseDown = false; });

  return {
    down(k) { return keys.has(k); },
    // True once per physical press; consumed at end of frame by the game.
    wasPressed(k) { return pressed.has(k); },
    axis() {
      let x = 0; let y = 0;
      if (keys.has('a') || keys.has('ArrowLeft')) x -= 1;
      if (keys.has('d') || keys.has('ArrowRight')) x += 1;
      if (keys.has('w') || keys.has('ArrowUp')) y -= 1;
      if (keys.has('s') || keys.has('ArrowDown')) y += 1;
      return { x, y };
    },
    mouse() { return { x: mouseX, y: mouseY, clicked: mouseClicked, down: mouseDown }; },
    endFrame() { pressed.clear(); mouseClicked = false; },
  };
}
