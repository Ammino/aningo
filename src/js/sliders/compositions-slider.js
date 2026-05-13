document.querySelectorAll('.js--sl-compositions').forEach((root) => {
	const thumbsEl = root.querySelector('.js--sl-compositions-thumbs');
	const imagesEl = root.querySelector('.js--sl-compositions-images');
	const thumbsOffsetEl = root.querySelector('.js--sl-compositions-thumbs__offset');

	if (!thumbsEl || !imagesEl) return;

	const scrollbarHalf =
		typeof getScrollbarWidth === 'function' ? getScrollbarWidth() / 2 : 0;

	const getThumbsSlidesOffset = () => {
		if (window.matchMedia('(min-width: 992px)').matches) return 0;
		const el = thumbsOffsetEl || thumbsEl;
		const sidePx = Math.max(0, Math.round(el.getBoundingClientRect().left));
		return sidePx + scrollbarHalf;
	};

	const swiperCompositionsThumbs = new Swiper(thumbsEl, {
		loop: false,
		slidesPerView: 'auto',
		spaceBetween: 10,
		autoHeight: true,
		watchSlidesProgress: true,
		watchOverflow: true,
		slideToClickedSlide: true,
		slidesOffsetBefore: getThumbsSlidesOffset(),
		slidesOffsetAfter: getThumbsSlidesOffset(),
		breakpoints: {
			992: {
				spaceBetween: 30,
				slidesOffsetBefore: 0,
				slidesOffsetAfter: 0,
			},
		},
	});

	const swiperCompositionsImages = new Swiper(imagesEl, {
		loop: false,
		slidesPerView: 1,
		autoHeight: true,
		speed: 400,
		effect: 'fade',
		fadeEffect: {
			crossFade: true,
		},
		thumbs: {
			swiper: swiperCompositionsThumbs,
		},
	});

	const syncThumbsOffsets = () => {
		const offset = getThumbsSlidesOffset();
		swiperCompositionsThumbs.params.slidesOffsetBefore = offset;
		swiperCompositionsThumbs.params.slidesOffsetAfter = offset;
		swiperCompositionsThumbs.update();
		swiperCompositionsImages.update();
	};

	let resizeRaf = 0;
	const scheduleSyncOffsets = () => {
		cancelAnimationFrame(resizeRaf);
		resizeRaf = requestAnimationFrame(syncThumbsOffsets);
	};

	window.addEventListener('resize', scheduleSyncOffsets);
	window.addEventListener('orientationchange', scheduleSyncOffsets);
});
