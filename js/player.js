class Player {
    constructor(id, name, color, game) {
        this.id = id;
        this.name = name;
        this.color = color;
        this.game = game;
        this.x = 0;
        this.y = 0;
        this.speed = 5;
        this.lives = 3;
        this.artifacts = 0;
        this.currentRoom = 0;
        this.teasers = 3; // Número inicial de paralisadores
        this.isAlive = true;

        // Ajustar dimensões do sprite baseado no spritesheet.json
        this.spriteWidth = 128;   // Largura de cada frame (w no json)
        this.spriteHeight = 128;  // Altura de cada frame (h no json)
        
        // Dimensões de renderização (reduzidas para melhor jogabilidade)
        this.width = 48;     // Largura da área de colisão
        this.height = 48;    // Altura da área de colisão
        
        // Dimensões de renderização do sprite
        this.renderWidth = 64;    // Largura de renderização do sprite
        this.renderHeight = 64;   // Altura de renderização do sprite

        this.sprite = new Sprite(
            document.getElementById('player-sprite'),
            this.spriteWidth,
            this.spriteHeight,
            4,                    // Total de frames no spritesheet
            0.15                  // Velocidade da animação
        );
        
        this.lastMovement = { x: 0, y: 0 };
        this.moving = false;
    }

    move(direction) {
        const oldX = this.x;
        const oldY = this.y;
        this.moving = true;  // Indica que está se movendo
        
        switch(direction) {
            case 'up':
                this.y -= this.speed;
                this.sprite.setAnimation('walkUp');
                break;
            case 'down':
                this.y += this.speed;
                this.sprite.setAnimation('walkDown');
                break;
            case 'left':
                this.x -= this.speed;
                this.sprite.setAnimation('walkLeft');
                break;
            case 'right':
                this.x += this.speed;
                this.sprite.setAnimation('walkRight');
                break;
        }

        // Se não houve movimento real, voltar para idle
        if (this.x === oldX && this.y === oldY) {
            this.moving = false;
            this.sprite.setAnimation('idle');
        }

        this.lastMovement = {
            x: this.x - oldX,
            y: this.y - oldY
        };
    }

    useTeaser() {
        if (this.teasers > 0) {
            this.teasers--;
            return true;
        }
        return false;
    }

    collectArtifact() {
        this.artifacts++;
        return this.artifacts >= 8; // Retorna true se o jogador venceu
    }

    takeDamage() {
        this.lives--;
        this.isAlive = this.lives > 0;
        return this.isAlive;
    }

    respawn(room) {
        if (this.isAlive) {
            this.currentRoom = room || Math.floor(Math.random() * 9);
            
            let validPosition = false;
            let attempts = 0;
            const maxAttempts = 100;
            
            while (!validPosition && attempts < maxAttempts) {
                this.x = Math.random() * (this.game.canvas.width - this.width - 200) + 100;
                this.y = Math.random() * (this.game.canvas.height - this.height - 200) + 100;
                
                const currentRoom = this.game.rooms[this.currentRoom];
                if (currentRoom) {
                    validPosition = !currentRoom.checkCollision(this.x, this.y, this.width, this.height);
                }
                attempts++;
            }
            
            if (!validPosition) {
                this.x = this.game.canvas.width / 2;
                this.y = this.game.canvas.height / 2;
            }
            
            if (this.game.network) {
                this.game.network.broadcastPosition(this.x, this.y, this.currentRoom);
            }
            
            console.log('Player respawned at:', this.x, this.y, 'in room', this.currentRoom);
        }
    }

    draw(ctx) {
        // Se não está se movendo, garantir que está em idle
        if (!this.moving) {
            this.sprite.setAnimation('idle');
        }
        this.moving = false;
        
        // Atualizar animação
        this.sprite.update(1/60);
        
        // Calcular posição de renderização centralizada
        const scale = 0.5;  // Fator de escala para reduzir o tamanho do sprite
        const renderWidth = this.spriteWidth * scale;
        const renderHeight = this.spriteHeight * scale;
        
        // Centralizar o sprite em relação à área de colisão
        const renderX = this.x - (renderWidth - this.width) / 2;
        const renderY = this.y - (renderHeight - this.height) / 2;
        
        // Desenhar sprite
        this.sprite.draw(ctx, renderX, renderY, renderWidth, renderHeight);
        
        // Desenhar nome do jogador
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.name, this.x + this.width/2, this.y - 5);
        
        // Debug: desenhar área de colisão
        // ctx.strokeStyle = 'red';
        // ctx.strokeRect(this.x, this.y, this.width, this.height);
    }
} 