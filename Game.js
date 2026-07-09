// Version V1.0
//régler les prix et les mutiplicateur faire durer les parties plus longtemps
// Progression Variables
let totalBytes = 0;
let bytesPerClick = 1;
let bytesPerSecond = 0;

// Upgrades Data Structure
let upgrades = {
    miner: { count: 0, cost: 15, power: 1, baseCost: 15, costMultiplier: 1.2, id: "buy-miner-btn", label: "Background Script" },
    trojan: { count: 0, cost: 1000, power: 5, baseCost: 1000, costMultiplier: 1.2, id: "buy-trojan-btn", label: "Trojan Horse" },
    ransomware: { count: 0, cost: 500, power: 40, baseCost: 500, costMultiplier: 1.2, id: "buy-ransomware-btn", label: "Ransomware" },
    bootSector: { count: 0, cost: 2500, power: 200, baseCost: 2500, costMultiplier: 1.2, id: "buy-boot-btn", label: "Boot Sector Virus" },
    fileVirus: { count: 0, cost: 10000, power: 900, baseCost: 10000, costMultiplier: 1.2, id: "buy-file-btn", label: "File Virus" },
    macroVirus: { count: 0, cost: 50000, power: 4000, baseCost: 50000, costMultiplier: 1.2, id: "buy-macro-btn", label: "Macro Virus" },
    residentVirus: { count: 0, cost: 250000, power: 18000, baseCost: 1000000, costMultiplier: 1.2, id: "buy-resident-btn", label: "Resident Virus" },
    multipartite: { count: 0, cost: 1000000, power: 85000, baseCost: 5000000, costMultiplier: 1.2, id: "buy-multipartite-btn", label: "Multipartite Virus" },
    polymorphic: { count: 0, cost: 5000000, power: 450000, baseCost: 10000000, costMultiplier: 1.2, id: "buy-polymorphic-btn", label: "Polymorphic Virus" }
};

// "CPU Overclock" Click Upgrade Variables
let clickUpgradeCost = 50;
let clickUpgradeCount = 0;

// HTML Elements
const dataCounterDisplay = document.getElementById("data-counter");
const bpsCounterDisplay = document.getElementById("bps-counter");
const clickButton = document.getElementById("click-btn");
const upgradeClickButton = document.getElementById("upgrade-click-btn");
const saveButton = document.getElementById("save-btn");
const loadButton = document.getElementById("load-btn");
const resetButton = document.getElementById("reset-btn");
const saveNameInput = document.getElementById("save-name-input");
const saveSelect = document.getElementById("save-select");

const SAVE_LIST_KEY = "hackTheWorld_save_list";

function formatBytes(bytes) {
    if (bytes === 0) return '0 B';
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1000));
    return parseFloat((bytes / Math.pow(1000, i)).toFixed(i === 0 ? 0 : 2)) + ' ' + sizes[i];
}

function calculateBPS() {
    let bps = 0;
    for (let key in upgrades) {
        bps += upgrades[key].count * upgrades[key].power;
    }
    bytesPerSecond = bps;
}

function updateUI() {
    dataCounterDisplay.textContent = formatBytes(totalBytes);
    bpsCounterDisplay.textContent = formatBytes(bytesPerSecond);
    upgradeClickButton.textContent = `UPGRADE: CPU Overclock (${clickUpgradeCount}) (Cost: ${formatBytes(clickUpgradeCost)})`;
    
    for (let key in upgrades) {
        const btn = document.getElementById(upgrades[key].id);
        if (btn) {
            btn.textContent = `INSTALL: ${upgrades[key].label} (${upgrades[key].count}) (Cost: ${formatBytes(upgrades[key].cost)})`;
        }
    }
}

clickButton.addEventListener("click", () => {
    totalBytes += bytesPerClick;
    dataCounterDisplay.textContent = formatBytes(totalBytes);
});

upgradeClickButton.addEventListener("click", () => {
    if (totalBytes >= clickUpgradeCost) {
        totalBytes -= clickUpgradeCost;
        clickUpgradeCount++;
        bytesPerClick = bytesPerClick * 2;
        clickUpgradeCost = Math.floor(clickUpgradeCost * 2.5);
        updateUI();
    }
});

// Setup purchase events dynamically
function setupShop() {
    for (let key in upgrades) {
        const btn = document.getElementById(upgrades[key].id);
        if (btn) {
            btn.addEventListener("click", () => {
                if (totalBytes >= upgrades[key].cost) {
                    totalBytes -= upgrades[key].cost;
                    upgrades[key].count++;
                    upgrades[key].cost = Math.floor(upgrades[key].baseCost * Math.pow(upgrades[key].costMultiplier, upgrades[key].count));
                    calculateBPS();
                    updateUI();
                }
            });
        }
    }
}

function updateSaveDropdown() {
    saveSelect.innerHTML = '<option value="">-- Select a file --</option>';
    const saveList = getSaveList();
    saveList.forEach(saveName => {
        const option = document.createElement("option");
        option.value = saveName;
        option.textContent = saveName;
        saveSelect.appendChild(option);
    });
}

function getSaveList() {
    const listJson = localStorage.getItem(SAVE_LIST_KEY);
    return listJson ? JSON.parse(listJson) : [];
}

function saveGame() {
    let name = saveNameInput.value.trim();
    if (name === "") {
        alert("Error: Please enter a valid name for your matrix state.");
        return;
    }

    let upgradesSave = {};
    for (let key in upgrades) {
        upgradesSave[key] = { count: upgrades[key].count, cost: upgrades[key].cost };
    }

    const gameState = {
        totalBytes: totalBytes,
        bytesPerClick: bytesPerClick,
        clickUpgradeCost: clickUpgradeCost,
        clickUpgradeCount: clickUpgradeCount,
        upgrades: upgradesSave
    };

    localStorage.setItem("htw_save_" + name, JSON.stringify(gameState));

    const saveList = getSaveList();
    if (!saveList.includes(name)) {
        saveList.push(name);
        localStorage.setItem(SAVE_LIST_KEY, JSON.stringify(saveList));
    }

    alert(`System state "${name}" saved successfully.`);
    saveNameInput.value = "";
    updateSaveDropdown();
}

function loadGame() {
    const selectedName = saveSelect.value;
    if (!selectedName) {
        alert("Error: No file selected from the matrix list.");
        return;
    }

    const savedData = localStorage.getItem("htw_save_" + selectedName);
    if (savedData) {
        const gameState = JSON.parse(savedData);
        totalBytes = gameState.totalBytes;
        bytesPerClick = gameState.bytesPerClick || 1;
        clickUpgradeCost = gameState.clickUpgradeCost || 50;
        clickUpgradeCount = gameState.clickUpgradeCount || 0;
        
        if (gameState.upgrades) {
            for (let key in upgrades) {
                if (gameState.upgrades[key]) {
                    upgrades[key].count = gameState.upgrades[key].count || 0;
                    upgrades[key].cost = gameState.upgrades[key].cost || upgrades[key].baseCost;
                }
            }
        }
        
        calculateBPS();
        updateUI();
        alert(`System state "${selectedName}" successfully loaded.`);
    } else {
        alert("Error: Restoration data corrupted or missing.");
    }
}

function wipeAllSaves() {
    const confirmWipe = confirm("WARNING: This will permanently delete ALL saved games. Are you sure you want to continue?");
    if (confirmWipe) {
        const saveList = getSaveList();
        saveList.forEach(saveName => {
            localStorage.removeItem("htw_save_" + saveName);
        });
        localStorage.removeItem(SAVE_LIST_KEY);
        updateSaveDropdown();
        alert("All matrix states have been permanently wiped.");
    }
}

saveButton.addEventListener("click", saveGame);
loadButton.addEventListener("click", loadGame);
resetButton.addEventListener("click", wipeAllSaves);

// Init
setupShop();
window.addEventListener("load", () => {
    updateSaveDropdown();
});

setInterval(() => {
    if (bytesPerSecond > 0) {
        totalBytes += bytesPerSecond;
        dataCounterDisplay.textContent = formatBytes(totalBytes);
    }
}, 1000);