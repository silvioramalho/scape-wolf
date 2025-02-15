class Sprite {
    constructor(image, frameWidth, frameHeight, frameCount, animationSpeed = 0.1) {
        this.image = image;
        this.frameWidth = frameWidth;
        this.frameHeight = frameHeight;
        this.frameCount = frameCount;
        this.currentFrame = 0;
        this.animationSpeed = animationSpeed;
        this.animationTimer = 0;
        
        // Configurar animações baseado no spritesheet.json
        this.animations = {
            idle: { startFrame: 0, endFrame: 0 },          // Primeiro frame parado
            walkRight: { startFrame: 0, endFrame: 3 },     // Todos os 4 frames
            walkLeft: { startFrame: 0, endFrame: 3 },      // Mesmos frames espelhados
            walkUp: { startFrame: 0, endFrame: 3 },        // Mesmos frames rotacionados
            walkDown: { startFrame: 0, endFrame: 3 }       // Mesmos frames rotacionados
        };
        this.currentAnimation = 'idle';
        this.direction = 1; // 1 para direita, -1 para esquerda (espelhamento)
    }

    update(deltaTime) {
        // Só atualizar a animação se não estiver em idle
        if (this.currentAnimation !== 'idle') {
            this.animationTimer += deltaTime;
            if (this.animationTimer >= this.animationSpeed) {
                this.animationTimer = 0;
                const anim = this.animations[this.currentAnimation];
                this.currentFrame++;
                if (this.currentFrame > anim.endFrame) {
                    this.currentFrame = anim.startFrame;
                }
            }
        }
    }

    draw(ctx, x, y, width, height) {
        // Calcular posição do frame atual no sprite sheet
        const col = this.currentFrame % 2;  // 2 colunas no spritesheet
        const row = Math.floor(this.currentFrame / 2);  // 2 linhas no spritesheet
        
        const sourceX = col * this.frameWidth + 1; // +1 pelo offset no json
        const sourceY = row * this.frameHeight + 1; // +1 pelo offset no json

        // Salvar contexto para transformações
        ctx.save();
        
        // Configurar transformação baseada na direção
        if (this.currentAnimation === 'walkLeft') {
            // Espelhar horizontalmente para andar para esquerda
            ctx.translate(x + width, y);
            ctx.scale(-1, 1);
            ctx.drawImage(
                this.image,
                sourceX, sourceY,
                this.frameWidth, this.frameHeight,
                0, 0,
                width, height
            );
        } else {
            // Desenho normal para outras direções
            ctx.drawImage(
                this.image,
                sourceX, sourceY,
                this.frameWidth, this.frameHeight,
                x, y,
                width, height
            );
        }
        
        ctx.restore();
    }

    setAnimation(name) {
        if (this.currentAnimation !== name && this.animations[name]) {
            this.currentAnimation = name;
            this.currentFrame = this.animations[name].startFrame;
            this.animationTimer = 0;
        }
    }
} 