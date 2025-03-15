// ==UserScript==
// @name         Cyclist Ring Enhanced for TornPDA
// @namespace    cazy.torn.ring
// @version      2.1
// @description  Alerts when targets from the watch list appear in the crimes page, based off Cazy's code!
// @author       Cazylecious and QueenLunara
// @match        https://www.torn.com/loader.php?sid=crimes
// @match        https://www.torn.com/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=torn.com
// @grant        none
// @license      MIT
// @downloadURL  https://github.com/QueenLunara/Cyclist-RingGUI/raw/refs/heads/main/Cyclist-RingGUI.user.js
// @updateURL    https://github.com/QueenLunara/Cyclist-RingGUI/raw/refs/heads/main/Cyclist-RingGUI.user.js
// ==/UserScript==

(function () {
    'use strict';

    let Testclear = false; // Set to true to clear saved lists on start.

    let savedTargets = JSON.parse(localStorage.getItem('savedTargets') || '[]');
    let selectedTargets = JSON.parse(localStorage.getItem('selectedTargets') || '[]');
    let enableAlerts = JSON.parse(localStorage.getItem('enableAlerts') || false);
    let detectedTargets = new Set();
    let audioUnlocked = JSON.parse(localStorage.getItem('audioUnlocked') || false);

    function sanitizeText(text) {
        return text.split('(')[0].trim().replace(/[^a-zA-Z0-9\s-]/g, "");
    }

    function isSanitized(text) {
        return /^[a-zA-Z0-9\s-]+$/.test(text);
    }

    function cleanSavedTargets() {
        let cleanedList = savedTargets.map(sanitizeText).filter(isSanitized);
        cleanedList = [...new Set(cleanedList)];

        if (!cleanedList.includes("Cyclist")) {
            cleanedList.push("Cyclist");
        }

        if (JSON.stringify(cleanedList) !== JSON.stringify(savedTargets)) {
            savedTargets = cleanedList;
            localStorage.setItem('savedTargets', JSON.stringify(savedTargets));
        }
    }

    function clearSavedLists() {
        if (Testclear) {
            localStorage.removeItem('savedTargets');
            localStorage.removeItem('selectedTargets');
        }
    }

    const style = document.createElement('style');
    style.textContent = `
        #cyclist-ring-panel {
            position: fixed;
            top: 10px;
            left: 10px;
            padding: 8px;
            border: 2px solid #444;
            background-color: #1f1f1f;
            color: white;
            width: 200px;
            border-radius: 6px;
            box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.5);
            z-index: 999999;
            font-size: 12px;
        }
        #cyclist-ring-panel button {
            padding: 6px;
            background-color: #4CAF50;
            color: white;
            font-weight: bold;
            border: none;
            cursor: pointer;
            width: 100%;
            border-radius: 4px;
            font-size: 12px;
            margin-bottom: 8px;
        }
        #cyclist-ring-dropdown-menu {
            display: none;
            background-color: #1f1f1f;
            border: 1px solid #444;
            border-radius: 4px;
            padding: 8px;
            margin-top: 4px;
            overflow-y: auto;
            max-height: 150px;
        }
    `;
    document.head.appendChild(style);

    function createPanel() {
        const panel = document.createElement('div');
        panel.id = 'cyclist-ring-panel';
        panel.innerHTML = `
            <button id="cyclist-ring-minimize-btn">-</button>
            <div id="cyclist-ring-content">
                <button id="cyclist-ring-enable-alerts-btn">${enableAlerts ? "Disable Alerts" : "Enable Alerts"}</button>
                <button id="cyclist-ring-select-targets-btn">Select Targets</button>
                <div id="cyclist-ring-dropdown-menu"></div>
            </div>
        `;
        document.body.appendChild(panel);

        document.getElementById('cyclist-ring-select-targets-btn').addEventListener('click', () => {
            const dropdownMenu = document.getElementById('cyclist-ring-dropdown-menu');
            dropdownMenu.style.display = dropdownMenu.style.display === 'block' ? 'none' : 'block';
        });

        document.getElementById('cyclist-ring-minimize-btn').addEventListener('click', () => {
            const content = document.getElementById('cyclist-ring-content');
            content.style.display = content.style.display === 'none' ? 'block' : 'none';
            document.getElementById('cyclist-ring-minimize-btn').textContent = content.style.display === 'none' ? '+' : '-';
        });

        document.getElementById('cyclist-ring-enable-alerts-btn').addEventListener('click', () => {
            enableAlerts = !enableAlerts;
            localStorage.setItem('enableAlerts', JSON.stringify(enableAlerts));
            document.getElementById('cyclist-ring-enable-alerts-btn').textContent = enableAlerts ? "Disable Alerts" : "Enable Alerts";
        });

        updateDropdown();
    }

    function getActiveTargets() {
        const targetElements = document.querySelectorAll('.titleAndProps___DdeVu');
        return Array.from(targetElements).map(el => {
            let mainDiv = el.querySelector('div');
            return mainDiv ? sanitizeText(mainDiv.textContent) : null;
        }).filter(Boolean);
    }

    function updateDropdown() {
        cleanSavedTargets();
        const dropdownMenu = document.getElementById('cyclist-ring-dropdown-menu');
        dropdownMenu.innerHTML = '';

        getActiveTargets().forEach(target => {
            let cleanTarget = sanitizeText(target);
            if (!savedTargets.includes(cleanTarget) && isSanitized(cleanTarget)) {
                savedTargets.push(cleanTarget);
                localStorage.setItem('savedTargets', JSON.stringify(savedTargets));
            }
        });

        savedTargets.forEach(target => {
            const option = document.createElement('div');
            option.textContent = target;
            option.style.backgroundColor = selectedTargets.includes(target) ? '#4CAF50' : 'transparent';

            option.addEventListener('click', () => {
                if (selectedTargets.includes(target)) {
                    selectedTargets = selectedTargets.filter(t => t !== target);
                } else {
                    selectedTargets.push(target);
                }
                localStorage.setItem('selectedTargets', JSON.stringify(selectedTargets));
                updateDropdown();
            });

            dropdownMenu.appendChild(option);
        });
    }

    function checkForTargets() {
        let activeTargets = getActiveTargets();
        let newTargets = [];

        selectedTargets.forEach(target => {
            if (activeTargets.includes(target) && !detectedTargets.has(target)) {
                detectedTargets.add(target);
                newTargets.push(target);
            }
        });

        if (newTargets.length > 0) {
            playAlert(newTargets);
        }
    }

    function playAlert(targets) {
        if (!audioUnlocked) {
            return;
        }

        var audio = new Audio('https://audio.jukehost.co.uk/gxd2HB9RibSHhr13OiW6ROCaaRbD8103');
        audio.play().catch(error => {});

        if (enableAlerts) {
            alert("Target(s) found on the crime page: " + targets.join(", "));
        }
    }

    function observeCrimes() {
        const targetNode = document.querySelector('.pickpocketing-root');
        if (!targetNode) return;

        const config = { childList: true, subtree: true };
        const observer = new MutationObserver(() => {
            checkForTargets();
        });

        observer.observe(targetNode, config);
    }

    function waitForElementToExist(selector) {
        return new Promise(resolve => {
            if (document.querySelector(selector)) {
                return resolve(document.querySelector(selector));
            }
            const observer = new MutationObserver(() => {
                if (document.querySelector(selector)) {
                    resolve(document.querySelector(selector));
                    observer.disconnect();
                }
            });
            observer.observe(document.body, { subtree: true, childList: true });
        });
    }

    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible' && !audioUnlocked) {
            if (confirm("Click OK to enable audio alerts.")) {
                audioUnlocked = true;
                localStorage.setItem('audioUnlocked', JSON.stringify(audioUnlocked));
            }
        }
    });

    if (window.location.href.includes('https://www.torn.com/loader.php?sid=crimes')) {
        waitForElementToExist('.pickpocketing-root').then(() => {
            clearSavedLists();
            cleanSavedTargets();
            createPanel();
            observeCrimes();
            setInterval(checkForTargets, 2000);
        }).catch(error => {});
    } else {
        if (!audioUnlocked) {
            alert("Audio alerts are disabled. Please visit the crimes page to enable them.");
        }
    }
})();
