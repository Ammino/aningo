const sliderProjects = document.querySelector('.js--sl-projects');

if (sliderProjects) {
	const sliderProjectsOffset = document.querySelector('.js--sl-projects-offset');

	const leftProjects = () => {
		if (!sliderProjectsOffset) return 0;
		return sliderProjectsOffset.offsetLeft + getScrollbarWidth() / 2;
	};

	const swiperProjects = new Swiper(sliderProjects, {
		loop: false,
		slidesPerView: 'auto',
		freeMode: true,
		autoHeight: true,
		speed: 1000,
		spaceBetween: 10,
		slidesOffsetBefore: leftProjects(),
		slidesOffsetAfter: leftProjects(),

		breakpoints: {
			992: {
				spaceBetween: 30,
			},
		},
	});

	const syncOffsets = () => {
		const offset = leftProjects();
		swiperProjects.params.slidesOffsetBefore = offset;
		swiperProjects.params.slidesOffsetAfter = offset;
		swiperProjects.update();
		if (swiperProjects.activeIndex === 0) {
			swiperProjects.slideTo(0);
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
