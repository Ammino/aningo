/**
 * Пресеты карт Яндекса: центр, зум и маркеры.
 * Новая карта: добавьте объект в __YANDEX_MAP_PRESETS и разметку с class="js--map-yandex" data-yandex-preset="ключ".
 * Блок с class="js--map-pickup" всегда использует пресет pickup.
 */
(function () {
	window.__YANDEX_MAP_PRESETS = window.__YANDEX_MAP_PRESETS || {};

	// Координаты ориентировочные (х. Копанской) — замените на точку склада при необходимости
	window.__YANDEX_MAP_PRESETS.pickup = {
		location: {
			center: [38.79517, 45.16871],
			zoom: 15,
		},
		points: [
			{
				coordinates: [38.79517, 45.16871],
				title: 'Aningo',
			},
		],
	};
})();
