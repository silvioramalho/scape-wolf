class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        if (!this.canvas) {
            console.error('Canvas não encontrado!');
            return;
        }

        this.ctx = this.canvas.getContext('2d');
        if (!this.ctx) {
            console.error('Contexto 2D não disponível!');
            return;
        }

        // Configurações iniciais
        this.setupCanvas();
        this.players = new Map();
        this.wolf = new Wolf(); // Inicializar lobo imediatamente
        this.artifacts = [];
        this.rooms = [];
        this.currentRoom = 0;
        this.gameMode = 'collaborative';
        this.isGameRunning = false;
        this.network = new GameNetwork(this);
        this.keys = {};
        this.gamepads = {};
        this.lastGamepadButtonPressed = false;
        this.startTime = null;
        this.setupEndScreens();

        // Inicializar componentes do jogo
        this.initializeRooms();
        this.setupEventListeners();

        // Aguardar carregamento das imagens
        this.loadAssets().then(() => {
            this.initializeComponents();
        });
    }

    setupCanvas() {
        // Definir tamanho do canvas
        this.canvas.width = 1024;
        this.canvas.height = 768;
        
        // Garantir que o canvas está visível
        this.canvas.style.display = 'block';
        
        // Cor de fundo inicial
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        console.log('Canvas setup complete');
    }

    initializeRooms() {
        // Criar grade 3x3 de salas
        for (let row = 0; row < 3; row++) {
            for (let col = 0; col < 3; col++) {
                const roomId = row * 3 + col;
                const room = new Room(roomId);
                
                // Conectar com sala à esquerda
                if (col > 0) {
                    room.addConnection('left', roomId - 1);
                }
                // Conectar com sala à direita
                if (col < 2) {
                    room.addConnection('right', roomId + 1);
                }
                // Conectar com sala acima
                if (row > 0) {
                    room.addConnection('up', roomId - 3);
                }
                // Conectar com sala abaixo
                if (row < 2) {
                    room.addConnection('down', roomId + 3);
                }

                this.rooms.push(room);
            }
        }
        console.log('Rooms initialized with connections:', 
            this.rooms.map(r => ({
                id: r.id, 
                connections: Array.from(r.connections.entries())
            }))
        );
    }

    setupEventListeners() {
        document.getElementById('start-button').addEventListener('click', () => {
            const playerName = document.getElementById('player-name').value;
            this.gameMode = document.getElementById('game-mode').value;
            if (playerName) {
                this.startGame(playerName);
            }
        });

        // Controles do teclado
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });

        // Adicionar evento para barra de espaço
        window.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                const player = this.players.get(this.network.localPlayerId);
                if (player) {
                    // Verificar todas as direções possíveis
                    ['up', 'down', 'left', 'right'].forEach(direction => {
                        const doorArea = this.rooms[player.currentRoom].isDoorArea(
                            player.x, player.y, player.width, player.height
                        );
                        if (doorArea === direction) {
                            this.changeRoom(player, direction);
                        }
                    });
                }
            }
        });
    }

    loadAssets() {
        return new Promise((resolve) => {
            const assets = document.querySelectorAll('#assets img');
            let loadedAssets = 0;

            assets.forEach(asset => {
                if (asset.complete) {
                    loadedAssets++;
                } else {
                    asset.onload = () => {
                        loadedAssets++;
                        if (loadedAssets === assets.length) {
                            resolve();
                        }
                    };
                }
            });

            if (loadedAssets === assets.length) {
                resolve();
            }
        });
    }

    startGame(playerName) {
        console.log('Starting game for:', playerName);
        
        // Esconder tela inicial
        const startScreen = document.getElementById('start-screen');
        if (startScreen) {
            startScreen.style.display = 'none';
        }

        this.isGameRunning = true;
        
        // Inicializar network e esperar conexão
        this.network.initialize(playerName).then(() => {
            this.wolf.teleportToRoom(Math.floor(Math.random() * 9));
            this.spawnInitialArtifacts();
            this.gameLoop();
            this.startTime = Date.now();
        }).catch(error => {
            console.error('Game initialization error:', error);
        });
    }

    spawnInitialArtifacts() {
        // Limpar artefatos existentes
        this.artifacts = [];
        
        // Criar novo artefato
        const artifact = new Artifact();
        artifact.spawn(this.rooms);
        this.artifacts.push(artifact);
        
        console.log('Initial artifact spawned at:', artifact.x, artifact.y, 'in room', artifact.room);
    }

    handlePlayerMovement() {
        const player = this.players.get(this.network.localPlayerId);
        if (!player) return;

        const oldX = player.x;
        const oldY = player.y;

        if (this.keys['ArrowUp'] || this.keys['w']) player.move.bind(player)('up');
        if (this.keys['ArrowDown'] || this.keys['s']) player.move.bind(player)('down');
        if (this.keys['ArrowLeft'] || this.keys['a']) player.move.bind(player)('left');
        if (this.keys['ArrowRight'] || this.keys['d']) player.move.bind(player)('right');

        // Verificar colisões com a sala atual
        const room = this.rooms[player.currentRoom];
        if (room.checkCollision(player.x, player.y, player.width, player.height)) {
            player.x = oldX;
            player.y = oldY;
        }

        // Verificar se está em uma porta quando pressiona espaço
        if (this.keys[' ']) {
            const doorDirection = room.isDoorArea(player.x, player.y, player.width, player.height);
            if (doorDirection) {
                this.changeRoom(player, doorDirection);
                this.keys[' '] = false; // Evitar múltiplas mudanças de sala
                return;
            }
        }

        // Broadcast da posição atualizada
        this.network.broadcastPosition(player.x, player.y, player.currentRoom);
    }

    changeRoom(player, direction) {
        const currentRoom = this.rooms[player.currentRoom];
        const nextRoomId = currentRoom.getNextRoom(direction);
        
        if (nextRoomId !== undefined) {
            const newRoom = this.rooms[nextRoomId];
            console.log(`Changing room from ${player.currentRoom} to ${nextRoomId} via ${direction}`);

            // Primeiro atualizar a sala
            player.currentRoom = nextRoomId;

            // Depois posicionar o jogador na porta correta
            switch(direction) {
                case 'left':
                    player.x = this.canvas.width - player.width - 100;
                    player.y = this.canvas.height / 2;
                    break;
                case 'right':
                    player.x = 100;
                    player.y = this.canvas.height / 2;
                    break;
                case 'up':
                    player.x = this.canvas.width / 2;
                    player.y = this.canvas.height - player.height - 100;
                    break;
                case 'down':
                    player.x = this.canvas.width / 2;
                    player.y = 100;
                    break;
            }

            // Broadcast imediato da nova posição e sala
            this.network.broadcastPosition(player.x, player.y, player.currentRoom);
            console.log('Player repositioned at:', player.x, player.y, 'in room', player.currentRoom);
        }
    }

    spawnArtifact() {
        const artifact = new Artifact();
        
        // Tentar encontrar uma posição válida para o artefato
        let validPosition = false;
        let attempts = 0;
        const maxAttempts = 100;
        
        while (!validPosition && attempts < maxAttempts) {
            // Escolher sala aleatória
            const randomRoom = Math.floor(Math.random() * this.rooms.length);
            
            // Gerar posição aleatória
            const x = Math.random() * (this.canvas.width - 50);
            const y = Math.random() * (this.canvas.height - 50);
            
            // Verificar se a posição é válida (não está em um obstáculo)
            if (!this.rooms[randomRoom].checkCollision(x, y, 30, 30)) {
                artifact.x = x;
                artifact.y = y;
                artifact.room = randomRoom;
                validPosition = true;
            }
            attempts++;
        }
        
        // Se não encontrou posição válida, usar posição segura padrão
        if (!validPosition) {
            artifact.x = 100;
            artifact.y = 100;
            artifact.room = 0;
        }
        
        this.artifacts.push(artifact);
        console.log('New artifact spawned at:', artifact.x, artifact.y, 'in room', artifact.room);
    }

    // Adicionar método para verificar input do gamepad
    checkGamepadInput() {
        // Pegar todos os gamepads conectados
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        
        for (const gamepad of gamepads) {
            if (!gamepad) continue;

            const player = this.players.get(this.network.localPlayerId);
            if (!player) continue;

            // Mapear botões do controle
            // Geralmente o primeiro botão (0) é o botão A ou X
            const buttonPressed = gamepad.buttons[0].pressed;
            
            // Evitar múltiplos triggers do mesmo botão
            if (buttonPressed && !this.lastGamepadButtonPressed) {
                const room = this.rooms[player.currentRoom];
                ['up', 'down', 'left', 'right'].forEach(direction => {
                    const doorArea = room.isDoorArea(
                        player.x, player.y, player.width, player.height
                    );
                    if (doorArea === direction) {
                        this.changeRoom(player, direction);
                    }
                });
            }
            this.lastGamepadButtonPressed = buttonPressed;

            // Mapear analógicos/d-pad para movimento
            const axes = gamepad.axes;
            if (Math.abs(axes[0]) > 0.1) { // Movimento horizontal
                if (axes[0] < -0.1) player.move.bind(player)('left');
                if (axes[0] > 0.1) player.move.bind(player)('right');
            }
            if (Math.abs(axes[1]) > 0.1) { // Movimento vertical
                if (axes[1] < -0.1) player.move.bind(player)('up');
                if (axes[1] > 0.1) player.move.bind(player)('down');
            }

            // D-pad como alternativa
            if (gamepad.buttons[12].pressed) player.move.bind(player)('up');    // D-pad up
            if (gamepad.buttons[13].pressed) player.move.bind(player)('down');  // D-pad down
            if (gamepad.buttons[14].pressed) player.move.bind(player)('left');  // D-pad left
            if (gamepad.buttons[15].pressed) player.move.bind(player)('right'); // D-pad right
        }
    }

    update() {
        if (!this.isGameRunning) return;

        this.handlePlayerMovement();
        this.checkGamepadInput();
        
        // Atualizar lobo
        const localPlayer = this.players.get(this.network.localPlayerId);
        if (localPlayer && localPlayer.currentRoom === this.wolf.currentRoom) {
            this.wolf.update(localPlayer);
            
            if (this.wolf.checkCollision(localPlayer)) {
                // Primeiro verificar se o jogador perdeu todas as vidas
                const stillAlive = localPlayer.takeDamage();
                
                // Mover o lobo para uma sala aleatória diferente
                let newWolfRoom;
                do {
                    newWolfRoom = Math.floor(Math.random() * 9);
                } while (newWolfRoom === localPlayer.currentRoom);
                
                // Atualizar posição do lobo
                this.wolf.x = Math.random() * (this.canvas.width - 100) + 50;
                this.wolf.y = Math.random() * (this.canvas.height - 100) + 50;
                this.wolf.currentRoom = newWolfRoom;
                
                // Se sou o host, enviar a nova posição do lobo
                if (this.network && this.network.isHost()) {
                    this.network.broadcastWolfPosition();
                }

                if (!stillAlive) {
                    requestAnimationFrame(() => this.gameOver());
                    return;
                }
                
                // Fazer respawn do jogador em uma sala diferente do lobo
                let newPlayerRoom;
                do {
                    newPlayerRoom = Math.floor(Math.random() * 9);
                } while (newPlayerRoom === this.wolf.currentRoom);
                
                localPlayer.respawn(newPlayerRoom);
            }
        }

        // Verificar coleta de artefatos
        for (let i = this.artifacts.length - 1; i >= 0; i--) {
            const artifact = this.artifacts[i];
            if (!artifact.isCollected && 
                artifact.room === localPlayer.currentRoom && 
                artifact.checkCollision(localPlayer)) {
                
                // Remover o artefato atual
                this.artifacts.splice(i, 1);
                
                // Atualizar contagem de artefatos do jogador
                if (localPlayer.collectArtifact()) {
                    this.victory(); // Vitória se coletou todos os artefatos
                    return;
                }
                
                // Aumentar dificuldade do lobo
                this.wolf.increaseDifficulty();
                
                // Spawnar novo artefato
                this.spawnArtifact();
                
                // Broadcast da coleta do artefato
                this.network.broadcastArtifactCollection(localPlayer.id);
                break;
            }
        }
    }

    render() {
        if (!this.ctx || !this.isGameRunning) {
            console.log('Skipping render - game not running or context not available');
            return;
        }

        // Limpar canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        const localPlayer = this.players.get(this.network.localPlayerId);
        if (!localPlayer) {
            console.log('Local player not found, skipping render');
            return;
        }

        // Renderizar sala atual
        const currentRoom = this.rooms[localPlayer.currentRoom];
        if (currentRoom) {
            currentRoom.draw(this.ctx);
            console.log('Drawing room:', localPlayer.currentRoom);
        }

        // Desenhar artefatos
        this.artifacts.forEach(artifact => {
            if (artifact.room === localPlayer.currentRoom && !artifact.isCollected) {
                artifact.draw(this.ctx);
                console.log('Drawing artifact at:', artifact.x, artifact.y);
            }
        });

        // Desenhar todos os jogadores na mesma sala
        this.players.forEach(player => {
            if (player.currentRoom === localPlayer.currentRoom) {
                player.draw(this.ctx);
                console.log('Drawing player:', player.name, 'at:', player.x, player.y);
            }
        });

        // Desenhar lobo se estiver na mesma sala
        if (this.wolf.currentRoom === localPlayer.currentRoom) {
            this.wolf.draw(this.ctx);
            console.log('Drawing wolf at:', this.wolf.x, this.wolf.y);
        }

        this.renderHUD();
    }

    renderHUD() {
        const localPlayer = this.players.get(this.network.localPlayerId);
        
        document.getElementById('players-online').textContent = 
            `Jogadores Online: ${this.players.size}`;
        
        document.getElementById('player-stats').textContent = 
            `Vidas: ${localPlayer.lives} | Artefatos: ${localPlayer.artifacts}/8 | Paralisadores: ${localPlayer.teasers}`;
    }

    setupEndScreens() {
        const restartButtons = document.querySelectorAll('.restart-button');
        const exitButtons = document.querySelectorAll('.exit-button');

        restartButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Esconder telas de fim de jogo
                this.hideEndScreens();
                
                // Manter o nome do jogador atual
                const currentPlayerName = document.getElementById('player-name').value;
                const currentGameMode = document.getElementById('game-mode').value;
                
                // Limpar estado do jogo
                this.players.clear();
                this.artifacts = [];
                this.isGameRunning = false;
                this.startTime = null;
                
                // Reiniciar o jogo com o mesmo nome e modo
                this.startGame(currentPlayerName);
                
                // Resetar HUD
                document.getElementById('players-online').textContent = 'Jogadores Online: 0';
                document.getElementById('player-stats').textContent = 'Vidas: 3 | Artefatos: 0/8 | Paralisadores: 3';
            });
        });

        exitButtons.forEach(button => {
            button.addEventListener('click', () => {
                // Esconder telas de fim de jogo
                this.hideEndScreens();
                
                // Limpar estado do jogo
                this.players.clear();
                this.artifacts = [];
                this.isGameRunning = false;
                
                // Resetar campos do formulário
                document.getElementById('player-name').value = '';
                document.getElementById('game-mode').value = 'collaborative';
                
                // Mostrar tela inicial
                document.getElementById('start-screen').style.display = 'block';
                
                // Limpar o HUD
                document.getElementById('players-online').textContent = 'Jogadores Online: 0';
                document.getElementById('player-stats').textContent = 'Vidas: 3 | Artefatos: 0/8 | Paralisadores: 3';
                
                // Limpar o canvas
                if (this.ctx) {
                    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
                }
            });
        });
    }

    hideEndScreens() {
        document.getElementById('game-over-screen').style.display = 'none';
        document.getElementById('victory-screen').style.display = 'none';
    }

    formatTime(milliseconds) {
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    updateEndScreen(screenId) {
        const screen = document.getElementById(screenId);
        const timePlayed = this.formatTime(Date.now() - this.startTime);
        const localPlayer = this.players.get(this.network.localPlayerId);

        screen.querySelector('.artifacts-collected').textContent = localPlayer.artifacts;
        screen.querySelector('.time-played').textContent = timePlayed;
        screen.querySelector('.players-count').textContent = this.players.size;

        screen.style.display = 'block';
    }

    gameOver() {
        this.isGameRunning = false;
        if (this.network) {
            this.network.handleDisconnect();
        }
        this.updateEndScreen('game-over-screen');
    }

    victory() {
        this.isGameRunning = false;
        if (this.network) {
            this.network.handleDisconnect();
        }
        this.updateEndScreen('victory-screen');
    }

    gameLoop() {
        if (!this.isGameRunning) return;

        this.update();
        this.render();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Inicializar o jogo quando a página carregar
window.addEventListener('load', () => {
    console.log('Window loaded, initializing game...');
    window.game = new Game();
}); 