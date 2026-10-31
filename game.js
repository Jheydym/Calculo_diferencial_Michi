'use strict';

const FRAME = 256;
const FPS = 12;
const MAX_FAILS = 3;
const SPRITES = './assets/sprites/';
const SHEETS = {
  idle: { src: SPRITES + 'main_cat/cat_idle_float/Cat_Felix_root_cat_idle_float.png', frames: 24 },
  joy: { src: SPRITES + 'main_cat/cat_joy/Cat_Felix_root_cat_joy.png', frames: 26 },
  hit: { src: SPRITES + 'main_cat/cat_hit_reaction/Cat_Felix_root_cat_hit_reaction.png', frames: 10 },
  run: { src: SPRITES + 'main_cat/cat_run_without_hand/Cat_Felix_root_cat_run_without_hand.png', frames: 15 },
  jump: { src: SPRITES + 'main_cat/cat_jump/Cat_Felix_root_cat_jump.png', frames: 11 },
};
const BGS = ['level_1.jpg', 'level_2.jpg', 'level_3.jpg', 'level_4.jpg', 'level_5.jpg', 'level_6.jpg'].map(f => SPRITES + 'bgs/' + f);
const MENU_BG = SPRITES + 'bgs/menu.jpg';
const PORTRAITS = ['portrait_main_cat.png', 'portrait_commander.png'].map(f => SPRITES + 'portraits/' + f);
const MUSIC = ['./assets/music/music_a.mp3', './assets/music/music_b.mp3'];
const SFX_FILES = {
  click: 'btn_click', blip: 'type_blip', correct: 'correct', wrong: 'wrong',
  levelUp: 'level_up', victory: 'victory', gameOver: 'game_over',
};

const $ = id => document.getElementById(id);
const shuffle = a => {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};
const sleep = ms => new Promise(r => setTimeout(r, ms));

const graphAsymptote = () => {
  const pts = (from, to) => {
    const out = [];
    for (let x = from; x <= to; x += 0.02) {
      const y = Math.min(1 / ((x - 2) ** 2), 9);
      out.push(`${(30 + x * 40).toFixed(1)},${(170 - y * 16).toFixed(1)}`);
    }
    return out.join(' ');
  };
  return `<svg viewBox="0 0 300 200" role="img" aria-label="Gráfica de f(x)=1/(x-2)^2 con asíntota vertical en x=2">
    <line x1="10" y1="170" x2="290" y2="170" stroke="#8892c8"/>
    <line x1="30" y1="10" x2="30" y2="190" stroke="#8892c8"/>
    <line x1="110" y1="10" x2="110" y2="190" stroke="#ff4d6d" stroke-dasharray="5 4"/>
    <text x="114" y="186" fill="#ff4d6d" font-size="12">x = 2</text>
    <polyline fill="none" stroke="#ffb347" stroke-width="2.5" points="${pts(0.05, 1.7)}"/>
    <polyline fill="none" stroke="#ffb347" stroke-width="2.5" points="${pts(2.3, 6.5)}"/>
  </svg>`;
};

const T = 'Protocolo de Validación de Seguridad';
const F = 'Cálculo de Calibración de Trayectoria';
const theory = [
  { tag: T, q: 'El cálculo diferencial es una disciplina que proporciona herramientas analíticas para:',
    o: ['Modelar fenómenos que evolucionan', 'Optimizar procesos y funciones', 'Resolver problemas en ingeniería, física, economía y otras ciencias', 'Todas las anteriores'], c: 3 },
  { tag: T, q: '¿Cuáles son los tres tipos de discontinuidad?',
    o: ['Discontinuidad creciente, decreciente y constante', 'Discontinuidad removible (evitable), de salto e infinita', 'Discontinuidad positiva, negativa y periódica', 'Discontinuidad lineal, cuadrática y exponencial'], c: 1 },
  { tag: T, q: '¿Qué representa la derivada de una función en un punto?',
    o: ['La razón de cambio instantáneo y la pendiente de la recta tangente en ese punto', 'El valor máximo que alcanza una función', 'El cambio total de una función entre dos puntos', 'El área que se encuentra debajo de una curva'], c: 0 },
  { tag: T, q: 'Responde falso o verdadero: Las técnicas de derivación son únicamente atajos operativos que permiten calcular derivadas más rápido, sin necesidad de comprender el concepto de razón de cambio instantáneo.',
    o: ['Verdadero', 'Falso'], c: 1,
    fb: 'Las técnicas de derivación son reglas matemáticas fundamentadas en la definición formal de derivada que permiten calcular y analizar razones de cambio de manera eficiente.' },
  { tag: T, q: '¿Para qué sirve principalmente el cálculo diferencial?',
    o: ['Para calcular únicamente áreas y volúmenes', 'Para analizar cómo cambian las funciones y aplicar esos conocimientos en situaciones reales', 'Para resolver solamente operaciones algebraicas', 'Para encontrar únicamente el valor máximo de una función'], c: 1 },
];
const formulas = [
  { tag: F, q: String.raw`Encuentre el dominio de la función $f(x) = \dfrac{5x+1}{x^2-25}$`,
    o: [String.raw`$(-\infty, 5) \cup (5, \infty)$`, String.raw`$(-\infty, -5) \cup (-5, 5) \cup (5, \infty)$`, '$[-5, 5]$', String.raw`$\mathbb{R} - \{-5\}$`], c: 1 },
  { tag: F, q: '¿Cuál es la forma simplificada de $f(a+2)$ si $f(x) = 3x^2 - 4x + 2$?',
    o: ['$3a^2 + 8a + 2$', '$3a^2 + 12a + 6$', '$3a^2 + 8a + 6$', '$3a^2 + 4a + 6$'], c: 2 },
  { tag: F, q: String.raw`¿Cuál es el valor del siguiente límite? $\displaystyle\lim_{x \to 2} (3x^2 - 4x + 1)$`,
    o: ['$5$', '$3$', '$6$', '$4$'], c: 0 },
  { tag: F, q: String.raw`Observe la gráfica de la función $f(x) = \dfrac{1}{(x-2)^2}$. ¿Hacia qué valor tiende $f(x)$ cuando $x$ se aproxima a $2$?`,
    fig: graphAsymptote, o: ['$0$', String.raw`$-\infty$`, String.raw`$+\infty$`, '$2$'], c: 2 },
  { tag: F, q: String.raw`Dada la función $g(x) = (x^2+1)\sqrt{x}$, ¿cuál es la primera derivada de esta función, después de aplicar la regla del producto y simplificar el resultado?`,
    o: [String.raw`$g'(x) = \dfrac{3x^2+1}{2\sqrt{x}}$`, String.raw`$g'(x) = \dfrac{5x^2+1}{\sqrt{x}}$`, String.raw`$g'(x) = \dfrac{4x^2+1}{2\sqrt{x}}$`, String.raw`$g'(x) = \dfrac{5x^2+1}{2\sqrt{x}}$`], c: 3 },
  { tag: F, q: '¿Cuál es la primera derivada de $f(x) = (3x^2 - 5x + 7)^4$ al aplicar la regla de la cadena?',
    o: ['$f\'(x) = (3x^2 - 5x + 7)^4$', '$f\'(x) = 4(6x - 5)(3x^2 - 5x + 7)^3$', '$f\'(x) = 4(6x - 5)(3x^2 - 5x + 7)^4$', '$f\'(x) = (6x - 5)(3x^2 - 5x + 7)^3$'], c: 1 },
  { tag: F, q: String.raw`Dada la función $y = \sqrt{5x^2 - 3x + 1}$, ¿cuál es la primera derivada de esta función al aplicar la regla de la cadena?`,
    o: [String.raw`$y' = \dfrac{10x-3}{\sqrt{5x^2-3x+1}}$`, String.raw`$y' = \dfrac{5x-3}{2\sqrt{5x^2-3x+1}}$`, String.raw`$y' = \dfrac{10x-3}{2\sqrt{5x^2-3x+1}}$`, String.raw`$y' = \dfrac{10x+3}{2\sqrt{5x^2-3x+1}}$`], c: 2 },
];

const CAT = 'Michi-7';
const CMD = 'Comandante Felino';
const DIALOGS = [
  [[CMD, 'Michi-7, aquí el Comandante Felino. Te recibo con mucho ruido, ¿me escuchas?'],
   [CAT, 'Fuerte y claro, Comandante. Mi mochila propulsora dejó de responder y floto sin control.'],
   [CMD, 'Calma. Para reconectar el sistema necesito que superes la validación de seguridad y calibres tus propulsores.'],
   [CAT, 'Entendido. Iniciando el Sector 1, ¡allá voy!']],
  [[CMD, 'Buen trabajo, Michi-7. Entraste al Sector 2, hay mucho polvo estelar.'],
   [CAT, 'Lo noto, Comandante. Los sensores parpadean y la trayectoria se desvía.'],
   [CMD, 'Necesito otra validación de seguridad y un ajuste fino de los propulsores.'],
   [CAT, 'Manos a la obra, no pienso perderme en este sector.']],
  [[CMD, 'Sector 3. Detecto una lluvia de meteoritos pequeños frente a ti.'],
   [CAT, '¡Los veo! Brillan como pelotas de estambre gigantes.'],
   [CMD, 'Concéntrate. Un cálculo incorrecto y los propulsores podrían fallar de nuevo.'],
   [CAT, 'Recibido. Cola firme y mente fría.']],
  [[CMD, 'Michi-7, ya pasaste la mitad del camino. La nave nodriza aparece en mi radar.'],
   [CAT, '¡Qué buena noticia! Aunque mi tanque de oxígeno ya no está tan lleno.'],
   [CMD, 'Por eso debemos ser precisos. Validación de seguridad y calibración, como siempre.'],
   [CAT, 'Siempre listo, Comandante. Continuemos.']],
  [[CMD, 'Sector 5. Una tormenta de radiación nos distorsiona la señal.'],
   [CAT, 'Tu voz se corta, Comandante... ¿sigues ahí?'],
   [CMD, 'Aquí estoy. Un ajuste más y tendremos los propulsores casi reparados.'],
   [CAT, 'Entonces no hay tiempo que perder. ¡Adelante!']],
  [[CMD, 'Último sector, Michi-7. La nave está a pocos segundos de distancia.'],
   [CAT, 'La puedo ver desde aquí, ¡qué hermosa se ve!'],
   [CMD, 'Para el acople final necesito dos calibraciones de trayectoria perfectas.'],
   [CAT, 'Dos cálculos y estaré en casa. ¡Vamos con todo!']],
];

const sheets = {};
const sfx = {};
const bgm = [];
const audio = { volume: 0.6, muted: false };
const cat = { cur: null, frame: 0, last: 0, loop: true, then: null };
let onAdvance = null;
let activeBg = 0;
let shownBg = -1;
let currentTrack = 1;

const ctx = $('cat').getContext('2d');

const loadImage = (src, retries = 3) => new Promise((res, rej) => {
  const img = new Image();
  img.onload = () => res(img);
  img.onerror = () => {
    if (retries > 0) setTimeout(() => loadImage(src, retries - 1).then(res, rej), 800);
    else rej(new Error(`No se pudo cargar ${src}`));
  };
  img.src = src;
});

const loadAudio = src => new Promise((res, rej) => {
  const a = new Audio();
  const ok = () => res(a);
  a.addEventListener('canplaythrough', ok, { once: true });
  a.addEventListener('loadeddata', ok, { once: true });
  a.addEventListener('error', () => rej(new Error(`No se pudo cargar ${src}`)), { once: true });
  // iOS no carga audio hasta el primer toque y nunca dispara los eventos de arriba.
  setTimeout(ok, 3000);
  a.preload = 'auto';
  a.src = src;
});

async function preload() {
  const tasks = [];
  let done = 0;
  const track = p => {
    tasks.push(p);
    p.then(() => { $('loadFill').style.width = `${(++done / total) * 100}%`; });
    return p;
  };
  const total = Object.keys(SHEETS).length + BGS.length + 1 + PORTRAITS.length + MUSIC.length + Object.keys(SFX_FILES).length;

  for (const [name, { src, frames }] of Object.entries(SHEETS)) {
    track(loadImage(src).then(img => {
      if (img.naturalWidth % FRAME || img.naturalHeight % FRAME) {
        throw new Error(`El spritesheet ${src} no es múltiplo de ${FRAME}px`);
      }
      sheets[name] = { img, cols: img.naturalWidth / FRAME, frames };
    }));
  }
  BGS.forEach(src => track(loadImage(src)));
  track(loadImage(MENU_BG));
  PORTRAITS.forEach(src => track(loadImage(src)));
  MUSIC.forEach((src, i) => track(loadAudio(src).then(a => { a.loop = true; bgm[i] = a; })));
  for (const [key, file] of Object.entries(SFX_FILES)) {
    track(loadAudio(`./assets/sfx/${file}.wav`).then(a => { sfx[key] = a; }));
  }
  await Promise.all(tasks);
}

const applyVolume = () => {
  bgm.forEach(a => { a.volume = audio.volume * 0.4; a.muted = audio.muted; });
  $('muteBtn').textContent = audio.muted || audio.volume === 0 ? '🔇' : '🔊';
};

const playSfx = (key, vol = 1) => {
  if (audio.muted) return;
  const a = sfx[key].cloneNode();
  a.volume = Math.min(1, audio.volume * vol);
  a.play().catch(() => {});
};

const setMusic = i => {
  currentTrack = i;
  bgm.forEach((a, n) => { if (n !== i) a.pause(); });
  if (bgm[i].paused) bgm[i].play().catch(() => {});
};

function playAnim(name, loop = true, then = null) {
  cat.cur = sheets[name];
  cat.frame = 0;
  cat.loop = loop;
  cat.then = then;
}

function tick(t) {
  requestAnimationFrame(tick);
  if (!cat.cur || t - cat.last < 1000 / FPS) return;
  cat.last = t;
  const { img, cols, frames } = cat.cur;
  ctx.clearRect(0, 0, FRAME, FRAME);
  ctx.drawImage(img, (cat.frame % cols) * FRAME, Math.floor(cat.frame / cols) * FRAME, FRAME, FRAME, 0, 0, FRAME, FRAME);
  if (++cat.frame < frames) return;
  if (cat.loop) cat.frame = 0;
  else cat.then?.();
}

const showScreen = id => {
  document.querySelectorAll('.screen').forEach(s => { s.hidden = s.id !== id; });
  $('cat').hidden = id === 'dialog';
  $('cat').classList.toggle('center', id === 'end' || id === 'title');
};

function setBackground(i) {
  if (i === shownBg) return;
  shownBg = i;
  const next = $(activeBg ? 'bgA' : 'bgB');
  const prev = $(activeBg ? 'bgB' : 'bgA');
  next.style.backgroundImage = `url("${BGS[i]}")`;
  next.classList.add('on');
  prev.classList.remove('on');
  activeBg = 1 - activeBg;
}

const renderMath = el => window.renderMathInElement?.(el, { delimiters: [{ left: '$', right: '$', display: false }] });

function updateHud(level, fails) {
  $('hudLevel').textContent = `Sector ${level + 1} / ${BGS.length}`;
  $('hudLives').innerHTML = Array.from({ length: MAX_FAILS }, (_, i) => `<span class="${i < fails ? 'lost' : ''}">${i < fails ? '♡' : '♥︎'}</span>`).join('');
}

function typeLine(text) {
  return new Promise(res => {
    let i = 0;
    $('dialogText').textContent = '';
    const finish = () => {
      clearInterval(timer);
      $('dialogText').textContent = text;
      onAdvance = null;
      res();
    };
    const timer = setInterval(() => {
      $('dialogText').textContent = text.slice(0, ++i);
      if (i % 3 === 0) playSfx('blip', 0.4);
      if (i >= text.length) finish();
    }, 28);
    onAdvance = finish;
  });
}

const waitAdvance = () => new Promise(res => { onAdvance = () => { onAdvance = null; res(); }; });

async function runDialog(lines) {
  showScreen('dialog');
  for (const [who, text] of lines) {
    const isCat = who === CAT;
    $('portCat').className = `portrait ${isCat ? 'active' : 'idle'}`;
    $('portCmd').className = `portrait ${isCat ? 'idle' : 'active'}`;
    $('dialogName').textContent = who;
    await typeLine(text);
    await waitAdvance();
  }
}

function askQuestion(q, onWrong) {
  return new Promise(res => {
    showScreen('quiz');
    playAnim('idle');
    $('quizTag').textContent = q.tag;
    $('quizText').textContent = q.q;
    $('quizFig').innerHTML = q.fig ? q.fig() : '';
    $('quizFb').hidden = true;
    $('nextBtn').hidden = true;
    const opts = $('quizOpts');
    opts.innerHTML = '';
    let wrongs = 0;
    q.o.forEach((text, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'opt';
      b.textContent = `${'abcd'[i]}) ${text}`;
      b.onclick = () => answer(i);
      opts.append(b);
    });
    renderMath($('quiz'));

    function showFeedback(text, withCommander) {
      const fb = $('quizFb');
      const span = document.createElement('span');
      span.textContent = text;
      if (withCommander) {
        const img = document.createElement('img');
        img.src = PORTRAITS[1];
        img.alt = CMD;
        fb.replaceChildren(img, span);
      } else {
        fb.replaceChildren(span);
      }
      fb.hidden = false;
    }

    function answer(i) {
      const buttons = [...opts.children];
      if (i !== q.c) {
        wrongs++;
        buttons[i].disabled = true;
        buttons[i].classList.add('wrong');
        playSfx('wrong');
        playAnim('hit', false, () => playAnim('idle'));
        if (onWrong()) {
          buttons.forEach(b => { b.disabled = true; });
          setTimeout(() => res(null), 1500);
        } else {
          showFeedback(`${CMD}: Esa respuesta es incorrecta. ¡Inténtalo de nuevo!`, true);
        }
        return;
      }
      buttons.forEach(b => { b.disabled = true; });
      buttons[i].classList.add('right');
      playSfx('correct');
      showFeedback(`¡Correcto! ${q.fb ?? ''}`, false);
      playAnim('joy');
      const next = $('nextBtn');
      next.disabled = true;
      next.hidden = false;
      setTimeout(() => { next.disabled = false; }, 1800);
      next.onclick = () => { playSfx('click'); res(wrongs === 0); };
    }
  });
}

async function sectorJump(next, fails) {
  const c = $('cat');
  playSfx('levelUp');
  showScreen('transit');
  $('transitPanel').hidden = true;
  playAnim('jump');
  c.classList.add('fly');
  await sleep(1100);
  setBackground(next);
  updateHud(next, fails);
  c.style.transition = 'none';
  c.classList.remove('fly');
  c.style.opacity = 0;
  c.offsetWidth;
  c.style.transition = '';
  c.style.opacity = 1;
  playAnim('joy');
  $('transitText').textContent = `¡Sector ${next} superado! Michi-7 llegó al Sector ${next + 1}.`;
  $('transitPanel').hidden = false;
  await new Promise(res => { $('transitBtn').onclick = () => { playSfx('click'); res(); }; });
}

function buildQuestions() {
  const t = shuffle([...theory]);
  const f = shuffle([...formulas]);
  return [0, 1, 2, 3, 4].map(i => [t[i], f[i]]).concat([[f[5], f[6]]]);
}

function endGame(won, fails, firstTry) {
  $('hud').hidden = true;
  showScreen('end');
  $('endTitle').textContent = won
    ? '¡Michi-7 llegó a la nave nodriza! El Comandante Felino celebra la misión cumplida.'
    : 'Oh no, el gato espacial no logró reparar su mochila propulsora, ahora deberá esperar su rescate, ¿Quieres intentarlo de nuevo?';
  $('endText').textContent = won ? `Resolviste ${firstTry} de 12 preguntas al primer intento, con ${fails} fallo(s).` : '';
  $('endScore').textContent = won ? `Puntaje final: ${firstTry * 100 + (MAX_FAILS - fails) * 50}` : '';
  $('restartBtn').textContent = won ? 'Jugar de nuevo' : 'Intentar de nuevo';
  playSfx(won ? 'victory' : 'gameOver');
  playAnim(won ? 'joy' : 'hit', won, won ? null : () => playAnim('idle'));
}

async function runGame() {
  const levels = buildQuestions();
  let fails = 0;
  let firstTry = 0;
  $('hud').hidden = false;
  for (let lv = 0; lv < levels.length; lv++) {
    updateHud(lv, fails);
    setBackground(lv);
    setMusic(lv < 3 ? 1 : 0);
    await runDialog(DIALOGS[lv]);
    for (const q of levels[lv]) {
      updateHud(lv, fails);
      const result = await askQuestion(q, () => {
        updateHud(lv, ++fails);
        return fails >= MAX_FAILS;
      });
      if (result === null) return endGame(false, fails, firstTry);
      if (result) firstTry++;
    }
    if (lv < levels.length - 1) await sectorJump(lv + 1, fails);
  }
  endGame(true, fails, firstTry);
}

document.addEventListener('click', e => {
  if (e.target.closest('button')) return;
  onAdvance?.();
});
document.addEventListener('keydown', e => {
  if (e.code === 'Space' || e.code === 'Enter') {
    if (e.target.closest?.('button')) return;
    e.preventDefault();
    onAdvance?.();
  }
});
$('volume').addEventListener('input', e => { audio.volume = +e.target.value; audio.muted = false; applyVolume(); });
$('muteBtn').addEventListener('click', () => { audio.muted = !audio.muted; applyVolume(); });
$('startBtn').addEventListener('click', () => { playSfx('click'); runGame(); });
document.addEventListener('pointerdown', () => setMusic(currentTrack), { once: true });
$('restartBtn').addEventListener('click', () => { playSfx('click'); runGame(); });

requestAnimationFrame(tick);
preload().then(() => {
  applyVolume();
  playAnim('run');
  showScreen('title');
  setMusic(1);
  $('loadMsg').hidden = true;
  document.querySelector('.loadbar').hidden = true;
  $('startBtn').disabled = false;
}).catch(err => {
  $('loadMsg').textContent = `Error de carga: ${err.message}`;
});
