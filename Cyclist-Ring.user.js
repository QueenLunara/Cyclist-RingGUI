// ==UserScript==
// @name         Cyclist Ring
// @namespace    cazy.torn.ring
// @version      0.4
// @description  Making money by pickpocketing cyclists!
// @author       Cazylecious
// @match        https://www.torn.com/loader.php?sid=crimes
// @icon         https://www.google.com/s2/favicons?sz=64&domain=torn.com
// @grant        none
// @license      MIT
// @downloadURL https://gist.github.com/crazy-vedic/raw/cyclist.user.js
// @updateURL https://gist.github.com/crazy-vedic/raw/cyclist.user.js
// ==/UserScript==

(function() {
    'use strict';

    waitForElementToExist('.pickpocketing-root').then(() => {
        $('.pickpocketing-root').append(`<div id="cyclist-div"><a id="cyclist-enable-btn" class="torn-btn btn-big">Enable Cyclist Alert</a><br/><br/></div>`);

        $('#cyclist-enable-btn').click(() => {
            $('#cyclist-div').fadeOut();
            enabled()

            // Test sound when enabled
            var audio = new Audio('https://audio.jukehost.co.uk/gxd2HB9RibSHhr13OiW6ROCaaRbD8103');
            audio.play();
        });
        //setTimeout(() => {$('#cyclist-enable-btn').click();}, 5000);
    });

function getActiveTargets() {
    let parentArray = $('.CircularProgressbar').nextAll().map(function() {
        let targetElement = $(this).parent().parent().parent().get(0)?.children[0]?.children[0];
        return targetElement
    }).get();

    return parentArray; // Return the array properly
}

function enabled() {
    interceptFetch("torn.com", "/page.php?sid=crimesData", (response, url) => {
        const crimes = response.DB.crimesByType;
        const AIMTARGETS = ['cyclist']; // Default to 'cyclist', replace with your array

        if (isAnyTargetAvailable(crimes, AIMTARGETS)) {
            // Play sound
            var audio = new Audio('https://audio.jukehost.co.uk/gxd2HB9RibSHhr13OiW6ROCaaRbD8103');
            audio.play();

            /* Highlight matching targets */
            setTimeout(() => {
                getActiveTargets().forEach(target => {
                    let $target = $(target); // Wrap target in jQuery
                    let targetText = target.value || $target.text(); // Get value or text
                    let targetLowerText = targetText.toLowerCase(); // Convert to lowercase

                    if (AIMTARGETS.some(t => targetLowerText.includes(t))) { // Check if any target matches
                        $target.parent().parent().parent().parent().css("background-color", "#00ff00");
                        $target.parent().parent().parent().css("background-color", "#00ff00");
                        $target.parent().parent().css("background-color", "#00ff00");
                        $target.parent().css("background-color", "#00ff00");
                        $target.css("background-color", "#00ff00");
                    }
                });
            }, 1000);
        }
    });
}

// Checks if any of the targets are available in crimes
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
							clone.json().then((response) => callback(response, data.url))
								.catch((error) => {
									console.log("[LoadoutShare][InterceptFetch] Error with clone.json(). Most likely not JSON data.", error)
								})
						}
					}

					resolve(data);
				})
				.catch((error) => {
					console.log("[LoadoutShare][InterceptFetch] Error with fetch.", error)
				})
		});
	};
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

        observer.observe(document.body, {
            subtree: true,
            childList: true,
        });
    });
}
}());
