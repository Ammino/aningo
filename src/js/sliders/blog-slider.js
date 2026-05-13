const sliderBlog = document.querySelector('.js--sl-blog');

if (sliderBlog) {
	const sliderBlogOffset = document.querySelector('.js--sl-blog-offset');

	const leftBlog = () => {
		if (!sliderBlogOffset) return 0;
		return sliderBlogOffset.offsetLeft + getScrollbarWidth() / 2;
	};

	const swiperCatalog = new Swiper(sliderBlog, {
		loop: false,
		slidesPerView: 'auto',
		freeMode: true,
		autoHeight: false,
		speed: 1000,
		spaceBetween: 10,
		slidesOffsetBefore: leftBlog(),
		slidesOffsetAfter: leftBlog(),

		breakpoints: {
			992: {
				spaceBetween: 30,
			},
		},
	});

	const syncOffsets = () => {
		const offset = leftBlog();
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
