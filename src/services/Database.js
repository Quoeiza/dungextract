export default class Database {
    constructor() {
        this.storageKey = 'dungextract_player_data_v1';
    }

    async getPlayer() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : { name: 'Unknown', gold: 0, extractions: 0 };
        } catch (e) {
            console.warn("Database: LocalStorage access denied or failed", e);
            return { name: 'Unknown', gold: 0, extractions: 0 };
        }
    }

    async savePlayer(playerData) {
        try {
            const current = await this.getPlayer();
            const updated = { ...current, ...playerData };
            localStorage.setItem(this.storageKey, JSON.stringify(updated));
            console.log("DB: Saved player data", updated);
            return true;
        } catch (e) {
            console.warn("Database: Save failed", e);
            return false;
        }
    }

    async updatePlayer(updates) {
        const current = await this.getPlayer();
        const updated = { ...current, ...updates };
        await this.savePlayer(updated);
        return updated;
    }

    async addRewards(goldReward, extractionCount = 0) {
        const current = await this.getPlayer();
        const updated = { 
            ...current, 
            gold: (current.gold || 0) + goldReward,
            extractions: (current.extractions || 0) + extractionCount
        };
        await this.savePlayer(updated);
        return updated;
    }
}