// Version V1.1 - Etat partagé entre le jeu principal (Game.js) et l'arbre de compétences (skill_tree.js)
// Sans ce fichier, les deux pages lisaient/écrivaient des clés localStorage différentes
// et n'avaient donc aucune idée de l'état de l'autre page.

const HTW_STORAGE_KEY = "htw_gamestate_v1";

// Formatage des octets, utilisé par Game.js ET skill_tree.html pour un affichage cohérent.
function formatBytes(bytes) {
    if (!bytes || bytes === 0) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB'];
    const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(1000));
    const idx = Math.min(Math.max(i, 0), sizes.length - 1);
    return parseFloat((bytes / Math.pow(1000, idx)).toFixed(idx === 0 ? 0 : 2)) + ' ' + sizes[idx];
}

const GameState = {
    defaults() {
        return {
            totalBytes: 0,
            bytesPerClick: 1,
            clickUpgradeCost: 50,
            clickUpgradeCount: 0,
            upgrades: {},
            currencies: { tether: 0, solana: 0, ethereum: 0, bitcoin: 0 },
            skills: {},
            lastSeen: null // horodatage utilisé par la compétence "Ver Autonome" (gains hors-ligne)
        };
    },

    // Lit l'état complet et le fusionne avec les valeurs par défaut (pour ne jamais planter
    // si un ancien save ou un champ manquant existe).
    load() {
        const raw = localStorage.getItem(HTW_STORAGE_KEY);
        const base = this.defaults();
        if (!raw) return base;
        try {
            const parsed = JSON.parse(raw);
            const merged = Object.assign(base, parsed);
            merged.currencies = Object.assign(base.currencies, parsed.currencies || {});
            merged.upgrades = parsed.upgrades || {};
            merged.skills = parsed.skills || {};
            return merged;
        } catch (e) {
            return base;
        }
    },

    // Sauvegarde partielle : ne touche QUE les champs fournis, sans écraser ce que
    // l'autre page (Game.js ou skill_tree.js) a écrit de son côté.
    save(partial) {
        const current = this.load();
        const updated = Object.assign({}, current, partial);
        if (partial.currencies) updated.currencies = Object.assign({}, current.currencies, partial.currencies);
        if (partial.upgrades) updated.upgrades = Object.assign({}, current.upgrades, partial.upgrades);
        if (partial.skills) updated.skills = Object.assign({}, current.skills, partial.skills);
        localStorage.setItem(HTW_STORAGE_KEY, JSON.stringify(updated));
        return updated;
    }
};
