// ==UserScript==
// @name         Cyclist Ring Enhanced
// @namespace    cazy.torn.ring
// @version      1.8
// @description  Alerts when targets from the watch list appear in the crimes page, based off Cazy's code!
// @author       Cazylecious and QueenLunara
// @match        https://www.torn.com/loader.php?sid=crimes
// @icon         https://www.google.com/s2/favicons?sz=64&domain=torn.com
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @license      MIT
// @downloadURL  https://github.com/QueenLunara/Cyclist-RingGUI/raw/refs/heads/main/Cyclist-RingGUI.user.js
// @updateURL    https://github.com/QueenLunara/Cyclist-RingGUI/raw/refs/heads/main/Cyclist-RingGUI.user.js
// ==/UserScript==

(function () {
    'use strict';

    let Testclear = false; // Set to true to clear saved lists on start.

    let savedTargets = GM_getValue('savedTargets', []);
    let selectedTargets = GM_getValue('selectedTargets', []);
    let enableAlerts = GM_getValue('enableAlerts', false); // Set to True to enable Browser Alerts
    let detectedTargets = new Set();

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
            GM_setValue('savedTargets', savedTargets);
            console.log("[Cyclist Ring] Cleaned and updated saved targets.");
        }
    }

    function clearSavedLists() {
        if (Testclear) {
            GM_setValue('savedTargets', []);
            GM_setValue('selectedTargets', []);
            console.log("[Cyclist Ring] Cleared saved and selected targets.");
        }
    }

    GM_addStyle(`
        #cyclist-ring-panel {
            position: fixed;
            top: 50px;
            left: 5px;
            padding: 8px;
            border: 2px solid #444;
            background-color: #1f1f1f;
            color: white;
            width: 250px;
            border-radius: 6px;
            box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.5);
            z-index: 999999;
            font-size: 14px;
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
            font-size: 14px;
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
            max-height: 200px;
        }
    `);

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
            GM_setValue('enableAlerts', enableAlerts);
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
                GM_setValue('savedTargets', savedTargets);
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
                GM_setValue('selectedTargets', selectedTargets);
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
        var audio = new Audio('https://audio.jukehost.co.uk/gxd2HB9RibSHhr13OiW6ROCaaRbD8103');
        audio.play();

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
            if (document.querySelector(selector)) return resolve(document.querySelector(selector));
            const observer = new MutationObserver(() => {
                if (document.querySelector(selector)) {
                    resolve(document.querySelector(selector));
                    observer.disconnect();
                }
            });
            observer.observe(document.body, { subtree: true, childList: true });
        });
    }

    waitForElementToExist('.pickpocketing-root').then(() => {
        clearSavedLists();
        cleanSavedTargets();
        createPanel();
        observeCrimes();
        setInterval(checkForTargets, 5000);
    });

})();
