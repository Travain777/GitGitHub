# PLC Mitsubishi Q06UDVCPU - Sistema de Análise de Dados

Sistema completo de monitoramento e análise de dados do PLC Mitsubishi Q06UDVCPU com interface web moderna e inteligência artificial.

## 📋 Índice

- [Características](#características)
- [Tecnologias](#tecnologias)
- [Arquitetura](#arquitetura)
- [Instalação](#instalação)
- [Configuração](#configuração)
- [Uso](#uso)
- [API](#api)
- [FAQ](#faq)

## ✨ Características

### Frontend
- **Interface Web Moderna**: HTML5, CSS3, JavaScript responsivo
- **Dashboard em Tempo Real**: Visualização de dados do PLC com atualização automática
- **Gráficos Interativos**: Chart.js para visualização de dados e tendências
- **Análise IA**: Transformers.js para análise inteligente de dados
  - Detecção de anomalias
  - Previsão de tendências
  - Classificação de estados do sistema

### Backend
- **Duas Opções de Backend**:
  1. **Node.js** com WebSocket (recomendado para tempo real)
  2. **PHP** compatível com Hostinger/WordPress
- **Protocolo MC**: Comunicação nativa com PLC Mitsubishi via MC Protocol
- **Leitura/Escrita**: Suporte para registros D e bits M
- **Leitura Contínua**: Monitoramento automático de múltiplos registros

## 🚀 Tecnologias

### Frontend
- HTML5
- CSS3 (Grid, Flexbox, Animações)
- JavaScript ES6+
- Chart.js 4.4.0
- Transformers.js 2.17.1 (Xenova)

### Backend Node.js
- Node.js 14+
- WebSocket (ws)
- Express
- MC Protocol (implementação customizada)

### Backend PHP
- PHP 7.4+
- Sockets TCP/IP
- MC Protocol (implementação customizada)

## 🏗️ Arquitetura

```
┌─────────────────┐
│   Frontend      │
│   (Browser)     │
│                 │
│  - Dashboard    │
│  - Charts       │
│  - AI Analysis  │
└────────┬────────┘
         │
         │ WebSocket / HTTP
         │
┌────────▼────────┐
│   Backend       │
│ (Node.js/PHP)   │
│                 │
│  - WebSocket    │
│  - MC Protocol  │
└────────┬────────┘
         │
         │ MC Protocol
         │ (TCP/IP)
         │
┌────────▼────────┐
│  PLC Mitsubishi │
│  Q06UDVCPU      │
│                 │
│  - D Registers  │
│  - M Bits       │
└─────────────────┘
```

## 📦 Instalação

### 1. Clonar Repositório

```bash
git clone <seu-repositorio>
cd GitGitHub
```

### 2. Backend Node.js (Recomendado)

```bash
cd backend/nodejs
npm install
```

### 3. Backend PHP (Hostinger/WordPress)

Copie os arquivos da pasta `backend/php/` para seu servidor:

```bash
# Via FTP ou cPanel File Manager
backend/php/api.php
backend/php/plc-bridge.php
```

### 4. Frontend

O frontend é puro HTML/CSS/JS, não precisa de instalação. Apenas sirva os arquivos:

```bash
# Opção 1: Servidor Python simples
cd frontend
python -m http.server 8080

# Opção 2: Servidor PHP
cd frontend
php -S localhost:8080

# Opção 3: Servidor Node.js (http-server)
npm install -g http-server
cd frontend
http-server -p 8080
```

## ⚙️ Configuração

### Configuração do PLC

1. **No GX Works 2**:
   - Abra seu projeto
   - Vá em `Online` → `PLC Diagnostics` → `Ethernet Port Setting`
   - Configure o IP do PLC (ex: 192.168.0.1)
   - Ative o protocolo MC Protocol
   - Porta padrão: 5000

2. **Teste a Conexão**:
   ```bash
   ping 192.168.0.1
   ```

### Configuração do Backend Node.js

1. Edite o arquivo `backend/nodejs/.env` (opcional):
   ```env
   PORT=3000
   PLC_IP=192.168.0.1
   PLC_PORT=5000
   ```

2. Inicie o servidor:
   ```bash
   cd backend/nodejs
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

### Configuração do Backend PHP

1. Edite `backend/php/api.php`:
   ```php
   define('PLC_IP', '192.168.0.1'); // IP do seu PLC
   define('PLC_PORT', 5000);        // Porta do PLC
   ```

2. No Hostinger, coloque os arquivos em:
   ```
   public_html/api/
   ```

3. Acesse: `https://seu-dominio.com/api/api.php?action=health`

### Configuração do Frontend

1. Se estiver usando backend Node.js, o frontend está configurado para `ws://localhost:3000`

2. Se estiver usando backend PHP, edite `frontend/js/plc-client.js`:
   ```javascript
   // Linha ~15, altere:
   this.backendUrl = 'https://seu-dominio.com/api/api.php';
   ```

## 🎮 Uso

### 1. Iniciar Sistema

1. **Inicie o Backend**:
   ```bash
   # Node.js
   cd backend/nodejs
   npm start

   # PHP: já está rodando no servidor
   ```

2. **Abra o Frontend**:
   ```bash
   cd frontend
   # Abra index.html no navegador ou use servidor local
   ```

3. **No Dashboard**:
   - Digite o IP do PLC (ex: 192.168.0.1)
   - Digite a porta (ex: 5000)
   - Clique em "Conectar"

### 2. Visualizar Dados

Após conectar, você verá:
- **Estatísticas em tempo real**
- **Gráficos de dados** (D0, D1, etc.)
- **Lista de registros D e bits M**
- **Log de eventos**

### 3. Análise com IA

1. Clique em "Iniciar Análise IA"
2. Escolha o tipo:
   - **Detecção de Anomalias**: Identifica valores anormais
   - **Previsão de Tendências**: Prevê próximos valores
   - **Classificação de Estados**: Classifica estado do sistema
3. Veja resultados em tempo real

## 🔌 API

### Backend Node.js (WebSocket)

#### Conectar
```javascript
ws.send(JSON.stringify({
    command: 'configure',
    plcIp: '192.168.0.1',
    plcPort: 5000
}));
```

#### Ler Registro D
```javascript
ws.send(JSON.stringify({
    command: 'read',
    type: 'D',
    address: 0,
    count: 10
}));
```

#### Escrever Registro D
```javascript
ws.send(JSON.stringify({
    command: 'write',
    type: 'D',
    address: 0,
    value: 100
}));
```

#### Iniciar Leitura Contínua
```javascript
ws.send(JSON.stringify({
    command: 'start_continuous',
    registers: [
        { type: 'D', address: 0, count: 10 },
        { type: 'M', address: 0, count: 16 }
    ]
}));
```

### Backend PHP (HTTP)

#### Ler Registro D
```bash
curl -X POST https://seu-dominio.com/api/api.php?action=read \
  -H "Content-Type: application/json" \
  -d '{
    "plcIp": "192.168.0.1",
    "plcPort": 5000,
    "type": "D",
    "address": 0,
    "count": 10
  }'
```

#### Escrever Registro D
```bash
curl -X POST https://seu-dominio.com/api/api.php?action=write \
  -H "Content-Type: application/json" \
  -d '{
    "plcIp": "192.168.0.1",
    "type": "D",
    "address": 0,
    "value": 100
  }'
```

## 📖 Documentação Adicional

- [Configuração do PLC](docs/PLC_CONFIG.md)
- [MC Protocol](docs/MC_PROTOCOL.md) (em desenvolvimento)
- [API Completa](docs/API.md) (em desenvolvimento)

## ❓ FAQ

### O PLC não conecta

1. Verifique se o PLC está ligado e conectado à rede
2. Teste: `ping 192.168.0.1`
3. Verifique se o MC Protocol está habilitado no GX Works 2
4. Verifique firewall (porta 5000 deve estar aberta)

### Erro de CORS no navegador

Se estiver usando backend PHP, adicione ao `.htaccess`:
```apache
Header set Access-Control-Allow-Origin "*"
Header set Access-Control-Allow-Methods "GET, POST, OPTIONS"
```

### Backend Node.js não inicia

1. Verifique se o Node.js 14+ está instalado: `node --version`
2. Instale dependências: `npm install`
3. Verifique se a porta 3000 está livre: `lsof -i :3000`

### AI não funciona

1. Transformers.js requer navegador moderno (Chrome/Firefox/Edge)
2. Primeira execução baixa modelos (~100MB), pode demorar
3. Verifique console do navegador para erros

## 🔒 Segurança

⚠️ **IMPORTANTE**: Este sistema é para uso em rede local/industrial.

Para uso em produção:
1. **Nunca exponha o PLC diretamente à internet**
2. **Use VPN** para acesso remoto
3. **Implemente autenticação** no backend
4. **Use HTTPS** no frontend
5. **Configure firewall** adequadamente

## 📝 Licença

MIT License - veja LICENSE para detalhes

## 👨‍💻 Autor

Desenvolvido para análise de dados industriais com PLC Mitsubishi Q06UDVCPU

## 🤝 Contribuindo

Contribuições são bem-vindas! Abra uma issue ou pull request.

## 📞 Suporte

Para questões específicas do PLC Mitsubishi, consulte:
- [Manual do Q06UDVCPU](https://www.mitsubishielectric.com)
- [MC Protocol Manual](https://www.mitsubishielectric.com)

---

**Desenvolvido com ❤️ para automação industrial**
