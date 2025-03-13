// ==UserScript==
// @name         Cyclist Ring Enhanced
// @namespace    cazy.torn.ring
// @version      1.4
// @description  Alerts when targets from the watch list appear in the crimes page.
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

    let savedTargets = GM_getValue('savedTargets', []);
    let selectedTargets = GM_getValue('selectedTargets', []);
    let enableAlerts = GM_getValue('enableAlerts', true);
    let detectedTargets = new Set();

    function sanitizeText(text) {
        return text.replace(/[^a-zA-Z0-9\s-]/g, "").trim();
    }

    function isSanitized(text) {
        return /^[a-zA-Z0-9\s-]+$/.test(text);
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
            z-index: 10000;
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
    `);

    function createPanel() {
        const panel = document.createElement('div');
        panel.id = 'cyclist-ring-panel';
        panel.innerHTML = `
            <button id="cyclist-ring-minimize-btn">-</button>
            <div id="cyclist-ring-content">
                <button id="cyclist-ring-enable-alerts-btn">${enableAlerts ? "Disable Alerts" : "Enable Alerts"}</button>
                <div id="cyclist-ring-dropdown-box">Select Targets</div>
                <div id="cyclist-ring-dropdown-menu"></div>
            </div>
        `;
        document.body.appendChild(panel);

        document.getElementById('cyclist-ring-dropdown-box').addEventListener('click', () => {
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
        const targetElements = document.querySelectorAll('.crimeOptionWrapper___IOnLO .titleAndProps___DdeVu');
        return Array.from(targetElements).map(el => sanitizeText(el.textContent.split(' (')[0]));
    }

    function updateDropdown() {
        const activeTargets = getActiveTargets();
        const dropdownMenu = document.getElementById('cyclist-ring-dropdown-menu');
        dropdownMenu.innerHTML = '';

        activeTargets.forEach(target => {
            if (!savedTargets.includes(target) && isSanitized(target)) {
                savedTargets.push(target);
                GM_setValue('savedTargets', savedTargets);
            }
        });

        savedTargets.forEach(target => {
            const option = document.createElement('div');
            option.textContent = target;
            option.style.padding = '4px';
            option.style.cursor = 'pointer';
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
        if (enableAlerts) {
            var audio = new Audio('https://audio.jukehost.co.uk/gxd2HB9RibSHhr13OiW6ROCaaRbD8103');
            audio.play();
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
        createPanel();
        observeCrimes();
        setInterval(checkForTargets, 5000);
    });

})();
