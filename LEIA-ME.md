# Leitor QR de Produção — App para celular

Aplicativo que lê o QR Code de uma caixa pela **câmera do celular**, **mostra na tela**
o que está no código (referência, tipo de produto, quantidade por caixa, sequência, lote)
e **envia o código para a planilha do PC** usando o mesmo canal do AndroCode (Wi-Fi).

A diferença para o AndroCode atual: aqui o operador **vê as informações da caixa no
celular** antes de mandar para o Excel.

## Como o envio funciona (descoberto analisando o AndroCode)

O receptor do AndroCode no PC (WiFiKey.exe) é um servidor TCP:
- escuta na porta **5831** (padrão, configurável no próprio AndroCode);
- recebe o texto do código em **UTF-8 puro**, sem senha nem formato especial;
- **digita** esse texto no campo que estiver com foco no Excel, com Enter no fim.

Nosso app só precisa **abrir uma conexão TCP no IP do PC, porta 5831, e enviar o texto**.
Para o PC, é idêntico ao AndroCode — **nada muda no computador da empresa**.

## Arquivos

```
app/
  index.html     -> a tela do app (câmera, dados da caixa, botão enviar, histórico)
  app.js         -> lógica: leitura, exibição, envio TCP, feedback sonoro/vibração
  produtos.js    -> tabela de produtos (da aba QTD) + decodificador do QR
tools/
  receptor_teste.py  -> simulador do receptor AndroCode, para testar em casa
```

## Estado atual (o que já está pronto e testado)

- [x] Protocolo do AndroCode decifrado e validado (envio TCP testado de ponta a ponta).
- [x] Decodificação do QR (referência → tipo de produto → qtd/caixa), testada com os
      códigos reais da planilha (171, 971, 924XS, 3958, 3963 vs 963 etc.).
- [x] Tela do app com câmera, exibição dos dados, histórico, bipe e vibração.
- [x] Função de envio TCP pronta (usa plugin nativo quando empacotado como APK).

## Empacotamento como APK (Capacitor) — build na nuvem

Um site comum no navegador **não pode** abrir conexão TCP crua (o navegador bloqueia).
Por isso o app é empacotado num **APK Android** com Capacitor + o plugin
`capacitor-tcp-socket`. O APK é instalado **só no celular do operador** — nada no PC.
O código HTML/CSS/JS continua o mesmo dentro do APK; só ganha a "ponte" de rede.

O APK é gerado **na nuvem pelo GitHub Actions** (sem instalar Android Studio aqui):
`.github/workflows/build-apk.yml`, `package.json` e `capacitor.config.json` já estão prontos.

### Passos para gerar o APK (uma vez)

1. Criar uma conta gratuita no GitHub (github.com), se ainda não tiver.
2. Criar um repositório novo (pode ser **privado**).
3. Enviar esta pasta para o repositório. No PowerShell, dentro de `C:\PROJETO_CLEITON`:
   ```
   git init
   git add .
   git commit -m "Leitor QR - app de producao"
   git branch -M main
   git remote add origin https://github.com/SEU-USUARIO/SEU-REPO.git
   git push -u origin main
   ```
4. No GitHub, aba **Actions** → o build "Gerar APK" roda sozinho. Em ~5 min termina.
5. Abra o build concluído → seção **Artifacts** → baixe **LeitorQR-apk** (é o `app-debug.apk`).
6. Passe o APK para o celular e instale (permitir "fontes desconhecidas" na 1ª vez).

> Observação: a pasta `android/` é criada automaticamente na nuvem (está no `.gitignore`).
> Para rodar de novo o build sem alterar código, use o botão **Run workflow** na aba Actions.

## Como testar a leitura agora (sem APK, só a parte visual)

1. No PC, dentro de `app/`, suba um servidor local:
   `python -m http.server 8000`
2. No **celular** (mesma rede Wi-Fi), abra no Chrome: `http://IP-DO-PC:8000`
   (a câmera só funciona em `https` ou `localhost`; para teste de câmera no celular,
    o caminho definitivo é o APK, que não tem essa restrição).
3. A leitura e a exibição dos dados já funcionam; o envio TCP só funciona no APK.

## Como testar o envio em casa (simulando o PC da empresa)

1. No PC, rode o receptor de teste: `python tools/receptor_teste.py`
2. No app, configure o IP deste PC e porta 5831.
3. Ao enviar uma leitura, o código aparece no terminal do receptor de teste —
   provando que chegaria na planilha do mesmo jeito.

## Na empresa (implantação)

- Instalar o APK no celular do operador.
- Configurar no app o **mesmo IP e porta** que o AndroCode já usa hoje.
- O AndroCode receptor continua rodando no PC como está. Pronto.
