// Version V1.3 - Expanded Skill Tree Module
const SkillTree = {
    nodes: {
        // TIER 1
        overclock_efficiency: {
            id: "overclock_efficiency",
            name: "Overclock Optimisé",
            description: "Réduit le coût des améliorations de clic de 15%.",
            cost: 10000,
            unlocked: false,
            req: null,
            effect: { type: "clickCostMultiplier", value: 0.85 }
        },
        data_siphon: {
            id: "data_siphon",
            name: "Siphon de Données",
            description: "Multiplie tous les revenus passifs par 1.5.",
            cost: 50000,
            unlocked: false,
            req: "overclock_efficiency",
            effect: { type: "bpsMultiplier", value: 1.5 }
        },

        // TIER 2
        botnet_horde: {
            id: "botnet_horde",
            name: "Réseau Botnet Zombie",
            description: "Chaque virus installé augmente la production globale de 2%.",
            cost: 150000,
            unlocked: false,
            req: "data_siphon",
            effect: { type: "virusSynergy", value: 0.02 }
        },
        quantum_crypto: {
            id: "quantum_crypto",
            name: "Cryptographie Quantique",
            description: "Chaque clic génère 1% du BPS total.",
            cost: 500000,
            unlocked: false,
            req: "data_siphon",
            effect: { type: "clickPercentOfBps", value: 0.01 }
        },

        // TIER 3
        zeroday_exploit: {
            id: "zeroday_exploit",
            name: "Exploit Zero-Day",
            description: "Multiplie la puissance de clic manuel par 3.",
            cost: 2000000,
            unlocked: false,
            req: "quantum_crypto",
            effect: { type: "clickPowerMultiplier", value: 3.0 }
        },
        ai_deep_learning: {
            id: "ai_deep_learning",
            name: "IA d'Infiltration Autonome",
            description: "Génère un bonus passif global de +100% de Data.",
            cost: 10000000,
            unlocked: false,
            req: "zeroday_exploit",
            effect: { type: "bpsMultiplier", value: 2.0 }
        }
    },

    // Méthode pour tenter de débloquer une compétence
    unlockNode(nodeId, currentBytes) {
        const node = this.nodes[nodeId];
        if (!node) return { success: false, message: "Nœud introuvable dans la matrice." };
        if (node.unlocked) return { success: false, message: "Compétence déjà débloquée." };
        if (node.req && !this.nodes[node.req].unlocked) {
            return { success: false, message: "Prérequis système non satisfait." };
        }
        if (currentBytes < node.cost) {
            return { success: false, message: "Octets insuffisants." };
        }

        node.unlocked = true;
        return { 
            success: true, 
            cost: node.cost, 
            effect: node.effect, 
            message: `Compétence "${node.name}" débloquée avec succès !` 
        };
    },

    // Récupérer la liste de tous les effets actifs
    getUnlockedEffects() {
        return Object.values(this.nodes)
            .filter(node => node.unlocked)
            .map(node => node.effect);
    }
};