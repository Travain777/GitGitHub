// Tabela de produtos extraida da aba "QTD" do LeitorQR.xlsm
// Cada item: codigo inicial (prefixo do QR) -> tipo de produto + quantidade por caixa (Mobil)
// Fonte: planilha QTD (colunas Cod inicial / Tipo de produto / Quantidade Mobil)
window.TABELA_PRODUTOS = [
  { cod: "698X",  tipo: "Perfil Macho",  qtd: 950 },
  { cod: "924X",  tipo: "Perfil Fêmea",  qtd: 420 },
  { cod: "557X",  tipo: "Perfil Macho",  qtd: 950 },
  { cod: "123X",  tipo: "Perfil Fêmea",  qtd: 510 },
  { cod: "969X",  tipo: "Perfil Macho",  qtd: 950 },
  { cod: "971X",  tipo: "Perfil Fêmea",  qtd: 478 },
  { cod: "838X",  tipo: "Perfil Fêmea",  qtd: 478 },
  { cod: "171",   tipo: "Blank Macho",   qtd: 3800 },
  { cod: "404",   tipo: "Blank Fêmea",   qtd: 2200 },
  { cod: "168",   tipo: "Blank Macho",   qtd: 3800 },
  { cod: "395",   tipo: "Blank Fêmea",   qtd: 2200 },
  { cod: "175",   tipo: "Blank Macho",   qtd: 3800 },
  { cod: "398",   tipo: "Blank Fêmea",   qtd: 2200 }, // atencao: 398 tem tratamento especial no VBA (duas referencias)
  { cod: "3963",  tipo: "Blank Fêmea",   qtd: 2200 },
  { cod: "3958",  tipo: "Blank Macho",   qtd: 3800 },
  { cod: "3568",  tipo: "Blank Macho",   qtd: 3800 },
  { cod: "698XS", tipo: "Perfil Macho",  qtd: 950 },
  { cod: "924XS", tipo: "Perfil Fêmea",  qtd: 420 },
  { cod: "557XS", tipo: "Perfil Macho",  qtd: 950 },
  { cod: "123XS", tipo: "Perfil Fêmea",  qtd: 510 },
  { cod: "969XS", tipo: "Perfil Macho",  qtd: 950 },
  { cod: "971XS", tipo: "Perfil Fêmea",  qtd: 478 },
  { cod: "838XS", tipo: "Perfil Fêmea",  qtd: 478 },
  { cod: "958XS", tipo: "Perfil Macho",  qtd: 950 },
  { cod: "568XS", tipo: "Perfil Macho",  qtd: 950 },
  { cod: "963XS", tipo: "Perfil Fêmea",  qtd: 500 }
];

// Decodifica o conteudo bruto de um QR Code da producao.
// Formatos observados na planilha:
//   "171AMI63|SEQ:00001"      -> referencia 171..., sequencia 00001
//   "B971EMI61|SEQ:00003"     -> prefixo B + 971..., sequencia 00003
//   "LOTE:    CONFORMAÇÃO|SEQ:00002"
// Retorna { referencia, tipo, qtd, sequencia, lote, bruto }
window.decodificarQR = function (texto) {
  const bruto = (texto || "").trim();
  const resultado = {
    bruto,
    referencia: "",
    tipo: "",
    qtd: null,
    sequencia: "",
    lote: ""
  };

  // separa por "|" -> parte da esquerda = referencia/lote, demais = SEQ:, LOTE: etc.
  const partes = bruto.split("|");
  const esquerda = partes[0] ? partes[0].trim() : "";

  for (const p of partes) {
    const t = p.trim();
    const mSeq = t.match(/SEQ\s*:\s*(\S+)/i);
    if (mSeq) resultado.sequencia = mSeq[1];
    const mLote = t.match(/LOTE\s*:\s*(.+)/i);
    if (mLote) resultado.lote = mLote[1].trim();
  }

  // referencia = parte da esquerda sem rotulo LOTE:
  resultado.referencia = esquerda.replace(/^LOTE\s*:\s*/i, "").trim();

  // O QR traz o codigo em digitos (ex.: "B971EMI61" -> "971"), enquanto a
  // tabela usa o codigo com sufixo (ex.: "971X"). Casamos pela sequencia de
  // digitos inicial: pega os digitos no inicio da referencia (apos uma letra
  // opcional) e compara com os digitos iniciais de cada codigo da tabela.
  // Verificado: nao ha colisao de digitos entre Perfis e Blanks, e variantes
  // X / XS do mesmo numero tem sempre o mesmo tipo e quantidade.
  const digitos = (s) => { const m = (s || "").match(/\d+/); return m ? m[0] : ""; };
  const alvo = digitos(resultado.referencia.replace(/^[A-Za-z]/, ""));
  let melhor = null;
  if (alvo) {
    for (const prod of window.TABELA_PRODUTOS) {
      const codDig = digitos(prod.cod);
      if (alvo === codDig) {            // casa exato primeiro (ex.: 3963 != 963)
        melhor = prod; break;
      }
      if (!melhor && alvo.startsWith(codDig) && codDig.length >= 3) {
        melhor = prod;                  // fallback por prefixo de >=3 digitos
      }
    }
  }
  if (melhor) {
    resultado.tipo = melhor.tipo;
    resultado.qtd = melhor.qtd;
  }

  return resultado;
};
