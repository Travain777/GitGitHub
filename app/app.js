// ===================================================================
// Leitor QR - Producao
// Le QR pela camera, mostra os dados na tela e envia o codigo para o
// receptor AndroCode (WiFiKey) no PC via TCP -> cai na planilha Excel.
//
// Protocolo do receptor AndroCode (decifrado do WiFiKey.exe):
//   - socket TCP escutando em 0.0.0.0, porta padrao 5831
//   - envia-se o texto do codigo em bytes UTF-8 puros
//   - o receptor digita o texto no campo com foco + Enter
//   Nao ha handshake nem autenticacao.
// ===================================================================

const cfg = {
  ip: localStorage.getItem("pc_ip") || "",
  porta: parseInt(localStorage.getItem("pc_porta") || "5831", 10),
  auto: localStorage.getItem("pc_auto") === "1"
};

let ultimaLeitura = null;     // resultado decodificado atual
let ultimoCodigoBruto = "";   // para evitar bipe duplicado em sequencia
let ultimoMomento = 0;
const historico = [];

// ---------- elementos ----------
const el = (id) => document.getElementById(id);
const cartao = el("cartaoResultado");

// ---------- camera / leitura ----------
const leitorQR = new Html5Qrcode("leitor");
function iniciarCamera() {
  Html5Qrcode.getCameras().then(cams => {
    if (!cams || cams.length === 0) { mostrarErro("Nenhuma câmera encontrada"); return; }
    // prefere a camera traseira
    const tras = cams.find(c => /back|trase|rear|environment/i.test(c.label)) || cams[cams.length - 1];
    leitorQR.start(
      tras.id,
      { fps: 10, qrbox: { width: 250, height: 250 } },
      aoLerQR,
      () => {} // ignora frames sem QR
    ).catch(e => mostrarErro("Erro ao abrir câmera: " + e));
  }).catch(e => mostrarErro("Sem acesso à câmera: " + e));
}

function aoLerQR(texto) {
  const agora = Date.now();
  // anti-duplicidade: mesmo codigo em menos de 2,5s = ignora
  if (texto === ultimoCodigoBruto && (agora - ultimoMomento) < 2500) return;
  ultimoCodigoBruto = texto;
  ultimoMomento = agora;

  const dados = window.decodificarQR(texto);
  ultimaLeitura = dados;
  mostrarResultado(dados);
  bipar();
  vibrar(80);

  if (cfg.auto && cfg.ip) enviarParaPC();
}

// ---------- exibicao ----------
function mostrarResultado(d) {
  const achou = !!d.tipo;
  cartao.className = "cartao " + (achou ? "ok" : "erro");
  el("vStatus").textContent = achou ? "PRODUTO IDENTIFICADO" : "PRODUTO NÃO RECONHECIDO";
  el("vRef").textContent = d.referencia || "—";
  el("vTipo").textContent = d.tipo || "(código não está na tabela)";
  el("vQtd").textContent = d.qtd != null ? d.qtd : "—";
  el("vSeq").textContent = d.sequencia || "—";
  el("vLote").textContent = d.lote || "—";
  el("vBruto").textContent = "Código lido: " + d.bruto;
  el("btnEnviar").disabled = !cfg.ip;
}

function mostrarErro(msg) {
  cartao.className = "cartao erro";
  el("vStatus").textContent = msg;
}

// ---------- envio TCP para o PC ----------
// Usa o plugin nativo (Capacitor/Cordova) quando empacotado como APK.
// No navegador comum o TCP cru nao existe -> avisa o usuario.
async function enviarParaPC() {
  if (!ultimaLeitura) return;
  if (!cfg.ip) { abrirConfig(); return; }

  const texto = ultimaLeitura.bruto; // envia o codigo exatamente como lido
  el("btnEnviar").disabled = true;
  try {
    await enviarTCP(cfg.ip, cfg.porta, texto);
    registrarHistorico(ultimaLeitura, true);
    el("vStatus").textContent = "✓ ENVIADO PARA A PLANILHA";
    bipar(); bipar();
    vibrar([60, 40, 60]);
  } catch (e) {
    registrarHistorico(ultimaLeitura, false);
    el("vStatus").textContent = "✗ FALHA AO ENVIAR: " + e.message;
    cartao.className = "cartao erro";
    vibrar([200]);
  } finally {
    el("btnEnviar").disabled = !cfg.ip;
  }
}

// Abstracao do envio TCP. Implementacao real depende do empacotamento:
//  - Capacitor: plugin de socket TCP
//  - Navegador: nao suportado (raw TCP bloqueado) -> erro explicativo
async function enviarTCP(ip, porta, texto) {
  // No APK (Capacitor) o plugin nativo "capacitor-tcp-socket" fica exposto
  // em window.Capacitor.Plugins.TcpSocket. Abre, envia UTF-8 e fecha.
  const plugin = window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.TcpSocket;
  if (plugin) {
    const conn = await plugin.connect({ ipAddress: ip, port: porta });
    const client = (conn && conn.client !== undefined) ? conn.client : conn;
    try {
      await plugin.send({ client, data: texto }); // encoding UTF8 por padrao
    } finally {
      try { await plugin.disconnect({ client }); } catch (e) {}
    }
    return;
  }
  throw new Error("TCP indisponível no navegador — use o app instalado (APK)");
}

// ---------- historico ----------
function registrarHistorico(d, enviado) {
  historico.unshift({ ref: d.referencia, tipo: d.tipo, seq: d.sequencia, enviado, hora: new Date() });
  if (historico.length > 20) historico.pop();
  const lista = el("listaHistorico");
  lista.innerHTML = "";
  for (const h of historico) {
    const div = document.createElement("div");
    div.className = "hist-item";
    const hh = h.hora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    div.innerHTML = `<span>${hh} · ${h.ref || "?"} ${h.seq ? "(" + h.seq + ")" : ""}</span>` +
                    `<span class="${h.enviado ? "env-ok" : "env-no"}">${h.enviado ? "✓ enviado" : "não enviado"}</span>`;
    lista.appendChild(div);
  }
}

// ---------- feedback ----------
let audioCtx = null;
function bipar() {
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    const o = audioCtx.createOscillator(); const g = audioCtx.createGain();
    o.frequency.value = 880; o.connect(g); g.connect(audioCtx.destination);
    g.gain.setValueAtTime(0.2, audioCtx.currentTime);
    o.start(); o.stop(audioCtx.currentTime + 0.12);
  } catch (e) {}
}
function vibrar(p) { if (navigator.vibrate) navigator.vibrate(p); }

// ---------- configuracao ----------
function atualizarEstadoConexao() {
  el("estadoConexao").textContent = cfg.ip ? `PC: ${cfg.ip}:${cfg.porta}` : "PC: não configurado";
  el("btnEnviar").disabled = !cfg.ip || !ultimaLeitura;
}
function abrirConfig() {
  el("inpIP").value = cfg.ip;
  el("inpPorta").value = cfg.porta;
  el("inpAutoEnviar").checked = cfg.auto;
  el("dlgConfig").showModal();
}
function salvarConfig() {
  cfg.ip = el("inpIP").value.trim();
  cfg.porta = parseInt(el("inpPorta").value, 10) || 5831;
  cfg.auto = el("inpAutoEnviar").checked;
  localStorage.setItem("pc_ip", cfg.ip);
  localStorage.setItem("pc_porta", cfg.porta);
  localStorage.setItem("pc_auto", cfg.auto ? "1" : "0");
  el("dlgConfig").close();
  atualizarEstadoConexao();
}

// ---------- eventos ----------
el("btnEnviar").addEventListener("click", enviarParaPC);
el("btnConfig").addEventListener("click", abrirConfig);
el("btnSalvarConfig").addEventListener("click", salvarConfig);

atualizarEstadoConexao();
iniciarCamera();
