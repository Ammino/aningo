const sliderReviews = document.querySelector('.js--sl-homerevews');

if (sliderReviews) {
	const sliderReviewsOffset = document.querySelector('.js--sl-homerevews-offset');
	const sliderReviewsAside = document.querySelector('.js--sl-homerevews-aside');

	const halfScrollbar = () => getScrollbarWidth() / 2;

	const rawSideOffset = () => {
		if (!sliderReviewsOffset) return 0;
		return sliderReviewsOffset.getBoundingClientRect().left;
	};

	const sideOffset = () => {
		return rawSideOffset() + halfScrollbar();
	};

	const leftReviews = () => {
		if (window.innerWidth > 991) return 0;
		if (!sliderReviewsOffset) return 0;
		return sideOffset();
	};

	const rightReviews = () => {
		if (!sliderReviewsOffset) return 0;
		return sideOffset();
	};

	const setSliderWidth = () => {
		if (window.innerWidth <= 991) {
			sliderReviews.style.width = '';
			return;
		}

		const left = rawSideOffset();
		const asideWidth = sliderReviewsAside ? sliderReviewsAside.getBoundingClientRect().width : 0;
		const width = window.innerWidth - left - asideWidth - 30 - halfScrollbar();
		const appliedWidth = Math.max(0, Math.floor(width));
		sliderReviews.style.width = `${appliedWidth}px`;
	};

	const swiperReviews = new Swiper(sliderReviews, {
		loop: false,
		slidesPerView: 'auto',
		autoHeight: true,
		speed: 1000,
		spaceBetween: 10,
		slidesOffsetBefore: leftReviews(),
		slidesOffsetAfter: rightReviews(),

		breakpoints: {
			992: {
                freeMode: true,
				spaceBetween: 30, 
				slidesOffsetBefore: 0,
                slidesOffsetAfter: rightReviews(),
			},
		},
	});

	const syncOffsets = () => {
		setSliderWidth();

		const before = leftReviews();
		const after = rightReviews();

		swiperReviews.params.slidesOffsetBefore = before;
		swiperReviews.params.slidesOffsetAfter = after;
		swiperReviews.originalParams.slidesOffsetBefore = before;
		swiperReviews.originalParams.slidesOffsetAfter = after;

		swiperReviews.update();
		if (swiperReviews.activeIndex === 0) {
			swiperReviews.slideTo(0);
		}
	};

	let syncRaf = 0;
	const scheduleSyncOffsets = () => {
		cancelAnimationFrame(syncRaf);
		syncRaf = requestAnimationFrame(syncOffsets);
	};

	window.addEventListener('resize', scheduleSyncOffsets);
	window.addEventListener('orientationchange', scheduleSyncOffsets);

	if ('ResizeObserver' in window) {
		const ro = new ResizeObserver(scheduleSyncOffsets);
		if (sliderReviewsOffset) ro.observe(sliderReviewsOffset);
		if (sliderReviewsAside) ro.observe(sliderReviewsAside);
	}

	scheduleSyncOffsets();
}
