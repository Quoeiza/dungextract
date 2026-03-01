export default class ProjectileSystem {
    constructor(combatSystem) {
        this.combatSystem = combatSystem;
    }

    createProjectile(ownerId, x, y, dx, dy, lootSystem) {
        const equip = lootSystem.getEquipment(ownerId);
        const weapon = equip.weapon;
        let config = null;
        if (weapon) config = lootSystem.getItemConfig(weapon.itemId);

        if (config && config.range > 1) {
            const mag = Math.sqrt(dx*dx + dy*dy);
            const vx = mag === 0 ? 0 : dx/mag;
            const vy = mag === 0 ? 0 : dy/mag;
            
            if (vx === 0 && vy === 0) return null;

            return {
                id: `proj_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                x, y, vx, vy,
                speed: 15,
                ownerId,
                damage: config.stats.damage
            };
        }
        return null;
    }

    updateProjectiles(dt, projectiles, gridSystem) {
        const projSpeed = dt / 1000;
        
        for (let i = projectiles.length - 1; i >= 0; i--) {
            const p = projectiles[i];
            
            const totalMove = p.speed * projSpeed;
            const steps = Math.ceil(totalMove / 0.5);
            const stepMove = totalMove / steps;
            
            let hit = false;
            for (let s = 0; s < steps; s++) {
                p.x += p.vx * stepMove;
                p.y += p.vy * stepMove;

                const gridX = Math.round(p.x);
                const gridY = Math.round(p.y);

                if (!gridSystem.isWalkable(gridX, gridY)) {
                    projectiles.splice(i, 1);
                    hit = true;
                    break;
                }

                const hitId = gridSystem.getEntityAt(gridX, gridY);
                if (hitId && hitId !== p.ownerId) {
                    this.combatSystem.applyDamage(hitId, p.damage, p.ownerId);
                    projectiles.splice(i, 1);
                    hit = true;
                    break;
                }
            }
        }
    }
}
