class Artifact {
    constructor(type = 'key') {
        this.type = type;
        this.x = 0;
        this.y = 0;
        this.room = 0;
        this.isCollected = false;
        this.width = 30;
        this.height = 30;
        this.spawnTime = Date.now();
        this.warningPlayed = false;
        this.pulseEffect = 0;
    }

    spawn(rooms) {
        const randomRoom = Math.floor(Math.random() * rooms.length);
        this.room = randomRoom;
        this.x = Math.random() * (800 - this.width);
        this.y = Math.random() * (600 - this.height);
        this.isCollected = false;
        this.warningPlayed = false;
        this.spawnTime = Date.now();
    }

    checkCollision(player) {
        if (this.isCollected || player.currentRoom !== this.room) return false;

        return this.x < player.x + player.width &&
               this.x + this.width > player.x &&
               this.y < player.y + player.height &&
               this.y + this.height > player.y;
    }

    collect() {
        this.isCollected = true;
    }

    shouldPlayWarning() {
        if (!this.warningPlayed && !this.isCollected) {
            this.warningPlayed = true;
            return true;
        }
        return false;
    }

    draw(ctx) {
        if (!this.isCollected) {
            this.pulseEffect = (Math.sin(Date.now() * 0.005) + 1) * 0.5;
            
            ctx.fillStyle = `rgba(255, 255, 0, ${this.pulseEffect * 0.3})`;
            ctx.beginPath();
            ctx.arc(this.x + this.width/2, this.y + this.height/2, 
                   this.width * (1 + this.pulseEffect * 0.3), 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#FFD700';
            ctx.fillRect(this.x, this.y, this.width, this.height);
            
            ctx.strokeStyle = '#FFA500';
            ctx.lineWidth = 2;
            ctx.strokeRect(this.x, this.y, this.width, this.height);
        }
    }
} 