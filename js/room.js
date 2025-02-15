class Room {
    constructor(id, backgroundImage) {
        this.id = id;
        this.backgroundImage = backgroundImage;
        this.width = 1024;
        this.height = 768;
        this.connections = new Map(); // Mapa de conexões com outras salas
        this.obstacles = []; // Array de obstáculos na sala
        this.doors = new Map(); // Armazenar posições das portas
        this.bgImage = document.getElementById('bg-room');
        
        // Criar layout fixo baseado no ID da sala
        this.createFixedLayout();
        this.setupConnections();
    }

    setupConnections() {
        const row = Math.floor(this.id / 3);
        const col = this.id % 3;

        // Conectar com sala à esquerda
        if (col > 0) {
            this.addConnection('left', this.id - 1);
        }
        // Conectar com sala à direita
        if (col < 2) {
            this.addConnection('right', this.id + 1);
        }
        // Conectar com sala acima
        if (row > 0) {
            this.addConnection('up', this.id - 3);
        }
        // Conectar com sala abaixo
        if (row < 2) {
            this.addConnection('down', this.id + 3);
        }
    }

    createFixedLayout() {
        const doorWidth = 60;
        const doorHeight = 80;
        const row = Math.floor(this.id / 3);
        const col = this.id % 3;

        // Adicionar portas baseado na posição da sala na grade 3x3
        if (row > 0) { // Porta superior
            this.doors.set('up', {
                x: this.width / 2 - doorWidth / 2,
                y: 0,
                width: doorWidth,
                height: doorHeight
            });
        }
        if (row < 2) { // Porta inferior
            this.doors.set('down', {
                x: this.width / 2 - doorWidth / 2,
                y: this.height - doorHeight,
                width: doorWidth,
                height: doorHeight
            });
        }
        if (col > 0) { // Porta esquerda
            this.doors.set('left', {
                x: 0,
                y: this.height / 2 - doorHeight / 2,
                width: doorWidth,
                height: doorHeight
            });
        }
        if (col < 2) { // Porta direita
            this.doors.set('right', {
                x: this.width - doorWidth,
                y: this.height / 2 - doorHeight / 2,
                width: doorWidth,
                height: doorHeight
            });
        }

        // Layouts fixos para cada sala (garantindo que não bloqueie as portas)
        switch(this.id) {
            case 0: // Sala superior esquerda
                this.addObstacle(200, 200, 200, 50);
                this.addObstacle(600, 400, 200, 50);
                break;
            case 1: // Sala superior centro
                this.addObstacle(300, 200, 400, 50);
                this.addObstacle(100, 500, 200, 50);
                this.addObstacle(700, 500, 200, 50);
                break;
            case 2: // Sala superior direita
                this.addObstacle(200, 400, 200, 50);
                this.addObstacle(600, 200, 200, 50);
                break;
            case 3: // Sala meio esquerda
                this.addObstacle(300, 100, 50, 200);
                this.addObstacle(700, 500, 50, 200);
                break;
            case 4: // Sala central
                this.addObstacle(412, 284, 200, 200); // Obstáculo central
                break;
            case 5: // Sala meio direita
                this.addObstacle(300, 500, 50, 200);
                this.addObstacle(700, 100, 50, 200);
                break;
            case 6: // Sala inferior esquerda
                this.addObstacle(400, 200, 200, 50);
                this.addObstacle(200, 500, 200, 50);
                break;
            case 7: // Sala inferior centro
                this.addObstacle(200, 300, 200, 50);
                this.addObstacle(600, 300, 200, 50);
                break;
            case 8: // Sala inferior direita
                this.addObstacle(300, 200, 200, 50);
                this.addObstacle(500, 500, 200, 50);
                break;
        }
    }

    addConnection(direction, roomId) {
        this.connections.set(direction, roomId);
    }

    getNextRoom(direction) {
        return this.connections.get(direction);
    }

    addObstacle(x, y, width, height) {
        this.obstacles.push({ x, y, width, height });
    }

    checkCollision(x, y, width, height) {
        // Verificar colisão com as bordas da sala
        if (x < 0 || x + width > this.width || y < 0 || y + height > this.height) {
            return true;
        }

        // Verificar colisão com obstáculos
        return this.obstacles.some(obstacle => 
            x < obstacle.x + obstacle.width &&
            x + width > obstacle.x &&
            y < obstacle.y + obstacle.height &&
            y + height > obstacle.y
        );
    }

    draw(ctx) {
        // Desenhar fundo
        if (this.bgImage) {
            ctx.drawImage(this.bgImage, -80, -30, ctx.canvas.width+125, ctx.canvas.height+60);
        } else {
            // Fallback para cor sólida
            ctx.fillStyle = '#333';
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        }

        // Desenhar obstáculos
        ctx.fillStyle = '#666';
        this.obstacles.forEach(obstacle => {
            ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
        });

        // Desenhar portas
        this.doors.forEach((door, direction) => {
            ctx.fillStyle = '#8B4513'; // Cor de madeira
            ctx.fillRect(door.x, door.y, door.width, door.height);
            
            // Adicionar detalhes à porta
            ctx.fillStyle = '#FFD700'; // Dourado para a maçaneta
            const knobSize = 8;
            switch(direction) {
                case 'left':
                    ctx.fillRect(door.x + door.width - knobSize * 2, 
                               door.y + door.height/2 - knobSize/2, 
                               knobSize, knobSize);
                    break;
                case 'right':
                    ctx.fillRect(door.x + knobSize, 
                               door.y + door.height/2 - knobSize/2, 
                               knobSize, knobSize);
                    break;
                case 'up':
                case 'down':
                    ctx.fillRect(door.x + door.width/2 - knobSize/2, 
                               direction === 'up' ? door.y + door.height - knobSize * 2 : door.y + knobSize, 
                               knobSize, knobSize);
                    break;
            }
        });
    }

    isDoorArea(x, y, width, height) {
        const doorMargin = 20; // Margem de tolerância para detecção da porta
        
        for (const [direction, door] of this.doors) {
            const playerCenter = {
                x: x + width / 2,
                y: y + height / 2
            };
            
            const doorCenter = {
                x: door.x + door.width / 2,
                y: door.y + door.height / 2
            };
            
            const distance = Math.sqrt(
                Math.pow(playerCenter.x - doorCenter.x, 2) +
                Math.pow(playerCenter.y - doorCenter.y, 2)
            );
            
            if (distance < doorMargin + Math.max(door.width, door.height) / 2) {
                return direction;
            }
        }
        return null;
    }
} 