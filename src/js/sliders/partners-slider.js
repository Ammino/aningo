const sliderPartners = document.querySelector('.js--sl-partners');

if (sliderPartners) {
	const setLinearTiming = (swiper) => {
		// Swiper uses ease by default; for marquee we need linear motion
		if (swiper?.wrapperEl) swiper.wrapperEl.style.transitionTimingFunction = 'linear';
	};

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
			delay: 0,
			disableOnInteraction: false,
			waitForTransition: false,
			pauseOnMouseEnter: true,
		},
		on: {
			init(swiper) {
				setLinearTiming(swiper);
			},
			resize(swiper) {
				setLinearTiming(swiper);
			},
		},

		breakpoints: {
			992: {
				spaceBetween: 30,
			},
		},
	})

	swiperPartners.init();

	// Re-apply linear timing after loop fixes / updates
	setLinearTiming(swiperPartners);
	swiperPartners.on('transitionEnd', () => setLinearTiming(swiperPartners));
	swiperPartners.on('slideChangeTransitionEnd', () => setLinearTiming(swiperPartners));
}