class GameNetwork {
    constructor(game) {
        this.game = game;
        this.socket = null;
        this.localPlayerId = null;
        this.isLocalMode = false;
        
        const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsHost = window.location.hostname === 'localhost' ? '127.0.0.1' : window.location.hostname;
        this.serverUrl = `${wsProtocol}//${wsHost}:8080`;
        
        window.addEventListener('beforeunload', () => {
            this.handleDisconnect();
        });
    }

    // Função para gerar ID único
    generateUUID() {
        // Verificar se crypto.randomUUID está disponível
        if (typeof crypto !== 'undefined' && crypto.randomUUID) {
            return crypto.randomUUID();
        }
        
        // Fallback para browsers que não suportam crypto.randomUUID
        const randomValues = new Uint8Array(16);
        if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
            crypto.getRandomValues(randomValues);
        } else {
            // Fallback para Math.random() se crypto não estiver disponível
            for (let i = 0; i < 16; i++) {
                randomValues[i] = Math.floor(Math.random() * 256);
            }
        }
        
        // Converter para string hexadecimal
        const uuid = Array.from(randomValues)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
            
        // Formatar como UUID
        return `${uuid.slice(0,8)}-${uuid.slice(8,12)}-${uuid.slice(12,16)}-${uuid.slice(16,20)}-${uuid.slice(20)}`;
    }

    initialize(playerName) {
        return new Promise((resolve, reject) => {
            if (this.isLocalMode) {
                resolve();
                return;
            }

            try {
                this.socket = new WebSocket(this.serverUrl);

                this.socket.onopen = () => {
                    console.log('Connected to game server');
                    this.createLocalPlayer(playerName);
                    
                    // Anunciar presença para outros jogadores
                    this.broadcastPlayerInfo();
                    resolve();
                };

                this.socket.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    this.handleMessage(data);
                };

                this.socket.onerror = (error) => {
                    console.error('Connection error. Switching to local mode...');
                    this.setupLocalMode(playerName);
                    resolve();
                };

                this.socket.onclose = () => {
                    if (!this.isLocalMode) {
                        console.log('Disconnected from server');
                        if (this.game.isGameRunning) {
                            this.setupLocalMode(playerName);
                        }
                    }
                };

            } catch (e) {
                console.error('Failed to connect. Using local mode.');
                this.setupLocalMode(playerName);
                resolve();
            }
        });
    }

    createLocalPlayer(playerName) {
        this.localPlayerId = this.generateUUID();
        const playerColor = this.getRandomColor();
        const newPlayer = new Player(this.localPlayerId, playerName, playerColor, this.game);
        
        this.game.players.set(this.localPlayerId, newPlayer);
        newPlayer.respawn(0);

        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.sendMessage({
                type: 'playerJoined',
                playerId: this.localPlayerId,
                name: playerName,
                color: playerColor,
                x: newPlayer.x,
                y: newPlayer.y,
                room: 0
            });
        }
    }

    setupLocalMode(playerName) {
        if (!this.isLocalMode) {
            this.isLocalMode = true;
            if (!this.localPlayerId) {
                this.createLocalPlayer(playerName);
            }
            if (this.socket) {
                this.socket.close();
                this.socket = null;
            }
        }
    }

    sendMessage(data) {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify(data));
        }
    }

    broadcastPosition(x, y, room) {
        this.sendMessage({
            type: 'playerMove',
            playerId: this.localPlayerId,
            x: x,
            y: y,
            room: room
        });
    }

    handleDisconnect() {
        if (this.socket) {
            this.sendMessage({
                type: 'playerLeft',
                playerId: this.localPlayerId
            });
            this.socket.close();
        }
    }

    handleMessage(data) {
        switch(data.type) {
            case 'playerJoined':
                if (data.playerId !== this.localPlayerId) {
                    const newPlayer = new Player(data.playerId, data.name, data.color, this.game);
                    newPlayer.x = data.x;
                    newPlayer.y = data.y;
                    newPlayer.currentRoom = data.room;
                    this.game.players.set(data.playerId, newPlayer);
                    
                    // Responder com informações do jogador local
                    this.broadcastPlayerInfo();
                }
                break;
            case 'playerInfo':
                if (data.playerId !== this.localPlayerId) {
                    let player = this.game.players.get(data.playerId);
                    if (!player) {
                        player = new Player(data.playerId, data.name, data.color, this.game);
                        this.game.players.set(data.playerId, player);
                    }
                    player.x = data.x;
                    player.y = data.y;
                    player.currentRoom = data.room;
                }
                break;
            case 'playerMove':
                if (data.playerId !== this.localPlayerId) {
                    const player = this.game.players.get(data.playerId);
                    if (player) {
                        player.x = data.x;
                        player.y = data.y;
                        player.currentRoom = data.room;
                    }
                }
                break;
            case 'playerLeft':
                if (data.playerId !== this.localPlayerId) {
                    console.log('Player left:', data.playerId);
                    this.game.players.delete(data.playerId);
                    // Forçar atualização do HUD
                    this.game.renderHUD();
                }
                break;
            case 'artifactCollected':
                if (data.playerId !== this.localPlayerId) {
                    const player = this.game.players.get(data.playerId);
                    if (player) {
                        player.collectArtifact();
                    }
                }
                break;
            case 'wolfPosition':
                if (this.game.wolf) {
                    this.game.wolf.x = data.x;
                    this.game.wolf.y = data.y;
                    this.game.wolf.currentRoom = data.room;
                    this.game.wolf.isParalyzed = data.isParalyzed;
                }
                break;
        }
    }

    getRandomColor() {
        const colors = ['#ff4444', '#44ff44', '#4444ff', '#ffff44', '#ff44ff', '#44ffff'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    updatePlayerPosition(data) {
        const player = this.game.players.get(data.playerId);
        if (player) {
            player.x = data.x;
            player.y = data.y;
            player.currentRoom = data.room;
        }
    }

    handleArtifactCollection(data) {
        // Atualizar estado dos artefatos
        const player = this.game.players.get(data.playerId);
        if (player) {
            player.collectArtifact();
        }
    }

    updateWolfState(data) {
        if (this.game.wolf) {
            this.game.wolf.x = data.x;
            this.game.wolf.y = data.y;
            this.game.wolf.currentRoom = data.room;
            this.game.wolf.isParalyzed = data.isParalyzed;
        }
    }

    addNewPlayer(data) {
        if (!this.game.players.has(data.playerId)) {
            const newPlayer = new Player(data.playerId, data.name, data.color, this.game);
            this.game.players.set(data.playerId, newPlayer);
        }
    }

    removePlayer(data) {
        this.game.players.delete(data.playerId);
    }

    broadcastArtifactCollection(playerId) {
        this.sendMessage({
            type: 'artifactCollected',
            playerId: playerId
        });
    }

    isHost() {
        // O primeiro jogador conectado é o host
        const players = Array.from(this.game.players.keys());
        return players[0] === this.localPlayerId;
    }

    broadcastPlayerInfo() {
        const localPlayer = this.game.players.get(this.localPlayerId);
        if (localPlayer) {
            this.sendMessage({
                type: 'playerInfo',
                playerId: this.localPlayerId,
                name: localPlayer.name,
                color: localPlayer.color,
                x: localPlayer.x,
                y: localPlayer.y,
                room: localPlayer.currentRoom
            });
        }
    }

    broadcastWolfPosition() {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.sendMessage({
                type: 'wolfPosition',
                x: this.game.wolf.x,
                y: this.game.wolf.y,
                room: this.game.wolf.currentRoom,
                isParalyzed: this.game.wolf.isParalyzed
            });
        }
    }
} 