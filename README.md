# Mão Certa — site

Site de uma página da Mão Certa (obras de A a Z, com sede em Ovar). Domínio: https://maocerta.pt

## Como ver e publicar

```bash
npm install
npm run dev      # ver no computador, em http://localhost:5173
npm run build    # gera a pasta dist/, que é o que se publica
```

- Comando de build: `npm run build`
- Pasta a publicar: `dist`
- Node 20 ou mais recente

## O que há aqui

- `index.html` — todo o texto do site.
- `src/style.css` — o aspeto. `src/main.js` — o scroll da casa, o menu, a galeria e o formulário.
- `src/obras.json` — legendas e número de fotos de cada obra.
- `public/film/` — os frames da casa a abrir (`d` computador, `m` telemóvel).
- `public/obras/` — capa de cada obra (`NN.webp`) e as fotos todas (`NN/1.webp` …).
- `public/img/` — logótipos e fotos de antes/depois do telhado.

O formulário não usa servidor: abre o WhatsApp ou o email do visitante com a mensagem já escrita.
