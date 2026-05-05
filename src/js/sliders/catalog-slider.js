const sliderSCatalog = document.querySelector('.js--sl-catalog');

if (sliderSCatalog) {
	const sliderSCatalogOffset = document.querySelector('.js--sl-catalog-offset');

	const leftSCatalog = () => {
		if (!sliderSCatalogOffset) return 0;
		return sliderSCatalogOffset.offsetLeft + getScrollbarWidth() / 2;
	};

	const swiperCatalog = new Swiper(sliderSCatalog, {
		loop: false,
		slidesPerView: 'auto',
		freeMode: true,
		// autoHeight: true,
		speed: 1000,
		spaceBetween: 10,
		slidesOffsetBefore: leftSCatalog(),
		slidesOffsetAfter: leftSCatalog(),

		breakpoints: {
			992: {
				spaceBetween: 30,
			},
		},
	});

	const syncOffsets = () => {
		const offset = leftSCatalog();
		swiperCatalog.params.slidesOffsetBefore = offset;
		swiperCatalog.params.slidesOffsetAfter = offset;
		swiperCatalog.update();
		if (swiperCatalog.activeIndex === 0) {
			swiperCatalog.slideTo(0);
		}
	};

	let syncRaf = 0;
	const scheduleSyncOffsets = () => {
		cancelAnimationFrame(syncRaf);
		syncRaf = requestAnimationFrame(syncOffsets);
	};

	window.addEventListener('resize', scheduleSyncOffsets);
	window.addEventListener('orientationchange', scheduleSyncOffsets);
}
