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

// Mettre à jour tous les affichages texte du DOM
function updateDisplay() {
    const dataCounter = document.getElementById('data-counter');
    const bpsCounter = document.getElementById('bps-counter');
    
    if (typeof formatBytes === 'function') {
        if (dataCounter) dataCounter.textContent = formatBytes(totalBytes);
        if (bpsCounter) bpsCounter.textContent = formatBytes(bytesPerSecond);
    } else {
        if (dataCounter) dataCounter.textContent = totalBytes + " B";
        if (bpsCounter) bpsCounter.textContent = bytesPerSecond + " B";
    }

    // Sauvegarde automatique dans le shared_state
    if (typeof GameState !== 'undefined') {
        GameState.save({ totalBytes: totalBytes });
    }
}

// Initialisation de la UI du choix de pays
function initCountrySelection() {
    const select = document.getElementById('country-select');
    if (!select || typeof COUNTRY_GROUPS === 'undefined') return;

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
        if (selected) {
            document.getElementById('country-stats-preview').innerHTML = 
                `<p>Tier : <b>${selected.tier}</b> | Mult. Bytes : <b>x${selected.multBytes}</b> | Vitesse AV : <b>x${selected.avSpeed}</b></p>`;
        }
    });
    select.dispatchEvent(new Event('change'));

    document.getElementById('confirm-country-btn').addEventListener('click', () => {
        infectionState.selectedCountry = getCountryData(select.value);
        document.getElementById('country-modal').classList.add('hidden');
    });
}

function getCountryData(countryName) {
    if (typeof COUNTRY_GROUPS === 'undefined') return null;
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
    const infText = document.getElementById('infection-text');
    const infFill = document.getElementById('infection-fill');
    const avText = document.getElementById('antivirus-text');
    const avFill = document.getElementById('antivirus-fill');

    if (infText) infText.textContent = infectionState.infectionRate.toFixed(2) + "%";
    if (infFill) infFill.style.width = infectionState.infectionRate + "%";

    if (avText) avText.textContent = infectionState.antivirusRate.toFixed(2) + "%";
    if (avFill) avFill.style.width = infectionState.antivirusRate + "%";

    const badge = document.getElementById('lockdown-badge');
    if (badge) {
        if (infectionState.isLockdown) badge.classList.remove('hidden');
        else badge.classList.add('hidden');
    }
}

// Listeners pour les compétences du joueur
document.addEventListener('DOMContentLoaded', () => {
    const encBtn = document.getElementById('buy-encryption-btn');
    if (encBtn) {
        encBtn.addEventListener('click', () => {
            let cost = 1000 * Math.pow(1.5, infectionState.encryptionLevel);
            if (totalBytes >= cost) {
                totalBytes -= cost;
                infectionState.encryptionLevel++;
                document.getElementById('enc-cost').textContent = Math.floor(cost * 1.5);
                updateDisplay();
            }
        });
    }

    const ddosBtn = document.getElementById('ddos-attack-btn');
    if (ddosBtn) {
        ddosBtn.addEventListener('click', () => {
            let cost = 5000;
            if (totalBytes >= cost && infectionState.antivirusRate > 0) {
                totalBytes -= cost;
                infectionState.antivirusRate = Math.max(0, infectionState.antivirusRate - 5);
                if (infectionState.antivirusRate < 100) infectionState.isLockdown = false;
                updateDisplay();
            }
        });
    }

    const zeroDayBtn = document.getElementById('zero-day-btn');
    if (zeroDayBtn) {
        zeroDayBtn.addEventListener('click', () => {
            let cost = 10000;
            if (totalBytes >= cost) {
                totalBytes -= cost;
                infectionState.infectionRate = Math.min(100, infectionState.infectionRate + 2);
                infectionState.zeroDayActiveTime = 30;
                updateDisplay();
            }
        });
    }
});

// Boucle principale du jeu (1 seconde)
function gameLoop() {
    totalBytes += getAdjustedByteGain(bytesPerSecond);
    updateThreatEngine();
    updateDisplay();
}

window.addEventListener('load', () => {
    if (typeof GameState !== 'undefined') {
        const state = GameState.load();
        totalBytes = state.totalBytes || 0;
    }

    initCountrySelection();

    const clickBtn = document.getElementById('click-btn');
    if (clickBtn) {
        clickBtn.addEventListener('click', () => {
            totalBytes += getAdjustedByteGain(1);
            updateThreatEngine();
            updateDisplay();
        });
    }

    updateDisplay();
    setInterval(gameLoop, 1000);
});