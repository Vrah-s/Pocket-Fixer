const SAVE_KEY = 'pocket-workshop-save-v1';
const freshSave = () => ({ coins: 0, completedCount: 0, nextJob: 1, sound: true });
const CLEAN_OBJECTS = [
  ['Dusty toy robot', '🤖', 'An old friend has collected a little dust.'], ['Muddy flowerpot', '🪴', 'This pot has been out in the garden through the rain.'],
  ['Sleepy plush bear', '🧸', 'A well-loved bear could use a gentle freshen-up.'], ['Little toy train', '🚂', 'A bit of workshop dust is hiding its bright colors.'],
  ['Scuffed red kettle', '🫖', 'This kettle has helped make many cozy cups of tea.'], ['Traveler’s boot', '🥾', 'A long walk left this boot covered in trail dust.'],
  ['Old lunchbox', '🍱', 'Someone’s lunchbox needs a good wipe before tomorrow.'], ['Tiny toy boat', '⛵', 'The little boat came back from a very muddy pond.']
];
const WIRE_OBJECTS = [
  ['Grandpa’s radio', '📻', 'The radio went quiet when its wires came loose.'], ['Bicycle bell', '🚲', 'Reconnect the tiny circuit so the bell can ring again.'],
  ['Music box', '🎶', 'Its little song stopped when the wires slipped apart.'], ['Desk lamp', '💡', 'Match the colored wires to bring the lamp back to life.'],
  ['Toy rover', '🛸', 'The rover is ready to roll as soon as its wires are fixed.'], ['Table fan', '🌀', 'Match the wires and bring back a gentle breeze.']
];
const GEAR_OBJECTS = [
  ['Sleepy little clock', '⏰', 'One gear slipped out of place while the clock was napping.'], ['Wind-up bird', '🐦', 'Its tiny winding gear needs to point to the right mark.'],
  ['Pocket watch', '⌚', 'A careful turn will set this old watch ticking again.'], ['Toy windmill', '🌬️', 'Line up the gear so the little mill can spin.'],
  ['Music box wheel', '🎼', 'Set the gear, and the music box can play its tune.']
];
const WIRE_COLORS = ['red', 'blue', 'yellow', 'green', 'purple', 'orange'];
let save = loadSave();
let currentJob = null;
let puzzleDone = false;
let cleaningCount = 0;
let angle = 0;
let selectedWire = null;
let connectedWires = new Set();
let soundOn = save.sound;
let audioContext;
let toastTimer;

const $ = id => document.getElementById(id);
const homeView = $('home-view');
const repairView = $('repair-view');

function loadSave() {
  try {
    const oldSave = JSON.parse(localStorage.getItem(SAVE_KEY) || '{}');
    const completedCount = Number.isInteger(oldSave.completedCount) ? oldSave.completedCount : (Array.isArray(oldSave.completed) ? oldSave.completed.length : 0);
    return { ...freshSave(), ...oldSave, completedCount, nextJob: Math.max(oldSave.nextJob || 1, completedCount + 1) };
  } catch { return freshSave(); }
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
  const [baseTitle, emoji, detail] = pool[(number - 1) % pool.length];
  const difficulty = Math.floor((number - 1) / 5);
  const job = { number, id: `repair-${number}`, title: baseTitle, type, emoji, detail, difficulty,
    difficultyLabel: difficulty === 0 ? 'Easy-going' : difficulty < 3 ? 'Getting trickier' : 'Workshop pro' };
  if (type === 'clean') job.dustCount = 5 + Math.min(10, difficulty);
  if (type === 'wires') job.wireCount = 4 + Math.min(2, difficulty);
  if (type === 'gear') job.targetAngle = ((number * 2 % 7) + 1) * 45;
  return job;
}
function renderHome() {
  $('coin-count').textContent = save.coins;
  $('job-count').textContent = `${save.completedCount} repairs finished · Shift ${Math.floor(save.completedCount / 5) + 1}`;
  const waiting = [0, 1, 2].map(offset => createJob(save.nextJob + offset));
  $('job-grid').innerHTML = waiting.map((job, index) => `<button class="job-card ${index ? 'waiting' : 'ready'}" data-job="${job.number}" ${index ? 'disabled' : ''} aria-label="${index ? 'Waiting customer' : 'Start repair'}: ${job.title}">
      <span class="job-emoji">${job.emoji}</span><span class="job-info"><strong>${job.title}</strong><small>${index === 0 ? `Repair #${job.number} · ${job.difficultyLabel}` : `Customer #${job.number} · waiting in line`}</small></span>
      <span class="${index ? 'job-check' : 'job-arrow'}">${index ? '…' : '›'}</span></button>`).join('');
  document.querySelectorAll('.job-card:not(:disabled)').forEach(button => button.addEventListener('click', () => openJob(Number(button.dataset.job))));
}
function showHome() {
  repairView.classList.add('hidden');
  homeView.classList.remove('hidden');
  currentJob = null;
  renderHome();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function openJob(number) {
  currentJob = createJob(number);
  puzzleDone = false;
  $('repair-title').textContent = currentJob.title;
  $('repair-category').textContent = `${currentJob.type === 'clean' ? 'CLEAN & RESTORE' : currentJob.type === 'wires' ? 'CONNECT THE WIRES' : 'SET THE GEAR'} · REPAIR #${currentJob.number}`;
  $('repair-description').textContent = currentJob.detail;
  $('repair-help').textContent = currentJob.type === 'clean'
    ? `Rub the object to clear all ${currentJob.dustCount} dusty spots.`
    : currentJob.type === 'wires'
      ? `Tap a colored wire, then its matching socket. Connect all ${currentJob.wireCount} pairs.`
      : `Turn the gear in 45° steps until it reaches ${currentJob.targetAngle}°.`;
  $('repair-progress').textContent = `${currentJob.difficultyLabel} · take your time`;
  $('finish-button').classList.add('hidden');
  homeView.classList.add('hidden');
  repairView.classList.remove('hidden');
  buildPuzzle();
  window.scrollTo({ top: 0, behavior: 'smooth' });
  playTone(460, .07);
}
function buildPuzzle() {
  const card = $('repair-card');
  if (currentJob.type === 'clean') buildCleaning(card);
  if (currentJob.type === 'wires') buildWires(card);
  if (currentJob.type === 'gear') buildGear(card);
}
function buildCleaning(card) {
  cleaningCount = 0;
  card.innerHTML = `<div class="clean-puzzle"><p class="puzzle-label">A gentle polish, please</p><div class="toy-wrap"><div class="toy" id="toy" role="img" aria-label="Dusty ${currentJob.title}">${currentJob.emoji}</div><div class="dust-layer">${Array.from({ length: currentJob.dustCount }, (_, i) => `<i class="dust" data-dust="${i}" style="left:${12 + Math.random() * 74}%;top:${12 + Math.random() * 74}%"></i>`).join('')}</div></div><div class="wipe-pad"></div></div>`;
  const toy = $('toy');
  let pointerDown = false;
  const brush = event => {
    if (!pointerDown || puzzleDone) return;
    const rect = toy.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    for (const spot of [...document.querySelectorAll('.dust:not(.gone)')]) {
      const spotRect = spot.getBoundingClientRect();
      const sx = (spotRect.left + spotRect.width / 2 - rect.left) / rect.width;
      const sy = (spotRect.top + spotRect.height / 2 - rect.top) / rect.height;
      if (Math.hypot(x - sx, y - sy) < .22) {
        spot.classList.add('gone');
        cleaningCount += 1;
        $('repair-progress').textContent = `${cleaningCount} of ${currentJob.dustCount} spots cleaned`;
        playTone(520 + cleaningCount * 30, .045);
      }
    }
    if (cleaningCount >= currentJob.dustCount) {
      toy.classList.remove('cleaning');
      toy.classList.add('cleaned');
      completePuzzle('All fresh and shiny!');
    }
  };
  toy.addEventListener('pointerdown', event => { pointerDown = true; toy.classList.add('cleaning'); toy.setPointerCapture(event.pointerId); brush(event); });
  toy.addEventListener('pointermove', brush);
  toy.addEventListener('pointerup', () => { pointerDown = false; toy.classList.remove('cleaning'); });
  toy.addEventListener('pointercancel', () => { pointerDown = false; toy.classList.remove('cleaning'); });
}
function buildWires(card) {
  selectedWire = null;
  connectedWires = new Set();
  const colors = WIRE_COLORS.slice(0, currentJob.wireCount);
  const rightOrder = [...colors].sort(() => Math.random() - .5);
  card.innerHTML = `<div class="wire-puzzle"><div class="radio">${currentJob.emoji}</div><p class="wire-instructions">Find the matching colored ends</p><div class="wire-board"><div class="terminal-column">${colors.map(color => terminal(color, 'left')).join('')}</div><div class="terminal-column">${rightOrder.map(color => terminal(color, 'right')).join('')}</div></div><div class="match-lines" id="match-lines">0 of ${colors.length} connections</div></div>`;
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
    playTone(380, .05);
    return;
  }
  if (side === 'left') {
    document.querySelectorAll('.terminal.selected').forEach(el => el.classList.remove('selected'));
    selectedWire = color;
    document.querySelector(`.terminal[data-color="${color}"][data-side="left"]`).classList.add('selected');
    return;
  }
  if (color === selectedWire) {
    connectedWires.add(color);
    document.querySelectorAll(`.terminal[data-color="${color}"]`).forEach(el => { el.classList.add('connected'); el.classList.remove('selected'); });
    playTone(610 + connectedWires.size * 30, .08);
  } else {
    showToast('Those colors do not match. Try another socket.');
    playTone(180, .1);
  }
  selectedWire = null;
  $('match-lines').textContent = `${connectedWires.size} of ${currentJob.wireCount} connections`;
  if (connectedWires.size === currentJob.wireCount) completePuzzle('Every wire is back in place!');
}
function buildGear(card) {
  angle = 0;
  const target = currentJob.targetAngle;
  card.innerHTML = `<div class="gear-puzzle"><div class="gear-icon" id="gear"><span>⚙</span></div><div class="gear-target">✦ &nbsp; LINE UP WITH THE MARK AT ${target}° &nbsp; ✦</div><div class="gear-controls"><button class="round-control" id="turn-left" aria-label="Turn gear left">↶</button><span class="angle-indicator" id="angle">0°</span><button class="round-control" id="turn-right" aria-label="Turn gear right">↷</button></div></div>`;
  const turn = direction => {
    if (puzzleDone) return;
    angle = (angle + direction * 45 + 360) % 360;
    $('gear').style.transform = `rotate(${angle}deg)`;
    $('angle').textContent = `${angle}°`;
    playTone(430 + angle, .05);
    if (angle === target) completePuzzle('Perfect fit. It’s working again!');
  };
  $('turn-left').addEventListener('click', () => turn(-1));
  $('turn-right').addEventListener('click', () => turn(1));
}
function completePuzzle(message) {
  if (puzzleDone) return;
  puzzleDone = true;
  $('repair-help').textContent = message;
  $('finish-button').classList.remove('hidden');
  $('repair-progress').textContent = 'Lovely work. Ready to welcome the next customer?';
  playTone(760, .11);
}
function finishJob() {
  if (!currentJob || !puzzleDone) return;
  const reward = 10 + Math.floor(currentJob.difficulty / 2);
  save.completedCount += 1;
  save.nextJob = currentJob.number + 1;
  save.coins += reward;
  storeSave();
  showToast(`Repair complete! +${reward} little coins`);
  celebrate();
  playTone(720, .1);
  showHome();
}
function showToast(message) {
  const toast = $('toast');
  toast.textContent = message;
  toast.classList.remove('hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.add('hidden'), 2200);
}
function celebrate() {
  const layer = $('confetti');
  layer.innerHTML = Array.from({ length: 45 }, (_, i) => `<i class="confetti-piece" style="left:${Math.random() * 100}%;background:${['#d87955', '#e8b866', '#819887', '#88a9a5', '#e9bd78'][i % 5]};animation-delay:${Math.random() * .35}s;transform:rotate(${Math.random() * 180}deg)"></i>`).join('');
  layer.classList.remove('hidden');
  setTimeout(() => layer.classList.add('hidden'), 1500);
}
function playTone(frequency, duration) {
  if (!soundOn) return;
  try {
    audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gain.gain.setValueAtTime(.04, audioContext.currentTime);
    gain.gain.exponentialRampToValueAtTime(.001, audioContext.currentTime + duration);
    oscillator.connect(gain); gain.connect(audioContext.destination);
    oscillator.start(); oscillator.stop(audioContext.currentTime + duration);
  } catch { /* Sound is optional on browsers without Web Audio. */ }
}

$('back-button').addEventListener('click', showHome);
$('finish-button').addEventListener('click', finishJob);
$('sound-toggle').addEventListener('click', () => {
  soundOn = !soundOn;
  $('sound-toggle').textContent = soundOn ? '♫' : '♪';
  $('sound-toggle').setAttribute('aria-label', soundOn ? 'Mute sounds' : 'Enable sounds');
  storeSave();
  if (soundOn) playTone(600, .08);
});
if (!soundOn) $('sound-toggle').textContent = '♪';
renderHome();

if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(error => console.warn('Offline setup could not start:', error)));
}
