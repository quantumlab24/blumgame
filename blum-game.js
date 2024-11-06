// ==UserScript==
// @name         Blum Game
// @version      0.1
// @namespace    Tamper Script
// @author       quantumlab24
// @match        https://telegram.blum.codes/*
// @grant        none
// @icon         none
// @downloadURL  https://github.com/quantumlab24/blumgame/raw/main/blum-game.js
// @updateURL    https://github.com/quantumlab24/blumgame/raw/main/blum-game.js
// @homepage     https://github.com/quantumlab24/blumgame
// ==/UserScript==

let BLUM_PARAMS = {
	minBombHits: (Math.floor(Math.random() * 2)),
	minIceHits: (Math.floor(Math.random() * (6 - 1) + 1 )),
	flowerSkipPercentage: (Math.floor(Math.random() * (32 - 16) + 16 )),
	minDelayMs: 555,
	maxDelayMs: 1212,
	autoClickPlay: false,
	dogsProbability: (95 + Math.random()) / 100
};

let isGamePaused = false;

try {
	let blumStats = {
		score: 0,
		bombHits: 0,
		iceHits: 0,
		dogsHits: 0,
		flowersSkipped: 0,
		isGameOver: false,
	};

	const originalArrayPush = Array.prototype.push;
	Array.prototype.push = function(...items) {
		items.forEach(item => handleGameElement(item));
		return originalArrayPush.apply(this, items);
	};

	function handleGameElement(item) {
		if (!item || !item.asset) return;

		const {
			assetType
		} = item.asset;
		switch (assetType) {
			// Снежинки - тыквы
			case "CLOVER":
				clickedFlower(item);
				break;
			
			// Бомбы
			case "BOMB":
				clickedBomb(item);
				break;

			// Заморозка
			case "FREEZE":
				clickedIce(item);
				break;

			// Пёсики
			case "DOGS":
				clickedDogs(item);
				break;
		}
	}

	function clickedFlower(item) {
		const shouldSkip = Math.random() < (BLUM_PARAMS.flowerSkipPercentage / 100);
		if (shouldSkip) {
			blumStats.flowersSkipped++;
		} else {
			blumStats.score++;
			clickElement(item);
		}
	}

	function clickedBomb(item) {
		blumStats.score = 0;
		clickElement(item);
		blumStats.bombHits++;
	}

	function clickedIce(item) {
		if (blumStats.iceHits < BLUM_PARAMS.minIceHits) {
			clickElement(item);
			blumStats.iceHits++;
		}
	}

	function clickedDogs(item) {
		if (Math.random() < BLUM_PARAMS.dogsProbability) {
			clickElement(item);
			blumStats.dogsHits++;
		}
	}

	function clickElement(item) {
		const createEvent = (type, EventClass) => new EventClass(type, {
			bubbles: true,
			cancelable: true,
			pointerId: 1,
			isPrimary: true,
			pressure: type === 'pointerdown' ? 0.5 : 0
		});

		setTimeout(() => {
			if (typeof item.onClick === 'function') {
				if (item.element) {
					['pointerdown', 'mousedown', 'pointerup', 'mouseup', 'click'].forEach(type => {
						item.element.dispatchEvent(createEvent(type, type.startsWith('pointer') ? PointerEvent : MouseEvent));
					});
				}
				item.onClick(item);
			}
			
			item.isExplosion = true;
			item.addedAt = performance.now();
		}, getClickDelay());
	}

	function getClickDelay() {
		const minDelay = BLUM_PARAMS.minDelayMs || 450;
		const maxDelay = BLUM_PARAMS.maxDelayMs || 1199;
		return Math.random() * (maxDelay - minDelay) + minDelay;
	}

	function checkGameOver() {
		const rewardElement = document.querySelector('#app > div > div > div.content > div.reward');
		if (rewardElement && !blumStats.isGameOver) {
			blumStats.isGameOver = true;
			resetblumStats();
		}
	}

	function resetblumStats() {
		blumStats = {
			score: 0,
			bombHits: 0,
			iceHits: 0,
			dogsHits: 0,
			flowersSkipped: 0,
			isGameOver: false,
		};
	}

	const observer = new MutationObserver(mutations => {
		for (const mutation of mutations) {
			if (mutation.type === 'childList') {
				checkGameOver();
			}
		}
	});

	const appElement = document.querySelector('#app');
	if (appElement) {
		observer.observe(appElement, {
			childList: true,
			subtree: true
		});
	}


} catch (e) {
	console.error("Blum error:", e);
}
