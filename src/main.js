import '@fontsource/poppins/latin-400.css';
import '@fontsource/poppins/latin-600.css';
import '@fontsource/poppins/latin-800.css';
import './style.css';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';
import obras from './obras.json';

gsap.registerPlugin(ScrollTrigger);
const BASE = import.meta.env.BASE_URL; // '/' no domínio próprio; '/maocerta-site/' no endereço do GitHub
const reduz = matchMedia('(prefers-reduced-motion: reduce)').matches;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const topo = $('#topo');
const barra = $('#barra-movel');
$('#ano').textContent = new Date().getFullYear();

/* ---------- Scroll suave ---------- */
let lenis = null;
if (!reduz) {
  lenis = new Lenis({ duration: 1.1 });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
function irPara(alvo, offset) {
  const o = offset ?? -(topo.offsetHeight + 14);
  if (lenis) lenis.scrollTo(alvo, { offset: o });
  else scrollTo({ top: alvo.getBoundingClientRect().top + scrollY + o });
}
let travas = 0;
function travarScroll(sim) {
  travas = Math.max(0, travas + (sim ? 1 : -1));
  const travado = travas > 0;
  if (lenis) travado ? lenis.stop() : lenis.start();
  document.documentElement.classList.toggle('travado', travado);
}

/* ---------- Menu do telemóvel ---------- */
const menuBtn = $('#menu-btn');
const menuMovel = $('#menu-movel');
function abrirMenu() {
  if (!menuMovel.hidden) return;
  menuMovel.hidden = false;
  menuBtn.setAttribute('aria-expanded', 'true');
  menuBtn.setAttribute('aria-label', 'Fechar menu');
  document.body.classList.add('menu-aberto');
  travarScroll(true);
}
function fecharMenu() {
  if (menuMovel.hidden) return;
  menuMovel.hidden = true;
  menuBtn.setAttribute('aria-expanded', 'false');
  menuBtn.setAttribute('aria-label', 'Abrir menu');
  document.body.classList.remove('menu-aberto');
  travarScroll(false);
}
menuBtn.addEventListener('click', () => (menuMovel.hidden ? abrirMenu() : fecharMenu()));
addEventListener('keydown', (e) => e.key === 'Escape' && fecharMenu());

/* ---------- Barra fixa do telemóvel: sai quando o formulário está à vista ---------- */
new IntersectionObserver(([e]) => barra.classList.toggle('escondida', e.isIntersecting), { rootMargin: '0px 0px -25% 0px' }).observe($('#orcamento'));

/* ---------- Ligações internas ---------- */
const formOrc = $('#form-orc');
function escolherTipo(tipo) {
  const op = [...formOrc.tipo.options].find((o) => o.text === tipo);
  if (op) formOrc.tipo.value = op.value;
}
function realcar(el) {
  el.classList.remove('realce');
  void el.offsetWidth; // recomeça a animação
  el.classList.add('realce');
  setTimeout(() => el.classList.remove('realce'), 2200);
}
document.addEventListener('click', (e) => {
  const a = e.target.closest('a[href^="#"]');
  if (!a) return;
  const id = a.getAttribute('href');
  const alvo = id.length > 1 && $(id);
  if (!alvo) return;
  e.preventDefault();
  fecharMenu();
  if (a.dataset.tipo) escolherTipo(a.dataset.tipo);
  const ir = () => {
    if (a.classList.contains('etq')) {
      // etiqueta da casa: leva ao serviço e realça-o
      irPara(alvo, -Math.round(innerHeight * 0.3));
      setTimeout(() => realcar(alvo), reduz ? 0 : 700);
    } else {
      irPara(alvo, id === '#inicio' ? 0 : undefined);
    }
  };
  if (visor.open) {
    // o scroll só volta a funcionar depois de o visor fechar
    visor.addEventListener('close', ir, { once: true });
    visor.close();
  } else {
    ir();
  }
});

/* ---------- Hero: a casa que abre ---------- */
const TOTAIS = { d: 61, m: 121 }; // no telemóvel há o dobro dos frames, para o movimento ficar fluido
let TOTAL = TOTAIS[innerWidth >= 900 ? 'd' : 'm'];
const FIM_FILME = 0.6; // o filme acaba aqui; o resto do scroll mostra as especialidades
const canvas = $('.filme');
const ctx = canvas.getContext('2d');
const caixaEtq = $('.etiquetas');
const etqs = $$('.etq');
const pasta = () => (innerWidth >= 900 ? 'd' : 'm');
let frames = [];
let pastaAtual = '';
let frameAtual = reduz ? TOTAL - 1 : 0;
let rect = { x: 0, y: 0, w: 0, h: 0 };

function carregar() {
  const p = pasta();
  if (p === pastaAtual) return;
  const antes = TOTAL;
  pastaAtual = p;
  TOTAL = TOTAIS[p];
  frameAtual = reduz ? TOTAL - 1 : Math.round((frameAtual / (antes - 1)) * (TOTAL - 1));
  frames = new Array(TOTAL);
  // primeiro e último, depois uma passagem larga (de 4 em 4), depois o resto
  const meio = Array.from({ length: TOTAL - 2 }, (_, i) => i + 1);
  const ordem = reduz ? [TOTAL - 1] : [0, TOTAL - 1, ...meio.filter((i) => i % 4 === 0), ...meio.filter((i) => i % 4 !== 0)];
  ordem.forEach((i) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      if (p !== pastaAtual) return;
      frames[i] = img;
      if (i <= frameAtual || !frames[frameAtual]) desenhar();
    };
    img.src = `${BASE}film/${p}/${String(i + 1).padStart(3, '0')}.webp`;
  });
}

function medir() {
  const w = innerWidth;
  const h = canvas.parentElement.clientHeight;
  const dpr = Math.min(devicePixelRatio || 1, w >= 900 ? 2 : 3);
  canvas.width = Math.round(w * dpr);
  canvas.height = Math.round(h * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const cima = topo.offsetHeight;
  if (w >= 900) {
    // casa à direita (sai um pouco do ecrã), texto à esquerda, faixa de trunfos em baixo
    const baixo = $('.trunfos').offsetHeight;
    const iw = Math.min(w * 0.7, (h - cima - baixo - 20) * (16 / 9));
    const ih = iw * (9 / 16);
    rect = { w: iw, h: ih, x: w - iw * 0.95, y: cima + (h - cima - baixo - ih) / 2 };
  } else {
    // telemóvel: texto em cima, casa no espaço livre entre o texto e a barra fixa
    const caixa = $('.hero-texto');
    const alturaTxt = Math.max(...$$('.fase', caixa).map((f) => f.offsetHeight));
    const cimaTxt = caixa.offsetTop + alturaTxt + 12;
    const baixo = barra.offsetHeight + 14;
    const livre = Math.max(h - cimaTxt - baixo, h * 0.28);
    const iw = Math.min(w * 1.12, (livre * 16) / 9);
    const ih = iw * (9 / 16);
    rect = { w: iw, h: ih, x: (w - iw) / 2, y: Math.min(cimaTxt + (livre - ih) / 2, h - ih - baixo) };
  }
  Object.assign(caixaEtq.style, { left: rect.x + 'px', top: rect.y + 'px', width: rect.w + 'px', height: rect.h + 'px' });
  etqs.forEach((e) => {
    // mantém cada etiqueta dentro do ecrã
    const meia = e.offsetWidth / 2 + 6;
    const px = Math.min(Math.max(rect.x + (rect.w * e.dataset.x) / 100, meia), w - meia);
    e.style.left = px - rect.x + 'px';
    e.style.top = e.dataset.y + '%';
  });
  desenhar();
}

function desenhar() {
  let img = frames[frameAtual];
  if (!img) {
    // enquanto o frame certo não chega, usa o último já carregado ANTES dele (nunca um mais à frente:
    // a câmara aproxima-se ao longo do filme e alternar entre frames de trás e da frente faz a casa crescer e encolher)
    for (let i = frameAtual - 1; i >= 0 && !img; i--) img = frames[i];
    for (let i = frameAtual + 1; i < TOTAL && !img; i++) img = frames[i];
  }
  ctx.fillStyle = '#f0ebea';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (!img) return;
  const { x, y, w, h } = rect;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(img, x, y, w, h);
  // esbate as margens do vídeo para o fundo
  const fx = w * 0.1, fy = h * 0.12;
  const faixa = (x0, y0, x1, y1, rx, ry, rw, rh) => {
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, 'rgba(240,235,234,1)');
    g.addColorStop(1, 'rgba(240,235,234,0)');
    ctx.fillStyle = g;
    ctx.fillRect(rx, ry, rw, rh);
  };
  faixa(x, 0, x + fx, 0, x - 1, y - 1, fx, h + 2);
  faixa(x + w, 0, x + w - fx, 0, x + w - fx, y - 1, fx + 1, h + 2);
  faixa(0, y, 0, y + fy, x - 1, y - 1, w + 2, fy);
  faixa(0, y + h, 0, y + h - fy, x - 1, y + h - fy, w + 2, fy + 1);
}

carregar();
medir();
let larguraAnterior = innerWidth;
addEventListener('resize', () => {
  // no telemóvel a barra de endereço aparece e desaparece ao fazer scroll: isso muda a altura, não a largura, e não deve mexer na casa
  if (innerWidth === larguraAnterior && innerWidth < 900) return;
  larguraAnterior = innerWidth;
  if (innerWidth >= 900) fecharMenu();
  carregar();
  medir();
});
addEventListener('load', () => {
  medir();
  lenis?.resize();
  ScrollTrigger.refresh();
});
document.fonts?.ready.then(medir);

if (!reduz) {
  const tl = gsap.timeline({
    scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom bottom', scrub: innerWidth >= 900 ? true : 0.5 },
    defaults: { ease: 'none' },
  });
  const estado = { f: 0 };
  tl.to(estado, {
    f: 1,
    duration: FIM_FILME,
    onUpdate: () => {
      const n = Math.round(estado.f * (TOTAL - 1));
      if (n !== frameAtual) {
        frameAtual = n;
        desenhar();
      }
    },
  }, 0);
  tl.to('.dica', { autoAlpha: 0, duration: 0.04 }, 0.01);
  tl.to('.fase-1', { autoAlpha: 0, y: -30, duration: 0.05 }, 0.08);
  tl.fromTo('.fase-3', { autoAlpha: 0, y: 30 }, { autoAlpha: 1, y: 0, duration: 0.05 }, 0.13);
  tl.fromTo(etqs, { autoAlpha: 0, scale: 0.6 }, { autoAlpha: 1, scale: 1, duration: 0.05, stagger: 0.012, ease: 'back.out(2)' }, 0.6);
  tl.to({}, { duration: 0.02 }, 0.98);
}

/* ---------- Galeria ---------- */
const car = $('#carrossel');
const esc = (t) => t.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
car.innerHTML = obras
  .map(
    (o, i) => `<figure>
      <button type="button" class="obra-btn" data-i="${i}" aria-label="Ver as ${o.fotos} fotos desta obra: ${esc(o.texto)}">
        <img src="${BASE}obras/${o.n}.webp" alt="${esc(o.texto)}" loading="lazy" width="720" height="900" draggable="false" />
        <span class="obra-n">${o.fotos} fotos</span>
      </button>
      <figcaption>${esc(o.texto)}</figcaption>
    </figure>`
  )
  .join('');

// arrastar com o rato no computador (sem abrir a foto ao largar)
let arr = null;
let arrastou = false;
car.addEventListener('pointerdown', (e) => {
  if (e.pointerType !== 'mouse') return;
  arr = { x: e.clientX, s: car.scrollLeft };
  arrastou = false;
});
addEventListener('pointermove', (e) => {
  if (!arr) return;
  const dx = e.clientX - arr.x;
  if (Math.abs(dx) > 5 && !arrastou) {
    arrastou = true;
    car.style.scrollSnapType = 'none';
  }
  if (arrastou) car.scrollLeft = arr.s - dx;
});
addEventListener('pointerup', () => {
  if (!arr) return;
  arr = null;
  car.style.scrollSnapType = '';
});
car.addEventListener('dragstart', (e) => e.preventDefault());
car.addEventListener('click', (e) => {
  const b = e.target.closest('.obra-btn');
  if (!b) return;
  if (arrastou) {
    arrastou = false;
    return;
  }
  abrirVisor(+b.dataset.i);
});

// setas e barra de progresso
const carAnt = $('#car-ant');
const carSeg = $('#car-seg');
const carProg = $('#car-prog');
const passoCar = () => (car.querySelector('figure').offsetWidth + 20) * 2;
carAnt.addEventListener('click', () => car.scrollBy({ left: -passoCar(), behavior: reduz ? 'auto' : 'smooth' }));
carSeg.addEventListener('click', () => car.scrollBy({ left: passoCar(), behavior: reduz ? 'auto' : 'smooth' }));
function progresso() {
  const max = car.scrollWidth - car.clientWidth;
  const frac = Math.min(1, car.clientWidth / car.scrollWidth);
  const p = max > 0 ? car.scrollLeft / max : 0;
  carProg.style.width = frac * 100 + '%';
  carProg.style.marginLeft = p * (1 - frac) * 100 + '%';
  carAnt.disabled = car.scrollLeft < 4;
  carSeg.disabled = car.scrollLeft > max - 4;
}
car.addEventListener('scroll', progresso, { passive: true });
addEventListener('resize', progresso);
progresso();

/* ---------- Visor de fotos ---------- */
const visor = $('#visor');
const vImg = $('#visor-img');
const vPalco = $('#visor-palco');
let vObra = 0;
let vFoto = 1;
const fotoUrl = (o, k) => `${BASE}obras/${o.n}/${k}.webp`;
function mostrarFoto() {
  const o = obras[vObra];
  vImg.src = fotoUrl(o, vFoto);
  vImg.alt = `${o.texto} Foto ${vFoto} de ${o.fotos}.`;
  $('#visor-leg').textContent = o.texto;
  $('#visor-cont').textContent = `Foto ${vFoto} de ${o.fotos}`;
  if (o.fotos > 1) new Image().src = fotoUrl(o, (vFoto % o.fotos) + 1); // adianta a seguinte
}
function mudarFoto(d) {
  const n = obras[vObra].fotos;
  vFoto = ((vFoto - 1 + d + n) % n) + 1;
  mostrarFoto();
}
function abrirVisor(i) {
  vObra = i;
  vFoto = 1;
  mostrarFoto();
  visor.showModal();
  travarScroll(true);
}
visor.addEventListener('close', () => travarScroll(false));
$('#visor-fechar').addEventListener('click', () => visor.close());
$('#visor-ant').addEventListener('click', () => mudarFoto(-1));
$('#visor-seg').addEventListener('click', () => mudarFoto(1));
visor.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowLeft') mudarFoto(-1);
  if (e.key === 'ArrowRight') mudarFoto(1);
});
// clicar fora da foto fecha; deslizar o dedo muda de foto
let toque = null;
vPalco.addEventListener('pointerdown', (e) => (toque = { x: e.clientX, y: e.clientY }));
vPalco.addEventListener('pointerup', (e) => {
  if (!toque) return;
  const dx = e.clientX - toque.x;
  const dy = e.clientY - toque.y;
  toque = null;
  if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) mudarFoto(dx < 0 ? 1 : -1);
  else if (e.target === vPalco) visor.close();
});

/* ---------- Revelar secções ---------- */
if (!reduz) {
  const blocos = '.impacto .grande, .impacto .sub, .destaque-foto, .destaque-texto, .outros-cabeca, .servicos-lista li, .urgente, .obras-cabeca, .como h2, .passos li, .como-cta, .condominios, .faq h2, .faq-lista, .orc-texto, .form';
  gsap.utils.toArray(blocos).forEach((el) => {
    el.classList.add('revela');
    gsap.to(el, { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 90%', once: true }, onComplete: () => gsap.set(el, { clearProps: 'transform' }) });
  });
  gsap.to('.passos', { '--prog': 1, ease: 'none', scrollTrigger: { trigger: '.passos', start: 'top 75%', end: 'bottom 55%', scrub: true } });
}
$$('.faq-lista details').forEach((d) => d.addEventListener('toggle', () => { lenis?.resize(); ScrollTrigger.refresh(); }));

/* ---------- Pedido de orçamento → WhatsApp ou email ---------- */
formOrc.tel.addEventListener('input', () => formOrc.tel.setCustomValidity(''));
formOrc.addEventListener('submit', (e) => {
  e.preventDefault();
  const d = new FormData(formOrc);
  const porEmail = e.submitter?.value === 'email';
  const tel = (d.get('tel') || '').trim();
  if (porEmail && !tel) {
    formOrc.tel.setCustomValidity('Indique um telefone para o podermos contactar.');
    formOrc.tel.reportValidity();
    return;
  }
  const linhas = [`Nome: ${d.get('nome')}`, tel && `Telefone: ${tel}`, `Localidade: ${d.get('local')}`, `Tipo de obra: ${d.get('tipo')}`].filter(Boolean);
  const texto = `Olá Mão Certa! Gostava de pedir um orçamento.\n\n${linhas.join('\n')}\n\n${d.get('msg')}`;
  if (porEmail) {
    location.href = `mailto:suportemaocerta@gmail.com?subject=${encodeURIComponent('Pedido de orçamento — ' + d.get('tipo'))}&body=${encodeURIComponent(texto)}`;
  } else {
    window.open(`https://wa.me/351935523549?text=${encodeURIComponent(texto)}`, '_blank', 'noopener');
  }
});

window.__mc = { get lenis() { return lenis; } };
