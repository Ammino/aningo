const sliderCategory = document.querySelector('.js--sl-category');

if (sliderCategory) {
	const sliderCategoryOffset = document.querySelector('.js--sl-category-offset');

	const leftCategory = () => {
		if (!sliderCategoryOffset) return 0;
		return sliderCategoryOffset.offsetLeft + getScrollbarWidth() / 2;
	};

	const swiperCatalog = new Swiper(sliderCategory, {
		loop: false,
		slidesPerView: 'auto',
		freeMode: true,
		// autoHeight: true,
		speed: 1000,
		spaceBetween: 10,
		slidesOffsetBefore: leftCategory(),
		slidesOffsetAfter: leftCategory(),

		breakpoints: {
			992: {
				spaceBetween: 30,
			},
		},
	});

	const syncOffsets = () => {
		const offset = leftCategory();
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
