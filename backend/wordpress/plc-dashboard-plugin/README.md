# PLC Mitsubishi Dashboard - Plugin WordPress

Plugin WordPress completo para monitoramento e análise do PLC Mitsubishi Q06UDVCPU com backend PHP nativo.

## ✨ Características

- ✅ **100% PHP** - Funciona em qualquer hospedagem WordPress (Hostinger incluído)
- ✅ **API REST WordPress** - Endpoints RESTful integrados
- ✅ **Shortcodes** - Adicione o dashboard em qualquer página/post
- ✅ **MC Protocol** - Comunicação direta com PLC Mitsubishi
- ✅ **Dashboard Completo** - Gráficos, estatísticas e análise em tempo real
- ✅ **Análise IA** - Integração com Transformers.js (opcional)
- ✅ **Painel Admin** - Configurações no wp-admin

## 📦 Instalação

### Método 1: Upload Manual (Recomendado)

1. **Baixe o plugin:**
   - Navegue até `backend/wordpress/plc-dashboard-plugin/`
   - Compacte toda a pasta em `plc-dashboard-plugin.zip`

2. **Upload no WordPress:**
   - Acesse: `wp-admin` → `Plugins` → `Adicionar Novo`
   - Clique em "Enviar Plugin"
   - Selecione o arquivo `plc-dashboard-plugin.zip`
   - Clique em "Instalar Agora"

3. **Ativar o Plugin:**
   - Após instalação, clique em "Ativar Plugin"

### Método 2: FTP/cPanel

1. **Upload via FTP:**
   ```
   Copie a pasta completa para:
   /wp-content/plugins/plc-dashboard-plugin/
   ```

2. **Ativar:**
   - Acesse `wp-admin` → `Plugins`
   - Localize "PLC Mitsubishi Dashboard"
   - Clique em "Ativar"

### Método 3: Hostinger File Manager

1. Acesse cPanel do Hostinger
2. Vá em "File Manager"
3. Navegue até: `public_html/wp-content/plugins/`
4. Upload da pasta `plc-dashboard-plugin`
5. Ative o plugin no wp-admin

## ⚙️ Configuração

### 1. Configurar no WordPress

Após ativar o plugin:

1. **Acesse:** `wp-admin` → `PLC Dashboard` → `Configurações`

2. **Configure:**
   - **IP do PLC**: 192.168.0.1 (ou IP do seu PLC)
   - **Porta do PLC**: 5000 (porta padrão MC Protocol)
   - **Intervalo de Atualização**: 1000 ms (1 segundo)
   - **Habilitar Análise IA**: ✅ (opcional)

3. **Salvar Alterações**

### 2. Verificar Requisitos

Na página de configurações, verifique se:

- ✅ **PHP Sockets** está habilitado
- ✅ PHP versão 7.4 ou superior

**Se Sockets não estiver habilitado:**
- Hostinger: Entre em contato com suporte
- VPS/Dedicado: Edite `php.ini` e remova `;` de `extension=sockets`

## 🎮 Uso

### Adicionar Dashboard em uma Página

1. **Criar Página:**
   - `Páginas` → `Adicionar Nova`
   - Título: "Monitoramento PLC"

2. **Adicionar Shortcode:**
   ```
   [plc_dashboard]
   ```

3. **Publicar**

4. **Visualizar**: Acesse a página criada

### Shortcodes Disponíveis

#### 1. Dashboard Completo
```
[plc_dashboard]
```
Exibe o dashboard completo com gráficos, dados e IA.

#### 2. Status do PLC
```
[plc_status]
[plc_status show_ip="true" show_port="true"]
```
Exibe status da conexão com o PLC.

#### 3. Gráfico Individual
```
[plc_chart type="line" device="D" address="0" count="5" height="300"]
```
Exibe um gráfico específico.

**Parâmetros:**
- `type`: line, bar, pie
- `device`: D (registros) ou M (bits)
- `address`: Endereço inicial
- `count`: Quantidade de dispositivos
- `height`: Altura em pixels

## 🔌 API REST

O plugin expõe endpoints REST para integração externa:

### Base URL
```
https://seu-site.com/wp-json/plc-dashboard/v1/
```

### Endpoints

#### 1. Conectar ao PLC
```http
POST /wp-json/plc-dashboard/v1/connect
Content-Type: application/json

{
  "plcIp": "192.168.0.1",
  "plcPort": 5000
}
```

#### 2. Ler Registros D
```http
POST /wp-json/plc-dashboard/v1/read/d
Content-Type: application/json

{
  "address": 0,
  "count": 10
}
```

#### 3. Ler Bits M
```http
POST /wp-json/plc-dashboard/v1/read/m
Content-Type: application/json

{
  "address": 0,
  "count": 16
}
```

#### 4. Escrever Registro D
```http
POST /wp-json/plc-dashboard/v1/write/d
Content-Type: application/json

{
  "address": 0,
  "value": 100
}
```

#### 5. Escrever Bit M
```http
POST /wp-json/plc-dashboard/v1/write/m
Content-Type: application/json

{
  "address": 0,
  "value": 1
}
```

#### 6. Ler Múltiplos Dispositivos (Batch)
```http
POST /wp-json/plc-dashboard/v1/read/batch
Content-Type: application/json

{
  "devices": [
    { "type": "D", "address": 0, "count": 10 },
    { "type": "M", "address": 0, "count": 16 }
  ]
}
```

#### 7. Status do Sistema
```http
GET /wp-json/plc-dashboard/v1/status
```

### Exemplo com cURL

```bash
# Ler registros D0-D9
curl -X POST https://seu-site.com/wp-json/plc-dashboard/v1/read/d \
  -H "Content-Type: application/json" \
  -d '{"address": 0, "count": 10}'
```

### Exemplo com JavaScript

```javascript
fetch('https://seu-site.com/wp-json/plc-dashboard/v1/read/d', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    address: 0,
    count: 10
  })
})
.then(response => response.json())
.then(data => console.log(data));
```

## 🛠️ Troubleshooting

### Erro: "Sockets não habilitados"

**Solução:**
1. **Hostinger**: Entre em contato com suporte e solicite habilitar PHP Sockets
2. **VPS**: Edite `php.ini`:
   ```ini
   extension=sockets
   ```
   Reinicie Apache/Nginx

### Erro: "Connection refused"

**Causas:**
- PLC desligado
- IP incorreto
- Firewall bloqueando
- MC Protocol não habilitado no PLC

**Solução:**
1. Verifique IP: `ping 192.168.0.1`
2. Verifique configuração no GX Works 2
3. Teste porta: `telnet 192.168.0.1 5000`

### Erro: "Timeout"

**Solução:**
- Aumentar timeout em `includes/plc-connector.php`:
  ```php
  private $timeout = 10; // Aumentar para 10 segundos
  ```

### Dashboard não aparece

**Solução:**
1. Verifique se o plugin está ativado
2. Limpe cache do WordPress
3. Verifique console do navegador (F12) para erros JavaScript

### CSS não carrega

**Solução:**
1. Limpe cache
2. Verifique permissões da pasta `assets/`
3. Acesse: `wp-admin` → `Ferramentas` → `Saúde do Site`

## 📊 Estrutura do Plugin

```
plc-dashboard-plugin/
├── plc-dashboard.php          # Arquivo principal
├── README.md                  # Esta documentação
├── includes/
│   ├── plc-connector.php      # Comunicação MC Protocol
│   ├── api-endpoints.php      # Endpoints REST
│   └── shortcodes.php         # Shortcodes WordPress
├── assets/
│   ├── css/
│   │   └── style.css          # Estilos
│   └── js/
│       └── dashboard.js       # JavaScript
└── templates/
    ├── dashboard.php          # Template do dashboard
    ├── admin-page.php         # Página admin
    └── settings-page.php      # Página de configurações
```

## 🔒 Segurança

### Recomendações:

1. **Nunca exponha WordPress/PLC diretamente à internet**
2. **Use VPN** para acesso remoto
3. **Limite acesso por IP** (via .htaccess):
   ```apache
   <Files "xmlrpc.php">
     Order Deny,Allow
     Deny from all
     Allow from 192.168.0.0/24
   </Files>
   ```
4. **Use SSL/HTTPS** sempre
5. **Mantenha WordPress atualizado**

## ❓ FAQ

**P: Funciona no Hostinger?**
R: Sim! 100% compatível. Só precisa ter PHP Sockets habilitado.

**P: Preciso instalar Node.js?**
R: Não! Este plugin é 100% PHP.

**P: Posso usar com outros PLCs?**
R: Não. Este plugin é específico para Mitsubishi MC Protocol.

**P: Funciona em WordPress.com?**
R: Não. Apenas WordPress auto-hospedado (WordPress.org).

**P: Posso acessar de qualquer lugar?**
R: Sim, se configurar VPN entre seu site e o PLC. Nunca exponha PLC à internet diretamente.

**P: Análise IA funciona?**
R: Sim, mas requer navegador moderno. Primeira execução baixa modelos (~100MB).

## 📝 Changelog

### 1.0.0 (2025-01-XX)
- Lançamento inicial
- Dashboard completo
- API REST
- Shortcodes
- Análise IA

## 📞 Suporte

- **Issues**: https://github.com/Travain777/GitGitHub/issues
- **Documentação PLC**: `docs/PLC_CONFIG.md`
- **MC Protocol**: Consulte manual Mitsubishi

## 🎓 Recursos Adicionais

- [Configuração do PLC](../../../docs/PLC_CONFIG.md)
- [Guia de Deployment](../../../docs/DEPLOYMENT.md)
- [README Principal](../../../README.md)

## 📄 Licença

MIT License - Use livremente!

---

**Desenvolvido para automação industrial com WordPress** 🚀
