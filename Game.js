// Variable d'état global
let totalBytes = 0;
let bytesPerSecond = 0;

let upgrades = {
    miner: { count: 0 },
    trojan: { count: 0 },
    ransomware: { count: 0 },
    bootSector: { count: 0 },
    fileVirus: { count: 0 }
};

let infectionState = {
    selectedCountry: null,
    infectionRate: 0,
    antivirusRate: 0,
    encryptionLevel: 0,
    zeroDayActiveTime: 0,
    isLockdown: false,
    winTargetBytes: 100000000000000
};

// Initialisation de la UI du choix de pays
function initCountrySelection() {
    const select = document.getElementById('country-select');
    COUNTRY_GROUPS.forEach(group => {
        group.countries.forEach(country => {
            const opt = document.createElement('option');
            opt.value = country;
            opt.textContent = `[Tier ${group.tier}] ${country}`;
            select.appendChild(opt);
        });
    });

    select.addEventListener('change', () => {
        const selected = getCountryData(select.value);
        document.getElementById('country-stats-preview').innerHTML = 
            `<p>Tier : <b>${selected.tier}</b> | Mult. Bytes : <b>x${selected.multBytes}</b> | Vitesse AV (Anti-Virus) : <b>x${selected.avSpeed}</b></p>`;
    });
    select.dispatchEvent(new Event('change'));

    document.getElementById('confirm-country-btn').addEventListener('click', () => {
        infectionState.selectedCountry = getCountryData(select.value);
        document.getElementById('country-modal').classList.add('hidden');
    });
}

function getCountryData(countryName) {
    return COUNTRY_GROUPS.find(g => g.countries.includes(countryName));
}

// Multiplicateur sur les gains de Bytes
function getAdjustedByteGain(baseGain) {
    let mult = infectionState.selectedCountry ? infectionState.selectedCountry.multBytes : 1.0;
    if (infectionState.isLockdown) mult *= 0.1; // Malus de 90% si Lockdown actif
    return baseGain * mult;
}

// Mise à jour de l'infection et de l'antivirus
function updateThreatEngine() {
    if (!infectionState.selectedCountry) return;

    let totalBots = upgrades.miner.count + upgrades.trojan.count; 
    let totalViruses = upgrades.ransomware.count + upgrades.bootSector.count + upgrades.fileVirus.count;
    
    // Calcul de l'infection
    infectionState.infectionRate = Math.min(100, 
        ((totalBytes / infectionState.winTargetBytes) * 100) + (totalBots * 0.01) + (totalViruses * 0.05)
    );

    // Calcul de l'antivirus (déclenché à 10% d'infection)
    if (infectionState.infectionRate >= 10 && infectionState.antivirusRate < 100) {
        let encReduction = Math.pow(0.85, infectionState.encryptionLevel);
        let avSpeed = (infectionState.infectionRate * 0.05) * infectionState.selectedCountry.avSpeed * encReduction;
        
        if (infectionState.zeroDayActiveTime > 0) {
            infectionState.zeroDayActiveTime--;
        } else {
            infectionState.antivirusRate = Math.min(100, infectionState.antivirusRate + avSpeed);
        }
    }

    if (infectionState.antivirusRate >= 100) {
        infectionState.isLockdown = true;
    }

    if (infectionState.infectionRate >= 100) {
        alert("VICTOIRE MONDIALE : Vous avez totalement piraté le monde !");
    }

    updateThreatUI();
}

function updateThreatUI() {
    document.getElementById('infection-text').textContent = infectionState.infectionRate.toFixed(2) + "%";
    document.getElementById('infection-fill').style.width = infectionState.infectionRate + "%";

    document.getElementById('antivirus-text').textContent = infectionState.antivirusRate.toFixed(2) + "%";
    document.getElementById('antivirus-fill').style.width = infectionState.antivirusRate + "%";

    const badge = document.getElementById('lockdown-badge');
    if (infectionState.isLockdown) {
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }
}

// Listeners pour les compétences du joueur
document.getElementById('buy-encryption-btn').addEventListener('click', () => {
    let cost = 1000 * Math.pow(1.5, infectionState.encryptionLevel);
    if (totalBytes >= cost) {
        totalBytes -= cost;
        infectionState.encryptionLevel++;
        document.getElementById('enc-cost').textContent = Math.floor(cost * 1.5);
    }
});

document.getElementById('ddos-attack-btn').addEventListener('click', () => {
    let cost = 5000;
    if (totalBytes >= cost && infectionState.antivirusRate > 0) {
        totalBytes -= cost;
        infectionState.antivirusRate = Math.max(0, infectionState.antivirusRate - 5);
        if (infectionState.antivirusRate < 100) infectionState.isLockdown = false;
    }
});

document.getElementById('zero-day-btn').addEventListener('click', () => {
    let cost = 10000;
    if (totalBytes >= cost) {
        totalBytes -= cost;
        infectionState.infectionRate = Math.min(100, infectionState.infectionRate + 2);
        infectionState.zeroDayActiveTime = 30;
    }
});

// Boucle principale du jeu (1 seconde)
function gameLoop() {
    totalBytes += getAdjustedByteGain(bytesPerSecond);
    updateThreatEngine();
}

window.addEventListener('load', () => {
    initCountrySelection();
    setInterval(gameLoop, 1000);
});