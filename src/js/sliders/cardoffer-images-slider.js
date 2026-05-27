const CARDOFFER_IMAGES_SELECTOR = '.js--sl-cardofferimages';

function getCardofferImagesControls(sliderEl) {
	const host = sliderEl.closest('.cardoffer__img') || sliderEl.parentElement;

	return {
		prevEl: sliderEl.querySelector('.js--sl-cardofferimages-prev'),
		nextEl: sliderEl.querySelector('.js--sl-cardofferimages-next'),
		paginationEl: host?.querySelector('.js--sl-cardofferimages-pagination'),
	};
}

function toggleCardofferImagesControls(sliderEl, visible) {
	const { prevEl, nextEl, paginationEl } = getCardofferImagesControls(sliderEl);
	const nav = sliderEl.querySelector('.cardoffer__img__slider__nav');

	if (nav) nav.classList.toggle('d-none', !visible);
	if (paginationEl) paginationEl.classList.toggle('d-none', !visible);
	if (prevEl) prevEl.disabled = !visible;
	if (nextEl) nextEl.disabled = !visible;
}

function initCardofferImagesSwiper(sliderEl) {
	if (!sliderEl || sliderEl.swiper) return null;

	const slideCount = sliderEl.querySelectorAll('.swiper-slide').length;
	if (slideCount <= 1) {
		toggleCardofferImagesControls(sliderEl, false);
		return null;
	}

	const { prevEl, nextEl, paginationEl } = getCardofferImagesControls(sliderEl);
	if (!prevEl || !nextEl || !paginationEl) return null;

	toggleCardofferImagesControls(sliderEl, true);

	const swiper = new Swiper(sliderEl, {
		loop: false,
		slidesPerView: 1,
		speed: 400,
		effect: 'fade',
		fadeEffect: {
			crossFade: true,
		},
		watchOverflow: true,
		observer: true,
		observeParents: true,
		navigation: {
			prevEl,
			nextEl,
			disabledClass: 'disabled',
		},
		pagination: {
			el: paginationEl,
			clickable: true,
			bulletActiveClass: 'active',
		},
	});

	requestAnimationFrame(() => {
		swiper.update();
	});

	return swiper;
}

function initCardofferImagesSwipers(searchRoot) {
	const root = searchRoot?.querySelector ? searchRoot : document;
	root.querySelectorAll(CARDOFFER_IMAGES_SELECTOR).forEach(initCardofferImagesSwiper);
}

function updateCardofferImagesSwipers(searchRoot) {
	const root = searchRoot?.querySelector ? searchRoot : document;
	root.querySelectorAll(`${CARDOFFER_IMAGES_SELECTOR}.swiper-initialized`).forEach((sliderEl) => {
		sliderEl.swiper?.update();
	});
}

function scheduleCardofferImagesInit(searchRoot) {
	requestAnimationFrame(() => {
		const root = searchRoot?.querySelector ? searchRoot : document;
		initCardofferImagesSwipers(root);
		updateCardofferImagesSwipers(root);
	});
}

scheduleCardofferImagesInit(document);

window.addEventListener('resize', () => {
	updateCardofferImagesSwipers(document);
});

if ('MutationObserver' in window) {
	const cardofferImagesObserver = new MutationObserver((mutations) => {
		mutations.forEach((mutation) => {
			mutation.addedNodes.forEach((node) => {
				if (!(node instanceof Element)) return;

				if (node.matches?.(CARDOFFER_IMAGES_SELECTOR)) {
					scheduleCardofferImagesInit(node.parentElement || node);
					return;
				}

				if (node.querySelector?.(CARDOFFER_IMAGES_SELECTOR)) {
					scheduleCardofferImagesInit(node);
				}
			});
		});
	});

	cardofferImagesObserver.observe(document.body, { childList: true, subtree: true });
}
