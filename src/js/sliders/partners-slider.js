const sliderPartners = document.querySelector('.js--sl-partners');

function getCurrentTranslate(swiper) {
	const t = getComputedStyle(swiper.wrapperEl).transform;
	if (!t || t === 'none') return 0;
	const m = new DOMMatrixReadOnly(t);
	return swiper.isHorizontal() ? m.m41 : m.m42;
}

if (sliderPartners) {
	let swiperPartners = new Swiper(sliderPartners, {
		init: false,
		loop: true,
		loopAdditionalSlides: 10,
		loopPreventsSliding: false,
		slidesPerView: 'auto',
		autoHeight: true,
		speed: 7000,
		spaceBetween: 10,
		allowTouchMove: true,
		grabCursor: true,
		autoplay: {
			delay: 1,
			disableOnInteraction: false,
			waitForTransition: false,
			pauseOnMouseEnter: false,
		},

		breakpoints: {
			992: {
				spaceBetween: 30,
			},
		},
	})

	swiperPartners.init();

	sliderPartners.addEventListener('pointerenter', () => {
		const current = getCurrentTranslate(swiperPartners);

		swiperPartners.autoplay.stop();

		swiperPartners.setTransition(0);
		swiperPartners.setTranslate(current);

		swiperPartners.animating = false;
		if (typeof swiperPartners.transitionEnd === 'function') {
			swiperPartners.transitionEnd();
		}

		swiperPartners.updateProgress();
		swiperPartners.updateActiveIndex();
		swiperPartners.updateSlidesClasses();
	});

	sliderPartners.addEventListener('pointerleave', () => {
		swiperPartners.autoplay.start();
	});
}