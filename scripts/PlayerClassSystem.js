export default class PlayerClassSystem {
    constructor() {
        this.classes = {
            'Fighter': { str: 15, agi: 15, will: 15, ability: 'Second Wind', cooldown: 15000 },
            'Rogue': { str: 10, agi: 25, will: 10, ability: 'Hide', cooldown: 20000 },
            'Barbarian': { str: 25, agi: 10, will: 10, ability: 'Rage', cooldown: 25000 }
        };
    }

    applyClass(stats, playerClass) {
        if (this.classes[playerClass]) {
            const c = this.classes[playerClass];
            stats.attributes = { str: c.str, agi: c.agi, will: c.will };
            stats.maxHp = 80 + (c.str * 2);
            stats.hp = stats.maxHp;
            stats.class = playerClass;
        }
        return stats;
    }

    useAbility(id, stats, currentTick, timePerTick, cooldowns) {
        if (!stats || !stats.isPlayer) return null;

        const lastUseTick = cooldowns.get(id) || 0;
        const classDef = this.classes[stats.class];
        
        if (!classDef) return null;
        
        const cooldownTicks = Math.ceil(classDef.cooldown / timePerTick);
        if (currentTick < lastUseTick + cooldownTicks) return null; // On Cooldown

        cooldowns.set(id, currentTick);
        
        // Execute Ability
        let result = { type: 'ABILITY', ability: classDef.ability, id };
        
        switch (stats.class) {
            case 'Fighter': // Second Wind
                const heal = 40;
                stats.hp = Math.min(stats.maxHp, stats.hp + heal);
                result.effect = 'heal';
                result.value = heal;
                break;
            case 'Rogue': // Hide
                stats.invisible = true;
                result.effect = 'stealth';
                result.duration = 5000; // TODO: This should be handled by a tick-based BuffSystem
                setTimeout(() => { 
                    if (stats) stats.invisible = false; 
                }, 5000);
                break;
            case 'Barbarian': // Rage
                stats.damageBuff = 10;
                result.effect = 'buff';
                result.duration = 8000; // TODO: This should be handled by a tick-based BuffSystem
                setTimeout(() => { 
                    if (stats) stats.damageBuff = 0; 
                }, 8000);
                break;
        }
        
        return result;
    }
}
