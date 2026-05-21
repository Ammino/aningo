/**
 * Яндекс.Карты JS API v3: только при наличии .js--map-pickup или .js--map-yandex.
 * Ключ API: data-yandex-api-key на контейнере (или первый непустой среди карт на странице).
 */
(function () {
	var roots = document.querySelectorAll('.js--map-pickup, .js--map-yandex');
	if (!roots.length) return;

	var scriptPromise = null;

	function resolvePresetKey(el) {
		if (el.classList.contains('js--map-pickup')) return 'pickup';
		var key = el.getAttribute('data-yandex-preset');
		return key || null;
	}

	function loadYandexScript(apiKey) {
		if (window.ymaps3) return Promise.resolve(window.ymaps3);
		if (scriptPromise) return scriptPromise;
		scriptPromise = new Promise(function (resolve, reject) {
			var s = document.createElement('script');
			s.async = true;
			s.src =
				'https://api-maps.yandex.ru/v3/?apikey=' +
				encodeURIComponent(apiKey) +
				'&lang=ru_RU';
			s.onload = function () {
				resolve(window.ymaps3);
			};
			s.onerror = function () {
				scriptPromise = null;
				reject(new Error('Yandex Maps: не удалось загрузить скрипт API'));
			};
			document.head.appendChild(s);
		});
		return scriptPromise;
	}

	/**
	 * Редактор стилей Яндекса часто отдаёт JSON в укороченном виде (не как в JS API v3):
	 * — tags: "country" вместо { all: ["country"] }
	 * — tags: { any: "admin", none: [...] } вместо { any: ["admin"], none: [...] }
	 * Без этого блоки стилей API игнорирует.
	 */
	function normalizeTagList(val) {
		if (val == null) return undefined;
		if (Array.isArray(val)) return val;
		if (typeof val === 'string') return [val];
		return undefined;
	}

	function normalizeStyleRule(rule) {
		if (!rule || typeof rule !== 'object') return rule;
		var out = Object.assign({}, rule);
		var t = out.tags;
		if (typeof t === 'string') {
			out.tags = { all: [t] };
		} else if (t && typeof t === 'object' && !Array.isArray(t)) {
			var tags = Object.assign({}, t);
			['all', 'any', 'none'].forEach(function (k) {
				if (tags[k] == null) return;
				var n = normalizeTagList(tags[k]);
				if (n) tags[k] = n;
			});
			out.tags = tags;
		}
		return out;
	}

	function normalizeCustomization(data) {
		if (!data) return undefined;
		var rawStyle = null;
		if (Array.isArray(data)) rawStyle = data;
		else if (data.style && Array.isArray(data.style)) rawStyle = data.style;
		if (!rawStyle) return undefined;
		var style = rawStyle.map(normalizeStyleRule);
		var rest = {};
		if (!Array.isArray(data) && typeof data === 'object') {
			Object.keys(data).forEach(function (k) {
				if (k !== 'style') rest[k] = data[k];
			});
		}
		return Object.keys(rest).length ? Object.assign({ style: style }, rest) : { style: style };
	}

	/**
	 * В props слоя допускается Customization = массив правил ИЛИ { style, 'render-3d'? }.
	 * Если в JSON только список правил — отдаём массив (как в vanilla-примерах API).
	 */
	function customizationForSchemeLayer(normalized) {
		if (!normalized) return undefined;
		if (Array.isArray(normalized)) return normalized;
		if (normalized.style && Array.isArray(normalized.style)) {
			var keys = Object.keys(normalized);
			var extra = keys.filter(function (k) {
				return k !== 'style';
			});
			if (!extra.length) return normalized.style;
		}
		return normalized;
	}

	function fetchCustomization(url) {
		if (!url) return Promise.resolve(undefined);
		return fetch(url, { credentials: 'same-origin' })
			.then(function (r) {
				if (!r.ok) {
					console.warn('Yandex Maps: стиль не загружен', url, r.status);
					return undefined;
				}
				return r.json();
			})
			.then(normalizeCustomization)
			.catch(function (e) {
				console.warn('Yandex Maps: ошибка чтения JSON стиля', url, e);
				return undefined;
			});
	}

	function mergeLocation(presetLoc, dataCenter, dataZoom) {
		var loc = Object.assign({}, presetLoc || {});
		var cz = dataCenter ? String(dataCenter).trim() : '';
		if (cz) {
			var parts = cz.split(/[\s,;]+/).filter(Boolean);
			if (parts.length >= 2) {
				var lng = parseFloat(parts[0]);
				var lat = parseFloat(parts[1]);
				if (!isNaN(lng) && !isNaN(lat)) loc.center = [lng, lat];
			}
		}
		if (dataZoom != null && dataZoom !== '') {
			var z = parseFloat(dataZoom);
			if (!isNaN(z)) loc.zoom = z;
		}
		return loc;
	}

	function createPinElement(pinUrl, title) {
		var wrap = document.createElement('div');
		wrap.style.position = 'relative';
		wrap.style.transform = 'translate(-50%, -100%)';
		wrap.style.pointerEvents = 'none';
		var img = document.createElement('img');
		img.src = pinUrl;
		img.alt = title || '';
		img.width = 39;
		img.height = 52;
		img.style.display = 'block';
		img.draggable = false;
		wrap.appendChild(img);
		return wrap;
	}

	function pickApiKey(nodes) {
		for (var i = 0; i < nodes.length; i++) {
			var k = (nodes[i].getAttribute('data-yandex-api-key') || '').trim();
			if (k) return k;
		}
		return '';
	}

	var apiKey = pickApiKey(roots);
	if (!apiKey) {
		console.warn(
			'Yandex Maps: задайте data-yandex-api-key на контейнере карты (https://developer.tech.yandex.ru/)'
		);
		return;
	}

	var presets = window.__YANDEX_MAP_PRESETS || {};

	loadYandexScript(apiKey)
		.then(function (ymaps3) {
			return ymaps3.ready.then(function () {
				return ymaps3;
			});
		})
		.then(function (ymaps3) {
			var YMap = ymaps3.YMap;
			var YMapDefaultSchemeLayer = ymaps3.YMapDefaultSchemeLayer;
			var YMapDefaultFeaturesLayer = ymaps3.YMapDefaultFeaturesLayer;
			var YMapMarker = ymaps3.YMapMarker;

			var inits = [];

			roots.forEach(function (el) {
				var presetKey = resolvePresetKey(el);
				if (!presetKey) {
					console.warn(
						'Yandex Maps: для элемента с .js--map-yandex укажите data-yandex-preset="..."'
					);
					return;
				}
				var preset = presets[presetKey];
				if (!preset) {
					console.warn('Yandex Maps: нет пресета «' + presetKey + '» в __YANDEX_MAP_PRESETS');
					return;
				}

				var styleUrl =
					el.getAttribute('data-yandex-style') ||
					el.getAttribute('data-map-style-url') ||
					'';
				var pinUrl =
					el.getAttribute('data-yandex-pin') ||
					el.getAttribute('data-pin-src') ||
					'img/pin-map.svg';

				var loc = mergeLocation(
					preset.location,
					el.getAttribute('data-yandex-center'),
					el.getAttribute('data-yandex-zoom')
				);

				var points = preset.points && preset.points.length ? preset.points : [];

				inits.push(
					fetchCustomization(styleUrl).then(function (customization) {
						var layerCustomization = customizationForSchemeLayer(customization);
						var schemeOpts =
							layerCustomization !== undefined
								? { customization: layerCustomization }
								: {};
						var wantsVector =
							!!(styleUrl && String(styleUrl).trim()) || !!layerCustomization;
						var mapOpts = {
							location: loc,
							showScaleInCopyrights: true,
							theme: 'light',
						};
						// Кастомизация — векторные тайлы; при mode: 'auto' сначала рисуется растр без стиля
						if (wantsVector) {
							mapOpts.mode = 'vector';
						}
						var map = new YMap(el, mapOpts);
						var schemeLayer = new YMapDefaultSchemeLayer(schemeOpts);
						map.addChild(schemeLayer);
						map.addChild(new YMapDefaultFeaturesLayer({}));
						// Повторная установка кастомизации после attach (на случай гонки с mode)
						if (
							layerCustomization !== undefined &&
							schemeLayer &&
							typeof schemeLayer.update === 'function'
						) {
							queueMicrotask(function () {
								schemeLayer.update({
									customization: layerCustomization,
								});
							});
						}
						if (el.getAttribute('data-yandex-debug') === '1') {
							var blockCount = 0;
							if (Array.isArray(layerCustomization)) {
								blockCount = layerCustomization.length;
							} else if (
								layerCustomization &&
								layerCustomization.style &&
								Array.isArray(layerCustomization.style)
							) {
								blockCount = layerCustomization.style.length;
							}
							console.info('Yandex Maps debug', {
								styleUrl: styleUrl,
								mapMode: mapOpts.mode,
								customizationBlocks: blockCount,
							});
						}

						points.forEach(function (pt) {
							if (!pt || !pt.coordinates) return;
							var markerEl = createPinElement(pinUrl, pt.title);
							map.addChild(
								new YMapMarker(
									{
										coordinates: pt.coordinates,
									},
									markerEl
								)
							);
						});

						return map;
					})
				);
			});

			return Promise.all(inits);
		})
		.catch(function (e) {
			console.warn(e && e.message ? e.message : e);
		});
})();
