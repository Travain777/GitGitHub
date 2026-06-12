# Simulador do receptor AndroCode para TESTE EM CASA.
# Abre um socket TCP igual ao WiFiKey.exe (porta 5831) e mostra na tela
# o que o celular/app enviar. Serve para validar o app sem o PC da empresa.
#
# Uso:  python receptor_teste.py
# Pare com Ctrl+C.

import socket

HOST = "0.0.0.0"
PORTA = 5831

def main():
    s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    s.bind((HOST, PORTA))
    s.listen(5)
    print(f"[receptor de teste] escutando em {HOST}:{PORTA}")
    print("Aponte o app para o IP deste computador. Ctrl+C para sair.\n")
    try:
        while True:
            conn, addr = s.accept()
            with conn:
                dados = b""
                while True:
                    parte = conn.recv(1024)
                    if not parte:
                        break
                    dados += parte
                texto = dados.decode("utf-8", "ignore").replace("\0", "").replace("\n", "")
                if texto:
                    print(f"RECEBIDO de {addr[0]}:  {texto!r}")
    except KeyboardInterrupt:
        print("\nencerrado.")
    finally:
        s.close()

if __name__ == "__main__":
    main()
