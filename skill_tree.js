// Version V3.2 - Multi-Currency & Upgrade Skill Tree System (branché sur le state partagé)
const SkillTree = {
    currencies: { tether: 0, solana: 0, ethereum: 0, bitcoin: 0 },
    totalBytes: 0,

    // Tier 1: Tether  = 5 KB   (5 000 B)               contre des bytes uniquement
    // Tier 2: Solana   = 5 MB   (5 000 000 B)           contre des bytes + 10 Tether
    // Tier 3: Ethereum = 5 GB   (5 000 000 000 B)        contre des bytes + 10 Solana
    // Tier 4: Bitcoin  = 5 TB   (5 000 000 000 000 B)     contre des bytes + 10 Ethereum
    // Chaque palier coûte 1000x plus de bytes que le précédent (KB -> MB -> GB -> TB).
    cryptoRates: {
        tether:   { byteCost: 5000,                reqCrypto: null,       reqAmount: 0  },
        solana:   { byteCost: 5000000,             reqCrypto: "tether",   reqAmount: 10 },
        ethereum: { byteCost: 5000000000,          reqCrypto: "solana",   reqAmount: 10 },
        bitcoin:  { byteCost: 5000000000000,       reqCrypto: "ethereum", reqAmount: 10 }
    },

    // Chaque nœud a un "effect" typé, lu par Game.js via getBonuses().
    // Chaque tier a maintenant 2 compétences en parallèle (sauf le tier 4 qui en a 3,
    // dont une capstone finale) pour donner un vrai choix sans obliger à tout acheter.
    nodes: {
        usdt_overclock:     { id: "usdt_overclock",     name: "Trading Bot V1",          tier: 1, currency: "tether",   cost: 5, effect: { type: "miningSpeed", value: 0.20 }, description: "Boost la vitesse de minage (production passive) de 20%.", unlocked: false, req: null },
        keylogger:          { id: "keylogger",          name: "Keylogger",               tier: 1, currency: "tether",   cost: 4, effect: { type: "clickFlat", value: 1 },      description: "Capture chaque frappe : +1 byte fixe garanti à chaque clic.", unlocked: false, req: null },

        sol_validator:      { id: "sol_validator",      name: "Validateur Solana",       tier: 2, currency: "solana",   cost: 3, effect: { type: "passiveMult", value: 2 },    description: "Double le revenu passif (bytes/s).", unlocked: false, req: "usdt_overclock" },
        ddos_distribue:     { id: "ddos_distribue",     name: "Attaque DDoS Distribuée", tier: 2, currency: "solana",   cost: 4, effect: { type: "miningSpeed", value: 0.15 }, description: "Sature les serveurs cibles : +15% de vitesse de minage en plus.", unlocked: false, req: "usdt_overclock" },

        eth_smart_contract: { id: "eth_smart_contract", name: "Smart Contracts Avancés", tier: 3, currency: "ethereum", cost: 2, effect: { type: "costReduction", value: 0.30 }, description: "Réduit les coûts du shop (virus) de 30%.", unlocked: false, req: "sol_validator" },
        zero_day_exploit:   { id: "zero_day_exploit",   name: "Exploit Zero-Day",        tier: 3, currency: "ethereum", cost: 2, effect: { type: "crit", chance: 0.05, multiplier: 3 }, description: "5% de chances à chaque clic de tripler le gain de bytes.", unlocked: false, req: "sol_validator" },

        btc_genesis_block:  { id: "btc_genesis_block",  name: "Bloc Genesis",            tier: 4, currency: "bitcoin",  cost: 1, effect: { type: "globalMult", value: 10 },    description: "Multiplie tous vos gains globaux (clic + passif) par 10.", unlocked: false, req: "eth_smart_contract" },
        ver_autonome:       { id: "ver_autonome",       name: "Ver Autonome",            tier: 4, currency: "bitcoin",  cost: 1, effect: { type: "offlineEarnings", value: 0.5, capHours: 4 }, description: "Continue de miner pendant votre absence : 50% de votre production, plafonné à 4h.", unlocked: false, req: "eth_smart_contract" },
        blanchiment_argent: { id: "blanchiment_argent", name: "Blanchiment d'Argent",    tier: 4, currency: "bitcoin",  cost: 2, effect: { type: "cryptoDiscount", value: 0.15 }, description: "Réduit de 15% le coût en bytes de tous vos échanges de cryptomonnaie.", unlocked: false, req: "btc_genesis_block" }
    },

    // Recharge tout depuis le state partagé (bytes, cryptos, nœuds débloqués).
    load() {
        const state = GameState.load();
        this.totalBytes = state.totalBytes || 0;
        this.currencies = Object.assign({ tether: 0, solana: 0, ethereum: 0, bitcoin: 0 }, state.currencies || {});
        for (let key in this.nodes) {
            this.nodes[key].unlocked = !!(state.skills && state.skills[key]);
        }
    },

    // Écrit uniquement les champs qui appartiennent à l'arbre de compétences
    // (bytes, cryptos, skills) sans toucher au reste de la sauvegarde du jeu.
    persist() {
        const skillsSnapshot = {};
        for (let key in this.nodes) skillsSnapshot[key] = this.nodes[key].unlocked;
        GameState.save({
            totalBytes: this.totalBytes,
            currencies: this.currencies,
            skills: skillsSnapshot
        });
    },

    buyCrypto(cryptoType) {
        this.load();
        const rate = this.cryptoRates[cryptoType];
        if (!rate) return { success: false, message: "Crypto inconnue." };
        const bonuses = this.getBonuses();
        const effectiveCost = Math.floor(rate.byteCost * bonuses.cryptoDiscountMult);
        if (this.totalBytes < effectiveCost) return { success: false, message: "Bytes insuffisants !" };
        if (rate.reqCrypto && (this.currencies[rate.reqCrypto] || 0) < rate.reqAmount) {
            return { success: false, message: `Requis : ${rate.reqAmount} ${rate.reqCrypto.toUpperCase()}` };
        }

        this.totalBytes -= effectiveCost;
        if (rate.reqCrypto) this.currencies[rate.reqCrypto] -= rate.reqAmount;
        this.currencies[cryptoType] = (this.currencies[cryptoType] || 0) + 1;

        this.persist();
        return { success: true, message: `1 ${cryptoType.toUpperCase()} acheté !` };
    },

    buySkill(nodeId) {
        this.load();
        const node = this.nodes[nodeId];
        if (!node || node.unlocked) return { success: false, message: "Compétence déjà débloquée ou introuvable." };
        if (node.req && !this.nodes[node.req].unlocked) return { success: false, message: "Prérequis non débloqué." };
        if ((this.currencies[node.currency] || 0) < node.cost) return { success: false, message: `Fonds insuffisants en ${node.currency.toUpperCase()}` };

        this.currencies[node.currency] -= node.cost;
        node.unlocked = true;
        this.persist();
        return { success: true, message: `Amélioration ${node.name} activée !` };
    },

    // Utilisé par Game.js à chaque calcul de production/coût pour savoir quels bonus sont actifs.
    getBonuses() {
        this.load();
        let miningSpeedMult = 1, passiveMult = 1, costMult = 1, globalMult = 1;
        let clickFlatBonus = 0, critChance = 0, critMultiplier = 1;
        let offlineRate = 0, offlineCapHours = 0, cryptoDiscountMult = 1;
        for (let key in this.nodes) {
            const n = this.nodes[key];
            if (!n.unlocked) continue;
            switch (n.effect.type) {
                case "miningSpeed": miningSpeedMult *= (1 + n.effect.value); break;
                case "passiveMult": passiveMult *= n.effect.value; break;
                case "costReduction": costMult *= (1 - n.effect.value); break;
                case "globalMult": globalMult *= n.effect.value; break;
                case "clickFlat": clickFlatBonus += n.effect.value; break;
                case "crit": critChance += n.effect.chance; critMultiplier *= n.effect.multiplier; break;
                case "offlineEarnings": offlineRate = Math.max(offlineRate, n.effect.value); offlineCapHours = Math.max(offlineCapHours, n.effect.capHours); break;
                case "cryptoDiscount": cryptoDiscountMult *= (1 - n.effect.value); break;
            }
        }
        return { miningSpeedMult, passiveMult, costMult, globalMult, clickFlatBonus, critChance, critMultiplier, offlineRate, offlineCapHours, cryptoDiscountMult };
    }
};

SkillTree.load();
