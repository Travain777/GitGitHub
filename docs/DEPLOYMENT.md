# GUIA DE IMPLANTAÇÃO - PLC Mitsubishi Sistema

## 🏭 Cenário 1: Totalmente Local (RECOMENDADO para começar)

### O que você precisa:
- Computador na mesma rede do PLC (Windows/Linux/Mac)
- Node.js instalado
- PLC conectado à rede local

### Passo a Passo:

#### 1. Instalar Node.js
**Windows:**
- Baixe: https://nodejs.org (versão LTS)
- Execute o instalador
- Verifique: abra CMD e digite `node --version`

**Linux:**
```bash
sudo apt update
sudo apt install nodejs npm
```

#### 2. Baixar o Código do GitHub
```bash
# Clone o repositório
git clone https://github.com/Travain777/GitGitHub.git
cd GitGitHub
```

#### 3. Instalar Dependências do Backend
```bash
cd backend/nodejs
npm install
```

#### 4. Iniciar o Backend
```bash
npm start
```

Você verá:
```
===========================================
  PLC Mitsubishi Q06UDVCPU Backend Server
===========================================
HTTP Server: http://localhost:3000
WebSocket: ws://localhost:3000
===========================================
```

#### 5. Abrir o Frontend
- Abra o navegador
- Vá para: `file:///caminho/para/GitGitHub/frontend/index.html`
- Ou use servidor local:
  ```bash
  cd frontend
  python -m http.server 8080
  # Abra: http://localhost:8080
  ```

#### 6. Conectar ao PLC
- Digite IP do PLC: `192.168.0.1`
- Porta: `5000`
- Clique em "Conectar"

✅ **PRONTO!** Sistema funcionando localmente.

---

## ☁️ Cenário 2: Frontend no Hostinger + Backend Local

### Arquitetura:
```
┌─────────────────────┐
│   Hostinger         │
│   (Frontend HTML)   │ ← Acesso via Internet
└──────────┬──────────┘
           │ HTTPS
           ↓
┌──────────────────────┐
│  Seu Computador      │
│  (Backend Node.js)   │ ← Expor com Ngrok
└──────────┬───────────┘
           │ Rede Local
           ↓
┌──────────────────────┐
│  PLC Mitsubishi      │
└──────────────────────┘
```

### Passo a Passo:

#### 1. Hospedar Frontend no Hostinger

**Via cPanel File Manager:**
1. Faça login no Hostinger
2. Vá em "File Manager"
3. Navegue para `public_html/`
4. Crie pasta `plc-dashboard/`
5. Upload dos arquivos:
   - `frontend/index.html`
   - `frontend/css/style.css`
   - `frontend/js/*.js`
   - `frontend/config.js`

#### 2. Editar Configuração no Hostinger

Edite `public_html/plc-dashboard/config.js`:

```javascript
const CONFIG = {
    backend: {
        type: 'websocket',
        url: 'wss://SEU-TUNEL-NGROK.ngrok.io', // Será criado no passo 3
    },
    // ... resto da configuração
};
```

#### 3. Expor Backend Local com Ngrok

**Instalar Ngrok:**
```bash
# Baixe: https://ngrok.com/download
# Ou via npm:
npm install -g ngrok
```

**Criar Túnel:**
```bash
# No computador onde o backend está rodando
ngrok http 3000
```

Você verá:
```
Forwarding  https://abc123.ngrok.io -> http://localhost:3000
```

**Copie o URL** `https://abc123.ngrok.io` e coloque no `config.js` acima.

#### 4. Acessar de Qualquer Lugar

Agora você pode acessar:
```
https://seu-dominio.com/plc-dashboard/
```

✅ Frontend na nuvem, Backend local acessando o PLC!

---

## 🌐 Cenário 3: Tudo na Nuvem (Avançado)

### Requisitos:
- Servidor VPS (AWS, Azure, DigitalOcean, etc.)
- VPN configurada entre servidor e fábrica
- Conhecimento de Linux

### Arquitetura:
```
┌─────────────────────┐
│   Usuário Web       │
└──────────┬──────────┘
           │ HTTPS
           ↓
┌─────────────────────┐
│   Servidor Cloud    │
│   - Frontend        │
│   - Backend Node.js │
└──────────┬──────────┘
           │ VPN
           ↓
┌─────────────────────┐
│   Rede Fábrica      │
│   - PLC Mitsubishi  │
└─────────────────────┘
```

### Passo a Passo:

#### 1. Contratar VPS

**Opções:**
- AWS EC2 (t2.micro - grátis 1 ano)
- DigitalOcean ($5/mês)
- Azure (grátis 12 meses)
- Vultr ($5/mês)

#### 2. Instalar no Servidor

```bash
# Conectar via SSH
ssh root@seu-servidor-ip

# Instalar Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar Git
sudo apt install git

# Clonar repositório
git clone https://github.com/Travain777/GitGitHub.git
cd GitGitHub/backend/nodejs

# Instalar dependências
npm install

# Instalar PM2 (manter rodando)
sudo npm install -g pm2

# Iniciar aplicação
pm2 start server.js --name plc-backend
pm2 save
pm2 startup
```

#### 3. Configurar VPN

**Opção 1: WireGuard (Simples)**
```bash
# No servidor
sudo apt install wireguard

# Configurar túnel entre servidor e rede da fábrica
# (Instruções específicas dependem da sua rede)
```

**Opção 2: OpenVPN**
```bash
# No servidor
sudo apt install openvpn

# Configurar cliente VPN
# (Conectar à VPN da fábrica)
```

#### 4. Configurar Nginx (Proxy Reverso)

```bash
# Instalar Nginx
sudo apt install nginx

# Configurar
sudo nano /etc/nginx/sites-available/plc
```

Adicione:
```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    # Frontend
    location / {
        root /home/user/GitGitHub/frontend;
        index index.html;
    }

    # WebSocket
    location /ws {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

```bash
# Ativar site
sudo ln -s /etc/nginx/sites-available/plc /etc/nginx/sites-enabled/
sudo systemctl restart nginx
```

#### 5. Configurar SSL (HTTPS)

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obter certificado SSL grátis
sudo certbot --nginx -d seu-dominio.com
```

✅ **Sistema completo na nuvem!**

---

## 💰 Comparação de Custos

| Opção | Custo | Complexidade | Segurança |
|-------|-------|--------------|-----------|
| **Local** | R$ 0 (energia PC) | ⭐ Fácil | ⭐⭐⭐ Alta |
| **Hostinger + Ngrok** | R$ 20/mês (Hostinger) | ⭐⭐ Média | ⭐⭐ Média |
| **VPS Completo** | R$ 25-100/mês | ⭐⭐⭐ Difícil | ⭐⭐⭐ Alta |

---

## 🎯 Minha Recomendação

### Para COMEÇAR:
✅ **Use Cenário 1 (Totalmente Local)**
- Mais fácil
- Mais seguro
- Sem custos extras
- Perfeito para testes

### Depois, se precisar acesso remoto:
✅ **Use Cenário 2 (Frontend Hostinger + Ngrok)**
- Aproveita seu Hostinger
- Não precisa VPS
- Acesso de qualquer lugar

### Para PRODUÇÃO séria:
✅ **Use Cenário 3 (VPS + VPN)**
- Mais profissional
- Sempre disponível
- Seguro

---

## 🚀 Início Rápido (5 minutos)

```bash
# 1. Baixar código
git clone https://github.com/Travain777/GitGitHub.git
cd GitGitHub

# 2. Instalar backend
cd backend/nodejs
npm install

# 3. Iniciar backend
npm start

# 4. Abrir frontend (nova janela terminal)
cd ../../frontend
python -m http.server 8080

# 5. Abrir navegador
# http://localhost:8080

# 6. Conectar ao PLC
# IP: 192.168.0.1
# Porta: 5000
```

✅ **FUNCIONANDO!**

---

## ❓ Perguntas Frequentes

**P: O código fica no GitHub, ele roda lá?**
R: Não. GitHub apenas **armazena** o código. Você precisa **baixar** e **executar** em um servidor.

**P: Preciso pagar para usar?**
R: Não. O código é grátis. Você só paga se quiser hospedar na nuvem (VPS).

**P: Posso usar apenas o Hostinger?**
R: Sim, para o **frontend** (interface). Mas o **backend** precisa de Node.js ou ficar local.

**P: É seguro expor o PLC na internet?**
R: **NÃO!** Nunca exponha o PLC diretamente. Use VPN sempre.

**P: Funciona com PLC de outros fabricantes?**
R: Não. Este código é específico para **Mitsubishi MC Protocol**. Outros PLCs (Siemens, Allen-Bradley, etc.) usam protocolos diferentes.

---

**Dúvidas? Pergunte!** 🚀
