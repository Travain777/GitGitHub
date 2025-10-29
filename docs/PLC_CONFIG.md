# Configuração do PLC Mitsubishi Q06UDVCPU

Este documento descreve como configurar o PLC Mitsubishi Q06UDVCPU para comunicação via MC Protocol.

## 📋 Pré-requisitos

- PLC Mitsubishi Q06UDVCPU
- GX Works 2 instalado
- Cabo Ethernet
- Rede local configurada

## 🔧 Configuração no GX Works 2

### 1. Configuração de Rede

1. **Abra o GX Works 2**
2. **Abra ou crie seu projeto**
3. **Vá para Navigation Window** → `Parameter` → `Network Parameter` → `Ethernet/CC IE/CC Link IE Port`

### 2. Configuração do Módulo Ethernet

1. **Selecione o módulo Ethernet** (geralmente no slot 0)
2. **Clique em "Open Setting"**

### 3. Configurar Endereço IP

Na aba **"Basic Setting"**:

```
┌─────────────────────────────────────┐
│ IP Address Setting                  │
├─────────────────────────────────────┤
│ IP Address:    192.168.0.1          │
│ Subnet Mask:   255.255.255.0        │
│ Default Gateway: 192.168.0.254      │
└─────────────────────────────────────┘
```

**Importante**:
- Use um IP da mesma rede que seu computador/servidor
- Exemplo: Se seu PC é 192.168.0.100, use 192.168.0.1 para o PLC

### 4. Habilitar MC Protocol

Na aba **"Protocol"**:

1. Marque: ✅ **"MC Protocol"**
2. Configure:
   ```
   Port Number: 5000 (padrão)
   ASCII/Binary: Binary (recomendado)
   ```

### 5. Configuração de Comunicação

Na aba **"Communication Data Code"**:

```
Communication Data Code: Binary
```

### 6. Aplicar Configurações

1. Clique em **"OK"** para salvar
2. **Escreva as configurações no PLC**:
   - Menu: `Online` → `Write to PLC`
   - Selecione: ✅ **"Parameter"**
   - Clique em **"Execute"**
3. **Reset o PLC** para aplicar:
   - Menu: `Online` → `Reset PLC`
   - Selecione: **"Clear and Reset"**

## 🔌 Conexão Física

### Cabo Ethernet

```
┌──────────┐         ┌──────────┐
│    PC    │────────│   PLC    │
│          │  RJ45  │ Q06UDVCPU│
└──────────┘         └──────────┘
```

**Ou via Switch/Router:**

```
┌──────────┐         ┌──────────┐
│    PC    │────────│  Switch  │
└──────────┘         └────┬─────┘
                          │
                    ┌─────┴─────┐
                    │    PLC    │
                    │ Q06UDVCPU │
                    └───────────┘
```

## 🧪 Teste de Conectividade

### 1. Ping Test

Abra o terminal/prompt e execute:

```bash
ping 192.168.0.1
```

Resultado esperado:
```
Reply from 192.168.0.1: bytes=32 time<1ms TTL=64
Reply from 192.168.0.1: bytes=32 time<1ms TTL=64
```

❌ **Se falhar:**
- Verifique cabo Ethernet
- Verifique IP do PC (deve estar na mesma rede)
- Verifique configuração do PLC

### 2. Teste no GX Works 2

1. Menu: `Online` → `Connection Destination` → `Connection Test`
2. Deve mostrar: ✅ **"Connection OK"**

### 3. Teste com Sistema

Use o frontend desenvolvido:
1. Abra o dashboard
2. Digite IP: `192.168.0.1`
3. Porta: `5000`
4. Clique em "Conectar"

## 📊 Configuração de Dispositivos

### Registros D (Data Registers)

Os registros D armazenam valores de 16 bits (0-65535).

**Exemplo de uso:**

```
D0  = Temperatura do motor (°C × 10)
D1  = Pressão do sistema (bar × 100)
D2  = Velocidade da esteira (m/min)
D3  = Contador de peças
D4  = Setpoint de temperatura
...
D100 = Valor de processo 1
```

### Bits M (Memory Bits)

Os bits M armazenam valores booleanos (0/1).

**Exemplo de uso:**

```
M0  = Motor ligado
M1  = Alarme ativo
M2  = Modo automático
M3  = Modo manual
M4  = Emergência acionada
...
M100 = Status sensor 1
```

## 🔒 Segurança

### Configurações Recomendadas

1. **IP Address Filtering** (se disponível):
   - Limite acesso apenas a IPs conhecidos
   - Ex: 192.168.0.100-110

2. **Firewall do Windows** (no PC):
   ```bash
   # Abrir porta 5000 para o PLC
   netsh advfirewall firewall add rule name="PLC MC Protocol" dir=in action=allow protocol=TCP localport=5000
   ```

3. **Usar VLAN** (recomendado):
   - Separe rede industrial da rede corporativa
   - Use switch gerenciável

## 🛠️ Troubleshooting

### Erro: "Connection Timeout"

**Causas:**
- PLC desligado ou sem energia
- Cabo Ethernet desconectado
- IP incorreto
- Firewall bloqueando

**Solução:**
```bash
# 1. Verificar conexão física
# 2. Ping test
ping 192.168.0.1

# 3. Verificar configuração IP do PC
ipconfig  # Windows
ifconfig  # Linux/Mac

# 4. Temporariamente desabilitar firewall para teste
```

### Erro: "Connection Refused"

**Causas:**
- MC Protocol não habilitado
- Porta incorreta
- PLC em modo STOP

**Solução:**
1. Verifique configuração MC Protocol no GX Works 2
2. Verifique porta (padrão: 5000)
3. Coloque PLC em modo RUN

### Erro: "PLC Error: 0xC059"

**Causa:** Tentando acessar dispositivo inexistente

**Solução:**
- Verifique se o registro existe (ex: D0-D7999)
- Verifique se o bit existe (ex: M0-M7679)

### Erro: "PLC Error: 0xC056"

**Causa:** Tentando escrever em área protegida

**Solução:**
- Verifique permissões de escrita no PLC
- Use registros apropriados para escrita

## 📚 Referências

### Manuais Mitsubishi

- **Q06UDVCPU User's Manual**
- **MELSEC Communication Protocol Reference Manual**
- **GX Works 2 Operating Manual**

### Device Codes MC Protocol

| Dispositivo | Código | Descrição          |
|-------------|--------|--------------------|
| D           | 0xA8   | Data Register      |
| M           | 0x90   | Internal Relay     |
| X           | 0x9C   | Input              |
| Y           | 0x9D   | Output             |
| B           | 0xA0   | Link Relay         |
| W           | 0xB4   | Link Register      |

### Comandos MC Protocol

| Comando | Código | Descrição          |
|---------|--------|--------------------|
| Read    | 0x0401 | Batch Read         |
| Write   | 0x1401 | Batch Write        |
| Random Read | 0x0403 | Random Read    |
| Random Write | 0x1402 | Random Write  |

## 📞 Suporte

Para mais informações:
- **Mitsubishi Electric**: https://www.mitsubishielectric.com
- **Suporte Técnico**: Contate seu distribuidor local

## ✅ Checklist de Configuração

Antes de usar o sistema, verifique:

- [ ] PLC ligado e operacional
- [ ] Cabo Ethernet conectado
- [ ] IP configurado no GX Works 2
- [ ] MC Protocol habilitado (porta 5000)
- [ ] Configurações escritas no PLC
- [ ] PLC resetado após configuração
- [ ] Ping test bem-sucedido
- [ ] Connection test no GX Works 2 OK
- [ ] Firewall configurado (se necessário)

---

**Última atualização:** 2025
**Testado com:** GX Works 2 v1.597Z, Q06UDVCPU
