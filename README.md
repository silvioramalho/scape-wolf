# Escape Wolf - Jogo Multiplayer

Um jogo multiplayer de sobrevivência onde jogadores devem coletar artefatos enquanto fogem de um lobo.

## Descrição

Escape Wolf é um jogo multiplayer em tempo real onde os jogadores devem trabalhar juntos (ou competir) para coletar artefatos enquanto evitam ser pegos por um lobo. O jogo possui modos colaborativo e competitivo, sistema de salas interconectadas e mecânicas de sobrevivência.

`OBS: Um jogo idealizado pelo meu filho de 8 anos onde construimos 100% utilizando IA. O objetivo é avaliar a capacidade da IA e ao mesmo tempo incentivá-lo a explorar as possibilidades e sair do celular =)`


## Características

- **Multiplayer em tempo real** via WebSocket
- **Modos de jogo:**
  - Colaborativo: Jogadores trabalham juntos
  - Competitivo: Jogadores competem pelos artefatos
- **Sistema de salas:** 9 salas interconectadas (grade 3x3)
- **Personagens:**
  - Jogadores com animações em 4 direções
  - Lobo que persegue os jogadores
- **Mecânicas:**
  - Sistema de vidas (3 vidas por jogador)
  - Coleta de artefatos
  - Paralisadores para defender-se do lobo
  - Portas para transitar entre salas
- **Interface:**
  - HUD com informações do jogo
  - Tela de início personalizada
  - Tela de fim de jogo com estatísticas
  - Suporte a teclado e gamepad

## Requisitos

### Servidor
- Node.js (versão 12 ou superior)
- npm (gerenciador de pacotes do Node)
- WebSocket (ws)

### Cliente
- Navegador moderno com suporte a:
  - HTML5 Canvas
  - WebSocket
  - JavaScript ES6+
  - Gamepad API (opcional, para controle)

## Instalação

1. Clone o repositório:
```bash
git clone [url-do-repositorio]
cd escape-wolf
```

2. Instale as dependências:
```bash
npm install
```

3. Inicie o servidor:
```bash
node server.js
```

4. Acesse o jogo:
- Abra o navegador
- Acesse `http://localhost:8080`

## Como Jogar

1. **Início:**
   - Digite seu nome
   - Escolha o modo de jogo (Colaborativo/Competitivo)
   - Clique em "Iniciar Jogo"

2. **Controles:**
   - Setas ou WASD: Movimento
   - Barra de Espaço: Usar portas
   - Gamepad: Suportado

3. **Objetivos:**
   - Colete 8 artefatos para vencer
   - Evite o lobo
   - Use paralisadores para se defender
   - Colabore com outros jogadores (modo colaborativo)

4. **Dicas:**
   - Use as portas para escapar do lobo
   - Fique atento aos outros jogadores
   - Gerencie bem seus paralisadores
   - Observe o padrão de movimento do lobo

## Estrutura de Arquivos

```
escape-wolf/
├── assets/
│   └── images/
│       ├── room-bg.webp
│       ├── player-sprite.png
│       ├── wolf-sprite.webp
│       └── artifact-sprite.webp
├── js/
│   ├── game.js
│   ├── player.js
│   ├── wolf.js
│   ├── room.js
│   ├── artifact.js
│   ├── sprite.js
│   └── websocket.js
├── index.html
└── server.js
```

## Contribuição

Contribuições são bem-vindas! Por favor, siga estas etapas:
1. Faça fork do projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.
```

Este README fornece uma visão completa do jogo, incluindo:
1. Descrição geral
2. Características principais
3. Requisitos técnicos
4. Instruções de instalação
5. Como jogar
6. Estrutura do projeto
7. Como contribuir
