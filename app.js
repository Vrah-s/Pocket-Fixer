const JOBS = [
  { id: 'robot', title: 'Dusty toy robot', type: 'clean', emoji: '🤖', category: 'CLEAN & RESTORE', description: 'A little dust has settled on this old friend. Give it a gentle polish.', hint: 'Rub the toy with your finger to brush away all five dusty spots.' },
  { id: 'radio', title: 'Grandpa’s radio', type: 'wires', emoji: '📻', category: 'CONNECT THE WIRES', description: 'The radio went quiet. Match each colored wire to its socket.', hint: 'Tap a colored wire on the left, then its matching socket on the right.' },
  { id: 'clock', title: 'Sleepy little clock', type: 'gear', emoji: '⏰', category: 'SET THE GEAR', description: 'One gear slipped out of place. Turn it until the notch points to the mark.', hint: 'Turn the gear in 45° steps. Line the notch up with the little mark.' },
  { id: 'pot', title: 'Garden flowerpot', type: 'clean', emoji: '🪴', category: 'CLEAN & RESTORE', description: 'This pot has seen many rainy days. Wipe it clean for a new bloom.', hint: 'Rub the pot with your finger to brush away all five muddy spots.' },
  { id: 'bell', title: 'Bicycle bell', type: 'wires', emoji: '🚲', category: 'CONNECT THE WIRES', description: 'The bell’s tiny circuit came loose. Reconnect its colored wires.', hint: 'Tap a colored wire on the left, then its matching socket on the right.' }
];

const SAVE_KEY = 'pocket-workshop-save-v1';
const freshSave = () => ({ coins: 0, completed: [], sound: true });
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
  try { return { ...freshSave(), ...JSON.parse(localStorage.getItem(SAVE_KEY) || '{}') }; }
  catch { return freshSave(); }
}
function storeSave() {
  save.sound = soundOn;
  localStorage.setItem(SAVE_KEY, JSON.stringify(save));
}
function renderHome() {
  $('coin-count').textContent = save.coins;
  $('job-count').textContent = `${save.completed.length} / ${JOBS.length} finished`;
  $('job-grid').innerHTML = JOBS.map((job, index) => {
    const complete = save.completed.includes(job.id);
    return `<button class="job-card ${complete ? 'completed' : ''}" data-job="${job.id}" aria-label="${complete ? 'Replay' : 'Start'} ${job.title}">
      <span class="job-emoji">${job.emoji}</span><span class="job-info"><strong>${job.title}</strong><small>${complete ? 'Revisit this repair' : ['A quick polish', 'A bit of rewiring', 'A careful adjustment', 'A freshen-up', 'One more connection'][index]}</small></span>
      <span class="${complete ? 'job-check' : 'job-arrow'}">${complete ? '✓' : '›'}</span></button>`;
  }).join('');
  document.querySelectorAll('.job-card').forEach(button => button.addEventListener('click', () => openJob(button.dataset.job)));
}
function showHome() {
  repairView.classList.add('hidden');
  homeView.classList.remove('hidden');
  currentJob = null;
  renderHome();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
function openJob(id) {
  currentJob = JOBS.find(job => job.id === id);
  if (!currentJob) return;
  puzzleDone = false;
  $('repair-title').textContent = currentJob.title;
  $('repair-category').textContent = currentJob.category;
  $('repair-description').textContent = currentJob.description;
  $('repair-help').textContent = currentJob.hint;
  $('repair-progress').textContent = save.completed.includes(id) ? 'You’ve fixed this one before' : 'A new little challenge';
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
  const object = currentJob.id === 'robot' ? '🤖' : '🪴';
  card.innerHTML = `<div class="clean-puzzle"><p class="puzzle-label">A gentle polish, please</p><div class="toy-wrap"><div class="toy" id="toy" role="img" aria-label="Dusty ${currentJob.title}">${object}</div><div class="dust-layer">${Array.from({ length: 5 }, (_, i) => `<i class="dust" data-dust="${i}"></i>`).join('')}</div></div><div class="wipe-pad"></div></div>`;
  const toy = $('toy');
  let pointerDown = false;
  const brush = event => {
    if (!pointerDown || puzzleDone) return;
    const rect = toy.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    const spots = [...document.querySelectorAll('.dust:not(.gone)')];
    for (const spot of spots) {
      const spotRect = spot.getBoundingClientRect();
      const sx = (spotRect.left + spotRect.width / 2 - rect.left) / rect.width;
      const sy = (spotRect.top + spotRect.height / 2 - rect.top) / rect.height;
      if (Math.hypot(x - sx, y - sy) < .25) {
        spot.classList.add('gone');
        cleaningCount += 1;
        $('repair-progress').textContent = `${cleaningCount} of 5 dusty spots brushed away`;
        playTone(520 + cleaningCount * 55, .045);
      }
    }
    if (cleaningCount >= 5) {
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
  const colors = ['red', 'blue', 'yellow', 'green'];
  const rightOrder = ['green', 'red', 'yellow', 'blue'];
  card.innerHTML = `<div class="wire-puzzle"><div class="radio">${currentJob.id === 'radio' ? '📻' : '🚲'}</div><p class="wire-instructions">Find the matching colored ends</p><div class="wire-board"><div class="terminal-column">${colors.map(color => terminal(color, 'left')).join('')}</div><div class="terminal-column">${rightOrder.map(color => terminal(color, 'right')).join('')}</div></div><div class="match-lines" id="match-lines">0 of 4 connections</div></div>`;
  document.querySelectorAll('.terminal').forEach(button => button.addEventListener('click', () => connectWire(button.dataset.color, button.dataset.side)));
}
function terminal(color, side) {
  return `<button class="terminal ${side} wire-${color}" data-color="${color}" data-side="${side}">${side === 'left' ? `<i class="terminal-dot"></i>${color[0].toUpperCase() + color.slice(1)} wire` : `Socket<i class="terminal-dot"></i>`}</button>`;
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
    playTone(610 + connectedWires.size * 50, .08);
  } else {
    showToast('Those colors do not match. Try another socket.');
    playTone(180, .1);
  }
  selectedWire = null;
  $('match-lines').textContent = `${connectedWires.size} of 4 connections`;
  if (connectedWires.size === 4) completePuzzle('Every wire is back in place!');
}
function buildGear(card) {
  angle = 0;
  const target = 90;
  card.innerHTML = `<div class="gear-puzzle"><div class="gear-icon" id="gear"><span>⚙</span></div><div class="gear-target">✦ &nbsp; LINE THE NOTCH UP WITH THE MARK &nbsp; ✦</div><div class="gear-controls"><button class="round-control" id="turn-left" aria-label="Turn gear left">↶</button><span class="angle-indicator" id="angle">0°</span><button class="round-control" id="turn-right" aria-label="Turn gear right">↷</button></div></div>`;
  const turn = direction => {
    if (puzzleDone) return;
    angle = (angle + direction * 45 + 360) % 360;
    $('gear').style.transform = `rotate(${angle}deg)`;
    $('angle').textContent = `${angle}°`;
    playTone(430 + angle, .05);
    if (angle === target) completePuzzle('The clock is ticking again!');
  };
  $('turn-left').addEventListener('click', () => turn(-1));
  $('turn-right').addEventListener('click', () => turn(1));
}
function completePuzzle(message) {
  if (puzzleDone) return;
  puzzleDone = true;
  $('repair-help').textContent = message;
  $('finish-button').classList.remove('hidden');
  $('repair-progress').textContent = 'Lovely work. Ready to wrap up?';
  playTone(760, .11);
}
function finishJob() {
  if (!currentJob || !puzzleDone) return;
  const firstTime = !save.completed.includes(currentJob.id);
  if (firstTime) {
    save.completed.push(currentJob.id);
    save.coins += 10;
    storeSave();
    showToast('Repair complete! +10 little coins');
    celebrate();
  } else showToast('A lovely repair, all over again!');
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
