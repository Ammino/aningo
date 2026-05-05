function initOffersSwiper(searchRoot) {
	const root = searchRoot && typeof searchRoot.querySelector === 'function' ? searchRoot : document;
	const sliderOffers = root.querySelector('.js--slider-offers');
	if (!sliderOffers || sliderOffers.swiper) return;

	const nextEl = sliderOffers.querySelector('.js--slider-offers-next');
	const prevEl = sliderOffers.querySelector('.js--slider-offers-prev');
	if (!nextEl || !prevEl) return;

	const swiper = new Swiper(sliderOffers, {
		loop: false,
		slidesPerView: 1,
		slidesPerGroup: 1,
		spaceBetween: 10,
		autoHeight: true,
		navigation: {
			nextEl,
			prevEl,
		},
	});

	requestAnimationFrame(() => {
		swiper.update();
	});
}

function destroyOffersSwiper() {
	const el = document.querySelector('.js--slider-offers');
	if (el?.swiper) {
		el.swiper.destroy(true, true);
	}
}

if (typeof Fancybox !== 'undefined') {
	Fancybox.bind('[data-fancybox-offers]', {
		showClass: 'fancy-modal-show',
		hideClass: 'fancy-modal-hide',
		autoFocus: false,
		mainClass: 'fancy-modaldefault',
		closeButton: false,
		dragToClose: false,
		hideScrollbar: true,
		zoomEffect: false,
		on: {
			ready: () => {
				if (document.querySelector('.js--nheader')) {
					document.querySelector('.js--nheader').style.paddingRight = getScrollbarWidth();
				}
			},
			destroy: () => {
				if (typeof window.teardownFancyModalSwipeLast === 'function') {
					window.teardownFancyModalSwipeLast();
					window.teardownFancyModalSwipeLast = null;
				}
				if (document.querySelector('.js--nheader')) {
					document.querySelector('.js--nheader').style.paddingRight = null;
				}
				destroyOffersSwiper();
			},
			done: (fancybox, slide) => {
				if (typeof window.attachFancyModalSwipeToSlide === 'function') {
					window.attachFancyModalSwipeToSlide(fancybox, slide);
				}
				const root = slide?.el || fancybox?.container;
				initOffersSwiper(root);
			},
		},
	});
}
