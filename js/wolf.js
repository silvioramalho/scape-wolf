class Wolf {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.speed = 3;
        this.currentRoom = 0;
        this.width = 60;
        this.height = 80;
        this.isParalyzed = false;
        this.paralyzedTime = 0;
        this.difficultyMultiplier = 1;
    }

    update(targetPlayer) {
        if (this.isParalyzed) {
            this.paralyzedTime--;
            if (this.paralyzedTime <= 0) {
                this.isParalyzed = false;
            }
            return;
        }

        if (targetPlayer) {
            // Movimento em direção ao jogador
            const dx = targetPlayer.x - this.x;
            const dy = targetPlayer.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 0) {
                this.x += (dx / distance) * this.speed * this.difficultyMultiplier;
                this.y += (dy / distance) * this.speed * this.difficultyMultiplier;
            }
        }
    }

    paralyze() {
        this.isParalyzed = true;
        this.paralyzedTime = 100; // Duração da paralisia em frames
    }

    increaseDifficulty() {
        this.difficultyMultiplier += 0.1;
    }

    checkCollision(player) {
        return !this.isParalyzed &&
               this.x < player.x + player.width &&
               this.x + this.width > player.x &&
               this.y < player.y + player.height &&
               this.y + this.height > player.y;
    }

    teleportToRoom(room) {
        this.currentRoom = room;
        this.x = Math.random() * 800;
        this.y = Math.random() * 600;
    }

    draw(ctx) {
        // Desenhar sombra
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(this.x + this.width/2, this.y + this.height - 10, 
                   this.width/2, this.height/4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Desenhar corpo do lobo
        ctx.fillStyle = this.isParalyzed ? '#666666' : '#880000';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        
        // Desenhar olhos
        ctx.fillStyle = this.isParalyzed ? '#999999' : '#ff0000';
        ctx.beginPath();
        ctx.arc(this.x + this.width/3, this.y + this.height/3, 5, 0, Math.PI * 2);
        ctx.arc(this.x + (this.width * 2/3), this.y + this.height/3, 5, 0, Math.PI * 2);
        ctx.fill();
    }
} 