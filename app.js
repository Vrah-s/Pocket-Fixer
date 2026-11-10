const SAVE_KEY = 'pocket-workshop-save-v1';
const WORLD_W = 960, WORLD_H = 640;
const FRESH_SAVE = { coins: 0, completedCount: 0, nextJob: 1, sound: true, activeJobNumber: null, activeStage: 'meet' };
const CLEAN_OBJECTS = [
  ['Dusty toy robot', '🤖', 'Brush away the dust so this old friend can shine again.'],
  ['Muddy flowerpot', '🪴', 'Clean this pot up before a new flower moves in.'],
  ['Sleepy plush bear', '🧸', 'Give this well-loved bear a gentle freshen-up.'],
  ['Little toy train', '🚂', 'Polish the train until its bright colors show again.'],
  ['Scuffed red kettle', '🫖', 'Wipe the kettle down after its busy tea-time days.'],
  ['Traveler’s boot', '🥾', 'Brush the trail dust off this well-traveled boot.'],
  ['Old lunchbox', '🍱', 'Give this lunchbox a good clean before tomorrow.'],
  ['Tiny toy boat', '⛵', 'Wash the mud off this little pond explorer.']
];
const WIRE_OBJECTS = [
  ['Grandpa’s radio', '📻', 'Reconnect the colored wires to bring the radio back to life.'],
  ['Bicycle bell', '🚲', 'Fix its tiny circuit so the bell can ring again.'],
  ['Music box', '🎶', 'Match the wires and bring back its little song.'],
  ['Desk lamp', '💡', 'Connect the colored wires to make the lamp glow.'],
  ['Toy rover', '🛸', 'Reconnect the wires so this little rover can roll.'],
  ['Table fan', '🌀', 'Fix the wiring and bring back a gentle breeze.']
];
const GEAR_OBJECTS = [
  ['Sleepy little clock', '⏰', 'Set the loose gear and get this clock ticking again.'],
  ['Wind-up bird', '🐦', 'Line up the gear so the little bird can sing.'],
  ['Pocket watch', '⌚', 'Give this old watch a careful adjustment.'],
  ['Toy windmill', '🌬️', 'Set the gear so the tiny mill can spin again.'],
  ['Music box wheel', '🎼', 'Line up this gear and the music box can play.']
];
const WIRE_COLORS = ['red', 'blue', 'yellow', 'green', 'purple', 'orange'];
const CUSTOMER_NAMES = ['Mira', 'Omar', 'Lina', 'Nabil', 'Tala', 'Samir', 'Noura', 'Youssef'];
const CUSTOMER_EMOJIS = ['👩🏻‍🌾', '🧑🏽‍🍳', '👵🏻', '👨🏽‍🔧', '🧒🏻', '👩🏾', '👨🏻‍🌾', '👩🏽‍🎨'];
const CUSTOMER_SPOTS = [{ x: 805, y: 235 }, { x: 148, y: 195 }, { x: 825, y: 370 }, { x: 500, y: 155 }];
const STATIONS = [
  { type: 'clean', name: 'Cleaning bench', x: 282, y: 323, rect: { x: 205, y: 220, w: 155, h: 78 }, icon: '🧽', color: '#87a68c' },
  { type: 'wires', name: 'Circuit bench', x: 480, y: 323, rect: { x: 405, y: 220, w: 155, h: 78 }, icon: '🔌', color: '#8196a6' },
  { type: 'gear', name: 'Gear bench', x: 676, y: 514, rect: { x: 599, y: 408, w: 155, h: 78 }, icon: '⚙️', color: '#d59b63' }
];
const OBSTACLES = [
  { x: 44, y: 64, w: 188, h: 78 }, { x: 205, y: 220, w: 155, h: 78 }, { x: 405, y: 220, w: 155, h: 78 },
  { x: 599, y: 408, w: 155, h: 78 }, { x: 738, y: 84, w: 185, h: 84 }, { x: 356, y: 478, w: 176, h: 55 }
];
let save = loadSave();
let soundOn = save.sound;
let currentJob = save.activeJobNumber ? createJob(save.activeJobNumber) : null;
let stage = currentJob ? (save.activeStage === 'toCustomer' ? 'toCustomer' : 'toBench') : 'meet';
let puzzleDone = false;
let cleaningCount = 0;
let angle = 0;
let selectedWire = null;
let connectedWires = new Set();
let audioContext;
let toastTimer;
let lastFrame = 0;
let joystickVector = { x: 0, y: 0 };
const keysDown = new Set();
const player = { x: 120, y: 515, vx: 0, vy: 0, facingX: 1, facingY: 0, speed: 210 };

const $ = id => document.getElementById(id);
const canvas = $('world');
const ctx = canvas.getContext('2d');
const modal = $('puzzle-modal');

function loadSave() {
  try {
    const old = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}');
    const completedCount = Number.isInteger(old.completedCount) ? old.completedCount : (Array.isArray(old.completed) ? old.completed.length : 0);
    return { ...FRESH_SAVE, ...old, completedCount, nextJob: Math.max(old.nextJob || 1, completedCount + 1) };
  } catch { return { ...FRESH_SAVE }; }
}
function storeSave() {
  save.sound = soundOn;
  delete save.completed;
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}
function createJob(number) {
  const types = ['clean', 'wires', 'gear', 'clean', 'gear', 'wires'];
  const type = types[(number - 1) % types.length];
  const pool = type === 'clean' ? CLEAN_OBJECTS : type === 'wires' ? WIRE_OBJECTS : GEAR_OBJECTS;
  const [title, emoji, description] = pool[(number - 1) % pool.length];
  const difficulty = Math.floor((number - 1) / 5);
  const job = { number, type, title, emoji, description, difficulty, reward: 10 + Math.floor(difficulty / 2),
    customerName: CUSTOMER_NAMES[(number - 1) % CUSTOMER_NAMES.length], customerEmoji: CUSTOMER_EMOJIS[(number - 1) % CUSTOMER_EMOJIS.length],
    customerSpot: CUSTOMER_SPOTS[(number - 1) % CUSTOMER_SPOTS.length] };
  if (type === 'clean') job.dustCount = 5 + Math.min(10, difficulty);
  if (type === 'wires') job.wireCount = 4 + Math.min(2, difficulty);
  if (type === 'gear') job.targetAngle = ((number * 2 % 7) + 1) * 45;
  return job;
}
function stationFor(type) { return STATIONS.find(station => station.type === type); }
function customerForCurrentJob() { return (currentJob || createJob(save.nextJob)).customerSpot; }
function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }
function rectsOverlapCircle(x, y, radius, rect) {
  const nearestX = Math.max(rect.x, Math.min(x, rect.x + rect.w));
  const nearestY = Math.max(rect.y, Math.min(y, rect.y + rect.h));
  return Math.hypot(x - nearestX, y - nearestY) < radius;
}
function movePlayer(dx, dy) {
  const r = 14;
  const nextX = Math.max(38, Math.min(WORLD_W - 38, player.x + dx));
  if (!OBSTACLES.some(rect => rectsOverlapCircle(nextX, player.y, r, rect))) player.x = nextX;
  const nextY = Math.max(52, Math.min(WORLD_H - 34, player.y + dy));
  if (!OBSTACLES.some(rect => rectsOverlapCircle(player.x, nextY, r, rect))) player.y = nextY;
}
function update(delta) {
  if (!modal.classList.contains('hidden')) { player.vx = 0; player.vy = 0; return; }
  const left = keysDown.has('ArrowLeft') || keysDown.has('a') || keysDown.has('A');
  const right = keysDown.has('ArrowRight') || keysDown.has('d') || keysDown.has('D');
  const up = keysDown.has('ArrowUp') || keysDown.has('w') || keysDown.has('W');
  const down = keysDown.has('ArrowDown') || keysDown.has('s') || keysDown.has('S');
  let dx = Number(right) - Number(left) + joystickVector.x;
  let dy = Number(down) - Number(up) + joystickVector.y;
  const magnitude = Math.hypot(dx, dy);
  if (magnitude > 1) { dx /= magnitude; dy /= magnitude; }
  player.vx = dx * player.speed;
  player.vy = dy * player.speed;
  if (magnitude > .08) { player.facingX = dx; player.facingY = dy; }
  movePlayer(player.vx * delta, player.vy * delta);
}
function roundedRect(context, x, y, width, height, radius, fill, stroke) {
  context.beginPath(); context.roundRect(x, y, width, height, radius);
  if (fill) { context.fillStyle = fill; context.fill(); }
  if (stroke) { context.strokeStyle = stroke; context.lineWidth = 2; context.stroke(); }
}
function drawRoom() {
  ctx.fillStyle = '#d8c39e'; ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  // warm floor boards
  for (let y = 55; y < WORLD_H; y += 62) {
    ctx.fillStyle = y % 124 === 55 ? '#e2cfad' : '#dec9a5'; ctx.fillRect(0, y, WORLD_W, 60);
    ctx.strokeStyle = '#c8af87'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, y + 60); ctx.lineTo(WORLD_W, y + 60); ctx.stroke();
    const offset = y % 124 === 55 ? 0 : 90;
    for (let x = offset; x < WORLD_W; x += 180) { ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 60); ctx.stroke(); }
  }
  // wall band, trim and the front door
  ctx.fillStyle = '#d8ad7c'; ctx.fillRect(0, 0, WORLD_W, 53);
  ctx.fillStyle = '#9d7655'; ctx.fillRect(0, 51, WORLD_W, 7);
  roundedRect(ctx, 65, 0, 185, 43, 10, '#a5c4b3', '#fff4df');
  ctx.fillStyle = '#fff3d9'; ctx.fillRect(154, 2, 6, 38); ctx.fillRect(68, 20, 179, 5);
  ctx.fillStyle = '#f5d17e'; ctx.beginPath(); ctx.arc(207, 14, 10, 0, Math.PI * 2); ctx.fill();
  roundedRect(ctx, 360, 10, 180, 34, 8, '#f6e7c7', '#ad805d');
  ctx.fillStyle = '#856349'; ctx.font = 'bold 13px system-ui'; ctx.textAlign = 'center'; ctx.fillText('POCKET WORKSHOP', 450, 32);
  // rug and entrance mat
  roundedRect(ctx, 75, 548, 175, 67, 18, '#c98e69');
  ctx.fillStyle = '#e8c29a'; ctx.font = 'bold 12px system-ui'; ctx.fillText('WELCOME IN', 162, 586);
  // shelves
  drawShelf(44, 64, 188, 78, ['🪴', '📚', '🧵', '🌼']);
  // window-side display shelf
  drawShelf(769, 61, 150, 18, ['🧸', '🪴', '🛎️']);
  // three repair benches
  for (const station of STATIONS) drawBench(station);
  // customer counter and sofa
  roundedRect(ctx, 738, 84, 185, 84, 12, '#a87650', '#845b3f');
  ctx.fillStyle = '#c58b5b'; ctx.fillRect(743, 91, 175, 14);
  ctx.fillStyle = '#f4e1c2'; ctx.font = 'bold 10px system-ui'; ctx.fillText('RECEPTION', 830, 132);
  roundedRect(ctx, 356, 478, 176, 55, 14, '#829a84', '#627764');
  roundedRect(ctx, 370, 486, 148, 34, 11, '#a3b69c');
  ctx.fillStyle = '#e2b9a2'; ctx.beginPath(); ctx.arc(855, 530, 23, 0, Math.PI * 2); ctx.fill();
  ctx.font = '25px system-ui'; ctx.fillText('🌿', 855, 538);
  // scattered workroom details
  ctx.font = '24px system-ui'; ctx.fillText('🧺', 602, 130); ctx.fillText('🪴', 90, 188); ctx.fillText('🪴', 896, 360);
  // door and spawn marker
  roundedRect(ctx, 73, 594, 88, 46, 13, '#a36e4d', '#80593f');
  ctx.fillStyle = '#e9c48f'; ctx.beginPath(); ctx.arc(144, 617, 3, 0, Math.PI * 2); ctx.fill();
}
function drawShelf(x, y, w, h, items) {
  roundedRect(ctx, x, y, w, Math.max(h, 16), 6, '#bd8d61', '#956b4a');
  ctx.fillStyle = '#8e6748'; ctx.fillRect(x - 4, y + Math.max(h, 16) - 2, w + 8, 7);
  ctx.font = '22px system-ui'; ctx.textAlign = 'center';
  items.forEach((item, i) => ctx.fillText(item, x + (i + 1) * (w / (items.length + 1)), y + Math.max(h, 16) - 6));
}
function drawBench(station) {
  const { x, y, w, h } = station.rect;
  ctx.fillStyle = '#b7936b'; ctx.fillRect(x + 16, y + h - 2, 13, 28); ctx.fillRect(x + w - 29, y + h - 2, 13, 28);
  roundedRect(ctx, x, y, w, h, 9, '#b77f54', '#805d41');
  ctx.fillStyle = station.color; roundedRect(ctx, x + 8, y + 7, w - 16, 41, 7, station.color);
  ctx.font = '29px system-ui'; ctx.textAlign = 'center'; ctx.fillText(station.icon, x + w / 2, y + 39);
  ctx.fillStyle = '#f8e8cc'; ctx.font = 'bold 9px system-ui'; ctx.fillText(station.name.toUpperCase(), x + w / 2, y + 65);
}
function drawPerson(x, y, shirt, hair, emoji, isPlayer = false, carried = '') {
  ctx.save();
  ctx.fillStyle = '#6c52362a'; ctx.beginPath(); ctx.ellipse(x, y + 12, 18, 7, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f4e3c8'; roundedRect(ctx, x - 11, y + 3, 8, 13, 4, '#745d48'); roundedRect(ctx, x + 3, y + 3, 8, 13, 4, '#745d48');
  roundedRect(ctx, x - 16, y - 13, 32, 26, 10, shirt, '#795c45');
  ctx.fillStyle = '#efc49e'; ctx.beginPath(); ctx.arc(x, y - 19, 12, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = hair; ctx.beginPath(); ctx.arc(x, y - 24, 12, Math.PI, Math.PI * 2); ctx.lineTo(x + 11, y - 18); ctx.quadraticCurveTo(x, y - 21, x - 11, y - 18); ctx.fill();
  ctx.fillStyle = '#493c33'; ctx.beginPath(); ctx.arc(x - 4, y - 18, 1.3, 0, Math.PI * 2); ctx.arc(x + 4, y - 18, 1.3, 0, Math.PI * 2); ctx.fill();
  if (isPlayer) { ctx.fillStyle = '#d87955'; ctx.beginPath(); ctx.ellipse(x, y - 29, 14, 5, 0, Math.PI, Math.PI * 2); ctx.fill(); ctx.fillRect(x - 8, y - 31, 16, 3); }
  if (emoji) { ctx.font = '15px system-ui'; ctx.textAlign = 'center'; ctx.fillText(emoji, x + 22, y + 18); }
  if (carried) { ctx.font = '24px system-ui'; ctx.textAlign = 'center'; ctx.fillText(carried, x + 18, y - 29); }
  ctx.restore();
}
function drawCustomer() {
  const c = customerForCurrentJob();
  const number = (currentJob || createJob(save.nextJob)).number;
  const idx = (number - 1) % CUSTOMER_NAMES.length;
  const bob = Math.sin(performance.now() / 370) * 1.5;
  drawPerson(c.x, c.y + bob, ['#77917a', '#d48b61', '#8396a6', '#ad8066'][idx % 4], ['#574235', '#352b27', '#ad7e54', '#48352d'][idx % 4], '');
  ctx.fillStyle = '#493c33'; ctx.font = 'bold 11px system-ui'; ctx.textAlign = 'center'; ctx.fillText(CUSTOMER_NAMES[idx], c.x, c.y + 38);
  roundedRect(ctx, c.x + 17, c.y - 51, 32, 31, 10, '#fffaf1', '#e4d7c3');
  ctx.fillStyle = '#fffaf1'; ctx.beginPath(); ctx.moveTo(c.x + 21, c.y - 23); ctx.lineTo(c.x + 16, c.y - 15); ctx.lineTo(c.x + 29, c.y - 23); ctx.fill();
  ctx.fillStyle = stage === 'toCustomer' ? '#819887' : '#d87955'; ctx.font = 'bold 21px system-ui'; ctx.fillText(stage === 'toCustomer' ? '✓' : stage === 'toBench' ? '🧰' : '!', c.x + 33, c.y - 29);
}
function drawPlayer() { drawPerson(player.x, player.y, '#75917f', '#534136', '', true, currentJob && (stage === 'toBench' || stage === 'toCustomer') ? currentJob.emoji : ''); }
function drawTargetRing(point, color = '#d87955') {
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.setLineDash([5, 5]); ctx.beginPath(); ctx.arc(point.x, point.y, 25 + Math.sin(performance.now() / 220) * 3, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]); ctx.restore();
}
function drawWorld() {
  drawRoom();
  if (stage === 'toBench' && currentJob) drawTargetRing(stationFor(currentJob.type));
  else if (stage === 'toCustomer' || stage === 'meet') drawTargetRing(customerForCurrentJob(), stage === 'toCustomer' ? '#819887' : '#d87955');
  drawCustomer();
  drawPlayer();
}
function nearbyStation() { return STATIONS.find(station => distance(player, station) < 68); }
function updatePrompt() {
  const customer = customerForCurrentJob();
  const atCustomer = distance(player, customer) < 65;
  const station = nearbyStation();
  let message = 'Walk to the customer with the “!” bubble.';
  let title = 'Find the waiting customer';
  let copy = 'Walk over and press E to take a repair mission.';
  let icon = '🛎️';
  let action = 'Talk to customer';
  let label = 'NEXT MISSION';
  if (currentJob && stage === 'toBench') {
    const target = stationFor(currentJob.type);
    title = `Repair ${currentJob.title}`; copy = `Take it to the ${target.name.toLowerCase()} and press E.`; icon = currentJob.emoji; label = `CUSTOMER JOB · #${currentJob.number}`;
    message = station && station.type === currentJob.type ? `Press E to use the ${target.name.toLowerCase()}.` : atCustomer ? 'The customer is waiting for you to start the repair.' : `Find the ${target.name.toLowerCase()} marked with a ring.`;
    action = station && station.type === currentJob.type ? 'Use workbench' : 'Find workbench';
  } else if (currentJob && stage === 'toCustomer') {
    title = `Return ${currentJob.title}`; copy = `Bring it back to ${currentJob.customerName} and press E.`; icon = currentJob.emoji; label = `REPAIR READY · #${currentJob.number}`;
    message = atCustomer ? `Press E to give the ${currentJob.title.toLowerCase()} back.` : 'Take the repaired item back to the customer.';
    action = 'Return repair';
  } else if (atCustomer) {
    message = `Press E to talk with ${createJob(save.nextJob).customerName}.`;
    action = 'Start mission';
  }
  setText('world-chip', message);
  setText('mission-title', title);
  setText('mission-copy', copy);
  setText('mission-icon', icon);
  setText('mission-label', label);
  const actionButton = $('interact-button');
  if (actionButton.dataset.action !== action) {
    actionButton.dataset.action = action;
    actionButton.replaceChildren(document.createTextNode(action + ' '));
    const key = document.createElement('kbd'); key.textContent = 'E'; actionButton.append(key);
  }
  setText('repair-count', String(save.completedCount));
  setText('shift-label', `Shift ${Math.floor(save.completedCount / 5) + 1}`);
}
function setText(id, value) { const element = $(id); if (element.textContent !== value) element.textContent = value; }
function gameFrame(time) {
  const delta = Math.min(.04, Math.max(0, (time - lastFrame) / 1000 || 0));
  lastFrame = time;
  update(delta);
  drawWorld();
  updatePrompt();
  requestAnimationFrame(gameFrame);
}
function interact() {
  if (!modal.classList.contains('hidden')) return;
  const customer = customerForCurrentJob();
  const atCustomer = distance(player, customer) < 65;
  const station = nearbyStation();
  if (!currentJob) {
    if (!atCustomer) { showToast('Walk closer to the customer with the “!” bubble.'); return; }
    currentJob = createJob(save.nextJob);
    stage = 'toBench';
    save.activeJobNumber = currentJob.number; save.activeStage = stage; storeSave();
    showToast(`${currentJob.customerName} needs help with a ${currentJob.title.toLowerCase()}!`);
    playTone(540, .09);
    updatePrompt();
    return;
  }
  if (stage === 'toBench') {
    const target = stationFor(currentJob.type);
    if (station && station.type === currentJob.type) { openPuzzle(); return; }
    if (station) { showToast(`This needs the ${target.name.toLowerCase()}.`); return; }
    if (atCustomer) { showToast(`Take the ${currentJob.title.toLowerCase()} to the ${target.name.toLowerCase()}.`); return; }
    showToast(`Walk to the ${target.name.toLowerCase()} marked with a ring.`);
    return;
  }
  if (stage === 'toCustomer') {
    if (!atCustomer) { showToast(`Bring the repaired item back to ${currentJob.customerName}.`); return; }
    finishMission();
  }
}
function openPuzzle() {
  puzzleDone = false;
  $('puzzle-category').textContent = `${stationFor(currentJob.type).name.toUpperCase()} · JOB #${currentJob.number}`;
  $('puzzle-title').textContent = currentJob.title;
  $('puzzle-description').textContent = currentJob.description;
  $('finish-button').classList.add('hidden');
  $('repair-progress').textContent = `${currentJob.difficulty === 0 ? 'A nice easy repair' : `Workshop challenge ${currentJob.difficulty + 1}`} · take your time`;
  $('repair-help').textContent = currentJob.type === 'clean' ? `Rub the object to clear all ${currentJob.dustCount} dusty spots.` : currentJob.type === 'wires' ? `Tap a colored wire, then its matching socket. Connect all ${currentJob.wireCount} pairs.` : `Turn the gear in 45° steps until it reaches ${currentJob.targetAngle}°.`;
  modal.classList.remove('hidden');
  if (currentJob.type === 'clean') buildCleaning();
  if (currentJob.type === 'wires') buildWires();
  if (currentJob.type === 'gear') buildGear();
}
function closePuzzle() { modal.classList.add('hidden'); }
function buildCleaning() {
  cleaningCount = 0;
  const card = $('repair-card');
  card.innerHTML = `<div class="clean-puzzle"><p class="puzzle-label">A gentle polish, please</p><div class="toy-wrap"><div class="toy" id="toy" role="img" aria-label="Dusty ${currentJob.title}">${currentJob.emoji}</div><div class="dust-layer">${Array.from({ length: currentJob.dustCount }, (_, i) => `<i class="dust" data-dust="${i}" style="left:${12 + Math.random() * 74}%;top:${12 + Math.random() * 74}%"></i>`).join('')}</div></div></div>`;
  const toy = $('toy'); let pointerDown = false;
  const brush = event => {
    if (!pointerDown || puzzleDone) return;
    const rect = toy.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width, y = (event.clientY - rect.top) / rect.height;
    for (const spot of [...card.querySelectorAll('.dust:not(.gone)')]) {
      const r = spot.getBoundingClientRect();
      const sx = (r.left + r.width / 2 - rect.left) / rect.width, sy = (r.top + r.height / 2 - rect.top) / rect.height;
      if (Math.hypot(x - sx, y - sy) < .22) { spot.classList.add('gone'); cleaningCount++; $('repair-progress').textContent = `${cleaningCount} of ${currentJob.dustCount} spots cleaned`; playTone(500 + cleaningCount * 30, .04); }
    }
    if (cleaningCount >= currentJob.dustCount) { toy.classList.add('cleaned'); completePuzzle('All fresh and shiny!'); }
  };
  toy.addEventListener('pointerdown', event => { pointerDown = true; toy.classList.add('cleaning'); toy.setPointerCapture(event.pointerId); brush(event); });
  toy.addEventListener('pointermove', brush);
  toy.addEventListener('pointerup', () => { pointerDown = false; toy.classList.remove('cleaning'); });
  toy.addEventListener('pointercancel', () => { pointerDown = false; toy.classList.remove('cleaning'); });
}
function buildWires() {
  selectedWire = null; connectedWires = new Set();
  const colors = WIRE_COLORS.slice(0, currentJob.wireCount);
  const rightOrder = [...colors].sort(() => Math.random() - .5);
  $('repair-card').innerHTML = `<div class="wire-puzzle"><div class="radio">${currentJob.emoji}</div><p class="wire-instructions">Connect matching colored ends</p><div class="wire-board"><div class="terminal-column">${colors.map(color => terminal(color, 'left')).join('')}</div><div class="terminal-column">${rightOrder.map(color => terminal(color, 'right')).join('')}</div></div><div class="match-lines" id="match-lines">0 of ${colors.length} connections</div></div>`;
  document.querySelectorAll('.terminal').forEach(button => button.addEventListener('click', () => connectWire(button.dataset.color, button.dataset.side)));
}
function terminal(color, side) {
  const label = color[0].toUpperCase() + color.slice(1);
  return `<button class="terminal ${side} wire-${color}" data-color="${color}" data-side="${side}">${side === 'left' ? `<i class="terminal-dot"></i>${label} wire` : `Socket<i class="terminal-dot"></i>`}</button>`;
}
function connectWire(color, side) {
  if (connectedWires.has(color)) return;
  if (!selectedWire) {
    if (side !== 'left') { showToast('Start with a wire on the left.'); return; }
    selectedWire = color;
    document.querySelector(`.terminal[data-color="${color}"][data-side="left"]`).classList.add('selected');
    playTone(380, .05); return;
  }
  if (side === 'left') {
    document.querySelectorAll('.terminal.selected').forEach(el => el.classList.remove('selected'));
    selectedWire = color;
    document.querySelector(`.terminal[data-color="${color}"][data-side="left"]`).classList.add('selected'); return;
  }
  if (color === selectedWire) {
    connectedWires.add(color);
    document.querySelectorAll(`.terminal[data-color="${color}"]`).forEach(el => { el.classList.add('connected'); el.classList.remove('selected'); });
    playTone(600 + connectedWires.size * 35, .07);
  } else { showToast('Those colors do not match. Try another socket.'); playTone(180, .1); }
  selectedWire = null;
  $('match-lines').textContent = `${connectedWires.size} of ${currentJob.wireCount} connections`;
  if (connectedWires.size === currentJob.wireCount) completePuzzle('Every wire is back in place!');
}
function buildGear() {
  angle = 0;
  $('repair-card').innerHTML = `<div class="gear-puzzle"><div class="gear-icon" id="gear"><span>⚙</span></div><div class="gear-target">✦ &nbsp; LINE UP WITH THE MARK AT ${currentJob.targetAngle}° &nbsp; ✦</div><div class="gear-controls"><button class="round-control" id="turn-left" aria-label="Turn gear left">↶</button><span class="angle-indicator" id="angle">0°</span><button class="round-control" id="turn-right" aria-label="Turn gear right">↷</button></div></div>`;
  const turn = direction => {
    if (puzzleDone) return;
    angle = (angle + direction * 45 + 360) % 360;
    $('gear').style.transform = `rotate(${angle}deg)`; $('angle').textContent = `${angle}°`; playTone(430 + angle, .05);
    if (angle === currentJob.targetAngle) completePuzzle('Perfect fit. It’s working again!');
  };
  $('turn-left').addEventListener('click', () => turn(-1)); $('turn-right').addEventListener('click', () => turn(1));
}
function completePuzzle(message) {
  if (puzzleDone) return;
  puzzleDone = true; $('repair-help').textContent = message; $('finish-button').classList.remove('hidden'); $('repair-progress').textContent = 'Ready to take it back to the customer'; playTone(760, .11);
}
function finishRepair() {
  if (!puzzleDone || !currentJob) return;
  stage = 'toCustomer'; save.activeStage = stage; storeSave(); closePuzzle(); updatePrompt();
  showToast(`The ${currentJob.title.toLowerCase()} is fixed! Take it back to ${currentJob.customerName}.`);
  playTone(700, .09);
}
function finishMission() {
  const completed = currentJob;
  save.coins += completed.reward; save.completedCount += 1; save.nextJob = completed.number + 1;
  save.activeJobNumber = null; save.activeStage = 'meet';
  currentJob = null; stage = 'meet'; storeSave(); updatePrompt();
  showToast(`${completed.customerName} is delighted! +${completed.reward} coins`);
  celebrate(); playTone(790, .11);
}
function showToast(message) {
  const toast = $('toast'); toast.textContent = message; toast.classList.remove('hidden'); clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add('hidden'), 2600);
}
function celebrate() {
  const layer = $('confetti');
  layer.innerHTML = Array.from({ length: 36 }, (_, i) => `<i class="confetti-piece" style="left:${Math.random() * 100}%;background:${['#d87955','#e8b866','#819887','#88a9a5','#e9bd78'][i % 5]};animation-delay:${Math.random() * .35}s"></i>`).join('');
  layer.classList.remove('hidden'); setTimeout(() => layer.classList.add('hidden'), 1400);
}
function playTone(frequency, duration) {
  if (!soundOn) return;
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator(), gain = audioContext.createGain();
    oscillator.type = 'sine'; oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(.035, audioContext.currentTime); gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + duration);
    oscillator.connect(gain); gain.connect(audioContext.destination); oscillator.start(); oscillator.stop(audioContext.currentTime + duration);
  } catch { /* Sound is optional on browsers without Web Audio. */ }
}
function updateJoystick(event) {
  const box = $('joystick').getBoundingClientRect();
  const cx = box.left + box.width / 2, cy = box.top + box.height / 2;
  let dx = event.clientX - cx, dy = event.clientY - cy;
  const max = box.width * .34, length = Math.hypot(dx, dy);
  if (length > max) { dx *= max / length; dy *= max / length; }
  joystickVector = { x: dx / max, y: dy / max };
  $('joystick-knob').style.transform = `translate(${dx}px,${dy}px)`;
}
function resetJoystick() { joystickVector = { x: 0, y: 0 }; $('joystick-knob').style.transform = 'translate(0,0)'; }

window.addEventListener('keydown', event => {
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(event.key)) event.preventDefault();
  keysDown.add(event.key);
  if ((event.key === 'e' || event.key === 'E' || event.key === 'Enter') && !event.repeat) interact();
  if (event.key === 'Escape' && !modal.classList.contains('hidden')) closePuzzle();
});
window.addEventListener('keyup', event => keysDown.delete(event.key));
window.addEventListener('blur', () => { keysDown.clear(); resetJoystick(); });
$('interact-button').addEventListener('click', interact);
$('finish-button').addEventListener('click', finishRepair);
$('close-puzzle').addEventListener('click', closePuzzle);
$('respawn-button').addEventListener('click', () => { player.x = 120; player.y = 515; player.vx = 0; player.vy = 0; resetJoystick(); showToast('Back at the workshop entrance.'); });
$('sound-toggle').addEventListener('click', () => {
  soundOn = !soundOn; $('sound-toggle').textContent = soundOn ? '♫' : '♪'; $('sound-toggle').setAttribute('aria-label', soundOn ? 'Mute sounds' : 'Enable sounds'); storeSave(); if (soundOn) playTone(600, .08);
});
$('joystick').addEventListener('pointerdown', event => { $('joystick').setPointerCapture(event.pointerId); updateJoystick(event); });
$('joystick').addEventListener('pointermove', event => { if (event.buttons) updateJoystick(event); });
$('joystick').addEventListener('pointerup', resetJoystick);
$('joystick').addEventListener('pointercancel', resetJoystick);
if (!soundOn) $('sound-toggle').textContent = '♪';
updatePrompt(); requestAnimationFrame(gameFrame);

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(error => console.warn('Offline setup could not start:', error)));
}
