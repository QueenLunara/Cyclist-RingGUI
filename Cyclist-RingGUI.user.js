// ==UserScript==
// @name         Cyclist Ring Enhanced
// @namespace    cazy.torn.ring
// @version      1.2
// @description  Making money by pickpocketing cyclists with enhanced features!
// @author       Cazylecious and QueenLunara
// @match        https://www.torn.com/loader.php?sid=crimes
// @icon         https://www.google.com/s2/favicons?sz=64&domain=torn.com
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// @license      MIT
// @downloadURL  https://gist.github.com/crazy-vedic/raw/cyclist-enhanced.user.js
// @updateURL    https://gist.github.com/crazy-vedic/raw/cyclist-enhanced.user.js
// ==/UserScript==

(function() {
    'use strict';

    const savedTargets = GM_getValue('savedTargets', []);
    let selectedTargets = GM_getValue('selectedTargets', []);
    let enableAlerts = GM_getValue('enableAlerts', true);

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
        #cyclist-ring-dropdown-menu {
            display: none;
            background-color: #1f1f1f;
            border: 1px solid #444;
            border-radius: 4px;
            padding: 8px;
            margin-top: 4px;
            overflow-y: auto;
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
        return Array.from(targetElements).map(el => el.textContent.split(' (')[0]);
    }

    function updateDropdown() {
        const activeTargets = getActiveTargets();
        const dropdownMenu = document.getElementById('cyclist-ring-dropdown-menu');
        dropdownMenu.innerHTML = '';

        activeTargets.forEach(target => {
            if (!savedTargets.includes(target)) {
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
                checkForTargets();
            });

            dropdownMenu.appendChild(option);
        });

        dropdownMenu.style.maxHeight = savedTargets.length > 5 ? 'none' : '200px';
    }

    function checkForTargets() {
        interceptFetch("torn.com", "/page.php?sid=crimesData", (response) => {
            const crimes = response.DB.crimesByType;
            const AIMTARGETS = selectedTargets.length > 0 ? selectedTargets : ['cyclist'];

            if (isAnyTargetAvailable(crimes, AIMTARGETS)) {
                var audio = new Audio('https://audio.jukehost.co.uk/gxd2HB9RibSHhr13OiW6ROCaaRbD8103');
                audio.play();

                if (enableAlerts) {
                    alert("Target available: " + AIMTARGETS.join(", "));
                }

                setTimeout(() => {
                    getActiveTargets().forEach(targetText => {
                        if (AIMTARGETS.some(t => targetText.toLowerCase().includes(t))) {
                            console.log(`Highlighting target: ${targetText}`);
                        }
                    });
                }, 1000);
            }
        });
    }

    function isAnyTargetAvailable(crimes, targets) {
        for (let i = 0; i < crimes.length; i++) {
            const crime = crimes[i];
            if (targets.some(target => crime.title.toLowerCase().includes(target)) && crime.available === true) {
                return true;
            }
        }
        return false;
    }

    function interceptFetch(url, q, callback) {
        const originalFetch = window.fetch;
        window.fetch = function() {
            return new Promise((resolve, reject) => {
                return originalFetch.apply(this, arguments).then(function(data) {
                    let dataurl = data.url.toString();
                    if (dataurl.includes(url) && dataurl.includes(q)) {
                        const clone = data.clone();
                        if (clone) {
                            clone.json().then((response) => callback(response))
                                .catch((error) => console.log("[InterceptFetch] Error with clone.json()", error));
                        }
                    }
                    resolve(data);
                }).catch((error) => console.log("[InterceptFetch] Error with fetch.", error));
            });
        };
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
        setInterval(checkForTargets, 5000);
    });
})();

