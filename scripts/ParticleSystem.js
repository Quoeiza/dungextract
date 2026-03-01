export default class ParticleSystem {
    constructor() {
        this.particles = [];
        this.particlePool = [];
        this.settings = { particles: true };
    }

    applySettings(settings) {
        this.settings = settings;
    }

    spawnParticle(x, y, dirX, dirY, color = '#800', speedOverride = null, sizeOverride = null) {
        if (!this.settings.particles) return;
        const p = this.particlePool.pop() || { x:0, y:0, vx:0, vy:0, life:0, maxLife:0 };
        p.x = x + (Math.random() - 0.5) * 0.2;
        p.y = y + (Math.random() - 0.5) * 0.2;
        
        const speed = speedOverride !== null ? speedOverride : (0.05 + Math.random() * 0.15);
        const spread = 0.8; // High spread
        
        p.vx = dirX * speed + (Math.random() - 0.5) * spread * speed;
        p.vy = dirY * speed + (Math.random() - 0.5) * spread * speed;
        
        p.life = 1.0;
        p.maxLife = 1.0;
        p.size = sizeOverride !== null ? sizeOverride : (0.02 + Math.random() * 0.03);
        p.color = color;
        this.particles.push(p);
    }

    updateAndDraw(ctx, camera, tileSize) {
        const dt = 16 / 1000; // Approx dt
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= dt;
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.9; // Drag
            p.vy *= 0.9;

            if (p.life <= 0) {
                this.particlePool.push(p);
                this.particles.splice(i, 1);
                continue;
            }

            const sx = (p.x * tileSize) - camera.x;
            const sy = (p.y * tileSize) - camera.y;
            ctx.fillStyle = p.color || '#800';
            ctx.fillRect(sx, sy, tileSize * p.size, tileSize * p.size);
        }
    }
}
